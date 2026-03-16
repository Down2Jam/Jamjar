import { invalidateRequestCache } from "./cache";
import { BASE_URL } from "./config";

export async function signup(
  username: string,
  password: string,
  email: string
) {
  return fetch(`${BASE_URL}/user`, {
    body: JSON.stringify({ username, password, email }),
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
}

export async function login(username: string, password: string) {
  return fetch(`${BASE_URL}/session`, {
    method: "POST",
    body: JSON.stringify({ username, password }),
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
}

export async function logout() {
  const response = await fetch(`${BASE_URL}/session`, {
    method: "DELETE",
    credentials: "include",
  });

  if (response.ok) {
    invalidateRequestCache(/\/(self|user|jam|games|tracks|posts|events|results)/);
  }

  return response;
}
