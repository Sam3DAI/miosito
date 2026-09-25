// Display-only same-origin bridge. No access to parent state, storage, forms or telemetry.
(function(){
  const params=new URLSearchParams(location.search),embedded=params.get('embed')==='1';
  let visible=true;
  function setTheme(theme){document.documentElement.dataset.theme=theme;}
  const requested=params.get('theme');setTheme(requested==='dark'?'dark':'light');
  document.documentElement.dataset.embedded=String(embedded);
  function notify(type){if(embedded&&window.parent!==window)window.parent.postMessage({type},location.origin);}
  window.addEventListener('message',event=>{
    if(!embedded||event.source!==window.parent||event.origin!==location.origin)return;
    const value=event.data;
    if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join()!=='theme,type,visible')return;
    if(value.type!=='solvex-wd46-control'||!['light','dark'].includes(value.theme)||typeof value.visible!=='boolean')return;
    visible=value.visible;setTheme(value.theme);
  });
  window.WD46Display=Object.freeze({isVisible:()=>visible,ready:()=>notify('solvex-wd46-ready'),error:()=>notify('solvex-wd46-error')});
})();
