// configuratori-3d-2d.js — build 2025-08-22a
// - Ripristino carousel + hamburger timing come versione iniziale
// - Default selezioni: Colore (prima), Sfondo (primo), Cuffie OFF
// - AR robusto: applico texture a <model-viewer> PRIMA di activateAR()
//   (attendo 'scene-graph-ready' + preload immagini + 2 RAF) e overlay tap
// - Babylon: swap texture senza flash; cuffie senza ombre quando OFF

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
  const arButton = document.getElementById('ar-button');
  const mv = document.getElementById('ar-bridge');
  const IS_IOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
  const IS_MOBILE = /Android|iPhone|iPad/i.test(navigator.userAgent);

  /* ---------------------------------
   * Icona AR grande nel pulsante
   * --------------------------------- */
  (function setupArButtonUI() {
    if (!arButton) return;
    arButton.innerHTML = `
      <img src="https://res.cloudinary.com/dqhbriryo/image/upload/v1755855493/icona_Realt%C3%A0_Aumentata_y2p4ga.webp"
           alt="" decoding="async" loading="eager"
           style="display:block;width:100%;height:100%;object-fit:contain;padding:12%;" />
    `;
    Object.assign(arButton.style, {
      background:'#fff', borderRadius:'999px', width:'64px', height:'64px', padding:'0', lineHeight:'0',
      boxShadow:'0 4px 10px rgba(63,169,245,0.15)', transition:'transform .15s ease, box-shadow .2s ease',
      display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden'
    });
    arButton.addEventListener('mouseenter', () => {
      arButton.style.transform='scale(1.06)';
      arButton.style.boxShadow='0 8px 24px rgba(63,169,245,0.25)';
    });
    arButton.addEventListener('mouseleave', () => {
      arButton.style.transform='scale(1)';
      arButton.style.boxShadow='0 4px 10px rgba(63,169,245,0.15)';
    });
  })();

  /* ---------------------------------
   * Link corrente (desktop + mobile)
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
   * Hamburger — timing identico all’originale
   * --------------------------------- */
  const setMobileState = (open) => {
    if (!hamburger || !mobileMenu) return;
    hamburger.classList.toggle('active', open);
    mobileMenu.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    if (open) {
      mobileMenu.removeAttribute('hidden');                 // mostra (transizione CSS)
      document.documentElement.style.overflow = 'hidden';   // blocca scroll
    } else {
      document.documentElement.style.overflow = '';         // sblocca scroll
      setTimeout(() => mobileMenu.setAttribute('hidden', ''), 300); // nascondi dopo transizione
    }
  };
  const toggleMenu = () => setMobileState(!hamburger.classList.contains('active'));
  if (hamburger) {
    hamburger.addEventListener('click', toggleMenu);
    hamburger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(); }
    });
  }
  // Chiudi il menu quando clicchi una voce (come prima)
  mobileMenu?.querySelectorAll('a')?.forEach(link =>
    link.addEventListener('click', () => setMobileState(false))
  );

  // Header shadow: soglia 50px (come prima)
  window.addEventListener('scroll', () => {
    header && header.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  /* ---------------------------------
   * Tema + sync grafici
   * --------------------------------- */
  const THEME_KEY = 'svx-theme';
  const mediaDark = window.matchMedia('(prefers-color-scheme: dark)');
  let statsChart = null, babylonScene = null;

  function currentTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return mediaDark.matches ? 'dark' : 'light';
  }
  const getAxisLabelColor = () => body.classList.contains('dark-mode') ? '#f5f5f7' : '#1d1d1f';
  function updateChartTheme() {
    if (!statsChart) return;
    statsChart.updateOptions({
      xaxis: { labels: { style: { colors: getAxisLabelColor(), fontSize:'14px' } } },
      yaxis: { labels: { style: { colors: getAxisLabelColor(), fontSize:'14px' } } }
    }, false, true);
  }
  function applyTheme(theme) {
    const isDark = theme === 'dark';
    body.classList.toggle('dark-mode', isDark);
    themeToggle?.setAttribute('aria-pressed', String(isDark));
    if (sunIcon && moonIcon) {
      sunIcon.style.display = isDark ? 'none' : 'block';
      moonIcon.style.display = isDark ? 'block' : 'none';
    }
    updateChartTheme();
    updateModelBackground();
  }
  applyTheme(currentTheme());
  themeToggle?.addEventListener('click', () => {
    const next = body.classList.contains('dark-mode') ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });
  mediaDark.addEventListener('change', (e) => { if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches ? 'dark' : 'light'); });

  /* ---------------------------------
   * Carousel — frecce + loop infinito (come versione iniziale)
   * --------------------------------- */
  (function initCarousels() {
    const containers = document.querySelectorAll('.carousel-container');
    containers.forEach(container => {
      const wrapper = container.querySelector('.carousel-wrapper');
      const leftArrow = container.querySelector('.carousel-arrow.left');
      const rightArrow = container.querySelector('.carousel-arrow.right');
      let isScrolling = false;
      if (!wrapper || !leftArrow || !rightArrow) return;
      const scrollByAmount = 300;

      leftArrow.addEventListener('click', () => {
        if (isScrolling) return; isScrolling = true;
        wrapper.scrollBy({ left: -scrollByAmount, behavior: 'smooth' });
        setTimeout(() => {
          if (wrapper.scrollLeft <= 0) {
            wrapper.scrollTo({ left: wrapper.scrollWidth - wrapper.clientWidth, behavior: 'smooth' });
          }
          isScrolling = false;
        }, 300);
      });

      rightArrow.addEventListener('click', () => {
        if (isScrolling) return; isScrolling = true;
        wrapper.scrollBy({ left: scrollByAmount, behavior: 'smooth' });
        setTimeout(() => {
          if (wrapper.scrollLeft + wrapper.clientWidth >= wrapper.scrollWidth - 1) {
            wrapper.scrollTo({ left: 0, behavior: 'smooth' });
          }
          isScrolling = false;
        }, 300);
      });
    });
  })();

  /* ---------------------------------
   * Lazy BG card + Prefetch link interni
   * --------------------------------- */
  (function lazyBackgrounds() {
    const lazyCards = document.querySelectorAll('.benefit-card.lazy-bg[data-bg]');
    if (!('IntersectionObserver' in window) || !lazyCards.length) return;
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const url = el.getAttribute('data-bg');
        if (url) { el.style.backgroundImage = `url('${url}')`; el.removeAttribute('data-bg'); }
        o.unobserve(el);
      });
    }, { rootMargin: '200px 0px' });
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
    document.querySelectorAll('.color-options-2d input').forEach(input => {
      input.addEventListener('change', () => {
        const sw = input.nextElementSibling;
        const next = sw?.getAttribute('data-image');
        const name = (input.value || '').trim();
        if (!next) return;
        img.style.opacity = '0';
        const tmp = new Image();
        tmp.onload = () => { img.src = next; img.alt = `Prodotto Configurabile 2D - ${name.charAt(0).toUpperCase() + name.slice(1)}`; img.style.opacity = '1'; };
        tmp.src = next;
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
      chart: { type:'bar', height:350, animations:{ enabled:true, easing:'easeinout', speed:2000, animateGradually:{enabled:true,delay:150}, dynamicAnimation:{enabled:true,speed:350} }, toolbar:{show:false} },
      plotOptions: { bar:{ horizontal:true, barHeight:'75%', distributed:true } },
      dataLabels: { enabled:false },
      series: [{ data:[82,94,66,40] }],
      xaxis: { categories:['Engagement Utenti','Tasso di Conversione','Soddisfazione Clienti','Riduzione Resi'],
        labels:{ formatter:v=>`${v}%`, style:{ colors:getAxisLabelColor(), fontSize:'14px' } }, axisBorder:{show:false}, axisTicks:{show:false} },
      yaxis: { labels:{ formatter:v=> (v==='Engagement Utenti'?['Engagement','Utenti']: v==='Tasso di Conversione'?['Tasso di','Conversione'] : v==='Soddisfazione Clienti'?['Soddisfazione','Clienti']: v), style:{ colors:getAxisLabelColor(), fontSize:'14px' } },
        axisBorder:{show:false}, axisTicks:{show:false} },
      colors:['#45b6fe','#6a9bfe','#8f80fe','#d95bc5'],
      grid:{show:false}, tooltip:{enabled:false}
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

  /* ---------------------------------
   * Babylon.js configuratore 3D
   * --------------------------------- */
  function updateModelBackground() {
    if (!babylonScene) return;
    const isDark = body.classList.contains('dark-mode');
    const bg = isDark ? '#000000' : '#FAFAFA';
    const canvas = document.getElementById('renderCanvas');
    if (canvas) canvas.style.backgroundColor = bg;
    const container = canvas?.parentElement; if (container) container.style.backgroundColor = bg;
    const c = BABYLON.Color3.FromHexString(bg);
    babylonScene.clearColor = new BABYLON.Color4(c.r, c.g, c.b, 1);
  }

  if (document.getElementById('renderCanvas')) {
    const canvas = document.getElementById('renderCanvas');
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    const engine = new BABYLON.Engine(canvas, true, { antialias:true, adaptToDeviceRatio:true, alpha:false, preserveDrawingBuffer:true, stencil:true });
    const scene = new BABYLON.Scene(engine); babylonScene = scene;

    // No tone mapping, match pagina
    scene.imageProcessingConfiguration.toneMappingEnabled = false;
    scene.imageProcessingConfiguration.exposure = 1.0;
    scene.imageProcessingConfiguration.isEnabled = false;
    updateModelBackground();
    themeToggle?.addEventListener('click', updateModelBackground);

    // Luci
    new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0,1,0), scene).intensity = 0.4;
    const dirLight = new BABYLON.DirectionalLight("dir", new BABYLON.Vector3(-1,-2,-1), scene);
    dirLight.position = new BABYLON.Vector3(5,10,5); dirLight.intensity = 0.5;
    new BABYLON.PointLight("pt", new BABYLON.Vector3(-3,2,0), scene).intensity = 0.3;

    // Camera
    const camera = new BABYLON.ArcRotateCamera("cam", Math.PI, Math.PI/2, 1.2, BABYLON.Vector3.Zero(), scene);
    const isMobileUA = IS_MOBILE;
    camera.wheelDeltaPercentage = isMobileUA ? 0.01 : 0.02;
    camera.pinchDeltaPercentage = 0.01;
    camera.useNaturalPinchZoom = true;
    camera.inertia = 0.88; camera.panningInertia = 0.85; camera.minZ = 0.01;
    const pi = camera.inputs.attached.pointers;
    if (pi) { pi.buttons = [0,1,2]; pi.useCtrlForPanning = false; pi.panningMouseButton = 2; }
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
      let min = new BABYLON.Vector3(+Infinity,+Infinity,+Infinity);
      let max = new BABYLON.Vector3(-Infinity,-Infinity,-Infinity);
      meshes.forEach(m => { const bi = m.getBoundingInfo(); min = BABYLON.Vector3.Minimize(min, bi.boundingBox.minimumWorld); max = BABYLON.Vector3.Maximize(max, bi.boundingBox.maximumWorld); });
      const center = min.add(max).scale(0.5); const size = max.subtract(min); const maxDim = Math.max(size.x,size.y,size.z);
      return { center, maxDim };
    }
    function frameCamera(cam, center, maxDim) {
      cam.setTarget(center);
      const fov = cam.fov || (Math.PI/3);
      const radius = (maxDim*0.6)/Math.tan(fov/2) + maxDim*0.2;
      cam.radius = radius; cam.lowerRadiusLimit = Math.max(radius*0.35, 0.02); cam.upperRadiusLimit = radius*3;
    }
    const setPivot = (p) => { pivot = p; };

    // Carica GLB
    BABYLON.SceneLoader.ImportMesh('', './assets/', 'iphone_16_pro_configuratore_3d.glb', scene, (meshes) => {
      const iphoneNode = scene.getTransformNodeByName('iphone') || scene.getNodeByName('iphone') || meshes[0];
      const airpodsNode = scene.getNodeByName('Airpods') || scene.getNodeByName('airpods') || scene.getNodeByName('Cuffie') || scene.getNodeByName('cuffie') || scene.getTransformNodeByName('Airpods');

      const printable = meshes.filter(m => m.getBoundingInfo);
      const { center, maxDim } = computeBounds(iphoneNode?.getChildMeshes ? iphoneNode.getChildMeshes() : printable);
      const pv = new BABYLON.TransformNode('pivot', scene);
      pv.setAbsolutePosition(center);
      if (iphoneNode)  iphoneNode.setParent(pv);
      if (airpodsNode) airpodsNode.setParent(pv);
      setPivot(pv); frameCamera(camera, center, maxDim);

      const allMaterials = scene.materials;
      const scoccaMaterials = allMaterials.filter(m => /scocca|retro|pulsanti|box|bordi|dettagli/i.test(m.name)).map(m => m.name);
      const schermoMaterial = allMaterials.find(m => /schermo|screen/i.test(m.name))?.name;
      window.scoccaMaterials = scoccaMaterials;
      window.schermoMaterial = schermoMaterial;

      const textures = {
        color: {
          bianco: 'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068874/bianco_sdebye.png?quality=auto&format=auto',
          grigio: 'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068859/grigio_iutpvj.png?quality=auto&format=auto',
          bronzo: 'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068893/bronzo_g23m36.png?quality=auto&format=auto',
          nero:   'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068910/nero_whga1l.png?quality=auto&format=auto'
        },
        background: {
          'sfondo-nero-bronzo':'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981260/sfondo_iphone_viola_e_nero_qhggk6.webp?quality=auto&format=auto',
          'sfondo-arancio-nero':'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981229/sfondo_iphone_nero_e_rosso_yzpl6h.webp?quality=auto&format=auto',
          'sfondo-nero-blu':'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981196/sfondo_iphone_nero_e_bronzo_cmmt3h.webp?quality=auto&format=auto',
          'sfondo-nero-viola':'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981244/sfondo_iphone_nero_e_blue_h6rgcb.webp?quality=auto&format=auto'
        }
      };
      window.textures = textures;

      // NO-FLASH: applica solo a texture caricate
      function setAlbedo(materialNames, url) {
        const t = new BABYLON.Texture(url, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
        t.wrapU = t.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
        t.onLoadObservable.addOnce(() => {
          materialNames.forEach(name => {
            const mat = scene.getMaterialByName(name);
            if (mat) mat.albedoTexture = t;
          });
        });
      }
      // scaldare cache
      setTimeout(() => {
        [...Object.values(textures.color), ...Object.values(textures.background)]
          .forEach(u => { const img = new Image(); img.decoding='async'; img.crossOrigin='anonymous'; img.src = u; });
      }, 100);

      /* --------- DEFAULT SELEZIONI (se non presenti in query) ---------- */
      const qsp = new URLSearchParams(location.search);
      const hasQueryColor = !!qsp.get('color');
      const hasQueryBg = !!qsp.get('bg');
      const hasQueryAir = qsp.get('airpods') !== null;

      // UI default check
      if (!hasQueryColor) document.querySelector('.color-options input')?.setAttribute('checked','');
      if (!hasQueryBg) document.querySelector('.background-options input')?.setAttribute('checked','');
      if (!hasQueryAir) document.getElementById('toggle-airpods')?.removeAttribute('checked'); // OFF

      // Applica default a Babylon
      const defaultColorId = document.querySelector('.color-options input:checked')?.id || 'bianco';
      const defaultBgId    = document.querySelector('.background-options input:checked')?.id || 'sfondo-nero-bronzo';
      if (scoccaMaterials?.length) setAlbedo(scoccaMaterials, textures.color[defaultColorId]);
      if (schermoMaterial)         setAlbedo([schermoMaterial], textures.background[defaultBgId]);
      // Cuffie OFF di default
      if (airpodsNode) airpodsNode.setEnabled(!!document.getElementById('toggle-airpods')?.checked);

      // Listeners configuratore 3D (Babylon) + sync su <model-viewer>
      const debounce = (fn, wait=120) => { let t; return (...args) => { clearTimeout(t); t=setTimeout(()=>fn(...args), wait); }; };
      const debouncedSyncMV = debounce(syncMVFromPageState, 120);

      document.querySelectorAll('.color-options input').forEach(input => {
        input.addEventListener('change', () => {
          const url = textures.color[input.id];
          if (url && scoccaMaterials?.length) setAlbedo(scoccaMaterials, url);
          debouncedSyncMV();
        });
      });
      document.querySelectorAll('.background-options input').forEach(input => {
        input.addEventListener('change', () => {
          const url = textures.background[input.id];
          if (url && schermoMaterial) setAlbedo([schermoMaterial], url);
          debouncedSyncMV();
        });
      });
      const toggle = document.getElementById('toggle-airpods');
      if (airpodsNode && toggle) {
        airpodsNode.setEnabled(!!toggle.checked);
        toggle.addEventListener('change', () => {
          airpodsNode.setEnabled(toggle.checked);
          // disattiva eventuali ombre/mesh delle cuffie
          scene.meshes.forEach(m => {
            if (!m || m.name == null) return;
            if (/(cuffie|airpods).*(shadow|ombra)|(shadow|ombra).*(cuffie|airpods)/i.test(m.name)) m.setEnabled(toggle.checked);
          });
          debouncedSyncMV();
        });
      }

      /* -------- AR bridge (model-viewer): sincronizzazione sicura -------- */
      if (mv) mv.setAttribute('shadow-intensity','0');

      const AR_MAT_ORIG = new Map();
      const AIRPODS_HIDE_LIST = ['bianco lucido','gomma','parti_scure cuffie'].map(s => s.toLowerCase());
      const shouldHideMatName = (name) => {
        const n = (name || '').toLowerCase().trim();
        return AIRPODS_HIDE_LIST.includes(n) || /(cuffie|airpods)/i.test(n);
      };
      function forcePNG(url) {
        try { const u = new URL(url); if (u.hostname.includes('res.cloudinary.com')) u.searchParams.set('format','png'); return u.toString(); }
        catch { return url.replace('format=auto','format=png'); }
      }
      function getCurrentConfig() {
        const colorId   = document.querySelector('.color-options input:checked')?.id || 'bianco';
        const bgId      = document.querySelector('.background-options input:checked')?.id || 'sfondo-nero-bronzo';
        const airpodsOn = !!document.getElementById('toggle-airpods')?.checked;
        return { colorId, bgId, airpodsOn };
      }
      function buildArShareUrl() {
        const url = new URL(location.href);
        const { colorId, bgId, airpodsOn } = getCurrentConfig();
        url.searchParams.set('ar','1');
        url.searchParams.set('color', colorId);
        url.searchParams.set('bg', bgId);
        url.searchParams.set('airpods', airpodsOn ? '1' : '0');
        return url.toString();
      }

      async function preloadImage(url) {
        if (!url) return;
        await new Promise(res => {
          const im = new Image(); im.crossOrigin='anonymous';
          im.onload = res; im.onerror = res; im.src = url;
        });
      }

      async function applyTextureByURI(materialName, url) {
        if (!url || !mv?.model) return;
        const mat = mv.model.materials.find(m => m.name === materialName);
        if (!mat) return;
        const uri = IS_IOS ? forcePNG(url) : url;

        // Precarico lato browser (aiuta Quick Look a non "perdere" la texture)
        await preloadImage(uri);

        const texInfo = mat.pbrMetallicRoughness.baseColorTexture;
        const source = texInfo?.texture?.source;
        if (source && typeof source.setURI === 'function') {
          source.setURI(uri); // niente blob:
        } else if (typeof mv.createTexture === 'function' && typeof texInfo?.setTexture === 'function') {
          const tex = await mv.createTexture(uri);
          texInfo.setTexture(tex);
        }
      }

      async function syncMVFromPageState() {
        if (!mv) return;
        await mv.updateComplete;
        if (!mv.model) return;
        const { colorId, bgId } = getCurrentConfig();
        const colorUrl = textures.color[colorId];
        const bgUrl    = textures.background[bgId];

        if (window.scoccaMaterials) {
          for (const mName of window.scoccaMaterials) await applyTextureByURI(mName, colorUrl);
        }
        if (window.schermoMaterial) await applyTextureByURI(window.schermoMaterial, bgUrl);

        // Cuffie ON/OFF: invisibilità reale in MV
        const headphonesOn = !!document.getElementById('toggle-airpods')?.checked;
        try {
          const sceneSym = Object.getOwnPropertySymbols(mv).find(s => s.description === 'scene');
          const threeScene = mv[sceneSym];
          const root = threeScene?.children?.[0];
          ['Airpods','airpods','Cuffie','cuffie'].forEach(n => { const obj = root?.getObjectByName(n); if (obj) obj.visible = headphonesOn; });
          threeScene?.queueRender?.();
        } catch {}

        // Materiali cuffie: nascondi quando OFF (alpha 0) e ripristina quando ON
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
            try { mat.setAlphaMode((o && o.alphaMode) || 'OPAQUE'); } catch {}
            mat.alphaCutoff = (o && o.alphaCutoff !== undefined) ? o.alphaCutoff : 0.5;
            if (o) {
              mat.pbrMetallicRoughness.setBaseColorFactor(o.baseColorFactor);
              mat.pbrMetallicRoughness.metallicFactor = o.metallicFactor;
              mat.pbrMetallicRoughness.roughnessFactor = o.roughnessFactor;
            } else {
              mat.pbrMetallicRoughness.setBaseColorFactor([1,1,1,1]);
            }
          }
        });
      }

      const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));
      async function ensureMVReadyWithTextures() {
        if (!mv) return;
        // aspetta la scene-graph di <model-viewer>
        if (!mv.model) {
          await new Promise(res => mv.addEventListener('scene-graph-ready', res, { once:true }));
        }
        // sincronizza e lascia “assestare” (serve a Safari/Quick Look)
        await syncMVFromPageState();
        await mv.updateComplete;
        await nextFrame(); await nextFrame();
        await new Promise(r => setTimeout(r, 200));
      }

      // Click AR (desktop => QR; mobile => AR)
      arButton?.addEventListener('click', async () => {
        if (!IS_MOBILE) {
          const m = document.getElementById('ar-qr-modal');
          const box = document.getElementById('qr-code');
          if (m && box && window.QRCode) {
            box.innerHTML = '';
            new QRCode(box, { text: buildArShareUrl(), width: 220, height: 220 });
            m.style.display = 'block';
          } else if (m) { m.style.display = 'block'; }
          return;
        }

        try {
          // iOS: niente ios-src → USDZ generato dallo stato corrente
          if (IS_IOS && mv?.hasAttribute('ios-src')) mv.removeAttribute('ios-src');

          await ensureMVReadyWithTextures();
          await mv.activateAR();
        } catch (e) {
          console.warn('AR non immediatamente disponibile, richiedo gesto:', e);
          // Overlay “tap per aprire”
          const overlay = document.createElement('div');
          overlay.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35);backdrop-filter:saturate(140%) blur(2px);z-index:9999;cursor:pointer;';
          overlay.innerHTML = '<div style="background:#fff;border-radius:16px;padding:14px 16px;font:600 16px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.18)">Tocca per aprire la Realtà Aumentata</div>';
          overlay.addEventListener('pointerdown', async () => {
            try { await ensureMVReadyWithTextures(); await mv.activateAR(); } finally { overlay.remove(); }
          }, { once:true });
          document.body.appendChild(overlay);
        }
      });

      // Deep-link da QR: ?ar=1&color=...&bg=...&airpods=...
      (function handleDeepLink() {
        if (!IS_MOBILE) return;
        const qs = new URLSearchParams(location.search);
        const toAR = qs.get('ar') === '1';

        // set UI da query
        const color = qs.get('color'); const bg = qs.get('bg'); const air = qs.get('airpods');
        if (color) document.getElementById(color)?.setAttribute('checked','');
        if (bg)    document.getElementById(bg)?.setAttribute('checked','');
        if (air !== null) {
          const tgl = document.getElementById('toggle-airpods');
          if (tgl) tgl.checked = (air === '1');
        }

        // Applica anche a Babylon (istantaneo)
        if (color && window.textures?.color[color] && scoccaMaterials?.length) setAlbedo(scoccaMaterials, window.textures.color[color]);
        if (bg && window.textures?.background[bg] && schermoMaterial)         setAlbedo([schermoMaterial], window.textures.background[bg]);
        if (air !== null && airpodsNode) airpodsNode.setEnabled(air === '1');

        if (!toAR) return;

        // tenta l’auto-AR appena la scene-graph è pronta (Safari chiederà comunque un tap se necessario)
        const tryAuto = async () => {
          try {
            if (IS_IOS && mv?.hasAttribute('ios-src')) mv.removeAttribute('ios-src');
            await ensureMVReadyWithTextures();
            await mv.activateAR();
          } catch {
            // mostra overlay tap
            const ov = document.createElement('div');
            ov.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35);backdrop-filter:saturate(140%) blur(2px);z-index:9999;cursor:pointer;';
            ov.innerHTML = '<div style="background:#fff;border-radius:16px;padding:14px 16px;font:600 16px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.18)">Tocca per aprire la Realtà Aumentata</div>';
            ov.addEventListener('pointerdown', async () => { try { await ensureMVReadyWithTextures(); await mv.activateAR(); } finally { ov.remove(); } }, { once:true });
            document.body.appendChild(ov);
          }
        };

        if (mv?.model) tryAuto();
        else mv.addEventListener('scene-graph-ready', () => tryAuto(), { once:true });
      })();

    }, undefined, (error) => console.error('ERRORE CARICAMENTO:', error?.message || error));

    // Render loop
    engine.runRenderLoop(() => babylonScene && babylonScene.render());
    window.addEventListener('resize', () => engine.resize());
  }

  /* ---------------------------------
   * Modale QR — chiusura con “X”
   * --------------------------------- */
  (function initQrModalClose() {
    const modal = document.getElementById('ar-qr-modal');
    modal?.querySelector('.qr-close')?.addEventListener('click', () => { modal.style.display = 'none'; });
  })();
});
