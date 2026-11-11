/* 리딩노트 · 매끄러운 이동 (ux-flow.js)
   index.html(맨 바깥 셸)의 </body> 바로 앞, shell-b.js 다음 줄에 <script src="ux-flow.js?v=1"></script> 한 줄로 동작해요.
   1) 종목·전문가 이름을 누르면 화면 아래에서 미리보기 창이 올라와요. 보던 화면은 그대로 두고, 창 안의 '전체 화면'으로 크게 볼 수 있어요.
      창 안에서 다른 종목·전문가를 누르면 창 내용만 바뀌고(위에 쌓이지 않아요), 왼쪽 위 '‹'로 앞의 내용으로 돌아가요.
   2) 글자만이 아니라 그 줄·카드의 빈 곳을 눌러도 같은 곳으로 가요 (누르는 순간 살짝 색이 바뀌어요).
   3) 창은 바깥 누르기 · 아래로 끌어내리기 · × · 휴대폰 뒤로 가기로 닫혀요. 화면을 옮겼다가 뒤로 오면 보던 위치로 돌아가요. */
(function(){
  if (window.__uxFlow) return; window.__uxFlow = true;
  var SH = window;
  // 줄·카드를 눌렀을 때 대신 눌러 줄 '이동' 단추들
  var NAV = { stock: 1, expert: 1, pBc: 1, pMention: 1, toLeading: 1, mnStock: 1, q: 1 };
  var PEEK = { stock: 1, expert: 1 };

  var CSS = [
    '.fl-press{box-shadow:inset 0 0 0 999px rgba(91,76,240,.08)!important;transition:box-shadow .08s}',
    '.fl-can{cursor:pointer}',
    'html.fl-open,html.fl-open body{overflow:hidden!important}',
    '.fl-scrim{position:fixed;inset:0;z-index:45;background:rgba(0,0,0,.45);opacity:0;transition:opacity .2s}',
    '.fl-sheet{position:fixed;left:0;right:0;bottom:0;z-index:46;margin:0 auto;width:100%;max-width:560px;max-height:88%;display:flex;flex-direction:column;background:var(--bg,#F2F4F6);color:var(--ink);border-radius:1.25rem 1.25rem 0 0;box-shadow:0 -10px 30px rgba(0,0,0,.18);transform:translateY(100%);transition:transform .24s cubic-bezier(.2,.8,.2,1)}',
    '.fl-on .fl-scrim{opacity:1}.fl-on .fl-sheet{transform:none}',
    '@media (min-width:900px){.fl-sheet{top:50%;bottom:auto;max-height:86%;border-radius:1.25rem;transform:translateY(-46%);opacity:0;transition:transform .2s,opacity .2s}.fl-on .fl-sheet{transform:translateY(-50%);opacity:1}.fl-grab{display:none!important}}',
    '.fl-h{flex:none;position:relative;display:flex;align-items:center;gap:.25rem;min-height:3.5rem;padding:.9rem .5rem .4rem;border-bottom:1px solid var(--line);background:var(--surface);border-radius:inherit;border-bottom-left-radius:0;border-bottom-right-radius:0;touch-action:none}',
    '.fl-grab{position:absolute;top:.4rem;left:50%;width:2.5rem;height:.3rem;margin-left:-1.25rem;border-radius:999px;background:var(--line)}',
    '.fl-t{flex:1;min-width:0;font-size:1.0625rem;font-weight:800;letter-spacing:-.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 .35rem}',
    '.fl-ib{flex:none;display:inline-flex;align-items:center;justify-content:center;width:2.75rem;height:2.75rem;border:0;border-radius:.75rem;background:none;color:var(--ink);font:inherit;cursor:pointer}',
    '.fl-ib svg{width:1.4rem;height:1.4rem;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}',
    '.fl-full{flex:none;display:inline-flex;align-items:center;gap:.2rem;height:2.5rem;padding:0 .8rem;border:0;border-radius:999px;background:var(--accent-soft,var(--acc-soft,#EEEBFE));color:var(--t2-acc-ink,var(--accent));font:inherit;font-size:.9375rem;font-weight:800;cursor:pointer;white-space:nowrap}',
    '.fl-full svg{width:1rem;height:1rem;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}',
    '.fl-b{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding-bottom:calc(1rem + env(safe-area-inset-bottom,0px))}',
    '.fl-b>main{padding-bottom:.5rem!important;min-height:0!important}',
    '.fl-b .share-btn{display:none!important}',
    '.fl-more{display:flex;align-items:center;justify-content:center;gap:.3rem;width:calc(100% - 2rem);min-height:3.25rem;margin:.75rem 1rem 0;border:0;border-radius:1rem;background:var(--accent,#5B4CF0);color:var(--on-accent,#fff);font:inherit;font-size:1rem;font-weight:800;cursor:pointer}',
    '.fl-more svg{width:1.1rem;height:1.1rem;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}'
  ].join('\n');
  var SV = function(p){ return '<svg viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>'; };
  var IC = { x: SV('<path d="M6 6l12 12M18 6L6 18"/>'), back: SV('<path d="M15 6l-6 6 6 6"/>'), full: SV('<path d="M9 6l6 6-6 6"/>') };

  // ---- 휴대폰 뒤로 가기: 창을 열 때 기록을 하나 더 넣고, 뒤로 가기가 오면 창만 닫아요
  var F = null; // 지금 붙어 있는 ln 화면의 창 상태
  var HIST = { pushed: false, expect: 0, after: null, timer: null };
  function histPush(){
    try { SH.history.pushState({ flSheet: 1 }, '', SH.location.href); HIST.pushed = true; } catch (e) { HIST.pushed = false; }
  }
  function histDone(){ var cb = HIST.after; HIST.after = null; clearTimeout(HIST.timer); if (cb) try { cb(); } catch (e) {} }
  function histPop(cb){
    // 창을 단추로 닫을 때: 넣어 둔 기록을 빼요 (뺀 다음 할 일 cb)
    HIST.after = cb || null;
    if (HIST.pushed) {
      HIST.pushed = false; HIST.expect++;
      try { SH.history.back(); } catch (e) { HIST.expect = 0; histDone(); return; }
      HIST.timer = setTimeout(function(){ HIST.expect = 0; histDone(); }, 700);
    } else histDone();
  }
  // 우리가 일부러 뺀 기록이면, 셸이 '뒤로 가기 중'으로 표시해 둔 것(POP)을 바로 풀어 다음 화면 기록이 정상으로 쌓이게 해요
  SH.addEventListener('popstate', function(){
    if (HIST.expect > 0) { HIST.expect--; try { SH.POP = false; } catch (e) {} setTimeout(histDone, 0); }
  });
  function backQuiet(){ HIST.expect++; try { SH.history.back(); } catch (e) { HIST.expect = 0; return; } clearTimeout(HIST.qt); HIST.qt = setTimeout(function(){ HIST.expect = 0; }, 700); }

  function patch(w){
    if (!w || w.__fl || !w.A || !w.S || !w.render || !w.__p || !w.screenStock || !w.screenExpert) return;
    var d = w.document; if (!d || !d.body) return;
    w.__fl = true;
    var A = w.A, S = w.S;
    var st = d.createElement('style'); st.id = 'fl-css'; st.textContent = CSS; d.head.appendChild(st);

    // ================= 1) 미리보기 창 =================
    var oGo = { stock: A.stock, expert: A.expert };
    var root = null;
    F = { open: false, list: [], sig: '' };
    function sig(){ return S.tab + '|' + S.stack.map(function(v){ return v.t + ':' + (v.id || ''); }).join('/'); }
    function cur(){ return F.list[F.list.length - 1]; }
    function title(it){
      try { if (w.viewTitle) { var t = w.viewTitle({ t: it.t, id: it.id }); if (t) return t; } } catch (e) {}
      try { if (it.t === 'stock' && w.STOCKS && w.STOCKS[it.id]) return w.STOCKS[it.id].name; if (it.t === 'expert') { var x = w.expertById(it.id); if (x) return x.name; } } catch (e) {}
      return it.t === 'stock' ? '종목' : '전문가';
    }
    function body(it){
      var h = '';
      try { h = it.t === 'stock' ? w.screenStock(it.id) : w.screenExpert(it.id); } catch (e) { h = '<main class="t2"><section class="t2-sec"><p class="t2-empty">내용을 불러오지 못했어요. 전체 화면으로 열어 주세요.</p></section></main>'; }
      return h + '<button type="button" class="fl-more" data-fl="full">' + (it.t === 'stock' ? '이 종목 전체 화면으로 보기' : '전문가 홈으로 가기') + IC.full + '</button>';
    }
    function draw(keepScroll){
      if (!F.open || !root) return;
      var it = cur(), b = root.querySelector('.fl-b'), y = keepScroll && b ? b.scrollTop : 0;
      root.querySelector('.fl-h').innerHTML = '<span class="fl-grab" aria-hidden="true"></span>' +
        (F.list.length > 1 ? '<button type="button" class="fl-ib" data-fl="back" aria-label="앞의 내용으로">' + IC.back + '</button>' : '') +
        '<b class="fl-t" id="fl-t">' + w.esc(title(it)) + '</b>' +
        '<button type="button" class="fl-full" data-fl="full">전체 화면' + IC.full + '</button>' +
        '<button type="button" class="fl-ib" data-fl="x" aria-label="닫기">' + IC.x + '</button>';
      b.innerHTML = body(it);
      b.scrollTop = y;
    }
    function open(t, id){
      if (F.open) {
        var c = cur(); if (c && c.t === t && String(c.id) === String(id)) return;
        if (t === 'expert') { S.dtab = 'record'; S.open = {}; }
        F.list.push({ t: t, id: id }); if (F.list.length > 8) F.list.shift(); draw(false); return;
      }
      if (t === 'expert') { S.dtab = 'record'; S.open = {}; }
      F.list = [{ t: t, id: id }]; F.open = true; F.sig = sig();
      root = d.createElement('div'); root.className = 'fl-root';
      root.innerHTML = '<div class="fl-scrim" data-fl="x"></div><section class="fl-sheet" role="dialog" aria-modal="true" aria-labelledby="fl-t"><header class="fl-h"></header><div class="fl-b"></div></section>';
      d.body.appendChild(root); d.documentElement.classList.add('fl-open');
      draw(false);
      void root.offsetWidth; root.classList.add('fl-on');
      histPush();
      try { var x = root.querySelector('[data-fl="x"].fl-ib'); if (x) x.focus({ preventScroll: true }); } catch (e) {}
    }
    F.close = function(viaBack, cb){
      if (!F.open) { if (cb) cb(); return; }
      F.open = false; F.list = [];
      var r = root; root = null; d.documentElement.classList.remove('fl-open');
      if (r) { r.classList.remove('fl-on'); setTimeout(function(){ if (r.parentNode) r.remove(); }, 240); }
      if (viaBack) { if (cb) cb(); } else histPop(cb);
    };
    function goFull(){
      var it = cur(); if (!it) return;
      F.close(false, function(){ oGo[it.t].call(A, it.id); });
    }
    A.stock = function(v){ if (!v) return; if (S.stack.length && w.view().t === 'stock' && String(w.view().id) === String(v) && !F.open) return; open('stock', v); };
    A.expert = function(v){ if (!v) return; if (S.stack.length && w.view().t === 'expert' && String(w.view().id) === String(v) && !F.open) return; open('expert', v); };

    // 창 단추
    d.addEventListener('click', function(e){
      var b = e.target.closest && e.target.closest('[data-fl]'); if (!b || !root || !root.contains(b)) return;
      e.preventDefault(); e.stopPropagation();
      var a = b.getAttribute('data-fl');
      if (a === 'x') F.close(false);
      else if (a === 'full') goFull();
      else if (a === 'back') { if (F.list.length > 1) { F.list.pop(); draw(false); } }
    }, true);
    d.addEventListener('keydown', function(e){ if (e.key === 'Escape' && F.open) F.close(false); });
    // 아래로 끌어내려 닫기 (창 머리 부분)
    var drag = null;
    d.addEventListener('touchstart', function(e){
      if (!root) return; var h = e.target.closest && e.target.closest('.fl-h'); if (!h || e.target.closest('button')) return;
      drag = { y: e.touches[0].clientY, dy: 0, el: root.querySelector('.fl-sheet') }; drag.el.style.transition = 'none';
    }, { passive: true });
    d.addEventListener('touchmove', function(e){ if (!drag) return; drag.dy = Math.max(0, e.touches[0].clientY - drag.y); drag.el.style.transform = 'translateY(' + drag.dy + 'px)'; }, { passive: true });
    d.addEventListener('touchend', function(){
      if (!drag) return; var g = drag; drag = null; g.el.style.transition = ''; g.el.style.transform = '';
      if (g.dy > 90) F.close(false);
    });

    // ================= 2) 줄·카드 어디를 눌러도 =================
    var SKIP = 'a,button,input,select,textarea,label,summary,[data-a],[role="button"],[contenteditable="true"],.fl-h,[data-fl]';
    function rowOf(t){
      for (var el = t, i = 0; el && el.nodeType === 1 && i < 7; el = el.parentElement, i++) {
        if (el === d.body || el.tagName === 'MAIN' || el.id === 'app' || (el.classList && el.classList.contains('fl-b'))) return null;
        var all = el.querySelectorAll('[data-a]'); if (!all.length) continue;
        var navs = [], seen = {};
        for (var j = 0; j < all.length; j++) { var k = all[j].getAttribute('data-a'); if (!NAV[k]) continue; var key = k + '|' + all[j].getAttribute('data-v'); if (!seen[key]) { seen[key] = 1; navs.push(all[j]); } }
        if (navs.length !== 1) return null; // 처음 만나는 묶음이 하나만 가리킬 때만
        if (el.getBoundingClientRect().height > 280) return null;
        return { box: el, link: navs[0] };
      }
      return null;
    }
    d.addEventListener('click', function(e){
      if (e.defaultPrevented || e.button) return;
      var t = e.target; if (!t || !t.closest || t.closest(SKIP)) return;
      if (w.getSelection && String(w.getSelection()).length > 1) return; // 글자를 고르는 중이면 그대로
      var r = rowOf(t); if (!r) return;
      e.preventDefault(); e.stopPropagation(); r.link.click();
    }, true);
    // 누르는 순간 살짝 색 · 마우스면 손가락 모양
    var pressed = null, px = 0, py = 0;
    function unpress(){ if (pressed) { pressed.classList.remove('fl-press'); pressed = null; } }
    d.addEventListener('pointerdown', function(e){
      unpress(); var t = e.target; if (!t || !t.closest || t.closest(SKIP)) return;
      var r = rowOf(t); if (!r) return; pressed = r.box; px = e.clientX; py = e.clientY; pressed.classList.add('fl-press');
    }, true);
    d.addEventListener('pointermove', function(e){
      if (pressed && (Math.abs(e.clientX - px) > 8 || Math.abs(e.clientY - py) > 8)) unpress();
      if (e.pointerType === 'mouse') { var t = e.target; if (!t || !t.closest || t.classList.contains('fl-can') || t.closest(SKIP)) return; var r = rowOf(t); if (r) r.box.classList.add('fl-can'); }
    }, true);
    ['pointerup', 'pointercancel', 'scroll'].forEach(function(ev){ d.addEventListener(ev, function(){ setTimeout(unpress, ev === 'pointerup' ? 120 : 0); }, true); });

    // ================= 3) 뒤로 오면 보던 위치로 · 화면이 바뀌면 창 닫기 =================
    // 휴대폰 뒤로 가기도 화면 안 '뒤로'와 똑같이: 주소가 그대로인 화면 이동(종목·방송 상세 등)마다 기록을 하나씩 넣어 두고,
    // 뒤로 가기가 오면 화면 안에서 한 단계씩 돌아가요 (사이트 밖으로 나가 버리지 않게)
    var Y = {}, last = null, lastDepth = 0, backing = false, inPop = false, popNav = false;
    var oBack = w.goBack;
    if (oBack) w.goBack = function(){
      if (F.open) { F.close(false); return; } // 창이 열려 있으면 창부터 닫아요
      var hs = null; try { hs = SH.history.state; } catch (e) {}
      var d0 = S.stack.length;
      backing = true; try { oBack.apply(this, arguments); } finally { backing = false; }
      if (!inPop && hs && hs.flv === d0 && S.stack.length < d0) backQuiet(); // 화면 안 '뒤로' 단추를 눌렀으면 넣어 둔 기록도 같이 빼요
    };
    try { A.back = function(){ w.goBack(); }; } catch (e) {}
    // 셸은 뒤로 가기(popstate)를 받으면 바로 이 화면에 주소를 다시 열라고 해요(__site.go).
    // 창을 닫으려고 뺀 기록이거나, 창이 열린 채 폰 뒤로 가기를 누른 거라면 화면은 그대로 두고 창만 닫아요.
    var oSite = w.__site && w.__site.go;
    if (oSite) w.__site.go = function(r){
      if (HIST.expect > 0) return;
      if (F.open) { HIST.pushed = false; F.close(true); return; }
      var pop = false; try { pop = !!SH.POP; } catch (e) {}
      if (pop && String(r || 'home') === String(w.LAST_ROUTE || 'home')) {
        var hs = null; try { hs = SH.history.state; } catch (e) {}
        var tgt = hs && hs.flv ? hs.flv : 0, n = 0;
        inPop = true; try { while (S.stack.length > tgt && n++ < 8) w.goBack(); } finally { inPop = false; }
        return;
      }
      popNav = pop; try { return oSite.apply(this, arguments); } finally { popNav = false; }
    };
    var oR = w.render;
    w.render = function(){
      var prevDepth = lastDepth, lr0 = w.LAST_ROUTE;
      if (last !== null) Y[last] = w.scrollY;
      var r = oR.apply(this, arguments), now = sig(), depth = S.stack.length, routed = w.LAST_ROUTE !== lr0;
      if (F.open && now !== F.sig) {
        // 창 안에서 다른 화면으로 옮겼으면 창은 닫아요. 뒤로 가기는 하지 않고(새 화면 기록과 엇갈리지 않게) 넣어 둔 창 기록을 '이전 화면' 기록으로 바꿔요
        var had = HIST.pushed; HIST.pushed = false; F.close(true);
        if (had) { try { SH.history.replaceState(prevDepth ? { flv: prevDepth } : null, '', SH.location.href); } catch (e) {} }
      }
      if (now !== last) {
        if (last !== null && (backing || depth < prevDepth) && Y[now] > 0) { var y = Y[now]; setTimeout(function(){ w.scrollTo(0, y); }, 0); }
        if (last !== null && depth > prevDepth && !backing && !routed && !popNav) { try { SH.history.pushState({ flv: depth }, '', SH.location.href); } catch (e) {} }
        last = now; lastDepth = depth;
      }
      if (F.open) draw(true);
      return r;
    };
    try { w.render(); } catch (e) {}
  }

  function scan(){
    Array.prototype.forEach.call(document.querySelectorAll('iframe'), function(f){
      var w; try { w = f.contentWindow; if (!/ln\.html/.test(f.contentDocument.URL)) return; } catch (e) { return; }
      if (!f.__fl) { f.__fl = true; f.addEventListener('load', function(){ var n = 0, iv = setInterval(function(){ n++; try { patch(f.contentWindow); } catch (e) {} var ok = false; try { ok = !!f.contentWindow.__fl; } catch (e) { ok = true; } if (ok || n > 150) clearInterval(iv); }, 200); }); }
      try { patch(w); } catch (e) { try { console.warn('ux-flow', e); } catch (x) {} }
    });
  }
  scan();
  var iv = setInterval(scan, 300); setTimeout(function(){ clearInterval(iv); setInterval(scan, 3000); }, 30000);
})();
