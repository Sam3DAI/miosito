import test from 'node:test';
import assert from 'node:assert/strict';
import { siteFooter46 } from './site-footer-46.mjs';
const shell = '<footer class="site-footer"><a href="/contattaci">Contatti</a></footer>';
test('46 site footer ignores distinct dialog footers but retains shell links exactly', () => {
  assert.equal(siteFooter46('<dialog><footer><a href="/image.webp">Immagine</a></footer></dialog>' + shell), shell);
});
test('46 missing, similar-class and duplicate site footers are rejected', () => {
  for (const value of ['', '<footer class="site-footer__column">Fake</footer>', '<footer class="not-site-footer">Fake</footer>', '<footer data-class="site-footer">Fake</footer>', shell + shell]) assert.throws(() => siteFooter46(value));
});
test('46 source mutation in a real shell footer remains visible to existing link oracle', () => {
  const changed = shell.replace('/contattaci', '/unexpected');
  assert.equal(siteFooter46(changed), changed);
  assert.notEqual(siteFooter46(changed), shell);
});
