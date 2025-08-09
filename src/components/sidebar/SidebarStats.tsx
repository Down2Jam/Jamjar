import { getCurrentJam } from "@/helpers/jam";
import { GameType } from "@/types/GameType";
import { getRatingCategories } from "@/requests/game";
import SidebarStatsClient from "./SidebarStatsClient";

export default async function SidebarStats() {
  const jamResponse = await getCurrentJam();
  const currentJam = jamResponse?.jam;
  const ratingResponse = await getRatingCategories(true);
  const ratingCategories = (await ratingResponse.json()).data;

  return (
    <SidebarStatsClient
      ratings={Math.round(
        currentJam?.games.reduce(
          (prev: number, cur: GameType) =>
            cur.ratings.length /
              (cur.ratingCategories.length + ratingCategories.length) +
            prev,
          0
        ) || 0
      )}
      users={currentJam?.users.length || 0}
      games={currentJam?.games.filter((game) => game.published).length || 0}
    />
  );
}
