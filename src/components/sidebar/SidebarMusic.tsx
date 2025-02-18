"use client";

import ButtonAction from "../link-components/ButtonAction";
import { ExternalLink, MoreHorizontal } from "lucide-react";
import SidebarSong from "./SidebarSong";

export default function SidebarMusic() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-2xl">Featured Music</p>
      <div className="flex flex-col w-[488px] gap-2">
        <SidebarSong
          name="Main Theme"
          artist="Brainoid"
          thumbnail="/images/test-images/8vu7cm9a.bmp"
          game="Sammich"
          format="audio/ogg"
          song="/music/Sammich.ogg"
        />
        <SidebarSong
          name="AA"
          artist="AA"
          thumbnail="/images/D2J_Icon.png"
          format="audio/ogg"
          song="/music/game.ogg"
          game="Test"
        />
        <SidebarSong
          name="Iguanodon"
          artist="Ategon"
          thumbnail="/images/D2J_Icon.png"
          format="audio/wav"
          song="/music/iguanodon.wav"
          game="Test"
        />
      </div>
      <div className="flex justify-center gap-2">
        <ButtonAction
          icon={<MoreHorizontal />}
          name="Load More"
          onPress={() => {}}
        />
        <ButtonAction
          icon={<ExternalLink />}
          name="To Music Page"
          onPress={() => {}}
        />
      </div>
    </div>
  );
}
