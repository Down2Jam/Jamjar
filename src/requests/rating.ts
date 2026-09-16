import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";
import { PageVersion } from "@/types/GameType";
import { getSessionQueryClient } from "./sessionQueryClient";
import { queryKeys } from "@/hooks/queries/queryKeys";

export async function postRating(
  gameId: number,
  gamePageId: number,
  categoryId: number,
  value: number,
  pageVersion: PageVersion = "JAM",
) {
  const queryClient = getSessionQueryClient();
  const response = await fetch(`${BASE_URL}/rating`, {
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
  if (response.ok) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.user.self() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.game.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.jam.all });
  }
  return response;
}

export async function postTrackRating(
  trackId: number,
  categoryId: number,
  value: number,
  pageVersion?: PageVersion,
) {
  const queryClient = getSessionQueryClient();
  const response = await fetch(`${BASE_URL}/track-rating`, {
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
  if (response.ok) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.user.self() });
  }
  return response;
}
