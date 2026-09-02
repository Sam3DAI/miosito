import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { cleanCanonicalOutput } from "./verify-orchestration.mjs";

function safeRemoveFixture(fixtureRoot) {
  const tempRoot = path.resolve(os.tmpdir());
  const resolved = path.resolve(fixtureRoot);
  assert.equal(path.dirname(resolved), tempRoot, "Fixture cleanup target escaped the temp root");
  assert.ok(path.basename(resolved).startsWith("solvex-verify-orchestration-"), "Unexpected fixture cleanup target");
  fs.rmSync(resolved, { recursive: true, force: true });
}

test("canonical verify cleanup removes stale _site without touching project inputs", () => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "solvex-verify-orchestration-"));
  const outputRoot = path.join(fixtureRoot, "_site");
  const sourceSentinel = path.join(fixtureRoot, "source-sentinel.txt");

  try {
    fs.mkdirSync(outputRoot);
    fs.writeFileSync(path.join(outputRoot, "stale-only.txt"), "stale output must disappear\n", "utf8");
    fs.writeFileSync(sourceSentinel, "project input must remain\n", "utf8");

    const result = cleanCanonicalOutput(fixtureRoot, outputRoot);

    assert.equal(result.result, "PASS");
    assert.equal(fs.existsSync(outputRoot), false, "Stale output survived canonical cleanup");
    assert.equal(fs.readFileSync(sourceSentinel, "utf8"), "project input must remain\n");
    assert.throws(
      () => cleanCanonicalOutput(fixtureRoot, path.join(fixtureRoot, "not-the-site")),
      /Canonical output leaf must be _site/
    );
  } finally {
    safeRemoveFixture(fixtureRoot);
  }
});
