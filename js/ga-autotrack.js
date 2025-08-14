(function () {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function(){ dataLayer.push(arguments); };

  const now = () => Date.now().toString();
  const isLeftClick = (e) => (e.button === 0);
  const closest = (el, sel) => el ? el.closest(sel) : null;

  const sanitize = (s) => (s || '')
    .replace(/\s+/g, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, 80); // evita PII + stringhe troppo lunghe

  function nearestSectionName(el){
    // cerca il titolo di sezione più vicino (h1..h3) per contestualizzare
    const h = el.closest('section, article, main, div')?.querySelector('h1, h2, h3');
    return h ? sanitize(h.textContent) : '';
  }

  function sendGAEvent(name, params = {}) {
    const base = {
      page_path: location.pathname,
      page_title: document.title
    };
    const eventParams = Object.assign({ event_id: now() }, base, params);
    window.gtag('event', name, eventParams);
  }

  // 1) Click dichiarativi: data-ga-name / data-ga-params
  document.addEventListener('click', function (e) {
    if (!isLeftClick(e)) return;
    const trackEl = closest(e.target, '[data-ga-name]');
    if (trackEl) {
      try {
        const name = trackEl.getAttribute('data-ga-name') || 'ui_click';
        const raw = trackEl.getAttribute('data-ga-params');
        const extra = raw ? JSON.parse(raw) : {};
        sendGAEvent(name, extra);
      } catch (err) {
        sendGAEvent('ui_click', { parse_error: true });
      }
    }
  }, { passive: true });

  // 2) Auto-tracking link/button senza data-*
  document.addEventListener('click', function (e) {
    if (!isLeftClick(e)) return;

    // se è già un elemento dichiarativo, non duplicare
    if (closest(e.target, '[data-ga-name]')) return;

    const a = closest(e.target, 'a[href]');
    const btn = a ? null : closest(e.target, 'button, [role="button"]');

    if (!a && !btn) return;

    const el = a || btn;
    const role = a ? 'link' : 'button';
    const text = sanitize(el.getAttribute('aria-label') || el.textContent);
    const sec = nearestSectionName(el);

    // Evita di etichettare come ui_click se è già un tel/mailto/download/outbound:
    if (a) {
      const href = a.getAttribute('href') || '';
      const url = new URL(href, location.href);

      if (href.startsWith('tel:') || href.startsWith('mailto:')) return; // gestiti sotto
      const dlExt = /\.(pdf|zip|rar|7z|csv|xlsx?|pptx?|docx?)$/i;
      if (dlExt.test(url.pathname)) return; // gestiti sotto
      const isOutbound = url.origin !== location.origin;
      if (isOutbound) return; // gestiti sotto

      sendGAEvent('ui_click', {
        el_role: role,
        el_text: text,
        el_id: sanitize(el.id || ''),
        el_classes: sanitize(el.className || ''),
        href: url.href,
        section: sec
      });
    } else {
      sendGAEvent('ui_click', {
        el_role: role,
        el_text: text,
        el_id: sanitize(el.id || ''),
        el_classes: sanitize(el.className || ''),
        section: sec
      });
    }
  }, { passive: true });

  // 3) Outbound / Download / tel: / mailto:
  document.addEventListener('click', function (e) {
    const a = closest(e.target, 'a[href]');
    if (!a || !isLeftClick(e)) return;

    const href = a.getAttribute('href') || '';
    const url = new URL(href, location.href);

    // tel/mailto
    if (href.startsWith('tel:') || href.startsWith('mailto:')) {
      sendGAEvent('contact_click', {
        contact_type: href.startsWith('tel:') ? 'phone' : 'email',
        contact_value: href.replace(/^mailto:|^tel:/, '')
      });
      return;
    }

    // Download
    const dlExt = /\.(pdf|zip|rar|7z|csv|xlsx?|pptx?|docx?)$/i;
    if (dlExt.test(url.pathname)) {
      sendGAEvent('file_download', {
        file_name: url.pathname.split('/').pop(),
        file_path: url.pathname
      });
      return;
    }

    // Outbound
    const isOutbound = url.origin !== location.origin;
    if (isOutbound) {
      sendGAEvent('outbound_click', {
        outbound: true,
        link_url: url.href,
        link_domain: url.hostname
      });
    }
  }, { passive: true });

  // 4) Form submit (opt-in via data-ga-form)
  document.addEventListener('submit', function (e) {
    const form = e.target;
    if (!form || !form.matches('form[data-ga-form]')) return;

    const formName = form.getAttribute('data-ga-form') || 'form';
    const formParamsRaw = form.getAttribute('data-ga-params');
    let extra = {};
    try { extra = formParamsRaw ? JSON.parse(formParamsRaw) : {}; } catch {}
    sendGAEvent('form_submit', Object.assign({ form_name: formName }, extra));
  }, { passive: true });

  // 5) Scroll depth 25/50/75/100
  const marks = [25,50,75,100];
  let sent = new Set();
  function onScrollDepth() {
    const h = document.documentElement;
    const perc = Math.round( (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 );
    marks.forEach(m => {
      if (perc >= m && !sent.has(m)) {
        sent.add(m);
        sendGAEvent('scroll_depth', { percent: m });
      }
    });
    if (sent.size === marks.length) window.removeEventListener('scroll', onScrollDepth);
  }
  window.addEventListener('scroll', onScrollDepth, { passive: true });
})();
