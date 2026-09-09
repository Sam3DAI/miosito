import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { readGitBlobBuffer } from "./git-binary-reader.mjs";

export const BASE_32 = "93262817ac1473f937148d5cc8d2298a5eeb85e9";
export const headingContract32 = JSON.parse(fs.readFileSync(new URL("./heading-contract-32.json", import.meta.url), "utf8"));
export const cardCounts32 = Object.freeze({"/":17,"/chi-siamo":12,"/configuratori-3d-2d":0,"/configuratori-ecommerce":12,"/software-cpq-portali-commerciali":9,"/planner-configuratori-arredamento":15,"/automazioni-ai-business":23,"/contattaci":0});
const normalize = s => s.replace(/\r\n/g, "\n");
const cleanText = s => s.replace(/<[^>]*>/g,"").replace(/&amp;/g,"&").replace(/&#(?:39|x27);/g,"'").replace(/\s+/g," ").trim();
const hash = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const read = (root, file) => fs.readFileSync(path.join(root, file), "utf8");
export function assertDisplayOnlyText32(source, baseline) {
  const oldLiteral = "const bg = isDark ? '#000000' : '#FAFAFA';";
  const newLiteral = "const bg = isDark ? '#000000' : '#F5F5F7';";
  assert.equal(baseline.split(oldLiteral).length - 1, 2, "Exactly two authorized background callsites in baseline");
  assert.equal(normalize(source), normalize(baseline).replaceAll(oldLiteral, newLiteral), "No 3D change beyond the two day-background literals");
}
export function assertDisplayOnly32(root, outputRoot) {
  const file = "js/configuratori-3d-2d.js";
  const baseline = readGitBlobBuffer(BASE_32, file, root).buffer;
  const source = fs.readFileSync(path.join(root,file));
  assertDisplayOnlyText32(source.toString("utf8"), baseline.toString("utf8"));
  if (outputRoot) assert.deepEqual(fs.readFileSync(path.join(outputRoot,file)), source, "Display-only runtime output exactly equals source");
  return {file, baseline:BASE_32, baselineSha256:hash(baseline),sourceSha256:hash(source),changedLiterals:2,result:"PASS_DISPLAY_ONLY_NOT_BYTE_IDENTICAL"};
}
export function assertVisual32Sources(root) {
  assert.equal(headingContract32.count,32);
  assert.equal(headingContract32.headings.length,32);
  assert.equal(new Set(headingContract32.headings.map(h=>h.id)).size,32);
  const exceptions=headingContract32.headings.filter(h=>JSON.stringify(h.owner_lines)!==JSON.stringify(h.implementation_lines));
  assert.deepEqual(exceptions.map(h=>h.id),["ecom-integrations","planner-functions"]);
  const protectedFiles=["js/netlify-lead-form.js","js/ad-attribution-consent.js","js/service-demo-form.js","js/contattaci.js","js/site-shell.js","css/site-shell.css","src/_data/serviceDemos.json","src/_data/measurement.json","src/_data/navigation.json","src/_includes/partials/service-demo-form.njk","src/_includes/layouts/base.njk"];
  for(const file of protectedFiles) {
    const before=readGitBlobBuffer(BASE_32,file,root).buffer.toString("utf8");
    assert.equal(normalize(read(root,file)),normalize(before),file+" task32 freeze");
  }
  const templates=["index","chi-siamo","configuratori-3d-2d","configuratori-ecommerce","software-cpq-portali-commerciali","planner-configuratori-arredamento","automazioni-ai-business","contattaci"];
  for(const name of templates) {
    const file="src/"+name+".njk", before=normalize(readGitBlobBuffer(BASE_32,file,root).buffer.toString("utf8")),after=normalize(read(root,file));
    assert.equal(after.match(/^---[\s\S]*?\n---/)[0],before.match(/^---[\s\S]*?\n---/)[0],file+" unchanged metadata and ownership");
    assert.deepEqual(after.match(/<form\b[\s\S]*?<\/form>/g),before.match(/<form\b[\s\S]*?<\/form>/g),file+" exact embedded form contract");
    // Every pre-existing paragraph remains, except the explicitly retired working captions.
    const paras=s=>(s.match(/<p\b[^>]*>[\s\S]*?<\/p>/g)||[]).map(cleanText).filter(t=>!/^Illustrazioni di esempio, non screenshot/.test(t)).sort();
    const beforeParagraphs = name === "contattaci" ? before.replace(/<details class="faq-item">[\s\S]*?<\/details>/g, "") : before;
    assert.deepEqual(paras(after),paras(beforeParagraphs),file+" substantive paragraphs preserved");
    const sets = text => (text.match(/{% set (?:methodSteps|processItems|useItems) = \[[\s\S]*?\] %}/g)||[]).map(block=>block.replace(/, (?:icon|accent|highlight): "[^"]*"/g,""));
    assert.deepEqual(sets(after),sets(before),file+" process and AI use-case text/order");
  }
  const foundation=read(root,"css/foundation.css"), marketing=read(root,"css/marketing-pages.css");
  assert.match(foundation,/--sx-bg:\s*light-dark\(#f5f5f7, #000000\)/);
  assert.match(foundation,/--sx-bg-elevated:\s*light-dark\(#ffffff, #1d1d1f\)/);
  for(const role of ["page","section","card","lead","body","label","form"]) assert.match(foundation,new RegExp("--sx-type-"+role+":"));
  assert.doesNotMatch(marketing,/capability-card__media|original-image-note/);
  for(const file of ["css/marketing-pages.css","css/configuratori-3d-2d.css","css/contattaci.css"]) {
    const css=read(root,file).replace(/\.(?:privacy|terms)-container\s*>\s*h1,[\s\S]*?\}/g,"");
    for(const block of css.match(/[^{}]*h1[^{}]*\{[^}]*\}/g)||[]) assert.doesNotMatch(block,/font-size|line-height|letter-spacing/,"No page-specific H1 scale");
  }
  assertDisplayOnly32(root);
  return {headings:32,editorialExceptions:exceptions.map(h=>h.id),functionalCards:88,protectedFiles:protectedFiles.length,metadataAndParagraphs:"PASS"};
}
export function assertHeading32(html,h) {
  let matches;
  if(h.target===".final-cta h2") matches=[...html.matchAll(/<div class="final-cta">\s*<h2>([\s\S]*?)<\/h2>/g)].map(m=>({level:"h2",body:m[1]}));
  else if(h.level==="h1") matches=[...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map(m=>({level:"h1",body:m[1]}));
  else matches=[...html.matchAll(/<(h[1-6])\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/g)].filter(m=>m[2]===h.target.slice(1)).map(m=>({level:m[1],body:m[3]}));
  assert.equal(matches.length,1,h.id+" unique target");
  assert.equal(matches[0].level,h.level,h.id+" semantic level");
  assert.equal(cleanText(matches[0].body),h.implementation_lines.join(" "),h.id+" exact accessible text");
  const segments=matches[0].body.split('<span class="statement-line">');
  assert.equal(segments.shift().trim(),"",h.id+" no unsegmented duplicate text");
  assert.deepEqual(segments.map(cleanText),h.implementation_lines,h.id+" exact line segments");
  const highlighted=[...matches[0].body.matchAll(/<span class="gradient-text">([\s\S]*?)<\/span>/g)].map(m=>cleanText(m[1]));
  assert.deepEqual(highlighted,h.highlights,h.id+" exact highlighted words, allowing the preserved lexical e-commerce span");
}
export function assertVisual32Html(route,html) {
  for(const h of headingContract32.headings.filter(h=>h.route===route)) assertHeading32(html,h);
  assert.doesNotMatch(html,/>[^<]*(?:Visualizzazione illustrativa SolveX|Illustrazioni di esempio, non screenshot di progetti realizzati|Esempio illustrativo\. Le integrazioni)/);
  if(Object.hasOwn(cardCounts32,route)) {
    const tags=[...html.matchAll(/<[^>]+data-card-accent="([^"]+)"[^>]*>/g)];
    assert.equal(tags.length,cardCounts32[route],route+" complete semantic card inventory");
    for(const m of tags) assert.ok(["blue","violet","orange","teal","green","magenta"].includes(m[1]));
    assert.equal((html.match(/class="accent-text"/g)||[]).length,tags.length,route+" exactly one highlighted portion per functional card");
  }
  if(route==="/automazioni-ai-business") {
    assert.match(html,/<section class="page-hero page-hero--compact page-hero--text">/);
    assert.doesNotMatch(html,/<aside class="hero-editorial-note"/);
    const rail=html.match(/<ol[^>]*id="automation-uses"[\s\S]*?<\/ol>/)[0];
    assert.equal((rail.match(/data-rail-card/g)||[]).length,9);
    assert.doesNotMatch(rail,/<img\b/);
    assert.equal((html.match(/Input autorizzato, elaborazione circoscritta, controllo umano e output destinato al sistema corretto\./g)||[]).length,1);
  }
  if(route==="/contattaci") {
    const details=html.match(/<details class="faq-item">[\s\S]*?<\/details>/g)||[];
    assert.equal(details.length,3);
    assert.deepEqual(details.map(d=>({question:cleanText(d.match(/<summary>([\s\S]*?)<span class="faq-symbol"/)[1]),answer:cleanText(d.match(/<p>([\s\S]*?)<\/p>/)[1])})),[{"question":"Serve già un capitolato?","answer":"No. Un primo quadro di prodotto, utenti, dati e obiettivo è sufficiente per capire quale approfondimento serve."},{"question":"È possibile partire da cataloghi o processi esistenti?","answer":"Sì. Cataloghi, listini, documenti e passaggi attuali aiutano a definire vincoli e priorità in modo concreto."},{"question":"Quando arriva una stima?","answer":"Una stima attendibile richiede un perimetro minimo condiviso. Il primo confronto serve a capire quali informazioni mancano per formularla."}],"Exact owner-preserved contact questions and answers");
    for(const d of details) assert.match(d,/<span class="faq-symbol" aria-hidden="true"><svg viewBox="0 0 24 24"/);
    assert.doesNotMatch(html,/"@type"\s*:\s*"FAQPage"/);
  }
}

/* Read-only DOM probe. Execute this function through the approved real browser,
   never a jsdom/computed-style mock. The same measured rows feed the verifier. */
export function visualProbe32(expected) {
  const normalize=s=>s.replace(/\s+/g," ").trim();
  const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
  const role=(selector,name)=>[...document.querySelectorAll(selector)].filter(e=>name!=="section-title"||!e.closest(".mini-form-shell,.service-demo-shell,.lead-form-card")).map(e=>{
    const s=getComputedStyle(e);
    return {role:name,text:normalize(e.textContent),font:s.fontFamily,size:s.fontSize,weight:s.fontWeight,line:s.lineHeight,tracking:s.letterSpacing,rect:rect(e)};
  });
  const roles=[
    ...role("main > .page-hero h1, main .configurator-legacy-hero h1","page-title"),
    ...role("main .section-heading h2, main .split-panel__lead h2, main .final-cta h2, main .configurator-introduction h2, main .configurator-description h2, main .hero-editorial-note h2","section-title"),
    ...role("main [data-card-accent] h3, main [data-card-accent] strong","functional-card-title"),
    ...role("main .hero-lead, main .section-heading > p","lead"),
    ...role("main .function-grid p, main .process-list__text, main .feature-grid .card p, main .solution-grid .card p","body"),
    ...role("main .card__label","card-label"),
    ...role("main .mini-form-shell h2, main .service-demo-shell h2, main .lead-form-card h2","form-heading")
  ];
  const headings=expected.map(h=>{
    const nodes=[...document.querySelectorAll(h.target)],e=nodes[0];
    if(!e)return{id:h.id,error:"MISSING"};
    const textNodes=[],rects=[];
    const visit=node=>{if(node.nodeType===3)textNodes.push(node);else for(const child of node.childNodes)visit(child);};
    visit(e);
    for(const node of textNodes) {
      // Individual non-whitespace characters avoid counting span boxes or collapsed spaces.
      for(let i=0;i<node.textContent.length;i++)if(/\S/.test(node.textContent[i])) {
        const range=document.createRange();range.setStart(node,i);range.setEnd(node,i+1);
        for(const r of range.getClientRects())if(r.width>0&&r.height>0)rects.push({y:r.y,bottom:r.bottom,x:r.x,right:r.right});
      }
    }
    const ys=[];for(const r of rects)if(!ys.some(y=>Math.abs(y-r.y)<2))ys.push(r.y);
    const er=rect(e);
    return {id:h.id,count:nodes.length,level:e.tagName.toLowerCase(),text:normalize(e.textContent),lines:ys.length,expectedLines:h.desktop_line_count,overflow:rects.some(r=>r.x<er.x-1||r.right>er.right+1),rect:er};
  });
  const accents=[...document.querySelectorAll("[data-card-accent]")].map(e=>{
    const icon=e.querySelector(".function-icon"),title=e.querySelector(".accent-text");
    let surface=e;if(e.matches(".visual-card"))surface=e.querySelector(".visual-card__inner");
    return {text:normalize((e.querySelector("h3,strong")||e).textContent),key:e.getAttribute("data-card-accent"),icon:icon?getComputedStyle(icon).stroke:null,title:title?getComputedStyle(title).color:null,bg:getComputedStyle(surface).backgroundColor,iconSize:icon?[getComputedStyle(icon).width,getComputedStyle(icon).height]:null};
  });
  const capabilities=[...document.querySelectorAll(".capability-card")].map(e=>{
    const img=e.querySelector("img"),copy=e.querySelector(".capability-card__copy");
    return {id:img.getAttribute("data-original-asset"),card:rect(e),image:rect(img),copyEnd:rect(copy.querySelector(".card__arrow")).bottom,fit:getComputedStyle(img).objectFit,radius:getComputedStyle(img).borderRadius,color:getComputedStyle(copy.querySelector("p")).color,figureCount:e.querySelectorAll("figure,figcaption").length};
  });
  return {url:location.href,route:location.pathname,viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,theme:document.documentElement.getAttribute("data-theme"),bg:getComputedStyle(document.body).backgroundColor,overflow:document.documentElement.scrollWidth>innerWidth+1,roles,headings,accents,capabilities};
}
export function assertVisualMatrix32(rows,{desktop=false}={}) {
  assert.ok(rows.length>0,"Real browser rows required");
  for(const row of rows) {
    assert.equal(row.overflow,false,row.url+" horizontal overflow");
    assert.equal(row.bg,row.theme==="dark"?"rgb(0, 0, 0)":"rgb(245, 245, 247)",row.url+" real page background");
    for(const c of row.capabilities||[]) {
      assert.equal(c.figureCount,0,c.id+" no nested media or caption");
      assert.equal(c.fit,"contain",c.id+" complete image");
      assert.equal(c.radius,"0px",c.id+" no second rounded frame");
      assert.equal(c.color,"rgb(29, 29, 31)",c.id+" dark text in both themes");
      assert.ok(Math.abs(c.image.width-c.card.width)<1,c.id+" full card width");
      assert.ok(c.image.height<=c.card.height+1&&Math.abs(c.image.bottom-c.card.bottom)<1,c.id+" complete image aligned to bottom");
      assert.ok(c.copyEnd<=c.image.y+c.image.height*0.4+1,c.id+" copy stays above the lower 60 percent subject reserve; corroborated by screenshots");
    }
    for(const h of row.headings) {
      assert.equal(h.error,undefined,h.id);assert.equal(h.count,1,h.id);
      const expected=headingContract32.headings.find(e=>e.id===h.id);
      assert.equal(h.text,expected.implementation_lines.join(" "),h.id+" rendered text");
      assert.equal(h.level,expected.level,h.id+" level");
      assert.equal(h.overflow,false,h.id+" clipped line");
      if(desktop)assert.equal(h.lines,h.expectedLines,h.id+" actual DOM Range lines");
    }
    for(const a of row.accents) {
      assert.ok(a.icon&&a.title,a.text+" icon/title exist");
      assert.equal(a.icon,a.title,a.text+" exact computed accent equality");
      assert.deepEqual(a.iconSize,["32px","32px"],a.text+" shared icon size");
      assert.equal(a.bg,row.theme==="dark"?"rgb(29, 29, 31)":"rgb(255, 255, 255)",a.text+" neutral card surface");
      assert.ok(contrast32(a.title,a.bg)>=4.5,a.text+" computed accent contrast");
    }
  }
  const groups=new Map();
  for(const row of rows)for(const role of row.roles) {
    const key=row.viewport[0]+":"+role.role;
    const value=[role.font,role.size,role.weight,role.line,role.tracking];
    if(groups.has(key))assert.deepEqual(value,groups.get(key),key+" typography must match across pages");
    else groups.set(key,value);
  }
  return {rows:rows.length,roles:groups.size,headings:rows.reduce((n,r)=>n+r.headings.length,0),accents:rows.reduce((n,r)=>n+r.accents.length,0)};
}

export function contrast32(foreground,background) {
  const luminance=color=>{
    const rgb=color.match(/^rgb\((\d+), (\d+), (\d+)\)$/);
    assert.ok(rgb,"Measured opaque RGB required, not an assumed background");
    const values=rgb.slice(1).map(v=>{const s=Number(v)/255;return s<=0.04045?s/12.92:((s+0.055)/1.055)**2.4;});
    return values[0]*0.2126+values[1]*0.7152+values[2]*0.0722;
  };
  const a=luminance(foreground),b=luminance(background);
  return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
}

// External, real-browser evidence is never copied to the publish tree. LF-only
// text normalization binds it to code while tolerating Git's Windows checkout EOL.
export function visualBinding32(root) {
  const files=[];
  const walk=dir=>{for(const item of fs.readdirSync(path.join(root,dir),{withFileTypes:true})) {
    const file=dir+"/"+item.name;
    if(item.isDirectory())walk(file);else if(item.isFile())files.push(file);
  }};
  for(const dir of ["src","css","js"])walk(dir);
  files.push("tests/heading-contract-32.json","tests/visual-consistency-32.mjs");
  return hash(Buffer.from(files.sort().map(file=>file+"\0"+hash(Buffer.from(normalize(read(root,file))))).join("\n")));
}
export function assertVisualEvidence32(root,evidencePath) {
  const evidence=JSON.parse(fs.readFileSync(evidencePath,"utf8"));
  assert.equal(evidence.bindingSha256,visualBinding32(root),"Browser evidence must match the current application and probe");
  assert.equal(evidence.surface,"in-app real browser, CSS viewport override; no native DPR/zoom claim");
  for(const width of [320,390,768,820,1024,1366,1440,1920]) {
    const rows=evidence.rows.filter(r=>r.viewport[0]===width&&r.theme==="light");
    const routes=Object.keys(cardCounts32);
    if([390,1440].includes(width))routes.push("/privacy-policy","/termini-condizioni");
    assert.deepEqual(rows.map(r=>r.route).sort(),routes.sort(),"Required real crawl at "+width);
  }
  for(const width of [390,1440])for(const route of ["/","/configuratori-3d-2d","/configuratori-ecommerce","/automazioni-ai-business","/contattaci"]) {
    assert.ok(evidence.rows.some(r=>r.viewport[0]===width&&r.route===route&&r.theme==="dark"),route+" real dark context");
  }
  const measured=assertVisualMatrix32(evidence.rows);
  const desktop=assertVisualMatrix32(evidence.rows.filter(r=>[1366,1440].includes(r.viewport[0])),{desktop:true});
  return {result:"PASS",bindingSha256:evidence.bindingSha256,...measured,desktopHeadingObservations:desktop.headings,DPR_2_3:"NOT_TESTED_NON_BLOCKING",NATIVE_ZOOM_200:"NOT_TESTED_NON_BLOCKING"};
}
