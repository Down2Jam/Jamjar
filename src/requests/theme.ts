import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";

export async function getThemeSuggestions() {
  return fetch(`${BASE_URL}/themes/suggestion`, {
    headers: { Authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
  });
}

export async function getTopThemes() {
  return fetch(`${BASE_URL}/themes/top-themes`, {
    headers: { Authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
  });
}

export async function getThemes() {
  return fetch(`${BASE_URL}/themes`, {
    headers: { Authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
  });
}

export async function getThemeVotes() {
  return fetch(`${BASE_URL}/themes/votes`, {
    headers: { Authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
  });
}

export async function postThemeSuggestion(suggestion: string) {
  return fetch(`${BASE_URL}/themes/suggestion`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
    body: JSON.stringify({ suggestionText: suggestion }),
  });
}

export async function deleteThemeSuggestion(suggestionId: number) {
  return fetch(`${BASE_URL}/themes/suggestion/${suggestionId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
  });
}

export async function postThemeSuggestionVote(
  suggestionId: number,
  votingScore: number
) {
  return fetch(`${BASE_URL}/themes/vote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
    body: JSON.stringify({ suggestionId, votingScore }),
  });
}

export async function postThemeSlaughterVote(
  suggestionId: number,
  voteType: number
) {
  return fetch(`${BASE_URL}/themes/voteSlaughter`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
    body: JSON.stringify({
      suggestionId,
      voteType,
    }),
  });
}
