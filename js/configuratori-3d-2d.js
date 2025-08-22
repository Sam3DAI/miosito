// configuratori-3d-2d.js — build 2025-08-22a
// - Default UI: bianco + sfondo-nero-bronzo + cuffie OFF
// - Carousel: loop infinito con transform (fluido, una card per volta)
// - Hamburger: timing sincronizzato alla transition CSS
// - AR: sincronizzazione config PRIMA di activateAR + preload immagini (Safari fix)

document.addEventListener('DOMContentLoaded', () => {
  /* -------------------- Base / UI -------------------- */
  const body = document.body;
  const header = document.querySelector('header');
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const themeToggle = document.querySelector('.theme-toggle');
  const sunIcon = document.querySelector('.theme-icon.sun');
  const moonIcon = document.querySelector('.theme-icon.moon');

  /* -------------------- Pulsante AR: icona grande -------------------- */
  (function setupArButtonUI() {
    const arBtn = document.getElementById('ar-button');
    if (!arBtn) return;
    arBtn.innerHTML = `
      <img src="https://res.cloudinary.com/dqhbriryo/image/upload/v1755855493/icona_Realt%C3%A0_Aumentata_y2p4ga.webp"
           alt="" decoding="async" loading="eager"
           style="display:block;width:100%;height:100%;object-fit:contain;padding:8%;" />
    `;
    Object.assign(arBtn.style, {
      background: '#fff', borderRadius: '999px', width: '64px', height: '64px',
      padding: '0', lineHeight: '0', boxShadow: '0 4px 10px rgba(63,169,245,0.15)',
      transition: 'transform .15s ease, box-shadow .2s ease',
      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
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

  /* -------------------- Nav aria-current -------------------- */
  (function setAriaCurrent() {
    const norm = p => (p || '/').replace(/\/+$/, '') || '/';
    const here = norm(location.pathname);
    document.querySelectorAll('nav a, #mobile-menu a').forEach(a => {
      const href = norm(a.getAttribute('href')); if (href === here) a.setAttribute('aria-current','page');
    });
  })();

  /* -------------------- Hamburger: timing dalla CSS transition -------------------- */
  const getMenuTransitionMS = () => {
    if (!mobileMenu) return 300;
    const cs = getComputedStyle(mobileMenu);
    const dur = (parseFloat(cs.transitionDuration) || 0) * 1000;
    const del = (parseFloat(cs.transitionDelay) || 0) * 1000;
    return Math.max(120, Math.round(dur + del));
  };
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
      const wait = getMenuTransitionMS();
      window.setTimeout(() => mobileMenu.setAttribute('hidden',''), wait);
    }
  };
  const toggleMenu = () => setMobileState(!hamburger.classList.contains('active'));
  if (hamburger) {
    hamburger.addEventListener('click', toggleMenu);
    hamburger.addEventListener('keydown', e => {
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

  /* -------------------- Tema + bg 3D -------------------- */
  const THEME_KEY = 'svx-theme';
  const mediaDark = window.matchMedia('(prefers-color-scheme: dark)');
  const currentTheme = () => (['light','dark'].includes(localStorage.getItem(THEME_KEY))
    ? localStorage.getItem(THEME_KEY) : (mediaDark.matches ? 'dark' : 'light'));

  let statsChart = null, babylonScene = null;
  const getAxisLabelColor = () => body.classList.contains('dark-mode') ? '#f5f5f7' : '#1d1d1f';
  const updateChartTheme = () => {
    if (!statsChart) return;
    statsChart.updateOptions({
      xaxis: { labels: { style: { colors: getAxisLabelColor(), fontSize: '14px' } } },
      yaxis: { labels: { style: { colors: getAxisLabelColor(), fontSize: '14px' } } }
    }, false, true);
  };
  const updateModelBackground = () => {
    if (!babylonScene) return;
    const isDark = body.classList.contains('dark-mode');
    const bg = isDark ? '#000000' : '#FAFAFA';
    const canvas = document.getElementById('renderCanvas');
    if (canvas) canvas.style.backgroundColor = bg;
    const container = canvas?.parentElement; if (container) container.style.backgroundColor = bg;
    const c = BABYLON.Color3.FromHexString(bg);
    babylonScene.clearColor = new BABYLON.Color4(c.r, c.g, c.b, 1);
  };
  function applyTheme(theme) {
    const isDark = theme === 'dark';
    body.classList.toggle('dark-mode', isDark);
    themeToggle?.setAttribute('aria-pressed', String(isDark));
    if (sunIcon && moonIcon) { sunIcon.style.display = isDark ? 'none' : 'block'; moonIcon.style.display = isDark ? 'block' : 'none'; }
    updateChartTheme(); updateModelBackground();
  }
  applyTheme(currentTheme());
  themeToggle?.addEventListener('click', () => {
    const t = body.classList.contains('dark-mode') ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, t); applyTheme(t);
  });
  mediaDark.addEventListener('change', e => { if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches ? 'dark' : 'light'); });

  /* -------------------- Lazy BG + Prefetch -------------------- */
  (function lazyBackgrounds() {
    const lazyCards = document.querySelectorAll('.benefit-card.lazy-bg');
    if (!('IntersectionObserver' in window) || !lazyCards.length) return;
    const obs = new IntersectionObserver((entries,o) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target, bg = el.getAttribute('data-bg');
        if (bg) el.style.backgroundImage = `url('${bg}')`; o.unobserve(el);
      });
    }, { rootMargin: '200px' });
    lazyCards.forEach(el => obs.observe(el));
  })();
  (function prefetchInternalLinks(){
    const already = new Set();
    const add = href => {
      if (!href || already.has(href)) return;
      if (href.includes('#') || !href.startsWith('/')) return;
      const l = document.createElement('link'); l.rel='prefetch'; l.href=href; document.head.appendChild(l);
      already.add(href);
    };
    document.querySelectorAll('a[href^="/"]').forEach(a=>{
      const href=a.getAttribute('href'); a.addEventListener('mouseenter',()=>add(href)); a.addEventListener('touchstart',()=>add(href),{passive:true});
    });
  })();

  /* -------------------- Carousel: loop infinito (entrambi) -------------------- */
  (function initInfiniteCarousels() {
    document.querySelectorAll('.carousel-container').forEach(container => {
      const wrapper = container.querySelector('.carousel-wrapper');
      const btnLeft = container.querySelector('.carousel-arrow.left');
      const btnRight = container.querySelector('.carousel-arrow.right');
      if (!wrapper || !btnLeft || !btnRight) return;

      const getItemWidth = () => {
        const first = wrapper.querySelector('.benefit-card');
        if (!first) return 0;
        const cs = getComputedStyle(first);
        const mL = parseFloat(cs.marginLeft) || 0, mR = parseFloat(cs.marginRight) || 0;
        return first.getBoundingClientRect().width + mL + mR;
        };
      let animating = false;

      const slideLeft = () => {
        if (animating) return; animating = true;
        const w = getItemWidth(); if (!w) { animating = false; return; }
        // Prepend last -> first, posizioniamo a -step e poi animiamo a 0
        const last = wrapper.lastElementChild;
        if (last) wrapper.insertBefore(last, wrapper.firstElementChild);
        wrapper.style.transition = 'none';
        wrapper.style.transform = `translateX(${-w}px)`;
        // reflow
        void wrapper.offsetHeight;
        wrapper.style.transition = 'transform 360ms ease';
        wrapper.style.transform = 'translateX(0)';
        const done = () => { wrapper.removeEventListener('transitionend', done); wrapper.style.transition=''; wrapper.style.transform=''; animating = false; };
        wrapper.addEventListener('transitionend', done, { once: true });
      };

      const slideRight = () => {
        if (animating) return; animating = true;
        const w = getItemWidth(); if (!w) { animating = false; return; }
        wrapper.style.transition = 'transform 360ms ease';
        wrapper.style.transform = `translateX(${-w}px)`;
        const done = () => {
          wrapper.removeEventListener('transitionend', done);
          wrapper.style.transition = 'none';
          wrapper.style.transform = 'translateX(0)';
          const first = wrapper.firstElementChild;
          if (first) wrapper.appendChild(first);
          // reflow reset
          void wrapper.offsetHeight;
          wrapper.style.transition = '';
          animating = false;
        };
        wrapper.addEventListener('transitionend', done, { once: true });
      };

      btnLeft.addEventListener('click', slideLeft);
      btnRight.addEventListener('click', slideRight);
    });
  })();

  /* -------------------- Configuratore 2D -------------------- */
  (function initConfigurator2D() {
    const img = document.getElementById('product-image-2d');
    if (!img) return;
    document.querySelectorAll('.color-options-2d input[type="radio"]').forEach(r => {
      r.addEventListener('change', () => {
        const sw = r.nextElementSibling, next = sw?.getAttribute('data-image');
        if (!next) return;
        img.style.opacity = '0';
        const tmp = new Image();
        tmp.onload = () => { img.src = next; img.alt = `Prodotto Configurabile 2D - ${r.value}`; img.style.opacity = '1'; };
        tmp.src = next;
      });
    });
  })();

  /* -------------------- ApexCharts -------------------- */
  (function initStatsChart(){
    if (typeof ApexCharts === 'undefined') return;
    const target = document.querySelector('#stats-chart'); if (!target) return;
    const options = () => ({
      chart: { type:'bar', height:350, animations:{ enabled:true, easing:'easeinout', speed:2000, animateGradually:{enabled:true,delay:150}, dynamicAnimation:{enabled:true,speed:350} }, toolbar:{show:false} },
      plotOptions:{ bar:{ horizontal:true, barHeight:'75%', distributed:true } },
      dataLabels:{ enabled:false },
      series:[{ data:[82,94,66,40] }],
      xaxis:{ categories:['Engagement Utenti','Tasso di Conversione','Soddisfazione Clienti','Riduzione Resi'],
        labels:{ formatter:v=>`${v}%`, style:{ colors:getAxisLabelColor(), fontSize:'14px' } }, axisBorder:{show:false}, axisTicks:{show:false} },
      yaxis:{ labels:{ formatter:v=> (v==='Engagement Utenti'?['Engagement','Utenti']:
                                       v==='Tasso di Conversione'?['Tasso di','Conversione']:
                                       v==='Soddisfazione Clienti'?['Soddisfazione','Clienti']:v),
                       style:{ colors:getAxisLabelColor(), fontSize:'14px' } }, axisBorder:{show:false}, axisTicks:{show:false} },
      colors:['#45b6fe','#6a9bfe','#8f80fe','#d95bc5'], grid:{show:false}, tooltip:{enabled:false}
    });
    let chart = null;
    const obs = new IntersectionObserver((es) => es.forEach(e=>{
      if (e.isIntersecting && !chart){ chart = new ApexCharts(target, options()); chart.render(); statsChart = chart; }
    }), {threshold:0.1});
    obs.observe(target);
  })();

  /* -------------------- Babylon.js (3D) + AR bridge -------------------- */
  const canvas = document.getElementById('renderCanvas');
  if (!canvas) return;

  // Helper: default UI se nulla selezionato
  function ensureDefaultUISelectionsIfUnset() {
    const q = new URLSearchParams(location.search);
    const hasColor = !!document.querySelector('.color-options input:checked');
    const hasBg    = !!document.querySelector('.background-options input:checked');
    const tgl      = document.getElementById('toggle-airpods');
    if (!hasColor) document.getElementById(q.get('color') || 'bianco')?.setAttribute('checked','');
    if (!hasBg)    document.getElementById(q.get('bg') || 'sfondo-nero-bronzo')?.setAttribute('checked','');
    if (tgl && q.get('airpods') === null) tgl.checked = false; // default OFF
  }
  ensureDefaultUISelectionsIfUnset();

  canvas.addEventListener('contextmenu', e => e.preventDefault());
  const engine = new BABYLON.Engine(canvas, true, { antialias:true, adaptToDeviceRatio:true, alpha:false, preserveDrawingBuffer:true, stencil:true });
  const scene = new BABYLON.Scene(engine); babylonScene = scene;
  scene.imageProcessingConfiguration.toneMappingEnabled = false;
  scene.imageProcessingConfiguration.exposure = 1.0;
  scene.imageProcessingConfiguration.isEnabled = false;

  const updateBackground = () => {
    const isDark = body.classList.contains('dark-mode');
    const bg = isDark ? '#000' : '#FAFAFA';
    canvas.style.backgroundColor = bg;
    canvas.parentElement && (canvas.parentElement.style.backgroundColor = bg);
    const c = BABYLON.Color3.FromHexString(bg);
    scene.clearColor = new BABYLON.Color4(c.r,c.g,c.b,1);
  };
  updateBackground();
  themeToggle?.addEventListener('click', updateBackground);

  // Luci + camera
  new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0,1,0), scene).intensity = 0.4;
  const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1,-2,-1), scene); dirLight.position = new BABYLON.Vector3(5,10,5); dirLight.intensity = 0.5;
  new BABYLON.PointLight("pointLight", new BABYLON.Vector3(-3,2,0), scene).intensity = 0.3;

  const camera = new BABYLON.ArcRotateCamera("camera", Math.PI, Math.PI/2, 1.2, BABYLON.Vector3.Zero(), scene);
  const isMobileUA = /Android|iPhone|iPad/i.test(navigator.userAgent);
  camera.wheelDeltaPercentage = isMobileUA ? 0.01 : 0.02;
  camera.pinchDeltaPercentage = 0.01;
  camera.useNaturalPinchZoom = true;
  camera.inertia = 0.88; camera.panningInertia = 0.85; camera.minZ = 0.01;
  const pi = camera.inputs.attached.pointers; if (pi) { pi.buttons = [0,1,2]; pi.useCtrlForPanning = false; pi.panningMouseButton = 2; }
  camera.panningSensibility = 2000; camera.attachControl(canvas, true, false, true);

  let pivot = null, autoRotateTimer = null, isRotating = true;
  scene.onBeforeRenderObservable.add(()=>{ if (isRotating && pivot) pivot.rotate(BABYLON.Axis.Y, 0.003, BABYLON.Space.LOCAL); });
  canvas.addEventListener('pointerdown', ()=>{ isRotating=false; clearTimeout(autoRotateTimer); autoRotateTimer=setTimeout(()=> (isRotating=true), 3000); });

  scene.environmentTexture  = BABYLON.CubeTexture.CreateFromPrefilteredData('https://assets.babylonjs.com/environments/studio.env', scene);
  scene.environmentIntensity = 0.6;
  const pipeline = new BABYLON.DefaultRenderingPipeline("default", true, scene, [camera]);
  pipeline.bloomEnabled = true; pipeline.bloomThreshold = 1.0; pipeline.bloomWeight = 0.25; pipeline.fxaaEnabled = true; pipeline.samples = 8;

  // Helpers bounds
  function computeBounds(meshes) {
    let min = new BABYLON.Vector3(+Infinity,+Infinity,+Infinity);
    let max = new BABYLON.Vector3(-Infinity,-Infinity,-Infinity);
    meshes.forEach(m => { const bi = m.getBoundingInfo();
      min = BABYLON.Vector3.Minimize(min, bi.boundingBox.minimumWorld);
      max = BABYLON.Vector3.Maximize(max, bi.boundingBox.maximumWorld);
    });
    const center = min.add(max).scale(0.5), size = max.subtract(min), maxDim = Math.max(size.x,size.y,size.z);
    return { center, maxDim };
  }
  function frameCamera(cam, center, maxDim) {
    cam.setTarget(center);
    const fov = cam.fov || (Math.PI/3);
    const radius = (maxDim * 0.6) / Math.tan(fov/2) + maxDim*0.2;
    cam.radius = radius; cam.lowerRadiusLimit = Math.max(radius*0.35, 0.02); cam.upperRadiusLimit = radius*3;
  }

  // Carica GLB
  BABYLON.SceneLoader.ImportMesh('', './assets/', 'iphone_16_pro_configuratore_3d.glb', scene, (meshes) => {
    const iphoneNode = scene.getTransformNodeByName('iphone') || scene.getNodeByName('iphone') || meshes[0];
    const airpodsNode = scene.getNodeByName('Airpods') || scene.getNodeByName('airpods') ||
                        scene.getNodeByName('Cuffie')  || scene.getNodeByName('cuffie')  ||
                        scene.getTransformNodeByName('Airpods');

    const printable = meshes.filter(m => m.getBoundingInfo);
    const { center, maxDim } = computeBounds(iphoneNode?.getChildMeshes ? iphoneNode.getChildMeshes() : printable);
    const pv = new BABYLON.TransformNode('pivot', scene); pv.setAbsolutePosition(center);
    if (iphoneNode)  iphoneNode.setParent(pv);
    if (airpodsNode) airpodsNode.setParent(pv);
    pivot = pv; frameCamera(camera, center, maxDim);

    // Material list
    const allMaterials = scene.materials;
    const scoccaMaterials = allMaterials.filter(m => /scocca|retro|pulsanti|box|bordi|dettagli/i.test(m.name)).map(m => m.name);
    const schermoMaterial = allMaterials.find(m => /schermo|screen/i.test(m.name))?.name;
    window.scoccaMaterials = scoccaMaterials; window.schermoMaterial = schermoMaterial;

    // Texture map
    const textures = {
      color: {
        bianco: 'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068874/bianco_sdebye.png?quality=auto&format=auto',
        grigio: 'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068859/grigio_iutpvj.png?quality=auto&format=auto',
        bronzo: 'https://res.cloudinary.com/dqhbriryo/image_upload/v1752068893/bronzo_g23m36.png?quality=auto&format=auto'.replace('_upload/','/image/upload/'),
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

    // No-flash Babylon: applico solo quando la texture è caricata
    function setAlbedo(materialNames, url) {
      const tex = new BABYLON.Texture(url, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
      tex.wrapU = tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
      tex.onLoadObservable.addOnce(() => {
        materialNames.forEach(name => { const mat = scene.getMaterialByName(name); if (mat) mat.albedoTexture = tex; });
      });
    }

    // Prewarm browser cache (immagini)
    (function warmTextures(){
      const urls = [...Object.values(textures.color), ...Object.values(textures.background)];
      setTimeout(()=>{ urls.forEach(u=>{ const i=new Image(); i.decoding='async'; i.src=u; }); }, 80);
    })();

    // UI listeners → Babylon
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

    // Applica default/URL a Babylon all’avvio
    function applyConfigToBabylonFromUI() {
      const colorId = document.querySelector('.color-options input:checked')?.id || 'bianco';
      const bgId    = document.querySelector('.background-options input:checked')?.id || 'sfondo-nero-bronzo';
      const airpodsOn = !!document.getElementById('toggle-airpods')?.checked;
      if (textures.color[colorId] && scoccaMaterials?.length) setAlbedo(scoccaMaterials, textures.color[colorId]);
      if (textures.background[bgId] && schermoMaterial)     setAlbedo([schermoMaterial], textures.background[bgId]);
      if (airpodsNode) {
        airpodsNode.setEnabled(airpodsOn);
        scene.meshes.forEach(m => {
          if (!m || m.name == null) return;
          if (/(cuffie|airpods).*(shadow|ombra)|(shadow|ombra).*(cuffie|airpods)/i.test(m.name)) m.setEnabled(airpodsOn);
        });
      }
    }
    applyConfigToBabylonFromUI();

    // Toggle cuffie
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

    /* -------------------- AR bridge (<model-viewer>) -------------------- */
    const IS_IOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
    const arButton = document.getElementById('ar-button');
    const mv = document.getElementById('ar-bridge');
    mv?.setAttribute('shadow-intensity','0');

    // Preload helper per Safari: assicurati che le immagini siano già in cache prima di setURI()
    const preloadCache = new Map();
    function preloadImage(uri){
      if (!uri) return Promise.resolve();
      if (preloadCache.has(uri)) return preloadCache.get(uri);
      const p = new Promise(res => { const img = new Image(); img.onload=()=>res(); img.onerror=()=>res(); img.src = uri; });
      preloadCache.set(uri, p); return p;
    }
    const forcePNG = (url) => {
      try { const u = new URL(url); if (u.hostname.includes('res.cloudinary.com')) u.searchParams.set('format','png'); return u.toString(); }
      catch { return url.replace('format=auto','format=png'); }
    };

    // Materials to hide for headphones OFF in AR
    const AR_MAT_ORIG = new Map();
    const AIRPODS_HIDE_LIST = ['bianco lucido','gomma','parti_scure cuffie'].map(s => s.toLowerCase());
    const shouldHideMatName = (name) => (name||'').toLowerCase().trim() && (AIRPODS_HIDE_LIST.includes((name||'').toLowerCase().trim()) || /(cuffie|airpods)/i.test(name));
    function setAirpodsVisibleInMV(visible) {
      try {
        if (!mv) return;
        const sceneSym = Object.getOwnPropertySymbols(mv).find(s => s.description === 'scene');
        const threeScene = mv[sceneSym]; const root = threeScene?.children?.[0]; if (!root) return;
        ['Airpods','airpods','Cuffie','cuffie'].forEach(n => { const obj = root.getObjectByName(n); if (obj) obj.visible = visible; });
        threeScene.updateShadow?.(); threeScene.queueRender?.();
      } catch {}
    }

    async function applyTextureByURI(materialName, url) {
      if (!url || !mv?.model) return;
      const mat = mv.model.materials.find(m => m.name === materialName);
      if (!mat) return;
      const uri = IS_IOS ? forcePNG(url) : url;
      await preloadImage(uri); // importante per la prima AR su Safari
      const texInfo = mat.pbrMetallicRoughness.baseColorTexture;
      const texObj  = texInfo?.texture; const source = texObj?.source;
      if (source && typeof source.setURI === 'function') {
        source.setURI(uri); return;
      }
      // fallback raro
      if (typeof mv.createTexture === 'function' && typeof texInfo?.setTexture === 'function') {
        const tex = await mv.createTexture(uri); texInfo.setTexture(tex);
      }
    }

    async function syncMVFromPageState() {
      if (!mv) return;
      await mv.updateComplete;
      if (!mv.model) return;

      const colorId = document.querySelector('.color-options input:checked')?.id || 'bianco';
      const bgId    = document.querySelector('.background-options input:checked')?.id || 'sfondo-nero-bronzo';
      const colorUrl = textures.color[colorId];
      const bgUrl    = textures.background[bgId];

      const tasks = [];
      if (window.scoccaMaterials && colorUrl) for (const mName of window.scoccaMaterials) tasks.push(applyTextureByURI(mName, colorUrl));
      if (window.schermoMaterial && bgUrl) tasks.push(applyTextureByURI(window.schermoMaterial, bgUrl));
      await Promise.all(tasks);
      await mv.updateComplete;

      // cuffie on/off
      const headphonesOn = !!document.getElementById('toggle-airpods')?.checked;
      setAirpodsVisibleInMV(headphonesOn);
      mv.model.materials.forEach(mat => {
        if (!shouldHideMatName(mat.name)) return;
        if (!AR_MAT_ORIG.has(mat.name)) {
          AR_MAT_ORIG.set(mat.name, {
            alphaMode: mat.alphaMode, alphaCutoff: mat.alphaCutoff,
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
          } else mat.pbrMetallicRoughness.setBaseColorFactor([1,1,1,1]);
        }
      });
    }

    // Assicura che lo stato MV sia aggiornato appena carica il glTF
    mv?.addEventListener('load', () => { syncMVFromPageState(); }, { once:false });

    // QR su desktop
    function getCurrentConfig() {
      const colorId   = document.querySelector('.color-options input:checked')?.id || 'bianco';
      const bgId      = document.querySelector('.background-options input:checked')?.id || 'sfondo-nero-bronzo';
      const airpodsOn = !!document.getElementById('toggle-airpods')?.checked;
      return { colorId, bgId, airpodsOn };
    }
    function buildArShareUrl() {
      const url = new URL(location.href);
      url.searchParams.set('ar','1');
      const { colorId, bgId, airpodsOn } = getCurrentConfig();
      url.searchParams.set('color', colorId);
      url.searchParams.set('bg', bgId);
      url.searchParams.set('airpods', airpodsOn ? '1':'0');
      return url.toString();
    }

    // Bottone AR
    if (arButton) {
      arButton.addEventListener('click', async () => {
        const ua = navigator.userAgent;
        const isAndroid = /Android/i.test(ua);
        const isMobile  = /Android|iPhone|iPad/i.test(ua);

        if (!isMobile) {
          const m = document.getElementById('ar-qr-modal'); const box = document.getElementById('qr-code');
          if (m && box && window.QRCode){ box.innerHTML=''; new QRCode(box,{text:buildArShareUrl(), width:220, height:220}); m.style.display='block'; }
          else if (m) m.style.display='block';
          return;
        }

        // Android WebXR (se supportato)
        try {
          if (isAndroid && navigator.xr && await navigator.xr.isSessionSupported('immersive-ar')) {
            await scene.createDefaultXRExperienceAsync({
              uiOptions:{ sessionMode:'immersive-ar' },
              optionalFeatures:['hit-test','dom-overlay'],
              referenceSpaceType:'local-floor'
            });
            return;
          }
        } catch {}

        // iOS/Android non-WebXR → sincronizza e avvia
        try {
          if (IS_IOS && mv?.hasAttribute('ios-src')) mv.removeAttribute('ios-src');
          await mv.updateComplete;
          await syncMVFromPageState();
          await new Promise(r => requestAnimationFrame(()=>requestAnimationFrame(r)));
          await mv.activateAR();
        } catch {
          alert('AR non disponibile su questo dispositivo/navigatore.');
        }
      });
    }

    // Deep-link da QR: auto-AR se possibile, con overlay per gesto
    (function handleDeepLink(){
      const q = new URLSearchParams(location.search);
      const wantsAR = q.get('ar') === '1';
      const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

      // Allinea UI da query (se presenti)
      const color = q.get('color'), bg = q.get('bg'), airpods = q.get('airpods');
      if (color) document.getElementById(color)?.setAttribute('checked','');
      if (bg)    document.getElementById(bg)?.setAttribute('checked','');
      if (airpods !== null) { const tgl=document.getElementById('toggle-airpods'); if (tgl) tgl.checked = (airpods==='1'); }

      // Applica su Babylon
      applyConfigToBabylonFromUI();

      if (!isMobile || !wantsAR) return;

      let overlay = null;
      const ensureOverlay = () => {
        if (overlay || !document.body) return;
        overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35);backdrop-filter:saturate(140%) blur(2px);z-index:9999;cursor:pointer;';
        overlay.innerHTML = '<div style="background:#fff;border-radius:16px;padding:14px 16px;font:600 16px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.18)">Tocca per aprire la Realtà Aumentata</div>';
        overlay.addEventListener('pointerdown', async () => {
          try { await tryLaunchAR(true); } finally { overlay?.remove(); overlay=null; }
        }, { once:true });
        document.body.appendChild(overlay);
      };

      async function tryLaunchAR(fromGesture=false){
        if (IS_IOS && mv?.hasAttribute('ios-src')) mv.removeAttribute('ios-src');
        await mv.updateComplete;
        await syncMVFromPageState();
        await new Promise(r => requestAnimationFrame(()=>requestAnimationFrame(r)));
        try { await mv.activateAR(); }
        catch {
          await new Promise(r => setTimeout(r, 180));
          try { await mv.activateAR(); }
          catch { if (!fromGesture) ensureOverlay(); }
        }
      }

      if (mv?.model) tryLaunchAR(false);
      else mv.addEventListener('load', () => tryLaunchAR(false), { once:true });
    })();

  }, null, (error) => console.error('CARICAMENTO GLB:', error?.message || error));

  // Render loop
  engine.runRenderLoop(() => babylonScene && babylonScene.render());
  window.addEventListener('resize', () => engine.resize());

  /* -------------------- Modale QR — chiudi con “X” -------------------- */
  (function initQrModalClose() {
    const modal = document.getElementById('ar-qr-modal'); if (!modal) return;
    modal.querySelector('.qr-close')?.addEventListener('click', () => { modal.style.display = 'none'; });
  })();

});
