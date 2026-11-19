const REPO = "UninstallAll/steam-nextfest-oct2026-ai";
const TOKEN_KEY = "nextfest-github-token";

const state = {
  games: [],
  sheets: {},
  labels: {},
  genres: {},
  genre: "all",
  me: "",
  token: localStorage.getItem(TOKEN_KEY) || "",
  view: "flow",
  q: "",
  filter: "all",
  listLimit: 80,
  index: 0,
  message: "正在读取游戏",
  showToken: !localStorage.getItem(TOKEN_KEY),
};

const app = document.querySelector("#app");

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function money(cents, currency) {
  if (cents == null) return "价格未知";
  if (cents === 0) return "免费";
  return `${(cents / 100).toFixed(2)} ${currency || ""}`.trim();
}

function blurb(game) {
  return game.description_zh || game.short_description || "没有简介";
}

function mine(appId) {
  return state.sheets[state.me]?.scores?.[appId] ?? null;
}

function allScores(appId) {
  return Object.entries(state.sheets)
    .map(([login, sheet]) => ({ login, score: sheet.scores?.[appId] }))
    .filter((item) => item.score);
}

function average(appId) {
  const scores = allScores(appId).map((item) => item.score);
  if (!scores.length) return null;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function visible() {
  const query = state.q.trim().toLowerCase();
  return state.games.filter((game) => {
    if (query) {
      const haystack = [game.title, game.short_description, game.description_zh, game.ai_disclosure, ...(game.tags || [])]
        .join("\n")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (state.filter === "unrated" && mine(game.app_id)) return false;
    if (state.filter === "rated" && allScores(game.app_id).length === 0) return false;
    if (state.genre !== "all" && state.genres[String(game.app_id)]?.primary_genre !== state.genre) return false;
    return true;
  });
}

function stars(appId, mineOnly) {
  const value = mineOnly ? mine(appId) : Math.round(average(appId) || 0);
  return `<span class="stars" data-app="${esc(appId)}">${[1, 2, 3, 4, 5].map((score) => `
    <button type="button" data-score="${score}" class="${value && score <= value ? "on" : ""}" aria-label="${score} 星">${value && score <= value ? "★" : "☆"}</button>
  `).join("")}</span>`;
}

function peopleLine(appId) {
  const rows = allScores(appId);
  if (!rows.length) return `<p class="people">还没有人打分</p>`;
  const avg = average(appId).toFixed(1);
  return `<p class="people">平均 ${avg} · ${rows.map((item) => `${esc(item.login)} ${item.score}`).join(" · ")}</p>`;
}

function render() {
  const games = visible();
  if (state.index >= games.length) state.index = Math.max(games.length - 1, 0);
  const current = games[state.index];
  const ratedByMe = state.me ? state.games.filter((game) => mine(game.app_id)).length : 0;
  app.innerHTML = `
    <header>
      <h1>新品节 AI 披露</h1>
      <span class="muted">${state.games.length} 款 · 我已打 ${ratedByMe}</span>
      <input id="q" value="${esc(state.q)}" placeholder="搜标题、简介或披露" aria-label="搜索">
      <select id="filter" aria-label="筛选">
        <option value="all" ${state.filter === "all" ? "selected" : ""}>全部</option>
        <option value="unrated" ${state.filter === "unrated" ? "selected" : ""}>我还没打分</option>
        <option value="rated" ${state.filter === "rated" ? "selected" : ""}>已有人打分</option>
      </select>
      <select id="genre" aria-label="主类型">
        <option value="all">全部类型</option>
        ${Object.entries(GENRE_NAMES).map(([key, name]) => `<option value="${key}" ${state.genre === key ? "selected" : ""}>${name}（${genreCount(key)}）</option>`).join("")}
      </select>
      <button type="button" id="list" class="${state.view === "list" ? "on" : ""}">列表</button>
      <button type="button" id="flow" class="${state.view === "flow" ? "on" : ""}">翻阅</button>
      <button type="button" id="sync">同步</button>
      <button type="button" id="token">${state.me ? esc(state.me) : "登录 GitHub"}</button>
      <span class="muted">${esc(state.message)}</span>
    </header>
    ${state.showToken ? tokenBox() : ""}
    ${state.view === "list" ? listView(games) : flowView(current, games.length)}
  `;
  bind();
}

function tokenBox() {
  return `
    <section class="token">
      <p>打分会写进这个仓库的 <code>ratings/你的用户名.json</code>。每个人一个文件，所以 A 和 B 的分数不会互相覆盖。其他人同步之后，这里的星星和平均分会变。</p>
      <p class="muted">需要一个只能改这个仓库的 GitHub token，权限选 Contents 读写。仓库是私有的，对方要先被加为协作者。</p>
      <input id="token-input" type="password" placeholder="github_pat_..." autocomplete="off">
      <button type="button" id="save-token">保存并同步</button>
    </section>
  `;
}

function listView(games) {
  if (!games.length) return `<p class="muted list">这个筛选下没有游戏。</p>`;
  return `<div class="list">${games.slice(0, state.listLimit).map((game) => `
    <article class="card">
      <img alt="" referrerpolicy="no-referrer" src="${esc(game.cover_url || "")}">
      <div>
        <div class="title">${esc(game.title)}</div>
        <p class="muted">${esc(game.release_date || "日期未知")} · ${esc(money(game.price_cents, game.currency))}${game.total_reviews ? ` · 商店好评 ${Math.round(100 * (game.positive_reviews || 0) / game.total_reviews)}%（${game.total_reviews}）` : ""}</p>
        ${stars(game.app_id, true)}
        ${peopleLine(game.app_id)}
        <p class="blurb">${esc(blurb(game))}</p>
        <p><a href="${esc(game.url)}" target="_blank" rel="noreferrer">打开原始页</a></p>
      </div>
    </article>
  `).join("")}${games.length > state.listLimit ? `<button type="button" id="more">继续显示（${state.listLimit} / ${games.length}）</button>` : ""}</div>`;
}

function classLine(game) {
  const label = state.labels[String(game.app_id)];
  if (!label) return "";
  const names = {
    runtime_play: "运行时玩法",
    production_asset: "开发期素材",
    storefront_only: "仅商店宣传",
    unspecified: "未能归类",
  };
  return `<p class="class-line">规则分类：${esc(names[label.primary_class] || label.primary_class)}。这是第一次规则运行的结果，打开原始页可以核对。</p>`;
}

const GENRE_NAMES = {
  action: "动作",
  simulation_management: "模拟与经营",
  strategy: "策略与战术",
  casual_idle: "休闲与放置",
  card_board: "卡牌与桌游",
  adventure_narrative: "冒险与叙事",
  horror: "恐怖",
  rpg: "角色扮演",
  puzzle: "解谜",
  sports_racing: "体育与竞速",
  survival_sandbox: "生存与沙盒",
  non_game_tool: "工具与教育软件",
};

const CODE_NAMES = {
  roguelike: "肉鸽", deckbuilding: "卡组构筑", survival_crafting: "生存合成", building_automation: "建造与自动化",
  management_economy: "经营与经济", incremental_idle: "放置增长", tower_defense_autobattler: "塔防与自走棋",
  shooting: "射击", melee_combat: "近战格斗", platforming: "平台跳跃", turn_based: "回合制",
  real_time_tactics: "即时战术", grand_strategy_4x: "大战略与 4X", branching_narrative: "分支叙事",
  investigation: "调查推理", exploration_open_world: "探索与开放世界", stealth: "潜行", puzzle_solving: "解谜",
  physics_destruction: "物理与破坏", collection: "收集", life_romance_sim: "生活与恋爱模拟",
  job_hobby_sim: "职业与爱好模拟", vehicles: "载具", word_typing_trivia: "文字、打字与问答",
  rhythm_music: "节奏与音乐", party_social: "派对社交", desktop_companion: "桌面陪伴",
  procedural_generation: "程序生成", customization_editor: "自定义与编辑器", dungeon_crawl: "地牢探索",
  gambling_cards: "博彩与棋牌",
  fantasy: "奇幻", dark_fantasy: "黑暗奇幻", sci_fi_space: "科幻与太空", cyberpunk_dystopia: "赛博朋克与反乌托邦",
  horror: "恐怖", post_apocalyptic_zombie: "末日与丧尸", historical_military: "历史与军事",
  mystery_crime: "悬疑与犯罪", cozy_cute: "治愈可爱", comedy: "喜剧", east_asian_myth: "仙侠武侠",
  mythology: "神话", romance: "恋爱", dark_psychological: "黑暗与心理", ai_as_theme: "以 AI 为题材",
  modern_everyday: "现代日常", adult: "成人",
  pixel_art: "像素", anime: "动漫", realistic: "写实", stylized_cartoon: "风格化与卡通", hand_drawn: "手绘",
  voxel: "体素", minimalist_abstract: "极简与抽象", retro: "复古", cinematic_fmv: "电影化与真人影像",
  text_only: "纯文字", "2d": "2D", "2_5d": "2.5D", "3d": "3D",
  first_person: "第一人称", third_person: "第三人称", top_down: "俯视", side_view: "横版", isometric: "等距",
  vr: "VR",
  single: "单人", coop: "合作", competitive: "对抗多人", multiplayer: "多人", not_tagged: "标签里没写",
};

function codeName(code) {
  return CODE_NAMES[code] || code;
}

function genreCount(key) {
  return Object.values(state.genres).filter((row) => row.primary_genre === key).length;
}

function genreLine(game) {
  const row = state.genres[String(game.app_id)];
  if (!row) return "";
  const part = (label, values) => values?.length ? `<span><b>${label}</b> ${values.map((value) => esc(codeName(value))).join(" · ")}</span>` : "";
  return `<p class="genre-line">
    <span><b>类型</b> ${esc(GENRE_NAMES[row.primary_genre] || row.primary_genre)}</span>
    ${part("玩法", row.mechanics)}
    ${part("题材", row.theme)}
    ${part("视觉", [...(row.visual || []), ...(row.dimension || [])])}
    ${part("视角", row.viewpoint)}
    <span><b>人数</b> ${esc(codeName(row.player_mode))}</span>
  </p>`;
}

function flowView(game, total) {
  if (!game) return `<p class="muted flow">这个筛选下没有游戏。</p>`;
  return `
    <section class="flow">
      <p class="muted">← → 翻页 · 1–5 打分 · 0 清除 · Enter 打开原始页 · ${state.index + 1} / ${total}</p>
      ${game.cover_url ? `<img alt="" referrerpolicy="no-referrer" src="${esc(game.cover_url)}">` : ""}
      <div class="flow-actions">
        <h2>${esc(game.title)}</h2>
        <a href="${esc(game.url)}" target="_blank" rel="noreferrer">打开原始页</a>
      </div>
      <p class="muted">${esc(game.release_date || "日期未知")} · ${esc(money(game.price_cents, game.currency))} · ${(game.tags || []).slice(0, 6).map(esc).join(" · ")}</p>
      ${stars(game.app_id, true)}
      ${peopleLine(game.app_id)}
      <p>${esc(blurb(game))}</p>
      ${genreLine(game)}
      ${classLine(game)}
      <iframe class="steam-widget" src="https://store.steampowered.com/widget/${encodeURIComponent(game.app_id)}/" title="Steam 商店卡片" loading="lazy"></iframe>
      <p class="source-row"><a href="${esc(game.url)}" target="_blank" rel="noreferrer">打开原始商店页（O）</a></p>
      <p class="muted">${esc(game.url)}</p>
      <p class="disclosure">${esc(game.ai_disclosure || "没有披露原文")}</p>
    </section>
  `;
}

function bind() {
  document.querySelector("#q").addEventListener("input", (event) => {
    state.q = event.target.value;
    state.index = 0;
    state.listLimit = 80;
    render();
    document.querySelector("#q").focus();
  });
  document.querySelector("#filter").addEventListener("change", (event) => {
    state.filter = event.target.value;
    state.index = 0;
    render();
  });
  document.querySelector("#genre").addEventListener("change", (event) => {
    state.genre = event.target.value;
    state.index = 0;
    state.listLimit = 80;
    render();
  });
  document.querySelector("#list").addEventListener("click", () => { state.view = "list"; render(); });
  document.querySelector("#flow").addEventListener("click", () => { state.view = "flow"; render(); });
  document.querySelector("#sync").addEventListener("click", () => { void refreshRatings(); });
  document.querySelector("#token").addEventListener("click", () => { state.showToken = !state.showToken; render(); });
  document.querySelector("#save-token")?.addEventListener("click", () => {
    state.token = document.querySelector("#token-input").value.trim();
    localStorage.setItem(TOKEN_KEY, state.token);
    state.showToken = false;
    void refreshRatings();
  });
  document.querySelector("#more")?.addEventListener("click", () => {
    state.listLimit += 80;
    render();
  });
  app.querySelectorAll(".stars button").forEach((button) => {
    button.addEventListener("click", () => {
      const appId = button.parentElement.dataset.app;
      const score = Number(button.dataset.score);
      void rate(appId, mine(appId) === score ? 0 : score);
    });
  });
}

async function rate(appId, score) {
  if (!state.token || !state.me) {
    state.showToken = true;
    state.message = "先保存 GitHub token，分数才能同步";
    render();
    return;
  }
  const sheet = state.sheets[state.me] || { scores: {}, sha: "" };
  if (score === 0) delete sheet.scores[appId];
  else sheet.scores[appId] = score;
  state.sheets[state.me] = sheet;
  render();
  await saveMine();
}

async function github(path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${state.token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
  return response.json();
}

async function refreshRatings() {
  if (!state.token) {
    state.message = "未登录，只能浏览";
    render();
    return;
  }
  try {
    const me = await github("/user");
    state.me = me.login;
    const listing = await github(`/repos/${REPO}/contents/ratings`);
    const files = Array.isArray(listing) ? listing.filter((item) => item.name.endsWith(".json")) : [];
    const sheets = {};
    for (const file of files) {
      const body = await github(`/repos/${REPO}/contents/${file.path}`);
      const text = decodeURIComponent(escape(atob(body.content.replaceAll("\n", ""))));
      const parsed = JSON.parse(text);
      sheets[file.name.replace(/\.json$/, "")] = { scores: parsed.scores || {}, sha: body.sha };
    }
    if (!sheets[state.me]) sheets[state.me] = { scores: {}, sha: "" };
    state.sheets = sheets;
    const names = Object.keys(sheets);
    state.message = names.length ? `已同步 ${names.join("、")}` : "还没有人打分";
  } catch (error) {
    state.message = `同步失败：${error.message.slice(0, 140)}`;
  }
  render();
}

async function saveMine() {
  const sheet = state.sheets[state.me];
  const content = btoa(unescape(encodeURIComponent(JSON.stringify({
    updated_at: new Date().toISOString(),
    scores: sheet.scores,
  }))));
  const body = { message: `Rate games as ${state.me}`, content };
  if (sheet.sha) body.sha = sheet.sha;
  try {
    const saved = await github(`/repos/${REPO}/contents/ratings/${state.me}.json`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    sheet.sha = saved.content.sha;
    state.message = "分数已同步";
    render();
  } catch (error) {
    if (String(error.message).startsWith("409") || String(error.message).includes("409")) {
      await refreshRatings();
      return;
    }
    state.message = `写入失败：${error.message.slice(0, 140)}`;
    render();
  }
}

window.addEventListener("keydown", (event) => {
  const tag = event.target?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  if (state.view !== "flow") return;
  const games = visible();
  if (!games.length) return;
  if (event.key === "ArrowRight") state.index = Math.min(state.index + 1, games.length - 1);
  else if (event.key === "ArrowLeft") state.index = Math.max(state.index - 1, 0);
  else if (event.key === "Enter" || event.key === "o" || event.key === "O") {
    window.open(games[state.index].url, "_blank", "noopener");
    return;
  } else if (event.key >= "0" && event.key <= "5") {
    event.preventDefault();
    void rate(games[state.index].app_id, Number(event.key));
    return;
  } else return;
  render();
});

const response = await fetch("games.jsonl");
state.games = (await response.text()).trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
try {
  const labeled = await fetch("analysis/pass_a_rules.jsonl", { cache: "no-cache" });
  if (labeled.ok) {
    for (const line of (await labeled.text()).trim().split("\n")) {
      if (!line.trim()) continue;
      const row = JSON.parse(line);
      state.labels[String(row.app_id)] = row;
    }
  }
} catch {
  // 分类文件还没放在旁边时，翻阅页仍可打开原始商店页。
}
try {
  const genres = await fetch("analysis/genre_a_tags.jsonl", { cache: "no-cache" });
  if (genres.ok) {
    for (const line of (await genres.text()).trim().split("\n")) {
      if (!line.trim()) continue;
      const row = JSON.parse(line);
      state.genres[String(row.app_id)] = row;
    }
  }
} catch {
  // 没有类型分类文件时不显示类型行，也不能按类型筛选。
}
state.message = state.token ? "正在同步打分" : "未登录，只能浏览";
try {
  const local = await fetch("ratings/UninstallAll.json");
  if (local.ok) {
    const parsed = await local.json();
    state.sheets.UninstallAll = { scores: parsed.scores || {}, sha: "" };
  }
} catch {
  // 本地没有这份分数时，登录后再从仓库拉。
}
render();
if (state.token) await refreshRatings();
setInterval(() => { if (state.token) void refreshRatings(); }, 20000);
