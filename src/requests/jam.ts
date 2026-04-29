import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";

let currentJamRequest: Promise<Response> | null = null;

export async function getJams() {
  return fetch(`${BASE_URL}/jams`);
}

export async function getCurrentJam() {
  if (!currentJamRequest) {
    currentJamRequest = fetch(`${BASE_URL}/jam`).finally(() => {
      currentJamRequest = null;
    });
  }

  return currentJamRequest.then((response) => response.clone());
}

export async function joinJam(jamId: number) {
  const response = await fetch(`${BASE_URL}/join-jam`, {
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

  return response;
}

export async function hasJoinedJam(jamSlug: string) {
  return fetch(`${BASE_URL}/jams/${encodeURIComponent(jamSlug)}/participation`, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${getCookie("token")}`,
    },
  });
}
