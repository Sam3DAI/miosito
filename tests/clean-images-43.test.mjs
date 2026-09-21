import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readGitBlobBuffer} from './git-binary-reader.mjs';
import {assertRetirement42Output} from './legacy-retirement-42r1.mjs';
import {BASE_43,contract43,aiItems43,cleanFiles43,keptFiles43,unusedFiles43,assertMetadata43,assertAiBindings43,assertCleanFile43,assertImageFiles43,assertCleanSources43,assertCleanOutput43,assertCleanConfig43,clean43Binding,assertClassificationCss43} from './clean-images-43.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const baseline=file=>readGitBlobBuffer(BASE_43,file,root).buffer.toString('utf8');
const metadata=()=>JSON.parse(read('src/_data/originalImages31.json'));
const oldMetadata=()=>JSON.parse(baseline('src/_data/originalImages31.json'));
const source='src/automazioni-ai-business.njk';
const imageFiles=()=>new Map([...cleanFiles43,...keptFiles43].map(file=>[file,fs.readFileSync(path.join(root,file))]));
const outputFixture=()=>new Map([
  ...imageFiles(),
  ['404.html',read('404.html')],
  ['sitemap.xml',read('sitemap.xml')],
  ['index.html',['contact-main','demo-automazioni-ai','demo-configuratori-ecommerce','demo-cpq-portali','demo-planner-arredamento','mini-demo-configuratori'].map(name=>'<form name="'+name+'" data-netlify="true"></form>').join('')]
]);

test('43 source scope, 19 replacements, nine additions and four retained metadata records',()=>{
  const result=assertCleanSources43(root);
  assert.equal(result.mapped,28);assert.equal(result.retained,4);assert.equal(result.total,32);
  assert.equal(result.files,84);assert.equal(result.publishedImages,96);assert.equal(result.unusedVariantsExcluded,57);
});
test('43 partial patch cannot remove a preserved record or replace the entire registry',()=>{
  const current=metadata(),old=oldMetadata();
  delete current['HOME-01'];
  assert.throws(()=>assertMetadata43(current,old),/partial merge/);
  assert.throws(()=>assertMetadata43(Object.fromEntries(contract43.items.map(a=>[a.id,metadata()[a.id]])),old),/partial merge/);
});
test('43 retained records are deep equal, not merely present',()=>{
  for(const id of contract43.preserved) {
    const current=metadata();current[id].alt+=' unauthorized';
    assert.throws(()=>assertMetadata43(current,oldMetadata()),/exact retained metadata/);
  }
});
test('43 replacement metadata rejects a missing srcset candidate or width descriptor',()=>{
  for(const transform of [s=>s.split(', ').slice(0,2).join(', '),s=>s.replace(' 350w','')]) {
    const current=metadata();current['HOME-02'].srcset=transform(current['HOME-02'].srcset);
    assert.throws(()=>assertMetadata43(current,oldMetadata()),/metadata digest|srcset/);
  }
});
test('43 all 84 responsive WebP bytes and real dimensions match the package oracle',()=>{
  assert.equal(assertImageFiles43(imageFiles()).files,84);
});
test('43 missing srcset file fails even when its metadata remains present',()=>{
  const files=imageFiles();files.delete(cleanFiles43[0]);
  assert.throws(()=>assertImageFiles43(files),/missing srcset file/);
});
test('43 changed bytes and a false width descriptor cannot satisfy the WebP oracle',()=>{
  const variant=contract43.items[0].variants[0],bytes=imageFiles().get(variant.file),corrupt=Buffer.from(bytes);
  corrupt[corrupt.length-1]^=1;
  assert.throws(()=>assertCleanFile43(corrupt,variant),/approved package bytes/);
  assert.throws(()=>assertCleanFile43(bytes,{...variant,width:700}),/width descriptor and dimensions/);
});
test('43 Classificazione is exactly 1024x1536 at maximum, never mislabeled as 1050w',()=>{
  const item=contract43.items.find(a=>a.id==='AI-02');
  assert.deepEqual(item.variants.map(v=>[v.width,v.height]),[[350,525],[700,1050],[1024,1536]]);
  assert.match(metadata()['AI-02'].srcset,/classificazione-1024\.webp 1024w$/);
  assert.doesNotMatch(metadata()['AI-02'].srcset,/1050w/);
});
test('43 exact AI card title, order, copy and all 27 binding properties are retained',()=>{
  assert.equal(aiItems43.length,9);
  assertAiBindings43(read(source),baseline(source));
});
test('43 wrong AI image binding, duplicate slot and changed copy fail',()=>{
  const current=read(source),old=baseline(source);
  assert.throws(()=>assertAiBindings43(current.replace(clean43Binding('AI-01'),clean43Binding('AI-09')),old));
  assert.throws(()=>assertAiBindings43(current.replace('title: "Classificazione"','title: "Revisioni"'),old));
  assert.throws(()=>assertAiBindings43(current.replace('label: "Documenti"','label: "Alterato"'),old));
});
test('43 exact image publish allowlist rejects an extra source or non-image configuration edit',()=>{
  const config=read('eleventy.config.js'),old=baseline('eleventy.config.js');
  assertCleanConfig43(config,old);
  assert.throws(()=>assertCleanConfig43(config.replace('  "404.html",','  "404.html",\n  "assets/images/cards-43/master.png",'),old));
  assert.throws(()=>assertCleanConfig43(config+'\n// unauthorized configuration change',old));
});
test('43 clean output preserves retirement42R1 and all kept files',()=>{
  const files=outputFixture();
  assert.equal(assertCleanOutput43(files).retainedFiles,12);
  assert.equal(assertRetirement42Output(files).forms,6);
});
test('43 reintroduced legacy resource is rejected despite correct new images',()=>{
  const files=outputFixture();files.set('chatbot/js/main.996591d1.js','legacy');
  assert.throws(()=>assertRetirement42Output(files),/retired output/);
});
test('43 old variants cannot publish or remain referenced after verified cleanup',()=>{
  const files=outputFixture();files.set(unusedFiles43[0],Buffer.from('obsolete'));
  assert.throws(()=>assertCleanOutput43(files),/unused superseded variant/);
  files.delete(unusedFiles43[0]);files.set('alias.html','<img src="/'+unusedFiles43[0]+'">');
  assert.throws(()=>assertCleanOutput43(files),/zero residual uses/);
});
test('43 CSS cannot request the new HTML images a second time',()=>{
  const files=outputFixture();files.set('css/stray.css','body{background-image:url(/'+cleanFiles43[0]+')}');
  assert.throws(()=>assertCleanOutput43(files),/duplicate CSS image requests/);
});
test('43 observed Classificazione and Assistenti interni clearances are the only exact CSS exceptions',()=>{
  const source=read('css/marketing-pages.css'),old=baseline('css/marketing-pages.css');
  assertClassificationCss43(source,old);
  assert.throws(()=>assertClassificationCss43(source+'\nbody { color: red; }',old),/only the exact/);
  assert.throws(()=>assertClassificationCss43(source.replace('keep the whole 2:3 composition.','allow crop.'),old),/unique observed/);
});
