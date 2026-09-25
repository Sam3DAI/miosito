// Synthetic example prices only. Every amount stays in integer cents until presentation.
export const PRICE_TABLE=Object.freeze({models:Object.freeze({restyle:18000,zip:22000}),brandLogo:1200,finishes:Object.freeze({similpelle:0,grip:1200,carbon:1800,prisma:2200,replica:1600,sphere:2000})});
export const MODEL_ZONES=Object.freeze({restyle:Object.freeze(['seatColor','borderColor','ribsColor','ribsMiniColor']),zip:Object.freeze(['seatColor','borderColor','stripesColor'])});
export function zonesFor(id){if(!Object.hasOwn(MODEL_ZONES,id))throw Error('Modello demo sconosciuto: '+id);return MODEL_ZONES[id];}
export function initialSelection(modelId='restyle'){
  const slots={seatColor:{color:'rosso',finish:'similpelle'},borderColor:{color:'nero',finish:'grip'}};
  if(modelId==='restyle'){slots.ribsColor={color:'nero',finish:'similpelle'};slots.ribsMiniColor={color:'bianco',finish:'similpelle'};}
  else if(modelId==='zip')slots.stripesColor={color:'nero',finish:'similpelle'};
  else throw Error('Modello demo sconosciuto: '+modelId);
  return {brand:'Honda',bikeModel:'Veicolo dimostrativo A',bikeYear:'2025',seatModelId:modelId,motoTextColor:'bianco',wdColor:'bianco',brandLogoEnabled:true,slots};
}
export function assertSelection(selected,catalog,model){
  if(!model||selected.seatModelId!==model.id)throw Error('Modello selezione non coerente');
  const zones=zonesFor(model.id);
  if(Object.keys(selected.slots||{}).sort().join()!==[...zones].sort().join())throw Error('Zone non pertinenti al modello');
  for(const key of zones){const slot=selected.slots[key];const palette=key==='borderColor'?'borderAllowed':key==='seatColor'?'seatAllowed':'ribsAllowed';if(!slot||!catalog.palettes[palette].includes(slot.color)||!model.finishSlots[key].allowedFinishes.includes(slot.finish)||!catalog.finishCatalog[slot.finish]?.allowedColors.includes(slot.color))throw Error('Combinazione colore/finitura non disponibile: '+key);}
  const allowed=[...catalog.motoTextRules.alwaysAllowed,...(catalog.motoTextRules.byBrandAllowed[selected.brand]||[])];
  if(typeof selected.brandLogoEnabled!=='boolean'||!Object.hasOwn(model.brandLogo.byBrand,selected.brand)||!allowed.includes(selected.motoTextColor)||selected.wdColor!==selected.motoTextColor)throw Error('Colore logo o marchio non compatibile');
}
export function transitionModel(selected,model,catalog){
  const next=initialSelection(model.id),retained=[],reset=[];
  for(const key of ['brand','bikeModel','bikeYear','motoTextColor','wdColor','brandLogoEnabled'])next[key]=selected[key];
  for(const key of zonesFor(model.id)){
    const old=selected.slots[key],allowed=model.finishSlots[key].allowedFinishes;
    if(old&&allowed.includes(old.finish)&&catalog.finishCatalog[old.finish]?.allowedColors.includes(old.color)){next.slots[key]=structuredClone(old);retained.push(key);}
    else reset.push(key);
  }
  const removed=Object.keys(selected.slots).filter(key=>!zonesFor(model.id).includes(key));
  assertSelection(next,catalog,model);
  return {selected:next,retained,reset,removed};
}
export function priceSelection(selected){
  const zones=zonesFor(selected.seatModelId);
  if(Object.keys(selected.slots||{}).sort().join()!==[...zones].sort().join())throw Error('Prezzo: zone estranee o mancanti');
  if(typeof selected.brandLogoEnabled!=='boolean')throw Error('Prezzo: opzione logo non valida');
  const materials=zones.map(key=>{const finish=selected.slots[key]?.finish;if(!Object.hasOwn(PRICE_TABLE.finishes,finish))throw Error('Finitura prezzo non valida: '+finish);return {key,finish,cents:PRICE_TABLE.finishes[finish]};});
  const base=PRICE_TABLE.models[selected.seatModelId],logo=selected.brandLogoEnabled?PRICE_TABLE.brandLogo:0,material=materials.reduce((sum,x)=>sum+x.cents,0),total=base+logo+material;
  if(!Number.isSafeInteger(total)||total<0)throw Error('Prezzo non valido');
  return {baseCents:base,logoCents:logo,materialCents:material,totalCents:total,materials};
}
export function createSelectionStore(){let entries=[],sequence=0;return {add(selected,catalog,model){assertSelection(selected,catalog,model);const entry={id:`DEMO-WD-${++sequence}`,selected:structuredClone(selected),price:priceSelection(selected)};entries.push(entry);return structuredClone(entry);},list(){return structuredClone(entries);},reset(){entries=[];sequence=0;}};}
