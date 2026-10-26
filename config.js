// 행사 설정 — 여기만 바꾸면 됩니다
window.BOOTH_CONFIG = {
  SUPABASE_URL: 'https://rhzppkhefsrmaotxseia.supabase.co',
  SUPABASE_KEY: 'sb_publishable_BBY740iToPzwZ2SdJhRZuQ_fg-_2GOR', // publishable(공개용) 키만!
  BUCKET: 'photos',

  // QR이 가리킬 사이트 주소 (끝에 / 포함). 비워두면 현재 페이지 주소 기준.
  // 로컬 테스트 시 폰이 같은 Wi‑Fi라면 'http://<맥 IP>:8000/' 로 설정
  PUBLIC_BASE_URL: 'https://bebop-tools.github.io/open-studio-photobooth/',

  EVENT_TITLE: 'OPEN STUDIO',
  EVENT_SUB: '2026',

  // 촬영 결과 해상도 (1:1)
  OUTPUT_W: 1080,
  OUTPUT_H: 1080,
};
