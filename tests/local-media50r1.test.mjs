import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readGitBlobBuffer} from './git-binary-reader.mjs';
import {media50r1,mediaAssets50r1,mediaFiles50r1,beforeLocalMedia50R1,assertMediaDelta50R1,assertMediaFile50R1,assertMediaSources50R1,assertNoCloudinary50R1,isMediaProduct50R1} from './local-media50r1.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('50R1 complete exact source/metadata/media gate',()=>assert.equal(assertMediaSources50R1(root).result,'PASS'));
for(const file of Object.keys(media50r1.edits))test('50R1 rejects an unrelated mutation: '+file,()=>{
 const original=readGitBlobBuffer(media50r1.baseline,file,root).buffer;
 const current=fs.readFileSync(path.join(root,file),'utf8');
 assert.throws(()=>assertMediaDelta50R1(file,current+'\nUNAUTHORIZED',original));
 assert.notEqual(beforeLocalMedia50R1(file,current+'\nUNAUTHORIZED'),original.toString().replaceAll('\r\n','\n'));
 assert.equal(beforeLocalMedia50R1(file,original),original.toString().replaceAll('\r\n','\n'),'historical reconstruction is idempotent');
 for(const edit of media50r1.edits[file])for(const replacement of ['',edit.after+edit.after])
  assert.throws(()=>assertMediaDelta50R1(file,current.replace(edit.after,replacement),original),'missing or duplicated authorized hunk must fail');
});
test('50R1 no wildcard media directory allowance',()=>assert.equal(isMediaProduct50R1('assets/media-local50r1/unreviewed.webp',root),false));
test('50R1 rejects truncated, corrupted and swapped media',()=>{
 for(const record of mediaAssets50r1){const b=fs.readFileSync(path.join(root,record.file));assert.throws(()=>assertMediaFile50R1(record.file,b.subarray(0,-1)));const corrupt=Buffer.from(b);corrupt[corrupt.length-1]^=1;assert.throws(()=>assertMediaFile50R1(record.file,corrupt));}
 assert.throws(()=>assertMediaFile50R1(mediaFiles50r1[0],fs.readFileSync(path.join(root,mediaFiles50r1[1]))));
});
test('50R1 rejects direct, percent-escaped and JS-escaped provider references',()=>{
 for(const x of ['https://res.cloudinary.com/image','https://res.%63loudinary.com','https://res.\\u0063loudinary.com','https://res.\\x63loudinary.com'])assert.throws(()=>assertNoCloudinary50R1(x,'mutation'));
 assertNoCloudinary50R1('/assets/media-local50r1/demo-ar-icon.webp','local');
});
test('50R1 preserves viewer logic beyond the nine asset URLs and comment',()=>{
 assert.equal(media50r1.edits['js/configuratori-3d-2d.js'].length,10);
 assert.equal(media50r1.edits['js/configuratori-3d-2d.js'].filter(x=>x.before.startsWith('https://')).length,9);
 assert.throws(()=>assertMediaDelta50R1('js/configuratori-3d-2d.js',fs.readFileSync(path.join(root,'js/configuratori-3d-2d.js'),'utf8').replace('TRILINEAR_SAMPLINGMODE','NEAREST_SAMPLINGMODE'),readGitBlobBuffer(media50r1.baseline,'js/configuratori-3d-2d.js',root).buffer));
});
test('50R1 removes exactly three CSP host occurrences without changing Google',()=>{
 const edits=media50r1.edits['src/_includes/partials/seo-head.njk'];assert.equal(edits.length,3);
 for(const e of edits)assert.equal(e.before.replace(' https://res.cloudinary.com',''),e.after);
});
