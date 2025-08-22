"use client";

import SidebarSong from "./SidebarSong";
import useHasMounted from "@/hooks/useHasMounted";
import Text from "@/framework/Text";
import { Button } from "@/framework/Button";

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
  {
    name: "Rocket Mobilization",
    artist: "Conduit",
    thumbnail: "/images/test-images/conduit.png",
    game: "Leaving Terra",
    song: "01_Rocket Mobilization.mp3",
  },
  {
    name: "Global Technical Progress",
    artist: "Conduit",
    thumbnail: "/images/test-images/conduit.png",
    game: "Leaving Terra",
    song: "02_Global Technical Progress.mp3",
  },
  {
    name: "Celestial Simulations",
    artist: "Conduit",
    thumbnail: "/images/test-images/conduit.png",
    game: "Leaving Terra",
    song: "03_Celestial Simulations.mp3",
  },
  {
    name: "Training Complexities",
    artist: "Conduit",
    thumbnail: "/images/test-images/conduit.png",
    game: "Leaving Terra",
    song: "04_Training Complexities.mp3",
  },
  {
    name: "Last Moments on Terra",
    artist: "Conduit",
    thumbnail: "/images/test-images/conduit.png",
    game: "Leaving Terra",
    song: "05_Last Moments on Terra.mp3",
  },
  {
    name: "Launch Anticipation",
    artist: "Conduit",
    thumbnail: "/images/test-images/conduit.png",
    game: "Leaving Terra",
    song: "06_Launch Anticipation.mp3",
  },
  {
    name: "Leaving Terra",
    artist: "Conduit",
    thumbnail: "/images/test-images/conduit.png",
    game: "Leaving Terra",
    song: "07_Leaving Terra.mp3",
  },
  {
    name: "Traveling Through Local Space",
    artist: "Conduit",
    thumbnail: "/images/test-images/conduit.png",
    game: "Leaving Terra",
    song: "08_Traveling Through Local Space.mp3",
  },
  {
    name: "Positive Reflections",
    artist: "Conduit",
    thumbnail: "/images/test-images/conduit.png",
    game: "Leaving Terra",
    song: "09_Positive Reflections.mp3",
  },
  {
    name: "Mission Completion",
    artist: "Conduit",
    thumbnail: "/images/test-images/conduit.png",
    game: "Leaving Terra",
    song: "10_Mission Completion.mp3",
  },
];

export default function SidebarMusic() {
  const hasMounted = useHasMounted();

  if (!hasMounted) return;

  const featured = [...music].sort(() => Math.random() - 0.5).slice(0, 5);

  return (
    <>
      <div className="flex flex-col gap-2 items-center mt-20">
        <Text size="2xl" color="text">
          SidebarMusic.Title
        </Text>
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
        <Button icon="moveupright" href="/music">
          SidebarMusic.Link
        </Button>
      </div>
    </>
  );
}
