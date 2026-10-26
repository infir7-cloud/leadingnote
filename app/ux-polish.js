/* 리딩노트 · 쓰기 편하게 다듬기 (ux-polish.js)
   index.html(맨 바깥 셸)의 <head> 안에 <script src="ux-polish.js"></script> 한 줄만 넣으면 동작해요.
   (</body> 바로 앞에 넣어도 동작하지만, <head>에 넣어야 처음 오신 분을 정확히 알아봐요.)
   세 서비스 화면 코드는 고치지 않고, 바깥에서 아래를 덧붙여요.
   1) 처음 오신 분: 시작 화면(글자 크기 → 무엇이 궁금하세요?), 기본값 '크게'·밝은 화면
   2) 첫 방문 동안 공지·위 광고·가입 띠·앱 설치 버튼 숨기기, 가입 띠는 닫으면 7일 동안 숨기기
   3) 모든 화면 위쪽 '가 글자' 버튼(한 번에 글자 크기·밝기), 아이콘 아래 글자(찾기·알림)
   4) 리딩 모음 홈: 소개 묶음 대신 '지금 방송 중 전문가'를 첫 화면에
   5) 커뮤니티 홈: '이번 주 토론'을 맨 위로 / 투자 도구 홈: 급등 묶음은 검색 안으로, 홈엔 큰 회사만
   6) 전문가 종목 리딩(펼침·닫힘)을 카드로 또렷하게, 여백·글자 크기 다듬기
   7) 시안용 기능(권한 바꿔 보기·처음 상태로 되돌리기) 숨기기, 문구 다듬기
   8) 맨 위 머리: 왼쪽 로고(= 전체 메뉴 버튼) + 오른쪽 서비스 탭(서비스 색 굵은 밑줄)
   주소 끝에 #uxreset 을 붙여 열면 '처음 오신 분' 상태를 다시 볼 수 있어요(시험용).
   시안용 기능이 필요하면 주소에 ?demo=1 을 붙여 열어요. */
(function(){
  if (window.__uxPolish) return; window.__uxPolish = true;
  var UK = 'lnux.v1', DAY = 864e5;
  function lsGet(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v){ try { localStorage.setItem(k, v); } catch (e) {} }
  function lsDel(k){ try { localStorage.removeItem(k); } catch (e) {} }
  function ssGet(k){ try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v){ try { sessionStorage.setItem(k, v); } catch (e) {} }

  // 공유 링크(바깥 주소 #ln/…)로 들어오면 셸이 그 화면을 바로 열도록 주소를 넘겨받아요
  try {
    if (window.parent !== window && !(location.hash || '').length) {
      var ph = window.parent.location.hash || '';
      if (/^#(ln|tools|cm)\/[A-Za-z0-9_\-]+$/.test(ph)) {
        history.replaceState(null, '', location.pathname + location.search + ph);
        try { window.parent.history.replaceState(window.parent.history.state, '', window.parent.location.pathname + window.parent.location.search); } catch (e) {}
      }
    }
  } catch (e) {}
  if (location.hash === '#uxreset') {
    ['site.v1', 'leadingnote.v5', 'tools.v1', 'agora.v1', UK].forEach(lsDel);
    try { sessionStorage.removeItem('lnux.s'); history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    location.reload(); return;
  }
  var DEMO = /[?&]demo=1/.test(location.search) || lsGet('lnux.demo') === '1';

  // ---- 방문 기록 (이 기기 안에서만)
  var U = {}; try { U = JSON.parse(lsGet(UK)) || {}; } catch (e) { U = {}; }
  var HEAD = document.readyState === 'loading' && !document.getElementById('shell');
  var site0 = null; try { site0 = JSON.parse(lsGet('site.v1')); } catch (e) {}
  // <head>에 있으면 셸보다 먼저 돌아서 '처음'을 정확히 알아요. 늦게 붙었으면 아직 아무 설정도 안 바꾼 기기를 처음으로 봐요.
  var brandNew = !lsGet(UK) && (HEAD ? !site0 : !!site0 && site0.size === 'm' && site0.theme === 'dark' && !site0.noticeClosed);
  if (!ssGet('lnux.s')) { ssSet('lnux.s', '1'); U.visits = (U.visits || 0) + 1; U.last = Date.now(); }
  if (brandNew) U.onb = 0; else if (U.onb == null) U.onb = 1;
  function saveU(){ lsSet(UK, JSON.stringify(U)); }
  saveU();
  var FIRST = (U.visits || 1) <= 1;
  function noJoin(){ return FIRST || (U.joinUntil && U.joinUntil > Date.now()); }

  function SH(){ return window.__shell || null; }
  var root = document.documentElement;
  root.classList.add('ux'); if (FIRST) root.classList.add('ux-first');

  // ---- 셸 설정 바꾸기 (글자 크기·밝기를 세 서비스에 한 번에)
  function applyAllX(){
    var sh = SH(); if (!sh) return;
    var C = sh.C, wide = window.matchMedia('(min-width:960px)').matches;
    root.setAttribute('data-theme', C.theme); root.setAttribute('data-size', C.size);
    var m = document.querySelector('meta[name="theme-color"]'); if (m) { var bg = getComputedStyle(root).getPropertyValue('--bg').trim(); if (bg) m.content = bg; }
    lsSet('site.v1', JSON.stringify(C));
    Object.keys(sh.F || {}).forEach(function(id){ try { var w = sh.F[id].contentWindow; if (sh.READY[id] && w && w.__site) w.__site.apply(Object.assign({}, C, { wide: wide })); } catch (e) {} });
  }
  // 처음 오신 분 기본값: 글자 '크게' · 밝은 화면
  if (brandNew) {
    if (HEAD) lsSet('site.v1', JSON.stringify({ size: 'l', theme: 'light' }));
    else if (SH()) { SH().C.size = 'l'; SH().C.theme = 'light'; applyAllX(); }
  }
  function openSettings(){ var sh = SH(); if (sh && sh.openSettings) sh.openSettings(); }

  // ---- 셸 모양
  var SHELL_CSS = [
    'html.ux-first #notice,html.ux-first #ad-top{display:none!important}',
    /* 맨 위 머리: 로고(= 메뉴) + 밑줄 탭 */
    '#menubtn{display:none!important}',
    '.sh-brand{display:none!important}',
    '.sh-in{align-items:center!important;gap:.6rem;padding-top:.4rem!important;padding-bottom:0!important}',
    '.hx-logo{flex:none;display:flex;align-items:center;gap:.55rem;min-height:2.9rem;margin-bottom:.4rem;padding:0 .2rem 0 0;border:0;background:transparent;color:var(--ink);font:inherit;cursor:pointer;border-radius:.9rem}',
    '.hx-mark{position:relative;flex:none;width:2.9rem;height:2.9rem;border-radius:.85rem;display:flex;align-items:center;justify-content:center;background:var(--surface);border:1px solid var(--line);box-shadow:0 1px 2px rgba(15,23,42,.06),0 4px 12px -6px rgba(15,23,42,.18)}',
    '.hx-mark svg{width:1.8rem;height:1.8rem}',
    '.hx-cap{position:absolute;left:50%;bottom:-.55rem;transform:translateX(-50%);padding:.05rem .35rem;border-radius:999px;background:var(--ink);color:var(--bg);font-size:.625rem;font-weight:800;line-height:1.3;letter-spacing:.02em;white-space:nowrap}',
    '.hx-word{display:none;flex-direction:column;line-height:1.15;text-align:left}',
    '.hx-word b{font-size:1.125rem;font-weight:800;letter-spacing:-.03em}.hx-word small{font-size:.75rem;color:var(--ink2);font-weight:600}',
    '.hx-logo:active .hx-mark{transform:scale(.96)}',
    '.tabs{flex:0 1 auto!important;margin-left:auto;display:flex!important;gap:1.1rem;align-self:stretch}',
    '.tab{min-height:3.4rem!important;padding:0 .1rem!important;font-size:1.0625rem!important;color:var(--ink2);gap:.35rem!important}',
    '.tab .tdot{display:none!important}',
    '.tab[data-tab="ln"]{--tc:var(--t-ln)}.tab[data-tab="tools"]{--tc:var(--t-tools)}.tab[data-tab="cm"]{--tc:var(--t-cm)}',
    '.tab[aria-selected="true"]{color:var(--ink);font-weight:800}',
    '.tab::after{left:0!important;right:0!important;height:4px!important;border-radius:4px 4px 0 0!important;background:var(--tc)!important}',
    '.tab:not([aria-selected="true"])::after{display:none}',
    '@media (min-width:960px){.hx-word{display:flex}.sh-in{max-width:none!important}.tabs{gap:1.75rem}}',
    '@media (max-width:959px){html[data-size="xl"] .tab{font-size:.9375rem!important}html[data-size="xl"] .tabs{gap:.7rem}}',
    '@media (max-width:359px){.tabs{gap:.6rem}.tab{font-size:.9375rem!important}}',
    /* 전체 메뉴 서랍 */
    '#hx-drawer{position:fixed;inset:0;z-index:96;display:flex}',
    '#hx-drawer .hx-scrim{position:absolute;inset:0;background:rgba(8,12,18,.5)}',
    '#hx-drawer .hx-panel{position:relative;width:min(23rem,88%);height:100%;overflow:auto;background:var(--bg);box-shadow:12px 0 40px rgba(0,0,0,.25);display:flex;flex-direction:column;gap:1.25rem;padding:calc(1rem + env(safe-area-inset-top,0px)) 16px calc(1.5rem + env(safe-area-inset-bottom,0px))}',
    '@media (prefers-reduced-motion:no-preference){#hx-drawer .hx-panel{animation:hxin .22s ease-out}@keyframes hxin{from{transform:translateX(-24px);opacity:0}to{transform:none;opacity:1}}}',
    '.hx-ph{display:flex;align-items:center;gap:.7rem}.hx-ph .hx-word{display:flex}.hx-ph .hx-x{margin-left:auto;width:2.75rem;height:2.75rem;border:0;border-radius:.75rem;background:var(--surface);color:var(--ink);font-size:1.5rem;line-height:1;cursor:pointer}',
    '.hx-set{display:flex;align-items:center;gap:.75rem;width:100%;min-height:3.5rem;padding:.6rem .9rem;border-radius:1rem;border:1px solid var(--line);background:var(--surface);color:var(--ink);font:inherit;font-size:1.0625rem;font-weight:700;text-align:left;cursor:pointer}',
    '.hx-set .g{flex:none;width:2.25rem;height:2.25rem;border-radius:.6rem;background:var(--raise);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:1.25rem}.hx-set i{margin-left:auto;font-style:normal;color:var(--ink2);font-weight:600}',
    '.hx-sec{display:flex;flex-direction:column;gap:.5rem}',
    '.hx-sh{margin:0;display:flex;align-items:center;gap:.5rem;font-size:1.0625rem;font-weight:800}.hx-sh .d{width:.7rem;height:.7rem;border-radius:3px;background:var(--tc)}.hx-sh em{font-style:normal;font-size:.8125rem;font-weight:700;padding:.05rem .45rem;border-radius:999px;background:color-mix(in srgb,var(--tc) 16%,transparent);color:var(--ink)}',
    '.hx-grid{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}',
    '.hx-it{min-height:3.25rem;padding:.55rem .8rem;border-radius:.85rem;border:1px solid var(--line);background:var(--surface);color:var(--ink);font:inherit;font-size:1rem;font-weight:600;text-align:left;cursor:pointer}',
    '.hx-it:active{background:color-mix(in srgb,var(--tc) 10%,var(--surface))}',
    '.hx-join{display:flex;flex-direction:column;gap:.35rem;padding:1rem;border-radius:1rem;background:var(--ink);color:var(--bg)}.hx-join b{font-size:1.125rem}.hx-join span{font-size:.9375rem;opacity:.8}',
    '.hx-join button{margin-top:.4rem;min-height:3rem;border:0;border-radius:.8rem;background:#FEE500;color:#191600;font:inherit;font-weight:800;font-size:1.0625rem;cursor:pointer}',
    '.hx-foot{display:flex;flex-direction:column;gap:.1rem}.hx-foot button{min-height:2.9rem;border:0;background:transparent;color:var(--ink2);font:inherit;font-size:1rem;text-align:left;padding:0 .2rem;cursor:pointer}',

    '#ux-onb{position:fixed;inset:0;z-index:95;background:var(--bg);color:var(--ink);overflow:auto;-webkit-overflow-scrolling:touch}',
    '#ux-onb *{box-sizing:border-box}',
    '.uo-in{max-width:30rem;margin:0 auto;min-height:100%;display:flex;flex-direction:column;gap:1.5rem;padding:calc(1.5rem + env(safe-area-inset-top,0px)) 20px calc(1.5rem + env(safe-area-inset-bottom,0px))}',
    '.uo-top{display:flex;align-items:center;justify-content:space-between;gap:1rem}',
    '.uo-dots{display:flex;gap:.4rem}.uo-dots i{width:.55rem;height:.55rem;border-radius:999px;background:var(--line)}.uo-dots i.on{width:1.5rem;background:var(--accent)}',
    '.uo-skip{border:0;background:transparent;color:var(--ink2);font:inherit;font-size:1rem;font-weight:600;min-height:2.75rem;padding:0 .25rem;text-decoration:underline;text-underline-offset:4px}',
    '.uo-k{margin:0;font-size:1rem;font-weight:700;color:var(--accent)}',
    '.uo-h{margin:.35rem 0 0;font-size:1.625rem;line-height:1.35;font-weight:800;letter-spacing:-.03em;word-break:keep-all}',
    '.uo-p{margin:.5rem 0 0;font-size:1.0625rem;line-height:1.6;color:var(--ink2);word-break:keep-all}',
    '.uo-sizes{display:flex;flex-direction:column;gap:.75rem}',
    '.uo-size{display:flex;align-items:center;gap:1rem;width:100%;min-height:4.75rem;padding:.9rem 1.1rem;border-radius:1rem;border:2px solid var(--line);background:var(--surface);color:var(--ink);font:inherit;text-align:left;cursor:pointer}',
    '.uo-size[aria-pressed="true"]{border-color:var(--accent);background:var(--acc-soft)}',
    '.uo-size .uo-r{flex:none;width:1.5rem;height:1.5rem;border-radius:50%;border:2px solid var(--line);display:flex;align-items:center;justify-content:center}',
    '.uo-size[aria-pressed="true"] .uo-r{border-color:var(--accent)}.uo-size[aria-pressed="true"] .uo-r::after{content:"";width:.75rem;height:.75rem;border-radius:50%;background:var(--accent)}',
    '.uo-size b{display:block;font-size:1rem;font-weight:700}.uo-size span.uo-sm{display:block;margin-top:.15rem;font-weight:600;line-height:1.3}',
    '.uo-size em{font-style:normal;margin-left:.4rem;padding:.1rem .5rem;border-radius:999px;background:var(--accent);color:var(--on-accent);font-size:.8125rem;font-weight:700;vertical-align:.1em}',
    '.uo-seg{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}',
    '.uo-seg button{min-height:3.5rem;border-radius:.875rem;border:2px solid var(--line);background:var(--surface);color:var(--ink);font:inherit;font-size:1.0625rem;font-weight:700}',
    '.uo-seg button[aria-pressed="true"]{border-color:var(--accent);background:var(--acc-soft)}',
    '.uo-lab{margin:0 0 .6rem;font-size:1rem;font-weight:700;color:var(--ink2)}',
    '.uo-main{display:flex;align-items:center;justify-content:center;width:100%;min-height:3.75rem;border:0;border-radius:1rem;background:var(--accent);color:var(--on-accent);font:inherit;font-size:1.1875rem;font-weight:800}',
    '.uo-foot{margin-top:auto;display:flex;flex-direction:column;gap:.75rem}',
    '.uo-note{margin:0;font-size:.9375rem;color:var(--ink2);text-align:center;line-height:1.5}',
    '.uo-goals{display:flex;flex-direction:column;gap:.75rem}',
    '.uo-goal{word-break:keep-all;display:flex;align-items:center;gap:1rem;width:100%;min-height:5.25rem;padding:1rem 1.1rem;border-radius:1.125rem;border:1.5px solid var(--line);background:var(--surface);color:var(--ink);font:inherit;text-align:left;cursor:pointer}',
    '.uo-goal:active{transform:scale(.99)}',
    '.uo-ic{flex:none;width:3rem;height:3rem;border-radius:.9rem;display:flex;align-items:center;justify-content:center;background:var(--acc-soft);color:var(--accent)}',
    '.uo-ic svg{width:1.6rem;height:1.6rem}',
    '.uo-goal b{display:block;font-size:1.1875rem;font-weight:800;line-height:1.3}.uo-goal span.uo-gs{display:block;margin-top:.15rem;font-size:.9375rem;color:var(--ink2);line-height:1.4}',
    '.uo-goal .uo-ar{margin-left:auto;flex:none;color:var(--ink2);font-size:1.5rem;line-height:1}',
    '.uo-steps{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.6rem}',
    '.uo-steps li{display:flex;align-items:flex-start;gap:.85rem;padding:.9rem 1rem;border-radius:1rem;background:var(--surface);word-break:keep-all}',
    '.uo-steps .n{flex:none;width:2rem;height:2rem;border-radius:50%;background:var(--accent);color:var(--on-accent);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1rem}',
    '.uo-steps b{display:block;font-size:1.125rem;font-weight:800;line-height:1.35}.uo-steps span.d{display:block;margin-top:.15rem;font-size:.9375rem;color:var(--ink2);line-height:1.45}',
    '.uo-seg3{display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem}',
    '.uo-seg3 button{min-height:3.25rem;border-radius:.875rem;border:2px solid var(--line);background:var(--surface);color:var(--ink);font:inherit;font-size:1rem;font-weight:700;cursor:pointer}',
    '.uo-seg3 button[aria-pressed="true"]{border-color:var(--accent);background:var(--acc-soft)}',
    '.uo-sample{margin:.6rem 0 0;padding:.75rem 1rem;border-radius:.875rem;background:var(--surface);font-weight:600;line-height:1.4}',
    '.uo-look{align-self:center;border:0;background:transparent;color:var(--ink);font:inherit;font-size:1.0625rem;font-weight:700;min-height:3rem;padding:0 1rem;text-decoration:underline;text-underline-offset:4px}',
    '#ux-coach{position:fixed;left:12px;top:calc(4.4rem + env(safe-area-inset-top,0px));z-index:94;width:min(21rem,calc(100% - 24px));padding:.9rem 1rem;border-radius:1rem;background:var(--ink);color:var(--bg);box-shadow:0 14px 36px rgba(0,0,0,.28);display:flex;align-items:center;gap:.75rem;font-size:1.0625rem;line-height:1.45;word-break:keep-all}',
    '#ux-coach::after{content:"";position:absolute;left:1.25rem;top:-.45rem;width:1rem;height:1rem;background:var(--ink);transform:rotate(45deg)}',
    '#ux-coach b{font-weight:800}#ux-coach span{flex:1}#ux-coach button{flex:none;min-height:2.75rem;padding:0 1rem;border:0;border-radius:.75rem;background:var(--accent);color:var(--on-accent);font:inherit;font-weight:800}',
    '@media (prefers-reduced-motion:no-preference){#ux-onb.anim .uo-in{animation:uoin .25s ease-out}@keyframes uoin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}}'
  ].join('\n');
  var st = document.createElement('style'); st.id = 'ux-shell-css'; st.textContent = SHELL_CSS; document.head.appendChild(st);

  // 왼쪽 메뉴(PC) 이름 맞추기: 아카데미 → 주식 기본기
  function relabel(el){ if (!el) return; var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n; while ((n = w.nextNode())) if (n.nodeValue.indexOf('아카데미') > -1) n.nodeValue = n.nodeValue.split('아카데미').join('주식 기본기'); }
  function watchSide(){ var side = document.getElementById('side'); if (!side || side.__ux) return; side.__ux = true; relabel(side); new MutationObserver(function(){ relabel(side); }).observe(side, { childList: true, subtree: true }); }

  // ---- 맨 위 머리: 로고를 누르면 전체 메뉴(서랍)가 열려요
  var MARK = '<svg viewBox="0 0 28 28" aria-hidden="true"><rect x="5" y="6" width="11" height="4" rx="2" fill="var(--t-ln)"/><rect x="5" y="12" width="15" height="4" rx="2" fill="var(--t-tools)"/><rect x="5" y="18" width="18" height="4" rx="2" fill="var(--t-cm)"/></svg>';
  var MENU = {
    ln: ['리딩 모음', 'var(--t-ln)', [['home', '홈'], ['experts', '전문가 찾기'], ['watch', '관심종목'], ['academy', '7일 첫걸음'], ['alerts', '알림'], ['more', '더보기']]],
    tools: ['투자 도구', 'var(--t-tools)', [['home', '홈'], ['search', '종목 검색'], ['calc', '계산기'], ['learn', '주식 기본기']]],
    cm: ['커뮤니티', 'var(--t-cm)', [['home', '홈'], ['agendas', '토론 목록'], ['chat', '실시간 토론'], ['me', '내 활동']]]
  };
  function placeLogo(){
    var sh = document.querySelector('.sh-in'); if (!sh || sh.querySelector('.hx-logo')) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'hx-logo'; b.setAttribute('aria-label', '리딩노트 전체 메뉴 열기'); b.setAttribute('aria-haspopup', 'dialog');
    b.innerHTML = '<span class="hx-mark">' + MARK + '<span class="hx-cap" aria-hidden="true">메뉴</span></span><span class="hx-word"><b>리딩노트</b><small>전체 메뉴 열기</small></span>';
    b.addEventListener('click', openDrawer);
    sh.insertBefore(b, sh.firstChild);
  }
  var dr = null;
  function openDrawer(){
    if (dr) return; var sh = SH(), cur = sh ? sh.C.tab : 'ln';
    dr = document.createElement('div'); dr.id = 'hx-drawer'; dr.setAttribute('role', 'dialog'); dr.setAttribute('aria-modal', 'true'); dr.setAttribute('aria-label', '전체 메뉴');
    dr.innerHTML = '<div class="hx-scrim" data-hx="close"></div><div class="hx-panel">' +
      '<div class="hx-ph"><span class="hx-mark">' + MARK + '</span><span class="hx-word"><b>리딩노트</b><small>쉬운 무료 투자 정보</small></span><button type="button" class="hx-x" data-hx="close" aria-label="메뉴 닫기">×</button></div>' +
      '<button type="button" class="hx-set" data-hx="set"><span class="g" aria-hidden="true">가</span>글자 크기 · 밝기<i aria-hidden="true">›</i></button>' +
      Object.keys(MENU).map(function(id){ var n = MENU[id];
        return '<section class="hx-sec" style="--tc:' + n[1] + '"><h2 class="hx-sh"><span class="d" aria-hidden="true"></span>' + n[0] + (id === cur ? '<em>지금 보는 곳</em>' : '') + '</h2><div class="hx-grid">' +
          n[2].map(function(r){ return '<button type="button" class="hx-it" data-hx="go" data-app="' + id + '" data-r="' + r[0] + '">' + r[1] + '</button>'; }).join('') + '</div></section>';
      }).join('') +
      '<div class="hx-join"><b>무료 가입하고 알림 받기</b><span>관심 전문가의 새 추천을 휴대폰으로 알려드려요</span><button type="button" data-hx="go" data-app="ln" data-r="more">카카오로 3초 만에 시작</button></div>' +
      '<div class="hx-foot"><button type="button" data-hx="tut">사용법 다시 보기</button><button type="button" data-hx="go" data-app="ln" data-r="install">앱 설치하기</button><button type="button" data-hx="go" data-app="ln" data-r="more">서비스 안내</button></div>' +
      '</div>';
    document.body.appendChild(dr); document.body.style.overflow = 'hidden';
    dr.addEventListener('click', function(e){
      var b = e.target.closest && e.target.closest('[data-hx]'); if (!b) return; var a = b.getAttribute('data-hx');
      if (a === 'close') closeDrawer();
      else if (a === 'set') { closeDrawer(true); openSettings(); }
      else if (a === 'tut') { closeDrawer(true); startOnb(); }
      else if (a === 'go') { closeDrawer(true); var s2 = SH(); if (s2 && s2.show) s2.show(b.getAttribute('data-app'), b.getAttribute('data-r')); }
    });
    var x = dr.querySelector('.hx-x'); if (x) x.focus();
  }
  function closeDrawer(nofocus){ if (!dr) return; dr.remove(); dr = null; document.body.style.overflow = ''; if (!nofocus) { var l = document.querySelector('.hx-logo'); if (l) l.focus(); } }
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && dr) closeDrawer(); });

  // ---- 처음 오신 분 시작 화면
  var IC = {
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6.5C4 5.1 5.1 4 6.5 4h11C18.9 4 20 5.1 20 6.5v7c0 1.4-1.1 2.5-2.5 2.5H10l-4.5 4v-4h0C4.7 16 4 15.3 4 14.5z"/></svg>'
  };
  var GOALS = [
    ['ln', 'experts', IC.star, '전문가 추천 보기', '방송·유튜브 전문가가 고른 종목'],
    ['tools', 'search', IC.search, '내 종목 찾아보기', '가격과 흐름을 쉬운 말로 알려드려요'],
    ['ln', 'academy', IC.book, '주식 처음 배우기', '7일 첫걸음, 하루 5분'],
    ['cm', 'home', IC.chat, '다른 분들 생각 듣기', '이번 주 토론에 한 표 남기기']
  ];
  var onb = null, step = 1;
  function onbHTML(){
    var C = SH().C;
    var sizes = [['m', '보통', '16px'], ['l', '크게', '19px'], ['xl', '아주 크게', '22px']], cur = sizes.filter(function(x){ return x[0] === C.size; })[0] || sizes[1];
    return '<div class="uo-in" role="dialog" aria-modal="true" aria-labelledby="uo-h">' +
      '<div class="uo-top"><p class="uo-k">리딩노트 사용법</p><button class="uo-skip" data-uo="skip">닫기</button></div>' +
      '<div><h1 class="uo-h" id="uo-h">전문가 추천이 실제로<br>맞았는지 보여 드려요</h1><p class="uo-p">방송·유튜브·텔레그램에서 공개된 추천을 날짜와 가격 그대로 모아 정리해요. 무료예요.</p></div>' +
      '<ol class="uo-steps">' +
        '<li><span class="n">1</span><div><b>전문가를 골라요</b><span class="d">성적표에서 적중률·수익률을 비교해 보세요</span></div></li>' +
        '<li><span class="n">2</span><div><b>\'지금 리딩 중\'을 봐요</b><span class="d">지금 추천 중인 종목이 전문가 화면 맨 위에 있어요</span></div></li>' +
        '<li><span class="n">3</span><div><b>관심 전문가로 받아요</b><span class="d">새 추천이 나오면 알려 드려요 · 카카오로 3초 가입</span></div></li>' +
      '</ol>' +
      '<div><p class="uo-lab">글자 크기</p><div class="uo-seg3" role="group" aria-label="글자 크기">' + sizes.map(function(x){ return '<button data-uo="size" data-v="' + x[0] + '" aria-pressed="' + (C.size === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
        '<p class="uo-sample" style="font-size:' + cur[2] + '">이 크기로 읽어 보세요</p></div>' +
      '<div class="uo-foot"><button class="uo-main" data-uo="start">시작하기</button><p class="uo-note">이 안내와 글자 크기는 왼쪽 위 <b>메뉴</b>에서 다시 볼 수 있어요.</p></div></div>';
  }
  function drawOnb(){ if (!onb) return; onb.innerHTML = onbHTML(); var f = onb.querySelector('[aria-pressed="true"],.uo-goal'); if (f) try { f.focus({ preventScroll: true }); } catch (e) {} }
  function closeOnb(goal){
    U.onb = 1; U.tut = 1; saveU();
    if (onb) { onb.remove(); onb = null; }
    document.body.style.overflow = '';
    var sh = SH(); if (goal && sh && sh.show) sh.show(goal[0], goal[1]);
    setTimeout(coach, 600);
  }
  function startOnb(){
    if (onb || !document.body || !SH()) return;
    onb = document.createElement('div'); onb.id = 'ux-onb'; onb.className = 'anim'; setTimeout(function(){ if (onb) onb.className = ''; }, 400);
    document.body.appendChild(onb); document.body.style.overflow = 'hidden'; drawOnb();
    onb.addEventListener('click', function(e){
      var b = e.target.closest && e.target.closest('[data-uo]'); if (!b) return;
      var a = b.getAttribute('data-uo'), v = b.getAttribute('data-v');
      if (a === 'size') { SH().C.size = v; applyAllX(); drawOnb(); }
      else if (a === 'skip' || a === 'start') closeOnb(null);
    });
  }
  function coach(){
    if (U.coach || document.getElementById('ux-coach')) return;
    U.coach = 1; saveU();
    var wide = window.matchMedia('(min-width:960px)').matches;
    var c = document.createElement('div'); c.id = 'ux-coach'; c.setAttribute('role', 'status');
    c.innerHTML = '<span><b>이 로고</b>를 누르면 전체 메뉴가 열려요. ' + (wide ? '왼쪽 메뉴로도 오갈 수 있어요.' : '화면 아래 메뉴로도 오갈 수 있어요.') + '</span><button type="button">알겠어요</button>';
    document.body.appendChild(c);
    var t = setTimeout(rm, 8000); function rm(){ clearTimeout(t); if (c.parentNode) c.remove(); document.removeEventListener('pointerdown', away, true); }
    function away(e){ if (!c.contains(e.target)) rm(); }
    c.querySelector('button').addEventListener('click', rm);
    setTimeout(function(){ document.addEventListener('pointerdown', away, true); }, 50);
  }
  var VIA_LINK = /^#ln\/(x|s|r)-/.test(location.hash || '');
  function boot(){ placeLogo(); watchSide(); if (!U.tut && !VIA_LINK) startOnb(); scan(); }

  // ---- 세 서비스 화면 다듬기
  var COMMON = [
    'html.ux:not([data-wide]) .crumb{display:none!important}',
    'html.ux .ux-hide{display:none!important}',
    'html.ux .top{box-shadow:0 1px 0 var(--line)}',
    'html.ux .ux-ga{flex:none;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;gap:.05rem;width:3.25rem;height:3.5rem;margin-left:auto;margin-right:-.35rem;padding:0;border:0;border-radius:.875rem;background:transparent;color:var(--ink);font:inherit;cursor:pointer}',
    'html.ux .ux-ga.tight{margin-left:0}',
    'html.ux .ux-ga .g1{font-size:1.5rem;font-weight:800;line-height:1}',
    'html.ux .ux-ga .g2,html.ux .top-q::after,html.ux .bell-btn::after{font-size:.8125rem;font-weight:600;line-height:1;color:var(--ink2)}',
    'html.ux .ux-ga:active{background:var(--sunk,var(--raise))}',
    'html.ux .ux-ga{display:none!important}'
  ].join('\n');
  var CSS = {
    ln: [
      'html.ux .is-home>.top{background:var(--bg);-webkit-backdrop-filter:none;backdrop-filter:none}',
      'html.ux .top-q,html.ux .bell-btn{flex-direction:column;gap:.15rem;height:3.5rem;width:3.1rem}',
      'html.ux .top-q svg,html.ux .bell-btn svg{width:1.45rem;height:1.45rem}',
      'html.ux .top-q::after{content:"찾기"}html.ux .bell-btn::after{content:"알림"}',
      'html.ux-nojoin .joinbar{display:none!important}',
      'html.ux-nojoin .app.has-join{padding-bottom:calc(var(--nav-h) + env(safe-area-inset-bottom,0px) + 1.5rem)}',
      'html.ux-nojoin .fab-wrap.over-join{bottom:calc(var(--nav-h) + env(safe-area-inset-bottom,0px) + 1rem)}',
      'html.ux-first .fab-wrap{display:none!important}',
      'html.ux:not(.ux-nojoin) .fab-wrap.over-join{display:none!important}',
      'html.ux .joinbar .jt{line-height:1.4;word-break:keep-all}',
      /* 홈 */
      'html.ux .hw-card{display:none!important}',
      'html.ux .ux-greet{display:flex;flex-direction:column;gap:.3rem;padding-top:1rem}',
      'html.ux .ux-greet .ux-free{font-size:1.0625rem;color:var(--ink2);line-height:1.5;word-break:keep-all}',
      'html.ux .is-home>main{gap:2.25rem}',
      'html.ux .is-home .hero{margin-top:-1rem}',
      'html.ux .hs-s,html.ux .hq-s,html.ux .hs-x span,html.ux .prow .pt span,html.ux .tm-top{font-size:.9375rem}',
      'html.ux .prow{min-height:5.25rem;padding-block:1rem}',
      'html.ux .nav button{font-size:.875rem}',
      /* 전문가 종목 리딩: 접힌 줄과 펼친 카드를 또렷하게 */
      'html.ux .rows{display:flex;flex-direction:column;gap:.75rem;background:transparent;border:0;padding:0 max(16px,env(safe-area-inset-left,0px)) .25rem}',
      'html.ux .lrow{background:var(--surface);border:1px solid var(--line);border-radius:1rem;overflow:hidden;box-shadow:0 1px 2px rgba(15,23,42,.05);transition:border-color .2s,box-shadow .2s}',
      'html.ux .lrow+.lrow{border-top:1px solid var(--line)}',
      'html.ux .lhead{display:grid;grid-template-columns:minmax(0,1fr) auto 2.25rem;grid-template-rows:auto auto;column-gap:.75rem;row-gap:.55rem;align-items:center;min-height:5.5rem;padding:1rem;background:transparent}',
      'html.ux .lhead .lname{display:contents}',
      'html.ux .lhead .sname{grid-column:1;grid-row:1;min-width:0;word-break:keep-all;overflow-wrap:anywhere}',
      'html.ux .lhead .lname .last{grid-column:1;grid-row:2;justify-self:start;max-width:100%}',
      'html.ux .lhead .lprice{grid-column:2;grid-row:1}',
      'html.ux .lhead .spark{grid-column:2;grid-row:2;justify-self:end;width:4.5rem}',
      'html.ux .lhead .chev{grid-column:3;grid-row:1;width:2.25rem;height:2.25rem;padding:.5rem;border-radius:50%;background:var(--sunk);color:var(--ink);box-sizing:border-box;transition:transform .2s,background .2s}',
      'html.ux .lhead::after{content:"자세히";grid-column:3;grid-row:2;justify-self:center;font-size:.8125rem;font-weight:700;color:var(--ink2);white-space:nowrap}',
      'html.ux .lrow.ux-open{border:2px solid var(--accent);box-shadow:0 10px 28px -14px color-mix(in srgb,var(--accent) 70%,transparent)}',
      'html.ux .lrow.ux-open>.lhead{background:var(--accent-soft)}',
      'html.ux .lrow.ux-open>.lhead::after{content:"접기";color:var(--accent)}',
      'html.ux .lrow.ux-open>.lhead .chev{background:var(--accent);color:var(--on-accent);transform:rotate(180deg)}',
      'html.ux .lbody{background:var(--surface);border-top:1px dashed color-mix(in srgb,var(--accent) 55%,var(--line));padding:1.25rem 1rem 1.25rem;gap:1.25rem}',
      'html.ux .lbody .result{border:0;background:transparent;padding:0;border-radius:0}',
      'html.ux .lbody .kv div{background:var(--raise);border:1px solid var(--line)}',
      'html.ux .lbody .kv span{font-size:.875rem}',
      'html.ux .lbody .tl{padding-top:1rem;border-top:1px solid var(--line)}',
      'html.ux .lbody .dact .btn{min-height:3.25rem;font-size:1rem;white-space:nowrap;padding-left:.5rem;padding-right:.5rem}',
      'html.ux .lname .last{font-size:.875rem}',
      'html.ux[data-size="xl"] .lhead .spark{display:none}',
      'html.ux .ti-when,html.ux .ti-k{font-size:.875rem}',
      'html.ux .xd-kv span,html.ux .stat span{font-size:.875rem}',
      'html.ux .screen{gap:1.75rem}'
    ].join('\n'),
    tools: [
      'html.ux .pick .crit{display:none}',
      'html.ux .ux-condbtn{display:flex;align-items:center;gap:1rem;width:calc(100% - 32px);margin:1.5rem 16px .5rem;min-height:4.5rem;padding:1rem 1.1rem;border-radius:1rem;border:1.5px dashed var(--line);background:var(--surface);color:var(--ink);font:inherit;text-align:left;cursor:pointer}',
      'html.ux .ux-condbtn span{flex:1;display:flex;flex-direction:column;gap:.2rem}html.ux .ux-condbtn b{font-size:1.125rem}html.ux .ux-condbtn small{font-size:.9375rem;color:var(--ink2)}',
      'html.ux .ux-condbtn i{font-style:normal;font-weight:700;color:var(--accent);white-space:nowrap}',
      'html.ux .pick h3 .mono{white-space:nowrap}',
      'html.ux .tile span{font-size:.9375rem}',
      'html.ux .nav button{font-size:.875rem}',
      'html.ux .sec{margin-top:.5rem}'
    ].join('\n'),
    cm: [
      'html.ux #nav button{font-size:.875rem}',
      'html.ux .sec+.sec{margin-top:.5rem}'
    ].join('\n')
  };
  function appOf(f){
    var s = (f.getAttribute('src') || '') + ' ' + (f.title || '');
    return /tools|투자 도구/.test(s) ? 'tools' : /community|커뮤니티/.test(s) ? 'cm' : /ln\.html|리딩 모음/.test(s) ? 'ln' : null;
  }
  function eachText(el, fn){ var w = el.ownerDocument.createTreeWalker(el, NodeFilter.SHOW_TEXT), n, list = []; while ((n = w.nextNode())) list.push(n); list.forEach(fn); }
  function swap(el, a, b){ eachText(el, function(n){ if (n.nodeValue.indexOf(a) > -1) n.nodeValue = n.nodeValue.split(a).join(b); }); }

  function addGa(d){
    var top = d.querySelector('.top-in'); if (!top || top.querySelector('.ux-ga')) return;
    var b = d.createElement('button'); b.type = 'button'; b.className = 'ux-ga'; b.setAttribute('aria-label', '글자 크기 · 화면 밝기 바꾸기');
    b.innerHTML = '<span class="g1" aria-hidden="true">가</span><span class="g2" aria-hidden="true">글자</span>';
    if (top.querySelector('.bell-btn,.top-q,.app-btn')) b.className += ' tight';
    top.appendChild(b);
  }
  function fixLn(w, d){
    var home = d.querySelector('main.home');
    if (home && !home.__ux) {
      home.__ux = true;
      var lead = home.querySelector('.hlead'), hero = home.querySelector('section.hero');
      if (lead && hero) {
        var g = d.createElement('div'); g.className = 'gx ux-greet';
        var hg = lead.querySelector('.hgreet') || lead.querySelector('.hg-k');
        if (hg) g.appendChild(hg);
        if (lead.querySelector('.hw-card')) { var p = d.createElement('p'); p.className = 'ux-free'; p.textContent = '방송·유튜브 전문가 추천을 쉽게 모아 보는 무료 서비스예요.'; g.appendChild(p); }
        home.insertBefore(g, home.firstChild);
        home.insertBefore(hero, lead);
      }
      Array.prototype.forEach.call(home.querySelectorAll('.prow .pt span'), function(s){
        eachText(s, function(n){ n.nodeValue = n.nodeValue.replace(/([^명\s])이 가지고 있어요/g, '$1 님이 가지고 있어요').replace('오를 것 ', '오를 거라 본 분 '); });
      });
    }
    var jt = d.querySelector('.joinbar .jt'); if (jt && !jt.__ux) { jt.__ux = true; jt.innerHTML = '<b>무료 가입</b>하고<br>새 추천 알림 받기'; }
    Array.prototype.forEach.call(d.querySelectorAll('.lrow'), function(r){
      var h = r.querySelector('.lhead'); r.classList.toggle('ux-open', !!h && h.getAttribute('aria-expanded') === 'true');
    });
    if (!DEMO) {
      var role = d.querySelector('[data-a="asRole"]'); if (role) { var sec = role.closest('section'); if (sec) sec.classList.add('ux-hide'); }
      var rs = d.querySelector('button[data-a="reset"]'); if (rs) rs.classList.add('ux-hide');
    }
  }
  function fixTools(w, d){
    // 종목 검색: 처음엔 이름 검색만, 조건 검색은 눌러서 펼치기
    var condSec = null; Array.prototype.forEach.call(d.querySelectorAll('.sec'), function(x){ var t = x.querySelector('.sech'); if (t && t.textContent.indexOf('조건으로 찾기') > -1) condSec = x; });
    if (condSec) {
      var open = !!w.__uxCond, res = d.getElementById('scanres'), cb = d.querySelector('.ux-condbtn');
      condSec.classList.toggle('ux-hide', !open); if (res) res.classList.toggle('ux-hide', !open);
      if (!open && !cb) { cb = d.createElement('button'); cb.type = 'button'; cb.className = 'ux-condbtn'; cb.innerHTML = '<span><b>조건으로 종목 찾기</b><small>거래량·가격 흐름 같은 조건으로 골라 봐요</small></span><i aria-hidden="true">펼치기 ▾</i>'; condSec.parentNode.insertBefore(cb, condSec); }
      if (open && cb) cb.remove();
    }
    Array.prototype.forEach.call(d.querySelectorAll('input[placeholder]'), function(i){ var ph = i.getAttribute('placeholder') || ''; if (ph.indexOf('종목 이름이나 번호') === 0) i.setAttribute('placeholder', '예: 삼성전자, 005930'); });
    swap(d.querySelector('.top') || d.body, '아카데미', '주식 기본기');
    acadLast(d);
    var nav = d.querySelector('.nav'); if (nav) swap(nav, '아카데미', '주식 기본기');
    var picks = d.querySelectorAll('.pick');
    if (picks.length && !d.querySelector('.ux-picks-done')) {
      var keep = null;
      Array.prototype.forEach.call(picks, function(p){ var l = p.querySelector('[data-act="preset"]'); if (l && l.getAttribute('data-v') === 'p2') keep = p; else p.classList.add('ux-hide'); });
      if (keep) { var h3 = keep.querySelector('h3'); if (h3) swap(h3, '52주 최고가 근처의 큰 회사', '1년 중 가장 비쌌던 가격 근처의 큰 회사'); keep.classList.add('ux-picks-done'); }
      var sec = picks[0].closest('section');
      if (sec) {
        var h2 = sec.querySelector('.sech'); if (h2) swap(h2, '오늘 조건에 맞은 종목', '오늘 눈여겨볼 큰 회사');
        var acad = null; Array.prototype.forEach.call(d.querySelectorAll('section.sec'), function(s){ var t = s.querySelector('.sech'); if (t && /아카데미|주식 기본기/.test(t.textContent)) acad = s; });
      }
    }
  }
  function acadLast(d){
    if (!d.querySelector('.pick')) return;   // 투자 도구 홈에서만
    var acad = null; Array.prototype.forEach.call(d.querySelectorAll('section.sec'), function(s){ var t = s.querySelector('.sech'); if (t && /아카데미|주식 기본기/.test(t.textContent) && !s.closest('.ux-hide')) acad = acad || s; });
    if (!acad) return;
    var t = acad.querySelector('.sech'); if (t) swap(t, '아카데미', '주식 기본기');
    var sibs = Array.prototype.filter.call(acad.parentNode.children, function(x){ return x.tagName === 'SECTION' && x.classList.contains('sec'); });
    var last = sibs[sibs.length - 1]; if (last && last !== acad) last.parentNode.insertBefore(acad, last.nextSibling);
  }
  function fixCm(w, d){
    if (window.__lnTheme) return;   // 새 디자인(ln-theme.js)이 순서를 정해요
    var ban = d.querySelector('button.banner[data-go="detail"]'); if (!ban) return;
    var sec = ban.closest('section'); if (!sec || sec.__ux) return; sec.__ux = true;
    var par = sec.parentNode, first = par.querySelector('section.sec'); if (first && first !== sec) par.insertBefore(sec, first);
  }
  function setHtmlFlags(d){
    var r = d.documentElement; r.classList.add('ux'); r.classList.toggle('ux-first', FIRST); r.classList.toggle('ux-nojoin', !!noJoin());
  }
  function hook(f){
    var app = appOf(f); if (!app) return;
    var w, d; try { w = f.contentWindow; d = f.contentDocument; } catch (e) { return; }
    if (!w || !d || !d.body || d.__ux) return; d.__ux = true;
    var s = d.createElement('style'); s.id = 'ux-css'; s.textContent = COMMON + '\n' + CSS[app]; d.head.appendChild(s);
    setHtmlFlags(d);
    if (app === 'tools') { try { if (w.TABS && w.TABS[3]) w.TABS[3][1] = '주식 기본기'; if (w.TITLES) w.TITLES.learn = '주식 기본기'; } catch (e) {} }
    var busy = false;
    function run(){
      busy = true;
      try {
        if (app === 'ln') fixLn(w, d); else if (app === 'tools') fixTools(w, d); else fixCm(w, d);
      } catch (e) { try { console.log('[ux-polish]', e); } catch (x) {} }
      busy = false;
    }
    new w.MutationObserver(function(){ if (!busy) run(); }).observe(d.body, { childList: true, subtree: true });
    d.addEventListener('click', function(e){
      var t = e.target.closest && e.target.closest('.ux-ga'); if (t) { e.preventDefault(); e.stopPropagation(); openSettings(); return; }
      var j = e.target.closest && e.target.closest('[data-a="joinHide"]'); if (j) { U.joinUntil = Date.now() + 7 * DAY; saveU(); setHtmlFlags(d); }
      if (app === 'tools') {
        var cb = e.target.closest && e.target.closest('.ux-condbtn'); if (cb) { w.__uxCond = true; run(); return; }
        var gt = e.target.closest && e.target.closest('[data-act="gotool"],[data-act="preset"]');
        if (gt) w.__uxCond = gt.getAttribute('data-act') === 'preset' || gt.getAttribute('data-s') === 'cond';
      }
    }, true);
    run();
    if (app === 'tools') { try { w.render(); } catch (e) {} }
  }
  function scan(){
    Array.prototype.forEach.call(document.querySelectorAll('iframe'), function(f){
      if (!f.__uxLoad) { f.__uxLoad = true; f.addEventListener('load', function(){ hook(f); }); }
      hook(f);
    });
  }
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
