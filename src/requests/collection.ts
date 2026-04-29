import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";

function jsonHeaders() {
  return {
    "Content-Type": "application/json",
    authorization: `Bearer ${getCookie("token")}`,
  };
}

function authHeaders() {
  return {
    authorization: `Bearer ${getCookie("token")}`,
  };
}

export type CollectionVisibility = "PRIVATE" | "UNLISTED" | "PUBLIC";
export type CollectionItemType = "game" | "post" | "track";

export async function listCollections(params?: {
  userSlug?: string;
  mine?: boolean;
  q?: string;
  itemType?: CollectionItemType;
  sort?: "updated" | "popular" | "largest";
  cursor?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.userSlug) query.set("userSlug", params.userSlug);
  if (params?.mine !== undefined) query.set("mine", String(params.mine));
  if (params?.q) query.set("q", params.q);
  if (params?.itemType) query.set("itemType", params.itemType);
  if (params?.sort) query.set("sort", params.sort);
  if (params?.cursor) query.set("cursor", params.cursor);
  if (params?.limit) query.set("limit", String(params.limit));

  return fetch(`${BASE_URL}/collections${query.size ? `?${query.toString()}` : ""}`, {
    headers: authHeaders(),
    credentials: "include",
  });
}

export async function createCollection(payload: {
  title: string;
  description?: string;
  visibility?: Lowercase<CollectionVisibility>;
  playbackMode?: "manual" | "shuffle" | "repeat";
}) {
  return fetch(`${BASE_URL}/collections`, {
    body: JSON.stringify(payload),
    method: "POST",
    headers: jsonHeaders(),
    credentials: "include",
  });
}

export async function importCollection(payload: Record<string, unknown>) {
  return fetch(`${BASE_URL}/collections/import`, {
    body: JSON.stringify(payload),
    method: "POST",
    headers: jsonHeaders(),
    credentials: "include",
  });
}

export async function getCollection(collectionId: string | number) {
  return fetch(`${BASE_URL}/collections/${encodeURIComponent(String(collectionId))}`, {
    headers: authHeaders(),
    credentials: "include",
  });
}

export async function exportCollection(collectionId: string | number) {
  return fetch(`${BASE_URL}/collections/${encodeURIComponent(String(collectionId))}/export`, {
    headers: authHeaders(),
    credentials: "include",
  });
}

export async function updateCollection(
  collectionId: string | number,
  payload: Record<string, unknown>,
) {
  return fetch(`${BASE_URL}/collections/${encodeURIComponent(String(collectionId))}`, {
    body: JSON.stringify(payload),
    method: "PUT",
    headers: jsonHeaders(),
    credentials: "include",
  });
}

export async function deleteCollection(collectionId: string | number) {
  return fetch(`${BASE_URL}/collections/${encodeURIComponent(String(collectionId))}`, {
    method: "DELETE",
    headers: authHeaders(),
    credentials: "include",
  });
}

export async function addCollectionItem(
  collectionId: string | number,
  payload: {
    itemType: CollectionItemType;
    itemId: number;
    note?: string;
    order?: number;
  },
) {
  return fetch(`${BASE_URL}/collections/${encodeURIComponent(String(collectionId))}/items`, {
    body: JSON.stringify(payload),
    method: "POST",
    headers: jsonHeaders(),
    credentials: "include",
  });
}

export async function removeCollectionItem(
  collectionId: string | number,
  itemId: string | number,
) {
  return fetch(
    `${BASE_URL}/collections/${encodeURIComponent(String(collectionId))}/items/${encodeURIComponent(String(itemId))}`,
    {
      method: "DELETE",
      headers: authHeaders(),
      credentials: "include",
    },
  );
}

export async function inviteCollectionCollaborator(
  collectionId: string | number,
  payload: { userSlug: string; role?: string },
) {
  return fetch(
    `${BASE_URL}/collections/${encodeURIComponent(String(collectionId))}/collaborators`,
    {
      body: JSON.stringify(payload),
      method: "POST",
      headers: jsonHeaders(),
      credentials: "include",
    },
  );
}

export async function respondCollectionCollaborator(
  collectionId: string | number,
  accept: boolean,
) {
  return fetch(
    `${BASE_URL}/collections/${encodeURIComponent(String(collectionId))}/collaborators/me`,
    {
      body: JSON.stringify({ status: accept ? "accepted" : "declined" }),
      method: "PUT",
      headers: jsonHeaders(),
      credentials: "include",
    },
  );
}

export async function forkCollection(collectionId: string | number) {
  return fetch(`${BASE_URL}/collections/${encodeURIComponent(String(collectionId))}/fork`, {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
  });
}

export async function getCollectionPlayback(collectionId: string | number) {
  return fetch(
    `${BASE_URL}/collections/${encodeURIComponent(String(collectionId))}/playback`,
    {
      headers: authHeaders(),
      credentials: "include",
    },
  );
}

export async function followCollection(
  collectionId: string | number,
  follow: boolean,
) {
  return fetch(`${BASE_URL}/collections/${encodeURIComponent(String(collectionId))}/follow`, {
    body: JSON.stringify({ follow }),
    method: "POST",
    headers: jsonHeaders(),
    credentials: "include",
  });
}

export async function addCollectionComment(
  collectionId: string | number,
  content: string,
) {
  return fetch(`${BASE_URL}/collections/${encodeURIComponent(String(collectionId))}/comments`, {
    body: JSON.stringify({ content }),
    method: "POST",
    headers: jsonHeaders(),
    credentials: "include",
  });
}

export async function listCollectionComments(collectionId: string | number) {
  return fetch(`${BASE_URL}/collections/${encodeURIComponent(String(collectionId))}/comments`, {
    headers: authHeaders(),
    credentials: "include",
  });
}

export async function deleteCollectionComment(
  collectionId: string | number,
  commentId: string | number,
) {
  return fetch(
    `${BASE_URL}/collections/${encodeURIComponent(String(collectionId))}/comments/${encodeURIComponent(String(commentId))}`,
    {
      method: "DELETE",
      headers: authHeaders(),
      credentials: "include",
    },
  );
}
