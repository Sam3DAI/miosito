import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { readGitBlobBuffer } from "./git-binary-reader.mjs";
import { beforeQuote38 } from "./quote-cta-38.mjs";
import { contract43, aiItems43, publishedImageFiles43 } from "./clean-images-43.mjs";

// Independent package oracle; not imported by templates or the build registry.
export const originalContract = JSON.parse(fs.readFileSync(new URL("./original-images-31-contract.json", import.meta.url), "utf8"));
export const originalFiles = originalContract.assets.flatMap(a => a.variants.map(v => v.file));
const fileSet = new Set(publishedImageFiles43);
const rootDefault = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const digest = buffer => crypto.createHash("sha256").update(buffer).digest("hex");
const attr = (tag, name) => tag.match(new RegExp('\\b' + name + '=["\x27]([^"\x27]*)["\x27]'))?.[1] ?? "";
const text = html => html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").trim();

export function webpDimensions(bytes) {
  assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
  assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const kind = bytes.toString("ascii", offset, offset + 4);
    const length = bytes.readUInt32LE(offset + 4);
    const start = offset + 8;
    assert.ok(start + length <= bytes.length, "Truncated WebP chunk");
    if (kind === "VP8X") return [1 + bytes.readUIntLE(start + 4, 3), 1 + bytes.readUIntLE(start + 7, 3)];
    if (kind === "VP8 ") return [bytes.readUInt16LE(start + 6) & 0x3fff, bytes.readUInt16LE(start + 8) & 0x3fff];
    if (kind === "VP8L") {
      assert.equal(bytes[start], 0x2f);
      const bits = bytes.readUInt32LE(start + 1);
      return [1 + (bits & 0x3fff), 1 + ((bits >>> 14) & 0x3fff)];
    }
    offset = start + length + (length % 2);
  }
  throw new Error("WebP dimension chunk missing");
}

export function assertOriginalFile(bytes, expected) {
  assert.equal(bytes.length, expected.bytes, expected.file + " size");
  assert.equal(digest(bytes), expected.sha256, expected.file + " package hash");
  assert.deepEqual(webpDimensions(bytes), [expected.width, expected.height], expected.file + " real dimensions");
}

export function isDeferredOriginalImage(tag, file) {
  return /^<img\b/i.test(tag) && attr(tag, "loading") === "lazy" && fileSet.has(file);
}

export function assertOriginalSources(root = rootDefault) {
  const metadata = JSON.parse(fs.readFileSync(path.join(root, "src/_data/originalImages31.json"), "utf8"));
  assert.equal(originalContract.assets.length, 23);
  assert.equal(originalFiles.length, 69);
  assert.equal(fileSet.size, 96);
  assert.deepEqual(Object.keys(metadata), [...originalContract.assets.map(a => a.id), ...aiItems43.map(a => a.id)]);
  assert.deepEqual(fs.readdirSync(path.join(root, "assets/images/originals-31")).sort(), originalFiles.map(f => path.basename(f)).sort(), "Exact local asset directory; no masters, QA or rejected fallbacks");
  for (const a of originalContract.assets) {
    const entry = metadata[a.id], middle = a.variants[1];
    assert.equal(entry.id, a.id);
    // The task43 digest oracle checks replacement metadata independently;
    // all 69 historical source variants still retain the task31 byte oracle.
    if (contract43.preserved.includes(a.id)) {
      assert.equal(entry.src, "/" + middle.file);
      assert.equal(entry.srcset, a.variants.map(v => "/" + v.file + " " + v.width + "w").join(", "));
      assert.deepEqual([entry.width, entry.height], [middle.width, middle.height]);
      assert.equal(entry.alt, a.alt);
      assert.equal(entry.background, a.background);
    }
    assert.ok(entry.sizes);
    assert.match(entry.background, /^#[0-9a-f]{6}$/);
    for (const v of a.variants) assertOriginalFile(fs.readFileSync(path.join(root, v.file)), v);
    const template = fs.readFileSync(path.join(root, a.template), "utf8");
    assert.ok(template.includes('originalImages31["' + a.id + '"]'), a.id + " explicit slot binding");
  }
  const stripMedia = block => block.replace(/,\s*(?:image|alt|imageMeta): (?:originalImages31\["[^"]+"\](?:\.\w+)?|"[^"]*")/g, "").replace(/, note: "Esempio illustrativo\. Le integrazioni si verificano sul progetto\."/g, "");
  for (const file of new Set(originalContract.assets.map(a => a.template))) {
    const old = readGitBlobBuffer(originalContract.base, file, root).buffer.toString("utf8").replaceAll("\r\n", "\n");
    const current = beforeQuote38(file, fs.readFileSync(path.join(root, file), "utf8"));
    const hero = source => source.match(/<section class="page-hero[^"]*"[^>]*>[\s\S]*?<\/section>/)?.[0];
    // Task 32 authorizes only the H1 within these image-bearing heroes. Its exact text is independently checked.
    const withoutHeading = block => block.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/, "<h1></h1>");
    assert.equal(withoutHeading(hero(current)), withoutHeading(hero(old)), file + " frozen hero introduction, links and structure");
    for (const collection of new Set(originalContract.assets.filter(a => a.template === file && a.placement === "portrait_rail").map(a => a.collection))) {
      const pattern = new RegExp("{% set " + collection + " = \\[[\\s\\S]*?\\] %}");
      assert.equal(stripMedia(current.match(pattern)[0]), stripMedia(old.match(pattern)[0]), file + " preserves card order, title, description and links");
    }
  }
  return { mapped: 23, files: 69, bytes: originalContract.assets.flatMap(a => a.variants).reduce((n,v) => n + v.bytes, 0) };
}

export function assertOriginalHtml(route, html) {
  const aiAssets = aiItems43.map(a => ({...a, template:"src/automazioni-ai-business.njk", placement:"portrait_rail"}));
  const expected = [...originalContract.assets, ...aiAssets].filter(a => a.template === route.source);
  const ids = [...html.matchAll(/\bdata-original-asset="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(ids, expected.map(a => a.id), route.source + " exact 32-slot placement including nine approved AI additions");
  const metadata = JSON.parse(fs.readFileSync(path.join(rootDefault, "src/_data/originalImages31.json"), "utf8"));
  for (const a of expected) {
    let block;
    if (a.placement === "portrait_rail") {
      block = [...html.matchAll(/<li\b[^>]*data-original-asset="([^"]+)"[^>]*>[\s\S]*?<\/li>/g)].find(m => m[1] === a.id)?.[0];
      assert.ok(block, a.id + " card missing");
      assert.match(block, /visual-card--original/);
      assert.match(block, /style="--original-image-bg: #[0-9a-f]{6}"/);
      assert.equal(text(block.match(/<h3>([\s\S]*?)<\/h3>/)[1]), a.title);
    } else {
      // Task47 makes the existing service destination the whole native card.
      // Its original image/title remain inside that same anchor, with no detail.
      block = [...html.matchAll(/<a class="card card--link capability-card"[^>]*\bdata-card-navigation\b[^>]*>[\s\S]*?<\/a>/g)].find(m => m[0].includes('data-original-asset="' + a.id + '"'))?.[0];
      assert.ok(block, a.id + " capability missing");
      assert.equal(text(block.match(/<h3>([\s\S]*?)<\/h3>/)[1]), a.title);
      assert.doesNotMatch(block, /<figure|<figcaption|capability-card__media/);
      assert.match(block, /class="capability-card__image"/);
      assert.equal((block.match(/<a\b/g) || []).length, 1, a.id + " one whole-card service link, no nested anchor");
      assert.equal(attr(block.split(">")[0], "href"), {"HOME-CAP-01":"/configuratori-3d-2d", "HOME-CAP-02":"/automazioni-ai-business"}[a.id], a.id + " original service destination");
      assert.doesNotMatch(block, /<(?:button|summary|details)\b|data-card-detail|card-detail__plus|\bonclick\s*=/, a.id + " native navigation has no competing detail control");
      assert.equal((block.match(/<img\b/g) ?? []).length, 1, a.id + " one original full-card image");
    }
    const image = block.match(/<img\b[^>]*>/)[0], entry = metadata[a.id];
    for (const name of ["src", "srcset", "sizes", "alt", "width", "height"]) assert.equal(attr(image, name), String(entry[name]), a.id + " " + name);
    assert.equal(attr(image, "loading"), "lazy");
    assert.equal(attr(image, "decoding"), "async");
    assert.equal(attr(image, "fetchpriority"), "");
    if (a.id === "CPQ-09") assert.match(block, /ERP, CRM e altri sistemi vengono valutati sulle interfacce realmente disponibili\./);
  }
  if (expected.some(a => a.placement === "portrait_rail")) assert.equal((html.match(/Illustrazioni di esempio, non screenshot di progetti realizzati\./g) ?? []).length, 0);
  return expected.length;
}
