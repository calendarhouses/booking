/**
 * Реферальна атрибуція для гостьового сайту (Threads / Instagram).
 * Посилання: ?ref=threads | ?ref=instagram (також utm_source=...).
 * Канонічні значення в базі: "Threads" | "Instagram" | "Сайт".
 */
(function (global) {
  var STORAGE_KEY = 'boso_ref_source';
  var TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 днів

  var REF_MAP = {
    threads: 'Threads',
    thread: 'Threads',
    instagram: 'Instagram',
    insta: 'Instagram',
    ig: 'Instagram'
  };

  function normalizeRefToken(raw) {
    var t = String(raw || '').trim().toLowerCase();
    if (!t) return '';
    if (REF_MAP[t]) return REF_MAP[t];
    if (t === 'threads') return 'Threads';
    if (t === 'instagram') return 'Instagram';
    return '';
  }

  function canonicalizeStored(source) {
    var s = String(source || '').trim();
    if (s === 'Threads' || s === 'Instagram') return s;
    return normalizeRefToken(s);
  }

  function readUrlRef() {
    try {
      var params = new URLSearchParams(window.location.search || '');
      var ref = params.get('ref') || params.get('utm_source') || '';
      return normalizeRefToken(ref);
    } catch (e) {
      return '';
    }
  }

  function saveAttribution(source) {
    var canon = canonicalizeStored(source);
    if (!canon) return;
    var payload = JSON.stringify({ source: canon, ts: Date.now() });
    try { sessionStorage.setItem(STORAGE_KEY, payload); } catch (e1) {}
    try { localStorage.setItem(STORAGE_KEY, payload); } catch (e2) {}
  }

  function parseStored(raw) {
    if (!raw) return '';
    try {
      var o = JSON.parse(raw);
      if (!o || !o.source || !o.ts) return '';
      if (Date.now() - Number(o.ts) > TTL_MS) return '';
      return canonicalizeStored(o.source);
    } catch (e) {
      return '';
    }
  }

  function loadAttribution() {
    var fromSession = '';
    var fromLocal = '';
    try { fromSession = parseStored(sessionStorage.getItem(STORAGE_KEY)); } catch (e1) {}
    try { fromLocal = parseStored(localStorage.getItem(STORAGE_KEY)); } catch (e2) {}
    return fromSession || fromLocal || '';
  }

  function cleanRefFromUrl() {
    try {
      var u = new URL(window.location.href);
      var had = u.searchParams.has('ref') || u.searchParams.has('utm_source');
      if (!had) return;
      u.searchParams.delete('ref');
      u.searchParams.delete('utm_source');
      var next = u.pathname + (u.search || '') + (u.hash || '');
      window.history.replaceState({}, document.title, next);
    } catch (e) {}
  }

  /** Зчитати ref з URL (якщо є) і зберегти; повернути поточну атрибуцію. */
  function captureFromUrl() {
    var fromUrl = readUrlRef();
    if (fromUrl) {
      saveAttribution(fromUrl);
      cleanRefFromUrl();
    }
    return fromUrl || loadAttribution() || '';
  }

  /** Джерело для payload броні: Threads | Instagram | Сайт. */
  function getBookingSource() {
    captureFromUrl();
    return loadAttribution() || 'Сайт';
  }

  function isGuestWebSource(source) {
    var s = String(source || '');
    return s === 'Сайт' || s === 'Threads' || s === 'Instagram';
  }

  global.BosoReferral = {
    captureFromUrl: captureFromUrl,
    getBookingSource: getBookingSource,
    isGuestWebSource: isGuestWebSource,
    saveAttribution: saveAttribution,
    loadAttribution: loadAttribution
  };

  // Ранній capture при підключенні скрипта
  try { captureFromUrl(); } catch (e0) {}
})(typeof window !== 'undefined' ? window : this);
