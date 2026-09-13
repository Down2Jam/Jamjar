import { useEffect, useState } from "react";
import { Button, Hstack, Text } from "bioloom-ui";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/queries/queryKeys";
import { twitchRequest } from "@/requests/twitch";
import { useTheme } from "@/providers/useSiteTheme";

export default function TwitchConnection({ username, onDisconnected }: { username?: string | null; onDisconnected: () => void }) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    twitchRequest<{ configured: boolean }>().then((data) => { if (active) setConfigured(data.configured); })
      .catch(() => { if (active) { setConfigured(false); setError("Twitch connection is temporarily unavailable."); } });
    return () => { active = false; };
  }, []);

  return <div className="space-y-3">
    <div><Text color="text">Connected Twitch channel</Text><Text color="textFaded" size="xs">Connect on Twitch to verify your username. No email, chat, stream key, or channel-management permissions are requested.</Text></div>
    {username && <a className="inline-block text-sm font-medium hover:underline" href={`https://www.twitch.tv/${encodeURIComponent(username)}`} target="_blank" rel="noopener noreferrer">twitch.tv/{username}</a>}
    <Hstack wrap>
      <Button type="button" color="purple" icon="sitwitch" disabled={busy || configured !== true} onClick={async () => {
        setBusy(true); setError("");
        try {
          const { url } = await twitchRequest<{ url: string }>({ action: "start" });
          window.location.assign(url);
        } catch (error) { setError(error instanceof Error ? error.message : "Could not connect Twitch."); setBusy(false); }
      }}>{busy ? "Please wait…" : username ? "Reconnect Twitch" : "Connect Twitch"}</Button>
      {username && <Button type="button" variant="ghost" disabled={busy} onClick={async () => {
        setBusy(true); setError("");
        try { await twitchRequest({ action: "disconnect" }); onDisconnected(); await queryClient.invalidateQueries({ queryKey: queryKeys.user.all }); }
        catch (error) { setError(error instanceof Error ? error.message : "Could not disconnect Twitch."); }
        finally { setBusy(false); }
      }}>Disconnect</Button>}
    </Hstack>
    {configured === false && !error && <Text size="xs" color="textFaded">Twitch connection hasn’t been enabled by the site administrator yet.</Text>}
    {error && <p role="alert" className="text-sm" style={{ color: colors.red }}>{error}</p>}
    {username && new URLSearchParams(window.location.search).get("twitch") === "connected" && <p role="status" className="text-sm" style={{ color: colors.green }}>Twitch connected successfully.</p>}
  </div>;
}
