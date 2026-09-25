// frontend/js/modelCatalogLoader.js
(function () {
  async function fetchJson(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Impossibile caricare JSON: ${url}`);
    }
    return res.json();
  }

  function mergeMapLibrary(target, source, kind, modelId) {
    Object.entries(source || {}).forEach(([mapId, def]) => {
      if (target[mapId]) {
        throw new Error(
          `Duplicato ${kind} map id "${mapId}" nel modello "${modelId}".`
        );
      }
      target[mapId] = def;
    });
  }

  function normalizeModelManifest(manifest, fallbackId) {
  if (!manifest || typeof manifest !== "object") {
    throw new Error(`Manifest modello non valido: ${fallbackId || "(senza id)"}`);
  }

  const id = manifest.id || fallbackId;
  if (!id) {
    throw new Error("Manifest modello senza id");
  }

  return {
    id,
    name: manifest.name || id.toUpperCase(),
    notes: manifest.notes || "",
    glb: manifest.glb || "",
    pricing: manifest.pricing || {
      basePriceSource: "ecommerce",
      referenceBasePrice: 0,
      brandLogoExtra: 0,
      individualCustomization: {
        enabled: false,
        type: null,
        amount: 0,
        label: null
      }
    },
    meshSlots: manifest.meshSlots || {},
    finishSlots: manifest.finishSlots || {},
    brandLogo: manifest.brandLogo || {
      enabled: false,
      byBrand: {}
    },

    // QUESTA ERA LA PARTE MANCANTE
    ui: manifest.ui || {},

    materialProfiles: manifest.materialProfiles || {
      default: {},
      bySlot: {}
    },
    normalMapLibrary: manifest.normalMapLibrary || {},
    roughnessMapLibrary: manifest.roughnessMapLibrary || {}
  };
}

  async function loadModelCatalog(baseUrl) {
    const base = await fetchJson(baseUrl);

    const modelManifestEntries = Array.isArray(base.modelManifests)
      ? base.modelManifests
      : [];

    const mergedNormalMapLibrary = {
      ...(base.normalMapLibrary || {})
    };

    const mergedRoughnessMapLibrary = {
      ...(base.roughnessMapLibrary || {})
    };

    const models = [];

    for (const entry of modelManifestEntries) {
      if (!entry?.file) {
        throw new Error(`Manifest senza file per modello ${entry?.id || "(sconosciuto)"}`);
      }

      const manifest = await fetchJson(entry.file);
      const normalized = normalizeModelManifest(manifest, entry.id);

      mergeMapLibrary(
        mergedNormalMapLibrary,
        normalized.normalMapLibrary,
        "normal",
        normalized.id
      );

      mergeMapLibrary(
        mergedRoughnessMapLibrary,
        normalized.roughnessMapLibrary,
        "roughness",
        normalized.id
      );

      models.push(normalized);
    }

    return {
      palettes: base.palettes || {},
      finishCatalog: base.finishCatalog || {},
      motoTextRules: base.motoTextRules || {},
      logoRules: base.logoRules || {},
      normalMapLibrary: mergedNormalMapLibrary,
      roughnessMapLibrary: mergedRoughnessMapLibrary,
      models
    };
  }

  window.WDModelCatalogLoader = {
    loadModelCatalog
  };
})();