import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { readGitBlobBuffer } from './git-binary-reader.mjs';
import {
  UTILITY_CTA47_BASE, UTILITY_CTA47_FILES, UTILITY_CTA47_FROZEN_FILES,
  utilityCta47Edits, afterUtilityCta47, beforeUtilityCta47,
  assertUtilityCta47Delta, assertUtilityCta47Sources, assertUtilityCta47RawCopy,
  isUtilityCta47ProductFile
} from './utility-cta47.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lf = value => value.toString('utf8').replace(/\r\n/g, '\n');
const baseline = Object.fromEntries(UTILITY_CTA47_FILES.map(file => [file, readGitBlobBuffer(UTILITY_CTA47_BASE, file, root).buffer]));
const current = file => fs.readFileSync(path.join(root, file));
function rejectsChanged(file, mutate) {
  const original = lf(current(file)), changed = mutate(original);
  assert.notEqual(changed, original, file + ': negative mutation must really change the input');
  assert.throws(() => assertUtilityCta47Delta(file, changed, baseline[file]), file + ': unauthorized mutation');
}

test('47 utility CTA source is exactly five literal edits against the independent Git baseline', () => {
  assert.deepEqual(UTILITY_CTA47_FILES, ['richiesta-ricevuta.html', '404.html', 'css/404.css']);
  assert.deepEqual(UTILITY_CTA47_FROZEN_FILES, ['css/404.css', 'richiesta-ricevuta.html']);
  assert.equal(Object.values(utilityCta47Edits).flat().length, 5);
  const result = assertUtilityCta47Sources(root);
  assert.equal(result.result, 'PASS');
  assert.equal(result.files.length, 3);
  for (const file of UTILITY_CTA47_FILES) {
    assert.equal(lf(current(file)), afterUtilityCta47(file, baseline[file]));
    assert.equal(beforeUtilityCta47(file, current(file)), lf(baseline[file]));
  }
});

test('47 utility CTA cannot accept the old document, a partial change or double application', () => {
  for (const file of UTILITY_CTA47_FILES) {
    assert.throws(() => assertUtilityCta47Delta(file, baseline[file], baseline[file]));
    assert.throws(() => afterUtilityCta47(file, current(file)));
    assert.throws(() => beforeUtilityCta47(file, baseline[file]));
    for (const edit of utilityCta47Edits[file]) {
      rejectsChanged(file, text => text.replace(edit.after, edit.before));
      rejectsChanged(file, text => text.replace(edit.after, edit.after + '\n' + edit.after));
    }
  }
});

test('47 utility CTA baseline cannot be replaced with a caller-modified or different file', () => {
  for (const file of UTILITY_CTA47_FILES) {
    assert.throws(() => afterUtilityCta47(file, Buffer.concat([baseline[file], Buffer.from('\n')])), /independent baseline/);
    assert.throws(() => assertUtilityCta47Delta(file, current(file), baseline[file].toString().replace('SolveX', 'Other').replace('margin-top: 25px', 'margin-top: 26px')), /independent baseline/);
  }
  assert.throws(() => afterUtilityCta47('js/404.js', ''), /exact file scope/);
  assert.throws(() => beforeUtilityCta47('js/404.js', ''), /exact utility file/);
  assert.equal(isUtilityCta47ProductFile('js/404.js', root), false);
  assert.equal(isUtilityCta47ProductFile('css/unrelated.css', root), false);
});

test('47 utility CTA literal inverse preserves unauthorized material instead of hiding it', () => {
  for (const file of UTILITY_CTA47_FILES) {
    const changed = lf(current(file)) + '\nUNAUTHORIZED_T47_15';
    assert.ok(beforeUtilityCta47(file, changed).endsWith('UNAUTHORIZED_T47_15'));
    assert.throws(() => assertUtilityCta47Delta(file, changed, baseline[file]));
  }
});

test('47 utility CTA preserves each native destination, copy and metadata without adding behavior', () => {
  rejectsChanged('richiesta-ricevuta.html', s => s.replace('href="/"', 'href="/contattaci"'));
  rejectsChanged('richiesta-ricevuta.html', s => s.replace('Torna al sito SolveX AI3D', 'Apri una demo'));
  rejectsChanged('richiesta-ricevuta.html', s => s.replace('noindex,nofollow', 'index,follow'));
  rejectsChanged('richiesta-ricevuta.html', s => s.replace('</body>', '<script>fetch("/provider")</script></body>'));
  rejectsChanged('richiesta-ricevuta.html', s => s.replace('</main>', '<form method="post"></form></main>'));
  rejectsChanged('richiesta-ricevuta.html', s => s.replace('data-cta-role="explore"', 'onclick="submit()" data-cta-role="explore"'));
  rejectsChanged('404.html', s => s.replace('class="btn-home button--explore"', 'class="btn-home"'));
  rejectsChanged('404.html', s => s.replace('href="/" class="btn-home', 'href="/contattaci" class="btn-home'));
  rejectsChanged('404.html', s => s.replace('Torna alla Home', 'Apri il negozio'));
  rejectsChanged('404.html', s => s.replace('<h1>404</h1>', '<h1>200</h1>'));
  rejectsChanged('404.html', s => s.replace('</head>', '<meta http-equiv="refresh" content="0;url=/"></head>'));
  rejectsChanged('404.html', s => s.replace('/js/404.js', '/js/changed.js'));
  rejectsChanged('404.html', s => s.replace('</main>', '<form method="post"></form></main>'));
  rejectsChanged('404.html', s => s.replace('data-cta-role="explore"', 'onclick="navigate()" data-cta-role="explore"'));
  rejectsChanged('404.html', s => s.replace('aria-pressed="false"', 'aria-pressed="true"'));
});

test('47 utility CTA uses theme-correct magenta, distinct focus and fine-pointer hover only', () => {
  const thank = lf(current('richiesta-ricevuta.html')), error = lf(current('css/404.css'));
  assert.match(thank, /background: transparent; color: #993588;/);
  assert.match(thank, /outline: 3px solid #006eac; outline-offset: 3px/);
  assert.match(thank, /@media \(prefers-color-scheme: dark\) \{\n      \.button--explore \{ color: #d95bc5; \}\n      \.button--explore:focus-visible \{ outline-color: #45b6fe; \}/);
  assert.doesNotMatch(thank, /light-dark\(/);
  assert.match(error, /body\.dark-mode \.btn-home\.button--explore \{ --explore-text: #d95bc5; --explore-focus: #45b6fe; \}/);
  for (const [source, selector, property] of [[thank, '.button--explore', 'background'], [error, '.btn-home.button--explore', 'background-color']]) {
    assert.ok(source.includes(selector + ':active { ' + property + ': #d95bc5; color: #fff; }'));
    assert.ok(source.includes('@media (hover: hover) and (pointer: fine) {\n' + (source === thank ? '      ' : '  ') + selector + ':hover { ' + property + ': #d95bc5; color: #fff; }'));
    const focus = source.split(selector + ':focus-visible {')[1].split('}')[0];
    assert.doesNotMatch(focus, /background|color:/);
    assert.ok(source.includes('@media (forced-colors: active)'));
  }
});

test('47 utility CTA preserves outer padding geometry and rejects border, focus or palette drift', () => {
  const thank = lf(current('richiesta-ricevuta.html')), error = lf(current('css/404.css'));
  assert.match(thank, /padding: 11px 19px; border: 1px solid #d95bc5/);
  assert.match(error, /padding: 11px 27px;\n  border: 1px solid #d95bc5/);
  assert.equal(11 + 1, 12);
  assert.equal(19 + 1, 20);
  assert.equal(27 + 1, 28);
  for (const file of ['richiesta-ricevuta.html', 'css/404.css']) {
    rejectsChanged(file, s => s.replace('border: 1px solid #d95bc5', 'border: 2px solid #d95bc5'));
    rejectsChanged(file, s => s.replace('@media (hover: hover) and (pointer: fine)', '@media (min-width: 0px)'));
    rejectsChanged(file, s => s.replace(':focus-visible { outline:', ':focus-visible { background: #d95bc5; outline:'));
    rejectsChanged(file, s => s.replace('color: #fff;', 'color: #1d1d1f;'));
    rejectsChanged(file, s => s.replace('#993588', '#1677d2'));
  }
  rejectsChanged('richiesta-ricevuta.html', s => s.replace('background: #f5f7fb', 'background: #000'));
  rejectsChanged('css/404.css', s => s.replace('background-color: #fafafa', 'background-color: #fff'));
  rejectsChanged('css/404.css', s => s.replace('linear-gradient(90deg, #45b6fe, #d95bc5)', 'none'));
});

test('47 utility CTA keeps RAW source-output identity even when text EOL normalization would pass', () => {
  for (const file of UTILITY_CTA47_FILES) {
    const source = current(file);
    assert.equal(assertUtilityCta47RawCopy(file, source, Buffer.from(source), baseline[file]).result, 'PASS');
    const changed = Buffer.from(source.includes(Buffer.from('\r\n')) ? source.toString().replace(/\r\n/g, '\n') : source.toString().replace(/\n/g, '\r\n'));
    assert.notDeepEqual(changed, source);
    assertUtilityCta47Delta(file, changed, baseline[file]);
    assert.throws(() => assertUtilityCta47RawCopy(file, source, changed, baseline[file]), /RAW passthrough/);
  }
});

function assertVerifierWiring(source) {
  const guard = 'const utilityCta47Evidence = assertUtilityCta47Sources(root);';
  const filter = 'const unchangedFrozenFiles47 = EXPECTED_FROZEN_PASSTHROUGH_FILES.filter(file => !UTILITY_CTA47_FROZEN_FILES.includes(file));';
  const diff = 'BASE_COMMIT, "--", ...unchangedFrozenFiles47]);';
  assert.equal(source.split(guard).length, 2);
  assert.equal(source.split(filter).length, 2);
  assert.ok(source.indexOf(guard) < source.indexOf(filter));
  assert.ok(source.indexOf(filter) < source.indexOf(diff));
  assert.ok(source.indexOf(diff) < source.indexOf('\nbuildFromAbsentOutput();'));
  assert.ok(source.includes('assert.equal(unchangedFrozenFiles47.length, 17,'));
  assert.ok(source.includes('assert.deepEqual(UTILITY_CTA47_FROZEN_FILES, ["css/404.css", "richiesta-ricevuta.html"]'));
  assert.ok(source.includes('function verifyBuiltOutput() {\n  const utilityCta47OutputEvidence = assertUtilityCta47Output(root, outputRoot);'));
  assert.ok(source.includes('const rawCopy = compareRawBuffers(source, output, `Frozen passthrough ${file}`);\n  if (UTILITY_CTA47_FROZEN_FILES.includes(file)) {'));
  assert.ok(source.includes('assert.equal(beforeUtilityCta47(file, source), baseline.buffer.toString("utf8").replace(/\\r\\n/g, "\\n"),'));
  assert.ok(source.includes('assert.equal(outputObjectId, sourceObjectId,'));
  assert.ok(source.includes('assert.equal(sourceObjectId, baseline.objectId, `Frozen source differs from Git base: ${file}`);'));
  assert.ok(source.includes('assert.equal(outputObjectId, baseline.objectId, `Frozen output differs from Git base: ${file}`);'));
}

test('47 utility CTA verification wiring requires source, both output passes and the original other-file freeze', () => {
  const verifier = lf(fs.readFileSync(path.join(root, 'tests/verify.mjs')));
  assertVerifierWiring(verifier);
  const removals = [
    'const utilityCta47Evidence = assertUtilityCta47Sources(root);',
    'const utilityCta47OutputEvidence = assertUtilityCta47Output(root, outputRoot);',
    'const rawCopy = compareRawBuffers(source, output, `Frozen passthrough ${file}`);',
    'assert.equal(sourceObjectId, baseline.objectId, `Frozen source differs from Git base: ${file}`);',
    'assert.equal(outputObjectId, baseline.objectId, `Frozen output differs from Git base: ${file}`);'
  ];
  for (const literal of removals) {
    const changed = verifier.replace(literal, '');
    assert.notEqual(changed, verifier);
    assert.throws(() => assertVerifierWiring(changed));
  }
});

test('47 utility CTA historical adapters validate exact content before only the necessary reconstruction', () => {
  const clean = lf(fs.readFileSync(path.join(root, 'tests/clean-images-43.mjs')));
  const retirement = lf(fs.readFileSync(path.join(root, 'tests/legacy-retirement-42r1.mjs')));
  const cleanGuard = 'if (isUtilityCta47ProductFile(file,root)) return true;';
  const retirementGuard = "if(file==='404.html') {\n   assertUtilityCta47Source(root,file);\n   current=beforeUtilityCta47(file,current);\n  }";
  function checked(a, b) {
    assert.equal(a.split(cleanGuard).length, 2);
    assert.equal(b.split(retirementGuard).length, 2);
    assert.ok(b.includes('assertExactRetirement42(file,current,readGitBlobBuffer(BASE_42,file,root).buffer.toString(\'utf8\'));'));
  }
  checked(clean, retirement);
  for (const [a, b] of [[clean.replace(cleanGuard, ''), retirement], [clean, retirement.replace('   assertUtilityCta47Source(root,file);\n', '')]]) {
    assert.ok(a !== clean || b !== retirement);
    assert.throws(() => checked(a, b));
  }
  for (const file of UTILITY_CTA47_FILES) assert.equal(isUtilityCta47ProductFile(file, root), true);
});
