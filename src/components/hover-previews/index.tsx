"use client";

import { GameHoverPreview, type GameCardGame } from "@/components/gamecard";
import { useGame, useUser } from "@/hooks/queries";
import { useTheme } from "@/providers/useSiteTheme";
import { materializeGamePage } from "@/helpers/gamePages";
import { Popover } from "bioloom-ui";
import { useState, type ReactNode } from "react";

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
}: {
  user: PreviewUser;
  children: ReactNode;
  className?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const { data } = useUser(user.slug, hovered);
  const { colors } = useTheme();
  const preview = data ?? user;

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
        surface="contrast"
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
