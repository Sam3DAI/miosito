import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {docs50,beforeDocs50,afterDocs50,assertDocs50Delta,assertDocs50Sources} from './docs-50-literals.mjs';
import {readGitBlobBuffer} from './git-binary-reader.mjs';

const root=fileURLToPath(new URL('..',import.meta.url));
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8').replaceAll('\r\n','\n');
const privacy=read('src/privacy-policy.njk'),terms=read('src/termini-condizioni.njk');
const requireAll=(text,literals)=>{for(const literal of literals)assert(text.includes(literal),literal);};

function assertPrivacyFacts(text) {
  requireAll(text,[
    '12 ottobre 2026','Samuele Peron','unico operatore umano','P. IVA 04930620275',
    'Via della Cerva, 68A, 30033 Noale (VE)','Zoho Mail nel piano gratuito',
    'lead_id','lead_source','non rende anonimi','non attesta il recapito di un’email',
    'non è un consenso all’invio di promozioni','Puoi rifiutare Statistiche e Marketing e inviare comunque',
    'Richieste di una persona che può diventare parte del contratto',
    'quando il referente non è personalmente parte del contratto',
    'art. 6, par. 1, lett. b GDPR','art. 6, par. 1, lett. f GDPR',
    'art. 6, par. 1, lett. a GDPR','art. 6, par. 1, lett. c GDPR',
    'ragionevoli aspettative e del diritto di opposizione',
    'non autorizza automaticamente comunicazioni promozionali',
    'non comporta di per sé l’invio dei messaggi dei moduli a un sistema di intelligenza artificiale',
    'criterio definito per il futuro','massimo di 24 mesi dall’ultimo scambio sostanziale',
    'rimozione anticipata','riesame mensile','notifiche tecniche non rinnovano questo termine',
    'il calendario e il primo riesame dei due archivi non sono ancora stati avviati',
    'non viene quindi attestata una cancellazione già effettuata dei dati storici',
    'non estendono automaticamente la conservazione di ogni richiesta o email',
    'una classificazione antispam non dimostra da sola','non prova la cancellazione immediata di ogni backup',
    'non equivale alla cancellazione delle richieste eventualmente ricevute in passato',
    'contratto Self-Serve pertinente al piano utilizzato',
    'questa informativa non attesta la sottoscrizione di un accordo individuale',
    'termini del piano Free','Non viene esteso automaticamente al piano gratuito l’accordo Enterprise',
    'Il ruolo del fornitore dipende dal trattamento','Google Ireland Limited',
    'data center Europe; questo non esclude accessi autorizzati di supporto da altri Paesi',
    'Un meccanismo non si applica indistintamente a ogni flusso',
    'non avvia il caricamento degli strumenti Google di misurazione',
    'subordinato alla scelta di almeno una categoria facoltativa',
    'ad_personalization=denied','un precedente assenso non viene riutilizzato automaticamente',
    'un rifiuto già registrato viene rispettato','la scelta vale soltanto per la pagina corrente',
    'senza ricaricare la pagina o cancellare i campi già compilati',
    'Non può cancellare cookie di domini terzi né annullare trasmissioni già avvenute',
    'non vengono riproposte retroattivamente come eventi di misurazione',
    'id="manage-cookies"','id="cookie-storage"'
  ]);
  assert.doesNotMatch(text,/DPA Zoho (?:firmato|sottoscritto)|tutti i dati (?:restano|sono) (?:in|nell[’'])UE|monitor (?:è )?attivo|cancellazione automatica mensile|conformità (?:garantita|certificata)|IP troncato|Marketing\/Remarketing|14 mesi|10 anni|90 giorni|30 giorni|TODO|TBD|placeholder|bozza da approvare/i);
  assert.doesNotMatch(text,/anche prima della scelta nel banner|nessun dato personale viene|nessun dato trasmesso|sempre sicuro/);
  for(const url of [
    'https://www.netlify.com/pdf/netlify-dpa.pdf','https://www.zoho.com/privacy/privacy-faq.html',
    'https://cloudinary.com/tou','https://cloudinary.com/privacy',
    'https://marketingplatform.google.com/about/analytics/terms/it/',
    'https://business.safety.google/adsdatatransfers/','https://www.garanteprivacy.it'
  ])assert(text.includes('href="'+url+'"'),url);
  assert.equal((text.match(/<h2(?:\s[^>]*)?>/g)||[]).length,10);
  assert.doesNotMatch(text,/<form\b|name="email"|<iframe\b|<script[^>]+src=/i);
}
function assertTermsFacts(text) {
  requireAll(text,[
    '12 ottobre 2026','Samuele Peron','unico operatore umano','P. IVA 04930620275',
    'Via della Cerva, 68A, 30033 Noale (VE)','info@solvex-ai3d.com',
    'non un ordine, un pagamento o l’accettazione di un incarico',
    'prezzi e carrello sono dimostrativi: non generano ordini né pagamenti',
    'non costituiscono recensioni o promesse di risultati',
    'Restano fermi i diritti e le responsabilità previsti dalle norme applicabili',
    'desktop e tablet idonei','Su smartphone viene mostrata un’anteprima',
    'senza avviare il motore 3D della demo',
    'non equivalgono alla disponibilità di una demo pubblica interattiva',
    'La presa visione richiesta nei moduli non costituisce consenso promozionale',
    'Le dimostrazioni locali non autorizzano operazioni nei sistemi dei clienti'
  ]);
  assert.doesNotMatch(text,/Foro competente esclusivo|implica accettazione|“as is”|Analytics\/Ads sono attivati solo|esonero totale|nessuna responsabilità|TODO|TBD|placeholder|bozza da approvare/i);
  assert.equal((text.match(/<h2(?:\s[^>]*)?>/g)||[]).length,9);
  assert.doesNotMatch(text,/<form\b|name="email"|<iframe\b|<script[^>]+src=/i);
}

test('50 privacy/terms exact map preserves identities, metadata, layout and all text outside five reviewed hunks',()=>{
  assertDocs50Sources(root);
  for(const [file,edits] of Object.entries(docs50.edits)) {
    const baseline=readGitBlobBuffer(docs50.baseline,file,root).buffer.toString('utf8').replaceAll('\r\n','\n');
    const current=read(file);assert.equal(current,afterDocs50(file,baseline));assert.equal(beforeDocs50(file,current),baseline);
    assert.equal(current.slice(0,current.indexOf('{% block content %}')),baseline.slice(0,baseline.indexOf('{% block content %}')));
    for(const edit of edits)for(const mutation of ['',edit.before,edit.after+edit.after])assert.throws(()=>assertDocs50Delta(file,current.replace(edit.after,mutation),baseline));
    for(const mutation of [current+'\n<!-- OUT_OF_SCOPE -->',current.replace('contain-intrinsic-size:','UNREVIEWED:'),current.replace('04930620275','00000000000')]) {
      assert.throws(()=>assertDocs50Delta(file,mutation,baseline));assert.notEqual(beforeDocs50(file,mutation),baseline);
    }
  }
  assert.throws(()=>assertDocs50Delta('src/index.njk','not in scope','not in scope'));
});
test('50 privacy is a complete factual notice: B2B bases, future retention and actual supplier/cookie limits',()=>assertPrivacyFacts(privacy));
test('50 terms preserve rights and distinguish real projects, synthetic demo cart and smartphone availability',()=>assertTermsFacts(terms));
test('50 negatives reject assumed adoption, signed agreements, EU-only data, active monitor and anonymous claims',()=>{
  for(const [from,to] of [
    ['non sono ancora stati avviati','sono già attivi'],
    ['notifiche tecniche non rinnovano questo termine','ogni apertura rinnova questo termine'],
    ['criterio definito per il futuro','procedura applicata da sempre'],
    ['non attesta la sottoscrizione di un accordo individuale','attesta il DPA Zoho sottoscritto'],
    ['Non viene esteso automaticamente al piano gratuito l’accordo Enterprise','Il piano Free usa automaticamente il DPA Enterprise'],
    ['questo non esclude accessi autorizzati di supporto da altri Paesi','tutti i dati restano in UE'],
    ['non rende anonimi','rende anonimi'],
    ['quando il referente non è personalmente parte del contratto','tutti i trattamenti hanno la stessa base contrattuale'],
    ['un rifiuto già registrato viene rispettato','i rifiuti precedenti vengono cancellati'],
    ['non vengono riproposte retroattivamente come eventi di misurazione','vengono riproposte dopo il consenso']
  ]) {assert(privacy.includes(from));assert.throws(()=>assertPrivacyFacts(privacy.replace(from,to)),to);}
  for(const claim of ['Il monitor è attivo.','La cancellazione automatica mensile è attiva.','I log sono conservati 90 giorni.','Conformità certificata.'])assert.throws(()=>assertPrivacyFacts(privacy+'\n<p>'+claim+'</p>'));
});
test('50 negative terms reject actual ordering, smartphone engine or public CPQ/planner claims',()=>{
  for(const [from,to] of [
    ['non generano ordini né pagamenti','generano ordini e pagamenti'],
    ['senza avviare il motore 3D della demo','avviando il motore 3D della demo'],
    ['non equivalgono alla disponibilità di una demo pubblica interattiva','sono demo pubbliche interattive complete'],
    ['Restano fermi i diritti e le responsabilità previsti dalle norme applicabili','SolveX non ha nessuna responsabilità']
  ]) {assert(terms.includes(from));assert.throws(()=>assertTermsFacts(terms.replace(from,to)),to);}
});
