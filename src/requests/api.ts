import { getCookie } from "@/helpers/cookie";
import { API_DOCS_URL, BASE_URL } from "./config";

function authHeaders(contentType = false) {
  return {
    ...(contentType ? { "Content-Type": "application/json" } : {}),
    authorization: `Bearer ${getCookie("token")}`,
  };
}

export async function getApiCapabilities() {
  return fetch(`${BASE_URL}/capabilities`);
}

export async function getOpenApiDocument() {
  return fetch(`${BASE_URL}/openapi`);
}

export function getApiDocsUrl() {
  return API_DOCS_URL;
}

export async function createReport(payload: {
  targetType: "user" | "post" | "comment" | "game" | "collection_comment";
  targetId: number | string;
  reason: string;
  details?: string;
  priority?: "low" | "normal" | "high" | "urgent";
}) {
  return fetch(`${BASE_URL}/reports`, {
    body: JSON.stringify(payload),
    method: "POST",
    headers: authHeaders(true),
    credentials: "include",
  });
}
