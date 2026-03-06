import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";

export async function getEmojis() {
  return fetch(`${BASE_URL}/emojis`);
}

export async function createEmoji(
  slug: string,
  image: string,
  artist?: string | null,
  artistSlug?: string | null
) {
  return fetch(`${BASE_URL}/emojis`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
    body: JSON.stringify({
      slug,
      image,
      artist,
      artistSlug,
    }),
  });
}

export async function createUserEmoji(
  slug: string,
  image: string,
  artistSlug?: string | null
) {
  return fetch(`${BASE_URL}/emojis/user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
    body: JSON.stringify({ slug, image, artistSlug }),
  });
}

export async function createGameEmoji(
  gameSlug: string,
  slug: string,
  image: string,
  artistSlug?: string | null
) {
  return fetch(`${BASE_URL}/emojis/game/${encodeURIComponent(gameSlug)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
    body: JSON.stringify({ slug, image, artistSlug }),
  });
}

export async function updateEmoji(
  id: number,
  payload: {
    slug?: string | null;
    image?: string | null;
    artist?: string | null;
    artistSlug?: string | null;
    scopeUserId?: number | null;
    scopeGameId?: number | null;
  }
) {
  return fetch(`${BASE_URL}/emojis/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });
}

export async function deleteEmoji(id: number) {
  return fetch(`${BASE_URL}/emojis/${id}`, {
    method: "DELETE",
    headers: {
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
  });
}
