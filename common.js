(function () {
  const C = window.BOOTH_CONFIG;
  const db = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_KEY);

  function photoUrl(path) {
    return db.storage.from(C.BUCKET).getPublicUrl(path).data.publicUrl;
  }

  function siteBase() {
    if (C.PUBLIC_BASE_URL) return C.PUBLIC_BASE_URL;
    return location.href.replace(/[^/]*([?#].*)?$/, '');
  }

  function shareUrl(id) {
    return siteBase() + 'p.html?id=' + encodeURIComponent(id);
  }

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // 사진 원을 따라 놓이는 행사 텍스트 (SVG). container는 position: relative 인 정사각형 요소
  function ringText(container) {
    const r = 1000 * C.RING_RADIUS;
    // 반시계 방향 원 경로 → 아래쪽에서도 글자가 바로 읽히고, 글자는 원 안쪽을 향함
    const offset = ((360 - C.RING_ANGLE) % 360) / 360 * 100;
    const id = 'ring' + Math.random().toString(36).slice(2, 8);
    container.insertAdjacentHTML('beforeend', `
      <svg class="ring-text" viewBox="0 0 1000 1000" aria-hidden="true"
           style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible">
        <defs><path id="${id}" d="M 500 ${500 - r} a ${r} ${r} 0 1 0 0 ${2 * r} a ${r} ${r} 0 1 0 0 ${-2 * r}"/></defs>
        <text fill="#fff" font-size="34" font-weight="600" letter-spacing="5"
              font-family="Pretendard, -apple-system, sans-serif" text-anchor="middle">
          <textPath href="#${id}" startOffset="${offset}%">${esc(C.RING_TEXT)}</textPath>
        </text>
      </svg>`);
  }

  window.Booth = { C, db, photoUrl, shareUrl, esc, ringText };
})();
