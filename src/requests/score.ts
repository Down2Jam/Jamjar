import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";

export async function postScore(
  value: number,
  evidence: string,
  leaderboardId: number
) {
  return fetch(`${BASE_URL}/score`, {
    body: JSON.stringify({
      score: value,
      evidence,
      leaderboardId,
    }),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
  });
}

export async function deleteScore(scoreId: number) {
  return fetch(`${BASE_URL}/score`, {
    body: JSON.stringify({
      scoreId,
    }),
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
  });
}
