"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  addToast,
  Avatar,
  Button,
  Card,
  Chip,
  Dropdown,
  Hstack,
  Switch,
  Text,
  Tooltip,
  Vstack,
} from "bioloom-ui";
import { useMusic } from "bioloom-miniplayer";
import { Gamepad2, Headphones, Sparkle, Star } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "@/providers/SiteThemeProvider";
import { useJams, useSelf, useUser } from "@/hooks/queries";
import { getGame, getResults } from "@/requests/game";
import { getTrack, getTrackResults } from "@/requests/track";
import { getRecapVisibility, updateRecapVisibility } from "@/requests/recap";
import type { AchievementType } from "@/types/AchievementType";
import { GameCard } from "@/components/gamecard";
import SidebarSong from "@/components/sidebar/SidebarSong";
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
  gameResults: GameResultType[];
  trackResults: TrackResultType[];
};

type TrackScoreSummary = {
  track: TrackType;
  scoreEntries: Array<{
    key: string;
    label: string;
    placement: number;
    averageScore: number;
  }>;
  displayEntry: { placement: number; averageScore: number };
  notableChips: Array<{ key: string; label: string; detail: string }>;
};

type RarityTier =
  | "Abyssal"
  | "Diamond"
  | "Gold"
  | "Silver"
  | "Bronze"
  | "Default";

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

function flattenCommentContents(
  comments: Array<any> | undefined,
  excludedAuthorIds?: Set<number>,
): string[] {
  if (!Array.isArray(comments)) return [];

  const output: string[] = [];
  const stack = [...comments];

  while (stack.length > 0) {
    const comment = stack.pop();
    if (!comment) continue;
    const authorId = comment.authorId ?? comment.author?.id ?? null;
    const isExcludedAuthor =
      authorId != null &&
      excludedAuthorIds != null &&
      excludedAuthorIds.has(authorId);

    if (
      !isExcludedAuthor &&
      typeof comment.content === "string" &&
      comment.content.trim()
    ) {
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

function formatScoreCategoryName(
  name: string,
  t: ReturnType<typeof useTranslations>,
) {
  const looksLikeTranslationKey = /^\w+(?:\.\w+)+$/.test(name);
  if (looksLikeTranslationKey) {
    try {
      return t(name);
    } catch {
      // fall through to label cleanup
    }
  }

  return name
    .replace("RatingCategory.", "")
    .replace(".Title", "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
}

function getScoreEntries(
  scores: Record<string, any> | null | undefined,
  t: ReturnType<typeof useTranslations>,
) {
  if (!scores) return [];

  return Object.entries(scores)
    .map(([key, value]) => ({
      key,
      label: formatScoreCategoryName(key, t),
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

function compareGameScoreEntries(
  a: { placement: number; averageScore: number },
  b: { placement: number; averageScore: number },
) {
  const aIsTopBand = a.placement >= 1 && a.placement <= 3;
  const bIsTopBand = b.placement >= 1 && b.placement <= 3;

  if (aIsTopBand !== bIsTopBand) {
    return aIsTopBand ? -1 : 1;
  }

  if (aIsTopBand && bIsTopBand && a.placement !== b.placement) {
    return a.placement - b.placement;
  }

  if (a.averageScore !== b.averageScore) {
    return b.averageScore - a.averageScore;
  }

  const aPlacement = a.placement > 0 ? a.placement : Number.POSITIVE_INFINITY;
  const bPlacement = b.placement > 0 ? b.placement : Number.POSITIVE_INFINITY;
  return aPlacement - bPlacement;
}

function getPercentileLabel(percentile: number) {
  if (percentile <= 1) return "Top 1%";
  if (percentile <= 5) return "Top 5%";
  if (percentile <= 10) return "Top 10%";
  if (percentile <= 25) return "Top 25%";
  if (percentile <= 50) return "Top 50%";
  return null;
}

function buildPlacementPoolKey(group: string | null | undefined, key: string) {
  return `${group ?? "UNKNOWN"}::${key}`;
}

function getResultsGradient(
  placement: number,
  averageScore: number,
  colors: Record<string, string>,
) {
  if (placement >= 1 && placement <= 3) {
    return {
      gradient: `linear-gradient(90deg, ${colors.yellow}, ${colors.red})`,
      first: colors.red,
    };
  }
  if (averageScore >= 8) {
    return {
      gradient: `linear-gradient(90deg, ${colors.greenLight}, ${colors.green}, ${colors.greenDark})`,
      first: colors.green,
    };
  }
  if (averageScore >= 7) {
    return {
      gradient: `linear-gradient(90deg, ${colors.blueLight}, ${colors.blue}, ${colors.blueDark})`,
      first: colors.blueLight,
    };
  }
  if (averageScore >= 6) {
    return {
      gradient: `linear-gradient(90deg, ${colors.purpleLight}, ${colors.purple}, ${colors.purpleDark})`,
      first: colors.purple,
    };
  }
  return {
    gradient: `linear-gradient(90deg, ${colors.textFaded}, ${colors.textFaded})`,
    first: colors.textFaded,
  };
}

function gradientTextStyle(gradient: string, first: string) {
  return {
    backgroundImage: gradient,
    WebkitBackgroundClip: "text" as const,
    color: first,
    WebkitTextFillColor: "transparent",
  };
}

function getNotableGameScoreChips(
  scoreEntries: Array<{
    key: string;
    label: string;
    placement: number;
  }>,
  categoryPlacementTotals: Map<string, number>,
  group: string | null | undefined,
) {
  return scoreEntries.flatMap((entry) => {
    if (entry.placement >= 1 && entry.placement <= 3) {
      return [
        {
          key: `${entry.key}-placement`,
          label: `#${entry.placement}`,
          detail: entry.label,
        },
      ];
    }

    const total =
      categoryPlacementTotals.get(buildPlacementPoolKey(group, entry.key)) ?? 0;
    if (entry.placement < 1 || total <= 0) return [];

    const percentile = (entry.placement / total) * 100;
    const percentileLabel = getPercentileLabel(percentile);
    if (!percentileLabel) return [];

    return [
      {
        key: `${entry.key}-percentile`,
        label: percentileLabel,
        detail: entry.label,
      },
    ];
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

function getRarityTier(
  haveCount: number,
  totalEngaged: number,
): { tier: RarityTier; pct: number } {
  const pct = totalEngaged > 0 ? (haveCount / totalEngaged) * 100 : 0;
  if (totalEngaged >= 40 && pct <= 5) return { tier: "Abyssal", pct };
  if (totalEngaged >= 20 && pct <= 10) return { tier: "Diamond", pct };
  if (totalEngaged >= 10 && pct <= 25) return { tier: "Gold", pct };
  if (totalEngaged >= 5 && pct <= 50) return { tier: "Silver", pct };
  if (totalEngaged >= 5 && pct <= 100) return { tier: "Bronze", pct };
  return { tier: "Default", pct };
}

function engagedUserIdsForGame(game: GameType): Set<number> {
  const ids = new Set<number>();
  if (!game) return ids;

  for (const a of game.achievements ?? []) {
    for (const u of a.users ?? []) {
      if (u?.id != null) ids.add(u.id);
    }
  }

  for (const lb of game.leaderboards ?? []) {
    for (const s of lb.scores ?? []) {
      const uid = s?.userId;
      if (uid != null) ids.add(uid);
    }
  }

  for (const r of game.ratings ?? []) {
    const uid = r?.user?.id ?? r?.userId;
    if (uid != null) ids.add(uid);
  }

  return ids;
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
          <span>{stars.toFixed(2)}</span>
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

function FavoriteFacepile({
  users,
}: {
  users: Array<{
    id: number;
    slug: string;
    name: string;
    profilePicture?: string | null;
  }>;
}) {
  if (users.length === 0) return null;

  return (
    <div className="flex items-center">
      {users.slice(0, 10).map((entry, index) => (
        <a
          key={entry.id}
          href={`/u/${entry.slug}`}
          title={entry.name}
          className="relative"
          style={{ marginLeft: index === 0 ? 0 : -10 }}
        >
          <div className="rounded-full">
            <Avatar size={30} src={entry.profilePicture ?? undefined} />
          </div>
        </a>
      ))}
    </div>
  );
}

function formatPlacementLabel(
  categoryName: string,
  placement: number,
  t: ReturnType<typeof useTranslations>,
) {
  const label = formatScoreCategoryName(categoryName, t);
  return `${ordinal(placement)} in ${label}`;
}

function getTopPlacementsFromGame(
  result: GameResultType,
  t: ReturnType<typeof useTranslations>,
) {
  return (result.categoryAverages ?? [])
    .filter((entry) => entry.placement >= 1 && entry.placement <= 3)
    .map((entry) => ({
      placement: entry.placement,
      label: formatPlacementLabel(entry.categoryName, entry.placement, t),
    }))
    .sort(
      (a, b) => a.placement - b.placement || a.label.localeCompare(b.label),
    );
}

function getTopPlacementsFromTrack(
  track: TrackResultType,
  t: ReturnType<typeof useTranslations>,
) {
  return (track.categoryAverages ?? [])
    .filter((entry) => entry.placement >= 1 && entry.placement <= 3)
    .map((entry) => ({
      placement: entry.placement,
      label: `${ordinal(entry.placement)} in ${formatScoreCategoryName(entry.categoryName, t)}`,
    }))
    .sort(
      (a, b) => a.placement - b.placement || a.label.localeCompare(b.label),
    );
}

function unwrapArrayResponse<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: T[] }).data;
  }

  return [];
}

function SectionHeaderCard({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <Card className="p-5 md:p-6">
      <Vstack align="center" gap={1} className="text-center">
        <Text size="xl" weight="bold">
          {title}
        </Text>
        {subtitle ? (
          <Text size="sm" color="textFaded">
            {subtitle}
          </Text>
        ) : null}
      </Vstack>
    </Card>
  );
}

function HighlightGameCard({
  game,
  placements,
  colors,
}: {
  game: GameResultType;
  placements: Array<{ placement: number; label: string }>;
  colors: Record<string, string>;
}) {
  return (
    <a href={`/g/${game.slug}`} className="block">
      <Card padding={0} className="overflow-hidden relative h-full">
        <div
          className="absolute top-0 left-0 p-2 pt-1 pb-1 rounded shadow-md m-2 backdrop-blur-md text-xs z-10"
          style={{
            color: colors.text,
            backgroundColor: `${colors[game.jam?.color || "green"]}aa`,
            borderColor: colors[game.jam?.color || "green"],
          }}
        >
          {game.jam?.name || "Game Jam"}
        </div>
        <div className="shadow-[inset_0_0_20px_rgba(0, 0, 0, 0.7)]">
          <Image
            alt={`${game.name}'s thumbnail`}
            height={200}
            width={360}
            className="w-full h-[180px] object-cover shadow-inner"
            src={game.thumbnail ?? "/images/D2J_Icon.png"}
          />
        </div>
        <Vstack
          align="start"
          gap={3}
          className="border-t-1 w-full p-4"
          style={{
            borderColor: `${colors.text}66`,
            backgroundColor: colors.base,
          }}
        >
          <Vstack align="start" gap={0}>
            <Text size="2xl" color="text">
              {game.name}
            </Text>
            <Text size="sm" color="textFaded">
              {game.short?.trim() || "General.NoDescription"}
            </Text>
          </Vstack>
          <Vstack align="start" gap={2} className="w-full mt-2">
            {placements.slice(0, 3).map((placement) => (
              <div
                key={`${game.id}-${placement.label}`}
                className="rounded-full px-3 py-1 text-sm font-semibold"
                style={{
                  backgroundColor: `${colors.yellow}14`,
                  color: colors.yellow,
                }}
              >
                {placement.label}
              </div>
            ))}
          </Vstack>
        </Vstack>
      </Card>
    </a>
  );
}

function HighlightTrackCard({
  track,
  placements,
  colors,
}: {
  track: TrackResultType;
  placements: Array<{ placement: number; label: string }>;
  colors: Record<string, string>;
}) {
  const { playItem } = useMusic();

  return (
    <Card className="p-5 md:p-6 h-full">
      <Vstack align="start" gap={4}>
        <Hstack className="items-start gap-3 w-full">
          <Image
            src={track.game?.thumbnail || "/images/D2J_Icon.png"}
            width={90}
            height={50}
            className="min-w-[90px] min-h-[50px] max-w-[90px] max-h-[50px] object-cover rounded"
            alt="Song Thumbnail"
          />
          <Vstack align="start" gap={0}>
            <a href={`/m/${track.slug}`}>
              <Text weight="bold">{track.name}</Text>
            </a>
            <Text size="sm" color="textFaded">
              {track.game?.name ?? "Unknown game"}
            </Text>
            <Text size="sm" color="textFaded">
              {track.composer?.name || track.composer?.slug || "Unknown"}
            </Text>
          </Vstack>
        </Hstack>
        <Hstack wrap className="gap-2">
          <Button
            icon="play"
            onClick={() =>
              playItem({
                id: track.id,
                slug: track.slug,
                name: track.name,
                artist: track.composer ?? {
                  name: "Unknown",
                  slug: "",
                },
                thumbnail: track.game?.thumbnail ?? "/images/D2J_Icon.png",
                game: track.game ?? { name: "Unknown game", slug: "" },
                song: track.url,
              })
            }
          >
            Play
          </Button>
          <Button href={`/m/${track.slug}`} icon="music">
            Open track page
          </Button>
        </Hstack>

        <Vstack align="start" gap={2} className="w-full">
          {placements.slice(0, 3).map((placement) => (
            <div
              key={`${track.id}-${placement.label}`}
              className="rounded-full px-3 py-1 text-sm font-semibold"
              style={{
                backgroundColor: `${colors.purple}14`,
                color: colors.purple,
              }}
            >
              {placement.label}
            </div>
          ))}
        </Vstack>
      </Vstack>
    </Card>
  );
}

function TrackScoreCard({
  track,
  displayEntry,
  notableChips,
  colors,
}: {
  track: TrackType;
  displayEntry: {
    placement: number;
    averageScore: number;
  };
  notableChips: Array<{ key: string; label: string; detail: string }>;
  colors: Record<string, string>;
}) {
  const { playItem } = useMusic();
  const { gradient, first } = getResultsGradient(
    displayEntry.placement,
    displayEntry.averageScore,
    colors,
  );

  return (
    <Card className="p-5 md:p-6 h-full">
      <Vstack align="start" gap={4} className="w-full">
        <Hstack className="items-start gap-3 w-full">
          <Image
            src={track.game?.thumbnail || "/images/D2J_Icon.png"}
            width={90}
            height={50}
            className="min-w-[90px] min-h-[50px] max-w-[90px] max-h-[50px] object-cover rounded"
            alt="Song Thumbnail"
          />
          <Vstack align="start" gap={0} className="min-w-0">
            <a href={`/m/${track.slug}`}>
              <Text weight="bold">{track.name}</Text>
            </a>
            <Text size="sm" color="textFaded">
              {track.game?.name ?? "Unknown game"}
            </Text>
            <Text size="sm" color="textFaded">
              {track.composer?.name || track.composer?.slug || "Unknown"}
            </Text>
          </Vstack>
        </Hstack>

        <Vstack align="start" gap={1}>
          <span
            className="text-3xl font-bold leading-none"
            style={gradientTextStyle(gradient, first)}
          >
            {(displayEntry.averageScore / 2).toFixed(2)}
          </span>
          <Text color="textFaded">stars</Text>
        </Vstack>

        <Hstack wrap className="gap-2">
          <Button
            icon="play"
            onClick={() =>
              playItem({
                id: track.id,
                slug: track.slug,
                name: track.name,
                artist: track.composer ?? {
                  name: "Unknown",
                  slug: "",
                },
                thumbnail: track.game?.thumbnail ?? "/images/D2J_Icon.png",
                game: track.game ?? { name: "Unknown game", slug: "" },
                song: track.url,
              })
            }
          >
            Play
          </Button>
          <Button href={`/m/${track.slug}`} icon="music">
            Open track page
          </Button>
        </Hstack>

        {notableChips.length > 0 ? (
          <div className="flex flex-wrap gap-2 w-full">
            {notableChips.map((chip) => (
              <Chip key={`${track.id}-${chip.key}`}>
                <span style={{ color: colors.blue }}>{chip.label}</span>{" "}
                <span style={{ color: colors.textFaded }}>{chip.detail}</span>
              </Chip>
            ))}
          </div>
        ) : null}
      </Vstack>
    </Card>
  );
}

export default function Recap({ targetUserSlug }: RecapProps) {
  const t = useTranslations();
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
    gameResults: [],
    trackResults: [],
  });

  const isOwner = targetUserSlug
    ? self?.slug === effectiveSlug
    : Boolean(self?.slug);

  useEffect(() => {
    if (jams.length === 0) return;
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
    if (!selectedJamId) return;
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

        const [regularGameResultsResponse, odaGameResultsResponse] =
          await Promise.all([
            getResults(
              "REGULAR",
              "GAME",
              "OVERALL",
              String(jamId),
              false,
              true,
            ),
            getResults("ODA", "GAME", "OVERALL", String(jamId), false, true),
          ]);
        const [regularTrackResultsResponse, odaTrackResultsResponse] =
          await Promise.all([
            getTrackResults(String(jamId), false, "REGULAR", true),
            getTrackResults(String(jamId), false, "ODA", true),
          ]);

        const regularGameResults = unwrapArrayResponse<GameResultType>(
          await regularGameResultsResponse.json(),
        );
        const odaGameResults = unwrapArrayResponse<GameResultType>(
          await odaGameResultsResponse.json(),
        );
        const regularTrackResults = unwrapArrayResponse<TrackResultType>(
          await regularTrackResultsResponse.json(),
        );
        const odaTrackResults = unwrapArrayResponse<TrackResultType>(
          await odaTrackResultsResponse.json(),
        );

        const gameResults = [...regularGameResults, ...odaGameResults].filter(
          (entry, index, self) =>
            self.findIndex((item) => item.id === entry.id) === index,
        );

        const trackResults = [
          ...regularTrackResults,
          ...odaTrackResults,
        ].filter(
          (entry, index, self) =>
            self.findIndex((item) => item.id === entry.id) === index,
        );

        if (!active) return;

        setRecapData({
          gameDetail,
          trackDetails,
          gameResults,
          trackResults,
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

  const rarityStyles: Record<
    RarityTier,
    { border: string; glow?: string; text: string }
  > = useMemo(
    () => ({
      Abyssal: {
        border: `${colors.magenta}99`,
        glow: `0 0 12px ${colors.magentaDark}99`,
        text: colors.magenta,
      },
      Diamond: {
        border: `${colors.blue}99`,
        glow: `0 0 10px ${colors.blueDark}99`,
        text: colors.blue,
      },
      Gold: {
        border: `${colors.yellow}99`,
        glow: `0 0 10px ${colors.yellowDark}99`,
        text: colors.yellow,
      },
      Silver: {
        border: `${colors.gray}99`,
        glow: `0 0 8px ${colors.gray}99`,
        text: colors.gray,
      },
      Bronze: {
        border: `${colors.orange}99`,
        glow: `0 0 8px ${colors.orangeDark}99`,
        text: colors.orange,
      },
      Default: {
        border: `${colors.base}99`,
        text: colors.textFaded,
      },
    }),
    [colors],
  );

  const ownerTeamUserIds = useMemo(
    () =>
      new Set(
        (recapData.gameDetail?.team?.users ?? [])
          .map((member: any) => member?.id)
          .filter((value: unknown): value is number => Number.isInteger(value)),
      ),
    [recapData.gameDetail?.team?.users],
  );

  const gameCommentWords = useMemo(
    () =>
      getTopWords(
        flattenCommentContents(recapData.gameDetail?.comments, ownerTeamUserIds),
      ),
    [ownerTeamUserIds, recapData.gameDetail],
  );
  const topGamesInJam = useMemo(
    () =>
      recapData.gameResults
        .map((game) => ({
          game,
          placements: getTopPlacementsFromGame(game, t),
        }))
        .filter((entry) => entry.placements.length > 0)
        .sort((a, b) => {
          const aBest = a.placements[0]?.placement ?? 99;
          const bBest = b.placements[0]?.placement ?? 99;
          if (aBest !== bBest) return aBest - bBest;
          return a.game.name.localeCompare(b.game.name);
        }),
    [recapData.gameResults, t],
  );

  const musicCommentWords = useMemo(() => {
    return getTopWords(
      recapData.trackDetails.flatMap((track) =>
        flattenCommentContents(track.comments, ownerTeamUserIds),
      ),
    );
  }, [ownerTeamUserIds, recapData.trackDetails]);
  const notableGames: Array<{
    game: GameResultType;
    placements: Array<{ placement: number; categoryName: string }>;
  }> = [];
  const trackRecapCards: Array<{
    track: TrackType;
    entries: Array<{
      key: string;
      label: string;
      averageScore: number;
      placement: number;
    }>;
    totalEligibleTracks: number;
  }> = [];
  const ratedTracks: TrackType[] = [];
  const notableTracks: Array<{
    track: TrackType;
    placements: Array<{ placement: number; categoryName: string }>;
  }> = [];
  const topTracksInJam = useMemo(
    () =>
      recapData.trackResults
        .map((track) => ({
          track,
          placements: getTopPlacementsFromTrack(track, t),
        }))
        .filter((entry) => entry.placements.length > 0)
        .sort((a, b) => {
          const aBest = a.placements[0]?.placement ?? 99;
          const bBest = b.placements[0]?.placement ?? 99;
          if (aBest !== bBest) return aBest - bBest;
          return a.track.name.localeCompare(b.track.name);
        }),
    [recapData.trackResults, t],
  );

  const gameScoreEntries = useMemo(
    () =>
      getScoreEntries(recapData.gameDetail?.scores, t).sort(
        compareGameScoreEntries,
      ),
    [recapData.gameDetail?.scores, t],
  );

  const gameScoreChartData = useMemo(
    () =>
      gameScoreEntries.map((entry) => ({
        subject: entry.label,
        ranked: entry.averageScore / 2,
        all: entry.averageUnrankedScore / 2,
        fullMark: 5,
      })),
    [gameScoreEntries],
  );

  const gameCategoryPlacementTotals = useMemo(() => {
    const totals = new Map<string, number>();

    for (const game of recapData.gameResults) {
      for (const category of game.categoryAverages ?? []) {
        if (category.placement >= 1) {
          const key = buildPlacementPoolKey(
            game.category,
            category.categoryName,
          );
          const current = totals.get(key) ?? 0;
          totals.set(key, Math.max(current, category.placement));
        }
      }
    }

    return totals;
  }, [recapData.gameResults]);

  const trackCategoryPlacementTotals = useMemo(() => {
    const totals = new Map<string, number>();

    for (const track of recapData.trackResults) {
      for (const category of track.categoryAverages ?? []) {
        if (category.placement >= 1) {
          const key = buildPlacementPoolKey(
            track.game?.category,
            category.categoryName,
          );
          const current = totals.get(key) ?? 0;
          totals.set(key, Math.max(current, category.placement));
        }
      }
    }

    return totals;
  }, [recapData.trackResults]);

  const notableGameScoreChips = useMemo(
    () =>
      getNotableGameScoreChips(
        gameScoreEntries,
        gameCategoryPlacementTotals,
        recapData.gameDetail?.category,
      ),
    [
      gameCategoryPlacementTotals,
      gameScoreEntries,
      recapData.gameDetail?.category,
    ],
  );

  const trackScoreSummaries = useMemo(
    () =>
      recapData.trackDetails.reduce<TrackScoreSummary[]>((acc, track) => {
        const matchingTrackResult = recapData.trackResults.find(
          (entry) => entry.id === track.id,
        );
        const scoreEntries =
          matchingTrackResult != null
            ? (matchingTrackResult.categoryAverages ?? [])
                .map((entry) => ({
                  key: entry.categoryName,
                  label: formatScoreCategoryName(entry.categoryName, t),
                  placement: Number(entry.placement ?? -1),
                  averageScore: Number(entry.averageScore ?? 0),
                }))
                .filter((entry) => entry.averageScore > 0)
                .sort(compareGameScoreEntries)
            : getScoreEntries(track.scores, t).sort(compareGameScoreEntries);
        const overallScore =
          matchingTrackResult?.categoryAverages?.find(
            (entry) => entry.categoryName === "Overall",
          ) ?? getOverallTrackScore(track);
        const displayEntry = overallScore
          ? {
              placement: overallScore.placement,
              averageScore: overallScore.averageScore,
            }
          : scoreEntries[0]
            ? {
                placement: scoreEntries[0].placement,
                averageScore: scoreEntries[0].averageScore,
              }
            : null;

        if (scoreEntries.length === 0 || displayEntry == null) {
          return acc;
        }

        acc.push({
          track,
          scoreEntries,
          displayEntry,
            notableChips: getNotableGameScoreChips(
              scoreEntries,
              trackCategoryPlacementTotals,
              matchingTrackResult?.game?.category ??
                recapData.gameDetail?.category ??
                track.game?.category,
            ),
          });
          return acc;
        }, []),
      [
        recapData.trackResults,
        recapData.gameDetail?.category,
        recapData.trackDetails,
        t,
        trackCategoryPlacementTotals,
      ],
  );

  const earnedAchievements = useMemo(
    () =>
      (user?.achievements ?? [])
        .filter(
          (achievement: AchievementType) =>
            achievement.game?.jamId === selectedJamId,
        )
        .sort((a: AchievementType, b: AchievementType) => b.id - a.id),
    [selectedJamId, user?.achievements],
  );

  const recommendedGamesForJam = useMemo(
    () =>
      (user?.recommendedGames ?? []).filter(
        (game) => game.jam?.id === selectedJamId,
      ),
    [selectedJamId, user?.recommendedGames],
  );

  const recommendedTracksForJam = useMemo(
    () =>
      (user?.recommendedTracks ?? []).filter(
        (track) => track.game?.jamId === selectedJamId,
      ),
    [selectedJamId, user?.recommendedTracks],
  );

  const ownerGame = useMemo(
    () => getUserGameForJam(user, selectedJamId ?? -1),
    [selectedJamId, user],
  );

  const ownerGameFavoriteCount =
    ownerGame && selectedJamId
      ? ((user?.favoriteGameCounts ?? []).find(
          (entry) => entry.gameId === ownerGame.id,
        )?.count ?? 0)
      : 0;
  const ownerGameFavoriteUsers =
    ownerGame && selectedJamId
      ? ((user?.favoriteGameCounts ?? []).find(
          (entry) => entry.gameId === ownerGame.id,
        )?.users ?? [])
      : [];

  const favoriteTracksForJam = useMemo(() => {
    const counts = new Map(
      (user?.favoriteTrackCounts ?? []).map((entry) => [entry.trackId, entry]),
    );

    return recapData.trackDetails
      .map((track) => ({
        track,
        count: counts.get(track.id)?.count ?? 0,
        users: counts.get(track.id)?.users ?? [],
      }))
      .filter((entry) => entry.count > 1);
  }, [recapData.trackDetails, user?.favoriteTrackCounts]);

  const hasGamesSection =
    gameScoreEntries.length > 0 ||
    gameCommentWords.length > 0 ||
    recommendedGamesForJam.length > 0 ||
    Boolean(ownerGame && ownerGameFavoriteCount > 1) ||
    topGamesInJam.length > 0;

  const hasMusicSection =
    trackScoreSummaries.length > 0 ||
    (recapData.trackDetails.length > 0 && musicCommentWords.length > 0) ||
    recommendedTracksForJam.length > 0 ||
    favoriteTracksForJam.length > 0 ||
    topTracksInJam.length > 0;

  const hasScoresSection = earnedAchievements.length > 0;

  const recapStats = useMemo(() => {
    const gamesCommentedOn = new Set(
      (user?.comments ?? [])
        .filter((comment: any) => comment.game?.jamId === selectedJamId)
        .map((comment: any) => comment.game?.id)
        .filter((value: unknown): value is number => Number.isInteger(value)),
    ).size;
    const tracksCommentedOn = new Set(
      (user?.comments ?? [])
        .filter((comment: any) => comment.track?.game?.jamId === selectedJamId)
        .map((comment: any) => comment.track?.id)
        .filter((value: unknown): value is number => Number.isInteger(value)),
    ).size;
    const gamesRated = new Set(
      (user?.ratings ?? [])
        .filter((rating: any) => rating.game?.jamId === selectedJamId)
        .map((rating: any) => rating.gameId),
    ).size;
    const tracksRated = new Set(
      (user?.trackRatings ?? [])
        .filter((rating: any) => rating.track?.game?.jamId === selectedJamId)
        .map((rating: any) => rating.trackId),
    ).size;

    return {
      commentsOnGame: gamesCommentedOn,
      commentsOnMusic: tracksCommentedOn,
      gamesRated,
      tracksRated,
    };
  }, [selectedJamId, user?.comments, user?.ratings, user?.trackRatings]);

  const visibleStatCards = useMemo(
    () =>
      [
        {
          key: "commentsOnGame",
          icon: <Gamepad2 size={18} color={colors.yellow} />,
          label: "Games commented on",
          value: recapStats.commentsOnGame,
        },
        {
          key: "commentsOnMusic",
          icon: <Headphones size={18} color={colors.blue} />,
          label: "Music commented on",
          value: recapStats.commentsOnMusic,
        },
        {
          key: "gamesRated",
          icon: <Star size={18} color={colors.green} />,
          label: "Games rated",
          value: recapStats.gamesRated,
        },
        {
          key: "tracksRated",
          icon: <Sparkle size={18} color={colors.purple} />,
          label: "Tracks rated",
          value: recapStats.tracksRated,
        },
      ].filter((stat) => stat.value > 0),
    [colors.blue, colors.green, colors.purple, colors.yellow, recapStats],
  );

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

  if (targetUserSlug && !user) {
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
            {user?.name ?? "This user"} has not shared this jam recap publicly.
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
                  {user?.name ?? "D2Jam"}
                  {selectedJam ? ` • ${selectedJam.name}` : ""}
                </Text>
              </Vstack>
              <Hstack wrap className="gap-2">
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
                <Button
                  size="sm"
                  href={`/results?jam=${selectedJamId}`}
                  icon="trophy"
                >
                  View Full Results
                </Button>
              </Hstack>
            </Hstack>

            <Text color="textFaded">
              {user
                ? "A recap of what happened relating to you this game jam!"
                : "A recap of standout things from this game jam!"}
            </Text>

            {visibleStatCards.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 w-full">
                {visibleStatCards.map((stat) => (
                  <StatCard
                    key={stat.key}
                    icon={stat.icon}
                    label={stat.label}
                    value={String(stat.value)}
                  />
                ))}
              </div>
            ) : null}
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
          {hasGamesSection ? (
            <SectionHeaderCard
              title="Games"
              subtitle="Your game, favorites, and standout jam entries"
            />
          ) : null}

          {recapData.gameDetail && gameScoreEntries.length > 0 ? (
            <Section
              title="How Your Game Landed"
              subtitle="The star rating of various aspects of your game!"
            >
              <Vstack align="start" gap={6} className="w-full">
                {notableGameScoreChips.length > 0 ? (
                  <div className="flex flex-wrap gap-2 w-full">
                    {notableGameScoreChips.map((chip) => (
                      <Chip key={chip.key}>
                        <span style={{ color: colors.blue }}>{chip.label}</span>{" "}
                        <span style={{ color: colors.textFaded }}>
                          {chip.detail}
                        </span>
                      </Chip>
                    ))}
                  </div>
                ) : null}

                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] gap-6 w-full items-start">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gameScoreEntries.map((entry) => {
                      const { gradient, first } = getResultsGradient(
                        entry.placement,
                        entry.averageScore,
                        colors,
                      );

                      return (
                        <Card key={entry.key} className="p-5 md:p-6">
                          <Vstack align="start" gap={3} className="w-full">
                            <Text color="textFaded">{entry.label}</Text>
                            <span
                              className="text-3xl font-bold leading-none"
                              style={gradientTextStyle(gradient, first)}
                            >
                              {(entry.averageScore / 2).toFixed(2)}
                            </span>
                            <Text color="textFaded">stars</Text>
                          </Vstack>
                        </Card>
                      );
                    })}
                  </div>

                  <Vstack align="start" gap={4} className="w-full h-full">
                    <div className="w-full h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart
                          cx="50%"
                          cy="50%"
                          outerRadius="80%"
                          data={gameScoreChartData}
                        >
                          <PolarGrid stroke={colors.crust} />
                          <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: colors.textFaded, fontSize: 12 }}
                          />
                          <PolarRadiusAxis
                            domain={[0, 5]}
                            axisLine={false}
                            tick={false}
                          />
                          <Radar
                            name="All"
                            dataKey="all"
                            stroke={colors.magenta}
                            fill={colors.magentaDark}
                            fillOpacity={0.55}
                          />
                          <Radar
                            name="Ranked"
                            dataKey="ranked"
                            stroke={colors.blue}
                            fill={colors.blueDark}
                            fillOpacity={0.55}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </Vstack>
                </div>
              </Vstack>
            </Section>
          ) : null}

          <div className={gameCommentWords.length > 0 ? "" : "hidden"}>
            <Section
              title="Words People Used"
              subtitle="The most common words in your game comments"
            >
              <WordCloud words={gameCommentWords} colors={colors} />
            </Section>
          </div>

          {recommendedGamesForJam.length > 0 ? (
            <Section
              title="Games You Enjoyed Most"
              subtitle="The games that ended up in your favorites for this jam"
            >
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                {recommendedGamesForJam.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </section>
            </Section>
          ) : null}

          {ownerGame && ownerGameFavoriteCount > 1 ? (
            <Section
              title="Your game was Recommended"
              subtitle="People really enjoyed your game and had it as one of their favorites in the jam!"
            >
              <Vstack align="center" gap={4} className="w-full text-center">
                <Vstack align="center" gap={1}>
                  <Text size="xl" weight="bold">
                    {ownerGameFavoriteCount}{" "}
                    {ownerGameFavoriteCount === 1 ? "person" : "people"}
                  </Text>
                  <Text color="textFaded" size="sm">
                    had{" "}
                    <span style={{ color: colors.text }}>{ownerGame.name}</span>{" "}
                    in their favorites.
                  </Text>
                </Vstack>
                <FavoriteFacepile users={ownerGameFavoriteUsers} />
              </Vstack>
            </Section>
          ) : null}

          {topGamesInJam.length > 0 ? (
            <Section
              title="Top Games In The Jam"
              subtitle="Games that placed top 3 in at least one category across regular and ODA"
            >
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                {topGamesInJam.map(({ game, placements }) => (
                  <HighlightGameCard
                    key={game.id}
                    game={game}
                    placements={placements}
                    colors={colors}
                  />
                ))}
              </section>
            </Section>
          ) : null}

          {hasMusicSection ? (
            <SectionHeaderCard
              title="Music"
              subtitle="Your soundtrack highlights and notable tracks"
            />
          ) : null}

          {trackScoreSummaries.length > 0 ? (
            <Section
              title="How Your Music Landed"
              subtitle="Your tracks, their star ratings, and the placements that stood out"
            >
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {trackScoreSummaries.map(
                  ({ track, displayEntry, notableChips }) => (
                    <TrackScoreCard
                      key={track.id}
                      track={track}
                      displayEntry={displayEntry}
                      notableChips={notableChips}
                      colors={colors}
                    />
                  ),
                )}
              </section>
            </Section>
          ) : null}

          {recapData.trackDetails.length > 0 && musicCommentWords.length > 0 ? (
            <Section
              title="Words People Used For Your Music"
              subtitle="The most commons words in your music comments"
            >
              <WordCloud words={musicCommentWords} colors={colors} />
            </Section>
          ) : null}

          {recommendedTracksForJam.length > 0 ? (
            <Section
              title="Music You Enjoyed Most"
              subtitle="The tracks that ended up in your favorites for this jam"
            >
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {recommendedTracksForJam.map((track) => (
                  <SidebarSong
                    key={track.id}
                    slug={track.slug}
                    name={track.name}
                    artist={track.composer ?? { name: "Unknown", slug: "" }}
                    thumbnail={track.game?.thumbnail || "/images/D2J_Icon.png"}
                    game={
                      track.game
                        ? {
                            ...track.game,
                            thumbnail: track.game.thumbnail ?? undefined,
                          }
                        : { name: "Unknown game", slug: "" }
                    }
                    song={track.url}
                    license={track.license}
                    allowDownload={track.allowDownload}
                    allowBackgroundUse={track.allowBackgroundUse}
                    allowBackgroundUseAttribution={
                      track.allowBackgroundUseAttribution
                    }
                    showRating={false}
                  />
                ))}
              </section>
            </Section>
          ) : null}

          {favoriteTracksForJam.length > 0 ? (
            <Section
              title="People Had Your Music In Their Favorites"
              subtitle="Tracks from your game that other players recommended"
            >
              <div className="flex flex-wrap justify-center gap-4 w-full">
                {favoriteTracksForJam.map(({ track, count, users }) => (
                  <Card
                    key={track.id}
                    className="p-5 md:p-6 w-full md:max-w-[420px]"
                  >
                    <Vstack
                      align="center"
                      gap={4}
                      className="w-full text-center"
                    >
                      <Vstack align="center" gap={1}>
                        <Text weight="bold">{track.name}</Text>
                        <Text color="textFaded">
                          {count} {count === 1 ? "person had" : "people had"}{" "}
                          this track in their favorites.
                        </Text>
                      </Vstack>
                      <FavoriteFacepile users={users} />
                      <Button
                        href={`/m/${track.slug}`}
                        variant="ghost"
                        icon="music"
                      >
                        Open track page
                      </Button>
                    </Vstack>
                  </Card>
                ))}
              </div>
            </Section>
          ) : null}

          {topTracksInJam.length > 0 ? (
            <Section
              title="Top Music In The Jam"
              subtitle="Tracks that placed top 3 in at least one category across regular and ODA"
            >
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {topTracksInJam.map(({ track, placements }) => (
                  <HighlightTrackCard
                    key={track.id}
                    track={track}
                    placements={placements}
                    colors={colors}
                  />
                ))}
              </section>
            </Section>
          ) : null}

          {hasScoresSection ? (
            <SectionHeaderCard
              title="Scores & Achievements"
              subtitle="Things you achieved in games this jam!"
            />
          ) : null}

          {earnedAchievements.length > 0 ? (
            <Section
              title="Achievements You Earned"
              subtitle="The achievements you unlocked during this jam"
            >
              <div className="flex w-full justify-center">
                <div className="flex flex-wrap justify-center gap-3 max-w-5xl">
                  {earnedAchievements.map((achievement) => {
                    const fullAchievement =
                      achievement.game?.achievements?.find(
                        (entry) => entry.id === achievement.id,
                      ) ?? achievement;
                    const haveCount = fullAchievement?.users?.length ?? 0;
                    const engagedIds = engagedUserIdsForGame(achievement.game);
                    const { tier, pct } = getRarityTier(
                      haveCount,
                      engagedIds.size,
                    );
                    const style = rarityStyles[tier];

                    return (
                      <div key={achievement.id} className="relative">
                        <Tooltip
                          content={
                            <Vstack align="start">
                              <Hstack>
                                <Image
                                  src={
                                    achievement.image ||
                                    achievement.game?.thumbnail ||
                                    "/images/D2J_Icon.png"
                                  }
                                  width={48}
                                  height={48}
                                  alt="Achievement"
                                  className="rounded-xl w-12 h-12 object-cover"
                                />
                                <Vstack align="start" gap={0}>
                                  <Text color="text">{achievement.name}</Text>
                                  <Text color="textFaded" size="xs">
                                    {achievement.description}
                                  </Text>
                                  <Hstack>
                                    <Image
                                      src={
                                        achievement.game?.thumbnail ||
                                        "/images/D2J_Icon.png"
                                      }
                                      alt="Game thumbnail"
                                      width={18}
                                      height={10}
                                      className="rounded-lg w-[18px] h-[10px] object-cover"
                                    />
                                    <Text color="textFaded" size="xs">
                                      {achievement.game?.name}
                                    </Text>
                                  </Hstack>
                                  <Text size="xs" style={{ color: style.text }}>
                                    {tier === "Default" ? "" : `${tier} - `}
                                    <span>{pct.toFixed(1)}</span>% of users
                                    achieved
                                  </Text>
                                </Vstack>
                              </Hstack>
                            </Vstack>
                          }
                        >
                          <a href={`/g/${achievement.game.slug}`}>
                            <div
                              className="rounded-xl p-1"
                              style={{
                                backgroundColor: colors.base,
                                borderWidth: 2,
                                borderStyle: "solid",
                                borderColor: style.border,
                                boxShadow: style.glow,
                              }}
                            >
                              <Image
                                src={
                                  achievement.image ||
                                  achievement.game?.thumbnail ||
                                  "/images/D2J_Icon.png"
                                }
                                width={48}
                                height={48}
                                alt="Achievement"
                                className="rounded-lg w-12 h-12 object-cover"
                              />
                            </div>
                          </a>
                        </Tooltip>

                        {tier !== "Default" ? (
                          <div
                            className="absolute -top-1 -right-1 px-1 py-0.5 rounded-md text-[10px]"
                            style={{
                              backgroundColor: colors.mantle,
                              color: style.text,
                              border: `1px solid ${style.border}`,
                            }}
                          >
                            {tier}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Section>
          ) : null}

          {isOwner ? (
            <Section
              title="Share Your Recap"
              subtitle="Make this page public so other people can open and share it"
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
              {ownerGame ? (
                <>
                  <Hstack wrap className="gap-2">
                    <Text size="xl" weight="bold">
                      Post-jam refinement starts now
                    </Text>
                  </Hstack>
                  <Text color="textFaded">
                    Check what people liked and didn't like about the game and
                    go through and make improvements based on how you want to
                    improve it! There is now a 2 week optional period you can
                    use to work more on your game as well as creating materials
                    and pages to have the content shown in various places
                    outside the jam and then afterwards there will be another
                    optional 2 week period to go through and play updated
                    games!
                  </Text>
                  <Text color="textFaded">
                    The site will be updated to help provide marketing, and
                    outside the jam help in terms of where to post things
                    during the two weeks!
                  </Text>
                </>
              ) : null}
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
