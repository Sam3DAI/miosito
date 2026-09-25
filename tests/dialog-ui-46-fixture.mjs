import fs from "node:fs";
import vm from "node:vm";
import { root46 } from "./site-ui-46.mjs";
import path from "node:path";

// Logic-only fixture. It does not attest native focus/inert/layout/browser proof.
export function dialogFixture46(options = {}) {
  const document = { activeElement: null, body: { style: { overflow: "auto" } } };
  function element(extra = {}) {
    const listeners = new Map();
    return Object.assign({ listeners, attrs: {}, getClientRects: () => [{}], getBoundingClientRect: () => ({ top: 30, bottom: 62 }),
      addEventListener(name, callback) { if (!listeners.has(name)) listeners.set(name, []); listeners.get(name).push(callback); },
      emit(name, values = {}) { const event = { prevented: false, preventDefault() { this.prevented = true; }, ...values }; for (const fn of listeners.get(name) || []) fn(event); return event; },
      setAttribute(name, value) { this.attrs[name] = value; }, getAttribute(name) { return this.attrs[name]; },
      focus() { document.activeElement = this; }
    }, extra);
  }
  const track = { scrollLeft: 170 };
  const galleryTrigger = element({ closest: () => track });
  const galleryFallback = {};
  const galleryTitle = element({ textContent: "Progetto verificato" });
  const close = element(), previous = element(), next = element(), large = element(), status = element();
  const views = Array.from({ length: options.views || 6 }, (_, index) => {
    const stem = "/assets/images/projects-46/biliarditaly-0" + (index + 1);
    const image = { alt: "Vista " + (index + 1), dataset: { gallerySrc: stem + "-1440.webp", gallerySrcset: [768, 1440, 2560].map(w => stem + "-" + w + ".webp " + w + "w").join(", ") }, hasAttribute(key) { return Object.hasOwn(this, key); } };
    return { hidden: index > 0, dataset: { galleryLarge: stem + "-2560.webp" }, querySelector: () => image, image };
  });
  if (options.invalidImage) views[0].image.dataset.gallerySrc = "https://not-authorized.invalid/private.png";
  if (options.missingTexture) views[0].image.dataset.gallerySrcset = "";
  const gallery = element({ dataset: { projectDialog: "fixture" }, open: false,
    getAttribute: () => "gallery-title", querySelectorAll: selector => selector === "[data-gallery-view]" ? views : selector === "h3" ? [galleryTitle] : [close, previous, next, large],
    querySelector: selector => ({ "[data-gallery-close]": options.missingClose ? null : close, "[data-gallery-status]": status, "[data-gallery-previous]": previous, "[data-gallery-next]": next, "[data-gallery-large-link]": large })[selector]
  });
  const detailClose = element(), detailCta = element(), detailTitle = element({ textContent: "" });
  const hiddenTitle = { textContent: "Dettaglio concreto" };
  const marker = {};
  const content = { nextSibling: marker, parent: "fallback" };
  const detailBody = { append(node) { node.parent = "dialog"; } };
  const summary = element({ closest: () => null });
  const detailFallback = {
    id: options.invalidDetailId ? 'detail-unknown"bad' : "detail-home-problems-varianti",
    querySelector: selector => ({ "summary[data-detail-trigger]": summary, "[data-detail-content]": content, "[data-detail-title]": options.missingDetailTitle ? null : hiddenTitle })[selector],
    insertBefore(node, sibling) { if (sibling !== marker) throw Error("Lost source location"); node.parent = "fallback"; }
  };
  const detailDialog = element({ id: "card-detail-dialog", open: false,
    getAttribute: () => "detail-title", querySelectorAll: selector => selector === "h3" ? [detailTitle] : [detailClose, detailCta],
    querySelector: selector => ({ "[data-gallery-close]": detailClose, "[data-detail-dialog-body]": detailBody })[selector]
  });
  const menu = { open: Boolean(options.menuOpen) };
  const dialogs = [gallery, detailDialog];
  for (const dialog of dialogs) {
    const geometry = options.dialogGeometry || {};
    dialog.clientTop = 1;
    dialog.clientHeight = geometry.clientHeight || 640;
    dialog.scrollHeight = geometry.scrollHeight || 640;
    dialog.scrollTop = 0;
    dialog.scrolls = [];
    dialog.getBoundingClientRect = () => ({ top: 16, bottom: 18 + dialog.clientHeight });
    dialog.scrollTo = function (value) {
      this.scrolls.push({ ...value });
      this.scrollTop = Math.max(0, Math.min(this.scrollHeight - this.clientHeight, value.top));
    };
    dialog.showModal = function () { if (options.showThrows) throw Error("Native dialog failure"); this.open = true; };
    dialog.close = function () { this.open = false; this.emit("close"); };
  }
  large.getBoundingClientRect = () => ({ top: (options.dialogGeometry?.lastTop || 500) - gallery.scrollTop, bottom: (options.dialogGeometry?.lastTop || 500) + 32 - gallery.scrollTop });
  detailCta.getBoundingClientRect = () => ({ top: (options.dialogGeometry?.lastTop || 500) - detailDialog.scrollTop, bottom: (options.dialogGeometry?.lastTop || 500) + 32 - detailDialog.scrollTop });
  document.getElementById = id => id === "gallery-title" ? (options.missingTitle ? null : galleryTitle) : id === "detail-title" ? detailTitle : null;
  document.querySelector = selector => {
    if (selector === "[data-site-menu]") return menu;
    if (selector === "[data-detail-dialog]") return detailDialog;
    if (selector.startsWith("[data-project-trigger=")) return galleryTrigger;
    if (selector.startsWith("[data-project-fallback=")) return galleryFallback;
    return null;
  };
  document.querySelectorAll = selector => {
    if (selector === "[data-project-dialog]") return [gallery];
    if (selector === 'dialog[open], [role="dialog"]') return [...dialogs.filter(d => d.open), ...(options.otherSurface ? [element()] : [])];
    if (selector === "details[data-card-detail]") return [detailFallback];
    if (selector.startsWith('[id="')) return options.duplicateId ? [detailFallback, detailFallback] : [detailFallback];
    return [];
  };
  function HTMLDialogElement() {}
  HTMLDialogElement.prototype.showModal = function () {};
  const scrolls = [];
  const window = { scrollX: 0, scrollY: 930, scrollTo(value) { scrolls.push(value); } };
  if (!options.noNative) window.HTMLDialogElement = HTMLDialogElement;
  vm.runInNewContext(options.code || fs.readFileSync(path.join(root46, "js/project-proof-galleries.js"), "utf8"), { window, document, HTMLDialogElement });
  return { document, window, menu, gallery, detailDialog, galleryTrigger, galleryFallback, views, close, previous, next, large, status, summary, content, detailTitle, detailClose, detailCta, track, scrolls,
    click(target, values) { document.activeElement = target; return target.emit("click", values); } };
}
