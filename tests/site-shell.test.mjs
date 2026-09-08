import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const shell = fs.readFileSync(path.join(root, "js/site-shell.js"), "utf8");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const plain = html => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

function eventTarget() {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(listener);
    },
    emit(type, event = {}) {
      const message = { target: this, prevented: false, preventDefault() { this.prevented = true; }, ...event };
      for (const listener of listeners.get(type) || []) listener(message);
      return message;
    }
  };
}

function fixture({ offsets = [0, 370, 740, 1110], max = 404, smooth = false, anchorContext = null } = {}) {
  let observedResize;
  const anchorProperties = {};
  const heading = { getBoundingClientRect() { return { top: 150 - anchorContext }; } };
  const track = Object.assign(eventTarget(), {
    scrollLeft: 0, clientWidth: 1425, scrollWidth: 1425 + max,
    getAttribute() { return anchorContext === null ? null : "scenario-title"; },
    getBoundingClientRect() { return { top: 150 }; },
    style: { setProperty(name, value) { anchorProperties[name] = value; } }
  });
  const previous = eventTarget(), next = eventTarget(), controls = { hidden: true }, status = {};
  const cards = offsets.map(offsetLeft => ({ offsetLeft: offsetLeft + 180 }));
  const indicators = cards.map(() => ({ active: false, classList: { toggle(_, value) { this.owner.active = value; } } }));
  indicators.forEach(indicator => { indicator.classList.owner = indicator; });
  const requests = [], timers = new Map();
  let timerId = 0;
  const window = Object.assign(eventTarget(), {
    ResizeObserver: class { constructor(callback) { observedResize = callback; } observe(target) { assert.equal(target, heading); } },
    matchMedia(query) { return { matches: query.includes("reduced-motion") && !smooth, addEventListener() {} }; },
    requestAnimationFrame(callback) { callback(); return 1; },
    cancelAnimationFrame() {},
    setTimeout(callback) { timers.set(++timerId, callback); return timerId; },
    clearTimeout(id) { timers.delete(id); }
  });
  const rail = {
    querySelector(selector) {
      return { "[data-rail-track]": track, "[data-rail-controls]": controls, "[data-rail-previous]": previous,
        "[data-rail-next]": next, "[data-rail-status]": status }[selector] || null;
    },
    querySelectorAll(selector) { return selector === "[data-rail-card]" ? cards : indicators; }
  };
  const document = {
    documentElement: { dataset: { theme: "light" }, classList: { add() {} } },
    body: { dataset: { page: "fixture" }, classList: { toggle() {} } },
    querySelector() { return null; },
    getElementById(id) { return id === "scenario-title" ? heading : null; },
    querySelectorAll(selector) { return selector === "[data-visual-card-rail]" ? [rail] : []; }
  };
  track.scrollTo = options => {
    requests.push(options);
    if (!smooth) { track.scrollLeft = options.left; track.emit("scroll"); }
  };
  vm.runInNewContext(shell, { window, document, localStorage: { getItem() { return null; } } });
  return {
    track, previous, next, controls, status, indicators, requests, anchorProperties,
    remeasure(context) { anchorContext = context; observedResize(); },
    click(button) { document.activeElement = button; button.emit("click"); assert.equal(document.activeElement, button); },
    settle() { track.scrollLeft = requests.at(-1).left; track.emit("scroll"); track.emit("scrollend"); },
    swipe(left) { track.emit("pointerdown"); track.scrollLeft = left; track.emit("scroll"); track.emit("scrollend"); },
    resize(maximum) {
      track.scrollWidth = track.clientWidth + maximum;
      track.scrollLeft = Math.min(track.scrollLeft, maximum);
      window.emit("resize");
    },
    expire() { for (const callback of [...timers.values()]) callback(); }
  };
}

test("carousel arrow clicks wrap at physical endpoints shared by several visible cards", () => {
  const f = fixture();
  assert.equal(f.previous.disabled, false);
  assert.equal(f.next.disabled, false);
  for (const expected of [370, 404, 0]) { f.click(f.next); assert.equal(f.track.scrollLeft, expected); }
  for (const expected of [404, 370, 0, 404]) { f.click(f.previous); assert.equal(f.track.scrollLeft, expected); }
  assert.equal(f.status.textContent, "Card 4 di 4");
  assert.equal(f.indicators[3].active, true);
  assert.equal(f.next.listeners.get("click").length, 1);
});

test("partially visible final card is reached before a later explicit wrap", () => {
  const f = fixture({ offsets: [0, 320, 640, 960], max: 933 });
  f.swipe(800);
  assert.equal(f.requests.length, 0);
  f.click(f.next);
  assert.equal(f.track.scrollLeft, 933);
  f.click(f.next);
  assert.equal(f.track.scrollLeft, 0);
});

test("functional rail anchor measures its heading without moving the document or track", () => {
  const f = fixture({ anchorContext: 112.64 });
  assert.equal(f.anchorProperties["--sx-anchor-context"], "112.64px");
  f.remeasure(97.65);
  assert.equal(f.anchorProperties["--sx-anchor-context"], "97.65px");
  assert.equal(f.track.scrollLeft, 0);
  assert.equal(f.requests.length, 0);
  assert.match(read("css/marketing-pages.css"), /\[data-rail-anchor-heading\]\s*\{\s*scroll-margin-top: calc\(var\(--sx-anchor-offset\) \+ var\(--sx-anchor-context, 0px\)\)/);
});

test("track Home/End stay absolute and arrows do not wrap or intercept field keys", () => {
  const f = fixture();
  f.track.emit("keydown", { key: "End" });
  assert.equal(f.track.scrollLeft, 404);
  f.track.emit("keydown", { key: "ArrowRight" });
  assert.equal(f.track.scrollLeft, 404);
  assert.equal(f.track.emit("keydown", { key: "ArrowLeft", target: { tagName: "INPUT" } }).prevented, false);
  assert.equal(f.track.scrollLeft, 404);
  f.track.emit("keydown", { key: "Home" });
  f.track.emit("keydown", { key: "ArrowLeft" });
  assert.equal(f.track.scrollLeft, 0);
});

test("no-overflow and one-card rails hide and disable both controls without fake movement", () => {
  for (const options of [{ max: 0 }, { offsets: [0], max: 0 }]) {
    const f = fixture(options);
    assert.equal(f.controls.hidden, true);
    assert.equal(f.previous.disabled, true);
    assert.equal(f.next.disabled, true);
    f.click(f.next); f.click(f.previous);
    assert.equal(f.requests.length, 0);
  }
});

test("repeated clicks during smooth movement cannot wrap a still-partial final card", () => {
  const f = fixture({ smooth: true });
  f.click(f.next); f.click(f.next); f.click(f.next);
  assert.equal(f.requests.length, 1);
  assert.equal(f.requests[0].left, 370);
  f.settle();
  f.click(f.next);
  f.track.scrollLeft = 390; f.track.emit("scroll");
  f.click(f.next);
  assert.equal(f.requests.length, 2);
  assert.equal(f.requests.at(-1).left, 404);
  f.settle();
  f.click(f.next);
  assert.equal(f.requests.at(-1).left, 0);
});

test("native gestures and resize do not wrap and clear in-flight navigation guards", () => {
  const f = fixture({ smooth: true });
  f.click(f.next);
  f.swipe(404);
  assert.equal(f.requests.length, 1);
  assert.equal(f.status.textContent, "Card 4 di 4");
  f.resize(0);
  assert.equal(f.controls.hidden, true);
  f.resize(933);
  assert.equal(f.controls.hidden, false);
  f.click(f.previous);
  assert.equal(f.requests.at(-1).left, 933);
});

test("motion timeout releases a disrupted movement without initiating another scroll", () => {
  const f = fixture({ smooth: true });
  f.click(f.next);
  f.track.scrollLeft = 120; f.track.emit("scroll");
  f.expire();
  assert.equal(f.requests.length, 1);
  f.click(f.next);
  assert.equal(f.requests.length, 2);
  assert.equal(f.requests.at(-1).left, 370);
});

test("page, menu, project spacing and submit variants remain explicit and separate", () => {
  const css = read("css/foundation.css"), header = read("src/_includes/partials/site-header.njk");
  for (const name of ["page", "menu", "submit", "project"]) assert.ok(css.includes(".button--" + name));
  assert.match(css, /\.button--project\s*\{\s*padding-inline:\s*0\.75rem/);
  assert.match(css, /\.button--compact\.button--project\s*\{\s*padding-inline:\s*0\.5rem/);
  assert.match(css, /\.button--secondary\s*\{[^}]*border-color:\s*var\(--sx-pink\)/s);
  assert.match(css, /\.button--submit\s*\{[^}]*width:\s*fit-content[^}]*justify-self:\s*start/s);
  assert.match(css, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(header, /button--menu button--project header-cta/);
  assert.doesNotMatch(header, /button--page|button--secondary|button--submit/);
  for (const page of ["configuratori-3d-2d", "contattaci"]) {
    const template = read("src/" + page + ".njk");
    const submit = template.match(/<button type="submit"[^>]*>/)[0];
    assert.match(submit, /button--submit/);
    assert.doesNotMatch(submit, /button--page|button--menu/);
  }
});

test("three requested desktop statements preserve exact text and two semantic line segments", () => {
  const html = read("src/index.njk");
  for (const [id, text] of [
    ["solutions-title", "Una soluzione. Per ogni processo di vendita."],
    ["capabilities-title", "Visualizzare quando serve. Automatizzare dove crea valore."],
    ["flow-title", "Dal catalogo al preventivo. In un unico flusso."]
  ]) {
    const heading = html.match(new RegExp('<h2 id="' + id + '">([\\s\\S]*?)<\\/h2>'))[1];
    assert.equal(plain(heading), text);
    assert.equal((heading.match(/class="statement-line"/g) || []).length, 2);
    assert.doesNotMatch(heading, /<h[1-6]\b/);
  }
  const css = read("css/marketing-pages.css");
  assert.match(css, /\.section-heading--statement\s*\{\s*max-width:\s*68rem/);
  assert.doesNotMatch(css, /statement-line[^}]*nowrap/s);
});

test("FAQ highlights are substrings of plain questions and leave answers unmodified by markup", () => {
  for (const page of ["index", "configuratori-3d-2d", "configuratori-ecommerce", "software-cpq-portali-commerciali", "planner-configuratori-arredamento", "automazioni-ai-business"]) {
    const text = read("src/" + page + ".njk");
    const entries = [...text.matchAll(/\{ highlight: "([^"]+)", question: "([^"]+)", answer: "([^"]+)"/g)];
    assert.ok(entries.length >= 2, page);
    for (const [, highlight, question, answer] of entries) {
      assert.ok(question.includes(highlight), page + ": meaningful highlight must occur in the question");
      assert.doesNotMatch(question + answer, /<[^>]+>/);
    }
  }
  const css = read("css/marketing-pages.css");
  assert.match(css, /\.faq-item summary::after\s*\{[^}]*border:\s*1px solid var\(--sx-blue\)[^}]*background:\s*transparent[^}]*color:\s*var\(--sx-blue\)/s);
});

test("header border, native anchor offset, swatch ring and card motion stay scoped", () => {
  const foundation = read("css/foundation.css"), css = read("css/marketing-pages.css");
  assert.match(read("css/site-shell.css"), /\.site-header\s*\{[^}]*border-bottom:\s*1px solid var\(--sx-border\)/s);
  assert.match(foundation, /scroll-padding-top:\s*0/);
  assert.match(foundation, /\[id\]\s*\{\s*scroll-margin-top:\s*var\(--sx-anchor-offset\)/);
  assert.doesNotMatch(shell, /scrollIntoView|hashchange/);
  const demo = read("css/configuratori-3d-2d.css");
  assert.match(demo, /\.background-options input:checked \+ \.texture__preview\s*\{\s*border-color:\s*var\(--sx-blue\);\s*\}/);
  assert.match(css, /a\.visual-card__inner:hover\s*\{\s*transform:\s*scale\(1\.025\)/);
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*a\.visual-card__inner:hover\s*\{\s*transform:\s*none/);
});

test("compact form fields align without empty error rows and retain a clear keyboard focus", () => {
  for (const [page, field] of [["configuratori-3d-2d", "mf-field"], ["contattaci", "form-field"]]) {
    const css = read("css/" + page + ".css");
    assert.match(css, new RegExp("\\." + field + "\\s*\\{\\s*display: grid;\\s*align-content: start;"));
    assert.match(css, /select:focus-visible\s*\{\s*outline: 3px solid var\(--sx-blue-deep\);\s*outline-offset: 3px/);
    assert.match(css, /\.submit-status\[hidden\]\s*\{\s*display: none/);
  }
  assert.match(read("css/contattaci.css"), /\.services-fallback\[hidden\],\s*\.submit-status\[hidden\]\s*\{\s*display: none/);
});
