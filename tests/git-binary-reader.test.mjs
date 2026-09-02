import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  compareRawBuffers,
  hashFileWithGitFilters,
  readGitBlobBuffer,
  resolveGitBlobObjectId,
  sha256Buffer
} from "./git-binary-reader.mjs";
import { REAL_BINARY_FILES } from "./binary-post-build.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseCommit = "5050545994cb2b3b515063a966369d6ac8f1532c";

function git(args, cwd) {
  const result = spawnSync("git", args, {
    cwd,
    shell: false,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 4 * 1024 * 1024
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `git ${args.join(" ")} failed: ${result.stderr}`);
}

function deterministicBinaryFixture() {
  const buffer = Buffer.alloc((1024 * 1024) + 4099);
  let state = 0x6d2b79f5;
  for (let index = 0; index < buffer.length; index += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    buffer[index] = state & 0xff;
  }
  Buffer.from([0x00, 0xff, 0xfe, 0x80, 0xc3, 0x28, 0xa0, 0xa1]).copy(buffer, 0);
  return buffer;
}

function safeRemoveFixture(fixtureRoot) {
  const tempRoot = path.resolve(os.tmpdir());
  const resolved = path.resolve(fixtureRoot);
  assert.equal(path.dirname(resolved), tempRoot, "Fixture cleanup target escaped the temp root");
  assert.ok(path.basename(resolved).startsWith("solvex-binary-reader-"), "Unexpected fixture cleanup target");
  fs.rmSync(resolved, { recursive: true, force: true });
}

test("Git blob reader preserves arbitrary binary bytes above 1 MiB", () => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "solvex-binary-reader-"));
  try {
    const fixture = deterministicBinaryFixture();
    fs.writeFileSync(path.join(fixtureRoot, "fixture.bin"), fixture);
    fs.writeFileSync(path.join(fixtureRoot, ".gitattributes"), "*.txt text eol=lf\n", "utf8");
    fs.writeFileSync(path.join(fixtureRoot, "line-endings.txt"), "prima\r\nseconda\r\n", "utf8");

    git(["init", "--quiet"], fixtureRoot);
    git(["config", "user.name", "SolveX verifier"], fixtureRoot);
    git(["config", "user.email", "verifier@example.invalid"], fixtureRoot);
    git(["add", ".gitattributes", "fixture.bin", "line-endings.txt"], fixtureRoot);
    git(["commit", "--quiet", "-m", "binary fixture"], fixtureRoot);

    const first = readGitBlobBuffer("HEAD", "fixture.bin", fixtureRoot);
    const second = readGitBlobBuffer("HEAD", "fixture.bin", fixtureRoot);
    assert.ok(Buffer.isBuffer(first.buffer));
    assert.ok(first.buffer.length > 1024 * 1024);
    compareRawBuffers(fixture, first.buffer, "synthetic Git blob");
    compareRawBuffers(first.buffer, second.buffer, "repeat Git blob read");

    const changed = Buffer.from(first.buffer);
    changed[changed.length - 7] ^= 0x01;
    assert.equal(changed.length, first.buffer.length);
    assert.throws(() => compareRawBuffers(first.buffer, changed, "single-byte mutation"), /SHA-256 changed/);

    const sameSizeDifferent = Buffer.alloc(first.buffer.length, 0x5a);
    assert.throws(() => compareRawBuffers(first.buffer, sameSizeDifferent, "same-size mutation"), /SHA-256 changed/);

    const shorter = first.buffer.subarray(0, first.buffer.length - 1);
    assert.throws(() => compareRawBuffers(first.buffer, shorter, "source-output length mutation"), /byte length changed/);

    const textObjectId = resolveGitBlobObjectId("HEAD", "line-endings.txt", fixtureRoot);
    const filteredWorktreeObjectId = hashFileWithGitFilters("line-endings.txt", "line-endings.txt", fixtureRoot);
    assert.equal(filteredWorktreeObjectId, textObjectId, "CRLF checkout must match LF base through Git clean filters");
  } finally {
    safeRemoveFixture(fixtureRoot);
  }
});

test("the four real blocker inputs are read as exact Buffers", () => {
  for (const relativePath of REAL_BINARY_FILES) {
    const baseline = readGitBlobBuffer(baseCommit, relativePath, root);
    const source = fs.readFileSync(path.join(root, ...relativePath.split("/")));
    assert.ok(Buffer.isBuffer(baseline.buffer));
    assert.ok(Buffer.isBuffer(source));
    compareRawBuffers(baseline.buffer, source, `${relativePath} base-source`);
    assert.equal(sha256Buffer(baseline.buffer), sha256Buffer(source));
  }

  const glb = fs.readFileSync(path.join(root, "assets", "iphone_16_pro_configuratore_3d.glb"));
  assert.ok(glb.length > 1024 * 1024, "Real GLB must exercise the >1 MiB reader path");
});
