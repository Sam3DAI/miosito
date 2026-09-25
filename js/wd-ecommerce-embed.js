// No iframe, bundle, model or texture is requested until an explicit activation.
(() => {
  'use strict';
  const hosts = document.querySelectorAll('[data-wd46-embed]');
  for (const host of hosts) {
    const start = host.querySelector('[data-wd46-start]');
    const poster = host.querySelector('[data-wd46-poster]');
    const status = host.querySelector('[data-wd46-status]');
    const stage = host.querySelector('[data-wd46-stage]');
    const fullscreen = host.querySelector('[data-wd47-fullscreen]');
    const fullscreenLabel = host.querySelector('[data-wd47-fullscreen-label]');
    if (!start || !poster || !status || !stage) continue;
    let frame = null;
    let timeout = null;
    let visible = true;
    let ready = false;
    let focusOnReady = false;
    let fullscreenPending = false;
    let fullscreenAttempt = 0;
    let fallbackRestore = null;
    let leaveExpandedFallback = () => {};
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
      status.textContent = 'La demo non è stata caricata. Riprova ad avviarla.';
      start.hidden = false;
      start.disabled = false;
      start.textContent = 'Riprova ad avviare la demo';
    };
    const activate = (transferFocus = true) => {
      if (frame && (ready || host.dataset.state === 'loading')) return;
      // Disabling the focused trigger may move native focus to BODY.
      focusOnReady = transferFocus && document.activeElement === start;
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
    };
    start.addEventListener('click', () => activate());
    // Fullscreen changes the existing container, never creates a second demo.
    // The anchor remains a native standalone fallback until enhancement binds.
    if (fullscreen && fullscreenLabel) {
      const setExpanded = mode => {
        host.dataset.expanded = mode;
        fullscreen.setAttribute('aria-pressed', String(mode !== 'none'));
        fullscreenLabel.textContent = mode === 'native' ? 'Esci schermo intero' : mode === 'fallback' ? 'Esci vista estesa' : 'Schermo intero';
      };
      const leaveFallback = () => {
        if (!fallbackRestore) return;
        const restore = fallbackRestore;
        fallbackRestore = null;
        for (const [element, inert] of restore.siblings) element.inert = inert;
        document.body.style.overflow = restore.overflow;
        setExpanded('none');
        window.scrollTo(restore.x, restore.y);
        fullscreen.focus({ preventScroll: true });
        if (host.dataset.state === 'ready') status.textContent = '';
      };
      const cancelExpandedRequest = () => {
        if (fullscreenPending) fullscreenAttempt += 1;
        leaveFallback();
        if (document.fullscreenElement === host) {
          document.exitFullscreen().catch(() => {
            if (document.fullscreenElement === host && host.dataset.state === 'ready') status.textContent = 'Usa il comando Esci schermo intero per uscire.';
          });
        }
      };
      leaveExpandedFallback = cancelExpandedRequest;
      const enterFallback = () => {
        if (fallbackRestore) return;
        const siblings = [];
        let branch = host;
        while (branch.parentElement && branch !== document.body) {
          for (const sibling of branch.parentElement.children) {
            if (sibling !== branch) { siblings.push([sibling, sibling.inert]); sibling.inert = true; }
          }
          branch = branch.parentElement;
        }
        fallbackRestore = { siblings, overflow: document.body.style.overflow, x: window.scrollX, y: window.scrollY };
        document.body.style.overflow = 'hidden';
        setExpanded('fallback');
        if (host.dataset.state === 'ready') status.textContent = 'Vista estesa nella pagina: lo schermo intero non è disponibile.';
        fullscreen.focus({ preventScroll: true });
        control();
      };
      const toggleExpanded = event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        if (fullscreenPending) return;
        if (fallbackRestore) { leaveFallback(); return; }
        if (document.fullscreenElement === host) {
          document.exitFullscreen().catch(() => {
            if (document.fullscreenElement === host && host.dataset.state === 'ready') status.textContent = 'Usa Esc per uscire dallo schermo intero.';
          });
          return;
        }
        activate(false);
        if (document.fullscreenEnabled === false || typeof host.requestFullscreen !== 'function') { enterFallback(); return; }
        fullscreenPending = true;
        const attempt = ++fullscreenAttempt;
        try {
          Promise.resolve(host.requestFullscreen()).then(() => {
            if (attempt !== fullscreenAttempt && document.fullscreenElement === host) return document.exitFullscreen();
          }).catch(() => {
            if (attempt === fullscreenAttempt) enterFallback();
          }).finally(() => { fullscreenPending = false; });
        } catch {
          fullscreenPending = false;
          enterFallback();
        }
      };
      fullscreen.addEventListener('click', toggleExpanded);
      fullscreen.addEventListener('keydown', event => {
        if (event.key !== ' ') return;
        event.preventDefault();
        if (!event.repeat) toggleExpanded(event);
      });
      document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement === host) setExpanded('native');
        else if (host.dataset.expanded === 'native') { setExpanded('none'); fullscreen.focus({ preventScroll: true }); }
        control();
      });
      document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        if (fallbackRestore || fullscreenPending) event.preventDefault();
        if (fallbackRestore || fullscreenPending || document.fullscreenElement === host) cancelExpandedRequest();
      });
      fullscreen.setAttribute('role', 'button');
      setExpanded('none');
    }
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
        status.textContent = host.dataset.expanded === 'fallback' ? 'Vista estesa nella pagina: lo schermo intero non è disponibile.' : '';
        const moveFocus = focusOnReady && (document.activeElement === start || document.activeElement === document.body);
        focusOnReady = false;
        start.hidden = false;
        start.disabled = true;
        start.textContent = 'Avvia demo';
        if (moveFocus) frame.focus();
        control();
      } else if (value.type === 'solvex-wd46-error') fail();
      else if (value.type === 'solvex-wd47-exit-expanded') leaveExpandedFallback();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); control(); }).observe(host);
    }
    new MutationObserver(control).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    document.addEventListener('visibilitychange', control);
  }
})();
