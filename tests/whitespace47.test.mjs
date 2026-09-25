import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import nunjucks from 'nunjucks';
import { root46 } from './site-ui-46.mjs';
import { assertUi47Literals } from './site-ui-47-literals.mjs';
import {
  whitespaceMainKeys47, whitespaceFiles47, whitespaceEdits47, beforeWhitespace47,
  renderWhitespace47, compactIndentation47, assertWhitespaceHtml47,
} from './whitespace47.mjs';

test('T47-14 has fourteen exact source delimiters on five already-authorized files, no permissive source normalization', () => {
  assert.deepEqual(whitespaceFiles47.map(file => whitespaceEdits47(file).length), [2, 3, 3, 3, 3]);
  assert.equal(assertUi47Literals(root46).literalPairs, 71);
  for (const file of whitespaceFiles47) {
    const current = fs.readFileSync(path.join(root46, file), 'utf8');
    const before = beforeWhitespace47(file, current);
    assert.notEqual(before, current);
    assert.doesNotMatch(before, /(?:mainBeforeForm|mainAfterForm|header)Whitespace47/);
  }
});

for (const pageKey of whitespaceMainKeys47) {
  test('T47-14 ' + pageKey + ': exact before/after render, whole form and script/JSON preserved', () => {
    for (const autoescape of [false, true]) {
      const before = renderWhitespace47(pageKey, { before: true, autoescape });
      const after = renderWhitespace47(pageKey, { autoescape });
      assert.equal(after.form, before.form, 'Entire form include is unchanged');
      const result = assertWhitespaceHtml47(before.html, after.html, pageKey, before.form);
      assert.ok(result.savedBytes > 2000, 'Compaction has a measurable bounded benefit');
    }
  });
}

test('T47-14 shared header changes no other main and leaves all six real form contracts untouched', () => {
  for (const pageKey of ['home', 'about', 'configurators', 'contact']) {
    const before = renderWhitespace47(pageKey, { before: true }), after = renderWhitespace47(pageKey);
    const result = assertWhitespaceHtml47(before.html, after.html, pageKey, null);
    assert.ok(result.savedBytes > 1000);
    const main = html => html.match(/<main\b[^>]*>[\s\S]*?<\/main>/)?.[0];
    assert.equal(main(after.html), main(before.html), 'Unlisted main is byte-identical');
  }
});

test('T47-14 rejects copy, attribute, form, inline-separator and outside-scope output changes', () => {
  const before = renderWhitespace47('planner', { before: true });
  const after = renderWhitespace47('planner');
  const mutations = [
    after.html.replace('Composizioni, misure e finiture', 'Composizioni e finiture'),
    after.html.replace('aria-label="Apri il menu principale"', 'aria-label="Apri"'),
    after.html.replace('name="lead_id" value=""', 'name="lead_id" value="changed"'),
    after.html.replace('</strong>\n<small>', '</strong><small>'),
    after.html.replace('<meta charset="UTF-8">', '<meta charset="utf-8">'),
    after.html.replace('Misure e <span class="accent-text">vincoli', 'Misure e<span class="accent-text">vincoli'),
  ];
  for (const changed of mutations) {
    assert.notEqual(changed, after.html, 'Negative must alter its intended input');
    assert.throws(() => assertWhitespaceHtml47(before.html, changed, 'planner', before.form), /exact header\/main output/);
  }
});

test('T47-14 rejects altered capture expression, a missing delimiter and form moved inside compaction', () => {
  const file = 'src/planner-configuratori-arredamento.njk';
  const source = fs.readFileSync(path.join(root46, file), 'utf8');
  const edit = whitespaceEdits47(file)[1];
  const mutations = [
    source.replace(edit.after, edit.after.replace("'>\\n<'", "'><'")),
    source.replace(edit.after, edit.before),
    source.replace(edit.after, '{% include "partials/service-demo-form.njk" %}' + edit.after.replace('{% include "partials/service-demo-form.njk" %}', '')),
  ];
  for (const changed of mutations) {
    assert.notEqual(changed, source);
    assert.throws(() => beforeWhitespace47(file, changed), /current T47-14 delimiter/);
  }
});

test('T47-14 protected fragments are refused, not normalized to conceal data changes', () => {
  for (const tag of ['form', 'script', 'style', 'pre', 'textarea']) {
    assert.throws(() => compactIndentation47('<' + tag + '>\n  <span>literal</span>\n</' + tag + '>'), /Protected content/);
  }
  const sample = '<p>Testo <span>inline</span> testo</p>\n  <a><span>uno</span>\n   <strong>due</strong></a>';
  assert.equal(compactIndentation47(sample), '<p>Testo <span>inline</span> testo</p>\n<a><span>uno</span>\n<strong>due</strong></a>');
});

test('T47-14 captured markup remains escaped before safe output, in both autoescape modes', () => {
  const suffix = whitespaceEdits47('src/_includes/partials/site-header.njk')[1].after.split('</header>')[1].trim();
  for (const autoescape of [false, true]) {
    const env = new nunjucks.Environment(null, { autoescape });
    const source = '{% set headerWhitespace47 %}<p>{{ value | escape }}</p>\n  <span>testo</span>' + suffix;
    const output = env.renderString(source, { value: '<script>not executable</script>' });
    assert.equal(output, '<p>&lt;script&gt;not executable&lt;/script&gt;</p>\n<span>testo</span>');
    assert.doesNotMatch(output, /<script>/);
  }
});
