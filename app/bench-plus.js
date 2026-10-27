/* 리딩노트 · 쓰기 편한 기능 더하기 (bench-plus.js)
   index.html(맨 바깥 셸)의 </body> 바로 앞, stock-sheet.js 다음 줄에 <script src="bench-plus.js?v=1"></script> 한 줄만 넣으면 동작해요.
   세 서비스 화면 코드는 고치지 않고, 바깥에서 아래를 덧붙여요.
   1) 많이 리딩된 종목 띠: 최근 7일 전문가 추천이 많은 종목을 맨 위에서 돌아가며 보여줘요 (누르면 종목 창)
   2) 실시간 토론 창: PC는 떼어 내 옮기고 크기를 바꾸는 창(오른쪽에 붙이기 가능), 휴대폰은 아래에서 올라오는 창
   3) 투자 도구 종목 화면 차트: 기간(20·40·60일), 십자선과 값 표시, 선 두께, 평균선, 면 채우기, 현재가 가로선
   4) 투자 도구 종목 화면 '자세히 보기': 투자 지표 · 수급(누가 샀는지) · 호가(판매대기·구매대기) — Supabase 표 stock_detail
   5) 화면 설정 아래 '고급 설정': 오르고 내림 색, 가격 바뀔 때 깜빡임, 줄 배경 번갈아, 작은 흐름선, 숫자 줄 맞춤, 차트, 띠, 토론 창
   기본 화면은 그대로 단순하게 두고, 필요한 분만 펼쳐 쓰게 했어요. 설정은 이 기기에 저장돼요(localStorage 'ln.adv.v1'). */
(function(){
  if (window.__benchPlus) return; window.__benchPlus = true;

  // ===================== 설정 =====================
  var KEY = 'ln.adv.v1';
  var DEF = {
    updown: 'kr',      // kr: 오르면 빨강·내리면 파랑 / intl: 오르면 초록·내리면 빨강
    flash: true, flashLv: 2,
    zebra: false, spark: true, mono: true,
    chartDays: 60, chartW: 2, chartMA: true, chartFill: false, chartLast: true, chartCross: true,
    roll: true, rollSec: 5,
    talkBtn: true,
    detailOpen: false, advOpen: false,
    float: { x: null, y: null, w: 380, h: 560, dock: false }
  };
  var A = (function(){
    var o = JSON.parse(JSON.stringify(DEF)), l = null;
    try { l = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (l && typeof l === 'object') Object.keys(DEF).forEach(function(k){ if (l[k] !== undefined && typeof l[k] === typeof DEF[k]) o[k] = l[k]; });
    o.float = Object.assign({}, DEF.float, (l && l.float) || {});
    return o;
  })();
  function save(){ try { localStorage.setItem(KEY, JSON.stringify(A)); } catch (e) {} }
  window.__benchCfg = A;

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function n0(v){ return Number(v || 0).toLocaleString('ko-KR'); }
  function $(id){ return document.getElementById(id); }
  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WIDE = window.matchMedia('(min-width:960px)');

  // ---- 서버 (stock-sheet.js와 같은 방식, 읽기 전용)
  function cfg(){
    var w = window;
    for (var i = 0; i < 6; i++) {
      try {
        if (w.__SB && w.__SB.projectId) return { url: 'https://' + w.__SB.projectId + '.supabase.co', key: w.__SB.anonKey };
        if (w.SB_CFG && w.SB_CFG.url) return { url: w.SB_CFG.url, key: w.SB_CFG.key };
      } catch (e) {}
      if (w === w.parent) break; try { w = w.parent; } catch (e) { break; }
    }
    return null;
  }
  function rest(path){
    var c = cfg(); if (!c || !c.key) return Promise.resolve({ off: true });
    var h = { apikey: c.key }; if (/^eyJ/.test(c.key)) h.Authorization = 'Bearer ' + c.key;
    return fetch(c.url + '/rest/v1/' + path, { headers: h }).then(function(r){
      if (!r.ok) return { err: r.status };
      return r.json().then(function(d){ return { data: d }; });
    }, function(){ return { err: 'net' }; });
  }

  // ---- 서비스 화면 찾기
  function kindOf(f){
    var s = (f.getAttribute('src') || '') + ' ' + (f.title || '');
    if (/tools\.html|투자 도구/.test(s)) return 'tools';
    if (/(^|\/)ln\.html|리딩 모음/.test(s)) return 'ln';
    if (/community|커뮤니티/.test(s)) return 'cm';
    return '';
  }
  function frames(){ return Array.prototype.slice.call(document.querySelectorAll('iframe')); }

  // ===================== 1) 서비스 화면에 넣는 모양 =====================
  var FLASH_A = [0, .16, .28, .42];
  function frameCSS(){
    var a = FLASH_A[A.flashLv] || .28, c = [];
    if (A.updown === 'intl') c.push(
      ':root{--up:#2FBF71!important;--down:#F2636D!important;--up-soft:rgba(47,191,113,.12)!important;--down-soft:rgba(242,99,109,.12)!important}',
      ':root[data-theme="light"]{--up:#1B8A3A!important;--down:#D32F2F!important;--up-soft:rgba(27,138,58,.08)!important;--down-soft:rgba(211,47,47,.08)!important}');
    if (A.zebra) c.push('.rows>.row:nth-child(even){background:color-mix(in srgb,var(--ink) 5%,transparent)!important}');
    if (!A.spark) c.push('.spark{display:none!important}');
    if (A.mono) c.push('.rp b,.pr b,.lprice,.sprice,.bp-num{font-variant-numeric:tabular-nums}');
    c.push(
      '@keyframes bpFlashUp{0%{background:color-mix(in srgb,var(--up) ' + Math.round(a * 100) + '%,transparent)}100%{background:transparent}}',
      '@keyframes bpFlashDn{0%{background:color-mix(in srgb,var(--down) ' + Math.round(a * 100) + '%,transparent)}100%{background:transparent}}',
      '.bp-fu{animation:bpFlashUp 1s ease-out;border-radius:.3em}.bp-fd{animation:bpFlashDn 1s ease-out;border-radius:.3em}',
      // 차트 위 기간 버튼 · 십자선
      '.bp-fig .bp-days{display:flex;gap:.35rem;margin-left:auto}',
      '.bp-fig figcaption{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap}',
      '.bp-days button{all:unset;cursor:pointer;min-width:2.75rem;min-height:2.25rem;padding:0 .5rem;border-radius:.5rem;border:1px solid var(--line);text-align:center;font-size:.875rem;color:var(--ink2)}',
      '.bp-days button[aria-pressed="true"]{border-color:var(--ink);color:var(--ink);font-weight:700}',
      '.bp-days button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}',
      '.bp-chart{touch-action:pan-y;cursor:crosshair}',
      '.bp-chart .bp-x line{stroke:var(--ink2);stroke-width:1;stroke-dasharray:3 3}',
      '.bp-chart .bp-x rect{fill:var(--ink)}.bp-chart .bp-x text{fill:var(--bg)!important;font-weight:600}',
      '.bp-chart .bp-last{stroke-width:1;stroke-dasharray:4 3;opacity:.8}',
      '.bp-tip{min-height:1.4em;font-size:.875rem;color:var(--ink2);margin:0}',
      '.bp-tip b{color:var(--ink)}',
      // 자세히 보기
      '.bp-det{border:1px solid var(--line);border-radius:.75rem;background:var(--surface);margin:.25rem 0}',
      '.bp-det>summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:.5rem;min-height:3.25rem;padding:.6rem 1rem;font-weight:700;font-size:1.0625rem}',
      '.bp-det>summary::-webkit-details-marker{display:none}',
      '.bp-det>summary small{display:block;font-weight:400;font-size:.8125rem;color:var(--ink2);margin-top:.1rem}',
      '.bp-det>summary i{flex:none;font-style:normal;color:var(--ink2);transition:transform .2s}',
      '.bp-det[open]>summary i{transform:rotate(180deg)}',
      '.bp-det>summary:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:.75rem}',
      '.bp-db{display:flex;flex-direction:column;gap:1.1rem;padding:0 1rem 1rem}',
      '.bp-h{margin:0 0 .5rem;font-size:.9375rem;font-weight:700;color:var(--ink2)}',
      '.bp-grid{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}',
      '.bp-kv{padding:.65rem .75rem;border-radius:.6rem;background:var(--raise)}',
      '.bp-kv span{display:block;font-size:.8125rem;color:var(--ink2)}.bp-kv b{display:block;font-size:1.0625rem;margin-top:.1rem}',
      '.bp-kv em{display:block;font-style:normal;font-size:.75rem;color:var(--ink2);margin-top:.15rem;line-height:1.4}',
      '.bp-say{margin:0 0 .5rem;font-size:1rem;line-height:1.55}',
      '.bp-who{display:flex;flex-direction:column;gap:.35rem}',
      '.bp-who div{display:flex;justify-content:space-between;align-items:center;padding:.55rem .75rem;border-radius:.6rem;background:var(--raise)}',
      '.bp-tbl{width:100%;border-collapse:collapse;font-size:.875rem}',
      '.bp-tbl th,.bp-tbl td{white-space:nowrap;padding:.4rem .25rem;text-align:right;border-bottom:1px solid var(--line)}',
      '.bp-tbl th:first-child,.bp-tbl td:first-child{text-align:left}.bp-tbl th{color:var(--ink2);font-weight:600}',
      '.bp-ob{display:flex;height:1.75rem;border-radius:.5rem;overflow:hidden;font-size:.8125rem;font-weight:700}',
      '.bp-ob span{display:flex;align-items:center;padding:0 .5rem;white-space:nowrap;color:#fff}',
      '.bp-ob .s{background:var(--down);justify-content:flex-start}.bp-ob .b{background:var(--up);justify-content:flex-end}',
      '.bp-obl{display:flex;justify-content:space-between;font-size:.875rem;margin-top:.35rem;color:var(--ink2)}',
      '.bp-note{margin:0;font-size:.8125rem;color:var(--ink2);line-height:1.5}',
      '.bp-wait{margin:0;font-size:.9375rem;line-height:1.6;color:var(--ink2)}',
      '.bp-nv{display:inline-flex;align-items:center;min-height:2.75rem;font-weight:700;color:var(--ink);text-decoration:underline;text-underline-offset:3px}'
    );
    return c.join('\n');
  }
  function styleFrame(f){
    var d; try { d = f.contentDocument; } catch (e) { return; }
    if (!d || !d.head) return;
    var s = d.getElementById('bp-css');
    if (!s) { s = d.createElement('style'); s.id = 'bp-css'; d.head.appendChild(s); }
    var t = frameCSS(); if (s.textContent !== t) s.textContent = t;
  }

  // ===================== 2) 가격 바뀔 때 깜빡임 =====================
  // 가격 숫자가 바뀌어 다시 그려지면, 같은 종목의 이전 값과 비교해 오르면 빨강·내리면 파랑으로 잠깐 깜빡여요.
  var PRICE_SEL = '.rp b,.shead .pr b,.lprice,.sprice b,.sprice>.p';
  function priceKey(el, w){
    var h = el.closest('[data-stock],[data-code],[data-id],[data-s]');
    var k = h ? (h.getAttribute('data-stock') || h.getAttribute('data-code') || h.getAttribute('data-id') || h.getAttribute('data-s')) : '';
    if (!k) { try { if (w.S && w.S.view === 'stock') k = 'v-' + w.S.stock; } catch (e) {} }
    return k ? k + '|' + (el.className || el.tagName) : '';
  }
  function numOf(t){ var m = String(t || '').replace(/,/g, '').match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : null; }
  function flashScan(f){
    if (!A.flash || REDUCE) return;
    var d, w; try { d = f.contentDocument; w = f.contentWindow; } catch (e) { return; }
    if (!d || !d.body) return;
    var M = f.__bpPx || (f.__bpPx = {});
    Array.prototype.forEach.call(d.querySelectorAll(PRICE_SEL), function(el){
      var k = priceKey(el, w); if (!k) return;
      var v = numOf(el.textContent); if (v == null) return;
      var p = M[k]; M[k] = v;
      if (p != null && p !== v && !el.__bpDone) {
        el.__bpDone = true; el.classList.remove('bp-fu', 'bp-fd'); void el.offsetWidth; el.classList.add(v > p ? 'bp-fu' : 'bp-fd');
      }
    });
  }

  // ===================== 3) 투자 도구 · 종목 화면 차트 =====================
  function patchTools(f){
    var w; try { w = f.contentWindow; } catch (e) { return; }
    if (!w || w.__bpTools || typeof w.stockChart !== 'function' || typeof w.viewStock !== 'function' || !w.PXD) return;
    w.__bpTools = true;
    var origView = w.viewStock;

    w.stockChart = function(o){
      var csAll = o.cs || [], daysAll = (w.PXD && w.PXD.days) || [];
      var N = Math.max(5, Math.min(A.chartDays || 60, csAll.length)), off = csAll.length - N;
      var cs = csAll.slice(off), days = daysAll.slice(Math.max(0, daysAll.length - N));
      var n = cs.length, W = 330, H = 200, L = 8, R = 62, T = 12, B = 22, pw = W - L - R, ph = H - T - B;
      var m20 = cs.map(function(_, i){ return w.ma(csAll, 20, off + i); });
      var vals = cs.concat(A.chartMA ? m20 : []).filter(function(v){ return v != null; });
      if (vals.length < 2) return '';
      var mx = Math.max.apply(null, vals), mn = Math.min.apply(null, vals), pad = (mx - mn) * 0.08 || mx * 0.02; mx += pad; mn -= pad;
      function X(i){ return L + i / (n - 1) * pw; } function Y(v){ return T + (mx - v) / (mx - mn) * ph; }
      function path(a){ var d = '', pen = false; a.forEach(function(v, i){ if (v == null) { pen = false; return; } d += (pen ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(v).toFixed(1); pen = true; }); return d; }
      var g = ''; [0, .5, 1].forEach(function(fr){ var v = mn + (mx - mn) * (1 - fr); g += '<line class="grid" x1="' + L + '" x2="' + (L + pw) + '" y1="' + (T + ph * fr) + '" y2="' + (T + ph * fr) + '"/><text x="' + (L + pw + 6) + '" y="' + (T + ph * fr + 4) + '">' + w.num(v) + '</text>'; });
      var first = cs.filter(function(v){ return v != null; })[0] || cs[n - 1], last = cs[n - 1], t = w.tone(last - first), col = 'var(--' + (t === 'flat' ? 'ink2' : t) + ')';
      var sw = A.chartW || 2, area = '';
      if (A.chartFill) { var dp = path(cs); if (dp) area = '<path d="' + dp + 'L' + X(n - 1).toFixed(1) + ',' + (T + ph) + 'L' + X(0).toFixed(1) + ',' + (T + ph) + 'Z" style="fill:' + col + ';opacity:.12;stroke:none"/>'; }
      var lastLine = A.chartLast ? '<line class="bp-last" x1="' + L + '" x2="' + (L + pw) + '" y1="' + Y(last).toFixed(1) + '" y2="' + Y(last).toFixed(1) + '" style="stroke:' + col + '"/>' : '';
      var btn = [20, 40, 60].filter(function(k){ return k <= Math.max(20, csAll.length); }).map(function(k){
        return '<button type="button" data-bp-days="' + k + '" aria-pressed="' + (N === k) + '">' + k + '일</button>'; }).join('');
      var label = '최근 ' + n + '거래일';
      return '<figure class="fig bp-fig"><figcaption><span class="lbl">' + label + '</span><b>가격 흐름</b><span class="bp-days" role="group" aria-label="기간">' + btn + '</span></figcaption>' +
        '<div class="legend"><span><i class="dot" style="background:' + col + '"></i>종가</span>' + (A.chartMA ? '<span><i class="dot" style="background:var(--sn)"></i>20일 평균 가격</span>' : '') + '</div>' +
        '<svg class="chart' + (A.chartCross ? ' bp-chart' : '') + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + label + ' 종가' + (A.chartMA ? '와 20일 평균 가격' : '') + '"' +
          ' data-bp-v="' + cs.join(',') + '" data-bp-d="' + days.join(',') + '" data-bp-m="' + mn + ',' + mx + '">' + g + area + lastLine +
          (A.chartMA ? '<path d="' + path(m20) + '" fill="none" style="stroke:var(--sn)" stroke-width="' + Math.max(1, sw - .4) + '" stroke-linejoin="round"/>' : '') +
          '<path d="' + path(cs) + '" fill="none" style="stroke:' + col + '" stroke-width="' + sw + '" stroke-linejoin="round"/>' +
          '<circle cx="' + X(n - 1) + '" cy="' + Y(last) + '" r="4" style="fill:' + col + ';stroke:var(--surface)" stroke-width="2"/>' +
          '<g class="bp-x" style="display:none"><line y1="' + T + '" y2="' + (T + ph) + '"/><circle r="4" style="stroke:var(--surface)" stroke-width="2"/><rect rx="3" height="16"/><text text-anchor="middle"></text></g>' +
          '<text x="' + L + '" y="' + (H - 4) + '">' + w.dt(days[0]) + '</text><text x="' + (L + pw) + '" y="' + (H - 4) + '" text-anchor="end">' + w.dt(days[days.length - 1]) + '</text></svg>' +
        (A.chartCross ? '<p class="bp-tip" aria-live="polite">차트를 누르거나 손가락으로 밀면 그날 가격이 보여요.</p>' : '') +
        '<p class="small">' + n + '거래일 전보다 <b class="' + t + '">' + w.pct((last / first - 1) * 100) + '</b>' + (A.chartMA ? ' · 20일 평균 가격은 최근 20일 종가의 평균이에요.' : '') + '</p></figure>';
    };

    w.viewStock = function(){
      var h = origView.apply(this, arguments);
      try { var code = w.S && w.S.stock; if (code) { var add = detailHTML(code, w), i = h.indexOf('<div class="acts">'); h = i > -1 ? h.slice(0, i) + add + h.slice(i) : h + add; } } catch (e) {}
      return h;
    };

    var d = f.contentDocument;
    // 기간 버튼
    d.addEventListener('click', function(e){
      var b = e.target.closest && e.target.closest('[data-bp-days]'); if (!b) return;
      e.preventDefault(); e.stopPropagation(); A.chartDays = +b.getAttribute('data-bp-days'); save(); rerenderTools(); syncAdv();
    }, true);
    // 자세히 보기 펼침 기억
    d.addEventListener('toggle', function(e){ if (e.target && e.target.classList && e.target.classList.contains('bp-det')) { A.detailOpen = e.target.open; save(); syncAdv(); } }, true);
    // 십자선
    function cross(e){
      var svg = e.target.closest && e.target.closest('svg.bp-chart'); if (!svg) return;
      var vs = svg.getAttribute('data-bp-v').split(',').map(function(x){ return x === '' ? null : +x; }), ds = svg.getAttribute('data-bp-d').split(','), mm = svg.getAttribute('data-bp-m').split(',').map(Number);
      var n = vs.length, r = svg.getBoundingClientRect(), vx = (e.clientX - r.left) / r.width * 330;
      var i = Math.max(0, Math.min(n - 1, Math.round((vx - 8) / 260 * (n - 1))));
      while (i > 0 && vs[i] == null) i--;
      var v = vs[i]; if (v == null) return;
      var x = 8 + i / (n - 1) * 260, y = 12 + (mm[1] - v) / (mm[1] - mm[0]) * 166, g = svg.querySelector('.bp-x');
      g.style.display = ''; var ln = g.querySelector('line'); ln.setAttribute('x1', x); ln.setAttribute('x2', x);
      var c = g.querySelector('circle'); c.setAttribute('cx', x); c.setAttribute('cy', y); c.style.fill = 'var(--ink)';
      var lab = w.num(v), tw = lab.length * 7 + 12, tx = Math.max(8 + tw / 2, Math.min(268 - tw / 2, x));
      var rc = g.querySelector('rect'); rc.setAttribute('x', tx - tw / 2); rc.setAttribute('y', Math.max(0, y - 26)); rc.setAttribute('width', tw);
      var tt = g.querySelector('text'); tt.setAttribute('x', tx); tt.setAttribute('y', Math.max(0, y - 26) + 12); tt.textContent = lab;
      var tip = svg.parentNode.querySelector('.bp-tip'), prev = i > 0 ? vs[i - 1] : null;
      if (tip) tip.innerHTML = '<b>' + w.dt(ds[i]) + '</b> 끝난 가격 <b>' + w.won(v) + '</b>' + (prev ? ' · 전날보다 <b class="' + w.tone(v - prev) + '">' + w.pct((v / prev - 1) * 100) + '</b>' : '');
    }
    d.addEventListener('pointermove', cross, true);
    d.addEventListener('pointerdown', cross, true);
    d.addEventListener('pointerleave', function(e){ var svg = e.target.closest && e.target.closest('svg.bp-chart'); if (svg && e.pointerType === 'mouse') { var g = svg.querySelector('.bp-x'); if (g) g.style.display = 'none'; } }, true);

    if (w.S && w.S.view === 'stock') rerenderTools();
  }
  function toolsWin(){ var w = null; frames().forEach(function(f){ if (kindOf(f) === 'tools') try { if (f.contentWindow && f.contentWindow.__bpTools) w = f.contentWindow; } catch (e) {} }); return w; }
  function rerenderTools(){ var w = toolsWin(); if (!w || !w.S || w.S.view !== 'stock') return; var y = w.scrollY; try { w.render(); w.scrollTo(0, y); } catch (e) {} }

  // ===================== 4) 자세히 보기 (투자 지표 · 수급 · 호가) =====================
  var DET = {};   // code → undefined(아직) | 'wait' | null(자료 없음) | {…}
  function loadDetail(code){
    if (DET[code] !== undefined) return;
    DET[code] = 'wait';
    rest('stock_detail?select=*&code=eq.' + code + '&limit=1').then(function(r){
      DET[code] = r.data && r.data[0] ? r.data[0] : null;
      var w = toolsWin(); if (w && w.S && w.S.view === 'stock' && w.S.stock === code) rerenderTools();
    });
  }
  function fx(v, d){ if (v == null || v === '' || isNaN(v)) return '—'; return Number(v).toLocaleString('ko-KR', { maximumFractionDigits: d == null ? 2 : d }); }
  function signQ(v){ v = Number(v || 0); var a = Math.abs(v), t = a >= 1e8 ? (a / 1e8).toFixed(1).replace(/\.0$/, '') + '억' : a >= 1e4 ? (a / 1e4).toFixed(1).replace(/\.0$/, '') + '만' : n0(a); return (v > 0 ? '+' : v < 0 ? '−' : '') + t; }
  function streak(flows, k){
    var s = 0, sg = 0;
    for (var i = 0; i < flows.length; i++) { var v = Number(flows[i][k] || 0), g = v > 0 ? 1 : v < 0 ? -1 : 0; if (!g) break; if (!sg) sg = g; if (g !== sg) break; s++; }
    return { n: s, sign: sg };
  }
  function detailHTML(code, w){
    loadDetail(code);
    var D = DET[code], nv = 'https://m.stock.naver.com/domestic/stock/' + code + '/total', body;
    if (D === 'wait' || D === undefined) body = '<p class="bp-wait">불러오는 중이에요…</p>';
    else if (!D) body = '<p class="bp-wait">이 종목의 투자 지표 · 수급 · 호가는 자료 연결을 준비 중이에요. 준비되면 여기에 쉬운 말로 보여드릴게요.</p>' +
      '<a class="bp-nv" href="' + nv + '" target="_blank" rel="noopener noreferrer">지금은 네이버 증권에서 보기 ↗</a>';
    else {
      var parts = [];
      // 투자 지표
      var kv = [['PER', fx(D.per) + '배', '버는 돈에 비해 주가가 몇 배인지'], ['PBR', fx(D.pbr) + '배', '회사 재산에 비해 주가가 몇 배인지'],
        ['EPS', D.eps != null ? n0(D.eps) + '원' : '—', '주식 1주가 1년에 번 돈'], ['BPS', D.bps != null ? n0(D.bps) + '원' : '—', '주식 1주에 담긴 회사 재산'],
        ['배당수익률', D.div_yield != null ? fx(D.div_yield) + '%' : '—', '주가 대비 1년 배당금 비율'], ['외국인 보유율', D.foreign_ratio != null ? fx(D.foreign_ratio) + '%' : '—', '외국인이 가진 주식 비율']]
        .filter(function(x){ return x[1].charAt(0) !== '—'; });
      if (kv.length) parts.push('<section><h3 class="bp-h">투자 지표</h3><div class="bp-grid">' + kv.map(function(x){ return '<div class="bp-kv"><span>' + x[0] + '</span><b class="bp-num">' + x[1] + '</b><em>' + x[2] + '</em></div>'; }).join('') + '</div></section>');
      // 수급
      var fl = Array.isArray(D.flows) ? D.flows.slice().sort(function(a, b){ return String(b.d).localeCompare(String(a.d)); }) : [];
      if (fl.length) {
        var t0 = fl[0], say = [];
        [['f', '외국인'], ['i', '기관']].forEach(function(p){ var s = streak(fl, p[0]); if (s.n >= 2) say.push(p[1] + '이 <b>' + s.n + '일 연속 ' + (s.sign > 0 ? '사고' : '팔고') + '</b> 있어요'); });
        var who = [['f', '외국인'], ['i', '기관'], ['p', '개인']].map(function(p){ var v = Number(t0[p[0]] || 0);
          return '<div><span>' + p[1] + '</span><b class="bp-num ' + (v > 0 ? 'up' : v < 0 ? 'down' : '') + '">' + (v > 0 ? '샀어요 ' : v < 0 ? '팔았어요 ' : '그대로 ') + n0(Math.abs(v)) + '주</b></div>'; }).join('');
        var rows = fl.slice(0, 5).map(function(r){ var p = String(r.d || '').split('-'); return '<tr><td>' + (p.length === 3 ? (+p[1]) + '.' + (+p[2]) : esc(r.d)) + '</td>' +
          ['f', 'i', 'p'].map(function(k){ var v = Number(r[k] || 0); return '<td class="bp-num ' + (v > 0 ? 'up' : v < 0 ? 'down' : '') + '">' + signQ(v) + '</td>'; }).join('') + '</tr>'; }).join('');
        parts.push('<section><h3 class="bp-h">누가 샀을까요? (수급)</h3>' + (say.length ? '<p class="bp-say">' + say.join(', ') + '.</p>' : '') +
          '<div class="bp-who">' + who + '</div>' +
          '<table class="bp-tbl" style="margin-top:.6rem"><caption class="bp-note" style="text-align:right;caption-side:top;padding-bottom:.2rem">단위: 주</caption><thead><tr><th>날짜</th><th>외국인</th><th>기관</th><th>개인</th></tr></thead><tbody>' + rows + '</tbody></table>' +
          '<p class="bp-note" style="margin-top:.35rem">+는 산 주식이 더 많았던 날, −는 판 주식이 더 많았던 날이에요. (만 = 1만 주)</p></section>');
      }
      // 호가
      var ak = Number(D.ask_qty || 0), bd = Number(D.bid_qty || 0);
      if (ak + bd > 0) {
        var sp = Math.round(ak / (ak + bd) * 1000) / 10, bp = Math.round((100 - sp) * 10) / 10;
        parts.push('<section><h3 class="bp-h">팔려는 사람 · 사려는 사람 (호가)</h3>' +
          '<div class="bp-ob" role="img" aria-label="판매대기 ' + sp + '%, 구매대기 ' + bp + '%"><span class="s" style="width:' + Math.max(12, sp) + '%">' + sp + '%</span><span class="b" style="width:' + Math.max(12, bp) + '%">' + bp + '%</span></div>' +
          '<div class="bp-obl"><span>판매대기 <b class="bp-num">' + n0(ak) + '주</b></span><span>구매대기 <b class="bp-num">' + n0(bd) + '주</b></span></div>' +
          '<p class="bp-note" style="margin-top:.35rem">' + (sp > 60 ? '팔려고 기다리는 주식이 더 많아요.' : bp > 60 ? '사려고 기다리는 주식이 더 많아요.' : '팔려는 쪽과 사려는 쪽이 비슷해요.') + ' 몇 초마다 바뀌어요.</p></section>');
      }
      if (!parts.length) parts.push('<p class="bp-wait">이 종목은 아직 보여드릴 자료가 없어요.</p>');
      var at = D.as_of ? new Date(D.as_of) : null;
      parts.push('<p class="bp-note">' + (at && !isNaN(at) ? (at.getMonth() + 1) + '월 ' + at.getDate() + '일 ' + ('0' + at.getHours()).slice(-2) + ':' + ('0' + at.getMinutes()).slice(-2) + ' 기준 · ' : '') +
        (D.src ? '자료: ' + esc(D.src) + ' · ' : '') + '실시간이 아닐 수 있어요. 투자 권유가 아니에요.</p>');
      body = parts.join('');
    }
    return '<details class="bp-det"' + (A.detailOpen ? ' open' : '') + '><summary><span>자세히 보기<small>투자 지표 · 수급 · 호가</small></span><i aria-hidden="true">▾</i></summary><div class="bp-db">' + body + '</div></details>';
  }

  // ===================== 5) 많이 리딩된 종목 띠 =====================
  var TOP = { list: [], i: 0, t: null, open: false, src: '', loading: false, tried: false };
  function topFromFeed(){
    var L = window.__lnLive, F = L && L.feed; if (!F || !F.events) return null;
    var now = F.now ? Date.parse(F.now) : Date.now(), from = now - 7 * 864e5, by = {};
    F.events.forEach(function(e){
      if (!e || !e.stock || e.t === 'news') return;
      var at = Date.parse(e.at); if (isNaN(at) || at < from || at > now + 864e5) return;
      var o = by[e.stock] || (by[e.stock] = { code: e.stock, ex: {}, n: 0, last: 0 });
      o.ex[e.expert] = 1; o.n++; if (at > o.last) o.last = at;
    });
    var st = F.stocks || {};
    return Object.keys(by).map(function(c){ var o = by[c]; return { code: c, name: (st[c] && st[c].name) || c, experts: Object.keys(o.ex).length, n: o.n, last: o.last }; })
      .sort(function(a, b){ return b.experts - a.experts || b.n - a.n || b.last - a.last; }).slice(0, 5);
  }
  function topFromMentions(){
    if (TOP.tried) return; TOP.tried = true; TOP.loading = true;
    rest('mention_days?select=day,items&order=day.desc&limit=7').then(function(r){
      TOP.loading = false;
      var rows = (r.data || []).filter(function(x){ return Array.isArray(x.items) && x.items.length; });
      if (!rows.length) return;
      var list = rows[0].items.map(function(it){
        var code = String(it.code || it.stock_code || it.stock || '').replace(/\D/g, '').slice(0, 6);
        return { code: code, name: String(it.name || it.stock_name || code), experts: +(it.n_experts || it.experts || 0), n: +(it.n || it.count || it.posts || it.mentions || 0) };
      }).filter(function(x){ return x.name; }).sort(function(a, b){ return b.experts - a.experts || b.n - a.n; }).slice(0, 5);
      if (list.length && !TOP.list.length) { TOP.list = list; TOP.src = 'mention'; drawTop(); }
    });
  }
  function topItemHTML(x, rank){
    var meta = x.experts ? '전문가 ' + x.experts + '명' + (x.n > x.experts ? ' · ' + x.n + '번' : '') : x.n ? x.n + '번 언급' : '';
    return '<span class="bp-rk">' + rank + '</span><span class="bp-nm">' + esc(x.name) + '</span>' + (meta ? '<span class="bp-mt">' + meta + '</span>' : '');
  }
  function drawTop(){
    var el = $('bp-top'); if (!el) return;
    var app = document.documentElement.getAttribute('data-app') || 'ln';
    var hide = !A.roll && !TOP.list.length || !TOP.list.length || (app !== 'ln' && app !== 'cm') || /^#cm\/chat/.test(location.hash) || document.body.classList.contains('bp-float-sheet');
    if (!A.roll) hide = true;
    el.hidden = hide; if (hide) { stopRoll(); return; }
    if (TOP.i >= TOP.list.length) TOP.i = 0;
    var x = TOP.list[TOP.i];
    el.innerHTML = '<div class="bp-top-in"><span class="bp-tl"><span class="bp-tl-l">많이 리딩된 종목</span><span class="bp-tl-s" aria-hidden="true">많이 리딩</span></span>' +
      '<button type="button" class="bp-ti" data-bp-top="go" data-code="' + esc(x.code) + '" data-name="' + esc(x.name) + '" aria-label="' + (TOP.i + 1) + '위 ' + esc(x.name) + ', 종목 창 열기"><span class="bp-slide">' + topItemHTML(x, TOP.i + 1) + '</span></button>' +
      '<button type="button" class="bp-tm" data-bp-top="more" aria-expanded="' + TOP.open + '" aria-controls="bp-top-list">' + (TOP.open ? '닫기 ▴' : 'TOP ' + TOP.list.length + ' ▾') + '</button></div>' +
      (TOP.open ? '<ol class="bp-top-list" id="bp-top-list">' + TOP.list.map(function(y, i){ return '<li><button type="button" data-bp-top="go" data-code="' + esc(y.code) + '" data-name="' + esc(y.name) + '">' + topItemHTML(y, i + 1) + '</button></li>'; }).join('') +
        '</ol><p class="bp-top-note">최근 7일 동안 전문가들이 공개적으로 추천·언급한 종목이에요. 투자 권유가 아니에요.</p>' : '');
    startRoll();
  }
  function stopRoll(){ if (TOP.t) { clearInterval(TOP.t); TOP.t = null; } }
  function startRoll(){
    stopRoll();
    if (TOP.open || TOP.list.length < 2 || !A.rollSec || REDUCE && A.rollSec < 8) return;
    TOP.t = setInterval(function(){
      var el = $('bp-top'); if (!el || el.hidden || el.__hover || document.hidden) return;
      TOP.i = (TOP.i + 1) % TOP.list.length; var x = TOP.list[TOP.i], b = el.querySelector('.bp-ti'); if (!b) return;
      b.setAttribute('data-code', x.code); b.setAttribute('data-name', x.name); b.setAttribute('aria-label', (TOP.i + 1) + '위 ' + x.name + ', 종목 창 열기');
      var s = b.querySelector('.bp-slide'); s.innerHTML = topItemHTML(x, TOP.i + 1);
      if (!REDUCE) { s.classList.remove('bp-in'); void s.offsetWidth; s.classList.add('bp-in'); }
    }, Math.max(3, A.rollSec) * 1000);
  }
  function refreshTop(){
    var l = topFromFeed();
    if (l && l.length) { TOP.list = l; TOP.src = 'feed'; }
    else if (window.__lnLive && window.__lnLive.ready) topFromMentions();
    drawTop();
  }

  // ===================== 6) 실시간 토론 창 =====================
  var FL = { el: null, f: null, open: false };
  function floatMode(){ return WIDE.matches ? (A.float.dock ? 'dock' : 'win') : 'sheet'; }
  function placeFloat(){
    var el = FL.el; if (!el) return;
    var m = floatMode(), s = el.style;
    el.className = 'bp-float bp-' + m; document.body.classList.toggle('bp-docked', FL.open && m === 'dock');
    document.body.classList.toggle('bp-float-sheet', FL.open && m === 'sheet');
    s.left = s.top = s.width = s.height = '';
    if (m === 'win') {
      var vw = window.innerWidth, vh = window.innerHeight, w = Math.max(300, Math.min(A.float.w, vw - 32)), h = Math.max(320, Math.min(A.float.h, vh - 32));
      var x = A.float.x == null ? vw - w - 24 : A.float.x, y = A.float.y == null ? vh - h - 24 : A.float.y;
      x = Math.max(8, Math.min(vw - w - 8, x)); y = Math.max(8, Math.min(vh - h - 8, y));
      s.left = x + 'px'; s.top = y + 'px'; s.width = w + 'px'; s.height = h + 'px';
    }
    var db = el.querySelector('[data-bp-f="dock"]'); if (db) { db.hidden = m === 'sheet'; db.textContent = m === 'dock' ? '창으로 떼기' : '오른쪽에 붙이기'; }
    el.hidden = !FL.open;
    var fab = $('bp-talk'); if (fab) fab.setAttribute('aria-expanded', FL.open);
  }
  function openFloat(){
    if (!FL.el) {
      var el = FL.el = document.createElement('section'); el.id = 'bp-float'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', '실시간 토론 창');
      el.innerHTML = '<header class="bp-fh" data-bp-f="drag"><b>실시간 토론</b><span class="bp-fs"></span><button type="button" data-bp-f="dock">오른쪽에 붙이기</button><button type="button" class="bp-fx" data-bp-f="close" aria-label="토론 창 닫기">×</button></header><div class="bp-fb"></div><div class="bp-rz" data-bp-f="resize" aria-hidden="true"></div>';
      document.body.appendChild(el);
      var f = FL.f = document.createElement('iframe');
      f.title = '실시간 토론 · 커뮤니티'; f.setAttribute('allow', 'clipboard-write; web-share');
      f.addEventListener('load', function(){
        var tries = 0;
        (function go(){
          var w; try { w = f.contentWindow; } catch (e) { return; }
          if (w && w.__site) {
            try { w.__site.apply(Object.assign({}, window.__siteCfg || {}, { wide: false })); } catch (e) {}
            try { w.__site.go('chat'); } catch (e) {}
            styleFrame(f);
          } else if (tries++ < 40) setTimeout(go, 100);
        })();
      });
      f.src = (window.APP_URL && window.APP_URL.cm) || 'community.html';
      el.querySelector('.bp-fb').appendChild(f);
      el.addEventListener('click', function(e){
        var b = e.target.closest('[data-bp-f]'); if (!b) return; var a = b.getAttribute('data-bp-f');
        if (a === 'close') closeFloat();
        else if (a === 'dock') { A.float.dock = !A.float.dock; save(); placeFloat(); syncAdv(); }
      });
      dragify(el);
    }
    FL.open = true; placeFloat(); drawTop();
    var x = FL.el.querySelector('.bp-fx'); if (x && !WIDE.matches) x.focus();
  }
  function closeFloat(){ FL.open = false; placeFloat(); drawTop(); var fab = $('bp-talk'); if (fab) fab.focus(); }
  function dragify(el){
    var st = null;
    el.addEventListener('pointerdown', function(e){
      var a = e.target.closest('[data-bp-f]'); a = a && a.getAttribute('data-bp-f');
      if (floatMode() !== 'win' || (a !== 'drag' && a !== 'resize') || e.target.closest('button')) return;
      e.preventDefault(); var r = el.getBoundingClientRect();
      st = { a: a, x: e.clientX, y: e.clientY, l: r.left, t: r.top, w: r.width, h: r.height };
      el.classList.add('bp-moving'); el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', function(e){
      if (!st) return; var dx = e.clientX - st.x, dy = e.clientY - st.y;
      if (st.a === 'drag') { el.style.left = Math.max(8, Math.min(window.innerWidth - st.w - 8, st.l + dx)) + 'px'; el.style.top = Math.max(8, Math.min(window.innerHeight - 48, st.t + dy)) + 'px'; }
      else { el.style.width = Math.max(300, Math.min(window.innerWidth - st.l - 8, st.w + dx)) + 'px'; el.style.height = Math.max(320, Math.min(window.innerHeight - st.t - 8, st.h + dy)) + 'px'; }
    });
    function end(){ if (!st) return; var r = el.getBoundingClientRect(); A.float.x = Math.round(r.left); A.float.y = Math.round(r.top); A.float.w = Math.round(r.width); A.float.h = Math.round(r.height); save(); st = null; el.classList.remove('bp-moving'); }
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  }

  // ===================== 7) 고급 설정 (화면 설정 아래) =====================
  function seg(key, opts, label){
    return '<div class="bp-row bp-col"><span class="bp-rl">' + label + '</span><div class="seg bp-seg" role="group" aria-label="' + label + '">' +
      opts.map(function(o){ return '<button type="button" data-bp="' + key + '" data-v="' + o[0] + '" aria-pressed="' + (String(A[key]) === String(o[0])) + '">' + o[1] + '</button>'; }).join('') + '</div></div>';
  }
  function sw(key, label, hint){
    return '<div class="bp-row bp-sw"><span class="bp-rl">' + label + (hint ? '<small>' + hint + '</small>' : '') + '</span><button type="button" role="switch" class="bp-tg" data-bp="' + key + '" aria-checked="' + !!A[key] + '" aria-label="' + label + '"><i></i></button></div>';
  }
  function advInner(){
    return '<summary><span>고급 설정<small>시세표 · 차트 · 띠 · 토론 창 — 필요한 분만 바꿔 쓰세요</small></span><i aria-hidden="true">▾</i></summary><div class="bp-ab">' +
      '<p class="bp-gh">시세표</p>' +
      seg('updown', [['kr', '오르면 빨강'], ['intl', '오르면 초록']], '오르고 내림 색') +
      sw('flash', '가격 바뀔 때 깜빡임', '바뀐 가격을 잠깐 색으로 알려줘요') +
      (A.flash ? seg('flashLv', [[1, '약하게'], [2, '보통'], [3, '강하게']], '깜빡임 세기') : '') +
      sw('zebra', '줄마다 배경 번갈아', '긴 목록에서 줄을 놓치지 않게') +
      sw('spark', '작은 흐름선 보이기', '종목 이름 옆 60일 가격선') +
      sw('mono', '숫자 줄 맞춤', '가격 자릿수를 세로로 가지런히') +
      '<p class="bp-gh">차트 <small>투자 도구 → 종목 화면</small></p>' +
      seg('chartDays', [[20, '20일'], [40, '40일'], [60, '60일']], '보는 기간') +
      seg('chartW', [[1.2, '얇게'], [2, '보통'], [3, '굵게']], '선 두께') +
      sw('chartCross', '누르면 그날 가격 보기', '십자선과 값 표시') +
      sw('chartMA', '20일 평균 가격선') +
      sw('chartLast', '마지막 가격 가로선') +
      sw('chartFill', '선 아래 면 채우기') +
      '<p class="bp-gh">종목 화면</p>' +
      sw('detailOpen', "'자세히 보기' 늘 펼쳐 두기", '투자 지표 · 수급 · 호가') +
      '<p class="bp-gh">맨 위 띠 · 토론 창</p>' +
      sw('roll', '많이 리딩된 종목 띠') +
      (A.roll ? seg('rollSec', [[0, '멈춤'], [5, '5초'], [10, '10초']], '넘어가는 간격') : '') +
      sw('talkBtn', '토론 창 버튼 보이기', 'PC는 떼어 내는 창, 휴대폰은 아래 창') +
      (WIDE.matches ? sw('dock', '토론 창 오른쪽에 붙이기') : '') +
      '<button type="button" class="bp-reset" data-bp="reset">고급 설정 처음대로</button></div>';
  }
  function syncAdv(){
    var d = $('bp-adv'); if (!d) return;
    var foc = document.activeElement, fk = foc && foc.getAttribute && foc.getAttribute('data-bp'), fv = foc && foc.getAttribute && foc.getAttribute('data-v');
    d.innerHTML = advInner(); d.open = A.advOpen;
    if (fk) { var n = d.querySelector('[data-bp="' + fk + '"]' + (fv != null ? '[data-v="' + fv + '"]' : '')); if (n) n.focus(); }
  }
  function injectAdv(){
    var layer = $('layer'); if (!layer) return;
    var h = layer.querySelector('#set-h'); if (!h || layer.querySelector('#bp-adv')) return;
    var sheet = h.closest('.sheet'); if (!sheet) return;
    var d = document.createElement('details'); d.id = 'bp-adv'; d.className = 'bp-adv';
    var adminBox = sheet.querySelector('[data-s="admin"]'); adminBox = adminBox && adminBox.parentNode;
    if (adminBox && adminBox.parentNode === sheet) sheet.insertBefore(d, adminBox); else sheet.appendChild(d);
    syncAdv();
    d.addEventListener('toggle', function(){ A.advOpen = d.open; save(); });
  }
  function setOpt(k, v){
    if (k === 'reset') { var keep = { float: A.float, advOpen: true }; Object.keys(DEF).forEach(function(x){ A[x] = JSON.parse(JSON.stringify(DEF[x])); }); A.float = keep.float; A.float.dock = false; A.advOpen = true; }
    else if (k === 'dock') { A.float.dock = !A.float.dock; if (FL.open) placeFloat(); }
    else if (typeof DEF[k] === 'boolean') A[k] = !A[k];
    else if (typeof DEF[k] === 'number') A[k] = Number(v);
    else A[k] = v;
    save(); applyEverywhere(); syncAdv();
    if (/^chart|^detailOpen$|^reset$/.test(k)) rerenderTools();
    if (k === 'roll' || k === 'rollSec' || k === 'reset') { TOP.i = 0; drawTop(); }
    if (k === 'talkBtn' || k === 'reset') drawFab();
  }
  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('#bp-adv [data-bp]'); if (!b) return;
    e.preventDefault(); setOpt(b.getAttribute('data-bp'), b.getAttribute('data-v'));
  });

  // ===================== 셸 모양 =====================
  var css = document.createElement('style'); css.id = 'bp-shell-css';
  css.textContent = [
    // 띠
    '#bp-top{border-bottom:1px solid var(--line);background:var(--surface)}',
    '#bp-top[hidden]{display:none}',
    '.bp-top-in{display:flex;align-items:center;gap:.5rem;max-width:1200px;margin:0 auto;padding:.25rem 16px;min-height:3rem}',
    '.bp-tl-s{display:none}@media (max-width:519px){.bp-tl-l{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}.bp-tl-s{display:inline}.bp-tl{padding:.2rem .4rem}.bp-mt{font-size:.8125rem}.bp-top-in{gap:.35rem}}',
    '.bp-tl{flex:none;font-size:.8125rem;font-weight:700;color:var(--ink2);padding:.2rem .5rem;border-radius:.4rem;background:var(--raise)}',
    '.bp-ti{all:unset;box-sizing:border-box;flex:1;min-width:0;min-height:2.75rem;display:flex;align-items:center;cursor:pointer;overflow:hidden;border-radius:.5rem;padding:0 .25rem}',
    '.bp-slide{display:flex;align-items:baseline;gap:.5rem;min-width:0;white-space:nowrap}',
    '.bp-slide.bp-in{animation:bpIn .35s ease-out}',
    '@keyframes bpIn{from{transform:translateY(60%);opacity:0}to{transform:none;opacity:1}}',
    '.bp-rk{font-weight:800;color:var(--accent)}',
    '.bp-nm{flex:0 1 auto;max-width:65%;font-weight:700;font-size:1.0625rem;color:var(--ink);overflow:hidden;text-overflow:ellipsis}',
    '.bp-mt{flex:0 100 auto;min-width:0;font-size:.875rem;color:var(--ink2);overflow:hidden;text-overflow:ellipsis}',
    '.bp-tm{all:unset;flex:none;cursor:pointer;min-height:2.75rem;padding:0 .6rem;border-radius:.5rem;font-size:.875rem;font-weight:600;color:var(--ink2)}',
    '.bp-ti:focus-visible,.bp-tm:focus-visible,.bp-top-list button:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}',
    '.bp-top-list{list-style:none;margin:0 auto;padding:0 16px .25rem;max-width:1200px;display:flex;flex-direction:column}',
    '.bp-top-list button{all:unset;box-sizing:border-box;width:100%;display:flex;align-items:baseline;gap:.5rem;min-height:2.75rem;cursor:pointer;border-top:1px solid var(--line);padding:.35rem .25rem}',
    '.bp-top-note{max-width:1200px;margin:0 auto;padding:.1rem 16px .6rem;font-size:.8125rem;color:var(--ink2)}',
    // 토론 버튼
    '#bp-talk{position:fixed;right:16px;bottom:calc(96px + env(safe-area-inset-bottom,0px));z-index:70;display:flex;align-items:center;gap:.4rem;min-height:3rem;padding:0 1.1rem;border:0;border-radius:999px;background:var(--ink);color:var(--bg);font:inherit;font-weight:700;font-size:1rem;box-shadow:0 6px 20px rgba(0,0,0,.25);cursor:pointer}',
    '#bp-talk svg{width:1.2rem;height:1.2rem}',
    '#bp-talk[hidden]{display:none}',
    '#bp-talk:focus-visible{outline:3px solid var(--accent);outline-offset:2px}',
    '@media (max-width:959px){#bp-talk{width:3.5rem;height:3.5rem;padding:0;justify-content:center}#bp-talk span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}#bp-talk svg{width:1.5rem;height:1.5rem}}',
    '@media (min-width:960px){#bp-talk{bottom:24px;right:24px}}',
    // 토론 창
    '.bp-float{position:fixed;z-index:80;display:flex;flex-direction:column;background:var(--surface);color:var(--ink);border:1px solid var(--line);overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,.35)}',
    '.bp-float[hidden]{display:none}',
    '.bp-win{border-radius:.9rem}',
    '.bp-dock{top:0;right:0;bottom:0;width:400px;border-radius:0;border-width:0 0 0 1px;box-shadow:-8px 0 24px rgba(0,0,0,.18)}',
    'body.bp-docked .shell{margin-right:400px}',
    '.bp-sheet{left:0;right:0;bottom:0;height:min(80vh,680px);border-radius:1.1rem 1.1rem 0 0;border-width:1px 0 0}',
    '.bp-fh{display:flex;align-items:center;gap:.4rem;min-height:3rem;padding:0 .4rem 0 1rem;border-bottom:1px solid var(--line);user-select:none;flex:none}',
    '.bp-win .bp-fh{cursor:grab}.bp-moving .bp-fh{cursor:grabbing}.bp-moving iframe{pointer-events:none}',
    '.bp-fh b{font-size:1rem}.bp-fs{flex:1}',
    '.bp-fh button{min-height:2.5rem;padding:0 .7rem;border:1px solid var(--line);border-radius:.5rem;background:transparent;color:var(--ink2);font:inherit;font-size:.875rem;cursor:pointer}',
    '.bp-fh .bp-fx{border:0;font-size:1.5rem;width:2.75rem;padding:0;color:var(--ink2)}',
    '.bp-fh button:focus-visible{outline:2px solid var(--accent);outline-offset:1px}',
    '.bp-fb{flex:1;min-height:0}.bp-fb iframe{border:0;width:100%;height:100%;display:block}',
    '.bp-rz{position:absolute;right:0;bottom:0;width:18px;height:18px;cursor:nwse-resize;background:linear-gradient(135deg,transparent 50%,var(--ink2) 50%,var(--ink2) 58%,transparent 58%,transparent 70%,var(--ink2) 70%,var(--ink2) 78%,transparent 78%)}',
    '.bp-dock .bp-rz,.bp-sheet .bp-rz{display:none}',
    // 고급 설정
    '.bp-adv{border-top:1px solid var(--line);padding-top:.5rem}',
    '.bp-adv>summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:.5rem;min-height:3rem;font-weight:700}',
    '.bp-adv>summary::-webkit-details-marker{display:none}',
    '.bp-adv>summary small{display:block;font-weight:400;font-size:.8125rem;color:var(--ink2);margin-top:.1rem}',
    '.bp-adv>summary i{font-style:normal;color:var(--ink2);transition:transform .2s}.bp-adv[open]>summary i{transform:rotate(180deg)}',
    '.bp-adv>summary:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:.5rem}',
    '.bp-ab{display:flex;flex-direction:column;gap:.55rem;padding:.25rem 0 .5rem}',
    '.bp-gh{margin:.6rem 0 0;font-size:.875rem;font-weight:700;color:var(--ink2)}.bp-gh small{font-weight:400}',
    '.bp-row{display:flex;align-items:center;justify-content:space-between;gap:.75rem;flex-wrap:wrap}',
    '.bp-rl{font-size:.9375rem}.bp-rl small{display:block;font-size:.8125rem;color:var(--ink2)}',
    '.bp-col{flex-direction:column;align-items:stretch;gap:.35rem}',
    '.bp-seg{display:flex;gap:.35rem}.bp-seg button{flex:1;min-height:2.75rem}',
    '.bp-tg{flex:none;position:relative;width:3.25rem;height:2rem;border-radius:999px;border:1px solid var(--line);background:var(--raise);cursor:pointer;padding:0}',
    '.bp-tg i{position:absolute;top:.2rem;left:.2rem;width:1.5rem;height:1.5rem;border-radius:50%;background:var(--ink2);transition:left .15s}',
    '.bp-tg[aria-checked="true"]{background:var(--accent);border-color:var(--accent)}.bp-tg[aria-checked="true"] i{left:1.5rem;background:var(--on-accent,#fff)}',
    '.bp-tg:focus-visible{outline:2px solid var(--accent);outline-offset:2px}',
    '.bp-reset{align-self:flex-start;margin-top:.5rem;min-height:2.75rem;padding:0 .9rem;border:1px solid var(--line);border-radius:.6rem;background:transparent;color:var(--ink2);font:inherit;cursor:pointer}'
  ].join('\n');
  document.head.appendChild(css);

  function drawFab(){
    var b = $('bp-talk');
    if (!b) {
      b = document.createElement('button'); b.id = 'bp-talk'; b.type = 'button'; b.setAttribute('aria-haspopup', 'dialog'); b.setAttribute('aria-expanded', 'false');
      b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg><span>토론 창</span>';
      b.setAttribute('aria-label', '실시간 토론 창 열기');
      b.addEventListener('click', function(){ if (FL.open) closeFloat(); else openFloat(); });
      document.body.appendChild(b);
    }
    var app = document.documentElement.getAttribute('data-app');
    var admin = $('admin'); var adminOn = admin && !admin.hidden;
    var layer = $('layer'), sheetOn = layer && layer.innerHTML !== '', ss = document.getElementById('ss-root'), stockOn = ss && ss.innerHTML !== '';
    b.hidden = !A.talkBtn || app === 'cm' || adminOn || sheetOn || stockOn || (FL.open && !WIDE.matches);
  }

  // ===================== 연결 =====================
  function applyEverywhere(){
    frames().forEach(function(f){ if (!kindOf(f)) return; styleFrame(f); });
  }
  function hookFrame(f){
    if (f.__bpHooked) return;
    var k = kindOf(f); if (!k) return;
    f.__bpHooked = true;
    function on(){
      styleFrame(f);
      var d; try { d = f.contentDocument; } catch (e) { return; }
      if (!d || !d.body) return;
      if (k === 'tools') { var tries = 0; (function p(){ patchTools(f); try { if (!f.contentWindow.__bpTools && tries++ < 50) setTimeout(p, 100); } catch (e) {} })(); }
      if (!d.__bpObs) {
        d.__bpObs = true; var t = null;
        new f.contentWindow.MutationObserver(function(){ if (t) return; t = setTimeout(function(){ t = null; styleFrame(f); flashScan(f); }, 60); }).observe(d.body, { childList: true, subtree: true, characterData: true });
        flashScan(f);
      }
    }
    f.addEventListener('load', function(){ setTimeout(on, 30); });
    on();
  }
  function scan(){ frames().forEach(hookFrame); injectAdv(); drawFab(); }

  function start(){
    var notice = $('notice');
    if (notice && !$('bp-top')) { var t = document.createElement('div'); t.id = 'bp-top'; t.hidden = true; t.setAttribute('role', 'region'); t.setAttribute('aria-label', '많이 리딩된 종목');
      notice.parentNode.insertBefore(t, notice.nextSibling);
      t.addEventListener('mouseenter', function(){ t.__hover = true; }); t.addEventListener('mouseleave', function(){ t.__hover = false; });
      t.addEventListener('focusin', function(){ t.__hover = true; }); t.addEventListener('focusout', function(){ t.__hover = false; });
      t.addEventListener('click', function(e){
        var b = e.target.closest('[data-bp-top]'); if (!b) return;
        if (b.getAttribute('data-bp-top') === 'more') { TOP.open = !TOP.open; drawTop(); var m = t.querySelector('.bp-tm'); if (m) m.focus(); return; }
        var code = b.getAttribute('data-code'), name = b.getAttribute('data-name');
        if (/^\d{6}$/.test(code) && window.openStock) window.openStock(code, name);
        else { var sh = window.__shell; if (sh && sh.show) sh.show('ln', 'home'); }
      });
    }
    new MutationObserver(function(){ scan(); }).observe(document.body, { childList: true, subtree: true });
    new MutationObserver(function(){ drawTop(); drawFab(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-app'] });
    window.addEventListener('hashchange', drawTop);
    window.addEventListener('popstate', drawTop);
    window.addEventListener('resize', function(){ if (FL.open) placeFloat(); });
    if (WIDE.addEventListener) WIDE.addEventListener('change', function(){ if (FL.open) placeFloat(); drawFab(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && FL.open && !$('layer').innerHTML && floatMode() === 'sheet') closeFloat(); });
    // 리딩 모음 자료가 들어오면 띠를 채워요 (live-data.js가 window.__lnLive 를 만들어요)
    var n = 0; (function wait(){ var L = window.__lnLive; if (L && L.ready) { refreshTop(); setInterval(refreshTop, 5 * 60 * 1000); } else if (n++ < 150) setTimeout(wait, 200); else topFromMentions(); })();
    scan();
  }
  window.__benchPlusApi = { refreshTop: refreshTop, openTalk: openFloat, closeTalk: closeFloat }; // 점검용
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
