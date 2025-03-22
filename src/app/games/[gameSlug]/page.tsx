"use client";

import { use } from "react";
import { useState, useEffect } from "react";
import { getCookie } from "@/helpers/cookie";
import Link from "next/link";
import { Button } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { GameType } from "@/types/GameType";
import { UserType } from "@/types/UserType";
import { DownloadLinkType } from "@/types/DownloadLinkType";
import { getGame } from "@/requests/game";
import { getSelf } from "@/requests/user";

export default function GamePage({
  params,
}: {
  params: Promise<{ gameSlug: string }>;
}) {
  const resolvedParams = use(params);
  const gameSlug = resolvedParams.gameSlug;
  const [game, setGame] = useState<GameType | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchGameAndUser = async () => {
      // Fetch the game data
      const gameResponse = await getGame(gameSlug);

      if (gameResponse.ok) {
        const gameData = await gameResponse.json();

        setGame(gameData);
      }

      // Fetch the logged-in user data
      if (getCookie("token")) {
        try {
          const userResponse = await getSelf();

          if (userResponse.ok) {
            const userData = await userResponse.json();
            setUser(userData);
          }
        } catch (error) {
          console.error(error);
        }
      }
    };

    fetchGameAndUser();
  }, [gameSlug]);

  if (!game) return <div>Loading...</div>;

  // Check if the logged-in user is the creator or a contributor
  const isEditable =
    user &&
    game.team.users.some((contributor: UserType) => contributor.id === user.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-[#333] dark:text-white">
      {/* Game Name and Edit Button */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-4xl font-bold">{game.name}</h1>
        {isEditable && (
          <Button
            color="primary"
            variant="solid"
            onPress={() => router.push(`/create-game`)}
          >
            Edit
          </Button>
        )}
      </div>

      {/* Authors */}
      <div className="mb-8">
        <p className="text-gray-600 flex items-center gap-2">
          Created by{" "}
          <span className="flex items-center gap-2">
            {game.team.users.map((user) => (
              <Link href={`/users/${user.slug}`} key={user.id}>
                {user.name}
              </Link>
            ))}
          </span>
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">About</h2>
        <div
          className="prose-neutral prose-lg"
          dangerouslySetInnerHTML={{
            __html: game.description || "No Description",
          }}
        />
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Links</h2>
        <div className="flex flex-col gap-2">
          {game.downloadLinks.map((link: DownloadLinkType) => (
            <div className="flex gap-2" key={link.id}>
              <p>{link.platform}</p>
              <a href={link.url} className="underline">
                {link.url}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Game Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Views</p>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Downloads</p>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Rating</p>
          <p className="text-2xl font-bold">N/A</p>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Comments</p>
          <p className="text-2xl font-bold">0</p>
        </div>
      </div>
    </div>
  );
}
