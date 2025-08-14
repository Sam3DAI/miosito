/* Cookie Banner + Consent Mode v2 — 2025 */
(function () {
  // Helpers consenso
  function grantAnalytics() {
    try {
      gtag('consent', 'update', {
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'analytics_storage': 'granted'
      });
      if (typeof window.__loadGA === 'function') window.__loadGA();
      localStorage.setItem('cookieconsent_status', 'allow');
      console.log('[Cookie] Analytics: GRANTED');
    } catch (e) { console.warn('[Cookie] grantAnalytics error', e); }
  }
  function denyAnalytics() {
    try {
      gtag('consent', 'update', {
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'analytics_storage': 'denied'
      });
      localStorage.setItem('cookieconsent_status', 'deny');
      console.log('[Cookie] Analytics: DENIED');
    } catch (e) { console.warn('[Cookie] denyAnalytics error', e); }
  }

  // UI semplice senza dipendenze (no librerie esterne)
  function el(tag, attrs={}, html='') {
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=> n.setAttribute(k, v));
    if (html) n.innerHTML = html;
    return n;
  }

  function buildBanner(){
    const wrap = el('div', { class: 'cc-window', role: 'dialog', 'aria-live':'polite', 'aria-label':'Impostazioni cookie' });
    const msg = el('div', { class: 'cc-message' },
      '<strong>Cookie su questo sito</strong><br>Usiamo cookie essenziali (sempre attivi) e cookie opzionali per statistiche anonime (Google Analytics). <a href="/privacy-policy" class="cc-link">Scopri di più</a>.'
    );
    const btnRow = el('div', { class: 'cc-compliance' });
    const btnDeny = el('button', { class: 'cc-btn cc-deny', type:'button' }, 'Solo essenziali');
    const btnPrefs = el('button', { class: 'cc-btn cc-prefs', type:'button' }, 'Preferenze');
    const btnAllow = el('button', { class: 'cc-btn cc-allow', type:'button' }, 'Accetta tutto');

    btnRow.append(btnDeny, btnPrefs, btnAllow);
    wrap.append(msg, btnRow);

    // Pannello preferenze
    const panel = el('div', { class: 'cc-panel', hidden:'' });
    panel.innerHTML = `
      <div class="cc-panel-title">Preferenze cookie</div>
      <div class="cc-pref">
        <div class="cc-pref-head">
          <span class="cc-pref-name">Essenziali</span>
          <span class="cc-pref-switch">
            <input type="checkbox" checked disabled aria-label="Essenziali sempre attivi">
            <span class="cc-switch"></span>
          </span>
        </div>
        <div class="cc-pref-desc">Necessari per il funzionamento del sito (sicurezza, bilanciamento, preferenze di base). Non raccolgono dati personali.</div>
      </div>
      <div class="cc-pref">
        <div class="cc-pref-head">
          <span class="cc-pref-name">Statistiche (Google Analytics)</span>
          <span class="cc-pref-switch">
            <input id="cc-analytics" type="checkbox" aria-label="Abilita Google Analytics">
            <span class="cc-switch"></span>
          </span>
        </div>
        <div class="cc-pref-desc">Aiutano a capire l’uso del sito in forma aggregata. Nessuna pubblicità personalizzata.</div>
      </div>
      <div class="cc-panel-actions">
        <button type="button" class="cc-btn cc-deny">Salva solo essenziali</button>
        <button type="button" class="cc-btn cc-allow">Salva e accetta statistiche</button>
      </div>
    `;
    wrap.append(panel);

    // Revoca (flottante)
    const revoke = el('button', { class: 'cc-revoke', type:'button', 'aria-label':'Apri preferenze cookie' });
    document.body.append(wrap, revoke);

    // Stato iniziale
    const prior = localStorage.getItem('cookieconsent_status');
    if (prior === 'allow') {
      grantAnalytics();
      wrap.style.display = 'none';
    } else if (prior === 'deny') {
      denyAnalytics();
      // Mostriamo comunque 1 volta il banner nelle pagine finché utente non interagisce
      wrap.style.display = '';
    } else {
      // Nessuna scelta: mostra banner
      wrap.style.display = '';
      denyAnalytics();
    }

    // Azioni
    function openPrefs(){ panel.hidden = false; }
    function closePrefs(){ panel.hidden = true; }

    btnDeny.addEventListener('click', () => { denyAnalytics(); wrap.style.display='none'; });
    btnAllow.addEventListener('click', () => { grantAnalytics(); wrap.style.display='none'; });
    btnPrefs.addEventListener('click', openPrefs);

    panel.querySelector('.cc-panel-actions .cc-deny')
      .addEventListener('click', () => { denyAnalytics(); wrap.style.display='none'; });
    panel.querySelector('.cc-panel-actions .cc-allow')
      .addEventListener('click', () => {
        const checked = panel.querySelector('#cc-analytics').checked;
        if (checked) grantAnalytics(); else denyAnalytics();
        wrap.style.display='none';
      });

    revoke.addEventListener('click', () => {
      wrap.style.display = '';
      openPrefs();
    });

    // Tema dark/chiaro dinamico
    const win = wrap;
    function restyle(){
      win.style.backgroundColor = document.body.classList.contains('dark-mode') ? '#000' : '#fafafa';
    }
    restyle(); const ro = new MutationObserver(restyle);
    ro.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  document.addEventListener('DOMContentLoaded', buildBanner);
})();
