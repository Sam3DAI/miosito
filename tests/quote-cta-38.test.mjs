import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { readGitBlobBuffer } from './git-binary-reader.mjs';
import { beforeNonvisual40 } from './nonvisual-readiness-40.mjs';
import { beforeCleanImages43 } from './clean-images-43.mjs';
import { BASE_38, edits38, expectedQuote38Source, beforeQuote38, assertQuote38Source, assertQuote38Sources, assertQuote38Html, quote38 } from './quote-cta-38.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('task38 exact approved nine-file delta; styles, engines and six form contracts frozen',()=>assertQuote38Sources(root));
test('task38 exact historical exceptions are reversible only at the authorized call-sites',()=>{
 for(const file of Object.keys(edits38)) {
  const baseline=readGitBlobBuffer(BASE_38,file,root).buffer.toString('utf8').replace(/\r\n/g,'\n');
  const current=fs.readFileSync(path.join(root,file),'utf8');
  assert.equal(beforeQuote38(file,current),baseline);
  assert.equal(expectedQuote38Source(file,baseline),beforeNonvisual40(file,beforeCleanImages43(file,current)));
  assert.throws(()=>assertQuote38Source(file,current+'\nUNAUTHORIZED',baseline));
 }
 assert.equal(beforeQuote38('unrelated.njk','Richiedi un preventivo'),'Richiedi un preventivo');
});
test('task38 exact source gate rejects regressions to titles, images, consent, forms and demo anchors',()=>{
 const baseline=file=>readGitBlobBuffer(BASE_38,file,root).buffer.toString('utf8');
 for(const [file,before,after] of [
  ['src/index.njk','Su misura.','Nuovo titolo.'],
  ['src/index.njk','originalImages31["HOME-01"]','originalImages31["HOME-02"]'],
  ['src/automazioni-ai-business.njk','originalImages31["AI-01"].src','originalImages31["AI-02"].src'],
  ['src/contattaci.njk','id="privacy" name="privacy" required','id="privacy" name="privacy" checked required'],
  ['src/contattaci.njk','name="contact-main"','name="seventh-form"'],
  ['src/configuratori-3d-2d.njk','href="#demo-form"','href="/contattaci"']
 ]) {
  const current=fs.readFileSync(path.join(root,file),'utf8');
  assert.ok(current.includes(before),file+' negative fixture exists');
  assert.throws(()=>assertQuote38Source(file,current.replace(before,after),baseline(file)));
 }
});
const link=(label,href)=>`<a href="${href}">${label}</a>`;
const q=link(quote38.label,quote38.href);
const fixture=(opening)=>`<header>${q}${q}${link('Contatti','/contattaci')}</header><main><div class="cta-group">${opening}</div><div class="final-cta">${q}</div></main>`;
test('task38 HTML oracle rejects a third hero CTA, wrong quote URL, tracking parameters and missing menu CTA',()=>{
 const html=fixture(q+link('Esplora le soluzioni','#soluzioni'));
 assertQuote38Html('/',html);
 for(const changed of [
  html.replace('href="/contattaci#contatti"','href="/contattaci?intent=quote#contatti"'),
  html.replace('<div class="cta-group">','<div class="cta-group">'+q),
  html.replace(q,''),
  html.replace('#soluzioni','#wrong')
 ]) assert.throws(()=>assertQuote38Html('/',changed));
});
test('task38 HTML oracle keeps demo primary and one form while quote is secondary and final',()=>{
 const html=fixture(link('Richiedi una Demo gratuita','#demo-form')+q).replace('</main>','<div id="demo-form"><span class="section-kicker">Richiesta demo</span><form name="demo-configuratori-ecommerce"></form></div></main>');
 assertQuote38Html('/configuratori-ecommerce',html);
 for(const changed of [html.replace('href="#demo-form"','href="/contattaci#contatti"'),html.replace('id="demo-form"','id="removed"'),html.replace('</main>','<form></form></main>')]) assert.throws(()=>assertQuote38Html('/configuratori-ecommerce',changed));
});
