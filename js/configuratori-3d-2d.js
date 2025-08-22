// configuratori-3d-2d.js — build 2025-08-22a
// - Default iniziali (Bianco, Sfondo Nero & Bronzo, Cuffie OFF)
// - Carousel & hamburger ripristinati (frecce, ESC, click fuori, link chiude)
// - AR deep-link: sync materiali + preload + attese deterministiche (iOS overlay se serve)

document.addEventListener('DOMContentLoaded', () => {
  /* --------------- Selettori base / UI --------------- */
  const body = document.body;
  const header = document.querySelector('header');
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const themeToggle = document.querySelector('.theme-toggle');
  const sunIcon = document.querySelector('.theme-icon.sun');
  const moonIcon = document.querySelector('.theme-icon.moon');

  /* --------------- Pulsante AR: icona grande --------------- */
  (function setupArButtonUI() {
    const arBtn = document.getElementById('ar-button');
    if (!arBtn) return;
    arBtn.innerHTML = `
      <img src="https://res.cloudinary.com/dqhbriryo/image/upload/v1755855493/icona_Realt%C3%A0_Aumentata_y2p4ga.webp"
           alt="" decoding="async" loading="eager"
           style="display:block;width:100%;height:100%;object-fit:contain;padding:12%;" />
    `;
    Object.assign(arBtn.style, {
      background:'#fff', borderRadius:'999px', width:'64px', height:'64px', padding:'0', lineHeight:'0',
      boxShadow:'0 4px 10px rgba(63,169,245,0.15)', transition:'transform .15s, box-shadow .2s',
      display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden'
    });
    arBtn.addEventListener('mouseenter',()=>{arBtn.style.transform='scale(1.06)';arBtn.style.boxShadow='0 8px 24px rgba(63,169,245,0.25)';});
    arBtn.addEventListener('mouseleave',()=>{arBtn.style.transform='scale(1)';arBtn.style.boxShadow='0 4px 10px rgba(63,169,245,0.15)';});
  })();

  /* --------------- Evidenzia voce attuale --------------- */
  (function setAriaCurrent() {
    const norm = p => (p || '/').replace(/\/+$/, '') || '/';
    const here = norm(location.pathname);
    document.querySelectorAll('nav a, #mobile-menu a').forEach(a => {
      const href = norm(a.getAttribute('href'));
      if (href === here) a.setAttribute('aria-current', 'page');
    });
  })();

  /* --------------- Mobile menu ripristinato --------------- */
  const setMobileState = (open) => {
    if (!hamburger || !mobileMenu) return;
    hamburger.classList.toggle('active', open);
    mobileMenu.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    if (open) {
      mobileMenu.removeAttribute('hidden');
      document.documentElement.style.overflow = 'hidden';
      setTimeout(() => mobileMenu.focus?.(), 0);
    } else {
      document.documentElement.style.overflow = '';
      setTimeout(() => mobileMenu.setAttribute('hidden', ''), 300);
    }
  };
  const toggleMenu = () => setMobileState(!hamburger.classList.contains('active'));
  if (hamburger) {
    hamburger.addEventListener('click', toggleMenu);
    hamburger.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(); }});
  }
  // Chiudi con ESC, click fuori, click link
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && hamburger?.classList.contains('active')) setMobileState(false); });
  document.addEventListener('click', e => {
    if (!mobileMenu || !hamburger?.classList.contains('active')) return;
    const inside = mobileMenu.contains(e.target) || hamburger.contains(e.target);
    if (!inside) setMobileState(false);
  });
  mobileMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMobileState(false)));

  // Header shrink + auto-chiusura su scroll up
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 8);
    if (y < lastY && hamburger?.classList.contains('active')) setMobileState(false);
    lastY = y;
  }, { passive:true });

  /* --------------- Tema + sync bg 3D --------------- */
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
      xaxis: { labels: { style: { colors: getAxisLabelColor(), fontSize:'14px' } } },
      yaxis: { labels: { style: { colors: getAxisLabelColor(), fontSize:'14px' } } }
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
    themeToggle?.setAttribute('aria-pressed', String(isDark));
    if (sunIcon && moonIcon) { sunIcon.style.display = isDark ? 'none' : 'block'; moonIcon.style.display = isDark ? 'block' : 'none'; }
    updateChartTheme();
    updateModelBackground();
  }
  applyTheme(currentTheme());
  themeToggle?.addEventListener('click', () => { const t = body.classList.contains('dark-mode') ? 'light' : 'dark'; localStorage.setItem(THEME_KEY, t); applyTheme(t); });
  mediaDark.addEventListener('change', e => { if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches ? 'dark' : 'light'); });

  /* --------------- Carousel: frecce ripristinate --------------- */
  (function initCarousels(){
    document.querySelectorAll('.carousel-container').forEach(container => {
      const wrapper = container.querySelector('.carousel-wrapper');
      const left = container.querySelector('.carousel-arrow.left');
      const right = container.querySelector('.carousel-arrow.right');
      if (!wrapper || !left || !right) return;

      const SCROLL = () => wrapper.clientWidth * 0.9;
      const updateArrows = () => {
        const max = wrapper.scrollWidth - wrapper.clientWidth - 2;
        left.disabled  = wrapper.scrollLeft <= 2;
        right.disabled = wrapper.scrollLeft >= max;
      };
      updateArrows();

      left.addEventListener('click', () => { wrapper.scrollBy({ left: -SCROLL(), behavior: 'smooth' }); });
      right.addEventListener('click', () => { wrapper.scrollBy({ left:  SCROLL(), behavior: 'smooth' }); });
      wrapper.addEventListener('scroll', () => updateArrows(), { passive:true });

      // Drag/Swipe
      let isDown=false, startX=0, startLeft=0;
      wrapper.addEventListener('pointerdown', e => { isDown=true; startX=e.clientX; startLeft=wrapper.scrollLeft; wrapper.setPointerCapture(e.pointerId); });
      wrapper.addEventListener('pointermove', e => { if(!isDown) return; wrapper.scrollLeft = startLeft - (e.clientX - startX); });
      wrapper.addEventListener('pointerup',   () => { isDown=false; });
      wrapper.addEventListener('pointercancel',()=>{ isDown=false; });
      window.addEventListener('resize', updateArrows);
    });
  })();

  /* --------------- Lazy BG + Prefetch link interni --------------- */
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
      a.addEventListener('touchstart', () => addPrefetch(href), { passive:true });
    });
  })();

  /* --------------- Configuratore 2D --------------- */
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

  /* --------------- ApexCharts --------------- */
  (function initStatsChart() {
    if (typeof ApexCharts === 'undefined') return;
    const target = document.querySelector('#stats-chart');
    if (!target) return;
    const options = () => ({
      chart:{ type:'bar', height:350, animations:{enabled:true,easing:'easeinout',speed:2000,animateGradually:{enabled:true,delay:150},dynamicAnimation:{enabled:true,speed:350}}, toolbar:{show:false}},
      plotOptions:{ bar:{ horizontal:true, barHeight:'75%', distributed:true } },
      dataLabels:{ enabled:false },
      series:[{ data:[82,94,66,40] }],
      xaxis:{ categories:['Engagement Utenti','Tasso di Conversione','Soddisfazione Clienti','Riduzione Resi'], labels:{ formatter:v=>`${v}%`, style:{ colors:getAxisLabelColor(), fontSize:'14px' } }, axisBorder:{show:false}, axisTicks:{show:false}},
      yaxis:{ labels:{ formatter:value=> (value==='Engagement Utenti'?['Engagement','Utenti']: value==='Tasso di Conversione'?['Tasso di','Conversione']: value==='Soddisfazione Clienti'?['Soddisfazione','Clienti']: value), style:{ colors:getAxisLabelColor(), fontSize:'14px' } }, axisBorder:{show:false}, axisTicks:{show:false}},
      colors:['#45b6fe','#6a9bfe','#8f80fe','#d95bc5'], grid:{show:false}, tooltip:{enabled:false}
    });
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !statsChart) { statsChart = new ApexCharts(target, options()); statsChart.render(); }
      });
    }, { threshold:0.1 });
    obs.observe(target);
  })();

  /* --------------- Babylon.js configuratore 3D --------------- */
  if (document.getElementById('renderCanvas')) {
    const canvas = document.getElementById('renderCanvas');
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    const engine = new BABYLON.Engine(canvas, true, {
      antialias:true, adaptToDeviceRatio:true, alpha:false, preserveDrawingBuffer:true, stencil:true
    });
    const scene = new BABYLON.Scene(engine);
    babylonScene = scene;

    // Tone mapping OFF per sfondo coerente
    scene.imageProcessingConfiguration.toneMappingEnabled = false;
    scene.imageProcessingConfiguration.exposure = 1.0;
    scene.imageProcessingConfiguration.isEnabled = false;

    const updateBackground = () => {
      const isDark = body.classList.contains('dark-mode');
      const bg = isDark ? '#000000' : '#FAFAFA';
      canvas.style.backgroundColor = bg;
      canvas.parentElement && (canvas.parentElement.style.backgroundColor = bg);
      const c = BABYLON.Color3.FromHexString(bg);
      scene.clearColor = new BABYLON.Color4(c.r, c.g, c.b, 1);
    };
    updateBackground();
    themeToggle?.addEventListener('click', updateBackground);

    // Luci
    new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0,1,0), scene).intensity = 0.4;
    const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1,-2,-1), scene);
    dirLight.position = new BABYLON.Vector3(5,10,5); dirLight.intensity = 0.5;
    new BABYLON.PointLight("pointLight", new BABYLON.Vector3(-3,2,0), scene).intensity = 0.3;

    // Camera
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI, Math.PI/2, 1.2, BABYLON.Vector3.Zero(), scene);
    const isMobileUA = /Android|iPhone|iPad/i.test(navigator.userAgent);
    camera.wheelDeltaPercentage = isMobileUA ? 0.01 : 0.02;
    camera.pinchDeltaPercentage = 0.01;
    camera.useNaturalPinchZoom = true;
    camera.inertia = 0.88; camera.panningInertia = 0.85; camera.minZ = 0.01;
    const pi = camera.inputs.attached.pointers;
    if (pi) { pi.buttons = [0,1,2]; pi.useCtrlForPanning = false; pi.panningMouseButton = 2; }
    camera.panningSensibility = 2000;
    camera.attachControl(canvas, true, false, true);

    // Autorotate leggero
    let pivot = null, autoRotateTimer = null, isRotating = true;
    scene.onBeforeRenderObservable.add(() => { if (isRotating && pivot) pivot.rotate(BABYLON.Axis.Y, 0.003, BABYLON.Space.LOCAL); });
    canvas.addEventListener('pointerdown', () => { isRotating=false; clearTimeout(autoRotateTimer); autoRotateTimer=setTimeout(()=>{isRotating=true;},3000); });

    // Env + Post
    scene.environmentTexture  = BABYLON.CubeTexture.CreateFromPrefilteredData('https://assets.babylonjs.com/environments/studio.env', scene);
    scene.environmentIntensity = 0.6;
    const pipeline = new BABYLON.DefaultRenderingPipeline("default", true, scene, [camera]);
    pipeline.bloomEnabled = true; pipeline.bloomThreshold = 1.0; pipeline.bloomWeight = 0.25; pipeline.fxaaEnabled = true; pipeline.samples = 8;

    // Helpers bbox / framing
    function computeBounds(meshes) {
      let min = new BABYLON.Vector3(+Infinity,+Infinity,+Infinity);
      let max = new BABYLON.Vector3(-Infinity,-Infinity,-Infinity);
      meshes.forEach(m => { const bi = m.getBoundingInfo(); min = BABYLON.Vector3.Minimize(min, bi.boundingBox.minimumWorld); max = BABYLON.Vector3.Maximize(max, bi.boundingBox.maximumWorld); });
      const center = min.add(max).scale(0.5);
      const size = max.subtract(min);
      const maxDim = Math.max(size.x, size.y, size.z);
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
      const iphoneNode =
        scene.getTransformNodeByName('iphone') || scene.getNodeByName('iphone') || meshes[0];

      const airpodsNode =
        scene.getNodeByName('Airpods') || scene.getNodeByName('airpods') ||
        scene.getNodeByName('Cuffie')  || scene.getNodeByName('cuffie')  ||
        scene.getTransformNodeByName('Airpods');

      const printable = meshes.filter(m => m.getBoundingInfo);
      const { center, maxDim } = computeBounds(iphoneNode?.getChildMeshes ? iphoneNode.getChildMeshes() : printable);
      const pv = new BABYLON.TransformNode('pivot', scene);
      pv.setAbsolutePosition(center);
      if (iphoneNode)  iphoneNode.setParent(pv);
      if (airpodsNode) airpodsNode.setParent(pv);
      pivot = pv; frameCamera(camera, center, maxDim);

      const allMaterials   = scene.materials;
      const scoccaMaterials = allMaterials.filter(m => /scocca|retro|pulsanti|box|bordi|dettagli/i.test(m.name)).map(m => m.name);
      const schermoMaterial = allMaterials.find(m => /schermo|screen/i.test(m.name))?.name;
      window.scoccaMaterials = scoccaMaterials;
      window.schermoMaterial = schermoMaterial;

      // Texture map
      const textures = {
        color: {
          bianco:'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068874/bianco_sdebye.png?quality=auto&format=auto',
          grigio:'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068859/grigio_iutpvj.png?quality=auto&format=auto',
          bronzo:'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068893/bronzo_g23m36.png?quality=auto&format=auto',
          nero:  'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068910/nero_whga1l.png?quality=auto&format=auto'
        },
        background: {
          'sfondo-nero-bronzo':  'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981260/sfondo_iphone_viola_e_nero_qhggk6.webp?quality=auto&format=auto',
          'sfondo-arancio-nero': 'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981229/sfondo_iphone_nero_e_rosso_yzpl6h.webp?quality=auto&format=auto',
          'sfondo-nero-blu':     'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981196/sfondo_iphone_nero_e_bronzo_cmmt3h.webp?quality=auto&format=auto',
          'sfondo-nero-viola':   'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981244/sfondo_iphone_nero_e_blue_h6rgcb.webp?quality=auto&format=auto'
        }
      };
      window.textures = textures;

      // NO-FLASH: applica quando la texture è pronta
      function setAlbedo(materialNames, url) {
        const t = new BABYLON.Texture(url, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
        t.wrapU = t.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
        t.onLoadObservable.addOnce(() => { materialNames.forEach(n => { const m = scene.getMaterialByName(n); if (m) m.albedoTexture = t; }); });
      }
      // Pre-warm immagini (riduce “prima volta” anche in MV)
      setTimeout(() => {
        [...Object.values(textures.color), ...Object.values(textures.background)].forEach(u => { const i = new Image(); i.decoding='async'; i.src = u; });
      }, 100);

      // ======= DEFAULT INIZIALI FORZATI =======
      const colorDefault = 'bianco';
      const bgDefault    = 'sfondo-nero-bronzo';
      const cuffsDefault = false; // OFF

      // Se l’HTML non ha checked, forzo i primi
      const uiDefaults = () => {
        const c = document.getElementById(colorDefault);
        const b = document.getElementById(bgDefault);
        const t = document.getElementById('toggle-airpods');
        if (c && !document.querySelector('.color-options input:checked')) c.checked = true;
        if (b && !document.querySelector('.background-options input:checked')) b.checked = true;
        if (t) t.checked = cuffsDefault;
      };
      uiDefaults();

      // Applica default in Babylon
      setAlbedo(scoccaMaterials, textures.color[colorDefault]);
      if (schermoMaterial) setAlbedo([schermoMaterial], textures.background[bgDefault]);
      if (airpodsNode) {
        airpodsNode.setEnabled(cuffsDefault);
        scene.meshes.forEach(m => {
          if (!m || m.name == null) return;
          if (/(cuffie|airpods).*(shadow|ombra)|(shadow|ombra).*(cuffie|airpods)/i.test(m.name)) m.setEnabled(cuffsDefault);
        });
      }

      // UI handlers (Babylon)
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

      // --------------- AR bridge (model-viewer) ---------------
      const mv = document.getElementById('ar-bridge');
      const IS_IOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
      if (mv) mv.setAttribute('shadow-intensity','0');

      // Materiali cuffie in MV
      const AR_MAT_ORIG = new Map();
      const AIRPODS_HIDE_LIST = ['bianco lucido','gomma','parti_scure cuffie'].map(s => s.toLowerCase());
      const shouldHideMatName = (name) => {
        const n = (name || '').toLowerCase().trim();
        return AIRPODS_HIDE_LIST.includes(n) || /(cuffie|airpods)/i.test(n);
      };
      function setAirpodsVisibleInMV(visible) {
        try {
          if (!mv) return;
          const sym = Object.getOwnPropertySymbols(mv).find(s => s.description === 'scene');
          const threeScene = mv[sym];
          const root = threeScene?.children?.[0];
          if (!root) return;
          ['Airpods','airpods','Cuffie','cuffie'].forEach(n => {
            const obj = root.getObjectByName(n);
            if (obj) obj.visible = visible;
          });
          threeScene.updateShadow?.(); threeScene.queueRender?.();
        } catch {}
      }

      // Helpers query/config
      const forcePNG = (url) => {
        try { const u = new URL(url); if (u.hostname.includes('res.cloudinary.com')) u.searchParams.set('format','png'); return u.toString(); }
        catch { return url.replace('format=auto','format=png'); }
      };
      function getQuery() {
        const q = new URLSearchParams(location.search);
        const ap = q.get('airpods');
        return { ar: q.get('ar') === '1', color: q.get('color') || null, bg: q.get('bg') || null, airpods: ap === null ? null : ap === '1' };
      }

      // Applica selezioni UI dal querystring (senza trigger)
      function setFormSelectionsFromQuery() {
        const { color, bg, airpods } = getQuery();
        if (color) { const el = document.getElementById(color); if (el && el.type === 'radio') el.checked = true; }
        if (bg)    { const el = document.getElementById(bg);    if (el && el.type === 'radio') el.checked = true; }
        const tgl = document.getElementById('toggle-airpods');
        if (tgl && airpods !== null) tgl.checked = airpods;
      }

      // Applica configurazione a Babylon (subito, no flash)
      function applyConfigToBabylonDirect() {
        const { color, bg, airpods } = getQuery();
        if (color && textures?.color[color] && scoccaMaterials?.length) setAlbedo(scoccaMaterials, textures.color[color]);
        if (bg && textures?.background[bg] && schermoMaterial)         setAlbedo([schermoMaterial], textures.background[bg]);
        const tgl = document.getElementById('toggle-airpods');
        if (tgl && airpods !== null && airpodsNode) {
          airpodsNode.setEnabled(!!airpods);
          scene.meshes.forEach(m => {
            if (!m || m.name == null) return;
            if (/(cuffie|airpods).*(shadow|ombra)|(shadow|ombra).*(cuffie|airpods)/i.test(m.name)) m.setEnabled(!!airpods);
          });
        }
      }

      const getCurrentConfig = () => {
        const colorId   = document.querySelector('.color-options input:checked')?.id || colorDefault;
        const bgId      = document.querySelector('.background-options input:checked')?.id || bgDefault;
        const airpodsOn = !!document.getElementById('toggle-airpods')?.checked;
        return { colorId, bgId, airpodsOn };
      };
      const buildArShareUrl = () => {
        const url = new URL(location.href);
        url.searchParams.set('ar','1');
        const { colorId, bgId, airpodsOn } = getCurrentConfig();
        url.searchParams.set('color', colorId);
        url.searchParams.set('bg', bgId);
        url.searchParams.set('airpods', airpodsOn ? '1' : '0');
        return url.toString();
      };

      // ---- MODEL-VIEWER: applica texture/visibilità PRIMA dell’AR ----
      async function mvApplyTextureByURI(materialName, url) {
        if (!url || !mv?.model) return;
        const mat = mv.model.materials.find(m => m.name === materialName);
        if (!mat) return;
        const uri = IS_IOS ? forcePNG(url) : url;

        const texInfo = mat.pbrMetallicRoughness.baseColorTexture;
        const texObj  = texInfo?.texture;
        const source  = texObj?.source;
        if (source && typeof source.setURI === 'function') {
          source.setURI(uri);
        } else if (typeof mv.createTexture === 'function' && typeof texInfo?.setTexture === 'function') {
          const tex = await mv.createTexture(uri);
          texInfo.setTexture(tex);
        }
      }

      // Precarica in MV le texture della config corrente (prima attivazione)
      async function mvWarmTexturesForConfig() {
        if (!mv?.model) return;
        const { colorId, bgId } = getCurrentConfig();
        const colorUrl = textures.color[colorId];
        const bgUrl    = textures.background[bgId];
        // Crea texture (cache interna di <model-viewer>)
        if (typeof mv.createTexture === 'function') {
          if (colorUrl) await mv.createTexture(IS_IOS ? forcePNG(colorUrl) : colorUrl);
          if (bgUrl)    await mv.createTexture(IS_IOS ? forcePNG(bgUrl)    : bgUrl);
        }
      }

      async function syncMVFromPageState() {
        if (!mv) return;
        // Aspetta che la scene-graph sia pronta
        if (!mv.model) {
          await new Promise(resolve => {
            const done = () => { mv.removeEventListener('scene-graph-ready', done); mv.removeEventListener('load', done); resolve(); };
            mv.addEventListener('scene-graph-ready', done, { once:true });
            mv.addEventListener('load', done, { once:true });
          });
        }
        await mv.updateComplete;

        const { colorId, bgId } = getCurrentConfig();
        const colorUrl = textures.color[colorId];
        const bgUrl    = textures.background[bgId];

        if (window.scoccaMaterials) for (const mName of window.scoccaMaterials) await mvApplyTextureByURI(mName, colorUrl);
        if (window.schermoMaterial) await mvApplyTextureByURI(window.schermoMaterial, bgUrl);

        const headphonesOn = !!document.getElementById('toggle-airpods')?.checked;
        setAirpodsVisibleInMV(headphonesOn);

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

        // un frame extra per sicurezza prima dell’AR
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      }

      // Toggle cuffie (Babylon)
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
      const arButton = document.getElementById('ar-button');
      if (arButton) {
        arButton.addEventListener('click', async () => {
          const ua = navigator.userAgent;
          const isAndroid = /Android/i.test(ua);
          const isMobile  = /Android|iPhone|iPad/i.test(ua);

          if (!isMobile) {
            // Desktop => QR
            const m = document.getElementById('ar-qr-modal');
            const box = document.getElementById('qr-code');
            if (m && box && window.QRCode) {
              box.innerHTML = '';
              new QRCode(box, { text: buildArShareUrl(), width: 220, height: 220 });
              m.style.display = 'block';
            } else if (m) { m.style.display = 'block'; }
            return;
          }

          // Android: WebXR se disponibile
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

          // iOS/Android: sincronizza <model-viewer> e attiva AR
          try {
            if (IS_IOS && mv?.hasAttribute('ios-src')) mv.removeAttribute('ios-src'); // vedi note AR (Quick Look)
            await mvWarmTexturesForConfig(); // evitiamo “prima volta” con materiali default
            await syncMVFromPageState();
            await mv.activateAR();
          } catch (e) {
            console.error('AR fallback error:', e);
            alert('AR non disponibile su questo dispositivo/navigatore.');
          }
        });
      }

      // -------- Deep-link da QR: auto AR + overlay (se serve gesto) --------
      (function handleDeepLink() {
        const q = getQuery();
        if (!/Android|iPhone|iPad/i.test(navigator.userAgent)) return;

        setFormSelectionsFromQuery();
        applyConfigToBabylonDirect();

        if (!q.ar) return;

        let overlay = null;
        const ensureOverlay = () => {
          if (overlay || !document.body) return;
          overlay = document.createElement('div');
          overlay.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35);backdrop-filter:saturate(140%) blur(2px);z-index:9999;cursor:pointer;';
          overlay.innerHTML = '<div style="background:#fff;border-radius:16px;padding:14px 16px;font:600 16px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.18)">Tocca per aprire la Realtà Aumentata</div>';
          overlay.addEventListener('pointerdown', async () => {
            try { if (IS_IOS && mv?.hasAttribute('ios-src')) mv.removeAttribute('ios-src'); await mvWarmTexturesForConfig(); await syncMVFromPageState(); await mv.activateAR(); }
            finally { overlay?.remove(); overlay=null; }
          }, { once:true });
          document.body.appendChild(overlay);
        };

        const tryAuto = async () => {
          try {
            if (IS_IOS && mv?.hasAttribute('ios-src')) mv.removeAttribute('ios-src');
            await mvWarmTexturesForConfig();
            await syncMVFromPageState();
            await mv.activateAR(); // può essere ignorata senza gesto
          } catch {
            // piccolo retry, poi overlay
            setTimeout(async () => {
              try { await mv.activateAR(); } catch { ensureOverlay(); }
            }, 180);
          }
        };

        if (mv?.model) tryAuto(); else mv.addEventListener('load', () => tryAuto(), { once:true });
      })();

    }, undefined, (error) => {
      console.error('ERRORE CARICAMENTO GLB:', error?.message || error);
    });

    // Render loop
    engine.runRenderLoop(() => babylonScene && babylonScene.render());
    window.addEventListener('resize', () => engine.resize());
  }

  /* --------------- Modale QR — chiusura con “X” --------------- */
  (function initQrModalClose() {
    const modal = document.getElementById('ar-qr-modal');
    if (!modal) return;
    const x = modal.querySelector('.qr-close');
    x && x.addEventListener('click', () => { modal.style.display = 'none'; });
  })();
});
