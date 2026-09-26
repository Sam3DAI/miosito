import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {readGitBlobBuffer} from './git-binary-reader.mjs';
import {MOBILE_BASE47R1, mobileHoverFiles47R1, mobileHoverEdits47R1, afterMobileHover47R1, beforeMobileHover47R1, assertMobileHoverDelta47R1, assertMobileHoverSources47R1, assertMobileHoverOutput47R1} from './mobile-hover-47r1.mjs';
import {beforeInputModality47R2,assertInputSources47R2} from './input-modality-47r2.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const lf=text=>text.replace(/\r\n/g,'\n');
const read=file=>lf(fs.readFileSync(path.join(root,file),'utf8'));
const old=file=>readGitBlobBuffer(MOBILE_BASE47R1,file,root).buffer.toString('utf8');

for(const file of mobileHoverFiles47R1) {
  test(file+': exact bounded fix, not a blanket rewrite',()=>assertMobileHoverDelta47R1(file,read(file),old(file)));
  test(file+': old/partial/duplicate/changed/unknown deltas are rejected',()=>{
    const current=read(file), baseline=old(file);
    const mutants=[lf(baseline),current+'\nbutton:focus { background: red; }\n',current.replace('var(--sx-blue-deep)','#123456')];
    if(file==='css/cookie-banner.css')mutants[2]=current.replace('outline: 2px','outline: 0px');
    for(const [before,after] of mobileHoverEdits47R1[file])mutants.push(current.replace(after,before),current.replace(after,after+'\n'+after),current.replace(after,after.replace('hover: hover','hover: none').replace(':focus-visible',':focus')));
    for(const mutant of mutants){assert.notEqual(mutant,current,'Mutation must really modify input');assert.throws(()=>assertMobileHoverDelta47R1(file,mutant,baseline));}
  });
  test(file+': CRLF/LF are explicit and historical reconstruction keeps unknown bytes',()=>{
    const current=read(file), baseline=lf(old(file));
    assertMobileHoverDelta47R1(file,current.replaceAll('\n','\r\n'),baseline.replaceAll('\n','\r\n'));
    assert.equal(beforeMobileHover47R1(file,current+'\nUNAUTHORIZED'),baseline+'\nUNAUTHORIZED');
    assert.equal(beforeMobileHover47R1(file,baseline),baseline);
    assert.equal(afterMobileHover47R1(file,baseline),current);
  });
}

test('touch fix preserves keyboard focus, page state and checked state independently of hover',()=>{
  const shell=read('css/site-shell.css'), cookie=read('css/cookie-banner.css'), marketing=read('css/marketing-pages.css');
  assert.match(shell,/\.site-navigation__solutions a:focus-visible,\n\.site-navigation__solutions a\[aria-current="page"\] \{\n  color: var\(--sx-blue-deep\);\n\}/);
  for(const selector of ['.site-navigation__secondary-links a[aria-current="page"]','.site-footer__column a[aria-current="page"]'])assert(shell.includes(selector+' {\n  color: var(--sx-blue-deep);\n}'));
  assert(cookie.includes('.cc-window :focus-visible { outline: 2px solid #45b6fe; outline-offset: 2px; }'));
  assert(cookie.includes('.cc-pref-switch input:checked + .cc-switch { background:#45b6fe; }'));
  assert(marketing.includes('.visual-card-rail__indicators span.is-active { background: var(--sx-blue); }'));
  assert(read('css/foundation.css').includes('-webkit-tap-highlight-color: transparent'));
});

test('all intended source paths are mandatory; no implicit path-wide exception',()=>{
  assert.deepEqual(mobileHoverFiles47R1,['css/site-shell.css','css/marketing-pages.css','css/cookie-banner.css']);
  assert.equal(assertMobileHoverSources47R1(root).literalPairs,12);
  assert.throws(()=>afterMobileHover47R1('js/site-shell.js',read('js/site-shell.js')));
  assert.equal(beforeMobileHover47R1('js/site-shell.js','keep this'), 'keep this');
});

test('output binding rejects stale or altered CSS without trusting a rebuilt oracle',()=>{
  // Deliberately missing output: the real output gate must perform actual reads.
  assert.throws(()=>assertMobileHoverOutput47R1(root,path.join(root,'__missing_output_mobile47r1__')));
});

test('interaction and consent engines, form styles and genuine demo selection are byte-equivalent to47',()=>{
  assertInputSources47R2(root);
  for(const file of ['js/site-shell.js','js/project-proof-galleries.js','js/cookie-banner.js','js/ad-attribution-consent.js','js/ga-autotrack.js','js/netlify-lead-form.js','js/contattaci.js','js/configuratori-3d-2d.js','js/service-demo-form.js','css/foundation.css','css/project-proof-galleries.css','css/contattaci.css','css/configuratori-3d-2d.css','css/service-demo-form.css','demo/ecommerce/style.css','src/_data/serviceDemos.json','src/_data/measurement.json'])assert.equal(beforeInputModality47R2(file,read(file)),lf(old(file)),file+': unchanged except exact47R2 input decoration');
});
