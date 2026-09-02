import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const eleventyCli = path.join(root, "node_modules", "@11ty", "eleventy", "cmd.cjs");
const validatorUrl = pathToFileURL(path.join(root, "eleventy.config.js")).href;
const temporaryPrefix = path.join(os.tmpdir(), "solvex-measurement-mode-");

function safeRemoveTemporaryDirectory(directory) {
  const resolvedDirectory = path.resolve(directory);
  const resolvedTemp = path.resolve(os.tmpdir());
  assert.equal(path.dirname(resolvedDirectory), resolvedTemp);
  assert.ok(path.basename(resolvedDirectory).startsWith("solvex-measurement-mode-"));
  fs.rmSync(resolvedDirectory, { recursive: true, force: true });
}

function runIsolatedBuild(measurement) {
  const fixtureRoot = fs.mkdtempSync(temporaryPrefix);
  try {
    fs.mkdirSync(path.join(fixtureRoot, "src", "_data"), { recursive: true });
    fs.writeFileSync(path.join(fixtureRoot, "src", "index.njk"), "measurement fixture\n");
    fs.writeFileSync(
      path.join(fixtureRoot, "src", "_data", "measurement.json"),
      `${JSON.stringify(measurement)}\n`
    );
    fs.writeFileSync(
      path.join(fixtureRoot, "eleventy.config.mjs"),
      [
        'import fs from "node:fs";',
        'import path from "node:path";',
        'import { fileURLToPath } from "node:url";',
        `import { assertMeasurementMode } from ${JSON.stringify(validatorUrl)};`,
        'const fixtureRoot = path.dirname(fileURLToPath(import.meta.url));',
        'export default function () {',
        '  const measurement = JSON.parse(fs.readFileSync(path.join(fixtureRoot, "src", "_data", "measurement.json"), "utf8"));',
        '  assertMeasurementMode(measurement);',
        '  return { dir: { input: "src", output: "_site", data: "_data" }, templateFormats: ["njk"] };',
        '}',
        ''
      ].join("\n")
    );

    return spawnSync(process.execPath, [eleventyCli, "--config=eleventy.config.mjs"], {
      cwd: fixtureRoot,
      shell: false,
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
      windowsHide: true
    });
  } finally {
    safeRemoveTemporaryDirectory(fixtureRoot);
  }
}

test("legacy-direct measurement mode permits an Eleventy build", () => {
  const result = runIsolatedBuild({ mode: "legacy-direct" });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
});

test("missing measurement mode fails the Eleventy build closed", () => {
  const result = runIsolatedBuild({});
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /Unknown or missing measurement mode: <missing>/);
});

test("unknown measurement mode fails the Eleventy build closed", () => {
  const result = runIsolatedBuild({ mode: "unknown" });
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /Unknown or missing measurement mode: unknown/);
});
