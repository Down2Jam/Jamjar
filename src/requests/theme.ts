import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";

export async function getThemeSuggestions() {
  return fetch(`${BASE_URL}/themes/suggestion`, {
    headers: { Authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
  });
}

export async function getTheme() {
  return fetch(`${BASE_URL}/theme`);
}

export async function getThemes(isVoting: boolean = false) {
  return fetch(`${BASE_URL}/themes?isVoting=${isVoting ? 1 : 0}`, {
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

export async function postThemeVotingVote(
  suggestionId: number,
  voteType: number
) {
  return fetch(`${BASE_URL}/themes/voteVoting`, {
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
