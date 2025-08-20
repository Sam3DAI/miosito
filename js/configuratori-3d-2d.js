<script>
// configuratori-3d-2d.js (versione corretta)

document.addEventListener('DOMContentLoaded', () => {
  /* =========================
   * SELETTORI E UTILITIES
   * ========================= */
  const body = document.body;
  const header = document.querySelector('header');
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const themeToggle = document.querySelector('.theme-toggle');
  const sunIcon = document.querySelector('.theme-icon.sun');
  const moonIcon = document.querySelector('.theme-icon.moon');

  const canvas = document.getElementById('renderCanvas');
  const arBtn = document.getElementById('ar-button');
  const qrModal = document.getElementById('ar-qr-modal');
  const qrBox = document.getElementById('qr-code');
  const mv = document.getElementById('ar-bridge'); // <model-viewer> invisibile (bridge AR)
  const IS_MOBILE = /Android|iPhone|iPad/i.test(navigator.userAgent);
  const IS_IOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);

  // Opzioni UI configuratore (già presenti in HTML)
  const colorRadios = document.querySelectorAll('.color-options input[name="color"]');      // bianco, grigio, bronzo, nero
  const bgRadios    = document.querySelectorAll('.background-options input[name="background"]'); // sfondo-...
  const airpodsTgl  = document.getElementById('toggle-airpods');

  // Mapping texture (come da HTML)
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

  const cloudinaryForcePNG = (url) => {
    if (!IS_IOS) return url;
    try {
      const u = new URL(url);
      if (u.hostname.includes('res.cloudinary.com')) u.searchParams.set('format', 'png');
      return u.toString();
    } catch { return url.replace('format=auto','format=png'); }
  };

  const getState = () => ({
    c: document.querySelector('.color-options input:checked')?.id || '',
    bg: document.querySelector('.background-options input:checked')?.id || '',
    hp: !!airpodsTgl?.checked
  });

  const buildArURL = () => {
    const { c, bg, hp } = getState();
    const base = `${location.origin}${location.pathname}`;
    const p = new URLSearchParams(location.search);
    p.set('ar', '1');
    if (c)  p.set('c', c);
    if (bg) p.set('bg', bg);
    p.set('hp', hp ? '1' : '0');
    return `${base}?${p.toString()}#configuratore`;
  };

  /* =========================
   * HEADER / MENU / THEME
   * ========================= */
  // Scroll header
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (window.scrollY > 8) header?.classList.add('scrolled');
        else header?.classList.remove('scrolled');
        ticking = false;
      });
      ticking = true;
    }
  });

  // Mobile menu + scroll lock
  const toggleMenu = (open) => {
    if (!mobileMenu || !hamburger) return;
    mobileMenu.hidden = !open;
    mobileMenu.classList.toggle('open', open);
    hamburger.classList.toggle('active', open);
    body.classList.toggle('no-scroll', open);
  };
  hamburger?.addEventListener('click', () => toggleMenu(!mobileMenu.classList.contains('open')));
  mobileMenu?.addEventListener('click', (e) => {
    if (e.target.matches('a')) toggleMenu(false);
  });

  // Theme toggle + icone
  themeToggle?.addEventListener('click', () => {
    const dark = body.classList.toggle('dark-mode');
    themeToggle.setAttribute('aria-pressed', String(dark));
    sunIcon && (sunIcon.style.display = dark ? 'none' : 'inline-block');
    moonIcon && (moonIcon.style.display = dark ? 'inline-block' : 'none');
    updateBabylonBackground(); // sync canvas bg
  });

  /* =========================
   * HERO / CAROUSEL (lazy bg)
   * ========================= */
  const lazyBgEls = document.querySelectorAll('.lazy-bg[data-bg]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target;
          const url = el.getAttribute('data-bg');
          if (url) el.style.backgroundImage = `url("${url}")`;
          io.unobserve(el);
        }
      });
    }, { rootMargin: '100px' });
    lazyBgEls.forEach(el => io.observe(el));
  } else {
    lazyBgEls.forEach(el => el.style.backgroundImage = `url("${el.getAttribute('data-bg')}")`);
  }

  /* =========================
   * MODAL QR – UI & DINAMICA
   * ========================= */
  (function setupQrModal() {
    if (!qrModal) return;
    // Testo titolo aggiornato
    const h3 = qrModal.querySelector('h3');
    if (h3) h3.textContent =
      'Scansiona il QR CODE con la fotocamera del tuo smartphone/tablet per simulare la scena 3D nel tuo ambiente.';

    // Pulsante "X" in alto a destra
    let closeBtn = qrModal.querySelector('.qr-close-x');
    if (!closeBtn) {
      closeBtn = document.createElement('button');
      closeBtn.className = 'qr-close-x';
      closeBtn.setAttribute('aria-label', 'Chiudi');
      closeBtn.textContent = '×';
      Object.assign(closeBtn.style, {
        position: 'absolute', top: '10px', right: '12px',
        background: 'transparent', border: 'none', fontSize: '22px',
        color: '#3FA9F5', cursor: 'pointer', lineHeight: 1
      });
      qrModal.appendChild(closeBtn);
    }
    closeBtn.addEventListener('click', () => qrModal.style.display = 'none');

    // Stili contenitore per centraggio perfetto
    Object.assign(qrModal.style, {
      display: 'none', position: 'fixed', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)', background: '#fff',
      padding: '18px 20px 22px', borderRadius: '12px',
      textAlign: 'center', zIndex: 1000, width: 'min(92vw, 360px)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
    });
    if (body.classList.contains('dark-mode')) qrModal.style.background = '#0b0b0b';

    // (Ri)genera il QR con lo stato corrente
    const renderQR = () => {
      if (!qrBox) return;
      qrBox.innerHTML = '';
      const url = buildArURL();
      new QRCode(qrBox, { text: url, width: 220, height: 220 });
      // Centro e margini
      Object.assign(qrBox.style, { display: 'flex', justifyContent: 'center', marginTop: '8px' });
    };

    // Genera subito e ad ogni cambio opzione
    renderQR();
    [...colorRadios, ...bgRadios].forEach(i => i.addEventListener('change', renderQR));
    airpodsTgl?.addEventListener('change', renderQR);

    // Apri modal su desktop
    arBtn?.addEventListener('click', () => {
      if (!IS_MOBILE) {
        renderQR();
        qrModal.style.display = 'block';
      }
    });
  })();

  /* =========================
   * BABYLON – CONFIGURATORE 3D
   * ========================= */
  let engine, scene, camera, pivot = null;
  let babylonTexCache = new Map();
  let scoccaMaterials = [];
  let schermoMaterial = null;
  let airpodsNode = null;

  function updateBabylonBackground() {
    if (!scene || !canvas) return;
    const isDark = body.classList.contains('dark-mode');
    const bg = isDark ? '#000000' : '#FAFAFA';
    canvas.style.backgroundColor = bg;
    const container = canvas.parentElement;
    if (container) container.style.backgroundColor = bg;
    const c3 = BABYLON.Color3.FromHexString(bg);
    scene.clearColor = new BABYLON.Color4(c3.r, c3.g, c3.b, 1);
  }

  if (canvas && window.BABYLON) {
    // blocco context-menu per abilitare pan col destro
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    engine = new BABYLON.Engine(canvas, true, {
      antialias: true,
      adaptToDeviceRatio: true,
      alpha: false,              // canvas opaco, colore identico allo sfondo
      preserveDrawingBuffer: true,
      stencil: true
    });
    scene = new BABYLON.Scene(engine);
    scene.imageProcessingConfiguration.toneMappingEnabled = false;
    scene.imageProcessingConfiguration.exposure = 1.0;

    // Luci
    new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene).intensity = 0.4;
    const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, -1), scene);
    dirLight.position = new BABYLON.Vector3(5, 10, 5);
    dirLight.intensity = 0.5;
    new BABYLON.PointLight("pointLight", new BABYLON.Vector3(-3, 2, 0), scene).intensity = 0.3;

    // Camera
    camera = new BABYLON.ArcRotateCamera("camera", Math.PI, Math.PI / 2, 1.2, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true, false, true);
    camera.wheelDeltaPercentage = IS_MOBILE ? 0.01 : 0.02;
    camera.pinchDeltaPercentage = 0.01;
    camera.useNaturalPinchZoom = true;
    camera.inertia = 0.88;
    camera.panningInertia = 0.85;
    camera.minZ = 0.01;

    // Mappa tasto destro = pan (no CTRL)
    const pi = camera.inputs.attached.pointers;
    if (pi) {
      pi.buttons = [0, 1, 2];      // abilita tutti i pulsanti
      pi.useCtrlForPanning = false;
      pi.panningMouseButton = 2;   // destro = pan
    }
    camera.panningSensibility = 2000;

    // Autorotate dolce
    let isRotating = true;
    let autoRotateTimer = null;
    scene.onBeforeRenderObservable.add(() => { if (isRotating && pivot) pivot.rotate(BABYLON.Axis.Y, 0.003, BABYLON.Space.LOCAL); });
    canvas.addEventListener('pointerdown', () => {
      isRotating = false;
      clearTimeout(autoRotateTimer);
      autoRotateTimer = setTimeout(() => isRotating = true, 3000);
    });

    // Env map + pipeline soft
    scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
      "https://assets.babylonjs.com/environments/studio.env", scene
    );
    scene.environmentIntensity = 0.6;
    const pipeline = new BABYLON.DefaultRenderingPipeline("default", true, scene, [camera]);
    pipeline.bloomEnabled = true; pipeline.bloomThreshold = 0.8; pipeline.bloomWeight = 0.3;
    pipeline.sharpenEnabled = true; pipeline.sharpen.edgeAmount = 0.5;
    pipeline.samples = 16; pipeline.fxaaEnabled = true;

    // Funzioni bounding + framing
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
    function frameCamera(center, maxDim) {
      camera.setTarget(center);
      const fov = camera.fov || (Math.PI / 3);
      const radius = (maxDim * 0.6) / Math.tan(fov / 2) + maxDim * 0.2;
      camera.radius = radius;
      camera.lowerRadiusLimit = Math.max(radius * 0.35, 0.02);
      camera.upperRadiusLimit = radius * 3;
    }

    // Caricamento GLB
    BABYLON.SceneLoader.ImportMesh("", "./assets/", "iphone_16_pro_configuratore_3d.glb", scene, (meshes) => {
      // Nodi
      const iphoneNode =
        scene.getTransformNodeByName('iphone') || scene.getNodeByName('iphone') || meshes[0];

      airpodsNode =
        scene.getNodeByName('Airpods') || scene.getNodeByName('airpods') ||
        scene.getNodeByName('Cuffie')  || scene.getNodeByName('cuffie')  ||
        scene.getTransformNodeByName('Airpods');

      // Pivot centrato su iPhone
      const printable = meshes.filter(m => m.getBoundingInfo);
      const { center, maxDim } = computeBounds(iphoneNode?.getChildMeshes ? iphoneNode.getChildMeshes() : printable);
      pivot = new BABYLON.TransformNode('pivot', scene);
      pivot.setAbsolutePosition(center);
      if (iphoneNode) iphoneNode.setParent(pivot);
      if (airpodsNode) airpodsNode.setParent(pivot);

      frameCamera(center, maxDim);

      // Materiali da mappare
      const allMaterials = scene.materials;
      scoccaMaterials = allMaterials
        .filter(m => /scocca|retro|pulsanti|box|bordi|dettagli/i.test(m.name))
        .map(m => m.name);
      schermoMaterial = allMaterials.find(m => /schermo|screen/i.test(m.name))?.name || null;

      // Preload/Cache Babylon textures
      const allUrls = [...Object.values(TEXTURES.color), ...Object.values(TEXTURES.background)];
      const preload = (urls) => urls.forEach(url => {
        if (babylonTexCache.has(url)) return;
        const t = new BABYLON.Texture(url, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
        t.wrapU = t.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
        babylonTexCache.set(url, t);
      });
      preload(allUrls);

      function setAlbedoFromCache(materialNames, url) {
        const tex = babylonTexCache.get(url) || new BABYLON.Texture(url, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
        babylonTexCache.set(url, tex);
        materialNames.forEach(name => { const mat = scene.getMaterialByName(name); if (mat) mat.albedoTexture = tex; });
      }

      // UI -> Babylon
      colorRadios.forEach(input => input.addEventListener('change', () => {
        const url = TEXTURES.color[input.id]; if (url && scoccaMaterials.length) setAlbedoFromCache(scoccaMaterials, url);
      }));
      bgRadios.forEach(input => input.addEventListener('change', () => {
        const url = TEXTURES.background[input.id]; if (url && schermoMaterial) setAlbedoFromCache([schermoMaterial], url);
      }));

      // Toggle cuffie: OFF = invisibili (nodo disabilitato = no ombre)
      if (airpodsNode && airpodsTgl) {
        airpodsNode.setEnabled(false); // default OFF
        airpodsTgl.addEventListener('change', () => airpodsNode.setEnabled(airpodsTgl.checked));
      }

      // Applica configurazione da URL (per AR via QR)
      applyConfigFromURL();

      // Render loop
      engine.runRenderLoop(() => scene && scene.render());
      window.addEventListener('resize', () => engine.resize());
    },
    (progress) => { /* opzionale: console.log progresso */ },
    (err) => { console.error('Errore caricamento GLB:', err); });

    updateBabylonBackground(); // prima render
  }

  // Applica c/bg/hp da query e aggiorna UI + Babylon
  function applyConfigFromURL() {
    const sp = new URLSearchParams(location.search);
    const c  = sp.get('c');  const bg = sp.get('bg');  const hp = sp.get('hp');
    if (c)  { const el = document.getElementById(c);  if (el) { el.checked = true;  el.dispatchEvent(new Event('change')); } }
    if (bg) { const el = document.getElementById(bg); if (el) { el.checked = true; el.dispatchEvent(new Event('change')); } }
    if (hp && airpodsTgl) {
      const on = hp === '1';
      airpodsTgl.checked = on;
      airpodsTgl.dispatchEvent(new Event('change'));
    }
  }

  /* =========================
   * AR: WEBXR + FALLBACK MODEL-VIEWER
   * ========================= */
  // Material names indicativi per identif. cuffie in AR
  const AIRPODS_HIDE_LIST = ['bianco lucido', 'gomma', 'parti_scure cuffie'].map(s => s.toLowerCase());
  const shouldHideMatName = (name) => {
    const n = (name || '').toLowerCase().trim();
    if (AIRPODS_HIDE_LIST.includes(n)) return true;
    return /(cuffie|airpods)/i.test(n);
  };

  async function syncMVFromPageState() {
    if (!mv) return;
    await mv.updateComplete;
    if (!mv.model) return;

    const { c, bg, hp } = getState();
    const colorUrl = c  ? cloudinaryForcePNG(TEXTURES.color[c]) : null;
    const bgUrl    = bg ? cloudinaryForcePNG(TEXTURES.background[bg]) : null;

    const applyBaseColorTexture = async (materialName, url) => {
      if (!url) return;
      const mat = mv.model.materials.find(m => m.name === materialName);
      if (!mat) return;
      const ti = mat.pbrMetallicRoughness.baseColorTexture;
      const tex = await mv.createTexture(url);
      if (ti) ti.setTexture(tex);
    };

    if (scoccaMaterials?.length && colorUrl) {
      for (const matName of scoccaMaterials) await applyBaseColorTexture(matName, colorUrl);
    }
    if (schermoMaterial && bgUrl) await applyBaseColorTexture(schermoMaterial, bgUrl);

    // Cuffie OFF = invisibili in AR (alpha 0, metall/rough neutri per evitare aloni)
    mv.model.materials.forEach(mat => {
      if (!shouldHideMatName(mat.name)) return;
      try { mat.setAlphaMode(hp ? 'BLEND' : 'MASK'); } catch {}
      if (!hp) {
        mat.alphaCutoff = 1.0;
        mat.pbrMetallicRoughness.setBaseColorFactor([1,1,1,0]);
        mat.pbrMetallicRoughness.metallicFactor = 0;
        mat.pbrMetallicRoughness.roughnessFactor = 1;
      } else {
        mat.pbrMetallicRoughness.setBaseColorFactor([1,1,1,1]);
      }
    });
  }

  // Click AR
  arBtn?.addEventListener('click', async () => {
    const isAndroid = /Android/i.test(navigator.userAgent);

    if (!IS_MOBILE) {
      // su desktop: già gestito con modal QR in setupQrModal()
      return;
    }

    // 1) WebXR (Android) se disponibile
    try {
      if (isAndroid && navigator.xr && await navigator.xr.isSessionSupported('immersive-ar')) {
        const xr = await scene.createDefaultXRExperienceAsync({
          uiOptions: { sessionMode: 'immersive-ar' },
          optionalFeatures: ['hit-test', 'dom-overlay'],
          referenceSpaceType: 'local-floor'
        });
        return;
      }
    } catch (err) {
      console.warn('WebXR non disponibile, fallback model-viewer', err);
    }

    // 2) Fallback: model-viewer -> Scene Viewer (Android) / Quick Look (iOS)
    try {
      await syncMVFromPageState();
      await mv.activateAR();
    } catch (e) {
      console.error('Fallback AR fallito:', e);
      alert('AR non disponibile su questo dispositivo/navigatore.');
    }
  });

  // Avvio automatico AR se arrivo da QR con stato (?ar=1...)
  (function autoStartARIfRequested() {
    const sp = new URLSearchParams(location.search);
    if (sp.get('ar') === '1' && IS_MOBILE && arBtn) {
      applyConfigFromURL();
      // Richiede spesso un gesto utente: mostro un piccolo invito e aspetto primo tap
      const banner = document.createElement('div');
      banner.textContent = 'Tocca qui per avviare la Realtà Aumentata con la tua configurazione';
      Object.assign(banner.style, {
        position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
        padding: '10px 14px', background: '#3FA9F5', color: '#fff', borderRadius: '999px',
        fontSize: '14px', zIndex: 1000, boxShadow: '0 10px 20px rgba(0,0,0,.18)'
      });
      document.body.appendChild(banner);
      const start = async () => {
        banner.removeEventListener('click', start);
        banner.remove();
        arBtn.click();
      };
      banner.addEventListener('click', start);
    }
  })();

});
</script>
