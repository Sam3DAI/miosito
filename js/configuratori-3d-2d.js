// configuratori-3d-2d.js
document.addEventListener('DOMContentLoaded', () => {
  /* ---------------------------------
   * Selettori base
   * --------------------------------- */
  const body = document.body;
  const header = document.querySelector('header');
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const themeToggle = document.querySelector('.theme-toggle');
  const sunIcon = document.querySelector('.theme-icon.sun');
  const moonIcon = document.querySelector('.theme-icon.moon');

  /* ---------------------------------
   * Pulsante AR: icona + stile (bianco fisso)
   * --------------------------------- */
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

  /* ---------------------------------
   * Pulizia marcatura custom
   * --------------------------------- */
  (function unwrapGrokCard() {
    const nodes = document.querySelectorAll('grok-card');
    nodes.forEach(node => {
      const parent = node.parentNode;
      while (node.firstChild) parent.insertBefore(node.firstChild, node);
      parent.removeChild(node);
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

  // Menu mobile + scroll lock
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

  /* ---------------------------------
   * Header shadow su scroll
   * --------------------------------- */
  window.addEventListener('scroll', () => {
    if (header) header.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  /* ---------------------------------
   * Tema & chart
   * --------------------------------- */
  const THEME_KEY = 'theme';
  const mediaDark = window.matchMedia('(prefers-color-scheme: dark)');
  let statsChart = null;

  function currentTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return mediaDark.matches ? 'dark' : 'light';
  }
  function getAxisLabelColor() {
    return body.classList.contains('dark-mode') ? '#a1a1a6' : '#6e6e73';
  }
  function updateChartTheme() {
    if (!statsChart) return;
    statsChart.updateOptions({
      xaxis: { labels: { style: { colors: getAxisLabelColor(), fontSize: '14px' } } },
      yaxis: { labels: { style: { colors: getAxisLabelColor(), fontSize: '14px' } } }
    }, false, true);
  }

  // scene ref per background
  let babylonScene = null;
  function applyTheme(theme) {
    const isDark = theme === 'dark';
    body.classList.toggle('dark-mode', isDark);
    if (themeToggle) themeToggle.setAttribute('aria-pressed', String(isDark));
    if (sunIcon && moonIcon) {
      sunIcon.style.display = isDark ? 'none' : 'block';
      moonIcon.style.display = isDark ? 'block' : 'none';
    }
    updateChartTheme();
    // aggiorna background canvas
    if (babylonScene) {
      const hex = isDark ? '#000000' : '#FAFAFA';
      const canvas = document.getElementById('renderCanvas');
      if (canvas) canvas.style.backgroundColor = hex;
      const parent = canvas?.parentElement;
      if (parent) parent.style.backgroundColor = hex;
      const c = BABYLON.Color3.FromHexString(hex);
      babylonScene.clearColor = new BABYLON.Color4(c.r, c.g, c.b, 1);
    }
  }
  applyTheme(currentTheme());
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, newTheme);
      applyTheme(newTheme);
    });
  }
  mediaDark.addEventListener('change', (e) => {
    if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches ? 'dark' : 'light');
  });

  /* ---------------------------------
   * Carousel / Lazy / Prefetch / 2D / Chart (come prima)
   * --------------------------------- */
  (function wireSmallFeatures() {
    // Carousel
    const carouselContainers = document.querySelectorAll('.carousel-container');
    carouselContainers.forEach(container => {
      const wrapper = container.querySelector('.carousel-wrapper');
      const leftArrow = document.querySelector('.carousel-arrow.left');
      const rightArrow = document.querySelector('.carousel-arrow.right');
      let isScrolling = false;
      if (!wrapper || !leftArrow || !rightArrow) return;
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

    // Lazy background
    (function lazyBackgrounds() {
      const lazyCards = document.querySelectorAll('.benefit-card.lazy-bg[data-bg]');
      if (!lazyCards.length) return;
      const obs = new IntersectionObserver((entries, o) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const url = el.getAttribute('data-bg');
          if (url) {
            el.style.backgroundImage = `url('${url}')`;
            el.removeAttribute('data-bg');
          }
          o.unobserve(el);
        });
      }, { rootMargin: '200px 0px' });
      lazyCards.forEach(el => obs.observe(el));
    })();

    // Prefetch link interni
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

    // Configuratore 2D
    (function initConfigurator2D() {
      const img = document.getElementById('product-image-2d');
      if (!img) return;
      document.querySelectorAll('.color-options-2d input').forEach(input => {
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

    // Chart (se presente)
    (function initChartOnView() {
      const target = document.getElementById('why-choose');
      if (!target || typeof ApexCharts === 'undefined') return;
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
          categories: ['Engagement Utenti','Tasso di Conversione','Soddisfazione Clienti','Riduzione Resi'],
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
  })();

  /* ---------------------------------
   * Babylon.js configuratore 3D
   * --------------------------------- */
  if (document.getElementById('renderCanvas')) {
    const canvas = document.getElementById('renderCanvas');
    canvas.addEventListener('contextmenu', e => e.preventDefault()); // tasto destro = pan

    const engine = new BABYLON.Engine(canvas, true, {
      antialias: true,
      adaptToDeviceRatio: true,
      alpha: false,                 // canvas opaco: match perfetto con colore pagina
      preserveDrawingBuffer: true,
      stencil: true
    });
    engine.forceSRGBBufferSupportState = false;
    if (!engine._gl) alert('WebGL not supported – update browser.');

    // Bounds & framing
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
    function frameCamera(camera, center, maxDim) {
      camera.setTarget(center);
      const fov = camera.fov || (Math.PI / 3);
      const radius = (maxDim * 0.6) / Math.tan(fov / 2) + maxDim * 0.2;
      camera.radius = radius;
      camera.lowerRadiusLimit = Math.max(radius * 0.35, 0.02);
      camera.upperRadiusLimit = radius * 3;
    }

    function createScene() {
      const scene = new BABYLON.Scene(engine);

      // Niente image processing → il clearColor non viene “schiarito”
      scene.imageProcessingConfiguration.isEnabled = false;

      // Background tema (opaco)
      const setBG = (hex) => {
        canvas.style.backgroundColor = hex;
        const parent = canvas.parentElement;
        if (parent) parent.style.backgroundColor = hex;
        const c = BABYLON.Color3.FromHexString(hex);
        scene.clearColor = new BABYLON.Color4(c.r, c.g, c.b, 1);
      };
      const updateBackground = () => setBG(body.classList.contains('dark-mode') ? '#000000' : '#FAFAFA');
      updateBackground();
      if (themeToggle) themeToggle.addEventListener('click', updateBackground);

      // Luci
      new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene).intensity = 0.4;
      const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, -1), scene);
      dirLight.position = new BABYLON.Vector3(5, 10, 5);
      dirLight.intensity = 0.5;
      new BABYLON.PointLight("pointLight", new BABYLON.Vector3(-3, 2, 0), scene).intensity = 0.3;

      // Camera
      const camera = new BABYLON.ArcRotateCamera("camera", Math.PI, Math.PI / 2, 1.2, BABYLON.Vector3.Zero(), scene);
      camera.attachControl(canvas, true, false, true);
      const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
      camera.wheelDeltaPercentage = isMobile ? 0.01 : 0.02; // zoom morbido
      camera.pinchDeltaPercentage = 0.01;
      camera.useNaturalPinchZoom = true;
      camera.inertia = 0.88;
      camera.panningInertia = 0.85;
      camera.minZ = 0.01;

      // Mappatura mouse: sinistro=rotate, destro=pan (forzo l'input)
      camera.inputs.remove(camera.inputs.attached.pointers);
      const pInput = new BABYLON.ArcRotateCameraPointersInput();
      pInput.useCtrlForPanning = false;
      pInput.panningMouseButton = 2; // tasto destro
      pInput.buttons = [0, 2];
      camera.inputs.add(pInput);
      camera.panningSensibility = 2000; // pan lento/preciso

      // Autorotate del pivot (impostato dopo il load)
      let pivot = null, autoRotateTimer = null, isRotating = true;
      scene.onBeforeRenderObservable.add(() => { if (isRotating && pivot) pivot.rotate(BABYLON.Axis.Y, 0.003, BABYLON.Space.LOCAL); });
      canvas.addEventListener('pointerdown', () => {
        isRotating = false; clearTimeout(autoRotateTimer);
        autoRotateTimer = setTimeout(() => isRotating = true, 3000);
      });

      // Env + post FX soft
      scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
        "https://assets.babylonjs.com/environments/studio.env", scene
      );
      scene.environmentIntensity = 0.6;
      const pipeline = new BABYLON.DefaultRenderingPipeline("default", true, scene, [camera]);
      pipeline.bloomEnabled = true; pipeline.bloomThreshold = 0.8; pipeline.bloomWeight = 0.3;
      pipeline.sharpenEnabled = true; pipeline.sharpen.edgeAmount = 0.5;
      pipeline.samples = 16; pipeline.fxaaEnabled = true;

      babylonScene = scene;
      return { scene, camera, setPivot: (p) => (pivot = p) };
    }

    const { scene, camera, setPivot } = createScene();

    /* ------------------------- CARICAMENTO MODELLO ------------------------- */
    BABYLON.SceneLoader.ImportMesh("", "./assets/", "iphone_16_pro_configuratore_3d.glb", scene, (meshes) => {
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

      // Pivot centrato sulle dimensioni del solo iPhone (airpods ruotano insieme)
      const iphMeshes = iphoneNode?.getChildMeshes ? iphoneNode.getChildMeshes() : meshes;
      const { center, maxDim } = computeBounds(iphMeshes);
      const pivot = new BABYLON.TransformNode('pivot', scene);
      pivot.setAbsolutePosition(center);
      if (iphoneNode) iphoneNode.setParent(pivot);
      if (airpodsNode) airpodsNode.setParent(pivot);
      setPivot(pivot);
      frameCamera(camera, center, maxDim);

      // Materiali principali (nomi usati nel GLB)
      const allMaterials = scene.materials;
      const scoccaMaterials = allMaterials
        .filter(m => /scocca|retro|pulsanti|box|bordi|dettagli/i.test(m.name))
        .map(m => m.name);
      const schermoMaterial = allMaterials.find(m => /schermo|screen/i.test(m.name))?.name;

      window.scoccaMaterials  = scoccaMaterials;
      window.schermoMaterial  = schermoMaterial;

      // Materiali del nodo Airpods
      const airpodsMaterials = (window.airpodsMaterials = (() => {
        try {
          if (!airpodsNode) return [];
          const mats = new Set();
          airpodsNode.getChildMeshes().forEach(m => { if (m.material?.name) mats.add(m.material.name); });
          return Array.from(mats);
        } catch (e) { return []; }
      })());

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

      /* -------- Preloading / cache Babylon -------- */
      const allTextureUrls = [...Object.values(textures.color), ...Object.values(textures.background)];
      const babylonTexCache = new Map();
      function preloadBabylonTextures(urls) {
        urls.forEach(url => {
          if (babylonTexCache.has(url)) return;
          const t = new BABYLON.Texture(url, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
          t.wrapU = t.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
          babylonTexCache.set(url, t);
        });
      }
      preloadBabylonTextures(allTextureUrls);
      allTextureUrls.forEach(u => {
        const l = document.createElement('link');
        l.rel = 'prefetch'; l.as = 'image'; l.href = u;
        document.head.appendChild(l);
      });

      function setAlbedoFromCache(materialNames, url) {
        const tex = babylonTexCache.get(url) || new BABYLON.Texture(
          url, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE
        );
        babylonTexCache.set(url, tex);
        materialNames.forEach(name => {
          const mat = scene.getMaterialByName(name);
          if (mat) mat.albedoTexture = tex;
        });
      }

      // UI: colori & sfondo
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

      // Toggle cuffie (render Babylon)
      const toggle = document.getElementById('toggle-airpods');
      if (airpodsNode && toggle) {
        airpodsNode.setEnabled(false); // default OFF
        toggle.addEventListener('change', () => {
          airpodsNode.setEnabled(toggle.checked);
          // se usiamo <model-viewer> in fallback, disattiveremo anche le ombre lì
          const mv = document.getElementById('ar-bridge');
          if (mv) mv.setAttribute('shadow-intensity', toggle.checked ? '0.2' : '0');
        });
      }

      /* =========================  AR (WebXR + <model-viewer>)  ========================= */
      const IS_IOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
      const arButton = document.getElementById('ar-button');
      const mv = document.getElementById('ar-bridge'); // deve esistere in HTML
      if (mv) {
        // garantisco ar-modes per entrambi gli ecosistemi
        mv.setAttribute('ar-modes', 'webxr scene-viewer quick-look');
      }

      // Materiali cuffie da rendere invisibili in AR
      const AIRPODS_HIDE_LIST = ['bianco lucido', 'gomma', 'parti_scure cuffie'].map(s => s.toLowerCase());
      function shouldHideMatName(name) {
        const n = (name || '').toLowerCase().trim();
        if (AIRPODS_HIDE_LIST.includes(n)) return true;
        return /(cuffie|airpods)/i.test(n);
      }

      // Applica stato corrente a <model-viewer> senza usare blob (CSP-safe)
      async function syncMVFromPageState() {
        if (!mv) return;
        await mv.updateComplete;
        if (!mv.model) return;

        const colorId = document.querySelector('.color-options input:checked')?.id;
        const bgId    = document.querySelector('.background-options input:checked')?.id;
        const colorUrl = colorId && textures?.color?.[colorId];
        const bgUrl    = bgId    && textures?.background?.[bgId];

        const applyBaseColor = (matName, url) => {
          if (!url || !mv.model) return;
          const mat = mv.model.materials?.find(m => m.name === matName);
          const texInfo = mat?.pbrMetallicRoughness?.baseColorTexture;
          if (texInfo?.texture?.source?.setURI) texInfo.texture.source.setURI(url);
        };
        (window.scoccaMaterials || []).forEach(n => applyBaseColor(n, colorUrl));
        if (window.schermoMaterial) applyBaseColor(window.schermoMaterial, bgUrl);

        // Ombra fantasma cuffie → 0 quando OFF
        const headphonesOn = document.getElementById('toggle-airpods')?.checked !== false;
        mv.setAttribute('shadow-intensity', headphonesOn ? '0.2' : '0');

        // Invisibilità aggressiva dei materiali cuffie quando OFF
        if (!headphonesOn && mv.model?.materials) {
          const TRANSPARENT_PX =
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
          for (const mat of mv.model.materials) {
            if (!shouldHideMatName(mat.name)) continue;
            try { mat.setAlphaMode('MASK'); } catch {}
            mat.alphaCutoff = 1.0;
            mat.pbrMetallicRoughness.setBaseColorFactor([1,1,1,0]);
            mat.pbrMetallicRoughness.metallicFactor = 0;
            mat.pbrMetallicRoughness.roughnessFactor = 1;
            const ti = mat.pbrMetallicRoughness.baseColorTexture;
            if (ti?.setTexture) {
              const tex = await mv.createTexture ? await mv.createTexture(TRANSPARENT_PX) : null;
              if (tex) ti.setTexture(tex);
            } else if (ti?.texture?.source?.setURI) {
              ti.texture.source.setURI(TRANSPARENT_PX);
            }
            try { mat.normalTexture && mat.normalTexture.setTexture && mat.normalTexture.setTexture(null); } catch {}
            try { mat.occlusionTexture && mat.occlusionTexture.setTexture && mat.occlusionTexture.setTexture(null); } catch {}
            try { mat.emissiveTexture && mat.emissiveTexture.setTexture && mat.emissiveTexture.setTexture(null); } catch {}
          }
        }
      }

      // Stato URL → pagina
      function applyStateFromURL() {
        const params = new URLSearchParams(location.search);
        const c  = params.get('c');
        const bg = params.get('bg');
        const hp = params.get('hp');

        const setRadio = (selector, id) => {
          if (!id) return;
          const el = document.querySelector(`${selector} input#${CSS.escape(id)}`);
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
      applyStateFromURL(); // prima di eventuale auto-AR

      // Costruisci URL stato per QR
      function buildStateURL(withArFlag=true) {
        const colorId = document.querySelector('.color-options input:checked')?.id || '';
        const bgId    = document.querySelector('.background-options input:checked')?.id || '';
        const hp      = document.getElementById('toggle-airpods')?.checked ? '1' : '0';
        const url = new URL(location.href);
        url.searchParams.set('c', colorId);
        url.searchParams.set('bg', bgId);
        url.searchParams.set('hp', hp);
        if (withArFlag) url.searchParams.set('ar', '1');
        return url.toString();
      }

      // Modal QR (desktop) – senza usare elementi mancanti
      function openQRModal() {
        let modal = document.getElementById('ar-qr-modal');
        if (!modal) {
          modal = document.createElement('div');
          modal.id = 'ar-qr-modal';
          document.body.appendChild(modal);
        }
        Object.assign(modal.style, {
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '24px'
        });
        modal.innerHTML = `
          <div style="position:relative;background:#fff;border-radius:16px;box-shadow:0 20px 50px rgba(0,0,0,0.25);
                      padding:24px;width:min(420px,90vw);display:flex;flex-direction:column;align-items:center;gap:16px">
            <button id="ar-qr-close" aria-label="Chiudi" style="position:absolute;top:8px;right:10px;border:none;background:transparent;
                    color:#3FA9F5;font-weight:700;font-size:22px;line-height:1;cursor:pointer">×</button>
            <h3 style="margin:0;text-align:center;font-weight:600;color:#111;font-size:16px">
              Scansiona il QR CODE con la fotocamera del tuo smartphone/tablet per simulare la scena 3D nel tuo ambiente.
            </h3>
            <img id="ar-qr-img" alt="QR per AR" style="width:260px;height:260px;object-fit:contain" />
            <a id="ar-qr-link" href="#" target="_blank" style="font-size:12px;color:#3FA9F5;word-break:break-all"></a>
          </div>`;
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
        modal.querySelector('#ar-qr-close').addEventListener('click', () => modal.style.display = 'none');

        const target = buildStateURL(true);
        const img = modal.querySelector('#ar-qr-img');
        const link = modal.querySelector('#ar-qr-link');
        const qrAPI = 'https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=0&data=';
        img.src = qrAPI + encodeURIComponent(target);
        link.textContent = target;
        link.href = target;
        modal.style.display = 'flex';
      }

      // Click AR
      if (arButton) {
        arButton.addEventListener('click', async () => {
          const ua = navigator.userAgent;
          const isAndroid = /Android/i.test(ua);
          const isMobile  = /Android|iPhone|iPad/i.test(ua);

          if (!isMobile) { openQRModal(); return; }

          // 1) Android WebXR → AR nativa Babylon con scena attuale
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
            console.warn('WebXR non disponibile, uso fallback <model-viewer>:', err);
          }

          // 2) Fallback iOS Quick Look / Android Scene Viewer
          try {
            await syncMVFromPageState();
            await mv.activateAR();
          } catch (e) {
            console.error('Fallback AR fallito:', e);
            alert('AR non disponibile su questo dispositivo/navigatore.');
          }
        });
      }

      // Auto-avvio AR se arrivo da QR (?ar=1) → dopo aver applicato lo stato
      if (location.search.includes('ar=1') && /Android|iPhone/i.test(navigator.userAgent)) {
        setTimeout(() => arButton && arButton.click(), 100);
      }
    });

    engine.runRenderLoop(() => babylonScene && babylonScene.render());
    window.addEventListener('resize', () => engine.resize());
  }
});
