"use client";

import { Image } from "@nextui-org/react";
import NextImage from "next/image";
import Streams from "../streams";
import Timers from "../timers";
import ButtonLink from "../link-components/ButtonLink";
import { SiDiscord } from "@icons-pack/react-simple-icons";

export default function SidebarBanner() {
  return (
    <div>
      <div className="absolute z-10 flex items-center justify-center w-[480px] h-[160px] flex-col">
        <p className="text-6xl">Down2Jam</p>
        <p>The community centered game jam</p>
      </div>
      <Image
        as={NextImage}
        src="/images/D2J_Banner.png"
        width={480}
        height={160}
        className="z-0"
        alt="Down2Jam Banner"
      />
    </div>
  );
}
