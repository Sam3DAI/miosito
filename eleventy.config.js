import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export const BASE_COMMIT = "5050545994cb2b3b515063a966369d6ac8f1532c";

export const PASSTHROUGH_FILES = Object.freeze([
  "404.html",
  "_redirects",
  "assets/iphone_16_pro_configuratore_3d.glb",
  "automazioni-ai-business.html",
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
  "index.html",
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
  "sitemap.xml",
  "siti-web-custom-seo.html"
]);

export const MIGRATED_ROUTES = Object.freeze([
  Object.freeze({
    source: "src/privacy-policy.njk",
    baseline: "privacy-policy.html",
    destination: "privacy-policy.html",
    publicUrl: "/privacy-policy",
    canonical: "https://solvex-ai3d.com/privacy-policy"
  }),
  Object.freeze({
    source: "src/termini-condizioni.njk",
    baseline: "termini-condizioni.html",
    destination: "termini-condizioni.html",
    publicUrl: "/termini-condizioni",
    canonical: "https://solvex-ai3d.com/termini-condizioni"
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

  const destinations = [
    ...PASSTHROUGH_FILES.map((file) => ({ destination: file })),
    ...MIGRATED_ROUTES
  ];
  assertUniqueDestinations(destinations);

  for (const file of PASSTHROUGH_FILES) {
    const sourcePath = path.join(projectRoot, file);
    if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) {
      throw new Error(`Missing passthrough allowlist source: ${file}`);
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
