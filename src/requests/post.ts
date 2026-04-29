import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";
import { PostTime } from "@/types/PostTimes";

export async function getPosts(
  sort: string,
  time: PostTime,
  sticky: boolean,
  tagRules?: { [key: number]: number },
  userSlug?: string,
  following?: boolean,
  cursor?: string | null,
  limit?: number,
) {
  const params = new URLSearchParams({
    sort,
    time,
  });

  if (sticky) params.set("sticky", "true");
  if (userSlug) params.set("user", userSlug);
  if (following) params.set("following", "true");
  if (cursor) params.set("cursor", cursor);
  if (limit) params.set("limit", String(limit));

  if (tagRules) {
    params.set(
      "tags",
      Object.entries(tagRules)
      .map((key) => `${key}`)
        .join("_"),
    );
  }

  return fetch(`${BASE_URL}/posts?${params.toString()}`);
}

export async function getPost(postSlug: string, userSlug?: string) {
  let url = `${BASE_URL}/posts/${encodeURIComponent(postSlug)}`;
  if (userSlug) {
    url += `?user=${encodeURIComponent(userSlug)}`;
  }
  return fetch(url);
}

export async function postPost(
  title: string,
  content: string,
  sticky: boolean,
  tags: (number | undefined)[],
) {
  const response = await fetch(`${BASE_URL}/posts`, {
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

export async function deletePost(postSlug: string) {
  const response = await fetch(`${BASE_URL}/posts/${encodeURIComponent(postSlug)}`, {
    body: JSON.stringify({
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

export async function removePost(postSlug: string) {
  const response = await fetch(`${BASE_URL}/posts/${encodeURIComponent(postSlug)}`, {
    body: JSON.stringify({
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

export async function stickPost(postSlug: string, sticky: boolean) {
  const response = await fetch(`${BASE_URL}/posts/${encodeURIComponent(postSlug)}`, {
    body: JSON.stringify({
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
  postSlug: string,
  updates: {
    title?: string;
    content?: string;
    tags?: number[];
  },
) {
  const response = await fetch(`${BASE_URL}/posts/${encodeURIComponent(postSlug)}`, {
    body: JSON.stringify({
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

export async function getPostAutosave(postId?: number) {
  const params = new URLSearchParams();
  if (postId) params.set("postId", String(postId));

  return fetch(`${BASE_URL}/posts/autosave${params.size ? `?${params.toString()}` : ""}`, {
    headers: { authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
  });
}

export async function savePostAutosave(payload: {
  postId?: number;
  title?: string;
  content?: string;
  tags?: number[];
}) {
  return fetch(`${BASE_URL}/posts/autosave`, {
    body: JSON.stringify(payload),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
  });
}

export async function listPostRevisions(postSlug: string) {
  return fetch(`${BASE_URL}/posts/${encodeURIComponent(postSlug)}/revisions`, {
    headers: { authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
  });
}

export async function publishPost(postSlug: string) {
  return fetch(`${BASE_URL}/posts/${encodeURIComponent(postSlug)}/publish`, {
    method: "POST",
    headers: { authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
  });
}

export async function getPostPreview(previewToken: string) {
  return fetch(`${BASE_URL}/posts/preview/${encodeURIComponent(previewToken)}`);
}

export async function listPostSeries(params?: {
  userSlug?: string;
  postSlug?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.userSlug) query.set("userSlug", params.userSlug);
  if (params?.postSlug) query.set("postSlug", params.postSlug);
  if (params?.limit) query.set("limit", String(params.limit));

  return fetch(`${BASE_URL}/posts/series${query.size ? `?${query.toString()}` : ""}`, {
    headers: { authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
  });
}

export async function createPostSeries(payload: Record<string, unknown>) {
  return fetch(`${BASE_URL}/posts/series`, {
    body: JSON.stringify(payload),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
  });
}

export async function getPostSeries(seriesId: string | number) {
  return fetch(`${BASE_URL}/posts/series/${encodeURIComponent(String(seriesId))}`, {
    headers: { authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
  });
}

export async function updatePostSeries(
  seriesId: string | number,
  payload: Record<string, unknown>,
) {
  return fetch(`${BASE_URL}/posts/series/${encodeURIComponent(String(seriesId))}`, {
    body: JSON.stringify(payload),
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
  });
}

export async function addPostToSeries(
  seriesId: string | number,
  payload: Record<string, unknown>,
) {
  return fetch(`${BASE_URL}/posts/series/${encodeURIComponent(String(seriesId))}/posts`, {
    body: JSON.stringify(payload),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
  });
}

export async function removePostFromSeries(seriesId: string | number, postId: number) {
  return fetch(
    `${BASE_URL}/posts/series/${encodeURIComponent(String(seriesId))}/posts/${postId}`,
    {
      method: "DELETE",
      headers: { authorization: `Bearer ${getCookie("token")}` },
      credentials: "include",
    },
  );
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
