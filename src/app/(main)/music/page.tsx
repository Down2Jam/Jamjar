"use client";

import SidebarSong from "@/components/sidebar/SidebarSong";
import { Vstack } from "@/framework/Stack";
import Text from "@/framework/Text";
import { useTheme } from "@/providers/SiteThemeProvider";
import { BASE_URL } from "@/requests/config";
import { TrackType } from "@/types/TrackType";
import { useEffect, useState } from "react";

export default function MusicPage() {
  const { colors } = useTheme();
  const [music, setMusic] = useState<TrackType[]>([]);

  useEffect(() => {
    async function loadData() {
      const res = await fetch(`${BASE_URL}/tracks`);
      const json = await res.json();

      setMusic(json.data);
    }

    loadData();
  }, []);

  return (
    <Vstack>
      <p
        className="text-center text-2xl"
        style={{
          color: colors["text"],
        }}
      >
        Music
      </p>
      <Text color="textFaded">All the music uploaded to the site</Text>
      <Vstack align="stretch" className="w-[488px]">
        {music.map((track, index) => (
          <SidebarSong
            key={index}
            name={track.name}
            artist={track.composer.name}
            thumbnail={track.image || "/images/D2J_Icon.png"}
            game={track.game.name}
            song={track.url}
          />
        ))}
      </Vstack>
    </Vstack>
  );
}
