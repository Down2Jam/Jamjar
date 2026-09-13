import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";

export async function updateCurrentLanguage(locale: string) {
  const token = getCookie("token");
  if (!token) return;
  const response = await fetch(`${BASE_URL}/languages/current`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
    credentials: "include",
    body: JSON.stringify({ locale }),
  });
  if (!response.ok) throw new Error("Couldn't save your language. Please try again.");
}
