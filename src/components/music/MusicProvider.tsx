import { PlayerUIProvider } from "bioloom-miniplayer";
import { playerUI } from "./playerUI";
import { lazy, Suspense, type ReactNode } from "react";
import { MusicProvider as PlaybackProvider, type Listen, type TrackType } from "bioloom-miniplayer/core";
import { useSelf } from "@/hooks/queries";
import { useSession } from "@/hooks/useSession";
import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "@/requests/config";
import { recordContentView } from "@/requests/contentViews";
import { audioAnalysis } from "./audioAnalysis";

const MiniPlayer = lazy(() => import("bioloom-miniplayer/player"));

async function loadHistory(signal: AbortSignal): Promise<Listen[]> {
  const response = await fetch(`${BASE_URL}/music-history`, {
    credentials: "include", headers: { authorization: `Bearer ${getCookie("token")}` }, signal,
  });
  if (!response.ok) return [];
  const { data } = await response.json();
  return Array.isArray(data) ? data : [];
}

async function saveListen(item: Listen, signal: AbortSignal) {
  if (!item.id) return;
  const response = await fetch(`${BASE_URL}/music-history`, {
    method: "POST", credentials: "include", signal,
    headers: { "Content-Type": "application/json", authorization: `Bearer ${getCookie("token")}` },
    body: JSON.stringify({ eventId: item.eventId, trackId: item.id, playedAt: item.playedAt }),
  });
  if (!response.ok && response.status !== 404 && response.status !== 400) throw new Error("History sync failed");
}

function recordPlayback(track: TrackType) {
  if (track.id) void recordContentView("track", track.id, "playback");
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const { data: user } = useSelf();
  const session = useSession();
  const accountId = session.signedIn ? user?.id : undefined;
  const storageKey = session.signedIn
    ? accountId ? `music_history_v1_account_${accountId}` : null
    : "music_history_v1_guest";

  return <PlayerUIProvider value={playerUI}><PlaybackProvider
    analysis={audioAnalysis}
    history={{ storageKey, load: accountId ? loadHistory : undefined, save: accountId ? saveListen : undefined }}
    onPlayback={recordPlayback}
    player={<Suspense fallback={null}><MiniPlayer /></Suspense>}
  >{children}</PlaybackProvider></PlayerUIProvider>;
}
