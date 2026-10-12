/* Basic consent50: local bootstrap only; Google tags require a category choice.
   The shared GTM container must also enforce the documented category guards. */
(function (window, document) {
  'use strict';
  if (window.SolveXConsent50) return;

  const VERSION = 'basic50-v1';
  const config = document.currentScript.dataset;
  const mode = config.measurementMode;
  const ga4Id = config.ga4Id;
  const adsId = config.adsId;
  const gtmId = config.gtmId;
  const layer = window.dataLayer = window.dataLayer || [];
  let loaded = false, ga4Configured = false, adsConfigured = false;
  let analytics = false, ads = false, dispatchDepth = 0;
  window.__analyticsConsentGranted = window.__adsConsentGranted = window.__gaConsentGranted = false;
  window['ga-disable-' + ga4Id] = true;

  // Never copy query/hash or the referrer's path into measurement parameters.
  // The shared GTM tag templates must use the same bounded URL contract.
  const pageLocation = typeof window.location.origin === 'string' ? window.location.origin + window.location.pathname : '';
  let pageReferrer = '';
  try {
    const referrer = new URL(document.referrer);
    if (referrer.protocol === 'https:' || referrer.protocol === 'http:') pageReferrer = referrer.origin;
  } catch (_) { /* Missing, malformed or non-HTTP referrers remain empty. */ }
  window.gtag('set', { ads_data_redaction: true, url_passthrough: false, page_location: pageLocation, page_referrer: pageReferrer });

  // Keep the helper's four-field object untouched. A distinct preceding record
  // binds event eligibility to its actual time, not a later grant. GTM replaces
  // dataLayer.push: composing each replacement preserves its previous delegate.
  function guard(delegate) {
    return function () {
      if (dispatchDepth) return delegate.apply(this, arguments);
      dispatchDepth++;
      try {
        for (const item of arguments) {
          if (item && item.event === 'solvex_lead_success') {
            delegate.call(this, {
              solvex_event_statistics: analytics,
              solvex_event_marketing: ads,
              solvex_consent_version: VERSION
            });
          }
          delegate.call(this, item);
        }
        return this.length;
      } finally { dispatchDepth--; }
    };
  }
  let guardedPush = guard(layer.push);
  Object.defineProperty(layer, 'push', {
    configurable: false,
    get: function () { return guardedPush; },
    set: function (delegate) {
      if (typeof delegate === 'function' && delegate !== guardedPush) guardedPush = guard(delegate);
    }
  });

  function clearCategoryCookies(category) {
    try {
    const pattern = category === 'analytics' ? /^_ga(?:_|$)|^_gid$|^_gat(?:_|$)/ : /^_gcl_|^_gac_/;
    const names = (document.cookie || '').split(';').map(value => value.trim().split('=')[0]).filter(name => pattern.test(name));
    const hostname = window.location.hostname;
    const domains = ['', hostname, '.' + hostname];
    // Only this site's parent domain, never an unrelated suffix or all storage.
    if (hostname.endsWith('.solvex-ai3d.com')) domains.push('solvex-ai3d.com', '.solvex-ai3d.com');
    const parts = window.location.pathname.split('/').filter(Boolean);
    const paths = ['/'];
    for (let i = 1; i <= parts.length; i++) paths.push('/' + parts.slice(0, i).join('/'));
    for (const name of names) for (const domain of domains) for (const path of paths) {
      document.cookie = name + '=; Max-Age=0; path=' + path + (domain ? '; domain=' + domain : '') + '; SameSite=Lax';
    }
    } catch (_) { /* Browser-denied cookie access cannot grant a category or stop forms. */ }
  }

  function removePreConsentMeasurementQueue() {
    // A local success remains successful. Only its stale measurement queue item
    // is removed before any Google script can read it; nothing is replayed.
    for (let i = layer.length - 1; i >= 0; i--) {
      const item = layer[i];
      if (item && (item.event === 'solvex_lead_success' || item[0] === 'event')) layer.splice(i, 1);
    }
  }

  function loadOnce(destination) {
    if (loaded || (!analytics && !ads)) return;
    if (mode !== 'gtm-verified' && window.location.hostname !== 'solvex-ai3d.com') return;
    if (!['gtm-verified', 'legacy-direct'].includes(mode)) return;
    loaded = true;
    removePreConsentMeasurementQueue();
    const script = document.createElement('script');
    script.async = true;
    if (mode === 'gtm-verified') {
      layer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      script.src = 'https://www.googletagmanager.com/gtm.js?id=' + gtmId;
    } else {
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + destination;
      window.gtag('js', new Date());
    }
    document.head.appendChild(script);
  }

  window.__loadGA4 = function () {
    if (!analytics) return;
    loadOnce(ga4Id);
    if (mode === 'legacy-direct' && loaded && !ga4Configured) {
      ga4Configured = true;
      window.gtag('config', ga4Id, { allow_google_signals: false, allow_ad_personalization_signals: false, page_location: pageLocation, page_referrer: pageReferrer });
    }
  };
  window.__loadAds = function () {
    if (!ads) return;
    loadOnce(adsId);
    if (mode === 'legacy-direct' && loaded && !adsConfigured) {
      adsConfigured = true;
      window.gtag('config', adsId, { allow_enhanced_conversions: true, allow_ad_personalization_signals: false, page_location: pageLocation, page_referrer: pageReferrer });
    }
  };

  function apply(next) {
    const wasAnalytics = analytics, wasAds = ads;
    analytics = next.analytics === true;
    ads = next.ads === true;
    window.__analyticsConsentGranted = window.__gaConsentGranted = analytics;
    window.__adsConsentGranted = ads;
    window['ga-disable-' + ga4Id] = !analytics;
    // Synchronous state update precedes a possible first load and every lead.
    layer.push({
      solvex_consent_statistics: analytics,
      solvex_consent_marketing: ads,
      solvex_consent_version: VERSION
    });
    if (!analytics) clearCategoryCookies('analytics');
    if (!ads) clearCategoryCookies('ads');
    window.__loadGA4();
    window.__loadAds();
    if (analytics !== wasAnalytics || ads !== wasAds) {
      layer.push({ event: 'solvex_consent_update', solvex_consent_statistics: analytics, solvex_consent_marketing: ads, solvex_consent_version: VERSION });
    }
    // No navigation reload, form reset or deletion of the confirmed-lead registry.
    // Already loaded scripts and already transmitted data cannot be undone here.
  }
  window.SolveXConsent50 = Object.freeze({ version: VERSION, apply: apply });
})(window, document);
