// configuratori-3d-2d.js
document.addEventListener('DOMContentLoaded', () => {
  /* ---------- Utilities ---------- */
  const body = document.body;
  const header = document.querySelector('header');
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const themeToggle = document.querySelector('.theme-toggle');
  const sunIcon = document.querySelector('.theme-icon.sun');
  const moonIcon = document.querySelector('.theme-icon.moon');

  // Legge il vero background opaco risalendo il DOM
  function getOpaqueBg(startEl) {
    let el = startEl || document.getElementById('renderCanvas')?.parentElement || document.body;
    while (el) {
      const c = getComputedStyle(el).backgroundColor;
      const m = c && c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
      if (m) {
        const a = m[4] ? parseFloat(m[4]) : 1;
        if (a >= 0.99) return `rgb(${m[1]}, ${m[2]}, ${m[3]})`;
      } else if (c && c.startsWith('#')) {
        return c;
      }
      el = el.parentElement;
    }
    return '#FAFAFA';
  }
  const rgbObj = (css) => {
    if (css.startsWith('#')) {
      const h = css.replace('#','');
      const n = parseInt(h.length === 3 ? h.split('').map(x=>x+x).join('') : h, 16);
      return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
    }
    const m = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    return m ? { r:+m[1], g:+m[2], b:+m[3] } : { r:250,g:250,b:250 };
  };

  /* ---------- Pulsante AR: icona & stile ---------- */
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

  /* ---------- Unwrap eventuali <grok-card> ---------- */
  (function unwrapGrokCard() {
    document.querySelectorAll('grok-card').forEach(node => {
      const parent = node.parentNode;
      while (node.firstChild) parent.insertBefore(node.firstChild, node);
      parent.removeChild(node);
    });
  })();

  /* ---------- Nav corrente ---------- */
  (function setAriaCurrent() {
    const norm = p => (p || '/').replace(/\/+$/, '') || '/';
    const here = norm(location.pathname);
    document.querySelectorAll('nav a, #mobile-menu a').forEach(a => {
      const href = norm(a.getAttribute('href'));
      if (href === here) a.setAttribute('aria-current', 'page');
    });
  })();

  /* ---------- Menu mobile ---------- */
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

  /* ---------- Header shadow ---------- */
  window.addEventListener('scroll', () => {
    if (header) header.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  /* ---------- Tema ---------- */
  const THEME_KEY = 'theme';
  const mediaDark = window.matchMedia('(prefers-color-scheme: dark)');
  let statsChart = null;
  function currentTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return mediaDark.matches ? 'dark' : 'light';
  }
  function applyTheme(t) {
    const isDark = t === 'dark';
    body.classList.toggle('dark-mode', isDark);
    themeToggle?.setAttribute('aria-pressed', String(isDark));
    if (sunIcon && moonIcon) { sunIcon.style.display = isDark ? 'none' : 'block'; moonIcon.style.display = isDark ? 'block' : 'none'; }
    updateSceneBg(); // aggiorna bg canvas
  }
  applyTheme(currentTheme());
  themeToggle?.addEventListener('click', () => {
    const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, newTheme);
    applyTheme(newTheme);
  });
  mediaDark.addEventListener('change', (e) => { if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches ? 'dark' : 'light'); });

  /* ---------- Carousel / lazy / prefetch / 2D (invariati, omessi per brevità) ---------- */
  // ... (lascia intatti i tuoi blocchi esistenti per carousel, lazy backgrounds, prefetch e configuratore 2D)
  // Se preferisci riavere questi blocchi qui dentro, li posso reinserire 1:1; non influenzano i fix richiesti.

  /* ---------- Babylon.js configuratore 3D ---------- */
  const canvas = document.getElementById('renderCanvas');
  let babylonScene = null, camera = null;

  if (canvas) {
    // Niente context menu: tasto destro = pan
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    const engine = new BABYLON.Engine(canvas, true, {
      antialias: true,
      adaptToDeviceRatio: true,
      alpha: false, // canvas opaco → match perfetto del colore di pagina
      preserveDrawingBuffer: true,
      stencil: true
    });
    engine.forceSRGBBufferSupportState = false;
    if (!engine._gl) alert('WebGL non supportato: aggiorna il browser.');

    function updateSceneBg() {
      if (!babylonScene) return;
      const isDark = body.classList.contains('dark-mode');
      const cssBg = isDark ? '#000000' : getOpaqueBg(canvas.parentElement);
      canvas.style.backgroundColor = cssBg;
      canvas.parentElement && (canvas.parentElement.style.backgroundColor = cssBg);
      const rgb = rgbObj(cssBg);
      babylonScene.clearColor = new BABYLON.Color4(rgb.r/255, rgb.g/255, rgb.b/255, 1);
    }

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

    const scene = new BABYLON.Scene(engine);
    babylonScene = scene;

    // Luci base
    new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0,1,0), scene).intensity = 0.4;
    const d = new BABYLON.DirectionalLight("dir", new BABYLON.Vector3(-1,-2,-1), scene);
    d.position = new BABYLON.Vector3(5,10,5); d.intensity = 0.5;
    new BABYLON.PointLight("pt", new BABYLON.Vector3(-3,2,0), scene).intensity = 0.3;

    // Camera
    camera = new BABYLON.ArcRotateCamera("cam", Math.PI, Math.PI/2, 1.2, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true, false, true);
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    camera.wheelDeltaPercentage = isMobile ? 0.01 : 0.02;
    camera.pinchDeltaPercentage = 0.01;
    camera.useNaturalPinchZoom = true;
    camera.inertia = 0.88;
    camera.panningInertia = 0.85;
    camera.minZ = 0.01;

    // Mappo i pulsanti corretti: sinistro=rotate, destro=pan
    const pi = camera.inputs.attached.pointers;
    if (pi) {
      pi.useCtrlForPanning = false;
      pi.panningMouseButton = 2;  // tasto destro → pan
      pi.buttons = [0];           // SOLO sinistro ruota (rimuovo il destro dalla rotazione)
    }
    camera.panningSensibility = 2000;

    // Ambiente + pipeline leggera
    scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
      "https://assets.babylonjs.com/environments/studio.env", scene
    );
    scene.environmentIntensity = 0.6;
    const pipeline = new BABYLON.DefaultRenderingPipeline("p", true, scene, [camera]);
    pipeline.bloomEnabled = true; pipeline.bloomThreshold = 0.8; pipeline.bloomWeight = 0.3;
    pipeline.sharpenEnabled = true; pipeline.sharpen.edgeAmount = 0.5;
    pipeline.samples = 16; pipeline.fxaaEnabled = true;

    updateSceneBg();
    themeToggle?.addEventListener('click', updateSceneBg);

    /* ---- Import GLB ---- */
    BABYLON.SceneLoader.ImportMesh("", "./assets/", "iphone_16_pro_configuratore_3d.glb", scene, (meshes) => {
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

      // Pivot centrato su iPhone, ruotano insieme
      const iphMeshes = iphoneNode?.getChildMeshes ? iphoneNode.getChildMeshes() : meshes;
      const { center, maxDim } = computeBounds(iphMeshes);
      const pivot = new BABYLON.TransformNode('pivot', scene);
      pivot.setAbsolutePosition(center);
      if (iphoneNode) iphoneNode.setParent(pivot);
      if (airpodsNode) airpodsNode.setParent(pivot);
      frameCamera(camera, center, maxDim);

      // Auto-rotate morbida del pivot (oggetti ruotano assieme)
      let isRotating = true, autoRotateTimer = null;
      scene.onBeforeRenderObservable.add(() => { if (isRotating) pivot.rotate(BABYLON.Axis.Y, 0.003, BABYLON.Space.LOCAL); });
      canvas.addEventListener('pointerdown', () => {
        isRotating = false; clearTimeout(autoRotateTimer);
        autoRotateTimer = setTimeout(() => isRotating = true, 3000);
      });

      // Materiali utili
      const allMaterials = scene.materials;
      const scoccaMaterials = allMaterials.filter(m => /scocca|retro|pulsanti|box|bordi|dettagli/i.test(m.name)).map(m => m.name);
      const schermoMaterial = allMaterials.find(m => /schermo|screen/i.test(m.name))?.name;
      window.scoccaMaterials = scoccaMaterials;
      window.schermoMaterial = schermoMaterial;

      // Materiali del nodo Airpods (per bridge AR)
      window.airpodsMaterials = (() => {
        try {
          if (!airpodsNode) return [];
          const mats = new Set();
          airpodsNode.getChildMeshes().forEach(m => { if (m.material?.name) mats.add(m.material.name); });
          return Array.from(mats);
        } catch { return []; }
      })();

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

      // Cache Babylon (riduce “flash” al cambio)
      const allTextureUrls = [...Object.values(textures.color), ...Object.values(textures.background)];
      const babylonTexCache = new Map();
      function setAlbedoFromCache(materialNames, url) {
        const tex = babylonTexCache.get(url) || new BABYLON.Texture(
          url, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE
        );
        tex.wrapU = tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
        babylonTexCache.set(url, tex);
        materialNames.forEach(name => {
          const mat = scene.getMaterialByName(name);
          if (mat) mat.albedoTexture = tex;
        });
      }
      allTextureUrls.forEach(u => {
        const l = document.createElement('link'); l.rel = 'prefetch'; l.as = 'image'; l.href = u; document.head.appendChild(l);
      });

      // UI → Babylon
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

      // Toggle cuffie in Babylon
      const toggle = document.getElementById('toggle-airpods');
      if (airpodsNode && toggle) {
        airpodsNode.setEnabled(false); // default OFF
        toggle.addEventListener('change', () => airpodsNode.setEnabled(toggle.checked));
      }

      /* ---------- AR bridge (Android WebXR + iOS/Android via <model-viewer>) ---------- */
      const arButton = document.getElementById('ar-button');
      const mv = document.getElementById('ar-bridge');
      const IS_IOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
      const AIRPODS_HIDE_LIST = ['bianco lucido','gomma','parti_scure cuffie'].map(s => s.toLowerCase());
      const TRANSPARENT_PX =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

      function cloudinaryForcePNG(url) {
        if (!IS_IOS) return url;
        try { const u = new URL(url); if (u.hostname.includes('res.cloudinary.com')) u.searchParams.set('format','png'); return u.toString(); }
        catch { return url.replace('format=auto','format=png'); }
      }
      const shouldHideMatName = (name) => {
        const n = (name||'').toLowerCase().trim();
        return AIRPODS_HIDE_LIST.includes(n) || /(cuffie|airpods)/i.test(n);
      };

      async function makeMaterialInvisibleMV(mat, mvEl) {
        try { mat.setAlphaMode('MASK'); } catch {}
        mat.alphaCutoff = 1.0;
        mat.pbrMetallicRoughness.setBaseColorFactor([1,1,1,0]);
        mat.pbrMetallicRoughness.metallicFactor = 0;
        mat.pbrMetallicRoughness.roughnessFactor = 1;
        const t = await mvEl.createTexture(TRANSPARENT_PX);
        const ti = mat.pbrMetallicRoughness.baseColorTexture;
        ti && ti.setTexture(t);
        try { mat.normalTexture && mat.normalTexture.setTexture(null); } catch {}
        try { mat.occlusionTexture && mat.occlusionTexture.setTexture(null); } catch {}
        try { mat.emissiveTexture && mat.emissiveTexture.setTexture(null); } catch {}
      }

      // Tenta anche di “nascondere” il nodo Airpods a livello di nodo (elimina eventuale ombra residua)
      function hideAirpodsNodeMV(mvEl) {
        try {
          const names = ['Airpods','airpods','Cuffie','cuffie'];
          for (const n of names) {
            const node = mvEl.model?.getNodeByName?.(n);
            if (node?.setScale) {
              node.setScale({x:1e-6,y:1e-6,z:1e-6});
            } else if (node?.setMatrix) {
              const m = new Float32Array([
                1e-6,0,0,0, 0,1e-6,0,0, 0,0,1e-6,0, 0,0,0,1
              ]);
              node.setMatrix(m);
            }
          }
        } catch {}
      }

      async function syncMVFromPageState() {
        if (!mv) return;
        await mv.updateComplete;
        if (!mv.model) return;

        const colorId = document.querySelector('.color-options input:checked')?.id;
        const bgId    = document.querySelector('.background-options input:checked')?.id;
        const colorUrl = colorId ? cloudinaryForcePNG(textures.color[colorId]) : null;
        const bgUrl    = bgId    ? cloudinaryForcePNG(textures.background[bgId]) : null;

        const applyBaseColorTexture = async (matName, url) => {
          if (!url) return;
          const mat = mv.model.materials.find(m => m.name === matName);
          if (!mat) return;
          const ti = mat.pbrMetallicRoughness.baseColorTexture;
          const tex = await mv.createTexture(url);
          ti && ti.setTexture(tex);
        };
        if (window.scoccaMaterials) {
          for (const mName of window.scoccaMaterials) await applyBaseColorTexture(mName, colorUrl);
        }
        if (window.schermoMaterial) await applyBaseColorTexture(window.schermoMaterial, bgUrl);

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
        if (!headphonesOn) hideAirpodsNodeMV(mv); // ulteriore assicurazione contro “ombra”
      }

      // Stato ↔ URL (per QR)
      function buildStateURL() {
        const colorId = document.querySelector('.color-options input:checked')?.id || '';
        const bgId    = document.querySelector('.background-options input:checked')?.id || '';
        const hp      = document.getElementById('toggle-airpods')?.checked ? '1' : '0';
        const url = new URL(location.href);
        url.searchParams.set('c', colorId);
        url.searchParams.set('bg', bgId);
        url.searchParams.set('hp', hp);
        url.searchParams.set('ar', '1');
        return url.toString();
      }
      function applyStateFromURL() {
        const params = new URLSearchParams(location.search);
        const c  = params.get('c');
        const bg = params.get('bg');
        const hp = params.get('hp');

        const setRadio = (groupSel, id) => {
          if (!id) return;
          const el = document.querySelector(`${groupSel} input#${CSS.escape(id)}`);
          if (el) { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); }
        };
        setRadio('.color-options', c);
        setRadio('.background-options', bg);
        const t = document.getElementById('toggle-airpods');
        if (t && hp !== null) {
          t.checked = (hp === '1');
          t.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      // Applica stato se arrivo da QR
      applyStateFromURL();

      /* ---------- QR desktop: usa il tuo modal esistente ---------- */
      function openQRModal() {
        const modal = document.getElementById('ar-qr-modal');
        if (!modal) return;

        // Stile card centrata e “X” azzurra
        modal.style.display = 'block';
        modal.style.zIndex = '10000';

        const title = modal.querySelector('h3');
        if (title) {
          title.textContent = 'Scansiona il QR CODE con la fotocamera del tuo smartphone/tablet per simulare la scena 3D nel tuo ambiente.';
          title.style.margin = '0 0 12px 0';
          title.style.fontSize = '16px';
          title.style.color = '#111';
          title.style.fontWeight = '600';
        }

        // Sostituisci il bottone "Chiudi" con una X in alto a destra
        const oldBtn = modal.querySelector('button');
        if (oldBtn) oldBtn.remove();
        let closeBtn = modal.querySelector('.qr-close-x');
        if (!closeBtn) {
          closeBtn = document.createElement('button');
          closeBtn.className = 'qr-close-x';
          closeBtn.setAttribute('aria-label', 'Chiudi');
          closeBtn.textContent = '×';
          Object.assign(closeBtn.style, {
            position:'absolute', top:'10px', right:'12px',
            background:'transparent', border:'none',
            color:'#3FA9F5', fontSize:'22px', fontWeight:'700', cursor:'pointer'
          });
          modal.appendChild(closeBtn);
        }
        closeBtn.onclick = () => modal.style.display = 'none';

        // Rigenera il QR centrato
        const qrWrap = modal.querySelector('#qr-code');
        if (qrWrap) {
          qrWrap.innerHTML = ''; // pulisci eventuale QR precedente
          const url = buildStateURL();
          new QRCode(qrWrap, { text: url, width: 220, height: 220, margin: 0 });
        }
      }

      /* ---------- Click AR ---------- */
      arButton?.addEventListener('click', async () => {
        const ua = navigator.userAgent;
        const isAndroid = /Android/i.test(ua);
        const isMobile  = /Android|iPhone|iPad/i.test(ua);

        if (!isMobile) {
          // Desktop → mostra il tuo modal con QR centrato e stato corrente
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
          console.warn('WebXR non disponibile; uso fallback <model-viewer>:', err);
        }

        // 2) Fallback: iOS Quick Look / Android Scene Viewer
        try {
          await syncMVFromPageState();
          await mv.activateAR();
        } catch (e) {
          console.error('Fallback AR fallito:', e);
          alert('AR non disponibile su questo dispositivo/navigatore.');
        }
      });

      // Auto-AR se arrivo da QR (dopo aver applicato lo stato)
      if (location.search.includes('ar=1') && /Android|iPhone/i.test(navigator.userAgent)) {
        setTimeout(() => document.getElementById('ar-button')?.click(), 120);
      }
    });

    engine.runRenderLoop(() => babylonScene && babylonScene.render());
    window.addEventListener('resize', () => engine.resize());
  }

});
