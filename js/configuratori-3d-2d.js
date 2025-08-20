(function () {
  'use strict';

  // ---------- Utility DOM ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const header = $('header');
    const themeToggle = $('.theme-toggle');
    const sunIcon = $('.theme-icon.sun');
    const moonIcon = $('.theme-icon.moon');

    // ---------- UI: AR Button look ----------
    (function setupArButtonUI() {
      const arBtn = $('#ar-button');
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

    // ---------- Accessibilità nav corrente ----------
    (function setAriaCurrent() {
      const norm = p => (p || '/').replace(/\/+$/, '') || '/';
      const here = norm(location.pathname);
      $$('nav a, #mobile-menu a').forEach(a => {
        const href = norm(a.getAttribute('href'));
        if (href === here) a.setAttribute('aria-current', 'page');
      });
    })();

    // ---------- Header shadow su scroll ----------
    window.addEventListener('scroll', () => {
      if (header) header.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });

    // ---------- Tema ----------
    const THEME_KEY = 'theme';
    const mediaDark = window.matchMedia('(prefers-color-scheme: dark)');
    function currentTheme() {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
      return mediaDark.matches ? 'dark' : 'light';
    }
    function applyTheme(theme) {
      const isDark = theme === 'dark';
      body.classList.toggle('dark-mode', isDark);
      if (themeToggle) themeToggle.setAttribute('aria-pressed', String(isDark));
      if (sunIcon && moonIcon) {
        sunIcon.style.display = isDark ? 'none' : 'block';
        moonIcon.style.display = isDark ? 'block' : 'none';
      }
      // sincronizza anche background del canvas BABYLON
      updateBabylonBackground();
    }
    applyTheme(currentTheme());
    themeToggle?.addEventListener('click', () => {
      const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, newTheme);
      applyTheme(newTheme);
    });
    mediaDark.addEventListener('change', (e) => {
      if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches ? 'dark' : 'light');
    });

    // ==================================================
    //           CONFIGURATORE 2D (immutato)
    // ==================================================
    (function initConfigurator2D() {
      const img = $('#product-image-2d');
      if (!img) return;
      $$('.color-options-2d input').forEach(input => {
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

    // ==================================================
    //           3D + AR: stato condiviso
    // ==================================================

    // Stato configuratore
    const state = {
      color: null,        // 'bianco' | 'grigio' | 'bronzo' | 'nero'
      background: null,   // 'sfondo-nero-bronzo' | ... (vedi mappa textures)
      airpods: true       // boolean
    };

    // Recupera stato da URL
    const params = new URLSearchParams(location.search);
    const getParam = (k, fallback=null) => params.get(k) ?? fallback;
    state.color = getParam('color');
    state.background = getParam('bg');
    state.airpods = getParam('airpods', '1') !== '0';

    // --------------------------------------------------
    //      Babylon.js – scena 3D principale
    // --------------------------------------------------
    const canvas = $('#renderCanvas');
    const modelViewer = $('#ar-bridge'); // nascosto ma usato per AR
    let engine = null, scene = null, camera = null;
    let pivot = null;
    let iphoneNode = null, airpodsNode = null;
    let scoccaMaterials = [];   // nomi materiali scocca iPhone
    let schermoMaterial = null; // nome materiale schermo

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

    // Cache texture Babylon
    const babylonTexCache = new Map();
    function preloadBabylonTextures(urls) {
      if (!urls || !window.BABYLON) return;
      urls.forEach(url => {
        if (babylonTexCache.has(url)) return;
        const t = new BABYLON.Texture(url, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
        t.wrapU = t.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
        babylonTexCache.set(url, t);
      });
    }

    const allTextureUrls = [...Object.values(textures.color), ...Object.values(textures.background)];
    allTextureUrls.forEach(u => {
      const l = document.createElement('link');
      l.rel = 'prefetch'; l.as = 'image'; l.href = u;
      document.head.appendChild(l);
    });

    function setURLFromState(push = false) {
      const u = new URL(location.href);
      state.color && u.searchParams.set('color', state.color);
      state.background && u.searchParams.set('bg', state.background);
      u.searchParams.set('airpods', state.airpods ? '1' : '0');
      if (u.searchParams.has('ar')) {
        // preserva ar=1 solo se già presente (evita avviare AR accidentalmente)
      }
      if (push) history.pushState({}, '', u.toString());
      else history.replaceState({}, '', u.toString());
      return u.toString();
    }
    // Inizializza URL secondo stato iniziale (senza spingere history)
    setURLFromState(false);

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
    function frameCamera(cam, center, maxDim) {
      cam.setTarget(center);
      const fov = cam.fov || (Math.PI / 3);
      const radius = (maxDim * 0.6) / Math.tan(fov / 2) + maxDim * 0.2;
      cam.radius = radius;
      cam.lowerRadiusLimit = Math.max(radius * 0.35, 0.02);
      cam.upperRadiusLimit = radius * 3;
    }

    function updateBabylonBackground() {
      if (!scene || !canvas) return;
      const isDark = body.classList.contains('dark-mode');
      const bg = isDark ? '#000000' : '#FAFAFA';
      canvas.style.backgroundColor = bg;
      const container = canvas.parentElement;
      if (container) container.style.backgroundColor = bg;

      // Forza sRGB perfetto + opacità 1 per matchare CSS
      const c = BABYLON.Color3.FromHexString(bg);
      scene.clearColor = new BABYLON.Color4(c.r, c.g, c.b, 1);
    }

    function createBabylonScene() {
      if (!canvas || !window.BABYLON) return null;

      // Engine con impostazioni per matching colore
      engine = new BABYLON.Engine(canvas, true, {
        antialias: true,
        alpha: false,                 // canvas opaco
        premultipliedAlpha: false,    // evita compositing che altera bg
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance',
        stencil: true,
        adaptToDeviceRatio: true
      });
      // Uscita SRGB (no gamma surprise)
      if (engine.setHardwareScalingLevel) {
        const scale = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
        engine.setHardwareScalingLevel(1 / scale);
      }
      if (BABYLON.Constants?.OUTPUT_COLOR_SPACE_SRGB) {
        engine.outputColorSpace = BABYLON.Constants.OUTPUT_COLOR_SPACE_SRGB;
      }

      scene = new BABYLON.Scene(engine);
      // Disabilita processing che potrebbe alterare clearColor
      scene.imageProcessingConfiguration.isEnabled = false;
      scene.imageProcessingConfiguration.toneMappingEnabled = false;
      scene.imageProcessingConfiguration.exposure = 1.0;

      updateBabylonBackground();
      themeToggle?.addEventListener('click', updateBabylonBackground);

      // Luci sobrie
      const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
      hemi.intensity = 0.45;
      const dir = new BABYLON.DirectionalLight('dir', new BABYLON.Vector3(-1, -2, -1), scene);
      dir.position = new BABYLON.Vector3(5, 10, 5);
      dir.intensity = 0.5;

      // Camera
      camera = new BABYLON.ArcRotateCamera('cam', Math.PI, Math.PI / 2, 1.2, BABYLON.Vector3.Zero(), scene);
      // **FIX**: attachControl con mapping corretto: (elem, noPreventDefault, useCtrlForPanning, panningMouseButton)
      camera.attachControl(canvas, true, false, 2); // tasto destro = PAN
      camera.inertia = 0.88;
      camera.panningInertia = 0.85;
      camera.panningSensibility = 2000; // più alto = pan più controllato
      camera.minZ = 0.01;
      camera.wheelDeltaPercentage = 0.02;
      camera.pinchDeltaPercentage = 0.01;
      camera.useNaturalPinchZoom = true;

      // Evita menu contestuale (serve per pan)
      canvas.addEventListener('contextmenu', e => e.preventDefault());

      // IBL leggera
      scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
        'https://assets.babylonjs.com/environments/studio.env', scene
      );
      scene.environmentIntensity = 0.6;

      // Render pipeline leggero (non altera bg)
      const pipeline = new BABYLON.DefaultRenderingPipeline('default', true, scene, [camera]);
      pipeline.bloomEnabled = true; pipeline.bloomThreshold = 0.8; pipeline.bloomWeight = 0.25;
      pipeline.sharpenEnabled = true; pipeline.sharpen.edgeAmount = 0.4;
      pipeline.fxaaEnabled = true;

      engine.runRenderLoop(() => scene.render());
      window.addEventListener('resize', () => engine.resize());

      return scene;
    }

    function getNodeByNameInsensitive(scene, ...names) {
      for (const name of names) {
        const n =
          scene.getTransformNodeByName?.(name) ||
          scene.getNodeByName?.(name);
        if (n) return n;
      }
      return null;
    }

    function setAirpodsVisible(visible) {
      if (!airpodsNode) return;
      // Nascondi nodo cuffie + eventuali figli “shadow/ombra”
      const meshes = airpodsNode.getChildMeshes ? airpodsNode.getChildMeshes() : [];
      airpodsNode.setEnabled(visible);
      meshes.forEach(m => {
        const n = (m.name || '').toLowerCase();
        if (n.includes('shadow') || n.includes('ombra')) {
          m.setEnabled(visible); // se fanno parte dello stesso nodo
        }
      });
    }

    function applyBabylonScocca(url) {
      if (!scene) return;
      // usa cache
      const tex = babylonTexCache.get(url) || new BABYLON.Texture(
        url, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE
      );
      tex.wrapU = tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
      babylonTexCache.set(url, tex);

      scoccaMaterials.forEach(name => {
        const mat = scene.getMaterialByName(name);
        if (mat && mat.albedoTexture !== undefined) {
          mat.albedoTexture = tex;
        } else if (mat && mat.diffuseTexture !== undefined) {
          mat.diffuseTexture = tex;
        }
      });
    }

    function applyBabylonScreen(url) {
      if (!scene || !schermoMaterial) return;
      const tex = babylonTexCache.get(url) || new BABYLON.Texture(
        url, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE
      );
      tex.wrapU = tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
      babylonTexCache.set(url, tex);

      const mat = scene.getMaterialByName(schermoMaterial);
      if (mat && mat.albedoTexture !== undefined) {
        mat.albedoTexture = tex;
      } else if (mat && mat.diffuseTexture !== undefined) {
        mat.diffuseTexture = tex;
      }
    }

    // ------- MODEL-VIEWER Bridge (AR) -------
    // Applica stesso stato al modello AR (scene-graph API)
    async function applyModelViewerScocca(url) {
      if (!modelViewer?.model) return;
      try {
        const t = await modelViewer.createTexture(url);
        for (const m of modelViewer.model.materials) {
          const name = (m.name || '').toLowerCase();
          if (/scocca|retro|pulsanti|box|bordi|dettagli/.test(name)) {
            m.pbrMetallicRoughness.setBaseColorTexture(t);
          }
        }
      } catch (e) {
        // fallback silenzioso
        console.warn('[AR] applyModelViewerScocca:', e);
      }
    }
    async function applyModelViewerScreen(url) {
      if (!modelViewer?.model) return;
      try {
        const t = await modelViewer.createTexture(url);
        for (const m of modelViewer.model.materials) {
          const name = (m.name || '').toLowerCase();
          if (/schermo|screen/.test(name)) {
            m.pbrMetallicRoughness.setBaseColorTexture(t);
          }
        }
      } catch (e) {
        console.warn('[AR] applyModelViewerScreen:', e);
      }
    }
    function setModelViewerAirpodsVisible(visible) {
      if (!modelViewer?.scene) return;
      try {
        const node = modelViewer.scene.getNodeByName?.('Airpods') ||
                     modelViewer.scene.getNodeByName?.('airpods') ||
                     modelViewer.scene.getNodeByName?.('Cuffie')  ||
                     modelViewer.scene.getNodeByName?.('cuffie');
        if (node) node.visible = !!visible;
        // Eventuali "shadow/ombra" come nodi separati
        const maybeShadow = modelViewer.scene.getNodeByName?.('shadow') || null;
        if (maybeShadow) maybeShadow.visible = !!visible;
      } catch (e) {
        // no-op
      }
    }

    async function syncModelViewerFromState() {
      if (!modelViewer) return;
      // Applica texture (no blob) così si evita GLTFLoader blob error
      if (state.color && textures.color[state.color]) {
        await applyModelViewerScocca(textures.color[state.color]);
      }
      if (state.background && textures.background[state.background]) {
        await applyModelViewerScreen(textures.background[state.background]);
      }
      setModelViewerAirpodsVisible(state.airpods);
    }

    // ------- AR / QR -------
    const qrModal = $('#ar-qr-modal');
    (function styleQrModal() {
      if (!qrModal) return;
      // Testo richiesto
      const h3 = qrModal.querySelector('h3');
      if (h3) h3.textContent = 'Scansiona il QR CODE con la fotocamera del tuo smartphone/tablet per simulare la scena 3D nel tuo ambiente.';

      // Centramento e stile
      Object.assign(qrModal.style, {
        display: 'none',
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#fff',
        padding: '22px 22px 18px',
        borderRadius: '14px',
        textAlign: 'center',
        zIndex: '10000',
        width: 'min(92vw, 380px)',
        boxShadow: '0 15px 50px rgba(0,0,0,0.25)'
      });
      // wrapper per centrare QR
      let qrWrap = qrModal.querySelector('.qr-wrap');
      if (!qrWrap) {
        qrWrap = document.createElement('div');
        qrWrap.className = 'qr-wrap';
        const qrDiv = $('#qr-code', qrModal);
        if (qrDiv) {
          qrModal.insertBefore(qrWrap, qrDiv);
          qrWrap.appendChild(qrDiv);
        }
      }
      Object.assign(qrWrap.style, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px 0 2px'
      });

      // Rimuovi bottone "Chiudi" preesistente e sostituisci con "X"
      const oldBtn = qrModal.querySelector('button');
      if (oldBtn) oldBtn.style.display = 'none';
      let closeX = qrModal.querySelector('.qr-close-x');
      if (!closeX) {
        closeX = document.createElement('button');
        closeX.className = 'qr-close-x';
        closeX.setAttribute('aria-label', 'Chiudi');
        closeX.textContent = '×';
        Object.assign(closeX.style, {
          position: 'absolute',
          top: '8px',
          right: '10px',
          background: 'transparent',
          border: 'none',
          fontSize: '24px',
          fontWeight: '600',
          color: '#3FA9F5',
          cursor: 'pointer',
          lineHeight: '1'
        });
        closeX.addEventListener('click', () => { qrModal.style.display = 'none'; });
        qrModal.appendChild(closeX);
      }
    })();

    function buildShareURL(withAr = false) {
      const u = new URL(setURLFromState(false));
      if (withAr) u.searchParams.set('ar', '1');
      return u.toString();
    }

    function regenerateQR() {
      // Rigenera QR con stato corrente
      const qrDiv = $('#qr-code');
      if (!qrDiv) return;
      qrDiv.innerHTML = '';
      // usa libreria QRCode.js già caricata in pagina
      try {
        const target = buildShareURL(true);
        // 200x200 default
        new window.QRCode(qrDiv, { text: target, width: 200, height: 200 });
      } catch (e) { /* no-op */ }
    }

    function isMobileUA() {
      return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    $('#ar-button')?.addEventListener('click', async () => {
      // Sincronizza model-viewer con lo stato corrente (texture + visibilità)
      await syncModelViewerFromState();

      if (isMobileUA()) {
        // Mobile: apri AR direttamente
        try { await modelViewer?.activateAR?.(); } catch (e) { /* user gesture required */ }
      } else {
        // Desktop: mostra QR centrato
        regenerateQR();
        if (qrModal) qrModal.style.display = 'block';
      }
    });

    // Se la pagina viene aperta con ?ar=1 (da QR), applichiamo lo stato ed evidenziamo subito il bottone AR
    (async function autoApplyFromParams() {
      const wantsAR = params.get('ar') === '1';
      // Applica scelte UI
      if (state.color) $(`#${CSS.escape(state.color)}`)?.click();
      if (state.background) $(`#${CSS.escape(state.background)}`)?.click();
      const airpodsToggle = $('#toggle-airpods');
      if (airpodsToggle) {
        airpodsToggle.checked = !!state.airpods;
        airpodsToggle.dispatchEvent(new Event('change'));
      }
      if (wantsAR && isMobileUA()) {
        // Non possiamo aprire AR senza gesture: evidenzia il bottone per indicare il tap
        const btn = $('#ar-button');
        if (btn) {
          btn.style.boxShadow = '0 0 0 6px rgba(63,169,245,0.35)';
          setTimeout(() => btn.style.boxShadow = '', 2000);
        }
      }
    })();

    // --------------------------------------------------
    //        Caricamento scena + GLB + bindings UI
    // --------------------------------------------------
    if (canvas && window.BABYLON) {
      createBabylonScene();
      if (!scene) return;

      // Preload dopo che la scene esiste
      preloadBabylonTextures(allTextureUrls);

      BABYLON.SceneLoader.ImportMesh('', './assets/', 'iphone_16_pro_configuratore_3d.glb', scene, (meshes) => {
        // Trova nodi
        iphoneNode = getNodeByNameInsensitive(scene, 'iphone') || meshes[0];
        airpodsNode = getNodeByNameInsensitive(scene, 'Airpods', 'airpods', 'Cuffie', 'cuffie');

        // Pivot su iPhone per auto-rotate
        const printable = meshes.filter(m => m.getBoundingInfo);
        const { center, maxDim } = computeBounds(iphoneNode?.getChildMeshes ? iphoneNode.getChildMeshes() : printable);
        pivot = new BABYLON.TransformNode('pivot', scene);
        pivot.setAbsolutePosition(center);
        if (iphoneNode) iphoneNode.setParent(pivot);
        if (airpodsNode) airpodsNode.setParent(pivot);

        // Autorotate morbida (interrotto al drag)
        let isRotating = true, autoRotateTimer = null;
        scene.onBeforeRenderObservable.add(() => { if (isRotating && pivot) pivot.rotate(BABYLON.Axis.Y, 0.003, BABYLON.Space.LOCAL); });
        canvas.addEventListener('pointerdown', () => {
          isRotating = false; clearTimeout(autoRotateTimer);
          autoRotateTimer = setTimeout(() => isRotating = true, 3000);
        });

        // Inquadra camera
        frameCamera(camera, center, maxDim);

        // Raccogli materiali
        const allMaterials = scene.materials || [];
        scoccaMaterials = allMaterials.filter(m => /scocca|retro|pulsanti|box|bordi|dettagli/i.test(m.name)).map(m => m.name);
        const schermo = allMaterials.find(m => /schermo|screen/i.test(m.name));
        schermoMaterial = schermo?.name || null;

        // Applica stato iniziale se definito
        if (state.color && textures.color[state.color]) applyBabylonScocca(textures.color[state.color]);
        if (state.background && textures.background[state.background]) applyBabylonScreen(textures.background[state.background]);
        setAirpodsVisible(state.airpods);

        // ---- UI bindings ----
        // Colori scocca
        $$('.color-options input[type="radio"]').forEach(r => {
          r.addEventListener('change', async () => {
            const id = r.id; // bianco/grigio/bronzo/nero
            if (!textures.color[id]) return;
            state.color = id;
            applyBabylonScocca(textures.color[id]);
            setURLFromState(false);
            // AR
            await applyModelViewerScocca(textures.color[id]);
          });
        });
        // Sfondi schermo
        $$('.background-options input[type="radio"]').forEach(r => {
          r.addEventListener('change', async () => {
            const id = r.id; // sfondo-...
            if (!textures.background[id]) return;
            state.background = id;
            applyBabylonScreen(textures.background[id]);
            setURLFromState(false);
            // AR
            await applyModelViewerScreen(textures.background[id]);
          });
        });
        // Cuffie
        $('#toggle-airpods')?.addEventListener('change', (e) => {
          const on = !!e.target.checked;
          state.airpods = on;
          setAirpodsVisible(on);
          setModelViewerAirpodsVisible(on);
          setURLFromState(false);
        });
      });
    }

    // --------------------------------------------------
    //   MODEL-VIEWER: applica stato quando è pronto
    // --------------------------------------------------
    modelViewer?.addEventListener('load', () => {
      syncModelViewerFromState();
    });

    // --------------------------------------------------
    //   Carousel (lasciato come in precedenza, snellito)
    // --------------------------------------------------
    $$('.carousel-container').forEach(container => {
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
        setTimeout(() => { isScrolling = false; }, 300);
      });
      rightArrow.addEventListener('click', () => {
        if (isScrolling) return;
        isScrolling = true;
        wrapper.scrollBy({ left: scrollByAmount, behavior: 'smooth' });
        setTimeout(() => { isScrolling = false; }, 300);
      });
    });

    // --------------------------------------------------
    //  Prefetch link interni (come prima)
    // --------------------------------------------------
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
      $$('a[href^="/"]').forEach(a => {
        const href = a.getAttribute('href');
        a.addEventListener('mouseenter', () => addPrefetch(href));
        a.addEventListener('touchstart', () => addPrefetch(href), { passive: true });
      });
    })();

  }); // DOMContentLoaded end
})();
