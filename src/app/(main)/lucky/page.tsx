import { BASE_URL } from "@/requests/config";
import { redirect } from "next/navigation";

export default async function LuckyPage() {
  const res = await fetch(`${BASE_URL}/game`);
  const { data } = await res.json();

  if (!data) {
    redirect("/games");
  }

  redirect(`/g/${data.slug}`);
}
