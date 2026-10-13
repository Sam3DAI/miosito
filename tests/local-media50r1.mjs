import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {readGitBlobBuffer} from './git-binary-reader.mjs';
const lf=x=>String(x).replaceAll('\r\n','\n');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const literalText=fs.readFileSync(new URL('./local-media50r1-literals.json',import.meta.url),'utf8');
const assetText=fs.readFileSync(new URL('./local-media50r1-assets.json',import.meta.url),'utf8');
assert.equal(sha(lf(literalText)),'18d434706941066514a638fea9f84efa3473e5446e6709e3d3c8651ae5943f62','50R1 pinned reviewed literal oracle');
assert.equal(sha(lf(assetText)),'6cf4cb326ec736fde735546a8be6f7c3eab4f80e1b8778f5f27534d7c04626dd','50R1 pinned asset oracle');
export const media50r1=JSON.parse(literalText);
export const mediaAssets50r1=JSON.parse(assetText).assets;
export const mediaFiles50r1=mediaAssets50r1.map(x=>x.file).sort();
export const mediaData50r1='src/_data/localMedia50r1.json';
export function beforeLocalMedia50R1(file,input){
 let text=lf(input);
 for(const edit of [...(media50r1.edits[file]||[])].reverse()){
  // No wildcard stripping: an unknown change survives and fails the old oracle.
  if(edit.before.includes(edit.after) && text.includes(edit.before))continue;
  if(text.split(edit.after).length===2)text=text.replace(edit.after,edit.before);
 }
 return text;
}
export function assertMediaDelta50R1(file,current,baseline){
 assert(Object.hasOwn(media50r1.edits,file),'50R1 exact file scope');let expected=lf(baseline);
 for(const edit of media50r1.edits[file]){
  assert(edit.before && edit.after && edit.before.length<expected.length,'50R1 bounded literal only');
  assert.equal(expected.split(edit.before).length,2,file+': unique old media literal');
  expected=expected.replace(edit.before,edit.after);
 }
 assert.equal(lf(current),expected,file+': only reviewed media/CSP/privacy changes');
 assert.equal(beforeLocalMedia50R1(file,current),lf(baseline),file+': exact inverse');
}
export function assertMediaFile50R1(file,bytes){
 const expected=mediaAssets50r1.find(x=>x.file===file);assert(expected,'50R1 exact file allowlist');
 assert.equal(bytes.length,expected.bytes,file+': bytes');assert.equal(sha(bytes),expected.sha256,file+': digest');
}
export function isMediaProduct50R1(file,root){
 if(mediaFiles50r1.includes(file)){assertMediaFile50R1(file,fs.readFileSync(path.join(root,file)));return true;}
 if(file===mediaData50r1){assert.equal(sha(lf(fs.readFileSync(path.join(root,file)))),'e9dfccc1d0532cbeddb44b1588e7bc8f86a6b3972d46a67f1dc8db085a7759ff','50R1 metadata exact');return true;}
 if(Object.hasOwn(media50r1.edits,file)){assertMediaDelta50R1(file,fs.readFileSync(path.join(root,file)),readGitBlobBuffer(media50r1.baseline,file,root).buffer);return true;}
 return false;
}
export function assertMediaSources50R1(root){
 for(const file of [...Object.keys(media50r1.edits),...mediaFiles50r1,mediaData50r1])assert(isMediaProduct50R1(file,root));
 const data=JSON.parse(fs.readFileSync(path.join(root,mediaData50r1)));
 assert.equal(Object.keys(data.cards).length,9);assert.equal(Object.keys(data.technical).length,9);
 for(const [id,c]of Object.entries(data.cards)){
  assert.equal(c.src,'/assets/media-local50r1/'+id+'-900.webp');
  assert.equal(c.srcset,[350,700,900].map(w=>`/assets/media-local50r1/${id}-${w}.webp ${w}w`).join(', '));
  assert.deepEqual([c.width,c.height],[900,1150]);assert.equal(c.sizes,'(max-width: 720px) 300px, 350px');
 }
 return {result:'PASS',assets:36,slots:18,boundedSourceFiles:6,literalHunks:36,viewerLogic:'EXACT_BASELINE_AFTER_NINE_URLS_AND_COMMENT_REVERSED'};
}
export function assertNoCloudinary50R1(bytes,label){
 // Search raw, JS-unescaped and URL-decoded forms; includes GLB JSON and binary payloads.
 let text=Buffer.isBuffer(bytes)?bytes.toString('utf8'):String(bytes);
 assert.doesNotMatch(text,/cloudinary/i,label+': no provider reference in published bytes');
 text=text.replace(/\\u([\da-f]{4})/gi,(_,h)=>String.fromCharCode(parseInt(h,16))).replace(/\\x([\da-f]{2})/gi,(_,h)=>String.fromCharCode(parseInt(h,16)));
 try{text=decodeURIComponent(text);}catch{}
 assert.doesNotMatch(text,/cloudinary/i,label+': no escaped provider reference');
}
export function assertMediaOutput50R1(root){
 const output=path.join(root,'_site');const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
 const files=walk(output);for(const f of files)assertNoCloudinary50R1(fs.readFileSync(f),path.relative(output,f));
 for(const file of mediaFiles50r1)assertMediaFile50R1(file,fs.readFileSync(path.join(output,file)));
 const html=fs.readFileSync(path.join(output,'configuratori-3d-2d.html'),'utf8');
 assert.equal((html.match(/class="visual-card__image"[^>]*src="\/assets\/media-local50r1\//g)||[]).length,9);
 assert.equal((html.match(/350w, \/assets\/media-local50r1\/[^"]+ 700w, \/assets\/media-local50r1\/[^"]+ 900w/g)||[]).length,9);
 return {result:'PASS',publishedFiles:files.length,cloudinaryReferences:0,localCards:9,assets:36};
}
