import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export const TASK_BASE_COMMIT = "353a9cfa55dde08c8093e4455e821c08d88ab849";
export const BASE_COMMIT = TASK_BASE_COMMIT;

export const FROZEN_PASSTHROUGH_FILES = Object.freeze([
  "404.html",
  "_redirects",
  "assets/iphone_16_pro_configuratore_3d.glb",
  "chatbot-ai-intelligenti.html",
  "chatbot/css/main.9ba5c9e2.css",
  "chatbot/css/main.9ba5c9e2.css.map",
  "chatbot/js/main.996591d1.js",
  "chatbot/js/main.996591d1.js.LICENSE.txt",
  "chatbot/js/main.996591d1.js.map",
  "css/404.css",
  "css/automazioni-ai-business.css",
  "css/chatbot-ai-intelligenti.css",
  "css/cookie-banner.css",
  "css/index.css",
  "css/privacy-policy.css",
  "css/siti-web-custom-seo.css",
  "css/termini-condizioni.css",
  "favicon-32.png",
  "favicon.ico",
  "js/404.js",
  "js/ad-attribution-consent.js",
  "js/automazioni-ai-business.js",
  "js/chatbot-ai-intelligenti.js",
  "js/configuratori-3d-2d.js",
  "js/contattaci.js",
  "js/cookie-banner.js",
  "js/ga-autotrack.js",
  "js/index.js",
  "js/netlify-lead-form.js",
  "js/privacy-policy.js",
  "js/siti-web-custom-seo.js",
  "js/termini-condizioni.js",
  "logo-112.png",
  "richiesta-ricevuta.html",
  "robots.txt",
  "siti-web-custom-seo.html"
]);

export const OWNED_STATIC_FILES = Object.freeze([
  "css/foundation.css",
  "css/site-shell.css",
  "css/marketing-pages.css",
  "css/configuratori-3d-2d.css",
  "css/contattaci.css",
  "js/site-shell.js",
  "sitemap.xml"
]);

export const GENERATED_ROUTES = Object.freeze([
  Object.freeze({
    source: "src/index.njk",
    destination: "index.html",
    publicUrl: "/",
    canonical: "https://solvex-ai3d.com",
    title: "Configuratori, CPQ e Portali Commerciali su Misura | SolveX AI3D",
    h1: "Configuratori e software commerciali su misura.",
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
    h1: "Configuratori web su misura, dal prodotto al preventivo.",
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
    h1: "Configuratori e-commerce su misura per prodotti personalizzabili.",
    schemaTypes: Object.freeze(["Service", "BreadcrumbList", "FAQPage"]),
    hasFaq: true
  }),
  Object.freeze({
    source: "src/software-cpq-portali-commerciali.njk",
    destination: "software-cpq-portali-commerciali.html",
    publicUrl: "/software-cpq-portali-commerciali",
    canonical: "https://solvex-ai3d.com/software-cpq-portali-commerciali",
    title: "Software CPQ e Portali Commerciali su Misura | SolveX AI3D",
    h1: "Software CPQ e portali commerciali su misura.",
    schemaTypes: Object.freeze(["Service", "BreadcrumbList", "FAQPage"]),
    hasFaq: true
  }),
  Object.freeze({
    source: "src/planner-configuratori-arredamento.njk",
    destination: "planner-configuratori-arredamento.html",
    publicUrl: "/planner-configuratori-arredamento",
    canonical: "https://solvex-ai3d.com/planner-configuratori-arredamento",
    title: "Planner e Configuratori per Arredamento B2B | SolveX AI3D",
    h1: "Planner e configuratori per arredamento pensati per produttori e rivenditori.",
    schemaTypes: Object.freeze(["Service", "BreadcrumbList", "FAQPage"]),
    hasFaq: true
  }),
  Object.freeze({
    source: "src/automazioni-ai-business.njk",
    destination: "automazioni-ai-business.html",
    publicUrl: "/automazioni-ai-business",
    canonical: "https://solvex-ai3d.com/automazioni-ai-business",
    title: "Automazioni AI per Processi Commerciali | SolveX AI3D",
    h1: "Automazioni AI integrate nei processi commerciali.",
    schemaTypes: Object.freeze(["Service", "BreadcrumbList", "FAQPage"]),
    hasFaq: true
  }),
  Object.freeze({
    source: "src/contattaci.njk",
    destination: "contattaci.html",
    publicUrl: "/contattaci",
    canonical: "https://solvex-ai3d.com/contattaci",
    title: "Contatti | Configuratori e Software Commerciali | SolveX AI3D",
    h1: "Raccontaci il prodotto o il processo da semplificare.",
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
    title: "Privacy Policy | SolveX AI3D - Protezione Dati GDPR",
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
