import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readGitBlobBuffer} from './git-binary-reader.mjs';

export const MOTION_BASE47R3='b643f3cd544ac29c41e3bbe98886e29a2878bf84';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const lf=text=>text.replace(/\r\n/g,'\n');
const blockPattern=/  \/\/ Progressive editorial motion:[\s\S]*?\n  \}\)\(\);\n\n(?=  const siteMenu =)/;
export const motionEdits47R3=Object.freeze([
 ['  // Only below-the-fold marketing introductions enter, once, as whole groups.','  //47R3: Below-fold groups enter slowly once; initial content stays still.'],
 ['{ opacity: 0, transform: "translateY(12px)" }','{ opacity: 0, transform: "translateY(24px)" }'],
 ['{ duration: 420, easing: "ease-out", fill: "none" }','{ duration: 1100, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)", fill: "none" }']
].map(pair=>Object.freeze(pair)));
let cachedBaseline;
function baseline(){return cachedBaseline??=lf(readGitBlobBuffer(MOTION_BASE47R3,'js/site-shell.js',root).buffer.toString('utf8'));}
function block(input){const found=lf(input).match(blockPattern);assert(found,'Editorial initializer must exist');assert.equal(lf(input).split(found[0]).length,2,'Exactly one editorial initializer');return found[0];}
export function afterEditorialMotion47R3(input){
 let result=lf(input);
 for(const [before,after] of motionEdits47R3){assert.equal(result.split(before).length,2,'Unique motion baseline literal');result=result.replace(before,after);}
 return result;
}
export function beforeEditorialMotion47R3(file,input){
 const current=lf(input);if(file!=='js/site-shell.js'||!current.includes('//47R3:'))return current;
 const old=block(baseline()),expected=afterEditorialMotion47R3(old);
 assert.equal(block(current),expected,'Only three exact motion presentation edits');
 return current.replace(expected,old);
}
export function assertEditorialMotionDelta47R3(current,old=baseline()){
 assert.equal(block(current),afterEditorialMotion47R3(block(old)),'Current slower motion is mandatory');
 assert.equal(beforeEditorialMotion47R3('js/site-shell.js',current).match(blockPattern)[0],block(old));
}
export function assertEditorialMotionSources47R3(projectRoot){
 assertEditorialMotionDelta47R3(fs.readFileSync(path.join(projectRoot,'js/site-shell.js'),'utf8'));
 return {result:'PASS',baseline:MOTION_BASE47R3,literalPairs:3,durationMs:1100,translationPx:24,easing:'cubic-bezier(0.22, 0.61, 0.36, 1)',once:true,initialContentUnchanged:true,reducedMotion:'PRESERVED'};
}
export function assertEditorialMotionOutput47R3(projectRoot,outputRoot){
 const result=assertEditorialMotionSources47R3(projectRoot);
 assert.deepEqual(fs.readFileSync(path.join(projectRoot,'js/site-shell.js')),fs.readFileSync(path.join(outputRoot,'js/site-shell.js')),'Motion actual output RAW binding');
 return {...result,outputBinding:'RAW_EXACT'};
}
