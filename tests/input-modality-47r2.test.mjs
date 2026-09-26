import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {readGitBlobBuffer} from './git-binary-reader.mjs';
import {beforeEditorialMotion47R3} from './editorial-motion-47r3.mjs';
import {INPUT_BASE47R2,inputFiles47R2,inputEdits47R2,modalityJs47R2,modalityCss47R2,afterInputModality47R2,beforeInputModality47R2,assertInputDelta47R2,assertInputSources47R2,assertInputOutput47R2,isInputProduct47R2} from './input-modality-47r2.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const lf=text=>text.replace(/\r\n/g,'\n');
const read=file=>lf(fs.readFileSync(path.join(root,file),'utf8'));
const old=file=>lf(readGitBlobBuffer(INPUT_BASE47R2,file,root).buffer.toString('utf8'));

for(const file of inputFiles47R2){
  test(file+': exact input-decoration delta against immutable47 baseline',()=>assertInputDelta47R2(file,read(file),old(file)));
  test(file+': rejects missing, duplicated, mutated and unrelated changes',()=>{
    const current=read(file),baseline=old(file),[before,after]=inputEdits47R2[file];
    const mutants=[baseline,current.replace(after,before),current.replace(after,after+after),current+'\nUNAUTHORIZED',current.replace('sxPointerFocus','wrongScope').replace('data-sx-pointer-focus','data-wrong-scope'),current.replace('47R2:','MUTATED:')];
    for(const mutant of mutants){assert.notEqual(mutant,current);assert.throws(()=>assertInputDelta47R2(file,mutant,baseline));}
  });
  test(file+': historical inverse retains unknown bytes and supports explicit CRLF',()=>{
    const current=read(file),baseline=old(file);
    assert.equal(beforeInputModality47R2(file,current+'\nUNKNOWN'),baseline+'\nUNKNOWN');
    assert.equal(beforeInputModality47R2(file,baseline),baseline);
    assertInputDelta47R2(file,current.replaceAll('\n','\r\n'),baseline);
    assert.equal(afterInputModality47R2(file,baseline),beforeEditorialMotion47R3(file,current));
  });
}

function controller(source=read('js/site-shell.js')){
  const begin=source.indexOf('  //47R2:'),end=source.indexOf('  const themeToggle =',begin);
  assert(begin>=0&&end>begin);
  const events={document:new Map(),window:new Map()},element={dataset:{}};
  const target=scope=>({addEventListener(type,handler,options){assert(!events[scope].has(type));events[scope].set(type,{handler,options});}});
  vm.runInNewContext(source.slice(begin,end),{root:element,document:target('document'),window:target('window')});
  return {element,events,dispatch(type,event={},scope='document'){events[scope].get(type)?.handler(event);},marked(){return Object.hasOwn(element.dataset,'sxPointerFocus');}};
}

test('pointer capture precedes dialog focus; passive handler never cancels gestures',()=>{
  const c=controller();assert.equal(c.marked(),false);
  const options=c.events.document.get('pointerdown').options;assert.equal(options.capture,true);assert.equal(options.passive,true);
  c.dispatch('pointerdown',{pointerType:'touch',preventDefault(){assert.fail('must not cancel');}});assert.equal(c.marked(),true);
  // Autofocus and focus restoration do not change input provenance.
  c.dispatch('focusin');c.dispatch('focusout');c.dispatch('close');assert.equal(c.marked(),true);
  assert.deepEqual([...c.events.document.keys()],['pointerdown','keydown','click']);
});
test('Tab, Enter, Space, Escape, arrows and ordinary keyboard clear pointer-only styling',()=>{
  for(const key of ['Tab','Enter',' ','Escape','ArrowLeft','ArrowRight','Home','End','a','Shift']){const c=controller();c.dispatch('pointerdown');c.dispatch('keydown',{key});assert.equal(c.marked(),false,key);}
  assert.equal(controller().events.document.get('keydown').options,true);
});
test('modified system shortcuts do not misclassify pointer interaction',()=>{
  for(const modifier of ['metaKey','altKey','ctrlKey']){const c=controller();c.dispatch('pointerdown');c.dispatch('keydown',{key:'x',[modifier]:true});assert.equal(c.marked(),true);}
});
test('mouse, touch and pen normal clicks preserve pointer provenance',()=>{
  for(const pointerType of ['mouse','touch','pen']){const c=controller();c.dispatch('pointerdown',{pointerType});c.dispatch('click',{pointerType,detail:1});assert.equal(c.marked(),true);}
});
test('keyboard/assistive virtual clicks clear a previous pointer marker',()=>{
  for(const pointerType of [undefined,'']){const c=controller();c.dispatch('pointerdown');c.dispatch('click',{detail:0,pointerType});assert.equal(c.marked(),false);}
  assert.equal(controller().events.document.get('click').options,true);
});
test('a zero-detail click with an actual pointer type is not keyboard activation',()=>{
  for(const pointerType of ['touch','mouse','pen']){const c=controller();c.dispatch('pointerdown',{pointerType});c.dispatch('click',{detail:0,pointerType});assert.equal(c.marked(),true);}
});
test('window blur clears the ephemeral marker; no persistent setting',()=>{
  const c=controller();c.dispatch('pointerdown');c.dispatch('blur',{},'window');assert.equal(c.marked(),false);
  assert.deepEqual([...c.events.window.keys()],['blur']);
  assert.doesNotMatch(modalityJs47R2,/localStorage|sessionStorage|cookie|fetch|sendBeacon|preventDefault|\.focus\(|\.blur\(/);
});
test('moving a mouse or scrolling never hides keyboard focus',()=>{
  const c=controller();for(const type of ['pointermove','mousemove','wheel','scroll','touchmove'])c.dispatch(type);assert.equal(c.marked(),false);
});
test('runtime negatives expose missing pointer/keyboard/assistive/blur handling',()=>{
  const source=read('js/site-shell.js');
  const noPointer=controller(source.replace('root.dataset.sxPointerFocus = ""','void 0'));noPointer.dispatch('pointerdown');assert.equal(noPointer.marked(),false);
  for(const event of ['keydown','click']){const mutant=controller(source.replace('document.addEventListener("'+event+'"','document.addEventListener("disabled-'+event+'"'));mutant.dispatch('pointerdown');mutant.dispatch(event,{key:'Tab',detail:0});assert.equal(mutant.marked(),true);}
  const noBlur=controller(source.replace('window.addEventListener("blur"','window.addEventListener("disabled-blur"'));noBlur.dispatch('pointerdown');noBlur.dispatch('blur',{},'window');assert.equal(noBlur.marked(),true);
});
test('CSS suppresses only marked pointer-control outlines, never editable or selection states',()=>{
  assert.equal(modalityCss47R2.split('outline: none;').length,2);
  assert(modalityCss47R2.includes(':root[data-sx-pointer-focus] :is(a[href], button, summary, [role="button"], [role="link"]):not(:where([contenteditable], [contenteditable] *)):focus'));
  assert.doesNotMatch(modalityCss47R2,/input|textarea|select[\s\[\],:]|!important|display:|visibility:|pointer-events:|:checked|aria-pressed/);
  assert(read('css/foundation.css').includes(':focus-visible {\n  outline: 3px solid var(--sx-blue-deep);\n  outline-offset: 4px;\n}'));
});
test('gallery focus transfers, six lead contracts, consent, WD and core3D remain frozen',()=>{
  for(const file of ['js/project-proof-galleries.js','css/project-proof-galleries.css','js/cookie-banner.js','js/netlify-lead-form.js','js/contattaci.js','js/configuratori-3d-2d.js','js/service-demo-form.js','js/ad-attribution-consent.js','js/ga-autotrack.js','src/_data/serviceDemos.json','src/_data/measurement.json','demo/ecommerce/style.css','demo/ecommerce/embed.js'])assert.equal(read(file),old(file),file);
});
test('real source/output guards are mandatory and reject missing output',()=>{
  assert.deepEqual(inputFiles47R2,['js/site-shell.js','css/foundation.css']);assert.equal(assertInputSources47R2(root).files,2);
  for(const file of inputFiles47R2)assert.equal(isInputProduct47R2(file,root),true);
  for(const file of ['js/site-shell-copy.js','css/foundation-pointer.css','js/cookie-banner.js'])assert.equal(isInputProduct47R2(file,root),false);
  assert.throws(()=>assertInputOutput47R2(root,path.join(root,'__missing_focus47r2_output__')));
  assert.throws(()=>afterInputModality47R2('js/cookie-banner.js','frozen'));
  assert.equal(beforeInputModality47R2('js/cookie-banner.js','frozen'),'frozen');
  assert(read('tests/verify-orchestrator.mjs').includes('"tests/input-modality-47r2.test.mjs"'));
  assert(read('tests/verify.mjs').includes('assertInputOutput47R2(root, outputRoot);'));
});
