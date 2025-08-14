"use client";

import { GameType } from "@/types/GameType";
import { useEffect, useState } from "react";
import {
  Card,
  CardFooter,
  CardHeader,
  Image,
  Link,
  Spinner,
} from "@heroui/react";
import { GameSort } from "@/types/GameSort";
import { useSearchParams, useRouter } from "next/navigation";
import { getGames } from "@/requests/game";
import { UserType } from "@/types/UserType";
import { getSelf } from "@/requests/user";
import { IconName } from "@/framework/Icon";
import { Button } from "@/framework/Button";
import Dropdown from "@/framework/Dropdown";

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
    { name: string; icon: IconName; description: string }
  > = {
    random: {
      name: "GameSort.Random.Title",
      icon: "dice3",
      description: "GameSort.Random.Description",
    },
    leastratings: {
      name: "GameSort.LeastRatings.Title",
      icon: "chevronsdown",
      description: "GameSort.LeastRatings.Description",
    },
    danger: {
      name: "GameSort.Danger.Title",
      icon: "circlealert",
      description: "GameSort.Danger.Description",
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
            <Dropdown
              trigger={<Button size="sm">{sorts[sort]?.name}</Button>}
              onSelect={(key) => {
                setSort(key as GameSort);
                updateQueryParam("sort", key as string);
              }}
            >
              {Object.entries(sorts).map(([key, sort]) => (
                <Dropdown.Item
                  key={key}
                  value={key}
                  icon={sort.icon}
                  description={sort.description}
                >
                  {sort.name}
                </Dropdown.Item>
              ))}
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
