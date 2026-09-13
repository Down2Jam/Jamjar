import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";

export async function twitchRequest<T>(body?: object): Promise<T> {
  const response = await fetch(`${BASE_URL}/connections/twitch`, {
    method: body ? "POST" : "GET", credentials: "include", cache: "no-store",
    headers: { "Content-Type": "application/json", authorization: `Bearer ${getCookie("token")}` },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(response.status === 401 ? "Please sign in again, then connect Twitch from Settings." : result?.error?.message ?? "Could not connect Twitch. Please try again.");
  }
  return result.data ?? result;
}
