import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";

export type RadioStation = "all" | "safe";

export async function getRadioState(station: RadioStation = "all") {
  const query = new URLSearchParams({ station });
  return fetch(`${BASE_URL}/radio?${query.toString()}`, {
    headers: { authorization: `Bearer ${getCookie("token")}` },
    credentials: "include",
  });
}

export async function voteRadioTrack(trackId: number, station: RadioStation = "all") {
  return fetch(`${BASE_URL}/radio/vote`, {
    body: JSON.stringify({ trackId, station }),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
  });
}

export async function sendRadioEmote(
  emote: string,
  position?: { x: number; y: number },
  station: RadioStation = "all",
) {
  return fetch(`${BASE_URL}/radio/emote`, {
    body: JSON.stringify({ emote, station, ...position }),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
  });
}

export async function reportRadioTrackDuration(
  trackId: number,
  durationSeconds: number,
  station: RadioStation = "all",
) {
  return fetch(`${BASE_URL}/radio/duration`, {
    body: JSON.stringify({ trackId, durationSeconds, station }),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
}

export function getRadioEventsUrl(station: RadioStation = "all") {
  const query = new URLSearchParams({ station });
  return `${BASE_URL}/radio/events?${query.toString()}`;
}
