/* 리딩노트 · 실데이터 연결 (리딩 모음)
   index.html(맨 바깥 셸) <head>에 <script src="live-data.js?v=2"></script> 한 줄만 넣으면 동작해요.
   - 예시 전문가·예시 추천·예시 대화·예시 투표를 모두 끄고, 운영실(ops.html)에서 검수를 거쳐 공개된 기록만 보여줘요.
   - 추천마다 출처(채널·원문 주소)와 '늦은 입력'·'정정됨' 표시를 붙여요.
   - 시세 이용계약 전(운영실 설정 '시세 표시' 꺼짐)에는 가격 숫자·수익률을 보여주지 않고 네이버 증권 바로가기만 둬요.
   - 카카오 로그인(진짜 회원), 관심 전문가·관심종목 서버 저장, 종목 이야기방 서버 저장·실시간을 붙여요.
   - 리딩 모음 안의 예전 관리자 화면 대신 운영실(ops.html)을 새 창으로 열어요. */
(function(){

  if (window.__lnLive) return;
  var LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/dist/umd/supabase.js';
  var L = window.__lnLive = { feed: null, talk: [], uid: null, user: null, member: null, follows: null, watch: null, ready: false, err: null };
  function log(){ try { console.log.apply(console, ['[리딩노트 실데이터]'].concat([].slice.call(arguments))); } catch (e) {} }
  function cfg(){
    var w = window;
    for (var i = 0; i < 6; i++) {
      try { if (w.__SB && w.__SB.projectId) return { url: 'https://' + w.__SB.projectId + '.supabase.co', key: w.__SB.anonKey }; } catch (e) {}
      if (w === w.parent) break; try { w = w.parent; } catch (e) { break; }
    }
    return null;
  }
  function topWin(){ try { return window.top.location.href ? window.top : window; } catch (e) { return window; } }
  function q(p){ return Promise.resolve(p).then(function(r){ return r || {}; }, function(e){ return { error: { message: String(e && e.message || e) } }; }); }
  function addDays(day, n){ var p = day.split('-'), d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + n)); return d.toISOString().slice(0, 10); }
  function mask(n){ n = String(n || '').trim().slice(0, 12); if (!n) return '회원'; return n.length >= 3 ? n.charAt(0) + '*' + n.slice(2) : n.length === 2 ? n.charAt(0) + '*' : n; }
  function escH(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // ---- 로그인 한 곳에서 관리 (커뮤니티 연결 스크립트와 같은 연결을 함께 써요)
  function sharedAuth(c){
    if (window.__lnAuth) return window.__lnAuth;
    var sb = window.supabase.createClient(c.url, c.key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'leadingnote-auth', flowType: 'pkce', detectSessionInUrl: false } });
    var tw = topWin(), url = null, code = null, err = null;
    try { url = new URL(tw.location.href); code = url.searchParams.get('code'); err = url.searchParams.get('error_description') || url.searchParams.get('error'); } catch (e) {}
    var p = Promise.resolve();
    if (code || err) {
      p = (code ? q(sb.auth.exchangeCodeForSession(code)) : Promise.resolve({ error: { message: err } })).then(function(r){
        if (r.error) window.__lnAuthErr = r.error.message;
        try { ['code', 'error', 'error_code', 'error_description', 'state'].forEach(function(k){ url.searchParams.delete(k); }); tw.history.replaceState(tw.history.state, '', url.pathname + (url.search || '') + url.hash); } catch (e) {}
      });
    }
    window.__lnAuth = { sb: sb, ready: p.then(function(){ return q(sb.auth.getSession()); }).then(function(r){ return r.data && r.data.session || null; }) };
    return window.__lnAuth;
  }
  function withLib(fn){
    if (window.supabase && window.supabase.createClient) return fn();
    var s = document.querySelector('script[data-sblib]');
    if (!s) { s = document.createElement('script'); s.src = LIB; s.setAttribute('data-sblib', '1'); document.head.appendChild(s); }
    s.addEventListener('load', fn); s.addEventListener('error', function(){ L.err = 'lib'; fail('연결 도구를 불러오지 못했어요'); });
  }

  // ---- 서버에서 읽기
  var C = cfg(), AUTH = null;
  function start(){
    if (!C) { L.err = 'cfg'; return fail('서버 정보가 없어요'); }
    withLib(function(){
      AUTH = sharedAuth(C); var sb = AUTH.sb;
      AUTH.ready.then(function(se){
        L.user = se && se.user || null; L.uid = L.user ? L.user.id : null;
        var real = L.user && !L.user.is_anonymous;
        // 셸(index.html)이 미리 요청해 둔 공개 기록이 있으면 그걸 써요. 실패했거나 회원 로그인 상태면 예전처럼 요청해요
        var pre = null; try { pre = window.__lnPre || topWin().__lnPre || null; } catch (e) {}
        var feedP = function(){ return q(sb.rpc('rec_feed')); };
        var talkP = function(){ return q(sb.from('ln_talk').select('id,stock_id,user_id,nickname,body,created_at').order('created_at', { ascending: false }).limit(1000)); };
        return Promise.all([
          (pre && !real) ? q(pre.feed).then(function(r){ return r.error || !r.data ? feedP() : r; }) : feedP(),
          pre ? q(pre.talk).then(function(r){ return r.error || !r.data ? talkP() : r; }) : talkP(),
          real ? q(sb.from('user_follows').select('expert_id')) : Promise.resolve({ data: null }),
          real ? q(sb.from('user_watch').select('stock_code')) : Promise.resolve({ data: null })
        ]);
      }).then(function(rs){
        if (rs[0].error) { L.err = rs[0].error.message; return fail('추천 기록을 불러오지 못했어요'); }
        L.feed = rs[0].data; L.talk = rs[1].data || [];
        L.follows = rs[2].data ? rs[2].data.map(function(r){ return r.expert_id; }) : null;
        L.watch = rs[3].data ? rs[3].data.map(function(r){ return r.stock_code; }) : null;
        L.ready = true; scan();
        try {
          sb.channel('ln-talk').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ln_talk' }, function(p){ if (p && p.new) onTalk(p.new); })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'ln_talk' }, function(p){ if (p && p.old) { L.talk = L.talk.filter(function(m){ return m.id !== p.old.id; }); rerender(); } })
            .subscribe();
        } catch (e) { log('실시간 연결 실패', e); }
      });
    });
  }
  function fail(msg){ log(msg, L.err || ''); L.failMsg = msg; L.ready = true; L.feed = { experts: [], events: [], stocks: {}, price: { on: false }, now: null }; scan(); }

  // ---- 리딩 모음 화면에 붙이기
  var FR = null; // 연결된 리딩 모음 창
  function rerender(){ try { if (FR && FR.w.render) { var a = FR.d.activeElement; if (a && a.id === 'msg-input' && a.value) return; FR.w.render(); } } catch (e) {} }
  function onTalk(r){ if (L.talk.some(function(m){ return m.id === r.id; })) return; L.talk.unshift(r); rerender(); }
  var CSS = [
    'html.ln-wait body{visibility:hidden}',
    'html.ln-wait::after{content:"추천 기록을 불러오는 중이에요";position:fixed;inset:0;display:flex;align-items:center;justify-content:center;font:600 18px/1.4 -apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;color:#6b7280}',
    'html.ln-nopx .lprice,html.ln-nopx .hsearch,html.ln-nopx .sprice>.chg{display:none!important}',
    'html.ln-nopx .lhead{grid-template-columns:1fr auto!important}',
    '.ln-src{white-space:nowrap}',
    '.ln-src a{color:inherit;text-decoration:underline;text-underline-offset:2px}',
    '.ln-flag{display:inline-block;margin-left:.35em;padding:0 .4em;border-radius:.35em;font-size:.85em;font-weight:700;background:rgba(245,158,11,.16);color:#b45309}',
    '.ln-flag.cor{background:rgba(59,130,246,.14);color:#1d4ed8}',
    'button.ln-flag{border:0;font:inherit;font-size:.85em;cursor:pointer}',
    '.ln-rep{display:inline-flex;align-items:center;min-height:2.75rem;border:0;background:none;padding:0 .3em;margin-left:.3em;font:inherit;font-size:.85em;color:inherit;opacity:.65;text-decoration:underline;text-underline-offset:2px;cursor:pointer}',
    'a.news{display:flex;flex-direction:column;text-decoration:none;color:inherit}',
    '.ln-naver{display:inline-flex;align-items:center;gap:.3em;font-weight:700;text-decoration:none;color:inherit;border:1px solid currentColor;border-radius:999px;padding:.25em .8em;opacity:.85}',
    '.ln-pxnote{display:block;margin-top:.4em;font-size:.85em;opacity:.75}',
    '.ln-empty{margin:1rem;padding:1.25rem;border-radius:1rem;background:rgba(127,127,127,.1);font-size:1.05rem;line-height:1.55}',
    '.ln-kakao-note{font-size:.95rem;line-height:1.55;opacity:.8;margin:.75rem 0 0}',
    '.ln-kakao-note a{color:inherit;text-decoration:underline}',
    '.link-btn[data-a="join"]{display:none!important}'
  ].join('\n');

  function earlyHide(f){
    var d; try { d = f.contentDocument; } catch (e) { return; }
    if (!d || !d.documentElement || d.__lnw || !/(^|\/)ln(\.html)?([?#]|$)/.test(d.URL || '')) return;
    d.__lnw = true;
    var s = d.createElement('style'); s.id = 'ln-live-css'; s.textContent = CSS; d.documentElement.appendChild(s);
    d.documentElement.classList.add('ln-wait');
    setTimeout(function(){ if (d.documentElement.classList.contains('ln-wait') && !L.ready) { L.err = L.err || 'timeout'; fail('추천 기록을 불러오는 데 시간이 오래 걸려요'); } }, 10000);
  }

  function build(F){
    // 시세 계약 스위치(config.js LN_PX)가 꺼져 있으면 서버가 가격을 보내도 쓰지 않아요
    var lic = false; try { lic = window.LN_PX === true || (window.top !== window && window.top.LN_PX === true); } catch (e) { lic = window.LN_PX === true; }
    var on = lic && !!(F.price && F.price.on), ST = {};
    Object.keys(F.stocks || {}).forEach(function(c){ var s = F.stocks[c]; ST[c] = { name: s.name, code: c, market: s.market, price: on && s.price != null ? s.price : null, chg: on && s.chg != null ? Number(s.chg) : null, closes: on ? (s.closes || []) : [] }; });
    var mine = L.follows || [];
    var EX = (F.experts || []).map(function(x){
      return { id: x.id, name: x.name, style: x.style || 'swing', tags: x.tags || [], channels: x.channels || [], intro: x.intro || '', links: x.links || [],
        live: x.live || null, fans: Math.max(0, (x.fans || 0) - (mine.indexOf(x.id) > -1 ? 1 : 0)) };
    });
    var ids = {}; EX.forEach(function(x){ ids[x.id] = 1; });
    var LD = [], byL = {};
    (F.events || []).forEach(function(e){
      if (!ids[e.expert]) return;
      if (!ST[e.stock]) ST[e.stock] = { name: e.stock, code: e.stock, price: null, chg: null, closes: [] };
      var Lx = byL[e.lid]; if (!Lx) { Lx = byL[e.lid] = { id: e.lid, expert: e.expert, stock: e.stock, events: [] }; LD.push(Lx); }
      var ev = { t: e.t, at: e.at, src: e.ch || e.src || '', kind: e.src, url: e.url, stitle: e.title, late: !!e.late, corrected: !!e.corrected, _id: e.id };
      ['buy', 'target', 'stop', 'sell'].forEach(function(k){ if (e[k] != null) ev[k] = e[k]; });
      if (e.text) ev.text = e.text;
      if (e.t === 'news') { ev.title = e.title || e.text || '관련 소식'; ev.press = e.ch || ''; }
      if (e.t === 'watch' && !ev.text) ev.text = '구매 추천이 나오면 알려드릴게요';
      Lx.events.push(ev);
    });
    return { on: on, ST: ST, EX: EX, LD: LD };
  }

  function apply(f){
    var w, d; try { w = f.contentWindow; d = f.contentDocument; } catch (e) { return; }
    if (!w || !d || d.__lnLive || !w.LN || !w.LEADINGS || !w.EXPERTS || !w.STOCKS || !w.__site || typeof w.render !== 'function' || !w.A || !w.P || !w.S) return;
    d.__lnLive = true; FR = { w: w, d: d };
    if (!d.getElementById('ln-live-css')) { var s = d.createElement('style'); s.id = 'ln-live-css'; s.textContent = CSS; d.head.appendChild(s); }
    var F = L.feed, B = build(F), P = w.P, S = w.S, A = w.A, root = d.documentElement;
    root.classList.toggle('ln-nopx', !B.on);

    // 날짜: 예시 날짜 대신 실제 오늘
    var today = F.now ? F.now.slice(0, 10) : w.today();
    w.DATA_TODAY = today; w.RECENT_FROM = addDays(today, -7);
    try { w.THIS_WEEK = w.mondayOf(today); S.rankWs = null; } catch (e) {}

    // 예시 데이터 끄기
    w.STOCKS = B.ST;
    // (11/24) 적중 판정용 장 마감 가격: 서버가 종목 가격을 보내 주면(화면 가격 표시 스위치와 따로) ln-data.js 가격보다 최근일 때만 바꿔 넣어요
    try { var pm = {}, pf = F.price || {}; Object.keys(F.stocks || {}).forEach(function(c){ var p = F.stocks[c].price; if (p != null && !isNaN(p)) pm[c] = +p; }); if (pf.asOf && w.setJudgePrices) w.setJudgePrices(String(pf.asOf).slice(0, 10), pf.source || '', pm); } catch (e) {}
    w.SEED_MSGS.length = 0; w.SEED_POLL = {};
    w.HIST_CACHE = {};
    try { w.setPrices({ asOf: '', days: [], rows: [], src: '' }); } catch (e) {}   // 출처 확인 안 된 시세 파일은 쓰지 않아요
    P.adminEvents = []; P.newExperts = []; P.expertEdit = {}; P.expertDel = {}; P.evEdit = {}; P.evDel = {}; P.leadDel = {}; P.liveSet = {}; P.introSet = {};
    P.votes = {};

    // 기준 데이터 바꾸고, 예전 관리자 덮어쓰기 대신 서버 기록만 쓰게
    var BASE_X = B.EX, BASE_L = B.LD;
    w.applyAdmin = function(){
      w.EXPERTS.length = 0; BASE_X.forEach(function(x){ w.EXPERTS.push(x); });
      w.LEADINGS.length = 0; BASE_L.forEach(function(Lx){ w.LEADINGS.push(Lx); });
    };
    w.applyAdmin();

    // 시세가 없을 때도 화면이 깨지지 않게
    var ow = w.won, op = w.pct, oc = w.chgHTML, oa = w.analyze;
    w.won = function(n){ return n == null || isNaN(n) ? '-' : ow(n); };
    w.pct = function(x){ return x == null || isNaN(x) ? '-' : op(x); };
    w.chgHTML = function(st){ return !st || st.chg == null ? '' : oc(st); };
    w.analyze = function(Lx){ var a = oa(Lx); if (!a.stock || a.stock.price == null) a.unreal = null; return a; };
    w.stockHist = function(id){ var st = w.STOCKS[id]; return st && st.closes && st.closes.length ? st.closes.slice(-20) : []; };
    w.pollHTML = function(){ return ''; };

    // 출처·표시 붙이기
    var naver = function(code){ return 'https://finance.naver.com/item/main.naver?code=' + encodeURIComponent(code); };
    w.__lnSrc = function(e){
      var h = '';
      if (e.url) h += ' · <span class="ln-src"><a href="' + escH(e.url) + '" target="_blank" rel="noopener noreferrer">원문 보기 ↗</a></span>';
      if (e.late) h += '<span class="ln-flag" title="방송·게시 다음 날 이후에 기록했어요">늦은 입력</span>';
      if (e.corrected) h += (e._id ? '<button type="button" class="ln-flag cor" data-a="lnHist" data-v="' + escH(e._id) + '" title="눌러서 무엇을 고쳤는지 봐요">정정됨 ›</button>' : '<span class="ln-flag cor" title="운영자가 이유를 남기고 고쳤어요">정정됨</span>');
      if (e._id) h += '<button type="button" class="ln-rep" data-a="lnRep" data-v="' + escH(e._id) + '">기록이 이상해요</button>';
      return h;
    };
    w.__lnNews = function(e){
      var inner = '<b>' + escH(e.title) + '</b><span>' + escH(e.press || '') + (e.url ? ' · 기사 보기 ›' : '') + '</span>';
      return e.url ? '<a class="news" href="' + escH(e.url) + '" target="_blank" rel="noopener noreferrer">' + inner + '</a>' : '<div class="news">' + inner + '</div>';
    };
    w.__lnNaver = function(code){ return '<a class="ln-naver" href="' + naver(code) + '" target="_blank" rel="noopener noreferrer">네이버 증권에서 지금 가격 보기 ↗</a>'; };
    w.__lnPxDay = function(){ var p = F.price || {}; return p.asOf ? '<span class="ln-pxnote" style="margin:0 0 0 .5em">' + escH(p.asOf.slice(5).replace('-', '.')) + ' 종가</span>' : ''; };
    w.__lnPxNote = function(){ var p = F.price || {}; return '<span class="ln-pxnote">' + escH((p.asOf || '').replace(/-/g, '.')) + ' 장 마감 가격 기준' + (p.source ? ' · 시세 출처 ' + escH(p.source) : '') + ' · 아직 팔지 않아 확정된 결과가 아니에요</span>'; };
    // 화면 자리(LN.slot)에 등록해요 (11/22: 예전에는 ln.html 함수 글자를 찾아 바꿨어요 · 결과는 같아요)
    var LN = w.LN;
    LN.slot('timeline.src', function(e){ return w.__lnSrc(e); }, { id: 'live.src' });
    LN.slot('timeline.news', function(e){ return w.__lnNews(e); }, { id: 'live.news' });
    LN.slot('summary.holdHead', function(a){ return a.unreal == null ? '<span class="rl">가지고 있는 중</span><span class="big">' + w.won(a.cur.buy) + '에 구매</span>' : null; }, { id: 'live.holdHead' });
    LN.slot('summary.holdLine', function(a){ return a.unreal == null ? '<span class="rline">' + w.fmtDate(a.startAt) + ' 추천 · ' + w.__lnNaver(a.L.stock) + '</span>' : '<span class="rline">' + w.won(a.cur.buy) + '에 구매 · 지금 ' + w.won(a.stock.price) + w.__lnPxNote() + '</span>'; }, { id: 'live.holdLine' });
    LN.slot('stock.holdText', function(a){ return a.unreal == null ? '가지고 있는 중 · 구매 ' + w.won(a.cur.buy) : null; }, { id: 'live.holdText' });
    LN.slot('stock.price', function(id, st){ return st.price == null ? w.__lnNaver(id) : '<b>' + w.won(st.price) + '</b>' + w.chgHTML(st) + w.__lnPxDay(); }, { id: 'live.price' });
    LN.slot('stock.poll', function(){ return ''; }, { id: 'live.noPoll' });       // '다른 투자자들의 생각'(예시 투표)은 빼요
    LN.slot('share.poll', function(){ return ''; }, { id: 'live.noPoll' });
    if (!w.__t2) LN.slot('home.pollText', function(){ return ''; }, { id: 'live.noPoll' });

    // 이야기방: 서버 저장 + 실시간
    w.allMsgs = function(stockFilter){
      var rows = L.talk.filter(function(m){ return w.STOCKS[m.stock_id] && (!stockFilter || m.stock_id === stockFilter); }).map(function(m){
        var at = new Date(new Date(m.created_at).getTime() + 9 * 3600e3).toISOString().slice(0, 16);
        return { id: 't' + m.id, s: m.stock_id, who: m.nickname || '회원', at: at, text: m.body, l: 0, mine: m.user_id === L.uid };
      });
      var pend = []; Object.keys(P.msgs || {}).forEach(function(s){ if (stockFilter && s !== stockFilter) return; (P.msgs[s] || []).forEach(function(m){ pend.push({ id: m.id, s: s, who: mask(P.member && P.member.name), at: m.at, text: m.text, l: 0, mine: true }); }); });
      return rows.concat(pend);
    };
    P.msgs = {};

    // 저장할 때 서버에도 (이야기·관심 전문가·관심종목)
    var osave = w.save, busy = false;
    w.save = function(){ osave.apply(this, arguments); if (!busy) { busy = true; setTimeout(function(){ busy = false; sync(); }, 0); } };
    function sync(){
      var sb = AUTH && AUTH.sb; if (!sb) return;
      Object.keys(P.msgs || {}).forEach(function(room){
        (P.msgs[room] || []).forEach(function(m){
          if (m._sent) return; m._sent = 1;
          if (!L.uid) { drop(room, m); w.toast('지금은 이야기를 보낼 수 없어요. 잠시 뒤 다시 해 주세요'); return; }
          q(sb.from('ln_talk').insert({ stock_id: room, nickname: mask(P.member && P.member.name), body: m.text }).select('id,stock_id,user_id,nickname,body,created_at').single()).then(function(r){
            drop(room, m);
            if (r.error) { w.toast('보내지 못했어요. 잠시 뒤 다시 보내 주세요'); log('이야기 저장 실패', r.error.message); }
            else onTalk(r.data);
            rerender();
          });
        });
      });
      if (L.user && !L.user.is_anonymous && L.follows && L.watch) {
        diff(L.follows, P.follows, function(add){ return sb.from('user_follows').insert(add.map(function(id){ return { user_id: L.uid, expert_id: id }; })); }, function(del){ return sb.from('user_follows').delete().eq('user_id', L.uid).in('expert_id', del); });
        diff(L.watch, P.watch, function(add){ return sb.from('user_watch').insert(add.map(function(c){ return { user_id: L.uid, stock_code: c }; })); }, function(del){ return sb.from('user_watch').delete().eq('user_id', L.uid).in('stock_code', del); });
      }
    }
    function drop(room, m){ var a = P.msgs[room] || []; var i = a.indexOf(m); if (i > -1) a.splice(i, 1); if (!a.length) delete P.msgs[room]; }
    function diff(srv, loc, addFn, delFn){
      var add = (loc || []).filter(function(x){ return srv.indexOf(x) < 0; }), del = srv.filter(function(x){ return (loc || []).indexOf(x) < 0; });
      if (add.length) { add.forEach(function(x){ srv.push(x); }); q(addFn(add)).then(function(r){ if (r.error) log('관심 저장 실패', r.error.message); }); }
      if (del.length) { del.forEach(function(x){ srv.splice(srv.indexOf(x), 1); }); q(delFn(del)).then(function(r){ if (r.error) log('관심 빼기 실패', r.error.message); }); }
    }

    // 회원: 카카오 로그인만
    var real = L.user && !L.user.is_anonymous;
    if (real) {
      var md = L.user.user_metadata || {};
      var nick = md.nickname || md.name || md.full_name || md.preferred_username || md.user_name || '회원';
      P.member = { via: 'kakao', name: String(nick).slice(0, 20), marketing: false, joinedAt: (L.user.created_at || '').slice(0, 16), uid: L.uid };
      P.follows = (L.follows || []).filter(function(id){ return B.EX.some(function(x){ return x.id === id; }); });
      P.watch = (L.watch || []).slice();
    } else if (P.member) {   // 예전 체험용 회원 정보는 정리
      P.member = null; P.follows = []; P.watch = []; P.read = {};
    }
    A.joinKakao = function(){
      var sb = AUTH && AUTH.sb; if (!sb) { w.toast('잠시 뒤 다시 눌러 주세요'); return; }
      try { sessionStorage.setItem('ln.pend', JSON.stringify(S.pending || null)); } catch (e) {}
      var tw = topWin(), back = tw.location.origin + tw.location.pathname;
      q(sb.auth.signInWithOAuth({ provider: 'kakao', options: { redirectTo: back, skipBrowserRedirect: true } })).then(function(r){
        if (r.error || !r.data || !r.data.url) { w.toast('카카오 로그인을 열지 못했어요. 잠시 뒤 다시 해 주세요'); log('카카오 로그인 실패', r.error && r.error.message); return; }
        tw.location.href = r.data.url;
      });
    };
    var ologout = A.logout;
    A.logout = function(){ var sb = AUTH && AUTH.sb; L.user = null; L.uid = null; L.follows = null; L.watch = null; P.follows = []; P.watch = []; ologout(); if (sb) q(sb.auth.signOut()); };
    w.authModal = function(){
      var b = '<div class="mhead"><h2>무료로 시작하기</h2><button class="jx" data-a="closeSheet" aria-label="닫기">' + w.IC.close + '</button></div>' +
        (S.joinReason ? '<p class="landing-tag">' + escH(S.joinReason) + '</p>' : '') +
        w.kakaoBtn('카카오로 시작하기') +
        '<p class="ln-kakao-note">카카오 계정의 <b>닉네임</b>만 받아요. 비밀번호를 따로 만들 필요가 없고, 가입비·이용료도 없어요.<br>처음 시작할 때 <a href="' + new URL('terms.html', d.URL).href + '" target="_blank" rel="noopener">이용약관</a>과 <a href="' + new URL('privacy.html', d.URL).href + '" target="_blank" rel="noopener">개인정보 처리방침</a> 동의를 받아요.</p>';
      return '<div class="scrim center" data-a="closeSheet" data-self="1"><div class="modal" role="dialog" aria-modal="true" aria-label="로그인 또는 회원가입">' + b + '</div></div>';
    };
    // ── 기록 신고 · 정정 내역 (오기록 대응)
    var REP = [['stock', '종목이 달라요'], ['price', '가격이 달라요'], ['time', '날짜·방송이 달라요'], ['kind', '구매·판매가 바뀌었어요'], ['etc', '기타']];
    var KL = { at: '방송·게시 시각', buy: '구매 가격', target: '목표 가격', stop: '손해 막는 가격', sell: '판매 가격', text: '한 말', src_url: '출처 주소' };
    function fv(k, v){
      if (v == null || v === '') return '-';
      if (k === 'at') return new Date(new Date(v).getTime() + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' ');
      if (/^(buy|target|stop|sell)$/.test(k)) return Number(v).toLocaleString('ko-KR') + '원';
      return String(v);
    }
    function sheetWrap(title, body){
      return '<div class="scrim" data-a="closeSheet" data-self="1"><div class="sheet gx" role="dialog" aria-modal="true" aria-label="' + escH(title) + '"><div class="mhead"><h2>' + escH(title) + '</h2><button class="jx" data-a="closeSheet" aria-label="닫기">' + w.IC.close + '</button></div>' + body + '</div></div>';
    }
    var osheet = w.sheetHTML;
    w.sheetHTML = function(){
      if (S.sheet === 'lnrep' && S.lnRep) {
        var r = S.lnRep;
        if (r.done) return sheetWrap('알려 주셔서 고마워요', '<p style="font-size:1.0625rem;line-height:1.6;margin:.5rem 0 1rem">운영자가 방송 다시보기와 맞춰 보고, 틀린 곳이 있으면 고칠게요. 고친 기록에는 <b>정정됨</b> 표시가 붙어요.</p><button class="btn btn-primary btn-block" data-a="closeSheet">닫기</button>');
        return sheetWrap('기록이 이상해요', '<p style="font-size:1.0625rem;margin:.25rem 0 .75rem">어떤 점이 방송과 다른가요?</p>' +
          '<div style="display:grid;gap:.5rem">' + REP.map(function(x){ return '<button class="chip" data-a="lnRepPick" data-v="' + x[0] + '" aria-pressed="' + (r.reason === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
          '<label for="ln-rep-memo" style="display:block;margin:1rem 0 .35rem;font-weight:600">더 알려 주실 내용 (선택)</label>' +
          '<textarea id="ln-rep-memo" class="field" maxlength="200" rows="3" style="width:100%;resize:vertical" placeholder="예: 방송에서는 목표가를 6만원이라고 했어요">' + escH(r.memo || '') + '</textarea>' +
          '<button class="btn btn-primary btn-block" style="margin-top:1rem" data-a="lnRepSend"' + (r.reason && !r.busy ? '' : ' disabled') + '>' + (r.busy ? '보내는 중이에요' : '운영자에게 알리기') + '</button>' +
          '<p class="small" style="margin-top:.6rem;opacity:.75">누가 알렸는지는 다른 회원에게 보이지 않아요. 같은 기록은 한 번만 알릴 수 있어요.</p>');
      }
      if (S.sheet === 'lnhist' && S.lnHist) {
        var hs = S.lnHist, body;
        if (hs.err) body = '<p>정정 내역을 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.</p>';
        else if (!hs.rows) body = '<p>불러오는 중이에요.</p>';
        else if (!hs.rows.length) body = '<p>정정 내역이 없어요.</p>';
        else body = hs.rows.map(function(x){
          var ch = Object.keys(KL).filter(function(k){ return x.before && x.after && (k in x.after) && JSON.stringify(x.before[k]) !== JSON.stringify(x.after[k]); })
            .map(function(k){ return '<li>' + KL[k] + ': ' + escH(fv(k, x.before[k])) + ' → <b>' + escH(fv(k, x.after[k])) + '</b></li>'; }).join('');
          return '<div style="padding:.75rem 0;border-bottom:1px solid var(--line)"><div class="small" style="opacity:.75">' + escH(fv('at', x.at)) + ' ' + (x.action === 'retract' ? '철회' : '정정') + '</div>' +
            (ch ? '<ul style="margin:.35rem 0;padding-left:1.1rem;line-height:1.6">' + ch + '</ul>' : '') + (x.reason ? '<p style="margin:.25rem 0 0">이유: ' + escH(x.reason) + '</p>' : '') + '</div>';
        }).join('');
        return sheetWrap('정정 내역', '<p class="small" style="opacity:.8;margin:.25rem 0 .5rem">처음 올린 값과 고친 값을 그대로 남겨 둬요.</p>' + body + '<button class="btn btn-block" style="margin-top:1rem" data-a="closeSheet">닫기</button>');
      }
      return osheet.apply(this, arguments);
    };
    function keepMemo(){ var t = d.getElementById('ln-rep-memo'); if (t && S.lnRep) S.lnRep.memo = t.value; }
    A.lnRep = function(v){
      if (!v) return;
      if (w.needMember('기록이 이상하다고 알리려면 무료 가입이 필요해요')) return;
      S.lnRep = { id: v, reason: null, memo: '' }; S.sheet = 'lnrep'; w.renderLayer();
    };
    A.lnRepPick = function(v){ if (!S.lnRep) return; keepMemo(); S.lnRep.reason = v; w.renderLayer(); };
    A.lnRepSend = function(){
      var r = S.lnRep, sb = AUTH && AUTH.sb; if (!r || !r.reason || r.busy) return;
      if (!sb) { w.toast('잠시 뒤 다시 눌러 주세요'); return; }
      keepMemo(); r.busy = true; w.renderLayer();
      q(sb.rpc('rec_report', { p_event: r.id, p_reason: r.reason, p_memo: (r.memo || '').trim().slice(0, 200) || null })).then(function(x){
        r.busy = false;
        if (x.error) {
          if (/duplicate|already|23505/i.test(String(x.error.message) + ' ' + String(x.error.code || ''))) { r.done = true; w.toast('이미 알려 주신 기록이에요'); }
          else { w.toast('보내지 못했어요. 잠시 뒤 다시 해 주세요'); log('신고 실패', x.error.message); }
        } else r.done = true;
        w.renderLayer();
      });
    };
    A.lnHist = function(v){
      var sb = AUTH && AUTH.sb; S.lnHist = { id: v, rows: null }; S.sheet = 'lnhist'; w.renderLayer();
      if (!sb) { S.lnHist.err = true; w.renderLayer(); return; }
      q(sb.rpc('rec_history', { p_event: v })).then(function(x){
        if (!S.lnHist || S.lnHist.id !== v) return;
        if (x.error) { S.lnHist.err = true; log('정정 내역 실패', x.error.message); } else S.lnHist.rows = x.data || [];
        w.renderLayer();
      });
    };
    A.asRole = function(){};
    A.news = function(){};
    A.channel = function(v){ w.toast(v + ' 방송은 해당 방송사 편성표에서 확인해 주세요'); };

    // 예전 관리자 화면 대신 운영실
    var ogo = w.__site.go;
    w.__site.go = function(r){
      if (r === 'admin' || (r && r.indexOf('admin-') === 0)) { try { topWin().open(new URL('ops.html', d.URL).href, '_blank', 'noopener'); } catch (e) {} return; }
      return ogo.apply(this, arguments);
    };

    root.classList.remove('ln-wait');
    // 링크로 들어온 경우 실데이터로 다시 찾기
    var done = false;
    try { if ((w.location.hash || '').length > 1 && w.routeHash()) { w.afterRoute(); done = true; } } catch (e) {}
    try { if (!done) w.render(); }
    catch (e) {   // 예시 화면이 남지 않게, 그리지 못하면 안내만
      log('화면 그리기 실패', e);
      d.body.innerHTML = '<div class="ln-empty"><b>화면을 불러오지 못했어요.</b><br>잠시 뒤 새로고침해 주세요.</div>';
    }
    if (L.failMsg) w.toast(L.failMsg + '. 잠시 뒤 다시 열어 주세요');
    if (window.__lnAuthErr) { w.toast('카카오 로그인을 마치지 못했어요. 다시 시도해 주세요'); log('로그인 오류', window.__lnAuthErr); window.__lnAuthErr = null; }

    // 카카오에서 돌아온 직후: 하려던 일 이어서
    if (real) {
      var pend = null; try { pend = JSON.parse(sessionStorage.getItem('ln.pend') || 'null'); sessionStorage.removeItem('ln.pend'); } catch (e) {}
      var fresh = L.user.created_at && (Date.now() - new Date(L.user.created_at).getTime() < 5 * 60e3);
      if (pend || fresh) { S.pending = pend; w.completeJoin(P.member); }
    }
    log('연결 완료 · 전문가 ' + B.EX.length + '명 · 추천 ' + B.LD.length + '건 · 시세 표시 ' + (B.on ? '켜짐' : '꺼짐'));
  }

  function appOf(f){ var s = ''; try { s = f.contentDocument && f.contentDocument.URL || f.src || ''; } catch (e) { s = f.src || ''; } return /(^|\/)ln(\.html)?([?#]|$)/.test(s); }
  function scan(){
    Array.prototype.forEach.call(document.querySelectorAll('iframe'), function(f){
      if (!appOf(f) && !/(^|\/)ln(\.html)?([?#]|$)/.test(f.src || '')) return;
      if (!f.__lnLoad) { f.__lnLoad = true; f.addEventListener('load', function(){ earlyHide(f); if (L.ready) apply(f); }); }
      earlyHide(f);
      if (L.ready) apply(f);
    });
  }
  // 리딩 모음 창이 그려지기 전에 가려 두기 (예시 데이터가 잠깐이라도 보이지 않게)
  var tick = setInterval(function(){ scan(); if (FR && L.ready) clearInterval(tick); }, 30);
  setTimeout(function(){ clearInterval(tick); }, 30000);
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  start();
})();
