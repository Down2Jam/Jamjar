"use client";

import { GameType } from "@/types/GameType";
import { ReactNode, useEffect, useState } from "react";
import {
  Button,
  Card,
  CardFooter,
  CardHeader,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Image,
  Link,
  Spinner,
} from "@nextui-org/react";
import { GameSort } from "@/types/GameSort";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Book,
  ClockArrowDown,
  ClockArrowUp,
  Code,
  Flame,
  Gamepad,
  Hammer,
  Headphones,
  Map,
  MicVocal,
  Music,
  Paintbrush,
  Palette,
  Users,
} from "lucide-react";
import { getGames } from "@/requests/game";
import { TeamRole } from "@/types/TeamRole";

export default function TeamFinder() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [games, setGames] = useState<GameType[]>();
  const [sort, setSort] = useState<Set<TeamRole>>(new Set());
  const router = useRouter();

  const sorts: Record<
    TeamRole,
    { name: string; icon: ReactNode; description: string }
  > = {
    artist: {
      name: "Artist",
      icon: <Palette />,
      description:
        "People who create visual assets such as characters, backgrounds, and animations.",
    },
    coder: {
      name: "Coder",
      icon: <Code />,
      description:
        "People who implement game mechanics, features, and systems.",
    },
    gamedesigner: {
      name: "Game Designer",
      icon: <Gamepad />,
      description:
        "People who design core mechanics, rules, and objectives, and create the overall gameplay.",
    },
    generalist: {
      name: "Generalist",
      icon: <Hammer />,
      description:
        "People who are capable of doing every role on a team with no specific focus.",
    },
    management: {
      name: "Management",
      icon: <Users />,
      description:
        "People who oversee the project, coordinating tasks, resolving conflict and ensuring the team stays on track.",
    },
    narrativedesigner: {
      name: "Narrative Designer",
      icon: <Book />,
      description:
        "People who create the storyline, dialogue, and narrative elements of the game.",
    },
    leveldesigner: {
      name: "Level Designer",
      icon: <Map />,
      description:
        "People who create the layout, structure, and pacing of in game levels and the game world.",
    },
    qa: {
      name: "Quality Assurance",
      icon: <Flame />,
      description:
        "People who test the game for bugs, glitches, and gameplay issues before its released.",
    },
    sounddesigner: {
      name: "Sound Designer",
      icon: <Music />,
      description:
        "People who create audio assets including sound effects, ambient sounds, and background music.",
    },
    soundengineer: {
      name: "Sound Engineer",
      icon: <Headphones />,
      description:
        "People who implement sound into the game including audio mixing, mastering, post processing, and events.",
    },
    uxui: {
      name: "UX/UI Designer",
      icon: <Paintbrush />,
      description:
        "People who design the user interface as well as how the player interacts with the game.",
    },
    voiceactor: {
      name: "Voice Actor",
      icon: <MicVocal />,
      description:
        "People who provide voiceovers for characters, narration, or dialogue in game.",
    },
  };

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        //const gameResponse = await getGames(sort);
        //setGames(await gameResponse.json());
        console.log(sort);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameData();
  }, [sort]);

  if (isLoading) return <Spinner />;

  return (
    <>
      <section className="mt-4 mb-4">
        <div className="flex justify-between pb-0">
          <div className="flex gap-2">
            <Dropdown backdrop="opaque">
              <DropdownTrigger>
                <Button
                  size="sm"
                  className="text-xs bg-white dark:bg-[#252525] !duration-250 !ease-linear !transition-all text-[#333] dark:text-white"
                  variant="faded"
                >
                  {sorts[sort]?.name}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                selectionMode="multiple"
                className="text-[#333] dark:text-white"
                selectedKeys={sort}
                onSelectionChange={setSort}
              >
                {Object.entries(sorts).map(([key, sort]) => (
                  <DropdownItem
                    key={key}
                    startContent={sort.icon}
                    description={sort.description}
                  >
                    {sort.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {games ? (
          games.map((game, index) => (
            <Link key={game.name + index} href={`/games/${game.slug}`}>
              <Card radius="lg" isFooterBlurred className="bg-[#212121] w-full">
                <CardHeader className="absolute top-0 flex justify-end">
                  <div className="border border-zinc-100/50 bg-primary p-2 pt-1 pb-1 rounded text-white">
                    {game.jam.name}
                  </div>
                </CardHeader>
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
                    <p className="text-tiny uppercase font-bold">
                      {game.author.name}
                    </p>
                    <p className="text-tiny max-w-[200px] text-end truncate">
                      {game.contributors.length > 0 &&
                        `contributors: ${game.contributors.map(
                          (author) => author.name
                        )}`}
                    </p>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))
        ) : (
          <p>No games were found. :(</p>
        )}
      </section>
    </>
  );
}
