// configuratori-3d-2d.js — build 2025-08-21
document.addEventListener('DOMContentLoaded', () => {
  /* ---------------------------------
   * Selettori base / UI generica
   * --------------------------------- */
  const themeToggle = document.querySelector('.theme-toggle');
  const mobileMenu  = document.getElementById('mobile-menu');
  const hamburger   = document.querySelector('.hamburger');

  // Hamburger
  if (hamburger && mobileMenu) {
    const toggleMenu = () => {
      const expanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', String(!expanded));
      mobileMenu.hidden = expanded;
    };
    hamburger.addEventListener('click', toggleMenu);
    hamburger.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(); }});
  }

  // Evidenzia voce corrente
  (function setAriaCurrent() {
    const norm = p => (p || '/').replace(/\/+$/, '');
    const here = norm(location.pathname);
    document.querySelectorAll('nav a[href]').forEach(a => {
      if (norm(a.getAttribute('href')) === here) a.setAttribute('aria-current', 'page');
    });
  })();

  /* ---------------------------------
   * Configuratore 3D (Babylon)
   * --------------------------------- */
  const canvas = document.getElementById('renderCanvas');
  let babylonScene = null;
  let engine = null;

  // Utility parametri da/verso URL
  function getQuery() {
    const q = new URLSearchParams(location.search);
    return {
      ar:      q.get('ar') === '1',
      color:   q.get('color') || null,
      bg:      q.get('bg')    || null,
      airpods: q.get('airpods') === '1'
    };
  }
  function setFormSelectionsFromQuery() {
    const { color, bg, airpods } = getQuery();
    if (color) {
      const el = document.getElementById(color);
      if (el && el.type === 'radio') el.checked = true;
    }
    if (bg) {
      const el = document.getElementById(bg);
      if (el && el.type === 'radio') el.checked = true;
    }
    const t = document.getElementById('toggle-airpods');
    if (t && typeof airpods === 'boolean') t.checked = airpods;
  }
  function getCurrentConfig() {
    const colorId = document.querySelector('.color-options input:checked')?.id || 'bianco';
    const bgId    = document.querySelector('.background-options input:checked')?.id || 'sfondo-nero-bronzo';
    const airpodsOn = !!document.getElementById('toggle-airpods')?.checked;
    return { colorId, bgId, airpodsOn };
  }
  function buildArShareUrl() {
    const url = new URL(location.href);
    url.searchParams.set('ar', '1');
    const { colorId, bgId, airpodsOn } = getCurrentConfig();
    url.searchParams.set('color', colorId);
    url.searchParams.set('bg', bgId);
    url.searchParams.set('airpods', airpodsOn ? '1' : '0');
    return url.toString();
  }

  // Texture Cloudinary
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

  if (canvas) {
    // Evita menu contestuale: il RMB serve per il pan
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    engine = new BABYLON.Engine(canvas, true, {
      antialias: true,
      adaptToDeviceRatio: true,
      alpha: false, // canvas opaco => colore identico allo sfondo pagina
      preserveDrawingBuffer: true,
      stencil: true
    });

    function createScene() {
      const scene = new BABYLON.Scene(engine);

      // Disabilita tono/processing per evitare alterazioni del background
      scene.imageProcessingConfiguration.toneMappingEnabled = false;
      scene.imageProcessingConfiguration.exposure = 1.0;
      scene.imageProcessingConfiguration.isEnabled = false;

      // Background in sync con tema (FAFAFA in light, #000 in dark)
      function updateBackground() {
        const isDark = document.body.classList.contains('dark-mode');
        const bgHex  = isDark ? '#000000' : '#FAFAFA';
        canvas.style.backgroundColor = bgHex;
        const container = canvas.parentElement;
        if (container) container.style.backgroundColor = bgHex;
        const c = BABYLON.Color3.FromHexString(bgHex);
        scene.clearColor = new BABYLON.Color4(c.r, c.g, c.b, 1);
      }
      updateBackground();
      themeToggle && themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        updateBackground();
      });

      // Luci
      new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene).intensity = 0.4;
      const dir = new BABYLON.DirectionalLight('dir', new BABYLON.Vector3(-1, -2, -1), scene);
      dir.position  = new BABYLON.Vector3(5, 10, 5);
      dir.intensity = 0.5;
      new BABYLON.PointLight('pt', new BABYLON.Vector3(-3, 2, 0), scene).intensity = 0.3;

      // Camera
      const camera = new BABYLON.ArcRotateCamera('cam', Math.PI, Math.PI / 2, 1.2, BABYLON.Vector3.Zero(), scene);
      // Prima config input, poi attachControl
      const pInput = camera.inputs.attached.pointers;
      if (pInput) {
        pInput.buttons = [0, 1, 2];
        pInput.useCtrlForPanning = false;
        pInput.panningMouseButton = BABYLON.PointerInput.MouseButton.Right; // RMB = pan
      }
      camera.panningSensibility = 2000;
      camera.inertia = 0.88;
      camera.panningInertia = 0.85;
      camera.minZ = 0.01;
      const isMobileUA = /Android|iPhone|iPad/i.test(navigator.userAgent);
      camera.wheelDeltaPercentage  = isMobileUA ? 0.01 : 0.02;
      camera.pinchDeltaPercentage  = 0.01;
      camera.useNaturalPinchZoom   = true;
      camera.attachControl(canvas, true, false, true);

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

      // Autorotate (soft) sul pivot
      let pivot = null;
      let autoTimer = null;
      let isRotating = true;
      scene.onBeforeRenderObservable.add(() => {
        if (isRotating && pivot) pivot.rotate(BABYLON.Axis.Y, 0.003, BABYLON.Space.LOCAL);
      });
      canvas.addEventListener('pointerdown', () => {
        isRotating = false;
        clearTimeout(autoTimer);
        autoTimer = setTimeout(() => (isRotating = true), 3000);
      });

      // Env e post: bloom con soglia alta (non impatta lo sfondo)
      scene.environmentTexture  = BABYLON.CubeTexture.CreateFromPrefilteredData(
        'https://assets.babylonjs.com/environments/studio.env', scene
      );
      scene.environmentIntensity = 0.6;
      const pipeline = new BABYLON.DefaultRenderingPipeline('default', true, scene, [camera]);
      pipeline.bloomEnabled    = true;
      pipeline.bloomThreshold  = 1.0;  // soglia alta: niente “glow” sul bg chiaro
      pipeline.bloomWeight     = 0.25;
      pipeline.fxaaEnabled     = true;
      pipeline.samples         = 8;

      babylonScene = scene;

      return { scene, camera, computeBounds, frameCamera, setPivot: (p) => (pivot = p) };
    }

    const { scene, camera, computeBounds, frameCamera, setPivot } = createScene();

    // Caricamento GLB
    BABYLON.SceneLoader.ImportMesh('', './assets/', 'iphone_16_pro_configuratore_3d.glb', scene, (meshes) => {
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

      // Pivot centrato su iPhone
      const printable = meshes.filter(m => m.getBoundingInfo);
      const { center, maxDim } = computeBounds(iphoneNode?.getChildMeshes ? iphoneNode.getChildMeshes() : printable);
      const pivot = new BABYLON.TransformNode('pivot', scene);
      pivot.setAbsolutePosition(center);
      if (iphoneNode)  iphoneNode.setParent(pivot);
      if (airpodsNode) airpodsNode.setParent(pivot);
      setPivot(pivot);
      frameCamera(camera, center, maxDim);

      // Rileva materiali scocca/schermo
      const allMaterials = scene.materials;
      const scoccaMaterials = allMaterials
        .filter(m => /scocca|retro|pulsanti|box|bordi|dettagli/i.test(m.name))
        .map(m => m.name);
      const schermoMaterial = allMaterials.find(m => /schermo|screen/i.test(m.name))?.name;

      window.scoccaMaterials = scoccaMaterials;
      window.schermoMaterial = schermoMaterial;

      // Helpers materiale (niente preload/prefetch: carico on-demand)
      function setAlbedo(materialNames, url) {
        const tex = new BABYLON.Texture(url, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
        tex.wrapU = tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
        materialNames.forEach(name => {
          const mat = scene.getMaterialByName(name);
          if (mat) mat.albedoTexture = tex;
        });
      }

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

      // Toggle cuffie: OFF = nodo intero disabilitato (sparisce anche qualsiasi ombra della mesh)
      const toggle = document.getElementById('toggle-airpods');
      if (airpodsNode && toggle) {
        // Applica stato iniziale da URL (se presente)
        setFormSelectionsFromQuery();
        airpodsNode.setEnabled(!!toggle.checked);
        toggle.addEventListener('change', () => {
          airpodsNode.setEnabled(toggle.checked);
          // fallback: in caso di mesh esterne alle cuffie con “shadow/ombra” nel nome
          scene.meshes.forEach(m => {
            if (!m || m.name == null) return;
            if (/(cuffie|airpods).*(shadow|ombra)|(shadow|ombra).*(cuffie|airpods)/i.test(m.name)) {
              m.setEnabled(toggle.checked);
            }
          });
        });
      } else {
        // Se non trovo il nodo cuffie, applico comunque le selezioni da URL
        setFormSelectionsFromQuery();
      }

      /* ----------- AR (WebXR / model-viewer) ----------- */
      const mv = document.getElementById('ar-bridge');
      const AR_BUTTON = document.getElementById('ar-button');
      const IS_IOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);

      // Forza PNG su iOS (Quick Look)
      function cloudinaryForcePNG(url) {
        if (!IS_IOS) return url;
        try {
          const u = new URL(url);
          if (u.hostname.includes('res.cloudinary.com')) u.searchParams.set('format', 'png');
          return u.toString();
        } catch { return url.replace('format=auto', 'format=png'); }
      }

      // Material names da “nascondere” in AR per cuffie OFF (fallback robusto)
      const AIRPODS_HIDE_LIST = ['bianco lucido', 'gomma', 'parti_scure cuffie'].map(s => s.toLowerCase());
      const isAirpodsMat = (name) => {
        const n = (name || '').toLowerCase().trim();
        return AIRPODS_HIDE_LIST.includes(n) || /(cuffie|airpods)/i.test(n);
      };

      // Applica config attuale a <model-viewer>
      async function syncMVFromPageState() {
        if (!mv) return;
        await mv.updateComplete;
        if (!mv.model) return;

        const colorId = document.querySelector('.color-options input:checked')?.id;
        const bgId    = document.querySelector('.background-options input:checked')?.id;
        const colorUrl = colorId ? cloudinaryForcePNG(textures.color[colorId]) : null;
        const bgUrl    = bgId    ? cloudinaryForcePNG(textures.background[bgId]) : null;

        const applyBaseColorTexture = async (materialName, url) => {
          if (!url) return;
          const mat = mv.model.materials.find(m => m.name === materialName);
          if (!mat) return;
          const slot = mat.pbrMetallicRoughness.baseColorTexture;
          const tex  = await mv.createTexture(url);
          if (slot) slot.setTexture(tex);
        };

        if (window.scoccaMaterials) {
          for (const mName of window.scoccaMaterials) await applyBaseColorTexture(mName, colorUrl);
        }
        if (window.schermoMaterial) await applyBaseColorTexture(window.schermoMaterial, bgUrl);

        // Cuffie ON/OFF in AR
        const on = !!document.getElementById('toggle-airpods')?.checked;
        mv.model.materials.forEach(mat => {
          if (!isAirpodsMat(mat.name)) return;
          try { mat.setAlphaMode(on ? 'BLEND' : 'MASK'); } catch {}
          if (!on) {
            mat.alphaCutoff = 1.0;
            mat.pbrMetallicRoughness.setBaseColorFactor([1,1,1,0]);
            mat.pbrMetallicRoughness.metallicFactor  = 0;
            mat.pbrMetallicRoughness.roughnessFactor = 1;
          } else {
            mat.pbrMetallicRoughness.setBaseColorFactor([1,1,1,1]);
          }
        });
      }

      // Click AR
      if (AR_BUTTON) {
        AR_BUTTON.addEventListener('click', async () => {
          const ua = navigator.userAgent;
          const isAndroid = /Android/i.test(ua);
          const isMobile  = /Android|iPhone|iPad/i.test(ua);

          if (!isMobile) {
            // Desktop: mostra QR con configurazione attuale
            const modal = document.getElementById('ar-qr-modal');
            const target = document.getElementById('qr-code');
            if (modal && target && window.QRCode) {
              target.innerHTML = '';
              new QRCode(target, { text: buildArShareUrl(), width: 220, height: 220 });
              modal.style.display = 'block';
            }
            return;
          }

          // 1) Prova WebXR su Android
          try {
            if (isAndroid && navigator.xr && await navigator.xr.isSessionSupported('immersive-ar')) {
              await scene.createDefaultXRExperienceAsync({
                uiOptions: { sessionMode: 'immersive-ar' },
                optionalFeatures: ['hit-test', 'dom-overlay'],
                referenceSpaceType: 'local-floor'
              });
              return;
            }
          } catch (e) {
            console.warn('WebXR non disponibile, uso fallback <model-viewer>:', e);
          }

          // 2) Fallback model-viewer (Scene Viewer / Quick Look)
          try {
            await syncMVFromPageState();
            await mv.activateAR();
          } catch (e) {
            console.error('AR fallback error:', e);
            alert('AR non disponibile su questo dispositivo/navigatore.');
          }
        });
      }

      // Se arrivo da QR: ripristina selezioni e auto-avvia AR
      (function handleQRDeepLink() {
        const q = getQuery();
        if (q.color || q.bg || typeof q.airpods === 'boolean') {
          setFormSelectionsFromQuery();
          // trigga gli handler per applicare le texture in Babylon
          const colorUrl = q.color ? textures.color[q.color] : null;
          const bgUrl    = q.bg    ? textures.background[q.bg] : null;
          if (colorUrl && window.scoccaMaterials?.length) {
            // applica scocca
            const ev = new Event('change'); 
            const el = document.getElementById(q.color); el && el.dispatchEvent(ev);
          }
          if (bgUrl && window.schermoMaterial) {
            const ev = new Event('change'); 
            const el = document.getElementById(q.bg); el && el.dispatchEvent(ev);
          }
          const tog = document.getElementById('toggle-airpods');
          if (tog) {
            const prev = !!tog.checked;
            tog.checked = !!q.airpods;
            if (prev !== tog.checked) tog.dispatchEvent(new Event('change'));
          }
        }
        if (q.ar) {
          const btn = document.getElementById('ar-button');
          btn && btn.click();
        }
      })();

    }, undefined, (error) => {
      console.error('GLB load error:', error?.message || error);
    });

    // Loop
    engine.runRenderLoop(() => babylonScene && babylonScene.render());
    window.addEventListener('resize', () => engine.resize());
  }

  /* ---------------------------------
   * Configuratore 2D (swap immagini)
   * --------------------------------- */
  (function init2D() {
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
   * AR button UI (icona SVG)
   * --------------------------------- */
  (function styleArButton() {
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
   * Modale QR — chiusura con “X”
   * --------------------------------- */
  (function initQrModalClose() {
    const modal = document.getElementById('ar-qr-modal');
    if (!modal) return;
    const x = modal.querySelector('.qr-close');
    x && x.addEventListener('click', () => { modal.style.display = 'none'; });
  })();
});
