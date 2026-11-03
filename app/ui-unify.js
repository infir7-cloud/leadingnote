/* 리딩노트 · 버튼·박스 모양을 하나로 맞춰요 (ui-unify.js v2)
   index.html(셸)에서 불러요. 각 탭 화면(iframe: ln · tools · community)에 같은 CSS를 넣어요.
   V2 규칙
   - 카드(박스) 모서리 20px, 버튼 모서리 12~16px
   - 누르는 것은 최소 44px, 주요 버튼은 56px
   - 노란 띠(카카오 가입 안내)는 흰 카드로 정리하고 노란색은 아이콘 칸에만 남겨요
   - 회색 화살표 알약(더 보기 · 바로가기)은 테두리 있는 버튼으로 정리해요
   - 칩(고르는 단추)과 배지(작은 표시)는 한 가지 모양으로
   - 밝은 화면/어두운 화면 모두 같은 규칙 (정보 탭은 html.lite, 도구·커뮤니티는 data-theme 방식) — 색은 화면별 변수(--surface, --line 등)만 써요
   아래 메뉴(하단 GNB)는 B안부터 셸의 5탭(shell-b.js)으로 바뀌어 각 화면 안에서는 숨겨요. */
(function(){
  if (window.__uiUnify) return; window.__uiUnify = true;
  var P = 'html body ';
  var CSS = [
    /* ── 안쪽 아래 메뉴: 셸 5탭이 대신해요 */
    P + 'nav.nav.nav.nav,' + P + 'nav#nav.nav{display:none!important}',

    /* ── 공통 크기 */
    ':root{--v2-card:20px;--v2-btn:14px;--v2-btn-l:16px;--v2-chip:999px;--v2-badge:6px}',

    /* ── 정보(ln) 박스 */
    P + '.t2-sec{border-radius:var(--v2-card)!important}',
    P + '.p-bc,' + P + '.p-bc-top,' + P + '.p-pick,' + P + '.p-lead,' + P + '.mn-card,' + P + '.p-kv>div{border-radius:var(--v2-card)!important}',
    P + '.p-bc-top{border-radius:16px!important}',
    /* 노란 띠 → 흰 카드 + 노란 아이콘 칸 */
    P + '.t2-cta.t2-cta,' + P + '.t2-cta[data-a="join"]{background:var(--surface)!important;color:var(--ink)!important;border-radius:var(--v2-card)!important;box-shadow:inset 0 0 0 1px var(--line)!important;min-height:64px}',
    P + '.t2-cta[data-a="join"] small{color:var(--ink2)!important}',
    P + '.t2-cta[data-a="join"] .bell{background:#FEE500!important}',
    P + '.t2-cta[data-a="join"] .bell svg{stroke:#191600!important}',
    P + '.t2-cta[data-a="join"] svg:not(.bell svg){stroke:var(--ink2)!important}',
    /* 회색 화살표 알약 → 테두리 버튼 */
    P + '.p-go{min-height:56px;border-radius:var(--v2-btn-l)!important;background:var(--surface)!important;box-shadow:inset 0 0 0 1px var(--line)!important;padding:0 1.25rem!important}',
    P + '.t2-mkt a{min-height:48px;display:flex;align-items:center;border-radius:var(--v2-btn)!important;box-shadow:inset 0 0 0 1px var(--line)}',
    /* 버튼 */
    P + '.btn{border-radius:var(--v2-btn)!important;min-height:44px}',
    P + '.btn-primary,' + P + '.btn-ink,' + P + '.btn-block.btn-primary{min-height:56px;border-radius:var(--v2-btn-l)!important}',
    P + '.p-btn{height:auto!important;min-height:56px;border-radius:var(--v2-btn-l)!important}',
    P + '.p-bcb{height:auto!important;min-height:44px;border-radius:12px!important;padding:0 1rem!important}',
    P + '.p-xgo,' + P + '.p-lu button{min-height:44px;border-radius:12px!important}',
    P + '.icon-btn,' + P + '.top-q{min-width:44px;min-height:44px}',
    /* 칩 (고르는 단추) */
    P + '.p-tchips button,' + P + '.chips button,' + P + '.chip-btn{min-height:44px;border-radius:var(--v2-chip)!important;padding:0 1rem!important;font-weight:700!important}',
    P + '.p-tchips button[aria-pressed="true"],' + P + '.chips button[aria-pressed="true"]{background:var(--accent)!important;color:var(--on-accent)!important;box-shadow:none!important;border-color:var(--accent)!important}',
    P + '.p-tsel select{min-height:44px;border-radius:12px!important}',
    /* 배지 (작은 표시) */
    P + '.tag,' + P + '.chip,' + P + '.p-bc-st,' + P + '.kd,' + P + '.lk,' + P + '.mn-k,' + P + '.p-bc .pk>span{border-radius:var(--v2-badge)!important;font-weight:800!important;letter-spacing:0}',

    /* ── 도구 · 커뮤니티 박스 */
    P + '.tile,' + P + '.lesson-cta,' + P + '.card,' + P + '.livebox,' + P + '.banner,' + P + '.report,' + P + '.box{border-radius:var(--v2-card)!important}',
    P + '.link{min-height:44px}',
    P + 'input:not([type=checkbox]):not([type=radio]):not([type=range]),' + P + 'select{border-radius:12px}',

    /* ── 손가락으로 누르기 쉽게: 너무 작은 버튼 막기 */
    P + 'button.sm,' + P + '.btn-sm{min-height:44px!important}'
  ].join('\n');
  function put(f){
    var d; try { d = f.contentDocument; } catch (e) { return; }
    if (!d || !d.head || !/(ln|tools|community)\.html/.test(d.URL || '')) return;
    var old = d.getElementById('uu-nav'); if (old) old.remove();
    if (d.getElementById('uu-v2')) { if (d.head.lastElementChild !== d.getElementById('uu-v2')) d.head.appendChild(d.getElementById('uu-v2')); return; }
    var st = d.createElement('style'); st.id = 'uu-v2'; st.textContent = CSS; d.head.appendChild(st);
  }
  function scan(){
    Array.prototype.forEach.call(document.querySelectorAll('iframe'), function(f){
      if (!f.__uu) { f.__uu = true; f.addEventListener('load', function(){ put(f); }); }
      put(f);
    });
  }
  scan(); setInterval(scan, 1500);
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();
