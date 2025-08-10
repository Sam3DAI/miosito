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

  // Tema: rispetta preferenze OS, poi override utente
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const applyTheme = (mode) => {
    const isDark = mode === 'dark';
    body.classList.toggle('dark-mode', isDark);
    themeToggle.setAttribute('aria-pressed', String(isDark));
    sunIcon.style.display = isDark ? 'none' : 'block';
    moonIcon.style.display = isDark ? 'block' : 'none';
    if (window.statsChart && window.getChartOptions) {
      window.statsChart.updateOptions(window.getChartOptions());
    }
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

  // Header scroll effect
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
  const cards = document.querySelectorAll('.benefit-card[data-bg]');
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
  cards.forEach(el => io.observe(el));

  // Evidenzia la voce di menu corrente
  const currentPath = location.pathname.replace(/\/+$/, '');
  document.querySelectorAll('.nav-menu a').forEach(a => {
    const href = a.getAttribute('href').replace(/\/+$/, '');
    if (href === currentPath) a.setAttribute('aria-current', 'page');
  });

  // Prefetch leggero dei link interni su hover
  const addPrefetch = (url) => {
    if (document.head.querySelector(`link[rel="prefetch"][href="${url}"]`)) return;
    const l = document.createElement('link');
    l.rel = 'prefetch'; l.href = url; l.as = 'document';
    document.head.appendChild(l);
  };
  document.querySelectorAll('a[href^="/"]').forEach(a => {
    a.addEventListener('mouseenter', () => addPrefetch(a.href), { passive: true });
  });

  // ApexCharts con opzioni “theme-aware”
  window.getChartOptions = () => {
    const isDark = body.classList.contains('dark-mode');
    return {
      chart: { type: 'bar', height: 350, animations: { enabled: true }, toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, barHeight: '75%', distributed: true } },
      dataLabels: { enabled: false },
      series: [{ data: [80, 40, 75, 40] }], // 80% tempi, 40% soddisfazione, 75% automazione, 40% costi
      xaxis: {
        categories: ['Riduzione Tempi di Risposta', 'Aumento Soddisfazione Clienti', 'Automatizzazione Processi', 'Riduzione Costi Operativi'],
        labels: { formatter: (v) => v + '%', style: { colors: isDark ? '#a1a1a6' : '#6e6e73', fontSize: '14px' } },
        axisBorder: { show: false }, axisTicks: { show: false }
      },
      yaxis: {
        labels: {
          formatter: (val) => {
            if (val === 'Riduzione Tempi di Risposta') return ['Riduzione Tempi', 'di Risposta'];
            if (val === 'Aumento Soddisfazione Clienti') return ['Aumento', 'Soddisfazione Clienti'];
            if (val === 'Automatizzazione Processi') return ['Automatizzazione', 'Processi'];
            if (val === 'Riduzione Costi Operativi') return ['Riduzione Costi', 'Operativi'];
            return val;
          },
          style: { colors: isDark ? '#a1a1a6' : '#6e6e73', fontSize: '14px' }
        },
        axisBorder: { show: false }, axisTicks: { show: false }
      },
      colors: ['#45b6fe', '#6a9bfe', '#8f80fe', '#d95bc5'],
      grid: { show: false }, tooltip: { enabled: false }
    };
  };

  const target = document.getElementById('why-choose');
  let chart = null;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (chart) chart.destroy();
        chart = new ApexCharts(document.querySelector("#stats-chart"), window.getChartOptions());
        chart.render();
        window.statsChart = chart; // esporto per update tema
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  if (target) obs.observe(target);
});
