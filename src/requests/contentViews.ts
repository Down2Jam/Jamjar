import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";

const sent = new Set<string>();
export async function recordContentView(kind: "game" | "track", id: number, trigger: "page" | "playback", signal?: AbortSignal) {
  let anonymousId: string;
  try {
    const stored = localStorage.getItem("content_view_visitor");
    anonymousId = stored && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stored) ? stored : crypto.randomUUID();
    localStorage.setItem("content_view_visitor", anonymousId);
  } catch { return; }
  const token = getCookie("token");
  const key = `${new Date().toISOString().slice(0, 10)}:${kind}:${id}:${token ?? "guest"}`;
  if (sent.has(key)) return;
  sent.add(key);
  try {
    const response = await fetch(`${BASE_URL}/content-views`, { method: "POST", credentials: "include", signal,
      headers: { "Content-Type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ kind, id, trigger, anonymousId, ...(trigger === "page" ? { dwellMs: 2000 } : {}) }),
    });
    if (!response.ok) sent.delete(key);
  } catch { sent.delete(key); }
}
