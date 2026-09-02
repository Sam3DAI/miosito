import assert from "node:assert/strict";
import test from "node:test";
import {
  InventoryComparatorError,
  compareInventories
} from "./inventory-comparator.mjs";

test("same normalized set in a different order passes", () => {
  const result = compareInventories(
    ["chatbot-ai-intelligenti.html", "chatbot/css/main.css", "index.html"],
    ["index.html", "chatbot\\css\\main.css", "chatbot-ai-intelligenti.html"]
  );
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.extra, []);
  assert.deepEqual(result.duplicates, []);
  assert.deepEqual(result.actual, result.expected);
});

test("a missing path fails", () => {
  assert.throws(
    () => compareInventories(["a.html", "b.html"], ["a.html"]),
    (error) => error instanceof InventoryComparatorError
      && error.code === "INVENTORY_SET_MISMATCH"
      && error.details.missing.join(",") === "b.html"
      && error.details.extra.length === 0
  );
});

test("an extra path fails", () => {
  assert.throws(
    () => compareInventories(["a.html"], ["a.html", "extra.html"]),
    (error) => error instanceof InventoryComparatorError
      && error.code === "INVENTORY_SET_MISMATCH"
      && error.details.extra.join(",") === "extra.html"
      && error.details.missing.length === 0
  );
});

test("a duplicate path fails after separator normalization", () => {
  assert.throws(
    () => compareInventories(["a.html"], ["dir/file.css", "dir\\file.css"]),
    (error) => error instanceof InventoryComparatorError
      && error.code === "DUPLICATE_PATH"
      && error.details.duplicates.join(",") === "dir/file.css"
  );
});

test("absolute and parent-traversal paths fail closed", () => {
  assert.throws(() => compareInventories(["a.html"], ["C:\\site\\a.html"]), /must be relative/);
  assert.throws(() => compareInventories(["a.html"], ["../a.html"]), /invalid segment/);
});
