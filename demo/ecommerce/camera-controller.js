// Responsive presentation camera. The controls remain attached throughout guided moves.
(function () {
  const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const vector = value => ({x: finite(value?.x, 0), y: finite(value?.y, 0), z: finite(value?.z, 0)});
  const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function fitRadius({bounds, target, alpha, beta, fov, aspect, horizontalFov = false, inset = 0.9}) {
    if (!bounds?.min || !bounds?.max) return 1;
    const aim = vector(target), safeAspect = Math.max(0.05, finite(aspect, 1));
    const half = Math.tan(clamp(finite(fov, 0.58), 0.05, 2.8) / 2);
    const tangentY = horizontalFov ? half / safeAspect : half;
    const tangentX = horizontalFov ? half : half * safeAspect;
    const sa = Math.sin(alpha), ca = Math.cos(alpha), sb = Math.sin(beta), cb = Math.cos(beta);
    const towardsCamera = {x: ca * sb, y: cb, z: sa * sb};
    const right = {x: sa, y: 0, z: -ca};
    const up = {x: -ca * cb, y: sb, z: -sa * cb};
    let radius = 0.1;
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
      const p = {x: x - aim.x, y: y - aim.y, z: z - aim.z}, depth = dot(p, towardsCamera);
      radius = Math.max(radius, depth + Math.abs(dot(p, right)) / (tangentX * inset), depth + Math.abs(dot(p, up)) / (tangentY * inset), depth + 0.05);
    }
    return radius;
  }

  function create({scene, camera, canvas, engine, requestFrame = requestAnimationFrame, cancelFrame = cancelAnimationFrame, now = () => performance.now(), reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches}) {
    let frame = null, generation = 0, disposed = false;
    const dimensions = () => ({width: Math.max(1, engine.getRenderWidth()), height: Math.max(1, engine.getRenderHeight())});
    let measured = dimensions(), lastAspect = measured.width / measured.height;
    const radiusFor = (config, aspect = lastAspect) => fitRadius({bounds: scene.__wdCurrentBounds, target: config.target, alpha: config.alpha, beta: config.beta, fov: camera.fov, aspect, horizontalFov: camera.fovMode === 1});
    function publish(reason = canvas.dataset.cameraReason || 'ready') {
      const values = {alpha: camera.alpha, beta: camera.beta, radius: camera.radius, targetX: camera.target.x, targetY: camera.target.y, targetZ: camera.target.z};
      for (const [key, value] of Object.entries(values)) canvas.dataset['camera' + key[0].toUpperCase() + key.slice(1)] = Number(value).toFixed(6);
      canvas.dataset.cameraAnimating = String(frame !== null);
      canvas.dataset.cameraFitRadius = radiusFor(camera).toFixed(6);
      canvas.dataset.cameraRenderWidth = String(measured.width);
      canvas.dataset.cameraRenderHeight = String(measured.height);
      canvas.dataset.cameraReason = reason;
    }
    function stop(reason = 'interrupted') {
      generation++;
      if (frame !== null) cancelFrame(frame);
      frame = null;
      scene.stopAnimation(camera);
      publish(reason);
    }
    function clearInertia() {
      for (const key of ['inertialAlphaOffset', 'inertialBetaOffset', 'inertialRadiusOffset', 'inertialPanningX', 'inertialPanningY']) if (key in camera) camera[key] = 0;
    }
    function limits(radius) {
      camera.lowerRadiusLimit = 0.45;
      camera.upperRadiusLimit = Math.max(7, radius * 3);
      camera.lowerAlphaLimit = null;
      camera.upperAlphaLimit = null;
      camera.lowerBetaLimit = 0.25;
      camera.upperBetaLimit = Math.PI / 2 - 0.04;
    }
    function set(config) {
      camera.alpha = config.alpha;
      camera.beta = config.beta;
      camera.radius = config.radius;
      camera.target.copyFromFloats(config.target.x, config.target.y, config.target.z);
    }
    function focus(config, options = {}) {
      if (disposed || !scene.__wdCurrentBounds) return;
      stop('guided');
      clearInertia();
      const next = {alpha: finite(config.alpha, camera.alpha), beta: finite(config.beta, camera.beta), radius: finite(config.radius, camera.radius), target: vector(config.target || camera.target)};
      next.radius = Math.max(next.radius, radiusFor(next));
      limits(next.radius);
      if (options.immediate || reducedMotion()) {set(next); publish(options.immediate ? 'initial-fit' : 'reduced-motion'); return;}
      const token = generation, start = now(), duration = Math.max(1, finite(options.durationMs, finite(options.durationFrames, 26) / finite(options.fps, 60) * 1000));
      const from = {alpha: camera.alpha, beta: camera.beta, radius: camera.radius, target: vector(camera.target)};
      const yawDelta = Math.atan2(Math.sin(next.alpha - from.alpha), Math.cos(next.alpha - from.alpha));
      function tick() {
        if (disposed || token !== generation) return;
        const progress = clamp((now() - start) / duration, 0, 1), eased = progress * progress * (3 - 2 * progress);
        const lerp = (a, b) => a + (b - a) * eased;
        set({alpha: from.alpha + yawDelta * eased, beta: lerp(from.beta, next.beta), radius: lerp(from.radius, next.radius), target: {x: lerp(from.target.x, next.target.x), y: lerp(from.target.y, next.target.y), z: lerp(from.target.z, next.target.z)}});
        frame = progress < 1 ? requestFrame(tick) : null;
        publish(progress < 1 ? 'guided' : 'guided-complete');
      }
      frame = requestFrame(tick);
      publish('guided');
    }
    function resize() {
      if (disposed) return;
      // Compare the same voluntarily selected orientation against old/new aspect ratios.
      // The ratio retains intentional user zoom, including a deliberate close-up.
      const previousFit = radiusFor(camera, lastAspect), ratio = camera.radius / previousFit;
      engine.resize();
      const next = dimensions(), nextAspect = next.width / next.height;
      if (next.width === measured.width && next.height === measured.height) return;
      measured = next;
      if (scene.__wdCurrentBounds && Math.abs(nextAspect - lastAspect) > 0.0001) {
        stop('resize');
        const nextFit = radiusFor(camera, nextAspect);
        limits(nextFit);
        camera.radius = clamp(nextFit * ratio, camera.lowerRadiusLimit, camera.upperRadiusLimit);
      }
      lastAspect = nextAspect;
      publish('resize');
    }
    function userIntent() {stop('user');}
    const eventNames = ['pointerdown', 'wheel', 'touchstart'];
    eventNames.forEach(name => canvas.addEventListener(name, userIntent, {passive: true, capture: true}));
    const keydown = event => {
      if (event.target !== canvas) return;
      const actions = {ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', '+': 'in', '=': 'in', '-': 'out', '_': 'out'};
      const action = actions[event.key];
      if (!action || event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      userIntent();
      clearInertia();
      if (action === 'left') camera.alpha -= 0.16;
      if (action === 'right') camera.alpha += 0.16;
      if (action === 'up') camera.beta = Math.max(camera.lowerBetaLimit, camera.beta - 0.08);
      if (action === 'down') camera.beta = Math.min(camera.upperBetaLimit, camera.beta + 0.08);
      if (action === 'in') camera.radius = Math.max(camera.lowerRadiusLimit, camera.radius * 0.9);
      if (action === 'out') camera.radius = Math.min(camera.upperRadiusLimit, camera.radius / 0.9);
      publish('keyboard');
    };
    canvas.addEventListener('keydown', keydown, true);
    // Prevent Babylon's keyboard handler duplicating the same canvas-only actions.
    const keyboard = camera.inputs?.attached?.keyboard;
    if (keyboard) {keyboard.keysUp = []; keyboard.keysDown = []; keyboard.keysLeft = []; keyboard.keysRight = [];}
    function dispose() {
      if (disposed) return;
      stop('disposed'); disposed = true;
      eventNames.forEach(name => canvas.removeEventListener(name, userIntent, true));
      canvas.removeEventListener('keydown', keydown, true);
    }
    publish('ready');
    return Object.freeze({focus, stop, resize, publish, dispose});
  }
  window.WDCamera47 = Object.freeze({fitRadius, create});
})();
