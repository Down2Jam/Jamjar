import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";

export async function getEvents(filter: string) {
  return fetch(`${BASE_URL}/events?filter=${filter}`);
}

export async function getEvent(eventSlug: string) {
  return fetch(`${BASE_URL}/event?targetEventSlug=${eventSlug}`);
}

export async function postEvent(
  title: string,
  content: string,
  start: string,
  end: string,
  link: string,
  icon: string
) {
  return fetch(`${BASE_URL}/event`, {
    body: JSON.stringify({
      title,
      content,
      start,
      end,
      userSlug: getCookie("user"),
      link,
      icon,
    }),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
  });
}
