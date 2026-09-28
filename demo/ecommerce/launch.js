// No heavy initial imports. URL flags cannot activate the engine.
(() => {
  'use strict';
  const gate = window.WD48Availability;
  const panel = document.querySelector('#demoPreview'), app = document.querySelector('.app-shell');
  const start = document.querySelector('#demoStart'), note = document.querySelector('#demoAvailability');
  const status = document.querySelector('#demoStatus');
  let activated = false, loaded = false, failed = false, dependenciesReady = false;
  function paint() {
    const allowed = gate.allowed();
    document.documentElement.dataset.available = String(allowed);
    panel.hidden = allowed && activated && loaded && !failed;
    app.hidden = !panel.hidden;
    start.hidden = !allowed || (activated && !failed);
    start.disabled = activated && !failed;
    note.textContent = !allowed ? 'Esplora la demo interattiva da computer o tablet. Possiamo mostrarti come applicare il configuratore ai tuoi prodotti.' : failed ? 'La demo non è disponibile in questo browser. Puoi riprovare oppure richiedere una presentazione.' : activated ? 'Caricamento della demo…' : 'Due modelli autentici, materiali e prezzi esemplificativi. Avvia quando vuoi.';
  }
  const load = src => new Promise((resolve, reject) => {
    const script = document.createElement('script'); script.src = src;
    script.onload = resolve; script.onerror = () => { script.remove(); reject(new Error('Risorsa demo non disponibile: ' + src)); };
    document.head.append(script);
  });
  async function activate() {
    if (!gate.allowed() || (activated && !failed)) return;
    if (failed) {
      if (!dependenciesReady) { location.reload(); return; }
      failed = false; paint(); document.querySelector('#demoRetry').click(); return;
    }
    activated = true; paint(); status.textContent = 'Caricamento del configuratore e del primo modello…';
    try {
      for (const src of ['./vendor/babylon.js','./vendor/babylonjs.loaders.min.js','./babylonFx.js','./camera-controller.js','./babylonScene.js','./materialResolver.js','./modelCatalogLoader.js','./startupPreloader.js']) {
        await gate.wait(); await load(src);
      }
      await gate.wait(); await import('./app.js'); dependenciesReady = true;
    } catch (error) {
      failed = true; status.textContent = error.message; paint(); window.WD46Display?.error();
    }
  }
  start.addEventListener('click', activate);
  document.addEventListener('wd48-ready', () => { loaded = true; failed = false; paint(); });
  document.addEventListener('wd48-error', () => { failed = true; start.textContent = 'Riprova caricamento'; paint(); });
  window.addEventListener('message', event => {
    if (window.parent === window || event.source !== window.parent || event.origin !== location.origin) return;
    if (event.data && Object.keys(event.data).length === 1 && event.data.type === 'solvex-wd48-start') activate();
  });
  gate.subscribe(paint); paint();
})();
