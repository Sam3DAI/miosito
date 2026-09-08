import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const leadHelperCode = fs.readFileSync(path.join(root, "js", "netlify-lead-form.js"), "utf8");
const attributionCode = fs.readFileSync(path.join(root, "js", "ad-attribution-consent.js"), "utf8");
const contactPageCode = fs.readFileSync(path.join(root, "js", "contattaci.js"), "utf8");
const configuratorPageCode = fs.readFileSync(path.join(root, "js", "configuratori-3d-2d.js"), "utf8");
const servicePageCode = fs.readFileSync(path.join(root, "js", "service-demo-form.js"), "utf8");
// Independent identities from FORM_CONTRACT; not imported from implementation data.
const serviceProfiles = [
  ["ecommerce", "demo-configuratori-ecommerce", "ecommerce_page", "Configuratore e-commerce"],
  ["cpq", "demo-cpq-portali", "cpq_portali_page", "CPQ e portali commerciali"],
  ["planner", "demo-planner-arredamento", "planner_arredamento_page", "Planner e configuratore per arredamento"],
  ["automation", "demo-automazioni-ai", "automazioni_ai_page", "Automazioni AI per processi commerciali"]
].map(([key, formName, leadSource, service]) => Object.freeze({
  key, formName, leadSource, services: [service], serviceDemo: true,
  pii: { name: "SERVICE_NAME_SENTINEL", email: "service-pii@example.test", website: "https://reference.example.test", project_type: service, message: "SERVICE_MESSAGE_SENTINEL" }
}));

const profiles = Object.freeze([
  ...serviceProfiles,
  Object.freeze({
    key: "contact",
    formName: "contact-main",
    leadSource: "contattaci_page",
    services: ["Configuratore 2D/3D", "Automazioni AI"],
    pii: Object.freeze({
      name: "CONTACT_NAME_SENTINEL",
      email: "contact-pii@example.test",
      phone: "+39 000 111 222",
      message: "CONTACT_MESSAGE_SENTINEL"
    })
  }),
  Object.freeze({
    key: "configurator",
    formName: "mini-demo-configuratori",
    leadSource: "configuratori_3d",
    services: ["Configuratori Web 2D/3D"],
    pii: Object.freeze({
      name: "CONFIGURATOR_NAME_SENTINEL",
      email: "configurator-pii@example.test",
      website: "https://private-reference.example.test",
      project_type: "Configuratore CPQ",
      message: "CONFIGURATOR_MESSAGE_SENTINEL"
    })
  })
]);

class FakeStorage {
  constructor(initial = {}) {
    this.values = new Map(Object.entries(initial).map(([key, value]) => [String(key), String(value)]));
  }

  getItem(key) {
    return this.values.has(String(key)) ? this.values.get(String(key)) : null;
  }

  setItem(key, value) {
    this.values.set(String(key), String(value));
  }

  removeItem(key) {
    this.values.delete(String(key));
  }

  clear() {
    this.values.clear();
  }
}

class FakeClassList {
  constructor() {
    this.tokens = new Set();
  }

  add(...tokens) {
    tokens.forEach((token) => this.tokens.add(token));
  }

  remove(...tokens) {
    tokens.forEach((token) => this.tokens.delete(token));
  }

  contains(token) {
    return this.tokens.has(token);
  }

  toggle(token, force) {
    const enabled = force === undefined ? !this.tokens.has(token) : Boolean(force);
    if (enabled) this.tokens.add(token);
    else this.tokens.delete(token);
    return enabled;
  }
}

class FakeElement {
  constructor(tagName = "div", ownerDocument = null) {
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = ownerDocument;
    this.attributes = new Map();
    this.listeners = new Map();
    this.children = [];
    this.classList = new FakeClassList();
    this.dataset = {};
    this.style = {};
    this.hidden = false;
    this.disabled = false;
    this.required = false;
    this.checked = false;
    this.defaultChecked = false;
    this.value = "";
    this.defaultValue = "";
    this.name = "";
    this.type = "";
    this.id = "";
    this.textContent = "";
    this.innerHTML = "";
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  emit(type, overrides = {}) {
    const event = {
      type,
      target: this,
      key: "",
      shiftKey: false,
      defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true; },
      stopPropagation() {},
      ...overrides
    };
    const returns = (this.listeners.get(type) || []).map((listener) => listener(event));
    return { event, promise: Promise.all(returns.map((value) => Promise.resolve(value))) };
  }

  setAttribute(name, value = "") {
    const normalized = String(name);
    const stringValue = String(value);
    this.attributes.set(normalized, stringValue);
    if (normalized === "disabled") this.disabled = true;
    if (normalized === "hidden") this.hidden = true;
    if (normalized === "required") this.required = true;
    if (normalized === "name") this.name = stringValue;
    if (normalized === "id") this.id = stringValue;
    if (normalized.startsWith("data-")) {
      const key = normalized.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      this.dataset[key] = stringValue;
    }
  }

  getAttribute(name) {
    return this.attributes.has(String(name)) ? this.attributes.get(String(name)) : null;
  }

  hasAttribute(name) {
    return this.attributes.has(String(name));
  }

  removeAttribute(name) {
    const normalized = String(name);
    this.attributes.delete(normalized);
    if (normalized === "disabled") this.disabled = false;
    if (normalized === "hidden") this.hidden = false;
    if (normalized === "required") this.required = false;
    if (normalized.startsWith("data-")) {
      const key = normalized.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      delete this.dataset[key];
    }
  }

  appendChild(child) {
    child.ownerDocument ||= this.ownerDocument;
    this.children.push(child);
    return child;
  }

  append(...children) {
    children.forEach((child) => this.appendChild(child));
  }

  prepend(child) {
    child.ownerDocument ||= this.ownerDocument;
    this.children.unshift(child);
  }

  after() {}

  querySelector() {
    return null;
  }

  querySelectorAll() {
    return [];
  }

  contains(element) {
    return element === this || this.children.some((child) => child.contains?.(element));
  }

  focus() {
    if (this.ownerDocument) this.ownerDocument.activeElement = this;
  }

  blur() {
    if (this.ownerDocument?.activeElement === this) this.ownerDocument.activeElement = this.ownerDocument.body;
  }

  getClientRects() {
    return [{}];
  }
}

class FakeHTMLFormElement extends FakeElement {
  constructor(ownerDocument) {
    super("form", ownerDocument);
    this.controls = [];
    this.noValidate = false;
    this.resetCount = 0;
  }

  addControl(control) {
    control.ownerDocument = this.ownerDocument;
    this.controls.push(control);
    this.children.push(control);
    this.ownerDocument?.register(control);
    return control;
  }

  prepend(control) {
    control.ownerDocument = this.ownerDocument;
    this.controls.unshift(control);
    this.children.unshift(control);
    this.ownerDocument?.register(control);
  }

  querySelector(selector) {
    if (selector === 'input[type="hidden"][name="lead_id"]') {
      return this.controls.find((control) => control.type === "hidden" && control.name === "lead_id") || null;
    }
    if (selector === '[type="submit"]') {
      return this.controls.find((control) => control.type === "submit") || null;
    }
    const named = selector.match(/^\[name="([^"]+)"\]$/);
    if (named) return this.controls.find((control) => control.name === named[1]) || null;
    return null;
  }

  querySelectorAll(selector) {
    if (selector === 'input[type="checkbox"][name="services[]"]') {
      return this.controls.filter((control) => control.type === "checkbox" && control.name === "services[]");
    }
    if (selector === 'input[name="services[]"]:checked') {
      return this.controls.filter((control) => control.name === "services[]" && control.checked);
    }
    return [];
  }

  reset() {
    this.resetCount += 1;
    for (const control of this.controls) {
      if (control.type === "checkbox" || control.type === "radio") control.checked = control.defaultChecked;
      else control.value = control.defaultValue;
    }
  }
}

class FakeFormData {
  constructor(form) {
    this.entries = [];
    for (const control of form.controls) {
      if (!control.name || control.disabled || ["submit", "button", "reset", "file"].includes(control.type)) continue;
      if (["checkbox", "radio"].includes(control.type) && !control.checked) continue;
      if (control.multiple && Array.isArray(control.selectedValues)) {
        control.selectedValues.forEach((value) => this.append(control.name, value));
      } else {
        this.append(control.name, control.value);
      }
    }
  }

  append(key, value) {
    this.entries.push([String(key), String(value)]);
  }

  set(key, value) {
    const normalized = String(key);
    this.entries = this.entries.filter(([entryKey]) => entryKey !== normalized);
    this.append(normalized, value);
  }

  forEach(callback) {
    this.entries.forEach(([key, value]) => callback(value, key, this));
  }
}

class FakeDocument {
  constructor() {
    this.elementsById = new Map();
    this.forms = [];
    this.listeners = new Map();
    this.selectorMap = new Map();
    this.documentElement = new FakeElement("html", this);
    this.body = new FakeElement("body", this);
    this.head = new FakeElement("head", this);
    this.activeElement = this.body;
  }

  register(element) {
    element.ownerDocument = this;
    if (element.id) this.elementsById.set(element.id, element);
    if (element instanceof FakeHTMLFormElement && !this.forms.includes(element)) this.forms.push(element);
    return element;
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  fire(type) {
    return (this.listeners.get(type) || []).map((listener) => listener({ type, target: this }));
  }

  getElementById(id) {
    return this.elementsById.get(String(id)) || null;
  }

  querySelector(selector) {
    return this.selectorMap.get(selector) || null;
  }

  querySelectorAll(selector) {
    const clickId = selector.match(/^input\[type="hidden"\]\[name="(gclid|gbraid|wbraid)"\]$/);
    if (clickId) {
      return this.forms.flatMap((form) => form.controls.filter((control) => control.type === "hidden" && control.name === clickId[1]));
    }
    return [];
  }

  createElement(tagName) {
    return new FakeElement(tagName, this);
  }

  contains(element) {
    return Boolean(element?.ownerDocument === this);
  }
}

function makeControl(document, { tag = "input", id = "", name = "", type = "text", value = "", checked = false } = {}) {
  const control = new FakeElement(tag, document);
  control.id = id;
  control.name = name;
  control.type = type;
  control.value = String(value);
  control.defaultValue = String(value);
  control.checked = Boolean(checked);
  control.defaultChecked = Boolean(checked);
  document.register(control);
  return control;
}

function addControl(form, options) {
  return form.addControl(makeControl(form.ownerDocument, options));
}

function makeRuntimeForm(document, profile) {
  const form = document.register(new FakeHTMLFormElement(document));
  form.id = profile.key === "contact" ? "contact-form" : "mini-form";
  form.setAttribute("name", profile.formName);
  document.register(form);

  addControl(form, { name: "form-name", type: "hidden", value: profile.formName });
  addControl(form, { name: "lead_source", type: "hidden", value: profile.leadSource });
  const leadId = addControl(form, { name: "lead_id", type: "hidden", value: "" });
  const clickFields = Object.fromEntries(["gclid", "gbraid", "wbraid"].map((name) => [name, addControl(form, { name, type: "hidden", value: "" })]));
  addControl(form, { name: "_honey", type: "text", value: "" });

  for (const [name, value] of Object.entries(profile.pii)) {
    const tag = name === "message" ? "textarea" : (name === "project_type" ? "select" : "input");
    addControl(form, { tag, name, type: tag === "input" ? "text" : tag, value });
  }

  profile.services.forEach((value, index) => {
    if (profile.key === "contact") addControl(form, { name: "services[]", type: "checkbox", value, checked: index < 2 });
    else addControl(form, { name: "services[]", type: "hidden", value });
  });
  addControl(form, { name: "privacy", type: "checkbox", value: "on", checked: true });
  const submitButton = addControl(form, { tag: "button", type: "submit" });
  const statusElement = makeControl(document, { tag: "p", id: `${profile.key}-status` });
  return { form, leadId, clickFields, submitButton, statusElement };
}

function nextUuidFactory() {
  let counter = 0;
  return () => {
    counter += 1;
    return `00000000-0000-4000-8000-${counter.toString(16).padStart(12, "0")}`;
  };
}

function createRuntimeEnvironment(profile, { fetchImpl, onLine = true, search = "" } = {}) {
  const document = new FakeDocument();
  const runtimeForm = makeRuntimeForm(document, profile);
  const sessionStorage = new FakeStorage();
  const localStorage = new FakeStorage();
  const fetchCalls = [];
  const successCalls = [];
  const errorCalls = [];
  const hookCalls = { persist: 0, clear: 0 };

  const window = {
    document,
    navigator: { onLine, userAgent: "node-runtime-test" },
    sessionStorage,
    localStorage,
    location: { search, pathname: "/", href: `https://local.invalid/${search}` },
    crypto: { randomUUID: nextUuidFactory() },
    dataLayer: [],
    fetch: (...args) => {
      assert.equal(args[0], "/", "runtime test blocks every non-local submission target");
      fetchCalls.push({ url: args[0], options: args[1] });
      return (fetchImpl || (async () => ({ ok: true, status: 200 })))(...args);
    },
    __adsConsentGranted: false,
    __persistAdParams() { hookCalls.persist += 1; },
    __clearAdParams() { hookCalls.clear += 1; }
  };
  window.window = window;

  const context = vm.createContext({
    window,
    document,
    navigator: window.navigator,
    location: window.location,
    sessionStorage,
    localStorage,
    HTMLFormElement: FakeHTMLFormElement,
    FormData: FakeFormData,
    URL,
    URLSearchParams,
    Uint8Array,
    console,
    setTimeout,
    clearTimeout
  });
  vm.runInContext(leadHelperCode, context, { filename: "js/netlify-lead-form.js" });

  function bind(validate = () => true) {
    window.SolveXNetlifyLead.bind({
      form: runtimeForm.form,
      formName: profile.formName,
      leadSource: profile.leadSource,
      validate,
      statusElement: runtimeForm.statusElement,
      onSuccess: (details) => successCalls.push(details),
      onError: (details) => errorCalls.push(details)
    });
  }

  return {
    profile,
    document,
    window,
    context,
    sessionStorage,
    localStorage,
    fetchCalls,
    successCalls,
    errorCalls,
    hookCalls,
    ...runtimeForm,
    bind,
    evaluateAttribution() {
      vm.runInContext(attributionCode, context, { filename: "js/ad-attribution-consent.js" });
    }
  };
}

function parseRequestBody(call) {
  return new URLSearchParams(call.options.body);
}

function createServiceAdapterEnvironment(profile, options) {
  const env = createRuntimeEnvironment(profile, options);
  env.form.id = "service-demo-form";
  env.document.register(env.form);
  env.statusElement.id = "service-demo-status";
  env.document.register(env.statusElement);
  env.success = registerPageElement(env.document, "service-demo-success");
  env.success.hidden = true;
  for (const name of ["name", "email", "website", "message", "privacy"]) {
    const field = env.form.querySelector('[name="' + name + '"]');
    field.id = "sd-" + name;
    field.required = name !== "website";
    if (name === "email" || name === "website") field.type = name === "email" ? "email" : "url";
    // Only the DOM validity surface is simulated here; native constraints are
    // verified separately with real browser forms and a loopback POST sink.
    Object.defineProperty(field, "validity", { get() {
      let valid = !field.required || (field.type === "checkbox" ? field.checked : Boolean(field.value));
      if (field.type === "email" && field.value) valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value);
      if (field.type === "url" && field.value) { try { new URL(field.value); } catch { valid = false; } }
      return { valid };
    } });
    if (name === "privacy") field.defaultChecked = false;
    env.document.register(field);
    registerPageElement(env.document, "sd-" + name + "-error");
  }
  env.runAdapter = () => vm.runInContext(servicePageCode, env.context, { filename: "js/service-demo-form.js" });
  return env;
}

for (const profile of serviceProfiles) {
  test(profile.formName + ": real adapter binds once, validates and delegates to the real helper", async () => {
    const env = createServiceAdapterEnvironment(profile);
    assert.equal(env.form.noValidate, false);
    env.runAdapter();
    env.runAdapter();
    assert.equal(env.form.noValidate, true);
    assert.equal(env.form.listeners.get("submit").length, 1);
    for (const [name, value] of [["name", ""], ["email", "invalid"], ["website", "invalid"], ["message", "  "], ["privacy", false]]) {
      const field = env.form.querySelector('[name="' + name + '"]');
      const previous = name === "privacy" ? field.checked : field.value;
      if (name === "privacy") field.checked = value; else field.value = value;
      await env.form.emit("submit").promise;
      assert.equal(env.fetchCalls.length, 0, name + " must block transport");
      assert.equal(field.getAttribute("aria-invalid"), "true");
      assert.equal(env.document.activeElement, field);
      if (name === "privacy") field.checked = previous; else field.value = previous;
    }
    const firstId = env.leadId.value;
    await env.form.emit("submit").promise;
    assert.equal(env.fetchCalls.length, 1);
    assert.equal(env.window.dataLayer.length, 1);
    assert.equal(env.success.hidden, false);
    assert.equal(env.document.activeElement, env.success);
    assert.notEqual(env.leadId.value, firstId);
    assert.equal(env.form.querySelector('[name="privacy"]').checked, false);
    assert.equal(env.form.querySelector('[name="services[]"]').value, profile.services[0]);
    assert.equal(env.form.querySelector('[name="project_type"]').value, profile.pii.project_type);
    env.form.querySelector('[name="privacy"]').checked = true;
    await env.form.emit("submit").promise;
    assert.equal(env.fetchCalls.length, 2);
    assert.notEqual(parseRequestBody(env.fetchCalls[1]).get("lead_id"), firstId);
  });

  test(profile.formName + ": unknown names and origins never bind", () => {
    for (const change of ["name", "source", "hidden-name"]) {
      const env = createServiceAdapterEnvironment(profile);
      if (change === "name") env.form.setAttribute("name", "unknown-demo");
      if (change === "source") env.form.querySelector('[name="lead_source"]').value = "unknown-source";
      if (change === "hidden-name") env.form.querySelector('[name="form-name"]').value = "unknown-demo";
      env.runAdapter();
      assert.equal(env.form.noValidate, false);
      assert.equal(env.form.listeners.has("submit"), false);
      assert.equal(env.fetchCalls.length, 0);
    }
    const env = createRuntimeEnvironment(profile);
    assert.throws(() => env.window.SolveXNetlifyLead.bind({
      form: env.form, formName: profile.formName, leadSource: "unknown-source", validate: () => true
    }), /Invalid/);
    assert.throws(() => env.window.SolveXNetlifyLead.bind({
      form: env.form, formName: "unknown-demo", leadSource: profile.leadSource, validate: () => true
    }), /Invalid/);
  });
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function registerPageElement(document, id, options = {}) {
  const element = makeControl(document, { ...options, id });
  document.register(element);
  return element;
}

function createPageBindingEnvironment(kind) {
  const document = new FakeDocument();
  const localStorage = new FakeStorage();
  const sessionStorage = new FakeStorage();
  const bindings = [];
  const dialogs = [];
  const form = document.register(new FakeHTMLFormElement(document));
  const submitButton = addControl(form, { tag: "button", type: "submit" });

  const leadApi = {
    createDialog(options) {
      dialogs.push(options);
      return Object.freeze({ open() {}, close() {} });
    },
    bind(options) {
      bindings.push(options);
      options.form.dataset.solvexLeadBound = "1";
      options.form.noValidate = true;
    }
  };

  if (kind === "contact") {
    form.id = "contact-form";
    form.setAttribute("name", "contact-main");
    document.register(form);
    const name = addControl(form, { id: "name", name: "name", value: "" });
    const email = addControl(form, { id: "email", name: "email", value: "" });
    const phone = addControl(form, { id: "phone", name: "phone", value: "" });
    const message = addControl(form, { tag: "textarea", id: "message", name: "message", value: "" });
    const privacy = addControl(form, { id: "privacy", name: "privacy", type: "checkbox", value: "on", checked: false });
    const serviceCheckboxes = profiles[0].services.concat([
      "Software CPQ e preventivazione",
      "Portale commerciale o area B2B",
      "Planner o configuratore per arredamento",
      "Altro software o portale B2B",
      "Da definire",
      "Configuratore e-commerce"
    ]).map((value) => addControl(form, { name: "services[]", type: "checkbox", value, checked: false }));

    const servicesCheckboxGroup = registerPageElement(document, "services-checkbox-group", { tag: "fieldset" });
    servicesCheckboxGroup.hidden = true;
    const servicesFallback = registerPageElement(document, "services-fallback");
    const servicesFallbackSelect = addControl(form, { tag: "select", id: "services-fallback-select", name: "services[]" });
    servicesFallbackSelect.required = true;
    document.register(servicesFallbackSelect);

    for (const id of ["name-error", "email-error", "phone-error", "message-error", "services-error", "privacy-error", "contact-submit-status"]) {
      registerPageElement(document, id, { tag: id.includes("status") ? "p" : "span" });
    }
    registerPageElement(document, "thank-you-modal");
    registerPageElement(document, "thank-you-title", { tag: "h2" });
    registerPageElement(document, "close-modal", { tag: "button" });

    document.selectorMap.set("header", new FakeElement("header", document));
    document.selectorMap.set(".theme-toggle", new FakeElement("button", document));

    return {
      document,
      localStorage,
      sessionStorage,
      bindings,
      dialogs,
      form,
      submitButton,
      fields: { name, email, phone, message, privacy },
      serviceCheckboxes,
      servicesCheckboxGroup,
      servicesFallback,
      servicesFallbackSelect,
      leadApi,
      code: contactPageCode,
      filename: "js/contattaci.js"
    };
  }

  form.id = "mini-form";
  form.setAttribute("name", "mini-demo-configuratori");
  document.register(form);
  const name = addControl(form, { id: "mf_name", name: "name", value: "" });
  const email = addControl(form, { id: "mf_email", name: "email", value: "" });
  const projectType = addControl(form, { tag: "select", id: "mf_project_type", name: "project_type", type: "select", value: "" });
  const message = addControl(form, { tag: "textarea", id: "mf_msg", name: "message", type: "textarea", value: "" });
  const privacy = addControl(form, { id: "mf_privacy", name: "privacy", type: "checkbox", value: "on", checked: false });
  for (const id of ["mf_name_err", "mf_email_err", "mf_project_type_err", "mf_msg_err", "mf_privacy_err", "mini-submit-status"]) {
    registerPageElement(document, id, { tag: id.includes("status") ? "p" : "span" });
  }
  registerPageElement(document, "thank-you-modal-mini");
  registerPageElement(document, "thank-you-title-mini", { tag: "h2" });
  registerPageElement(document, "close-mini-modal", { tag: "button" });
  document.selectorMap.set("header", new FakeElement("header", document));
  document.selectorMap.set(".theme-toggle", new FakeElement("button", document));

  return {
    document,
    localStorage,
    sessionStorage,
    bindings,
    dialogs,
    form,
    submitButton,
    fields: { name, email, projectType, message, privacy },
    leadApi,
    code: configuratorPageCode,
    filename: "js/configuratori-3d-2d.js"
  };
}

function evaluatePageBinding(kind) {
  const page = createPageBindingEnvironment(kind);
  const media = { matches: false, addEventListener() {} };
  const location = { pathname: kind === "contact" ? "/contattaci" : "/configuratori-3d-2d", search: "", href: "https://local.invalid/" };
  const navigator = { userAgent: "node-runtime-test", onLine: true };
  const window = {
    document: page.document,
    localStorage: page.localStorage,
    sessionStorage: page.sessionStorage,
    location,
    navigator,
    SolveXNetlifyLead: page.leadApi,
    matchMedia: () => media,
    addEventListener() {},
    scrollY: 0,
    innerWidth: 1440
  };
  window.window = window;
  const context = vm.createContext({
    window,
    document: page.document,
    localStorage: page.localStorage,
    sessionStorage: page.sessionStorage,
    location,
    navigator,
    URL,
    URLSearchParams,
    console,
    alert() {},
    setTimeout,
    clearTimeout,
    requestAnimationFrame: (callback) => setTimeout(callback, 0),
    cancelAnimationFrame: clearTimeout
  });
  vm.runInContext(page.code, context, { filename: page.filename });
  page.document.fire("DOMContentLoaded");
  return { ...page, window, context };
}

function setValidContactFields(page) {
  page.fields.name.value = "Ada Lovelace";
  page.fields.email.value = "ada@example.test";
  page.fields.phone.value = "";
  page.fields.message.value = "Un progetto B2B da valutare";
  page.fields.privacy.checked = true;
  page.serviceCheckboxes.forEach((field, index) => { field.checked = index === 0; });
}

function setValidConfiguratorFields(page) {
  page.fields.name.value = "Ada Lovelace";
  page.fields.email.value = "ada@example.test";
  page.fields.projectType.value = "Configuratore CPQ";
  page.fields.message.value = "Configuratore con regole prodotto";
  page.fields.privacy.checked = true;
}

for (const profile of profiles) {
  test(`${profile.formName}: invalid validation never starts a request`, async () => {
    const env = createRuntimeEnvironment(profile);
    env.bind(() => false);

    const submission = env.form.emit("submit");
    await submission.promise;

    assert.equal(submission.event.defaultPrevented, true);
    assert.equal(env.fetchCalls.length, 0);
    assert.equal(env.window.dataLayer.length, 0);
    assert.equal(env.form.dataset.deliveryState, "IDLE");
    assert.equal(env.form.resetCount, 0);
  });

  test(`${profile.formName}: offline state never starts a request`, async () => {
    const env = createRuntimeEnvironment(profile, { onLine: false });
    env.bind();

    const submission = env.form.emit("submit");
    await submission.promise;

    assert.equal(env.fetchCalls.length, 0);
    assert.equal(env.window.dataLayer.length, 0);
    assert.equal(env.form.dataset.deliveryState, "OFFLINE");
    assert.equal(env.form.resetCount, 0);
    assert.match(env.statusElement.textContent, /offline/i);
  });

  test(`${profile.formName}: verified 200 emits one four-key PII-free event`, async () => {
    const env = createRuntimeEnvironment(profile);
    env.bind();
    const submittedLeadId = env.leadId.value;

    const submission = env.form.emit("submit");
    await submission.promise;

    assert.equal(env.fetchCalls.length, 1);
    const call = env.fetchCalls[0];
    assert.deepEqual({
      url: call.url,
      method: call.options.method,
      contentType: call.options.headers["Content-Type"],
      credentials: call.options.credentials,
      redirect: call.options.redirect
    }, {
      url: "/",
      method: "POST",
      contentType: "application/x-www-form-urlencoded",
      credentials: "same-origin",
      redirect: "error"
    });

    const body = parseRequestBody(call);
    assert.deepEqual(body.getAll("form-name"), [profile.formName]);
    assert.deepEqual(body.getAll("lead_source"), [profile.leadSource]);
    assert.deepEqual(body.getAll("lead_id"), [submittedLeadId]);
    assert.deepEqual(body.getAll("services[]"), profile.services);
    for (const [name, value] of Object.entries(profile.pii)) assert.equal(body.get(name), value);

    const leadEvents = env.window.dataLayer.filter((entry) => entry?.event === "solvex_lead_success");
    assert.equal(leadEvents.length, 1);
    assert.deepEqual(Object.keys(leadEvents[0]).sort(), ["event", "form_name", "lead_id", "lead_source"]);
    assert.equal(leadEvents[0].lead_id, submittedLeadId);
    assert.equal(leadEvents[0].form_name, profile.formName);
    assert.equal(leadEvents[0].lead_source, profile.leadSource);
    const eventJson = JSON.stringify(leadEvents[0]);
    for (const sentinel of Object.values(profile.pii).concat(profile.services)) assert.equal(eventJson.includes(sentinel), false, `PII leaked into dataLayer: ${sentinel}`);

    assert.equal(env.form.dataset.deliveryState, "SUCCEEDED");
    assert.equal(env.form.resetCount, 1);
    assert.equal(env.successCalls.length, 1);
    assert.equal(env.errorCalls.length, 0);
    assert.notEqual(env.leadId.value, submittedLeadId);
    assert.equal(env.hookCalls.clear, 1);
    assert.equal(env.submitButton.disabled, false);
    assert.equal(env.form.hasAttribute("aria-busy"), false);
    if (profile.serviceDemo) {
      assert.equal(env.form.querySelector('[name="services[]"]').value, profile.services[0]);
      assert.equal(env.form.querySelector('[name="project_type"]').value, profile.pii.project_type);
    }
  });

  test(`${profile.formName}: HTTP 500 emits no event and preserves the lead id`, async () => {
    const env = createRuntimeEnvironment(profile, { fetchImpl: async () => ({ ok: false, status: 500 }) });
    env.bind();
    const submittedLeadId = env.leadId.value;

    const submission = env.form.emit("submit");
    await submission.promise;

    assert.equal(env.fetchCalls.length, 1);
    assert.equal(env.window.dataLayer.length, 0);
    assert.equal(env.form.dataset.deliveryState, "HTTP_ERROR");
    assert.equal(env.leadId.value, submittedLeadId);
    assert.equal(env.form.resetCount, 0);
    assert.equal(env.successCalls.length, 0);
    assert.equal(env.errorCalls.length, 1);
    assert.equal(env.errorCalls[0].state, "HTTP_ERROR");
    assert.match(env.statusElement.textContent, /non è stata accettata/i);
  });

  test(`${profile.formName}: network loss has no automatic retry; explicit retry reuses the lead id`, async () => {
    const retryResponse = deferred();
    let attempt = 0;
    const env = createRuntimeEnvironment(profile, {
      fetchImpl: () => {
        attempt += 1;
        if (attempt === 1) return Promise.reject(new TypeError("synthetic response loss"));
        return retryResponse.promise;
      }
    });
    env.bind();
    const submittedLeadId = env.leadId.value;

    const firstSubmission = env.form.emit("submit");
    await firstSubmission.promise;
    assert.equal(env.fetchCalls.length, 1, "response loss must not auto-retry");
    assert.equal(env.form.dataset.deliveryState, "DELIVERY_UNKNOWN");
    assert.equal(env.window.dataLayer.length, 0);
    assert.equal(env.leadId.value, submittedLeadId);
    assert.equal(env.errorCalls[0].state, "DELIVERY_UNKNOWN");
    assert.match(env.statusElement.textContent, /potrebbe essere stata ricevuta/i);

    const retrySubmission = env.form.emit("submit");
    assert.equal(env.fetchCalls.length, 2);
    assert.equal(env.form.dataset.deliveryState, "MANUAL_RETRY");
    assert.equal(parseRequestBody(env.fetchCalls[1]).get("lead_id"), submittedLeadId);
    retryResponse.resolve({ ok: true, status: 200 });
    await retrySubmission.promise;

    assert.equal(env.form.dataset.deliveryState, "SUCCEEDED");
    assert.equal(env.window.dataLayer.filter((entry) => entry?.event === "solvex_lead_success").length, 1);
    assert.equal(env.form.resetCount, 1);
  });

  test(`${profile.formName}: double submit while pending produces one request`, async () => {
    const response = deferred();
    const env = createRuntimeEnvironment(profile, { fetchImpl: () => response.promise });
    env.bind();

    const firstSubmission = env.form.emit("submit");
    const secondSubmission = env.form.emit("submit");
    await secondSubmission.promise;
    assert.equal(env.fetchCalls.length, 1);
    assert.equal(env.submitButton.disabled, true);
    assert.equal(env.form.getAttribute("aria-busy"), "true");

    response.resolve({ ok: true, status: 200 });
    await firstSubmission.promise;
    assert.equal(env.fetchCalls.length, 1);
    assert.equal(env.form.resetCount, 1);
    assert.equal(env.window.dataLayer.filter((entry) => entry?.event === "solvex_lead_success").length, 1);
  });
}

for (const profile of profiles) {
  test(`${profile.formName}: Marketing consent persists click IDs and includes them once`, async () => {
    const env = createRuntimeEnvironment(profile, { search: "?gclid=G-CLICK&gbraid=B-CLICK&wbraid=W-CLICK" });
    env.evaluateAttribution();
    env.window.__adsConsentGranted = true;
    env.window.__persistAdParams();
    env.bind();

    const submission = env.form.emit("submit");
    await submission.promise;
    const body = parseRequestBody(env.fetchCalls[0]);
    assert.deepEqual(body.getAll("gclid"), ["G-CLICK"]);
    assert.deepEqual(body.getAll("gbraid"), ["B-CLICK"]);
    assert.deepEqual(body.getAll("wbraid"), ["W-CLICK"]);
    for (const [name, expected] of [["gclid", "G-CLICK"], ["gbraid", "B-CLICK"], ["wbraid", "W-CLICK"]]) {
      assert.equal(env.sessionStorage.getItem(name), expected);
      assert.equal(env.clickFields[name].value, expected, `${name} must be restored after the success reset`);
    }
  });

  test(`${profile.formName}: denied Marketing consent clears click IDs before submission`, async () => {
    const env = createRuntimeEnvironment(profile, { search: "?gclid=G-URL&gbraid=B-URL&wbraid=W-URL" });
    env.evaluateAttribution();
    for (const name of ["gclid", "gbraid", "wbraid"]) {
      env.sessionStorage.setItem(name, `${name}-SESSION-LEAK`);
      env.localStorage.setItem(name, `${name}-LOCAL-LEAK`);
      env.clickFields[name].value = `${name}-FIELD-LEAK`;
    }
    env.window.__adsConsentGranted = false;
    env.window.__persistAdParams();
    env.bind();

    const submission = env.form.emit("submit");
    await submission.promise;
    const body = parseRequestBody(env.fetchCalls[0]);
    for (const name of ["gclid", "gbraid", "wbraid"]) {
      assert.deepEqual(body.getAll(name), [""]);
      assert.equal(env.sessionStorage.getItem(name), null);
      assert.equal(env.localStorage.getItem(name), null);
      assert.equal(env.clickFields[name].value, "");
    }
  });
}

test("contattaci.js binds the exact contract and validates the enhanced multi-select", () => {
  const page = evaluatePageBinding("contact");
  assert.equal(page.bindings.length, 1);
  assert.equal(page.dialogs.length, 1);
  const binding = page.bindings[0];
  assert.equal(binding.form, page.form);
  assert.equal(binding.formName, "contact-main");
  assert.equal(binding.leadSource, "contattaci_page");
  assert.equal(typeof binding.validate, "function");
  assert.equal(page.servicesCheckboxGroup.hidden, false);
  assert.equal(page.servicesFallback.hidden, true);
  assert.equal(page.servicesFallbackSelect.disabled, true);
  assert.equal(page.servicesFallbackSelect.required, false);

  assert.equal(binding.validate(), false, "empty form must be invalid");
  setValidContactFields(page);
  assert.equal(binding.validate(), true);

  page.serviceCheckboxes.forEach((field) => { field.checked = false; });
  assert.equal(binding.validate(), false, "zero services must be invalid");
  page.serviceCheckboxes[0].checked = true;
  page.serviceCheckboxes[1].checked = true;
  assert.equal(binding.validate(), true, "multiple services must remain valid");

  page.fields.email.value = "not-an-email";
  assert.equal(binding.validate(), false);
  setValidContactFields(page);
  page.fields.phone.value = "12";
  assert.equal(binding.validate(), false);
  setValidContactFields(page);
  page.fields.privacy.checked = false;
  assert.equal(binding.validate(), false);
});
test("configuratori-3d-2d.js binds the exact mini-form contract and validates required fields", () => {
  const page = evaluatePageBinding("configurator");
  assert.equal(page.bindings.length, 1);
  assert.equal(page.dialogs.length, 1);
  const binding = page.bindings[0];
  assert.equal(binding.form, page.form);
  assert.equal(binding.formName, "mini-demo-configuratori");
  assert.equal(binding.leadSource, "configuratori_3d");
  assert.equal(typeof binding.validate, "function");
  assert.equal(binding.validate(), false, "empty mini-form must be invalid");

  setValidConfiguratorFields(page);
  assert.equal(binding.validate(), true);
  for (const [key, invalid] of [["name", ""], ["email", "invalid"], ["projectType", ""], ["message", ""]]) {
    setValidConfiguratorFields(page);
    page.fields[key].value = invalid;
    assert.equal(binding.validate(), false, `${key} must remain required/valid`);
  }
  setValidConfiguratorFields(page);
  page.fields.privacy.checked = false;
  assert.equal(binding.validate(), false, "privacy consent must remain required");
});

test("contact template keeps the deterministic no-JS fallback and one eight-option source", () => {
  const template = fs.readFileSync(path.join(root, "src", "contattaci.njk"), "utf8");
  const optionsBlock = template.match(/{% set serviceOptions = \[([\s\S]*?)\] %}/);
  assert.ok(optionsBlock, "serviceOptions must remain explicit in the contact template");
  const actualOptions = [...optionsBlock[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(actualOptions, [
    "Configuratore 2D/3D",
    "Configuratore e-commerce",
    "Software CPQ e preventivazione",
    "Portale commerciale o area B2B",
    "Planner o configuratore per arredamento",
    "Automazioni AI",
    "Altro software o portale B2B",
    "Da definire"
  ]);
  assert.equal((template.match(/{% for option in serviceOptions %}/g) || []).length, 2, "JS and no-JS controls must share one option source");
  assert.match(template, /<fieldset id="services-checkbox-group"[^>]*\shidden(?:\s|>)/);
  const fallbackOpenTag = template.match(/<select id="services-fallback-select"[^>]*>/)?.[0] || "";
  assert.match(fallbackOpenTag, /\brequired\b/);
  assert.doesNotMatch(fallbackOpenTag, /\bdisabled\b/);
  assert.match(template, /<form id="contact-form"[\s\S]*?name="contact-main"[\s\S]*?method="POST"[\s\S]*?data-netlify="true"/);
});
