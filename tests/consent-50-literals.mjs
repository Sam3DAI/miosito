import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {readGitBlobBuffer} from './git-binary-reader.mjs';

export const consent50 = JSON.parse(fs.readFileSync(new URL('./consent-50-literals.json',import.meta.url),'utf8'));
export const controller50Sha256 = 'b54b769512fc4085fb735dbe294075126193662e9087f4f66dd4995d8d7b3ea6';
const lf = input => input.toString('utf8').replaceAll('\r\n','\n');
export function beforeConsent50(file,input) {
  let text=lf(input);
  for(const edit of [...(consent50.edits[file]||[])].reverse()) {
    if(text.split(edit.after).length===2) text=text.replace(edit.after,edit.before);
  }
  return text;
}
export function afterConsent50(file,input) {
  let text=lf(input);
  for(const edit of consent50.edits[file]||[]) {
    assert.equal(text.split(edit.before).length,2,file+': unique consent50 baseline callsite '+edit.id);
    text=text.replace(edit.before,edit.after);
  }
  return text;
}
export function assertConsent50Delta(file,current,baseline) {
  assert(Object.hasOwn(consent50.edits,file),'No implicit consent50 file exception');
  for(const edit of consent50.edits[file]) {
    assert(edit.before.length<lf(baseline).length && edit.after.length<lf(current).length,'No whole-file consent50 rollback');
    assert.equal(lf(current).split(edit.after).length,2,file+': unique current consent50 callsite '+edit.id);
  }
  assert.equal(lf(current),afterConsent50(file,baseline),file+': exact reviewed consent50 delta only');
  assert.equal(beforeConsent50(file,current),lf(baseline),file+': lossless historical reconstruction');
}
export function assertConsent50Sources(root) {
  for(const file of Object.keys(consent50.edits)) assertConsent50Delta(file,fs.readFileSync(path.join(root,file)),readGitBlobBuffer(consent50.baseline,file,root).buffer);
  assert.equal(createHash('sha256').update(lf(fs.readFileSync(path.join(root,'js/consent-basic50.js')))).digest('hex'),controller50Sha256,'Reviewed basic50 controller');
  return {result:'PASS',baseline:consent50.baseline,changedFiles:3,newFiles:1,unknownDeltas:'NOT_REMOVED'};
}
export function beforeConsent50LegalHtml(input) {
  let text=lf(input);
  for(const id of ['C50-07','C50-08']) {
    const edit=consent50.edits['src/_includes/partials/measurement-bootstrap.njk'].find(e=>e.id===id);
    const before=edit.before.replaceAll('{{ measurement.ga4Id }}','G-VW0JHKW0ZW').replaceAll('{{ measurement.adsId }}','AW-17512988470');
    if(text.split(edit.after).length===2)text=text.replace(edit.after,before);
  }
  return text;
}
