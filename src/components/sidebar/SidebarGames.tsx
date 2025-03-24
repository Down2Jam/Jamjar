"use client";

import { Image } from "@heroui/react";
import NextImage from "next/image";
import ButtonAction from "../link-components/ButtonAction";
import { ExternalLink, MoreHorizontal } from "lucide-react";

export default function SidebarGames() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-2xl">Featured Games</p>
      <div className="flex flex-wrap w-[496px] gap-2">
        <Image
          as={NextImage}
          src="/images/test-images/dzytlc9d.bmp"
          width={160}
          height={128}
          className="z-0"
          alt="Example Game"
        />
        <Image
          as={NextImage}
          src="/images/test-images/itx9z7wf.bmp"
          width={160}
          height={128}
          className="z-0"
          alt="Example Game"
        />
        <Image
          as={NextImage}
          src="/images/test-images/pr5o378z.bmp"
          width={160}
          height={128}
          className="z-0"
          alt="Example Game"
        />
        <Image
          as={NextImage}
          src="/images/test-images/ttkcxjyf.bmp"
          width={160}
          height={128}
          className="z-0"
          alt="Example Game"
        />
        <Image
          as={NextImage}
          src="/images/test-images/8vu7cm9a.bmp"
          width={160}
          height={128}
          className="z-0"
          alt="Example Game"
        />
        <Image
          as={NextImage}
          src="/images/test-images/4cgjqnfh.bmp"
          width={160}
          height={128}
          className="z-0"
          alt="Example Game"
        />
      </div>
      <div className="flex flex-wrap w-[504px] gap-2">
        <Image
          as={NextImage}
          src="/images/test-images/owgpw63j.bmp"
          width={120}
          height={96}
          className="z-0"
          alt="Example Game"
        />
        <Image
          as={NextImage}
          src="/images/test-images/6kh3qqui.bmp"
          width={120}
          height={96}
          className="z-0"
          alt="Example Game"
        />
        <Image
          as={NextImage}
          src="/images/test-images/yhfxmq4w.bmp"
          width={120}
          height={96}
          className="z-0"
          alt="Example Game"
        />
        <Image
          as={NextImage}
          src="/images/test-images/nstyehmq.bmp"
          width={120}
          height={96}
          className="z-0"
          alt="Example Game"
        />
        <Image
          as={NextImage}
          src="/images/test-images/602to9m4.bmp"
          width={120}
          height={96}
          className="z-0"
          alt="Example Game"
        />
        <Image
          as={NextImage}
          src="/images/test-images/7df8it3b.bmp"
          width={120}
          height={96}
          className="z-0"
          alt="Example Game"
        />
        <Image
          as={NextImage}
          src="/images/test-images/1cns2nmf.bmp"
          width={120}
          height={96}
          className="z-0"
          alt="Example Game"
        />
        <Image
          as={NextImage}
          src="/images/test-images/lwuh1k06.bmp"
          width={120}
          height={96}
          className="z-0"
          alt="Example Game"
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
          name="To Games Page"
          onPress={() => {}}
        />
      </div>
    </div>
  );
}
