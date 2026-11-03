/* 리딩노트 운영실 · 전문가 의견 승인
   - 가져온 글(카카오톡·텔레그램)을 AI가 읽으면 종목마다 '승인 대기' 의견(매수·추가매수·보유·관망·비중축소·매도)이 생겨요.
   - 승인한 의견만 회원 화면 '전문가 의견' 계기판·막대·말풍선에 반영돼요. 입장은 승인 전에 고칠 수 있어요.
   - 방송 종목과 공개된 추천 기록은 이미 검수를 거쳐서 따로 승인할 필요 없이 자동으로 들어가요. */
(function(){
  var ST = { buy: '매수', add: '추가매수', hold: '보유', watch: '관망', reduce: '비중축소', sell: '매도' };
  var COL = { buy: '#e5484d', add: '#e5484d', hold: '#f59f00', watch: '#868e96', reduce: '#3b82f6', sell: '#3b82f6' };
  var V = { rows: null, k: 'pending', err: null, busy: false };
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function kt(iso){ var d = new Date(iso); if (isNaN(d)) return ''; var k = new Date(d.getTime() + 9 * 3600e3); return (k.getUTCMonth() + 1) + '/' + k.getUTCDate() + ' ' + ('0' + k.getUTCHours()).slice(-2) + ':' + ('0' + k.getUTCMinutes()).slice(-2); }
  function load(C){
    V.busy = true;
    return Promise.resolve(C.sb.from('stock_opinions').select('*').order('at', { ascending: false }).limit(500)).then(function(r){
      V.busy = false; if (r.error) { V.err = r.error.message; V.rows = []; return; }
      V.rows = r.data || []; V.err = null;
      var codes = {}; V.rows.forEach(function(o){ if (!C.S.names[o.stock_code]) codes[o.stock_code] = 1; });
      var miss = Object.keys(codes);
      if (!miss.length) return;
      return Promise.resolve(C.sb.from('stocks').select('code,name').in('code', miss.slice(0, 300))).then(function(r2){ (r2.data || []).forEach(function(s){ C.S.names[s.code] = s.name; }); });
    }, function(e){ V.busy = false; V.err = String(e); V.rows = []; });
  }
  function set(C, ids, status, stance){
    return Promise.resolve(C.sb.rpc('ops_opinion_set', { p_ids: ids, p_status: status, p_stance: stance || null })).then(function(r){ if (r.error) throw r.error; return r.data; });
  }
  window.vOpinion = function(m, C){
    if (!V.rows) { m.innerHTML = '<h2>전문가 의견</h2><div class="card empty">불러오는 중이에요…</div>'; load(C).then(function(){ window.vOpinion(m, C); }); return; }
    var R = V.rows, cnt = { pending: 0, approved: 0, rejected: 0 }; R.forEach(function(o){ cnt[o.status]++; });
    var L = R.filter(function(o){ return o.status === V.k; });
    var hi = R.filter(function(o){ return o.status === 'pending' && Number(o.confidence) >= 0.8; });
    var h = '<h2>전문가 의견<span class="cnt">' + cnt.pending + '개 대기</span></h2>' +
      '<p class="lead">가져온 글에서 AI가 찾은 전문가의 종목별 입장이에요. <b>승인한 의견만</b> 회원 화면 종목 페이지의 \'전문가 의견\' 계기판과 말풍선에 나와요. 회원 질문은 닉네임 없이 보여요. 방송 종목과 공개된 추천 기록은 자동으로 함께 반영돼요.</p>' +
      (V.err ? '<div class="msg warn">의견 표를 읽지 못했어요: ' + esc(V.err) + '</div>' : '') +
      '<div class="tb"><div class="chips">' + [['pending', '승인 대기'], ['approved', '승인됨'], ['rejected', '거절됨']].map(function(c){ return '<button type="button" class="chip' + (V.k === c[0] ? ' on' : '') + '" data-ok="' + c[0] + '">' + c[1] + '<em>' + cnt[c[0]] + '</em></button>'; }).join('') + '</div>' +
      '<button class="btn s" id="opr" style="margin-left:auto">새로고침</button></div>' +
      (V.k === 'pending' && hi.length ? '<div class="cnt-line"><button class="btn p s" id="opall">AI 확신 80% 이상 ' + hi.length + '개 모두 승인</button></div>' : '');
    if (!L.length) h += '<div class="card empty">' + (V.k === 'pending' ? '승인할 의견이 없어요. 카카오톡 파일을 올리거나 텔레그램 글이 모이면 AI가 읽은 뒤 여기에 쌓여요.' : '아직 없어요.') + '</div>';
    L.slice(0, 200).forEach(function(o){
      h += '<div class="card" data-o="' + o.id + '"><div class="ev"><div class="top"><b>' + esc(C.exName(o.expert_id)) + '</b>' +
        '<span class="src">' + esc(C.S.names[o.stock_code] || '') + ' ' + esc(o.stock_code) + '</span>' +
        '<select class="ost" aria-label="의견 종류" style="width:auto;padding:4px 8px;font-weight:800;color:' + COL[o.stance] + '">' + Object.keys(ST).map(function(k){ return '<option value="' + k + '"' + (k === o.stance ? ' selected' : '') + '>' + ST[k] + '</option>'; }).join('') + '</select>' +
        (o.confidence != null ? '<span class="tag">AI 확신 ' + Math.round(o.confidence * 100) + '%</span>' : '') + '</div>' +
        '<div class="src">' + kt(o.at) + ' · ' + esc(o.src_label || '') + (o.src_url ? ' · <a href="' + esc(o.src_url) + '" target="_blank" rel="noopener noreferrer">원문 ↗</a>' : '') + '</div>' +
        (o.question ? '<div class="quote" style="background:var(--bg)"><span class="src">회원 질문 (' + kt(o.q_at) + ')</span><br>' + esc(o.question) + '</div>' : '') +
        '<div class="quote">' + esc(o.quote || '') + '</div>' +
        '<div class="acts">' + (o.status !== 'approved' ? '<button class="btn p s oa">승인</button>' : '') + (o.status !== 'rejected' ? '<button class="btn bad s orj">거절</button>' : '') + (o.status !== 'pending' ? '<button class="btn s opd">대기로 되돌리기</button>' : '') + '</div></div></div>';
    });
    if (L.length > 200) h += '<p class="hint">앞의 200개만 보여요. 처리하면 다음 것이 이어서 보여요.</p>';
    m.innerHTML = h;
    Array.prototype.forEach.call(m.querySelectorAll('[data-ok]'), function(b){ b.onclick = function(){ V.k = b.getAttribute('data-ok'); window.vOpinion(m, C); }; });
    var rr = m.querySelector('#opr'); if (rr) rr.onclick = function(){ V.rows = null; window.vOpinion(m, C); };
    var all = m.querySelector('#opall');
    if (all) all.onclick = function(){ all.disabled = true; set(C, hi.map(function(o){ return o.id; }), 'approved').then(function(n){ hi.forEach(function(o){ o.status = 'approved'; }); C.flash('ok', n + '개 의견을 승인했어요. 회원 화면에 바로 반영돼요.'); window.vOpinion(m, C); }).catch(function(e){ all.disabled = false; C.flash('bad', e.message || String(e)); }); };
    Array.prototype.forEach.call(m.querySelectorAll('.card[data-o]'), function(c){
      var o = R.filter(function(x){ return String(x.id) === c.getAttribute('data-o'); })[0], sel = c.querySelector('.ost');
      var act = function(status){ return function(){ var stance = sel.value; set(C, [o.id], status, stance !== o.stance ? stance : null).then(function(){ o.status = status; o.stance = stance; window.vOpinion(m, C); }).catch(function(e){ C.flash('bad', e.message || String(e)); }); }; };
      var a = c.querySelector('.oa'), j = c.querySelector('.orj'), p = c.querySelector('.opd');
      if (a) a.onclick = act('approved'); if (j) j.onclick = act('rejected'); if (p) p.onclick = act('pending');
      sel.onchange = function(){ sel.style.color = COL[sel.value]; };
    });
  };
})();
