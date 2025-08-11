"use client";

import { ExternalLink } from "lucide-react";
import SidebarSong from "./SidebarSong";
import { Spacer } from "@heroui/react";
import ButtonLink from "../link-components/ButtonLink";
import { useTheme } from "@/providers/SiteThemeProvider";

export default function SidebarMusic() {
  const { colors } = useTheme();

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
          <SidebarSong
            name="Main Theme"
            artist="Brainoid"
            thumbnail="/images/test-images/8vu7cm9a.bmp"
            game="Sammich"
            song="Sammich.ogg"
          />
          <SidebarSong
            name="Emmett The Loopwalker"
            artist="Brainoid"
            thumbnail="/images/test-images/Emmet.png"
            game="Loopwalker"
            song="Emmet.ogg"
          />
          <SidebarSong
            name="Cootsmania"
            artist="Brainoid"
            thumbnail="/images/test-images/LDcA_C.png"
            game="Cootsmania"
            song="Cootsmania.mp3"
          />
          <SidebarSong
            name="Cool Track, Fun Track"
            artist="Brainoid"
            thumbnail="/images/test-images/H6Bcjg.png"
            game="Ryder Funk"
            song="Cool Track, Fun Track.ogg"
          />
          <SidebarSong
            name="Horse Soop All the Way"
            artist="Brainoid"
            thumbnail="/images/test-images/H6Bcjg.png"
            game="Ryder Funk"
            song="Horse Soop All the Way.ogg"
          />
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
