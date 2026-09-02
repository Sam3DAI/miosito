import assert from "node:assert/strict";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { cleanCanonicalOutput } from "./verify-orchestration.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(root, "_site");
const unitTests = Object.freeze([
  "tests/inventory-comparator.test.mjs",
  "tests/git-binary-reader.test.mjs",
  "tests/html-contract.test.mjs",
  "tests/measurement-mode.test.mjs",
  "tests/verify-orchestration.test.mjs",
  "tests/binary-post-build.test.mjs"
]);

function runPhase(label, args) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    shell: false,
    stdio: "inherit",
    windowsHide: true
  });

  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${label} failed with exit code ${result.status}`);
  console.log(`VERIFY_ORCHESTRATION_PHASE=${label}:PASS`);
}

cleanCanonicalOutput(root, outputRoot);
console.log("VERIFY_ORCHESTRATION_INITIAL_CLEAN=PASS");
runPhase("OUTPUT_INDEPENDENT_TESTS", ["--test", ...unitTests]);
runPhase("TWO_BUILD_PRODUCT_VERIFICATION", ["tests/verify.mjs"]);
console.log("VERIFY_ORCHESTRATION=PASS");
