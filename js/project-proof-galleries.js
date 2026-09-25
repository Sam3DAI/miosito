(function () {
  "use strict";
  if (!("HTMLDialogElement" in window) || !HTMLDialogElement.prototype.showModal) return;
  let active = null;
  const focusable = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function anotherSurfaceOpen(dialog) {
    const menu = document.querySelector("[data-site-menu]");
    return Boolean(active || menu?.open || [...document.querySelectorAll('dialog[open], [role="dialog"]')]
      .some(function (element) { return element !== dialog && element.getClientRects().length > 0; }));
  }
  function modifiedClick(event) {
    return event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || (event.button != null && event.button !== 0);
  }
  function revealDialogFocus(dialog, control) {
    const viewport = dialog.getBoundingClientRect();
    const bounds = control.getBoundingClientRect();
    const top = viewport.top + dialog.clientTop + 8;
    const bottom = viewport.top + dialog.clientTop + dialog.clientHeight - 8;
    const delta = bounds.top < top ? bounds.top - top : bounds.bottom > bottom ? bounds.bottom - bottom : 0;
    // Only this scroll container moves; preventScroll still protects the page/rail.
    if (delta) dialog.scrollTo({ top: dialog.scrollTop + delta, behavior: "instant" });
  }
  // One lifecycle for project galleries and editorial details. showModal supplies
  // an inert background and native Escape; body and rail scroll are restored.
  function prepareDialog(dialog) {
    const close = dialog.querySelector("[data-gallery-close]");
    const title = document.getElementById(dialog.getAttribute("aria-labelledby"));
    if (!close || !title || dialog.querySelectorAll("h3").length !== 1) return null;
    let restored = null;
    close.addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("keydown", function (event) {
      if (event.key !== "Tab") return;
      const controls = [...dialog.querySelectorAll(focusable)].filter(function (element) { return element.getClientRects().length > 0; });
      const first = controls[0], last = controls[controls.length - 1];
      if (first && last && ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last))) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
        revealDialogFocus(dialog, event.shiftKey ? last : first);
      }
    });
    dialog.addEventListener("close", function () {
      if (active !== dialog || !restored) return;
      const previous = restored;
      restored = null;
      active = null;
      previous.release?.();
      document.body.style.overflow = previous.overflow;
      previous.trigger.focus({ preventScroll: true });
      if (previous.track) previous.track.scrollLeft = previous.railX;
      window.scrollTo({ top: previous.y, left: previous.x, behavior: "instant" });
    });
    return function (trigger, mount, release) {
      if (anotherSurfaceOpen(dialog)) return false;
      const track = trigger.closest("[data-rail-track]");
      restored = { trigger: trigger, track: track, railX: track?.scrollLeft || 0, x: window.scrollX, y: window.scrollY, overflow: document.body.style.overflow, release: release };
      mount();
      try { dialog.showModal(); }
      catch (_) { release?.(); restored = null; return false; }
      active = dialog;
      document.body.style.overflow = "hidden";
      close.focus({ preventScroll: true });
      return true;
    };
  }
  const publicImage = /^\/assets\/images\/projects-46\/[a-z0-9-]+-(?:768|1440|2560)\.webp$/;
  function validView(view) {
    const image = view.querySelector("img");
    return image && image.alt && publicImage.test(image.dataset.gallerySrc || "") &&
      publicImage.test(view.dataset.galleryLarge || "") &&
      (image.dataset.gallerySrcset || "").split(",").length === 3 &&
      image.dataset.gallerySrcset.split(",").every(function (part) {
        const match = part.trim().match(/^(\S+) (768|1440|2560)w$/);
        return match && publicImage.test(match[1]) && match[1].endsWith("-" + match[2] + ".webp");
      });
  }
  document.querySelectorAll("[data-project-dialog]").forEach(function (dialog) {
    const id = dialog.dataset.projectDialog;
    if (!/^[a-z0-9-]+$/.test(id)) return;
    const trigger = document.querySelector('[data-project-trigger="' + id + '"]');
    const fallback = document.querySelector('[data-project-fallback="' + id + '"]');
    const views = [...dialog.querySelectorAll("[data-gallery-view]")];
    const status = dialog.querySelector("[data-gallery-status]");
    const previous = dialog.querySelector("[data-gallery-previous]");
    const next = dialog.querySelector("[data-gallery-next]");
    const large = dialog.querySelector("[data-gallery-large-link]");
    if (!trigger || !fallback || views.length < 2 || !status || !previous || !next || !large || !views.every(validView)) return;
    const open = prepareDialog(dialog);
    if (!open) return;
    let index = 0;
    function show(nextIndex) {
      index = (nextIndex + views.length) % views.length;
      views.forEach(function (view, i) {
        view.hidden = i !== index;
        if (i !== index) return;
        const image = view.querySelector("img");
        if (!image.hasAttribute("src")) {
          image.srcset = image.dataset.gallerySrcset;
          image.src = image.dataset.gallerySrc;
        }
      });
      large.href = views[index].dataset.galleryLarge;
      status.textContent = "Immagine " + (index + 1) + " di " + views.length;
    }
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.addEventListener("click", function (event) {
      if (modifiedClick(event)) return;
      if (open(trigger, function () { show(0); })) event.preventDefault();
      else fallback.hidden = false;
    });
    previous.addEventListener("click", function () { show(index - 1); });
    next.addEventListener("click", function () { show(index + 1); });
    dialog.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      show(index + (event.key === "ArrowRight" ? 1 : -1));
    });
    fallback.hidden = true;
  });
  const detailDialog = document.querySelector("[data-detail-dialog]");
  if (!detailDialog) return;
  const detailBody = detailDialog.querySelector("[data-detail-dialog-body]");
  const detailTitle = document.getElementById(detailDialog.getAttribute("aria-labelledby"));
  const openDetail = prepareDialog(detailDialog);
  if (!detailBody || !detailTitle || !openDetail) return;
  document.querySelectorAll("details[data-card-detail]").forEach(function (fallback) {
    const trigger = fallback.querySelector("summary[data-detail-trigger]");
    const content = fallback.querySelector("[data-detail-content]");
    const title = fallback.querySelector("[data-detail-title]");
    if (!/^detail-[a-z0-9-]+$/.test(fallback.id) || document.querySelectorAll('[id="' + fallback.id + '"]').length !== 1 ||
        !trigger || !content || !title?.textContent.trim()) return;
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-controls", detailDialog.id);
    trigger.addEventListener("click", function (event) {
      if (modifiedClick(event)) return;
      const nextSibling = content.nextSibling;
      const opened = openDetail(trigger, function () {
        detailTitle.textContent = title.textContent;
        detailBody.append(content);
      }, function () {
        fallback.insertBefore(content, nextSibling);
      });
      if (opened) event.preventDefault();
      // Without enhancement, or while another surface is open, native details
      // remains usable. No HTML parsing, clone, global click interception or form.
    });
  });
})();
