import {PRICE_TABLE,initialSelection,assertSelection,priceSelection,createSelectionStore,transitionModel} from './demo-state.mjs';
(() => {
  const selectionDemo=createSelectionStore();
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  const dom = {
    heroTitle: $("#heroTitle"),
    stepperItems: $$(".stepper__item"),
    stepPanels: $$(".step-panel"),

    quickVehicle: $("#quickVehicle"),
    quickProduct: $("#quickProduct"),
    quickTotal: $("#quickTotal"),

    brandOptions: $("#brandOptions"),
    bikeModelOptions: $("#bikeModelOptions"),
    bikeYearOptions: $("#bikeYearOptions"),
    brandCurrent: $("#brandCurrent"),
    bikeModelCurrent: $("#bikeModelCurrent"),
    bikeYearCurrent: $("#bikeYearCurrent"),

    modelCards: $("#modelCards"),
    selectedModelName: $("#selectedModelName"),
    selectedModelNote: $("#selectedModelNote"),

    customNav: $("#customNav"),
    customStage: $("#customStage"),

    viewerCanvas: $("#seatCanvas"),
    viewerNotice: $("#viewerNotice"),

    summaryVehicle: $("#summaryVehicle"),
    summaryDesign: $("#summaryDesign"),
    summaryFinish: $("#summaryFinish"),
    summaryText: $("#summaryText"),
    summaryBasePrice: $("#summaryBasePrice"),
    summaryExtras: $("#summaryExtras"),
    summaryTotal: $("#summaryTotal")
  };

  const FALLBACK_BRANDS = [
    "Honda",
    "Yamaha",
    "KTM",
    "Kawasaki",
    "Suzuki",
    "TM",
    "Fantic",
    "GasGas",
    "Husqvarna",
    "Beta",
    "HM"
  ];

  const MODEL_IMAGE_MAP = {
    restyle: "Restyle.png",
    style: "Style.png",
    grip: "Grip.png",
    double: "Double.png",
    zip: "Zip.webp"
  };

  const state = {
    catalog: null,
    compatibility: null,
    demoProducts: null,

    engine: null,
    scene: null,
    camera: null,
    viewerReady: false,
    modelReady: false,
    modelRequest: 0,
    materialRequest: 0,
    materialInFlight: 0,
    loadedModelId: null,

    loaded: {
      rootNodes: [],
      meshesByName: new Map()
    },

    ui: {
      activeStep: 1,
      splitGroups: {},
      activeCustomizationGroupId: null
    },

    pricing: {
      basePrice: 0,
      extras: {
        brandLogo: 0,
        individualCustomization: 0
      },
      total: 0
    },

    selected: {
      brand: "",
      bikeModel: "",
      bikeYear: "",
      seatModelId: "restyle",
      motoTextColor: "rosso",
      wdColor: "rosso",
      slots: {}
    }
  };

  function formatCurrency(value) {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR"
    }).format(Number(value || 0));
  }

  function normalizeBrandKey(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/-/g, "");
  }

  async function loadJson(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Impossibile caricare ${url}`);
    return res.json();
  }

  function showViewerNotice(message) {
    if (!dom.viewerNotice) return;
    dom.viewerNotice.hidden = false;
    dom.viewerNotice.textContent = message;
  }

  function hideViewerNotice() {
    if (!dom.viewerNotice) return;
    dom.viewerNotice.hidden = true;
    dom.viewerNotice.textContent = "";
  }

  function getActiveModel() {
    return state.catalog?.models?.find((m) => m.id === state.selected.seatModelId) || null;
  }

  function getDemoProducts() {
    return state.demoProducts?.products || [];
  }

  function getDemoProductBySeatModel(seatModelId) {
    return getDemoProducts().find((item) => item.seatModelId === seatModelId) || null;
  }

  function getProductBasePrice() {
    return priceSelection(state.selected).baseCents / 100;
  }

  function getPaletteLabel(colorKey) {
    return state.catalog?.palettes?.labels?.[colorKey] || colorKey;
  }

  function getPaletteHex(colorKey) {
    return state.catalog?.palettes?.named?.[colorKey] || "#ffffff";
  }

  function getAllowedBrandPalette() {
    const rules = state.catalog?.motoTextRules || {};
    const allowed = new Set(rules.alwaysAllowed || []);
    const selectedBrandNorm = normalizeBrandKey(state.selected.brand);

    Object.entries(rules.byBrandAllowed || {}).forEach(([brand, colors]) => {
      if (normalizeBrandKey(brand) === selectedBrandNorm) {
        (colors || []).forEach((c) => allowed.add(c));
      }
    });

    return [...allowed];
  }

  function syncWdColorToMoto() {
    state.selected.wdColor = state.selected.motoTextColor;
  }

  function getSlotPaletteKey(slotKey) {
    const base = String(slotKey || "").replace(/Color$/, "");
    if (base === "seat") return "seatAllowed";
    if (base === "border") return "borderAllowed";
    if (base === "ribs" || base === "ribsMini") return "ribsAllowed";
    if (/^stripe\d+$/i.test(base) || /^bump\d+$/i.test(base) || base === "stripes") return "ribsAllowed";
    return "seatAllowed";
  }

  function getAllowedColorsForSlot(slotKey) {
    const paletteKey = getSlotPaletteKey(slotKey);
    return state.catalog?.palettes?.[paletteKey] || [];
  }

  function getSlotSelection(slotKey) {
    return state.selected.slots[slotKey] || { color: null, finish: null };
  }

  function setSlotSelection(slotKey, patch) {
    state.selected.slots[slotKey] = {
      ...getSlotSelection(slotKey),
      ...patch
    };
  }

  function getSlotLabel(slotKey) {
    const model = getActiveModel();
    return model?.ui?.slotLabels?.[slotKey] || slotKey;
  }

  function getCompatibleFinishesForSlot(slotKey, colorKey) {
    const model = getActiveModel();
    const allowedFinishes = model?.finishSlots?.[slotKey]?.allowedFinishes || [];

    return allowedFinishes.filter((finishKey) => {
      const finish = state.catalog?.finishCatalog?.[finishKey];
      const allowedColors = finish?.allowedColors || [];
      return allowedColors.includes(colorKey);
    });
  }

  function getFirstCompatibleFinish(slotKey, colorKey) {
    return getCompatibleFinishesForSlot(slotKey, colorKey)[0] || null;
  }

  function getFinishLabel(finishKey) {
    return state.catalog?.finishCatalog?.[finishKey]?.label || finishKey;
  }

  function ensureSlotDefaultsForModel(model) {
    if (!model) return;

    const slotKeys = Object.keys(model.meshSlots || {}).filter(
      (slotKey) => slotKey.endsWith("Color") && slotKey !== "wdColor"
    );

    slotKeys.forEach((slotKey) => {
      const current = getSlotSelection(slotKey);
      const allowedColors = getAllowedColorsForSlot(slotKey);
      const nextColor = allowedColors.includes(current.color)
        ? current.color
        : (allowedColors[0] || "nero");

      const compatibleFinishes = getCompatibleFinishesForSlot(slotKey, nextColor);
      const nextFinish = compatibleFinishes.includes(current.finish)
        ? current.finish
        : (compatibleFinishes[0] || model.finishSlots?.[slotKey]?.default || null);

      setSlotSelection(slotKey, { color: nextColor, finish: nextFinish });
    });

    const allowedMoto = getAllowedBrandPalette();
    if (!allowedMoto.includes(state.selected.motoTextColor)) {
      state.selected.motoTextColor = allowedMoto[0] || "rosso";
    }

    syncWdColorToMoto();
  }

  function applyRequestedInitialPreset() {
  const model = getActiveModel();
  if (!model) return;

  const slotKeys = Object.keys(model.meshSlots || {}).filter(
    (slotKey) => slotKey.endsWith("Color") && slotKey !== "wdColor"
  );

  const setIfPossible = (slotKey, wantedColor, wantedFinish) => {
    const allowedColors = getAllowedColorsForSlot(slotKey);
    const finalColor = allowedColors.includes(wantedColor)
      ? wantedColor
      : (allowedColors[0] || wantedColor);

    const compatibleFinishes = getCompatibleFinishesForSlot(slotKey, finalColor);
    const finalFinish = compatibleFinishes.includes(wantedFinish)
      ? wantedFinish
      : (compatibleFinishes[0] || null);

    setSlotSelection(slotKey, {
      color: finalColor,
      finish: finalFinish
    });
  };

  slotKeys.forEach((slotKey) => {
    const label = `${slotKey} ${getSlotLabel(slotKey)}`.toLowerCase();

    // 🎯 CENTRALE
    if (
      label.includes("centrale") ||
      label.includes("center") ||
      label.includes("seat")
    ) {
      setIfPossible(slotKey, "rosso", "similpelle");
      return;
    }

    // 🎯 LATERALE / BORDO
    if (
      label.includes("laterale") ||
      label.includes("side") ||
      label.includes("bordo") ||
      label.includes("border")
    ) {
      setIfPossible(slotKey, "nero", "grip");
      return;
    }

    // 🎯 RIGHE PICCOLE
    if (
      label.includes("piccole") ||
      label.includes("mini") ||
      label.includes("small")
    ) {
      setIfPossible(slotKey, "bianco", "similpelle");
      return;
    }

    // 🎯 RIGHE GRANDI / GENERICHE
    if (
      label.includes("righe") ||
      label.includes("ribs") ||
      label.includes("stripe") ||
      label.includes("strisce") ||
      label.includes("bump")
    ) {
      setIfPossible(slotKey, "nero", "similpelle");
      return;
    }

    // fallback sicurezza
    setIfPossible(slotKey, "rosso", "similpelle");
  });

  // 🎯 LOGHI SEMPRE BIANCHI
  state.selected.motoTextColor = "bianco";
  syncWdColorToMoto();
}

  function getBrandLogoMeshNames(model) {
    const selectedBrandNorm = normalizeBrandKey(state.selected.brand);
    const entries = Object.entries(model?.brandLogo?.byBrand || {});

    for (const [brandKey, meshes] of entries) {
      if (normalizeBrandKey(brandKey) === selectedBrandNorm) {
        return Array.isArray(meshes) ? meshes : [];
      }
    }

    return [];
  }

  function selectedBrandHas3DLogo(model) {
    if (!state.selected.brandLogoEnabled) return false;
    const meshNames = getBrandLogoMeshNames(model);
    if (!meshNames.length) return false;
    return meshNames.some((meshName) => state.loaded.meshesByName.has(meshName));
  }

  function resolveNormalMapDef(model, slotKey) {
    const selection = getSlotSelection(slotKey);

    const mapId = window.WDMaterialResolver.resolveNormalMapId({
      modelDef: model,
      modelsJson: state.catalog,
      slotKey,
      finishKey: selection.finish,
      colorKey: selection.color,
      hasBrandLogoPatch: selectedBrandHas3DLogo(model)
    });

    return mapId ? state.catalog?.normalMapLibrary?.[mapId] || null : null;
  }

  function resolveRoughnessMapDef(model, slotKey) {
    const selection = getSlotSelection(slotKey);

    const mapId = window.WDMaterialResolver.resolveRoughnessMapId({
      modelDef: model,
      modelsJson: state.catalog,
      slotKey,
      finishKey: selection.finish,
      colorKey: selection.color,
      hasBrandLogoPatch: selectedBrandHas3DLogo(model)
    });

    return mapId ? state.catalog?.roughnessMapLibrary?.[mapId] || null : null;
  }

  function applyBrandLogoVisibility(model) {
    const wanted = new Set(state.selected.brandLogoEnabled ? getBrandLogoMeshNames(model) : []);
    const textColorHex = getPaletteHex(state.selected.motoTextColor);

    for (const [meshName, mesh] of state.loaded.meshesByName.entries()) {
      if (!meshName.startsWith("logo_")) continue;
      if (meshName === "wd_logo") continue;

      const enabled = wanted.has(meshName);
      try { mesh.setEnabled(enabled); } catch {}

      if (enabled) {
        window.WDScene.applyColorToMeshes(state.loaded.meshesByName, [meshName], textColorHex);
      }
    }

    if (state.loaded.meshesByName.has("wd_logo")) {
      window.WDScene.applyColorToMeshes(
        state.loaded.meshesByName,
        ["wd_logo"],
        getPaletteHex(state.selected.wdColor)
      );
    }
  }

  function applySelectionToViewer() {
    if (!state.viewerReady || !state.scene) return;

    const model = getActiveModel();
    if (!model) return;

    Object.entries(model.meshSlots || {}).forEach(([slotKey, meshNames]) => {
      if (!Array.isArray(meshNames) || !meshNames.length) return;

      if (slotKey === "wdColor") {
        window.WDScene.applyColorToMeshes(
          state.loaded.meshesByName,
          meshNames,
          getPaletteHex(state.selected.wdColor)
        );
        return;
      }

      const selection = getSlotSelection(slotKey);

      window.WDScene.applyColorToMeshes(
        state.loaded.meshesByName,
        meshNames,
        getPaletteHex(selection.color)
      );

      window.WDScene.applyNormalMapToMeshes(
        state.scene,
        state.loaded.meshesByName,
        meshNames,
        resolveNormalMapDef(model, slotKey)
      );

      window.WDScene.applyRoughnessMapToMeshes(
        state.scene,
        state.loaded.meshesByName,
        meshNames,
        resolveRoughnessMapDef(model, slotKey)
      );
    });

    applyBrandLogoVisibility(model);
  }

  async function preloadMapsForActiveModel(model = getActiveModel(), selectionSnapshot = state.selected) {
    if (!model || !state.scene) return;

    const selected = {
      motoTextColor: selectionSnapshot.motoTextColor,
      wdColor: selectionSnapshot.wdColor
    };

    Object.keys(model.meshSlots || {}).forEach((slotKey) => {
      if (!slotKey.endsWith("Color") || slotKey === "wdColor") return;
      const selection = selectionSnapshot.slots[slotKey];
      const baseKey = slotKey.replace(/Color$/, "");
      selected[slotKey] = selection.color;
      selected[`${baseKey}Finish`] = selection.finish;
    });

    await window.WDStartupPreloader.preloadSelectionMaps(
      state.scene,
      state.catalog,
      model,
      selected,
      {
        includeNoPatchVariant: true,
        noBrandLogoPatch: !selectionSnapshot.brandLogoEnabled
      }
    );
  }

  function getInitialProductContext() {
    return getDemoProducts()[0] || null;
  }

  function getModelPreviewImage(seatModelId) {
    return `./assets/img-prodotto/${MODEL_IMAGE_MAP[seatModelId] || "Restyle.png"}`;
  }

  function buildSlotGroups(model) {
    const configured = Array.isArray(model?.ui?.controlGroups) ? model.ui.controlGroups : [];
    if (configured.length) return configured;

    const ordered = Array.isArray(model?.ui?.slotOrder)
      ? model.ui.slotOrder
      : Object.keys(model?.meshSlots || {});

    return ordered
      .filter((slotKey) => slotKey.endsWith("Color") && slotKey !== "wdColor")
      .map((slotKey) => ({
        id: slotKey,
        label: getSlotLabel(slotKey),
        slots: [slotKey],
        mode: "single"
      }));
  }

  function getCustomizationMenuGroups() {
    const model = getActiveModel();
    return [
      ...buildSlotGroups(model),
      {
        id: "__logos__",
        label: "Loghi",
        slots: [],
        mode: "logos"
      }
    ];
  }

  function getGroupRepresentativeSlot(group) {
    return Array.isArray(group?.slots) ? group.slots[0] : null;
  }

  function getGroupMode(group) {
    if (group.mode === "logos") return "logos";
    if (group.mode !== "individualizable") return group.mode || "single";

    const key = group.individualizationKey || group.id;
    return state.ui.splitGroups[key] ? "split" : "aggregate";
  }

  function setGroupSplitMode(group, enabled) {
    const key = group.individualizationKey || group.id;
    state.ui.splitGroups[key] = !!enabled;
  }

  function getCurrentCustomizationGroup() {
    const groups = getCustomizationMenuGroups();
    return groups.find((group) => group.id === state.ui.activeCustomizationGroupId) || groups[0] || null;
  }

  function resetCameraMotion(camera) {
  if (!camera) return;

  camera.inertialAlphaOffset = 0;
  camera.inertialBetaOffset = 0;
  camera.inertialRadiusOffset = 0;

  if ("inertialPanningX" in camera) camera.inertialPanningX = 0;
  if ("inertialPanningY" in camera) camera.inertialPanningY = 0;

  if ("angularSensibilityX" in camera && !isFinite(camera.angularSensibilityX)) {
    camera.angularSensibilityX = 4000;
  }
  if ("angularSensibilityY" in camera && !isFinite(camera.angularSensibilityY)) {
    camera.angularSensibilityY = 4000;
  }
}

 function syncViewerModeByStep(forceRefocus = false) {
  if (!state.viewerReady || !state.scene || !state.camera) return;

  const step = state.ui.activeStep;

  let area = "model";
  if (step === 2) area = "brand";
  if (step === 3) area = "materials";
  if (step === 4) area = "summary";

  // Changing panel never moves the camera selected by the user.

  // STEP 1 = MODELLO
  if (step === 1) {
    window.WDScene.setAutoRotateEnabled(state.scene, false);
    window.WDScene.setUserInteractionEnabled(state.camera, dom.viewerCanvas, true);
    return;
  }

  // STEP 2 = BRAND
  if (step === 2) {
    window.WDScene.setAutoRotateEnabled(state.scene, false);
    window.WDScene.setUserInteractionEnabled(state.camera, dom.viewerCanvas, true);
    return;
  }

  // STEP 3 = MATERIALI
  if (step === 3) {
    window.WDScene.setAutoRotateEnabled(state.scene, false);
    window.WDScene.setUserInteractionEnabled(state.camera, dom.viewerCanvas, true);
    return;
  }

  // STEP 4 = RIEPILOGO
  if (step === 4) {
    window.WDScene.setAutoRotateEnabled(state.scene, false);
    window.WDScene.setUserInteractionEnabled(state.camera, dom.viewerCanvas, true);
  }
}

  function renderSwatches(container, colors, selectedColor, onPick) {
    container.innerHTML = "";

    colors.forEach((colorKey) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `swatch${colorKey === selectedColor ? " is-active" : ""}`;
      btn.style.setProperty("--swatch-color", getPaletteHex(colorKey));
      btn.title = getPaletteLabel(colorKey);
      btn.setAttribute("aria-label", getPaletteLabel(colorKey));
      btn.addEventListener("click", () => onPick(colorKey));
      container.appendChild(btn);
    });
  }

  function renderFinishPills(container, finishKeys, selectedFinish, onPick) {
    container.innerHTML = "";

    Object.keys(state.catalog.finishCatalog).forEach((finishKey) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `finish-pill${finishKey === selectedFinish ? " is-active" : ""}`;
      btn.textContent = getFinishLabel(finishKey);
      btn.disabled = !finishKeys.includes(finishKey);
      btn.title = btn.disabled ? 'Non disponibile con il colore selezionato' : getFinishLabel(finishKey);
      btn.setAttribute('aria-pressed', String(finishKey === selectedFinish));
      btn.addEventListener("click", () => onPick(finishKey));
      container.appendChild(btn);
    });
    const explanation=document.createElement('p');
    explanation.className='demo-rule';
    explanation.textContent='Le finiture disattivate non sono compatibili con questo colore. Cambiando colore viene selezionata la prima finitura compatibile: controlla la scelta evidenziata.';
    container.appendChild(explanation);
  }

  function createControlCard(label, helperText = "") {
    const card = document.createElement("article");
    card.className = "control-card";

    const title = document.createElement("h4");
    title.textContent = label;

    const helper = document.createElement("p");
    helper.textContent = helperText;

    const palette = document.createElement("div");
    palette.className = "swatch-row";

    const finishes = document.createElement("div");
    finishes.className = "finish-row";

    card.append(title, helper, palette, finishes);
    return { card, palette, finishes };
  }

  function renderCustomizationNav() {
    const groups = getCustomizationMenuGroups();

    if (!groups.length) {
      dom.customNav.innerHTML = "";
      return;
    }

    if (!groups.find((g) => g.id === state.ui.activeCustomizationGroupId)) {
      state.ui.activeCustomizationGroupId = groups[0].id;
    }

    dom.customNav.innerHTML = "";

    groups.forEach((group) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `custom-nav__item${group.id === state.ui.activeCustomizationGroupId ? " is-active" : ""}`;
      btn.textContent = group.label || "Elemento";

      btn.addEventListener("click", () => {
  state.ui.activeCustomizationGroupId = group.id;
  renderCustomizationNav();
  renderCustomizationStage();
});

      dom.customNav.appendChild(btn);
    });
  }

  async function onCustomizationChanged() {
  await refreshViewerSafe();
  renderCustomizationNav();
  renderCustomizationStage();
  renderSummary();
}

  function renderCustomizationStage() {
    const model = getActiveModel();
    const group = getCurrentCustomizationGroup();

    dom.customStage.innerHTML = "";
    if (!model || !group) return;

    const shell = document.createElement("section");
    shell.className = "config-focus";

    const head = document.createElement("div");
    head.className = "config-focus__head";

    const left = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = group.label || "Elemento";
    const caption = document.createElement("p");

    caption.textContent =
      group.id === "__logos__"
        ? "Scegli il colore dei loghi."
        : group.mode === "individualizable"
          ? "Puoi usare una finitura coordinata o personalizzare ogni singolo elemento."
          : "Scegli colore e finitura della zona selezionata.";

    left.append(title, caption);
    head.appendChild(left);

    if (group.mode === "individualizable") {
      const toggle = document.createElement("label");
      toggle.className = "inline-toggle";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = getGroupMode(group) === "split";

      const text = document.createElement("span");
      text.textContent = "Personalizza singolarmente";

      input.addEventListener("change", () => {
  setGroupSplitMode(group, input.checked);
  renderCustomizationNav();
  renderCustomizationStage();
  renderSummary();
});

      toggle.append(input, text);
      head.appendChild(toggle);
    }

    shell.appendChild(head);

    if (group.id === "__logos__") {
      const toggle=document.createElement('label');toggle.className='inline-toggle';
      const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=state.selected.brandLogoEnabled;
      checkbox.addEventListener('change',async()=>{state.selected.brandLogoEnabled=checkbox.checked;await onCustomizationChanged();});
      toggle.append(checkbox,document.createTextNode('Mostra logo moto (+12 € demo)'));shell.appendChild(toggle);
      const block = createControlCard(
        "Loghi e brand",
        "Il colore scelto viene applicato a logo moto e marchio WD."
      );

      renderSwatches(
        block.palette,
        getAllowedBrandPalette(),
        state.selected.motoTextColor,
        async (colorKey) => {
          state.selected.motoTextColor = colorKey;
          syncWdColorToMoto();
          await onCustomizationChanged();
        }
      );

      block.finishes.remove();
      shell.appendChild(block.card);
      dom.customStage.appendChild(shell);
      return;
    }

    const mode = getGroupMode(group);

    if (mode === "single" || mode === "aggregate") {
      const repSlot = getGroupRepresentativeSlot(group);
      const selection = getSlotSelection(repSlot);

      const block = createControlCard(
        group.label,
        "Prima il colore, poi la texture/finitura compatibile."
      );

      renderSwatches(
        block.palette,
        getAllowedColorsForSlot(repSlot),
        selection.color,
        async (colorKey) => {
          group.slots.forEach((slotKey) => {
            setSlotSelection(slotKey, {
              color: colorKey,
              finish: getFirstCompatibleFinish(slotKey, colorKey)
            });
          });

          await onCustomizationChanged();
        }
      );

      renderFinishPills(
        block.finishes,
        getCompatibleFinishesForSlot(repSlot, selection.color),
        selection.finish,
        async (finishKey) => {
          group.slots.forEach((slotKey) => setSlotSelection(slotKey, { finish: finishKey }));
          await onCustomizationChanged();
        }
      );

      shell.appendChild(block.card);
    } else {
      group.slots.forEach((slotKey) => {
        const selection = getSlotSelection(slotKey);
        const block = createControlCard(
          getSlotLabel(slotKey),
          "Configurazione dedicata del singolo elemento."
        );

        renderSwatches(
          block.palette,
          getAllowedColorsForSlot(slotKey),
          selection.color,
          async (colorKey) => {
            setSlotSelection(slotKey, {
              color: colorKey,
              finish: getFirstCompatibleFinish(slotKey, colorKey)
            });
            await onCustomizationChanged();
          }
        );

        renderFinishPills(
          block.finishes,
          getCompatibleFinishesForSlot(slotKey, selection.color),
          selection.finish,
          async (finishKey) => {
            setSlotSelection(slotKey, { finish: finishKey });
            await onCustomizationChanged();
          }
        );

        shell.appendChild(block.card);
      });
    }

    dom.customStage.appendChild(shell);
  }

  function renderCustomization() {
    renderCustomizationNav();
    renderCustomizationStage();
  }

  function createChoiceChip(label, isActive, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `choice-chip${isActive ? " is-active" : ""}`;
    btn.textContent = label;
    btn.addEventListener("click", onClick);
    return btn;
  }

  function renderChoiceGrid(container, options, currentValue, onPick) {
    container.innerHTML = "";

    options.forEach((optionValue) => {
      const btn = createChoiceChip(
        optionValue,
        optionValue === currentValue,
        () => onPick(optionValue)
      );
      container.appendChild(btn);
    });
  }

  function renderVehicleSelectors() {
    const brands = Object.keys(state.compatibility?.index || {}).sort((a, b) => a.localeCompare(b));
    const brandList = brands.length ? brands : FALLBACK_BRANDS;

    if (!brandList.includes(state.selected.brand)) {
      state.selected.brand = brandList[0] || "";
    }

    dom.brandCurrent.textContent = state.selected.brand || "—";

    renderChoiceGrid(dom.brandOptions, brandList, state.selected.brand, async (brand) => {
      if (brand === state.selected.brand) return;

      state.selected.brand = brand;

      const models = Object.keys(state.compatibility?.index?.[brand] || {});
      state.selected.bikeModel = models[0] || "";
      state.selected.bikeYear =
        (state.compatibility?.index?.[brand]?.[state.selected.bikeModel] || [])[0] || "";

      const allowedMoto = getAllowedBrandPalette();
      if (!allowedMoto.includes(state.selected.motoTextColor)) {
        state.selected.motoTextColor = allowedMoto[0] || "rosso";
        syncWdColorToMoto();
      }

      renderVehicleSelectors();
      await refreshViewerSafe();
      renderSummary();
    });

    const models = Object.keys(state.compatibility?.index?.[state.selected.brand] || {}).sort((a, b) => a.localeCompare(b));
    if (!models.includes(state.selected.bikeModel)) {
      state.selected.bikeModel = models[0] || "";
    }

    dom.bikeModelCurrent.textContent = state.selected.bikeModel || "—";

    renderChoiceGrid(dom.bikeModelOptions, models, state.selected.bikeModel, (modelName) => {
      state.selected.bikeModel = modelName;
      const years = state.compatibility?.index?.[state.selected.brand]?.[modelName] || [];
      state.selected.bikeYear = years[0] || "";
      renderVehicleSelectors();
      renderSummary();
    });

    const years = state.compatibility?.index?.[state.selected.brand]?.[state.selected.bikeModel] || [];
    if (!years.includes(state.selected.bikeYear)) {
      state.selected.bikeYear = years[0] || "";
    }

    dom.bikeYearCurrent.textContent = state.selected.bikeYear || "—";

    renderChoiceGrid(dom.bikeYearOptions, years, state.selected.bikeYear, (year) => {
      state.selected.bikeYear = year;
      renderVehicleSelectors();
      renderSummary();
    });
  }

  function renderModelCards() {
    const models = state.catalog?.models || [];
    dom.modelCards.innerHTML = "";

    models
      .filter((model) => ["restyle", "style", "grip", "double", "zip"].includes(model.id))
      .forEach((model) => {
        const product = getDemoProductBySeatModel(model.id);
        // The only demo base price comes from the synthetic pricing contract.
        const activePrice = priceSelection(initialSelection(model.id)).baseCents / 100;
        const areaCount = Object.keys(model.meshSlots || {}).filter((key) => key !== "wdColor").length;

        const card = document.createElement("button");
        card.type = "button";
        card.className = `model-card${model.id === state.selected.seatModelId ? " is-active" : ""}`;

        card.innerHTML = `
          <div class="model-card__visual">
            <img src="${getModelPreviewImage(model.id)}" alt="${product?.displayName || model.name}">
          </div>
          <div class="model-card__body">
            <small>${product?.badge || "Model"}</small>
            <h3>${product?.displayName || model.name}</h3>
            <p>${product?.shortDescription || "Configurazione visuale premium."}</p>
            <div class="model-card__foot">
              <span>Base ${formatCurrency(activePrice)}</span>
              <span>${areaCount} aree</span>
            </div>
          </div>
        `;

        card.addEventListener("click", async () => {
          if (state.selected.seatModelId === model.id) return;

          const transition=transitionModel(state.selected,model,state.catalog);
          state.selected = transition.selected;
          state.ui.splitGroups = {};
          document.querySelector('#modelChangeStatus').textContent='Passaggio a '+model.name+': scelte compatibili mantenute; '+(transition.reset.length?'nuove zone inizializzate ('+transition.reset.map(key=>model.ui.slotLabels?.[key]||key).join(', ')+')':'nessuna nuova zona')+'. Le zone non previste sono escluse dal prezzo.';
          state.ui.activeCustomizationGroupId = getCustomizationMenuGroups()[0]?.id || null;

          renderModelCards();
          renderSelectedModelHeadline();
          renderCustomization();
          renderSummary();

          await loadActiveModelIntoViewer();
          syncViewerModeByStep();
        });

        dom.modelCards.appendChild(card);
      });
  }

  function renderSelectedModelHeadline() {
    const model = getActiveModel();
    const product = getDemoProductBySeatModel(state.selected.seatModelId);

    dom.selectedModelName.textContent = product?.displayName || model?.name || "Modello";
    dom.selectedModelNote.textContent =
      product?.longDescription || model?.notes || "Configurazione pronta per una presentazione premium.";

    if(dom.heroTitle)dom.heroTitle.textContent = 'Configura la tua sella';
  }

  function countDistinctGroupVariants(group) {
    const signatures = (group.slots || []).map((slotKey) => {
      const selection = getSlotSelection(slotKey);
      return `${selection.color}__${selection.finish}`;
    });

    return new Set(signatures).size;
  }

  function computePricing() {
    const model = getActiveModel();
    if (!model) return;
    assertSelection(state.selected,state.catalog,model);
    const example=priceSelection(state.selected);
    state.pricing = {
      basePrice: example.baseCents/100,
      extras: {
        brandLogo: example.logoCents/100,
        individualCustomization: example.materialCents/100
      },
      total: example.totalCents/100
    };
  }

  function buildSummaryLines() {
    const model = getActiveModel();
    const groups = buildSlotGroups(model);

    return groups.map((group) => {
      const repSlot = getGroupRepresentativeSlot(group);
      const repSelection = getSlotSelection(repSlot);
      const isMulti = countDistinctGroupVariants(group) > 1;

      if (isMulti) {
        return `<li><strong>${group.label}:</strong> personalizzazione dedicata</li>`;
      }

      return `<li><strong>${group.label}:</strong> ${getPaletteLabel(repSelection.color)} · ${getFinishLabel(repSelection.finish)}</li>`;
    }).join("");
  }

  function renderQuickStrip() {
    dom.quickVehicle.textContent = `${state.selected.brand || "—"} · ${state.selected.bikeYear || "—"}`;
    dom.quickProduct.textContent =
      getDemoProductBySeatModel(state.selected.seatModelId)?.displayName ||
      getActiveModel()?.name ||
      "—";
    dom.quickTotal.textContent = formatCurrency(state.pricing.total);
  }

  function renderSummary() {
    computePricing();

    const product = getDemoProductBySeatModel(state.selected.seatModelId);

    dom.summaryVehicle.innerHTML = `
      <li><strong>Marchio:</strong> ${state.selected.brand || "—"}</li>
      <li><strong>Modello:</strong> ${state.selected.bikeModel || "—"}</li>
      <li><strong>Anno:</strong> ${state.selected.bikeYear || "—"}</li>
    `;

    dom.summaryDesign.innerHTML = `
      <li><strong>Scelta:</strong> ${product?.displayName || getActiveModel()?.name || "—"}</li>
    `;

    dom.summaryFinish.innerHTML = buildSummaryLines();

    dom.summaryText.innerHTML = `
      <li><strong>Colore loghi:</strong> ${getPaletteLabel(state.selected.motoTextColor)}</li>
      <li><strong>Logo moto:</strong> ${state.selected.brandLogoEnabled ? 'Presente' : 'Assente'}</li>
    `;

    dom.summaryBasePrice.textContent = formatCurrency(state.pricing.basePrice);
    dom.summaryExtras.textContent = formatCurrency(
      state.pricing.extras.brandLogo + state.pricing.extras.individualCustomization
    );
    dom.summaryTotal.textContent = formatCurrency(state.pricing.total);
    const detail=priceSelection(state.selected);
    document.querySelector('#demoPriceDetails').textContent='Base '+formatCurrency(detail.baseCents/100)+'; logo '+formatCurrency(detail.logoCents/100)+'; '+detail.materials.map(x=>getSlotLabel(x.key)+' '+formatCurrency(x.cents/100)).join('; ')+'.';

    renderQuickStrip();
  }

  function updateStepUI() {
    dom.stepPanels.forEach((panel) => {
      const step = Number(panel.dataset.stepPanel);
      panel.hidden = step !== state.ui.activeStep;
    });

    dom.stepperItems.forEach((item) => {
      item.classList.toggle("is-active", Number(item.dataset.step) === state.ui.activeStep);
    });
  }

  function goToStep(step) {
  state.ui.activeStep = Math.max(1, Math.min(4, Number(step) || 1));
  updateStepUI();
  syncViewerModeByStep(false);
}

  async function refreshViewerSafe() {
    ensureSlotDefaultsForModel(getActiveModel());
    if (!state.viewerReady || state.loadedModelId!==state.selected.seatModelId) return;
    const request=++state.materialRequest, model=getActiveModel(), snapshot=structuredClone(state.selected);
    state.materialInFlight++;
    state.modelReady=false;
    document.querySelector('#addToCartBtn').disabled=true;
    document.querySelector('#demoStatus').textContent='Applicazione materiali selezionati…';
    try {
      await preloadMapsForActiveModel(model,snapshot);
      if(request!==state.materialRequest||model.id!==state.loadedModelId||model.id!==state.selected.seatModelId)return;
      applySelectionToViewer();
      state.modelReady=true;
      document.querySelector('#addToCartBtn').disabled=false;
      window.WD46Display?.ready();
      document.querySelector('#demoStatus').textContent='Materiali applicati. Trascina, usa la rotella o i comandi del viewer in tutti i passi.';
      hideViewerNotice();
    } catch (error) {
      if(request!==state.materialRequest)return;
      console.error("ERRORE refreshViewerSafe:", error);
      document.querySelector('#demoRetry').hidden=false;
      document.querySelector('#demoStatus').textContent='Materiale non caricato: la selezione non può essere aggiunta. Riprova.';
      window.WD46Display?.error();
      showViewerNotice(
        'Texture non disponibile. La selezione non è stata aggiunta: usa Riprova caricamento.'
      );
    } finally {
      state.materialInFlight--;
      // Never dispose a ready texture while another in-flight request can still apply it.
      if(state.materialInFlight===0&&state.modelReady)window.WDScene.releaseUnusedTextures(state.loaded.meshesByName);
    }
  }

  async function bootViewer() {
    try {
      state.engine = window.WDScene.createEngine(dom.viewerCanvas);

      const { scene, camera } = window.WDScene.createScene(state.engine, dom.viewerCanvas, {
        environment: {
          environmentUrl: "./assets/env/environmentSpecular.env",
          envIntensity: 0.95,
          exposure: 1,
          contrast: 1,
          clearColor: [0.97, 0.97, 0.98, 1]
        },
        lights: {
          keyIntensity: 1.45,
          fillIntensity: 0.50,
          rimIntensity: 0.40
        }
      });

      state.scene = scene;
      state.camera = camera;
      state.viewerReady = true;
      hideViewerNotice();
    } catch (error) {
      console.error("ERRORE bootViewer:", error);
      state.viewerReady = false;
      showViewerNotice('Il viewer 3D non è disponibile. Usa Riprova caricamento.');
      document.querySelector('#demoStatus').textContent='Viewer 3D non inizializzato. Puoi riprovare; nessuna selezione è stata inviata.';
      document.querySelector('#demoRetry').hidden=false;
      window.WD46Display?.error();
      throw error;
    }
  }

  async function loadActiveModelIntoViewer() {
  if (!state.viewerReady) return;

  const model = getActiveModel();
  if (!model) return;
  const request=++state.modelRequest;
  ++state.materialRequest;
  state.modelReady=false;
  state.loadedModelId=null;
  document.querySelector('#addToCartBtn').disabled=true;
  document.querySelector('#demoRetry').hidden=true;
  document.querySelector('#demoStatus').textContent='Caricamento '+model.name+' 3D e materiali selezionati…';
  hideViewerNotice();

  try {
    const loaded=await window.WDScene.loadGLB(
      state.scene,
      state.camera,
      state.loaded,
      model.glb,
      {
        enableSSAO: true,
        enableContactShadow: true,
        isCurrent:()=>request===state.modelRequest&&state.selected.seatModelId===model.id
      }
    );
    if(!loaded||request!==state.modelRequest)return;
    for(const names of Object.values(model.meshSlots))for(const name of names)if(!state.loaded.meshesByName.has(name))throw Error('Mesh richiesta assente: '+name);
    state.loadedModelId=model.id;
    await refreshViewerSafe();
    if(request!==state.modelRequest)return;

    // Model import frames once. Texture completion must not snap a camera already moved.
    syncViewerModeByStep(false);
    if(state.modelReady)hideViewerNotice();
  } catch (error) {
    if(request!==state.modelRequest)return;
    console.error("ERRORE loadActiveModelIntoViewer:", error);
    state.modelReady=false;
    document.querySelector('#addToCartBtn').disabled=true;
    document.querySelector('#demoRetry').hidden=false;
    document.querySelector('#demoStatus').textContent='Modello non caricato. Riprova oppure scegli l’altro modello.';
    window.WD46Display?.error();
    showViewerNotice('Il modello 3D non è stato caricato. Riprova oppure scegli l’altro modello.');
  }
}

  function bindEvents() {
    document.querySelector('#demoPriceTable').textContent='Basi demo: '+Object.entries(PRICE_TABLE.models).map(([id,cents])=>id.toUpperCase()+' '+formatCurrency(cents/100)).join(', ')+'; logo '+formatCurrency(PRICE_TABLE.brandLogo/100)+'; maggiorazione per ciascuna zona: '+Object.entries(PRICE_TABLE.finishes).map(([finish,cents])=>getFinishLabel(finish)+' '+formatCurrency(cents/100)).join(', ')+'. Veicoli fittizi, nessuna promessa di compatibilità reale.';
    for(const button of document.querySelectorAll('[data-camera]'))button.addEventListener('click',()=>window.WDScene.moveCamera(state.scene,state.camera,button.dataset.camera));
    dom.stepperItems.forEach((btn) => {
      btn.addEventListener("click", () => goToStep(btn.dataset.step));
    });
    document.querySelector('#addToCartBtn').addEventListener('click',()=>{
      if(!state.modelReady)return;
      const added=selectionDemo.add(state.selected,state.catalog,getActiveModel());
      renderDemoSelection();
      document.querySelector('#demoStatus').textContent=added.id+' aggiunto solo alla selezione demo. Nessun ordine inviato.';
    });
    document.querySelector('#demoReset').addEventListener('click',async()=>{
      state.selected=initialSelection();state.ui.splitGroups={};state.ui.activeCustomizationGroupId='seatColor';selectionDemo.reset();
      renderVehicleSelectors();renderModelCards();renderSelectedModelHeadline();renderCustomization();renderSummary();renderDemoSelection();goToStep(1);
      document.querySelector('#modelChangeStatus').textContent='Preset iniziale RESTYLE ripristinato. Selezione demo svuotata.';
      await loadActiveModelIntoViewer();
    });
  }

  function renderDemoSelection(){
    const list=document.querySelector('#demoSelection');list.replaceChildren();
    for(const entry of selectionDemo.list()){
      const entryModel=state.catalog.models.find(m=>m.id===entry.selected.seatModelId);
      const item=document.createElement('li');item.textContent=entry.id+' — '+entry.selected.seatModelId.toUpperCase()+', '+entry.selected.brand+' / '+entry.selected.bikeModel+' / '+entry.selected.bikeYear+', '+Object.entries(entry.selected.slots).map(([key,value])=>(entryModel.ui.slotLabels?.[key]||key)+': '+getPaletteLabel(value.color)+' / '+getFinishLabel(value.finish)).join('; ')+'; logo moto '+(entry.selected.brandLogoEnabled?'presente':'assente')+'; colore loghi '+getPaletteLabel(entry.selected.motoTextColor)+' — '+formatCurrency(entry.price.totalCents/100);list.append(item);
    }
    if(!list.children.length){const item=document.createElement('li');item.textContent='Nessun articolo nella selezione demo.';list.append(item);}
  }

  function initStateFromData() {
    const initialProduct = getInitialProductContext();

    if (initialProduct?.seatModelId) {
      state.selected.seatModelId = initialProduct.seatModelId;
    }

    const brands = Object.keys(state.compatibility?.index || {});
    state.selected.brand = brands[0] || FALLBACK_BRANDS[0];
    state.selected.bikeModel =
      Object.keys(state.compatibility?.index?.[state.selected.brand] || {})[0] || "";
    state.selected.bikeYear =
      (state.compatibility?.index?.[state.selected.brand]?.[state.selected.bikeModel] || [])[0] || "";

    ensureSlotDefaultsForModel(getActiveModel());
    state.selected=initialSelection();
    state.ui.activeCustomizationGroupId = getCustomizationMenuGroups()[0]?.id || null;
  }

  async function init() {
    try {
      if (!window.WDScene || !window.WDModelCatalogLoader || !window.WDMaterialResolver || !window.WDStartupPreloader) {
        throw new Error("Core JS non caricati correttamente");
      }

      const [compatibility, demoProducts, catalog] = await Promise.all([
        loadJson("./data/compatibility.json"),
        loadJson("./data/demo-products.json"),
        window.WDModelCatalogLoader.loadModelCatalog("./models.base.json")
      ]);

      state.compatibility = compatibility;
      state.demoProducts = demoProducts;
      state.catalog = catalog;

      initStateFromData();
      bindEvents();
      renderVehicleSelectors();
      renderModelCards();
      renderSelectedModelHeadline();
      renderCustomization();
      renderSummary();
      renderDemoSelection();
      goToStep(1);

      await bootViewer();
      await loadActiveModelIntoViewer();
      syncViewerModeByStep();
    } catch (error) {
      console.error("ERRORE init:", error);
      showViewerNotice('La demo non è partita correttamente. Usa Riprova caricamento.');
      document.querySelector('#demoRetry').hidden=false;
      window.WD46Display?.error();
      if (dom.heroTitle) dom.heroTitle.textContent = "La demo non è partita correttamente.";
    }
  }

  document.querySelector('#demoRetry').addEventListener('click',async()=>{
    if(!state.catalog){window.location.reload();return;}
    try{
      if(!state.viewerReady){state.engine?.dispose();await bootViewer();}
      await loadActiveModelIntoViewer();
    }catch{/* The visible boot error remains; never report a successful load. */}
  });
  document.addEventListener("DOMContentLoaded", init);
})();
