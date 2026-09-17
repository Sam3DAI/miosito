import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {readGitBlobBuffer,runGitText,hashFileWithGitFilters} from './git-binary-reader.mjs';
export const BASE_42='12392f74c007c597394abf864bc4dc31484c8e2f';
export const retired42=Object.freeze([
  "chatbot-ai-intelligenti.html",
  "chatbot/css/main.9ba5c9e2.css",
  "chatbot/css/main.9ba5c9e2.css.map",
  "chatbot/js/main.996591d1.js",
  "chatbot/js/main.996591d1.js.LICENSE.txt",
  "chatbot/js/main.996591d1.js.map",
  "css/chatbot-ai-intelligenti.css",
  "css/siti-web-custom-seo.css",
  "js/chatbot-ai-intelligenti.js",
  "js/siti-web-custom-seo.js",
  "siti-web-custom-seo.html"
]);
export const edits42=Object.freeze({
  "src/privacy-policy.njk": [
    [
      "cookie, Google Analytics, chatbot, consenso",
      "cookie, Google Analytics, consenso"
    ],
    [
      "<p><strong>SolveX AI3D</strong> – Via",
      "<p><strong>Samuele Peron, operante con il marchio SolveX AI3D</strong> – Via"
    ],
    [
      "        <li><strong>Interazioni con chatbot</strong>: le conversazioni sono elaborate per fornire assistenza; non conserviamo una cronologia permanente sul sito.</li>\n        <li><strong>Cookie e tecnologie simili</strong>",
      "        <li><strong>Cookie e tecnologie simili</strong>"
    ],
    [
      "        <li><strong>Analytics</strong>: la conservazione dei dati a livello di utente ed evento dipende dalle impostazioni GA4. Questa impostazione non determina la durata dei report aggregati standard.</li>\n        <li><strong>Chatbot</strong>: nessuna conservazione permanente lato sito; eventuali log temporanei lato fornitore per finalità tecniche.</li>\n      </ul>",
      "        <li><strong>Analytics</strong>: la conservazione dei dati a livello di utente ed evento dipende dalle impostazioni GA4. Questa impostazione non determina la durata dei report aggregati standard.</li>\n      </ul>"
    ],
    [
      "I sei moduli principali utilizzano Netlify Forms per la gestione delle richieste. Il modulo presente nella pagina storica Chatbot AI utilizza invece Formsubmit, finché quel percorso rimane attivo. Alcune immagini e risorse del sito sono distribuite tramite Cloudinary e altri servizi tecnici indicati nell’inventario.",
      "I moduli di contatto e richiesta demo utilizzano Netlify Forms per la gestione delle richieste. La corrispondenza della casella info@solvex-ai3d.com è gestita tramite Zoho Mail. Alcune immagini e risorse del sito sono distribuite tramite Cloudinary e altri servizi tecnici utilizzati per il suo funzionamento."
    ],
    [
      "        <li><strong>Formsubmit.co</strong> (modulo della pagina storica Chatbot AI)</li>",
      "        <li><strong>Zoho Mail</strong> — gestione della posta elettronica aziendale</li>"
    ],
    [
      "        <li>fornitore del <strong>chatbot</strong> (<code>chatbot.solvex-chatbot.xyz</code>)</li>\n        <li>società di hosting/infrastruttura e manutenzione IT</li>",
      "        <li>società di hosting/infrastruttura e manutenzione IT</li>"
    ]
  ],
  "src/termini-condizioni.njk": [
    [
      "Termini e Condizioni di SolveX AI3D: regole per l'uso del sito e dei servizi digitali come configuratori 3D/2D, automazioni AI, siti custom e chatbot.",
      "Termini e Condizioni di SolveX AI3D: regole per l'uso del sito e dei servizi di configurazione di prodotto 2D/3D, configuratori e-commerce, CPQ e portali commerciali, planner per arredamento e automazioni AI."
    ],
    [
      "SolveX AI3D (configuratori 3D/2D, automazioni AI, siti web custom, chatbot).",
      "SolveX AI3D (configuratori di prodotto 2D/3D, configuratori e-commerce, CPQ e portali commerciali, planner per arredamento e automazioni AI)."
    ]
  ],
  "404.html": [
    [
      "href=\"css/404.css\"",
      "href=\"/css/404.css\""
    ],
    [
      "src=\"js/404.js\"",
      "src=\"/js/404.js\""
    ]
  ],
  "sitemap.xml": [
    [
      "  <url>\n    <loc>https://solvex-ai3d.com/chatbot-ai-intelligenti</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.4</priority>\n  </url>\n  <url>\n    <loc>https://solvex-ai3d.com/siti-web-custom-seo</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.4</priority>\n  </url>\n</urlset>",
      "</urlset>"
    ]
  ],
  "eleventy.config.js": [
    [
      "  \"404.html\",\n  \"_redirects\",",
      "  \"_redirects\","
    ],
    [
      "  \"chatbot-ai-intelligenti.html\",\n",
      ""
    ],
    [
      "  \"chatbot/css/main.9ba5c9e2.css\",\n",
      ""
    ],
    [
      "  \"chatbot/css/main.9ba5c9e2.css.map\",\n",
      ""
    ],
    [
      "  \"chatbot/js/main.996591d1.js\",\n",
      ""
    ],
    [
      "  \"chatbot/js/main.996591d1.js.LICENSE.txt\",\n",
      ""
    ],
    [
      "  \"chatbot/js/main.996591d1.js.map\",\n",
      ""
    ],
    [
      "  \"css/chatbot-ai-intelligenti.css\",\n",
      ""
    ],
    [
      "  \"css/siti-web-custom-seo.css\",\n",
      ""
    ],
    [
      "  \"js/chatbot-ai-intelligenti.js\",\n",
      ""
    ],
    [
      "  \"js/siti-web-custom-seo.js\",\n",
      ""
    ],
    [
      "  \"robots.txt\",\n  \"siti-web-custom-seo.html\"",
      "  \"robots.txt\""
    ],
    [
      "export const OWNED_STATIC_FILES = Object.freeze([\n",
      "export const OWNED_STATIC_FILES = Object.freeze([\n  \"404.html\",\n"
    ]
  ]
});
const lf=s=>s.replace(/\r\n/g,'\n');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
export function expectedRetirement42(file,old) {
 let text=lf(old);
 for(const [before,after] of edits42[file]||[]) {
  assert.equal(text.split(before).length,2,file+': unique approved42 replacement');
  text=text.replace(before,after);
 }
 return text;
}
// Reverse only literal approved legal blocks. No broad sanitizer or deleted test.
export function beforeRetirement42(file,input) {
 let text=lf(input);
 if(!['src/privacy-policy.njk','src/termini-condizioni.njk'].includes(file)) return text;
 for(const [before,after] of [...edits42[file]].reverse()) {
  if(text.includes(after)) text=text.replace(after,before);
  // Nunjucks escapes the apostrophe in the description attribute only.
  if(file==='src/termini-condizioni.njk' && after.startsWith('Termini e Condizioni di SolveX AI3D:')) {
   text=text.replace(after.replaceAll("'",'&#39;'),before.replaceAll("'",'&#39;'));
  }
 }
 return text;
}
export function assertExactRetirement42(file,current,old) {
 assert.equal(lf(current),expectedRetirement42(file,old),file+': only authorized42 edits');
}
export function assertRetirement42Sources(root) {
 for(const file of Object.keys(edits42)) {
  assertExactRetirement42(file,fs.readFileSync(path.join(root,file),'utf8'),readGitBlobBuffer(BASE_42,file,root).buffer.toString('utf8'));
 }
 const changes=runGitText(['diff','--name-only',BASE_42,'--'],root).trim().split('\n').filter(Boolean);
 for(const file of changes) assert.ok(Object.hasOwn(edits42,file)||file.startsWith('tests/')||file==='netlify.toml',file+': outside42 product allowlist');
 // Header41 separately enforces the sole staging noindex difference.
 const sources=retired42.map(file=>{
  const old=readGitBlobBuffer(BASE_42,file,root);
  assert.equal(hashFileWithGitFilters(file,file,root),old.objectId,file+': retired source Git blob preserved');
  return {file,blob:old.objectId,gitBytes:old.buffer.length,gitSha256:sha(old.buffer),worktreeSha256:sha(fs.readFileSync(path.join(root,file))),publish:'EXCLUDED'};
 });
 return {result:'PASS',baseline:BASE_42,sources,coreLead3D:'UNCHANGED',formCount:6};
}
const retiredSlugs=['chatbot-ai-intelligenti','siti-web-custom-seo'];
export function assertRetirement42Output(files) {
 assert.ok(files instanceof Map,'Output must be a path/content map');
 for(const name of retired42) assert.equal(files.has(name),false,name+': retired output');
 for(const [name,buffer] of files) {
  assert.doesNotMatch(name,/(?:^|\/)(?:src|tests|node_modules|\.git|reference|reports?|_site)(?:\/|$)|\.(?:zip|njk)$/i,name+': publish boundary');
  if(!/\.(?:html|js|css|xml)$/.test(name)) continue;
  const text=String(buffer);
  for(const slug of retiredSlugs) assert.ok(!text.includes(slug),name+': retired route/reference');
  assert.doesNotMatch(text,/formsubmit\.co|chatbot\.solvex-chatbot\.xyz|\/chatbot\/(?:js|css)\/|main\.996591d1|main\.9ba5c9e2/i,name+': retired executable path');
  if(name.endsWith('.html')) {
   assert.doesNotMatch(text,/<[^>]+\bid=["']root["']|\bid=["']open-chatbot(?:-why)?["']|<script[^>]+apexcharts/i,name+': retired runtime mount/loader');
  }
 }
 const sitemap=String(files.get('sitemap.xml'));
 assert.equal((sitemap.match(/<loc>/g)||[]).length,10,'Exactly ten sitemap entries');
 const error=String(files.get('404.html'));
 assert.match(error,/href="\/css\/404.css"/);
 assert.match(error,/src="\/js\/404.js"/);
 assert.doesNotMatch(error,/<form|http-equiv=["']refresh|googletagmanager|canonical/i);
 const forms=[...files].filter(([f])=>f.endsWith('.html')).flatMap(([f,b])=>[...String(b).matchAll(/<form\b[^>]*data-netlify=["']true["'][^>]*>/g)].map(m=>m[0].match(/\bname=["']([^"']+)["']/)?.[1])).sort();
 assert.deepEqual(forms,['contact-main','demo-automazioni-ai','demo-configuratori-ecommerce','demo-cpq-portali','demo-planner-arredamento','mini-demo-configuratori']);
 return {result:'PASS',excluded:retired42.length,sitemap:10,forms:6};
}
export function assertRetiredResponse42(requestUrl,hops) {
 const first=new URL(requestUrl),family=first.pathname.replace(/\.html$|\/$/g,'');
 assert.ok(retiredSlugs.some(slug=>family==='/'+slug),'Retired family required');
 assert.ok(hops.length>=1&&hops.length<=2,'At most one provider normalization');
 for(const [i,hop] of hops.entries()) {
  const u=new URL(hop.url);
  assert.equal(u.origin,first.origin,'Same origin');
  assert.equal(u.pathname.replace(/\.html$|\/$/g,''),family,'Same retired family');
  if(i===hops.length-1) {assert.equal(hop.status,404,'True404, never a soft200');assert.ok(!hop.location,'No redirect on terminal404');}
  else {assert.ok([301,302,307,308].includes(hop.status));assert.ok(hop.location);assert.equal(new URL(hop.location,u).href,hops[i+1].url);}
 }
 return {result:'PASS',status:404,normalizations:hops.length-1};
}
