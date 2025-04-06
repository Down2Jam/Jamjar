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
  Image,
} from "@heroui/react";
import { Award, Badge, Gamepad2, Swords } from "lucide-react";
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
  const [contentType, setContentType] = useState<"MAJORITYCONTENT" | "ALL">(
    (["MAJORITYCONTENT", "ALL"].includes(
      searchParams.get("contentType") as "MAJORITYCONTENT" | "ALL"
    ) &&
      (searchParams.get("contentType") as "MAJORITYCONTENT" | "ALL")) ||
      "MAJORITYCONTENT"
  );
  const [sort, setSort] = useState<
    | "OVERALL"
    | "GAMEPLAY"
    | "AUDIO"
    | "GRAPHICS"
    | "CREATIVITY"
    | "EMOTIONALDELIVERY"
    | "THEME"
  >(
    ([
      "OVERALL",
      "GAMEPLAY",
      "AUDIO",
      "GRAPHICS",
      "CREATIVITY",
      "EMOTIONALDELIVERY",
      "THEME",
    ].includes(
      searchParams.get("sort") as
        | "OVERALL"
        | "GAMEPLAY"
        | "AUDIO"
        | "GRAPHICS"
        | "CREATIVITY"
        | "EMOTIONALDELIVERY"
        | "THEME"
    ) &&
      (searchParams.get("sort") as
        | "OVERALL"
        | "GAMEPLAY"
        | "AUDIO"
        | "GRAPHICS"
        | "CREATIVITY"
        | "EMOTIONALDELIVERY"
        | "THEME")) ||
      "OVERALL"
  );
  const router = useRouter();

  useEffect(() => {
    const getData = async () => {
      const response = await getResults(category, contentType, sort);

      if (response.ok) {
        const gameData = (await response.json()).data;
        setGames(gameData);
      }
    };

    getData();
  }, [category, contentType, sort]);

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
            <Dropdown backdrop="opaque">
              <DropdownTrigger>
                <Button
                  size="sm"
                  className="text-xs bg-white dark:bg-[#252525] !duration-250 !ease-linear !transition-all text-[#333] dark:text-white"
                  variant="faded"
                >
                  {contentType}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                onAction={(key) => {
                  setContentType(key as "MAJORITYCONTENT" | "ALL");
                  updateQueryParam("contentType", key as string);
                }}
                className="text-[#333] dark:text-white"
              >
                <DropdownItem
                  key="MAJORITYCONTENT"
                  description="Majority of art, audio, etc. made in the jam time"
                  startContent={<Gamepad2 />}
                >
                  Majority Content
                </DropdownItem>
                <DropdownItem
                  key="ALL"
                  description="All art, audio regardless of when it was made"
                  startContent={<Swords />}
                >
                  All
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <Dropdown backdrop="opaque">
              <DropdownTrigger>
                <Button
                  size="sm"
                  className="text-xs bg-white dark:bg-[#252525] !duration-250 !ease-linear !transition-all text-[#333] dark:text-white"
                  variant="faded"
                >
                  {sort}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                onAction={(key) => {
                  setSort(
                    key as
                      | "OVERALL"
                      | "GAMEPLAY"
                      | "AUDIO"
                      | "GRAPHICS"
                      | "CREATIVITY"
                      | "EMOTIONALDELIVERY"
                      | "THEME"
                  );
                  updateQueryParam("contentType", key as string);
                }}
                className="text-[#333] dark:text-white"
              >
                <DropdownItem key="OVERALL">Overall</DropdownItem>
                <DropdownItem key="GAMEPLAY">Gameplay</DropdownItem>
                <DropdownItem key="AUDIO">Audio</DropdownItem>
                <DropdownItem key="GRAPHICS">Graphics</DropdownItem>
                <DropdownItem key="CREATIVITY">Creativity</DropdownItem>
                <DropdownItem key="EMOTIONALDELIVERY">
                  Emotional Delivery
                </DropdownItem>
                <DropdownItem key="THEME">Theme</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </section>

      <div className="pt-4 flex flex-col gap-4">
        {games &&
          games.map((game) => (
            <Card key={game.id}>
              <CardBody className="flex-row items-center gap-4">
                <Image
                  removeWrapper
                  alt={`${game.name}'s thumbnail`}
                  className="z-0 h-[108px] w-[192px] object-cover"
                  height={108}
                  width="100%"
                  isZoomed
                  src={game.thumbnail ?? "/images/D2J_Icon.png"}
                />
                <div className="flex flex-col">
                  <Link
                    name={game.name}
                    href={`/g/${game.slug}`}
                    color="blue"
                    center={false}
                  />
                  {game.categoryAverages
                    .sort((a, b) => a.placement - b.placement)
                    .map((category) => (
                      <div
                        key={category.categoryId}
                        className="grid grid-cols-[150px_100px_60px_30px] items-center gap-2"
                      >
                        <span className="text-default-500 text-sm">
                          {category.categoryName}:
                        </span>
                        <span
                          className={
                            category.placement == 1
                              ? "text-yellow-500"
                              : category.placement == 2
                              ? "text-slate-500"
                              : category.placement == 3
                              ? "text-orange-700"
                              : category.placement >= 4 &&
                                category.placement <= 5
                              ? "text-blue-500"
                              : category.placement >= 6 &&
                                category.placement <= 10
                              ? "text-purple-500"
                              : "text-[#666] dark:text-[#ccc]"
                          }
                        >
                          {(category.averageScore / 2).toFixed(2)} stars
                        </span>
                        <span className="text-default-500">
                          ({ordinal_suffix_of(category.placement)})
                        </span>
                        <span className="flex items-center justify-center">
                          {category.placement == 1 && (
                            <Award size={16} className="text-yellow-500" />
                          )}
                          {category.placement == 2 && (
                            <Award size={16} className="text-slate-500" />
                          )}
                          {category.placement == 3 && (
                            <Award size={16} className="text-orange-700" />
                          )}
                          {category.placement >= 4 &&
                            category.placement <= 5 && (
                              <Badge size={12} className="text-blue-500" />
                            )}
                          {category.placement >= 6 &&
                            category.placement <= 10 && (
                              <Badge size={12} className="text-purple-500" />
                            )}
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
