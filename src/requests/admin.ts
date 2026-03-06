import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";

export async function getAdminImages() {
  const tokenCookie = getCookie("token");
  if (!tokenCookie) return Promise.reject("Token cookie not found.");

  return fetch(`${BASE_URL}/admin/images`, {
    headers: { authorization: `Bearer ${tokenCookie}` },
    credentials: "include",
  });
}
