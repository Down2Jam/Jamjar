import { Spacer } from "@heroui/react";
import Timers from "../timers";
import { getCurrentJam } from "@/helpers/jam";
import { Gamepad2, Star, Users } from "lucide-react";
import { GameType } from "@/types/GameType";
import { getRatingCategories } from "@/requests/game";

export default async function SidebarStats() {
  const jamResponse = await getCurrentJam();
  const currentJam = jamResponse?.jam;
  const ratingResponse = await getRatingCategories(true);
  const ratingCategories = (await ratingResponse.json()).data;

  return (
    <div className="border rounded-xl p-4 text-white text-center bg-[#18181a] border-[#1f1f21] shadow-2xl z-10">
      <Timers />
      <Spacer />
      <div className="flex items-center gap-4 justify-center">
        <Users className="text-[#666]" />
        <p>Entrants</p>
        <p className="text-[#1687a7]">{currentJam?.users.length || 0}</p>
      </div>
      {currentJam?.games.filter((game) => game.published).length != 0 && (
        <>
          <Spacer />
          <div className="flex items-center gap-4 justify-center">
            <Gamepad2 className="text-[#666]" />
            <p>Games</p>
            <p className="text-[#1687a7]">
              {currentJam?.games.filter((game) => game.published).length || 0}
            </p>
          </div>
        </>
      )}
      {currentJam?.games.reduce(
        (prev: number, cur: GameType) => cur.ratings.length + prev,
        0
      ) != 0 && (
        <>
          <Spacer />
          <div className="flex items-center gap-4 justify-center">
            <Star className="text-[#666]" />
            <p>Ratings</p>
            <p className="text-[#1687a7]">
              {Math.round(
                currentJam?.games.reduce(
                  (prev: number, cur: GameType) =>
                    cur.ratings.length /
                      (cur.ratingCategories.length + ratingCategories.length) +
                    prev,
                  0
                ) || 0
              )}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
