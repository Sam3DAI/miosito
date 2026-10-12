import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {readGitBlobBuffer,hashFileWithGitFilters} from './git-binary-reader.mjs';
import {FROZEN_PASSTHROUGH_FILES,OWNED_STATIC_FILES,GENERATED_ROUTES} from '../eleventy.config.js';
import {assertHeaders41} from './nonvisual-closure-41.mjs';
import {assertReviewed50Source42} from './legacy-retirement-42r1.mjs';
import {assertReviewed50Source43} from './clean-images-43.mjs';
import {exclusion50Baseline,exclusion50Directory,exclusion50Marker,exclusion50MarkerText,
  exclusion50Block,assertSpamWatchExclusion50Config,assertExclusion50Marker,
  assertDisabledFunctions50Entries,assertSpamWatchExclusion50} from './spam-watch-exclusion50.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const baseline=()=>readGitBlobBuffer(exclusion50Baseline,'netlify.toml',root).buffer.toString('utf8');

test('50 manual Spam exception: zero deployable functions; retained code is not a deployed endpoint',()=>{
  assert.equal(assertSpamWatchExclusion50(root).deployableFunctions,0);
  assertHeaders41(read('netlify.toml'),process.env.SOLVEX_VERIFY_TARGET||'candidate');
});

test('50 exclusion rejects absent/duplicate config, default directory, context overrides and unrelated edits',()=>{
  const old=baseline(), current=read('netlify.toml').replaceAll('\r\n','\n');
  for(const bad of [old,current.replace(exclusion50Block,''),current+exclusion50Block,
    current.replace(exclusion50Directory,'netlify/functions'),
    current+'\n[context.production.functions]\n  directory = "netlify/functions"\n',
    current+'\n[functions.spam-watch50]\n  schedule = "@hourly"\n',
    current.replace('npm run build','npm run build && node extra.js'),
    current.replace('nosniff','invalid'),current+'\n[build.environment]\n  SPAM_WATCH_ENABLED = "true"\n']) {
    assert.throws(()=>assertSpamWatchExclusion50Config(bad,old));
  }
});

test('50 exclusion rejects executable files, nested directories and symlink markers',()=>{
  assertDisabledFunctions50Entries([{name:'README.md',isFile:true}]);
  for(const bad of [[],[{name:'README.md',isFile:false}],
    [{name:'README.md',isFile:true},{name:'spam-watch50.mjs',isFile:true}],
    [{name:'README.md',isFile:true},{name:'hidden',isFile:false}],
    [{name:'README.md',isFile:true},{name:'function.zip',isFile:true}]]) {
    assert.throws(()=>assertDisabledFunctions50Entries(bad));
  }
});

test('50 historical product allowlists admit only the exact non-executable marker',()=>{
  for(const verify of [assertExclusion50Marker,assertReviewed50Source42,assertReviewed50Source43]) {
    verify(exclusion50Marker,exclusion50MarkerText,'');
    assert.throws(()=>verify(exclusion50Marker,exclusion50MarkerText+'unreviewed\n',''));
    assert.throws(()=>verify(`${exclusion50Directory}/other.mjs`,'export default ()=>{}',''));
  }
});

test('50 retained monitor source and 38-test suite preserve exact LF/CRLF content; build inputs preserve Git blobs',()=>{
  for(const file of ['netlify/functions/spam-watch50.mjs','tests/spam-watch50.test.mjs']) {
    const original=readGitBlobBuffer(exclusion50Baseline,file,root).buffer;
    const crlf=Buffer.from(original.toString('utf8').replace(/\r?\n/g,'\r\n'));
    const exact=current=>current.equals(original)||current.equals(crlf);
    assert.ok(exact(fs.readFileSync(path.join(root,file))),`${file}: only original LF or exact CRLF checkout bytes`);
    assert.ok(exact(crlf),`${file}: CRLF checkout must not be a false regression`);
    assert.equal(exact(Buffer.concat([original,Buffer.from('unreviewed')])),false,`${file}: no non-EOL drift`);
  }
  // Existing CRLF checkouts are not normalized or misreported as raw Git bytes.
  for(const file of ['package.json','package-lock.json','eleventy.config.js']) {
    assert.equal(hashFileWithGitFilters(file,file,root),readGitBlobBuffer(exclusion50Baseline,file,root).objectId,
      `${file}: retained Git blob including the checkout's existing EOL filters`);
  }
});

test('50 future staging integration permits only its existing global noindex header',()=>{
  const old=baseline(), current=read('netlify.toml').replaceAll('\r\n','\n');
  const noindex='    X-Robots-Tag = "noindex, nofollow, noarchive, nosnippet"\n';
  const candidate=current.replace(noindex,'');
  const staging=candidate.replace('    Referrer-Policy = "strict-origin-when-cross-origin"\n',
    '    Referrer-Policy = "strict-origin-when-cross-origin"\n'+noindex);
  assertSpamWatchExclusion50Config(candidate,old,'candidate');
  assertSpamWatchExclusion50Config(staging,old,'staging');
  assert.throws(()=>assertSpamWatchExclusion50Config(staging,old,'candidate'));
  assert.throws(()=>assertSpamWatchExclusion50Config(candidate,old,'staging'));
  assert.throws(()=>assertSpamWatchExclusion50Config(staging.replace(noindex,noindex+noindex),old,'staging'));
});

test('50 neither monitor code nor exclusion marker is copied to the static website',()=>{
  const published=[...FROZEN_PASSTHROUGH_FILES,...OWNED_STATIC_FILES,...GENERATED_ROUTES.map(route=>route.destination)];
  assert.ok(published.length>0);
  for(const file of published) assert.doesNotMatch(file,/(?:^|\/)(?:netlify|\.netlify|node_modules|tests)(?:\/|$)|spam-watch/i);
});

test('50 exclusion tests are mandatory and all previous verification suites are retained',()=>{
  const previous=readGitBlobBuffer(exclusion50Baseline,'tests/verify-orchestrator.mjs',root).buffer.toString('utf8').replaceAll('\r\n','\n');
  const current=read('tests/verify-orchestrator.mjs').replaceAll('\r\n','\n');
  const added='  "tests/spam-watch-exclusion50.test.mjs",\n';
  assert.equal(current.split(added).length,2);
  assert.equal(current.replace(added,''),previous);
});
