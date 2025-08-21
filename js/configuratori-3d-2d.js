// configuratori-3d-2d.js — build 2025-08-21 (Sam) — AR fix + QR sync + autorotate dt
document.addEventListener('DOMContentLoaded', () => {
  /* ---------------------------------
   * Selettori base / header / tema
   * --------------------------------- */
  const body = document.body;
  const header = document.querySelector('header');
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const themeToggle = document.querySelector('.theme-toggle');
  const sunIcon = document.querySelector('.theme-icon.sun');
  const moonIcon = document.querySelector('.theme-icon.moon');

  /* ---------------------------------
   * Pulsante AR (icona + hover)
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

  /* ---------------------------------
   * Menu mobile + scroll lock
   * --------------------------------- */
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
    hamburger.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(); }
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

  let statsChart = null;
  function getAxisLabelColor(){ return body.classList.contains('dark-mode') ? '#f5f5f7' : '#1d1d1f'; }

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    body.classList.toggle('dark-mode', isDark);
    themeToggle?.setAttribute('aria-pressed', String(isDark));
    if (sunIcon && moonIcon) {
      sunIcon.style.display = isDark ? 'none' : 'block';
      moonIcon.style.display = isDark ? 'block' : 'none';
    }
    // Lo sfondo e il 3D vengono sincronizzati più avanti quando la scena è pronta
  }
  applyTheme(currentTheme());
  themeToggle?.addEventListener('click', () => {
    const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, newTheme);
    applyTheme(newTheme);
    // background canvas sincronizzato dal blocco Babylon
    document.getElementById('renderCanvas')?.dispatchEvent(new Event('svx-theme-change'));
  });
  mediaDark.addEventListener('change', (e) => {
    if (!localStorage.getItem(THEME_KEY)) {
      applyTheme(e.matches ? 'dark' : 'light');
      document.getElementById('renderCanvas')?.dispatchEvent(new Event('svx-theme-change'));
    }
  });

  /* ---------------------------------
   * Lazy-bg card
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
   * ApexCharts (bar chart – non altero il tuo stile)
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
      series: [{ data: [82, 94, 66, 40] }],
      xaxis: {
        categories: ['Engagement Utenti', 'Tasso di Conversione', 'Soddisfazione Clienti', 'Riduzione Resi'],
        labels: { style: { colors: getAxisLabelColor(), fontSize: '14px' } },
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
   * Babylon.js configuratore 3D + AR
   * --------------------------------- */
  const canvas = document.getElementById('renderCanvas');
  let babylonScene = null;

  // QR & stato configuratore
  function getQuery() {
    const q = new URLSearchParams(location.search);
    return {
      ar: q.get('ar') === '1',
      color: q.get('color'),
      bg: q.get('bg'),
      airpods: q.get('airpods') === '1',
      hasAirpodsParam: q.has('airpods')
    };
  }
  function getCurrentConfig() {
    const colorId = document.querySelector('.color-options input:checked')?.id || document.querySelector('.color-options input')?.id || 'bianco';
    const bgId    = document.querySelector('.background-options input:checked')?.id || document.querySelector('.background-options input')?.id || 'sfondo-nero-blu';
    const airpodsOn = !!document.getElementById('toggle-airpods')?.checked;
    return { colorId, bgId, airpodsOn };
  }
  function buildArShareUrl() {
    const base = new URL(location.pathname, location.origin);
    const { colorId, bgId, airpodsOn } = getCurrentConfig();
    base.searchParams.set('ar','1');
    base.searchParams.set('color', colorId);
    base.searchParams.set('bg', bgId);
    base.searchParams.set('airpods', airpodsOn ? '1' : '0');
    return base.toString();
  }

  // Selettori texture (Cloudinary)
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

  // Selettori materiali per <model-viewer>
  function matchScocca(name){ return /scocca|retro|pulsanti|box|bordi|dettagli/i.test(name || ''); }
  function matchSchermo(name){ return /schermo|screen/i.test(name || ''); }

  function selectDefaultIfNone(selector) {
    const inputs = Array.from(document.querySelectorAll(selector));
    if (!inputs.length) return;
    if (!inputs.some(i => i.checked)) {
      const first = inputs[0];
      first.checked = true;
      first.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  if (canvas) {
    // Disabilita menu RMB (lo uso per pan)
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    const engine = new BABYLON.Engine(canvas, true, {
      antialias: true,
      adaptToDeviceRatio: true,
      alpha: false, // canvas opaco = colore identico allo sfondo pagina
      preserveDrawingBuffer: true,
      stencil: true
    });

    // Scena e post
    const scene = new BABYLON.Scene(engine);
    babylonScene = scene;

    // No tone mapping per non alterare lo sfondo
    scene.imageProcessingConfiguration.toneMappingEnabled = false;
    scene.imageProcessingConfiguration.exposure = 1.0;
    scene.imageProcessingConfiguration.isEnabled = false;

    // Background in sync con tema
    function updateBackground() {
      const isDark = body.classList.contains('dark-mode');
      const bg = isDark ? '#000000' : '#FAFAFA';
      canvas.style.backgroundColor = bg;
      canvas.parentElement && (canvas.parentElement.style.backgroundColor = bg);
      const c = BABYLON.Color3.FromHexString(bg);
      scene.clearColor = new BABYLON.Color4(c.r, c.g, c.b, 1);
    }
    updateBackground();
    canvas.addEventListener('svx-theme-change', updateBackground);

    // Luci
    new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene).intensity = 0.4;
    const dirLight = new BABYLON.DirectionalLight("dir", new BABYLON.Vector3(-1, -2, -1), scene);
    dirLight.position = new BABYLON.Vector3(5, 10, 5);
    dirLight.intensity = 0.5;
    new BABYLON.PointLight("pt", new BABYLON.Vector3(-3, 2, 0), scene).intensity = 0.3;

    // Camera
    const camera = new BABYLON.ArcRotateCamera("cam", Math.PI, Math.PI / 2, 1.2, BABYLON.Vector3.Zero(), scene);
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    camera.wheelDeltaPercentage = isMobile ? 0.01 : 0.02;
    camera.pinchDeltaPercentage = 0.01;
    camera.useNaturalPinchZoom = true;
    camera.inertia = 0.88;
    camera.panningInertia = 0.85;
    camera.minZ = 0.01;

    // Pan con tasto destro (PRIMA dell’attach)
    const pi = camera.inputs.attached.pointers;
    if (pi) {
      pi.buttons = [0, 1, 2];
      pi.useCtrlForPanning = false;
      pi.panningMouseButton = 2; // RMB = pan
    }
    camera.panningSensibility = 2000;
    camera.attachControl(canvas, true, false, true);

    // Autorotate basato su deltaTime (stessa velocità su PC e smartphone)
    let pivot = null;
    let userInteracted = false;
    const ROT_SPEED_RAD_PER_SEC = 0.35; // regola qui la velocità
    scene.onBeforeRenderObservable.add(() => {
      if (!pivot || userInteracted) return;
      const dt = scene.getEngine().getDeltaTime(); // ms
      pivot.rotate(BABYLON.Axis.Y, ROT_SPEED_RAD_PER_SEC * (dt / 1000), BABYLON.Space.LOCAL);
    });
    canvas.addEventListener('pointerdown', () => {
      userInteracted = true;
      setTimeout(() => { userInteracted = false; }, 3000);
    });

    // Ambiente + post
    scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
      'https://assets.babylonjs.com/environments/studio.env', scene
    );
    scene.environmentIntensity = 0.6;
    const pipeline = new BABYLON.DefaultRenderingPipeline("default", true, scene, [camera]);
    pipeline.bloomEnabled   = true;
    pipeline.bloomThreshold = 1.0;
    pipeline.bloomWeight    = 0.25;
    pipeline.fxaaEnabled    = true;
    pipeline.samples        = 8;

    // Helpers bounding
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

    // Carico GLB
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

      // Pivot centrato e framing
      const printable = meshes.filter(m => m.getBoundingInfo);
      const { center, maxDim } = computeBounds(iphoneNode?.getChildMeshes ? iphoneNode.getChildMeshes() : printable);
      pivot = new BABYLON.TransformNode('pivot', scene);
      pivot.setAbsolutePosition(center);
      if (iphoneNode)  iphoneNode.setParent(pivot);
      if (airpodsNode) airpodsNode.setParent(pivot);
      frameCamera(camera, center, maxDim);

      // Material mapping
      const allMaterials = scene.materials;
      const scoccaMaterials = allMaterials.filter(m => matchScocca(m.name)).map(m => m.name);
      const schermoMaterial = allMaterials.find(m => matchSchermo(m.name))?.name;
      window.scoccaMaterials = scoccaMaterials;
      window.schermoMaterial = schermoMaterial;

      // Set albedo helper
      function setAlbedo(materialNames, url) {
        const tex = new BABYLON.Texture(url, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
        tex.wrapU = tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
        materialNames.forEach(name => {
          const mat = scene.getMaterialByName(name);
          if (mat) mat.albedoTexture = tex;
        });
      }

      // UI (colori/sfondo)
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

      // Toggle cuffie: OFF = nodo intero disabilitato (no ombra)
      const toggle = document.getElementById('toggle-airpods');
      if (airpodsNode && toggle) {
        airpodsNode.setEnabled(!!toggle.checked);
        toggle.addEventListener('change', () => {
          airpodsNode.setEnabled(toggle.checked);
          // eventuali mesh "shadow/ombra" delle cuffie
          scene.meshes.forEach(m => {
            if (!m?.name) return;
            if (/(cuffie|airpods).*(shadow|ombra)|(shadow|ombra).*(cuffie|airpods)/i.test(m.name)) {
              m.setEnabled(toggle.checked);
            }
          });
        });
      }

      /* -------- AR (WebXR + model-viewer + Intent) -------- */
      const mv = document.getElementById('ar-bridge');
      const arButton = document.getElementById('ar-button');
      const IS_ANDROID = /Android/i.test(navigator.userAgent);
      const IS_IOS     = /iPad|iPhone|iPod/i.test(navigator.userAgent);
      const IS_MOBILE  = /Android|iPhone|iPad/i.test(navigator.userAgent);

      function cloudinaryForcePNG(url) {
        if (!IS_IOS) return url;
        try {
          const u = new URL(url);
          if (u.hostname.includes('res.cloudinary.com')) u.searchParams.set('format', 'png');
          return u.toString();
        } catch { return url.replace('format=auto','format=png'); }
      }

      async function ensureMVReady() {
        if (!mv) return;
        if (mv.model) return;
        await new Promise(resolve => mv.addEventListener('load', resolve, { once: true }));
      }

      async function syncMVFromPageState() {
        if (!mv) return;
        await ensureMVReady();

        const colorId = document.querySelector('.color-options input:checked')?.id;
        const bgId    = document.querySelector('.background-options input:checked')?.id;
        const colorUrl = colorId ? cloudinaryForcePNG(textures.color[colorId]) : null;
        const bgUrl    = bgId    ? cloudinaryForcePNG(textures.background[bgId]) : null;

        const mats = mv.model?.materials || [];
        const makeTex = async (url) => url ? await mv.createTexture(url) : null;
        const colorTex = await makeTex(colorUrl);
        const bgTex    = await makeTex(bgUrl);

        mats.forEach(mat => {
          if (!mat?.pbrMetallicRoughness) return;
          if (bgTex && matchSchermo(mat.name)) {
            try { mat.pbrMetallicRoughness.setBaseColorTexture(bgTex); } catch {}
          }
          if (colorTex && matchScocca(mat.name)) {
            try { mat.pbrMetallicRoughness.setBaseColorTexture(colorTex); } catch {}
          }
        });

        // Cuffie ON/OFF (alpha materiale)
        const on = !!document.getElementById('toggle-airpods')?.checked;
        mats.forEach(mat => {
          const n = (mat.name || '').toLowerCase();
          const isCuffia = /(cuffie|airpods|earbud|earbuds|headphone)/i.test(n);
          if (!isCuffia) return;
          try { mat.setAlphaMode(on ? 'BLEND' : 'MASK'); } catch {}
          if (!on) {
            mat.alphaCutoff = 1.0;
            try { mat.pbrMetallicRoughness.setBaseColorFactor([1,1,1,0]); } catch {}
            try { mat.pbrMetallicRoughness.metallicFactor = 0; } catch {}
            try { mat.pbrMetallicRoughness.roughnessFactor = 1; } catch {}
          } else {
            try { mat.pbrMetallicRoughness.setBaseColorFactor([1,1,1,1]); } catch {}
          }
        });
      }

      // Entrata WebXR vera (Babylon)
      async function startWebXR() {
        const xr = await scene.createDefaultXRExperienceAsync({
          uiOptions: { sessionMode: 'immersive-ar' },
          optionalFeatures: ['hit-test', 'dom-overlay'],
          referenceSpaceType: 'local-floor'
        });
        // *** Prima non entravamo in AR! ***
        await xr.baseExperience.enterXRAsync('immersive-ar', 'unbounded');
        return xr;
      }

      // Intent Scene Viewer (Android) — per auto-open con ?ar=1
      function sceneViewerIntentUrl() {
        // file dalla src del <model-viewer>
        const src = mv?.getAttribute('src') ? new URL(mv.getAttribute('src'), location.href).toString() : '';
        const fallback = new URL(location.pathname, location.origin).toString(); // pagina senza ar=1
        const url = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(src)}&mode=ar_preferred#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(fallback)};end;`;
        return url;
      }

      // Quick Look iOS — link diretto a ios-src
      function quickLookUrl() {
        const iosSrc = mv?.getAttribute('ios-src');
        if (!iosSrc) return null;
        return new URL(iosSrc, location.href).toString();
      }

      // Click AR
      arButton?.addEventListener('click', async () => {
        // Android: preferisci WebXR, fallback model-viewer
        if (IS_ANDROID) {
          try {
            if (navigator.xr && await navigator.xr.isSessionSupported('immersive-ar')) {
              await startWebXR();
              return;
            }
          } catch (err) {
            console.warn('WebXR non disponibile:', err);
          }
          // Fallback: model-viewer
          try {
            await syncMVFromPageState();
            await mv.activateAR();
            return;
          } catch (e) {
            console.error('model-viewer AR fallito:', e);
            // Ultimo fallback: Scene Viewer intent
            location.href = sceneViewerIntentUrl();
          }
          return;
        }

        // iOS
        if (IS_IOS) {
          const ql = quickLookUrl();
          if (ql) {
            // Prova ad aprire Quick Look
            location.href = ql;
            return;
          }
          alert('AR non disponibile: aggiungi ios-src al <model-viewer> o usa un dispositivo Android con WebXR.');
          return;
        }

        // Desktop: mostra QR con configurazione
        const modal = document.getElementById('ar-qr-modal');
        const box   = document.getElementById('qr-code');
        if (modal && box && window.QRCode) {
          box.innerHTML = '';
          new QRCode(box, { text: buildArShareUrl(), width: 220, height: 220 });
          modal.style.display = 'block';
        } else if (modal) {
          modal.style.display = 'block';
        }
      });

      // Default radio se mancanti (coerenza)
      selectDefaultIfNone('.color-options input[type="radio"]');
      selectDefaultIfNone('.background-options input[type="radio"]');

      // Deep link (da QR): ripristina selezioni + tenta auto-open AR
      (async function handleQR() {
        const q = getQuery();
        // Ripristino UI (color/bg/airpods)
        if (q.color) {
          const el = document.getElementById(q.color);
          if (el?.type === 'radio') { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); }
        }
        if (q.bg) {
          const el = document.getElementById(q.bg);
          if (el?.type === 'radio') { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); }
        }
        if (q.hasAirpodsParam) {
          const tgl = document.getElementById('toggle-airpods');
          if (tgl) {
            const prev = !!tgl.checked;
            tgl.checked = q.airpods;
            if (prev !== q.airpods) tgl.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }

        if (!q.ar || !IS_MOBILE) return;

        // Prova 1: Android WebXR (richiede spesso gesto; ma proviamo)
        if (IS_ANDROID && navigator.xr && await navigator.xr.isSessionSupported('immersive-ar')) {
          try { await startWebXR(); return; } catch (e) { console.warn('Auto WebXR bloccato:', e); }
        }

        // Prova 2: model-viewer.activateAR (potrebbe richiedere gesto)
        try {
          await syncMVFromPageState();
          await mv.activateAR();
          return;
        } catch (e) {
          console.warn('Auto activateAR bloccato:', e);
        }

        // Prova 3: redirect a Intent Scene Viewer (di solito parte senza gesto)
        if (IS_ANDROID) {
          location.href = sceneViewerIntentUrl();
          return;
        }

        // iOS: prova Quick Look diretto (richiede ios-src)
        if (IS_IOS) {
          const ql = quickLookUrl();
          if (ql) { location.href = ql; return; }
        }

        // Ultimo fallback: mostra un toast/banner (qui: alert semplice)
        // alert('Tocca il pulsante AR per avviare la Realtà Aumentata.');
      })();

    }, (progress) => {
      if (progress.total > 0) {
        console.log('Progresso: ', Math.round(progress.loaded / progress.total * 100) + '%');
      }
    }, (error) => {
      console.error('ERRORE CARICAMENTO GLB:', error.message);
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
    modal.querySelector('.qr-close')?.addEventListener('click', () => { modal.style.display = 'none'; });
  })();
});
