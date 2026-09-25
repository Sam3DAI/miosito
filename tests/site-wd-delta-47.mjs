import assert from 'node:assert/strict';

// Only these four reviewed callsites supersede WD46. Models, maps, CSP,
// generated routes, forms, privacy and every unrelated config byte stay visible.
export const wd47ConfigEdits = Object.freeze([
  {
    "id": "ZIP_THUMBNAIL",
    "before": "  \"demo/ecommerce/assets/img-prodotto/Zip.webp\",\n",
    "after": "  \"demo/ecommerce/assets/img-prodotto/Zip.png\",\n"
  },
  {
    "id": "REMOVE_INTERNAL_POSTERS_ONLY",
    "before": "  \"demo/ecommerce/assets/models/zip/zip.glb\",\n  \"demo/ecommerce/assets/poster-1440.webp\",\n  \"demo/ecommerce/assets/poster-768.webp\",\n  \"demo/ecommerce/babylonFx.js\",\n",
    "after": "  \"demo/ecommerce/assets/models/zip/zip.glb\",\n  \"demo/ecommerce/babylonFx.js\",\n"
  },
  {
    "id": "CAMERA_CONTROLLER",
    "before": "  \"demo/ecommerce/babylonScene.js\",\n  \"demo/ecommerce/data/compatibility.json\",\n",
    "after": "  \"demo/ecommerce/babylonScene.js\",\n  \"demo/ecommerce/camera-controller.js\",\n  \"demo/ecommerce/data/compatibility.json\",\n"
  },
  {
    "id": "PUBLISHED_POSTERS_47",
    "before": "  \"assets/images/wd46-poster-768.webp\",\n  \"assets/images/wd46-poster-1440.webp\",\n",
    "after": "  \"assets/images/wd47-poster-768.webp\",\n  \"assets/images/wd47-poster-1200.webp\",\n"
  }
].map(Object.freeze));
const lf = value => value.replace(/\r\n/g, '\n');
const count = (input, literal) => input.split(literal).length - 1;

export function afterWd47Config(baseline) {
  let current = lf(baseline);
  for (const edit of wd47ConfigEdits) {
    assert.equal(count(current, edit.before), 1, edit.id + ': exactly one reviewed WD46 callsite');
    assert.equal(count(current, edit.after), 0, edit.id + ': cannot apply WD47 twice');
    current = current.replace(edit.before, edit.after);
  }
  return current;
}

export function beforeWd47(file, input) {
  let current = lf(input);
  if (file !== 'eleventy.config.js' || !/wd47-poster-|demo\/ecommerce\/camera-controller\.js|demo\/ecommerce\/assets\/img-prodotto\/Zip\.png/.test(current)) return current;
  // Mixed, duplicated or incomplete integrations fail closed. This never
  // substitutes an entire file and never suppresses unknown additions.
  for (const edit of wd47ConfigEdits) {
    assert.equal(count(current, edit.after), 1, edit.id + ': exactly one reviewed WD47 callsite');
    assert.equal(count(current, edit.before), 0, edit.id + ': obsolete WD46 callsite must be absent');
    current = current.replace(edit.after, edit.before);
  }
  return current;
}

export function assertWd47ConfigDelta(current, baseline) {
  assert.equal(lf(current), afterWd47Config(baseline), 'Only four exact WD47 static-publication changes');
  assert.equal(beforeWd47('eleventy.config.js', current), lf(baseline), 'WD46 config remains fully recoverable for historical assertions');
}
