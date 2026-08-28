/* Netlify Forms: verified success, stable lead_id and one application dispatch per submit. */
(function (window) {
  'use strict';

  const REGISTRY_KEY = '__solvex_confirmed_lead_ids';
  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const MAX_CONFIRMED_IDS = 50;
  const DELIVERY_STATES = Object.freeze({
    IDLE: 'IDLE',
    SENDING: 'SENDING',
    MANUAL_RETRY: 'MANUAL_RETRY',
    SUCCEEDED: 'SUCCEEDED',
    HTTP_ERROR: 'HTTP_ERROR',
    OFFLINE: 'OFFLINE',
    DELIVERY_UNKNOWN: 'DELIVERY_UNKNOWN'
  });

  function createLeadId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }

    if (!window.crypto || typeof window.crypto.getRandomValues !== 'function') {
      throw new Error('Secure UUID generation is unavailable.');
    }

    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
  }

  function readConfirmedIds() {
    try {
      const parsed = JSON.parse(window.sessionStorage.getItem(REGISTRY_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.filter((id) => UUID_PATTERN.test(id)).slice(-MAX_CONFIRMED_IDS) : [];
    } catch (_) {
      return [];
    }
  }

  const confirmedIds = new Set(readConfirmedIds());

  function rememberConfirmedId(leadId) {
    confirmedIds.add(leadId);
    try {
      window.sessionStorage.setItem(REGISTRY_KEY, JSON.stringify(Array.from(confirmedIds).slice(-MAX_CONFIRMED_IDS)));
    } catch (_) {}
  }

  function ensureLeadIdInput(form) {
    let input = form.querySelector('input[type="hidden"][name="lead_id"]');
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'lead_id';
      form.prepend(input);
    }
    if (!UUID_PATTERN.test(input.value)) input.value = createLeadId();
    return input;
  }

  function setStatus(statusElement, message) {
    if (!statusElement) return;
    statusElement.textContent = message || '';
    statusElement.hidden = !message;
    statusElement.style.display = message ? 'block' : '';
    if (message) statusElement.focus({ preventScroll: false });
  }

  function encodeForm(form, formName, leadSource, leadId) {
    const formData = new FormData(form);
    formData.set('form-name', formName);
    formData.set('lead_source', leadSource);
    formData.set('lead_id', leadId);

    const body = new URLSearchParams();
    formData.forEach((value, key) => body.append(key, String(value)));
    return body.toString();
  }

  function emitLeadSuccess(leadId, formName, leadSource) {
    if (confirmedIds.has(leadId)) return false;
    rememberConfirmedId(leadId);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'solvex_lead_success',
      lead_id: leadId,
      form_name: formName,
      lead_source: leadSource
    });
    return true;
  }

  function setDeliveryState(form, state) {
    form.dataset.deliveryState = state;
  }

  function createDialog(options) {
    const dialog = options && options.dialog;
    const title = options && options.title;
    const closeButton = options && options.closeButton;
    const fallbackFocus = options && options.fallbackFocus;

    if (!dialog || !title || !closeButton) {
      throw new Error('Invalid accessible dialog configuration.');
    }

    let returnFocus = null;
    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    function canRestoreFocus(element) {
      return element && element !== document.body && document.contains(element) && typeof element.focus === 'function';
    }

    function close() {
      dialog.classList.remove('show');
      if (document.activeElement && dialog.contains(document.activeElement)) document.activeElement.blur();
      dialog.setAttribute('aria-hidden', 'true');
      dialog.setAttribute('inert', '');
      fallbackFocus?.removeAttribute('disabled');

      const target = canRestoreFocus(returnFocus) ? returnFocus : fallbackFocus;
      if (canRestoreFocus(target)) target.focus();
    }

    function open(trigger) {
      returnFocus = canRestoreFocus(trigger)
        ? trigger
        : (canRestoreFocus(document.activeElement) ? document.activeElement : fallbackFocus);
      dialog.removeAttribute('inert');
      dialog.setAttribute('aria-hidden', 'false');
      dialog.classList.add('show');
      title.focus();
    }

    closeButton.addEventListener('click', close);
    dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = Array.from(dialog.querySelectorAll(focusableSelector));
      if (focusable.length === 0) {
        event.preventDefault();
        title.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === title)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === title) {
        event.preventDefault();
        first.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    dialog.setAttribute('aria-hidden', 'true');
    dialog.setAttribute('inert', '');
    return Object.freeze({ open, close });
  }

  function bind(options) {
    const form = options && options.form;
    if (!form || form.dataset.solvexLeadBound === '1') return;

    const formName = options.formName;
    const leadSource = options.leadSource;
    const validate = options.validate;
    const statusElement = options.statusElement || null;
    const submitButton = form.querySelector('[type="submit"]');
    const httpErrorMessage = options.httpErrorMessage || 'La richiesta non è stata accettata dal servizio. Nessun nuovo tentativo è stato eseguito: puoi riprovare manualmente.';
    const offlineMessage = options.offlineMessage || 'Sei offline. La richiesta non è stata inviata: controlla la connessione e riprova manualmente.';
    const deliveryUnknownMessage = options.deliveryUnknownMessage || 'Stato dell\'invio incerto: la richiesta potrebbe essere stata ricevuta. Non reinviare subito. Se scegli di riprovare manualmente, potrebbe essere creato un duplicato.';

    if (form.getAttribute('name') !== formName || !['contattaci_page', 'configuratori_3d'].includes(leadSource) || typeof validate !== 'function') {
      throw new Error('Invalid verified lead form configuration.');
    }

    form.dataset.solvexLeadBound = '1';
    let leadIdInput = ensureLeadIdInput(form);
    let isSubmitting = false;
    setDeliveryState(form, DELIVERY_STATES.IDLE);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (isSubmitting || !validate()) return;

      if (window.navigator && window.navigator.onLine === false) {
        setDeliveryState(form, DELIVERY_STATES.OFFLINE);
        setStatus(statusElement, offlineMessage);
        submitButton?.removeAttribute('disabled');
        return;
      }

      setStatus(statusElement, '');
      isSubmitting = true;
      const isManualRetry = form.dataset.deliveryState === DELIVERY_STATES.DELIVERY_UNKNOWN;
      setDeliveryState(form, isManualRetry ? DELIVERY_STATES.MANUAL_RETRY : DELIVERY_STATES.SENDING);
      form.setAttribute('aria-busy', 'true');
      submitButton?.setAttribute('disabled', '');

      try {
        leadIdInput = ensureLeadIdInput(form);
        const leadId = leadIdInput.value;
        let response;

        try {
          response = await window.fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: encodeForm(form, formName, leadSource, leadId),
            credentials: 'same-origin',
            redirect: 'error'
          });
        } catch (error) {
          setDeliveryState(form, DELIVERY_STATES.DELIVERY_UNKNOWN);
          setStatus(statusElement, deliveryUnknownMessage);
          if (typeof options.onError === 'function') options.onError({ error, state: DELIVERY_STATES.DELIVERY_UNKNOWN });
          return;
        }

        if (!response.ok) {
          const error = new Error(`Netlify Forms returned HTTP ${response.status}.`);
          setDeliveryState(form, DELIVERY_STATES.HTTP_ERROR);
          setStatus(statusElement, httpErrorMessage);
          if (typeof options.onError === 'function') options.onError({ error, state: DELIVERY_STATES.HTTP_ERROR });
          return;
        }

        emitLeadSuccess(leadId, formName, leadSource);
        HTMLFormElement.prototype.reset.call(form);
        setStatus(statusElement, '');
        leadIdInput = ensureLeadIdInput(form);
        leadIdInput.value = createLeadId();
        setDeliveryState(form, DELIVERY_STATES.SUCCEEDED);

        if (window.__adsConsentGranted && typeof window.__persistAdParams === 'function') {
          window.__persistAdParams();
        } else if (typeof window.__clearAdParams === 'function') {
          window.__clearAdParams();
        }

        if (typeof options.onSuccess === 'function') options.onSuccess({ leadId, submitButton });
      } finally {
        isSubmitting = false;
        form.removeAttribute('aria-busy');
        submitButton?.removeAttribute('disabled');
      }
    });

    /* Progressive enhancement: native validation remains active until the handler exists. */
    form.noValidate = true;
  }

  window.SolveXNetlifyLead = Object.freeze({ bind, createDialog, DELIVERY_STATES });
})(window);
