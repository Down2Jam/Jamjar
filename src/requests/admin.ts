import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";
import type { ListingPageVersion } from "@/types/GameType";

export async function getAdminImages() {
  const tokenCookie = getCookie("token");
  if (!tokenCookie) return Promise.reject("Token cookie not found.");

  return fetch(`${BASE_URL}/admin/images`, {
    headers: { authorization: `Bearer ${tokenCookie}` },
    credentials: "include",
  });
}

export function getAdminRecommendationPreview({
  userId,
  jamId,
  pageVersion,
  offset,
  signal,
}: {
  userId: number;
  jamId?: number;
  pageVersion: ListingPageVersion;
  offset: number;
  signal?: AbortSignal;
}) {
  const params = new URLSearchParams({
    userId: String(userId),
    pageVersion,
    offset: String(offset),
  });
  if (jamId) params.set("jamId", String(jamId));

  return fetch(`${BASE_URL}/admin/recommendations?${params}`, {
    headers: { authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
    cache: "no-store",
    signal,
  });
}
