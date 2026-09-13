import { useEffect, useRef, useState } from "react";
import { Button, Card, Spinner } from "bioloom-ui";
import { twitchRequest } from "@/requests/twitch";

export default function TwitchCallback() {
  const [params] = useState(() => new URLSearchParams(window.location.search));
  const [error, setError] = useState("");
  const pending = useRef<Promise<unknown> | null>(null);
  useEffect(() => {
    // Remove the temporary authorization code before loading any other page.
    window.history.replaceState(null, "", window.location.pathname);
    if (params.get("error")) { setError("Twitch connection cancelled. Your existing connection hasn’t changed."); return; }
    const code = params.get("code");
    const state = params.get("state");
    if (!code || !state) { setError("This connection link is incomplete. Start again from Settings."); return; }
    let active = true;
    pending.current ??= twitchRequest({ action: "complete", code, state });
    pending.current.then(() => { if (active) window.location.replace("/settings?tab=streams&twitch=connected"); })
      .catch((error) => { if (active) setError(error instanceof Error ? error.message : "Could not connect Twitch."); });
    return () => { active = false; };
  }, [params]);
  return <main className="mx-auto mt-12 w-full max-w-lg px-4"><Card shadow="none"><h1 className="mb-4 text-xl font-semibold">Connect Twitch</h1>{error ? <><p role="alert" className="mb-4 text-sm">{error}</p><Button href="/settings?tab=streams">Back to Streams settings</Button></> : <div role="status" className="flex items-center gap-3"><Spinner /><p>Verifying your Twitch username…</p></div>}</Card></main>;
}
