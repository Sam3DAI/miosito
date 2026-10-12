import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {readGitBlobBuffer} from './git-binary-reader.mjs';

export const exclusion50Baseline = '021dfb490d3d522012cf9da65cf8ef57a75bf810';
export const exclusion50Directory = 'netlify/functions-disabled';
export const exclusion50Marker = `${exclusion50Directory}/README.md`;
export const exclusion50Block = '# First release: retain the monitor source, but deploy no server functions.\n[functions]\n  directory = "netlify/functions-disabled"\n\n';
export const exclusion50MarkerText = '# No functions in the first release\n\nThis is the configured Netlify Functions directory. Keep it free of executable files.\nThe Spam monitor source and its tests are retained outside this directory, not deployed.\nSamuele Peron handles the six forms\' Spam checks manually, morning and evening,\nfor the first 30 days after GO-LIVE. This is an operational exception, not a monitor PASS.\nEnabling the monitor later requires separate authorization and runtime qualification.\n';
const lf = text => String(text).replaceAll('\r\n','\n');

// Historical header fixtures may predate this delta. Only the exact reviewed block
// is reversible; the new mandatory suite independently requires it in current config.
export function beforeSpamWatchExclusion50(input) {
  return lf(input).replace(exclusion50Block,'');
}

export function assertSpamWatchExclusion50Config(input,baseline,target='candidate') {
  assert.ok(['candidate','staging'].includes(target),'Explicit verification target');
  const current=lf(input);
  let old=lf(baseline);
  if(target==='staging') {
    const globalHeader='    Referrer-Policy = "strict-origin-when-cross-origin"\n';
    assert.equal(old.split(globalHeader).length,2,'Unique historical global header');
    old=old.replace(globalHeader,globalHeader+'    X-Robots-Tag = "noindex, nofollow, noarchive, nosnippet"\n');
  }
  const anchor='  publish = "_site"\n\n';
  assert.equal(old.split(anchor).length,2,'Unique baseline build anchor');
  assert.equal(current,old.replace(anchor,anchor+exclusion50Block),
    'Only the exact Functions directory exclusion is allowed; no schedule/context/build/header overrides');
}

export function assertExclusion50Marker(file,input) {
  assert.equal(file,exclusion50Marker,'Exact non-executable marker path only');
  assert.equal(lf(input),exclusion50MarkerText,'Exact reviewed marker contents only');
}

export function assertDisabledFunctions50Entries(entries) {
  assert.deepEqual(entries.map(entry=>({name:entry.name,isFile:entry.isFile})),
    [{name:'README.md',isFile:true}],
    'Configured Functions directory contains only the marker, no functions, links or nested directories');
}

export function assertSpamWatchExclusion50(root,target=process.env.SOLVEX_VERIFY_TARGET||'candidate') {
  assertSpamWatchExclusion50Config(fs.readFileSync(path.join(root,'netlify.toml'),'utf8'),
    readGitBlobBuffer(exclusion50Baseline,'netlify.toml',root).buffer,target);
  const directory=path.join(root,exclusion50Directory);
  const directoryStat=fs.lstatSync(directory);
  assert.ok(directoryStat.isDirectory()&&!directoryStat.isSymbolicLink(),'Real task-owned directory, not a symlink');
  assertDisabledFunctions50Entries(fs.readdirSync(directory,{withFileTypes:true})
    .map(entry=>({name:entry.name,isFile:entry.isFile()})));
  assertExclusion50Marker(exclusion50Marker,fs.readFileSync(path.join(root,exclusion50Marker),'utf8'));
  return {result:'PASS_LOCAL_EXCLUSION',directory:exclusion50Directory,deployableFunctions:0,
    monitorRuntime:'NOT_TESTED',remoteDeploy:'NOT_PERFORMED'};
}
