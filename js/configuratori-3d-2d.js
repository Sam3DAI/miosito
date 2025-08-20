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
   * Pulsante AR: icona + stile (bianco fisso)
   * --------------------------------- */
  (function setupArButtonUI() {
    const arBtn = document.getElementById('ar-button');
    if (!arBtn) return;
    arBtn.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="24" height="24" aria-hidden="true" focusable="false">
  <g stroke="#222" stroke-width="6" stroke-linecap="round" fill="none">
    <path d="M100 20 l-10 15 h20 z"/>
    <path d="M100 180 l-10 -15 h20 z"/>
    <path d="M20 100 l15 -10 v20 z"/>
    <path d="M180 100 l-15 -10 v20 z"/>
    <path d="M50 50 l15 5 -5 -15 z"/>
    <path d="M150 50 l-15 5 5 -15 z"/>
    <path d="M50 150 l15 -5 -5 15 z"/>
    <path d="M150 150 l-15 -5 5 15 z"/>
  </g>
  <text x="100" y="110" text-anchor="middle" font-family="Arial, sans-serif"
        font-size="36" font-weight="bold" fill="#3FA9F5">AR</text>
</svg>`;
    Object.assign(arBtn.style, {
      background: '#fff',
      borderRadius: '999px',
      boxShadow: '0 4px 10px rgba(63,169,245,0.15)',
      transition: 'transform .15s ease, box-shadow .2s ease',
      color: '#111'
    });
    arBtn.addEventListener('mouseenter', () => {
      arBtn.style.transform = 'scale(1.04)';
      arBtn.style.boxShadow = '0 8px 24px rgba(63,169,245,0.25)';
    });
    arBtn.addEventListener('mouseleave', () => {
      arBtn.style.transform = 'scale(1)';
      arBtn.style.boxShadow = '0 4px 10px rgba(63,169,245,0.15)';
    });
  })();

  /* ---------------------------------
   * Hardening markup
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
   * ARIA: evidenzia link corrente
   * --------------------------------- */
  (function setAriaCurrent() {
    const norm = p => (p || '/').replace(/\/+$/, '') || '/';
    const here = norm(location.pathname);
    document.querySelectorAll('nav a, #mobile-menu a').forEach(a => {
      const href = norm(a.getAttribute('href'));
      if (href === here) a.setAttribute('aria-current', 'page');
    });
  })();

  // Menu mobile + scroll lock
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
   * Header shadow su scroll
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

  // Colore background sito (per match perfetto)
  function getSiteBgLight() {
    // Prova a leggere il contenitore del configuratore; fallback a body
    const el = document.querySelector('.configuratore-3d, .configurator-3d, .configuratore, main, body') || document.body;
    const c = getComputedStyle(el).backgroundColor;
    return c || '#FAFAFA';
  }

  // Ref scena per aggiornare il background
  let babylonScene = null;
  function updateModelBackground() {
    if (!babylonScene) return;
    const isDark = body.classList.contains('dark-mode');
    const bg = isDark ? '#000000' : getSiteBgLight(); // usa il colore reale della pagina
    const canvas = document.getElementById('renderCanvas');
    if (canvas) canvas.style.backgroundColor = bg;
    const container = canvas?.parentElement;
    if (container) container.style.backgroundColor = bg;
    // set clearColor opaco
    const rgb = bg.startsWith('#') ? hexToRgb(bg) : cssRgbToRgb(bg);
    babylonScene.clearColor = new BABYLON.Color4(rgb.r/255, rgb.g/255, rgb.b/255, 1);
  }
  function hexToRgb(hex) {
    const h = hex.replace('#','');
    const n = parseInt(h,16);
    return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
  }
  function cssRgbToRgb(css) {
    const m = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    return m ? { r:+m[1], g:+m[2], b:+m[3] } : { r:250, g:250, b:250 };
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
   * Babylon.js configuratore 3D
   * --------------------------------- */
  if (document.getElementById('renderCanvas')) {
    const canvas = document.getElementById('renderCanvas');
    // Pan con tasto destro → niente menu contestuale
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    const engine = new BABYLON.Engine(canvas, true, {
      antialias: true,
      adaptToDeviceRatio: true,
      alpha: false,                 // canvas opaco: match perfetto con colore pagina
      preserveDrawingBuffer: true,
      stencil: true
    });
    engine.forceSRGBBufferSupportState = false;
    if (!engine._gl) alert('WebGL not supported – update browser.');

    // Bounds & framing
    function computeBounds(meshes) {
      let min = new BABYLON.Vector3(+Infinity, +Infinity, +Infinity);
      let max = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity);
      meshes.forEach(m => {
        const i = m.getBoundingInfo();
        min = BABYLON.Vector3.Minimize(min, i.boundingBox.minimumWorld);
        max = BABYLON.Vector3.Maximize(max, i.boundingBox.maximumWorld);
      });
      const center = min.add(max).scale(0.5);
      const size = max.subtract(min);
      const maxDim = Math.max(size.x, size.y, size.z);
      return { center, maxDim };
    }
    function frameCamera(camera, center, maxDim) {
      camera.setTarget(center);
      const fov = camera.fov || (Math.PI / 3);
      const radius = (maxDim * 0.6) / Math.tan(fov / 2) + maxDim * 0.2;
      camera.radius = radius;
      camera.lowerRadiusLimit = Math.max(radius * 0.35, 0.02);
      camera.upperRadiusLimit = radius * 3;
    }

    function createScene() {
      const scene = new BABYLON.Scene(engine);

      // Background tema (usa il colore reale del sito)
      function updateBackground() {
        const isDark = document.body.classList.contains('dark-mode');
        const bg = isDark ? '#000000' : getSiteBgLight();
        canvas.style.backgroundColor = bg;
        const container = canvas.parentElement;
        if (container) container.style.backgroundColor = bg;
        const rgb = bg.startsWith('#') ? hexToRgb(bg) : cssRgbToRgb(bg);
        scene.clearColor = new BABYLON.Color4(rgb.r/255, rgb.g/255, rgb.b/255, 1);
      }
      updateBackground();
      if (themeToggle) themeToggle.addEventListener('click', updateBackground);

      // Luci
      new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene).intensity = 0.4;
      const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, -1), scene);
      dirLight.position = new BABYLON.Vector3(5, 10, 5);
      dirLight.intensity = 0.5;
      new BABYLON.PointLight("pointLight", new BABYLON.Vector3(-3, 2, 0), scene).intensity = 0.3;

      // Camera
      const camera = new BABYLON.ArcRotateCamera("camera", Math.PI, Math.PI / 2, 1.2, BABYLON.Vector3.Zero(), scene);
      camera.attachControl(canvas, true, false, true);
      const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
      camera.wheelDeltaPercentage = isMobile ? 0.01 : 0.02; // zoom molto morbido
      camera.pinchDeltaPercentage = 0.01;
      camera.useNaturalPinchZoom = true;
      camera.inertia = 0.88;
      camera.panningInertia = 0.85;
      camera.minZ = 0.01;

      // Mappa tasti: sinistro=rotate, destro=pan
      const pi = camera.inputs.attached.pointers;
      if (pi) {
        pi.useCtrlForPanning = false;
        pi.panningMouseButton = 2; // tasto destro
        pi.buttons = [0, 2];       // 0=rotate, 2=pan
      }
      camera.panningSensibility = 2000; // più alto = pan più lento

      // Autorotate: ruota pivot (iphone + airpods)
      let pivot = null;
      let autoRotateTimer = null;
      let isRotating = true;
      scene.onBeforeRenderObservable.add(() => {
        if (isRotating && pivot) pivot.rotate(BABYLON.Axis.Y, 0.003, BABYLON.Space.LOCAL);
      });
      canvas.addEventListener('pointerdown', () => {
        isRotating = false;
        clearTimeout(autoRotateTimer);
        autoRotateTimer = setTimeout(() => isRotating = true, 3000);
      });

      // Env + un filo di post FX
      scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
        "https://assets.babylonjs.com/environments/studio.env", scene
      );
      scene.environmentIntensity = 0.6;
      const pipeline = new BABYLON.DefaultRenderingPipeline("default", true, scene, [camera]);
      pipeline.bloomEnabled = true; pipeline.bloomThreshold = 0.8; pipeline.bloomWeight = 0.3;
      pipeline.sharpenEnabled = true; pipeline.sharpen.edgeAmount = 0.5;
      pipeline.samples = 16; pipeline.fxaaEnabled = true;

      babylonScene = scene; // per update background
      return { scene, camera, setPivot: (p) => (pivot = p) };
    }

    const { scene, camera, setPivot } = createScene();

    /* ------------------------- CARICAMENTO MODELLO ------------------------- */
    BABYLON.SceneLoader.ImportMesh("", "./assets/", "iphone_16_pro_configuratore_3d.glb", scene, (meshes) => {
      // Nodi principali
      const iphoneNode =
        scene.getTransformNodeByName('iphone') ||
        scene.getNodeByName('iphone') ||
        meshes[0];

      const airpodsNode =
        scene.getNodeByName('Airpods') ||
        scene.getNodeByName('airpods') ||
        scene.getNodeByName('Cuffie')  ||
        scene.getNodeByName('cuffie')  ||
        scene.getTransformNodeByName('Airpods');

      // Pivot centrato su iPhone: ruotano insieme i due nodi
      const iphMeshes = iphoneNode?.getChildMeshes ? iphoneNode.getChildMeshes() : meshes;
      const { center, maxDim } = computeBounds(iphMeshes);
      const pivot = new BABYLON.TransformNode('pivot', scene);
      pivot.setAbsolutePosition(center);
      if (iphoneNode) iphoneNode.setParent(pivot);
      if (airpodsNode) airpodsNode.setParent(pivot);
      setPivot(pivot);
      frameCamera(camera, center, maxDim);

      // Materiali principali
      const allMaterials = scene.materials;
      const scoccaMaterials = allMaterials
        .filter(m => /scocca|retro|pulsanti|box|bordi|dettagli/i.test(m.name))
        .map(m => m.name);
      const schermoMaterial = allMaterials.find(m => /schermo|screen/i.test(m.name))?.name;

      window.scoccaMaterials  = scoccaMaterials;
      window.schermoMaterial  = schermoMaterial;

      // Materiali del nodo Airpods
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

      // UI: colori & sfondo
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

      /* =========================  AR (WebXR + <model-viewer>)  ========================= */
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

      // Materiali cuffie da rendere invisibili in AR
      const AIRPODS_HIDE_LIST = [
        'bianco lucido', 'gomma', 'parti_scure cuffie'
      ].map(s => s.toLowerCase());
      function shouldHideMatName(name) {
        const n = (name || '').toLowerCase().trim();
        if (AIRPODS_HIDE_LIST.includes(n)) return true;
        return /(cuffie|airpods)/i.test(n);
      }

      const TRANSPARENT_PX =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

      async function makeMaterialInvisibleMV(mat, mv) {
        try { mat.setAlphaMode('MASK'); } catch {}
        mat.alphaCutoff = 1.0;
        mat.pbrMetallicRoughness.setBaseColorFactor([1,1,1,0]);
        mat.pbrMetallicRoughness.metallicFactor = 0;
        mat.pbrMetallicRoughness.roughnessFactor = 1;
        const t = await mv.createTexture(TRANSPARENT_PX);
        const ti = mat.pbrMetallicRoughness.baseColorTexture;
        if (ti) ti.setTexture(t); // texture 1x1 trasparente per evitare “alone”
        try { mat.normalTexture && mat.normalTexture.setTexture(null); } catch {}
        try { mat.occlusionTexture && mat.occlusionTexture.setTexture(null); } catch {}
        try { mat.emissiveTexture && mat.emissiveTexture.setTexture(null); } catch {}
      }

      async function syncMVFromPageState() {
        if (!mv) return;
        await mv.updateComplete;
        if (!mv.model) return;

        // Applica texture correnti (forza PNG su iOS)
        const colorId = document.querySelector('.color-options input:checked')?.id;
        const bgId    = document.querySelector('.background-options input:checked')?.id;
        const colorUrl = colorId ? cloudinaryForcePNG(textures.color[colorId]) : null;
        const bgUrl    = bgId    ? cloudinaryForcePNG(textures.background[bgId]) : null;

        const applyBaseColorTexture = async (materialName, url) => {
          if (!url) return;
          const mat = mv.model.materials.find(m => m.name === materialName);
          if (!mat) return;
          const ti = mat.pbrMetallicRoughness.baseColorTexture;
          const tex = await mv.createTexture(url);
          if (ti) ti.setTexture(tex);
        };
        if (window.scoccaMaterials) {
          for (const mName of window.scoccaMaterials) await applyBaseColorTexture(mName, colorUrl);
        }
        if (window.schermoMaterial) await applyBaseColorTexture(window.schermoMaterial, bgUrl);

        // Cuffie invisibili quando OFF
        const headphonesOn = document.getElementById('toggle-airpods')?.checked !== false;
        for (const mat of mv.model.materials) {
          if (!shouldHideMatName(mat.name)) continue;
          if (headphonesOn) {
            try { mat.setAlphaMode('BLEND'); } catch {}
            mat.pbrMetallicRoughness.setBaseColorFactor([1,1,1,1]);
          } else {
            await makeMaterialInvisibleMV(mat, mv);
          }
        }
      }

      /* ---- Stato → URL (per QR) e URL → Stato (all’apertura) ---- */
      function buildStateURL(withArFlag=true) {
        const colorId = document.querySelector('.color-options input:checked')?.id || '';
        const bgId    = document.querySelector('.background-options input:checked')?.id || '';
        const hp      = document.getElementById('toggle-airpods')?.checked ? '1' : '0';
        const url = new URL(location.href);
        url.searchParams.set('c', colorId);
        url.searchParams.set('bg', bgId);
        url.searchParams.set('hp', hp);
        if (withArFlag) url.searchParams.set('ar', '1');
        return url.toString();
      }

      function applyStateFromURL() {
        const params = new URLSearchParams(location.search);
        const c  = params.get('c');
        const bg = params.get('bg');
        const hp = params.get('hp');

        const setRadio = (selector, id) => {
          if (!id) return;
          const el = document.querySelector(`${selector} input#${CSS.escape(id)}`);
          if (el) {
            el.checked = true;
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
        };
        setRadio('.color-options', c);
        setRadio('.background-options', bg);

        const t = document.getElementById('toggle-airpods');
        if (t && hp !== null) {
          t.checked = (hp === '1');
          if (typeof t.onchange === 'function') t.onchange();
          else t.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }

      // Applica stato da URL (se presente) PRIMA dell’eventuale auto-AR
      applyStateFromURL();

      /* ---- Modal QR custom (desktop) ---- */
      function openQRModal() {
        const target = buildStateURL(true); // include ?ar=1&c=...&bg=...&hp=...
        let modal = document.getElementById('ar-qr-modal');
        if (!modal) {
          modal = document.createElement('div');
          modal.id = 'ar-qr-modal';
          Object.assign(modal.style, {
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '24px'
          });
          modal.innerHTML = `
            <div id="ar-qr-card" style="
              position:relative;background:#fff;border-radius:16px;
              box-shadow:0 20px 50px rgba(0,0,0,0.25);padding:24px;
              width:min(420px,90vw);display:flex;flex-direction:column;align-items:center;gap:16px">
              <button id="ar-qr-close" aria-label="Chiudi" style="
                position:absolute;top:10px;right:10px;border:none;background:transparent;
                color:#3FA9F5;font-weight:700;font-size:22px;line-height:1;cursor:pointer">×</button>
              <div id="ar-qr-title" style="text-align:center;font-weight:600;color:#111;font-size:16px">
                Scansiona il QR CODE con la fotocamera del tuo smartphone/tablet per simulare la scena 3D nel tuo ambiente.
              </div>
              <img id="ar-qr-img" alt="QR per AR" style="width:260px;height:260px;object-fit:contain" />
              <a id="ar-qr-link" href="#" target="_blank" style="font-size:12px;color:#3FA9F5;word-break:break-all"></a>
            </div>`;
          document.body.appendChild(modal);
          modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
          modal.querySelector('#ar-qr-close').addEventListener('click', () => modal.remove());
        }
        const img = modal.querySelector('#ar-qr-img');
        const link = modal.querySelector('#ar-qr-link');
        const qrAPI = 'https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=0&data=';
        img.src = qrAPI + encodeURIComponent(target);
        link.textContent = target;
        link.href = target;
        modal.style.display = 'flex';
      }

      /* ---- Click AR ---- */
      if (arButton) {
        arButton.addEventListener('click', async () => {
          const ua = navigator.userAgent;
          const isAndroid = /Android/i.test(ua);
          const isMobile  = /Android|iPhone|iPad/i.test(ua);

          if (!isMobile) {
            // Desktop → mostra QR MODAL centrato e con stato corrente
            openQRModal();
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

      // Auto-avvio AR se arrivo da QR (?ar=1) → dopo aver applicato lo stato
      if (location.search.includes('ar=1') && /Android|iPhone/i.test(navigator.userAgent)) {
        const arBtn = document.getElementById('ar-button');
        // piccolo delay per sicurezza: <model-viewer> e materiali pronti
        setTimeout(() => arBtn && arBtn.click(), 100);
      }
    });

    engine.runRenderLoop(() => babylonScene && babylonScene.render());
    window.addEventListener('resize', () => engine.resize());
  }
});
