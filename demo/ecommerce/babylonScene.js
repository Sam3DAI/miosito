window.WDScene = (function () {
  const CAMERA_CFG = window.WDCameraPresets?.cameras || {};
  const VIEWER_CFG = window.WDCameraPresets?.viewer || {};

  function getCameraCfg(name, fallbackName = "default") {
    return CAMERA_CFG[name] || CAMERA_CFG[fallbackName] || {
      yaw: Math.PI - 0.75,
      pitch: Math.PI / 2.95,
      distance: 1.95,
      targetX: 0.25,
      targetY: 0.10,
      targetZ: 0.00,
      zoomMin: 1.95,
      zoomMax: 1.95
    };
  }

  const NORMALIZE = {
    targetSize: 1.9,
    groundEps: 0.002
  };

  const DEFAULT_CAM = getCameraCfg("model", "model");

  const CAMERA_DEFAULTS = {
    fov: 0.58,
    alpha: DEFAULT_CAM.yaw,
    beta: DEFAULT_CAM.pitch,
    radius: DEFAULT_CAM.distance,
    target: new BABYLON.Vector3(
      DEFAULT_CAM.targetX,
      DEFAULT_CAM.targetY,
      DEFAULT_CAM.targetZ
    )
  };

  const textureCache = new Map();

  function createEngine(canvas) {
    const engine = new BABYLON.Engine(canvas, true, {
      antialias: true,
      preserveDrawingBuffer: true,
      stencil: true,
      adaptToDeviceRatio: true
    });

    engine.loadingScreen = {
      displayLoadingUI() {},
      hideLoadingUI() {}
    };

    return engine;
  }

  function createScene(engine, canvas, opts = {}) {
    const scene = new BABYLON.Scene(engine);

    const clear = opts.environment?.clearColor || [0.97, 0.97, 0.98, 1];
    scene.clearColor = new BABYLON.Color4(clear[0], clear[1], clear[2], clear[3]);

    const camera = new BABYLON.ArcRotateCamera(
      "cam",
      CAMERA_DEFAULTS.alpha,
      CAMERA_DEFAULTS.beta,
      CAMERA_DEFAULTS.radius,
      CAMERA_DEFAULTS.target.clone(),
      scene
    );

    camera.fov = CAMERA_DEFAULTS.fov;
    camera.minZ = 0.01;
    camera.maxZ = 100;

    // Demo46: physically useful bounds, never a fixed zoom.
    camera.lowerRadiusLimit = 1.15;
    camera.upperRadiusLimit = 7;

    // limiti verticali ragionevoli, rotazione orizzontale libera
    camera.lowerBetaLimit = 0.75;
    camera.upperBetaLimit = 1.42;

    // Pan remains constrained to keep the product in view. Orbit and zoom are available.
    camera.panningSensibility = 0;
    camera.wheelDeltaPercentage = 0.02;
    camera.pinchDeltaPercentage = 0.02;
    camera.useNaturalPinchZoom = true;
    camera.attachControl(canvas, true);

    scene.__wdAutoRotate = {
  enabled: false,
  resumeAt: 0,
  speed: 0.0018 // velocità lenta e gradevole
};

    registerViewerInteraction(scene, camera, canvas);

    window.WDFx.applyStudioEnvironment(scene, opts.environment || {});
    window.WDFx.createStudioLights(scene, opts.lights || {});

    scene.onBeforeRenderObservable.add(() => {
      const auto = scene.__wdAutoRotate;
      if (!auto || !auto.enabled) return;
      if (Date.now() < auto.resumeAt) return;
      camera.alpha += auto.speed;
    });

    let inView=true;
    const observer=new IntersectionObserver(entries=>{inView=entries.some(entry=>entry.isIntersecting);},{threshold:0.01});
    observer.observe(canvas);
    const render=()=>{if(!document.hidden&&inView&&window.WD46Display?.isVisible()!==false)scene.render();};
    engine.runRenderLoop(render);
    scene.onDisposeObservable.addOnce(()=>observer.disconnect());
    window.addEventListener("resize", () => {
      engine.resize();
    });
    const resizeObserver=new ResizeObserver(()=>engine.resize());resizeObserver.observe(canvas);
    scene.onDisposeObservable.addOnce(()=>resizeObserver.disconnect());

    return { scene, camera };
  }

  function registerViewerInteraction(scene, camera, canvas) {
    const pause = () => {
  pauseAutoRotate(scene, 2500);
};

    ["pointerdown", "pointermove", "wheel", "touchstart", "touchmove"].forEach((eventName) => {
      canvas.addEventListener(eventName, pause, { passive: true });
    });

    const pointers = camera.inputs.attached.pointers;
    if (pointers) {
      pointers.panningSensibility = 0;
      pointers.multiTouchPanning = false;
      pointers.pinchZoom = true;
    }
  }

  function setAutoRotateEnabled(scene, enabled, speed) {
  if (!scene) return;

  if (!scene.__wdAutoRotate) {
    scene.__wdAutoRotate = {
      enabled: !!enabled,
      resumeAt: 0,
      speed: typeof speed === "number" ? speed : 0.0018
    };
    return;
  }

  scene.__wdAutoRotate.enabled = !!enabled;

  if (typeof speed === "number") {
    scene.__wdAutoRotate.speed = speed;
  }

  if (enabled) {
    scene.__wdAutoRotate.resumeAt = Date.now() + 1200;
  }
}

  function setUserInteractionEnabled(camera, canvas, enabled) {
  if (!camera || !canvas) return;
  // All four demo steps keep the same attached camera. No detach/refocus on panel updates.
  if (!enabled) throw Error('Demo46 camera must remain interactive');
}

  function moveCamera(scene,camera,action){
    if(!scene||!camera)return;
    scene.stopAnimation(camera);
    if(action==='left')camera.alpha-=0.22;
    else if(action==='right')camera.alpha+=0.22;
    else if(action==='in')camera.radius=Math.max(camera.lowerRadiusLimit,camera.radius*0.88);
    else if(action==='out')camera.radius=Math.min(camera.upperRadiusLimit,camera.radius/0.88);
    else if(action==='reset')focusCameraToArea(scene,camera,'model',{immediate:true});
    else throw Error('Unknown camera action');
  }

  function pauseAutoRotate(scene, ms = 2500) {
  if (!scene?.__wdAutoRotate) return;
  scene.__wdAutoRotate.resumeAt = Date.now() + ms;
}

  function disposeModelNodes(scene, modelState) {
    const nodesToDispose = new Set();

    const oldRoot = scene.getTransformNodeByName("wdRoot");
    if (oldRoot) nodesToDispose.add(oldRoot);

    if (modelState?.rootNodes?.length) {
      modelState.rootNodes.forEach((n) => {
        if (n) nodesToDispose.add(n);
      });
    }

    nodesToDispose.forEach((node) => {
      try {
        const meshes=node.getChildMeshes?.()||[];
        const materials=new Set(meshes.map(mesh=>mesh.material).filter(Boolean));
        node.dispose(false, false);
        materials.forEach(material=>material.dispose(false,false));
      } catch (err) {
        console.warn("[WD] disposeModelNodes warning:", err);
      }
    });

    if (modelState) {
      modelState.rootNodes = [];
      modelState.meshesByName = new Map();
    }
  }

  function getImportedRenderableMeshes(result) {
    return (result?.meshes || []).filter(
      (m) => m && m.name !== "__root__" && m.getTotalVertices && m.getTotalVertices() > 0
    );
  }

  function computeBoundsFromMeshes(meshes) {
    let min = new BABYLON.Vector3(Infinity, Infinity, Infinity);
    let max = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity);

    meshes.forEach((m) => {
      m.computeWorldMatrix(true);
      const bi = m.getBoundingInfo?.();
      if (!bi) return;

      min = BABYLON.Vector3.Minimize(min, bi.boundingBox.minimumWorld);
      max = BABYLON.Vector3.Maximize(max, bi.boundingBox.maximumWorld);
    });

    const center = min.add(max).scale(0.5);
    const size = max.subtract(min);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;

    return { min, max, center, size, maxDim };
  }

  function normalizeModelPose(scene, meshes, opts = {}) {
  const validMeshes = (meshes || []).filter(
    (m) => m && m.getTotalVertices && m.getTotalVertices() > 0 && m.isEnabled()
  );

  if (!validMeshes.length) return null;

  // bounds originali del modello importato
  const rawBounds = computeBoundsFromMeshes(validMeshes);

  // root unico su cui facciamo centraggio e scala
  const root = new BABYLON.TransformNode(opts.rootName || "wdRoot", scene);

  validMeshes.forEach((mesh) => {
    if (mesh.parent !== root) mesh.setParent(root);
  });

  // scala uniforme in base alla dimensione massima
  let scale = Number(opts.targetSize || NORMALIZE.targetSize) / rawBounds.maxDim;
  if (!isFinite(scale) || scale <= 0) scale = 1;

  root.scaling.set(scale, scale, scale);
  root.rotation.set(0, 0, 0);
  root.position.set(0, 0, 0);
  root.computeWorldMatrix(true);

  // ricalcolo bounds dopo parenting + scaling
  const scaledBounds = computeBoundsFromMeshes(validMeshes);

  // centraggio preciso sugli assi X/Z
  // e appoggio corretto a terra su Y
  root.position.x = -scaledBounds.center.x;
  root.position.z = -scaledBounds.center.z;
  root.position.y = -scaledBounds.min.y + NORMALIZE.groundEps;

  root.computeWorldMatrix(true);

  // bounds finali normalizzati
  const normalizedBounds = computeBoundsFromMeshes(validMeshes);

  return {
    root,
    rawBounds,
    bounds: normalizedBounds
  };
}

  function computeCameraPresetsFromBounds(bounds) {
  const center = bounds?.center || BABYLON.Vector3.Zero();

  function makePreset(cameraKey, fallbackKey = "model") {
    const cfg = getCameraCfg(cameraKey, fallbackKey);

    return {
      alpha: cfg.yaw,
      beta: cfg.pitch,
      radius: cfg.distance,

      // centro reale + offset del preset
      target: new BABYLON.Vector3(
        center.x + Number(cfg.targetX || 0),
        center.y + Number(cfg.targetY || 0),
        center.z + Number(cfg.targetZ || 0)
      ),

      zoomMin: cfg.zoomMin,
      zoomMax: cfg.zoomMax
    };
  }

  return {
    default: makePreset("default", "model"),
    model: makePreset("model", "default"),
    brand: makePreset("brand", "model"),
    materials: makePreset("materials", "model"),
    summary: makePreset("summary", "model")
  };
}

function focusCameraSmooth(scene, camera, config, options = {}) {
  if (!scene || !camera || !config) return;

  const durationFrames = Number(options.durationFrames || 24);
  const fps = Number(options.fps || 60);
  const immediate = options.immediate === true;

  // stop completo di ogni movimento residuo
  camera.inertialAlphaOffset = 0;
  camera.inertialBetaOffset = 0;
  camera.inertialRadiusOffset = 0;

  if ("inertialPanningX" in camera) camera.inertialPanningX = 0;
  if ("inertialPanningY" in camera) camera.inertialPanningY = 0;

  // stop eventuali animazioni vecchie sulla camera
  scene.stopAnimation(camera);

  const target = config.target?.clone ? config.target.clone() : config.target;

  // applicazione istantanea
  if (immediate) {
    camera.lowerRadiusLimit = null;
    camera.upperRadiusLimit = null;

    if (target) camera.setTarget(target);
    if (typeof config.alpha === "number") camera.alpha = config.alpha;
    if (typeof config.beta === "number") camera.beta = config.beta;

    if (typeof config.radius === "number") {
      camera.radius = config.radius;
      camera.lowerRadiusLimit = 1.15;
      camera.upperRadiusLimit = Math.max(7,config.radius*1.8);
    }

    camera.inertialAlphaOffset = 0;
    camera.inertialBetaOffset = 0;
    camera.inertialRadiusOffset = 0;

    if ("inertialPanningX" in camera) camera.inertialPanningX = 0;
    if ("inertialPanningY" in camera) camera.inertialPanningY = 0;

    return;
  }

  // sblocca temporaneamente il radius per consentire l'animazione
  camera.lowerRadiusLimit = null;
  camera.upperRadiusLimit = null;

  const easing = new BABYLON.CubicEase();
  easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);

  if (typeof config.alpha === "number") {
    BABYLON.Animation.CreateAndStartAnimation(
      "wdCamAlpha",
      camera,
      "alpha",
      fps,
      durationFrames,
      camera.alpha,
      config.alpha,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
      easing
    );
  }

  if (typeof config.beta === "number") {
    BABYLON.Animation.CreateAndStartAnimation(
      "wdCamBeta",
      camera,
      "beta",
      fps,
      durationFrames,
      camera.beta,
      config.beta,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
      easing
    );
  }

  if (typeof config.radius === "number") {
    BABYLON.Animation.CreateAndStartAnimation(
      "wdCamRadius",
      camera,
      "radius",
      fps,
      durationFrames,
      camera.radius,
      config.radius,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
      easing
    );
  }

  if (target) {
    BABYLON.Animation.CreateAndStartAnimation(
      "wdCamTarget",
      camera,
      "target",
      fps,
      durationFrames,
      camera.target.clone(),
      target,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
      easing
    );
  }

  // a fine animazione riblocca il radius e pulisce i residui
  setTimeout(() => {
    if (typeof config.radius === "number") {
      camera.radius = config.radius;
      camera.lowerRadiusLimit = 1.15;
      camera.upperRadiusLimit = Math.max(7,config.radius*1.8);
    }

    camera.inertialAlphaOffset = 0;
    camera.inertialBetaOffset = 0;
    camera.inertialRadiusOffset = 0;

    if ("inertialPanningX" in camera) camera.inertialPanningX = 0;
    if ("inertialPanningY" in camera) camera.inertialPanningY = 0;
  }, (durationFrames / fps) * 1000 + 30);
}

function getFocusTarget(area, bounds) {
  const center = bounds?.center || BABYLON.Vector3.Zero();

  switch (area) {
    case "model":
      return {
        // VISTA GENERALE APPROVATA
        alpha: 2.20,
        beta: 1.05,
        target: new BABYLON.Vector3(
          center.x,
          center.y + 0.1,
          center.z
        ),
        radius: 2.4
      };

    case "brand":
      return {
        // STESSA FAMIGLIA DEL MODELLO,
        // ma con leggero focus verso il logo Honda
        alpha: 2.70,
        beta: 1.4,
        target: new BABYLON.Vector3(
          center.x,
          center.y + 0.1,
          center.z
        ),
        radius: 2.35
      };

    case "materials":
      return {
        // per ora neutra e vicina al modello
        alpha: 2.20,
        beta: 1.1,
        target: new BABYLON.Vector3(
          center.x + 0.2,
          center.y + 0.,
          center.z
        ),
        radius: 2.1
      };

    case "summary":
      return {
        alpha: 2.20,
        beta: 1.05,
        target: new BABYLON.Vector3(
          center.x,
          center.y + 0.1,
          center.z
        ),
        radius: 2.4
      };

    default:
      return {
        alpha: 2.20,
        beta: 1.00,
        target: new BABYLON.Vector3(
          center.x,
          center.y + 0.22,
          center.z
        ),
        radius: 2.35
      };
  }
}

 function focusCameraToArea(scene, camera, area, options = {}) {
  if (!scene || !camera) return;

  const bounds = scene.__wdCurrentBounds;
  const focus = getFocusTarget(area, bounds);
  scene.__wdActiveArea=area;
  // Demo-only responsive framing: retain the source angles; avoid clipping on narrow canvases.
  const engine=scene.getEngine(),aspect=engine.getRenderWidth()/Math.max(1,engine.getRenderHeight());
  if(aspect<1.3){focus.radius*=1.3/Math.max(aspect,.5);if(bounds?.center)focus.target.x=bounds.center.x;}

  focusCameraSmooth(scene, camera, focus, options);
}

  async function loadGLB(scene, camera, modelState, glbUrl, opts = {}) {
    const url = new URL(glbUrl, window.location.href).href;
    const result = await BABYLON.SceneLoader.ImportMeshAsync(null, "", url, scene);
    if(opts.isCurrent&&!opts.isCurrent()){
      (result.meshes||[]).forEach(mesh=>mesh.dispose(false,true));
      (result.transformNodes||[]).forEach(node=>node.dispose());
      return null;
    }
    const importedMeshes = getImportedRenderableMeshes(result);

    importedMeshes.forEach((m) => {
      try { m.setEnabled(true); } catch {}
      m.isVisible = true;
      m.visibility = 1;

      if (m.material && typeof m.material.alpha !== "undefined") {
        m.material.alpha = 1;
      }
    });

    const normalized = normalizeModelPose(scene, importedMeshes, {
      targetSize: opts.targetSize || NORMALIZE.targetSize,
      rootName: "wdRoot_next"
    });

    const nextState = {
      rootNodes: result.rootNodes || [],
      meshesByName: new Map()
    };

    importedMeshes.forEach((m) => {
      if (m?.name) nextState.meshesByName.set(m.name, m);
    });

    const importedMaterials=new Set(importedMeshes.map(mesh=>mesh.material).filter(Boolean));
    tuneLoadedModelMaterials(nextState);
    // Both source GLBs contain zero embedded textures. Each visible mesh now owns a clone.
    // Release original unreferenced imported materials; data-map cache is managed separately.
    for(const material of importedMaterials){
      if(!scene.meshes.some(mesh=>mesh.material===material))material.dispose(false,false);
    }
    disposeModelNodes(scene, modelState);

    if (normalized?.root) {
      normalized.root.name = "wdRoot";
      modelState.rootNodes = [...(nextState.rootNodes || []), normalized.root];
    } else {
      modelState.rootNodes = [...(nextState.rootNodes || [])];
    }

    modelState.meshesByName = nextState.meshesByName;

    const bounds = normalized?.bounds || computeBoundsFromMeshes(importedMeshes);
scene.__wdCurrentBounds = bounds;

focusCameraToArea(scene, camera, "model",{immediate:true});

    const wantContactShadow = opts.enableContactShadow !== false;
    if (wantContactShadow && bounds) {
      const groundY = bounds.min.y + 0.002;
      const approxSize = Math.max(bounds.size.length() * 0.65, 0.4);
      window.WDFx.ensureContactShadow(scene, bounds.center, groundY, approxSize);
    }

    const wantSSAO = opts.enableSSAO !== false;
    if (wantSSAO && !scene.__wdSSAOEnabled) {
      const ok = window.WDFx.enableSSAO2(scene.getEngine(), scene, camera);
      scene.__wdSSAOEnabled = ok;
    }

    return { url, bounds, result };
  }

  function ensureUniqueMaterial(mesh) {
    if (!mesh || !mesh.material) return;
    if (mesh.material.__wdCloned) return;

    const cloned = mesh.material.clone(mesh.material.name + "__wd");
    cloned.__wdCloned = true;
    mesh.material = cloned;
  }

  function tuneMaterialForSeatPart(mesh, role = "generic") {
    if (!mesh || !mesh.material) return;

    ensureUniqueMaterial(mesh);
    const mat = mesh.material;

    if ("metallic" in mat) mat.metallic = 0.0;
    if ("roughness" in mat) mat.roughness = 0.72;
    if ("environmentIntensity" in mat) mat.environmentIntensity = 1.0;
    if ("specularIntensity" in mat) mat.specularIntensity = 0.6;

    switch (role) {
      case "seat":
        if ("roughness" in mat) mat.roughness = 0.66;
        break;
      case "border":
        if ("roughness" in mat) mat.roughness = 0.72;
        if ("environmentIntensity" in mat) mat.environmentIntensity = 0.96;
        break;
      case "ribs":
        if ("roughness" in mat) mat.roughness = 0.78;
        if ("environmentIntensity" in mat) mat.environmentIntensity = 0.9;
        break;
      case "logo":
        if ("roughness" in mat) mat.roughness = 0.5;
        break;
      case "brandLogo":
        if ("roughness" in mat) mat.roughness = 0.42;
        if ("environmentIntensity" in mat) mat.environmentIntensity = 1.1;
        break;
    }

    if ("clearCoat" in mat && mat.clearCoat) {
      mat.clearCoat.isEnabled = role === "logo" || role === "brandLogo";

      if (mat.clearCoat.isEnabled) {
        mat.clearCoat.intensity = role === "brandLogo" ? 0.18 : 0.10;
        mat.clearCoat.roughness = role === "brandLogo" ? 0.35 : 0.40;
      }
    }

    if (typeof mat.markAsDirty === "function") {
      mat.markAsDirty(BABYLON.Material.AllDirtyFlag);
    }
  }

  function getSeatPartRoleByMeshName(name) {
    if (!name) return "generic";
    if (name === "seat_top") return "seat";
    if (name === "seat_base") return "border";
    if (name === "wd_logo") return "logo";
    if (name.startsWith("logo_")) return "brandLogo";
    if (
      name === "seat_rib_upper" ||
      name === "seat_rib_lower" ||
      /^seat_rib_upper_\d+$/.test(name)
    ) {
      return "ribs";
    }
    return "generic";
  }

  function tuneLoadedModelMaterials(modelState) {
    const byName = modelState?.meshesByName;
    if (!byName) return;

    for (const [name, mesh] of byName.entries()) {
      tuneMaterialForSeatPart(mesh, getSeatPartRoleByMeshName(name));
    }
  }

  function applyColorToMeshes(meshesByName, meshNames, hexColor) {
    const col3 = BABYLON.Color3.FromHexString(hexColor);

    meshNames.forEach((name) => {
      const mesh = meshesByName.get(name);
      if (!mesh) return;

      ensureUniqueMaterial(mesh);

      if (mesh.material && ("albedoColor" in mesh.material)) {
        mesh.material.albedoColor = col3;
      } else if (mesh.material && ("diffuseColor" in mesh.material)) {
        mesh.material.diffuseColor = col3;
      }

      tuneMaterialForSeatPart(mesh, getSeatPartRoleByMeshName(name));
    });
  }

  function getTextureFromCache(scene, mapDef) {
    if (!mapDef || !mapDef.file) return null;

    const url = new URL(mapDef.file, window.location.href).href;
    const invertY = mapDef.invertY === true;
    const uScale = Number(mapDef.uScale || 1);
    const vScale = Number(mapDef.vScale || 1);
    const level = Number(mapDef.level || 1);
    const cacheKey = `${url}__invertY_${invertY}__u_${uScale}__v_${vScale}__lvl_${level}`;

    if (textureCache.has(cacheKey)) {
      return textureCache.get(cacheKey);
    }

    const tex = new BABYLON.Texture(
      url,
      scene,
      false,
      invertY,
      BABYLON.Texture.TRILINEAR_SAMPLINGMODE
    );

    tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
    tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
    tex.uScale = uScale;
    tex.vScale = vScale;
    tex.level = level;
    // Both normal and roughness are linear data maps, never sRGB color images.
    tex.gammaSpace = false;
    tex.__wdUrl=url;
    tex.__wdError=null;
    tex.onErrorObservable?.addOnce(()=>{tex.__wdError=new Error('Texture non caricata: '+mapDef.file);textureCache.delete(cacheKey);});

    textureCache.set(cacheKey, tex);
    return tex;
  }

  function waitTextureReady(tex) {
    return new Promise((resolve,reject) => {
      if (!tex) return reject(new Error('Texture richiesta mancante'));
      if(tex.__wdError)return reject(tex.__wdError);

      try {
        if (typeof tex.isReady === "function" && tex.isReady()) {
          resolve();
          return;
        }
      } catch {}

      let done = false;
      let timer;
      const finish = (error) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        if(error){for(const [key,value] of textureCache)if(value===tex)textureCache.delete(key);tex.dispose();reject(error);}else resolve();
      };

      try { tex.onLoadObservable?.addOnce(()=>finish()); } catch {}
      try { tex.onErrorObservable?.addOnce(()=>finish(new Error('Texture non caricata: '+tex.__wdUrl))); } catch {}
      timer=setTimeout(()=>finish(new Error('Timeout texture: '+tex.__wdUrl)),15000);
    });
  }

  async function preloadMapLibrary(scene, mapLibrary) {
    const defs = Object.values(mapLibrary || {}).filter((d) => d && d.file);
    const textures = defs.map((def) => getTextureFromCache(scene, def)).filter(Boolean);
    await Promise.all(textures.map(waitTextureReady));
  }

  function releaseUnusedTextures(meshesByName){
    const active=new Set();
    for(const mesh of meshesByName.values()){
      const material=mesh.material;
      if(material?.bumpTexture)active.add(material.bumpTexture);
      if(material?.metallicTexture)active.add(material.metallicTexture);
    }
    let released=0;
    for(const [key,texture] of textureCache){
      // Pending requests keep their texture until their own completion/error handler.
      if(!active.has(texture)&&texture.isReady()){
        textureCache.delete(key);texture.dispose();released++;
      }
    }
    return released;
  }

  function clearNormalMapFromMaterial(material) {
    if (!material) return;

    if ("bumpTexture" in material) material.bumpTexture = null;
    if ("invertNormalMapX" in material) material.invertNormalMapX = false;
    if ("invertNormalMapY" in material) material.invertNormalMapY = false;

    if (typeof material.markAsDirty === "function") {
      material.markAsDirty(BABYLON.Material.TextureDirtyFlag);
    }
  }

  function clearRoughnessMapFromMaterial(material) {
    if (!material) return;

    if ("metallicTexture" in material) material.metallicTexture = null;
    if ("useRoughnessFromMetallicTextureGreen" in material) material.useRoughnessFromMetallicTextureGreen = false;
    if ("useRoughnessFromMetallicTextureAlpha" in material) material.useRoughnessFromMetallicTextureAlpha = false;
    if ("useMetallnessFromMetallicTextureBlue" in material) material.useMetallnessFromMetallicTextureBlue = false;

    if (typeof material.markAsDirty === "function") {
      material.markAsDirty(BABYLON.Material.TextureDirtyFlag);
    }
  }

  function applyRoughnessMapToMeshes(scene, meshesByName, meshNames, mapDef) {
    meshNames.forEach((name) => {
      const mesh = meshesByName.get(name);
      if (!mesh || !mesh.material) return;

      ensureUniqueMaterial(mesh);
      const material = mesh.material;

      if (!("metallicTexture" in material)) return;

      if (!mapDef || !mapDef.file) {
        clearRoughnessMapFromMaterial(material);
        return;
      }

      const tex = getTextureFromCache(scene, mapDef);
      if (!tex) {
        clearRoughnessMapFromMaterial(material);
        return;
      }

      material.metallicTexture = tex;
      material.metallicTexture.gammaSpace = false;
      material.metallicTexture.level = 1;
      material.metallicTexture.uScale = Number(mapDef.uScale || 1);
      material.metallicTexture.vScale = Number(mapDef.vScale || 1);

      if ("useRoughnessFromMetallicTextureGreen" in material) {
        material.useRoughnessFromMetallicTextureGreen = true;
      }
      if ("useRoughnessFromMetallicTextureAlpha" in material) {
        material.useRoughnessFromMetallicTextureAlpha = false;
      }
      if ("useMetallnessFromMetallicTextureBlue" in material) {
        material.useMetallnessFromMetallicTextureBlue = false;
      }

      if ("metallic" in material) material.metallic = 0.0;
      if ("roughness" in material) material.roughness = 1.0;

      if (typeof material.markAsDirty === "function") {
        material.markAsDirty(BABYLON.Material.TextureDirtyFlag);
      }
    });
  }

  function applyNormalMapToMeshes(scene, meshesByName, meshNames, mapDef) {
    meshNames.forEach((name) => {
      const mesh = meshesByName.get(name);
      if (!mesh || !mesh.material) return;

      ensureUniqueMaterial(mesh);
      const material = mesh.material;

      if (!("bumpTexture" in material)) return;

      if (!mapDef || !mapDef.file) {
        clearNormalMapFromMaterial(material);
        tuneMaterialForSeatPart(mesh, getSeatPartRoleByMeshName(name));
        return;
      }

      const tex = getTextureFromCache(scene, mapDef);
      if (!tex) {
        clearNormalMapFromMaterial(material);
        return;
      }

      material.bumpTexture = tex;
      material.bumpTexture.level = Number(mapDef.level || 1);
      material.bumpTexture.uScale = Number(mapDef.uScale || 1);
      material.bumpTexture.vScale = Number(mapDef.vScale || 1);

      if ("invertNormalMapX" in material) {
        material.invertNormalMapX = mapDef.invertX === true;
      }
      if ("invertNormalMapY" in material) {
        material.invertNormalMapY = mapDef.invertY === true;
      }

      if (typeof material.markAsDirty === "function") {
        material.markAsDirty(BABYLON.Material.TextureDirtyFlag);
      }

      tuneMaterialForSeatPart(mesh, getSeatPartRoleByMeshName(name));
    });
  }

  return {
    createEngine,
    createScene,
    loadGLB,
    focusCameraToArea,
    moveCamera,
    setUserInteractionEnabled,
    setAutoRotateEnabled,
    pauseAutoRotate,
    applyColorToMeshes,
    applyNormalMapToMeshes,
    applyRoughnessMapToMeshes,
    preloadMapLibrary,
    releaseUnusedTextures,
    tuneLoadedModelMaterials,
    tuneMaterialForSeatPart
  };
})();
