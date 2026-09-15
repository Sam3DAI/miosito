import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import nunjucks from 'nunjucks';
import { assertLaunch36Sources, assertLaunch36Html, beforeLegacyHostGuard36, beforeReadiness36 } from './launch-readiness-36.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'src/_includes/partials/measurement-bootstrap.njk'), 'utf8');
const measurement = JSON.parse(fs.readFileSync(path.join(root, 'src/_data/measurement.json'), 'utf8'));
const html = nunjucks.renderString(source, {measurement});
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const banner = fs.readFileSync(path.join(root, 'js/cookie-banner.js'), 'utf8');
// Execute the real, bounded banner consent dispatcher with the rendered loader.
const dispatcher = banner.match(/  function applyConsent\([\s\S]*?\n  \}\r?\n/)[0];
const hosts = ['solvex-ai3d.com','solvex-ai3d-measurement-staging.netlify.app','localhost','127.0.0.1','solvex-ai3d.com.evil.invalid'];
for (const hostname of hosts) for (const granted of [false,true]) {
  test(`task36 mock host=${hostname} consent=${granted ? 'granted':'denied'}`, () => {
    const scripts = [], dataLayer = [];
    const context = vm.createContext({location:{hostname},dataLayer,document:{createElement:() => ({}),head:{appendChild:element=>scripts.push(element)}}});
    context.window = context;
    vm.runInContext(script, context);
    vm.runInContext(dispatcher + `\napplyConsent({analytics:${granted},ads:${granted}});`, context);
    assert.equal(context.__analyticsConsentGranted, granted);
    assert.equal(context.__adsConsentGranted, granted);
    assert.equal(typeof context.__loadGA4, 'function');
    assert.equal(typeof context.__loadAds, 'function');
    const configs = dataLayer.filter(entry=>entry[0]==='config');
    const allowed = hostname==='solvex-ai3d.com' && granted;
    assert.equal(scripts.length, allowed ? 1 : 0);
    assert.deepEqual(configs.map(entry=>entry[1]), allowed ? ['G-VW0JHKW0ZW','AW-17512988470'] : []);
    assert.equal(dataLayer[0][0], 'consent');
    assert.equal(dataLayer[0][2].analytics_storage, 'denied');
    assert.equal(dataLayer[0][2].ad_personalization, 'denied');
    if (allowed) {
      assert.equal(configs[0][2].debug_mode, undefined);
      assert.equal(configs[1][2].allow_enhanced_conversions, true);
      vm.runInContext('window.__loadGA4(); window.__loadAds();', context);
      assert.equal(scripts.length, 1, 'one script even when both callbacks repeat');
    }
    if (hostname !== 'solvex-ai3d.com') {
      vm.runInContext('window.__loadGA4(); window.__loadAds();', context);
      assert.equal(scripts.length,0,'direct callback invocation also contained');
      assert.equal(dataLayer.filter(entry=>entry[0]==='config').length,0);
    }
  });
}
test('task36 exact source delta and six-form frozen engines', () => assertLaunch36Sources(root));
test('task36 output guard rejects checked including false-valued boolean attributes', () => {
  for (const id of ['privacy','mf_privacy','sd-privacy']) {
    assertLaunch36Html('/fixture', `<input id="${id}" name="privacy" type="checkbox" required>`);
    for (const checked of ['checked','checked="false"']) assert.throws(()=>assertLaunch36Html('/fixture', `<input id="${id}" name="privacy" required ${checked}>`));
  }
  assert.throws(()=>assertLaunch36Html('/fixture', html.replace("if (location.hostname !== 'solvex-ai3d.com') return;",'')));
});
test('task36 historical exceptions do not hide unrelated changes', () => {
  assert.equal(beforeReadiness36('unrelated.html','<input name="privacy">'),'<input name="privacy">');
  assert.ok(beforeLegacyHostGuard36(script + '\nUNAUTHORIZED').endsWith('UNAUTHORIZED'));
  assert.equal(beforeLegacyHostGuard36(script).includes("if (location.hostname !== 'solvex-ai3d.com') return;"),false);
  assert.equal(beforeLegacyHostGuard36(script.replace(/\s+/g,' ').trim()), beforeLegacyHostGuard36(script).replace(/\s+/g,' ').trim());
});
test('task36 frozen thank-you remains scriptless and cannot create a conversion', () => {
  const thankYou = fs.readFileSync(path.join(root, 'richiesta-ricevuta.html'), 'utf8');
  assert.doesNotMatch(thankYou, /<script\b|\bon\w+\s*=|gtag|dataLayer|solvex_lead_success/i);
  assert.match(thankYou, /noindex,nofollow/);
});
