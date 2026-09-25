import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { originalContract, assertOriginalSources, assertOriginalFile, assertOriginalHtml, webpDimensions, isDeferredOriginalImage } from "./original-images-31.mjs";
import { detailCounts46, renderRoute46 } from "./site-ui-46.mjs";
import details46 from "../src/_data/cardDetails46.js";

test("23 historical owner slots and all 69 source WebP files retain true dimensions and source copy", () => {
  assert.deepEqual(assertOriginalSources(), {mapped:23, files:69, bytes:3553550});
});
test("changed or mislabeled bytes cannot satisfy the original asset oracle", () => {
  const entry=originalContract.assets[0].variants[0];
  const bytes=fs.readFileSync(new URL("../" + entry.file, import.meta.url));
  const changed=Buffer.from(bytes); changed[changed.length - 1] ^= 1;
  assert.throws(() => assertOriginalFile(changed, entry), /package hash/);
  assert.throws(() => assertOriginalFile(bytes, {...entry, width:700}), /real dimensions/);
  assert.throws(() => webpDimensions(Buffer.from("not an image")));
});
test("only explicitly lazy original IMG variants are excluded from initial transfer, not from availability checks", () => {
  const file=originalContract.assets[0].variants[0].file;
  assert.equal(isDeferredOriginalImage('<img loading="lazy">', file), true);
  assert.equal(isDeferredOriginalImage('<img loading="eager">', file), false);
  assert.equal(isDeferredOriginalImage('<img>', file), false);
  assert.equal(isDeferredOriginalImage('<script loading="lazy">', file), false);
  assert.equal(isDeferredOriginalImage('<img loading="lazy">', "assets/images/rejected-30/fallback.webp"), false);
  assert.equal(isDeferredOriginalImage('<img loading="lazy">', "js/site-shell.js"), false);
});

test("current UI47 HTML preserves all 32 original/clean image slots, metadata and whole-card capability service links", () => {
  let slots = 0;
  for (const pageKey of Object.keys(detailCounts46)) {
    const file = pageKey === "home" ? "index" : details46.routes[pageKey].slice(1);
    slots += assertOriginalHtml({source:`src/${file}.njk`}, renderRoute46(pageKey));
  }
  assert.equal(slots, 32);
});

test("capability HTML rejects altered image metadata, loading policy, title, wrapper or original service destination", () => {
  const html = renderRoute46("home"), route = {source:"src/index.njk"};
  for (const id of ["HOME-CAP-01", "HOME-CAP-02"]) {
    const block = [...html.matchAll(/<a class="card card--link capability-card"[^>]*\bdata-card-navigation\b[^>]*>[\s\S]*?<\/a>/g)].find(m => m[0].includes(`data-original-asset="${id}"`))[0];
    const image = block.match(/<img\b[^>]*>/)[0];
    const mutations = [
      block.replace('<a class="card card--link capability-card"', '<a class="card renamed-capability"'),
      block.replace(/<h3>[\s\S]*?<\/h3>/, '<h3>Unauthorized title.</h3>'),
      block.replace(/(data-card-navigation href=")[^"]+/, '$1/wrong-service'),
      block.replace('data-card-navigation', 'removed-navigation'),
      block.replace('<a class=', '<article class=').replace('</a>', '</article>'),
      block.replace('</a>', '<button>Dettagli</button></a>'),
      block.replace(image, image + image),
      block.replace(image, '<figure>' + image + '</figure>'),
      block.replace(image, image.replace('data-original-asset="' + id + '"', 'data-original-asset="UNKNOWN"')),
      block.replace(image, image.replace(/>$/, ' fetchpriority="high">')),
      ...["src", "srcset", "sizes", "alt", "width", "height", "loading", "decoding"].map(name => block.replace(image, image.replace(new RegExp('\\b' + name + '="[^"]*"'), name + '="UNAUTHORIZED"')))
    ];
    for (const changed of mutations) {
      assert.notEqual(changed, block, id + ": mutation must actually change the current HTML");
      assert.throws(() => assertOriginalHtml(route, html.replace(block, changed)), undefined, id + ": altered capability rejected");
    }
  }
});
