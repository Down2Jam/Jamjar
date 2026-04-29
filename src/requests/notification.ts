import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";

function authHeaders(contentType = false) {
  return {
    ...(contentType ? { "Content-Type": "application/json" } : {}),
    authorization: `Bearer ${getCookie("token")}`,
  };
}

export async function listNotifications() {
  return fetch(`${BASE_URL}/notifications`, {
    headers: authHeaders(),
    credentials: "include",
  });
}

export async function markAllNotificationsRead() {
  return fetch(`${BASE_URL}/notifications/read-all`, {
    method: "PUT",
    headers: authHeaders(),
    credentials: "include",
  });
}

export async function updateNotification(
  id: number,
  payload: { read?: boolean; archived?: boolean },
) {
  const action = payload.archived ? "archive" : payload.read === false ? "unread" : "read";
  return fetch(`${BASE_URL}/notifications/${id}`, {
    body: JSON.stringify({ action }),
    method: "PUT",
    headers: authHeaders(true),
    credentials: "include",
  });
}

export async function deleteNotification(id: number) {
  return fetch(`${BASE_URL}/notifications/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
    credentials: "include",
  });
}

export async function getNotificationPreferences() {
  return fetch(`${BASE_URL}/notifications/preferences`, {
    headers: authHeaders(),
    credentials: "include",
  });
}

export async function updateNotificationPreferences(payload: Record<string, unknown>) {
  return fetch(`${BASE_URL}/notifications/preferences`, {
    body: JSON.stringify(payload),
    method: "PUT",
    headers: authHeaders(true),
    credentials: "include",
  });
}
