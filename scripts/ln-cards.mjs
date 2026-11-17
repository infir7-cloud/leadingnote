// 리딩노트 · 카톡 미리보기 카드용 주소 파일 만들기
// DB의 짧은 주소(ln_links)마다 l/<코드>/index.html 을 만들어요.
// 카카오톡 미리보기는 스크립트를 실행하지 않아서, 페이지별 제목·설명을 파일에 직접 적어 둬요.
// 사람이 열면 바로 도착 화면(app/land.html?c=<코드>)으로 넘어가요. ?from=방이름 도 그대로 넘겨요.
// 실행: node scripts/ln-cards.mjs  (GitHub Actions가 30분마다 실행해요)
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";

const URL_ = "https://khbgiybvzagvbilbqnsn.supabase.co";
const KEY = "sb_publishable_IHaBbRAESCgOJLi8jLPkVQ_X1AsUONe"; // 공개(publishable) 키
const SITE = "https://infir7-cloud.github.io/leadingnote";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const r = await fetch(URL_ + "/rest/v1/rpc/ln_link_cards", {
  method: "POST",
  headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
  body: "{}",
});
if (!r.ok) { console.error("카드 정보를 못 받았어요", r.status, await r.text()); process.exit(1); }
const rows = await r.json();

// 카드 대표 이미지: og/<프로그램id>.jpg 가 있으면 그 프로그램(홈·회차·종목) 카드에, 없으면 og/default.jpg (있을 때만)
// 이미지 규격: 1200×630 JPG, 300KB 이하. 파일을 og 폴더에 넣으면 다음 실행 때 자동으로 붙어요.
const lr = await fetch(URL_ + "/rest/v1/ln_links?select=code,kind,k&limit=10000", { headers: { apikey: KEY, Authorization: "Bearer " + KEY } });
if (!lr.ok) { console.error("주소 목록을 못 받았어요", lr.status); process.exit(1); }
const progOf = {};
for (const l of await lr.json()) progOf[l.code] = l.kind === "x" ? "" : String(l.k).split("|")[0];
const imgOf = (code) => {
  const pid = progOf[code] || "";
  if (pid && /^[a-z0-9_-]+$/i.test(pid) && existsSync(`og/${pid}.jpg`)) return `${SITE}/og/${pid}.jpg`;
  if (existsSync("og/default.jpg")) return `${SITE}/og/default.jpg`;
  return "";
};

let made = 0, same = 0;
for (const x of rows) {
  if (!/^[A-Za-z0-9]{6,8}$/.test(x.code) || !x.title) continue;
  const t = esc(x.title), d = esc(x.descr || "가입 없이 바로 봐요"), c = x.code, img = imgOf(c);
  const imgTags = img ? `<meta property="og:image" content="${img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${t}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${img}">` : `<meta name="twitter:card" content="summary">`;
  const html = `<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${t} · 리딩노트</title>
<meta name="description" content="${d}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="리딩노트">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:url" content="${SITE}/l/${c}/">
${imgTags}
<script>location.replace('../../app/land.html?c=${c}' + (location.search ? '&' + location.search.slice(1) : ''));</script>
<meta http-equiv="refresh" content="0; url=../../app/land.html?c=${c}">
<style>body{margin:0;padding:24px;font-family:system-ui,sans-serif;background:#F2F4F6;color:#333D4B}a{color:#5B4CF0}</style>
</head><body><p>리딩노트로 이동하고 있어요. 바로 열리지 않으면 <a href="../../app/land.html?c=${c}">여기</a>를 눌러 주세요.</p></body></html>
`;
  const dir = `l/${c}`, file = `${dir}/index.html`;
  if (existsSync(file) && readFileSync(file, "utf8") === html) { same++; continue; }
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, html);
  made++;
}
console.log(`주소 파일: 새로·바뀜 ${made}개, 그대로 ${same}개 (전체 ${rows.length}개)`);
