"use client";

import Link from "@/components/link-components/Link";
import { getResults } from "@/requests/game";
import { GameResultType } from "@/types/GameResultType";
import {
  Button,
  Card,
  CardBody,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import { Gamepad2, Swords } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Results() {
  const searchParams = useSearchParams();
  const [games, setGames] = useState<GameResultType[]>([]);
  const [category, setCategory] = useState<"REGULAR" | "ODA">(
    (["REGULAR", "ODA"].includes(
      searchParams.get("category") as "REGULAR" | "ODA"
    ) &&
      (searchParams.get("category") as "REGULAR" | "ODA")) ||
      "REGULAR"
  );
  const router = useRouter();

  useEffect(() => {
    const getData = async () => {
      const response = await getResults(category);

      if (response.ok) {
        const gameData = (await response.json()).data;
        setGames(gameData);
      }
    };

    getData();
  }, [category]);

  const updateQueryParam = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  function ordinal_suffix_of(i: number) {
    const j = i % 10,
      k = i % 100;
    if (j === 1 && k !== 11) {
      return i + "st";
    }
    if (j === 2 && k !== 12) {
      return i + "nd";
    }
    if (j === 3 && k !== 13) {
      return i + "rd";
    }
    return i + "th";
  }

  return (
    <main className="pl-4 pr-4 text-[#333] dark:text-white">
      <section className="mb-4">
        <h1 className="text-3xl mb-4">Results</h1>
        <p className="text-sm text-default-500">
          Here are the overall results from the jam
        </p>
      </section>
      <Divider />

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
                  {category}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                onAction={(key) => {
                  setCategory(key as "REGULAR" | "ODA");
                  updateQueryParam("category", key as string);
                }}
                className="text-[#333] dark:text-white"
              >
                <DropdownItem
                  key="REGULAR"
                  description="The regular jam category"
                  startContent={<Gamepad2 />}
                >
                  Regular
                </DropdownItem>
                <DropdownItem
                  key="ODA"
                  description="1 Dev, No third party assets"
                  startContent={<Swords />}
                >
                  One Dev Army (O.D.A)
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </section>

      <div className="pt-4 flex flex-col gap-4">
        {games &&
          games.map((game) => (
            <Card key={game.id}>
              <CardBody className="flex-row items-center">
                <Image
                  alt={`${game.name}'s thumbnail`}
                  height={128}
                  src={game.thumbnail ?? "/images/D2J_Icon.png"}
                  width={128}
                />
                <div className="flex flex-col">
                  <Link
                    name={game.name}
                    href={`/g/${game.slug}`}
                    color="blue"
                    center={false}
                  />
                  {game.categoryAverages
                    .sort((a, b) => b.averageScore - a.averageScore)
                    .map((category) => (
                      <div key={category.categoryId}>
                        {category.categoryName}:{" "}
                        <span className="text-default-500">
                          {category.averageScore / 2} stars
                        </span>{" "}
                        <span className="text-default-400">
                          ({ordinal_suffix_of(category.placement)})
                        </span>
                      </div>
                    ))}
                </div>
              </CardBody>
            </Card>
          ))}
      </div>
    </main>
  );
}
