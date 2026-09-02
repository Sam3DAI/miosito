import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

export function cleanCanonicalOutput(projectRoot, outputRoot) {
  const resolvedProjectRoot = path.resolve(projectRoot);
  const resolvedOutputRoot = path.resolve(outputRoot);

  assert.equal(path.basename(resolvedOutputRoot), "_site", "Canonical output leaf must be _site");
  assert.equal(path.dirname(resolvedOutputRoot), resolvedProjectRoot, "Canonical output must be a direct child of the project root");

  fs.rmSync(resolvedOutputRoot, { recursive: true, force: true });
  assert.equal(fs.existsSync(resolvedOutputRoot), false, "Canonical output cleanup did not remove _site");

  return { projectRoot: resolvedProjectRoot, outputRoot: resolvedOutputRoot, result: "PASS" };
}
