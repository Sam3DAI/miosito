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
  const debounce = (fn, delay) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); }; };

  // Menu mobile con aria + scroll lock
  const setMobileState = (open) => {
    hamburger.classList.toggle('active', open);
    mobileMenu.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    if (open) {
      mobileMenu.removeAttribute('hidden');
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      setTimeout(() => mobileMenu.setAttribute('hidden', ''), 300);
    }
  };
  const toggleMenu = () => setMobileState(!hamburger.classList.contains('active'));
  hamburger.addEventListener('click', toggleMenu);
  hamburger.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') toggleMenu(); });
  menuLinks.forEach(link => link.addEventListener('click', () => setMobileState(false)));

  // Tema: rispetta preferenze OS, poi override utente (no reload su resize)
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const applyTheme = (mode) => {
    const isDark = mode === 'dark';
    body.classList.toggle('dark-mode', isDark);
    themeToggle.setAttribute('aria-pressed', String(isDark));
    sunIcon.style.display = isDark ? 'none' : 'block';
    moonIcon.style.display = isDark ? 'block' : 'none';
  };
  let savedTheme = localStorage.getItem('theme'); // 'light' | 'dark' | null
  applyTheme(savedTheme ?? (prefersDark.matches ? 'dark' : 'light'));
  prefersDark.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) applyTheme(e.matches ? 'dark' : 'light');
  });
  themeToggle.addEventListener('click', () => {
    const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  });

  // Header Scroll Effect
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  // Gestione Form con AJAX + validazione
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      let valid = true;

      // Pulisci errori precedenti
      contactForm.querySelectorAll('.error-message').forEach(span => { span.textContent = ''; });
      contactForm.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

      // Validazioni
      const name = document.getElementById('name');
      if (!name.value.trim()) {
        document.getElementById('name-error').textContent = 'Il nome è obbligatorio.'; name.classList.add('error'); valid = false;
      }

      const email = document.getElementById('email');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.value.trim() || !emailRegex.test(email.value)) {
        document.getElementById('email-error').textContent = 'Inserisci una email valida.'; email.classList.add('error'); valid = false;
      }

      const phone = document.getElementById('phone');
      const phoneRegex = /^[+]?[\d\s-]{9,15}$/;
      if (phone.value.trim() && !phoneRegex.test(phone.value)) {
        document.getElementById('phone-error').textContent = 'Inserisci un numero di telefono valido.'; phone.classList.add('error'); valid = false;
      }

      const servicesChecked = contactForm.querySelectorAll('input[name="services[]"]:checked').length;
      if (servicesChecked === 0) {
        document.getElementById('services-error').textContent = 'Seleziona almeno un servizio.'; valid = false;
      }

      const message = document.getElementById('message');
      if (!message.value.trim()) {
        document.getElementById('message-error').textContent = 'Il messaggio è obbligatorio.'; message.classList.add('error'); valid = false;
      }

      const privacy = document.getElementById('privacy');
      if (!privacy.checked) {
        document.getElementById('privacy-error').textContent = 'Accetta la Privacy Policy.'; privacy.classList.add('error'); valid = false;
      }

      if (!valid) return;

      // Invia via AJAX
      try {
        const response = await fetch(contactForm.action, { method: 'POST', body: new FormData(contactForm) });
        if (response.ok) {
          // Mostra modal + lock scroll
          document.documentElement.style.overflow = 'hidden';
          modal.classList.add('show');
          modal.setAttribute('aria-hidden', 'false');
          closeModalBtn?.focus();
          contactForm.reset();
        } else {
          alert('Errore durante l\'invio. Riprova più tardi.');
        }
      } catch {
        alert('Errore di connessione. Controlla la tua rete e riprova.');
      }
    });
  }

  // Chiudi Modal (sblocca scroll)
  const hideModal = () => {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
  };
  closeModalBtn?.addEventListener('click', hideModal);
  modal?.addEventListener('click', (e) => { if (e.target === modal) hideModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('show')) hideModal(); });

  // Carousel Testimonials - loop
  if (leftArrow && rightArrow && testimonialsCarousel) {
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

  // Prefetch dei link interni su hover
  const addPrefetch = (url) => {
    if (document.head.querySelector(`link[rel="prefetch"][href="${url}"]`)) return;
    const l = document.createElement('link'); l.rel = 'prefetch'; l.href = url; l.as = 'document';
    document.head.appendChild(l);
  };
  document.querySelectorAll('a[href^="/"]').forEach(a => {
    a.addEventListener('mouseenter', () => addPrefetch(a.href), { passive: true });
  });

  // Evidenzia voce di menu corrente
  const currentPath = location.pathname.replace(/\/+$/, '');
  document.querySelectorAll('.nav-menu a').forEach(a => {
    const href = a.getAttribute('href').replace(/\/+$/, '');
    if (href === currentPath) a.setAttribute('aria-current', 'page');
  });
});
