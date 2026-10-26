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

  window.Booth = { C, db, photoUrl, shareUrl, esc };
})();
