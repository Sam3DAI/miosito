document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuLinks = mobileMenu.querySelectorAll('a');
  const themeToggle = document.querySelector('.theme-toggle');
  const body = document.body;
  const header = document.querySelector('header');
  const sunIcon = document.querySelector('.theme-icon.sun');
  const moonIcon = document.querySelector('.theme-icon.moon');

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