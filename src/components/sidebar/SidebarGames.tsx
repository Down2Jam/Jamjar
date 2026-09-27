"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { GameType } from "@/types/GameType";
import { useTheme } from "@/providers/useSiteTheme";
import Image from "@/compat/next-image";
import { Button } from "bioloom-ui";
import Link from "@/compat/next-link";
import { useCurrentJam, useGames } from "@/hooks/queries";
import { CSSProperties, useMemo } from "react";
import { getDefaultListingPageVersion } from "@/helpers/listingPageVersion";
import { Skeleton } from "@/components/skeletons";
import { GameHoverPreview } from "@/components/gamecard";
import SidebarSectionTitle from "./SidebarSectionTitle";

export default function SidebarGames() {
  const uiText = useUiTranslations();
  const { colors } = useTheme();
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
    18,
  );

  const games: GameType[] = useMemo(
    () => (Array.isArray(gamesData) ? gamesData : []),
    [gamesData]
  );

  if (jamLoading || isLoading) {
    return (
      <div className="mt-12 flex flex-col items-center gap-2">
        <Skeleton className="h-8 w-44" />
        <div className="flex w-full flex-wrap justify-center gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`large-${index}`} className="h-[119px] w-[212px] rounded-xl" />
          ))}
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[77px] w-[136px] rounded-xl" />
          ))}
          {Array.from({ length: 8 }).map((_, index) => (
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
      <div className="flex flex-col gap-2 items-center mt-12">
        <SidebarSectionTitle>
          SidebarGames.Title
        </SidebarSectionTitle>
        <div className="flex w-full flex-wrap justify-center gap-2">
          {games.slice(0, 4).map((game, index) => (
            <GameHoverPreview
              key={`large-${game.name}${index}${game.pageVersion ?? "JAM"}`}
              game={game}
            >
              <Link
                href={`/g/${game.slug}${game.pageVersion ? `?pageVersion=${game.pageVersion}` : ""}`}
              >
                <div
                  className="post-card-shadow h-[119px] w-[212px] overflow-hidden rounded-xl"
                  style={{
                    backgroundColor: colors["mantle"],
                    "--post-card-shadow": `color-mix(in srgb, ${colors["crust"]} 68%, transparent)`,
                  } as CSSProperties}
                >
                  <Image
                    alt={uiText("AppStrings.Value0SThumbnail", { value0: game.name })}
                    className="z-0 h-full w-full object-cover"
                    height={119}
                    width={212}
                    src={game.thumbnail || "/images/game-thumbnail.png"}
                  />
                </div>
              </Link>
            </GameHoverPreview>
          ))}
          {games.slice(4, 10).map((game, index) => (
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
                    alt={uiText("AppStrings.Value0SThumbnail", { value0: game.name })}
                    className="z-0 w-full h-full object-cover"
                    height={77}
                    width={136}
                    src={game.thumbnail || "/images/game-thumbnail.png"}
                  />
                </div>
              </Link>
            </GameHoverPreview>
            ))}
          {games.length > 10 &&
            games.slice(10, 18).map((game, index) => (
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
                      alt={uiText("AppStrings.Value0SThumbnail", { value0: game.name })}
                      className="z-0 w-full h-full object-cover"
                      height={59}
                      width={104}
                      src={game.thumbnail || "/images/game-thumbnail.png"}
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
