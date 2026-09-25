import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {readGitBlobBuffer} from './git-binary-reader.mjs';
import {beforeUi46Literals} from './site-ui-46-literals.mjs';
import {beforeWd46} from './site-wd-delta-46.mjs';
import {beforeUi47Literals,assertUi47Literals} from './site-ui-47-literals.mjs';

// Both reviewed oracles remain: old sanitized derivatives are retained byte-identically;
// current galleries use the 20 owner captures and their 60 independently checked derivatives.
export const galleryContract44r2=JSON.parse(fs.readFileSync(new URL('./project-galleries-44r2-contract.json',import.meta.url),'utf8'));
export const galleryContract46=JSON.parse(fs.readFileSync(new URL('./project-galleries-46-contract.json',import.meta.url),'utf8'));
export const galleryStatic44r2=galleryContract44r2.publishedStatic;
export const galleryStatic46=galleryContract46.publishedStatic;
export const galleryProductFiles44r2=[...Object.keys(galleryContract44r2.edits),...Object.keys(galleryContract44r2.sourceHashes),...galleryContract44r2.images.map(i=>i.file)];
const lf=s=>s.replace(/\r\n/g,'\n');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const attr=(tag,name)=>tag.match(new RegExp('(?:^|\\s)'+name+'="([^"]*)"'))?.[1];
const before46=(file,input)=>beforeUi46Literals(file,beforeWd46(file,input));

// Only exact reviewed callsites are reversed for earlier invariants. Unknown edits
// remain visible. Active CSS, JS, data and rendered behavior have direct current oracles.
export function beforeGalleries44r2(file,input){let result=before46(file,input);for(const e of galleryContract44r2.edits[file]||[])result=result.replace(e.after,e.before);return result;}
export function assertGalleryDelta44r2(file,current,baseline){let expected=lf(baseline);for(const e of galleryContract44r2.edits[file]||[]){assert.equal(expected.split(e.before).length,2,file+': unique44R2 callsite');expected=expected.replace(e.before,e.after);}assert.equal(before46(file,current),expected,file+': exact bounded44R2 delta with authorized46 callsites');assert.equal(beforeGalleries44r2(file,current),lf(baseline),file+': reversible44R2');}
export function assertGallerySource44r2(file,text){assert.equal(sha(Buffer.from(beforeUi47Literals(file,text))),galleryContract46.sourceHashes[file],file+': reviewed46 gallery source with only exact authorized47 UI changes');}
export function assertGalleryAsset44r2(bytes,record){assert.equal(bytes.length,record.bytes,record.file+': byte count');assert.equal(sha(bytes),record.sha256,record.file+': authentic sanitized pixels');assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');assert.equal(bytes.readUInt32LE(4)+8,bytes.length);let dimensions;for(let p=12;p+8<=bytes.length;){const length=bytes.readUInt32LE(p+4),start=p+8,kind=bytes.toString('ascii',p,p+4);assert.ok(start+length<=bytes.length);assert.ok(!['EXIF','XMP ','ICCP'].includes(kind),'No private metadata');if(kind==='VP8 ')dimensions=[bytes.readUInt16LE(start+6)&0x3fff,bytes.readUInt16LE(start+8)&0x3fff];if(kind==='VP8X')dimensions=[bytes.readUIntLE(start+4,3)+1,bytes.readUIntLE(start+7,3)+1];if(kind==='VP8L'){assert.equal(bytes[start],0x2f);const packed=bytes.readUInt32LE(start+1);dimensions=[(packed&0x3fff)+1,((packed>>>14)&0x3fff)+1];}p=start+length+(length%2);}assert.deepEqual(dimensions,[record.width,record.height]);}
export function assertGallerySources44r2(root){
 assertUi47Literals(root); // Current47 is mandatory before any historical reconstruction.
 for(const f of Object.keys(galleryContract44r2.edits))assertGalleryDelta44r2(f,fs.readFileSync(path.join(root,f),'utf8'),readGitBlobBuffer(galleryContract44r2.base,f,root).buffer.toString('utf8'));
 for(const f of Object.keys(galleryContract46.sourceHashes))assertGallerySource44r2(f,fs.readFileSync(path.join(root,f),'utf8'));
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'src/_data/projectProofs.json'))),galleryContract46.projects);
 assert.deepEqual(galleryContract46.projects.map(p=>p.id),['biliarditaly','linea-oro','pilan']);
 assert.deepEqual(galleryContract46.projects.map(p=>p.views.length),[6,8,6]);
 assert.equal(galleryContract44r2.images.length,24);assert.equal(galleryStatic44r2.length,26);
 assert.equal(galleryContract46.images.length,60);assert.equal(galleryStatic46.length,60);
 for(const [directory,records] of [['projects-44r2',galleryContract44r2.images],['projects-46',galleryContract46.images]]){
  assert.deepEqual(fs.readdirSync(path.join(root,'assets/images',directory)).sort(),records.map(i=>path.basename(i.file)).sort(),'Only reviewed portfolio derivatives, no client apps/fixtures/masters');
  for(const record of records)assertGalleryAsset44r2(fs.readFileSync(path.join(root,record.file)),record);
 }
 return {galleries:3,captures:20,derivatives:60,retainedHistoricalDerivatives:24,sourceDelta:'EXACT',coreContracts:'UNCHANGED'};
}
export function assertGalleryHtml44r2(html){
 assert.equal((html.match(/<dialog\b[^>]*data-project-dialog=/g)||[]).length,3,'Exactly three real galleries, independent of the shared editorial dialog');
 assert.equal((html.match(/data-project-trigger=/g)||[]).length,3);
 assert.equal((html.match(/data-project-fallback=/g)||[]).length,3,'Readable no-JS fallbacks');
 assert.equal((html.match(/data-gallery-view/g)||[]).length,20);
 assert.doesNotMatch(html,/AggregateRating|"@type"\s*:\s*"Review"|recensione verificata/);
 assert.ok(html.includes('Progetti realizzati per configurare prodotti e supportare il lavoro commerciale.'));
 const triggers=[...html.matchAll(/data-project-trigger="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(triggers,['biliarditaly','linea-oro','pilan']);
 for(const project of galleryContract46.projects){
  const cover=project.views[0];
  const coverTag=[...html.matchAll(/<img\b[^>]*>/g)].map(m=>m[0]).find(tag=>attr(tag,'src')===cover.thumb);
  assert.ok(coverTag,'Authentic cover '+project.id);assert.equal(attr(coverTag,'srcset'),cover.cardSrcset);assert.doesNotMatch(coverTag,/2560\.webp/);assert.equal(attr(coverTag,'loading'),'lazy');assert.equal(attr(coverTag,'width'),String(cover.width));assert.equal(attr(coverTag,'height'),String(cover.height));assert.equal(attr(coverTag,'alt'),cover.alt);
  const dialog=html.match(new RegExp('<dialog\\b[^>]*data-project-dialog="'+project.id+'"[\\s\\S]*?<\\/dialog>'))?.[0];assert.ok(dialog,'Required dialog '+project.id);
  assert.ok(dialog.includes('aria-labelledby="gallery-title-'+project.id+'"'));assert.ok(dialog.includes('aria-describedby="gallery-description-'+project.id+'"'));
  assert.equal((dialog.match(/<h3\b/g)||[]).length,1);assert.ok(dialog.includes('>'+project.name+'</h3>'));assert.ok(dialog.includes(project.title));assert.ok(dialog.includes(project.detail));
  if(project.privacyNote)assert.equal(dialog.split(project.privacyNote).length,2,'One accurate masking note');else assert.doesNotMatch(dialog,/Dati riservati oscurati/);
  assert.doesNotMatch(dialog,/Interfaccia del progetto con dati dimostrativi/);
  assert.ok(dialog.includes('data-gallery-close'));assert.ok(dialog.includes('autofocus'));assert.ok(dialog.includes('aria-label="Chiudi la galleria '+project.name+'"'));
  assert.ok(dialog.includes('data-gallery-previous'));assert.ok(dialog.includes('data-gallery-next'));assert.ok(dialog.includes('role="status" aria-live="polite"'));
  assert.ok(dialog.includes('href="/contattaci#contatti"'));assert.ok(dialog.includes('Richiedi un preventivo'));
  assert.ok(dialog.includes('data-gallery-large-link'));assert.ok(dialog.includes('target="_blank" rel="noopener"'));
  const images=[...dialog.matchAll(/<img\b[^>]*>/g)].map(m=>m[0]);assert.equal(images.length,project.views.length);
  project.views.forEach((view,i)=>{const tag=images[i];assert.equal(attr(tag,'src'),undefined,'Large image must wait for interaction');assert.equal(attr(tag,'srcset'),undefined);assert.equal(attr(tag,'data-gallery-src'),view.src);assert.equal(attr(tag,'data-gallery-srcset'),view.srcset);assert.equal(attr(tag,'width'),String(view.width));assert.equal(attr(tag,'height'),String(view.height));assert.equal(attr(tag,'alt'),view.alt);assert.ok(dialog.includes(view.caption));assert.ok(dialog.includes('data-gallery-large="'+view.large+'"'));});
  const fallback=html.match(new RegExp('<section id="progetto-'+project.id+'"[\\s\\S]*?<\\/section>'))?.[0];assert.ok(fallback);assert.doesNotMatch(fallback.split('>')[0],/\shidden/);for(const v of project.views)assert.ok(fallback.includes('href="'+v.large+'"'));
 }
 return {galleries:3,views:20,progressiveFallback:true,largeImagesOnDemand:true};
}
export function isDeferredGallery44r2(tag,file){return /^<img\b/.test(tag)&&[...galleryContract44r2.images,...galleryContract46.images].some(i=>i.file===file)&&(attr(tag,'loading')==='lazy'||Boolean(attr(tag,'data-gallery-src')));}
