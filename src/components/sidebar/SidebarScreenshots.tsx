"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import Image from "@/compat/next-image";
import Link from "@/compat/next-link";
import { Skeleton } from "@/components/skeletons";
import {
  getDefaultListingPageVersion,
  isJamPhase,
  isPostJamPhase,
} from "@/helpers/listingPageVersion";
import { useCurrentJam, useGames } from "@/hooks/queries";
import { Button } from "bioloom-ui";
import { useMemo } from "react";
import SidebarSectionTitle from "./SidebarSectionTitle";

const MAX_FEATURED_SCREENSHOTS = 20;

export default function SidebarScreenshots() {
  const uiText = useUiTranslations();
  const { data: activeJam, isLoading: jamLoading } = useCurrentJam();
  const { jamId, pageVersion } = useMemo(() => {
    const phase = activeJam?.phase;
    const currentJamId = activeJam?.jam?.id?.toString() ?? null;
    const useCurrentJam = isJamPhase(phase) || isPostJamPhase(phase);
    const selectedJamId = useCurrentJam ? currentJamId : null;

    return {
      jamId: selectedJamId ?? undefined,
      pageVersion: getDefaultListingPageVersion(
        selectedJamId ?? "all",
        currentJamId,
        phase,
      ),
    };
  }, [activeJam]);

  const { data: games = [], isLoading } = useGames(
    "random",
    jamId,
    pageVersion,
    true,
    50,
  );

  const screenshots = useMemo(() => {
    const seen = new Set<string>();
    const screenshotsByGame = games.map((game) => ({
      game,
      sources: [
          ...(game.screenshots ?? []),
          ...(game.jamPage?.screenshots ?? []),
          ...(game.postJamPage?.screenshots ?? []),
        ].filter((candidate): candidate is string => {
          if (!candidate?.trim() || seen.has(candidate)) return false;
          seen.add(candidate);
          return true;
        }),
    }));
    const selected: Array<{
      game: (typeof games)[number];
      src: string;
    }> = [];

    for (
      let screenshotIndex = 0;
      selected.length < MAX_FEATURED_SCREENSHOTS;
      screenshotIndex += 1
    ) {
      let addedScreenshot = false;

      for (const { game, sources } of screenshotsByGame) {
        const src = sources[screenshotIndex];
        if (!src) continue;

        selected.push({ game, src });
        addedScreenshot = true;
        if (selected.length === MAX_FEATURED_SCREENSHOTS) break;
      }

      if (!addedScreenshot) break;
    }

    return selected;
  }, [games]);

  if (jamLoading || isLoading) {
    return (
      <div className="mt-12 flex flex-col items-center gap-2">
        <Skeleton className="h-8 w-52" />
        <div className="grid w-full grid-cols-2 gap-2">
          {Array.from({ length: MAX_FEATURED_SCREENSHOTS }).map((_, index) => (
            <Skeleton
              key={index}
              className="aspect-video w-full rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }

  if (screenshots.length === 0) return null;

  return (
    <div className="mt-12 flex flex-col items-center gap-2">
      <SidebarSectionTitle>
         {uiText("AppStrings.FeaturedScreenshots")} </SidebarSectionTitle>

      <div className="grid w-full grid-cols-2 gap-2">
        {screenshots.map(({ game, src }) => (
          <Link
            key={`${game.id}:${game.pageVersion ?? "JAM"}:${src}`}
            href={`/g/${game.slug}${game.pageVersion ? `?pageVersion=${game.pageVersion}` : ""}`}
            className="group post-card-shadow relative aspect-video overflow-hidden rounded-xl bg-black/30"
            aria-label={uiText("AppStrings.OpenValue0", { value0: game.name })}
          >
            <Image
              src={src}
              alt={uiText("AppStrings.Value0Screenshot", { value0: game.name })}
              width={240}
              height={135}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03] group-hover:brightness-75"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2 pt-8 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <p className="truncate text-sm font-semibold text-white">
                {game.name}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <Button icon="moveupright" href="/screenshots">
         {uiText("AppStrings.ToScreenshotsPage")} </Button>
    </div>
  );
}
