import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readGitBlobBuffer} from './git-binary-reader.mjs';

export const BASE_DEPENDENCIES50='53966e6437037e045b1ed39666962f6790096969';
export const dependencies50Files=Object.freeze(['package.json','package-lock.json']);
export const spamWatch50File='netlify/functions/spam-watch50.mjs';
export const spamWatch50Sha256='48952e2768176dd59a1707414c57928095d0b4ec564b8251eb40c637fcdcf746';
const defaultRoot=fileURLToPath(new URL('../',import.meta.url));
const lf=value=>String(value).replaceAll('\r\n','\n');
const serialize=value=>JSON.stringify(value,null,2)+'\n';
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const sdk=Object.freeze({'@netlify/blobs':'11.1.4'});
const promoted=Object.freeze(['node_modules/debug','node_modules/ms','node_modules/semver','node_modules/urlpattern-polyfill']);
function freeze(value) {
  if(value&&typeof value==='object') {for(const child of Object.values(value))freeze(child);Object.freeze(value);}
  return value;
}
export const dependencies50=freeze(JSON.parse(fs.readFileSync(new URL('./dependencies50-manifest.json',import.meta.url),'utf8')));

function object(value,label) {
  assert.ok(value&&typeof value==='object'&&!Array.isArray(value),label+': JSON object required');
  return value;
}
function parseCanonical(input,label) {
  const text=lf(input),value=object(JSON.parse(text),label);
  // Reject duplicate keys and unreviewed formatting instead of silently sanitizing them.
  assert.equal(text,serialize(value),label+': exact canonical JSON, apart from CRLF/LF');
  return {text,value};
}
function officialTarball(name,version) {
  return 'https://registry.npmjs.org/'+name+'/-/'+name.split('/').at(-1)+'-'+version+'.tgz';
}
function assertManifest() {
  assert.equal(dependencies50.baseline,BASE_DEPENDENCIES50,'50 dependency baseline');
  assert.deepEqual(dependencies50.sdk,sdk,'50 only the exact official SDK');
  assert.equal(dependencies50.baselineLockEntries,131);
  assert.equal(dependencies50.currentLockEntries,173);
  assert.deepEqual(dependencies50.promotedRuntimeEntries,promoted,'50 only four reviewed runtime flags');
  assert.equal(dependencies50.newPackages.length,42,'50 exactly 42 new packages');
  assert.equal(new Set(dependencies50.newPackages.map(entry=>entry.path)).size,42,'50 unique new package paths');
  for(const entry of dependencies50.newPackages) {
    assert.match(entry.path,/^(?:node_modules\/(?:@[^/]+\/)?[^/]+\/)*node_modules\/(?:@[^/]+\/)?[^/]+$/);
    assert.match(entry.version,/^\d+\.\d+\.\d+$/);
    const name=entry.path.slice(entry.path.lastIndexOf('node_modules/')+'node_modules/'.length);
    assert.equal(entry.resolved,officialTarball(name,entry.version),entry.path+': official registry tarball');
    assert.match(entry.integrity,/^sha512-[A-Za-z0-9+/]+={0,2}$/);
    assert.match(entry.entrySha256,/^[0-9a-f]{64}$/);
  }
}
assertManifest();

/** Invert only the reviewed dependency delta; every remaining byte is compared to the raw Git baseline. */
export function assertDependencies50Delta(file,input,baselineInput) {
  assert.ok(dependencies50Files.includes(file),file+': not a dependency50 path');
  const {value:current}=parseCanonical(input,file);
  const {text:baselineText,value:baseline}=parseCanonical(baselineInput,file+' baseline');
  if(file==='package.json') {
    assert.equal(Object.hasOwn(baseline,'dependencies'),false,'50 baseline has no runtime dependencies');
    assert.deepEqual(current.dependencies,sdk,'50 exactly @netlify/blobs@11.1.4, without ranges or extra dependencies');
    delete current.dependencies;
  } else {
    const oldPackages=object(baseline.packages,'baseline lock packages');
    const packages=object(current.packages,'current lock packages');
    assert.equal(Object.keys(oldPackages).length,131,'50 baseline package inventory');
    assert.equal(Object.keys(packages).length,173,'50 current package inventory');
    const newPaths=Object.keys(packages).filter(key=>!Object.hasOwn(oldPackages,key));
    assert.deepEqual(newPaths,dependencies50.newPackages.map(entry=>entry.path),'50 exact ordered new package inventory; no missing or foreign package');
    assert.equal(Object.hasOwn(oldPackages[''],'dependencies'),false,'50 baseline root has no runtime dependencies');
    assert.deepEqual(packages[''].dependencies,sdk,'50 lock root matches the sole exact SDK');
    delete packages[''].dependencies;
    for(const expected of dependencies50.newPackages) {
      const entry=object(packages[expected.path],expected.path);
      assert.equal(entry.version,expected.version,expected.path+': exact reviewed version');
      assert.equal(entry.integrity,expected.integrity,expected.path+': exact reviewed integrity');
      assert.equal(entry.resolved,expected.resolved,expected.path+': official reviewed registry');
      assert.equal(Object.hasOwn(entry,'hasInstallScript'),false,expected.path+': no install script');
      assert.equal(Object.hasOwn(entry,'scripts'),false,expected.path+': no lifecycle scripts');
      // The per-entry hash freezes dependency graph, engines, bins and all remaining metadata.
      assert.equal(sha(JSON.stringify(entry)),expected.entrySha256,expected.path+': exact reviewed entry metadata');
      delete packages[expected.path];
    }
    for(const key of promoted) {
      const oldEntry=object(oldPackages[key],key+' baseline');
      assert.equal(oldEntry.dev,true,key+': original development-only flag');
      const expected=structuredClone(oldEntry);delete expected.dev;
      assert.equal(JSON.stringify(packages[key]),JSON.stringify(expected),key+': only dev:true may be removed');
      // Restore this one property in its historical order, not arbitrary old entry changes.
      packages[key]=structuredClone(oldEntry);
    }
  }
  const reconstructed=serialize(current);
  assert.equal(reconstructed,baselineText,file+': only exact SDK50 delta; scripts, old entries and unknown fields remain frozen');
  return reconstructed;
}

export function beforeDependencies50(file,input,root=defaultRoot) {
  if(!dependencies50Files.includes(file))return input;
  return assertDependencies50Delta(file,input,readGitBlobBuffer(BASE_DEPENDENCIES50,file,root).buffer);
}

export function assertSpamWatch50Source(file,input) {
  assert.equal(file,spamWatch50File,'50 only the named reviewed server function, never a directory exemption');
  assert.equal(sha(lf(input)),spamWatch50Sha256,'50 exact reviewed spam-watch source');
}

export function assertDependencies50Sources(root=defaultRoot) {
  for(const file of dependencies50Files)beforeDependencies50(file,fs.readFileSync(path.join(root,file),'utf8'),root);
  assertSpamWatch50Source(spamWatch50File,fs.readFileSync(path.join(root,spamWatch50File),'utf8'));
  return {result:'PASS',baseline:BASE_DEPENDENCIES50,sdk:'@netlify/blobs@11.1.4',addedPackages:42,promotedRuntimeFlags:4,oldPackageEntries:'PRESERVED_EXCEPT_FOUR_DEV_FLAGS',functionSource:'EXACT_REVIEWED_SHA256'};
}
