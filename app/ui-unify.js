/* 리딩노트 · 세 탭(정보 · 도구 · 커뮤니티) 아래쪽 메뉴(하단 GNB) 모양과 크기를 하나로 맞춰요
   index.html(셸)에서 불러요. 각 탭 화면(iframe)에 같은 CSS를 넣어요.
   - 높이 68px · 아이콘 26px · 글자 14px · 지금 화면은 보라색 굵게
   - 밝은 화면/어두운 화면 모두 같은 규칙 (정보 탭은 html.lite, 도구·커뮤니티는 data-theme 방식) */
(function(){
  if (window.__uiUnify) return; window.__uiUnify = true;
  var CSS = [
    'html body nav.nav.nav{pointer-events:auto!important;transform:none!important;width:auto!important;max-width:none!important;left:0!important;right:0!important;bottom:0!important;margin:0!important;padding:0 0 env(safe-area-inset-bottom,0px)!important;border:0!important;border-radius:0!important;height:auto!important;background:#fff!important;box-shadow:0 -1px 0 rgba(0,0,0,.08)!important;backdrop-filter:none!important}',
    'html body nav.nav.nav .nav-in.nav-in{display:grid!important;grid-auto-flow:column!important;grid-auto-columns:minmax(0,1fr)!important;width:100%!important;max-width:640px!important;margin:0 auto!important;padding:0!important;gap:0!important;border:0!important;border-radius:0!important;background:none!important;box-shadow:none!important;height:auto!important}',
    'html body nav.nav.nav .nav-in.nav-in>button,html body nav.nav.nav .nav-in.nav-in>a{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:4px!important;width:auto!important;height:68px!important;min-height:68px!important;padding:0 2px!important;margin:0!important;border:0!important;border-radius:0!important;background:none!important;box-shadow:none!important;font-family:inherit!important;font-size:14px!important;font-weight:600!important;line-height:1.2!important;letter-spacing:-.02em!important;color:#6B7684!important;white-space:nowrap!important;text-decoration:none!important}',
    'html body nav.nav.nav .nav-in.nav-in>[aria-current="page"]{color:#5B4CF0!important;font-weight:800!important}',
    'html body nav.nav.nav .nav-in.nav-in>* svg{width:26px!important;height:26px!important;flex:none!important}',
    'html body nav.nav.nav .nav-ic{display:flex!important;align-items:center!important;justify-content:center!important;width:auto!important;height:auto!important;padding:0!important;margin:0!important;background:none!important;border-radius:0!important;box-shadow:none!important}',
    'html body nav.nav.nav .nav-in.nav-in>*:focus-visible{outline:3px solid #5B4CF0!important;outline-offset:-3px!important}',
    'html:not(.lite):not([data-theme="light"]) body nav.nav.nav{background:#17171c!important;box-shadow:0 -1px 0 rgba(255,255,255,.08)!important}',
    'html:not(.lite):not([data-theme="light"]) body nav.nav.nav .nav-in.nav-in>button,html:not(.lite):not([data-theme="light"]) body nav.nav.nav .nav-in.nav-in>a{color:#9AA0AA!important}',
    'html:not(.lite):not([data-theme="light"]) body nav.nav.nav .nav-in.nav-in>[aria-current="page"]{color:#A99DFF!important}'
  ].join('\n');
  function put(f){
    var d; try { d = f.contentDocument; } catch (e) { return; }
    if (!d || !d.head || d.getElementById('uu-nav')) return;
    if (!/(ln|tools|community)\.html/.test(d.URL || '')) return;
    var st = d.createElement('style'); st.id = 'uu-nav'; st.textContent = CSS; d.head.appendChild(st);
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
