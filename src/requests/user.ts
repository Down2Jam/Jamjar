import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";

export async function getSelf() {
  const userCookie = getCookie("user");
  const tokenCookie = getCookie("token");
  //if (!userCookie || !tokenCookie) return Promise.reject("Cookie not found.");

  return fetch(`${BASE_URL}/self?username=${userCookie}`, {
    headers: { authorization: `Bearer ${tokenCookie}` },
    credentials: "include",
  });
}

export async function getUser(userSlug: string) {
  return fetch(`${BASE_URL}/user?targetUserSlug=${userSlug}`);
}

export async function searchUsers(query: string) {
  const tokenCookie = getCookie("token");
  if (!tokenCookie) return Promise.reject("Token cookie not found.");

  return fetch(`${BASE_URL}/user/search?q=${query}`, {
    headers: { authorization: `Bearer ${tokenCookie}` },
    credentials: "include",
  });
}

export async function updateUser(
  userSlug: string,
  name: string,
  bio: string,
  short: string,
  profilePicture: string | null,
  bannerPicture: string | null,
  primaryRoles: string[],
  secondaryRoles: string[]
) {
  const tokenCookie = getCookie("token");
  if (!tokenCookie) return Promise.reject("Token cookie not found.");

  return fetch(`${BASE_URL}/user`, {
    body: JSON.stringify({
      targetUserSlug: userSlug,
      name,
      bio,
      short,
      profilePicture: profilePicture,
      bannerPicture: bannerPicture,
      primaryRoles,
      secondaryRoles,
    }),
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${tokenCookie}`,
    },
    credentials: "include",
  });
}
