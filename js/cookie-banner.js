/* Cookie Banner + Consent Mode v2 (opt-in reale) */
(function () {
  // Funzioni di comodo per aggiornare il consenso e caricare GA4 solo dopo opt-in
  function grantAnalytics() {
    try {
      // Consenso concesso per analytics (no ads)
      gtag('consent', 'update', {
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'analytics_storage': 'granted'
      });
      // Carica dinamicamente GA4 se non è stato già caricato
      if (typeof window.__loadGA === 'function') window.__loadGA();
      if (window.localStorage) localStorage.setItem('cookieconsent_status', 'allow');
      console.log('[Cookie] Consenso analytics concesso');
    } catch (e) { console.warn('[Cookie] grantAnalytics error', e); }
  }

  function denyAnalytics() {
    try {
      // Consenso negato: nessun cookie/profilazione, niente GA4
      gtag('consent', 'update', {
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'analytics_storage': 'denied'
      });
      if (window.localStorage) localStorage.setItem('cookieconsent_status', 'deny');
      console.log('[Cookie] Consenso analytics negato');
    } catch (e) { console.warn('[Cookie] denyAnalytics error', e); }
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Inizializza il banner (CookieConsent v3)
    window.cookieconsent.initialise({
      palette: {
        popup: { background: '#fafafa', text: '#1d1d1f' },
        button: { background: 'linear-gradient(90deg, #45b6fe, #d95bc5)', text: '#ffffff' }
      },
      theme: 'classic',
      position: 'bottom',
      type: 'opt-in',
      revokable: true,
      showLink: true,
      autoOpen: true,
      cookie: { expiryDays: 425 }, // 14 mesi
      content: {
        message: 'Usiamo cookie essenziali e opzionali per analytics. Il chatbot non salva dati.',
        allow: 'Tutti',
        deny: 'Solo essenziali',
        link: 'Info',
        href: '/privacy-policy',
        policy: 'Preferenze'
      },
      compliance: { 'opt-in': '<div class="cc-compliance">{{deny}}{{allow}}</div>' },
      law: { regionalLaw: true },

      onInitialise: function (status) {
        // Se l’utente aveva già deciso in passato, rispetta la scelta
        if (this.hasConsented()) {
          grantAnalytics();
        } else {
          denyAnalytics();
          this.open(); // in EU: mostra il banner fino a scelta
        }
        console.log('[Cookie] Init -> status:', status, 'consented?', this.hasConsented());
      },

      onStatusChange: function (status) {
        // Cambio stato in tempo reale
        if (this.hasConsented()) grantAnalytics();
        else denyAnalytics();
        console.log('[Cookie] onStatusChange ->', status, 'consented?', this.hasConsented());
      },

      onPopupOpen: function () {
        // Allinea tema chiaro/scuro
        var win = document.querySelector('.cc-window');
        if (win) {
          win.style.bottom = '20px';
          win.style.left = '50%';
          win.style.transform = 'translateX(-50%)';
          win.style.backgroundColor = document.body.classList.contains('dark-mode') ? '#000000' : '#fafafa';
          win.style.opacity = '1';
        }
      },

      revokeBtn: '<div class="cc-revoke {{classes}}"><i class="fa-solid fa-cookie" aria-hidden="true"></i><span class="sr-only">Preferenze cookie</span></div>'
    });
  });
})();
