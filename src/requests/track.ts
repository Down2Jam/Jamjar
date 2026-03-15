import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";

export async function getTrack(trackSlug: string) {
  return fetch(`${BASE_URL}/tracks/${trackSlug}`, {
    headers: { authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
  });
}

export async function getTracks(sort: string, jamId?: string) {
  const params = new URLSearchParams({ sort });
  if (jamId && jamId !== "all") {
    params.set("jamId", jamId);
  }

  return fetch(`${BASE_URL}/tracks?${params.toString()}`);
}

export async function updateTrack(
  trackSlug: string,
  payload: {
    name?: string;
    commentary?: string;
    tagIds?: number[];
    flagIds?: number[];
    bpm?: number | null;
    musicalKey?: string | null;
    softwareUsed?: string[];
    allowDownload?: boolean;
    allowBackgroundUse?: boolean;
    allowBackgroundUseAttribution?: boolean;
    license?: string | null;
    composerId?: number;
    links?: Array<{ label: string; url: string }>;
    credits?: Array<{ role: string; userId: number }>;
  },
) {
  const response = await fetch(`${BASE_URL}/tracks/${trackSlug}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return response;
}

export async function getTrackTags() {
  return fetch(`${BASE_URL}/tracktags`, {
    headers: { authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
  });
}

export async function getTrackFlags() {
  return fetch(`${BASE_URL}/trackflags`, {
    headers: { authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
  });
}

export async function getTrackResults(
  jamId: string,
  preview: boolean = false,
  category?: "REGULAR" | "ODA",
) {
  const params = new URLSearchParams({
    contentType: "MUSIC",
    sort: "OVERALL",
    jam: jamId,
  });

  return fetch(`${BASE_URL}/results?${params.toString()}`, {
    headers: { authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
  });
}

export async function getTrackRatingCategories() {
  return fetch(`${BASE_URL}/track-rating-categories`, {
    headers: { authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
  });
}

export async function postTrackTimestampComment(
  trackId: number,
  content: string,
  timestamp: number,
) {
  return fetch(`${BASE_URL}/track-timestamp-comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
    body: JSON.stringify({
      trackId,
      content,
      timestamp,
    }),
  });
}
