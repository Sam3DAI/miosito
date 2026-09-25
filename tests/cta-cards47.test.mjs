import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import test from "node:test";
import data from "../src/_data/cardDetails46.js";
import { root46, renderRoute46 } from "./site-ui-46.mjs";
import { dialogFixture46 } from "./dialog-ui-46-fixture.mjs";
import { decodeHtmlCharacterReferences } from "./html-contract.mjs";

const read = file => fs.readFileSync(path.join(root46, file), "utf8").replace(/\r\n/g, "\n");
const attr = (tag, name) => tag.match(new RegExp('(?:^|\\s)' + name + '="([^"]*)"'))?.[1];
const plain = html => decodeHtmlCharacterReferences(html.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
const rows = value => Object.values(value.pages).flatMap(groups => Object.values(groups).flat());
// Read independently from887198eb before editing. Only the declared semantic
// presentation changes; not one word, href or editorial occurrence is replaced.
const baselineCopyHash = "f13d813f02d35ba100ab8fa6e582cd928f7d949fed9c0afa77315775a9da9ca0";
const detailCounts = { home: 18, about: 13, configurators: 8, ecommerce: 16, cpq: 21, planner: 19, automation: 23, contact: 2 };
const navigation = {
  home: ["/configuratori-ecommerce", "/software-cpq-portali-commerciali", "/planner-configuratori-arredamento", "/configuratori-3d-2d", "/automazioni-ai-business"],
  configurators: ["/configuratori-ecommerce", "/software-cpq-portali-commerciali", "/software-cpq-portali-commerciali", "/planner-configuratori-arredamento"]
};

function assertCopy(value) {
  const entries = rows(value);
  const projection = entries.map(({ key, title, text, href, cta }) => ({ key, title, text, href, cta }));
  assert.equal(createHash("sha256").update(JSON.stringify(projection)).digest("hex"), baselineCopyHash);
  assert.equal(entries.length, 129);
  for (const entry of entries) {
    assert.ok(entry.paragraphs.length >= 2 && entry.paragraphs.length <= 4, entry.key);
    assert.equal(entry.paragraphs.join(" "), entry.text, entry.key);
    for (const paragraph of entry.paragraphs) assert.match(paragraph, /^[^<>]+[.!?]$/u);
    assert.ok(["detail", "navigate"].includes(entry.action));
  }
  assert.equal(entries.filter(entry => entry.action === "detail").length, 120);
  assert.equal(entries.filter(entry => entry.action === "navigate").length, 9);
}

function assertRoles(html) {
  const controls = [...html.matchAll(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/g)]
    .filter(match => /\bbutton--(?:page|menu|submit)\b/.test(attr(match[2], "class") || ""));
  assert.ok(controls.length >= 3);
  for (const [, tag, attributes, contents] of controls) {
    const role = attr(attributes, "data-cta-role");
    const classes = (attr(attributes, "class") || "").split(/\s+/);
    assert.ok(["quote", "explore"].includes(role), plain(contents));
    assert.ok(classes.includes("button--" + role));
    assert.ok(!classes.includes(role === "quote" ? "button--explore" : "button--quote"));
    if (role === "quote" && tag === "a") assert.match(attr(attributes, "href"), /^\/contattaci(?:#contatti)?$/);
    if (role === "explore") {
      assert.doesNotMatch(attr(attributes, "href") || "", /^\/contattaci/);
      if ((attr(attributes, "href") || "").startsWith("#")) { assert.match(contents, /↓/); assert.doesNotMatch(contents, /↗/); }
    }
    if (attr(attributes, "type") === "submit") assert.equal(role, "quote");
  }
  for (const group of html.match(/<div class="cta-group">[\s\S]*?<\/div>/g) || []) {
    const roles = [...group.matchAll(/data-cta-role="([^"]+)"/g)].map(match => match[1]);
    if (roles.includes("quote") && roles.includes("explore")) assert.deepEqual(roles, ["quote", "explore"], "DOM and focus order, no CSS inversion");
  }
  return controls;
}

function assertCards(key, html) {
  const links = [...html.matchAll(/<a\b(?=[^>]*\bdata-card-navigation\b)[^>]*>[\s\S]*?<\/a>/g)].map(match => match[0]);
  assert.deepEqual(links.map(link => attr(link.split(">", 1)[0], "href")), navigation[key] || []);
  for (const link of links) {
    assert.doesNotMatch(link, /data-card-detail|data-detail-trigger|<button\b|<summary\b|onclick\s*=|Esplora il servizio|Dettagli/);
    assert.match(link, /<h3\b/);
    assert.match(link, /<p\b/);
  }
  const blocks = [...html.matchAll(/<details class="card-detail"[^>]*>[\s\S]*?<\/details>/g)].map(match => match[0]);
  assert.equal(blocks.length, detailCounts[key]);
  const expected = Object.values(data.pages[key]).flat().filter(entry => entry.action === "detail");
  for (const entry of expected) {
    const block = blocks.find(item => attr(item.split(">", 1)[0], "id") === entry.domId);
    assert.ok(block, entry.key);
    assert.match(block, /<summary data-detail-trigger aria-label="Approfondisci: [^"]+">/);
    assert.match(block, /class="card-detail__plus" aria-hidden="true"><svg/);
    assert.equal((block.match(/<summary\b/g) || []).length, 1);
    assert.equal((block.match(/<p>/g) || []).length, entry.paragraphs.length);
    for (const paragraph of entry.paragraphs) assert.ok(plain(block).includes(paragraph), entry.key);
    assert.match(block, /class="card-detail__cta"><a[^>]+data-cta-role="quote"/);
    assert.doesNotMatch(block.split(">", 1)[0], /\shidden|\sopen/);
  }
  for (const control of html.match(/<(?:a|button)\b[^>]*>[\s\S]*?<\/(?:a|button)>/g) || []) {
    assert.doesNotMatch(control.slice(control.indexOf(">") + 1), /<(?:button|summary|input|details)\b/);
  }
}

function assertCss({ foundation = read("css/foundation.css"), gallery = read("css/project-proof-galleries.css") } = {}) {
  assert.match(foundation, /\.button\.button--quote \{\s*border: 1px solid transparent;/);
  assert.match(foundation, /\.button\.button--explore \{\s*border: 1px solid var\(--sx-pink\);\s*background: transparent;\s*color: var\(--sx-text-pink\)/);
  const focus = foundation.match(/\.button\.button--quote:focus-visible,[\s\S]*?\n\}/)?.[0];
  assert.ok(focus); assert.match(focus, /outline: 3px solid/); assert.doesNotMatch(focus, /background:|transform:/);
  assert.match(foundation, /\.button\.button--quote:not\(:disabled\):active \{ background: var\(--sx-gradient\) border-box; color: #1d1d1f; \}/);
  assert.match(foundation, /\.button\.button--explore:not\(:disabled\):active \{ background: var\(--sx-pink\); color: #fff; \}/);
  assert.match(foundation, /@media \(hover: hover\) and \(pointer: fine\) \{[\s\S]*?button--explore:not\(:disabled\):hover \{ background: var\(--sx-pink\); color: #fff;/);
  assert.doesNotMatch(foundation, /\.button--page:focus-visible\s*,[\s\S]*?background: var\(--sx-gradient\)/);
  assert.match(gallery, /\.proof-gallery::backdrop \{ background: #000a; \}/);
  assert.match(gallery, /@supports \(backdrop-filter: blur\(8px\)\)/);
  assert.match(gallery, /font-size: clamp\(1\.6rem, 2\.5vw, 2\.5rem\)/);
  assert.match(gallery, /\.proof-gallery__cta, \.card-detail__cta \{ display: flex; justify-content: center;/);
  assert.match(gallery, /\.proof-gallery__close svg \{ display: block; width: 20px; height: 20px;/);
  assert.match(gallery, /\.card-detail__content > p \{ margin: 0 0 1\.65em;/);
  assert.match(gallery, /\.visual-card--text \.card-detail \{ margin-top: auto; align-self: flex-end; \}/);
  assert.match(gallery, /\.visual-card__copy \.card-detail \{ margin-top: 0; align-self: flex-start; \}/);
}

test("CTA47 all129 records preserve baseline copy and59 explicit editorial paragraph groups", () => assertCopy(data));
test("CTA47 copy negatives reject a changed word, deleted occurrence and blind paragraph split", () => {
  for (const mutate of [d => d.pages.home.process[0].text += " Promessa.", d => d.pages.about.focus.pop(), d => d.pages.home.process[0].paragraphs = [d.pages.home.process[0].text]]) {
    const changed = structuredClone(data); mutate(changed); assert.throws(() => assertCopy(changed));
  }
});
for (const key of Object.keys(detailCounts)) test("CTA47 " + key + ": semantic roles, native links and one informative trigger", () => {
  const html = renderRoute46(key); assertRoles(html); assertCards(key, html);
});
test("CTA47 exactly six submit controls retain submit type and quote style", () => {
  const submits = Object.keys(detailCounts).flatMap(key => [...renderRoute46(key).matchAll(/<button\b[^>]*type="submit"[^>]*>/g)].map(match => match[0]));
  assert.equal(submits.length, 6);
  for (const submit of submits) { assert.equal(attr(submit, "data-cta-role"), "quote"); assert.match(attr(submit, "class"), /button--submit button--quote/); }
});
test("CTA47 roles negatives reject wrong family, reversed DOM order and wrong internal arrow", () => {
  const html = renderRoute46("ecommerce");
  const group = html.match(/<div class="cta-group">[\s\S]*?<\/div>/)[0];
  const links = group.match(/<a\b[\s\S]*?<\/a>/g);
  for (const changed of [html.replace('data-cta-role="quote"', 'data-cta-role="explore"'), html.replace(group, '<div class="cta-group">' + links.reverse().join("") + '</div>'), html.replace(/(href="#demo-form">[\s\S]*?aria-hidden="true">)↓/, "$1↗")]) {
    assert.notEqual(changed, html); assert.throws(() => assertRoles(changed));
  }
});
test("CTA47 card negatives reject intercepted navigation and a missing informative fallback", () => {
  const html = renderRoute46("configurators");
  for (const changed of [html.replace("data-card-navigation", 'data-card-navigation onclick="openDetail()"'), html.replace('data-card-navigation href="/configuratori-ecommerce"', 'data-card-navigation href="/new-service"'), html.replace('class="card-detail"', 'class="missing-detail"')]) {
    assert.notEqual(changed, html); assert.throws(() => assertCards("configurators", changed));
  }
});
test("CTA47 exact CSS roles, centered dialog CTA, SVG close and image/text plus placement", () => assertCss());
test("CTA47 CSS negatives reject thick border, focus fill, blue exploration, hidden blur and uncentered CTA", () => {
  const foundation = read("css/foundation.css"), gallery = read("css/project-proof-galleries.css");
  for (const changed of [{ foundation: foundation.replace("border: 1px solid transparent;", "border: 2px solid transparent;") }, { foundation: foundation.replace(".button.button--explore:focus-visible {", ".button.button--explore:focus-visible {\n  background: var(--sx-gradient);") }, { foundation: foundation.replace("background: var(--sx-pink); color: #fff;", "background: var(--sx-blue); color: #fff;") }, { gallery: gallery.replace("@supports (backdrop-filter: blur(8px))", "@supports (backdrop-filter: none)") }, { gallery: gallery.replace(".proof-gallery__cta, .card-detail__cta { display: flex; justify-content: center;", ".proof-gallery__cta, .card-detail__cta { display: flex; justify-content: flex-start;") }]) {
    const field = Object.keys(changed)[0];
    assert.notEqual(changed[field], { foundation, gallery }[field], "Negative CSS fixture must actually mutate the current declaration");
    assert.throws(() => assertCss(changed));
  }
});

test("CTA47 whole informative surface and keyboard open once then restore the summary focus", () => {
  const f = dialogFixture46();
  assert.equal(f.summary.attrs.role, "button");
  assert.equal(f.card.attrs["data-card-interactive"], "detail");
  f.click(f.cardText); assert.equal(f.detailDialog.open, true); assert.equal(f.content.parent, "dialog");
  f.click(f.summary); assert.equal(f.content.parent, "dialog");
  assert.equal(f.detailDialog.showCalls, 1, "Surface click followed by summary activation must not open or mount twice");
  f.detailDialog.close(); assert.equal(f.content.parent, "fallback"); assert.equal(f.document.activeElement, f.summary);
  for (const key of ["Enter", " "]) {
    const event = f.summary.emit("keydown", { key }); assert.equal(event.prevented, true); assert.equal(f.detailDialog.open, true);
    f.detailDialog.close();
  }
  f.summary.emit("keydown", { key: " ", repeat: true }); assert.equal(f.detailDialog.open, false);
});
test("CTA47 stacking negative demonstrates that removing the open guard permits a duplicate opening", () => {
  const source = read("js/project-proof-galleries.js");
  const code = source.replace("      if (anotherSurfaceOpen(dialog)) return false;", "      // deliberately broken stacking guard");
  assert.notEqual(code, source, "The negative must remove the actual shared open guard");
  const f = dialogFixture46({ code });
  f.click(f.cardText); f.click(f.summary);
  assert.equal(f.detailDialog.showCalls, 2);
  assert.throws(() => assert.equal(f.detailDialog.showCalls, 1, "A second opening is forbidden"));
});
test("CTA47 navigation or extra interactive controls never acquire the informative surface binding", () => {
  for (const options of [{ navigationCard: true }, { missingCard: true }, { extraCardControl: true }, { duplicateCardDetail: true }]) {
    const f = dialogFixture46(options); assert.equal(f.summary.listeners.has("click"), false);
    assert.notEqual(f.card?.attrs["data-card-interactive"], "detail");
  }
});
test("CTA47 swipe, rail movement, text selection and cancelled pointers do not open a dialog", () => {
  for (const gesture of [f => { f.card.emit("pointerdown", { clientX: 30, clientY: 60 }); f.card.emit("pointermove", { clientX: 45, clientY: 60 }); }, f => { f.card.emit("pointerdown", { clientX: 30, clientY: 60 }); f.track.scrollLeft += 20; }, f => f.window.setSelectionText("Testo selezionato"), f => f.card.emit("pointercancel")]) {
    const f = dialogFixture46(); gesture(f); f.click(f.cardText); assert.equal(f.detailDialog.open, false);
  }
  const f = dialogFixture46(); f.galleryTrigger.emit("pointerdown", { clientX: 30, clientY: 60 }); f.galleryTrigger.emit("pointermove", { clientX: 60, clientY: 60 });
  assert.equal(f.click(f.galleryTrigger).prevented, true); assert.equal(f.gallery.open, false);
});
test("CTA47 drag negative demonstrates that removing the gesture guard reintroduces gallery opening", () => {
  const source = read("js/project-proof-galleries.js");
  const code = source.replace('      if (dragged(event)) { event.preventDefault(); return; }', '      // deliberately broken gesture guard');
  assert.notEqual(code, source);
  const f = dialogFixture46({ code }); f.galleryTrigger.emit("pointerdown", { clientX: 0, clientY: 0 }); f.galleryTrigger.emit("pointermove", { clientX: 100, clientY: 0 }); f.click(f.galleryTrigger);
  assert.throws(() => assert.equal(f.gallery.open, false));
});
test("CTA47 gallery arrows ignore input-like targets while preserving ordinary gallery navigation", () => {
  const f = dialogFixture46(); f.click(f.galleryTrigger);
  const event = f.gallery.emit("keydown", { key: "ArrowRight", target: { closest: () => ({}) } });
  assert.equal(event.prevented, false); assert.equal(f.status.textContent, "Immagine 1 di 6");
  f.gallery.emit("keydown", { key: "ArrowRight" }); assert.equal(f.status.textContent, "Immagine 2 di 6");
});
