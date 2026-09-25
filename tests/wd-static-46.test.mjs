import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  assertWdAsset46, assertWdContract46, assertWdFileSet46, assertWdApplicationText46,
  assertWdHtml46, assertWdHeaders46, assertWdEmbedMarkup46, assertWdPricing46,
  assertWdGlb46, assertWdModels46,
} from './wd-static-46.mjs';

// All negative fixtures are in memory. These tests never run client code,
// create a server, read a reviewed asset oracle, or rewrite an expected hash.
const prefix = 'demo/ecommerce/';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const record = (file, bytes, text = false) => ({ file, bytes: bytes.length, sha256: sha(bytes), text });
const html = `<!doctype html><html><head><meta name="robots" content="noindex,follow"><link rel="stylesheet" href="./style.css"><script src="./embed.js"></script></head><body><p>Demo con prezzi esemplificativi. Nessun ordine viene inviato.</p><script type="module" src="./app.js"></script></body></html>`;
const csp = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:; frame-ancestors 'self'; base-uri 'self'; form-action 'none'; object-src 'none'";
const headers = `[[headers]]\nfor = "/*"\n[headers.values]\nX-Content-Type-Options = "nosniff"\n[[headers]]\nfor = "/demo/ecommerce/*"\n[headers.values]\nX-Robots-Tag = "noindex, follow"\nContent-Security-Policy = "${csp}"\n`;
const markup = `<div data-wd46-embed><img src="/assets/images/wd46-poster-768.webp" srcset="/assets/images/wd46-poster-1440.webp 1440w"><div data-wd46-stage hidden></div><button type="button" data-wd46-start>Avvia demo</button><a href="/demo/ecommerce/">Pagina intera</a></div>`;
const pricing = `export const PRICE_TABLE=Object.freeze({models:Object.freeze({restyle:18000,zip:22000}),brandLogo:1200,finishes:Object.freeze({similpelle:0,grip:1200,carbon:1800,prisma:2200,replica:1600,sphere:2000})});
export function initialSelection(){} export function priceSelection(){Number.isSafeInteger(total)} export function createSelectionStore(){} export function transitionModel(){}`;
const app = `import {initialSelection,priceSelection,createSelectionStore,transitionModel} from './demo-state.mjs';`;

function tinyGlb(names = ['seat_top']) {
  const object = { asset: { version: '2.0' }, meshes: names.map(name => ({ name, primitives: [{ attributes: { POSITION: 0 } }] })), buffers: [{ byteLength: 4 }] };
  let json = Buffer.from(JSON.stringify(object));
  json = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 32)]);
  const header = Buffer.alloc(20), binary = Buffer.alloc(12);
  header.write('glTF'); header.writeUInt32LE(2, 4); header.writeUInt32LE(20 + json.length + binary.length, 8);
  header.writeUInt32LE(json.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
  binary.writeUInt32LE(4); binary.writeUInt32LE(0x004e4942, 4); binary.writeUInt32LE(1, 8);
  return Buffer.concat([header, json, binary]);
}

function modelsFixture() {
  const files = new Map();
  const base = { modelManifests: ['restyle', 'zip'].map(id => ({ id, file: `./assets/models/${id}/model.json` })) };
  const products = { defaultProductId: 'DEMO-WD-RESTYLE', products: ['restyle', 'zip'].map(id => ({ productId: `DEMO-WD-${id.toUpperCase()}`, seatModelId: id })) };
  for (const id of ['restyle', 'zip']) {
    const map = `./assets/models/${id}/maps/normal.jpg`;
    files.set(`${prefix}assets/models/${id}/model.json`, Buffer.from(JSON.stringify({ id, glb: `./assets/models/${id}/${id}.glb`, meshSlots: { seatColor: ['seat_top'] }, normalMapLibrary: { normal: { file: map } }, roughnessMapLibrary: { rough: { file: map } } })));
    files.set(`${prefix}assets/models/${id}/${id}.glb`, tinyGlb());
    files.set(`${prefix}assets/models/${id}/maps/normal.jpg`, Buffer.from([1]));
  }
  return { base, products, files, check: () => assertWdModels46(base, products, file => files.get(file), [...files.keys()]) };
}

function contractFixture() {
  const names = ['index.html','app.js','embed.js','demo-state.mjs','models.base.json','data/demo-products.json','data/compatibility.json', ...['restyle', 'zip'].flatMap(id => [`assets/models/${id}/model.json`,`assets/models/${id}/${id}.glb`])].map(file => prefix + file);
  names.push('assets/images/wd46-poster-768.webp', 'assets/images/wd46-poster-1440.webp');
  return { source: 'WD46_REVIEWED', models: ['restyle', 'zip'], files: names.map(file => record(file, Buffer.from('fixture'), /\.(?:html|js|mjs|json)$/.test(file))) };
}

test('binary hash and length remain byte-exact, including CR/LF bytes', () => {
  const bytes = Buffer.from([0, 13, 10, 255, 1]);
  const expected = record(`${prefix}assets/model.glb`, bytes);
  assert.equal(assertWdAsset46(bytes, expected).mode, 'RAW_BINARY');
  assert.throws(() => assertWdAsset46(Buffer.from([0, 10, 255, 1]), expected), /byte count mismatch/);
  assert.throws(() => assertWdAsset46(Buffer.from([0, 13, 10, 255, 2]), expected), /SHA-256 mismatch/);
});

test('explicit text mode permits only CRLF to LF; not trimming, BOM removal or lone CR', () => {
  const bytes = Buffer.from('alpha\nbeta\n');
  const expected = record(`${prefix}index.html`, bytes, true);
  const result = assertWdAsset46(Buffer.from('alpha\r\nbeta\r\n'), expected);
  assert.equal(result.bytes, bytes.length);
  assert.ok(result.rawBytes > result.bytes);
  for (const altered of ['alpha\nbeta', '\ufeffalpha\nbeta\n', 'alpha\rbeta\n', 'alpha\nBETA\n']) assert.throws(() => assertWdAsset46(Buffer.from(altered), expected));
  assert.throws(() => assertWdAsset46(Buffer.from([255]), expected));
  assert.throws(() => assertWdAsset46(bytes, { ...expected, text: undefined }), /classification/);
});

test('review contract is deferred, exact, scoped and requires both model binaries and posters', () => {
  assert.equal(assertWdContract46(contractFixture()).source, 'WD46_REVIEWED');
  for (const mutate of [
    fixture => { fixture.source = 'AUTO_GENERATED_FROM_PRODUCT'; },
    fixture => { fixture.models.pop(); },
    fixture => { fixture.files = fixture.files.filter(entry => !entry.file.endsWith('zip.glb')); },
    fixture => { fixture.files.pop(); },
    fixture => { fixture.files.push({ ...fixture.files[0] }); },
    fixture => { fixture.files.push(record('js/unrelated.js', Buffer.from('x'), true)); },
    fixture => { fixture.files.push(record(`${prefix}../escape.js`, Buffer.from('x'), true)); },
    fixture => { fixture.files.push(record(`${prefix}vendor/unknown.js`, Buffer.from('x'), true)); },
    fixture => { fixture.files[0].text = false; },
  ]) { const fixture = contractFixture(); mutate(fixture); assert.throws(() => assertWdContract46(fixture)); }
});

test('unlisted and missing publication assets are rejected, independent of ordering', () => {
  assert.doesNotThrow(() => assertWdFileSet46(['b', 'a'], ['a', 'b']));
  assert.throws(() => assertWdFileSet46(['a', 'b', 'unexpected'], ['a', 'b']), /allowlist/);
  assert.throws(() => assertWdFileSet46(['a'], ['a', 'b']), /allowlist/);
});

test('static route requires noindex and only local runtime scripts', () => {
  assert.deepEqual(assertWdHtml46(html), [`${prefix}embed.js`, `${prefix}app.js`, `${prefix}style.css`]);
  for (const altered of [
    html.replace('noindex,follow', 'index,follow'),
    html.replace('<body>', '<body><form action="/send">'),
    html.replace('./app.js', 'https://example.invalid/app.js'),
    html.replace('./app.js', '../app.js'),
    html.replace('<body>', '<body onload="run()">'),
    html.replace('<body>', '<body><script>run()</script>'),
    html.replace('<body>', '<body><iframe src="./other.html"></iframe>'),
    html.replace('Nessun ordine viene inviato.', ''),
  ]) assert.throws(() => assertWdHtml46(altered));
});

test('application endpoints, real forms and measurement are blocked; local read fetch remains valid', () => {
  assert.doesNotThrow(() => assertWdApplicationText46('fetch("./data/demo-products.json", {cache:"no-store"}); const ui={slotLabels:{seatColor:"Centrale"}};'));
  for (const bad of [
    'fetch("https://example.invalid/service")', 'fetch("//example.invalid/service")',
    'fetch("http://localhost:4000/api")', 'const origin="127.0.0.1";',
    'fetch("/api/orders")', 'fetch("/checkout")', 'fetch("/.netlify/functions/send")',
    'fetch("./file", {method:"POST"})', 'navigator.sendBeacon("/send", value)',
    'new XMLHttpRequest()', 'new WebSocket(value)', 'navigator.serviceWorker.register("./sw.js")',
    '<form method="post">', '<input data-netlify>', 'dataLayer.push({event:"x"})', 'gtag("event", "x")',
  ]) assert.throws(() => assertWdApplicationText46(bad), /WD46:/);
});

test('reviewed Babylon vendor strings are distinctly classified, not called zero-network proof', () => {
  const source = 'const dormant="https://cdn.babylonjs.com/resource";';
  const result = assertWdApplicationText46(source, `${prefix}vendor/babylon.js`);
  assert.equal(result.externalUrlStrings, 1);
  assert.match(result.classification, /NOT_NETWORK_EXECUTION_PROOF/);
  assert.throws(() => assertWdApplicationText46(source), /external application URL/);
});

test('CSP is restricted to dedicated demo route with no form destination or external sources', () => {
  assert.equal(assertWdHeaders46(headers).formAction, 'none');
  for (const altered of [
    headers.replace('for = "/demo/ecommerce/*"', 'for = "/*"'),
    headers.replace("form-action 'none'", "form-action 'self'"),
    headers.replace("connect-src 'self'", 'connect-src https://example.invalid'),
    headers.replace("script-src 'self'", "script-src 'self' 'unsafe-eval'"),
    headers.replace("img-src 'self' data: blob:", 'img-src *'),
    headers.replace('noindex, follow', 'index, follow'),
    `${headers}\n[[headers]]\nfor = "/*"\n[headers.values]\nContent-Security-Policy = "${csp}"`,
    headers.replace("object-src 'none'", "object-src 'none'; script-src 'self'"),
  ]) assert.throws(() => assertWdHeaders46(altered));
});

test('marketing embed remains poster-first with no iframe or eager Babylon/model resource', () => {
  assert.equal(assertWdEmbedMarkup46(markup).loading, 'ON_DEMAND_MARKUP');
  for (const altered of [
    `${markup}<iframe src="/demo/ecommerce/"></iframe>`,
    `${markup}<script src="/demo/ecommerce/app.js"></script>`,
    `${markup}<link rel="preload" href="/demo/ecommerce/assets/seat.glb">`,
    markup.replace('type="button"', 'type="submit"'),
    markup.replace('data-wd46-stage hidden', 'data-wd46-stage'),
    markup.replace('/assets/images/wd46-poster-1440.webp', '/assets/images/missing.webp'),
    markup.replace('href="/demo/ecommerce/"', 'href="/other/"'),
  ]) assert.throws(() => assertWdEmbedMarkup46(altered));
});

test('two positive distinct model prices and all six material prices are wired to local state', () => {
  assert.equal(assertWdPricing46(pricing, app).modelBaseCents.zip, 22000);
  for (const altered of [
    pricing.replace('zip:22000', 'zip:18000'), pricing.replace('zip:22000', 'zip:0'),
    pricing.replace('zip:22000', 'zip:22000,third:100'), pricing.replace('sphere:2000', 'unknown:2000'),
    pricing.replace('Number.isSafeInteger(total)', 'Number.isFinite(total)'),
  ]) assert.throws(() => assertWdPricing46(altered, app));
  assert.throws(() => assertWdPricing46(pricing, app.replace('./demo-state.mjs', './other.mjs')));
});

test('GLB proof checks header, physical length, binary mesh payload and referenced slot names', () => {
  assert.equal(assertWdGlb46(tinyGlb(), { seatColor: ['seat_top'] }).meshes, 1);
  assert.throws(() => assertWdGlb46(Buffer.from('not a model')), /GLB/);
  assert.throws(() => assertWdGlb46(tinyGlb().subarray(0, -1)), /length mismatch/);
  assert.throws(() => assertWdGlb46(tinyGlb(), { seatColor: ['invented_mesh'] }), /mesh slot absent/);
  const altered = tinyGlb(); altered.writeUInt32LE(1, 4);
  assert.throws(() => assertWdGlb46(altered), /version/);
});

test('both distinct reviewed models and texture dependencies must exist; missing model is negative', () => {
  const good = modelsFixture();
  assert.deepEqual(good.check().models, ['restyle', 'zip']);
  for (const mutate of [
    fixture => fixture.base.modelManifests.pop(),
    fixture => fixture.products.products.pop(),
    fixture => fixture.files.delete(`${prefix}assets/models/zip/zip.glb`),
    fixture => fixture.files.delete(`${prefix}assets/models/restyle/maps/normal.jpg`),
    fixture => { fixture.products.products[0].productId = 'REAL-STORE-PRODUCT'; },
    fixture => { const file = `${prefix}assets/models/zip/model.json`; const model = JSON.parse(fixture.files.get(file)); model.glb = './assets/models/restyle/restyle.glb'; fixture.files.set(file, Buffer.from(JSON.stringify(model))); },
    fixture => { fixture.base.modelManifests[1].file = 'https://example.invalid/zip.json'; },
  ]) { const fixture = modelsFixture(); mutate(fixture); assert.throws(() => fixture.check()); }
});
