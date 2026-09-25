import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { compareRawBuffers, readGitBlobBuffer } from './git-binary-reader.mjs';

export const UTILITY_CTA47_BASE = '887198eb0e7f9bd956ebc32010057d6d03706c4b';
export const UTILITY_CTA47_FROZEN_FILES = Object.freeze(['css/404.css', 'richiesta-ricevuta.html']);
const baselineRecords = Object.freeze({
  'richiesta-ricevuta.html': Object.freeze({ objectId: 'e9b4f67aa6d9348d5083871e8e1040edaa0ff87b', sha256: '6f16caad0a767c6cdea3e5fa633ac5655847e25bdd3a66e37a400e9afacbaebf' }),
  '404.html': Object.freeze({ objectId: '84ab52dd75058506a18b41f433cb9a3d99416b59', sha256: 'fcd98bb4b7f2d4b5210d47b319be4ed2f2668e0984e4a7af10fcf97e8e4b77cb' }),
  'css/404.css': Object.freeze({ objectId: 'd969938e8462794299ca13bf622d49c8d0cdc016', sha256: '04a35f15d834f4738f2fecdfead773aec9fcda4311bf8532b4ba6aac5795f48c' })
});
const lf = value => value.toString('utf8').replace(/\r\n/g, '\n');
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const count = (input, literal) => input.split(literal).length - 1;

// T47-15: only the two existing utility CTAs and their scoped CSS may differ.
// The surrounding document is always compared with an independently pinned
// Git blob; no whole-file rollback, old/new fallback or generic sanitizer.
const thankyouEdits = Object.freeze([
  Object.freeze({
    id: 'EXPLORE_REST_BORDER',
    before: '    a { display: inline-block; margin-top: 12px; padding: 12px 20px; border-radius: 999px; background: #1677d2; color: #fff; text-decoration: none; font-weight: 700; }',
    after: '    .button--explore { display: inline-block; margin-top: 12px; padding: 11px 19px; border: 1px solid #d95bc5; border-radius: 999px; background: transparent; color: #993588; text-decoration: none; font-weight: 700; }'
  }),
  Object.freeze({
    id: 'EXPLORE_STATES_FOCUS',
    before: '    a:focus-visible { outline: 3px solid #8b5cf6; outline-offset: 3px; }',
    after: [
      '    .button--explore:focus-visible { outline: 3px solid #006eac; outline-offset: 3px; }',
      '    @media (prefers-color-scheme: dark) {',
      '      .button--explore { color: #d95bc5; }',
      '      .button--explore:focus-visible { outline-color: #45b6fe; }',
      '    }',
      '    .button--explore:active { background: #d95bc5; color: #fff; }',
      '    @media (hover: hover) and (pointer: fine) {',
      '      .button--explore:hover { background: #d95bc5; color: #fff; }',
      '    }',
      '    @media (forced-colors: active) {',
      '      .button--explore, .button--explore:is(:hover, :active, :focus-visible) { border-color: ButtonText; background: ButtonFace; color: ButtonText; }',
      '    }'
    ].join('\n')
  }),
  Object.freeze({
    id: 'EXPLICIT_EXPLORE_ANCHOR',
    before: '    <a href="/">Torna al sito SolveX AI3D</a>',
    after: '    <a class="button button--explore" data-cta-role="explore" href="/">Torna al sito SolveX AI3D</a>'
  })
]);

const notFoundEdits = Object.freeze([
  Object.freeze({
    id: 'EXPLICIT_404_EXPLORE_ANCHOR',
    before: '    <a href="/" class="btn-home">Torna alla Home</a>',
    after: '    <a href="/" class="btn-home button--explore" data-cta-role="explore">Torna alla Home</a>'
  })
]);
const notFoundCssEdits = Object.freeze([
  Object.freeze({
    id: 'SCOPED_404_EXPLORE_STATES',
    before: [
      '.btn-home {',
      '  margin-top: 25px;',
      '  padding: 12px 28px;',
      '  border-radius: 40px;',
      '  background-color: #45b6fe;',
      '  color: #fff;',
      '  font-weight: 600;',
      '  text-decoration: none;',
      '  transition: background-color 0.3s ease;',
      '}',
      '.btn-home:hover { background-color: #5ec2fe; }'
    ].join('\n'),
    after: [
      '.btn-home.button--explore {',
      '  --explore-text: #993588;',
      '  --explore-focus: #006eac;',
      '  margin-top: 25px;',
      '  padding: 11px 27px;',
      '  border: 1px solid #d95bc5;',
      '  border-radius: 40px;',
      '  background-color: transparent;',
      '  color: var(--explore-text);',
      '  font-weight: 600;',
      '  text-decoration: none;',
      '  transition: background-color 0.3s ease;',
      '}',
      'body.dark-mode .btn-home.button--explore { --explore-text: #d95bc5; --explore-focus: #45b6fe; }',
      '.btn-home.button--explore:focus-visible { outline: 3px solid var(--explore-focus); outline-offset: 3px; }',
      '.btn-home.button--explore:active { background-color: #d95bc5; color: #fff; }',
      '@media (hover: hover) and (pointer: fine) {',
      '  .btn-home.button--explore:hover { background-color: #d95bc5; color: #fff; }',
      '}',
      '@media (forced-colors: active) {',
      '  .btn-home.button--explore, .btn-home.button--explore:is(:hover, :active, :focus-visible) { border-color: ButtonText; background-color: ButtonFace; color: ButtonText; }',
      '}'
    ].join('\n')
  })
]);
export const utilityCta47Edits = Object.freeze({
  'richiesta-ricevuta.html': thankyouEdits,
  '404.html': notFoundEdits,
  'css/404.css': notFoundCssEdits
});
export const UTILITY_CTA47_FILES = Object.freeze(Object.keys(utilityCta47Edits));

function pinnedBaseline(file, input) {
  assert.ok(Object.hasOwn(baselineRecords, file), 'T47-15 exact file scope');
  const text = lf(input);
  assert.equal(sha256(text), baselineRecords[file].sha256, file + ': T47-15 requires the exact independent baseline Git blob');
  return text;
}

export function afterUtilityCta47(file, baseline) {
  let current = pinnedBaseline(file, baseline);
  for (const edit of utilityCta47Edits[file]) {
    assert.equal(count(current, edit.before), 1, edit.id + ': exactly one baseline callsite');
    assert.equal(count(current, edit.after), 0, edit.id + ': new callsite must not already exist');
    current = current.replace(edit.before, edit.after);
  }
  return current;
}

export function beforeUtilityCta47(file, input) {
  assert.ok(Object.hasOwn(utilityCta47Edits, file), 'T47-15 reverse requires an exact utility file');
  let current = lf(input);
  for (const edit of utilityCta47Edits[file]) {
    assert.equal(count(current, edit.after), 1, edit.id + ': exactly one approved callsite');
    assert.equal(count(current, edit.before), 0, edit.id + ': obsolete callsite must be absent');
    current = current.replace(edit.after, edit.before);
  }
  return current;
}

export function assertUtilityCta47Delta(file, current, baseline) {
  const normalized = lf(current), original = pinnedBaseline(file, baseline);
  assert.equal(normalized, afterUtilityCta47(file, original), file + ': T47-15 permits only exact CTA/CSS literals');
  assert.equal(beforeUtilityCta47(file, normalized), original, file + ': T47-15 preserves every other byte apart from CRLF/LF');
  if (file === 'richiesta-ricevuta.html') {
    assert.equal((normalized.match(/<a\b/g) || []).length, 1, 'Exactly one existing thank-you anchor');
    assert.match(normalized, /<meta name="robots" content="noindex,nofollow">/);
    assert.doesNotMatch(normalized, /<script\b|<form\b|<iframe\b|\bon\w+\s*=|gtag|dataLayer|solvex_lead_success/i, 'Thank-you stays scriptless, formless and event-free');
  }
  if (file === '404.html') {
    assert.equal((normalized.match(/<a\b/g) || []).length, 2, 'Existing logo and one 404 CTA only');
    assert.match(normalized, /<script defer src="\/js\/404.js"><\/script>/);
    assert.doesNotMatch(normalized, /<form\b|<iframe\b|http-equiv=["']refresh|\bon\w+\s*=|gtag|dataLayer|canonical/i, '404 cannot introduce redirect, form or measurement');
  }
  return { file, result: 'PASS_EXACT_CTA_LITERALS', baseline: UTILITY_CTA47_BASE, baselineSha256: baselineRecords[file].sha256, normalizedSourceSha256: sha256(normalized), eolNormalization: 'CRLF_TO_LF_FOR_TEXT_DELTA_ONLY' };
}

function readBaseline(root, file) {
  assert.ok(Object.hasOwn(baselineRecords, file), 'T47-15 exact file scope');
  const baseline = readGitBlobBuffer(UTILITY_CTA47_BASE, file, root);
  assert.equal(baseline.objectId, baselineRecords[file].objectId, file + ': T47-15 baseline object identity changed');
  return baseline.buffer;
}

export function assertUtilityCta47Source(root, file) {
  assert.ok(Object.hasOwn(utilityCta47Edits, file), 'T47-15 exact file scope');
  const source = fs.readFileSync(path.join(root, file));
  return { ...assertUtilityCta47Delta(file, source, readBaseline(root, file)), sourceSha256: sha256(source), sourceBytes: source.length };
}

export function assertUtilityCta47Sources(root) {
  return { result: 'PASS', files: UTILITY_CTA47_FILES.map(file => assertUtilityCta47Source(root, file)) };
}

export function isUtilityCta47ProductFile(file, root) {
  if (!Object.hasOwn(utilityCta47Edits, file)) return false;
  assertUtilityCta47Source(root, file);
  return true;
}

export function assertUtilityCta47RawCopy(file, source, output, baseline) {
  assertUtilityCta47Delta(file, source, baseline);
  assertUtilityCta47Delta(file, output, baseline);
  return compareRawBuffers(source, output, file + ': T47-15 RAW passthrough');
}

export function assertUtilityCta47Output(root, outputRoot) {
  return {
    result: 'PASS',
    files: UTILITY_CTA47_FILES.map(file => ({
      file,
      ...assertUtilityCta47RawCopy(file, fs.readFileSync(path.join(root, file)), fs.readFileSync(path.join(outputRoot, file)), readBaseline(root, file))
    }))
  };
}
