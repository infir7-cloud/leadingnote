/* 리딩노트 운영실 · 카카오톡 대화 파일(txt/csv)로 한꺼번에 가져오기
   - 파일은 이 브라우저 안에서만 읽어요. 고른 한 사람(전문가)의 메시지 중 종목·가격 이야기로 보이는 것만 서버로 보내요.
     다른 참여자의 메시지·닉네임은 서버로 보내지 않아요.
   - 보낸 글은 '가져온 글'에 쌓이고, AI가 5분마다 40개씩 읽어 추천 후보를 붙여요. 확인 후 평소처럼 기록 올리기 → 검수를 거쳐요.
   - 읽는 형식: PC(윈도) 내보내기 · 안드로이드/아이폰 내보내기 · 맥 CSV */
(function(){
  var KW = /(매수|매도|손절|익절|목표|진입|분할|비중|홀딩|보유|관심|편입|청산|정리|탈출|추가|담[아으았]|줍|사[세셔시]|사두|팔[아고]|매입|매집|타점|돌파|지지|저항|상한가|추천|손익|반등|눌림|홀드|컷|코드|\b[0-9]{6}\b)/;
  var PRICE = /\d{1,3}(,\d{3})+|\d{4,}|\d+(\.\d+)?\s*(만|천)\s*원?|\d+\s*원/;
  var JUNK = /^(사진|동영상|이모티콘|사진 \d+장|파일: .*|삭제된 메시지입니다\.?|메시지가 삭제되었습니다\.?|\(이모티콘\)|음성메시지|보이스톡.*|페이스톡.*)$/;
  function worth(t){ t = String(t || '').replace(/\s+/g, ' ').trim(); if (t.length < 8) return false; return KW.test(t) || PRICE.test(t); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function z(n){ return (n < 10 ? '0' : '') + n; }
  function hh(ap, h){ h = +h; if (ap === '오후' && h < 12) h += 12; if (ap === '오전' && h === 12) h = 0; return h; }
  function iso(y, mo, d, h, mi){ return y + '-' + z(+mo) + '-' + z(+d) + 'T' + z(h) + ':' + z(+mi) + ':00+09:00'; }
  function hash(s){ var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }

  // ── 형식별 읽기
  var R = {
    pcDate: /^-{5,}\s*(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일.*-{5,}\s*$/,
    pcMsg: /^\[(.+?)\]\s*\[(오전|오후)\s*(\d{1,2}):(\d{2})\]\s?(.*)$/,
    moMsg: /^(\d{4})[년.]\s*(\d{1,2})[월.]\s*(\d{1,2})[일.]?\s*(오전|오후)?\s*(\d{1,2}):(\d{2}),\s*(.+?)\s:\s(.*)$/,
    moSys: /^(\d{4})[년.]\s*(\d{1,2})[월.]\s*(\d{1,2})[일.]?\s*(오전|오후)?\s*(\d{1,2}):(\d{2})(,|:)?\s/,
    sys: /님이 (들어왔|나갔|.*초대했)습니다\.?$|님을 내보냈습니다\.?$|^채팅방 관리자가/,
    moDate: /^(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*[월화수목금토일]요일\s*$/,
    csv: /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::\d{2})?,(.*)$/
  };
  function csvRest(s){ // "이름","메시지" (따옴표 안 쉼표·줄바꿈은 위에서 합쳐 둬요)
    var out = [], cur = '', q = false;
    for (var i = 0; i < s.length; i++) { var c = s[i];
      if (q) { if (c === '"' && s[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
      else if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c; }
    out.push(cur); return out;
  }
  function parse(text){
    var lines = String(text || '').replace(/\r\n?/g, '\n').split('\n'), msgs = [], day = null, last = null, room = '';
    var head = lines.slice(0, 3).join(' ');
    var m0 = head.match(/^\s*(.+?)\s*(님과)?\s*카카오톡 대화/); if (m0) room = m0[1].replace(/\s*\d+\s*$/, '').trim();
    var isCsv = /^Date,User,Message/i.test(lines[0] || '');
    if (isCsv) { // 맥: 따옴표 안 줄바꿈 합치기
      var buf = '', rows = [];
      for (var i = 1; i < lines.length; i++) { buf = buf ? buf + '\n' + lines[i] : lines[i]; if ((buf.split('"').length - 1) % 2 === 0) { rows.push(buf); buf = ''; } }
      rows.forEach(function(r){ var m = r.match(R.csv); if (!m) return; var f = csvRest(m[6]); if (f.length < 2) return;
        msgs.push({ at: iso(m[1], m[2], m[3], +m[4], m[5]), who: f[0].trim(), text: f.slice(1).join(',') }); });
      return { room: room, msgs: msgs, fmt: '맥 CSV' };
    }
    var fmt = '';
    for (var k = 0; k < lines.length; k++) {
      var L = lines[k], m;
      if ((m = L.match(R.pcDate))) { day = [m[1], m[2], m[3]]; last = null; fmt = fmt || 'PC'; continue; }
      if (day && (m = L.match(R.pcMsg))) { last = { at: iso(day[0], day[1], day[2], hh(m[2], m[3]), m[4]), who: m[1].trim(), text: m[5] }; msgs.push(last); continue; }
      if ((m = L.match(R.moMsg))) { last = { at: iso(m[1], m[2], m[3], hh(m[4], m[5]), m[6]), who: m[7].trim(), text: m[8] }; msgs.push(last); fmt = fmt || '모바일'; continue; }
      if (R.moDate.test(L) || R.moSys.test(L) || R.sys.test(L)) { last = null; continue; } // 날짜 줄 · 입장/퇴장 같은 안내
      if (/^저장한 날짜\s*:/.test(L) || (k < 3 && /카카오톡 대화/.test(L))) continue;
      if (last && L !== '') last.text += '\n' + L; else if (last && L === '') last.text += '\n';
    }
    msgs.forEach(function(x){ x.text = x.text.replace(/\n+$/, ''); });
    return { room: room, msgs: msgs, fmt: fmt || '알 수 없음' };
  }
  // 같은 사람이 2분 안에 이어 보낸 메시지는 한 글로 합쳐요
  // 회원 질문: 전문가 답 바로 앞(10분 안) 질문을 짝지어요. 닉네임은 버리고, 전화번호·계좌번호·링크·@호출만 지워요 (금액은 그대로)
  var QRE = /\?|？|어떻|어때|어떤가|보시나|보세요|봐야|될까|할까|팔까|살까|사도|팔아야|들고|홀딩|물렸|손절해야|전망|괜찮|가능할까|오를까|갈까|버틸|기다려|정리할/;
  function clean(q){
    return String(q || '').replace(/@\S+/g, '').replace(/https?:\/\/\S+/g, '')
      .replace(/01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/g, '').replace(/\d[\d-]{9,}\d/g, '')
      .replace(/\s+/g, ' ').trim().slice(0, 120);
  }
  function pair(posts, msgs, who){
    var qs = msgs.filter(function(m){ return m.who !== who && QRE.test(m.text) && !JUNK.test(m.text.trim()) && m.text.trim().length >= 4; });
    var used = {}, j = 0;
    posts.forEach(function(p){
      var t0 = Date.parse(p.at), best = -1;
      while (j < qs.length && Date.parse(qs[j].at) <= t0) j++;
      for (var i = j - 1; i >= 0; i--) { var tq = Date.parse(qs[i].at); if (t0 - tq > 600e3) break; if (!used[i]) { best = i; break; } }
      if (best > -1) { used[best] = 1; var c = clean(qs[best].text); if (c.length >= 4) { p.q = c; p.qa = qs[best].at; } }
    });
    return posts;
  }
  function merge(list){
    var out = [];
    list.forEach(function(x){
      var p = out[out.length - 1];
      if (p && Date.parse(x.at) - Date.parse(p.last) <= 120e3 && (p.text.length + x.text.length) < 3000) { p.text += '\n' + x.text; p.last = x.at; }
      else out.push({ at: x.at, last: x.at, text: x.text });
    });
    return out;
  }

  window.kkMount = function(el, C){
    if (!el) return;
    var st = window.__kkSt || (window.__kkSt = { data: null, who: '', from: '', to: '', ex: '', link: '', room: '' });
    function draw(){
      var D = st.data, h = '<details class="card" id="kkd"' + (D ? ' open' : '') + '><summary style="cursor:pointer;font-weight:700;font-size:15px">💬 카카오톡 대화 파일로 한꺼번에 가져오기 <span class="tag">시험</span></summary>' +
        '<p class="hint" style="margin:8px 0 10px">카카오톡 → 대화방 설정 → <b>대화 내용 내보내기</b>로 받은 txt(또는 맥 csv) 파일을 골라 주세요. 파일은 이 브라우저 안에서만 읽고, <b>고른 한 사람의 종목·가격 이야기</b>만 서버로 보내요. 다른 참여자의 메시지와 닉네임은 보내지 않아요.</p>' +
        '<input type="file" id="kkf" accept=".txt,.csv,text/plain,text/csv">';
      if (D) {
        if (!D.msgs.length) { h += '<div class="msg warn">메시지를 하나도 읽지 못했어요. 카카오톡에서 내보낸 원본 파일인지 확인해 주세요.</div></details>'; el.innerHTML = h; bind(); return; }
        var cnt = {}; D.msgs.forEach(function(x){ cnt[x.who] = (cnt[x.who] || 0) + 1; });
        var people = Object.keys(cnt).sort(function(a, b){ return cnt[b] - cnt[a]; });
        var d0 = D.msgs[0].at.slice(0, 10), d1 = D.msgs[D.msgs.length - 1].at.slice(0, 10);
        h += '<div class="msg ok" style="margin-top:10px">' + esc(D.fmt) + ' 형식 · 메시지 ' + D.msgs.length.toLocaleString() + '개 · ' + d0 + ' ~ ' + d1 + ' · 참여자 ' + people.length + '명</div>' +
          '<div class="row"><label class="f"><b>대화방 이름</b><input type="text" id="kkr" maxlength="80" value="' + esc(st.room || D.room) + '"></label>' +
          '<label class="f"><b>연결할 전문가</b><select id="kkx"><option value="">골라 주세요</option>' + C.S.experts.filter(function(x){ return x.status === 'active'; }).map(function(x){ return '<option value="' + esc(x.id) + '"' + (st.ex === x.id ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select></label></div>' +
          '<label class="f"><b>이 전문가의 카카오톡 이름 (보낸 사람)</b><select id="kkw"><option value="">골라 주세요</option>' + people.slice(0, 60).map(function(p){ return '<option value="' + esc(p) + '"' + (st.who === p ? ' selected' : '') + '>' + esc(p) + ' · ' + cnt[p].toLocaleString() + '개</option>'; }).join('') + '</select></label>' +
          '<div class="row"><label class="f"><b>시작일</b><input type="date" id="kk0" value="' + esc(st.from || d0) + '" min="' + d0 + '" max="' + d1 + '"></label><label class="f"><b>끝일</b><input type="date" id="kk1" value="' + esc(st.to || d1) + '" min="' + d0 + '" max="' + d1 + '"></label></div>' +
          '<label class="f"><b>대화방 공개 주소 (오픈채팅이면 적어 주세요)</b><input type="url" id="kkl" placeholder="https://open.kakao.com/o/..." value="' + esc(st.link) + '"></label>' +
          '<p class="hint" style="margin:2px 0 8px">기록을 공개하려면 다시 볼 수 있는 출처 주소(https://)가 꼭 있어야 해요. 주소가 없으면 \'가져온 글\'에서 채울 때 직접 넣어야 해요.</p>';
        if (st.who) {
          var mine = D.msgs.filter(function(x){ var d = x.at.slice(0, 10); return x.who === st.who && d >= (st.from || d0) && d <= (st.to || d1) && !JUNK.test(x.text.trim()); });
          var posts = pair(merge(mine), D.msgs, st.who), keep = posts.filter(function(p){ return worth(p.text) || (p.q && p.text.replace(/\s/g, '').length >= 4); });
          var nq = keep.filter(function(p){ return p.q; }).length;
          st.keep = keep;
          h += '<div class="card" style="background:var(--bg);margin:10px 0"><b>' + esc(st.who) + '</b> 메시지 ' + mine.length.toLocaleString() + '개 → 이어 보낸 것을 합쳐 ' + posts.length.toLocaleString() + '개 → <b style="color:var(--acc)">종목·가격 이야기로 보이는 글 ' + keep.length.toLocaleString() + '개</b>' + (nq ? ' (회원 질문에 답한 글 ' + nq.toLocaleString() + '개 포함 · 질문은 닉네임 없이 보내요)' : '') +
            (keep.length > 1500 ? '<div class="msg warn" style="margin:8px 0 0">글이 많아요. AI가 5분마다 40개씩 읽어서 다 읽는 데 약 ' + Math.ceil(keep.length / 40 * 5 / 60) + '시간 걸려요. 시험이라면 기간을 1~2주로 줄여 보세요.</div>' : keep.length ? '<p class="hint" style="margin:6px 0 0">AI가 다 읽는 데 약 ' + Math.max(5, Math.ceil(keep.length / 40) * 5) + '분 걸려요.</p>' : '') +
            keep.slice(0, 5).map(function(p){ return '<div class="quote" style="white-space:pre-wrap;max-height:8em;overflow:hidden;margin-top:8px"><span class="src">' + p.at.slice(0, 16).replace('T', ' ') + '</span>' + (p.q ? '\n<span class="src">회원 질문: ' + esc(p.q) + '</span>' : '') + '\n' + esc(p.text.slice(0, 240)) + '</div>'; }).join('') +
            (keep.length > 5 ? '<p class="hint" style="margin:6px 0 0">… 외 ' + (keep.length - 5).toLocaleString() + '개</p>' : '') + '</div>' +
            '<div class="acts"><button class="btn p" id="kks" type="button"' + (keep.length ? '' : ' disabled') + '>가져온 글로 보내기 (' + keep.length.toLocaleString() + '개)</button><span class="hint" id="kkm" style="margin:0;align-self:center"></span></div>';
        }
      }
      h += '</details>';
      el.innerHTML = h; bind();
    }
    function val(id){ var x = el.querySelector('#' + id); return x ? x.value : ''; }
    function bind(){
      var f = el.querySelector('#kkf');
      f.onchange = function(){
        var file = f.files && f.files[0]; if (!file) return;
        if (file.size > 80 * 1024 * 1024) { C.flash('warn', '파일이 너무 커요 (80MB 이하로 나눠 주세요)'); return; }
        var rd = new FileReader();
        rd.onload = function(){
          var buf = rd.result, txt = new TextDecoder('utf-8').decode(buf);
          if ((txt.match(/\uFFFD/g) || []).length > 20) { try { txt = new TextDecoder('euc-kr').decode(buf); } catch (e) {} }
          st.data = parse(txt); st.who = ''; st.from = ''; st.to = ''; st.room = '';
          draw();
        };
        rd.readAsArrayBuffer(file);
      };
      ['kkr', 'kkx', 'kkw', 'kk0', 'kk1', 'kkl'].forEach(function(id){ var x = el.querySelector('#' + id); if (!x) return;
        x.onchange = function(){ st.room = val('kkr'); st.ex = val('kkx'); st.who = val('kkw'); st.from = val('kk0'); st.to = val('kk1'); st.link = val('kkl').trim(); if (id === 'kkw' || id === 'kk0' || id === 'kk1') draw(); }; });
      var sb2 = el.querySelector('#kks');
      if (sb2) sb2.onclick = function(){
        st.room = val('kkr').trim(); st.ex = val('kkx'); st.link = val('kkl').trim();
        if (!st.ex) { C.flash('warn', '연결할 전문가를 골라 주세요'); return; }
        if (!st.room) { C.flash('warn', '대화방 이름을 적어 주세요'); return; }
        if (st.link && !/^https:\/\//.test(st.link)) { C.flash('warn', '대화방 주소는 https:// 로 시작해야 해요'); return; }
        var rows = (st.keep || []).map(function(p){ var r = { at: p.at, b: p.text.slice(0, 6000), k: p.at.slice(0, 16) + '-' + hash(p.text) }; if (p.q) { r.q = p.q; r.qa = p.qa; } return r; });
        var parts = []; for (var i = 0; i < rows.length; i += 400) parts.push(rows.slice(i, i + 400));
        var added = 0, done = 0, msg = el.querySelector('#kkm'); sb2.disabled = true;
        parts.reduce(function(pr, part){ return pr.then(function(){
          return C.sb.rpc('ops_kakao_import', { p: { room: st.room, sender: st.who, expert_id: st.ex, link: st.link || null, rows: part } }).then(function(r){
            if (r.error) throw r.error; added += (r.data && r.data.added) || 0; done += part.length; if (msg) msg.textContent = done.toLocaleString() + ' / ' + rows.length.toLocaleString() + ' 보냄';
          }); }); }, Promise.resolve())
          .then(function(){ var skip = rows.length - added; return C.reload('ok', '카카오톡 글 ' + added.toLocaleString() + '개를 가져온 글로 보냈어요' + (skip ? ' (이미 있던 ' + skip.toLocaleString() + '개는 건너뜀)' : '') + '. AI가 5분마다 40개씩 읽어요.'); })
          .catch(function(e){ sb2.disabled = false; C.flash('bad', (e && e.message) || String(e)); });
      };
    }
    draw();
  };
  window.kkParse = parse; window.kkMerge = merge; window.kkWorth = worth; window.kkPair = pair; window.kkClean = clean; // 점검용
})();
