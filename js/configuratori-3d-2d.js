// configuratori-3d-2d.js
document.addEventListener('DOMContentLoaded', () => {
  /* ---------------------------------
   * Selettori base
   * --------------------------------- */
  const body = document.body;
  const header = document.querySelector('header');
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const themeToggle = document.querySelector('.theme-toggle');
  const sunIcon = document.querySelector('.theme-icon.sun');
  const moonIcon = document.querySelector('.theme-icon.moon');

  /* ---------------------------------
   * Hardening markup: rimuovi/unwrap <grok-card> se presenti
   * --------------------------------- */
  (function unwrapGrokCard() {
    const nodes = document.querySelectorAll('grok-card');
    nodes.forEach(node => {
      const parent = node.parentNode;
      while (node.firstChild) parent.insertBefore(node.firstChild, node);
      parent.removeChild(node);
    });
  })();

  /* ---------------------------------
   * ARIA: evidenzia link corrente (desktop + mobile)
   * --------------------------------- */
  (function setAriaCurrent() {
    const norm = p => (p || '/').replace(/\/+$/, '') || '/';
    const here = norm(location.pathname);
    document.querySelectorAll('nav a, #mobile-menu a').forEach(a => {
      const href = norm(a.getAttribute('href'));
      if (href === here) a.setAttribute('aria-current', 'page');
    });
  })();

  // Menu mobile con aria + scroll lock (stile automazioni-ai-business.js)
const setMobileState = (open) => {
  hamburger.classList.toggle('active', open);
  mobileMenu.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', String(open));

  if (open) {
    mobileMenu.removeAttribute('hidden');          // mostra il menu (transizione CSS già presente)
    document.documentElement.style.overflow = 'hidden';  // blocca lo scroll pagina
  } else {
    document.documentElement.style.overflow = '';       // sblocca lo scroll
    setTimeout(() => mobileMenu.setAttribute('hidden', ''), 300); // nascondi dopo transizione
  }
};

const toggleMenu = () => setMobileState(!hamburger.classList.contains('active'));

hamburger.addEventListener('click', toggleMenu);
hamburger.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    toggleMenu();
  }
});

// Chiudi il menu quando clicchi una voce
const menuLinks = mobileMenu.querySelectorAll('a');
menuLinks.forEach(link => link.addEventListener('click', () => setMobileState(false)));


  /* ---------------------------------
   * Header shadow / stato su scroll (passive)
   * --------------------------------- */
  window.addEventListener('scroll', () => {
    header && header.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  /* ---------------------------------
   * Tema: rispetta prefers-color-scheme + override utente (aria-pressed)
   * --------------------------------- */
  const THEME_KEY = 'theme'; // 'light' | 'dark' | null (segue sistema)
  const mediaDark = window.matchMedia('(prefers-color-scheme: dark)');

  function currentTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return mediaDark.matches ? 'dark' : 'light';
  }

  // Chart ref (serve a updateChartTheme)
  let statsChart = null;

  function getAxisLabelColor() {
    return body.classList.contains('dark-mode') ? '#a1a1a6' : '#6e6e73';
  }

  function updateChartTheme() {
    if (!statsChart) return;
    statsChart.updateOptions({
      xaxis: { labels: { style: { colors: getAxisLabelColor(), fontSize: '14px' } } },
      yaxis: { labels: { style: { colors: getAxisLabelColor(), fontSize: '14px' } } }
    }, false, true);
  }

  function updateModelBackground() {
  if (window.sketchfabAPI) {
    // Valori normalizzati 0..1
    const rgb = document.body.classList.contains('dark-mode')
      ? [0, 0, 0]                    // nero per dark
      : [250/255, 250/255, 250/255]; // #FAFAFA per light

    // ✅ API corretta: array [r,g,b]
    window.sketchfabAPI.setBackground({ color: rgb });
  }
}


  function applyTheme(theme) {
    const isDark = theme === 'dark';
    body.classList.toggle('dark-mode', isDark);
    if (themeToggle) themeToggle.setAttribute('aria-pressed', String(isDark));
    if (sunIcon && moonIcon) {
      sunIcon.style.display = isDark ? 'none' : 'block';
      moonIcon.style.display = isDark ? 'block' : 'none';
    }
    updateModelBackground();
    updateChartTheme();
  }

  // Inizializza tema (nessun reload su resize)
  applyTheme(currentTheme());

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, newTheme);
      applyTheme(newTheme);
    });
  }

  // Segui i cambi del sistema solo se non esiste override
  mediaDark.addEventListener('change', (e) => {
    if (!localStorage.getItem(THEME_KEY)) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });

  /* ---------------------------------
   * Carousel: frecce + scroll infinito
   * --------------------------------- */
  const carouselContainers = document.querySelectorAll('.carousel-container');
  carouselContainers.forEach(container => {
    const wrapper = container.querySelector('.carousel-wrapper');
    const leftArrow = container.querySelector('.carousel-arrow.left');
    const rightArrow = container.querySelector('.carousel-arrow.right');
    let isScrolling = false;

    if (!wrapper || !leftArrow || !rightArrow) return;

    const scrollByAmount = 300;

    leftArrow.addEventListener('click', () => {
      if (isScrolling) return;
      isScrolling = true;
      wrapper.scrollBy({ left: -scrollByAmount, behavior: 'smooth' });
      setTimeout(() => {
        if (wrapper.scrollLeft <= 0) {
          wrapper.scrollTo({ left: wrapper.scrollWidth - wrapper.clientWidth, behavior: 'smooth' });
        }
        isScrolling = false;
      }, 300);
    });

    rightArrow.addEventListener('click', () => {
      if (isScrolling) return;
      isScrolling = true;
      wrapper.scrollBy({ left: scrollByAmount, behavior: 'smooth' });
      setTimeout(() => {
        if (wrapper.scrollLeft + wrapper.clientWidth >= wrapper.scrollWidth - 1) {
          wrapper.scrollTo({ left: 0, behavior: 'smooth' });
        }
        isScrolling = false;
      }, 300);
    });
  });

  /* ---------------------------------
   * Lazy background per card con data-bg (IntersectionObserver)
   * --------------------------------- */
  (function lazyBackgrounds() {
    const lazyCards = document.querySelectorAll('.benefit-card.lazy-bg[data-bg]');
    if (!lazyCards.length) return;
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const url = el.getAttribute('data-bg');
        if (url) {
          el.style.backgroundImage = `url('${url}')`;
          el.removeAttribute('data-bg');
        }
        o.unobserve(el);
      });
    }, { rootMargin: '200px 0px' });
    lazyCards.forEach(el => obs.observe(el));
  })();

  /* ---------------------------------
   * Prefetch dei link interni su hover/touch
   * --------------------------------- */
  (function prefetchInternalLinks() {
    const already = new Set();
    const addPrefetch = (href) => {
      if (!href || already.has(href)) return;
      if (href.includes('#')) return;               // evita anchor
      if (!href.startsWith('/')) return;            // solo same-origin
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
      already.add(href);
    };
    document.querySelectorAll('a[href^="/"]').forEach(a => {
      const href = a.getAttribute('href');
      a.addEventListener('mouseenter', () => addPrefetch(href));
      a.addEventListener('touchstart', () => addPrefetch(href), { passive: true });
    });
  })();

  /* ---------------------------------
   * Sketchfab API: caricamento sicuro + controlli configuratore 3D
   * --------------------------------- */
  (function initSketchfab() {
    const iframe = document.getElementById('api-frame');
    if (!iframe) return;

    const loadAPI = () => new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });

    loadAPI()
      .then(() => {
        const version = '1.12.1';
        const uid = 'd8d8df55647a45c0beecc1b22e6b6c79';
        const client = new Sketchfab(version, iframe);

        const textures = {
          color: {
            bianco: 'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068874/bianco_sdebye.png?quality=auto&format=auto',
            grigio: 'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068859/grigio_iutpvj.png?quality=auto&format=auto',
            bronzo: 'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068893/bronzo_g23m36.png?quality=auto&format=auto',
            nero:   'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068910/nero_whga1l.png?quality=auto&format=auto'
          },
          background: {
            'sfondo-nero-bronzo':  'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981260/sfondo_iphone_viola_e_nero_qhggk6.webp?quality=auto&format=auto',
            'sfondo-arancio-nero': 'https://res.cloudinary.com/dqhbriryo/image_upload/v1751981229/sfondo_iphone_nero_e_rosso_yzpl6h.webp?quality=auto&format=auto'.replace('_upload','/image/upload'),
            'sfondo-nero-blu':     'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981196/sfondo_iphone_nero_e_bronzo_cmmt3h.webp?quality=auto&format=auto',
            'sfondo-nero-viola':   'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981244/sfondo_iphone_nero_e_blue_h6rgcb.webp?quality=auto&format=auto'
          }
        };

        function onSuccess(api) {
          window.sketchfabAPI = api;
          api.start();

          api.addEventListener('viewerready', function () {
            // Allinea background viewer al tema
            updateModelBackground();

            // Gestione materiali / texture
            api.getMaterialList((err, materials) => {
              if (err) return console.error('Errore materiali:', err);

              const relevantMaterials = {
                scocca: ["scocca retro", "pulsanti", "box camere", "bordi laterali", "dettagli laterali e carica"],
                schermo: "schermo"
              };

              const setAlbedoTexture = (materialName, textureUrl) => {
                const mat = materials.find(m => m.name === materialName);
                if (!mat) return;
                api.addTexture(textureUrl, (err2, textureUid) => {
                  if (err2) return console.error('Errore caricamento texture:', err2);
                  mat.channels.AlbedoPBR.texture.uid = textureUid;
                  api.setMaterial(mat);
                });
              };

              const goTo = (idx) => api.gotoAnnotation(idx);

              document.querySelectorAll('.color-options input').forEach(input => {
                input.addEventListener('change', () => {
                  const url = textures.color[input.id];
                  relevantMaterials.scocca.forEach(name => setAlbedoTexture(name, url));
                  goTo(0);
                });
              });

              document.querySelectorAll('.background-options input').forEach(input => {
                input.addEventListener('change', () => {
                  const url = textures.background[input.id];
                  setAlbedoTexture(relevantMaterials.schermo, url);
                  goTo(1);
                });
              });
            });

            // Mostra/Nascondi cuffie
            api.getNodeMap((err, nodes) => {
              if (err) return console.error('Errore nodi:', err);
              const airpodsNode = Object.values(nodes).find(n => n.name === 'Airpods');
              const toggle = document.getElementById('toggle-airpods');
              if (airpodsNode && toggle) {
                const id = airpodsNode.instanceID;
                api.hide(id);
                toggle.addEventListener('change', () => {
                  if (toggle.checked) api.show(id); else api.hide(id);
                });
              }
            });
          });
        }

        function onError(err) {
          console.error('Errore Sketchfab API:', err);
        }

        client.init(uid, {
          success: onSuccess,
          error: onError,
          ui_infos: 0,
          ui_controls: 0,
          ui_stop: 0,
          ui_watermark: 0,
          ui_fullscreen: 0,
          ui_annotations: 0,
          ui_hint: 0,
          transparent: 0
        });
      })
      .catch(err => console.error('Sketchfab API non caricata:', err));
  })();

  /* ---------------------------------
   * Configuratore 2D: swap immagini
   * --------------------------------- */
  (function initConfigurator2D() {
    const img = document.getElementById('product-image-2d');
    if (!img) return;
    document.querySelectorAll('.color-options-2d input').forEach(input => {
      input.addEventListener('change', () => {
        const swatch = input.nextElementSibling;
        if (!swatch) return;
        const newSrc = swatch.getAttribute('data-image');
        const name = (input.value || '').trim();
        const newAlt = `Prodotto Configurabile 2D - ${name.charAt(0).toUpperCase() + name.slice(1)}`;
        img.style.opacity = 0;
        setTimeout(() => {
          img.src = newSrc;
          img.alt = newAlt;
          img.style.opacity = 1;
        }, 180);
      });
    });
  })();

  /* ---------------------------------
   * ApexCharts: render on view + tema dinamico
   * --------------------------------- */
  (function initChartOnView() {
    const target = document.getElementById('why-choose');
    if (!target || typeof ApexCharts === 'undefined') return;

    const options = () => ({
      chart: {
        type: 'bar',
        height: 350,
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 2000,
          animateGradually: { enabled: true, delay: 150 },
          dynamicAnimation: { enabled: true, speed: 350 }
        },
        toolbar: { show: false }
      },
      plotOptions: { bar: { horizontal: true, barHeight: '75%', distributed: true } },
      dataLabels: { enabled: false },
      series: [{ data: [82, 94, 66, 40] }], // engagement, conversioni, soddisfazione, riduzione resi
      xaxis: {
        categories: ['Engagement Utenti', 'Tasso di Conversione', 'Soddisfazione Clienti', 'Riduzione Resi'],
        labels: { formatter: v => `${v}%`, style: { colors: getAxisLabelColor(), fontSize: '14px' } },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        labels: {
          formatter: value => {
            if (value === 'Engagement Utenti') return ['Engagement', 'Utenti'];
            if (value === 'Tasso di Conversione') return ['Tasso di', 'Conversione'];
            if (value === 'Soddisfazione Clienti') return ['Soddisfazione', 'Clienti'];
            return value;
          },
          style: { colors: getAxisLabelColor(), fontSize: '14px' }
        },
        axisBorder: { show: false }, axisTicks: { show: false }
      },
      colors: ['#45b6fe', '#6a9bfe', '#8f80fe', '#d95bc5'],
      grid: { show: false },
      tooltip: { enabled: false }
    });

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !statsChart) {
          statsChart = new ApexCharts(document.querySelector('#stats-chart'), options());
          statsChart.render();
        }
      });
    }, { threshold: 0.1 });
    obs.observe(target);
  })();
  
  // Pulsante per aprire/attivare il chatbot
(function initChatbotButton() {
  const btn = document.getElementById('open-chatbot');
  if (!btn) return;

  function openChatbot() {
    // 1) API ufficiale se esiste (adatta il nome se il tuo widget espone un altro oggetto)
    if (window.SolvexChatbot && typeof window.SolvexChatbot.open === 'function') {
      window.SolvexChatbot.open();
      return;
    }

    // 2) Dispatch di un evento personalizzato che il widget può intercettare
    window.dispatchEvent(new CustomEvent('solvex:chatbot:open'));

    // 3) Fallback: clicca il "launcher" se presente nel DOM
    const launcher = document.querySelector(
      '[data-chatbot-launcher], .chatbot-launcher, #chatbot-launcher, [aria-label="Apri chatbot"], [aria-label="Open chat"]'
    );
    if (launcher) launcher.click();

    // 4) Ultimo fallback: prova a mostrare il widget se è solo nascosto
    const widget = document.querySelector('.chatbot-widget, #chatbot, #root .chatbot-widget');
    if (widget) widget.style.display = 'block';
  }

  btn.addEventListener('click', openChatbot);
})();


  /* ---------------------------------
   * Fine
   * --------------------------------- */
});
