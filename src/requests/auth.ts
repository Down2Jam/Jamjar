import { BASE_URL } from "./config";

export async function signup(
  username: string,
  password: string,
  email: string
) {
  return fetch(`${BASE_URL}/users`, {
    body: JSON.stringify({
      username,
      password,
      email: email.trim() ? email.trim() : null,
    }),
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
  return fetch(`${BASE_URL}/session`, {
    method: "DELETE",
    credentials: "include",
  });
}
