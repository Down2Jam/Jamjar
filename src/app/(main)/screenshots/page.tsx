"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "@/compat/next-link";
import { Button, Hstack, Text, Vstack } from "bioloom-ui";
import { getGamesPage } from "@/requests/game";
import { unwrapArray } from "@/requests/helpers";
import type { GameType } from "@/types/GameType";
import { useTheme } from "@/providers/useSiteTheme";

type ScreenshotTile = {
  id: string;
  src: string;
  gameSlug: string;
  gameName: string;
  category: GameType["category"];
  aspectRatio: string;
};

type GamesPageResponse = {
  data?: GameType[];
  items?: GameType[];
  meta?: {
    pageInfo?: {
      hasMore?: boolean;
      nextCursor?: string | null;
    };
  };
  pageInfo?: {
    hasMore?: boolean;
    nextCursor?: string | null;
  };
};

const categoryOptions: Array<{
  id: "ALL" | GameType["category"];
  label: string;
}> = [
  { id: "ALL", label: "AppStrings.All" },
  { id: "REGULAR", label: "GameCategory.Regular.Title" },
  { id: "ODA", label: "AppStrings.ODA" },
  { id: "EXTRA", label: "GameCategory.Extra.Title" },
  { id: "EXTERNAL", label: "AppStrings.External" },
];

function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function shuffleTiles(tiles: ScreenshotTile[], seed: number) {
  return [...tiles].sort((a, b) => {
    const aHash = hashString(`${seed}:${a.id}`);
    const bHash = hashString(`${seed}:${b.id}`);
    return aHash - bHash;
  });
}

function getTileAspectRatio(id: string) {
  const ratios = ["16 / 10", "4 / 3", "1 / 1", "3 / 4", "16 / 9", "5 / 4"];
  return ratios[hashString(id) % ratios.length];
}

function getScreenshotsForGame(game: GameType) {
  const descriptionImages = [
    game.description,
    game.jamPage?.description,
    game.postJamPage?.description,
  ].flatMap((description) => {
    if (!description) return [];
    return Array.from(description.matchAll(/<img[^>]+src=["']([^"']+)["']/gi))
      .map((match) => match[1])
      .filter((src): src is string => Boolean(src?.trim()));
  });

  return [
    ...(game.screenshots ?? []),
    ...(game.jamPage?.screenshots ?? []),
    ...(game.postJamPage?.screenshots ?? []),
    ...descriptionImages,
  ]
    .filter((src): src is string => Boolean(src?.trim()))
    .filter((src, index, screenshots) => screenshots.indexOf(src) === index);
}

const MAX_LISTING_PAGES = 3;
const GAME_PAGE_LIMIT = 50;
const MAX_SCREENSHOTS_PER_GAME = 4;

export default function ScreenshotsPage() {
  const uiText = useUiTranslations();
  const { colors, siteTheme } = useTheme();
  const headerColor = colors["text"];
  const [category, setCategory] =
    useState<(typeof categoryOptions)[number]["id"]>("ALL");
  const [seed, setSeed] = useState(() => Date.now());
  const [games, setGames] = useState<GameType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const loadGames = useCallback(async () => {
    setIsFetching(true);
    try {
      const listedGames: GameType[] = [];
      let cursor: string | null | undefined = null;

      for (let page = 0; page < MAX_LISTING_PAGES; page++) {
        const response = await getGamesPage({
          sort: "newest",
          pageVersion: "ALL",
          cursor,
          limit: GAME_PAGE_LIMIT,
        });
        if (!response.ok) break;

        const payload = (await response.json()) as GamesPageResponse;
        listedGames.push(
          ...unwrapArray<GameType>(payload.items ?? payload.data ?? payload),
        );
        const pageInfo = payload.pageInfo ?? payload.meta?.pageInfo;
        cursor = pageInfo?.nextCursor;
        if (!pageInfo?.hasMore || !cursor) break;
      }

      setGames(listedGames);
    } catch (error) {
      console.error("Failed to load screenshot gallery", error);
      setGames([]);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const tiles = useMemo(() => {
    const sourceGames = Array.isArray(games) ? games : [];
    return sourceGames.flatMap((game) =>
      getScreenshotsForGame(game)
        .slice(0, MAX_SCREENSHOTS_PER_GAME)
        .map((src, index) => ({
          id: `${game.slug}:${index}:${src}`,
          src,
          gameSlug: game.slug,
          gameName: game.name,
          category: game.category,
          aspectRatio: getTileAspectRatio(`${game.slug}:${index}:${src}`),
        })),
    );
  }, [games]);

  const visibleTiles = useMemo(() => {
    const filtered =
      category === "ALL"
        ? tiles
        : tiles.filter((tile) => tile.category === category);
    return shuffleTiles(filtered, seed);
  }, [category, seed, tiles]);

  return (
    <main className="w-full px-3 pb-8">
      <Vstack align="stretch" className="gap-4">
        <header className="py-2 text-center">
          <p
            className="text-3xl font-semibold"
            style={{
              color: headerColor,
              textShadow:
                siteTheme.type === "Light"
                  ? "none"
                  : "0 1px 5px rgba(0, 0, 0, 0.75)",
            }}
          >
             {uiText("Navbar.Screenshots.Title")} </p>
          <p
            className="mt-1 text-sm"
            style={{
              color: headerColor,
              opacity: 0.82,
              textShadow:
                siteTheme.type === "Light"
                  ? "none"
                  : "0 1px 4px rgba(0, 0, 0, 0.8)",
            }}
          >
             {uiText("AppStrings.ScreenshotsFromGamesUploadedToTheSite")} </p>
        </header>

        <Hstack justify="between" className="flex-wrap gap-3">
          <Hstack className="gap-2 overflow-x-auto pb-1">
            {categoryOptions.map((option) => (
              <Button
                key={option.id}
                size="sm"
                color={category === option.id ? "blue" : "default"}
                variant={category === option.id ? undefined : "ghost"}
                onClick={() => setCategory(option.id)}
              >
                {uiText(option.label)}
              </Button>
            ))}
          </Hstack>
          <Button
            size="sm"
            icon="rotateccw"
            loading={isFetching && !isLoading}
            onClick={async () => {
              setSeed(Date.now());
              await loadGames();
            }}
          >
             {uiText("AppStrings.Shuffle")} </Button>
        </Hstack>

        {isLoading ? (
          <div
            role="status"
            aria-label={uiText("AppStrings.LoadingScreenshots")}
            aria-busy="true"
            className="columns-1 gap-2 sm:columns-2 lg:columns-3 2xl:columns-4"
          >
            {Array.from({ length: 16 }, (_, index) => (
              <div
                key={index}
                aria-hidden="true"
                className="relative mb-2 w-full break-inside-avoid overflow-hidden bg-black/30 motion-safe:animate-pulse"
                style={{ aspectRatio: getTileAspectRatio(`placeholder:${index}`) }}
              >
                <div className="absolute inset-0 bg-white/[0.03]" />
              </div>
            ))}
          </div>
        ) : visibleTiles.length === 0 ? (
          <Vstack className="py-16">
            <Text color="textFaded">{uiText("AppStrings.NoScreenshotsFound")}</Text>
          </Vstack>
        ) : (
          <div className="columns-1 gap-2 sm:columns-2 lg:columns-3 2xl:columns-4">
            {visibleTiles.map((tile) => (
              <ScreenshotCard key={tile.id} tile={tile} />
            ))}
          </div>
        )}
      </Vstack>
    </main>
  );
}

function ScreenshotCard({ tile }: { tile: ScreenshotTile }) {
  const uiText = useUiTranslations();
  const [loaded, setLoaded] = useState(false);

  return (
    <Link
      href={`/g/${tile.gameSlug}`}
      className="group relative mb-2 block w-full break-inside-avoid overflow-hidden bg-black/30"
      style={{ aspectRatio: tile.aspectRatio }}
      aria-label={uiText("AppStrings.OpenValue0", { value0: tile.gameName })}
    >
      <div className="absolute inset-0 bg-white/[0.03]" />
      <img
        src={tile.src}
        alt={uiText("AppStrings.Value0Screenshot", { value0: tile.gameName })}
        className={`absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.02] group-hover:brightness-75 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
        <Text color="text" weight="semibold">
          {tile.gameName}
        </Text>
        <Text color="textFaded" size="xs">
          {tile.category}
        </Text>
      </div>
    </Link>
  );
}
