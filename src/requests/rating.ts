import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";

export async function postRating(
  gameId: number,
  categoryId: number,
  value: number
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
      categoryId,
      value,
    }),
  });
}
