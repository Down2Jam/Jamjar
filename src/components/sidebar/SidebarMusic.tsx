"use client";

import SidebarSong from "./SidebarSong";
import useHasMounted from "@/hooks/useHasMounted";
import { Text } from "bioloom-ui";
import { Button } from "bioloom-ui";
import { useMemo } from "react";
import { useCurrentJam, useTracks } from "@/hooks/queries";
import { getDefaultListingPageVersion } from "@/helpers/listingPageVersion";
import { Skeleton } from "@/components/skeletons";

export default function SidebarMusic() {
  const hasMounted = useHasMounted();
  const { data: activeJam, isLoading: jamLoading } = useCurrentJam();

  const { jamId, sort, pageVersion } = useMemo(() => {
    const phase = activeJam?.phase ?? "";
    const isActiveJamBehavior =
      phase === "Jamming" || phase === "Submission" || phase === "Rating";
    const isPostJamBehavior = phase === "Post-Jam Refinement" || phase === "Post-Jam Rating";
    const currentJamId = activeJam?.jam?.id?.toString() ?? null;
    const selectedJamId =
      activeJam?.jam?.id && (isActiveJamBehavior || isPostJamBehavior)
        ? activeJam.jam.id.toString()
        : "all";

    return {
      jamId:
        activeJam?.jam?.id && (isActiveJamBehavior || isPostJamBehavior)
          ? activeJam.jam.id.toString()
          : undefined,
      sort: isActiveJamBehavior ? "random" : "score",
      pageVersion: getDefaultListingPageVersion(
        selectedJamId,
        currentJamId,
        phase,
      ),
    };
  }, [activeJam]);

  const { data: music, isLoading: musicLoading } = useTracks(
    sort,
    jamId,
    pageVersion
  );

  const featured = useMemo(() => {
    const seenGameKeys = new Set<string>();
    return (music ?? [])
      .filter((track) => {
        const gameKey = String(track.gameId ?? track.game?.id ?? track.game?.slug ?? track.id);
        if (seenGameKeys.has(gameKey)) return false;
        seenGameKeys.add(gameKey);
        return true;
      })
      .slice(0, 5);
  }, [music]);

  if (!hasMounted || jamLoading || musicLoading) {
    return (
      <div className="mt-20 flex flex-col items-center gap-2">
        <Skeleton className="h-8 w-44" />
        <div className="flex w-[488px] flex-col gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-2"
            >
              <Skeleton className="h-14 w-14 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
    );
  }

  return (
    <>
      {featured.length > 0 && (
        <div className="flex flex-col gap-2 items-center mt-20">
          <Text size="2xl" color="text">
            SidebarMusic.Title
          </Text>
          <div className="flex flex-col w-[488px] gap-2">
            {featured.map((track, index) => (
              <SidebarSong
                key={index}
                slug={track.slug}
                name={track.name}
                artist={track.composer}
                thumbnail={track.game.thumbnail || "/images/D2J_Icon.png"}
                game={track.game}
                pageVersion={track.pageVersion}
                song={track.url}
                license={track.license}
                allowDownload={track.allowDownload}
                allowBackgroundUse={track.allowBackgroundUse}
                allowBackgroundUseAttribution={
                  track.allowBackgroundUseAttribution
                }
              />
            ))}
          </div>
          <Button icon="moveupright" href="/music">
            SidebarMusic.Link
          </Button>
        </div>
      )}
    </>
  );
}
