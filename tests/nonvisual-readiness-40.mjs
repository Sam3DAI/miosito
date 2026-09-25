import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readGitBlobBuffer } from './git-binary-reader.mjs';
import { beforeNonvisual41 } from './nonvisual-closure-41.mjs';
import { beforeRetirement42 } from './legacy-retirement-42r1.mjs';
import { beforeGalleries44r2 } from './project-galleries-44r2.mjs';

export const BASE_40 = '608dc77bd70362a250a5d651e050c76966e8798a';
const root40 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lf = s => s.replace(/\r\n/g, '\n');
const hash = s => crypto.createHash('sha256').update(lf(s)).digest('hex');
// Hand-reviewed banner; behavior is independently exercised in cookie-runtime-40.
// Any further byte change must fail, not silently bypass the historical freeze.
export const banner40Sha256 = 'd067be2f222f1ef8b539f54da7d4b82e329a0e39a2e3fc27f5af7d2d82418304';
export const edits40 = Object.freeze({
  "src/contattaci.njk": [
    [
      "Accetto la <a href=\"/privacy-policy\" rel=\"nofollow\">Privacy Policy</a> *",
      "Ho letto l’<a href=\"/privacy-policy\" rel=\"nofollow\">informativa privacy</a> *"
    ]
  ],
  "src/configuratori-3d-2d.njk": [
    [
      "Accetto la <a href=\"/privacy-policy\" rel=\"nofollow\">Privacy Policy</a> *",
      "Ho letto l’<a href=\"/privacy-policy\" rel=\"nofollow\">informativa privacy</a> *"
    ]
  ],
  "src/_includes/partials/service-demo-form.njk": [
    [
      "Accetto la <a href=\"/privacy-policy\" rel=\"nofollow\">Privacy Policy</a> *",
      "Ho letto l’<a href=\"/privacy-policy\" rel=\"nofollow\">informativa privacy</a> *"
    ]
  ],
  "js/contattaci.js": [
    [
      "Accetta la Privacy Policy.",
      "Conferma di aver letto l’informativa privacy."
    ]
  ],
  "js/configuratori-3d-2d.js": [
    [
      "Accetta la Privacy Policy.",
      "Conferma di aver letto l’informativa privacy."
    ]
  ],
  "js/service-demo-form.js": [
    [
      "Per inviare la richiesta, accetta la Privacy Policy.",
      "Conferma di aver letto l’informativa privacy."
    ]
  ],
  "src/privacy-policy.njk": [
    [
      "Privacy Policy | SolveX AI3D - Protezione Dati GDPR",
      "Informativa privacy e cookie | SolveX AI3D"
    ],
    [
      "Informativa sulla privacy di SolveX AI3D: come raccogliamo, usiamo e proteggiamo i tuoi dati personali in conformità al GDPR. Dettagli su cookie, Google Analytics (su consenso), Google Ads (su consenso) e chatbot.",
      "Informazioni sui dati trattati tramite il sito SolveX AI3D, sui moduli di contatto e demo e sulla gestione delle preferenze statistiche e pubblicitarie."
    ],
    [
      "Scopri come SolveX AI3D gestisce i tuoi dati personali in conformità al GDPR. Analytics e Ads solo previo consenso.",
      "Informazioni sui dati trattati tramite il sito SolveX AI3D, sui moduli di contatto e demo e sulla gestione delle preferenze statistiche e pubblicitarie."
    ],
    [
      "Informativa sulla privacy conforme al GDPR.",
      "Informazioni sui dati trattati tramite il sito SolveX AI3D, sui moduli di contatto e demo e sulla gestione delle preferenze statistiche e pubblicitarie."
    ],
    [
      "Informativa sulla privacy conforme al GDPR per SolveX AI3D. Analytics/Ads solo previo consenso.",
      "Informazioni sui dati trattati tramite il sito SolveX AI3D, sui moduli di contatto e demo e sulla gestione delle preferenze statistiche e pubblicitarie."
    ],
    [
      "<li><strong>Dati forniti volontariamente</strong> (es. nome, email, telefono, contenuto messaggio) tramite form di contatto.</li>",
      "<li><strong>Dati forniti volontariamente</strong>: i moduli di contatto e richiesta demo raccolgono nome, email, messaggio e informazioni sul servizio o progetto richiesto. Il modulo Contatti prevede un telefono facoltativo; i moduli demo prevedono un sito web o riferimento facoltativo. Ai sei moduli principali sono associati il nome del modulo, la pagina di provenienza e, quando JavaScript è disponibile, un identificatore della richiesta. È presente un campo tecnico anti-spam. I campi obbligatori sono contrassegnati con un asterisco.</li>"
    ],
    [
      "<li><strong>Analytics</strong>: conservazione eventi/rapporti tipicamente fino a <strong>14 mesi</strong> (impostazioni GA4), solo se hai dato consenso.</li>",
      "<li><strong>Analytics</strong>: la conservazione dei dati a livello di utente ed evento dipende dalle impostazioni GA4. Questa impostazione non determina la durata dei report aggregati standard.</li>"
    ],
    [
      "<p>I dati possono essere trattati da fornitori che agiscono come responsabili esterni, tra cui:</p>",
      "<p>I sei moduli principali utilizzano Netlify Forms per la gestione delle richieste. Il modulo presente nella pagina storica Chatbot AI utilizza invece Formsubmit, finché quel percorso rimane attivo. Alcune immagini e risorse del sito sono distribuite tramite Cloudinary e altri servizi tecnici indicati nell’inventario.</p>"
    ],
    [
      "<li><strong>Formsubmit.co</strong> (gestione invio form)</li>",
      "<li><strong>Netlify Forms</strong> (sei moduli principali)</li>\n        <li><strong>Formsubmit.co</strong> (modulo della pagina storica Chatbot AI)</li>"
    ],
    [
      "<h2>8. Cookie e Preferenze</h2>",
      "<h2 id=\"cookie-storage\">8. Cookie e Preferenze</h2>\n      <p>Il sito utilizza anche la memoria locale del browser per il tema e le preferenze Statistiche e Marketing. I moduli principali impiegano la memoria di sessione per identificatori tecnici delle richieste confermate dal client e, in relazione alla preferenza Marketing, per parametri di attribuzione pubblicitaria. Le preferenze del banner sono separate dall’invio di una richiesta tramite modulo.</p>"
    ]
  ],
  "src/termini-condizioni.njk": [
    [
      "termini e condizioni sito web, regole uso servizi AI 3D, contratto e-commerce configuratori, GDPR compliance 2025",
      "termini di utilizzo sito web, configuratori 3D/2D, automazioni AI, servizi su misura"
    ]
  ],
  "src/_includes/partials/site-footer.njk": [
    [
      "          <li><a href=\"/termini-condizioni\"{% if pageKey == \"terms\" %} aria-current=\"page\"{% endif %}>Termini</a></li>\n",
      "          <li><a href=\"/termini-condizioni\"{% if pageKey == \"terms\" %} aria-current=\"page\"{% endif %}>Termini</a></li>\n          <li><button type=\"button\" class=\"cookie-preferences-control\" data-cookie-preferences>Preferenze privacy e cookie</button></li>\n"
    ]
  ],
  "css/cookie-banner.css": [
    [
      "/* Mobile */",
      "/* Controlli privacy accessibili, senza cambiare palette o struttura del sito. */\n.cc-window { max-height: calc(100dvh - 40px); overflow-y: auto; }\n.cc-switch { pointer-events: none; }\n.cc-pref-switch input:focus-visible + .cc-switch,\n.cc-revoke:focus-visible,\n.cookie-preferences-control:focus-visible { outline: 2px solid #45b6fe; outline-offset: 3px; }\n.cookie-preferences-control { padding: 0; border: 0; background: none; color: inherit; font: inherit; text-align: left; text-decoration: underline; cursor: pointer; }\n.cc-status { font-size: 12px; line-height: 1.4; }\n.cc-status:empty { display: none; }\n\n/* Mobile */"
    ]
  ]
});
export const changedProduct40 = Object.freeze(['js/cookie-banner.js', ...Object.keys(edits40)]);
export function beforeNonvisual40(file, input) {
  let text = beforeRetirement42(file, beforeNonvisual41(file, beforeGalleries44r2(file, input)));
  if (file === 'js/cookie-banner.js' && hash(text) === banner40Sha256) return lf(readGitBlobBuffer(BASE_40, file, root40).buffer.toString('utf8'));
  for (const [before, after] of edits40[file] || []) text = text.replace(after, before);
  return text;
}
export function expectedNonvisual40(file, old) {
  let text = lf(old);
  for (const [before, after] of edits40[file] || []) {
    assert.equal(text.split(before).length, 2, file + ': unique approved replacement');
    text = text.replace(before, after);
  }
  return text;
}
export function assertNonvisual40Sources(root) {
  for (const file of changedProduct40) {
    const current = beforeRetirement42(file, beforeNonvisual41(file, beforeGalleries44r2(file, fs.readFileSync(path.join(root,file), 'utf8'))));
    if (file === 'js/cookie-banner.js') assert.equal(hash(current), banner40Sha256, 'Only reviewed banner40');
    else assert.equal(current, expectedNonvisual40(file, readGitBlobBuffer(BASE_40,file,root).buffer.toString('utf8')), file + ': only exact authorized40 changes');
  }
  for (const file of ['js/netlify-lead-form.js','js/ad-attribution-consent.js','js/site-shell.js','js/ga-autotrack.js','src/_includes/partials/measurement-bootstrap.njk','src/_includes/partials/cookie-loader.njk','src/_data/measurement.json','src/_data/serviceDemos.json','chatbot-ai-intelligenti.html','siti-web-custom-seo.html']) {
    assert.equal(lf(fs.readFileSync(path.join(root,file),'utf8')), lf(readGitBlobBuffer(BASE_40,file,root).buffer.toString('utf8')), file+': task40 immutable');
  }
  return {result:'PASS',baseline:BASE_40,productFiles:changedProduct40.length,oldPolicyPreserved:true,newConsentMetadata:false};
}
export function beforePrivacy40Html(html) {
  // Same exact public blocks, including metadata. No arbitrary content stripping.
  return beforeNonvisual40('src/privacy-policy.njk',html);
}
export function assertNonvisual40Html(route, html) {
  assert.equal((html.match(/data-cookie-preferences/g)||[]).length,1,route+': one shared footer control');
  if (/<input[^>]*name="privacy"/.test(html)) {
    assert.equal((html.match(/Ho letto l’<a href="\/privacy-policy" rel="nofollow">informativa privacy<\/a> \*/g)||[]).length,1,route+': acknowledgement only');
  }
  assert.doesNotMatch(html,/OWNER_FACT_REQUIRED|LEGAL_REVIEW_REQUIRED|PRIVACY_FINALIZATION|OWNER_DECISIONS_AND_QA|cookie-runtime-40/);
}
