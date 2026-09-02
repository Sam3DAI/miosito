import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { compareRequiredOutputFile } from "./binary-post-build.mjs";

const fixturePath = "assets/iphone_16_pro_configuratore_3d.glb";

function fixtureBytes() {
  const buffer = Buffer.alloc((1024 * 1024) + 33);
  for (let index = 0; index < buffer.length; index += 1) buffer[index] = (index * 31 + 17) & 0xff;
  return buffer;
}

function createFixture({ withOutput = true } = {}) {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "solvex-binary-post-build-"));
  const sourceRoot = path.join(fixtureRoot, "source");
  const outputRoot = path.join(fixtureRoot, "_site");
  const sourcePath = path.join(sourceRoot, ...fixturePath.split("/"));
  const outputPath = path.join(outputRoot, ...fixturePath.split("/"));
  const bytes = fixtureBytes();

  fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
  fs.writeFileSync(sourcePath, bytes);
  if (withOutput) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, bytes);
  }

  return { fixtureRoot, sourceRoot, outputRoot, outputPath, bytes };
}

function safeRemoveFixture(fixtureRoot) {
  const tempRoot = path.resolve(os.tmpdir());
  const resolved = path.resolve(fixtureRoot);
  assert.equal(path.dirname(resolved), tempRoot, "Fixture cleanup target escaped the temp root");
  assert.ok(path.basename(resolved).startsWith("solvex-binary-post-build-"), "Unexpected fixture cleanup target");
  fs.rmSync(resolved, { recursive: true, force: true });
}

test("post-build GLB passes when required output is present and exact", () => {
  const fixture = createFixture();
  try {
    const evidence = compareRequiredOutputFile({
      sourceRoot: fixture.sourceRoot,
      outputRoot: fixture.outputRoot,
      relativePath: fixturePath
    });
    assert.equal(evidence.result, "PASS");
    assert.equal(evidence.sourceLength, fixture.bytes.length);
    assert.equal(evidence.outputLength, fixture.bytes.length);
  } finally {
    safeRemoveFixture(fixture.fixtureRoot);
  }
});

test("post-build GLB fails on a one-byte same-size mutation", () => {
  const fixture = createFixture();
  try {
    const mutated = Buffer.from(fixture.bytes);
    mutated[mutated.length - 11] ^= 0x01;
    fs.writeFileSync(fixture.outputPath, mutated);

    assert.throws(
      () => compareRequiredOutputFile({
        sourceRoot: fixture.sourceRoot,
        outputRoot: fixture.outputRoot,
        relativePath: fixturePath
      }),
      /SHA-256 changed/
    );
  } finally {
    safeRemoveFixture(fixture.fixtureRoot);
  }
});

test("post-build GLB fails when the required output is missing", () => {
  const fixture = createFixture({ withOutput: false });
  try {
    assert.throws(
      () => compareRequiredOutputFile({
        sourceRoot: fixture.sourceRoot,
        outputRoot: fixture.outputRoot,
        relativePath: fixturePath
      }),
      /Required post-build output missing/
    );
  } finally {
    safeRemoveFixture(fixture.fixtureRoot);
  }
});
