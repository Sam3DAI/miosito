// Cookie Banner + Consent Mode v2 — 2 categorie: Analytics e Marketing (Ads)
(function () {
  'use strict';

  // Stati globali (usati anche da autotrack e dal form)
  window.__analyticsConsentGranted = false;
  window.__adsConsentGranted = false;
  // retrocompatibilità con ga-autotrack.js
  window.__gaConsentGranted = false;

  function gtag(){ (window.dataLayer = window.dataLayer || []).push(arguments); }

  // Helper consent update
  function applyConsent({analytics, ads}) {
    // Analytics
    gtag('consent', 'update', {
      analytics_storage: analytics ? 'granted' : 'denied'
    });

    // Ads (conversioni). Niente remarketing personalizzato: ad_personalization resta denied.
    gtag('consent', 'update', {
      ad_storage: ads ? 'granted' : 'denied',
      ad_user_data: ads ? 'granted' : 'denied',
      ad_personalization: 'denied'  // metti 'granted' SOLO se farai pubblicità personalizzata
    });

    window.__analyticsConsentGranted = !!analytics;
    window.__adsConsentGranted = !!ads;
    window.__gaConsentGranted = !!analytics; // per compatibilità con ga-autotrack.js

    // Carico i tag in base al consenso
    if (window.__analyticsConsentGranted && typeof window.__loadGA4 === 'function') window.__loadGA4();
    if (window.__adsConsentGranted && typeof window.__loadAds === 'function') window.__loadAds();

    // Se ora sono consentiti gli Ads, posso persistere eventuali parametri ads
    if (window.__adsConsentGranted && typeof window.__persistAdParams === 'function') window.__persistAdParams();
    // Se rifiutati, pulisco
    if (!window.__adsConsentGranted && typeof window.__clearAdParams === 'function') window.__clearAdParams();
  }

  // UI builder
  function el(tag, attrs = {}, html = '') {
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    if (html) n.innerHTML = html;
    return n;
  }

  function buildBanner() {
    const wrap = el('div', { class: 'cc-window', role: 'dialog', 'aria-live': 'polite', 'aria-label': 'Impostazioni cookie' });

    const msg = el('div', { class: 'cc-message' },
      `<strong>Cookie su questo sito</strong><br>
       Usiamo cookie essenziali (sempre attivi), <b>Statistiche</b> per analisi aggregate e <b>Marketing</b> per misurare le conversioni delle campagne.
       Nessuna pubblicità personalizzata. <a href="/privacy-policy" class="cc-link">Scopri di più</a>.`
    );

    const btnRow = el('div', { class: 'cc-compliance' });
    const btnDeny  = el('button', { class: 'cc-btn cc-deny',  type: 'button' }, 'Solo essenziali');
    const btnPrefs = el('button', { class: 'cc-btn cc-prefs', type: 'button' }, 'Preferenze');
    const btnAllow = el('button', { class: 'cc-btn cc-allow', type: 'button' }, 'Accetta tutto');
    btnRow.append(btnDeny, btnPrefs, btnAllow);

    const panel = el('div', { class: 'cc-panel', hidden: '' });
    panel.innerHTML = `
      <div class="cc-panel-title">Preferenze cookie</div>

      <div class="cc-pref">
        <div class="cc-pref-head">
          <span class="cc-pref-name">Essenziali</span>
          <span class="cc-pref-switch">
            <input type="checkbox" checked disabled aria-label="Essenziali sempre attivi">
            <span class="cc-switch" aria-hidden="true"></span>
          </span>
        </div>
        <div class="cc-pref-desc">Necessari al funzionamento (sicurezza, preferenze di base). Non raccolgono dati personali.</div>
      </div>

      <div class="cc-pref">
        <div class="cc-pref-head">
          <span class="cc-pref-name">Statistiche (Analytics)</span>
          <label class="cc-pref-switch">
            <input id="cc-analytics" type="checkbox" aria-label="Abilita statistiche aggregate">
            <span class="cc-switch" aria-hidden="true"></span>
          </label>
        </div>
        <div class="cc-pref-desc">Dati aggregati e anonimi per migliorare contenuti e prestazioni.</div>
      </div>

      <div class="cc-pref">
        <div class="cc-pref-head">
          <span class="cc-pref-name">Marketing (Ads & conversioni)</span>
          <label class="cc-pref-switch">
            <input id="cc-ads" type="checkbox" aria-label="Abilita misurazione conversioni campagne">
            <span class="cc-switch" aria-hidden="true"></span>
          </label>
        </div>
        <div class="cc-pref-desc">Misura delle conversioni delle campagne. <b>Nessuna pubblicità personalizzata</b> (remarketing disabilitato).</div>
      </div>

      <div class="cc-panel-actions">
        <button type="button" class="cc-btn cc-deny">Salva solo essenziali</button>
        <button type="button" class="cc-btn cc-allow">Salva e accetta selezione</button>
      </div>
    `;

    const revoke = el('button', { class: 'cc-revoke', type: 'button', 'aria-label': 'Apri preferenze cookie' });

    wrap.append(msg, btnRow, panel);
    document.body.append(wrap, revoke);

    // Lettura preferenze pregresse (back-compat)
    let prefs = null;
    try { prefs = JSON.parse(localStorage.getItem('cookieconsent_prefs') || 'null'); } catch(_) {}
    const legacy = localStorage.getItem('cookieconsent_status'); // 'allow'|'deny'

    if (!prefs && legacy === 'allow') prefs = { analytics: true, ads: true };
    if (!prefs && legacy === 'deny')  prefs = { analytics: false, ads: false };

    if (!prefs) {
      // default tecnico non persistente
      applyConsent({ analytics: false, ads: false });
      wrap.style.display = '';
    } else {
      applyConsent(prefs);
      wrap.style.display = 'none';
    }

    const analyticsChk = panel.querySelector('#cc-analytics');
    const adsChk = panel.querySelector('#cc-ads');
    analyticsChk.checked = !!window.__analyticsConsentGranted;
    adsChk.checked = !!window.__adsConsentGranted;

    function saveAndApply(a, m) {
      const toSave = { analytics: !!a, ads: !!m };
      localStorage.setItem('cookieconsent_prefs', JSON.stringify(toSave));
      // rimuove chiave legacy
      try { localStorage.removeItem('cookieconsent_status'); } catch(_) {}
      applyConsent(toSave);
      wrap.style.display = 'none';
    }

    btnPrefs.addEventListener('click', () => { panel.hidden = false; });
    panel.querySelector('.cc-panel-actions .cc-allow').addEventListener('click', () => {
      saveAndApply(analyticsChk.checked, adsChk.checked);
    });
    panel.querySelector('.cc-panel-actions .cc-deny').addEventListener('click', () => {
      analyticsChk.checked = false; adsChk.checked = false;
      saveAndApply(false, false);
    });
    btnAllow.addEventListener('click', () => { // Accetta tutto
      analyticsChk.checked = true; adsChk.checked = true;
      saveAndApply(true, true);
    });
    btnDeny.addEventListener('click', () => { // Solo essenziali
      analyticsChk.checked = false; adsChk.checked = false;
      saveAndApply(false, false);
    });
    revoke.addEventListener('click', () => { wrap.style.display = ''; panel.hidden = false; });

    // Tema dinamico (opzionale)
    function restyle() {
      const isDark = document.body.classList.contains('dark-mode');
      wrap.style.backgroundColor = isDark ? '#000' : '#fafafa';
      wrap.style.color = isDark ? '#f5f5f7' : '#1d1d1f';
    }
    restyle();
    new MutationObserver(restyle).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  document.addEventListener('DOMContentLoaded', buildBanner);
})();
