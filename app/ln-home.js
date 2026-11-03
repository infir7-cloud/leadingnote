/* 리딩노트 · 리딩 모음 홈을 시간대별로 다시 짜요 (ln-theme.js가 불러와요. index.html은 고칠 필요 없어요)
   시간대 (한국 시간 · 서버 시계 기준)
     ① 05:00–09:00 장 시작 전   ② 09:00–15:30 장중   ③ 15:30–방송 시작 방송 예고
     ④ 방송 중 (20:30–21:30)     ⑤ 방송 끝–다음 날 05:00 방송 후   ⑥ 토·일 (월요일 05:00 전까지) 주말
   - 맨 위 큰 안내 카드 + 시간대마다 섹션 순서를 바꿔요. 기존 섹션(5줄·재료 뉴스·방송 속 고수 종목·데이터로 본 종목 등)은 그대로 쓰고 순서만 바꿔요.
   - 새 카드: 이야기 미리보기 · 수익 계산 바로가기 · 살래요/더 볼래요/안 살래요 · 지난주 같은 방송 종목 · 방송 종목 성적 TOP 3(기간 칩) · 이번 주 프로그램별 · 다음 주 방송
   - 최근 추천에는 '방송가 → 지금 → 목표' 막대와 상태 문장을 붙여요.
   - 종목 화면에는 방송가 위치 · 차트(방송한 날 표시) · 몇 층? · 투표 · 쉬운 기업 정보를 붙여요.
   - 가격 숫자는 운영실 '가격 표시'(site_config.price_display)가 켜져 있을 때만 보여요.
     켜기 전에 미리 보려면 그 브라우저에서 localStorage 'ln.pxpreview' 를 '1' 로 두면 돼요(그 브라우저에만 보여요).
   - 사라·팔라는 말은 쓰지 않아요. 투표는 회원 의견일 뿐 추천이 아니라고 함께 적어요. */
(function(){
  if (window.__lnHomeOn) return; window.__lnHomeOn = true;
  var H = window.__lnHome = { op: {}, bc: null, px: null, talk: null, votes: {}, mine: {}, per: '1m', ch: 60, at: 0, off: 0, err: null };
  try { H.mine = JSON.parse(localStorage.getItem('ln.votes') || '{}') || {}; } catch (e) {}

  // ── 작은 도구
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function won(n){ return Math.round(n).toLocaleString('ko-KR'); }
  function pct(v, d){ if (v == null || !isFinite(v)) return ''; d = d == null ? 1 : d; return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(d) + '%'; }
  function tone(v){ return v > 0 ? 'up' : v < 0 ? 'dn' : ''; }
  var WD = ['일', '월', '화', '수', '목', '금', '토'];
  function ymd(ms){ return new Date(ms).toISOString().slice(0, 10); }
  function kms(s){ var m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/); return m ? Date.UTC(+m[1], m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0)) : 0; }
  function md(s){ var p = String(s || '').split('-'); return p.length === 3 ? (+p[1]) + '/' + (+p[2]) : ''; }
  function nowK(){
    try { var o = localStorage.getItem('ln.now'); if (o) { var t = kms(o); if (t) return t; } } catch (e) {}
    return Date.now() + 9 * 3600e3 + (H.off || 0);
  }
  function hm(ms){ var d = new Date(ms); return ('0' + d.getUTCHours()).slice(-2) + ':' + ('0' + d.getUTCMinutes()).slice(-2); }
  function left(ms){ var m = Math.max(0, Math.round(ms / 60000)); return m >= 60 ? Math.floor(m / 60) + '시간' + (m % 60 ? ' ' + (m % 60) + '분' : '') : m + '분'; }
  function ago(iso){ var t = Date.parse(iso); if (isNaN(t)) return ''; var m = Math.round((Date.now() - t) / 60000); return m < 1 ? '방금' : m < 60 ? m + '분 전' : m < 1440 ? Math.round(m / 60) + '시간 전' : Math.round(m / 1440) + '일 전'; }
  function priceOn(){ try { if (localStorage.getItem('ln.pxpreview') === '1') return true; } catch (e) {} return !!(H.bc && H.bc.price_on); }
  function dev(){ var k = 'ln.dev', v = ''; try { v = localStorage.getItem(k) || ''; if (!/^[A-Za-z0-9-]{8,64}$/.test(v)) { v = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); localStorage.setItem(k, v); } } catch (e) { v = 'v' + Math.random().toString(36).slice(2, 12); } return v; }
  var HOLI = { '2026-09-24': 1, '2026-09-25': 1, '2026-10-05': 1, '2026-10-09': 1, '2026-12-25': 1, '2026-12-31': 1, '2027-01-01': 1 };
  var IC = {
    chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    calc: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M16 11v6M8 15h2M12 15h2"/></svg>',
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2"/></svg>'
  };

  var CSS = [
    '.hm-hero{position:relative;overflow:hidden;border-radius:1.75rem;margin:0 0 .75rem;padding:1.375rem 1.25rem 1.25rem;color:#fff}',
    '.hm-hero .bl{position:absolute;border-radius:50%;background:#fff;opacity:.14;pointer-events:none}',
    '.hm-hero .in{position:relative}',
    '.hm-k{display:flex;flex-wrap:wrap;align-items:center;gap:.4rem;font-size:.875rem;font-weight:700;opacity:.9}',
    '.hm-k svg{width:1rem;height:1rem;fill:none;stroke:#FFD43B;stroke-width:2.4;stroke-linecap:round}',
    '.hm-tag{font-size:.75rem;font-weight:800;border-radius:.4rem;padding:.12rem .45rem;background:#F04452;color:#fff}',
    '.hm-dot{width:.6rem;height:.6rem;border-radius:50%;background:#fff;box-shadow:0 0 0 .25rem rgba(255,255,255,.3);flex:none}',
    '.hm-h1{font-size:1.5625rem;font-weight:800;line-height:1.36;letter-spacing:-.03em;margin:.5rem 0 0;word-break:keep-all}',
    '.hm-h1 em{font-style:normal;color:#FFD43B}',
    '.hm-p{font-size:.9375rem;margin:.4rem 0 0;opacity:.85;line-height:1.5}',
    '.hm-chips{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.875rem}',
    '.hm-chip{display:inline-flex;align-items:center;gap:.35rem;border-radius:999px;padding:.5rem .85rem;font-size:.9375rem;font-weight:700;background:rgba(255,255,255,.16);color:#fff;border:0;font-family:inherit;cursor:pointer;text-decoration:none}',
    '.hm-chip b{color:#FFD43B}',
    '.hm-btn{display:flex;align-items:center;justify-content:center;gap:.4rem;width:100%;min-height:3.25rem;border-radius:.875rem;font:inherit;font-size:1rem;font-weight:800;border:0;cursor:pointer;margin-top:1rem;text-decoration:none;background:#fff;color:#191F28}',
    '.hm-btn svg{width:1.2rem;height:1.2rem;fill:currentColor}',
    '.hm-prog{height:.5rem;border-radius:.25rem;background:rgba(255,255,255,.2);margin-top:.875rem;overflow:hidden}.hm-prog i{display:block;height:100%;background:#FFD43B;border-radius:.25rem}',
    '.hm-avs{display:flex;align-items:center;margin-top:.875rem;flex-wrap:wrap;gap:.35rem 0}',
    '.hm-avs span{width:2.5rem;height:2.5rem;border-radius:50%;border:3px solid;margin-left:-.6rem;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.9375rem;background:#fff;color:#191F28}',
    '.hm-avs span:first-child{margin-left:0}.hm-avs em{font-style:normal;font-size:.875rem;font-weight:700;margin-left:.6rem;color:#fff;opacity:.92}',
    '.hm-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.5rem;margin-top:1rem}',
    '.hm-stats div{background:rgba(255,255,255,.09);border-radius:.875rem;padding:.75rem}',
    '.hm-stats small{display:block;font-size:.75rem;opacity:.75;font-weight:700}.hm-stats b{display:block;font-size:1.375rem;font-weight:800;margin-top:.2rem}',
    // 공통 카드 머리
    '.hm-sh{display:flex;align-items:flex-end;justify-content:space-between;gap:.5rem;margin:0 0 .5rem}',
    '.hm-sh h2{font-size:1.25rem;font-weight:800;letter-spacing:-.02em;margin:0}.hm-sh small{display:block;font-size:.8125rem;color:var(--ink2);margin-top:.2rem}',
    '.hm-note{font-size:.75rem;color:var(--sn);margin:.6rem 0 .75rem;line-height:1.5}',
    '.hm-up{color:var(--up)}.hm-dn{color:var(--down)}',
    // 이야기 미리보기
    '.hm-talk{display:block;width:100%;text-align:left;border:0;font:inherit;cursor:pointer;border-radius:1.75rem;margin:0 0 .75rem;padding:1.25rem;background:#E8F3FF;color:#1B64DA}',
    'html:not(.lite) .hm-talk{background:#14243A;color:#7DB3FF}',
    '.hm-talk .q{display:block;font-size:1.125rem;font-weight:800;color:var(--ink);margin:0 0 .3rem}',
    '.hm-live{display:flex;align-items:center;gap:.4rem;font-size:.8125rem;font-weight:700;margin:0 0 .75rem}.hm-live i{width:.5rem;height:.5rem;border-radius:50%;background:#12B886}',
    '.hm-bub{display:block;max-width:85%;padding:.6rem .85rem;border-radius:1rem;border-top-left-radius:.25rem;font-size:.9375rem;line-height:1.45;margin-bottom:.5rem;background:var(--surface);color:var(--ink);word-break:keep-all}',
    '.hm-bub small{display:block;font-size:.75rem;color:var(--sn);margin-bottom:.1rem}',
    '.hm-go{display:flex;align-items:center;justify-content:space-between;margin-top:.4rem;padding-top:.75rem;border-top:1px solid rgba(49,130,246,.2);font-size:.9375rem;font-weight:800}',
    '.hm-go svg,.hm-more svg{width:1.1rem;height:1.1rem;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}',
    // 수익 계산
    '.hm-calc{border-radius:1.75rem;margin:0 0 .75rem;padding:1.25rem;background:#E6FCF5;color:#0B7A5A}',
    'html:not(.lite) .hm-calc{background:#0E2A22;color:#5FD3A8}',
    '.hm-calc .q{font-size:1.125rem;font-weight:800;margin:0;color:var(--ink)}.hm-calc .s{font-size:.8125rem;margin:.25rem 0 .875rem;opacity:.9}',
    '.hm-eq{display:flex;align-items:center;gap:.6rem;background:var(--surface);border-radius:1rem;padding:.875rem}',
    '.hm-eq div{flex:1;min-width:0;display:flex;flex-direction:column;gap:.1rem}.hm-eq small{font-size:.75rem;color:var(--ink2);font-weight:700}',
    '.hm-eq b{font-size:1.125rem;font-weight:800;color:var(--ink);white-space:nowrap}.hm-eq .r b{font-size:1.25rem;color:inherit}',
    '.hm-eq svg{width:1.3rem;height:1.3rem;fill:none;stroke:#12B886;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;flex:none}',
    '.hm-calc .hm-btn{background:#12B886;color:#fff;margin-top:.75rem}',
    // 위치 막대
    '.hm-pb{position:relative;padding-top:1.75rem}',
    '.hm-pbt{position:relative;height:.5rem;border-radius:.25rem;background:var(--line)}',
    '.hm-pbt i{position:absolute;top:0;height:100%;border-radius:.25rem}',
    '.hm-pbt .m{position:absolute;top:50%;width:.75rem;height:.75rem;border-radius:50%;transform:translate(-50%,-50%);border:2px solid var(--surface);box-sizing:border-box;background:var(--sn)}',
    '.hm-pbt .m.n{width:1.1rem;height:1.1rem}.hm-pbt .m.t{background:var(--ink);border-radius:.2rem}',
    '.hm-pbn{position:absolute;top:0;font-size:.75rem;font-weight:800;color:#fff;border-radius:.45rem;padding:.12rem .45rem;white-space:nowrap}',
    '.hm-pbl{display:flex;justify-content:space-between;margin-top:.4rem;font-size:.75rem;color:var(--ink2);font-weight:700;line-height:1.35}.hm-pbl b{display:block;color:var(--ink);font-size:.8125rem}.hm-pbl span:last-child{text-align:right}',
    '.hm-st{display:flex;align-items:center;gap:.35rem;font-size:.875rem;font-weight:800;border-radius:.6rem;padding:.45rem .65rem;margin-top:.5rem}',
    '.hm-st.up{background:var(--up-soft);color:var(--up)}.hm-st.dn{background:var(--down-soft);color:var(--down)}.hm-st.ok{background:#E6FCF5;color:#0B7A5A}.hm-st.no{background:var(--sunk);color:var(--ink2)}',
    'html:not(.lite) .hm-st.ok{background:#0E2A22;color:#5FD3A8}',
    '.hm-rpb{padding:0 0 .875rem 3.25rem;margin-top:-.4rem}',
    // 타일 · 순위
    '.hm-g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.6rem;margin:.25rem 0 .5rem}',
    '.hm-tile{display:flex;flex-direction:column;gap:.15rem;text-align:left;border:0;font:inherit;cursor:pointer;background:var(--raise);border-radius:1.125rem;padding:.875rem;color:var(--ink);min-width:0}',
    '.hm-tile b{font-size:1rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.hm-tile span{font-size:.8125rem;color:var(--ink2)}',
    '.hm-tile .big{font-size:1.5rem;font-weight:800;letter-spacing:-.03em;margin-top:.35rem;color:var(--ink)}.hm-tile .big.hm-up{color:var(--up)}.hm-tile .big.hm-dn{color:var(--down)}',
    '.hm-tile .qt{font-size:.8125rem;color:var(--ink2);line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-top:.3rem}',
    '.hm-per{display:flex;gap:.4rem;margin:.25rem 0 .75rem}',
    '.hm-per button{flex:1;font:inherit;font-size:.875rem;font-weight:700;color:var(--ink2);background:var(--sunk);border:0;border-radius:.6rem;padding:.5rem 0;cursor:pointer}',
    '.hm-per button[aria-pressed="true"]{background:var(--ink);color:var(--surface)}',
    '.hm-row{display:flex;align-items:center;gap:.75rem;width:100%;padding:.8rem 0;border:0;border-top:1px solid var(--line);background:none;font:inherit;color:var(--ink);text-align:left;cursor:pointer}',
    '.hm-row:first-child{border-top:0}',
    '.hm-rk{flex:none;width:2.25rem;height:2.25rem;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;background:var(--sunk);color:var(--ink2)}',
    '.hm-rk.g{background:#FFF4E6;color:#E8590C}',
    '.hm-mid{flex:1;min-width:0;display:flex;flex-direction:column;gap:.1rem}.hm-mid b{font-size:1.0625rem}.hm-mid span{font-size:.8125rem;color:var(--ink2)}',
    '.hm-v{font-size:1.0625rem;font-weight:800;white-space:nowrap}',
    // 막대 그래프 · 다음 주
    '.hm-bars{display:flex;flex-direction:column;gap:.85rem;margin:.5rem 0 .25rem}',
    '.hm-bar{display:grid;grid-template-columns:6.5rem minmax(0,1fr) 3.75rem;align-items:center;gap:.5rem;font-size:.875rem;font-weight:700}',
    '.hm-bar .t{height:.75rem;border-radius:.375rem;background:var(--sunk);overflow:hidden}.hm-bar .t i{display:block;height:100%;border-radius:.375rem}',
    '.hm-bar .v{text-align:right;font-weight:800}',
    '.hm-wk{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:.4rem;margin:.25rem 0 .75rem}',
    '.hm-wk div{background:var(--raise);border-radius:.875rem;padding:.7rem .2rem;text-align:center;display:flex;flex-direction:column;gap:.2rem}',
    '.hm-wk b{font-size:1rem}.hm-wk span{font-size:.75rem;color:var(--ink2);line-height:1.3;word-break:keep-all}',
    '.hm-wk .on{background:var(--ink);color:var(--surface)}.hm-wk .on span{color:var(--surface);opacity:.75}',
    // 방송 후 종목
    '.hm-ex{padding:.875rem 0;border-top:1px solid var(--line)}.hm-ex:first-of-type{border-top:0}',
    '.hm-exh{display:flex;align-items:center;gap:.6rem;margin-bottom:.35rem}',
    '.hm-av{flex:none;width:2.5rem;height:2.5rem;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;background:var(--sa-soft,#EEEBFF);color:var(--t2-acc-ink,#5B4CF0)}',
    '.hm-pk{display:flex;align-items:center;gap:.6rem;padding:.6rem 0}',
    '.hm-pk .hm-mid b{font-size:1.0625rem}',
    '.hm-cb{flex:none;font:inherit;font-size:.8125rem;font-weight:800;color:#0B7A5A;background:#E6FCF5;border:0;border-radius:.6rem;padding:.5rem .65rem;cursor:pointer}',
    'html:not(.lite) .hm-cb{background:#0E2A22;color:#5FD3A8}',
    '.hm-lock{display:flex;align-items:center;gap:.4rem;border:2px dashed var(--line);border-radius:.875rem;padding:.65rem .75rem;color:var(--t2-acc-ink,#5B4CF0);font-size:.875rem;font-weight:700;margin-top:.25rem}',
    '.hm-lock svg{width:1.1rem;height:1.1rem;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}',
    // 투표
    '.hm-vote{display:flex;flex-direction:column;gap:.5rem;margin:.75rem 0 0}',
    '.hm-vote button{position:relative;overflow:hidden;display:flex;align-items:center;gap:.75rem;font:inherit;font-size:1rem;font-weight:800;color:var(--ink);background:var(--surface);border:1.5px solid var(--line);border-radius:.875rem;padding:.8rem .9rem;cursor:pointer;text-align:left}',
    '.hm-vote button[aria-pressed="true"]{border-color:var(--ink)}',
    '.hm-vote i{position:absolute;left:0;top:0;bottom:0;opacity:.13}',
    '.hm-vote .d{position:relative;flex:none;width:1.6rem;height:1.6rem;border-radius:50%}',
    '.hm-vote span{position:relative;flex:1}.hm-vote b{position:relative;font-size:.9375rem}',
    // 5줄 접기
    '.hm-fold summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:.5rem;font-size:1rem;font-weight:700;padding:.15rem 0 .85rem}',
    '.hm-fold summary::-webkit-details-marker{display:none}',
    '.hm-fold summary .t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.hm-fold summary .k{flex:none;font-size:.75rem;font-weight:800;border-radius:.4rem;padding:.15rem .45rem;background:var(--sa-soft,#EEEBFF);color:var(--t2-acc-ink,#5B4CF0)}',
    '.hm-fold summary .o{flex:none;font-size:.8125rem;color:var(--ink2)}.hm-fold[open] summary .o:after{content:"접기"}.hm-fold:not([open]) summary .o:after{content:"펼치기"}',
    // 종목 화면
    '.hm-chart{display:block;width:100%;height:auto;margin-top:.25rem}',
    '.hm-bld{display:flex;flex-direction:column;gap:.3rem;margin:.5rem 0 0}',
    '.hm-fl{display:grid;grid-template-columns:5rem minmax(0,1fr) 5.5rem;align-items:center;gap:.6rem;min-height:2.6rem}',
    '.hm-fl .n{font-size:.875rem;font-weight:800;line-height:1.2}.hm-fl .n small{display:block;font-size:.6875rem;color:var(--sn);font-weight:700}',
    '.hm-fl .w{height:100%;min-height:2.4rem;border-radius:.5rem;background:var(--sunk);display:flex;align-items:center;justify-content:center;gap:.3rem;font-size:.8125rem;font-weight:800;color:var(--ink2);text-align:center;padding:0 .3rem}',
    '.hm-fl .p{font-size:.8125rem;color:var(--ink2);text-align:right}',
    '.hm-fl.now .w{background:#12B886;color:#fff}.hm-fl.bc .w{background:var(--sa-soft,#EEEBFF);color:var(--t2-acc-ink,#5B4CF0)}.hm-fl.now.bc .w{background:#12B886;color:#fff}',
    '.hm-ez{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.5rem;margin:.5rem 0 0}',
    '.hm-ez div{background:var(--raise);border-radius:.875rem;padding:.8rem;display:flex;flex-direction:column;gap:.2rem}',
    '.hm-ez small{font-size:.75rem;color:var(--ink2);font-weight:700}.hm-ez b{font-size:1.0625rem}.hm-ez span{font-size:.75rem;color:var(--sn)}',
    '.hm-sec{padding-bottom:.25rem}',
    // 전문가 의견
    '.hm-gauge{display:block;width:100%;max-width:16rem;height:auto;margin:.25rem auto 0}',
    '.hm-glab{text-align:center;font-size:1.125rem;font-weight:800;margin:.1rem 0 .1rem}.hm-gsub{text-align:center;font-size:.8125rem;color:var(--ink2);margin:0 0 .75rem}',
    '.hm-ob{display:grid;grid-template-columns:3.5rem minmax(0,1fr) 2.5rem;align-items:center;gap:.5rem;font-size:.9375rem;font-weight:700;margin:.45rem 0}',
    '.hm-ob .t{height:.75rem;border-radius:.375rem;background:var(--sunk);overflow:hidden}.hm-ob .t i{display:block;height:100%;border-radius:.375rem}.hm-ob .v{text-align:right;font-weight:800}',
    '.hm-exl{display:flex;flex-wrap:wrap;gap:.4rem;margin:.75rem 0 .25rem}',
    '.hm-exc{display:inline-flex;align-items:center;gap:.35rem;font-size:.875rem;font-weight:700;background:var(--raise);border-radius:999px;padding:.35rem .7rem}',
    '.hm-sp{font-size:.75rem;font-weight:800;border-radius:.35rem;padding:.08rem .4rem;color:#fff}',
    '.hm-chatbox{position:relative;height:15.5rem;overflow:hidden;border-radius:1.125rem;background:var(--raise);margin:.75rem 0 .25rem;padding:0 .75rem;outline:none}',
    '.hm-chatbox:before,.hm-chatbox:after{content:"";position:absolute;left:0;right:0;height:1.75rem;z-index:1;pointer-events:none}',
    '.hm-chatbox:before{top:0;background:linear-gradient(var(--raise),transparent)}.hm-chatbox:after{bottom:0;background:linear-gradient(transparent,var(--raise))}',
    '.hm-chatrun{padding:.75rem 0}.hm-chatrun.go{animation:hmUp var(--dur,30s) linear infinite}',
    '.hm-chatbox:hover .hm-chatrun,.hm-chatbox:focus .hm-chatrun,.hm-chatbox:active .hm-chatrun{animation-play-state:paused}',
    '@keyframes hmUp{from{transform:translateY(0)}to{transform:translateY(-50%)}}',
    '@media (prefers-reduced-motion:reduce){.hm-chatbox{overflow:auto}.hm-chatrun.go{animation:none}.hm-chatrun .dup{display:none}}',
    '.hm-qa{display:flex;flex-direction:column;gap:.35rem;margin:0 0 .9rem}',
    '.hm-q,.hm-a{max-width:86%;padding:.6rem .8rem;border-radius:1rem;font-size:.9375rem;line-height:1.45;word-break:keep-all}',
    '.hm-q{align-self:flex-start;background:var(--surface);border-top-left-radius:.25rem}',
    '.hm-a{align-self:flex-end;background:var(--sa-soft,#EEEBFF);border-top-right-radius:.25rem}',
    '.hm-q small,.hm-a small{display:flex;align-items:center;gap:.3rem;font-size:.75rem;color:var(--sn);margin-bottom:.15rem}',
    '.hm-trend{display:flex;align-items:flex-end;gap:.3rem;height:3.5rem;margin:.5rem 0 .2rem}',
    '.hm-trend i{flex:1;border-radius:.3rem .3rem 0 0;background:var(--up);opacity:.8;min-height:.2rem}',
    '.hm-trl{display:flex;justify-content:space-between;font-size:.6875rem;color:var(--sn)}',
    '.hm-oq{border-left:3px solid var(--line);padding:.1rem 0 .1rem .7rem;margin:.6rem 0;font-size:.9375rem;line-height:1.5}.hm-oq small{display:block;font-size:.75rem;color:var(--sn);margin-top:.15rem}'
  ].join('\n');

  // ── 서버
  function client(){ try { return window.__lnAuth && window.__lnAuth.sb; } catch (e) { return null; } }
  function q(p){ return Promise.resolve(p).then(function(r){ return r; }, function(e){ return { error: e }; }); }
  function load(){
    var c = client(); if (!c) return Promise.resolve();
    return Promise.all([
      q(c.rpc('bc_feed')),
      q(c.from('ln_talk').select('stock_id,nickname,body,created_at').order('created_at', { ascending: false }).limit(3)),
      q(c.from('cm_chat').select('agenda_id,nickname,body,created_at').neq('agenda_id', 'zz-test').order('created_at', { ascending: false }).limit(3))
    ]).then(function(rs){
      if (rs[0] && !rs[0].error && rs[0].data) { H.bc = rs[0].data; var sv = kms(H.bc.now); if (sv) H.off = sv - (Date.now() + 9 * 3600e3); }
      var t = [];
      ((rs[1] && rs[1].data) || []).forEach(function(m){ t.push({ who: m.nickname, body: m.body, at: m.created_at, kind: 'talk' }); });
      ((rs[2] && rs[2].data) || []).forEach(function(m){ t.push({ who: m.nickname, body: m.body, at: m.created_at, kind: 'cm' }); });
      t.sort(function(a, b){ return a.at < b.at ? 1 : -1; });
      H.talk = t;
      var codes = allCodes();
      return Promise.all([q(c.rpc('ln_px', { p_codes: codes })), q(c.rpc('stock_vote_tally', { p_codes: codes }))]).then(function(r2){
        if (r2[0] && !r2[0].error && r2[0].data) H.px = r2[0].data;
        if (r2[1] && !r2[1].error && r2[1].data) H.votes = r2[1].data;
        H.at = Date.now(); redraw();
      });
    }).catch(function(e){ H.err = String(e && e.message || e); });
  }
  var extra = {};
  function allCodes(){
    var s = {};
    eps().forEach(function(e){ (e.picks || []).forEach(function(k){ if (k.stock_code) s[k.stock_code] = 1; }); });
    Object.keys(extra).forEach(function(k){ s[k] = 1; });
    return Object.keys(s).slice(0, 80);
  }
  // 종목별 전문가 의견 (stock_opinion: 승인된 의견 + 공개 추천 + 방송 종목 · 최근 30일 · 전문가당 마지막 1개)
  function needOp(code){
    if (!code || H.op[code]) return; H.op[code] = { loading: true }; var c = client(); if (!c) return;
    q(c.rpc('stock_opinion', { p_code: code })).then(function(r){ H.op[code] = r && r.data ? r.data : { n: 0, err: true }; redraw(); });
  }
  var SP = { buy: ['매수', '#F04452'], add: ['추가매수', '#F04452'], hold: ['보유', '#F59F00'], watch: ['관망', '#8B95A1'], reduce: ['비중축소', '#3182F6'], sell: ['매도', '#3182F6'] };
  function spTag(k){ var x = SP[k] || ['의견', '#8B95A1']; return '<span class="hm-sp" style="background:' + x[1] + '">' + x[0] + '</span>'; }
  function gaugeSVG(score){
    var segs = ['#3182F6', '#7DB3FF', '#C9CDD2', '#FF9AA2', '#F04452'], h = '';
    for (var i = 0; i < 5; i++) { var a0 = Math.PI * (1 - i / 5), a1 = Math.PI * (1 - (i + 1) / 5) + 0.02;
      h += '<path d="M' + (100 + 80 * Math.cos(a0)).toFixed(1) + ' ' + (100 - 80 * Math.sin(a0)).toFixed(1) + ' A80 80 0 0 1 ' + (100 + 80 * Math.cos(a1)).toFixed(1) + ' ' + (100 - 80 * Math.sin(a1)).toFixed(1) + '" stroke="' + segs[i] + '" stroke-width="16" fill="none"/>'; }
    var th = Math.PI * (1 - (Math.max(-1, Math.min(1, score)) + 1) / 2), x = 100 + 62 * Math.cos(th), y = 100 - 62 * Math.sin(th);
    return '<svg class="hm-gauge" viewBox="0 0 200 118" role="img" aria-label="전문가 의견 계기판">' + h +
      '<line x1="100" y1="100" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><circle cx="100" cy="100" r="8" fill="currentColor"/>' +
      '<text x="14" y="116" font-size="12" font-weight="700" fill="#3182F6">매도</text><text x="186" y="116" text-anchor="end" font-size="12" font-weight="700" fill="#F04452">매수</text></svg>';
  }
  function opinionHTML(code){
    var O = H.op[code]; if (!O || O.loading || O.err) return '';
    var n = O.n || 0, d = O.dist || {}, talk = O.talk || [];
    if (!n && !talk.length) return '';
    var h = '<section class="t2-sec hm-sec"><div class="hm-sh"><div><h2>전문가 의견</h2><small>최근 30일 · 전문가 ' + n + '명 · 한 사람당 마지막 의견 1개</small></div></div>';
    if (n >= 3 && O.score != null) {
      var sc = Number(O.score), lab = sc >= 0.6 ? '매수 의견이 많아요' : sc >= 0.2 ? '보유·매수 쪽 의견이 많아요' : sc > -0.2 ? '의견이 갈려요' : sc > -0.6 ? '조심하자는 의견이 많아요' : '매도 의견이 많아요';
      h += '<div style="color:var(--ink)">' + gaugeSVG(sc) + '</div><p class="hm-glab">' + lab + '</p><p class="hm-gsub">전문가 ' + n + '명의 가장 최근 의견을 모았어요</p>';
    } else if (n) h += '<p class="hm-note" style="font-size:.875rem">의견을 낸 전문가가 3명 이상이면 계기판으로 보여 드려요.</p>';
    if (n) {
      var B = [['매수', d.buy || 0, '#F04452'], ['보유', d.hold || 0, '#F59F00'], ['관망', d.watch || 0, '#8B95A1'], ['매도', d.sell || 0, '#3182F6']];
      h += B.map(function(b){ return '<div class="hm-ob"><span>' + b[0] + '</span><span class="t"><i style="width:' + (n ? b[1] / n * 100 : 0).toFixed(0) + '%;background:' + b[2] + '"></i></span><span class="v">' + b[1] + '명</span></div>'; }).join('');
      h += '<div class="hm-exl">' + (O.experts || []).slice(0, 8).map(function(x){ return '<span class="hm-exc">' + esc(x.name) + ' ' + spTag(x.stance) + '<small style="color:var(--sn);font-weight:600">' + md(String(x.at).slice(0, 10)) + '</small></span>'; }).join('') + '</div>';
    }
    if (talk.length) {
      var one = function(t){ return '<div class="hm-qa">' + (t.q ? '<div class="hm-q"><small>회원 · ' + md(String(t.qa || t.at).slice(0, 10)) + '</small>' + esc(t.q) + '</div>' : '') +
        '<div class="hm-a"><small>' + esc(t.name) + ' ' + spTag(t.stance) + '</small>' + esc(t.a || '') + '</div></div>'; };
      var list = talk.slice(0, 12).map(one).join(''), go = talk.length >= 3;
      h += '<p style="font-size:.9375rem;font-weight:800;margin:1rem 0 0">회원 질문에 전문가는 이렇게 답했어요</p>' +
        '<div class="hm-chatbox" tabindex="0" aria-label="회원 질문과 전문가 답 · 누르면 멈춰요"><div class="hm-chatrun' + (go ? ' go' : '') + '" style="--dur:' + Math.max(18, Math.min(talk.length, 12) * 5) + 's">' + list + (go ? '<div class="dup" aria-hidden="true">' + list + '</div>' : '') + '</div></div>' +
        '<p class="hm-note" style="margin-top:.25rem">회원 닉네임은 보여 드리지 않아요 · 누르거나 손가락을 대면 멈춰요</p>';
    }
    var tr = O.trend || [];
    if (tr.length >= 2) h += '<p style="font-size:.9375rem;font-weight:800;margin:1rem 0 0">주별 의견 흐름 <small style="font-weight:600;color:var(--ink2)">매수·보유 의견 비율</small></p><div class="hm-trend">' +
      tr.map(function(w){ return '<i style="height:' + Math.max(4, Math.round(Number(w.pos) * 100)) + '%" title="' + md(w.wk) + ' 주 · ' + Math.round(Number(w.pos) * 100) + '% · ' + w.n + '건"></i>'; }).join('') + '</div><div class="hm-trl"><span>' + md(tr[0].wk) + ' 주</span><span>' + md(tr[tr.length - 1].wk) + ' 주</span></div>';
    var qs = (O.experts || []).filter(function(x){ return x.quote; }).slice(0, 2);
    if (qs.length) h += qs.map(function(x){ return '<div class="hm-oq">"' + esc(x.quote) + '"<small>' + esc(x.name) + ' · ' + md(String(x.at).slice(0, 10)) + ' · ' + esc(x.src || '') + (x.url ? ' · <a href="' + esc(x.url) + '" target="_blank" rel="noopener noreferrer">원문 ↗</a>' : '') + '</small></div>'; }).join('');
    return h + '<p class="hm-note">전문가가 방송·공개 채널·공개 대화방에서 한 말을 모은 거예요. 의견 분포일 뿐 사거나 팔라는 권유가 아니에요.</p></section>';
  }
  function needCode(code){
    if (!code || !/^[0-9A-Z]{6}$/.test(code) || extra[code]) return;
    if (H.px && H.px.s && H.px.s[code]) return;
    extra[code] = 1; var c = client(); if (!c) return;
    Promise.all([q(c.rpc('ln_px', { p_codes: [code] })), q(c.rpc('stock_vote_tally', { p_codes: [code] }))]).then(function(r){
      if (r[0] && r[0].data) { H.px = H.px || { days: [], s: {} }; H.px.days = r[0].data.days || H.px.days; Object.assign(H.px.s, r[0].data.s || {}); }
      if (r[1] && r[1].data) Object.assign(H.votes, r[1].data);
      redraw();
    });
  }

  // ── 방송 데이터
  function progs(){ return (H.bc && H.bc.programs) || []; }
  function prog(id){ return progs().filter(function(p){ return p.id === id; })[0] || null; }
  function eps(){ return ((H.bc && H.bc.episodes) || []).filter(function(e){ return !e.canceled; }); }
  function pubEps(){ return eps().filter(function(e){ return e.published; }).sort(function(a, b){ return a.air_date < b.air_date ? 1 : -1; }); }
  function epOf(pid, date){ return eps().filter(function(e){ return e.program_id === pid && e.air_date === date; })[0] || null; }
  function lastEp(pid, before){ return pubEps().filter(function(e){ return e.program_id === pid && e.air_date < before; })[0] || null; }
  function openPicks(e){ return ((e && e.picks) || []).filter(function(k){ return k.stock_code && !(k.kind === 'secret' && !k.revealed); }); }
  function wdNum(date){ var d = new Date(kms(date)).getUTCDay(); return d === 0 ? 7 : d; }
  function progOnDate(date){ var w = wdNum(date); return progs().filter(function(p){ return +p.weekday === w; })[0] || null; }
  function exName(e){ return ((e && e.experts) || []).map(function(x){ return x.name; }); }
  function lineupOf(e, p){ var n = exName(e); if (n.length) return n; return String((p && p.lineup_note) || '').split(/[,·、]/).map(function(x){ return x.trim(); }).filter(function(x){ return x && x.length <= 6; }); }

  // 시간대
  function slot(){
    try { var f = localStorage.getItem('ln.slot'); if (f) return mkSlot(f); } catch (e) {}
    var n = nowK(), d = new Date(n), wd = d.getUTCDay(), mins = d.getUTCHours() * 60 + d.getUTCMinutes(), today = ymd(n);
    if (mins < 300 && wd >= 2 && wd <= 6) return slotAfter(ymd(n - 864e5), n);
    if (wd === 0 || wd === 6 || (wd === 1 && mins < 300)) return { k: 'weekend', n: n, today: today };
    var p = progOnDate(today);
    if (mins < 540) return { k: 'morning', n: n, today: today, p: p };
    if (mins < 930) return { k: 'market', n: n, today: today, p: p };
    if (!p) return { k: 'market', n: n, today: today };
    var st = kms(today + 'T' + (p.air_time || '20:30')), en = st + (p.duration_min || 60) * 60000;
    if (n < st) return { k: 'pre', n: n, today: today, p: p, st: st, en: en, ep: epOf(p.id, today) };
    if (n < en) return { k: 'live', n: n, today: today, p: p, st: st, en: en, ep: epOf(p.id, today) };
    return slotAfter(today, n);
  }
  function slotAfter(date, n){
    var p = progOnDate(date); if (!p) return { k: 'weekend', n: n, today: ymd(n) };
    var st = kms(date + 'T' + (p.air_time || '20:30'));
    return { k: 'after', n: n, today: ymd(n), date: date, p: p, st: st, en: st + (p.duration_min || 60) * 60000, ep: epOf(p.id, date) };
  }
  function mkSlot(k){ // 시험용: localStorage 'ln.slot' 에 morning/market/pre/live/after/weekend
    var n = nowK(), today = ymd(n), p = progOnDate(today) || progs()[0];
    if (k === 'after') return slotAfter(pubEps()[0] ? pubEps()[0].air_date : today, n);
    if (!p) return { k: 'weekend', n: n, today: today };
    var st = kms(today + 'T' + (p.air_time || '20:30'));
    return { k: k, n: n, today: today, p: p, st: st, en: st + (p.duration_min || 60) * 60000, ep: epOf(p.id, today) };
  }

  // ── 가격 계산 (방송가 = 방송에서 말한 매수가, 없으면 방송한 날 종가)
  function pxOf(code){ return H.px && H.px.s ? H.px.s[code] || null : null; }
  function tradingIdx(px, date){
    // closes[0] = as_of 날의 종가, 뒤로 갈수록 하루씩 이전 거래일
    if (!px || !px.asof || !date || date > px.asof) return -1;
    var days = (H.px && H.px.days) || [];
    if (days.length && days[0] === px.asof && date >= days[days.length - 1]) {
      for (var i = 0; i < days.length; i++) if (days[i] <= date) return i;
    }
    var t = kms(px.asof), stop = kms(date), i2 = 0;
    while (t > stop) { t -= 864e5; var w = new Date(t).getUTCDay(), s = ymd(t); if (w !== 0 && w !== 6 && !HOLI[s]) i2++; }
    return i2;
  }
  function info(k, date){
    var px = pxOf(k.stock_code), o = { code: k.stock_code, name: k.stock_name || (px && px.n) || '', buy: k.buy || null, target: k.target || null, date: date || k.pick_date, px: px };
    if (!px || !px.c) return o;
    o.cur = px.c; o.asof = px.asof;
    var base = k.buy || null;
    if (!base) { var i = tradingIdx(px, o.date), cl = px.closes || []; if (i > -1 && i < cl.length) base = cl[i]; }
    o.base = base; o.fromBuy = !!k.buy;
    if (base) o.ret = (px.c / base - 1) * 100;
    if (o.target && px.c) o.toTarget = (o.target / px.c - 1) * 100;
    return o;
  }
  function statusOf(o){
    if (!priceOn()) return null;
    if (!o.cur) return { k: 'no', t: '가격 정보가 아직 없어요' };
    if (o.ret == null) return { k: 'no', t: '방송가는 다음 장 마감 뒤에 잡혀요' };
    if (o.target && o.cur >= o.target) return { k: 'ok', t: '★ 목표가에 닿았어요' };
    if (o.ret < 0) return { k: 'dn', t: '▼ 방송가보다 ' + pct(-o.ret) .replace('+', '') + ' 아래예요' };
    if (o.target) return { k: 'up', t: '▲ 방송 후 ' + pct(o.ret) + ' · 목표까지 ' + pct(o.toTarget).replace('+', '') + ' 남았어요' };
    return { k: 'up', t: '▲ 방송 후 ' + pct(o.ret) + ' 올랐어요' };
  }
  function stHTML(s){ return s ? '<div class="hm-st ' + s.k + '">' + esc(s.t) + '</div>' : ''; }
  function posbar(o, big){
    if (!priceOn() || !o.cur || !o.base) return '';
    var hi = o.target || (o.px && o.px.hi) || Math.max(o.cur, o.base) * 1.1, lo = Math.min(o.base, o.cur) * .97;
    if (hi <= lo) hi = lo * 1.2;
    var f = function(v){ return Math.max(0, Math.min(100, (v - lo) / (hi - lo) * 100)); };
    var a = f(o.base), n = f(o.cur), t = f(o.target || hi), up = o.cur >= o.base, col = up ? 'var(--up)' : 'var(--down)';
    var tx = n < 15 ? '0' : n > 85 ? '-100%' : '-50%';
    return '<div class="hm-pb"' + (big ? ' style="padding-top:2rem"' : '') + '><span class="hm-pbn" style="left:' + n + '%;transform:translateX(' + tx + ');background:' + col + '">지금 ' + pct(o.ret) + '</span>' +
      '<div class="hm-pbt"><i style="left:' + Math.min(a, n) + '%;width:' + Math.abs(n - a) + '%;background:' + col + '"></i><span class="m" style="left:' + a + '%"></span><span class="m n" style="left:' + n + '%;background:' + col + '"></span>' + (o.target ? '<span class="m t" style="left:' + t + '%"></span>' : '') + '</div>' +
      '<div class="hm-pbl"><span>' + (o.fromBuy ? '방송 매수가' : '방송일 종가') + '<b>' + won(o.base) + '원</b></span><span>' + (o.target ? '목표' : '1년 최고') + '<b>' + won(o.target || (o.px && o.px.hi) || hi) + '원</b></span></div></div>';
  }
  function pxNote(){ var a = H.px && H.px.days && H.px.days[0]; return priceOn() && a ? '<p class="hm-note">가격: 금융위원회(공공데이터포털) · ' + md(a) + ' 종가 기준 · 사거나 팔라는 권유가 아니에요</p>' : ''; }

  // ── 바깥(셸)과 연결: 투자 도구 계산기 열기
  function lnWin(){ var out = null; Array.prototype.forEach.call(document.querySelectorAll('iframe'), function(f){ try { if (/ln\.html/.test(f.contentDocument.URL)) out = f.contentWindow; } catch (e) {} }); return out; }
  function openCalc(buy, sell, mkt){
    var w = lnWin(), qty = buy ? Math.max(1, Math.floor(1000000 / buy)) : 0;
    var r = buy ? 'fee:' + Math.round(buy) + ',' + Math.round(sell || buy) + ',' + qty + ',' + (mkt === 'Q' || mkt === 'KOSDAQ' ? 'Q' : 'K') : 'calc';
    try { if (w && w.__lnGo) return w.__lnGo('tools', r); } catch (e) {}
    try { window.location.hash = '#tools/' + r; } catch (e) {}
  }

  // ── 카드 만들기
  function hero(bg, kick, h1, p, inner){
    return '<section class="hm-hero" style="background:' + bg + '"><span class="bl" style="width:11rem;height:11rem;right:-3rem;top:-3.75rem"></span><span class="bl" style="width:5.5rem;height:5.5rem;right:2.5rem;top:4.5rem;opacity:.08"></span>' +
      '<div class="in"><div class="hm-k">' + kick + '</div><h2 class="hm-h1">' + h1 + '</h2>' + (p ? '<p class="hm-p">' + p + '</p>' : '') + (inner || '') + '</div></section>';
  }
  function avs(names, ring, label){
    if (!names.length) return '';
    return '<div class="hm-avs">' + names.slice(0, 4).map(function(n){ return '<span style="border-color:' + ring + '">' + esc(String(n).charAt(0)) + '</span>'; }).join('') + '<em>' + esc(label || names.join(' · ')) + '</em></div>';
  }
  var G = function(a, b){ return 'linear-gradient(135deg,' + a + ',' + b + ')'; };
  function heroHTML(S){
    var n = S.n;
    if (S.k === 'morning') {
      var open = kms(S.today + 'T09:00');
      return hero(G('#1E2A44', '#3B4A6B'), IC.sun + '장 시작까지 ' + left(open - n), '좋은 아침이에요.<br>오늘 알아둘 5가지예요', '1분이면 다 읽어요' + (S.p ? ' · 오늘 밤 ' + esc(S.p.air_time) + ' ' + esc(S.p.name) : ''));
    }
    if (S.k === 'market') {
      var rows = (window.__lnNews && window.__lnNews.rows) || [], top = rows.filter(function(r){ return r.kind !== '시황' && Array.isArray(r.stocks) && r.stocks[0]; }).slice(0, 3);
      var chips = top.map(function(r){ var s = r.stocks[0]; return '<button class="hm-chip" data-a="mnOpen">' + esc(s.n) + (r.chg != null && r.chg !== '' ? ' <b>' + pct(Number(r.chg), 2) + '</b>' : '') + '</button>'; }).join('');
      return hero(G('#5B4CF0', '#7B6CFF'), '<span class="hm-dot"></span>장 열림 · 지금 ' + hm(n), top.length ? '지금 시장을 움직이는<br>재료 ' + top.length + '가지' : '오늘 장, 무엇이<br>움직였을까요?', top.length ? '등락률은 기사 작성 때 기준이에요' : '재료 뉴스와 데이터로 본 종목을 모았어요', chips ? '<div class="hm-chips">' + chips + '</div>' : '');
    }
    if (S.k === 'pre') {
      var e = S.ep, names = lineupOf(e, S.p), from = kms(S.today + 'T15:30'), pr = Math.max(4, Math.min(100, (n - from) / (S.st - from) * 100));
      return hero('#191F28', '<span class="hm-tag">오늘 밤</span>' + esc(S.p.channel || 'SBS Biz') + ' · ' + esc(S.p.air_time) + ' 본방송',
        esc(S.p.name) + '<br><em>' + left(S.st - n) + '</em> 남았어요', names.length ? '' : esc(S.p.lineup_note || '출연 전문가는 방송 전에 올라와요'),
        '<div class="hm-prog"><i style="width:' + pr.toFixed(0) + '%"></i></div>' + avs(names, '#191F28') +
        '<button class="hm-btn" data-a="pBc" data-v="' + esc(S.p.id + '|' + S.today) + '">이번 회차 · 출연 전문가 보기</button>');
    }
    if (S.k === 'live') {
      var nm = lineupOf(S.ep, S.p), lu = S.p.live_url || 'https://www.youtube.com/results?search_query=' + encodeURIComponent('SBS Biz ' + S.p.name + ' 라이브');
      return hero(G('#E0283A', '#F04452'), '<span class="hm-dot"></span>LIVE · ' + hm(S.en) + '까지', '지금 방송 중이에요<br>' + esc(S.p.name), '',
        avs(nm, '#E0283A', nm.length ? '지금 출연 중' : '') + '<a class="hm-btn" style="color:#E0283A" href="' + esc(lu) + '" target="_blank" rel="noopener noreferrer">' + IC.play + '본방송 보러 가기</a>');
    }
    if (S.k === 'after') {
      var ep = S.ep, pub = ep && ep.published, op = openPicks(pub ? ep : null), lk = pub ? (ep.picks || []).filter(function(k){ return k.kind === 'secret' && !k.revealed; }).length : 0;
      var chips2 = op.slice(0, 6).map(function(k){ return '<button class="hm-chip" data-a="stock" data-v="' + esc(k.stock_code) + '">' + esc(k.stock_name) + '</button>'; }).join('');
      var vu = pub && ep.video_url ? '<a class="hm-btn" style="color:#5B4CF0" href="' + esc(ep.video_url) + '" target="_blank" rel="noopener noreferrer">' + IC.play + '다시보기</a>' : '';
      return hero(G('#5B4CF0', '#3B2DB8'), '방송 끝 · ' + esc(S.p.name) + ' ' + md(S.date),
        pub && (op.length + lk) ? '방금 방송에서 나온<br>종목 ' + (op.length + lk) + '개' : '방송 종목을<br>정리하고 있어요',
        pub ? 'AI가 정리하고 운영자가 확인해요' + (lk ? ' · 비공개 ' + lk + '개' : '') : '보통 방송이 끝나고 1시간 안에 올라와요',
        (chips2 ? '<div class="hm-chips">' + chips2 + '</div>' : '') + vu);
    }
    // 주말
    var wk = weekEps(), np = 0, ups = 0, rs = [];
    wk.forEach(function(e){ openPicks(e).forEach(function(k){ np++; var o = info(k, e.air_date); if (o.ret != null) { rs.push(o.ret); if (o.ret > 0) ups++; } }); });
    var avg = rs.length ? rs.reduce(function(a, b){ return a + b; }, 0) / rs.length : null, rng = weekRange();
    var stats = priceOn() && rs.length
      ? [['방송 종목', np + '개', '#fff'], ['평균', pct(avg), avg >= 0 ? '#FF8A95' : '#7DB3FF'], ['오른 종목', ups + '개', '#fff']]
      : [['방송', wk.length + '회', '#fff'], ['공개 종목', np + '개', '#fff'], ['출연', countEx(wk) + '명', '#fff']];
    return hero('#191F28', '이번 주 결산 · ' + rng, '이번 주 방송 종목,<br>지금 성적은?', '',
      '<div class="hm-stats">' + stats.map(function(s){ return '<div><small>' + s[0] + '</small><b style="color:' + s[2] + '">' + s[1] + '</b></div>'; }).join('') + '</div>');
  }
  function weekStart(){ var n = nowK(), d = new Date(n).getUTCDay(), back = d === 0 ? 6 : d === 6 ? 5 : d - 1; if (d === 1 && new Date(n).getUTCHours() < 5) back = 7; return ymd(n - back * 864e5); }
  function weekEps(){ var a = weekStart(), b = ymd(kms(a) + 4 * 864e5); return pubEps().filter(function(e){ return e.air_date >= a && e.air_date <= b; }); }
  function weekRange(){ var a = weekStart(); return md(a) + '–' + md(ymd(kms(a) + 4 * 864e5)); }
  function countEx(list){ var s = {}; list.forEach(function(e){ exName(e).forEach(function(x){ s[x] = 1; }); }); return Object.keys(s).length; }

  function talkHTML(S){
    var t = H.talk || [], n = nowK(), today = ymd(n), cnt = t.filter(function(m){ return ymd(Date.parse(m.at) + 9 * 3600e3) === today; }).length;
    var title = S.k === 'live' ? '방송 보면서 같이 이야기해요' : S.k === 'after' ? '오늘 방송 어떠셨어요?' : S.k === 'weekend' ? '주말엔 무슨 이야기를 나눌까요?' : '지금 무슨 이야기를 나누고 있을까요?';
    var live = t.length ? '오늘 글 ' + cnt + '개 · 마지막 글 ' + ago(t[0].at) : '아직 글이 없어요';
    var b = t.slice(0, 2).map(function(m){ return '<span class="hm-bub"><small>' + esc(m.who || '회원') + ' · ' + ago(m.at) + '</small>' + esc(String(m.body || '').slice(0, 60)) + '</span>'; }).join('');
    if (!b) b = '<span class="hm-bub"><small>리딩노트</small>첫 이야기를 남겨 주세요. 방송 종목 이야기도 좋아요.</span>';
    return '<button class="hm-talk" data-a="view" data-v="feed"><span class="q">' + title + '</span><span class="hm-live"><i></i>' + live + '</span>' + b +
      '<span class="hm-go"><span>이야기방 들어가기</span>' + IC.chev + '</span></button>';
  }

  // 계산할 종목 고르기: 지금 시간대에 맞는 방송 종목 중 가격이 있는 것
  function calcPick(S){
    var list = [];
    if (S.k === 'after' && S.ep && S.ep.published) list = openPicks(S.ep).map(function(k){ return info(k, S.ep.air_date); });
    if ((S.k === 'pre' || S.k === 'live') && S.p) { var le = lastEp(S.p.id, S.today); if (le) list = openPicks(le).map(function(k){ return info(k, le.air_date); }); }
    if (!list.length) pubEps().slice(0, 6).forEach(function(e){ openPicks(e).forEach(function(k){ list.push(info(k, e.air_date)); }); });
    var withT = list.filter(function(o){ return o.target && (o.base || o.buy); });
    return withT[0] || list.filter(function(o){ return o.base; })[0] || list[0] || null;
  }
  function calcHTML(S){
    var o = calcPick(S), on = priceOn();
    if (!o) return '';
    var title, sub, l1, v1, l2, v2, buy, sell;
    if (o.target && (o.buy || (on && o.base))) {
      buy = o.buy || o.base; sell = o.target;
      title = '해당 종목 예상 수익이 궁금하다면?'; sub = esc(o.name) + ' · 방송에서 말한 목표가 ' + won(o.target) + '원까지 오르면?';
      l1 = '방송가에 100만 원'; v1 = won(Math.floor(1e6 / buy) * buy) + '원'; l2 = '목표가 도달 시'; v2 = won(Math.floor(1e6 / buy) * o.target) + '원';
    } else if (on && o.base && o.cur) {
      buy = o.base; sell = o.cur;
      title = esc(o.name) + ', 방송 때 샀다면 지금 얼마?'; sub = md(o.date) + ' 방송 · ' + (o.fromBuy ? '방송에서 말한 매수가' : '방송일 종가') + ' 기준';
      l1 = '방송 때 100만 원'; v1 = won(Math.floor(1e6 / buy) * buy) + '원'; l2 = md(o.asof) + ' 종가로'; v2 = won(Math.floor(1e6 / buy) * o.cur) + '원';
    } else {
      return '<section class="hm-calc"><p class="q">방송 종목, 수익을 직접 계산해 보세요</p><p class="s">사고팔 때 수수료·세금까지 빼고 남는 돈을 알려 드려요</p>' +
        '<button class="hm-btn" data-a="hmCalc" data-v="">' + IC.calc.replace('<svg', '<svg style="fill:none;stroke:currentColor;stroke-width:2"') + '수익 계산기 열기</button></section>';
    }
    var mk = o.px && o.px.m;
    return '<section class="hm-calc"><p class="q">' + title + '</p><p class="s">' + sub + '</p><div class="hm-eq"><div><small>' + l1 + '</small><b>' + v1 + '</b></div>' + IC.arrow + '<div class="r"><small>' + l2 + '</small><b>' + v2 + '</b></div></div>' +
      '<button class="hm-btn" data-a="hmCalc" data-v="' + Math.round(buy) + ',' + Math.round(sell) + ',' + esc(mk || '') + '">수수료·세금까지 계산해 보기</button></section>';
  }

  function voteHTML(code, name, sub){
    if (!code) return '';
    var t = H.votes[code] || { buy: 0, wait: 0, no: 0, total: 0 }, me = H.mine[code], showR = !!me && t.total > 0;
    var O = [['buy', '살래요', '#F04452'], ['wait', '더 볼래요', '#12B886'], ['no', '안 살래요', '#3182F6']];
    var b = O.map(function(o){ var p = t.total ? Math.round(t[o[0]] / t.total * 100) : 0;
      return '<button data-a="hmVote" data-v="' + esc(code) + '|' + o[0] + '" aria-pressed="' + (me === o[0]) + '">' + (showR ? '<i style="width:' + p + '%;background:' + o[2] + '"></i>' : '') + '<span class="d" style="background:' + o[2] + '"></span><span>' + o[1] + '</span>' + (showR ? '<b>' + p + '%</b>' : '') + '</button>'; }).join('');
    return '<section class="t2-sec hm-sec"><div class="hm-sh"><div><h2>' + esc(name) + ', 어떻게 보세요?</h2><small>' + esc(sub || '한 번 누르면 다른 회원 생각도 보여요') + '</small></div></div><div class="hm-vote">' + b + '</div>' +
      '<p class="hm-note">' + (t.total ? '회원 ' + t.total + '명의 의견이에요. ' : '') + '의견 모음일 뿐 투자 추천이 아니에요.</p></section>';
  }
  function voteTarget(S){
    var e = null;
    if (S.k === 'after' && S.ep && S.ep.published) e = S.ep;
    else if (S.p) e = lastEp(S.p.id, S.today);
    if (!e) e = pubEps()[0];
    var k = openPicks(e)[0]; return k ? { code: k.stock_code, name: k.stock_name, sub: md(e.air_date) + ' ' + (prog(e.program_id) || {}).name + ' · ' + (k.expert_name || '') } : null;
  }

  function lastweekHTML(S){
    if (!S.p) return '';
    var e = lastEp(S.p.id, S.today); if (!e) return '';
    var ks = openPicks(e).slice(0, 4); if (!ks.length) return '';
    var on = priceOn();
    var tiles = ks.map(function(k){ var o = info(k, e.air_date);
      return '<button class="hm-tile" data-a="stock" data-v="' + esc(k.stock_code) + '"><b>' + esc(k.stock_name) + '</b><span>' + esc(k.expert_name || '') + '</span>' +
        (on && o.ret != null ? '<span class="big hm-' + tone(o.ret) + '">' + pct(o.ret) + '</span><span>방송가 대비</span>' : '<span class="qt">' + esc(k.quote || '') + '</span>') + '</button>'; }).join('');
    return '<section class="t2-sec hm-sec"><div class="hm-sh"><div><h2>지난주 같은 방송 종목</h2><small>' + md(e.air_date) + ' ' + esc(S.p.name) + (on ? ' · 지금 성적' : '') + '</small></div></div><div class="hm-g2">' + tiles + '</div>' + pxNote() + '</section>';
  }

  function afterPicksHTML(S){
    var e = S.ep; if (!e || !e.published) return '';
    var by = {}, order = [];
    (e.picks || []).forEach(function(k){ var id = k.expert_id || k.expert_name; if (!by[id]) { by[id] = { name: k.expert_name || '', open: [], lock: 0 }; order.push(id); } if (k.kind === 'secret' && !k.revealed) by[id].lock++; else if (k.stock_code || k.stock_name) by[id].open.push(k); });
    if (!order.length) return '';
    var h = order.map(function(id){ var x = by[id];
      return '<div class="hm-ex"><div class="hm-exh"><span class="hm-av">' + esc(x.name.charAt(0)) + '</span><div class="hm-mid"><b>' + esc(x.name) + '</b><span>종목 ' + (x.open.length + x.lock) + '개' + (x.lock ? ' · 비공개 ' + x.lock : '') + '</span></div></div>' +
        x.open.map(function(k){ var tgt = k.target ? ' · 목표 ' + won(k.target) + '원' : '', bp = k.buy ? '방송 매수가 ' + won(k.buy) + '원' : '방송에서 말한 종목';
          return '<div class="hm-pk"><button class="hm-mid" style="border:0;background:none;font:inherit;color:inherit;text-align:left;cursor:pointer;padding:0" data-a="' + (k.stock_code ? 'stock' : 'pBc') + '" data-v="' + esc(k.stock_code || (e.program_id + '|' + e.air_date)) + '"><b>' + esc(k.stock_name) + '</b><span>' + bp + tgt + '</span></button>' +
            (k.buy ? '<button class="hm-cb" data-a="hmCalc" data-v="' + k.buy + ',' + (k.target || k.buy) + ',">수익 계산</button>' : '') + '</div>'; }).join('') +
        (x.lock ? '<div class="hm-lock">' + IC.lock + '<span>비공개 종목 ' + x.lock + '개 · 공개되면 여기에 보여요</span></div>' : '') + '</div>'; }).join('');
    return '<section class="t2-sec hm-sec"><div class="hm-sh"><div><h2>전문가별 종목</h2><small>성적은 다음 장 마감 뒤부터 쌓여요</small></div></div>' + h + '<p class="hm-note">방송에서 전문가가 직접 한 말과 가격을 옮겼어요. 사거나 팔라는 권유가 아니에요.</p></section>';
  }

  function top3HTML(){
    if (!priceOn()) return '';
    var n = nowK(), lim = H.per === '1w' ? 7 : H.per === '1m' ? 31 : 3650, from = ymd(n - lim * 864e5), rs = [];
    pubEps().forEach(function(e){ if (e.air_date < from) return; openPicks(e).forEach(function(k){ var o = info(k, e.air_date); if (o.ret != null) rs.push({ o: o, k: k, e: e }); }); });
    rs.sort(function(a, b){ return b.o.ret - a.o.ret; });
    var per = [['1w', '1주'], ['1m', '1달'], ['all', '전체']].map(function(p){ return '<button data-a="hmPer" data-v="' + p[0] + '" aria-pressed="' + (H.per === p[0]) + '">' + p[1] + '</button>'; }).join('');
    var rows = rs.slice(0, 3).map(function(r, i){ var pg = prog(r.e.program_id);
      return '<button class="hm-row" data-a="stock" data-v="' + esc(r.k.stock_code) + '"><span class="hm-rk' + (i === 0 ? ' g' : '') + '">' + (i + 1) + '</span><span class="hm-mid"><b>' + esc(r.k.stock_name) + '</b><span>' + esc(r.k.expert_name || '') + ' · ' + esc(pg ? pg.name : '') + ' ' + md(r.e.air_date) + '</span></span><span class="hm-v hm-' + tone(r.o.ret) + '">' + pct(r.o.ret) + '</span></button>'; }).join('');
    return '<section class="t2-sec hm-sec"><div class="hm-sh"><div><h2>방송 종목 성적 TOP 3</h2><small>방송가 대비 지금 가격 · 많이 오른 순</small></div></div><div class="hm-per" role="group" aria-label="기간">' + per + '</div>' +
      (rows || '<p class="hm-note" style="font-size:.9375rem">이 기간에는 계산된 종목이 없어요.</p>') + pxNote() + '</section>';
  }

  function weekBarsHTML(){
    var wk = weekEps(); if (!wk.length) return '';
    var on = priceOn(), rows = progs().map(function(p){
      var es = wk.filter(function(e){ return e.program_id === p.id; }), rs = [], n = 0;
      es.forEach(function(e){ openPicks(e).forEach(function(k){ n++; var o = info(k, e.air_date); if (o.ret != null) rs.push(o.ret); }); });
      return { p: p, n: n, avg: rs.length ? rs.reduce(function(a, b){ return a + b; }, 0) / rs.length : null, has: es.length };
    });
    var mx = Math.max.apply(null, rows.map(function(r){ return on && r.avg != null ? Math.abs(r.avg) : r.n; }).concat([1]));
    var h = rows.map(function(r){
      var v = on && r.avg != null ? r.avg : null, w = v != null ? Math.abs(v) / mx * 100 : r.n / mx * 100, col = v == null ? 'var(--sn)' : v >= 0 ? 'var(--up)' : 'var(--down)';
      return '<div class="hm-bar"><span>' + esc(r.p.name) + '</span><span class="t"><i style="width:' + Math.max(r.has ? 3 : 0, w).toFixed(0) + '%;background:' + col + '"></i></span><span class="v' + (v != null ? ' hm-' + tone(v) : '') + '">' + (v != null ? pct(v) : r.has ? r.n + '개' : '—') + '</span></div>'; }).join('');
    return '<section class="t2-sec hm-sec"><div class="hm-sh"><div><h2>프로그램별 성적</h2><small>' + (on ? '방송가 대비 평균 · ' + weekRange() : '이번 주 공개 종목 수 · ' + weekRange()) + '</small></div></div><div class="hm-bars">' + h + '</div>' + pxNote() + '</section>';
  }
  function nextWeekHTML(){
    var ps = progs(); if (!ps.length) return '';
    var d = new Date(nowK()).getUTCDay(), hot = d === 0 || d === 6 ? 1 : d + 1;
    var cells = [1, 2, 3, 4, 5].map(function(w){ var p = ps.filter(function(x){ return +x.weekday === w; })[0];
      return '<div class="' + (w === hot ? 'on' : '') + '"><b>' + WD[w] + '</b><span>' + esc(p ? p.name : '쉬어요') + '</span></div>'; }).join('');
    var at = ps[0] && ps[0].air_time ? ps[0].air_time : '20:30';
    return '<section class="t2-sec hm-sec"><div class="hm-sh"><div><h2>' + (d === 0 || d === 6 ? '다음 주 방송' : '이번 주 방송') + '</h2><small>모두 SBS Biz 밤 ' + esc(at) + '</small></div></div><div class="hm-wk">' + cells + '</div></section>';
  }

  // ── 홈 다시 짜기
  function classify(el){
    var c = el.className || '', h = el.querySelector && el.querySelector('.t2-h'), t = h ? h.textContent.replace(/\s+/g, '') : '';
    if (el.tagName === 'SECTION' && el.querySelector('.p-5l')) return 'five';
    if (/\bmn-home\b/.test(c)) return 'news';
    if (/\bt2-sc4\b/.test(c)) return 'sc4';
    if (/\bt2-hello\b/.test(c)) return 'hello';
    if (/\bp-one\b/.test(c)) return 'one';
    if (/\bt2-cta\b/.test(c)) return 'cta';
    if (/\bt2-basis\b/.test(c)) return 'basis';
    if (el.tagName === 'BUTTON' && el.getAttribute('data-a') === 'pTable') return 'pgo';
    if (t.indexOf('방송속고수종목') === 0) return 'bc';
    if (t.indexOf('오늘의언급종목') === 0 || t.indexOf('최근언급종목') === 0) return 'mention';
    if (t.indexOf('데이터로본종목') === 0) return 'data';
    if (t.indexOf('최근추천') === 0) return 'recent';
    return '';
  }
  var ORDER = {
    morning: ['hero', 'five', 'sc4', 'news', 'bc', 'talk', 'recent', 'top3', 'calc', 'hello', 'one', 'mention', 'data'],
    market: ['hero', 'news', 'data', 'calc', 'talk', 'recent', 'fold5', 'sc4', 'bc', 'mention', 'hello', 'one', 'top3'],
    pre: ['hero', 'bc', 'lastweek', 'calc', 'talk', 'mention', 'news', 'sc4', 'recent', 'fold5', 'top3', 'data', 'hello', 'one'],
    live: ['hero', 'bc', 'talk', 'vote', 'lastweek', 'calc', 'recent', 'sc4', 'mention', 'news', 'fold5', 'data', 'one'],
    after: ['hero', 'picks', 'vote', 'calc', 'talk', 'bc', 'recent', 'sc4', 'mention', 'news', 'fold5', 'top3', 'data', 'one'],
    weekend: ['hero', 'bars', 'top3', 'calc', 'talk', 'next', 'sc4', 'recent', 'news', 'five', 'bc', 'mention', 'data', 'one']
  };
  function frag(d, html){ var t = d.createElement('template'); t.innerHTML = html; return t.content; }
  function decorateRecent(d, sec){
    if (!priceOn()) return;
    Array.prototype.forEach.call(sec.querySelectorAll('.t2-row[data-v^="bc-"]'), function(b){
      var m = /^bc-(\d+)-(\d+)$/.exec(b.getAttribute('data-v') || ''); if (!m) return;
      var e = eps().filter(function(x){ return String(x.id) === m[1]; })[0], k = e && (e.picks || [])[+m[2] - 1];
      if (!k || !k.stock_code) return;
      var o = info(k, e.air_date); if (o.ret == null) return;
      var s = statusOf(o), bar = posbar(o);
      var div = d.createElement('div'); div.className = 'hm-rpb'; div.innerHTML = stHTML(s) + bar;
      b.parentNode.insertBefore(div, b.nextSibling);
      var rt = b.querySelector('.t2-rt b'); if (rt && o.ret != null) { rt.textContent = pct(o.ret); rt.style.color = o.ret >= 0 ? 'var(--up)' : 'var(--down)'; }
    });
    if (!sec.querySelector('.hm-rpb')) return;
    var n = d.createElement('div'); n.innerHTML = pxNote(); if (n.firstChild) sec.appendChild(n.firstChild);
  }
  function fold5(d, sec){
    var ol = sec.querySelector('.p-5l'); if (!ol) return sec;
    var first = ol.querySelector('li span'), t = first ? first.childNodes[0] && first.childNodes[0].textContent || first.textContent : '';
    var s = d.createElement('section'); s.className = 't2-sec';
    s.innerHTML = '<details class="hm-fold"><summary><span class="k">5줄</span><span class="t">' + esc(t) + '</span><span class="o"></span></summary></details>';
    var det = s.firstChild; Array.prototype.slice.call(sec.childNodes).forEach(function(c){ det.appendChild(c); });
    return s;
  }
  function rebuild(w, html){
    if (!H.bc) return html;
    var d = w.document, S = slot(), root = frag(d, html), main = root.querySelector('main.t2');
    if (!main) return html;
    var B = {}, rest = [];
    Array.prototype.slice.call(main.children).forEach(function(el){ var k = classify(el); if (k && !B[k]) B[k] = el; else rest.push(el); });
    var make = function(h){ var f = frag(d, h); return f.firstElementChild ? f : null; };
    var vt = voteTarget(S);
    var NEW = {
      hero: function(){ return make(heroHTML(S)); },
      talk: function(){ return make(talkHTML(S)); },
      calc: function(){ return make(calcHTML(S)); },
      vote: function(){ return vt ? make(voteHTML(vt.code, vt.name, vt.sub)) : null; },
      lastweek: function(){ return make(lastweekHTML(S)); },
      picks: function(){ return make(afterPicksHTML(S)); },
      top3: function(){ return make(top3HTML()); },
      bars: function(){ return make(weekBarsHTML()); },
      next: function(){ return make(nextWeekHTML()); },
      fold5: function(){ return B.five ? fold5(d, B.five) : null; }
    };
    if (B.recent) decorateRecent(d, B.recent);
    var tail = ['cta', 'pgo', 'basis'], used = {};
    while (main.firstChild) main.removeChild(main.firstChild);
    ORDER[S.k].forEach(function(k){
      if (used[k]) return; used[k] = 1;
      if (k === 'fold5') used.five = 1;
      var el = NEW[k] ? NEW[k]() : B[k] || null;
      if (el) main.appendChild(el);
    });
    Object.keys(B).forEach(function(k){ if (!used[k] && tail.indexOf(k) < 0) { used[k] = 1; main.appendChild(B[k]); } });
    rest.forEach(function(el){ main.appendChild(el); });
    tail.forEach(function(k){ if (B[k] && !used[k]) main.appendChild(B[k]); });
    main.setAttribute('data-slot', S.k);
    var box = d.createElement('div'); box.appendChild(root); return box.innerHTML;
  }

  // ── 종목 화면
  function stockCode(w, id){ if (/^[0-9A-Z]{6}$/.test(String(id))) return String(id); try { var s = w.STOCKS && w.STOCKS[id]; if (s && s.code) return s.code; } catch (e) {} return ''; }
  function stockPicks(code){ var out = []; pubEps().forEach(function(e){ (e.picks || []).forEach(function(k){ if (k.stock_code === code && !(k.kind === 'secret' && !k.revealed)) out.push({ k: k, e: e }); }); }); return out; }
  function chartSVG(px, marks){
    var cl = (px.closes || []).slice(0, H.ch).reverse(); if (cl.length < 5) return '';
    var W = 340, Hh = 170, pad = 22, lo = Math.min.apply(null, cl), hi = Math.max.apply(null, cl);
    marks.forEach(function(m){ if (m.target) hi = Math.max(hi, m.target); });
    if (hi === lo) hi = lo + 1;
    var x = function(i){ return 6 + i / (cl.length - 1) * (W - 12); }, y = function(v){ return pad + (1 - (v - lo) / (hi - lo)) * (Hh - pad * 2); };
    var pts = cl.map(function(v, i){ return x(i).toFixed(1) + ',' + y(v).toFixed(1); }).join(' ');
    var up = cl[cl.length - 1] >= cl[0], col = up ? '#F04452' : '#3182F6', g = '';
    marks.forEach(function(m){
      var idx = tradingIdx(px, m.date); if (idx < 0 || idx >= cl.length) return; var i = cl.length - 1 - idx, X = x(i), Y = y(cl[i]);
      var lw = Math.min(150, 14 + m.label.length * 11), lx = Math.max(2, Math.min(W - lw - 2, X - lw / 2));
      g += '<line x1="' + X.toFixed(1) + '" y1="' + pad + '" x2="' + X.toFixed(1) + '" y2="' + (Hh - 26) + '" stroke="#5B4CF0" stroke-dasharray="3 3"/>' +
        '<circle cx="' + X.toFixed(1) + '" cy="' + Y.toFixed(1) + '" r="5" fill="#5B4CF0" stroke="#fff" stroke-width="2"/>' +
        '<rect x="' + lx.toFixed(1) + '" y="' + (Hh - 24) + '" width="' + lw + '" height="22" rx="7" fill="#5B4CF0"/><text x="' + (lx + lw / 2).toFixed(1) + '" y="' + (Hh - 9) + '" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">' + esc(m.label) + '</text>';
      if (m.target && m.target <= hi) g += '<line x1="0" y1="' + y(m.target).toFixed(1) + '" x2="' + W + '" y2="' + y(m.target).toFixed(1) + '" stroke="currentColor" stroke-dasharray="4 4" opacity=".5"/><text x="' + (W - 4) + '" y="' + (y(m.target) - 5).toFixed(1) + '" text-anchor="end" font-size="11" font-weight="700" fill="currentColor">목표 ' + won(m.target) + '</text>';
    });
    var last = cl.length - 1;
    return '<svg class="hm-chart" viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="최근 ' + cl.length + '거래일 종가 흐름" style="color:var(--ink)"><polyline fill="none" stroke="' + col + '" stroke-width="2.4" stroke-linejoin="round" points="' + pts + '"/>' + g +
      '<circle cx="' + x(last).toFixed(1) + '" cy="' + y(cl[last]).toFixed(1) + '" r="5" fill="' + col + '" stroke="#fff" stroke-width="2"/></svg>';
  }
  function floorsHTML(px, base){
    if (!px.hi || !px.lo || px.hi <= px.lo) return '';
    var F = [['꼭대기', '1년 최고', 1], ['높은 층', '', .8], ['중간 층', '', .6], ['낮은 층', '', .4], ['1층', '1년 최저', .2]];
    var lv = function(v){ var r = (v - px.lo) / (px.hi - px.lo); return Math.max(0, Math.min(4, 4 - Math.floor(Math.min(.9999, r) * 5))); };
    var nowF = lv(px.c), bcF = base ? lv(base) : -1;
    var rows = F.map(function(f, i){ var lo = px.lo + (px.hi - px.lo) * (f[2] - .2), cls = (i === nowF ? ' now' : '') + (i === bcF ? ' bc' : '');
      var lab = i === nowF && i === bcF ? '지금 · 방송 때 여기' : i === nowF ? '지금 여기' : i === bcF ? '방송 때 여기' : '';
      return '<div class="hm-fl' + cls + '"><span class="n">' + f[0] + (f[1] ? '<small>' + f[1] + '</small>' : '') + '</span><span class="w">' + lab + '</span><span class="p">' + won(i === 0 ? px.hi : lo) + '원' + (i === 0 ? '' : '~') + '</span></div>'; }).join('');
    return '<section class="t2-sec hm-sec"><div class="hm-sh"><div><h2>지금 이 종목은 몇 층?</h2><small>1년 가격 범위를 다섯 층으로 나눴어요</small></div></div><div class="hm-bld">' + rows + '</div><p class="hm-note">1층은 1년 중 가장 쌌던 가격, 꼭대기는 가장 비쌌던 가격이에요. 층이 높다고 좋고 낮다고 나쁜 건 아니에요.</p></section>';
  }
  function easyHTML(px){
    var t = [];
    if (px.cap) { var c = px.cap, sz = c >= 100000 ? '아주 큰 회사' : c >= 10000 ? '큰 회사' : c >= 3000 ? '중간 회사' : '작은 회사'; t.push(['회사 크기', sz, '시가총액 ' + (c >= 10000 ? (c / 10000).toFixed(1).replace(/\.0$/, '') + '조' : won(c) + '억')]); }
    if (px.per != null && px.per > 0) t.push(['이익 대비 주가', px.per < 10 ? '싼 편이에요' : px.per < 25 ? '보통이에요' : '비싼 편이에요', 'PER ' + Number(px.per).toFixed(1) + '배']);
    var cl = px.closes || []; if (cl.length >= 20) { var r = (cl[0] / cl[cl.length - 1] - 1) * 100; t.push(['최근 ' + Math.round(cl.length / 20) + '달 흐름', r > 3 ? '오르는 중' : r < -3 ? '내리는 중' : '옆으로 가는 중', pct(r) + ' (' + cl.length + '거래일)']); }
    if (px.hi && px.lo) { var p = Math.round((px.c - px.lo) / (px.hi - px.lo) * 100); t.push(['1년 중 위치', p >= 80 ? '높은 편' : p <= 20 ? '낮은 편' : '중간쯤', '최저~최고 사이 ' + p + '%']); }
    if (px.div != null) t.push(['배당', px.div > 0 ? '줘요' : '안 줘요', '배당수익률 ' + Number(px.div).toFixed(1) + '%']);
    if (!t.length) return '';
    return '<section class="t2-sec hm-sec"><div class="hm-sh"><div><h2>쉬운 기업 정보</h2><small>어려운 숫자는 쉬운 말로 바꿨어요</small></div></div><div class="hm-ez">' + t.slice(0, 4).map(function(x){ return '<div><small>' + x[0] + '</small><b>' + x[1] + '</b><span>' + esc(x[2]) + '</span></div>'; }).join('') + '</div>' +
      '<p class="hm-note">숫자 출처: 금융위원회(공공데이터포털) · ' + md(px.asof) + ' 기준 · 투자 권유가 아니에요</p></section>';
  }
  function stockExtra(code){
    if (!code) return '';
    var px = pxOf(code); if (!px && H.px) needCode(code);
    var ps = stockPicks(code), on = priceOn(), h = '';
    if (ps.length) {
      var p0 = ps[0], o = info(p0.k, p0.e.air_date), pg = prog(p0.e.program_id);
      h += '<section class="t2-sec hm-sec"><div class="hm-sh"><div><h2>방송가에서 얼마나 왔을까?</h2><small>' + esc(pg ? pg.name : '') + ' ' + md(p0.e.air_date) + ' · ' + esc(p0.k.expert_name || '') + '</small></div></div>' +
        (on ? posbar(o, true) + stHTML(statusOf(o)) : '<p class="hm-note" style="font-size:.9375rem">' + esc(p0.k.quote || '') + '</p>') +
        (ps.length > 1 ? '<div style="margin-top:.75rem">' + ps.slice(0, 5).map(function(x){ var oo = info(x.k, x.e.air_date), g = prog(x.e.program_id);
          return '<div class="hm-row" style="cursor:default"><span class="hm-av">' + esc((x.k.expert_name || '?').charAt(0)) + '</span><span class="hm-mid"><b>' + esc(x.k.expert_name || '') + ' · ' + esc(g ? g.name : '') + '</b><span>' + md(x.e.air_date) + (x.k.target ? ' · 목표 ' + won(x.k.target) + '원' : '') + '</span></span>' + (on && oo.ret != null ? '<span class="hm-v hm-' + tone(oo.ret) + '">' + pct(oo.ret) + '</span>' : '') + '</div>'; }).join('') + '</div>' : '') +
        (on ? pxNote() : '<p class="hm-note">방송에서 전문가가 한 말이에요 · 사거나 팔라는 권유가 아니에요</p>') + '</section>';
      if (p0.k.target || p0.k.buy || (on && o.base)) {
        var b = p0.k.buy || o.base, s = p0.k.target || o.cur || b;
        h += '<section class="hm-calc"><p class="q">해당 종목 예상 수익이 궁금하다면?</p><p class="s">' + (p0.k.target ? '방송에서 말한 목표가 ' + won(p0.k.target) + '원까지 오르면?' : '방송 때 샀다면 지금 얼마일까요?') + '</p>' +
          '<button class="hm-btn" data-a="hmCalc" data-v="' + Math.round(b) + ',' + Math.round(s) + ',' + esc(px && px.m || '') + '">수수료·세금까지 계산해 보기</button></section>';
      }
    }
    if (px && on) {
      var marks = ps.slice(0, 3).map(function(x){ return { date: x.e.air_date, label: md(x.e.air_date) + ' ' + (x.k.expert_name || '') + ' 방송', target: x.k.target }; });
      var svg = chartSVG(px, marks);
      if (svg) h += '<section class="t2-sec hm-sec"><div class="hm-sh"><div><h2>차트</h2><small>' + (marks.length ? '보라 점이 방송한 날이에요' : '최근 종가 흐름이에요') + '</small></div></div><div class="hm-per" role="group" aria-label="기간">' +
        [[20, '1달'], [40, '2달'], [60, '3달']].map(function(c){ return '<button data-a="hmCh" data-v="' + c[0] + '" aria-pressed="' + (H.ch === c[0]) + '">' + c[1] + '</button>'; }).join('') + '</div>' + svg + pxNote() + '</section>';
      var base = ps.length ? info(ps[0].k, ps[0].e.air_date).base : null;
      h += floorsHTML(px, base);
    }
    needOp(code); h += opinionHTML(code);
    h += voteHTML(code, (px && px.n) || (ps[0] && ps[0].k.stock_name) || '이 종목', '');
    if (px && on) h += easyHTML(px);
    return h;
  }

  function plainStock(code){
    var px = pxOf(code); if (!px) needCode(code);
    var nm = (px && px.n) || (H.names && H.names[code]) || code, on = priceOn();
    var mk = px && px.m ? (px.m === 'K' ? '코스피' : px.m === 'Q' ? '코스닥' : px.m) : '';
    var price = on && px && px.c ? '<p style="margin:.35rem 0 0;font-size:1.75rem;font-weight:800;letter-spacing:-.02em">' + won(px.c) + '원' +
      (px.r != null ? ' <span style="font-size:1rem" class="hm-' + tone(Number(px.r)) + '">' + pct(Number(px.r), 2) + '</span>' : '') + '</p><p class="hm-note" style="margin:.1rem 0 .5rem">' + md(px.asof) + ' 종가 · 금융위원회(공공데이터포털)</p>' : '';
    var h = '<main class="t2" style="padding-top:.25rem"><section class="t2-sec"><div class="t2-h" style="cursor:default">' + esc(nm) + '</div>' +
      '<p class="hm-note" style="margin:.1rem 0 0">' + esc(code) + (mk ? ' · ' + esc(mk) : '') + '</p>' + price +
      '<p style="font-size:.9375rem;line-height:1.55;color:var(--ink2);margin:.6rem 0 .75rem">아직 리딩노트에 기록된 전문가 추천이 없는 종목이에요. 아래에서 전문가 의견과 다른 회원의 생각을 볼 수 있어요.</p>' +
      '<a class="p-go" style="text-decoration:none;margin:0 0 .75rem;background:var(--raise)" href="https://m.stock.naver.com/domestic/stock/' + esc(code) + '/total" target="_blank" rel="noopener noreferrer"><span>네이버 증권에서 지금 가격 보기 ↗</span></a></section>' +
      '<div class="t2" style="padding:.75rem 0 0">' + stockExtra(code) + '</div><p class="t2-basis">공개된 정보를 모아 보여 드려요 · 사거나 팔라는 권유가 아니에요</p></main>';
    return h;
  }
  // ── 붙이기 (ln-news.js가 붙은 뒤 마지막에 감싸요 · 10초 지나면 그냥 붙여요)
  function redraw(){ var w = lnWin(); try { if (w && w.__hm) { var v = w.view(); if (!v || v.t === 'stock') w.render(); } } catch (e) {} }
  function patch(w, d, force){
    if (w.__hm || !w.A || !w.S || !w.screenHome || !w.render) return;
    if (!w.__mn && !force) return;
    w.__hm = true;
    var st = d.createElement('style'); st.id = 'hm-css'; st.textContent = CSS; d.head.appendChild(st);
    try { var sc = d.createElement('script'); sc.textContent = 'window.__lnGo=function(a,r){try{parent.postMessage({site:1,type:"go",app:a,route:r},"*")}catch(e){}}'; d.head.appendChild(sc); } catch (e) {}
    var oHome = w.screenHome;
    w.screenHome = function(){ var h = oHome.apply(this, arguments); try { return rebuild(w, h); } catch (e) { try { console.warn('ln-home', e); } catch (x) {} return h; } };
    if (w.screenStock) {
      var oSt = w.screenStock;
      w.screenStock = function(id){
        // 리딩노트에 추천 기록이 없는 종목(재료 뉴스 '종목 보기' 등)은 기본 화면이 없어서 여기서 만들어요
        var known = false; try { known = !!(w.STOCKS && w.STOCKS[id]); } catch (x) {}
        if (!known && /^[0-9A-Z]{6}$/.test(String(id))) { try { return plainStock(String(id)); } catch (x) { return '<main class="t2"><section class="t2-sec"><p>종목 정보를 불러오지 못했어요.</p></section></main>'; } }
        var h = oSt.apply(this, arguments);
        try { var add = stockExtra(stockCode(w, id)); if (!add) return h; var e = h.indexOf('</section>'); return e > -1 ? h.slice(0, e + 10) + '<div class="t2" style="padding:.75rem 0 0">' + add + '</div>' + h.slice(e + 10) : h + add; } catch (x) { return h; }
      };
    }
    if (w.viewTitle) { var oVT = w.viewTitle; w.viewTitle = function(v){ try { if (v && v.t === 'stock' && !(w.STOCKS && w.STOCKS[v.id])) { var px = pxOf(v.id); return (px && px.n) || (H.names && H.names[v.id]) || '종목'; } } catch (x) {} return oVT.apply(this, arguments); }; }
    w.A.hmPer = function(v){ H.per = v || '1m'; w.render(); };
    w.A.hmCh = function(v){ H.ch = +v || 60; w.render(); };
    w.A.hmCalc = function(v){ var p = String(v || '').split(','); openCalc(+p[0] || 0, +p[1] || 0, p[2] || ''); };
    w.A.hmVote = function(v){
      var p = String(v || '').split('|'), code = p[0], ch = p[1], c = client(); if (!c || !code || !ch) return;
      H.mine[code] = ch; try { localStorage.setItem('ln.votes', JSON.stringify(H.mine)); } catch (e) {}
      q(c.rpc('stock_vote', { p_code: code, p_choice: ch, p_dev: dev() })).then(function(r){ if (r && r.data) Object.assign(H.votes, r.data); w.render(); });
      w.render();
    };
    try { w.render(); } catch (e) {}
  }
  var t0 = Date.now();
  function scan(){
    var force = Date.now() - t0 > 10000;
    Array.prototype.forEach.call(document.querySelectorAll('iframe'), function(f){
      if (!f.__hmLoad) { f.__hmLoad = true; f.addEventListener('load', function(){ var n = 0, iv = setInterval(function(){ n++; scan(); var ok = false; try { ok = !!(f.contentWindow && f.contentWindow.__hm); } catch (e) { ok = true; } if (n > 150 || ok) clearInterval(iv); }, 200); }); }
      var w, d; try { w = f.contentWindow; d = f.contentDocument; } catch (e) { return; }
      if (w && d && d.head && /ln\.html/.test(d.URL || '')) patch(w, d, force);
    });
  }
  var tick = setInterval(function(){ scan(); var w = lnWin(); if (w && w.__hm) clearInterval(tick); }, 200);
  setTimeout(function(){ clearInterval(tick); }, 60000);
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  function boot(){ if (client()) load(); else setTimeout(boot, 500); }
  boot();
  setInterval(load, 10 * 60e3);
  // 시간대가 바뀌면(1분마다 확인) 홈을 다시 그려요
  var lastK = '';
  setInterval(function(){ if (!H.bc) return; var k = slot().k; if (k !== lastK) { lastK = k; redraw(); } }, 60e3);
})();
