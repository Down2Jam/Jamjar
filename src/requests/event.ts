import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";
import { cachedFetch, invalidateRequestCache } from "./cache";

export async function getEvents(filter: string) {
  return cachedFetch(`${BASE_URL}/events?filter=${filter}`, undefined, {
    ttlMs: 20_000,
  });
}

export async function getEvent(eventSlug: string) {
  return cachedFetch(`${BASE_URL}/event?targetEventSlug=${eventSlug}`, undefined, {
    ttlMs: 20_000,
  });
}

export async function postEvent(
  title: string,
  content: string,
  start: string,
  end: string,
  link: string,
  icon: string,
) {
  const response = await fetch(`${BASE_URL}/event`, {
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

  if (response.ok) {
    invalidateRequestCache(/\/event|\/events|\/self|\/user/);
  }

  return response;
}
