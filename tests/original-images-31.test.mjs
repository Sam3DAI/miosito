import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { originalContract, assertOriginalSources, assertOriginalFile, webpDimensions, isDeferredOriginalImage } from "./original-images-31.mjs";

test("23 owner-original slots and 69 exact WebP files retain true dimensions and source copy", () => {
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
