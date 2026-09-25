// frontend/js/startupPreloader.js
(function () {
  function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj || {}, key);
  }

  function pickMapIdByColor(mapByColor, colorKey) {
    if (!mapByColor) return null;
    if (hasOwn(mapByColor, colorKey)) return mapByColor[colorKey];
    if (hasOwn(mapByColor, "*")) return mapByColor["*"];
    return null;
  }

  function collectMapIdsForCurrentSelection(modelsJson, modelDef, selected, options = {}) {
    const includeNoPatchVariant = options.includeNoPatchVariant !== false;
    const noBrandLogoPatch = options.noBrandLogoPatch === true;
    const patchSlotKey = modelDef?.ui?.patchSlotKey || "borderColor";

    const normalIds = new Set();
    const roughnessIds = new Set();

    const meshSlots = modelDef?.meshSlots || {};
    const finishSlots = modelDef?.finishSlots || {};
    const profiles = modelDef?.materialProfiles || {};
    const modelNormalLib = modelsJson?.normalMapLibrary || {};
    const modelRoughLib = modelsJson?.roughnessMapLibrary || {};

    Object.keys(meshSlots).forEach((slotKey) => {
      if (!slotKey.endsWith("Color")) return;
      if (slotKey === "wdColor") return;

      const baseKey = String(slotKey).replace(/Color$/, "");
      const colorStateKey = slotKey;
      const finishStateKey = `${baseKey}Finish`;

      const finishKey =
        selected?.[finishStateKey] ||
        finishSlots?.[slotKey]?.default ||
        "grip";

      const colorKey = selected?.[colorStateKey] || "nero";

      const slotProfile =
        profiles?.bySlot?.[slotKey]?.[finishKey] ||
        profiles?.default?.[finishKey] ||
        null;

      const legacyFinish = modelsJson?.finishCatalog?.[finishKey] || null;

      const normalMapByColor =
        slotProfile?.normalMapByColor ||
        legacyFinish?.normalMapByColor ||
        null;

      const roughnessMapByColor =
        slotProfile?.roughnessMapByColor ||
        legacyFinish?.roughnessMapByColor ||
        null;

      const normalId = pickMapIdByColor(normalMapByColor, colorKey);
      const roughnessId = pickMapIdByColor(roughnessMapByColor, colorKey);

      if(!normalId||!modelNormalLib[normalId])throw Error('Mappa normale non definita: '+slotKey+'/'+finishKey);
      const selectedNormal=includeNoPatchVariant&&slotKey===patchSlotKey&&noBrandLogoPatch?normalId+'_no_patch':normalId;
      if(!modelNormalLib[selectedNormal])throw Error('Variante normale non definita: '+selectedNormal);
      normalIds.add(selectedNormal);

      if(!roughnessId||!modelRoughLib[roughnessId])throw Error('Mappa roughness non definita: '+slotKey+'/'+finishKey);
      const selectedRough=includeNoPatchVariant&&slotKey===patchSlotKey&&noBrandLogoPatch?roughnessId+'_no_patch':roughnessId;
      if(!modelRoughLib[selectedRough])throw Error('Variante roughness non definita: '+selectedRough);
      roughnessIds.add(selectedRough);
    });

    return {
      normalIds: [...normalIds],
      roughnessIds: [...roughnessIds]
    };
  }

  function buildLibrarySubset(fullLibrary, ids) {
    const out = {};
    (ids || []).forEach((id) => {
      if (fullLibrary?.[id]) out[id] = fullLibrary[id];
    });
    return out;
  }

  async function preloadSelectionMaps(scene, modelsJson, modelDef, selected, options = {}) {
    const ids = collectMapIdsForCurrentSelection(
      modelsJson,
      modelDef,
      selected,
      options
    );

    const normalSubset = buildLibrarySubset(modelsJson?.normalMapLibrary, ids.normalIds);
    const roughSubset = buildLibrarySubset(modelsJson?.roughnessMapLibrary, ids.roughnessIds);

    await Promise.all([
      window.WDScene.preloadMapLibrary(scene, normalSubset),
      window.WDScene.preloadMapLibrary(scene, roughSubset)
    ]);
  }

  window.WDStartupPreloader = {
    preloadSelectionMaps,
    collectMapIdsForCurrentSelection
  };
})();
