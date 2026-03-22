"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  addToast,
  Button,
  Card,
  Dropdown,
  Hstack,
  Switch,
  Text,
  Vstack,
} from "bioloom-ui";
import { Gamepad2, Headphones, MessageSquareText, Star } from "lucide-react";
import { useTheme } from "@/providers/SiteThemeProvider";
import { useJams, useSelf, useUser } from "@/hooks/queries";
import { getGame, getGames, getResults } from "@/requests/game";
import { getTrack, getTrackResults, getTracks } from "@/requests/track";
import { getRecapVisibility, updateRecapVisibility } from "@/requests/recap";
import type { GameType } from "@/types/GameType";
import type { GameResultType } from "@/types/GameResultType";
import type { JamType } from "@/types/JamType";
import type { TrackResultType } from "@/types/TrackResultType";
import type { TrackType } from "@/types/TrackType";

type RecapProps = {
  targetUserSlug?: string;
};

type VisibilityState = {
  jamId: number | null;
  isPublic: boolean;
  canEdit: boolean;
  sharePath: string | null;
};

type RecapDataState = {
  gameDetail: GameType | null;
  trackDetails: TrackType[];
  games: GameType[];
  tracks: TrackType[];
  gameResults: GameResultType[];
  trackResults: TrackResultType[];
};

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "been",
  "being",
  "could",
  "didnt",
  "doesnt",
  "dont",
  "from",
  "game",
  "good",
  "have",
  "just",
  "like",
  "music",
  "really",
  "some",
  "that",
  "there",
  "they",
  "this",
  "very",
  "with",
  "would",
  "your",
]);

function ordinal(value: number) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return `${value}st`;
  if (mod10 === 2 && mod100 !== 12) return `${value}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${value}rd`;
  return `${value}th`;
}

function flattenCommentContents(comments: Array<any> | undefined): string[] {
  if (!Array.isArray(comments)) return [];

  const output: string[] = [];
  const stack = [...comments];

  while (stack.length > 0) {
    const comment = stack.pop();
    if (!comment) continue;
    if (typeof comment.content === "string" && comment.content.trim()) {
      output.push(comment.content);
    }
    if (Array.isArray(comment.children) && comment.children.length > 0) {
      stack.push(...comment.children);
    }
  }

  return output;
}

function getTopWords(contents: string[], limit = 8) {
  const counts = new Map<string, number>();

  contents.forEach((content) => {
    content
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, " ")
      .match(/[a-z']+/g)
      ?.forEach((word) => {
        const normalized = word.replace(/^'+|'+$/g, "");
        if (normalized.length < 4) return;
        if (STOP_WORDS.has(normalized)) return;
        counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
      });
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

function getOverallGameScore(game: GameType | null) {
  if (!game?.scores) return null;
  return game.scores["RatingCategory.Overall.Title"] ?? null;
}

function getOverallTrackScore(track: TrackType) {
  if (!track.scores) return null;
  return track.scores["Overall"] ?? null;
}

function formatScoreCategoryName(name: string) {
  return name
    .replace("RatingCategory.", "")
    .replace(".Title", "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
}

function getScoreEntries(scores?: Record<string, any> | null) {
  if (!scores) return [];

  return Object.entries(scores)
    .map(([key, value]) => ({
      key,
      label: formatScoreCategoryName(key),
      placement: Number(value?.placement ?? -1),
      averageScore: Number(value?.averageScore ?? 0),
      averageUnrankedScore: Number(value?.averageUnrankedScore ?? 0),
      ratingCount: Number(value?.ratingCount ?? 0),
    }))
    .filter((entry) => entry.averageScore > 0 || entry.averageUnrankedScore > 0)
    .sort((a, b) => {
      const aTop = a.placement >= 1 && a.placement <= 3;
      const bTop = b.placement >= 1 && b.placement <= 3;
      if (aTop !== bTop) return aTop ? -1 : 1;
      if (aTop && bTop && a.placement !== b.placement) {
        return a.placement - b.placement;
      }
      if (a.averageScore !== b.averageScore) {
        return b.averageScore - a.averageScore;
      }
      return a.label.localeCompare(b.label);
    });
}

function getScoreCallout(
  entry: {
    label: string;
    placement: number;
  },
  totalEligible: number,
) {
  if (entry.placement < 1 || totalEligible <= 0) return null;
  if (entry.placement <= 3) {
    return `${ordinal(entry.placement)} in ${entry.label}`;
  }

  const percentile = (entry.placement / totalEligible) * 100;
  if (percentile <= 10) {
    return `Top 10% in ${entry.label}`;
  }
  if (percentile <= 25) {
    return `Top 25% in ${entry.label}`;
  }

  return null;
}

function getUserGameForJam(user: any, jamId: number) {
  return (
    user?.teams?.find(
      (team: any) => team.game?.published && team.game?.jamId === jamId,
    )?.game ?? null
  );
}

function getJamForId(jams: JamType[], jamId: number | null) {
  if (!jamId) return null;
  return jams.find((jam) => jam.id === jamId) ?? null;
}

function pickDefaultJamId(jamParam: string | null, jams: JamType[], user: any) {
  const parsed = Number(jamParam);
  if (jamParam && Number.isInteger(parsed)) {
    return parsed;
  }

  const latestUserJamId = (user?.teams ?? [])
    .map((team: any) => team.game?.jamId ?? team.jamId)
    .filter((value: unknown): value is number => Number.isInteger(value))
    .sort((a: number, b: number) => b - a)[0];

  return latestUserJamId ?? jams[0]?.id ?? null;
}

function StatCard({
  icon,
  label,
  value,
  note,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <Card className="p-5 md:p-6">
      <Vstack align="start" gap={2}>
        <span className="opacity-90">{icon}</span>
        <Text size="sm" color="textFaded">
          {label}
        </Text>
        <Text size="2xl" weight="bold">
          {value}
        </Text>
        {note ? (
          <Text size="sm" color="textFaded">
            {note}
          </Text>
        ) : null}
      </Vstack>
    </Card>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <Card className="p-6 md:p-8">
      <Vstack align="start" gap={6}>
        <Vstack align="start" gap={2}>
          <Text size="2xl" weight="bold">
            {title}
          </Text>
          {subtitle ? (
            <Text size="sm" color="textFaded">
              {subtitle}
            </Text>
          ) : null}
        </Vstack>
        {children}
      </Vstack>
    </Card>
  );
}

function WordCloud({
  words,
  colors,
}: {
  words: Array<{ word: string; count: number }>;
  colors: Record<string, string>;
}) {
  if (words.length === 0) {
    return null;
  }

  const highestCount = Math.max(...words.map((entry) => entry.count), 1);
  const palette = [
    colors.yellow,
    colors.green,
    colors.blue,
    colors.purple,
    colors.red,
  ];

  return (
    <div
      className="w-full rounded-3xl p-6 md:p-8"
      style={{
        background: `radial-gradient(circle at top left, ${colors.surface1}, ${colors.surface0})`,
      }}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-4 md:gap-x-6 md:gap-y-5">
        {words.map((entry, index) => {
          const scale = entry.count / highestCount;
          const fontSize = 1 + scale * 1.8;
          const rotation = index % 4 === 0 ? -4 : index % 4 === 2 ? 3 : 0;
          const color = palette[index % palette.length];

          return (
            <span
              key={entry.word}
              className="inline-flex items-center rounded-full px-2 py-1 font-semibold tracking-tight transition-transform duration-200 hover:-translate-y-0.5"
              style={{
                fontSize: `${fontSize}rem`,
                color,
                transform: `rotate(${rotation}deg)`,
                textShadow: `0 0 18px ${color}22`,
              }}
            >
              {entry.word}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function ScoreCategoryCard({
  title,
  stars,
  note,
  accent,
}: {
  title: string;
  stars: number;
  note?: string | null;
  accent: string;
}) {
  return (
    <Card
      className="p-5 md:p-6"
      style={{
        background: `linear-gradient(135deg, ${accent}18, transparent 60%)`,
        borderColor: `${accent}33`,
      }}
    >
      <Vstack align="start" gap={3}>
        <Text size="sm" color="textFaded">
          {title}
        </Text>
        <Text
          size="3xl"
          weight="bold"
          style={{
            color: accent,
            textShadow: `0 0 22px ${accent}22`,
          }}
        >
          {stars.toFixed(2)}
        </Text>
        <Text size="sm" color="textFaded">
          stars
        </Text>
        {note ? (
          <div
            className="rounded-full px-3 py-1 text-sm font-semibold"
            style={{
              backgroundColor: `${accent}18`,
              color: accent,
            }}
          >
            {note}
          </div>
        ) : null}
      </Vstack>
    </Card>
  );
}

export default function Recap({ targetUserSlug }: RecapProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { colors } = useTheme();
  const { data: self } = useSelf(!targetUserSlug);
  const effectiveSlug = targetUserSlug ?? self?.slug ?? "";
  const { data: user, isLoading: userLoading } = useUser(
    effectiveSlug,
    !!effectiveSlug,
  );
  const { data: jams = [] } = useJams();

  const [selectedJamId, setSelectedJamId] = useState<number | null>(null);
  const [visibility, setVisibility] = useState<VisibilityState | null>(null);
  const [loadingVisibility, setLoadingVisibility] = useState(false);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recapData, setRecapData] = useState<RecapDataState>({
    gameDetail: null,
    trackDetails: [],
    games: [],
    tracks: [],
    gameResults: [],
    trackResults: [],
  });

  const isOwner = targetUserSlug ? self?.slug === effectiveSlug : true;

  useEffect(() => {
    if (!user || jams.length === 0) return;
    const nextJamId = pickDefaultJamId(searchParams.get("jam"), jams, user);
    if (nextJamId && nextJamId !== selectedJamId) {
      setSelectedJamId(nextJamId);
    }
  }, [jams, searchParams, selectedJamId, user]);

  useEffect(() => {
    if (!effectiveSlug || !selectedJamId) return;

    let active = true;
    setLoadingVisibility(true);

    getRecapVisibility(effectiveSlug, selectedJamId)
      .then(async (response) => {
        const json = await response.json();
        if (!active) return;
        setVisibility(json.data ?? null);
      })
      .catch(() => {
        if (!active) return;
        setVisibility(null);
      })
      .finally(() => {
        if (active) {
          setLoadingVisibility(false);
        }
      });

    return () => {
      active = false;
    };
  }, [effectiveSlug, selectedJamId]);

  useEffect(() => {
    if (!user || !selectedJamId) return;
    if (
      targetUserSlug &&
      !isOwner &&
      !loadingVisibility &&
      !visibility?.isPublic
    ) {
      return;
    }

    let active = true;

    async function loadRecap() {
      const jamId = selectedJamId;
      if (jamId == null) return;
      setLoadingData(true);
      setError(null);

      try {
        const ownerGame = getUserGameForJam(user, jamId);

        const [
          gamesResponse,
          tracksResponse,
          regularResultsResponse,
          odaResultsResponse,
          regularTrackResultsResponse,
          odaTrackResultsResponse,
        ] = await Promise.all([
          getGames("newest", String(jamId)),
          getTracks("newest", String(jamId)),
          getResults(
            "REGULAR",
            "MAJORITYCONTENT",
            "OVERALL",
            String(jamId),
            false,
            true,
          ),
          getResults(
            "ODA",
            "MAJORITYCONTENT",
            "OVERALL",
            String(jamId),
            false,
            true,
          ),
          getTrackResults(String(jamId), false, "REGULAR", true),
          getTrackResults(String(jamId), false, "ODA", true),
        ]);

        const gamesJson = await gamesResponse.json();
        const tracksJson = await tracksResponse.json();
        const regularResultsJson = await regularResultsResponse.json();
        const odaResultsJson = await odaResultsResponse.json();
        const regularTrackResultsJson =
          await regularTrackResultsResponse.json();
        const odaTrackResultsJson = await odaTrackResultsResponse.json();

        const gameDetail = ownerGame
          ? ((await (await getGame(ownerGame.slug, true)).json()) as GameType)
          : null;

        const trackDetails = gameDetail?.tracks?.length
          ? await Promise.all(
              gameDetail.tracks.map(async (track) => {
                const response = await getTrack(track.slug);
                return (await response.json()) as TrackType;
              }),
            )
          : [];

        if (!active) return;

        setRecapData({
          gameDetail,
          trackDetails,
          games: gamesJson ?? [],
          tracks: tracksJson?.data ?? tracksJson ?? [],
          gameResults: [
            ...(regularResultsJson?.data ?? regularResultsJson ?? []),
            ...(odaResultsJson?.data ?? odaResultsJson ?? []),
          ],
          trackResults: [
            ...(regularTrackResultsJson?.data ?? regularTrackResultsJson ?? []),
            ...(odaTrackResultsJson?.data ?? odaTrackResultsJson ?? []),
          ],
        });
      } catch (loadError) {
        console.error(loadError);
        if (!active) return;
        setError("Failed to load jam recap.");
      } finally {
        if (active) {
          setLoadingData(false);
        }
      }
    }

    loadRecap();

    return () => {
      active = false;
    };
  }, [
    isOwner,
    loadingVisibility,
    selectedJamId,
    targetUserSlug,
    user,
    visibility?.isPublic,
  ]);

  const selectedJam = useMemo(
    () => getJamForId(jams, selectedJamId),
    [jams, selectedJamId],
  );

  const overallGameScore = useMemo(
    () => getOverallGameScore(recapData.gameDetail),
    [recapData.gameDetail],
  );

  const gameScoreEntries = useMemo(
    () => getScoreEntries(recapData.gameDetail?.scores),
    [recapData.gameDetail],
  );

  const totalEligibleGamesInCategory = useMemo(() => {
    if (!recapData.gameDetail?.category) return 0;
    return recapData.gameResults.filter(
      (game) => game.category === recapData.gameDetail?.category,
    ).length;
  }, [recapData.gameDetail, recapData.gameResults]);

  const gameCommentWords = useMemo(
    () => getTopWords(flattenCommentContents(recapData.gameDetail?.comments)),
    [recapData.gameDetail],
  );

  const playedGames = useMemo(() => {
    const ratedIds = new Set(
      (user?.ratings ?? [])
        .filter((rating: any) => rating.game?.jamId === selectedJamId)
        .map((rating: any) => rating.gameId),
    );

    return recapData.games.filter((game) => ratedIds.has(game.id));
  }, [recapData.games, selectedJamId, user?.ratings]);

  const notableGames = useMemo(() => {
    return recapData.gameResults
      .map((game) => ({
        game,
        placements: game.categoryAverages
          .filter(
            (category) => category.placement > 0 && category.placement <= 3,
          )
          .sort((a, b) => a.placement - b.placement),
      }))
      .filter((entry) => entry.placements.length > 0)
      .sort((a, b) => a.placements[0].placement - b.placements[0].placement);
  }, [recapData.gameResults]);

  const musicCommentWords = useMemo(() => {
    return getTopWords(
      recapData.trackDetails.flatMap((track) =>
        flattenCommentContents(track.comments),
      ),
    );
  }, [recapData.trackDetails]);

  const ratedTracks = useMemo(() => {
    const ratedIds = new Set(
      (user?.trackRatings ?? [])
        .filter((rating: any) => rating.track?.game?.jamId === selectedJamId)
        .map((rating: any) => rating.trackId),
    );

    return recapData.tracks.filter((track) => ratedIds.has(track.id));
  }, [recapData.tracks, selectedJamId, user?.trackRatings]);

  const notableTracks = useMemo(() => {
    return recapData.trackResults
      .map((track) => ({
        track,
        placements: track.categoryAverages
          .filter(
            (category) => category.placement > 0 && category.placement <= 3,
          )
          .sort((a, b) => a.placement - b.placement),
      }))
      .filter((entry) => entry.placements.length > 0)
      .sort((a, b) => a.placements[0].placement - b.placements[0].placement);
  }, [recapData.trackResults]);

  const trackRecapCards = useMemo(() => {
    return recapData.trackDetails.map((track) => {
      const entries = getScoreEntries(track.scores);
      const totalEligibleTracks = recapData.trackResults.filter(
        (candidate) => candidate.game?.category === track.game?.category,
      ).length;

      return {
        track,
        entries,
        totalEligibleTracks,
      };
    });
  }, [recapData.trackDetails, recapData.trackResults]);

  const recapStats = useMemo(() => {
    return {
      commentsOnGame: flattenCommentContents(recapData.gameDetail?.comments)
        .length,
      commentsOnMusic: recapData.trackDetails.reduce(
        (total, track) => total + flattenCommentContents(track.comments).length,
        0,
      ),
      gamesPlayed: playedGames.length,
      tracksRated: ratedTracks.length,
    };
  }, [
    playedGames.length,
    ratedTracks.length,
    recapData.gameDetail,
    recapData.trackDetails,
  ]);

  const handleJamChange = (jamValue: string) => {
    const nextJamId = Number(jamValue);
    if (!Number.isInteger(nextJamId)) return;
    setSelectedJamId(nextJamId);
    const params = new URLSearchParams(searchParams.toString());
    params.set("jam", String(nextJamId));
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleVisibilityChange = async (nextValue: boolean) => {
    if (!selectedJamId) return;
    setSavingVisibility(true);
    try {
      const response = await updateRecapVisibility(selectedJamId, nextValue);
      const json = await response.json();
      if (!response.ok) {
        addToast({
          title: json.message ?? "Failed to update recap visibility",
        });
        return;
      }
      setVisibility(json.data ?? null);
      addToast({
        title: nextValue ? "Recap is now public" : "Recap is now private",
      });
    } catch {
      addToast({ title: "Failed to update recap visibility" });
    } finally {
      setSavingVisibility(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!visibility?.sharePath || typeof window === "undefined") return;
    await navigator.clipboard.writeText(
      `${window.location.origin}${visibility.sharePath}`,
    );
    addToast({ title: "Recap link copied" });
  };

  if (userLoading || !selectedJamId) {
    return <div>Loading recap...</div>;
  }

  if (!user) {
    return <div>Could not load user recap.</div>;
  }

  if (targetUserSlug && !isOwner && loadingVisibility) {
    return <div>Loading recap...</div>;
  }

  if (targetUserSlug && !isOwner && !visibility?.isPublic) {
    return (
      <Card className="p-6">
        <Vstack align="start" gap={2}>
          <Text size="2xl" weight="bold">
            This recap is private
          </Text>
          <Text color="textFaded">
            {user.name} has not shared this jam recap publicly.
          </Text>
        </Vstack>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-8 md:gap-12">
      <Card
        className="overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors.crust}, ${colors.surface0})`,
        }}
      >
        <div className="p-8 md:p-12">
          <Vstack align="start" gap={6}>
            <Hstack wrap className="justify-between gap-3 w-full">
              <Vstack align="start" gap={2}>
                <Text size="4xl" weight="bold">
                  Jam Recap
                </Text>
                <Text color="textFaded">
                  {user.name}
                  {selectedJam ? ` • ${selectedJam.name}` : ""}
                </Text>
              </Vstack>
              <Dropdown
                onSelect={(key) => handleJamChange(String(key))}
                trigger={
                  <Button size="sm" icon="calendar">
                    {selectedJam?.name ?? "Select jam"}
                  </Button>
                }
              >
                {jams.map((jam) => (
                  <Dropdown.Item key={jam.id} value={String(jam.id)}>
                    {jam.name}
                  </Dropdown.Item>
                ))}
              </Dropdown>
            </Hstack>

            <Text color="textFaded">
              A recap of what happened relating to you this game jam!
            </Text>

            <Text color="textFaded">
              This section is under construction due to being brand new! More
              will be getting added to it based on what people want in the recap
              after results release. You can find the regular results through a
              button at the bottom of the page.
            </Text>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 w-full">
              <StatCard
                icon={<MessageSquareText size={18} color={colors.yellow} />}
                label="Games commented on"
                value={String(recapStats.commentsOnGame)}
              />
              <StatCard
                icon={<Headphones size={18} color={colors.blue} />}
                label="Music commented on"
                value={String(recapStats.commentsOnMusic)}
              />
              <StatCard
                icon={<Gamepad2 size={18} color={colors.green} />}
                label="Games rated"
                value={String(recapStats.gamesPlayed)}
              />
              <StatCard
                icon={<Star size={18} color={colors.purple} />}
                label="Tracks rated"
                value={String(recapStats.tracksRated)}
              />
            </div>
          </Vstack>
        </div>
      </Card>

      {error ? (
        <Card className="p-4">
          <Text>{error}</Text>
        </Card>
      ) : null}

      {loadingData ? <div>Loading recap data...</div> : null}

      {!loadingData ? (
        <>
          {false && (
            <div>
              <Section
                title="Your Game"
                subtitle="How your game landed once the ratings settled."
              >
                {recapData.gameDetail ? (
                  <div className="flex flex-col gap-6 w-full">
                    <Card className="p-6 md:p-8">
                      <Vstack align="start" gap={4}>
                        <Text size="2xl" weight="bold">
                          {recapData.gameDetail?.name}
                        </Text>
                        <Text color="textFaded">
                          Category by category, here is how your game scored.
                        </Text>
                        <Hstack wrap>
                          <Button
                            href={`/g/${recapData.gameDetail?.slug ?? ""}`}
                            icon="gamepad2"
                          >
                            Open game page
                          </Button>
                          <Button
                            href={`/results?jam=${selectedJamId}&view=GAMES&category=${recapData.gameDetail?.category ?? "REGULAR"}&contentType=MAJORITYCONTENT&sort=OVERALL`}
                            variant="ghost"
                            icon="trophy"
                          >
                            Open leaderboard
                          </Button>
                        </Hstack>
                      </Vstack>
                    </Card>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 w-full">
                      {gameScoreEntries.map((entry, index) => {
                        const accentPalette = [
                          colors.yellow,
                          colors.green,
                          colors.blue,
                          colors.purple,
                          colors.red,
                        ];

                        return (
                          <ScoreCategoryCard
                            key={entry.key}
                            title={entry.label}
                            stars={entry.averageScore / 2}
                            note={getScoreCallout(
                              entry,
                              totalEligibleGamesInCategory,
                            )}
                            accent={accentPalette[index % accentPalette.length]}
                          />
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <Text color="textFaded">
                    No published game was found for this jam.
                  </Text>
                )}
              </Section>
            </div>
          )}

          <div className={gameCommentWords.length > 0 ? "" : "hidden"}>
            <Section
              title="Words People Used"
              subtitle="The most common words in your game comments"
            >
              <WordCloud words={gameCommentWords} colors={colors} />
              {false ? (
                <Hstack wrap className="gap-2">
                  {gameCommentWords.map((entry) => (
                    <span
                      key={entry.word}
                      className="rounded-full px-3 py-1 text-sm"
                      style={{
                        backgroundColor: colors.surface1,
                        color: colors.text,
                      }}
                    >
                      {entry.word} • {entry.count}
                    </span>
                  ))}
                </Hstack>
              ) : null}
            </Section>
          </div>

          {false && (
            <div>
              <Section
                title="Games You Played"
                subtitle="A quick visual snapshot of what you rated in this jam."
              >
                <Text color="textFaded">
                  You rated {playedGames.length} game
                  {playedGames.length === 1 ? "" : "s"}.
                </Text>
                <div className="grid gap-4 md:grid-cols-3 w-full">
                  {playedGames.slice(0, 6).map((game) => (
                    <a
                      key={game.id}
                      href={`/g/${game.slug}`}
                      className="rounded-xl overflow-hidden border"
                      style={{ borderColor: colors.surface1 }}
                    >
                      <div
                        className="h-32 w-full bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${game.thumbnail || "/images/D2J_Banner.png"})`,
                          backgroundColor: colors.surface0,
                        }}
                      />
                      <div className="p-3">
                        <Text weight="bold">{game.name}</Text>
                        <Text size="sm" color="textFaded">
                          {game.category}
                        </Text>
                      </div>
                    </a>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {false && (
            <div>
              <Section
                title="Top 3 In The Jam"
                subtitle="Games that finished top 3 in at least one category."
              >
                <div className="grid gap-4 md:grid-cols-2 w-full">
                  {notableGames.slice(0, 10).map(({ game, placements }) => (
                    <Card key={game.id} className="p-5 md:p-6">
                      <Vstack align="start" gap={3}>
                        <Text weight="bold">{game.name}</Text>
                        <Text size="sm" color="textFaded">
                          {placements
                            .map(
                              (placement) =>
                                `${ordinal(placement.placement)} in ${placement.categoryName.replace("RatingCategory.", "").replace(".Title", "")}`,
                            )
                            .join(" • ")}
                        </Text>
                        <Button
                          href={`/g/${game.slug}`}
                          variant="ghost"
                          icon="arrowupright"
                        >
                          View game
                        </Button>
                      </Vstack>
                    </Card>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {false && (
            <div>
              <Section
                title="Your Music"
                subtitle="The tracks attached to your game and how they landed."
              >
                {recapData.trackDetails.length > 0 ? (
                  <div className="flex flex-col gap-6 w-full">
                    {trackRecapCards.map(
                      ({ track, entries, totalEligibleTracks }) => (
                        <Card key={track.id} className="p-6 md:p-8">
                          <Vstack align="start" gap={5}>
                            <Hstack
                              wrap
                              className="justify-between gap-3 w-full"
                            >
                              <Vstack align="start" gap={2}>
                                <Text size="xl" weight="bold">
                                  {track.name}
                                </Text>
                                <Text color="textFaded">
                                  Category by category, here is how this track
                                  scored.
                                </Text>
                              </Vstack>
                              <Button
                                href={`/m/${track.slug}`}
                                variant="ghost"
                                icon="music"
                              >
                                Open track page
                              </Button>
                            </Hstack>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 w-full">
                              {entries.map((entry, index) => {
                                const accentPalette = [
                                  colors.blue,
                                  colors.purple,
                                  colors.green,
                                  colors.yellow,
                                  colors.red,
                                ];

                                return (
                                  <ScoreCategoryCard
                                    key={`${track.id}-${entry.key}`}
                                    title={entry.label}
                                    stars={entry.averageScore / 2}
                                    note={getScoreCallout(
                                      entry,
                                      totalEligibleTracks,
                                    )}
                                    accent={
                                      accentPalette[
                                        index % accentPalette.length
                                      ]
                                    }
                                  />
                                );
                              })}
                            </div>
                          </Vstack>
                        </Card>
                      ),
                    )}
                  </div>
                ) : (
                  <Text color="textFaded">
                    No published tracks were found for this jam.
                  </Text>
                )}
              </Section>
            </div>
          )}

          {recapData.trackDetails.length > 0 && musicCommentWords.length > 0 ? (
            <Section
              title="Words People Used For Your Music"
              subtitle="The most commons words in your music comments"
            >
              <WordCloud words={musicCommentWords} colors={colors} />
              {false ? (
                <Hstack wrap className="gap-2">
                  {musicCommentWords.map((entry) => (
                    <span
                      key={entry.word}
                      className="rounded-full px-3 py-1 text-sm"
                      style={{
                        backgroundColor: colors.surface1,
                        color: colors.text,
                      }}
                    >
                      {entry.word} • {entry.count}
                    </span>
                  ))}
                </Hstack>
              ) : null}
            </Section>
          ) : null}

          {false && (
            <div>
              <Section
                title="Tracks You Rated"
                subtitle="A sample of the music you spent time listening to."
              >
                <Text color="textFaded">
                  You rated {ratedTracks.length} track
                  {ratedTracks.length === 1 ? "" : "s"}.
                </Text>
                <div className="grid gap-4 md:grid-cols-3 w-full">
                  {ratedTracks.slice(0, 6).map((track) => (
                    <Card key={track.id} className="p-5 md:p-6">
                      <Vstack align="start" gap={3}>
                        <Text weight="bold">{track.name}</Text>
                        <Text size="sm" color="textFaded">
                          {track.game?.name ?? "Unknown game"}
                        </Text>
                        <Button
                          href={`/m/${track.slug}`}
                          variant="ghost"
                          icon="music"
                        >
                          View track
                        </Button>
                      </Vstack>
                    </Card>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {false && (
            <div>
              <Section
                title="Top 3 Music"
                subtitle="Tracks that finished top 3 in at least one category."
              >
                <div className="grid gap-4 md:grid-cols-2 w-full">
                  {notableTracks.slice(0, 10).map(({ track, placements }) => (
                    <Card key={track.id} className="p-5 md:p-6">
                      <Vstack align="start" gap={3}>
                        <Text weight="bold">{track.name}</Text>
                        <Text size="sm" color="textFaded">
                          {placements
                            .map(
                              (placement) =>
                                `${ordinal(placement.placement)} in ${placement.categoryName}`,
                            )
                            .join(" • ")}
                        </Text>
                        <Button
                          href={`/m/${track.slug}`}
                          variant="ghost"
                          icon="arrowupright"
                        >
                          View track
                        </Button>
                      </Vstack>
                    </Card>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {isOwner ? (
            <Section
              title="Share Your Recap"
              subtitle="Make this page public so other people can open and share it."
            >
              <Hstack wrap className="justify-between gap-4 w-full">
                <Vstack align="start" gap={1}>
                  <Text weight="bold">Public recap</Text>
                </Vstack>
                <Switch
                  checked={Boolean(visibility?.isPublic)}
                  disabled={savingVisibility || !recapData.gameDetail}
                  onChange={handleVisibilityChange}
                />
              </Hstack>
              <Hstack wrap>
                <Button
                  icon="link"
                  onClick={handleCopyShareLink}
                  disabled={!visibility?.isPublic}
                >
                  Copy share link
                </Button>
                {!recapData.gameDetail ? (
                  <Text size="sm" color="textFaded">
                    Publish a game in this jam to enable public recap sharing.
                  </Text>
                ) : null}
              </Hstack>
            </Section>
          ) : null}

          <Card className="p-8 md:p-10">
            <Vstack align="start" gap={4}>
              <Hstack wrap className="gap-2">
                <Text size="xl" weight="bold">
                  Post-jam refinement starts now
                </Text>
              </Hstack>
              <Text color="textFaded">
                Check what people liked and didn't like about the game and go
                through and make improvements based on how you want to improve
                it! There is now a 2 week optional period you can use to work
                more on your game as well as creating materials and pages to
                have the content shown in various places outside the jam and
                then afterwards there will be another optional 2 week period to
                go through and play updated games!
              </Text>
              <Text color="textFaded">
                The site will be updated to help provide marketing, and outside
                the jam help in terms of where to post things during the two
                weeks!
              </Text>
              <Hstack wrap>
                <Button href={`/results?jam=${selectedJamId}`} icon="trophy">
                  View Full Results
                </Button>
              </Hstack>
            </Vstack>
          </Card>
        </>
      ) : null}
    </div>
  );
}
