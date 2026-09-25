import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  assertWdAsset46, assertWdContract46, assertWdFileSet46, assertWdApplicationText46,
  assertWdHtml46, assertWdHeaders46, assertWdEmbedMarkup46, assertWdPricing46,
  assertWdGlb46, assertWdModels46, assertWdRuntime47, assertWdPosterLayout47,
} from './wd-static-46.mjs';
import {orderWdOwnedStaticFiles47,assertWdOwnedStaticOrder47} from './wd-owned-registry47.mjs';

// All negative fixtures are in memory. These tests never run client code,
// create a server, read a reviewed asset oracle, or rewrite an expected hash.
const prefix = 'demo/ecommerce/';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const record = (file, bytes, text = false) => ({ file, bytes: bytes.length, sha256: sha(bytes), text });
const shortNotice = 'Demo con prezzi esemplificativi.';
const html = `<!doctype html><html><head><meta name="robots" content="noindex,follow"><meta name="description" content="Due modelli originali, materiali 3D e prezzi esemplificativi. Nessun ordine viene inviato."><link rel="stylesheet" href="./style.css"><script src="./embed.js"></script></head><body>
<header class="demo-banner"><span id="standaloneDemoNote">${shortNotice}</span><button id="demoRetry" type="button" hidden>Riprova caricamento</button></header>
<p id="demoStatus" role="status">Caricamento RESTYLE 3D…</p>
<canvas id="seatCanvas" tabindex="0" aria-label="Vista 3D della sella" aria-describedby="viewerKeyboardHelp" aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown + -"></canvas>
<p id="viewerKeyboardHelp" class="sr-only">Da tastiera usa le frecce per ruotare e più o meno per lo zoom.</p>
<button id="addToCartBtn" type="button" disabled>Aggiungi al carrello</button>
<script src="./camera-controller.js"></script><script src="./babylonScene.js"></script><script type="module" src="./app.js"></script></body></html>`;
const csp = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:; frame-ancestors 'self'; base-uri 'self'; form-action 'none'; object-src 'none'";
const headers = `[[headers]]\nfor = "/*"\n[headers.values]\nX-Content-Type-Options = "nosniff"\n[[headers]]\nfor = "/demo/ecommerce/*"\n[headers.values]\nX-Robots-Tag = "noindex, follow"\nContent-Security-Policy = "${csp}"\n`;
const toolbar = `<div class="wd46-embed__controls"><button type="button" class="button button--explore" data-cta-role="explore" data-wd46-start>Avvia demo</button><a class="button button--explore" data-cta-role="explore" data-wd47-fullscreen href="/demo/ecommerce/"><span>Schermo intero</span><svg aria-hidden="true"><path d="M8 3H3v5"></path></svg></a><p class="wd46-embed__note">${shortNotice}</p><p data-wd46-status role="status" aria-live="polite"></p></div>`;
const poster = `<figure data-wd46-poster><img src="/assets/images/wd47-poster-768.webp" srcset="/assets/images/wd47-poster-768.webp 768w, /assets/images/wd47-poster-1200.webp 1200w" width="1200" height="800" loading="lazy" sizes="auto, (max-width: 30rem) calc(100vw - 2.5rem - 2px), (max-width: 78rem) calc(100vw - 3rem - 2px), calc(75rem - 2px)"></figure>`;
const markup = `<div data-wd46-embed>${toolbar}${poster}<div data-wd46-stage hidden></div></div>`;
const pricing = `export const PRICE_TABLE=Object.freeze({models:Object.freeze({restyle:18000,zip:22000}),brandLogo:1200,finishes:Object.freeze({similpelle:0,grip:1200,carbon:1800,prisma:2200,replica:1600,sphere:2000})});
export function initialSelection(){} export function priceSelection(){Number.isSafeInteger(total)} export function createSelectionStore(){} export function transitionModel(){}`;
test('WD47 poster fits native3:2 at full width and rejects letterboxing or arbitrary shrinking', () => {
  const css = '.wd46-embed__poster img { display: block; width: 100%; height: auto; aspect-ratio: 3 / 2; object-fit: contain; }';
  assert.equal(assertWdPosterLayout47(css).aspectRatio, '3/2');
  for (const changed of [css.replace('3 / 2', '16 / 10'), css.replace('100%', '94%'), css.replace('height: auto', 'height: 400px'), css.replace('contain', 'cover'), css+css]) rejectMutation(assertWdPosterLayout47, css, changed);
});
const app = `import {initialSelection,priceSelection,createSelectionStore,transitionModel} from './demo-state.mjs';`;
const controller = 'window.WDCamera47 = Object.freeze({fitRadius, create});';
const scene = 'scene.__wdCamera47 = window.WDCamera47.create({scene, camera, canvas, engine}); scene.__wdCamera47?.focus(config, options); scene.__wdCamera47.resize(); scene.__wdCamera47.dispose();';
const runtimeApp = `${app}\nconst MODEL_IMAGE_MAP = {restyle: "Restyle.png", zip: "Zip.png"};\n` + 'function getModelPreviewImage(seatModelId) {return `./assets/img-prodotto/${MODEL_IMAGE_MAP[seatModelId] || "Restyle.png"}`;} window.WDScene.focusCameraToArea(scene, camera, area); window.WDScene.focusCameraToMeshes(scene, camera, meshes, names);';

// Tiny, non-rendered byte fixtures exercise signature/distinctness checks only.
// They are not screenshots or evidence of original-asset provenance/decoding.
const pngFixture = id => Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, id]);
function rejectMutation(check, source, changed, expected) {
  assert.notEqual(changed, source, 'negative must actually mutate its input');
  assert.throws(() => check(changed), expected);
}

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
    files.set(`${prefix}assets/img-prodotto/${id === 'restyle' ? 'Restyle' : 'Zip'}.png`, pngFixture(id === 'restyle' ? 1 : 2));
  }
  return { base, products, files, check: () => assertWdModels46(base, products, file => files.get(file), [...files.keys()]) };
}

function contractFixture() {
  const names = ['index.html','app.js','embed.js','demo-state.mjs','models.base.json','camera-controller.js','babylonScene.js','assets/img-prodotto/Restyle.png','assets/img-prodotto/Zip.png','data/demo-products.json','data/compatibility.json', ...['restyle', 'zip'].flatMap(id => [`assets/models/${id}/model.json`,`assets/models/${id}/${id}.glb`])].map(file => prefix + file);
  names.push('assets/images/wd47-poster-768.webp', 'assets/images/wd47-poster-1200.webp');
  return { source: 'WD47_REVIEWED', models: ['restyle', 'zip'], files: names.map(file => record(file, Buffer.from('fixture'), /\.(?:html|js|mjs|json)$/.test(file))) };
}

function ownedRegistryFixture47() {
  const names=contractFixture().files.map(record=>record.file);
  for(let index=0;names.length<67;index++)names.push(`${prefix}assets/maps/fixture-${String(index).padStart(2,'0')}.jpg`);
  return names.sort();
}

test('WD47 owned registry moves only the two poster names to the reviewed768/1200 tail',()=>{
  const reviewed=ownedRegistryFixture47(),before=[...reviewed],expected=[...reviewed.slice(2),'assets/images/wd47-poster-768.webp','assets/images/wd47-poster-1200.webp'];
  assert.deepEqual(orderWdOwnedStaticFiles47(reviewed),expected);
  assert.deepEqual(reviewed,before,'Independent oracle order is never rewritten');
  assert.equal(assertWdOwnedStaticOrder47(expected,reviewed).files,67);
  assert.deepEqual(expected.slice(0,65),reviewed.slice(2),'Every reviewed demo path retains its position');
});

test('WD47 owned registry rejects omitted/replaced model map or poster, extra paths and reordered actual entries',()=>{
  const reviewed=ownedRegistryFixture47(),ordered=orderWdOwnedStaticFiles47(reviewed);
  const swap=[...ordered];[swap[0],swap[1]]=[swap[1],swap[0]];
  const posterSwap=[...ordered];[posterSwap[65],posterSwap[66]]=[posterSwap[66],posterSwap[65]];
  const badMap=[...ordered];badMap[badMap.findIndex(file=>file.includes('/assets/maps/'))]=`${prefix}assets/maps/replaced-unreviewed.jpg`;
  const oldPoster=[...ordered];oldPoster[66]='assets/images/wd46-poster-1440.webp';
  for(const changed of [reviewed,swap,posterSwap,badMap,oldPoster,ordered.slice(1),ordered.slice(0,-1),[...ordered,`${prefix}extra.js`]]) {
    assert.notDeepEqual(changed,ordered);
    assert.throws(()=>assertWdOwnedStaticOrder47(changed,reviewed),/exact reviewed declaration order/);
  }
});

test('WD47 owned registry cannot silently discard or reorder an altered reviewed oracle',()=>{
  const reviewed=ownedRegistryFixture47();
  const duplicate=[...reviewed];duplicate[3]=duplicate[2];
  const reorder=[...reviewed];[reorder[2],reorder[3]]=[reorder[3],reorder[2]];
  const wrongPoster=[...reviewed];wrongPoster[0]='assets/images/wd46-poster-1440.webp';
  const foreign=[...reviewed];foreign[2]='assets/images/unrelated.webp';
  for(const changed of [duplicate,reorder,wrongPoster,foreign,reviewed.slice(0,-1),[...reviewed,`${prefix}extra.js`]]) {
    assert.notDeepEqual(changed,reviewed);
    assert.throws(()=>orderWdOwnedStaticFiles47(changed),/WD47 owned registry/);
  }
});

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
  assert.equal(assertWdContract46(contractFixture()).source, 'WD47_REVIEWED');
  for (const mutate of [
    fixture => { fixture.source = 'AUTO_GENERATED_FROM_PRODUCT'; },
    fixture => { fixture.source = 'WD46_REVIEWED'; },
    fixture => { fixture.models.pop(); },
    fixture => { fixture.files = fixture.files.filter(entry => !entry.file.endsWith('zip.glb')); },
    fixture => { fixture.files = fixture.files.filter(entry => !entry.file.endsWith('camera-controller.js')); },
    fixture => { fixture.files = fixture.files.filter(entry => !entry.file.endsWith('babylonScene.js')); },
    fixture => { fixture.files = fixture.files.filter(entry => !entry.file.endsWith('Zip.png')); },
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
  assert.deepEqual(assertWdHtml46(html), [`${prefix}embed.js`, `${prefix}camera-controller.js`, `${prefix}babylonScene.js`, `${prefix}app.js`, `${prefix}style.css`]);
  for (const altered of [
    html.replace('noindex,follow', 'index,follow'),
    html.replace('<body>', '<body><form action="/send">'),
    html.replace('./app.js', 'https://example.invalid/app.js'),
    html.replace('./app.js', '../app.js'),
    html.replace('<body>', '<body onload="run()">'),
    html.replace('<body>', '<body><script>run()</script>'),
    html.replace('<body>', '<body><iframe src="./other.html"></iframe>'),
    html.replace(shortNotice, ''),
  ]) rejectMutation(assertWdHtml46, html, altered);
});

test('WD47 requires the exact single top notice; metadata is not visual copy', () => {
  assert.doesNotThrow(() => assertWdHtml46(html));
  assert.doesNotThrow(() => assertWdEmbedMarkup46(`<main><p>Marketing introduction outside the demo.</p>${markup}</main>`));
  for (const altered of [
    html.replace(shortNotice, 'Prezzi demo indicativi.'),
    html.replace(shortNotice, `${shortNotice} Nessun ordine viene inviato.`),
    html.replace('</header>', `</header><p>${shortNotice}</p>`),
    html.replace('id="standaloneDemoNote"', 'id="standaloneDemoNote" hidden'),
    html.replace('id="standaloneDemoNote"', 'id="standaloneDemoNote" aria-hidden="true"'),
    html.replace('id="standaloneDemoNote"', 'id="standaloneDemoNote" style="display:none"'),
  ]) rejectMutation(assertWdHtml46, html, altered);
  for (const altered of [
    markup.replace(shortNotice, 'Demo gratuita.'),
    markup.replace(shortNotice, `${shortNotice} Nessun ordine viene inviato.`),
    markup.replace('</figure>', `</figure><p>${shortNotice}</p>`),
    markup.replace('class="wd46-embed__note"', 'class="wd46-embed__note" hidden'),
    markup.replace(`<p class="wd46-embed__note">${shortNotice}</p>`, '')
      .replace('</figure>', `</figure><p class="wd46-embed__note">${shortNotice}</p>`),
  ]) rejectMutation(assertWdEmbedMarkup46, markup, altered);
});

test('WD47 rejects removed reset/camera/price copy even when concealed instead of removed', () => {
  const obsolete = [
    '<button type="button">Azzera demo</button>',
    '<button type="button">Inquadratura iniziale</button>',
    '<button type="button" data-camera="left">←</button>',
    '<button type="button" id="demoReset" hidden>Reset</button>',
    '<div class="camera-tools" hidden>Controlli</div>',
    '<p id="demoPriceTable" hidden></p>',
    '<p style="display:none">Materiali applicati. Trascina per ruotare.</p>',
    '<p hidden>Basi demo: RESTYLE180 ZIP220 maggiorazione…</p>',
    '<p>Nessun ordine viene inviato.</p>',
    '<h1>Configura il tuo modello</h1>',
  ];
  for (const addition of obsolete) {
    rejectMutation(assertWdHtml46, html, html.replace('</body>', `${addition}</body>`));
    rejectMutation(assertWdEmbedMarkup46, markup, markup.replace('</figure>', `</figure>${addition}`));
  }
});

test('WD47 keeps keyboard canvas, true retry/status, cart label and initial readiness gate', () => {
  for (const altered of [
    html.replace('tabindex="0"', 'tabindex="-1"'),
    html.replace('aria-describedby="viewerKeyboardHelp"', ''),
    html.replace('aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown + -"', ''),
    html.replace('class="sr-only"', ''),
    html.replace('id="viewerKeyboardHelp"', 'id="removedHelp"'),
    html.replace('Aggiungi al carrello', 'Aggiungi alla selezione demo'),
    html.replace('id="addToCartBtn" type="button" disabled', 'id="addToCartBtn" type="submit" disabled'),
    html.replace('id="addToCartBtn" type="button" disabled', 'id="addToCartBtn" type="button"'),
    html.replace('id="demoRetry"', 'id="removedRetry"'),
    html.replace('Riprova caricamento', 'Riprova domani'),
    html.replace('id="demoStatus" role="status"', 'id="demoStatus"'),
    html.replace('</body>', '<button type="button" data-wd46-start>Avvia demo</button></body>'),
    html.replace('</body>', '<a data-wd47-fullscreen href="./">Schermo intero</a></body>'),
  ]) rejectMutation(assertWdHtml46, html, altered);
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
    markup.replace('/assets/images/wd47-poster-1200.webp', '/assets/images/missing.webp'),
    markup.replace('href="/demo/ecommerce/"', 'href="/other/"'),
  ]) rejectMutation(assertWdEmbedMarkup46, markup, altered);
});

test('WD47 toolbar precedes poster/viewer with two exploration actions and a real fallback', () => {
  for (const altered of [
    markup.replace(`${toolbar}${poster}`, `${poster}${toolbar}`),
    markup.replace(toolbar, '').replace('</figure>', `</figure>${toolbar}`),
    markup.replace('button--explore', 'button--quote'),
    markup.replace('data-cta-role="explore"', 'data-cta-role="quote"'),
    markup.replace('Avvia demo', 'Carica modello'),
    markup.replace('Schermo intero', 'Pagina intera'),
    markup.replace('<svg aria-hidden="true"><path d="M8 3H3v5"></path></svg>', ''),
    markup.replace('data-wd47-fullscreen', 'data-removed-fullscreen'),
    markup.replace('aria-live="polite"', ''),
    markup.replace(poster, `${poster}${poster}`),
    markup.replace(toolbar, `${toolbar}${toolbar}`),
    `${markup}${markup}`,
  ]) rejectMutation(assertWdEmbedMarkup46, markup, altered);
});

test('WD47 poster oracle stops at native1200 and cannot silently reuse or upscale46', () => {
  for (const altered of [
    markup.replaceAll('wd47-poster-768.webp', 'wd46-poster-768.webp'),
    markup.replace('wd47-poster-1200.webp', 'wd46-poster-1440.webp'),
    markup.replace('1200w"', '1440w"'),
    markup.replace('width="1200"', 'width="2560"'),
    markup.replace('height="800"', ''),
    markup.replace('height="800"', 'height="900"'),
    markup.replace('sizes="auto, ', 'sizes="'),
    markup.replace('loading="lazy"', 'loading="eager"'),
    markup.replace('sizes="auto, (max-width: 30rem) calc(100vw - 2.5rem - 2px), (max-width: 78rem) calc(100vw - 3rem - 2px), calc(75rem - 2px)"', ''),
  ]) rejectMutation(assertWdEmbedMarkup46, markup, altered);
  const fixture = contractFixture();
  fixture.files.push(record('assets/images/wd46-poster-1440.webp', Buffer.from('obsolete'), false));
  assert.throws(() => assertWdContract46(fixture), /out-of-scope/);
});

test('WD47 camera controller is loaded before scene and statically connected, not just copied', () => {
  assert.equal(assertWdRuntime47(controller, scene, runtimeApp).cameraInteraction, 'SEPARATE_BROWSER_AND_RUNTIME_GATES');
  rejectMutation(assertWdHtml46, html, html.replace('<script src="./camera-controller.js"></script>', ''));
  rejectMutation(assertWdHtml46, html, html.replace('<script src="./camera-controller.js"></script><script src="./babylonScene.js"></script>', '<script src="./babylonScene.js"></script><script src="./camera-controller.js"></script>'));
  rejectMutation(value => assertWdRuntime47(value, scene, runtimeApp), controller, controller.replace('WDCamera47', 'UnusedCamera'));
  for (const altered of [
    scene.replace('window.WDCamera47.create', 'window.UnusedCamera.create'),
    scene.replace('scene.__wdCamera47?.focus(', 'scene.__wdCamera47focus('),
    scene.replace('scene.__wdCamera47.resize();', ''),
    scene.replace('scene.__wdCamera47.dispose();', ''),
  ]) rejectMutation(value => assertWdRuntime47(controller, value, runtimeApp), scene, altered);
  for (const altered of [
    runtimeApp.replace('window.WDScene.focusCameraToArea', 'window.WDScene.unusedArea'),
    runtimeApp.replace('window.WDScene.focusCameraToMeshes', 'window.WDScene.unusedMeshes'),
  ]) rejectMutation(value => assertWdRuntime47(controller, scene, value), runtimeApp, altered);
});

test('WD47 binds RESTYLE and ZIP original PNG thumbnails, never the colored46 substitute', () => {
  for (const altered of [
    runtimeApp.replace('zip: "Zip.png"', 'zip: "Zip.webp"'),
    runtimeApp.replace('zip: "Zip.png"', 'zip: "Restyle.png"'),
    runtimeApp.replace('restyle: "Restyle.png"', 'restyle: "Generated.png"'),
    runtimeApp.replace('zip: "Zip.png"', 'zip: "Zip.png", zip: "Other.png"'),
    runtimeApp.replace('${MODEL_IMAGE_MAP[seatModelId]', '${UNUSED_IMAGE_MAP[seatModelId]'),
  ]) rejectMutation(value => assertWdRuntime47(controller, scene, value), runtimeApp, altered);
  for (const mutate of [
    fixture => fixture.files.delete(`${prefix}assets/img-prodotto/Zip.png`),
    fixture => fixture.files.set(`${prefix}assets/img-prodotto/Zip.png`, fixture.files.get(`${prefix}assets/img-prodotto/Restyle.png`)),
    fixture => fixture.files.set(`${prefix}assets/img-prodotto/Zip.png`, Buffer.from('colored jpeg renamed as png')),
  ]) { const fixture = modelsFixture(); mutate(fixture); assert.throws(() => fixture.check()); }
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

test('WD47 retains nonempty normal and roughness libraries and physical map payloads on both models', () => {
  for (const id of ['restyle', 'zip']) {
    for (const library of ['normalMapLibrary', 'roughnessMapLibrary']) {
      for (const value of [undefined, {}]) {
        const fixture = modelsFixture();
        const file = `${prefix}assets/models/${id}/model.json`;
        const model = JSON.parse(fixture.files.get(file));
        model[library] = value;
        fixture.files.set(file, Buffer.from(JSON.stringify(model)));
        assert.throws(() => fixture.check(), /missing texture library/);
      }
    }
    const fixture = modelsFixture();
    fixture.files.set(`${prefix}assets/models/${id}/maps/normal.jpg`, Buffer.alloc(0));
    assert.throws(() => fixture.check(), /empty\/missing texture payload/);
  }
});
