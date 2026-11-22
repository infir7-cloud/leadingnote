/* 리딩노트 서버 연결 설정 (공용)
   - 예전에는 맨 바깥 index.html(감싸기 페이지)이 넣어 줬어요. 이제 앱 셸(app/index.html)이 이 파일을 직접 읽어요.
   - anonKey는 공개용 키라서 웹에 올려도 괜찮아요. service_role 키는 절대 넣지 마세요. */
window.__SB = {
  projectId: "khbgiybvzagvbilbqnsn",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYmdpeWJ2emFndmJpbGJxbnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0NTQ4NDAsImV4cCI6MjEwODAzMDg0MH0.7tLIqf0LFwrvusH1EoEjTD7_3R1bF9CwwFR-Hb9oHsY"
};

/* 시세 계약 스위치
   - 한국거래소(코스콤) 시세 이용 계약 전에는 false 로 둬요. 종가·수익률·차트·종목 검색 시세가 모두 꺼져요.
   - 계약을 마친 뒤에만 true 로 바꾸고, 운영실 '가격 표시'도 켜요. (빌드할 때 LN_PX_DATA=1 도 함께) */
window.LN_PX = false;
