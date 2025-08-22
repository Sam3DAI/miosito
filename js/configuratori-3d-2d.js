// configuratori-3d-2d.js — build 2025-08-21f (Sam)
// - Default consistenti: bianco + sfondo-nero-bronzo + cuffie OFF
// - Deep link QR: applica config a <model-viewer> (texture già caricate) PRIMA di activateAR()
// - Safari/iOS: overlay tap se l’auto-AR è bloccato; niente “2° click” necessario
// - Babylon: swap texture no-flash
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
   * Icona AR dentro al bottone (quasi full)
   * --------------------------------- */
  (function setupArButtonUI() {
    const arBtn = document.getElementById('ar-button');
    if (!arBtn) return;
    arBtn.innerHTML = `
      <img src="https://res.cloudinary.com/dqhbriryo/image/upload/v1755855493/icona_Realt%C3%A0_Aumentata_y2p4ga.webp"
           alt="" decoding="async" loading="eager"
           style="display:block;width:100%;height:100%;object-fit:contain;padding:10%;" />
    `;
    Object.assign(arBtn.style, {
      background: '#fff', borderRadius: '999px',
      width: '64px', height: '64px', padding: '0', lineHeight: '0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      boxShadow: '0 4px 10px rgba(63,169,245,0.15)',
      transition: 'transform .15s ease, box-shadow .2s ease'
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
   * Nav aria-current + menu mobile
   * --------------------------------- */
  (function setAriaCurrent() {
    const norm = p => (p || '/').replace(/\/+$/, '') || '/';
    const here = norm(location.pathname);
    document.querySelectorAll('nav a, #mobile-menu a').forEach(a => {
      const href = norm(a.getAttribute('href'));
      if (href === here) a.setAttribute('aria-current', 'page');
    });
  })();
  const setMobileState = (open) => {
    if (!hamburger || !mobileMenu) return;
    hamburger.classList.toggle('active', open);
    mobileMenu.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    if (open) { mobileMenu.removeAttribute('hidden'); document.documentElement.style.overflow = 'hidden'; }
    else { document.documentElement.style.overflow = ''; setTimeout(() => mobileMenu.setAttribute('hidden', ''), 300); }
  };
  const toggleMenu = () => setMobileState(!hamburger.classList.contains('active'));
  if (hamburger) {
    hamburger.addEventListener('click', toggleMenu);
    hamburger.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(); }});
  }
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 8);
    if (y < lastY && hamburger?.classList.contains('active')) setMobileState(false);
    lastY = y;
  }, { passive: true });

  /* ---------------------------------
   * Tema + sync bg 3D
   * --------------------------------- */
  const THEME_KEY = 'svx-theme';
  const mediaDark = window.matchMedia('(prefers-color-scheme: dark)');
  const currentTheme = () => (['light','dark'].includes(localStorage.getItem(THEME_KEY)) ? localStorage.getItem(THEME_KEY) : (mediaDark.matches ? 'dark' : 'light'));
  let statsChart = null;
  const getAxisLabelColor = () => (body.classList.contains('dark-mode') ? '#f5f5f7' : '#1d1d1f');
  const updateChartTheme = () => {
    if (!statsChart) return;
    statsChart.updateOptions({
      xaxis: { labels: { style: { colors: getAxisLabelColor(), fontSize: '14px' } } },
      yaxis: { labels: { style: { colors: getAxisLabelColor(), fontSize: '14px' } } }
    }, false, true);
  };
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
  themeToggle?.addEventListener('click', () => {
    const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, newTheme);
    applyTheme(newTheme);
  });
  mediaDark.addEventListener('change', (e) => { if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches ? 'dark' : 'light'); });

  /* ---------------------------------
   * Lazy BG + Prefetch
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
   * Configuratore 2D (immutato)
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
   * ApexCharts (orizzontale/distributed)
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
   * Helpers Config
   * --------------------------------- */
  const DEFAULTS = { colorId: 'bianco', bgId: 'sfondo-nero-bronzo', airpodsOn: false };
  const IS_IOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
  const isMobileUA = /Android|iPhone|iPad/i.test(navigator.userAgent);

  function getQuery() {
    const q = new URLSearchParams(location.search);
    const airpodsParam = q.get('airpods');
    return {
      ar: q.get('ar') === '1',
      color: q.get('color') || null,
      bg: q.get('bg') || null,
      airpods: airpodsParam === null ? null : airpodsParam === '1'
    };
  }
  function ensureDefaultSelectionsIfNoQuery() {
    const { color, bg, airpods } = getQuery();
    if (!color) document.getElementById(DEFAULTS.colorId)?.setAttribute('checked','');
    if (!bg) document.getElementById(DEFAULTS.bgId)?.setAttribute('checked','');
    const tgl = document.getElementById('toggle-airpods');
    if (tgl && airpods === null) tgl.checked = DEFAULTS.airpodsOn; // OFF di default
  }
  ensureDefaultSelectionsIfNoQuery();

  /* ---------------------------------
   * Babylon.js configuratore 3D
   * --------------------------------- */
  if (document.getElementById('renderCanvas')) {
    const canvas = document.getElementById('renderCanvas');
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    const engine = new BABYLON.Engine(canvas, true, {
      antialias: true, adaptToDeviceRatio: true, alpha: false,
      preserveDrawingBuffer: true, stencil: true
    });
    const scene = new BABYLON.Scene(engine);
    babylonScene = scene;

    // No tone mapping
    scene.imageProcessingConfiguration.toneMappingEnabled = false;
    scene.imageProcessingConfiguration.exposure = 1.0;
    scene.imageProcessingConfiguration.isEnabled = false;

    function updateBackground() {
      const isDark = body.classList.contains('dark-mode');
      const bg = isDark ? '#000000' : '#FAFAFA';
      canvas.style.backgroundColor = bg;
      const container = canvas.parentElement; if (container) container.style.backgroundColor = bg;
      const c = BABYLON.Color3.FromHexString(bg);
      scene.clearColor = new BABYLON.Color4(c.r, c.g, c.b, 1);
    }
    updateBackground();
    themeToggle?.addEventListener('click', updateBackground);

    // Luci
    new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene).intensity = 0.4;
    const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, -1), scene);
    dirLight.position = new BABYLON.Vector3(5, 10, 5);
    dirLight.intensity = 0.5;
    new BABYLON.PointLight("pointLight", new BABYLON.Vector3(-3, 2, 0), scene).intensity = 0.3;

    // Camera
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI, Math.PI / 2, 1.2, BABYLON.Vector3.Zero(), scene);
    const isMobile = isMobileUA;
    camera.wheelDeltaPercentage = isMobile ? 0.01 : 0.02;
    camera.pinchDeltaPercentage = 0.01;
    camera.useNaturalPinchZoom = true;
    camera.inertia = 0.88; camera.panningInertia = 0.85; camera.minZ = 0.01;
    const pi = camera.inputs.attached.pointers;
    if (pi) { pi.buttons = [0, 1, 2]; pi.useCtrlForPanning = false; pi.panningMouseButton = 2; }
    camera.panningSensibility = 2000;
    camera.attachControl(canvas, true, false, true);

    // Autorotate
    let pivot = null, autoRotateTimer = null, isRotating = true;
    scene.onBeforeRenderObservable.add(() => { if (isRotating && pivot) pivot.rotate(BABYLON.Axis.Y, 0.003, BABYLON.Space.LOCAL); });
    canvas.addEventListener('pointerdown', () => { isRotating = false; clearTimeout(autoRotateTimer); autoRotateTimer = setTimeout(() => (isRotating = true), 3000); });

    // Env + Post
    scene.environmentTexture  = BABYLON.CubeTexture.CreateFromPrefilteredData('https://assets.babylonjs.com/environments/studio.env', scene);
    scene.environmentIntensity = 0.6;
    const pipeline = new BABYLON.DefaultRenderingPipeline("default", true, scene, [camera]);
    pipeline.bloomEnabled = true; pipeline.bloomThreshold = 1.0; pipeline.bloomWeight = 0.25; pipeline.fxaaEnabled = true; pipeline.samples = 8;

    // Helpers
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
    const setPivot = (p) => { pivot = p; };

    // Carica GLB
    BABYLON.SceneLoader.ImportMesh('', './assets/', 'iphone_16_pro_configuratore_3d.glb', scene, (meshes) => {
      const iphoneNode =
        scene.getTransformNodeByName('iphone') ||
        scene.getNodeByName('iphone') || meshes[0];
      const airpodsNode =
        scene.getNodeByName('Airpods') ||
        scene.getNodeByName('airpods') ||
        scene.getNodeByName('Cuffie')  ||
        scene.getNodeByName('cuffie')  ||
        scene.getTransformNodeByName('Airpods');

      const printable = meshes.filter(m => m.getBoundingInfo);
      const { center, maxDim } = computeBounds(iphoneNode?.getChildMeshes ? iphoneNode.getChildMeshes() : printable);
      const pv = new BABYLON.TransformNode('pivot', scene);
      pv.setAbsolutePosition(center);
      if (iphoneNode)  iphoneNode.setParent(pv);
      if (airpodsNode) airpodsNode.setParent(pv);
      setPivot(pv);
      frameCamera(camera, center, maxDim);

      const allMaterials = scene.materials;
      const scoccaMaterials = allMaterials.filter(m => /scocca|retro|pulsanti|box|bordi|dettagli/i.test(m.name)).map(m => m.name);
      const schermoMaterial = allMaterials.find(m => /schermo|screen/i.test(m.name))?.name;
      window.scoccaMaterials = scoccaMaterials;
      window.schermoMaterial = schermoMaterial;

      // Textures
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

      // NO-FLASH su Babylon: applica dopo onLoadTexture
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
      (function warmTexturesForCache(){
        const urls = [...Object.values(textures.color), ...Object.values(textures.background)];
        setTimeout(() => { urls.forEach(u => { const img = new Image(); img.decoding = 'async'; img.src = u; }); }, 100);
      })();

      // UI listeners (Babylon)
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

      // ======== MODEL-VIEWER bridge ========
      const mv = document.getElementById('ar-bridge');
      if (mv) mv.setAttribute('shadow-intensity','0');

      // AirPods visibilità in MV (niente ombre)
      function setAirpodsVisibleInMV(visible) {
        try {
          if (!mv) return;
          const sceneSym = Object.getOwnPropertySymbols(mv).find(s => s.description === 'scene');
          const threeScene = mv[sceneSym];
          const root = threeScene?.children?.[0];
          if (!root) return;
          ['Airpods','airpods','Cuffie','cuffie'].forEach(n => {
            const obj = root.getObjectByName(n);
            if (obj) obj.visible = visible;
          });
          threeScene.updateShadow?.(); threeScene.queueRender?.();
        } catch {}
      }

      // Wait helpers per MV
      const waitMVLoad = () => new Promise(res => (mv?.model ? res() : mv?.addEventListener('load', res, { once:true })));
      const preloadImage = (url) => new Promise((res,rej)=>{ const im=new Image(); im.onload=()=>res(); im.onerror=rej; im.decoding='async'; im.src=url; });

      const forcePNG = (url) => {
        try { const u = new URL(url); if (u.hostname.includes('res.cloudinary.com')) u.searchParams.set('format','png'); return u.toString(); }
        catch { return url.replace('format=auto','format=png'); }
      };

      async function applyMVFromValues(values) {
        if (!mv) return;
        await waitMVLoad();

        const colorUrl = values.colorId ? textures.color[values.colorId] : null;
        const bgUrl    = values.bgId    ? textures.background[values.bgId] : null;

        const urlsToLoad = [];
        if (colorUrl) urlsToLoad.push(IS_IOS ? forcePNG(colorUrl) : colorUrl);
        if (bgUrl)    urlsToLoad.push(IS_IOS ? forcePNG(bgUrl)   : bgUrl);

        // pre-carico esplicito (sicuro per Quick Look)
        await Promise.all(urlsToLoad.map(preloadImage));

        // poi imposto le texture con createTexture() + setTexture => garantite caricate
        async function setMatTexture(materialName, url) {
          if (!url || !mv.model) return;
          const mat = mv.model.materials.find(m => m.name === materialName);
          if (!mat) return;
          const ti = mat.pbrMetallicRoughness.baseColorTexture;
          if (ti && typeof mv.createTexture === 'function' && typeof ti.setTexture === 'function') {
            const tex = await mv.createTexture(IS_IOS ? forcePNG(url) : url);
            ti.setTexture(tex);
          }
        }

        if (window.scoccaMaterials) {
          for (const mName of window.scoccaMaterials) {
            await setMatTexture(mName, colorUrl);
          }
        }
        if (window.schermoMaterial) await setMatTexture(window.schermoMaterial, bgUrl);

        setAirpodsVisibleInMV(!!values.airpodsOn);
        // un frame per assicurare che il renderer ingesti i cambi
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      }

      function getValuesFromUI() {
        return {
          colorId: document.querySelector('.color-options input:checked')?.id || DEFAULTS.colorId,
          bgId: document.querySelector('.background-options input:checked')?.id || DEFAULTS.bgId,
          airpodsOn: !!document.getElementById('toggle-airpods')?.checked
        };
      }
      function getValuesFromQueryOrDefaults() {
        const q = getQuery();
        return {
          colorId: q.color || DEFAULTS.colorId,
          bgId: q.bg || DEFAULTS.bgId,
          airpodsOn: q.airpods === null ? DEFAULTS.airpodsOn : !!q.airpods
        };
      }

      // Applica SUBITO i default (o la query) a Babylon
      (function applyInitialToBabylon(){
        const v = getValuesFromQueryOrDefaults();
        if (textures.color[v.colorId] && scoccaMaterials?.length) setAlbedo(scoccaMaterials, textures.color[v.colorId]);
        if (textures.background[v.bgId] && schermoMaterial) setAlbedo([schermoMaterial], textures.background[v.bgId]);
        // cuffie OFF di default (o da query)
        if (airpodsNode) {
          airpodsNode.setEnabled(!!v.airpodsOn);
          scene.meshes.forEach(m => {
            if (!m || m.name == null) return;
            if (/(cuffie|airpods).*(shadow|ombra)|(shadow|ombra).*(cuffie|airpods)/i.test(m.name)) m.setEnabled(!!v.airpodsOn);
          });
        }
        // e allinea anche la UI se mancavano i checked
        document.getElementById(v.colorId)?.setAttribute('checked','');
        document.getElementById(v.bgId)?.setAttribute('checked','');
        const tgl = document.getElementById('toggle-airpods'); if (tgl) tgl.checked = !!v.airpodsOn;
      })();

      // Pre-warm anche <model-viewer> (così il 1° click AR è già giusto)
      (async () => {
        const v = getValuesFromQueryOrDefaults();
        await applyMVFromValues(v);
      })();

      // Toggle cuffie (Babylon)
      const toggle = document.getElementById('toggle-airpods');
      if (airpodsNode && toggle) {
        airpodsNode.setEnabled(!!toggle.checked);
        toggle.addEventListener('change', async () => {
          airpodsNode.setEnabled(toggle.checked);
          scene.meshes.forEach(m => {
            if (!m || m.name == null) return;
            if (/(cuffie|airpods).*(shadow|ombra)|(shadow|ombra).*(cuffie|airpods)/i.test(m.name)) m.setEnabled(toggle.checked);
          });
          // allinea subito anche MV (evita “1° click glb base”)
          await applyMVFromValues(getValuesFromUI());
        });
      }

      // Click AR (desktop => QR; mobile => WebXR/Quick Look)
      const arButton = document.getElementById('ar-button');
      arButton?.addEventListener('click', async () => {
        const ua = navigator.userAgent;
        const isAndroid = /Android/i.test(ua);
        const isMobile  = isMobileUA;

        if (!isMobile) {
          const m = document.getElementById('ar-qr-modal');
          const box = document.getElementById('qr-code');
          if (m && box && window.QRCode) {
            box.innerHTML = '';
            new QRCode(box, { text: buildArShareUrlFromValues(getValuesFromUI()), width: 220, height: 220 });
            m.style.display = 'block';
          } else if (m) { m.style.display = 'block'; }
          return;
        }

        // Android WebXR se disponibile
        try {
          if (isAndroid && navigator.xr && await navigator.xr.isSessionSupported('immersive-ar')) {
            await scene.createDefaultXRExperienceAsync({
              uiOptions: { sessionMode: 'immersive-ar' },
              optionalFeatures: ['hit-test', 'dom-overlay'],
              referenceSpaceType: 'local-floor'
            });
            return;
          }
        } catch (err) { console.warn('WebXR non disponibile, fallback:', err); }

        // Fallback iOS/Android Scene Viewer via <model-viewer>
        try {
          // iOS: niente ios-src per far esportare USDZ dallo stato runtime
          if (IS_IOS && mv?.hasAttribute('ios-src')) mv.removeAttribute('ios-src');
          await applyMVFromValues(getValuesFromUI()); // <<< qui: config caricata e bindata
          await mv.activateAR();
        } catch (e) {
          console.error('Fallback AR fallito:', e);
          alert('AR non disponibile su questo dispositivo/navigatore.');
        }
      });

      function buildArShareUrlFromValues({colorId, bgId, airpodsOn}) {
        const url = new URL(location.href);
        url.searchParams.set('ar','1');
        url.searchParams.set('color', colorId);
        url.searchParams.set('bg', bgId);
        url.searchParams.set('airpods', airpodsOn ? '1' : '0');
        return url.toString();
      }

      // -------- Deep-link da QR: auto-AR con overlay tap (se blocco gesture) --------
      (function handleDeepLink() {
        const q = getQuery();
        if (!isMobileUA) return;

        // UI coerente (senza dispatch di change)
        if (q.color) document.getElementById(q.color)?.setAttribute('checked','');
        if (q.bg)    document.getElementById(q.bg)?.setAttribute('checked','');
        const tgl = document.getElementById('toggle-airpods');
        if (tgl && q.airpods !== null) tgl.checked = !!q.airpods;

        // Abbina subito Babylon
        (function applyBabylonFromQuery(){
          const v = getValuesFromQueryOrDefaults();
          if (textures.color[v.colorId] && scoccaMaterials?.length) setAlbedo(scoccaMaterials, textures.color[v.colorId]);
          if (textures.background[v.bgId] && schermoMaterial) setAlbedo([schermoMaterial], textures.background[v.bgId]);
          if (airpodsNode) {
            airpodsNode.setEnabled(!!v.airpodsOn);
            scene.meshes.forEach(m => {
              if (!m || m.name == null) return;
              if (/(cuffie|airpods).*(shadow|ombra)|(shadow|ombra).*(cuffie|airpods)/i.test(m.name)) m.setEnabled(!!v.airpodsOn);
            });
          }
        })();

        if (!q.ar) return;

        let overlay = null;
        function showOverlay() {
          if (overlay) return;
          overlay = document.createElement('div');
          overlay.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35);backdrop-filter:saturate(140%) blur(2px);z-index:9999;cursor:pointer;';
          overlay.innerHTML = '<div style="background:#fff;border-radius:16px;padding:14px 16px;font:600 16px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.18)">Tocca per aprire la Realtà Aumentata</div>';
          overlay.addEventListener('pointerdown', async () => {
            try { await launchAR(true); } finally { overlay?.remove(); overlay=null; }
          }, { once:true });
          document.body.appendChild(overlay);
        }

        async function launchAR(fromGesture=false){
          try {
            if (IS_IOS && mv?.hasAttribute('ios-src')) mv.removeAttribute('ios-src');
            await applyMVFromValues(getValuesFromQueryOrDefaults()); // <<< applico quella del QR
            await mv.activateAR();
          } catch (e1) {
            // piccolo retry
            await new Promise(r => setTimeout(r, 180));
            try { await mv.activateAR(); } catch(e2){
              if (!fromGesture) showOverlay(); // chiedi il tap se serve gesto
            }
          }
        }

        // Prova auto-launch appena MV è pronto; altrimenti mostra overlay
        (async () => {
          await waitMVLoad();
          try { await launchAR(false); } catch { showOverlay(); }
        })();
      })();

    }, (progress) => {
      if (progress.total > 0) console.log('Progresso: ', Math.round(progress.loaded / progress.total * 100) + '%');
    }, (error) => {
      console.error('ERRORE CARICAMENTO:', error.message);
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
    if (!modal) return;
    const x = modal.querySelector('.qr-close');
    x && x.addEventListener('click', () => { modal.style.display = 'none'; });
  })();
});
