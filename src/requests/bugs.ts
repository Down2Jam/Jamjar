import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";

export type BugStatus = "open" | "triaged" | "resolved" | "dismissed";
export type BugReport = {
  id: number;
  reason: string;
  details: string;
  status: BugStatus;
  priority: "low" | "normal" | "high" | "urgent";
  resolution: string | null;
  reporterName: string;
  reporterSlug: string;
  createdAt: string;
};

async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json", authorization: `Bearer ${getCookie("token")}` },
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("Please sign in to continue.");
    if (response.status === 403) throw new Error("You do not have permission to review bug reports.");
    if (response.status === 429) throw new Error("Too many reports. Please wait a minute and try again.");
    throw new Error("Could not save or load the report. Please try again.");
  }
  const json = await response.json();
  return json.data ?? json;
}

export function submitBug(reason: string, details: string): Promise<{ id: number }> {
  return request("/reports", { method: "POST", body: JSON.stringify({ targetType: "bug", reason, details }) });
}

export function listBugs(status: BugStatus | "all", beforeId?: number): Promise<BugReport[]> {
  const params = new URLSearchParams({ kind: "bug", status, limit: "25" });
  if (beforeId) params.set("beforeId", String(beforeId));
  return request(`/platform/reports?${params}`);
}

export function updateBug(id: number, data: Pick<BugReport, "status" | "priority" | "resolution">): Promise<BugReport> {
  return request(`/platform/reports?id=${id}`, { method: "PUT", body: JSON.stringify(data) });
}
