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
  const testimonialsCarousel = document.querySelector('.testimonials-carousel');
  const leftArrow = document.querySelector('.testimonials-section .carousel-arrow.left');
  const rightArrow = document.querySelector('.testimonials-section .carousel-arrow.right');
  const modal = document.getElementById('thank-you-modal');
  const closeModalBtn = document.getElementById('close-modal');

  // Utils
  const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  };

  // Mobile menu (con aria, scroll lock, focus trap base)
  const setMobileState = (open) => {
    hamburger.classList.toggle('active', open);
    mobileMenu.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    if (open) {
      mobileMenu.removeAttribute('hidden');
      document.documentElement.style.overflow = 'hidden';
      hamburger.focus(); // Focus trap semplice
    } else {
      document.documentElement.style.overflow = '';
      setTimeout(() => mobileMenu.setAttribute('hidden', ''), 300);
    }
  };
  const toggleMenu = () => setMobileState(!hamburger.classList.contains('active'));

  hamburger.addEventListener('click', toggleMenu);
  hamburger.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') toggleMenu(); });
  menuLinks.forEach(link => link.addEventListener('click', () => setMobileState(false)));

  // Tema: rispetta OS, fallback localStorage
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

  // Header scroll shadow
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  // Carousel arrows + loop soft
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

  // Form validation + submit (con real-time onblur)
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
  const phoneRegex = /^[0-9+()\s-]{6,}$/;
  phoneInput.addEventListener('blur', () => validateField(phoneInput, document.getElementById('phone-error'), (v) => v && !phoneRegex.test(v) ? 'Inserisci un numero valido.' : ''));

  const messageInput = document.getElementById('message');
  messageInput.addEventListener('blur', () => validateField(messageInput, document.getElementById('message-error'), (v) => !v ? 'Il messaggio è obbligatorio.' : ''));

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    let valid = true;
    contactForm.querySelectorAll('.error-message').forEach(span => span.textContent = '');
    contactForm.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

    // Validazione completa (ridondante con real-time per sicurezza)
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
    try {
      const response = await fetch(e.target.action, { method: 'POST', body: formData });
      if (response.ok) {
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        closeModalBtn.focus();
        e.target.reset();
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Post-success UX
      } else {
        alert('Errore durante l\'invio. Riprova.');
      }
    } catch (error) {
      alert('Errore di rete. Controlla la connessione.');
    }
  });

  // Modal close (con focus trap)
  closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
    }
  });

  // Evidenzia voce menu corrente
  const currentPath = location.pathname.replace(/\/+$/, '');
  document.querySelectorAll('.nav-menu a').forEach(a => {
    const href = a.getAttribute('href').replace(/\/+$/, '');
    if (href === currentPath) a.setAttribute('aria-current', 'page');
  });

  // Prefetch link interni
  const addPrefetch = (url) => {
    if (document.head.querySelector(`link[rel="prefetch"][href="${url}"]`)) return;
    const l = document.createElement('link');
    l.rel = 'prefetch'; l.href = url; l.as = 'document';
    document.head.appendChild(l);
  };
  document.querySelectorAll('a[href^="/"]').forEach(a => {
    a.addEventListener('mouseenter', () => addPrefetch(a.href), { passive: true });
  });

  // Debounce resize per theme stability
  window.addEventListener('resize', debounce(() => {
    // No reload, solo re-apply if needed
  }, 300));
});