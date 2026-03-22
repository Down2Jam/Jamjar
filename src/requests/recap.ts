import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";

export async function getRecapVisibility(userSlug?: string, jamId?: number) {
  const params = new URLSearchParams();
  if (userSlug) {
    params.set("userSlug", userSlug);
  }
  if (Number.isInteger(jamId)) {
    params.set("jamId", String(jamId));
  }

  const query = params.toString();

  return fetch(`${BASE_URL}/recap${query ? `?${query}` : ""}`, {
    headers: {
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
  });
}

export async function updateRecapVisibility(jamId: number, isPublic: boolean) {
  return fetch(`${BASE_URL}/recap`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
    body: JSON.stringify({
      jamId,
      isPublic,
    }),
  });
}
