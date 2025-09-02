document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuLinks = mobileMenu.querySelectorAll('a');
  const themeToggle = document.querySelector('.theme-toggle');
  const body = document.body;
  const header = document.querySelector('header');
  const sunIcon = document.querySelector('.theme-icon.sun');
  const moonIcon = document.querySelector('.theme-icon.moon');
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;

  // === GCLID: cattura e persisti ===
  const urlParams = new URLSearchParams(location.search);
  const urlGclid = urlParams.get('gclid');
  if (urlGclid) localStorage.setItem('gclid', urlGclid);
  const gclidField = document.getElementById('gclid_field');
  if (gclidField) {
    gclidField.value = localStorage.getItem('gclid') || urlGclid || '';
  }

  // === Modal Grazie ===
  const modal = document.getElementById('thank-you-modal');
  const closeModalBtn = document.getElementById('close-modal');
  let lastFocus = null;
  const setModalHidden = (hidden) => {
    modal.toggleAttribute('inert', hidden);
    modal.setAttribute('aria-hidden', hidden ? 'true' : 'false');
  };
  const closeThankYou = () => {
  modal.classList.remove('show');

  // 🔹 Fix: se un elemento interno al modal ha il focus, lo rimuovo
  if (document.activeElement && modal.contains(document.activeElement)) {
    document.activeElement.blur();
  }

  setModalHidden(true);

  // 🔹 Ripristina focus sull’ultimo elemento attivo o fallback
  if (lastFocus && document.contains(lastFocus)) {
    lastFocus.focus();
  } else {
    document.querySelector('.theme-toggle')?.focus();
  }
};

  // === Utils ===
  const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  };

  // === Mobile menu ===
  const setMobileState = (open) => {
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
  hamburger.addEventListener('click', toggleMenu);
  hamburger.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') toggleMenu(); });
  menuLinks.forEach(link => link.addEventListener('click', () => setMobileState(false)));

  // === Tema ===
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const applyTheme = (mode) => {
    const isDark = mode === 'dark';
    body.classList.toggle('dark-mode', isDark);
    themeToggle.setAttribute('aria-pressed', String(isDark));
    sunIcon.style.display = isDark ? 'none' : 'block';
    moonIcon.style.display = isDark ? 'block' : 'none';
  };
  let savedTheme = localStorage.getItem('theme');
  applyTheme(savedTheme ?? (prefersDark.matches ? 'dark' : 'light'));
  prefersDark.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) applyTheme(e.matches ? 'dark' : 'light');
  });
  themeToggle.addEventListener('click', () => {
    const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  });

  // === Header scroll shadow ===
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  // === Carousel arrows ===
  const testimonialsCarousel = document.querySelector('.testimonials-carousel');
  const leftArrow = document.querySelector('.testimonials-section .carousel-arrow.left');
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

  // === Validazione form ===
  const validateField = (field, errorSpan, validator) => {
    const value = field.value.trim();
    const error = validator(value);
    errorSpan.textContent = error || '';
    field.classList.toggle('error', !!error);
    field.setAttribute('aria-invalid', !!error);
  };
  const nameInput = document.getElementById('name');
  nameInput.addEventListener('blur', () => validateField(nameInput, document.getElementById('name-error'), (v) => !v ? 'Il nome è obbligatorio.' : ''));
  const emailInput = document.getElementById('email');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  emailInput.addEventListener('blur', () => validateField(emailInput, document.getElementById('email-error'), (v) => !v || !emailRegex.test(v) ? 'Inserisci una email valida.' : ''));
  const phoneInput = document.getElementById('phone');
  const phoneRegex = /^[-0-9()+ ]{6,}$/;
  phoneInput.addEventListener('blur', () => validateField(phoneInput, document.getElementById('phone-error'), (v) => v && !phoneRegex.test(v) ? 'Inserisci un numero valido.' : ''));
  const messageInput = document.getElementById('message');
  messageInput.addEventListener('blur', () => validateField(messageInput, document.getElementById('message-error'), (v) => !v ? 'Il messaggio è obbligatorio.' : ''));

  // === Submit form ===
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    let valid = true;

    // Validazioni
    validateField(nameInput, document.getElementById('name-error'), (v) => !v ? 'Il nome è obbligatorio.' : '');
    if (nameInput.classList.contains('error')) valid = false;
    validateField(emailInput, document.getElementById('email-error'), (v) => !v || !emailRegex.test(v) ? 'Inserisci una email valida.' : '');
    if (emailInput.classList.contains('error')) valid = false;
    validateField(phoneInput, document.getElementById('phone-error'), (v) => v && !phoneRegex.test(v) ? 'Inserisci un numero valido.' : '');
    if (phoneInput.classList.contains('error')) valid = false;
    const servicesChecked = contactForm.querySelectorAll('input[name="services[]"]:checked').length;
    if (servicesChecked === 0) {
      document.getElementById('services-error').textContent = 'Seleziona almeno un servizio.';
      valid = false;
    }
    validateField(messageInput, document.getElementById('message-error'), (v) => !v ? 'Il messaggio è obbligatorio.' : '');
    if (messageInput.classList.contains('error')) valid = false;
    const privacy = document.getElementById('privacy');
    if (!privacy.checked) {
      document.getElementById('privacy-error').textContent = 'Accetta la Privacy Policy.';
      privacy.classList.add('error');
      valid = false;
    }
    if (!valid) return;

    const formData = new FormData(e.target);
    const submitBtn = contactForm.querySelector('[type="submit"]');
    submitBtn?.setAttribute('disabled','');

    try {
      const response = await fetch(e.target.action, { method: 'POST', body: formData });
      if (response.ok) {
        // Conversione Google Ads SOLO al successo
        // Conversione Google Ads SOLO al successo
    try {
      const nameEC  = (nameInput?.value || '').trim().toLowerCase();
      const emailEC = (emailInput?.value || '').trim().toLowerCase();
      const rawPhone = (phoneInput?.value || '').replace(/[^\d+]/g, '');
      const phoneEC  = rawPhone ? (rawPhone.startsWith('+') ? rawPhone : '+39' + rawPhone.replace(/^0+/, '')) : '';

      if (typeof gtag === 'function') {
        gtag('set', 'user_data', {
          email: emailEC || undefined,
          phone_number: phoneEC || undefined,
          first_name: nameEC || undefined   // 🔹 aggiunto nome
        });
        gtag('event', 'conversion', {
          'send_to': 'AW-17512988470/gbSHCKC3o5AbELb-655B', // usa la tua Label reale
          'value': 0.0,
          'currency': 'EUR'
        });
      }
    } catch(_) {}

        lastFocus = document.activeElement;
        modal.classList.add('show');
        setModalHidden(false);
        closeModalBtn.focus();
        e.target.reset();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert('Errore durante l\'invio. Riprova.');
      }
    } catch (error) {
      alert('Errore di rete. Controlla la connessione.');
    } finally {
      submitBtn?.removeAttribute('disabled');
    }
  });

  // === Modal close listeners ===
  closeModalBtn.addEventListener('click', closeThankYou);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeThankYou(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) closeThankYou();
  });

  // === Evidenzia voce menu corrente ===
  const currentPath = location.pathname.replace(/\/+$/, '');
  document.querySelectorAll('.nav-menu a').forEach(a => {
    const href = a.getAttribute('href').replace(/\/+$/, '');
    if (href === currentPath) a.setAttribute('aria-current', 'page');
  });

  // === Prefetch link interni ===
  const addPrefetch = (url) => {
    if (document.head.querySelector(`link[rel="prefetch"][href="${url}"]`)) return;
    const l = document.createElement('link');
    l.rel = 'prefetch'; l.href = url; l.as = 'document';
    document.head.appendChild(l);
  };
  document.querySelectorAll('a[href^="/"]').forEach(a => {
    a.addEventListener('mouseenter', () => addPrefetch(a.href), { passive: true });
  });

  // === Debounce resize ===
  window.addEventListener('resize', debounce(() => {}, 300));
});
