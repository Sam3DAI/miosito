// configuratori-3d-2d.js — build 2025-08-21 (Sam) — Sync AR <-> Config FIX
document.addEventListener('DOMContentLoaded', () => {
  /* ===========================
   *   SEZIONE: VARIABILI BASE
   * =========================== */
  const body = document.body;
  const header = document.querySelector('header');
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const themeToggle = document.querySelector('.theme-toggle');
  const sunIcon = document.querySelector('.theme-icon.sun');
  const moonIcon = document.querySelector('.theme-icon.moon');
  const arButton = document.getElementById('ar-button');
  const mv = document.getElementById('ar-bridge'); // <model-viewer>
  const IS_MOBILE = /Android|iPhone|iPad/i.test(navigator.userAgent);
  const IS_ANDROID = /Android/i.test(navigator.userAgent);
  const IS_IOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);

  // Mappa texture centralizzata (id radio -> URL)
  const TEXTURES = {
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

  // Stato configuratore (sempre coerente con i controlli)
  const state = {
    colorId: null,
    bgId: null,
    airpodsOn: true
  };

  // Utility: trova l'id selezionato scorrendo TUTTI i radio e filtrando per quelli noti
  function getCheckedIdFrom(keys) {
    // 1) prova via attribute name
    const anyChecked = Array.from(document.querySelectorAll('input[type="radio"]:checked'));
    const byId = anyChecked.map(r => r.id).find(id => keys.includes(id));
    if (byId) return byId;
    // 2) fallback: tra tutti i radio, prendi il checked che ha id nei keys
    for (const id of keys) {
      const el = document.getElementById(id);
      if (el && el.checked) return id;
    }
    // 3) default al primo key
    return keys[0];
  }

  function readStateFromUI() {
    state.colorId = getCheckedIdFrom(Object.keys(TEXTURES.color));
    state.bgId    = getCheckedIdFrom(Object.keys(TEXTURES.background));
    const tgl = document.getElementById('toggle-airpods');
    state.airpodsOn = tgl ? !!tgl.checked : true;
    return { ...state };
  }

  function applyStateToUI({ colorId, bgId, airpodsOn }) {
    if (colorId) {
      const el = document.getElementById(colorId);
      if (el && el.type === 'radio') {
        el.checked = true;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    if (bgId) {
      const el = document.getElementById(bgId);
      if (el && el.type === 'radio') {
        el.checked = true;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    const tgl = document.getElementById('toggle-airpods');
    if (tgl && typeof airpodsOn === 'boolean') {
      const prev = !!tgl.checked;
      tgl.checked = airpodsOn;
      if (prev !== airpodsOn) tgl.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function getQuery() {
    const q = new URLSearchParams(location.search);
    return {
      ar: q.get('ar') === '1',
      colorId: q.get('color'),
      bgId: q.get('bg'),
      airpodsOn: q.get('airpods') === '1'
    };
  }

  function buildArShareUrl() {
    const url = new URL(location.href);
    const { colorId, bgId, airpodsOn } = readStateFromUI();
    url.searchParams.set('ar', '1');
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
    } catch {
      return url.replace('format=auto','format=png');
    }
  }

  /* ===========================
   *   SEZIONE: HEADER e MENU
   * =========================== */
  (function setupArButtonUI() {
    const arBtn = arButton;
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

  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 8);
    if (y < lastY && hamburger?.classList.contains('active')) setMobileState(false);
    lastY = y;
  }, { passive: true });

  /* ===========================
   *   SEZIONE: TEMA
   * =========================== */
  const THEME_KEY = 'svx-theme';
  const mediaDark = window.matchMedia('(prefers-color-scheme: dark)');
  function currentTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return mediaDark.matches ? 'dark' : 'light';
  }

  let statsChart = null;
  function getAxisLabelColor(){ return body.classList.contains('dark-mode') ? '#f5f5f7' : '#1d1d1f'; }
  function updateChartTheme() {
    if (!statsChart) return;
    statsChart.updateOptions({
      xaxis: { labels: { style: { colors: getAxisLabelColor(), fontSize: '14px' } } },
      yaxis: { labels: { style: { colors: getAxisLabelColor(), fontSize: '14px' } } }
    }, false, true);
  }

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

  /* ===========================
   *   SEZIONE: 2D + CHART
   * =========================== */
  (function initConfigurator2D() {
    const img = document.getElementById('product-image-2d');
    if (!img) return;
    document.querySelectorAll('input[type="radio"]').forEach(r => {
      r.addEventListener('change', () => {
        const next = r.nextElementSibling?.getAttribute('data-image');
        if (next && img) {
          img.style.opacity = '0';
          const tmp = new Image();
          tmp.onload = () => { img.src = next; img.alt = `Prodotto Configurabile 2D - ${r.value}`; img.style.opacity = '1'; };
          tmp.src = next;
        }
      });
    });
  })();

  (function initStatsChart() {
    if (typeof ApexCharts === 'undefined') return;
    const target = document.querySelector('#stats-chart');
    if (!target) return;
    const options = () => ({
      chart: { type: 'radar', height: 330, toolbar: { show: false }, animations: { enabled: true } },
      series: [{ name: 'Impatto', data: [90, 85, 88, 92] }],
      labels: ['Tempo Sviluppo', 'Tasso di Conversione', 'Costi Manutenzione', 'Soddisfazione Clienti'],
      xaxis: { labels: { style: { colors: getAxisLabelColor(), fontSize: '14px' } } },
      yaxis: {
        show: true, tickAmount: 4, min: 0, max: 100,
        labels: { formatter: (v) => (v % 25 === 0 ? v : ''), style: { colors: getAxisLabelColor(), fontSize: '12px' } }
      },
      dataLabels: { enabled: false }, stroke: { width: 2 }, fill: { opacity: 0.2 }, markers: { size: 3 },
      grid: { show: false }, colors: ['#45b6fe']
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

  /* ===========================
   *   SEZIONE: BABYLON 3D
   * =========================== */
  let engine = null;
  let camera = null;
  let setPivot = () => {};
  let setAlbedo = () => {};
  let applyBabylonFromState = () => {};
  let airpodsNodeRef = null;

  (function initBabylon() {
    const canvas = document.getElementById('renderCanvas');
    if (!canvas) return;

    canvas.addEventListener('contextmenu', e => e.preventDefault());

    engine = new BABYLON.Engine(canvas, true, {
      antialias: true,
      adaptToDeviceRatio: true,
      alpha: false,
      preserveDrawingBuffer: true,
      stencil: true
    });

    const scene = new BABYLON.Scene(engine);
    babylonScene = scene;

    // Processing OFF per non alterare bg
    scene.imageProcessingConfiguration.toneMappingEnabled = false;
    scene.imageProcessingConfiguration.exposure = 1.0;
    scene.imageProcessingConfiguration.isEnabled = false;

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
    camera = new BABYLON.ArcRotateCamera("camera", Math.PI, Math.PI / 2, 1.2, BABYLON.Vector3.Zero(), scene);
    const isMob = IS_MOBILE;
    camera.wheelDeltaPercentage = isMob ? 0.01 : 0.02;
    camera.pinchDeltaPercentage = 0.01;
    camera.useNaturalPinchZoom = true;
    camera.inertia = 0.88;
    camera.panningInertia = 0.85;
    camera.minZ = 0.01;

    const pi = camera.inputs.attached.pointers;
    if (pi) {
      pi.buttons = [0, 1, 2];
      pi.useCtrlForPanning = false;
      pi.panningMouseButton = 2; // RMB = pan
    }
    camera.panningSensibility = 2000;
    camera.attachControl(canvas, true, false, true);

    // Autorotate soft
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
    setPivot = (p) => { pivot = p; };

    // Carica GLB
    BABYLON.SceneLoader.ImportMesh('', './assets/', 'iphone_16_pro_configuratore_3d.glb', scene, (meshes) => {
      const iphoneNode =
        scene.getTransformNodeByName('iphone') ||
        scene.getNodeByName('iphone') || meshes[0];

      const airpodsNode =
        scene.getNodeByName('Airpods') || scene.getNodeByName('airpods') ||
        scene.getNodeByName('Cuffie')  || scene.getNodeByName('cuffie')  ||
        scene.getTransformNodeByName('Airpods');

      airpodsNodeRef = airpodsNode || null;

      // Pivot e framing
      const printable = meshes.filter(m => m.getBoundingInfo);
      const { center, maxDim } = computeBounds(iphoneNode?.getChildMeshes ? iphoneNode.getChildMeshes() : printable);
      const pv = new BABYLON.TransformNode('pivot', scene);
      pv.setAbsolutePosition(center);
      if (iphoneNode)  iphoneNode.setParent(pv);
      if (airpodsNode) airpodsNode.setParent(pv);
      setPivot(pv);
      frameCamera(camera, center, maxDim);

      // Material names (Babylon)
      const allMaterials = scene.materials;
      const scoccaMaterials = allMaterials
        .filter(m => /scocca|retro|pulsanti|box|bordi|dettagli/i.test(m.name))
        .map(m => m.name);
      const schermoMaterial = allMaterials.find(m => /schermo|screen|display|lcd/i.test(m.name))?.name;

      // Setter Babylon (nessun preload/prefetch)
      setAlbedo = function(materialNames, url) {
        const tex = new BABYLON.Texture(url, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
        tex.wrapU = tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
        materialNames.forEach(name => {
          const mat = scene.getMaterialByName(name);
          if (mat) mat.albedoTexture = tex;
        });
      };

      // Applica stato attuale a Babylon (usato anche prima di AR)
      applyBabylonFromState = function() {
        const { colorId, bgId, airpodsOn } = readStateFromUI();
        const colorUrl = TEXTURES.color[colorId];
        const bgUrl    = TEXTURES.background[bgId];
        if (colorUrl && scoccaMaterials?.length) setAlbedo(scoccaMaterials, colorUrl);
        if (bgUrl && schermoMaterial) setAlbedo([schermoMaterial], bgUrl);
        if (airpodsNodeRef) {
          airpodsNodeRef.setEnabled(!!airpodsOn);
          // fallback: spegni eventuali mesh-ombra delle cuffie
          scene.meshes.forEach(m => {
            if (!m || !m.name) return;
            if (/(cuffie|airpods).*(shadow|ombra)|(shadow|ombra).*(cuffie|airpods)/i.test(m.name)) {
              m.setEnabled(!!airpodsOn);
            }
          });
        }
      };

      // Listeners UI (radio/toggle) — indipendenti dai wrapper
      document.querySelectorAll('input[type="radio"]').forEach(input => {
        input.addEventListener('change', () => {
          const id = input.id;
          if (id in TEXTURES.color && scoccaMaterials?.length) {
            setAlbedo(scoccaMaterials, TEXTURES.color[id]);
          }
          if (id in TEXTURES.background && schermoMaterial) {
            setAlbedo([schermoMaterial], TEXTURES.background[id]);
          }
        });
      });
      const toggle = document.getElementById('toggle-airpods');
      if (toggle && airpodsNodeRef) {
        airpodsNodeRef.setEnabled(!!toggle.checked);
        toggle.addEventListener('change', () => {
          airpodsNodeRef.setEnabled(!!toggle.checked);
          scene.meshes.forEach(m => {
            if (!m || !m.name) return;
            if (/(cuffie|airpods).*(shadow|ombra)|(shadow|ombra).*(cuffie|airpods)/i.test(m.name)) {
              m.setEnabled(!!toggle.checked);
            }
          });
        });
      }

      /* ------- SYNC <model-viewer> dai controlli ------- */
      async function syncMVFromState() {
        if (!mv) return;
        await mv.updateComplete;
        if (!mv.model) return;

        // Individua materiali <= model-viewer con regex (indipendente da Babylon)
        const mvMaterials = mv.model.materials || [];
        const mvScocca = mvMaterials.filter(m => /scocca|retro|pulsanti|box|bordi|dettagli/i.test(m.name));
        const mvSchermo = mvMaterials.find(m => /schermo|screen|display|lcd/i.test(m.name));

        const { colorId, bgId, airpodsOn } = readStateFromUI();
        const colorUrl = colorId ? cloudinaryForcePNG(TEXTURES.color[colorId]) : null;
        const bgUrl    = bgId    ? cloudinaryForcePNG(TEXTURES.background[bgId]) : null;

        async function applyBaseColorTextureToMaterial(mat, url) {
          if (!mat || !url) return;
          const slot = mat.pbrMetallicRoughness.baseColorTexture;
          const tex  = await mv.createTexture(url);
          if (slot) slot.setTexture(tex);
        }

        // Applica scocca
        for (const mat of mvScocca) await applyBaseColorTextureToMaterial(mat, colorUrl);
        // Applica schermo
        if (mvSchermo) await applyBaseColorTextureToMaterial(mvSchermo, bgUrl);

        // Cuffie ON/OFF in AR (material-based fallback)
        const shouldHide = (name) => {
          const n = (name || '').toLowerCase();
          return /(cuffie|airpods)/i.test(n) || /bianco lucido|gomma|parti_scure cuffie/.test(n);
        };
        mvMaterials.forEach(mat => {
          if (!shouldHide(mat.name)) return;
          try { mat.setAlphaMode(airpodsOn ? 'BLEND' : 'MASK'); } catch {}
          if (!airpodsOn) {
            mat.alphaCutoff = 1.0;
            mat.pbrMetallicRoughness.setBaseColorFactor([1,1,1,0]);
            mat.pbrMetallicRoughness.metallicFactor = 0;
            mat.pbrMetallicRoughness.roughnessFactor = 1;
          } else {
            mat.pbrMetallicRoughness.setBaseColorFactor([1,1,1,1]);
          }
        });
      }

      // === CLICK AR (desktop & mobile) ===
      if (arButton) {
        arButton.addEventListener('click', async () => {
          // Applica SEMPRE lo stato prima di AR
          applyBabylonFromState();

          // Desktop: genera QR con stato incorporato
          if (!IS_MOBILE) {
            const m = document.getElementById('ar-qr-modal');
            const box = document.getElementById('qr-code');
            if (m) {
              if (box && window.QRCode) {
                box.innerHTML = '';
                new QRCode(box, { text: buildArShareUrl(), width: 220, height: 220 });
              }
              m.style.display = 'block';
            }
            return;
          }

          // Mobile:
          // 1) Prova WebXR (Android) = usa la scena Babylon con stato già applicato
          try {
            if (IS_ANDROID && navigator.xr && await navigator.xr.isSessionSupported('immersive-ar')) {
              await babylonScene.createDefaultXRExperienceAsync({
                uiOptions: { sessionMode: 'immersive-ar' },
                optionalFeatures: ['hit-test', 'dom-overlay'],
                referenceSpaceType: 'local-floor'
              });
              return;
            }
          } catch (err) {
            console.warn('WebXR non disponibile, si passa a <model-viewer>:', err);
          }

          // 2) Fallback <model-viewer> (Scene Viewer / Quick Look)
          try {
            await syncMVFromState();
            // micro-pausa per sicurezza prima dell'AR
            await new Promise(r => setTimeout(r, 60));
            await mv.activateAR();
          } catch (e) {
            console.error('AR fallback errore:', e);
            alert('AR non disponibile su questo dispositivo/navigatore.');
          }
        });
      }

      // === DEEP LINK via QR: ripristina stato e, se richiesto, avvia AR ===
      (function handleQRDeepLink() {
        const q = getQuery();
        const hasState = !!(q.colorId || q.bgId || typeof q.airpodsOn === 'boolean');
        if (hasState) {
          // Scrivi lo stato e applica a Babylon
          applyStateToUI({
            colorId: q.colorId || state.colorId || 'bianco',
            bgId: q.bgId || state.bgId || 'sfondo-nero-bronzo',
            airpodsOn: typeof q.airpodsOn === 'boolean' ? q.airpodsOn : true
          });
          applyBabylonFromState();
        }
        if (q.ar && IS_MOBILE) {
          // Avvia AR rispettando il flusso attuale
          arButton && arButton.click();
        }
      })();

      // Applica stato iniziale alla prima renderizzazione
      readStateFromUI();
      applyBabylonFromState();

    }, undefined, (error) => {
      console.error('ERRORE CARICAMENTO GLB:', error?.message || error);
    });

    // Render loop + resize
    engine.runRenderLoop(() => babylonScene && babylonScene.render());
    window.addEventListener('resize', () => engine.resize());
  })();

  /* ===========================
   *   SEZIONE: MODALE QR
   * =========================== */
  (function initQrModalClose() {
    const modal = document.getElementById('ar-qr-modal');
    if (!modal) return;
    const x = modal.querySelector('.qr-close');
    if (x) x.addEventListener('click', () => { modal.style.display = 'none'; });
    // chiudi anche cliccando il backdrop
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  })();

  /* ===========================
   *   PREFETCH LINK INTERNI
   * =========================== */
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
});
