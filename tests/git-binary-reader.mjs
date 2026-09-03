import assert from "node:assert/strict";
import crypto from "node:crypto";
import path from "node:path";
import { spawnSync } from "node:child_process";

export const GIT_MAX_BUFFER = 64 * 1024 * 1024;

function executeGit(args, { cwd, encoding }) {
  const safeCwd = path.resolve(cwd);
  const safeArgs = ["-c", `safe.directory=${safeCwd}`, ...args];
  const result = spawnSync("git", safeArgs, {
    cwd,
    shell: false,
    encoding,
    maxBuffer: GIT_MAX_BUFFER,
    windowsHide: true
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    const stderr = Buffer.isBuffer(result.stderr)
      ? result.stderr.toString("utf8")
      : String(result.stderr ?? "");
    throw new Error(`git ${safeArgs.join(" ")} failed (${result.status}): ${stderr}`);
  }
  return result.stdout;
}

export function runGitText(args, cwd) {
  const stdout = executeGit(args, { cwd, encoding: "utf8" });
  assert.equal(typeof stdout, "string", "Git metadata command must return text");
  return stdout;
}

export function runGitBuffer(args, cwd) {
  const stdout = executeGit(args, { cwd, encoding: null });
  assert.ok(Buffer.isBuffer(stdout), "Git blob command must return a Buffer");
  return stdout;
}

function assertSafeMetadata(value, label) {
  assert.equal(typeof value, "string", `${label} must be text`);
  assert.ok(value.length > 0 && !value.includes("\0") && !value.includes("\r") && !value.includes("\n"), `${label} contains an invalid character`);
}

export function resolveGitBlobObjectId(ref, relativePath, cwd) {
  assertSafeMetadata(ref, "Git ref");
  assertSafeMetadata(relativePath, "Git path");
  const objectId = runGitText(["rev-parse", "--verify", `${ref}:${relativePath}`], cwd).trim();
  assert.match(objectId, /^[0-9a-f]{40,64}$/i, `Invalid Git object id for ${relativePath}`);
  return objectId.toLowerCase();
}

export function readGitBlobBuffer(ref, relativePath, cwd) {
  const objectId = resolveGitBlobObjectId(ref, relativePath, cwd);
  const expectedLengthText = runGitText(["cat-file", "-s", objectId], cwd).trim();
  assert.match(expectedLengthText, /^\d+$/, `Invalid Git blob length for ${relativePath}`);
  const expectedLength = Number(expectedLengthText);
  assert.ok(Number.isSafeInteger(expectedLength), `Unsafe Git blob length for ${relativePath}`);

  const buffer = runGitBuffer(["cat-file", "blob", objectId], cwd);
  assert.ok(Buffer.isBuffer(buffer), `Git blob is not binary-safe for ${relativePath}`);
  assert.equal(buffer.length, expectedLength, `Git blob length mismatch for ${relativePath}`);

  return { objectId, expectedLength, observedLength: buffer.length, buffer };
}

export function hashFileWithGitFilters(relativePath, sourcePath, cwd) {
  assertSafeMetadata(relativePath, "Git filter path");
  assertSafeMetadata(sourcePath, "Git source path");
  const objectId = runGitText(["hash-object", `--path=${relativePath}`, sourcePath], cwd).trim();
  assert.match(objectId, /^[0-9a-f]{40,64}$/i, `Invalid clean-filter object id for ${relativePath}`);
  return objectId.toLowerCase();
}

export function sha256Buffer(buffer) {
  assert.ok(Buffer.isBuffer(buffer), "SHA-256 input must be a Buffer");
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export function compareRawBuffers(expected, actual, label = "raw buffer") {
  assert.ok(Buffer.isBuffer(expected), `${label}: expected must be a Buffer`);
  assert.ok(Buffer.isBuffer(actual), `${label}: actual must be a Buffer`);
  const expectedSha256 = sha256Buffer(expected);
  const actualSha256 = sha256Buffer(actual);
  assert.equal(actual.length, expected.length, `${label}: byte length changed`);
  assert.equal(actualSha256, expectedSha256, `${label}: SHA-256 changed`);
  assert.ok(actual.equals(expected), `${label}: bytes changed`);
  return { length: expected.length, expectedSha256, actualSha256, result: "PASS" };
}
