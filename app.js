const REPO = "UninstallAll/steam-nextfest-oct2026-ai";
const TOKEN_KEY = "nextfest-github-token";
const POS_KEY = "nextfest-position";
const MUTE_KEY = "nextfest-muted";
const AUTOPLAY_KEY = "nextfest-autoplay";
const CHUNK = 50;
const HLS_URL = "https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.mjs";

const state = {
  games: [],
  sheets: {},
  labels: {},
  genres: {},
  media: {},
  chunks: {},
  genre: "all",
  me: "",
  token: localStorage.getItem(TOKEN_KEY) || "",
  view: "flow",
  q: "",
  filter: "all",
  listLimit: 80,
  index: 0,
  mediaIndex: 0,
  autoplay: localStorage.getItem(AUTOPLAY_KEY) === "1",
  message: "正在读取游戏",
  showToken: false,
};

const app = document.querySelector("#app");
let hls = null;
let HlsClass = null;
let visibleCache = null;

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
  if (visibleCache) return visibleCache;
  const query = state.q.trim().toLowerCase();
  visibleCache = state.games.filter((game) => {
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
  return visibleCache;
}

function refilter() {
  visibleCache = null;
  state.index = 0;
  state.listLimit = 80;
}

function stars(appId, mineOnly) {
  const value = mineOnly ? mine(appId) : Math.round(average(appId) || 0);
  return `<span class="stars" data-app="${esc(appId)}">${[1, 2, 3, 4, 5].map((score) => `
    <button type="button" data-score="${score}" class="${value && score <= value ? "on" : ""}" aria-label="${score} 星">${value && score <= value ? "★" : "☆"}</button>
  `).join("")}</span>`;
}

function peopleLine(appId) {
  const rows = allScores(appId);
  if (!rows.length) return `<span class="people muted">还没有人打分</span>`;
  const avg = average(appId).toFixed(1);
  return `<span class="people muted">平均 ${avg} · ${rows.map((item) => `${esc(item.login)} ${item.score}`).join(" · ")}</span>`;
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

const AI_NAMES = {
  runtime_play: "运行时玩法",
  production_asset: "开发期素材",
  storefront_only: "仅商店宣传",
  unspecified: "未能归类",
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

const HOT_WORDS = /\b(during (?:gameplay|play)|in[- ]game|at runtime|runtime|real[- ]time|live|dynamic(?:ally)?|LLMs?|large language models?|ChatGPT|GPT-?\d*|chatbots?|AI[- ]driven|AI[- ]powered|procedurally)\b|实时|运行时|游戏中|游戏过程中|动态/gi;
const ASSET_WORDS = /\b(pre-?generated|art(?:work)?|images?|illustrations?|textures?|music|sound(?:s| effects)?|voices?|voice-?overs?|text-to-speech|TTS|translations?|localization|code|coding|marketing|store page|capsule|trailers?|concept)\b|美术|图片|插画|配音|语音|音乐|音效|翻译|代码|宣传/gi;

function highlight(text) {
  return esc(text)
    .replace(HOT_WORDS, (word) => `<mark class="hot">${word}</mark>`)
    .replace(ASSET_WORDS, (word) => `<mark>${word}</mark>`);
}

function cleanAbout(html) {
  const doc = new DOMParser().parseFromString(html || "", "text/html");
  doc.querySelectorAll("script, style, iframe, object, embed, form, link, meta").forEach((node) => node.remove());
  doc.querySelectorAll("*").forEach((node) => {
    for (const attr of [...node.attributes]) {
      if (attr.name.startsWith("on") || attr.name === "style" || attr.name === "class") node.removeAttribute(attr.name);
    }
    if (node.tagName === "IMG") {
      node.setAttribute("loading", "lazy");
      node.setAttribute("referrerpolicy", "no-referrer");
    }
    if (node.tagName === "A") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noreferrer");
    }
    if (node.tagName === "VIDEO") {
      node.setAttribute("muted", "");
      node.removeAttribute("autoplay");
    }
  });
  return doc.body.innerHTML;
}

function chunkOf(game) {
  return Math.floor(game._i / CHUNK);
}

function ensureChunk(number) {
  if (number < 0 || number * CHUNK >= state.games.length) return Promise.resolve();
  if (!state.chunks[number]) {
    state.chunks[number] = fetch(`media/chunk_${String(number).padStart(3, "0")}.json`)
      .then((response) => (response.ok ? response.json() : []))
      .then((rows) => {
        for (const row of rows) state.media[String(row.app_id)] = row;
      })
      .catch(() => {});
  }
  return state.chunks[number];
}

function mediaItems(game) {
  const media = state.media[String(game.app_id)];
  if (!media) return [{ kind: "image", full: game.cover_url, thumb: game.cover_url }];
  const items = [
    ...(media.movies || []).filter((movie) => movie.hls || movie.mp4).map((movie) => ({ kind: "video", ...movie })),
    ...(media.screenshots || []).map((shot) => ({ kind: "image", ...shot })),
  ];
  return items.length ? items : [{ kind: "image", full: game.cover_url, thumb: game.cover_url }];
}

const warmed = new Set();
function warm(url) {
  if (!url || warmed.has(url)) return;
  warmed.add(url);
  const image = new Image();
  image.referrerPolicy = "no-referrer";
  image.src = url;
}

function prefetchAround() {
  const games = visible();
  const current = games[state.index];
  if (!current) return;
  ensureChunk(chunkOf(current) + 1);
  for (const offset of [1, 2, 3, -1]) {
    const game = games[state.index + offset];
    if (!game) continue;
    warm(game.cover_url);
    ensureChunk(chunkOf(game)).then(() => {
      const items = mediaItems(game);
      const firstImage = items.find((item) => item.kind === "image");
      if (offset <= 2) warm(items[0].kind === "video" ? items[0].thumb : firstImage?.full);
      items.slice(0, 8).forEach((item) => warm(item.thumb));
    });
  }
}

function render() {
  visibleCache = null;
  app.innerHTML = `
    <header>
      <h1>新品节 AI 披露</h1>
      <span class="muted" id="count"></span>
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
      <label class="muted check"><input type="checkbox" id="autoplay" ${state.autoplay ? "checked" : ""}> 自动播放视频</label>
      <button type="button" id="sync">同步</button>
      <button type="button" id="token">${state.me ? esc(state.me) : "登录 GitHub"}</button>
      <span class="muted" id="message"></span>
    </header>
    <div id="token-box"></div>
    <main id="body"></main>
  `;
  bindHeader();
  renderBody();
}

function updateHeader() {
  const ratedByMe = state.me ? state.games.filter((game) => mine(game.app_id)).length : 0;
  const count = document.querySelector("#count");
  if (count) count.textContent = `${state.games.length} 款 · 我已打 ${ratedByMe}`;
  const message = document.querySelector("#message");
  if (message) message.textContent = state.message;
  const token = document.querySelector("#token");
  if (token) token.textContent = state.me || "登录 GitHub";
  const box = document.querySelector("#token-box");
  if (box) {
    box.innerHTML = state.showToken ? tokenBox() : "";
    document.querySelector("#save-token")?.addEventListener("click", () => {
      state.token = document.querySelector("#token-input").value.trim();
      localStorage.setItem(TOKEN_KEY, state.token);
      state.showToken = false;
      void refreshRatings();
    });
  }
}

function renderBody() {
  const games = visible();
  if (state.index >= games.length) state.index = Math.max(games.length - 1, 0);
  stopVideo();
  const body = document.querySelector("#body");
  body.innerHTML = state.view === "list" ? listView(games) : flowView(games[state.index], games.length);
  bindBody();
  updateHeader();
  if (state.view === "flow" && games[state.index]) {
    const game = games[state.index];
    localStorage.setItem(POS_KEY, String(game.app_id));
    history.replaceState(null, "", `#app=${game.app_id}`);
    const pending = !state.media[String(game.app_id)];
    ensureChunk(chunkOf(game)).then(() => {
      if (visible()[state.index] !== game) return;
      if (pending) {
        renderStage(game);
        renderAbout(game);
      }
      prefetchAround();
    });
    renderStage(game);
  }
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
  return `<div class="list">${games.slice(0, state.listLimit).map((game, index) => `
    <article class="card" data-index="${index}">
      <img alt="" loading="lazy" referrerpolicy="no-referrer" src="${esc(game.cover_url || "")}">
      <div>
        <div class="title">${esc(game.title)}</div>
        <p class="muted">${esc(game.release_date || "日期未知")} · ${esc(money(game.price_cents, game.currency))}${game.total_reviews ? ` · 商店好评 ${Math.round(100 * (game.positive_reviews || 0) / game.total_reviews)}%（${game.total_reviews}）` : ""}</p>
        <div class="rate-box" data-app="${esc(game.app_id)}">${stars(game.app_id, true)} ${peopleLine(game.app_id)}</div>
        <p class="blurb">${esc(blurb(game))}</p>
        <p><a href="${esc(game.url)}" target="_blank" rel="noreferrer">打开原始页</a> · <a href="#" class="to-flow" data-index="${index}">在翻阅里看</a></p>
      </div>
    </article>
  `).join("")}${games.length > state.listLimit ? `<button type="button" id="more">继续显示（${state.listLimit} / ${games.length}）</button>` : ""}</div>`;
}

function classLine(game) {
  const label = state.labels[String(game.app_id)];
  if (!label) return "";
  return `<p class="class-line"><b>AI 用途（规则）</b> ${esc(AI_NAMES[label.primary_class] || label.primary_class)}</p>`;
}

function reviewText(game) {
  if (!game.total_reviews) return "还没有评价";
  const share = Math.round(100 * (game.positive_reviews || 0) / game.total_reviews);
  return `${game.score_label ? `${esc(game.score_label)} · ` : ""}好评 ${share}%（${game.total_reviews}）`;
}

function flowView(game, total) {
  if (!game) return `<p class="muted flow-empty">这个筛选下没有游戏。</p>`;
  return `
    <section class="flow">
      <div class="stage-col">
        <div class="stage" id="stage"></div>
        <div class="strip" id="strip"></div>
        <p class="muted keys">← → 换游戏 · ↑ ↓ 换画面 · V 播放或暂停 · F 全屏 · 1–5 打分 · 0 清除 · O 打开商店页</p>
      </div>
      <aside class="info">
        <div class="info-head">
          <span class="muted">${state.index + 1} / ${total}</span>
          <a href="${esc(game.url)}" target="_blank" rel="noreferrer">打开原始商店页（O）</a>
        </div>
        <h2>${esc(game.title)}</h2>
        <p class="muted">${esc((game.developers || []).join("、") || "开发商未知")}${(game.publishers || []).length && (game.publishers || []).join() !== (game.developers || []).join() ? ` · 发行 ${esc(game.publishers.join("、"))}` : ""}</p>
        <p class="facts">${esc(game.release_date || "日期未知")} · ${esc(money(game.price_cents, game.currency))}${game.discount_percent ? ` · 折扣 ${game.discount_percent}%` : ""} · ${reviewText(game)}</p>
        <div class="rate-box" data-app="${esc(game.app_id)}">${stars(game.app_id, true)} ${peopleLine(game.app_id)}</div>
        <p class="tags">${(game.tags || []).map((tag) => `<span>${esc(tag)}</span>`).join("")}</p>
        <p class="short">${esc(blurb(game))}</p>
        ${genreLine(game)}
        ${classLine(game)}
        <h3>AI 披露原文</h3>
        <p class="disclosure">${highlight(game.ai_disclosure || "没有披露原文")}</p>
        <h3>关于这款游戏</h3>
        <div class="about" id="about">${aboutHtml(game)}</div>
      </aside>
    </section>
  `;
}

function aboutHtml(game) {
  const media = state.media[String(game.app_id)];
  if (!media) return `<p class="muted">正在读取介绍…</p>`;
  return media.about_html ? cleanAbout(media.about_html) : `<p class="muted">商店页没有写介绍。</p>`;
}

function renderAbout(game) {
  const about = document.querySelector("#about");
  if (about) about.innerHTML = aboutHtml(game);
}

function renderStage(game) {
  const stage = document.querySelector("#stage");
  const strip = document.querySelector("#strip");
  if (!stage || !strip) return;
  const items = mediaItems(game);
  if (state.mediaIndex >= items.length) state.mediaIndex = 0;
  const item = items[state.mediaIndex];
  stopVideo();
  if (item.kind === "video") {
    stage.innerHTML = `<video id="video" controls playsinline preload="none" poster="${esc(item.thumb || "")}"></video><span class="stage-label">${esc(item.name || "宣传视频")}</span><button type="button" class="play-overlay" aria-label="播放视频">▶</button>`;
    const video = stage.querySelector("video");
    stage.querySelector(".play-overlay").addEventListener("click", () => { void playVideo(); });
    video.addEventListener("playing", () => stage.querySelector(".play-overlay")?.remove(), { once: true });
    video.muted = localStorage.getItem(MUTE_KEY) !== "0";
    video.addEventListener("volumechange", () => localStorage.setItem(MUTE_KEY, video.muted ? "1" : "0"));
    video.addEventListener("play", () => attachVideo(video, item), { once: true });
    if (state.autoplay) void playVideo();
  } else {
    stage.innerHTML = `<img alt="" referrerpolicy="no-referrer" src="${esc(item.full || item.thumb || "")}">`;
  }
  const videos = items.filter((entry) => entry.kind === "video").length;
  strip.innerHTML = items.map((entry, index) => `
    <button type="button" class="thumb ${index === state.mediaIndex ? "on" : ""} ${entry.kind}" data-media="${index}" aria-label="${entry.kind === "video" ? "视频" : "截图"} ${index + 1}">
      <img alt="" loading="lazy" referrerpolicy="no-referrer" src="${esc(entry.thumb || entry.full || "")}">
    </button>
  `).join("") + `<span class="muted strip-count">${videos} 个视频 · ${items.length - videos} 张截图</span>`;
  strip.querySelectorAll(".thumb").forEach((button) => {
    button.addEventListener("click", () => {
      state.mediaIndex = Number(button.dataset.media);
      renderStage(game);
      if (items[state.mediaIndex].kind === "video") void playVideo();
    });
  });
  strip.querySelector(".thumb.on")?.scrollIntoView({ block: "nearest", inline: "nearest" });
  const next = items[state.mediaIndex + 1];
  if (next?.kind === "image") warm(next.full);
}

async function attachVideo(video, item) {
  if (video.dataset.ready) return;
  video.dataset.ready = "1";
  video.addEventListener("canplay", () => video.play().catch(() => {}), { once: true });
  if (item.mp4) {
    video.src = item.mp4;
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = item.hls;
  } else {
    try {
      HlsClass ||= (await import(HLS_URL)).default;
    } catch {
      document.querySelector("#stage")?.insertAdjacentHTML("beforeend", `<p class="stage-error">视频播放组件没能加载，请按 O 去商店页看。</p>`);
      return;
    }
    if (!HlsClass.isSupported()) return;
    hls = new HlsClass({ maxBufferLength: 20, capLevelToPlayerSize: true });
    hls.loadSource(item.hls);
    hls.attachMedia(video);
  }
  video.play().catch(() => {});
}

async function playVideo() {
  const video = document.querySelector("#video");
  if (!video) return;
  const games = visible();
  const item = mediaItems(games[state.index])[state.mediaIndex];
  if (!video.dataset.ready) {
    await attachVideo(video, item);
    return;
  }
  if (video.paused) video.play().catch(() => {});
  else video.pause();
}

function stopVideo() {
  if (hls) {
    hls.destroy();
    hls = null;
  }
  const video = document.querySelector("#video");
  if (video) {
    video.pause();
    video.removeAttribute("src");
    video.load();
  }
}

function refreshRates() {
  document.querySelectorAll(".rate-box").forEach((box) => {
    box.innerHTML = `${stars(box.dataset.app, true)} ${peopleLine(box.dataset.app)}`;
  });
  bindStars();
  updateHeader();
}

function bindHeader() {
  document.querySelector("#q").addEventListener("input", (event) => {
    state.q = event.target.value;
    refilter();
    renderBody();
  });
  document.querySelector("#filter").addEventListener("change", (event) => {
    state.filter = event.target.value;
    refilter();
    renderBody();
  });
  document.querySelector("#genre").addEventListener("change", (event) => {
    state.genre = event.target.value;
    refilter();
    renderBody();
  });
  document.querySelector("#list").addEventListener("click", () => { state.view = "list"; render(); });
  document.querySelector("#flow").addEventListener("click", () => { state.view = "flow"; render(); });
  document.querySelector("#autoplay").addEventListener("change", (event) => {
    state.autoplay = event.target.checked;
    localStorage.setItem(AUTOPLAY_KEY, state.autoplay ? "1" : "0");
  });
  document.querySelector("#sync").addEventListener("click", () => { void refreshRatings(); });
  document.querySelector("#token").addEventListener("click", () => { state.showToken = !state.showToken; updateHeader(); });
}

function bindStars() {
  app.querySelectorAll(".stars button").forEach((button) => {
    button.addEventListener("click", () => {
      const appId = button.parentElement.dataset.app;
      const score = Number(button.dataset.score);
      void rate(appId, mine(appId) === score ? 0 : score);
    });
  });
}

function bindBody() {
  document.querySelector("#more")?.addEventListener("click", () => {
    state.listLimit += 80;
    renderBody();
  });
  app.querySelectorAll(".to-flow").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      state.index = Number(link.dataset.index);
      state.mediaIndex = 0;
      state.view = "flow";
      render();
    });
  });
  bindStars();
}

function go(delta) {
  const games = visible();
  const next = Math.min(Math.max(state.index + delta, 0), games.length - 1);
  if (next === state.index) return;
  state.index = next;
  state.mediaIndex = 0;
  renderBody();
  document.querySelector(".info")?.scrollTo(0, 0);
}

function stepMedia(delta) {
  const game = visible()[state.index];
  if (!game) return;
  const items = mediaItems(game);
  state.mediaIndex = (state.mediaIndex + delta + items.length) % items.length;
  renderStage(game);
}

async function rate(appId, score) {
  if (!state.token || !state.me) {
    state.showToken = true;
    state.message = "先保存 GitHub token，分数才能同步";
    updateHeader();
    return;
  }
  const sheet = state.sheets[state.me] || { scores: {}, sha: "" };
  if (score === 0) delete sheet.scores[appId];
  else sheet.scores[appId] = score;
  state.sheets[state.me] = sheet;
  refreshRates();
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
    updateHeader();
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
  refreshRates();
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
  } catch (error) {
    if (String(error.message).includes("409")) {
      await refreshRatings();
      return;
    }
    state.message = `写入失败：${error.message.slice(0, 140)}`;
  }
  updateHeader();
}

window.addEventListener("keydown", (event) => {
  const tag = event.target?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  if (state.view !== "flow" || event.metaKey || event.ctrlKey || event.altKey) return;
  const games = visible();
  if (!games.length) return;
  const key = event.key;
  if (key === "ArrowRight") go(1);
  else if (key === "ArrowLeft") go(-1);
  else if (key === "ArrowDown") stepMedia(1);
  else if (key === "ArrowUp") stepMedia(-1);
  else if (key === "v" || key === "V" || key === " ") void playVideo();
  else if (key === "f" || key === "F") {
    const stage = document.querySelector("#stage");
    if (document.fullscreenElement) void document.exitFullscreen();
    else void stage?.requestFullscreen();
  } else if (key === "Enter" || key === "o" || key === "O") window.open(games[state.index].url, "_blank", "noopener");
  else if (key >= "0" && key <= "5") void rate(games[state.index].app_id, Number(key));
  else return;
  event.preventDefault();
  event.stopPropagation();
}, true);

async function loadJsonl(path) {
  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok) return [];
  return (await response.text()).trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
}

state.games = (await loadJsonl("games.jsonl")).map((game, index) => ({ ...game, _i: index }));
try {
  for (const row of await loadJsonl("analysis/pass_a_rules.jsonl")) state.labels[String(row.app_id)] = row;
} catch {
  // 分类文件还没放在旁边时，翻阅页仍可打开原始商店页。
}
try {
  for (const row of await loadJsonl("analysis/genre_a_tags.jsonl")) state.genres[String(row.app_id)] = row;
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
const wanted = new URLSearchParams(location.hash.slice(1)).get("app") || localStorage.getItem(POS_KEY);
if (wanted) {
  const found = state.games.findIndex((game) => String(game.app_id) === wanted);
  if (found >= 0) state.index = found;
}
render();
if (state.token) await refreshRatings();
setInterval(() => { if (state.token) void refreshRatings(); }, 60000);
