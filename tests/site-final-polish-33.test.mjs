import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { assertPolish33Sources, assertPolish33Html, beforePolish33 } from "./site-final-polish-33.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const shell = fs.readFileSync(path.join(root,"js/site-shell.js"),"utf8");
function events() {
  const listeners=new Map();
  return {listeners,addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},emit(type,event={}){for(const fn of listeners.get(type)||[])fn(event);}};
}
function fixture({page="home",reduced=false,hash="",noObserver=false,noAnimation=false,setupError=false,animationError=false,saved=null,storageError=false,print=false}={}) {
  const metas=[{},{}].map(()=>({content:null,setAttribute(_,value){this.content=value;}}));
  const toggle=Object.assign(events(),{attributes:{},setAttribute(key,value){this.attributes[key]=value;}});
  let bodyDark=false, mutation;
  const calls=[];
  const groups=[100,1500,2600,3000,4000,5000,6000].map((top,index)=>({index,top,dataset:{},closest(selector){const parent=[".page-hero",".mini-form-shell",".service-demo-shell","form"][index-3];return parent&&selector.includes(parent)?{className:parent}:null;},querySelector(){return null;},getBoundingClientRect(){return{top:this.top,bottom:this.top+200};},contains(target){return target===this || target?.group===this;},animate(keyframes,options){if(animationError)throw Error("synthetic animation failure");const animation={keyframes,options,group:this,cancelled:false,cancel(){this.cancelled=true;}};calls.push(animation);return animation;}}));
  const preference=Object.assign(events(),{matches:reduced});
  const observed=new Set(); let callback, disconnected=false;
  const window=Object.assign(events(),{innerHeight:900,location:{hash},matchMedia(query){return query.includes("reduced-motion")?preference:{matches:query==="print"&&print,addEventListener(){}};}});
  if(!noObserver)window.IntersectionObserver=class{constructor(fn){if(setupError)throw Error("synthetic setup failure");callback=fn;}observe(group){observed.add(group);}unobserve(group){observed.delete(group);}disconnect(){observed.clear();disconnected=true;}};
  const document=Object.assign(events(),{
    documentElement:{dataset:{},classList:{add(){}}},
    body:{dataset:{page},classList:{toggle(_,value){bodyDark=value;},contains(){return bodyDark;}}},
    activeElement:null,
    querySelector(selector){return selector==="[data-theme-toggle]"?toggle:null;},
    querySelectorAll(selector){if(selector==='meta[name="theme-color"]')return metas;if(selector.startsWith("main .section-heading"))return groups;return[];}
  });
  const localStorage={getItem(){if(storageError)throw Error("denied");return saved;},setItem(_,value){if(storageError)throw Error("denied");saved=value;}};
  vm.runInNewContext(shell,{window,document,localStorage,Element:{prototype:noAnimation?{}:{animate(){}}},MutationObserver:class{constructor(fn){mutation=fn;}observe(){}}});
  return{document,window,metas,toggle,groups,calls,observed,preference,
    enter(index){const group=groups[index];group.top=300;callback?.([{target:group,isIntersecting:true}]);},
    setLegacyTheme(dark){bodyDark=dark;mutation();},
    get saved(){return saved;},get disconnected(){return disconnected;}
  };
}

test("task33 permits only declared copy/layout/meta changes and freezes lead, 3D, images and shared type",()=>{
  assert.equal(assertPolish33Sources(root).result,"PASS");
});
test("task33 normalization does not hide menu or payload mutations",()=>{
  const original=beforePolish33("js/site-shell.js",shell);
  assert.notEqual(beforePolish33("js/site-shell.js",shell.replace("let restoreFocus = false","let restoreFocus = true")),original);
  assert.notEqual(beforePolish33("src/_data/navigation.json",'{"href":"/wrong","label":"Configuratori"}'),'{"href":"/configuratori-3d-2d","label":"Configuratori 2D/3D"}');
});
test("theme has one owner per page, synchronized color hints and persistent explicit choice",()=>{
  for(const page of ["home","ecommerce","contact","configurators"]){
    const f=fixture({page});
    const legacy=["contact","configurators"].includes(page);
    assert.equal(f.toggle.listeners.get("click")?.length||0,legacy?0:1);
    for(const theme of ["dark","light"]){
      if(legacy)f.setLegacyTheme(theme==="dark");else f.toggle.emit("click");
      assert.equal(f.document.documentElement.dataset.theme,theme);
      assert.equal(f.toggle.attributes["aria-pressed"],String(theme==="dark"));
      assert.ok(f.metas.every(m=>m.content===(theme==="dark"?"#000000":"#f5f5f7")));
      if(!legacy)assert.equal(f.saved,theme);
    }
  }
});
test("theme storage denial remains non-blocking and bootstrap honors explicit color before paint",()=>{
  const f=fixture({storageError:true});f.toggle.emit("click");assert.equal(f.document.documentElement.dataset.theme,"dark");
  const script=fs.readFileSync(path.join(root,"src/_includes/partials/theme-bootstrap.njk"),"utf8").match(/<script>([\s\S]*?)<\/script>/)[1];
  for(const saved of ["dark","light"]){const h=fixture();vm.runInNewContext(script,{document:h.document,localStorage:{getItem(){return saved;}}});assert.ok(h.metas.every(m=>m.content===(saved==="dark"?"#000000":"#f5f5f7")));}
});
test("editorial entry is a whole group, owner47R3 1100ms/24px, once only, without a persistent fill",()=>{
  const f=fixture();assert.equal(f.groups[0].dataset.editorialMotion,"shown");assert.equal(f.calls.length,0);
  f.enter(1);f.enter(1);assert.equal(f.calls.length,1);assert.equal(f.observed.has(f.groups[1]),false);
  assert.equal(f.calls[0].options.duration,1100);assert.equal(f.calls[0].options.easing,"cubic-bezier(0.22, 0.61, 0.36, 1)");assert.equal(f.calls[0].options.fill,"none");
  assert.equal(f.calls[0].keyframes[0].transform,"translateY(24px)");assert.equal(f.calls[0].keyframes[1].opacity,1);
});
test("missing observer/WAAPI, reduced motion, print and setup failures never hide or block groups",()=>{
  for(const opts of [{noObserver:true},{noAnimation:true},{reduced:true},{print:true},{setupError:true}]){const f=fixture(opts);assert.equal(f.calls.length,0);assert.equal(f.observed.size,0);for(const g of f.groups)assert.equal(g.style,undefined);}
  const f=fixture({animationError:true});f.enter(1);assert.equal(f.groups[1].dataset.editorialMotion,"shown");assert.equal(f.observed.has(f.groups[1]),false);
});
test("reduced-motion change cancels active animations and prevents replay later in the session",()=>{
  const f=fixture();f.enter(1);f.preference.matches=true;f.preference.emit("change",{matches:true});
  assert.equal(f.calls[0].cancelled,true);assert.equal(f.disconnected,true);f.enter(2);assert.equal(f.calls.length,1);
  f.preference.matches=false;f.preference.emit("change",{matches:false});f.enter(2);assert.equal(f.calls.length,1);
});
test("direct fragments, hash changes, focus and print make content immediately available",()=>{
  const direct=fixture({hash:"#soluzioni"});direct.enter(1);assert.equal(direct.calls.length,0);
  for(const event of ["hashchange","beforeprint"]){const f=fixture();f.enter(1);f.window.emit(event);assert.equal(f.calls[0].cancelled,true);f.enter(2);assert.equal(f.calls.length,1);}
  const f=fixture();f.document.emit("focusin",{target:{group:f.groups[2]}});f.enter(2);assert.equal(f.calls.length,0);
  f.enter(1);f.document.emit("focusin",{target:{group:f.groups[1]}});assert.equal(f.calls[0].cancelled,true);
});
test("legal and contact pages, forms, hero/CTA and rail tracks are not animation targets",()=>{
  for(const page of ["privacy","terms","contact"]){const f=fixture({page});assert.equal(f.observed.size,0);}
  const f=fixture();
  for(const group of f.groups.slice(3)){assert.equal(f.observed.has(group),false);f.enter(group.index);assert.equal(group.dataset.editorialMotion,undefined);}
  assert.equal(f.calls.length,0);
  assert.match(shell,/querySelectorAll\("main \.section-heading, main \.split-panel, main \.hero-editorial-note"\)/);
  const css=fs.readFileSync(path.join(root,"css/marketing-pages.css"),"utf8");assert.doesNotMatch(css,/editorialMotion|editorial-motion/);
});

test("intro output gate accepts the exact inset wrapper and fails on missing wrapper, extra heading or paragraph",()=>{
  const source=fs.readFileSync(path.join(root,"src/configuratori-3d-2d.njk"),"utf8");
  const html='<meta name="theme-color" content="#f5f5f7" media="(prefers-color-scheme: light)">'+source;
  assert.doesNotThrow(()=>assertPolish33Html("/configuratori-3d-2d",html));
  for(const changed of [html.replace('class="configurator-introduction editorial-inset"','class="missing"'),html.replace('<div class="cta-group">','<h2>Duplicate intro</h2><div class="cta-group">'),html.replace('<div class="cta-group">','<p>Third paragraph</p><div class="cta-group">')])assert.throws(()=>assertPolish33Html("/configuratori-3d-2d",changed));
});
