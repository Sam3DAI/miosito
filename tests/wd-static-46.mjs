import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

// The reviewed oracle is supplied separately, after review of the publication.
// Importing this module neither generates that oracle nor reads product files.
const ROUTE = 'demo/ecommerce/';
const MODEL_IDS = ['restyle', 'zip'];
const POSTERS = ['assets/images/wd47-poster-768.webp', 'assets/images/wd47-poster-1200.webp'];
const THUMBNAILS = { restyle: 'assets/img-prodotto/Restyle.png', zip: 'assets/img-prodotto/Zip.png' };
const SHORT_NOTICE = 'Demo con prezzi esemplificativi.';
const VENDOR_CODE = new Set([`${ROUTE}vendor/babylon.js`, `${ROUTE}vendor/babylonjs.loaders.min.js`]);
const ESSENTIAL = [
  'index.html', 'app.js', 'embed.js', 'demo-state.mjs', 'models.base.json',
  'camera-controller.js', 'babylonScene.js', ...Object.values(THUMBNAILS),
  'data/demo-products.json', 'data/compatibility.json',
  ...MODEL_IDS.flatMap(id => [`assets/models/${id}/model.json`, `assets/models/${id}/${id}.glb`]),
].map(file => ROUTE + file);
const utf8 = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = (condition, message) => assert.ok(condition, `WD46: ${message}`);

function safePath(file) {
  fail(typeof file === 'string' && file.length > 0, 'missing relative asset path');
  fail(!file.includes('\\') && !file.includes('%') && !file.includes('?') && !file.includes('#'), `ambiguous asset path ${file}`);
  fail(!file.startsWith('/') && !file.includes(':') && file.split('/').every(part => part && part !== '.' && part !== '..'), `unsafe asset path ${file}`);
  fail(file.startsWith(ROUTE) || POSTERS.includes(file), `out-of-scope asset ${file}`);
  return file;
}

function canonicalBytes(bytes, isText) {
  fail(Buffer.isBuffer(bytes) || bytes instanceof Uint8Array, 'asset must be bytes');
  const raw = Buffer.from(bytes);
  if (!isText) return raw;
  const text = utf8.decode(raw);
  // Deliberately no trimming, BOM removal, JSON reformatting or binary normalisation.
  fail(!/\r(?!\n)/.test(text), 'text contains a lone CR');
  return Buffer.from(text.replace(/\r\n/g, '\n'), 'utf8');
}

export function assertWdAsset46(bytes, record) {
  safePath(record?.file);
  fail(typeof record.text === 'boolean', `explicit text classification required: ${record.file}`);
  fail(Number.isSafeInteger(record.bytes) && record.bytes > 0, `invalid byte count: ${record.file}`);
  fail(typeof record.sha256 === 'string' && /^[0-9a-f]{64}$/.test(record.sha256), `invalid SHA-256: ${record.file}`);
  const canonical = canonicalBytes(bytes, record.text);
  assert.equal(canonical.length, record.bytes, `WD46: byte count mismatch ${record.file}`);
  assert.equal(digest(canonical), record.sha256, `WD46: SHA-256 mismatch ${record.file}`);
  return { file: record.file, bytes: canonical.length, rawBytes: bytes.length, mode: record.text ? 'UTF8_CRLF_TO_LF_ONLY' : 'RAW_BINARY' };
}

export function assertWdContract46(contract) {
  fail(contract && typeof contract === 'object', 'review contract missing');
  assert.equal(contract.source, 'WD47_REVIEWED', 'WD47: unreviewed source');
  assert.deepEqual(contract.models, MODEL_IDS, 'WD46: exact two reviewed models required');
  fail(Array.isArray(contract.files) && contract.files.length > 0, 'empty reviewed file list');
  const names = contract.files.map(record => safePath(record.file));
  assert.equal(new Set(names.map(file => file.toLowerCase())).size, names.length, 'WD46: duplicate/case-colliding asset');
  for (const file of [...ESSENTIAL, ...POSTERS]) fail(names.includes(file), `missing required file ${file}`);
  for (const record of contract.files) {
    fail(typeof record.text === 'boolean' && Number.isSafeInteger(record.bytes) && record.bytes > 0 && /^[0-9a-f]{64}$/.test(record.sha256), `invalid record ${record.file}`);
    const textual = /\.(?:html|css|js|mjs|json|md|txt)$/i.test(record.file);
    assert.equal(record.text, textual, `WD46: text/binary classification mismatch ${record.file}`);
    if (/\/vendor\/.*\.(?:js|mjs)$/i.test(record.file)) fail(VENDOR_CODE.has(record.file), `unreviewed vendor executable ${record.file}`);
  }
  return contract;
}

function readContract(root) {
  return assertWdContract46(JSON.parse(readFileSync(path.join(root, 'tests', 'wd-static-47-contract.json'), 'utf8')));
}

export function wdStaticFiles46(root) {
  return readContract(root).files.map(record => record.file);
}

export function assertWdFileSet46(actualFiles, expectedFiles) {
  assert.deepEqual([...actualFiles].sort(), [...expectedFiles].sort(), 'WD46: static folder differs from reviewed allowlist');
}

function regularFile(root, relative) {
  safePath(relative);
  let current = path.resolve(root);
  for (const [index, part] of relative.split('/').entries()) {
    current = path.join(current, part);
    const stat = lstatSync(current);
    fail(!stat.isSymbolicLink(), `symbolic link forbidden ${relative}`);
    fail(index === relative.split('/').length - 1 ? stat.isFile() : stat.isDirectory(), `non-regular path ${relative}`);
  }
  return readFileSync(current);
}

function listStatic(root, prefix = ROUTE.slice(0, -1)) {
  const folder = path.join(root, ...prefix.split('/'));
  fail(lstatSync(folder).isDirectory() && !lstatSync(folder).isSymbolicLink(), `invalid static directory ${prefix}`);
  return readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
    const file = `${prefix}/${entry.name}`;
    fail(!entry.isSymbolicLink(), `symbolic link forbidden ${file}`);
    if (entry.isDirectory()) return listStatic(root, file);
    fail(entry.isFile(), `non-regular asset ${file}`);
    return [safePath(file)];
  });
}

function attributes(tag) {
  const attrs = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    const key = match[1].toLowerCase();
    fail(!Object.hasOwn(attrs, key), `duplicate HTML attribute ${key}`);
    attrs[key] = match[2] ?? match[3];
  }
  return attrs;
}

// Scoped structural checks only: runtime visibility, camera behaviour and native
// poster decoding remain separate gates. No historical HTML is reconstructed.
const hasAttribute = (tag, name) => new RegExp(`\\s${name}(?=\\s|=|/?>)`, 'i').test(tag);
const hasClass = (attrs, name) => (attrs.class || '').split(/\s+/).includes(name);
const plainText = html => html.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

function elements(html, tag, predicate = () => true) {
  const result = [];
  for (const match of html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'gi'))) {
    const attrs = attributes(match[0]);
    if (!predicate(attrs, match[0])) continue;
    const scanner = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
    scanner.lastIndex = match.index + match[0].length;
    let depth = 1, closing;
    for (let next; (next = scanner.exec(html));) {
      depth += next[0].startsWith('</') ? -1 : 1;
      if (depth === 0) { closing = next; break; }
    }
    fail(closing, `unclosed ${tag} element`);
    result.push({ attrs, opening: match[0], index: match.index, inner: html.slice(match.index + match[0].length, closing.index), markup: html.slice(match.index, scanner.lastIndex) });
  }
  return result;
}

function uniqueElement(html, tag, predicate, label) {
  const matches = elements(html, tag, predicate);
  assert.equal(matches.length, 1, `WD47: exactly one ${label} required`);
  return matches[0];
}

function assertBriefNotice(scope, note) {
  assert.equal(plainText(note.inner), SHORT_NOTICE, 'WD47: brief notice must be exact');
  assert.equal((scope.match(/prezzi esemplificativi/gi) || []).length, 1, 'WD47: brief notice must occur once');
  fail(!hasAttribute(note.opening, 'hidden') && note.attrs['aria-hidden'] !== 'true' && !/display\s*:\s*none|visibility\s*:\s*hidden/i.test(note.attrs.style || ''), 'brief notice must not be hidden');
}

function assertNoObsoleteWdMarkup(scope) {
  fail(!/Azzera demo|Inquadratura iniziale|Materiali applicati\.\s*Trascina|Aggiungi alla selezione demo|Nessun ordine viene inviato|Basi demo\s*:|Configura il tuo modello/i.test(scope), 'obsolete WD46 text remains in markup');
  fail(!/\b(?:id=["'](?:demoReset|demoPriceTable)["']|data-camera(?:\s|=|>)|camera-tools\b)/i.test(scope), 'removed reset/price/camera controls remain in markup');
}

function localResource(value) {
  fail(typeof value === 'string' && value.length > 0, 'empty local resource');
  fail(!/^(?:[a-z][\w+.-]*:|\/\/)/i.test(value) && !/[\\%?#]/.test(value), `non-local resource ${value}`);
  const normalized = value.startsWith(`/${ROUTE}`) ? value.slice(1) : `${ROUTE}${value.replace(/^\.\//, '')}`;
  return safePath(normalized);
}

export function assertWdApplicationText46(text, file = `${ROUTE}app.js`) {
  safePath(file);
  fail(typeof text === 'string', 'application text required');
  if (VENDOR_CODE.has(file)) {
    return { classification: 'REVIEWED_VENDOR_STRINGS_NOT_NETWORK_EXECUTION_PROOF', externalUrlStrings: (text.match(/https?:\/\//g) || []).length };
  }
  fail(!/\b(?:https?|wss?|ftp):\/\/|["'`]\/\/[^/]/i.test(text), `external application URL in ${file}`);
  fail(!/\b(?:localhost|127\.0\.0\.1|0\.0\.0\.0)\b|\[::1\]/i.test(text), `loopback application endpoint in ${file}`);
  fail(!/\/(?:api|orders?|checkout|webhooks?|\.netlify\/functions)(?:\/|[?"'`\s])/i.test(text), `backend endpoint in ${file}`);
  fail(!/formsubmit|googletagmanager|google-analytics|\bgtag\s*\(|\bdataLayer\b|\bGTM-[A-Z0-9]+|\bG-[A-Z0-9]{6,}/i.test(text), `provider or Google measurement in ${file}`);
  fail(!/\b(?:XMLHttpRequest|WebSocket|EventSource)\b|\.sendBeacon\s*\(|\.serviceWorker\b|\bmethod\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']/i.test(text), `active write/network transport in ${file}`);
  fail(!/<form\b|\bdata-netlify\b|\bnetlify-honeypot\b/i.test(text), `form/provider integration in ${file}`);
  return { classification: 'STATIC_APPLICATION_TEXT_CHECKED' };
}

export function assertWdHtml46(html) {
  assertWdApplicationText46(html, `${ROUTE}index.html`);
  fail(!/<iframe\b|\son\w+\s*=/i.test(html), 'iframe or inline event handler in static demo');
  const robots = [...html.matchAll(/<meta\b[^>]*>/gi)].map(match => attributes(match[0])).filter(attr => attr.name?.toLowerCase() === 'robots');
  assert.equal(robots.length, 1, 'WD46: one robots meta required');
  const values = robots[0].content?.toLowerCase().split(/[\s,]+/) || [];
  fail(values.includes('noindex') && !values.includes('index'), 'static demo must be noindex');
  const resources = [];
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    const attrs = attributes(match[1]);
    fail(attrs.src && !match[2].trim(), 'only local external script files allowed');
    resources.push(localResource(attrs.src));
  }
  for (const match of html.matchAll(/<(?:link|img)\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    if (attrs.href) resources.push(localResource(attrs.href));
    if (attrs.src) resources.push(localResource(attrs.src));
  }
  fail(resources.includes(`${ROUTE}app.js`) && resources.includes(`${ROUTE}embed.js`), 'demo runtime scripts missing');
  fail(resources.includes(`${ROUTE}camera-controller.js`) && resources.includes(`${ROUTE}babylonScene.js`), 'WD47 camera runtime scripts missing');
  fail(resources.indexOf(`${ROUTE}camera-controller.js`) < resources.indexOf(`${ROUTE}babylonScene.js`), 'camera controller must load before scene');
  const body = uniqueElement(html, 'body', () => true, 'demo body').inner;
  assertNoObsoleteWdMarkup(body);
  const note = uniqueElement(body, 'span', attrs => attrs.id === 'standaloneDemoNote', 'standalone brief notice');
  assertBriefNotice(body, note);
  fail(!/\bdata-wd46-start\b|\bdata-wd47-fullscreen\b/.test(body), 'toolbar must not be duplicated inside the iframe');
  const canvas = uniqueElement(body, 'canvas', attrs => attrs.id === 'seatCanvas', 'keyboard-accessible canvas');
  assert.equal(canvas.attrs.tabindex, '0', 'WD47: canvas must remain keyboard focusable');
  assert.equal(canvas.attrs['aria-describedby'], 'viewerKeyboardHelp', 'WD47: canvas keyboard instructions must be linked');
  assert.equal(canvas.attrs['aria-keyshortcuts'], 'ArrowLeft ArrowRight ArrowUp ArrowDown + -', 'WD47: canvas keyboard shortcuts missing');
  fail(Boolean(canvas.attrs['aria-label']), 'canvas accessible name missing');
  fail(note.index < canvas.index, 'brief notice must remain above the viewer');
  const help = uniqueElement(body, 'p', attrs => attrs.id === 'viewerKeyboardHelp', 'keyboard help');
  fail(hasClass(help.attrs, 'sr-only') && /tastiera/i.test(help.inner) && /frecce/i.test(help.inner) && /zoom/i.test(help.inner), 'assistive keyboard help must remain');
  const cart = uniqueElement(body, 'button', attrs => attrs.id === 'addToCartBtn', 'demo cart button');
  assert.equal(plainText(cart.inner), 'Aggiungi al carrello', 'WD47: cart label must be exact');
  fail(cart.attrs.type === 'button' && hasAttribute(cart.opening, 'disabled'), 'cart must not submit or become active before readiness');
  const retry = uniqueElement(body, 'button', attrs => attrs.id === 'demoRetry', 'loading retry');
  fail(retry.attrs.type === 'button' && plainText(retry.inner) === 'Riprova caricamento', 'real retry control must remain');
  const status = uniqueElement(body, 'p', attrs => attrs.id === 'demoStatus', 'loading status');
  assert.equal(status.attrs.role, 'status', 'WD47: accessible loading/error status must remain');
  return resources;
}

export function assertWdHeaders46(toml) {
  const headerBlocks = toml.split(/^\s*\[\[headers\]\]\s*$/m).slice(1);
  const cspBlocks = headerBlocks.filter(block => /^\s*Content-Security-Policy\s*=/mi.test(block));
  assert.equal(cspBlocks.length, 1, 'WD46: exactly one dedicated CSP header expected');
  const block = cspBlocks[0];
  assert.match(block, /^\s*for\s*=\s*"\/demo\/ecommerce\/\*"\s*$/m, 'WD46: CSP must be limited to demo route');
  assert.match(block, /^\s*X-Robots-Tag\s*=\s*"noindex,\s*follow"\s*$/mi, 'WD46: noindex response header missing');
  const policy = block.match(/^\s*Content-Security-Policy\s*=\s*"([^"]+)"\s*$/mi)?.[1];
  fail(policy, 'CSP must be a literal reviewed policy');
  const directives = new Map();
  for (const part of policy.split(';').map(part => part.trim()).filter(Boolean)) {
    const [name, ...values] = part.split(/\s+/);
    fail(!directives.has(name), `duplicate CSP directive ${name}`);
    directives.set(name, values);
    fail(!values.some(value => /https?:|\*|unsafe-eval/i.test(value)), `unsafe/external CSP source ${name}`);
  }
  for (const name of ['default-src', 'form-action', 'object-src']) assert.deepEqual(directives.get(name), ["'none'"], `WD46: ${name} must be none`);
  for (const name of ['script-src', 'connect-src', 'frame-ancestors']) assert.deepEqual(directives.get(name), ["'self'"], `WD46: ${name} must be self`);
  fail(["'self'", "'none'"].includes(directives.get('base-uri')?.join(' ')), 'base-uri must be restricted');
  for (const [name, values] of directives) {
    const allowed = name === 'style-src' ? ["'self'", "'unsafe-inline'"]
      : name === 'img-src' ? ["'self'", 'data:', 'blob:']
        : name === 'worker-src' ? ["'self'", "'none'", 'blob:']
          : ["'self'", "'none'"];
    fail(values.length > 0 && values.every(value => allowed.includes(value)), `unqualified CSP directive ${name}`);
  }
  return { cspScope: '/demo/ecommerce/*', formAction: 'none', noindex: true };
}

export function assertWdEmbedMarkup46(html) {
  fail(/\bdata-wd46-embed\b/.test(html) && /\bdata-wd46-start\b/.test(html), 'on-demand host/start control missing');
  fail(!/<iframe\b/i.test(html), 'eager iframe in marketing page/partial');
  fail(!/<(?:script|link|img|source)\b[^>]*(?:\/demo\/ecommerce\/|babylon|\.glb)/i.test(html), 'demo runtime/model eager resource on marketing page');
  const host = uniqueElement(html, 'div', (attrs, tag) => hasAttribute(tag, 'data-wd46-embed'), 'on-demand demo host');
  const scope = host.inner;
  assertNoObsoleteWdMarkup(scope);
  const toolbar = uniqueElement(scope, 'div', attrs => hasClass(attrs, 'wd46-embed__controls'), 'toolbar');
  const poster = uniqueElement(scope, 'figure', (attrs, tag) => hasAttribute(tag, 'data-wd46-poster'), 'poster');
  const stage = uniqueElement(scope, 'div', (attrs, tag) => hasAttribute(tag, 'data-wd46-stage'), 'initial stage');
  fail(toolbar.index < poster.index && toolbar.index < stage.index, 'toolbar must precede poster and viewer');
  fail(hasAttribute(stage.opening, 'hidden'), 'initial stage must be hidden');
  const start = uniqueElement(scope, 'button', (attrs, tag) => hasAttribute(tag, 'data-wd46-start'), 'start button');
  fail(start.attrs.type === 'button' && plainText(start.inner) === 'Avvia demo', 'start must be the exact non-submit control');
  const fullscreen = uniqueElement(scope, 'a', (attrs, tag) => hasAttribute(tag, 'data-wd47-fullscreen'), 'fullscreen fallback');
  assert.equal(fullscreen.attrs.href, '/demo/ecommerce/', 'WD47: standalone fallback missing');
  assert.equal(plainText(fullscreen.inner), 'Schermo intero', 'WD47: fullscreen label must be exact');
  fail(/<svg\b[^>]*aria-hidden=["']true["'][\s\S]*?<path\b/i.test(fullscreen.inner), 'fullscreen expansion symbol missing');
  for (const control of [start, fullscreen]) {
    fail(hasClass(control.attrs, 'button--explore') && control.attrs['data-cta-role'] === 'explore', 'toolbar controls must use exploration CTA');
    fail(toolbar.inner.includes(control.markup), 'start/fullscreen must remain inside the toolbar');
  }
  const note = uniqueElement(scope, 'p', attrs => hasClass(attrs, 'wd46-embed__note'), 'embed brief notice');
  assertBriefNotice(scope, note);
  fail(toolbar.inner.includes(note.markup), 'brief notice must remain in the upper toolbar');
  const images = [...poster.inner.matchAll(/<img\b[^>]*>/gi)];
  assert.equal(images.length, 1, 'WD47: exactly one responsive poster image required');
  const image = attributes(images[0][0]);
  assert.equal(image.src, `/${POSTERS[0]}`, 'WD47: small poster mismatch');
  assert.equal(image.srcset, `/${POSTERS[0]} 768w, /${POSTERS[1]} 1200w`, 'WD47: native-size responsive poster mismatch');
  assert.equal(image.width, '1200', 'WD47: poster must not claim width beyond native capture');
  assert.equal(image.height, '800', 'WD47: native poster ratio is 3:2');
  assert.equal(image.sizes, 'auto, (max-width: 30rem) calc(100vw - 2.5rem - 2px), (max-width: 78rem) calc(100vw - 3rem - 2px), calc(75rem - 2px)', 'WD47: sizes must use actual lazy image width with container/border fallback');
  assert.equal(image.loading, 'lazy', 'WD47: auto sizes requires lazy loading');
  const status = uniqueElement(toolbar.inner, 'p', (attrs, tag) => hasAttribute(tag, 'data-wd46-status'), 'on-demand loading status');
  fail(status.attrs.role === 'status' && status.attrs['aria-live'] === 'polite', 'on-demand loading/error status must remain accessible');
  return { loading: 'ON_DEMAND_MARKUP', browserExecution: 'SEPARATE_GATE' };
}

function integerTable(source, label) {
  const match = source.match(new RegExp(`\\b${label}\\s*:\\s*Object\\.freeze\\(\\{([^}]*)\\}\\)`));
  fail(match, `literal ${label} price table missing`);
  const result = {};
  for (const pair of match[1].split(',').map(value => value.trim()).filter(Boolean)) {
    const entry = pair.match(/^(\w+)\s*:\s*(\d+)$/);
    fail(entry && !Object.hasOwn(result, entry[1]), `invalid ${label} price entry`);
    const value = Number(entry[2]);
    fail(Number.isSafeInteger(value), `unsafe ${label} amount`);
    result[entry[1]] = value;
  }
  return result;
}

export function assertWdPricing46(source, app) {
  const models = integerTable(source, 'models');
  assert.deepEqual(Object.keys(models).sort(), [...MODEL_IDS].sort(), 'WD46: two priced models required');
  fail(models.restyle > 0 && models.zip > 0 && models.restyle !== models.zip, 'model prices must be positive and differentiated');
  const finishes = integerTable(source, 'finishes');
  assert.deepEqual(Object.keys(finishes).sort(), ['similpelle', 'grip', 'prisma', 'carbon', 'replica', 'sphere'].sort(), 'WD46: six material price families required');
  fail(new Set(Object.values(finishes)).size > 1, 'material prices must be differentiated');
  fail(/\bbrandLogo\s*:\s*\d+/.test(source), 'synthetic logo price missing');
  for (const name of ['initialSelection', 'priceSelection', 'createSelectionStore', 'transitionModel']) {
    fail(new RegExp(`export\\s+function\\s+${name}\\b`).test(source), `state function missing ${name}`);
    fail(new RegExp(`\\b${name}\\b`).test(app), `state not connected to application ${name}`);
  }
  fail(/from\s*["']\.\/demo-state\.mjs["']/.test(app), 'application must import local state/pricing');
  fail(/Number\.isSafeInteger\(total\)/.test(source), 'integer-cent total guard missing');
  return { modelBaseCents: models, materialCents: finishes, prices: 'SYNTHETIC', browserFlow: 'SEPARATE_GATE' };
}

export function assertWdRuntime47(controller, scene, app) {
  fail(/window\.WDCamera47\s*=\s*Object\.freeze\(\{\s*fitRadius\s*,\s*create\s*\}\)/.test(controller), 'reviewed camera controller export missing');
  fail(/scene\.__wdCamera47\s*=\s*window\.WDCamera47\.create\(\{\s*scene\s*,\s*camera\s*,\s*canvas\s*,\s*engine\s*\}\)/.test(scene), 'camera controller not connected to scene');
  for (const method of ['focus', 'resize', 'dispose']) fail(new RegExp(`scene\\.__wdCamera47(?:\\?\\.|\\.)${method}\\(`).test(scene), `camera controller ${method} bridge missing`);
  for (const method of ['focusCameraToArea', 'focusCameraToMeshes']) fail(new RegExp(`window\\.WDScene\\.${method}\\(`).test(app), `application camera ${method} bridge missing`);
  const imageMap = app.match(/\bconst\s+MODEL_IMAGE_MAP\s*=\s*\{([^}]+)\}/)?.[1];
  fail(imageMap, 'model thumbnail map missing');
  for (const [id, file] of Object.entries(THUMBNAILS)) {
    const entries = [...imageMap.matchAll(new RegExp(`\\b${id}\\s*:\\s*["']([^"']+)["']`, 'g'))];
    assert.equal(entries.length, 1, `WD47: exactly one ${id} thumbnail mapping required`);
    assert.equal(entries[0][1], path.posix.basename(file), `WD47: original ${id} thumbnail mapping required`);
  }
  fail(app.includes('`./assets/img-prodotto/${MODEL_IMAGE_MAP[seatModelId] || "Restyle.png"}`'), 'original thumbnail map must feed model preview');
  return { controller: 'STATIC_BINDING_CHECKED', thumbnails: 'ORIGINAL_PATHS_BOUND_TO_REVIEWED_HASHES', cameraInteraction: 'SEPARATE_BROWSER_AND_RUNTIME_GATES' };
}

export function assertWdGlb46(bytes, slots = {}) {
  fail(Buffer.isBuffer(bytes) && bytes.length >= 28, 'missing/truncated GLB');
  fail(bytes.toString('ascii', 0, 4) === 'glTF' && bytes.readUInt32LE(4) === 2, 'invalid GLB header/version');
  assert.equal(bytes.readUInt32LE(8), bytes.length, 'WD46: GLB declared length mismatch');
  let cursor = 12, json, hasGeometry = false;
  while (cursor < bytes.length) {
    fail(cursor + 8 <= bytes.length, 'truncated GLB chunk header');
    const size = bytes.readUInt32LE(cursor), type = bytes.readUInt32LE(cursor + 4);
    fail(size % 4 === 0 && cursor + 8 + size <= bytes.length, 'invalid GLB chunk extent');
    const chunk = bytes.subarray(cursor + 8, cursor + 8 + size);
    if (type === 0x4e4f534a) {
      fail(!json && cursor === 12, 'invalid GLB JSON ordering');
      json = JSON.parse(utf8.decode(chunk).trim());
    }
    if (type === 0x004e4942 && size > 0) hasGeometry = true;
    cursor += 8 + size;
  }
  fail(json?.asset?.version === '2.0' && Array.isArray(json.meshes) && json.meshes.length > 0 && hasGeometry, 'GLB lacks actual mesh/binary payload');
  for (const resource of [...(json.buffers || []), ...(json.images || [])]) fail(!resource.uri || resource.uri.startsWith('data:'), 'GLB external resource forbidden');
  const names = new Set([...(json.meshes || []), ...(json.nodes || [])].map(item => item.name));
  for (const group of Object.values(slots)) {
    fail(Array.isArray(group) && group.length > 0, 'empty model mesh slot');
    for (const name of group) fail(names.has(name), `mesh slot absent from GLB: ${name}`);
  }
  return { meshes: json.meshes.length, authenticity: 'BOUND_TO_SEPARATE_REVIEWED_HASH' };
}

export function assertWdModels46(base, products, readAsset, reviewedPaths) {
  const entries = base?.modelManifests;
  fail(Array.isArray(entries), 'model manifest list missing');
  assert.deepEqual(entries.map(entry => entry.id), MODEL_IDS, 'WD46: missing/extra/reordered model');
  fail(Array.isArray(products?.products), 'product list missing');
  assert.deepEqual(products.products.map(product => product.seatModelId), MODEL_IDS, 'WD46: both model products required');
  fail(products.products.every(product => product.productId === `DEMO-WD-${product.seatModelId.toUpperCase()}`), 'non-demo product identity');
  assert.equal(products.defaultProductId, 'DEMO-WD-RESTYLE', 'WD46: default synthetic product mismatch');
  const known = new Set(reviewedPaths), glbs = [], thumbnailHashes = [];
  for (const entry of entries) {
    const file = localResource(entry.file);
    fail(known.has(file), `unreviewed model manifest ${file}`);
    const model = JSON.parse(utf8.decode(readAsset(file)));
    assert.equal(model.id, entry.id, 'WD46: model identity mismatch');
    const glb = localResource(model.glb);
    fail(known.has(glb) && glb.endsWith('.glb'), `missing reviewed model binary ${glb}`);
    glbs.push(glb);
    assertWdGlb46(readAsset(glb), model.meshSlots);
    const thumbnail = ROUTE + THUMBNAILS[entry.id];
    fail(known.has(thumbnail), `missing original thumbnail ${entry.id}`);
    const thumbnailBytes = readAsset(thumbnail);
    fail(Buffer.isBuffer(thumbnailBytes) && thumbnailBytes.length > 8 && thumbnailBytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `original PNG thumbnail required ${entry.id}`);
    thumbnailHashes.push(digest(thumbnailBytes));
    for (const library of [model.normalMapLibrary, model.roughnessMapLibrary]) {
      fail(library && Object.keys(library).length > 0, `missing texture library ${entry.id}`);
      for (const map of Object.values(library)) {
        const mapPath = localResource(map.file);
        fail(known.has(mapPath), `unreviewed texture ${map.file}`);
        const mapBytes = readAsset(mapPath);
        fail(Buffer.isBuffer(mapBytes) && mapBytes.length > 0, `empty/missing texture payload ${map.file}`);
      }
    }
  }
  assert.equal(new Set(glbs).size, 2, 'WD46: models cannot share one substituted binary');
  assert.equal(new Set(thumbnailHashes).size, 2, 'WD47: models cannot share one substituted thumbnail');
  return { models: [...MODEL_IDS], glbs, thumbnails: Object.values(THUMBNAILS), thumbnailAuthenticity: 'BOUND_TO_SEPARATE_REVIEWED_HASHES' };
}

function assertPublication(root, publicationRoot) {
  const contract = readContract(root);
  const names = contract.files.map(record => record.file);
  assertWdFileSet46(listStatic(publicationRoot), names.filter(file => file.startsWith(ROUTE)));
  const bytes = new Map(contract.files.map(record => [record.file, regularFile(publicationRoot, record.file)]));
  const assets = contract.files.map(record => assertWdAsset46(bytes.get(record.file), record));
  const text = file => utf8.decode(canonicalBytes(bytes.get(ROUTE + file), true));
  const resources = assertWdHtml46(text('index.html'));
  for (const file of resources) fail(bytes.has(file), `unreviewed HTML dependency ${file}`);
  const vendor = [];
  for (const record of contract.files.filter(record => /\.(?:html|js|mjs|json|css)$/i.test(record.file))) {
    const result = assertWdApplicationText46(utf8.decode(canonicalBytes(bytes.get(record.file), true)), record.file);
    if (VENDOR_CODE.has(record.file)) vendor.push({ file: record.file, ...result });
  }
  const models = assertWdModels46(JSON.parse(text('models.base.json')), JSON.parse(text('data/demo-products.json')), file => bytes.get(file), names);
  const pricing = assertWdPricing46(text('demo-state.mjs'), text('app.js'));
  const runtime = assertWdRuntime47(text('camera-controller.js'), text('babylonScene.js'), text('app.js'));
  const headers = assertWdHeaders46(readFileSync(path.join(root, 'netlify.toml'), 'utf8'));
  return { status: 'PASS', files: assets.length, models, pricing, runtime, headers, vendor, binaryMode: 'RAW_BYTES', textMode: 'UTF8_CRLF_TO_LF_ONLY', leadForms: 'SEPARATE_FROZEN_SIX_FORM_GATE', browserAndCDN: 'SEPARATE_GATES' };
}

export function assertWd46Sources(root) {
  const result = assertPublication(root, root);
  assertWdEmbedMarkup46(readFileSync(path.join(root, 'src', '_includes', 'partials', 'wd-ecommerce-demo.njk'), 'utf8'));
  assertWdPosterLayout47(readFileSync(path.join(root, 'css', 'wd-ecommerce-embed.css'), 'utf8'));
  return result;
}

export function assertWd46Output(root, out) {
  const result = assertPublication(root, out);
  assertWdEmbedMarkup46(readFileSync(path.join(out, 'configuratori-ecommerce.html'), 'utf8'));
  assertWdPosterLayout47(readFileSync(path.join(out, 'css', 'wd-ecommerce-embed.css'), 'utf8'));
  return result;
}

export function assertWdPosterLayout47(css) {
  const rules = [...css.matchAll(/\.wd46-embed__poster img\s*\{([^}]+)\}/g)];
  assert.equal(rules.length, 1, 'WD47: one unambiguous poster image rule');
  assert.equal(rules[0][1].trim(), 'display: block; width: 100%; height: auto; aspect-ratio: 3 / 2; object-fit: contain;', 'WD47: full-width native3:2 poster without letterboxing');
  return { aspectRatio: '3/2', width: '100%', intrinsicHeight: 'auto' };
}
