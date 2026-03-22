import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";
import { PostTime } from "@/types/PostTimes";

export async function getPosts(
  sort: string,
  time: PostTime,
  sticky: boolean,
  tagRules?: { [key: number]: number },
  userSlug?: string,
) {
  let url = `${BASE_URL}/posts?sort=${sort}&time=${time}`;

  if (sticky) url += "&sticky=true";
  if (userSlug) url += `&user=${userSlug}`;

  if (tagRules) {
    url += `&tags=${Object.entries(tagRules)
      .map((key) => `${key}`)
      .join("_")}`;
  }

  return fetch(url);
}

export async function getPost(postSlug: string, userSlug?: string) {
  let url = `${BASE_URL}/post?slug=${postSlug}`;
  if (userSlug) url += `&user=${userSlug}`;
  return fetch(url);
}

export async function postPost(
  title: string,
  content: string,
  sticky: boolean,
  tags: (number | undefined)[],
) {
  const response = await fetch(`${BASE_URL}/post`, {
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
  });

  return response;
}

export async function deletePost(postId: number) {
  const response = await fetch(`${BASE_URL}/post`, {
    body: JSON.stringify({
      postId,
      username: getCookie("user"),
      mode: "delete",
    }),
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
  });

  return response;
}

export async function removePost(postId: number) {
  const response = await fetch(`${BASE_URL}/post`, {
    body: JSON.stringify({
      postId,
      username: getCookie("user"),
      mode: "remove",
    }),
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
  });

  return response;
}

export async function stickPost(postId: number, sticky: boolean) {
  const response = await fetch(`${BASE_URL}/post`, {
    body: JSON.stringify({
      postId,
      sticky,
      username: getCookie("user"),
    }),
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
  });

  return response;
}

export async function updatePost(
  postId: number,
  updates: {
    title?: string;
    content?: string;
    tags?: number[];
  },
) {
  const response = await fetch(`${BASE_URL}/post`, {
    body: JSON.stringify({
      postId,
      username: getCookie("user"),
      ...updates,
    }),
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
  });

  return response;
}

export async function togglePostReaction(postId: number, reactionId: number) {
  const response = await fetch(`${BASE_URL}/post/reaction`, {
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

  return response;
}
