import { createHash, randomUUID } from "node:crypto";

// Independent of the Forms submission path: never changes classification,
// submissions, or the existing all-forms notification.
export const config = { schedule: "@hourly" };
export const OWNER_MAIL = "info@solvex-ai3d.com";
export const QA_RECORD = "6ac931baff083bb2fd3cde9b";
export const QA_FORM = "6a960b206ea2ad000995787c";
const STAGING_HOST = "solvex-ai3d-measurement-staging.netlify.app";
const STAGING_SITE_ID = "c9b5c607-1d8c-480a-ad77-756de5927f7c";
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const STATE_KEY = "state-v1";
const MAX_RECORDS = 500;

export class WatchError extends Error {
  constructor(code) { super(code); this.code = code; }
}
const fail = (code) => { throw new WatchError(code); };
const iso = (value) => new Date(value).toISOString();
const hash = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const validId = (value) => typeof value === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(value);
const date = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(value) || !Number.isFinite(Date.parse(value))) fail("INVALID_DATE");
  return Date.parse(value);
};
const safeCode = (error) => error instanceof WatchError ? error.code : "UNCLASSIFIED_FAILURE";
const secret = (env, key) => {
  if (typeof env[key] !== "string" || env[key].length < 8 || /[\r\n]/.test(env[key])) fail("MISSING_CREDENTIAL");
  return env[key];
};

// No storage, imports or provider calls occur before this deployment gate.
export function readConfig(env, context, now = Date.now()) {
  if (env.SPAM_WATCH_ENABLED !== "true") return null;
  const mode = env.SPAM_WATCH_MODE;
  if (!["qa", "production"].includes(mode)) fail("INVALID_MODE");
  const siteId = env.SPAM_WATCH_SITE_ID;
  if (!validId(siteId) || context?.site?.id !== siteId) fail("SITE_MISMATCH");
  if (!validId(context?.deploy?.id) || !/^[a-f0-9]{40}$/.test(env.SPAM_WATCH_APPROVED_COMMIT || "")) fail("DEPLOY_APPROVAL_MISSING");
  if (!env.SPAM_WATCH_CONTEXT || context?.deploy?.context !== env.SPAM_WATCH_CONTEXT) fail("CONTEXT_MISMATCH");
  let host;
  try { host = new URL(context.site.url).hostname; } catch { fail("HOST_MISMATCH"); }
  if (env.SPAM_WATCH_RECIPIENT && env.SPAM_WATCH_RECIPIENT !== OWNER_MAIL) fail("RECIPIENT_FORBIDDEN");
  if (mode === "qa") {
    if (host !== STAGING_HOST || siteId !== STAGING_SITE_ID) fail("HOST_MISMATCH");
    // Run now on an unpublished branch/preview only. A separately published
    // staging site also runs cron: an enabled published QA deploy is unsafe.
    if (context.deploy.published !== false) fail("QA_PUBLISHED_DEPLOY_FORBIDDEN");
    const until = date(env.SPAM_WATCH_QA_UNTIL);
    if (until <= now || until - now > 90 * 60_000) fail("QA_WINDOW_CLOSED");
    if (!/^QA50-[A-Z0-9-]{1,64}$/.test(env.SPAM_WATCH_QA_MARKER || "")) fail("QA_MARKER_MISSING");
  } else {
    if (!["solvex-ai3d.com", "www.solvex-ai3d.com"].includes(host) || siteId === STAGING_SITE_ID) fail("HOST_MISMATCH");
    if (context.deploy.published !== true || context.deploy.context !== "production") fail("PRODUCTION_CONTEXT_MISMATCH");
    if (!/^[a-f0-9]{64}$/.test(env.SPAM_WATCH_RELEASE_MANIFEST_SHA256 || "")) fail("RELEASE_APPROVAL_MISSING");
  }
  // Region, retention and catch-up are explicit deployment decisions, not facts
  // inferred from the mailbox address or invented provider retention periods.
  if (env.SPAM_WATCH_ZOHO_REGION !== "eu") fail("ZOHO_REGION_NOT_VERIFIED");
  if (!/^\d{1,30}$/.test(env.SPAM_WATCH_ZOHO_ACCOUNT_ID || "")) fail("ZOHO_ACCOUNT_MISSING");
  const retentionDays = Number(env.SPAM_WATCH_TECHNICAL_RETENTION_DAYS);
  if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 730) fail("RETENTION_DECISION_MISSING");
  const catchupFrom = date(env.SPAM_WATCH_CATCHUP_FROM);
  if (catchupFrom > now) fail("CATCHUP_RANGE_INVALID");
  if (!["us-east-1", "us-east-2", "eu-central-1", "ap-southeast-1", "ap-southeast-2"].includes(env.SPAM_WATCH_BLOBS_REGION)) fail("BLOBS_REGION_MISSING");
  if (env.SPAM_WATCH_QUOTA_REVIEWED !== "true" || env.SPAM_WATCH_ACCESS_APPROVED !== "true") fail("ACCOUNT_GATES_MISSING");
  return Object.freeze({ mode, siteId, host, deployId: context.deploy.id,
    context: context.deploy.context, approvedCommit: env.SPAM_WATCH_APPROVED_COMMIT,
    catchupFrom: iso(catchupFrom), retentionDays,
    blobRegion: env.SPAM_WATCH_BLOBS_REGION,
    qaMarker: mode === "qa" ? env.SPAM_WATCH_QA_MARKER : null,
    sendEnabled: env.SPAM_WATCH_SEND_ENABLED === "true",
    accountId: env.SPAM_WATCH_ZOHO_ACCOUNT_ID,
    binding: hash({ mode, siteId, catchupFrom: iso(catchupFrom), retentionDays }) });
}

// Project to ID/date immediately, inside the provider adapter. Neither the core
// nor persistent state receives the record body, user details or attachments.
export function minimizeRecords(raw, cfg) {
  const rows = Array.isArray(raw) ? raw : [raw];
  if (rows.length > 100) fail("PAGE_TOO_LARGE");
  return rows.map((row) => {
    if (!row || !validId(row.id)) fail("INVALID_RECORD");
    const createdAt = iso(date(row.created_at));
    if (cfg.mode === "qa") {
      if (row.id !== QA_RECORD) fail("QA_RECORD_NOT_ALLOWLISTED");
      if (row.form_id !== undefined && row.form_id !== QA_FORM) fail("QA_FORM_MISMATCH");
      let host;
      try { host = new URL(row.site_url).hostname; } catch { fail("QA_RECORD_SITE_MISMATCH"); }
      if (host !== STAGING_HOST) fail("QA_RECORD_SITE_MISMATCH");
    }
    return { id: row.id, createdAt };
  });
}

export function createBlobStateStore(blobStore) {
  return {
    async read() {
      const entry = await blobStore.getWithMetadata(STATE_KEY, { type: "json", consistency: "strong" });
      if (entry === null) return null;
      if (!entry.etag || typeof entry.data !== "object" || entry.data === null) fail("STATE_READ_INVALID");
      return { etag: entry.etag, data: entry.data };
    },
    async cas(previous, data) {
      const condition = previous ? { onlyIfMatch: previous.etag } : { onlyIfNew: true };
      const result = await blobStore.setJSON(STATE_KEY, data, condition);
      if (!result.modified) fail("STATE_CONFLICT");
      // Do not trust a conditional write with no ETag or a stale read-back.
      if (!result.etag) fail("STATE_WRITE_UNCONFIRMED");
      const checked = await this.read();
      if (!checked || checked.etag !== result.etag || hash(checked.data) !== hash(data)) fail("STATE_WRITE_UNCONFIRMED");
      return checked;
    }
  };
}

function newState(cfg) {
  return { schema: 1, binding: cfg.binding, phase: "idle", runId: null,
    lastCheckAt: null, lastSuccessAt: null, watermark: cfg.catchupFrom,
    lastAttemptAt: null, lastAcceptedAt: null, lastSendId: null,
    lastError: null, qaReads: 0, qaSends: 0, seen: [], pending: [] };
}

function validateState(state, cfg) {
  if (state?.schema !== 1 || state.binding !== cfg.binding) fail("STATE_BINDING_MISMATCH");
  const expected = Object.keys(newState(cfg)).sort().join("|");
  if (Object.keys(state).sort().join("|") !== expected) fail("STATE_SCHEMA_INVALID");
  if (!["idle", "reading", "sending", "uncertain"].includes(state.phase)) fail("STATE_SCHEMA_INVALID");
  for (const list of [state.seen, state.pending]) {
    if (!Array.isArray(list) || list.length > MAX_RECORDS) fail("STATE_LIMIT");
    for (const item of list) {
      if (Object.keys(item).sort().join("|") !== "createdAt|id" || !validId(item.id)) fail("STATE_SCHEMA_INVALID");
      date(item.createdAt);
    }
  }
  for (const key of ["qaReads", "qaSends"]) if (!Number.isInteger(state[key]) || state[key] < 0 || state[key] > 2) fail("STATE_SCHEMA_INVALID");
}

// Full bounded scans are compared as sorted metadata sets. The API does not
// document snapshot isolation or ordering; no cursor is advanced on instability.
// Re-scan from page 1 on every run, including the whole catch-up overlap. A late
// spam classification within that explicit range is not lost at a watermark.
export async function collectStableMetadata(provider, cfg, startedAt, checkTime = () => {}) {
  if (cfg.mode === "qa") {
    checkTime();
    const only = await provider.readQa();
    if (only.length !== 1 || only[0].id !== QA_RECORD) fail("QA_RECORD_MISSING");
    return only;
  }
  let previous = null;
  for (let pass = 0; pass < 3; pass += 1) {
    const found = new Map();
    let complete = false;
    for (let page = 1; page <= 5; page += 1) {
      checkTime();
      const rows = await provider.readPage(page, 100);
      if (!Array.isArray(rows) || rows.length > 100) fail("PAGE_INVALID");
      for (const row of rows) {
        if (!validId(row.id)) fail("INVALID_RECORD");
        date(row.createdAt);
        const old = found.get(row.id);
        if (old && old.createdAt !== row.createdAt) fail("RECORD_DATE_CHANGED");
        if (date(row.createdAt) <= startedAt) found.set(row.id, { id: row.id, createdAt: row.createdAt });
      }
      if (rows.length < 100) { complete = true; break; }
    }
    if (!complete) fail("PAGE_LIMIT_NO_CURSOR_ADVANCE");
    const ordered = [...found.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
    const digest = hash(ordered);
    if (digest === previous) return ordered;
    previous = digest;
  }
  fail("UNSTABLE_PAGINATION_NO_CURSOR_ADVANCE");
}

export function notification(cfg, count, time) {
  if (!Number.isInteger(count) || count < 1 || count > MAX_RECORDS) fail("INVALID_COUNT");
  const panel = cfg.mode === "qa"
    ? `https://app.netlify.com/projects/solvex-ai3d-measurement-staging/forms/${QA_FORM}?filter=spam`
    : `https://app.netlify.com/sites/${cfg.siteId}/forms`;
  return Object.freeze({ fromAddress: OWNER_MAIL, toAddress: OWNER_MAIL,
    subject: cfg.mode === "qa" ? `[${cfg.qaMarker}] Controllo avviso Spam SolveX` : "SolveX: record presenti nel filtro Spam",
    content: `${cfg.mode === "qa" ? "Prova QA50 sul record QA autorizzato; non una nuova verifica della classificazione.\n" : ""}${count} record da controllare nel pannello. Non sono qualificati come richieste valide.\nControllo: ${iso(time)}\n${panel}\nQuesto messaggio non contiene il contenuto dei moduli.`,
    mailFormat: "plaintext", askReceipt: "no", encoding: "UTF-8" });
}

export async function runWatch({ cfg, store, provider, clock = Date.now, runId = randomUUID() }) {
  const startedAt = clock();
  const checkTime = () => { if (clock() - startedAt > 20_000) fail("RUN_DEADLINE"); };
  let snapshot = await store.read();
  let state = snapshot?.data || newState(cfg);
  validateState(state, cfg);
  // No expiring lease or automatic takeover: a crashed/ambiguous run requires
  // explicit reconciliation. This prefers a visible stop to duplicate emails.
  if (state.phase !== "idle") return { status: "BLOCKED_PENDING_RECONCILIATION", phase: state.phase };
  if (cfg.mode === "qa" && state.qaReads >= 2) return { status: "QA_READ_BUDGET_EXHAUSTED" };
  state = { ...state, phase: "reading", runId, lastCheckAt: iso(startedAt), lastError: null,
    qaReads: state.qaReads + (cfg.mode === "qa" ? 1 : 0) };
  snapshot = await store.cas(snapshot, state); // Durable reservation precedes any provider read.
  let sendWasReserved = false;
  try {
    checkTime();
    await provider.verifyDeployment();
    const records = await collectStableMetadata(provider, cfg, startedAt, checkTime);
    const floor = Math.max(date(cfg.catchupFrom), startedAt - cfg.retentionDays * DAY);
    const eligible = records.filter((item) => date(item.createdAt) >= floor);
    const known = new Set(state.seen.map((item) => item.id));
    const pending = new Map(state.pending.map((item) => [item.id, item]));
    for (const item of eligible) if (!known.has(item.id)) pending.set(item.id, item);
    // Never discard pending records merely because the technical TTL elapsed.
    if (pending.size > MAX_RECORDS) fail("STATE_LIMIT");
    if (new Set([...state.seen.filter((item) => date(item.createdAt) >= floor), ...pending.values()].map((item) => item.id)).size > MAX_RECORDS) fail("STATE_LIMIT");
    state = { ...state, seen: state.seen.filter((item) => date(item.createdAt) >= floor),
      pending: [...pending.values()], lastSuccessAt: iso(startedAt), watermark: iso(startedAt) };
    snapshot = await store.cas(snapshot, state);
    if (!state.pending.length || !cfg.sendEnabled || (state.lastAttemptAt && startedAt - date(state.lastAttemptAt) < HOUR)) {
      const status = !state.pending.length ? "NO_NEW_RECORDS" : !cfg.sendEnabled ? "DRY_RUN_PENDING" : "HOURLY_LIMIT_PENDING";
      state = { ...state, phase: "idle", runId: null };
      await store.cas(snapshot, state);
      return { status, pendingCount: state.pending.length, ignoredBeforeRange: records.length - eligible.length };
    }
    if (cfg.mode === "qa" && state.qaSends >= 2) fail("QA_SEND_BUDGET_EXHAUSTED");
    checkTime();
    // OAuth errors happen BEFORE reserving a send. No access token is persisted.
    const send = await provider.prepareSender();
    checkTime();
    const message = notification(cfg, state.pending.length, startedAt);
    const notifiedCount = state.pending.length;
    state = { ...state, phase: "sending", lastAttemptAt: iso(startedAt),
      qaSends: state.qaSends + (cfg.mode === "qa" ? 1 : 0) };
    snapshot = await store.cas(snapshot, state);
    sendWasReserved = true;
    const receipt = await send(message); // One call, never an automatic retry.
    if (receipt?.accepted !== true) fail("SEND_RESULT_UNCERTAIN");
    state = { ...state, phase: "idle", runId: null, lastAcceptedAt: iso(clock()),
      lastSendId: validId(receipt.sendId) ? receipt.sendId : null,
      seen: [...new Map([...state.seen, ...state.pending].map((item) => [item.id, item])).values()], pending: [] };
    if (state.seen.length > MAX_RECORDS) fail("STATE_LIMIT");
    await store.cas(snapshot, state);
    return { status: "API_ACCEPTED_INBOX_NOT_PROVED", count: notifiedCount,
      ignoredBeforeRange: records.length - eligible.length };
  } catch (error) {
    // Fixed error codes only: fetch/provider errors can contain tokens or bodies.
    state = { ...state, phase: sendWasReserved ? "uncertain" : "idle",
      runId: sendWasReserved ? runId : null, lastError: { code: safeCode(error), at: iso(clock()) } };
    try { await store.cas(snapshot, state); } catch { /* Last durable lock remains fail-closed. */ }
    return { status: sendWasReserved ? "SEND_UNCERTAIN_STOP" : "READ_OR_PREPARE_ERROR", code: safeCode(error) };
  }
}

async function boundedJson(fetcher, url, init, code, timeout = 4_000) {
  let response;
  try { response = await fetcher(url, { ...init, redirect: "error", signal: AbortSignal.timeout(timeout) }); }
  catch { fail(`${code}_TRANSPORT`); }
  if (!response.ok) fail(`${code}_HTTP`);
  try { return await response.json(); } catch { fail(`${code}_JSON`); }
}

export function createProvider(cfg, env, fetcher = fetch) {
  const netlifyToken = secret(env, "SPAM_WATCH_NETLIFY_TOKEN");
  const headers = { Authorization: `Bearer ${netlifyToken}`, Accept: "application/json" };
  async function read(url) {
    let raw = await boundedJson(fetcher, url, { method: "GET", headers }, "NETLIFY_READ");
    try { return minimizeRecords(raw, cfg); } finally { raw = null; }
  }
  return {
    async verifyDeployment() {
      // Commit SHA is known before a build; its generated deploy ID is not.
      // Verify runtime metadata rather than requiring an impossible pre-build
      // deploy-ID environment variable. No submission is read on a mismatch.
      let deploy = await boundedJson(fetcher,
        `https://api.netlify.com/api/v1/deploys/${cfg.deployId}`,
        { method: "GET", headers }, "DEPLOY_PREFLIGHT");
      try {
        if (deploy?.id !== cfg.deployId || deploy.site_id !== cfg.siteId ||
            deploy.commit_ref !== cfg.approvedCommit || deploy.context !== cfg.context || deploy.state !== "ready") fail("DEPLOY_METADATA_MISMATCH");
      } finally { deploy = null; }
    },
    readQa: () => {
      if (cfg.mode !== "qa") fail("WRONG_READ_MODE");
      return read(`https://api.netlify.com/api/v1/submissions/${QA_RECORD}`);
    },
    readPage: (page, size) => {
      if (cfg.mode !== "production" || !Number.isInteger(page) || page < 1 || page > 5 || size !== 100) fail("WRONG_READ_MODE");
      return read(`https://api.netlify.com/api/v1/sites/${cfg.siteId}/submissions?state=spam&page=${page}&per_page=100`);
    },
    async prepareSender() {
      const body = new URLSearchParams({ grant_type: "refresh_token",
        client_id: secret(env, "SPAM_WATCH_ZOHO_CLIENT_ID"),
        client_secret: secret(env, "SPAM_WATCH_ZOHO_CLIENT_SECRET"),
        refresh_token: secret(env, "SPAM_WATCH_ZOHO_REFRESH_TOKEN") });
      // Secrets are sent in the form body, never in a URL or an error message.
      let token = await boundedJson(fetcher, "https://accounts.zoho.eu/oauth/v2/token",
        { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body }, "ZOHO_OAUTH");
      if (typeof token?.access_token !== "string" || !token.access_token || token.error) fail("ZOHO_OAUTH_INVALID");
      const accessToken = token.access_token;
      token = null;
      return async (message) => {
        if (message.toAddress !== OWNER_MAIL || message.fromAddress !== OWNER_MAIL || message.ccAddress || message.bccAddress || message.attachments) fail("RECIPIENT_FORBIDDEN");
        let result = await boundedJson(fetcher, `https://mail.zoho.eu/api/accounts/${cfg.accountId}/messages`,
          { method: "POST", headers: { Authorization: `Zoho-oauthtoken ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(message) }, "ZOHO_SEND");
        try {
          if (result?.status?.code !== 200) fail("ZOHO_SEND_UNCONFIRMED");
          const id = result?.data?.messageId;
          return { accepted: true, sendId: validId(id) ? id : null };
        } finally { result = null; }
      };
    }
  };
}

export default async function spamWatch(request, context) {
  let nextRun = null;
  try {
    const event = await request.json();
    nextRun = iso(date(event?.next_run));
    const settings = readConfig(process.env, context);
    if (!settings) {
      console.log(JSON.stringify({ monitor: "spam-watch50", status: "DISABLED", nextRun }));
      return;
    }
    // Official SDK with runtime-provided credentials: state survives deploys.
    // Region is explicit; no personal access token is supplied to Blobs.
    const { getStore } = await import("@netlify/blobs");
    const blobs = getStore({ name: `solvex-spam-watch50-${settings.mode}`, consistency: "strong", region: settings.blobRegion });
    const result = await runWatch({ cfg: settings, store: createBlobStateStore(blobs), provider: createProvider(settings, process.env) });
    console.log(JSON.stringify({ monitor: "spam-watch50", status: result.status, code: result.code || null, nextRun,
      count: result.count ?? null, pendingCount: result.pendingCount ?? null,
      ignoredBeforeRange: result.ignoredBeforeRange ?? null,
      deployId: settings.deployId, context: settings.context, siteId: settings.siteId }));
  } catch (error) {
    console.error(JSON.stringify({ monitor: "spam-watch50", status: "STOP", code: safeCode(error), nextRun }));
  }
}
