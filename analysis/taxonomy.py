"""按类型、玩法、视觉、视角、题材、人数给游戏分类，只用 Steam 商店页标签。

标签顺序就是商店页的顺序，越靠前票数越多，所以主类型按位置加权：第 1 个标签记 12 分，
第 12 个记 1 分。Action、Adventure 这类大词只记一半，免得盖过更具体的子类型。
Steam 把恐怖当题材，这里把它也当一个主类型，因为游戏研究里通常这样看。

数据里只有每款排名前 12 的标签，所以某个维度为空只表示前 12 个标签里没有，不表示游戏没有这个特征。

用法：python3 taxonomy.py ../games.jsonl genre_a_tags.jsonl
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

GENRES = {
    "action": "动作",
    "adventure_narrative": "冒险与叙事",
    "horror": "恐怖",
    "rpg": "角色扮演",
    "strategy": "策略与战术",
    "simulation_management": "模拟与经营",
    "survival_sandbox": "生存与沙盒",
    "puzzle": "解谜",
    "card_board": "卡牌与桌游",
    "casual_idle": "休闲与放置",
    "sports_racing": "体育与竞速",
    "non_game_tool": "工具与教育软件",
}

BROAD = {"Action", "Adventure", "RPG", "Strategy", "Simulation", "Puzzle", "Casual", "Arcade", "Story Rich", "Sports"}

GENRE_TAGS = {
    "action": [
        "Action", "Arcade", "Shooter", "FPS", "Third-Person Shooter", "Top-Down Shooter", "Arena Shooter",
        "Twin Stick Shooter", "Shoot 'Em Up", "Bullet Hell", "Bullet Heaven", "Hack and Slash", "Beat 'em up",
        "Platformer", "2D Platformer", "3D Platformer", "Precision Platformer", "Fighting", "2D Fighter",
        "3D Fighter", "Spectacle fighter", "Character Action Game", "Souls-like", "Metroidvania",
        "Action Roguelike", "Looter Shooter", "Extraction Shooter", "Battle Royale", "Hero Shooter",
        "Boomer Shooter", "On-Rails Shooter", "Runner", "Parkour", "Action-Adventure", "Boss Rush",
        "Stealth", "Score Attack", "Vehicular Combat",
    ],
    "adventure_narrative": [
        "Adventure", "Story Rich", "Visual Novel", "Interactive Fiction", "Choose Your Own Adventure",
        "Point & Click", "Walking Simulator", "Text-Based", "Detective", "Investigation", "Dating Sim",
        "Otome", "FMV", "Narrative",
    ],
    "horror": ["Horror", "Psychological Horror", "Survival Horror"],
    "rpg": [
        "RPG", "Action RPG", "JRPG", "CRPG", "Party-Based RPG", "Dungeon Crawler", "MMORPG",
        "Creature Collector", "Traditional Roguelike", "Mystery Dungeon",
    ],
    "strategy": [
        "Strategy", "Turn-Based Strategy", "Turn-Based Tactics", "RTS", "Real Time Tactics", "Grand Strategy",
        "4X", "Wargame", "Tower Defense", "Auto Battler", "Tactical", "Action RTS", "MOBA", "Diplomacy",
        "Strategy RPG", "Tactical RPG", "Real-Time with Pause",
    ],
    "simulation_management": [
        "Simulation", "Management", "Resource Management", "Economy", "Life Sim", "Building", "Base Building",
        "Automation", "City Builder", "Colony Sim", "Time Management", "Shop Keeper", "Job Simulator",
        "Farming Sim", "Cooking", "Cleaning", "Space Sim", "Automobile Sim", "Political Sim", "Medical Sim",
        "Hobby Sim", "Immersive Sim", "Capitalism", "Trading", "God Game", "Outbreak Sim", "Flight",
        "Fishing", "Hunting", "Farming", "Agriculture", "Transportation", "Trains", "Sailing",
    ],
    "survival_sandbox": ["Survival", "Open World Survival Craft", "Crafting", "Sandbox"],
    "puzzle": [
        "Puzzle", "Logic", "Puzzle Platformer", "Match 3", "Sokoban", "Falling Blocks", "Word Game", "Spelling",
        "Typing", "Trivia", "Hidden Object", "Escape Room", "Programming",
    ],
    "card_board": [
        "Card Game", "Card Battler", "Deckbuilding", "Roguelike Deckbuilder", "Trading Card Game", "Tabletop",
        "Board Game", "Dice", "Poker", "Solitaire", "Mahjong", "Chess", "Gambling",
    ],
    "casual_idle": [
        "Casual", "Incremental", "Idler", "Desktop Companion", "Party Game", "Minigames", "Party", "Organizing",
        "Decorating", "Pinball", "Rhythm", "Music",
    ],
    "sports_racing": [
        "Sports", "Racing", "Driving", "Combat Racing", "Football (Soccer)", "Football (American)", "Basketball",
        "Baseball", "Volleyball", "Golf", "Billiards", "Boxing", "Wrestling", "BMX", "Bikes", "Cycling",
        "Motocross", "Motorbike", "Offroad", "Skating", "Skateboarding", "Skiing", "eSports",
    ],
    "non_game_tool": [
        "Utilities", "Software", "Design & Illustration", "Animation & Modeling", "Audio Production",
        "Photo Editing", "Video Production", "Game Development", "Education", "Language Learning",
    ],
}

FACETS = {
    "mechanics": {
        "roguelike": ["Roguelike", "Roguelite", "Action Roguelike", "Roguelike Deckbuilder", "Traditional Roguelike", "Perma Death", "Mystery Dungeon"],
        "deckbuilding": ["Deckbuilding", "Card Battler", "Roguelike Deckbuilder", "Trading Card Game", "Card Game"],
        "survival_crafting": ["Survival", "Crafting", "Open World Survival Craft"],
        "building_automation": ["Building", "Base Building", "Automation", "City Builder", "Colony Sim", "God Game"],
        "management_economy": ["Management", "Resource Management", "Economy", "Capitalism", "Trading", "Shop Keeper", "Time Management", "Inventory Management"],
        "incremental_idle": ["Incremental", "Idler"],
        "tower_defense_autobattler": ["Tower Defense", "Auto Battler"],
        "shooting": ["Shooter", "FPS", "Third-Person Shooter", "Top-Down Shooter", "Arena Shooter", "Twin Stick Shooter", "Shoot 'Em Up", "Bullet Hell", "Bullet Heaven", "Looter Shooter", "Extraction Shooter", "Hero Shooter", "Boomer Shooter", "On-Rails Shooter", "Battle Royale"],
        "melee_combat": ["Hack and Slash", "Beat 'em up", "Fighting", "2D Fighter", "3D Fighter", "Spectacle fighter", "Souls-like", "Swordplay", "Martial Arts", "Character Action Game"],
        "platforming": ["Platformer", "2D Platformer", "3D Platformer", "Precision Platformer", "Puzzle Platformer", "Metroidvania", "Runner", "Parkour"],
        "turn_based": ["Turn-Based Strategy", "Turn-Based Tactics", "Turn-Based Combat", "Turn-Based", "Grid-Based Movement", "Hex Grid"],
        "real_time_tactics": ["RTS", "Real Time Tactics", "Action RTS", "MOBA", "Real-Time with Pause"],
        "grand_strategy_4x": ["Grand Strategy", "4X", "Wargame", "Diplomacy", "Political Sim"],
        "branching_narrative": ["Choices Matter", "Multiple Endings", "Choose Your Own Adventure", "Interactive Fiction", "Visual Novel", "Dynamic Narration", "Dialogue Heavy", "Nonlinear"],
        "investigation": ["Detective", "Investigation", "Hidden Object", "Escape Room", "Point & Click"],
        "exploration_open_world": ["Exploration", "Open World", "Sandbox", "Walking Simulator"],
        "stealth": ["Stealth", "Heist", "Assassins"],
        "puzzle_solving": ["Puzzle", "Logic", "Puzzle Platformer", "Match 3", "Sokoban", "Falling Blocks", "Programming"],
        "physics_destruction": ["Physics", "Destruction"],
        "collection": ["Creature Collector", "Collectathon", "Loot"],
        "life_romance_sim": ["Life Sim", "Dating Sim", "Romance", "Otome", "Farming Sim", "Farming", "Agriculture"],
        "job_hobby_sim": ["Job Simulator", "Cleaning", "Cooking", "Medical Sim", "Hobby Sim", "Fishing", "Hunting", "Mining"],
        "vehicles": ["Driving", "Racing", "Flight", "Automobile Sim", "Vehicular Combat", "Combat Racing", "Sailing", "Naval", "Naval Combat", "Trains", "Transportation", "Space Sim", "Tanks", "Mechs", "Spaceships", "Submarine"],
        "word_typing_trivia": ["Word Game", "Typing", "Spelling", "Trivia"],
        "rhythm_music": ["Rhythm", "Music", "Music-Based Procedural Generation"],
        "party_social": ["Party Game", "Social Deduction", "Minigames", "Party"],
        "desktop_companion": ["Desktop Companion"],
        "procedural_generation": ["Procedural Generation", "Music-Based Procedural Generation"],
        "customization_editor": ["Character Customization", "Gun Customization", "Level Editor", "Moddable"],
        "dungeon_crawl": ["Dungeon Crawler", "Mystery Dungeon"],
        "gambling_cards": ["Gambling", "Poker", "Solitaire", "Mahjong", "Chess", "Dice", "Board Game", "Tabletop"],
    },
    "visual": {
        "pixel_art": ["Pixel Graphics"],
        "anime": ["Anime"],
        "realistic": ["Realistic"],
        "stylized_cartoon": ["Stylized", "Cartoony", "Cartoon", "Colorful", "Comic Book"],
        "hand_drawn": ["Hand-drawn"],
        "voxel": ["Voxel"],
        "minimalist_abstract": ["Minimalist", "Abstract", "Psychedelic"],
        "retro": ["Retro", "1990's", "1980s", "Old School", "Boomer Shooter", "Nostalgia"],
        "cinematic_fmv": ["FMV", "Cinematic"],
        "text_only": ["Text-Based"],
    },
    "dimension": {
        "2d": ["2D", "2D Platformer", "2D Fighter", "Side Scroller", "Pixel Graphics"],
        "2_5d": ["2.5D"],
        "3d": ["3D", "3D Platformer", "3D Fighter", "Voxel", "First-Person", "FPS", "Third Person", "Third-Person Shooter"],
    },
    "viewpoint": {
        "first_person": ["First-Person", "FPS", "Boomer Shooter"],
        "third_person": ["Third Person", "Third-Person Shooter"],
        "top_down": ["Top-Down", "Top-Down Shooter", "Twin Stick Shooter"],
        "side_view": ["Side Scroller", "2D Platformer", "Platformer", "Precision Platformer", "Metroidvania", "2D Fighter", "Shoot 'Em Up"],
        "isometric": ["Isometric"],
        "vr": ["VR", "Asymmetric VR", "6DOF"],
    },
    "theme": {
        "fantasy": ["Fantasy", "Magic", "Dragons", "Dwarves", "Medieval"],
        "dark_fantasy": ["Dark Fantasy", "Gothic"],
        "sci_fi_space": ["Sci-fi", "Space", "Futuristic", "Aliens", "Robots", "Mechs", "Spaceships", "Mars", "Transhumanism", "Space Sim", "Steampunk"],
        "cyberpunk_dystopia": ["Cyberpunk", "Dystopian", "Hacking"],
        "horror": ["Horror", "Psychological Horror", "Survival Horror", "Jump Scare", "Gore", "Lovecraftian", "Supernatural", "Demons", "Vampires", "Cult"],
        "post_apocalyptic_zombie": ["Post-apocalyptic", "Zombies", "Outbreak Sim"],
        "historical_military": ["Historical", "Military", "War", "World War II", "World War I", "Cold War", "Vikings", "Samurai", "Ninja", "Rome", "Alternate History", "Naval Combat", "Tanks", "Western", "Pirates"],
        "mystery_crime": ["Mystery", "Crime", "Detective", "Noir", "Thriller", "Conspiracy", "Espionage", "Heist", "Assassins"],
        "cozy_cute": ["Cute", "Cozy", "Wholesome", "Relaxing", "Family Friendly", "Animals", "Cats", "Dogs", "Birds", "Wolves", "Horses", "Nature"],
        "comedy": ["Funny", "Comedy", "Dark Humor", "Dark Comedy", "Satire", "Parody", "Memes"],
        "east_asian_myth": ["Xianxia", "Wuxia", "Martial Arts"],
        "mythology": ["Mythology"],
        "romance": ["Romance", "Dating Sim", "Otome", "LGBTQ+"],
        "dark_psychological": ["Dark", "Psychological", "Emotional", "Philosophical", "Surreal", "Psychological Horror"],
        "ai_as_theme": ["Artificial Intelligence"],
        "modern_everyday": ["Modern", "Job Simulator", "Cleaning", "Cooking"],
        "adult": ["Sexual Content", "Nudity", "Hentai"],
    },
    "players": {
        "singleplayer": ["Singleplayer"],
        "coop": ["Co-op", "Online Co-Op", "Local Co-Op", "Co-op Campaign", "Split Screen", "4 Player Local", "PvE"],
        "competitive_multiplayer": ["PvP", "Competitive", "Team-Based", "Battle Royale", "eSports", "MOBA", "Social Deduction", "Class-Based"],
        "multiplayer_unspecified": ["Multiplayer", "Local Multiplayer", "Asynchronous Multiplayer", "Massively Multiplayer", "MMORPG"],
    },
}

IGNORED = {
    "Indie", "Early Access", "Controller", "Free to Play", "Atmospheric", "Combat", "Replay Value", "Difficult",
    "Lore-Rich", "Linear", "Short", "Immersive", "Fast-Paced", "Tutorial", "Experimental", "Mouse Only",
    "Voice Control", "Female Protagonist", "Villain Protagonist", "Bullet Time", "Time Manipulation",
    "Time Travel", "Time Attack", "Quick-Time Events", "Faith", "Science", "Underwater", "Underground",
    "Snow", "Violent", "Archery", "Superhero", "Dinosaurs", "Hardware", "Soundtrack", "Instrumental Music",
    "Electronic Music", "Rock Music", "Real-Time", "Gun Customization", "Swordplay", "Naval",
}


def _index(groups: dict[str, list[str]]) -> dict[str, list[str]]:
    found: dict[str, list[str]] = {}
    for key, tags in groups.items():
        for tag in tags:
            found.setdefault(tag, []).append(key)
    return found


GENRE_INDEX = _index(GENRE_TAGS)
FACET_INDEX = {name: _index(groups) for name, groups in FACETS.items()}


def primary_genre(tags: list[str]) -> tuple[str, dict[str, float]]:
    scores: dict[str, float] = {}
    first_seen: dict[str, int] = {}
    for position, tag in enumerate(tags[:12]):
        weight = 12 - position
        if tag in BROAD:
            weight /= 2
        for genre in GENRE_INDEX.get(tag, []):
            scores[genre] = scores.get(genre, 0) + weight
            first_seen.setdefault(genre, position)
    if not scores:
        return "unclassified", {}
    best = max(scores, key=lambda genre: (scores[genre], -first_seen[genre]))
    return best, scores


def classify(game: dict) -> dict:
    tags = game.get("tags") or []
    genre, scores = primary_genre(tags)
    row = {
        "app_id": str(game["app_id"]),
        "title": game.get("title"),
        "primary_genre": genre,
        "genre_scores": {key: round(value, 1) for key, value in sorted(scores.items(), key=lambda item: -item[1])},
    }
    for facet, index in FACET_INDEX.items():
        values: list[str] = []
        for tag in tags:
            for key in index.get(tag, []):
                if key not in values:
                    values.append(key)
        row[facet] = values
    players = row["players"]
    if "competitive_multiplayer" in players:
        row["player_mode"] = "competitive"
    elif "coop" in players:
        row["player_mode"] = "coop"
    elif "multiplayer_unspecified" in players:
        row["player_mode"] = "multiplayer"
    elif "singleplayer" in players:
        row["player_mode"] = "single"
    else:
        row["player_mode"] = "not_tagged"
    row["coder"] = "steam-tags-rules-v1"
    return row


def unmapped(tags: set[str]) -> list[str]:
    known = set(GENRE_INDEX) | IGNORED
    for index in FACET_INDEX.values():
        known |= set(index)
    return sorted(tags - known)


def main() -> None:
    source = Path(sys.argv[1] if len(sys.argv) > 1 else "../games.jsonl")
    target = Path(sys.argv[2] if len(sys.argv) > 2 else "genre_a_tags.jsonl")
    games = [json.loads(line) for line in source.read_text(encoding="utf-8").splitlines() if line.strip()]
    rows = [classify(game) for game in games]
    target.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows), encoding="utf-8")
    missing = unmapped({tag for game in games for tag in game.get("tags") or []})
    print(f"写入 {len(rows)} 款到 {target}")
    if missing:
        print("没有归入任何维度的标签：", ", ".join(missing))


if __name__ == "__main__":
    main()
