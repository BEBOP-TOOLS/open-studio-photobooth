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

  // 사진 원을 따라 놓이는 텍스트 (촬영 화면 + 아카이브 크게 보기)
  RING_TEXT: 'BEBOP OPEN STUDIO 2026',
  RING_RADIUS: 0.44,     // 사진 너비 대비 반지름 (0.5 = 사진 가장자리)
  RING_ANGLE: 135,       // 텍스트 가운데 위치 (12시 = 0, 시계방향 도 단위. 135 = 우측 하단)

  // 소속 입력 화면에서 고를 수 있는 회사 태그 (여기에 추가하면 바로 반영)
  COMPANIES: [
    'BEBOP', 'HEAZ', 'Studio Kim', 'Jiyounkim', 'Samsung', 'BKID', 'SWNA', 'Secondwhite',
    'BDCI', 'COG', 'Double D', 'Superset', 'Studio 2', 'Unichest', 'Useful Workshop',
    'eurekai.studio', 'found/Founded', 'Flake', 'H.W.F', 'TM.S', 'Intenxiv', 'Ohseven',
    'SP', 'rojotype',
  ],

  // 아카이브 상단 문구
  WELCOME_TEXT: 'WELCOME TO',           // 뒤에 BEBOP. 로고(assets/bebop-logo.svg)가 붙음

  // 촬영 결과 해상도 (1:1)
  OUTPUT_W: 1080,
  OUTPUT_H: 1080,
};
