/* Click IDs are persisted and copied into forms only after Marketing consent. */
(function (window) {
  'use strict';

  const CLICK_ID_NAMES = ['gclid', 'gbraid', 'wbraid'];
  const params = new URLSearchParams(window.location.search);
  const fromUrl = Object.fromEntries(CLICK_ID_NAMES.map((name) => [name, params.get(name) || '']));

  function fieldsFor(name) {
    return document.querySelectorAll(`input[type="hidden"][name="${name}"]`);
  }

  function clearClickIds() {
    try {
      CLICK_ID_NAMES.forEach((name) => {
        window.sessionStorage.removeItem(name);
        window.localStorage.removeItem(name);
      });
    } catch (_) {}

    CLICK_ID_NAMES.forEach((name) => fieldsFor(name).forEach((field) => { field.value = ''; }));
  }

  function persistAndFillClickIds() {
    if (!window.__adsConsentGranted) {
      clearClickIds();
      return;
    }

    CLICK_ID_NAMES.forEach((name) => {
      try {
        if (fromUrl[name]) window.sessionStorage.setItem(name, fromUrl[name]);
        const value = window.sessionStorage.getItem(name) || '';
        fieldsFor(name).forEach((field) => { field.value = value; });
      } catch (_) {
        fieldsFor(name).forEach((field) => { field.value = ''; });
      }
    });
  }

  window.__persistAdParams = persistAndFillClickIds;
  window.__clearAdParams = clearClickIds;
})(window);
