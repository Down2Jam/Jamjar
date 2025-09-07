"use client";

import { useEffect, useState } from "react";
import { GameType } from "@/types/GameType";
import { getGames } from "@/requests/game";
import { useTheme } from "@/providers/SiteThemeProvider";
import Image from "next/image";
import Text from "@/framework/Text";
import { Button } from "@/framework/Button";
import Link from "next/link";

// 👇 Assumes you have these helpers available
import { getCurrentJam, ActiveJamResponse } from "@/helpers/jam";

export default function SidebarGames() {
  const [games, setGames] = useState<GameType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { colors } = useTheme();

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        let jamId: string | undefined;

        try {
          const active: ActiveJamResponse | null = await getCurrentJam();
          const phase = active?.phase ?? "";
          const isRatingWindow =
            phase === "Jamming" || phase === "Submission" || phase === "Rating";

          if (active?.jam?.id && isRatingWindow) {
            jamId = active.jam.id.toString();
          }
        } catch {}

        const gameResponse = await getGames("random", jamId);
        const data = await gameResponse.json();
        setGames(Array.isArray(data) ? data : data?.data ?? []);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameData();
  }, []);

  if (isLoading) return <></>;
  if (games.length === 0) return <></>;

  return (
    <>
      <div className="flex flex-col gap-2 items-center mt-20">
        <Text size="2xl" color="text">
          SidebarGames.Title
        </Text>
        <div className="flex flex-wrap w-[496px] gap-2 justify-center">
          {games.slice(0, 6).map((game, index) => (
            <Link key={game.name + index} href={`/g/${game.slug}`}>
              <div
                className="w-[128px] h-[72px] rounded-xl border-1 overflow-hidden"
                style={{
                  backgroundColor: colors["mantle"],
                  borderColor: colors["base"],
                }}
              >
                <Image
                  alt={`${game.name}'s thumbnail`}
                  className="z-0 w-full h-full object-cover"
                  height={72}
                  width={128}
                  src={game.thumbnail ?? "/images/D2J_Icon.png"}
                />
              </div>
            </Link>
          ))}
          {games.length > 6 &&
            games.slice(6, 10).map((game, index) => (
              <Link key={game.name + index} href={`/g/${game.slug}`}>
                <div
                  className="w-[96px] h-[54px] rounded-xl border-1 overflow-hidden"
                  style={{
                    backgroundColor: colors["mantle"],
                    borderColor: colors["base"],
                  }}
                >
                  <Image
                    alt={`${game.name}'s thumbnail`}
                    className="z-0 w-full h-full object-cover"
                    height={54}
                    width={96}
                    src={game.thumbnail ?? "/images/D2J_Icon.png"}
                  />
                </div>
              </Link>
            ))}
        </div>
        <div className="flex justify-center gap-2">
          <Button icon="moveupright" href="/games">
            SidebarGames.Link
          </Button>
        </div>
      </div>
    </>
  );
}
