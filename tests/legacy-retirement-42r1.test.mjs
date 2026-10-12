import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readGitBlobBuffer} from './git-binary-reader.mjs';
import {BASE_42,edits42,retired42,expectedRetirement42,beforeRetirement42,assertExactRetirement42,assertRetirement42Sources,assertRetirement42Output,assertRetiredResponse42,assertReviewed50Source42} from './legacy-retirement-42r1.mjs';
import {consent50} from './consent-50-literals.mjs';
import {docs50} from './docs-50-literals.mjs';
import {BASE_DEPENDENCIES50,dependencies50Files,spamWatch50File} from './dependencies50.mjs';
import {retainedWd46PosterFiles47} from './wd46-retained-posters47.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('42R1 exact source delta and preservation of retired Git blobs',()=>{
 const result=assertRetirement42Sources(root);
 assert.equal(result.sources.length,retired42.length);
 assert.equal(result.retainedWd46Posters,2);
});
test('42R1 legal reverse oracle cannot hide unauthorized clauses',()=>{
 for(const file of ['src/privacy-policy.njk','src/termini-condizioni.njk']){
  const old=readGitBlobBuffer(BASE_42,file,root).buffer.toString('utf8').replace(/\r\n/g,'\n');
  const next=expectedRetirement42(file,old);
  assert.equal(beforeRetirement42(file,next),old);
  assert.notEqual(beforeRetirement42(file,next+'\nUnauthorized retention'),old);
 }
});
test('42R1/50 additions require exact reviewed code/copy; an unrelated delta or path cannot pass',()=>{
 for(const contract of [consent50,docs50])for(const file of Object.keys(contract.edits)) {
  const current=fs.readFileSync(path.join(root,file),'utf8').replaceAll('\r\n','\n');
  const old=readGitBlobBuffer(contract.baseline,file,root).buffer;
  assertReviewed50Source42(file,current,old);
  assert.throws(()=>assertReviewed50Source42(file,current+'\nUNREVIEWED_42_DELTA',old));
  const removed=current.replace(contract.edits[file][0].after,'');assert.notEqual(removed,current);
  assert.throws(()=>assertReviewed50Source42(file,removed,old));
 }
 const controller=fs.readFileSync(path.join(root,'js/consent-basic50.js'),'utf8');
 assertReviewed50Source42('js/consent-basic50.js',controller,'');
 assert.throws(()=>assertReviewed50Source42('js/consent-basic50.js',controller+'\nUNREVIEWED_42_DELTA',''));
 assert.throws(()=>assertReviewed50Source42('js/unknown50.js',controller,''));
 assert.throws(()=>assertReviewed50Source42('js/netlify-lead-form.js','UNREVIEWED_42_DELTA',''));
});
test('42R1/50 dependency exception reconstructs all baseline fields and permits only one reviewed function',()=>{
 for(const file of dependencies50Files) {
  const current=fs.readFileSync(path.join(root,file),'utf8');
  const old=readGitBlobBuffer(BASE_DEPENDENCIES50,file,root).buffer;
  assertReviewed50Source42(file,current,old);
  const mutated=JSON.parse(current);mutated.unreviewed=true;
  assert.throws(()=>assertReviewed50Source42(file,JSON.stringify(mutated,null,2)+'\n',old));
 }
 const source=fs.readFileSync(path.join(root,spamWatch50File),'utf8');
 assertReviewed50Source42(spamWatch50File,source,'');
 assert.throws(()=>assertReviewed50Source42(spamWatch50File,source+'\nUNREVIEWED_42_DELTA',''));
 assert.throws(()=>assertReviewed50Source42('netlify/functions/another.mjs',source,''));
 assert.throws(()=>assertReviewed50Source42('netlify/unknown.json','{}',''));
});
const names=['contact-main','demo-automazioni-ai','demo-configuratori-ecommerce','demo-cpq-portali','demo-planner-arredamento','mini-demo-configuratori'];
const fixture=()=>new Map([
 ['index.html',names.map(name=>'<form name="'+name+'" data-netlify="true"></form>').join('')],
 ['404.html','<link href="/css/404.css"><script src="/js/404.js"></script>'],
 ['sitemap.xml','<urlset>'+Array.from({length:10},(_,i)=>'<loc>/core-'+i+'</loc>').join('')+'</urlset>']
]);
test('42R1 clean synthetic output is accepted',()=>assertRetirement42Output(fixture()));

test('42R1/47 retained WD46 source posters are forbidden in output and public references',()=>{
 for(const asset of retainedWd46PosterFiles47) {
  const files=fixture();files.set(asset,fs.readFileSync(path.join(root,asset)));
  assert.throws(()=>assertRetirement42Output(files),/historical WD46 poster must not publish/);
  const linked=fixture();linked.set('alias.html','<img src="/'+asset+'">');
  assert.throws(()=>assertRetirement42Output(linked),/historical WD46 poster reference forbidden/);
 }
});
test('42R1 rendered escaped description reverses only the exact approved metadata',()=>{
 const [old,next]=edits42['src/termini-condizioni.njk'][0];
 const tag=text=>'<meta name="description" content="'+text.replaceAll("'",'&#39;')+'">';
 assert.equal(beforeRetirement42('src/termini-condizioni.njk',tag(next)),tag(old));
 assert.notEqual(beforeRetirement42('src/termini-condizioni.njk',tag(next+' unauthorized')),tag(old));
});
for(const asset of retired42) test('42R1 rejects reintroduced output '+asset,()=>{
 const files=fixture();files.set(asset,'retired');
 assert.throws(()=>assertRetirement42Output(files),/retired output/);
});
for(const [name,mutation] of [
 ['legacy link','<a href="/chatbot-ai-intelligenti">Old service</a>'],
 ['retired site link','<a href="/siti-web-custom-seo">Old site</a>'],
 ['chatbot loader','<script src="/chatbot/js/main.996591d1.js"></script>'],
 ['dynamic loader','const url="/chatbot/"+"js/main.996591d1.js";'],
 ['Formsubmit action','<form action="https://formsubmit.co/example"></form>'],
 ['mount','<div id="root"></div>'],
 ['public alias','<iframe src="/chatbot-ai-intelligenti.html"></iframe>']
]) test('42R1 detects '+name,()=>{
 const files=fixture();files.set(name==='dynamic loader'?'js/stray.js':'alias.html',mutation);
 assert.throws(()=>assertRetirement42Output(files));
});
for(const slug of ['chatbot-ai-intelligenti','siti-web-custom-seo']) {
 const base='https://example.test/'+slug;
 test('42R1 true404 and one same-family Pretty URL normalization '+slug,()=>{
  for(const url of [base,base+'/',base+'.html',base+'?qa-retirement=42r1']) assertRetiredResponse42(url,[{url,status:404}]);
  assertRetiredResponse42(base+'.html',[{url:base+'.html',status:301,location:base},{url:base,status:404}]);
 });
 test('42R1 rejects soft200, unrelated redirect and loop '+slug,()=>{
  assert.throws(()=>assertRetiredResponse42(base,[{url:base,status:200}]),/True404/);
  assert.throws(()=>assertRetiredResponse42(base,[{url:base,status:301,location:'/'},{url:'https://example.test/',status:404}]),/family/);
  assert.throws(()=>assertRetiredResponse42(base,[{url:base,status:301,location:base},{url:base,status:301,location:base}]),/True404/);
 });
}
test('42R1 catches source clauses outside the explicit diff',()=>{
 for(const file of Object.keys(edits42)){
  const old=readGitBlobBuffer(BASE_42,file,root).buffer.toString('utf8');
  const expected=expectedRetirement42(file,old);
  assert.throws(()=>assertExactRetirement42(file,expected+'unexpected',old),/only authorized42 edits/);
 }
});
