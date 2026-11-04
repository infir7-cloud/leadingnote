/* 리딩노트 · 오늘의 재료 뉴스 (ln-theme.js가 불러와요. index.html은 고칠 필요 없어요)
   - 리딩 모음 홈 '오늘의 5줄' 바로 아래에 재료 뉴스 4건 + '전체 보기'
   - 전체 화면(#ln/news): 특징주 · 공시 · 시황 · 이번주 칩으로 골라 보기
   - 데이터: Supabase material_news (평일 예약 작업이 골라 저장 · 가장 최근 날짜만 보여줘요)
   - 종목명 → 네이버증권 · '종목 보기' → 리딩노트 종목 화면(지수는 네이버), # 테마 → 네이버 '관련주' 검색, 기사 원문 → 언론사
   - 사라·팔라는 말은 쓰지 않아요. 요약은 기사 내용을 짧게 옮긴 것이에요. */
(function(){
  if (window.__lnNewsOn) return; window.__lnNewsOn = true;
  var N = window.__lnNews = { rows: null, day: '', kind: '전체', err: null, at: 0 };
  var KINDS = ['전체', '특징주', '공시', '시황', '이번주'];
  var HOME_N = 4;
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(c){ c = Number(c); return (c > 0 ? '+' : c < 0 ? '−' : '') + Math.abs(c).toFixed(2) + '%'; }
  function dayLbl(d){ var p = String(d || '').split('-'); if (p.length !== 3) return ''; var w = '일월화수목금토'.charAt(new Date(+p[0], +p[1] - 1, +p[2]).getDay()); return (+p[1]) + '.' + (+p[2]) + ' (' + w + ')'; }
  function search(q){ return 'https://m.search.naver.com/search.naver?query=' + encodeURIComponent(q); }
  function stockUrl(s){
    if (s.idx) return 'https://m.stock.naver.com/domestic/index/' + encodeURIComponent(s.idx) + '/total';
    if (s.c) return 'https://m.stock.naver.com/domestic/stock/' + encodeURIComponent(s.c) + '/total';
    return search(s.n + ' 주가');
  }
  var IC = {
    chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    out: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>'
  };

  var CSS = [
    '.mn-sub{font-size:.8125rem;color:var(--ink2);margin:.1rem 0 .5rem}',
    '.mn-day{font-size:.75rem;font-weight:700;color:var(--ink2);background:var(--sunk);border-radius:.4rem;padding:.1rem .45rem;margin-left:.4rem}',
    '.mn-list{display:flex;flex-direction:column}',
    '.mn-it{display:flex;flex-direction:column;gap:.45rem;padding:.95rem 0;border-top:1px solid var(--line);min-width:0}',
    '.mn-list>.mn-it:first-child{border-top:0}',
    '.mn-hd{font-size:1.0625rem;font-weight:800;line-height:1.45;letter-spacing:-.02em;margin:0;color:var(--ink);word-break:keep-all}',
    '.mn-k{display:inline-block;vertical-align:.12em;font-size:.6875rem;font-weight:800;letter-spacing:.02em;color:var(--t2-acc-ink,var(--accent));background:var(--accent-soft,var(--sunk));border-radius:.3rem;padding:.12rem .4rem;margin-right:.35rem}',
    '.mn-st{display:flex;flex-wrap:wrap;align-items:center;gap:.25rem .5rem;font-size:.9375rem}',
    '.mn-st a,.mn-st span.nm{font-weight:700;color:var(--ink);text-decoration:underline;text-decoration-color:var(--line);text-decoration-thickness:2px;text-underline-offset:.25em}',
    '.mn-st span.nm{text-decoration:none}',
    '.mn-st .mn-dot{color:var(--sn)}',
    '.mn-c{font-size:.8125rem;font-weight:800;border-radius:.3rem;padding:.05rem .4rem;font-variant-numeric:tabular-nums}',
    '.mn-c.up{color:var(--up);background:var(--up-soft)}.mn-c.down{color:var(--down);background:var(--down-soft)}',
    '.mn-sm{font-size:.9375rem;color:var(--ink2);line-height:1.55;margin:0;word-break:keep-all}',
    '.mn-ft{display:flex;flex-wrap:wrap;align-items:center;gap:.4rem}',
    '.mn-src{font-size:.75rem;color:var(--sn);margin-right:.1rem}',
    '.mn-th{font-size:.75rem;font-weight:700;color:var(--ink2);text-decoration:none;border:1px dashed var(--line);border-radius:999px;padding:.15rem .55rem}',
    '.mn-th::before{content:"# ";color:var(--t2-acc-ink,var(--accent))}',
    '.mn-cta{display:flex;justify-content:flex-end;gap:.4rem}',
    '.mn-cta a{display:inline-flex;align-items:center;gap:.2rem;font-size:.8125rem;font-weight:700;text-decoration:none;border-radius:.45rem;padding:.3rem .65rem;white-space:nowrap}',
    '.mn-cta button{display:inline-flex;align-items:center;font:inherit;font-size:.8125rem;font-weight:700;border-radius:.45rem;padding:.3rem .65rem;white-space:nowrap;background:none;cursor:pointer}',
    '.mn-cta a svg{width:.85rem;height:.85rem;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
    '.mn-cta .s{color:#03A94D;border:1px solid #03A94D}',
    'html.lite .mn-cta .s{color:#018A3E;border-color:#018A3E}',
    '.mn-cta button.s,html.lite .mn-cta button.s{color:var(--t2-acc-ink,#5B4CF0);border:1px solid currentColor}',
    '.mn-cta .o{color:var(--ink2);border:1px solid var(--line)}',
    '.mn-all{display:flex;align-items:center;justify-content:space-between;width:100%;padding:.85rem 0 1rem;border:0;border-top:1px solid var(--line);background:none;color:var(--ink);font:inherit;font-weight:700;font-size:.9375rem;cursor:pointer}',
    '.mn-all svg{width:1.15rem;height:1.15rem;fill:none;stroke:var(--sn);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}',
    '.mn-chips{display:flex;gap:.4rem;overflow-x:auto;scrollbar-width:none;padding:.25rem 0 .75rem}',
    '.mn-chips::-webkit-scrollbar{display:none}',
    '.mn-chip{flex:none;font:inherit;font-size:.875rem;font-weight:700;color:var(--ink);background:var(--sunk);border:0;border-radius:999px;padding:.45rem .85rem;cursor:pointer}',
    '.mn-chip[aria-pressed="true"]{background:var(--accent);color:var(--on-accent)}',
    '.mn-disc{font-size:.75rem;color:var(--sn);padding:.6rem 0 .9rem;border-top:1px solid var(--line);line-height:1.5;margin:0}',
    '.mn-empty{font-size:.9375rem;color:var(--ink2);padding:.75rem 0 1rem}',
    '.mn-old{margin:0 0 .5rem;padding:.5rem .75rem;border-radius:12px;background:var(--t2-ys,#FFF4DB);color:var(--warn,#B25E00);font-size:.875rem;font-weight:700}'
  ].join('\n');

  // ── 데이터
  function client(){ try { return window.__lnAuth && window.__lnAuth.sb; } catch (e) { return null; } }
  function cfg(){ var w = window; for (var i = 0; i < 6; i++) { try { if (w.__SB && w.__SB.projectId) return w.__SB; } catch (e) {} if (w === w.parent) break; try { w = w.parent; } catch (e) { break; } } return null; }
  function take(rows){
    rows = rows || [];
    var day = rows.length ? rows[0].d : '';
    N.rows = rows.filter(function(r){ return r.d === day; }).sort(function(a, b){ return (a.ord || 0) - (b.ord || 0); });
    N.day = day; N.err = null; N.at = Date.now(); redraw();
  }
  var COLS = 'd,slot,kind,headline,summary,stocks,chg,themes,press,url,ord';
  function load(){
    var c = client();
    if (c) {
      return Promise.resolve(c.from('material_news').select(COLS).order('d', { ascending: false }).order('ord', { ascending: true }).limit(80))
        .then(function(r){ if (r.error) throw r.error; take(r.data); })
        .catch(function(e){ N.err = String(e && e.message || e); redraw(); });
    }
    var k = cfg(); if (!k) { N.err = 'no-config'; return Promise.resolve(); }
    return fetch('https://' + k.projectId + '.supabase.co/rest/v1/material_news?select=' + COLS + '&order=d.desc,ord.asc&limit=80', { headers: { apikey: k.anonKey, Authorization: 'Bearer ' + k.anonKey } })
      .then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(take).catch(function(e){ N.err = String(e && e.message || e); redraw(); });
  }

  // ── 그리기
  function W(){ var out = null; Array.prototype.forEach.call(document.querySelectorAll('iframe'), function(f){ try { if (/ln\.html/.test(f.contentDocument.URL)) out = f.contentWindow; } catch (e) {} }); return out; }
  function redraw(){ var w = W(); try { if (w && w.__mn) { var v = w.view(); if ((v && v.t === 'mnews') || (!v && w.S.tab === 'home')) w.render(); } } catch (e) {} }

  function item(r){
    var st = Array.isArray(r.stocks) ? r.stocks : [];
    var names = st.map(function(s){ var u = stockUrl(s); return '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(s.n) + '</a>'; }).join('<span class="mn-dot">·</span>');
    var chg = r.chg != null && r.chg !== '' ? '<span class="mn-c ' + (Number(r.chg) >= 0 ? 'up' : 'down') + '">' + fmt(r.chg) + '</span>' : '';
    var th = (r.themes || []).map(function(t){ return '<a class="mn-th" href="' + esc(search(t + ' 관련주')) + '" target="_blank" rel="noopener noreferrer">' + esc(t) + '</a>'; }).join('');
    var main = st[0];
    var cta = (main ? (main.c && !main.idx ? '<button type="button" class="s" data-a="mnStock" data-v="' + esc(main.c) + '|' + esc(main.n || '') + '">종목 보기</button>'
        : '<a class="s" href="' + esc(stockUrl(main)) + '" target="_blank" rel="noopener noreferrer">' + (main.idx ? '지수 보기' : '종목 보기') + '</a>') : '') +
      '<a class="o" href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">기사 원문' + IC.out + '</a>';
    return '<article class="mn-it">' +
      '<h3 class="mn-hd"><span class="mn-k">' + esc(r.kind) + '</span>' + esc(r.headline) + '</h3>' +
      (names || chg ? '<div class="mn-st">' + names + chg + '</div>' : '') +
      (r.summary ? '<p class="mn-sm">' + esc(r.summary) + '</p>' : '') +
      '<div class="mn-ft"><span class="mn-src">' + esc(r.press) + '</span>' + th + '</div>' +
      '<div class="mn-cta">' + cta + '</div></article>';
  }
  var DISC = '<p class="mn-disc">개인투자자가 눈여겨볼 기사를 골라 짧게 옮겼어요. 등락률은 기사 작성 시점 기준이라 지금 시세와 다를 수 있어요. 사거나 팔라는 권유가 아니에요.</p>';

  // 오늘(한국 시간) 기사가 아직 없으면 '지난 기사'라고 분명히 알려요 (평일 09:47 · 15:47에 올라와요)
  function todayK(){ return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); }
  function staleNote(){
    if (!N.day || N.day >= todayK()) return '';
    var d = new Date(Date.now() + 9 * 3600e3), wd = d.getUTCDay(), hm = d.getUTCHours() * 60 + d.getUTCMinutes();
    var when = wd === 0 || wd === 6 ? '주말이라 마지막 평일 기사예요' : hm < 9 * 60 + 50 ? '오늘 기사는 오전 10시쯤 올라와요' : '오늘 기사를 정리하는 중이에요';
    return '<p class="mn-old">' + esc(dayLbl(N.day)) + ' 기사예요 · ' + when + '</p>';
  }
  function homeSec(){
    if (!N.rows || !N.rows.length) return '';
    var top = N.rows.filter(function(r){ return r.kind !== '시황'; }).slice(0, HOME_N);
    if (!top.length) top = N.rows.slice(0, HOME_N);
    return '<section class="t2-sec mn-home"><div class="t2-h" style="cursor:default">오늘의 재료 뉴스<span class="mn-day">' + esc(dayLbl(N.day)) + '</span></div>' +
      '<p class="mn-sub">개인투자자가 눈여겨볼 기사만 골랐어요</p>' + staleNote() +
      '<div class="mn-list">' + top.map(item).join('') + '</div>' +
      '<button class="mn-all" data-a="mnOpen"><span>재료 뉴스 전체 ' + N.rows.length + '건 보기</span>' + IC.chev + '</button></section>';
  }
  function screen(){
    if (!N.rows) return '<main class="t2"><section class="t2-sec"><p class="mn-empty">' + (N.err ? '재료 뉴스를 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.' : '재료 뉴스를 불러오는 중이에요…') + '</p></section></main>';
    if (!N.rows.length) return '<main class="t2"><section class="t2-sec"><p class="mn-empty">아직 올라온 재료 뉴스가 없어요. 평일 아침에 올라와요.</p></section></main>';
    var list = N.kind === '전체' ? N.rows : N.rows.filter(function(r){ return r.kind === N.kind; });
    var chips = KINDS.map(function(k){ var n = k === '전체' ? N.rows.length : N.rows.filter(function(r){ return r.kind === k; }).length; if (!n) return '';
      return '<button class="mn-chip" data-a="mnKind" data-v="' + k + '" aria-pressed="' + (k === N.kind) + '">' + k + ' ' + n + '</button>'; }).join('');
    return '<main class="t2"><section class="t2-sec"><div class="t2-h" style="cursor:default">' + esc(dayLbl(N.day)) + ' 재료 뉴스</div>' +
      '<p class="mn-sub">종목 이름을 누르면 네이버증권, # 테마를 누르면 관련주 검색으로 가요</p>' + staleNote() +
      '<div class="mn-chips" role="group" aria-label="분류">' + chips + '</div>' +
      '<div class="mn-list">' + (list.length ? list.map(item).join('') : '<p class="mn-empty">이 분류의 기사가 없어요.</p>') + '</div>' + DISC + '</section></main>';
  }

  // ── 리딩 모음에 붙이기 (ln-plus.js가 먼저 붙은 뒤에 감싸요 · 8초 지나면 그냥 붙여요)
  function patch(w, d, force){
    if (w.__mn || !w.A || !w.S || !w.screenHome || !w.screenExperts) return;
    if (!w.__p && !force) return;
    w.__mn = true;
    var st = d.createElement('style'); st.id = 'mn-css'; st.textContent = CSS; d.head.appendChild(st);
    try { w.VIEW_TITLE.mnews = '오늘의 재료 뉴스'; } catch (e) {}
    var oHome = w.screenHome;
    w.screenHome = function(){
      var h = oHome.apply(this, arguments), sec = homeSec(); if (!sec) return h;
      var b = h.indexOf('class="p-5l"'), e = b > -1 ? h.indexOf('</section>', b) : -1;
      if (e > -1) return h.slice(0, e + 10) + sec + h.slice(e + 10);
      var n = h.indexOf('</nav>'); if (n > -1) return h.slice(0, n + 6) + sec + h.slice(n + 6);
      var m = h.indexOf('>', h.indexOf('<main')); return m > -1 ? h.slice(0, m + 1) + sec + h.slice(m + 1) : sec + h;
    };
    var oXs = w.screenExperts;
    w.screenExperts = function(){ var v = w.view(); if (v && v.t === 'mnews') return screen(); return oXs.apply(this, arguments); };
    var top0 = function(){ try { w.scrollTo(0, 0); } catch (e) {} };
    w.A.mnOpen = function(){ w.pushView('mnews', ''); w.render(); top0(); if (Date.now() - N.at > 5 * 60e3) load(); };
    w.A.mnStock = function(v){ var p = String(v || '').split('|'), c = p[0]; if (!/^[0-9A-Z]{6}$/.test(c)) return;
      try { var H = window.__lnHome; if (H) { H.names = H.names || {}; H.names[c] = p.slice(1).join('|'); } } catch (e) {}
      w.A.stock(c); top0(); };
    w.A.mnKind = function(v){ N.kind = v || '전체'; w.render(); };
    var ogo = w.__site && w.__site.go;
    if (ogo) w.__site.go = function(r){ if (r === 'news') { w.S.stack = [{ t: 'mnews', id: '' }]; w.S.sheet = null; w.S.tab = 'home'; w.render(); top0(); return; } return ogo.apply(this, arguments); };
    try { w.render(); } catch (e) {}
  }
  var t0 = Date.now();
  function scan(){
    var force = Date.now() - t0 > 8000;
    Array.prototype.forEach.call(document.querySelectorAll('iframe'), function(f){
      if (!f.__mnLoad) { f.__mnLoad = true; f.addEventListener('load', function(){ var n = 0, iv = setInterval(function(){ n++; scan(); var ok = false; try { ok = !!(f.contentWindow && f.contentWindow.__mn); } catch (e) { ok = true; } if (n > 100 || ok) clearInterval(iv); }, 200); }); }
      var w, d; try { w = f.contentWindow; d = f.contentDocument; } catch (e) { return; }
      if (w && d && d.head && /ln\.html/.test(d.URL || '')) patch(w, d, force);
    });
  }
  var tick = setInterval(function(){ scan(); var w = W(); if (w && w.__mn) clearInterval(tick); }, 200);
  setTimeout(function(){ clearInterval(tick); }, 60000);
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  // 처음 한 번 + 10분마다 새로 받아요 (아침 · 장마감 갱신 반영)
  function boot(){ if (client() || cfg()) load(); else setTimeout(boot, 500); }
  boot(); setInterval(load, 10 * 60e3);
  // 휴대폰에서 화면을 다시 켰을 때 예전 기사가 남아 있지 않게 바로 새로 읽어요
  function again(){ if (document.visibilityState === 'hidden') return; if (Date.now() - N.at > 2 * 60e3 || (N.day && N.day < todayK())) load(); }
  document.addEventListener('visibilitychange', again); window.addEventListener('focus', again); window.addEventListener('pageshow', again);
})();
