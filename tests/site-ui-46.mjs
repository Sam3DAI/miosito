import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nunjucks from "nunjucks";
import details from "../src/_data/cardDetails46.js";
import { decodeHtmlCharacterReferences } from "./html-contract.mjs";

export const root46 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const detailCounts46 = Object.freeze({ home: 23, about: 13, configurators: 12, ecommerce: 16, cpq: 21, planner: 19, automation: 23, contact: 2 });
export const detailGroups46 = Object.freeze({ home: [4, 3, 2, 8, 6], about: [1, 3, 3, 6], configurators: [4, 5, 3], ecommerce: [4, 6, 6], cpq: [3, 9, 3, 6], planner: [4, 9, 6], automation: [9, 8, 6], contact: [2] });
const read = file => fs.readFileSync(path.join(root46, file), "utf8");
const plain = text => decodeHtmlCharacterReferences(text.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
const attr = (tag, name) => tag.match(new RegExp('(?:^|\\s)' + name + '="([^"]*)"'))?.[1];

export function assertDetailInventory46(data = details) {
  assert.deepEqual(Object.keys(data.pages), Object.keys(detailCounts46));
  const entries = [];
  for (const [pageKey, groups] of Object.entries(data.pages)) {
    assert.deepEqual(Object.values(groups).map(list => list.length), detailGroups46[pageKey], pageKey + ": every editorial family");
    for (const [group, list] of Object.entries(groups)) for (const entry of list) {
      assert.match(entry.id, /^[a-z0-9-]+$/);
      assert.equal(entry.key, `${data.routes[pageKey]}#${group}/${entry.id}`);
      assert.equal(entry.domId, `detail-${pageKey}-${group}-${entry.id}`);
      assert.ok(entry.title.trim());
      const words = entry.text.split(/\s+/u).length;
      assert.ok(words >= 45 && words <= 90, entry.key + ": useful, bounded copy");
      assert.ok(entry.text !== entry.title);
      assert.doesNotMatch(entry.text, /<[^>]+>|\b(?:Review|AggregateRating)\b|\bROI\b/);
      assert.equal(entry.cta, "Richiedi un preventivo");
      assert.equal(entry.href, "/contattaci#contatti");
      entries.push(entry);
    }
  }
  assert.equal(entries.length, 129);
  assert.equal(new Set(entries.map(e => e.key)).size, 129);
  assert.equal(new Set(entries.map(e => e.domId)).size, 129);
  assert.deepEqual(data.inventory.map(i => i.key), entries.map(e => e.key));
  return { occurrences: entries.length, pages: detailCounts46, wordRange: [Math.min(...entries.map(e => e.text.split(/\s+/u).length)), Math.max(...entries.map(e => e.text.split(/\s+/u).length))] };
}

export function renderRoute46(pageKey) {
  const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(root46, "src/_includes")), { autoescape: false });
  env.addFilter("json", value => JSON.stringify(value));
  const file = pageKey === "home" ? "index" : details.routes[pageKey].slice(1);
  const source = read(`src/${file}.njk`).replace(/^---[\s\S]*?\r?\n---\r?\n/, "");
  const json = name => JSON.parse(read(`src/_data/${name}.json`));
  return env.renderString(source, {
    pageKey, mainId: "main-content", title: "UI46 local render", canonical: "https://solvex-ai3d.com" + details.routes[pageKey],
    openGraph: {}, twitter: {}, site: json("site"), navigation: json("navigation"), measurement: json("measurement"),
    originalImages31: json("originalImages31"), serviceDemos: json("serviceDemos"), projectProofs: json("projectProofs"), cardDetails46: details
  });
}

export function assertUi46Html(pageKey, html) {
  const entries = Object.values(details.pages[pageKey]).flat();
  const fallbacks = [...html.matchAll(/<details class="card-detail"[^>]*>[\s\S]*?<\/details>/g)].map(m => m[0]);
  assert.equal(fallbacks.length, detailCounts46[pageKey], pageKey + ": complete fallback inventory");
  for (const entry of entries) {
    const matches = fallbacks.filter(block => attr(block.split(">")[0], "id") === entry.domId);
    assert.equal(matches.length, 1, entry.key + ": one stable occurrence");
    const block = matches[0];
    assert.equal(decodeHtmlCharacterReferences(attr(block.split(">")[0], "data-card-detail")), entry.key);
    assert.match(block, /<summary data-detail-trigger aria-label="Dettagli: [^"]+">Dettagli /);
    assert.ok(block.includes("data-detail-content"));
    assert.ok(plain(block).includes(entry.text));
    assert.equal((block.match(/<a\b/g) || []).length, 1);
    assert.ok(block.includes('class="button button--page button--quote" href="/contattaci#contatti"'));
    assert.doesNotMatch(block.split(">")[0], /\shidden|\sopen/);
  }
  const dialog = html.match(/<dialog class="proof-gallery card-detail-dialog"[\s\S]*?<\/dialog>/)?.[0];
  assert.ok(dialog, "Shared native detail dialog exists");
  assert.match(dialog, /aria-labelledby="card-detail-dialog-title"/);
  assert.equal((dialog.match(/<h3\b/g) || []).length, 1);
  assert.match(dialog, /data-gallery-close aria-label="Chiudi i dettagli" autofocus/);
  assert.doesNotMatch(dialog, /data-detail-content/, "SSR content is not duplicated inside the dialog");
  for (const form of html.match(/<form\b[\s\S]*?<\/form>/g) || []) assert.doesNotMatch(form, /data-detail-trigger|data-project-trigger/);
  for (const faq of html.match(/<details class="faq-item"[\s\S]*?<\/details>/g) || []) assert.doesNotMatch(faq, /data-detail-trigger/);
  for (const link of html.match(/<a\b[\s\S]*?<\/a>/g) || []) assert.doesNotMatch(link.slice(link.indexOf(">") + 1), /<(?:a|button|summary|details)\b/, "Direct links have no nested controls");
  for (const link of html.match(/<a\b[^>]*>[\s\S]*?<\/a>/g) || []) {
    if (plain(link).startsWith("Richiedi un preventivo")) assert.ok(attr(link.split(">")[0], "class").split(" ").includes("button--quote"));
  }
  assert.equal((html.match(/src="\/js\/project-proof-galleries.js"/g) || []).length, 1, "One dialog engine");
  if (pageKey === "home") {
    const section = html.match(/<section[^>]*aria-labelledby="direct-title"[\s\S]*?<\/section>/)[0];
    const lead = section.match(/<div class="split-panel__lead">[\s\S]*?<\/div>/)[0];
    const body = section.match(/<div class="split-panel__body">[\s\S]*?<\/div>/)[0];
    assert.match(lead, /<h2[\s\S]*?<\/h2>\s*<p>SolveX mantiene/);
    assert.doesNotMatch(body, /<p>/);
    assert.match(body, /<ul class="check-list">/);
    assert.equal((section.match(/SolveX mantiene/g) || []).length, 1);
  }
  if (pageKey === "configurators") {
    const heading = html.match(/<h2 id="demo-title">([\s\S]*?)<\/h2>/)?.[1];
    assert.ok(heading);
    assert.equal(plain(heading), "Demo 3D. Anche in Realtà Aumentata.");
    assert.equal((heading.match(/class="statement-line"/g) || []).length, 2);
    assert.doesNotMatch(heading, /<br/);
    assert.equal((html.match(/class="visual-card__service-link"/g) || []).length, 4);
  }
  return { pageKey, details: fallbacks.length, engine: "SHARED_NATIVE_DIALOG", noJs: "NATIVE_DETAILS" };
}

export function contrast46(a, b) {
  const luminance = hex => hex.replace("#", "").match(/../g).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}

export function assertUi46Css({ foundation = read("css/foundation.css"), gallery = read("css/project-proof-galleries.css"), marketing = read("css/marketing-pages.css"), hub = read("css/configuratori-3d-2d.css") } = {}) {
  assert.match(foundation, /--sx-blue: #45b6fe;/);
  assert.match(foundation, /--sx-blue-deep: light-dark\(#006eac, #45b6fe\)/, "Readable day text is not replaced by brand fill");
  assert.match(foundation, /\.button\.button--quote \{\s*border: 1px solid transparent;/);
  assert.match(foundation, /padding-box, var\(--sx-gradient\) border-box/);
  assert.match(foundation, /\.button\.button--quote\.button--secondary:focus-visible \{[\s\S]*?color: #1d1d1f;[\s\S]*?outline: 3px solid var\(--sx-blue-deep\)/);
  assert.match(foundation, /forced-colors: active[\s\S]*?\.button\.button--quote[\s\S]*?ButtonText[\s\S]*?ButtonFace/);
  assert.match(gallery, /\.project-proof-rail \.visual-card-rail__track \{ align-items: stretch; \}/);
  assert.match(gallery, /\.project-proof-rail \.visual-card__inner \{[^}]*height: 100%/);
  assert.match(gallery, /\.project-proof-rail \.project-media \{[^}]*aspect-ratio: 16 \/ 9/);
  assert.match(gallery, /\.project-proof-rail \.project-media img \{[^}]*width: 100%; height: 100%;[^}]*object-fit: contain/);
  assert.match(gallery, /\.proof-gallery \{[^}]*overflow: auto;/);
  assert.match(gallery, /\.proof-gallery__body--project \{[^}]*grid-template-columns: minmax\(0, 1fr\) 15\.5rem/);
  assert.match(gallery, /\.proof-gallery__header \{ position: sticky; top: 0;/);
  assert.doesNotMatch(gallery, /\.proof-gallery(?:__body)?\s*\{[^}]*overflow:\s*hidden/);
  assert.match(gallery, /prefers-reduced-motion: reduce[\s\S]*animation: none/);
  assert.match(marketing, /\.split-panel--home-custom,\s*\.split-panel--centered-process \{[^}]*text-align: center/);
  assert.match(marketing, /\.split-panel--centered-process \.split-panel__body \{[^}]*margin-inline: auto/);
  assert.match(hub, /\.configurator-container \{ grid-template-columns: minmax\(0, 1\.35fr\) minmax\(0, 1fr\)/);
  const results = {
    dayText: contrast46("#1d1d1f", "#f5f5f7"), nightText: contrast46("#f5f5f7", "#000000"),
    hoverBlue: contrast46("#1d1d1f", "#45b6fe"), hoverMagenta: contrast46("#1d1d1f", "#d95bc5"),
    focusDay: contrast46("#006eac", "#ffffff"), focusNight: contrast46("#45b6fe", "#1d1d1f"),
    brandAsDayTextRejected: contrast46("#45b6fe", "#f5f5f7")
  };
  for (const key of ["dayText", "nightText", "hoverBlue", "hoverMagenta"]) assert.ok(results[key] >= 4.5, key + ": text AA");
  for (const key of ["focusDay", "focusNight"]) assert.ok(results[key] >= 3, key + ": focus contrast");
  assert.ok(results.brandAsDayTextRejected < 3);
  // Check every integer interpolation step, not only gradient endpoints.
  for (let step = 0; step <= 100; step++) {
    const color = "#" + [[69, 217], [182, 91], [254, 197]].map(([a, b]) => Math.round(a + (b - a) * step / 100).toString(16).padStart(2, "0")).join("");
    assert.ok(contrast46("#1d1d1f", color) >= 4.5, "Readable quote text throughout hover gradient");
  }
  return results;
}
