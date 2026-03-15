"use client";

import { use, useMemo, useRef } from "react";
import { useState, useEffect } from "react";
import { getCookie } from "@/helpers/cookie";
import { addToast } from "bioloom-ui";
import { Tabs, Tab } from "bioloom-ui";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "bioloom-ui";
import { Pagination } from "bioloom-ui";
import { GameEmbedAspectRatio, GameType } from "@/types/GameType";
import { UserType } from "@/types/UserType";
import { getGame, getRatingCategories } from "@/requests/game";
import { getSelf } from "@/requests/user";
import Image from "next/image";
import {
  AlertTriangle,
  Award,
  Badge as LucideBadge,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  MessageCircleMore,
  Play,
  Star,
} from "lucide-react";
import CommentCard from "@/components/posts/CommentCard";
import { LeaderboardType } from "@/types/LeaderboardType";
import { deleteScore } from "@/helpers/score";
import { postScore } from "@/requests/score";
import { postRating, postTrackRating } from "@/requests/rating";
import { RatingType } from "@/types/RatingType";
import { RatingCategoryType } from "@/types/RatingCategoryType";
import { ActiveJamResponse, getCurrentJam } from "@/helpers/jam";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import CreateComment from "@/components/create-comment";
import { useTheme } from "@/providers/SiteThemeProvider";
import { Chip } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import ThemedProse from "@/components/themed-prose";
import { Button } from "bioloom-ui";
import { Link } from "bioloom-ui";
import { useTranslations } from "next-intl";
import { Text } from "bioloom-ui";
import { Tooltip } from "bioloom-ui";
import SidebarSong from "@/components/sidebar/SidebarSong";
import { BASE_URL } from "@/requests/config";
import { Popover } from "bioloom-ui";
import { Modal } from "bioloom-ui";
import { Icon, IconName } from "bioloom-ui";
import MentionedContent from "@/components/mentions/MentionedContent";
import { useEffectiveHideRatings } from "@/hooks/useEffectiveHideRatings";
import RatingVisibilityGate from "@/components/ratings/RatingVisibilityGate";
import { Card } from "bioloom-ui";
import { Avatar } from "bioloom-ui";
import { getTrackRatingCategories } from "@/requests/track";
import { TrackRatingCategoryType } from "@/types/TrackRatingCategoryType";

const platformOrder: Record<string, number> = {
  Windows: 1,
  MacOS: 2,
  Linux: 3,
  Web: 4,
  Mobile: 5,
};

const ITCH_EMBED_STALL_TIMEOUT_MS = 12000;

const inputMethodMeta: Record<string, { label: string; icon?: IconName }> = {
  KeyboardMouse: { label: "Keyboard + Mouse", icon: "keyboard" },
  Gamepad: { label: "Gamepad / Controller", icon: "gamepad2" },
  Touch: { label: "Touch", icon: "touchpad" },
  KeyboardOnly: { label: "Keyboard Only", icon: "keyboard" },
  MouseOnly: { label: "Mouse Only", icon: "mouse" },
  Motion: { label: "Motion Controls", icon: "move3d" },
  VR: { label: "VR", icon: "headset" },
  Other: { label: "Other", icon: "morehorizontal" },
};

function getPlatformIcon(platform: string): IconName | undefined {
  switch (platform) {
    case "Linux":
      return "silinux";
    case "Mobile":
      return "smartphone";
    case "Windows":
      return "grid2x2";
    case "MacOS":
      return "custommacos";
    case "Web":
      return "sihtml5";
    default:
      return undefined;
  }
}

function gradientTextStyle(
  gradient: string,
  fallback: string,
): React.CSSProperties {
  return {
    backgroundImage: gradient,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    color: fallback,
  };
}

function toCanonicalItchEmbedUrl(url?: string | null) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.replace(/\/+$/, "");

    if (hostname !== "itch.io") return null;
    if (!/^\/embed(?:-upload)?\/\d+$/.test(pathname)) return null;

    return `https://itch.io${pathname}${parsed.search}`;
  } catch {
    return null;
  }
}

const ITCH_EMBED_ASPECT_RATIO_OPTIONS: GameEmbedAspectRatio[] = [
  "16 / 9",
  "16 / 10",
  "21 / 9",
  "4 / 3",
  "5 / 4",
  "1 / 1",
  "3 / 2",
  "2 / 3",
  "3 / 4",
  "9 / 16",
  "10 / 16",
];

function normalizeItchEmbedAspectRatio(
  value?: string | null,
): GameEmbedAspectRatio {
  if (
    value &&
    ITCH_EMBED_ASPECT_RATIO_OPTIONS.includes(value as GameEmbedAspectRatio)
  ) {
    return value as GameEmbedAspectRatio;
  }
  return "16 / 9";
}

const YT_ID_REGEX =
  /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/;

function extractYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(YT_ID_REGEX);
  return match ? match[1] : null;
}

type GameMediaItem =
  | { type: "trailer"; id: string; thumbnail: string }
  | { type: "screenshot"; src: string; index: number };

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: (() => void) | null;
  }
}

function getPlacementGradient(
  placement: number,
  colors: Record<string, string>,
) {
  if (placement === 1)
    return {
      gradient: `linear-gradient(90deg, ${colors["yellow"]}, ${colors["red"]})`,
      first: colors["red"],
    };
  if (placement === 2)
    return {
      gradient: `linear-gradient(90deg, ${colors["green"]}, ${colors["gray"]})`,
      first: colors["gray"],
    };
  if (placement === 3)
    return {
      gradient: `linear-gradient(90deg, ${colors["red"]}, ${colors["pink"]})`,
      first: colors["pink"],
    };
  if (placement >= 4 && placement <= 5)
    return {
      gradient: `linear-gradient(90deg, ${colors["blue"]}, ${colors["indigo"]})`,
      first: colors["indigo"],
    };
  if (placement >= 6 && placement <= 10)
    return {
      gradient: `linear-gradient(90deg, ${colors["purple"]}, ${colors["violet"]})`,
      first: colors["violet"],
    };
  return {
    gradient: `linear-gradient(90deg, ${colors["textFaded"]}, ${colors["textFaded"]})`,
    first: colors["textFaded"],
  };
}

export default function ClientGamePage({
  params,
}: {
  params: Promise<{ gameSlug: string }>;
}) {
  const resolvedParams = use(params);
  const gameSlug = resolvedParams.gameSlug;
  const [game, setGame] = useState<GameType | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [page, setPage] = useState(1);
  const [selectedScore, setSelectedScore] = useState<string>("");
  const [selectedLeaderboard, setSelectedLeaderboard] =
    useState<LeaderboardType>();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isOpen2, setIsOpen2] = useState<boolean>(false);
  const [hoverStars, setHoverStars] = useState<{ [key: number]: number }>({});
  const [hoverCategory, setHoverCategory] = useState<number | null>(null);
  const [selectedStars, setSelectedStars] = useState<{ [key: number]: number }>(
    {},
  );
  const [ratingCategories, setRatingCategories] = useState<
    RatingCategoryType[]
  >([]);
  const [trackSelectedStars, setTrackSelectedStars] = useState<
    Record<number, number>
  >({});
  const [trackOverallCategory, setTrackOverallCategory] =
    useState<TrackRatingCategoryType | null>(null);
  const effectiveHideRatings = useEffectiveHideRatings(user);
  const [activeJamResponse, setActiveJamResponse] =
    useState<ActiveJamResponse | null>(null);
  const [isItchEmbedActive, setIsItchEmbedActive] = useState(false);
  const [itchEmbedAttempt, setItchEmbedAttempt] = useState(0);
  const [showItchEmbedRecovery, setShowItchEmbedRecovery] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isScreenshotViewerOpen, setIsScreenshotViewerOpen] = useState(false);
  const trailerFrameRef = useRef<HTMLIFrameElement | null>(null);

  const { siteTheme, colors } = useTheme();
  const t = useTranslations();

  const engagedUserIds = useMemo(() => {
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
      const uid = r?.userId;
      if (uid != null) ids.add(uid);
    }

    return ids;
  }, [game]);

  type RarityTier =
    | "Abyssal"
    | "Diamond"
    | "Gold"
    | "Silver"
    | "Bronze"
    | "Default";
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

  const rarityStyles: Record<
    RarityTier,
    { border: string; glow?: string; text: string }
  > = {
    Abyssal: {
      border: colors["magenta"] + "99",
      glow: `0 0 12px ${colors["magentaDark"] + "99"}`,
      text: colors["magenta"],
    },
    Diamond: {
      border: colors["blue"] + "99",
      glow: `0 0 10px ${colors["blueDark"] + "99"}`,
      text: colors["blue"],
    },
    Gold: {
      border: colors["yellow"] + "99",
      glow: `0 0 10px ${colors["yellowDark"] + "99"}`,
      text: colors["yellow"],
    },
    Silver: {
      border: colors["gray"] + "99",
      glow: `0 0 8px ${colors["gray"] + "99"}`,
      text: colors["gray"],
    },
    Bronze: {
      border: colors["orange"] + "99",
      glow: `0 0 8px ${colors["orangeDark"] + "99"}`,
      text: colors["orange"],
    },
    Default: { border: colors["base"] + "99", text: colors["textFaded"] },
  };

  useEffect(() => {
    const fetchGameAndUser = async () => {
      const gameResponse = await getGame(gameSlug);

      let gameData;
      if (gameResponse.ok) {
        gameData = await gameResponse.json();

        setGame(gameData);
      }

      const ratingResponse = await getRatingCategories(true);
      const ratingCategories = await ratingResponse.json();
      setRatingCategories(ratingCategories.data);

      const trackRatingResponse = await getTrackRatingCategories();
      if (trackRatingResponse.ok) {
        const payload = await trackRatingResponse.json();
        const overall =
          payload?.data?.find(
            (category: TrackRatingCategoryType) => category.name === "Overall",
          ) ?? null;
        setTrackOverallCategory(overall);
      }

      const jamData = await getCurrentJam();
      setActiveJamResponse(jamData);

      // Fetch the logged-in user data
      if (getCookie("token")) {
        try {
          const userResponse = await getSelf();

          if (userResponse.ok) {
            const userData = await userResponse.json();
            setUser(userData);

            if (gameData) {
              const ratings = userData.ratings
                .filter((rating: RatingType) => rating.gameId == gameData.id)
                .reduce(
                  (
                    acc: { [key: number]: number },
                    rating: { categoryId: number; value: number },
                  ) => {
                    acc[rating.categoryId] = rating.value;
                    return acc;
                  },
                  {},
                );

              setSelectedStars(ratings);

              const trackRatings = (userData.trackRatings ?? []).reduce(
                (
                  acc: Record<number, number>,
                  rating: {
                    trackId: number;
                    value: number;
                    categoryId: number;
                  },
                ) => {
                  acc[rating.trackId] = rating.value;
                  return acc;
                },
                {},
              );

              setTrackSelectedStars(trackRatings);
            }
          }
        } catch (error) {
          console.error(error);
        }
      }
    };

    fetchGameAndUser();
  }, [gameSlug]);

  useEffect(() => {
    setIsItchEmbedActive(false);
    setItchEmbedAttempt(0);
    setShowItchEmbedRecovery(false);
  }, [gameSlug]);

  useEffect(() => {
    setCurrentMediaIndex(0);
  }, [gameSlug]);

  function ordinal_suffix_of(i: number) {
    const j = i % 10,
      k = i % 100;
    if (j === 1 && k !== 11) {
      return i + "st";
    }
    if (j === 2 && k !== 12) {
      return i + "nd";
    }
    if (j === 3 && k !== 13) {
      return i + "rd";
    }
    return i + "th";
  }

  const uploadEvidence = async (file: File) => {
    const formData = new FormData();
    formData.append("upload", file);

    const endpoint =
      process.env.NEXT_PUBLIC_MODE === "PROD"
        ? "https://d2jam.com/api/v1/image"
        : "http://localhost:3005/api/v1/image";

    const res = await fetch(endpoint, {
      method: "POST",
      body: formData,
      headers: { authorization: `Bearer ${getCookie("token")}` },
      credentials: "include",
    });

    if (!res.ok) {
      addToast({ title: "Failed to upload image" });
      throw new Error("Upload failed");
    }
    const json = await res.json();
    addToast({ title: json.message });
    return json.data as string; // URL
  };

  const itchEmbedUrl = toCanonicalItchEmbedUrl(game?.itchEmbedUrl);
  const itchEmbedAspectRatio = normalizeItchEmbedAspectRatio(
    game?.itchEmbedAspectRatio,
  );
  const activeItchEmbedUrl = useMemo(() => {
    if (!itchEmbedUrl) return null;

    const url = new URL(itchEmbedUrl);
    if (itchEmbedAttempt > 0) {
      url.searchParams.set("d2jam_retry", String(itchEmbedAttempt));
    }
    return url.toString();
  }, [itchEmbedAttempt, itchEmbedUrl]);
  const itchGamePageUrl = useMemo(() => {
    const links = game?.downloadLinks ?? [];

    const preferredLink = links.find((link) => {
      try {
        const parsed = new URL(link.url);
        const hostname = parsed.hostname.toLowerCase();
        const pathname = parsed.pathname.replace(/\/+$/, "");

        if (!hostname.endsWith("itch.io")) return false;
        return !/^\/embed(?:-upload)?\/\d+$/.test(pathname);
      } catch {
        return false;
      }
    });

    return preferredLink?.url ?? itchEmbedUrl;
  }, [game?.downloadLinks, itchEmbedUrl]);

  useEffect(() => {
    if (!isItchEmbedActive || !itchEmbedUrl) {
      setShowItchEmbedRecovery(false);
      return;
    }

    setShowItchEmbedRecovery(false);
    const timeoutId = window.setTimeout(() => {
      setShowItchEmbedRecovery(true);
    }, ITCH_EMBED_STALL_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isItchEmbedActive, itchEmbedAttempt, itchEmbedUrl]);

  const trailerId = extractYouTubeId(game?.trailerUrl);
  const screenshots = (game?.screenshots ?? []).filter(Boolean);
  const mediaItems = useMemo<GameMediaItem[]>(() => {
    const items: GameMediaItem[] = [];

    if (trailerId) {
      items.push({
        type: "trailer",
        id: trailerId,
        thumbnail: `https://img.youtube.com/vi/${trailerId}/mqdefault.jpg`,
      });
    }

    for (let index = 0; index < screenshots.length; index += 1) {
      const src = screenshots[index];
      items.push({ type: "screenshot", src, index });
    }

    return items;
  }, [screenshots, trailerId]);
  const selectedMedia = mediaItems[currentMediaIndex] ?? null;
  const hasMedia = Boolean(trailerId || screenshots.length > 0);
  const trailerPlayerId = trailerId && game ? `game-trailer-${game.id}` : null;
  const firstScreenshotIndex = mediaItems.findIndex(
    (item) => item.type === "screenshot",
  );
  const gameplayDetails = (game?.inputMethods ?? [])
    .map((method) => inputMethodMeta[method])
    .filter(Boolean);
  const playtimeDetails = [
    { label: "Per run", value: game?.estOneRun },
    { label: "To beat", value: game?.estAnyPercent },
    { label: "100%", value: game?.estHundredPercent },
  ].filter((entry) => entry.value);
  const gameEmotes = game?.gameEmotes ?? [];
  const hasGameplayDetails =
    gameplayDetails.length > 0 || playtimeDetails.length > 0;

  useEffect(() => {
    if (!selectedMedia || mediaItems.length === 0) {
      setCurrentMediaIndex(0);
      return;
    }

    if (currentMediaIndex >= mediaItems.length) {
      setCurrentMediaIndex(0);
    }
  }, [currentMediaIndex, mediaItems, selectedMedia]);

  const subscribeToTrailerEvents = () => {
    const iframeWindow = trailerFrameRef.current?.contentWindow;
    if (!iframeWindow || !trailerPlayerId) return;

    const messages = [
      { event: "listening", id: trailerPlayerId, channel: "widget" },
      {
        event: "command",
        func: "addEventListener",
        args: ["onStateChange"],
        id: trailerPlayerId,
        channel: "widget",
      },
    ];

    for (const message of messages) {
      iframeWindow.postMessage(
        JSON.stringify(message),
        "https://www.youtube-nocookie.com",
      );
      iframeWindow.postMessage(
        JSON.stringify(message),
        "https://www.youtube.com",
      );
    }
  };

  useEffect(() => {
    if (
      !selectedMedia ||
      selectedMedia.type !== "trailer" ||
      firstScreenshotIndex < 0
    ) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin !== "https://www.youtube-nocookie.com" &&
        event.origin !== "https://www.youtube.com"
      ) {
        return;
      }

      let payload: unknown = event.data;
      if (typeof payload === "string") {
        try {
          payload = JSON.parse(payload);
        } catch {
          return;
        }
      }

      if (
        typeof payload === "object" &&
        payload !== null &&
        "event" in payload &&
        "info" in payload
      ) {
        const ytPayload = payload as {
          event?: string;
          info?: number;
        };

        if (ytPayload.event === "onStateChange" && ytPayload.info === 0) {
          setCurrentMediaIndex(firstScreenshotIndex);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    subscribeToTrailerEvents();

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [firstScreenshotIndex, selectedMedia, trailerPlayerId]);

  useEffect(() => {
    if (!selectedMedia || selectedMedia.type !== "screenshot") return;

    const screenshotIndices = mediaItems.reduce<number[]>(
      (acc, item, index) => {
        if (item.type === "screenshot") acc.push(index);
        return acc;
      },
      [],
    );

    if (screenshotIndices.length <= 1) return;

    const currentScreenshotPosition =
      screenshotIndices.indexOf(currentMediaIndex);
    if (currentScreenshotPosition === -1) return;

    const timeout = window.setTimeout(() => {
      const nextIndex =
        screenshotIndices[
          (currentScreenshotPosition + 1) % screenshotIndices.length
        ];
      setCurrentMediaIndex(nextIndex);
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [currentMediaIndex, mediaItems, selectedMedia]);

  const showPreviousMedia = () => {
    if (mediaItems.length <= 1) return;
    setCurrentMediaIndex((prev) =>
      prev === 0 ? mediaItems.length - 1 : prev - 1,
    );
  };

  const showNextMedia = () => {
    if (mediaItems.length <= 1) return;
    setCurrentMediaIndex((prev) =>
      prev === mediaItems.length - 1 ? 0 : prev + 1,
    );
  };

  if (!game) return <div>Loading...</div>;

  // Check if the logged-in user is the creator or a contributor
  const isEditable =
    user &&
    game.team.users.some((contributor: UserType) => contributor.id === user.id);

  if (!game.published && !isEditable) {
    return <p>This game has not been published</p>;
  }

  return (
    <>
      <div
        style={{
          backgroundColor: siteTheme.colors["mantle"],
          borderColor: siteTheme.colors["base"],
          color: siteTheme.colors["text"],
        }}
        className="border-2 relative rounded-xl overflow-visible"
      >
        <div
          className="h-60 relative"
          style={{
            backgroundColor: colors["base"],
          }}
        >
          {(game.thumbnail || game.banner) && (
            <Image
              src={game.banner || game.thumbnail || ""}
              alt={`${game.name}'s banner`}
              className="object-cover"
              fill
            />
          )}
        </div>
        <div
          className="flex -mt-2 backdrop-blur-md border-t-1"
          style={{
            borderColor: colors["crust"],
          }}
        >
          <div className="w-2/3 p-4 flex flex-col gap-4">
            <div>
              <p className="text-4xl">{game.name}</p>
              <Hstack>
                <p
                  style={{
                    color: colors["textFaded"],
                  }}
                >
                  By{" "}
                  {game.team.name ||
                    (game.team.users.length == 1
                      ? game.team.owner.name
                      : `${game.team.owner.name}'s team`)}{" "}
                </p>
                <Chip
                  className="opacity-50"
                  color={
                    game.category == "REGULAR"
                      ? "blue"
                      : game.category == "ODA"
                        ? "purple"
                        : "pink"
                  }
                  key={game.category}
                >
                  {game.category}
                </Chip>
              </Hstack>
            </div>
            {itchEmbedUrl && (
              <div
                className="w-full rounded-xl overflow-hidden relative"
                style={{
                  aspectRatio: itchEmbedAspectRatio,
                  backgroundColor: colors["base"],
                  border: `1px solid ${colors["crust"]}`,
                }}
              >
                {isItchEmbedActive ? (
                  <>
                    <iframe
                      key={activeItchEmbedUrl}
                      src={activeItchEmbedUrl ?? itchEmbedUrl}
                      title={`${game.name} playable embed`}
                      className="w-full h-full"
                      style={{ border: 0 }}
                      allowFullScreen
                    />
                    {showItchEmbedRecovery && (
                      <div
                        className="absolute bottom-4 left-1/2 z-10 flex w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 flex-col gap-3 rounded-xl p-4 backdrop-blur-sm"
                        style={{
                          backgroundColor: `${colors["mantle"]}F2`,
                          border: `1px solid ${colors["surface0"]}`,
                          boxShadow: `0 18px 48px ${colors["crust"]}66`,
                        }}
                      >
                        <Text
                          className="font-semibold"
                          style={{ color: colors["text"] }}
                        >
                          Embed still loading?
                        </Text>
                        <Text style={{ color: colors["subtext0"] }}>
                          This linked web build may be outdated. Let the
                          developer know and open the game on itch directly.
                        </Text>
                        <div className="flex flex-wrap gap-3">
                          <Button
                            color="blue"
                            onClick={() => {
                              setShowItchEmbedRecovery(false);
                              setItchEmbedAttempt((current) => current + 1);
                            }}
                          >
                            Retry embed
                          </Button>
                          <Link
                            href={itchGamePageUrl ?? itchEmbedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-md px-4 py-2"
                            style={{
                              backgroundColor: colors["surface0"],
                              color: colors["text"],
                              border: `1px solid ${colors["surface1"]}`,
                            }}
                          >
                            Open on itch
                          </Link>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsItchEmbedActive(true)}
                    className="absolute inset-0 flex cursor-pointer items-center justify-center transition-opacity hover:opacity-95"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(0, 0, 0, 0.12) 0%, rgba(0, 0, 0, 0.38) 100%)",
                    }}
                    aria-label={`Play ${game.name}`}
                  >
                    <div
                      className="flex flex-col items-center gap-3"
                      style={{ color: colors["text"] }}
                    >
                      <div
                        className="flex items-center justify-center rounded-full"
                        style={{
                          width: "4.5rem",
                          height: "4.5rem",
                          backgroundColor: colors["mantle"],
                          border: `1px solid ${colors["surface0"]}`,
                          boxShadow: `0 16px 32px ${colors["crust"]}66`,
                        }}
                      >
                        <Play
                          size={28}
                          fill="currentColor"
                          style={{ marginLeft: "0.2rem" }}
                        />
                      </div>
                      <Text
                        className="font-semibold"
                        style={{ color: colors["text"] }}
                      >
                        Click to play
                      </Text>
                    </div>
                  </button>
                )}
              </div>
            )}
            <ThemedProse>
              <MentionedContent
                html={game?.description || t("General.NoDescription")}
              />
            </ThemedProse>
            <Hstack>
              {[
                ...new Set(
                  game.downloadLinks.sort(
                    (a, b) =>
                      (platformOrder[a.platform] ?? 99) -
                      (platformOrder[b.platform] ?? 99),
                  ),
                ),
              ].map((downloadLink) => (
                <Button
                  icon={getPlatformIcon(downloadLink.platform)}
                  key={downloadLink.id}
                  href={downloadLink.url}
                >
                  {downloadLink.platform}
                </Button>
              ))}
            </Hstack>
          </div>
          <div className="flex flex-col w-1/3 gap-4 p-4">
            <Card className="order-40">
              <Vstack align="stretch">
                <Hstack>
                  {isEditable && (
                    <div>
                      <Button icon="squarepen" href={`/g/${game.slug}/edit`}>
                        Edit
                      </Button>
                    </div>
                  )}
                  {isEditable && game.category != "ODA" && (
                    <div>
                      <Button icon="users" href={`/team`}>
                        Edit Team
                      </Button>
                    </div>
                  )}
                </Hstack>
                <>
                  <p
                    className="text-xs"
                    style={{
                      color: colors["textFaded"],
                    }}
                  >
                    AUTHORS
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {game.team.users.map((user) => (
                      <Chip
                        key={user.id}
                        avatarSrc={user.profilePicture}
                        href={`/u/${user.slug}`}
                      >
                        {user.name}
                      </Chip>
                    ))}
                  </div>
                </>

                {game.tags && game.tags.length > 0 && (
                  <>
                    <p
                      className="text-xs"
                      style={{
                        color: colors["textFaded"],
                      }}
                    >
                      TAGS
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {game.tags.map((tag) => (
                        <Chip key={tag.id}>{tag.name}</Chip>
                      ))}
                    </div>
                  </>
                )}
                {game.flags && game.flags.length > 0 && (
                  <>
                    <p
                      className="text-xs"
                      style={{
                        color: colors["textFaded"],
                      }}
                    >
                      FLAGS
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {game.flags.map((flag) => (
                        <Chip key={flag.id}>{flag.name}</Chip>
                      ))}
                    </div>
                  </>
                )}
                {game.downloadLinks && game.downloadLinks.length > 0 && (
                  <>
                    <p
                      className="text-xs"
                      style={{
                        color: colors["textFaded"],
                      }}
                    >
                      LINKS
                    </p>
                    <div className="flex flex-col gap-2 items-start">
                      {game.downloadLinks.map((link) => (
                        <Link key={link.id} href={link.url}>
                          {getPlatformIcon(link.platform) && (
                            <Icon
                              size={12}
                              name={getPlatformIcon(link.platform)}
                            />
                          )}
                          {link.platform}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </Vstack>
            </Card>
            {hasMedia && (
              <Card className="order-20">
                <Vstack align="stretch" gap={3}>
                  <p
                    className="text-xs"
                    style={{
                      color: colors["textFaded"],
                    }}
                  >
                    MEDIA
                  </p>
                  {selectedMedia && (
                    <>
                      <div
                        className="relative w-full overflow-hidden rounded-xl"
                        style={{
                          aspectRatio: "16 / 9",
                          backgroundColor: colors["base"],
                          border: `1px solid ${colors["crust"]}`,
                        }}
                      >
                        {selectedMedia.type === "trailer" ? (
                          <iframe
                            id={trailerPlayerId ?? undefined}
                            ref={trailerFrameRef}
                            src={`https://www.youtube-nocookie.com/embed/${selectedMedia.id}?enablejsapi=1&rel=0&origin=${encodeURIComponent(
                              typeof window === "undefined"
                                ? BASE_URL
                                : window.location.origin,
                            )}`}
                            title={`${game.name} trailer`}
                            className="h-full w-full"
                            style={{ border: 0 }}
                            onLoad={subscribeToTrailerEvents}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsScreenshotViewerOpen(true)}
                            className="block h-full w-full cursor-pointer"
                          >
                            <img
                              src={selectedMedia.src}
                              alt={`${game.name} screenshot ${selectedMedia.index + 1}`}
                              className="block h-full w-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          </button>
                        )}
                        {mediaItems.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={showPreviousMedia}
                              className="absolute left-3 top-1/2 z-10 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-full p-2 transition-colors"
                              style={{
                                backgroundColor: `${colors["mantle"]}dd`,
                                color: colors["text"],
                                border: `1px solid ${colors["surface0"]}`,
                              }}
                              aria-label="Show previous media"
                            >
                              <ChevronLeft size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={showNextMedia}
                              className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-full p-2 transition-colors"
                              style={{
                                backgroundColor: `${colors["mantle"]}dd`,
                                color: colors["text"],
                                border: `1px solid ${colors["surface0"]}`,
                              }}
                              aria-label="Show next media"
                            >
                              <ChevronRight size={18} />
                            </button>
                          </>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 xl:grid-cols-6">
                        {mediaItems.map((item, index) => {
                          const isSelected = index === currentMediaIndex;
                          const thumbnailSrc =
                            item.type === "trailer" ? item.thumbnail : item.src;
                          const label =
                            item.type === "trailer"
                              ? "Trailer"
                              : `Screenshot ${item.index + 1}`;

                          return (
                            <button
                              key={
                                item.type === "trailer"
                                  ? `trailer-${item.id}`
                                  : `${item.src}-${item.index}`
                              }
                              type="button"
                              onClick={() => setCurrentMediaIndex(index)}
                              className="relative cursor-pointer overflow-hidden rounded-lg text-left transition-all"
                              style={{
                                aspectRatio: "16 / 9",
                                border: `1px solid ${
                                  isSelected ? colors["blue"] : colors["crust"]
                                }`,
                                boxShadow: isSelected
                                  ? `0 0 0 1px ${colors["blue"]}`
                                  : "none",
                                backgroundColor: colors["base"],
                              }}
                              aria-label={`Show ${label.toLowerCase()}`}
                            >
                              <img
                                src={thumbnailSrc}
                                alt={`${game.name} ${label.toLowerCase()}`}
                                className={`h-full w-full object-cover transition ${
                                  isSelected
                                    ? "brightness-100"
                                    : "brightness-75 hover:brightness-100"
                                }`}
                                loading="lazy"
                                decoding="async"
                              />
                              {item.type === "trailer" && (
                                <div
                                  className="absolute inset-0 flex items-center justify-center"
                                  style={{
                                    background:
                                      "linear-gradient(180deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.34) 100%)",
                                  }}
                                >
                                  <Play
                                    size={24}
                                    fill="currentColor"
                                    style={{ color: "#fff" }}
                                  />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </Vstack>
              </Card>
            )}
            {hasGameplayDetails && (
              <Card className="order-25">
                <Vstack align="stretch" gap={3}>
                  {gameplayDetails.length > 0 && (
                    <>
                      <p
                        className="text-xs"
                        style={{
                          color: colors["textFaded"],
                        }}
                      >
                        INPUT METHODS
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {gameplayDetails.map((method) => (
                          <Chip key={method.label} icon={method.icon}>
                            {method.label}
                          </Chip>
                        ))}
                      </div>
                    </>
                  )}
                  {playtimeDetails.length > 0 && (
                    <>
                      <p
                        className="text-xs"
                        style={{
                          color: colors["textFaded"],
                        }}
                      >
                        PLAYTIME
                      </p>
                      <Vstack align="stretch" gap={2}>
                        <div className="grid grid-cols-1 gap-2">
                          {playtimeDetails.map((entry) => (
                            <div
                              key={entry.label}
                              className="flex items-center justify-between rounded-lg px-3 py-2"
                              style={{
                                backgroundColor: colors["base"],
                              }}
                            >
                              <Text size="sm" color="textFaded">
                                {entry.label}
                              </Text>
                              <Text size="sm" color="textFaded">
                                {entry.value}
                              </Text>
                            </div>
                          ))}
                        </div>
                      </Vstack>
                    </>
                  )}
                </Vstack>
              </Card>
            )}
            <Card>
              <Vstack align="start">
                <p
                  className="text-xs"
                  style={{
                    color: colors["textFaded"],
                  }}
                >
                  RATINGS
                </p>
                {activeJamResponse &&
                  activeJamResponse?.jam?.id != game.jamId && (
                    <>
                      {Object.keys(game?.scores || {})
                        .sort(
                          (a, b) =>
                            (game.scores[a].placement || 0) -
                            (game.scores[b].placement || 0),
                        )
                        .map((score) => {
                          const { gradient, first } = getPlacementGradient(
                            game.scores[score].placement,
                            colors,
                          );

                          return (
                            <div
                              key={score}
                              className="grid grid-cols-[150px_100px_60px_30px] items-center gap-2"
                            >
                              <span
                                style={{
                                  color: colors["textFaded"],
                                }}
                                className="text-sm"
                              >
                                {t(score)}:
                              </span>
                              <span
                                style={gradientTextStyle(gradient, first)}
                                className="w-fit"
                              >
                                {(game.scores[score].averageScore / 2).toFixed(
                                  2,
                                )}{" "}
                                stars
                              </span>
                              {game.scores[score].placement &&
                                game.scores[score].placement !== -1 && (
                                  <span
                                    style={{
                                      color: colors["textFaded"],
                                    }}
                                  >
                                    (
                                    {ordinal_suffix_of(
                                      game.scores[score].placement,
                                    )}
                                    )
                                  </span>
                                )}
                              <span className="flex items-center justify-center">
                                {game.scores[score].placement >= 1 &&
                                  game.scores[score].placement <= 3 && (
                                    <Award
                                      size={16}
                                      style={{
                                        color: first,
                                      }}
                                    />
                                  )}
                                {game.scores[score].placement >= 4 &&
                                  game.scores[score].placement <= 10 && (
                                    <LucideBadge
                                      size={12}
                                      style={{
                                        color: first,
                                      }}
                                    />
                                  )}
                              </span>
                            </div>
                          );
                        })}
                      <div className="w-96 h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart
                            cx="50%"
                            cy="50%"
                            outerRadius="80%"
                            data={Object.keys(game?.scores || {}).map(
                              (score) => ({
                                subject: t(score),
                                A: game.scores[score].averageScore / 2,
                                B: game.scores[score].averageUnrankedScore / 2,
                                fullMark: 5,
                              }),
                            )}
                          >
                            <PolarGrid stroke={colors["crust"]} />
                            <PolarAngleAxis
                              dataKey="subject"
                              tick={{ fill: colors["textFaded"], fontSize: 14 }}
                            />
                            <PolarRadiusAxis
                              domain={[0, 5]}
                              axisLine={false}
                              tick={false}
                            />
                            <Radar
                              name="All"
                              dataKey="B"
                              stroke={colors["magenta"]}
                              fill={colors["magentaDark"]}
                              fillOpacity={0.6}
                            />
                            <Radar
                              name="Ranked"
                              dataKey="A"
                              stroke={colors["blue"]}
                              fill={colors["blueDark"]}
                              fillOpacity={0.6}
                            />
                            <Legend />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}
                {isEditable && activeJamResponse?.jam?.id == game.jamId && (
                  <Text size="xs" color="textFaded">
                    You can&apos;t rate your own game
                  </Text>
                )}
                {!user && activeJamResponse?.jam?.id == game.jamId && (
                  <Text size="xs" color="textFaded">
                    You must be logged in to rate games
                  </Text>
                )}
                {!isEditable &&
                  user?.teams.filter((team) => team.game && team.game.published)
                    .length == 0 &&
                  activeJamResponse?.jam?.id == game.jamId &&
                  activeJamResponse?.phase != "Rating" &&
                  activeJamResponse?.phase != "Submission" && (
                    <Text size="xs" color="textFaded">
                      It is not the rating period
                    </Text>
                  )}
                {!isEditable &&
                  user?.teams.filter((team) => team.game && team.game.published)
                    .length == 0 &&
                  activeJamResponse?.jam?.id == game.jamId &&
                  (activeJamResponse?.phase == "Rating" ||
                    activeJamResponse?.phase == "Submission") && (
                    <Text size="xs" color="textFaded">
                      Your ratings will not count towards the rankings as you
                      did not submit a game
                    </Text>
                  )}
                <div>
                  {user &&
                    !isEditable &&
                    activeJamResponse?.jam?.id == game.jamId &&
                    (activeJamResponse?.phase == "Rating" ||
                      activeJamResponse?.phase == "Submission") && (
                      <Vstack align="start">
                        <RatingVisibilityGate
                          hiddenByPreference={effectiveHideRatings}
                          hiddenText="Ratings are hidden by your settings."
                        >
                          <Vstack align="start">
                            <Text size="xs" color="textFaded">
                              Ratings are automatically saved
                            </Text>
                            {[...game.ratingCategories, ...ratingCategories]
                              .sort((a, b) => b.order - a.order)
                              .map((ratingCategory) => (
                                <StarRow
                                  key={ratingCategory.id}
                                  id={ratingCategory.id}
                                  name={t(ratingCategory.name)}
                                  text={
                                    ratingCategory.name == "Theme"
                                      ? game.themeJustification
                                      : ""
                                  }
                                  description={t(ratingCategory.description)}
                                  hoverStars={hoverStars}
                                  setHoverStars={setHoverStars}
                                  hoverCategory={hoverCategory}
                                  setHoverCategory={setHoverCategory}
                                  selectedStars={selectedStars}
                                  setSelectedStars={setSelectedStars}
                                  gameId={game.id}
                                />
                              ))}
                          </Vstack>
                        </RatingVisibilityGate>
                        <Text size="sm" color="textFaded">
                          Leave some feedback for the creators - what did you
                          like, what could be improved? (shows below the game
                          page)
                        </Text>
                        <CreateComment gameId={game.id} size="xs" />
                      </Vstack>
                    )}
                </div>
              </Vstack>
            </Card>
            {game.achievements && game.achievements.length > 0 && (
              <Card className="order-30">
                <Vstack align="start">
                  <p
                    className="text-xs"
                    style={{
                      color: colors["textFaded"],
                    }}
                  >
                    ACHIEVEMENTS
                  </p>

                  <Text color="textFaded" size="xs">
                    You&apos;ve unlocked{" "}
                    {
                      game.achievements.filter(
                        (achievement) =>
                          achievement.users.filter(
                            (user2) => user?.id === user2.id,
                          ).length > 0,
                      ).length
                    }
                    /{game.achievements.length}
                  </Text>

                  <Hstack wrap>
                    {game.achievements
                      .sort((a, b) => {
                        const haveCount = a.users.length;
                        const haveCountB = b.users.length;
                        const users = engagedUserIds.size;
                        return haveCountB / users - haveCount / users;
                      })
                      .map((achievement) => {
                        const haveCount = achievement.users.length;
                        const isLoggedIn = Boolean(user);
                        const hasAchievement = achievement.users.some(
                          (u) => u.id === user?.id,
                        );
                        const { tier, pct } = getRarityTier(
                          haveCount,
                          engagedUserIds.size,
                        );
                        const style = rarityStyles[tier];

                        return (
                          <div key={achievement.id} className="relative">
                            <Tooltip
                              position="top"
                              content={
                                <Vstack align="start">
                                  <Hstack>
                                    <Image
                                      src={
                                        achievement.image ||
                                        game.thumbnail ||
                                        "/images/D2J_Icon.png"
                                      }
                                      width={48}
                                      height={48}
                                      alt="Achievement"
                                      className="rounded-xl w-12 h-12 object-cover"
                                    />
                                    <Vstack align="start" gap={0}>
                                      <Text color="text">
                                        {achievement.name}
                                      </Text>
                                      <Text color="textFaded" size="xs">
                                        {achievement.description}
                                      </Text>
                                      <Text
                                        size="xs"
                                        style={{ color: style.text }}
                                      >
                                        {tier == "Default"
                                          ? undefined
                                          : `${tier} • `}
                                        {pct.toFixed(1)}% of users achieved
                                      </Text>
                                      <Text
                                        color={hasAchievement ? "red" : "green"}
                                        size="xs"
                                      >
                                        {isLoggedIn
                                          ? hasAchievement
                                            ? "Click to mark as unachieved"
                                            : "Click to mark as achieved"
                                          : ""}
                                      </Text>
                                    </Vstack>
                                  </Hstack>
                                </Vstack>
                              }
                            >
                              <button
                                onClick={async () => {
                                  if (!user) return;
                                  const hasIt = achievement.users.some(
                                    (u) => u.id === user.id,
                                  );
                                  const method = hasIt ? "DELETE" : "POST";
                                  const res = await fetch(
                                    `${BASE_URL}/achievement`,
                                    {
                                      method,
                                      headers: {
                                        "Content-Type": "application/json",
                                        authorization: `Bearer ${getCookie(
                                          "token",
                                        )}`,
                                      },
                                      credentials: "include",
                                      body: JSON.stringify({
                                        achievementId: achievement.id,
                                      }),
                                    },
                                  );
                                  if (res.ok) {
                                    achievement.users = hasIt
                                      ? achievement.users.filter(
                                          (u) => u.id !== user.id,
                                        )
                                      : [...achievement.users, user];
                                    setGame({
                                      ...game,
                                      achievements: [...game.achievements],
                                    });
                                  }
                                }}
                                disabled={!isLoggedIn}
                                className={`rounded-xl p-1 ${
                                  isLoggedIn
                                    ? "cursor-pointer"
                                    : "cursor-default"
                                }`}
                                style={{
                                  backgroundColor: colors["base"],
                                  borderWidth: 2,
                                  borderStyle: "solid",
                                  borderColor: style.border,
                                  boxShadow: style.glow,
                                  opacity: hasAchievement ? 1 : 0.5,
                                  filter: hasAchievement ? "" : "grayscale(1)",
                                }}
                              >
                                <Image
                                  src={
                                    achievement.image ||
                                    game.thumbnail ||
                                    "/images/D2J_Icon.png"
                                  }
                                  width={48}
                                  height={48}
                                  alt="Achievement"
                                  className="rounded-lg object-cover w-12 h-12"
                                />
                              </button>
                            </Tooltip>

                            {tier != "Default" && (
                              <div
                                className="absolute -top-1 -right-1 px-1 py-0.5 rounded-md text-[10px]"
                                style={{
                                  backgroundColor: colors["mantle"],
                                  color: style.text,
                                  border: `1px solid ${style.border}`,
                                  filter: hasAchievement ? "" : "grayscale(1)",
                                }}
                              >
                                {tier}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </Hstack>
                </Vstack>
              </Card>
            )}
            {game.leaderboards && game.leaderboards.length > 0 && (
              <Card className="order-10">
                <Vstack align="start">
                  <p
                    className="text-xs"
                    style={{
                      color: colors["textFaded"],
                    }}
                  >
                    LEADERBOARD
                  </p>

                  <Tabs>
                    {game.leaderboards.map((leaderboard) => (
                      <Tab
                        key={leaderboard.id}
                        title={leaderboard.name}
                        icon={
                          leaderboard.type == "SCORE"
                            ? "trophy"
                            : leaderboard.type == "GOLF"
                              ? "landplot"
                              : leaderboard.type == "SPEEDRUN"
                                ? "rabbit"
                                : "turtle"
                        }
                      >
                        {leaderboard.scores && (
                          <>
                            <div />
                            <Table
                              bottomContent={
                                (leaderboard.onlyBest
                                  ? Array.from(
                                      leaderboard.scores
                                        .reduce((acc, score) => {
                                          if (
                                            !acc.has(score.user.id) ||
                                            acc.get(score.user.id).data <
                                              score.data
                                          ) {
                                            acc.set(score.user.id, score);
                                          }
                                          return acc;
                                        }, new Map())
                                        .values(),
                                    )
                                  : leaderboard.scores
                                ).length >= leaderboard.maxUsersShown ? (
                                  <div className="flex w-full justify-center">
                                    <Pagination
                                      showControls
                                      color="primary"
                                      variant="faded"
                                      page={page}
                                      total={Math.ceil(
                                        (leaderboard.onlyBest
                                          ? Array.from(
                                              leaderboard.scores
                                                .reduce((acc, score) => {
                                                  if (
                                                    !acc.has(score.user.id) ||
                                                    acc.get(score.user.id)
                                                      .data < score.data
                                                  ) {
                                                    acc.set(
                                                      score.user.id,
                                                      score,
                                                    );
                                                  }
                                                  return acc;
                                                }, new Map())
                                                .values(),
                                            )
                                          : leaderboard.scores
                                        ).length / leaderboard.maxUsersShown,
                                      )}
                                      onChange={(page) => setPage(page)}
                                    />
                                  </div>
                                ) : undefined
                              }
                            >
                              <TableHeader>
                                <TableColumn>#</TableColumn>
                                <TableColumn>User</TableColumn>
                                <TableColumn>
                                  {leaderboard.type == "SCORE" ||
                                  leaderboard.type == "GOLF"
                                    ? "Score"
                                    : "Time"}
                                </TableColumn>
                                <TableColumn>Actions</TableColumn>
                              </TableHeader>
                              <TableBody>
                                {(leaderboard.onlyBest
                                  ? Array.from(
                                      leaderboard.scores
                                        .reduce((acc, score) => {
                                          if (
                                            !acc.has(score.user.id) ||
                                            (acc.get(score.user.id).data <
                                              score.data &&
                                              (leaderboard.type == "SCORE" ||
                                                leaderboard.type ==
                                                  "ENDURANCE")) ||
                                            (acc.get(score.user.id).data >
                                              score.data &&
                                              (leaderboard.type == "GOLF" ||
                                                leaderboard.type == "SPEEDRUN"))
                                          ) {
                                            acc.set(score.user.id, score);
                                          }
                                          return acc;
                                        }, new Map())
                                        .values(),
                                    )
                                  : leaderboard.scores
                                )
                                  .sort((a, b) => {
                                    if (
                                      leaderboard.type == "GOLF" ||
                                      leaderboard.type == "SPEEDRUN"
                                    ) {
                                      return a.data - b.data;
                                    } else {
                                      return b.data - a.data;
                                    }
                                  })
                                  .slice(
                                    0 + leaderboard.maxUsersShown * (page - 1),
                                    leaderboard.maxUsersShown * page,
                                  )
                                  .map((score, i) => (
                                    <TableRow key={score.id}>
                                      <TableCell
                                        style={{
                                          color: colors["textFaded"],
                                        }}
                                      >
                                        {i +
                                          1 +
                                          leaderboard.maxUsersShown *
                                            (page - 1)}
                                      </TableCell>
                                      <TableCell>
                                        <Link
                                          href={`/u/${score.user.slug}`}
                                          underline={false}
                                        >
                                          <Hstack>
                                            <Avatar
                                              src={score.user.profilePicture}
                                              size={24}
                                            />
                                            <Text color="text">
                                              {score.user.name}
                                            </Text>
                                          </Hstack>
                                        </Link>
                                      </TableCell>
                                      <TableCell
                                        style={{
                                          color: colors["blue"],
                                        }}
                                      >
                                        {leaderboard.type == "GOLF" ||
                                        leaderboard.type == "SCORE"
                                          ? score.data /
                                            10 ** leaderboard.decimalPlaces
                                          : (() => {
                                              const totalMilliseconds =
                                                score.data;
                                              const hours = Math.floor(
                                                totalMilliseconds / 3600000,
                                              );
                                              const minutes = Math.floor(
                                                (totalMilliseconds % 3600000) /
                                                  60000,
                                              );
                                              const seconds = Math.floor(
                                                (totalMilliseconds % 60000) /
                                                  1000,
                                              );
                                              const milliseconds =
                                                totalMilliseconds % 1000;

                                              return `${
                                                hours > 0 ? `${hours}:` : ""
                                              }${minutes
                                                .toString()
                                                .padStart(2, "0")}:${seconds
                                                .toString()
                                                .padStart(2, "0")}${
                                                milliseconds > 0
                                                  ? `.${milliseconds
                                                      .toString()
                                                      .padStart(3, "0")}`
                                                  : ""
                                              }`;
                                            })()}
                                      </TableCell>
                                      <TableCell className="flex gap-2">
                                        <Button
                                          icon="eye"
                                          onClick={() => {
                                            setSelectedScore(score.evidence);
                                            setIsOpen(true);
                                          }}
                                          size="sm"
                                        />
                                        {(isEditable ||
                                          score.user.id == user?.id ||
                                          user?.mod) && (
                                          <Button
                                            color="red"
                                            icon="trash"
                                            onClick={async () => {
                                              const success = await deleteScore(
                                                score.id,
                                              );
                                              if (success) {
                                                window.location.reload();
                                              }
                                            }}
                                            size="sm"
                                          />
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          </>
                        )}
                        <div className="mt-2">
                          <Button
                            icon="plus"
                            onClick={() => {
                              setSelectedLeaderboard(leaderboard);
                              setIsOpen2(true);
                            }}
                          >
                            Submit Score
                          </Button>
                        </div>
                      </Tab>
                    ))}
                  </Tabs>
                </Vstack>
              </Card>
            )}
            {gameEmotes.length > 0 && (
              <Card>
                <Vstack align="stretch">
                  <p
                    className="text-xs"
                    style={{
                      color: colors["textFaded"],
                    }}
                  >
                    EMOTES
                  </p>

                  <div className="flex flex-wrap gap-3">
                    {gameEmotes.map((emoji) => (
                      <Chip
                        key={emoji.id}
                        avatarSrc={emoji.image}
                        avatarAlt={`:${emoji.slug}:`}
                      >
                        <Text size="sm">:{emoji.slug}:</Text>
                      </Chip>
                    ))}
                  </div>
                </Vstack>
              </Card>
            )}
            {game.tracks && game.tracks.length > 0 && (
              <Card>
                <Vstack align="stretch">
                  <p
                    className="text-xs"
                    style={{
                      color: colors["textFaded"],
                    }}
                  >
                    MUSIC
                  </p>

                  {game.tracks.map((track) => (
                    <SidebarSong
                      key={track.id}
                      trackId={track.id}
                      slug={track.slug}
                      name={track.name}
                      artist={track.composer}
                      thumbnail={track.game.thumbnail ?? "/images/D2J_Icon.png"}
                      game={track.game}
                      song={track.url}
                      license={track.license}
                      allowDownload={track.allowDownload}
                      allowBackgroundUse={track.allowBackgroundUse}
                      allowBackgroundUseAttribution={
                        track.allowBackgroundUseAttribution
                      }
                      ratingValue={trackSelectedStars[track.id] ?? 0}
                      showRating={!isEditable}
                      hideRatings={effectiveHideRatings}
                      ratingDisabled={
                        !user ||
                        isEditable ||
                        activeJamResponse?.jam?.id !== game.jamId ||
                        (activeJamResponse?.phase !== "Rating" &&
                          activeJamResponse?.phase !== "Submission") ||
                        !trackOverallCategory
                      }
                      onRate={async (value) => {
                        if (!trackOverallCategory) return;
                        setTrackSelectedStars((prev) => ({
                          ...prev,
                          [track.id]: value,
                        }));

                        const response = await postTrackRating(
                          track.id,
                          trackOverallCategory.id,
                          value,
                        );

                        if (!response.ok) {
                          const payload = await response
                            .json()
                            .catch(() => null);
                          addToast({
                            title:
                              payload?.message ?? "Failed to save track rating",
                          });
                          setTrackSelectedStars((prev) => ({
                            ...prev,
                            [track.id]:
                              (user?.trackRatings ?? []).find(
                                (rating) =>
                                  rating.trackId === track.id &&
                                  rating.categoryId === trackOverallCategory.id,
                              )?.value ?? 0,
                          }));
                        }
                      }}
                    />
                  ))}
                </Vstack>
              </Card>
            )}
            <Card className="order-50">
              <Vstack align="start">
                <p
                  className="text-xs"
                  style={{
                    color: colors["textFaded"],
                  }}
                >
                  STATS
                </p>
                <Vstack align="start">
                  <Chip>
                    Ratings Received:{" "}
                    {Math.round(
                      game.ratings.length /
                        (game.ratingCategories.length +
                          ratingCategories.length),
                    )}
                  </Chip>
                  {game.category !== "EXTRA" && (
                    <Hstack>
                      <Chip>
                        Ranked Ratings Received:{" "}
                        {Math.round(
                          game.ratings.filter(
                            (rating) =>
                              rating.user.teams.filter(
                                (team) =>
                                  team.game &&
                                  team.game.jamId == game.jamId &&
                                  team.game.published &&
                                  team.game.category !== "EXTRA",
                              ).length > 0,
                          ).length /
                            (game.ratingCategories.length +
                              ratingCategories.length),
                        )}
                      </Chip>

                      {Math.round(
                        game.ratings.filter(
                          (rating) =>
                            rating.user.teams.filter(
                              (team) =>
                                team.game &&
                                team.game.jamId == game.jamId &&
                                team.game.published &&
                                team.game.category !== "EXTRA",
                            ).length > 0,
                        ).length /
                          (game.ratingCategories.length +
                            ratingCategories.length),
                      ) < 5 && (
                        <Tooltip
                          content="This game needs 5 ratings received in order to be ranked after the rating period"
                          position="top"
                        >
                          <AlertTriangle size={16} className="text-red-500" />
                        </Tooltip>
                      )}
                    </Hstack>
                  )}
                  <Hstack>
                    <Chip>
                      Ratings Given:{" "}
                      {Math.round(
                        game.team.users.reduce(
                          (prev, cur) =>
                            prev +
                            cur.ratings.reduce(
                              (prev2, cur2) =>
                                prev2 +
                                (cur2.game.jamId === game.jamId
                                  ? 1 /
                                    (cur2.game.ratingCategories.length +
                                      ratingCategories.length)
                                  : 0),
                              0,
                            ),
                          0,
                        ),
                      )}
                    </Chip>
                    {Math.round(
                      game.team.users.reduce(
                        (prev, cur) =>
                          prev +
                          cur.ratings.reduce(
                            (prev2, cur2) =>
                              prev2 +
                              (cur2.game.jamId === game.jamId
                                ? 1 /
                                  (cur2.game.ratingCategories.length +
                                    ratingCategories.length)
                                : 0),
                            0,
                          ),
                        0,
                      ),
                    ) < 5 && (
                      <Tooltip
                        content="This game needs 5 ratings given in order to be ranked after the rating period"
                        position="top"
                      >
                        <AlertTriangle
                          size={16}
                          style={{
                            color: colors["red"],
                          }}
                        />
                      </Tooltip>
                    )}
                  </Hstack>
                </Vstack>
              </Vstack>
            </Card>
            <Popover
              shown={
                isScreenshotViewerOpen && selectedMedia?.type === "screenshot"
              }
              anchorToScreen
              position="center"
              padding={0}
              className="!border-0 !bg-transparent !shadow-none"
              backdrop
              onClose={() => setIsScreenshotViewerOpen(false)}
            >
              {selectedMedia?.type === "screenshot" && (
                <div className="relative inline-flex max-h-[90vh] max-w-[92vw] items-center justify-center p-4">
                  <img
                    src={selectedMedia.src}
                    alt={`${game.name} screenshot ${selectedMedia.index + 1}`}
                    className="max-h-[84vh] max-w-full object-contain"
                  />
                </div>
              )}
            </Popover>
            <Popover
              showCloseButton
              position="center"
              shown={isOpen}
              onClose={() => {
                setIsOpen(false);
              }}
            >
              <div className="w-[300px] h-[300px]">
                <Image
                  src={selectedScore}
                  alt="Evidence image"
                  fill
                  objectFit="contain"
                />
              </div>
            </Popover>
            <Modal
              shown={isOpen2}
              onClose={() => {
                setIsOpen2(false);
              }}
              icon={
                selectedLeaderboard?.type == "SCORE"
                  ? "trophy"
                  : selectedLeaderboard?.type == "GOLF"
                    ? "landplot"
                    : selectedLeaderboard?.type == "SPEEDRUN"
                      ? "rabbit"
                      : "turtle"
              }
              title={selectedLeaderboard?.name || "Leaderboard"}
              onSubmit={async (form) => {
                // Validate evidence
                const evidenceUrl = form["evidence"];
                if (!evidenceUrl) {
                  addToast({ title: "No evidence image provided" });
                  return;
                }
                if (!selectedLeaderboard) {
                  addToast({ title: "No leaderboard selected" });
                  return;
                }

                let finalScore: number | undefined;

                if (
                  selectedLeaderboard?.type === "SPEEDRUN" ||
                  selectedLeaderboard?.type === "ENDURANCE"
                ) {
                  const hours = parseInt(form["hours"] || "0", 10) || 0;
                  const minutes = parseInt(form["minutes"] || "0", 10) || 0;
                  const seconds = parseInt(form["seconds"] || "0", 10) || 0;
                  const ms = parseInt(form["milliseconds"] || "0", 10) || 0;

                  finalScore =
                    ms + seconds * 1000 + minutes * 60_000 + hours * 3_600_000;
                } else if (
                  selectedLeaderboard?.type === "SCORE" ||
                  selectedLeaderboard?.type === "GOLF"
                ) {
                  finalScore = parseInt(form["score"] || "", 10);
                }

                if (finalScore == null || Number.isNaN(finalScore)) {
                  addToast({ title: "Please enter a valid score/time." });
                  return;
                }

                const ok = await postScore(
                  finalScore,
                  evidenceUrl,
                  selectedLeaderboard.id,
                );
                if (ok) {
                  setIsOpen2(false);
                  window.location.reload();
                }
              }}
              fields={[
                ...(selectedLeaderboard?.type === "SPEEDRUN" ||
                selectedLeaderboard?.type === "ENDURANCE"
                  ? ([
                      {
                        type: "number",
                        name: "hours",
                        label: "Hours",
                        description: "Enter hours",
                        min: 0,
                        max: 24,
                        defaultValue: "0",
                      },
                      {
                        type: "number",
                        name: "minutes",
                        label: "Minutes",
                        description: "Enter minutes",
                        min: 0,
                        max: 59,
                        defaultValue: "0",
                      },
                      {
                        type: "number",
                        name: "seconds",
                        label: "Seconds",
                        description: "Enter seconds",
                        min: 0,
                        max: 59,
                        defaultValue: "0",
                      },
                      {
                        type: "number",
                        name: "milliseconds",
                        label: "Milliseconds",
                        description:
                          "Enter milliseconds (enter all 3 digits, .43 -> 430)",
                        min: 0,
                        max: 999,
                        defaultValue: "0",
                      },
                    ] as const)
                  : []),
                ...(selectedLeaderboard?.type === "SCORE" ||
                selectedLeaderboard?.type === "GOLF"
                  ? ([
                      {
                        type: "number",
                        name: "score",
                        label: "Score",
                        description: "Enter your score",
                        required: true,
                      },
                    ] as const)
                  : []),
                {
                  type: "imageUpload",
                  name: "evidence",
                  label: "Evidence Picture",
                  description:
                    "Upload a screenshot/photo to verify your result.",
                  upload: uploadEvidence,
                  accept: "image/*",
                  previewHeight: 240,
                },
              ]}
            />
          </div>
        </div>
      </div>
      <div className="my-10 w-fit">
        <CreateComment gameId={game.id} />
      </div>

      <div className="flex flex-col gap-3">
        {game?.comments
          ?.sort((a, b) => b.id - a.id)
          .map((comment) => (
            <div key={comment.id}>
              <CommentCard comment={comment} user={user} />
            </div>
          ))}
      </div>
    </>
  );
}

function StarRow({
  id,
  name,
  text,
  description,
  hoverStars,
  setHoverStars,
  selectedStars,
  setSelectedStars,
  hoverCategory,
  setHoverCategory,
  gameId,
}: {
  id: number;
  name: string;
  text?: string;
  description: string;
  hoverStars: { [key: number]: number };
  setHoverStars: (stars: { [key: number]: number }) => void;
  selectedStars: { [key: number]: number };
  setSelectedStars: (stars: { [key: number]: number }) => void;
  hoverCategory: number | null;
  setHoverCategory: (id: number | null) => void;
  gameId: number;
}) {
  const [newlyClicked, setNewlyClicked] = useState<boolean>(false);
  const { colors } = useTheme();
  const themeJustification = text?.trim();
  const showThemeJustification =
    name.toLowerCase() === "theme" && Boolean(themeJustification);

  return (
    <div className="flex items-center gap-4">
      <div className="flex">
        {[2, 4, 6, 8, 10].map((value) => (
          <StarElement
            key={value}
            id={id}
            value={value}
            hoverStars={hoverStars}
            setHoverStars={setHoverStars}
            hoverCategoryId={hoverCategory}
            setHoverCategoryId={setHoverCategory}
            selectedStars={selectedStars}
            setSelectedStars={setSelectedStars}
            newlyClicked={newlyClicked}
            setNewlyClicked={setNewlyClicked}
            gameId={gameId}
          />
        ))}
      </div>
      <Text color="textFaded">{name}</Text>
      <Tooltip content={description} position="top">
        <span className="inline-flex items-center">
          <CircleHelp
            size={16}
            style={{
              color: colors["textFaded"],
            }}
          />
        </span>
      </Tooltip>
      {showThemeJustification && (
        <Tooltip
          content={
            <div className="max-w-80 whitespace-normal">
              <p className="text-lg font-bold">Theme Justification</p>
              <p>{themeJustification}</p>
            </div>
          }
          position="top"
        >
          <span
            className="inline-flex items-center"
            aria-label="Theme justification"
          >
            <MessageCircleMore
              size={16}
              style={{
                color: colors["textFaded"],
              }}
            />
          </span>
        </Tooltip>
      )}
    </div>
  );
}

function StarElement({
  id,
  value,
  hoverStars,
  setHoverStars,
  selectedStars,
  setSelectedStars,
  hoverCategoryId,
  setHoverCategoryId,
  newlyClicked,
  setNewlyClicked,
  gameId,
}: {
  id: number;
  value: number;
  hoverStars: { [key: number]: number };
  setHoverStars: (stars: { [key: number]: number }) => void;
  selectedStars: { [key: number]: number };
  setSelectedStars: (stars: { [key: number]: number }) => void;
  hoverCategoryId: number | null;
  setHoverCategoryId: (id: number | null) => void;
  newlyClicked: boolean;
  setNewlyClicked: (arg0: boolean) => void;
  gameId: number;
}) {
  const { colors } = useTheme();

  return (
    <div
      className="relative w-6 h-6 cursor-pointer"
      onMouseEnter={() => setHoverCategoryId(id)}
      onMouseLeave={() => {
        setHoverCategoryId(null);
        setHoverStars({});
        setNewlyClicked(false);
      }}
    >
      {/* Full Star */}
      <Star
        fill="currentColor"
        className={`absolute transition-all duration-300`}
        style={{
          color:
            hoverStars[id] > 0 &&
            hoverStars[id] >= value &&
            hoverCategoryId == id &&
            !newlyClicked
              ? colors["orangeDark"]
              : selectedStars[id] > 0 && selectedStars[id] >= value
                ? colors["yellow"]
                : colors["base"],
        }}
      />
      {/* Half Star (Overlapping Left Side) */}
      <Star
        fill="currentColor"
        className={`absolute transition-all duration-300`}
        style={{
          clipPath: "inset(0 50% 0 0)",
          color:
            hoverStars[id] > 0 &&
            hoverStars[id] >= value - 1 &&
            hoverCategoryId == id &&
            !newlyClicked
              ? colors["orangeDark"]
              : selectedStars[id] > 0 && selectedStars[id] >= value - 1
                ? colors["yellow"]
                : colors["base"],
        }} // Show only left half
      />
      {/* Left Half (Triggers value - 1) */}
      <div
        className="absolute left-0 top-0 w-3 h-6"
        onMouseEnter={() => {
          setHoverStars({ ...hoverStars, [id]: value - 1 });
          setNewlyClicked(false);
        }}
        onClick={() => {
          setSelectedStars({ ...selectedStars, [id]: value - 1 });
          setNewlyClicked(true);
          postRating(gameId, id, value - 1);
        }}
      />
      {/* Right Half (Triggers value) */}
      <div
        className="absolute right-0 top-0 w-3 h-6"
        onMouseEnter={() => {
          setHoverStars({ ...hoverStars, [id]: value });
          setNewlyClicked(false);
        }}
        onClick={() => {
          setSelectedStars({ ...selectedStars, [id]: value });
          setNewlyClicked(true);
          postRating(gameId, id, value);
        }}
      />
    </div>
  );
}
