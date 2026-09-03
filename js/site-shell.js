(function () {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");

  function savedTheme() {
    try {
      const value = localStorage.getItem("theme");
      return value === "light" || value === "dark" ? value : null;
    } catch (_) {
      return null;
    }
  }

  function applyTheme(theme, persist) {
    root.dataset.theme = theme;
    body.classList.toggle("dark-mode", theme === "dark");

    if (themeToggle) {
      const dark = theme === "dark";
      themeToggle.setAttribute("aria-pressed", String(dark));
      themeToggle.setAttribute("aria-label", dark ? "Attiva il tema chiaro" : "Attiva il tema scuro");
    }

    if (persist) {
      try {
        localStorage.setItem("theme", theme);
      } catch (_) {}
    }
  }

  applyTheme(root.dataset.theme || (colorScheme.matches ? "dark" : "light"), false);

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
    });
  }

  colorScheme.addEventListener("change", function (event) {
    if (!savedTheme()) applyTheme(event.matches ? "dark" : "light", false);
  });

  const header = document.querySelector("[data-site-header]");
  if (header) {
    const updateHeader = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  const detailsMenus = [...document.querySelectorAll(".solutions-menu, [data-mobile-menu]")];

  detailsMenus.forEach(function (menu) {
    const summary = menu.querySelector(":scope > summary");
    if (!summary) return;

    const syncExpanded = function () {
      summary.setAttribute("aria-expanded", String(menu.open));
    };

    syncExpanded();
    menu.addEventListener("toggle", syncExpanded);

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        menu.open = false;
      });
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    const openMenu = detailsMenus.find(function (menu) { return menu.open; });
    if (!openMenu) return;
    openMenu.open = false;
    const summary = openMenu.querySelector(":scope > summary");
    if (summary) summary.focus();
  });

  document.addEventListener("click", function (event) {
    detailsMenus.forEach(function (menu) {
      if (menu.open && !menu.contains(event.target)) menu.open = false;
    });
  });
})();
