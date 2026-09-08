(function () {
  "use strict";
  // Explicit page identities only. Transport, IDs, consent and retries belong
  // exclusively to the existing shared helper.
  const sources = Object.freeze({
    "demo-configuratori-ecommerce": "ecommerce_page",
    "demo-cpq-portali": "cpq_portali_page",
    "demo-planner-arredamento": "planner_arredamento_page",
    "demo-automazioni-ai": "automazioni_ai_page"
  });
  const form = document.getElementById("service-demo-form");
  const helper = window.SolveXNetlifyLead;
  if (!form || !helper || typeof helper.bind !== "function") return;
  const formName = form.getAttribute("name");
  if (!Object.hasOwn(sources, formName)) return;
  const leadSource = sources[formName];
  if (form.querySelector('[name="lead_source"]').value !== leadSource ||
      form.querySelector('[name="form-name"]').value !== formName) return;
  const success = document.getElementById("service-demo-success");
  const fields = ["name", "email", "website", "message", "privacy"].map(function (name) {
    return {
      field: document.getElementById("sd-" + name),
      error: document.getElementById("sd-" + name + "-error"),
      message: {
        name: "Inserisci nome e cognome.",
        email: "Inserisci un indirizzo email valido.",
        website: "Inserisci un URL completo, per esempio https://esempio.it.",
        message: "Descrivi il tuo obiettivo.",
        privacy: "Per inviare la richiesta, accetta la Privacy Policy."
      }[name]
    };
  });
  function validate() {
    success.hidden = true;
    let firstInvalid = null;
    fields.forEach(function (entry) {
      const field = entry.field;
      const valid = field.validity.valid &&
        (!field.required || (field.type === "checkbox" ? field.checked : Boolean(field.value.trim())));
      field.setAttribute("aria-invalid", String(!valid));
      entry.error.textContent = valid ? "" : entry.message;
      if (!valid && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }
  helper.bind({
    form,
    formName,
    leadSource,
    validate,
    statusElement: document.getElementById("service-demo-status"),
    onSuccess: function () {
      fields.forEach(function (entry) {
        entry.field.setAttribute("aria-invalid", "false");
        entry.error.textContent = "";
      });
      success.hidden = false;
      success.focus();
    }
  });
})();
