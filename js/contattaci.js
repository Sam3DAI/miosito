// contattaci.js — verified Netlify Forms success and accessible thank-you UI
document.addEventListener('DOMContentLoaded', () => {
  const hamburger   = document.querySelector('.hamburger');
  const mobileMenu  = document.getElementById('mobile-menu');
  const menuLinks   = mobileMenu ? mobileMenu.querySelectorAll('a') : [];
  const themeToggle = document.querySelector('.theme-toggle');
  const body        = document.body;
  const header      = document.querySelector('header');
  const sunIcon     = document.querySelector('.theme-icon.sun');
  const moonIcon    = document.querySelector('.theme-icon.moon');

  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;

  /* === Modal Grazie === */
  const modal         = document.getElementById('thank-you-modal');
  const modalTitle    = document.getElementById('thank-you-title');
  const closeModalBtn = document.getElementById('close-modal');
  const submitButton  = contactForm.querySelector('[type="submit"]');
  const thankYouDialog = window.SolveXNetlifyLead && modal && modalTitle && closeModalBtn
    ? window.SolveXNetlifyLead.createDialog({ dialog: modal, title: modalTitle, closeButton: closeModalBtn, fallbackFocus: submitButton })
    : null;

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
  const nameInput     = document.getElementById('name');
  const emailInput    = document.getElementById('email');
  const phoneInput    = document.getElementById('phone');
  const messageInput  = document.getElementById('message');
  const privacy       = document.getElementById('privacy');

  const nameErrEl     = document.getElementById('name-error');
  const emailErrEl    = document.getElementById('email-error');
  const phoneErrEl    = document.getElementById('phone-error');
  const messageErrEl  = document.getElementById('message-error');
  const servicesErrEl = document.getElementById('services-error');
  const privacyErrEl  = document.getElementById('privacy-error');
  const servicesCheckboxGroup = document.getElementById('services-checkbox-group');
  const servicesFallback = document.getElementById('services-fallback');
  const servicesFallbackSelect = document.getElementById('services-fallback-select');
  const serviceCheckboxes = contactForm.querySelectorAll('input[type="checkbox"][name="services[]"]');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[-0-9()+ ]{6,}$/;

  const validateField = (field, errorSpan, validator) => {
    if (!field || !errorSpan) return;
    const value = (field.value || '').trim();
    const error = validator(value);
    errorSpan.textContent = error || '';
    field.classList.toggle('error', !!error);
    field.setAttribute('aria-invalid', error ? 'true' : 'false');
  };

  nameInput?.addEventListener('blur',   () => validateField(nameInput,   nameErrEl,    (v) => !v ? 'Il nome è obbligatorio.' : ''));
  emailInput?.addEventListener('blur',  () => validateField(emailInput,  emailErrEl,   (v) => !v || !emailRegex.test(v) ? 'Inserisci una email valida.' : ''));
  phoneInput?.addEventListener('blur',  () => validateField(phoneInput,  phoneErrEl,   (v) => v && !phoneRegex.test(v) ? 'Inserisci un numero valido.' : ''));
  messageInput?.addEventListener('blur',() => validateField(messageInput,messageErrEl, (v) => !v ? 'Il messaggio è obbligatorio.' : ''));

  const validateContactForm = () => {
    let valid = true;

    validateField(nameInput, nameErrEl, (value) => !value ? 'Il nome è obbligatorio.' : '');
    if (nameInput?.classList.contains('error')) valid = false;

    validateField(emailInput, emailErrEl, (value) => !value || !emailRegex.test(value) ? 'Inserisci una email valida.' : '');
    if (emailInput?.classList.contains('error')) valid = false;

    validateField(phoneInput, phoneErrEl, (value) => value && !phoneRegex.test(value) ? 'Inserisci un numero valido.' : '');
    if (phoneInput?.classList.contains('error')) valid = false;

    validateField(messageInput, messageErrEl, (value) => !value ? 'Il messaggio è obbligatorio.' : '');
    if (messageInput?.classList.contains('error')) valid = false;

    const servicesChecked = contactForm.querySelectorAll('input[name="services[]"]:checked').length;
    if (servicesErrEl) {
      servicesErrEl.textContent = servicesChecked === 0 ? 'Seleziona almeno un servizio.' : '';
      servicesErrEl.style.display = servicesChecked === 0 ? 'block' : 'none';
    }
    if (servicesChecked === 0) valid = false;

    if (privacy) {
      const privacyError = privacy.checked ? '' : 'Accetta la Privacy Policy.';
      privacy.classList.toggle('error', !!privacyError);
      privacy.setAttribute('aria-invalid', privacyError ? 'true' : 'false');
      if (privacyErrEl) {
        privacyErrEl.textContent = privacyError;
        privacyErrEl.style.display = privacyError ? 'block' : 'none';
      }
      if (privacyError) valid = false;
    }

    return valid;
  };

  const submitStatus = document.getElementById('contact-submit-status');
  const enhancementNodes = [
    nameInput, emailInput, phoneInput, messageInput, privacy,
    nameErrEl, emailErrEl, phoneErrEl, messageErrEl, servicesErrEl, privacyErrEl,
    servicesCheckboxGroup, servicesFallback, servicesFallbackSelect, submitStatus,
    submitButton, thankYouDialog
  ];
  const canEnhanceServicePicker = window.SolveXNetlifyLead
    && enhancementNodes.every(Boolean)
    && serviceCheckboxes.length > 0;

  if (canEnhanceServicePicker) {
    window.SolveXNetlifyLead.bind({
      form: contactForm,
      formName: 'contact-main',
      leadSource: 'contattaci_page',
      validate: validateContactForm,
      statusElement: submitStatus,
      onSuccess: ({ submitButton: trigger }) => thankYouDialog?.open(trigger)
    });

    /* Reveal the custom UI only after the verified submit listener exists. */
    if (contactForm.dataset.solvexLeadBound === '1' && contactForm.noValidate) {
      servicesCheckboxGroup.hidden = false;
      servicesFallbackSelect.disabled = true;
      servicesFallbackSelect.required = false;
      servicesFallback.hidden = true;
    }
  }

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
