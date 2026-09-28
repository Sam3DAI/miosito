// 48: one display-availability rule. Signals are neither stored nor transmitted.
(function () {
  'use strict';
  function eligible({ width, height, screenWidth, screenHeight, coarse, mobile, slotWidth = width }) {
    return Number.isFinite(width) && Number.isFinite(height) && width >= 720 && height >= 500 &&
      slotWidth >= 640 && mobile !== true &&
      (!coarse || (Number.isFinite(screenWidth) && Number.isFinite(screenHeight) && Math.min(screenWidth, screenHeight) >= 600));
  }
  function read() {
    // Same-origin embedding shares viewport geometry only. 640px leaves room
    // for page gutters, borders and a classic scrollbar at the720px outer limit.
    let viewport = window;
    try { if (window.parent !== window && window.parent.location.origin === location.origin) viewport = window.parent; } catch {}
    return { width: viewport.innerWidth, height: viewport.innerHeight, slotWidth: window.innerWidth,
      screenWidth: screen.width, screenHeight: screen.height,
      coarse: window.matchMedia('(pointer: coarse)').matches, mobile: navigator.userAgentData?.mobile === true };
  }
  const listeners = new Set();
  const allowed = () => eligible(read());
  const refresh = () => { for (const fn of listeners) fn(allowed()); };
  const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };
  function wait() {
    if (allowed()) return Promise.resolve();
    return new Promise(resolve => { const off = subscribe(ok => { if (ok) { off(); resolve(); } }); });
  }
  window.addEventListener('resize', refresh);
  window.addEventListener('orientationchange', refresh);
  window.matchMedia('(pointer: coarse)').addEventListener('change', refresh);
  // A short parent viewport can change without changing the frame's min-height.
  // Subscribe to that exact same-origin viewport too; release it with this page.
  try {
    const parentViewport = window.parent;
    if (parentViewport !== window && parentViewport.location.origin === location.origin) {
      parentViewport.addEventListener('resize', refresh);
      parentViewport.addEventListener('orientationchange', refresh);
      window.addEventListener('pagehide', () => {
        parentViewport.removeEventListener('resize', refresh);
        parentViewport.removeEventListener('orientationchange', refresh);
      }, { once: true });
    }
  } catch { /* Cross-origin embedding retains only its own viewport signals. */ }
  window.WD48Availability = Object.freeze({ eligible, read, allowed, subscribe, wait });
})();
