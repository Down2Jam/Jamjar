import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";
import { PostTime } from "@/types/PostTimes";

export async function getPosts(sort: string, time: PostTime, sticky: boolean, tagRules?: { [key: number]: number }, userSlug?: string) {
  let url = `${BASE_URL}/posts?sort=${sort}&time=${time}`;

  if (sticky) url += '&sticky=true';
  if (userSlug) url += `&user=${userSlug}`;

  if (tagRules) url += `&tags=${
    Object.entries(tagRules)
    .map((key) => `${key}`)
    .join("_")
  }`;

  return fetch(url);
}

export async function getPost(postSlug: string, userSlug?: string) {
  let url = `${BASE_URL}/post?slug=${postSlug}`;
  if (userSlug) url += `&user=${userSlug}`;
  return fetch(url);
}

export async function postPost(title: string, content: string, sticky: boolean, tags: (number | undefined)[]) {
  return fetch(`${BASE_URL}/post`, {
      body: JSON.stringify({
        title,
        content,
        sticky,
        username: getCookie("user"),
        tags,
      }),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${getCookie("token")}`,
      },
      credentials: "include",
    }
  );
}

export async function deletePost(postId: number) {
  return fetch(`${BASE_URL}/post`, {
    body: JSON.stringify({
      postId,
      username: getCookie("user"),
    }),
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
  });
}

export async function stickPost(postId: number, sticky: boolean) {
  return fetch(`${BASE_URL}/post`, {
      body: JSON.stringify({
        postId,
        sticky,
        username: getCookie("user"),
      }),
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${getCookie(
          "token"
        )}`,
      },
      credentials: "include",
    }
  );
}

export async function togglePostReaction(
  postId: number,
  reactionId: number
) {
  return fetch(`${BASE_URL}/post/reaction`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
    body: JSON.stringify({
      postId,
      reactionId,
    }),
  });
}
