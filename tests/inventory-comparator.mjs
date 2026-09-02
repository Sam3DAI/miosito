import { Buffer } from "node:buffer";

export class InventoryComparatorError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "InventoryComparatorError";
    this.code = code;
    this.details = details;
  }
}

export function canonicalByteCompare(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

export function canonicalPathSort(paths) {
  return [...paths].sort(canonicalByteCompare);
}

export function normalizeInventoryPath(value, label = "inventory path") {
  if (typeof value !== "string" || value.length === 0) {
    throw new InventoryComparatorError("INVALID_PATH", `${label} must be a non-empty string`, { value });
  }

  const slashPath = value.replaceAll("\\", "/").normalize("NFC");
  if (slashPath.startsWith("/") || slashPath.startsWith("//") || /^[A-Za-z]:/.test(slashPath)) {
    throw new InventoryComparatorError("INVALID_PATH", `${label} must be relative: ${value}`, { value });
  }
  if (/[<>:"|?*\u0000-\u001f\u007f]/u.test(slashPath)) {
    throw new InventoryComparatorError("INVALID_PATH", `${label} contains an invalid character: ${value}`, { value });
  }

  const segments = slashPath.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    throw new InventoryComparatorError("INVALID_PATH", `${label} contains an invalid segment: ${value}`, { value });
  }

  return segments.join("/");
}

function indexInventory(paths, label) {
  if (!Array.isArray(paths)) {
    throw new InventoryComparatorError("INVALID_INVENTORY", `${label} must be an array`, { label });
  }

  const set = new Set();
  const duplicates = new Set();
  for (let index = 0; index < paths.length; index += 1) {
    const normalized = normalizeInventoryPath(paths[index], `${label}[${index}]`);
    if (set.has(normalized)) duplicates.add(normalized);
    set.add(normalized);
  }

  const canonical = canonicalPathSort(set);
  if (duplicates.size > 0) {
    throw new InventoryComparatorError(
      "DUPLICATE_PATH",
      `${label} contains duplicate paths: ${canonicalPathSort(duplicates).join(", ")}`,
      { label, duplicates: canonicalPathSort(duplicates), canonical }
    );
  }

  return { set, canonical };
}

export function compareInventories(expectedPaths, actualPaths) {
  const expected = indexInventory(expectedPaths, "expected inventory");
  const actual = indexInventory(actualPaths, "actual inventory");
  const missing = expected.canonical.filter((item) => !actual.set.has(item));
  const extra = actual.canonical.filter((item) => !expected.set.has(item));

  if (missing.length > 0 || extra.length > 0) {
    throw new InventoryComparatorError(
      "INVENTORY_SET_MISMATCH",
      `Output inventory mismatch; missing=[${missing.join(", ")}], extra=[${extra.join(", ")}]`,
      { missing, extra, expected: expected.canonical, actual: actual.canonical }
    );
  }

  return {
    expected: expected.canonical,
    actual: actual.canonical,
    missing: [],
    extra: [],
    duplicates: []
  };
}
