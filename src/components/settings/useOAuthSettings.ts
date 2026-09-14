import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useSession } from "@/hooks/useSession";

export function useOAuthSettings<T>(resource: "apps" | "connections") {
  const { signedIn } = useSession();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function request(method = "GET", body?: object): Promise<T[]> {
    const response = await fetch(`/api/v1/oauth/${resource}`, {
      method, credentials: "include",
      headers: { Authorization: `Bearer ${Cookies.get("token")}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error?.message ?? "Request failed. Please try again.");
    return json.data ?? json;
  }

  useEffect(() => {
    let active = true;
    if (!signedIn) { setItems([]); setLoading(false); return; }
    setLoading(true);
    request().then(items => { if (active) setItems(items); })
      .catch(error => { if (active) setError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [resource, signedIn]);

  async function act(method: string, body: object) {
    setBusy(true); setError("");
    try { await request(method, body); setItems(await request()); return true; }
    catch (error) { setError(error instanceof Error ? error.message : "Request failed."); return false; }
    finally { setBusy(false); }
  }
  return { items, loading, busy, error, act };
}
