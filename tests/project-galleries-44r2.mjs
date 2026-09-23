import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {readGitBlobBuffer} from './git-binary-reader.mjs';

// Independent, reviewed digest/wording oracle. No private client paths or data.
export const galleryContract44r2=JSON.parse(fs.readFileSync(new URL('./project-galleries-44r2-contract.json',import.meta.url),'utf8'));
export const galleryStatic44r2=galleryContract44r2.publishedStatic;
export const galleryProductFiles44r2=[...Object.keys(galleryContract44r2.edits),...Object.keys(galleryContract44r2.sourceHashes),...galleryContract44r2.images.map(i=>i.file)];
const lf=s=>s.replace(/\r\n/g,'\n');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const attr=(tag,name)=>tag.match(new RegExp('(?:^|\\s)'+name+'="([^"]*)"'))?.[1];

// Reverse only three exact homepage replacements and one exact static-list insertion.
// Unknown edits remain visible to every historical oracle; no regex stripping.
export function beforeGalleries44r2(file,input){let result=lf(input);for(const e of galleryContract44r2.edits[file]||[])result=result.replace(e.after,e.before);return result;}
export function assertGalleryDelta44r2(file,current,baseline){let expected=lf(baseline);for(const e of galleryContract44r2.edits[file]||[]){assert.equal(expected.split(e.before).length,2,file+': unique44R2 callsite');expected=expected.replace(e.before,e.after);}assert.equal(lf(current),expected,file+': exact bounded44R2 delta');assert.equal(beforeGalleries44r2(file,current),lf(baseline),file+': reversible44R2');}
export function assertGallerySource44r2(file,text){assert.equal(sha(Buffer.from(lf(text))),galleryContract44r2.sourceHashes[file],file+': reviewed44R2 source');}
export function assertGalleryAsset44r2(bytes,record){assert.equal(bytes.length,record.bytes,record.file+': byte count');assert.equal(sha(bytes),record.sha256,record.file+': authentic sanitized44R2 pixels');assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');assert.equal(bytes.readUInt32LE(4)+8,bytes.length);let dimensions;for(let p=12;p+8<=bytes.length;){const length=bytes.readUInt32LE(p+4),start=p+8,kind=bytes.toString('ascii',p,p+4);assert.ok(start+length<=bytes.length);assert.ok(!['EXIF','XMP ','ICCP'].includes(kind),'No private metadata');if(kind==='VP8 ')dimensions=[bytes.readUInt16LE(start+6)&0x3fff,bytes.readUInt16LE(start+8)&0x3fff];if(kind==='VP8X')dimensions=[bytes.readUIntLE(start+4,3)+1,bytes.readUIntLE(start+7,3)+1];p=start+length+(length%2);}assert.deepEqual(dimensions,[record.width,record.height]);}
export function assertGallerySources44r2(root){
 for(const f of Object.keys(galleryContract44r2.edits))assertGalleryDelta44r2(f,fs.readFileSync(path.join(root,f),'utf8'),readGitBlobBuffer(galleryContract44r2.base,f,root).buffer.toString('utf8'));
 for(const f of Object.keys(galleryContract44r2.sourceHashes))assertGallerySource44r2(f,fs.readFileSync(path.join(root,f),'utf8'));
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'src/_data/projectProofs.json'))),galleryContract44r2.projects);
 assert.deepEqual(galleryContract44r2.projects.map(p=>p.id),['biliarditaly','linea-oro','pilan']);
 assert.deepEqual(galleryContract44r2.projects.map(p=>p.views.length),[3,2,3]);
 assert.equal(galleryContract44r2.images.length,24);assert.equal(galleryStatic44r2.length,26);
 assert.deepEqual(fs.readdirSync(path.join(root,'assets/images/projects-44r2')).sort(),galleryContract44r2.images.map(i=>path.basename(i.file)).sort(),'Only sanitized portfolio derivatives, no client apps/fixtures/masters');
 for(const record of galleryContract44r2.images)assertGalleryAsset44r2(fs.readFileSync(path.join(root,record.file)),record);
 return {galleries:3,captures:8,derivatives:24,sourceDelta:'EXACT',coreContracts:'UNCHANGED'};
}
export function assertGalleryHtml44r2(html){
 assert.equal((html.match(/<dialog\b/g)||[]).length,3,'Exactly three real galleries');
 assert.equal((html.match(/data-project-trigger=/g)||[]).length,3);
 assert.equal((html.match(/data-project-fallback=/g)||[]).length,3,'Readable no-JS fallbacks');
 assert.equal((html.match(/data-gallery-view/g)||[]).length,8);
 assert.doesNotMatch(html,/AggregateRating|"@type"\s*:\s*"Review"|recensione verificata/);
 assert.ok(html.includes('Progetti realizzati per configurare prodotti e supportare il lavoro commerciale.'));
 const triggers=[...html.matchAll(/data-project-trigger="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(triggers,['biliarditaly','linea-oro','pilan']);
 for(const project of galleryContract44r2.projects){
  const cover=project.views[0],coverBase='/assets/images/projects-44r2/'+cover.file;
  const coverTag=[...html.matchAll(/<img\b[^>]*>/g)].map(m=>m[0]).find(tag=>attr(tag,'src')===coverBase+'-800.webp');
  assert.ok(coverTag,'Authentic cover '+project.id);assert.equal(attr(coverTag,'srcset'),[480,800].map(w=>coverBase+'-'+w+'.webp '+w+'w').join(', '));assert.equal(attr(coverTag,'loading'),'lazy');assert.equal(attr(coverTag,'width'),String(cover.width));assert.equal(attr(coverTag,'height'),String(cover.height));assert.equal(attr(coverTag,'alt'),cover.alt);
  const dialog=html.match(new RegExp('<dialog\\b[^>]*data-project-dialog="'+project.id+'"[\\s\\S]*?<\\/dialog>'))?.[0];assert.ok(dialog,'Required dialog '+project.id);
  assert.ok(dialog.includes('aria-labelledby="gallery-title-'+project.id+'"'));assert.ok(dialog.includes('aria-describedby="gallery-description-'+project.id+'"'));
  assert.ok(dialog.includes(project.title));assert.ok(dialog.includes(project.description));
  assert.equal(dialog.split('Interfaccia del progetto con dati dimostrativi.').length,2,'One demo note per gallery');
  assert.ok(dialog.includes('data-gallery-close'));assert.ok(dialog.includes('autofocus'));assert.ok(dialog.includes('aria-label="Chiudi la galleria '+project.name+'"'));
  assert.ok(dialog.includes('data-gallery-previous'));assert.ok(dialog.includes('data-gallery-next'));assert.ok(dialog.includes('role="status" aria-live="polite"'));
  assert.ok(dialog.includes('href="/contattaci#contatti"'));assert.ok(dialog.includes('Richiedi una soluzione simile'));
  const images=[...dialog.matchAll(/<img\b[^>]*>/g)].map(m=>m[0]);assert.equal(images.length,project.views.length);
  project.views.forEach((view,i)=>{const tag=images[i],base='/assets/images/projects-44r2/'+view.file;assert.equal(attr(tag,'src'),undefined,'Large image must wait for interaction');assert.equal(attr(tag,'srcset'),undefined);assert.equal(attr(tag,'data-gallery-src'),base+'-1280.webp');assert.equal(attr(tag,'data-gallery-srcset'),[480,800,1280].map(w=>base+'-'+w+'.webp '+w+'w').join(', '));assert.equal(attr(tag,'width'),String(view.width));assert.equal(attr(tag,'height'),String(view.height));assert.equal(attr(tag,'alt'),view.alt);assert.ok(dialog.includes(view.caption));});
  const fallback=html.match(new RegExp('<section id="progetto-'+project.id+'"[\\s\\S]*?<\\/section>'))?.[0];assert.ok(fallback);assert.doesNotMatch(fallback.split('>')[0],/\shidden/);for(const v of project.views)assert.ok(fallback.includes('href="/assets/images/projects-44r2/'+v.file+'-1280.webp"'));
 }
 return {galleries:3,views:8,progressiveFallback:true,largeImagesOnDemand:true};
}
export function isDeferredGallery44r2(tag,file){return /^<img\b/.test(tag)&&galleryContract44r2.images.some(i=>i.file===file)&&(attr(tag,'loading')==='lazy'||Boolean(attr(tag,'data-gallery-src')));}
