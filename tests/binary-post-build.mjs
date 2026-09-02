import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  compareRawBuffers,
  readGitBlobBuffer,
  sha256Buffer
} from "./git-binary-reader.mjs";

export const REAL_BINARY_FILES = Object.freeze([
  "assets/iphone_16_pro_configuratore_3d.glb",
  "favicon-32.png",
  "favicon.ico",
  "logo-112.png"
]);

function resolveRequiredFile(root, relativePath, label) {
  assert.equal(typeof relativePath, "string", `${label} path must be text`);
  assert.equal(path.isAbsolute(relativePath), false, `${label} path must be relative`);
  const segments = relativePath.split("/");
  assert.ok(segments.length > 0 && segments.every((segment) => segment && segment !== "." && segment !== ".."), `${label} path is unsafe`);
  return path.join(path.resolve(root), ...segments);
}

export function compareRequiredOutputFile({ sourceRoot, outputRoot, relativePath }) {
  const sourcePath = resolveRequiredFile(sourceRoot, relativePath, "Source");
  const outputPath = resolveRequiredFile(outputRoot, relativePath, "Output");

  assert.equal(fs.existsSync(sourcePath), true, `Required source missing: ${relativePath}`);
  assert.equal(fs.existsSync(outputPath), true, `Required post-build output missing: ${relativePath}`);

  const source = fs.readFileSync(sourcePath);
  const output = fs.readFileSync(outputPath);
  assert.ok(Buffer.isBuffer(source), `${relativePath} source must be a Buffer`);
  assert.ok(Buffer.isBuffer(output), `${relativePath} output must be a Buffer`);
  const comparison = compareRawBuffers(source, output, `Post-build ${relativePath}`);

  return {
    file: relativePath,
    sourceLength: source.length,
    outputLength: output.length,
    sourceSha256: comparison.expectedSha256,
    outputSha256: comparison.actualSha256,
    result: comparison.result
  };
}

export function verifyRealBinaryOutputs({ root, outputRoot, baseRef }) {
  return REAL_BINARY_FILES.map((relativePath) => {
    const copyEvidence = compareRequiredOutputFile({
      sourceRoot: root,
      outputRoot,
      relativePath
    });
    const baseline = readGitBlobBuffer(baseRef, relativePath, root);
    const source = fs.readFileSync(resolveRequiredFile(root, relativePath, "Source"));
    const baselineComparison = compareRawBuffers(baseline.buffer, source, `Binary baseline ${relativePath}`);

    if (relativePath.endsWith(".glb")) {
      assert.ok(source.length > 1024 * 1024, "Real GLB must remain above 1 MiB");
    }

    return {
      file: relativePath,
      baseObjectId: baseline.objectId,
      baseLength: baseline.observedLength,
      sourceLength: copyEvidence.sourceLength,
      outputLength: copyEvidence.outputLength,
      baseSha256: sha256Buffer(baseline.buffer),
      sourceSha256: copyEvidence.sourceSha256,
      outputSha256: copyEvidence.outputSha256,
      baseToSource: baselineComparison.result,
      sourceToOutput: copyEvidence.result
    };
  });
}
