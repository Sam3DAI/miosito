// configuratori-3d-2d.js — build 2025-08-25R (Auto-AR immediato + Lazy 3D + Carousel loop)

document.addEventListener('DOMContentLoaded', () => {
  /* ---------------------------
   * Base layout / tema / menu
   * --------------------------- */
  const body = document.body;
  const header = document.querySelector('header');
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const themeToggle = document.querySelector('.theme-toggle');
  const sunIcon = document.querySelector('.theme-icon.sun');
  const moonIcon = document.querySelector('.theme-icon.moon');

  const debounce = (fn, d) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), d); }; };

  // current link
  (function markCurrent() {
    const norm = p => (p || '/').replace(/\/+$/, '') || '/';
    const here = norm(location.pathname);
    document.querySelectorAll('nav a, #mobile-menu a').forEach(a => {
      const href = norm(a.getAttribute('href'));
      if (href === here) a.setAttribute('aria-current', 'page');
    });
  })();

  // mobile menu
  const setMobileState = (open) => {
    if (!hamburger || !mobileMenu) return;
    hamburger.classList.toggle('active', open);
    mobileMenu.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    if (open) { mobileMenu.removeAttribute('hidden'); document.documentElement.style.overflow = 'hidden'; }
    else { document.documentElement.style.overflow = ''; setTimeout(() => mobileMenu.setAttribute('hidden',''), 300); }
  };
  hamburger?.addEventListener('click', () => setMobileState(!hamburger.classList.contains('active')));
  hamburger?.addEventListener('keydown', (e) => { if (e.key==='Enter'||e.key===' '){ e.preventDefault(); setMobileState(!hamburger.classList.contains('active')); }});
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    header?.classList.toggle('scrolled', y>8);
    if (y < lastY && hamburger?.classList.contains('active')) setMobileState(false);
    lastY = y;
  }, { passive:true });

  // theme
  const THEME_KEY = 'svx-theme';
  const mediaDark = window.matchMedia('(prefers-color-scheme: dark)');
  const getTheme = () => {
    const s = localStorage.getItem(THEME_KEY);
    if (s==='light'||s==='dark') return s;
    return mediaDark.matches ? 'dark' : 'light';
  };
  function applyTheme(theme){
    const isDark = theme==='dark';
    body.classList.toggle('dark-mode', isDark);
    themeToggle?.setAttribute('aria-pressed', String(isDark));
    if (sunIcon && moonIcon){ sunIcon.style.display = isDark ? 'none':'block'; moonIcon.style.display = isDark ? 'block':'none'; }
    if (window.statsChart && window.getChartOptions){ window.statsChart.updateOptions(window.getChartOptions()); }
    if (window.__svx_babylon?.scene){
      const bg = isDark ? '#000000' : '#FAFAFA';
      const canvas = document.getElementById('renderCanvas');
      if (canvas) canvas.style.backgroundColor = bg;
      const c = BABYLON.Color3.FromHexString(bg);
      window.__svx_babylon.scene.clearColor = new BABYLON.Color4(c.r,c.g,c.b,1);
    }
  }
  applyTheme(getTheme());
  themeToggle?.addEventListener('click', ()=>{ const nt = body.classList.contains('dark-mode')?'light':'dark'; localStorage.setItem(THEME_KEY, nt); applyTheme(nt); });
  mediaDark.addEventListener('change', e => { if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches?'dark':'light'); });

  /* ---------------------------
   * Carousel: frecce + loop
   * --------------------------- */
  document.querySelectorAll('.carousel-container').forEach(container => {
    const wrapper = container.querySelector('.carousel-wrapper');
    const left = container.querySelector('.carousel-arrow.left');
    const right = container.querySelector('.carousel-arrow.right');
    if (!wrapper || !left || !right) return;
    const step = () => Math.max(300, Math.round(wrapper.clientWidth*0.65));

    left.addEventListener('click', () => {
      wrapper.scrollBy({ left: -step(), behavior:'smooth' });
      setTimeout(() => {
        if (wrapper.scrollLeft <= 0) {
          wrapper.scrollTo({ left: wrapper.scrollWidth - wrapper.clientWidth - 1, behavior:'smooth' });
        }
      }, 250);
    });

    right.addEventListener('click', () => {
      wrapper.scrollBy({ left: step(), behavior:'smooth' });
      setTimeout(() => {
        if (wrapper.scrollLeft + wrapper.clientWidth >= wrapper.scrollWidth - 1) {
          wrapper.scrollTo({ left: 0, behavior:'smooth' });
        }
      }, 250);
    });

    wrapper.addEventListener('scroll', debounce(()=>{},180), { passive:true });
  });

  /* ---------------------------
   * Lazy bg (card estetica)
   * --------------------------- */
  (function lazyBG(){
    const els = document.querySelectorAll('.benefit-card.lazy-bg');
    if (!('IntersectionObserver' in window) || !els.length) return;
    const obs = new IntersectionObserver((entries,o)=>{
      entries.forEach(en=>{
        if (!en.isIntersecting) return;
        const el = en.target;
        const bg = el.getAttribute('data-bg');
        if (bg) el.style.backgroundImage = `url('${bg}')`;
        o.unobserve(el);
      });
    },{ rootMargin:'200px' });
    els.forEach(el=>obs.observe(el));
  })();

  /* ---------------------------
   * Prefetch link interni
   * --------------------------- */
  (function prefetchLinks(){
    const seen = new Set();
    const add = (href)=>{
      if (!href || seen.has(href)) return;
      if (href.includes('#')) return;
      if (!href.startsWith('/')) return;
      const l = document.createElement('link'); l.rel='prefetch'; l.href=href; document.head.appendChild(l); seen.add(href);
    };
    document.querySelectorAll('a[href^="/"]').forEach(a=>{
      const h = a.getAttribute('href');
      a.addEventListener('mouseenter', ()=>add(h));
      a.addEventListener('touchstart', ()=>add(h), { passive:true });
    });
  })();

  /* ---------------------------
   * Configuratore 2D
   * --------------------------- */
  (function init2D(){
    const img = document.getElementById('product-image-2d');
    if (!img) return;
    document.querySelectorAll('.color-options-2d input[type="radio"]').forEach(r=>{
      r.addEventListener('change', ()=>{
        const sw = r.nextElementSibling;
        const next = sw?.getAttribute('data-image');
        if (next){
          img.style.opacity='0';
          const tmp = new Image();
          tmp.onload = ()=>{ img.src = next; img.alt = `Prodotto Configurabile 2D - ${r.value}`; img.style.opacity='1'; };
          tmp.src = next;
        }
      });
    });
  })();

  /* ---------------------------
   * Stats chart (opzionale)
   * --------------------------- */
  (function initStats(){
    if (typeof ApexCharts==='undefined') return;
    const target = document.querySelector('#stats-chart');
    if (!target) return;
    const axisColor = ()=> body.classList.contains('dark-mode') ? '#a1a1a6' : '#6e6e73';
    window.getChartOptions = () => ({
      chart:{ type:'bar', height:350, animations:{enabled:true}, toolbar:{show:false} },
      plotOptions:{ bar:{ horizontal:true, barHeight:'75%', distributed:true }},
      dataLabels:{ enabled:false },
      series:[{ data:[82,94,66,40] }],
      xaxis:{ categories:['Engagement Utenti','Tasso di Conversione','Soddisfazione Clienti','Riduzione Resi'],
              labels:{ formatter:v=>v+'%', style:{ colors:axisColor(), fontSize:'14px' }}, axisBorder:{show:false}, axisTicks:{show:false}},
      yaxis:{ labels:{ style:{ colors:axisColor(), fontSize:'14px' }}, axisBorder:{show:false}, axisTicks:{show:false}},
      colors:['#45b6fe','#6a9bfe','#8f80fe','#d95bc5'],
      grid:{show:false}, tooltip:{enabled:false}
    });
    const obs = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if (e.isIntersecting && !window.statsChart){
          window.statsChart = new ApexCharts(target, window.getChartOptions());
          window.statsChart.render();
        }
      });
    },{ threshold:0.1 });
    obs.observe(target);
  })();

  /* ---------------------------
   * 3D + AR
   * --------------------------- */
  const arButton = document.getElementById('ar-button');
  const canvas = document.getElementById('renderCanvas');
  const mv = document.getElementById('ar-bridge'); // <model-viewer> presente in pagina (anche hidden)

  let _3dInitialized = false;
  let _mvPrepared   = false;   // attributi/handler impostati
  let _mvLoadedOnce = false;   // modello caricato almeno una volta

  // TEXTURES (Cloudinary) e nomi materiali
  const textures = {
    color: {
      bianco: 'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068874/bianco_sdebye.png?quality=auto&format=auto',
      grigio: 'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068859/grigio_iutpvj.png?quality=auto&format=auto',
      bronzo: 'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068893/bronzo_g23m36.png?quality=auto&format=auto',
      nero:   'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068910/nero_whga1l.png?quality=auto&format=auto'
    },
    background: {
      'sfondo-nero-bronzo': 'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981260/sfondo_iphone_viola_e_nero_qhggk6.webp?quality=auto&format=auto',
      'sfondo-arancio-nero': 'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981229/sfondo_iphone_nero_e_rosso_yzpl6h.webp?quality=auto&format=auto',
      'sfondo-nero-blu': 'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981196/sfondo_iphone_nero_e_bronzo_cmmt3h.webp?quality=auto&format=auto',
      'sfondo-nero-viola': 'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981244/sfondo_iphone_nero_e_blue_h6rgcb.webp?quality=auto&format=auto'
    }
  };
  window.textures = textures;

  // Forza default radio (prima voce) se non selezionata
  (function ensureDefaults() {
    const colorFirst = document.querySelector('.color-options input[type="radio"]');
    const bgFirst = document.querySelector('.background-options input[type="radio"]');
    if (colorFirst && !document.querySelector('.color-options input:checked')) colorFirst.checked = true;
    if (bgFirst && !document.querySelector('.background-options input:checked')) bgFirst.checked = true;
  })();

  // Helpers per query
  function currentConfigFromUI() {
    const colorId = document.querySelector('.color-options input:checked')?.id || 'bianco';
    const bgId = document.querySelector('.background-options input:checked')?.id || 'sfondo-nero-bronzo';
    const airpodsOn = !!document.getElementById('toggle-airpods')?.checked;
    return { colorId, bgId, airpodsOn };
  }
  function setUIFromQuery(q) {
    const color = q.get('color'); const bg = q.get('bg'); const ap = q.get('airpods');
    if (color) { const el = document.getElementById(color); if (el && el.type==='radio') el.checked = true; }
    if (bg)    { const el = document.getElementById(bg);    if (el && el.type==='radio') el.checked = true; }
    const tgl = document.getElementById('toggle-airpods');
    if (tgl && ap !== null) tgl.checked = ap === '1';
  }
  function buildArShareUrl() {
    const url = new URL(location.href);
    const { colorId, bgId, airpodsOn } = currentConfigFromUI();
    url.searchParams.set('ar','1');
    url.searchParams.set('color', colorId);
    url.searchParams.set('bg', bgId);
    url.searchParams.set('airpods', airpodsOn ? '1':'0');
    return url.toString();
  }

  /* ---------------------------
   * MODEL-VIEWER ONLY (per auto-AR immediato)
   * --------------------------- */
  function prepareModelViewer() {
    if (!mv || _mvPrepared) return;
    mv.setAttribute('ar','');
    mv.setAttribute('ar-modes','webxr quick-look');
    mv.setAttribute('ar-placement','floor');
    mv.setAttribute('ar-scale','auto');
    mv.setAttribute('reveal','auto');
    mv.setAttribute('loading','eager');
    mv.addEventListener('load', ()=>{ _mvLoadedOnce = true; }, { once:true });
    _mvPrepared = true;
  }

  async function applyTextureMVByName(materialName, url) {
    if (!mv?.model || !materialName || !url) return;
    const mat = mv.model.materials.find(m => m.name === materialName);
    if (!mat) return;
    const tex = await mv.createTexture(url);
    const texInfo = mat.pbrMetallicRoughness.baseColorTexture;
    if (texInfo?.setTexture) texInfo.setTexture(tex);
  }
  function findScoccaMaterialsInMV() {
    if (!mv?.model) return [];
    const rx = /(scocca|retro|pulsanti|box|bordi|dettagli)/i;
    return mv.model.materials.filter(m => rx.test(m.name)).map(m => m.name);
  }
  async function applyConfigToMV() {
    if (!mv) return;
    await mv.updateComplete;
    if (!mv.model) return;

    // Determina materiali
    let mvScocca = window.scoccaMaterials;
    if (!mvScocca || !mvScocca.length) mvScocca = findScoccaMaterialsInMV();
    const schermoMaterial = window.schermoMaterial || (mv.model.materials.find(m=>/schermo|screen/i.test(m.name))?.name);

    const colorId = document.querySelector('.color-options input:checked')?.id;
    const bgId = document.querySelector('.background-options input:checked')?.id;
    const colorUrl = colorId ? textures?.color?.[colorId] : null;
    const bgUrl = bgId ? textures?.background?.[bgId] : null;

    const tasks = [];
    if (colorUrl && mvScocca?.length) mvScocca.forEach(n => tasks.push(applyTextureMVByName(n, colorUrl)));
    if (schermoMaterial && bgUrl) tasks.push(applyTextureMVByName(schermoMaterial, bgUrl));
    await Promise.all(tasks);

    // Cuffie + eventuali ombre cuffie
    const headphonesOn = !!document.getElementById('toggle-airpods')?.checked;
    try {
      const sceneSym = Object.getOwnPropertySymbols(mv).find(s => s.description === 'scene');
      const threeScene = mv[sceneSym];
      const root = threeScene?.children?.[0];
      const rxCuffie = /(Airpods|airpods|Cuffie|cuffie)/i;
      const rxShadow = /(shadow|ombra)/i;
      root?.traverse?.((obj) => {
        if (!obj || !obj.name) return;
        if (rxCuffie.test(obj.name)) obj.visible = headphonesOn;
        if (rxShadow.test(obj.name) && rxCuffie.test(obj.name)) obj.visible = headphonesOn;
      });
      threeScene?.queueRender?.();
    } catch {}
    await mv.updateComplete;
  }

  async function triggerAutoARNow() {
    if (!mv) return;
    prepareModelViewer();
    // Pre-applica configurazione (in base ai parametri query già riversati sulla UI)
    await mv.updateComplete;
    try { await applyConfigToMV(); } catch {}
    // Attiva subito AR (prompt immediato)
    try { await mv.activateAR(); } catch (e) { /* se fallisce, non bloccare */ }
  }

  /* ---------------------------
   * BABYLON 3D (lazy)
   * --------------------------- */
  async function init3DOnce() {
    if (_3dInitialized) return;
    _3dInitialized = true;

    const isDark = body.classList.contains('dark-mode');
    const bg = isDark ? '#000000' : '#FAFAFA';
    const canvas = document.getElementById('renderCanvas');
    if (canvas) canvas.style.backgroundColor = bg;

    const engine = new BABYLON.Engine(canvas, true, {
      antialias:true, adaptToDeviceRatio:true, alpha:false,
      preserveDrawingBuffer:true, stencil:true
    });
    const scene = new BABYLON.Scene(engine);
    window.__svx_babylon = { engine, scene };

    scene.imageProcessingConfiguration.toneMappingEnabled = false;
    scene.imageProcessingConfiguration.exposure = 1.0;
    scene.imageProcessingConfiguration.isEnabled = false;

    const c = BABYLON.Color3.FromHexString(bg);
    scene.clearColor = new BABYLON.Color4(c.r,c.g,c.b,1);

    new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0,1,0), scene).intensity = 0.4;
    const dl = new BABYLON.DirectionalLight("dir", new BABYLON.Vector3(-1,-2,-1), scene);
    dl.position = new BABYLON.Vector3(5,10,5); dl.intensity = 0.5;
    new BABYLON.PointLight("pt", new BABYLON.Vector3(-3,2,0), scene).intensity = 0.3;

    const camera = new BABYLON.ArcRotateCamera("cam", Math.PI, Math.PI/2, 1.2, BABYLON.Vector3.Zero(), scene);
    const isMobileUA = /Android|iPhone|iPad/i.test(navigator.userAgent);
    camera.wheelDeltaPercentage = isMobileUA ? 0.01 : 0.02;
    camera.pinchDeltaPercentage = 0.01;
    camera.useNaturalPinchZoom = true;
    camera.inertia = 0.88; camera.panningInertia = 0.85; camera.minZ = 0.01;
    const pi = camera.inputs.attached.pointers; if (pi){ pi.buttons=[0,1,2]; pi.useCtrlForPanning=false; pi.panningMouseButton=2; }
    camera.panningSensibility = 2000;
    camera.attachControl(canvas, true, false, true);

    let pivot = null, autoRotateTimer = null, isRot = true;
    scene.onBeforeRenderObservable.add(()=>{ if(isRot && pivot) pivot.rotate(BABYLON.Axis.Y, 0.003, BABYLON.Space.LOCAL); });
    canvas.addEventListener('pointerdown', ()=>{ isRot=false; clearTimeout(autoRotateTimer); autoRotateTimer=setTimeout(()=> (isRot=true), 3000); });

    scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData('https://assets.babylonjs.com/environments/studio.env', scene);
    scene.environmentIntensity = 0.6;
    const pipe = new BABYLON.DefaultRenderingPipeline("def", true, scene, [camera]);
    pipe.bloomEnabled=true; pipe.bloomThreshold=1.0; pipe.bloomWeight=0.25; pipe.fxaaEnabled=true; pipe.samples=8;

    function bounds(meshes){
      let min = new BABYLON.Vector3(+Infinity,+Infinity,+Infinity);
      let max = new BABYLON.Vector3(-Infinity,-Infinity,-Infinity);
      meshes.forEach(m => {
        const bi = m.getBoundingInfo();
        min = BABYLON.Vector3.Minimize(min, bi.boundingBox.minimumWorld);
        max = BABYLON.Vector3.Maximize(max, bi.boundingBox.maximumWorld);
      });
      const center = min.add(max).scale(0.5);
      const size = max.subtract(min);
      const maxDim = Math.max(size.x,size.y,size.z);
      return { center, maxDim };
    }
    function frame(cam, center, maxDim){
      cam.setTarget(center);
      const fov = cam.fov || (Math.PI/3);
      const radius = (maxDim*0.6)/Math.tan(fov/2) + maxDim*0.2;
      cam.radius = radius;
      cam.lowerRadiusLimit = Math.max(radius*0.35, 0.02);
      cam.upperRadiusLimit = radius*3;
    }

    BABYLON.SceneLoader.ImportMesh('', './assets/', 'iphone_16_pro_configuratore_3d.glb', scene, (meshes)=>{
      const iphoneNode = scene.getTransformNodeByName('iphone') || scene.getNodeByName('iphone') || meshes[0];
      const airpodsNode =
        scene.getNodeByName('Airpods') || scene.getNodeByName('airpods') ||
        scene.getNodeByName('Cuffie') || scene.getNodeByName('cuffie') ||
        scene.getTransformNodeByName('Airpods');

      const printable = meshes.filter(m => m.getBoundingInfo);
      const { center, maxDim } = bounds(iphoneNode?.getChildMeshes ? iphoneNode.getChildMeshes() : printable);
      const pv = new BABYLON.TransformNode('pivot', scene);
      pv.setAbsolutePosition(center);
      if (iphoneNode) iphoneNode.setParent(pv);
      if (airpodsNode) airpodsNode.setParent(pv);
      pivot = pv; frame(camera, center, maxDim);

      // scopri materiali (salvo per riuso in MV)
      const allMats = scene.materials;
      const scocca = allMats.filter(m=>/scocca|retro|pulsanti|box|bordi|dettagli/i.test(m.name)).map(m=>m.name);
      const schermo = allMats.find(m=>/schermo|screen/i.test(m.name))?.name;
      window.scoccaMaterials = scocca;
      window.schermoMaterial = schermo;

      // funzione applicazione texture in Babylon
      function setAlbedo(materialNames, url){
        const tex = new BABYLON.Texture(url, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
        tex.wrapU = tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
        tex.onLoadObservable.addOnce(()=>{ materialNames.forEach(n => { const m = scene.getMaterialByName(n); if (m) m.albedoTexture = tex; }); });
      }

      // defaults (UI già forzata sopra)
      (function applyDefaults(){
        const colorId = document.querySelector('.color-options input:checked')?.id;
        const bgId = document.querySelector('.background-options input:checked')?.id;
        if (colorId && textures.color[colorId] && scocca?.length) setAlbedo(scocca, textures.color[colorId]);
        if (bgId && textures.background[bgId] && schermo) setAlbedo([schermo], textures.background[bgId]);
      })();

      // listeners UI -> Babylon + MV
      document.querySelectorAll('.color-options input').forEach(input=>{
        input.addEventListener('change', ()=>{
          const url = textures.color[input.id];
          if (url && scocca?.length) setAlbedo(scocca, url);
          syncModelViewerLive();
        });
      });
      document.querySelectorAll('.background-options input').forEach(input=>{
        input.addEventListener('change', ()=>{
          const url = textures.background[input.id];
          if (url && schermo) setAlbedo([schermo], url);
          syncModelViewerLive();
        });
      });

      const toggle = document.getElementById('toggle-airpods');
      if (toggle && airpodsNode){
        airpodsNode.setEnabled(!!toggle.checked);
        toggle.addEventListener('change', ()=>{
          airpodsNode.setEnabled(toggle.checked);
          scene.meshes.forEach(m=>{
            if (!m || m.name==null) return;
            if (/(cuffie|airpods).*(shadow|ombra)|(shadow|ombra).*(cuffie|airpods)/i.test(m.name)) m.setEnabled(toggle.checked);
          });
          syncModelViewerLive();
        });
      }

      engine.runRenderLoop(()=> scene.render());
      window.addEventListener('resize', ()=>engine.resize(), { passive:true });
    });

    // Pre-warm textures (cache)
    setTimeout(()=>{
      ['color','background'].forEach(k=>{
        const obj = textures[k] || {};
        Object.values(obj).forEach(u => { const im = new Image(); im.decoding='async'; im.src = u; });
      });
    }, 200);

    // Prepara MV attributi ma non forza load (già fatto da prepareModelViewer quando serve)
    prepareModelViewer();

    // Live sync MV (senza richiedere Babylon)
    const syncModelViewerLive = (()=>{ let raf=null; return ()=>{ if (!mv) return; if (raf) cancelAnimationFrame(raf); raf=requestAnimationFrame(()=>{ applyConfigToMV(); }); }; })();
    window.syncModelViewerLive = syncModelViewerLive;
  }

  /* ---------------------------
   * AR button (desktop QR / mobile AR)
   * --------------------------- */
  // Bottoncino rotondo grafico
  (function setupArBtn(){
    const btn = document.getElementById('ar-button');
    if (!btn) return;
    btn.innerHTML = `
      <img src="https://res.cloudinary.com/dqhbriryo/image/upload/v1755855493/icona_Realt%C3%A0_Aumentata_y2p4ga.webp"
           alt="" decoding="async" loading="eager"
           style="display:block;width:100%;height:100%;object-fit:contain;padding:12%;" />
    `;
    Object.assign(btn.style, {
      background:'#fff', borderRadius:'999px', width:'64px', height:'64px', padding:'0', lineHeight:'0',
      boxShadow:'0 4px 10px rgba(63,169,245,0.15)', transition:'transform .15s ease, box-shadow .2s ease',
      display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden'
    });
    btn.addEventListener('mouseenter', ()=>{ btn.style.transform='scale(1.06)'; btn.style.boxShadow='0 8px 24px rgba(63,169,245,0.25)'; });
    btn.addEventListener('mouseleave', ()=>{ btn.style.transform='scale(1)';    btn.style.boxShadow='0 4px 10px rgba(63,169,245,0.15)'; });
  })();

  const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isMobile = isIOS || isAndroid;

  if (arButton){
    arButton.addEventListener('click', async (e)=>{
      e.preventDefault(); e.stopPropagation();
      if (!isMobile){
        // Desktop -> QR modal
        const m = document.getElementById('ar-qr-modal');
        const box = document.getElementById('qr-code');
        if (m && box && window.QRCode){
          box.innerHTML='';
          new QRCode(box, { text: buildArShareUrl(), width:220, height:220 });
          m.style.display='block';
        } else if (m){ m.style.display='block'; }
        return;
      }
      // Mobile -> prepara MV e attiva AR
      try {
        prepareModelViewer();
        await applyConfigToMV();
        await mv.activateAR();
      } catch (err) {
        console.error('AR non disponibile:', err);
        alert('AR non disponibile su questo dispositivo/navigatore.');
      }
    }, { passive:false });
  }

  // QR modal close
  (function qrClose(){
    const modal = document.getElementById('ar-qr-modal');
    if (!modal) return;
    const close = modal.querySelector('.qr-close');
    close?.addEventListener('click', ()=>{ modal.style.display='none'; });
    modal.addEventListener('click', (e)=>{ if (e.target===modal) modal.style.display='none'; });
  })();

  /* ---------------------------
   * LAZY INIT triggers (Babylon)
   * --------------------------- */
  if (canvas){
    const io = new IntersectionObserver((entries,o)=>{
      entries.forEach(en=>{
        if (en.isIntersecting){ init3DOnce(); o.disconnect(); }
      });
    },{ rootMargin:'200px' });
    io.observe(canvas);
  }
  // Fallback: prima interazione UI
  document.querySelectorAll('.color-options input, .background-options input, #toggle-airpods, #ar-button')
    .forEach(el => el?.addEventListener('click', ()=> init3DOnce(), { once:true }));

  /* ---------------------------
   * AUTO-AR immediato da QR (?ar=1)
   * --------------------------- */
  (function handleDeepLinkAR(){
    const q = new URLSearchParams(location.search);
    const autoAR = q.get('ar') === '1';
    if (!autoAR) return;
    // Applica configurazione alla UI PRIMA di qualsiasi init
    setUIFromQuery(q);

    if (isMobile){
      // Avvia SUBITO solo il path Model-Viewer (leggero) per ottenere il prompt AR immediato
      prepareModelViewer();
      // Attivazione immediata (senza aspettare lo scroll)
      triggerAutoARNow();
      // Nota: Babylon 3D resta lazy e partirà solo a viewport/interazione → performance ok
    } else {
      // Desktop: mostra direttamente il modal QR (coerente con UX precedente)
      const m = document.getElementById('ar-qr-modal');
      const box = document.getElementById('qr-code');
      if (m && box && window.QRCode){
        box.innerHTML='';
        new QRCode(box, { text: buildArShareUrl(), width:220, height:220 });
        m.style.display='block';
      } else if (m){ m.style.display='block'; }
    }
  })();
});
