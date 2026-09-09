import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {headingContract32,assertVisual32Sources,assertHeading32,assertDisplayOnlyText32,assertVisualMatrix32} from "./visual-consistency-32.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const htmlFor=h=>{
  const body=h.implementation_lines.map(line=>'<span class="statement-line">'+h.highlights.reduce((text,word)=>text.replace(word,'<span class="gradient-text">'+word+'</span>'),line)+'</span>').join(" ");
  const heading='<'+h.level+(h.target.startsWith("#")?' id="'+h.target.slice(1)+'"':"")+'>'+body+'</'+h.level+'>';
  return h.target===".final-cta h2"?'<div class="final-cta">'+heading+'</div>':heading;
};
test("task32 source scope: metadata, copy, six lead bindings and exact two-literal 3D delta",()=>{assert.equal(assertVisual32Sources(root).headings,32)});
test("all 32 independent owner heading records validate exact text, levels and segments",()=>{for(const h of headingContract32.headings)assertHeading32(htmlFor(h),h)});
test("heading gate rejects missing spaces, missing lines, duplicated targets and wrong levels",()=>{
  const h=headingContract32.headings.find(h=>h.id==="home-complexity"),html=htmlFor(h);
  for(const bad of [html.replace('</span> <span','</span><span'),html.replace('la vendita non deve esserlo.','la vendita'),html+html,html.replaceAll('h2','h3')])assert.throws(()=>assertHeading32(bad,h));
});
test("3D display exception rejects any simultaneous functional change",()=>{
  const baseline="const bg = isDark ? '#000000' : '#FAFAFA';\nloadProduct();\nconst bg = isDark ? '#000000' : '#FAFAFA';";
  const allowed=baseline.replaceAll("'#FAFAFA'","'#F5F5F7'");
  assertDisplayOnlyText32(allowed,baseline);
  assert.throws(()=>assertDisplayOnlyText32(allowed.replace('loadProduct()','loadOtherProduct()'),baseline));
  assert.throws(()=>assertDisplayOnlyText32(baseline,baseline));
});
test("browser matrix gate rejects per-page typography drift and unequal computed accents",()=>{
  const role={role:"page-title",font:"system-ui",size:"64px",weight:"700",line:"73.6px",tracking:"-2.24px"};
  const row={url:"test",viewport:[1440,900],theme:"light",bg:"rgb(245, 245, 247)",roles:[role],headings:[],accents:[],overflow:false};
  assertVisualMatrix32([row]);
  assert.throws(()=>assertVisualMatrix32([row,{...row,roles:[{...role,size:"92px"}]}]));
  assert.throws(()=>assertVisualMatrix32([{...row,accents:[{text:"Rules",icon:"rgb(0, 0, 0)",title:"rgb(1, 1, 1)",iconSize:["32px","32px"]}]}]));
  assert.throws(()=>assertVisualMatrix32([{...row,overflow:true}]));
});
