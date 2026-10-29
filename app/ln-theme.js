/* 리딩노트 · 새 디자인 (바이올렛 · 밝은/어두운 화면)
   index.html(맨 바깥 셸) <head>에 ux-polish.js 다음, live-data.js 앞에 넣어요:
   <script src="ln-theme.js?v=1"></script>  (ln-plus.js도 자동으로 불러와요)
   - 색: 대표색 바이올렛 하나, 오름 빨강 · 내림 파랑. 테두리 대신 여백으로 구분해요.
   - 리딩 모음: 홈(삼전닉스 인사 · 바로가기 · 방송 중 · 새 추천 · 성적표), 전문가(사진 없이 이름 · 숫자 2개 · 지금 리딩 중 최상단),
     추천 줄 목록과 펼침, 떠 있는 캡슐 탭바. 투자 도구 · 커뮤니티 · 셸 머리에도 같은 색을 입혀요. */
(function(){
  if (window.__lnTheme) return; window.__lnTheme = true;
  var FONT = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';
  var F = "'Pretendard Variable',Pretendard,-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif";

  // ---- 색 (모든 화면 공통 이름)
  var DARK = '--bg:#101013;--surface:#1C1C21;--raise:#24242A;--sunk:#2A2A31;--ink:#ECECEF;--ink2:#9A9AA5;--line:#26262D;' +
    '--accent:#7B6DFF;--on-accent:#FFFFFF;--accent-soft:#262140;--acc-soft:#262140;' +
    '--up:#FF5A68;--on-up:#FFFFFF;--up-soft:#3A1E24;--down:#4D96FF;--on-down:#FFFFFF;--down-soft:#182740;' +
    '--live:#FF5A68;--on-live:#FFFFFF;--room:#101013;--ad:#1C1C21;--ad-line:#2A2A31;--overlay:rgba(0,0,0,.6);--shadow:0 10px 30px rgba(0,0,0,.45);' +
    '--sa:#FF5A68;--sb:#4D96FF;--sa-soft:#3A1E24;--sb-soft:#182740;--sn:#74747F;--warn:#F5B13D;--warn-soft:#3A2E14;' +
    '--t2-y:#F5B13D;--t2-ys:#3A2E14;--t2-g:#2FC48A;--t2-gs:#14302A;--t2-nav:#25252B;--t2-acc-ink:#9D93FF;' +
    "--f-ui:" + F + ";--f-mono:" + F + ";--f-mark:" + F + ";color-scheme:dark;";
  var LIGHT = '--bg:#F2F4F6;--surface:#FFFFFF;--raise:#F7F8FA;--sunk:#EEF0F3;--ink:#191F28;--ink2:#6B7684;--line:#EEF0F3;' +
    '--accent:#5B4CF0;--on-accent:#FFFFFF;--accent-soft:#EEEBFF;--acc-soft:#EEEBFF;' +
    '--up:#F04452;--on-up:#FFFFFF;--up-soft:#FFEEF0;--down:#3182F6;--on-down:#FFFFFF;--down-soft:#E8F3FF;' +
    '--live:#F04452;--on-live:#FFFFFF;--room:#F2F4F6;--ad:#FFFFFF;--ad-line:#E5E8EB;--overlay:rgba(0,0,0,.45);--shadow:0 8px 24px rgba(0,0,0,.08);' +
    '--sa:#F04452;--sb:#3182F6;--sa-soft:#FFEEF0;--sb-soft:#E8F3FF;--sn:#8B95A1;--warn:#B25E00;--warn-soft:#FFF4DB;' +
    '--t2-y:#E08A00;--t2-ys:#FFF4DB;--t2-g:#0F9D6A;--t2-gs:#E5F7EF;--t2-nav:#FFFFFF;--t2-acc-ink:#5B4CF0;' +
    "--f-ui:" + F + ";--f-mono:" + F + ";--f-mark:" + F + ";color-scheme:light;";
  // 셸·도구·커뮤니티: data-theme 방식 / 리딩 모음: html.lite 방식
  var TOK_ATTR = 'html:root{' + DARK + '}@media (prefers-color-scheme: light){html:root:not([data-theme="dark"]){' + LIGHT + '}}html:root[data-theme="light"]{' + LIGHT + '}html:root[data-theme="dark"]{' + DARK + '}';
  var TOK_LN = 'html:root{' + DARK + '}html:root.lite{' + LIGHT + '}';
  var BASE = 'body{font-family:var(--f-ui);font-feature-settings:"tnum";letter-spacing:-.01em}html:root *{word-spacing:normal!important}';

  var SHELL_CSS = TOK_ATTR + 'html:root[data-app]{' + DARK + '}@media (prefers-color-scheme: light){html:root[data-app]:not([data-theme="dark"]){' + LIGHT + '}}html:root[data-app][data-theme="light"]{' + LIGHT + '}html:root[data-app][data-theme="dark"]{' + DARK + '}' + BASE +
    ':root{--t-ln:var(--accent);--t-tools:var(--accent);--t-cm:var(--accent)}' +
    '.hx-mark{background:var(--accent)!important;border:0!important;box-shadow:none!important;--t-ln:#fff;--t-tools:#fff;--t-cm:#fff}' +
    '.hx-cap{background:var(--ink)!important;color:var(--bg)!important}' +
    'html .sh-in .tab::after{background:var(--accent)!important}' +
    '#shell header,.sh,.sh-in{border-bottom:0!important;box-shadow:none!important}' +
    '.tab{color:var(--ink2)!important;font-weight:600}.tab[aria-selected="true"]{color:var(--ink)!important;font-weight:800}' +
    '#ad-top,.ad-top,.rail{display:none!important}' +
    '@media (min-width:960px){.sh-in{position:relative}.sh-in .tabs{position:absolute!important;left:50%!important;top:0;bottom:0;transform:translateX(-50%);margin:0!important;justify-content:center}}' +
    '#notice{background:var(--accent-soft)!important;border:0!important;font-size:.9375rem}' +
    '#notice *{border-color:transparent!important}';
  var TOOLS_CSS = TOK_ATTR + BASE + '.card,.sec,.box{border-color:transparent!important}';
  var CM_CSS = TOK_ATTR + BASE + '.card{border-color:transparent!important}' +
    '.t2-stk{display:flex;align-items:center;gap:.75rem;width:100%;padding:.8rem 0;border:0;border-bottom:1px solid var(--line);background:none;color:var(--ink);text-align:left;cursor:pointer;font:inherit}' +
    '.t2-stk:last-child{border-bottom:0}' +
    '.t2-stk .nm{flex:1;min-width:0}.t2-stk b{display:block;font-size:1.0625rem}.t2-stk .nm span{display:block;font-size:.875rem;color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:.1rem}' +
    '.t2-stk .ct{flex:none;font-size:.8125rem;font-weight:700;color:var(--accent)}' +
    '.t2-stk svg{width:1.1rem;height:1.1rem;flex:none;fill:none;stroke:var(--ink2);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}' +
    '.t2-stk-empty{padding:.75rem 0;color:var(--ink2);font-size:.9375rem;line-height:1.6}' +
    '[data-act="clike"],[data-act="like"],.cand-tag{display:none!important}';

  var LN_CSS = TOK_LN + BASE + [
    // 전문가 이름은 어디서나 굵게
    'html.t2 .t2-xn{font-weight:800;color:var(--ink)}html.t2 .kname{font-weight:800!important;color:var(--ink)}',
    // 바탕·카드
    'html.t2 .app{background:var(--bg)}',
    'html.t2 .card{border:0!important;border-radius:1.5rem;box-shadow:none}',
    'html.t2 .ux-ga,html.t2 .joinbar,html.t2 .fab-wrap{display:none!important}',
    // 머리줄
    'html.t2 .top{background:var(--bg)!important;border-bottom:0!important;box-shadow:none!important}',
    'html.t2 .top-in{min-height:3.5rem}',
    'html.t2 .top-title{font-size:1.125rem;font-weight:700}',
    '.t2-top{display:flex;align-items:center;gap:.25rem;min-height:3.25rem}',
    '.t2-date{margin-right:auto;font-size:.9375rem;font-weight:600;color:var(--ink2)}',
    '.t2-ic{width:2.75rem;height:2.75rem;border:0;background:transparent;color:var(--ink);display:inline-flex;align-items:center;justify-content:center;border-radius:50%;position:relative;cursor:pointer}',
    '.t2-ic svg{width:1.6rem;height:1.6rem;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}',
    '.t2-ic .nd{position:absolute;top:.6rem;right:.65rem;width:.5rem;height:.5rem;border-radius:50%;background:var(--up)}',
    // 아래 탭바: 떠 있는 캡슐
    'html.t2 .nav{left:0!important;right:0!important;transform:none!important;width:auto!important;max-width:none!important;bottom:0;background:transparent!important;border:0!important;box-shadow:none!important;padding:0 .75rem calc(.75rem + env(safe-area-inset-bottom,0px))!important;pointer-events:none}',
    'html.t2 .nav-in{pointer-events:auto;max-width:28rem;margin:0 auto;background:var(--t2-nav);border-radius:2.25rem;box-shadow:0 6px 24px rgba(0,0,0,.14);padding:.375rem!important;display:flex!important;justify-content:space-around;gap:.25rem;height:auto!important}',
    'html.t2 .nav-in button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.15rem;min-height:3.5rem}',
    'html.t2 .bell-btn::after,html.t2 .top-q::after{content:none!important;display:none!important}',
    'html.t2 .bell-btn{height:2.75rem!important;width:2.75rem!important;border:0;background:transparent;color:var(--ink)}',
    'html.t2 .bell-btn svg{width:1.6rem!important;height:1.6rem!important}',
    'html.t2 .ln-naver{border:0!important;background:var(--sunk);opacity:1!important;padding:.55rem .95rem}',
    'html.t2 .nav-in button{flex:1;border-radius:1.75rem;padding:.4rem .25rem;color:var(--sn);font-size:.75rem;font-weight:600;background:transparent;border:0}',
    'html.t2 .nav-in button[aria-current="page"]{color:var(--ink);background:var(--sunk)}',
    'html.t2 .nav-in button::before,html.t2 .nav-in button::after{display:none!important}',
    'html.t2 .app{padding-bottom:calc(6.5rem + env(safe-area-inset-bottom,0px))!important}',
    // 공통 줄 목록
    '.t2{padding:0 0 1rem}',
    '.t2-sec{background:var(--surface);border-radius:1.75rem;margin:0 0 .75rem;padding:1.375rem 1.25rem .5rem}',
    '.t2-h{display:flex;align-items:center;gap:.25rem;font-size:1.25rem;font-weight:800;letter-spacing:-.02em;margin:0 0 .25rem;border:0;background:none;color:var(--ink);padding:0;cursor:pointer;text-align:left}',
    '.t2-h .n{color:var(--sn);font-weight:700;margin-left:.15rem}',
    '.t2-h svg,.t2-chev{width:1.15rem;height:1.15rem;fill:none;stroke:var(--sn);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;flex:none}',
    '.t2-row{display:flex;align-items:center;gap:.875rem;width:100%;padding:.875rem 0;border:0;background:none;color:var(--ink);text-align:left;cursor:pointer;font:inherit}',
    '.t2-sc{width:2.875rem;height:2.875rem;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.125rem}',
    '.t2-sc.c0{background:var(--down-soft);color:var(--down)}.t2-sc.c1{background:var(--t2-ys);color:var(--t2-y)}.t2-sc.c2{background:var(--t2-gs);color:var(--t2-g)}.t2-sc.c3{background:var(--up-soft);color:var(--up)}.t2-sc.c4{background:var(--accent-soft);color:var(--t2-acc-ink)}',
    '.t2-mid{flex:1;min-width:0}.t2-mid b{display:block;font-size:1.0625rem;font-weight:700;line-height:1.35}',
    '.t2-mid>span{display:block;font-size:.875rem;color:var(--ink2);margin-top:.125rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.t2-rt{text-align:right;white-space:nowrap;flex:none}.t2-rt b{display:block;font-size:1.0625rem;font-weight:700}.t2-rt span{display:block;font-size:.8125rem;color:var(--ink2);margin-top:.125rem}',
    '.t2 .up,.t2-body .up{color:var(--up)!important}.t2 .down,.t2-body .down{color:var(--down)!important}.t2 .flat{color:var(--ink2)!important}',
    '.t2-tag{display:inline-block;font-size:.75rem;font-weight:700;padding:.1rem .45rem;border-radius:.4rem;background:var(--sunk);color:var(--ink2);margin-left:.35rem;vertical-align:.1rem}',
    '.t2-tag.lv{background:var(--up-soft);color:var(--up)}',
    '.t2-dot{display:inline-block;width:.5rem;height:.5rem;border-radius:50%;background:var(--up);margin-right:.45rem;vertical-align:.12rem;box-shadow:0 0 0 .25rem var(--up-soft)}',
    '.t2-pill{display:inline-flex;align-items:center;gap:.3rem;font-size:.75rem;font-weight:800;color:var(--on-accent);background:var(--accent);border-radius:.6rem;padding:.15rem .5rem;margin-left:.4rem;vertical-align:.1rem}',
    '.t2-pill i{width:.375rem;height:.375rem;border-radius:50%;background:currentColor;display:block}',
    '.t2-pill.w{background:var(--sunk);color:var(--ink2)}',
    // 홈
    '.t2-hello{padding:.5rem 1.5rem 1.125rem}.t2-hello p{color:var(--ink2);font-size:1rem}',
    '.t2-hello h2{font-size:1.625rem;font-weight:800;letter-spacing:-.03em;margin-top:.25rem;line-height:1.32}',
    '.t2-mkt{display:flex;gap:.5rem;margin-top:.875rem}',
    '.t2-mkt a{flex:1;background:var(--surface);border-radius:1rem;padding:.75rem .875rem;text-decoration:none;color:var(--ink);min-width:0}',
    '.t2-mkt span{display:block;font-size:.8125rem;color:var(--ink2)}.t2-mkt b{font-size:1.125rem;font-weight:800}.t2-mkt em{font-style:normal;font-size:.8125rem;color:var(--ink2);margin-left:.25rem}',
    '.t2-mkt .go{display:flex;align-items:center;justify-content:space-between;font-weight:700;font-size:.9375rem}',
    '.t2-note{font-size:.75rem;color:var(--sn);margin-top:.5rem}',
    '.t2-sc4{display:flex;justify-content:space-between;padding:.375rem 1.375rem 1.25rem}',
    '.t2-sc4 button{display:flex;flex-direction:column;align-items:center;gap:.5rem;font-size:.875rem;font-weight:600;color:var(--ink);background:none;border:0;cursor:pointer;font-family:inherit;padding:0;min-width:4rem}',
    '.t2-sc4 span{width:3.75rem;height:3.75rem;border-radius:50%;display:flex;align-items:center;justify-content:center}',
    '.t2-sc4 svg{width:1.75rem;height:1.75rem;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
    '.t2-sc4 .a{background:var(--t2-ys);color:var(--t2-y)}.t2-sc4 .b{background:var(--up-soft);color:var(--up)}.t2-sc4 .c{background:var(--down-soft);color:var(--down)}.t2-sc4 .d{background:var(--accent-soft);color:var(--t2-acc-ink)}',
    '.t2-cta{display:flex;align-items:center;gap:.875rem;background:var(--accent-soft);border-radius:1.375rem;margin:0 0 .75rem;padding:1rem 1.25rem;border:0;width:100%;text-align:left;color:var(--ink);cursor:pointer;font:inherit}',
    '.t2-cta b{font-size:1rem;font-weight:700;flex:1;line-height:1.4}.t2-cta small{display:block;font-weight:500;color:var(--ink2);font-size:.875rem;margin-top:.125rem}',
    '.t2-cta .bell{width:2.625rem;height:2.625rem;border-radius:.875rem;background:var(--surface);display:flex;align-items:center;justify-content:center;flex:none}',
    '.t2-cta .bell svg{width:1.4rem;height:1.4rem;fill:none;stroke:var(--t2-acc-ink);stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}',
    '.t2-rk{width:1.4rem;font-size:1.0625rem;font-weight:800;color:var(--t2-acc-ink);text-align:center;flex:none}',
    '.t2-empty{padding:1.25rem 0 1rem;color:var(--ink2);font-size:.9375rem;line-height:1.6}',
    '.t2-basis{font-size:.75rem;color:var(--sn);text-align:center;padding:.5rem 1.5rem 0}',
    '.t2-notice{margin:0 1rem .75rem;padding:.75rem 1rem;border-radius:1rem;background:var(--surface);font-size:.9375rem}',
    '.t2-notice b{color:var(--t2-acc-ink);margin-right:.4rem}',
    // 전문가
    '.t2-pf{padding:.25rem .125rem 1rem}',
    '.t2-pf h2{font-size:1.75rem;font-weight:800;letter-spacing:-.03em;display:flex;align-items:center;gap:.4rem;flex-wrap:wrap}',
    '.t2-pf p{color:var(--ink2);font-size:.9375rem;margin-top:.375rem}',
    '.t2-pf .intro{color:var(--ink);margin-top:.625rem}',
    '.t2-btn{display:flex;align-items:center;justify-content:center;gap:.4rem;width:100%;height:3.25rem;border-radius:1rem;border:0;background:var(--accent);color:var(--on-accent);font-weight:700;font-size:1.0625rem;margin-top:1rem;cursor:pointer;font-family:inherit}',
    '.t2-btn.on{background:var(--sunk);color:var(--ink)}',
    '.t2-st{display:flex;gap:.625rem;padding:0 0 .875rem}',
    '.t2-st div{flex:1;background:var(--raise);border-radius:1.125rem;padding:1rem}',
    '.t2-st span{display:block;font-size:.8125rem;color:var(--ink2)}.t2-st b{display:block;font-size:1.625rem;font-weight:800;letter-spacing:-.02em;margin-top:.125rem}',
    '.t2-basis2{font-size:.75rem;color:var(--sn);padding:0 0 .875rem}',
    '.t2-live{display:flex;align-items:center;gap:.6rem;width:100%;margin:0 0 .875rem;padding:.75rem .875rem;border-radius:1rem;border:0;background:var(--up-soft);color:var(--ink);text-align:left;font:inherit;cursor:pointer}',
    '.t2-live b{font-size:.9375rem}.t2-live span{font-size:.875rem;color:var(--ink2)}',
    '.t2-lead{background:var(--surface);border-radius:1.75rem;margin:0 0 .75rem;padding:1.25rem 1.25rem 1rem;box-shadow:inset 0 0 0 2px var(--accent)}',
    '.t2-lr{background:var(--accent-soft);border-radius:1.25rem;padding:.875rem .875rem .875rem 1rem;margin-top:.625rem}',
    '.t2-lr .t2-row{padding:0;gap:.75rem}',
    '.t2-lr .t2-mid>span{color:var(--ink)}',
    '.t2-lb{display:flex;gap:.5rem;margin-top:.75rem}',
    '.t2-lb button{flex:1;height:2.5rem;border-radius:.75rem;border:0;font-size:.875rem;font-weight:700;cursor:pointer;font-family:inherit}',
    '.t2-lb .p{background:var(--accent);color:var(--on-accent)}.t2-lb .q{background:var(--surface);color:var(--ink)}.t2-lb .p.on{background:var(--surface);color:var(--t2-acc-ink)}',
    '.t2-seg{display:flex;gap:.5rem;margin:.125rem 0 .25rem}',
    '.t2-seg button{padding:.5rem 1rem;border-radius:1.25rem;font-size:.9375rem;font-weight:700;color:var(--ink2);background:var(--sunk);border:0;cursor:pointer;font-family:inherit}',
    '.t2-seg button[aria-pressed="true"]{background:var(--ink);color:var(--bg)}',
    '.t2-share{display:block;margin:.5rem auto 0;border:0;background:none;color:var(--ink2);font-size:.875rem;font-weight:600;cursor:pointer;font-family:inherit;text-decoration:underline;text-underline-offset:3px}',
    // 펼친 추천
    '.t2-body{padding:.25rem 0 1rem}',
    '.t2-lr .t2-body{padding:.75rem 0 .25rem}',
    '.t2-body .result{display:flex;flex-direction:column;gap:.25rem;background:none!important;border:0!important;padding:0!important;margin:0 0 .5rem}',
    '.t2-body .result .rl{font-size:.9375rem;color:var(--ink2)}',
    '.t2-body .result .big{font-size:2rem;font-weight:800;letter-spacing:-.02em;line-height:1.2}',
    '.t2-body .result .rline{font-size:.9375rem;color:var(--ink2)}',
    '.t2-body .result .kv{display:flex;gap:.625rem;margin-top:.625rem}',
    '.t2-body .result .kv>div{flex:1;background:var(--raise);border-radius:1rem;padding:.875rem;border:0}',
    '.t2-lr .t2-body .result .kv>div{background:var(--surface)}',
    '.t2-body .result .kv span{display:block;font-size:.8125rem;color:var(--ink2)}.t2-body .result .kv b{font-size:1.125rem}',
    '.t2-body .pill{border-radius:.5rem;font-size:.8125rem;align-self:flex-start;margin-top:.375rem}',
    '.t2-body .ln-naver{border:0;background:var(--raise);padding:.6rem .9rem;border-radius:.875rem;opacity:1;font-size:.9375rem;margin-top:.25rem}',
    '.t2-body .tl{margin-top:.75rem}',
    '.t2-body .tl .ti{border:0!important}',
    '.t2-body .tl .tshare{display:none!important}',
    '.t2-body .ti-k{font-size:.8125rem!important;color:var(--ink2)!important}',
    '.t2-body .tmain{font-size:1.0625rem;font-weight:700}',
    '.t2-body .ttext{font-size:1rem}',
    '.t2-acts{display:flex;gap:.5rem;margin-top:.75rem}',
    '.t2-acts button{flex:1;height:2.75rem;border-radius:.875rem;border:0;background:var(--raise);color:var(--ink);font-weight:700;font-size:.9375rem;cursor:pointer;font-family:inherit}',
    // 다른 화면 다듬기
    'html.t2 .btn-primary{background:var(--accent)!important;color:var(--on-accent)!important;border-color:var(--accent)!important}',
    'html.t2 .sech{font-weight:800;letter-spacing:-.02em}',
    'html.t2 .rows .lrow{border:0!important}',
    'html.t2 .avatar{display:none!important}',
    'html.t2 [data-a="like"]{display:none!important}',
    'html.t2 .stage .st-who{gap:.5rem}'
  ].join('\n');

  // ---- 아이콘
  var SV = function(p){ return '<svg viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>'; };
  var I = {
    search: SV('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
    bell: SV('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 21h4"/>'),
    chev: '<svg class="t2-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    trophy: SV('<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 20h6"/>'),
    flame: SV('<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-6 2 1 3 2 3 4"/>'),
    chat: SV('<path d="M4 5h16v11H9l-5 4z"/>'),
    book: SV('<path d="M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z"/>')
  };

  function css(d, id, text){ if (!d || d.getElementById(id)) return; var s = d.createElement('style'); s.id = id; s.textContent = text; (d.head || d.documentElement).appendChild(s); }
  function font(d){ if (!d || d.getElementById('t2-font')) return; var l = d.createElement('link'); l.id = 't2-font'; l.rel = 'stylesheet'; l.href = FONT; (d.head || d.documentElement).appendChild(l); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // ---- 셸
  font(document); css(document, 't2-shell', SHELL_CSS);

  // ---- 리딩 모음 화면 바꾸기
  function patchLn(w, d){
    if (w.__t2 || !w.screenHome || !w.screenExpert || !w.render || !w.P || !w.S) return false;
    w.__t2 = true;
    d.documentElement.classList.add('t2');
    cmPatch(w, 'feedSig', [["'<span class=\"sm\">'+esc(x.name)+' 추천 · '", "'<span class=\"sm\"><b class=\"t2-xn\">'+esc(x.name)+'</b> 추천 · '"]]);
    cmPatch(w, 'pushHTML', [["'<span>리딩노트 · '+esc(x.name)+'</span>'", "'<span>리딩노트 · <b class=\"t2-xn\">'+esc(x.name)+'</b></span>'"]]);
    font(d); css(d, 't2-ln', LN_CSS);
    var P = w.P, S = w.S;
    function won(n){ return n == null || isNaN(n) ? '-' : Number(n).toLocaleString('ko-KR') + '원'; }
    function pct(x){ if (x == null || isNaN(x)) return '-'; var r = Math.round(x * 10) / 10; return (r > 0 ? '+' : r < 0 ? '-' : '') + Math.abs(r).toFixed(1) + '%'; }
    function tone(x){ var r = Math.round((x || 0) * 10) / 10; return r > 0 ? 'up' : r < 0 ? 'down' : 'flat'; }
    function scHTML(code){ var st = w.STOCKS[code] || {}, n = st.name || code, h = 0; for (var i = 0; i < String(code).length; i++) h = (h * 31 + String(code).charCodeAt(i)) % 997; return '<span class="t2-sc c' + (h % 5) + '" aria-hidden="true">' + esc(n.charAt(0)) + '</span>'; }
    function md(at){ var p = String(at || '').slice(5, 10).split('-'); return p.length === 2 ? (+p[0]) + '.' + (+p[1]) : ''; }
    function when(at){ try { return w.fmtWhen(at); } catch (e) { return md(at); } }
    function head(title, n, a, v){ return '<button class="t2-h" data-a="' + a + '" data-v="' + v + '">' + title + (n != null ? '<span class="n">' + n + '</span>' : '') + I.chev.replace('t2-chev', '') + '</button>'; }
    function headStatic(title, n){ return '<div class="t2-h" style="cursor:default">' + title + (n != null ? '<span class="n">' + n + '</span>' : '') + '</div>'; }
    function evRight(s){
      var e = s.e;
      if (e.t === 'buy') return '<b class="up">구매</b><span>' + won(e.buy) + '</span>';
      if (e.t === 'sell') return '<b class="down">판매</b><span class="' + tone(s.ret) + '" style="font-weight:700">' + pct(s.ret) + '</span>';
      if (e.t === 'revise') { var c = s.changed[0]; return '<b>가격 변경</b><span>' + (c ? (w.FIELD_LABEL[c.k] || '').replace(' 가격', '') + ' ' + won(c.to) : '') + '</span>'; }
      if (e.t === 'watch') return '<b style="color:var(--ink2)">지켜보기</b><span>&nbsp;</span>';
      return '<b style="color:var(--ink2)">' + (e.t === 'news' ? '소식' : '조언') + '</b><span>&nbsp;</span>';
    }

    // 머리줄: 홈은 날짜 + 검색·알림 아이콘만
    var otop = w.topBar;
    w.topBar = function(){
      if (w.view() || S.tab !== 'home') return otop();
      var u = 0; try { u = w.totalUnread(); } catch (e) {}
      return '<header class="top"><div class="t2-top gx"><span class="t2-date">' + esc(w.todayLabel ? w.todayLabel() : '') + '</span>' +
        '<button class="t2-ic" data-a="view" data-v="experts" aria-label="전문가 찾기">' + I.search + '</button>' +
        '<button class="t2-ic" data-a="tab" data-v="alerts" aria-label="알림' + (u ? ', 안 읽은 추천 ' + u + '개' : '') + '">' + I.bell + (u ? '<span class="nd"></span>' : '') + '</button></div></header>';
    };
    w.joinBar = function(){ return ''; };
    w.showJoinBar = function(){ return false; };
    w.homeFab = function(){};
    w.avatar = function(){ return ''; };

    // 홈
    function market(){
      var L = window.__lnLive && window.__lnLive.feed, m = L && L.market, a = m && m['005930'], b = m && m['000660'];
      var nv = function(c){ return 'https://finance.naver.com/item/main.naver?code=' + c; };
      if (!a || !b || a.chg == null || b.chg == null) {
        return '<h2>오늘 삼전닉스는<br>어떻게 움직였을까요?</h2><div class="t2-mkt">' +
          '<a href="' + nv('005930') + '" target="_blank" rel="noopener noreferrer"><span class="go">삼성전자' + I.chev + '</span></a>' +
          '<a href="' + nv('000660') + '" target="_blank" rel="noopener noreferrer"><span class="go">SK하이닉스' + I.chev + '</span></a></div><p class="t2-note">네이버 증권에서 지금 가격을 볼 수 있어요</p>';
      }
      var ca = Number(a.chg), cb = Number(b.chg), ra = Math.round(ca * 10) / 10, rb = Math.round(cb * 10) / 10;
      var today = w.DATA_TODAY, asOf = String(a.asOf || '').slice(0, 10), dayTxt = asOf === today ? '오늘' : (asOf ? (+asOf.slice(5, 7)) + '월 ' + (+asOf.slice(8, 10)) + '일' : '오늘');
      var st = ra > 0 && rb > 0 ? '<span class="up">함께 올랐어요</span>' : ra < 0 && rb < 0 ? '<span class="down">함께 내렸어요</span>' : ra === 0 && rb === 0 ? '보합이에요' : '엇갈렸어요';
      if (ra > 0 && rb > 0 && Math.max(ra, rb) >= 3) st = '<span class="up">크게 올랐어요</span>';
      if (ra < 0 && rb < 0 && Math.min(ra, rb) <= -3) st = '<span class="down">크게 내렸어요</span>';
      var cell = function(c, n, q){ var r = Math.round(Number(q.chg) * 10) / 10; return '<a href="' + nv(c) + '" target="_blank" rel="noopener noreferrer"><span>' + n + '</span><b class="' + tone(r) + '">' + pct(r) + '</b><em>' + won(q.price) + '</em></a>'; };
      return '<h2>' + dayTxt + ' 삼전닉스는<br>' + st + '</h2><div class="t2-mkt">' + cell('005930', '삼성전자', a) + cell('000660', 'SK하이닉스', b) + '</div>' +
        '<p class="t2-note">' + (asOf ? (+asOf.slice(5, 7)) + '.' + (+asOf.slice(8, 10)) + ' 장 마감 가격 기준' : '장 마감 가격 기준') + '</p>';
    }
    function recentCalls(){
      var out = [];
      w.LEADINGS.forEach(function(Lx){ var a = w.analyze(Lx); a.steps.forEach(function(s){ if (/^(buy|sell|revise|watch)$/.test(s.e.t)) out.push(s); }); });
      out.sort(function(x, y){ return x.e.at < y.e.at ? 1 : x.e.at > y.e.at ? -1 : 0; });
      var today = w.DATA_TODAY, t = out.filter(function(s){ return s.e.at.slice(0, 10) === today; });
      return t.length ? { list: t, today: true } : { list: out.filter(function(s){ return s.e.at.slice(0, 10) >= w.RECENT_FROM; }), today: false };
    }
    w.screenHome = function(){
      var h = '<main class="t2">';
      if (P.notice && P.notice.on && P.notice.text) h += '<p class="t2-notice"><b>공지</b>' + esc(P.notice.text) + '</p>';
      h += '<div class="t2-hello"><p>' + (P.member ? esc(P.member.name) + ' 님, ' : '') + esc(w.greetText()) + '</p>' + market() + '</div>';
      h += '<nav class="t2-sc4" aria-label="바로가기">' +
        '<button data-a="view" data-v="rank"><span class="a">' + I.trophy + '</span>성적표</button>' +
        '<button data-a="view" data-v="stocks"><span class="b">' + I.flame + '</span>인기 종목</button>' +
        '<button data-a="view" data-v="feed"><span class="c">' + I.chat + '</span>이야기방</button>' +
        '<button data-a="tab" data-v="academy"><span class="d">' + I.book + '</span>첫걸음</button></nav>';
      var lives = w.EXPERTS.filter(function(x){ return x.live; });
      if (lives.length) {
        h += '<section class="t2-sec">' + head('지금 방송 중', null, 'view', 'experts') + lives.map(function(x){
          var t = ''; try { t = w.onAirText(x.live.since); } catch (e) {}
          return '<button class="t2-row" data-a="expert" data-v="' + esc(x.id) + '"><span class="t2-mid"><b><span class="t2-dot"></span>' + esc(x.name) + '</b><span>' + esc([x.live.ch, x.live.title, t].filter(Boolean).join(' · ')) + '</span></span>' + I.chev + '</button>';
        }).join('') + '</section>';
      }
      if (!P.member) h += '<button class="t2-cta" data-a="join"><span class="bell">' + I.bell + '</span><b>새 추천을 알림으로 받아 보세요<small>카카오로 3초 · 무료</small></b>' + I.chev + '</button>';
      else if (!P.follows.length) h += '<button class="t2-cta" data-a="view" data-v="experts"><span class="bell">' + I.bell + '</span><b>관심 전문가를 골라 보세요<small>고른 전문가의 새 추천이 알림으로 와요</small></b>' + I.chev + '</button>';
      var rc = recentCalls();
      h += '<section class="t2-sec">' + headStatic(rc.today ? '오늘 새 추천' : '최근 추천', rc.list.length || null) +
        (rc.list.length ? rc.list.slice(0, 5).map(function(s){
          var x = w.expertById(s.L.expert) || {};
          return '<button class="t2-row" data-a="toLeading" data-v="' + esc(s.L.id) + '">' + scHTML(s.L.stock) + '<span class="t2-mid"><b>' + esc((w.STOCKS[s.L.stock] || {}).name || s.L.stock) + '</b><span><b class="t2-xn">' + esc(x.name || '') + '</b> · ' + esc(when(s.e.at)) + '</span></span><span class="t2-rt">' + evRight(s) + '</span></button>';
        }).join('') : '<p class="t2-empty">아직 올라온 추천이 없어요.<br>전문가가 방송·게시글에서 추천하면 바로 여기에 보여드릴게요.</p>') + '</section>';
      var rk = w.expertRanking().filter(function(o){ return o.st.hitRate != null; }).slice(0, 3);
      if (rk.length) {
        h += '<section class="t2-sec">' + head('전문가 성적표', null, 'view', 'rank') + rk.map(function(o, i){
          return '<button class="t2-row" data-a="expert" data-v="' + esc(o.x.id) + '"><span class="t2-rk">' + (i + 1) + '</span><span class="t2-mid"><b>' + esc(o.x.name) + '</b><span>끝난 추천 ' + o.st.doneCount + '건</span></span><span class="t2-rt"><b>' + Math.round(o.st.hitRate) + '%</b><span>적중률</span></span></button>';
        }).join('') + '</section>';
      }
      h += '<p class="t2-basis">전문가가 방송·게시글로 공개한 추천을 모아 정리했어요 · 투자 권유가 아니에요</p>';
      return h + '</main>';
    };

    // 추천 한 줄 (펼치면 요약 + 기록)
    function leadSub(a){
      var c = a.cur || {};
      if (a.status === 'holding') return md(a.startAt) + ' 구매 ' + won(c.buy) + ' · 목표 ' + won(c.target);
      if (a.status === 'done') return md(a.startAt) + ' → ' + md(a.endAt) + (a.hit ? ' · 목표 도달' : '');
      return md(a.startAt) + ' 지켜보기 시작';
    }
    function leadRight(a){
      if (a.status === 'done') return '<b class="' + tone(a.ret) + '">' + pct(a.ret) + '</b><span>' + won(a.sell) + ' 판매</span>';
      if (a.status === 'holding') return a.unreal != null ? '<b class="' + tone(a.unreal) + '">' + pct(a.unreal) + '</b><span>지금까지</span>' : '<b>' + won((a.cur || {}).buy) + '</b><span>구매 가격</span>';
      return '<b style="color:var(--ink2)">대기</b><span>&nbsp;</span>';
    }
    function bodyHTML(a){
      return '<div class="t2-body">' + w.summaryHTML(a) + w.timelineHTML(a) +
        '<div class="t2-acts"><button data-a="toTalk" data-v="' + esc(a.L.stock) + '">이야기방</button><button data-a="stock" data-v="' + esc(a.L.stock) + '">종목 전체 보기</button></div></div>';
    }
    w.leadingRow = function(a){
      var id = a.L.id, open = !!S.open[id], nm = (a.stock && a.stock.name) || a.L.stock;
      return '<div class="t2-item" id="ld-' + esc(id) + '"><button class="t2-row" data-a="toggle" data-v="' + esc(id) + '" aria-expanded="' + open + '">' + scHTML(a.L.stock) +
        '<span class="t2-mid"><b>' + esc(nm) + '</b><span>' + esc(leadSub(a)) + '</span></span><span class="t2-rt">' + leadRight(a) + '</span></button>' + (open ? bodyHTML(a) : '') + '</div>';
    };

    // 전문가
    w.screenExpert = function(id){
      var x = w.expertById(id);
      if (!x) return '<main class="screen gx"><p class="empty">지금은 볼 수 없는 전문가예요</p></main>';
      var st = w.expertStats(id), f = w.isFollow(id);
      var meta = [w.STYLE_SHORT ? (w.STYLE_SHORT[x.style] || '') + ' 매매' : '', (x.channels || [])[0], '팔로워 ' + w.fansOf(x).toLocaleString('ko-KR') + '명'].filter(Boolean).join(' · ');
      var h = '<main class="t2" style="padding-top:.25rem"><section class="t2-sec" style="padding-top:1.25rem">' +
        '<div class="t2-pf"><h2>' + esc(x.name) + (x.live ? '<span class="t2-tag lv">방송 중</span>' : '') + '</h2><p>' + esc(meta) + '</p>' + (x.intro ? '<p class="intro">' + esc(x.intro) + '</p>' : '') +
        '<button class="t2-btn' + (f ? ' on' : '') + '" data-a="follow" data-v="' + esc(x.id) + '" aria-pressed="' + f + '">' + (f ? '관심 전문가 · 새 추천 알림 받는 중' : '관심 전문가로 받기') + '</button></div>' +
        (x.live ? '<button class="t2-live" data-a="channel" data-v="' + esc(x.live.ch) + '"><span class="t2-dot"></span><span><b>지금 ' + esc(x.live.ch) + ' 출연 중</b><br><span>' + esc(x.live.title || '') + '</span></span></button>' : '') +
        '<div class="t2-st"><div><span>평균 적중률</span><b>' + (st.hitRate == null ? '-' : Math.round(st.hitRate) + '%') + '</b></div><div><span>평균 수익률</span><b class="' + (st.avg == null ? 'flat' : tone(st.avg)) + '">' + (st.avg == null ? '-' : pct(st.avg)) + '</b></div></div>' +
        '<p class="t2-basis2">' + (st.doneCount ? '판매까지 끝난 추천 ' + st.doneCount + '건 기준 · 전문가가 말한 가격으로 계산' : '아직 판매까지 끝난 추천이 없어요') + '</p></section>';
      var act = st.list.filter(function(a){ return a.status !== 'done'; }).sort(function(a, b){ return a.status === b.status ? (b.lastAt < a.lastAt ? -1 : 1) : (a.status === 'holding' ? -1 : 1); });
      var done = st.list.filter(function(a){ return a.status === 'done'; }).sort(function(a, b){ return b.endAt < a.endAt ? -1 : 1; });
      if (act.length) {
        h += '<section class="t2-lead">' + headStatic('지금 리딩 중', act.length) + act.map(function(a){
          var id2 = a.L.id, open = !!S.open[id2], wch = w.isWatch(a.L.stock), hold = a.status === 'holding', nm = (a.stock && a.stock.name) || a.L.stock;
          return '<div class="t2-lr" id="ld-' + esc(id2) + '"><div class="t2-row" style="cursor:default">' + scHTML(a.L.stock) + '<span class="t2-mid"><b>' + esc(nm) + (hold ? '<span class="t2-pill"><i></i>리딩 중</span>' : '<span class="t2-pill w">지켜보는 중</span>') + '</b><span>' + esc(leadSub(a)) + '</span></span></div>' +
            '<div class="t2-lb"><button class="p' + (wch ? ' on' : '') + '" data-a="' + (wch ? 'unwatch' : 'addWatch') + '" data-v="' + esc(a.L.stock) + '">' + (wch ? '관심종목에 담았어요 ✓' : '관심종목에 담기') + '</button>' +
            '<button class="q" data-a="toggle" data-v="' + esc(id2) + '" aria-expanded="' + open + '">' + (open ? '기록 접기' : '기록 보기') + '</button></div>' + (open ? bodyHTML(a) : '') + '</div>';
        }).join('') + '</section>';
      }
      var tab = S.dtab === 'talk' ? 'talk' : 'record';
      h += '<section class="t2-sec"><div class="t2-seg" role="group" aria-label="보기 선택"><button data-a="dtab" data-v="record" aria-pressed="' + (tab === 'record') + '">끝난 추천 ' + done.length + '</button><button data-a="dtab" data-v="talk" aria-pressed="' + (tab === 'talk') + '">이야기방</button></div>';
      if (tab === 'record') h += done.length ? done.map(w.leadingRow).join('') : '<p class="t2-empty">아직 판매까지 끝난 추천이 없어요.</p>';
      h += '</section>';
      if (tab === 'talk') h += '<div class="t2-talk">' + w.expertTalkHTML(x, st) + '</div>';
      h += '<p class="t2-basis">공개된 추천을 모아 계산했어요 · 투자 권유가 아니에요</p>';
      return h + '</main>';
    };
    wrapGo(w);
    try { w.render(); } catch (e) { try { console.log('[새 디자인] 화면 그리기 실패', e); } catch (x) {} }
    return true;
  }


  // ---- 커뮤니티: 연령대·공감 빼기, 실시간 대화 중심 순서
  var CMP = {"age_block": "'<div style=\"display:flex;align-items:center;gap:.5rem;flex-wrap:wrap\"><span class=\"small\">내 나이대</span>'+['40대','50대','60대','70대 이상'].map(function(a){return '<button class=\"tab\" data-act=\"age\" data-v=\"'+a+'\" aria-pressed=\"'+(P.age===a)+'\">'+a+'</button>'}).join('')+'</div>'+\n      '<b style=\"font-size:1rem\">나이대별로 보면</b>'+ageBars(AG,P.age)+'<p class=\"small\">나이가 많을수록 배당주를 고른 비율이 높아요.</p>'+ageTable(AG)", "rep_block": "h+='<figure class=\"fig\"><figcaption><span class=\"lbl\">나이대별</span><b>나이대에 따라 선택이 달랐어요</b></figcaption><div class=\"legend\"><span><i class=\"dot a\"></i>'+esc(LAST.a.name)+'</span><span><i class=\"dot b\"></i>'+esc(LAST.b.name)+'</span></div>'+ageBars(LAST)+ageTable(LAST)+'</figure>';"};
  function cmPatch(w, name, pairs){
    try {
      var src = String(w[name]); if (src.indexOf('function') !== 0) return 0;
      var out = src, hit = 0;
      pairs.forEach(function(p){ if (out.indexOf(p[0]) > -1) { out = out.split(p[0]).join(p[1]); hit++; } });
      if (hit) w.eval(name + ' = ' + out);
      return hit;
    } catch (e) { return 0; }
  }
  function ago(iso){ var m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000)); return m < 1 ? '방금' : m < 60 ? m + '분 전' : m < 1440 ? Math.floor(m / 60) + '시간 전' : Math.floor(m / 1440) + '일 전'; }
  function stockTalkHTML(){
    var L = window.__lnLive;
    var head = '<section class="sec" data-t2="stocktalk"><h2 class="sech">종목 토론<span class="meta">전문가 추천 종목 이야기방</span></h2><div class="card">';
    if (!L || !L.ready) return head + '<p class="t2-stk-empty">불러오는 중이에요</p></div></section>';
    var F = L.feed || {}, ST = F.stocks || {}, rows = [], seen = {};
    var talk = (L.talk || []).filter(function(m){ return ST[m.stock_id]; });
    var day = new Date(Date.now() - 864e5).toISOString();
    talk.forEach(function(m){ if (seen[m.stock_id]) { if (m.created_at > day) seen[m.stock_id].n++; return; } seen[m.stock_id] = { code: m.stock_id, last: m, n: m.created_at > day ? 1 : 0 }; rows.push(seen[m.stock_id]); });
    (F.events || []).slice().reverse().forEach(function(e){ if (!seen[e.stock] && ST[e.stock]) { seen[e.stock] = { code: e.stock, last: null, n: 0 }; rows.push(seen[e.stock]); } });
    rows = rows.slice(0, 5);
    if (!rows.length) return head + '<p class="t2-stk-empty">전문가 추천이 올라오면 종목마다 토론방이 열려요.</p></div></section>';
    return head + rows.map(function(r){
      var nm = (ST[r.code] || {}).name || r.code;
      var sub = r.last ? esc(r.last.nickname || '회원') + ': ' + esc(String(r.last.body || '').slice(0, 40)) + ' · ' + ago(r.last.created_at) : '아직 이야기가 없어요 · 첫 이야기를 남겨 보세요';
      return '<button class="t2-stk" data-ln-stock="' + esc(r.code) + '"><span class="nm"><b>' + esc(nm) + '</b><span>' + sub + '</span></span>' + (r.n ? '<span class="ct">오늘 ' + r.n + '개</span>' : '') + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>';
    }).join('') + '</div></section>';
  }
  // ── 커뮤니티 히어로: 지금 어떤 주제로 많이 이야기하는지 (최근 24시간, 없으면 7일)
  var HEAT = { ag: null, ag7: null, at: 0, busy: false };
  var HC = ['#5B4CF0', '#F04452', '#3182F6', '#F59E0B', '#10B981', '#9AA3AE'];
  function heatLoad(w, done){
    var D = window.__communityLive; if (!D || !D.ready || !D.sb || HEAT.busy || !w.AG) return;
    HEAT.busy = true;
    var t24 = new Date(Date.now() - 864e5).toISOString(), t7 = new Date(Date.now() - 7 * 864e5).toISOString();
    var cnt = function(since){ return D.sb.from('cm_chat').select('id', { count: 'exact', head: true }).eq('agenda_id', w.AG.id).gte('created_at', since).then(function(r){ return r && !r.error ? (r.count || 0) : null; }, function(){ return null; }); };
    Promise.all([cnt(t24), cnt(t7)]).then(function(rs){ HEAT.ag = rs[0]; HEAT.ag7 = rs[1]; HEAT.at = Date.now(); HEAT.busy = false; if (done) done(); });
  }
  function heatData(w){
    var L = window.__lnLive || {}, ST = (L.feed && L.feed.stocks) || {}, talk = L.talk || [];
    var name = function(c){ if (ST[c] && ST[c].name) return ST[c].name; try { var bc = window.__lnPlus && window.__lnPlus.bc; (bc && bc.episodes || []).some(function(e){ return (e.picks || []).some(function(k){ if (k.stock_code === c && k.stock_name) { c = k.stock_name; return true; } }); }); } catch (e) {} return c; };
    function build(ms, agN){
      var since = new Date(Date.now() - ms).toISOString(), by = {}, rows = [];
      talk.forEach(function(m){ if (m.created_at >= since && m.stock_id) by[m.stock_id] = (by[m.stock_id] || 0) + 1; });
      Object.keys(by).forEach(function(c){ rows.push({ key: 's', code: c, label: name(c) + ' 종목 토론', n: by[c] }); });
      if (agN) rows.push({ key: 'ag', label: '이번 주 토론 · ' + w.AG.title, n: agN });
      rows.sort(function(a, b){ return b.n - a.n; });
      return rows;
    }
    var rows = build(864e5, HEAT.ag), win = '최근 24시간';
    if (!rows.length) { rows = build(7 * 864e5, HEAT.ag7); win = '최근 7일'; }
    var tot = rows.reduce(function(s2, r){ return s2 + r.n; }, 0);
    if (rows.length > 5) { var rest = rows.slice(4).reduce(function(s2, r){ return s2 + r.n; }, 0); rows = rows.slice(0, 4).concat([{ key: 'etc', label: '그 밖의 이야기', n: rest }]); }
    return { rows: rows, tot: tot, win: win };
  }
  function heatHTML(w){
    var H = heatData(w), head = '<h2 class="sech"><i class="live" aria-hidden="true"></i>지금 많이 이야기하는 주제<span class="meta">' + H.win + (H.tot ? ' · 대화 ' + H.tot.toLocaleString('ko-KR') + '개' : '') + '</span></h2>';
    if (!H.tot) return '<section class="sec" id="t2-heat">' + head + '<div class="card t2-heat"><b class="hl">아직 오가는 대화가 없어요</b><p class="small">이번 주 토론방에 첫 이야기를 남겨 보세요.</p><button class="t2-heat-go" data-go="chat">토론방 들어가기 ›</button></div></section>';
    var pc = function(n){ return Math.round(n / H.tot * 100); }, top = H.rows[0];
    return '<section class="sec" id="t2-heat">' + head + '<div class="card t2-heat"><b class="hl">' + esc(top.key === 'ag' ? '이번 주 토론' : top.label.replace(/ 종목 토론$/, '')) + ' 이야기가 <em>' + pc(top.n) + '%</em>로 가장 많아요</b>' +
      '<div class="hbar" role="img" aria-label="' + esc(H.rows.map(function(r){ return r.label + ' ' + pc(r.n) + '%'; }).join(', ')) + '">' + H.rows.map(function(r, i){ return '<i style="flex:' + r.n + ';background:' + HC[i] + '"></i>'; }).join('') + '</div>' +
      '<div class="hleg">' + H.rows.map(function(r, i){
        var inner = '<i style="background:' + HC[i] + '"></i><span class="nm">' + esc(r.label) + '</span><span class="pc">' + pc(r.n) + '%</span><span class="ct">' + r.n + '개</span>';
        return r.key === 'ag' ? '<button data-go="chat">' + inner + '</button>' : r.key === 's' ? '<button data-ln-stock="' + esc(r.code) + '">' + inner + '</button>' : '<div>' + inner + '</div>';
      }).join('') + '</div></div></section>';
  }
  var HEAT_CSS = '.t2-heat{display:flex;flex-direction:column;gap:.75rem}.t2-heat .hl{font-size:1.125rem;line-height:1.45}.t2-heat .hl em{font-style:normal;color:var(--accent,#5B4CF0)}' +
    '.t2-heat .hbar{display:flex;height:1rem;border-radius:.5rem;overflow:hidden;gap:2px}.t2-heat .hbar i{display:block;min-width:4px}' +
    '.t2-heat .hleg{display:flex;flex-direction:column}.t2-heat .hleg>*{display:flex;align-items:center;gap:.5rem;width:100%;border:0;background:none;color:inherit;font:inherit;text-align:left;padding:.55rem 0;border-top:1px solid var(--line)}' +
    '.t2-heat .hleg button{cursor:pointer}.t2-heat .hleg i{flex:none;width:.75rem;height:.75rem;border-radius:3px}.t2-heat .hleg .nm{flex:1;min-width:0;font-size:.9375rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.t2-heat .hleg .pc{font-weight:800}.t2-heat .hleg .ct{font-size:.8125rem;color:var(--ink2);min-width:2.75rem;text-align:right}' +
    '.t2-heat-go{align-self:flex-start;border:0;background:none;color:var(--accent,#5B4CF0);font:inherit;font-weight:800;cursor:pointer;padding:0}';
  function patchCm(w, d){
    if (w.__t2 || !w.viewHome || !w.chatMsg || !w.render || !w.P || !w.S) return;
    w.__t2 = true;
    var P = w.P, S = w.S;
    w.ageBars = function(){ return ''; };
    w.ageTable = function(){ return ''; };
    if (S.sort === 'like' || !S.sort) S.sort = 'new';
    w.chatMsg = function(m){
      if (m.sys) return '<div class="cm sys" id="cm-' + m.id + '"><div class="cm-who"><b>' + w.esc(m.name) + '</b><span class="mono">' + m.at + '</span></div><div class="bub">' + w.esc(m.text) + '</div></div>';
      try { if (w.siteHid && w.siteHid(m.id)) return ''; } catch (e) {}
      return '<div class="cm ' + (m.side || '') + (m.mine ? ' mine' : '') + '" id="cm-' + m.id + '"><div class="cm-who">' + (m.side ? '<i class="dot ' + m.side + '"></i>' : '') + '<b>' + (m.mine ? '나' : w.esc(m.name)) + '</b><span class="mono">' + m.at + '</span></div>' +
        '<div class="bub">' + w.mention(m.text) + '</div>' + (m.mine ? '' : '<div class="cm-act"><button data-act="reply" data-v="' + w.esc(m.name) + '">답글</button></div>') + '</div>';
    };
    w.quoteCard = function(o, ag, opts){
      opts = opts || {};
      return '<article class="q' + (o.mine ? ' mine' : '') + '"><div class="q-who">' + (opts.picked ? '<span class="picked">뽑힌 의견</span>' : '') + '<b>' + (o.mine ? '회원님의 의견' : w.esc(o.name) + '님의 의견') + '</b>' + w.sideChip(ag, o.side) + '</div>' +
        '<p class="q-text">' + w.esc(o.text) + '</p>' + (o.mine ? '<div class="q-foot"><span>내 의견</span></div>' : '') + '</article>';
    };
    w.opList = function(){
      var list = w.allOps();
      if (S.side !== 'all') list = list.filter(function(o){ return o.side === S.side; });
      list.sort(function(a, b){ return (b.mine ? 1 : 0) - (a.mine ? 1 : 0); });
      if (!list.length) return '<p class="small" style="padding:1rem 0">아직 이쪽 의견이 없어요.</p>';
      return list.map(function(o){
        return '<div class="op' + (o.mine ? ' mine' : '') + '"><div class="op-who"><b>' + w.esc(o.name) + '</b>' + w.sideChip(w.AG, o.side) + (o.mine ? '<span class="chip" style="color:var(--accent);border-color:var(--accent)">내 의견</span>' : '') + '</div><p class="op-text">' + w.esc(o.text) + '</p></div>';
      }).join('');
    };
    cmPatch(w, 'viewDetail', [
      [CMP.age_block, "''"],
      ['명의 선택과 나이대별 결과가 기다리고 있어요', '명의 선택이 기다리고 있어요'],
      ['누르면 다른 분들의 선택과 나이대별 결과가 열려요', '누르면 다른 분들의 선택이 열려요'],
      [".slice().sort(function(a,b){return b.like-a.like}).slice(0,3)", ".slice(0,3)"],
      ['지금 공감 많은 의견', '눈에 띄는 의견'],
      ["[['like','공감 많은 순'],['new','최신 순']]", '[]']
    ]);
    cmPatch(w, 'viewReport', [[CMP.rep_block, '']]);
    cmPatch(w, 'livePrev', [["(m.age?'<span>'+esc(m.age)+'</span>':'')", "''"]]);
    cmPatch(w, 'composerHTML', [[' · 공감 10개가 넘으면 금요일 뽑힌 의견 후보가 돼요', '']]);
    // 홈 순서: 실시간 토론 → 종목 토론 → 오늘의 예측 → 지난 주 결과 → 이번 주 토론 → 그 밖
    var oh = w.viewHome;
    w.viewHome = function(){
      var html = oh(), t = d.createElement('template'); t.innerHTML = html;
      var kids = Array.prototype.slice.call(t.content.children), pick = function(f){ for (var i = 0; i < kids.length; i++) if (kids[i] && f(kids[i])) { var k = kids[i]; kids[i] = null; return k; } return null; };
      var txt = function(el){ var h = el.querySelector && el.querySelector('.sech'); return h ? h.textContent : ''; };
      var cele = pick(function(e){ return e.classList.contains('cele'); });
      var live = pick(function(e){ return e.id === 'lv-home'; });
      var pred = pick(function(e){ return !!e.querySelector('.card.pred'); });
      var last = pick(function(e){ return /지난 주 결과/.test(txt(e)); });
      var ban = pick(function(e){ return !!e.querySelector('button.banner'); });
      var foot = pick(function(e){ return e.classList.contains('foot'); });
      var rest = kids.filter(Boolean);
      // 토론 주제는 한 번에 하나만: 오늘의 예측 · 다음 달 주제 후보는 홈에서 빼요 (지난 결과는 그대로)
      var picks = null, cand = null; rest = rest.filter(function(e){ var t2 = txt(e); if (/뽑힌 의견/.test(t2)) { picks = e; return false; } if (/이야기할 주제|주제 후보/.test(t2)) { cand = e; return false; } return true; });
      void pred; void cand;
      return heatHTML(w) + [cele, live, ban, last, picks].concat(rest).concat([foot]).filter(Boolean).map(function(e){ return e.outerHTML; }).join('');
    };
    var oa = w.viewAgendas;
    if (oa) w.viewAgendas = function(){
      var t = d.createElement('template'); t.innerHTML = oa();
      Array.prototype.slice.call(t.content.children).forEach(function(e){ var h = e.querySelector && e.querySelector('.sech'); if (h && /운영 일정|요일별 오늘의 예측/.test(h.textContent)) e.remove(); });
      return t.innerHTML;
    };
    var hs = d.createElement('style'); hs.textContent = HEAT_CSS; d.head.appendChild(hs);
    var heatRedraw = function(){ var el = d.getElementById('t2-heat'); if (el) el.outerHTML = heatHTML(w); };
    var hTry = 0, hIv = setInterval(function(){ hTry++; var D = window.__communityLive; if (D && D.ready) { clearInterval(hIv); heatLoad(w, heatRedraw); } else if (hTry > 40) clearInterval(hIv); }, 500);
    setInterval(function(){ heatLoad(w, heatRedraw); }, 60000);
    d.addEventListener('click', function(ev){
      var b = ev.target.closest && ev.target.closest('[data-ln-stock]'); if (!b) return;
      ev.preventDefault(); ev.stopPropagation();
      try { window.__shell.show('ln', 's-' + b.getAttribute('data-ln-stock')); } catch (e) {}
    }, true);
    try { w.render(); } catch (e) {}
    // 실데이터가 늦게 오면 한 번 더 그리기
    var tries = 0, iv = setInterval(function(){ tries++; if ((window.__lnLive && window.__lnLive.ready) || tries > 40) { clearInterval(iv); try { if (d.querySelector('[data-t2="stocktalk"]')) w.render(); } catch (e) {} } }, 300);
  }

  // 다른 화면에서 '종목 이야기방'으로 바로 가는 경로 (s-종목코드)
  function wrapGo(w){
    if (!w.__site || w.__site.__t2go || !w.S) return;
    var ogo = w.__site.go, S = w.S;
    w.__site.go = function(r){
      if (r && r.indexOf('s-') === 0 && w.STOCKS && w.STOCKS[r.slice(2)]) { S.stack = [{ t: 'stock', id: r.slice(2) }]; S.sheet = null; S.tab = 'home'; w.render(); w.scrollTo(0, 0); return; }
      return ogo.apply(this, arguments);
    };
    w.__site.__t2go = true;
  }
  function hook(f){
    var w, d; try { w = f.contentWindow; d = f.contentDocument; } catch (e) { return; }
    if (!w || !d || !d.documentElement) return;
    var url = d.URL || '';
    if (/ln\.html/.test(url)) {
      css(d, 't2-ln-early', TOK_LN + BASE);   // 첫 그림부터 새 색으로
      if (!w.__t2) patchLn(w, d);
      wrapGo(w);
    } else if (/tools\.html/.test(url)) { font(d); css(d, 't2-tools', TOOLS_CSS); }
    else if (/community\.html/.test(url)) { font(d); css(d, 't2-cm', CM_CSS); patchCm(w, d); }
  }
  function scan(){
    Array.prototype.forEach.call(document.querySelectorAll('iframe'), function(f){
      if (!f.__t2Load) { f.__t2Load = true; f.addEventListener('load', function(){ hook(f); }); }
      hook(f);
    });
  }
  var tick = setInterval(scan, 40); setTimeout(function(){ clearInterval(tick); }, 20000);
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  scan();
  // 더하기 기능 (공유 카드 · 오늘의 언급 종목 · 표로 보기 · AI 요약): 같은 폴더의 ln-plus.js
  try { var me = document.currentScript && document.currentScript.src; var ps = document.createElement('script'); ps.src = (me ? new URL('ln-plus.js?v=4', me).href : 'ln-plus.js?v=4'); ps.defer = true; (document.head || document.documentElement).appendChild(ps); } catch (e) {}
})();
