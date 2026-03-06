"use client";

import { useEffect, useMemo, useState } from "react";
import { addToast } from "bioloom-ui";
import { BASE_URL } from "@/requests/config";
import {
  getGame,
  getGameTags,
  getGames,
  getRatingCategories,
} from "@/requests/game";
import { GameType } from "@/types/GameType";
import { RatingCategoryType } from "@/types/RatingCategoryType";
import { TagType } from "@/types/TagType";
import { Card } from "bioloom-ui";
import { Input } from "bioloom-ui";
import { Button } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "bioloom-ui";
import { Icon } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { Link } from "bioloom-ui";
import { useTheme } from "@/providers/SiteThemeProvider";

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

function normalizeToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function uniqueList(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
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

function compareText(guess: string, answer: string): CompareStatus {
  if (guess.trim().toLowerCase() === answer.trim().toLowerCase()) {
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

function formatList(values: string[]) {
  return values.length > 0 ? values.join(", ") : "No Data";
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
  const allCategories = uniqueList([
    ...game.ratingCategories.map((category) => category.id.toString()),
    ...ratingCategories.map((category) => category.id.toString()),
  ]);

  const overallCategory = [...game.ratingCategories, ...ratingCategories].find(
    (category) => /overall/i.test(category.name)
  );

  if (!overallCategory) {
    return null;
  }

  if (!allCategories.includes(overallCategory.id.toString())) {
    return null;
  }

  const values = game.ratings
    .filter((rating) => rating.categoryId === overallCategory.id)
    .map((rating) => rating.value);

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
  const platforms = uniqueList(
    game.downloadLinks.map((link) => link.platform).sort()
  );

  const engineTags: string[] = [];
  const regularTags: string[] = [];
  for (const tag of game.tags) {
    const categoryName = tagCategoryById.get(tag.id);
    if (isEngineTag(tag.name, categoryName)) {
      engineTags.push(tag.name);
    } else {
      regularTags.push(tag.name);
    }
  }

  return {
    name: game.name,
    platforms,
    tags: uniqueList(regularTags).sort(),
    flags: uniqueList(game.flags.map((flag) => flag.name)).sort(),
    category: game.category,
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

export default function GamedlePage() {
  const { colors } = useTheme();
  const [dataLoading, setDataLoading] = useState(true);
  const [gameLoading, setGameLoading] = useState(true);
  const [answer, setAnswer] = useState<GameType | null>(null);
  const [guessInput, setGuessInput] = useState("");
  const [guesses, setGuesses] = useState<GameType[]>([]);
  const [gamesList, setGamesList] = useState<
    { id: number; slug: string; name: string }[]
  >([]);
  const [allTags, setAllTags] = useState<TagType[]>([]);
  const [ratingCategories, setRatingCategories] = useState<
    RatingCategoryType[]
  >([]);
  const [hintUses, setHintUses] = useState(0);
  const [revealedHints, setRevealedHints] = useState<CategoryKey[]>([]);

  const loading = dataLoading || gameLoading;

  const tagCategoryById = useMemo(() => {
    return new Map(allTags.map((tag) => [tag.id, tag.category?.name ?? ""]));
  }, [allTags]);

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
        const [tagsRes, gamesRes, ratingRes] = await Promise.all([
          getGameTags(),
          getGames("newest"),
          getRatingCategories(true),
        ]);

        const tagsPayload = await tagsRes.json();
        const gamesPayload = await gamesRes.json();
        const ratingPayload = await ratingRes.json();

        if (!cancelled) {
          setAllTags(tagsPayload.data ?? []);
          setRatingCategories(ratingPayload.data ?? []);
          const list = Array.isArray(gamesPayload)
            ? gamesPayload
            : gamesPayload.data;
          setGamesList(
            (list ?? []).map((game: GameType) => ({
              id: game.id,
              slug: game.slug,
              name: game.name,
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
        const randomRes = await fetch(`${BASE_URL}/game`, {
          cache: "no-store",
        });
        const randomPayload = await randomRes.json();
        const slug = randomPayload?.data?.slug;
        if (!slug) {
          throw new Error("No random game returned.");
        }

        const gameRes = await getGame(slug);
        const gamePayload = await gameRes.json();

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
    setHintUses(0);
    setRevealedHints([]);
    setAnswer(null);
    setGameLoading(true);

    try {
      const randomRes = await fetch(`${BASE_URL}/game`, { cache: "no-store" });
      const randomPayload = await randomRes.json();
      const slug = randomPayload?.data?.slug;
      if (!slug) {
        throw new Error("No random game returned.");
      }
      const gameRes = await getGame(slug);
      const gamePayload = await gameRes.json();
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
      const gamePayload = await gameRes.json();
      setGuesses((prev) => [...prev, gamePayload]);
      setGuessInput("");
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
    setHintUses((prev) => prev + 1);
  };

  const cellStyle = (status: CompareStatus) => {
    const styleMap = {
      match: {
        backgroundColor: `${colors.greenDarkDark}cc`,
        borderColor: colors.green,
      },
      partial: {
        backgroundColor: `${colors.yellowDarkDark}cc`,
        borderColor: colors.yellow,
      },
      miss: {
        backgroundColor: `${colors.redDarkDark}cc`,
        borderColor: colors.red,
      },
    };
    return {
      border: `1px solid ${styleMap[status].borderColor}`,
      backgroundColor: styleMap[status].backgroundColor,
      color: colors.text,
    };
  };

  return (
    <Vstack gap={6}>
      <Card>
        <Vstack align="stretch" gap={4}>
          <Hstack justify="between" className="flex-wrap gap-3">
            <Vstack align="start">
              <Hstack>
                <Icon name="gamepad2" color="text" size={18} />
                <Text size="lg" weight="semibold">
                  Gamedle Unlimited
                </Text>
              </Hstack>
              <Text size="sm" color="textFaded">
                Guess the random game in 10 tries.
              </Text>
            </Vstack>
            <Hstack className="gap-1">
              {Array.from({ length: MAX_LIVES }).map((_, index) => (
                <Icon
                  key={`life-${index}`}
                  name="heart"
                  size={16}
                  color={index < livesLeft ? "red" : "textFaded"}
                />
              ))}
              <Text size="xs" color="textFaded">
                {livesLeft} left
              </Text>
            </Hstack>
          </Hstack>

          <Hstack className="flex-wrap gap-2">
            <Input
              value={guessInput}
              onValueChange={setGuessInput}
              placeholder="Type a game name..."
              list="gamedle-games"
              fullWidth
              disabled={loading || hasWon || hasLost}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleGuess();
                }
              }}
            />
            <Button
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
          <datalist id="gamedle-games">
            {gamesList.map((game) => (
              <option key={game.id} value={game.name} />
            ))}
          </datalist>

          {revealedHints.length > 0 && answerDisplay && (
            <Vstack align="start" gap={2}>
              <Text size="sm" color="textFaded">
                Hints (cost 1 life each)
              </Text>
              {revealedHints.map((key) => {
                const label =
                  CATEGORY_LABELS.find((item) => item.key === key)?.label ??
                  key;
                let value = "No Data";
                switch (key) {
                  case "platforms":
                    value = formatList(answerDisplay.platforms);
                    break;
                  case "tags":
                    value = formatList(answerDisplay.tags);
                    break;
                  case "flags":
                    value = formatList(answerDisplay.flags);
                    break;
                  case "category":
                    value = answerDisplay.category || "No Data";
                    break;
                  case "releaseYear":
                    value = formatNumber(answerDisplay.releaseYear);
                    break;
                  case "engine":
                    value = formatList(answerDisplay.engine);
                    break;
                  case "developers":
                    value = formatList(answerDisplay.developers);
                    break;
                  case "overallRating":
                    value = formatRating(answerDisplay.overallRating);
                    break;
                  default:
                    break;
                }

                return (
                  <Text key={`hint-${key}`} size="sm">
                    {label}: {value}
                  </Text>
                );
              })}
            </Vstack>
          )}

          {!loading && answer && (hasWon || hasLost) && (
            <Text size="sm" color={hasWon ? "green" : "red"}>
              {hasWon ? "You got it!" : "Out of lives."} The game was{" "}
              <Link href={`/g/${answer.slug}`}>{answer.name}</Link>.
            </Text>
          )}
        </Vstack>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            {CATEGORY_LABELS.map((item) => (
              <TableColumn key={item.key} className="text-[10px]">
                {item.label}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody>
            {guessRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={CATEGORY_LABELS.length}>
                  <Text size="sm" color="textFaded">
                    No guesses yet.
                  </Text>
                </TableCell>
              </TableRow>
            )}
            {guessRows.map((row) => (
              <TableRow key={`guess-${row.game.id}`}>
                <TableCell style={cellStyle(row.comparisons.name.status)}>
                  {row.display.name}
                </TableCell>
                <TableCell style={cellStyle(row.comparisons.platforms.status)}>
                  {formatList(row.display.platforms)}
                </TableCell>
                <TableCell style={cellStyle(row.comparisons.tags.status)}>
                  {formatList(row.display.tags)}
                </TableCell>
                <TableCell style={cellStyle(row.comparisons.flags.status)}>
                  {formatList(row.display.flags)}
                </TableCell>
                <TableCell style={cellStyle(row.comparisons.category.status)}>
                  {row.display.category}
                </TableCell>
                <TableCell
                  style={cellStyle(row.comparisons.releaseYear.status)}
                >
                  <Hstack className="gap-1">
                    <span>{formatNumber(row.display.releaseYear)}</span>
                    {row.comparisons.releaseYear.direction && (
                      <Icon
                        name={
                          row.comparisons.releaseYear.direction === "higher"
                            ? "chevronup"
                            : "chevrondown"
                        }
                        size={14}
                        color="text"
                      />
                    )}
                  </Hstack>
                </TableCell>
                <TableCell style={cellStyle(row.comparisons.engine.status)}>
                  {formatList(row.display.engine)}
                </TableCell>
                <TableCell style={cellStyle(row.comparisons.developers.status)}>
                  {formatList(row.display.developers)}
                </TableCell>
                <TableCell
                  style={cellStyle(row.comparisons.overallRating.status)}
                >
                  <Hstack className="gap-1">
                    <span>{formatRating(row.display.overallRating)}</span>
                    {row.comparisons.overallRating.direction && (
                      <Icon
                        name={
                          row.comparisons.overallRating.direction === "higher"
                            ? "chevronup"
                            : "chevrondown"
                        }
                        size={14}
                        color="text"
                      />
                    )}
                  </Hstack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </Vstack>
  );
}
