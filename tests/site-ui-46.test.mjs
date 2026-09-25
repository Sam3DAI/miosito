import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import nunjucks from "nunjucks";
import data from "../src/_data/cardDetails46.js";
import { root46, detailCounts46, assertDetailInventory46, renderRoute46, assertUi46Html, assertUi46Css } from "./site-ui-46.mjs";
import { dialogFixture46 } from "./dialog-ui-46-fixture.mjs";
import { uiLiterals46, beforeUi46Literals, assertUi46Literals } from "./site-ui-46-literals.mjs";
import { uiLiterals47, beforeUi47Literals, assertUi47Delta, assertUi47Literals } from "./site-ui-47-literals.mjs";
import { readGitBlobBuffer } from "./git-binary-reader.mjs";
const read = file => fs.readFileSync(path.join(root46, file), "utf8");

test("UI47 exact current source has71 reviewed callsites across16 files before historical checks", () => assert.deepEqual(assertUi47Literals(root46), { files: 16, literalPairs: 71, unknownDeltas: "NOT_REMOVED", current47: "REQUIRED" }));
test("UI47 literal gates reject old47-predecessor UI, mutations, duplicates and unrelated changes", () => {
  for (const [file, edits] of Object.entries(uiLiterals47.edits)) {
    const old = readGitBlobBuffer(uiLiterals47.baseline, file, root46).buffer.toString("utf8").replace(/\r\n/g, "\n");
    const current = read(file).replace(/\r\n/g, "\n");
    assert.throws(() => assertUi47Delta(file, old, old), file + ": the old UI cannot satisfy current47");
    assert.throws(() => assertUi47Delta(file, current + "\nUNAUTHORIZED47\n", old));
    assert.equal(beforeUi47Literals(file, current + "\nUNAUTHORIZED47\n"), old + "\nUNAUTHORIZED47\n");
    for (const edit of edits) {
      const changed = current.replace(edit.after, edit.after + "UNAUTHORIZED47\n");
      assert.notEqual(changed, current);
      assert.throws(() => assertUi47Delta(file, changed, old));
      assert.throws(() => assertUi47Delta(file, current.replace(edit.after, edit.after + edit.after), old));
    }
  }
});

test("UI46 historical adapters have exactly48 unique reviewed callsites across15 files", () => assert.deepEqual(assertUi46Literals(root46), { files: 15, literalPairs: 48, unknownDeltas: "NOT_REMOVED" }));
test("UI46 historical adapters retain unknown changes and refuse to match altered authorized fragments", () => {
  for (const [file, edits] of Object.entries(uiLiterals46.edits)) {
    const edit = edits[0], unknown = "\nUNAUTHORIZED_DECLARATION_46\n";
    assert.equal(beforeUi46Literals(file, edit.after + unknown), edit.before + unknown);
    assert.equal(beforeUi46Literals(file, beforeUi46Literals(file, edit.after + unknown)), edit.before + unknown);
    const altered = edit.after.slice(0, -1) + "UNAUTHORIZED_DECLARATION_46";
    assert.notEqual(beforeUi46Literals(file, altered), edit.before);
  }
});

test("UI46 catalog keeps all 129 stable entries; UI47 renders120 informative details and9 native navigation cards", () => assert.equal(assertDetailInventory46().occurrences, 129));
test("UI46 refuses a missing family, unknown occurrence, duplicated id or invented markup", () => {
  for (const mutate of [d => d.pages.home.process.pop(), d => d.pages.home.process[0].key = "/wrong", d => d.pages.home.process[1].id = "analisi", d => d.pages.home.process[0].text = "<b>Guaranteed</b>", d => d.pages.home.process[0].href = "/new-form", d => d.pages.home.solutions[0].action = "detail", d => d.pages.home.solutions[0].destination = "/invented-service", d => d.pages.home.process[0].paragraphs.pop()]) {
    const changed = structuredClone(data); mutate(changed); assert.throws(() => assertDetailInventory46(changed));
  }
});
for (const pageKey of Object.keys(detailCounts46)) test("UI46 current " + pageKey + " HTML covers every card, direct links and native no-JS details", () => assertUi46Html(pageKey, renderRoute46(pageKey)));
test("UI46 rejects removed content, inaccessible dialogs, nested links and form conversion", () => {
  const html = renderRoute46("ecommerce");
  for (const changed of [html.replace("data-card-detail=", "removed-card-detail="), html.replace('aria-labelledby="card-detail-dialog-title"', ''), html.replace('data-gallery-close aria-label="Chiudi i dettagli"', 'data-gallery-close'), html.replace('<form ', '<form data-detail-trigger '), html.replace('>Richiedi un preventivo ', '><button>Richiedi un preventivo</button> ')]) assert.throws(() => assertUi46Html("ecommerce", changed));
});
test("UI46 renderer escapes editorial title/body/attributes without arbitrary HTML", () => {
  const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(root46, "src/_includes")), { autoescape: false });
  const html = env.renderString('{% from "partials/marketing-components.njk" import cardDetail %}{{ cardDetail(entry) }}', { entry: { key: 'safe" onclick="evil', domId: "detail-fixture", title: '<img src=x onerror="evil">', text: "<script>evil()</script>", href: "/contattaci#contatti", cta: "Richiedi un preventivo" } });
  assert.doesNotMatch(html, /<script>|<img| onclick="evil/);
  assert.match(html, /&lt;script&gt;/); assert.match(html, /&quot;/);
});
test("UI46 quote contrast, exact border and accessible responsive gallery CSS", () => assertUi46Css());
test("UI46 CSS negatives reject crop, unequal cards, clipped low-screen dialog and lost quote contrast", () => {
  const css = { gallery: read("css/project-proof-galleries.css"), foundation: read("css/foundation.css") };
  for (const changed of [{ gallery: css.gallery.replace("object-fit: contain", "object-fit: cover") }, { gallery: css.gallery.replace("height: 100%; min-height: 0", "height: auto; min-height: 0") }, { gallery: css.gallery.replace("overflow: auto;", "overflow: hidden;") }, { foundation: css.foundation.replace("border: 1px solid transparent", "border: 2px solid transparent") }, { foundation: css.foundation.replace(".button.button--quote:not(:disabled):active { background: var(--sx-gradient) border-box; color: #1d1d1f; }", ".button.button--quote:not(:disabled):active { background: var(--sx-gradient) border-box; color: #fff; }") }]) {
    const field = Object.keys(changed)[0];
    assert.notEqual(changed[field], css[field], "Negative fixture must mutate a current declaration, independently of CRLF/LF");
    assert.throws(() => assertUi46Css(changed));
  }
});
test("UI46 gallery activates one verified image, reaches every slide and wraps", () => {
  for (const count of [6, 8]) {
    const f = dialogFixture46({ views: count });
    assert.equal(f.views.filter(v => v.image.src).length, 0);
    assert.equal(f.click(f.galleryTrigger).prevented, true);
    assert.equal(f.gallery.open, true); assert.equal(f.document.body.style.overflow, "hidden");
    assert.equal(f.views.filter(v => v.image.src).length, 1);
    for (let index = 1; index < count; index++) { f.click(f.next); assert.equal(f.status.textContent, "Immagine " + (index + 1) + " di " + count); assert.equal(f.views.filter(v => !v.hidden).length, 1); }
    assert.equal(f.views.filter(v => v.image.src).length, count);
    f.click(f.next); assert.equal(f.status.textContent, "Immagine 1 di " + count);
    f.click(f.previous); assert.equal(f.status.textContent, "Immagine " + count + " di " + count);
    assert.equal(f.large.href, f.views[count - 1].dataset.galleryLarge);
  }
});
test("UI46 native close/Escape path restores focus, window and original rail position", () => {
  const f = dialogFixture46(); f.click(f.galleryTrigger); f.track.scrollLeft = 900;
  f.gallery.close(); // Browser Escape uses this same native close event.
  assert.equal(f.document.activeElement, f.galleryTrigger); assert.equal(f.document.body.style.overflow, "auto");
  assert.equal(f.track.scrollLeft, 170); assert.equal(f.scrolls[0].top, 930);
  assert.equal(f.gallery.listeners.has("cancel"), false, "Native Escape is not intercepted");
});
test("UI46 detail uses existing HTML once and returns it without losing its source position", () => {
  const f = dialogFixture46(); assert.equal(f.click(f.summary).prevented, true);
  assert.equal(f.content.parent, "dialog"); assert.equal(f.detailTitle.textContent, "Dettaglio concreto");
  f.click(f.detailClose); assert.equal(f.content.parent, "fallback"); assert.equal(f.document.activeElement, f.summary);
  f.click(f.summary); f.detailDialog.close(); assert.equal(f.content.parent, "fallback");
});
test("UI46 focus loop wraps both ends and preserves normal middle navigation", () => {
  const f = dialogFixture46(); f.click(f.galleryTrigger);
  for (const [from, shiftKey, to, prevented] of [[f.galleryCta, false, f.close, true], [f.close, true, f.galleryCta, true], [f.previous, false, f.previous, false]]) {
    f.document.activeElement = from; const event = f.gallery.emit("keydown", { key: "Tab", shiftKey }); assert.equal(event.prevented, prevented); assert.equal(f.document.activeElement, to);
  }
});
test("UI46 low-height Tab trap reveals the control by scrolling only the dialog and preserves close restoration", () => {
  const f = dialogFixture46({ dialogGeometry: { clientHeight: 367, scrollHeight: 640, lastTop: 597 } });
  f.click(f.galleryTrigger);
  const event = f.gallery.emit("keydown", { key: "Tab", shiftKey: true });
  assert.equal(event.prevented, true); assert.equal(f.document.activeElement, f.galleryCta);
  assert.equal(f.gallery.scrollTop, 253);
  assert.deepEqual(f.gallery.scrolls, [{ top: 253, behavior: "instant" }]);
  assert.ok(f.galleryCta.getBoundingClientRect().bottom <= 16 + f.gallery.clientTop + f.gallery.clientHeight - 8);
  assert.equal(f.scrolls.length, 0); assert.equal(f.window.scrollY, 930); assert.equal(f.track.scrollLeft, 170);
  f.gallery.emit("keydown", { key: "Tab", shiftKey: false });
  assert.equal(f.document.activeElement, f.close); assert.equal(f.gallery.scrolls.length, 1, "sticky close was already visible");
  f.gallery.close();
  assert.equal(f.document.activeElement, f.galleryTrigger); assert.equal(f.track.scrollLeft, 170);
  assert.equal(f.scrolls.length, 1); assert.equal(f.scrolls[0].top, 930); assert.equal(f.document.body.style.overflow, "auto");
});
test("UI46 internal focus visibility scrolls upward only when needed, including the shared details dialog", () => {
  const f = dialogFixture46({ dialogGeometry: { clientHeight: 367, scrollHeight: 640, lastTop: 117 } });
  f.click(f.summary); f.detailDialog.scrollTop = 100;
  f.detailDialog.emit("keydown", { key: "Tab", shiftKey: true });
  assert.equal(f.document.activeElement, f.detailCta); assert.equal(f.detailDialog.scrollTop, 92);
  assert.deepEqual(f.detailDialog.scrolls, [{ top: 92, behavior: "instant" }]); assert.equal(f.scrolls.length, 0);
  const visible = dialogFixture46(); visible.click(visible.galleryTrigger);
  visible.gallery.emit("keydown", { key: "Tab", shiftKey: true });
  assert.equal(visible.document.activeElement, visible.galleryCta); assert.equal(visible.gallery.scrolls.length, 0); assert.equal(visible.scrolls.length, 0);
});
test("UI46 negative retains the low-height focus failure if the internal visibility correction is removed", () => {
  const source = read("js/project-proof-galleries.js");
  const broken = source.replace("        revealDialogFocus(dialog, event.shiftKey ? last : first);", "");
  assert.notEqual(broken, source);
  const f = dialogFixture46({ code: broken, dialogGeometry: { clientHeight: 367, scrollHeight: 640, lastTop: 597 } });
  f.click(f.galleryTrigger); f.gallery.emit("keydown", { key: "Tab", shiftKey: true });
  assert.equal(f.document.activeElement, f.galleryCta); assert.equal(f.gallery.scrollTop, 0);
  assert.throws(() => assert.ok(f.galleryCta.getBoundingClientRect().bottom <= 16 + f.gallery.clientTop + f.gallery.clientHeight));
  assert.equal(f.scrolls.length, 0);
});
test("UI46 never stacks a dialog over menu, consent or an already open dialog", () => {
  for (const options of [{ menuOpen: true }, { otherSurface: true }]) { const f = dialogFixture46(options); assert.equal(f.click(f.galleryTrigger).prevented, false); assert.equal(f.gallery.open, false); assert.equal(f.galleryFallback.hidden, false); assert.equal(f.click(f.summary).prevented, false); }
  const f = dialogFixture46(); f.click(f.summary); assert.equal(f.click(f.galleryTrigger).prevented, false); assert.equal(f.gallery.open, false);
});
test("UI46 refuses missing close/title, unknown id, external image and missing sources without hiding fallback", () => {
  for (const options of [{ invalidImage: true }, { missingTexture: true }, { missingTitle: true }, { missingClose: true }, { noNative: true }]) { const f = dialogFixture46(options); assert.equal(f.galleryTrigger.listeners.has("click"), false); assert.notEqual(f.galleryFallback.hidden, true); }
  for (const options of [{ invalidDetailId: true }, { duplicateId: true }, { missingDetailTitle: true }, { noNative: true }]) assert.equal(dialogFixture46(options).summary.listeners.has("click"), false);
});
test("UI46 modifier click and native showModal failure retain readable fallback", () => {
  for (const values of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { button: 1 }]) { const f = dialogFixture46(); assert.equal(f.click(f.galleryTrigger, values).prevented, false); assert.equal(f.gallery.open, false); }
  const f = dialogFixture46({ showThrows: true }); assert.equal(f.click(f.summary).prevented, false); assert.equal(f.content.parent, "fallback"); assert.equal(f.document.body.style.overflow, "auto");
});
