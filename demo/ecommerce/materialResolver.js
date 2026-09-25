// frontend/js/materialResolver.js
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

  function getLegacyFinishEntry(modelsJson, finishKey) {
    return modelsJson?.finishCatalog?.[finishKey] || null;
  }

  function getProfileFromModel(modelDef, slotKey, finishKey) {
    const profiles = modelDef?.materialProfiles || {};

    const slotSpecific =
      profiles?.bySlot?.[slotKey]?.[finishKey] || null;

    if (slotSpecific) return slotSpecific;

    const defaultProfile =
      profiles?.default?.[finishKey] || null;

    return defaultProfile;
  }

  function getProfileWithFallback({ modelDef, modelsJson, slotKey, finishKey }) {
    const modelProfile = getProfileFromModel(modelDef, slotKey, finishKey);
    if (modelProfile) return modelProfile;

    const legacy = getLegacyFinishEntry(modelsJson, finishKey);
    if (!legacy) return null;

    return {
      normalMapByColor: legacy.normalMapByColor || {},
      roughnessMapByColor: legacy.roughnessMapByColor || {}
    };
  }

  function resolveMapId({
    modelDef,
    modelsJson,
    slotKey,
    finishKey,
    colorKey,
    kind,
    hasBrandLogoPatch
  }) {
    const profile = getProfileWithFallback({
      modelDef,
      modelsJson,
      slotKey,
      finishKey
    });

    if (!profile) return null;

    const library =
      kind === "normal"
        ? modelsJson?.normalMapLibrary
        : modelsJson?.roughnessMapLibrary;

    const mapField =
      kind === "normal"
        ? "normalMapByColor"
        : "roughnessMapByColor";

    let mapId = pickMapIdByColor(profile[mapField], colorKey);
    if (!mapId) return null;

    // Caso patch laterale: se il brand logo non c'è,
    // proviamo automaticamente la variante _no_patch
    if (slotKey === "borderColor" && !hasBrandLogoPatch) {
      const noPatchId = `${mapId}_no_patch`;
      if (library?.[noPatchId]) {
        return noPatchId;
      }
    }

    return mapId;
  }

  function resolveNormalMapId(args) {
    return resolveMapId({
      ...args,
      kind: "normal"
    });
  }

  function resolveRoughnessMapId(args) {
    return resolveMapId({
      ...args,
      kind: "roughness"
    });
  }

  window.WDMaterialResolver = {
    resolveNormalMapId,
    resolveRoughnessMapId
  };
})();