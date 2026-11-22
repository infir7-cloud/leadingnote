// 리딩노트 · 첫 화면 크기 한도 (build.mjs 가 마지막에 불러요)
// 앱을 처음 열 때 받는 파일(app/index.html → 거기서 부르는 js·css → 홈 화면 ln.html → 거기서 부르는 js)을
// 배포본(dist) 기준으로 모두 더해서, 한도를 넘으면 경고를 띄워요. 빌드는 멈추지 않아요.
// - 실제로 오가는 크기는 gzip 압축 뒤 크기라서 그걸로 재요. 압축 전 크기도 같이 보여줘요.
// - 바깥 주소(구글 글꼴, 수파베이스 라이브러리, 광고)는 우리 파일이 아니라서 빼요.
// - 한도를 바꾸려면 아래 LIMIT_KB 숫자만 고치면 돼요. Cloudflare 환경변수 LN_BUDGET_KB 로도 바꿀 수 있어요.
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, relative, normalize } from "node:path";
import { gzipSync } from "node:zlib";

const LIMIT_KB = Number(process.env.LN_BUDGET_KB || 420); // gzip 기준. 11/22 측정 약 400KB (그중 ln-data.js 가 160KB) → 5% 여유
const START = ["app/index.html", "app/ln.html"];
// 파일 안에서 다른 우리 파일을 부르는 자리: src="a.js?v=..", href="b.css?v=..", 'c.js?v=..'
const REF = /["'(]([A-Za-z0-9_\-./]*?[A-Za-z0-9_\-]+\.(?:js|css))(?:\?v=[A-Za-z0-9._-]*)?["')]/g;

export function firstScreen(OUT) {
  const seen = new Map(), queue = [...START];
  while (queue.length) {
    const rel = queue.shift();
    if (seen.has(rel)) continue;
    const p = join(OUT, rel);
    if (!existsSync(p)) continue;
    const buf = readFileSync(p);
    seen.set(rel, { raw: buf.length, gz: gzipSync(buf, { level: 9 }).length });
    const text = buf.toString("utf8");
    for (const m of text.matchAll(REF)) {
      const ref = m[1];
      if (/^(https?:)?\/\//.test(ref)) continue;
      const next = normalize(join(dirname(rel), ref)).split("\\").join("/");
      if (next.startsWith("..") || !existsSync(join(OUT, next))) continue;
      queue.push(next);
    }
  }
  let raw = 0, gz = 0;
  for (const v of seen.values()) { raw += v.raw; gz += v.gz; }
  const kb = (n) => (n / 1024).toFixed(0) + "KB";
  console.log(`첫 화면 파일 ${seen.size}개 · ${kb(raw)} (gzip ${kb(gz)}) · 한도 gzip ${LIMIT_KB}KB`);
  if (gz > LIMIT_KB * 1024) {
    const top = [...seen.entries()].sort((a, b) => b[1].gz - a[1].gz).slice(0, 5).map(([f, v]) => `${f} ${kb(v.gz)}`).join(", ");
    console.warn(`! 첫 화면 크기가 한도를 넘었어요: gzip ${kb(gz)} > ${LIMIT_KB}KB · 큰 파일: ${top}`);
  }
  return { files: [...seen.keys()], raw, gz };
}

// 따로 돌려 보기: node scripts/budget.mjs
if (import.meta.url === "file://" + process.argv[1]) {
  const r = firstScreen(join(process.cwd(), "dist"));
  console.log(r.files.join("\n"));
}
