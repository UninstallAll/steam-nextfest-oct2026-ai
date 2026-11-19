"""按披露原文做第一遍规则分类。另一模型应只读 PROTOCOL.md，不要读本文件的结果。"""

import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "games.jsonl"
OUTPUT = Path(__file__).resolve().parent / "pass_a_rules.jsonl"

RUNTIME = re.compile(
    r"live[- ]generat|generat\w*.{0,48}during gameplay|during gameplay.{0,48}generat|"
    r"at runtime|in real[- ]time|while playing|"
    r"实时生成|运行时|游玩时|游戏过程中.{0,12}生成|生成.{0,12}游戏过程",
    re.I,
)
NEGATION = re.compile(
    r"nothing|not|no|never|without|does not|doesn't|不会|不实时|不会实时|不会在",
    re.I,
)
NOT_IN_GAME = re.compile(
    r"not in(?: the)? game|only for (?:the )?(?:cover|capsule|store)|不在游戏内|仅用于封面|只用于封面",
    re.I,
)
STORE = re.compile(
    r"cover|capsule|thumbnail|promotional|marketing|store page|trailer|宣传|封面|胶囊",
    re.I,
)
PRODUCTION = re.compile(
    r"pre-generated|visual|art|texture|image|audio|voice|music|sound|locali[sz]ation|translation|"
    r"code|script|dialogue|text|预先生成|美术|配音|音乐|文本|代码|本地化",
    re.I,
)


def _hits(pattern: re.Pattern[str], text: str) -> list[re.Match[str]]:
    return list(pattern.finditer(text))


def _any_not_negated(matches: list[re.Match[str]], text: str) -> bool:
    for match in matches:
        window = text[max(0, match.start() - 140) : match.start()]
        if not NEGATION.search(window):
            return True
    return False


def classify(text: str) -> dict:
    body = text or ""
    runtime_hits = _hits(RUNTIME, body)
    runtime = _any_not_negated(runtime_hits, body)
    not_in_game = bool(NOT_IN_GAME.search(body))
    store = bool(STORE.search(body))
    production = bool(PRODUCTION.search(body))
    if runtime:
        primary = "runtime_play"
    elif not_in_game and not production:
        primary = "storefront_only"
    elif production or store:
        primary = "production_asset"
    else:
        primary = "unspecified"
    return {
        "primary_class": primary,
        "runtime_play": runtime,
        "production_asset": production,
        "storefront_mention": store,
        "explicit_not_in_game": not_in_game,
        "evidence": "ai_disclosure",
        "coder": "pass_a_rules",
    }


def main() -> None:
    rows = [json.loads(line) for line in SOURCE.read_text(encoding="utf-8").splitlines() if line.strip()]
    counts: Counter[str] = Counter()
    with OUTPUT.open("w", encoding="utf-8") as handle:
        for row in rows:
            label = classify(row.get("ai_disclosure") or "")
            label["app_id"] = str(row["app_id"])
            label["title"] = row.get("title") or ""
            counts[label["primary_class"]] += 1
            handle.write(json.dumps(label, ensure_ascii=False) + "\n")
    print(len(rows))
    for key, value in counts.most_common():
        print(f"{key} {value}")


if __name__ == "__main__":
    main()
