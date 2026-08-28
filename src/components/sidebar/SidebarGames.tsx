"use client";

import { GameType } from "@/types/GameType";
import { useTheme } from "@/providers/useSiteTheme";
import Image from "@/compat/next-image";
import { Text } from "bioloom-ui";
import { Button } from "bioloom-ui";
import Link from "@/compat/next-link";
import { useCurrentJam, useGames } from "@/hooks/queries";
import { CSSProperties, useMemo } from "react";
import { getDefaultListingPageVersion } from "@/helpers/listingPageVersion";
import { Skeleton } from "@/components/skeletons";
import { GameHoverPreview } from "@/components/gamecard";

export default function SidebarGames() {
  const { colors, siteTheme } = useTheme();
  const { data: activeJam, isLoading: jamLoading } = useCurrentJam();

  const { jamId, sort, pageVersion } = useMemo(() => {
    const phase = activeJam?.phase ?? "";
    const isActiveJamBehavior =
      phase === "Jamming" || phase === "Submission" || phase === "Rating";
    const currentJamId = activeJam?.jam?.id?.toString() ?? null;
    const selectedJamId =
      activeJam?.jam?.id && (isActiveJamBehavior || phase.startsWith("Post-Jam"))
        ? activeJam.jam.id.toString()
        : "all";
    return {
      jamId:
        activeJam?.jam?.id && (isActiveJamBehavior || phase.startsWith("Post-Jam"))
          ? activeJam.jam.id.toString()
          : undefined,
      sort: isActiveJamBehavior ? "karma" : "score",
      pageVersion: getDefaultListingPageVersion(
        selectedJamId,
        currentJamId,
        phase,
      ),
    };
  }, [activeJam]);

  const { data: gamesData, isLoading } = useGames(
    sort,
    jamId,
    pageVersion,
    true,
    10,
  );

  const games: GameType[] = useMemo(
    () => (Array.isArray(gamesData) ? gamesData : []),
    [gamesData]
  );

  if (jamLoading || isLoading) {
    return (
      <div className="mt-20 flex flex-col items-center gap-2">
        <Skeleton className="h-8 w-44" />
        <div className="flex w-[496px] flex-wrap justify-center gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[77px] w-[136px] rounded-xl" />
          ))}
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`small-${index}`} className="h-[59px] w-[104px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
    );
  }
  if (games.length === 0) return <></>;

  return (
    <>
      <div className="flex flex-col gap-2 items-center mt-20">
        <Text
          size="2xl"
          color={siteTheme.type === "Light" ? "textLight" : "text"}
          style={{
            textShadow: "0 1px 5px rgba(0, 0, 0, 0.75)",
          }}
        >
          SidebarGames.Title
        </Text>
        <div className="flex flex-wrap w-[496px] gap-2 justify-center">
          {games.slice(0, 6).map((game, index) => (
            <GameHoverPreview
              key={`${game.name}${index}${game.pageVersion ?? "JAM"}`}
              game={game}
            >
              <Link
                href={`/g/${game.slug}${game.pageVersion ? `?pageVersion=${game.pageVersion}` : ""}`}
              >
                <div
                  className="post-card-shadow h-[77px] w-[136px] overflow-hidden rounded-xl"
                  style={{
                    backgroundColor: colors["mantle"],
                    "--post-card-shadow": `color-mix(in srgb, ${colors["crust"]} 68%, transparent)`,
                  } as CSSProperties}
                >
                  <Image
                    alt={`${game.name}'s thumbnail`}
                    className="z-0 w-full h-full object-cover"
                    height={77}
                    width={136}
                    src={game.thumbnail ?? "/images/D2J_Icon.png"}
                  />
                </div>
              </Link>
            </GameHoverPreview>
            ))}
          {games.length > 6 &&
            games.slice(6, 10).map((game, index) => (
              <GameHoverPreview
                key={`${game.name}${index}${game.pageVersion ?? "JAM"}`}
                game={game}
              >
                <Link
                  href={`/g/${game.slug}${game.pageVersion ? `?pageVersion=${game.pageVersion}` : ""}`}
                >
                  <div
                    className="post-card-shadow h-[59px] w-[104px] overflow-hidden rounded-xl"
                    style={{
                      backgroundColor: colors["mantle"],
                      "--post-card-shadow": `color-mix(in srgb, ${colors["crust"]} 68%, transparent)`,
                    } as CSSProperties}
                  >
                    <Image
                      alt={`${game.name}'s thumbnail`}
                      className="z-0 w-full h-full object-cover"
                      height={59}
                      width={104}
                      src={game.thumbnail ?? "/images/D2J_Icon.png"}
                    />
                  </div>
                </Link>
              </GameHoverPreview>
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
