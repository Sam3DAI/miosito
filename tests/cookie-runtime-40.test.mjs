import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const code = fs.readFileSync(fileURLToPath(new URL('../js/cookie-banner.js', import.meta.url)), 'utf8');

// Synthetic DOM/storage only: no browser profile, network API or provider.
export function cookieFixture(source = code, options = {}) {
  const listeners = new Map(), nodes = [], store = new Map(Object.entries(options.storage || {}));
  let document;
  class Element {
    constructor(tag) { this.tagName = tag; this.attrs = {}; this.children = []; this.style = {}; this.listeners = new Map(); this.checked = false; this.hidden = false; this.isConnected = true; this.textContent = ''; nodes.push(this); }
    setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'hidden') this.hidden = true; }
    getAttribute(k) { return this.attrs[k] ?? null; }
    append(...children) { for (const child of children) { child.parent = this; this.children.push(child); } }
    get classList() { return { contains: name => (this.attrs.class || '').split(' ').includes(name) }; }
    set innerHTML(value) {
      this.html = value;
      if (value.includes('cc-analytics')) {
        for (const id of ['cc-analytics', 'cc-ads']) { const n = new Element('input'); n.setAttribute('id', id); this.append(n); }
        const actions = new Element('div'); actions.setAttribute('class', 'cc-panel-actions');
        for (const cls of ['cc-deny','cc-allow']) { const n = new Element('button'); n.setAttribute('class', 'cc-btn ' + cls); actions.append(n); }
        this.append(actions);
      }
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    querySelectorAll(selector) {
      const pieces = selector.split(' '), last = pieces.pop();
      const matches = n => last.startsWith('#') ? n.attrs.id === last.slice(1) : last.startsWith('.') ? n.classList.contains(last.slice(1)) : n.tagName === last;
      const descendants = n => n.children.flatMap(c => [c, ...descendants(c)]);
      return descendants(this).filter(n => matches(n) && (!pieces.length || n.parent.classList.contains(pieces[0].slice(1))));
    }
    closest(selector) { return selector.split(',').some(s => s.trim() === '#' + this.attrs.id || (s.trim() === '[data-cookie-preferences]' && 'data-cookie-preferences' in this.attrs)) ? this : this.parent?.closest(selector) || null; }
    addEventListener(event, fn) { const list = this.listeners.get(event) || []; list.push(fn); this.listeners.set(event, list); }
    focus() { document.activeElement = this; }
    click() { this.focus(); const event = { target: this, preventDefault() {} }; (this.listeners.get('click') || []).forEach(fn => fn(event)); (listeners.get('click') || []).forEach(fn => fn(event)); }
  }
  const body = new Element('body');
  document = {
    body, readyState: options.readyState || 'loading', activeElement: body,
    createElement: tag => new Element(tag),
    querySelector: selector => body.querySelector(selector),
    getElementById: id => body.querySelector('#' + id),
    addEventListener(event, fn) { const list = listeners.get(event) || []; list.push(fn); listeners.set(event, list); }
  };
  for (const id of ['manage-cookies','footer-preferences']) { const n = new Element('button'); n.setAttribute('id', id); if (id === 'footer-preferences') n.setAttribute('data-cookie-preferences',''); body.append(n); }
  const localStorage = {
    getItem(key) { if (options.readThrows) throw new Error('Synthetic storage read denied'); return store.get(key) ?? null; },
    setItem(key, value) { if (options.writeThrows) throw new Error('Synthetic quota denied'); store.set(key, value); },
    removeItem(key) { if (options.removeThrows) throw new Error('Synthetic remove denied'); store.delete(key); }
  };
  const calls = { analytics: 0, ads: 0, persist: 0, clear: 0, observers: 0 };
  const window = { dataLayer: [], __loadGA4() { calls.analytics++; }, __loadAds() { calls.ads++; }, __persistAdParams() { calls.persist++; }, __clearAdParams() { calls.clear++; } };
  const context = vm.createContext({ window, document, localStorage, MutationObserver: class { observe() { calls.observers++; } } });
  const run = () => vm.runInContext(source, context);
  run();
  if (document.readyState === 'loading') { document.readyState = 'interactive'; for (const fn of listeners.get('DOMContentLoaded') || []) fn(); }
  return { window, document, store, calls, run, nodes, listeners, get: selector => body.querySelector(selector) };
}

const state = env => [env.window.__analyticsConsentGranted, env.window.__adsConsentGranted];
function assertUpdates(env, a, m) {
  assert.deepEqual(state(env), [a,m]);
  const updates = env.window.dataLayer.filter(row => row[0] === 'consent' && row[1] === 'update');
  assert.equal(updates.at(-2)[2].analytics_storage, a ? 'granted' : 'denied');
  assert.equal(updates.at(-1)[2].ad_storage, m ? 'granted' : 'denied');
  assert.equal(updates.at(-1)[2].ad_user_data, m ? 'granted' : 'denied');
  assert.equal(updates.at(-1)[2].ad_personalization, 'denied');
}
test('40 fresh / reject / statistics / ads / both / revocation retain Google keys and explicit states', () => {
  for (const [a,m] of [[false,false],[true,false],[false,true],[true,true]]) {
    const env = cookieFixture(); assertUpdates(env,false,false);
    env.get('.cc-prefs').click();
    env.get('#cc-analytics').checked = a; env.get('#cc-ads').checked = m;
    env.get('.cc-panel-actions .cc-allow').click(); assertUpdates(env,a,m);
    assert.deepEqual(JSON.parse(env.store.get('cookieconsent_prefs')), { analytics:a, ads:m });
    env.get('.cc-revoke').click(); env.get('.cc-panel-actions .cc-deny').click(); assertUpdates(env,false,false);
    assert.equal(env.calls.analytics, Number(a)); assert.equal(env.calls.ads, Number(m));
  }
});
test('40 storage read exception must not abort banner initialization', () => { const env = cookieFixture(code, {readThrows:true}); assertUpdates(env,false,false); env.get('.cc-allow').click(); assertUpdates(env,true,true); });
test('40 storage write exception still applies in memory and reports lack of persistence', () => {
  const env = cookieFixture(code, {writeThrows:true}); env.get('.cc-allow').click(); assertUpdates(env,true,true);
  assert.equal(env.store.size,0); assert.match(env.get('.cc-status').textContent,/questa pagina/); assert.notEqual(env.get('.cc-window').style.display,'none');
  env.get('.cc-deny').click(); assertUpdates(env,false,false);
});
test('40 storage removal exception does not break a newly saved choice', () => { const env = cookieFixture(code, {removeThrows:true}); env.get('.cc-deny').click(); assertUpdates(env,false,false); });
for (const raw of ['{broken','null','false','42','"false"','[]','{}','{"analytics":"false","ads":"false"}','{"analytics":1,"ads":{}}','{"analytics":true,"ads":null}','{"analytics":true,"ads":true,"unexpected":1}']) {
  test('40 corrupted or nonboolean preference denies without implicit grant: ' + raw, () => {
    const env = cookieFixture(code,{storage:{cookieconsent_prefs:raw}}); assertUpdates(env,false,false);
    assert.notEqual(env.get('.cc-window').style.display,'none');
  });
}
test('40 a malformed current preference cannot fall back to a stale legacy grant', () => { const env = cookieFixture(code,{storage:{cookieconsent_prefs:'{broken',cookieconsent_status:'allow'}}); assertUpdates(env,false,false); });
test('40 explicit historic boolean choices survive without retroactive metadata', () => {
  for (const [analytics,ads] of [[false,false],[true,false],[false,true],[true,true]]) {
    const raw = JSON.stringify({analytics,ads}); const env = cookieFixture(code,{storage:{cookieconsent_prefs:raw}}); assertUpdates(env,analytics,ads); assert.equal(env.store.get('cookieconsent_prefs'),raw);
  }
});
test('40 lone legacy allow/deny policy is preserved, not silently changed', () => {
  for (const value of ['allow','deny']) { const env = cookieFixture(code,{storage:{cookieconsent_status:value}}); assertUpdates(env,value==='allow',value==='allow'); assert.equal(env.store.has('cookieconsent_prefs'),false); }
});
test('40 late script and repeated execution initialize one nonmodal banner and listeners only once', () => {
  const env = cookieFixture(code,{readyState:'complete'}); assert.ok(env.get('.cc-window')); env.run();
  assert.equal(env.nodes.filter(n=>n.classList.contains('cc-window')).length,1); assert.equal(env.calls.observers,1);
  env.get('.cc-deny').click(); const count = env.window.dataLayer.length;
  for (const id of ['#manage-cookies','#footer-preferences']) { env.get(id).click(); assert.equal(env.get('.cc-panel').hidden,false); assert.equal(env.get('.cc-window').style.display,''); env.get('.cc-panel-actions .cc-deny').click(); assert.equal(env.document.activeElement,env.get(id)); }
  assert.equal(env.window.dataLayer.length,count+4); assert.equal(env.get('.cc-window').getAttribute('aria-modal'),null);
});
test('40 opening from privacy and footer focuses the same preferences', () => {
  const env = cookieFixture(); env.get('.cc-deny').click();
  for (const id of ['#manage-cookies','#footer-preferences']) { env.get(id).click(); assert.equal(env.document.activeElement,env.get('#cc-analytics')); assert.equal(env.get('.cc-panel').hidden,false); }
});
