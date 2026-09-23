(function () {
  "use strict";
  if (!("HTMLDialogElement" in window) || !HTMLDialogElement.prototype.showModal) return;
  let active = null;
  const track = document.getElementById("home-projects");
  document.querySelectorAll("[data-project-dialog]").forEach(function (dialog) {
    const id = dialog.dataset.projectDialog;
    const trigger = document.querySelector('[data-project-trigger="' + id + '"]');
    const fallback = document.querySelector('[data-project-fallback="' + id + '"]');
    const views = [...dialog.querySelectorAll("[data-gallery-view]")];
    const close = dialog.querySelector("[data-gallery-close]");
    const status = dialog.querySelector("[data-gallery-status]");
    if (!trigger || !fallback || views.length < 2 || !close || !status) return;
    let index = 0;
    let restored = null;
    function show(next) {
      index = (next + views.length) % views.length;
      views.forEach(function (view, i) {
        view.hidden = i !== index;
        if (i !== index) return;
        const image = view.querySelector("img");
        if (!image.hasAttribute("src")) {
          image.srcset = image.dataset.gallerySrcset;
          image.src = image.dataset.gallerySrc;
        }
      });
      status.textContent = "Immagine " + (index + 1) + " di " + views.length;
    }
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.addEventListener("click", function (event) {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const menu = document.querySelector("[data-site-menu]");
      const otherDialog = [...document.querySelectorAll('dialog[open], [role="dialog"]')]
        .some(function (element) { return element !== dialog && element.getClientRects().length > 0; });
      if (active || menu?.open || otherDialog) {
        // Leave the readable HTML fallback available; never stack with consent/menu UI.
        fallback.hidden = false;
        return;
      }
      event.preventDefault();
      restored = { y: window.scrollY, x: track?.scrollLeft || 0, overflow: document.body.style.overflow };
      show(0);
      dialog.showModal();
      active = dialog;
      document.body.style.overflow = "hidden";
      close.focus({ preventScroll: true });
    });
    close.addEventListener("click", function () { dialog.close(); });
    dialog.querySelector("[data-gallery-previous]").addEventListener("click", function () { show(index - 1); });
    dialog.querySelector("[data-gallery-next]").addEventListener("click", function () { show(index + 1); });
    dialog.addEventListener("keydown", function (event) {
      if (event.key === "Tab") {
        const controls = [...dialog.querySelectorAll('button:not([disabled]), a[href]')]
          .filter(function (element) { return element.getClientRects().length > 0; });
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (first && last && ((event.shiftKey && document.activeElement === first) ||
            (!event.shiftKey && document.activeElement === last))) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus({ preventScroll: true });
        }
        return;
      }
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      show(index + (event.key === "ArrowRight" ? 1 : -1));
    });
    // Native modal supplies inert background and Escape; Tab wrapping is explicit above.
    dialog.addEventListener("close", function () {
      if (active !== dialog || !restored) return;
      const previous = restored;
      restored = null;
      active = null;
      document.body.style.overflow = previous.overflow;
      trigger.focus({ preventScroll: true });
      if (track) track.scrollLeft = previous.x;
      window.scrollTo({ top: previous.y, left: 0, behavior: "instant" });
    });
    fallback.hidden = true;
  });
})();
