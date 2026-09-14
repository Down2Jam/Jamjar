import { Button, Hstack, Spinner, Text, Vstack } from "bioloom-ui";
import { useOAuthSettings } from "./useOAuthSettings";

type Connection = { id: string; scopes: string[]; permissions: string[]; app: { name: string } };

export default function ConnectedAppsSection() {
  const { items, loading, busy, error, act } = useOAuthSettings<Connection>("connections");
  return <div className="game-editor-row">
    <Vstack align="start" className="gap-3">
      <div>
        <Text color="text">Apps with access</Text>
        <Text color="textFaded" size="xs">Apps you have allowed to use your account. Review their permissions or revoke access.</Text>
      </div>
      <div className="w-full min-w-0 space-y-3">
        {error && <p role="alert">{error}</p>}
        {loading ? <Hstack><Spinner /><Text size="sm" color="textFaded">Loading connected apps…</Text></Hstack>
          : !items.length && !error && <Text size="sm" color="textFaded">No connected apps yet.</Text>}
        {items.map(connection => <div key={connection.id} className="flex flex-col items-start justify-between gap-3 rounded-lg border border-gray-700 px-3 py-2 sm:flex-row">
          <div className="min-w-0 space-y-1">
            <Text size="sm" className="break-words">{connection.app.name}</Text>
            <ul className="list-disc pl-4 text-xs">{(connection.permissions ?? connection.scopes).map(permission => <li key={permission}>{permission}</li>)}</ul>
          </div>
          <Button type="button" size="sm" color="red" variant="ghost" disabled={busy} className="shrink-0" onClick={() => act("DELETE", { id: connection.id })}>Revoke access</Button>
        </div>)}
      </div>
    </Vstack>
  </div>;
}
