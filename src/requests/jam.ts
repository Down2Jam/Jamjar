import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";

export async function getJams() {
  return fetch(`${BASE_URL}/jams`);
}

export async function getCurrentJam() {
  return fetch(`${BASE_URL}/jam`);
}

export async function joinJam(jamId: number) {
  return fetch(`${BASE_URL}/join-jam`, {
    body: JSON.stringify({
      jamId: jamId,
      userSlug: getCookie("user"),
    }),
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
  });
}

export async function hasJoinedCurrentJam() {
  return fetch(`${BASE_URL}/jam/participation`, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${getCookie("token")}`,
    },
  });
}
