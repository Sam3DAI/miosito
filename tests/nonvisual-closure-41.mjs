import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {readGitBlobBuffer} from './git-binary-reader.mjs';
export const BASE_41 = 'f06d7ad296cae2b3968916f8075c341e6dcef7f6';
const lf = text => text.replace(/\r\n/g,'\n');
// Exact reviewed consumer deltas only: the rest of both files, including 3D, stays frozen.
export const edits41 = Object.freeze({
  "js/contattaci.js": [
    [
      "    return valid;",
      "    if (!valid) {\n      // Follow the visible form order; the disabled native fallback is never a focus target.\n      const firstService = servicesChecked === 0\n        ? Array.from(serviceCheckboxes).find((field) => !field.disabled && field.getClientRects().length)\n        : null;\n      const firstInvalid = [nameInput, emailInput, phoneInput, firstService, messageInput, privacy]\n        .find((field) => field && !field.disabled && field.getClientRects().length\n          && (field === firstService || field.classList.contains('error')));\n      if (firstInvalid) {\n        firstInvalid.focus({ preventScroll: true });\n        const bounds = firstInvalid.getBoundingClientRect();\n        const offset = Math.max(0, header?.getBoundingClientRect().bottom || 0) + 16;\n        if (bounds.top < offset || bounds.bottom > window.innerHeight - 16) {\n          // No animation, including when reduced motion is requested.\n          window.scrollTo({ top: Math.max(0, window.scrollY + bounds.top - offset), behavior: 'instant' });\n        }\n      }\n    }\n    return valid;"
    ]
  ],
  "js/configuratori-3d-2d.js": [
    [
      "      return [nameI, emailI, projectTypeI, msgI, privacyI].every((field) => field && !field.classList.contains('error'));",
      "      const fields = [nameI, emailI, projectTypeI, msgI, privacyI];\n      const valid = fields.every((field) => field && !field.classList.contains('error'));\n      if (!valid) {\n        const firstInvalid = fields.find((field) => field && !field.disabled\n          && field.getClientRects().length && field.classList.contains('error'));\n        if (firstInvalid) {\n          firstInvalid.focus({ preventScroll: true });\n          const bounds = firstInvalid.getBoundingClientRect();\n          const offset = Math.max(0, header?.getBoundingClientRect().bottom || 0) + 16;\n          if (bounds.top < offset || bounds.bottom > window.innerHeight - 16) {\n            // No animation, including when reduced motion is requested.\n            window.scrollTo({ top: Math.max(0, window.scrollY + bounds.top - offset), behavior: 'instant' });\n          }\n        }\n      }\n      return valid;"
    ]
  ]
});
export function beforeNonvisual41(file,input) {
  let text=lf(input);
  for(const [before,after] of edits41[file]||[]) text=text.replace(after,before);
  return text;
}
export function assertHeaders41(input,target='candidate') {
  assert.ok(['candidate','staging'].includes(target));
  const expected='[build]\n  command = "npm run build"\n  publish = "_site"\n\n[[headers]]\n  for = "/*"\n  [headers.values]\n    X-Content-Type-Options = "nosniff"\n    Referrer-Policy = "strict-origin-when-cross-origin"\n'
    +(target==='staging'?'    X-Robots-Tag = "noindex, nofollow, noarchive, nosnippet"\n':'');
  assert.equal(lf(input).trimEnd(),expected.trimEnd(),'One global block, two exact basic headers; staging-only noindex');
}
export function assertNonvisual41Sources(root,target=process.env.SOLVEX_VERIFY_TARGET||'candidate') {
  for(const [file,pairs] of Object.entries(edits41)) {
    const old=lf(readGitBlobBuffer(BASE_41,file,root).buffer.toString('utf8'));
    let expected=old;
    for(const [before,after] of pairs) {
      assert.equal(expected.split(before).length,2,file+': unique focus replacement');
      expected=expected.replace(before,after);
    }
    assert.equal(lf(fs.readFileSync(path.join(root,file),'utf8')),expected,file+': no edits beyond invalid-field focus');
  }
  assertHeaders41(fs.readFileSync(path.join(root,'netlify.toml'),'utf8'),target);
  for(const file of ['package.json','package-lock.json','js/netlify-lead-form.js','js/service-demo-form.js','js/ad-attribution-consent.js','js/ga-autotrack.js','js/cookie-banner.js','css/cookie-banner.css','js/site-shell.js','src/contattaci.njk','src/configuratori-3d-2d.njk','src/_data/serviceDemos.json','src/_data/measurement.json','src/_includes/partials/measurement-bootstrap.njk']) {
    assert.equal(lf(fs.readFileSync(path.join(root,file),'utf8')),lf(readGitBlobBuffer(BASE_41,file,root).buffer.toString('utf8')),file+': task41 immutable');
  }
  return {result:'PASS',baseline:BASE_41,headers:['nosniff','strict-origin-when-cross-origin'],focusConsumers:2,enginesAndDependencies:'UNCHANGED'};
}
