import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";

export async function getSelf() {
  const tokenCookie = getCookie("token");
  //if (!userCookie || !tokenCookie) return Promise.reject("Cookie not found.");

  return fetch(`${BASE_URL}/self`, {
    headers: { authorization: `Bearer ${tokenCookie}` },
    credentials: "include",
  });
}

export async function getUser(userSlug: string) {
  const tokenCookie = getCookie("token");
  return fetch(`${BASE_URL}/users/${encodeURIComponent(userSlug)}`, {
    headers: tokenCookie ? { authorization: `Bearer ${tokenCookie}` } : undefined,
    credentials: "include",
  });
}

export async function searchUsers(query: string) {
  const tokenCookie = getCookie("token");
  if (!tokenCookie) return Promise.reject("Token cookie not found.");

  return fetch(`${BASE_URL}/users/search?q=${encodeURIComponent(query)}`, {
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

  const response = await fetch(`${BASE_URL}/users/${encodeURIComponent(userSlug)}`, {
    body: JSON.stringify(payload),
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${tokenCookie}`,
    },
    credentials: "include",
  });

  return response;
}

export async function followUser(userSlug: string, follow: boolean) {
  const tokenCookie = getCookie("token");
  if (!tokenCookie) return Promise.reject("Token cookie not found.");

  return fetch(`${BASE_URL}/users/${encodeURIComponent(userSlug)}/follow`, {
    body: JSON.stringify({ follow }),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${tokenCookie}`,
    },
    credentials: "include",
  });
}
