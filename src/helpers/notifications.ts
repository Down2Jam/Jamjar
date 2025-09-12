import { BASE_URL } from "@/requests/config";
import { getCookie } from "./cookie";

export async function deleteNotification(id: number) {
  return await fetch(`${BASE_URL}/notifications/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
  });
}
