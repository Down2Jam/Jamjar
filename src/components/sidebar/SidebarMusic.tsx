"use client";

import SidebarSong from "./SidebarSong";
import useHasMounted from "@/hooks/useHasMounted";
import Text from "@/framework/Text";
import { Button } from "@/framework/Button";
import { useEffect, useMemo, useState } from "react";
import { TrackType } from "@/types/TrackType";
import { BASE_URL } from "@/requests/config";

import { getCurrentJam, ActiveJamResponse } from "@/helpers/jam";

export default function SidebarMusic() {
  const hasMounted = useHasMounted();
  const [music, setMusic] = useState<TrackType[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        let jamId: string | undefined;
        try {
          const active: ActiveJamResponse | null = await getCurrentJam();
          const phase = active?.phase ?? "";
          const inWindow =
            phase === "Jamming" || phase === "Submission" || phase === "Rating";
          if (active?.jam?.id && inWindow) {
            jamId = active.jam.id.toString();
          }
        } catch {}

        const qs = new URLSearchParams();
        if (jamId) qs.set("jamId", jamId);

        const res = await fetch(
          `${BASE_URL}/tracks${qs.toString() ? `?${qs.toString()}` : ""}`
        );
        const json = await res.json();
        const tracks: TrackType[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
          ? json.data
          : [];

        setMusic(tracks);
      } catch (err) {
        console.error(err);
        setMusic([]);
      }
    }

    loadData();
  }, []);

  const featured = useMemo(
    () => [...music].sort(() => Math.random() - 0.5).slice(0, 5),
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
                name={track.name}
                artist={track.composer.name}
                thumbnail={track.game.thumbnail || "/images/D2J_Icon.png"}
                game={track.game.name}
                song={track.url}
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
