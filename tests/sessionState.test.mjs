import assert from "node:assert/strict";
import { after, afterEach, beforeEach, test } from "node:test";
import { registerHooks } from "node:module";

// Match the frontend bundler's extensionless TypeScript imports using Node's built-in TS support.
registerHooks({ resolve(specifier, context, nextResolve) {
  try { return nextResolve(specifier, context); } catch (error) {
    if (error.code === "ERR_MODULE_NOT_FOUND" && /^\.{1,2}\//.test(specifier) && !/\.[a-z]+$/i.test(specifier)) {
      return nextResolve(`${specifier}.ts`, context);
    }
    throw error;
  }
} });

// A cookie jar and browser events let these tests exercise the actual session/cache modules.
const jar = new Map();
// Browser-mode query garbage collection must not keep the Node test process alive for five minutes.
const originalSetTimeout = globalThis.setTimeout;
globalThis.setTimeout = (callback, delay, ...args) => {
  const timer = originalSetTimeout(callback, delay, ...args);
  if (delay >= 300000) timer.unref();
  return timer;
};
after(() => { globalThis.setTimeout = originalSetTimeout; });
const documentMock = new EventTarget();
Object.defineProperty(documentMock, "cookie", {
  get: () => [...jar].map(([key, value]) => `${key}=${value}`).join("; "),
  set: value => {
    const [pair, ...attributes] = value.split(";");
    const split = pair.indexOf("=");
    const key = pair.slice(0, split); const content = pair.slice(split + 1);
    const expiry = attributes.find(attribute => attribute.trim().toLowerCase().startsWith("expires="));
    if (expiry && new Date(expiry.trim().slice(8)).getTime() < Date.now()) jar.delete(key);
    else jar.set(key, content);
  },
});
documentMock.visibilityState = "visible";
const notices = [];
const windowMock = Object.assign(new EventTarget(), {
  localStorage: { setItem: (...args) => notices.push(args) },
  setInterval: () => 1, clearInterval: () => {},
});
Object.defineProperty(globalThis, "document", { configurable: true, value: documentMock });
Object.defineProperty(globalThis, "window", { configurable: true, value: windowMock });
Object.defineProperty(globalThis, "location", { configurable: true, value: new URL("https://site.example/settings") });
Object.defineProperty(globalThis, "navigator", { configurable: true, value: { locks: { request: (_name, callback) => callback() } } });

const state = await import("../src/requests/sessionState.ts");
const { getSessionQueryClient } = await import("../src/requests/sessionQueryClient.ts");
const { installSessionFetch } = await import("../src/requests/sessionFetch.ts");

function signIn(user = "alice", token = "old-access") {
  jar.set("token", token); jar.set("user", user); state.synchronizeSession();
}
function deferred() {
  let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve };
}
beforeEach(() => { state.endSession(); jar.clear(); notices.length = 0; signIn(); });
afterEach(() => state.endSession());

test("sign-out clears private queries and mutations before notifying UI subscribers", () => {
  const client = getSessionQueryClient();
  client.setQueryData(["user", "self"], { name: "Alice" });
  client.setQueryData(["message", "thread", 1], { private: "message" });
  client.setQueryData(["game", "detail", "draft"], { unpublished: true });
  client.getMutationCache().build(client, { mutationFn: async () => "private result" });
  const unsubscribe = state.subscribeSession(() => {
    assert.equal(client.getQueryCache().getAll().length, 0);
    assert.equal(client.getMutationCache().getAll().length, 0);
    assert.equal(state.getSessionSnapshot().signedIn, false);
  });
  state.endSession("old-access"); unsubscribe();
  assert.equal(jar.has("token"), false); assert.equal(jar.has("user"), false);
  assert.notEqual(getSessionQueryClient(), client);
  assert.equal(notices[0][0], state.SESSION_STORAGE_KEY);
  assert.doesNotMatch(notices[0][1], /alice|old-access/);
});

test("late queries and mutation callbacks cannot populate the next session's cache", async () => {
  const old = getSessionQueryClient(); const result = deferred();
  const pending = old.fetchQuery({ queryKey: ["private"], queryFn: () => result.promise }).catch(() => undefined);
  state.endSession(); signIn("bob", "new-access");
  result.resolve({ secret: "alice" }); await pending;
  old.setQueryData(["user", "self"], { name: "Alice" });
  assert.equal(getSessionQueryClient().getQueryData(["private"]), undefined);
  assert.equal(getSessionQueryClient().getQueryData(["user", "self"]), undefined);
  old.clear();
});

test("other tabs reset from a session-change event and never clear a newer login", () => {
  const cleanup = state.installSessionSync(); const previous = getSessionQueryClient();
  jar.delete("token"); jar.delete("user");
  const event = new Event("storage"); Object.defineProperty(event, "key", { value: state.SESSION_STORAGE_KEY });
  windowMock.dispatchEvent(event);
  assert.equal(state.getSessionSnapshot().signedIn, false);
  assert.notEqual(getSessionQueryClient(), previous);
  signIn("bob", "new-access");
  windowMock.dispatchEvent(event); state.endSession("old-access");
  assert.equal(state.getSessionSnapshot().username, "bob"); assert.equal(jar.get("token"), "new-access");
  cleanup();
});

test("natural cookie expiry clears identity and account caches on reconciliation", () => {
  const previous = getSessionQueryClient(); previous.setQueryData(["user", "self"], { name: "Alice" });
  jar.delete("token"); state.synchronizeSession();
  assert.equal(state.getSessionSnapshot().signedIn, false); assert.equal(jar.has("user"), false);
  assert.equal(previous.getQueryCache().getAll().length, 0);
});

test("failed refresh signs out immediately, while 403, 500 and network failures do not", async () => {
  for (const status of [401, 403, 500]) {
    signIn();
    windowMock.fetch = async request => new Response("{}", { status: typeof request === "string" ? status : 401 });
    installSessionFetch();
    const response = await windowMock.fetch("/api/v1/self", { headers: { Authorization: "Bearer old-access" } });
    assert.equal(response.status, 401);
    assert.equal(state.getSessionSnapshot().signedIn, status !== 401);
  }
  windowMock.fetch = async () => { throw new TypeError("Offline"); }; installSessionFetch();
  await assert.rejects(windowMock.fetch("/api/v1/self", { headers: { Authorization: "Bearer old-access" } }), /Offline/);
  assert.equal(state.getSessionSnapshot().signedIn, true);
});

test("a successful refresh retries without resetting account caches", async () => {
  const cache = getSessionQueryClient(); const revision = state.getSessionSnapshot().revision;
  windowMock.fetch = async request => {
    if (typeof request === "string") return Response.json({ token: "renewed" });
    assert.equal(request.cache, "no-store");
    return Response.json({}, { status: request.headers.get("Authorization") === "Bearer renewed" ? 200 : 401 });
  };
  installSessionFetch();
  assert.equal((await windowMock.fetch("/api/v1/self", { headers: { Authorization: "Bearer old-access" } })).status, 200);
  assert.equal(getSessionQueryClient(), cache); assert.equal(state.getSessionSnapshot().revision, revision);
});

test("a pending refresh cannot restore credentials after sign-out", async () => {
  const refresh = deferred(); const started = deferred();
  windowMock.fetch = async request => {
    if (typeof request === "string") { started.resolve(); return refresh.promise; }
    return Response.json({}, { status: 401 });
  };
  installSessionFetch();
  const pending = windowMock.fetch("/api/v1/self", { headers: { Authorization: "Bearer old-access" } });
  await started.promise; state.endSession();
  refresh.resolve(Response.json({ token: "must-not-restore" })); await pending;
  assert.equal(jar.has("token"), false); assert.equal(state.getSessionSnapshot().signedIn, false);
});

test("private responses arriving after sign-out are discarded", async () => {
  const response = deferred(); windowMock.fetch = () => response.promise; installSessionFetch();
  const pending = windowMock.fetch("/api/v1/messages/conversations", { headers: { Authorization: "Bearer old-access" } });
  state.endSession(); response.resolve(Response.json({ secret: "private" }));
  await assert.rejects(pending, { name: "AbortError" });
});
