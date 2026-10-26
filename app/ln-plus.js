/* 리딩노트 · 더하기 (ln-theme.js가 불러와요. index.html은 고칠 필요 없어요)
   ① 성적표 카드 공유 + 링크로 바로 열기 + 가입 없이 둘러보기
   ② 오늘 전문가들이 많이 말한 종목 (장 마감 뒤 15:40 공개)
   ③ 전체 추천 기록 표로 보기 (휴대폰 표 · PC 스프레드시트)
   ④ AI 요약: 종목 의견 흐름 · 전문가 한눈 요약 · 이야기방 놓친 대화 요약
   ⑤ 한 줄 요약: 홈 · 전문가 목록/상세 · 종목 · 추천 하나하나 · 이야기방 (긴 글 대신 한 줄로 먼저)
   ⑥ 방송 속 고수 종목: 오늘 방송 예고 → 지금 방송 중 → 가장 최근 방송 순 (편성·출연자·종목은 운영실 '방송'에서 고쳐요)
   요약은 모두 '기록 기준'이고, 사라·팔라는 말이나 전망은 쓰지 않아요. */
(function(){
  if (window.__lnPlusOn) return; window.__lnPlusOn = true;
  var X = window.__lnPlus = { mention: null, notes: { stock: {}, expert: {} }, talk: {}, loaded: false, bc: null, bcOff: 0 };
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function sb(){ return window.__lnAuth && window.__lnAuth.sb; }
  function q(p){ return Promise.resolve(p).then(function(r){ return r || {}; }, function(e){ return { error: { message: String(e && e.message || e) } }; }); }
  function md(iso){ var d = new Date(new Date(iso).getTime() + 9 * 3600e3); return (d.getUTCMonth() + 1) + '.' + d.getUTCDate(); }
  function hm(iso){ var d = new Date(new Date(iso).getTime() + 9 * 3600e3); return ('0' + d.getUTCHours()).slice(-2) + ':' + ('0' + d.getUTCMinutes()).slice(-2); }
  function dayLbl(day){ var p = String(day || '').split('-'); return p.length === 3 ? (+p[1]) + '.' + (+p[2]) : ''; }
  function wonS(n){ return n == null || n === '' || isNaN(n) ? '-' : Number(n).toLocaleString('ko-KR'); }
  function pctS(x){ if (x == null || isNaN(x)) return '-'; var r = Math.round(x * 10) / 10; return (r > 0 ? '+' : '') + r.toFixed(1) + '%'; }
  function tone(x){ var r = Math.round((x || 0) * 10) / 10; return r > 0 ? 'up' : r < 0 ? 'down' : 'flat'; }
  // 공유 링크는 바깥 사이트 주소로 (예: https://…figma.site/#ln/x-전문가). 셸이 시작할 때 이 주소를 넘겨받아 바로 열어요
  function link(tok){ var t = location; try { if (window.top.location.origin === location.origin) t = window.top.location; } catch (e) {} return t.origin + t.pathname + '#ln/' + tok; }
  var TL = { buy: '구매', sell: '판매', watch: '지켜보기', revise: '가격 변경', strategy: '조언', news: '소식' };
  var SV = function(p){ return '<svg viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>'; };
  var IC = {
    share: SV('<path d="M12 4v11M7 9l5-5 5 5M5 14v5h14v-5"/>'),
    spark: SV('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>'),
    lock: SV('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    chev: '<svg class="t2-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    grid: SV('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M4 15h16M10 4v16"/>'),
    down: SV('<path d="M12 4v11M7 10l5 5 5-5M5 19h14"/>'),
    link: SV('<path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/>'),
    x: SV('<path d="M6 6l12 12M18 6L6 18"/>')
  };

  var CSS = [
    '.p-ic svg,.p-btn svg,.p-b2 svg{width:1.15rem;height:1.15rem;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none}',
    // AI 요약 블록
    '.p-ai{background:var(--raise);border-radius:1.125rem;padding:.875rem 1rem;margin:0 0 .875rem}',
    '.p-ai-h{display:flex;align-items:center;gap:.4rem;font-size:.9375rem;font-weight:800;margin-bottom:.35rem}',
    '.p-badge{display:inline-flex;align-items:center;gap:.2rem;font-size:.6875rem;font-weight:800;color:var(--on-accent);background:var(--accent);border-radius:.4rem;padding:.1rem .4rem}',
    '.p-badge svg{width:.75rem;height:.75rem;fill:currentColor;stroke:none}',
    '.p-badge.auto{background:var(--sunk);color:var(--ink2)}',
    '.p-ai p{font-size:.9375rem;line-height:1.6;margin:0;white-space:pre-line}',
    '.p-ai .p-foot{font-size:.75rem;color:var(--sn);margin-top:.45rem}',
    '.p-chips{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.55rem}',
    '.p-chips span{font-size:.8125rem;background:var(--surface);border-radius:.6rem;padding:.25rem .55rem;color:var(--ink2)}.p-chips b{color:var(--ink)}',
    // 한 줄 요약
    '.p-one{display:block!important;width:auto;background:var(--raise);border-radius:1.125rem;padding:.8rem 1rem;margin:0 0 .875rem;text-align:left}',
    '.p-one-h{display:flex;flex-wrap:wrap;align-items:center;gap:.25rem .4rem;margin-bottom:.3rem}.p-one-h small{font-size:.75rem;color:var(--sn)}.p-one .p-badge{white-space:nowrap;flex:none}',
    '.p-one>b{display:block;font-size:1.0625rem;line-height:1.45;font-weight:800;letter-spacing:-.01em;word-break:keep-all}',
    '.p-one details{margin-top:.4rem}.p-one summary{font-size:.8125rem;font-weight:700;color:var(--t2-acc-ink);cursor:pointer;list-style:none}.p-one summary::-webkit-details-marker{display:none}',
    '.p-one summary:after{content:"자세히 보기"}.p-one details[open] summary:after{content:"접기"}',
    '.p-one details p{font-size:.9375rem;line-height:1.6;margin:.35rem 0 0;color:var(--ink2);white-space:pre-line}',
    '.p-one.hm{margin:.25rem 1.25rem 1rem;background:var(--accent-soft)}',
    '.p-lline{font-size:.9375rem;font-weight:700;line-height:1.5;margin:0 0 .6rem;padding:.55rem .75rem;border-radius:.75rem;background:var(--raise);word-break:keep-all}',
    '.p-lline:before{content:"한 줄 · ";color:var(--t2-acc-ink)}',
    '.xr-s.p-xl{white-space:normal;overflow:visible;text-overflow:clip;display:block;line-height:1.4}',
    '.p-sumbox b.p-sl{display:block;font-size:1rem;margin-bottom:.3rem}',
    // 방송 속 고수 종목
    '.p-bc-top{border-radius:1.125rem;padding:.9rem 1rem;margin:.25rem 0 .5rem;background:var(--accent-soft)}',
    '.p-bc-main{display:block;width:100%;text-align:left;border:0;background:none;color:var(--ink);font:inherit;padding:0;cursor:pointer}',
    '.p-bcbs{display:flex;gap:.4rem;margin-top:.6rem}',
    '.p-bcb{display:inline-flex;align-items:center;justify-content:center;gap:.25rem;height:2.25rem;padding:0 .8rem;border-radius:.65rem;border:0;background:var(--raise);color:var(--ink);font:inherit;font-size:.875rem;font-weight:800;text-decoration:none;cursor:pointer}',
    '.p-bcb svg{width:.8rem;height:.8rem;fill:currentColor}.p-bcb.on{background:var(--live,#F04452);color:#fff}.p-bcb:disabled{opacity:.45;cursor:default}',
    '.p-bc-top .p-bcb{background:var(--surface)}.p-bc-top .p-bcb.on{background:var(--live,#F04452)}',
    '.p-bc-top.live{background:var(--sa-soft,#FFEEF0)}',
    '.p-bc-st{display:inline-flex;align-items:center;gap:.3rem;font-size:.75rem;font-weight:800;border-radius:.4rem;padding:.12rem .45rem;background:var(--accent);color:var(--on-accent)}',
    '.p-bc-top.live .p-bc-st{background:var(--live,#F04452);color:#fff}',
    '.p-bc-top b{display:block;font-size:1.125rem;margin-top:.4rem}.p-bc-top span.s{display:block;font-size:.875rem;color:var(--ink2);margin-top:.15rem}',
    '.p-bc{padding:.8rem 0;border-bottom:1px solid var(--line)}',
    '.p-bc .sum{display:block;font-size:.8125rem;color:var(--ink2);margin-top:.4rem}.p-bc .sum b.up{color:var(--up)}.p-bc .sum b.down{color:var(--down)}',
    '.p-bc .pk span.lk{background:var(--sunk);color:var(--sn)}',
    '.p-lu{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.5rem}.p-lu button,.p-lu>span{display:inline-flex;align-items:center;gap:.3rem;height:2.25rem;padding:0 .7rem;border-radius:999px;border:0;background:var(--raise);color:var(--ink);font:inherit;font-size:.875rem;font-weight:700}',
    '.p-lu button{cursor:pointer}.p-lu button span{font-size:.75rem;color:var(--t2-acc-ink);font-weight:800}',
    '.p-xh{display:flex;align-items:center;gap:.6rem;margin:.25rem 0 .5rem}.p-xh .av{flex:none;width:2.5rem;height:2.5rem;border-radius:50%;background:var(--accent-soft);color:var(--t2-acc-ink);font-weight:800;display:flex;align-items:center;justify-content:center}.p-xh b{font-size:1.125rem;flex:1}',
    '.p-xgo{border:0;border-radius:999px;background:var(--accent-soft);color:var(--t2-acc-ink);font:inherit;font-size:.8125rem;font-weight:800;height:2.25rem;padding:0 .8rem;cursor:pointer}',
    '.p-pick{background:var(--raise);border-radius:1rem;padding:.8rem .9rem;margin:0 0 .5rem}.p-pick .top{display:flex;align-items:center;justify-content:space-between;gap:.5rem}',
    '.p-pick .kd{font-size:.75rem;font-weight:800;color:var(--t2-acc-ink);background:var(--accent-soft);border-radius:.4rem;padding:.1rem .45rem}.p-pick .kd.s{color:var(--ink2);background:var(--sunk)}',
    '.p-pick .rt{font-size:1.125rem;font-weight:800;text-align:right}.p-pick .rt small{display:block;font-size:.6875rem;color:var(--sn);font-weight:700}.p-pick .rt.up{color:var(--up)}.p-pick .rt.down{color:var(--down)}',
    '.p-pick .stk{display:block;font-size:1.125rem;margin-top:.35rem}.p-pick .stk button{border:0;background:none;padding:0;font:inherit;color:inherit;cursor:pointer;text-decoration:underline;text-underline-offset:2px}.p-pick .stk a{color:inherit}',
    '.p-pick .px{display:flex;flex-wrap:wrap;gap:.25rem .75rem;margin-top:.35rem;font-size:.875rem;color:var(--ink2)}.p-pick .px b{color:var(--ink)}.p-pick .px em{font-style:normal;font-weight:700}.p-pick .px em.up{color:var(--up)}.p-pick .px em.down{color:var(--down)}',
    '.p-pick .dt{display:block;font-size:.75rem;color:var(--sn);margin-top:.3rem}.p-pick q{display:block;quotes:none;font-size:.9375rem;line-height:1.55;margin-top:.45rem;color:var(--ink)}',
    '.p-pick .by{font-size:.8125rem;font-weight:800;color:var(--ink2);margin-bottom:.2rem}',
    '.p-pick.lock{background:var(--surface);box-shadow:inset 0 0 0 1.5px var(--line)}.p-pick.lock .stk{display:flex;align-items:center;gap:.35rem;font-size:1rem}.p-pick.lock svg{width:1.1rem;height:1.1rem;fill:none;stroke:currentColor;stroke-width:2}.p-pick.lock p{font-size:.875rem;color:var(--ink2);margin:.25rem 0 0}',
    '.p-lead{background:var(--accent-soft);border-radius:1rem;padding:.9rem 1rem;margin:.5rem 0 .25rem}.p-lead b{display:block;font-size:1rem;line-height:1.45}.p-lead span{display:block;font-size:.8125rem;color:var(--ink2);margin-top:.2rem}',
    '.p-fol{font-size:.875rem;color:var(--ink2);margin:.5rem 0 .25rem}',
    '.p-bcx{margin:0 0 .25rem}.p-bcx-h{display:flex;align-items:center;gap:.2rem;border:0;background:none;padding:.5rem 0 .3rem;font:inherit;font-size:.8125rem;font-weight:800;color:var(--ink2);cursor:pointer}.p-bcx-h svg{width:.9rem;height:.9rem}',
    '.p-bc:last-of-type{border-bottom:0}.p-bc .h{display:flex;align-items:center;justify-content:space-between;gap:.5rem}',
    '.p-bc .h b{font-size:1.0625rem}.p-bc .h small{font-size:.8125rem;color:var(--sn);white-space:nowrap}',
    '.p-bc .who{display:block;font-size:.875rem;color:var(--ink);font-weight:700;margin-top:.15rem}',
    '.p-bc .pk{display:flex;flex-wrap:wrap;gap:.3rem;margin-top:.45rem}.p-bc .pk span{font-size:.8125rem;font-weight:700;background:var(--raise);border-radius:.5rem;padding:.2rem .5rem}',
    '.p-bc .wait{display:block;font-size:.8125rem;color:var(--sn);margin-top:.35rem}',
    '.p-bq{display:flex;gap:.75rem;padding:.9rem 0;border-bottom:1px solid var(--line)}.p-bq:last-child{border-bottom:0}',
    '.p-bq .av{flex:none;width:2.5rem;height:2.5rem;border-radius:50%;background:var(--accent-soft);color:var(--t2-acc-ink);font-weight:800;display:flex;align-items:center;justify-content:center}',
    '.p-bq .bd{flex:1;min-width:0}.p-bq .nm{font-size:.9375rem;font-weight:800}.p-bq .nm button,.p-bq .stk button{border:0;background:none;padding:0;font:inherit;color:inherit;cursor:pointer;text-decoration:underline;text-underline-offset:2px}',
    '.p-bq .stk{font-size:1.0625rem;font-weight:800;margin-top:.25rem}.p-bq .stk a{color:inherit}',
    '.p-bq q{display:block;quotes:none;font-size:.9375rem;line-height:1.55;background:var(--raise);border-radius:.75rem;padding:.55rem .7rem;margin-top:.35rem}',
    '.p-yt{display:inline-flex;align-items:center;gap:.3rem;margin-top:.45rem;height:2.25rem;padding:0 .75rem;border-radius:.65rem;background:var(--sa-soft,#FFEEF0);color:var(--sa,#D22030);font-size:.875rem;font-weight:800;text-decoration:none}',
    '.p-yt svg{width:.9rem;height:.9rem;fill:currentColor;stroke:none}',
    // 오늘의 언급
    '.p-mix{width:5.25rem;height:.625rem;border-radius:.35rem;overflow:hidden;display:flex;background:var(--sunk);flex:none}',
    '.p-mix i{display:block;height:100%}.p-mix .b,.p-lg .b{background:var(--up)}.p-mix .w,.p-lg .w{background:#B9B3F7}.p-mix .s,.p-lg .s{background:var(--down)}.p-mix .e,.p-lg .e{background:var(--sn);opacity:.45}',
    '.p-lg{display:flex;gap:.75rem;justify-content:flex-end;font-size:.75rem;color:var(--ink2);margin:.25rem 0 .375rem}.p-lg i{display:inline-block;width:.5rem;height:.5rem;border-radius:2px;margin-right:.25rem}',
    '.p-disc{font-size:.75rem;color:var(--sn);padding:.5rem 0 .875rem;border-top:1px solid var(--line);margin-top:.375rem;line-height:1.5}',
    '.p-lock{display:flex;flex-direction:column;align-items:center;text-align:center;gap:.35rem;padding:.75rem .5rem 1.125rem}',
    '.p-lock svg{width:2rem;height:2rem;fill:none;stroke:var(--t2-acc-ink);stroke-width:1.9;stroke-linecap:round}',
    '.p-lock b{font-size:1.0625rem}.p-lock span{font-size:.875rem;color:var(--ink2);line-height:1.5}',
    '.p-day{font-size:.75rem;font-weight:700;color:var(--ink2);background:var(--sunk);border-radius:.4rem;padding:.1rem .45rem;margin-left:.4rem}',
    '.p-kv{display:flex;gap:.5rem;margin:.75rem 0 .25rem}.p-kv div{flex:1;background:var(--raise);border-radius:1rem;padding:.75rem}',
    '.p-kv span{display:block;font-size:.8125rem;color:var(--ink2)}.p-kv b{display:block;font-size:1.125rem;margin-top:.1rem}',
    '.p-tl{position:relative;padding:.75rem 0 .75rem 1.4rem}',
    '.p-tl:before{content:"";position:absolute;left:.3rem;top:1.4rem;bottom:-.75rem;width:2px;background:var(--line)}.p-tl:last-child:before{display:none}',
    '.p-tl i{position:absolute;left:0;top:1.1rem;width:.75rem;height:.75rem;border-radius:50%;background:var(--surface);border:3px solid var(--sn)}',
    '.p-tl.buy i{border-color:var(--up)}.p-tl.sell i{border-color:var(--down)}.p-tl.watch i{border-color:#9D93FF}',
    '.p-tl small{font-size:.8125rem;color:var(--sn)}.p-tl b{display:block;font-size:1.0625rem;margin-top:.1rem}',
    '.p-tl p{font-size:.9375rem;color:var(--ink2);margin:.2rem 0 0;line-height:1.5}.p-tl a{color:var(--t2-acc-ink);font-weight:700;text-decoration:none}',
    '.p-aitag{font-size:.6875rem;font-weight:700;color:var(--ink2);background:var(--sunk);border-radius:.35rem;padding:.05rem .35rem;margin-left:.35rem;vertical-align:.1rem}',
    '.p-go{display:flex;align-items:center;justify-content:space-between;width:100%;padding:.875rem 1.25rem;margin:0 0 .75rem;border:0;border-radius:1.25rem;background:var(--surface);color:var(--ink);font:inherit;font-weight:700;font-size:.9375rem;cursor:pointer}',
    '.p-go span{display:flex;align-items:center;gap:.5rem}.p-go svg{width:1.15rem;height:1.15rem;fill:none;stroke:var(--t2-acc-ink);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
    // 둘러보기 · 가입
    '.p-guest{display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin:.25rem 0 .75rem;padding:.65rem .9rem;border-radius:1rem;background:var(--accent-soft);font-size:.875rem;color:var(--ink)}',
    '.p-guest button{border:0;background:none;color:var(--t2-acc-ink);font:inherit;font-weight:800;cursor:pointer;white-space:nowrap}',
    '.p-join{background:var(--surface);border-radius:1.5rem;padding:1.125rem 1.25rem;margin:0 0 .75rem;box-shadow:inset 0 0 0 2px var(--accent)}',
    '.p-join b{display:block;font-size:1.0625rem}.p-join span{display:block;font-size:.875rem;color:var(--ink2);margin-top:.2rem}',
    '.p-btn{display:flex;align-items:center;justify-content:center;gap:.4rem;width:100%;height:3rem;border-radius:.95rem;border:0;background:var(--accent);color:var(--on-accent);font:inherit;font-weight:700;font-size:1rem;margin-top:.75rem;cursor:pointer}',
    '.p-btn.sub{background:var(--raise);color:var(--ink)}',
    // 공유 시트
    '.p-scrim{position:fixed;inset:0;z-index:200;background:var(--overlay);display:flex;align-items:flex-end;justify-content:center}',
    '.p-sheet{width:100%;max-width:30rem;max-height:94vh;overflow:auto;background:var(--surface);color:var(--ink);border-radius:1.75rem 1.75rem 0 0;padding:.75rem 1.25rem calc(1.5rem + env(safe-area-inset-bottom,0px))}',
    '@media (min-width:720px){.p-scrim{align-items:center}.p-sheet{border-radius:1.75rem}}',
    '.p-grab{width:2.5rem;height:.3rem;border-radius:.2rem;background:var(--line);margin:0 auto .75rem}',
    '.p-sh{display:flex;align-items:center;justify-content:space-between;margin-bottom:.75rem}.p-sh b{font-size:1.1875rem}',
    '.p-sh button{width:2.5rem;height:2.5rem;border:0;border-radius:50%;background:var(--raise);color:var(--ink);display:flex;align-items:center;justify-content:center;cursor:pointer}',
    '.p-sh svg{width:1.2rem;height:1.2rem;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round}',
    '.p-prev{width:100%;aspect-ratio:1/1;border-radius:1.25rem;display:block;background:var(--raise)}',
    '.p-row3{display:flex;gap:.5rem;margin-top:.875rem}.p-row3 button{flex:1}',
    '.p-b2{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.3rem;min-height:4.25rem;border:0;border-radius:1rem;background:var(--raise);color:var(--ink);font:inherit;font-size:.875rem;font-weight:700;cursor:pointer}',
    '.p-b2.main{background:var(--accent);color:var(--on-accent)}',
    '.p-note{font-size:.8125rem;color:var(--ink2);text-align:center;margin:.75rem 0 0;line-height:1.5}',
    // 이야기방 요약
    '.p-sumbar{display:flex;flex-direction:column;gap:.5rem;margin:0 0 .75rem}',
    '.p-sumbtn{align-self:flex-start;display:inline-flex;align-items:center;gap:.35rem;border:0;border-radius:999px;background:var(--accent-soft);color:var(--t2-acc-ink);font:inherit;font-size:.875rem;font-weight:800;padding:.45rem .85rem;cursor:pointer}',
    '.p-sumbtn svg{width:.95rem;height:.95rem;fill:currentColor;stroke:none}',
    '.p-sumbox{background:var(--raise);border-radius:1rem;padding:.75rem .9rem;font-size:.9375rem;line-height:1.6;white-space:pre-line}',
    '.p-sumbox small{display:block;font-size:.75rem;color:var(--sn);margin-top:.35rem;white-space:normal}',
    '.p-sumbox .p-x{float:right;border:0;background:none;color:var(--ink2);font:inherit;font-size:.8125rem;font-weight:700;cursor:pointer;padding:0 0 0 .5rem}',
    // 표로 보기 (휴대폰)
    '.p-tbar{display:flex;flex-direction:column;gap:.5rem;margin:0 0 .75rem}',
    '.p-tsel{display:flex;gap:.5rem}.p-tsel select{flex:1;min-width:0;height:2.75rem;border-radius:.85rem;border:0;background:var(--surface);color:var(--ink);font:inherit;font-size:.9375rem;padding:0 .75rem}',
    '.p-tchips{display:flex;gap:.35rem;overflow-x:auto;scrollbar-width:none}.p-tchips::-webkit-scrollbar{display:none}',
    '.p-tchips button{flex:none;border:0;border-radius:999px;padding:.4rem .8rem;font:inherit;font-size:.875rem;font-weight:700;background:var(--surface);color:var(--ink2);cursor:pointer}',
    '.p-tchips button[aria-pressed="true"]{background:var(--ink);color:var(--bg)}',
    '.p-twrap{background:var(--surface);border-radius:1rem;overflow-x:auto}',
    '.p-tbl{width:100%;min-width:34rem;border-collapse:collapse;font-size:.8125rem}',
    '.p-tbl th,.p-tbl td{padding:.55rem .4rem;border-bottom:1px solid var(--line);white-space:nowrap;text-align:left}',
    '.p-tbl th{background:var(--raise);color:var(--ink2);font-weight:700;position:sticky;top:0}',
    '.p-tbl td.n,.p-tbl th.n{text-align:right}.p-tbl tr[data-a]{cursor:pointer}',
    '.p-tbl .up{color:var(--up)}.p-tbl .down{color:var(--down)}.p-tbl .mut{color:var(--sn)}',
    '.p-tbl a{color:var(--t2-acc-ink);text-decoration:none;font-weight:600}',
    '.p-tnote{font-size:.75rem;color:var(--sn);margin:.5rem .25rem 0}',
    // 표로 보기 (PC 스프레드시트)
    '.p-ss{background:var(--surface);border-radius:1rem;overflow:hidden;font-size:.8125rem;box-shadow:0 0 0 1px var(--line)}',
    '.p-ss-tool{display:flex;align-items:center;gap:.4rem;flex-wrap:wrap;padding:.6rem .75rem;border-bottom:1px solid var(--line)}',
    '.p-ss-tool select{height:2.1rem;border-radius:.5rem;border:1px solid var(--line);background:var(--raise);color:var(--ink);font:inherit;font-size:.8125rem;padding:0 .5rem}',
    '.p-ss-tool .sp{margin-left:auto}',
    '.p-ss-fx{display:flex;align-items:center;gap:.6rem;padding:.4rem .75rem;border-bottom:1px solid var(--line);color:var(--ink);min-height:2.1rem}',
    '.p-ss-fx .cell{min-width:3rem;text-align:center;padding:.1rem .4rem;border:1px solid var(--line);border-radius:.3rem;font-weight:700}.p-ss-fx .fx{color:var(--sn);font-style:italic;font-weight:800}',
    '.p-ss-fx .txt{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.p-ss-grid{overflow:auto;max-height:70vh}',
    '.p-ss table{border-collapse:collapse;width:100%;min-width:56rem}',
    '.p-ss th,.p-ss td{border-right:1px solid var(--line);border-bottom:1px solid var(--line);padding:.4rem .55rem;white-space:nowrap;text-align:left}',
    '.p-ss thead th{position:sticky;top:0;background:var(--raise);color:var(--sn);font-weight:600;text-align:center;z-index:1}',
    '.p-ss tr.hd td{background:var(--raise);font-weight:800;color:var(--ink)}',
    '.p-ss td.rn{background:var(--raise);color:var(--sn);text-align:center;width:2.5rem}',
    '.p-ss td.n{text-align:right}.p-ss .up{color:var(--up)}.p-ss .down{color:var(--down)}.p-ss .mut{color:var(--sn)}',
    '.p-ss tbody tr:not(.hd) td:not(.rn){cursor:cell}',
    '.p-ss td.cur{outline:2px solid var(--accent);outline-offset:-2px;background:var(--surface)}',
    '.p-ss tr.sel td.rn{background:var(--accent-soft);color:var(--t2-acc-ink)}',
    '.p-ss a{color:var(--t2-acc-ink);text-decoration:underline}',
    '.p-ss-tabs{display:flex;gap:2px;background:var(--raise);padding:0 .5rem;border-top:1px solid var(--line)}',
    '.p-ss-tabs button{border:0;background:none;padding:.55rem .9rem;color:var(--ink2);font:inherit;font-size:.8125rem;font-weight:600;cursor:pointer}',
    '.p-ss-tabs button.on{background:var(--surface);color:var(--t2-acc-ink);box-shadow:inset 0 -2px 0 var(--accent)}'
  ].join('\n');

  // ── 서버에서 읽기
  function load(){
    var c = sb(), L = window.__lnLive;
    if (!c || !L || !L.ready) return setTimeout(load, 300);
    Promise.all([q(c.rpc('mention_feed')), q(c.from('ai_notes').select('kind,key,body,line,by,made_at,facts').in('kind', ['stock', 'expert']).limit(1000)), q(c.rpc('bc_feed'))]).then(function(rs){
      if (!rs[0].error) X.mention = rs[0].data;
      if (!rs[2].error && rs[2].data) { X.bc = rs[2].data; var sv = kstMs(X.bc.now); if (sv) X.bcOff = sv - (Date.now() + 9 * 3600e3); }
      (rs[1].data || []).forEach(function(n){ X.notes[n.kind][n.key] = n; });
      X.loaded = true; redraw();
    });
  }
  function lnFrame(){ var out = null; Array.prototype.forEach.call(document.querySelectorAll('iframe'), function(f){ try { if (/ln\.html/.test(f.contentDocument.URL)) out = f; } catch (e) {} }); return out; }
  function redraw(){ var f = lnFrame(); try { if (f && f.contentWindow.__p) f.contentWindow.render(); } catch (e) {} try { var c = cmWin(); if (c && c.__p) c.render(); } catch (e) {} }
  function cmWin(){ var out = null; Array.prototype.forEach.call(document.querySelectorAll('iframe'), function(f){ try { if (/community\.html/.test(f.contentDocument.URL)) out = f.contentWindow; } catch (e) {} }); return out; }

  // ── AI 요약 블록
  function aiBlock(kind, key, title){
    var n = X.notes[kind][key]; if (!n) return '';
    var f = n.facts || {}, chips = '';
    if (kind === 'stock') {
      var c = [];
      if (f.n7 != null) c.push('<span>최근 1주 언급 <b>' + f.n7 + '</b> · 그 전 3주 <b>' + (f.n_prev || 0) + '</b></span>');
      var mx = [['구매', f.buy7], ['지켜보기', f.watch7], ['판매', f.sell7]].filter(function(x){ return x[1]; });
      if (mx.length) c.push('<span>최근 1주 의견 ' + mx.map(function(x){ return x[0] + ' <b>' + x[1] + '</b>'; }).join(' · ') + '</span>');
      if (f.tn >= 1 && f.tmin) c.push('<span>말한 목표 가격 <b>' + (f.tmin === f.tmax ? wonS(f.tmin) : wonS(f.tmin) + '~' + wonS(f.tmax)) + '원</b></span>');
      if (c.length) chips = '<div class="p-chips">' + c.join('') + '</div>';
    }
    return '<div class="p-ai"><div class="p-ai-h"><span class="p-badge' + (n.by === 'ai' ? '' : ' auto') + '">' + (n.by === 'ai' ? IC.spark + 'AI 요약' : '자동 요약') + '</span>' + esc(title) + '</div>' +
      '<p>' + esc(n.body) + '</p>' + chips + '<p class="p-foot">' + (kind === 'stock' ? '최근 30일 전문가 기록' : '공개된 추천 기록') + ' 기준 · ' + md(n.made_at) + ' 정리 · 투자 권유가 아니에요</p></div>';
  }

  // ── 한 줄 요약 (AI가 쓴 한 줄이 있으면 그걸, 없으면 지금 기록으로 바로 만들어요)
  var STK = { day: '단타', swing: '스윙', long: '중장기' };
  function wonM(n){ n = Number(n); if (!n) return ''; if (n < 10000) return n.toLocaleString('ko-KR') + '원'; var v = n / 10000, r = v >= 100 ? Math.round(v) : Math.round(v * 10) / 10; return r.toLocaleString('ko-KR') + '만'; }
  function fit(parts, max){ parts = parts.filter(Boolean); while (parts.length > 1 && parts.join(' · ').length > max) parts.pop(); return parts.join(' · '); }
  function noteLine(kind, key){ var n = X.notes[kind] && X.notes[kind][key]; return n && n.line && n.by === 'ai' ? n : null; }
  function expertLine(w, id){
    var n = noteLine('expert', id); if (n) return { t: n.line, ai: true };
    var x = w.expertById(id); if (!x) return null;
    var st; try { st = w.expertStats(id); } catch (e) { return null; }
    var cnt = {}; st.list.forEach(function(a){ var nm = (a.stock && a.stock.name) || a.L.stock; cnt[nm] = (cnt[nm] || 0) + 1; });
    var tops = Object.keys(cnt).sort(function(a, b){ return cnt[b] - cnt[a]; }).slice(0, 2), tp = tops.length ? tops.join('·') + ' 위주' : '';
    var t = st.doneCount ? fit([STK[x.style], '끝난 추천 ' + st.doneCount + '건 중 ' + st.hits + '건 수익', tp], 40)
      : fit([STK[x.style], tp, st.active ? '리딩 중 ' + st.active + '건' : ''], 40);
    if (!st.list.length) { var o = X.notes.expert[id]; t = o && o.line ? o.line : ''; }
    return t ? { t: t, ai: false } : null;
  }
  function stockLine(w, code){
    var n = noteLine('stock', code); if (n) return { t: n.line, ai: true };
    var s; try { s = w.stockSummary(code); } catch (e) { s = null; }
    var L = (s && s.leads) || [];
    if (!L.length) { var o = X.notes.stock[code]; return o && o.line ? { t: o.line, ai: false } : null; }
    var ex = {}, hold = 0, wat = 0, done = 0, tg = [];
    L.forEach(function(a){ ex[a.L.expert] = 1; if (a.status === 'holding') { hold++; if (a.cur && a.cur.target) tg.push(a.cur.target); } else if (a.status === 'watch') wat++; else done++; });
    var mn = tg.length ? Math.min.apply(null, tg) : 0, mx = tg.length ? Math.max.apply(null, tg) : 0;
    return { t: fit(['전문가 ' + Object.keys(ex).length + '명 기록', hold ? hold + '명 리딩 중' : wat ? wat + '명 지켜보는 중' : done ? '끝난 추천 ' + done + '건' : '', mn ? '말한 목표 ' + (mn === mx ? wonM(mn) : wonM(mn) + '~' + wonM(mx)) : ''], 40), ai: false };
  }
  function pctR(a, b){ return a && b ? pctS((a / b - 1) * 100) : ''; }
  function leadLine(a){
    var c = a.cur || {}, won = function(n){ return wonS(n) + '원'; };
    if (a.status === 'done') return won(c.buy) + '에 사서 ' + won(a.sell) + '에 팔아 ' + pctS(a.ret) + '로 끝났어요' + (a.hit ? ' · 목표 도달' : '');
    if (a.status === 'holding') return won(c.buy) + ' 구매 추천 · ' + (c.target ? '목표 ' + wonM(c.target) + '(' + pctR(c.target, c.buy) + ')' : '목표 미정') + (c.stop ? ' · 손해 막는 ' + wonM(c.stop) + '(' + pctR(c.stop, c.buy) + ')' : '') + (a.unreal != null ? ' · 지금 ' + pctS(a.unreal) : '');
    var tx = a.lastLead && a.lastLead.e && a.lastLead.e.text ? String(a.lastLead.e.text) : '';
    return '지켜보는 중' + (tx ? ' · "' + (tx.length > 28 ? tx.slice(0, 28) + '…' : tx) + '"' : '');
  }
  function homeLine(w){
    var M = X.mention;
    if (M && M.day && M.day === M.today && M.opened && M.summary) return { t: M.summary, ai: M.summary_by === 'ai', mention: true };
    var ev = [], today = w.DATA_TODAY, from = w.RECENT_FROM;
    (w.LEADINGS || []).forEach(function(Lx){ var a; try { a = w.analyze(Lx); } catch (e) { return; } a.steps.forEach(function(s){ if (/^(buy|sell|revise|watch)$/.test(s.e.t)) ev.push({ at: s.e.at, code: Lx.stock, ex: Lx.expert }); }); });
    var td = ev.filter(function(e){ return String(e.at).slice(0, 10) === today; }), use = td.length ? td : ev.filter(function(e){ return String(e.at).slice(0, 10) >= from; });
    if (!use.length) return null;
    var by = {}; use.forEach(function(e){ (by[e.code] = by[e.code] || {})[e.ex] = 1; });
    var top = Object.keys(by).sort(function(a, b){ return Object.keys(by[b]).length - Object.keys(by[a]).length; })[0], nm = (w.STOCKS[top] || {}).name || top, nx = Object.keys(by[top]).length;
    return { t: (td.length ? '오늘' : '최근 7일') + ' 전문가 추천 ' + use.length + '건' + (nx > 1 ? ' · ' + nm + '에 ' + nx + '명이 모였어요' : ' · 가장 최근은 ' + nm), ai: false };
  }
  function oneCard(L, kind, key, cls){
    if (!L || !L.t) return '';
    var n = kind ? X.notes[kind][key] : null, more = '';
    if (n && n.body && n.body !== L.t) more = '<details><summary aria-label="자세히"></summary><p>' + esc(n.body) + '</p></details>';
    return '<div class="p-one' + (cls ? ' ' + cls : '') + '"><div class="p-one-h"><span class="p-badge' + (L.ai ? '' : ' auto') + '">' + (L.ai ? IC.spark + 'AI 한 줄' : '한 줄 요약') + '</span><small>공개 기록 기준 · 투자 권유 아니에요</small></div><b>' + esc(L.t) + '</b>' + more + '</div>';
  }

  // ── 방송 속 고수 종목: 시간에 따라 순서가 바뀌어요 (모든 시간은 한국 시간)
  var WD = ['', '월', '화', '수', '목', '금', '토', '일'];
  function kstMs(s){ var m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?/); return m ? Date.UTC(+m[1], m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)) : 0; }
  function ymdOf(ms){ return new Date(ms).toISOString().slice(0, 10); }
  function wdOf(ymd){ var d = new Date(kstMs(ymd)).getUTCDay(); return d === 0 ? 7 : d; }
  function nowK(){ return Date.now() + 9 * 3600e3 + (X.bcOff || 0); }
  function bcSlots(F, now){
    F = F || {}; var P = {}, E = {}, out = [], seen = {}, today = ymdOf(now);
    (F.programs || []).forEach(function(p){ P[p.id] = p; });
    (F.episodes || []).forEach(function(e){ E[e.program_id + '|' + e.air_date] = e; });
    var mk = function(p, date){ var k = p.id + '|' + date; if (seen[k]) return; seen[k] = 1;
      var st = kstMs(date + 'T' + (p.air_time || '20:30')), en = st + (p.duration_min || 60) * 60000, ep = E[k] || null;
      if (ep && ep.canceled) return;
      out.push({ key: k, p: p, date: date, ep: ep, start: st, end: en, state: now < st ? 'soon' : now < en ? 'live' : 'done' }); };
    for (var i = 14; i >= 0; i--) { var dt = ymdOf(kstMs(today) - i * 864e5), wd = wdOf(dt); (F.programs || []).forEach(function(p){ if (+p.weekday === wd) mk(p, dt); }); }
    (F.episodes || []).forEach(function(e){ if (P[e.program_id] && e.air_date <= today && e.air_date >= ymdOf(kstMs(today) - 14 * 864e5)) mk(P[e.program_id], e.air_date); });
    var top = out.filter(function(x){ return x.date === today && x.state !== 'done'; }).sort(function(a, b){ return a.start - b.start; })[0] || null;
    var past = out.filter(function(x){ return x.state === 'done'; }).sort(function(a, b){ return b.start - a.start; });
    return { top: top, past: past, all: out };
  }
  function hmK(ms){ var d = new Date(ms); return ('0' + d.getUTCHours()).slice(-2) + ':' + ('0' + d.getUTCMinutes()).slice(-2); }
  function dLbl(ymd){ return WD[wdOf(ymd)] + ' ' + (+ymd.slice(5, 7)) + '.' + (+ymd.slice(8, 10)); }
  function leftTxt(ms){ var m = Math.max(0, Math.round(ms / 60000)); return m >= 60 ? Math.floor(m / 60) + '시간' + (m % 60 ? ' ' + (m % 60) + '분' : '') : m + '분'; }
  function lineup(sl){ var xs = (sl.ep && sl.ep.experts) || []; return xs.length ? xs.map(function(x){ return x.name; }).join(', ') : ''; }
  function ytAt(url, ts){
    if (!url) return ''; if (!ts) return url;
    var p = String(ts).split(':').map(Number), sec = p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1];
    if (!/youtube\.com\/watch|youtu\.be\//.test(url)) return url;
    return url.replace(/([?&])t=[^&]*/, '$1').replace(/[?&]$/, '') + (url.indexOf('?') > -1 ? '&' : '?') + 't=' + sec;
  }
  // 이름 비교: 띄어쓰기와 대표·자문역 같은 호칭은 빼고
  function bcNorm(t){ return String(t || '').replace(/\s+/g, '').replace(/(대표|자문역|위원|이사|소장|원장|본부장|팀장|교수|선생님|선생|님)$/, '').toLowerCase(); }
  function bcX(w, id, name){
    if (!w || !w.EXPERTS) return null;
    var x = id && w.expertById ? w.expertById(id) : null; if (x) return x;
    var k = bcNorm(name); if (!k) return null;
    return w.EXPERTS.filter(function(e){ return bcNorm(e.name) === k; })[0] || null;
  }
  // 수익률: 판 종목은 매도가, 아직이면 지금 가격(시세 표시를 켰을 때만) ÷ 방송 때 말한 매수가
  function pickRet(k){
    if (!k || !k.buy) return null;
    if (k.sell) return { v: (k.sell / k.buy - 1) * 100, done: true };
    var px = X.bc && X.bc.price_on && X.bc.prices && k.stock_code ? X.bc.prices[k.stock_code] : null;
    return px && px.close ? { v: (px.close / k.buy - 1) * 100, done: false, asOf: px.as_of } : null;
  }
  function epStat(ep){
    var pk = ep && ep.published ? ep.picks || [] : [], rs = pk.map(pickRet).filter(Boolean);
    return { n: pk.length, open: pk.filter(function(k){ return k.kind !== 'secret' || k.revealed; }).length, lock: pk.filter(function(k){ return k.kind === 'secret' && !k.revealed; }).length,
      avg: rs.length ? rs.reduce(function(s, r){ return s + r.v; }, 0) / rs.length : null, nr: rs.length };
  }
  var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  function bcBtns(sl, live){
    var lu = sl.p.live_url, vu = sl.ep && sl.ep.published ? sl.ep.video_url : '';
    var b = function(url, label, on){ return url ? '<a class="p-bcb' + (on ? ' on' : '') + '" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + PLAY + label + '</a>' : '<button class="p-bcb" disabled>' + label + '</button>'; };
    return '<div class="p-bcbs">' + b(lu, '본방송', live) + b(vu, '재방송', false) + '</div>';
  }
  function bcTopCard(sl, now){
    if (!sl) return '';
    var live = sl.state === 'live', who = lineup(sl) || sl.p.lineup_note || '';
    return '<div class="p-bc-top' + (live ? ' live' : '') + '"><button class="p-bc-main" data-a="pBc" data-v="' + esc(sl.key) + '"><span class="p-bc-st">' + (live ? '● 지금 방송 중' : '오늘 방송 예정') + '</span>' +
      '<b>' + esc(sl.p.channel || '') + ' ' + esc(sl.p.name) + '</b><span class="s">' + (live ? hmK(sl.end) + '까지 · ' : '오늘 ' + hmK(sl.start) + ' · ' + leftTxt(sl.start - now) + ' 남았어요 · ') + esc(who) + '</span></button>' + bcBtns(sl, true) + '</div>';
  }
  function bcRow(sl){
    var ep = sl.ep, pk = ep && ep.published ? ep.picks || [] : [], who = lineup(sl), st = epStat(ep);
    var chipsH = pk.length ? '<span class="pk">' + pk.slice(0, 4).map(function(k){ return k.kind === 'secret' && !k.revealed ? '<span class="lk">비공개</span>' : '<span>' + esc(k.stock_name) + '</span>'; }).join('') + (pk.length > 4 ? '<span>+' + (pk.length - 4) + '</span>' : '') + '</span>' : '<span class="wait">' + (ep && ep.published ? '이 회차에 정리된 종목이 없어요' : '방송에서 나온 종목을 정리하는 중이에요') + '</span>';
    var sum = st.avg != null ? '<span class="sum">추천 ' + st.nr + '종목 평균 <b class="' + tone(st.avg) + '">' + pctS(st.avg) + '</b></span>' : '';
    return '<div class="p-bc"><button class="p-bc-main" data-a="pBc" data-v="' + esc(sl.key) + '"><span class="h"><b>' + esc(sl.p.name) + '</b><small>' + dLbl(sl.date) + ' ' + hmK(sl.start) + '</small></span>' +
      (who ? '<span class="who">' + esc(who) + '</span>' : '') + chipsH + sum + '</button>' + bcBtns(sl, false) + '</div>';
  }
  function bcHome(){
    if (!X.bc || !(X.bc.programs || []).length) return '';
    var now = nowK(), r = bcSlots(X.bc, now); X.bcSig = bcSig(r);
    if (!r.top && !r.past.length) return '';
    return '<section class="t2-sec"><div class="t2-h" style="cursor:default">방송 속 고수 종목</div>' + bcTopCard(r.top, now) + r.past.slice(0, 5).map(bcRow).join('') +
      '<button class="p-go" data-a="pBcAll" style="margin:.5rem 0 0;background:var(--raise)"><span>지난 방송 · 출연 전문가 · 추천 종목 모두 보기</span>' + IC.chev + '</button>' +
      '<p class="p-disc">SBS Biz 본방송에서 전문가가 직접 한 말과 가격을 원본 영상과 함께 정리해요. 수익률은 방송에서 말한 매수가 기준이에요. 사거나 팔라는 권유가 아니에요.</p></section>';
  }
  function bcSig(r){ return (r.top ? r.top.key + r.top.state : '') + '/' + r.past.slice(0, 5).map(function(x){ return x.key; }).join(','); }
  function wonP(n){ return n ? wonS(n) + '원' : '-'; }
  function pickCard(k, ep, w, showWho){
    var who = showWho ? '<div class="by">' + esc(k.expert_name) + '</div>' : '';
    if (k.kind === 'secret' && !k.revealed) {
      var x0 = bcX(w, k.expert_id, k.expert_name);
      return '<div class="p-pick lock">' + who + '<span class="kd">비공개 종목</span><b class="stk">' + IC.lock + ' 방송에서 아직 공개 전이에요</b><p>공개되면 종목과 매수·목표 가격을 바로 정리해 드려요.</p>' +
        (x0 ? '<button class="p-btn" data-a="pBcFollow" data-v="' + esc(x0.id) + '" style="margin-top:.5rem">' + esc(nameOnly(x0.name)) + ' 방송 정리 받기</button>' : '') + '</div>';
    }
    var hasS = k.stock_code && w && w.STOCKS && w.STOCKS[k.stock_code], r = pickRet(k);
    var stock = hasS ? '<button data-a="stock" data-v="' + esc(k.stock_code) + '">' + esc(k.stock_name) + '</button>' : k.stock_code ? '<a href="https://finance.naver.com/item/main.naver?code=' + esc(k.stock_code) + '" target="_blank" rel="noopener noreferrer">' + esc(k.stock_name) + '</a>' : esc(k.stock_name);
    var px = [];
    if (k.buy) px.push('<span>매수 <b>' + wonP(k.buy) + '</b></span>');
    if (k.target) px.push('<span>목표 <b>' + wonP(k.target) + '</b>' + (k.buy ? ' <em class="up">' + pctS((k.target / k.buy - 1) * 100) + '</em>' : '') + '</span>');
    if (k.stop) px.push('<span>손절 <b>' + wonP(k.stop) + '</b>' + (k.buy ? ' <em class="down">' + pctS((k.stop / k.buy - 1) * 100) + '</em>' : '') + '</span>');
    if (k.sell) px.push('<span>매도 <b>' + wonP(k.sell) + '</b></span>');
    var badge = r ? '<span class="rt ' + tone(r.v) + '"><small>' + (r.done ? '매도 수익률' : '지금 수익률') + '</small>' + pctS(r.v) + '</span>' : '';
    return '<div class="p-pick">' + who + '<div class="top"><span class="kd' + (k.kind === 'secret' ? ' s' : '') + '">' + (k.kind === 'secret' ? '비공개 → 공개됨' : '공개 종목') + '</span>' + badge + '</div>' +
      '<b class="stk">' + stock + '</b>' + (px.length ? '<div class="px">' + px.join('') + '</div>' : '') +
      '<small class="dt">' + (k.pick_date ? (+String(k.pick_date).slice(5, 7)) + '.' + (+String(k.pick_date).slice(8, 10)) + ' 방송 추천' : '') + (k.sell && k.sell_date ? ' · ' + (+String(k.sell_date).slice(5, 7)) + '.' + (+String(k.sell_date).slice(8, 10)) + ' 매도' : '') + (r && !r.done && r.asOf ? ' · ' + (+String(r.asOf).slice(5, 7)) + '.' + (+String(r.asOf).slice(8, 10)) + ' 종가 기준' : '') + '</small>' +
      (k.quote ? '<q>"' + esc(k.quote) + '"</q>' : '') +
      (ep && ep.video_url ? '<a class="p-yt" href="' + esc(ytAt(ep.video_url, k.ts)) + '" target="_blank" rel="noopener noreferrer">' + PLAY + (k.ts ? esc(k.ts) + '부터 영상 보기' : '방송 영상 보기') + '</a>' : '') + '</div>';
  }
  function nameOnly(n){ return String(n || '').replace(/\s*(대표|자문역|위원)$/, ''); }
  function screenBc(key){
    var r = bcSlots(X.bc, nowK()), sl = r.all.filter(function(x){ return x.key === key; })[0], w = window.__pW;
    if (!sl) return '<main class="t2"><section class="t2-sec"><p class="t2-empty">이 방송 정보를 찾지 못했어요.</p></section></main>';
    var ep = sl.ep, pk = ep && ep.published ? ep.picks || [] : [], now = nowK(), st = epStat(ep);
    var lineupL = (ep && ep.experts && ep.experts.length ? ep.experts : []).map(function(e){ var x = bcX(w, e.id, e.name); return { name: e.name, x: x }; });
    pk.forEach(function(k){ if (!lineupL.some(function(l){ return bcNorm(l.name) === bcNorm(k.expert_name); })) lineupL.push({ name: k.expert_name, x: bcX(w, k.expert_id, k.expert_name) }); });
    var chips = lineupL.length ? '<div class="p-lu">' + lineupL.map(function(l){ return l.x ? '<button data-a="expert" data-v="' + esc(l.x.id) + '">' + esc(l.name) + '<span>전문가 홈</span></button>' : '<span>' + esc(l.name) + '</span>'; }).join('') + '</div>' : '<p style="font-size:.9375rem;color:var(--ink2);margin-top:.35rem">' + esc(sl.p.lineup_note || '') + '</p>';
    var head = '<section class="t2-sec" style="padding-top:1.25rem"><p style="font-size:.9375rem;color:var(--ink2)">' + esc(sl.p.channel || '') + ' · ' + dLbl(sl.date) + ' ' + hmK(sl.start) + (sl.state === 'soon' ? ' 방송 예정' : sl.state === 'live' ? ' · 지금 방송 중' : '') + '</p>' +
      '<h2 style="font-size:1.75rem;font-weight:800;letter-spacing:-.03em;margin-top:.1rem">' + esc(sl.p.name) + '</h2>' + chips + bcBtns(sl, sl.state !== 'done') +
      (st.avg != null ? '<div class="p-kv"><div><span>추천 종목</span><b>' + st.n + '개</b></div><div><span>방송일 이후 평균</span><b class="' + tone(st.avg) + '">' + pctS(st.avg) + '</b></div><div><span>공개 대기</span><b>' + st.lock + '개</b></div></div><p class="t2-basis2" style="padding:.25rem 0 .5rem">방송에서 말한 매수가 기준 · 수익률이 계산된 ' + st.nr + '종목 평균이에요</p>' : '') + '</section>';
    var body;
    if (sl.state !== 'done') body = '<section class="t2-sec"><p class="t2-empty">' + (sl.state === 'soon' ? '오늘 ' + hmK(sl.start) + '에 방송해요 (' + leftTxt(sl.start - now) + ' 남았어요).<br>' : '지금 방송 중이에요.<br>') + '방송이 끝나면 전문가별 추천 종목과 가격을 정리해서 보여 드려요.</p></section>';
    else if (!pk.length) body = '<section class="t2-sec"><p class="t2-empty">' + (ep && ep.published ? '이 회차에 정리된 종목이 없어요.' : '방송에서 나온 종목을 정리하는 중이에요.<br>정리되면 여기에 보여 드려요.') + '</p></section>';
    else {
      var groups = [], gi = {};
      pk.forEach(function(k){ var g = bcNorm(k.expert_name); if (!(g in gi)) { gi[g] = groups.length; groups.push({ name: k.expert_name, x: bcX(w, k.expert_id, k.expert_name), picks: [] }); } groups[gi[g]].picks.push(k); });
      body = groups.map(function(g){
        return '<section class="t2-sec"><div class="p-xh"><span class="av" aria-hidden="true">' + esc(String(g.name).charAt(0)) + '</span><b>' + esc(g.name) + '</b>' +
          (g.x ? '<button class="p-xgo" data-a="expert" data-v="' + esc(g.x.id) + '">전문가 홈</button>' : '') + '</div>' + g.picks.map(function(k){ return pickCard(k, ep, w); }).join('') +
          (g.x ? leadCard(g.x, w) : '') + '</section>';
      }).join('') + '<p class="t2-basis">방송에서 전문가가 직접 한 말과 가격을 옮겼어요. 앞뒤 맥락은 원본 영상에서 꼭 확인해 주세요. 사거나 팔라는 권유가 아니에요.</p>';
    }
    return '<main class="t2" style="padding-top:.25rem">' + head + body + '<button class="p-go" data-a="pBcAll"><span>지난 방송 모두 보기</span>' + IC.chev + '</button></main>';
  }
  // 지난 방송 모아 보기: 프로그램·전문가로 골라 보기, 주별로 묶어요
  function weekLbl(ymd){ var ms = kstMs(ymd), wd = wdOf(ymd), mon = ymdOf(ms - (wd - 1) * 864e5), fri = ymdOf(kstMs(mon) + 4 * 864e5);
    return (+mon.slice(5, 7)) + '월 ' + (+mon.slice(8, 10)) + '일 ~ ' + (+fri.slice(5, 7) !== +mon.slice(5, 7) ? (+fri.slice(5, 7)) + '월 ' : '') + (+fri.slice(8, 10)) + '일'; }
  function screenBcAll(w){
    var F = X.bc || {}, S2 = w.S, f = S2.pba = S2.pba || { pg: '', ex: '' }, now = nowK(), today = ymdOf(now);
    var P = {}; (F.programs || []).forEach(function(p){ P[p.id] = p; });
    var eps = (F.episodes || []).filter(function(e){ return P[e.program_id] && !e.canceled && e.published && e.air_date <= today; });
    var who = function(e){ return (e.experts || []).concat((e.picks || []).map(function(k){ return { name: k.expert_name }; })); };
    var exNames = {}; eps.forEach(function(e){ who(e).forEach(function(x){ var k = bcNorm(x.name); if (k && !exNames[k]) exNames[k] = x.name; }); });
    var L = eps.filter(function(e){ if (f.pg && e.program_id !== f.pg) return false; if (f.ex && !who(e).some(function(x){ return bcNorm(x.name) === f.ex; })) return false; return true; })
      .sort(function(a, b){ return a.air_date < b.air_date ? 1 : a.air_date > b.air_date ? -1 : 0; });
    var all = [], rs = [];
    L.forEach(function(e){ (e.picks || []).forEach(function(k){ if (f.ex && bcNorm(k.expert_name) !== f.ex) return; all.push(k); var r = pickRet(k); if (r) rs.push(r.v); }); });
    var avg = rs.length ? rs.reduce(function(a, b){ return a + b; }, 0) / rs.length : null;
    var chipsP = '<div class="p-tchips" role="group" aria-label="프로그램">' + [['', '전체']].concat((F.programs || []).map(function(p){ return [p.id, p.name]; })).map(function(c){ return '<button data-a="pBcAllPg" data-v="' + esc(c[0]) + '" aria-pressed="' + (f.pg === c[0]) + '">' + esc(c[1]) + '</button>'; }).join('') + '</div>';
    var exSel = '<div class="p-tsel"><select data-pba="ex" aria-label="전문가"><option value="">전체 전문가</option>' + Object.keys(exNames).sort(function(a, b){ return exNames[a] < exNames[b] ? -1 : 1; }).map(function(k){ return '<option value="' + esc(k) + '"' + (f.ex === k ? ' selected' : '') + '>' + esc(exNames[k]) + '</option>'; }).join('') + '</select></div>';
    var h = '<main class="t2" style="padding-top:.25rem"><div class="p-tbar">' + chipsP + exSel + '</div>' +
      '<div class="p-kv"><div><span>방송</span><b>' + L.length + '회</b></div><div><span>추천 종목</span><b>' + all.length + '개</b></div><div><span>평균 수익률</span><b class="' + (avg == null ? '' : tone(avg)) + '">' + (avg == null ? '-' : pctS(avg)) + '</b></div></div>' +
      '<p class="t2-basis2" style="padding:.25rem 0 .75rem">방송에서 말한 매수가 기준 · 수익률이 계산된 ' + rs.length + '종목 평균이에요</p>';
    if (!L.length) return h + '<section class="t2-sec"><p class="t2-empty">조건에 맞는 지난 방송이 없어요.</p></section></main>';
    var groups = [], gi = {};
    L.forEach(function(e){ var wk = weekLbl(e.air_date); if (!(wk in gi)) { gi[wk] = groups.length; groups.push({ wk: wk, eps: [] }); } groups[gi[wk]].eps.push(e); });
    h += groups.map(function(g){
      return '<section class="t2-sec"><div class="t2-h" style="cursor:default">' + esc(g.wk) + '<span class="n">' + g.eps.length + '</span></div>' + g.eps.map(function(e){
        var p = P[e.program_id], st = kstMs(e.air_date + 'T' + (p.air_time || '20:30'));
        return bcRow({ key: e.program_id + '|' + e.air_date, p: p, date: e.air_date, ep: e, start: st, end: st + (p.duration_min || 60) * 60000, state: 'done' });
      }).join('') + '</section>';
    }).join('');
    return h + '<p class="t2-basis">최근 4개월 방송이에요 · 사거나 팔라는 권유가 아니에요</p></main>';
  }
  // 전문가에게 생긴 호감을 가입으로: 관심 전문가로 받기
  function leadCard(x, w){
    var f = false; try { f = w.isFollow(x.id); } catch (e) {}
    if (f) return '<p class="p-fol">' + esc(nameOnly(x.name)) + ' 님을 관심 전문가로 받고 있어요 ✓</p>';
    var fans = 0; try { fans = w.fansOf(x); } catch (e) {}
    return '<div class="p-lead"><b>' + esc(nameOnly(x.name)) + ' 님의 다음 방송 정리, 놓치지 않게 받아 볼까요?</b><span>' + (fans > 0 ? fans.toLocaleString('ko-KR') + '명이 받고 있어요 · ' : '') + '방송이 끝나면 이 전문가의 종목과 가격을 정리해 알려 드려요</span>' +
      '<button class="p-btn" data-a="pBcFollow" data-v="' + esc(x.id) + '">' + (window.__pW && window.__pW.P && window.__pW.P.member ? '관심 전문가로 받기' : '카카오로 3초 가입하고 받기') + '</button></div>';
  }
  // 전문가 홈: 방송 추천 종목 모아 보기
  function expertBc(w, id){
    if (!X.bc) return '';
    var x = w.expertById(id); if (!x) return '';
    var P = {}; (X.bc.programs || []).forEach(function(p){ P[p.id] = p; });
    var rows = [];
    (X.bc.episodes || []).forEach(function(ep){ if (!ep.published || ep.canceled || !P[ep.program_id]) return;
      (ep.picks || []).forEach(function(k){ if ((k.expert_id && k.expert_id === id) || bcNorm(k.expert_name) === bcNorm(x.name)) rows.push({ k: k, ep: ep, p: P[ep.program_id] }); }); });
    var apps = (X.bc.episodes || []).filter(function(ep){ return ep.published && !ep.canceled && P[ep.program_id] && (ep.experts || []).some(function(e){ return e.id === id || bcNorm(e.name) === bcNorm(x.name); }); }).length;
    if (!rows.length && !apps) return '';
    var rs = rows.map(function(r){ return pickRet(r.k); }).filter(Boolean), avg = rs.length ? rs.reduce(function(s, r){ return s + r.v; }, 0) / rs.length : null;
    rows.sort(function(a, b){ return String(b.ep.air_date) < String(a.ep.air_date) ? -1 : 1; });
    return '<section class="t2-sec"><div class="t2-h" style="cursor:default">방송 추천 종목<span class="n">' + rows.length + '</span></div>' +
      '<div class="p-kv" style="margin-top:.25rem"><div><span>방송 출연</span><b>' + Math.max(apps, 1) + '회</b></div><div><span>추천 종목</span><b>' + rows.length + '개</b></div><div><span>방송일 이후 평균</span><b class="' + (avg == null ? '' : tone(avg)) + '">' + (avg == null ? '-' : pctS(avg)) + '</b></div></div>' +
      rows.slice(0, 12).map(function(r){ var key = r.ep.program_id + '|' + r.ep.air_date;
        return '<div class="p-bcx"><button class="p-bcx-h" data-a="pBc" data-v="' + esc(key) + '">' + esc(r.p.name) + ' · ' + dLbl(String(r.ep.air_date)) + IC.chev + '</button>' + pickCard(r.k, r.ep, w) + '</div>'; }).join('') +
      '<p class="p-disc">방송에서 말한 매수가 기준이에요. 사거나 팔라는 권유가 아니에요.</p></section>';
  }

  // ── 오늘의 언급 종목
  function mixBar(m){
    m = m || {}; var t = (m.buy || 0) + (m.watch || 0) + (m.sell || 0) + (m.etc || 0); if (!t) return '<span class="p-mix"></span>';
    var p = function(n){ return (n / t * 100).toFixed(1) + '%'; };
    return '<span class="p-mix" aria-label="구매 ' + (m.buy || 0) + ', 지켜보기 ' + (m.watch || 0) + ', 판매 ' + (m.sell || 0) + '">' + (m.buy ? '<i class="b" style="width:' + p(m.buy) + '"></i>' : '') + (m.watch ? '<i class="w" style="width:' + p(m.watch) + '"></i>' : '') + (m.sell ? '<i class="s" style="width:' + p(m.sell) + '"></i>' : '') + (m.etc ? '<i class="e" style="width:' + p(m.etc) + '"></i>' : '') + '</span>';
  }
  function rows(items, n){
    return items.slice(0, n).map(function(it){
      return '<button class="t2-row" data-a="pMention" data-v="' + esc(it.code) + '"><span class="t2-rk">' + it.rank + '</span><span class="t2-mid"><b>' + esc(it.name) + '</b><span>전문가 ' + it.n_ex + '명 · 글 ' + it.n_post + '개</span></span>' + mixBar(it.mix) + '</button>';
    }).join('');
  }
  var LEG = '<div class="p-lg"><span><i class="b"></i>구매</span><span><i class="w"></i>지켜보기</span><span><i class="s"></i>판매</span></div>';
  var DISC = '<p class="p-disc">전문가들이 공개 채널·방송에서 한 말을 세어 정리한 기록이에요. 투자 권유가 아니에요.</p>';
  function mentionsHome(){
    var M = X.mention; if (!M) return '';
    var items = M.items || [], isToday = M.day === M.today;
    if (M.weekday && !M.opened) {
      var h = '<section class="t2-sec"><div class="t2-h" style="cursor:default">오늘의 언급 종목</div><div class="p-lock">' + IC.lock + '<b>장 마감 뒤 15:40에 정리돼요</b><span>장 중에는 따라 사기 신호처럼 보이지 않도록<br>공개하지 않아요</span></div>';
      if (M.day && items.length) h += '<div class="t2-h" style="cursor:default;font-size:1.0625rem;margin-top:.25rem">지난 정리<span class="p-day">' + dayLbl(M.day) + '</span></div>' + rows(items, 3) + LEG;
      return h + '</section>';
    }
    if (!M.day) return '';
    var head = '<div class="t2-h" style="cursor:default">' + (isToday ? '오늘의 언급 종목' : '최근 언급 종목') + '<span class="p-day">' + dayLbl(M.day) + ' 마감</span></div>';
    if (!items.length) return '<section class="t2-sec">' + head + '<p class="t2-empty">' + (isToday ? '오늘' : '이날') + '은 정리할 전문가 언급이 없어요.<br>전문가 글이 모이면 장 마감 뒤에 여기서 보여 드릴게요.</p></section>';
    return '<section class="t2-sec">' + head +
      (M.summary && !(isToday && M.opened) ? '<div class="p-ai" style="margin:.5rem 0 .25rem"><div class="p-ai-h"><span class="p-badge' + (M.summary_by === 'ai' ? '' : ' auto') + '">' + (M.summary_by === 'ai' ? IC.spark + 'AI 한 줄' : '한 줄 정리') + '</span></div><p>' + esc(M.summary) + '</p></div>' : '') +
      rows(items, 5) + LEG + DISC + '</section>';
  }
  function screenMention(code){
    var M = X.mention || {}, it = (M.items || []).filter(function(x){ return x.code === code; })[0];
    if (!it) return '<main class="t2"><section class="t2-sec"><p class="t2-empty">이 종목의 언급 정리를 찾지 못했어요.</p></section></main>';
    var m = it.mix || {};
    var says = (it.says || []).map(function(s){
      var px = [];
      if (s.buy) px.push('구매 ' + wonS(s.buy)); if (s.target) px.push('목표 ' + wonS(s.target)); if (s.stop) px.push('손해 막는 ' + wonS(s.stop)); if (s.sell) px.push('판매 ' + wonS(s.sell));
      return '<div class="p-tl ' + esc(s.t) + '"><i></i><small>' + hm(s.at) + ' · <b style="color:var(--ink)">' + esc(s.xname) + '</b></small><b>' + esc(TL[s.t] || '조언') + (s.via === 'ai' ? '<span class="p-aitag">AI 분류 · 검수 전</span>' : '') + '</b>' +
        (px.length ? '<p>' + px.join(' · ') + '</p>' : '') + (s.text ? '<p>"' + esc(s.text) + '"' + (s.url ? ' <a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">원문</a>' : '') + '</p>' : (s.url ? '<p><a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">원문 보기</a></p>' : '')) + '</div>';
    }).join('');
    return '<main class="t2" style="padding-top:.25rem"><section class="t2-sec" style="padding-top:1.25rem">' +
      '<p style="font-size:.9375rem;color:var(--ink2)">' + dayLbl(M.day) + ' · ' + it.rank + '위 · 전문가 ' + it.n_ex + '명 · 글 ' + it.n_post + '개</p><h2 style="font-size:1.75rem;font-weight:800;letter-spacing:-.03em;margin-top:.1rem">' + esc(it.name) + '</h2>' +
      '<div class="p-kv"><div><span>구매 의견</span><b class="up">' + (m.buy || 0) + '명</b></div><div><span>지켜보기</span><b>' + (m.watch || 0) + '명</b></div><div><span>판매</span><b class="down">' + (m.sell || 0) + '명</b></div></div>' +
      '<p class="t2-basis2" style="padding:.25rem 0 .75rem">전문가마다 이날 마지막으로 한 말 기준이에요</p>' + (window.__pW ? oneCard(stockLine(window.__pW, code), 'stock', code) : '') + '</section>' +
      '<section class="t2-sec"><div class="t2-h" style="cursor:default">전문가별 한 말</div>' + says + '<p class="p-disc">"AI 분류"는 공개 채널 글을 AI가 읽고 나눈 거예요. 운영자 검수 전이라 원문을 꼭 함께 확인해 주세요.</p></section>' +
      (window.__pW && window.__pW.STOCKS && window.__pW.STOCKS[code] ? '<button class="p-go" data-a="stock" data-v="' + esc(code) + '"><span>종목 전체 기록 보기</span>' + IC.chev + '</button>' : '<a class="p-go" style="text-decoration:none" href="https://finance.naver.com/item/main.naver?code=' + esc(code) + '" target="_blank" rel="noopener noreferrer"><span>네이버 증권에서 보기</span>' + IC.chev + '</a>') +
      '<p class="t2-basis">공개된 말을 모아 정리했어요 · 투자 권유가 아니에요</p></main>';
  }

  // ── 표로 보기
  function tableRows(w, f){
    var out = [], from = f.days ? new Date(Date.now() - f.days * 864e5 + 9 * 3600e3).toISOString().slice(0, 10) : '';
    w.LEADINGS.forEach(function(Lx){
      if (f.ex && Lx.expert !== f.ex) return;
      var a; try { a = w.analyze(Lx); } catch (e) { return; }
      var x = w.expertById(Lx.expert) || {}, st = w.STOCKS[Lx.stock] || {};
      a.steps.forEach(function(s){
        var e = s.e; if (!TL[e.t] || e.t === 'news') return;
        if (f.t && f.t !== 'all' && e.t !== f.t) return;
        if (from && String(e.at).slice(0, 10) < from) return;
        out.push({ lid: Lx.id, at: e.at, ex: x.name || Lx.expert, exId: Lx.expert, code: Lx.stock, name: st.name || Lx.stock, t: e.t, buy: e.buy, target: e.target, stop: e.stop, sell: e.sell, ret: e.t === 'sell' ? s.ret : null,
          status: a.status, text: e.text || '', src: e.src || e.kind || '', url: e.url || '' });
      });
    });
    return out.sort(function(p, r){ return p.at < r.at ? 1 : p.at > r.at ? -1 : 0; });
  }
  function resultCell(r){
    if (r.t === 'sell') return '<span class="' + tone(r.ret) + '">' + pctS(r.ret) + '</span>';
    if (r.status === 'done') return '<span class="mut">끝남</span>';
    if (r.status === 'holding') return '<span class="mut">진행 중</span>';
    return '<span class="mut">-</span>';
  }
  function mainPrice(r){ return r.t === 'sell' ? r.sell : r.t === 'revise' ? (r.target || r.buy || r.stop) : r.buy; }
  function dt(at){ var s = String(at || ''); return (+s.slice(5, 7)) + '.' + s.slice(8, 10); }
  function screenTable(w){
    var S = w.S, f = S.ptf = S.ptf || { ex: '', days: 30, t: 'all' };
    var R = tableRows(w, f), wide = false;
    var exs = w.EXPERTS.filter(function(x){ return w.LEADINGS.some(function(l){ return l.expert === x.id; }); });
    var exSel = '<select data-pt="ex" aria-label="전문가"><option value="">전체 전문가</option>' + exs.map(function(x){ return '<option value="' + esc(x.id) + '"' + (f.ex === x.id ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select>';
    var daySel = '<select data-pt="days" aria-label="기간">' + [[30, '최근 30일'], [90, '최근 90일'], [0, '전체 기간']].map(function(d){ return '<option value="' + d[0] + '"' + (+f.days === d[0] ? ' selected' : '') + '>' + d[1] + '</option>'; }).join('') + '</select>';
    var types = [['all', '전체'], ['buy', '구매'], ['sell', '판매'], ['watch', '지켜보기'], ['revise', '가격 변경'], ['strategy', '조언']];
    var sells = R.filter(function(r){ return r.t === 'sell' && r.ret != null; }), avg = sells.length ? sells.reduce(function(s, r){ return s + r.ret; }, 0) / sells.length : null;
    if (!wide) {
      var h = '<main class="t2" style="padding-top:.25rem">' + (wideTop() ? '<button class="p-go" data-a="pSheet"><span>' + IC.grid + '넓은 화면 스프레드시트로 보기</span>' + IC.chev + '</button>' : '') + '<div class="p-tbar"><div class="p-tsel">' + exSel + daySel + '</div><div class="p-tchips" role="group" aria-label="구분">' +
        types.map(function(t){ return '<button data-a="pTblT" data-v="' + t[0] + '" aria-pressed="' + (f.t === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div></div>';
      if (!R.length) return h + '<section class="t2-sec"><p class="t2-empty">이 조건에 맞는 기록이 없어요.</p></section></main>';
      h += '<div class="p-twrap"><table class="p-tbl"><thead><tr><th>날짜</th><th>전문가</th><th>종목</th><th>구분</th><th class="n">가격</th><th class="n">결과</th><th class="n">목표</th><th class="n">손해 막는</th><th>출처</th></tr></thead><tbody>' +
        R.slice(0, 300).map(function(r){
          return '<tr data-a="toLeading" data-v="' + esc(r.lid) + '"><td>' + dt(r.at) + '</td><td><b>' + esc(String(r.ex).replace(/ (대표|위원)$/, '')) + '</b></td><td>' + esc(r.name) + '</td><td class="' + (r.t === 'buy' ? 'up' : r.t === 'sell' ? 'down' : '') + '">' + TL[r.t] + '</td>' +
            '<td class="n">' + wonS(mainPrice(r)) + '</td><td class="n">' + resultCell(r) + '</td><td class="n">' + wonS(r.target) + '</td><td class="n">' + wonS(r.stop) + '</td><td>' + (r.url ? '<a href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">' + esc(r.src || '원문') + '</a>' : esc(r.src)) + '</td></tr>';
        }).join('') + '</tbody></table></div><p class="p-tnote">' + R.length + '건' + (avg != null ? ' · 판매 ' + sells.length + '건 평균 ' + pctS(avg) : '') + ' · 표를 옆으로 밀면 목표·손해 막는 가격·출처가 더 있어요</p>';
      return h + '<p class="t2-basis">전문가가 말한 가격 기준이에요 · 투자 권유가 아니에요</p></main>';
    }
    return '';
  }
  // PC: 사이트 화면 전체를 쓰는 스프레드시트
  function wideTop(){ return window.innerWidth >= 960; }
  function sheetHTML(w){
    var f = w.S.ptf = w.S.ptf || { ex: '', days: 30, t: 'all' };
    var R = tableRows(w, f);
    var exs = w.EXPERTS.filter(function(x){ return w.LEADINGS.some(function(l){ return l.expert === x.id; }); });
    var exSel = '<select data-pt="ex" aria-label="전문가"><option value="">전체 전문가</option>' + exs.map(function(x){ return '<option value="' + esc(x.id) + '"' + (f.ex === x.id ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select>';
    var daySel = '<select data-pt="days" aria-label="기간">' + [[30, '최근 30일'], [90, '최근 90일'], [0, '전체 기간']].map(function(d){ return '<option value="' + d[0] + '"' + (+f.days === d[0] ? ' selected' : '') + '>' + d[1] + '</option>'; }).join('') + '</select>';
    var types = [['all', '전체'], ['buy', '구매'], ['sell', '판매'], ['watch', '지켜보기'], ['revise', '가격 변경'], ['strategy', '조언']];
    var sells = R.filter(function(r){ return r.t === 'sell' && r.ret != null; }), avg = sells.length ? sells.reduce(function(s2, r){ return s2 + r.ret; }, 0) / sells.length : null;
    var cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    var body = R.slice(0, 500).map(function(r, i){
      return '<tr data-row="' + i + '"><td class="rn">' + (i + 2) + '</td><td>' + esc(String(r.at).slice(5, 16).replace('T', ' ').replace('-', '.')) + '</td><td><b>' + esc(r.ex) + '</b></td><td>' + esc(r.name) + '</td>' +
        '<td class="' + (r.t === 'buy' ? 'up' : r.t === 'sell' ? 'down' : '') + '">' + TL[r.t] + '</td><td class="n">' + wonS(r.buy) + '</td><td class="n">' + wonS(r.target) + '</td><td class="n">' + wonS(r.stop) + '</td>' +
        '<td class="n">' + (r.t === 'sell' ? resultCell(r) + ' <span class="mut">(' + wonS(r.sell) + ')</span>' : resultCell(r)) + '</td><td>' + (r.url ? '<a href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">' + esc(r.src || '원문') + '</a>' : esc(r.src)) + '</td></tr>';
    }).join('');
    X.tbl = R;
    return '<div class="p-ss"><div class="p-ss-tool"><b style="margin-right:.5rem;font-size:1rem">전체 추천 기록 · 표로 보기</b>' + exSel + daySel +
      '<select data-pt="t" aria-label="구분">' + types.map(function(t){ return '<option value="' + t[0] + '"' + (f.t === t[0] ? ' selected' : '') + '>구분: ' + t[1] + '</option>'; }).join('') + '</select>' +
      '<span class="sp"></span><button class="p-sumbtn" data-sw="close" style="background:var(--raise);color:var(--ink)">카드 화면으로</button></div>' +
      '<div class="p-ss-fx"><span class="cell" id="p-cell">C2</span><span class="fx">fx</span><span class="txt" id="p-fx">' + (R[0] ? esc(R[0].name + ' · ' + R[0].ex + (R[0].text ? ' "' + R[0].text + '"' : '')) : '이 조건에 맞는 기록이 없어요') + '</span></div>' +
      '<div class="p-ss-grid"><table><thead><tr><th style="width:2.5rem"></th>' + cols.map(function(c){ return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      '<tr class="hd"><td class="rn">1</td><td>날짜</td><td>전문가</td><td>종목</td><td>구분</td><td class="n">구매 가격</td><td class="n">목표 가격</td><td class="n">손해 막는 가격</td><td class="n">결과</td><td>출처</td></tr>' + body +
      '<tr class="hd"><td class="rn">' + (Math.min(R.length, 500) + 2) + '</td><td>합계 · 평균</td><td>' + R.length + '건</td><td></td><td></td><td></td><td></td><td></td><td class="n">' + (avg != null ? '판매 ' + sells.length + '건 평균 ' + pctS(avg) : '-') + '</td><td></td></tr>' +
      '</tbody></table></div><div class="p-ss-tabs"><button class="on">전문가 기록</button><button data-sw-go="rank">성적표</button><button data-sw-go="home">오늘의 언급</button><button data-sw-go="watch">관심 종목</button></div></div>' +
      '<p class="p-tnote" style="text-align:center">전문가가 말한 가격 기준이에요 · 투자 권유가 아니에요 · 칸을 누르면 위쪽 fx 줄에 전문가가 한 말이 보여요</p>';
  }
  var SW_CSS = '#p-sw{position:fixed;inset:0;z-index:150;background:var(--bg);color:var(--ink);font-family:var(--f-ui);display:flex;flex-direction:column;padding:16px 24px 12px}' +
    '#p-sw .p-ss{flex:1;min-height:0;display:flex;flex-direction:column;max-width:1500px;width:100%;margin:0 auto}#p-sw .p-ss-grid{flex:1;max-height:none}';
  function openSheetWin(w){
    var d = document, old = d.getElementById('p-sw'); if (old) old.remove();
    if (!d.getElementById('p-css-top')) { var st = d.createElement('style'); st.id = 'p-css-top'; st.textContent = CSS + '\n' + SW_CSS; d.head.appendChild(st); }
    var box = d.createElement('div'); box.id = 'p-sw'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', '전체 추천 기록 표');
    var draw = function(){ box.innerHTML = sheetHTML(w); };
    draw(); d.body.appendChild(box); d.body.style.overflow = 'hidden';
    var close = function(){ box.remove(); d.body.style.overflow = ''; d.removeEventListener('keydown', esc2); };
    var esc2 = function(e){ if (e.key === 'Escape') close(); };
    d.addEventListener('keydown', esc2);
    box.addEventListener('change', function(ev){ var s2 = ev.target.closest && ev.target.closest('[data-pt]'); if (!s2) return; var k = s2.getAttribute('data-pt'); w.S.ptf[k] = k === 'days' ? +s2.value : s2.value; draw(); });
    box.addEventListener('click', function(ev){
      var b = ev.target.closest && ev.target.closest('[data-sw],[data-sw-go]');
      if (b) { close(); var g = b.getAttribute('data-sw-go'); if (g === 'rank') { w.S.stack = [{ t: 'rank' }]; w.render(); } else if (g === 'home' || g === 'watch') { w.S.stack = []; w.S.tab = g; w.render(); } return; }
      var td = ev.target.closest && ev.target.closest('tbody tr[data-row] td');
      if (td && !ev.target.closest('a')) {
        var tr = td.parentNode, i = +tr.getAttribute('data-row'), r = (X.tbl || [])[i]; if (!r) return;
        Array.prototype.forEach.call(box.querySelectorAll('.cur,tr.sel'), function(x){ x.classList.remove('cur'); x.classList.remove('sel'); });
        td.classList.add('cur'); tr.classList.add('sel');
        var col = 'ABCDEFGHIJ'.charAt(Math.max(0, Array.prototype.indexOf.call(tr.children, td) - 1));
        box.querySelector('#p-cell').textContent = col + (i + 2);
        box.querySelector('#p-fx').textContent = r.name + ' · ' + r.ex + ' · ' + TL[r.t] + (r.text ? ' "' + r.text + '"' : '');
      }
    });
  }

  // ── 성적표 카드
  function cardData(w, id){
    var x = w.expertById(id), st = w.expertStats(id);
    var done = st.list.filter(function(a){ return a.status === 'done'; }).sort(function(a, b){ return a.endAt < b.endAt ? 1 : -1; });
    var last = done.slice(0, 10).reverse();
    var STY = { day: '단타', swing: '스윙', long: '중장기' };
    return { name: x.name, style: STY[x.style] || '', total: st.doneCount, active: st.active, full: st.doneCount >= 10,
      wins: last.filter(function(a){ return a.ret > 0; }).length, dots: last.map(function(a){ return a.ret > 0; }), avg: st.avg, today: w.DATA_TODAY || '' };
  }
  function drawCard(d, cv){
    var c = cv.getContext('2d'), W = 1080, F = '"Pretendard Variable",Pretendard,"Apple SD Gothic Neo","Noto Sans KR",sans-serif';
    cv.width = W; cv.height = W;
    var g = c.createLinearGradient(0, 0, W, W); g.addColorStop(0, '#4E3FE8'); g.addColorStop(1, '#8A5CF6'); c.fillStyle = g; c.fillRect(0, 0, W, W);
    c.globalAlpha = .08; c.fillStyle = '#fff'; c.beginPath(); c.arc(W - 120, 140, 260, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    function rr(x, y, w2, h, r){ c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w2, y, x + w2, y + h, r); c.arcTo(x + w2, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w2, y, r); c.closePath(); }
    c.fillStyle = '#fff'; rr(80, 80, 64, 64, 18); c.fill(); c.fillStyle = '#5B4CF0';
    [[96, 20], [109, 34], [122, 46]].forEach(function(b){ rr(b[0], 128 - b[1], 10, b[1], 4); c.fill(); });
    c.fillStyle = 'rgba(255,255,255,.92)'; c.font = '700 40px ' + F; c.textBaseline = 'middle'; c.fillText('리딩노트 성적표', 166, 113);
    c.textBaseline = 'alphabetic'; c.fillStyle = '#fff';
    var nm = d.name, fs = 92; c.font = '800 ' + fs + 'px ' + F; while (c.measureText(nm).width > W - 160 && fs > 50) { fs -= 4; c.font = '800 ' + fs + 'px ' + F; }
    c.fillText(nm, 80, 300);
    c.fillStyle = 'rgba(255,255,255,.78)'; c.font = '600 40px ' + F;
    c.fillText((d.style ? d.style + ' 매매 · ' : '') + (d.full ? '최근 끝난 추천 10건' : '공개 추천 기록 모아보기'), 80, 370);
    if (d.full) {
      d.dots.forEach(function(h, i){ var cx = 104 + i * 74, cy = 470; c.beginPath(); c.arc(cx, cy, 24, 0, Math.PI * 2); if (h) { c.fillStyle = '#FFE27A'; c.fill(); } else { c.lineWidth = 6; c.strokeStyle = 'rgba(255,255,255,.75)'; c.stroke(); } });
      c.font = '800 96px ' + F; c.fillStyle = '#fff'; var a1 = '10건 중 ', a2 = d.wins + '건', a3 = ' 수익';
      var x0 = 80; c.fillText(a1, x0, 640); x0 += c.measureText(a1).width; c.fillStyle = '#FFE27A'; c.fillText(a2, x0, 640); x0 += c.measureText(a2).width; c.fillStyle = '#fff'; c.fillText(a3, x0, 640);
      c.font = '600 40px ' + F; c.fillStyle = 'rgba(255,255,255,.85)'; c.fillText('판매까지 끝난 추천 ' + d.total + '건 평균 수익률 ' + pctS(d.avg), 80, 720);
    } else {
      c.font = '800 88px ' + F; c.fillStyle = '#fff'; c.fillText('끝난 추천 ' + d.total + '건', 80, 560); c.fillText('리딩 중 ' + d.active + '건', 80, 670);
      c.font = '600 38px ' + F; c.fillStyle = 'rgba(255,255,255,.8)'; c.fillText('성적은 끝난 추천이 10건을 넘으면 보여 드려요', 80, 750);
    }
    c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(80, 860, W - 160, 2);
    c.font = '600 34px ' + F; c.fillStyle = 'rgba(255,255,255,.9)'; c.fillText('리딩노트에서 날짜별 기록 보기', 80, 930);
    c.textAlign = 'right'; c.fillStyle = 'rgba(255,255,255,.7)'; c.fillText((d.today || '').replace(/-/g, '.') + ' 기준', W - 80, 930);
    c.font = '500 26px ' + F; c.fillStyle = 'rgba(255,255,255,.6)'; c.fillText('전문가가 공개한 가격 기준 · 투자 권유가 아니에요', W - 80, 990); c.textAlign = 'left';
  }
  function openCard(w, d, id){
    closeSheet(d);
    var cd = cardData(w, id), cv = d.createElement('canvas');
    var lnk = link('x-' + id), line = cd.full ? '최근 끝난 추천 10건 중 ' + cd.wins + '건 수익' : '끝난 추천 ' + cd.total + '건 · 리딩 중 ' + cd.active + '건';
    var text = '[리딩노트] ' + cd.name + ' 추천 기록\n' + line + '\n날짜별 기록 보기 ▶ ' + lnk;
    var canShare = !!(w.navigator.share);
    var sc = d.createElement('div'); sc.className = 'p-scrim'; sc.id = 'p-scrim';
    sc.innerHTML = '<div class="p-sheet" role="dialog" aria-modal="true" aria-label="성적표 카드 공유"><div class="p-grab"></div><div class="p-sh"><b>이 성적표를 보내 볼까요?</b><button data-p="close" aria-label="닫기">' + IC.x + '</button></div>' +
      '<img class="p-prev" alt="' + esc(cd.name + ' 성적표 카드: ' + line) + '"><div class="p-row3">' +
      (canShare ? '<button class="p-b2 main" data-p="share">' + IC.share + '카톡 등으로 보내기</button>' : '') +
      '<button class="p-b2' + (canShare ? '' : ' main') + '" data-p="save">' + IC.down + '이미지 저장</button><button class="p-b2" data-p="copy">' + IC.link + '링크 복사</button></div>' +
      '<p class="p-note">받은 분은 가입 없이 링크로 바로 기록을 볼 수 있어요</p></div>';
    d.body.appendChild(sc); d.body.style.overflow = 'hidden';
    var fontReady = d.fonts && d.fonts.load ? Promise.race([d.fonts.load('800 60px "Pretendard Variable"'), new Promise(function(r){ setTimeout(r, 1200); })]) : Promise.resolve();
    var blobP = fontReady.then(function(){ drawCard(cd, cv); sc.querySelector('.p-prev').src = cv.toDataURL('image/png'); return new Promise(function(r){ try { cv.toBlob(r, 'image/png'); } catch (e) { r(null); } }); });
    sc.addEventListener('click', function(ev){
      if (ev.target === sc) return closeSheet(d);
      var b = ev.target.closest && ev.target.closest('[data-p]'); if (!b) return;
      var a = b.getAttribute('data-p');
      if (a === 'close') return closeSheet(d);
      if (a === 'copy') { try { w.copyOut(text, '문구와 링크를 복사했어요. 카카오톡에 붙여 넣으세요'); } catch (e) {} return; }
      blobP.then(function(blob){
        var fname = 'leadingnote-card-' + String(id).replace(/[^A-Za-z0-9_-]/g, '') + '.png';
        if (a === 'save') { var u = blob ? w.URL.createObjectURL(blob) : cv.toDataURL('image/png'), l = d.createElement('a'); l.href = u; l.download = fname; d.body.appendChild(l); l.click(); l.remove(); try { w.toast('이미지를 저장했어요'); } catch (e) {} return; }
        if (a === 'share') {
          var file = null; try { file = blob ? new w.File([blob], fname, { type: 'image/png' }) : null; } catch (e) {}
          var data = { title: cd.name + ' 추천 기록', text: text };
          if (file && w.navigator.canShare && w.navigator.canShare({ files: [file] })) data.files = [file]; else data.url = lnk;
          w.navigator.share(data).catch(function(){});
        }
      });
    });
  }
  function closeSheet(d){ var s = d.getElementById('p-scrim'); if (s) { s.remove(); d.body.style.overflow = ''; } }

  // ── 이야기방 요약
  function sumBar(room){
    var r = X.talk[room], box = '';
    if (r && r.busy) box = '<div class="p-sumbox">요약하는 중이에요…</div>';
    else if (r && r.err) box = '<div class="p-sumbox">' + esc(r.err) + '</div>';
    else if (r && r.few) box = '<div class="p-sumbox">아직 요약할 만큼 대화가 없어요 (최근 6시간 ' + r.n + '개)</div>';
    else if (r && r.body) box = '<div class="p-sumbox"><button class="p-x" data-psum-x="' + esc(room) + '">접기</button>' + (r.line ? '<b class="p-sl">' + esc(r.line) + '</b>' : '') + esc(r.body) + '<small>' + (r.by === 'ai' ? 'AI 요약' : '자동 정리') + ' · 최근 6시간 대화 ' + ((r.facts || {}).n || '') + '개 기준 · ' + hm(r.made_at) + ' · 회원 대화를 정리한 것으로 투자 권유가 아니에요</small></div>';
    return '<div class="p-sumbar"><button class="p-sumbtn" data-psum="' + esc(room) + '">' + IC.spark + (r && r.body ? '요약 다시 보기' : '놓친 대화 요약') + '</button>' + box + '</div>';
  }
  function runSum(room){
    var c = sb(); if (!c) return;
    X.talk[room] = { busy: true }; redraw();
    q(c.functions.invoke('talk-summary', { body: { room: room } })).then(function(r){
      if (r.error || !r.data || !r.data.ok) X.talk[room] = { err: '지금은 요약을 만들 수 없어요. 잠시 뒤 다시 눌러 주세요' };
      else X.talk[room] = r.data;
      redraw();
    });
  }

  // ── 리딩 모음에 붙이기
  function patchLn(w, d){
    if (w.__p || !w.__t2 || !d.__lnLive || !w.A || !w.S || !w.P) return false;
    w.__p = true; window.__pW = w;
    var A = w.A, S = w.S, P = w.P;
    var st = d.createElement('style'); st.id = 'p-css'; st.textContent = CSS; d.head.appendChild(st);
    try { w.VIEW_TITLE.ptable = '전체 추천 기록'; w.VIEW_TITLE.pmention = '오늘의 언급 종목'; w.VIEW_TITLE.pbc = '방송 속 고수 종목'; w.VIEW_TITLE.pbcall = '지난 방송 모아 보기'; } catch (e) {}
    // 공유 링크: 예전 임시 주소 대신 이 사이트 주소
    w.linkOf = function(tok){ return link(tok); };
    var guest = function(){ return P.member ? '' : '<div class="p-guest"><span>가입 없이 모두 볼 수 있어요</span><button data-a="join">3초 가입</button></div>'; };
    var joinCard = function(){ return P.member ? '' : '<div class="p-join"><b>이 전문가가 새 추천을 하면 알려 드릴까요?</b><span>관심 전문가 · 관심종목 · 이야기 남기기만 가입이 필요해요</span><button class="p-btn" data-a="join">카카오로 3초 가입</button></div>'; };
    // 홈: 오늘의 언급 종목 + 표로 보기
    var oHome = w.screenHome;
    w.screenHome = function(){
      var h = oHome.apply(this, arguments), hl = homeLine(w), n0 = h.indexOf('<nav class="t2-sc4"');
      if (hl && n0 > -1) h = h.slice(0, n0) + oneCard(hl, null, null, 'hm') + h.slice(n0);
      var i = h.indexOf('</nav>');
      if (i > -1) h = h.slice(0, i + 6) + bcHome() + mentionsHome() + h.slice(i + 6);
      var j = h.lastIndexOf('<p class="t2-basis">');
      var go = '<button class="p-go" data-a="pTable"><span>' + IC.grid + '전체 추천 기록 · 표로 보기</span>' + IC.chev + '</button>';
      return j > -1 ? h.slice(0, j) + go + h.slice(j) : h + go;
    };
    // 전문가: 한눈 요약 · 카드 공유 · 가입 안내
    var oEx = w.screenExpert;
    w.screenExpert = function(id){
      var h = oEx.apply(this, arguments), k = h.indexOf('class="t2-basis2"');
      var add = '<button class="p-btn sub" data-a="pCard" data-v="' + esc(id) + '" style="margin:0 0 .875rem">' + IC.share + '성적표 카드로 공유하기</button>';
      var t0 = h.indexOf('<div class="t2-st">'); if (t0 > -1) { h = h.slice(0, t0) + oneCard(expertLine(w, id), 'expert', id) + h.slice(t0); k = h.indexOf('class="t2-basis2"'); }
      if (k > -1) { var e = h.indexOf('</section>', k); if (e > -1) h = h.slice(0, e) + add + h.slice(e); }
      h = h.replace(/<button class="t2-share"[^>]*>이 전문가 공유하기<\/button>/, '');
      var b = h.lastIndexOf('<p class="t2-basis">'); if (b > -1) h = h.slice(0, b) + expertBc(w, id) + joinCard() + h.slice(b);
      return h.replace('<main class="t2" style="padding-top:.25rem">', '<main class="t2" style="padding-top:.25rem">' + guest());
    };
    // 종목: 의견 흐름 요약 · 이야기방 요약
    var oSt = w.screenStock;
    w.screenStock = function(id){
      var h = oSt.apply(this, arguments), e = h.indexOf('</section>');
      if (e > -1) h = h.slice(0, e + 10) + (function(){ var L1 = stockLine(w, id); return L1 ? '<section class="screen gx" style="padding-top:.75rem;padding-bottom:0">' + oneCard(L1, 'stock', id) + '</section>' : ''; })() + h.slice(e + 10);
      h = h.replace(/(이야기방 <span class="cnt">\d+<\/span><\/h2>)/, '$1' + sumBar('s:' + id));
      return h.replace('<main>', '<main>' + (P.member ? '' : '<div class="gx" style="padding-top:.5rem">' + guest() + '</div>'));
    };
    // 추천 하나하나: 펼치면 맨 위에 한 줄
    var oSum = w.summaryHTML;
    w.summaryHTML = function(a){ var t = ''; try { t = leadLine(a); } catch (e) {} return (t ? '<p class="p-lline">' + esc(t) + '</p>' : '') + oSum.apply(this, arguments); };
    // 전문가 목록: 태그 대신 한 줄 요약
    var oRow = w.xrow;
    if (oRow) w.xrow = function(o){ var h = oRow.apply(this, arguments), L1 = null; try { L1 = o.x.live ? null : expertLine(w, o.x.id); } catch (e) {}
      return L1 && L1.t ? h.replace(/<span class="xr-s">[\s\S]*?<\/span>/, '<span class="xr-s p-xl">' + esc(L1.t) + '</span>') : h; };
    // 새 화면: 표로 보기 · 언급 종목 자세히
    var oXs = w.screenExperts;
    w.screenExperts = function(){
      var v = w.view();
      if (v && v.t === 'ptable') return screenTable(w);
      if (v && v.t === 'pmention') return screenMention(v.id);
      if (v && v.t === 'pbc') return screenBc(v.id);
      if (v && v.t === 'pbcall') return screenBcAll(w);
      return oXs.apply(this, arguments);
    };
    var top0 = function(){ try { w.scrollTo(0, 0); } catch (e) {} };
    A.pTable = function(v){ if (v) { S.ptf = { ex: v, days: 0, t: 'all' }; } if (wideTop()) { openSheetWin(w); return; } w.pushView('ptable', v || ''); w.render(); top0(); };
    A.pSheet = function(){ openSheetWin(w); };
    A.pTblT = function(v){ S.ptf = S.ptf || { ex: '', days: 30, t: 'all' }; S.ptf.t = v; w.render(); };
    A.pMention = function(v){ w.pushView('pmention', v); w.render(); top0(); };
    A.pBc = function(v){ w.pushView('pbc', v); w.render(); top0(); };
    A.pBcAll = function(){ w.pushView('pbcall', ''); w.render(); top0(); };
    A.pBcAllPg = function(v){ S.pba = S.pba || { pg: '', ex: '' }; S.pba.pg = v || ''; w.render(); };
    A.pBcFollow = function(v){
      var x = w.expertById(v); if (!x) return;
      try { if (w.isFollow(v)) { w.toast(nameOnly(x.name) + ' 님을 이미 받고 있어요'); return; } } catch (e) {}
      if (w.needMember(nameOnly(x.name) + ' 님의 방송 정리를 받아 보려면 무료 가입이 필요해요 (카카오로 3초)', { a: 'follow', v: v })) return;
      A.follow(v);
    };
    // 1분마다 시간 확인: 예고 → 방송 중 → 방송 끝 순서가 바뀌면 홈을 다시 그려요
    setInterval(function(){ try { if (!X.bc || w.view() || S.tab !== 'home') return; var sg = bcSig(bcSlots(X.bc, nowK())); if (sg !== X.bcSig) w.render(); } catch (e) {} }, 60000);
    A.pCard = function(v){ openCard(w, d, v); };
    d.addEventListener('change', function(ev){
      var sa = ev.target.closest && ev.target.closest('[data-pba]'); if (sa) { S.pba = S.pba || { pg: '', ex: '' }; S.pba.ex = sa.value; w.render(); return; }
      var s = ev.target.closest && ev.target.closest('[data-pt]'); if (!s) return;
      S.ptf = S.ptf || { ex: '', days: 30, t: 'all' }; var k = s.getAttribute('data-pt');
      S.ptf[k] = k === 'days' ? +s.value : s.value; w.render();
    });
    d.addEventListener('click', function(ev){
      var x = ev.target.closest && ev.target.closest('[data-psum-x]');
      if (x) { ev.preventDefault(); ev.stopPropagation(); X.talk[x.getAttribute('data-psum-x')] = null; redraw(); return; }
      var b = ev.target.closest && ev.target.closest('[data-psum]');
      if (b) { ev.preventDefault(); ev.stopPropagation(); runSum(b.getAttribute('data-psum')); return; }
    }, true);
    // 링크로 들어온 추천(r-)도 바로 열기
    var ogo = w.__site.go;
    w.__site.go = function(r){
      if (r && r.slice(0, 2) === 'r-') { try { if (w.parseShare(r)) { S.stack = [{ t: 'share', id: r }]; S.sheet = null; S.tab = 'home'; w.render(); top0(); return; } } catch (e) {} }
      if (r === 'tbl') { S.stack = [{ t: 'ptable', id: '' }]; S.tab = 'home'; w.render(); top0(); return; }
      return ogo.apply(this, arguments);
    };
    try { w.render(); } catch (e) { try { console.log('[리딩노트 더하기] 그리기 실패', e); } catch (x) {} }
    return true;
  }

  // ── 커뮤니티 실시간 토론에 요약 버튼
  function patchCm(w, d){
    if (w.__p || !w.viewChat || !w.AG || !w.render) return;
    w.__p = true;
    var st = d.createElement('style'); st.id = 'p-css'; st.textContent = CSS + '\n.pin .p-sumbar{margin:.1rem 0 0;gap:.4rem}.pin .p-sumbox{max-height:9.5rem;overflow:auto;font-size:.875rem}.p-sumbox .p-x{float:right;border:0;background:none;color:var(--ink2);font:inherit;font-size:.8125rem;font-weight:700;cursor:pointer;padding:0 0 0 .5rem}'; d.head.appendChild(st);
    var o = w.viewChat;
    // 위에 붙어 있는 토론 제목 칸(.pin) 안에 넣어서, 대화를 내려 봐도 늘 보이게
    w.viewChat = function(){ var h = o.apply(this, arguments), k = '</div><div class="chat" id="chat-list">'; return h.indexOf(k) > -1 ? h.replace(k, sumBar('cm:' + w.AG.id) + k) : h.replace('<div class="chat" id="chat-list">', sumBar('cm:' + w.AG.id) + '<div class="chat" id="chat-list">'); };
    d.addEventListener('click', function(ev){
      var x = ev.target.closest && ev.target.closest('[data-psum-x]'); if (x) { ev.preventDefault(); ev.stopPropagation(); X.talk[x.getAttribute('data-psum-x')] = null; redraw(); return; }
      var b = ev.target.closest && ev.target.closest('[data-psum]'); if (!b) return; ev.preventDefault(); ev.stopPropagation(); runSum(b.getAttribute('data-psum')); }, true);
    try { w.render(); } catch (e) {}
  }

  function scan(){
    Array.prototype.forEach.call(document.querySelectorAll('iframe'), function(f){
      if (!f.__pLoad) { f.__pLoad = true; f.addEventListener('load', function(){ var n = 0, iv = setInterval(function(){ n++; scan(); var w2; try { w2 = f.contentWindow; } catch (e) {} if ((w2 && w2.__p) || n > 100) clearInterval(iv); }, 150); }); }
      var w, d; try { w = f.contentWindow; d = f.contentDocument; } catch (e) { return; }
      if (!w || !d || !d.head) return;
      if (/ln\.html/.test(d.URL || '')) patchLn(w, d);
      else if (/community\.html/.test(d.URL || '')) patchCm(w, d);
    });
  }
  var tick = setInterval(scan, 120); setTimeout(function(){ clearInterval(tick); }, 45000);
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  scan(); load();
})();
