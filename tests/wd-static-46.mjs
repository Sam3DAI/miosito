import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

// The reviewed oracle is supplied separately, after review of the publication.
// Importing this module neither generates that oracle nor reads product files.
const ROUTE = 'demo/ecommerce/';
const MODEL_IDS = ['restyle', 'zip'];
const POSTERS = ['assets/images/wd46-poster-768.webp', 'assets/images/wd46-poster-1440.webp'];
const VENDOR_CODE = new Set([`${ROUTE}vendor/babylon.js`, `${ROUTE}vendor/babylonjs.loaders.min.js`]);
const ESSENTIAL = [
  'index.html', 'app.js', 'embed.js', 'demo-state.mjs', 'models.base.json',
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
  assert.equal(contract.source, 'WD46_REVIEWED', 'WD46: unreviewed source');
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
  return assertWdContract46(JSON.parse(readFileSync(path.join(root, 'tests', 'wd-static-46-contract.json'), 'utf8')));
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
  fail(/prezzi esemplificativi/i.test(html) && /nessun ordine viene inviato/i.test(html), 'synthetic-price / no-order notice missing');
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
  for (const poster of POSTERS) fail(html.includes(`/${poster}`), `responsive poster missing ${poster}`);
  assert.match(html, /<button\b[^>]*type=["']button["'][^>]*data-wd46-start/i, 'WD46: start must not submit a form');
  assert.match(html, /<a\b[^>]*href=["']\/demo\/ecommerce\/["']/i, 'WD46: standalone fallback missing');
  fail(/\bdata-wd46-stage\b[^>]*\bhidden\b/.test(html), 'initial stage must be hidden');
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
  const known = new Set(reviewedPaths), glbs = [];
  for (const entry of entries) {
    const file = localResource(entry.file);
    fail(known.has(file), `unreviewed model manifest ${file}`);
    const model = JSON.parse(utf8.decode(readAsset(file)));
    assert.equal(model.id, entry.id, 'WD46: model identity mismatch');
    const glb = localResource(model.glb);
    fail(known.has(glb) && glb.endsWith('.glb'), `missing reviewed model binary ${glb}`);
    glbs.push(glb);
    assertWdGlb46(readAsset(glb), model.meshSlots);
    for (const library of [model.normalMapLibrary, model.roughnessMapLibrary]) {
      fail(library && Object.keys(library).length > 0, `missing texture library ${entry.id}`);
      for (const map of Object.values(library)) fail(known.has(localResource(map.file)), `unreviewed texture ${map.file}`);
    }
  }
  assert.equal(new Set(glbs).size, 2, 'WD46: models cannot share one substituted binary');
  return { models: [...MODEL_IDS], glbs };
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
  const headers = assertWdHeaders46(readFileSync(path.join(root, 'netlify.toml'), 'utf8'));
  return { status: 'PASS', files: assets.length, models, pricing, headers, vendor, binaryMode: 'RAW_BYTES', textMode: 'UTF8_CRLF_TO_LF_ONLY', leadForms: 'SEPARATE_FROZEN_SIX_FORM_GATE', browserAndCDN: 'SEPARATE_GATES' };
}

export function assertWd46Sources(root) {
  const result = assertPublication(root, root);
  assertWdEmbedMarkup46(readFileSync(path.join(root, 'src', '_includes', 'partials', 'wd-ecommerce-demo.njk'), 'utf8'));
  return result;
}

export function assertWd46Output(root, out) {
  const result = assertPublication(root, out);
  assertWdEmbedMarkup46(readFileSync(path.join(out, 'configuratori-ecommerce.html'), 'utf8'));
  return result;
}
