import Cookies from "js-cookie";

export const SESSION_STORAGE_KEY = "account-session-change";
type SessionSnapshot = { signedIn: boolean; username: string | null; revision: number };
const listeners = new Set<() => void>();
const resets = new Set<() => void>();

function identity() {
  const token = Cookies.get("token");
  const signedIn = Boolean(token && token !== "null" && token !== "undefined");
  return { signedIn, username: signedIn ? Cookies.get("user") ?? null : null };
}
let snapshot: SessionSnapshot = { ...identity(), revision: 0 };
export const getSessionSnapshot = () => snapshot;
export function subscribeSession(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function registerSessionReset(reset: () => void) {
  resets.add(reset);
  return () => { resets.delete(reset); };
}

function announceChange() {
  // Notify other tabs without sharing a token or account details.
  try { window.localStorage.setItem(SESSION_STORAGE_KEY, crypto.randomUUID()); } catch { /* Storage may be unavailable. */ }
}
export function synchronizeSession(broadcast = false) {
  const next = identity();
  if (next.signedIn === snapshot.signedIn && next.username === snapshot.username) return;
  if (!next.signedIn) Cookies.remove("user", { path: "/" });
  snapshot = { ...next, revision: snapshot.revision + 1 };
  // Clear old caches before subscribers can render the new account state.
  for (const reset of resets) reset();
  for (const listener of listeners) listener();
  if (broadcast) announceChange();
}

export function endSession(expectedToken?: string) {
  // An old request must not log out a more recently authenticated session.
  if (expectedToken && Cookies.get("token") !== expectedToken) {
    synchronizeSession();
    return;
  }
  Cookies.remove("token", { path: "/" });
  Cookies.remove("user", { path: "/" });
  synchronizeSession();
  announceChange();
}

export function installSessionSync() {
  const sync = () => synchronizeSession();
  const onStorage = (event: StorageEvent) => { if (event.key === SESSION_STORAGE_KEY) sync(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener("focus", sync);
  window.addEventListener("pageshow", sync);
  document.addEventListener("visibilitychange", sync);
  // Cookie expiry does not emit a storage event; reconcile it while the app is open.
  const timer = window.setInterval(sync, 5000);
  sync();
  return () => {
    window.clearInterval(timer);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("focus", sync);
    window.removeEventListener("pageshow", sync);
    document.removeEventListener("visibilitychange", sync);
  };
}
