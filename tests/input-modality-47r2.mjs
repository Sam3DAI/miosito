import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {readGitBlobBuffer} from './git-binary-reader.mjs';
import {beforeEditorialMotion47R3,assertEditorialMotionSources47R3} from './editorial-motion-47r3.mjs';

export const INPUT_BASE47R2='b643f3cd544ac29c41e3bbe98886e29a2878bf84';
const lf=text=>text.replace(/\r\n/g,'\n');
// Independent explicit oracle. Historical reconstruction never discards a file.
export const modalityJs47R2=`
  //47R2: Pointer decoration only; focus and keyboard navigation stay intact.
  function clearPointerFocus() { delete root.dataset.sxPointerFocus; }
  document.addEventListener("pointerdown", function () { root.dataset.sxPointerFocus = ""; }, { capture: true, passive: true });
  document.addEventListener("keydown", function (event) {
    if (!event.metaKey && !event.altKey && !event.ctrlKey) clearPointerFocus();
  }, true);
  document.addEventListener("click", function (event) {
    if (event.detail === 0 && !event.pointerType) clearPointerFocus();
  }, true);
  window.addEventListener("blur", clearPointerFocus);
`;
export const modalityCss47R2=`
/*47R2: Do not paint a retained dialog/menu focus as a touch selection.
  Keyboard/assistive activation clears the marker; editable fields keep focus. */
:root[data-sx-pointer-focus] :is(a[href], button, summary, [role="button"], [role="link"]):not(:where([contenteditable], [contenteditable] *)):focus {
  outline: none;
}
`;
const jsAnchor='  root.classList.add("has-site-shell-js");\n';
const cssAnchor=':focus-visible {\n  outline: 3px solid var(--sx-blue-deep);\n  outline-offset: 4px;\n}\n';
export const inputEdits47R2=Object.freeze({
  'js/site-shell.js':Object.freeze([jsAnchor,jsAnchor+modalityJs47R2]),
  'css/foundation.css':Object.freeze([cssAnchor,cssAnchor+modalityCss47R2])
});
export const inputFiles47R2=Object.freeze(Object.keys(inputEdits47R2));
const cache=new Map();
function old(root,file){const key=path.resolve(root)+'\0'+file;if(!cache.has(key))cache.set(key,readGitBlobBuffer(INPUT_BASE47R2,file,root).buffer.toString('utf8'));return cache.get(key);}
export function afterInputModality47R2(file,baseline){
  const edit=inputEdits47R2[file];assert(edit,'No implicit path exception');const source=lf(baseline);
  assert.equal(source.split(edit[0]).length,2,file+': unique baseline anchor');return source.replace(edit[0],edit[1]);
}
export function beforeInputModality47R2(file,input){
  const source=beforeEditorialMotion47R3(file,input),edit=inputEdits47R2[file];if(!edit)return source;
  if(!source.includes('47R2:'))return source;
  assert.equal(source.split(edit[1]).length,2,file+': complete unique input modality addition');return source.replace(edit[1],edit[0]);
}
export function assertInputDelta47R2(file,current,baseline){
  assert.equal(beforeEditorialMotion47R3(file,current),afterInputModality47R2(file,baseline),file+': exact pointer-decoration delta plus independently checked motion tuning');
  assert.equal(beforeInputModality47R2(file,current),lf(baseline));
}
export function assertInputSources47R2(root){
  assertEditorialMotionSources47R3(root); // Mandatory current motion guard before historical reconstruction.
  for(const file of inputFiles47R2)assertInputDelta47R2(file,fs.readFileSync(path.join(root,file),'utf8'),old(root,file));
  return {result:'PASS',baseline:INPUT_BASE47R2,files:2,focusTransfersUnchanged:true,physicalSafari:'NOT_TESTED'};
}
export function isInputProduct47R2(file,root){
  if(!inputFiles47R2.includes(file))return false;
  assertInputDelta47R2(file,fs.readFileSync(path.join(root,file),'utf8'),old(root,file));return true;
}
export function assertInputOutput47R2(root,output){
  const source=assertInputSources47R2(root);
  for(const file of inputFiles47R2)assert.deepEqual(fs.readFileSync(path.join(root,file)),fs.readFileSync(path.join(output,file)),file+': actual RAW output binding');
  return {...source,outputBinding:'RAW_EXACT'};
}
