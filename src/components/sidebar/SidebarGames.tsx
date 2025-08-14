"use client";

import { Link, Spacer } from "@heroui/react";
import { useEffect, useState } from "react";
import { GameType } from "@/types/GameType";
import { getGames } from "@/requests/game";
import { useTheme } from "@/providers/SiteThemeProvider";
import Image from "next/image";
import Text from "@/framework/Text";
import { Button } from "@/framework/Button";

export default function SidebarGames() {
  const [games, setGames] = useState<GameType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { colors } = useTheme();

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const gameResponse = await getGames("random");
        setGames(await gameResponse.json());
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameData();
  }, []);

  if (isLoading) return <></>;

  if (games.length == 0) return <></>;

  return (
    <>
      <Spacer y={20} />
      <div className="flex flex-col gap-2 items-center">
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
          {/* <ButtonAction
            icon={<MoreHorizontal />}
            name="Load More"
            onPress={() => {
              toast.warning("Game pagination coming soon");
            }}
          /> */}
          <Button icon="moveupright" href="/games">
            SidebarGames.Link
          </Button>
        </div>
      </div>
    </>
  );
}
