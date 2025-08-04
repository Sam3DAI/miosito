document.addEventListener('DOMContentLoaded', () => {
    window.cookieconsent.initialise({
        "palette": {
            "popup": {
                "background": "#fafafa",
                "text": "#1d1d1f"
            },
            "button": {
                "background": "linear-gradient(90deg, #45b6fe, #d95bc5)",
                "text": "#ffffff"
            }
        },
        "theme": "classic",
        "position": "bottom",
        "type": "opt-in",
        "revokable": true,
        "showLink": true,
        "autoOpen": true,
        "cookie": {
            "expiryDays": 425  /* 14 mesi - GDPR analytics retention max */
        },
        "content": {
            "message": "Usiamo cookie essenziali per il funzionamento del sito e opzionali per analytics (clic e navigazione) e advertising. Il chatbot non salva dati. Scegli le tue preferenze:",
            "allow": "Tutti",
            "deny": "Solo Essenziali",
            "link": "Info",
            "href": "/privacy-policy",
            "policy": "Preferenze"
        },
        "compliance": {
            "opt-in": '<div class="cc-compliance">{{deny}}{{allow}}</div>'
        },
        "law": {
            "regionalLaw": true
        },
        "onStatusChange": function(status) {
            if (this.hasConsented()) {
                console.log('Consenso dato: Abilita tracking - Persist in storage');
                // Aggiungi GA4 qui
            } else {
                console.log('No consenso: Disabilita - Persist in storage');
            }
        },
        "onInitialise": function(status) {
            console.log('Init: Status ' + status + ' - Consented? ' + this.hasConsented());
            if (!this.hasConsented()) {
                this.open();
            }
        },
        "onPopupOpen": function() {
            const window = document.querySelector('.cc-window');
            window.style.bottom = '20px';
            window.style.left = '50%';
            window.style.transform = 'translateX(-50%)';
            window.style.backgroundColor = document.body.classList.contains('dark-mode') ? '#000000' : '#fafafa';
            window.style.opacity = '1';
            console.log('Banner Opened');
        },
        "revokeBtn": '<div class="cc-revoke {{classes}}"><i class="fa-solid fa-cookie"></i></div>'
    });
});