// contattaci.js — build safe
document.addEventListener('DOMContentLoaded', () => {
  const hamburger  = document.querySelector('.hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuLinks  = mobileMenu ? mobileMenu.querySelectorAll('a') : [];
  const themeToggle = document.querySelector('.theme-toggle');
  const body   = document.body;
  const header = document.querySelector('header');
  const sunIcon  = document.querySelector('.theme-icon.sun');
  const moonIcon = document.querySelector('.theme-icon.moon');

  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;

  /* === GCLID: NO persistenza senza consenso === */
const gclidField = document.getElementById('gclid_field');
// Se __persistAdParams ha già salvato in sessione, lo usiamo; altrimenti lasciamo vuoto
const gclidSession = sessionStorage.getItem('gclid');
if (gclidSession && gclidField) gclidField.value = gclidSession;

  /* === Modal Grazie === */
  const modal = document.getElementById('thank-you-modal');
  const closeModalBtn = document.getElementById('close-modal');
  let lastFocus = null;

  const setModalHidden = (hidden) => {
    if (!modal) return;
    modal.toggleAttribute('inert', hidden);
    modal.setAttribute('aria-hidden', hidden ? 'true' : 'false');
  };

  const closeThankYou = () => {
    if (!modal) return;
    modal.classList.remove('show');

    if (document.activeElement && modal.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    setModalHidden(true);

    if (lastFocus && document.contains(lastFocus)) {
      lastFocus.focus();
    } else {
      document.querySelector('.theme-toggle')?.focus();
    }
  };

  /* === Utils === */
  const debounce = (fn, delay) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); }; };

  /* === Mobile menu === */
  const setMobileState = (open) => {
    if (!hamburger || !mobileMenu) return;
    hamburger.classList.toggle('active', open);
    mobileMenu.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    if (open) {
      mobileMenu.removeAttribute('hidden');
      document.documentElement.style.overflow = 'hidden';
      hamburger.focus();
    } else {
      document.documentElement.style.overflow = '';
      setTimeout(() => mobileMenu.setAttribute('hidden', ''), 300);
    }
  };
  const toggleMenu = () => setMobileState(!hamburger.classList.contains('active'));
  hamburger?.addEventListener('click', toggleMenu);
  hamburger?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(); }});
  menuLinks.forEach(link => link.addEventListener('click', () => setMobileState(false)));

  /* === Tema === */
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const applyTheme = (mode) => {
    const isDark = mode === 'dark';
    body.classList.toggle('dark-mode', isDark);
    themeToggle?.setAttribute('aria-pressed', String(isDark));
    if (sunIcon && moonIcon) {
      sunIcon.style.display = isDark ? 'none' : 'block';
      moonIcon.style.display = isDark ? 'block' : 'none';
    }
  };
  let savedTheme = localStorage.getItem('theme');
  applyTheme(savedTheme ?? (prefersDark.matches ? 'dark' : 'light'));
  prefersDark.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) applyTheme(e.matches ? 'dark' : 'light');
  });
  themeToggle?.addEventListener('click', () => {
    const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  });

  /* === Header shadow on scroll === */
  window.addEventListener('scroll', () => {
    header?.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  /* === Carousel frecce (testimonials) === */
  const testimonialsCarousel = document.querySelector('.testimonials-carousel');
  const leftArrow  = document.querySelector('.testimonials-section .carousel-arrow.left');
  const rightArrow = document.querySelector('.testimonials-section .carousel-arrow.right');
  if (testimonialsCarousel && leftArrow && rightArrow) {
    leftArrow.addEventListener('click', () => {
      testimonialsCarousel.scrollBy({ left: -320, behavior: 'smooth' });
      if (testimonialsCarousel.scrollLeft <= 0) {
        testimonialsCarousel.scrollTo({ left: testimonialsCarousel.scrollWidth - testimonialsCarousel.clientWidth, behavior: 'smooth' });
      }
    });
    rightArrow.addEventListener('click', () => {
      testimonialsCarousel.scrollBy({ left: 320, behavior: 'smooth' });
      if (testimonialsCarousel.scrollLeft + testimonialsCarousel.clientWidth >= testimonialsCarousel.scrollWidth - 1) {
        testimonialsCarousel.scrollTo({ left: 0, behavior: 'smooth' });
      }
    });
  }

  /* === Validazione form === */
  const validateField = (field, errorSpan, validator) => {
    const value = (field.value || '').trim();
    const error = validator(value);
    errorSpan.textContent = error || '';
    field.classList.toggle('error', !!error);
    field.setAttribute('aria-invalid', !!error);
  };

  const nameInput  = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const messageInput = document.getElementById('message');
  const privacy = document.getElementById('privacy');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[-0-9()+ ]{6,}$/;

  nameInput?.addEventListener('blur', () => validateField(nameInput, document.getElementById('name-error'), (v) => !v ? 'Il nome è obbligatorio.' : ''));
  emailInput?.addEventListener('blur', () => validateField(emailInput, document.getElementById('email-error'), (v) => !v || !emailRegex.test(v) ? 'Inserisci una email valida.' : ''));
  phoneInput?.addEventListener('blur', () => validateField(phoneInput, document.getElementById('phone-error'), (v) => v && !phoneRegex.test(v) ? 'Inserisci un numero valido.' : ''));
  messageInput?.addEventListener('blur', () => validateField(messageInput, document.getElementById('message-error'), (v) => !v ? 'Il messaggio è obbligatorio.' : ''));

  /* === Submit form === */
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    let valid = true;

    validateField(nameInput,  document.getElementById('name-error'),  (v) => !v ? 'Il nome è obbligatorio.' : '');
    if (nameInput.classList.contains('error')) valid = false;

    validateField(emailInput, document.getElementById('email-error'), (v) => !v || !emailRegex.test(v) ? 'Inserisci una email valida.' : '');
    if (emailInput.classList.contains('error')) valid = false;

    validateField(phoneInput, document.getElementById('phone-error'), (v) => v && !phoneRegex.test(v) ? 'Inserisci un numero valido.' : '');
    if (phoneInput.classList.contains('error')) valid = false;

    const servicesErrEl = document.getElementById('services-error');
    const servicesChecked = contactForm.querySelectorAll('input[name="services[]"]:checked').length;
    servicesErrEl.textContent = servicesChecked === 0 ? 'Seleziona almeno un servizio.' : '';
    if (servicesChecked === 0) valid = false;

    validateField(messageInput, document.getElementById('message-error'), (v) => !v ? 'Il messaggio è obbligatorio.' : '');
    if (messageInput.classList.contains('error')) valid = false;

    if (!privacy.checked) {
      document.getElementById('privacy-error').textContent = 'Accetta la Privacy Policy.';
      privacy.classList.add('error');
      valid = false;
    } else {
      document.getElementById('privacy-error').textContent = '';
      privacy.classList.remove('error');
    }

    if (!valid) return;

    const formData = new FormData(e.target);
    const submitBtn = contactForm.querySelector('[type="submit"]');
    submitBtn?.setAttribute('disabled','');

    // Enhanced Conversions: prepariamo anche per eventuale redirect
    const ec = (() => {
      const firstNameEC = ((nameInput?.value || '').trim().split(' ')[0] || '').toLowerCase();
      const emailEC = (emailInput?.value || '').trim().toLowerCase();
      const rawPhone = (phoneInput?.value || '').replace(/[^\d+]/g, '');
      const phoneEC  = rawPhone ? (rawPhone.startsWith('+') ? rawPhone : '+39' + rawPhone.replace(/^0+/, '')) : '';
      return { email: emailEC, phone_number: phoneEC, first_name: nameEC };
    })();
    try { sessionStorage.setItem('__contact_ec', JSON.stringify(ec)); } catch(_) {}

    try {
      const response = await fetch(e.target.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      const looksOk = response.ok || response.type === 'opaqueredirect' || response.status === 0;

      if (looksOk) {
        try {
          // GA4: lead solo se consenso Statistiche
if (window.__analyticsConsentGranted && typeof gtag === 'function') {
  gtag('event', 'generate_lead', {
    method: 'contact_form',
    value: 0
  });
}

// Google Ads: conversione + Enhanced Conversions solo se consenso Marketing
if (window.__adsConsentGranted && typeof gtag === 'function') {
  gtag('set', 'user_data', {
    email: ec.email || undefined,
    phone_number: ec.phone_number || undefined,
    first_name: ec.first_name || undefined
  });
  gtag('event', 'conversion', {
    send_to: 'AW-17512988470/gbSHCKC3o5AbELb-655B',
    value: 0.0,
    currency: 'EUR'
  });
}

        } catch(_) {}

        lastFocus = document.activeElement;
        modal?.classList.add('show');
        setModalHidden(false);
        closeModalBtn?.focus();
        e.target.reset();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        e.target.submit(); // fallback nativo
      }
    } catch (err) {
      e.target.submit(); // fallback nativo in caso di rete/CORS
    } finally {
      submitBtn?.removeAttribute('disabled');
    }
  });

  /* === Modal close listeners === */
  closeModalBtn?.addEventListener('click', closeThankYou);
  modal?.addEventListener('click', (e) => { if (e.target === modal) closeThankYou(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('show')) closeThankYou();
  });

  /* === Modal da redirect (?success=1) === */
  (function thankYouFromRedirect(){
    const sp = new URLSearchParams(location.search);
    if (sp.get('success') !== '1') return;

    // conversione anche su percorso redirect (se disponibile in sessione)
    try {
      const ec = JSON.parse(sessionStorage.getItem('__contact_ec') || '{}');

// GA4: lead anche su percorso redirect, solo se Statistiche
if (window.__analyticsConsentGranted && typeof gtag === 'function') {
  gtag('event', 'generate_lead', {
    method: 'contact_form_redirect',
    value: 0
  });
}

// Ads: conversione + EC solo se Marketing
if (window.__adsConsentGranted && typeof gtag === 'function') {
  gtag('set', 'user_data', {
    email: ec.email || undefined,
    phone_number: ec.phone_number || undefined,
    first_name: ec.first_name || undefined
  });
  gtag('event', 'conversion', {
    send_to: 'AW-17512988470/gbSHCKC3o5AbELb-655B',
    value: 0.0,
    currency: 'EUR'
  });
}

    } catch(_) {}
    try { sessionStorage.removeItem('__contact_ec'); } catch(_) {}

    lastFocus = document.activeElement;
    modal?.classList.add('show');
    setModalHidden(false);
    closeModalBtn?.focus();

    // pulizia URL (togli ?success=1)
    try { history.replaceState({}, '', location.pathname); } catch(_) {}
  })();

  /* === Evidenzia voce menu corrente === */
  const currentPath = location.pathname.replace(/\/+$/, '');
  document.querySelectorAll('.nav-menu a').forEach(a => {
    const href = (a.getAttribute('href') || '').replace(/\/+$/, '');
    if (href === currentPath) a.setAttribute('aria-current', 'page');
  });

  /* === Prefetch link interni === */
  const addPrefetch = (url) => {
    if (!url) return;
    if (document.head.querySelector(`link[rel="prefetch"][href="${url}"]`)) return;
    const l = document.createElement('link');
    l.rel = 'prefetch'; l.href = url; l.as = 'document';
    document.head.appendChild(l);
  };
  document.querySelectorAll('a[href^="/"]').forEach(a => {
    a.addEventListener('mouseenter', () => addPrefetch(a.href), { passive: true });
  });

  /* === Debounce resize (placeholder) === */
  window.addEventListener('resize', debounce(() => {}, 300));
});
