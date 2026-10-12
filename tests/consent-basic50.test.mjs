import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import {cookieFixture} from './cookie-runtime-40.test.mjs';
import {fileURLToPath} from 'node:url';
import {consent50,afterConsent50,beforeConsent50,assertConsent50Delta,assertConsent50Sources} from './consent-50-literals.mjs';
import {readGitBlobBuffer} from './git-binary-reader.mjs';

const source = fs.readFileSync(new URL('../js/consent-basic50.js', import.meta.url), 'utf8');
const banner = fs.readFileSync(new URL('../js/cookie-banner.js', import.meta.url), 'utf8');
const partial = fs.readFileSync(new URL('../src/_includes/partials/measurement-bootstrap.njk', import.meta.url), 'utf8');
const GA = 'G-VW0JHKW0ZW', ADS = 'AW-17512988470';
const lead = () => Object.freeze({event:'solvex_lead_success', lead_id:'00000000-0000-4000-8000-000000000001', form_name:'contact-main', lead_source:'contattaci_page'});

// Pure JS/DOM stubs, not browser hostname manipulation: no fetch, XHR, beacon,
// navigation or resource loader exists. Script URLs are inspected strings only.
function fixture({mode='gtm-verified', hostname='fixture.invalid', storage={}, cookieAccessThrows=false, referrer='', query='', hash='', ...options}={}) {
  const scripts=[], deletedCookies=[], cookieJar=new Map([['_ga','synthetic'],['_gcl_aw','synthetic'],['theme','dark'],['essential','keep']]);
  let rerun;
  const env = cookieFixture(banner, {storage, ...options, beforeBanner({window,document,context}) {
    delete window.SolveXConsent50;
    window.location={hostname,origin:'https://'+hostname,pathname:'/configuratori-ecommerce',search:query,hash,href:'https://'+hostname+'/configuratori-ecommerce'+query+hash};
    context.URL=URL;document.referrer=referrer;
    window.gtag=function(){window.dataLayer.push(arguments);};
    window.gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    document.currentScript={dataset:{measurementMode:mode,ga4Id:GA,adsId:ADS,gtmId:'GTM-MBBDZZFT'}};
    document.head={appendChild(node){scripts.push(node);}};
    Object.defineProperty(document,'cookie',{get(){if(cookieAccessThrows)throw Error('Synthetic cookie access denied');return [...cookieJar].map(([k,v])=>k+'='+v).join('; ');},set(value){deletedCookies.push(value);cookieJar.delete(value.split('=')[0]);}});
    rerun=()=>vm.runInContext(source,context,{filename:'consent-basic50.js'}); rerun();
  }});
  return {...env,scripts,deletedCookies,cookieJar,rerun};
}
function choose(env,analytics,ads) {
  env.get('.cc-revoke').click();
  env.get('#cc-analytics').checked=analytics;
  env.get('#cc-ads').checked=ads;
  env.get('.cc-panel-actions .cc-allow').click();
}
const rows=env=>env.window.dataLayer;
const commands=(env,name)=>rows(env).filter(row=>row?.[0]===name);
test('50 exact authorized literals preserve every historical oracle; missing/duplicate/altered and unrelated edits fail',()=>{
  const root=fileURLToPath(new URL('..',import.meta.url));assertConsent50Sources(root);
  for(const [file,edits] of Object.entries(consent50.edits)) {
    const baseline=readGitBlobBuffer(consent50.baseline,file,root).buffer.toString('utf8').replaceAll('\r\n','\n');
    const current=afterConsent50(file,baseline);assert.equal(beforeConsent50(file,current),baseline);
    for(const edit of edits)for(const altered of ['',edit.before,edit.after+edit.after])assert.throws(()=>assertConsent50Delta(file,current.replace(edit.after,altered),baseline));
    assert.throws(()=>assertConsent50Delta(file,current+'\nUNAUTHORIZED',baseline));
    assert.notEqual(beforeConsent50(file,current+'\nUNAUTHORIZED'),baseline);
  }
});
function observer(env) {
  const processed=[],state={};
  const previous=rows(env).push;
  rows(env).push=function(...items){
    const value=previous.apply(this,items);
    for(const item of items){
      if(item && !item[0]) Object.assign(state,item);
      if(item?.event==='solvex_lead_success') processed.push({event:item,statistics:state.solvex_event_statistics && env.window.__analyticsConsentGranted,marketing:state.solvex_event_marketing && env.window.__adsConsentGranted});
    }
    return value;
  };
  return processed;
}

test('50 default, no choice, essentials, denied/corrupt storage never create a Google request',()=>{
  for(const options of [{},{readThrows:true},{storage:{cookieconsent_status:'allow'}},{storage:{cookieconsent_prefs:'{broken'}},{storage:{cookieconsent_prefs:JSON.stringify({analytics:true,ads:true})}},{storage:{cookieconsent_prefs:JSON.stringify({analytics:true,ads:true,version:'unknown'})}}]) {
    const e=fixture(options); assert.equal(e.scripts.length,0); choose(e,false,false); assert.equal(e.scripts.length,0);
    assert.equal(e.window['ga-disable-'+GA],true);
    assert.equal(e.cookieJar.get('theme'),'dark'); assert.equal(e.cookieJar.get('essential'),'keep');
  }
});
test('50 all four categories retain default-update-load order, personalization denied and singleton load',()=>{
  for(const [analytics,ads] of [[false,false],[true,false],[false,true],[true,true]]) {
    const e=fixture(); choose(e,analytics,ads);
    assert.equal(e.scripts.length,Number(analytics||ads));
    assert.equal(commands(e,'consent')[0][1],'default');
    for(const command of commands(e,'consent')) if('ad_personalization' in command[2]) assert.equal(command[2].ad_personalization,'denied');
    const loadIndex=rows(e).findIndex(row=>row?.event==='gtm.js');
    if(loadIndex>=0){const before=rows(e).slice(0,loadIndex); assert(before.some(row=>row?.[0]==='consent'&&row[1]==='update'));assert(before.some(row=>row?.solvex_consent_statistics===analytics&&row.solvex_consent_marketing===ads));}
    choose(e,analytics,ads); e.rerun(); choose(e,analytics,ads); assert.equal(e.scripts.length,Number(analytics||ads));
    assert.equal(e.window.__analyticsConsentGranted,analytics);assert.equal(e.window.__adsConsentGranted,ads);
    assert.equal(e.window['ga-disable-'+GA],!analytics);
  }
});
test('50 saved versioned consent restores once; storage write denial is page-only, never a silent persistent grant',()=>{
  for(const [analytics,ads] of [[true,false],[false,true],[true,true]]) {
    const e=fixture({storage:{cookieconsent_prefs:JSON.stringify({analytics,ads,version:'basic50-v1'})}});assert.equal(e.scripts.length,1);assert.equal(e.get('.cc-window').style.display,'none');
  }
  const e=fixture({writeThrows:true});choose(e,true,true);assert.equal(e.scripts.length,1);assert.equal(e.store.size,0);assert.match(e.get('.cc-status').textContent,/questa pagina/);
});
test('50 old pre-consent success stays locally true but is not replayed when the loader eventually starts',()=>{
  const e=fixture(), payload=lead(),original=JSON.stringify(payload);
  rows(e).push(payload);assert.equal(rows(e).at(-1),payload);assert.equal(JSON.stringify(payload),original);assert.deepEqual(Object.keys(payload),['event','lead_id','form_name','lead_source']);
  const snapshot=rows(e).at(-2);assert.equal(snapshot.solvex_event_statistics,false);assert.equal(snapshot.solvex_event_marketing,false);
  choose(e,true,true); assert.equal(rows(e).some(row=>row===payload),false);assert.equal(JSON.stringify(payload),original);
  const processed=observer(e);choose(e,false,false);rows(e).push(lead());choose(e,true,true);
  assert.equal(processed.length,1);assert.equal(processed[0].statistics,false);assert.equal(processed[0].marketing,false);
});
test('50 category snapshots precede untouched lead objects through nested GTM-style push replacements',()=>{
  for(const [analytics,ads] of [[true,false],[false,true],[true,true]]) {
    const e=fixture();choose(e,analytics,ads);const first=observer(e),second=observer(e),payload=lead();
    rows(e).push(payload);for(const observed of [first,second]) {assert.equal(observed.length,1);assert.equal(observed[0].event,payload);assert.equal(observed[0].statistics,analytics);assert.equal(observed[0].marketing,ads);}
    assert.equal(rows(e).at(-1),payload);assert.equal(rows(e).at(-2).solvex_event_statistics,analytics);
  }
});
test('50 selective and total revocation stop future eligibility, clear own cookies and preserve form input/state',()=>{
  const e=fixture();const input=e.document.createElement('input');input.value='UNSENT_SYNTHETIC_DRAFT';e.document.body.append(input);
  e.store.set('__solvex_confirmed_lead_ids','synthetic-confirmed-state');choose(e,true,true);const processed=observer(e);
  e.cookieJar.set('_ga','synthetic');e.cookieJar.set('_gcl_aw','synthetic');choose(e,false,true);
  assert.equal(e.cookieJar.has('_ga'),false);assert.equal(e.cookieJar.has('_gcl_aw'),true);rows(e).push(lead());assert.equal(processed[0].statistics,false);assert.equal(processed[0].marketing,true);
  choose(e,false,false);rows(e).push(lead());assert.equal(processed[1].statistics,false);assert.equal(processed[1].marketing,false);assert.equal(e.cookieJar.has('_gcl_aw'),false);
  assert.equal(input.value,'UNSENT_SYNTHETIC_DRAFT');assert.equal(e.store.get('__solvex_confirmed_lead_ids'),'synthetic-confirmed-state');assert.equal(e.scripts.length,1);
  assert.doesNotMatch(source,/location\.reload|\.reset\(|localStorage\.clear|sessionStorage\.clear/);
});
test('50 late loader sees event-time snapshot and current denial rather than a later grant',()=>{
  const e=fixture();choose(e,true,false);const payload=lead();rows(e).push(payload);choose(e,false,true);
  const snapshot=rows(e)[rows(e).indexOf(payload)-1];assert.equal(snapshot.solvex_event_statistics,true);assert.equal(snapshot.solvex_event_marketing,false);
  assert.equal(snapshot.solvex_event_statistics && e.window.__analyticsConsentGranted,false);assert.equal(snapshot.solvex_event_marketing && e.window.__adsConsentGranted,false);
});
test('50 local guards revoke synchronously before the loaded container receives consent commands',()=>{
  const e=fixture();choose(e,true,true);const observed=[],previous=rows(e).push;
  rows(e).push=function(...items){for(const item of items)if(item?.[0]==='consent'&&item[1]==='update')observed.push([e.window.__analyticsConsentGranted,e.window.__adsConsentGranted]);return previous.apply(this,items);};
  choose(e,false,false);assert.equal(observed.length,2);assert(observed.every(state=>state[0]===false&&state[1]===false));
});
test('50 denied browser cookie access cannot break the banner, grant tags or reset local work',()=>{
  const e=fixture({cookieAccessThrows:true});assert.equal(e.scripts.length,0);choose(e,false,false);assert.equal(e.scripts.length,0);choose(e,true,false);choose(e,false,false);assert.equal(e.window.__analyticsConsentGranted,false);
});
test('50 legacy profiles keep the production-only guard and separate config/destination, without duplicate config',()=>{
  const local=fixture({mode:'legacy-direct'});choose(local,true,true);assert.equal(local.scripts.length,0);assert.equal(commands(local,'config').length,0);
  for(const [analytics,ads] of [[true,false],[false,true],[true,true]]) {
    const e=fixture({mode:'legacy-direct',hostname:'solvex-ai3d.com'});choose(e,analytics,ads);choose(e,analytics,ads);
    assert.equal(e.scripts.length,1);assert.equal(e.scripts[0].src,'https://www.googletagmanager.com/gtag/js?id='+(analytics?GA:ADS));
    assert.deepEqual(commands(e,'config').map(row=>row[1]),[...(analytics?[GA]:[]),...(ads?[ADS]:[])]);
  }
});
test('50 URLs are minimized before any loader; query/hash/credentials cannot enter direct Google config',()=>{
  const check=e=>{
    const safe=commands(e,'set');assert.equal(safe.length,1);
    assert.equal(safe[0][1].ads_data_redaction,true);assert.equal(safe[0][1].url_passthrough,false);
    assert.equal(safe[0][1].page_location,'https://solvex-ai3d.com/configuratori-ecommerce');
    assert.equal(safe[0][1].page_referrer,'https://referrer.invalid');
    for(const config of commands(e,'config')) {
      assert.equal(config[2].page_location,safe[0][1].page_location);
      assert.equal(config[2].page_referrer,safe[0][1].page_referrer);
    }
    assert.doesNotMatch(JSON.stringify([...safe,...commands(e,'config')]),/SYNTHETIC_PRIVATE|gclid|gbraid|wbraid|#|\?/);
    const firstLoad=rows(e).findIndex(row=>row?.event==='gtm.js'||row?.[0]==='js');
    assert(rows(e).indexOf(safe[0])<firstLoad);
  };
  for(const mode of ['legacy-direct','gtm-verified'])for(const [analytics,ads] of [[true,false],[false,true],[true,true]]) {
    const e=fixture({mode,hostname:'solvex-ai3d.com',query:'?email=SYNTHETIC_PRIVATE&gclid=SYNTHETIC_PRIVATE&gbraid=SYNTHETIC_PRIVATE&wbraid=SYNTHETIC_PRIVATE',hash:'#SYNTHETIC_PRIVATE',referrer:'https://SYNTHETIC_PRIVATE:secret@referrer.invalid/customer/SYNTHETIC_PRIVATE?email=SYNTHETIC_PRIVATE#SYNTHETIC_PRIVATE'});
    assert.equal(e.scripts.length,0);choose(e,analytics,ads);check(e);
  }
});
test('50 empty, invalid and non-HTTP referrers cannot leak through a fallback',()=>{
  for(const referrer of ['', 'invalid SYNTHETIC_PRIVATE', 'data:text/plain,SYNTHETIC_PRIVATE', 'file:///SYNTHETIC_PRIVATE', 'javascript:alert(1)']) {
    const e=fixture({mode:'legacy-direct',hostname:'solvex-ai3d.com',referrer});choose(e,true,false);
    assert.equal(commands(e,'set')[0][1].page_referrer,'');assert.equal(commands(e,'config')[0][2].page_referrer,'');
  }
});
test('50 template has a local synchronous controller, no eager Google URL or connection hint, and unchanged Google identifiers',()=>{
  assert.equal((partial.match(/src="\/js\/consent-basic50\.js"/g)||[]).length,1);assert.doesNotMatch(partial,/googletagmanager\.com|google-analytics\.com|rel=["'](?:preconnect|dns-prefetch)/);
  assert.match(partial,/data-measurement-mode="{{ activeMeasurementMode }}"/);assert.match(partial,/data-gtm-id="{{ measurement.gtmId }}"/);
  assert.doesNotMatch(partial,/<script[^>]+consent-basic50[^>]+(?:async|defer)/);
});
