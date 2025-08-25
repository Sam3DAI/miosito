/* configuratori-3d-2d.js — SolveX AI3D (drop-in)
 * - Carousel accessibile con frecce/drag/keyboard + lazy bg
 * - 3D Babylon init on-demand (viewport/interazione/AR)
 * - Bridge AR con <model-viewer>, QR su desktop, deep-link mobile
 * - Configuratore 2D leggero + ApexCharts lazy
 */

(function () {
  'use strict';

  /* ----------
   * UTILITIES
   * ---------- */
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const raf = (fn) => requestAnimationFrame(fn);
  const debounce = (fn, d = 120) => {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), d); };
  };

  const isMobileUA = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  /* -------------------------
   * HEADER: theme + hamburger
   * ------------------------- */
  (function headerControls() {
    const themeBtn = $('.theme-toggle');
    const sun = $('.theme-icon.sun');
    const moon = $('.theme-icon.moon');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const root = document.documentElement;

    const apply = (dark) => {
      root.classList.toggle('dark', dark);
      if (themeBtn) themeBtn.setAttribute('aria-pressed', String(dark));
      if (sun && moon) { sun.style.display = dark ? 'none' : ''; moon.style.display = dark ? '' : 'none'; }
    };

    try {
      const saved = localStorage.getItem('theme');
      if (saved) apply(saved === 'dark'); else apply(prefersDark.matches);
      prefersDark.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) apply(e.matches);
      });
      themeBtn?.addEventListener('click', () => {
        const dark = !root.classList.contains('dark');
        localStorage.setItem('theme', dark ? 'dark' : 'light'); apply(dark);
      });
    } catch { /* silent */ }

    const hamburger = $('.hamburger');
    const mobileMenu = $('#mobile-menu');
    if (hamburger && mobileMenu) {
      const toggle = () => {
        const open = mobileMenu.hasAttribute('hidden');
        hamburger.setAttribute('aria-expanded', String(open));
        mobileMenu.toggleAttribute('hidden');
        document.body.style.overflow = open ? 'hidden' : '';
      };
      hamburger.addEventListener('click', toggle);
      hamburger.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
      mobileMenu.addEventListener('click', (e) => { if (e.target.matches('a')) toggle(); });
    }
  })();

  /* ---------------
   * CAROUSEL LOGIC
   * --------------- */
  (function initCarousels() {
    $$('.carousel-container').forEach((container) => {
      const wrapper = $('.carousel-wrapper', container);
      const leftBtn = $('.carousel-arrow.left', container);
      const rightBtn = $('.carousel-arrow.right', container);

      if (!wrapper) return;

      // Snap assist
      wrapper.style.scrollBehavior = 'smooth';
      wrapper.setAttribute('tabindex', '0');

      const cardW = () => {
        const card = $('.benefit-card', wrapper);
        return card ? (card.getBoundingClientRect().width + parseFloat(getComputedStyle(card).marginRight || 0)) : 320;
      };

      const maxScroll = () => wrapper.scrollWidth - wrapper.clientWidth;

      const updateArrows = debounce(() => {
        const x = Math.round(wrapper.scrollLeft);
        if (leftBtn) leftBtn.disabled = x <= 2;
        if (rightBtn) rightBtn.disabled = x >= maxScroll() - 2;
      }, 50);

      // Button clicks
      const scrollByCards = (dir, count = 1) => {
        const delta = dir * cardW() * count;
        wrapper.scrollTo({ left: clamp(wrapper.scrollLeft + delta, 0, maxScroll()), behavior: 'smooth' });
      };
      leftBtn?.addEventListener('click', () => scrollByCards(-1));
      rightBtn?.addEventListener('click', () => scrollByCards(+1));

      // Pressione prolungata = scroll accelerato
      const holdScroll = (dir) => {
        let active = true;
        const step = () => {
          if (!active) return;
          wrapper.scrollLeft = clamp(wrapper.scrollLeft + dir * 14, 0, maxScroll());
          updateArrows();
          requestAnimationFrame(step);
        };
        step();
        return () => { active = false; };
      };
      let cancelHoldLeft, cancelHoldRight;
      if (leftBtn) {
        leftBtn.addEventListener('mousedown', () => cancelHoldLeft = holdScroll(-1));
        leftBtn.addEventListener('mouseup', () => cancelHoldLeft?.());
        leftBtn.addEventListener('mouseleave', () => cancelHoldLeft?.());
      }
      if (rightBtn) {
        rightBtn.addEventListener('mousedown', () => cancelHoldRight = holdScroll(+1));
        rightBtn.addEventListener('mouseup', () => cancelHoldRight?.());
        rightBtn.addEventListener('mouseleave', () => cancelHoldRight?.());
      }

      // Drag to scroll
      let isDown = false, startX = 0, startLeft = 0;
      wrapper.addEventListener('pointerdown', (e) => {
        isDown = true; wrapper.setPointerCapture(e.pointerId);
        startX = e.clientX; startLeft = wrapper.scrollLeft;
        wrapper.classList.add('dragging');
      });
      wrapper.addEventListener('pointermove', (e) => {
        if (!isDown) return;
        const dx = e.clientX - startX;
        wrapper.scrollLeft = clamp(startLeft - dx, 0, maxScroll());
        updateArrows();
      });
      const endDrag = () => { isDown = false; wrapper.classList.remove('dragging'); };
      wrapper.addEventListener('pointerup', endDrag);
      wrapper.addEventListener('pointercancel', endDrag);
      wrapper.addEventListener('pointerleave', endDrag);

      // Tastiera
      wrapper.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); scrollByCards(+1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); scrollByCards(-1); }
      });

      // Lazy bg delle card
      const lazyCards = $$('.benefit-card.lazy-bg', wrapper);
      if (lazyCards.length) {
        const obs = new IntersectionObserver((entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              const el = en.target;
              const url = el.getAttribute('data-bg');
              if (url) {
                el.style.backgroundImage = `url('${url}')`;
                el.classList.remove('lazy-bg');
                obs.unobserve(el);
              }
            }
          });
        }, { root: wrapper, rootMargin: '60% 0px', threshold: 0.01 });
        lazyCards.forEach((c) => obs.observe(c));
      }

      // First state
      updateArrows();
      wrapper.addEventListener('scroll', updateArrows, { passive: true });
      window.addEventListener('resize', updateArrows);
    });
  })();

  /* ----------------
   * PREFETCH (UX)
   * ---------------- */
  (function prefetchInternalLinks() {
    if (!'IntersectionObserver' in window) return;
    const links = $$('a[href^="/"]:not([data-no-prefetch])');
    const seen = new Set();
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const a = e.target;
          const url = a.getAttribute('href');
          if (!seen.has(url)) {
            seen.add(url);
            const l = document.createElement('link');
            l.rel = 'prefetch'; l.href = url; document.head.appendChild(l);
          }
          obs.unobserve(a);
        }
      });
    }, { root: null, rootMargin: '200px', threshold: 0 });
    links.forEach((a) => obs.observe(a));
  })();

  /* -----------------------
   * CONFIGURATORE 2D LIGHT
   * ----------------------- */
  (function initConfigurator2D() {
    const img = $('#product-image-2d');
    if (!img) return;
    $$('.color-options-2d input[type="radio"]').forEach((r) => {
      r.addEventListener('change', () => {
        const sw = r.nextElementSibling;
        const next = sw?.getAttribute('data-image');
        if (!next) return;
        img.style.opacity = '0';
        const tmp = new Image();
        tmp.onload = () => {
          img.src = next;
          img.alt = `Prodotto Configurabile 2D - ${r.value}`;
          img.style.opacity = '1';
        };
        tmp.src = next;
      });
    });
  })();

  /* ------------------------
   * APEXCHARTS on visibility
   * ------------------------ */
  let statsChart = null;
  (function initStatsChart() {
    const target = $('#stats-chart');
    if (!target || typeof ApexCharts === 'undefined') return;
    const options = () => ({
      chart: {
        type: 'bar', height: 350,
        animations: {
          enabled: true, easing: 'easeinout', speed: 1200,
          animateGradually: { enabled: true, delay: 120 },
          dynamicAnimation: { enabled: true, speed: 300 }
        },
        toolbar: { show: false }
      },
      plotOptions: { bar: { horizontal: true, barHeight: '75%', distributed: true } },
      dataLabels: { enabled: false },
      series: [{ data: [82, 94, 66, 40] }],
      xaxis: {
        categories: ['Engagement Utenti', 'Tasso di Conversione', 'Soddisfazione Clienti', 'Riduzione Resi'],
        labels: { formatter: (v) => `${v}%`, style: { colors: getAxisLabelColor(), fontSize: '14px' } },
        axisBorder: { show: false }, axisTicks: { show: false }
      },
      yaxis: {
        labels: {
          formatter: (value) => {
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
    function getAxisLabelColor() {
      return getComputedStyle(document.documentElement).getPropertyValue('--text-muted') || '#999';
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !statsChart) {
          statsChart = new ApexCharts(target, options());
          statsChart.render();
        }
      });
    }, { threshold: 0.15 });
    obs.observe(target);
  })();

  /* ------------------------------------------------
   * 3D (Babylon.js) + AR bridge (model-viewer)
   * On-Demand: inizializza solo quando serve
   * ------------------------------------------------ */
  const canvas = $('#renderCanvas');              // presente nell’HTML
  const mv = $('#ar-bridge');                     // <model-viewer> nascosto
  const arButton = $('#ar-button');               // bottone AR
  const qrModal = $('#ar-qr-modal');              // overlay QR (desktop)
  const qrClose = qrModal ? $('.qr-close', qrModal) : null;

  let engine = null, scene = null, camera = null, pivot = null;
  let babylonReady = false;
  let mvLoaded = false;

  // Track caricamento <model-viewer>
  if (mv) {
    mv.addEventListener('load', () => { mvLoaded = true; }, { once: true });
    Promise.resolve().then(() => { if (mv.model) mvLoaded = true; });
    // Config base (non costa nulla)
    mv.setAttribute('shadow-intensity','0');
    mv.setAttribute('ar','');
    mv.setAttribute('ar-modes','webxr quick-look');
    mv.setAttribute('ar-placement','floor');
    mv.setAttribute('ar-scale','auto');
    mv.setAttribute('reveal','auto');
    mv.setAttribute('loading','eager');
  }

  // Lazily warm Cloudinary suggestion: niente finché non serve (vedi sotto)

  async function ensureBabylon() {
    if (babylonReady || !canvas || typeof BABYLON === 'undefined') return;
    // Engine + Scene
    engine = new BABYLON.Engine(canvas, true, { antialias: true, preserveDrawingBuffer: true, stencil: false, doNotHandleContextLost: false });
    scene = new BABYLON.Scene(engine);
    scene.useRightHandedSystem = true;
    scene.createDefaultEnvironment({ createGround: false, createSkybox: false });

    // Camera
    camera = new BABYLON.ArcRotateCamera('cam', Math.PI * 1.25, Math.PI / 3, 3, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.wheelPrecision = 80;
    camera.panningSensibility = 0;
    camera.lowerBetaLimit = 0.15;
    camera.upperBetaLimit = 1.35;

    // Luci
    const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0.6, 1, -0.4), scene);
    hemi.intensity = 0.8;
    const dir = new BABYLON.DirectionalLight('dir', new BABYLON.Vector3(-0.8, -1, 0.6), scene);
    dir.intensity = 1.1;

    // Post FX (leggeri)
    const pipeline = new BABYLON.DefaultRenderingPipeline('default', true, scene, [camera]);
    pipeline.bloomEnabled = true; pipeline.bloomThreshold = 1.0; pipeline.bloomWeight = 0.22;
    pipeline.fxaaEnabled = true; pipeline.samples = 4;

    // Helpers
    function computeBounds(meshes) {
      let min = new BABYLON.Vector3(+Infinity, +Infinity, +Infinity);
      let max = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity);
      meshes.forEach((m) => {
        if (!m.getBoundingInfo) return;
        const bi = m.getBoundingInfo();
        min = BABYLON.Vector3.Minimize(min, bi.boundingBox.minimumWorld);
        max = BABYLON.Vector3.Maximize(max, bi.boundingBox.maximumWorld);
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

    // Carica modello
    BABYLON.SceneLoader.ImportMesh('', './assets/', 'iphone_16_pro_configuratore_3d.glb', scene, (meshes) => {
      const iphoneNode = scene.getTransformNodeByName('iphone') || scene.getNodeByName('iphone') || meshes[0];
      const airpodsNode =
        scene.getNodeByName('Airpods') || scene.getNodeByName('airpods') ||
        scene.getNodeByName('Cuffie')  || scene.getNodeByName('cuffie')  ||
        scene.getTransformNodeByName('Airpods');

      const printable = meshes.filter((m) => m.getBoundingInfo);
      const { center, maxDim } = computeBounds(iphoneNode?.getChildMeshes ? iphoneNode.getChildMeshes() : printable);

      pivot = new BABYLON.TransformNode('pivot', scene);
      pivot.setAbsolutePosition(center);
      if (iphoneNode) iphoneNode.setParent(pivot);
      if (airpodsNode) airpodsNode.setParent(pivot);
      frameCamera(camera, center, maxDim);

      // Mappa materiali (nomi coerenti con tuo GLB)
      const allMaterials = scene.materials;
      const scoccaMaterials = allMaterials.filter(m => /scocca|retro|pulsanti|box|bordi|dettagli/i.test(m.name)).map(m => m.name);
      const schermoMaterial = allMaterials.find(m => /schermo|screen/i.test(m.name))?.name;
      window.scoccaMaterials = scoccaMaterials;
      window.schermoMaterial = schermoMaterial;

      // Textures (Cloudinary) — coerenti con le opzioni HTML
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
          'sfondo-nero-blu':    'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981196/sfondo_iphone_nero_e_bronzo_cmmt3h.webp?quality=auto&format=auto',
          'sfondo-nero-viola':  'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981244/sfondo_iphone_nero_e_blue_h6rgcb.webp?quality=auto&format=auto'
        }
      };
      window.textures = textures;

      // Applicatore NO-FLASH: texture solo quando pronte
      function setAlbedo(materialNames, url) {
        const tex = new BABYLON.Texture(url, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
        tex.wrapU = tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
        tex.onLoadObservable.addOnce(() => {
          materialNames.forEach((name) => {
            const mat = scene.getMaterialByName(name);
            if (mat) mat.albedoTexture = tex;
          });
        });
      }

      // Selezioni di default (se non già selezionate)
      (function ensureDefaultSelections() {
        const colorFirst = $('.color-options input[type="radio"]');
        const bgFirst = $('.background-options input[type="radio"]');
        if (colorFirst && !$('.color-options input:checked')) colorFirst.checked = true;
        if (bgFirst && !$('.background-options input:checked')) bgFirst.checked = true;
      })();

      // Applica default a Babylon
      (function applyDefaultBabylon() {
        const colorId = $('.color-options input:checked')?.id;
        const bgId    = $('.background-options input:checked')?.id;
        if (colorId && textures.color[colorId] && scoccaMaterials?.length) setAlbedo(scoccaMaterials, textures.color[colorId]);
        if (bgId && textures.background[bgId] && schermoMaterial) setAlbedo([schermoMaterial], textures.background[bgId]);
      })();

      // UI → Babylon (realtime)
      $$('.color-options input').forEach((input) => {
        input.addEventListener('change', () => {
          const url = textures.color[input.id];
          if (url && scoccaMaterials?.length) setAlbedo(scoccaMaterials, url);
          syncMVLive(); // aggiorna anche MV
        });
      });
      $$('.background-options input').forEach((input) => {
        input.addEventListener('change', () => {
          const url = textures.background[input.id];
          if (url && schermoMaterial) setAlbedo([schermoMaterial], url);
          syncMVLive();
        });
      });

      // Toggle cuffie (Babylon + MV)
      const airpodsToggle = $('#toggle-airpods');
      if (airpodsToggle) {
        airpodsToggle.addEventListener('change', () => {
          const on = airpodsToggle.checked;
          if (scene && scene.meshes) {
            scene.meshes.forEach((m) => {
              if (!m || m.name == null) return;
              // nodi cuffie e loro ombre
              if (/(cuffie|airpods)/i.test(m.name)) m.setEnabled(on);
              if (/(cuffie|airpods).*(shadow|ombra)|(shadow|ombra).*(cuffie|airpods)/i.test(m.name)) m.setEnabled(on);
            });
          }
          setAirpodsVisibleInMV(on);
          syncMVLive();
        });
      }

      babylonReady = true;
      engine.runRenderLoop(() => scene.render());
      window.addEventListener('resize', () => engine?.resize());
    });
  }

  // -------- MV helpers --------
  function setAirpodsVisibleInMV(visible) {
    try {
      if (!mv) return;
      const sceneSym = Object.getOwnPropertySymbols(mv).find(s => s.description === 'scene');
      const threeScene = mv?.[sceneSym];
      const root = threeScene?.children?.[0];
      if (!root) return;
      const rxCuffie = /(Airpods|airpods|Cuffie|cuffie)/i;
      const rxShadow = /(shadow|ombra)/i;
      root.traverse?.((obj) => {
        if (!obj || !obj.name) return;
        const name = obj.name;
        if (rxCuffie.test(name)) obj.visible = visible;
        if (rxShadow.test(name) && rxCuffie.test(name)) obj.visible = visible;
      });
      threeScene?.queueRender?.();
    } catch {/* ignore */}
  }

  function findScoccaMaterialsInMV() {
    if (!mv?.model) return [];
    const rx = /(scocca|retro|pulsanti|box|bordi|dettagli)/i;
    return mv.model.materials.filter(m => rx.test(m.name)).map(m => m.name);
  }

  function configStamp() {
    const colorId = $('.color-options input:checked')?.id || 'bianco';
    const bgId    = $('.background-options input:checked')?.id || 'sfondo-nero-bronzo';
    const airpodsOn = !!$('#toggle-airpods')?.checked;
    return `c=${colorId}|bg=${bgId}|hp=${airpodsOn ? 1 : 0}`;
  }

  function toIOSPngWithStamp(url, stamp) {
    try {
      const u = new URL(url);
      u.searchParams.set('format','png');
      u.searchParams.set('v', stamp);
      return u.toString();
    } catch {
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}format=png&v=${encodeURIComponent(stamp)}`;
    }
  }

  async function applyTextureMVByName(materialName, url, forAR = false) {
    if (!mv?.model || !materialName || !url) return;
    const uri = (forAR && /iPad|iPhone|iPod/i.test(navigator.userAgent)) ? toIOSPngWithStamp(url, configStamp()) : url;
    const mat = mv.model.materials.find(m => m.name === materialName);
    if (!mat) return;
    const tex = await mv.createTexture(uri);
    const texInfo = mat.pbrMetallicRoughness.baseColorTexture;
    if (texInfo?.setTexture) texInfo.setTexture(tex);
  }

  async function applyConfigToModelViewer(forAR = false) {
    if (!mv) return;
    const scoccaMats = (mv.model ? findScoccaMaterialsInMV() : []);
    const colorId = $('.color-options input:checked')?.id || 'bianco';
    const bgId    = $('.background-options input:checked')?.id || 'sfondo-nero-bronzo';
    const airpodsOn = !!$('#toggle-airpods')?.checked;

    const colURL = window.textures?.color?.[colorId];
    const bgURL  = window.textures?.background?.[bgId];

    if (mv.model && scoccaMats.length && colURL) {
      await Promise.all(scoccaMats.map((name) => applyTextureMVByName(name, colURL, forAR)));
    }
    if (mv.model && bgURL) {
      // prova a trovare materiale "schermo"
      const scr = mv.model.materials.find(m => /schermo|screen/i.test(m.name))?.name;
      if (scr) await applyTextureMVByName(scr, bgURL, forAR);
    }
    setAirpodsVisibleInMV(airpodsOn);
  }

  function buildArShareUrl() {
    const url = new URL(location.href);
    url.searchParams.set('ar','1');
    const colorId = $('.color-options input:checked')?.id || 'bianco';
    const bgId    = $('.background-options input:checked')?.id || 'sfondo-nero-bronzo';
    const airpodsOn = !!$('#toggle-airpods')?.checked;
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
    if (bg) { const el = document.getElementById(bg); if (el && el.type === 'radio') el.checked = true; }
    const tgl = $('#toggle-airpods');
    if (tgl && airpods !== null) tgl.checked = airpods;
  }

  // Mantieni MV in sync con UI (anche se nascosto)
  async function syncMVLive() {
    if (!mv) return;
    if (mv.model) {
      await applyConfigToModelViewer(false);
    } else {
      mv.addEventListener('load', () => applyConfigToModelViewer(false), { once: true });
    }
  }

  // QR modal (desktop)
  function openQR() {
    if (!qrModal) return;
    const box = $('#qr-code', qrModal);
    if (box && window.QRCode) {
      box.innerHTML = '';
      new QRCode(box, { text: buildArShareUrl(), width: 220, height: 220 });
    }
    qrModal.style.display = 'block';
  }
  function closeQR() { if (qrModal) qrModal.style.display = 'none'; }
  qrClose?.addEventListener('click', closeQR);
  qrModal?.addEventListener('click', (e) => { if (e.target === qrModal) closeQR(); });

  // Click AR
  arButton?.addEventListener('click', async (e) => {
    e.preventDefault(); e.stopPropagation();
    // Se non abbiamo ancora inizializzato Babylon, fallo ora (serve per sincronizzare texture)
    await ensureBabylon();
    await syncMVLive();

    if (!isMobileUA) {
      // Desktop → mostra QR
      openQR();
      return;
    }

    try {
      // iOS: rimuovi eventuale ios-src per Quick Look con GLB baked
      if (/iPad|iPhone|iPod/i.test(navigator.userAgent) && mv?.hasAttribute('ios-src')) {
        mv.removeAttribute('ios-src');
      }
      mv.setAttribute('ar','');
      mv.setAttribute('ar-modes','webxr quick-look');
      mv.setAttribute('ar-placement','floor');
      mv.setAttribute('ar-scale','auto');

      if (/Android/i.test(navigator.userAgent)) {
        // Android / WebXR — niente bake
        if (!mvLoaded) { console.warn('[AR] model-viewer non ancora caricato; provo comunque activateAR()'); }
        await mv.activateAR();
      } else {
        // iOS — bake GLB in memoria per trasferire le texture custom a Quick Look
        await applyConfigToModelViewer(true);
        const baked = await bakeAndSwapSrcIOS();
        await mv.activateAR();
        // ripristina src dopo un attimo e libera URL
        setTimeout(() => { URL.revokeObjectURL(baked.url); if (baked.prev) mv.setAttribute('src', baked.prev); }, 1500);
      }
    } catch (err) {
      console.error('AR non disponibile:', err);
      alert('AR non disponibile su questo dispositivo/navigatore.');
    }
  });

  // Bake iOS helper
  async function bakeAndSwapSrcIOS() {
    const blob = await mv.exportScene({ binary: true }); // GLB baked
    const url = URL.createObjectURL(blob);
    const prev = mv.getAttribute('src') || '';
    mv.setAttribute('src', url + '#cfg=' + Date.now());
    if (!mv.model) await new Promise(res => mv.addEventListener('load', res, { once: true }));
    else await new Promise(r => setTimeout(r, 0));
    return { url, prev };
  }

  // Deep-link mobile: ?ar=1&color=...&bg=...&airpods=...
  (function handleDeepLinkMobile() {
    if (!isMobileUA) return;
    const q = getQuery();
    if (!q.color && !q.bg && q.airpods === null && !q.ar) return;

    // Applica UI e Babylon subito
    setFormSelectionsFromQuery();
    ensureBabylon().then(() => {
      // Re-applica su Babylon
      const color = $('.color-options input:checked')?.id;
      const bg    = $('.background-options input:checked')?.id;

      const scoccaMaterials = window.scoccaMaterials;
      const schermoMaterial = window.schermoMaterial;
      const textures = window.textures;

      if (color && textures?.color?.[color] && scoccaMaterials?.length) {
        const url = textures.color[color];
        const tex = new BABYLON.Texture(url, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
        tex.onLoadObservable.addOnce(() => scoccaMaterials.forEach((n) => {
          const m = scene.getMaterialByName(n); if (m) m.albedoTexture = tex;
        }));
      }
      if (bg && textures?.background?.[bg] && schermoMaterial) {
        const url = textures.background[bg];
        const tex = new BABYLON.Texture(url, scene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
        tex.onLoadObservable.addOnce(() => {
          const m = scene.getMaterialByName(schermoMaterial); if (m) m.albedoTexture = tex;
        });
      }
      const toggle = $('#toggle-airpods');
      if (toggle) {
        const on = toggle.checked;
        scene.meshes.forEach((m) => {
          if (!m || m.name == null) return;
          if (/(cuffie|airpods)/i.test(m.name)) m.setEnabled(on);
          if (/(cuffie|airpods).*(shadow|ombra)|(shadow|ombra).*(cuffie|airpods)/i.test(m.name)) m.setEnabled(on);
        });
      }
      syncMVLive();
    });

    // Se c'è ?ar=1 → prova ad avviare AR (serve gesto su Android: overlay finto)
    if (q.ar && mv) {
      (async () => {
        try {
          await applyConfigToModelViewer(/iPad|iPhone|iPod/i.test(navigator.userAgent));
          if (/Android/i.test(navigator.userAgent)) {
            // Android richiede gesto: overlay cattura tap
            let overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.35);z-index:9999;';
            overlay.innerHTML = '<div style="background:#111;color:#fff;padding:12px 16px;border-radius:10px;font:600 15px system-ui">Tocca per aprire AR</div>';
            document.body.appendChild(overlay);
            overlay.addEventListener('click', async () => {
              document.body.removeChild(overlay);
              try { await mv.activateAR(); } catch (e) { console.error(e); }
            }, { once: true });
          } else {
            // iOS: bake e avvia
            const baked = await bakeAndSwapSrcIOS();
            await mv.activateAR();
            setTimeout(() => { URL.revokeObjectURL(baked.url); if (baked.prev) mv.setAttribute('src', baked.prev); }, 1500);
          }
        } catch (e) {
          console.error('AR auto-launch fallita:', e);
        }
      })();
    }
  })();

  // -------- 3D On-Demand triggers --------
  if (canvas) {
    // viewport trigger
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          ensureBabylon();
          io.disconnect();
        }
      });
    }, { root: null, rootMargin: '120px', threshold: 0.1 });
    io.observe(canvas);

    // interazione trigger
    ['pointerdown','wheel','touchstart','keydown','change'].forEach((ev) => {
      document.addEventListener(ev, function once() {
        ensureBabylon();
        document.removeEventListener(ev, once, true);
      }, true);
    });
  }

})();
