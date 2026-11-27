// 리딩노트 · 노트 글 작성기 (GitHub Actions가 정해진 시간에 실행해요)
//   node scripts/note-gen.mjs why     평일 07:40 · 어제 가장 많이 오른 종목 (게시 08:00 · 정답 16:40)
//   node scripts/note-gen.mjs theme   평일 15:45 · 오늘의 테마 (게시 16:00) + 지난 테마 결과 한 줄 채우기
//   node scripts/note-gen.mjs week    월   07:10 · 이번 주 일정 (게시 07:30, 운영실에 적은 자료로만)
//   node scripts/note-gen.mjs judge   평일 16:42 · 정답 공개된 글에서 정답 댓글 표시
//
// 흐름: 자료(KRX·DART·뉴스) → Gemini가 사실만 JSON으로 정리 → Claude가 쉬운 말로 다듬기 → 규칙 점검
//       점검에 걸리거나 AI가 실패하면 '초안'으로만 저장해요 (회원에게 안 보여요, 운영실에서 고쳐서 게시).
// 같은 날 같은 코너 글이 이미 있으면 아무것도 안 해요 (다시 돌려도 안전). FORCE=1 이면 AI 글만 새로 써요.
//
// 비밀값 (GitHub → Settings → Secrets and variables → Actions → Secrets):
//   SUPABASE_SERVICE_KEY (필수) · KRX_AUTH_KEY · DART_KEY · GEMINI_API_KEY · ANTHROPIC_API_KEY · NAVER_ID · NAVER_SECRET
// 휴장일: 운영실 '노트 → 설정 → 휴장일'에 적은 날은 why·theme·week를 건너뛰어요.
// DART 회사 고유번호 표(CORPCODE.xml)는 워크플로가 일주일에 한 번 받아 캐시해 둬요 (DART_CORP 경로). 없으면 하루치 목록을 훑어요.
// 변수 (Variables, 선택): GEMINI_MODEL · CLAUDE_MODEL · NOTE_MIN_TRDVAL(최소 거래대금, 원 · 기본 50억)

const SB = "https://khbgiybvzagvbilbqnsn.supabase.co";
const E = process.env;
const MODE = process.argv[2];
const FORCE = E.FORCE === "1";
const GEMINI_MODEL = E.GEMINI_MODEL || "gemini-3.5-flash-lite";   // 자료 정리만 해서 가장 싼 축으로
const CLAUDE_MODEL = E.CLAUDE_MODEL || "claude-sonnet-5-5";
const MIN_TRDVAL = Number(E.NOTE_MIN_TRDVAL || 5e9);

const log = (...a) => console.log("[note]", ...a);
const die = (m) => { console.error("[note] " + m); process.exit(1); };
if (!["why", "theme", "week", "judge"].includes(MODE)) die("코너를 적어 주세요: why | theme | week | judge");
if (!E.SUPABASE_SERVICE_KEY) die("SUPABASE_SERVICE_KEY 비밀값이 없어요");

// ── 날짜 (모두 한국 시각)
const kst = (d = new Date()) => new Date(d.getTime() + 9 * 3600e3);
const ymd = (d) => d.toISOString().slice(0, 10);                       // kst() 결과에만 써요
const at = (day, hm) => new Date(`${day}T${hm}:00+09:00`).toISOString();
const TODAY = ymd(kst());
const addDays = (day, n) => ymd(new Date(Date.parse(day + "T00:00:00Z") + n * 864e5));
const md = (day) => +day.slice(5, 7) + "/" + +day.slice(8, 10);

// ── 공통 요청 (시간 초과 15초 · 한 번 다시 시도)
async function req(url, opt = {}, tries = 2) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { ...opt, signal: AbortSignal.timeout(opt.timeout || 15000) });
      if (r.ok) return r.status === 204 ? null : (r.headers.get("content-type") || "").includes("json") ? r.json() : r.text();
      const t = await r.text();
      if (r.status < 500 && r.status !== 429) throw new Error(`${r.status} ${t.slice(0, 200)}`);
      if (i === tries - 1) throw new Error(`${r.status} ${t.slice(0, 200)}`);
    } catch (e) { if (i === tries - 1 || /^\d{3} /.test(e.message)) throw e; }
    await new Promise((r) => setTimeout(r, 2000));
  }
}

// ── Supabase (service key: 새 형식 sb_secret_ 은 apikey만, 예전 JWT는 Authorization도)
const K = E.SUPABASE_SERVICE_KEY;
const SBH = { apikey: K, "Content-Type": "application/json", ...(K.startsWith("eyJ") ? { Authorization: "Bearer " + K } : {}) };
const db = {
  get: (path) => req(`${SB}/rest/v1/${path}`, { headers: SBH }),
  rpc: (fn, body = {}) => req(`${SB}/rest/v1/rpc/${fn}`, { method: "POST", headers: SBH, body: JSON.stringify(body) }),
  insert: (table, row) => req(`${SB}/rest/v1/${table}`, { method: "POST", headers: { ...SBH, Prefer: "return=minimal" }, body: JSON.stringify(row) }),
  patch: (table, q, row) => req(`${SB}/rest/v1/${table}?${q}`, { method: "PATCH", headers: { ...SBH, Prefer: "return=minimal" }, body: JSON.stringify(row) }),
};

// ── KRX 일별 매매정보 (유가증권 stk · 코스닥 ksq). 그날 자료가 아직 없으면 [].
const KRX_CACHE = {};
async function krxDay(day) {
  if (!E.KRX_AUTH_KEY) die("KRX_AUTH_KEY 비밀값이 없어요");
  if (KRX_CACHE[day]) return KRX_CACHE[day];
  const d = day.replaceAll("-", ""), out = [];
  for (const [mk, api] of [["코스피", "stk_bydd_trd"], ["코스닥", "ksq_bydd_trd"]]) {
    const j = await req(`https://data-dbg.krx.co.kr/svc/apis/sto/${api}?basDd=${d}`, { headers: { AUTH_KEY: E.KRX_AUTH_KEY } });
    for (const x of (j && j.OutBlock_1) || []) {
      const num = (v) => Number(String(v ?? "").replaceAll(",", ""));
      out.push({ code: String(x.ISU_CD || "").slice(-6), name: x.ISU_NM, mk, sect: x.SECT_TP_NM || "", close: num(x.TDD_CLSPRC), pct: num(x.FLUC_RT), val: num(x.ACC_TRDVAL) });
    }
  }
  return (KRX_CACHE[day] = out);
}
// 가장 최근 거래일 (before 이전, 최대 10일 거슬러)
async function lastTradeDay(before) {
  for (let i = 1; i <= 10; i++) { const d = addDays(before, -i); if ((await krxDay(d)).length) return d; }
  return null;
}
async function nextTradeDay(after) {
  const hol = await holidays();
  for (let i = 1; i <= 10; i++) {
    const d = addDays(after, i), wd = new Date(d + "T12:00:00Z").getUTCDay();
    if (d > TODAY) return null;
    if (wd === 0 || wd === 6 || hol.includes(d)) continue;   // 주말·휴장일은 KRX에 묻지 않아요
    if ((await krxDay(d)).length) return d;
  }
  return null;
}
// 순위에서 빼는 종목: 우선주·스팩·관리/정리매매·첫날 상장(상한 30% 넘는 값)·거래대금 작은 종목
const plain = (s) => /^[0-9A-Z]{5}0$/.test(s.code) && !/스팩|SPAC|우[A-Z]?$|우\(.*\)$/.test(s.name) && !/관리|정리매매|투자주의환기/.test(s.sect) && s.pct <= 30.5 && s.val >= MIN_TRDVAL;

// ── DART 공시 (그 종목, 기간 안)
//   회사 고유번호를 알면 한 번에 그 회사 공시만 받아요. 모르면 하루치 전체 목록을 훑어요 (최대 10번).
let CORP_XML = null;
async function corpCode(stock) {
  if (!E.DART_CORP) return null;
  try {
    const xml = CORP_XML ??= (await import("node:fs")).readFileSync(E.DART_CORP, "utf8");
    const i = xml.indexOf(`<stock_code>${stock}</stock_code>`);
    if (i < 0) return null;
    const m = xml.lastIndexOf("<corp_code>", i);
    return m < 0 ? null : xml.slice(m + 11, m + 19);
  } catch { return null; }
}
async function dart(code, from, to) {
  if (!E.DART_KEY) return [];
  const base = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${E.DART_KEY}&bgn_de=${from.replaceAll("-", "")}&end_de=${to.replaceAll("-", "")}&page_count=100`;
  const item = (x) => ({ label: `DART · ${x.report_nm.trim()}`, title: x.report_nm.trim(), url: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${x.rcept_no}` });
  const cc = await corpCode(code);
  if (cc) {
    const j = await req(`${base}&corp_code=${cc}&page_no=1`).catch(() => null);
    return j && j.status === "000" ? (j.list || []).map(item).slice(0, 5) : [];
  }
  const out = [];
  for (let page = 1; page <= 10; page++) {
    const j = await req(`${base}&page_no=${page}`).catch(() => null);
    if (!j || j.status !== "000") break;
    for (const x of j.list || []) if (x.stock_code === code) out.push(item(x));
    if (page >= (j.total_page || 1)) break;
  }
  return out.slice(0, 5);
}
// ── 네이버 뉴스 (제목만 · 선택)
async function news(q, n = 8) {
  if (!E.NAVER_ID || !E.NAVER_SECRET) return [];
  const j = await req(`https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(q)}&display=${n}&sort=date`, { headers: { "X-Naver-Client-Id": E.NAVER_ID, "X-Naver-Client-Secret": E.NAVER_SECRET } }).catch(() => null);
  const clean = (s) => String(s || "").replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;|&gt;|&#39;|&apos;/g, "");
  return ((j && j.items) || []).map((x) => ({ title: clean(x.title), url: x.originallink || x.link, label: "뉴스 · " + clean(x.title).slice(0, 30), at: x.pubDate })).filter((x) => /^https:\/\//.test(x.url));
}

// ── AI
const RULES = `규칙: 투자 권유 금지. 사라·팔아라·보유하라, 목표가·적정 주가, 앞으로 오를지 내릴지 전망은 절대 쓰지 않는다.
자료에 없는 사실은 만들지 않는다. 50~80대 어르신이 읽는다: 짧고 쉬운 말, 한자어·영어 약어는 풀어 쓴다. 존댓말(~해요)로 쓴다.`;
function json(text) {
  const t = String(text || "").replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  try { return JSON.parse(t); } catch { const m = t.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); throw new Error("JSON을 읽지 못했어요"); }
}
async function gemini(prompt) {
  if (!E.GEMINI_API_KEY) return null;
  const j = await req(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: "POST", timeout: 60000, headers: { "Content-Type": "application/json", "x-goog-api-key": E.GEMINI_API_KEY },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.2 } }),
  });
  return json(j?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "");
}
async function claude(prompt) {
  if (!E.ANTHROPIC_API_KEY) return null;
  const j = await req("https://api.anthropic.com/v1/messages", {
    method: "POST", timeout: 90000, headers: { "Content-Type": "application/json", "x-api-key": E.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: 1200, temperature: 0.3, system: RULES + "\n출력은 JSON 하나만.", messages: [{ role: "user", content: prompt }] }),
  });
  return json((j?.content || []).filter((c) => c.type === "text").map((c) => c.text).join(""));
}
// Gemini 정리 → Claude 다듬기. 하나만 있으면 그것만, 둘 다 실패하면 null.
async function write(task, facts, shape) {
  const warn = [];
  let draft = null, out = null;
  try { draft = await gemini(`${RULES}\n${task}\n아래 자료에서 확인되는 사실만 골라 JSON으로 정리해.\n형식: ${shape}\n자료:\n${facts}`); } catch (e) { warn.push("Gemini 실패: " + e.message.slice(0, 80)); }
  try { out = await claude(`${task}\n${draft ? "아래 초안을 규칙에 맞게 쉬운 말로 다듬어. 자료에 없는 내용은 빼." : "아래 자료로 써."}\n형식: ${shape}\n${draft ? "초안: " + JSON.stringify(draft) + "\n" : ""}자료:\n${facts}`); } catch (e) { warn.push("Claude 실패: " + e.message.slice(0, 80)); }
  return { out: out || draft, warn, by: [draft && "gemini", out && "claude"].filter(Boolean) };
}
// 규칙 점검: 권유·전망 낱말이 있으면 경고 (경고가 있으면 초안으로)
const BAN = /매수\s*(추천|하세요|하시)|매도\s*(추천|하세요|하시)|사세요|파세요|팔아야|사야\s*(해|합)|보유\s*(하세요|추천)|목표\s*(가|주가)|적정\s*주가|오를\s*(것|전망)|내릴\s*(것|전망)|상승할\s*(것|전망)|하락할\s*(것|전망)|급등\s*예상|유망|수익\s*보장|확실(히|한)|추천\s*종목/;
function check(obj) {
  const bad = [];
  const walk = (v) => { if (typeof v === "string") { const m = v.match(BAN); if (m) bad.push(`금지 표현 '${m[0]}'`); } else if (v && typeof v === "object") Object.values(v).forEach(walk); };
  walk(obj);
  return [...new Set(bad)];
}
const cut = (s, n) => { s = String(s ?? "").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; };

// ── 저장: 같은 날 글이 있으면 건너뛰어요 (FORCE=1 이면 운영자가 안 고친 AI 글만 다시 써요)
async function save(row) {
  const ex = await db.get(`note_posts?corner=eq.${row.corner}&post_day=eq.${row.post_day}&select=id,made_by,edited_at`);
  if (ex.length) {
    if (!FORCE) { log(`${row.corner} ${row.post_day} 글이 이미 있어요 · 건너뜀`); return; }
    if (ex[0].made_by === "op" || ex[0].edited_at) { log("운영자가 손댄 글이라 다시 쓰지 않아요"); return; }
    await db.patch("note_posts", `id=eq.${ex[0].id}`, row);
    log(`${row.corner} ${row.post_day} 다시 썼어요 (${row.status})`);
    return;
  }
  await db.insert("note_posts", row);
  log(`${row.corner} ${row.post_day} 저장 (${row.status})`, row.ai?.warn?.length ? "경고: " + row.ai.warn.join(" / ") : "");
}
const meta = (w, extra = []) => {
  const warn = [...w.warn, ...extra];
  // AI 하나가 실패해도 다른 하나가 썼으면 게시해요. 결과가 없거나 규칙·내용 점검(extra)에 걸리면 초안.
  return { ai: { models: w.by, gemini: GEMINI_MODEL, claude: CLAUDE_MODEL, warn, at: new Date().toISOString() }, status: !w.out || extra.length ? "draft" : "scheduled" };
};

// ═════ 왜 올랐게?
// '왜 올랐게?' 정답 공개 시각 (한국 시각). 질문 문구도 여기서 만들어요.
const REVEAL = "16:40";
const hmK = (hm) => { const [h, m] = hm.split(":").map(Number); return `${h < 12 ? "오전" : "오후"} ${h % 12 || 12}시${m ? ` ${m}분` : ""}`; };

// 바로 전 거래일 = 오늘 전날부터 주말·운영실 휴장일을 건너뛴 첫날
async function prevTradeDay(today) {
  const hol = await holidays();
  let d = addDays(today, -1);
  for (let i = 0; i < 10; i++, d = addDays(d, -1)) {
    const wd = new Date(d + "T12:00:00Z").getUTCDay();
    if (wd !== 0 && wd !== 6 && !hol.includes(d)) return d;
  }
  return null;
}

async function why() {
  // 지난 테마 결과 한 줄: 테마 실행(15:45) 때 다음 거래일 자료가 없었으면 여기서 다시 시도해요
  await themeResults().catch((e) => log("테마 결과 채우기 실패 · " + e.message));
  // 바로 전 거래일 자료만 써요. 아직 안 올라왔으면 저장하지 않고 끝내서 08:20 재시도가 처리해요.
  // (더 앞의 날짜로 내려가 쓰면 '어제' 퀴즈가 엉뚱한 날 종목이 돼요)
  const day = await prevTradeDay(TODAY);
  if (!day || !(await krxDay(day)).length) return log(`바로 전 거래일(${day || "?"}) KRX 자료가 아직 없어요 · 저장하지 않고 끝내요 (08:20 재시도 · 그래도 없으면 운영실에서 직접, 휴장일이면 운영실 휴장일에 추가)`);
  const top = (await krxDay(day)).filter(plain).sort((a, b) => b.pct - a.pct)[0];
  const WD = "일월화수목금토", dw = WD[new Date(day + "T12:00:00Z").getUTCDay()];
  const when = day === addDays(TODAY, -1) ? "어제" : day === addDays(TODAY, -3) && dw === "금" ? "지난 금요일" : `${md(day)}(${dw})`;
  if (!top) return log("조건에 맞는 종목이 없어요");
  log(`${when}(${day}) 1위: ${top.name} ${top.pct}%`);
  const src = [...await dart(top.code, addDays(day, -1), day), ...(await news(top.name + " 주가", 10)).filter((n) => !n.at || Date.parse(n.at) > Date.parse(day) - 3 * 864e5).slice(0, 6)];
  const facts = `종목: ${top.name} (${top.code}, ${top.mk}) · ${day} 종가 ${top.close.toLocaleString("ko-KR")}원 · 등락률 +${top.pct}%\n` +
    (src.length ? src.map((s, i) => `[${i + 1}] ${s.title} (${s.url})`).join("\n") : "(공시·뉴스 없음)");
  const w = src.length ? await write(
    `'${top.name}'이(가) ${md(day)}(${dw})에 왜 올랐는지 정답을 쓴다. 아침에 퀴즈로 내고 오후에 정답을 공개한다. 제목에서 그날은 '${when}'이라고 부른다 ('어제'라고 단정하지 않는다). 질문에 정답 공개 시각은 쓰지 않는다.`, facts,
    `{"title":"제목 20자 안쪽, 이유는 숨김","question":"댓글 유도 질문 40자 안쪽","answer":"오른 까닭 2~3문장, 자료 번호의 사실만","keys":["정답 판정 낱말 2~4개, 짧은 명사"],"src":[자료 번호들]}`)
    : { out: null, warn: ["공시·뉴스를 찾지 못했어요 · 정답을 직접 적어 주세요"], by: [] };
  const o = w.out || {};
  const used = (Array.isArray(o.src) ? o.src : []).map((n) => src[n - 1]).filter(Boolean);
  const row = {
    corner: "why", post_day: TODAY, publish_at: at(TODAY, "08:00"), reveal_at: at(TODAY, REVEAL), made_by: "ai",
    title: cut(o.title || `${top.name}, ${when} 왜 올랐을까요?`, 60),
    question: cut(o.question || `오른 까닭을 맞혀 보세요. 정답은 ${hmK(REVEAL)}에 공개해요.`, 120),
    body: { code: top.code, name: top.name, pct: top.pct, close: top.close.toLocaleString("ko-KR"), day, src: `KRX ${md(day)}(${dw}) 종가 기준` },
    answer: o.answer ? cut(o.answer, 400) : null,
    answer_src: (used.length ? used : src.slice(0, 3)).map(({ label, url }) => ({ label: cut(label, 40), url })),
    answer_keys: (Array.isArray(o.keys) ? o.keys : []).map((k) => cut(k, 20)).filter(Boolean).slice(0, 6),
  };
  Object.assign(row, meta(w, [...check(row), ...(row.answer ? [] : ["정답이 비었어요"])]));
  await save(row);
}

// ═════ 오늘의 테마 (+ 지난 테마 결과 한 줄은 데이터로 계산)
async function theme() {
  await themeResults();
  const heads = await news("특징주 테마", 30);
  if (!heads.length) return log("뉴스 자료가 없어요 (NAVER_ID·NAVER_SECRET 확인) · 오늘 테마는 운영실에서 직접 써 주세요");
  const today = heads.filter((n) => !n.at || ymd(kst(new Date(n.at))) === TODAY);
  const facts = (today.length ? today : heads).slice(0, 25).map((n, i) => `[${i + 1}] ${n.title}`).join("\n");
  const w = await write(`오늘(${md(TODAY)}) 장에서 가장 많이 언급된 테마 하나를 고르고, 왜 주목받았는지 배경을 3줄로 쓴다. 종목 이름은 자료에 나온 것만.`, facts,
    `{"name":"테마 이름 12자 안쪽","title":"제목 30자 안쪽","lines":["배경 1줄 60자 안쪽","2줄","3줄"],"stocks":["자료에 나온 관련 종목명 최대 5개"],"question":"댓글 유도 질문 40자 안쪽"}`);
  const o = w.out || {};
  // 관련 종목 이름 → 코드 (가장 최근 거래일 목록에서 정확히 같은 이름만)
  const list = await krxDay((await lastTradeDay(addDays(TODAY, 1))) || TODAY);
  const stocks = (Array.isArray(o.stocks) ? o.stocks : []).map((n) => list.find((s) => s.name === String(n).trim())).filter(Boolean).slice(0, 5).map(({ code, name }) => ({ code, name }));
  const row = {
    corner: "theme", post_day: TODAY, publish_at: at(TODAY, "16:00"), reveal_at: null, made_by: "ai",
    title: cut(o.title || `오늘의 테마 · ${o.name || ""}`, 60),
    question: cut(o.question || "이 테마, 어떻게 보셨어요?", 120),
    body: { name: cut(o.name, 30), lines: (Array.isArray(o.lines) ? o.lines : []).map((l) => cut(l, 90)).slice(0, 3), stocks },
  };
  Object.assign(row, meta(w, [...check(row), ...(row.body.lines.length === 3 ? [] : ["배경이 3줄이 아니에요"])]));
  await save(row);
}
async function themeResults() {
  const rows = await db.get(`note_posts?corner=eq.theme&status=eq.scheduled&result_line=is.null&post_day=gte.${addDays(TODAY, -10)}&post_day=lt.${TODAY}&select=id,post_day,body`);
  for (const p of rows) {
    const st = (p.body && p.body.stocks) || [];
    if (!st.length) continue;
    const nd = await nextTradeDay(p.post_day);
    if (!nd) continue;
    const L = await krxDay(nd), got = st.map((s) => L.find((x) => x.code === s.code)).filter(Boolean);
    if (!got.length) continue;
    const avg = got.reduce((a, s) => a + s.pct, 0) / got.length, up = got.filter((s) => s.pct > 0).length;
    const line = `다음 거래일(${md(nd)}) 관련 ${got.length}종목 평균 ${avg > 0 ? "+" : ""}${avg.toFixed(1)}% · 오른 종목 ${up}개 (KRX 종가 기준)`;
    await db.patch("note_posts", `id=eq.${p.id}`, { result_line: line });
    log("테마 결과", p.post_day, line);
  }
}

// ═════ 이번 주 일정 (운영자가 적은 자료로만. AI는 말만 다듬어요)
async function week() {
  const dow = kst().getUTCDay();
  const mon = addDays(TODAY, dow === 0 ? 1 : 1 - dow);
  const cfg = await db.get("site_config?key=eq.note_week_src&select=value");
  const src = cfg[0]?.value || {};
  const items = String(src.text || "").split("\n").map((l) => l.split("|").map((s) => s.trim())).filter((a) => a[0] && a[1]).slice(0, 12).map((a) => ({ d: cut(a[0], 20), what: cut(a[1], 80), res: "" }));
  if (!items.length) return log("운영실 '노트 → 설정 → 이번 주 일정 자료'가 비어 있어요");
  const stale = src.at && Date.parse(src.at) < Date.parse(mon) - 4 * 864e5;
  const w = await write(`이번 주(${md(mon)}~) 주요 일정 목록을 어르신이 알아듣게 다듬는다. 날짜와 순서는 그대로, 각 내용은 40자 안쪽.`, items.map((i, n) => `[${n + 1}] ${i.d} | ${i.what}`).join("\n"),
    `{"title":"제목 30자 안쪽","what":["다듬은 내용, 자료와 같은 개수·순서"],"question":"어떤 일정이 가장 궁금한지 묻는 질문 40자 안쪽"}`);
  const o = w.out || {};
  if (Array.isArray(o.what) && o.what.length === items.length) items.forEach((i, n) => { if (o.what[n]) i.what = cut(o.what[n], 80); });
  const row = {
    corner: "week", post_day: mon, publish_at: at(TODAY < mon ? mon : TODAY, "07:30"), reveal_at: null, made_by: "ai",
    title: cut(o.title || `이번 주 일정 (${md(mon)}~)`, 60), question: cut(o.question || "이번 주 어떤 일정이 가장 궁금하세요?", 120), body: { items },
  };
  // 일정 자료는 운영자가 쓴 것이라 AI가 실패해도 그대로 게시해요. 자료가 오래됐거나 금지 표현만 초안으로.
  const warn = [...check(row), ...(stale ? ["일정 자료가 지난주 것 같아요"] : [])];
  Object.assign(row, { ai: { models: w.by, warn, at: new Date().toISOString() }, status: warn.length ? "draft" : "scheduled" });
  await save(row);
}

// ═════ 정답 댓글 표시
async function judge() { log("정답 댓글 표시", await db.rpc("note_bot_judge", {}), "개"); }

let HOLS = null;
async function holidays() {
  if (!HOLS) { const r = await db.get("site_config?key=eq.note_holidays&select=value").catch(() => []); HOLS = (r[0] && r[0].value && r[0].value.days) || []; }
  return HOLS;
}
async function holiday() {
  if (MODE !== "why" && MODE !== "theme") return false;   // 일정 글은 월요일이 쉬어도 올려요
  if ((await holidays()).includes(TODAY)) { log(`${TODAY}은 운영실에 적은 휴장일이라 건너뛰어요`); return true; }
  return false;
}

try {
  if (!(await holiday())) await ({ why, theme, week, judge })[MODE]();
} catch (e) { die(e.message); }
