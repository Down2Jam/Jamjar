import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";
import { PageVersion } from "@/types/GameType";

export async function postRating(
  gameId: number,
  gamePageId: number,
  categoryId: number,
  value: number,
  pageVersion: PageVersion = "JAM",
) {
  return fetch(`${BASE_URL}/rating`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
    body: JSON.stringify({
      gameId,
      gamePageId,
      categoryId,
      value,
      pageVersion,
    }),
  });
}

export async function postTrackRating(
  trackId: number,
  categoryId: number,
  value: number,
  pageVersion?: PageVersion,
) {
  return fetch(`${BASE_URL}/track-rating`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
    body: JSON.stringify({
      trackId,
      categoryId,
      value,
      pageVersion,
    }),
  });
}
