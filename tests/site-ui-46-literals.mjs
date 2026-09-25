import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { readGitBlobBuffer } from "./git-binary-reader.mjs";

export const uiLiterals46 = JSON.parse(fs.readFileSync(new URL("./site-ui-46-literals.json", import.meta.url), "utf8"));
const lf = s => s.replace(/\r\n/g, "\n");
// Historical invariants only: exact, reviewed UI callsites, never a file-wide
// rollback or a regex that discards unknown code. Current features have their own
// rendered/negative/runtime oracles in site-ui-46 and project-galleries-44r2.
export function beforeUi46Literals(file, input) {
  let result = lf(input);
  for (const edit of uiLiterals46.edits[file] || []) {
    if (edit.before.includes(edit.after) && result.includes(edit.before)) continue;
    result = result.replace(edit.after, edit.before);
  }
  return result;
}
export function assertUi46Literals(root) {
  let count = 0;
  for (const [file, edits] of Object.entries(uiLiterals46.edits)) {
    const baseline = lf(readGitBlobBuffer(uiLiterals46.baseline, file, root).buffer.toString("utf8"));
    const current = lf(fs.readFileSync(path.join(root, file), "utf8"));
    for (const edit of edits) {
      assert.ok(edit.before.length < baseline.length, file + ": no entire-file baseline substitution");
      assert.equal(baseline.split(edit.before).length, 2, file + ": unique historical callsite");
      assert.equal(current.split(edit.after).length, 2, file + ": unique current authorized callsite");
      count++;
    }
  }
  return { files: Object.keys(uiLiterals46.edits).length, literalPairs: count, unknownDeltas: "NOT_REMOVED" };
}
