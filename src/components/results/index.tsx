"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { Button } from "bioloom-ui";
import { Card } from "bioloom-ui";
import { Dropdown } from "bioloom-ui";
import { Link } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { getJams } from "@/helpers/jam";
import { useTheme } from "@/providers/useSiteTheme";
import { getResults } from "@/requests/game";
import { getTrackResults } from "@/requests/track";
import { GameResultType } from "@/types/GameResultType";
import { TrackResultType } from "@/types/TrackResultType";
import { useMusic } from "bioloom-miniplayer";
import { Award, Circle, CircleSmall } from "lucide-react";
import { useTranslations } from "@/compat/next-intl";
import { useRouter, useSearchParams } from "@/compat/next-navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { navigateToSearchIfChanged } from "@/helpers/navigation";
import { readArray } from "@/requests/helpers";
import { shouldShowJamInContentListings } from "@/helpers/jamListingOptions";
import { getJamUrlValue, resolveJamUrlValue } from "@/helpers/jamUrl";

type JamOption = {
  id: string;
  slug?: string | null;
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

function getResultsGradient(
  placement: number,
  averageScore: number,
  colors: Record<string, string>
  ) {
    if (placement >= 1 && placement <= 3)
      return {
        gradient: `linear-gradient(90deg, ${colors["yellow"]}, ${colors["red"]})`,
        first: colors["red"],
      };
    if (averageScore >= 8)
      return {
        gradient: `linear-gradient(90deg, ${colors["greenLight"]}, ${colors["green"]}, ${colors["greenDark"]})`,
        first: colors["green"],
      };
    if (averageScore >= 7)
      return {
        gradient: `linear-gradient(90deg, ${colors["blueLight"]}, ${colors["blue"]}, ${colors["blueDark"]})`,
        first: colors["blueLight"],
      };
    if (averageScore >= 6)
      return {
        gradient: `linear-gradient(90deg, ${colors["purpleLight"]}, ${colors["purple"]}, ${colors["purpleDark"]})`,
        first: colors["purple"],
      };
  return {
    gradient: `linear-gradient(90deg, ${colors["textFaded"]}, ${colors["textFaded"]})`,
    first: colors["textFaded"],
  };
}

function getResultsIcon(
  placement: number,
  averageScore: number,
  color: string,
) {
  if (placement >= 1 && placement <= 3) {
    return <Award size={16} style={{ color }} />;
  }
  if (averageScore >= 8) {
    return <Circle size={15} style={{ color }} />;
  }
  if (averageScore >= 7) {
    return <Circle size={13} style={{ color }} />;
  }
  if (averageScore >= 6) {
    return <CircleSmall size={11} style={{ color }} />;
  }
  return null;
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

export default function Results({ preview = false }: { preview?: boolean }) {
  const uiText = useUiTranslations();
  const { playItem } = useMusic();
  const searchParams = useSearchParams();
  const [games, setGames] = useState<GameResultType[]>([]);
  const [tracks, setTracks] = useState<TrackResultType[]>([]);
  const [view, setView] = useState<"GAMES" | "MUSIC">(
    (["GAMES", "MUSIC"].includes(searchParams.get("view") as "GAMES" | "MUSIC") &&
      (searchParams.get("view") as "GAMES" | "MUSIC")) ||
      "GAMES"
  );
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
  const initialJamParam = useMemo(
    () => searchParams.get("jam"),
    [searchParams]
  );
  const [jamId, setJamId] = useState<string>(initialJamParam ?? "all");
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
      navigateToSearchIfChanged(router, params, "replace");
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
            if (!shouldShowJamInContentListings(jam)) {
              return;
            }

            const value = getJamUrlValue(jam);
            if (!value) return;

            options.push({
              id: value,
              slug: jam.slug,
              name: jam.name,
              icon: jam.icon,
              description: uiText("AppStrings.Value06", { value0: formatJamWindow(
                jam.startTime,
                jam.jammingHours
              ) }),
              startTime: jam.startTime,
            });
          });
        }
      } catch (error) {
        console.error("Error fetching jams:", error);
      }

      setJamOptions(options);

      const resolvedInitial = resolveJamUrlValue(initialJamParam, options);
      if (initialJamParam === "all") {
        setJamId("all");
        return;
      }
      if (initialJamParam && resolvedInitial !== "all") {
        setJamId(resolvedInitial);
        if (resolvedInitial !== initialJamParam) {
          updateQueryParam("jam", resolvedInitial);
        }
        return;
      }
      if (options.length > 0) {
        const latestJam = options[0].id;
        setJamId(latestJam);
        updateQueryParam("jam", latestJam);
      }
    };

    fetchJams();
  }, [initialJamParam, updateQueryParam]);

  useEffect(() => {
    const getData = async () => {
      if (view === "GAMES") {
        const gameResponse = await getResults(
          category,
          contentType,
          sort,
          jamId,
          preview
        );

        if (gameResponse.ok) {
          setGames(await readArray<GameResultType>(gameResponse));
        }
        setTracks([]);
        return;
      }

        const trackResponse = await getTrackResults(
          jamId,
          preview,
          category,
          "OVERALL"
        );
      if (trackResponse.ok) {
        setTracks(await readArray<TrackResultType>(trackResponse));
      }
      setGames([]);
    };

    getData();
  }, [category, contentType, sort, jamId, preview, view]);

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
        <h1 className="text-3xl mb-4">{uiText("Navbar.Results.Title")}</h1>
        <p
          className="text-sm"
          style={{
            color: siteTheme.colors["textFaded"],
          }}
        >
           {uiText("AppStrings.HereAreTheOverallResultsFromTheJam")} </p>
      </section>

      <Hstack>
        <Dropdown
          trigger={<Button>{view === "GAMES" ? uiText("Navbar.Games.Title") : uiText("Navbar.Music.Title")}</Button>}
          onSelect={(key) => {
            const next = key as "GAMES" | "MUSIC";
            setView(next);
            updateQueryParam("view", key as string);
          }}
        >
          <Dropdown.Item value="GAMES" icon="gamepad2">
             {uiText("Navbar.Games.Title")} </Dropdown.Item>
          <Dropdown.Item value="MUSIC" icon="music">
             {uiText("Navbar.Music.Title")} </Dropdown.Item>
        </Dropdown>

        <Dropdown
          trigger={<Button>{category}</Button>}
          onSelect={(key) => {
            setCategory(key as "REGULAR" | "ODA");
            updateQueryParam("category", key as string);
          }}
        >
          <Dropdown.Item
            value={"REGULAR"}
            description={uiText("GameCategory.Regular.Description")}
            icon="gamepad2"
          >
             {uiText("GameCategory.Regular.Title")} </Dropdown.Item>
          <Dropdown.Item
            value={"ODA"}
            description={uiText("GameCategory.Oda.Description")}
            icon="swords"
          >
             {uiText("GameCategory.Oda.Title")} </Dropdown.Item>
        </Dropdown>

        {view === "GAMES" && category === "REGULAR" && (
          <Dropdown
            trigger={<Button>{contentType}</Button>}
            onSelect={(key) => {
              setContentType(key as "MAJORITYCONTENT" | "ALL");
              updateQueryParam("contentType", key as string);
            }}
          >
            <Dropdown.Item
              value="MAJORITYCONTENT"
              description={uiText("AppStrings.MajorityOfArtAudioEtcMadeInThe")}
              icon="sparkles"
            >
               {uiText("AppStrings.MajorityContent")} </Dropdown.Item>
            <Dropdown.Item
              value="ALL"
              description={uiText("AppStrings.AllArtAudioRegardlessOfWhenItWas")}
              icon="layers"
            >
               {uiText("AppStrings.All")} </Dropdown.Item>
          </Dropdown>
        )}

          {view === "GAMES" ? (
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
              <Dropdown.Item value="OVERALL">{uiText("RatingCategory.Overall.Title")}</Dropdown.Item>
              <Dropdown.Item value="GAMEPLAY">{uiText("RatingCategory.Gameplay.Title")}</Dropdown.Item>
            <Dropdown.Item value="AUDIO">{uiText("RatingCategory.Audio.Title")}</Dropdown.Item>
            <Dropdown.Item value="GRAPHICS">{uiText("RatingCategory.Graphics.Title")}</Dropdown.Item>
            <Dropdown.Item value="CREATIVITY">{uiText("RatingCategory.Creativity.Title")}</Dropdown.Item>
            <Dropdown.Item value="EMOTIONALDELIVERY">
               {uiText("RatingCategory.Emotional.Title")} </Dropdown.Item>
            <Dropdown.Item value="THEME">{uiText("RatingCategory.Theme.Title")}</Dropdown.Item>
            </Dropdown>
          ) : (
            <Button icon="music">{uiText("RatingCategory.Overall.Title")}</Button>
          )}

          <Dropdown
            trigger={
              <Button>
                {jamOptions.find((j) => j.id === jamId)?.name || uiText("AppStrings.SelectJam2")}
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
        {view === "GAMES" &&
          games &&
          games.map((game) => {
            const radarData = game.categoryAverages.map((avg) => ({
              subject: t(avg.categoryName),
              rating: avg.averageScore / 2,
              fullMark: 5,
            }));

            return (
              <Card key={game.id} className="flex items-center gap-4">
                <Hstack gap={12}>
                  <img
                    alt={uiText("AppStrings.Value0SThumbnail", { value0: game.name })}
                    className="z-0 h-[108px] w-[192px] object-cover"
                    height={108}
                    width={192}
                    src={game.thumbnail || "/images/game-thumbnail.png"}
                  />
                  <div className="flex flex-col">
                    <Link href={`/g/${game.slug}`}>{game.name}</Link>
                    {game.categoryAverages
                      .sort((a, b) => a.placement - b.placement)
                      .map((category) => {
                        const { gradient, first } = getResultsGradient(
                          category.placement,
                          category.averageScore,
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
                              {(category.averageScore / 2).toFixed(2)}  {uiText("AppStrings.Stars")} </span>
                            <Text color="textFaded">
                              ({ordinal_suffix_of(category.placement)})
                            </Text>
                            <span className="flex items-center justify-center">
                              {getResultsIcon(
                                category.placement,
                                category.averageScore,
                                first,
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

        {view === "MUSIC" && (
          <section>
            <Vstack align="stretch">
              {tracks.map((track) => {
                const overall = track.categoryAverages.find(
                  (avg) => avg.categoryName === "Overall"
                );

                if (!overall) return null;

                const { gradient, first } = getResultsGradient(
                  overall.placement,
                  overall.averageScore,
                  colors
                );

                return (
                  <Card key={track.id} className="flex items-center gap-4">
                    <Hstack gap={12}>
                      <img
                        alt={uiText("AppStrings.Value0Art", { value0: track.name })}
                        className="z-0 h-[108px] w-[108px] object-cover"
                        height={108}
                        width={108}
                        src={
                          track.game.soundtrackThumbnail ||
                          track.game.thumbnail ||
                          "/images/game-thumbnail.png"
                        }
                      />
                      <div className="flex flex-col">
                        <Hstack className="items-start gap-3">
                          <Vstack align="start" gap={1}>
                            <Link href={`/m/${track.slug}`}>{track.name}</Link>
                            <Text size="sm" color="textFaded">
                              {track.composer.name}  {uiText("AppStrings.For")} {track.game.name}
                            </Text>
                          </Vstack>
                          <Button
                            size="xs"
                            icon="play"
                            onClick={() =>
                              playItem({
                                id: track.id,
                                slug: track.slug,
                                name: track.name,
                                artist: track.composer,
                                thumbnail:
                                  track.game.soundtrackThumbnail ||
                                  track.game.thumbnail ||
                                  "/images/game-thumbnail.png",
                                game: track.game,
                                song: track.url,
                                loudnessGainDb: track.loudnessGainDb,
                              })
                            }
                          >
                             {uiText("AppStrings.Play")} </Button>
                        </Hstack>
                        <div className="grid grid-cols-[120px_100px_60px_30px] items-center gap-2">
                          <Text size="sm" color="textFaded">
                             {uiText("RatingCategory.Overall.Title")} </Text>
                          <span
                            style={gradientTextStyle(gradient, first)}
                            className="w-fit"
                          >
                            {(overall.averageScore / 2).toFixed(2)}  {uiText("AppStrings.Stars")} </span>
                          <Text color="textFaded">
                            ({ordinal_suffix_of(overall.placement)})
                          </Text>
                          <span className="flex items-center justify-center">
                            {getResultsIcon(
                              overall.placement,
                              overall.averageScore,
                              first,
                            )}
                          </span>
                        </div>
                      </div>
                    </Hstack>
                  </Card>
                );
              })}
            </Vstack>
          </section>
        )}
      </Vstack>
    </main>
  );
}
