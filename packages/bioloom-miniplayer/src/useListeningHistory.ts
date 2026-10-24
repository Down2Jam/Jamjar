import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { useSelf } from "@/hooks/queries";
import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "@/requests/config";
import type { TrackType } from "./MusicContext";
import { sessionTrack } from "./session";

type Listen = TrackType & { eventId: string; playedAt: number; synced?: boolean };
const limit = 500;
function read(key: string | null): Listen[] {
  if (!key) return [];
  try {
    const data = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(data) ? data.filter(item => typeof item.eventId === "string" && Number.isFinite(item.playedAt)
      && typeof item.name === "string" && typeof item.url === "string" && /^(https?:\/\/|\/[^/])/.test(item.url) && item.game && item.composer).slice(0, limit) : [];
  } catch { return []; }
}
function merge(...groups: Listen[][]) {
  return [...new Map(groups.flat().map(item => [item.eventId, item])).values()].sort((a, b) => b.playedAt - a.playedAt).slice(0, limit);
}
export function useListeningHistory() {
  const { data: user } = useSelf();
  const session = useSession();
  const key = session.signedIn ? user?.id ? `music_history_v1_account_${user.id}` : null : "music_history_v1_guest";
  const pendingIdentity = useRef<Listen[]>([]);
  const [store, setStore] = useState(() => ({ key, entries: read(key) }));
  const [active, setActive] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const inFlight = useRef(new Set<string>());
  const entries = store.key === key ? store.entries : [];
  const latest = useRef(store);
  latest.current = store;
  const update = useCallback((items: Listen[]) => {
    if (!key) return;
    setStore(previous => ({ key, entries: merge(previous.key === key ? previous.entries : read(key), items) }));
  }, [key]);
  useEffect(() => {
    const buffered = key ? pendingIdentity.current.splice(0) : [];
    setStore({ key, entries: merge(read(key), buffered) });
    setActive(null);
    if (!user?.id) return;
    const controller = new AbortController();
    void fetch(`${BASE_URL}/music-history`, { credentials: "include", headers: { authorization: `Bearer ${getCookie("token")}` }, signal: controller.signal })
      .then(async response => { if (!response.ok) return; const { data } = await response.json();
        if (!controller.signal.aborted && Array.isArray(data)) update(data.map(item => ({ ...item, synced: true }))); }).catch(() => {});
    return () => controller.abort();
  }, [key, user?.id, update]);
  useEffect(() => {
    if (!key || store.key !== key) return;
    try { localStorage.setItem(key, JSON.stringify(store.entries)); } catch {}
  }, [key, store]);
  useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener("online", refresh);
    return () => { clearInterval(timer); window.removeEventListener("online", refresh); };
  }, []);
  useEffect(() => {
    if (!user?.id || !key) return;
    const controller = new AbortController();
    const snapshot = latest.current.key === key ? latest.current.entries : read(key);
    void (async () => {
      for (const item of snapshot.filter(item => !item.synced && item.id)) {
        if (controller.signal.aborted) break;
        const requestKey = `${key}:${item.eventId}`;
        if (inFlight.current.has(requestKey)) continue;
        inFlight.current.add(requestKey);
        try {
          const response = await fetch(`${BASE_URL}/music-history`, { method: "POST", credentials: "include", signal: controller.signal,
            headers: { "Content-Type": "application/json", authorization: `Bearer ${getCookie("token")}` }, body: JSON.stringify({ eventId: item.eventId, trackId: item.id, playedAt: item.playedAt }) });
          if (!response.ok && response.status !== 404 && response.status !== 400) break;
          if (!controller.signal.aborted) update([{ ...item, synced: true }]);
        } catch { break; }
        finally { inFlight.current.delete(requestKey); }
      }
    })();
    return () => controller.abort();
  }, [key, user?.id, revision, update]);
  const recordListen = useCallback((track: TrackType) => {
    const item = { ...sessionTrack(track), eventId: crypto.randomUUID(), playedAt: Date.now() };
    setActive(item.eventId);
    if (!key) { pendingIdentity.current.push(item); return; }
    update([item]);
    setRevision(value => value + 1);
    // Also persist immediately so closing the tab after playback starts is safe.
    try { localStorage.setItem(key, JSON.stringify(merge(read(key), [item]))); } catch {}
  }, [key, update]);
  return { history: entries.filter(item => item.eventId !== active), recordListen };
}
