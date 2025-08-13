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
    let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func(...args), delay); };
  };

  // Mobile menu (con aria e scroll lock)
  const setMobileState = (open) => {
    hamburger.classList.toggle('active', open);
    mobileMenu.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    if (open) {
      mobileMenu.removeAttribute('hidden');
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      // Manteniamo l'elemento in DOM per l'animazione ma lo nascondiamo ai reader
      setTimeout(() => mobileMenu.setAttribute('hidden', ''), 300);
    }
  };
  const toggleMenu = () => setMobileState(!hamburger.classList.contains('active'));

  hamburger.addEventListener('click', toggleMenu);
  hamburger.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') toggleMenu(); });
  menuLinks.forEach(link => link.addEventListener('click', () => setMobileState(false)));

  // Tema: rispetta OS, poi override utente
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

  // Header scroll shadow
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  // Carousel arrows + loop soft (adapted for testimonials)
  leftArrow.addEventListener('click', () => {
    testimonialsCarousel.scrollBy({ left: -300, behavior: 'smooth' });
    if (testimonialsCarousel.scrollLeft <= 0) {
      testimonialsCarousel.scrollTo({ left: testimonialsCarousel.scrollWidth - testimonialsCarousel.clientWidth, behavior: 'smooth' });
    }
  });
  rightArrow.addEventListener('click', () => {
    testimonialsCarousel.scrollBy({ left: 300, behavior: 'smooth' });
    if (testimonialsCarousel.scrollLeft + testimonialsCarousel.clientWidth >= testimonialsCarousel.scrollWidth - 1) {
      testimonialsCarousel.scrollTo({ left: 0, behavior: 'smooth' });
    }
  });
  testimonialsCarousel.addEventListener('scroll', debounce(() => {}, 200), { passive: true });

  // Form validation + submit
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent bubbling
    let valid = true;
    e.target.querySelectorAll('.error-message').forEach(span => span.textContent = '');
    e.target.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    // Name
    const name = document.getElementById('name');
    if (!name.value.trim()) {
      document.getElementById('name-error').textContent = 'Il nome è obbligatorio.';
      name.classList.add('error');
      valid = false;
    }
    // Email
    const email = document.getElementById('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.value.trim() || !emailRegex.test(email.value)) {
      document.getElementById('email-error').textContent = 'Inserisci una email valida.';
      email.classList.add('error');
      valid = false;
    }
    // Phone (optional but validate if filled)
    const phone = document.getElementById('phone');
    const phoneRegex = /^[0-9+()\s-]{6,}$/;
    if (phone.value.trim() && !phoneRegex.test(phone.value)) {
      document.getElementById('phone-error').textContent = 'Inserisci un numero valido.';
      phone.classList.add('error');
      valid = false;
    }
    // Services
    const servicesChecked = e.target.querySelectorAll('input[name="services[]"]:checked').length;
    if (servicesChecked === 0) {
      document.getElementById('services-error').textContent = 'Seleziona almeno un servizio.';
      valid = false;
    }
    // Message
    const message = document.getElementById('message');
    if (!message.value.trim()) {
      document.getElementById('message-error').textContent = 'Il messaggio è obbligatorio.';
      message.classList.add('error');
      valid = false;
    }
    // Privacy
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
      } else {
        alert('Errore durante l\'invio. Riprova.');
      }
    } catch (error) {
      alert('Errore di rete. Controlla la connessione.');
    }
  });

  // Modal close
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

  // Evidenzia voce di menu corrente (a11y)
  const currentPath = location.pathname.replace(/\/+$/, '');
  document.querySelectorAll('.nav-menu a').forEach(a => {
    const href = a.getAttribute('href').replace(/\/+$/, '');
    if (href === currentPath) a.setAttribute('aria-current', 'page');
  });

  // Prefetch leggero dei link interni su hover (migliora percezione senza cambiare design)
  const addPrefetch = (url) => {
    if (document.head.querySelector(`link[rel="prefetch"][href="${url}"]`)) return;
    const l = document.createElement('link');
    l.rel = 'prefetch'; l.href = url; l.as = 'document';
    document.head.appendChild(l);
  };
  document.querySelectorAll('a[href^="/"]').forEach(a => {
    a.addEventListener('mouseenter', () => addPrefetch(a.href), { passive: true });
  });
});