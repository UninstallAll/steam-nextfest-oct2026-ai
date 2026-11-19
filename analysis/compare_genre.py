"""对比两份类型分类。用法：python3 compare_genre.py genre_a_tags.jsonl genre_b_model.jsonl

主类型和人数模式看一致率和 Cohen's kappa；玩法、题材、视觉、视角这些多选维度看每款的 Jaccard 平均值。
"""

from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

SINGLE = ["primary_genre", "player_mode"]
MULTI = ["mechanics", "theme", "visual", "viewpoint"]


def load(path: Path) -> dict[str, dict]:
    rows = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            row = json.loads(line)
            rows[str(row["app_id"])] = row
    return rows


def kappa(pairs: list[tuple[str, str]]) -> float:
    total = len(pairs)
    observed = sum(a == b for a, b in pairs) / total
    left = Counter(a for a, _ in pairs)
    right = Counter(b for _, b in pairs)
    expected = sum(left[key] * right.get(key, 0) for key in left) / (total * total)
    return 1.0 if expected == 1 else (observed - expected) / (1 - expected)


def jaccard(a: list[str], b: list[str]) -> float:
    left, right = set(a or []), set(b or [])
    if not left and not right:
        return 1.0
    return len(left & right) / len(left | right)


def main() -> None:
    left = load(Path(sys.argv[1]))
    right = load(Path(sys.argv[2]))
    keys = sorted(set(left) & set(right))
    if not keys:
        print("没有可对比的游戏")
        return
    print(f"两边都有 {len(keys)} 款")
    for field in SINGLE:
        pairs = [(left[key].get(field, ""), right[key].get(field, "")) for key in keys]
        same = sum(a == b for a, b in pairs)
        print(f"\n{field}：一致 {same}，一致率 {same / len(pairs):.3f}，kappa {kappa(pairs):.3f}")
        for (a, b), count in Counter(pair for pair in pairs if pair[0] != pair[1]).most_common(10):
            print(f"  {a} -> {b} {count}")
    print()
    for field in MULTI:
        scores = [jaccard(left[key].get(field), right[key].get(field)) for key in keys]
        print(f"{field}：Jaccard 平均 {sum(scores) / len(scores):.3f}")


if __name__ == "__main__":
    main()
