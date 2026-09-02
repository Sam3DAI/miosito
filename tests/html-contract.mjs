const namedCharacterReferences = Object.freeze({
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  quot: '"'
});

function normalizeSpace(value) {
  return value.replace(/\r\n?/g, "\n").replace(/\s+/g, " ").trim();
}

function numericCharacterReference(match, value, radix) {
  const codePoint = Number.parseInt(value, radix);
  if (
    !Number.isInteger(codePoint)
    || codePoint <= 0
    || codePoint > 0x10ffff
    || (codePoint >= 0xd800 && codePoint <= 0xdfff)
  ) {
    return match;
  }
  return String.fromCodePoint(codePoint);
}

export function decodeHtmlCharacterReferences(value) {
  return value.replace(
    /&(?:#([0-9]+)|#x([0-9a-f]+)|([a-z][a-z0-9]+));/gi,
    (match, decimal, hexadecimal, named) => {
      if (decimal !== undefined) return numericCharacterReference(match, decimal, 10);
      if (hexadecimal !== undefined) return numericCharacterReference(match, hexadecimal, 16);
      return namedCharacterReferences[named.toLowerCase()] ?? match;
    }
  );
}

export function canonicalizeHtmlContractMarkup(value) {
  return normalizeSpace(decodeHtmlCharacterReferences(value.replace(/>\s+</g, "><")));
}

export function canonicalizeRenderedText(value) {
  return normalizeSpace(decodeHtmlCharacterReferences(value));
}
