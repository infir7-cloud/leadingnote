/* 리딩노트 · 종목 피드 보강 + 홈 질문 띠 + 방송 같이 보기 안내 (ln-edge.js · 2026-11-21)
   ln-theme.js 가 이 파일을 자동으로 불러요. ln-home.js 처럼 정보(ln.html) 화면에 바깥에서 붙어요.
   ① 종목 이야기방 맨 위: 'AI 한 줄' 고정 (그 종목의 주요 이슈를 한 문장으로 · 핵심 단어만 굵게)
      - 순서: 예약 작업이 만든 한 줄(ln_stock_ai) → 그 종목의 최근 재료 뉴스 제목 → 방송에서 전문가가 한 말
      - 24시간 안의 새 이슈가 없으면 "최근 24시간 새 이슈 없음 · 마지막 이슈"로 보여 줘요. 아무것도 없으면 칸을 숨겨요.
   ② 이야기방 질문 버튼(뉴닉식): 누르면 입력칸 맨 앞에 'Q. 질문 → '이 붙고 이어서 쓰면 돼요.
      - 질문은 예약 작업이 종목마다 3~5개 만들어요(ln_stock_ai.questions). 없으면 기본 질문을 써요.
      - 질문마다 "n명이 답했어요"를 보여 주고, 'Q.'로 시작한 글은 말풍선에 질문 꼬리표를 달아요.
   ③ 홈 질문 띠: 'Q. 질문 → 답 한 줄'을 4.5초마다 천천히 돌려요(손을 대면 멈춰요). 답이 적으면 아직 답이 없는 질문으로 채워요.
   ④ 홈 방송 같이 보기 안내: 실시간 채팅이 열려 있으면(본방송 1시간 전 ~ 끝나고 1시간 뒤) 홈 맨 위에 입장 띠를 보여 줘요.
   사라·팔라는 말, 전망은 쓰지 않아요. 질문 문구도 매매 판단·방향 예측을 묻지 않아요. */
(function(){
  if (window.__lnEdge) return; window.__lnEdge = true;
  var E = window.__lnEdgeData = { ai: {}, news: {}, newsAsked: {}, live: null, loaded: false };

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function client(){ try { return window.__lnAuth && window.__lnAuth.sb; } catch (e) { return null; } }
  function q(p){ return Promise.resolve(p).then(function(r){ return r || {}; }, function(e){ return { error: e }; }); }
  function lnFrame(){ var out = null; Array.prototype.forEach.call(document.querySelectorAll('iframe'), function(f){ try { if (/(^|\/)ln(\.html)?([?#]|$)/.test(f.contentDocument.URL)) out = f; } catch (e) {} }); return out; }
  function lnWin(){ var f = lnFrame(); try { return f ? f.contentWindow : null; } catch (e) { return null; } }
  function redraw(){ var w = lnWin(); try { if (w && w.__ed && w.render) w.render(); } catch (e) {} }
  function hoursAgo(t){ var ms = Date.parse(t); return isNaN(ms) ? 1e9 : (Date.now() - ms) / 3600e3; }
  function hhmm(t){ var d = new Date(t); if (isNaN(d)) return ''; var k = new Date(d.getTime() + 9 * 3600e3); return (k.getUTCHours() < 10 ? '0' : '') + k.getUTCHours() + ':' + (k.getUTCMinutes() < 10 ? '0' : '') + k.getUTCMinutes(); }

  var CSS = [
    '.ed-pin{display:flex;gap:.6rem;align-items:flex-start;padding:.85rem .95rem;border-radius:1rem;background:var(--acc-soft,#EEF6FF);border:1px solid var(--line,#E5E8EB);margin:0 0 .25rem}',
    '.ed-pin .b{flex:none;font-size:.75rem;font-weight:800;padding:.2rem .5rem;border-radius:999px;background:var(--ink,#191F28);color:var(--surface,#fff);margin-top:.1rem}',
    '.ed-pin .t{flex:1;min-width:0;font-size:1rem;line-height:1.55;word-break:keep-all}',
    '.ed-pin .t b{font-weight:800;background:linear-gradient(transparent 60%,rgba(255,200,0,.35) 0)}',
    '.ed-pin .m{display:block;font-size:.75rem;color:var(--ink2,#6B7684);margin-top:.25rem}',
    '.ed-pin a{color:inherit;text-decoration:none}',
    '.ed-qs{display:flex;flex-direction:column;gap:.45rem;margin:.1rem 0 .2rem}',
    '.ed-qs .h{font-size:.875rem;font-weight:800;color:var(--ink2,#6B7684)}',
    '.ed-q{display:flex;align-items:center;gap:.5rem;width:100%;text-align:left;padding:.7rem .85rem;border-radius:.85rem;border:1px solid var(--line,#E5E8EB);background:var(--surface,#fff);font:inherit;font-size:1rem;font-weight:700;color:var(--ink,#191F28);cursor:pointer;min-height:3rem}',
    '.ed-q .qn{flex:none;font-weight:900;color:var(--accent,#3182F6)}',
    '.ed-q .qt{flex:1;min-width:0;word-break:keep-all}',
    '.ed-q .qc{display:block;font-size:.8125rem;font-weight:600;color:var(--ink2,#6B7684);margin-top:.15rem;border:0;background:none;padding:0}',
    '.ed-qtag{display:block;font-size:.8125rem;font-weight:800;color:var(--accent,#3182F6);margin-bottom:.2rem}',
    '.ed-band{position:relative;overflow:hidden;border-radius:1rem;border:1px solid var(--line,#E5E8EB);background:var(--surface,#fff);height:4.4rem;margin:.75rem 0 0}',
    '.ed-band .it{position:absolute;inset:0;display:flex;align-items:center;gap:.6rem;padding:0 .95rem;border:0;background:none;font:inherit;text-align:left;color:inherit;width:100%;cursor:pointer;opacity:0;transform:translateY(100%);transition:opacity .5s,transform .5s}',
    '.ed-band .it.on{opacity:1;transform:none}.ed-band .it.out{opacity:0;transform:translateY(-100%)}',
    '.ed-band .qn{flex:none;font-weight:900;color:var(--accent,#3182F6);font-size:1.05rem}',
    '.ed-band .tx{flex:1;min-width:0}.ed-band .tx b{display:block;font-size:.95rem;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.ed-band .tx span{display:block;font-size:.8125rem;color:var(--ink2,#6B7684);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:.15rem}',
    '.ed-band .ct{flex:none;font-size:.75rem;color:var(--ink2,#6B7684)}',
    '.ed-live{display:flex;align-items:center;gap:.65rem;padding:.85rem .95rem;border-radius:1rem;background:#12B886;color:#fff;text-decoration:none;margin:.75rem 0 0;font-weight:800}',
    '.ed-live.wait{background:var(--surface,#fff);color:var(--ink,#191F28);border:1px solid var(--line,#E5E8EB)}',
    '.ed-live .dot{flex:none;width:.6rem;height:.6rem;border-radius:50%;background:#fff;box-shadow:0 0 0 0 rgba(255,255,255,.7);animation:edp 1.6s infinite}',
    '.ed-live.wait .dot{background:#12B886;animation:none}',
    '@keyframes edp{0%{box-shadow:0 0 0 0 rgba(255,255,255,.7)}70%{box-shadow:0 0 0 .6rem rgba(255,255,255,0)}100%{box-shadow:0 0 0 0 rgba(255,255,255,0)}}',
    '.ed-live .tx{flex:1;min-width:0;line-height:1.4}.ed-live .tx small{display:block;font-weight:600;font-size:.8125rem;opacity:.9}',
    '.ed-live .go{flex:none;font-size:.875rem;padding:.35rem .7rem;border-radius:999px;background:rgba(255,255,255,.22)}.ed-live.wait .go{background:var(--sunk,#F2F4F6)}',
    '@media (prefers-reduced-motion:reduce){.ed-band .it{transition:none}.ed-live .dot{animation:none}}'
  ].join('\n');

  // ── 서버에서 읽기
  function loadAI(){
    var c = client(); if (!c) return setTimeout(loadAI, 500);
    q(c.from('ln_stock_ai').select('code,line,hl,src_title,src_url,made_at,questions,q_made_at').limit(1000)).then(function(r){
      if (!r.error && r.data) { var m = {}; r.data.forEach(function(x){ m[x.code] = x; }); E.ai = m; }
      E.loaded = true; redraw();
    });
  }
  function loadNews(code){
    if (E.newsAsked[code]) return; E.newsAsked[code] = true;
    var c = client(); if (!c) { E.newsAsked[code] = false; return; }
    q(c.from('material_news').select('headline,url,press,created_at').contains('stocks', JSON.stringify([{ c: code }])).order('id', { ascending: false }).limit(1)).then(function(r){
      E.news[code] = (!r.error && r.data && r.data[0]) || null; redraw();
    });
  }
  function loadLive(){
    var c = client(); if (!c) return setTimeout(loadLive, 800);
    q(c.rpc('live_now')).then(function(r){
      var old = JSON.stringify(E.live && [E.live.state, E.live.online, E.live.room]);
      E.live = (!r.error && r.data) ? r.data : null;
      if (old !== JSON.stringify(E.live && [E.live.state, E.live.online, E.live.room])) redraw();
    });
  }

  // ── ① AI 한 줄
  function bcQuote(code){
    try {
      var H = window.__lnHome, eps = (H && H.bc && H.bc.episodes) || [];
      var best = null;
      eps.forEach(function(e){ if (!e.published || e.canceled) return; (e.picks || []).forEach(function(k){ if (k.stock_code === code && k.quote && !(k.kind === 'secret' && !k.revealed) && (!best || e.air_date > best.d)) best = { d: e.air_date, t: String(k.quote).replace(/^\[추정[^\]]*\]\s*/, '').replace(/\s*\[\d{1,2}:\d{2}\]\s*$/, ''), who: k.expert_name || '', url: e.video_url || '' }; }); });
      return best;
    } catch (e) { return null; }
  }
  function pinLine(code){
    var a = E.ai[code];
    if (a && a.line && hoursAgo(a.made_at) < 72) return { t: a.line, hl: a.hl, url: a.src_url, src: a.src_title, at: a.made_at, ai: true };
    var n = E.news[code];
    if (n === undefined) loadNews(code);
    if (n && n.headline) return { t: n.headline, url: n.url, src: n.press, at: n.created_at, ai: false };
    var b = bcQuote(code);
    if (b) return { t: (b.who ? b.who + ': ' : '') + b.t, url: b.url, src: '방송 ' + b.d.slice(5).replace('-', '/'), at: b.d + 'T21:30:00+09:00', ai: false, bc: true };
    return null;
  }
  function pinHTML(code){
    var p = pinLine(code); if (!p) return '';
    var stale = !p.bc && hoursAgo(p.at) > 24;
    var body = esc(p.t);
    if (p.hl) { var i = p.t.indexOf(p.hl); if (i > -1) body = esc(p.t.slice(0, i)) + '<b>' + esc(p.hl) + '</b>' + esc(p.t.slice(i + p.hl.length)); }
    var meta = (stale ? '최근 24시간 새 이슈 없음 · 마지막 이슈 · ' : '') + (p.src ? esc(p.src) + ' · ' : '') + (p.bc ? '방송에서 한 말' : (hhmm(p.at) ? hhmm(p.at) + ' 기준' : '')) + (p.url ? ' · 누르면 원문' : '');
    var inner = '<span class="b">' + (p.ai ? 'AI 요약' : p.bc ? '방송 한 줄' : '재료 뉴스') + '</span><span class="t">' + body + '<span class="m">' + meta + '</span></span>';
    return p.url && /^https?:\/\//.test(p.url) ? '<a class="ed-pin" href="' + esc(p.url) + '" target="_blank" rel="noopener">' + inner + '</a>' : '<div class="ed-pin">' + inner + '</div>';
  }

  // ── ② 질문 버튼
  var DEF_Q = ['이 종목 갖고 계세요? 언제부터 보셨어요?', '요즘 이 종목에서 제일 신경 쓰이는 소식은 뭐예요?', '이 회사, 주변에 설명한다면 한 줄로 어떻게 말하시겠어요?'];
  var BC_Q = '방송에서 이 종목을 꼽은 이유, 납득되세요?';
  function questionsOf(code){
    var a = E.ai[code], L = (a && Array.isArray(a.questions) ? a.questions : []).filter(function(x){ return typeof x === 'string' && x.trim(); }).map(function(x){ return x.trim().slice(0, 60); });
    if (L.length >= 3) return L.slice(0, 5);
    var out = L.slice();
    if (bcQuote(code) && out.indexOf(BC_Q) < 0) out.push(BC_Q);
    DEF_Q.forEach(function(x){ if (out.length < 4 && out.indexOf(x) < 0) out.push(x); });
    return out.slice(0, 5);
  }
  function msgsOf(w, code){ try { return (w.allMsgs ? w.allMsgs(code) : []) || []; } catch (e) { return []; } }
  function answersOf(w, code, qs){ var M = msgsOf(w, code); return qs.map(function(x){ var pre = 'Q. ' + x; return M.filter(function(m){ return String(m.text || '').indexOf(pre) === 0; }).length; }); }
  function qsHTML(w, code, room){
    var qs = questionsOf(code); if (!qs.length) return '';
    var n = answersOf(w, room, qs);
    return '<div class="ed-qs"><span class="h">이야기 거리 · 눌러서 답해 보세요</span>' + qs.map(function(x, i){
      return '<button class="ed-q" data-a="edQ" data-v="' + esc(code) + '|' + i + '"><span class="qn">Q</span><span class="qt">' + esc(x) + '<small class="qc">' + (n[i] ? n[i] + '명이 답했어요' : '첫 답을 남겨 보세요') + '</small></span></button>';
    }).join('') + '</div>';
  }
  function qTag(h){ // 'Q. 질문 → 답' 말풍선에 질문 꼬리표
    return h.replace(/<div class="bubble">Q\. ([^<]*?) → /g, function(_, qq){ return '<div class="bubble"><span class="ed-qtag">Q. ' + qq + '</span>'; });
  }

  // ── ③ 홈 질문 띠
  var NAMES = {};
  function stockName(w, code){ try { var s = w.STOCKS && w.STOCKS[code]; if (s && s.name) return s.name; } catch (e) {} var a = bcName(code); return a || NAMES[code] || code; }
  function bcName(code){ try { var H = window.__lnHome, eps = (H && H.bc && H.bc.episodes) || [], nm = ''; eps.forEach(function(e){ (e.picks || []).forEach(function(k){ if (k.stock_code === code && k.stock_name) nm = k.stock_name; }); }); return nm; } catch (e) { return ''; } }
  function bandItems(w){
    var out = [], all = [];
    try { all = (w.allMsgs ? w.allMsgs() : []) || []; } catch (e) {}
    all.filter(function(m){ return /^Q\. .+ → ./.test(String(m.text || '')) && hoursAgo(m.at) < 72; })
      .sort(function(a, b){ return String(b.at) < String(a.at) ? -1 : 1; }).slice(0, 8)
      .forEach(function(m){ var t = String(m.text), k = t.indexOf(' → '); out.push({ code: m.s, q: t.slice(3, k), a: t.slice(k + 3), who: m.who }); });
    if (out.length < 5) {
      var seen = {}; out.forEach(function(o){ seen[o.code + o.q] = 1; });
      Object.keys(E.ai).forEach(function(code){ var a = E.ai[code]; if (!a || !Array.isArray(a.questions) || !a.questions[0] || out.length >= 5) return; var qq = String(a.questions[0]).slice(0, 60); if (!seen[code + qq]) out.push({ code: code, q: qq, a: '' }); });
    }
    return out.slice(0, 8);
  }
  function bandHTML(w){
    var L = bandItems(w); if (L.length < 2) return '';
    return '<div class="ed-band" role="region" aria-label="종목 이야기 질문">' + L.map(function(o, i){
      return '<button class="it' + (i === 0 ? ' on' : '') + '" data-a="stock" data-v="' + esc(o.code) + '"><span class="qn">Q</span><span class="tx"><b>' + esc(o.q) + '</b><span>' + (o.a ? '→ ' + esc(o.a) : '첫 답을 기다려요') + ' · ' + esc(stockName(w, o.code)) + '</span></span><span class="ct">' + (i + 1) + '/' + L.length + '</span></button>';
    }).join('') + '</div>';
  }
  var bandTimer = null, bandHold = false;
  function spin(){
    var f = lnFrame(); if (!f) return; var d; try { d = f.contentDocument; } catch (e) { return; }
    var b = d && d.querySelector('.ed-band'); if (!b || bandHold) return;
    if (!b.__ed) { b.__ed = 1; ['touchstart', 'mouseenter', 'focusin'].forEach(function(t){ b.addEventListener(t, function(){ bandHold = true; }, { passive: true }); }); ['touchend', 'mouseleave', 'focusout'].forEach(function(t){ b.addEventListener(t, function(){ setTimeout(function(){ bandHold = false; }, 2500); }, { passive: true }); }); }
    var its = b.querySelectorAll('.it'); if (its.length < 2) return;
    var cur = 0; for (var i = 0; i < its.length; i++) if (its[i].classList.contains('on')) cur = i;
    var nx = (cur + 1) % its.length;
    its[cur].classList.remove('on'); its[cur].classList.add('out');
    (function(el){ setTimeout(function(){ el.classList.remove('out'); }, 600); })(its[cur]);
    its[nx].classList.add('on');
  }

  // ── ④ 방송 같이 보기 안내
  function liveHTML(){
    var L = E.live; if (!L || !L.room) return '';
    var nm = esc(L.name || '방송');
    if (L.open) {
      var st = L.state === 'soon' ? '곧 시작 · ' + hhmm(L.start_at) + ' 본방송' : L.state === 'live' ? '지금 방송 중' : L.state === 'after' ? '방송 끝 · 이야기 나누는 중' : '이야기가 이어지는 중';
      return '<a class="ed-live" href="live.html" target="_top"><span class="dot" aria-hidden="true"></span><span class="tx">' + nm + ' 같이 보기 채팅<small>' + st + (L.online ? ' · ' + L.online + '명 참여 중' : '') + '</small></span><span class="go">들어가기</span></a>';
    }
    if (L.state === 'before') return '<a class="ed-live wait" href="live.html" target="_top"><span class="dot" aria-hidden="true"></span><span class="tx">오늘 ' + hhmm(L.start_at) + ' ' + nm + '<small>' + hhmm(L.opens_at) + '에 같이 보기 채팅이 열려요 · 히든주를 같이 추리해요</small></span><span class="go">미리 보기</span></a>';
    return '';
  }

  // ── 화면에 붙이기
  function insertAfterFirstSection(h, add){ if (!add) return h; var e = h.indexOf('</section>'); return e > -1 ? h.slice(0, e + 10) + add + h.slice(e + 10) : add + h; }
  function patch(w, d){
    if (w.__ed || !w.__hm || !w.A || !w.screenHome) return;
    w.__ed = true;
    var st = d.createElement('style'); st.id = 'ed-css'; st.textContent = CSS; d.head.appendChild(st);
    var oHome = w.screenHome;
    w.screenHome = function(){
      var h = oHome.apply(this, arguments);
      try { var top = liveHTML(), band = bandHTML(w); var wrap = (top || band) ? '<div class="gx" style="padding:0 1rem">' + top + band + '</div>' : ''; return insertAfterFirstSection(h, wrap); } catch (e) { try { console.warn('ln-edge home', e); } catch (x) {} return h; }
    };
    if (w.screenStock) {
      var oSt = w.screenStock;
      w.screenStock = function(id){
        var h = oSt.apply(this, arguments);
        try {
          var code = String(id); if (!/^[0-9A-Z]{6}$/.test(code)) { try { code = (w.STOCKS && w.STOCKS[id] && w.STOCKS[id].code) || code; } catch (x) {} }
          var pin = pinHTML(code);
          // 이야기방 제목 바로 아래에 AI 한 줄 + 질문 버튼
          var at = h.indexOf(' 이야기방 <span class="cnt">');
          if (at > -1) {
            var e = h.indexOf('</h2>', at);
            if (e > -1) { h = h.slice(0, e + 5) + pin + qsHTML(w, code, String(id)) + h.slice(e + 5); return qTag(h); }
          }
          // 이야기방이 없는 종목 화면(재료 뉴스에서 연 종목 등): 첫 칸 아래에 AI 한 줄만
          return pin ? insertAfterFirstSection(h, '<div style="padding:0 1rem">' + pin + '</div>') : h;
        } catch (x) { try { console.warn('ln-edge stock', x); } catch (y) {} return h; }
      };
    }
    w.A.edQ = function(v){
      var p = String(v || '').split('|'), code = p[0], qs = questionsOf(code), qq = qs[+p[1]];
      if (!qq) return;
      if (!w.P || !w.P.member) { try { w.A.join(); } catch (e) {} return; }
      var inp = d.getElementById('msg-input'); if (!inp) return;
      var pre = 'Q. ' + qq + ' → ';
      if (inp.value.indexOf('Q. ') === 0) { var k = inp.value.indexOf(' → '); inp.value = pre + (k > -1 ? inp.value.slice(k + 3) : ''); } else inp.value = pre + inp.value;
      try { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); inp.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
    };
    try { w.render(); } catch (e) {}
  }
  function scan(){
    Array.prototype.forEach.call(document.querySelectorAll('iframe'), function(f){
      var w, d; try { w = f.contentWindow; d = f.contentDocument; } catch (e) { return; }
      if (w && d && d.head && /(^|\/)ln(\.html)?([?#]|$)/.test(d.URL || '')) patch(w, d);
    });
  }
  var tick = setInterval(function(){ scan(); var w = lnWin(); if (w && w.__ed) clearInterval(tick); }, 300);
  setTimeout(function(){ clearInterval(tick); }, 90000);
  new MutationObserver(function(){ var w = lnWin(); if (w && !w.__ed) scan(); }).observe(document.documentElement, { childList: true, subtree: true });
  loadAI(); loadLive();
  setInterval(loadAI, 10 * 60e3);
  setInterval(loadLive, 60e3);
  bandTimer = setInterval(spin, 4500);
})();
