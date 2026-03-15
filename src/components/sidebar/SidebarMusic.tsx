"use client";

import SidebarSong from "./SidebarSong";
import useHasMounted from "@/hooks/useHasMounted";
import { Text } from "bioloom-ui";
import { Button } from "bioloom-ui";
import { useMemo } from "react";
import { useTracks } from "@/hooks/queries";

export default function SidebarMusic() {
  const hasMounted = useHasMounted();
  const { data: music } = useTracks();

  const featured = useMemo(
    () => [...(music ?? [])].sort(() => Math.random() - 0.5).slice(0, 5),
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
