import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import nunjucks from 'nunjucks';
import details from '../src/_data/cardDetails46.js';
import { root46 } from './site-ui-46.mjs';
import { uiLiterals47 } from './site-ui-47-literals.mjs';

export const whitespaceMainKeys47 = Object.freeze(['ecommerce', 'cpq', 'planner', 'automation']);
export const whitespaceFiles47 = Object.freeze([
  'src/_includes/partials/site-header.njk',
  'src/automazioni-ai-business.njk',
  'src/configuratori-ecommerce.njk',
  'src/planner-configuratori-arredamento.njk',
  'src/software-cpq-portali-commerciali.njk',
]);
const lf = text => text.replace(/\r\n/g, '\n');
const read = file => fs.readFileSync(path.join(root46, file), 'utf8');
const once = (text, fragment, description) => assert.equal(text.split(fragment).length, 2, description);

export function whitespaceEdits47(file) {
  return (uiLiterals47.edits[file] || []).filter(edit => edit.changeId === 'T47-14');
}

// Undo only the fourteen declared capture delimiters for a comparison render.
// No regex normalisation is applied to source acceptance or historical guards.
export function beforeWhitespace47(file, source) {
  let result = lf(source);
  for (const edit of whitespaceEdits47(file)) {
    once(result, edit.after, file + ': one current T47-14 delimiter');
    result = result.replace(edit.after, edit.before);
  }
  return result;
}

export function renderWhitespace47(pageKey, { before = false, autoescape = false } = {}) {
  const loader = new nunjucks.FileSystemLoader(path.join(root46, 'src/_includes'));
  const getSource = loader.getSource.bind(loader);
  loader.getSource = name => {
    const result = getSource(name);
    if (result && before && name === 'partials/site-header.njk') {
      result.src = beforeWhitespace47('src/_includes/' + name, result.src);
    }
    return result;
  };
  const env = new nunjucks.Environment(loader, { autoescape });
  env.addFilter('json', value => JSON.stringify(value));
  const file = pageKey === 'home' ? 'index' : details.routes[pageKey].slice(1);
  const sourceFile = 'src/' + file + '.njk';
  const source = (before ? beforeWhitespace47(sourceFile, read(sourceFile)) : read(sourceFile))
    .replace(/^---[\s\S]*?\r?\n---\r?\n/, '');
  const json = name => JSON.parse(read('src/_data/' + name + '.json'));
  const context = {
    pageKey, mainId: 'main-content', title: 'Whitespace47 comparison render',
    canonical: 'https://solvex-ai3d.com' + details.routes[pageKey],
    openGraph: {}, twitter: {}, site: json('site'), navigation: json('navigation'),
    measurement: json('measurement'), originalImages31: json('originalImages31'),
    serviceDemos: json('serviceDemos'), projectProofs: json('projectProofs'), cardDetails46: details,
  };
  const html = env.renderString(source, context);
  const form = whitespaceMainKeys47.includes(pageKey) ? env.render('partials/service-demo-form.njk', context) : null;
  return { html, form };
}

// This output oracle is independent of the product capture expression.
// ASCII indentation containing a newline becomes exactly one newline: never
// empty, never a change to a text/inline space, and never an attribute rewrite.
export function compactIndentation47(fragment) {
  assert.doesNotMatch(fragment, /<(?:form|script|style|pre|textarea)\b/i, 'Protected content cannot enter a compacted fragment');
  return fragment.replace(/>[ \t\r\n]*\n[ \t\r\n]*</g, '>\n<');
}

function singleBlock(html, regex, description) {
  const matches = [...html.matchAll(regex)];
  assert.equal(matches.length, 1, description);
  return matches[0][0];
}

export function expectedWhitespaceHtml47(before, pageKey, form) {
  const header = singleBlock(before, /<header\b[^>]*class="site-header"[^>]*>[\s\S]*?<\/header>/g, 'One site header');
  let expected = before.replace(header, compactIndentation47(header));
  if (whitespaceMainKeys47.includes(pageKey)) {
    const main = singleBlock(expected, /<main\b[^>]*>[\s\S]*?<\/main>/g, 'One authorized main');
    assert.ok(typeof form === 'string' && form.includes('<form '), 'Whole form include is required');
    once(main, form, 'Form include must be an exact unique protected fragment');
    const [prefix, suffix] = main.split(form);
    expected = expected.replace(main, compactIndentation47(prefix) + form + compactIndentation47(suffix));
  }
  return expected;
}

const tagPattern = /<!--[\s\S]*?-->|<![^>]*>|<\/?[A-Za-z][A-Za-z0-9:-]*(?:\s+(?:"[^"]*"|'[^']*'|[^'">])*)?\s*\/?>/g;
const protectedPattern = /<(form|script|style|pre|textarea)\b[^>]*>[\s\S]*?<\/\1>/gi;

export function assertWhitespaceHtml47(before, after, pageKey, form) {
  assert.equal(after, expectedWhitespaceHtml47(before, pageKey, form), 'Only the exact header/main output transformation is allowed');
  const tags = text => [...text.matchAll(tagPattern)].map(match => match[0]);
  assert.deepEqual(tags(after), tags(before), 'All tags, attributes and order remain byte-exact');
  const protectedBlocks = text => [...text.matchAll(protectedPattern)].map(match => match[0]);
  assert.deepEqual(protectedBlocks(after), protectedBlocks(before), 'Protected blocks remain byte-exact');
  const oldTextNodes = before.split(tagPattern), newTextNodes = after.split(tagPattern);
  assert.equal(newTextNodes.length, oldTextNodes.length, 'No text node or inline separator removed');
  for (let index = 0; index < oldTextNodes.length; index++) {
    const old = oldTextNodes[index], current = newTextNodes[index];
    if (old !== current) {
      assert.match(old, /^[ \t\r\n]*\n[ \t\r\n]*$/, 'Only an indentation-only node may change');
      assert.equal(current, '\n', 'An existing inline separator must remain one newline');
    }
  }
  return {
    pageKey, beforeBytes: Buffer.byteLength(before), afterBytes: Buffer.byteLength(after),
    savedBytes: Buffer.byteLength(before) - Buffer.byteLength(after),
    tagAttributeOrder: 'BYTE_IDENTICAL', protectedBlocks: protectedBlocks(before).length,
    inlineSeparators: 'PRESERVED', browser: 'NOT_EXECUTED_BY_THIS_TEST',
  };
}
