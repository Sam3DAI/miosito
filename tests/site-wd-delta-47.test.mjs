import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {readGitBlobBuffer} from './git-binary-reader.mjs';
import {beforeWd46,wd46Edits} from './site-wd-delta-46.mjs';
import {afterWd47Config,beforeWd47,assertWd47ConfigDelta,wd47ConfigEdits} from './site-wd-delta-47.mjs';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const base='887198eb0e7f9bd956ebc32010057d6d03706c4b';
const original=readGitBlobBuffer(base,'eleventy.config.js',root).buffer.toString('utf8').replace(/\r\n/g,'\n');
const current=afterWd47Config(original);

test('47 adapter performs only four exact static-publication deltas and is reversible',()=>{
  assert.equal(wd47ConfigEdits.length,4);
  assertWd47ConfigDelta(current,original);
  assert.equal(beforeWd47('eleventy.config.js',current),original);
  assert.match(current,/"demo\/ecommerce\/assets\/img-prodotto\/Zip\.png"/);
  assert.match(current,/"demo\/ecommerce\/camera-controller\.js"/);
  assert.doesNotMatch(current,/Zip\.webp|demo\/ecommerce\/assets\/poster-|assets\/images\/wd46-poster-/);
  assert.match(current,/"assets\/images\/wd47-poster-1200\.webp"/);
  assert.throws(()=>afterWd47Config(current),'The patch cannot be applied twice');
});
test('47 adapter preserves historical46 and earlier source assertions',()=>{
  assert.equal(beforeWd47('eleventy.config.js',original),original);
  assert.equal(beforeWd46('eleventy.config.js',current),beforeWd46('eleventy.config.js',original));
  assert.equal(beforeWd47('unrelated.js',current),current);
  for(const file of Object.keys(wd46Edits).filter(f=>f!=='eleventy.config.js')) {
    const source=fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n');
    assert.equal(beforeWd47(file,source),source,file+' is not normalized by47');
  }
});
test('47 adapter refuses every missing, duplicated or partly reverted reviewed callsite',()=>{
  for(const edit of wd47ConfigEdits) {
    const missing=current.replace(edit.after,'');
    const duplicated=current.replace(edit.after,edit.after+edit.after);
    const partial=current.replace(edit.after,edit.before);
    for(const [name,mutant] of [['missing',missing],['duplicate',duplicated],['mixed46/47',partial]]) {
      assert.notEqual(mutant,current,edit.id+' '+name+' must really mutate');
      assert.throws(()=>assertWd47ConfigDelta(mutant,original),edit.id+' '+name);
      assert.throws(()=>beforeWd47('eleventy.config.js',mutant),edit.id+' '+name+' historical guard');
    }
  }
});
test('47 adapter keeps an unrelated extra file visible instead of blessing it',()=>{
  const mutant=current.replace('  "demo/ecommerce/app.js",','  "demo/ecommerce/client-api.js",\n  "demo/ecommerce/app.js",');
  assert.notEqual(mutant,current);
  assert.throws(()=>assertWd47ConfigDelta(mutant,original));
  assert.match(beforeWd47('eleventy.config.js',mutant),/client-api\.js/);
});
test('47 adapter cannot hide a removed model, map, form helper, route or portfolio asset',()=>{
  const forbiddenChanges=[
    ['  "demo/ecommerce/assets/models/restyle/restyle.glb",\n',''],
    ['  "demo/ecommerce/assets/maps/038ef11b00d239a66fea08b159d1c51f80f2a780d1dd9808ff8ba7abb62429da.jpg",\n',''],
    ['  "js/netlify-lead-form.js",\n',''],
    ['    publicUrl: "/contattaci",','    publicUrl: "/wrong",'],
    ['  "assets/images/projects-46/pilan-06-2560.webp",\n','']
  ];
  for(const [from,to] of forbiddenChanges) {
    const mutant=current.replace(from,to);
    assert.notEqual(mutant,current);
    assert.throws(()=>assertWd47ConfigDelta(mutant,original));
    assert.notEqual(beforeWd47('eleventy.config.js',mutant),original);
  }
});
test('47 adapter rejects wrong camera extension, stale poster width and old ZIP thumbnail',()=>{
  const mutations=[
    ['camera-controller.js','camera-controller.mjs'],
    ['wd47-poster-1200.webp','wd47-poster-1440.webp'],
    ['Zip.png','Zip.webp']
  ];
  for(const [from,to] of mutations) {
    const mutant=current.replace(from,to);
    assert.notEqual(mutant,current);
    assert.throws(()=>assertWd47ConfigDelta(mutant,original));
    assert.throws(()=>beforeWd47('eleventy.config.js',mutant));
  }
});
test('47 adapter does not accept a changed or duplicate historical46 callsite',()=>{
  for(const edit of wd47ConfigEdits) {
    const changed=original.replace(edit.before,edit.before.replace('demo/ecommerce/','unreviewed/').replace('assets/images/','unreviewed/'));
    assert.notEqual(changed,original);
    assert.throws(()=>afterWd47Config(changed));
    const duplicate=original.replace(edit.before,edit.before+edit.before);
    assert.notEqual(duplicate,original);
    assert.throws(()=>afterWd47Config(duplicate));
  }
});
