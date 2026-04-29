import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";

export type QuiltPixel = {
  x: number;
  y: number;
  color: string | null;
};

export type QuiltSubmission = {
  id: number;
  pixels: QuiltPixel[];
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "REMOVED" | "USER_DELETED";
  score: number;
  viewerVote: number;
  resolvesAt: string;
  resolvedAt: string | null;
  removedAt: string | null;
  createdAt: string;
  author: {
    id: number;
    slug: string;
    name: string;
    profilePicture?: string | null;
  };
};

export type QuiltSummary = {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  width: number;
  height: number;
  endsAt: string;
  createdAt: string;
  submissionCount: number;
  acceptedCount: number;
};

export type QuiltDetail = QuiltSummary & {
  isEnded: boolean;
  canvas: Array<string | null>;
  history: QuiltSubmission[];
  pending: QuiltSubmission[];
  rejected: QuiltSubmission[];
  removed: QuiltSubmission[];
  deleted: QuiltSubmission[];
};

function authHeaders(contentType = false) {
  return {
    ...(contentType ? { "Content-Type": "application/json" } : {}),
    authorization: `Bearer ${getCookie("token")}`,
  };
}

export async function listQuilts() {
  return fetch(`${BASE_URL}/quilts`);
}

export async function getQuilt(slug: string) {
  return fetch(`${BASE_URL}/quilts/${slug}`, {
    headers: authHeaders(),
    credentials: "include",
  });
}

export async function submitQuiltPixels(slug: string, pixels: QuiltPixel[]) {
  return fetch(`${BASE_URL}/quilts/${slug}/submissions`, {
    method: "POST",
    body: JSON.stringify({ pixels }),
    headers: authHeaders(true),
    credentials: "include",
  });
}

export async function voteQuiltSubmission(submissionId: number, value: 1 | -1) {
  return fetch(`${BASE_URL}/quilts/submissions/${submissionId}/vote`, {
    method: "POST",
    body: JSON.stringify({ value }),
    headers: authHeaders(true),
    credentials: "include",
  });
}

export async function updateQuiltSubmission(
  submissionId: number,
  pixels: QuiltPixel[],
) {
  return fetch(`${BASE_URL}/quilts/submissions/${submissionId}`, {
    method: "PUT",
    body: JSON.stringify({ pixels }),
    headers: authHeaders(true),
    credentials: "include",
  });
}

export async function removeQuiltSubmission(submissionId: number) {
  return fetch(`${BASE_URL}/quilts/submissions/${submissionId}`, {
    method: "DELETE",
    headers: authHeaders(),
    credentials: "include",
  });
}

export async function acceptQuiltSubmission(submissionId: number) {
  return fetch(`${BASE_URL}/quilts/submissions/${submissionId}/accept`, {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
  });
}
