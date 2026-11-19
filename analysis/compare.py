"""对比两份分类结果。两份文件都要有 app_id 和 primary_class。"""

import json
import sys
from collections import Counter
from pathlib import Path


def load(path: Path) -> dict[str, str]:
    found = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        row = json.loads(line)
        found[str(row["app_id"])] = row["primary_class"]
    return found


def main() -> None:
    left = load(Path(sys.argv[1]))
    right = load(Path(sys.argv[2]))
    keys = sorted(set(left) & set(right))
    same = sum(left[key] == right[key] for key in keys)
    confusion: Counter[tuple[str, str]] = Counter()
    for key in keys:
        if left[key] != right[key]:
            confusion[(left[key], right[key])] += 1
    print(f"两边都有 {len(keys)} 款，一致 {same}，一致率 {same / len(keys):.3f}" if keys else "没有可对比的游戏")
    for pair, count in confusion.most_common(12):
        print(f"{pair[0]} -> {pair[1]} {count}")


if __name__ == "__main__":
    main()
