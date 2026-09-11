"use client";

import Image from "@/compat/next-image";
import Link from "@/compat/next-link";
import {
  AchievementHoverPreview,
  GameDataHoverPreview,
  UserHoverPreview,
} from "@/components/hover-previews";
import { Skeleton } from "@/components/skeletons";
import { isJamPhase, isPostJamPhase } from "@/helpers/listingPageVersion";
import { useCurrentJam, useRecentAchievements } from "@/hooks/queries";
import { useTheme } from "@/providers/useSiteTheme";
import type { AchievementRarityTier } from "@/types/RecentAchievementType";
import { formatDistance } from "date-fns";
import SidebarSectionTitle from "./SidebarSectionTitle";

const tierColor: Record<AchievementRarityTier, string> = {
  Abyssal: "magenta",
  Diamond: "blue",
  Gold: "yellow",
  Silver: "gray",
  Bronze: "orange",
  Default: "textFaded",
};

function gameHref(slug: string, pageVersion: "JAM" | "POST_JAM") {
  return `/g/${slug}?pageVersion=${pageVersion}`;
}

export default function SidebarAchievements() {
  const { data: activeJam, isLoading: jamLoading } = useCurrentJam();
  const jamId =
    activeJam?.jam &&
    (isJamPhase(activeJam.phase) || isPostJamPhase(activeJam.phase))
      ? activeJam.jam.id
      : undefined;
  const {
    data: achievements = [],
    isError,
    isLoading,
  } = useRecentAchievements(jamId);
  const { colors } = useTheme();

  if (jamLoading || isLoading) {
    return (
      <div className="mt-12 flex flex-col items-center gap-2">
        <Skeleton className="h-8 w-56" />
        <div className="flex w-full flex-col gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-[76px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!isError && achievements.length === 0) return null;

  return (
    <section className="mt-12 flex flex-col items-center gap-2">
      <SidebarSectionTitle>
        Recent Achievements
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
            Recent achievements couldn&apos;t be loaded.
          </div>
        )}
        {achievements.map((entry) => {
          const accent = colors[tierColor[entry.tier]];
          const href = gameHref(entry.game.slug, entry.game.pageVersion);

          return (
            <article
              key={`${entry.user.id}:${entry.achievement.id}`}
              className="flex min-h-[76px] items-center gap-3 rounded-xl border p-2"
              style={{
                backgroundColor: colors.mantle,
                borderColor: `${accent}99`,
                boxShadow:
                  entry.tier === "Default" ? undefined : `0 0 9px ${accent}33`,
              }}
            >
              <div className="relative shrink-0">
                <AchievementHoverPreview entry={entry}>
                  <Link href={href} aria-label={`Open ${entry.game.name}`}>
                    <Image
                      src={
                        entry.achievement.image ||
                        entry.game.thumbnail ||
                        "/images/D2J_Icon.png"
                      }
                      alt={entry.achievement.name}
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                  </Link>
                </AchievementHoverPreview>
                <div className="absolute -bottom-1 -right-1">
                  <UserHoverPreview user={entry.user}>
                    <Link
                      href={`/u/${entry.user.slug}`}
                      aria-label={`Open ${entry.user.name}'s profile`}
                    >
                      <Image
                        src={entry.user.profilePicture || "/images/D2J_Icon.png"}
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
                  <UserHoverPreview user={entry.user}>
                    <Link
                      href={`/u/${entry.user.slug}`}
                      className="font-semibold hover:underline"
                    >
                      {entry.user.name}
                    </Link>
                  </UserHoverPreview>{" "}
                  earned{" "}
                  {formatDistance(new Date(entry.earnedAt), new Date(), {
                    addSuffix: true,
                  })}
                </p>
                <AchievementHoverPreview entry={entry} className="max-w-full">
                  <Link
                    href={href}
                    className="block truncate font-semibold hover:underline"
                    style={{ color: colors.text }}
                  >
                    {entry.achievement.name}
                  </Link>
                </AchievementHoverPreview>
                <div
                  className="flex min-w-0 items-center truncate text-xs"
                  style={{ color: colors.textFaded }}
                >
                  <GameDataHoverPreview game={entry.game}>
                    <Link href={href} className="truncate hover:underline">
                      {entry.game.name}
                    </Link>
                  </GameDataHoverPreview>
                  {entry.tier !== "Default" && (
                    <>
                      <span className="mx-1">·</span>
                      <span style={{ color: accent }}>{entry.tier}</span>
                    </>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
