import { getCookie } from "@/helpers/cookie";
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

export async function getGameTokens() {
  return fetch(`${BASE_URL}/self/game-tokens`, {
    headers: { authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
  });
}

export async function revokeGameToken(id: string) {
  return fetch(`${BASE_URL}/self/game-tokens`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
    body: JSON.stringify({ id }),
  });
}

export async function approveDeviceCode(userCode: string) {
  return fetch(`${BASE_URL}/device/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
    body: JSON.stringify({ userCode }),
  });
}

export async function denyDeviceCode(userCode: string) {
  return fetch(`${BASE_URL}/device/deny`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
    body: JSON.stringify({ userCode }),
  });
}
