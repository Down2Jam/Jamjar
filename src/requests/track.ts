import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";
import { cachedFetch, invalidateRequestCache } from "./cache";

export async function getTrack(trackSlug: string) {
  return cachedFetch(`${BASE_URL}/tracks/${trackSlug}`, {
    headers: { authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
  }, {
    ttlMs: 30_000,
  });
}

export async function getTracks(sort: string, jamId?: string) {
  const params = new URLSearchParams({ sort });
  if (jamId && jamId !== "all") {
    params.set("jamId", jamId);
  }

  return cachedFetch(`${BASE_URL}/tracks?${params.toString()}`, undefined, {
    ttlMs: 20_000,
  });
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

  if (response.ok) {
    invalidateRequestCache(/\/(tracks|results|self|user|jam)/);
  }

  return response;
}

export async function getTrackTags() {
  return cachedFetch(`${BASE_URL}/tracktags`, {
    headers: { authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
  }, {
    ttlMs: 300_000,
  });
}

export async function getTrackFlags() {
  return cachedFetch(`${BASE_URL}/trackflags`, {
    headers: { authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
  }, {
    ttlMs: 300_000,
  });
}

export async function getTrackResults(jamId: string) {
  const params = new URLSearchParams({
    contentType: "MUSIC",
    sort: "OVERALL",
    jam: jamId,
  });

  return cachedFetch(`${BASE_URL}/results?${params.toString()}`, {
    headers: { authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
  }, {
    ttlMs: 20_000,
  });
}

export async function getTrackRatingCategories() {
  return cachedFetch(`${BASE_URL}/track-rating-categories`, {
    headers: { authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
  }, {
    ttlMs: 300_000,
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
