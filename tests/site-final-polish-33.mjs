import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { readGitBlobBuffer } from "./git-binary-reader.mjs";
import { beforeReadiness36 } from "./launch-readiness-36.mjs";
import { beforeQuote38 } from "./quote-cta-38.mjs";
import { beforeCleanImages43 } from "./clean-images-43.mjs";
import { beforeGalleries44r2 } from "./project-galleries-44r2.mjs";

export const BASE_33 = "fb2f1b919f40c0dc50b787b38759bb60080ab3c0";
const lf = text => text.replace(/\r\n/g, "\n");
const read = (root, file) => beforeQuote38(file, beforeCleanImages43(file, fs.readFileSync(path.join(root, file), "utf8")));
const oldIntro = "Parti da chi userà il sistema e dal risultato che deve ottenere: personalizzare un acquisto, preparare un’offerta o comporre un ambiente.";
const newIntro = "Le soluzioni che proponiamo sono sempre progettate attorno al tuo processo reale.";
const paragraph = "        <p>SolveX mantiene un referente chiaro e la responsabilità diretta delle decisioni dall’analisi al rilascio.</p>\n";
const metaSync = `    // Keep the browser color hint aligned with an explicit site preference,
    // including the legacy-owned lead-page path. No second toggle listener.
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (meta) {
      meta.setAttribute("content", theme === "dark" ? "#000000" : "#f5f5f7");
    });
`;
const bootstrapSync = `        document.querySelectorAll('meta[name="theme-color"]').forEach(function (meta) {
          meta.setAttribute('content', savedTheme === 'dark' ? '#000000' : '#f5f5f7');
        });
`;
const motionPattern = /  \/\/ Progressive editorial motion:[\s\S]*?\n  \}\)\(\);\n\n(?=  const siteMenu =)/;
const homeCssPattern = /\/\* Home-only composition\.[\s\S]*?\n\}\n(?=\.capability-strip \{ gap:)/;

// Reconstruct only the owner-authorized task33 changes when applying historical
// task32 guards. All other text/metadata/menu/rail code must still compare exactly.
export function beforePolish33(file, input) {
  let text = beforeReadiness36(file, beforeGalleries44r2(file, input));
  if (file === "js/site-shell.js") return text.replace(metaSync, "").replace(motionPattern, "");
  if (file === "src/_data/navigation.json") return text.replace('"label": "Configuratori",', '"label": "Configuratori 2D/3D",');
  if (file === "src/configuratori-3d-2d.njk") return text.replace("breadcrumbLabel: Configuratori\n", "breadcrumbLabel: Configuratori 2D/3D\n").replace(newIntro, oldIntro);
  return text;
}

export function assertPolish33Sources(root) {
  const baseline = file => lf(readGitBlobBuffer(BASE_33, file, root).buffer.toString("utf8"));
  const home = "src/index.njk";
  let expected = baseline(home)
    .replace('>2D / 3D</span>', '>Configurazione prodotto</span>')
    .replace('Esplora i configuratori 2D/3D ', 'Esplora i configuratori ')
    .replace('class="split-panel split-panel--statement"', 'class="split-panel split-panel--statement split-panel--home-collaboration"')
    .replace('class="container split-panel split-panel--statement"', 'class="container split-panel split-panel--statement split-panel--home-custom"');
  const collaboration = expected.match(/<section[^>]*aria-labelledby="direct-title"[\s\S]*?<\/section>/)[0];
  expected = expected.replace(collaboration, collaboration.replace(paragraph, "").replace('      <div class="split-panel__body">\n', '      <div class="split-panel__body">\n' + paragraph));
  assert.equal(read(root, home), expected, "Home: only two labels, two modifiers and exact paragraph relocation");
  const hub = "src/configuratori-3d-2d.njk";
  expected = baseline(hub).replace("breadcrumbLabel: Configuratori 2D/3D\n", "breadcrumbLabel: Configuratori\n")
    .replace('        <h2>Per e-commerce, rete commerciale, arredamento e molto altro. Sia <span class="gradient-text">2D che 3D con AR</span>.</h2>\n', "")
    .replace(oldIntro, newIntro);
  assert.equal(beforeReadiness36(hub, read(root, hub)), expected, "Hub: task33 exact intro plus task36 exact privacy default exception");
  const nav = "src/_data/navigation.json";
  assert.equal(beforePolish33(nav, read(root,nav)), baseline(nav), "Only general-service navigation label changes");
  const seo = "src/_includes/partials/seo-head.njk";
  assert.equal(read(root,seo), baseline(seo).replace('name="theme-color" content="#fafafa"', 'name="theme-color" content="#f5f5f7"'), "SEO untouched except display color hint");
  const bootstrap = "src/_includes/partials/theme-bootstrap.njk";
  assert.equal(read(root,bootstrap), baseline(bootstrap).replace("        document.documentElement.dataset.theme = savedTheme;\n", "        document.documentElement.dataset.theme = savedTheme;\n" + bootstrapSync));
  const shell = read(root,"js/site-shell.js");
  assert.equal(shell.split(metaSync).length,2,"Exactly one shared meta sync");
  assert.ok(motionPattern.test(shell),"Bounded editorial initializer present");
  assert.equal(beforePolish33("js/site-shell.js",shell),baseline("js/site-shell.js"),"Theme ownership, menu, focus, anchors and carousel remain exact outside two additions");
  const marketing = read(root,"css/marketing-pages.css");
  const addedCss = marketing.match(homeCssPattern)?.[0];
  assert.ok(addedCss,"Home-only CSS block present");
  assert.doesNotMatch(addedCss,/font-size|line-height|letter-spacing|position:\s*absolute|padding/);
  assert.match(addedCss,/@media \(min-width: 75rem\)/);
  assert.match(addedCss,/grid-template-columns: minmax\(0, 1\.15fr\) minmax\(0, 1fr\)/);
  assert.equal(marketing.replace(homeCssPattern,""),baseline("css/marketing-pages.css"),"All other CSS including card geometry/hover is exact");
  for(const file of ["css/foundation.css","css/site-shell.css","css/configuratori-3d-2d.css","css/contattaci.css","js/configuratori-3d-2d.js","js/contattaci.js","js/netlify-lead-form.js","js/ad-attribution-consent.js","js/service-demo-form.js","src/_data/serviceDemos.json","src/_data/measurement.json","src/_includes/partials/service-demo-form.njk","src/_includes/layouts/base.njk","src/_includes/partials/site-header.njk","src/_includes/partials/site-footer.njk","src/_includes/partials/marketing-components.njk","src/privacy-policy.njk","src/termini-condizioni.njk"]) {
    assert.equal(read(root,file),baseline(file),file+" task33 unchanged");
  }
  return {result:"PASS",baseline:BASE_33,productionSourceFiles:7,leadAnd3D:"BYTE_EQUIVALENT_LF",layout:"HOME_ONLY",tracking:"UNCHANGED_OUT_OF_SCOPE"};
}

export function assertPolish33Html(route, html) {
  assert.match(html,/<meta name="theme-color" content="#f5f5f7" media="\(prefers-color-scheme: light\)">/);
  if(route === "/") {
    const section=html.match(/<section[^>]*aria-labelledby="direct-title"[\s\S]*?<\/section>/)[0];
    assert.doesNotMatch(section.match(/<div class="split-panel__lead">[\s\S]*?<\/div>/)[0],/<p>/);
    assert.match(section,/<div class="split-panel__body">\s*<p>SolveX mantiene[\s\S]*?<ul class="check-list">/);
    assert.match(html,/>Configurazione prodotto<\/span>/);
    assert.match(html,/Esplora i configuratori <span aria-hidden="true">/);
  }
  if(route === "/configuratori-3d-2d") {
    const intro=html.match(/<div class="configurator-introduction editorial-inset" id="intro-benefits">[\s\S]*?(?=<div class="section-heading rail-heading">)/)?.[0];
    assert.ok(intro,"The preserved inset introduction and anchor exist");
    assert.equal((intro.match(/<p>/g)||[]).length,2);
    assert.doesNotMatch(intro,/<h[1-6]\b/);
    assert.ok(intro.includes(newIntro));
    assert.match(html,/<h2 id="scenario-title">/);
    assert.match(intro,/href="#demo-form"/);
    assert.match(intro,/href="\/contattaci#contatti"/);
  }
}
