import { Card } from "bioloom-ui";
import { Icon, IconName } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { useTheme } from "@/providers/useSiteTheme";
import Image from "@/compat/next-image";
import Link from "@/compat/next-link";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export type GameCardGame = {
  slug: string;
  name: string;
  pageVersion?: "JAM" | "POST_JAM";
  short?: string | null;
  thumbnail?: string | null;
  itchEmbedUrl?: string | null;
  screenshots?: string[];
  inputMethods?: string[];
  tags?: Array<{ id?: number; name: string }>;
  flags?: Array<{ id?: number; name: string }>;
  category?: "ODA" | "REGULAR" | "EXTRA" | "EXTERNAL";
  downloadLinks?: Array<{ platform: string }>;
  jam?: { name?: string | null; color?: string | null };
  creatorName?: string | null;
  ownerName?: string | null;
  teamName?: string | null;
  owner?: { name?: string | null } | null;
  creator?: { name?: string | null } | null;
  team?: {
    name?: string | null;
    owner?: { name?: string | null };
    users?: Array<unknown>;
  } | null;
};

type PreviewPosition = {
  left: number;
  top: number;
  arrowTop: number;
  side: "left" | "right";
};

const previewWidth = 372;
const previewGap = 10;
const viewportPadding = 12;

function getPreviewPosition(
  anchor: HTMLElement,
  previewHeight = 410,
): PreviewPosition {
  const rect = anchor.getBoundingClientRect();
  const spaceToRight = window.innerWidth - rect.right;
  const spaceToLeft = rect.left;
  const showOnRight =
    spaceToRight >= previewWidth + previewGap || spaceToRight >= spaceToLeft;
  const desiredLeft = showOnRight
    ? rect.right + previewGap
    : rect.left - previewWidth - previewGap;
  const top = Math.max(
    viewportPadding,
    Math.min(
      rect.top + (rect.height - previewHeight) / 2,
      window.innerHeight - previewHeight - viewportPadding,
    ),
  );

  return {
    left: Math.max(
      viewportPadding,
      Math.min(desiredLeft, window.innerWidth - previewWidth - viewportPadding),
    ),
    top,
    arrowTop: Math.max(
      18,
      Math.min(rect.top + rect.height / 2 - top, previewHeight - 18),
    ),
    side: showOnRight ? "right" : "left",
  };
}

function GamePreview({
  game,
  creatorName,
  buildPlatforms,
  position,
  previewRef,
}: {
  game: GameCardGame;
  creatorName: string | null;
  buildPlatforms: string[];
  position: PreviewPosition;
  previewRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { colors } = useTheme();
  const screenshots = (game.screenshots ?? []).filter(Boolean).slice(0, 3);
  const tags = (game.tags ?? []).slice(0, 3);
  const flags = game.flags ?? [];
  const tooltipBorderColor = `color-mix(in srgb, ${colors.text} 12%, ${colors.crust})`;

  return createPortal(
    <motion.div
      ref={previewRef}
      aria-hidden="true"
      className="fixed z-[90] w-[372px] pointer-events-none"
      initial={{
        opacity: 0,
        x: position.side === "right" ? -10 : 10,
        scale: 0.98,
      }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      style={{
        left: position.left,
        top: position.top,
        color: colors.text,
        transformOrigin:
          position.side === "right"
            ? `left ${position.arrowTop}px`
            : `right ${position.arrowTop}px`,
      }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 15 24"
        className="absolute z-20 h-6 w-[15px] overflow-visible"
        style={{
          top: position.arrowTop,
          left: position.side === "right" ? -14 : undefined,
          right: position.side === "left" ? -14 : undefined,
          transform: "translateY(-50%)",
        }}
      >
        <path
          d={
            position.side === "right"
              ? "M 0 12 L 15 0 L 15 24 Z"
              : "M 15 12 L 0 0 L 0 24 Z"
          }
          fill={colors.crust}
        />
        <path
          d={
            position.side === "right"
              ? "M 15 0 L 0 12 L 15 24"
              : "M 0 0 L 15 12 L 0 24"
          }
          fill="none"
          stroke={tooltipBorderColor}
          strokeWidth="1"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>

      <div
        className="relative z-10 max-h-[calc(100vh-24px)] overflow-hidden rounded-lg border"
        style={{
          backgroundColor: colors.crust,
          borderColor: tooltipBorderColor,
          boxShadow:
            "0 12px 28px rgba(0, 0, 0, 0.38), 0 2px 8px rgba(0, 0, 0, 0.28)",
        }}
      >
        {screenshots.length > 0 && (
          <div
            className={`grid h-[190px] gap-1 bg-black/20 ${
              screenshots.length > 1 ? "grid-cols-[2fr_1fr]" : "grid-cols-1"
            }`}
          >
            <Image
              src={screenshots[0]}
              alt=""
              width={248}
              height={190}
              className="h-[190px] w-full object-cover"
            />
            {screenshots.length > 1 && (
              <div className="grid min-w-0 grid-rows-2 gap-1">
                {screenshots.slice(1).map((screenshot, index) => (
                  <Image
                    key={screenshot}
                    src={screenshot}
                    alt=""
                    width={120}
                    height={93}
                    className={`h-full min-h-0 w-full object-cover ${
                      screenshots.length === 2 && index === 0 ? "row-span-2" : ""
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold leading-tight">{game.name}</p>
            {creatorName && (
              <p className="mt-1 truncate text-xs" style={{ color: colors.textFaded }}>
                By {creatorName}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-2 pt-1" style={{ color: colors.textFaded }}>
            {buildPlatforms.map((platform) => {
              const icon = platformIcons[platform];
              return icon ? <Icon key={platform} name={icon} size={15} /> : null;
            })}
          </div>
        </div>

        <p
          className="mt-3 line-clamp-3 text-sm leading-relaxed"
          style={{ color: colors.textFaded }}
        >
          {game.short || "No description provided."}
        </p>

        {(tags.length > 0 || (game.inputMethods?.length ?? 0) > 0) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag.id ?? tag.name}
                className="post-tag-chip rounded text-[11px]"
                style={{ backgroundColor: colors.mantle, color: colors.textFaded }}
              >
                {tag.name}
              </span>
            ))}
            {(game.inputMethods ?? []).slice(0, Math.max(0, 3 - tags.length)).map((input) => (
              <span
                key={input}
                className="post-tag-chip rounded text-[11px]"
                style={{ backgroundColor: colors.mantle, color: colors.textFaded }}
              >
                {input}
              </span>
            ))}
          </div>
        )}

        {flags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {flags.map((flag) => (
              <span
                key={flag.id ?? flag.name}
                className="post-tag-chip rounded text-[11px]"
                style={{ backgroundColor: colors.mantle, color: colors.textFaded }}
              >
                {flag.name}
              </span>
            ))}
          </div>
        )}
        </div>
      </div>
    </motion.div>,
    document.body,
  );
}

const platformOrder: Record<string, number> = {
  Windows: 1,
  MacOS: 2,
  Linux: 3,
  Web: 4,
  Mobile: 5,
};

const platformIcons: Record<string, IconName> = {
  Windows: "customwindows",
  MacOS: "custommacos",
  Linux: "customlinux",
  Web: "sihtml5",
  Mobile: "smartphone",
  SourceCode: "code2",
};

function getCreatorName(game: GameCardGame) {
  if (game.teamName) return game.teamName;
  if (game.creatorName) return game.creatorName;
  if (game.ownerName) return game.ownerName;
  if (game.creator?.name) return game.creator.name;
  if (game.owner?.name) return game.owner.name;

  const team = game.team;
  if (!team) return null;

  if (team.name) return team.name;
  if (!team.owner?.name) return null;

  return team.users?.length === 1 ? team.owner.name : `${team.owner.name}'s team`;
}

function getBuildPlatforms(game: GameCardGame) {
  return [
    ...new Set([
      ...(game.itchEmbedUrl ? (["Web"] as const) : []),
      ...(game.downloadLinks ?? []).map((type) => type.platform),
    ]),
  ].sort((a, b) => (platformOrder[a] ?? 99) - (platformOrder[b] ?? 99));
}

export function GameHoverPreview({
  game,
  children,
  className = "",
}: {
  game: GameCardGame;
  children: ReactNode;
  className?: string;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState<PreviewPosition>({
    left: viewportPadding,
    top: viewportPadding,
    arrowTop: 18,
    side: "right",
  });
  const creatorName = getCreatorName(game);
  const buildPlatforms = getBuildPlatforms(game);

  const updatePreviewPosition = useCallback((previewHeight?: number) => {
    if (!anchorRef.current) return;
    setPreviewPosition(getPreviewPosition(anchorRef.current, previewHeight));
  }, []);

  const openPreview = useCallback((immediate = false) => {
    if (!immediate && !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      updatePreviewPosition();
      setShowPreview(true);
    }, immediate ? 0 : 320);
  }, [updatePreviewPosition]);

  const closePreview = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setShowPreview(false);
  }, []);

  useLayoutEffect(() => {
    if (!showPreview || !previewRef.current) return;
    updatePreviewPosition(previewRef.current.getBoundingClientRect().height);
  }, [showPreview, updatePreviewPosition]);

  useEffect(() => {
    if (!showPreview) return;
    const reposition = () => updatePreviewPosition(previewRef.current?.offsetHeight);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [showPreview, updatePreviewPosition]);

  useEffect(() => () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
  }, []);

  return (
    <div
      ref={anchorRef}
      className={`relative ${className}`}
      onMouseEnter={() => openPreview()}
      onMouseLeave={closePreview}
      onFocus={() => openPreview(true)}
      onBlur={closePreview}
    >
      {children}
      {showPreview && (
        <GamePreview
          game={game}
          creatorName={creatorName}
          buildPlatforms={buildPlatforms}
          position={previewPosition}
          previewRef={previewRef}
        />
      )}
    </div>
  );
}

export function GameCard({
  game,
  rated = false,
}: {
  game: GameCardGame;
  rated?: boolean;
}) {
  const { colors } = useTheme();
  const jamColor = game.jam?.color || "green";
  const jamName = game.jam?.name || "Game Jam";
  const buildPlatforms = getBuildPlatforms(game);
  const href = `/g/${game.slug}${game.pageVersion ? `?pageVersion=${game.pageVersion}` : ""}`;
  const versionLabel =
    game.pageVersion === "POST_JAM" ? "Post-Jam" : game.pageVersion === "JAM" ? "Jam" : null;
  const creatorName = getCreatorName(game);

  return (
    <GameHoverPreview game={game}>
      <Link href={href}>
      <Card
        padding={0}
        shadow="none"
        className="overflow-hidden relative"
      >
        {rated && (
          <div className="absolute z-20 inset-0 flex items-center justify-center text-white font-bold text-xl bg-black/80">
            <p className="opacity-50">RATED</p>
          </div>
        )}
        <div className="absolute top-0 left-0 z-10 m-2 flex flex-col items-start gap-1">
          <div
            className="rounded p-2 pt-1 pb-1 text-xs shadow-md backdrop-blur-md"
            style={{
              color: colors["text"],
              backgroundColor:
                game.category === "EXTERNAL"
                  ? colors["base"]
                  : colors[jamColor] + "aa",
              borderColor:
                game.category === "EXTERNAL"
                  ? colors["base"]
                  : colors[jamColor],
            }}
          >
            {jamName}
          </div>
          {versionLabel && (
            <div
              className="rounded p-2 pt-1 pb-1 text-xs shadow-md backdrop-blur-md"
              style={{
                color: colors["text"],
                backgroundColor: colors["mantle"] + "dd",
                borderColor: colors["base"],
              }}
            >
              {versionLabel}
            </div>
          )}
        </div>
        <div
          className="absolute top-0 right-0 p-2 pt-1 pb-1 rounded shadow-md m-2 backdrop-blur-md text-xs"
          style={{
            color: colors["text"],
            backgroundColor:
              colors[
                game.category == "REGULAR"
                  ? "blue"
                  : game.category == "ODA"
                  ? "purple"
                  : game.category == "EXTERNAL"
                  ? "orange"
                  : "pink"
              ] + "aa",
            borderColor:
              colors[
                game.category == "REGULAR"
                  ? "blue"
                  : game.category == "ODA"
                  ? "purple"
                  : game.category == "EXTERNAL"
                  ? "orange"
                  : "pink"
              ],
          }}
        >
          {game.category}
        </div>
        <div className="shadow-[inset_0_0_20px_rgba(0, 0, 0, 0.7)]">
          <Image
            alt={`${game.name}'s thumbnail`}
            height={200}
            width={360}
            className="max-w-90 max-h-[200px] object-cover shadow-inner"
            src={game.thumbnail ?? "/images/D2J_Icon.png"}
          />
        </div>
        <div
          className="absolute blur-md opacity-50 [mask-image:linear-gradient(to_top,#000000cc,#00000033,#00000011,transparent)] [mask-repeat:no-repeat] [mask-size:100%_30%] [mask-position:bottom] [-webkit-mask-image:linear-gradient(to_top,#00000044,transparent)]"
          style={{
            transform: "scale(1, -1)",
          }}
        >
          <Image
            alt={`${game.name}'s thumbnail`}
            height={200}
            width={360}
            className="max-w-90 max-h-[200px] object-cover shadow-inner"
            src={game.thumbnail ?? "/images/D2J_Icon.png"}
          />
        </div>
        <Hstack
          justify="between"
          className="border-t-1 w-full p-2 pb-4 px-4"
          style={{
            borderColor: colors["text"] + "66",
            backgroundColor: colors["base"],
          }}
        >
          <Vstack gap={0} align="start">
            <Text size="2xl" color="text">
              {game.name}
            </Text>

            <Text
              size="sm"
              color="textFaded"
              className="line-clamp-1"
              style={{
                borderColor: colors["base"],
              }}
            >
              {game.short || "General.NoDescription"}
            </Text>

            {creatorName && (
              <Text size="xs" color="textFaded" className="line-clamp-1">
                By {creatorName}
              </Text>
            )}
          </Vstack>
          <Hstack>
            {buildPlatforms.map((platform) => {
              const icon = platformIcons[platform];
              return icon ? <Icon key={platform} name={icon} size={16} /> : null;
            })}
          </Hstack>
        </Hstack>
        </Card>
      </Link>
    </GameHoverPreview>
  );
}
