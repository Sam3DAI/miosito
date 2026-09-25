import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import test from 'node:test';
const code=fs.readFileSync(new URL('../js/wd-ecommerce-embed.js',import.meta.url),'utf8');
const origin='https://local-qa.invalid';
const flush=async()=>{for(let i=0;i<6;i++)await Promise.resolve();};
function fixture(mode='native',source=code){
 const target=()=>({events:new Map(),addEventListener(t,fn){this.events.set(t,[...(this.events.get(t)||[]),fn]);},emit(t,e={}){for(const fn of this.events.get(t)||[])fn(e);}});
 const document=Object.assign(target(),{hidden:false,fullscreenEnabled:mode!=='unsupported',fullscreenElement:null,documentElement:{dataset:{theme:'light'}}});
 const node=(tag='div')=>Object.assign(target(),{tagName:tag.toUpperCase(),dataset:{},attrs:{},children:[],parentElement:null,style:{overflow:''},inert:false,hidden:false,disabled:false,textContent:'',setAttribute(k,v){this.attrs[k]=String(v);},getAttribute(k){return this.attrs[k]??null;},focus(){document.activeElement=this;document.emit('focusin',{target:this});},remove(){this.parentElement.children=this.parentElement.children.filter(x=>x!==this);this.parentElement=null;},replaceChildren(...children){this.children=children;for(const c of children)c.parentElement=this;}});
 const body=node('body'),section=node('section'),other=node('aside'),host=node(),sibling=node('p');
 document.body=body;document.activeElement=body;body.children=[section,other];section.parentElement=body;other.parentElement=body;section.children=[host,sibling];host.parentElement=section;sibling.parentElement=section;
 other.inert=true;body.style.overflow='auto';
 const nodes={start:node('button'),poster:node('figure'),status:node('p'),stage:node(),fullscreen:node('a'),label:node('span')};
 host.children=Object.values(nodes);for(const n of host.children)n.parentElement=host;
 host.dataset.state='idle';
 host.querySelector=s=>({'[data-wd46-start]':nodes.start,'[data-wd46-poster]':nodes.poster,'[data-wd46-status]':nodes.status,'[data-wd46-stage]':nodes.stage,'[data-wd47-fullscreen]':nodes.fullscreen,'[data-wd47-fullscreen-label]':nodes.label}[s]||null);
 document.querySelectorAll=s=>{assert.equal(s,'[data-wd46-embed]');return[host];};
 const frames=[],timers=new Map();let nextTimer=0,fsCalls=0,resolveFullscreen,rejectFullscreen;
 document.createElement=tag=>{assert.equal(tag,'iframe');const frame=node(tag);frame.contentWindow={postMessage(){}};frame.selection={model:'zip',total:25600,cart:['synthetic']};frames.push(frame);return frame;};
 const window=Object.assign(target(),{scrollX:0,scrollY:370,scrollTo(x,y){this.scrollX=x;this.scrollY=y;}});
 const enterNative=()=>{document.fullscreenElement=host;document.emit('fullscreenchange');};
 host.requestFullscreen=()=>{fsCalls++;if(mode==='throw')throw Error('Unavailable');if(mode==='denied')return Promise.reject(Error('Denied'));if(mode==='pending')return new Promise((resolve,reject)=>{resolveFullscreen=()=>{enterNative();resolve();};rejectFullscreen=()=>reject(Error('Late denial'));});enterNative();return Promise.resolve();};
 document.exitFullscreen=()=>{document.fullscreenElement=null;document.emit('fullscreenchange');return Promise.resolve();};
 class MutationObserver{observe(){}}
 vm.runInNewContext(source,{document,window,location:{origin},MutationObserver,Promise,setTimeout(fn,ms){timers.set(++nextTimer,{fn,ms});return nextTimer;},clearTimeout(id){timers.delete(id);}});
 const click=(n,event={})=>{const e={target:n,prevented:false,preventDefault(){this.prevented=true;},...event};n.emit('click',e);return e;};
 const ready=()=>window.emit('message',{origin,source:frames.at(-1).contentWindow,data:{type:'solvex-wd46-ready'}});
 return{document,window,host,nodes,frames,other,sibling,timers,ready,click,fullscreen:()=>click(nodes.fullscreen),fsCalls:()=>fsCalls,resolveFullscreen:()=>resolveFullscreen(),rejectFullscreen:()=>rejectFullscreen(),escape:()=>document.emit('keydown',{key:'Escape',preventDefault(){}}),message:(type,event={})=>window.emit('message',{origin,source:frames.at(-1)?.contentWindow,data:{type},...event})};
}
test('47 toolbar stays dormant and preserves a native standalone fallback until bound',()=>{
 const f=fixture();assert.equal(f.frames.length,0);assert.equal(f.fsCalls(),0);assert.equal(f.nodes.fullscreen.getAttribute('role'),'button');assert.equal(f.nodes.label.textContent,'Schermo intero');
 const markup=fs.readFileSync(new URL('../src/_includes/partials/wd-ecommerce-demo.njk',import.meta.url),'utf8');
 assert.ok(markup.indexOf('data-wd47-fullscreen')<markup.indexOf('data-wd46-poster'));
 assert.match(markup,/<a[^>]+data-wd47-fullscreen[^>]+href="\/demo\/ecommerce\/"/);
 assert.equal((markup.match(/Demo con prezzi esemplificativi\./g)||[]).length,1);
 assert.doesNotMatch(markup,/Apri la demo in pagina intera|Nessun ordine viene inviato/);
});

test('47 expanded fallback visually covers inert background widgets without changing consent',()=>{
 const css=fs.readFileSync(new URL('../css/wd-ecommerce-embed.css',import.meta.url),'utf8');
 const consent=fs.readFileSync(new URL('../css/cookie-banner.css',import.meta.url),'utf8');
 function check(source){
  const rule=source.match(/\.wd46-embed\[data-expanded="fallback"\]\s*\{([^}]+)\}/)?.[1];assert.ok(rule);
  const level=Number(rule.match(/z-index:\s*(\d+)/)?.[1]);
  const background=Math.max(...[...consent.matchAll(/z-index:\s*(\d+)/g)].map(m=>Number(m[1])));
  assert.equal(level,11000);assert.ok(level>background);assert.match(rule,/position:\s*fixed/);assert.match(rule,/inset:\s*0/);
 }
 check(css);assert.throws(()=>check(css.replace('z-index: 11000','z-index: 1100')));
});
test('47 fullscreen activates exactly one iframe, preserves selection and handles native exit',async()=>{
 const f=fixture();f.fullscreen();await flush();f.ready();const frame=f.frames[0],selection=frame.selection;
 assert.equal(f.frames.length,1);assert.equal(f.host.dataset.expanded,'native');assert.equal(f.nodes.label.textContent,'Esci schermo intero');
 f.fullscreen();await flush();assert.equal(f.host.dataset.expanded,'none');assert.equal(f.document.activeElement,f.nodes.fullscreen);
 f.fullscreen();await flush();assert.equal(f.frames.length,1);assert.equal(f.frames[0],frame);assert.equal(frame.selection,selection);assert.deepEqual(selection.cart,['synthetic']);
});
test('47 native fullscreenchange updates controls without restarting the scene',async()=>{
 const f=fixture();f.fullscreen();await flush();f.ready();f.document.fullscreenElement=null;f.document.emit('fullscreenchange');
 assert.equal(f.host.dataset.expanded,'none');assert.equal(f.nodes.label.textContent,'Schermo intero');assert.equal(f.frames.length,1);
});

test('47 Escape explicitly exits native fullscreen from toolbar and authenticated iframe',async()=>{
 for(const viaFrame of [false,true]){
  const f=fixture();f.fullscreen();await flush();f.ready();const frame=f.frames[0],selection=frame.selection;
  if(viaFrame){for(const wrong of [{origin:'https://wrong.invalid'},{source:{}},{data:{type:'solvex-wd47-exit-expanded',extra:true}}]){f.message('solvex-wd47-exit-expanded',wrong);assert.equal(f.host.dataset.expanded,'native');}}
  viaFrame?f.message('solvex-wd47-exit-expanded'):f.escape();await flush();
  assert.equal(f.document.fullscreenElement,null);assert.equal(f.host.dataset.expanded,'none');assert.equal(f.document.activeElement,f.nodes.fullscreen);assert.equal(f.frames.length,1);assert.equal(f.frames[0],frame);assert.equal(frame.selection,selection);
 }
});

test('47 negative rejects Escape that leaves native fullscreen open',async()=>{
 async function closes(source){const f=fixture('native',source);f.fullscreen();await flush();f.ready();f.escape();await flush();assert.equal(f.document.fullscreenElement,null);}
 await closes(code);
 const block="        if (document.fullscreenElement === host) {\n          document.exitFullscreen().catch(() => {\n            if (document.fullscreenElement === host && host.dataset.state === 'ready') status.textContent = 'Usa il comando Esci schermo intero per uscire.';\n          });\n        }";
 const normalized=code.replace(/\r\n/g,'\n'),changed=normalized.replace(block,'');assert.notEqual(changed,normalized);await assert.rejects(()=>closes(changed));
});
test('47 loading and pending fullscreen cannot create duplicate engines',async()=>{
 const f=fixture('pending');f.fullscreen();f.fullscreen();f.click(f.nodes.start);assert.equal(f.frames.length,1);assert.equal(f.fsCalls(),1);f.resolveFullscreen();await flush();f.ready();assert.equal(f.host.dataset.expanded,'native');
});

test('47 rejected native exits only warn while still fullscreen and ready',async()=>{
 for(const trigger of ['escape','fullscreen'])for(const end of ['exited','error','still-native']){
  const f=fixture();f.fullscreen();await flush();f.ready();let rejectExit;
  f.document.exitFullscreen=()=>new Promise((resolve,reject)=>{rejectExit=reject;});
  f[trigger]();
  if(end==='exited'){f.document.fullscreenElement=null;f.document.emit('fullscreenchange');}
  if(end==='error')f.message('solvex-wd46-error');
  const previous=f.nodes.status.textContent;rejectExit(Error('Delayed exit rejection'));await flush();
  if(end==='still-native')assert.match(f.nodes.status.textContent,/Usa/);
  else assert.equal(f.nodes.status.textContent,previous);
  assert.equal(f.frames.length,1);
 }
});

test('47 negative rejects stale exit errors that overwrite a genuine demo failure',async()=>{
 async function keepsError(source){
  const f=fixture('native',source);f.fullscreen();await flush();f.ready();let rejectExit;
  f.document.exitFullscreen=()=>new Promise((resolve,reject)=>{rejectExit=reject;});
  f.escape();f.message('solvex-wd46-error');const previous=f.nodes.status.textContent;
  rejectExit(Error('Delayed exit rejection'));await flush();assert.equal(f.nodes.status.textContent,previous);
 }
 await keepsError(code);const guard="if (document.fullscreenElement === host && host.dataset.state === 'ready') ";
 const changed=code.replace(guard,'');assert.notEqual(changed,code);await assert.rejects(()=>keepsError(changed));
});
test('47 unsupported, rejected and thrown fullscreen use a labelled same-page fallback',async()=>{
 for(const mode of ['unsupported','denied','throw']){
  const f=fixture(mode);f.fullscreen();await flush();f.ready();const frame=f.frames[0];
  assert.equal(f.host.dataset.expanded,'fallback');assert.match(f.nodes.status.textContent,/Vista estesa nella pagina/);assert.equal(f.nodes.label.textContent,'Esci vista estesa');
  assert.equal(f.sibling.inert,true);assert.equal(f.document.body.style.overflow,'hidden');
  f.escape();assert.equal(f.host.dataset.expanded,'none');assert.equal(f.sibling.inert,false);assert.equal(f.other.inert,true);assert.equal(f.document.body.style.overflow,'auto');assert.equal(f.window.scrollY,370);assert.equal(f.frames[0],frame);
 }
});
test('47 Space works as a button while modified anchor clicks remain native',async()=>{
 const f=fixture('unsupported');for(const key of ['ctrlKey','metaKey','shiftKey','altKey']){const e=f.click(f.nodes.fullscreen,{[key]:true});assert.equal(e.prevented,false);}
 assert.equal(f.frames.length,0);f.nodes.fullscreen.emit('keydown',{key:' ',preventDefault(){}});assert.equal(f.host.dataset.expanded,'fallback');f.fullscreen();assert.equal(f.host.dataset.expanded,'none');
});
test('47 authenticated Escape from the iframe leaves fallback, spoofed/extra messages cannot',async()=>{
 const f=fixture('unsupported');f.fullscreen();f.ready();
 for(const wrong of [{origin:'https://wrong.invalid'},{source:{}},{data:{type:'solvex-wd47-exit-expanded',extra:true}}]){f.message('solvex-wd47-exit-expanded',wrong);assert.equal(f.host.dataset.expanded,'fallback');}
 f.message('solvex-wd47-exit-expanded');assert.equal(f.host.dataset.expanded,'none');assert.equal(f.frames.length,1);
});
test('47 negatives reject reactivation on fullscreen and unrecovered inert siblings',async()=>{
 async function sameFrame(source){const f=fixture('unsupported',source);f.click(f.nodes.start);f.ready();const first=f.frames[0];f.fullscreen();assert.equal(f.frames.length,1);assert.equal(f.frames[0],first);}
 await sameFrame(code);const reactivation=code.replace('activate(false);','frame = null; ready = false; host.dataset.state = "idle"; activate(false);');assert.notEqual(reactivation,code);await assert.rejects(()=>sameFrame(reactivation));
 function restore(source){const f=fixture('unsupported',source);f.fullscreen();f.escape();assert.equal(f.sibling.inert,false);}
 restore(code);const lost=code.replace('element.inert = inert;','element.inert = true;');assert.notEqual(lost,code);assert.throws(()=>restore(lost));
});
test('47 view expansion and exit preserve loading and genuine demo errors',()=>{
 const f=fixture('unsupported');f.fullscreen();assert.match(f.nodes.status.textContent,/Caricamento/);
 f.message('solvex-wd46-error');const error=f.nodes.status.textContent;assert.match(error,/Riprova/);f.escape();assert.equal(f.nodes.status.textContent,error);assert.equal(f.host.dataset.state,'error');
});
test('47 Escape cancels delayed fullscreen rejection and delayed native success',async()=>{
 for(const settle of ['rejectFullscreen','resolveFullscreen'])for(const viaFrame of [false,true]){
  const f=fixture('pending');f.fullscreen();viaFrame?f.message('solvex-wd47-exit-expanded'):f.escape();f[settle]();await flush();
  assert.equal(f.host.dataset.expanded,'none');assert.equal(f.document.fullscreenElement,null);assert.equal(f.sibling.inert,false);assert.equal(f.frames.length,1);
 }
});
test('47 held Space opens once and never toggles on repeated keydown',()=>{
 const f=fixture('unsupported');f.nodes.fullscreen.emit('keydown',{key:' ',repeat:false,preventDefault(){}});
 for(let i=0;i<4;i++)f.nodes.fullscreen.emit('keydown',{key:' ',repeat:true,preventDefault(){}});
 assert.equal(f.host.dataset.expanded,'fallback');assert.equal(f.frames.length,1);
});
test('47 negatives reject stale fullscreen fallback, cleared errors and Space autorepeat',async()=>{
 async function cancelled(source){const f=fixture('pending',source);f.fullscreen();f.escape();f.rejectFullscreen();await flush();assert.equal(f.host.dataset.expanded,'none');}
 await cancelled(code);const stale=code.replace('if (attempt === fullscreenAttempt) enterFallback();','enterFallback();');assert.notEqual(stale,code);await assert.rejects(()=>cancelled(stale));
 function errorKept(source){const f=fixture('unsupported',source);f.fullscreen();f.message('solvex-wd46-error');const message=f.nodes.status.textContent;f.escape();assert.equal(f.nodes.status.textContent,message);}
 errorKept(code);const cleared=code.replace("if (host.dataset.state === 'ready') status.textContent = '';","status.textContent = '';");assert.notEqual(cleared,code);assert.throws(()=>errorKept(cleared));
 function held(source){const f=fixture('unsupported',source);for(const repeat of [false,true])f.nodes.fullscreen.emit('keydown',{key:' ',repeat,preventDefault(){}});assert.equal(f.host.dataset.expanded,'fallback');}
 held(code);const repeated=code.replace('if (!event.repeat) toggleExpanded(event);','toggleExpanded(event);');assert.notEqual(repeated,code);assert.throws(()=>held(repeated));
});
