import assert from 'node:assert/strict';

const ROUTE='demo/ecommerce/';
const POSTER_TAIL=Object.freeze(['assets/images/wd47-poster-768.webp','assets/images/wd47-poster-1200.webp']);
const ORACLE_POSTER_HEAD=Object.freeze(['assets/images/wd47-poster-1200.webp','assets/images/wd47-poster-768.webp']);

// The hash oracle is globally lexical. Eleventy's reviewed declaration keeps
// all65 demo entries in that order, then the responsive posters768/1200. Move
// only those two exact names. Never sort the actual registry or its consumers.
export function orderWdOwnedStaticFiles47(reviewedFiles) {
  assert.ok(Array.isArray(reviewedFiles),'WD47 owned registry: reviewed list required');
  assert.equal(reviewedFiles.length,67,'WD47 owned registry: exactly65 demo files plus2 posters');
  assert.equal(new Set(reviewedFiles).size,67,'WD47 owned registry: duplicate reviewed path');
  assert.ok(reviewedFiles.every(file=>typeof file==='string'),'WD47 owned registry: paths must be text');
  assert.deepEqual(reviewedFiles.slice(0,2),ORACLE_POSTER_HEAD,'WD47 owned registry: exact lexical oracle poster head');
  const demo=reviewedFiles.slice(2);
  assert.ok(demo.every(file=>file.startsWith(ROUTE)),'WD47 owned registry: every remaining reviewed entry is a demo file');
  assert.ok(demo.every((file,index)=>index===0||demo[index-1]<file),'WD47 owned registry: preserve the reviewed demo order');
  return Object.freeze([...demo,...POSTER_TAIL]);
}

export function assertWdOwnedStaticOrder47(actual,reviewedFiles) {
  assert.deepEqual(actual,orderWdOwnedStaticFiles47(reviewedFiles),'WD47 owned registry differs from exact reviewed declaration order');
  return {files:67,demoFiles:65,posterFiles:2,actualSorted:false};
}
