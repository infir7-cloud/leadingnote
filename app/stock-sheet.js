/* 리딩노트 · 종목 바로가기 창 (네이버 증권 · 최근 뉴스 한 줄 · 최근 공시 3건)
   index.html(맨 바깥 셸)에 <script src="stock-sheet.js"></script> 한 줄만 넣으면 동작해요.
- 투자 도구 '종목 진단'과 리딩 모음 '시세 조회' 화면의 종목명을 자동으로 누를 수 있게 바꿔요.
- 뉴스·공시는 Supabase 표(news, disclosures)에서 읽어요. 표가 아직 없으면 "준비 중"으로 보여요.
- 네이버 증권은 다른 사이트 안(iframe)에서 열리지 않게 막혀 있어서 새 창으로 열어요. */
(function(){
  if (window.__stockSheet) return; window.__stockSheet = true;

  // ---- 서버 정보 (React 앱이 넣어 둔 window.__SB 또는 config.js 의 SB_CFG)
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
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function z(n){ return (n < 10 ? '0' : '') + n; }
  function whenK(iso){ var d = new Date(iso), n = new Date(); if (isNaN(d)) return ''; return d.toDateString() === n.toDateString() ? '오늘 ' + z(d.getHours()) + ':' + z(d.getMinutes()) : (d.getMonth() + 1) + '월 ' + d.getDate() + '일'; }
  function dK(s){ var p = String(s || '').slice(0, 10).split('-'); return p.length < 3 ? '' : (+p[1]) + '월 ' + (+p[2]) + '일'; }

  function rest(path){
    var c = cfg(); if (!c || !c.key) return Promise.resolve({ off: true });
    var h = { apikey: c.key }; if (/^eyJ/.test(c.key)) h.Authorization = 'Bearer ' + c.key;
    return fetch(c.url + '/rest/v1/' + path, { headers: h }).then(function(r){
      if (!r.ok) return { err: r.status };
      return r.json().then(function(d){ return { data: d }; });
    }, function(){ return { err: 'net' }; });
  }

  // ---- 창 모양 (셸 색 변수를 그대로 써요)
  var css = document.createElement('style');
  css.textContent =
    '.ss-scrim{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center}' +
    '.ss-sheet{width:100%;max-width:520px;max-height:90%;overflow:auto;background:var(--surface,#11171E);color:var(--ink,#EEF2F5);border-radius:1.1rem 1.1rem 0 0;padding:1.1rem 16px calc(1.25rem + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:1rem;font-family:inherit;box-sizing:border-box}' +
    '.ss-sheet *{box-sizing:border-box}' +
    '.ss-h{display:flex;align-items:flex-start;justify-content:space-between;gap:.5rem}' +
    '.ss-h h2{margin:0;font-size:1.25rem;line-height:1.3}' +
    '.ss-code{margin:.15rem 0 0;font-size:.875rem;color:var(--ink2,#8D99A6);font-family:var(--f-mono,monospace)}' +
    '.ss-x{flex:none;width:2.75rem;height:2.75rem;border:0;background:transparent;color:var(--ink2,#8D99A6);font-size:1.5rem;border-radius:.5rem;cursor:pointer}' +
    '.ss-main{display:flex;align-items:center;justify-content:center;min-height:3.25rem;border-radius:.75rem;background:var(--accent,#C6F25E);color:var(--on-accent,#0B0F14);font-weight:700;font-size:1.0625rem;text-decoration:none;padding:0 1rem;text-align:center}' +
    '.ss-sec{display:flex;flex-direction:column;gap:.5rem}' +
    '.ss-label{margin:0;font-size:.9375rem;font-weight:600;color:var(--ink2,#8D99A6)}' +
    '.ss-item{display:flex;flex-direction:column;gap:.15rem;padding:.8rem .9rem;border:1px solid var(--line,#222B35);border-radius:.75rem;background:var(--raise,#161D25);color:var(--ink,#EEF2F5);text-decoration:none;min-width:0}' +
    '.ss-item .t{font-weight:600;font-size:1.0625rem;line-height:1.45}' +
    '.ss-news .t{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.ss-dis .t{font-size:.9375rem;overflow-wrap:anywhere}' +
    '.ss-item .m{font-size:.8125rem;color:var(--ink2,#8D99A6)}' +
    '.ss-more{align-self:flex-start;color:var(--ink2,#8D99A6);font-size:.9375rem;padding:.35rem 0;text-decoration:underline;text-underline-offset:3px}' +
    '.ss-hint{margin:0;font-size:.875rem;color:var(--ink2,#8D99A6);line-height:1.5}' +
    '.ss-label .m{font-weight:400;font-size:.8125rem;margin-left:.35rem}' +
    '.ss-wbox{padding:.85rem .95rem;border-radius:.75rem;background:var(--acc-soft,rgba(198,242,94,.12));display:flex;flex-direction:column;gap:.35rem}' +
    '.ss-wl{margin:0;font-weight:700;font-size:1.0625rem;line-height:1.5}' +
    '.ss-wb{margin:0;font-size:.9375rem;line-height:1.6}';
  document.head.appendChild(css);

  // ---- 지금 가격 넣어 보기 (11/20)
  //  네이버 차트 그림을 우리 화면에 직접 불러오던 것을 없앴어요(이용 허락이 없는 그림이라서요).
  //  대신 회원이 네이버에서 본 지금 가격을 넣으면 산 가격(또는 방송 매수가) 대비 수익률을 바로 계산해요. 넣은 값은 저장하지 않아요.
  function numS(v){ v = +String(v == null ? '' : v).replace(/[^\d]/g, ''); return v > 0 ? v : 0; }
  function fmtW(n){ return n ? Math.round(n).toLocaleString('ko-KR') : ''; }
  function quick(code, name, buy, target, noLink){
    code = String(code || '').replace(/\D/g, '').slice(0, 6); if (code.length !== 6) return '';
    buy = numS(buy); target = numS(target);
    return '<div class="qc" data-qc-code="' + code + '" data-qc-tg="' + (target || '') + '">' +
      '<p class="qc-t">지금 가격 넣어 보기</p>' +
      '<div class="qc-2"><label><span>' + (buy ? '방송 매수가' : '산 가격') + '</span><input class="qc-b" inputmode="numeric" autocomplete="off" value="' + fmtW(buy) + '" placeholder="예: 41,000"></label>' +
      '<label><span>지금 가격</span><input class="qc-n" inputmode="numeric" autocomplete="off" placeholder="네이버에서 확인"></label></div>' +
      '<p class="qc-o" aria-live="polite">지금 가격을 넣으면 수익률을 바로 계산해 드려요.</p>' +
      (noLink ? '' : '<a class="nv-out" href="https://m.stock.naver.com/domestic/stock/' + code + '/total" target="_blank" rel="noopener noreferrer">네이버 증권에서 ' + esc(name || code) + ' 지금 가격·차트 보기 ↗</a>') +
      '<p class="qc-h">넣은 가격은 저장하지 않아요. 수수료·세금을 빼기 전 계산이에요.</p></div>';
  }
  function qcRun(box){
    var bi = box.querySelector('.qc-b'), ni = box.querySelector('.qc-n'), o = box.querySelector('.qc-o'); if (!bi || !ni || !o) return;
    var b = numS(bi.value), n = numS(ni.value), tg = numS(box.getAttribute('data-qc-tg'));
    if (!b || !n) { o.textContent = '지금 가격을 넣으면 수익률을 바로 계산해 드려요.'; return; }
    var r = (n / b - 1) * 100, cl = r > 0 ? 'up' : r < 0 ? 'dn' : '';
    o.innerHTML = '<b class="' + cl + '">' + (r > 0 ? '+' : r < 0 ? '−' : '') + Math.abs(r).toFixed(2) + '%</b> ' + (((box.querySelector('.qc-2 label span') || {}).textContent) || '산 가격') + ' 대비' +
      (tg ? (n >= tg ? ' · 목표가 ' + fmtW(tg) + '원에 닿은 가격이에요' : ' · 목표가 ' + fmtW(tg) + '원까지 ' + ((tg / n - 1) * 100).toFixed(1) + '% 남았어요') : '');
  }
  function nvChart(code, name){ return quick(code, name); }   // 예전 이름으로 부르는 곳을 위해 남겨 둬요
  // 문서마다 한 번: 입력할 때마다 계산
  function nvWire(d){
    if (!d || d.__nvWired) return; d.__nvWired = true;
    d.addEventListener('input', function(e){
      var t = e.target; if (!t || !t.classList || !(t.classList.contains('qc-b') || t.classList.contains('qc-n'))) return;
      var v = numS(t.value), f = v ? v.toLocaleString('ko-KR') : ''; if (t.value !== f) t.value = f;
      var box = t.closest && t.closest('.qc'); if (box) qcRun(box);
    }, true);
  }
  var NV_CSS = '.nv-out{display:flex;align-items:center;justify-content:center;text-align:center;min-height:3.25rem;padding:.6rem 1rem;border-radius:.75rem;border:1px solid var(--line,#222B35);background:var(--raise,#161D25);color:var(--ink,#EEF2F5);font-weight:600;text-decoration:none;line-height:1.45}' +
    '.qc{display:flex;flex-direction:column;gap:.55rem;padding:.9rem;border-radius:.85rem;border:1px solid var(--line,#222B35);background:var(--surface,#11171E)}' +
    '.qc-t{margin:0;font-weight:800;font-size:1rem}.qc-2{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}' +
    '.qc-2 label{display:flex;flex-direction:column;gap:.3rem;font-size:.8125rem;font-weight:700;color:var(--ink2,#8D99A6);min-width:0}' +
    '.qc-2 input{width:100%;box-sizing:border-box;min-height:48px;padding:0 .75rem;border:1px solid var(--line,#222B35);border-radius:.65rem;background:var(--raise,#161D25);color:var(--ink,#EEF2F5);font:inherit;font-size:1.0625rem;font-variant-numeric:tabular-nums}' +
    '.qc-o{margin:0;font-size:.9375rem;line-height:1.5}.qc-o b{font-size:1.125rem;font-variant-numeric:tabular-nums}.qc-o b.up{color:var(--up,#F04452)}.qc-o b.dn{color:var(--down,#3182F6)}' +
    '.qc-h{margin:0;font-size:.75rem;color:var(--ink2,#8D99A6)}';
  window.__lnQuick = quick;
  window.__nvChart = nvChart;
  css.textContent += NV_CSS;

  var cur = null, root = null;
  function link(href, cls, inner, label){ return '<a class="' + cls + '" href="' + esc(href) + '" target="_blank" rel="noopener noreferrer"' + (label ? ' aria-label="' + esc(label) + '"' : '') + '>' + inner + '</a>'; }
  // "왜 움직였을까요?" — 서버가 만든 한 줄 요약(ai_notes, key=종목코드)이 있을 때만 보여요. 출처 기사와 만든 시각을 함께 붙여요.
  function ago(iso){ var t = Date.parse(iso); if (isNaN(t)) return ''; var m = Math.round((Date.now() - t) / 60000); return m < 1 ? '방금' : m < 60 ? m + '분 전' : m < 1440 ? Math.round(m / 60) + '시간 전' : Math.round(m / 1440) + '일 전'; }
  function whyHTML(s){
    var w = s.why; if (!w || !(w.line || w.body)) return '';
    var f = w.facts || {}, src = Array.isArray(f.sources) ? f.sources : Array.isArray(f.links) ? f.links : [];
    src = src.filter(function(x){ return x && (x.url || x.link); }).map(function(x){ return { title: x.title || x.url || x.link, link: x.url || x.link, press: x.press || '' }; });
    if (!src.length) src = (s.whyNews || []).slice(0, 2);
    return '<div class="ss-sec ss-why"><p class="ss-label">왜 움직였을까요? <span class="m">' + ago(w.made_at) + '</span></p>' +
      '<div class="ss-wbox">' + (w.line ? '<p class="ss-wl">' + esc(w.line) + '</p>' : '') + (w.body ? '<p class="ss-wb">' + esc(w.body) + '</p>' : '') + '</div>' +
      (src.length ? '<p class="ss-label" style="font-size:.8125rem">참고한 기사</p>' + src.slice(0, 3).map(function(n){ return link(n.link, 'ss-item ss-news', '<span class="t">' + esc(n.title) + '</span><span class="m">' + esc(n.press || '') + (n.pub_at ? ' · ' + whenK(n.pub_at) : '') + ' ↗</span>'); }).join('') : '') +
      '<p class="ss-hint">AI가 기사를 모아 정리한 내용이에요. 틀릴 수 있고, 투자 권유가 아니에요.</p></div>';
  }
  function draw(){
    if (!cur) return;
    var s = cur, nv = 'https://m.stock.naver.com/domestic/stock/' + s.code;
    var news = s.news === null ? '<p class="ss-hint">불러오는 중…</p>'
      : s.ready === false ? '<p class="ss-hint">뉴스·공시 모으기를 준비 중이에요. 아래 링크로 네이버 증권 뉴스를 볼 수 있어요.</p>'
      : s.news.length ? link(s.news[0].link, 'ss-item ss-news', '<span class="t">' + esc(s.news[0].title) + '</span><span class="m">' + esc(s.news[0].press) + ' · ' + whenK(s.news[0].pub_at) + ' ↗</span>', s.news[0].title + ', ' + s.news[0].press + ' 기사 새 창으로 열기')
      : '<p class="ss-hint">최근 2주 사이 모은 헤드라인이 없어요.</p>';
    var dis = s.ready === false ? '' : '<div class="ss-sec"><p class="ss-label">최근 공시</p>' + (s.dis === null ? '<p class="ss-hint">불러오는 중…</p>'
      : s.dis.length ? s.dis.map(function(d){ return link('https://dart.fss.or.kr/dsaf001/main.do?rcpNo=' + encodeURIComponent(d.rcept_no), 'ss-item ss-dis', '<span class="t">' + esc(d.report_nm) + '</span><span class="m">' + dK(d.rcept_dt) + ' ↗</span>'); }).join('')
      : '<p class="ss-hint">최근 공시가 없어요.</p>') + '</div>';
    root.innerHTML = '<div class="ss-scrim" data-ss-close><div class="ss-sheet" role="dialog" aria-modal="true" aria-labelledby="ss-title">' +
      '<div class="ss-h"><div><h2 id="ss-title">' + esc(s.name) + '</h2><p class="ss-code">' + s.code + '</p></div><button class="ss-x" data-ss-close aria-label="닫기">×</button></div>' +
      link(nv + '/total', 'ss-main', '네이버 증권에서 차트·지금 가격 보기 ↗') +
      quick(s.code, s.name, 0, 0, true) +
      whyHTML(s) +
      '<div class="ss-sec"><p class="ss-label">최근 뉴스</p>' + news + link(nv + '/news', 'ss-more', '이 종목 뉴스 더 보기 (네이버 증권) ↗') + '</div>' + dis +
      '<p class="ss-hint">새 창으로 열려요. 다 보신 뒤 그 창을 닫으면 이 화면으로 돌아와요.</p></div></div>';
    if (!s.focused) { s.focused = true; var x = root.querySelector('.ss-x'); if (x) x.focus(); }
  }
  function open(code, name){
    code = String(code || '').replace(/\D/g, '').slice(0, 6); if (code.length !== 6) return;
    if (!root) { root = document.createElement('div'); root.id = 'ss-root'; document.body.appendChild(root); }
    cur = { code: code, name: String(name || code).slice(0, 40), news: null, dis: null, ready: null, back: document.activeElement };
    draw();
    var me = cur;
    Promise.all([
      rest('news?select=title,link,press,pub_at&codes=cs.%7B' + code + '%7D&order=pub_at.desc&limit=1'),
      rest('disclosures?select=rcept_no,report_nm,rcept_dt&stock_code=eq.' + code + '&order=rcept_dt.desc,rcept_no.desc&limit=3'),
      rest('ai_notes?select=kind,line,body,facts,made_at&key=eq.' + code + '&order=made_at.desc&limit=1'),
      rest('news?select=title,link,press,pub_at&codes=cs.%7B' + code + '%7D&order=pub_at.desc&limit=3')
    ]).then(function(rs){
      if (cur === me) { me.why = rs[2] && rs[2].data && rs[2].data[0] || null; me.whyNews = rs[3] && rs[3].data || []; }
      if (cur !== me) return;
      if (rs[0].off || rs[0].err || rs[1].err) { me.ready = false; me.news = []; me.dis = []; }
      else { me.ready = true; me.news = rs[0].data || []; me.dis = rs[1].data || []; }
      draw();
    });
  }
  function close(){ var b = cur && cur.back; cur = null; if (root) root.innerHTML = ''; try { if (b && b.focus) b.focus(); } catch (e) {} }
  document.addEventListener('click', function(e){
    var t = e.target.closest && e.target.closest('[data-ss-close]'); if (!t) return;
    if (t.classList.contains('ss-scrim') && e.target !== t) return; close();
  });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && cur) { e.stopPropagation(); close(); } }, true);
  window.openStock = open;
  nvWire(document);

  // ---- (11/24) 네이버 증권 종목 링크는 바로 나가지 않고 먼저 이 창을 열어요
  //  창 안의 '네이버 증권에서 차트 보기'만 새 창으로 열려서, 다 보고 그 창을 닫으면 리딩노트 화면 그대로예요.
  //  Ctrl·Cmd 를 누르고 누르면(PC 새 탭) 예전처럼 바로 열려요. 창 안 링크(.ss-sheet)는 건드리지 않아요.
  var NV_RE = /^https?:\/\/(?:m\.stock\.naver\.com\/domestic\/stock\/(\d{6})|finance\.naver\.com\/item\/[a-z]+\.naver\?(?:[^#]*&)?code=(\d{6}))/i;
  function nameOf(code){
    var fs = document.querySelectorAll('iframe');
    for (var i = 0; i < fs.length; i++) {
      try { var w = fs[i].contentWindow, n = (w.STOCKS && w.STOCKS[code] && w.STOCKS[code].name) || (w.BYC && w.BYC[code] && w.BYC[code].n) || (w.PX && w.PX.byCode && w.PX.byCode[code] && w.PX.byCode[code].n); if (n && n !== code) return n; } catch (e) {}
    }
    return code;
  }
  function nvCatch(e){
    if (e.defaultPrevented || e.button > 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest && e.target.closest('a[href]'); if (!a || a.closest('.ss-sheet')) return;
    var m = NV_RE.exec(a.href || ''); if (!m) return;
    e.preventDefault(); e.stopPropagation();
    var code = m[1] || m[2]; open(code, a.getAttribute('data-ss-name') || nameOf(code));
  }
  document.addEventListener('click', nvCatch, true);

  // ---- 각 서비스 화면의 종목명을 누를 수 있게 (화면 코드는 고치지 않고 바깥에서 붙여요)
  var CHILD_CSS = 'button.ss-link{all:unset;cursor:pointer;color:inherit;font:inherit;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:5px;text-decoration-color:var(--accent,#C6F25E)}button.ss-link span{font-size:.8em;color:var(--accent,#C6F25E)}' +
    '.ss-go{display:flex;align-items:center;justify-content:center;gap:.35rem;width:100%;min-height:3.25rem;border-radius:.75rem;border:1px solid var(--accent,#C6F25E);background:transparent;color:var(--ink,#EEF2F5);font:inherit;font-weight:700;font-size:1rem;margin-top:.75rem;cursor:pointer}';
  function where(f){
    var w = f.contentWindow, src = (f.getAttribute('src') || '') + ' ' + (f.title || '');
    try {
      if (/tools|투자 도구|^도구/.test(src) && w.S && w.S.view === 'stock' && w.S.stock) {
        var o = w.BYC && w.BYC[w.S.stock]; return { code: w.S.stock, name: o ? o.n : w.S.stock };
      }
      if (/(^|\/)ln(\.html)?([?#]|$)|리딩 모음|^정보/.test(src) && w.S && w.S.stack && w.S.stack.length) {
        var v = w.S.stack[w.S.stack.length - 1]; if (v && v.t === 'q' && w.PX && w.PX.byCode && w.PX.byCode[v.id]) return { code: v.id, name: w.PX.byCode[v.id].n };
        if (v && v.t === 'stock' && /^\d{6}$/.test(v.id)) { var so = w.STOCKS && w.STOCKS[v.id]; return { code: v.id, name: so && so.name ? so.name : v.id, chart: true }; }
      }
    } catch (e) {}
    return null;
  }
  function decorate(f){
    var c = where(f); if (!c) return;
    var d = f.contentDocument; if (!d) return;
    var h1 = d.querySelector('.top-title');
    if (h1 && !h1.querySelector('.ss-link')) h1.innerHTML = '<button class="ss-link" data-ss-code="' + c.code + '" data-ss-name="' + esc(c.name) + '">' + esc(c.name) + ' <span aria-hidden="true">↗</span></button>';
    var head = d.querySelector('.shead');
    if (head && !head.querySelector('.ss-go')) head.insertAdjacentHTML('beforeend', '<button class="ss-go" data-ss-code="' + c.code + '" data-ss-name="' + esc(c.name) + '">네이버 증권 · 뉴스 · 공시 보기 ↗</button>');
    // 리딩 모음 '방송 종목' 화면: 지금 가격 넣어 보기 + 네이버 바로가기를 붙여요
    if (c.chart && head && !d.querySelector('.qc[data-qc-code="' + c.code + '"]')) head.insertAdjacentHTML('afterend', '<section class="screen gx nv-wrap" style="padding-top:.75rem;padding-bottom:0">' + quick(c.code, c.name) + '</section>');
  }
  function hook(f){
    try {
      var d = f.contentDocument; if (!d || !d.body || d.__ssHooked) return; d.__ssHooked = true;
      var st = d.createElement('style'); st.textContent = CHILD_CSS + NV_CSS; d.head.appendChild(st); nvWire(d);
      d.addEventListener('click', function(e){ var b = e.target.closest && e.target.closest('[data-ss-code]'); if (!b) { nvCatch(e); return; } e.preventDefault(); e.stopPropagation(); open(b.getAttribute('data-ss-code'), b.getAttribute('data-ss-name')); }, true);
      var t = null; new f.contentWindow.MutationObserver(function(){ if (t) return; t = setTimeout(function(){ t = null; decorate(f); }, 30); }).observe(d.body, { childList: true, subtree: true });
      decorate(f);
    } catch (e) {}
  }
  function scan(){ Array.prototype.forEach.call(document.querySelectorAll('iframe'), function(f){ if (!f.__ssLoad) { f.__ssLoad = true; f.addEventListener('load', function(){ hook(f); }); } hook(f); }); }
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
})();
