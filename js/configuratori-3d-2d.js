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

  // Menu mobile con aria + scroll lock
  const setMobileState = (open) => {
    if (!hamburger || !mobileMenu) return;
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
  if (hamburger) {
    hamburger.addEventListener('click', toggleMenu);
    hamburger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(); }
    });
  }
  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMobileState(false)));
  }

  /* ---------------------------------
   * Header shadow / stato su scroll (passive)
   * --------------------------------- */
  window.addEventListener('scroll', () => {
    if (header) header.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  /* ---------------------------------
   * Tema & chart
   * --------------------------------- */
  const THEME_KEY = 'theme';
  const mediaDark = window.matchMedia('(prefers-color-scheme: dark)');
  let statsChart = null;

  function currentTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return mediaDark.matches ? 'dark' : 'light';
  }
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

  // Ref scena per aggiornare il background
  let babylonScene = null;
  function updateModelBackground() {
    if (!babylonScene) return;
    const isDark = body.classList.contains('dark-mode');
    // Giorno esattamente #FAFAFA, Notte nero pieno
    babylonScene.clearColor = isDark
      ? BABYLON.Color4.FromHexString('#000000FF')
      : BABYLON.Color4.FromHexString('#FAFAFAFF');
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

  applyTheme(currentTheme());
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, newTheme);
      applyTheme(newTheme);
    });
  }
  mediaDark.addEventListener('change', (e) => {
    if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches ? 'dark' : 'light');
  });

  /* ---------------------------------
   * Carousel
   * --------------------------------- */
  const carouselContainers = document.querySelectorAll('.carousel-container');
  carouselContainers.forEach(container => {
    const wrapper = container.querySelector('.carousel-wrapper');
    const leftArrow = document.querySelector('.carousel-arrow.left');
    const rightArrow = document.querySelector('.carousel-arrow.right');
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
   * Lazy background
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
   * Prefetch link interni
   * --------------------------------- */
  (function prefetchInternalLinks() {
    const already = new Set();
    const addPrefetch = (href) => {
      if (!href || already.has(href)) return;
      if (href.includes('#')) return;
      if (!href.startsWith('/')) return;
      const link = document.createElement('link');
      link.rel = 'prefetch'; link.href = href;
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
   * Configuratore 2D
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
        setTimeout(() => { img.src = newSrc; img.alt = newAlt; img.style.opacity = 1; }, 180);
      });
    });
  })();

  /* ---------------------------------
   * ApexCharts
   * --------------------------------- */
  (function initChartOnView() {
    const target = document.getElementById('why-choose');
    if (!target || typeof ApexCharts === 'undefined') return;
    const options = () => ({
      chart: {
        type: 'bar',
        height: 350,
        animations: {
          enabled: true, easing: 'easeinout', speed: 2000,
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
        axisBorder: { show: false }, axisTicks: { show: false }
      },
      yaxis: {
        labels: {
          formatter: value => {
            if (value === 'Engagement Utenti') return ['Engagement','Utenti'];
            if (value === 'Tasso di Conversione') return ['Tasso di','Conversione'];
            if (value === 'Soddisfazione Clienti') return ['Soddisfazione','Clienti'];
            return value;
          },
          style: { colors: getAxisLabelColor(), fontSize: '14px' }
        },
        axisBorder: { show: false }, axisTicks: { show: false }
      },
      colors: ['#45b6fe','#6a9bfe','#8f80fe','#d95bc5'],
      grid: { show: false }, tooltip: { enabled: false }
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

  /* ---------------------------------
   * Chatbot launcher
   * --------------------------------- */
  (function initChatbotButton() {
    const btn = document.getElementById('open-chatbot');
    if (!btn) return;
    function openChatbot() {
      if (window.SolvexChatbot && typeof window.SolvexChatbot.open === 'function') {
        window.SolvexChatbot.open(); return;
      }
      window.dispatchEvent(new CustomEvent('solvex:chatbot:open'));
      const launcher = document.querySelector('[data-chatbot-launcher], .chatbot-launcher, #chatbot-launcher, [aria-label="Apri chatbot"], [aria-label="Open chat"]');
      if (launcher) launcher.click();
      const widget = document.querySelector('.chatbot-widget, #chatbot, #root .chatbot-widget');
      if (widget) widget.style.display = 'block';
    }
    btn.addEventListener('click', openChatbot);
  })();

  /* ---------------------------------
   * Babylon.js configuratore 3D
   * --------------------------------- */
  if (document.getElementById('renderCanvas')) {
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true, { antialias: true, adaptToDeviceRatio: true });
    engine.forceSRGBBufferSupportState = false;
    if (!engine._gl) alert('WebGL not supported – update browser.');

    // Utility: centra modello & adatta camera al bounding
    function frameToMeshes(camera, meshes) {
      // Calcola bounding min/max complessivo
      let min = new BABYLON.Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
      let max = new BABYLON.Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
      meshes.forEach(m => {
        const i = m.getBoundingInfo();
        const bmin = i.boundingBox.minimumWorld;
        const bmax = i.boundingBox.maximumWorld;
        min = BABYLON.Vector3.Minimize(min, bmin);
        max = BABYLON.Vector3.Maximize(max, bmax);
      });
      const center = min.add(max).scale(0.5);
      const size = max.subtract(min);
      const maxDim = Math.max(size.x, size.y, size.z);

      // Target al centro effettivo e raggio calcolato
      camera.setTarget(center);
      // calcolo raggio in base al FOV per evitare clipping e avere framing comodo
      const fov = camera.fov || (Math.PI / 3);
      const radius = (maxDim * 0.6) / Math.tan(fov / 2) + maxDim * 0.2;
      camera.radius = radius;

      // Limiti più stretti per evitare “salti” con la rotella/pinch
      camera.lowerRadiusLimit = Math.max(radius * 0.35, 0.02);
      camera.upperRadiusLimit = radius * 3;

      // Muovi anche la posizione del root se serve riportare il centro al (0,0,0)
      // (opzionale) — noi lasciamo world-space così com’è per non rompere AR.
    }

    function createScene() {
      const scene = new BABYLON.Scene(engine);

      // Background tema
      function updateBackground() {
        const isDark = document.body.classList.contains('dark-mode');
        scene.clearColor = isDark
          ? BABYLON.Color4.FromHexString('#000000FF')
          : BABYLON.Color4.FromHexString('#FAFAFAFF');
      }
      updateBackground();
      if (themeToggle) themeToggle.addEventListener('click', updateBackground);

      // Luci
      const hemiLight = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
      hemiLight.intensity = 0.4;
      const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, -1), scene);
      dirLight.position = new BABYLON.Vector3(5, 10, 5);
      dirLight.intensity = 0.5;
      const pointLight = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(-3, 2, 0), scene);
      pointLight.intensity = 0.3;

      // Camera
      const camera = new BABYLON.ArcRotateCamera("camera", Math.PI, Math.PI / 2, 1.2, BABYLON.Vector3.Zero(), scene);
      camera.attachControl(canvas, true, false, true);

      // Zoom più morbido: usa delta percentage coerente su tutti i device
      // (valori più piccoli = movimento più lento)
      const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
      camera.wheelDeltaPercentage = isMobile ? 0.01 : 0.02;  // rotella mouse
      camera.pinchDeltaPercentage = 0.01;                    // pinch zoom mobile
      camera.useNaturalPinchZoom = true;

      // Inerzia leggera, ma non esagerata
      camera.inertia = 0.88;
      camera.panningInertia = 0.85;

      // Evita “salti” con minZ grande in AR; tieni molto vicino ma sicuro
      camera.minZ = 0.01;

      // Autorotate dolce con pausa al tocco
      let autoRotateTimer = null;
      let isRotating = true;
      scene.beforeRender = () => { if (isRotating) camera.alpha += 0.003; };
      canvas.addEventListener('pointerdown', () => {
        isRotating = false;
        clearTimeout(autoRotateTimer);
        autoRotateTimer = setTimeout(() => isRotating = true, 3000);
      });

      // Env map
      scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
        "https://assets.babylonjs.com/environments/studio.env", scene
      );
      scene.environmentIntensity = 0.6;

      // Post FX leggeri
      const pipeline = new BABYLON.DefaultRenderingPipeline("default", true, scene, [camera]);
      pipeline.bloomEnabled = true; pipeline.bloomThreshold = 0.8; pipeline.bloomWeight = 0.3;
      pipeline.sharpenEnabled = true; pipeline.sharpen.edgeAmount = 0.5;
      pipeline.samples = 16; pipeline.fxaaEnabled = true;

      // Espone global per sync tema
      babylonScene = scene;

      return scene;
    }

    const scene = createScene();

    // ---- CARICAMENTO MODELLO ----
    console.log('Inizio caricamento GLB...');
    BABYLON.SceneLoader.ImportMesh("", "./assets/", "iphone_16_pro_configuratore_3d.glb", scene, (meshes) => {
      console.log('SUCCESSO: GLB caricato! Mesh totali:', meshes.length);
      const printable = meshes.filter(m => m.getBoundingInfo);
      // Centra e adatta camera al nuovo modello ridimensionato
      frameToMeshes(scene.activeCamera, printable);

      // Root/model setup (se ti serve uno scaling aggiuntivo mantienilo qui)
      const model = meshes[0];
      model.receiveShadows = true;
      // Niente flip asse qui a meno che ti serva davvero:
      // model.scaling = new BABYLON.Vector3(-1, 1, 1);

      // Materiali noti
      const allMaterials = scene.materials;
      const scoccaMaterials = allMaterials
        .filter(m => /scocca|retro|pulsanti|box|bordi|dettagli/i.test(m.name))
        .map(m => m.name);
      const schermoMaterial = allMaterials.find(m => /schermo|screen/i.test(m.name))?.name;

      // Nodo cuffie
      const airpodsNode =
        scene.getNodeByName('Airpods') ||
        scene.getNodeByName('airpods') ||
        scene.getNodeByName('Cuffie')  ||
        scene.getNodeByName('cuffie')  ||
        scene.getTransformNodeByName('Airpods');

      // Esponi per <model-viewer> bridge
      window.scoccaMaterials  = scoccaMaterials;
      window.schermoMaterial  = schermoMaterial;

      const airpodsMaterials = (window.airpodsMaterials = (() => {
        try {
          if (!airpodsNode) return [];
          const mats = new Set();
          airpodsNode.getChildMeshes().forEach(m => { if (m.material?.name) mats.add(m.material.name); });
          return Array.from(mats);
        } catch (e) { return []; }
      })());

      // Texture (Cloudinary)
      const textures = {
        color: {
          bianco: 'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068874/bianco_sdebye.png?quality=auto&format=auto',
          grigio: 'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068859/grigio_iutpvj.png?quality=auto&format=auto',
          bronzo: 'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068893/bronzo_g23m36.png?quality=auto&format=auto',
          nero:   'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068910/nero_whga1l.png?quality=auto&format=auto'
        },
        background: {
          'sfondo-nero-bronzo':  'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981260/sfondo_iphone_viola_e_nero_qhggk6.webp?quality=auto&format=auto',
          'sfondo-arancio-nero': 'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981229/sfondo_iphone_nero_e_rosso_yzpl6h.webp?quality=auto&format=auto',
          'sfondo-nero-blu':     'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981196/sfondo_iphone_nero_e_bronzo_cmmt3h.webp?quality=auto&format=auto',
          'sfondo-nero-viola':   'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981244/sfondo_iphone_nero_e_blue_h6rgcb.webp?quality=auto&format=auto'
        }
      };
      window.textures = textures;

      /* -------- Preloading / cache Babylon -------- */
      const allTextureUrls = [...Object.values(textures.color), ...Object.values(textures.background)];
      const babylonTexCache = new Map();
      function preloadBabylonTextures(urls) {
        urls.forEach(url => {
          if (babylonTexCache.has(url)) return;
          const t = new BABYLON.Texture(url, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
          t.wrapU = t.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
          babylonTexCache.set(url, t);
        });
      }
      preloadBabylonTextures(allTextureUrls);
      allTextureUrls.forEach(u => {
        const l = document.createElement('link');
        l.rel = 'prefetch'; l.as = 'image'; l.href = u;
        document.head.appendChild(l);
      });

      function setAlbedoFromCache(materialNames, url) {
        const tex = babylonTexCache.get(url) || new BABYLON.Texture(
          url, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE
        );
        babylonTexCache.set(url, tex);
        materialNames.forEach(name => {
          const mat = scene.getMaterialByName(name);
          if (mat) mat.albedoTexture = tex;
        });
      }

      // UI listeners: colori & sfondo
      document.querySelectorAll('.color-options input').forEach(input => {
        input.addEventListener('change', () => {
          const url = textures.color[input.id];
          if (url && scoccaMaterials?.length) setAlbedoFromCache(scoccaMaterials, url);
        });
      });
      document.querySelectorAll('.background-options input').forEach(input => {
        input.addEventListener('change', () => {
          const url = textures.background[input.id];
          if (url && schermoMaterial) setAlbedoFromCache([schermoMaterial], url);
        });
      });

      // Toggle cuffie nel render Babylon
      const toggle = document.getElementById('toggle-airpods');
      if (airpodsNode && toggle) {
        airpodsNode.setEnabled(false); // default OFF
        toggle.addEventListener('change', () => {
          airpodsNode.setEnabled(toggle.checked);
        });
      }

      /* -------- AR ibrida (WebXR + <model-viewer>) -------- */
      const IS_IOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
      const arButton = document.getElementById('ar-button');
      const mv = document.getElementById('ar-bridge');

      function cloudinaryForcePNG(url) {
        if (!IS_IOS) return url;
        try {
          const u = new URL(url);
          if (u.hostname.includes('res.cloudinary.com')) u.searchParams.set('format', 'png');
          return u.toString();
        } catch { return url.replace('format=auto','format=png'); }
      }

      async function syncMVFromPageState() {
        if (!mv) return;
        await mv.updateComplete;
        if (!mv.model) return;

        // Texture correnti (forza PNG su iOS)
        const colorId = document.querySelector('.color-options input:checked')?.id;
        const bgId    = document.querySelector('.background-options input:checked')?.id;
        const colorUrl = colorId ? cloudinaryForcePNG(textures.color[colorId]) : null;
        const bgUrl    = bgId    ? cloudinaryForcePNG(textures.background[bgId]) : null;

        const applyBaseColorTexture = async (materialName, url) => {
          if (!url) return;
          const mat = mv.model.materials.find(m => m.name === materialName);
          if (!mat) return;
          const tex = await mv.createTexture(url);
          const ti = mat.pbrMetallicRoughness.baseColorTexture;
          if (ti) ti.setTexture(tex);
        };

        if (window.scoccaMaterials) {
          for (const matName of window.scoccaMaterials) await applyBaseColorTexture(matName, colorUrl);
        }
        if (window.schermoMaterial) await applyBaseColorTexture(window.schermoMaterial, bgUrl);

        // Nascondi/mostra cuffie in AR iOS via alpha
        const airpodsMatNames = (window.airpodsMaterials && window.airpodsMaterials.length)
          ? window.airpodsMaterials
          : mv.model.materials.filter(m => /(airpods|cuffie|headphone)/i.test(m.name)).map(m => m.name);

        const headphonesOn = document.getElementById('toggle-airpods')?.checked !== false;
        for (const name of airpodsMatNames) {
          const mat = mv.model.materials.find(m => m.name === name);
          if (!mat) continue;
          try { mat.setAlphaMode('BLEND'); } catch {}
          mat.pbrMetallicRoughness.setBaseColorFactor([1,1,1, headphonesOn ? 1 : 0]);
        }
      }

      if (arButton) {
        arButton.addEventListener('click', async () => {
          const ua = navigator.userAgent;
          const isAndroid = /Android/i.test(ua);
          const isMobile  = /Android|iPhone|iPad/i.test(ua);

          if (!isMobile) {
            const m = document.getElementById('ar-qr-modal');
            if (m) m.style.display = 'block';
            return;
          }

          // 1) WebXR (Android)
          try {
            if (isAndroid && navigator.xr && await navigator.xr.isSessionSupported('immersive-ar')) {
              await scene.createDefaultXRExperienceAsync({
                uiOptions: { sessionMode: 'immersive-ar' },
                optionalFeatures: ['hit-test', 'dom-overlay'],
                referenceSpaceType: 'local-floor'
              });
              return;
            }
          } catch (err) {
            console.warn('WebXR non disponibile, uso fallback <model-viewer>:', err);
          }

          // 2) Fallback iOS Quick Look / Android Scene Viewer
          try {
            await syncMVFromPageState();
            await mv.activateAR();
          } catch (e) {
            console.error('Fallback AR fallito:', e);
            alert('AR non disponibile su questo dispositivo/navigatore.');
          }
        });
      }

      // Auto-avvio via QR
      if (location.search.includes('ar=1') && /Android|iPhone/i.test(navigator.userAgent)) {
        const arBtn = document.getElementById('ar-button');
        arBtn && arBtn.click();
      }
    }, (progress) => {
      if (progress.total > 0) {
        console.log('Progresso: ', Math.round(progress.loaded / progress.total * 100) + '%');
      }
    }, (error) => {
      console.error('ERRORE CARICAMENTO:', error.message);
    });

    engine.runRenderLoop(() => babylonScene && babylonScene.render());
    window.addEventListener('resize', () => engine.resize());
  }
});
