"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { useDelayedHover } from "@/hooks/useDelayedHover";
import { GameHoverPreview, type GameCardGame } from "@/components/gamecard";
import { useGame, useUser } from "@/hooks/queries";
import { useTheme } from "@/providers/useSiteTheme";
import { materializeGamePage } from "@/helpers/gamePages";
import type {
  AchievementRarityTier,
  RecentAchievementType,
} from "@/types/RecentAchievementType";
import type { RecentScoreType } from "@/types/RecentScoreType";
import { formatRecentScore } from "@/helpers/scoreDisplay";
import { Popover } from "bioloom-ui";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

const achievementTierColor: Record<AchievementRarityTier, string> = {
  Abyssal: "magenta",
  Diamond: "blue",
  Gold: "yellow",
  Silver: "gray",
  Bronze: "orange",
  Default: "textFaded",
};

type PreviewUser = {
  slug: string;
  name?: string | null;
  profilePicture?: string | null;
  short?: string | null;
};

export function UserHoverPreview({
  user,
  children,
  className = "",
  portal = false,
}: {
  user: PreviewUser;
  children: ReactNode;
  className?: string;
  portal?: boolean;
}) {
  const [hovered, setHovered] = useDelayedHover(false);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [portalPosition, setPortalPosition] = useState<CSSProperties>();
  const { data } = useUser(user.slug, hovered);
  const { colors } = useTheme();
  const preview = data ?? user;

  const updatePortalPosition = useCallback(() => {
    if (!portal || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPortalPosition({
      position: "fixed",
      zIndex: 80,
      pointerEvents: "none",
      left: rect.left + rect.width / 2,
      top: rect.top - 8,
      transform: "translate(-50%, -100%)",
    });
  }, [portal]);

  useEffect(() => {
    if (!hovered || !portal) return;
    updatePortalPosition();
    window.addEventListener("resize", updatePortalPosition);
    window.addEventListener("scroll", updatePortalPosition, true);
    return () => {
      window.removeEventListener("resize", updatePortalPosition);
      window.removeEventListener("scroll", updatePortalPosition, true);
    };
  }, [hovered, portal, updatePortalPosition]);

  return (
    <span
      ref={anchorRef}
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      {children}
      <Popover
        shown={hovered && (!portal || Boolean(portalPosition))}
        anchorToScreen={portal}
        positionerStyle={portal ? portalPosition : undefined}
        position="top"
        padding={10}
        showArrow
        interactive={false}
        surface="default"
      >
        <div className="flex w-64 flex-col gap-2 text-left">
          <div className="flex items-center gap-2">
            <img
              src={preview.profilePicture || "/images/D2J_Icon.png"}
              alt=""
              className="h-8 w-8 shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">
                {preview.name || preview.slug}
              </div>
              <div className="truncate text-xs" style={{ color: colors.textFaded }}>
                @{preview.slug}
              </div>
            </div>
          </div>
          {preview.short && (
            <div className="text-xs leading-relaxed" style={{ color: colors.textFaded }}>
              {preview.short}
            </div>
          )}
        </div>
      </Popover>
    </span>
  );
}

export function GameDataHoverPreview({
  game,
  children,
  className = "",
}: {
  game: GameCardGame;
  children: ReactNode;
  className?: string;
}) {
  const [active, setActive] = useState(false);
  const { data } = useGame(game.slug, active);
  const selectedPage = data
    ? game.pageVersion === "POST_JAM"
      ? data.postJamPage ?? data.jamPage
      : data.jamPage ?? data.postJamPage
    : null;
  const previewGame = data
    ? selectedPage
      ? {
          ...materializeGamePage(data, selectedPage),
          pageVersion: selectedPage.version,
        }
      : { ...data, name: data.name || game.name }
    : game;

  return (
    <span
      className={`inline-flex ${className}`}
      onMouseEnter={() => setActive(true)}
      onFocus={() => setActive(true)}
    >
      <GameHoverPreview game={previewGame} className="inline-flex">
        {children}
      </GameHoverPreview>
    </span>
  );
}

export function AchievementHoverPreview({
  entry,
  children,
  className = "",
}: {
  entry: RecentAchievementType;
  children: ReactNode;
  className?: string;
}) {
  const uiText = useUiTranslations();
  const [hovered, setHovered] = useDelayedHover(false);
  const { colors } = useTheme();
  const accent = colors[achievementTierColor[entry.tier]];
  const rarity = entry.tier === "Default" ? "Common" : entry.tier;
  const earnedPercent = Number.isFinite(entry.earnedPercent)
    ? entry.earnedPercent
    : entry.engagedCount > 0
      ? (entry.earnedCount / entry.engagedCount) * 100
      : 0;

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      {children}
      <Popover
        shown={hovered}
        anchorToScreen={false}
        position="top"
        padding={10}
        showArrow
        interactive={false}
        surface="default"
      >
        <div className="flex w-72 flex-col gap-3 text-left">
          <div className="flex items-center gap-3">
            <img
              src={
                entry.achievement.image ||
                entry.game.thumbnail ||
                "/images/game-thumbnail.png"
              }
              alt=""
              className="h-12 w-12 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">
                {entry.achievement.name}
              </div>
              <div
                className="mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                style={{
                  borderColor: `${accent}80`,
                  color: accent,
                  backgroundColor: `${accent}18`,
                }}
              >
                {rarity}
              </div>
            </div>
          </div>

          {entry.achievement.description && (
            <div
              className="text-xs leading-relaxed"
              style={{ color: colors.textFaded }}
            >
              {entry.achievement.description}
            </div>
          )}

          <div className="flex items-center gap-2">
            <img
              src={entry.game.thumbnail || "/images/game-thumbnail.png"}
              alt=""
              className="h-8 w-12 shrink-0 rounded-md object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold">
                 {uiText("AppStrings.From")} {entry.game.name}
              </div>
              <div className="text-[11px]" style={{ color: colors.textFaded }}>
                {earnedPercent.toFixed(1)}{uiText("AppStrings.OfPlayersEarnedThis")} </div>
            </div>
          </div>
        </div>
      </Popover>
    </span>
  );
}

export function ScoreHoverPreview({
  score,
  children,
  className = "",
}: {
  score: RecentScoreType;
  children: ReactNode;
  className?: string;
}) {
  const uiText = useUiTranslations();
  const [hovered, setHovered] = useDelayedHover(false);
  const { colors } = useTheme();
  const accent =
    score.placement === 1
      ? colors.yellow
      : score.placement === 2
        ? colors.gray
        : score.placement === 3
          ? colors.orange
          : colors.blue;

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      {children}
      <Popover
        shown={hovered}
        anchorToScreen={false}
        position="top"
        padding={10}
        showArrow
        interactive={false}
        surface="default"
      >
        <div className="flex w-72 flex-col gap-3 text-left">
          <div className="flex items-center gap-3">
            <img
              src={score.game.thumbnail || "/images/game-thumbnail.png"}
              alt=""
              className="h-12 w-12 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">
                {formatRecentScore(score)}
              </div>
              <div
                className="mt-1 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                style={{
                  borderColor: `${accent}80`,
                  color: accent,
                  backgroundColor: `${accent}18`,
                }}
              >
                #{score.placement}
              </div>
            </div>
          </div>

          <div className="text-xs leading-relaxed" style={{ color: colors.textFaded }}>
            {score.leaderboard.name}
          </div>

          <div className="flex items-center gap-2">
            <img
              src={score.user.profilePicture || "/images/D2J_Icon.png"}
              alt=""
              className="h-8 w-8 shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold">
                 {uiText("AppStrings.From")} {score.game.name}
              </div>
              <div className="truncate text-[11px]" style={{ color: colors.textFaded }}>
                {score.user.name} · {score.totalScores.toLocaleString()}  {uiText("AppStrings.TotalScores")} </div>
            </div>
          </div>
        </div>
      </Popover>
    </span>
  );
}
