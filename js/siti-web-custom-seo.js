document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuLinks = mobileMenu.querySelectorAll('a');
  const themeToggle = document.querySelector('.theme-toggle');
  const body = document.body;
  const header = document.querySelector('header');
  const sunIcon = document.querySelector('.theme-icon.sun');
  const moonIcon = document.querySelector('.theme-icon.moon');
  const carouselWrapper = document.querySelector('.carousel-wrapper');
  const leftArrow = document.querySelector('.carousel-arrow.left');
  const rightArrow = document.querySelector('.carousel-arrow.right');

  // Utils
  const debounce = (func, delay) => {
    let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func(...args), delay); };
  };

  // Mobile menu (con aria, scroll lock e reflow per animazione)
  const setMobileState = (open) => {
    hamburger.classList.toggle('active', open);
    mobileMenu.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    if (open) {
      mobileMenu.removeAttribute('hidden');
      void mobileMenu.offsetHeight; // Forza reflow per triggerare transition CSS
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      setTimeout(() => mobileMenu.setAttribute('hidden', ''), 300); // Timeout per animazione chiusura
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

  // Carousel arrows + loop soft
  leftArrow.addEventListener('click', () => {
    carouselWrapper.scrollBy({ left: -300, behavior: 'smooth' });
    if (carouselWrapper.scrollLeft <= 0) {
      carouselWrapper.scrollTo({ left: carouselWrapper.scrollWidth - carouselWrapper.clientWidth, behavior: 'smooth' });
    }
  });
  rightArrow.addEventListener('click', () => {
    carouselWrapper.scrollBy({ left: 300, behavior: 'smooth' });
    if (carouselWrapper.scrollLeft + carouselWrapper.clientWidth >= carouselWrapper.scrollWidth - 1) {
      carouselWrapper.scrollTo({ left: 0, behavior: 'smooth' });
    }
  });
  carouselWrapper.addEventListener('scroll', debounce(() => {}, 200), { passive: true });

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

  // Fullscreen Modal
  const fullscreenBtn = document.querySelector('.fullscreen-btn');
  const closeBtn = document.querySelector('.close-btn');
  const modal = document.getElementById('fullscreen-modal');

  fullscreenBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
  });

  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });
});