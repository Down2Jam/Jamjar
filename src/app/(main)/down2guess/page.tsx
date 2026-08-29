"use client";

import { useEffect, useMemo, useState } from "react";
import { addToast } from "bioloom-ui";
import {
  getGame,
  getFlags,
  getGameTags,
  getGamesPage,
  getRandomGame,
  getRatingCategories,
} from "@/requests/game";
import { readItem } from "@/requests/helpers";
import { GameType } from "@/types/GameType";
import { RatingCategoryType } from "@/types/RatingCategoryType";
import { TagType } from "@/types/TagType";
import { FlagType } from "@/types/FlagType";
import TagLabel from "@/components/tags/TagLabel";
import { Input } from "bioloom-ui";
import { Button } from "bioloom-ui";
import { Dropdown } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "bioloom-ui";
import { Icon, type IconName } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { Link } from "bioloom-ui";
import { Avatar } from "bioloom-ui";
import { Tooltip } from "bioloom-ui";
import { useTheme } from "@/providers/useSiteTheme";

const MAX_LIVES = 10;

const CATEGORY_LABELS = [
  { key: "name", label: "Name" },
  { key: "platforms", label: "Platforms" },
  { key: "tags", label: "Tags" },
  { key: "flags", label: "Flags" },
  { key: "category", label: "Category" },
  { key: "releaseYear", label: "Release Year" },
  { key: "engine", label: "Game Engine" },
  { key: "developers", label: "Developers" },
  { key: "overallRating", label: "Overall Rating" },
] as const;

type CategoryKey = (typeof CATEGORY_LABELS)[number]["key"];
type CompareStatus = "match" | "partial" | "miss";
type Direction = "higher" | "lower";
type RoundEntry =
  | { type: "guess"; gameId: number }
  | { type: "hint"; category: CategoryKey };

type CompareResult = {
  status: CompareStatus;
  direction?: Direction;
};

type GameDisplayData = {
  name: string;
  platforms: string[];
  tags: string[];
  flags: string[];
  category: string;
  releaseYear: number | null;
  engine: string[];
  developers: string[];
  overallRating: number | null;
};

type GamesPagePayload = {
  data?: GameType[] | { items?: GameType[] };
  items?: GameType[];
  meta?: {
    pageInfo?: { hasMore?: boolean; nextCursor?: string | null };
  };
  pageInfo?: { hasMore?: boolean; nextCursor?: string | null };
};

async function getAllGuessableGames() {
  const games: GameType[] = [];
  const seen = new Set<number>();
  let cursor: string | null = null;

  for (let page = 0; page < 100; page += 1) {
    const response = await getGamesPage({
      sort: "newest",
      cursor,
      limit: 50,
    });
    if (!response.ok) {
      throw new Error("Games were not returned.");
    }

    const payload = (await response.json()) as GamesPagePayload | GameType[];
    const pageGames = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.data)
        ? payload.data
        : payload.data?.items ?? payload.items ?? [];
    const pageInfo = Array.isArray(payload)
      ? null
      : payload.meta?.pageInfo ?? payload.pageInfo ?? null;

    pageGames.forEach((game) => {
      if (seen.has(game.id)) return;
      seen.add(game.id);
      games.push(game);
    });

    if (!pageInfo?.hasMore || !pageInfo.nextCursor) break;
    cursor = pageInfo.nextCursor;
  }

  return games;
}

const ENGINE_NAME_TOKENS = new Set(
  [
    "unity",
    "unreal",
    "godot",
    "gamemaker",
    "gdevelop",
    "construct",
    "pico8",
    "tic80",
    "twine",
    "bitsy",
    "renpy",
    "rpgmaker",
    "love",
    "love2d",
    "libgdx",
    "scratch",
    "defold",
    "gbstudio",
    "clickteam",
    "stencyl",
    "puzzlescript",
    "bevy",
    "haxe",
    "pygame",
    "tyrano",
  ].map((name) => name.toLowerCase())
);

function getPlatformIcon(platform: string) {
  switch (platform) {
    case "Linux":
      return "customlinux" as const;
    case "Mobile":
      return "smartphone" as const;
    case "Windows":
      return "customwindows" as const;
    case "MacOS":
      return "custommacos" as const;
    case "SourceCode":
      return "code2" as const;
    case "Web":
      return "sihtml5" as const;
    default:
      return "morehorizontal" as const;
  }
}

function normalizeToken(value?: string | null) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function uniqueList(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value)))
  );
}

function compareLists(guess: string[], answer: string[]): CompareStatus {
  const guessSet = new Set(guess.map((item) => item.toLowerCase()));
  const answerSet = new Set(answer.map((item) => item.toLowerCase()));

  if (guessSet.size === 0 && answerSet.size === 0) {
    return "match";
  }

  const intersection = Array.from(guessSet).filter((item) =>
    answerSet.has(item)
  );

  if (
    intersection.length === guessSet.size &&
    intersection.length === answerSet.size
  ) {
    return "match";
  }

  if (intersection.length > 0) {
    return "partial";
  }

  return "miss";
}

function compareText(
  guess?: string | null,
  answer?: string | null
): CompareStatus {
  const normalizedGuess = (guess ?? "").trim().toLowerCase();
  const normalizedAnswer = (answer ?? "").trim().toLowerCase();

  if (normalizedGuess === normalizedAnswer) {
    return "match";
  }
  return "miss";
}

function compareNumber(
  guess: number | null,
  answer: number | null,
  tolerance: number
): CompareResult {
  if (guess == null && answer == null) {
    return { status: "match" };
  }
  if (guess == null || answer == null) {
    return { status: "miss" };
  }
  if (Math.abs(guess - answer) <= 0.0001) {
    return { status: "match" };
  }
  const diff = Math.abs(guess - answer);
  const status: CompareStatus = diff <= tolerance ? "partial" : "miss";
  const direction: Direction = guess < answer ? "higher" : "lower";
  return { status, direction };
}

function formatNumber(value: number | null) {
  return value == null ? "No Data" : value.toString();
}

function formatRating(value: number | null) {
  return value == null ? "No Data" : `${value.toFixed(1)} stars`;
}

function getReleaseYear(game: GameType) {
  const createdAt =
    typeof game.createdAt === "string"
      ? new Date(game.createdAt)
      : game.createdAt;
  if (!createdAt || Number.isNaN(createdAt.getTime())) {
    return null;
  }
  return createdAt.getFullYear();
}

function isEngineTag(tagName: string, categoryName?: string | null) {
  if (categoryName && /engine|framework/i.test(categoryName)) {
    return true;
  }
  return ENGINE_NAME_TOKENS.has(normalizeToken(tagName));
}

function getOverallRating(
  game: GameType,
  ratingCategories: RatingCategoryType[]
) {
  const gameRatingCategories =
    game.jamPage?.ratingCategories ?? game.ratingCategories ?? [];
  const allCategories = uniqueList([
    ...gameRatingCategories.map((category) => category.id.toString()),
    ...ratingCategories.map((category) => category.id.toString()),
  ]);

  const overallCategory = [...gameRatingCategories, ...ratingCategories].find(
    (category) => /overall/i.test(category.name)
  );

  if (!overallCategory) {
    return null;
  }

  if (!allCategories.includes(overallCategory.id.toString())) {
    return null;
  }

  const publishedScores = game.jamScores ?? game.scores ?? {};
  const overallScore = Object.entries(publishedScores).find(([name]) =>
    /overall/i.test(name)
  )?.[1];
  const publishedAverage = Number(overallScore?.averageScore);

  if (Number.isFinite(publishedAverage)) {
    return Number((publishedAverage / 2).toFixed(1));
  }

  const jamPageId = game.jamPage?.id;
  const values = (game.ratings ?? [])
    .filter(
      (rating) =>
        rating.category?.id === overallCategory.id &&
        (jamPageId == null ||
          rating.gamePageId == null ||
          rating.gamePageId === jamPageId)
    )
    .map((rating) => rating.value)
    .filter((value) => value != null)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (values.length === 0) {
    return null;
  }

  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Number((average / 2).toFixed(1));
}

function buildDisplayData(
  game: GameType,
  tagCategoryById: Map<number, string>,
  ratingCategories: RatingCategoryType[]
): GameDisplayData {
  const gamePage = game.jamPage ?? game.postJamPage;
  const platforms = uniqueList(
    (gamePage?.downloadLinks ?? game.downloadLinks ?? [])
      .map((link) => link.platform)
      .sort()
  );

  const engineTags: string[] = [];
  const regularTags: string[] = [];
  for (const tag of gamePage?.tags ?? game.tags ?? []) {
    const categoryName = tagCategoryById.get(tag.id);
    if (isEngineTag(tag.name, categoryName)) {
      engineTags.push(tag.name);
    } else {
      regularTags.push(tag.name);
    }
  }

  return {
    name: gamePage?.name?.trim() || game.name?.trim() || "No Data",
    platforms,
    tags: uniqueList(regularTags).sort(),
    flags: uniqueList(
      (gamePage?.flags ?? game.flags ?? []).map((flag) => flag.name)
    ).sort(),
    category: game.category?.trim() || "No Data",
    releaseYear: getReleaseYear(game),
    engine: uniqueList(engineTags).sort(),
    developers: uniqueList(
      game.team?.users?.map((user) => user.name) ?? []
    ).sort(),
    overallRating: getOverallRating(game, ratingCategories),
  };
}

function getGuessRows(
  guesses: GameType[],
  answer: GameType,
  tagCategoryById: Map<number, string>,
  ratingCategories: RatingCategoryType[]
) {
  const answerDisplay = buildDisplayData(
    answer,
    tagCategoryById,
    ratingCategories
  );

  return guesses.map((guess) => {
    const guessDisplay = buildDisplayData(
      guess,
      tagCategoryById,
      ratingCategories
    );
    const comparisons: Record<CategoryKey, CompareResult> = {
      name: { status: compareText(guessDisplay.name, answerDisplay.name) },
      platforms: {
        status: compareLists(guessDisplay.platforms, answerDisplay.platforms),
      },
      tags: { status: compareLists(guessDisplay.tags, answerDisplay.tags) },
      flags: { status: compareLists(guessDisplay.flags, answerDisplay.flags) },
      category: {
        status: compareText(guessDisplay.category, answerDisplay.category),
      },
      releaseYear: compareNumber(
        guessDisplay.releaseYear,
        answerDisplay.releaseYear,
        2
      ),
      engine: {
        status: compareLists(guessDisplay.engine, answerDisplay.engine),
      },
      developers: {
        status: compareLists(guessDisplay.developers, answerDisplay.developers),
      },
      overallRating: compareNumber(
        guessDisplay.overallRating,
        answerDisplay.overallRating,
        0.5
      ),
    };

    return {
      game: guess,
      comparisons,
      display: guessDisplay,
    };
  });
}

export default function Down2GuessPage() {
  const { colors, siteTheme } = useTheme();
  const headerColor =
    siteTheme.type === "Light" ? colors["textLight"] : colors["text"];
  const [dataLoading, setDataLoading] = useState(true);
  const [gameLoading, setGameLoading] = useState(true);
  const [answer, setAnswer] = useState<GameType | null>(null);
  const [guessInput, setGuessInput] = useState("");
  const [guessOptionsOpen, setGuessOptionsOpen] = useState(false);
  const [guesses, setGuesses] = useState<GameType[]>([]);
  const [gamesList, setGamesList] = useState<
    { id: number; slug: string; name: string; thumbnail: string | null }[]
  >([]);
  const [allTags, setAllTags] = useState<TagType[]>([]);
  const [allFlags, setAllFlags] = useState<FlagType[]>([]);
  const [ratingCategories, setRatingCategories] = useState<
    RatingCategoryType[]
  >([]);
  const [hintUses, setHintUses] = useState(0);
  const [revealedHints, setRevealedHints] = useState<CategoryKey[]>([]);
  const [roundEntries, setRoundEntries] = useState<RoundEntry[]>([]);

  const loading = dataLoading || gameLoading;

  const tagCategoryById = useMemo(() => {
    return new Map(allTags.map((tag) => [tag.id, tag.category?.name ?? ""]));
  }, [allTags]);
  const flagByName = useMemo(
    () => new Map(allFlags.map((flag) => [flag.name.toLowerCase(), flag])),
    [allFlags],
  );

  const livesLeft = MAX_LIVES - guesses.length - hintUses;
  const hasWon = answer
    ? guesses.some((guess) => guess.slug === answer.slug)
    : false;
  const hasLost = !hasWon && livesLeft <= 0;

  const guessRows = useMemo(() => {
    if (!answer) return [];
    return getGuessRows(guesses, answer, tagCategoryById, ratingCategories);
  }, [answer, guesses, tagCategoryById, ratingCategories]);

  const solvedCategories = useMemo(() => {
    const solved = new Set<CategoryKey>();
    for (const row of guessRows) {
      for (const key of Object.keys(row.comparisons) as CategoryKey[]) {
        if (row.comparisons[key].status === "match") {
          solved.add(key);
        }
      }
    }
    return solved;
  }, [guessRows]);

  const answerDisplay = useMemo(() => {
    if (!answer) return null;
    return buildDisplayData(answer, tagCategoryById, ratingCategories);
  }, [answer, tagCategoryById, ratingCategories]);

  const hintCandidates = useMemo(() => {
    const hintable = CATEGORY_LABELS.map((item) => item.key).filter(
      (key) => key !== "name"
    );
    return hintable.filter(
      (key) => !solvedCategories.has(key) && !revealedHints.includes(key)
    );
  }, [revealedHints, solvedCategories]);

  const guessOptions = useMemo(() => {
    const query = guessInput.trim().toLowerCase();
    if (!query) return [];

    return gamesList
      .filter((game) => game.name.toLowerCase().includes(query))
      .sort((a, b) => {
        const aStartsWith = a.name.toLowerCase().startsWith(query) ? 0 : 1;
        const bStartsWith = b.name.toLowerCase().startsWith(query) ? 0 : 1;
        return aStartsWith - bStartsWith || a.name.localeCompare(b.name);
      })
      .slice(0, 10);
  }, [gamesList, guessInput]);

  const showHintButton =
    guesses.length >= 5 &&
    livesLeft > 1 &&
    !hasWon &&
    !hasLost &&
    hintCandidates.length > 0;

  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      setDataLoading(true);
      try {
        const [tagsRes, flagsRes, games, ratingRes] = await Promise.all([
          getGameTags(),
          getFlags(),
          getAllGuessableGames(),
          getRatingCategories(true),
        ]);

        const tagsPayload = await tagsRes.json();
        const flagsPayload = await flagsRes.json();
        const ratingPayload = await ratingRes.json();

        if (!cancelled) {
          setAllTags(tagsPayload.data ?? []);
          setAllFlags(flagsPayload.data ?? []);
          setRatingCategories(ratingPayload.data ?? []);
          setGamesList(
            games.map((game) => ({
              id: game.id,
              slug: game.slug,
              name: game.name,
              thumbnail:
                game.jamPage?.thumbnail ?? game.thumbnail ?? null,
            }))
          );
        }
      } catch (error) {
        if (!cancelled) {
          addToast({ title: "Failed to load game data." });
        }
      }
      setDataLoading(false);
    };

    loadAll();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadRandomGame = async () => {
      setGameLoading(true);
      try {
        const randomRes = await getRandomGame();
        const randomGame = await readItem<GameType>(randomRes);
        const slug = randomGame?.slug;
        if (!slug) {
          throw new Error("No random game returned.");
        }

        const gameRes = await getGame(slug);
        const gamePayload = await readItem<GameType>(gameRes);
        if (!gameRes.ok || !gamePayload) {
          throw new Error("Game details were not returned.");
        }

        if (!cancelled) {
          setAnswer(gamePayload);
        }
      } catch (error) {
        if (!cancelled) {
          addToast({ title: "Failed to load a random game." });
          setAnswer(null);
        }
      }
      setGameLoading(false);
    };

    loadRandomGame();
    return () => {
      cancelled = true;
    };
  }, []);

  const resetGame = async () => {
    setGuesses([]);
    setGuessInput("");
    setGuessOptionsOpen(false);
    setHintUses(0);
    setRevealedHints([]);
    setRoundEntries([]);
    setAnswer(null);
    setGameLoading(true);

    try {
      const randomRes = await getRandomGame();
      const randomGame = await readItem<GameType>(randomRes);
      const slug = randomGame?.slug;
      if (!slug) {
        throw new Error("No random game returned.");
      }
      const gameRes = await getGame(slug);
      const gamePayload = await readItem<GameType>(gameRes);
      if (!gameRes.ok || !gamePayload) {
        throw new Error("Game details were not returned.");
      }
      setAnswer(gamePayload);
    } catch (error) {
      addToast({ title: "Failed to start a new round." });
    } finally {
      setGameLoading(false);
    }
  };

  const handleGuess = async () => {
    if (!answer) return;
    if (hasWon || hasLost) return;
    if (livesLeft <= 0) return;

    const trimmed = guessInput.trim();
    if (!trimmed) return;

    const match = gamesList.find(
      (game) => game.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (!match) {
      addToast({ title: "Pick a game from the list." });
      return;
    }

    if (guesses.some((guess) => guess.slug === match.slug)) {
      addToast({ title: "You already guessed that game." });
      return;
    }

    try {
      const gameRes = await getGame(match.slug);
      const gamePayload = await readItem<GameType>(gameRes);
      if (!gameRes.ok || !gamePayload) {
        throw new Error("Game details were not returned.");
      }
      setGuesses((prev) => [...prev, gamePayload]);
      setRoundEntries((prev) => [
        { type: "guess", gameId: gamePayload.id },
        ...prev,
      ]);
      setGuessInput("");
      setGuessOptionsOpen(false);
    } catch (error) {
      addToast({ title: "Failed to fetch that game." });
    }
  };

  const handleHint = () => {
    if (!answer) return;
    if (!showHintButton) return;

    const available = hintCandidates;
    if (available.length === 0) return;

    const selected = available[Math.floor(Math.random() * available.length)];
    setRevealedHints((prev) => [...prev, selected]);
    setRoundEntries((prev) => [
      { type: "hint", category: selected },
      ...prev,
    ]);
    setHintUses((prev) => prev + 1);
  };

  const statusColor = (status: CompareStatus) =>
    ({
      match: colors.greenDarkDark,
      partial: colors.yellowDarkDark,
      miss: colors.redDarkDark,
    })[status];
  const columnDivider = `1px solid color-mix(in srgb, ${colors.text} 24%, transparent)`;

  const cellStyle = (status: CompareStatus) => {
    return {
      backgroundColor: statusColor(status),
      borderRight: columnDivider,
      color: colors.text,
      padding: "0.75rem",
    };
  };

  const renderPlatforms = (platforms: string[]) =>
    platforms.length > 0 ? (
      <Hstack justify="center" className="flex-wrap gap-3">
        {platforms.map((platform) => (
          <Tooltip
            key={platform}
            content={platform}
            position="top"
            delay={0}
            hideDelay={0}
            compact
            showArrow
            instant
          >
            <span
              tabIndex={0}
              aria-label={platform}
              className="inline-flex origin-center outline-none hover:scale-125 focus-visible:scale-125 focus-visible:ring-2 focus-visible:ring-white/80"
            >
              <Icon name={getPlatformIcon(platform)} size={24} color="text" />
            </span>
          </Tooltip>
        ))}
      </Hstack>
    ) : (
      "No Data"
    );

  const renderTags = (tags: string[]) =>
    tags.length > 0 ? (
      <Hstack justify="center" className="flex-wrap gap-3">
        {tags.map((tag) => (
          <Tooltip
            key={tag}
            content={tag}
            position="top"
            delay={0}
            hideDelay={0}
            compact
            showArrow
            instant
          >
            <span
              tabIndex={0}
              aria-label={tag}
              className="inline-flex origin-center outline-none hover:scale-125 focus-visible:scale-125 focus-visible:ring-2 focus-visible:ring-white/80"
            >
              <TagLabel name={tag} iconOnly size={24} />
            </span>
          </Tooltip>
        ))}
      </Hstack>
    ) : (
      "No Data"
    );

  const renderFlags = (flags: string[]) =>
    flags.length > 0 ? (
      <Hstack justify="center" className="flex-wrap gap-3">
        {flags.map((flagName) => {
          const flag = flagByName.get(flagName.toLowerCase());
          return (
            <Tooltip
              key={flagName}
              content={flagName}
              position="top"
              delay={0}
              hideDelay={0}
              compact
              showArrow
              instant
            >
              <span
                tabIndex={0}
                aria-label={flagName}
                className="inline-flex origin-center outline-none hover:scale-125 focus-visible:scale-125 focus-visible:ring-2 focus-visible:ring-white/80"
              >
                <Icon
                  name={(flag?.icon ?? "shieldalert") as IconName}
                  size={24}
                  color="text"
                />
              </span>
            </Tooltip>
          );
        })}
      </Hstack>
    ) : (
      "No Data"
    );

  const renderDevelopers = (game: GameType) =>
    (game.team?.users ?? []).length > 0 ? (
      <Vstack align="center" gap={1} className="min-w-0 w-full">
        {[...(game.team?.users ?? [])]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((developer) => (
            <Hstack
              key={developer.id}
              justify="center"
              className="min-w-0 w-full gap-2"
            >
              <Avatar
                src={developer.profilePicture}
                alt={`${developer.name}'s avatar`}
                fallback={developer.name}
                size={20}
              />
              <span className="min-w-0 break-words text-sm leading-tight [overflow-wrap:anywhere]">
                {developer.name}
              </span>
            </Hstack>
          ))}
      </Vstack>
    ) : (
      "No Data"
    );

  const renderHintValue = (category: CategoryKey) => {
    if (!answerDisplay || !answer) return null;

    switch (category) {
      case "platforms":
        return renderPlatforms(answerDisplay.platforms);
      case "tags":
        return renderTags(answerDisplay.tags);
      case "flags":
        return renderFlags(answerDisplay.flags);
      case "category":
        return answerDisplay.category || "No Data";
      case "releaseYear":
        return formatNumber(answerDisplay.releaseYear);
      case "engine":
        return renderTags(answerDisplay.engine);
      case "developers":
        return renderDevelopers(answer);
      case "overallRating":
        return formatRating(answerDisplay.overallRating);
      default:
        return null;
    }
  };

  return (
    <Vstack align="stretch" className="mx-auto w-full max-w-7xl gap-4">
      <header className="py-2 text-center">
        <p
          className="text-3xl font-semibold"
          style={{
            color: headerColor,
            textShadow: "0 1px 5px rgba(0, 0, 0, 0.75)",
          }}
        >
          Down2Guess
        </p>
        <p
          className="mt-1 text-sm"
          style={{
            color: headerColor,
            opacity: 0.82,
            textShadow: "0 1px 4px rgba(0, 0, 0, 0.8)",
          }}
        >
          Guess the mystery game in 10 tries
        </p>
        <Vstack align="center" gap={1} className="mt-3">
          <Hstack
            className="gap-1"
            aria-label={`${livesLeft} of ${MAX_LIVES} lives remaining`}
          >
            {Array.from({ length: MAX_LIVES }).map((_, index) => (
              <Icon
                key={`life-${index}`}
                name="heart"
                size={18}
                color={index < livesLeft ? "red" : "textFaded"}
                fill={index < livesLeft ? colors.red : "none"}
                strokeWidth={1.5}
                aria-hidden="true"
              />
            ))}
          </Hstack>
          <Text size="xs" color="textFaded">
            {livesLeft} {livesLeft === 1 ? "life" : "lives"} left
          </Text>
        </Vstack>
      </header>

      <Vstack align="stretch" gap={4}>
        <Hstack justify="center" className="w-full flex-wrap gap-2">
          <Dropdown
            isOpen={
              guessOptionsOpen &&
              !loading &&
              !hasWon &&
              !hasLost &&
              guessOptions.length > 0
            }
            onOpenChange={setGuessOptionsOpen}
            onSelect={(value) => {
              const selectedGame = gamesList.find(
                (game) => game.id === Number(value),
              );
              if (selectedGame) setGuessInput(selectedGame.name);
              setGuessOptionsOpen(false);
            }}
            position="bottom-right"
            backdrop={false}
            trigger={
              <div className="w-[36rem] max-w-[calc(100vw-2rem)]">
                <Input
                  value={guessInput}
                  onValueChange={(value) => {
                    setGuessInput(value);
                    setGuessOptionsOpen(Boolean(value.trim()));
                  }}
                  placeholder={
                    loading ? "Loading games..." : "Type a game name..."
                  }
                  fullWidth
                  disabled={loading || hasWon || hasLost}
                  aria-label="Game name"
                  aria-autocomplete="list"
                  aria-expanded={guessOptionsOpen && guessOptions.length > 0}
                  aria-controls="down2guess-options"
                  onFocus={() =>
                    setGuessOptionsOpen(Boolean(guessInput.trim()))
                  }
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setGuessOptionsOpen(false);
                    }
                    if (event.key === "Enter") {
                      setGuessOptionsOpen(false);
                      handleGuess();
                    }
                  }}
                />
              </div>
            }
          >
            <div
              id="down2guess-options"
              className="max-h-64 w-[36rem] max-w-[calc(100vw-3rem)] overflow-y-auto"
            >
              {guessOptions.map((game) => (
                <Dropdown.Item key={game.id} value={game.id}>
                  <span className="inline-flex items-center gap-2">
                    <img
                      src={game.thumbnail ?? "/images/D2J_Icon.png"}
                      alt=""
                      aria-hidden="true"
                      className="h-8 w-12 shrink-0 rounded object-cover"
                    />
                    <span>{game.name}</span>
                  </span>
                </Dropdown.Item>
              ))}
            </div>
          </Dropdown>
          <Button
            icon="search"
            color="green"
            onClick={handleGuess}
            disabled={loading || hasWon || hasLost}
          >
            Guess
          </Button>
          {showHintButton && (
            <Button icon="lightbulb" color="yellow" onClick={handleHint}>
              Hint (-1 life)
            </Button>
          )}
          {(hasWon || hasLost) && (
            <Button icon="rotateccw" onClick={resetGame}>
              New Game
            </Button>
          )}
        </Hstack>
        {!loading && answer && (hasWon || hasLost) && (
          <Text
            size="md"
            weight="semibold"
            color={hasWon ? "green" : "red"}
            align="center"
          >
            {hasWon ? "You got it!" : "Out of lives."} The game was{" "}
            <Link href={`/g/${answer.slug}`}>
              {answerDisplay?.name ?? answer.name ?? "Unknown game"}
            </Link>
            .
          </Text>
        )}
      </Vstack>

      <section aria-label="Guesses">
          <Vstack align="center" gap={2} className="mb-3 text-center">
            <Hstack className="flex-wrap gap-3" aria-label="Comparison legend">
              {([
                ["green", "Match"],
                ["yellow", "Close"],
                ["red", "No match"],
              ] as const).map(([color, label]) => (
                <Hstack key={label} className="gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: colors[color] }}
                  />
                  <Text size="xs" color="textFaded">
                    {label}
                  </Text>
                </Hstack>
              ))}
            </Hstack>
            <Text size="xs" color="textFaded">
              Arrows show whether the answer is higher or lower.
            </Text>
          </Vstack>
          <Table
            classNames={{
              wrapper: "!rounded-md !border-0 !shadow-none",
              table: "table-fixed min-w-[1120px]",
            }}
          >
            <TableHeader style={{ backgroundColor: colors.mantle }}>
              {CATEGORY_LABELS.map((item, index) => {
                return (
                  <TableColumn
                    key={item.key}
                    className={item.key === "name" ? "sticky left-0 z-20" : ""}
                    style={{
                      padding: "0.75rem",
                      textAlign: "center",
                      width: `${100 / CATEGORY_LABELS.length}%`,
                      borderBottom: columnDivider,
                      borderRight:
                        index < CATEGORY_LABELS.length - 1
                          ? columnDivider
                          : undefined,
                      ...(item.key === "name"
                        ? { backgroundColor: colors.mantle }
                        : {}),
                    }}
                  >
                    {item.label}
                  </TableColumn>
                );
              })}
            </TableHeader>
            <TableBody>
              {roundEntries.length === 0 && (
                <TableRow style={{ borderBottom: columnDivider }}>
                  <TableCell colSpan={CATEGORY_LABELS.length}>
                    <Text size="sm" color="textFaded" className="py-4">
                      No guesses yet. Choose a game above to get started.
                    </Text>
                  </TableCell>
                </TableRow>
              )}
              {roundEntries.map((entry) => {
                if (entry.type === "hint") {
                  return (
                    <TableRow
                      key={`hint-${entry.category}`}
                      style={{ borderBottom: columnDivider }}
                    >
                      {CATEGORY_LABELS.map((item, index) => {
                        const revealed = item.key === entry.category;
                        const isLast = index === CATEGORY_LABELS.length - 1;
                        return (
                          <TableCell
                            key={`hint-${entry.category}-${item.key}`}
                            className={`text-center ${
                              item.key === "name" ? "sticky left-0 z-10" : ""
                            }`}
                            style={
                              revealed
                                ? {
                                    ...cellStyle("match"),
                                    borderRight: isLast
                                      ? "none"
                                      : columnDivider,
                                  }
                                : {
                                    backgroundColor: colors.mantle,
                                    borderRight: isLast
                                      ? "none"
                                      : columnDivider,
                                    color: colors.text,
                                    padding: "0.75rem",
                                  }
                            }
                          >
                            {revealed ? renderHintValue(item.key) : null}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                }

                const row = guessRows.find(
                  (guessRow) => guessRow.game.id === entry.gameId,
                );
                if (!row) return null;

                return (
                <TableRow
                  key={`guess-${row.game.id}`}
                  style={{ borderBottom: columnDivider }}
                >
                <TableCell
                  className="sticky left-0 z-10 overflow-hidden font-medium"
                  style={{
                    backgroundColor: colors.mantle,
                    borderRight: columnDivider,
                    color: colors.text,
                    padding: 0,
                  }}
                >
                  <img
                    src={
                      row.game.jamPage?.thumbnail ??
                      row.game.thumbnail ??
                      "/images/D2J_Icon.png"
                    }
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full scale-110 object-cover object-center opacity-65"
                  />
                  <div
                    className="absolute inset-0"
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.42)" }}
                  />
                  <div className="relative flex min-h-16 items-center justify-center px-3 py-2.5 text-center">
                    <span
                      className="font-semibold text-white"
                      style={{ textShadow: "0 1px 4px rgba(0, 0, 0, 0.95)" }}
                    >
                      {row.display.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell
                  className="text-center"
                  style={cellStyle(row.comparisons.platforms.status)}
                >
                  {renderPlatforms(row.display.platforms)}
                </TableCell>
                <TableCell
                  className="text-center"
                  style={cellStyle(row.comparisons.tags.status)}
                >
                  {renderTags(row.display.tags)}
                </TableCell>
                <TableCell
                  className="text-center"
                  style={cellStyle(row.comparisons.flags.status)}
                >
                  {renderFlags(row.display.flags)}
                </TableCell>
                <TableCell
                  className="text-center font-medium"
                  style={cellStyle(row.comparisons.category.status)}
                >
                  {row.display.category}
                </TableCell>
                <TableCell
                  className="text-center tabular-nums"
                  style={cellStyle(row.comparisons.releaseYear.status)}
                >
                  <Hstack justify="center" className="gap-2">
                    <span>{formatNumber(row.display.releaseYear)}</span>
                    {row.comparisons.releaseYear.direction && (
                      <Icon
                        name={
                          row.comparisons.releaseYear.direction === "higher"
                            ? "chevronup"
                            : "chevrondown"
                        }
                        size={18}
                        strokeWidth={3}
                        color="text"
                      />
                    )}
                  </Hstack>
                </TableCell>
                <TableCell
                  className="text-center"
                  style={cellStyle(row.comparisons.engine.status)}
                >
                  {renderTags(row.display.engine)}
                </TableCell>
                <TableCell
                  className="min-w-0 overflow-hidden text-center"
                  style={cellStyle(row.comparisons.developers.status)}
                >
                  {renderDevelopers(row.game)}
                </TableCell>
                <TableCell
                  className="text-center tabular-nums"
                  style={{
                    ...cellStyle(row.comparisons.overallRating.status),
                    borderRight: "none",
                  }}
                >
                  <Hstack justify="center" className="gap-2">
                    <span>{formatRating(row.display.overallRating)}</span>
                    {row.comparisons.overallRating.direction && (
                      <Icon
                        name={
                          row.comparisons.overallRating.direction === "higher"
                            ? "chevronup"
                            : "chevrondown"
                        }
                        size={18}
                        strokeWidth={3}
                        color="text"
                      />
                    )}
                  </Hstack>
                </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
      </section>
    </Vstack>
  );
}
