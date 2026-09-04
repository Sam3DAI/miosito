(function () {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
  const pageOwnsTheme = body.dataset.page === "contact" || body.dataset.page === "configurators";

  function savedTheme() {
    try {
      const value = localStorage.getItem("theme");
      return value === "light" || value === "dark" ? value : null;
    } catch (_) {
      return null;
    }
  }

  function updateThemeControl(theme) {
    if (!themeToggle) return;
    const dark = theme === "dark";
    themeToggle.setAttribute("aria-pressed", String(dark));
    themeToggle.setAttribute("aria-label", dark ? "Attiva il tema chiaro" : "Attiva il tema scuro");
  }

  function applyTheme(theme, persist) {
    root.dataset.theme = theme;
    body.classList.toggle("dark-mode", theme === "dark");
    updateThemeControl(theme);

    if (persist) {
      try {
        localStorage.setItem("theme", theme);
      } catch (_) {}
    }
  }

  applyTheme(root.dataset.theme || savedTheme() || (colorScheme.matches ? "dark" : "light"), false);

  if (pageOwnsTheme) {
    const syncPageTheme = function () {
      const theme = body.classList.contains("dark-mode") ? "dark" : "light";
      root.dataset.theme = theme;
      updateThemeControl(theme);
    };
    new MutationObserver(syncPageTheme).observe(body, { attributes: true, attributeFilter: ["class"] });
    document.addEventListener("DOMContentLoaded", syncPageTheme, { once: true });
  } else {
    if (themeToggle) {
      themeToggle.addEventListener("click", function () {
        applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
      });
    }

    colorScheme.addEventListener("change", function (event) {
      if (!savedTheme()) applyTheme(event.matches ? "dark" : "light", false);
    });
  }

  const header = document.querySelector("[data-site-header]");
  if (header) {
    const updateHeader = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  const siteMenu = document.querySelector("[data-site-menu]");
  if (siteMenu) {
    const summary = siteMenu.querySelector(":scope > summary");
    const overlay = siteMenu.querySelector(".site-navigation__overlay");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let closingTimer = 0;
    let restoreFocus = false;

    const menuFocusables = function () {
      return [...siteMenu.querySelectorAll("summary, a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])")]
        .filter(function (element) { return !element.hidden && element.getClientRects().length > 0; });
    };

    const finishClose = function () {
      window.clearTimeout(closingTimer);
      siteMenu.classList.remove("is-closing");
      siteMenu.open = false;
      if (restoreFocus && summary) summary.focus();
      restoreFocus = false;
    };

    const closeMenu = function (shouldRestoreFocus) {
      if (!siteMenu.open || siteMenu.classList.contains("is-closing")) return;
      restoreFocus = shouldRestoreFocus;
      siteMenu.classList.add("is-closing");
      closingTimer = window.setTimeout(finishClose, reducedMotion.matches ? 0 : 300);
    };

    const syncMenu = function () {
      if (!summary) return;
      summary.setAttribute("aria-expanded", String(siteMenu.open));
      summary.setAttribute("aria-label", siteMenu.open ? "Chiudi il menu principale" : "Apri il menu principale");
      body.classList.toggle("is-menu-open", siteMenu.open);
      root.classList.toggle("is-menu-open", siteMenu.open);
      if (header) header.classList.toggle("is-menu-active", siteMenu.open);

      if (siteMenu.open && !siteMenu.classList.contains("is-closing")) {
        window.requestAnimationFrame(function () {
          const firstLink = overlay && overlay.querySelector("a[href]");
          if (firstLink) firstLink.focus();
        });
      }
    };

    syncMenu();
    siteMenu.addEventListener("toggle", syncMenu);

    if (summary) {
      summary.addEventListener("click", function (event) {
        if (!siteMenu.open) return;
        event.preventDefault();
        closeMenu(true);
      });
    }

    siteMenu.querySelectorAll("a[href]").forEach(function (link) {
      link.addEventListener("click", function () {
        closeMenu(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (!siteMenu.open || siteMenu.classList.contains("is-closing")) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(true);
        return;
      }

      if (event.key !== "Tab") return;
      const focusables = menuFocusables();
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  document.querySelectorAll("[data-visual-card-rail]").forEach(function (rail) {
    const track = rail.querySelector("[data-rail-track]");
    const cards = [...rail.querySelectorAll("[data-rail-card]")];
    const controls = rail.querySelector("[data-rail-controls]");
    const previous = rail.querySelector("[data-rail-previous]");
    const next = rail.querySelector("[data-rail-next]");
    const indicators = [...rail.querySelectorAll("[data-rail-indicators] span")];
    const status = rail.querySelector("[data-rail-status]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let activeIndex = 0;

    if (!track || cards.length < 2 || !controls || !previous || !next) return;
    controls.hidden = false;

    const nearestIndex = function () {
      const left = track.scrollLeft;
      let closest = 0;
      let distance = Infinity;
      cards.forEach(function (card, index) {
        const currentDistance = Math.abs(card.offsetLeft - track.offsetLeft - left);
        if (currentDistance < distance) {
          distance = currentDistance;
          closest = index;
        }
      });
      return closest;
    };

    const update = function () {
      activeIndex = nearestIndex();
      previous.disabled = activeIndex === 0;
      next.disabled = activeIndex === cards.length - 1;
      indicators.forEach(function (indicator, index) {
        indicator.classList.toggle("is-active", index === activeIndex);
      });
      if (status) status.textContent = `Card ${activeIndex + 1} di ${cards.length}`;
    };

    const goTo = function (index) {
      const target = cards[Math.max(0, Math.min(cards.length - 1, index))];
      if (!target) return;
      track.scrollTo({
        left: target.offsetLeft - track.offsetLeft,
        behavior: reducedMotion.matches ? "auto" : "smooth"
      });
    };

    previous.addEventListener("click", function () { goTo(activeIndex - 1); });
    next.addEventListener("click", function () { goTo(activeIndex + 1); });

    track.addEventListener("keydown", function (event) {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "Home") goTo(0);
      if (event.key === "End") goTo(cards.length - 1);
      if (event.key === "ArrowLeft") goTo(activeIndex - 1);
      if (event.key === "ArrowRight") goTo(activeIndex + 1);
    });

    track.addEventListener("scroll", function () {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    }, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
  });
})();
