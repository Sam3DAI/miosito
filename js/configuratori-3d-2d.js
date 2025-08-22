// configuratori-3d-2d.js — build 2025-08-23k
// Fix: carousel infinito + hamburger timing; default stato 3D; deep-link AR stabile (Safari/Chrome)
// AR: applica materiali a <model-viewer> PRIMA di activateAR + preload texture + overlay user-gesture
document.addEventListener('DOMContentLoaded', () => {
  /* ---------------------------------
   * Selettori base / UI
   * --------------------------------- */
  const body = document.body;
  const header = document.querySelector('header');
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const themeToggle = document.querySelector('.theme-toggle');
  const sunIcon = document.querySelector('.theme-icon.sun');
  const moonIcon = document.querySelector('.theme-icon.moon');

  /* ---------------------------------
   * Icona AR grande nel bottone
   * --------------------------------- */
  (function setupArButtonUI() {
    const arBtn = document.getElementById('ar-button');
    if (!arBtn) return;
    arBtn.innerHTML = `
      <img src="https://res.cloudinary.com/dqhbriryo/image/upload/v1755855493/icona_Realt%C3%A0_Aumentata_y2p4ga.webp"
           alt="" decoding="async" loading="eager"
           style="display:block;width:100%;height:100%;object-fit:contain;padding:12%;" />
    `;
    Object.assign(arBtn.style, {
      background: '#fff',
      borderRadius: '999px',
      width: '64px', height: '64px', padding: '0', lineHeight: '0',
      boxShadow: '0 4px 10px rgba(63,169,245,0.15)',
      transition: 'transform .15s ease, box-shadow .2s ease',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden'
    });
    arBtn.addEventListener('mouseenter', () => {
      arBtn.style.transform = 'scale(1.06)';
      arBtn.style.boxShadow = '0 8px 24px rgba(63,169,245,0.25)';
    });
    arBtn.addEventListener('mouseleave', () => {
      arBtn.style.transform = 'scale(1)';
      arBtn.style.boxShadow = '0 4px 10px rgba(63,169,245,0.15)';
    });
  })();

  /* ---------------------------------
   * ARIA link corrente (desktop + mobile)
   * --------------------------------- */
  (function setAriaCurrent() {
    const norm = p => (p || '/').replace(/\/+$/, '') || '/';
    const here = norm(location.pathname);
    document.querySelectorAll('nav a, #mobile-menu a').forEach(a => {
      const href = norm(a.getAttribute('href'));
      if (href === here) a.setAttribute('aria-current', 'page');
    });
  })();

  /* ---------------------------------
   * Hamburger menu — timing come “versione buona”
   * --------------------------------- */
  const setMobileState = (open) => {
    if (!hamburger || !mobileMenu) return;
    hamburger.classList.toggle('active', open);
    mobileMenu.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    if (open) {
      mobileMenu.removeAttribute('hidden');                // mostra (transizione CSS già presente)
      document.documentElement.style.overflow = 'hidden';  // blocca lo scroll della pagina
    } else {
      document.documentElement.style.overflow = '';        // sblocca lo scroll
      setTimeout(() => mobileMenu.setAttribute('hidden', ''), 300); // nascondi dopo transizione
    }
  };
  const toggleMenu = () => setMobileState(!hamburger.classList.contains('active'));
  if (hamburger) {
    hamburger.addEventListener('click', toggleMenu);
    hamburger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(); }
    });
  }
  // Chiudi quando clicchi una voce del menu
  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach(link =>
      link.addEventListener('click', () => setMobileState(false)));
  }

  /* ---------------------------------
   * Header shadow / stato su scroll (passive)
   * --------------------------------- */
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 50);
    if (y < lastY && hamburger?.classList.contains('active')) setMobileState(false);
    lastY = y;
  }, { passive: true });

  /* ---------------------------------
   * Tema
   * --------------------------------- */
  const THEME_KEY = 'svx-theme';
  const mediaDark = window.matchMedia('(prefers-color-scheme: dark)');
  const currentTheme = () => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return mediaDark.matches ? 'dark' : 'light';
  };
  let statsChart = null;
  const getAxisLabelColor = () => body.classList.contains('dark-mode') ? '#f5f5f7' : '#1d1d1f';
  function updateChartTheme() {
    if (!statsChart) return;
    statsChart.updateOptions({
      xaxis: { labels: { style: { colors: getAxisLabelColor(), fontSize: '14px' } } },
      yaxis: { labels: { style: { colors: getAxisLabelColor(), fontSize: '14px' } } }
    }, false, true);
  }
  function applyTheme(theme) {
    const isDark = theme === 'dark';
    body.classList.toggle('dark-mode', isDark);
    themeToggle?.setAttribute('aria-pressed', String(isDark));
    if (sunIcon && moonIcon) { sunIcon.style.display = isDark ? 'none' : 'block'; moonIcon.style.display = isDark ? 'block' : 'none'; }
    updateChartTheme();
    updateModelBackground();
  }
  applyTheme(currentTheme());
  themeToggle?.addEventListener('click', () => {
    const t = body.classList.contains('dark-mode') ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, t);
    applyTheme(t);
  });
  mediaDark.addEventListener('change', (e) => { if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches ? 'dark' : 'light'); });

  /* ---------------------------------
   * Carousel: frecce + scroll infinito (ripristinato)
   * --------------------------------- */
  (function initCarousels() {
    const containers = document.querySelectorAll('.carousel-container');
    containers.forEach(container => {
      const wrapper = container.querySelector('.carousel-wrapper');
      const leftArrow = container.querySelector('.carousel-arrow.left');
      const rightArrow = container.querySelector('.carousel-arrow.right');
      if (!wrapper || !leftArrow || !rightArrow) return;

      let isScrolling = false;
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
  })();

  /* ---------------------------------
   * Lazy BG + Prefetch
   * --------------------------------- */
  (function lazyBackgrounds() {
    const lazyCards = document.querySelectorAll('.benefit-card.lazy-bg[data-bg]');
    if (!lazyCards.length) return;
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const url = el.getAttribute('data-bg');
        if (url) { el.style.backgroundImage = `url('${url}')`; el.removeAttribute('data-bg'); }
        o.unobserve(el);
      });
    }, { rootMargin: '200px 0px' });
    lazyCards.forEach(el => obs.observe(el));
  })();

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
    document.querySelectorAll('.color-options-2d input[type="radio"]').forEach(r => {
      r.addEventListener('change', () => {
        const sw = r.nextElementSibling;
        const next = sw?.getAttribute('data-image');
        if (next) {
          img.style.opacity = '0';
          const tmp = new Image();
          tmp.onload = () => { img.src = next; img.alt = `Prodotto Configurabile 2D - ${r.value}`; img.style.opacity = '1'; };
          tmp.src = next;
        }
      });
    });
  })();

  /* ---------------------------------
   * ApexCharts
   * --------------------------------- */
  (function initStatsChart() {
    if (typeof ApexCharts === 'undefined') return;
    const target = document.querySelector('#stats-chart');
    if (!target) return;
    const options = () => ({
      chart: {
        type: 'bar', height: 350,
        animations: {
          enabled: true, easing: 'easeinout', speed: 2000,
          animateGradually: { enabled: true, delay: 150 },
          dynamicAnimation: { enabled: true, speed: 350 }
        }, toolbar: { show: false }
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
          statsChart = new ApexCharts(target, options());
          statsChart.render();
        }
      });
    }, { threshold: 0.1 });
    obs.observe(target);
  })();

  /* ---------------------------------
   * Babylon.js + AR bridge (model-viewer)
   * --------------------------------- */
  let babylonScene = null;
  function updateModelBackground() {
    if (!babylonScene) return;
    const isDark = body.classList.contains('dark-mode');
    const bg = isDark ? '#000000' : '#FAFAFA';
    const canvas = document.getElementById('renderCanvas');
    if (canvas) canvas.style.backgroundColor = bg;
    const container = canvas?.parentElement;
    if (container) container.style.backgroundColor = bg;
    const c = BABYLON.Color3.FromHexString(bg);
    babylonScene.clearColor = new BABYLON.Color4(c.r, c.g, c.b, 1);
  }

  // Helpers condivisi
  const IS_IOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
  const preloadImages = (urls) => Promise.all(
    (urls || []).filter(Boolean).map(u => new Promise(res => { const i = new Image(); i.onload = res; i.onerror = res; i.src = u; }))
  );

  // Stato default se non arriva nulla in query
  function ensureDefaultSelections() {
    const q = new URLSearchParams(location.search);
    const hasQuery = q.has('color') || q.has('bg') || q.has('airpods');
    if (hasQuery) return;
    const defColor = document.getElementById('bianco');
    const defBg    = document.getElementById('sfondo-nero-bronzo');
    const tgl      = document.getElementById('toggle-airpods');
    if (defColor) defColor.checked = true;
    if (defBg)    defBg.checked = true;
    if (tgl)      tgl.checked = false;
  }
  ensureDefaultSelections();

  if (document.getElementById('renderCanvas')) {
    const canvas = document.getElementById('renderCanvas');
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    const engine = new BABYLON.Engine(canvas, true, {
      antialias: true, adaptToDeviceRatio: true, alpha: false, preserveDrawingBuffer: true, stencil: true
    });
    const scene = new BABYLON.Scene(engine);
    babylonScene = scene;

    // Processing
    scene.imageProcessingConfiguration.toneMappingEnabled = false;
    scene.imageProcessingConfiguration.exposure = 1.0;
    scene.imageProcessingConfiguration.isEnabled = false;

    function setCanvasBG() {
      const isDark = body.classList.contains('dark-mode');
      const bg = isDark ? '#000000' : '#FAFAFA';
      canvas.style.backgroundColor = bg;
      const c = BABYLON.Color3.FromHexString(bg);
      scene.clearColor = new BABYLON.Color4(c.r, c.g, c.b, 1);
    }
    setCanvasBG();
    themeToggle?.addEventListener('click', setCanvasBG);

    // Luci
    new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene).intensity = 0.4;
    const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, -1), scene);
    dirLight.position = new BABYLON.Vector3(5, 10, 5); dirLight.intensity = 0.5;
    new BABYLON.PointLight("pointLight", new BABYLON.Vector3(-3, 2, 0), scene).intensity = 0.3;

    // Camera + input
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI, Math.PI/2, 1.2, BABYLON.Vector3.Zero(), scene);
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    camera.wheelDeltaPercentage = isMobile ? 0.01 : 0.02;
    camera.pinchDeltaPercentage = 0.01;
    camera.useNaturalPinchZoom = true;
    camera.inertia = 0.88; camera.panningInertia = 0.85; camera.minZ = 0.01;
    const pi = camera.inputs.attached.pointers;
    if (pi) { pi.buttons = [0,1,2]; pi.useCtrlForPanning = false; pi.panningMouseButton = 2; }
    camera.panningSensibility = 2000;
    camera.attachControl(canvas, true, false, true);

    // Autorotate
    let pivot = null, autoRotateTimer = null, isRotating = true;
    scene.onBeforeRenderObservable.add(() => { if (isRotating && pivot) pivot.rotate(BABYLON.Axis.Y, 0.003, BABYLON.Space.LOCAL); });
    canvas.addEventListener('pointerdown', () => { isRotating = false; clearTimeout(autoRotateTimer); autoRotateTimer = setTimeout(() => (isRotating = true), 3000); });

    // Env + post
    scene.environmentTexture  = BABYLON.CubeTexture.CreateFromPrefilteredData('https://assets.babylonjs.com/environments/studio.env', scene);
    scene.environmentIntensity = 0.6;
    const pipeline = new BABYLON.DefaultRenderingPipeline("default", true, scene, [camera]);
    pipeline.bloomEnabled = true; pipeline.bloomThreshold = 1.0; pipeline.bloomWeight = 0.25; pipeline.fxaaEnabled = true; pipeline.samples = 8;

    // Helpers bounds
    function computeBounds(meshes) {
      let min = new BABYLON.Vector3(+Infinity, +Infinity, +Infinity);
      let max = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity);
      meshes.forEach(m => {
        const bi = m.getBoundingInfo();
        min = BABYLON.Vector3.Minimize(min, bi.boundingBox.minimumWorld);
        max = BABYLON.Vector3.Maximize(max, bi.boundingBox.maximumWorld);
      });
      const center = min.add(max).scale(0.5);
      const size   = max.subtract(min);
      const maxDim = Math.max(size.x, size.y, size.z);
      return { center, maxDim };
    }
    function frameCamera(cam, center, maxDim) {
      cam.setTarget(center);
      const fov = cam.fov || (Math.PI / 3);
      const radius = (maxDim * 0.6) / Math.tan(fov/2) + maxDim * 0.2;
      cam.radius = radius;
      cam.lowerRadiusLimit = Math.max(radius * 0.35, 0.02);
      cam.upperRadiusLimit = radius * 3;
    }

    // Carica GLB
    BABYLON.SceneLoader.ImportMesh('', './assets/', 'iphone_16_pro_configuratore_3d.glb', scene, (meshes) => {
      const iphoneNode = scene.getTransformNodeByName('iphone') || scene.getNodeByName('iphone') || meshes[0];
      const airpodsNode =
        scene.getNodeByName('Airpods') || scene.getNodeByName('airpods') ||
        scene.getNodeByName('Cuffie') || scene.getNodeByName('cuffie') ||
        scene.getTransformNodeByName('Airpods');

      const printable = meshes.filter(m => m.getBoundingInfo);
      const { center, maxDim } = computeBounds(iphoneNode?.getChildMeshes ? iphoneNode.getChildMeshes() : printable);
      const pv = new BABYLON.TransformNode('pivot', scene);
      pv.setAbsolutePosition(center);
      if (iphoneNode)  iphoneNode.setParent(pv);
      if (airpodsNode) airpodsNode.setParent(pv);
      pivot = pv; frameCamera(camera, center, maxDim);

      const allMaterials = scene.materials;
      const scoccaMaterials = allMaterials.filter(m => /scocca|retro|pulsanti|box|bordi|dettagli/i.test(m.name)).map(m => m.name);
      const schermoMaterial = allMaterials.find(m => /schermo|screen/i.test(m.name))?.name;
      window.scoccaMaterials = scoccaMaterials;
      window.schermoMaterial = schermoMaterial;

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

      // NO-FLASH: applica texture in Babylon solo quando caricate
      function setAlbedo(materialNames, url) {
        const newTex = new BABYLON.Texture(url, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
        newTex.wrapU = newTex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
        newTex.onLoadObservable.addOnce(() => {
          materialNames.forEach(name => {
            const mat = scene.getMaterialByName(name);
            if (mat) mat.albedoTexture = newTex;
          });
        });
      }

      // Precarica tutte le texture (cache) senza bloccare
      setTimeout(() => {
        [...Object.values(textures.color), ...Object.values(textures.background)]
          .forEach(u => { const i = new Image(); i.decoding='async'; i.src = u; });
      }, 100);

      // === Stato iniziale (default o query) — UI + Babylon
      function getQuery() {
        const q = new URLSearchParams(location.search);
        const air = q.get('airpods'); // può essere null
        return {
          ar: q.get('ar') === '1',
          color: q.get('color') || null,
          bg: q.get('bg') || null,
          airpods: air === null ? null : air === '1'
        };
      }
      function applyBabylonFromUIorDefaults() {
        const q = getQuery();
        // se non c'è query, assicura i default su UI
        if (!q.color) document.getElementById('bianco')?.click?.() || (document.getElementById('bianco') && (document.getElementById('bianco').checked = true));
        if (!q.bg)    document.getElementById('sfondo-nero-bronzo')?.click?.() || (document.getElementById('sfondo-nero-bronzo') && (document.getElementById('sfondo-nero-bronzo').checked = true));
        const tgl = document.getElementById('toggle-airpods'); if (tgl && q.airpods === null) tgl.checked = false;

        const colorId = document.querySelector('.color-options input:checked')?.id;
        const bgId    = document.querySelector('.background-options input:checked')?.id;
        if (colorId && scoccaMaterials?.length) setAlbedo(scoccaMaterials, textures.color[colorId]);
        if (bgId && schermoMaterial)            setAlbedo([schermoMaterial], textures.background[bgId]);

        if (airpodsNode) {
          const on = !!document.getElementById('toggle-airpods')?.checked;
          airpodsNode.setEnabled(on);
          scene.meshes.forEach(m => {
            if (!m || m.name == null) return;
            if (/(cuffie|airpods).*(shadow|ombra)|(shadow|ombra).*(cuffie|airpods)/i.test(m.name)) m.setEnabled(on);
          });
        }
      }
      applyBabylonFromUIorDefaults();

      // Listeners UI -> Babylon
      document.querySelectorAll('.color-options input').forEach(input => {
        input.addEventListener('change', () => {
          const url = textures.color[input.id];
          if (url && scoccaMaterials?.length) setAlbedo(scoccaMaterials, url);
        });
      });
      document.querySelectorAll('.background-options input').forEach(input => {
        input.addEventListener('change', () => {
          const url = textures.background[input.id];
          if (url && schermoMaterial) setAlbedo([schermoMaterial], url);
        });
      });
      const toggle = document.getElementById('toggle-airpods');
      if (airpodsNode && toggle) {
        airpodsNode.setEnabled(!!toggle.checked);
        toggle.addEventListener('change', () => {
          airpodsNode.setEnabled(toggle.checked);
          scene.meshes.forEach(m => {
            if (!m || m.name == null) return;
            if (/(cuffie|airpods).*(shadow|ombra)|(shadow|ombra).*(cuffie|airpods)/i.test(m.name)) m.setEnabled(toggle.checked);
          });
        });
      }

      // ===== Bridge verso <model-viewer>
      const mv = document.getElementById('ar-bridge');
      if (mv) mv.setAttribute('shadow-intensity','0');

      // Forza PNG su iOS per Quick Look (evita format=auto)
      const forcePNG = (url) => {
        try { const u = new URL(url); if (u.hostname.includes('res.cloudinary.com')) u.searchParams.set('format','png'); return u.toString(); }
        catch { return (url || '').replace('format=auto','format=png'); }
      };

      async function applyTextureByURI(materialName, url) {
        if (!url || !mv?.model) return;
        const mat = mv.model.materials.find(m => m.name === materialName);
        if (!mat) return;
        const uri = IS_IOS ? forcePNG(url) : url;

        const texInfo = mat.pbrMetallicRoughness.baseColorTexture;
        const texObj  = texInfo?.texture;
        const source  = texObj?.source;
        if (source && typeof source.setURI === 'function') { source.setURI(uri); return; }

        // fallback raro: crea texture (potrebbe usare blob: internamente — CSP già aggiornata)
        if (typeof mv.createTexture === 'function' && typeof texInfo?.setTexture === 'function') {
          const tex = await mv.createTexture(uri);
          texInfo.setTexture(tex);
        }
      }

      function getCurrentConfig() {
        const colorId   = document.querySelector('.color-options input:checked')?.id || 'bianco';
        const bgId      = document.querySelector('.background-options input:checked')?.id || 'sfondo-nero-bronzo';
        const airpodsOn = !!document.getElementById('toggle-airpods')?.checked;
        return { colorId, bgId, airpodsOn };
      }
      function buildArShareUrl() {
        const url = new URL(location.href);
        url.searchParams.set('ar','1');
        const { colorId, bgId, airpodsOn } = getCurrentConfig();
        url.searchParams.set('color', colorId);
        url.searchParams.set('bg', bgId);
        url.searchParams.set('airpods', airpodsOn ? '1' : '0');
        return url.toString();
      }

      async function syncMVFromUI() {
        if (!mv) return;
        await mv.updateComplete;
        if (!mv.model) return;

        const { colorId, bgId, airpodsOn } = getCurrentConfig();
        const colorUrl = window.textures?.color[colorId];
        const bgUrl    = window.textures?.background[bgId];

        // Precarica immagini (evita che Quick Look “fotografi” prima che siano in cache)
        await preloadImages([IS_IOS ? forcePNG(colorUrl) : colorUrl, IS_IOS ? forcePNG(bgUrl) : bgUrl]);

        if (window.scoccaMaterials) {
          for (const mName of window.scoccaMaterials) { await applyTextureByURI(mName, colorUrl); }
        }
        if (window.schermoMaterial) { await applyTextureByURI(window.schermoMaterial, bgUrl); }

        // (Cuffie) — lato MV: nascondiamo i nodi tramite three-scene se necessario
        try {
          const sceneSym = Object.getOwnPropertySymbols(mv).find(s => s.description === 'scene');
          const threeScene = mv[sceneSym];
          const root = threeScene?.children?.[0];
          if (root) {
            ['Airpods','airpods','Cuffie','cuffie'].forEach(n => {
              const obj = root.getObjectByName(n);
              if (obj) obj.visible = !!airpodsOn;
            });
            threeScene.updateShadow?.(); threeScene.queueRender?.();
          }
        } catch {}
        await mv.updateComplete; // ulteriore tick
      }

      // Pulsante AR
      const arButton = document.getElementById('ar-button');
      if (arButton) {
        arButton.addEventListener('click', async () => {
          const ua = navigator.userAgent;
          const isAndroid = /Android/i.test(ua);
          const isMobile  = /Android|iPhone|iPad/i.test(ua);

          if (!isMobile) {
            const m = document.getElementById('ar-qr-modal');
            const box = document.getElementById('qr-code');
            if (m && box && window.QRCode) {
              box.innerHTML = '';
              new QRCode(box, { text: buildArShareUrl(), width: 220, height: 220 });
              m.style.display = 'block';
            } else if (m) m.style.display = 'block';
            return;
          }

          try {
            // Android: usa WebXR se disponibile
            if (isAndroid && navigator.xr && await navigator.xr.isSessionSupported('immersive-ar')) {
              await scene.createDefaultXRExperienceAsync({
                uiOptions: { sessionMode: 'immersive-ar' },
                optionalFeatures: ['hit-test', 'dom-overlay'],
                referenceSpaceType: 'local-floor'
              });
              return;
            }
          } catch (err) { console.warn('WebXR non disponibile, fallback a Quick Look:', err); }

          // Fallback iOS/Android via <model-viewer>
          try {
            if (IS_IOS && mv?.hasAttribute('ios-src')) mv.removeAttribute('ios-src');
            await syncMVFromUI();
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            await mv.activateAR();
          } catch (e) {
            console.error('AR non disponibile:', e);
            alert('AR non disponibile su questo dispositivo/navigatore.');
          }
        });
      }

      // Deep-link via QR: auto-apply + auto-AR con overlay se serve gesto
      (function handleDeepLink() {
        const q = getQuery();
        const isMobileUA = /Android|iPhone|iPad/i.test(navigator.userAgent);
        if (!isMobileUA) return;

        // Applica subito UI + Babylon (no flash)
        applyBabylonFromUIorDefaults();

        if (!q.ar) return;

        let overlay = null;
        function showOverlay() {
          if (overlay || !document.body) return;
          overlay = document.createElement('div');
          overlay.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35);backdrop-filter:saturate(140%) blur(2px);z-index:9999;cursor:pointer;';
          overlay.innerHTML = '<div style="background:#fff;border-radius:16px;padding:14px 16px;font:600 16px/1.2 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.18)">Tocca per aprire la Realtà Aumentata</div>';
          overlay.addEventListener('pointerdown', async () => {
            try { await tryLaunchAR(true); } finally { overlay?.remove(); overlay = null; }
          }, { once: true });
          document.body.appendChild(overlay);
        }

        async function tryLaunchAR(fromGesture = false) {
          try {
            if (IS_IOS && mv?.hasAttribute('ios-src')) mv.removeAttribute('ios-src');
            await syncMVFromUI();
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            const started = new Promise((resolve, reject) => {
              let timer = setTimeout(() => reject(new Error('timeout')), 2000);
              mv.addEventListener('ar-status', (e) => {
                if (e.detail.status === 'session-started') { clearTimeout(timer); resolve(); }
                if (e.detail.status === 'failed')         { clearTimeout(timer); reject(new Error('failed')); }
              }, { once: true });
            });
            await Promise.all([mv.activateAR(), started]);
          } catch (e) {
            if (!fromGesture) showOverlay();
          }
        }

        // prova auto-launch; se viene bloccato, mostriamo overlay
        if (mv?.model) tryLaunchAR(false);
        else mv.addEventListener('load', () => tryLaunchAR(false), { once: true });
      })();

    }, (progress) => {
      if (progress.total > 0) console.log('Progresso GLB: ', Math.round(progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('ERRORE CARICAMENTO GLB:', error.message);
    });

    // Render loop
    engine.runRenderLoop(() => babylonScene && babylonScene.render());
    window.addEventListener('resize', () => engine.resize());
  }

  /* ---------------------------------
   * Modale QR — chiusura con “X”
   * --------------------------------- */
  (function initQrModalClose() {
    const modal = document.getElementById('ar-qr-modal');
    const x = modal?.querySelector('.qr-close');
    x && x.addEventListener('click', () => { modal.style.display = 'none'; });
  })();

  /* ---------------------------------
   * Chatbot launcher (invariato)
   * --------------------------------- */
  (function initChatbotButton() {
    const btn = document.getElementById('open-chatbot');
    if (!btn) return;
    function openChatbot() {
      if (window.SolvexChatbot && typeof window.SolvexChatbot.open === 'function') { window.SolvexChatbot.open(); return; }
      window.dispatchEvent(new CustomEvent('solvex:chatbot:open'));
      const launcher = document.querySelector('[data-chatbot-launcher], .chatbot-launcher, #chatbot-launcher, [aria-label="Apri chatbot"], [aria-label="Open chat"]');
      if (launcher) launcher.click();
      const widget = document.querySelector('.chatbot-widget, #chatbot, #root .chatbot-widget');
      if (widget) widget.style.display = 'block';
    }
    btn.addEventListener('click', openChatbot);
  })();
});
