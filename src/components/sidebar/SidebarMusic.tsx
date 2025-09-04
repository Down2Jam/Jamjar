"use client";

import SidebarSong from "./SidebarSong";
import useHasMounted from "@/hooks/useHasMounted";
import Text from "@/framework/Text";
import { Button } from "@/framework/Button";
import { useEffect, useState } from "react";
import { TrackType } from "@/types/TrackType";
import { BASE_URL } from "@/requests/config";

export default function SidebarMusic() {
  const hasMounted = useHasMounted();
  const [music, setMusic] = useState<TrackType[]>([]);

  useEffect(() => {
    async function loadData() {
      const res = await fetch(`${BASE_URL}/tracks`);
      const json = await res.json();

      setMusic(json.data);
    }

    loadData();
  }, []);

  if (!hasMounted) return;

  const featured = [...music].sort(() => Math.random() - 0.5).slice(0, 5);

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
