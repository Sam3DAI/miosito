import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  BASE_COMMIT,
  FROZEN_PASSTHROUGH_FILES,
  GENERATED_ROUTES,
  OWNED_STATIC_FILES,
  TASK_BASE_COMMIT,
  assertMeasurementMode,
  assertUniqueDestinations
} from "../eleventy.config.js";
import {
  canonicalPathSort,
  compareInventories
} from "./inventory-comparator.mjs";
import {
  compareRawBuffers,
  hashFileWithGitFilters,
  readGitBlobBuffer,
  resolveGitBlobObjectId
} from "./git-binary-reader.mjs";
import {
  canonicalizeHtmlContractMarkup,
  canonicalizeRenderedText
} from "./html-contract.mjs";
import { verifyRealBinaryOutputs } from "./binary-post-build.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(root, "_site");
const eleventyCli = path.join(root, "node_modules", "@11ty", "eleventy", "cmd.cjs");
const maxBuffer = 64 * 1024 * 1024;
const htmlBudget = 65 * 1024;
const sharedCssGzipBudget = 45 * 1024;
const shellJsGzipBudget = 30 * 1024;
const initialTransferBudget = 700 * 1024;

// Independent, reviewable oracle. These values intentionally do not come from
// eleventy.config.js: the verifier must fail if implementation and config drift
// together.
const EXPECTED_FROZEN_PASSTHROUGH_FILES = Object.freeze([
  "404.html",
  "_redirects",
  "assets/iphone_16_pro_configuratore_3d.glb",
  "chatbot-ai-intelligenti.html",
  "chatbot/css/main.9ba5c9e2.css",
  "chatbot/css/main.9ba5c9e2.css.map",
  "chatbot/js/main.996591d1.js",
  "chatbot/js/main.996591d1.js.LICENSE.txt",
  "chatbot/js/main.996591d1.js.map",
  "configuratori-3d-2d.html",
  "contattaci.html",
  "css/404.css",
  "css/automazioni-ai-business.css",
  "css/chatbot-ai-intelligenti.css",
  "css/configuratori-3d-2d.css",
  "css/contattaci.css",
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

const EXPECTED_OWNED_STATIC_FILES = Object.freeze([
  "css/foundation.css",
  "css/site-shell.css",
  "css/marketing-pages.css",
  "js/site-shell.js",
  "sitemap.xml"
]);

const EXPECTED_GENERATED_ROUTES = Object.freeze([
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
    source: "src/chi-sono.njk",
    destination: "chi-sono.html",
    publicUrl: "/chi-sono",
    canonical: "https://solvex-ai3d.com/chi-sono",
    title: "Chi è SolveX AI3D | Configuratori e Software Commerciali",
    h1: "Un partner tecnico diretto per progetti digitali complessi.",
    schemaTypes: Object.freeze(["AboutPage", "Organization", "Person"]),
    hasFaq: false
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

const configuratorProtectedFiles = Object.freeze([
  "configuratori-3d-2d.html",
  "css/configuratori-3d-2d.css",
  "js/configuratori-3d-2d.js",
  "js/netlify-lead-form.js",
  "js/ad-attribution-consent.js",
  "assets/iphone_16_pro_configuratore_3d.glb"
]);

const exactSitemapUrls = Object.freeze([
  "https://solvex-ai3d.com/",
  "https://solvex-ai3d.com/chi-sono",
  "https://solvex-ai3d.com/configuratori-3d-2d",
  "https://solvex-ai3d.com/configuratori-ecommerce",
  "https://solvex-ai3d.com/software-cpq-portali-commerciali",
  "https://solvex-ai3d.com/planner-configuratori-arredamento",
  "https://solvex-ai3d.com/automazioni-ai-business",
  "https://solvex-ai3d.com/contattaci",
  "https://solvex-ai3d.com/privacy-policy",
  "https://solvex-ai3d.com/termini-condizioni",
  "https://solvex-ai3d.com/chatbot-ai-intelligenti",
  "https://solvex-ai3d.com/siti-web-custom-seo"
]);

const expectedDescriptions = Object.freeze({
  "index.html": "Configuratori web, software CPQ, portali commerciali e planner su misura per aziende che gestiscono prodotti, listini e preventivi complessi.",
  "chi-sono.html": "Conosci Sam, fondatore e referente diretto di SolveX AI3D per configuratori, CPQ, portali B2B e software commerciali su misura.",
  "configuratori-ecommerce.html": "Configuratori e-commerce su misura per guidare varianti, materiali, accessori, prezzi e ordini, con integrazioni valutate sulla piattaforma esistente.",
  "software-cpq-portali-commerciali.html": "Software CPQ e portali B2B su misura per configurazioni, listini, sconti, preventivi, ruoli e documenti nei processi commerciali complessi.",
  "planner-configuratori-arredamento.html": "Planner e configuratori B2B per produttori, rivenditori, showroom e reti vendita: composizioni, misure, finiture, prezzi e preventivi.",
  "automazioni-ai-business.html": "Automazioni AI integrate in form, email, CRM e portali per leggere documenti, classificare richieste e supportare workflow commerciali supervisionati.",
  "privacy-policy.html": "Informativa sulla privacy di SolveX AI3D: come raccogliamo, usiamo e proteggiamo i tuoi dati personali in conformità al GDPR. Dettagli su cookie, Google Analytics (su consenso), Google Ads (su consenso) e chatbot.",
  "termini-condizioni.html": "Termini e Condizioni di SolveX AI3D: regole per l'uso del sito e dei servizi digitali come configuratori 3D/2D, automazioni AI, siti custom e chatbot."
});

const expectedFaqQuestions = Object.freeze({
  "index.html": Object.freeze([
    "Quanto costa un configuratore su misura?",
    "Si integra nel sito o e-commerce esistente?",
    "È meglio un configuratore 2D o 3D?",
    "Può gestire prezzi, regole e preventivi?",
    "È adatto anche alle PMI?"
  ]),
  "configuratori-ecommerce.html": Object.freeze([
    "Il configuratore può integrarsi nel mio e-commerce esistente?",
    "Può aggiornare il prezzo mentre cambiano le opzioni?",
    "Serve sempre il 3D?",
    "La configurazione può essere salvata o condivisa?",
    "È compatibile con WooCommerce o PrestaShop?"
  ]),
  "software-cpq-portali-commerciali.html": Object.freeze([
    "Che differenza c'è tra un CPQ e un semplice configuratore?",
    "Può gestire listini e sconti diversi per agente o cliente?",
    "Il portale può generare preventivi e PDF?",
    "Si collega a ERP, CRM o altri sistemi?",
    "Si può partire da un solo flusso commerciale?"
  ]),
  "planner-configuratori-arredamento.html": Object.freeze([
    "Il planner è pensato per produttori o rivenditori?",
    "Può controllare misure e incompatibilità?",
    "La visualizzazione deve essere in 3D?",
    "Può preparare prezzi e preventivi?",
    "È pensato anche per clienti privati?"
  ]),
  "automazioni-ai-business.html": Object.freeze([
    "Quali processi commerciali si prestano all'automazione AI?",
    "L'AI può collegarsi a form, email, CRM o portali?",
    "Gli output vengono controllati da una persona?",
    "Può lavorare su PDF, listini e documenti interni?",
    "Da dove conviene iniziare?"
  ])
});

const expectedHeaderLinks = Object.freeze([
  ["/", "SolveX AI3D"],
  ["/configuratori-3d-2d", "Configuratori 2D/3D"],
  ["/configuratori-ecommerce", "Configuratori e-commerce"],
  ["/software-cpq-portali-commerciali", "CPQ e software commerciali"],
  ["/planner-configuratori-arredamento", "Planner e arredamento"],
  ["/automazioni-ai-business", "Automazioni AI"],
  ["/#progetti", "Progetti"],
  ["/chi-sono#metodo", "Metodo"],
  ["/chi-sono", "Chi sono"],
  ["/contattaci", "Valutiamo il tuo progetto"]
]);

const allowedFooterHrefs = Object.freeze(new Set([
  "/", "/configuratori-3d-2d", "/configuratori-ecommerce",
  "/software-cpq-portali-commerciali", "/planner-configuratori-arredamento",
  "/automazioni-ai-business", "/#progetti", "/chi-sono#metodo", "/chi-sono",
  "/contattaci", "/privacy-policy", "/termini-condizioni",
  "mailto:info@solvex-ai3d.com", "tel:+393474380837",
  "https://www.instagram.com/solvex_ai3d/", "https://x.com/SolveX_AI3D",
  "https://www.linkedin.com/company/108791484"
]));

const expectedFooterLinks = Object.freeze([
  ["/", "SolveX AI3D"],
  ["/configuratori-3d-2d", "Configuratori 2D/3D"],
  ["/configuratori-ecommerce", "Configuratori e-commerce"],
  ["/software-cpq-portali-commerciali", "CPQ e software commerciali"],
  ["/planner-configuratori-arredamento", "Planner e arredamento"],
  ["/automazioni-ai-business", "Automazioni AI"],
  ["/#progetti", "Progetti"],
  ["/chi-sono#metodo", "Metodo"],
  ["/chi-sono", "Chi sono"],
  ["/contattaci", "Contatti"],
  ["/privacy-policy", "Privacy"],
  ["/termini-condizioni", "Termini"],
  ["mailto:info@solvex-ai3d.com", "info@solvex-ai3d.com"],
  ["tel:+393474380837", "+39 3474380837"],
  ["https://www.instagram.com/solvex_ai3d/", "Instagram"],
  ["https://x.com/SolveX_AI3D", "X"],
  ["https://www.linkedin.com/company/108791484", "LinkedIn"],
  ["/contattaci", "Parliamo del tuo progetto"]
]);

const requiredContent = Object.freeze({
  "index.html": Object.freeze([
    "SolveX AI3D · Configuratori, CPQ e portali B2B",
    "Trasformiamo prodotti, listini e regole di vendita in strumenti web che aiutano aziende e reti commerciali a configurare, preventivare e vendere con meno errori.",
    "Quando il prodotto è complesso, la vendita non deve esserlo.",
    "Una soluzione per ogni processo di vendita.",
    "Dal catalogo al preventivo, in un unico flusso.",
    "Tipologie di progetto già realizzate.",
    "Configurazione 3D di prodotto.",
    "Portale preventivi B2B.",
    "Configuratore tecnico con listini e PDF.",
    "Un interlocutore diretto, competenze specialistiche quando servono.",
    "Hai un processo fuori standard?",
    "Raccontami il processo"
  ]),
  "chi-sono.html": Object.freeze([
    "Sono Sam, fondatore e referente diretto di SolveX AI3D.",
    "Un modello tra freelance e agenzia.",
    "Tipo di progetti",
    "Cosa SolveX non vende.",
    "App consumer generiche",
    "Gestionali universali"
  ]),
  "configuratori-ecommerce.html": Object.freeze([
    "Esperienza guidata",
    "Compatibilità e vincoli",
    "Prezzo dinamico",
    "2D, 3D e AR quando utili",
    "Salvataggio e condivisione",
    "Carrello e ordine",
    "WooCommerce, PrestaShop o soluzioni custom: prima si analizza."
  ]),
  "software-cpq-portali-commerciali.html": Object.freeze([
    "Listini, sconti e prezzi",
    "Preventivi e PDF",
    "Account, ruoli e autorizzazioni",
    "Salvataggi e duplicazioni",
    "Agenti, dealer e clienti B2B",
    "Importazioni",
    "Dashboard",
    "Non rientra perfettamente in un CPQ?"
  ]),
  "planner-configuratori-arredamento.html": Object.freeze([
    "Produttori",
    "Rivenditori",
    "Showroom",
    "Reti vendita",
    "Composizioni modulari",
    "Misure e vincoli",
    "Finiture e varianti",
    "Vista 2D o 3D",
    "Prezzi e preventivi"
  ]),
  "automazioni-ai-business.html": Object.freeze([
    "Una capability dentro la soluzione, non un fine.",
    "Estrazione da PDF e listini",
    "Classificazione",
    "Documenti e bozze di offerta",
    "Assistenza contestuale",
    "Form, email, CRM e portali",
    "Controlli sui workflow",
    "Ricerca documentale",
    "Assistenti interni contestuali",
    "Automazione supervisionata"
  ])
});

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function run(command, args, options = {}) {
  const encoding = Object.prototype.hasOwnProperty.call(options, "encoding")
    ? options.encoding
    : "utf8";
  const result = spawnSync(command, args, {
    cwd: root,
    shell: false,
    encoding,
    maxBuffer,
    windowsHide: true,
    stdio: options.stdio ?? "pipe"
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const stderr = Buffer.isBuffer(result.stderr) ? result.stderr.toString("utf8") : result.stderr;
    throw new Error(`${command} ${args.join(" ")} failed (${result.status}):\n${stderr ?? ""}`);
  }
  return result;
}

function gitBlob(relativePath) {
  return readGitBlobBuffer(BASE_COMMIT, relativePath, root).buffer;
}

function gitBlobObjectId(relativePath) {
  return resolveGitBlobObjectId(BASE_COMMIT, relativePath, root);
}

function cleanFilteredObjectId(relativePath, sourcePath) {
  return hashFileWithGitFilters(relativePath, sourcePath, root);
}

function buildFromAbsentOutput() {
  fs.rmSync(outputRoot, { recursive: true, force: true });
  assert.equal(fs.existsSync(outputRoot), false, "_site must be absent before each build");
  run(process.execPath, [eleventyCli], { stdio: "inherit" });
  assert.equal(fs.statSync(outputRoot).isDirectory(), true, "Eleventy did not create _site");
}

function listFiles(directory, prefix = "") {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const relativePath = path.posix.join(prefix, entry.name);
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(absolutePath, relativePath));
    else if (entry.isFile()) files.push(relativePath);
    else throw new Error(`Unexpected non-file output entry: ${relativePath}`);
  }
  return files;
}

function inventory() {
  const rows = canonicalPathSort(listFiles(outputRoot)).map((relativePath) => {
    const bytes = fs.readFileSync(path.join(outputRoot, ...relativePath.split("/")));
    return { path: relativePath, size: bytes.length, sha256: sha256(bytes) };
  });
  const aggregate = sha256(Buffer.from(rows.map((row) => `${row.path}\0${row.size}\0${row.sha256}`).join("\n"), "utf8"));
  return { rows, aggregate };
}

function normalizeSpace(value) {
  return value.replace(/\r\n?/g, "\n").replace(/\s+/g, " ").trim();
}

function canonicalMarkup(value) {
  return canonicalizeHtmlContractMarkup(value);
}

function stripMarkup(value) {
  return canonicalizeRenderedText(
    value
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  );
}

function firstMatch(html, regex, label) {
  const match = html.match(regex);
  assert.ok(match, `Missing ${label}`);
  return match[1] ?? match[0];
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i"));
  return match ? canonicalizeRenderedText(match[2]) : null;
}

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[\\s\\S]*?>`, "gi"))].map((match) => match[0]);
}

function metaContent(html, attributeName, attributeValue) {
  const tag = tags(html, "meta").find((candidate) => (attribute(candidate, attributeName) ?? "").toLowerCase() === attributeValue.toLowerCase());
  assert.ok(tag, `Missing meta ${attributeName}=${attributeValue}`);
  return attribute(tag, "content");
}

function linkHref(html, relation) {
  const tag = tags(html, "link").find((candidate) => (attribute(candidate, "rel") ?? "").toLowerCase() === relation.toLowerCase());
  assert.ok(tag, `Missing link rel=${relation}`);
  return attribute(tag, "href");
}

function jsonLd(html) {
  return [...html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((match) => JSON.parse(match[1]));
}

function topLevelSchemaNodes(html) {
  return jsonLd(html).flatMap((document) => Array.isArray(document["@graph"]) ? document["@graph"] : [document]);
}

function headings(html) {
  return [...html.matchAll(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((match) => ({
    level: Number(match[1].slice(1)),
    text: stripMarkup(match[2])
  }));
}

function anchors(html) {
  return [...html.matchAll(/<a\b[\s\S]*?<\/a>/gi)].map((match) => canonicalMarkup(match[0]));
}

function linkPairs(html) {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((match) => ({
    href: attribute(match[1], "href"),
    text: stripMarkup(match[2])
  }));
}

function scripts(html) {
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].map((match) => {
    const source = match[1].match(/\bsrc=["']([^"']+)["']/i);
    return source ? { source: source[1] } : { inline: normalizeSpace(match[2]) };
  });
}

function cspDirectives(html) {
  const csp = metaContent(html, "http-equiv", "Content-Security-Policy");
  const directives = {};
  for (const rawDirective of csp.split(";")) {
    const tokens = rawDirective.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;
    const [name, ...values] = tokens;
    assert.equal(Object.prototype.hasOwnProperty.call(directives, name), false, `Duplicate CSP directive: ${name}`);
    directives[name] = [...new Set(values)].sort();
  }
  return directives;
}

function visibleFaq(html) {
  return [...html.matchAll(/<details\b[^>]*class=["'][^"']*faq-item[^"']*["'][^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>\s*<div\b[^>]*class=["'][^"']*faq-item__answer[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<\/details>/gi)].map((match) => ({
    question: stripMarkup(match[1]),
    answer: stripMarkup(match[2])
  }));
}

function assertSchemaHasNoInventedCommercialProof(value, location = "schema") {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertSchemaHasNoInventedCommercialProof(entry, `${location}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  const forbiddenKeys = new Set(["price", "pricerange", "review", "aggregaterating", "ratingvalue"]);
  for (const [key, entry] of Object.entries(value)) {
    assert.equal(forbiddenKeys.has(key.toLowerCase()), false, `Forbidden invented commercial proof at ${location}.${key}`);
    assertSchemaHasNoInventedCommercialProof(entry, `${location}.${key}`);
  }
}

function assertSchemaShape(route, documents, nodes) {
  for (const document of documents) {
    assert.equal(document["@context"], "https://schema.org", `${route.publicUrl}: JSON-LD @context must be https://schema.org`);
  }

  for (const node of nodes) {
    if (node["@type"] === "Organization") {
      assert.equal(node["@id"], "https://solvex-ai3d.com/#organization", `${route.publicUrl}: Organization ID mismatch`);
      assert.equal(node.name, "SolveX AI3D", `${route.publicUrl}: Organization name mismatch`);
      assert.equal(node.url, "https://solvex-ai3d.com", `${route.publicUrl}: Organization URL mismatch`);
      assert.equal(node.logo?.url, "https://solvex-ai3d.com/logo-112.png", `${route.publicUrl}: Organization logo mismatch`);
    }

    if (node["@type"] === "WebSite") {
      assert.equal(node.url, "https://solvex-ai3d.com", `${route.publicUrl}: WebSite URL mismatch`);
      assert.equal(node.name, "SolveX AI3D", `${route.publicUrl}: WebSite name mismatch`);
      assert.equal(node.publisher?.["@id"], "https://solvex-ai3d.com/#organization", `${route.publicUrl}: WebSite publisher mismatch`);
    }

    if (node["@type"] === "AboutPage" || node["@type"] === "WebPage") {
      assert.equal(node.url, route.canonical, `${route.publicUrl}: ${node["@type"]} URL mismatch`);
      assert.ok(typeof node.name === "string" && node.name.length > 0, `${route.publicUrl}: ${node["@type"]} name missing`);
    }

    if (node["@type"] === "Service") {
      assert.equal(node.url, route.canonical, `${route.publicUrl}: Service URL mismatch`);
      assert.equal(node.provider?.["@id"], "https://solvex-ai3d.com/#organization", `${route.publicUrl}: Service provider mismatch`);
      assert.equal(node.areaServed, "IT", `${route.publicUrl}: Service areaServed mismatch`);
      assert.ok(typeof node.name === "string" && node.name.length > 0, `${route.publicUrl}: Service name missing`);
      assert.ok(typeof node.serviceType === "string" && node.serviceType.length > 0, `${route.publicUrl}: Service type missing`);
      assert.ok(typeof node.description === "string" && node.description.length > 0, `${route.publicUrl}: Service description missing`);
    }

    if (node["@type"] === "BreadcrumbList") {
      assert.ok(Array.isArray(node.itemListElement) && node.itemListElement.length >= 2, `${route.publicUrl}: breadcrumb schema is incomplete`);
      node.itemListElement.forEach((item, index) => {
        assert.equal(item["@type"], "ListItem", `${route.publicUrl}: breadcrumb item type mismatch`);
        assert.equal(item.position, index + 1, `${route.publicUrl}: breadcrumb positions must be sequential`);
        assert.ok(typeof item.name === "string" && item.name.length > 0, `${route.publicUrl}: breadcrumb item name missing`);
        assert.ok(typeof item.item === "string" && item.item.startsWith("https://solvex-ai3d.com"), `${route.publicUrl}: breadcrumb item URL must be production-local`);
      });
      assert.equal(node.itemListElement.at(-1).item, route.canonical, `${route.publicUrl}: breadcrumb final URL mismatch`);
    }
  }

  if (route.destination === "chi-sono.html") {
    const person = nodes.find((node) => node["@type"] === "Person");
    assert.deepEqual(person, {
      "@type": "Person",
      "@id": "https://solvex-ai3d.com/chi-sono/#sam",
      name: "Sam",
      jobTitle: "Fondatore e referente diretto di SolveX AI3D",
      url: "https://solvex-ai3d.com/chi-sono",
      worksFor: { "@id": "https://solvex-ai3d.com/#organization" }
    }, `${route.publicUrl}: Person schema must contain only approved public data`);
  }

  const faqNode = nodes.find((node) => node["@type"] === "FAQPage");
  if (faqNode) {
    assert.ok(Array.isArray(faqNode.mainEntity) && faqNode.mainEntity.length > 0, `${route.publicUrl}: FAQ schema items missing`);
    for (const item of faqNode.mainEntity) {
      assert.equal(item["@type"], "Question", `${route.publicUrl}: FAQ item must be a Question`);
      assert.equal(item.acceptedAnswer?.["@type"], "Answer", `${route.publicUrl}: FAQ acceptedAnswer must be an Answer`);
      assert.ok(typeof item.name === "string" && item.name.length > 0, `${route.publicUrl}: FAQ question missing`);
      assert.ok(typeof item.acceptedAnswer?.text === "string" && item.acceptedAnswer.text.length > 0, `${route.publicUrl}: FAQ answer missing`);
    }
  }
}

function mainMarkupForRoute(html, route) {
  return route.legal
    ? firstMatch(html, /<section\b[^>]*role=["']main["'][^>]*>([\s\S]*?)<\/section>/i, `${route.publicUrl} legal main`)
    : firstMatch(html, /<main\b[^>]*>([\s\S]*?)<\/main>/i, `${route.publicUrl} main`);
}

function assertHeadingOrder(html, route) {
  const mainMarkup = mainMarkupForRoute(html, route);
  const outline = headings(mainMarkup);
  assert.ok(outline.length > 0, `${route.publicUrl}: no headings`);
  assert.equal(outline[0].level, 1, `${route.publicUrl}: first main heading is not H1`);
  assert.equal(outline.filter((heading) => heading.level === 1).length, 1, `${route.publicUrl}: main must contain one H1`);
  for (let index = 1; index < outline.length; index += 1) {
    assert.ok(outline[index].level <= outline[index - 1].level + 1, `${route.publicUrl}: heading level jumps from H${outline[index - 1].level} to H${outline[index].level}`);
  }
}

function assertLegalContract(route, outputHtml) {
  const baselineHtml = gitBlob(route.baseline).toString("utf8");
  const sectionId = route.destination.startsWith("privacy") ? "privacy-content" : "terms-content";
  const outputSection = firstMatch(outputHtml, new RegExp(`<section\\b[^>]*id=["']${sectionId}["'][^>]*>([\\s\\S]*?)<\\/section>`, "i"), `${sectionId} output`);
  const baselineSection = firstMatch(baselineHtml, new RegExp(`<section\\b[^>]*id=["']${sectionId}["'][^>]*>([\\s\\S]*?)<\\/section>`, "i"), `${sectionId} baseline`);

  assert.equal(stripMarkup(outputSection), stripMarkup(baselineSection), `${route.publicUrl}: legal text or date changed`);
  assert.equal(canonicalMarkup(outputSection), canonicalMarkup(baselineSection), `${route.publicUrl}: legal section markup or structure changed`);
  assert.deepEqual(headings(outputSection), headings(baselineSection), `${route.publicUrl}: legal headings changed`);
  assert.deepEqual(anchors(outputSection), anchors(baselineSection), `${route.publicUrl}: legal links changed`);
  assert.deepEqual(jsonLd(outputHtml), jsonLd(baselineHtml), `${route.publicUrl}: legal JSON-LD changed`);
  assert.deepEqual(cspDirectives(outputHtml), cspDirectives(baselineHtml), `${route.publicUrl}: CSP meaning changed`);
  assert.equal(metaContent(outputHtml, "name", "description"), metaContent(baselineHtml, "name", "description"), `${route.publicUrl}: legal description changed`);
  assert.equal(metaContent(outputHtml, "name", "keywords"), metaContent(baselineHtml, "name", "keywords"), `${route.publicUrl}: legal keywords changed`);

  for (const marker of ["gtag('consent','default'", "window.__persistAdParams=function"] ) {
    const outputScript = scripts(outputHtml).find((entry) => entry.inline?.includes(marker));
    const baselineScript = scripts(baselineHtml).find((entry) => entry.inline?.includes(marker));
    assert.ok(outputScript && baselineScript, `${route.publicUrl}: legal measurement script missing (${marker})`);
    assert.equal(outputScript.inline, baselineScript.inline, `${route.publicUrl}: legal measurement behavior changed (${marker})`);
  }
}

function shellMarkup(html, route) {
  const header = firstMatch(html, /(<header\b[\s\S]*?<\/header>)/i, `${route.publicUrl} header`);
  const footer = firstMatch(html, /(<footer\b[\s\S]*?<\/footer>)/i, `${route.publicUrl} footer`);
  return `${header}\n${footer}`;
}

function assertGeneratedPageContract(route, html) {
  const title = stripMarkup(firstMatch(html, /<title>([\s\S]*?)<\/title>/i, `${route.publicUrl} title`));
  assert.equal(title, route.title, `${route.publicUrl}: title mismatch`);
  assert.equal(linkHref(html, "canonical"), route.canonical, `${route.publicUrl}: canonical mismatch`);
  assert.equal(metaContent(html, "name", "robots").replace(/\s+/g, ""), "index,follow", `${route.publicUrl}: robots must be index,follow`);
  assert.equal(metaContent(html, "name", "description"), expectedDescriptions[route.destination], `${route.publicUrl}: description differs from the independent contract`);
  assert.ok(metaContent(html, "property", "og:title"), `${route.publicUrl}: Open Graph title missing`);
  assert.ok(metaContent(html, "property", "og:description"), `${route.publicUrl}: Open Graph description missing`);
  assert.equal(metaContent(html, "property", "og:url"), route.canonical, `${route.publicUrl}: Open Graph URL mismatch`);
  assert.ok(metaContent(html, "property", "og:image").startsWith("https://solvex-ai3d.com/"), `${route.publicUrl}: Open Graph image must be production-local`);
  assert.ok(metaContent(html, "name", "twitter:card"), `${route.publicUrl}: Twitter card missing`);
  assert.ok(metaContent(html, "name", "twitter:title"), `${route.publicUrl}: Twitter title missing`);
  assert.ok(metaContent(html, "name", "twitter:description"), `${route.publicUrl}: Twitter description missing`);

  const pageH1 = headings(html).filter((heading) => heading.level === 1);
  assert.equal(pageH1.length, 1, `${route.publicUrl}: document must contain one H1`);
  assert.equal(pageH1[0].text, route.h1, `${route.publicUrl}: H1 mismatch`);
  assertHeadingOrder(html, route);

  const schemaDocuments = jsonLd(html);
  const schemaNodes = schemaDocuments.flatMap((document) => Array.isArray(document["@graph"]) ? document["@graph"] : [document]);
  const schemaTypes = schemaNodes.map((node) => node["@type"]).sort();
  assert.deepEqual(schemaTypes, [...route.schemaTypes].sort(), `${route.publicUrl}: schema types mismatch`);
  schemaDocuments.forEach((document) => assertSchemaHasNoInventedCommercialProof(document));
  assertSchemaShape(route, schemaDocuments, schemaNodes);

  const mainMarkup = mainMarkupForRoute(html, route);
  const visibleFaqItems = visibleFaq(mainMarkup);
  if (route.hasFaq) {
    assert.deepEqual(visibleFaqItems.map((item) => item.question), expectedFaqQuestions[route.destination], `${route.publicUrl}: visible FAQ questions differ from contract`);
  } else {
    assert.equal(visibleFaqItems.length, 0, `${route.publicUrl}: unexpected FAQ block`);
  }
  if (route.schemaTypes.includes("FAQPage")) {
    const faqNode = schemaNodes.find((node) => node["@type"] === "FAQPage");
    const schemaFaqItems = faqNode.mainEntity.map((item) => ({
      question: canonicalizeRenderedText(item.name),
      answer: canonicalizeRenderedText(item.acceptedAnswer.text)
    }));
    assert.deepEqual(schemaFaqItems, visibleFaqItems, `${route.publicUrl}: FAQ schema differs from visible FAQ`);
  }

  if (route.publicUrl !== "/") {
    assert.match(html, /<nav\b[^>]*class=["'][^"']*breadcrumb[^"']*["'][^>]*aria-label=["']Percorso["']/i, `${route.publicUrl}: visible breadcrumb missing`);
    assert.match(html, /<li\b[^>]*aria-current=["']page["'][^>]*>/i, `${route.publicUrl}: breadcrumb current item missing`);
  }

  const shell = shellMarkup(html, route);
  const header = firstMatch(html, /(<header\b[\s\S]*?<\/header>)/i, `${route.publicUrl} header`);
  const footer = firstMatch(html, /(<footer\b[\s\S]*?<\/footer>)/i, `${route.publicUrl} footer`);
  const headerPairs = linkPairs(header);
  const footerPairs = linkPairs(footer);
  for (const [href, label] of expectedHeaderLinks) {
    assert.ok(headerPairs.some((link) => link.href === href && link.text.startsWith(label)), `${route.publicUrl}: header link missing or changed: ${label} -> ${href}`);
  }
  assert.ok(headerPairs.every((link) => expectedHeaderLinks.some(([href]) => href === link.href)), `${route.publicUrl}: unexpected header link`);
  assert.ok(footerPairs.every((link) => allowedFooterHrefs.has(link.href)), `${route.publicUrl}: unexpected footer link`);
  for (const [href, label] of expectedFooterLinks) {
    assert.ok(footerPairs.some((link) => link.href === href && link.text.startsWith(label)), `${route.publicUrl}: footer link missing or changed: ${label} -> ${href}`);
  }
  assert.doesNotMatch(shell, /Chatbot AI|Siti Custom|Software Custom/i, `${route.publicUrl}: retired offer appears in new navigation`);
  assert.doesNotMatch(html, /<a\b[^>]*href=["'][^"']*\.html(?:[?#][^"']*)?["']/i, `${route.publicUrl}: .html appears in a public link`);

  assert.doesNotMatch(html, /<script\b[^>]*\bsrc=["'][^"']*(?:chatbot|\.glb|babylon|model-viewer|apexcharts|font-awesome)[^"']*["']/i, `${route.publicUrl}: forbidden runtime script`);
  assert.doesNotMatch(html, /<link\b[^>]*\bhref=["'][^"']*(?:chatbot|font-awesome|cdnjs\.cloudflare)[^"']*["']/i, `${route.publicUrl}: forbidden stylesheet or font asset`);
  assert.doesNotMatch(html, /<script\b[^>]*\bsrc=["'][^"']*(?:googletagmanager|google-analytics|googleadservices|doubleclick)[^"']*["']/i, `${route.publicUrl}: Google script requested before consent`);
  assert.doesNotMatch(html, /<link\b[^>]*\brel=["'](?:preconnect|dns-prefetch)["'][^>]*\bhref=["'][^"']*(?:google|doubleclick)[^"']*["']/i, `${route.publicUrl}: Google connection hint before consent`);
  assert.doesNotMatch(html, /<link\b[^>]*\bhref=["'][^"']*(?:google|doubleclick)[^"']*["'][^>]*\brel=["'](?:preconnect|dns-prefetch)["']/i, `${route.publicUrl}: Google connection hint before consent`);
  assert.doesNotMatch(html, /<model-viewer\b|\.glb(?:[?"'])|babylon|ApexCharts/i, `${route.publicUrl}: heavy visual runtime leaked into generated page`);
  assert.equal((html.match(/id=["']root["']/gi) ?? []).length, 0, `${route.publicUrl}: chatbot root present`);
  assert.equal((html.match(/gtag\/js\?id=G-VW0JHKW0ZW/g) ?? []).length, 1, `${route.publicUrl}: gtag loader definition must appear once`);
  assert.equal(html.includes("GTM-"), false, `${route.publicUrl}: GTM container forbidden in legacy-direct mode`);
  assert.equal((html.match(/\/js\/cookie-banner\.js/g) ?? []).length, 1, `${route.publicUrl}: cookie loader duplicated or missing`);
  assert.equal((html.match(/\/js\/site-shell\.js/g) ?? []).length, 1, `${route.publicUrl}: shell script duplicated or missing`);
  assert.equal((html.match(/\/js\/ga-autotrack\.js/g) ?? []).length, 1, `${route.publicUrl}: autotrack duplicated or missing`);
  assert.ok(html.indexOf("gtag('consent','default'") < html.indexOf("function loadGtagOnce"), `${route.publicUrl}: default consent must precede loader`);
  for (const consentKey of ["ad_storage", "ad_user_data", "ad_personalization", "analytics_storage"]) {
    assert.match(html, new RegExp(`${consentKey}:'denied'`), `${route.publicUrl}: ${consentKey} is not denied by default`);
  }

  const visibleText = stripMarkup(mainMarkup);
  for (const marker of requiredContent[route.destination] ?? []) {
    assert.ok(visibleText.includes(marker), `${route.publicUrl}: required content missing: ${marker}`);
  }
  if (route.destination === "automazioni-ai-business.html") {
    assert.doesNotMatch(visibleText, /risultati garantiti|automazioni non supervisionate/i, `${route.publicUrl}: forbidden AI promise`);
    assert.match(visibleText, /non proponiamo[^.]*sostituzione completa delle persone/i, `${route.publicUrl}: human-responsibility disclaimer missing`);
  }
  if (route.destination === "software-cpq-portali-commerciali.html") {
    assert.doesNotMatch(visibleText, /sviluppiamo qualsiasi software/i, `${route.publicUrl}: generic software promise forbidden`);
  }

  if (route.legal) assertLegalContract(route, html);
}

function localReferences(html) {
  const refs = [];
  for (const match of html.matchAll(/\b(href|src)=["']([^"']+)["']/gi)) {
    refs.push({ attribute: match[1].toLowerCase(), raw: match[2] });
  }
  return refs;
}

function localTarget(fromFile, raw, files) {
  if (!raw || raw.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(raw)) return null;
  const [pathPart] = raw.split(/[?#]/, 1);
  if (!pathPart && raw.startsWith("#")) return { target: fromFile, found: fromFile };
  let target = pathPart.startsWith("/")
    ? pathPart.slice(1)
    : path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), pathPart));
  target = target.replace(/^\.\//, "");
  const candidates = target === "" || target.endsWith("/")
    ? [path.posix.join(target, "index.html")]
    : path.posix.extname(target)
      ? [target]
      : [target, `${target}.html`, path.posix.join(target, "index.html")];
  const found = candidates.find((candidate) => files.has(candidate));
  return { target, found: found ?? null };
}

function missingLinks(files) {
  const fileSet = new Set(files);
  const missing = [];
  for (const file of canonicalPathSort(files.filter((candidate) => candidate.toLowerCase().endsWith(".html")))) {
    const html = fs.readFileSync(path.join(outputRoot, ...file.split("/")), "utf8");
    for (const reference of localReferences(html)) {
      const resolution = localTarget(file, reference.raw, fileSet);
      if (resolution && !resolution.found) missing.push(`${file}|${reference.attribute}|${reference.raw}|${resolution.target}`);
    }
  }
  return canonicalPathSort(missing);
}

function assertLocalFragments(files) {
  const fileSet = new Set(files);
  for (const file of files.filter((candidate) => candidate.toLowerCase().endsWith(".html"))) {
    const html = fs.readFileSync(path.join(outputRoot, ...file.split("/")), "utf8");
    for (const reference of localReferences(html).filter((entry) => entry.attribute === "href" && entry.raw.includes("#"))) {
      const fragment = reference.raw.slice(reference.raw.indexOf("#") + 1);
      if (!fragment) continue;
      const resolution = localTarget(file, reference.raw, fileSet);
      if (!resolution?.found) continue;
      const targetHtml = fs.readFileSync(path.join(outputRoot, ...resolution.found.split("/")), "utf8");
      assert.match(targetHtml, new RegExp(`\\bid=["']${fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`, "i"), `${file}: missing local fragment target ${reference.raw}`);
    }
  }
}

function resourceReferences(html) {
  const references = new Set();
  const networkTags = [
    ...tags(html, "script").map((tag) => ({ tag, attributes: ["src"] })),
    ...tags(html, "img").map((tag) => ({ tag, attributes: ["src", "srcset"] })),
    ...tags(html, "iframe").map((tag) => ({ tag, attributes: ["src"] })),
    ...tags(html, "source").map((tag) => ({ tag, attributes: ["src", "srcset"] })),
    ...tags(html, "video").map((tag) => ({ tag, attributes: ["src", "poster"] })),
    ...tags(html, "audio").map((tag) => ({ tag, attributes: ["src"] })),
    ...tags(html, "object").map((tag) => ({ tag, attributes: ["data"] })),
    ...tags(html, "embed").map((tag) => ({ tag, attributes: ["src"] })),
    ...tags(html, "link")
      .filter((tag) => /\brel\s*=\s*["'][^"']*(?:stylesheet|icon|preload|modulepreload|manifest|apple-touch-icon)[^"']*["']/i.test(tag))
      .map((tag) => ({ tag, attributes: ["href"] }))
  ];

  for (const { tag, attributes } of networkTags) {
    for (const attributeName of attributes) {
      const value = attribute(tag, attributeName);
      if (!value) continue;
      const candidates = attributeName === "srcset"
        ? value.split(",").map((candidate) => candidate.trim().split(/\s+/, 1)[0])
        : [value];
      for (const raw of candidates) {
        if (!raw || raw.startsWith("data:")) continue;
        assert.doesNotMatch(raw, /^(?:https?:)?\/\//i, `Generated page loads a remote initial resource: ${raw}`);
        assert.doesNotMatch(raw, /^(?:javascript|vbscript):/i, `Generated page contains an executable resource URL: ${raw}`);
        const clean = raw.split(/[?#]/, 1)[0].replace(/^\//, "");
        if (clean) references.add(clean);
      }
    }
  }
  return [...references];
}

function compressedTransferSize(relativePath, bytes) {
  return /\.(?:html?|css|js|xml|txt|json)$/i.test(relativePath) ? zlib.gzipSync(bytes).length : bytes.length;
}

function assertPerformanceBudget(route, htmlBuffer) {
  assert.ok(htmlBuffer.length <= htmlBudget, `${route.publicUrl}: HTML exceeds 65 KiB (${htmlBuffer.length})`);
  const html = htmlBuffer.toString("utf8");
  const imageTags = tags(html, "img");
  for (const imageTag of imageTags) {
    assert.ok(attribute(imageTag, "width"), `${route.publicUrl}: image missing width`);
    assert.ok(attribute(imageTag, "height"), `${route.publicUrl}: image missing height`);
  }
  assert.ok((html.match(/\bfetchpriority=["']high["']/gi) ?? []).length <= 1, `${route.publicUrl}: more than one high-priority resource`);
  assert.equal((html.match(/<link\b[^>]*\brel=["']preload["']/gi) ?? []).length, 0, `${route.publicUrl}: unnecessary preload present`);

  let initialTransfer = compressedTransferSize(route.destination, htmlBuffer);
  for (const resource of resourceReferences(html)) {
    const resourcePath = path.join(outputRoot, ...resource.split("/"));
    assert.equal(fs.existsSync(resourcePath), true, `${route.publicUrl}: initial resource missing: ${resource}`);
    const bytes = fs.readFileSync(resourcePath);
    initialTransfer += compressedTransferSize(resource, bytes);
  }
  assert.ok(initialTransfer <= initialTransferBudget, `${route.publicUrl}: initial transfer exceeds 700 KiB (${initialTransfer})`);
  return { route: route.publicUrl, htmlBytes: htmlBuffer.length, initialTransferBytes: initialTransfer };
}

function assertRouteRegistry() {
  assert.equal(BASE_COMMIT, TASK_BASE_COMMIT);
  assert.equal(BASE_COMMIT, "513900768e8cce95a88132cfa1af93eb36e2ac3d");
  assert.deepEqual(FROZEN_PASSTHROUGH_FILES, EXPECTED_FROZEN_PASSTHROUGH_FILES, "Eleventy frozen passthrough registry differs from the independent expected list");
  assert.deepEqual(OWNED_STATIC_FILES, EXPECTED_OWNED_STATIC_FILES, "Eleventy owned-static registry differs from the independent expected list");
  assert.deepEqual(GENERATED_ROUTES, EXPECTED_GENERATED_ROUTES, "Eleventy route registry differs from the independent page contract");
  assert.equal(EXPECTED_GENERATED_ROUTES.length, 8, "Exactly eight HTML routes must be generated");
  assert.equal(EXPECTED_FROZEN_PASSTHROUGH_FILES.length, 40, "Frozen passthrough inventory changed unexpectedly");
  assert.equal(EXPECTED_OWNED_STATIC_FILES.length, 5, "Owned static inventory changed unexpectedly");

  const allEntries = [
    ...EXPECTED_FROZEN_PASSTHROUGH_FILES.map((destination) => ({ destination })),
    ...EXPECTED_OWNED_STATIC_FILES.map((destination) => ({ destination })),
    ...EXPECTED_GENERATED_ROUTES
  ];
  assertUniqueDestinations(allEntries);

  for (const route of EXPECTED_GENERATED_ROUTES) {
    const sourcePath = path.join(root, ...route.source.split("/"));
    assert.equal(fs.existsSync(sourcePath), true, `Generated route source missing: ${route.source}`);
    const source = fs.readFileSync(sourcePath, "utf8");
    const permalink = firstMatch(source, /^permalink:\s*([^\r\n]+)$/m, `${route.source} permalink`).trim();
    assert.equal(permalink, route.destination, `${route.source}: permalink differs from registry`);
    assert.equal(route.canonical.includes(".html"), false, `${route.publicUrl}: canonical contains .html`);
    assert.ok(route.canonical.startsWith("https://solvex-ai3d.com"), `${route.publicUrl}: canonical is not production`);
  }

  const actualPageSources = fs.readdirSync(path.join(root, "src"), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".njk"))
    .map((entry) => `src/${entry.name}`)
    .sort();
  assert.deepEqual(actualPageSources, EXPECTED_GENERATED_ROUTES.map((route) => route.source).sort(), "Routable Nunjucks source inventory differs from the independent registry");
}

function assertRuntimeAndPublishContract() {
  assert.equal(process.version, "v22.23.2", "Verification must run with exact Node 22.23.2");
  assert.match(process.env.npm_config_user_agent ?? "", /^npm\/10\.9\.8\b/, "Verification must run through exact npm 10.9.8");
  assert.equal(fs.readFileSync(path.join(root, ".nvmrc"), "utf8").trim(), "22.23.2", ".nvmrc must pin Node 22.23.2");

  const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const installedEleventy = JSON.parse(fs.readFileSync(path.join(root, "node_modules", "@11ty", "eleventy", "package.json"), "utf8"));
  assert.equal(packageJson.devDependencies?.["@11ty/eleventy"], "3.1.6", "package.json must pin Eleventy 3.1.6");
  assert.equal(installedEleventy.version, "3.1.6", "Installed Eleventy version must be 3.1.6");
  assert.equal(packageJson.scripts?.build, "node -e \"require('node:fs').rmSync('_site',{recursive:true,force:true})\" && eleventy", "Canonical build command changed");

  const netlify = fs.readFileSync(path.join(root, "netlify.toml"), "utf8");
  assert.match(netlify, /^\s*command\s*=\s*["']npm run build["']\s*$/m, "Netlify build command must be npm run build");
  assert.match(netlify, /^\s*publish\s*=\s*["']_site["']\s*$/m, "Netlify publish directory must be _site");
  const verifyTarget = process.env.SOLVEX_VERIFY_TARGET ?? "candidate";
  assert.ok(["candidate", "staging"].includes(verifyTarget), `Unknown SOLVEX_VERIFY_TARGET: ${verifyTarget}`);
  if (verifyTarget === "candidate") {
    assert.doesNotMatch(netlify, /X-Robots-Tag|noindex/i, "Production candidate must not contain staging noindex policy");
  } else {
    assert.equal((netlify.match(/X-Robots-Tag\s*=\s*["']noindex, nofollow, noarchive, nosnippet["']/g) ?? []).length, 1, "Staging must contain the exact global noindex policy once");
    assert.match(netlify, /\[\[headers\]\][\s\S]*?for\s*=\s*["']\/\*["'][\s\S]*?\[headers\.values\]/, "Staging noindex policy must apply globally");
  }
}

assert.throws(() => assertMeasurementMode(undefined), /Unknown or missing measurement mode/);
assert.throws(() => assertMeasurementMode({ mode: "unknown" }), /Unknown or missing measurement mode/);
assert.throws(() => assertUniqueDestinations([{ destination: "A.html" }, { destination: "a.HTML" }]), /Duplicate output route/);
assertRuntimeAndPublishContract();
assertRouteRegistry();

const measurement = JSON.parse(fs.readFileSync(path.join(root, "src", "_data", "measurement.json"), "utf8"));
assertMeasurementMode(measurement);
assert.equal(measurement.mode, "legacy-direct");

const siteShellSource = fs.readFileSync(path.join(root, "js", "site-shell.js"), "utf8");
run(process.execPath, ["--check", path.join(root, "js", "site-shell.js")]);
run(process.execPath, ["--check", path.join(root, "tests", "no-js-smoke-server.mjs")]);
assert.doesNotMatch(siteShellSource, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|\.submit\s*\(|requestSubmit|createElement\s*\(\s*["']script["']|https?:\/\//i, "site-shell.js must remain UI-only with no network, form submission, or dynamic remote script behavior");

const expectedOutputs = [
  ...EXPECTED_FROZEN_PASSTHROUGH_FILES,
  ...EXPECTED_OWNED_STATIC_FILES,
  ...EXPECTED_GENERATED_ROUTES.map((route) => route.destination)
];
assert.equal(expectedOutputs.length, 53, "Expected output count changed unexpectedly");

const frozenEvidence = [];
const ownedEvidence = [];
const performanceEvidence = [];

function verifyBuiltOutput() {
  const builtInventory = inventory();
  const inventoryComparison = compareInventories(expectedOutputs, builtInventory.rows.map((row) => row.path));
  assert.deepEqual(inventoryComparison.missing, [], "Published output has missing paths");
  assert.deepEqual(inventoryComparison.extra, [], "Published output has extra paths");
  assert.deepEqual(inventoryComparison.duplicates, [], "Published output has duplicate paths");

  const titles = new Set();
  const descriptions = new Set();
  const canonicals = new Set();
  const currentPerformance = [];
  for (const route of EXPECTED_GENERATED_ROUTES) {
    const htmlPath = path.join(outputRoot, ...route.destination.split("/"));
    const htmlBuffer = fs.readFileSync(htmlPath);
    const html = htmlBuffer.toString("utf8");
    assertGeneratedPageContract(route, html);
    currentPerformance.push(assertPerformanceBudget(route, htmlBuffer));

    const title = stripMarkup(firstMatch(html, /<title>([\s\S]*?)<\/title>/i, `${route.publicUrl} title`));
    const description = metaContent(html, "name", "description");
    const canonical = linkHref(html, "canonical");
    assert.equal(titles.has(title), false, `${route.publicUrl}: duplicate title`);
    assert.equal(descriptions.has(description), false, `${route.publicUrl}: duplicate description`);
    assert.equal(canonicals.has(canonical), false, `${route.publicUrl}: duplicate canonical`);
    titles.add(title);
    descriptions.add(description);
    canonicals.add(canonical);
  }

  const missing = missingLinks(expectedOutputs);
  const expectedKnownMissing = [
    "siti-web-custom-seo.html|src|placeholder-landing-page.html|placeholder-landing-page.html",
    "siti-web-custom-seo.html|src|placeholder-landing-page.html|placeholder-landing-page.html"
  ];
  assert.deepEqual(missing, expectedKnownMissing, "Local-link defects differ from the two frozen placeholder references");
  assertLocalFragments(expectedOutputs);

  const sitemap = fs.readFileSync(path.join(outputRoot, "sitemap.xml"), "utf8");
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(sitemapUrls, exactSitemapUrls, "Sitemap URL set or order changed");
  assert.equal(new Set(sitemapUrls).size, sitemapUrls.length, "Sitemap contains duplicate URLs");
  assert.doesNotMatch(sitemap, /staging|\.html<\/loc>|richiesta-ricevuta|404|\/src|\/tests/i, "Sitemap contains a forbidden URL");

  for (const file of expectedOutputs) {
    const segments = file.toLowerCase().split("/");
    assert.equal(segments.some((segment) => new Set(["src", "tests", "node_modules", ".git", "reports", "report", "_site"]).has(segment)), false, `Forbidden publish path: ${file}`);
    assert.equal(["package.json", "package-lock.json", "netlify.toml", ".nvmrc", "eleventy.config.js"].includes(file.toLowerCase()), false, `Forbidden publish file: ${file}`);
  }

  const contact = fs.readFileSync(path.join(outputRoot, "contattaci.html"), "utf8");
  const configurator = fs.readFileSync(path.join(outputRoot, "configuratori-3d-2d.html"), "utf8");
  assert.equal((contact.match(/name=["']contact-main["']/g) ?? []).length, 1, "contact-main form missing or duplicated");
  assert.equal((configurator.match(/name=["']mini-demo-configuratori["']/g) ?? []).length, 1, "mini-demo-configuratori form missing or duplicated");
  for (const [label, html, formName] of [["contact", contact, "contact-main"], ["configurator", configurator, "mini-demo-configuratori"]]) {
    assert.match(html, /data-netlify=["']true["']/i, `${label}: Netlify form marker missing`);
    assert.match(html, new RegExp(`name=["']form-name["'][^>]*value=["']${formName}["']`, "i"), `${label}: hidden form-name missing`);
    assert.match(html, /name=["']lead_id["']/i, `${label}: lead_id missing`);
  }
  assert.match(configurator, /assets\/iphone_16_pro_configuratore_3d\.glb/i, "Configurator GLB reference missing");

  return { builtInventory, inventoryComparison, currentPerformance };
}

run("git", ["-c", `safe.directory=${root}`, "diff", "--quiet", "--no-ext-diff", BASE_COMMIT, "--", ...EXPECTED_FROZEN_PASSTHROUGH_FILES]);

buildFromAbsentOutput();

for (const file of EXPECTED_FROZEN_PASSTHROUGH_FILES) {
  const source = fs.readFileSync(path.join(root, ...file.split("/")));
  const output = fs.readFileSync(path.join(outputRoot, ...file.split("/")));
  const baseline = readGitBlobBuffer(BASE_COMMIT, file, root);
  const sourceObjectId = cleanFilteredObjectId(file, file);
  const outputObjectId = cleanFilteredObjectId(file, path.join("_site", ...file.split("/")));
  const rawCopy = compareRawBuffers(source, output, `Frozen passthrough ${file}`);
  assert.equal(sourceObjectId, baseline.objectId, `Frozen source differs from Git base: ${file}`);
  assert.equal(outputObjectId, baseline.objectId, `Frozen output differs from Git base: ${file}`);
  frozenEvidence.push({
    file,
    baseObjectId: baseline.objectId,
    sourceObjectId,
    outputObjectId,
    sourceSha256: sha256(source),
    outputSha256: sha256(output),
    result: rawCopy.result
  });
}

for (const file of EXPECTED_OWNED_STATIC_FILES) {
  const source = fs.readFileSync(path.join(root, ...file.split("/")));
  const output = fs.readFileSync(path.join(outputRoot, ...file.split("/")));
  const comparison = compareRawBuffers(source, output, `Owned static ${file}`);
  ownedEvidence.push({ file, bytes: source.length, sha256: sha256(source), result: comparison.result });
}

const firstVerification = verifyBuiltOutput();

buildFromAbsentOutput();
const secondVerification = verifyBuiltOutput();
assert.deepEqual(secondVerification.builtInventory, firstVerification.builtInventory, "Two clean consecutive builds are not byte-for-byte reproducible");
performanceEvidence.push(...secondVerification.currentPerformance);

const binaryPostBuildEvidence = verifyRealBinaryOutputs({ root, outputRoot, baseRef: BASE_COMMIT });

const configuratorFreezeEvidence = configuratorProtectedFiles.map((file) => {
  const frozen = frozenEvidence.find((entry) => entry.file === file);
  assert.ok(frozen, `Configurator protected file is not frozen passthrough: ${file}`);
  const baseObjectId = gitBlobObjectId(file);
  assert.equal(frozen.sourceObjectId, baseObjectId, `Configurator source identity changed: ${file}`);
  assert.equal(frozen.outputObjectId, baseObjectId, `Configurator output identity changed: ${file}`);
  return { file, baseObjectId, sourceSha256: frozen.sourceSha256, outputSha256: frozen.outputSha256, result: "PASS" };
});

const sharedCssFiles = [
  "css/foundation.css",
  "css/site-shell.css",
  "css/marketing-pages.css",
  "css/cookie-banner.css"
];
const sharedCssGzipBytes = sharedCssFiles.reduce((total, file) => {
  const css = fs.readFileSync(path.join(root, ...file.split("/")));
  assert.doesNotMatch(css.toString("utf8"), /@import\s+url\s*\(\s*["']?(?:https?:)?\/\/|url\s*\(\s*["']?(?:https?:)?\/\//i, `${file}: remote CSS resource forbidden`);
  return total + zlib.gzipSync(css).length;
}, 0);
const shellJsGzipBytes = zlib.gzipSync(fs.readFileSync(path.join(root, "js", "site-shell.js"))).length;
assert.ok(sharedCssGzipBytes <= sharedCssGzipBudget, `Shared CSS exceeds 45 KiB gzip (${sharedCssGzipBytes})`);
assert.ok(shellJsGzipBytes <= shellJsGzipBudget, `Shell JS exceeds 30 KiB gzip (${shellJsGzipBytes})`);

const frozenManifestSha256 = sha256(Buffer.from(frozenEvidence
  .map((entry) => `${entry.file}\0${entry.baseObjectId}`)
  .sort()
  .join("\n"), "utf8"));

const summary = {
  result: "PASS",
  node: process.version,
  npm: (process.env.npm_config_user_agent ?? "").split(" ")[0],
  verifyTarget: process.env.SOLVEX_VERIFY_TARGET ?? "candidate",
  baseCommit: BASE_COMMIT,
  outputCount: secondVerification.builtInventory.rows.length,
  frozenPassthroughCount: EXPECTED_FROZEN_PASSTHROUGH_FILES.length,
  ownedStaticCount: EXPECTED_OWNED_STATIC_FILES.length,
  generatedRouteCount: EXPECTED_GENERATED_ROUTES.length,
  aggregateSha256: secondVerification.builtInventory.aggregate,
  twoBuildReproducibility: "PASS",
  publishBoundary: "PASS",
  localLinks: "PASS_WITH_TWO_FROZEN_PLACEHOLDER_REFERENCES",
  seoAndSchema: "PASS",
  contentContract: "PASS",
  measurementMode: measurement.mode,
  generatedPagesGoogleConnectionHints: 0,
  generatedPagesChatbotRuntime: 0,
  legalContentFreeze: "PASS",
  configuratorVisualFreeze: "PASS",
  contactAndLegacyFreeze: "PASS",
  frozenManifestSha256,
  sharedCssGzipBytes,
  shellJsGzipBytes,
  performanceEvidence,
  binarySafeVerifier: "PASS",
  binaryPostBuildEvidence,
  configuratorFreezeEvidence,
  ownedEvidence,
  inventory: secondVerification.inventoryComparison
};

console.log(`VERIFY_SUMMARY=${JSON.stringify(summary)}`);
