# 类型分类汇总（规则运行，只用 Steam 标签）

共 2550 款，都是 2026 年 10 月新品节里写了 AI 披露的游戏。由 `taxonomy.py` 生成，规则版本 steam-tags-rules-v1。
多选维度的百分比加起来会超过 100%。某个维度为空只表示该游戏排名前 12 的标签里没有，不表示游戏没有这个特征。

## 主类型（互斥）

| 值 | 款数 | 占比 |
| --- | ---: | ---: |
| 动作 | 531 | 20.8% |
| 模拟与经营 | 460 | 18.0% |
| 策略与战术 | 344 | 13.5% |
| 休闲与放置 | 305 | 12.0% |
| 卡牌与桌游 | 244 | 9.6% |
| 冒险与叙事 | 200 | 7.8% |
| 恐怖 | 148 | 5.8% |
| 角色扮演 | 114 | 4.5% |
| 解谜 | 98 | 3.8% |
| 体育与竞速 | 50 | 2.0% |
| 生存与沙盒 | 45 | 1.8% |
| 工具与教育软件 | 11 | 0.4% |

## 玩法机制（多选）

| 值 | 款数 | 占比 |
| --- | ---: | ---: |
| roguelike | 693 | 27.2% |
| management_economy | 650 | 25.5% |
| exploration_open_world | 568 | 22.3% |
| branching_narrative | 409 | 16.0% |
| turn_based | 398 | 15.6% |
| shooting | 379 | 14.9% |
| puzzle_solving | 361 | 14.2% |
| building_automation | 355 | 13.9% |
| incremental_idle | 342 | 13.4% |
| deckbuilding | 326 | 12.8% |
| tower_defense_autobattler | 257 | 10.1% |
| survival_crafting | 248 | 9.7% |
| life_romance_sim | 234 | 9.2% |
| investigation | 233 | 9.1% |
| collection | 223 | 8.7% |
| job_hobby_sim | 220 | 8.6% |
| gambling_cards | 211 | 8.3% |
| platforming | 209 | 8.2% |
| vehicles | 193 | 7.6% |
| physics_destruction | 177 | 6.9% |
| customization_editor | 144 | 5.6% |
| real_time_tactics | 138 | 5.4% |
| procedural_generation | 137 | 5.4% |
| party_social | 130 | 5.1% |
| melee_combat | 126 | 4.9% |
| dungeon_crawl | 119 | 4.7% |
| grand_strategy_4x | 107 | 4.2% |
| word_typing_trivia | 63 | 2.5% |
| desktop_companion | 54 | 2.1% |
| stealth | 53 | 2.1% |
| rhythm_music | 36 | 1.4% |

前 12 个标签里没有这一维度的：30 款。

## 题材与氛围（多选）

| 值 | 款数 | 占比 |
| --- | ---: | ---: |
| cozy_cute | 640 | 25.1% |
| fantasy | 367 | 14.4% |
| dark_psychological | 344 | 13.5% |
| horror | 308 | 12.1% |
| comedy | 302 | 11.8% |
| sci_fi_space | 292 | 11.5% |
| mystery_crime | 279 | 10.9% |
| historical_military | 195 | 7.6% |
| modern_everyday | 160 | 6.3% |
| dark_fantasy | 146 | 5.7% |
| post_apocalyptic_zombie | 96 | 3.8% |
| cyberpunk_dystopia | 95 | 3.7% |
| romance | 59 | 2.3% |
| ai_as_theme | 55 | 2.2% |
| east_asian_myth | 30 | 1.2% |
| mythology | 25 | 1.0% |
| adult | 9 | 0.4% |

前 12 个标签里没有这一维度的：520 款。

## 视觉风格（多选）

| 值 | 款数 | 占比 |
| --- | ---: | ---: |
| stylized_cartoon | 495 | 19.4% |
| pixel_art | 377 | 14.8% |
| retro | 182 | 7.1% |
| minimalist_abstract | 128 | 5.0% |
| anime | 116 | 4.5% |
| realistic | 96 | 3.8% |
| text_only | 77 | 3.0% |
| hand_drawn | 70 | 2.7% |
| cinematic_fmv | 43 | 1.7% |
| voxel | 20 | 0.8% |

前 12 个标签里没有这一维度的：1283 款。

## 2D / 3D（多选）

| 值 | 款数 | 占比 |
| --- | ---: | ---: |
| 2d | 1066 | 41.8% |
| 3d | 786 | 30.8% |
| 2_5d | 66 | 2.6% |

前 12 个标签里没有这一维度的：721 款。

## 视角（多选）

| 值 | 款数 | 占比 |
| --- | ---: | ---: |
| first_person | 388 | 15.2% |
| top_down | 365 | 14.3% |
| side_view | 217 | 8.5% |
| third_person | 150 | 5.9% |
| isometric | 76 | 3.0% |
| vr | 10 | 0.4% |

前 12 个标签里没有这一维度的：1457 款。

## 人数模式（互斥，取最强的一项）

| 值 | 款数 | 占比 |
| --- | ---: | ---: |
| not_tagged | 1303 | 51.1% |
| single | 637 | 25.0% |
| coop | 297 | 11.6% |
| competitive | 267 | 10.5% |
| multiplayer | 46 | 1.8% |

## 主类型 × AI 用途

AI 用途来自 `pass_a_rules.jsonl`（第一次规则运行），还没有经过第二个模型核对。

| 主类型 | 运行时玩法 | 开发期素材 | 仅商店宣传 | 未能归类 | 运行时占比 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 动作 | 3 | 475 | 0 | 53 | 0.6% |
| 模拟与经营 | 8 | 407 | 0 | 45 | 1.7% |
| 策略与战术 | 8 | 307 | 1 | 28 | 2.3% |
| 休闲与放置 | 9 | 260 | 0 | 36 | 3.0% |
| 卡牌与桌游 | 3 | 219 | 0 | 22 | 1.2% |
| 冒险与叙事 | 5 | 182 | 0 | 13 | 2.5% |
| 恐怖 | 3 | 131 | 0 | 14 | 2.0% |
| 角色扮演 | 0 | 99 | 0 | 15 | 0.0% |
| 解谜 | 1 | 90 | 0 | 7 | 1.0% |
| 体育与竞速 | 1 | 46 | 0 | 3 | 2.0% |
| 生存与沙盒 | 0 | 40 | 0 | 5 | 0.0% |
| 工具与教育软件 | 0 | 11 | 0 | 0 | 0.0% |
