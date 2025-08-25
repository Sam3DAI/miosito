// configuratori-3d-2d.js — build 2025-08-25a (Sam) — AR first-tap fix (iOS/Quick Look)
// - Model-Viewer: sempre createTexture() + setTexture() (no setURI diretto)
// - Attese deterministiche prima di activateAR() (updateComplete + 2×rAF)
// - Cache-bust iOS con stamp della configurazione (evita USDZ "vecchio")
// - Default radio di Colore/Sfondo auto-selezionati se mancanti
// - Nessuna modifica HTML richiesta

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
   * Icona AR sul bottone
   * --------------------------------- */
  (function setupArButtonUI() {
    const arBtn = document.getElementById('ar-button');
    if (!arBtn) return;
    arBtn.innerHTML = `
      <img src="https://res.cloudinary.com/dqhbriryo/image/upload/v1755855493/icona_Realt%C3%A0_Aumentata_y2p4ga.webp"
           alt=""
           decoding="async"
           loading="eager"
           style="display:block; width:100%; height:100%; object-fit:contain; padding:12%;" />
    `;
    Object.assign(arBtn.style, {
      background: '#fff',
      borderRadius: '999px',
      width: '64px',
      height: '64px',
      padding: '0',
      lineHeight: '0',
      boxShadow: '0 4px 10px rgba(63,169,245,0.15)',
      transition: 'transform .15s ease, box-shadow .2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
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

  // aria-current per il menu
  (function setAriaCurrent() {
    const norm = p => (p || '/').replace(/\/+$/, '') || '/';
    const here = norm(location.pathname);
    document.querySelectorAll('nav a, #mobile-menu a').forEach(a => {
      const href = norm(a.getAttribute('href'));
      if (href === here) a.setAttribute('aria-current', 'page');
    });
  })();

  // Mobile menu
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
   * Babylon.js 3D + AR bridge (model-viewer)
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

    // No tone mapping
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

    // Camera + pan RMB
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI, Math.PI / 2, 1.2, BABYLON.Vector3.Zero(), scene);
    const isMobileUA = /Android|iPhone|iPad/i.test(navigator.userAgent);
    camera.wheelDeltaPercentage = isMobileUA ? 0.01 : 0.02;
    camera.pinchDeltaPercentage = 0.01;
    camera.useNaturalPinchZoom = true;
    camera.inertia = 0.88;
    camera.panningInertia = 0.85;
    camera.minZ = 0.01;
    const pi = camera.inputs.attached.pointers;
    if (pi) { pi.buttons = [0, 1, 2]; pi.useCtrlForPanning = false; pi.panningMouseButton = 2; }
    camera.panningSensibility = 2000;
    camera.attachControl(canvas, true, false, true);

    // Autorotate dolce
    let pivot = null, autoRotateTimer = null, isRotating = true;
    scene.onBeforeRenderObservable.add(() => { if (isRotating && pivot) pivot.rotate(BABYLON.Axis.Y, 0.003, BABYLON.Space.LOCAL); });
    canvas.addEventListener('pointerdown', () => { isRotating = false; clearTimeout(autoRotateTimer); autoRotateTimer = setTimeout(() => (isRotating = true), 3000); });

    // Env + Post
    scene.environmentTexture  = BABYLON.CubeTexture.CreateFromPrefilteredData('https://assets.babylonjs.com/environments/studio.env', scene);
    scene.environmentIntensity = 0.6;
    const pipeline = new BABYLON.DefaultRenderingPipeline("default", true, scene, [camera]);
    pipeline.bloomEnabled = true; pipeline.bloomThreshold = 1.0; pipeline.bloomWeight = 0.25; pipeline.fxaaEnabled = true; pipeline.samples = 8;

    // Helpers bounds/camera
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
      // Nodi
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

      // Mappa materiali rilevanti (Babylon)
      const allMaterials = scene.materials;
      const scoccaMaterials = allMaterials.filter(m => /scocca|retro|pulsanti|box|bordi|dettagli/i.test(m.name)).map(m => m.name);
      const schermoMaterial = allMaterials.find(m => /schermo|screen/i.test(m.name))?.name;
      window.scoccaMaterials = scoccaMaterials;
      window.schermoMaterial = schermoMaterial;

      // Textures (Cloudinary)
      const textures = {
        color: {
          bianco: 'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068874/bianco_sdebye.png?quality=auto&format=auto',
          grigio: 'https://res.cloudinary.com/dqhbriryo/image_upload/v1752068859/grigio_iutpvj.png?quality=auto&format=auto'.replace('image_upload','image/upload'),
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

      // --- NO-FLASH Babylon: applica texture solo quando caricate ---
      function setAlbedo(materialNames, url) {
        const tex = new BABYLON.Texture(url, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
        tex.wrapU = tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
        tex.onLoadObservable.addOnce(() => {
          materialNames.forEach(name => {
            const mat = scene.getMaterialByName(name);
            if (mat) mat.albedoTexture = tex;
          });
        });
      }
      (function warmTexturesForCache(){
        const urls = [...Object.values(textures.color), ...Object.values(textures.background)];
        setTimeout(() => { urls.forEach(u => { const img = new Image(); img.decoding = 'async'; img.src = u; }); }, 100);
      })();

      // Forza default radio se mancanti e applica subito in Babylon
      function ensureDefaultSelections() {
        const colorFirst = document.querySelector('.color-options input[type="radio"]');
        const bgFirst    = document.querySelector('.background-options input[type="radio"]');
        if (colorFirst && !document.querySelector('.color-options input:checked')) {
          colorFirst.checked = true;
        }
        if (bgFirst && !document.querySelector('.background-options input:checked')) {
          bgFirst.checked = true;
        }
      }
      ensureDefaultSelections();
      // Applica default in Babylon
      (function applyDefaultBabylon(){
        const colorId = document.querySelector('.color-options input:checked')?.id;
        const bgId    = document.querySelector('.background-options input:checked')?.id;
        if (colorId && textures.color[colorId] && scoccaMaterials?.length) setAlbedo(scoccaMaterials, textures.color[colorId]);
        if (bgId && textures.background[bgId] && schermoMaterial)         setAlbedo([schermoMaterial], textures.background[bgId]);
      })();

      // UI listeners (Babylon lato 3D realtime)
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

      /* -------- AR bridge (model-viewer) -------- */
      const IS_IOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
      const arButton = document.getElementById('ar-button');
      const mv = document.getElementById('ar-bridge');
      if (mv) mv.setAttribute('shadow-intensity','0'); // niente ombre nel viewer nascosto

      // AirPods visibilità in model-viewer
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
        } catch {}
      }

      // Regex fallback per mappare i materiali scocca su MV
      function findScoccaMaterialsInMV() {
        if (!mv?.model) return [];
        const rx = /(scocca|retro|pulsanti|box|bordi|dettagli)/i;
        return mv.model.materials.filter(m => rx.test(m.name)).map(m => m.name);
      }

      // Helpers URL/config
      function configStamp() {
        const colorId   = document.querySelector('.color-options input:checked')?.id || 'bianco';
        const bgId      = document.querySelector('.background-options input:checked')?.id || 'sfondo-nero-bronzo';
        const airpodsOn = !!document.getElementById('toggle-airpods')?.checked;
        return `c=${colorId}|bg=${bgId}|hp=${airpodsOn?1:0}`;
      }
      function toIOSPngWithStamp(url, stamp) {
        try {
          const u = new URL(url);
          if (u.hostname.includes('res.cloudinary.com')) {
            u.searchParams.set('format','png');
            u.searchParams.set('v', stamp);
          } else {
            // fallback generico
            u.searchParams.set('format','png');
            u.searchParams.set('v', stamp);
          }
          return u.toString();
        } catch {
          const sep = url.includes('?') ? '&' : '?';
          return `${url}${sep}format=png&v=${encodeURIComponent(stamp)}`;
        }
      }
      function buildArShareUrl() {
        const url = new URL(location.href);
        url.searchParams.set('ar','1');
        const colorId   = document.querySelector('.color-options input:checked')?.id || 'bianco';
        const bgId      = document.querySelector('.background-options input:checked')?.id || 'sfondo-nero-bronzo';
        const airpodsOn = !!document.getElementById('toggle-airpods')?.checked;
        url.searchParams.set('color', colorId);
        url.searchParams.set('bg', bgId);
        url.searchParams.set('airpods', airpodsOn ? '1' : '0');
        return url.toString();
      }
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
      function setFormSelectionsFromQuery() {
        const { color, bg, airpods } = getQuery();
        if (color) { const el = document.getElementById(color); if (el && el.type === 'radio') el.checked = true; }
        if (bg)    { const el = document.getElementById(bg);    if (el && el.type === 'radio') el.checked = true; }
        const tgl = document.getElementById('toggle-airpods');
        if (tgl && airpods !== null) tgl.checked = airpods;
      }

      // MV texture application (sempre createTexture -> setTexture) + attese
      async function applyTextureMVByName(materialName, url, stamp) {
        if (!mv?.model || !materialName || !url) return;
        const uri = IS_IOS ? toIOSPngWithStamp(url, stamp) : url;
        const mat = mv.model.materials.find(m => m.name === materialName);
        if (!mat) return;
        const tex = await mv.createTexture(uri); // garantisce immagine caricata
        const texInfo = mat.pbrMetallicRoughness.baseColorTexture;
        if (texInfo && typeof texInfo.setTexture === 'function') {
          texInfo.setTexture(tex);
        }
      }
      async function applyConfigToModelViewer() {
        if (!mv) return;
        await mv.updateComplete;
        if (!mv.model) return;

        // mappa materiali scocca
        let mvScocca = window.scoccaMaterials || [];
        if (!mvScocca.length) mvScocca = findScoccaMaterialsInMV();

        const colorId = document.querySelector('.color-options input:checked')?.id;
        const bgId    = document.querySelector('.background-options input:checked')?.id;
        const colorUrl = colorId ? window.textures?.color?.[colorId] : null;
        const bgUrl    = bgId    ? window.textures?.background?.[bgId] : null;
        const stamp = configStamp();

        const tasks = [];
        if (colorUrl && mvScocca.length) {
          mvScocca.forEach(name => tasks.push(applyTextureMVByName(name, colorUrl, stamp)));
        }
        if (window.schermoMaterial && bgUrl) {
          tasks.push(applyTextureMVByName(window.schermoMaterial, bgUrl, stamp));
        }
        await Promise.all(tasks);

        // cuffie ON/OFF (nodo invisibile)
        const headphonesOn = !!document.getElementById('toggle-airpods')?.checked;
        setAirpodsVisibleInMV(headphonesOn);

        // attese per commit
        await mv.updateComplete;
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      }

      // Toggle cuffie in Babylon
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

      // Click AR
      if (arButton) {
        arButton.addEventListener('click', async () => {
          const ua = navigator.userAgent;
          const isAndroid = /Android/i.test(ua);
          const isMobile  = /Android|iPhone|iPad/i.test(ua);

          // Desktop -> QR
          if (!isMobile) {
            const m = document.getElementById('ar-qr-modal');
            const box = document.getElementById('qr-code');
            if (m && box && window.QRCode) {
              box.innerHTML = '';
              new QRCode(box, { text: buildArShareUrl(), width: 220, height: 220 });
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

          // iOS/Android fallback via model-viewer (deterministico)
          try {
            // iOS: assicura USDZ runtime (niente ios-src statico)
            if (IS_IOS && mv?.hasAttribute('ios-src')) mv.removeAttribute('ios-src');
            await applyConfigToModelViewer(); // <<--- FIX CHIAVE
            await mv.activateAR();
          } catch (e) {
            // piccolo retry (alcuni Safari ignorano la 1ª)
            try {
              await new Promise(r => setTimeout(r, 180));
              await mv.activateAR();
            } catch (e2) {
              console.error('AR non disponibile:', e2);
              alert('AR non disponibile su questo dispositivo/navigatore.');
            }
          }
        });
      }

      // Deep-link da QR: auto-AR
      (function handleDeepLink() {
        const q = getQuery();
        const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
        if (!isMobile) return;

        // UI da query + Babylon subito
        setFormSelectionsFromQuery();
        (function applyBabylonDirect(){
          const color = document.querySelector('.color-options input:checked')?.id;
          const bg    = document.querySelector('.background-options input:checked')?.id;
          if (color && window.textures?.color[color] && scoccaMaterials?.length) setAlbedo(scoccaMaterials, window.textures.color[color]);
          if (bg && window.textures?.background[bg] && schermoMaterial)         setAlbedo([schermoMaterial], window.textures.background[bg]);
          if (toggle && airpodsNode) {
            airpodsNode.setEnabled(toggle.checked);
            scene.meshes.forEach(m => {
              if (!m || m.name == null) return;
              if (/(cuffie|airpods).*(shadow|ombra)|(shadow|ombra).*(cuffie|airpods)/i.test(m.name)) m.setEnabled(toggle.checked);
            });
          }
        })();

        if (!q.ar) return;

        let overlay = null;
        function ensureOverlay() {
          if (overlay || !document.body) return;
          overlay = document.createElement('div');
          overlay.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35);backdrop-filter:saturate(140%) blur(2px);z-index:9999;cursor:pointer;';
          overlay.innerHTML = '<div style="background:#fff;border-radius:16px;padding:14px 16px;font:600 16px/1.2 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.18)">Tocca per aprire la Realtà Aumentata</div>';
          overlay.addEventListener('pointerdown', async () => {
            try { await tryLaunchAR(true); } finally { overlay?.remove(); overlay=null; }
          }, { once:true });
          document.body.appendChild(overlay);
        }

        async function tryLaunchAR(fromGesture=false){
          if (IS_IOS && mv?.hasAttribute('ios-src')) mv.removeAttribute('ios-src');
          await applyConfigToModelViewer(); // <<--- FIX CHIAVE ANCHE QUI
          try {
            await mv.activateAR();
          } catch (e1) {
            await new Promise(r => setTimeout(r, 180));
            try { await mv.activateAR(); } catch(e2){
              if (!fromGesture) ensureOverlay();
            }
          }
        }

        if (mv?.model) tryLaunchAR(false);
        else mv.addEventListener('load', () => tryLaunchAR(false), { once:true });
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
