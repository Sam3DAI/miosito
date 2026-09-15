import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { readGitBlobBuffer } from './git-binary-reader.mjs';

export const BASE_36 = '59cdd85307b1dca27c4ab5ab2c82c845d2dddd9a';
const lf = value => value.replace(/\r\n/g, '\n');
const guard = "      if (location.hostname !== 'solvex-ai3d.com') return;\n";
const loaders = [
  '    window.__loadGA4 = function(){ // Statistiche\n',
  '    window.__loadAds = function(){ // Marketing (solo misurazione conversioni)\n'
];
const privacyTags = {
  'src/contattaci.njk': '<input type="checkbox" id="privacy" name="privacy" required aria-required="true" aria-describedby="privacy-error">',
  'src/configuratori-3d-2d.njk': '<input type="checkbox" id="mf_privacy" name="privacy" required aria-required="true" aria-describedby="mf_privacy_err">'
};

// Exact task36 exception for older freeze oracles, never a generic sanitizer.
export function beforeLegacyHostGuard36(input) {
  let text = lf(input);
  for (const loader of loaders) {
    text = text.replace(loader + guard, loader);
    // verify.mjs also compares scripts after its existing whitespace collapse.
    text = text.replace(loader.trim() + ' ' + guard.trim() + ' ', loader.trim() + ' ');
  }
  return text;
}
export function beforeReadiness36(file, input) {
  const text = lf(input), tag = privacyTags[file];
  return tag ? text.replace(tag, tag.slice(0, -1) + ' checked>') : text;
}

export function assertLaunch36Sources(root) {
  const old = file => lf(readGitBlobBuffer(BASE_36, file, root).buffer.toString('utf8'));
  const read = file => lf(fs.readFileSync(path.join(root, file), 'utf8'));
  for (const [file, tag] of Object.entries(privacyTags)) {
    const checked = tag.slice(0, -1) + ' checked>';
    assert.equal(old(file).split(checked).length, 2, file + ': one baseline checkbox');
    assert.equal(read(file), old(file).replace(checked, tag), file + ': only checked removal');
  }
  const bootstrap = 'src/_includes/partials/measurement-bootstrap.njk';
  let expected = old(bootstrap);
  for (const loader of loaders) {
    assert.equal(expected.split(loader).length, 2);
    expected = expected.replace(loader, loader + guard);
  }
  assert.equal(read(bootstrap), expected, 'Exactly two legacy loader guards; GTM, consent and attribution unchanged');
  for (const file of ['js/cookie-banner.js','js/netlify-lead-form.js','js/ad-attribution-consent.js','js/contattaci.js','js/configuratori-3d-2d.js','js/service-demo-form.js','js/ga-autotrack.js','src/_data/measurement.json','src/_data/serviceDemos.json','src/_includes/partials/service-demo-form.njk']) {
    assert.equal(read(file), old(file), file + ': frozen in task36');
  }
  return {result:'PASS', baseline:BASE_36, productFiles:3, privacyDefaultsRemoved:2, legacyHostGuards:2, frozenEngines:'UNCHANGED'};
}

export function assertLaunch36Html(route, html) {
  const privacy = [...html.matchAll(/<input\b[^>]*\bname="privacy"[^>]*>/g)].map(m => m[0]);
  for (const tag of privacy) {
    assert.equal(privacy.length, 1, route + ': unique privacy control');
    assert.match(tag, /\brequired\b/);
    assert.doesNotMatch(tag, /\bchecked(?:\s|=|>)/, route + ': privacy must start and reset unchecked');
  }
  if (html.includes('window.__loadGA4 = function(){')) {
    for (const loader of loaders) assert.ok(lf(html).includes(loader + guard), route + ': exact guarded loader');
  }
}
