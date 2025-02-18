import { Image } from "@nextui-org/react";
import NextImage from "next/image";

export default function SidebarBanner() {
  return (
    <a href="/about">
      <div className="absolute z-10 flex items-center justify-center w-[480px] h-[160px] flex-col text-white">
        <p className="text-6xl">Down2Jam</p>
        <p className="text-gray-400">The community centered game jam</p>
      </div>
      <Image
        as={NextImage}
        src="/images/D2J_Banner.png"
        width={480}
        height={160}
        className="z-0 shadow-2xl"
        alt="Down2Jam Banner"
      />
    </a>
  );
}
