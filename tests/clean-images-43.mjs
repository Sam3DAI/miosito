import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {readGitBlobBuffer, runGitText} from './git-binary-reader.mjs';
import {beforeProof44,productFiles44,assertProof44Sources} from './project-proof-ui-44.mjs';
import {beforeGalleries44r2,galleryProductFiles44r2,galleryStatic46,assertGallerySources44r2} from './project-galleries-44r2.mjs';
import {uiLiterals46} from './site-ui-46-literals.mjs';
import {uiLiterals47} from './site-ui-47-literals.mjs';
import {wdStaticFiles46} from './wd-static-46.mjs';
import {retainedWd46PosterFiles47,assertRetainedWd46PosterSources47,assertRetainedWd46PostersExcluded47} from './wd46-retained-posters47.mjs';
import {isUtilityCta47ProductFile} from './utility-cta47.mjs';
import {isMobileHoverProduct47R1} from './mobile-hover-47r1.mjs';
import {isInputProduct47R2} from './input-modality-47r2.mjs';

// Test-only digest oracle from the owner package, never imported by the site.
export const contract43 = JSON.parse(fs.readFileSync(new URL('./clean-images-43-contract.json', import.meta.url), 'utf8'));
const contract31 = JSON.parse(fs.readFileSync(new URL('./original-images-31-contract.json', import.meta.url), 'utf8'));
export const BASE_43 = contract43.base;
export const cleanFiles43 = contract43.items.flatMap(item => item.variants.map(v => v.file));
export const keptAssets43 = contract31.assets.filter(a => contract43.preserved.includes(a.id));
export const keptFiles43 = keptAssets43.flatMap(a => a.variants.map(v => v.file));
export const unusedFiles43 = contract31.assets.filter(a => !contract43.preserved.includes(a.id)).flatMap(a => a.variants.map(v => v.file));
export const publishedImageFiles43 = [...keptFiles43, ...cleanFiles43];
export const aiItems43 = contract43.items.filter(item => item.id.startsWith('AI-'));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const lf = text => text.replace(/\r\n/g, '\n');
const stable = object => JSON.stringify(Object.fromEntries(Object.entries(object).sort(([a],[b]) => a.localeCompare(b))));
const dataFile = 'src/_data/originalImages31.json';
const aiFile = 'src/automazioni-ai-business.njk';
export const classificationCss43 = '/* The taller AI source needs copy clearance; keep the whole 2:3 composition. */\n.visual-card--original[data-original-asset="AI-02"] .visual-card__image { top: auto; height: 85%; }\n';
export const internalAssistantCss43 = '/* Keep the high authorization panel below the existing multi-line AI copy. */\n.visual-card--original[data-original-asset="AI-08"] .visual-card__image { top: auto; height: 80%; }\n';

export function assertMetadata43(metadata, baseline) {
  assert.deepEqual(Object.keys(metadata), [...Object.keys(baseline), ...aiItems43.map(a => a.id)], '43 partial merge: exactly 32 slots in preserved order');
  for (const id of contract43.preserved) assert.deepEqual(metadata[id], baseline[id], id + ': exact retained metadata');
  for (const item of contract43.items) {
    assert.equal(sha(stable(metadata[item.id])), item.metadataSha256, item.id + ': exact owner metadata digest');
    assert.equal(metadata[item.id].srcset, item.variants.map(v => '/' + v.file + ' ' + v.width + 'w').join(', '), item.id + ': complete exact srcset');
  }
  return {mapped:contract43.items.length, retained:contract43.preserved.length, total:Object.keys(metadata).length};
}

export function clean43Binding(id) {
  return ', image: originalImages31["' + id + '"].src, alt: originalImages31["' + id + '"].alt, imageMeta: originalImages31["' + id + '"]';
}

// Reverse only the nine literal authorized additions; independent source checks
// below bind each one to its existing card/title and forbid all other edits.
export function beforeCleanImages43(file, input) {
  let source = beforeProof44(file,input);
  if (file === 'css/marketing-pages.css') return source.replace(classificationCss43, '').replace(internalAssistantCss43, '');
  if (file !== aiFile) return source;
  for (const item of aiItems43) source = source.replace(clean43Binding(item.id), '');
  return source;
}

export function assertAiBindings43(source, baseline) {
  assert.equal(beforeCleanImages43(aiFile, source), lf(baseline), '43 AI: only nine image/alt/imageMeta additions, all other bytes frozen');
  const collection = source.match(/{% set useItems = \[[\s\S]*?\] %}/)?.[0];
  assert.ok(collection, '43 existing useItems collection');
  const cards = collection.match(/\{ label:[^\n]+\}/g) || [];
  assert.equal(cards.length, aiItems43.length, '43 nine existing AI cards');
  for (const [index, item] of aiItems43.entries()) {
    assert.ok(cards[index].includes('title: "' + item.title + '"'), item.id + ': title and order');
    assert.ok(cards[index].includes(clean43Binding(item.id)), item.id + ': exact image binding on its own card');
    assert.equal(source.split(clean43Binding(item.id)).length, 2, item.id + ': unique image binding');
  }
}

// Independent WebP header reader, used alongside SHA and source31's parser.
export function dimensions43(bytes) {
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.equal(bytes.readUInt32LE(4) + 8, bytes.length, '43 complete RIFF file');
  for (let p=12; p+8<=bytes.length;) {
    const length=bytes.readUInt32LE(p+4), start=p+8, kind=bytes.toString('ascii',p,p+4);
    assert.ok(start+length<=bytes.length, '43 complete chunk');
    if(kind==='VP8X') return [bytes.readUIntLE(start+4,3)+1,bytes.readUIntLE(start+7,3)+1];
    if(kind==='VP8 ') return [bytes.readUInt16LE(start+6)&0x3fff,bytes.readUInt16LE(start+8)&0x3fff];
    if(kind==='VP8L') {const bits=bytes.readUInt32LE(start+1);assert.equal(bytes[start],0x2f);return [(bits&0x3fff)+1,((bits>>>14)&0x3fff)+1];}
    p=start+length+(length%2);
  }
  assert.fail('43 missing WebP dimensions');
}

export function assertCleanFile43(bytes, expected) {
  assert.ok(Buffer.isBuffer(bytes), expected.file + ': missing srcset file');
  assert.equal(bytes.length, expected.bytes, expected.file + ': byte count');
  assert.equal(sha(bytes), expected.sha256, expected.file + ': approved package bytes');
  assert.deepEqual(dimensions43(bytes), [expected.width,expected.height], expected.file + ': width descriptor and dimensions');
}

export function assertImageFiles43(files) {
  assert.equal(cleanFiles43.length,84);
  assert.equal(new Set(cleanFiles43).size,84);
  for (const item of contract43.items) {
    assert.deepEqual(item.variants.map(v => v.width), item.id==='AI-02' ? [350,700,1024] : [350,700,1050]);
    for (const variant of item.variants) assertCleanFile43(files.get(variant.file), variant);
  }
  return {slots:28, files:84, bytes:contract43.items.flatMap(a => a.variants).reduce((n,v) => n+v.bytes,0)};
}

export function assertCleanConfig43(current, baseline) {
  current=beforeGalleries44r2('eleventy.config.js',current);
  const entries = source => [...source.matchAll(/^  "(assets\/images\/(?:originals-31|cards-43)\/[^"\n]+)"[,]?$/gm)].map(m => m[1]);
  assert.deepEqual(entries(lf(current)), publishedImageFiles43, '43 exact 12 retained and 84 new published image files');
  assert.equal(entries(lf(baseline)).length,69, '43 baseline publish image inventory');
  const strip = source => lf(source).replace(/^  "assets\/images\/(?:originals-31|cards-43)\/[^"\n]+"[,]?\n/gm,'').replace('  "sitemap.xml",\n]);','  "sitemap.xml"\n]);');
  assert.equal(strip(current),strip(baseline),'43 configuration changes only exact image allowlist');
}

export function isClean43ProductFile(file,root=fileURLToPath(new URL('../',import.meta.url))) {
  if (isUtilityCta47ProductFile(file,root)) return true; // Exact three-file content guard, never a wildcard.
  if (isMobileHoverProduct47R1(file,root)) return true; // Three exact CSS paths, each with an independent full-delta guard.
  if (isInputProduct47R2(file,root)) return true; // Exactly two fully guarded pointer-decoration sources, no directory exception.
  // Later owner-authorized tasks extend the exact file set; no directory wildcard.
  // Their current-content/pixel/runtime oracles remain mandatory in full verification.
  const ui46=Object.keys(uiLiterals46.edits).includes(file)||Object.keys(uiLiterals47.edits).includes(file)||file==='src/_data/cardDetails46.js'||galleryStatic46.includes(file);
  const wd46=['css/wd-ecommerce-embed.css','js/wd-ecommerce-embed.js','src/_includes/partials/wd-ecommerce-demo.njk',...wdStaticFiles46(root)].includes(file);
  return [dataFile,aiFile,'eleventy.config.js','css/marketing-pages.css'].includes(file) || cleanFiles43.includes(file) || productFiles44.includes(file) || galleryProductFiles44r2.includes(file) || ui46 || wd46 || retainedWd46PosterFiles47.includes(file);
}

export function assertClassificationCss43(source,baseline) {
  source=beforeProof44('css/marketing-pages.css',source);
  assert.equal(lf(source).split(classificationCss43).length,2,'43 unique observed AI-02 clearance fix');
  assert.equal(lf(source).split(internalAssistantCss43).length,2,'43 unique observed AI-08 clearance fix');
  assert.equal(beforeCleanImages43('css/marketing-pages.css',source),lf(baseline),'43 CSS only the exact AI-02/AI-08 positioning deltas');
}

export function assertCleanSources43(root) {
  const retainedWd46=assertRetainedWd46PosterSources47(root);
  assertGallerySources44r2(root);
  // Owner explicitly approved the literal CSS/SVG adaptation for44. Validate
  // the entire bounded delta first; all historical43 checks still run below.
  assertProof44Sources(root);
  const baseline = file => readGitBlobBuffer(BASE_43,file,root).buffer.toString('utf8');
  const metadata = assertMetadata43(JSON.parse(fs.readFileSync(path.join(root,dataFile),'utf8')),JSON.parse(baseline(dataFile)));
  assertAiBindings43(fs.readFileSync(path.join(root,aiFile),'utf8'),baseline(aiFile));
  assertClassificationCss43(fs.readFileSync(path.join(root,'css/marketing-pages.css'),'utf8'),baseline('css/marketing-pages.css'));
  assertCleanConfig43(fs.readFileSync(path.join(root,'eleventy.config.js'),'utf8'),baseline('eleventy.config.js'));
  assert.deepEqual(fs.readdirSync(path.join(root,'assets/images/cards-43')).sort(),cleanFiles43.map(file => path.basename(file)).sort(),'43 no PNG masters, QA files or rejected fallback in new asset folder');
  const images=assertImageFiles43(new Map(cleanFiles43.map(file => [file,fs.readFileSync(path.join(root,file))])));
  for(const file of runGitText(['diff','--name-only',BASE_43,'--'],root).trim().split('\n').filter(Boolean)) {
    assert.ok(isClean43ProductFile(file,root)||file.startsWith('tests/')||file==='netlify.toml',file+': outside43/44/46 exact allowlist');
  }
  return {...metadata,...images,baseline:BASE_43,publishedImages:publishedImageFiles43.length,unusedVariantsExcluded:unusedFiles43.length,retainedWd46Posters:retainedWd46.files};
}

export function assertCleanOutput43(files) {
  assertRetainedWd46PostersExcluded47(files);
  const images=assertImageFiles43(files);
  for(const file of unusedFiles43) assert.equal(files.has(file),false,file+': unused superseded variant must not publish');
  for(const asset of keptAssets43) for(const variant of asset.variants) assertCleanFile43(files.get(variant.file),variant);
  for(const [file,bytes] of files) {
    if(!/\.(?:html|css|js|json|xml)$/.test(file)) continue;
    const text=String(bytes);
    for(const unused of unusedFiles43) assert.ok(!text.includes(unused),file+': zero residual uses of '+unused);
    assert.doesNotMatch(text,/(?:cards-43|originals-31)\/[^\s"'<>]*\.png|assets\/images\/[^\s"'<>]*(?:rejected-30|cards-30)/i,file+': no master or rejected imagery');
    if(file.endsWith('.css')) assert.doesNotMatch(text,/cards-43\//,file+': no duplicate CSS image requests');
  }
  return {...images,retainedFiles:keptFiles43.length,excludedSupersededFiles:unusedFiles43.length};
}
