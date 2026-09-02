import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalizeHtmlContractMarkup,
  decodeHtmlCharacterReferences
} from "./html-contract.mjs";

test("HTML contract comparison treats character-reference serializations semantically", () => {
  const baseline = '<meta property="og:image" content="https://example.test/image.webp?quality=auto&format=auto">';
  const generated = '<meta property="og:image" content="https://example.test/image.webp?quality=auto&amp;format=auto">';

  assert.equal(
    canonicalizeHtmlContractMarkup(generated),
    canonicalizeHtmlContractMarkup(baseline)
  );
  assert.equal(decodeHtmlCharacterReferences("&#65;&#x42;&quot;&apos;&lt;&gt;"), "AB\"'<> ".trim());
});

test("HTML contract comparison still rejects real attribute changes", () => {
  const baseline = '<meta property="og:image" content="https://example.test/image.webp?quality=auto&format=auto">';
  const changedValue = '<meta property="og:image" content="https://example.test/image.webp?quality=low&amp;format=auto">';
  const missingAttribute = '<meta content="https://example.test/image.webp?quality=auto&amp;format=auto">';

  assert.notEqual(
    canonicalizeHtmlContractMarkup(changedValue),
    canonicalizeHtmlContractMarkup(baseline)
  );
  assert.notEqual(
    canonicalizeHtmlContractMarkup(missingAttribute),
    canonicalizeHtmlContractMarkup(baseline)
  );
});
