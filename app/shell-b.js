/* 리딩노트 · B안 메뉴 (shell-b.js)
   index.html(맨 바깥 셸)의 </body> 바로 앞, ui-unify.js 다음 줄에 <script src="shell-b.js?v=1"></script> 한 줄로 동작해요.
   - 휴대폰(1024px 미만): 맨 위 3탭을 없애고 화면 아래 5탭 [홈 · 방송종목 · 도구 · 커뮤니티 · MY]
   - PC(1024px 이상): 왼쪽 240px 메뉴(5개 + 카카오 가입 카드, 로그인하면 숨김)
   - PC(1280px 이상) 홈에서만: 오른쪽 320px 칸(이번 주 방송 많이 나온 종목 · 내 관심종목 소식 · 미니 계산기)
   - 방송종목 · 도구 · 커뮤니티는 화면 위 세그먼트로 세부 화면을 오가요. 각 서비스 화면 안의 아래 메뉴는 숨겨요.
   - 주소: #ln · #tools · #cm · #ln/s-종목코드 등 예전 주소는 그대로 열리고, #ln/bc(이번 주 방송) · #ln/bcall(지난 방송)이 새로 생겼어요.
     #home · #bc · #my 로 열어도 해당 탭이 열려요. */
(function(){
  if (window.__shellB) return; window.__shellB = true;
  var SH = window.__shell; if (!SH) return;
  var C = SH.C, root = document.documentElement;
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function W(id){ try { return SH.READY[id] && SH.F[id] ? SH.F[id].contentWindow : null; } catch (e) { return null; } }
  var MQ_PC = window.matchMedia('(min-width:1024px)'), MQ_WIDE3 = window.matchMedia('(min-width:1280px)'), MQ_APPWIDE = window.matchMedia('(min-width:960px)');

  // ---- 아이콘 (선 아이콘 24px)
  function svg(p){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; }
  var IC = {
    home: svg('<path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"/>'),
    bc: svg('<rect x="3" y="5.5" width="18" height="12.5" rx="2.5"/><path d="M8.5 21h7M10 9.5v5l4.5-2.5z"/>'),
    tools: svg('<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7h7M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h3.5"/>'),
    cm: svg('<path d="M4 6.5C4 5.1 5.1 4 6.5 4h11C18.9 4 20 5.1 20 6.5v7c0 1.4-1.1 2.5-2.5 2.5H10l-4.5 4v-4C4.7 16 4 15.3 4 14.5z"/><path d="M8.5 9h7M8.5 12h4"/>'),
    my: svg('<circle cx="12" cy="8.5" r="3.75"/><path d="M4.5 20c.9-3.6 3.9-5.5 7.5-5.5s6.6 1.9 7.5 5.5"/>'),
    chev: svg('<path d="M9 6l6 6-6 6"/>'),
    moon: svg('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>')
  };
  var MARK = '<svg viewBox="0 0 28 28" aria-hidden="true"><rect x="5" y="6" width="11" height="4" rx="2" fill="#fff"/><rect x="5" y="12" width="15" height="4" rx="2" fill="#fff"/><rect x="5" y="18" width="18" height="4" rx="2" fill="#fff"/></svg>';

  // ---- 5탭과 세그먼트
  var TABS = [
    ['home', '홈', 'ln', 'home'],
    ['bc', '방송종목', 'ln', 'bc'],
    ['tools', '도구', 'tools', 'home'],
    ['cm', '커뮤니티', 'cm', 'home'],
    ['my', 'MY', 'ln', 'more']
  ];
  var SEG = {
    bc: [['이번 주', 'ln', 'bc'], ['지난 방송', 'ln', 'bcall'], ['전문가', 'ln', 'experts']],
    tools: [['계산기', 'tools', 'home'], ['종목 검색', 'tools', 'search'], ['기본기', 'tools', 'learn']],
    cm: [['이번 주 토론', 'cm', 'home'], ['실시간', 'cm', 'chat'], ['내 활동', 'cm', 'me']]
  };
  function hashState(){
    var p = (location.hash || '').replace(/^#\/?/, '').split('/');
    var app = p[0] || '', route = p.slice(1).join('/') || 'home';
    if (app !== 'ln' && app !== 'tools' && app !== 'cm') { app = C.tab || 'ln'; route = 'home'; }
    return { app: app, route: route };
  }
  function tabOf(app, route){
    if (app === 'tools') return 'tools';
    if (app === 'cm') return 'cm';
    if (route === 'bc' || route === 'bcall' || route === 'tbl' || route === 'experts' || /^x-/.test(route)) return 'bc';
    if (route === 'more' || route === 'watch' || route === 'alerts' || route === 'install') return 'my';
    return 'home';
  }
  function segOf(tab, route){
    if (tab === 'bc') return route === 'tbl' ? -1 : route === 'bcall' ? 1 : (route === 'experts' || /^x-/.test(route)) ? 2 : 0;
    if (tab === 'tools') return route === 'search' || /^s-/.test(route) ? 1 : route === 'learn' ? 2 : 0;
    if (tab === 'cm') return route === 'chat' ? 1 : route === 'me' ? 2 : 0;
    return -1;
  }
  function cur(){ var h = hashState(), t = tabOf(h.app, h.route); return { app: h.app, route: h.route, tab: t, seg: segOf(t, h.route) }; }
  function go(app, route){ try { SH.show(app, route); } catch (e) {} update(); }

  // ---- 셸 CSS
  var CSS = [
    /* 예전 머리(로고 · 3탭)와 예전 왼쪽 메뉴 · 광고 칸은 숨겨요 */
    '#shell .sh-top,#shell #side,#shell #rail,#ux-coach,#hx-drawer{display:none!important}',
    '#shell{padding-bottom:0!important}',
    '#shell .body{display:grid!important;grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);max-width:none!important;margin:0!important;padding:0!important;gap:0!important;width:100%}',
    '#shell #frames{grid-column:1;grid-row:2;min-height:0;max-width:none!important;width:100%;border:0!important}',
    '#bn-side,#bn-panel{display:none}',
    /* 많이 리딩된 종목 띠는 홈에서만 */
    'html:not(.bn-home) #bp-top{display:none!important}',
    /* 방송종목 맨 위: 전체 추천 기록 */
    '.bn-all{display:flex;align-items:center;gap:10px;width:100%;min-height:56px;margin:0 0 8px;padding:8px 14px;border:0;border-radius:16px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);color:var(--ink);font:inherit;text-align:left;cursor:pointer}',
    '.bn-all>svg:first-child{width:26px;height:26px;flex:none;color:var(--t2-acc-ink,var(--accent))}.bn-all span{flex:1;min-width:0;display:flex;flex-direction:column}.bn-all b{font-size:16px;font-weight:800;letter-spacing:-.02em}.bn-all small{font-size:13px;color:var(--ink2);font-weight:600}.bn-all>svg:last-child{width:20px;height:20px;flex:none;color:var(--ink2)}',
    '.bn-all[aria-current="page"]{box-shadow:inset 0 0 0 2px var(--accent);background:var(--accent-soft,var(--acc-soft))}',
    /* 휴대폰 머리: 로고(= 전체 메뉴) */
    '#bn-top{flex:none;display:flex;align-items:center;gap:10px;padding:calc(6px + env(safe-area-inset-top,0px)) 12px 6px;background:var(--bg);border-bottom:1px solid var(--line)}',
    '@media (min-width:1024px){#bn-top{display:none}}',
    '.bn-mb{flex:none;position:relative;width:44px;height:44px;border:0;border-radius:13px;background:var(--accent);display:flex;align-items:center;justify-content:center;cursor:pointer}',
    '.bn-mb svg{width:28px;height:28px}.bn-mb .cap{position:absolute;left:50%;bottom:-7px;transform:translateX(-50%);padding:0 5px;border-radius:999px;background:var(--ink);color:var(--bg);font-size:10px;font-weight:800;line-height:1.45;white-space:nowrap}',
    '.bn-wm{flex:1;min-width:0;display:flex;flex-direction:column;border:0;background:none;padding:0;color:var(--ink);font:inherit;text-align:left;cursor:pointer}.bn-wm b{font-size:18px;font-weight:800;letter-spacing:-.03em;line-height:1.2}.bn-wm small{font-size:12.5px;color:var(--ink2);font-weight:600}',
    '.bn-ga{flex:none;width:44px;height:44px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink);font:inherit;font-size:19px;font-weight:800;cursor:pointer}',
    '.bn-mb:focus-visible,.bn-wm:focus-visible,.bn-ga:focus-visible{outline:3px solid var(--accent);outline-offset:2px}',
    '.bn-ga{display:flex;align-items:center;justify-content:center;color:var(--ink2)}.bn-ga svg{width:22px;height:22px}',
    /* 11/6 휴대폰: 위 고정 줄은 한 줄만 — 세그먼트는 로고 옆으로, 깊은 화면은 그 화면의 뒤로 줄만 */
    '@media (max-width:1023.98px){',
    '  #bn-top{min-height:56px;box-sizing:border-box}',
    '  #bn-top #bn-seg{flex:1;min-width:0;padding:0;background:none}',
    '  html.bn-hasseg #bn-top .bn-wm,html.bn-hasseg #bn-top .bn-ga{display:none}',
    '  #bn-top .bn-all{display:none}',
    '  #bn-top .bn-track{padding:3px;border-radius:14px}',
    '  #bn-top .bn-track button{min-height:40px;padding:0 4px;font-size:15px}',
    '  html.bn-deep #bn-top{display:none}',
    '  html.bn-strip #bn-top .bn-wm{display:none}',
    '  #bn-top #bp-top{flex:1;min-width:0;border:0;background:none}',
    '  #bn-top #bp-top .bp-top-in{padding:0;min-height:44px;max-width:none}',
    '  #bn-top #bp-top .bp-top-list{padding:0}',
    '  #bn-top #bp-top .bp-ti .bp-mt{display:none}',
    '  #bn-top #bp-top .bp-top-in>.bp-tl{display:inline-flex;flex:none;align-items:center;margin-right:6px;padding:2px 6px;border-radius:6px;font-size:12px;font-weight:700;color:var(--ink2);background:var(--raise)}',
    '  #bn-top #bp-top .bp-tl-l{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}#bn-top #bp-top .bp-tl-s{display:inline}',
    '  #bn-top #bp-top .bp-slide{flex:1;min-width:0}#bn-top #bp-top .bp-nm{max-width:none;flex:1 1 auto;min-width:0;font-weight:800}',
    '}',
    /* 전체 메뉴 서랍 */
    '#bn-dr{position:fixed;inset:0;z-index:96;display:flex}',
    '#bn-dr .sc{position:absolute;inset:0;background:rgba(8,12,18,.5)}',
    '#bn-dr .pn{position:relative;width:min(23rem,88%);height:100%;overflow:auto;background:var(--bg);box-shadow:12px 0 40px rgba(0,0,0,.25);display:flex;flex-direction:column;gap:16px;padding:calc(14px + env(safe-area-inset-top,0px)) 16px calc(20px + env(safe-area-inset-bottom,0px))}',
    '@media (prefers-reduced-motion:no-preference){#bn-dr .pn{animation:bndr .22s ease-out}@keyframes bndr{from{transform:translateX(-24px);opacity:0}to{transform:none;opacity:1}}}',
    '.dr-h{display:flex;align-items:center;gap:10px}.dr-h .bn-wm{cursor:default}.dr-x{margin-left:auto;width:44px;height:44px;border:0;border-radius:12px;background:var(--surface);color:var(--ink);font:inherit;font-size:24px;line-height:1;cursor:pointer}',
    '.dr-sec{display:flex;flex-direction:column;gap:8px}.dr-sh{margin:0;display:flex;align-items:center;gap:8px;font-size:16px;font-weight:800;color:var(--ink)}.dr-sh svg{width:20px;height:20px;color:var(--t2-acc-ink,var(--accent))}.dr-sh em{font-style:normal;font-size:12px;font-weight:700;padding:1px 8px;border-radius:999px;background:var(--accent-soft,var(--acc-soft));color:var(--t2-acc-ink,var(--accent))}',
    '.dr-g{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
    '.dr-it{min-height:48px;padding:8px 12px;border-radius:14px;border:0;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);color:var(--ink);font:inherit;font-size:15px;font-weight:700;text-align:left;cursor:pointer}',
    '.dr-it:active{background:var(--raise)}',
    '.dr-join{display:flex;flex-direction:column;gap:4px;padding:16px;border-radius:20px;background:var(--ink);color:var(--bg)}.dr-join b{font-size:17px}.dr-join span{font-size:14px;opacity:.85}.dr-join button{margin-top:8px;min-height:48px;border:0;border-radius:12px;background:#FEE500;color:#191600;font:inherit;font-size:16px;font-weight:800;cursor:pointer}',
    '.dr-ft{display:flex;flex-direction:column}.dr-ft button{min-height:44px;border:0;background:none;color:var(--ink2);font:inherit;font-size:15px;text-align:left;padding:0 4px;cursor:pointer}',
    /* 세그먼트 */
    '#bn-seg{grid-column:1;grid-row:1;padding:10px 16px 8px;background:var(--bg)}',
    '#bn-seg[hidden]{display:none!important}',
    '.bn-track{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:4px;padding:4px;border-radius:16px;background:var(--sunk,var(--raise))}',
    '.bn-track button{min-height:44px;padding:0 6px;border:0;border-radius:12px;background:transparent;color:var(--ink2);font:inherit;font-size:16px;font-weight:700;letter-spacing:-.02em;white-space:nowrap;cursor:pointer}',
    '.bn-track button[aria-current="page"]{background:var(--surface);color:var(--ink);font-weight:800;box-shadow:0 1px 2px rgba(0,0,0,.06),0 2px 8px rgba(0,0,0,.06)}',
    'html[data-theme="dark"] .bn-track button[aria-current="page"]{background:var(--raise);box-shadow:none}',
    '.bn-track button:focus-visible{outline:3px solid var(--accent);outline-offset:-3px}',
    /* 아래 5탭 */
    '#bn-tab{flex:none;position:relative;z-index:5;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));background:var(--surface);box-shadow:0 -1px 0 var(--line);padding:0 max(4px,env(safe-area-inset-right,0px)) env(safe-area-inset-bottom,0px) max(4px,env(safe-area-inset-left,0px))}',
    '#bn-tab button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:64px;padding:6px 2px;border:0;background:transparent;color:var(--ink2);font:inherit;font-size:14px;font-weight:600;line-height:1.15;letter-spacing:-.02em;white-space:nowrap;cursor:pointer}',
    '#bn-tab button svg{width:26px;height:26px;flex:none}',
    '#bn-tab button[aria-current="page"]{color:var(--t2-acc-ink,var(--accent));font-weight:800}',
    '#bn-tab button[aria-current="page"] svg{stroke-width:2.4}',
    '#bn-tab button:focus-visible{outline:3px solid var(--accent);outline-offset:-3px;border-radius:12px}',
    /* 왼쪽 메뉴 (PC) */
    '@media (min-width:1024px){',
    '  #bn-tab{display:none!important}',
    /* 여백 줄이기: 전체 폭을 1200px 안에 모으고, 가운데 화면은 칸을 꽉 채워요 (화면 안 내용은 최대 720px) */
    '  #shell .body{grid-template-columns:232px minmax(0,1fr);max-width:1440px!important;margin:0 auto!important}',
    '  #bn-side{display:flex;grid-column:1;grid-row:1/3;flex-direction:column;gap:6px;min-height:0;overflow-y:auto;padding:14px 12px 14px;border-right:1px solid var(--line);background:var(--bg);scrollbar-width:thin}',
    '  #bn-seg,#shell #frames{grid-column:2}',
    '  #shell #frames{max-width:none!important;width:100%}',
    '  #bn-seg{width:100%;max-width:840px;justify-self:center;padding:12px 16px 4px}',
    '  html.bn-bcwide #bn-seg{max-width:1180px}',
    /* 11/6 스크롤 막대는 가운데 하나만 보이게: 왼쪽 메뉴 · 오른쪽 칸은 막대를 숨기고, 휠은 가운데 화면으로 넘겨요 */
    '  #bn-side,html.bn-home #bn-panel{scrollbar-width:none}#bn-side::-webkit-scrollbar,#bn-panel::-webkit-scrollbar{display:none}',
    '}',
    '.bn-logo{display:flex;align-items:center;gap:10px;min-height:48px;margin:0 0 8px;padding:0 6px;border:0;background:transparent;color:var(--ink);font:inherit;text-align:left;cursor:pointer;border-radius:14px}',
    '.bn-logo i{flex:none;width:40px;height:40px;border-radius:12px;background:var(--accent);display:flex;align-items:center;justify-content:center}',
    '.bn-logo i svg{width:26px;height:26px}',
    '.bn-logo b{display:block;font-size:19px;font-weight:800;letter-spacing:-.03em;line-height:1.2}.bn-logo small{display:block;font-size:13px;font-weight:600;color:var(--ink2)}',
    '.bn-mi{display:flex;align-items:center;gap:12px;width:100%;min-height:48px;padding:0 12px;border:0;border-radius:14px;background:transparent;color:var(--ink2);font:inherit;font-size:17px;font-weight:700;letter-spacing:-.02em;text-align:left;cursor:pointer}',
    '.bn-mi svg{width:24px;height:24px;flex:none}',
    '.bn-mi:hover{background:var(--surface);color:var(--ink)}',
    '.bn-mi[aria-current="page"]{background:var(--accent-soft,var(--acc-soft));color:var(--t2-acc-ink,var(--accent));font-weight:800}',
    '.bn-mi:focus-visible,.bn-logo:focus-visible{outline:3px solid var(--accent);outline-offset:-3px}',
    '.bn-join{margin-top:10px;display:flex;flex-direction:column;gap:6px;padding:16px;border-radius:20px;background:var(--surface);box-shadow:0 0 0 1px var(--line) inset}',
    '.bn-join[hidden]{display:none!important}',
    '.bn-join b{font-size:17px;font-weight:800;letter-spacing:-.02em;line-height:1.35}.bn-join span{font-size:14px;color:var(--ink2);line-height:1.45}',
    '.bn-kk{margin-top:8px;min-height:48px;border:0;border-radius:12px;background:#FEE500;color:#191600;font:inherit;font-size:16px;font-weight:800;cursor:pointer}',
    '.bn-foot{margin-top:auto;padding-top:14px;border-top:1px solid var(--line)}',
    '.bn-foot .bn-mi{font-size:15px;min-height:48px}',
    /* 오른쪽 칸 (PC 홈) */
    '@media (min-width:1280px){',
    '  html.bn-home #shell .body{grid-template-columns:232px minmax(0,1fr) 304px}',
    '  html.bn-home #bn-panel{display:flex;grid-column:3;grid-row:1/3;flex-direction:column;gap:12px;min-height:0;overflow-y:auto;padding:14px 12px 20px;border-left:1px solid var(--line);background:var(--bg);scrollbar-width:thin}',
    '}',
    '.bn-card{display:flex;flex-direction:column;gap:8px;padding:16px;border-radius:20px;background:var(--surface)}',
    '.bn-card h2{margin:0;font-size:17px;font-weight:800;letter-spacing:-.02em;display:flex;align-items:center;gap:6px}',
    '.bn-card h2 small{margin-left:auto;font-size:12px;font-weight:600;color:var(--ink2)}',
    '.bn-sub{margin:-4px 0 0;font-size:13px;color:var(--ink2)}',
    '.bn-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}',
    '.bn-row{display:flex;align-items:center;gap:10px;width:100%;min-height:48px;padding:6px 4px;border:0;border-top:1px solid var(--line);background:transparent;color:var(--ink);font:inherit;text-align:left;cursor:pointer;border-radius:0;text-decoration:none}',
    '.bn-list li:first-child .bn-row{border-top:0}',
    '.bn-row:hover{background:var(--raise)}',
    '.bn-rk{flex:none;width:24px;height:24px;border-radius:8px;background:var(--sunk,var(--raise));display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:var(--ink2)}',
    '.bn-list li:first-child .bn-rk{background:var(--accent);color:var(--on-accent)}',
    '.bn-nm{flex:1;min-width:0;display:flex;flex-direction:column}.bn-nm b{font-size:15px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bn-nm span{font-size:12.5px;color:var(--ink2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.bn-ct{flex:none;font-size:13px;font-weight:800;color:var(--t2-acc-ink,var(--accent));background:var(--accent-soft,var(--acc-soft));border-radius:8px;padding:2px 8px}',
    '.bn-row svg{width:18px;height:18px;flex:none;color:var(--ink2)}',
    '.bn-news{display:flex;flex-direction:column;gap:3px;padding:10px 4px;border-top:1px solid var(--line);color:var(--ink);text-decoration:none}',
    '.bn-list li:first-child .bn-news{border-top:0}',
    '.bn-news:hover{background:var(--raise)}',
    '.bn-news em{font-style:normal;align-self:flex-start;font-size:12px;font-weight:800;color:var(--t2-acc-ink,var(--accent));background:var(--accent-soft,var(--acc-soft));border-radius:6px;padding:1px 7px}',
    '.bn-news b{font-size:14.5px;font-weight:700;line-height:1.45;letter-spacing:-.02em}.bn-news span{font-size:12px;color:var(--ink2)}',
    '.bn-empty{margin:0;font-size:14px;line-height:1.55;color:var(--ink2)}',
    '.bn-more{display:flex;align-items:center;justify-content:center;gap:4px;min-height:44px;border:0;border-radius:12px;background:var(--raise);color:var(--ink);font:inherit;font-size:14.5px;font-weight:700;cursor:pointer}',
    '.bn-more svg{width:16px;height:16px}',
    '.bn-f{display:flex;flex-direction:column;gap:4px}.bn-f label{font-size:13px;font-weight:700;color:var(--ink2)}',
    '.bn-f input{width:100%;min-height:44px;padding:0 12px;border:1px solid var(--line);border-radius:12px;background:var(--raise);color:var(--ink);font:inherit;font-size:16px;font-weight:700;text-align:right;box-sizing:border-box}',
    '.bn-f input:focus{outline:2px solid var(--accent);outline-offset:0;border-color:transparent}',
    '.bn-f2{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
    '.bn-res{display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:12px 14px;border-radius:14px;background:var(--raise)}',
    '.bn-res span{font-size:13px;color:var(--ink2);font-weight:600}.bn-res b{font-size:20px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums}',
    '.bn-res b.up{color:var(--up)}.bn-res b.down{color:var(--down)}',
    '.bn-basis{margin:0;font-size:12px;color:var(--ink2);line-height:1.5}',
    /* 글자 크기 · 화면 밝기 시트 */
    '#bn-size{position:fixed;inset:0;z-index:90;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.5)}',
    '@media (min-width:1024px){#bn-size{align-items:center}}',
    '#bn-size .bn-sh{width:100%;max-width:480px;max-height:90%;overflow:auto;background:var(--surface);color:var(--ink);border-radius:20px 20px 0 0;padding:20px 16px calc(20px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:16px}',
    '@media (min-width:1024px){#bn-size .bn-sh{border-radius:20px}}',
    '.bn-sh-h{display:flex;align-items:center;justify-content:space-between}.bn-sh-h h2{margin:0;font-size:20px;font-weight:800}',
    '.bn-x{width:44px;height:44px;border:0;border-radius:12px;background:var(--raise);color:var(--ink);font:inherit;font-size:22px;cursor:pointer}',
    '.bn-opts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.bn-opts.two{grid-template-columns:1fr 1fr}',
    '.bn-opts button{min-height:56px;border:2px solid var(--line);border-radius:14px;background:var(--surface);color:var(--ink);font:inherit;font-weight:700;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}',
    '.bn-opts button[aria-pressed="true"]{border-color:var(--accent);background:var(--accent-soft,var(--acc-soft))}',
    '.bn-opts .ga{font-weight:800;line-height:1.1}.bn-opts small{font-size:13px;color:var(--ink2);font-weight:600}',
    '.bn-lab{margin:0 0 8px;font-size:14px;font-weight:700;color:var(--ink2)}',
    '.bn-ok{min-height:56px;border:0;border-radius:16px;background:var(--accent);color:var(--on-accent);font:inherit;font-size:17px;font-weight:800;cursor:pointer}'
  ].join('\n');
  var st = document.createElement('style'); st.id = 'bn-css'; st.textContent = CSS; document.head.appendChild(st);

  // ---- 자리 만들기 (iframe은 옮기지 않아요: 옮기면 다시 불러와요)
  var body = document.querySelector('#shell .body'), shell = $('shell');
  var seg = document.createElement('div'); seg.id = 'bn-seg'; seg.hidden = true; body.insertBefore(seg, $('frames'));
  var side = document.createElement('nav'); side.id = 'bn-side'; side.setAttribute('aria-label', '주요 메뉴'); body.insertBefore(side, body.firstChild);
  var panel = document.createElement('aside'); panel.id = 'bn-panel'; panel.setAttribute('aria-label', '홈 바로 보기'); body.appendChild(panel);
  var tab = document.createElement('nav'); tab.id = 'bn-tab'; tab.setAttribute('aria-label', '주요 메뉴'); shell.appendChild(tab);
  var topb = document.createElement('header'); topb.id = 'bn-top';
  topb.innerHTML = '<button type="button" class="bn-mb" data-bn="menu" aria-label="전체 메뉴 열기" aria-haspopup="dialog">' + MARK + '</button>' +
    '<button type="button" class="bn-wm" data-tab="home" aria-label="리딩노트 홈"><b>리딩노트</b><small>방송 속 고수 종목을 한눈에</small></button>' +
    '<button type="button" class="bn-ga" data-bn="theme" aria-label="어두운 화면으로 바꾸기"></button>';
  shell.insertBefore(topb, shell.firstChild);

  side.innerHTML = '<button type="button" class="bn-logo" data-bn="menu" aria-label="리딩노트 전체 메뉴 열기" aria-haspopup="dialog"><i>' + MARK + '</i><span><b>리딩노트</b><small>방송 속 고수 종목을 한눈에</small></span></button>' +
    TABS.map(function(t){ return '<button type="button" class="bn-mi" data-tab="' + t[0] + '">' + IC[t[0]] + '<span>' + t[1] + '</span></button>'; }).join('') +
    '<div class="bn-join" id="bn-join"><b>카카오로 3초 만에 가입</b><span>관심 전문가의 새 방송 종목과 추천을 알려 드려요. 무료예요.</span><button type="button" class="bn-kk" data-tab="my">카카오로 시작하기</button></div>' +
    '<div class="bn-foot"><button type="button" class="bn-mi bn-th" data-bn="theme"></button></div>';
  tab.innerHTML = TABS.map(function(t){ return '<button type="button" data-tab="' + t[0] + '">' + IC[t[0]] + '<span>' + t[1] + '</span></button>'; }).join('');

  function onTab(e){
    var b = e.target.closest && e.target.closest('[data-tab],[data-bn]'); if (!b) return;
    if (b.getAttribute('data-bn') === 'theme' || b.getAttribute('data-bn') === 'size') { toggleTheme(); return; }
    if (b.getAttribute('data-bn') === 'menu') { openDrawer(); return; }
    var id = b.getAttribute('data-tab'), t = TABS.filter(function(x){ return x[0] === id; })[0]; if (!t) return;
    go(t[2], t[3]);
  }
  side.addEventListener('click', onTab); tab.addEventListener('click', onTab); topb.addEventListener('click', onTab);

  // ---- 전체 메뉴 서랍 (로고를 누르면 열려요)
  var DR = [
    ['home', '홈', [['홈', 'ln', 'home'], ['오늘의 재료 뉴스', 'ln', 'news'], ['시세 조회', 'ln', 'quotes'], ['전문가 성적표', 'ln', 'rank']]],
    ['bc', '방송종목', [['전체 추천 기록', 'ln', 'tbl'], ['이번 주 방송', 'ln', 'bc'], ['지난 방송', 'ln', 'bcall'], ['전문가 찾기', 'ln', 'experts']]],
    ['tools', '도구', [['계산기', 'tools', 'home'], ['종목 검색', 'tools', 'search'], ['목표·손절가', 'tools', 'tp'], ['주식 기본기', 'tools', 'learn']]],
    ['cm', '커뮤니티', [['이번 주 토론', 'cm', 'home'], ['실시간 토론', 'cm', 'chat'], ['토론 목록', 'cm', 'agendas'], ['내 활동', 'cm', 'me']]],
    ['my', 'MY', [['MY 홈', 'ln', 'more'], ['관심 종목', 'ln', 'watch'], ['알림', 'ln', 'alerts'], ['화면 밝기 바꾸기', '', 'theme']]]
  ];
  var dr = null;
  function openDrawer(){
    if (dr) return; var c = cur();
    dr = document.createElement('div'); dr.id = 'bn-dr'; dr.setAttribute('role', 'dialog'); dr.setAttribute('aria-modal', 'true'); dr.setAttribute('aria-label', '전체 메뉴');
    dr.innerHTML = '<div class="sc" data-dr="x"></div><div class="pn">' +
      '<div class="dr-h"><span class="bn-mb" aria-hidden="true" style="cursor:default">' + MARK + '</span><span class="bn-wm"><b>리딩노트</b><small>전체 메뉴</small></span><button type="button" class="dr-x" data-dr="x" aria-label="메뉴 닫기">×</button></div>' +
      DR.map(function(sec){ return '<section class="dr-sec"><h2 class="dr-sh">' + IC[sec[0]] + esc(sec[1]) + (sec[0] === c.tab ? '<em>지금 보는 곳</em>' : '') + '</h2><div class="dr-g">' +
        sec[2].map(function(it){ return '<button type="button" class="dr-it" data-dr="go" data-app="' + it[1] + '" data-r="' + it[2] + '">' + esc(it[0]) + '</button>'; }).join('') + '</div></section>'; }).join('') +
      (member() ? '' : '<div class="dr-join"><b>무료 가입하고 알림 받기</b><span>관심 전문가의 새 방송 종목과 추천을 알려 드려요</span><button type="button" data-dr="go" data-app="ln" data-r="more">카카오로 3초 만에 시작</button></div>') +
      '<div class="dr-ft"><button type="button" data-dr="go" data-app="ln" data-r="install">앱 설치하기</button><button type="button" data-dr="go" data-app="ln" data-r="more">서비스 안내</button></div></div>';
    document.body.appendChild(dr); document.body.style.overflow = 'hidden';
    dr.addEventListener('click', function(e){
      var b = e.target.closest && e.target.closest('[data-dr]'); if (!b) return;
      if (b.getAttribute('data-dr') === 'x') { closeDrawer(); return; }
      var app = b.getAttribute('data-app'), r = b.getAttribute('data-r'); closeDrawer(true);
      if (r === 'size' || r === 'theme') toggleTheme(); else go(app, r);
    });
    var x = dr.querySelector('.dr-x'); if (x) x.focus();
  }
  function closeDrawer(nofocus){ if (!dr) return; dr.remove(); dr = null; document.body.style.overflow = ''; if (!nofocus) { var l = document.querySelector(MQ_PC.matches ? '.bn-logo' : '.bn-mb'); if (l) l.focus(); } }
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && dr) closeDrawer(); });
  seg.addEventListener('click', function(e){
    if (e.target.closest && e.target.closest('[data-bn-all]')) { go('ln', 'tbl'); return; }
    var b = e.target.closest && e.target.closest('[data-seg]'); if (!b) return;
    var c = cur(), s = (SEG[c.tab] || [])[+b.getAttribute('data-seg')]; if (s) go(s[1], s[2]);
  });

  // ---- 지금 위치 표시
  var last = '';
  function update(){
    var c = cur(), sig = c.tab + '|' + c.seg + '|' + c.app + '|' + c.route;
    root.classList.toggle('bn-home', c.tab === 'home');
    root.classList.toggle('bn-hasseg', !!SEG[c.tab]);
    root.classList.toggle('bn-deep', isDeep(c.app));
    placeStrip(c);
    root.classList.toggle('bn-bcwide', c.tab === 'bc' && MQ_PC.matches && wideBc());
    if (sig === last) return; last = sig;
    [side, tab].forEach(function(n){ Array.prototype.forEach.call(n.querySelectorAll('[data-tab]'), function(b){ if (b.classList.contains('bn-kk') || b.classList.contains('bn-logo')) return; if (b.getAttribute('data-tab') === c.tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); }); });
    var S2 = SEG[c.tab];
    if (S2) {
      seg.hidden = false;
      seg.innerHTML = (c.tab === 'bc' ? '<button type="button" class="bn-all" data-bn-all="1"' + (c.route === 'tbl' ? ' aria-current="page"' : '') + '>' + svg('<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M3.5 9.5h17M9 9.5v10"/>') + '<span><b>전체 추천 기록</b><small>방송·전문가 추천을 표로 한눈에</small></span>' + IC.chev + '</button>' : '') + '<div class="bn-track" role="group" aria-label="' + esc(TABS.filter(function(x){ return x[0] === c.tab; })[0][1]) + ' 화면 고르기">' + S2.map(function(s, i){ return '<button type="button" data-seg="' + i + '"' + (i === c.seg ? ' aria-current="page"' : '') + '>' + esc(s[0]) + '</button>'; }).join('') + '</div>';
    } else { seg.hidden = true; seg.innerHTML = ''; }
    if (c.tab === 'home') drawPanel();
  }
  ['pushState', 'replaceState'].forEach(function(k){ var o = history[k]; history[k] = function(){ var r = o.apply(this, arguments); setTimeout(update, 0); return r; }; });
  window.addEventListener('popstate', function(){ setTimeout(update, 0); });
  setInterval(update, 800);

  // ---- 각 서비스 화면: 안쪽 아래 메뉴 숨기기
  var FRAME_CSS = 'html body nav.nav,html body nav#nav{display:none!important}:root,html:root{--nav-h:0px!important}' +
    '@media (min-width:640px){html[data-wide] .app{max-width:840px!important}html[data-wide] .joinbar,html[data-wide] .sheet,html[data-wide] .push,html[data-wide] .composer{max-width:840px!important}}' +
    '.bn-ltop{height:6px}' +
    /* 11/6 PC 방송종목 2단 */
    'html .app:has(.bn-bc2),html[data-wide] .app:has(.bn-bc2){max-width:1180px!important}' +
    '.bn-bc2{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,340px);gap:16px;align-items:start;padding-left:16px;padding-right:16px}' +
    '.bn-bc2-l{min-width:0}.bn-bc2-r{position:sticky;top:12px;margin-top:.75rem}' +
    '.bn-tb{display:flex;flex-direction:column;margin:.5rem -.25rem 0}' +
    '.bn-tr{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) 96px 92px minmax(0,1.3fr);column-gap:12px;align-items:center;width:100%;min-height:62px;padding:8px 12px;border:0;border-top:1px solid var(--line);border-radius:0;background:transparent;color:var(--ink);font:inherit;text-align:left;cursor:pointer}' +
    '.bn-tr:hover{background:var(--raise)}.bn-tr.on{background:var(--accent-soft)}' +
    '.bn-th{min-height:40px;cursor:default;font-size:.8125rem;color:var(--ink2);border-top:0}.bn-th:hover{background:transparent}' +
    '.bn-tr .num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}.bn-tr>span{min-width:0}.bn-tr .num small{font-size:.8125rem;color:var(--sn);font-weight:600}' +
    '.bn-tr .nm{display:flex;flex-wrap:wrap;align-items:center;gap:2px 6px}.bn-tr .nm b{font-size:1rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}.bn-tr .nm small{flex-basis:100%;font-size:.8125rem;color:var(--ink2)}' +
    '.bn-tr .pg{font-size:.9375rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bn-tr .pg small{display:block;font-size:.8125rem;color:var(--ink2)}' +
    '.bn-tr .qt{font-size:.875rem;color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.bn-rt{display:inline-block;padding:3px 8px;border-radius:6px;font-weight:700}.bn-rt.up{color:var(--up);background:var(--up-soft)}.bn-rt.down{color:var(--down);background:var(--down-soft)}.mute{color:var(--ink2)}' +
    '.bn-hd{flex:none;font-size:.75rem;font-weight:800;color:var(--accent);box-shadow:inset 0 0 0 1.5px var(--accent);border-radius:6px;padding:1px 6px}' +
    '.bn-kd{flex:none;font-size:.75rem;font-weight:700;color:var(--ink2);background:var(--raise);border-radius:6px;padding:2px 7px}' +
    '.bn-pv{display:flex;flex-direction:column;gap:14px;padding:20px;border-radius:20px;background:var(--surface)}' +
    '.bn-pv-empty{margin:0;color:var(--ink2);font-size:.9375rem;line-height:1.6}' +
    '.bn-pv-h{display:flex;align-items:center;gap:8px}.bn-pv-h b{font-size:1.25rem;font-weight:800;letter-spacing:-.02em}' +
    '.bn-pv-s{margin:-8px 0 0;font-size:.875rem;color:var(--ink2)}' +
    '.bn-pv-r small{display:block;font-size:.8125rem;color:var(--ink2)}.bn-pv-r b{font-size:1.625rem;font-weight:800;font-variant-numeric:tabular-nums}.bn-pv-r b.up{color:var(--up)}.bn-pv-r b.down{color:var(--down)}.bn-pv-r b.mute{font-size:1rem}' +
    '.bn-pv-c{width:100%;height:auto;border-radius:12px;background:#fff}' +
    '.bn-pv-kv{display:grid;grid-template-columns:1fr 1fr;gap:10px 16px;margin:0}.bn-pv-kv dt{font-size:.8125rem;color:var(--ink2)}.bn-pv-kv dd{margin:2px 0 0;font-size:1.0625rem;font-weight:700;font-variant-numeric:tabular-nums}' +
    '.bn-pv-say{padding:14px 16px;border-radius:14px;background:var(--raise)}.bn-pv-say small{display:block;font-size:.8125rem;font-weight:700;color:var(--ink2);margin-bottom:4px}.bn-pv-say q{font-size:.9375rem;line-height:1.6}.bn-pv-q{margin:0;font-size:.9375rem;color:var(--ink2);line-height:1.6}' +
    '.bn-pv-a{display:flex;flex-wrap:wrap;gap:8px}.bn-pv-a button,.bn-pv-a a{display:inline-flex;align-items:center;min-height:44px;padding:0 14px;border:0;border-radius:12px;background:var(--raise);color:var(--ink);font:inherit;font-size:.9375rem;font-weight:700;text-decoration:none;cursor:pointer}' +
    '.bn-pv-cta{display:flex;flex-direction:column;gap:10px;padding:16px;border-radius:14px;background:var(--accent-soft)}.bn-pv-cta b{font-size:1rem}.bn-pv-cta button{min-height:48px;border:0;border-radius:12px;background:var(--accent);color:var(--on-accent);font:inherit;font-size:1rem;font-weight:800;cursor:pointer}' +
    '.bn-my{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0 4px}' +
    '.bn-my button{display:flex;align-items:center;gap:10px;min-height:56px;padding:0 14px;border:0;border-radius:16px;background:var(--surface);color:var(--ink);font:inherit;font-size:16px;font-weight:700;text-align:left;cursor:pointer}' +
    '.bn-my button svg{width:22px;height:22px;flex:none;color:var(--t2-acc-ink,var(--accent))}' +
    '.bn-wk-sub{margin:-.35rem 0 .6rem;font-size:.875rem;color:var(--ink2)}' +
    '.bn-soon{display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;min-height:56px;padding:.85rem 0;border:0;border-top:1px solid var(--line);background:none;color:var(--ink);font:inherit;text-align:left;cursor:pointer}.bn-soon:first-of-type{border-top:0}' +
    '.bn-soon em{font-style:normal;font-size:.8125rem;font-weight:800;color:var(--t2-acc-ink);background:var(--accent-soft);border-radius:6px;padding:.1rem .45rem;margin-top:.2rem}' +
    '.bn-soon b{font-size:1.0625rem;font-weight:800}.bn-soon span{font-size:.875rem;color:var(--ink2)}' +
    '.bn-mb{margin-top:.75rem}.bn-mb-sub{margin:-.25rem 0 .6rem;font-size:.875rem;color:var(--ink2);line-height:1.5}' +
    '.bn-mb-l{list-style:none;margin:0 0 .5rem;padding:0}.bn-mb-r{display:flex;align-items:center;gap:.6rem;padding:.75rem 0;border-top:1px solid var(--line)}.bn-mb-r:first-child{border-top:0}' +
    '.bn-mb-n{flex:1;min-width:0;display:flex;flex-direction:column}.bn-mb-n b{font-size:1.0625rem;font-weight:800}.bn-mb-n span,.bn-mb-v span{font-size:.8125rem;color:var(--ink2)}' +
    '.bn-mb-v{flex:none;display:flex;flex-direction:column;align-items:flex-end}.bn-mb-v b{font-size:1.0625rem;font-weight:800;font-variant-numeric:tabular-nums}.bn-mb-v b.up{color:var(--up)}.bn-mb-v b.down{color:var(--down)}' +
    '.bn-mb-x{flex:none;width:44px;height:44px;border:0;border-radius:12px;background:var(--raise);color:var(--ink2);font:inherit;font-size:1.25rem;cursor:pointer}' +
    '.bn-mb-f{display:flex;flex-direction:column;gap:.35rem;padding:.9rem 0 .5rem;border-top:1px solid var(--line)}.bn-mb-f label{font-size:.875rem;font-weight:700;color:var(--ink2)}' +
    '.bn-mb-f input{width:100%;box-sizing:border-box;min-height:48px;padding:0 .85rem;border:1px solid var(--line);border-radius:12px;background:var(--raise);color:var(--ink);font:inherit;font-size:1.0625rem}' +
    '.bn-mb-2{display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-top:.35rem}.bn-mb-2>div{display:flex;flex-direction:column;gap:.35rem}' +
    '.bn-mb-err{margin:0;min-height:0;font-size:.875rem;font-weight:700;color:var(--up)}.bn-mb-err:empty{display:none}' +
    '.bn-mb-add{margin-top:.4rem;min-height:56px;border:0;border-radius:16px;background:var(--accent);color:var(--on-accent);font:inherit;font-size:1.0625rem;font-weight:800;cursor:pointer}';
  function putCss(f){
    var d; try { d = f.contentDocument; } catch (e) { return; }
    if (!d || !d.head || d.getElementById('bn-frame')) return;
    if (!/(ln|tools|community)\.html/.test(d.URL || '')) return;
    /* 11/6: 뒤로 가기가 없는 첫 화면의 머리 줄 — 도구 · 커뮤니티는 위 세그먼트와 같은 제목이라 숨기고,
       리딩 모음(검색 · 알림 버튼이 있음)은 고정하지 않고 함께 올라가게 해요 */
    var TOP0 = 'header.top:not(:has(.back,[data-a="back"],[data-bn-go]))';
    var extra = /ln\.html/.test(d.URL || '') ? TOP0 + '{position:static!important}' : TOP0 + '{display:none!important}';
    var s = d.createElement('style'); s.id = 'bn-frame'; s.textContent = FRAME_CSS + extra; d.head.appendChild(s);
  }

  // ---- 리딩 모음(ln): 방송종목 화면(#ln/bc · #ln/bcall)과 MY 바로가기
  var H0 = window.__bnHash0 != null ? window.__bnHash0 : location.hash || '';
  // 바깥 주소(리딩노트 첫 화면 index.html)로 #home · #bc · #my 를 열었을 때도 받아요
  try { if (!H0 && window.parent !== window && /^#(home|bc|broadcast|my)$/.test(window.parent.location.hash || '')) { H0 = window.parent.location.hash; window.parent.history.replaceState(window.parent.history.state, '', window.parent.location.pathname + window.parent.location.search); } } catch (e) {}
  var INIT = H0.replace(/^#\/?/, '');
  var initDone = false;
  function patchLn(w){
    if (!w || w.__bnLn || !w.__site || !w.render || !w.S) return;
    var lp = window.__lnPlus;
    w.__bnLn = true;
    var S = w.S;
    try { w.VIEW_TITLE.pbcwk = '이번 주 방송'; } catch (e) {}
    var og = w.__site.go;
    w.__site.go = function(r){
      if (r === 'rank' || r === 'quotes') { S.stack = [{ t: r, id: '' }]; S.sheet = null; S.tab = 'home'; w.render(); try { w.scrollTo(0, 0); } catch (e) {} return; }
      if (r === 'bc' || r === 'bcall') {
        var api = window.__lnPlus && window.__lnPlus.api;
        S.stack = [{ t: r === 'bc' && api ? 'pbcwk' : 'pbcall', id: '' }]; S.sheet = null; S.tab = 'home';
        w.render(); try { w.scrollTo(0, 0); } catch (e) {} return;
      }
      return og.apply(this, arguments);
    };
    // 세그먼트가 머리 역할을 해서, 방송종목 첫 화면엔 뒤로 가기 줄을 그리지 않아요
    if (typeof w.topBar === 'function') {
      var otb = w.topBar;
      w.topBar = function(){
        try { var st2 = S.stack; if (st2.length === 1 && (st2[0].t === 'pbcwk' || st2[0].t === 'pbcall')) return '<div class="bn-ltop"></div>'; } catch (e) {}
        var h = otb.apply(this, arguments);
        try {
          if (!S.stack.length) {
            var BK = /<button class="icon-btn" data-a="back"[^>]*>[\s\S]*?<\/button>/;
            // 아래 5탭의 첫 화면(전문가 · MY)엔 뒤로 가기가 필요 없어요
            if (S.tab === 'experts' || S.tab === 'more') h = h.replace(BK, '');
            if (S.tab === 'more') h = h.replace(/(<h1 class="top-title">)[^<]*(<\/h1>)/, '$1MY$2');
            // MY 안의 관심 종목 · 알림은 뒤로 가면 MY로
            if (S.tab === 'watch' || S.tab === 'alerts') h = h.replace('data-a="back"', 'data-bn-go="more"');
          } else if (S.stack.length === 1 && S.stack[0].t === 'ptable') h = h.replace('data-a="back"', 'data-bn-go="bc"');
        } catch (e) {}
        return h;
      };
    }
    // 주소에 방송종목 화면을 남겨요 (#ln/bc · #ln/bcall)
    if (typeof w.reportRoute === 'function') {
      var orr = w.reportRoute;
      w.reportRoute = function(r){
        try { var st3 = S.stack, top = st3[st3.length - 1];
          if (top && top.t === 'ptable' && st3.length === 1) r = 'tbl';
          else if (top && (top.t === 'pbcwk' || top.t === 'pbcall' || top.t === 'pbc')) for (var i = st3.length - 1; i >= 0; i--) { if (st3[i].t === 'pbcall') { r = 'bcall'; break; } if (st3[i].t === 'pbcwk') { r = 'bc'; break; } }
        } catch (e) {}
        return orr.call(this, r);
      };
    }
    // 이번 주 방송 화면
    if (typeof w.screenExperts === 'function') {
      var oxs = w.screenExperts;
      w.screenExperts = function(){ var v = w.view(); if (v && v.t === 'pbcwk') return screenWeek(); return oxs.apply(this, arguments); };
    }
    // MY: 마이페이지 맨 위 바로가기
    if (typeof w.screenMore === 'function') {
      var om = w.screenMore;
      w.screenMore = function(){
        var h = om.apply(this, arguments), i = h.indexOf('<main'), j = i > -1 ? h.indexOf('>', i) : -1;
        var grid = '<div class="bn-my gx" role="group" aria-label="MY 바로가기">' +
          '<button type="button" data-bn-go="watch">' + svg('<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>') + '관심 종목</button>' +
          '<button type="button" data-bn-go="alerts">' + svg('<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>') + '알림</button>' +
          '<button type="button" data-bn-go="experts">' + IC.bc + '방송 전문가</button>' +
          '<button type="button" data-bn-go="theme">' + IC.moon + '화면 밝기</button></div>';
        grid += myBuyHTML(w);
        return j > -1 ? h.slice(0, j + 1) + grid + h.slice(j + 1) : grid + h;
      };
    }
    w.document.addEventListener('input', function(e){
      var id = e.target && e.target.id;
      if (id === 'bn-mb-price' || id === 'bn-mb-qty') fmtNum(e.target);
      else if (id === 'bn-mb-name') { clearTimeout(MBQ.t); var v = e.target.value; MBQ.t = setTimeout(function(){ mbSuggest(w, v); }, 250); }
    });
    w.document.addEventListener('click', function(e){
      var m = e.target.closest && e.target.closest('[data-bn-mb]');
      if (m) { e.preventDefault(); e.stopPropagation(); myBuyAct(w, m); return; }
      var pk = e.target.closest && e.target.closest('[data-bn-pk]');
      if (pk) { e.preventDefault(); e.stopPropagation(); BCSEL = +pk.getAttribute('data-bn-pk') || 0; var sy = w.scrollY; try { w.render(); w.scrollTo(0, sy); } catch (er) {} return; }
      if (e.target.closest && e.target.closest('[data-bn-calc]')) { e.preventDefault(); e.stopPropagation(); go('tools', 'home'); return; }
      var b = e.target.closest && e.target.closest('[data-bn-go]'); if (!b) return;
      e.preventDefault(); e.stopPropagation();
      var r = b.getAttribute('data-bn-go'); if (r === 'size' || r === 'theme') toggleTheme(); else go('ln', r);
    }, true);
    var rzT = null, wasWide = null;
    w.addEventListener('resize', function(){ clearTimeout(rzT); rzT = setTimeout(function(){ var nw = wideBc(); if (nw === wasWide) return; wasWide = nw; try { var v = w.view && w.view(); if (v && v.t === 'pbcwk') w.render(); } catch (e) {} }, 200); });
    try { w.render(); } catch (e) {}
    // 링크로 들어온 화면(#ln/bc · #ln/s-종목코드 · #ln/x-전문가 등)은 자료가 준비된 뒤 한 번 더 열어요
    if (!initDone) { initDone = true; var m0 = /^ln\/(.+)$/.exec(INIT); if (m0 && m0[1] !== 'home') reopen(w, m0[1]); }
  }
  // ---- MY · 내 매수가 기록 (이 기기에만 저장 · 장 마감 가격 기준 수익률)
  //      종목 이름 찾기와 종가는 서버 stocks 표(도구와 같은 자료)에서 읽어요
  var MB_KEY = 'ln.mybuy.v1', MBQ = { px: {}, asOf: '', want: {}, busy: false, sugg: [], t: null };
  function mbLoad(){ try { var a = JSON.parse(localStorage.getItem(MB_KEY)); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function mbSave(a){ try { localStorage.setItem(MB_KEY, JSON.stringify(a)); } catch (e) {} }
  function sbc(){ try { return window.__lnAuth && window.__lnAuth.sb; } catch (e) { return null; } }
  function wonS(n){ return Math.round(n).toLocaleString('ko-KR') + '원'; }
  function mbPx(w, L){
    var need = L.map(function(x){ return x.c; }).filter(function(c){ return !MBQ.px[c] && !MBQ.want[c]; });
    var c0 = sbc(); if (!need.length || !c0 || MBQ.busy) return;
    need.forEach(function(c){ MBQ.want[c] = 1; }); MBQ.busy = true;
    Promise.resolve(c0.from('stocks').select('code,close,as_of').in('code', need)).then(function(r){
      MBQ.busy = false; (r && r.data || []).forEach(function(s){ MBQ.px[s.code] = s; if (s.as_of && s.as_of > MBQ.asOf) MBQ.asOf = s.as_of; });
      try { if (w.S && w.S.tab === 'more' && !w.S.stack.length) w.render(); } catch (e) {}
    }, function(){ MBQ.busy = false; });
  }
  function myBuyHTML(w){
    var L = mbLoad(); mbPx(w, L);
    var rows = L.map(function(x, i){
      var q = MBQ.px[x.c], r = q && q.close ? (q.close / x.p - 1) * 100 : null, cl = r == null ? '' : r > 0 ? 'up' : r < 0 ? 'down' : '';
      return '<li class="bn-mb-r"><span class="bn-mb-n"><b>' + esc(x.n) + '</b><span>산 가격 ' + wonS(x.p) + (x.q ? ' · ' + Number(x.q).toLocaleString('ko-KR') + '주' : '') + '</span></span>' +
        '<span class="bn-mb-v">' + (q && q.close ? '<b class="' + cl + '">' + (r > 0 ? '+' : r < 0 ? '−' : '') + Math.abs(r).toFixed(2) + '%</b><span>종가 ' + wonS(q.close) + (x.q ? ' · ' + (r >= 0 ? '+' : '−') + wonS(Math.abs((q.close - x.p) * x.q)) : '') + '</span>' : '<span>가격 불러오는 중</span>') + '</span>' +
        '<button type="button" class="bn-mb-x" data-bn-mb="del" data-i="' + i + '" aria-label="' + esc(x.n) + ' 기록 지우기">×</button></li>';
    }).join('');
    var asOf = MBQ.asOf ? (+MBQ.asOf.slice(5, 7)) + '월 ' + (+MBQ.asOf.slice(8, 10)) + '일 ' : '';
    return '<section class="t2-sec bn-mb" aria-labelledby="bn-mb-h"><div class="t2-h" id="bn-mb-h" style="cursor:default">내 매수가 기록<span class="n">' + L.length + '</span></div>' +
      '<p class="bn-mb-sub">산 가격을 적어 두면 ' + asOf + '장 마감 가격 기준 수익률을 보여 드려요. 이 기기에만 저장돼요.</p>' +
      (L.length ? '<ul class="bn-mb-l">' + rows + '</ul>' : '') +
      '<div class="bn-mb-f"><label for="bn-mb-name">종목 이름</label><input id="bn-mb-name" list="bn-mb-dl" autocomplete="off" placeholder="예: 삼성전자"><datalist id="bn-mb-dl"></datalist>' +
      '<div class="bn-mb-2"><div><label for="bn-mb-price">산 가격 (1주)</label><input id="bn-mb-price" inputmode="numeric" autocomplete="off" placeholder="예: 41,000"></div><div><label for="bn-mb-qty">수량 (선택)</label><input id="bn-mb-qty" inputmode="numeric" autocomplete="off" placeholder="예: 10"></div></div>' +
      '<p class="bn-mb-err" id="bn-mb-err" role="alert"></p><button type="button" class="bn-mb-add" data-bn-mb="add">매수가 기록하기</button></div>' +
      '<p class="bn-mb-sub" style="margin-top:.5rem">수수료·세금을 빼기 전 수익률이에요. 사거나 팔라는 권유가 아니에요.</p></section>';
  }
  function mbSuggest(w, q){
    var c0 = sbc(), d = w.document; q = String(q || '').trim(); if (!c0 || !q) return;
    var req = /^\d{2,6}$/.test(q) ? c0.from('stocks').select('code,name,close,as_of').like('code', q + '%').limit(8) : c0.from('stocks').select('code,name,close,as_of').ilike('name', '%' + q.replace(/[%_]/g, '') + '%').order('cap_eok', { ascending: false, nullsFirst: false }).limit(8);
    Promise.resolve(req).then(function(r){
      MBQ.sugg = (r && r.data) || []; MBQ.sugg.forEach(function(s){ MBQ.px[s.code] = s; if (s.as_of && s.as_of > MBQ.asOf) MBQ.asOf = s.as_of; });
      var dl = d.getElementById('bn-mb-dl'); if (dl) dl.innerHTML = MBQ.sugg.map(function(s){ return '<option value="' + esc(s.name) + '">' + esc(s.code) + '</option>'; }).join('');
    }, function(){});
  }
  function fmtNum(el){ var raw = String(el.value || '').replace(/[^\d]/g, '').slice(0, 12), fm = raw ? Number(raw).toLocaleString('ko-KR') : ''; if (el.value !== fm) el.value = fm; }
  function myBuyAct(w, b){
    var a = b.getAttribute('data-bn-mb'), L = mbLoad(), d = w.document;
    if (a === 'del') { L.splice(+b.getAttribute('data-i'), 1); mbSave(L); try { w.render(); } catch (e) {} return; }
    if (a !== 'add') return;
    var nm = String((d.getElementById('bn-mb-name') || {}).value || '').trim(), pr = +String((d.getElementById('bn-mb-price') || {}).value || '').replace(/[^\d]/g, ''), qt = +String((d.getElementById('bn-mb-qty') || {}).value || '').replace(/[^\d]/g, '');
    var err = d.getElementById('bn-mb-err'), say = function(m){ if (err) err.textContent = m; };
    if (!nm) return say('종목 이름을 적어 주세요.');
    if (!(pr > 0)) return say('산 가격을 적어 주세요.');
    var done = function(s){
      if (!s) return say('종목을 찾지 못했어요. 목록에 나오는 이름을 골라 주세요.');
      MBQ.px[s.code] = s; L.unshift({ c: s.code, n: s.name, p: pr, q: qt > 0 ? qt : 0, at: new Date().toISOString().slice(0, 10) }); mbSave(L.slice(0, 50));
      try { w.render(); } catch (e) {}
    };
    var hit = MBQ.sugg.filter(function(s){ return s.name === nm || s.code === nm; })[0]; if (hit) return done(hit);
    var c0 = sbc(); if (!c0) return say('서버에 연결하지 못했어요. 잠시 뒤 다시 해 주세요.');
    Promise.resolve(c0.from('stocks').select('code,name,close,as_of').or('name.eq.' + nm.replace(/[,()]/g, '') + ',code.eq.' + nm.replace(/[^\d]/g, '0')).limit(1)).then(function(r){ done(r && r.data && r.data[0]); }, function(){ say('서버에 연결하지 못했어요. 잠시 뒤 다시 해 주세요.'); });
  }
  function reopen(w, r){
    var n = 0, iv = setInterval(function(){
      n++; var v = null; try { v = w.view(); } catch (e) {}
      var done = false;
      if (/^s-/.test(r)) { if (v && v.t === 'stock' && v.id === r.slice(2)) done = true; else if (w.STOCKS && w.STOCKS[r.slice(2)]) { SH.show('ln', r); done = true; } }
      else if (/^x-/.test(r)) { if (v && v.t === 'expert' && v.id === r.slice(2)) done = true; else if ((w.EXPERTS || []).some(function(x){ return x.id === r.slice(2); })) { SH.show('ln', r); done = true; } }
      else { SH.show('ln', r); done = true; }
      if (done || n > 50) clearInterval(iv);
    }, 300);
  }
  function wk(){
    var lp = window.__lnPlus, A = lp && lp.api; if (!A) return null;
    var now = A.nowK(), today = A.ymdOf(now), wd = A.wdOf(today), mon = A.ymdOf(A.kstMs(today) - (wd - 1) * 864e5), sun = A.ymdOf(A.kstMs(mon) + 6 * 864e5);
    return { A: A, lp: lp, now: now, today: today, mon: mon, sun: sun };
  }
  function md(ymd){ return (+ymd.slice(5, 7)) + '월 ' + (+ymd.slice(8, 10)) + '일'; }
  // ---- 11/6 PC 방송종목: 토스형 2단 (왼쪽 이번 주 종목 표 · 오른쪽 고른 종목 미리보기)
  var BCSEL = 0;
  function wideBc(){ var w = W('ln'); try { return !!(w && w.innerWidth >= 900); } catch (e) { return false; } }
  function pctTxt(v){ return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(2) + '%'; }
  function wonTxt(n){ return n ? Math.round(n).toLocaleString('ko-KR') + '원' : '—'; }
  function bcPicks(A, done){
    var out = [];
    done.forEach(function(sl){
      var ep = sl.ep; if (!ep || !ep.published) return;
      (ep.picks || []).forEach(function(k){ out.push({ k: k, sl: sl, ep: ep, lock: k.kind === 'secret' && !k.revealed, ret: A.pickRet ? A.pickRet(k) : null }); });
    });
    return out;
  }
  function bcPreview(A, it){
    if (!it) return '<div class="bn-pv"><p class="bn-pv-empty">왼쪽 표에서 종목을 고르면 여기에 자세히 보여 드려요.</p></div>';
    var k = it.k, sl = it.sl, ep = it.ep, lbl = '';
    try { lbl = A.pkLabel(k, ep && ep.program_id); } catch (e) {}
    var head = '<div class="bn-pv-h">' + (k.kind === 'secret' ? '<span class="bn-hd">히든주</span>' : (lbl ? '<span class="bn-kd">' + esc(lbl) + '</span>' : '')) +
      '<b>' + (it.lock ? '방송에서 아직 공개 전이에요' : esc(k.stock_name || '')) + '</b></div>' +
      '<p class="bn-pv-s">' + esc(sl.p.name) + ' · ' + esc(k.expert_name || '') + ' · ' + md(sl.date) + ' 방송</p>';
    if (it.lock) return '<div class="bn-pv">' + head + '<p class="bn-pv-q">공개되면 종목과 매수·목표 가격을 바로 정리해 드려요.</p></div>';
    var ret = it.ret ? '<div class="bn-pv-r"><small>' + (it.ret.done ? '매도 수익률' : '방송 후 수익률') + '</small><b class="' + (it.ret.v > 0 ? 'up' : it.ret.v < 0 ? 'down' : '') + '">' + pctTxt(it.ret.v) + '</b></div>' : '<div class="bn-pv-r"><small>방송 후 수익률</small><b class="mute">시세 표시 준비 중</b></div>';
    var kv = '<dl class="bn-pv-kv"><div><dt>매수가</dt><dd>' + wonTxt(k.buy) + '</dd></div><div><dt>목표가</dt><dd>' + wonTxt(k.target) + '</dd></div>' +
      (k.stop ? '<div><dt>손절가</dt><dd>' + wonTxt(k.stop) + '</dd></div>' : '') + (k.sell ? '<div><dt>매도가</dt><dd>' + wonTxt(k.sell) + '</dd></div>' : '') + '</dl>';
    var chart = k.stock_code ? '<img class="bn-pv-c" alt="' + esc(k.stock_name || '') + ' 최근 3개월 주가 흐름 (네이버 증권)" loading="lazy" src="https://ssl.pstatic.net/imgfinance/chart/item/area/month3/' + encodeURIComponent(k.stock_code) + '.png">' : '';
    var q = k.quote ? '<div class="bn-pv-say"><small>방송에서 이렇게 말했어요</small><q>' + esc(k.quote) + '</q></div>' : '';
    var acts = '<div class="bn-pv-a">' + (k.stock_code ? '<button type="button" data-a="stock" data-v="' + esc(k.stock_code) + '">종목 자세히</button>' : '') +
      (ep && ep.video_url ? '<a href="' + esc(ep.video_url) + '" target="_blank" rel="noopener noreferrer">방송 영상 보기 ↗</a>' : '') + '</div>';
    var calc = '<div class="bn-pv-cta"><b>해당 종목 예상 수익이 궁금하다면?</b><button type="button" data-bn-calc="1">수익 계산기 열기</button></div>';
    return '<div class="bn-pv">' + head + ret + chart + kv + q + acts + calc + '</div>';
  }
  function screenWeekWide(K, A, r, done, soon, foot){
    var rows = bcPicks(A, done); if (BCSEL >= rows.length) BCSEL = 0;
    // 값이 하나도 없는 열(전부 '—')은 열 자체를 숨겨요
    var hasBuy = rows.some(function(it){ return !it.lock && it.k.buy; }), hasRet = rows.some(function(it){ return !!it.ret; }), hasQt = rows.some(function(it){ return !!it.k.quote; });
    var gcol = 'grid-template-columns:minmax(0,1.3fr) minmax(0,1fr)' + (hasBuy ? ' 116px' : '') + (hasRet ? ' 92px' : '') + (hasQt ? ' minmax(0,1.3fr)' : '');
    var tb = rows.length ? '<div class="bn-tb" role="table" aria-label="이번 주 방송 종목"><div class="bn-tr bn-th" role="row" style="' + gcol + '"><span role="columnheader">종목 · 전문가</span><span role="columnheader">방송</span>' + (hasBuy ? '<span role="columnheader" class="num">매수가</span>' : '') + (hasRet ? '<span role="columnheader" class="num">수익률</span>' : '') + (hasQt ? '<span role="columnheader">한마디</span>' : '') + '</div>' +
      rows.map(function(it, i){
        var k = it.k, rv = it.ret ? '<span class="bn-rt ' + (it.ret.v > 0 ? 'up' : it.ret.v < 0 ? 'down' : '') + '">' + pctTxt(it.ret.v) + '</span>' : '<span class="mute">—</span>';
        return '<button type="button" class="bn-tr' + (i === BCSEL ? ' on' : '') + '" role="row" data-bn-pk="' + i + '" aria-pressed="' + (i === BCSEL) + '" style="' + gcol + '">' +
          '<span class="nm">' + (k.kind === 'secret' ? '<span class="bn-hd">히든주</span>' : '') + '<b>' + (it.lock ? '공개 전' : esc(k.stock_name || '')) + '</b><small>' + esc(k.expert_name || '') + '</small></span>' +
          '<span class="pg">' + esc(it.sl.p.name) + '<small>' + (+it.sl.date.slice(5, 7)) + '.' + (+it.sl.date.slice(8, 10)) + '</small></span>' +
          (hasBuy ? '<span class="num">' + (it.lock ? '—' : k.buy ? wonTxt(k.buy) : '<small>미공개</small>') + '</span>' : '') + (hasRet ? '<span class="num">' + rv + '</span>' : '') +
          (hasQt ? '<span class="qt">' + esc(k.quote || '') + '</span>' : '') + '</button>';
      }).join('') + '</div>' : '<p class="t2-empty">이번 주에 정리된 방송 종목이 아직 없어요. 방송이 끝나면 전문가별 종목과 가격을 여기 표로 보여 드려요.</p>';
    var WDN = ['', '월', '화', '수', '목', '금', '토', '일'];
    var left = '<section class="t2-sec"><div class="t2-h" style="cursor:default">이번 주 방송 종목<span class="n">' + rows.length + '</span></div>' +
      '<p class="bn-wk-sub">' + md(K.mon) + ' ~ ' + md(K.sun) + ' · SBS Biz 본방송 · 줄을 누르면 오른쪽에 자세히 보여요</p>' + tb + '</section>' +
      (r.top ? '<section class="t2-sec">' + A.bcTopCard(r.top, K.now) + '</section>' : '') +
      (soon.length ? '<section class="t2-sec"><div class="t2-h" style="cursor:default">이번 주 남은 방송</div>' + soon.map(function(sl){
        var ep = sl.ep, xs = ep && ep.experts && ep.experts.length ? ep.experts.map(function(x){ return x.name; }).join(', ') : (sl.p.lineup_note || '');
        return '<button type="button" class="bn-soon" data-a="pBc" data-v="' + esc(sl.key) + '"><b>' + esc(sl.p.name) + '</b><span>' + WDN[A.wdOf(sl.date)] + ' ' + (+sl.date.slice(5, 7)) + '.' + (+sl.date.slice(8, 10)) + ' ' + esc(String(sl.p.air_time || '20:30').slice(0, 5)) + (xs ? ' · ' + esc(xs) : '') + '</span></button>';
      }).join('') + '</section>' : '');
    return '<main class="t2 bn-bc2" style="padding-top:.25rem"><div class="bn-bc2-l">' + left + foot.replace('</main>', '') + '</div><aside class="bn-bc2-r" aria-label="고른 종목 미리보기">' + bcPreview(A, rows[BCSEL]) + '</aside></main>';
  }
  function screenWeek(){
    var K = wk(), CH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
    var foot = '<button class="p-go" data-a="pBcAll"><span>지난 방송 모두 보기</span>' + CH + '</button><p class="t2-basis">SBS Biz 본방송에서 전문가가 직접 한 말과 가격을 정리해요. 사거나 팔라는 권유가 아니에요.</p></main>';
    if (!K || !K.lp.bc) return '<main class="t2" style="padding-top:.25rem"><section class="t2-sec"><p class="t2-empty">방송 정보를 불러오는 중이에요.</p></section>' + foot;
    var A = K.A, F = K.lp.bc, r = A.bcSlots(F, K.now);
    var done = r.past.filter(function(x){ return x.date >= K.mon && x.date <= K.sun; });
    var soon = r.all.filter(function(x){ return x.date > K.today && x.date <= K.sun; }).sort(function(a, b){ return a.start - b.start; });
    var WDN = ['', '월', '화', '수', '목', '금', '토', '일'];
    if (wideBc()) return screenWeekWide(K, A, r, done, soon, foot);
    var items = [];
    done.forEach(function(sl){ var ep = sl.ep; if (!ep || !ep.published) return; (A.secretFirst ? A.secretFirst(ep.picks || []) : (ep.picks || [])).forEach(function(k){ items.push({ k: k, sl: sl, opt: { prog: true } }); }); });
    var h = '<main class="t2" style="padding-top:.25rem">' + (r.top ? '<section class="t2-sec">' + A.bcTopCard(r.top, K.now) + '</section>' : '') +
      (items.length && A.pickRows ? '<section class="t2-sec"><div class="t2-h" style="cursor:default">이번 주 방송 종목<span class="n">' + items.length + '</span></div><p class="bn-wk-sub">' + md(K.mon) + ' ~ ' + md(K.sun) + ' · 줄을 누르면 종목을 자세히 보여 드려요</p>' + A.pickRows(items, 8) + '</section>' : '') +
      '<section class="t2-sec"><div class="t2-h" style="cursor:default">방송별로 보기<span class="n">' + done.length + '</span></div>' +
      '<p class="bn-wk-sub">' + md(K.mon) + ' ~ ' + md(K.sun) + ' · SBS Biz 본방송</p>' +
      (done.length ? done.map(A.bcRow).join('') : '<p class="t2-empty">이번 주에 끝난 방송이 아직 없어요.<br>방송이 끝나면 전문가별 종목과 가격을 정리해서 보여 드려요.</p>') + '</section>';
    if (soon.length) h += '<section class="t2-sec"><div class="t2-h" style="cursor:default">이번 주 남은 방송</div>' + soon.map(function(sl){
      var ep = sl.ep, xs = ep && ep.experts && ep.experts.length ? ep.experts.map(function(x){ return x.name; }).join(', ') : (sl.p.lineup_note || ''), n = ep && ep.picks ? ep.picks.length : 0;
      return '<button type="button" class="bn-soon" data-a="pBc" data-v="' + esc(sl.key) + '"><b>' + esc(sl.p.name) + '</b><span>' + WDN[A.wdOf(sl.date)] + ' ' + (+sl.date.slice(5, 7)) + '.' + (+sl.date.slice(8, 10)) + ' ' + esc(String(sl.p.air_time || '20:30').slice(0, 5)) + (xs ? ' · ' + esc(xs) : '') + '</span>' + (n ? '<em>미리 알려진 종목 ' + n + '개</em>' : '') + '</button>';
    }).join('') + '</section>';
    return h + foot;
  }

  function scanFrames(){
    Array.prototype.forEach.call(document.querySelectorAll('#frames iframe'), function(f){
      if (!f.__bn) { f.__bn = true; f.addEventListener('load', function(){ putCss(f); var w = f.contentWindow; setTimeout(function(){ try { if (/ln\.html/.test(f.contentDocument.URL)) patchLn(w); } catch (e) {} }, 0); }); }
      putCss(f);
      try { if (/ln\.html/.test(f.contentDocument.URL)) patchLn(f.contentWindow); } catch (e) {}
    });
  }
  scanFrames();
  new MutationObserver(scanFrames).observe($('frames'), { childList: true });
  var scanIv = setInterval(scanFrames, 400); setTimeout(function(){ clearInterval(scanIv); setInterval(scanFrames, 3000); }, 30000);

  // 예전 주소 별칭: #home · #bc · #my
  (function(){
    var m = { home: ['ln', 'home'], bc: ['ln', 'bc'], broadcast: ['ln', 'bc'], my: ['ln', 'more'], tools: null, cm: null, ln: null };
    var a = INIT.split('/')[0];
    if (m[a]) { INIT = 'ln/' + m[a][1]; try { history.replaceState(null, '', '#ln' + (m[a][1] === 'home' ? '' : '/' + m[a][1])); } catch (e) {} SH.show(m[a][0], m[a][1]); }
  })();

  // ---- 카카오 가입 카드: 로그인하면 숨겨요
  function member(){ var w = W('ln'); try { return !!(w && w.P && w.P.member); } catch (e) { return false; } }
  function syncJoin(){ var j = $('bn-join'); if (j) j.hidden = member(); }
  setInterval(syncJoin, 1500);

  // ---- 오른쪽 칸 (PC 1280px 이상, 홈에서만)
  var calc = { buy: '', now: '', qty: '' };
  function won(n){ return Math.round(n).toLocaleString('ko-KR') + '원'; }
  function topStocks(){
    var K = wk(); if (!K || !K.lp.bc) return null;
    var A = K.A, F = K.lp.bc, M = {};
    (F.episodes || []).forEach(function(e){
      if (!e.published || e.canceled || e.air_date < K.mon || e.air_date > K.today) return;
      (e.picks || []).forEach(function(k){
        if (k.kind === 'secret' && !k.revealed) return;
        var key = A.bcNorm(k.stock_name); if (!key) return;
        var o = M[key] || (M[key] = { name: k.stock_name, code: k.stock_code || '', n: 0, who: {} });
        o.n++; if (k.expert_name) o.who[A.bcNorm(k.expert_name)] = 1; if (!o.code && k.stock_code) o.code = k.stock_code;
      });
    });
    return Object.keys(M).map(function(k){ return M[k]; }).sort(function(a, b){ return b.n - a.n || Object.keys(b.who).length - Object.keys(a.who).length || (a.name < b.name ? -1 : 1); }).slice(0, 5);
  }
  function watchNews(){
    var w = W('ln'), out = { names: [], items: [] }; if (!w || !w.P) return out;
    var ids = (w.P.watch || []).concat(w.P.qwatch || []).filter(function(v, i, a){ return a.indexOf(v) === i; }).slice(0, 30);
    var list = ids.map(function(id){ var s = (w.STOCKS && w.STOCKS[id]) || null, q = (w.PX && w.PX.byCode && w.PX.byCode[id]) || null; return { id: id, name: (s && s.name) || (q && q.n) || '', code: /^\d{6}$/.test(id) ? id : '' }; }).filter(function(x){ return x.name; });
    out.names = list;
    var rows = (window.__lnNews && window.__lnNews.rows) || [];
    rows.forEach(function(r){
      if (out.items.length >= 4) return;
      var hit = (r.stocks || []).filter(function(s){ return list.some(function(x){ return (x.code && s.c === x.code) || (s.n && s.n === x.name); }); })[0];
      if (hit) out.items.push({ r: r, s: hit });
    });
    return out;
  }
  function panelHTML(){
    var CH = IC.chev, h = '';
    var ts = topStocks();
    h += '<section class="bn-card" aria-labelledby="bnp1"><h2 id="bnp1">이번 주 방송 많이 나온 종목</h2><p class="bn-sub">SBS Biz 본방송에서 이야기된 횟수 순이에요</p>';
    if (ts == null) h += '<p class="bn-empty">방송 정보를 불러오는 중이에요.</p>';
    else if (!ts.length) h += '<p class="bn-empty">이번 주는 아직 정리된 방송 종목이 없어요.</p>';
    else h += '<ol class="bn-list">' + ts.map(function(o, i){ var nw = Object.keys(o.who).length;
      return '<li><button type="button" class="bn-row" data-bnp="stock" data-code="' + esc(o.code) + '" data-name="' + esc(o.name) + '"><span class="bn-rk">' + (i + 1) + '</span><span class="bn-nm"><b>' + esc(o.name) + '</b><span>' + (nw ? '전문가 ' + nw + '명' : '방송 종목') + '</span></span><span class="bn-ct">' + o.n + '번</span>' + CH + '</button></li>'; }).join('') + '</ol>';
    h += '<button type="button" class="bn-more" data-bnp="bc">방송종목 보기' + CH + '</button></section>';

    var wn = watchNews();
    h += '<section class="bn-card" aria-labelledby="bnp2"><h2 id="bnp2">내 관심종목 소식</h2>';
    if (!wn.names.length) h += '<p class="bn-empty">관심 종목을 담으면 오늘 나온 관련 기사를 여기에 모아 드려요.</p><button type="button" class="bn-more" data-bnp="watch">관심 종목 담기' + CH + '</button>';
    else {
      h += '<p class="bn-sub">' + esc(wn.names.slice(0, 3).map(function(x){ return x.name; }).join(' · ')) + (wn.names.length > 3 ? ' 외 ' + (wn.names.length - 3) + '개' : '') + '</p>';
      h += wn.items.length ? '<ul class="bn-list">' + wn.items.map(function(it){ var r = it.r;
        return '<li><a class="bn-news" href="' + esc(r.url || '#') + '" target="_blank" rel="noopener noreferrer"><em>' + esc(it.s.n) + '</em><b>' + esc(r.headline) + '</b><span>' + esc(r.press || '') + '</span></a></li>'; }).join('') + '</ul>'
        : '<p class="bn-empty">오늘은 관심 종목 관련 재료 뉴스가 아직 없어요.</p>';
      h += '<button type="button" class="bn-more" data-bnp="watch">관심 종목 전체 보기' + CH + '</button>';
    }
    h += '</section>';

    h += '<section class="bn-card" aria-labelledby="bnp3"><h2 id="bnp3">미니 계산기</h2><p class="bn-sub">산 가격과 지금(또는 목표) 가격으로 손익을 봐요</p>' +
      '<div class="bn-f"><label for="bn-c-buy">산 가격 (1주)</label><input id="bn-c-buy" data-bnc="buy" inputmode="numeric" autocomplete="off" placeholder="예: 41,000" value="' + esc(calc.buy) + '"></div>' +
      '<div class="bn-f2"><div class="bn-f"><label for="bn-c-now">지금·목표 가격</label><input id="bn-c-now" data-bnc="now" inputmode="numeric" autocomplete="off" placeholder="예: 45,000" value="' + esc(calc.now) + '"></div>' +
      '<div class="bn-f"><label for="bn-c-qty">수량 (주)</label><input id="bn-c-qty" data-bnc="qty" inputmode="numeric" autocomplete="off" placeholder="예: 10" value="' + esc(calc.qty) + '"></div></div>' +
      '<div class="bn-res" id="bn-c-res">' + calcRes() + '</div>' +
      '<p class="bn-basis">수수료·세금을 빼기 전 금액이에요. 자세한 계산은 도구에서 할 수 있어요.</p>' +
      '<button type="button" class="bn-more" data-bnp="calc">도구에서 자세히 계산' + CH + '</button></section>';
    return h;
  }
  function numOf(s){ var n = +String(s || '').replace(/[^\d.]/g, ''); return isFinite(n) ? n : 0; }
  function calcRes(){
    var b = numOf(calc.buy), n = numOf(calc.now), q = numOf(calc.qty) || 1;
    if (!b || !n) return '<span>손익</span><b>-</b>';
    var p = (n - b) * q, r = (n / b - 1) * 100, cl = p > 0 ? 'up' : p < 0 ? 'down' : '';
    return '<span>손익 ' + (r > 0 ? '+' : r < 0 ? '−' : '') + Math.abs(r).toFixed(2) + '%</span><b class="' + cl + '">' + (p > 0 ? '+' : p < 0 ? '−' : '') + won(Math.abs(p)) + '</b>';
  }
  var panelSig = '';
  function drawPanel(force){
    if (!MQ_WIDE3.matches || !root.classList.contains('bn-home')) return;
    if (panel.contains(document.activeElement) && !force) return; // 입력 중이면 다시 그리지 않아요
    var h = panelHTML(); if (h === panelSig && !force) return; panelSig = h;
    panel.innerHTML = h;
  }
  panel.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('[data-bnp]'); if (!b) return;
    var a = b.getAttribute('data-bnp');
    if (a === 'bc') go('ln', 'bc');
    else if (a === 'watch') go('ln', 'watch');
    else if (a === 'calc') go('tools', 'calc');
    else if (a === 'stock') {
      var code = b.getAttribute('data-code'), w = W('ln');
      if (code && w && w.STOCKS && w.STOCKS[code]) go('ln', 's-' + code);
      else window.open(code ? 'https://m.stock.naver.com/domestic/stock/' + encodeURIComponent(code) + '/total' : 'https://m.search.naver.com/search.naver?query=' + encodeURIComponent(b.getAttribute('data-name') + ' 주가'), '_blank', 'noopener');
    }
  });
  panel.addEventListener('input', function(e){
    var k = e.target.getAttribute && e.target.getAttribute('data-bnc'); if (!k) return;
    var raw = String(e.target.value || '').replace(/[^\d]/g, '').slice(0, 12);
    var fm = raw ? Number(raw).toLocaleString('ko-KR') : '';
    if (e.target.value !== fm) e.target.value = fm;
    calc[k] = fm; var r = $('bn-c-res'); if (r) r.innerHTML = calcRes();
  });
  setInterval(function(){ drawPanel(); }, 30000);
  MQ_WIDE3.addEventListener('change', function(){ drawPanel(true); });
  setTimeout(function(){ drawPanel(true); }, 2500);
  setTimeout(function(){ drawPanel(true); }, 8000);

  // ---- 글자 크기 · 화면 밝기
  function applyAll(){
    root.setAttribute('data-theme', C.theme); root.setAttribute('data-size', C.size);
    try { localStorage.setItem('site.v1', JSON.stringify(C)); } catch (e) {} window.__siteCfg = C;
    var m = document.querySelector('meta[name="theme-color"]'); if (m) { var bg = getComputedStyle(root).getPropertyValue('--bg').trim(); if (bg) m.content = bg; }
    Object.keys(SH.F || {}).forEach(function(id){ var w = W(id); try { if (w && w.__site) w.__site.apply(Object.assign({}, C, { wide: MQ_APPWIDE.matches })); } catch (e) {} });
  }
  function sizeHTML(){
    var S3 = [['m', '보통', 16], ['l', '크게', 19], ['xl', '아주 크게', 22]];
    return '<div class="bn-sh" role="dialog" aria-modal="true" aria-labelledby="bn-size-h"><div class="bn-sh-h"><h2 id="bn-size-h">글자 크기 · 화면 밝기</h2><button type="button" class="bn-x" data-bs="close" aria-label="닫기">×</button></div>' +
      '<div><p class="bn-lab">글자 크기</p><div class="bn-opts">' + S3.map(function(s){ return '<button type="button" data-bs="size" data-v="' + s[0] + '" aria-pressed="' + (C.size === s[0]) + '"><span class="ga" style="font-size:' + s[2] + 'px">가</span><small>' + s[1] + '</small></button>'; }).join('') + '</div></div>' +
      '<div><p class="bn-lab">화면 밝기</p><div class="bn-opts two"><button type="button" data-bs="theme" data-v="light" aria-pressed="' + (C.theme === 'light') + '">밝은 화면</button><button type="button" data-bs="theme" data-v="dark" aria-pressed="' + (C.theme === 'dark') + '">어두운 화면</button></div></div>' +
      '<button type="button" class="bn-ok" data-bs="close">확인</button></div>';
  }
  var sz = null;
  function openSize(){
    if (sz) return;
    sz = document.createElement('div'); sz.id = 'bn-size'; sz.innerHTML = sizeHTML(); document.body.appendChild(sz);
    sz.addEventListener('click', function(e){
      if (e.target === sz) { closeSize(); return; }
      var b = e.target.closest && e.target.closest('[data-bs]'); if (!b) return;
      var a = b.getAttribute('data-bs');
      if (a === 'close') closeSize();
      else { C[a] = b.getAttribute('data-v'); applyAll(); sz.innerHTML = sizeHTML(); var f = sz.querySelector('[data-bs="' + a + '"][aria-pressed="true"]'); if (f) f.focus(); }
    });
    var f0 = sz.querySelector('[aria-pressed="true"]'); if (f0) f0.focus();
  }
  function closeSize(){ if (sz) { sz.remove(); sz = null; } }
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && sz) closeSize(); });

  // ---- 화면 밝기 (11/6: 글자 크기 조절은 없애고, 밝은 화면 ↔ 어두운 화면만 바로 바꿔요)
  function paintTheme(){
    var dark = C.theme === 'dark';
    var t = dark ? '밝은 화면으로 바꾸기' : '어두운 화면으로 바꾸기';
    Array.prototype.forEach.call(document.querySelectorAll('.bn-ga[data-bn="theme"]'), function(b){ b.innerHTML = dark ? IC.sun : IC.moon; b.setAttribute('aria-label', t); b.title = t; });
    Array.prototype.forEach.call(document.querySelectorAll('.bn-th'), function(b){ b.innerHTML = (dark ? IC.sun : IC.moon) + '<span>' + (dark ? '밝은 화면' : '어두운 화면') + '</span>'; b.setAttribute('aria-pressed', String(dark)); });
  }
  function toggleTheme(){
    C.theme = C.theme === 'dark' ? 'light' : 'dark'; C.size = 'm';
    applyAll(); paintTheme(); closeDrawer(true);
  }
  paintTheme();

  // ---- 다른 탭 미리 불러오기 (11/6): 첫 화면이 뜨고 쉬는 동안 '도구'를 미리 불러 두고,
  //      '커뮤니티'는 실시간 연결을 쓰니 탭에 손가락·마우스를 올렸을 때 불러요 (모든 방문자가 실시간 연결을 열지 않게)
  function pre(id){ try { if (SH.mk && !(SH.F || {})[id]) SH.mk(id); } catch (e) {} }
  setTimeout(function(){ var go2 = function(){ pre('ln'); pre('tools'); }; if (window.requestIdleCallback) requestIdleCallback(go2, { timeout: 4000 }); else go2(); }, 3500);
  ['pointerenter', 'touchstart', 'focusin'].forEach(function(ev){
    document.addEventListener(ev, function(e){ var b = e.target.closest && e.target.closest('[data-tab="cm"],[data-tab="tools"],[data-tab="home"],[data-tab="bc"],[data-tab="my"]'); if (!b) return; var t = b.getAttribute('data-tab'); pre(t === 'cm' ? 'cm' : t === 'tools' ? 'tools' : 'ln'); }, { passive: true, capture: true });
  });

  // ---- PC 휠 넘기기 (11/6): 왼쪽 메뉴 · 오른쪽 칸 위에서 굴려도, 그 칸이 더 내려갈 데가 없으면 가운데 화면이 움직여요
  document.addEventListener('wheel', function(e){
    if (!MQ_PC.matches || e.ctrlKey) return;
    var box = e.target.closest && e.target.closest('#bn-side,#bn-panel,#bn-seg,#bp-top,#ad-top');
    if (!box) return;
    var dy = e.deltaY; if (!dy) return;
    var sc = box.closest('#bn-side,#bn-panel');
    if (sc && (dy > 0 ? sc.scrollTop + sc.clientHeight < sc.scrollHeight - 1 : sc.scrollTop > 0)) return;
    var w = W(cur().app); if (!w) return;
    try { w.scrollBy(0, e.deltaMode === 1 ? dy * 16 : dy); e.preventDefault(); } catch (er) {}
  }, { passive: false });

  // ---- 휴대폰 위 고정 줄은 한 줄만 (11/6)
  //  · 세부 화면 고르기(세그먼트)는 휴대폰에서 로고 옆, 같은 줄로 올려요
  //  · 뒤로 가기가 있는 깊은 화면에서는 셸의 위 줄을 숨기고, 그 화면의 '‹ 제목' 줄 하나만 남겨요
  function placeSeg(){
    if (MQ_PC.matches) { if (seg.parentNode !== body) body.insertBefore(seg, $('frames')); }
    else if (seg.parentNode !== topb) topb.insertBefore(seg, topb.querySelector('.bn-ga'));
  }
  placeSeg();
  if (MQ_PC.addEventListener) MQ_PC.addEventListener('change', placeSeg); else if (MQ_PC.addListener) MQ_PC.addListener(placeSeg);
  // 많이 리딩된 종목 띠(bench-plus.js)는 휴대폰 홈에서 로고 옆, 같은 줄에 넣어요 (따로 한 줄을 차지하지 않게)
  var stripHome = null;
  function placeStrip(c){
    var t = $('bp-top'); if (!t) return;
    if (!stripHome && t.parentNode !== topb) stripHome = { p: t.parentNode, n: t.nextSibling };
    var inBar = !MQ_PC.matches && c.tab === 'home';
    if (inBar && t.parentNode !== topb) topb.insertBefore(t, topb.querySelector('.bn-ga'));
    else if (!inBar && t.parentNode === topb && stripHome) stripHome.p.insertBefore(t, stripHome.n && stripHome.n.parentNode === stripHome.p ? stripHome.n : null);
    root.classList.toggle('bn-strip', inBar && !t.hidden);
  }
  function isDeep(app){
    var w = W(app), d; try { d = w && w.document; } catch (e) { d = null; } if (!d) return false;
    var bs = d.querySelectorAll('header.top .back, header.top [data-a="back"], header.top [data-bn-go]');
    for (var i = 0; i < bs.length; i++) { if (bs[i].offsetParent !== null) return true; }
    return false;
  }

  update();
  window.__shellB = { update: update, tabOf: tabOf, segOf: segOf, cur: cur, go: go, openSize: toggleTheme, toggleTheme: toggleTheme };
})();
