import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";
import { cachedFetch, invalidateRequestCache } from "./cache";

export async function getSelf() {
  const userCookie = getCookie("user");
  const tokenCookie = getCookie("token");
  //if (!userCookie || !tokenCookie) return Promise.reject("Cookie not found.");

  return cachedFetch(`${BASE_URL}/self?username=${userCookie}`, {
    headers: { authorization: `Bearer ${tokenCookie}` },
    credentials: "include",
  }, {
    ttlMs: 15_000,
  });
}

export async function getUser(userSlug: string) {
  return cachedFetch(`${BASE_URL}/user?targetUserSlug=${userSlug}`, undefined, {
    ttlMs: 30_000,
  });
}

export async function searchUsers(query: string) {
  const tokenCookie = getCookie("token");
  if (!tokenCookie) return Promise.reject("Token cookie not found.");

  return fetch(`${BASE_URL}/user/search?q=${query}`, {
    headers: { authorization: `Bearer ${tokenCookie}` },
    credentials: "include",
  });
}

export async function updateUser(
  userSlug: string,
  name: string,
  bio: string,
  short: string,
  profilePicture: string | null,
  bannerPicture: string | null,
  primaryRoles: string[],
  secondaryRoles: string[],
  emotePrefix: string | null,
  pronouns?: string | null,
  links?: string[],
  linkLabels?: string[],
  profileBackground?: string | null,
  recommendedGameIds?: number[],
  recommendedPostIds?: number[],
  recommendedTrackIds?: number[],
  recommendedHiddenGameIds?: number[],
  recommendedHiddenTrackIds?: number[],
  hideRatings?: boolean,
  autoHideRatingsWhileStreaming?: boolean
) {
  const tokenCookie = getCookie("token");
  if (!tokenCookie) return Promise.reject("Token cookie not found.");

  const payload: Record<string, unknown> = {
    targetUserSlug: userSlug,
    name,
    bio,
    short,
    profilePicture: profilePicture,
    bannerPicture: bannerPicture,
    primaryRoles,
    secondaryRoles,
    emotePrefix,
    pronouns,
    links,
    linkLabels,
    profileBackground,
    recommendedGameIds,
    recommendedPostIds,
    recommendedTrackIds,
    recommendedHiddenGameIds,
    recommendedHiddenTrackIds,
    hideRatings,
    autoHideRatingsWhileStreaming,
  };

  const response = await fetch(`${BASE_URL}/user`, {
    body: JSON.stringify(payload),
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${tokenCookie}`,
    },
    credentials: "include",
  });

  if (response.ok) {
    invalidateRequestCache(/\/(self|user|jam)/);
  }

  return response;
}
