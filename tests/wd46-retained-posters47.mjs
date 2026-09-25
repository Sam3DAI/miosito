import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {readGitBlobBuffer} from './git-binary-reader.mjs';

// Task47 replaces the published poster, not the retained historical Git assets.
// This oracle is pinned to the reviewed46 baseline, never derived from current
// product bytes or the new47 publication allowlist.
export const WD46_POSTER_BASE47 = '887198eb0e7f9bd956ebc32010057d6d03706c4b';
export const retainedWd46Posters47 = Object.freeze([
  Object.freeze({file:'assets/images/wd46-poster-768.webp',bytes:21120,sha256:'1d06a634d5f478eaf8b321789e790753a21beaccaa98ad286fc7fb5942441170'}),
  Object.freeze({file:'assets/images/wd46-poster-1440.webp',bytes:50174,sha256:'659261afe5aa12f7bfdf8dd4a4fd88e2f065dca1c38399eb8db9e45b97d284d0'})
]);
export const retainedWd46PosterFiles47 = Object.freeze(retainedWd46Posters47.map(record=>record.file));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');

export function assertRetainedWd46PosterBytes47(files) {
  assert.ok(files instanceof Map,'WD46 retained posters: exact path/bytes map required');
  assert.deepEqual([...files.keys()].sort(),[...retainedWd46PosterFiles47].sort(),'WD46 retained posters: exactly the two historical paths');
  for(const record of retainedWd46Posters47) {
    const bytes=files.get(record.file);
    assert.ok(Buffer.isBuffer(bytes),record.file+': retained poster requires raw bytes');
    assert.equal(bytes.length,record.bytes,record.file+': retained poster raw length');
    assert.equal(sha(bytes),record.sha256,record.file+': retained poster baseline46 SHA256');
  }
  return {baseline:WD46_POSTER_BASE47,files:2,mode:'RAW_BINARY',publish:'EXCLUDED'};
}

export function assertRetainedWd46PosterSources47(root) {
  const historical=new Map(retainedWd46PosterFiles47.map(file=>[file,readGitBlobBuffer(WD46_POSTER_BASE47,file,root).buffer]));
  const working=new Map(retainedWd46PosterFiles47.map(file=>[file,fs.readFileSync(path.join(root,file))]));
  assertRetainedWd46PosterBytes47(historical);
  return assertRetainedWd46PosterBytes47(working);
}

export function assertRetainedWd46PostersExcluded47(files) {
  assert.ok(files instanceof Map,'WD46 retained posters: output path/content map required');
  for(const file of retainedWd46PosterFiles47) assert.equal(files.has(file),false,file+': historical WD46 poster must not publish');
  for(const [name,bytes] of files) {
    if(!/\.(?:html|css|js|mjs|json|xml|svg)$/.test(name)) continue;
    for(const file of retainedWd46PosterFiles47) assert.ok(!String(bytes).includes(file),name+': historical WD46 poster reference forbidden '+file);
  }
  return {excludedHistoricalPosters:2};
}
