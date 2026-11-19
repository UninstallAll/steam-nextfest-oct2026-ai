# 给第二个模型的分类规程

不要阅读 `pass_a_rules.jsonl`。那是第一次运行的结果，用来事后对比。打分、星级、人的名字都不要用。

## 输入

读取仓库根目录的 `games.jsonl`。一行一款，共 2550 款。每款只用这四个字段：

- `app_id`
- `title`
- `short_description`
- `ai_disclosure`

`description_zh` 只在英文披露含糊时用来理解句子，不能单独作为分类证据。

## 输出

写到 `analysis/pass_b_model.jsonl`。一行一个 JSON 对象，字段必须是：

```json
{"app_id":"123","title":"...","primary_class":"runtime_play","runtime_play":true,"production_asset":false,"storefront_mention":false,"explicit_not_in_game":false,"coder":"模型名"}
```

`primary_class` 只能是这四个词之一：

- `runtime_play`：披露写明生成发生在游玩过程中，例如实时对话、地下城主、评判玩家输入、运行时生成图像或事件。若句子明确否定运行时生成，不要放进这一类。
- `storefront_only`：只用于封面、胶囊图、宣传片或商店素材，并写明没有用在游戏内。
- `production_asset`：在开发阶段预先生成画面、文本、语音、音乐、代码或本地化，游戏运行时不再生成。
- `unspecified`：有披露，但无法判断落在上面三类。

一款只给一个 `primary_class`。若同时写了开发期素材和运行时生成，主类取 `runtime_play`。四个布尔字段分别记录是否提到该情形，可以同时为真。

## 对比

两边都写完以后，在本目录执行：

```bash
python3 compare.py pass_a_rules.jsonl pass_b_model.jsonl
```
