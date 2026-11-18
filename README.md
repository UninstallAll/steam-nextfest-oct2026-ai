# 2026 年 10 月 Steam 新品节：写了 AI 披露的游戏

这里只有商店页写了 “AI Generated Content Disclosure” 的新品节游戏，共 2550 款。整套采集系统和其余游戏不在这个仓库里。

`games.jsonl` 是游戏资料。`index.html` 是浏览页，有列表和翻阅。方向键换一款，数字键 1–5 打分，0 清除，Enter 打开 Steam 原始页。

## 多人打分怎么同步

每个人的分数写在 `ratings/用户名.json`。A 和 B 各写各的文件，不会互相覆盖。页面大约每 20 秒拉取一次，平均分和每个人的星星会跟着变。

仓库是私有的。要一起打分的人需要：

1. 被加为这个仓库的协作者。
2. 在 GitHub 建一个只针对本仓库的 token，权限选 Contents 的读和写。
3. 打开浏览页，点「登录 GitHub」，把 token 贴进去。

本地看页面：

```bash
python3 -m http.server 8766
```

然后打开 http://127.0.0.1:8766 。游戏名单来自同目录的 `games.jsonl`，分数走 GitHub。

商店页不公开销量，所以没有销量数字。价格是抓取时的标价，单位是分。

来源页面：https://store.steampowered.com/sale/nextfest_oct2026
