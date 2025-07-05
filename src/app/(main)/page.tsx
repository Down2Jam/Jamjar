import { Image } from "@heroui/image";
import { Button } from "@heroui/button";
import NextImage from "next/image";
import { Spacer } from "@heroui/react";
import HomeBackground from "./HomeBackground";
import Link from "next/link";

export default async function Home() {
  return (
    <>
      <HomeBackground />
      <Spacer y={72} />
      <div className="flex justify-center items-center gap-16 relative z-0">
        <div>
          <h1 className="text-5xl bg-gradient-to-r from-[#46c2e1] to-[#d84f7b] bg-clip-text text-transparent w-fit font-bold">
            Down2Jam
          </h1>
          <p className="text-2xl font-semibold">
            The community centered game jam
          </p>
          <p className="text-gray-400">September 5th - 8th</p>
          <Spacer y={4} />
          <div className="flex flex-row gap-2">
            <Button
              variant="ghost"
              className="border-[#3c72b9] text-[#46c2e1]"
              as={Link}
              href="/signup"
            >
              Join
            </Button>
            <Button variant="ghost" as={Link} href="/about">
              About
            </Button>
            <Button variant="ghost" as={Link} href="/why">
              Why Jam?
            </Button>
          </div>
        </div>
        <Image
          isBlurred
          src="/images/D2J_Icon.png"
          as={NextImage}
          width={256}
          height={256}
          alt="D2Jam Logo"
          className="shadow-xl"
        />
      </div>
    </>
  );
}
