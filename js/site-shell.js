(function () {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  root.classList.add("has-site-shell-js");
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
    let openingScrollY = null;
    let wasOpen = false;
    const inertState = new Map();

    const backgroundTargets = function () {
      const pageContent = [...body.children].filter(function (element) {
        return element !== header && element.tagName !== "SCRIPT" && element.tagName !== "STYLE";
      });
      // Do not inert the header: it contains the persistent menu control.
      return pageContent.concat([...header.querySelectorAll(".brand, .theme-toggle, .header-cta")]);
    };

    const setBackgroundInert = function (inert) {
      if (inert) {
        backgroundTargets().forEach(function (element) {
          if (!inertState.has(element)) inertState.set(element, element.inert);
          element.inert = true;
        });
        return;
      }
      inertState.forEach(function (previous, element) {
        element.inert = previous;
      });
      inertState.clear();
    };

    const menuFocusables = function () {
      return [...siteMenu.querySelectorAll("summary, a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])")]
        .filter(function (element) { return !element.hidden && element.getClientRects().length > 0; });
    };

    const finishClose = function () {
      const scrollYToRestore = openingScrollY;
      window.clearTimeout(closingTimer);
      siteMenu.classList.remove("is-closing");
      siteMenu.open = false;
      if (restoreFocus) {
        if (summary) summary.focus({ preventScroll: true });
        window.requestAnimationFrame(function () {
          window.scrollTo({ top: scrollYToRestore ?? window.scrollY, left: 0, behavior: "auto" });
        });
      }
      openingScrollY = null;
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
      if (siteMenu.open && !wasOpen && openingScrollY === null) openingScrollY = window.scrollY;
      body.classList.toggle("is-menu-open", siteMenu.open);
      root.classList.toggle("is-menu-open", siteMenu.open);
      if (header) header.classList.toggle("is-menu-active", siteMenu.open);
      setBackgroundInert(siteMenu.open);
      wasOpen = siteMenu.open;

      if (siteMenu.open && !siteMenu.classList.contains("is-closing")) {
        window.requestAnimationFrame(function () {
          if (siteMenu.open && !siteMenu.classList.contains("is-closing")) summary.focus({ preventScroll: true });
        });
      }
    };

    syncMenu();
    siteMenu.addEventListener("toggle", syncMenu);

    if (summary) {
      summary.addEventListener("click", function (event) {
        if (!siteMenu.open) {
          openingScrollY = window.scrollY;
          return;
        }
        event.preventDefault();
        if (siteMenu.classList.contains("is-closing")) {
          window.clearTimeout(closingTimer);
          siteMenu.classList.remove("is-closing");
          restoreFocus = false;
        } else {
          closeMenu(true);
        }
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
        first.focus({ preventScroll: true });
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
    const tolerance = 2;
    let frame = 0;
    let pendingLeft = null;
    let motionTimer = 0;

    if (!track || !cards.length || !controls || !previous || !next) return;

    const anchorHeadingId = track.getAttribute("data-rail-anchor-heading");
    const anchorHeading = anchorHeadingId ? document.getElementById(anchorHeadingId) : null;
    const measureAnchorContext = function () {
      if (!anchorHeading) return;
      const context = Math.max(0, track.getBoundingClientRect().top - anchorHeading.getBoundingClientRect().top);
      track.style.setProperty("--sx-anchor-context", `${context}px`);
    };
    measureAnchorContext();
    if (anchorHeading && "ResizeObserver" in window) {
      new window.ResizeObserver(measureAnchorContext).observe(anchorHeading);
    }

    const maximumLeft = function () {
      return Math.max(0, track.scrollWidth - track.clientWidth);
    };

    const clearMotion = function () {
      window.clearTimeout(motionTimer);
      pendingLeft = null;
    };

    const reachableLeft = function (card) {
      return Math.max(0, Math.min(maximumLeft(), card.offsetLeft - cards[0].offsetLeft));
    };

    const nearestIndex = function () {
      const left = track.scrollLeft;
      const maximum = maximumLeft();
      // Several cards can share the same physical endpoint on desktop.
      if (maximum > tolerance && Math.abs(left - maximum) <= tolerance) return cards.length - 1;
      let closest = 0;
      let distance = Infinity;
      cards.forEach(function (card, index) {
        const currentDistance = Math.abs(reachableLeft(card) - left);
        if (currentDistance < distance) {
          distance = currentDistance;
          closest = index;
        }
      });
      return closest;
    };

    const update = function () {
      const hasOverflow = cards.length > 1 && maximumLeft() > tolerance;
      controls.hidden = !hasOverflow;
      previous.disabled = !hasOverflow;
      next.disabled = !hasOverflow;
      const activeIndex = nearestIndex();
      indicators.forEach(function (indicator, index) {
        indicator.classList.toggle("is-active", index === activeIndex);
      });
      if (status) status.textContent = `Card ${activeIndex + 1} di ${cards.length}`;
      if (pendingLeft !== null && Math.abs(track.scrollLeft - pendingLeft) <= tolerance) clearMotion();
    };

    const moveTo = function (left) {
      if (maximumLeft() <= tolerance || pendingLeft !== null) return;
      pendingLeft = Math.max(0, Math.min(maximumLeft(), left));
      // Ignore repeated commands during this movement: a partial last card
      // must reach the real endpoint before a later click can wrap it.
      // Native gestures cancel the guard; the timeout prevents a stuck lock.
      motionTimer = window.setTimeout(function () { clearMotion(); update(); }, 900);
      track.scrollTo({ left: pendingLeft, behavior: reducedMotion.matches ? "auto" : "smooth" });
      update();
    };

    const goTo = function (index) {
      clearMotion();
      moveTo(reachableLeft(cards[Math.max(0, Math.min(cards.length - 1, index))]));
    };

    const goPrevious = function (wrap = false) {
      if (pendingLeft !== null || maximumLeft() <= tolerance) return;
      const currentLeft = track.scrollLeft;
      if (currentLeft <= tolerance) {
        if (wrap) moveTo(maximumLeft());
        return;
      }
      for (let index = cards.length - 1; index >= 0; index -= 1) {
        if (reachableLeft(cards[index]) < currentLeft - tolerance) {
          moveTo(reachableLeft(cards[index]));
          return;
        }
      }
      moveTo(0);
    };

    const goNext = function (wrap = false) {
      if (pendingLeft !== null || maximumLeft() <= tolerance) return;
      const currentLeft = track.scrollLeft;
      if (currentLeft >= maximumLeft() - tolerance) {
        if (wrap) moveTo(0);
        return;
      }
      for (let index = 0; index < cards.length; index += 1) {
        if (reachableLeft(cards[index]) > currentLeft + tolerance) {
          moveTo(reachableLeft(cards[index]));
          return;
        }
      }
      moveTo(maximumLeft());
    };

    // Only an explicit arrow-button activation wraps; swipes and track keys do not.
    previous.addEventListener("click", function () { goPrevious(true); });
    next.addEventListener("click", function () { goNext(true); });

    track.addEventListener("keydown", function (event) {
      if (event.target !== track || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "Home") goTo(0);
      if (event.key === "End") goTo(cards.length - 1);
      if (event.key === "ArrowLeft") goPrevious();
      if (event.key === "ArrowRight") goNext();
    });
    track.addEventListener("scroll", function () {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    }, { passive: true });
    track.addEventListener("scrollend", function () { clearMotion(); update(); }, { passive: true });
    ["pointerdown", "touchstart", "wheel"].forEach(function (type) {
      track.addEventListener(type, clearMotion, { passive: true });
    });
    window.addEventListener("resize", function () { clearMotion(); measureAnchorContext(); update(); }, { passive: true });
    update();
  });
})();
