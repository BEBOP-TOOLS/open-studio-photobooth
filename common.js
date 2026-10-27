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

  // QR을 단순하게: 사진 id(UUID 36자)를 22자로 압축해 짧은 주소로 (…/p#xxxxxxxxxxxxxxxxxxxxxx)
  function shortId(uuid) {
    const hex = uuid.replace(/-/g, '');
    const bytes = String.fromCharCode(...hex.match(/../g).map(h => parseInt(h, 16)));
    return btoa(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function longId(s) {
    try {
      const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
      if (bin.length !== 16) return null;
      const hex = [...bin].map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    } catch { return null; }
  }
  function shareUrl(id) {
    return siteBase() + 'p#' + shortId(id);
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

  window.Booth = { C, db, photoUrl, shareUrl, longId, esc, ringText };
})();
