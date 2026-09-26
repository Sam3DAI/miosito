import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {readGitBlobBuffer} from './git-binary-reader.mjs';
import {MOTION_BASE47R3,motionEdits47R3,afterEditorialMotion47R3,beforeEditorialMotion47R3,assertEditorialMotionDelta47R3,assertEditorialMotionSources47R3,assertEditorialMotionOutput47R3} from './editorial-motion-47r3.mjs';
import {assertInputDelta47R2} from './input-modality-47r2.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const lf=s=>s.replace(/\r\n/g,'\n');
const current=lf(fs.readFileSync(path.join(root,'js/site-shell.js'),'utf8'));
const old=lf(readGitBlobBuffer(MOTION_BASE47R3,'js/site-shell.js',root).buffer.toString('utf8'));

test('47R3 permits only three literal motion edits and preserves pointer fix',()=>{
 assertEditorialMotionDelta47R3(current,old);assertInputDelta47R2('js/site-shell.js',current,old);
 assert.equal(motionEdits47R3.length,3);assert.equal(assertEditorialMotionSources47R3(root).durationMs,1100);
});
test('47R3 rejects the old motion and each omitted or duplicated edit',()=>{
 assert.throws(()=>assertEditorialMotionDelta47R3(old,old));
 for(const [before,after] of motionEdits47R3){
  for(const mutant of [current.replace(after,before),current.replace(after,after+after)]){
   assert.notEqual(mutant,current);assert.throws(()=>assertEditorialMotionDelta47R3(mutant,old));
  }
 }
});
test('47R3 rejects accelerated duration, exaggerated travel, easing and persistent fill changes',()=>{
 for(const [before,after] of [['duration: 1100','duration: 420'],['translateY(24px)','translateY(100px)'],['0.22, 0.61, 0.36, 1','0, 0, 1, 1'],['fill: "none"','fill: "forwards"']]){
  const mutant=current.replace(before,after);assert.notEqual(mutant,current);assert.throws(()=>assertEditorialMotionDelta47R3(mutant,old));
 }
});
test('47R3 rejects removal of reduced-motion, focus, fragments and fail-open guards',()=>{
 for(const needle of ['motionPreference.matches || window.matchMedia("print").matches','group.contains(document.activeElement)','if (window.location.hash) stop();','} catch (_) { stop(); }']){
  const mutant=current.replace(needle,'/* REMOVED */');assert.notEqual(mutant,current);assert.throws(()=>assertEditorialMotionDelta47R3(mutant,old));
 }
});
test('47R3 rejects broadening animation targets to forms or heroes',()=>{
 for(const needle of ['main .section-heading, main .split-panel, main .hero-editorial-note','.page-hero, .mini-form-shell, .service-demo-shell, form']){
  const mutant=current.replace(needle,'*');assert.notEqual(mutant,current);assert.throws(()=>assertEditorialMotionDelta47R3(mutant,old));
 }
});
test('47R3 reconstruction keeps unknown surrounding code for the full-source guard',()=>{
 const inverse=beforeEditorialMotion47R3('js/site-shell.js',current);
 assert.equal(beforeEditorialMotion47R3('js/site-shell.js',current+'\nUNKNOWN'),inverse+'\nUNKNOWN');
 assert.throws(()=>assertInputDelta47R2('js/site-shell.js',current+'\nUNKNOWN',old));
 const menu=current.replace('let restoreFocus = false','let restoreFocus = true');assert.notEqual(menu,current);assert.throws(()=>assertInputDelta47R2('js/site-shell.js',menu,old));
});
test('47R3 accepts explicit CRLF without hiding changes or rewriting other files',()=>{
 assertEditorialMotionDelta47R3(current.replaceAll('\n','\r\n'),old);
 assert.equal(beforeEditorialMotion47R3('js/site-shell.js',old),old);
 assert.equal(beforeEditorialMotion47R3('js/configuratori-3d-2d.js','FROZEN'),'FROZEN');
 assert.throws(()=>afterEditorialMotion47R3('missing anchors'));
});
test('47R3 source and built-output checks remain mandatory and fail for absent output',()=>{
 assert.throws(()=>assertEditorialMotionOutput47R3(root,path.join(root,'__missing_motion47r3_output__')));
 assert(fs.readFileSync(path.join(root,'tests/verify-orchestrator.mjs'),'utf8').includes('"tests/editorial-motion-47r3.test.mjs"'));
 assert(fs.readFileSync(path.join(root,'tests/verify.mjs'),'utf8').includes('assertEditorialMotionOutput47R3(root, outputRoot);'));
});
