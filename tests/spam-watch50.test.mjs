import assert from "node:assert/strict";
import test from "node:test";
import spamWatch, {
  OWNER_MAIL, QA_RECORD, QA_FORM, WatchError, config, readConfig, minimizeRecords,
  createBlobStateStore, collectStableMetadata, notification, runWatch, createProvider
} from "../netlify/functions/spam-watch50.mjs";

const NOW = Date.parse("2026-10-12T12:30:00.000Z");
const SITE = "c9b5c607-1d8c-480a-ad77-756de5927f7c";
const HOST = "solvex-ai3d-measurement-staging.netlify.app";
const DATE = "2026-10-09T09:00:00.000Z";
const context = () => ({ site: { id: SITE, url: `https://${HOST}` },
  deploy: { id: "fixture-deploy50", context: "branch-deploy", published: false } });
const environment = () => ({ SPAM_WATCH_ENABLED: "true", SPAM_WATCH_MODE: "qa",
  SPAM_WATCH_SITE_ID: SITE, SPAM_WATCH_APPROVED_COMMIT: "a".repeat(40),
  SPAM_WATCH_CONTEXT: "branch-deploy", SPAM_WATCH_QA_UNTIL: "2026-10-12T13:00:00.000Z",
  SPAM_WATCH_QA_MARKER: "QA50-LOCAL-FIXTURE", SPAM_WATCH_ZOHO_REGION: "eu",
  SPAM_WATCH_ZOHO_ACCOUNT_ID: "123456789", SPAM_WATCH_TECHNICAL_RETENTION_DAYS: "30",
  SPAM_WATCH_CATCHUP_FROM: "2026-10-09T00:00:00.000Z", SPAM_WATCH_BLOBS_REGION: "eu-central-1",
  SPAM_WATCH_QUOTA_REVIEWED: "true", SPAM_WATCH_ACCESS_APPROVED: "true", SPAM_WATCH_SEND_ENABLED: "true",
  SPAM_WATCH_NETLIFY_TOKEN: "local-fixture-no-token", SPAM_WATCH_ZOHO_CLIENT_ID: "local-fixture-client",
  SPAM_WATCH_ZOHO_CLIENT_SECRET: "local-fixture-secret", SPAM_WATCH_ZOHO_REFRESH_TOKEN: "local-fixture-refresh" });
const qa = () => readConfig(environment(), context(), NOW);
const production = () => ({ ...qa(), mode: "production", siteId: "production-fixture", binding: "production-fixture-binding" });
const row = (id = "id1", createdAt = DATE) => ({ id, createdAt });
const rawQa = () => ({ id: QA_RECORD, form_id: QA_FORM, created_at: DATE, site_url: `https://${HOST}`,
  body: "FORBIDDEN_BODY", email: "forbidden@example.test", data: { name: "FORBIDDEN_NAME", phone: "FORBIDDEN_PHONE", gclid: "FORBIDDEN_CLICK" } });

function memory() {
  let value = null;
  let version = 0;
  const writes = [];
  return { writes,
    async read() { return value === null ? null : { etag: String(version), data: structuredClone(value) }; },
    async cas(previous, data) {
      if ((previous?.etag || null) !== (value === null ? null : String(version))) throw new WatchError("STATE_CONFLICT");
      value = structuredClone(data); version += 1; writes.push(structuredClone(data));
      return this.read();
    },
    peek() { return structuredClone(value); },
    mutate(fn) { value = fn(value); version += 1; }
  };
}

function fixture(rows = [row()], options = {}) {
  const calls = { pages: [], qa: 0, prepares: 0, sends: [] };
  return { calls,
    async verifyDeployment() { if (options.deployError) throw options.deployError; },
    async readPage(page, size) { calls.pages.push(page); if (options.readError) throw options.readError; return rows.slice((page - 1) * size, page * size); },
    async readQa() { calls.qa += 1; if (options.readError) throw options.readError; return [row(QA_RECORD)]; },
    async prepareSender() {
      calls.prepares += 1; if (options.oauthError) throw options.oauthError;
      return async (message) => { calls.sends.push(message); if (options.sendError) throw options.sendError; return { accepted: true, sendId: "fixture-send-1" }; };
    }
  };
}

test("schedule is hourly and absent/false flags are disabled before config access", () => {
  assert.equal(config.schedule, "@hourly");
  for (const value of [undefined, "false", "TRUE", "1"]) assert.equal(readConfig({ SPAM_WATCH_ENABLED: value }, null, NOW), null);
});

test("exact site, deploy, context, host, non-published QA and short window are mandatory", () => {
  const cases = [
    ["SPAM_WATCH_SITE_ID", "other-site", /SITE_MISMATCH/],
    ["SPAM_WATCH_APPROVED_COMMIT", "unknown", /DEPLOY_APPROVAL_MISSING/],
    ["SPAM_WATCH_CONTEXT", "production", /CONTEXT_MISMATCH/],
    ["SPAM_WATCH_QA_UNTIL", "2026-10-12T12:00:00Z", /QA_WINDOW_CLOSED/],
    ["SPAM_WATCH_QA_UNTIL", "2026-10-12T15:00:00Z", /QA_WINDOW_CLOSED/],
    ["SPAM_WATCH_RECIPIENT", "stranger@example.test", /RECIPIENT_FORBIDDEN/]
  ];
  for (const [key, value, expected] of cases) assert.throws(() => readConfig({ ...environment(), [key]: value }, context(), NOW), expected);
  assert.throws(() => readConfig(environment(), { ...context(), site: { id: SITE, url: "https://production.example.test" } }, NOW), /HOST_MISMATCH/);
  assert.throws(() => readConfig(environment(), { ...context(), deploy: { ...context().deploy, published: true } }, NOW), /QA_PUBLISHED_DEPLOY_FORBIDDEN/);
  assert.equal(qa().sendEnabled, true);
});

test("production demands explicit manifest approval, exact runtime site and published production context", () => {
  const env = { ...environment(), SPAM_WATCH_MODE: "production", SPAM_WATCH_SITE_ID: "production-fixture", SPAM_WATCH_CONTEXT: "production" };
  const ctx = { site: { id: "production-fixture", url: "https://solvex-ai3d.com" }, deploy: { ...context().deploy, context: "production", published: true } };
  assert.throws(() => readConfig(env, ctx, NOW), /RELEASE_APPROVAL_MISSING/);
  env.SPAM_WATCH_RELEASE_MANIFEST_SHA256 = "a".repeat(64);
  assert.equal(readConfig(env, ctx, NOW).mode, "production");
  assert.throws(() => readConfig(env, { ...ctx, deploy: { ...ctx.deploy, published: false } }, NOW), /PRODUCTION_CONTEXT_MISMATCH/);
});

test("no guessed region, quotas, privilege approval, retention or catchup", () => {
  for (const key of ["SPAM_WATCH_ZOHO_REGION", "SPAM_WATCH_ZOHO_ACCOUNT_ID", "SPAM_WATCH_TECHNICAL_RETENTION_DAYS", "SPAM_WATCH_CATCHUP_FROM", "SPAM_WATCH_BLOBS_REGION", "SPAM_WATCH_QUOTA_REVIEWED", "SPAM_WATCH_ACCESS_APPROVED"]) {
    const env = environment(); delete env[key]; assert.throws(() => readConfig(env, context(), NOW));
  }
  assert.throws(() => readConfig({ ...environment(), SPAM_WATCH_TECHNICAL_RETENTION_DAYS: "731" }, context(), NOW), /RETENTION_DECISION_MISSING/);
});

test("record minimization returns only ID/date and QA allowlist rejects any other record/site/form", () => {
  assert.deepEqual(minimizeRecords(rawQa(), qa()), [row(QA_RECORD)]);
  assert.doesNotMatch(JSON.stringify(minimizeRecords(rawQa(), qa())), /FORBIDDEN|example.test/);
  assert.throws(() => minimizeRecords({ ...rawQa(), id: "different" }, qa()), /QA_RECORD_NOT_ALLOWLISTED/);
  assert.throws(() => minimizeRecords({ ...rawQa(), site_url: "https://elsewhere.test" }, qa()), /QA_RECORD_SITE_MISMATCH/);
  assert.throws(() => minimizeRecords({ ...rawQa(), form_id: "different" }, qa()), /QA_FORM_MISMATCH/);
});

test("zero records completes reading without an OAuth request or email", async () => {
  const store = memory(); const provider = fixture([]);
  assert.equal((await runWatch({ cfg: production(), store, provider, clock: () => NOW })).status, "NO_NEW_RECORDS");
  assert.equal(provider.calls.prepares, 0); assert.equal(provider.calls.sends.length, 0);
  assert.equal(store.peek().lastSuccessAt, new Date(NOW).toISOString());
});

test("one record produces metadata-only email; API acceptance is not inbox delivery", async () => {
  const store = memory(); const provider = fixture();
  const result = await runWatch({ cfg: production(), store, provider, clock: () => NOW });
  assert.equal(result.status, "API_ACCEPTED_INBOX_NOT_PROVED");
  assert.equal(provider.calls.sends.length, 1);
  const message = provider.calls.sends[0];
  assert.equal(message.toAddress, OWNER_MAIL); assert.equal(message.mailFormat, "plaintext");
  assert.doesNotMatch(JSON.stringify(message), /FORBIDDEN|example.test|consegnato|lead validi/);
  assert.equal(store.peek().lastSendId, "fixture-send-1");
  assert.deepEqual(store.peek().seen, [row()]);
});

test("duplicate IDs and restart do not resend", async () => {
  const store = memory(); const provider = fixture([row(), row()]);
  await runWatch({ cfg: production(), store, provider, clock: () => NOW });
  assert.equal((await runWatch({ cfg: production(), store, provider, clock: () => NOW + 2 * 3_600_000 })).status, "NO_NEW_RECORDS");
  assert.equal(provider.calls.sends.length, 1); assert.equal(store.peek().seen.length, 1);
});

test("multiple pages and changed page ordering are reconciled as stable metadata sets", async () => {
  const items = Array.from({ length: 101 }, (_, i) => row(`row${i}`));
  let reads = 0;
  const provider = fixture(items);
  provider.readPage = async (page, size) => {
    reads += 1; const source = reads <= 2 ? items : [...items].reverse();
    return source.slice((page - 1) * size, page * size);
  };
  const result = await collectStableMetadata(provider, production(), NOW);
  assert.equal(result.length, 101); assert.equal(reads, 4);
});

test("insertion between scans triggers a further stable scan, not dropped boundary record", async () => {
  let count = 0;
  const provider = { readPage: async () => (++count === 1 ? [row("old")] : [row("new"), row("old")]) };
  assert.equal((await collectStableMetadata(provider, production(), NOW)).length, 2);
  assert.equal(count, 3);
});

test("continuously unstable pages halt without advancing watermark or sending", async () => {
  let count = 0; const provider = fixture();
  provider.readPage = async () => [row(`changing-${++count}`)];
  const store = memory();
  const result = await runWatch({ cfg: production(), store, provider, clock: () => NOW });
  assert.equal(result.code, "UNSTABLE_PAGINATION_NO_CURSOR_ADVANCE");
  assert.equal(store.peek().watermark, production().catchupFrom); assert.equal(provider.calls.sends.length, 0);
});

test("page cap is not treated as an empty or complete queue", async () => {
  const provider = fixture(Array.from({ length: 500 }, (_, i) => row(`row${i}`)));
  const store = memory();
  const result = await runWatch({ cfg: production(), store, provider, clock: () => NOW });
  assert.equal(result.code, "PAGE_LIMIT_NO_CURSOR_ADVANCE");
  assert.equal(store.peek().lastSuccessAt, null); assert.equal(provider.calls.sends.length, 0);
});

test("API timeout leaves old watermark and no record/body in the error state", async () => {
  const provider = fixture([], { readError: new Error("FORBIDDEN_BODY secret-token") });
  const store = memory();
  const result = await runWatch({ cfg: production(), store, provider, clock: () => NOW });
  assert.equal(result.status, "READ_OR_PREPARE_ERROR"); assert.equal(result.code, "UNCLASSIFIED_FAILURE");
  assert.equal(store.peek().watermark, production().catchupFrom);
  assert.doesNotMatch(JSON.stringify(store.peek()), /FORBIDDEN|secret-token/);
});

test("OAuth failure retains pending IDs but no send reservation", async () => {
  const provider = fixture([row()], { oauthError: new WatchError("ZOHO_OAUTH_HTTP") });
  const store = memory();
  assert.equal((await runWatch({ cfg: production(), store, provider, clock: () => NOW })).code, "ZOHO_OAUTH_HTTP");
  assert.equal(store.peek().phase, "idle"); assert.equal(store.peek().lastAttemptAt, null);
  assert.deepEqual(store.peek().pending, [row()]); assert.equal(provider.calls.sends.length, 0);
});

test("lost send response persists uncertainty; restart never replays", async () => {
  const provider = fixture([row()], { sendError: new Error("response lost") }); const store = memory();
  assert.equal((await runWatch({ cfg: production(), store, provider, clock: () => NOW })).status, "SEND_UNCERTAIN_STOP");
  assert.equal(store.peek().phase, "uncertain"); assert.equal(store.peek().lastAcceptedAt, null);
  assert.equal((await runWatch({ cfg: production(), store, provider, clock: () => NOW + 7_200_000 })).status, "BLOCKED_PENDING_RECONCILIATION");
  assert.equal(provider.calls.sends.length, 1); assert.deepEqual(store.peek().pending, [row()]);
});

test("crashed read/send lock is never expired or taken over automatically", async () => {
  const store = memory(); const provider = fixture([]);
  await runWatch({ cfg: production(), store, provider, clock: () => NOW });
  store.mutate((state) => ({ ...state, phase: "reading", runId: "crashed" }));
  assert.equal((await runWatch({ cfg: production(), store, provider, clock: () => NOW + 86_400_000 })).status, "BLOCKED_PENDING_RECONCILIATION");
});

test("hourly rolling cap retains new pending records for next eligible run", async () => {
  const store = memory(); const provider = fixture([row("first")]);
  await runWatch({ cfg: production(), store, provider, clock: () => NOW });
  const next = fixture([row("first"), row("second")]);
  assert.equal((await runWatch({ cfg: production(), store, provider: next, clock: () => NOW + 1_000 })).status, "HOURLY_LIMIT_PENDING");
  assert.deepEqual(store.peek().pending, [row("second")]); assert.equal(next.calls.sends.length, 0);
  assert.equal((await runWatch({ cfg: production(), store, provider: next, clock: () => NOW + 3_600_000 })).count, 1);
});

test("dry-run preserves pending and never calls OAuth/send", async () => {
  const store = memory(); const provider = fixture();
  const result = await runWatch({ cfg: { ...production(), sendEnabled: false }, store, provider, clock: () => NOW });
  assert.equal(result.status, "DRY_RUN_PENDING"); assert.equal(provider.calls.prepares, 0);
});

test("QA maximum two reads is durable across restarts, with one allowlisted record only", async () => {
  const store = memory(); const provider = fixture();
  await runWatch({ cfg: qa(), store, provider, clock: () => NOW });
  await runWatch({ cfg: qa(), store, provider, clock: () => NOW + 1_000 });
  assert.equal((await runWatch({ cfg: qa(), store, provider, clock: () => NOW + 2_000 })).status, "QA_READ_BUDGET_EXHAUSTED");
  assert.equal(provider.calls.qa, 2); assert.equal(provider.calls.pages.length, 0);
  assert.equal(provider.calls.sends.length, 1); assert.equal(store.peek().qaReads, 2); assert.equal(store.peek().qaSends, 1);
});

test("overlapping executions cannot both claim a run", async () => {
  const store = memory(); const provider = fixture();
  const runs = await Promise.allSettled([runWatch({ cfg: production(), store, provider, clock: () => NOW }), runWatch({ cfg: production(), store, provider, clock: () => NOW })]);
  assert.equal(runs.filter((r) => r.status === "rejected" && r.reason.code === "STATE_CONFLICT").length, 1);
  assert.equal(provider.calls.sends.length, 1);
});

test("metadata state rejects extra PII keys and changed scope binding", async () => {
  const store = memory(); const provider = fixture([]);
  await runWatch({ cfg: production(), store, provider, clock: () => NOW });
  await assert.rejects(runWatch({ cfg: { ...production(), binding: "changed" }, store, provider, clock: () => NOW }), /STATE_BINDING_MISMATCH/);
  store.mutate((state) => ({ ...state, email: "unexpected@example.test" }));
  await assert.rejects(runWatch({ cfg: production(), store, provider, clock: () => NOW }), /STATE_SCHEMA_INVALID/);
});

test("catch-up range prevents historic flooding but detects late classification behind watermark", async () => {
  const cfg = production(); const store = memory();
  const before = row("old", "2026-10-08T09:00:00.000Z");
  assert.equal((await runWatch({ cfg, store, provider: fixture([before]), clock: () => NOW })).ignoredBeforeRange, 1);
  const laterClassified = fixture([before, row("newly-filtered", "2026-10-10T09:00:00.000Z")]);
  assert.equal((await runWatch({ cfg, store, provider: laterClassified, clock: () => NOW + 3_600_000 })).count, 1);
});

test("future-dated records wait for the next run and cannot advance watermark into the future", async () => {
  const future = row("future", "2026-10-13T09:00:00.000Z"); const store = memory();
  assert.equal((await runWatch({ cfg: production(), store, provider: fixture([future]), clock: () => NOW })).status, "NO_NEW_RECORDS");
  assert.equal(store.peek().watermark, new Date(NOW).toISOString());
});

test("Blob adapter uses strong reads, conditional writes and matching ETag read-back", async () => {
  let saved = null; let condition;
  const blobs = { async getWithMetadata(key, options) { assert.equal(options.consistency, "strong"); return saved; },
    async setJSON(key, data, options) { condition = options; saved = { etag: "etag1", data }; return { modified: true, etag: "etag1" }; } };
  const store = createBlobStateStore(blobs);
  assert.equal(await store.read(), null);
  assert.deepEqual(await store.cas(null, { a: 1 }), { etag: "etag1", data: { a: 1 } });
  assert.deepEqual(condition, { onlyIfNew: true });
  await store.cas({ etag: "etag1" }, { a: 2 }); assert.deepEqual(condition, { onlyIfMatch: "etag1" });
});

test("Blob phantom success, stale reads and CAS conflicts are fail-closed", async () => {
  for (const [reply, stored, code] of [
    [{ modified: true, etag: "" }, null, "STATE_WRITE_UNCONFIRMED"],
    [{ modified: false }, null, "STATE_CONFLICT"],
    [{ modified: true, etag: "new" }, { etag: "old", data: { a: 1 } }, "STATE_WRITE_UNCONFIRMED"]
  ]) {
    const store = createBlobStateStore({ setJSON: async () => reply, getWithMetadata: async () => stored });
    await assert.rejects(store.cas(null, { a: 1 }), new RegExp(code));
  }
});

test("official HTTP adapter uses only the allowlisted QA GET and minimizes the result", async () => {
  const requests = [];
  const provider = createProvider(qa(), environment(), async (url, options) => {
    requests.push({ url, options }); return { ok: true, json: async () => rawQa() };
  });
  assert.deepEqual(await provider.readQa(), [row(QA_RECORD)]);
  assert.equal(requests[0].url, `https://api.netlify.com/api/v1/submissions/${QA_RECORD}`);
  assert.equal(requests[0].options.method, "GET"); assert.equal(requests[0].options.redirect, "error");
  assert.throws(() => provider.readPage(1, 100), /WRONG_READ_MODE/);
});

test("production HTTP adapter is only a site-scoped spam list GET", async () => {
  let request;
  const provider = createProvider(production(), environment(), async (url, options) => { request = { url, options }; return { ok: true, json: async () => [] }; });
  await provider.readPage(2, 100);
  assert.equal(request.url, "https://api.netlify.com/api/v1/sites/production-fixture/submissions?state=spam&page=2&per_page=100");
  assert.equal(request.options.method, "GET"); assert.throws(() => provider.readQa(), /WRONG_READ_MODE/);
});

test("Zoho OAuth uses EU official endpoint/body; send is fixed owner-only without retry", async () => {
  const requests = [];
  const provider = createProvider(qa(), environment(), async (url, options) => {
    requests.push({ url, options });
    return { ok: true, json: async () => url.includes("/oauth/") ? { access_token: "synthetic-access" } : { status: { code: 200 }, data: { messageId: "send123" } } };
  });
  const send = await provider.prepareSender();
  assert.equal(requests[0].url, "https://accounts.zoho.eu/oauth/v2/token");
  assert.equal(requests[0].options.body.get("grant_type"), "refresh_token");
  const good = notification(qa(), 1, NOW);
  await assert.rejects(send({ ...good, toAddress: "outsider@example.test" }), /RECIPIENT_FORBIDDEN/);
  assert.equal(requests.length, 1);
  assert.deepEqual(await send(good), { accepted: true, sendId: "send123" });
  assert.equal(requests.length, 2);
  assert.equal(requests[1].url, "https://mail.zoho.eu/api/accounts/123456789/messages");
  assert.equal(requests[1].options.redirect, "error");
});

test("HTTP failures are not empty records and send transport failures are never replayed", async () => {
  let calls = 0;
  const provider = createProvider(qa(), environment(), async (url) => {
    calls += 1;
    if (url.includes("/oauth/")) return { ok: true, json: async () => ({ access_token: "synthetic-access" }) };
    throw new Error("secret must never appear");
  });
  await assert.rejects(provider.readQa(), /NETLIFY_READ_TRANSPORT/);
  const send = await provider.prepareSender();
  await assert.rejects(send(notification(qa(), 1, NOW)), /ZOHO_SEND_TRANSPORT/);
  assert.equal(calls, 3);
});

test("unapproved deployment stops before submission read or send", async () => {
  const provider = fixture([], { deployError: new WatchError("DEPLOY_METADATA_MISMATCH") });
  const store = memory();
  const result = await runWatch({ cfg: qa(), store, provider, clock: () => NOW });
  assert.equal(result.code, "DEPLOY_METADATA_MISMATCH");
  assert.equal(provider.calls.qa, 0); assert.equal(provider.calls.sends.length, 0);
  assert.equal(store.peek().watermark, qa().catchupFrom);
});

test("official deployment metadata must match site, generated ID, SHA, context and ready state", async () => {
  const cfg = qa(); const good = { id: cfg.deployId, site_id: cfg.siteId, commit_ref: cfg.approvedCommit, context: cfg.context, state: "ready" };
  for (const key of Object.keys(good)) {
    let url; const provider = createProvider(cfg, environment(), async (target, options) => {
      url = target; assert.equal(options.method, "GET");
      return { ok: true, json: async () => ({ ...good, [key]: "unapproved" }) };
    });
    await assert.rejects(provider.verifyDeployment(), /DEPLOY_METADATA_MISMATCH/);
    assert.equal(url, `https://api.netlify.com/api/v1/deploys/${cfg.deployId}`);
  }
  const provider = createProvider(cfg, environment(), async () => ({ ok: true, json: async () => good }));
  await provider.verifyDeployment();
});

test("failed QA read consumes its reservation and cannot be topped up", async () => {
  const provider = fixture([], { readError: new WatchError("NETLIFY_READ_TRANSPORT") }); const store = memory();
  await runWatch({ cfg: qa(), store, provider, clock: () => NOW });
  await runWatch({ cfg: qa(), store, provider, clock: () => NOW });
  assert.equal((await runWatch({ cfg: qa(), store, provider, clock: () => NOW })).status, "QA_READ_BUDGET_EXHAUSTED");
  assert.equal(provider.calls.qa, 2); assert.equal(provider.calls.sends.length, 0);
});

test("send success followed by state-write loss stays uncertain and cannot resend", async () => {
  const store = memory(); const normalCas = store.cas; let calls = 0;
  store.cas = async function (...args) { calls += 1; if (calls === 4) throw new Error("write failed"); return normalCas.apply(this, args); };
  const provider = fixture();
  assert.equal((await runWatch({ cfg: production(), store, provider, clock: () => NOW })).status, "SEND_UNCERTAIN_STOP");
  assert.equal(store.peek().phase, "uncertain");
  assert.equal((await runWatch({ cfg: production(), store, provider, clock: () => NOW + 7_200_000 })).status, "BLOCKED_PENDING_RECONCILIATION");
  assert.equal(provider.calls.sends.length, 1);
});

test("technical TTL prunes already-notified IDs without replaying old records", async () => {
  const store = memory(); const provider = fixture();
  await runWatch({ cfg: production(), store, provider, clock: () => NOW });
  assert.equal((await runWatch({ cfg: production(), store, provider, clock: () => NOW + 40 * 86_400_000 })).status, "NO_NEW_RECORDS");
  assert.equal(store.peek().seen.length, 0); assert.equal(provider.calls.sends.length, 1);
});

test("runtime deadline fails closed before later requests", async () => {
  const store = memory(); const provider = fixture(); let calls = 0;
  const result = await runWatch({ cfg: production(), store, provider, clock: () => NOW + 25_000 * calls++ });
  assert.equal(result.code, "RUN_DEADLINE"); assert.equal(provider.calls.pages.length, 0);
  assert.equal(provider.calls.prepares, 0);
});

test("disabled scheduled entry logs health/next_run without SDK initialization or provider calls", async () => {
  const previous = process.env.SPAM_WATCH_ENABLED; const oldLog = console.log; const oldFetch = globalThis.fetch;
  const logs = [];
  process.env.SPAM_WATCH_ENABLED = "false";
  console.log = (line) => logs.push(JSON.parse(line));
  globalThis.fetch = () => { throw new Error("Network must not be reached"); };
  try {
    await spamWatch(new Request("https://fixture.test", { method: "POST", body: JSON.stringify({ next_run: "2026-10-12T14:00:00Z" }) }), null);
  } finally {
    if (previous === undefined) delete process.env.SPAM_WATCH_ENABLED; else process.env.SPAM_WATCH_ENABLED = previous;
    console.log = oldLog; globalThis.fetch = oldFetch;
  }
  assert.deepEqual(logs, [{ monitor: "spam-watch50", status: "DISABLED", nextRun: "2026-10-12T14:00:00.000Z" }]);
});

async function realSdk() {
  // The official SDK has a documented-in-source test delay; every request below
  // uses its injected fetch fixture. No provider or loopback network is used.
  const old = process.env.NODE_ENV;
  process.env.NODE_ENV = "test";
  try { return await import("@netlify/blobs"); }
  finally { if (old === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = old; }
}

test("installed SDK 11.1.4 preserves region, strong reads and conditional ETags against fetch fixtures", async () => {
  const { getStore } = await realSdk();
  const calls = []; let saved = null; let version = 0;
  const blob = getStore({ name: "spam-watch50-sdk-fixture", region: "eu-central-1", consistency: "strong",
    siteID: "synthetic-site", token: "synthetic-token", edgeURL: "https://cached.fixture.test", uncachedEdgeURL: "https://strong.fixture.test",
    fetch: async (url, options) => {
      calls.push({ url, method: options.method, headers: options.headers });
      assert.match(url, /^https:\/\/strong\.fixture\.test\/region:eu-central-1\/synthetic-site\//);
      if (options.method === "put") {
        const headers = new Headers(options.headers);
        if ((headers.get("if-none-match") === "*" && saved !== null) ||
            (headers.has("if-match") && headers.get("if-match") !== `v${version}`)) return new Response(null, { status: 412 });
        saved = JSON.parse(options.body); version += 1;
        return new Response(null, { status: 200, headers: { etag: `v${version}` } });
      }
      if (saved === null) return new Response(null, { status: 404 });
      return Response.json(saved, { headers: { etag: `v${version}` } });
    } });
  const store = createBlobStateStore(blob);
  assert.equal(await store.read(), null);
  const first = await store.cas(null, { phase: "synthetic-first" });
  assert.equal(first.etag, "v1");
  const second = await store.cas(first, { phase: "synthetic-second" });
  assert.equal(second.etag, "v2");
  await assert.rejects(store.cas(first, { phase: "stale-writer" }), /STATE_CONFLICT/);
  assert.equal(calls.filter((call) => call.method === "put").length, 3);
  assert.throws(() => getStore({ name: "fixture", siteID: "fixture", token: "fixture", region: "invented-region" }), /not a supported/);
});

test("installed SDK conditional-write false success after exhausted 503 retries is caught by the adapter", async () => {
  const { getStore } = await realSdk(); let calls = 0;
  const blob = getStore({ name: "spam-watch50-sdk-failure", region: "eu-central-1", consistency: "strong",
    siteID: "synthetic-site", token: "synthetic-token", edgeURL: "https://cached.fixture.test", uncachedEdgeURL: "https://strong.fixture.test",
    fetch: async () => { calls += 1; return new Response(null, { status: 503 }); } });
  await assert.rejects(createBlobStateStore(blob).cas(null, { phase: "must-not-be-accepted" }), /STATE_WRITE_UNCONFIRMED/);
  assert.equal(calls, 6); // Initial try + five bounded SDK retries; never a mail send.
});
