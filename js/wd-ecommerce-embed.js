// No iframe, bundle, model or texture is requested until an explicit activation.
(() => {
  'use strict';
  const hosts = document.querySelectorAll('[data-wd46-embed]');
  for (const host of hosts) {
    const start = host.querySelector('[data-wd46-start]');
    const poster = host.querySelector('[data-wd46-poster]');
    const status = host.querySelector('[data-wd46-status]');
    const stage = host.querySelector('[data-wd46-stage]');
    if (!start || !poster || !status || !stage) continue;
    let frame = null;
    let timeout = null;
    let visible = true;
    let ready = false;
    let focusOnReady = false;
    const theme = () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    const control = () => {
      if (!frame?.contentWindow) return;
      frame.contentWindow.postMessage({ type: 'solvex-wd46-control', theme: theme(), visible: visible && !document.hidden }, location.origin);
    };
    const fail = () => {
      clearTimeout(timeout);
      ready = false;
      focusOnReady = false;
      host.dataset.state = 'error';
      host.setAttribute('aria-busy', 'false');
      status.textContent = 'La demo non è stata caricata. Puoi riprovare oppure aprirla in una pagina dedicata.';
      start.hidden = false;
      start.disabled = false;
      start.textContent = 'Riprova ad avviare la demo';
    };
    start.addEventListener('click', () => {
      if (frame && ready) return;
      // Disabling the focused trigger may move native focus to BODY.
      focusOnReady = document.activeElement === start;
      frame?.remove();
      frame = document.createElement('iframe');
      frame.title = 'WDRacing: configuratore di selle con prezzi esemplificativi';
      frame.setAttribute('sandbox', 'allow-scripts allow-same-origin');
      frame.setAttribute('referrerpolicy', 'no-referrer');
      frame.src = '/demo/ecommerce/?embed=1&theme=' + theme();
      const requestedFrame = frame;
      frame.addEventListener('load', () => { if (frame === requestedFrame) control(); });
      frame.addEventListener('error', () => { if (frame === requestedFrame) fail(); });
      ready = false;
      host.dataset.state = 'loading';
      host.setAttribute('aria-busy', 'true');
      status.textContent = 'Caricamento del configuratore e del primo modello…';
      start.disabled = true;
      stage.replaceChildren(frame);
      stage.hidden = false;
      poster.hidden = true;
      clearTimeout(timeout);
      timeout = setTimeout(fail, 45000);
    });
    document.addEventListener('focusin', event => {
      // Preserve a later focus choice, even if that control then blurs to BODY.
      if (focusOnReady && event.target !== start && event.target !== document.body) focusOnReady = false;
    });
    window.addEventListener('message', event => {
      if (!frame || event.origin !== location.origin || event.source !== frame.contentWindow) return;
      const value = event.data;
      if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== 1) return;
      if (value.type === 'solvex-wd46-ready') {
        clearTimeout(timeout);
        ready = true;
        host.dataset.state = 'ready';
        host.setAttribute('aria-busy', 'false');
        status.textContent = 'Demo attiva. Prezzi esemplificativi: nessun ordine viene inviato.';
        const moveFocus = focusOnReady && (document.activeElement === start || document.activeElement === document.body);
        focusOnReady = false;
        start.hidden = true;
        start.disabled = false;
        if (moveFocus) frame.focus();
        control();
      } else if (value.type === 'solvex-wd46-error') fail();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); control(); }).observe(host);
    }
    new MutationObserver(control).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    document.addEventListener('visibilitychange', control);
  }
})();
