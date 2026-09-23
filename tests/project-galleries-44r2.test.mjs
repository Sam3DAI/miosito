import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import nunjucks from 'nunjucks';
import {readGitBlobBuffer} from './git-binary-reader.mjs';
import {galleryContract44r2 as contract,galleryStatic44r2,assertGalleryDelta44r2,assertGallerySource44r2,assertGalleryAsset44r2,assertGallerySources44r2,assertGalleryHtml44r2,isDeferredGallery44r2,beforeGalleries44r2} from './project-galleries-44r2.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const html=()=>nunjucks.renderString(read('src/_includes/partials/project-proof-galleries.njk'),{projectProofs:contract.projects})+'<p>Progetti realizzati per configurare prodotti e supportare il lavoro commerciale.</p>';

test('44R2 three authentic galleries, eight captures, 24 exact clean derivatives',()=>assert.deepEqual(assertGallerySources44r2(root),{galleries:3,captures:8,derivatives:24,sourceDelta:'EXACT',coreContracts:'UNCHANGED'}));
test('44R2 exact inverse retains all homepage and configuration baseline bytes',()=>{for(const f of Object.keys(contract.edits)){const old=readGitBlobBuffer(contract.base,f,root).buffer.toString('utf8');assertGalleryDelta44r2(f,read(f),old);assert.equal(beforeGalleries44r2(f,read(f)),old.replace(/\r\n/g,'\n'));assert.throws(()=>assertGalleryDelta44r2(f,read(f)+'\nUnexpected delta',old));}});
test('44R2 refuses unrelated homepage wording and client-runtime publication',()=>{const f='src/index.njk',old=readGitBlobBuffer(contract.base,f,root).buffer.toString('utf8');assert.throws(()=>assertGalleryDelta44r2(f,read(f).replace('Trasformiamo prodotti','Inventiamo risultati'),old));const c='eleventy.config.js';assert.throws(()=>assertGalleryDelta44r2(c,read(c).replace('  "404.html",','  "client-app.js",\n  "404.html",'),readGitBlobBuffer(contract.base,c,root).buffer.toString('utf8')));});
test('44R2 rejects modified capture bytes, wrong dimensions and truncated metadata',()=>{const r=contract.images[0],b=fs.readFileSync(new URL('../'+r.file,import.meta.url));assertGalleryAsset44r2(b,r);const altered=Buffer.from(b);altered[altered.length-1]^=1;assert.throws(()=>assertGalleryAsset44r2(altered,r));assert.throws(()=>assertGalleryAsset44r2(b,{...r,width:r.width+1}));assert.throws(()=>assertGalleryAsset44r2(b.subarray(0,-1),r));});
test('44R2 refuses fabricated claims, removed image masking and changed project order',()=>{const f='src/_data/projectProofs.json',s=read(f);for(const changed of [s.replace('BiliardItaly','Invented Client'),s.replace('Importi dimostrativi oscurati.','Risultati garantiti.'),s.replace('"id": "linea-oro"','"id": "pilan"')])assert.throws(()=>assertGallerySource44r2(f,changed));});
test('44R2 refuses image shrinking, cropping, unreadable cover titles and changed UI tokens',()=>{const f='css/project-proof-galleries.css',s=read(f);for(const changed of [s.replace('width: 100%','width: 80%'),s.replace('object-fit: contain','object-fit: cover'),s.replace('.project-proof-rail .visual-card__copy h3 { color: var(--sx-text); }',''),s+'\nbody {background:red}'])assert.throws(()=>assertGallerySource44r2(f,changed));});
test('44R2 refuses missing modal safeguards, restoration or unsolicited autoplay',()=>{const f='js/project-proof-galleries.js',s=read(f);for(const changed of [s.replace('dialog.showModal()','dialog.show()'),s.replace('trigger.focus({ preventScroll: true });',''),s.replace('if (active || menu?.open || otherDialog)','if (false)'),s+'\nsetInterval(()=>{},1000)'])assert.throws(()=>assertGallerySource44r2(f,changed));});
test('44R2 explicit Tab loop wraps both ends and preserves native middle navigation',()=>{
 const events={},document={activeElement:null};
 const control=()=>({addEventListener(){},setAttribute(){},getClientRects:()=>[{}],focus(options){assert.equal(options.preventScroll,true);document.activeElement=this;}});
 const controls=Array.from({length:4},control),fallback={},trigger=control();
 const dialog={dataset:{projectDialog:'fixture'},querySelectorAll:s=>s==='[data-gallery-view]'?[{},{}]:controls,querySelector:s=>({'[data-gallery-close]':controls[0],'[data-gallery-status]':{},'[data-gallery-previous]':controls[1],'[data-gallery-next]':controls[2]})[s],addEventListener:(name,fn)=>{events[name]=fn;}};
 Object.assign(document,{getElementById:()=>null,querySelectorAll:()=>[dialog],querySelector:s=>s.startsWith('[data-project-trigger')?trigger:fallback});
 function HTMLDialogElement(){} HTMLDialogElement.prototype.showModal=function(){};
 vm.runInNewContext(read('js/project-proof-galleries.js'),{document,window:{HTMLDialogElement},HTMLDialogElement});
 for(const [from,shiftKey,to,prevented] of [[3,false,0,true],[0,true,3,true],[1,false,1,false],[2,true,2,false]]){
  document.activeElement=controls[from];let didPrevent=false;events.keydown({key:'Tab',shiftKey,preventDefault(){didPrevent=true;}});
  assert.equal(document.activeElement,controls[to]);assert.equal(didPrevent,prevented);
 }
 assert.throws(()=>assertGallerySource44r2('js/project-proof-galleries.js',read('js/project-proof-galleries.js').replace('(event.shiftKey ? last : first).focus({ preventScroll: true });','')));
});
test('44R2 rendered contract preserves native dialogs, fallback links and lazy large images',()=>assert.deepEqual(assertGalleryHtml44r2(html()),{galleries:3,views:8,progressiveFallback:true,largeImagesOnDemand:true}));
test('44R2 rendered negative cases reject eager images, bad srcset, missing close and fake reviews',()=>{const h=html();for(const changed of [h.replace('<img data-gallery-src=','<img src="/eager.webp" data-gallery-src='),h.replace('800.webp 800w','800.webp 700w'),h.replaceAll('data-gallery-close','removed-close'),h+'<script type="application/ld+json">{"@type":"Review"}</script>',h.replace('href="/contattaci#contatti"','href="/new-form"').replaceAll('href="/contattaci#contatti"','href="/new-form"')])assert.throws(()=>assertGalleryHtml44r2(changed));});
test('44R2 deferred-image budget exception cannot whitelist arbitrary resources',()=>{const file=contract.images[0].file;assert.equal(isDeferredGallery44r2('<img loading="lazy">',file),true);assert.equal(isDeferredGallery44r2('<img>',file),false);assert.equal(isDeferredGallery44r2('<script loading="lazy">',file),false);assert.equal(isDeferredGallery44r2('<img loading="lazy">','client/database.json'),false);assert.equal(galleryStatic44r2.length,26);});
test('44R2 full verification requires this suite and keeps historical task44 checks',()=>{const s=read('tests/verify-orchestrator.mjs');assert.ok(s.includes('"tests/project-galleries-44r2.test.mjs"'));assert.ok(s.includes('"tests/project-proof-ui-44.test.mjs"'));assert.ok(s.includes('"tests/lead-form-runtime.test.mjs"'));assert.ok(s.includes('"tests/legacy-retirement-42r1.test.mjs"'));});
