"use client";

import { ExternalLink } from "lucide-react";
import SidebarSong from "./SidebarSong";
import { Spacer } from "@heroui/react";
import ButtonLink from "../link-components/ButtonLink";
import { useTheme } from "@/providers/SiteThemeProvider";
import useHasMounted from "@/hooks/useHasMounted";

const music = [
  {
    name: "Main Theme",
    artist: "Brainoid",
    thumbnail: "/images/test-images/8vu7cm9a.bmp",
    game: "Sammich",
    song: "Sammich.ogg",
  },
  {
    name: "Emmett The Loopwalker",
    artist: "Brainoid",
    thumbnail: "/images/test-images/Emmet.png",
    game: "Loopwalker",
    song: "Emmet.ogg",
  },
  {
    name: "Cootsmania",
    artist: "Brainoid",
    thumbnail: "/images/test-images/LDcA_C.png",
    game: "Cootsmania",
    song: "Cootsmania.mp3",
  },
  {
    name: "Cool Track, Fun Track",
    artist: "Brainoid",
    thumbnail: "/images/test-images/H6Bcjg.png",
    game: "Ryder Funk",
    song: "Cool Track, Fun Track.ogg",
  },
  {
    name: "Horse Soop All the Way",
    artist: "Brainoid",
    thumbnail: "/images/test-images/H6Bcjg.png",
    game: "Ryder Funk",
    song: "Horse Soop All the Way.ogg",
  },
  {
    name: "Death Ante",
    artist: "Brainoid",
    thumbnail: "/images/test-images/5BiQKi.png",
    game: "Replicat",
    song: "Death Ante.ogg",
  },
  {
    name: "Easy Ante",
    artist: "Brainoid",
    thumbnail: "/images/test-images/5BiQKi.png",
    game: "Replicat",
    song: "Easy Ante.ogg",
  },
  {
    name: "First Ante",
    artist: "Brainoid",
    thumbnail: "/images/test-images/5BiQKi.png",
    game: "Replicat",
    song: "First Ante.ogg",
  },
  {
    name: "Hard Ante",
    artist: "Brainoid",
    thumbnail: "/images/test-images/5BiQKi.png",
    game: "Replicat",
    song: "Hard Ante.ogg",
  },
  {
    name: "Legendary Ante",
    artist: "Brainoid",
    thumbnail: "/images/test-images/5BiQKi.png",
    game: "Replicat",
    song: "Legendary Ante.ogg",
  },
  {
    name: "Medium Ante",
    artist: "Brainoid",
    thumbnail: "/images/test-images/5BiQKi.png",
    game: "Replicat",
    song: "Medium Ante.ogg",
  },
  {
    name: "Shop 1",
    artist: "Brainoid",
    thumbnail: "/images/test-images/5BiQKi.png",
    game: "Replicat",
    song: "Shop 1.ogg",
  },
  {
    name: "Shop 2",
    artist: "Brainoid",
    thumbnail: "/images/test-images/5BiQKi.png",
    game: "Replicat",
    song: "Shop 2.ogg",
  },
  {
    name: "Very Easy Ante",
    artist: "Brainoid",
    thumbnail: "/images/test-images/5BiQKi.png",
    game: "Replicat",
    song: "Very Easy Ante.ogg",
  },
  {
    name: "Very Hard Ante",
    artist: "Brainoid",
    thumbnail: "/images/test-images/5BiQKi.png",
    game: "Replicat",
    song: "Very Hard Ante.ogg",
  },
];

export default function SidebarMusic() {
  const { colors } = useTheme();
  const hasMounted = useHasMounted();

  if (!hasMounted) return;

  const featured = [...music].sort(() => Math.random() - 0.5).slice(0, 5);

  return (
    <>
      <Spacer y={20} />
      <div className="flex flex-col gap-2">
        <p
          className="text-center text-2xl"
          style={{
            color: colors["text"],
          }}
        >
          Featured Music
        </p>
        <div className="flex flex-col w-[488px] gap-2">
          {featured.map((track, index) => (
            <SidebarSong
              key={index}
              name={track.name}
              artist={track.artist}
              thumbnail={track.thumbnail}
              game={track.game}
              song={track.song}
            />
          ))}
        </div>
        <div className="flex justify-center gap-2">
          {/* <ButtonAction
            icon={<MoreHorizontal />}
            name="Load More"
            onPress={() => {}}
          /> */}
          <ButtonLink
            icon={<ExternalLink />}
            name="To Music Page"
            href="/music"
          />
        </div>
      </div>
    </>
  );
}
