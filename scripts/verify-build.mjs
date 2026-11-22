// 리딩노트 · 배포본 점검 (npm run build 가 압축 뒤에 자동으로 실행해요)
// 1) dist 의 모든 JS와 인라인 스크립트가 문법 오류 없이 읽히는지
// 2) live-data.js 등이 '소스 문자열 찾아 바꾸기'로 고치는 자리가, 압축 뒤에도 그대로 남아 있는지
// 3) 소스맵·개인 흔적이 배포본에 없는지
// 하나라도 실패하면 빌드를 멈춰서 깨진 화면이 배포되지 않게 해요.
import { readdirSync, statSync, readFileSync } from "node:fs";
import { join, extname, relative } from "node:path";
import * as acorn from "acorn";

const ROOT = process.cwd(), OUT = join(ROOT, "dist");
const SKIP = new Set([".git", ".github", "node_modules", "scripts", "dist", "redirect-repo"]);
const files = (dir, top = dir, list = []) => {
  for (const n of readdirSync(dir)) {
    if (dir === top && SKIP.has(n)) continue;
    const p = join(dir, n);
    statSync(p).isDirectory() ? files(p, top, list) : list.push(p);
  }
  return list;
};
const scripts = (html) => [...html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .filter((m) => !/\bsrc\s*=/.test(m[1] || "") && (!/\btype\s*=/.test(m[1] || "") || /javascript|module/i.test(m[1])))
  .map((m) => m[2]);
const parse = (code) => acorn.parse(code, { ecmaVersion: "latest", sourceType: "script", allowReturnOutsideFunction: true });

let fail = 0;
const bad = (msg) => { fail++; console.error("✗ " + msg); };

// 1) 문법
for (const f of files(OUT)) {
  const ext = extname(f), rel = relative(OUT, f);
  if (ext === ".map") bad("소스맵이 배포본에 있어요: " + rel);
  if (ext === ".js") { try { parse(readFileSync(f, "utf8")); } catch (e) { bad(`문법 오류 ${rel}: ${e.message}`); } }
  if (ext === ".html") scripts(readFileSync(f, "utf8")).forEach((s, i) => { try { parse(s); } catch (e) { bad(`문법 오류 ${rel} 인라인 ${i + 1}: ${e.message}`); } });
}

// 2) 소스 문자열 바꾸기 자리
const src = files(ROOT).filter((f) => /\.(js|html)$/.test(f) && !f.endsWith("supabase.js"));
const patchers = src.filter((f) => /split\(p\[0\]\)|\.eval\(/.test(readFileSync(f, "utf8")));
const needles = new Set();
for (const f of patchers) {
  const text = readFileSync(f, "utf8");
  const codes = f.endsWith(".html") ? scripts(text) : [text];
  for (const c of codes) {
    let ast; try { ast = parse(c); } catch { continue; }
    (function visit(n) {
      if (!n || typeof n.type !== "string") return;
      if (n.type === "Literal" && typeof n.value === "string" && n.value.length >= 12) needles.add(n.value);
      for (const k in n) { const v = n[k]; if (Array.isArray(v)) v.forEach(visit); else if (v && typeof v.type === "string") visit(v); }
    })(ast);
  }
}
// 사이트의 patchFn 과 같은 규칙: 그대로 없으면 공백 차이를 무시하고 찾아요
const find = (s, a) => s.includes(a) || new RegExp(a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s*")).test(s);
const targets = src.filter((f) => f.endsWith(".html"));
let checked = 0;
for (const t of targets) {
  const rel = relative(ROOT, t), before = readFileSync(t, "utf8");
  let after; try { after = readFileSync(join(OUT, rel), "utf8"); } catch { continue; }
  for (const n of needles) {
    if (!/[(){}=+;]/.test(n)) continue;          // 코드 조각처럼 생긴 것만 (일반 문구는 빼요)
    if (before.includes(n)) { checked++; if (!find(after, n)) bad(`압축 뒤 바꿀 자리가 사라졌어요 · ${rel} · ${n.slice(0, 70)}`); }
  }
}

// 3) 흔적
for (const f of files(OUT)) {
  if (!/\.(js|html|json|txt)$/.test(f) || f.endsWith("supabase.js")) continue;
  const t = readFileSync(f, "utf8"), rel = relative(OUT, f);
  for (const w of [/[A-Za-z0-9._%+-]+@(gmail|naver|daum|hanmail|kakao|icloud|outlook)\.(com|net)/i, /\/Users\/[A-Za-z]/, /C:\\\\Users/i, /\/home\/[a-z]/]) if (w.test(t)) bad(`개인 흔적(${w}) · ${rel}`);
}
// 4) 시세: 계약 전(LN_PX_DATA≠1)에는 거래소 종가 파일과 네이버 차트 그림 주소가 배포본에 없어야 해요
if (process.env.LN_PX_DATA !== "1") for (const f of files(OUT)) if (f.endsWith("tools-data.js")) bad("시세 계약 전인데 종가 파일이 배포본에 있어요: " + relative(OUT, f));
for (const f of files(OUT)) { if (!/\.(js|html)$/.test(f)) continue; if (readFileSync(f, "utf8").includes("pstatic.net/imgfinance")) bad("네이버 차트 그림을 직접 불러오는 곳이 남았어요: " + relative(OUT, f)); }
const oldHost = files(OUT).filter((f) => f.endsWith(".html") && readFileSync(f, "utf8").includes("infir7-cloud.github.io")).length;
if (oldHost) console.warn(`! 옛 주소(infir7-cloud.github.io)가 남은 파일 ${oldHost}개 · l/ 카드 파일이면 다음 카드 생성 때 새 주소로 바뀌어요`);

// 5) 1년 저장(cf/_headers)과 짝: 우리 js·css 를 ?v= 없이 부르는 곳이 있으면 고친 내용이 1년 동안 안 보일 수 있어서 멈춰요
//    새 파일을 붙일 때는 주소 끝에 ?v=1 처럼 붙여 주세요. 빌드가 내용 지문으로 바꿔 넣어요.
for (const f of files(OUT)) {
  if (!/\.(js|html|css)$/.test(f) || f.endsWith("supabase.js")) continue;
  const t = readFileSync(f, "utf8");
  for (const m of t.matchAll(/["']([^"'\s<>]+\.(?:js|css))["']/g)) {
    const u = m[1]; if (u.includes("://") || u.startsWith("//")) continue;
    const p = join(f, "..", u);
    try { if (statSync(p).isFile()) bad(`?v= 없이 부르는 파일이 있어요 · ${relative(OUT, f)} → ${u}`); } catch {}
  }
}
console.log(`점검: 바꿀 자리 ${checked}곳 확인 · 문제 ${fail}건`);
if (fail) process.exit(1);
