import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../js/wd-ecommerce-embed.js', import.meta.url), 'utf8');
const ORIGIN = 'https://staging.example.invalid';
const READY = { type: 'solvex-wd46-ready' };
const ERROR = { type: 'solvex-wd46-error' };

// This is a deterministic DOM/VM harness, not browser, network or 3D evidence.
// Network-shaped operations are trapped; no fixture contacts any endpoint.
function eventTarget() {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    emit(type, event = {}) {
      for (const handler of listeners.get(type) || []) handler(event);
    }
  };
}

function fixture({ theme = 'light', origin = ORIGIN, noIntersection = false, missing = '', hostCount = 1, releaseFocusOnDisable = true, code = source } = {}) {
  const created = [], navigations = [], forbiddenRequests = [], storageWrites = [];
  const intersections = [], mutations = [], timers = new Map();
  let timerId = 0, now = 0;
  const location = Object.freeze({ origin });
  const document = Object.assign(eventTarget(), {
    documentElement: { dataset: { theme } }, activeElement: null, hidden: false
  });
  function element(tagName) {
    const node = Object.assign(eventTarget(), {
      tagName: tagName.toUpperCase(), dataset: {}, attributes: {}, children: [],
      parentElement: null, hidden: false, disabled: false, textContent: '', focusCount: 0,
      setAttribute(name, value) { this.attributes[name] = String(value); },
      getAttribute(name) { return this.attributes[name] ?? null; },
      focus() {
        const previous = document.activeElement;
        document.activeElement = this; this.focusCount++;
        document.emit('focusin', { target: this, relatedTarget: previous });
      },
      click() { if (!this.disabled) this.emit('click', { target: this }); },
      remove() {
        if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(node => node !== this);
        this.parentElement = null;
        this.removed = true;
      },
      replaceChildren(...nodes) {
        for (const old of this.children) old.parentElement = null;
        this.children = nodes;
        for (const node of nodes) {
          node.parentElement = this;
          if (node.tagName === 'IFRAME') navigations.push({ frame: node, url: new URL(node.src, origin).href });
        }
      }
    });
    let disabled = false;
    Object.defineProperty(node, 'disabled', {
      get() { return disabled; },
      set(value) {
        disabled = Boolean(value);
        if (disabled && releaseFocusOnDisable && document.activeElement === node) {
          document.activeElement = document.body;
          document.emit('focusin', { target: document.body, relatedTarget: node });
        }
      }
    });
    return node;
  }
  document.body = element('body');
  document.activeElement = document.body;
  const hosts = Array.from({ length: hostCount }, () => {
    const host = element('section');
    host.dataset.state = 'idle';
    const start = element('button'), poster = element('div'), status = element('p'), stage = element('div');
    stage.hidden = true;
    start.textContent = 'Avvia la demo';
    const nodes = { start, poster, status, stage };
    host.querySelector = selector => {
      const match = /^\[data-wd46-(start|poster|status|stage)\]$/.exec(selector);
      assert.ok(match, `Unexpected selector: ${selector}`);
      return match[1] === missing ? null : nodes[match[1]];
    };
    return { host, ...nodes };
  });
  function denyRequest(kind, address) {
    forbiddenRequests.push({ kind, address });
    throw new Error(`Forbidden fixture network operation: ${kind}`);
  }
  document.querySelectorAll = selector => {
    assert.equal(selector, '[data-wd46-embed]', 'the embed must not target lead forms');
    return hosts.map(entry => entry.host);
  };
  document.createElement = tagName => {
    const node = element(tagName);
    created.push(node);
    if (node.tagName === 'IFRAME') {
      node.src = '';
      node.messages = [];
      node.contentWindow = {
        postMessage(message, targetOrigin) {
          node.messages.push({ message: structuredClone(message), targetOrigin });
        }
      };
    }
    if (node.tagName === 'FORM') node.submit = () => denyRequest('form-submit', node.action);
    return node;
  };
  const window = Object.assign(eventTarget(), {
    location,
    fetch: address => denyRequest('fetch', address),
    navigator: { sendBeacon: address => denyRequest('beacon', address) }
  });
  class MutationObserver {
    constructor(callback) { this.callback = callback; mutations.push(this); }
    observe(target, options) { this.target = target; this.options = structuredClone(options); }
  }
  class IntersectionObserver {
    constructor(callback) { this.callback = callback; this.targets = []; intersections.push(this); }
    observe(target) { this.targets.push(target); }
  }
  if (!noIntersection) window.IntersectionObserver = IntersectionObserver;
  function setTimeoutFixture(callback, delay) {
    const id = ++timerId;
    timers.set(id, { callback, delay, due: now + delay });
    return id;
  }
  function clearTimeoutFixture(id) { timers.delete(id); }
  const context = {
    window, document, location, MutationObserver, IntersectionObserver,
    setTimeout: setTimeoutFixture, clearTimeout: clearTimeoutFixture,
    fetch: window.fetch, navigator: window.navigator,
    XMLHttpRequest: function () { denyRequest('xhr'); },
    WebSocket: function (address) { denyRequest('websocket', address); },
    EventSource: function (address) { denyRequest('eventsource', address); },
    Image: function () { denyRequest('image'); },
    localStorage: { getItem() { return null; }, setItem(key, value) { storageWrites.push([key, value]); } }
  };
  Object.assign(window, {
    setTimeout: setTimeoutFixture, clearTimeout: clearTimeoutFixture,
    XMLHttpRequest: context.XMLHttpRequest, WebSocket: context.WebSocket,
    EventSource: context.EventSource, Image: context.Image, localStorage: context.localStorage
  });
  vm.runInNewContext(code, context, { filename: 'js/wd-ecommerce-embed.js' });
  return {
    hosts, document, window, created, navigations, forbiddenRequests, storageWrites, timers, mutations, intersections,
    frame(index = 0) { return hosts[index].stage.children[0] || null; },
    activate(index = 0, focus = true) {
      if (focus) hosts[index].start.focus();
      hosts[index].start.click();
      return this.frame(index);
    },
    message(data, { frame = this.frame(), eventOrigin = origin, eventSource = frame?.contentWindow } = {}) {
      // postMessage uses structured-cloned data; don't invent prototype-bearing wire payloads.
      window.emit('message', { data: structuredClone(data), origin: eventOrigin, source: eventSource });
    },
    setTheme(value) {
      document.documentElement.dataset.theme = value;
      for (const observer of mutations) observer.callback([{ target: document.documentElement, attributeName: 'data-theme' }]);
    },
    setHidden(hidden) { document.hidden = hidden; document.emit('visibilitychange'); },
    setIntersecting(visible, index = 0) {
      const target = hosts[index].host;
      for (const observer of intersections) if (observer.targets.includes(target)) observer.callback([{ target, isIntersecting: visible }]);
    },
    advance(milliseconds) {
      now += milliseconds;
      for (const [id, entry] of [...timers].sort((a, b) => a[1].due - b[1].due)) {
        if (entry.due <= now && timers.has(id)) { timers.delete(id); entry.callback(); }
      }
    }
  };
}

function assertControl(frame, theme, visible, origin = ORIGIN) {
  assert.deepEqual(frame.messages.at(-1), {
    message: { type: 'solvex-wd46-control', theme, visible }, targetOrigin: origin
  });
}

test('WD46 stays dormant before activation, including theme/visibility/spoofed messages', () => {
  const f = fixture();
  f.setTheme('dark'); f.setIntersecting(false); f.setHidden(true); f.message(READY, { eventSource: {} });
  assert.equal(f.frame(), null);
  assert.deepEqual(f.created, []);
  assert.deepEqual(f.navigations, []);
  assert.deepEqual(f.forbiddenRequests, []);
  assert.equal(f.timers.size, 0);
  assert.equal(f.hosts[0].host.dataset.state, 'idle');
});

test('WD46 skips incomplete embed markup without touching other controls', () => {
  for (const missing of ['start', 'poster', 'status', 'stage']) {
    const f = fixture({ missing });
    f.activate();
    assert.equal(f.frame(), null);
    assert.equal(f.window.listeners.get('message')?.length || 0, 0);
    assert.equal(f.intersections.length, 0);
    assert.equal(f.mutations.length, 0);
  }
  assert.doesNotThrow(() => fixture({ hostCount: 0 }));
});

test('WD46 requests exactly one same-origin demo on click with bounded sandbox and no-referrer', () => {
  for (const [theme, expected] of [['light', 'light'], ['dark', 'dark'], ['unexpected', 'light']]) {
    const origin = 'http://127.0.0.1:4650';
    const f = fixture({ theme, origin });
    const frame = f.activate();
    assert.equal(frame.src, `/demo/ecommerce/?embed=1&theme=${expected}`);
    assert.equal(f.navigations.length, 1);
    assert.equal(f.navigations[0].url, `${origin}/demo/ecommerce/?embed=1&theme=${expected}`);
    assert.equal(new URL(f.navigations[0].url).origin, origin);
    assert.equal(frame.getAttribute('sandbox'), 'allow-scripts allow-same-origin');
    assert.equal(frame.getAttribute('referrerpolicy'), 'no-referrer');
    assert.match(frame.title, /WDRacing.*prezzi esemplificativi/);
    assert.equal(f.hosts[0].host.dataset.state, 'loading');
    assert.equal(f.hosts[0].host.getAttribute('aria-busy'), 'true');
    assert.equal(f.hosts[0].stage.hidden, false);
    assert.equal(f.hosts[0].poster.hidden, true);
    assert.equal(f.hosts[0].start.disabled, true);
    assert.deepEqual([...f.timers.values()].map(timer => timer.delay), [45000]);
  }
});

test('WD46 load sends only exact-origin theme/visibility control, not a premature ready state', () => {
  const f = fixture({ theme: 'dark' });
  const frame = f.activate();
  frame.emit('load');
  assertControl(frame, 'dark', true);
  assert.equal(f.hosts[0].host.dataset.state, 'loading');
  assert.equal(f.hosts[0].start.hidden, false);
  assert.equal(frame.focusCount, 0);
  assert.equal(f.timers.size, 1);
});

test('WD46 authenticated ready clears timeout, restores busy state and moves focus from its trigger', () => {
  const f = fixture();
  const frame = f.activate();
  f.message(READY);
  assert.equal(f.hosts[0].host.dataset.state, 'ready');
  assert.equal(f.hosts[0].host.getAttribute('aria-busy'), 'false');
  assert.equal(f.hosts[0].start.hidden, true);
  assert.equal(f.hosts[0].start.disabled, false);
  assert.equal(f.document.activeElement, frame);
  assert.equal(frame.focusCount, 1);
  assert.match(f.hosts[0].status.textContent, /nessun ordine viene inviato/);
  assert.equal(f.timers.size, 0);
  f.advance(90000);
  assert.equal(f.hosts[0].host.dataset.state, 'ready');
  assertControl(frame, 'light', true);
});

test('WD46 ready does not steal focus if the user has moved elsewhere', () => {
  const f = fixture();
  const frame = f.activate();
  const elsewhere = {};
  f.document.activeElement = elsewhere;
  f.message(READY);
  assert.equal(f.document.activeElement, elsewhere);
  assert.equal(frame.focusCount, 0);
});

test('WD46 disabled-trigger blur to BODY retains the pre-disable activation focus intent', () => {
  function assertReadyFocus(code) {
    const f = fixture({ code });
    const frame = f.activate();
    assert.equal(f.hosts[0].start.disabled, true);
    assert.equal(f.document.activeElement, f.document.body, 'realistic automatic blur on disabled');
    f.message(READY);
    assert.equal(f.document.activeElement, frame);
    assert.equal(frame.focusCount, 1);
  }
  assertReadyFocus(source);
  const lateFocus = source.replace(
    'const moveFocus = focusOnReady && (document.activeElement === start || document.activeElement === document.body);',
    'const moveFocus = document.activeElement === start;'
  );
  assert.notEqual(lateFocus, source);
  assert.throws(() => assertReadyFocus(lateFocus), /Expected/);
});

test('WD46 user focus on another control cancels pending transfer even after a later blur to BODY', () => {
  for (const blurToBody of [false, true]) {
    const f = fixture();
    const frame = f.activate();
    const otherControl = f.document.createElement('button');
    otherControl.focus();
    if (blurToBody) f.document.activeElement = f.document.body;
    const chosenTarget = f.document.activeElement;
    f.message(READY);
    assert.equal(f.document.activeElement, chosenTarget);
    assert.equal(frame.focusCount, 0);
  }
});

test('WD46 no initial trigger focus or repeated ready message cannot create a new focus transfer', () => {
  const withoutIntent = fixture();
  const unrequestedFrame = withoutIntent.activate(0, false);
  withoutIntent.message(READY);
  assert.equal(withoutIntent.document.activeElement, withoutIntent.document.body);
  assert.equal(unrequestedFrame.focusCount, 0);
  const f = fixture({ releaseFocusOnDisable: false });
  const frame = f.activate();
  f.message(READY);
  assert.equal(frame.focusCount, 1);
  f.document.activeElement = f.document.body;
  f.message(READY);
  assert.equal(f.document.activeElement, f.document.body);
  assert.equal(frame.focusCount, 1);
});

test('WD46 already-ready activation does not create a new iframe or another request', () => {
  const f = fixture();
  const frame = f.activate();
  f.message(READY);
  f.hosts[0].start.emit('click');
  assert.equal(f.frame(), frame);
  assert.equal(f.created.length, 1);
  assert.equal(f.navigations.length, 1);
  assert.equal(f.timers.size, 0);
});

test('WD46 refuses wrong origin and wrong source for both ready and error messages', () => {
  const f = fixture();
  const frame = f.activate();
  for (const data of [READY, ERROR]) {
    for (const wrong of [
      { eventOrigin: 'https://external.example.invalid' },
      { eventOrigin: 'http://staging.example.invalid' },
      { eventOrigin: 'null' },
      { eventOrigin: `${ORIGIN}:8443` },
      { eventSource: {} },
      { eventSource: null }
    ]) f.message(data, wrong);
  }
  assert.equal(f.hosts[0].host.dataset.state, 'loading');
  assert.equal(f.timers.size, 1);
  assert.equal(frame.messages.length, 0);
  f.message(READY);
  f.message(ERROR, { eventSource: {} });
  f.message(ERROR, { eventOrigin: 'https://external.example.invalid' });
  assert.equal(f.hosts[0].host.dataset.state, 'ready');
});

test('WD46 refuses malformed, extra-key and unknown message schemas', () => {
  const f = fixture();
  f.activate();
  const invalid = [
    null, undefined, false, 1, 'solvex-wd46-ready', [], [READY], {},
    { event: 'solvex-wd46-ready' }, { type: 'unknown' }, { type: null },
    { type: ['solvex-wd46-ready'] }, { type: {} },
    { type: 'solvex-wd46-ready', extra: true }, { type: 'solvex-wd46-error', extra: true }
  ];
  for (const value of invalid) {
    f.message(value);
    assert.equal(f.hosts[0].host.dataset.state, 'loading');
    assert.equal(f.timers.size, 1);
    assert.equal(f.frame().messages.length, 0);
  }
  const inherited = Object.assign(Object.create(READY), { untrusted: true });
  f.message(inherited); // Structured clone omits the prototype, as a real message does.
  assert.equal(f.hosts[0].host.dataset.state, 'loading');
  f.message(READY);
  assert.equal(f.hosts[0].host.dataset.state, 'ready');
});

test('WD46 frame errors and validated error messages expose a working retry', () => {
  for (const channel of ['frame', 'message']) {
    const f = fixture();
    const first = f.activate();
    if (channel === 'frame') first.emit('error'); else f.message(ERROR);
    assert.equal(f.hosts[0].host.dataset.state, 'error');
    assert.equal(f.hosts[0].host.getAttribute('aria-busy'), 'false');
    assert.equal(f.hosts[0].start.hidden, false);
    assert.equal(f.hosts[0].start.disabled, false);
    assert.match(f.hosts[0].start.textContent, /Riprova/);
    assert.match(f.hosts[0].status.textContent, /pagina dedicata/);
    assert.equal(f.timers.size, 0);
    f.setTheme('dark');
    const second = f.activate();
    assert.notEqual(second, first);
    assert.equal(first.removed, true);
    assert.equal(first.parentElement, null);
    assert.deepEqual(f.hosts[0].stage.children, [second]);
    assert.equal(second.src, '/demo/ecommerce/?embed=1&theme=dark');
    f.message(READY);
    assert.equal(f.hosts[0].host.dataset.state, 'ready');
    assert.equal(f.document.activeElement, second);
    assert.equal(f.navigations.length, 2);
  }
});

test('WD46 times out at 45 seconds and a retry receives a fresh bounded timeout', () => {
  const f = fixture();
  f.activate();
  f.advance(44999);
  assert.equal(f.hosts[0].host.dataset.state, 'loading');
  f.advance(1);
  assert.equal(f.hosts[0].host.dataset.state, 'error');
  assert.equal(f.hosts[0].start.disabled, false);
  f.activate();
  f.advance(44999);
  assert.equal(f.hosts[0].host.dataset.state, 'loading');
  f.message(READY);
  f.advance(100000);
  assert.equal(f.hosts[0].host.dataset.state, 'ready');
});

test('WD46 ignores stale iframe load/error/messages after retry and cancels the previous timer', () => {
  const f = fixture();
  const first = f.activate();
  f.advance(1000);
  first.emit('error');
  const second = f.activate();
  first.emit('load'); first.emit('error');
  f.message(READY, { frame: first }); f.message(ERROR, { frame: first });
  assert.equal(f.hosts[0].host.dataset.state, 'loading');
  assert.equal(first.messages.length, 0);
  assert.equal(second.messages.length, 0);
  assert.equal(f.timers.size, 1);
  f.advance(44000); // The first frame's deadline must no longer fire.
  assert.equal(f.hosts[0].host.dataset.state, 'loading');
  f.message(READY);
  first.emit('error'); f.message(ERROR, { frame: first });
  f.advance(45000);
  assert.equal(f.hosts[0].host.dataset.state, 'ready');
  assert.equal(f.frame(), second);
});

test('WD46 sends sanitized theme and combined viewport/document visibility updates', () => {
  const f = fixture();
  const frame = f.activate();
  f.message(READY);
  assertControl(frame, 'light', true);
  f.setTheme('dark'); assertControl(frame, 'dark', true);
  f.setTheme('javascript:invalid'); assertControl(frame, 'light', true);
  f.setIntersecting(false); assertControl(frame, 'light', false);
  f.setHidden(true); assertControl(frame, 'light', false);
  f.setHidden(false); assertControl(frame, 'light', false);
  f.setIntersecting(true); assertControl(frame, 'light', true);
  f.setHidden(true); assertControl(frame, 'light', false);
  f.setIntersecting(true); assertControl(frame, 'light', false);
  f.setHidden(false); assertControl(frame, 'light', true);
  assert.equal(f.mutations.length, 1);
  assert.equal(f.mutations[0].target, f.document.documentElement);
  assert.deepEqual(f.mutations[0].options, { attributes: true, attributeFilter: ['data-theme'] });
  for (const entry of frame.messages) {
    assert.deepEqual(Object.keys(entry.message).sort(), ['theme', 'type', 'visible']);
    assert.equal(entry.targetOrigin, ORIGIN);
    assert.equal(typeof entry.message.visible, 'boolean');
  }
});

test('WD46 without IntersectionObserver still supports ready, theme and document visibility', () => {
  const f = fixture({ noIntersection: true });
  assert.equal(f.intersections.length, 0);
  const frame = f.activate();
  f.message(READY);
  f.setTheme('dark'); assertControl(frame, 'dark', true);
  f.setHidden(true); assertControl(frame, 'dark', false);
  f.setHidden(false); assertControl(frame, 'dark', true);
});

test('WD46 isolates frame identity, state and timeout across multiple embed hosts', () => {
  const f = fixture({ hostCount: 2 });
  const first = f.activate(0), second = f.activate(1);
  assert.equal(f.timers.size, 2);
  f.message(READY, { frame: first });
  assert.equal(f.hosts[0].host.dataset.state, 'ready');
  assert.equal(f.hosts[1].host.dataset.state, 'loading');
  assert.equal(f.timers.size, 1);
  f.message(ERROR, { frame: second });
  assert.equal(f.hosts[0].host.dataset.state, 'ready');
  assert.equal(f.hosts[1].host.dataset.state, 'error');
  assert.equal(f.timers.size, 0);
  f.setIntersecting(false, 0);
  assertControl(first, 'light', false);
  f.setTheme('dark');
  assertControl(first, 'dark', false);
  assertControl(second, 'dark', true);
});

test('WD46 embed performs no form/provider/backend calls, external navigation or storage writes', () => {
  const f = fixture();
  const first = f.activate();
  first.emit('load'); f.message(ERROR);
  const second = f.activate();
  second.emit('load'); f.message(READY);
  f.setTheme('dark'); f.setIntersecting(false); f.setHidden(true);
  assert.deepEqual(f.forbiddenRequests, []);
  assert.deepEqual(f.storageWrites, []);
  assert.ok(f.created.every(node => node.tagName === 'IFRAME'));
  assert.ok(f.navigations.every(entry => new URL(entry.url).origin === ORIGIN));
  assert.ok(f.navigations.every(entry => new URL(entry.url).pathname === '/demo/ecommerce/'));
  assert.doesNotMatch(source, /https?:\/\/|localhost|FormData|sendBeacon|XMLHttpRequest|\bfetch\s*\(|\.submit\s*\(/);
  assert.throws(() => fixture({ code: `${source}\nfetch('https://blocked.example.invalid');` }), /Forbidden fixture network operation: fetch/);
});
