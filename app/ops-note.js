/* 리딩노트 운영실 · 노트 (커뮤니티 자리 · 참여형 3코너)
   - 글: AI가 정해진 시간에 미리 만들어 둔 글을 보고 고쳐요. 게시 취소 · 초안으로 내리기 · 정답 지금 공개 · 공식 댓글 달기.
   - 검토 대기: 링크·전화번호·금지어·신고로 자동으로 가려진 댓글을 공개하거나 지워요. 회원 정지도 여기서.
   - 금지어 · 설정(참여자 수 기준 · 자동 숨김 신고 수 · 예전 커뮤니티 켜기 · 휴장일 · 정지 회원 · 이번 주 일정 자료).
   - 서버에는 필요한 만큼만 물어요: 처음엔 글·검토 대기 2번, 금지어·설정은 그 탭을 열 때. 누른 결과는 화면에서 바로 고쳐요.
   서버 함수: ops_note_* (sql/06_노트.sql) · ops.html이 '노트' 메뉴를 처음 열 때 이 파일을 불러요 */
(function(){
  var CN = { why: '왜 올랐게?', theme: '오늘의 테마', week: '이번 주 일정' };
  var V = { tab: 'post', posts: null, held: null, words: null, cfg: null, week: null, hol: null, bans: null, open: null, newp: null, cms: {}, err: null };
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function kt(iso){ var d = new Date(iso); if (isNaN(d)) return '—'; var k = new Date(d.getTime() + 9 * 3600e3); return (k.getUTCMonth() + 1) + '/' + k.getUTCDate() + ' ' + ('0' + k.getUTCHours()).slice(-2) + ':' + ('0' + k.getUTCMinutes()).slice(-2); }
  function toLocal(iso){ if (!iso) return ''; var d = new Date(iso); if (isNaN(d)) return ''; var k = new Date(d.getTime() + 9 * 3600e3); return k.toISOString().slice(0, 16); }
  function fromLocal(v){ return v ? new Date(v + ':00+09:00').toISOString() : null; }  // 입력은 한국 시각으로 읽어요
  function rpc(C, fn, args){ return Promise.resolve(C.sb.rpc(fn, args || {})).then(function(r){ if (r.error) throw r.error; return r.data; }); }
  function err(e){ return String((e && e.message) || e || '').replace(/^.*?exception:\s*/i, ''); }

  function state(p){
    if (p.status === 'cancelled') return ['취소', 'color:var(--bad)'];
    if (p.status === 'draft') return ['초안 · 안 보여요', 'color:var(--warn)'];
    return new Date(p.publish_at) > new Date() ? ['예약 ' + kt(p.publish_at), ''] : ['공개 중', 'color:var(--ok)'];
  }
  function load(C, what){
    var jobs = [];
    if (!what || what === 'post') jobs.push(rpc(C, 'ops_note_feed', { p_days: 21 }).then(function(d){ V.posts = d || []; }));
    if (!what || what === 'held') jobs.push(rpc(C, 'ops_note_comments', { p_state: 'held', p_post: null }).then(function(d){ V.held = d || []; }));
    if (what === 'words') jobs.push(rpc(C, 'ops_note_words', { p_add: [], p_del: [] }).then(function(d){ V.words = d || []; }));
    if (what === 'cfg') jobs.push(rpc(C, 'note_cfg').then(function(d){ V.cfg = d || {}; }), rpc(C, 'ops_note_week_src', { p_text: null }).then(function(d){ V.week = d || {}; }),
      rpc(C, 'ops_note_holidays', { p_days: null }).then(function(d){ V.hol = d || []; }), rpc(C, 'ops_note_bans').then(function(d){ V.bans = d || []; }));
    return Promise.all(jobs).then(function(){ V.err = null; }, function(e){ V.err = err(e); });
  }

  var CSS = '.nban{display:flex;align-items:center;gap:10px}.nban>span{flex:1;min-width:0}.nban .btn{flex:none;width:auto}.ncm{border-top:1px solid var(--line);padding-top:10px;margin-top:10px}.ncm:first-child{border:0;padding-top:0;margin-top:0}.nchips{margin-bottom:12px}.nwx{border:0;background:none;color:var(--sub);cursor:pointer;padding:0 0 0 4px;font-size:13px}';
  window.vNote = function(m, C){
    if (!document.getElementById('ops-note-css')) { var st = document.createElement('style'); st.id = 'ops-note-css'; st.textContent = CSS; document.head.appendChild(st); }
    if (!V.posts && !V.err) { m.innerHTML = '<h2>노트</h2><div class="card empty">불러오는 중이에요…</div>'; load(C).then(function(){ window.vNote(m, C); }); return; }
    var h = '<h2>노트 <span class="cnt">' + (V.held && V.held.length ? '검토 대기 ' + V.held.length : '') + '</span></h2>' +
      '<p class="lead">AI가 정해진 시간에 미리 만든 글이에요 (왜 올랐게? 평일 08:00 · 정답 16:40 / 오늘의 테마 평일 16:00 / 이번 주 일정 월 07:30). 게시된 뒤에도 고칠 수 있어요.</p>';
    if (V.err) h += '<div class="msg bad">' + esc(V.err) + ' · sql/06_노트.sql 을 실행했는지 확인해 주세요.</div>';
    h += '<div class="chips nchips">' + [['post', '글'], ['held', '검토 대기' + (V.held && V.held.length ? ' ' + V.held.length : '')], ['words', '금지어'], ['cfg', '설정']].map(function(t){
      return '<button class="chip' + (V.tab === t[0] ? ' on' : '') + '" data-nt="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
    var need = { words: !V.words, cfg: !V.cfg }[V.tab];   // 금지어·설정은 그 탭을 처음 열 때 불러요
    if (need && !V.err) { m.innerHTML = h + '<div class="card empty">불러오는 중이에요…</div>'; load(C, V.tab).then(function(){ window.vNote(m, C); }); return; }
    h += ({ post: vPosts, held: vHeld, words: vWords, cfg: vCfg })[V.tab]();
    m.innerHTML = h;
    bind(m, C);
  };

  // ── 글 목록
  function vPosts(){
    var P = V.posts || [];
    var h = '<div class="acts" style="margin:8px 0 12px"><button class="btn s" data-nn="why">+ 왜 올랐게? 직접 쓰기</button><button class="btn s" data-nn="theme">+ 오늘의 테마</button><button class="btn s" data-nn="week">+ 이번 주 일정</button></div>' +
      '<p class="hint">AI 글을 다시 만들려면 GitHub → Actions → note-gen → Run workflow 에서 코너를 골라 실행해요.</p>';
    if (V.open === 'new') h += form(V.newp);
    if (!P.length) return h + '<div class="card empty">아직 글이 없어요. AI 작성기가 처음 돌면 여기에 나와요.</div>';
    return h + P.map(function(p){
      var st = state(p), b = p.body || {};
      var warn = p.ai_warn && p.ai_warn.length ? '<div class="msg warn">AI 점검: ' + esc([].concat(p.ai_warn).join(' · ')) + '</div>' : '';
      var detail = p.corner === 'why' ? '<div class="kv"><span><b>종목</b>' + esc(b.name || '—') + ' ' + esc(b.code || '') + ' ' + (b.pct != null ? (b.pct > 0 ? '+' : '') + b.pct + '%' : '') + '</span><span><b>정답 공개</b>' + kt(p.reveal_at) + '</span><span><b>정답 댓글</b>' + (p.n_answer || 0) + '개</span></div>' +
          '<div class="quote">정답: ' + esc(p.answer || '(없음)') + '</div><div class="src">판정 낱말: ' + esc((p.answer_keys || []).join(', ') || '—') + ' · 근거: ' + ((p.answer_src || []).map(function(s){ return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.label) + ' ↗</a>'; }).join(' ') || '—') + '</div>'
        : p.corner === 'theme' ? '<div class="quote">' + esc((b.lines || []).join(' / ')) + '</div>' + (p.result_line ? '<div class="src">결과 한 줄: ' + esc(p.result_line) + '</div>' : '')
        : '<div class="quote">' + esc((b.items || []).map(function(i){ return i.d + ' ' + i.what + (i.res ? ' → ' + i.res : ''); }).join(' / ')) + '</div>';
      return '<div class="card"><div class="ev"><div class="top"><b>' + esc(CN[p.corner]) + ' · ' + esc(p.post_day) + '</b><span class="tag" style="' + st[1] + '">' + st[0] + '</span>' + (p.made_by === 'op' ? '<span class="tag">직접 씀</span>' : '<span class="tag">AI</span>') + (p.n_held ? '<span class="tag" style="color:var(--warn)">검토 대기 ' + p.n_held + '</span>' : '') + '</div>' +
        '<div style="font-weight:700;margin:4px 0">' + esc(p.title) + '</div>' + (p.question ? '<div class="src">질문: ' + esc(p.question) + '</div>' : '') + detail + warn +
        '<div class="src">댓글 ' + (p.n_shown || 0) + '개 · 게시 ' + kt(p.publish_at) + (p.edited_at ? ' · 고침 ' + kt(p.edited_at) : '') + '</div>' +
        '<div class="acts">' +
          '<button class="btn s" data-ne="' + p.id + '">' + (V.open === p.id ? '닫기' : '고치기') + '</button>' +
          '<button class="btn s" data-nc="' + p.id + '">' + (V.cms[p.id] ? '댓글 닫기' : '댓글 보기') + '</button>' +
          (p.status !== 'scheduled' ? '<button class="btn p s" data-ns="' + p.id + ':scheduled">게시하기</button>' : '<button class="btn s" data-ns="' + p.id + ':draft">초안으로 내리기</button>') +
          (p.status !== 'cancelled' ? '<button class="btn bad s" data-ns="' + p.id + ':cancelled">게시 취소</button>' : '') +
          (p.corner === 'why' && p.reveal_at && new Date(p.reveal_at) > new Date() ? '<button class="btn s" data-nr="' + p.id + '">정답 지금 공개</button>' : '') +
        '</div>' +
        '</div>' + (V.open === p.id ? form(p) : '') + (V.cms[p.id] ? vPostComments(p) : '') + '</div>';
    }).join('');
  }
  function form(p){
    var b = p.body || {}, c = p.corner;
    var f = '<div class="card" data-nf="' + (p.id || 'new') + '" style="margin-top:10px">' +
      (p.id ? '' : '<p class="hint">새 글은 초안으로 저장돼요. 확인한 뒤 \'게시하기\'를 누르세요.</p>') +
      fld('제목', 'title', p.title) + fld('질문(댓글 유도 문구)', 'question', p.question) +
      '<label class="f"><b>게시 시각</b><input type="datetime-local" name="publish_at" value="' + toLocal(p.publish_at) + '"></label>';
    if (c === 'why') f += '<label class="f"><b>정답 공개 시각</b><input type="datetime-local" name="reveal_at" value="' + toLocal(p.reveal_at) + '"></label>' +
      '<div class="row">' + fld('종목코드', 'b_code', b.code) + fld('종목명', 'b_name', b.name) + '</div><div class="row">' + fld('등락률(%)', 'b_pct', b.pct) + fld('어제 종가', 'b_close', b.close) + '</div>' + fld('등락률 자료 출처', 'b_src', b.src) +
      area('정답 (공개 시각 전에는 회원에게 안 보여요)', 'answer', p.answer, 2) +
      area('근거 링크 (한 줄에 하나: 이름 | https://주소)', 'answer_src', (p.answer_src || []).map(function(s){ return s.label + ' | ' + s.url; }).join('\n'), 2) +
      fld('정답 판정 낱말 (쉼표로 · 댓글에 이 낱말이 있으면 정답 후보)', 'answer_keys', (p.answer_keys || []).join(', '));
    if (c === 'theme') f += fld('테마 이름', 'b_name', b.name) + area('오른 배경 3줄 (한 줄에 하나)', 'b_lines', (b.lines || []).join('\n'), 3) + fld('결과 한 줄 (다음 날 붙어요)', 'result_line', p.result_line);
    if (c === 'week') f += area('일정 (한 줄에 하나: 날짜 | 내용 | 결과는 지난 뒤에)', 'b_items', (b.items || []).map(function(i){ return [i.d, i.what, i.res || ''].join(' | '); }).join('\n'), 5);
    return f + '<div class="acts"><button class="btn p" data-nsave="' + (p.id || 'new') + '">저장</button></div></div>';
  }
  function fld(lb, n, v){ return '<label class="f"><b>' + lb + '</b><input type="text" name="' + n + '" value="' + esc(v == null ? '' : v) + '"></label>'; }
  function area(lb, n, v, r){ return '<label class="f"><b>' + lb + '</b><textarea name="' + n + '" rows="' + r + '">' + esc(v || '') + '</textarea></label>'; }
  function read(box, base){
    var g = function(n){ var el = box.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : null; };
    var c = base.corner, p = { id: base.id || null, corner: c, post_day: base.post_day, title: g('title'), question: g('question') || '', publish_at: fromLocal(g('publish_at')) };
    if (!p.title) throw new Error('제목을 적어 주세요');
    if (!p.publish_at) throw new Error('게시 시각을 정해 주세요');
    if (!p.id) { p.status = 'draft'; p.post_day = g('publish_at').slice(0, 10); }
    if (c === 'why') {
      p.reveal_at = fromLocal(g('reveal_at'));
      var pc = parseFloat(g('b_pct'));
      p.body = { code: g('b_code'), name: g('b_name'), pct: isNaN(pc) ? null : pc, close: g('b_close'), src: g('b_src') };
      if (p.body.code && !/^[0-9A-Z]{6}$/.test(p.body.code)) throw new Error('종목코드는 6자리로 적어 주세요');
      p.answer = g('answer') || null;
      p.answer_src = (g('answer_src') || '').split('\n').map(function(l){ var i = l.indexOf('|'); return i < 0 ? null : { label: l.slice(0, i).trim(), url: l.slice(i + 1).trim() }; }).filter(function(s){ return s && /^https:\/\//.test(s.url); });
      p.answer_keys = (g('answer_keys') || '').split(',').map(function(s){ return s.trim(); }).filter(Boolean);
    }
    if (c === 'theme') { p.body = Object.assign({}, base.body || {}, { name: g('b_name'), lines: (g('b_lines') || '').split('\n').map(function(s){ return s.trim(); }).filter(Boolean).slice(0, 3) }); p.result_line = g('result_line') || null; }
    if (c === 'week') p.body = { items: (g('b_items') || '').split('\n').map(function(l){ var a = l.split('|').map(function(s){ return s.trim(); }); return a[0] && a[1] ? { d: a[0], what: a[1], res: a[2] || '' } : null; }).filter(Boolean) };
    return p;
  }

  // ── 글 하나의 댓글
  function vPostComments(p){
    var L = V.cms[p.id];
    if (L === true) return '<div class="card empty">불러오는 중이에요…</div>';
    var h = '<div class="card" style="margin-top:10px"><div class="row"><input type="text" data-nob="' + p.id + '" placeholder="공식 댓글 (AI 해설 · 운영자)"><button class="btn s" data-nof="' + p.id + ':op">운영자로 달기</button><button class="btn s" data-nof="' + p.id + ':ai">AI 해설로 달기</button></div>';
    if (!L.length) return h + '<p class="hint">댓글이 없어요.</p></div>';
    return h + L.map(function(c){ return cmtRow(c, p.corner); }).join('') + '</div>';
  }
  function cmtRow(c, corner){
    var st = { shown: '보이는 중', held: '검토 대기', hidden: '숨김', deleted: '지움' }[c.state];
    return '<div class="ev ncm"><div class="top"><b>' + esc(c.nick) + '</b>' + (c.badge ? '<span class="tag">' + (c.badge === 'ai' ? 'AI 해설' : '운영자') + '</span>' : '') + '<span class="tag">' + st + '</span>' +
      (c.held_why ? '<span class="tag" style="color:var(--bad)">' + esc(c.held_why) + '</span>' : '') + (c.reports ? '<span class="tag">신고 ' + c.reports + '</span>' : '') +
      (c.is_answer ? '<span class="tag" style="color:var(--ok)">✓ 정답</span>' : '') + (c.banned ? '<span class="tag" style="color:var(--bad)">정지 회원</span>' : '') + '</div>' +
      (c.title ? '<div class="src">' + esc(CN[c.corner] || '') + ' · ' + esc(c.title) + '</div>' : '') +
      '<div class="quote">' + esc(c.body) + '</div>' + (c.pick ? '<div class="src">⭐ 잘 짚은 댓글: ' + esc(c.pick) + '</div>' : '') + '<div class="src">' + kt(c.at) + '</div>' +
      '<div class="acts">' +
        (c.state !== 'shown' ? '<button class="btn p s" data-ncs="' + c.id + ':shown">공개</button>' : '<button class="btn s" data-ncs="' + c.id + ':hidden">숨김</button>') +
        (c.state !== 'deleted' ? '<button class="btn bad s" data-ncs="' + c.id + ':deleted">삭제</button>' : '') +
        ((corner || c.corner) === 'why' && !c.badge ? '<button class="btn s" data-nca="' + c.id + ':' + (c.is_answer ? '0' : '1') + '">' + (c.is_answer ? '정답 표시 빼기' : '정답으로 표시') + '</button>' : '') +
        ((corner || c.corner) === 'week' && !c.badge ? '<button class="btn s" data-npk="' + c.id + '">' + (c.pick ? '잘 짚은 댓글 빼기' : '잘 짚은 댓글로') + '</button>' : '') +
        (c.uid ? (c.banned ? '<button class="btn s" data-nunb="' + c.uid + '">정지 풀기</button>' : '<button class="btn bad s" data-nban="' + c.uid + ':7">7일 정지</button><button class="btn bad s" data-nban="' + c.uid + ':0">계속 정지</button>') : '') +
      '</div></div>';
  }
  function vHeld(){
    var L = V.held || [];
    return '<p class="hint" style="margin:8px 0">링크·전화번호·금지어가 들었거나 신고가 모인 댓글이에요. 공개하면 바로 보여요.</p>' +
      (L.length ? '<div class="card">' + L.map(function(c){ return cmtRow(c); }).join('') + '</div>' : '<div class="card empty">검토할 댓글이 없어요.</div>');
  }
  function vWords(){
    return '<div class="card"><p class="hint">댓글에 이 낱말이 있으면 자동으로 검토 대기가 돼요. 띄어쓰기는 무시하고 찾아요. 링크·전화번호는 따로 늘 걸러요.</p>' +
      '<div class="chips" style="flex-wrap:wrap">' + (V.words || []).map(function(w){ return '<span class="chip">' + esc(w) + ' <button class="nwx" data-nwd="' + esc(w) + '" aria-label="' + esc(w) + ' 빼기">✕</button></span>'; }).join('') + '</div>' +
      '<div class="row" style="margin-top:10px"><input type="text" id="nwadd" placeholder="금지어 (쉼표로 여러 개)"><button class="btn p" data-nwa="1">더하기</button></div></div>';
  }
  function vCfg(){
    var c = V.cfg || {};
    return '<div class="card">' +
      '<label class="f"><b>참여자 수 표시 기준</b><i>이 숫자 이상일 때만 \'N명 참여\'를 보여요</i><input type="text" inputmode="numeric" id="ncmin" value="' + esc(c.min_count) + '"></label>' +
      '<label class="f"><b>자동 숨김 신고 수</b><i>신고가 이만큼 모이면 검토 대기로 보내요</i><input type="text" inputmode="numeric" id="ncrep" value="' + esc(c.report_hide) + '"></label>' +
      '<div class="row"><span style="flex:1"><b>예전 커뮤니티(토론·실시간) 다시 켜기</b><br><span class="hint">켜면 전체 메뉴에 \'커뮤니티\'가 다시 나와요. 아래 5탭 자리는 노트 그대로예요.</span></span><button class="tgl" id="nccm" aria-pressed="' + (!!c.cm_on) + '" aria-label="예전 커뮤니티 켜기"></button></div>' +
      '<div class="acts"><button class="btn p" data-ncfg="1">저장</button></div></div>' +
      '<div class="card"><b>휴장일</b><p class="hint">적은 날에는 \'왜 올랐게?\'·\'오늘의 테마\'를 만들지 않아요. 이번 주 일정 글은 그대로 올라와요.</p>' +
      '<div class="chips" style="flex-wrap:wrap">' + ((V.hol || []).map(function(d){ return '<span class="chip">' + esc(d) + ' <button class="nwx" data-nhd="' + esc(d) + '" aria-label="' + esc(d) + ' 빼기">✕</button></span>'; }).join('') || '<span class="hint">아직 없어요</span>') + '</div>' +
      '<div class="row" style="margin-top:10px"><input type="date" id="nhadd"><button class="btn p" data-nha="1">더하기</button></div></div>' +
      '<div class="card"><b>정지 회원</b>' + ((V.bans || []).length ? (V.bans || []).map(function(b){ return '<div class="ncm nban"><span><b>' + esc(b.nick) + '</b> <span class="tag">' + (b.until ? kt(b.until) + '까지' : '계속') + '</span><br><span class="hint">' + esc(b.reason) + '</span></span><button class="btn s" data-nunb="' + esc(b.uid) + '">정지 풀기</button></div>'; }).join('') : '<p class="hint">정지된 회원이 없어요.</p>') + '</div>' +
      '<div class="card"><label class="f"><b>이번 주 일정 자료</b><i>월요일 07:10에 AI가 이 줄들로 \'이번 주 일정\' 글을 만들어요. 한 줄에 하나: 날짜 | 내용 (예: 11/27(목) | 미국 추수감사절 휴장). 지난 일정의 결과는 글 \'고치기\'에서 적어요.</i>' +
      '<textarea id="nwk" rows="7" maxlength="3000">' + esc((V.week || {}).text || '') + '</textarea></label>' +
      '<p class="hint">' + ((V.week || {}).at ? '마지막 저장 ' + kt(V.week.at) : '아직 적은 자료가 없어요') + '</p>' +
      '<div class="acts"><button class="btn p" data-nwks="1">일정 자료 저장</button></div></div>';
  }

  // ── 누르기
  function bind(m, C){
    function redo(what, msg){ return load(C, what).then(function(){ if (msg) C.flash('ok', msg); window.vNote(m, C); }); }
    function fail(e){ C.flash('bad', err(e)); window.vNote(m, C); }
    m.onclick = function(e){
      var t = e.target.closest('button'); if (!t) return;
      var d = t.dataset, a;
      if (d.nt) { V.tab = d.nt; window.vNote(m, C); return; }
      if (d.nn) { V.open = 'new'; V.newp = { corner: d.nn, body: {}, publish_at: null }; window.vNote(m, C); return; }
      if (d.ne) { V.open = V.open === +d.ne ? null : +d.ne; window.vNote(m, C); return; }
      if (d.nsave) {
        var box = t.closest('[data-nf]'), base = d.nsave === 'new' ? V.newp : V.posts.filter(function(p){ return p.id === +d.nsave; })[0], p;
        try { p = read(box, base); } catch (x) { C.flash('bad', x.message); window.vNote(m, C); return; }
        t.disabled = true; rpc(C, 'ops_note_save', { p: p }).then(function(){ V.open = null; return redo('post', '저장했어요'); }, fail); return;
      }
      if (d.ns) { a = d.ns.split(':'); rpc(C, 'ops_note_save', { p: { id: +a[0], status: a[1] } }).then(function(){ postOf(+a[0]).status = a[1]; done({ scheduled: '게시했어요', draft: '초안으로 내렸어요', cancelled: '게시를 취소했어요' }[a[1]]); }, fail); return; }
      if (d.nr) { if (!confirm('정답을 지금 공개할까요? 공개하면 댓글이 마감돼요.')) return; var now = new Date().toISOString(); rpc(C, 'ops_note_save', { p: { id: +d.nr, reveal_at: now } }).then(function(){ postOf(+d.nr).reveal_at = now; done('정답을 공개했어요'); }, fail); return; }
      if (d.nc) { var id = +d.nc; if (V.cms[id]) { delete V.cms[id]; window.vNote(m, C); return; } V.cms[id] = true; window.vNote(m, C);
        rpc(C, 'ops_note_comments', { p_state: null, p_post: id }).then(function(L){ V.cms[id] = L || []; window.vNote(m, C); }, function(x){ delete V.cms[id]; fail(x); }); return; }
      if (d.nof) { a = d.nof.split(':'); var inp = m.querySelector('[data-nob="' + a[0] + '"]'), body = inp && inp.value.trim(); if (!body) { C.flash('bad', '댓글 내용을 적어 주세요'); window.vNote(m, C); return; }
        rpc(C, 'ops_note_official', { p_post: +a[0], p_badge: a[1], p_body: body }).then(function(){ var P = postOf(+a[0]); P.n_shown = (P.n_shown || 0) + 1; return rpc(C, 'ops_note_comments', { p_state: null, p_post: +a[0] }); })
          .then(function(L){ V.cms[+a[0]] = L || []; done('공식 댓글을 달았어요'); }, fail); return; }
      if (d.ncs) { a = d.ncs.split(':'); setC(+a[0], { state: a[1] }, { shown: '공개했어요', hidden: '숨겼어요', deleted: '지웠어요' }[a[1]]); return; }
      if (d.nca) { a = d.nca.split(':'); setC(+a[0], { is_answer: a[1] === '1' }, a[1] === '1' ? '정답으로 표시했어요' : '정답 표시를 뺐어요'); return; }
      if (d.npk) { var cur = findC(+d.npk), why = cur && cur.pick ? '' : prompt('왜 잘 짚었는지 한 줄로 적어 주세요 (화면에 보여요)', '일정의 영향을 미리 짚었어요'); if (why === null) return; setC(+d.npk, { pick: why }, why ? '잘 짚은 댓글로 골랐어요' : '뺐어요'); return; }
      if (d.nban) { a = d.nban.split(':'); var r = prompt('정지 이유 (회원에게는 보이지 않아요)', '운영 정책 위반'); if (r === null) return;
        rpc(C, 'ops_note_ban', { p_uid: a[0], p_reason: r, p_days: a[1] === '0' ? null : +a[1] }).then(function(){
          patchC(function(c){ return c.uid === a[0] && (c.state === 'shown' || c.state === 'held'); }, { state: 'hidden' }); eachC(function(c){ if (c.uid === a[0]) c.banned = true; });
          V.cfg = null; done('정지했어요. 이 회원의 댓글은 모두 숨겼어요'); }, fail); return; }   // 설정 탭(정지 회원 목록)은 다음에 열 때 새로 불러요
      if (d.nunb) { if (!confirm('정지를 풀까요? 숨긴 댓글은 그대로예요.')) return;
        rpc(C, 'ops_note_unban', { p_uid: d.nunb }).then(function(){ eachC(function(c){ if (c.uid === d.nunb) c.banned = false; }); V.bans = (V.bans || []).filter(function(b){ return b.uid !== d.nunb; }); done('정지를 풀었어요'); }, fail); return; }
      if (d.nhd || d.nha) { var hv = d.nhd ? (V.hol || []).filter(function(x){ return x !== d.nhd; }) : (V.hol || []).concat([m.querySelector('#nhadd').value]).filter(Boolean);
        rpc(C, 'ops_note_holidays', { p_days: hv }).then(function(v){ V.hol = v || []; done(d.nhd ? '뺐어요' : '더했어요'); }, fail); return; }
      if (d.nwd) { rpc(C, 'ops_note_words', { p_add: [], p_del: [d.nwd] }).then(function(w){ V.words = w; done(); }, fail); return; }
      if (d.nwa) { var v = (m.querySelector('#nwadd').value || '').split(',').map(function(s){ return s.trim(); }).filter(Boolean); if (!v.length) return;
        rpc(C, 'ops_note_words', { p_add: v, p_del: [] }).then(function(w){ V.words = w; done('더했어요'); }, fail); return; }
      if (d.nwks) { rpc(C, 'ops_note_week_src', { p_text: m.querySelector('#nwk').value }).then(function(v){ V.week = v; done('일정 자료를 저장했어요'); }, fail); return; }
      if (t.id === 'nccm') { t.setAttribute('aria-pressed', t.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); return; }
      if (d.ncfg) { var mn = parseInt(m.querySelector('#ncmin').value, 10), rp = parseInt(m.querySelector('#ncrep').value, 10);
        if (!(mn >= 1 && mn <= 1000) || !(rp >= 1 && rp <= 100)) { C.flash('bad', '숫자를 확인해 주세요 (참여자 1~1000, 신고 1~100)'); window.vNote(m, C); return; }
        rpc(C, 'ops_note_cfg', { p: { min_count: mn, report_hide: rp, cm_on: m.querySelector('#nccm').getAttribute('aria-pressed') === 'true' } }).then(function(v){ V.cfg = v; done('저장했어요 · 회원 화면에는 10분 안에 반영돼요'); }, fail); }
    };
    function done(msg){ if (msg) C.flash('ok', msg); window.vNote(m, C); }
    function postOf(id){ return (V.posts || []).filter(function(p){ return p.id === id; })[0] || {}; }
    // 같은 댓글이 검토 대기 목록과 글별 목록에 따로 들어 있을 수 있어요. 둘 다 고치고, 글의 숫자(댓글·검토 대기·정답)는 한 번만 고쳐요.
    function eachC(fn){ [V.held || []].concat(Object.keys(V.cms).map(function(k){ return Array.isArray(V.cms[k]) ? V.cms[k] : []; })).forEach(function(L){ L.forEach(fn); }); }
    function findC(id){ var f = null; eachC(function(c){ if (!f && c.id === id) f = c; }); return f; }
    function patchC(match, patch){
      var first = {};
      eachC(function(c){
        if (!match(c)) return;
        if (!first[c.id]) {
          first[c.id] = 1;
          var P = postOf(c.post_id), add = function(k, n){ P[k] = Math.max(0, (P[k] || 0) + n); };
          if (patch.state && patch.state !== c.state) { if (c.state === 'shown') add('n_shown', -1); if (patch.state === 'shown') add('n_shown', 1); if (c.state === 'held') add('n_held', -1); if (patch.state === 'held') add('n_held', 1); }
          if ('is_answer' in patch && !!patch.is_answer !== !!c.is_answer) add('n_answer', patch.is_answer ? 1 : -1);
        }
        Object.keys(patch).forEach(function(k){ c[k] = patch[k]; });
      });
      V.held = (V.held || []).filter(function(c){ return c.state === 'held'; });
    }
    function setC(id, patch, msg){
      rpc(C, 'ops_note_comment_set', { p_id: id, p: patch }).then(function(){ if ('pick' in patch) patch.pick = patch.pick || null; patchC(function(c){ return c.id === id; }, patch); done(msg); }, fail);
    }
  }
})();
