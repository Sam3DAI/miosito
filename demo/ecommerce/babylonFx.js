// babylonFx.js (UMD) - helper per resa "studio"
window.WDFx = (function () {
  function applyStudioEnvironment(scene, opts = {}) {
    const {
      environmentUrl = "./assets/env/environmentSpecular.env",
      envIntensity = 1.5,
      exposure = 1.0,
      contrast = 1.02,
      clearColor = [0.98, 0.98, 0.98, 1]
    } = opts;

    scene.clearColor = new BABYLON.Color4(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);

    scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(environmentUrl, scene);
    scene.environmentIntensity = envIntensity;

    const ip = scene.imageProcessingConfiguration;
    ip.exposure = exposure;
    ip.contrast = contrast;

    // Tone mapping più "fotografico"
    ip.toneMappingEnabled = true;
    ip.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
  }

  function createStudioLights(scene, opts = {}) {
    const {
      keyIntensity = 1.4,
      fillIntensity = 0.45,
      rimIntensity = 0.25
    } = opts;

    const key = new BABYLON.DirectionalLight("key", new BABYLON.Vector3(-0.5, -1.0, -0.3), scene);
    key.position = new BABYLON.Vector3(4, 8, 5);
    key.intensity = keyIntensity;

    const fill = new BABYLON.DirectionalLight("fill", new BABYLON.Vector3(0.8, -1.0, 0.4), scene);
    fill.position = new BABYLON.Vector3(-5, 8, -3);
    fill.intensity = fillIntensity;

    const rim = new BABYLON.DirectionalLight("rim", new BABYLON.Vector3(0.3, -1.0, -1.0), scene);
    rim.position = new BABYLON.Vector3(-2, 9, 12);
    rim.intensity = rimIntensity;

    return { key, fill, rim };
  }

  function computeSceneBounds(scene) {
    const meshes = scene.meshes.filter(m => {
      if (!m) return false;
      if (!m.getTotalVertices || m.getTotalVertices() <= 0) return false;
      if (!m.isEnabled || !m.isEnabled()) return false;

      const name = m.name || "";
      if (name === "contactShadow") return false;

      return true;
    });
    if (!meshes.length) return null;

    let min = new BABYLON.Vector3(Infinity, Infinity, Infinity);
    let max = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity);

    meshes.forEach(m => {
      m.computeWorldMatrix(true);
      const bi = m.getBoundingInfo?.();
      if (!bi) return;
      const bmin = bi.boundingBox.minimumWorld;
      const bmax = bi.boundingBox.maximumWorld;
      min = BABYLON.Vector3.Minimize(min, bmin);
      max = BABYLON.Vector3.Maximize(max, bmax);
    });

    const center = min.add(max).scale(0.5);
    const size = max.subtract(min);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;

    return { min, max, center, size, maxDim };
  }

  function frameArcCamera(camera, bounds) {
    if (!bounds) return;

    // Se la camera ha framing behavior, usalo
    camera.useFramingBehavior = true;
    const fb = camera.getBehaviorByName?.("Framing");
    if (fb) {
      fb.framingTime = 0;
      fb.elevationReturnTime = -1;
      fb.radiusScale = 1.0;
      fb.zoomOnBoundingInfo(bounds.min, bounds.max);
    } else {
      // fallback
      const radius = bounds.size.length() * 0.65 || 2;
      camera.setTarget(bounds.center);
      camera.radius = Math.max(radius, 1.5);
    }

    // Protezioni camera
    camera.setTarget(bounds.center);
    camera.minZ = 0.01;
    camera.maxZ = Math.max(camera.radius * 20, 50);
    camera.lowerRadiusLimit = camera.radius * 0.75;
    camera.upperRadiusLimit = camera.radius * 1.8;
    camera.lowerBetaLimit = 0.22;
    camera.upperBetaLimit = Math.PI / 2 - 0.06;
  }

  function ensureContactShadow(scene, center, groundY, approxSize) {
  const old = scene.getMeshByName("contactShadow");
  if (old) {
    try { old.dispose(false, true); } catch {}
  }

  const oldMat = scene.getMaterialByName("contactShadowMat");
  if (oldMat) {
    try { oldMat.dispose(); } catch {}
  }

  const texRes = 1024;
  const dynTex = new BABYLON.DynamicTexture(
    "contactShadowTex",
    { width: texRes, height: texRes },
    scene,
    true
  );

  const ctx = dynTex.getContext();
  ctx.clearRect(0, 0, texRes, texRes);

  const cx = texRes / 2;
  const cy = texRes / 2;

  // Ombra principale: più ampia e morbida
  const grdMain = ctx.createRadialGradient(
    cx, cy, texRes * 0.08,
    cx, cy, texRes * 0.48
  );
  grdMain.addColorStop(0.00, "rgba(0,0,0,0.30)");
  grdMain.addColorStop(0.35, "rgba(0,0,0,0.18)");
  grdMain.addColorStop(0.72, "rgba(0,0,0,0.08)");
  grdMain.addColorStop(1.00, "rgba(0,0,0,0.00)");

  ctx.fillStyle = grdMain;
  ctx.beginPath();
  ctx.arc(cx, cy, texRes * 0.48, 0, Math.PI * 2);
  ctx.fill();

  // Nucleo leggermente più marcato al centro
  const grdCore = ctx.createRadialGradient(
    cx, cy, texRes * 0.02,
    cx, cy, texRes * 0.22
  );
  grdCore.addColorStop(0.00, "rgba(0,0,0,0.16)");
  grdCore.addColorStop(0.60, "rgba(0,0,0,0.07)");
  grdCore.addColorStop(1.00, "rgba(0,0,0,0.00)");

  ctx.fillStyle = grdCore;
  ctx.beginPath();
  ctx.arc(cx, cy, texRes * 0.24, 0, Math.PI * 2);
  ctx.fill();

  dynTex.update();

  const shadowMat = new BABYLON.StandardMaterial("contactShadowMat", scene);
  shadowMat.disableLighting = true;
  shadowMat.backFaceCulling = false;
  shadowMat.diffuseTexture = dynTex;
  shadowMat.opacityTexture = dynTex;
  shadowMat.useAlphaFromDiffuseTexture = true;
  shadowMat.alpha = 0.95;
  shadowMat.specularColor = new BABYLON.Color3(0, 0, 0);
  shadowMat.zOffset = -2;

  // Più grande di prima
  const radius = Math.max(0.32, approxSize * 0.56);

  const disk = BABYLON.MeshBuilder.CreateDisc(
    "contactShadow",
    { radius, tessellation: 96 },
    scene
  );

  disk.rotation.x = Math.PI / 2;
  disk.position = new BABYLON.Vector3(center.x, groundY, center.z);

  // Leggera ovalizzazione: più credibile sotto una sella
  disk.scaling.x = 0.45;
  disk.scaling.y = 1.32;
  disk.material = shadowMat;
  disk.isPickable = false;
  disk.renderingGroupId = 0;
}

  function enableSSAO2(engine, scene, camera) {
    if (!BABYLON.SSAO2RenderingPipeline) return false;

    const caps = engine.getCaps();
    const canSSAO = (caps.supportDepthTexture || caps.webGL2);
    if (!canSSAO) return false;

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
    const ssaoRatio = isMobile ? 0.75 : 1.0;
    const blurRatio = 0.5;

    const ssao = new BABYLON.SSAO2RenderingPipeline("wdSSAO", scene, { ssaoRatio, blurRatio });

    ssao.radius = isMobile ? 1.3 : 1.8;
    ssao.totalStrength = isMobile ? 1.0 : 1.15;
    ssao.base = 0.12;
    ssao.samples = isMobile ? 12 : 16;
    ssao.maxZ = camera.maxZ;

    scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("wdSSAO", camera);

    // Watchdog FPS: se <30 fps per 2s, spegne SSAO per non laggare
    let low = 0;
    const step = 400;
    const obs = scene.onBeforeRenderObservable.add(() => {
      const fps = engine.getFps();
      low = fps < 30 ? low + step : 0;
      if (low >= 2000) {
        try {
          scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline("wdSSAO", camera);
          ssao.dispose();
        } catch {}
        scene.onBeforeRenderObservable.remove(obs);
      }
    });

    return true;
  }

  return {
    applyStudioEnvironment,
    createStudioLights,
    computeSceneBounds,
    frameArcCamera,
    ensureContactShadow,
    enableSSAO2
  };
})();
