import { type CSSProperties, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Button, Hstack, Icon, Spinner, Text, Vstack } from "bioloom-ui";
import { useTheme } from "@/providers/useSiteTheme";
import { useSession } from "@/hooks/useSession";
import "@/components/game-editing-form/game-editor.css";
import "@/components/form-editor.css";

type Preview = { name: string; redirectUri: string; scopes: Array<{ id: string; description: string }> };
export default function AuthorizeAppPage() {
  const { colors } = useTheme();
  const { signedIn } = useSession();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [previewResult, setPreviewResult] = useState("");
  const query = location.search;
  const isDemo = import.meta.env.DEV && new URLSearchParams(query).get("preview") === "1";
  useEffect(() => {
    if (isDemo) {
      setPreview({ name: "Jam Companion", redirectUri: "https://example.com/callback", scopes: [
        { id: "profile:read", description: "Read your profile" },
        { id: "games:read", description: "Read games, leaderboards, and achievements" },
      ] });
      return;
    }
    fetch(`/api/v1/oauth/request${query}`).then(async response => {
      if (!response.ok) throw new Error("This app authorization request is invalid or has been disabled.");
      const json = await response.json(); setPreview(json.data ?? json);
    }).catch(error => setError(error.message));
  }, [query, isDemo]);
  async function decide(approved: boolean) {
    if (isDemo) {
      setPreviewResult(approved ? "Preview: access approved. A real request would return you to the app." : "Preview: access declined. A real request would return you to the app.");
      return;
    }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/v1/oauth/authorize", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${Cookies.get("token")}` },
        body: JSON.stringify({ ...Object.fromEntries(new URLSearchParams(query)), approved }),
      });
      if (!response.ok) throw new Error("Authorization failed. Sign in again and retry.");
      const json = await response.json(); location.assign((json.data ?? json).redirectUri);
    } catch (error) { setError(error instanceof Error ? error.message : "Authorization failed."); setBusy(false); }
  }
  return <main className="mx-auto w-full max-w-2xl" style={{
    "--editor-surface": colors.mantle, "--editor-text": colors.text,
    "--editor-accent": colors.blue, color: colors.text,
  } as CSSProperties}>
    <section className="form-editor-panel settings-editor-panel" aria-labelledby="authorize-heading">
      <header className="game-editor-panel-heading">
        <Vstack align="start">
          <Hstack><Icon name="code" color="text" size={28} /><h1 id="authorize-heading" className="text-2xl font-bold">Authorize an app</h1></Hstack>
          <Text size="sm" color="textFaded">Choose whether to give this app access to your Down2Jam account.</Text>
        </Vstack>
      </header>
      {isDemo && <div className="game-editor-block" role="note"><Text size="xs" color="textFaded">Development preview · No account access will be granted.</Text></div>}
      {previewResult && <div className="game-editor-block" role="status"><Text size="sm">{previewResult}</Text></div>}
      {!preview && !error && <div className="game-editor-block" role="status"><Hstack><Spinner /><Text size="sm" color="textFaded">Loading authorization request…</Text></Hstack></div>}
      {error && <div className="game-editor-block" role="alert" style={{ color: colors.red }}>{error}</div>}
      {preview && <>
        <div className="game-editor-block space-y-4">
          <div>
            <h2 className="break-words text-xl font-semibold">{preview.name}</h2>
            <Text size="sm" color="textFaded">This app is requesting permission to:</Text>
          </div>
          <ul className="list-disc space-y-3 pl-5 text-sm">{preview.scopes.map(scope => <li key={scope.id}>{scope.description}</li>)}</ul>
        </div>
        <div className="game-editor-block space-y-2">
          <Text size="sm" weight="semibold">Return address</Text>
          <p className="break-all text-sm" style={{ color: colors.textFaded }}>{preview.redirectUri}</p>
          <Text size="xs" color="textFaded">Only approve apps you trust. You can revoke access in Settings → Tokens.</Text>
        </div>
        <div className="game-editor-block flex flex-wrap justify-end gap-3">
          {isDemo || signedIn ? <>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => decide(false)}>Cancel</Button>
            <Button type="button" color="blue" disabled={busy} loading={busy} onClick={() => decide(true)}>Allow access</Button>
          </> : <Button href={`/login?returnTo=${encodeURIComponent(location.pathname + query)}`}>Sign in to continue</Button>}
        </div>
      </>}
    </section>
  </main>;
}
