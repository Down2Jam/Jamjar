"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { use, useCallback, useMemo, useRef } from "react";
import { useState, useEffect } from "react";
import { getCookie } from "@/helpers/cookie";
import { GamePageBackground } from "@/app/(main)/PageBackground";
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
import { GameEmbedAspectRatio, GameType, PageVersion } from "@/types/GameType";
import { UserType } from "@/types/UserType";
import { getGame, getRatingCategories } from "@/requests/game";
import { getSelf } from "@/requests/user";
import Image from "@/compat/next-image";
import {
  AlertTriangle,
  Award,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleSmall,
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
import { isOwnTrack } from "@/helpers/isOwnTrack";
import ScrollableTracks from "@/components/sidebar/ScrollableTracks";
import SidebarSong from "@/components/sidebar/SidebarSong";
import { PriorityEmotesContext } from "@/components/editor/PriorityEmotesContext";
import { getTrackRatingCategories } from "@/requests/track";
import { TrackRatingCategoryType } from "@/types/TrackRatingCategoryType";
import { emitTrackRatingSync, subscribeToTrackRatingSync } from "@/helpers/trackRatingSync";
import { RatingType } from "@/types/RatingType";
import { RatingCategoryType } from "@/types/RatingCategoryType";
import { useCurrentJam } from "@/hooks/queries";
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
import useMobileLayout from "@/hooks/useMobileLayout";
import { useTheme } from "@/providers/useSiteTheme";
import { Chip } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import ThemedProse from "@/components/themed-prose";
import { Button } from "bioloom-ui";
import { Link } from "bioloom-ui";
import { useTranslations } from "@/compat/next-intl";
import { useSearchParams } from "@/compat/next-navigation";
import { Text } from "bioloom-ui";
import { Tooltip } from "bioloom-ui";
import GamePageLoading from "@/components/game-page-loading";
import GameSidebarSection from "@/components/game-sidebar-section";
import GameLeaderboards from "@/components/game-leaderboards";
import GameAchievements from "@/components/game-achievements";
import GameInfoButton from "@/components/game-info-button";
import { useMusic } from "bioloom-miniplayer";
import { BASE_URL } from "@/requests/config";
import { getPlayableSandbox } from "@/helpers/playableSandbox";
import { getPlayableBuildUrl } from "@/requests/config";
import { Popover } from "bioloom-ui";
import { Modal } from "bioloom-ui";
import { Icon, IconName } from "bioloom-ui";
import MentionedContent from "@/components/mentions/MentionedContent";
import { useEffectiveHideRatings } from "@/hooks/useEffectiveHideRatings";
import RatingVisibilityGate from "@/components/ratings/RatingVisibilityGate";
import { readArray, readItem } from "@/requests/helpers";
import { Card } from "bioloom-ui";
import { Avatar } from "bioloom-ui";
import PageVersionToggle from "@/components/page-version-toggle/PageVersionToggle";
import { getSelectedGamePage, materializeGamePage } from "@/helpers/gamePages";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { UserHoverPreview } from "@/components/hover-previews";

const platformOrder: Record<string, number> = {
  Windows: 1,
  MacOS: 2,
  Linux: 3,
  Web: 4,
  Mobile: 5,
};

const inputMethodMeta: Record<string, { label: string; icon?: IconName }> = {
  KeyboardMouse: { label: "AppStrings.KeyboardMouse", icon: "keyboard" },
  Gamepad: { label: "AppStrings.GamepadController", icon: "gamepad2" },
  Touch: { label: "AppStrings.Touch", icon: "touchpad" },
  KeyboardOnly: { label: "AppStrings.KeyboardOnly", icon: "keyboard" },
  MouseOnly: { label: "AppStrings.MouseOnly", icon: "mouse" },
  Motion: { label: "AppStrings.MotionControls", icon: "move3d" },
  VR: { label: "AppStrings.VR", icon: "headset" },
  Other: { label: "AppStrings.Other", icon: "morehorizontal" },
};

function getPlatformIcon(platform: string): IconName | undefined {
  switch (platform) {
    case "Linux":
      return "customlinux";
    case "Mobile":
      return "smartphone";
    case "Windows":
      return "customwindows";
    case "MacOS":
      return "custommacos";
    case "SourceCode":
      return "code2";
    case "Web":
      return "sihtml5";
    default:
      return "morehorizontal";
  }
}

function getPlatformAccent(platform: string, colors: Record<string, string>) {
  switch (platform) {
    case "Web":
      return colors["blue"];
    case "Windows":
      return colors["cyan"];
    case "MacOS":
      return colors["purple"];
    case "Linux":
      return colors["yellow"];
    case "Mobile":
      return colors["green"];
    case "SourceCode":
      return colors["red"];
    default:
      return colors["textFaded"];
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

function getResultsGradient(
  placement: number,
  averageScore: number,
  colors: Record<string, string>,
) {
  if (placement >= 1 && placement <= 3)
    return {
      gradient: `linear-gradient(90deg, ${colors["yellow"]}, ${colors["red"]})`,
      first: colors["red"],
    };
  if (averageScore >= 8)
    return {
      gradient: `linear-gradient(90deg, ${colors["greenLight"]}, ${colors["green"]}, ${colors["greenDark"]})`,
      first: colors["green"],
    };
  if (averageScore >= 7)
    return {
      gradient: `linear-gradient(90deg, ${colors["blueLight"]}, ${colors["blue"]}, ${colors["blueDark"]})`,
      first: colors["blueLight"],
    };
  if (averageScore >= 6)
    return {
      gradient: `linear-gradient(90deg, ${colors["purpleLight"]}, ${colors["purple"]}, ${colors["purpleDark"]})`,
      first: colors["purple"],
    };
  return {
    gradient: `linear-gradient(90deg, ${colors["textFaded"]}, ${colors["textFaded"]})`,
    first: colors["textFaded"],
  };
}

function getResultsIcon(
  placement: number,
  averageScore: number,
  color: string,
) {
  if (placement >= 1 && placement <= 3) {
    return <Award size={16} style={{ color }} />;
  }
  if (averageScore >= 8) {
    return <Circle size={15} style={{ color }} />;
  }
  if (averageScore >= 7) {
    return <Circle size={13} style={{ color }} />;
  }
  if (averageScore >= 6) {
    return <CircleSmall size={11} style={{ color }} />;
  }
  return null;
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

function getSelectedStarsForVersion({
  ratings,
  userId,
  gameId,
  gamePageId,
  pageVersion,
}: {
  ratings: Array<any> | undefined;
  userId: number | undefined;
  gameId: number | undefined;
  gamePageId: number | undefined;
  pageVersion: PageVersion;
}) {
  if (!userId || !gameId) return {};

  return (ratings ?? [])
    .filter((rating: any) => {
      if (rating.userId !== userId) return false;

      const ratingPageVersion = (rating.pageVersion ?? "JAM") as PageVersion;
      if (ratingPageVersion !== pageVersion) return false;

      if (gamePageId && rating.gamePageId != null) {
        return rating.gamePageId === gamePageId;
      }

      return rating.gameId === gameId;
    })
    .reduce<Record<number, number>>((acc, rating: any) => {
      const categoryId = rating.categoryId ?? rating.category?.id;
      if (typeof categoryId === "number") {
        acc[categoryId] = rating.value;
      }
      return acc;
    }, {});
}

export default function ClientGamePage({
  params,
}: {
  params: Promise<{ gameSlug: string }>;
}) {
  const uiText = useUiTranslations();
  const resolvedParams = use(params);
  const gameSlug = resolvedParams.gameSlug;
  const searchParams = useSearchParams();
  const mobileLayout = useMobileLayout();
  const [game, setGame] = useState<GameType | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [page, setPage] = useState(1);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
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
  const [selectedVersion, setSelectedVersion] = useState<PageVersion>("JAM");
  const [ratingCategories, setRatingCategories] = useState<
    RatingCategoryType[]
  >([]);
  const effectiveHideRatings = useEffectiveHideRatings(user);
  const [trackSelectedStars, setTrackSelectedStars] = useState<Record<number, number>>({});
  const [trackOverallCategory, setTrackOverallCategory] = useState<TrackRatingCategoryType | null>(null);
  useEffect(() => subscribeToTrackRatingSync(({ trackId, value }) => {
    setTrackSelectedStars((prev) => ({ ...prev, [trackId]: value }));
  }), []);
  const { data: activeJamResponse } = useCurrentJam();
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isScreenshotViewerOpen, setIsScreenshotViewerOpen] = useState(false);
  const [isItchEmbedActive, setIsItchEmbedActive] = useState(false);
  const playableEmbedRef = useRef<HTMLIFrameElement>(null);
  const trailerFrameRef = useRef<HTMLIFrameElement | null>(null);
  const requestedPageVersion = searchParams.get("pageVersion");

  const { siteTheme, colors } = useTheme();
  const { playItem, current, isPlaying, toggle } = useMusic();
  const interactiveOutlineColor = `color-mix(in srgb, ${colors["text"]} 5%, ${colors["mantle"]})`;
  const t = useTranslations();
  const selectedPage = useMemo(() => {
    return getSelectedGamePage(game, selectedVersion);
  }, [game, selectedVersion]);
  const displayGame = useMemo(
    () =>
      game && selectedPage ? materializeGamePage(game, selectedPage) : game,
    [game, selectedPage],
  );
  const soundtrackQueue = useMemo(() => {
    if (!displayGame) return [];

    return (displayGame.tracks ?? []).map((track) => ({
      ...track,
      game: {
        ...track.game,
        id: displayGame.id,
        jamId: displayGame.jamId,
        name: displayGame.name,
        slug: displayGame.slug,
        thumbnail: displayGame.thumbnail,
        soundtrackThumbnail: displayGame.soundtrackThumbnail,
        team: displayGame.team,
      },
    }));
  }, [displayGame]);
  const isSoundtrackCurrent = soundtrackQueue.some((track) =>
    current?.slug === track.slug || current?.song === track.url,
  );
  usePageMetadata({
    title: displayGame?.name ?? game?.name ?? gameSlug,
    description:
      displayGame?.short || game?.short || uiText("AppStrings.AGameSubmittedToDown2Jam"),
    image:
      displayGame?.thumbnail ||
      displayGame?.banner ||
      game?.thumbnail ||
      game?.banner ||
      "/images/D2J_Icon.png",
    icon:
      displayGame?.thumbnail ||
      game?.thumbnail ||
      displayGame?.banner ||
      game?.banner ||
      "/images/D2J_Icon.svg",
    canonical: `/g/${game?.slug ?? gameSlug}`,
  });
  const displayComments = selectedPage?.comments ?? game?.comments ?? [];
  const sortedDownloadLinks = useMemo(
    () =>
      [...(displayGame?.downloadLinks ?? [])].sort(
        (a, b) =>
          (platformOrder[a.platform] ?? 99) - (platformOrder[b.platform] ?? 99),
      ),
    [displayGame?.downloadLinks],
  );
  const currentScores =
    selectedVersion === "POST_JAM"
      ? (game?.postJamScores ?? {})
      : (game?.jamScores ?? game?.scores ?? {});
  const isCurrentJamGame = activeJamResponse?.jam?.id == displayGame?.jamId;
  const isJamRatingOpenPhase =
    activeJamResponse?.phase == "Rating" ||
    activeJamResponse?.phase == "Submission";
  const isPostJamRatingOpenPhase =
    activeJamResponse?.phase == "Post-Jam Rating";
  const isRatingOpenPhase =
    selectedVersion === "POST_JAM"
      ? isPostJamRatingOpenPhase
      : isJamRatingOpenPhase;
  const shouldShowCurrentJamResults =
    activeJamResponse?.phase == "Post-Jam Refinement" ||
    activeJamResponse?.phase == "Post-Jam Rating";
  const shouldShowResults = !isCurrentJamGame || shouldShowCurrentJamResults;
  const currentRatingCategoryCount =
    (displayGame?.ratingCategories.length ?? 0) + ratingCategories.length;
  const currentRatingsReceived =
    currentRatingCategoryCount > 0
      ? Math.round(
          (game?.ratings ?? []).filter(
            (rating) => (rating.pageVersion ?? "JAM") === selectedVersion,
          ).length / currentRatingCategoryCount,
        )
      : 0;
  const currentScoreKeys = Object.keys(currentScores || {});
  const showScoreResults = Boolean(
    activeJamResponse &&
      shouldShowResults &&
      currentRatingsReceived > 0 &&
      currentScoreKeys.length > 0,
  );
  const showRatingSection =
    showScoreResults || isRatingOpenPhase || (isCurrentJamGame && !shouldShowResults);

  const engagedUserIds = useMemo(() => {
    const ids = new Set<number>();
    if (!displayGame || !game) return ids;

    for (const a of displayGame.achievements ?? []) {
      for (const u of a.users ?? []) {
        if (u?.id != null) ids.add(u.id);
      }
    }

    for (const lb of displayGame.leaderboards ?? []) {
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
  }, [displayGame, game]);

  useEffect(() => {
    const fetchGameAndUser = async () => {
      const gameResponse = await getGame(gameSlug);

      let gameData;
      let initialVersion: PageVersion = "JAM";
      if (gameResponse.ok) {
        gameData = await readItem<GameType>(gameResponse);

        setGame(gameData);
        initialVersion =
          requestedPageVersion === "JAM" || requestedPageVersion === "POST_JAM"
            ? requestedPageVersion
            : gameData?.postJamPage
              ? "POST_JAM"
              : "JAM";
        setSelectedVersion(initialVersion);
      }

      const ratingResponse = await getRatingCategories(true);
      setRatingCategories(await readArray(ratingResponse));
      const trackRatingResponse = await getTrackRatingCategories();
      if (trackRatingResponse.ok) {
        const categories = await readArray<TrackRatingCategoryType>(trackRatingResponse);
        setTrackOverallCategory(categories.find((category) => category.name === "Overall") ?? null);
      }

      // Fetch the logged-in user data
      if (getCookie("token")) {
        try {
          const userResponse = await getSelf();

          if (userResponse.ok) {
            const userData = await readItem<UserType>(userResponse);
            if (!userData) return;
            setUser(userData);

            if (gameData) {
              const selectedGamePage =
                initialVersion === "POST_JAM"
                  ? gameData.postJamPage
                  : gameData.jamPage;
              const ratings = getSelectedStarsForVersion({
                ratings: userData.ratings ?? gameData.ratings ?? [],
                userId: userData.id,
                gameId: gameData.id,
                gamePageId: selectedGamePage?.id,
                pageVersion: initialVersion,
              });

              setSelectedStars(ratings);
              setTrackSelectedStars(Object.fromEntries((userData.trackRatings ?? []).map((rating) => [rating.trackId, rating.value])));

            }
          }
        } catch (error) {
          console.error(error);
        }
      }
    };

    fetchGameAndUser();
  }, [gameSlug, requestedPageVersion]);

  useEffect(() => {
    if (!game || !user) return;

    const ratings = getSelectedStarsForVersion({
      ratings: user.ratings ?? game.ratings ?? [],
      userId: user.id,
      gameId: game.id,
      gamePageId: selectedPage?.id,
      pageVersion: selectedVersion,
    });

    setSelectedStars(ratings);
  }, [game, selectedPage?.id, selectedVersion, user]);

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

    const endpoint = `${BASE_URL}/image`;

    const res = await fetch(endpoint, {
      method: "POST",
      body: formData,
      headers: { authorization: `Bearer ${getCookie("token")}` },
      credentials: "include",
    });

    if (!res.ok) {
      addToast({ title: uiText("AppStrings.FailedToUploadImage") });
      throw new Error("Upload failed");
    }
    const json = await res.json();
    addToast({ title: json.message });
    return json.data as string; // URL
  };

  const itchEmbedUrl = toCanonicalItchEmbedUrl(displayGame?.itchEmbedUrl);
  const playableBuildUrl = displayGame?.playableBuildUrl
    ? getPlayableBuildUrl(displayGame.playableBuildUrl)
    : null;
  const playableEmbedUrl = playableBuildUrl || itchEmbedUrl;
  const itchEmbedAspectRatio = normalizeItchEmbedAspectRatio(
    displayGame?.itchEmbedAspectRatio,
  );
  const playableBuildAspectRatio = normalizeItchEmbedAspectRatio(
    displayGame?.playableBuildAspectRatio ?? displayGame?.itchEmbedAspectRatio,
  );
  const playableBuildShowFullscreenButton =
    displayGame?.playableBuildShowFullscreenButton ?? true;

  useEffect(() => {
    setIsItchEmbedActive(false);
  }, [playableEmbedUrl]);

  const trailerId = extractYouTubeId(displayGame?.trailerUrl);
  const screenshots = (displayGame?.screenshots ?? []).filter(Boolean);
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
  const screenshotIndices = useMemo(() => mediaItems.flatMap((item, index) => item.type === "screenshot" ? [index] : []), [mediaItems]);
  const navigateScreenshot = useCallback((direction: number) => {
    if (!screenshotIndices.length) return;
    setCurrentMediaIndex((index) => {
      const position = screenshotIndices.indexOf(index);
      return screenshotIndices[(position + direction + screenshotIndices.length) % screenshotIndices.length];
    });
  }, [screenshotIndices]);
  useEffect(() => {
    if (!isScreenshotViewerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsScreenshotViewerOpen(false);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        navigateScreenshot(event.key === "ArrowLeft" ? -1 : 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isScreenshotViewerOpen, navigateScreenshot]);
  const hasMedia = Boolean(trailerId || screenshots.length > 0);
  const trailerPlayerId =
    trailerId && displayGame ? `game-trailer-${displayGame.id}` : null;
  const firstScreenshotIndex = mediaItems.findIndex(
    (item) => item.type === "screenshot",
  );
  const gameplayDetails = (displayGame?.inputMethods ?? [])
    .map((method) => inputMethodMeta[method])
    .filter(Boolean);
  const playtimeDetails = [
    { label: uiText("AppStrings.PerRun"), value: displayGame?.estOneRun },
    { label: uiText("AppStrings.ToBeat"), value: displayGame?.estAnyPercent },
    { label: "100%", value: displayGame?.estHundredPercent },
  ].filter((entry) => entry.value);
  const gameEmotes = displayGame?.gameEmotes ?? [];
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
    if (isScreenshotViewerOpen || !selectedMedia || selectedMedia.type !== "screenshot") return;

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
  }, [currentMediaIndex, mediaItems, selectedMedia, isScreenshotViewerOpen]);

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

  if (!displayGame) return <GamePageLoading />;

  // Check if the logged-in user is the creator or a contributor
  const isEditable =
    user &&
    displayGame.team.users.some(
      (contributor: UserType) => contributor.id === user.id,
    );

  const canRateDisplayedTrack = Boolean(user) && !isEditable && selectedVersion === "JAM" &&
    activeJamResponse?.jam?.id === displayGame.jamId && isJamRatingOpenPhase && Boolean(trackOverallCategory);

  if (!displayGame.published && !isEditable && !game?.canViewUnpublished) {
    return <p>{uiText("AppStrings.ThisGameHasNotBeenPublished")}</p>;
  }

  const categoryAccent = colors[
    displayGame.category === "REGULAR" ? "blue"
      : displayGame.category === "ODA" ? "purple"
        : displayGame.category === "EXTERNAL" ? "orange" : "pink"
  ];

  return (
    <PriorityEmotesContext.Provider value={gameEmotes}>
      <GamePageBackground image={displayGame.pageBackground?.trim() || null} />
      <div
        style={{
          backgroundColor: siteTheme.colors["mantle"],
          borderColor: interactiveOutlineColor,
          color: siteTheme.colors["text"],
        }}
        className="relative border-0 lg:border rounded-none lg:rounded-xl overflow-visible"
      >
        <div
          className="relative h-60 overflow-hidden lg:rounded-t-[11px]"
          style={{
            backgroundColor: colors["base"],
          }}
        >
          {(displayGame.thumbnail || displayGame.banner) && (
            <Image
              src={displayGame.banner || displayGame.thumbnail || ""}
              alt={uiText("AppStrings.Value0SBanner", { value0: displayGame.name })}
              className="object-cover"
              fill
            />
          )}
        </div>
        <div
          className="grid gap-6 border-t p-4 md:p-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,962px)_minmax(360px,1fr)]"
          style={{
            borderColor: interactiveOutlineColor,
          }}
        >
          <div className="min-w-0 flex flex-col gap-4">
            <div>
              <p className="text-4xl">{displayGame.name}</p>
              <Hstack>
                <p
                  style={{
                    color: colors["textFaded"],
                  }}
                >
                   {uiText("PostCard.By")}{" "}
                  {displayGame.team.name ||
                    (displayGame.team.users.length == 1
                      ? displayGame.team.owner.name
                      : uiText("AppStrings.Value0STeam", { value0: displayGame.team.owner.name }))}{" "}
                </p>
                <Chip
                  style={{
                    backgroundColor: `color-mix(in srgb, ${categoryAccent} 10%, ${colors.mantle})`,
                    borderColor: `color-mix(in srgb, ${categoryAccent} 30%, ${colors.mantle})`,
                    color: siteTheme.type === "Light"
                      ? `color-mix(in srgb, ${categoryAccent} 55%, ${colors.text})`
                      : categoryAccent,
                  }}
                  key={displayGame.category}
                >
                  {displayGame.category}
                </Chip>
              </Hstack>
            </div>
            <div className="flex flex-wrap gap-2 lg:hidden" aria-label={uiText("AppStrings.GameInformation")}>
              {[
                { name: uiText("AppStrings.Details"), icon: "info", show: true },
                { name: uiText("AppStrings.Media"), icon: "image", show: hasMedia },
                { name: uiText("Stats.Ratings"), icon: "star", show: showRatingSection },
                { name: uiText("CreateGame.Soundtrack.Title"), icon: "music", show: soundtrackQueue.length > 0 },
                { name: uiText("CreateGame.Leaderboards.Title"), icon: "trophy", show: !!displayGame.leaderboards?.length },
                { name: uiText("CreateGame.Achievements.Title"), icon: "award", show: !!displayGame.achievements?.length },
                { name: uiText("AppStrings.Stats"), icon: "linechart", show: displayGame.category !== "EXTERNAL" },
              ].filter((section) => section.show).map((section) => <Button key={section.name} size="sm" variant="ghost" icon={section.icon as IconName} onClick={() => setMobileSection(section.name)}>{section.name}</Button>)}
            </div>
            {playableEmbedUrl && (
              <div
                className="box-content w-[calc(100%-2px)] max-w-[960px] rounded-xl overflow-hidden relative"
                style={{
                  aspectRatio: playableBuildUrl
                    ? playableBuildAspectRatio
                    : itchEmbedAspectRatio,
                  backgroundColor: colors["mantle"],
                  border: `1px solid ${interactiveOutlineColor}`,
                }}
              >
                {isItchEmbedActive ? (
                  <iframe
                    ref={playableEmbedRef}
                    key={playableEmbedUrl}
                    src={playableEmbedUrl}
                    title={uiText("AppStrings.Value0PlayableEmbed", { value0: displayGame.name })}
                    className="w-full h-full"
                    style={{ border: 0 }}
                    sandbox={
                      playableBuildUrl
                        ? getPlayableSandbox(playableEmbedUrl, window.location.origin)
                        : undefined
                    }
                    allow="fullscreen; gamepad"
                    allowFullScreen
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsItchEmbedActive(true)}
                    className="absolute inset-0 flex cursor-pointer items-center justify-center"
                    style={{
                      background:
                        colors["mantle"] ??
                        colors["base"] ??
                        "rgba(0, 0, 0, 0.72)",
                      color: colors["text"],
                    }}
                    aria-label={uiText("AppStrings.LoadValue0PlayableEmbed", { value0: displayGame.name })}
                  >
                    <span
                      className="flex items-center gap-3 text-base font-semibold transition-transform hover:scale-105"
                    >
                      <Play size={20} fill="currentColor" />
                       {uiText("AppStrings.PlayGame")} </span>
                  </button>
                )}
                {playableBuildUrl &&
                  playableBuildShowFullscreenButton &&
                  isItchEmbedActive && (
                    <button
                      type="button"
                      aria-label={uiText("AppStrings.OpenGameInFullscreen")}
                      title={uiText("AppStrings.Fullscreen")}
                      className="absolute bottom-3 right-3 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg shadow-lg transition-[filter,transform] duration-150 hover:scale-110 hover:brightness-150 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none motion-reduce:transform-none"
                      style={{
                        backgroundColor: colors["mantle"],
                        color: colors["text"],
                        border: `1px solid ${interactiveOutlineColor}`,
                      }}
                      onClick={() => {
                        void playableEmbedRef.current
                          ?.requestFullscreen()
                          .catch(() => {
                            addToast({ title: uiText("AppStrings.FullscreenIsUnavailable") });
                          });
                      }}
                    >
                      <Icon name="expand" color="text" />
                    </button>
                  )}
              </div>
            )}
            {!playableEmbedUrl && sortedDownloadLinks.length > 0 && (
              <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
                {sortedDownloadLinks.map((downloadLink) => {
                  const icon = getPlatformIcon(downloadLink.platform);

                  return (
                    <a
                      key={downloadLink.id}
                      href={downloadLink.url}
                      className="group flex min-h-28 flex-col items-center justify-center gap-3 rounded-xl px-5 py-5 text-center font-semibold transition-transform hover:-translate-y-0.5 hover:scale-[1.02]"
                      style={{
                        backgroundColor: colors["surface0"],
                        border: `1px solid ${interactiveOutlineColor}`,
                        color: colors["text"],
                      }}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: colors["surface1"],
                          color: colors["text"],
                        }}
                      >
                        <Icon name={icon} size={22} />
                      </span>
                      <span className="text-base leading-tight">
                        {downloadLink.platform}
                      </span>
                    </a>
                  );
                })}
              </div>
            )}
            <ThemedProse className="game-page-description [&>div>:last-child]:!mb-0 [&>div>:last-child>:last-child]:!mb-0">
              <MentionedContent
                html={displayGame?.description || t("General.NoDescription")}
              />
            </ThemedProse>
            <Hstack wrap className="mt-auto">
              {sortedDownloadLinks.map((downloadLink) => (
                <Button
                  className="transition-transform hover:-translate-y-0.5 hover:scale-[1.02]"
                  externalIcon={false}
                  style={{ boxShadow: "none", borderColor: interactiveOutlineColor, backgroundColor: colors["surface0"] }}
                  icon={getPlatformIcon(downloadLink.platform)}
                  key={downloadLink.id}
                  href={downloadLink.url}
                >
                  {downloadLink.platform}
                </Button>
              ))}
            </Hstack>
          </div>
          <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-4">
            <GameSidebarSection name="Details" selected={mobileSection} onClose={() => setMobileSection(null)}>
            <Card padding={1} shadow="none">
                {hasGameplayDetails && (
                  <div className="absolute right-0 top-0 z-20 hidden items-center gap-1 lg:flex">
                    {gameplayDetails.length > 0 && (
                      <GameInfoButton label={uiText("AppStrings.Controls")} icon="gamepad2">
                        <div className="flex flex-wrap gap-2">
                          {gameplayDetails.map((method) => (
                            <Chip key={method.label} className="post-tag-chip" style={{ borderColor: interactiveOutlineColor }} icon={method.icon}>{uiText(method.label)}</Chip>
                          ))}
                        </div>
                      </GameInfoButton>
                    )}
                    {playtimeDetails.length > 0 && (
                      <GameInfoButton label={uiText("AppStrings.Playtime")} icon="clock">
                        <dl className="flex flex-col gap-2 text-sm">
                          {playtimeDetails.map((entry) => (
                            <div key={entry.label} className="flex items-start justify-between gap-4">
                              <dt style={{ color: colors.textFaded }}>{uiText(entry.label)}</dt>
                              <dd className="text-right">{entry.value}</dd>
                            </div>
                          ))}
                        </dl>
                      </GameInfoButton>
                    )}
                  </div>
                )}
              <Vstack align="stretch" gap={3}>
                {isEditable && (
                  <Hstack className={hasGameplayDetails ? "flex-wrap lg:pr-16" : "flex-wrap"}>
                    <div>
                      <Button
                        icon="squarepen"
                        href={`/g/${displayGame.slug}/edit`}
                        style={{ boxShadow: "none" }}
                      >
                         {uiText("ThemeSuggestions.Edit.Title")} </Button>
                    </div>
                    {displayGame.category != "ODA" && (
                      <div>
                        <Button
                          icon="users"
                          href={`/team?teamId=${displayGame.teamId}`}
                          style={{ boxShadow: "none" }}
                        >
                           {uiText("AppStrings.EditTeam")} </Button>
                      </div>
                    )}
                  </Hstack>
                )}
                {game?.postJamPage && (
                  <div className={`flex pb-1 ${hasGameplayDetails && !isEditable ? "lg:pr-16" : ""}`}>
                    <PageVersionToggle
                      borderColor={interactiveOutlineColor}
                      value={selectedVersion}
                      onChange={setSelectedVersion}
                    />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <div className={`flex min-h-6 items-center gap-2 ${hasGameplayDetails && !isEditable && !game?.postJamPage ? "lg:pr-16" : ""}`}>
                  <p
                    className="text-xs leading-4"
                    style={{
                      color: colors["textFaded"],
                    }}
                  >
                     {uiText("AppStrings.AUTHORS")} </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {displayGame.team.users.map((user) => (
                      <UserHoverPreview key={user.id} user={user} portal>
                      <Chip className="post-tag-chip" style={{ borderColor: interactiveOutlineColor }}
                        avatarSrc={user.profilePicture}
                        href={`/u/${user.slug}`}
                      >
                        {user.name}
                      </Chip>
                      </UserHoverPreview>
                    ))}
                  </div>
                </div>

                {displayGame.tags && displayGame.tags.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p
                      className="text-xs leading-4"
                      style={{
                        color: colors["textFaded"],
                      }}
                    >
                       {uiText("AppStrings.TAGS")} </p>
                    <div className="flex flex-wrap gap-2">
                      {displayGame.tags.map((tag) => (
                        <Chip style={{ borderColor: interactiveOutlineColor }} key={tag.id} className="post-tag-chip">
                          {tag.name}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
                {displayGame.flags && displayGame.flags.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p
                      className="text-xs leading-4"
                      style={{
                        color: colors["textFaded"],
                      }}
                    >
                       {uiText("AppStrings.FLAGS")} </p>
                    <div className="flex flex-wrap gap-2">
                      {displayGame.flags.map((flag) => (
                        <Chip className="post-tag-chip" style={{ borderColor: interactiveOutlineColor }} key={flag.id}>{flag.name}</Chip>
                      ))}
                    </div>
                  </div>
                )}
                {displayGame.downloadLinks &&
                  displayGame.downloadLinks.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <p
                        className="text-xs leading-4"
                        style={{
                          color: colors["textFaded"],
                        }}
                      >
                         {uiText("AppStrings.LINKS")} </p>
                      <div className="flex flex-col gap-2 items-start">
                        {displayGame.downloadLinks.map((link) => (
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
                    </div>
                  )}
                {gameplayDetails.length > 0 && <div className="flex flex-col gap-2 lg:hidden">
                  <p className="text-xs leading-4" style={{ color: colors.textFaded }}>{uiText("AppStrings.CONTROLS")}</p>
                  <div className="flex flex-wrap gap-2">
                    {gameplayDetails.map((method) => <Chip key={method.label} className="post-tag-chip" style={{ borderColor: interactiveOutlineColor }} icon={method.icon}>{uiText(method.label)}</Chip>)}
                  </div>
                </div>}
                {playtimeDetails.length > 0 && <div className="flex flex-col gap-2 lg:hidden">
                  <p className="text-xs leading-4" style={{ color: colors.textFaded }}>{uiText("AppStrings.PLAYTIME")}</p>
                  <dl className="flex flex-col gap-2 text-sm">
                    {playtimeDetails.map((entry) => <div key={entry.label} className="flex items-start justify-between gap-4">
                      <dt style={{ color: colors.textFaded }}>{uiText(entry.label)}</dt>
                      <dd className="text-right">{entry.value}</dd>
                    </div>)}
                  </dl>
                </div>}
              </Vstack>
            </Card>
            </GameSidebarSection>
            <GameSidebarSection name="Media" selected={mobileSection} onClose={() => setMobileSection(null)}>
            {hasMedia && (
              <Card padding={1} shadow="none">
                <Vstack align="stretch" gap={2}>
                  <p
                    className="text-xs leading-4"
                    style={{
                      color: colors["textFaded"],
                    }}
                  >
                     {uiText("AppStrings.MEDIA")} </p>
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
                            title={uiText("AppStrings.Value0Trailer", { value0: displayGame.name })}
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
                              alt={uiText("AppStrings.Value0ScreenshotValue1", { value0: displayGame.name, value1: selectedMedia.index + 1 })}
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
                              aria-label={uiText("AppStrings.ShowPreviousMedia")}
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
                              aria-label={uiText("AppStrings.ShowNextMedia")}
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
                              aria-label={uiText("AppStrings.ShowValue0", { value0: label.toLowerCase() })}
                            >
                              <img
                                src={thumbnailSrc}
                                alt={uiText("AppStrings.Value0Value1", { value0: displayGame.name, value1: label.toLowerCase() })}
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

            </GameSidebarSection>
            <GameSidebarSection name="Ratings" selected={mobileSection} onClose={() => setMobileSection(null)}>
            {showRatingSection && (
            <Card padding={1} shadow="none">
              <Vstack align="start">
                <p
                  className="text-xs leading-4"
                  style={{
                    color: colors["textFaded"],
                  }}
                >
                   {uiText("AppStrings.RATINGS")} </p>
                {showScoreResults && (
                    <>
                      {currentScoreKeys
                        .sort((a, b) =>
                          compareGameScoreEntries(
                            currentScores[a],
                            currentScores[b],
                          ),
                        )
                        .map((score) => {
                          const { gradient, first } = getResultsGradient(
                            currentScores[score].placement,
                            currentScores[score].averageScore,
                            colors,
                          );

                          return (
                            <div
                              key={score}
                              className="grid grid-cols-[150px_100px_30px] items-center gap-2"
                            >
                              <span
                                style={{
                                  color: colors["textFaded"],
                                }}
                                className="text-sm"
                              >
                                {t(score)}:
                              </span>
                              {currentScores[score].placement &&
                              currentScores[score].placement !== -1 ? (
                                <Tooltip
                                  content={ordinal_suffix_of(
                                    currentScores[score].placement,
                                  )}
                                  position="top"
                                >
                                  <span
                                    style={gradientTextStyle(gradient, first)}
                                    className="w-fit"
                                  >
                                    {(
                                      currentScores[score].averageScore / 2
                                    ).toFixed(2)}{" "}
                                     {uiText("AppStrings.Stars")} </span>
                                </Tooltip>
                              ) : (
                                <span
                                  style={gradientTextStyle(gradient, first)}
                                  className="w-fit"
                                >
                                  {(
                                    currentScores[score].averageScore / 2
                                  ).toFixed(2)}{" "}
                                   {uiText("AppStrings.Stars")} </span>
                              )}
                              <span className="flex items-center justify-center">
                                {getResultsIcon(
                                  currentScores[score].placement,
                                  currentScores[score].averageScore,
                                  first,
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
                            data={currentScoreKeys.map(
                              (score) => ({
                                subject: t(score),
                                A: currentScores[score].averageScore / 2,
                                B:
                                  currentScores[score].averageUnrankedScore / 2,
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
                {isEditable && isCurrentJamGame && isRatingOpenPhase && (
                  <Text size="xs" color="textFaded">
                     {uiText("AppStrings.YouCanAndAposTRateYourOwn")} </Text>
                )}
                {!user && isCurrentJamGame && isRatingOpenPhase && (
                  <Text size="xs" color="textFaded">
                     {uiText("AppStrings.YouMustBeLoggedInToRateGames")} </Text>
                )}
                {!isEditable &&
                  user?.teams.filter((team) => team.game && team.game.published)
                    .length == 0 &&
                  isCurrentJamGame &&
                  !isRatingOpenPhase &&
                  !shouldShowCurrentJamResults && (
                    <Text size="xs" color="textFaded">
                       {uiText("AppStrings.ItIsNotTheRatingPeriod")} </Text>
                  )}
                {!isEditable &&
                  user?.teams.filter((team) => team.game && team.game.published)
                    .length == 0 &&
                  isCurrentJamGame &&
                  isRatingOpenPhase && (
                    <Text size="xs" color="textFaded">
                       {uiText("AppStrings.YourRatingsWillNotCountTowardsTheRankings")} </Text>
                  )}
                <div>
                  {user &&
                    !isEditable &&
                    isCurrentJamGame &&
                    isRatingOpenPhase && (
                      <Vstack align="start">
                        <RatingVisibilityGate
                          hiddenByPreference={effectiveHideRatings}
                          hiddenText="Ratings are hidden by your settings."
                        >
                          <Vstack align="start">
                            <Text size="xs" color="textFaded">
                               {uiText("AppStrings.RatingsAreAutomaticallySaved")} </Text>
                            {[
                              ...displayGame.ratingCategories,
                              ...ratingCategories,
                            ]
                              .filter((category) =>
                                selectedVersion === "POST_JAM"
                                  ? category.name ===
                                    "RatingCategory.Overall.Title"
                                  : true,
                              )
                              .sort((a, b) => b.order - a.order)
                              .map((ratingCategory) => (
                                <StarRow
                                  key={ratingCategory.id}
                                  id={ratingCategory.id}
                                  name={t(ratingCategory.name)}
                                  text={
                                    (ratingCategory.name === "RatingCategory.Theme.Title" ||
                                      ratingCategory.name === "Theme")
                                      ? displayGame.themeJustification
                                      : ""
                                  }
                                  description={t(ratingCategory.description)}
                                  hoverStars={hoverStars}
                                  setHoverStars={setHoverStars}
                                  hoverCategory={hoverCategory}
                                  setHoverCategory={setHoverCategory}
                                  selectedStars={selectedStars}
                                  setSelectedStars={setSelectedStars}
                                  gameId={displayGame.id}
                                  gamePageId={selectedPage?.id ?? 0}
                                  pageVersion={selectedVersion}
                                />
                              ))}
                          </Vstack>
                        </RatingVisibilityGate>
                        <Text size="sm" color="textFaded">
                           {uiText("AppStrings.LeaveSomeFeedbackForTheCreatorsWhatDid")} </Text>
                        <CreateComment
                          gamePageId={selectedPage?.id}
                          size="xs"
                        />
                      </Vstack>
                    )}
                </div>
              </Vstack>
            </Card>
            )}

            </GameSidebarSection>
            <GameSidebarSection name="Soundtrack" selected={mobileSection} onClose={() => setMobileSection(null)}>
            {soundtrackQueue.length > 0 && (
              <Card padding={1} shadow="none">
                <Vstack align="stretch" gap={0}>
                  <div className="flex items-center gap-3 pb-3">
                    <img
                      src={displayGame.soundtrackThumbnail || displayGame.thumbnail || "/images/D2J_Icon.png"}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{uiText("CreateGame.Soundtrack.Title")}</p>
                      <p className="text-xs leading-4" style={{ color: colors.textFaded }}>
                        {soundtrackQueue.length} {soundtrackQueue.length === 1 ? uiText("AppStrings.Track") : uiText("AppStrings.Tracks")}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={isSoundtrackCurrent && isPlaying ? "pause" : "play"}
                      aria-label={isSoundtrackCurrent && isPlaying ? uiText("AppStrings.PauseSoundtrack") : isSoundtrackCurrent ? uiText("AppStrings.ResumeSoundtrack") : uiText("AppStrings.PlaySoundtrackFromTheFirstTrack")}
                      className="shrink-0"
                      onClick={() => {
                        if (isSoundtrackCurrent) {
                          toggle();
                          return;
                        }
                        const firstTrack = soundtrackQueue[0];
                        if (!firstTrack) return;
                        void playItem({
                          slug: firstTrack.slug,
                          name: firstTrack.name,
                          artist: firstTrack.composer,
                          thumbnail: displayGame.soundtrackThumbnail || displayGame.thumbnail || "/images/D2J_Icon.png",
                          game: firstTrack.game,
                          song: firstTrack.url,
                          loudnessGainDb: firstTrack.loudnessGainDb,
                        }, soundtrackQueue);
                      }}
                    >
                      {isSoundtrackCurrent && isPlaying ? uiText("AppStrings.Pause") : uiText("AppStrings.Play")}
                    </Button>
                  </div>
                  <ScrollableTracks activeIndex={soundtrackQueue.findIndex((track) => current?.slug === track.slug || current?.song === track.url)}>
                  {soundtrackQueue.map((track, index) => (
                    <SidebarSong
                      key={track.id}
                      playlistIndex={index}
                      trackId={track.id}
                      slug={track.slug}
                      name={track.name}
                      artist={track.composer}
                      squareThumbnail
                      showGame={false}
                      thumbnail={displayGame.soundtrackThumbnail || displayGame.thumbnail || "/images/D2J_Icon.png"}
                      game={track.game}
                      song={track.url}
                      loudnessGainDb={track.loudnessGainDb}
                      queue={soundtrackQueue}
                      license={track.license}
                      allowDownload={track.allowDownload}
                      allowBackgroundUse={track.allowBackgroundUse}
                      allowBackgroundUseAttribution={track.allowBackgroundUseAttribution}
                      ratingValue={trackSelectedStars[track.id] ?? 0}
                      showRating={canRateDisplayedTrack && !isOwnTrack(track, user)}
                      hideRatings={effectiveHideRatings}
                      ratingDisabled={!canRateDisplayedTrack || isOwnTrack(track, user)}
                      onRate={async (value) => {
                        if (!canRateDisplayedTrack || isOwnTrack(track, user) || !trackOverallCategory) return;
                        const previous = trackSelectedStars[track.id] ?? 0;
                        emitTrackRatingSync({ trackId: track.id, categoryId: trackOverallCategory.id, value });
                        setTrackSelectedStars((prev) => ({ ...prev, [track.id]: value }));
                        const response = await postTrackRating(track.id, trackOverallCategory.id, value);
                        if (!response.ok) {
                          const payload = await response.json().catch(() => null);
                          addToast({ title: payload?.message ?? uiText("AppStrings.FailedToSaveTrackRating") });
                          emitTrackRatingSync({ trackId: track.id, categoryId: trackOverallCategory.id, value: previous });
                          setTrackSelectedStars((prev) => ({ ...prev, [track.id]: previous }));
                        }
                      }}
                    />
                  ))}
                  </ScrollableTracks>
                </Vstack>
              </Card>
            )}

            </GameSidebarSection>
            <GameSidebarSection name="Leaderboards" selected={mobileSection} onClose={() => setMobileSection(null)}>
            {!!displayGame.leaderboards?.length && <GameLeaderboards key={`${displayGame.id}-${selectedVersion}`} leaderboards={displayGame.leaderboards} userId={user?.id} canManage={!!(isEditable || user?.mod)} onSubmit={(leaderboard) => {
              setSelectedLeaderboard(leaderboard);
              setIsOpen2(true);
            }} onDelete={async (score) => {
              if (await deleteScore(score.id)) window.location.reload();
            }} />}
            </GameSidebarSection>
            <GameSidebarSection name="Achievements" directMobile selected={mobileSection} onClose={() => setMobileSection(null)}>
            {(mobile) => displayGame.achievements &&
              displayGame.achievements.length > 0 && (
                <GameAchievements modalOnly={mobile} onClose={() => setMobileSection(null)} gameName={displayGame.name} achievements={displayGame.achievements} userId={user?.id} thumbnail={displayGame.thumbnail} engagedUsers={engagedUserIds.size} onToggle={async (achievement) => {
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
                                      const payload = await res.json().catch(() => null);
                                      const nextUnlocks = (achievement.unlocks ?? []).filter((entry) => entry.userId !== user.id);
                                      if (!hasIt && payload?.earnedAt) nextUnlocks.push({ userId: user.id, earnedAt: payload.earnedAt });
                                      const nextUsers = hasIt
                                        ? achievement.users.filter(
                                            (u) => u.id !== user.id,
                                          )
                                        : [...achievement.users, user];

                                      setGame((prev) => {
                                        if (!prev) return prev;

                                        const targetPageKey =
                                          selectedVersion === "POST_JAM"
                                            ? "postJamPage"
                                            : "jamPage";
                                        const targetPage = prev[targetPageKey];

                                        if (!targetPage) return prev;

                                        const updatedPage = {
                                          ...targetPage,
                                          achievements: (
                                            targetPage.achievements ?? []
                                          ).map((entry) =>
                                            entry.id === achievement.id
                                              ? {
                                                  ...entry,
                                                  users: nextUsers,
                                                  unlocks: nextUnlocks,
                                                }
                                              : entry,
                                          ),
                                        };

                                        return {
                                          ...prev,
                                          [targetPageKey]: updatedPage,
                                          achievements:
                                            selectedVersion === "JAM"
                                              ? updatedPage.achievements
                                              : prev.achievements,
                                        };
                                      });
                                    } else {
                                      const payload = await res
                                        .json()
                                        .catch(() => null);
                                      addToast({
                                        title:
                                          payload?.message ??
                                          uiText("AppStrings.FailedToUpdateAchievement"),
                                      });
                                    }
}} />
              )}
            </GameSidebarSection>
            <GameSidebarSection name="Stats" selected={mobileSection} onClose={() => setMobileSection(null)}>
{displayGame.category !== "EXTERNAL" && (
              <Card padding={1} shadow="none">
                <Vstack align="start">
                <p
                  className="text-xs leading-4"
                  style={{
                    color: colors["textFaded"],
                  }}
                >
                   {uiText("AppStrings.STATS")} </p>
                <Vstack align="start" gap={1.5}>
                  <Chip className="post-tag-chip" style={{ borderColor: interactiveOutlineColor }}>
                     {uiText("AppStrings.RatingsReceived")}{" "}
                    {Math.round(
                      (game?.ratings ?? []).filter(
                        (rating) =>
                          (rating.pageVersion ?? "JAM") === selectedVersion,
                      ).length /
                        (displayGame.ratingCategories.length +
                          ratingCategories.length),
                    )}
                  </Chip>
                  {displayGame.category !== "EXTRA" &&
                    selectedVersion !== "POST_JAM" && (
                    <Hstack>
                      <Chip className="post-tag-chip" style={{ borderColor: interactiveOutlineColor }}>
                         {uiText("AppStrings.RankedRatingsReceived")}{" "}
                        {Math.round(
                          (game?.ratings ?? []).filter(
                            (rating) =>
                              (rating.pageVersion ?? "JAM") ===
                                selectedVersion &&
                              rating.user.teams.filter(
                                (team) =>
                                  team.game &&
                                  team.game.jamId == displayGame.jamId &&
                                  team.game.published &&
                                  team.game.category !== "EXTRA" &&
                                  team.game.category !== "EXTERNAL",
                              ).length > 0,
                          ).length /
                            (displayGame.ratingCategories.length +
                              ratingCategories.length),
                        )}
                      </Chip>

                      {Math.round(
                        (game?.ratings ?? []).filter(
                          (rating) =>
                            (rating.pageVersion ?? "JAM") === selectedVersion &&
                            rating.user.teams.filter(
                              (team) =>
                                team.game &&
                                team.game.jamId == displayGame.jamId &&
                                team.game.published &&
                                team.game.category !== "EXTRA" &&
                                team.game.category !== "EXTERNAL",
                            ).length > 0,
                        ).length /
                          (displayGame.ratingCategories.length +
                            ratingCategories.length),
                      ) < 5 && (
                        <Tooltip
                          content="This game needs 5 ratings received in order to be ranked after the rating period"
                          position="top"
                        >
                          <AlertTriangle size={16} style={{ color: colors["red"] }} />
                        </Tooltip>
                      )}
                    </Hstack>
                  )}
                  <Hstack>
                    <Chip className="post-tag-chip" style={{ borderColor: interactiveOutlineColor }}>
                       {uiText("AppStrings.RatingsGiven2")}{" "}
                      {Math.round(
                        displayGame.team.users.reduce(
                          (prev, cur) =>
                            prev +
                            cur.ratings.reduce(
                              (prev2, cur2) =>
                                prev2 +
                                ((((cur2 as any).pageVersion as
                                  | PageVersion
                                  | undefined) ?? "JAM") === selectedVersion &&
                                cur2.game.jamId === displayGame.jamId
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
                      displayGame.team.users.reduce(
                        (prev, cur) =>
                          prev +
                          cur.ratings.reduce(
                            (prev2, cur2) =>
                              prev2 +
                              ((((cur2 as any).pageVersion as
                                | PageVersion
                                | undefined) ?? "JAM") === selectedVersion &&
                              cur2.game.jamId === displayGame.jamId
                                ? 1 /
                                  (cur2.game.ratingCategories.length +
                                    ratingCategories.length)
                                : 0),
                            0,
                          ),
                        0,
                      ),
                    ) < 5 &&
                      selectedVersion !== "POST_JAM" && (
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
            )}
            </GameSidebarSection>
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
                <div className="relative flex max-h-[90vh] max-w-[92vw] flex-col items-center gap-3 p-4">
                  <img
                    src={selectedMedia.src}
                    alt={uiText("AppStrings.Value0ScreenshotValue1", { value0: displayGame.name, value1: selectedMedia.index + 1 })}
                    className="max-h-[min(720px,76vh)] max-w-[min(1280px,calc(92vw-32px))] object-contain"
                  />
                  <div className="flex items-center gap-3 rounded-lg border p-2" style={{ backgroundColor: colors.mantle, borderColor: interactiveOutlineColor }}>
                    <Button icon="chevronleft" variant="ghost" aria-label={uiText("AppStrings.PreviousScreenshot")} disabled={screenshotIndices.length < 2} onClick={() => navigateScreenshot(-1)} />
                    <span className="text-sm tabular-nums" aria-live="polite">{screenshotIndices.indexOf(currentMediaIndex) + 1} / {screenshotIndices.length}</span>
                    <Button icon="chevronright" variant="ghost" aria-label={uiText("AppStrings.NextScreenshot")} disabled={screenshotIndices.length < 2} onClick={() => navigateScreenshot(1)} />
                    <Button icon="x" variant="ghost" aria-label={uiText("AppStrings.CloseScreenshotViewer")} onClick={() => setIsScreenshotViewerOpen(false)} />
                  </div>
                </div>
              )}
            </Popover>
            <Popover
              showCloseButton
              position="center"
              backdrop
              backdropColor="rgba(0, 0, 0, 0.78)"
              shown={isOpen}
              onClose={() => {
                setIsOpen(false);
              }}
            >
              <div className="w-[300px] h-[300px]">
                <Image
                  src={selectedScore}
                  alt={uiText("AppStrings.EvidenceImage")}
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
              title={selectedLeaderboard?.name || uiText("AppStrings.Leaderboard2")}
              onSubmit={async (form) => {
                // Validate evidence
                const evidenceUrl = form["evidence"];
                if (!evidenceUrl) {
                  addToast({ title: uiText("AppStrings.NoEvidenceImageProvided") });
                  return;
                }
                if (!selectedLeaderboard) {
                  addToast({ title: uiText("AppStrings.NoLeaderboardSelected") });
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
                  addToast({ title: uiText("AppStrings.PleaseEnterAValidScoreTime") });
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
                        label: uiText("AppStrings.Hours"),
                        description: uiText("AppStrings.EnterHours"),
                        min: 0,
                        max: 24,
                        defaultValue: "0",
                      },
                      {
                        type: "number",
                        name: "minutes",
                        label: uiText("AppStrings.Minutes"),
                        description: uiText("AppStrings.EnterMinutes"),
                        min: 0,
                        max: 59,
                        defaultValue: "0",
                      },
                      {
                        type: "number",
                        name: "seconds",
                        label: uiText("AppStrings.Seconds"),
                        description: uiText("AppStrings.EnterSeconds"),
                        min: 0,
                        max: 59,
                        defaultValue: "0",
                      },
                      {
                        type: "number",
                        name: "milliseconds",
                        label: uiText("AppStrings.Milliseconds"),
                        description:
                          uiText("AppStrings.EnterMillisecondsEnterAll3Digits43430"),
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
                        label: uiText("LeaderboardType.Score.Title"),
                        description: uiText("AppStrings.EnterYourScore"),
                        required: true,
                      },
                    ] as const)
                  : []),
                {
                  type: "imageUpload",
                  name: "evidence",
                  label: uiText("AppStrings.EvidencePicture"),
                  description:
                    uiText("AppStrings.UploadAScreenshotPhotoToVerifyYourResult"),
                  upload: uploadEvidence,
                  accept: "image/*",
                  previewHeight: 240,
                },
              ]}
            />
          </div>
        </div>
      </div>
      {mobileLayout ? <div className="my-6 px-3">
        <CreateComment gamePageId={selectedPage?.id} />
      </div> : <Card padding={1.5} shadow="none" className="my-10 max-lg:!rounded-none">
        <CreateComment gamePageId={selectedPage?.id} />
      </Card>}

      <div className="flex flex-col gap-3">
        {displayComments
          ?.sort((a, b) => b.id - a.id)
          .map((comment) => (
            <div key={comment.id}>
              <CommentCard comment={comment} user={user} edgeToEdge />
            </div>
          ))}
      </div>
    </PriorityEmotesContext.Provider>
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
  gamePageId,
  pageVersion,
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
  gamePageId: number;
  pageVersion: PageVersion;
}) {
  const uiText = useUiTranslations();
  const [newlyClicked, setNewlyClicked] = useState<boolean>(false);
  const { colors } = useTheme();
  const themeJustification = text?.trim();
  const showThemeJustification = Boolean(themeJustification);

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
            gamePageId={gamePageId}
            pageVersion={pageVersion}
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
              <p className="text-lg font-bold">{uiText("CreateGame.Theme.Title")}</p>
              <p>{themeJustification}</p>
            </div>
          }
          position="top"
        >
          <span
            className="inline-flex items-center"
            aria-label={uiText("AppStrings.ThemeJustification")}
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
  gamePageId,
  pageVersion,
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
  gamePageId: number;
  pageVersion: PageVersion;
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
          postRating(gameId, gamePageId, id, value - 1, pageVersion);
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
          postRating(gameId, gamePageId, id, value, pageVersion);
        }}
      />
    </div>
  );
}
