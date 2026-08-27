import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";

function authHeaders(json = false) {
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    authorization: `Bearer ${getCookie("token")}`,
  };
}

export function listConversations(box: "messages" | "requests" | "archived") {
  return fetch(`${BASE_URL}/messages/conversations?box=${box}`, {
    headers: authHeaders(),
    credentials: "include",
  });
}

export function getMessageCounts() {
  return fetch(`${BASE_URL}/messages/counts`, {
    headers: authHeaders(),
    credentials: "include",
  });
}

export function getConversationMessages(conversationId: number) {
  return fetch(`${BASE_URL}/messages/conversations/${conversationId}/messages`, {
    headers: authHeaders(),
    credentials: "include",
  });
}

export function createConversation(payload: {
  recipientSlugs: string[];
  name?: string | null;
  body: string;
}) {
  return fetch(`${BASE_URL}/messages/conversations`, {
    method: "POST",
    headers: authHeaders(true),
    credentials: "include",
    body: JSON.stringify(payload),
  });
}

export function sendMessage(conversationId: number, body: string) {
  return fetch(`${BASE_URL}/messages/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: authHeaders(true),
    credentials: "include",
    body: JSON.stringify({ body }),
  });
}

export function updateConversation(
  conversationId: number,
  action: "accept" | "decline" | "read" | "archive" | "unarchive" | "mute" | "unmute",
) {
  return fetch(`${BASE_URL}/messages/conversations/${conversationId}`, {
    method: "PUT",
    headers: authHeaders(true),
    credentials: "include",
    body: JSON.stringify({ action }),
  });
}

export function blockUser(slug: string) {
  return fetch(`${BASE_URL}/users/${encodeURIComponent(slug)}/block`, {
    method: "PUT",
    headers: authHeaders(),
    credentials: "include",
  });
}
