import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readGitBlobBuffer} from './git-binary-reader.mjs';
import {BASE_40,changedProduct40,assertNonvisual40Sources,beforeNonvisual40} from './nonvisual-readiness-40.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('40 exact public delta, frozen engines and measurement',()=>assertNonvisual40Sources(root));
test('40 reverse oracle preserves all prior source contracts and rejects unrelated edits',()=>{
 for(const file of changedProduct40) {
  const current=fs.readFileSync(path.join(root,file),'utf8');
  const old=readGitBlobBuffer(BASE_40,file,root).buffer.toString('utf8').replace(/\r\n/g,'\n');
  assert.equal(beforeNonvisual40(file,current),old,file);
  assert.notEqual(beforeNonvisual40(file,current+'\nUNAUTHORIZED40'),old,file+': negative mutation');
 }
});
