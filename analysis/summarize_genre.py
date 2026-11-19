"""把类型分类结果汇总成 genre_summary.md。用法：python3 summarize_genre.py"""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

from taxonomy import GENRES

HERE = Path(__file__).parent
AI_USE = {
    "runtime_play": "运行时玩法",
    "production_asset": "开发期素材",
    "storefront_only": "仅商店宣传",
    "unspecified": "未能归类",
}


def load(name: str) -> list[dict]:
    return [json.loads(line) for line in (HERE / name).read_text(encoding="utf-8").splitlines() if line.strip()]


def table(counter: Counter, total: int, names: dict | None = None) -> list[str]:
    lines = ["| 值 | 款数 | 占比 |", "| --- | ---: | ---: |"]
    for key, count in counter.most_common():
        label = names.get(key, key) if names else key
        lines.append(f"| {label} | {count} | {100 * count / total:.1f}% |")
    return lines


def main() -> None:
    rows = load("genre_a_tags.jsonl")
    ai = {str(row["app_id"]): row["primary_class"] for row in load("pass_a_rules.jsonl")}
    total = len(rows)
    out = [
        "# 类型分类汇总（规则运行，只用 Steam 标签）",
        "",
        f"共 {total} 款，都是 2026 年 10 月新品节里写了 AI 披露的游戏。由 `taxonomy.py` 生成，规则版本 steam-tags-rules-v1。",
        "多选维度的百分比加起来会超过 100%。某个维度为空只表示该游戏排名前 12 的标签里没有，不表示游戏没有这个特征。",
        "",
        "## 主类型（互斥）",
        "",
        *table(Counter(row["primary_genre"] for row in rows), total, GENRES),
    ]
    for field, title in [
        ("mechanics", "玩法机制（多选）"),
        ("theme", "题材与氛围（多选）"),
        ("visual", "视觉风格（多选）"),
        ("dimension", "2D / 3D（多选）"),
        ("viewpoint", "视角（多选）"),
    ]:
        counter = Counter(value for row in rows for value in row[field])
        empty = sum(1 for row in rows if not row[field])
        out += ["", f"## {title}", "", *table(counter, total), "", f"前 12 个标签里没有这一维度的：{empty} 款。"]
    out += ["", "## 人数模式（互斥，取最强的一项）", "", *table(Counter(row["player_mode"] for row in rows), total)]

    genres = [genre for genre, _ in Counter(row["primary_genre"] for row in rows).most_common()]
    uses = list(AI_USE)
    cross = Counter((row["primary_genre"], ai.get(str(row["app_id"]), "unspecified")) for row in rows)
    out += [
        "",
        "## 主类型 × AI 用途",
        "",
        "AI 用途来自 `pass_a_rules.jsonl`（第一次规则运行），还没有经过第二个模型核对。",
        "",
        "| 主类型 | " + " | ".join(AI_USE[use] for use in uses) + " | 运行时占比 |",
        "| --- | " + " | ".join("---:" for _ in uses) + " | ---: |",
    ]
    for genre in genres:
        counts = [cross[(genre, use)] for use in uses]
        size = sum(counts)
        out.append(f"| {GENRES.get(genre, genre)} | " + " | ".join(str(count) for count in counts) + f" | {100 * counts[0] / size:.1f}% |")
    (HERE / "genre_summary.md").write_text("\n".join(out) + "\n", encoding="utf-8")
    print("写入 genre_summary.md")


if __name__ == "__main__":
    main()
