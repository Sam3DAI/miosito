// configuratori-3d-2d.js — build 2025-08-21c (Sam, auto-AR+no-flash+dark-parts fix)
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
   * Sostituisci icona AR e stile pulsante (bianco fisso)
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
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); toggleMenu();
      }
    });
  }

  // Sticky header leggero
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 8);
    if (y < lastY && hamburger?.classList.contains('active')) setMobileState(false);
    lastY = y;
  }, { passive: true });

  /* ---------------------------------
   * Tema chiaro/scuro + sync bg modello
   * --------------------------------- */
  const THEME_KEY = 'svx-theme';
  const mediaDark = window.matchMedia('(prefers-color-scheme: dark)');
  function currentTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return mediaDark.matches ? 'dark' : 'light';
  }

  // Chart + 3D background updaters
  let statsChart = null;
  function getAxisLabelColor(){ return body.classList.contains('dark-mode') ? '#f5f5f7' : '#1d1d1f'; }
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
    const bg = isDark ? '#000000' : '#FAFAFA';
    const canvas = document.getElementById('renderCanvas');
    if (canvas) canvas.style.backgroundColor = bg;
    const container = canvas?.parentElement;
    if (container) container.style.backgroundColor = bg;
    const c = BABYLON.Color3.FromHexString(bg);
    babylonScene.clearColor = new BABYLON.Color4(c.r, c.g, c.b, 1);
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
   * Lazy-bg per card benefit
   * --------------------------------- */
  (function lazyBackgrounds() {
    const lazyCards = document.querySelectorAll('.benefit-card.lazy-bg');
    if (!('IntersectionObserver' in window) || !lazyCards.length) return;
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const bg = el.getAttribute('data-bg');
        if (bg) el.style.backgroundImage = `url('${bg}')`;
        o.unobserve(el);
      });
    }, { rootMargin: '200px' });
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
   * ApexCharts — versione orizzontale/distributed (ripristinata)
   * --------------------------------- */
  (function initStatsChart() {
    if (typeof ApexCharts === 'undefined') return;
    const target = document.querySelector('#stats-chart');
    if (!target) return;
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
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    const engine = new BABYLON.Engine(canvas, true, {
      antialias: true,
      adaptToDeviceRatio: true,
      alpha: false,
      preserveDrawingBuffer: true,
      stencil: true
    });

    const scene = new BABYLON.Scene(engine);
    babylonScene = scene;

    // Niente tone mapping per non alterare lo sfondo
    scene.imageProcessingConfiguration.toneMappingEnabled = false;
    scene.imageProcessingConfiguration.exposure = 1.0;
    scene.imageProcessingConfiguration.isEnabled = false;

    // Background in sync col tema
    function updateBackground() {
      const isDark = body.classList.contains('dark-mode');
      const bg = isDark ? '#000000' : '#FAFAFA';
      canvas.style.backgroundColor = bg;
      const container = canvas.parentElement;
      if (container) container.style.backgroundColor = bg;
      const c = BABYLON.Color3.FromHexString(bg);
      scene.clearColor = new BABYLON.Color4(c.r, c.g, c.b, 1);
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
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    camera.wheelDeltaPercentage = isMobile ? 0.01 : 0.02;
    camera.pinchDeltaPercentage = 0.01;
    camera.useNaturalPinchZoom = true;
    camera.inertia = 0.88;
    camera.panningInertia = 0.85;
    camera.minZ = 0.01;

    // Pan con RMB
    const pi = camera.inputs.attached.pointers;
    if (pi) {
      pi.buttons = [0, 1, 2];
      pi.useCtrlForPanning = false;
      pi.panningMouseButton = 2; // destro = pan
    }
    camera.panningSensibility = 2000;
    camera.attachControl(canvas, true, false, true);

    // Autorotate dolce sul pivot
    let pivot = null;
    let autoRotateTimer = null;
    let isRotating = true;
    scene.onBeforeRenderObservable.add(() => {
      if (isRotating && pivot) pivot.rotate(BABYLON.Axis.Y, 0.003, BABYLON.Space.LOCAL);
    });
    canvas.addEventListener('pointerdown', () => {
      isRotating = false;
      clearTimeout(autoRotateTimer);
      autoRotateTimer = setTimeout(() => (isRotating = true), 3000);
    });

    // Env + Post
    scene.environmentTexture  = BABYLON.CubeTexture.CreateFromPrefilteredData(
      'https://assets.babylonjs.com/environments/studio.env', scene
    );
    scene.environmentIntensity = 0.6;
    const pipeline = new BABYLON.DefaultRenderingPipeline("default", true, scene, [camera]);
    pipeline.bloomEnabled    = true;
    pipeline.bloomThreshold  = 1.0;
    pipeline.bloomWeight     = 0.25;
    pipeline.fxaaEnabled     = true;
    pipeline.samples         = 8;

    // Helpers bounding e framing
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
      const radius = (maxDim * 0.6) / Math.tan(fov / 2) + maxDim * 0.2;
      cam.radius = radius;
      cam.lowerRadiusLimit = Math.max(radius * 0.35, 0.02);
      cam.upperRadiusLimit = radius * 3;
    }
    function setPivot(p){ pivot = p; }

    // Caricamento GLB
    BABYLON.SceneLoader.ImportMesh('', './assets/', 'iphone_16_pro_configuratore_3d.glb', scene, (meshes) => {
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

      // Pivot centrato
      const printable = meshes.filter(m => m.getBoundingInfo);
      const { center, maxDim } = computeBounds(iphoneNode?.getChildMeshes ? iphoneNode.getChildMeshes() : printable);
      const pv = new BABYLON.TransformNode('pivot', scene);
      pv.setAbsolutePosition(center);
      if (iphoneNode)  iphoneNode.setParent(pv);
      if (airpodsNode) airpodsNode.setParent(pv);
      setPivot(pv);
      frameCamera(camera, center, maxDim);

      // Material mapping (scocca/schermo)
      const allMaterials = scene.materials;
      const scoccaMaterials = allMaterials
        .filter(m => /scocca|retro|pulsanti|box|bordi|dettagli/i.test(m.name))
        .map(m => m.name);
      const schermoMaterial = allMaterials.find(m => /schermo|screen/i.test(m.name))?.name;

      window.scoccaMaterials  = scoccaMaterials;
      window.schermoMaterial  = schermoMaterial;

      // Textures (niente preload/prefetch)
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

      // ----- NO-FLASH texture swap (applica solo dopo load) -----
      function setAlbedo(materialNames, url) {
        const newTex = new BABYLON.Texture(
          url, scene, /*noMipMap*/ true, /*invertY*/ false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE
        );
        newTex.wrapU = newTex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
        newTex.onLoadObservable.addOnce(() => {
          materialNames.forEach(name => {
            const mat = scene.getMaterialByName(name);
            if (mat) mat.albedoTexture = newTex;
          });
        });
      }

      // Warm-up cache (senza blob, solo <img>) per evitare flash al primissimo cambio
      (function warmTexturesForCache(){
        const urls = [...Object.values(textures.color), ...Object.values(textures.background)];
        setTimeout(() => {
          urls.forEach(u => { const img = new Image(); img.decoding = 'async'; img.src = u; });
        }, 100);
      })();

      // UI listeners (colori, sfondi)
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

      /* -------- AR ibrida (WebXR + <model-viewer>) -------- */
      const IS_IOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
      const arButton = document.getElementById('ar-button');
      const mv = document.getElementById('ar-bridge');

      // Disattiva ombre del viewer (non Quick Look)
      if (mv) mv.setAttribute('shadow-intensity','0');

      // Utility URL <-> stato configuratore
      function getQuery() {
        const q = new URLSearchParams(location.search);
        return {
          ar: q.get('ar') === '1',
          color: q.get('color'),
          bg: q.get('bg'),
          airpods: q.get('airpods') === '1'
        };
      }
      function setFormSelectionsFromQuery() {
        const { color, bg, airpods } = getQuery();
        if (color) {
          const el = document.getElementById(color);
          if (el && el.type === 'radio') { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); }
        }
        if (bg) {
          const el = document.getElementById(bg);
          if (el && el.type === 'radio') { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); }
        }
        const tgl = document.getElementById('toggle-airpods');
        if (tgl && typeof airpods === 'boolean') {
          const prev = !!tgl.checked;
          tgl.checked = airpods;
          if (prev !== airpods) tgl.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      function getCurrentConfig() {
        const colorId = document.querySelector('.color-options input:checked')?.id || 'bianco';
        const bgId    = document.querySelector('.background-options input:checked')?.id || 'sfondo-nero-bronzo';
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
      function cloudinaryForcePNG(url) {
        if (!IS_IOS) return url;
        try {
          const u = new URL(url);
          if (u.hostname.includes('res.cloudinary.com')) u.searchParams.set('format', 'png');
          return u.toString();
        } catch { return url.replace('format=auto','format=png'); }
      }

      // ---- Stato originale materiali cuffie (ripristino quando ON)
      const AR_MAT_ORIG = new Map(); // name -> {alphaMode, alphaCutoff, baseColorFactor, metallicFactor, roughnessFactor}

      // ---- scene graph internamente a <model-viewer> per nascondere nodo cuffie (no ombre)
      function setAirpodsVisibleInMV(visible) {
        try {
          if (!mv) return;
          const sceneSym = Object.getOwnPropertySymbols(mv).find(s => s.description === 'scene');
          const threeScene = mv[sceneSym];
          const root = threeScene?.children?.[0];
          if (!root) return;
          const names = ['Airpods','airpods','Cuffie','cuffie'];
          let changed = false;
          names.forEach(n => {
            const obj = root.getObjectByName(n);
            if (obj) { obj.visible = visible; changed = true; }
          });
          if (changed) {
            threeScene.updateShadow?.();
            threeScene.queueRender?.();
          }
        } catch (e) { /* no-op */ }
      }

      // Materiali cuffie da considerare per ON/OFF
      const AIRPODS_HIDE_LIST = ['bianco lucido','gomma','parti_scure cuffie'].map(s => s.toLowerCase());
      function shouldHideMatName(name) {
        const n = (name || '').toLowerCase().trim();
        if (AIRPODS_HIDE_LIST.includes(n)) return true;
        return /(cuffie|airpods)/i.test(n);
      }

      async function syncMVFromPageState() {
        if (!mv) return;
        await mv.updateComplete;
        if (!mv.model) return;

        // Texture correnti (PNG su iOS per Quick Look)
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
          for (const matName of window.scoccaMaterials) await applyBaseColorTexture(matName, colorUrl);
        }
        if (window.schermoMaterial) await applyBaseColorTexture(window.schermoMaterial, bgUrl);

        // Cuffie ON/OFF in AR
        const headphonesOn = !!document.getElementById('toggle-airpods')?.checked;

        // 1) Nodo visibile/invisibile (no ombre quando OFF)
        setAirpodsVisibleInMV(headphonesOn);

        // 2) Materiali: salva originali una volta e applica OFF/ON
        mv.model.materials.forEach(mat => {
          if (!shouldHideMatName(mat.name)) return;

          if (!AR_MAT_ORIG.has(mat.name)) {
            AR_MAT_ORIG.set(mat.name, {
              alphaMode: mat.alphaMode,
              alphaCutoff: mat.alphaCutoff,
              baseColorFactor: (mat.pbrMetallicRoughness.baseColorFactor || [1,1,1,1]).slice(),
              metallicFactor: mat.pbrMetallicRoughness.metallicFactor,
              roughnessFactor: mat.pbrMetallicRoughness.roughnessFactor
            });
          }

          if (!headphonesOn) {
            try { mat.setAlphaMode('MASK'); } catch {}
            mat.alphaCutoff = 1.0;
            mat.pbrMetallicRoughness.setBaseColorFactor([1,1,1,0]);
            mat.pbrMetallicRoughness.metallicFactor = 0;
            mat.pbrMetallicRoughness.roughnessFactor = 1;
          } else {
            const o = AR_MAT_ORIG.get(mat.name);
            if (o) {
              try { mat.setAlphaMode(o.alphaMode || 'OPAQUE'); } catch {}
              mat.alphaCutoff = (o.alphaCutoff !== undefined ? o.alphaCutoff : 0.5);
              mat.pbrMetallicRoughness.setBaseColorFactor(o.baseColorFactor);
              mat.pbrMetallicRoughness.metallicFactor = o.metallicFactor;
              mat.pbrMetallicRoughness.roughnessFactor = o.roughnessFactor;
            } else {
              try { mat.setAlphaMode('OPAQUE'); } catch {}
              mat.alphaCutoff = 0.5;
              mat.pbrMetallicRoughness.setBaseColorFactor([1,1,1,1]);
            }
          }
        });
      }

      // Toggle cuffie: Babylon (nodo intero) + model-viewer (visibilità)
      const toggle = document.getElementById('toggle-airpods');
      if (airpodsNode && toggle) {
        airpodsNode.setEnabled(!!toggle.checked);
        setAirpodsVisibleInMV(!!toggle.checked);
        toggle.addEventListener('change', () => {
          airpodsNode.setEnabled(toggle.checked);
          setAirpodsVisibleInMV(toggle.checked);
          // fallback per eventuali mesh "ombra cuffie" in Babylon
          scene.meshes.forEach(m => {
            if (!m || m.name == null) return;
            if (/(cuffie|airpods).*(shadow|ombra)|(shadow|ombra).*(cuffie|airpods)/i.test(m.name)) {
              m.setEnabled(toggle.checked);
            }
          });
        });
      }

      // Click AR
      if (arButton) {
        arButton.addEventListener('click', async () => {
          const ua = navigator.userAgent;
          const isAndroid = /Android/i.test(ua);
          const isMobile  = /Android|iPhone|iPad/i.test(ua);

          if (!isMobile) {
            // Desktop: QR dinamico con configurazione incorporata
            const m = document.getElementById('ar-qr-modal');
            const box = document.getElementById('qr-code');
            if (m && box && window.QRCode) {
              box.innerHTML = '';
              new QRCode(box, { text: buildArShareUrl(), width: 220, height: 220 });
              m.style.display = 'block';
            } else if (m) {
              m.style.display = 'block';
            }
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

      // -------- Deep-link da QR: auto-AR + configurazione corretta --------
      const q = getQuery();
      if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
        setFormSelectionsFromQuery();

        if (q.ar) {
          const startAR = async () => {
            // iOS: rimuovi ios-src per usare USDZ auto-generata dalla scena corrente
            if (IS_IOS && mv?.hasAttribute('ios-src')) {
              mv.removeAttribute('ios-src');
            }
            await syncMVFromPageState();
            try { await mv.activateAR(); } catch(e){ console.warn('activateAR() non riuscito:', e); }
          };
          if (mv?.model) startAR();
          else mv.addEventListener('load', startAR, { once: true });
        }
      }
    }, (progress) => {
      if (progress.total > 0) {
        console.log('Progresso: ', Math.round(progress.loaded / progress.total * 100) + '%');
      }
    }, (error) => {
      console.error('ERRORE CARICAMENTO:', error.message);
    });

    // Render loop + resize
    engine.runRenderLoop(() => babylonScene && babylonScene.render());
    window.addEventListener('resize', () => engine.resize());
  }

  /* ---------------------------------
   * Modale QR — chiusura con “X”
   * --------------------------------- */
  (function initQrModalClose() {
    const modal = document.getElementById('ar-qr-modal');
    if (!modal) return;
    const x = modal.querySelector('.qr-close');
    x && x.addEventListener('click', () => { modal.style.display = 'none'; });
  })();
});
