import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {before48,after48,contract48,assert48Current,newFiles48,assert48NewFile} from './prelaunch-48-literals.mjs';
import {readGitBlobBuffer} from './git-binary-reader.mjs';
import {beforeDocs50} from './docs-50-literals.mjs';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8').replaceAll('\r\n','\n');
function fixture48(overrides={}) {
  const events=new Map(),query={matches:false,addEventListener(){}};
  const win={innerWidth:1440,innerHeight:900,matchMedia:()=>query,addEventListener:(type,fn)=>events.set(type,fn)};
  win.parent=win;
  const screen={width:1920,height:1080},navigator={userAgentData:{mobile:false}};
  const context={window:win,screen,navigator,location:{origin:'http://127.0.0.1:1'}};
  Object.assign(win,overrides);vm.runInNewContext(read('js/wd-availability.js'),context);
  return {gate:win.WD48Availability,win,screen,navigator,query,resize:()=>events.get('resize')()};
}
const desktop={width:1440,height:900,screenWidth:1920,screenHeight:1080,coarse:false,mobile:false};

test('48 new files are bounded; deleted availability, replaced launcher or broad EOL cannot pass',()=>{
  for(const file of Object.keys(newFiles48)){
    const current=read(file);assert48NewFile(file,current);
    for(const mutant of ['',current+'\nUNREVIEWED',current.replace(/48/, '49')])assert.throws(()=>assert48NewFile(file,mutant));
  }
  assert.throws(()=>assert48NewFile('js/extra.js',''));
});
test('48 exact deltas retain all historical bytes; every missing/duplicated callsite and unknown addition is rejected',()=>{
  const root=fileURLToPath(new URL('..',import.meta.url));assert48Current(root);
  for(const [file,edits] of Object.entries(contract48.edits)) {
    const old=readGitBlobBuffer(contract48.baseline,file,root).buffer.toString('utf8').replaceAll('\r\n','\n');
    const current=after48(file,old);
    assert.equal(before48(file,current),old);
    for(const e of edits) for(const mutation of ['',e.after+e.after,e.before]) {
      const mutant=current.replace(e.after,mutation);assert.notEqual(mutant,current);
      assert.throws(()=>assert.equal(mutant,after48(file,old)));
    }
    assert.notEqual(before48(file,current+'\n/* unreviewed extra */'),old);
  }
});
test('48 one predicate: phones portrait/landscape excluded, tablets and touch laptops allowed',()=>{
  const {gate}=fixture48();
  for(const [width,height,screenWidth,screenHeight,coarse,mobile,want] of [
    [390,844,390,844,true,false,false],[844,390,390,844,true,false,false],
    [932,600,430,932,true,false,false],[844,600,390,844,false,true,false],
    [744,1133,744,1133,true,false,true],[1133,744,744,1133,true,false,true],
    [768,1024,768,1024,true,false,true],[1024,768,768,1024,true,false,true],
    [1366,768,1366,768,true,false,true],[719,900,1920,1080,false,false,false],
    [1440,499,1920,1080,false,false,false]]) {
    assert.equal(gate.eligible({width,height,screenWidth,screenHeight,coarse,mobile}),want,JSON.stringify({width,height,coarse,mobile}));
  }
  for(const value of [NaN,Infinity,undefined]) assert.equal(gate.eligible({...desktop,width:value}),false);
  assert.equal(gate.eligible({...desktop,slotWidth:639}),false);
  assert.equal(gate.eligible({...desktop,width:744,slotWidth:679}),true);
  assert.equal(gate.eligible({...desktop,width:744,slotWidth:696}),true);
});
test('48 availability suspends asynchronous resource boundaries until real resize',async()=>{
  const f=fixture48({innerWidth:390});let nextDownload=0;
  f.gate.wait().then(()=>nextDownload++);await Promise.resolve();assert.equal(nextDownload,0);
  f.win.innerWidth=1440;f.resize();await Promise.resolve();assert.equal(nextDownload,1);
  f.win.innerHeight=400;f.resize();assert.equal(f.gate.allowed(),false);
  await Promise.resolve();assert.equal(nextDownload,1);
});
test('48 same-origin frame and wrapper share outer viewport; unknown parent fails closed to own dimensions',()=>{
  const f=fixture48({innerWidth:696,parent:{innerWidth:744,innerHeight:1133,location:{origin:'http://127.0.0.1:1'}}});
  assert.equal(f.gate.allowed(),true);
  f.win.parent.innerWidth=390;assert.equal(f.gate.allowed(),false);
  f.win.parent={location:{origin:'https://external.invalid'},innerWidth:1440,innerHeight:1000};assert.equal(f.gate.allowed(),false);
});

test('48 same-origin parent height resumes resource waits even when iframe dimensions stay fixed',async()=>{
  const parentEvents=new Map();
  const parent={innerWidth:744,innerHeight:400,location:{origin:'http://127.0.0.1:1'},addEventListener:(e,fn)=>parentEvents.set(e,fn),removeEventListener:e=>parentEvents.delete(e)};
  const f=fixture48({innerWidth:679,parent});let resumed=false;
  f.gate.wait().then(()=>resumed=true);await Promise.resolve();assert.equal(resumed,false);
  parent.innerHeight=1133;parentEvents.get('resize')();await Promise.resolve();assert.equal(resumed,true);
  assert.equal(f.gate.allowed(),true);
  parent.innerHeight=390;parentEvents.get('orientationchange')();assert.equal(f.gate.allowed(),false);
});
test('48 direct HTML has only gate, bridge and launcher; no heavy eager requests or URL force switch',()=>{
  const check=html=>{
    const scripts=[...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m=>m[1]);
    assert.deepEqual(scripts,['/js/wd-availability.js','./embed.js','./launch.js']);
    assert.doesNotMatch(html,/<(?:iframe|link)[^>]+(?:preload|\.glb|babylon)|<script[^>]+app\.js/);
    assert.match(html,/id="demoPreview"/);assert.match(html,/<img src="\/assets\/images\/wd47-poster-768\.webp"/);
    assert.match(html,/href="\/contattaci#contatti"/);assert.match(html,/href="\/configuratori-ecommerce#demo-form"/);
    assert.match(html,/class="button--quote" data-cta-role="quote" href="\/contattaci#contatti"/);
    assert.match(html,/class="button--explore" data-cta-role="explore" href="\/configuratori-ecommerce#demo-form"/);
    assert.match(html,/sizes="\(max-width: 1200px\) calc\(100vw - 40px\), 1160px"/);
  };
  const html=read('demo/ecommerce/index.html');check(html);
  assert.throws(()=>check(html.replace('</body>','<script src="./vendor/babylon.js"></script></body>')));
  assert.throws(()=>check(html.replace('wd47-poster-768.webp','missing.webp')));
  assert.throws(()=>check(html.replace('data-cta-role="quote"','data-cta-role="explore"')));
  assert.doesNotMatch(read('demo/ecommerce/launch.js'),/searchParams|localStorage|sessionStorage|fetch\(/);
  assert.match(read('demo/ecommerce/launch.js'),/event.source !== window.parent \|\| event.origin !== location.origin/);
});

test('48 launcher failure retains the actual poster, useful explanation and retry without an empty canvas success',async()=>{
  const nodes=new Map(),events=new Map(),scripts=[];
  for(const id of ['#demoPreview','.app-shell','#demoStart','#demoAvailability','#demoStatus'])nodes.set(id,{hidden:false,disabled:false,textContent:'',addEventListener:(type,fn)=>events.set(id+type,fn)});
  let errorCount=0;
  const document={querySelector:s=>nodes.get(s),documentElement:{dataset:{}},addEventListener:(t,f)=>events.set(t,f),createElement:()=>({remove(){this.removed=true;}}),head:{append:s=>{scripts.push(s);queueMicrotask(()=>s.onerror());}}};
  const window={WD48Availability:{allowed:()=>true,wait:()=>Promise.resolve(),subscribe(){}},addEventListener(){},WD46Display:{error(){errorCount++;events.get('wd48-error')();}}};window.parent=window;
  vm.runInNewContext(read('demo/ecommerce/launch.js'),{document,window,location:{origin:'http://127.0.0.1:1'},queueMicrotask,console});
  await events.get('#demoStartclick')();
  assert.equal(scripts.length,1);assert.equal(scripts[0].src,'./vendor/babylon.js');assert.equal(scripts[0].removed,true);
  assert.equal(errorCount,1);assert.equal(nodes.get('#demoPreview').hidden,false);assert.equal(nodes.get('.app-shell').hidden,true);
  assert.match(nodes.get('#demoAvailability').textContent,/non è disponibile/);assert.equal(nodes.get('#demoStart').disabled,false);
  assert.equal(nodes.get('#demoStart').textContent,'Riprova caricamento');
});
test('48 both activation paths and every deferred model/material boundary retain the gate',()=>{
  const wrapper=read('js/wd-ecommerce-embed.js'),launch=read('demo/ecommerce/launch.js');
  assert.match(wrapper,/const gate = window.WD48Availability/);assert.match(launch,/const gate = window.WD48Availability/);
  assert.match(wrapper,/const activate = [\s\S]*?if \(!gate.allowed\(\)\) return;/);
  assert.match(wrapper,/function updateAvailability\(\)[\s\S]*?poster.hidden = false; stage.hidden = true/);
  assert.match(read('demo/ecommerce/embed.js'),/isVisible:\(\)=>visible && window.WD48Availability.allowed\(\)/);
  for(const [file,fn] of [['app.js','loadJson(url)'],['app.js','bootViewer()'],['babylonScene.js','loadGLB(scene, camera, modelState, glbUrl, opts = {})'],['babylonScene.js','preloadMapLibrary(scene, mapLibrary)'],['modelCatalogLoader.js','fetchJson(url)']]) {
    const source=read('demo/ecommerce/'+file),tail=source.slice(source.indexOf('async function '+fn));
    assert(tail.indexOf('await window.WD48Availability.wait();')>=0 && tail.indexOf('await window.WD48Availability.wait();')<180,file+fn);
  }
});
function contrast(hex){const c=hex.match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return 1.05/(.2126*c[0]+.7152*c[1]+.0722*c[2]+.05);}
test('48 active white text contrast has margin; base pink/gradient and keyboard focus retained',()=>{
  assert(contrast('bb3fa7')>4.7);assert(contrast('d95bc5')<4.5);
  for(const file of ['css/foundation.css','css/404.css','richiesta-ricevuta.html']) {
    const css=read(file);assert.match(css,/:active \{ background(?:-color)?: #bb3fa7; color: #fff;/);
    assert.match(css,/:hover \{ background(?:-color)?: #bb3fa7; color: #fff;/);
    assert.match(css,/:focus-visible/);assert.match(css,/#d95bc5|var\(--sx-pink\)/);
  }
});
test('48 thank-you keeps whole content, no scripts, no lead events; border-box includes padding',()=>{
  const html=read('richiesta-ricevuta.html');assert.match(html,/main \{ box-sizing: border-box; min-width: 0;/);
  assert.match(html,/width: min\(560px, calc\(100% - 48px\)\)/);
  assert.doesNotMatch(html,/<script|<form|dataLayer|gtag|solvex_lead_success|overflow:\s*hidden/);
  assert.match(html,/href="\/"/);
});
test('48 card family remains full width and content-led; only blank-tail crop, no truncation',()=>{
  const css=read('css/marketing-pages.css');
  assert.match(css,/#automation-uses .visual-card__copy \{ padding: 1rem 1.25rem 0; \}/);
  assert.match(css,/AI-02"\] \{ --subject-reserve: 350 \/ 288; --quiet-tail: 16.666667%/);
  assert.match(css,/AI-08"\] \{ --subject-reserve: 350 \/ 272; --quiet-tail: 18.285714%/);
  assert.doesNotMatch(css,/line-clamp|text-overflow:\s*ellipsis/);
  assert.match(css,/height: auto; min-height: 28.125rem/);assert.match(css,/min-height: 25rem/);
  assert.doesNotMatch(css,/section-heading--center[^}]*text-align: left/);
});
test('48 privacy facts do not imply legal approval, anonymous leads, retention or pre-consent silence',()=>{
  // Preserve the historical48 facts; docs50 has a mandatory raw-source oracle
  // and semantic/negative tests for the newly approved criteria and runtime.
  const html=beforeDocs50('src/privacy-policy.njk',read('src/privacy-policy.njk')),terms=beforeDocs50('src/termini-condizioni.njk',read('src/termini-condizioni.njk'));
  for(const literal of ['unico operatore umano','Zoho Mail nel piano gratuito','lead_id','lead_source','non rende anonimi','prima della scelta','ad_personalization=denied','Puoi rifiutare Statistiche e Marketing']) assert(html.includes(literal),literal);
  assert.doesNotMatch(html,/24 mesi|14 mesi|IP troncato|Marketing\/Remarketing|società di hosting\/infrastruttura e manutenzione IT|adottiamo le garanzie/);
  assert.doesNotMatch(terms,/Foro competente esclusivo|implica accettazione|“as is”|Analytics\/Ads sono attivati solo/);
  assert.match(terms,/non un ordine, un pagamento/);
});
