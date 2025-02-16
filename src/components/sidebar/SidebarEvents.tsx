"use client";

import { Image } from "@nextui-org/react";
import NextImage from "next/image";
import ButtonAction from "../link-components/ButtonAction";
import { ExternalLink, MoreHorizontal } from "lucide-react";

export default function SidebarEvents() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-2xl">Upcoming Events</p>
      <div className="flex flex-col w-[488px] gap-2">
        <Image
          as={NextImage}
          src="/images/D2J_Banner.png"
          width={480}
          height={80}
          className="z-0"
          alt="Down2Jam Banner"
        />
        <Image
          as={NextImage}
          src="/images/D2J_Banner.png"
          width={480}
          height={80}
          className="z-0"
          alt="Down2Jam Banner"
        />
        <Image
          as={NextImage}
          src="/images/D2J_Banner.png"
          width={480}
          height={80}
          className="z-0"
          alt="Down2Jam Banner"
        />
        <Image
          as={NextImage}
          src="/images/D2J_Banner.png"
          width={480}
          height={80}
          className="z-0"
          alt="Down2Jam Banner"
        />
        <Image
          as={NextImage}
          src="/images/D2J_Banner.png"
          width={480}
          height={80}
          className="z-0"
          alt="Down2Jam Banner"
        />
        <Image
          as={NextImage}
          src="/images/D2J_Banner.png"
          width={480}
          height={80}
          className="z-0"
          alt="Down2Jam Banner"
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
          name="To Events Page"
          onPress={() => {}}
        />
      </div>
    </div>
  );
}
