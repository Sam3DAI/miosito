// js/configuratori-3d-2d.js — build 2025-08-22g
// - Ripristino hamburger + carousel (loop) come versione "buona"
// - Default iniziali: 1a opzione colore, 1a opzione sfondo, cuffie OFF
// - AR deep-link & mobile: sync <model-viewer> prima di activateAR(); overlay tap su iOS
// - Babylon: texture swap senza flash; cuffie visibilità/ombre corrette

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
   * Icona AR nel bottone (immagine Cloudinary, grande quasi quanto il bottone)
   * --------------------------------- */
  (function setupArButtonUI() {
    const arBtn = document.getElementById('ar-button');
    if (!arBtn) return;
    arBtn.innerHTML = `
      <img src="https://res.cloudinary.com/dqhbriryo/image/upload/v1755855493/icona_Realt%C3%A0_Aumentata_y2p4ga.webp"
           alt="" decoding="async" loading="eager"
           style="display:block;width:100%;height:100%;object-fit:contain;padding:12%;" />
    `;
    Object.assign(arBtn.style, {
      background: '#fff',
      borderRadius: '999px',
      width: '64px', height: '64px',
      padding: '0', lineHeight: '0',
      boxShadow: '0 4px 10px rgba(63,169,245,0.15)',
      transition: 'transform .15s ease, box-shadow .2s ease',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
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
   * HAMBURGER (ripristino identico)
   * --------------------------------- */
  const setMobileState = (open) => {
    if (!hamburger || !mobileMenu) return;
    hamburger.classList.toggle('active', open);
    mobileMenu.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    if (open) {
      mobileMenu.removeAttribute('hidden');              // lascia animare la transizione CSS
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      setTimeout(() => mobileMenu.setAttribute('hidden', ''), 300); // 300ms = durata transizione
    }
  };
  const toggleMenu = () => setMobileState(!hamburger.classList.contains('active'));
  if (hamburger) {
    hamburger.addEventListener('click', toggleMenu);
    hamburger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(); }
    });
  }
  // Chiudi se clicco una voce del menu
  mobileMenu?.querySelectorAll('a')?.forEach(link => link.addEventListener('click', () => setMobileState(false)));

  // Header shadow / chiudi menu se risalgo
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    header && header.classList.toggle('scrolled', y > 50);
    if (y < lastY && hamburger?.classList.contains('active')) setMobileState(false);
    lastY = y;
  }, { passive: true });

  /* ---------------------------------
   * TEMA + chart
   * --------------------------------- */
  const THEME_KEY = 'svx-theme';
  const mediaDark = window.matchMedia('(prefers-color-scheme: dark)');
  function currentTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return mediaDark.matches ? 'dark' : 'light';
  }
  let statsChart = null;
  const getAxisLabelColor = () => body.classList.contains('dark-mode') ? '#f5f5f7' : '#1d1d1f';
  function updateChartTheme() {
    if (!statsChart) return;
    statsChart.updateOptions({
      xaxis: { labels: { style: { colors: getAxisLabelColor(), fontSize: '14px' } } },
      yaxis: { labels: { style: { colors: getAxisLabelColor(), fontSize: '14px' } } }
    }, false, true);
  }
  function applyTheme(theme) {
    const isDark = theme === 'dark';
    body.classList.toggle('dark-mode', isDark);
    themeToggle?.setAttribute('aria-pressed', String(isDark));
    if (sunIcon && moonIcon) { sunIcon.style.display = isDark ? 'none' : 'block'; moonIcon.style.display = isDark ? 'block' : 'none'; }
    updateChartTheme(); updateModelBackground();
  }
  applyTheme(currentTheme());
  themeToggle?.addEventListener('click', () => {
    const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, newTheme);
    applyTheme(newTheme);
  });
  mediaDark.addEventListener('change', (e) => { if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches ? 'dark' : 'light'); });

  /* ---------------------------------
   * CAROUSEL frecce + loop (ripristino identico)
   * --------------------------------- */
  document.querySelectorAll('.carousel-container').forEach(container => {
    const wrapper = container.querySelector('.carousel-wrapper');
    const leftArrow = container.querySelector('.carousel-arrow.left');
    const rightArrow = container.querySelector('.carousel-arrow.right');
    if (!wrapper || !leftArrow || !rightArrow) return;

    let isScrolling = false;
    const scrollByAmount = 300;

    leftArrow.addEventListener('click', () => {
      if (isScrolling) return;
      isScrolling = true;
      wrapper.scrollBy({ left: -scrollByAmount, behavior: 'smooth' });
      setTimeout(() => {
        if (wrapper.scrollLeft <= 0) {
          wrapper.scrollTo({ left: wrapper.scrollWidth - wrapper.clientWidth, behavior: 'smooth' });
        }
        isScrolling = false;
      }, 300);
    });

    rightArrow.addEventListener('click', () => {
      if (isScrolling) return;
      isScrolling = true;
      wrapper.scrollBy({ left: scrollByAmount, behavior: 'smooth' });
      setTimeout(() => {
        if (wrapper.scrollLeft + wrapper.clientWidth >= wrapper.scrollWidth - 1) {
          wrapper.scrollTo({ left: 0, behavior: 'smooth' });
        }
        isScrolling = false;
      }, 300);
    });
  });

  /* ---------------------------------
   * Lazy BG + Prefetch
   * --------------------------------- */
  (function lazyBackgrounds() {
    const lazyCards = document.querySelectorAll('.benefit-card.lazy-bg[data-bg]');
    if (!lazyCards.length) return;
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
   * Configuratore 2D (semplice)
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
        img.style.opacity = 0;
        setTimeout(() => {
          img.src = next;
          img.alt = `Prodotto Configurabile 2D - ${name.charAt(0).toUpperCase() + name.slice(1)}`;
          img.style.opacity = 1;
        }, 180);
      });
    });
  })();

  /* ---------------------------------
   * ApexCharts (render on view)
   * --------------------------------- */
  (function initStatsChart() {
    if (typeof ApexCharts === 'undefined') return;
    const target = document.querySelector('#stats-chart');
    if (!target) return;
    const options = () => ({
      chart: {
        type: 'bar', height: 350,
        animations: {
          enabled: true, easing: 'easeinout', speed: 2000,
          animateGradually: { enabled: true, delay: 150 },
          dynamicAnimation: { enabled: true, speed: 350 }
        }, toolbar: { show: false }
      },
      plotOptions: { bar: { horizontal: true, barHeight: '75%', distributed: true } },
      dataLabels: { enabled: false },
      series: [{ data: [82, 94, 66, 40] }],
      xaxis: {
        categories: ['Engagement Utenti','Tasso di Conversione','Soddisfazione Clienti','Riduzione Resi'],
        labels: { formatter: v => `${v}%`, style: { colors: getAxisLabelColor(), fontSize: '14px' } },
        axisBorder: { show: false }, axisTicks: { show: false }
      },
      yaxis: {
        labels: {
          formatter: v => {
            if (v === 'Engagement Utenti') return ['Engagement','Utenti'];
            if (v === 'Tasso di Conversione') return ['Tasso di','Conversione'];
            if (v === 'Soddisfazione Clienti') return ['Soddisfazione','Clienti'];
            return v;
          },
          style: { colors: getAxisLabelColor(), fontSize: '14px' }
        }, axisBorder: { show: false }, axisTicks: { show: false }
      },
      colors: ['#45b6fe','#6a9bfe','#8f80fe','#d95bc5'],
      grid: { show: false }, tooltip: { enabled: false }
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

  // Imposta default iniziali (prima di creare listeners)
  function ensure3DDefaults() {
    // Colore scocca
    const firstColor = document.querySelector('.color-options input[type="radio"]');
    if (firstColor && !document.querySelector('.color-options input:checked')) firstColor.checked = true;
    // Sfondo schermo
    const firstBg = document.querySelector('.background-options input[type="radio"]');
    if (firstBg && !document.querySelector('.background-options input:checked')) firstBg.checked = true;
    // Cuffie OFF
    const tgl = document.getElementById('toggle-airpods');
    if (tgl) tgl.checked = false;
  }
  ensure3DDefaults();

  if (document.getElementById('renderCanvas')) {
    const canvas = document.getElementById('renderCanvas');
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    const engine = new BABYLON.Engine(canvas, true, {
      antialias: true, adaptToDeviceRatio: true, alpha: false,
      preserveDrawingBuffer: true, stencil: true
    });

    const scene = new BABYLON.Scene(engine);
    babylonScene = scene;

    // No tone mapping (match sfondo pagina)
    scene.imageProcessingConfiguration.toneMappingEnabled = false;
    scene.imageProcessingConfiguration.exposure = 1.0;
    scene.imageProcessingConfiguration.isEnabled = false;

    // Sfondo coerente al tema
    const applyBG = () => {
      const isDark = body.classList.contains('dark-mode');
      const bg = isDark ? '#000000' : '#FAFAFA';
      canvas.style.backgroundColor = bg;
      canvas.parentElement && (canvas.parentElement.style.backgroundColor = bg);
      const c = BABYLON.Color3.FromHexString(bg);
      scene.clearColor = new BABYLON.Color4(c.r, c.g, c.b, 1);
    };
    applyBG();
    themeToggle?.addEventListener('click', applyBG);

    // Luci
    new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene).intensity = 0.4;
    const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, -1), scene);
    dirLight.position = new BABYLON.Vector3(5, 10, 5);
    dirLight.intensity = 0.5;
    new BABYLON.PointLight("pointLight", new BABYLON.Vector3(-3, 2, 0), scene).intensity = 0.3;

    // Camera
    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI, Math.PI / 2, 1.2, BABYLON.Vector3.Zero(), scene);
    const isMobileUA = /Android|iPhone|iPad/i.test(navigator.userAgent);
    camera.wheelDeltaPercentage = isMobileUA ? 0.01 : 0.02;
    camera.pinchDeltaPercentage = 0.01;
    camera.useNaturalPinchZoom = true;
    camera.inertia = 0.88; camera.panningInertia = 0.85; camera.minZ = 0.01;
    const pi = camera.inputs.attached.pointers;
    if (pi) { pi.buttons = [0, 1, 2]; pi.useCtrlForPanning = false; pi.panningMouseButton = 2; }
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

      const allMaterials = scene.materials;
      const scoccaMaterials = allMaterials.filter(m => /scocca|retro|pulsanti|box|bordi|dettagli/i.test(m.name)).map(m => m.name);
      const schermoMaterial = allMaterials.find(m => /schermo|screen/i.test(m.name))?.name;
      window.scoccaMaterials = scoccaMaterials;
      window.schermoMaterial = schermoMaterial;

      // URL texture
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

      // Pre-warm cache immagini (aiuta Quick Look al primo avvio)
      (function warmTexturesForCache(){
        const urls = [...Object.values(textures.color), ...Object.values(textures.background)];
        setTimeout(() => { urls.forEach(u => { const img = new Image(); img.decoding = 'async'; img.src = u; }); }, 50);
      })();

      // NO-FLASH: applica texture in Babylon solo quando caricate
      function setAlbedo(materialNames, url) {
        const newTex = new BABYLON.Texture(url, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
        newTex.wrapU = newTex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
        newTex.onLoadObservable.addOnce(() => {
          materialNames.forEach(name => {
            const mat = scene.getMaterialByName(name);
            if (mat) mat.albedoTexture = newTex;
          });
        });
      }

      // ---- MODEL-VIEWER bridge ----
      const mv = document.getElementById('ar-bridge');
      const IS_IOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
      if (mv) mv.setAttribute('shadow-intensity', '0');

      function forcePNG(url) {
        try { const u = new URL(url); if (u.hostname.includes('res.cloudinary.com')) u.searchParams.set('format','png'); return u.toString(); }
        catch { return url.replace('format=auto','format=png'); }
      }

      async function preloadUrls(urls) {
        await Promise.all(urls.map(u => new Promise(res => {
          const im = new Image(); im.onload = im.onerror = () => res(); im.src = u;
        })));
      }

      // Applica texture a <model-viewer> usando setURI sul source (no blob:)
      async function applyTextureByURI(materialName, url) {
        if (!url || !mv?.model) return;
        const mat = mv.model.materials.find(m => m.name === materialName);
        if (!mat) return;
        const uri = IS_IOS ? forcePNG(url) : url;
        const texInfo = mat.pbrMetallicRoughness.baseColorTexture;
        const source  = texInfo?.texture?.source;
        if (source && typeof source.setURI === 'function') {
          source.setURI(uri);
        }
      }

      // Mostra/nascondi cuffie dentro <model-viewer> (no ombre)
      function setAirpodsVisibleInMV(visible) {
        try {
          if (!mv) return;
          const sceneSym = Object.getOwnPropertySymbols(mv).find(s => s.description === 'scene');
          const threeScene = mv[sceneSym];
          const root = threeScene?.children?.[0];
          if (!root) return;
          ['Airpods','airpods','Cuffie','cuffie'].forEach(n => {
            const obj = root.getObjectByName(n);
            if (obj) obj.visible = visible;
          });
          threeScene.updateShadow?.(); threeScene.queueRender?.();
        } catch {}
      }

      // Leggi query ?ar=1&color=...&bg=...&airpods=0/1
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

      // Imposta UI da query (senza trigger eventi)
      function setFormSelectionsFromQuery() {
        const { color, bg, airpods } = getQuery();
        if (color) document.getElementById(color)?.click(); // usa click così aggiorna radio e stile
        if (bg)    document.getElementById(bg)?.click();
        const tgl = document.getElementById('toggle-airpods');
        if (tgl && airpods !== null) tgl.checked = airpods;
      }

      // Applica UI correnti a Babylon
      function applyConfigToBabylonDirect() {
        const colorId = document.querySelector('.color-options input:checked')?.id;
        const bgId    = document.querySelector('.background-options input:checked')?.id;
        if (colorId && textures.color[colorId] && scoccaMaterials?.length) setAlbedo(scoccaMaterials, textures.color[colorId]);
        if (bgId    && textures.background[bgId] && schermoMaterial)       setAlbedo([schermoMaterial], textures.background[bgId]);
        const tgl = document.getElementById('toggle-airpods');
        if (tgl && airpodsNode) {
          airpodsNode.setEnabled(!!tgl.checked);
          scene.meshes.forEach(m => {
            if (!m || m.name == null) return;
            if (/(cuffie|airpods).*(shadow|ombra)|(shadow|ombra).*(cuffie|airpods)/i.test(m.name)) m.setEnabled(!!tgl.checked);
          });
        }
      }

      // Applica UI correnti a <model-viewer>
      async function syncMVFromPageState() {
        if (!mv) return;
        await mv.updateComplete;
        if (!mv.model) return;

        const colorId = document.querySelector('.color-options input:checked')?.id;
        const bgId    = document.querySelector('.background-options input:checked')?.id;
        const colorUrl = colorId ? textures.color[colorId] : null;
        const bgUrl    = bgId    ? textures.background[bgId] : null;

        // Prefetch per garantire disponibilità al 1° avvio AR (soprattutto Safari)
        await preloadUrls([colorUrl, bgUrl].filter(Boolean));

        if (window.scoccaMaterials) {
          for (const mName of window.scoccaMaterials) await applyTextureByURI(mName, colorUrl);
        }
        if (window.schermoMaterial) await applyTextureByURI(window.schermoMaterial, bgUrl);

        // Cuffie
        const headphonesOn = !!document.getElementById('toggle-airpods')?.checked;
        setAirpodsVisibleInMV(headphonesOn);
      }

      // UI listeners → aggiornano sia Babylon che <model-viewer>
      document.querySelectorAll('.color-options input').forEach(input => {
        input.addEventListener('change', async () => {
          const url = textures.color[input.id];
          if (!url) return;
          if (scoccaMaterials?.length) setAlbedo(scoccaMaterials, url);
          await mv?.updateComplete; // tiny yield
          if (mv?.model) for (const m of scoccaMaterials) await applyTextureByURI(m, url);
        });
      });
      document.querySelectorAll('.background-options input').forEach(input => {
        input.addEventListener('change', async () => {
          const url = textures.background[input.id];
          if (!url) return;
          if (schermoMaterial) setAlbedo([schermoMaterial], url);
          await mv?.updateComplete;
          if (mv?.model && schermoMaterial) await applyTextureByURI(schermoMaterial, url);
        });
      });

      // Toggle cuffie
      const toggle = document.getElementById('toggle-airpods');
      if (airpodsNode && toggle) {
        airpodsNode.setEnabled(!!toggle.checked);
        toggle.addEventListener('change', () => {
          const on = !!toggle.checked;
          airpodsNode.setEnabled(on);
          scene.meshes.forEach(m => {
            if (!m || m.name == null) return;
            if (/(cuffie|airpods).*(shadow|ombra)|(shadow|ombra).*(cuffie|airpods)/i.test(m.name)) m.setEnabled(on);
          });
          setAirpodsVisibleInMV(on);
        });
      }

      // All’avvio: se non arriva da query, imposta default UI anche su motori
      (function initDefaultsOnce(){
        if (!location.search) {
          applyConfigToBabylonDirect();
          syncMVFromPageState();
        }
      })();

      /* -------- AR: click e deep-link -------- */
      const arButton = document.getElementById('ar-button');

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
        url.searchParams.set('airpods', airpodsOn ? '1' : '0');
        return url.toString();
      }

      // Desktop → QR modal
      function openQr() {
        const m = document.getElementById('ar-qr-modal');
        const box = document.getElementById('qr-code');
        if (m && box && window.QRCode) {
          box.innerHTML = '';
          new QRCode(box, { text: buildArShareUrl(), width: 220, height: 220 });
          m.style.display = 'block';
        } else if (m) { m.style.display = 'block'; }
      }

      async function prepareAndActivateAR() {
        if (!mv) return;
        // iOS: rimuovi ios-src per usare USDZ generato sullo stato corrente (materiali/texture aggiornate)
        if (IS_IOS && mv.hasAttribute('ios-src')) mv.removeAttribute('ios-src');

        // sincronizza entrambi i motori sullo stato UI
        applyConfigToBabylonDirect();
        await mv.updateComplete;
        await syncMVFromPageState();

        // assicurati che il renderer abbia “visto” le modifiche prima del trigger AR
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        try {
          await mv.activateAR();
        } catch (e) {
          // Safari/iOS spesso richiede gesto utente: mostra overlay di tap e riprova
          ensureArOverlay(async () => {
            await mv.updateComplete;
            await syncMVFromPageState();
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            try { await mv.activateAR(); } catch {}
          });
        }
      }

      function ensureArOverlay(onTap) {
        let overlay = document.getElementById('ar-tap-overlay');
        if (overlay) return;
        overlay = document.createElement('div');
        overlay.id = 'ar-tap-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35);backdrop-filter:saturate(140%) blur(2px);z-index:9999;cursor:pointer;';
        overlay.innerHTML = '<div style="background:#fff;border-radius:16px;padding:14px 16px;font:600 16px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.18)">Tocca per aprire la Realtà Aumentata</div>';
        overlay.addEventListener('pointerdown', async () => {
          overlay.remove();
          try { await onTap?.(); } catch {}
        }, { once: true });
        document.body.appendChild(overlay);
      }

      if (arButton) {
        arButton.addEventListener('click', async () => {
          const ua = navigator.userAgent;
          const isAndroid = /Android/i.test(ua);
          const isMobile  = /Android|iPhone|iPad/i.test(ua);

          if (!isMobile) { openQr(); return; }

          // Android: prova WebXR Babylon se disponibile
          try {
            if (isAndroid && navigator.xr && await navigator.xr.isSessionSupported('immersive-ar')) {
              await scene.createDefaultXRExperienceAsync({
                uiOptions: { sessionMode: 'immersive-ar' },
                optionalFeatures: ['hit-test', 'dom-overlay'],
                referenceSpaceType: 'local-floor'
              });
              return;
            }
          } catch {}

          // Fallback (iOS + Android senza WebXR): usa <model-viewer>
          await prepareAndActivateAR();
        });
      }

      // Deep-link da QR: auto-config + (se ar=1) prova ad aprire AR
      (function handleDeepLink() {
        const q = getQuery();
        const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
        if (!isMobile) return;

        // imposta selections da query (e default se mancanti)
        setFormSelectionsFromQuery();
        ensure3DDefaults();

        // applica su Babylon e <model-viewer>
        applyConfigToBabylonDirect();
        syncMVFromPageState();

        if (!q.ar) return;

        if (mv?.model) prepareAndActivateAR();
        else mv?.addEventListener('load', () => prepareAndActivateAR(), { once: true });
      })();

    }, undefined, (error) => {
      console.error('ERRORE CARICAMENTO GLB:', error?.message || error);
    });

    // Render loop
    engine.runRenderLoop(() => babylonScene && babylonScene.render());
    window.addEventListener('resize', () => engine.resize());
  }

  /* ---------------------------------
   * Modale QR — chiusura
   * --------------------------------- */
  (function initQrModalClose() {
    const modal = document.getElementById('ar-qr-modal');
    modal?.querySelector('.qr-close')?.addEventListener('click', () => { modal.style.display = 'none'; });
  })();

});
