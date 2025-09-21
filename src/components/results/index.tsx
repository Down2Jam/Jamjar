"use client";

import { Button } from "@/framework/Button";
import { Card } from "@/framework/Card";
import Dropdown from "@/framework/Dropdown";
import { Link } from "@/framework/Link";
import { Hstack, Vstack } from "@/framework/Stack";
import Text from "@/framework/Text";
import { getJams } from "@/helpers/jam";
import { useTheme } from "@/providers/SiteThemeProvider";
import { getResults } from "@/requests/game";
import { GameResultType } from "@/types/GameResultType";
import { Image } from "@heroui/react";
import { Award, Badge } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

type JamOption = {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  startTime?: string;
};

function gradientTextStyle(
  gradient: string,
  fallback: string
): React.CSSProperties {
  return {
    backgroundImage: gradient,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    color: fallback,
  };
}

function getPlacementGradient(
  placement: number,
  colors: Record<string, string>
) {
  if (placement === 1)
    return {
      gradient: `linear-gradient(90deg, ${colors["yellow"]}, ${colors["red"]})`,
      first: colors["red"],
    };
  if (placement === 2)
    return {
      gradient: `linear-gradient(90deg, ${colors["green"]}, ${colors["gray"]})`,
      first: colors["gray"],
    };
  if (placement === 3)
    return {
      gradient: `linear-gradient(90deg, ${colors["red"]}, ${colors["pink"]})`,
      first: colors["pink"],
    };
  if (placement >= 4 && placement <= 5)
    return {
      gradient: `linear-gradient(90deg, ${colors["blue"]}, ${colors["indigo"]})`,
      first: colors["indigo"],
    };
  if (placement >= 6 && placement <= 10)
    return {
      gradient: `linear-gradient(90deg, ${colors["purple"]}, ${colors["violet"]})`,
      first: colors["violet"],
    };
  return {
    gradient: `linear-gradient(90deg, ${colors["textFaded"]}, ${colors["textFaded"]})`,
    first: colors["textFaded"],
  };
}

function formatJamWindow(
  startISO?: string,
  jammingHours?: number
): string | undefined {
  if (!startISO || !jammingHours || Number.isNaN(Number(jammingHours)))
    return undefined;

  const start = new Date(startISO);
  if (isNaN(start.getTime())) return undefined;

  const end = new Date(start.getTime() + Number(jammingHours) * 60 * 60 * 1000);

  const dFmt = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (sameDay) {
    return `${dFmt.format(start)}`;
  }
  return `${dFmt.format(start)} – ${dFmt.format(end)}`;
}

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
  const { colors } = useTheme();
  const [jamId, setJamId] = useState<string>("all");
  const [jamOptions, setJamOptions] = useState<JamOption[]>([]);
  const t = useTranslations();

  const updateQueryParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(window.location.search);
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.replace(`?${params.toString()}`);
    },
    [router]
  );

  useEffect(() => {
    const fetchJams = async () => {
      const options: JamOption[] = [];

      try {
        const res = await getJams();
        const jams = res;

        if (Array.isArray(jams)) {
          jams.forEach((jam) => {
            options.push({
              id: String(jam.id),
              name: jam.name,
              icon: jam.icon,
              description: `${formatJamWindow(
                jam.startTime,
                jam.jammingHours
              )}`,
              startTime: jam.startTime,
            });
          });
        }
      } catch (error) {
        console.error("Error fetching jams:", error);
      }

      setJamOptions(options);

      if (options.length > 1) {
        const latestJamId = options[0].id;
        setJamId(latestJamId);
        updateQueryParam("jam", latestJamId);
      }
    };

    fetchJams();
  }, [updateQueryParam]);

  useEffect(() => {
    const getData = async () => {
      const response = await getResults(category, contentType, sort, jamId);

      if (response.ok) {
        const gameData = (await response.json()).data;
        setGames(gameData);
      }
    };

    getData();
  }, [category, contentType, sort, jamId]);

  const { siteTheme } = useTheme();

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
    <main
      className="pl-4 pr-4"
      style={{
        color: siteTheme.colors["text"],
      }}
    >
      <section className="mb-4">
        <h1 className="text-3xl mb-4">Results</h1>
        <p
          className="text-sm"
          style={{
            color: siteTheme.colors["textFaded"],
          }}
        >
          Here are the overall results from the jam
        </p>
      </section>

      <Hstack>
        <Dropdown
          trigger={<Button>{category}</Button>}
          onSelect={(key) => {
            setCategory(key as "REGULAR" | "ODA");
            updateQueryParam("category", key as string);
          }}
        >
          <Dropdown.Item
            value={"REGULAR"}
            description="The regular jam category"
            icon="gamepad2"
          >
            Regular
          </Dropdown.Item>
          <Dropdown.Item
            value={"ODA"}
            description="1 Dev, No third party assets"
            icon="swords"
          >
            One Dev Army (O.D.A)
          </Dropdown.Item>
        </Dropdown>

        {category === "REGULAR" && (
          <Dropdown
            trigger={<Button>{contentType}</Button>}
            onSelect={(key) => {
              setContentType(key as "MAJORITYCONTENT" | "ALL");
              updateQueryParam("contentType", key as string);
            }}
          >
            <Dropdown.Item
              value="MAJORITYCONTENT"
              description="Majority of art, audio, etc. made in the jam time"
              icon="sparkles"
            >
              Majority Content
            </Dropdown.Item>
            <Dropdown.Item
              value="ALL"
              description="All art, audio regardless of when it was made"
              icon="layers"
            >
              All
            </Dropdown.Item>
          </Dropdown>
        )}

        <Dropdown
          trigger={<Button>{sort}</Button>}
          onSelect={(key) => {
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
            updateQueryParam("sort", key as string);
          }}
        >
          <Dropdown.Item value="OVERALL">Overall</Dropdown.Item>
          <Dropdown.Item value="GAMEPLAY">Gameplay</Dropdown.Item>
          <Dropdown.Item value="AUDIO">Audio</Dropdown.Item>
          <Dropdown.Item value="GRAPHICS">Graphics</Dropdown.Item>
          <Dropdown.Item value="CREATIVITY">Creativity</Dropdown.Item>
          <Dropdown.Item value="EMOTIONALDELIVERY">
            Emotional Delivery
          </Dropdown.Item>
          <Dropdown.Item value="THEME">Theme</Dropdown.Item>
        </Dropdown>

        <Dropdown
          trigger={
            <Button>
              {jamOptions.find((j) => j.id === jamId)?.name || "Select Jam"}
            </Button>
          }
          onSelect={(key) => {
            setJamId(key as string);
            updateQueryParam("jam", key as string);
          }}
        >
          {jamOptions.map((jam) => (
            <Dropdown.Item
              key={jam.id}
              value={jam.id}
              description={jam.description}
            >
              {jam.name}
            </Dropdown.Item>
          ))}
        </Dropdown>
      </Hstack>

      <Vstack className="pt-4" align="stretch">
        {games &&
          games.map((game) => {
            const radarData = game.categoryAverages.map((avg) => ({
              subject: t(avg.categoryName),
              rating: avg.averageScore / 2,
              fullMark: 5,
            }));

            return (
              <Card key={game.id} className="flex items-center gap-4">
                <Hstack gap={12}>
                  <Image
                    removeWrapper
                    alt={`${game.name}'s thumbnail`}
                    className="z-0 h-[108px] w-[192px] object-cover"
                    height={108}
                    width="100%"
                    src={game.thumbnail ?? "/images/D2J_Icon.png"}
                  />
                  <div className="flex flex-col">
                    <Link href={`/g/${game.slug}`}>{game.name}</Link>
                    {game.categoryAverages
                      .sort((a, b) => a.placement - b.placement)
                      .map((category) => {
                        const { gradient, first } = getPlacementGradient(
                          category.placement,
                          colors
                        );

                        return (
                          <div
                            key={category.categoryId}
                            className="grid grid-cols-[150px_100px_60px_30px] items-center gap-2"
                          >
                            <Text size="sm" color="textFaded">
                              {category.categoryName}
                            </Text>
                            <span
                              style={gradientTextStyle(gradient, first)}
                              className="w-fit"
                            >
                              {(category.averageScore / 2).toFixed(2)} stars
                            </span>
                            <Text color="textFaded">
                              ({ordinal_suffix_of(category.placement)})
                            </Text>
                            <span className="flex items-center justify-center">
                              {category.placement === 1 && (
                                <Award size={16} style={{ color: first }} />
                              )}
                              {category.placement === 2 && (
                                <Award size={16} style={{ color: first }} />
                              )}
                              {category.placement === 3 && (
                                <Award size={16} style={{ color: first }} />
                              )}
                              {category.placement >= 4 &&
                                category.placement <= 5 && (
                                  <Badge size={12} style={{ color: first }} />
                                )}
                              {category.placement >= 6 &&
                                category.placement <= 10 && (
                                  <Badge size={12} style={{ color: first }} />
                                )}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                  <div className="w-60 h-32 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        cx="50%"
                        cy="50%"
                        outerRadius="80%"
                        data={radarData}
                      >
                        <PolarGrid stroke={colors["crust"]} />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fill: colors["textFaded"], fontSize: 12 }}
                        />
                        <PolarRadiusAxis
                          domain={[0, 5]}
                          axisLine={false}
                          tick={false}
                        />
                        <Radar
                          name="Rating"
                          dataKey="rating"
                          stroke={colors["blue"]}
                          fill={colors["blueDark"]}
                          fillOpacity={0.6}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </Hstack>
              </Card>
            );
          })}
      </Vstack>
    </main>
  );
}
