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
} from "@heroui/react";
import { GameSort } from "@/types/GameSort";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ChevronsDown,
  CircleAlert,
  ClockArrowDown,
  ClockArrowUp,
  Dice5,
} from "lucide-react";
import { getGames } from "@/requests/game";
import { UserType } from "@/types/UserType";
import { getSelf } from "@/requests/user";

export default function Games() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [games, setGames] = useState<GameType[]>();
  const [sort, setSort] = useState<GameSort>(
    (["newest", "oldest", "random", "leastratings", "danger"].includes(
      searchParams.get("sort") as GameSort
    ) &&
      (searchParams.get("sort") as GameSort)) ||
      "random"
  );
  const router = useRouter();
  const [user, setUser] = useState<UserType>();

  const sorts: Record<
    GameSort,
    { name: string; icon: ReactNode; description: string }
  > = {
    random: {
      name: "Random",
      icon: <Dice5 />,
      description: "Shows games in a random order",
    },
    leastratings: {
      name: "Least Ratings",
      icon: <ChevronsDown />,
      description: "Shows games that have the least amount of ratings first",
    },
    danger: {
      name: "Danger",
      icon: <CircleAlert />,
      description: "Shows games closest to being able to be ranked",
    },
    newest: {
      name: "Newest",
      icon: <ClockArrowUp />,
      description: "Shows the newest game first",
    },
    oldest: {
      name: "Oldest",
      icon: <ClockArrowDown />,
      description: "Shows the oldest game first",
    },
  };

  const updateQueryParam = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  useEffect(() => {
    async function getData() {
      const response = await getSelf();
      setUser(await response.json());
    }

    getData();
  }, []);

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const gameResponse = await getGames(sort);
        setGames(await gameResponse.json());
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
                onAction={(key) => {
                  setSort(key as GameSort);
                  updateQueryParam("sort", key as string);
                }}
                className="text-[#333] dark:text-white"
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
            <Link key={game.name + index} href={`/g/${game.slug}`}>
              <Card radius="lg" isFooterBlurred className="bg-[#212121] w-full">
                {game.ratings.some((rating) => rating.userId == user?.id) && (
                  <div className="absolute z-20 inset-0 flex items-center justify-center text-white font-bold text-xl bg-black/80">
                    <p className="opacity-50">RATED</p>
                  </div>
                )}
                <CardHeader className="absolute top-0 flex justify-end">
                  <div
                    className={` p-2 pt-1 pb-1 rounded text-white shadow-md ${
                      game.category == "REGULAR"
                        ? "bg-blue-700"
                        : game.category == "ODA"
                        ? "bg-purple-700"
                        : "bg-pink-700"
                    }`}
                  >
                    {game.category}
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
