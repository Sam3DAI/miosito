import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {readGitBlobBuffer} from './git-binary-reader.mjs';
import {beforeConsent50} from './consent-50-literals.mjs';
import {beforeDocs50,assertDocs50Sources} from './docs-50-literals.mjs';
export const contract48=JSON.parse(fs.readFileSync(new URL('./prelaunch-48-literals.json',import.meta.url),'utf8'));
const lf=s=>s.toString('utf8').replaceAll('\r\n','\n');
export const newFiles48=Object.freeze({
  'js/wd-availability.js':'d1ffacf979c1b535af07302b2789dcb6fe5ad4fe4235b9e57e55974d97854c4a',
  'demo/ecommerce/launch.js':'97c91c3c3a2a36a76b1f928d23b4e12d8268d0cf5866dae28ef424d226719251',
  '.gitattributes':'3aaa9315e8179d67860d272632599bff201926a11d2099e023a669e50be20b6e'
});
export function assert48NewFile(file,input){
  assert.ok(Object.hasOwn(newFiles48,file),'48 exact new-file scope');
  assert.equal(createHash('sha256').update(lf(input)).digest('hex'),newFiles48[file],file+': reviewed48 implementation');
}
export function is48ProductFile(file,root){
  if(Object.hasOwn(newFiles48,file)){assert48NewFile(file,fs.readFileSync(path.join(root,file)));return true;}
  if(!Object.hasOwn(contract48.edits,file))return false;
  const old=lf(readGitBlobBuffer(contract48.baseline,file,root).buffer);
  assert.equal(beforeDocs50(file,beforeConsent50(file,fs.readFileSync(path.join(root,file)))),after48(file,old),file+': exact48 scope plus reviewed consent50/docs50');return true;
}
// Exact contextual literals only, never a whole-file rollback. Unknown edits
// survive reconstruction; a separate mandatory raw48 oracle checks the delta.
export function before48(file,input) {
  let text=beforeDocs50(file,beforeConsent50(file,input));const edits=contract48.edits[file];
  if(!edits || !edits.some(e=>text.includes(e.after)))return text;
  for(const e of [...edits].reverse()) {
    assert.equal(text.split(e.after).length,2,file+e.id+': complete unique48 callsite');
    text=text.replace(e.after,e.before);
  }
  return text;
}
export function after48(file,baseline) {
  let text=lf(baseline);
  for(const e of contract48.edits[file]||[]){assert.equal(text.split(e.before).length,2,file+e.id+': unique47R3 callsite');text=text.replace(e.before,e.after);}
  return text;
}
export function assert48Current(root) {
  assertDocs50Sources(root);
  for(const file of Object.keys(newFiles48))assert48NewFile(file,fs.readFileSync(path.join(root,file)));
  for(const file of Object.keys(contract48.edits)) {
    const old=lf(readGitBlobBuffer(contract48.baseline,file,root).buffer),current=beforeDocs50(file,beforeConsent50(file,fs.readFileSync(path.join(root,file))));
    assert.equal(current,after48(file,old),file+': only explicitly reviewed48 literals');
    assert.equal(before48(file,current),old,file+': exact historical reconstruction');
  }
  return {result:'PASS',files:Object.keys(contract48.edits).length,baseline:contract48.baseline};
}
