import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {readGitBlobBuffer} from './git-binary-reader.mjs';
import {BASE_DEPENDENCIES50,dependencies50,dependencies50Files,assertDependencies50Delta,beforeDependencies50,assertDependencies50Sources,spamWatch50File,assertSpamWatch50Source} from './dependencies50.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const texts=Object.fromEntries(dependencies50Files.map(file=>[file,fs.readFileSync(new URL('../'+file,import.meta.url),'utf8')]));
const old=Object.fromEntries(dependencies50Files.map(file=>[file,readGitBlobBuffer(BASE_DEPENDENCIES50,file,root).buffer]));
const json=value=>JSON.stringify(value,null,2)+'\n';
function mutated(file,edit) {
  const value=JSON.parse(texts[file]);edit(value);const next=json(value);
  assert.notEqual(next,texts[file].replaceAll('\r\n','\n'),'negative fixture must change reviewed input');
  return next;
}
const sdkPath='node_modules/@netlify/blobs';

test('50 dependency gate reconstructs raw Git baseline, not just a file hash',()=>{
  const result=assertDependencies50Sources(root);
  assert.equal(result.addedPackages,42);assert.equal(result.promotedRuntimeFlags,4);
  for(const file of dependencies50Files) {
    assert.equal(assertDependencies50Delta(file,texts[file],old[file]),old[file].toString('utf8').replaceAll('\r\n','\n'));
    assert.equal(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),texts[file],'gate must not normalize or rewrite files');
  }
});
test('50 accepts only EOL representation differences and passes unrelated files through unchanged',()=>{
  for(const file of dependencies50Files)assert.equal(assertDependencies50Delta(file,texts[file].replaceAll('\r\n','\n').replaceAll('\n','\r\n'),old[file]),old[file].toString('utf8').replaceAll('\r\n','\n'));
  assert.equal(beforeDependencies50('js/netlify-lead-form.js','KEEP\r\nEXACT'),'KEEP\r\nEXACT');
  assert.throws(()=>assertDependencies50Delta('netlify/package.json',texts['package.json'],old['package.json']),/not a dependency50 path/);
});
test('50 reviewed manifest is fixed, unique, explicit and frozen',()=>{
  assert.equal(dependencies50.newPackages.length,42);
  assert.equal(new Set(dependencies50.newPackages.map(entry=>entry.path)).size,42);
  assert.ok(dependencies50.newPackages.every(entry=>entry.version&&entry.integrity&&entry.resolved&&entry.entrySha256));
  assert.throws(()=>{dependencies50.newPackages[0].version='999.0.0';},TypeError);
});

for(const [label,edit] of [
  ['SDK version',value=>{value.dependencies['@netlify/blobs']='11.1.5';}],
  ['SDK range',value=>{value.dependencies['@netlify/blobs']='^11.1.4';}],
  ['foreign runtime dependency',value=>{value.dependencies.playwright='1.0.0';}],
  ['missing SDK',value=>{delete value.dependencies;}],
  ['root install script',value=>{value.scripts.postinstall='node unexpected.mjs';}],
  ['changed verify script',value=>{value.scripts.verify='echo PASS';}],
  ['old development dependency',value=>{value.devDependencies['@11ty/eleventy']='3.1.7';}],
  ['foreign development dependency',value=>{value.devDependencies.selenium='1.0.0';}],
  ['engine downgrade',value=>{value.engines.node='>=20';}],
  ['unknown top-level metadata',value=>{value.overrides={'@netlify/blobs':'12.0.0'};}]
])test('50 package rejects '+label,()=>assert.throws(()=>assertDependencies50Delta('package.json',mutated('package.json',edit),old['package.json'])));

for(const [label,edit] of [
  ['SDK lock version',value=>{value.packages[sdkPath].version='11.1.5';}],
  ['transitive version',value=>{value.packages['node_modules/@netlify/dev-utils'].version='6.0.4';}],
  ['SDK integrity',value=>{value.packages[sdkPath].integrity='sha512-AAAA';}],
  ['transitive integrity',value=>{value.packages['node_modules/tslib'].integrity='sha512-BBBB';}],
  ['nonofficial registry',value=>{value.packages[sdkPath].resolved='https://unreviewed.example/blobs.tgz';}],
  ['altered official tarball',value=>{value.packages[sdkPath].resolved='https://registry.npmjs.org/@netlify/blobs/-/blobs-11.1.5.tgz';}],
  ['registry credentials',value=>{value.packages[sdkPath].resolved=value.packages[sdkPath].resolved.replace('https://','https://user:secret@');}],
  ['install script flag',value=>{value.packages[sdkPath].hasInstallScript=true;}],
  ['lifecycle script metadata',value=>{value.packages[sdkPath].scripts={install:'node unexpected.mjs'};}],
  ['changed new dependency graph',value=>{value.packages[sdkPath].dependencies['@netlify/otel']='999.0.0';}],
  ['unknown new metadata',value=>{value.packages[sdkPath].unexpected=true;}],
  ['foreign added package',value=>{value.packages['node_modules/foreign-package']={version:'1.0.0'};}],
  ['missing approved new package',value=>{delete value.packages['node_modules/tslib'];}],
  ['replacement preserving entry count',value=>{value.packages['node_modules/foreign-package']=value.packages['node_modules/tslib'];delete value.packages['node_modules/tslib'];}],
  ['root SDK range',value=>{value.packages[''].dependencies['@netlify/blobs']='^11.1.4';}],
  ['foreign root dependency',value=>{value.packages[''].dependencies.foreign='1.0.0';}],
  ['old package version',value=>{value.packages['node_modules/@11ty/eleventy'].version='3.1.7';}],
  ['old package integrity',value=>{value.packages['node_modules/@11ty/eleventy'].integrity='sha512-CCCC';}],
  ['old package registry',value=>{value.packages['node_modules/@11ty/eleventy'].resolved='https://unreviewed.example/eleventy.tgz';}],
  ['old package install script',value=>{value.packages['node_modules/@11ty/eleventy'].hasInstallScript=true;}],
  ['fifth runtime promotion',value=>{delete value.packages['node_modules/@11ty/eleventy'].dev;}],
  ['root lock engine',value=>{value.packages[''].engines.node='>=20';}],
  ['lock schema version',value=>{value.lockfileVersion=2;}],
  ['unknown lock top-level field',value=>{value.overrides={'@netlify/blobs':'12.0.0'};}]
])test('50 lock rejects '+label,()=>assert.throws(()=>assertDependencies50Delta('package-lock.json',mutated('package-lock.json',edit),old['package-lock.json'])));

for(const key of dependencies50.promotedRuntimeEntries) {
  test('50 runtime promotion must be exact for '+key,()=>{
    for(const edit of [
      value=>{value.packages[key].dev=true;},
      value=>{value.packages[key].dev=false;},
      value=>{value.packages[key].version='0.0.0';},
      value=>{value.packages[key].unreviewed=true;}
    ])assert.throws(()=>assertDependencies50Delta('package-lock.json',mutated('package-lock.json',edit),old['package-lock.json']),/only dev:true may be removed/);
  });
}
test('50 rejects duplicate JSON keys, changed indentation and unreviewed trailing content',()=>{
  for(const file of dependencies50Files) {
    const valid=texts[file].replaceAll('\r\n','\n');
    for(const text of [valid.replace('  "name": "solvex-website",','  "name": "solvex-website",\n  "name": "solvex-website",'),valid.replace('  "name"','    "name"'),valid+'\n']) {
      assert.notEqual(text,valid);
      assert.throws(()=>assertDependencies50Delta(file,text,old[file]),/exact canonical JSON/);
    }
  }
});
test('50 new function is a single exact source, not a blanket netlify path exemption',()=>{
  const source=fs.readFileSync(new URL('../'+spamWatch50File,import.meta.url),'utf8');
  assertSpamWatch50Source(spamWatch50File,source);
  assert.throws(()=>assertSpamWatch50Source(spamWatch50File,source+'\nUNREVIEWED_50_CODE'),/exact reviewed/);
  assert.throws(()=>assertSpamWatch50Source('netlify/functions/unknown.mjs',source),/named reviewed/);
  assert.throws(()=>assertSpamWatch50Source('netlify/config.json',source),/named reviewed/);
});
