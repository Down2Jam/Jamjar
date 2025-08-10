"use client";

import { Link, Spacer } from "@heroui/react";
import { useEffect, useState } from "react";
import { GameType } from "@/types/GameType";
import { getGames } from "@/requests/game";
import ButtonAction from "../link-components/ButtonAction";
import { ExternalLink, MoreHorizontal } from "lucide-react";
import { toast } from "react-toastify";
import ButtonLink from "../link-components/ButtonLink";
import { useTheme } from "@/providers/SiteThemeProvider";
import Image from "next/image";

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
      <div className="flex flex-col gap-2">
        <p
          className="text-center text-2xl"
          style={{
            color: colors["textLight"],
          }}
        >
          Featured Games
        </p>
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
          <ButtonAction
            icon={<MoreHorizontal />}
            name="Load More"
            onPress={() => {
              toast.warning("Game pagination coming soon");
            }}
          />
          <ButtonLink
            icon={<ExternalLink />}
            name="To Games Page"
            href={`/games`}
          />
        </div>
      </div>
    </>
  );

  // return (
  //   <div className="flex flex-col gap-2">
  //     <p className="text-center text-2xl">Featured Games</p>
  //     <div className="flex flex-wrap w-[496px] gap-2">
  //       <Image
  //         as={NextImage}
  //         src="/images/test-images/dzytlc9d.bmp"
  //         width={160}
  //         height={128}
  //         className="z-0"
  //         alt="Example Game"
  //       />
  //       <Image
  //         as={NextImage}
  //         src="/images/test-images/itx9z7wf.bmp"
  //         width={160}
  //         height={128}
  //         className="z-0"
  //         alt="Example Game"
  //       />
  //       <Image
  //         as={NextImage}
  //         src="/images/test-images/pr5o378z.bmp"
  //         width={160}
  //         height={128}
  //         className="z-0"
  //         alt="Example Game"
  //       />
  //       <Image
  //         as={NextImage}
  //         src="/images/test-images/ttkcxjyf.bmp"
  //         width={160}
  //         height={128}
  //         className="z-0"
  //         alt="Example Game"
  //       />
  //       <Image
  //         as={NextImage}
  //         src="/images/test-images/8vu7cm9a.bmp"
  //         width={160}
  //         height={128}
  //         className="z-0"
  //         alt="Example Game"
  //       />
  //       <Image
  //         as={NextImage}
  //         src="/images/test-images/4cgjqnfh.bmp"
  //         width={160}
  //         height={128}
  //         className="z-0"
  //         alt="Example Game"
  //       />
  //     </div>
  //     <div className="flex flex-wrap w-[504px] gap-2">
  //       <Image
  //         as={NextImage}
  //         src="/images/test-images/owgpw63j.bmp"
  //         width={120}
  //         height={96}
  //         className="z-0"
  //         alt="Example Game"
  //       />
  //       <Image
  //         as={NextImage}
  //         src="/images/test-images/6kh3qqui.bmp"
  //         width={120}
  //         height={96}
  //         className="z-0"
  //         alt="Example Game"
  //       />
  //       <Image
  //         as={NextImage}
  //         src="/images/test-images/yhfxmq4w.bmp"
  //         width={120}
  //         height={96}
  //         className="z-0"
  //         alt="Example Game"
  //       />
  //       <Image
  //         as={NextImage}
  //         src="/images/test-images/nstyehmq.bmp"
  //         width={120}
  //         height={96}
  //         className="z-0"
  //         alt="Example Game"
  //       />
  //       <Image
  //         as={NextImage}
  //         src="/images/test-images/602to9m4.bmp"
  //         width={120}
  //         height={96}
  //         className="z-0"
  //         alt="Example Game"
  //       />
  //       <Image
  //         as={NextImage}
  //         src="/images/test-images/7df8it3b.bmp"
  //         width={120}
  //         height={96}
  //         className="z-0"
  //         alt="Example Game"
  //       />
  //       <Image
  //         as={NextImage}
  //         src="/images/test-images/1cns2nmf.bmp"
  //         width={120}
  //         height={96}
  //         className="z-0"
  //         alt="Example Game"
  //       />
  //       <Image
  //         as={NextImage}
  //         src="/images/test-images/lwuh1k06.bmp"
  //         width={120}
  //         height={96}
  //         className="z-0"
  //         alt="Example Game"
  //       />
  //     </div>
  //     <div className="flex justify-center gap-2">
  //       <ButtonAction
  //         icon={<MoreHorizontal />}
  //         name="Load More"
  //         onPress={() => {}}
  //       />
  //       <ButtonAction
  //         icon={<ExternalLink />}
  //         name="To Games Page"
  //         onPress={() => {}}
  //       />
  //     </div>
  //   </div>
  // );
}
