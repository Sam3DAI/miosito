/* Cookie Banner + Consent Mode v2 — versione solida 2025 */
(function () {
  'use strict';
  // --- Stato globale di consenso per l'autotracker ---
  // (usato da ga-autotrack.js per bloccare ogni evento senza consenso)
  window.__gaConsentGranted = false;
  // --- Helper GA/Consent ---
  function gtag(){ (window.dataLayer = window.dataLayer || []).push(arguments); }
  function grantAnalytics() {
    try {
      gtag('consent', 'update', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'granted'
      });
      window.__gaConsentGranted = true;
      localStorage.setItem('cookieconsent_status', 'allow');
      if (typeof window.__loadGA === 'function') {
        window.__loadGA(); // carica gtag.js solo dopo consenso
      }
      // Sync theme con Babylon se presente
      if (typeof updateModelBackground === 'function') updateModelBackground();
      // console.log('[Cookie] Analytics: GRANTED');
    } catch (e) {
      console.warn('[Cookie] grantAnalytics error', e);
    }
  }
  function denyAnalytics() {
    try {
      gtag('consent', 'update', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied'
      });
      window.__gaConsentGranted = false;
      localStorage.setItem('cookieconsent_status', 'deny');
      // Sync theme con Babylon se presente
      if (typeof updateModelBackground === 'function') updateModelBackground();
      // console.log('[Cookie] Analytics: DENIED');
    } catch (e) {
      console.warn('[Cookie] denyAnalytics error', e);
    }
  }
  // --- Utility DOM ---
  function el(tag, attrs = {}, html = '') {
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    if (html) n.innerHTML = html;
    return n;
  }
  function buildBanner() {
    // finestra
    const wrap = el('div', {
      class: 'cc-window',
      role: 'dialog',
      'aria-live': 'polite',
      'aria-label': 'Impostazioni cookie'
    });
    // testo principale (copy chiaro e persuasivo)
    const msg = el(
      'div',
      { class: 'cc-message' },
      `<strong>Cookie su questo sito</strong><br>
       Usiamo cookie essenziali (sempre attivi) e cookie facoltativi per <b>statistiche anonime</b>.
       Accettando le statistiche ci aiuti a <b>migliorare servizi, contenuti e prestazioni</b>.
       <a href="/privacy-policy" class="cc-link">Scopri di più</a>.`
    );
    // pulsanti principali
    const btnRow = el('div', { class: 'cc-compliance' });
    const btnDeny = el('button', { class: 'cc-btn cc-deny', type: 'button' }, 'Solo essenziali');
    const btnPrefs = el('button', { class: 'cc-btn cc-prefs', type: 'button' }, 'Preferenze');
    const btnAllow = el('button', { class: 'cc-btn cc-allow', type: 'button' }, 'Accetta tutto');
    btnRow.append(btnDeny, btnPrefs, btnAllow);
    wrap.append(msg, btnRow);
    // pannello preferenze (toggle Essenziali disabilitato, Analytics attivo)
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
        <div class="cc-pref-desc">Necessari per il funzionamento del sito (sicurezza, bilanciamento, preferenze di base). Non raccolgono dati personali.</div>
      </div>
      <div class="cc-pref">
        <div class="cc-pref-head">
          <span class="cc-pref-name">Statistiche (Analytics)</span>
          <label class="cc-pref-switch">
            <input id="cc-analytics" type="checkbox" aria-label="Abilita statistiche anonime">
            <span class="cc-switch" aria-hidden="true"></span>
          </label>
        </div>
        <div class="cc-pref-desc">Dati aggregati e anonimi per migliorare contenuti e prestazioni. Nessuna pubblicità personalizzata.</div>
      </div>
      <div class="cc-panel-actions">
        <button type="button" class="cc-btn cc-deny">Salva solo essenziali</button>
        <button type="button" class="cc-btn cc-allow">Salva e accetta statistiche</button>
      </div>
    `;
    wrap.append(panel);
    // pulsante per riaprire preferenze
    const revoke = el('button', { class: 'cc-revoke', type: 'button', 'aria-label': 'Apri preferenze cookie' });
    document.body.append(wrap, revoke);
    // stato iniziale da localStorage
    const prior = localStorage.getItem('cookieconsent_status');
    if (prior === 'allow') {
      window.__gaConsentGranted = true;
      grantAnalytics();
      wrap.style.display = 'none';
    } else if (prior === 'deny') {
      window.__gaConsentGranted = false;
      denyAnalytics();
      wrap.style.display = 'none';
    } else {
      window.__gaConsentGranted = false;
      denyAnalytics();
      wrap.style.display = '';
    }
    // elementi pannello
    const analyticsChk = panel.querySelector('#cc-analytics');
    // sincronizza il toggle allo stato corrente
    analyticsChk.checked = !!window.__gaConsentGranted;
    // --- Azioni ---
    function openPrefs() { panel.hidden = false; }
    function closePrefs(){ panel.hidden = true; }
    btnPrefs.addEventListener('click', openPrefs);
    btnDeny.addEventListener('click', () => {
      analyticsChk.checked = false;
      denyAnalytics();
      wrap.style.display = 'none';
    });
    btnAllow.addEventListener('click', () => {
      analyticsChk.checked = true;
      grantAnalytics();
      wrap.style.display = 'none';
    });
    panel.querySelector('.cc-panel-actions .cc-deny')
      .addEventListener('click', () => {
        analyticsChk.checked = false;
        denyAnalytics();
        wrap.style.display = 'none';
      });
    panel.querySelector('.cc-panel-actions .cc-allow')
      .addEventListener('click', () => {
        if (analyticsChk.checked) grantAnalytics();
        else denyAnalytics();
        wrap.style.display = 'none';
      });
    revoke.addEventListener('click', () => {
      wrap.style.display = '';
      openPrefs();
    });
    // Tema dark/chiaro dinamico (se usi .dark-mode sul <body>)
    const win = wrap;
    function restyle() {
      const isDark = document.body.classList.contains('dark-mode');
      win.style.backgroundColor = isDark ? '#000' : '#fafafa';
      win.style.color = isDark ? '#f5f5f7' : '#1d1d1f';
      const buttons = win.querySelectorAll('.cc-btn');
      buttons.forEach(btn => {
        btn.style.backgroundColor = isDark ? '#1d1d1f' : '#fafafa';
        btn.style.color = isDark ? '#f5f5f7' : '#1d1d1f';
      });
      const switches = win.querySelectorAll('.cc-switch');
      switches.forEach(switchEl => {
        switchEl.style.backgroundColor = isDark ? '#3a3a3c' : '#ccc';
      });
      // Sync con Babylon se presente (chiama updateModelBackground)
      if (typeof updateModelBackground === 'function') updateModelBackground();
    }
    restyle();
    new MutationObserver(restyle).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }
  document.addEventListener('DOMContentLoaded', buildBanner);
})();