import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";
import { cachedFetch, invalidateRequestCache } from "./cache";

export async function getJams() {
  return cachedFetch(`${BASE_URL}/jams`, undefined, {
    ttlMs: 300_000,
  });
}

export async function getCurrentJam() {
  return cachedFetch(`${BASE_URL}/jam`, {
    next: { revalidate: 300 },
  }, {
    ttlMs: 60_000,
  });
}

export async function joinJam(jamId: number) {
  const response = await fetch(`${BASE_URL}/join-jam`, {
    body: JSON.stringify({
      jamId: jamId,
      userSlug: getCookie("user"),
    }),
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
  });

  if (response.ok) {
    invalidateRequestCache(/\/(jam|jams|self|user)/);
  }

  return response;
}

export async function hasJoinedCurrentJam() {
  return cachedFetch(`${BASE_URL}/jam/participation`, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${getCookie("token")}`,
    },
  }, {
    ttlMs: 15_000,
  });
}
