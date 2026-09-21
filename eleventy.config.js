import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export const TASK_BASE_COMMIT = "353a9cfa55dde08c8093e4455e821c08d88ab849";
export const BASE_COMMIT = TASK_BASE_COMMIT;

export const FROZEN_PASSTHROUGH_FILES = Object.freeze([
  "_redirects",
  "assets/iphone_16_pro_configuratore_3d.glb",
  "css/404.css",
  "css/automazioni-ai-business.css",
  "css/index.css",
  "css/privacy-policy.css",
  "css/termini-condizioni.css",
  "favicon-32.png",
  "favicon.ico",
  "js/404.js",
  "js/ad-attribution-consent.js",
  "js/automazioni-ai-business.js",
  "js/ga-autotrack.js",
  "js/index.js",
  "js/privacy-policy.js",
  "js/termini-condizioni.js",
  "logo-112.png",
  "richiesta-ricevuta.html",
  "robots.txt"
]);

export const OWNED_STATIC_FILES = Object.freeze([
  "404.html",
  "js/configuratori-3d-2d.js",
  "css/cookie-banner.css",
  "js/cookie-banner.js",
  "js/contattaci.js",
  "css/foundation.css",
  "css/site-shell.css",
  "css/marketing-pages.css",
  "css/configuratori-3d-2d.css",
  "css/contattaci.css",
  "js/site-shell.js",
  "css/service-demo-form.css",
  "js/service-demo-form.js",
  "js/netlify-lead-form.js",
  "sitemap.xml",
  "assets/images/originals-31/home-01-original-350.webp",
  "assets/images/originals-31/home-01-original-700.webp",
  "assets/images/originals-31/home-01-original-1050.webp",
  "assets/images/originals-31/home-cap-01-full-576.webp",
  "assets/images/originals-31/home-cap-01-full-928.webp",
  "assets/images/originals-31/home-cap-01-full-1152.webp",
  "assets/images/originals-31/home-cap-02-full-576.webp",
  "assets/images/originals-31/home-cap-02-full-928.webp",
  "assets/images/originals-31/home-cap-02-full-1152.webp",
  "assets/images/originals-31/ecom-01-original-350.webp",
  "assets/images/originals-31/ecom-01-original-700.webp",
  "assets/images/originals-31/ecom-01-original-1050.webp",
  "assets/images/cards-43/home-02-preventivi-manuali-350.webp",
  "assets/images/cards-43/home-02-preventivi-manuali-700.webp",
  "assets/images/cards-43/home-02-preventivi-manuali-1050.webp",
  "assets/images/cards-43/home-03-regole-e-incompatibilita-350.webp",
  "assets/images/cards-43/home-03-regole-e-incompatibilita-700.webp",
  "assets/images/cards-43/home-03-regole-e-incompatibilita-1050.webp",
  "assets/images/cards-43/home-04-reti-disallineate-350.webp",
  "assets/images/cards-43/home-04-reti-disallineate-700.webp",
  "assets/images/cards-43/home-04-reti-disallineate-1050.webp",
  "assets/images/cards-43/ecom-02-scelte-dipendenti-350.webp",
  "assets/images/cards-43/ecom-02-scelte-dipendenti-700.webp",
  "assets/images/cards-43/ecom-02-scelte-dipendenti-1050.webp",
  "assets/images/cards-43/ecom-03-prezzo-variabile-350.webp",
  "assets/images/cards-43/ecom-03-prezzo-variabile-700.webp",
  "assets/images/cards-43/ecom-03-prezzo-variabile-1050.webp",
  "assets/images/cards-43/ecom-04-ordini-completi-350.webp",
  "assets/images/cards-43/ecom-04-ordini-completi-700.webp",
  "assets/images/cards-43/ecom-04-ordini-completi-1050.webp",
  "assets/images/cards-43/cpq-01-preventivi-e-pdf-350.webp",
  "assets/images/cards-43/cpq-01-preventivi-e-pdf-700.webp",
  "assets/images/cards-43/cpq-01-preventivi-e-pdf-1050.webp",
  "assets/images/cards-43/cpq-02-account-ruoli-e-autorizzazioni-350.webp",
  "assets/images/cards-43/cpq-02-account-ruoli-e-autorizzazioni-700.webp",
  "assets/images/cards-43/cpq-02-account-ruoli-e-autorizzazioni-1050.webp",
  "assets/images/cards-43/cpq-03-salvataggi-e-duplicazioni-350.webp",
  "assets/images/cards-43/cpq-03-salvataggi-e-duplicazioni-700.webp",
  "assets/images/cards-43/cpq-03-salvataggi-e-duplicazioni-1050.webp",
  "assets/images/cards-43/cpq-04-revisioni-350.webp",
  "assets/images/cards-43/cpq-04-revisioni-700.webp",
  "assets/images/cards-43/cpq-04-revisioni-1050.webp",
  "assets/images/cards-43/cpq-05-agenti-dealer-e-clienti-b2b-350.webp",
  "assets/images/cards-43/cpq-05-agenti-dealer-e-clienti-b2b-700.webp",
  "assets/images/cards-43/cpq-05-agenti-dealer-e-clienti-b2b-1050.webp",
  "assets/images/cards-43/cpq-06-importazioni-350.webp",
  "assets/images/cards-43/cpq-06-importazioni-700.webp",
  "assets/images/cards-43/cpq-06-importazioni-1050.webp",
  "assets/images/cards-43/cpq-07-dashboard-350.webp",
  "assets/images/cards-43/cpq-07-dashboard-700.webp",
  "assets/images/cards-43/cpq-07-dashboard-1050.webp",
  "assets/images/cards-43/cpq-08-documenti-350.webp",
  "assets/images/cards-43/cpq-08-documenti-700.webp",
  "assets/images/cards-43/cpq-08-documenti-1050.webp",
  "assets/images/cards-43/cpq-09-integrazioni-da-analizzare-350.webp",
  "assets/images/cards-43/cpq-09-integrazioni-da-analizzare-700.webp",
  "assets/images/cards-43/cpq-09-integrazioni-da-analizzare-1050.webp",
  "assets/images/cards-43/planner-01-composizioni-modulari-350.webp",
  "assets/images/cards-43/planner-01-composizioni-modulari-700.webp",
  "assets/images/cards-43/planner-01-composizioni-modulari-1050.webp",
  "assets/images/cards-43/planner-02-misure-e-vincoli-350.webp",
  "assets/images/cards-43/planner-02-misure-e-vincoli-700.webp",
  "assets/images/cards-43/planner-02-misure-e-vincoli-1050.webp",
  "assets/images/cards-43/planner-03-cataloghi-estesi-350.webp",
  "assets/images/cards-43/planner-03-cataloghi-estesi-700.webp",
  "assets/images/cards-43/planner-03-cataloghi-estesi-1050.webp",
  "assets/images/cards-43/planner-04-rete-commerciale-350.webp",
  "assets/images/cards-43/planner-04-rete-commerciale-700.webp",
  "assets/images/cards-43/planner-04-rete-commerciale-1050.webp",
  "assets/images/cards-43/ai-01-estrazione-da-pdf-e-listini-350.webp",
  "assets/images/cards-43/ai-01-estrazione-da-pdf-e-listini-700.webp",
  "assets/images/cards-43/ai-01-estrazione-da-pdf-e-listini-1050.webp",
  "assets/images/cards-43/ai-02-classificazione-350.webp",
  "assets/images/cards-43/ai-02-classificazione-700.webp",
  "assets/images/cards-43/ai-02-classificazione-1024.webp",
  "assets/images/cards-43/ai-03-documenti-e-bozze-di-offerta-350.webp",
  "assets/images/cards-43/ai-03-documenti-e-bozze-di-offerta-700.webp",
  "assets/images/cards-43/ai-03-documenti-e-bozze-di-offerta-1050.webp",
  "assets/images/cards-43/ai-04-assistenza-contestuale-350.webp",
  "assets/images/cards-43/ai-04-assistenza-contestuale-700.webp",
  "assets/images/cards-43/ai-04-assistenza-contestuale-1050.webp",
  "assets/images/cards-43/ai-05-form-email-crm-e-portali-350.webp",
  "assets/images/cards-43/ai-05-form-email-crm-e-portali-700.webp",
  "assets/images/cards-43/ai-05-form-email-crm-e-portali-1050.webp",
  "assets/images/cards-43/ai-06-controlli-sui-workflow-350.webp",
  "assets/images/cards-43/ai-06-controlli-sui-workflow-700.webp",
  "assets/images/cards-43/ai-06-controlli-sui-workflow-1050.webp",
  "assets/images/cards-43/ai-07-ricerca-documentale-350.webp",
  "assets/images/cards-43/ai-07-ricerca-documentale-700.webp",
  "assets/images/cards-43/ai-07-ricerca-documentale-1050.webp",
  "assets/images/cards-43/ai-08-assistenti-interni-contestuali-350.webp",
  "assets/images/cards-43/ai-08-assistenti-interni-contestuali-700.webp",
  "assets/images/cards-43/ai-08-assistenti-interni-contestuali-1050.webp",
  "assets/images/cards-43/ai-09-revisione-e-approvazione-350.webp",
  "assets/images/cards-43/ai-09-revisione-e-approvazione-700.webp",
  "assets/images/cards-43/ai-09-revisione-e-approvazione-1050.webp"
]);

export const GENERATED_ROUTES = Object.freeze([
  Object.freeze({
    source: "src/index.njk",
    destination: "index.html",
    publicUrl: "/",
    canonical: "https://solvex-ai3d.com",
    title: "Configuratori, CPQ e Portali Commerciali su Misura | SolveX AI3D",
    h1: "Configuratori e software commerciali. Su misura.",
    schemaTypes: Object.freeze(["Organization", "WebSite"]),
    hasFaq: true
  }),
  Object.freeze({
    source: "src/chi-siamo.njk",
    destination: "chi-siamo.html",
    publicUrl: "/chi-siamo",
    canonical: "https://solvex-ai3d.com/chi-siamo",
    title: "Chi siamo | SolveX AI3D",
    h1: "Un partner tecnico per configuratori e software commerciali.",
    schemaTypes: Object.freeze(["AboutPage", "Organization", "BreadcrumbList"]),
    hasFaq: false
  }),
  Object.freeze({
    source: "src/configuratori-3d-2d.njk",
    destination: "configuratori-3d-2d.html",
    publicUrl: "/configuratori-3d-2d",
    canonical: "https://solvex-ai3d.com/configuratori-3d-2d",
    title: "Configuratori Web 2D/3D su Misura per Aziende | SolveX AI3D",
    h1: "Configuratori su misura. Scegli quale.",
    schemaTypes: Object.freeze(["Service", "BreadcrumbList", "FAQPage"]),
    hasFaq: true,
    measurementMode: "gtm-verified",
    profile: "configurator"
  }),
  Object.freeze({
    source: "src/configuratori-ecommerce.njk",
    destination: "configuratori-ecommerce.html",
    publicUrl: "/configuratori-ecommerce",
    canonical: "https://solvex-ai3d.com/configuratori-ecommerce",
    title: "Configuratori E-commerce su Misura | SolveX AI3D",
    h1: "Configuratori e-commerce su misura. Per prodotti personalizzabili.",
    schemaTypes: Object.freeze(["Service", "BreadcrumbList", "FAQPage"]),
    hasFaq: true,
    measurementMode: "gtm-verified",
    formProfile: "service-demo"
  }),
  Object.freeze({
    source: "src/software-cpq-portali-commerciali.njk",
    destination: "software-cpq-portali-commerciali.html",
    publicUrl: "/software-cpq-portali-commerciali",
    canonical: "https://solvex-ai3d.com/software-cpq-portali-commerciali",
    title: "Software CPQ e Portali Commerciali su Misura | SolveX AI3D",
    h1: "Software CPQ e portali commerciali. Su misura.",
    schemaTypes: Object.freeze(["Service", "BreadcrumbList", "FAQPage"]),
    hasFaq: true,
    measurementMode: "gtm-verified",
    formProfile: "service-demo"
  }),
  Object.freeze({
    source: "src/planner-configuratori-arredamento.njk",
    destination: "planner-configuratori-arredamento.html",
    publicUrl: "/planner-configuratori-arredamento",
    canonical: "https://solvex-ai3d.com/planner-configuratori-arredamento",
    title: "Planner e Configuratori per Arredamento B2B | SolveX AI3D",
    h1: "Planner e configuratori per arredamento. Pensati per produttori e rivenditori.",
    schemaTypes: Object.freeze(["Service", "BreadcrumbList", "FAQPage"]),
    hasFaq: true,
    measurementMode: "gtm-verified",
    formProfile: "service-demo"
  }),
  Object.freeze({
    source: "src/automazioni-ai-business.njk",
    destination: "automazioni-ai-business.html",
    publicUrl: "/automazioni-ai-business",
    canonical: "https://solvex-ai3d.com/automazioni-ai-business",
    title: "Automazioni AI per Processi Commerciali | SolveX AI3D",
    h1: "Automazioni AI. Integrate nei processi commerciali.",
    schemaTypes: Object.freeze(["Service", "BreadcrumbList", "FAQPage"]),
    hasFaq: true,
    measurementMode: "gtm-verified",
    formProfile: "service-demo"
  }),
  Object.freeze({
    source: "src/contattaci.njk",
    destination: "contattaci.html",
    publicUrl: "/contattaci",
    canonical: "https://solvex-ai3d.com/contattaci",
    title: "Contatti | Configuratori e Software Commerciali | SolveX AI3D",
    h1: "Raccontaci il prodotto. O il processo da semplificare.",
    schemaTypes: Object.freeze(["ContactPage", "Organization", "BreadcrumbList"]),
    hasFaq: true,
    measurementMode: "gtm-verified",
    profile: "lead"
  }),
  Object.freeze({
    source: "src/privacy-policy.njk",
    baseline: "privacy-policy.html",
    destination: "privacy-policy.html",
    publicUrl: "/privacy-policy",
    canonical: "https://solvex-ai3d.com/privacy-policy",
    title: "Informativa privacy e cookie | SolveX AI3D",
    h1: "Informativa sulla Privacy",
    schemaTypes: Object.freeze(["WebPage", "BreadcrumbList"]),
    hasFaq: false,
    legal: true
  }),
  Object.freeze({
    source: "src/termini-condizioni.njk",
    baseline: "termini-condizioni.html",
    destination: "termini-condizioni.html",
    publicUrl: "/termini-condizioni",
    canonical: "https://solvex-ai3d.com/termini-condizioni",
    title: "Termini e Condizioni | SolveX AI3D - Regole Uso Servizi",
    h1: "Termini e Condizioni",
    schemaTypes: Object.freeze(["WebPage", "BreadcrumbList"]),
    hasFaq: false,
    legal: true
  })
]);

export function assertMeasurementMode(measurement) {
  const allowedModes = new Set(["legacy-direct"]);
  if (!measurement || !allowedModes.has(measurement.mode)) {
    throw new Error(`Unknown or missing measurement mode: ${measurement?.mode ?? "<missing>"}`);
  }
}

export function assertUniqueDestinations(entries) {
  const seen = new Set();
  for (const entry of entries) {
    const destination = entry.destination.replaceAll("\\", "/").toLowerCase();
    if (seen.has(destination)) {
      throw new Error(`Duplicate output route: ${entry.destination}`);
    }
    seen.add(destination);
  }
}

export default function (eleventyConfig) {
  const measurementPath = path.join(projectRoot, "src", "_data", "measurement.json");
  const measurement = JSON.parse(fs.readFileSync(measurementPath, "utf8"));
  assertMeasurementMode(measurement);

  eleventyConfig.addFilter("json", (value) => JSON.stringify(value));

  const copiedFiles = [...FROZEN_PASSTHROUGH_FILES, ...OWNED_STATIC_FILES];
  const destinations = [
    ...copiedFiles.map((file) => ({ destination: file })),
    ...GENERATED_ROUTES
  ];
  assertUniqueDestinations(destinations);

  for (const file of copiedFiles) {
    const sourcePath = path.join(projectRoot, file);
    if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) {
      throw new Error(`Missing explicit copy source: ${file}`);
    }
    eleventyConfig.addPassthroughCopy({ [file]: file });
  }

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    templateFormats: ["njk"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: false
  };
}
