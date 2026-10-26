/* 리딩노트 · 커뮤니티 서버 연결 (투표·예측·주제 후보·의견·실시간 토론)
   index.html(맨 바깥 셸)에 <script src="community-live.js"></script> 한 줄만 넣으면 동작해요.
   - 커뮤니티 화면 코드는 고치지 않고, 바깥에서 서버 저장·실시간 연결을 붙여요.
   - 서버에 연결되면 미리 적어 둔 대화·가짜 공감·가짜 답글·가짜 접속 수를 끄고 실제 참여만 보여줘요.
   - 서버 연결이 안 되면 지금처럼(이 기기 안에서만 저장) 그대로 동작해요.
   필요한 것: Supabase 표(supabase_setup.sql)와 Authentication → Allow anonymous sign-ins 켜기
   시작 숫자: 기본은 화면에 미리 넣어 둔 참여 수·예시 의견 위에 실제 참여를 더해요.
             0부터 실제 참여만 세려면 <script src="community-live.js" data-seed="off"></script> 로 넣으세요. */
(function(){
  if (window.__communityLive) return;
  var me = document.currentScript, SEED_OFF = !!(me && me.getAttribute('data-seed') === 'off');
  var LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/dist/umd/supabase.js';

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
  function log(){ try { console.log.apply(console, ['[커뮤니티 서버]'].concat([].slice.call(arguments))); } catch (e) {} }
  function z(n){ return (n < 10 ? '0' : '') + n; }
  function hhmm(iso){ var d = new Date(iso); return z(d.getHours()) + ':' + z(d.getMinutes()); }
  function uuid(){ try { if (crypto.randomUUID) return crypto.randomUUID(); } catch (e) {} return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c){ var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }); }
  function q(p){ return Promise.resolve(p).then(function(r){ return r || {}; }, function(e){ return { error: { message: String(e && e.message || e) } }; }); }

  // ---- 서버 연결 (방문자는 자동 익명 로그인)
  var D = { sb: null, uid: null, ready: false, online: 1, chatFns: [], onlineFns: [] };
  window.__communityLive = D; // 점검용 (콘솔에서 __communityLive.ready 확인)
  function nickname(){
    var n = '';
    try { var l = JSON.parse(localStorage.getItem('leadingnote.v5')); if (l && l.member && l.member.name && ['체험 회원', '운영자', '한선생TV'].indexOf(l.member.name) < 0) n = String(l.member.name).trim(); } catch (e) {}
    if (n) { n = n.length >= 3 ? n.charAt(0) + '*' + n.slice(2) : n.length === 2 ? n.charAt(0) + '*' : n; return n.slice(0, 20); }
    try { var lu = window.__lnLive && window.__lnLive.user; if (lu && !lu.is_anonymous) { var md = lu.user_metadata || {}; n = String(md.nickname || md.name || md.full_name || '').trim(); if (n) { n = n.length >= 3 ? n.charAt(0) + '*' + n.slice(2) : n.length === 2 ? n.charAt(0) + '*' : n; return n.slice(0, 20); } } } catch (e) {}
    var d = 0, u = D.uid || ''; for (var i = 0; i < u.length; i++) d = (d * 31 + u.charCodeAt(i)) % 10000; return '회원' + ('000' + d).slice(-4);
  }
  // 리딩 모음(live-data.js)과 같은 로그인 연결을 함께 써요. 카카오 로그인에서 돌아온 경우 여기서 마무리해요.
  function sharedAuth(c){
    if (window.__lnAuth) return window.__lnAuth;
    var sb = window.supabase.createClient(c.url, c.key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'leadingnote-auth', flowType: 'pkce', detectSessionInUrl: false } });
    var tw = window, url = null, code = null, err = null;
    try { if (window.top.location.href) tw = window.top; } catch (e) {}
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
    s.addEventListener('load', fn); s.addEventListener('error', function(){ log('supabase.js 를 불러오지 못했어요'); });
  }
  function start(){
    var c = cfg(); if (!c || !c.key) { log('서버 정보가 없어 이 기기 저장으로 동작해요'); return; }
    withLib(function(){
      var AU; try { AU = sharedAuth(c); D.sb = AU.sb; } catch (e) { log('연결 실패', e); return; }
      AU.ready.then(function(se){
        if (se) return se;
        return D.sb.auth.signInAnonymously().then(function(a){ if (a.error) { log('익명 로그인 꺼짐 — 읽기만 해요:', a.error.message); return null; } return a.data.session; });
      }).then(function(se){
        D.uid = se && se.user ? se.user.id : null;
        return q(D.sb.rpc('cm_vote_tally', { p_agenda: 'check' }));
      }).then(function(r){
        if (r.error) { log('표가 없어요 (supabase_setup.sql 실행 필요):', r.error.message); return; }
        D.ready = true;
        try {
          D.ch = D.sb.channel('community-live', { config: { presence: { key: D.uid || uuid() } } })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cm_chat' }, function(p){ if (p && p.new) D.chatFns.forEach(function(f){ try { f(p.new); } catch (e) {} }); })
            .on('presence', { event: 'sync' }, function(){ try { D.online = Object.keys(D.ch.presenceState()).length || 1; } catch (e) {} D.onlineFns.forEach(function(f){ try { f(); } catch (e) {} }); })
            .subscribe(function(st){ if (st === 'SUBSCRIBED') { try { D.ch.track({ at: Date.now() }); } catch (e) {} } });
        } catch (e) { log('실시간 연결 실패', e); }
        scan();
      });
    });
  }

  var API = {
    vote: function(ag, side, age){ if (!D.uid) return Promise.resolve({ error: { message: '익명 로그인 꺼짐' } }); return q(D.sb.from('cm_votes').upsert({ agenda_id: ag, user_id: D.uid, side: side, age_group: age }, { onConflict: 'agenda_id,user_id' })); },
    tally: function(ag){ return q(D.sb.rpc('cm_vote_tally', { p_agenda: ag })); },
    poll: function(pid, choice){ if (!D.uid) return Promise.resolve({ error: { message: '익명 로그인 꺼짐' } }); return q(choice == null ? D.sb.from('cm_polls').delete().eq('poll_id', pid).eq('user_id', D.uid) : D.sb.from('cm_polls').upsert({ poll_id: pid, user_id: D.uid, choice: String(choice) }, { onConflict: 'poll_id,user_id' })); },
    pollTally: function(pid){ return q(D.sb.rpc('cm_poll_tally', { p_poll: pid })); },
    opinion: function(o){ if (!D.uid) return Promise.resolve({ error: { message: '익명 로그인 꺼짐' } }); return q(D.sb.from('cm_opinions').upsert(Object.assign({ user_id: D.uid }, o), { onConflict: 'agenda_id,user_id' }).select('id').single()); },
    opinions: function(ag){ return q(D.sb.from('cm_opinions').select('id,user_id,nickname,age_group,side,body,created_at').eq('agenda_id', ag).order('created_at', { ascending: false }).limit(200)); },
    chatList: function(ag){ return q(D.sb.from('cm_chat').select('id,user_id,agenda_id,nickname,age_group,side,body,created_at').eq('agenda_id', ag).order('created_at', { ascending: false }).limit(100)); },
    chatSend: function(row){ if (!D.uid) return Promise.resolve({ error: { message: '익명 로그인 꺼짐' } }); return q(D.sb.from('cm_chat').insert(Object.assign({ user_id: D.uid }, row))); }
  };
  D.API = API;

  // ---- 커뮤니티 화면에 붙이기
  function patchFn(w, name, pairs){
    try {
      var src = String(w[name]); if (src.indexOf('function') !== 0) return false;
      var out = src, hit = 0;
      pairs.forEach(function(p){ if (out.indexOf(p[0]) > -1) { out = out.split(p[0]).join(p[1]); hit++; } });
      if (!hit) { log(name + ' 함수 모양이 달라 그대로 둬요'); return false; }
      w.eval(name + ' = ' + out); return true;
    } catch (e) { log(name + ' 바꾸기 실패', e); return false; }
  }
  function attach(f){
    var w, d; try { w = f.contentWindow; d = f.contentDocument; } catch (e) { return; }
    if (!w || !d || !d.body || w.__cmLive || !w.AG || !w.S || !w.P || typeof w.render !== 'function') return;
    w.__cmLive = true;
    var AG = w.AG, P = w.P, S = w.S, PRED_ID = 'pred-' + w.TODAY, CAND_ID = 'cand-' + AG.id;
    var SEED = { ages: JSON.parse(JSON.stringify(AG.ages)), up: w.PRED.up, down: w.PRED.down, cands: w.CANDS.map(function(c){ return c[1]; }) };
    if (SEED_OFF) {   // 미리 넣어 둔 숫자·예시 의견 없이 0부터
      SEED = { ages: SEED.ages.map(function(r){ return [r[0], 50, 0]; }), up: 0, down: 0, cands: SEED.cands.map(function(){ return 0; }) };
      if (w.OPS && w.OPS.length) w.OPS.length = 0;
      patchFn(w, 'tally', [['pa:Math.round(a/n*100)', 'pa:n?Math.round(a/n*100):50']]);
      patchFn(w, 'predTally', [['pu:Math.round(u/(u+d)*100)', 'pu:(u+d)?Math.round(u/(u+d)*100):50']]);
      patchFn(w, 'candList', [['Math.round(v/mx*100)', '(mx?Math.round(v/mx*100):0)']]);
      AG.ages = SEED.ages.map(function(r){ return r.slice(); }); w.PRED.up = 0; w.PRED.down = 0; w.CANDS.forEach(function(c){ c[1] = 0; });
    }
    var SYS = w.CHAT_SEED.filter(function(m){ return m.sys; });   // 운영자 안내만 남기고, 미리 적어 둔 대화는 빼요
    S.chat = SYS.map(function(m){ return Object.assign({}, m); }).concat((S.chat || []).filter(function(m){ return m.mine; }));
    w.__dbVoted = true;
    // 내 표를 두 번 세지 않게, 서버 의견을 목록에 합치게, 접속 수 문구를 실제로
    patchFn(w, 'liveTally', [['if(P.vote){', 'if(P.vote&&!window.__dbVoted){']]);
    patchFn(w, 'predTally', [["(P.pred==='up'?1:0)", "(P.pred==='up'&&!window.__dbVoted?1:0)"], ["(P.pred==='down'?1:0)", "(P.pred==='down'&&!window.__dbVoted?1:0)"]]);
    patchFn(w, 'candList', [['(P.cand===i?1:0)', '(P.cand===i&&!window.__dbVoted?1:0)']]);
    patchFn(w, 'allOps', [['if(P.myOp)o.unshift(P.myOp);return o}', 'o=o.concat(window.__remoteOps||[]);if(P.myOp)o.unshift(P.myOp);return o}']]);
    patchFn(w, 'liveSection', [['명 대화 중</span>', "'+(window.__dbVoted?'명 접속 중':'명 대화 중')+'</span>"]]);
    // 미리 적어 둔 대화·가짜 접속 수 끄기
    S.lq = w.LIVE_Q ? w.LIVE_Q.length : 999; S.typing = null;
    w.setOnline = function(){ S.online = Math.max(1, D.online || 1); ['lv-home', 'lv-detail'].forEach(function(id){ var el = d.getElementById(id + '-on'); if (el) el.textContent = S.online + '명 접속 중'; }); var t = d.getElementById('chat-on'); if (t) t.textContent = S.online + '명'; };
    S.online = Math.max(1, D.online || 1);
    D.onlineFns.push(function(){ w.setOnline(); });

    function mapChat(r){ var me = r.user_id === D.uid; return { id: 'db-' + r.id, mine: me, name: me ? '나' : r.nickname, age: r.age_group || '', side: r.side || '', text: r.body, at: hhmm(r.created_at), like: 0 }; }
    function saveOp(){
      if (!P.myOp || !P.vote) return Promise.resolve({});
      return API.opinion({ agenda_id: AG.id, nickname: nickname(), age_group: P.age, side: P.myOp.side || P.vote, body: P.myOp.text }).then(function(r){
        if (!r.error && r.data && r.data.id && P.myOp) { P.myOp.dbid = r.data.id; w.save(); } return r; });
    }
    function counts(withChat){
      var jobs = [API.tally(AG.id), API.pollTally(PRED_ID), API.pollTally(CAND_ID), API.opinions(AG.id)]; if (withChat) jobs.push(API.chatList(AG.id));
      return Promise.all(jobs).then(function(rs){
        var by = {}; (rs[0].data || []).forEach(function(r){ var x = by[r.age_group] = by[r.age_group] || { a: 0, n: 0 }; x.n += +r.n; if (r.side === 'a') x.a += +r.n; });
        AG.ages = SEED.ages.map(function(r){ var x = by[r[0]]; if (!x) return r.slice(); var a = Math.round(r[2] * r[1] / 100) + x.a, n = r[2] + x.n; return [r[0], n ? Math.round(a / n * 100) : r[1], n]; });
        var pc = {}; (rs[1].data || []).forEach(function(r){ pc[r.choice] = +r.n; }); w.PRED.up = SEED.up + (pc.up || 0); w.PRED.down = SEED.down + (pc.down || 0);
        var cc = {}; (rs[2].data || []).forEach(function(r){ cc[r.choice] = +r.n; }); w.CANDS.forEach(function(c, i){ c[1] = SEED.cands[i] + (cc[String(i)] || 0); });
        var ops = rs[3].data || [];
        w.__remoteOps = ops.filter(function(r){ return r.user_id !== D.uid; }).map(function(r){ return { id: 'db-' + r.id, name: r.nickname, age: r.age_group, side: r.side, like: 0, text: r.body }; });
        var mine = ops.filter(function(r){ return r.user_id === D.uid; })[0]; if (mine && P.myOp && P.myOp.dbid !== mine.id) { P.myOp.dbid = mine.id; w.save(); }
        if (withChat && rs[4] && !rs[4].error) { var rows = (rs[4].data || []).slice().reverse(); S.chat = SYS.map(function(m){ return Object.assign({}, m); }).concat(rows.map(mapChat)); }
        if (S.view !== 'chat' || withChat) w.render();
      });
    }
    var timer = null; function later(){ clearTimeout(timer); timer = setTimeout(function(){ counts(false); }, 400); }

    // 실시간: 다른 분 글이 바로 뜨게
    D.chatFns.push(function(r){ if (r.agenda_id !== AG.id || r.user_id === D.uid) return; if (S.chat.some(function(x){ return x.id === 'db-' + r.id; })) return; w.pushMsg(mapChat(r)); });
    // 내 글 보내기 (가짜 공감·가짜 답글 없이 서버로)
    d.addEventListener('submit', function(ev){
      if (!ev.target || ev.target.id !== 'chat-form') return; ev.preventDefault(); ev.stopImmediatePropagation();
      var i = d.getElementById('chat-in'), t = (i.value || '').trim();
      if (!t) { w.toast('보낼 말을 적어 주세요'); return; }
      if (w.blocked(t)) { w.toast('인터넷 주소·전화번호·단체방 주소는 올릴 수 없어요'); return; }
      var id = uuid(), m = { id: 'db-' + id, mine: true, name: '나', age: P.age, side: P.vote || '', text: t, at: w.hhmm(), like: 0 };
      i.value = ''; S.draft = ''; w.pushMsg(m);
      API.chatSend({ id: id, agenda_id: AG.id, nickname: nickname(), age_group: P.age, side: P.vote || null, body: t }).then(function(r){
        if (r.error) { w.toast(D.uid ? '보내지 못했어요. 잠시 뒤 다시 해 주세요' : '지금은 글을 저장할 수 없어요 (관리자 설정 필요)'); S.chat = S.chat.filter(function(x){ return x.id !== m.id; }); var el = d.getElementById('cm-' + m.id); if (el) el.remove(); }
      });
    }, true);
    // 투표·예측·후보·의견: 화면이 먼저 바뀐 뒤 서버에 저장
    d.addEventListener('click', function(ev){
      var b = ev.target.closest && ev.target.closest('[data-act]'); if (!b) return;
      var a = b.getAttribute('data-act'), job = null;
      if (a === 'vote') { job = API.vote(AG.id, P.vote, P.age); if (P.myOp) saveOp(); }
      else if (a === 'age') { if (P.vote) job = API.vote(AG.id, P.vote, P.age); if (P.myOp) saveOp(); }
      else if (a === 'post') job = saveOp();
      else if (a === 'pred') job = API.poll(PRED_ID, P.pred);
      else if (a === 'cand') job = API.poll(CAND_ID, P.cand);
      if (job) job.then(function(r){ if (r && r.error) w.toast(D.uid ? '서버에 저장하지 못했어요' : '지금은 이 기기에만 저장돼요'); later(); });
    });
    // 이 기기에 남아 있던 내 표·의견을 서버로 한 번 올리고, 실제 숫자로 다시 그리기
    var sync = [];
    if (P.vote) sync.push(API.vote(AG.id, P.vote, P.age));
    if (P.pred) sync.push(API.poll(PRED_ID, P.pred));
    if (P.cand != null) sync.push(API.poll(CAND_ID, P.cand));
    if (P.myOp && !P.myOp.dbid) sync.push(saveOp());
    Promise.all(sync).then(function(){ return counts(true); });
    d.addEventListener('visibilitychange', function(){ if (d.visibilityState === 'visible') counts(false); });
    log('연결됨 — 실제 투표·의견·실시간 토론으로 바뀌었어요');
  }
  function scan(){
    if (!D.ready) return;
    Array.prototype.forEach.call(document.querySelectorAll('iframe'), function(f){
      var src = (f.getAttribute('src') || '') + ' ' + (f.title || '');
      if (!/community|커뮤니티/.test(src)) return;
      if (!f.__cmLoad) { f.__cmLoad = true; f.addEventListener('load', function(){ setTimeout(function(){ attach(f); }, 50); }); }
      attach(f);
    });
  }
  new MutationObserver(function(){ scan(); }).observe(document.documentElement, { childList: true, subtree: true });
  start();
})();
