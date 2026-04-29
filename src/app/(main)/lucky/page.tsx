import { getRandomGame } from "@/requests/game";
import { readItem } from "@/requests/helpers";
import { redirect } from "@/compat/next-navigation";

export default async function LuckyPage() {
  const res = await getRandomGame();
  const data = await readItem<{ slug: string }>(res);

  if (!data) {
    redirect("/games");
    return null;
  }

  redirect(`/g/${data.slug}`);
}
