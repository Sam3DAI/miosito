import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {readGitBlobBuffer} from './git-binary-reader.mjs';
import {beforeGalleries44r2} from './project-galleries-44r2.mjs';
export const contract44=JSON.parse(fs.readFileSync(new URL('./project-proof-ui-44-contract.json',import.meta.url),'utf8'));
const lf=s=>s.replace(/\r\n/g,'\n');
export const productFiles44=Object.keys(contract44.edits);
// Exact inverse only: an unexpected declaration, selector, SVG or adjacent
// change stays visible to the historical oracle. Never strip arbitrary CSS.
export function beforeProof44(file,input){let text=beforeGalleries44r2(file,input);for(const edit of contract44.edits[file]||[])text=text.replace(edit.after,edit.before);return text;}
export function assertProof44File(file,current,baseline){
 let expected=lf(baseline);
 for(const edit of contract44.edits[file]||[]){assert.equal(expected.split(edit.before).length,2,file+': unique44 baseline callsite');expected=expected.replace(edit.before,edit.after);}
 assert.equal(beforeGalleries44r2(file,current),expected,file+': exact bounded44 delta after authorized later callsites');
 assert.equal(beforeProof44(file,current),lf(baseline),file+': reversible44 delta');
}
export function assertProof44Sources(root){
 for(const file of productFiles44)assertProof44File(file,fs.readFileSync(path.join(root,file),'utf8'),readGitBlobBuffer(contract44.base,file,root).buffer.toString('utf8'));
 const css=fs.readFileSync(path.join(root,'css/marketing-pages.css'),'utf8');
 assert.doesNotMatch(css,/height:\s*(?:80|85|90)%/,'44 no arbitrary image shrink');
 assert.match(css,/\.visual-card__image \{ inset: auto 0 0; width: 100%; height: auto; \}/,'44 intrinsic aspect ratio at full width');
 assert.match(css,/aspect-ratio: var\(--subject-reserve\)/,'44 measured content reserve');
 assert.match(css,/stroke-width: 2\.5/,'44 chevron weight');
 assert.match(css,/width: 2\.75rem;\s*height: 2\.75rem;/,'44 existing target >=44 at normal root font');
 return {result:'PASS',productFiles:productFiles44,portfolio:'BLOCKED_NO_SAFE_CAPTURE',clientCodePublished:false};
}
