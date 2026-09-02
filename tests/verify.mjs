import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  BASE_COMMIT,
  MIGRATED_ROUTES,
  PASSTHROUGH_FILES,
  assertMeasurementMode,
  assertUniqueDestinations
} from "../eleventy.config.js";
import {
  canonicalPathSort,
  compareInventories
} from "./inventory-comparator.mjs";
import {
  compareRawBuffers,
  hashFileWithGitFilters,
  readGitBlobBuffer,
  resolveGitBlobObjectId
} from "./git-binary-reader.mjs";
import {
  canonicalizeHtmlContractMarkup,
  canonicalizeRenderedText
} from "./html-contract.mjs";
import { verifyRealBinaryOutputs } from "./binary-post-build.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(root, "_site");
const eleventyCli = path.join(root, "node_modules", "@11ty", "eleventy", "cmd.cjs");
const maxBuffer = 64 * 1024 * 1024;
const configuratorProtectedFiles = Object.freeze([
  "configuratori-3d-2d.html",
  "css/configuratori-3d-2d.css",
  "js/configuratori-3d-2d.js",
  "js/netlify-lead-form.js",
  "js/ad-attribution-consent.js",
  "assets/iphone_16_pro_configuratore_3d.glb"
]);

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function run(command, args, options = {}) {
  const encoding = Object.prototype.hasOwnProperty.call(options, "encoding")
    ? options.encoding
    : "utf8";
  const result = spawnSync(command, args, {
    cwd: root,
    shell: false,
    encoding,
    maxBuffer,
    windowsHide: true,
    stdio: options.stdio ?? "pipe"
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const stderr = Buffer.isBuffer(result.stderr) ? result.stderr.toString("utf8") : result.stderr;
    throw new Error(`${command} ${args.join(" ")} failed (${result.status}):\n${stderr ?? ""}`);
  }
  return result;
}

function gitBlob(relativePath) {
  return readGitBlobBuffer(BASE_COMMIT, relativePath, root).buffer;
}

function gitBlobObjectId(relativePath) {
  return resolveGitBlobObjectId(BASE_COMMIT, relativePath, root);
}

function cleanFilteredObjectId(relativePath, sourcePath) {
  return hashFileWithGitFilters(relativePath, sourcePath, root);
}

function buildFromAbsentOutput() {
  fs.rmSync(outputRoot, { recursive: true, force: true });
  assert.equal(fs.existsSync(outputRoot), false, "_site must be absent before each build");
  run(process.execPath, [eleventyCli], { stdio: "inherit" });
  assert.equal(fs.statSync(outputRoot).isDirectory(), true, "Eleventy did not create _site");
}

function listFiles(directory, prefix = "") {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const relativePath = path.posix.join(prefix, entry.name);
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(absolutePath, relativePath));
    else if (entry.isFile()) files.push(relativePath);
    else throw new Error(`Unexpected non-file output entry: ${relativePath}`);
  }
  return files;
}

function inventory() {
  const rows = canonicalPathSort(listFiles(outputRoot)).map((relativePath) => {
    const bytes = fs.readFileSync(path.join(outputRoot, ...relativePath.split("/")));
    return { path: relativePath, size: bytes.length, sha256: sha256(bytes) };
  });
  const aggregate = sha256(Buffer.from(rows.map((row) => `${row.path}\0${row.size}\0${row.sha256}`).join("\n"), "utf8"));
  return { rows, aggregate };
}

function normalizeSpace(value) {
  return value.replace(/\r\n?/g, "\n").replace(/\s+/g, " ").trim();
}

function canonicalMarkup(value) {
  return canonicalizeHtmlContractMarkup(value);
}

function stripMarkup(value) {
  return canonicalizeRenderedText(value.replace(/<script\b[\s\S]*?<\/script>/gi, " ").replace(/<style\b[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
}

function firstMatch(html, regex, label) {
  const match = html.match(regex);
  assert.ok(match, `Missing ${label}`);
  return match[1] ?? match[0];
}

function elementSignatures(html, tagNames) {
  const head = firstMatch(html, /<head\b[^>]*>([\s\S]*?)<\/head>/i, "head");
  const tags = tagNames.join("|");
  return [...head.matchAll(new RegExp(`<(?:${tags})\\b[^>]*>`, "gi"))].map((match) => canonicalMarkup(match[0]));
}

function jsonLd(html) {
  return [...html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((match) => JSON.parse(match[1]));
}

function headings(html) {
  return [...html.matchAll(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((match) => ({
    level: match[1].toLowerCase(),
    text: stripMarkup(match[2])
  }));
}

function anchors(html) {
  return [...html.matchAll(/<a\b[\s\S]*?<\/a>/gi)].map((match) => canonicalMarkup(match[0]));
}

function scripts(html) {
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].map((match) => {
    const source = match[1].match(/\bsrc=["']([^"']+)["']/i);
    return source ? { source: source[1] } : { inline: normalizeSpace(match[2]) };
  });
}

function fragment(html, regex, label) {
  return canonicalMarkup(firstMatch(html, regex, label));
}

function assertHtmlParity(route) {
  const baselineHtml = gitBlob(route.baseline).toString("utf8");
  const outputHtml = fs.readFileSync(path.join(outputRoot, route.destination), "utf8");

  assert.deepEqual(elementSignatures(outputHtml, ["meta", "link"]), elementSignatures(baselineHtml, ["meta", "link"]), `${route.publicUrl}: meta/link contract changed`);
  assert.deepEqual(jsonLd(outputHtml), jsonLd(baselineHtml), `${route.publicUrl}: JSON-LD changed or is invalid`);
  assert.deepEqual(headings(outputHtml), headings(baselineHtml), `${route.publicUrl}: headings changed`);
  assert.deepEqual(anchors(outputHtml), anchors(baselineHtml), `${route.publicUrl}: links changed`);
  assert.deepEqual(scripts(outputHtml), scripts(baselineHtml), `${route.publicUrl}: script content/order changed`);

  const id = route.destination.startsWith("privacy") ? "privacy-content" : "terms-content";
  assert.equal(
    stripMarkup(firstMatch(outputHtml, new RegExp(`<section\\b[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/section>`, "i"), `${id} output`)),
    stripMarkup(firstMatch(baselineHtml, new RegExp(`<section\\b[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/section>`, "i"), `${id} baseline`)),
    `${route.publicUrl}: legal content changed`
  );

  assert.equal(fragment(outputHtml, /(<header\b[\s\S]*?<\/header>)/i, "header"), fragment(baselineHtml, /(<header\b[\s\S]*?<\/header>)/i, "baseline header"), `${route.publicUrl}: header changed`);
  assert.equal(fragment(outputHtml, /(<div\s+id=["']mobile-menu["'][\s\S]*?<\/div>)/i, "mobile navigation"), fragment(baselineHtml, /(<div\s+id=["']mobile-menu["'][\s\S]*?<\/div>)/i, "baseline mobile navigation"), `${route.publicUrl}: mobile navigation changed`);
  assert.equal(fragment(outputHtml, /(<footer\b[\s\S]*?<\/footer>)/i, "footer"), fragment(baselineHtml, /(<footer\b[\s\S]*?<\/footer>)/i, "baseline footer"), `${route.publicUrl}: footer changed`);

  assert.equal(firstMatch(outputHtml, /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i, "canonical"), route.canonical, `${route.publicUrl}: canonical changed`);
  assert.equal((outputHtml.match(/gtag\/js\?id=G-VW0JHKW0ZW/g) ?? []).length, 1, `${route.publicUrl}: gtag loader must be defined once`);
  assert.equal(/<script\b[^>]*\bsrc=["'][^"']*(?:googletagmanager|google-analytics|googleadservices|doubleclick)[^"']*["']/i.test(outputHtml), false, `${route.publicUrl}: Google script is requested before consent`);
  assert.equal(outputHtml.includes("GTM-"), false, `${route.publicUrl}: GTM container is forbidden in legacy-direct mode`);
  assert.equal((outputHtml.match(/js\/cookie-banner\.js/g) ?? []).length, 1, `${route.publicUrl}: cookie loader duplicated`);
}

function gitTreePublicFiles() {
  const result = run("git", ["ls-tree", "-r", "--name-only", BASE_COMMIT]);
  return result.stdout.split(/\r?\n/).filter(Boolean).filter((file) => file !== ".gitignore");
}

function localReferences(html) {
  const refs = [];
  for (const match of html.matchAll(/\b(href|src)=["']([^"']+)["']/gi)) {
    refs.push({ attribute: match[1].toLowerCase(), raw: match[2] });
  }
  return refs;
}

function resolveLocalReference(fromFile, raw, files) {
  if (!raw || raw.startsWith("#") || raw.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(raw)) return null;
  const clean = raw.split(/[?#]/, 1)[0];
  if (!clean) return null;
  let target = clean.startsWith("/")
    ? clean.slice(1)
    : path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), clean));
  target = target.replace(/^\.\//, "");
  const candidates = target === "" || target.endsWith("/")
    ? [path.posix.join(target, "index.html")]
    : path.posix.extname(target)
      ? [target]
      : [target, `${target}.html`, path.posix.join(target, "index.html")];
  return candidates.some((candidate) => files.has(candidate)) ? null : target;
}

function missingLinks(files, readHtml) {
  const fileSet = new Set(files);
  const missing = [];
  for (const file of canonicalPathSort(files.filter((candidate) => candidate.toLowerCase().endsWith(".html")))) {
    const html = readHtml(file);
    for (const reference of localReferences(html)) {
      const target = resolveLocalReference(file, reference.raw, fileSet);
      if (target !== null) missing.push(`${file}|${reference.attribute}|${reference.raw}|${target}`);
    }
  }
  return canonicalPathSort(missing);
}

assert.throws(() => assertMeasurementMode(undefined), /Unknown or missing measurement mode/);
assert.throws(() => assertMeasurementMode({ mode: "unknown" }), /Unknown or missing measurement mode/);
assert.throws(() => assertUniqueDestinations([{ destination: "A.html" }, { destination: "a.HTML" }]), /Duplicate output route/);

const measurement = JSON.parse(fs.readFileSync(path.join(root, "src", "_data", "measurement.json"), "utf8"));
assertMeasurementMode(measurement);
assert.equal(measurement.mode, "legacy-direct");

const configuredDestinations = [
  ...PASSTHROUGH_FILES.map((file) => ({ destination: file })),
  ...MIGRATED_ROUTES
];
assertUniqueDestinations(configuredDestinations);

const expectedOutputs = configuredDestinations.map((entry) => entry.destination);
assert.equal(new Set(expectedOutputs.map((file) => file.toLowerCase())).size, expectedOutputs.length, "Case-insensitive route collision");

const passthroughEvidence = [];
let gitBlobExact = 0;
let gitFilterEquivalent = 0;
let logicalMismatch = 0;

buildFromAbsentOutput();
const firstInventory = inventory();
const firstInventoryComparison = compareInventories(expectedOutputs, firstInventory.rows.map((row) => row.path));

run("git", ["diff", "--quiet", "--no-ext-diff", BASE_COMMIT, "--", ...PASSTHROUGH_FILES]);

for (const file of PASSTHROUGH_FILES) {
  const source = fs.readFileSync(path.join(root, ...file.split("/")));
  const output = fs.readFileSync(path.join(outputRoot, ...file.split("/")));
  const baseline = readGitBlobBuffer(BASE_COMMIT, file, root);
  const blob = baseline.buffer;
  const sourceHash = sha256(source);
  const outputHash = sha256(output);
  const blobHash = sha256(blob);
  const rawCopy = compareRawBuffers(source, output, `Passthrough ${file}`);

  const baseObjectId = baseline.objectId;
  const sourceObjectId = cleanFilteredObjectId(file, file);
  const outputObjectId = cleanFilteredObjectId(file, path.join("_site", ...file.split("/")));
  assert.equal(sourceObjectId, baseObjectId, `Passthrough source differs from Git base: ${file}`);
  assert.equal(outputObjectId, baseObjectId, `Passthrough output differs from Git base: ${file}`);

  let gitRelation = "RAW_EXACT";
  if (source.equals(blob)) {
    gitBlobExact += 1;
  } else {
    gitRelation = "GIT_FILTER_EQUIVALENT";
    gitFilterEquivalent += 1;
  }
  passthroughEvidence.push({
    file,
    sourceLength: source.length,
    outputLength: output.length,
    blobLength: baseline.observedLength,
    sourceHash,
    outputHash,
    blobHash,
    baseObjectId,
    sourceObjectId,
    outputObjectId,
    gitRelation,
    rawCopyResult: rawCopy.result
  });
}

assert.equal(logicalMismatch, 0, "A passthrough source differs logically from its Git baseline");

for (const special of ["sitemap.xml", "robots.txt", "_redirects"]) {
  const row = passthroughEvidence.find((entry) => entry.file === special);
  assert.ok(row && row.sourceHash === row.outputHash, `${special} was not preserved byte-for-byte`);
}

const configuratorFreezeEvidence = configuratorProtectedFiles.map((file) => {
  const passthrough = passthroughEvidence.find((entry) => entry.file === file);
  assert.ok(passthrough, `Configurator protected file is not passthrough: ${file}`);
  assert.equal(passthrough.sourceHash, passthrough.outputHash, `Configurator raw bytes changed: ${file}`);

  const baseObjectId = gitBlobObjectId(file);
  const sourceObjectId = cleanFilteredObjectId(file, file);
  const outputObjectId = cleanFilteredObjectId(file, path.join("_site", ...file.split("/")));
  assert.equal(sourceObjectId, baseObjectId, `Configurator source differs from base after Git clean filter: ${file}`);
  assert.equal(outputObjectId, baseObjectId, `Configurator output differs from base after Git clean filter: ${file}`);
  if (file.endsWith(".glb")) {
    assert.equal(passthrough.blobHash, passthrough.sourceHash, `Configurator binary base differs from source: ${file}`);
  }

  return {
    file,
    rawSourceSha256: passthrough.sourceHash,
    rawOutputSha256: passthrough.outputHash,
    baseObjectId,
    sourceObjectId,
    outputObjectId,
    result: "PASS"
  };
});

for (const route of MIGRATED_ROUTES) assertHtmlParity(route);

const forbiddenSegments = new Set(["src", "tests", "node_modules", ".git", "reports", "report", "_site"]);
for (const file of expectedOutputs) {
  const segments = file.toLowerCase().split("/");
  assert.equal(segments.some((segment) => forbiddenSegments.has(segment)), false, `Forbidden publish path: ${file}`);
  assert.equal(["package.json", "package-lock.json", "netlify.toml", ".nvmrc", "eleventy.config.js"].includes(file.toLowerCase()), false, `Forbidden publish file: ${file}`);
}

const baselineFiles = gitTreePublicFiles();
const baselineMissing = missingLinks(baselineFiles, (file) => gitBlob(file).toString("utf8"));
const outputMissing = missingLinks(expectedOutputs, (file) => fs.readFileSync(path.join(outputRoot, ...file.split("/")), "utf8"));
assert.deepEqual(outputMissing, baselineMissing, "Local-link scan changed the baseline missing-link set");

buildFromAbsentOutput();
const secondInventory = inventory();
const secondInventoryComparison = compareInventories(expectedOutputs, secondInventory.rows.map((row) => row.path));
assert.deepEqual(secondInventory, firstInventory, "Two clean consecutive builds are not byte-for-byte reproducible");
const binaryPostBuildEvidence = verifyRealBinaryOutputs({
  root,
  outputRoot,
  baseRef: BASE_COMMIT
});

for (const route of MIGRATED_ROUTES) assertHtmlParity(route);

const summary = {
  result: "PASS",
  node: process.version,
  outputCount: secondInventory.rows.length,
  passthroughCount: PASSTHROUGH_FILES.length,
  migratedCount: MIGRATED_ROUTES.length,
  aggregateSha256: secondInventory.aggregate,
  passthroughSourceToOutput: "PASS",
  binarySafeVerifier: "PASS",
  binaryPostBuild: "PASS",
  binaryPostBuildEvidence,
  gitBlobExact,
  gitFilterEquivalent,
  logicalMismatch,
  baselineMissingLinks: baselineMissing,
  inventory: {
    missing: secondInventoryComparison.missing,
    extra: secondInventoryComparison.extra,
    duplicates: secondInventoryComparison.duplicates,
    canonicalPaths: secondInventoryComparison.actual
  },
  firstInventory: {
    missing: firstInventoryComparison.missing,
    extra: firstInventoryComparison.extra,
    duplicates: firstInventoryComparison.duplicates
  },
  configuratorVisualFreeze: "PASS",
  configuratorFreezeEvidence
};

console.log(`VERIFY_SUMMARY=${JSON.stringify(summary)}`);
