import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {readGitBlobBuffer} from './git-binary-reader.mjs';
import {beforeLocalMedia50R1} from './local-media50r1.mjs';

export const docs50=JSON.parse(fs.readFileSync(new URL('./docs-50-literals.json',import.meta.url),'utf8'));
const lf=input=>input.toString('utf8').replaceAll('\r\n','\n');

// Reverse only complete, unique reviewed paragraphs. Unknown edits stay visible
// to the historical oracles; assertDocs50Sources also checks the raw current text.
export function beforeDocs50(file,input) {
  let text=beforeLocalMedia50R1(file,input);
  for(const edit of [...(docs50.edits[file]||[])].reverse()) {
    if(text.split(edit.after).length===2)text=text.replace(edit.after,edit.before);
  }
  return text;
}
export function afterDocs50(file,input) {
  let text=lf(input);
  for(const edit of docs50.edits[file]||[]) {
    assert.equal(text.split(edit.before).length,2,file+': unique docs50 baseline paragraph '+edit.id);
    text=text.replace(edit.before,edit.after);
  }
  return text;
}
export function assertDocs50Delta(file,current,baseline) {
  current=beforeLocalMedia50R1(file,current);
  assert(Object.hasOwn(docs50.edits,file),'No implicit docs50 file exception');
  for(const edit of docs50.edits[file]) {
    assert(edit.before.length<lf(baseline).length && edit.after.length<lf(current).length,'No whole-file docs50 rollback');
    assert.equal(lf(current).split(edit.after).length,2,file+': unique current docs50 paragraph '+edit.id);
  }
  assert.equal(lf(current),afterDocs50(file,baseline),file+': exact reviewed docs50 delta only');
  assert.equal(beforeDocs50(file,current),lf(baseline),file+': lossless document reconstruction');
}
export function assertDocs50Sources(root) {
  assert.deepEqual(Object.keys(docs50.edits).sort(),['src/privacy-policy.njk','src/termini-condizioni.njk']);
  for(const file of Object.keys(docs50.edits))assertDocs50Delta(file,fs.readFileSync(path.join(root,file)),readGitBlobBuffer(docs50.baseline,file,root).buffer);
  return {result:'PASS',baseline:docs50.baseline,changedFiles:2,literalHunks:5,unknownDeltas:'NOT_REMOVED'};
}

// Task50 adds this exact official external source, not an internal legacy route.
// Preserve the historical .html prohibition for every other public link.
export function assertPublicLinkExtensions50(route,html) {
  for(const match of html.matchAll(/<a\b[^>]*href=["']([^"']*\.html(?:[?#][^"']*)?)["']/gi)) {
    assert.ok(route==='/privacy-policy' && match[1]==='https://www.zoho.com/privacy/privacy-faq.html',route+': unapproved .html public link '+match[1]);
  }
}
