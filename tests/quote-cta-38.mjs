import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { readGitBlobBuffer } from './git-binary-reader.mjs';
import { beforeNonvisual40 } from './nonvisual-readiness-40.mjs';

export const BASE_38 = 'e7b54e7cb02b72d34a43d600bdeed6e57481b3dc';
export const quote38 = Object.freeze({label:'Richiedi un preventivo',href:'/contattaci#contatti'});
export const serviceRoutes38 = Object.freeze(['/configuratori-3d-2d','/configuratori-ecommerce','/software-cpq-portali-commerciali','/planner-configuratori-arredamento','/automazioni-ai-business']);
export const finalRoutes38 = Object.freeze(['/','/chi-siamo',...serviceRoutes38]);
const lf = s => s.replace(/\r\n/g,'\n');
const secondary = (href,label,arrow='↓') => `<a class="button button--page button--secondary" href="${href}">${label} <span aria-hidden="true">${arrow}</span></a>`;
const newSecondary = secondary(quote38.href,quote38.label,'↗');
const finalDefault = text => [`"${text}") }}`, `"${text}", "Richiedi un preventivo", true, "/contattaci#contatti") }}`];
const finalDemo = [', "Richiedi una Demo gratuita", false, "#demo-form") }}', ', "Richiedi un preventivo", false, "/contattaci#contatti") }}'];
const contactHeading = '          <h2 id="contact-form-title">Descrivi il progetto.</h2>\n';
export const quoteContext38 = 'Descrivi obiettivi e funzionalità. Ti ricontattiamo per definire le informazioni necessarie a una proposta su misura.';
// Independent exact substitutions from CTA_MAP38, pinned to the approved baseline.
// Neither implementation templates nor navigation data import this oracle.
export const edits38 = Object.freeze({
 'src/_data/navigation.json': [['"cta": { "href": "/contattaci", "label": "Parliamo del tuo progetto" }','"cta": { "href": "/contattaci#contatti", "label": "Richiedi un preventivo" }']],
 'src/index.njk': [
  ['<a class="button button--page button--project" href="/contattaci">Parliamo del tuo progetto <span aria-hidden="true">↗</span></a>','<a class="button button--page button--project" href="/contattaci#contatti">Richiedi un preventivo <span aria-hidden="true">↗</span></a>'],
  finalDefault('Partiamo da catalogo, utenti e passaggi reali per capire quale soluzione ha senso costruire.')],
 'src/chi-siamo.njk': [finalDefault('Descrivi il prodotto, il processo commerciale e il punto che oggi crea più attrito.')],
 'src/configuratori-3d-2d.njk': [
  [secondary('#configurator-scenarios','Scegli il configuratore'),newSecondary],
  finalDefault('Condividi catalogo, utenti e passaggi commerciali: definiamo il primo perimetro utile.')],
 'src/configuratori-ecommerce.njk': [[secondary('#funzioni','Esplora le funzioni'),newSecondary],finalDemo],
 'src/software-cpq-portali-commerciali.njk': [[secondary('#moduli','Esplora i moduli'),newSecondary],finalDemo],
 'src/planner-configuratori-arredamento.njk': [[secondary('#funzioni','Esplora le funzioni'),newSecondary],finalDemo],
 'src/automazioni-ai-business.njk': [[secondary('#casi-uso','Esplora i casi d’uso'),newSecondary],finalDemo],
 'src/contattaci.njk': [
  ['<span class="eyebrow">Contatti · Primo confronto</span>','<span class="eyebrow">Contatti e preventivi</span>'],
  ['<span class="section-kicker">Richiesta</span>','<span class="section-kicker">Richiesta di preventivo</span>'],
  [contactHeading,contactHeading+'          <p>'+quoteContext38+'</p>\n']]
});
export function expectedQuote38Source(file, baseline) {
 let expected=lf(baseline);
 for(const [before,after] of edits38[file]||[]) {
  assert.equal(expected.split(before).length,2,file+': exactly one authorized call-site');
  expected=expected.replace(before,after);
 }
 return expected;
}
// Historical oracles reconstruct only these exact CTA/context substitutions.
// This cannot hide a changed title, image, form, event, engine, style or extra link.
export function beforeQuote38(file,input) {
 let text=beforeNonvisual40(file,input);
 for(const [before,after] of edits38[file]||[]) text=text.replace(after,before);
 return text;
}
export function assertQuote38Source(file,current,baseline) {
 current=beforeNonvisual40(file,current);
 assert.equal(lf(current),expectedQuote38Source(file,baseline),file+': exact CTA38 delta only');
 assert.deepEqual(lf(current).match(/<form\b[\s\S]*?<\/form>/g),lf(baseline).match(/<form\b[\s\S]*?<\/form>/g),file+': embedded forms unchanged');
}
export function assertQuote38Sources(root) {
 const old=file=>readGitBlobBuffer(BASE_38,file,root).buffer.toString('utf8');
 for(const file of Object.keys(edits38)) assertQuote38Source(file,fs.readFileSync(path.join(root,file),'utf8'),old(file));
 for(const file of ['src/_includes/partials/marketing-components.njk','src/_includes/partials/site-header.njk','src/_includes/partials/site-footer.njk','src/_includes/partials/service-demo-form.njk','src/_includes/partials/measurement-bootstrap.njk','src/_data/serviceDemos.json','src/_data/measurement.json','js/site-shell.js','js/netlify-lead-form.js','js/service-demo-form.js','js/contattaci.js','js/configuratori-3d-2d.js','js/ad-attribution-consent.js','js/ga-autotrack.js','js/cookie-banner.js','css/foundation.css','css/site-shell.css','css/marketing-pages.css','css/contattaci.css','css/configuratori-3d-2d.css']) {
  assert.equal(beforeNonvisual40(file,fs.readFileSync(path.join(root,file),'utf8')),lf(old(file)),file+': task38 frozen except exact40');
 }
 return {result:'PASS',baseline:BASE_38,productFiles:9,demoForms:5,totalForms:6,enginesAndStyles:'UNCHANGED'};
}
const clean=s=>s.replace(/<span aria-hidden="true">[\s\S]*?<\/span>/g,'').replace(/<[^>]*>/g,'').replace(/&#39;|&#x27;/g,"'").replace(/\s+/g,' ').trim();
export function ctaLinks38(html) {
 return [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map(m=>({label:clean(m[2]),href:m[1]}));
}
export function ctaInventory38(route,html) {
 const header=html.match(/<header\b[\s\S]*?<\/header>/)?.[0]||'';
 const main=html.match(/<main\b[\s\S]*?<\/main>/)?.[0]||'';
 const opening=main.match(/<div class="cta-group">[\s\S]*?<\/div>/)?.[0]||'';
 const final=main.match(/<div class="final-cta">[\s\S]*?<\/div>/)?.[0]||'';
 return {route,header:ctaLinks38(header).filter(l=>l.label==='Parliamo del tuo progetto'||l.label===quote38.label),opening:ctaLinks38(opening),final:ctaLinks38(final)};
}
export function assertQuote38Html(route,html) {
 const row=ctaInventory38(route,html);
 assert.deepEqual(row.header,[quote38,quote38],route+': header and menu; exactly one each');
 const header=html.match(/<header\b[\s\S]*?<\/header>/)[0];
 assert.ok(ctaLinks38(header).some(l=>l.label==='Contatti'&&l.href==='/contattaci'));
 for(const link of ctaLinks38(html).filter(l=>l.label===quote38.label)) assert.deepEqual(link,quote38,'Single quote destination, no query/PII/UTM');
 if(route==='/') assert.deepEqual(row.opening,[quote38,{label:'Esplora le soluzioni',href:'#soluzioni'}]);
 if(serviceRoutes38.includes(route)) {
  assert.deepEqual(row.opening,[{label:'Richiedi una Demo gratuita',href:'#demo-form'},quote38],route+': two opening choices');
  assert.equal((html.match(/id="demo-form"/g)||[]).length,1);
  assert.equal((html.match(/<form\b/g)||[]).length,1,route+': only existing demo form');
  assert.match(html,/class="section-kicker">Richiesta demo<\/span>/);
 }
 if(finalRoutes38.includes(route)) assert.deepEqual(row.final,[quote38],route+': one final quote CTA');
 if(route==='/contattaci') {
  assert.equal((html.match(/id="contatti"/g)||[]).length,1);
  assert.match(html,/<span class="eyebrow">Contatti e preventivi<\/span>/);
  assert.match(html,/<div class="section-heading" id="contatti">\s*<span class="section-kicker">Richiesta di preventivo<\/span>\s*<h2 id="contact-form-title">Descrivi il progetto\.<\/h2>/);
  assert.equal(html.split(quoteContext38).length,2);
  assert.match(html,/<p>I campi contrassegnati con \* sono obbligatori\.<\/p>/);
  assert.match(html,/>Invia richiesta<\/button>/);
  assert.equal((html.match(/<form\b/g)||[]).length,1);
 }
 return row;
}
