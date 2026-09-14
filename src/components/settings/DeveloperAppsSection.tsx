import { useState } from "react";
import { Button, Hstack, Icon, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Spinner, Text, Vstack } from "bioloom-ui";
import { useOAuthSettings } from "./useOAuthSettings";

type App = { id: string; name: string; redirectUris: string[]; disabledAt: string | null };
export const DEVELOPER_APP_FORM_ID = "developer-app-registration";

export default function DeveloperAppsSection() {
  const { items, loading, busy, error, act } = useOAuthSettings<App>("apps");
  const [name, setName] = useState("");
  const [uri, setUri] = useState("");
  const [registering, setRegistering] = useState(false);
  return <div className="form-editor-panel settings-editor-panel">
    <div className="game-editor-panel-heading">
      <Vstack align="start">
        <Hstack><Icon name="code" color="text" size={28} /><Text size="2xl" color="text" weight="bold">Your apps</Text></Hstack>
        <Text size="sm" color="textFaded">Register your apps for people to be able to sign in with their Down2Jam account</Text>
      </Vstack>
    </div>
    {error && !registering && <div role="alert" className="game-editor-block">{error}</div>}
    <div className="game-editor-block">
      <Button type="button" disabled={busy || loading} onClick={() => setRegistering(true)}>Register app</Button>
    </div>
    <Modal isOpen={registering} onOpenChange={open => { if (!busy) setRegistering(Boolean(open)); }} size="lg">
      <ModalContent>
        <ModalHeader className="pr-14 text-lg font-semibold">Register app</ModalHeader>
        <ModalBody className="space-y-4">
          {error && <p role="alert">{error}</p>}
          <Input id="developer-app-name" form={DEVELOPER_APP_FORM_ID} name="appName" label="App name" labelPlacement="outside" autoFocus required maxLength={100} value={name} onValueChange={setName} placeholder="Your app name" fullWidth />
          <div className="space-y-2">
            <Input id="developer-app-redirect" form={DEVELOPER_APP_FORM_ID} name="redirectUri" label="Redirect URL" labelPlacement="outside" type="url" required value={uri} onValueChange={setUri} placeholder="https://your-app.example/callback" fullWidth />
            <Text size="xs" color="textFaded">Where users return after approving access.</Text>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="ghost" disabled={busy} onClick={() => setRegistering(false)}>Cancel</Button>
          <Button type="submit" form={DEVELOPER_APP_FORM_ID} disabled={busy} loading={busy} onClick={async event => {
            event.preventDefault();
            const form = document.getElementById(DEVELOPER_APP_FORM_ID) as HTMLFormElement | null;
            if (!form?.reportValidity()) return;
            if (await act("POST", { name, redirectUris: [uri] })) { setName(""); setUri(""); setRegistering(false); }
          }}>Register app</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
    {loading && <div className="game-editor-block"><Hstack><Spinner /><Text color="textFaded">Loading your apps…</Text></Hstack></div>}
    {items.map(app => <div key={app.id} className="game-editor-block space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="break-all font-semibold">{app.name}{app.disabledAt ? " (disabled)" : ""}</h3>
        {!app.disabledAt && <Button type="button" size="sm" color="red" variant="ghost" disabled={busy} onClick={() => act("DELETE", { id: app.id })}>Disable app and its access</Button>}
      </div>
      <dl className="space-y-2 text-sm">
        <div><dt className="opacity-70">Client ID</dt><dd><code className="break-all">{app.id}</code></dd></div>
        <div><dt className="opacity-70">Redirect URL</dt><dd className="break-all">{app.redirectUris.join(", ")}</dd></div>
      </dl>
    </div>)}
  </div>;
}
