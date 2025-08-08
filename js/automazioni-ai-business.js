document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuLinks = mobileMenu.querySelectorAll('a');
  const themeToggle = document.querySelector('.theme-toggle');
  const body = document.body;
  const header = document.querySelector('header');
  const sunIcon = document.querySelector('.theme-icon.sun');
  const moonIcon = document.querySelector('.theme-icon.moon');

  // Utility
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

  // Carousels (multipli)
  document.querySelectorAll('.carousel-container').forEach(container => {
    const wrapper = container.querySelector('.carousel-wrapper');
    const left = container.querySelector('.carousel-arrow.left');
    const right = container.querySelector('.carousel-arrow.right');

    left.addEventListener('click', () => {
      wrapper.scrollBy({ left: -300, behavior: 'smooth' });
      if (wrapper.scrollLeft <= 0) {
        wrapper.scrollTo({ left: wrapper.scrollWidth - wrapper.clientWidth, behavior: 'smooth' });
      }
    });
    right.addEventListener('click', () => {
      wrapper.scrollBy({ left: 300, behavior: 'smooth' });
      if (wrapper.scrollLeft + wrapper.clientWidth >= wrapper.scrollWidth - 1) {
        wrapper.scrollTo({ left: 0, behavior: 'smooth' });
      }
    });
    wrapper.addEventListener('scroll', debounce(() => {}, 200), { passive: true });
  });

  // Lazy-load dei background per le card non LCP
  const lazyCards = document.querySelectorAll('.service-card[data-bg]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const url = el.getAttribute('data-bg');
        if (url) {
          el.style.backgroundImage = `url('${url}')`;
          el.removeAttribute('data-bg');
        }
        io.unobserve(el);
      }
    });
  }, { threshold: 0.1 });
  lazyCards.forEach(el => io.observe(el));

  // Evidenzia la voce di menu corrente
  const currentPath = location.pathname.replace(/\/+$/, '');
  document.querySelectorAll('.nav-menu a').forEach(a => {
    const href = a.getAttribute('href').replace(/\/+$/, '');
    if (href === currentPath) a.setAttribute('aria-current', 'page');
  });

  // Prefetch dei link interni su hover (percezione velocità)
  const addPrefetch = (url) => {
    if (document.head.querySelector(`link[rel="prefetch"][href="${url}"]`)) return;
    const l = document.createElement('link');
    l.rel = 'prefetch'; l.href = url; l.as = 'document';
    document.head.appendChild(l);
  };
  document.querySelectorAll('a[href^="/"]').forEach(a => {
    a.addEventListener('mouseenter', () => addPrefetch(a.href), { passive: true });
  });

  // ApexCharts rendering “on-view”
  const whyChooseSection = document.getElementById('why-choose');
  let statsChart = null;
  const barChartOptions = {
    chart: { type: 'bar', height: 350, animations: { enabled: true }, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, barHeight: '75%', distributed: true } },
    dataLabels: { enabled: false },
    series: [{ data: [66, 70, 60, 45] }],
    xaxis: {
      categories: ['Efficienza Operativa', 'Precisione dei Dati', 'Risparmio di Tempo', 'Soddisfazione Clienti'],
      labels: { formatter: (val) => val + '%', style: { colors: '#6e6e73', fontSize: '14px' } },
      axisBorder: { show: false }, axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        formatter: (value) => {
          if (value === 'Efficienza Operativa') return ['Efficienza', 'Operativa'];
          if (value === 'Precisione dei Dati') return ['Precisione', 'dei Dati'];
          if (value === 'Risparmio di Tempo') return ['Risparmio', 'di Tempo'];
          if (value === 'Soddisfazione Clienti') return ['Soddisfazione', 'Clienti'];
          return value;
        },
        style: { colors: '#6e6e73', fontSize: '14px' }
      },
      axisBorder: { show: false }, axisTicks: { show: false }
    },
    colors: ['#45b6fe', '#6a9bfe', '#8f80fe', '#d95bc5'],
    grid: { show: false }, tooltip: { enabled: false }
  };
  const ob = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (statsChart) statsChart.destroy();
        statsChart = new ApexCharts(document.querySelector("#stats-chart"), barChartOptions);
        statsChart.render();
        ob.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  if (whyChooseSection) ob.observe(whyChooseSection);
});
