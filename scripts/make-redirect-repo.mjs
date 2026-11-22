// 리딩노트 · 옛 주소 리디렉트 저장소 만들기
// infir7-cloud.github.io/leadingnote/<경로> 로 들어오면 새 도메인의 같은 <경로>로 넘겨요.
// 결과 폴더(redirect-repo/)를 'leadingnote' 라는 이름의 공개 저장소에 그대로 올리고 GitHub Pages를 켜면 돼요.
// - 코드·개인 정보 없이, 이동용 HTML과 미리보기 이미지(og/)만 들어가요.
// - 새 도메인은 site.js 한 줄에만 들어가요. 도메인이 바뀌면 그 파일 한 줄만 고치면 돼요.
// - 이미 카톡방에 올라간 l/<코드>/ 주소는 미리보기 카드(제목·설명·이미지)를 그대로 유지해요.
// 실행: node scripts/make-redirect-repo.mjs https://새도메인
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";

const ROOT = process.cwd(), OUT = join(ROOT, "redirect-repo");
const NEW = (process.argv[2] || "https://example.com").replace(/\/+$/, "");
const OLD = "https://infir7-cloud.github.io/leadingnote";
const SKIP = new Set([".git", ".github", "node_modules", "scripts", "dist", "redirect-repo", "cf"]);

const list = (dir, out = []) => {
  for (const n of readdirSync(dir)) {
    if (dir === ROOT && SKIP.has(n)) continue;
    const p = join(dir, n);
    statSync(p).isDirectory() ? list(p, out) : out.push(p);
  }
  return out;
};
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const meta = (html, prop) => (html.match(new RegExp(`<meta (?:property|name)="${prop}" content="([^"]*)"`)) || [])[1];

if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// 새 도메인은 여기 한 곳에만
writeFileSync(join(OUT, "site.js"), `window.LN_NEW = ${JSON.stringify(NEW)};\n`);

// 이동 페이지: 경로·?from=·#화면 을 그대로 붙여서 넘겨요
const page = (rel, head = "") => {
  return `<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
${head || "<title>리딩노트</title>"}
<script src="/leadingnote/site.js"></script>
<script>location.replace(window.LN_NEW + location.pathname.replace(/^\\/leadingnote/, "") + location.search + location.hash);</script>

<style>body{margin:0;padding:24px;font-family:system-ui,sans-serif;background:#F2F4F6;color:#333D4B}a{color:#5B4CF0}</style>
</head><body><p>리딩노트 주소가 바뀌었어요. 바로 열리지 않으면 <a id="go" href="#">새 주소로 이동</a>을 눌러 주세요.</p>
<script>document.getElementById("go").href = window.LN_NEW + location.pathname.replace(/^\\/leadingnote/, "") + location.search + location.hash;</script></body></html>
`;
};

let n = 0, cards = 0;
for (const f of list(ROOT)) {
  const rel = relative(ROOT, f);
  if (rel.startsWith("og/")) { mkdirSync(dirname(join(OUT, rel)), { recursive: true }); copyFileSync(f, join(OUT, rel)); continue; }
  if (!rel.endsWith(".html")) continue;
  let head = "";
  if (rel.startsWith("l/")) {          // 카톡 미리보기 카드 유지
    const h = readFileSync(f, "utf8"), t = meta(h, "og:title"), d = meta(h, "og:description"), img = meta(h, "og:image");
    if (t) {
      const imgOld = img ? img.replace(/^https?:\/\/[^/]+(\/leadingnote)?/, OLD) : "";
      head = `<title>${t} · 리딩노트</title>
<meta name="description" content="${d || ""}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="리딩노트">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d || ""}">
<meta property="og:url" content="${OLD}/${rel.replace(/index\.html$/, "")}">
${imgOld ? `<meta property="og:image" content="${imgOld}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">` : `<meta name="twitter:card" content="summary">`}`;
      cards++;
    }
  }
  const dst = join(OUT, rel);
  mkdirSync(dirname(dst), { recursive: true });
  writeFileSync(dst, page(rel, head));
  n++;
}
// 목록에 없는 경로(나중에 생긴 주소 등)도 넘기기
writeFileSync(join(OUT, "404.html"), page("404.html"));
writeFileSync(join(OUT, ".nojekyll"), "");
writeFileSync(join(OUT, "README.md"), "리딩노트가 새 주소로 옮겨 갔어요.\n");
console.log(`이동 페이지 ${n}개 (미리보기 카드 유지 ${cards}개) + 404 · 새 주소 ${NEW}`);
