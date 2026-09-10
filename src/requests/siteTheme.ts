import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";

export async function updateCurrentSiteTheme(themeName: string) {
  const tokenCookie = getCookie("token");
  if (!tokenCookie) return null;

  return fetch(`${BASE_URL}/site-themes/current`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${tokenCookie}`,
    },
    credentials: "include",
    body: JSON.stringify({ themeName }),
  });
}
