"use client";
import { getResultsGradient } from "@/helpers/ratingColor";
import { RatingRadarShape } from "@/components/RatingRadarShape";
import { RatingRadarLabel } from "@/components/RatingRadarLabel";
import { useEmojis } from "@/providers/useEmojis";
import { buildRecapShareDraft } from "@/helpers/recapShare";
import { openSharedPostDraft } from "@/helpers/shareToPost";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "@/compat/next-image";
import { usePathname, useRouter, useSearchParams } from "@/compat/next-navigation";
import { useTranslations } from "@/compat/next-intl";
import {
  addToast,
  Avatar,
  Button,

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
import { useTheme } from "@/providers/useSiteTheme";
import { useCurrentJam, useJams, useSelf, useRecapUser } from "@/hooks/queries";
import { getGame, getResults } from "@/requests/game";
import { getTrack, getTrackResults } from "@/requests/track";
import { getUserGamesForJam } from "./userGames";
import { getJamRecapScores } from "./scores";
import { pickRecapJamId } from "./selection";
import { uniqueRecapWords, loadRecapComments } from "./words";
import { getCommentReplies } from "@/requests/comment";
import type { CommentType } from "@/types/CommentType";
import { getRecapVisibility, updateRecapVisibility } from "@/requests/recap";
import { unwrapItem } from "@/requests/helpers";
import { getSelectedGamePage, materializeGamePage } from "@/helpers/gamePages";
import { getJamUrlValue } from "@/helpers/jamUrl";
import type { AchievementType } from "@/types/AchievementType";
import { GameCard } from "@/components/gamecard";
import SidebarSong from "@/components/sidebar/SidebarSong";
import RatingStars from "@/components/RatingStars";
import RecapLayout from "./RecapLayout";
import NextJamInvitation from "./NextJamInvitation";
import { getEarnedRecapScores } from "./earnedScores";
import { formatRecentScore } from "@/helpers/scoreDisplay";
import type { GameType } from "@/types/GameType";
import type { GameResultType } from "@/types/GameResultType";
import type { JamType } from "@/types/JamType";
import type { ReactionType } from "@/types/ReactionType";
import type { TrackResultType } from "@/types/TrackResultType";
import type { TrackType } from "@/types/TrackType";

type RecapProps = {
  targetUserSlug?: string;
  preview?: boolean;
};

type VisibilityState = {
  canPreview?: boolean;
  jamId: number | null;
  isPublic: boolean;
  canEdit: boolean;
  sharePath: string | null;
};

type RecapDataState = {
  gameDetail: GameType | null;
  gameDetails: GameType[];
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

const RARITY_ORDER: Record<RarityTier, number> = {
  Abyssal: 0,
  Diamond: 1,
  Gold: 2,
  Silver: 3,
  Bronze: 4,
  Default: 5,
};

type WordCloudEntry = {
  key: string;
  label: string;
  count: number;
  image?: string;
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

function flattenCommentContents(
  comments: Array<any> | undefined,
  excludedAuthorIds?: Set<number>,
): string[] {
  if (!Array.isArray(comments)) return [];

  const output: string[] = [];
  const stack = [...comments];
  const seen = new Set<number | string>();

  while (stack.length > 0) {
    const comment = stack.pop();
    if (!comment) continue;
    if (comment.id != null && seen.has(comment.id)) continue;
    if (comment.id != null) seen.add(comment.id);
    if (comment.deletedAt || comment.removedAt) continue;
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

function getTopWords(
  contents: string[],
  emojiMap?: Map<string, { image: string; label: string }>,
  limit = 24,
) {
  const counts = new Map<string, WordCloudEntry>();

  contents.forEach((content) => {
    uniqueRecapWords(content).forEach((token) => {
        const normalized = token.toLowerCase();

        if (
          normalized.startsWith(":") &&
          normalized.endsWith(":") &&
          emojiMap?.has(normalized)
        ) {
          const emoji = emojiMap.get(normalized)!;
          const existing = counts.get(normalized);
          counts.set(normalized, {
            key: normalized,
            label: emoji.label,
            image: emoji.image,
            count: (existing?.count ?? 0) + 1,
          });
          return;
        }

        const normalizedWord = normalized.replace(/^'+|'+$/g, "");
        if (normalizedWord.length < 4) return;
        if (STOP_WORDS.has(normalizedWord.replace(/'/g, ""))) return;

        const existing = counts.get(normalizedWord);
        counts.set(normalizedWord, {
          key: normalizedWord,
          label: normalizedWord,
          count: (existing?.count ?? 0) + 1,
        });
      });
  });

  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit)
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
  if (!Number.isFinite(percentile) || percentile <= 0 || percentile > 50) return null;
  return `Top ${Math.max(1, Math.round(percentile)).toLocaleString()}%`;
}

function safeCompareNames(a?: string | null, b?: string | null) {
  return String(a ?? "").localeCompare(String(b ?? ""));
}

function buildPlacementPoolKey(group: string | null | undefined, key: string) {
  return `${group ?? "UNKNOWN"}::${key}`;
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
  if (group === "EXTRA") return [];

  return scoreEntries.flatMap((entry) => {
    if (entry.placement < 1) return [];

    const chips = [{
      key: `${entry.key}-placement`,
      categoryKey: entry.key,
      label: `#${entry.placement}`,
      detail: entry.label,
    }];

    const total =
      categoryPlacementTotals.get(buildPlacementPoolKey(group, entry.key)) ?? 0;
    if (total <= 0) return chips;

    const percentile = (entry.placement / total) * 100;
    const percentileLabel = getPercentileLabel(percentile);
    if (!percentileLabel) return chips;

    chips.push({
      key: `${entry.key}-percentile`,
      categoryKey: entry.key,
      label: percentileLabel,
      detail: entry.label,
    });

    return chips;
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
  if (percentile <= 25) {
    return `${getPercentileLabel(percentile)} in ${entry.label}`;
  }

  return null;
}

function getUserGameForJam(user: any, jamId: number) {
  return getUserGamesForJam(user, jamId)[0] ?? null;
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

function getTrackRatingJamId(rating: any) {
  return rating.track?.game?.jamId ?? rating.track?.gamePage?.game?.jamId;
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
    <div className="w-32 sm:w-40 text-center">
      <Vstack align="center" gap={2}>
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
    </div>
  );
}

function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} data-recap-section={title} tabIndex={-1} className="w-full">
      <Vstack align="start" gap={6}>
        <Vstack align="center" gap={2} className="w-full text-center">
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
    </section>
  );
}

function WordCloud({
  words,
  colors,
}: {
  words: WordCloudEntry[];
  colors: Record<string, string>;
}) {
  if (words.length === 0) {
    return null;
  }

  const uiText = useUiTranslations();
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
          const imageSize = 28 + scale * 30;

          return (
            <span
              key={entry.key}
              className="inline-flex items-center rounded-full px-2 py-1 font-semibold tracking-tight transition-transform duration-200 hover:-translate-y-0.5"
              style={{
                fontSize: `${fontSize}rem`,
                color,
                transform: `rotate(${rotation}deg)`,
                textShadow: `0 0 18px ${color}22`,
              }}
            >
              {entry.image ? (
                <Image
                  src={entry.image}
                  alt={uiText(entry.label)}
                  width={imageSize}
                  height={imageSize}
                  className="object-contain"
                />
              ) : (
                entry.label
              )}
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
  const uiText = useUiTranslations();
  return (
    <div
      className="py-4"
      style={{
        background: `linear-gradient(135deg, ${accent}18, transparent 60%)`,
        borderColor: `${accent}33`,
      }}
    >
      <Vstack align="start" gap={3}>
        <Text size="sm" color="textFaded">
          {title}
        </Text>
        <div className="flex w-full items-center gap-3">
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
        <RatingStars value={stars} color={accent} size={20} className="ml-auto" />
        </div>
        <Text size="sm" color="textFaded">
           {uiText("AppStrings.Stars")} </Text>
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
    </div>
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
  const uiText = t;
  return (track.categoryAverages ?? [])
    .filter((entry) => entry.placement >= 1 && entry.placement <= 3)
    .map((entry) => ({
      placement: entry.placement,
      label: uiText("AppStrings.Value0InValue1", { value0: ordinal(entry.placement), value1: formatScoreCategoryName(entry.categoryName, t) }),
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
  id,
  title,
  subtitle,
}: {
  id: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section id={id} data-recap-section={title} data-recap-group="true" tabIndex={-1} className="w-full">
      <Vstack align="center" gap={3} className="text-center">
        <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
          {title}
        </h2>
        {subtitle ? (
          <Text size="sm" color="textFaded">
            {subtitle}
          </Text>
        ) : null}
      </Vstack>
    </section>
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
  const uiText = useUiTranslations();
  return (
    <a href={`/g/${game.slug}`} className="block h-full">
      <div
        className="relative flex h-full flex-col overflow-hidden rounded-[0.625rem] border transition-colors duration-300"
        style={{
          backgroundColor: colors.mantle,
          borderColor: `color-mix(in srgb, ${colors.text} 5%, ${colors.mantle})`,
          color: colors.text,
        }}
      >
        <div className="relative aspect-[9/5] w-full shrink-0 overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.7)]">
          <Image
            alt={uiText("AppStrings.Value0SThumbnail", { value0: game.name })}
            fill
            className="object-cover shadow-inner"
            src={game.thumbnail || "/images/game-thumbnail.png"}
          />
        </div>
        <Vstack
          align="start"
          gap={2}
          className="border-t-1 w-full flex-1 p-2 pb-4 px-4"
          style={{
            borderColor: `color-mix(in srgb, ${colors.text} 5%, ${colors.mantle})`,
            backgroundColor: colors.mantle,
          }}
        >
          <Vstack align="start" gap={0} className="min-w-0 w-full">
            <Text size="2xl" color="text" className="line-clamp-1">
              {game.name}
            </Text>
            <Text size="sm" color="textFaded" className="line-clamp-1">
              {game.short?.trim() || "General.NoDescription"}
            </Text>
          </Vstack>
          <Vstack align="start" gap={2} className="w-full mt-2">
            {placements.slice(0, 3).map((placement) => (
              <Chip
                key={`${game.id}-${uiText(placement.label)}`}
              >
                <span style={gradientTextStyle(`linear-gradient(90deg, ${colors.yellow}, ${colors.red})`, colors.red)}>{uiText(placement.label)}</span>
              </Chip>
            ))}
          </Vstack>
        </Vstack>
      </div>
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
  const uiText = useUiTranslations();
  const { playItem } = useMusic();

  return (
    <div className="h-full w-fit min-w-0 max-w-sm py-4">
      <Vstack align="start" gap={4}>
        <Hstack className="items-start gap-3 w-full">
          <Image
            src={
              track.game?.soundtrackThumbnail ||
              track.game?.thumbnail ||
              "/images/game-thumbnail.png"
            }
            width={64}
            height={64}
            className="h-16 w-16 shrink-0 rounded object-cover"
            alt={uiText("AppStrings.SongThumbnail")}
          />
          <Vstack align="start" gap={0}>
            <a href={`/m/${track.slug}`}>
              <Text weight="bold">{track.name}</Text>
            </a>
            <Text size="sm" color="textFaded">
              {track.game?.name ?? uiText("AppStrings.UnknownGame")}
            </Text>
            <Text size="sm" color="textFaded">
              {track.composer?.name || track.composer?.slug || uiText("AppStrings.Unknown")}
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
                thumbnail:
                  track.game?.soundtrackThumbnail ||
                  track.game?.thumbnail ||
                  "/images/game-thumbnail.png",
                game: track.game ?? { name: "Unknown game", slug: "" },
                song: track.url,
                loudnessGainDb: track.loudnessGainDb,
              })
            }
          >
             {uiText("AppStrings.Play")} </Button>
          <Button href={`/m/${track.slug}`} icon="music">
             {uiText("AppStrings.OpenTrackPage")} </Button>
        </Hstack>

        <Vstack align="start" gap={2} className="w-full">
          {placements.slice(0, 3).map((placement) => (
            <Chip
              key={`${track.id}-${uiText(placement.label)}`}
            >
              <span style={gradientTextStyle(`linear-gradient(90deg, ${colors.pink}, ${colors.purple})`, colors.pink)}>{uiText(placement.label)}</span>
            </Chip>
          ))}
        </Vstack>
      </Vstack>
    </div>
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
  const uiText = useUiTranslations();
  const { playItem } = useMusic();
  const { gradient, first } = getResultsGradient(
    displayEntry.placement,
    displayEntry.averageScore,
    colors,
  );

  return (
    <div className="h-full py-4">
      <Vstack align="start" gap={4} className="w-full">
        <Hstack className="items-start gap-3 w-full">
          <Image
            src={
              track.game?.soundtrackThumbnail ||
              track.game?.thumbnail ||
              "/images/game-thumbnail.png"
            }
            width={64}
            height={64}
            className="h-16 w-16 shrink-0 rounded object-cover"
            alt={uiText("AppStrings.SongThumbnail")}
          />
          <Vstack align="start" gap={0} className="min-w-0">
            <a href={`/m/${track.slug}`}>
              <Text weight="bold">{track.name}</Text>
            </a>
            <Text size="sm" color="textFaded">
              {track.game?.name ?? uiText("AppStrings.UnknownGame")}
            </Text>
            <Text size="sm" color="textFaded">
              {track.composer?.name || track.composer?.slug || uiText("AppStrings.Unknown")}
            </Text>
          </Vstack>
        </Hstack>

        <Vstack align="start" gap={1} className="w-full">
          <div className="flex w-full items-center gap-3">
          <span
            className="text-3xl font-bold leading-none"
            style={gradientTextStyle(gradient, first)}
          >
            {(displayEntry.averageScore / 2).toFixed(2)}
          </span>
          <RatingStars value={displayEntry.averageScore / 2} color={first} size={20} className="ml-auto" />
          </div>
          <Text color="textFaded">{uiText("AppStrings.Stars")}</Text>
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
                thumbnail:
                  track.game?.soundtrackThumbnail ||
                  track.game?.thumbnail ||
                  "/images/game-thumbnail.png",
                game: track.game ?? { name: "Unknown game", slug: "" },
                song: track.url,
                loudnessGainDb: track.loudnessGainDb,
              })
            }
          >
             {uiText("AppStrings.Play")} </Button>
          <Button href={`/m/${track.slug}`} icon="music">
             {uiText("AppStrings.OpenTrackPage")} </Button>
        </Hstack>

        {notableChips.length > 0 ? (
          <div className="flex flex-wrap gap-2 w-full">
            {notableChips.map((chip) => (
              <Chip key={`${track.id}-${chip.key}`}>
                <span style={{ color: colors.blue }}>{uiText(chip.label)}</span>
              </Chip>
            ))}
          </div>
        ) : null}
      </Vstack>
    </div>
  );
}

export default function Recap({ targetUserSlug, preview = false }: RecapProps) {
  const [sharingRecap, setSharingRecap] = useState(false);
  const { emojis } = useEmojis();
  const uiText = useUiTranslations();
  const recapText = useTranslations("Recap");
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { colors } = useTheme();
  const { data: self, isLoading: selfLoading } = useSelf();
  const effectiveSlug = targetUserSlug ?? self?.slug ?? "";
  const {
    data: listedJams = [],
    isLoading: jamsLoading,

  } = useJams();

  const { data: currentJamResponse, isLoading: currentJamLoading } = useCurrentJam();
  const currentJam = currentJamResponse?.jam;
  const jams = useMemo(
    () => {
      const trackedJams = listedJams.filter((jam) => !jam.sourcePlatform);
      return currentJam && !currentJam.sourcePlatform && !trackedJams.some((jam) => jam.id === currentJam.id)
        ? [currentJam, ...trackedJams]
        : trackedJams;
    },
    [listedJams, currentJam],
  );
  const selectedJamId = pickRecapJamId(searchParams.get("jam"), jams, currentJam?.id);
  const { data: user, isLoading: userLoading } = useRecapUser(
    effectiveSlug,
    selectedJamId,
    !!effectiveSlug && selectedJamId != null,
  );
  const [visibility, setVisibility] = useState<VisibilityState | null>(null);
  const [loadingVisibility, setLoadingVisibility] = useState(false);
  const [visibilityFor, setVisibilityFor] = useState("");
  const [visibilityError, setVisibilityError] = useState(false);
  const [loadedFor, setLoadedFor] = useState("");
  const [retry, setRetry] = useState(0);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingSupplementalData, setLoadingSupplementalData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recapData, setRecapData] = useState<RecapDataState>({
    gameDetail: null,
        gameDetails: [],
    trackDetails: [],
    gameResults: [],
    trackResults: [],
  });

  const isOwner = targetUserSlug
    ? self?.slug === effectiveSlug
    : Boolean(self?.slug);

  useEffect(() => {
    if (!effectiveSlug || !selectedJamId) return;

    let active = true;
    setLoadingVisibility(true);
    setVisibilityError(false);
    setVisibility(null);

    getRecapVisibility(effectiveSlug, selectedJamId, preview)
      .then(async (response) => {
        if (!response.ok) throw new Error("Recap visibility request failed");
        const json = await response.json();
        if (!json.data) throw new Error("Missing recap visibility");
        if (!active) return;
        setVisibility(json.data);
        setVisibilityFor(`${selectedJamId}:${effectiveSlug}`);
      })
      .catch(() => {
        if (!active) return;
        setVisibility(null);
        setVisibilityError(true);
      })
      .finally(() => {
        if (active) {
          setLoadingVisibility(false);
        }
      });

    return () => {
      active = false;
    };
  }, [effectiveSlug, selectedJamId, retry, preview]);

  const canPreview = preview && self?.admin === true && visibility?.canPreview === true;

  const canReadRecap =
    !effectiveSlug ||
    (visibilityFor === `${selectedJamId}:${effectiveSlug}` &&
      !!visibility &&
      !loadingVisibility &&
      (isOwner || canPreview || !!visibility.isPublic));

  useEffect(() => {
    if (
      !canReadRecap ||
      !selectedJamId ||
      selfLoading ||
      (effectiveSlug && userLoading)
    )
      return;
    if (
      effectiveSlug &&
      (loadingVisibility ||
        visibilityFor !== `${selectedJamId}:${effectiveSlug}` ||
        !visibility)
    )
      return;
    if (targetUserSlug && !isOwner && !canPreview && !visibility?.isPublic) return;

    let active = true;

    async function loadRecap() {
      const jamId = selectedJamId;
      if (jamId == null) return;
      setLoadingData(true);
      setLoadingSupplementalData(false);
      setError(null);
      setLoadedFor(`${jamId}:${effectiveSlug}`);
      setRecapData({
        gameDetail: null,
        gameDetails: [],
        trackDetails: [],
        gameResults: [],
        trackResults: [],
      });

      try {
        const ownerGames = getUserGamesForJam(user, jamId);

        async function read<T>(
          request: () => Promise<Response>,
          fallback: T,
        ): Promise<T> {
          try {
            const response = await request();
            if (!response.ok) throw new Error(`Recap request failed (${response.status}): ${response.url}`);
            return (await response.json()) as T;
          } catch (requestError) {
            console.warn(requestError);
            if (active) setError(uiText("AppStrings.SomeRecapDetailsCouldNotLoad"));
            return fallback;
          }
        }
        const rawGameDetails = (await Promise.all(ownerGames.map(async (game) =>
          unwrapItem<GameType>(await read(() => getGame(game.slug, true, "JAM"), null)),
        ))).filter((game): game is GameType => Boolean(game));
        const gameDetails = rawGameDetails.map((game) => {
          const page = getSelectedGamePage(game, "JAM");
          return page ? materializeGamePage(game, page) : game;
        });
        if (!active) return;

        setRecapData({
          gameDetail: gameDetails[0] ?? null,
          gameDetails,
          trackDetails: [],
          gameResults: [],
          trackResults: [],
        });
        setLoadingData(false);
        setLoadingSupplementalData(true);

        const [trackDetails, regularGames, odaGames, regularTracks, odaTracks] =
          await Promise.all([
            Promise.all(
              [...new Map(gameDetails.flatMap((game) => game.tracks ?? []).map((track) => [track.id, track])).values()].map(async (track) =>
                unwrapItem<TrackType>(
                  await read(() => getTrack(track.slug, "JAM"), null),
                ),
              ),
            ),
            read(() => getResults("REGULAR", "GAME", "OVERALL", String(jamId), canPreview, true), []),
            read(() => getResults("ODA", "GAME", "OVERALL", String(jamId), canPreview, true), []),
            read(() => getTrackResults(String(jamId), canPreview, "REGULAR", true), []),
            read(() => getTrackResults(String(jamId), canPreview, "ODA", true), []),
          ]);
        const regularGameResults =
          unwrapArrayResponse<GameResultType>(regularGames);
        const odaGameResults = unwrapArrayResponse<GameResultType>(odaGames);
        const regularTrackResults =
          unwrapArrayResponse<TrackResultType>(regularTracks);
        const odaTrackResults = unwrapArrayResponse<TrackResultType>(odaTracks);

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

        const validTracks = trackDetails.filter((track): track is TrackType => Boolean(track));
        if (!active) return;

        setRecapData({
          gameDetail: gameDetails[0] ?? null,
          gameDetails,
          trackDetails: validTracks,
          gameResults,
          trackResults,
        });
        setLoadingData(false);

        const readReplies = async (id: number) => unwrapArrayResponse<CommentType>(
          await read(() => getCommentReplies(id), []),
        );
        const [completeGames, completeTracks] = await Promise.all([
          Promise.all(gameDetails.map(async (game, index) => ({
            ...game,
            comments: await loadRecapComments([
              ...(game.comments ?? []), ...(rawGameDetails[index].comments ?? []),
            ], readReplies),
          }))),
          Promise.all(validTracks.map(async (track) => ({
            ...track,
            comments: await loadRecapComments(track.comments ?? [], readReplies),
          }))),
        ]);
        if (!active) return;

        setRecapData({
          gameDetail: completeGames[0] ?? null,
          gameDetails: completeGames,
          trackDetails: completeTracks,
          gameResults,
          trackResults,
        });
      } catch (loadError) {
        console.error(loadError);
        if (!active) return;
        setError(uiText("AppStrings.FailedToLoadJamRecap"));
      } finally {
        if (active) {
          setLoadingData(false);
          setLoadingSupplementalData(false);
        }
      }
    }

    loadRecap();

    return () => {
      active = false;
    };
  }, [
    isOwner,
    canPreview,
    canReadRecap,
    selectedJamId,
    targetUserSlug,
    user,
    visibilityFor,
    effectiveSlug,
    selfLoading,
    userLoading,
    retry,
    uiText,
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
        recapData.gameDetails.flatMap((game) => game.team?.users ?? [])
          .map((member: any) => member?.id)
          .filter((value: unknown): value is number => Number.isInteger(value)),
      ),
    [recapData.gameDetails],
  );

  const ownerGameEmojiMap = useMemo(
    () =>
      new Map(
        [...emojis, ...recapData.gameDetails.flatMap((game) => game.gameEmotes ?? [])]
          .filter(
            (
              reaction: ReactionType | null | undefined,
            ): reaction is ReactionType =>
              Boolean(reaction?.slug && reaction?.image),
          )
          .map((reaction) => [
            `:${reaction.slug.toLowerCase()}:`,
            {
              image: reaction.image,
              label: uiText("AppStrings.Value03", { value0: reaction.slug }),
            },
          ]),
      ),
    [emojis, recapData.gameDetails],
  );

  const gameCommentWords = useMemo(
    () =>
      getTopWords(
        flattenCommentContents(
          recapData.gameDetails.flatMap((game) => game.comments ?? []),
          ownerTeamUserIds,
        ),
        ownerGameEmojiMap,
      ),
    [ownerGameEmojiMap, ownerTeamUserIds, recapData.gameDetails],
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
          return safeCompareNames(a.game?.name, b.game?.name);
        }),
    [recapData.gameResults, t],
  );

  const musicCommentWords = useMemo(() => {
    return getTopWords(
      recapData.trackDetails.flatMap((track) =>
        [
          ...flattenCommentContents(track.comments, ownerTeamUserIds),
          ...flattenCommentContents(track.timestampComments, ownerTeamUserIds),
        ],
      ),
      ownerGameEmojiMap,
    );
  }, [ownerGameEmojiMap, ownerTeamUserIds, recapData.trackDetails]);
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
          return safeCompareNames(a.track?.name, b.track?.name);
        }),
    [recapData.trackResults, t],
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
          totals.set(key, current + 1);
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
          totals.set(key, current + 1);
        }
      }
    }

    return totals;
  }, [recapData.trackResults]);

  const gameScoreSummaries = recapData.gameDetails.map((game) => {
    const entries = getScoreEntries(getJamRecapScores(game), t).sort(compareGameScoreEntries);
    return {
      game, entries,
      chips: getNotableGameScoreChips(entries, gameCategoryPlacementTotals, game.category),
      chart: entries.map((entry) => ({ subject: entry.label, ranked: entry.averageScore / 2,
        all: entry.averageUnrankedScore / 2, placement: entry.placement, fullMark: 5 })),
    };
  });

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
        .map((achievement: AchievementType) => {
          const fullAchievement = achievement.game?.achievements?.find(
            (entry) => entry.id === achievement.id,
          ) ?? achievement;
          const { tier, pct } = getRarityTier(
            achievement.rarityEarnedUsers ?? fullAchievement.users?.length ?? 0,
            achievement.rarityEngagedUsers ?? engagedUserIdsForGame(achievement.game).size,
          );
          return { achievement, tier, pct };
        })
        .sort((a, b) =>
          RARITY_ORDER[a.tier] - RARITY_ORDER[b.tier] ||
          a.pct - b.pct ||
          b.achievement.id - a.achievement.id,
        ),
    [selectedJamId, user?.achievements],
  );

  const recommendedGamesForJam = useMemo(
    () =>
      (user?.recommendedGames ?? []).filter(
        (game) =>
          game.jam?.id === selectedJamId &&
          (game.pageVersion ?? "JAM") === "JAM",
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

  const gameRecommendations = getUserGamesForJam(user, selectedJamId ?? -1).map((game) => {
    const favorites = user?.favoriteGameCounts?.find((entry) => entry.gameId === game.id && (entry.pageVersion ?? "JAM") === "JAM");
    return { game, count: favorites?.count ?? 0, users: favorites?.users ?? [] };
  }).filter(({ count }) => count > 1);

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
      .filter((entry) => entry.count > 0);
  }, [recapData.trackDetails, user?.favoriteTrackCounts]);

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
        .filter((rating: any) => getTrackRatingJamId(rating) === selectedJamId)
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
          label: uiText("AppStrings.GamesCommentedOn"),
          value: recapStats.commentsOnGame,
        },
        {
          key: "commentsOnMusic",
          icon: <Headphones size={18} color={colors.blue} />,
          label: uiText("AppStrings.MusicCommentedOn"),
          value: recapStats.commentsOnMusic,
        },
        {
          key: "gamesRated",
          icon: <Star size={18} color={colors.green} />,
          label: uiText("AppStrings.GamesRated"),
          value: recapStats.gamesRated,
        },
        {
          key: "tracksRated",
          icon: <Sparkle size={18} color={colors.purple} />,
          label: uiText("AppStrings.TracksRated"),
          value: recapStats.tracksRated,
        },
      ].filter((stat) => stat.value > 0),
    [colors.blue, colors.green, colors.purple, colors.yellow, recapStats],
  );

  const handleJamChange = (jamValue: string) => {
    const matchingJam = jams.find(
      (jam) => getJamUrlValue(jam) === jamValue || String(jam.id) === jamValue,
    );
    const nextJamId = matchingJam?.id ?? Number(jamValue);
    if (!Number.isInteger(nextJamId)) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("jam", getJamUrlValue(matchingJam) || String(nextJamId));
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleVisibilityChange = async (nextValue: boolean) => {
    if (preview) return;
    if (!selectedJamId) return;
    setSavingVisibility(true);
    try {
      const response = await updateRecapVisibility(selectedJamId, nextValue);
      const json = await response.json();
      if (!response.ok) {
        addToast({
          title:
            json.message ?? uiText("AppStrings.FailedToUpdateRecapVisibility"),
        });
        return;
      }
      setVisibility(json.data ?? null);
      addToast({
        title: nextValue
          ? uiText("AppStrings.RecapIsNowPublic")
          : uiText("AppStrings.RecapIsNowPrivate"),
      });
    } catch {
      addToast({ title: uiText("AppStrings.FailedToUpdateRecapVisibility") });
    } finally {
      setSavingVisibility(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!visibility?.sharePath || typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${visibility.sharePath}`,
      );
      addToast({ title: uiText("AppStrings.RecapLinkCopied") });
    } catch {
      addToast({ title: recapText("CopyFailed") });
    }
  };

  const hasGamesSection =
    gameScoreSummaries.some(({ entries }) => entries.length > 0) ||
    gameCommentWords.length > 0 ||
    recommendedGamesForJam.length > 0 ||
    gameRecommendations.length > 0 ||
    topGamesInJam.length > 0;

  const hasMusicSection =
    trackScoreSummaries.length > 0 ||
    (recapData.trackDetails.length > 0 && musicCommentWords.length > 0) ||
    recommendedTracksForJam.length > 0 ||
    favoriteTracksForJam.length > 0 ||
    topTracksInJam.length > 0;

  const earnedScores = getEarnedRecapScores(user?.scores ?? [], selectedJamId);
  const hasScoresSection = earnedAchievements.length > 0 || earnedScores.length > 0;

  const resultsHref = `/results?jam=${getJamUrlValue(selectedJam) || selectedJamId}`;
  const currentData = loadedFor === `${selectedJamId}:${effectiveSlug}`;

  const handleSharePost = async () => {
    if (preview || !isOwner || !currentData || loadingData || loadingSupplementalData || sharingRecap) return;
    setSharingRecap(true);
    try {
      const stats = visibleStatCards.map(({ label, value }) => ({ label, value }));
      if (earnedAchievements.length) stats.push({ label: uiText("AppStrings.AchievementsEarned"), value: earnedAchievements.length });
      if (earnedScores.length) stats.push({ label: uiText("AppStrings.ScoresEarned"), value: earnedScores.length });
      openSharedPostDraft(await buildRecapShareDraft({
        jamName: selectedJam?.name ?? "Game jam",
        userName: user?.name ?? effectiveSlug,
        stats,
        games: gameScoreSummaries.map(({ game, entries }) => ({ name: game.name, ratings: entries })),
        music: trackScoreSummaries.map(({ track, displayEntry }) => ({ name: track.name, ratings: [{ ...displayEntry, label: track.name }] })),
        gameWords: gameCommentWords,
        musicWords: musicCommentWords,
        publicUrl: visibility?.isPublic && visibility.sharePath ? new URL(visibility.sharePath, window.location.origin).href : undefined,
      }));
    } catch {
      addToast({ title: uiText("AppStrings.CouldNotCreateRecapPost") });
    } finally {
      setSharingRecap(false);
    }
  };

  if (selfLoading || (userLoading && !!effectiveSlug) || jamsLoading || currentJamLoading)
    return <p role="status">{uiText("AppStrings.LoadingRecap")}</p>;
  if (jams.length === 0)
    return <p role="status">{recapText("NoJams")}</p>;
  if (targetUserSlug && !user)
    return <p role="alert">{uiText("AppStrings.CouldNotLoadUserRecap")}</p>;
  if (!selectedJamId)
    return <p role="status">{uiText("AppStrings.LoadingRecap")}</p>;
  if (
    effectiveSlug &&
    (!visibility ||
      visibilityFor !== `${selectedJamId}:${effectiveSlug}` ||
      loadingVisibility)
  ) {
    return (
      <div className="space-y-4" role={visibilityError ? "alert" : "status"}>
        <p>
          {visibilityError
            ? uiText("AppStrings.FailedToLoadJamRecap")
            : uiText("AppStrings.LoadingRecap")}
        </p>
        {visibilityError && (
          <Button onClick={() => setRetry((value) => value + 1)}>
            {recapText("Retry")}
          </Button>
        )}
      </div>
    );
  }
  if (targetUserSlug && !isOwner && !canPreview && !visibility?.isPublic)
    return (
      <div className="space-y-3 py-12">
        <h1 className="text-3xl font-bold">
          {uiText("AppStrings.ThisRecapIsPrivate")}
        </h1>
        <Button href={resultsHref}>
          {uiText("AppStrings.ViewFullResults")}
        </Button>
      </div>
    );
  if (!currentData)
    return (
      <div
        role="status"
        className="flex min-h-[55vh] items-center justify-center"
      >
        {uiText("AppStrings.LoadingRecapData")}
      </div>
    );

  return (
    <RecapLayout>
      <section id="overview" data-recap-section={uiText("AppStrings.JamRecap")} data-recap-group="true" tabIndex={-1}><div>
          <Vstack align="center" gap={6} className="text-center">
            <Vstack align="center" gap={5} className="w-full">
              <Vstack align="center" gap={2}>
                <Text size="4xl" weight="bold">
                   {uiText("AppStrings.JamRecap")} </Text>
                <Text color="textFaded">
                  {user?.name ?? uiText("Navbar.Brand.Name")}
                  {selectedJam ? ` ${selectedJam.name}` : ""}
                </Text>
              </Vstack>
              <Hstack wrap className="justify-center gap-2">
                <Dropdown
                  onSelect={(key) => handleJamChange(String(key))}
                  trigger={
                    <Button size="sm" icon="calendar">
                      {selectedJam?.name ?? uiText("AppStrings.SelectJam")}
                    </Button>
                  }
                >
                  {jams.map((jam) => (
                    <Dropdown.Item key={jam.id} value={getJamUrlValue(jam)}>
                      {jam.name}
                    </Dropdown.Item>
                  ))}
                </Dropdown>
                <Button
                  size="sm"
                  href={`/results?jam=${getJamUrlValue(selectedJam) || selectedJamId}`}
                  icon="trophy"
                >
                   {uiText("AppStrings.ViewFullResults")} </Button>
              </Hstack>
            </Vstack>

            <Text color="textFaded">
              {user
                ? uiText("AppStrings.ARecapOfWhatHappenedRelatingToYouThisGameJam")
                : uiText("AppStrings.ARecapOfStandoutThingsFromThisGameJam")}
            </Text>

            {visibleStatCards.length > 0 ? (
              <div className="flex w-full flex-wrap justify-center gap-x-8 gap-y-6 md:gap-x-12">
                {visibleStatCards.map((stat) => (
                  <StatCard
                    key={stat.key}
                    icon={stat.icon}
                    label={uiText(stat.label)}
                    value={String(stat.value)}
                  />
                ))}
              </div>
            ) : null}
          </Vstack>
        </div>
      </section>

      {error ? (
        <div className="w-full flex flex-wrap items-center justify-center gap-3" role="status">
          <Text>{error}</Text>
          <Button onClick={() => setRetry((value) => value + 1)}>{recapText("Retry")}</Button>
        </div>
      ) : null}

      {loadingData || loadingSupplementalData ? (
        <div role="status">{uiText("AppStrings.LoadingRecapData")}</div>
      ) : null}

      {!loadingData ? (
        <>
          {hasGamesSection ? (
            <SectionHeaderCard
              id="games"
              title={uiText("Navbar.Games.Title")}
              subtitle={uiText("AppStrings.YourGameFavoritesAndStandoutJamEntries")}
            />
          ) : null}

          {gameScoreSummaries.filter(({ entries }) => entries.length > 0).map(({ game, entries, chips, chart }) => (
            <Section
              key={game.id}
              id={`game-ratings-${game.id}`}
              title={gameScoreSummaries.length > 1 ? game.name : uiText("AppStrings.HowYourGameLanded")}
              subtitle={uiText("AppStrings.TheStarRatingOfVariousAspectsOfYour")}
            >
              <Vstack align="start" gap={6} className="w-full">
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] gap-6 w-full items-start">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 xl:gap-x-16 gap-y-6">
                    {entries.map((entry) => {
                      const { gradient, first } = getResultsGradient(
                        entry.placement,
                        entry.averageScore,
                        colors,
                      );
                      const entryChips = chips.filter((chip) => chip.categoryKey === entry.key);

                      return (
                        <div key={entry.key} className="py-4">
                          <Vstack align="start" gap={3} className="w-full">
                            <Text color="textFaded">{uiText(entry.label)}</Text>
                            <div className="flex w-full items-center gap-3">
                            <span
                              className="text-3xl font-bold leading-none"
                              style={gradientTextStyle(gradient, first)}
                            >
                              {(entry.averageScore / 2).toFixed(2)}
                            </span>
                            <RatingStars value={entry.averageScore / 2} color={first} size={20} className="ml-auto" />
                            </div>
                            <Text color="textFaded">{uiText("AppStrings.Stars")}</Text>
                            {entryChips.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {entryChips.map((chip) => (
                                  <Chip key={chip.key}>
                                    <span style={{ color: colors.blue }}>{uiText(chip.label)}</span>
                                  </Chip>
                                ))}
                              </div>
                            ) : null}
                          </Vstack>
                        </div>
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
                          data={chart}
                          margin={{ top: 20, right: 70, bottom: 20, left: 70 }}
                        >
                          <PolarGrid stroke={colors.crust} />
                          <PolarAngleAxis
                            dataKey="subject"
                            tick={<RatingRadarLabel color={colors.textFaded} />}
                          />
                          <PolarRadiusAxis
                            domain={[0, 5]}
                            axisLine={false}
                            tick={false}
                          />
                          <Radar
                            name={game.category === "EXTRA" ? "All" : "Ranked"}
                            dataKey={game.category === "EXTRA" ? "all" : "ranked"}
                            shape={<RatingRadarShape colors={colors} />}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </Vstack>
                </div>
              </Vstack>
            </Section>
          ))}

          <div className={gameCommentWords.length > 0 ? "" : "hidden"}>
            <Section
              id="game-words"
              title={uiText("AppStrings.WordsPeopleUsed")}
              subtitle={uiText("AppStrings.TheMostCommonWordsInYourGameComments")}
            >
              <WordCloud words={gameCommentWords} colors={colors} />
            </Section>
          </div>

          {recommendedGamesForJam.length > 0 ? (
            <Section
              id="favorite-games"
              title={uiText("AppStrings.GamesYouEnjoyedMost")}
              subtitle={uiText("AppStrings.TheGamesThatEndedUpInYourFavorites")}
            >
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {recommendedGamesForJam.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </section>
            </Section>
          ) : null}

          {gameRecommendations.map(({ game, count, users }) => (
            <Section
              key={game.id}
              id={`game-recommendations-${game.id}`}
              title={uiText("AppStrings.YourGameWasRecommended")}
              subtitle={uiText("AppStrings.PeopleReallyEnjoyedYourGameAndHadIt")}
            >
              <Vstack align="center" gap={4} className="w-full text-center">
                <Vstack align="center" gap={1}>
                  <Text size="xl" weight="bold">
                    {count}{" "}
                    {count === 1 ? uiText("AppStrings.Person") : uiText("AppStrings.People")}
                  </Text>
                  <Text color="textFaded" size="sm">
                     {uiText("AppStrings.Had")}{" "}
                    <span style={{ color: colors.text }}>{game.name}</span>{" "}
                     {uiText("AppStrings.InTheirFavorites")} </Text>
                </Vstack>
                <FavoriteFacepile users={users} />
              </Vstack>
            </Section>
          ))}

          {topGamesInJam.length > 0 ? (
            <Section
              id="top-games"
              title={uiText("AppStrings.TopGamesInTheJam")}
              subtitle={uiText("AppStrings.GamesThatPlacedTop3InAtLeast")}
            >
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full auto-rows-fr">
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
              id="music"
              title={uiText("Navbar.Music.Title")}
              subtitle={uiText("AppStrings.YourSoundtrackHighlightsAndNotableTracks")}
            />
          ) : null}

          {trackScoreSummaries.length > 0 ? (
            <Section
              id="music-ratings"
              title={uiText("AppStrings.HowYourMusicLanded")}
              subtitle={uiText("AppStrings.YourTracksTheirStarRatingsAndThePlacements")}
            >
              <section className="grid w-full grid-cols-1 gap-y-8 md:grid-cols-4 md:gap-x-12 xl:gap-x-20 md:[&>*]:col-span-2 md:[&>:last-child:nth-child(odd)]:col-start-2">
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
              id="music-words"
              title={uiText("AppStrings.WordsPeopleUsedForYourMusic")}
              subtitle={uiText("AppStrings.TheMostCommonsWordsInYourMusicComments")}
            >
              <WordCloud words={musicCommentWords} colors={colors} />
            </Section>
          ) : null}

          {recommendedTracksForJam.length > 0 ? (
            <Section
              id="favorite-music"
              title={uiText("AppStrings.MusicYouEnjoyedMost")}
              subtitle={uiText("AppStrings.TheTracksThatEndedUpInYourFavorites")}
            >
              <section className="mx-auto flex w-full max-w-lg flex-col gap-4">
                {recommendedTracksForJam.map((track) => (
                  <SidebarSong
                    key={track.id}
                    slug={track.slug}
                    name={track.name}
                    artist={track.composer ?? { name: "Unknown", slug: "" }}
                    thumbnail={
                      track.game?.soundtrackThumbnail ||
                      track.game?.thumbnail ||
                      "/images/game-thumbnail.png"
                    }
                    game={
                      track.game
                        ? {
                            ...track.game,
                            thumbnail: track.game.thumbnail ?? undefined,
                          }
                        : { name: "Unknown game", slug: "" }
                    }
                    song={track.url}
                    loudnessGainDb={track.loudnessGainDb}
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
              id="music-recommendations"
              title={uiText("AppStrings.YourMusicWasRecommended")}
              subtitle={uiText("AppStrings.PeopleReallyEnjoyedYourMusicAndHadIt")}
            >
              <div className="flex flex-wrap justify-center gap-4 w-full">
                {favoriteTracksForJam.map(({ track, count, users }) => (
                    <Vstack
                      key={track.id}
                      align="center"
                      gap={4}
                      className="w-full text-center md:max-w-[420px]"
                    >
                      <Vstack align="center" gap={1}>
                        <Text size="xl" weight="bold">
                          {count}{" "}
                          {count === 1 ? uiText("AppStrings.Person") : uiText("AppStrings.People")}
                        </Text>
                        <Text color="textFaded" size="sm">
                          {uiText("AppStrings.Had")}{" "}
                          <a href={`/m/${track.slug}`} style={{ color: colors.text }}>{track.name}</a>{" "}
                          {uiText("AppStrings.InTheirFavorites")}
                        </Text>
                      </Vstack>
                      <FavoriteFacepile users={users} />
                    </Vstack>
                ))}
              </div>
            </Section>
          ) : null}

          {topTracksInJam.length > 0 ? (
            <Section
              id="top-music"
              title={uiText("AppStrings.TopMusicInTheJam")}
              subtitle={uiText("AppStrings.TracksThatPlacedTop3InAtLeast")}
            >
              <section className="mx-auto grid w-full max-w-4xl grid-cols-1 justify-items-center gap-x-12 gap-y-6 md:grid-cols-2">
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
              id="achievements"
              title={uiText("AppStrings.ScoresAndAchievements")}
              subtitle={uiText("AppStrings.ThingsYouAchievedInGamesThisJam")}
            />
          ) : null}

          {earnedAchievements.length > 0 ? (
            <Section
              id="earned-achievements"
              title={uiText("AppStrings.AchievementsYouEarned")}
              subtitle={uiText("AppStrings.TheAchievementsYouUnlockedDuringThisJam")}
            >
              <div className="flex w-full justify-center">
                <div className="flex flex-wrap justify-center gap-3 max-w-5xl">
                  {earnedAchievements.map(({ achievement, tier, pct }) => {
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
                                    "/images/game-thumbnail.png"
                                  }
                                  width={48}
                                  height={48}
                                  alt={uiText("AppStrings.Achievement")}
                                  className="rounded-xl w-12 h-12 object-cover"
                                />
                                <Vstack align="start" gap={0}>
                                  <Text color="text">{achievement.name}</Text>
                                  <Text color="textFaded" size="xs">
                                    {uiText(achievement.description)}
                                  </Text>
                                  <Hstack>
                                    <Image
                                      src={
                                        achievement.game?.thumbnail ||
                                        "/images/game-thumbnail.png"
                                      }
                                      alt={uiText("AppStrings.GameThumbnail")}
                                      width={18}
                                      height={10}
                                      className="rounded-lg w-[18px] h-[10px] object-cover"
                                    />
                                    <Text color="textFaded" size="xs">
                                      {achievement.game?.name}
                                    </Text>
                                  </Hstack>
                                  <Text size="xs" style={{ color: style.text }}>
                                    {tier === "Default" ? "" : uiText("AppStrings.Value05", { value0: tier })}
                                    <span>{pct.toFixed(1)}</span>{uiText("AppStrings.OfUsersAchieved")} </Text>
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
                                  "/images/game-thumbnail.png"
                                }
                                width={48}
                                height={48}
                                alt={uiText("AppStrings.Achievement")}
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

          {earnedScores.length > 0 ? (
            <Section id="earned-scores" title={uiText("AppStrings.ScoresYouEarned")} subtitle={uiText("AppStrings.YourBestLeaderboardScoresThisJam")}>
              <div className="mx-auto grid w-full max-w-4xl grid-cols-1 justify-items-center gap-x-12 gap-y-8 md:grid-cols-4 md:[&>*]:col-span-2 md:[&>:last-child:nth-child(odd)]:col-start-2">
                {earnedScores.map((score) => {
                  const rankColor = score.placement === 1 ? colors.yellow
                    : score.placement === 2 ? `color-mix(in srgb, ${colors.text} 85%, ${colors.blue})`
                    : score.placement === 3 ? colors.orange
                    : colors.text;
                  return (
                  <a key={score.id} href={`/g/${score.leaderboard.game.slug}?pageVersion=${score.leaderboard.game.pageVersion ?? "JAM"}`} className="flex w-fit min-w-0 max-w-sm items-center gap-4 rounded-lg py-4">
                    <Image
                      src={score.leaderboard.game.thumbnail || "/images/D2J_Icon.png"}
                      alt=""
                      width={64}
                      height={64}
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                    <Vstack align="start" gap={1} className="min-w-0">
                      <Text color="textFaded" size="sm">{score.leaderboard.game.name}</Text>
                      <Text weight="bold">{score.leaderboard.name}</Text>
                      <Text size="2xl" weight="bold" style={{ color: rankColor }}>{formatRecentScore(score)}</Text>
                      {score.placement != null && score.topPercent != null && (
                        <Hstack wrap className="gap-2 pt-2">
                          <Chip>
                            <span style={{ color: rankColor }}>
                              {uiText("AppStrings.RecapScorePlacement", { placement: score.placement, players: score.playerCount })}
                            </span>
                          </Chip>
                          <Chip>
                            <span style={{ color: colors.textFaded }}>
                              {uiText("AppStrings.RecapScorePercent", { percent: Math.max(1, Math.round(score.topPercent)).toLocaleString() })}
                            </span>
                          </Chip>
                        </Hstack>
                      )}
                    </Vstack>
                  </a>
                  );
                })}
              </div>
            </Section>
          ) : null}

          {isOwner || canPreview ? (
            <Section
              id="share"
              title={uiText("AppStrings.ShareYourRecap")}
              subtitle={uiText("AppStrings.MakeThisPagePublicSoOtherPeopleCan")}
            >
              <Hstack wrap justify="center" className="gap-4 w-full">
                <Vstack align="start" gap={1}>
                  <Text weight="bold">{uiText("AppStrings.PublicRecap")}</Text>
                </Vstack>
                <Switch
                  checked={Boolean(visibility?.isPublic)}
                  disabled={preview || savingVisibility || !recapData.gameDetail}
                  onChange={handleVisibilityChange}
                />
              </Hstack>
              <Hstack wrap justify="center" className="w-full text-center">
                <Button
                  icon="link"
                  onClick={handleCopyShareLink}
                  disabled={!visibility?.isPublic}
                >
                   {uiText("AppStrings.CopyShareLink")} </Button>
                {!recapData.gameDetail ? (
                  <Text size="sm" color="textFaded">
                     {uiText("AppStrings.PublishAGameInThisJamToEnable")} </Text>
                ) : null}
              </Hstack>
              <Hstack justify="center" className="w-full">
                <Button icon="send" onClick={handleSharePost} disabled={preview || !isOwner || !currentData || loadingSupplementalData || sharingRecap}>
                  {uiText(sharingRecap ? "AppStrings.CreatingRecapPost" : "AppStrings.ShareRecapPost")}
                </Button>
              </Hstack>
            </Section>
          ) : null}

          <NextJamInvitation
            jams={[...jams, ...(currentJamResponse?.nextJam ? [currentJamResponse.nextJam] : [])]}
            recapJam={selectedJam}
            preview={preview}
          />

          <div id="next" data-recap-section={uiText("AppStrings.ViewFullResults")} tabIndex={-1} className="w-full">
            <Vstack align="start" gap={4}>
              {ownerGame ? (
                <>
                  <Hstack wrap className="gap-2">
                    <Text size="xl" weight="bold">
                       {uiText("AppStrings.PostJamRefinementStartsNow")} </Text>
                  </Hstack>
                  <Text color="textFaded">
                     {uiText("AppStrings.CheckWhatPeopleLikedAndDidnTLikeAboutTheGameAndGoThroughAndMakeImprovementsBasedOnHow")} </Text>
                </>
              ) : null}
              <Hstack wrap>
                <Button
                  href={`/results?jam=${getJamUrlValue(selectedJam) || selectedJamId}`}
                  icon="trophy"
                >
                   {uiText("AppStrings.ViewFullResults")} </Button>
              </Hstack>
            </Vstack>
          </div>
        </>
      ) : null}
    </RecapLayout>
  );
}
