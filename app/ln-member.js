/* 리딩노트 · 회원 (ln-theme.js가 불러와요)
   - 처음 로그인하면 약관·개인정보 동의를 받아요 (필수 2개 + 선택 1개). 동의 전에는 회원 기능을 쓰지 않게 막아요.
   - 전체 메뉴(마이페이지): 내 정보(닉네임 바꾸기 · 소식 알림 동의) · 내 활동(관심 전문가·관심 종목·내 글·내 투표) · 회원 탈퇴
   - 시험용 '권한 바꿔 보기', 아직 없는 네이버 로그인 버튼, 예전 '예시예요' 문구를 숨겨요.
   - 서버: me_get · me_agree · me_set · me_activity · me_withdraw (Supabase) */
(function(){
  if (window.__lnMemberOn) return; window.__lnMemberOn = true;
  var M = window.__lnMember = { me: null, uid: null, busy: false, act: null };
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function client(){ try { return window.__lnAuth && window.__lnAuth.sb; } catch (e) { return null; } }
  function lnWin(){ var out = null; Array.prototype.forEach.call(document.querySelectorAll('iframe'), function(f){ try { if (/ln\.html/.test(f.contentDocument.URL)) out = f.contentWindow; } catch (e) {} }); return out; }
  function kd(iso){ var d = new Date(iso); if (isNaN(d)) return ''; var k = new Date(d.getTime() + 9 * 3600e3); return k.getUTCFullYear() + '. ' + (k.getUTCMonth() + 1) + '. ' + k.getUTCDate() + '.'; }
  function md(iso){ var d = new Date(iso); if (isNaN(d)) return ''; var k = new Date(d.getTime() + 9 * 3600e3); return (k.getUTCMonth() + 1) + '/' + k.getUTCDate(); }
  function toast(t){ var w = lnWin(); try { if (w && w.toast) return w.toast(t); } catch (e) {} }
  function err(e){ var m = (e && (e.message || e.error_description)) || String(e || ''); return m.replace(/^.*?exception:\s*/i, ''); }

  var CSS = [
    '.mb-scrim{position:fixed;inset:0;z-index:2147483600;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center}',
    '@media (min-width:600px){.mb-scrim{align-items:center}}',
    '.mb-box{width:100%;max-width:30rem;max-height:92vh;overflow:auto;background:var(--surface,#fff);color:var(--ink,#191F28);border-radius:1.5rem 1.5rem 0 0;padding:1.5rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom))}',
    '@media (min-width:600px){.mb-box{border-radius:1.5rem}}',
    '.mb-box h2{font-size:1.375rem;font-weight:800;margin:0 0 .35rem;letter-spacing:-.02em}.mb-box p.s{font-size:.9375rem;color:var(--ink2,#6B7684);margin:0 0 1rem;line-height:1.55}',
    '.mb-ck{display:flex;align-items:center;gap:.75rem;padding:.9rem 0;border-top:1px solid var(--line,#EEF0F3);font-size:1.0625rem;font-weight:700;cursor:pointer}',
    '.mb-ck input{width:1.5rem;height:1.5rem;flex:none;accent-color:#5B4CF0}.mb-ck span{flex:1}.mb-ck em{font-style:normal;font-size:.8125rem;font-weight:800;border-radius:.35rem;padding:.1rem .4rem;margin-right:.35rem}',
    '.mb-ck em.r{background:#FFEBEE;color:#E0283A}.mb-ck em.o{background:var(--sunk,#F2F4F6);color:var(--ink2,#6B7684)}',
    '.mb-ck a{font-size:.8125rem;font-weight:700;color:var(--ink2,#6B7684)}',
    '.mb-all{font-size:1.125rem;border-top:0;background:var(--sunk,#F2F4F6);border-radius:1rem;padding:.9rem 1rem;margin-bottom:.25rem}',
    '.mb-btn{display:flex;align-items:center;justify-content:center;width:100%;min-height:3.5rem;border:0;border-radius:1rem;font:inherit;font-size:1.0625rem;font-weight:800;cursor:pointer;margin-top:.75rem;background:#5B4CF0;color:#fff}',
    '.mb-btn[disabled]{opacity:.4;cursor:default}.mb-btn.q{background:var(--sunk,#F2F4F6);color:var(--ink,#191F28)}.mb-btn.bad{background:#E0283A}',
    '.mb-in{width:100%;box-sizing:border-box;font:inherit;font-size:1.125rem;padding:.85rem 1rem;border:2px solid var(--line,#E5E8EB);border-radius:1rem;background:var(--surface,#fff);color:var(--ink,#191F28)}',
    '.mb-msg{font-size:.875rem;color:#E0283A;min-height:1.2em;margin:.4rem 0 0}',
    '.mb-card{background:var(--surface,#fff);border-radius:1.25rem;padding:1rem 1.1rem;margin:0 0 .75rem}',
    '.mb-row{display:flex;align-items:center;gap:.6rem;padding:.75rem 0;border-top:1px solid var(--line,#EEF0F3);font-size:1rem}.mb-row:first-of-type{border-top:0}',
    '.mb-row b{flex:1;font-weight:700}.mb-row span{color:var(--ink2,#6B7684);font-size:.9375rem}',
    '.mb-row button,.mb-link{font:inherit;font-size:.875rem;font-weight:800;border:0;border-radius:.6rem;padding:.45rem .75rem;background:var(--sunk,#F2F4F6);color:var(--ink,#191F28);cursor:pointer}',
    '.mb-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.4rem;margin:.25rem 0 .5rem}',
    '.mb-stats button{border:0;background:var(--raise,#F7F8FA);border-radius:.9rem;padding:.7rem .2rem;font:inherit;color:var(--ink,#191F28);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:.15rem}',
    '.mb-stats b{font-size:1.25rem;font-weight:800}.mb-stats span{font-size:.75rem;color:var(--ink2,#6B7684);font-weight:700}',
    '.mb-sw{position:relative;width:3.1rem;height:1.8rem;border-radius:1rem;background:var(--line,#E5E8EB);border:0;cursor:pointer;flex:none}.mb-sw i{position:absolute;top:.2rem;left:.2rem;width:1.4rem;height:1.4rem;border-radius:50%;background:#fff;transition:left .15s}',
    '.mb-sw[aria-checked="true"]{background:#5B4CF0}.mb-sw[aria-checked="true"] i{left:1.5rem}',
    '.mb-li{padding:.7rem 0;border-top:1px solid var(--line,#EEF0F3)}.mb-li:first-child{border-top:0}.mb-li small{display:block;font-size:.75rem;color:var(--ink2,#6B7684);margin-bottom:.15rem}.mb-li p{margin:0;font-size:.9375rem;line-height:1.5}',
    '.mb-tabs{display:flex;gap:.4rem;margin:0 0 .75rem;overflow-x:auto}.mb-tabs button{flex:none;font:inherit;font-size:.9375rem;font-weight:700;border:0;border-radius:999px;padding:.5rem .9rem;background:var(--sunk,#F2F4F6);color:var(--ink,#191F28);cursor:pointer}',
    '.mb-tabs button[aria-pressed="true"]{background:var(--ink,#191F28);color:var(--surface,#fff)}',
    '.mb-out{display:block;width:100%;text-align:center;font:inherit;font-size:.875rem;color:var(--sn,#8B95A1);background:none;border:0;padding:1rem 0 .5rem;text-decoration:underline;cursor:pointer}',
    // 숨김: 시험용 권한 바꾸기 · 네이버(아직 없음)
    'section.group:has([data-a="asRole"]){display:none!important}',
    '.link-btn[data-a="join"],.btn-line[data-a="join"]{display:none!important}'
  ].join('\n');

  // ── 서버
  function rpc(fn, args){ var c = client(); if (!c) return Promise.reject(new Error('잠시 뒤 다시 해 주세요')); return Promise.resolve(c.rpc(fn, args || {})).then(function(r){ if (r.error) throw r.error; return r.data; }); }
  function check(){
    var c = client(); if (!c || M.busy) return;
    Promise.resolve(c.auth.getSession()).then(function(r){
      var u = r && r.data && r.data.session && r.data.session.user;
      if (!u || u.is_anonymous) { if (M.uid) { M.uid = null; M.me = null; } return; }
      if (M.uid === u.id && M.me) return;
      M.busy = true;
      rpc('me_get').then(function(me){ M.busy = false; M.uid = u.id; M.me = me; apply(); }, function(){ M.busy = false; });
    });
  }
  function apply(){
    var w = lnWin(); if (!w || !M.me) return;
    try { if (w.P && w.P.member && M.me.nickname) { w.P.member.name = M.me.nickname; } } catch (e) {}
    if (!M.me.terms_at || !M.me.privacy_at) agreeModal(); else try { w.render(); } catch (e) {}
  }

  // ── 화면 공통: ln 문서 위에 띄우는 창
  function open(html, bind){
    var w = lnWin(); if (!w) return; var d = w.document;
    close();
    var el = d.createElement('div'); el.className = 'mb-scrim'; el.id = 'mb-scrim'; el.innerHTML = '<div class="mb-box" role="dialog" aria-modal="true">' + html + '</div>';
    d.body.appendChild(el); try { d.body.style.overflow = 'hidden'; } catch (e) {}
    if (bind) bind(el.firstChild, d);
    var f = el.querySelector('input,button'); if (f) try { f.focus(); } catch (e) {}
  }
  function close(){ var w = lnWin(); if (!w) return; var o = w.document.getElementById('mb-scrim'); if (o) o.remove(); try { w.document.body.style.overflow = ''; } catch (e) {} }

  // ── 약관 동의 (처음 로그인)
  function agreeModal(){
    var w = lnWin(); if (!w) return; var base = w.document.URL;
    var link = function(f){ return '<a href="' + new URL(f, base).href + '" target="_blank" rel="noopener">보기</a>'; };
    open('<h2>리딩노트에 오신 걸 환영해요</h2><p class="s">시작하기 전에 아래 내용을 확인해 주세요.</p>' +
      '<label class="mb-ck mb-all"><input type="checkbox" id="mb-a"><span>모두 동의해요</span></label>' +
      '<label class="mb-ck"><input type="checkbox" class="mb-r" id="mb-t"><span><em class="r">필수</em>이용약관 동의</span>' + link('terms.html') + '</label>' +
      '<label class="mb-ck"><input type="checkbox" class="mb-r" id="mb-p"><span><em class="r">필수</em>개인정보 수집·이용 동의 (카카오 닉네임)</span>' + link('privacy.html') + '</label>' +
      '<label class="mb-ck"><input type="checkbox" id="mb-m"><span><em class="o">선택</em>새 소식·이벤트 알림 받기</span></label>' +
      '<p class="s" style="margin:.5rem 0 0;font-size:.8125rem">선택 항목은 동의하지 않아도 모든 기능을 쓸 수 있어요. 마이페이지에서 언제든 바꿀 수 있어요.</p>' +
      '<p class="mb-msg" id="mb-e"></p><button class="mb-btn" id="mb-go" disabled>동의하고 시작하기</button><button class="mb-btn q" id="mb-no">동의하지 않고 나가기</button>',
      function(box){
        var a = box.querySelector('#mb-a'), rs = box.querySelectorAll('.mb-r'), m = box.querySelector('#mb-m'), go = box.querySelector('#mb-go');
        var sync = function(){ var ok = Array.prototype.every.call(rs, function(x){ return x.checked; }); go.disabled = !ok; a.checked = ok && m.checked; };
        a.onchange = function(){ Array.prototype.forEach.call(rs, function(x){ x.checked = a.checked; }); m.checked = a.checked; sync(); };
        Array.prototype.forEach.call(rs, function(x){ x.onchange = sync; }); m.onchange = sync;
        go.onclick = function(){ go.disabled = true; rpc('me_agree', { p_marketing: !!m.checked }).then(function(me){ M.me = me; close(); apply(); toast('가입을 마쳤어요. 반가워요!'); }, function(e){ go.disabled = false; box.querySelector('#mb-e').textContent = err(e); }); };
        box.querySelector('#mb-no').onclick = function(){ close(); var w2 = lnWin(); try { if (w2 && w2.A && w2.A.logout) w2.A.logout(); } catch (e) {} M.me = null; M.uid = null; toast('로그아웃했어요. 동의하시면 언제든 다시 시작할 수 있어요'); };
      });
  }

  // ── 닉네임 바꾸기
  function nickModal(){
    open('<h2>닉네임 바꾸기</h2><p class="s">이야기방과 커뮤니티에 보이는 이름이에요. 한글·영문·숫자 2~12자.</p>' +
      '<input class="mb-in" id="mb-n" maxlength="12" value="' + esc(M.me && M.me.nickname || '') + '" autocomplete="off"><p class="mb-msg" id="mb-e"></p>' +
      '<button class="mb-btn" id="mb-s">저장하기</button><button class="mb-btn q" id="mb-c">닫기</button>',
      function(box){
        var inp = box.querySelector('#mb-n'), sv = box.querySelector('#mb-s');
        box.querySelector('#mb-c').onclick = close;
        sv.onclick = function(){ var v = inp.value.trim(); if (!/^[가-힣A-Za-z0-9_ ]{2,12}$/.test(v)) { box.querySelector('#mb-e').textContent = '한글·영문·숫자 2~12자로 적어 주세요'; return; }
          sv.disabled = true; rpc('me_set', { p: { nickname: v } }).then(function(me){ M.me = me; close(); apply(); toast('닉네임을 바꿨어요'); }, function(e){ sv.disabled = false; box.querySelector('#mb-e').textContent = err(e); }); };
        inp.onkeydown = function(e){ if (e.key === 'Enter') sv.click(); };
      });
  }

  // ── 내 활동
  var CH = { buy: '살래요', wait: '더 볼래요', no: '안 살래요' };
  function actModal(tab){
    tab = tab || 'talk';
    var draw = function(){
      var A = M.act || {}, L = { talk: A.talk || [], votes: A.votes || [], follows: A.follows || [], watch: A.watch || [] };
      var tabs = [['talk', '내 글', L.talk.length], ['votes', '내 투표', L.votes.length], ['follows', '관심 전문가', L.follows.length], ['watch', '관심 종목', L.watch.length]];
      var body = !M.act ? '<p class="s">불러오는 중이에요…</p>' :
        tab === 'talk' ? (L.talk.length ? L.talk.map(function(t){ return '<div class="mb-li"><small>' + esc(t.where) + ' · ' + md(t.at) + '</small><p>' + esc(t.body) + '</p></div>'; }).join('') : '<p class="s">아직 쓴 글이 없어요.</p>') :
        tab === 'votes' ? (L.votes.length ? L.votes.map(function(v){ return '<div class="mb-li"><small>' + md(v.at) + '</small><p><b>' + esc(v.name || v.code) + '</b> · ' + (CH[v.choice] || '') + '</p></div>'; }).join('') : '<p class="s">아직 투표한 종목이 없어요.</p>') :
        tab === 'follows' ? (L.follows.length ? L.follows.map(function(x){ return '<div class="mb-li"><p><b>' + (function(){ var lw = lnWin(); return lw && lw.xN ? lw.xN(x) : esc(x.name); })() + '</b></p></div>'; }).join('') : '<p class="s">관심 전문가가 없어요. 전문가 화면에서 ☆를 눌러 추가해요.</p>') :
        (L.watch.length ? L.watch.map(function(x){ return '<div class="mb-li"><p><b>' + esc(x.name || x.code) + '</b> <small style="display:inline">' + esc(x.code) + '</small></p></div>'; }).join('') : '<p class="s">관심 종목이 없어요.</p>');
      open('<h2>내 활동</h2><div class="mb-tabs" role="group">' + tabs.map(function(t){ return '<button data-t="' + t[0] + '" aria-pressed="' + (tab === t[0]) + '">' + t[1] + ' ' + t[2] + '</button>'; }).join('') + '</div><div>' + body + '</div><button class="mb-btn q" id="mb-c">닫기</button>',
        function(box){ box.querySelector('#mb-c').onclick = close; Array.prototype.forEach.call(box.querySelectorAll('[data-t]'), function(b){ b.onclick = function(){ tab = b.getAttribute('data-t'); draw(); }; }); });
    };
    draw();
    rpc('me_activity').then(function(a){ M.act = a; draw(); }, function(e){ M.act = {}; draw(); toast(err(e)); });
  }

  // ── 회원 탈퇴
  function delModal(){
    open('<h2>회원 탈퇴</h2><p class="s">탈퇴하면 아래 내용이 <b>바로 지워지고 되돌릴 수 없어요.</b></p>' +
      '<div class="mb-card" style="background:var(--sunk,#F2F4F6)"><p class="s" style="margin:0">· 닉네임과 가입 정보<br>· 관심 전문가 · 관심 종목<br>· 이야기방·커뮤니티에 쓴 글<br>· 종목 투표 기록</p></div>' +
      '<p class="s">계속하려면 아래 칸에 <b>탈퇴</b>라고 적어 주세요.</p><input class="mb-in" id="mb-d" maxlength="4" autocomplete="off" placeholder="탈퇴"><p class="mb-msg" id="mb-e"></p>' +
      '<button class="mb-btn bad" id="mb-x" disabled>탈퇴하기</button><button class="mb-btn q" id="mb-c">그만두기</button>',
      function(box){
        var inp = box.querySelector('#mb-d'), x = box.querySelector('#mb-x');
        box.querySelector('#mb-c').onclick = close;
        inp.oninput = function(){ x.disabled = inp.value.trim() !== '탈퇴'; };
        x.onclick = function(){ x.disabled = true; rpc('me_withdraw', { p_confirm: '탈퇴' }).then(function(){
            close(); var w = lnWin(); M.me = null; M.uid = null; M.act = null;
            try { var c = client(); if (c) c.auth.signOut(); } catch (e) {}
            try { if (w && w.A && w.A.logout) w.A.logout(); } catch (e) {}
            toast('탈퇴했어요. 그동안 이용해 주셔서 고마웠어요');
          }, function(e){ x.disabled = false; var m = err(e); box.querySelector('#mb-e').textContent = /me_withdraw|function/i.test(m) ? '탈퇴 기능 서버 설정이 아직이에요. 운영자에게 알려 주세요' : m; }); };
      });
  }

  // ── 마이페이지(전체 메뉴) 고치기
  function mypageHTML(){
    var me = M.me; if (!me) return '';
    var st = me.stats || {};
    return '<section class="mb-card" id="mb-my"><div class="mb-row"><b>닉네임</b><span>' + esc(me.nickname) + '</span><button data-mb="nick">바꾸기</button></div>' +
      '<div class="mb-row"><b>새 소식·이벤트 알림</b><span style="font-size:.8125rem">' + (me.marketing ? '받는 중' : '안 받음') + '</span><button class="mb-sw" role="switch" aria-checked="' + !!me.marketing + '" aria-label="새 소식·이벤트 알림 받기" data-mb="mkt"><i></i></button></div>' +
      '<div class="mb-row"><b>가입일</b><span>' + kd(me.joined) + '</span></div></section>' +
      '<h2 class="sech" style="margin:1rem 0 .5rem">내 활동</h2><div class="mb-stats">' +
      [['follows', '관심 전문가', st.follows], ['watch', '관심 종목', st.watch], ['talk', '내 글', st.talk], ['votes', '내 투표', st.votes]].map(function(x){ return '<button data-mb="act" data-t="' + x[0] + '"><b>' + (x[2] || 0) + '</b><span>' + x[1] + '</span></button>'; }).join('') + '</div>';
  }
  function patch(w, d){
    if (w.__mb || !w.screenMore || !w.render) return; w.__mb = true;
    var st = d.createElement('style'); st.id = 'mb-css'; st.textContent = CSS; d.head.appendChild(st);
    var oMore = w.screenMore;
    w.screenMore = function(){
      var h = oMore.apply(this, arguments);
      h = h.replace(/<p class="notice">지금 보이는 전문가·종목·가격·이야기는 모두 예시예요\.<\/p>/, '')
           .replace(/<section class="group[^"]*"><h2 class="sech">체험용 · 권한 바꿔 보기<\/h2>[\s\S]*?<\/section>/, '')
           .replace(/<button class="btn btn-line btn-block" data-a="join">네이버 아이디로 로그인·가입<\/button>/, '');
      if (w.P && w.P.member && M.me) {
        var i = h.indexOf('</section>'); if (i > -1) h = h.slice(0, i + 10) + mypageHTML() + h.slice(i + 10);
        var j = h.lastIndexOf('</main>');
        var tail = '<div style="display:flex;justify-content:center;gap:1rem;padding:.5rem 0 0"><a class="mb-out" style="width:auto" href="' + new URL('terms.html', d.URL).href + '" target="_blank" rel="noopener">이용약관</a><a class="mb-out" style="width:auto" href="' + new URL('privacy.html', d.URL).href + '" target="_blank" rel="noopener">개인정보 처리방침</a></div><button class="mb-out" data-mb="del">회원 탈퇴</button>';
        if (j > -1) h = h.slice(0, j) + tail + h.slice(j);
      }
      return h;
    };
    d.addEventListener('click', function(e){
      var b = e.target.closest && e.target.closest('[data-mb]'); if (!b) return;
      e.preventDefault(); e.stopPropagation();
      var k = b.getAttribute('data-mb');
      if (k === 'nick') nickModal();
      else if (k === 'act') { M.act = null; actModal(b.getAttribute('data-t')); }
      else if (k === 'del') delModal();
      else if (k === 'mkt') { var v = !(M.me && M.me.marketing); b.setAttribute('aria-checked', String(v));
        rpc('me_set', { p: { marketing: v } }).then(function(me){ M.me = me; try { w.render(); } catch (x) {} toast(v ? '새 소식 알림을 받아요' : '새 소식 알림을 껐어요'); }, function(x){ toast(err(x)); }); }
    }, true);
    d.addEventListener('keydown', function(e){ if (e.key === 'Escape') { var o = d.getElementById('mb-scrim'); if (o && !o.querySelector('#mb-go')) close(); } });
    try { w.render(); } catch (e) {}
    check();
  }
  function scan(){
    Array.prototype.forEach.call(document.querySelectorAll('iframe'), function(f){
      var w, d; try { w = f.contentWindow; d = f.contentDocument; } catch (e) { return; }
      if (w && d && d.head && /ln\.html/.test(d.URL || '')) try { patch(w, d); } catch (e) {}
    });
  }
  var t = setInterval(function(){ scan(); var w = lnWin(); var ok = false; try { ok = !!(w && w.__mb); } catch (e) {} if (ok) clearInterval(t); }, 300);
  setTimeout(function(){ clearInterval(t); }, 60000);
  new MutationObserver(function(){ try { scan(); } catch (e) {} }).observe(document.documentElement, { childList: true, subtree: true });
  // 로그인 상태가 바뀌면(카카오에서 돌아올 때 등) 다시 확인해요
  function hook(){ var c = client(); if (!c) return setTimeout(hook, 500); try { c.auth.onAuthStateChange(function(){ M.me = null; setTimeout(check, 300); }); } catch (e) {} check(); }
  M.ui = { agree: agreeModal, nick: nickModal, act: actModal, del: delModal, apply: apply, close: close }; // 점검용
  hook();
  setInterval(check, 15000);
})();
