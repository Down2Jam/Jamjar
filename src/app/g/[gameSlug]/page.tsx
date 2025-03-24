"use client";

import { use } from "react";
import { useState, useEffect } from "react";
import { getCookie } from "@/helpers/cookie";
import { Avatar, Chip } from "@nextui-org/react";
import { GameType } from "@/types/GameType";
import { UserType } from "@/types/UserType";
import { getGame } from "@/requests/game";
import { getSelf } from "@/requests/user";
import Image from "next/image";
import { getIcon } from "@/helpers/icon";
import Link from "@/components/link-components/Link";
import ButtonLink from "@/components/link-components/ButtonLink";
import { Edit } from "lucide-react";

export default function GamePage({
  params,
}: {
  params: Promise<{ gameSlug: string }>;
}) {
  const resolvedParams = use(params);
  const gameSlug = resolvedParams.gameSlug;
  const [game, setGame] = useState<GameType | null>(null);
  const [user, setUser] = useState<UserType | null>(null);

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
    <>
      <div className="border-2 border-[#dddddd] dark:border-[#222224] relative rounded-xl overflow-hidden bg-white dark:bg-[#18181a] text-[#333] dark:text-white">
        <div className="bg-[#e4e4e4] dark:bg-[#222222] h-60 relative">
          {game.thumbnail && (
            <Image
              src={game.thumbnail}
              alt={`${game.name}'s thumbnail`}
              className="object-cover"
              fill
            />
          )}
        </div>
        <div className="flex -mt-2 backdrop-blur-md border-t-1 border-white/50 dark:border-[#333]/50">
          <div className="w-2/3 p-4 flex flex-col gap-4">
            <div>
              <p className="text-4xl">{game.name}</p>
              <p className="text-[#333] dark:text-white">
                By{" "}
                {game.team.name ||
                  (game.team.users.length == 1
                    ? game.team.owner.name
                    : `${game.team.owner.name}'s team`)}
              </p>
            </div>
            <div
              className="prose-neutral prose-lg"
              dangerouslySetInnerHTML={{
                __html: game.description || "No Description",
              }}
            />
          </div>
          <div className="flex flex-col w-1/3 gap-4 p-4">
            {isEditable && (
              <div>
                <ButtonLink
                  icon={<Edit />}
                  important
                  href="/create-game"
                  name="Edit"
                />
              </div>
            )}
            <>
              <p className="text-[#666] dark:text-[#ccc] text-xs">AUTHORS</p>
              <div className="flex flex-wrap gap-2">
                {game.team.users.map((user) => (
                  <Chip
                    radius="sm"
                    size="sm"
                    className="!duration-250 !ease-linear !transition-all"
                    variant="faded"
                    avatar={
                      <Avatar
                        src={user.profilePicture}
                        classNames={{ base: "bg-transparent" }}
                      />
                    }
                    key={user.id}
                  >
                    {user.name}
                  </Chip>
                ))}
              </div>
            </>

            {game.tags && (
              <>
                <p className="text-[#666] dark:text-[#ccc] text-xs">TAGS</p>
                <div className="flex flex-wrap gap-2">
                  {game.tags.map((tag) => (
                    <Chip
                      radius="sm"
                      size="sm"
                      className="!duration-250 !ease-linear !transition-all"
                      variant="faded"
                      avatar={
                        tag.icon && (
                          <Avatar
                            src={tag.icon}
                            classNames={{ base: "bg-transparent" }}
                          />
                        )
                      }
                      key={tag.id}
                    >
                      {tag.name}
                    </Chip>
                  ))}
                </div>
              </>
            )}
            {game.flags && (
              <>
                <p className="text-[#666] dark:text-[#ccc] text-xs">FLAGS</p>
                <div className="flex flex-wrap gap-2">
                  {game.flags.map((flag) => (
                    <Chip
                      radius="sm"
                      size="sm"
                      className="!duration-250 !ease-linear !transition-all"
                      variant="faded"
                      avatar={flag.icon && getIcon(flag.icon)}
                      key={flag.id}
                    >
                      {flag.name}
                    </Chip>
                  ))}
                </div>
              </>
            )}
            {/* <div className="flex flex-col gap-2">
              <p className="text-[#666] dark:text-[#ccc] text-xs">
                ACHIEVEMENTS
              </p>
              <Card>
                <CardBody className="text-[#333] dark:text-white">N/A</CardBody>
              </Card>
            </div> */}
            {/* {game.leaderboards && game.leaderboards.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-default-500 text-xs">LEADERBOARD</p>
                <Card>
                  <CardBody className="text-[#333] dark:text-white gap-2">
                    N/A
                    <div>
                      <ButtonAction
                        name="Submit Score"
                        icon={<Plus />}
                        onPress={() => {}}
                      />
                    </div>
                  </CardBody>
                </Card>
              </div>
            )} */}
            {game.downloadLinks && (
              <>
                <p className="text-[#666] dark:text-[#ccc] text-xs">LINKS</p>
                <div className="flex flex-col gap-2 items-start">
                  {game.downloadLinks.map((link) => (
                    <Link
                      key={link.id}
                      name={link.platform}
                      href={link.url}
                      color="blue"
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/*
<div className="max-w-4xl mx-auto px-4 py-8 text-[#333] dark:text-white">
      
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
*/
