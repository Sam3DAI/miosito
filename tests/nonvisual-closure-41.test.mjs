import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readGitBlobBuffer} from './git-binary-reader.mjs';
import {BASE_41,edits41,beforeNonvisual41,assertHeaders41,assertNonvisual41Sources} from './nonvisual-closure-41.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('41 exact two consumer deltas, two headers, unchanged engines and dependencies',()=>assertNonvisual41Sources(root));
test('41 reverse oracle restores both exact baseline sources; unrelated edits fail',()=>{
  for(const file of Object.keys(edits41)){
    const current=fs.readFileSync(path.join(root,file),'utf8');
    const old=readGitBlobBuffer(BASE_41,file,root).buffer.toString('utf8').replace(/\r\n/g,'\n');
    assert.equal(beforeNonvisual41(file,current),old);
    assert.notEqual(beforeNonvisual41(file,current+'\nUNAUTHORIZED41'),old);
    assert.notEqual(beforeNonvisual41(file,current.replace("behavior: 'instant'","behavior: 'smooth'")),old);
  }
});
test('41 header oracle rejects duplication, policy drift and unauthorized anti-framing',()=>{
  const current=fs.readFileSync(path.join(root,'netlify.toml'),'utf8');
  const target=process.env.SOLVEX_VERIFY_TARGET||'candidate';
  for(const modified of [current+'\n[[headers]]\n  for = "/*"\n',current.replace('nosniff','invalid'),current.replace('strict-origin-when-cross-origin','no-referrer'),current+'\n    X-Frame-Options = "DENY"\n']){
    assert.throws(()=>assertHeaders41(modified,target));
  }
});
test('41 only staging has noindex, in the same coherent header block',()=>{
  const current=fs.readFileSync(path.join(root,'netlify.toml'),'utf8').replace(/\r\n/g,'\n');
  const candidate=current.replace('    X-Robots-Tag = "noindex, nofollow, noarchive, nosnippet"\n','');
  assertHeaders41(candidate,'candidate');
  assertHeaders41(candidate.trimEnd()+'\n    X-Robots-Tag = "noindex, nofollow, noarchive, nosnippet"\n','staging');
  assert.throws(()=>assertHeaders41(candidate,'staging'));
});
