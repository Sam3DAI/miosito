import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { readGitBlobBuffer } from "./git-binary-reader.mjs";

export const uiLiterals47 = JSON.parse(fs.readFileSync(new URL("./site-ui-47-literals.json", import.meta.url), "utf8"));
const lf = value => value.replace(/\r\n/g, "\n");
const currentMarker47 = file => ({
  "css/foundation.css": "/*47: semantic roles are explicit in the templates",
  "css/project-proof-galleries.css": "/*47: one action per card and one native dialog lifecycle.",
  "js/project-proof-galleries.js": "  function pointerIntent(surface) {",
  "src/_includes/layouts/base.njk": '<path d="m6 6 12 12M18 6 6 18"/>',
  "src/_includes/partials/marketing-components.njk": 'entry.action != "navigate"',
  "src/_includes/partials/project-proof-galleries.njk": 'class="proof-gallery__cta"'
})[file] || 'data-cta-role="quote"';
const baselineCache = new Map();
function baselineSource(root, file) {
  const key = path.resolve(root) + "\0" + file;
  if (!baselineCache.has(key)) baselineCache.set(key, lf(readGitBlobBuffer(uiLiterals47.baseline, file, root).buffer.toString("utf8")));
  return baselineCache.get(key);
}

// Historical source reconstruction only. Rendering/browser/runtime assertions
// always consume the real current product, never this reconstructed string.
// A changed or duplicated fragment remains visible to the historical guard.
export function beforeUi47Literals(file, input) {
  let result = lf(input);
  // Older historical passes may contain the same native closing anchor again.
  // Never reinterpret an already reconstructed pre47 file as a current47 file.
  if (!uiLiterals47.edits[file] || !result.includes(currentMarker47(file))) return result;
  for (const edit of uiLiterals47.edits[file] || []) {
    if (edit.before.includes(edit.after) && result.includes(edit.before)) continue;
    if (result.split(edit.after).length === 2) result = result.replace(edit.after, edit.before);
  }
  return result;
}

export function assertUi47Delta(file, input, baseline) {
  const edits = uiLiterals47.edits[file];
  assert.ok(edits?.length, file + ": no implicit file-wide UI exception");
  const old = lf(baseline), current = lf(input);
  let expected = old;
  for (const edit of edits) {
    assert.ok(edit.before && edit.after && edit.before !== edit.after, file + ": non-empty bounded change");
    assert.ok(edit.before.length < old.length && edit.after.length < current.length, file + ": no whole-file rollback");
    assert.equal(old.split(edit.before).length, 2, file + ": one independently pinned baseline callsite");
    assert.equal(current.split(edit.after).length, 2, file + ": current47 callsite required exactly once, never old-or-new");
    expected = expected.replace(edit.before, edit.after);
  }
  assert.equal(current, expected, file + ": only the reviewed47 literal changes are allowed");
  assert.equal(beforeUi47Literals(file, current), old, file + ": exact historical reconstruction");
  assert.equal(beforeUi47Literals(file, old), old, file + ": historical reconstruction is idempotent");
  return edits.length;
}

export function assertUi47Literals(root) {
  assert.equal(uiLiterals47.baseline, "887198eb0e7f9bd956ebc32010057d6d03706c4b");
  let literalPairs = 0;
  for (const file of Object.keys(uiLiterals47.edits)) literalPairs += assertUi47Delta(file, fs.readFileSync(path.join(root, file), "utf8"), baselineSource(root, file));
  return { files: Object.keys(uiLiterals47.edits).length, literalPairs, unknownDeltas: "NOT_REMOVED", current47: "REQUIRED" };
}
