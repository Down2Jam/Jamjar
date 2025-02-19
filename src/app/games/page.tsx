"use client";

import { DownloadLinkType } from "@/types/DownloadLinkType";
import { GameType } from "@/types/GameType";
import { useEffect, useState } from "react";
import { Card, CardFooter, CardHeader, Image, Link } from "@nextui-org/react";

const testAuthor = {
  id: 0,
  slug: "test",
  name: "Brainoid",
  bio: "",
  profilePicture: "",
  bannerPicture: "",
  createdAt: new Date(1739882814581),
  mod: false,
  admin: false
}

const testAuthor2 = {
  id: 1,
  slug: "test",
  name: "Spacey",
  bio: "",
  profilePicture: "",
  bannerPicture: "",
  createdAt: new Date(1739882814581),
  mod: false,
  admin: false
}

const testAuthor3 = {
  id: 0,
  slug: "test",
  name: "HonestDan",
  bio: "",
  profilePicture: "",
  bannerPicture: "",
  createdAt: new Date(1739882814581),
  mod: false,
  admin: false
}

const dummyDownload: DownloadLinkType = {
  id: 0,
  url: "test",
  platform: "Windows"
}

const dummyGames: GameType[] = [
    {
      id: 0,
      slug: "test",
      name: "An Honest Adventure 2",
      authorId: 0,
      author: testAuthor3,
      description: "desc",
      thumbnail: undefined,
      createdAt: new Date(1739882814581),
      updatedAt: new Date(1739882814581),
      downloadLinks: [dummyDownload],
      contributors: [testAuthor]
    },
    {
      id: 1,
      slug: "test1",
      name: "Replicat",
      authorId: 1,
      author: testAuthor,
      description: "desc",
      thumbnail: "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/3509430/header.jpg?t=1739887470",
      createdAt: new Date(1739882814581),
      updatedAt: new Date(1739882814581),
      downloadLinks: [dummyDownload],
      contributors: [testAuthor2, testAuthor, testAuthor]
    }
];

export default function GamesPage() {
  const [games, setGames] = useState<GameType[]>();

  useEffect(() => {
    setGames([...dummyGames, ...dummyGames, ...dummyGames, ...dummyGames, ...dummyGames, ...dummyGames, ...dummyGames, ...dummyGames]);
  }, []);

  return !games ? (
    <p>No games found. Loading...</p>
  ):(
    <section className="pl-4 pr-4">
      <h1 className="text-3xl mb-4">Games</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {games.map((game, index) =>
        <Link key={game.name+index} href={`/games/${game.slug}`} >
          <Card radius="lg" isFooterBlurred className="bg-[#212121] w-full">
              <Image
                removeWrapper
                alt={`${game.name}'s thumbnail`}
                className="z-0 w-full h-full object-cover scale-110"
                height={200}
                width="100%"
                isZoomed
                src={game.thumbnail ?? "/images/D2J_Icon.png"}
             />
            <CardFooter className="text-white border-t-1 border-zinc-100/50 z-10 flex-col items-start">
              <h3 className="font-medium text-2xl mb-2">{game.name}</h3>
              <div className="flex justify-between w-full">
                <p className="text-tiny uppercase font-bold">{game.author.name}</p>
                <p className="text-tiny max-w-[200px] text-end truncate">{game.contributors.length > 0 && `contributors: ${game.contributors.map(author => author.name)}`}</p>
              </div>
            </CardFooter>
          </Card>
        </Link>
        )}
      </div>
    </section>
  );
}
