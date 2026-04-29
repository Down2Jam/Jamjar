import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";

function platformHeaders(contentType = false) {
  return {
    ...(contentType ? { "Content-Type": "application/json" } : {}),
    authorization: `Bearer ${getCookie("token")}`,
  };
}

function withQuery(path: string, params?: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) query.set(key, String(value));
  }

  return `${BASE_URL}${path}${query.size ? `?${query.toString()}` : ""}`;
}

export async function listAuditEntries(params?: { limit?: number }) {
  return fetch(withQuery("/platform/audit", params), {
    headers: platformHeaders(),
    credentials: "include",
  });
}

export async function listWebhooks() {
  return fetch(`${BASE_URL}/platform/webhooks`, {
    headers: platformHeaders(),
    credentials: "include",
  });
}

export async function createWebhook(payload: Record<string, unknown>) {
  return fetch(`${BASE_URL}/platform/webhooks`, {
    body: JSON.stringify(payload),
    method: "POST",
    headers: platformHeaders(true),
    credentials: "include",
  });
}

export async function updateWebhook(payload: Record<string, unknown>) {
  return fetch(`${BASE_URL}/platform/webhooks`, {
    body: JSON.stringify(payload),
    method: "PUT",
    headers: platformHeaders(true),
    credentials: "include",
  });
}

export async function deleteWebhook(payload: Record<string, unknown>) {
  return fetch(`${BASE_URL}/platform/webhooks`, {
    body: JSON.stringify(payload),
    method: "DELETE",
    headers: platformHeaders(true),
    credentials: "include",
  });
}

export async function listPlatformEvents(params?: {
  after?: string;
  limit?: number;
}) {
  return fetch(withQuery("/platform/events", params), {
    headers: platformHeaders(),
    credentials: "include",
  });
}

export async function getCheckpoint(consumerId: string) {
  return fetch(withQuery("/platform/checkpoints", { consumerId }), {
    headers: platformHeaders(),
    credentials: "include",
  });
}

export async function saveCheckpoint(payload: Record<string, unknown>) {
  return fetch(`${BASE_URL}/platform/checkpoints`, {
    body: JSON.stringify(payload),
    method: "POST",
    headers: platformHeaders(true),
    credentials: "include",
  });
}

export async function listRoles() {
  return fetch(`${BASE_URL}/platform/roles`, {
    headers: platformHeaders(),
    credentials: "include",
  });
}

export async function createRole(payload: Record<string, unknown>) {
  return fetch(`${BASE_URL}/platform/roles`, {
    body: JSON.stringify(payload),
    method: "POST",
    headers: platformHeaders(true),
    credentials: "include",
  });
}

export async function deleteRole(payload: Record<string, unknown>) {
  return fetch(`${BASE_URL}/platform/roles`, {
    body: JSON.stringify(payload),
    method: "DELETE",
    headers: platformHeaders(true),
    credentials: "include",
  });
}

export async function listServiceKeys() {
  return fetch(`${BASE_URL}/platform/service-keys`, {
    headers: platformHeaders(),
    credentials: "include",
  });
}

export async function createServiceKey(payload: Record<string, unknown>) {
  return fetch(`${BASE_URL}/platform/service-keys`, {
    body: JSON.stringify(payload),
    method: "POST",
    headers: platformHeaders(true),
    credentials: "include",
  });
}

export async function rotateServiceKey(payload: Record<string, unknown>) {
  return fetch(`${BASE_URL}/platform/service-keys`, {
    body: JSON.stringify(payload),
    method: "PUT",
    headers: platformHeaders(true),
    credentials: "include",
  });
}

export async function revokeServiceKey(payload: Record<string, unknown>) {
  return fetch(`${BASE_URL}/platform/service-keys`, {
    body: JSON.stringify(payload),
    method: "DELETE",
    headers: platformHeaders(true),
    credentials: "include",
  });
}

export async function listJobs() {
  return fetch(`${BASE_URL}/platform/jobs`, {
    headers: platformHeaders(),
    credentials: "include",
  });
}

export async function manageJob(payload: Record<string, unknown>) {
  return fetch(`${BASE_URL}/platform/jobs`, {
    body: JSON.stringify(payload),
    method: "PUT",
    headers: platformHeaders(true),
    credentials: "include",
  });
}

export async function incrementalSync(params?: { since?: string; limit?: number }) {
  return fetch(withQuery("/platform/sync", params), {
    headers: platformHeaders(),
    credentials: "include",
  });
}

export async function getSearchAdmin(params?: {
  mode?: string;
  entityType?: string;
  entityId?: number;
  limit?: number;
}) {
  return fetch(withQuery("/platform/search", params), {
    headers: platformHeaders(),
    credentials: "include",
  });
}

export async function createSearchAdminAction(payload: Record<string, unknown>) {
  return fetch(`${BASE_URL}/platform/search`, {
    body: JSON.stringify(payload),
    method: "POST",
    headers: platformHeaders(true),
    credentials: "include",
  });
}

export async function updateSearchSettings(payload: Record<string, unknown>) {
  return fetch(`${BASE_URL}/platform/search`, {
    body: JSON.stringify(payload),
    method: "PUT",
    headers: platformHeaders(true),
    credentials: "include",
  });
}

export async function deleteSearchSynonym(payload: Record<string, unknown>) {
  return fetch(`${BASE_URL}/platform/search`, {
    body: JSON.stringify(payload),
    method: "DELETE",
    headers: platformHeaders(true),
    credentials: "include",
  });
}

export async function exportTenantSnapshot(includeSecrets = false) {
  return fetch(withQuery("/platform/export", { includeSecrets }), {
    headers: platformHeaders(),
    credentials: "include",
  });
}

export async function importTenantSnapshot(payload: Record<string, unknown>) {
  return fetch(`${BASE_URL}/platform/import`, {
    body: JSON.stringify(payload),
    method: "POST",
    headers: platformHeaders(true),
    credentials: "include",
  });
}

export async function restoreTenantResource(payload: Record<string, unknown>) {
  return fetch(`${BASE_URL}/platform/restore`, {
    body: JSON.stringify(payload),
    method: "POST",
    headers: platformHeaders(true),
    credentials: "include",
  });
}

export async function getModerationDashboard(params?: { limit?: number }) {
  return fetch(withQuery("/platform/moderation", params), {
    headers: platformHeaders(),
    credentials: "include",
  });
}

export async function getContentReview() {
  return fetch(`${BASE_URL}/platform/content-review`, {
    headers: platformHeaders(),
    credentials: "include",
  });
}

export async function updateContentReview(payload: Record<string, unknown>) {
  return fetch(`${BASE_URL}/platform/content-review`, {
    body: JSON.stringify(payload),
    method: "PUT",
    headers: platformHeaders(true),
    credentials: "include",
  });
}

export async function getReports(params?: { status?: string; limit?: number }) {
  return fetch(withQuery("/platform/reports", params), {
    headers: platformHeaders(),
    credentials: "include",
  });
}

export async function updateReport(id: number, payload: Record<string, unknown>) {
  return fetch(withQuery("/platform/reports", { id }), {
    body: JSON.stringify(payload),
    method: "PUT",
    headers: platformHeaders(true),
    credentials: "include",
  });
}

export async function addReportNote(id: number, payload: Record<string, unknown>) {
  return fetch(withQuery("/platform/reports/notes", { id }), {
    body: JSON.stringify(payload),
    method: "POST",
    headers: platformHeaders(true),
    credentials: "include",
  });
}

export async function getFederationControls() {
  return fetch(`${BASE_URL}/platform/federation`, {
    headers: platformHeaders(),
    credentials: "include",
  });
}

export async function createFederationControl(payload: Record<string, unknown>) {
  return fetch(`${BASE_URL}/platform/federation`, {
    body: JSON.stringify(payload),
    method: "POST",
    headers: platformHeaders(true),
    credentials: "include",
  });
}

export async function deleteFederationControl(payload: Record<string, unknown>) {
  return fetch(`${BASE_URL}/platform/federation`, {
    body: JSON.stringify(payload),
    method: "DELETE",
    headers: platformHeaders(true),
    credentials: "include",
  });
}

export async function manageRadio(payload: Record<string, unknown>) {
  return fetch(`${BASE_URL}/platform/radio`, {
    body: JSON.stringify(payload),
    method: "PUT",
    headers: platformHeaders(true),
    credentials: "include",
  });
}
