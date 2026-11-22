// 리딩노트 · 배포본 만들기 (Cloudflare Pages 빌드 명령: npm run build, 출력 폴더: dist)
// - 원본은 저장소에 그대로 두고, dist/ 에는 주석과 공백을 뺀 파일만 넣어요. 소스맵은 만들지 않아요.
// - 이름 바꾸기(mangle)와 코드 변형(compress)은 하지 않아요.
//   live-data.js 등이 ln.html 함수의 소스 문자열을 찾아 바꾸는 방식이라, 코드 모양이 바뀌면 화면이 조용히 틀어지기 때문이에요.
//   대신 빌드 뒤 verify-build.mjs 가 바꿀 자리가 그대로 있는지 확인해요.
import { readdirSync, statSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync, existsSync } from "node:fs";
import { join, extname, relative, dirname } from "node:path";
import { minify as minifyJs } from "terser";
import { minify as minifyHtml } from "html-minifier-terser";

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

async function js(code, where) {
  const r = await minifyJs(code, TERSER);
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
async function inlineJs(code, where) {
  const re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi;
  let out = "", last = 0, m, i = 0;
  while ((m = re.exec(code))) {
    const attrs = m[1] || "", body = m[2];
    out += code.slice(last, m.index);
    const isJs = !/\bsrc\s*=/.test(attrs) && (!/\btype\s*=/.test(attrs) || /type\s*=\s*["']?(text\/javascript|module)["']?/i.test(attrs));
    if (isJs && body.trim()) {
      i++;
      const min = await js(body, where + " 인라인 스크립트 " + i);
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

let before = 0, after = 0, n = 0;
for (const src of walk(ROOT)) {
  const rel = relative(ROOT, src), dst = join(OUT, rel), ext = extname(src).toLowerCase();
  mkdirSync(dirname(dst), { recursive: true });
  const base = rel.split("/").pop();
  if ((ext === ".js" || ext === ".html" || ext === ".css") && !AS_IS.has(base)) {
    const code = readFileSync(src, "utf8");
    let min;
    if (ext === ".js") min = await js(code, rel);
    else if (ext === ".css") min = (await minifyHtml("<style>" + code + "</style>", { minifyCSS: true })).replace(/^<style>|<\/style>$/g, "");
    else min = await html(await inlineJs(code, rel), rel);
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
// Cloudflare Pages 설정 파일
for (const f of ["_headers", "_redirects"]) if (existsSync(join(ROOT, "cf", f))) copyFileSync(join(ROOT, "cf", f), join(OUT, f));
console.log(`압축 ${n}개 파일 · ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB`);
