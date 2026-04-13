"use client";

import SidebarSong from "./SidebarSong";
import useHasMounted from "@/hooks/useHasMounted";
import { Text } from "bioloom-ui";
import { Button } from "bioloom-ui";
import { useMemo } from "react";
import { useCurrentJam, useTracks } from "@/hooks/queries";
import { getDefaultListingPageVersion } from "@/helpers/listingPageVersion";

export default function SidebarMusic() {
  const hasMounted = useHasMounted();
  const { data: activeJam } = useCurrentJam();

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

  const { data: music } = useTracks(sort, jamId, pageVersion);

  const featured = useMemo(
    () => [...(music ?? [])].slice(0, 5),
    [music]
  );

  if (!hasMounted) return null;

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
