// chatbot-ai-intelligenti.js — build safe (rev. Sam 2025-09-13)
// - Menu mobile (ARIA + scroll lock)
// - Tema dark/light con sync grafico
// - Evidenzia voce menu corrente
// - Carousel con frecce + loop + Dots (card centrata)
// - Loghi a scorrimento infinito (marquee) come pagina allegata
// - Lazy background, prefetch link interni
// - ApexCharts mount theme-aware
// - CTA per aprire il widget chatbot
// - Tracciamento piano selezionato per il mini-form

document.addEventListener('DOMContentLoaded', () => {
  const hamburger   = document.querySelector('.hamburger');
  const mobileMenu  = document.getElementById('mobile-menu');
  const menuLinks   = mobileMenu ? mobileMenu.querySelectorAll('a') : [];
  const themeToggle = document.querySelector('.theme-toggle');
  const body        = document.body;
  const header      = document.querySelector('header');
  const sunIcon     = document.querySelector('.theme-icon.sun');
  const moonIcon    = document.querySelector('.theme-icon.moon');

  const debounce = (fn, delay) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); }; };

  /* ===== Menu mobile (aria + scroll lock) ===== */
  function setMobileState(open){
    if (!hamburger || !mobileMenu) return;
    hamburger.classList.toggle('active', open);
    mobileMenu.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    if (open) { mobileMenu.removeAttribute('hidden'); document.documentElement.style.overflow='hidden'; }
    else { document.documentElement.style.overflow=''; setTimeout(()=>mobileMenu.setAttribute('hidden',''), 300); }
  }
  function toggleMenu(){ setMobileState(!hamburger?.classList.contains('active')); }

  hamburger?.addEventListener('click', toggleMenu);
  hamburger?.addEventListener('keydown', (e)=>{ if (e.key==='Enter'||e.key===' ') { e.preventDefault(); toggleMenu(); }});
  menuLinks.forEach(l => l.addEventListener('click', ()=> setMobileState(false)));

  /* ===== Tema (OS pref + override utente) ===== */
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  function applyTheme(mode){
    const isDark = mode === 'dark';
    body.classList.toggle('dark-mode', isDark);
    themeToggle?.setAttribute('aria-pressed', String(isDark));
    if (sunIcon && moonIcon){ sunIcon.style.display = isDark ? 'none' : 'block'; moonIcon.style.display = isDark ? 'block' : 'none'; }
    if (window.statsChart && window.getChartOptions){ window.statsChart.updateOptions(window.getChartOptions()); }
  }
  const savedTheme = localStorage.getItem('theme'); // 'light' | 'dark' | null
  applyTheme(savedTheme ?? (prefersDark.matches ? 'dark' : 'light'));
  prefersDark.addEventListener('change', (e)=>{ if (!localStorage.getItem('theme')) applyTheme(e.matches ? 'dark' : 'light'); });
  themeToggle?.addEventListener('click', ()=>{
    const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  });

  /* ===== Header scroll effect ===== */
  window.addEventListener('scroll', ()=>{ header?.classList.toggle('scrolled', window.scrollY > 50); }, { passive:true });

  /* ===== Evidenzia voce di menu corrente ===== */
  (function markCurrentNav(){
    const norm = p => (p || '/').replace(/\/+$/, '') || '/';
    const here = norm(location.pathname);
    document.querySelectorAll('nav a, #mobile-menu a').forEach(a=>{
      const href = norm(a.getAttribute('href'));
      if (href === here) a.setAttribute('aria-current','page');
    });
  })();

  /* ===== Carousel: frecce + loop infinito ===== */
  document.querySelectorAll('.carousel-container').forEach(container => {
    const wrapper = container.querySelector('.carousel-wrapper');
    const left = container.querySelector('.carousel-arrow.left');
    const right = container.querySelector('.carousel-arrow.right');
    if (!wrapper || !left || !right) return;

    const step = () => Math.max(300, Math.round(wrapper.clientWidth * 0.65));

    left.addEventListener('click', () => {
      wrapper.scrollBy({ left: -step(), behavior: 'smooth' });
      setTimeout(() => {
        if (wrapper.scrollLeft <= 0) {
          wrapper.scrollTo({ left: wrapper.scrollWidth - wrapper.clientWidth - 1, behavior: 'smooth' });
        }
      }, 250);
    });

    right.addEventListener('click', () => {
      wrapper.scrollBy({ left: step(), behavior: 'smooth' });
      setTimeout(() => {
        if (wrapper.scrollLeft + wrapper.clientWidth >= wrapper.scrollWidth - 1) {
          wrapper.scrollTo({ left: 0, behavior: 'smooth' });
        }
      }, 250);
    });
  });

  /* ===== Dots: 1 dot per card + attivo = card più centrata ===== */
  (function initExactDots(){
    const containers = document.querySelectorAll('.carousel-container');
    if (!containers.length) return;

    containers.forEach(container => {
      const wrapper = container.querySelector('.carousel-wrapper');
      if (!wrapper) return;

      // Trova/crea contenitore dots subito dopo il wrapper
      let dotsWrap = container.querySelector('.carousel-dots');
      if (!dotsWrap) {
        dotsWrap = document.createElement('div');
        dotsWrap.className = 'carousel-dots';
        wrapper.after(dotsWrap);
      } else {
        dotsWrap.innerHTML = '';
      }

      const cards = Array.from(wrapper.querySelectorAll('.benefit-card'));
      if (!cards.length) return;

      // Centro la card i-esima nel wrapper
      function centerCard(i){
        const card = cards[i];
        if (!card) return;
        const targetCenter = card.offsetLeft + (card.offsetWidth / 2);
        const left = targetCenter - (wrapper.clientWidth / 2);
        wrapper.scrollTo({ left, behavior: 'smooth' });
      }

      // Crea dots (compatibili con CSS aggiornato e pagina allegata)
      const dots = cards.map((_, index) => {
        const b = document.createElement('button');
        b.className = 'dot carousel-dot'; // "dot" (allegata) + "carousel-dot" (CSS attuale)
        b.type = 'button';
        b.setAttribute('aria-label', `Vai alla card ${index+1}`);
        if (index === 0){
          b.setAttribute('aria-current','true');
          b.setAttribute('aria-selected','true');
        } else {
          b.setAttribute('aria-selected','false');
        }
        b.addEventListener('click', () => {
          centerCard(index);
          setActive(index);
        });
        dotsWrap.appendChild(b);
        return b;
      });

      function setActive(i){
        dots.forEach((d, j) => {
          const on = i === j;
          if (on) d.setAttribute('aria-current','true'); else d.removeAttribute('aria-current');
          d.setAttribute('aria-selected', on ? 'true' : 'false');
        });
      }

      function updateActiveFromScroll(){
        const center = wrapper.scrollLeft + wrapper.clientWidth / 2;
        let bestIdx = 0, bestDist = Infinity;
        cards.forEach((card, i) => {
          const cardCenter = card.offsetLeft + card.offsetWidth / 2;
          const dist = Math.abs(cardCenter - center);
          if (dist < bestDist) { bestDist = dist; bestIdx = i; }
        });
        setActive(bestIdx);
      }

      // init + listeners
      updateActiveFromScroll();
      wrapper.addEventListener('scroll', debounce(updateActiveFromScroll, 120), { passive: true });
      window.addEventListener('resize', debounce(() => {
        const current = dots.find(d => d.getAttribute('aria-current') === 'true') || dots[0];
        const idx = Math.max(0, dots.indexOf(current));
        centerCard(idx);
        updateActiveFromScroll();
      }, 180), { passive: true });
    });
  })();

  /* ===== Loghi a scorrimento infinito (marquee, senza scatti) ===== */
  (function infiniteLogos(){
    const carousels = document.querySelectorAll('.logos-carousel');
    if (!carousels.length) return;

    // Keyframes a runtime (se non già presenti)
    const STYLE_ID = 'logos-marquee-style';
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        @keyframes logos-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `;
      document.head.appendChild(style);
    }

    carousels.forEach(carousel => {
      const track = carousel.querySelector('.logos-track');
      if (!track) return;

      // Salva contenuto originale
      const originalNodes = Array.from(track.children).map(n => n.cloneNode(true));

      function rebuild(){
        // reset
        track.style.animation = 'none';
        track.innerHTML = '';
        originalNodes.forEach(n => track.appendChild(n.cloneNode(true)));

        // Duplica finché raggiunge almeno 2x il contenitore: loop perfetto
        const containerWidth = carousel.clientWidth || window.innerWidth;
        let w = track.scrollWidth;
        while (w < containerWidth * 2) {
          originalNodes.forEach(n => track.appendChild(n.cloneNode(true)));
          w = track.scrollWidth;
        }

        // Durata proporzionale alla larghezza totale => velocità costante
        const PX_PER_SEC = 50; // velocità (px/s) — regolabile
        const duration = w / PX_PER_SEC;
        track.style.animation = `logos-marquee ${duration}s linear infinite`;
      }

      rebuild();

      // Hover: pausa/riprendi (UX)
      track.addEventListener('mouseenter', () => { track.style.animationPlayState = 'paused'; });
      track.addEventListener('mouseleave', () => { track.style.animationPlayState = 'running'; });

      // Rebuild on resize (debounce)
      window.addEventListener('resize', debounce(rebuild, 200), { passive: true });
    });
  })(); // Logica derivata e riadattata dalla pagina allegata. :contentReference[oaicite:2]{index=2}

  /* ===== Lazy-load background per card non-LCP ===== */
  (function lazyBackgrounds(){
    const cards = document.querySelectorAll('.benefit-card[data-bg]');
    if (!cards.length || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries,o)=>{
      entries.forEach(entry=>{
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const url = el.getAttribute('data-bg');
        if (url){ el.style.backgroundImage = `url('${url}')`; el.removeAttribute('data-bg'); }
        o.unobserve(el);
      });
    }, { threshold:0.1, rootMargin:'200px' });
    cards.forEach(el=> io.observe(el));
  })();

  /* ===== Prefetch link interni ===== */
  (function prefetchInternal(){
    const added = new Set();
    function addPrefetch(href){
      if (!href || added.has(href)) return;
      if (href.includes('#')) return;
      if (!href.startsWith('/')) return;
      const l = document.createElement('link'); l.rel='prefetch'; l.href=href; document.head.appendChild(l);
      added.add(href);
    }
    document.querySelectorAll('a[href^="/"]').forEach(a=>{
      const href = a.getAttribute('href');
      a.addEventListener('mouseenter', ()=> addPrefetch(href), { passive:true });
      a.addEventListener('touchstart', ()=> addPrefetch(href), { passive:true });
    });
  })();

  /* ===== ApexCharts (theme-aware) ===== */
  window.getChartOptions = () => {
  const isDark = document.body.classList.contains('dark-mode');
  const axisColor = isDark ? '#a1a1a6' : '#6e6e73';

  // Etichette "sorgente" complete (senza newline)
  const rawCats = [
    'Riduzione Tempi Risposta',
    'Riduzione Costi',
    'Automazione Processi',
    'Soddisfazione Clienti'
  ];

  // Mappa -> come vuoi che compaiano (con a capo forzato)
  const labelMap = {
    'Riduzione Tempi Risposta': 'Riduzione\nTempi Risposta',
    'Riduzione Costi': 'Riduzione\nCosti',
    'Automazione Processi': 'Automazione\nProcessi',
    'Soddisfazione Clienti': 'Soddisfazione\nClienti'
  };

  return {
    chart: {
      type: 'bar',
      height: 350,
      animations: { enabled: true },
      toolbar: { show: false },
      parentHeightOffset: 0
    },
    legend: { show: false },

    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '78%',
        distributed: true,
        dataLabels: { position: 'center' }
      }
    },

    // Valori dentro le barre, con + e %
    dataLabels: {
      enabled: true,
      formatter: (val) => `+${val}%`,
      style: { fontSize: '18px', fontWeight: 800, colors: ['#ffffff'] },
      dropShadow: { enabled: true, blur: 3, opacity: 0.6 }
    },

    series: [{ data: [80, 40, 78, 35] }],

    // Le categorie restano su X (anche se il grafico è orizzontale)
    xaxis: {
      categories: rawCats,
      labels: { show: false },      // niente numeri sull'asse
      axisBorder: { show: false },
      axisTicks:  { show: false }
    },

    // Qui forziamo l'andata a capo e disattiviamo il trim
    yaxis: {
      labels: {
        formatter: (val) => labelMap[val] || val, // restituisce stringhe con \n
        style: { colors: axisColor, fontSize: '14px' },
        maxWidth: 320,   // spazio sufficiente per 2 righe
        offsetX: -6,     // allinea un filo a sinistra
        trim: false      // non troncare con "…"
      },
      axisBorder: { show: false },
      axisTicks:  { show: false }
    },

    colors: ['#45b6fe', '#6a9bfe', '#8f80fe', '#d95bc5'],
    grid: { show: false },
    tooltip: { enabled: false }
  };
};

  (function mountChart(){
    const target = document.getElementById('stats-chart');
    if (!target || typeof ApexCharts === 'undefined') return;
    const obs = new IntersectionObserver((entries,o)=>{
      entries.forEach(entry=>{
        if (!entry.isIntersecting) return;
        window.statsChart = new ApexCharts(target, window.getChartOptions());
        window.statsChart.render();
        o.unobserve(entry.target);
      });
    }, { threshold:0.1 });
    obs.observe(target);
  })();

  /* ===== CTA: apri il widget chatbot ===== */
  function openChatWidget(){
    if (window.SolvexChatbot?.open){ window.SolvexChatbot.open(); return; }
    const anyFab = document.querySelector('#root [data-testid="chatbot-fab"], #root [data-svx-fab], #root button, #root [role="button"]');
    anyFab?.click();
  }
  document.getElementById('open-chatbot')?.addEventListener('click', openChatWidget);
  document.getElementById('open-chatbot-why')?.addEventListener('click', openChatWidget);

/* ===== Tracciamento piano selezionato + sync radio flags ===== */
(function trackPlan(){
  const planHidden = document.getElementById('mf_plan');
  const radioNodes = document.querySelectorAll('input[name="plan_flag"]');

  function setPlan(plan){
    if (planHidden) planHidden.value = plan || '';
    // seleziona il radio corrispondente (se esiste)
    radioNodes.forEach(r => { r.checked = (r.value === plan); });
  }

  // 1) Click su qualsiasi elemento con data-plan => aggiorna hidden + radio
  document.querySelectorAll('[data-plan]').forEach(el=>{
    el.addEventListener('click', ()=>{
      const plan = el.getAttribute('data-plan') || '';
      // Se vuoi che il click su "Generico" NON selezioni alcun radio, lascia così:
      if (plan && plan !== 'Generico') setPlan(plan);
      else setPlan(''); // nessuna selezione (radio tutti off)
    });
  });

  // 2) Cambio manuale del radio => aggiorna hidden
  radioNodes.forEach(r => {
    r.addEventListener('change', ()=>{
      if (r.checked) setPlan(r.value);
    });
  });

  // 3) Facoltativo: se arrivi con hash/param o hai già mf_plan valorizzato, riflette lo stato all’avvio
  // (es. se in futuro passi ?plan=Smart o precompili in altro modo)
  const init = planHidden?.value?.trim();
  if (init) setPlan(init);
})();

});
