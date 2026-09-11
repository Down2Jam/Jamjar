"use client";

import Image from "@/compat/next-image";
import Link from "@/compat/next-link";
import {
  GameDataHoverPreview,
  ScoreHoverPreview,
  UserHoverPreview,
} from "@/components/hover-previews";
import { formatRecentScore } from "@/helpers/scoreDisplay";
import { Skeleton } from "@/components/skeletons";
import { isJamPhase, isPostJamPhase } from "@/helpers/listingPageVersion";
import { useCurrentJam, useRecentScores } from "@/hooks/queries";
import { useTheme } from "@/providers/useSiteTheme";
import type { RecentScoreType } from "@/types/RecentScoreType";
import { formatDistance } from "date-fns";
import SidebarSectionTitle from "./SidebarSectionTitle";

function gameHref(score: RecentScoreType) {
  return `/g/${score.game.slug}?pageVersion=${score.game.pageVersion}`;
}

function placementColor(placement: number, colors: Record<string, string>) {
  if (placement === 1) return colors.yellow;
  if (placement === 2) return colors.gray;
  if (placement === 3) return colors.orange;
  return colors.blue;
}

export default function SidebarScores() {
  const { data: activeJam, isLoading: jamLoading } = useCurrentJam();
  const jamId =
    activeJam?.jam &&
    (isJamPhase(activeJam.phase) || isPostJamPhase(activeJam.phase))
      ? activeJam.jam.id
      : undefined;
  const { data: scores = [], isError, isLoading } = useRecentScores(jamId);
  const { colors } = useTheme();

  if (jamLoading || isLoading) {
    return (
      <div className="mt-20 flex flex-col items-center gap-2">
        <Skeleton className="h-8 w-44" />
        <div className="flex w-full flex-col gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-[76px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!isError && scores.length === 0) return null;

  return (
    <section className="mt-20 flex flex-col items-center gap-2">
      <SidebarSectionTitle>
        Recent Scores
      </SidebarSectionTitle>

      <div className="flex w-full flex-col gap-2">
        {isError && (
          <div
            className="rounded-xl border p-4 text-center text-sm"
            style={{
              backgroundColor: colors.mantle,
              borderColor: colors.red,
              color: colors.textFaded,
            }}
          >
            Recent scores couldn&apos;t be loaded.
          </div>
        )}
        {scores.map((score) => {
          const href = gameHref(score);
          const accent = placementColor(score.placement, colors);
          const placementLabel =
            score.placement <= 3 ? `#${score.placement}` : "Top 10%";

          return (
            <article
              key={score.id}
              className="flex min-h-[76px] items-center gap-3 rounded-xl border p-2"
              style={{
                backgroundColor: colors.mantle,
                borderColor: `${accent}99`,
                boxShadow: `0 0 9px ${accent}33`,
              }}
            >
              <div className="relative shrink-0">
                <GameDataHoverPreview game={score.game} className="rounded-lg">
                  <Link href={href} aria-label={`Open ${score.game.name}`}>
                    <Image
                      src={score.game.thumbnail || "/images/D2J_Icon.png"}
                      alt={score.game.name}
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                  </Link>
                </GameDataHoverPreview>
                <div className="absolute -bottom-1 -right-1">
                  <UserHoverPreview user={score.user}>
                    <Link
                      href={`/u/${score.user.slug}`}
                      aria-label={`Open ${score.user.name}'s profile`}
                    >
                      <Image
                        src={score.user.profilePicture || "/images/D2J_Icon.png"}
                        alt=""
                        width={24}
                        height={24}
                        className="h-6 w-6 rounded-full border-2 object-cover"
                        style={{ borderColor: colors.mantle }}
                      />
                    </Link>
                  </UserHoverPreview>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs" style={{ color: colors.textFaded }}>
                  <UserHoverPreview user={score.user}>
                    <Link
                      href={`/u/${score.user.slug}`}
                      className="font-semibold hover:underline"
                    >
                      {score.user.name}
                    </Link>
                  </UserHoverPreview>{" "}
                  scored{" "}
                  {formatDistance(new Date(score.scoredAt), new Date(), {
                    addSuffix: true,
                  })}
                </p>
                <ScoreHoverPreview score={score} className="max-w-full">
                  <Link
                    href={href}
                    className="block truncate font-semibold hover:underline"
                    style={{ color: colors.text }}
                  >
                    <span style={{ color: accent }}>{placementLabel}</span>
                    <span className="mx-1">·</span>
                    {formatRecentScore(score)}
                  </Link>
                </ScoreHoverPreview>
                <div
                  className="flex min-w-0 items-center truncate text-xs"
                  style={{ color: colors.textFaded }}
                >
                  <GameDataHoverPreview game={score.game}>
                    <Link href={href} className="truncate hover:underline">
                      {score.game.name}
                    </Link>
                  </GameDataHoverPreview>
                  <span className="mx-1">·</span>
                  <span className="truncate">{score.leaderboard.name}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
