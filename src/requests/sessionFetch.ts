import Cookies from "js-cookie";
import { endSession, getSessionSnapshot, synchronizeSession } from "./sessionState";

// Install once at startup so existing API callers participate in explicit token refresh.
export function installSessionFetch() {
  const originalFetch = window.fetch.bind(window);
  let refreshing: Promise<string | null> | null = null;
  const refresh = (failedToken: string | undefined) => {
    if (refreshing) return refreshing;
    const run = async () => {
      const revision = getSessionSnapshot().revision;
      const current = Cookies.get("token");
      if (current && current !== failedToken) return current;
      if (!current) { synchronizeSession(); return null; }
      const response = await originalFetch("/api/v1/session/refresh", { method: "POST", credentials: "include" });
      if (getSessionSnapshot().revision !== revision) return null;
      if (Cookies.get("token") !== current) { synchronizeSession(); return Cookies.get("token") ?? null; }
      if (!response.ok) {
        if (response.status === 401) endSession(current);
        return null;
      }
      const json = await response.json();
      if (getSessionSnapshot().revision !== revision || Cookies.get("token") !== current) return null;
      const token = (json.data ?? json).token;
      if (typeof token !== "string") return null;
      Cookies.set("token", token, { expires: 30, path: "/", sameSite: "strict", secure: location.protocol === "https:" });
      return token;
    };
    // Coordinate tabs: a second refresh with the old token would correctly revoke its family.
    refreshing = (navigator.locks ? navigator.locks.request("session-refresh", run) : run())
      .finally(() => { refreshing = null; });
    return refreshing;
  };
  window.fetch = async (input, init) => {
    let request = new Request(input instanceof Request ? input : new URL(String(input), location.href), init);
    const url = new URL(request.url);
    if (url.origin !== location.origin || !url.pathname.startsWith("/api/v1/") || url.pathname.startsWith("/api/v1/session")) {
      return originalFetch(request);
    }
    const failedToken = Cookies.get("token");
    const auth = request.headers.get("Authorization");
    synchronizeSession();
    const revision = getSessionSnapshot().revision;
    if (auth) request = new Request(request, { cache: "no-store" });
    const retry = request.clone();
    const response = await originalFetch(request);
    if (auth && getSessionSnapshot().revision !== revision) throw new DOMException("Session changed", "AbortError");
    if (response.status !== 401 || !failedToken || auth !== `Bearer ${failedToken}`) return response;
    const token = await refresh(failedToken);
    if (!token) return response;
    const headers = new Headers(retry.headers);
    headers.set("Authorization", `Bearer ${token}`);
    const retried = await originalFetch(new Request(retry, { headers }));
    if (getSessionSnapshot().revision !== revision) throw new DOMException("Session changed", "AbortError");
    if (retried.status === 401) endSession(token);
    return retried;
  };
  // Keep the short-lived media cookie usable while the website is active.
  const renewActiveSession = () => {
    const token = Cookies.get("token");
    if (token && document.visibilityState === "visible") void refresh(token).catch(() => {});
  };
  window.setInterval(renewActiveSession, 12 * 60 * 1000);
  document.addEventListener("visibilitychange", renewActiveSession);
}
