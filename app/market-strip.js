/* 리딩노트 · 해외 시장 띠 (market-strip.js)
   index.html(맨 바깥 셸)의 </body> 바로 앞, bench-plus.js 다음 줄에 <script src="market-strip.js?v=1"></script> 한 줄만 넣으면 동작해요.
   - 맨 위 공지 아래에 해외 지표(S&P 500 · 나스닥 100 · 원/달러 · WTI 원유 · 금 · 비트코인)가 흘러가요.
   - TradingView 무료 위젯이에요. 국내 종목은 위젯에서 안 나와서 국내는 네이버 증권(차트 이미지)을 써요.
   - 주식·선물 값은 거래소 규정상 조금 늦게(지연) 나오고, 환율·코인은 실시간이에요.
   - 화면 밝기(밝은/어두운 화면)를 바꾸면 띠 색도 같이 바뀌어요.
   - 끄려면 아래 ON 을 false 로 바꿔요. 종목을 바꾸려면 SYMBOLS 를 고쳐요. */
(function(){
  if (window.__marketStrip) return; window.__marketStrip = true;
  var ON = true;
  var SYMBOLS = [
    { proName: 'FOREXCOM:SPXUSD', title: 'S&P 500' },
    { proName: 'FOREXCOM:NSXUSD', title: '나스닥 100' },
    { proName: 'FX_IDC:USDKRW', title: '원/달러' },
    { proName: 'TVC:USOIL', title: 'WTI 원유' },
    { proName: 'TVC:GOLD', title: '금' },
    { proName: 'BITSTAMP:BTCUSD', title: '비트코인' }
  ];
  if (!ON) return;
  var SRC = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';

  var css = document.createElement('style');
  css.textContent =
    '.tv-strip{flex:none;display:flex;align-items:center;gap:.5rem;height:48px;padding:0 0 0 12px;background:var(--bg);border-bottom:1px solid var(--line);overflow:hidden;position:relative;z-index:1}' +
    '.tv-lab{flex:none;display:flex;flex-direction:column;line-height:1.15;font-size:.8125rem;font-weight:700;color:var(--ink);text-decoration:none}' +
    '.tv-lab small{font-size:.6875rem;font-weight:500;color:var(--ink2)}' +
    '.tv-tape{flex:1;min-width:0;height:46px;overflow:hidden}' +
    '.tv-tape .tradingview-widget-container,.tv-tape .tradingview-widget-container__widget{height:46px!important}' +
    '.tv-tape iframe{display:block}' +
    '@media (min-width:960px){.tv-strip{padding-left:max(24px,calc((100% - 1232px)/2))}}';
  document.head.appendChild(css);

  function theme(){ return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }
  var strip = null, tape = null, built = '';
  function build(){
    var t = theme(); if (!tape || built === t) return; built = t;
    tape.innerHTML = '';
    var box = document.createElement('div'); box.className = 'tradingview-widget-container';
    var w = document.createElement('div'); w.className = 'tradingview-widget-container__widget'; box.appendChild(w);
    var s = document.createElement('script'); s.type = 'text/javascript'; s.async = true; s.src = SRC;
    s.textContent = JSON.stringify({ symbols: SYMBOLS, showSymbolLogo: false, isTransparent: true, displayMode: 'adaptive', colorTheme: t, locale: 'kr' });
    box.appendChild(s); tape.appendChild(box);
  }
  function mount(){
    if (strip || !document.getElementById('shell')) return;
    var after = document.getElementById('notice') || document.querySelector('.sh-top'); if (!after) return;
    strip = document.createElement('div'); strip.className = 'tv-strip'; strip.id = 'tv-strip';
    strip.setAttribute('role', 'region'); strip.setAttribute('aria-label', '해외 시장 지표');
    strip.innerHTML = '<a class="tv-lab" href="https://kr.tradingview.com/" target="_blank" rel="noopener nofollow">해외 시장<small>TradingView 제공</small></a><div class="tv-tape"></div>';
    after.parentNode.insertBefore(strip, after.nextSibling);
    tape = strip.querySelector('.tv-tape');
    build();
    new MutationObserver(function(){ build(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
