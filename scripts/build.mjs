// 리딩노트 · 배포본 만들기 (Cloudflare Pages 빌드 명령: npm run build, 출력 폴더: dist)
// - 원본은 저장소에 그대로 두고, dist/ 에는 주석과 공백을 뺀 파일만 넣어요. 소스맵은 만들지 않아요.
// - 압축 세기는 파일별로 정해요 (11/22).
//   · 기본(full): 이름 줄이기(mangle)와 코드 다듬기(compress)까지 해요. 전역 이름(window 에 붙는 함수·변수)은 그대로 둬요.
//   · 약하게(light): 주석·공백만 빼요. 다른 파일이 이 파일 함수의 '소스 글자'를 찾아 고치는 곳이라 코드 모양이 바뀌면 안 돼요.
//     지금은 community.html 하나예요(app/ 과 맨 바깥 사본) (ln-theme.js 의 cmPatch, community-live.js 의 patchFn 이 고쳐요).
//   · 비상 스위치: Cloudflare 환경변수 LN_MIN=light 를 넣으면 모든 파일을 예전처럼 약하게만 압축해요.
//   빌드 뒤 verify-build.mjs 가 '바꿀 자리'가 그대로 있는지 확인해요. ln.html 은 이제 글자 바꾸기 대신 LN.slot 칸을 써요.
import { readdirSync, statSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync, existsSync } from "node:fs";
import { join, extname, relative, dirname } from "node:path";
import { minify as minifyJs } from "terser";
import { minify as minifyHtml } from "html-minifier-terser";
import { stamp } from "./stamp.mjs";
import { firstScreen } from "./budget.mjs";

const ROOT = process.cwd();
const OUT = join(ROOT, "dist");
// 배포하지 않는 것
const SKIP = new Set([".git", ".github", "node_modules", "scripts", "dist", "cf", "package.json", "package-lock.json", ".gitignore", "README.md", "redirect-repo"]);
const SKIP_EXT = new Set([".map", ".md", ".sql", ".mjs"]);
// 이미 압축된 외부 라이브러리는 그대로 복사해요
const AS_IS = new Set(["supabase.js"]);
// 시세 계약 전에는 한국거래소 종가 파일(tools-data.js)을 배포하지 않아요. 계약 뒤 Cloudflare 환경변수 LN_PX_DATA=1 로 켜요.
const PX_DATA = process.env.LN_PX_DATA === "1";
// 맨 바깥의 옛 앱 사본(지금은 app/ 아래가 진짜예요). 옛 주소로 오면 _redirects 가 app/ 으로 보내요.
const LEGACY_ROOT = new Set(["ln.html", "tools.html", "tools-data.js", "ln-plus.js", "ln-theme.js", "ln-data.js"]);

const TERSER = {
  compress: false,
  mangle: false,
  sourceMap: false,
  format: { comments: false, quote_style: 3, ascii_only: false, semicolons: true, wrap_func_args: false, wrap_iife: false, braces: false },
};
// 강하게 압축할 때 설정. 전역 이름은 그대로(toplevel:false), 오래된 아이폰 사파리 버그 피하기(safari10),
// 'typeof x=="undefined"' 를 바꾸지 않기(typeofs:false · 없는 전역을 만나면 오류가 날 수 있어서)
const TERSER_FULL = {
  ...TERSER,
  compress: { passes: 2, toplevel: false, typeofs: false, keep_fargs: true, keep_infinity: true, unsafe: false, pure_getters: false, drop_console: false },
  mangle: { toplevel: false, safari10: true },
  safari10: true,
};
// 다른 파일이 소스 글자를 찾아 고치는 파일 (저장소 기준 경로). 여기 있는 파일은 약하게만 압축해요.
const LIGHT = new Set(["app/community.html", "community.html"]); // 맨 바깥 community.html 은 옛 주소용 사본이에요
const ALL_LIGHT = process.env.LN_MIN === "light";
const level = (rel) => (ALL_LIGHT || LIGHT.has(rel.split("\\").join("/")) ? "light" : "full");

async function js(code, where, lv = "light") {
  const r = await minifyJs(code, lv === "full" ? TERSER_FULL : TERSER);
  if (!r.code) throw new Error("JS 압축 실패: " + where);
  return r.code;
}
async function html(code, where) {
  return minifyHtml(code, {
    collapseWhitespace: true,
    conservativeCollapse: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: false, // 인라인 스크립트는 아래 inlineJs 단계에서 terser로 따로 압축해요
    keepClosingSlash: true,
    caseSensitive: true,
    processScripts: [],
  }).catch((e) => { throw new Error("HTML 압축 실패: " + where + " · " + e.message); });
}
// <script> 안의 인라인 코드만 terser로 압축 (src가 있는 것, type이 JS가 아닌 것은 건드리지 않아요)
async function inlineJs(code, where, lv) {
  const re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi;
  let out = "", last = 0, m, i = 0;
  while ((m = re.exec(code))) {
    const attrs = m[1] || "", body = m[2];
    out += code.slice(last, m.index);
    const isJs = !/\bsrc\s*=/.test(attrs) && (!/\btype\s*=/.test(attrs) || /type\s*=\s*["']?(text\/javascript|module)["']?/i.test(attrs));
    if (isJs && body.trim()) {
      i++;
      const min = await js(body, where + " 인라인 스크립트 " + i, lv);
      out += "<script" + attrs + ">" + min.replace(/<\/script/gi, "<\\/script") + "</script>";
    } else out += m[0];
    last = re.lastIndex;
  }
  return out + code.slice(last);
}

function walk(dir, list = []) {
  for (const name of readdirSync(dir)) {
    if (dir === ROOT && SKIP.has(name)) continue;
    if (dir === ROOT && LEGACY_ROOT.has(name)) continue;
    if (name === "tools-data.js" && !PX_DATA) continue;
    const p = join(dir, name), st = statSync(p);
    if (st.isDirectory()) walk(p, list);
    else if (!SKIP_EXT.has(extname(name))) list.push(p);
  }
  return list;
}

if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

let before = 0, after = 0, n = 0, full = 0, light = 0;
for (const src of walk(ROOT)) {
  const rel = relative(ROOT, src), dst = join(OUT, rel), ext = extname(src).toLowerCase();
  mkdirSync(dirname(dst), { recursive: true });
  const base = rel.split("/").pop();
  if ((ext === ".js" || ext === ".html" || ext === ".css") && !AS_IS.has(base)) {
    const code = readFileSync(src, "utf8");
    let min; const lv = level(rel); lv === "full" ? full++ : light++;
    if (ext === ".js") min = await js(code, rel, lv);
    else if (ext === ".css") min = (await minifyHtml("<style>" + code + "</style>", { minifyCSS: true })).replace(/^<style>|<\/style>$/g, "");
    else min = await html(await inlineJs(code, rel, lv), rel);
    writeFileSync(dst, min);
    before += code.length; after += min.length; n++;
  } else copyFileSync(src, dst);
}
// 새 사이트 주소(Cloudflare 환경변수 LN_SITE)가 있으면, 아직 다시 만들지 않은 카드 파일 속 옛 주소도 바꿔요
const SITE = (process.env.LN_SITE || "").replace(/\/+$/, "");
if (SITE) {
  const OLD = "https://infir7-cloud.github.io/leadingnote";
  const fix = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) fix(p); else if (/\.html$/.test(n)) { const t = readFileSync(p, "utf8"); if (t.includes(OLD)) writeFileSync(p, t.split(OLD).join(SITE)); } } };
  fix(OUT);
}
// 파일 주소의 ?v= 를 내용 지문으로 (cf/_headers 의 1년 저장과 짝이에요)
const stamped = stamp(OUT);
// Cloudflare Pages 설정 파일
for (const f of ["_headers", "_redirects"]) if (existsSync(join(ROOT, "cf", f))) copyFileSync(join(ROOT, "cf", f), join(OUT, f));
console.log(`압축 ${n}개 파일(강하게 ${full} · 약하게 ${light}${ALL_LIGHT ? " · LN_MIN=light" : ""}) · ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB · 주소 지문 ${stamped}곳`);
// 첫 화면 크기 한도 (넘으면 경고만 하고 빌드는 계속해요)
firstScreen(OUT);
