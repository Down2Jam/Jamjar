import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";

export async function postComment(
  content: string,
  postId: number | null,
  commentId: number | null = null,
  gameId: number | null = null,
  gamePageId: number | null = null,
  trackId: number | null = null
) {
  return fetch(`${BASE_URL}/comment`, {
    body: JSON.stringify({
      content,
      postId,
      commentId,
      gameId,
      gamePageId,
      trackId,
      username: getCookie("user"),
    }),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
  });
}

export async function updateComment(commentId: number, content: string) {
  return fetch(`${BASE_URL}/comment`, {
    body: JSON.stringify({
      commentId,
      content,
    }),
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
  });
}

export async function deleteComment(commentId: number, mode: "delete" | "remove" = "delete") {
  return fetch(`${BASE_URL}/comment`, {
    body: JSON.stringify({
      commentId,
      mode,
    }),
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
  });
}

export async function toggleCommentReaction(
  commentId: number,
  reactionId: number
) {
  return fetch(`${BASE_URL}/comment/reaction`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
    body: JSON.stringify({
      commentId,
      reactionId,
    }),
  });
}
