"use client";

import { GameType } from "@/types/GameType";
import { useEffect, useState } from "react";
import { GameSort } from "@/types/GameSort";
import { useSearchParams, useRouter } from "next/navigation";
import { getGames } from "@/requests/game";
import { UserType } from "@/types/UserType";
import { getSelf } from "@/requests/user";
import { IconName } from "@/framework/Icon";
import Dropdown from "@/framework/Dropdown";
import { GameCard } from "../gamecard";
import { Spinner } from "@/framework/Spinner";
import { Hstack, Vstack } from "@/framework/Stack";
import { Card } from "@/framework/Card";
import Text from "@/framework/Text";

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

  if (isLoading)
    return (
      <Vstack>
        <Card className="max-w-96">
          <Vstack>
            <Hstack>
              <Spinner />
              <Text size="xl">Loading</Text>
            </Hstack>
            <Text color="textFaded">Loading games...</Text>
          </Vstack>
        </Card>
      </Vstack>
    );

  return (
    <>
      <Vstack className="p-4">
        <Dropdown
          selectedValue={sort}
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
      </Vstack>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {games ? (
          games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              rated={game.ratings.some((rating) => rating.userId == user?.id)}
            />
          ))
        ) : (
          <p>No games were found. :(</p>
        )}
      </section>
    </>
  );
}
