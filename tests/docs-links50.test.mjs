import test from 'node:test';
import assert from 'node:assert/strict';
import {assertPublicLinkExtensions50} from './docs-50-literals.mjs';
test('50 only exact official Zoho FAQ link on privacy may end in html',()=>{
  assertPublicLinkExtensions50('/privacy-policy','<a href="https://www.zoho.com/privacy/privacy-faq.html">Zoho</a>');
  assertPublicLinkExtensions50('/','<a href="/contattaci">Contatti</a>');
});
for(const url of ['/contattaci.html','contattaci.html?x=1','https://solvex-ai3d.com/contattaci.html','https://other.invalid/privacy-faq.html','https://www.zoho.com/privacy/privacy-faq.html?unapproved=1']) {
  test('50 rejects unapproved html link '+url,()=>assert.throws(()=>assertPublicLinkExtensions50('/privacy-policy','<a href="'+url+'">Link</a>')));
}
test('50 exact external exception is restricted to the reviewed privacy page',()=>assert.throws(()=>assertPublicLinkExtensions50('/contattaci','<a href="https://www.zoho.com/privacy/privacy-faq.html">Zoho</a>')));
