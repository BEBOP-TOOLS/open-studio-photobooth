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

  // 원을 따라 천천히 도는 행사 텍스트 (SVG). container는 position: relative 인 정사각형 요소
  function ringText(container) {
    const r = 1000 * C.RING_RADIUS;
    const unit = C.RING_TEXT + '\u2003•\u2003';
    const text = unit.repeat(C.RING_REPEAT);
    const len = (2 * Math.PI * r).toFixed(1);
    const id = 'ring' + Math.random().toString(36).slice(2, 8);
    container.insertAdjacentHTML('beforeend', `
      <svg class="ring-text" viewBox="0 0 1000 1000" aria-hidden="true"
           style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;
                  animation:ring-spin ${C.RING_SECONDS}s linear infinite">
        <defs><path id="${id}" d="M 500 ${500 - r} a ${r} ${r} 0 1 1 0 ${2 * r} a ${r} ${r} 0 1 1 0 ${-2 * r}"/></defs>
        <text fill="#fff" fill-opacity="0.6" font-size="26" font-weight="600"
              font-family="Pretendard, -apple-system, sans-serif">
          <textPath href="#${id}" textLength="${len}" lengthAdjust="spacing">${esc(text)}</textPath>
        </text>
      </svg>`);
    if (!document.getElementById('ring-spin-style')) {
      document.head.insertAdjacentHTML('beforeend',
        '<style id="ring-spin-style">@keyframes ring-spin { to { transform: rotate(360deg); } }</style>');
    }
  }

  window.Booth = { C, db, photoUrl, shareUrl, esc, ringText };
})();
