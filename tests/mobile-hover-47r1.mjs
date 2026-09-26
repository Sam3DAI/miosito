import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {readGitBlobBuffer} from './git-binary-reader.mjs';

export const MOBILE_BASE47R1 = 'b643f3cd544ac29c41e3bbe98886e29a2878bf84';
export const HOVER_QUERY47R1 = '(hover: hover) and (pointer: fine)';
const lf = text => text.replace(/\r\n/g, '\n');
// Twelve explicit presentation-only replacements. Never infer an oracle from
// the current CSS, roll back an entire file, or accept old and new interchangeably.
export const mobileHoverEdits47R1 = Object.freeze({
  'css/site-shell.css': [
    ['.theme-toggle:hover {\n  border-color: var(--sx-blue);\n  transform: translateY(-1px);\n}', '@media (hover: hover) and (pointer: fine) {\n  .theme-toggle:hover {\n    border-color: var(--sx-blue);\n    transform: translateY(-1px);\n  }\n}'],
    ['.site-navigation__trigger:hover {\n  color: var(--sx-blue-deep);\n}', '@media (hover: hover) and (pointer: fine) {\n  .site-navigation__trigger:hover {\n    color: var(--sx-blue-deep);\n  }\n}'],
    ['.site-navigation__solutions a:hover,\n.site-navigation__solutions a:focus-visible,\n.site-navigation__solutions a[aria-current="page"] {\n  color: var(--sx-blue-deep);\n}', '.site-navigation__solutions a:focus-visible,\n.site-navigation__solutions a[aria-current="page"] {\n  color: var(--sx-blue-deep);\n}\n@media (hover: hover) and (pointer: fine) {\n  .site-navigation__solutions a:hover { color: var(--sx-blue-deep); }\n}'],
    ['.site-navigation__secondary-links a:hover,\n.site-navigation__secondary-links a[aria-current="page"] {\n  color: var(--sx-blue-deep);\n}', '.site-navigation__secondary-links a[aria-current="page"] {\n  color: var(--sx-blue-deep);\n}\n@media (hover: hover) and (pointer: fine) {\n  .site-navigation__secondary-links a:hover { color: var(--sx-blue-deep); }\n}'],
    ['.site-navigation__social a:hover .social-icon__gradient,\n.site-navigation__social a:focus-visible .social-icon__gradient,\n.site-footer__social a:hover .social-icon__gradient,\n.site-footer__social a:focus-visible .social-icon__gradient { opacity: 1; }', '.site-navigation__social a:focus-visible .social-icon__gradient,\n.site-footer__social a:focus-visible .social-icon__gradient { opacity: 1; }\n@media (hover: hover) and (pointer: fine) {\n  .site-navigation__social a:hover .social-icon__gradient,\n  .site-footer__social a:hover .social-icon__gradient { opacity: 1; }\n}'],
    ['.breadcrumb a:hover {\n  color: var(--sx-blue-deep);\n}', '@media (hover: hover) and (pointer: fine) {\n  .breadcrumb a:hover {\n    color: var(--sx-blue-deep);\n  }\n}'],
    ['.site-footer__column a:hover,\n.site-footer__column a[aria-current="page"] {\n  color: var(--sx-blue-deep);\n}', '.site-footer__column a[aria-current="page"] {\n  color: var(--sx-blue-deep);\n}\n@media (hover: hover) and (pointer: fine) {\n  .site-footer__column a:hover { color: var(--sx-blue-deep); }\n}']
  ],
  'css/marketing-pages.css': [
    ['.visual-card-rail__controls button:hover:not(:disabled) { color: var(--sx-blue-deep); }', '@media (hover: hover) and (pointer: fine) {\n  .visual-card-rail__controls button:hover:not(:disabled) { color: var(--sx-blue-deep); }\n}']
  ],
  'css/cookie-banner.css': [
    ['.cc-btn:hover { background:#45b6fe; color:#fff; }', '@media (hover: hover) and (pointer: fine) {\n  .cc-btn:hover { background:#45b6fe; color:#fff; }\n}'],
    ['.cc-allow:hover { opacity:.9; }', '@media (hover: hover) and (pointer: fine) {\n  .cc-allow:hover { opacity:.9; }\n}'],
    ['.cc-revoke:hover { opacity:1; }', '@media (hover: hover) and (pointer: fine) {\n  .cc-revoke:hover { opacity:1; }\n}'],
    ['.cc-window :focus { outline: 2px solid #45b6fe; outline-offset: 2px; }', '.cc-window :focus-visible { outline: 2px solid #45b6fe; outline-offset: 2px; }']
  ]
});
export const mobileHoverFiles47R1 = Object.freeze(Object.keys(mobileHoverEdits47R1));
const baselineCache = new Map();
function baselineSource(root, file) {
  const key = path.resolve(root) + '\0' + file;
  if (!baselineCache.has(key)) baselineCache.set(key, readGitBlobBuffer(MOBILE_BASE47R1, file, root).buffer.toString('utf8'));
  return baselineCache.get(key);
}

export function afterMobileHover47R1(file, baseline) {
  let expected = lf(baseline);
  const edits = mobileHoverEdits47R1[file];
  assert(edits, 'No implicit file exception');
  for (const [before, after] of edits) {
    assert(before && after && before !== after && before.length < baseline.length);
    assert.equal(expected.split(before).length, 2, file + ': unique baseline callsite');
    expected = expected.replace(before, after);
  }
  return expected;
}

// Historical comparisons only. A partial/mutated/duplicated known delta throws;
// unknown surrounding bytes are retained so earlier full-source guards reject them.
export function beforeMobileHover47R1(file, input) {
  let text = lf(input);
  const edits = mobileHoverEdits47R1[file];
  if (!edits || !edits.some(([, after]) => text.includes(after))) return text;
  for (const [before, after] of edits) {
    assert.equal(text.split(after).length, 2, file + ': complete unique current mobile fix required');
    text = text.replace(after, before);
  }
  return text;
}

export function assertMobileHoverDelta47R1(file, current, baseline) {
  assert.equal(lf(current), afterMobileHover47R1(file, baseline), file + ': only twelve explicit mobile presentation edits');
  assert.equal(beforeMobileHover47R1(file, current), lf(baseline));
  assert.equal(beforeMobileHover47R1(file, baseline), lf(baseline));
}

export function assertMobileHoverSources47R1(root) {
  for (const file of mobileHoverFiles47R1) {
    const baseline = baselineSource(root, file);
    assertMobileHoverDelta47R1(file, fs.readFileSync(path.join(root, file), 'utf8'), baseline);
  }
  return {result:'PASS',baseline:MOBILE_BASE47R1,cssFiles:3,literalPairs:12,scope:'HOVER_CAPABILITY_AND_COOKIE_FOCUS_VISIBLE_ONLY',hardwareTouch:'NOT_TESTED'};
}

export function isMobileHoverProduct47R1(file, root) {
  if (!mobileHoverFiles47R1.includes(file)) return false;
  assertMobileHoverDelta47R1(file, fs.readFileSync(path.join(root, file), 'utf8'), baselineSource(root, file));
  return true;
}

export function assertMobileHoverOutput47R1(root, outputRoot) {
  const source = assertMobileHoverSources47R1(root);
  for (const file of mobileHoverFiles47R1) assert.deepEqual(fs.readFileSync(path.join(outputRoot, file)), fs.readFileSync(path.join(root, file)), file + ': actual build consumes reviewed CSS RAW');
  return {...source,outputBinding:'RAW_EXACT'};
}
