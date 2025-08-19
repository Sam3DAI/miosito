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
      mobileMenu.removeAttribute('hidden'); // mostra il menu (transizione CSS già presente)
      document.documentElement.style.overflow = 'hidden'; // blocca lo scroll pagina
    } else {
      document.documentElement.style.overflow = ''; // sblocca lo scroll
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

  // Funzione per background Babylon (sync con tema)
  let babylonScene = null; // Ref per scena Babylon
  function updateModelBackground() {
    if (!babylonScene) return;
    const isDark = body.classList.contains('dark-mode');
    babylonScene.clearColor = isDark ? new BABYLON.Color4(0, 0, 0, 1) : new BABYLON.Color4(250/255, 250/255, 250/255, 1);
  }

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    body.classList.toggle('dark-mode', isDark);
    if (themeToggle) themeToggle.setAttribute('aria-pressed', String(isDark));
    if (sunIcon && moonIcon) {
      sunIcon.style.display = isDark ? 'none' : 'block';
      moonIcon.style.display = isDark ? 'block' : 'none';
    }
    updateChartTheme();
    updateModelBackground();
  }

  // Inizializza tema
  applyTheme(currentTheme());

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, newTheme);
      applyTheme(newTheme);
    });
  }

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
      if (href.includes('#')) return;
      if (!href.startsWith('/')) return;
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
      series: [{ data: [82, 94, 66, 40] }],
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
      if (window.SolvexChatbot && typeof window.SolvexChatbot.open === 'function') {
        window.SolvexChatbot.open();
        return;
      }
      window.dispatchEvent(new CustomEvent('solvex:chatbot:open'));
      const launcher = document.querySelector(
        '[data-chatbot-launcher], .chatbot-launcher, #chatbot-launcher, [aria-label="Apri chatbot"], [aria-label="Open chat"]'
      );
      if (launcher) launcher.click();
      const widget = document.querySelector('.chatbot-widget, #chatbot, #root .chatbot-widget');
      if (widget) widget.style.display = 'block';
    }
    btn.addEventListener('click', openChatbot);
  })();

  /* ---------------------------------
   * Codice Babylon.js per configuratore 3D (sostituisce Sketchfab)
   * --------------------------------- */
  if (document.getElementById('renderCanvas')) {
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true, { antialias: true, adaptToDeviceRatio: true, forceSRGBBufferSupportState: false });

    function createScene() {
      const scene = new BABYLON.Scene(engine);
      // Background sync con theme (parse var CSS per match perfetto)
      function updateBackground() {
        const isDark = body.classList.contains('dark-mode');
        const bgVar = isDark ? '--frame-color' : '--background-color';
        const bgColor = getComputedStyle(body).getPropertyValue(bgVar).trim();
        const rgb = bgColor.match(/\d+/g).map(n => parseInt(n) / 255);
        scene.clearColor = new BABYLON.Color4(rgb[0], rgb[1], rgb[2], 1);
      }
      updateBackground();
      themeToggle.addEventListener('click', updateBackground);

      // Luci soft/multi
      const hemiLight = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
      hemiLight.intensity = 0.4;
      const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, -1), scene);
      dirLight.position = new BABYLON.Vector3(5, 10, 5);
      dirLight.intensity = 0.5;

      const pointLight = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(-3, 2, 0), scene);
      pointLight.intensity = 0.3;

      const shadowGenerator = new BABYLON.ShadowGenerator(512, dirLight);
      shadowGenerator.filter = BABYLON.ShadowGenerator.FILTER_PCF;
      shadowGenerator.blurKernel = 32;

      const camera = new BABYLON.ArcRotateCamera("camera", Math.PI, Math.PI / 2, 1.2, BABYLON.Vector3.Zero(), scene);
      camera.attachControl(canvas, true, false, true); // Prevent wheel scroll
      camera.lowerRadiusLimit = 0.01;
      camera.upperRadiusLimit = 10;
      camera.wheelPrecision = 150;
      camera.minZ = 0.01;

      let autoRotateTimer = null;
      let isRotating = true;
      scene.beforeRender = function () {
        if (isRotating) {
          camera.alpha += 0.003;
        }
      };
      canvas.addEventListener('pointerdown', () => {
        isRotating = false;
        clearTimeout(autoRotateTimer);
        autoRotateTimer = setTimeout(() => isRotating = true, 3000);
      });

      const envTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("https://assets.babylonjs.com/environments/studio.env", scene);
      scene.environmentTexture = envTexture;
      scene.environmentIntensity = 0.6;

      // Optimize for mobile (detect + low quality)
      const isMobile = /Android|iPhone/i.test(navigator.userAgent);
      const pipeline = new BABYLON.DefaultRenderingPipeline("default", true, scene, [camera]);
      pipeline.bloomEnabled = !isMobile;
      pipeline.bloomThreshold = 0.8;
      pipeline.bloomWeight = 0.3;
      pipeline.sharpenEnabled = true;
      pipeline.sharpen.edgeAmount = 0.5;
      pipeline.samples = isMobile ? 4 : 16;
      pipeline.fxaaEnabled = true;

      return scene;
    }

    const scene = createScene();

    console.log('Inizio caricamento GLB...');
    BABYLON.SceneLoader.ImportMesh("", "./", "iphone_16_pro_configuratore_3d.glb", scene, function (meshes) {
      console.log('SUCCESSO: GLB caricato! Mesh totali:', meshes.length);
      console.log('Mesh dettagli:', meshes.map(m => m.name));

      const model = meshes[0];
      model.position = BABYLON.Vector3.Zero();
      model.scaling = new BABYLON.Vector3(-1, 1, 1);

      model.receiveShadows = true;

      const allMaterials = scene.materials;
      console.log('Materiali trovati:', allMaterials.map(m => m.name));
      const scoccaMaterials = allMaterials.filter(m => /scocca|retro|pulsanti|box|bordi|dettagli/i.test(m.name)).map(m => m.name);
      const schermoMaterial = allMaterials.find(m => /schermo|screen/i.test(m.name))?.name;
      const airpodsNode = scene.getNodeByName('Airpods') || scene.getNodeByName('airpods') || scene.getNodeByName('Cuffie') || scene.getNodeByName('cuffie') || scene.getTransformNodeByName('Airpods');

      console.log('Scocca:', scoccaMaterials);
      console.log('Schermo:', schermoMaterial);
      console.log('Airpods nodo:', airpodsNode ? airpodsNode.name : 'Non trovato');

      const textures = {
        color: {
          bianco: 'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068874/bianco_sdebye.png?quality=auto&format=auto',
          grigio: 'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068859/grigio_iutpvj.png?quality=auto&format=auto',
          bronzo: 'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068893/bronzo_g23m36.png?quality=auto&format=auto',
          nero: 'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068910/nero_whga1l.png?quality=auto&format=auto'
        },
        background: {
          'sfondo-nero-bronzo': 'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981260/sfondo_iphone_viola_e_nero_qhggk6.webp?quality=auto&format=auto',
          'sfondo-arancio-nero': 'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981229/sfondo_iphone_nero_e_rosso_yzpl6h.webp?quality=auto&format=auto',
          'sfondo-nero-blu': 'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981196/sfondo_iphone_nero_e_bronzo_cmmt3h.webp?quality=auto&format=auto',
          'sfondo-nero-viola': 'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981244/sfondo_iphone_nero_e_blue_h6rgcb.webp?quality=auto&format=auto'
        }
      };

      function setTexture(materialNames, textureUrl) {
        materialNames.forEach(name => {
          const mat = scene.getMaterialByName(name);
          if (mat) {
            mat.albedoTexture = new BABYLON.Texture(textureUrl, scene);
            console.log(`Texture applicata a ${name}: ${textureUrl}`);
          } else {
            console.log(`Materiale non trovato: ${name}`);
          }
        });
      }

      document.querySelectorAll('.color-options input').forEach(input => {
        input.addEventListener('change', () => {
          const url = textures.color[input.id];
          if (url) setTexture(scoccaMaterials, url);
        });
      });

      document.querySelectorAll('.background-options input').forEach(input => {
        input.addEventListener('change', () => {
          const url = textures.background[input.id];
          if (url && schermoMaterial) setTexture([schermoMaterial], url);
        });
      });

      const toggle = document.getElementById('toggle-airpods');
      if (airpodsNode && toggle) {
        airpodsNode.setEnabled(false);
        toggle.addEventListener('change', () => {
          airpodsNode.setEnabled(toggle.checked);
          console.log(`Airpods: ${toggle.checked ? 'Visibili' : 'Nascoste'}`);
        });
      } else {
        console.log('Airpods non trovato – verifica nome livello in Rhino');
      }

      // AR sincronizzato
      const arButton = document.getElementById('ar-button');
      if (arButton) {
        arButton.addEventListener('click', async () => {
          try {
            const xr = await scene.createDefaultXRExperienceAsync({
              uiOptions: { sessionMode: 'immersive-ar' },
              optionalFeatures: true
            });
            console.log('AR avviato – menu sincronizzato!');
          } catch (error) {
            console.error('AR errore:', error);
            alert('AR non disponibile – verifica permission camera/motion o device support. Prova refresh.');
          }
        });
      }

    }, function (progress) {
      if (progress.total > 0) {
        console.log('Progresso: ', Math.round(progress.loaded / progress.total * 100) + '%');
      }
    }, function (error) {
      console.error('ERRORE CARICAMENTO:', error.message);
    });

    engine.runRenderLoop(() => scene.render());
    window.addEventListener('resize', () => engine.resize());
  }
});