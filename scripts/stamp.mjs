// 리딩노트 · 배포본 파일 주소에 '내용 지문(?v=)' 붙이기 (build.mjs 가 압축 뒤에 불러요)
//
// 왜: cf/_headers 에서 ?v= 가 붙는 js·css·그림을 브라우저가 1년 동안 저장하게 했어요(immutable).
//     그러면 파일 내용이 바뀌었는데 ?v= 숫자를 안 바꾸면, 손님 휴대폰이 1년 동안 옛 파일을 써요.
//     그래서 손으로 적은 ?v= 숫자 대신, 빌드할 때 파일 내용으로 만든 짧은 지문(예: ?v=3fa9c21b)으로 바꿔 넣어요.
//     내용이 한 글자라도 바뀌면 지문이 바뀌니, 숫자 올리는 걸 잊어도 안전해요.
//
// 규칙
// - 'xxx.js?v=…', 'xxx.css?v=…', 'xxx.png?v=…' 처럼 ?v= 가 붙은 같은 사이트 안 주소만 바꿔요 (바깥 주소는 그대로).
// - 가리키는 파일이 배포본(dist)에 없으면 그대로 둬요.
// - A 파일이 B 파일 주소를 품고 있으면, B 지문이 바뀔 때 A 지문도 바뀌게 해요 (A를 오래 저장한 휴대폰도 새 B를 받게).
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, relative, extname } from "node:path";
import { createHash } from "node:crypto";

const TEXT = new Set([".html", ".js", ".css"]);
const REF = /([A-Za-z0-9_\-./]*?[A-Za-z0-9_\-]+\.(?:js|css|png|jpe?g|webp|svg|ico|json|woff2?))\?v=[A-Za-z0-9._-]*/g;

export function stamp(OUT) {
  const all = [];
  (function walk(d) { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? walk(p) : all.push(p); } })(OUT);
  const text = all.filter((f) => TEXT.has(extname(f)));
  const body = new Map(text.map((f) => [f, readFileSync(f, "utf8")]));
  const target = (from, ref) => {
    if (/^(https?:)?\/\//.test(ref)) return null;
    const p = ref.startsWith("/") ? join(OUT, ref) : join(dirname(from), ref);
    return existsSync(p) && statSync(p).isFile() ? p : null;
  };
  // 누가 누구를 가리키는지
  const deps = new Map();
  for (const f of text) {
    const s = new Set();
    for (const m of body.get(f).matchAll(REF)) { const t = target(f, m[1]); if (t && t !== f) s.add(t); }
    deps.set(f, s);
  }
  // 지문 = 내 내용(?v= 값은 빼고) + 내가 가리키는 파일들의 지문. 서로 가리키는 고리가 있으면 고리 안에서는 내용만 써요.
  const memo = new Map(), busy = new Set();
  const raw = (f) => (body.has(f) ? body.get(f).replace(REF, "$1?v=") : readFileSync(f));
  const fp = (f) => {
    if (memo.has(f)) return memo.get(f);
    const h = createHash("sha256").update(raw(f));
    if (!busy.has(f)) {
      busy.add(f);
      for (const d of [...(deps.get(f) || [])].sort()) if (!busy.has(d)) h.update(relative(OUT, d) + ":" + fp(d));
      busy.delete(f);
    }
    const v = h.digest("hex").slice(0, 8);
    memo.set(f, v);
    return v;
  };
  let n = 0;
  for (const f of text) {
    const before = body.get(f);
    const after = before.replace(REF, (all, ref) => { const t = target(f, ref); if (!t) return all; n++; return ref + "?v=" + fp(t); });
    if (after !== before) writeFileSync(f, after);
  }
  return n;
}
