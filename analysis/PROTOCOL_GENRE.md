# 类型分类说明（给第二个模型）

你要给 2550 款 Steam 游戏分类。按类型、玩法、题材、视觉、视角、人数这几个维度分，不按发售状态，也不按 AI 怎么用。

## 输入

`genre_input.jsonl`，每行一款，字段是 `app_id`、`title`、`short_description`、`tags`。`tags` 是 Steam 商店页排名前 12 的标签，按票数从多到少排列。

请结合简介和标签自己判断。不要读 `genre_a_tags.jsonl`，那是另一次运行的结果，读了就不是独立判断了。

## 输出

写到 `genre_b_model.jsonl`，每行一款，字段如下：

```json
{"app_id": "3697300", "primary_genre": "action", "mechanics": ["shooting", "exploration_open_world"], "theme": ["sci_fi_space", "cyberpunk_dystopia"], "visual": [], "viewpoint": ["first_person"], "player_mode": "single", "coder": "模型名称"}
```

只用下面列出的代码。多选维度没有把握就留空数组，不要猜。

## 主类型 `primary_genre`（只选一个）

选玩家玩这款游戏时主要在做的事。同时有几种时，选简介里最突出的那一种。

| 代码 | 含义 |
| --- | --- |
| action | 动作：射击、格斗、平台跳跃、弹幕、动作类肉鸽、类魂 |
| adventure_narrative | 冒险与叙事：视觉小说、互动小说、点击冒险、步行模拟、侦探调查、恋爱模拟 |
| horror | 恐怖：以恐惧为主要体验，不论玩法 |
| rpg | 角色扮演：成长、装备、队伍，包括动作 RPG、JRPG、地牢探索、怪物收集 |
| strategy | 策略与战术：回合制或即时战术、塔防、自走棋、4X、大战略、战棋 |
| simulation_management | 模拟与经营：经营、建造、自动化、城市和殖民地、职业模拟、生活模拟、载具模拟 |
| survival_sandbox | 生存与沙盒：生存、采集合成、开放沙盒 |
| puzzle | 解谜：逻辑、推箱子、三消、找物、文字和打字、编程解谜 |
| card_board | 卡牌与桌游：卡牌对战、构筑、桌游、骰子、扑克、麻将、棋类、博彩 |
| casual_idle | 休闲与放置：放置、点击增长、桌面宠物、派对小游戏、节奏、装饰整理 |
| sports_racing | 体育与竞速 |
| non_game_tool | 工具与教育软件：不是游戏，或主要是学习、创作工具 |

## 玩法机制 `mechanics`（多选）

roguelike、deckbuilding、survival_crafting、building_automation、management_economy、incremental_idle、tower_defense_autobattler、shooting、melee_combat、platforming、turn_based、real_time_tactics、grand_strategy_4x、branching_narrative、investigation、exploration_open_world、stealth、puzzle_solving、physics_destruction、collection、life_romance_sim、job_hobby_sim、vehicles、word_typing_trivia、rhythm_music、party_social、desktop_companion、procedural_generation、customization_editor、dungeon_crawl、gambling_cards

## 题材与氛围 `theme`（多选）

fantasy、dark_fantasy、sci_fi_space、cyberpunk_dystopia、horror、post_apocalyptic_zombie、historical_military、mystery_crime、cozy_cute、comedy、east_asian_myth、mythology、romance、dark_psychological、ai_as_theme（游戏内容本身以人工智能为题材）、modern_everyday、adult

## 视觉风格 `visual`（多选）

pixel_art、anime、realistic、stylized_cartoon、hand_drawn、voxel、minimalist_abstract、retro、cinematic_fmv、text_only

## 视角 `viewpoint`（多选）

first_person、third_person、top_down、side_view、isometric、vr

## 人数 `player_mode`（只选一个）

有对抗多人选 competitive；否则有合作选 coop；否则写了多人但看不出形式选 multiplayer；只有单人选 single；看不出来选 not_tagged。

## 对比

```bash
python3 compare_genre.py genre_a_tags.jsonl genre_b_model.jsonl
```

主类型和人数会给出一致率和 Cohen's kappa，多选维度给出每款 Jaccard 的平均值。
