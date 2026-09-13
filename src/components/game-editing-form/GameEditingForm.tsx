import { translateSystemLabel } from "@/helpers/systemLabels";
"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/queries/queryKeys";

import "./game-editor.css";
import EditorFooter from "./EditorFooter";
import ItemEditor from "./ItemEditor";
import AudioPreview from "./AudioPreview";
import ArtistSuggestions from "./ArtistSuggestions";
import LeaderboardManager from "./LeaderboardManager";
import ReorderControls, { moveItem } from "./ReorderControls";

import { Button } from "bioloom-ui";
import { Card } from "bioloom-ui";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "bioloom-ui";
import { Dropdown } from "bioloom-ui";
import { Icon, IconName } from "bioloom-ui";
import { Input } from "bioloom-ui";
import { ImageCropData, ImageInput } from "bioloom-ui";
import { Spinner } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { getCookie } from "@/helpers/cookie";
import { BASE_URL, getPlayableBuildUrl } from "@/requests/config";
import { useCurrentJam } from "@/hooks/queries";
import { sanitize } from "@/helpers/sanitize";
import useHasMounted from "@/hooks/useHasMounted";
import {
  getFlags,
  getGameTags,
  getRatingCategories,
  postGame,
  updateGame,
  uploadWebBuild,
} from "@/requests/game";
import { getTrackFlags, getTrackTags } from "@/requests/track";
import { getTeamsUser } from "@/requests/team";
import { AchievementType } from "@/types/AchievementType";
import { DownloadLinkType, PlatformType } from "@/types/DownloadLinkType";
import { FlagType } from "@/types/FlagType";
import { GameTagType } from "@/types/GameTagType";
import { GameEmbedAspectRatio, GameType } from "@/types/GameType";
import { PageVersion } from "@/types/GameType";
import { LeaderboardInput } from "@/types/LeaderboardType";
import { RatingCategoryType } from "@/types/RatingCategoryType";
import { TeamType } from "@/types/TeamType";
import { addToast, Avatar, Form } from "bioloom-ui";
import Image from "@/compat/next-image";
import {
  ReactNode,
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Select, { StylesConfig } from "react-select";
import { Switch } from "bioloom-ui";
import { getIcon } from "@/helpers/icon";
import { Textarea } from "bioloom-ui";
import Editor from "@/components/editor";
import {
  backgroundUsageAttributionAllowedByDefault,
  backgroundUsageAttributionWithLicenseDefaults,
  backgroundUsageAllowedByDefault,
  backgroundUsageRequiredByLicense,
  backgroundUsageWithLicenseDefaults,
  licenseFlagsToLabel,
  LicenseFlags,
  licenseModeForFlags,
  LicenseMode,
  parseLicenseFlags,
  SINGLE_TRACK_TAG_CATEGORIES,
  TRACK_CREDIT_ROLE_OPTIONS,
  TRACK_TAG_CATEGORY_HELPERS,
} from "@/components/tracks/editingShared";
import { redirect, useRouter } from "@/compat/next-navigation";
import { useTranslations } from "@/compat/next-intl";
import { getSelf, searchUsers } from "@/requests/user";
import { UserType } from "@/types/UserType";
import { TrackType } from "@/types/TrackType";
import { TrackFlagType } from "@/types/TrackFlagType";
import { TrackTagType } from "@/types/TrackTagType";
import { useTheme } from "@/providers/useSiteTheme";
import { useEmojis } from "@/providers/useEmojis";
import { getApiErrorMessage, readArray, readItem, unwrapItem } from "@/requests/helpers";
import { debounce } from "lodash";
import { createTeam } from "@/helpers/team";
import { Tab, Tabs } from "bioloom-ui";
import { createGameEmoji, deleteEmoji, updateEmoji } from "@/requests/emoji";

type InputMethodType =
  | "KeyboardMouse"
  | "Gamepad"
  | "Touch"
  | "KeyboardOnly"
  | "MouseOnly"
  | "Motion"
  | "VR"
  | "Other";

const MIN_EMOTE_PREFIX_LENGTH = 4;
const MAX_EMOTE_PREFIX_LENGTH = 8;
const YT_ID_REGEX =
  /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/;

const extractYouTubeId = (url: string): string | null => {
  const m = url.match(YT_ID_REGEX);
  return m ? m[1] : null;
};

const toCanonicalItchEmbedUrl = (url: string): string | null => {
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
};

const INPUT_METHOD_OPTIONS: {
  value: InputMethodType;
  label: string;
  icon?: IconName;
}[] = [
  { value: "KeyboardMouse", label: "AppStrings.KeyboardMouse", icon: "keyboard" },
  { value: "Gamepad", label: "AppStrings.GamepadController", icon: "gamepad2" },
  { value: "Touch", label: "AppStrings.Touch", icon: "touchpad" },
  { value: "KeyboardOnly", label: "AppStrings.KeyboardOnly", icon: "keyboard" },
  { value: "MouseOnly", label: "AppStrings.MouseOnly", icon: "mouse" },
  { value: "Motion", label: "AppStrings.MotionControls", icon: "move3d" },
  { value: "VR", label: "AppStrings.VR", icon: "headset" },
  { value: "Other", label: "AppStrings.Other", icon: "morehorizontal" },
];

const INPUT_METHOD_VALUES = new Set<InputMethodType>(
  INPUT_METHOD_OPTIONS.map((option) => option.value),
);

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

const normalizeItchEmbedAspectRatio = (
  value?: string | null,
): GameEmbedAspectRatio => {
  if (
    value &&
    ITCH_EMBED_ASPECT_RATIO_OPTIONS.includes(value as GameEmbedAspectRatio)
  ) {
    return value as GameEmbedAspectRatio;
  }
  return "16 / 9";
};

const isInputMethodType = (value: string): value is InputMethodType =>
  INPUT_METHOD_VALUES.has(value as InputMethodType);

const TIME_OPTIONS = [
  "Under 5 mins",
  "5–10 mins",
  "10–20 mins",
  "20-30 mins",
  "30–60 min",
  "1–2 hours",
  "2–3 hours",
  "3–5 hours",
  "5–10 hours",
  "10+ hours",
] as const;

type SongCreditEdit = {
  id: number;
  role: string;
  userId: number | null;
  user?: Pick<
    UserType,
    "id" | "name" | "slug" | "profilePicture" | "short"
  > | null;
};

type SongLinkEdit = {
  id: number;
  label: string;
  url: string;
};

type SongEdit = {
  id: number;
  slug: string;
  name: string;
  url: string;
  commentary?: string | null;
  tagIds: number[];
  flagIds: number[];
  bpm?: number | null;
  musicalKey?: string | null;
  integratedLufs?: number | null;
  truePeakDb?: number | null;
  loudnessGainDb?: number | null;
  softwareUsed: string[];
  license: string;
  allowDownload: boolean;
  allowBackgroundUse: boolean;
  allowBackgroundUseAttribution: boolean;
  licenseAttribution: boolean;
  licenseCommercial: boolean;
  licenseDerivatives: boolean;
  licenseShareAlike: boolean;
  links: SongLinkEdit[];
  credits: SongCreditEdit[];
};

type UploadedMusic = {
  url: string;
  integratedLufs?: number | null;
  truePeakDb?: number | null;
  loudnessGainDb?: number | null;
};

const applyLicenseFlags = (song: SongEdit, flags: LicenseFlags): SongEdit => {
  const normalizedFlags = {
    ...flags,
    shareAlike: flags.derivatives ? flags.shareAlike : false,
  };
  const nextAllowBackgroundUse = backgroundUsageWithLicenseDefaults(
    song.allowBackgroundUse,
    {
      attribution: song.licenseAttribution,
      commercial: song.licenseCommercial,
      derivatives: song.licenseDerivatives,
      shareAlike: song.licenseShareAlike,
    },
    normalizedFlags,
  );

  return {
    ...song,
    licenseAttribution: flags.attribution,
    licenseCommercial: flags.commercial,
    licenseDerivatives: flags.derivatives,
    licenseShareAlike: normalizedFlags.shareAlike,
    allowBackgroundUse: nextAllowBackgroundUse,
    allowDownload:
      licenseModeForFlags(flags) !== "ARR" || nextAllowBackgroundUse,
    allowBackgroundUseAttribution: nextAllowBackgroundUse
      ? backgroundUsageAttributionWithLicenseDefaults(
          song.allowBackgroundUseAttribution,
          {
            attribution: song.licenseAttribution,
            commercial: song.licenseCommercial,
            derivatives: song.licenseDerivatives,
            shareAlike: song.licenseShareAlike,
          },
          normalizedFlags,
        )
      : false,
    license: licenseFlagsToLabel(normalizedFlags),
  };
};

export default function GameEditingForm({
  game = null,
  pageVersion = "JAM",
}: {
  game?: GameType | null;
  pageVersion?: PageVersion;
}) {
  const uiText = useUiTranslations();
  const isMounted = useHasMounted();
  const [ratingCategories, setRatingCategories] = useState<
    RatingCategoryType[]
  >([]);
  const [allFlags, setAllFlags] = useState<FlagType[]>([]);
  const [allTags, setAllTags] = useState<GameTagType[]>([]);
  const [allTrackTags, setAllTrackTags] = useState<TrackTagType[]>([]);
  const [allTrackFlags, setAllTrackFlags] = useState<TrackFlagType[]>([]);
  const { data: activeJamResponse } = useCurrentJam();
  const [loading, setLoading] = useState<boolean>(true);
  const [title, setTitle] = useState("");
  const [short, setShort] = useState("");
  const [content, setContent] = useState("");
  const [gameSlug, setGameSlug] = useState("");
  const [prevSlug, setPrevGameSlug] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [soundtrackThumbnailUrl, setSoundtrackThumbnailUrl] = useState<
    string | null
  >(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [downloadLinks, setDownloadLinks] = useState<DownloadLinkType[]>([]);
  const [editorKey, setEditorKey] = useState(0);
  const [flags, setFlags] = useState<number[]>([]);
  const [tags, setTags] = useState<number[]>([]);
  const [leaderboards, setLeaderboards] = useState<LeaderboardInput[]>([]);
  const [achievements, setAchievements] = useState<AchievementType[]>([]);
  const [teams, setTeams] = useState<TeamType[]>([]);
  const [category, setCategory] = useState<
    "REGULAR" | "ODA" | "EXTRA" | "EXTERNAL"
  >(
    "REGULAR",
  );
  const [waitingPost, setWaitingPost] = useState(false);
  const [chosenRatingCategories, setChosenRatingCategories] = useState<
    number[]
  >([]);
  const [chosenMajRatingCategories, setChosenMajRatingCategories] = useState<
    number[]
  >([]);
  const [themeJustification, setThemeJustification] = useState("");
  const urlRegex = /^(https?:\/\/)/;
  const [editGame, setEditGame] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<number>(0);
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations();

  const [newSongId, setNewSongId] = useState<number | null>(null);
  const [newAchievementIndex, setNewAchievementIndex] = useState<number | null>(null);
  const [songs, setSongs] = useState<SongEdit[]>([]);
  const [softwareUsedDrafts, setSoftwareUsedDrafts] = useState<
    Record<number, string>
  >({});
  const [artistQuery, setArtistQuery] = useState<Record<number, string>>({});
  const [artistResults, setArtistResults] = useState<
    Record<number, UserType[]>
  >({});
  const { colors, siteTheme } = useTheme();
  const [hoveredUserId, setHoveredUserId] = useState<number | null>(null);
  const { emojis, refresh: refreshEmojis } = useEmojis();
  const [gameEmoteSlug, setGameEmoteSlug] = useState("");
  const [addingGameEmote, setAddingGameEmote] = useState(false);
  const [gameEmoteImage, setGameEmoteImage] = useState<string | null>(null);
  const [savingGameEmote, setSavingGameEmote] = useState(false);
  const [gameEmoteArtistSlug, setGameEmoteArtistSlug] = useState("");
  const [editingGameEmoteId, setEditingGameEmoteId] = useState<number | null>(
    null,
  );
  const [editingGameEmoteSlug, setEditingGameEmoteSlug] = useState("");
  const [editingGameEmoteImage, setEditingGameEmoteImage] = useState<
    string | null
  >(null);
  const [editingGameEmoteArtistSlug, setEditingGameEmoteArtistSlug] =
    useState("");
  const [savingEditGameEmote, setSavingEditGameEmote] = useState(false);
  const [gameEmoteArtistMatches, setGameEmoteArtistMatches] = useState<
    UserType[]
  >([]);
  const [gameEmoteArtistOpen, setGameEmoteArtistOpen] = useState(false);
  const [gameEmoteArtistIndex, setGameEmoteArtistIndex] = useState(0);
  const [editGameEmoteArtistMatches, setEditGameEmoteArtistMatches] = useState<
    UserType[]
  >([]);
  const [editGameEmoteArtistOpen, setEditGameEmoteArtistOpen] = useState(false);
  const [editGameEmoteArtistIndex, setEditGameEmoteArtistIndex] = useState(0);
  const teamsRef = useRef<TeamType[]>([]);
  const updateTeams = useCallback(
    (nextOrFn: TeamType[] | ((prev: TeamType[]) => TeamType[])) => {
      setTeams((prev) => {
        const next =
          typeof nextOrFn === "function"
            ? (nextOrFn as (prev: TeamType[]) => TeamType[])(prev)
            : nextOrFn;

        teamsRef.current = next;
        return next;
      });
    },
    [],
  );
  const creatingTeamRef = useRef(false);
  const uploadedAudioFiles = useRef(new Map<string, File>());
  const teamCheckDoneRef = useRef(false);

  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [trailerUrl, setTrailerUrl] = useState<string>("");
  const [itchEmbedUrl, setItchEmbedUrl] = useState<string>("");
  const [playableBuildUrl, setPlayableBuildUrl] = useState<string>("");
  const [isPlayableBuildPreviewActive, setIsPlayableBuildPreviewActive] =
    useState(false);
  const [uploadingWebBuild, setUploadingWebBuild] = useState(false);
  const [itchEmbedAspectRatio, setItchEmbedAspectRatio] =
    useState<GameEmbedAspectRatio>("16 / 9");
  const [playableBuildAspectRatio, setPlayableBuildAspectRatio] =
    useState<GameEmbedAspectRatio>("16 / 9");
  const [playableBuildShowFullscreenButton, setPlayableBuildShowFullscreenButton] =
    useState(true);
  const playableBuildPreviewRef = useRef<HTMLIFrameElement>(null);
  const [emotePrefixInput, setEmotePrefixInput] = useState("");

  useEffect(() => {
    setIsPlayableBuildPreviewActive(false);
  }, [playableBuildUrl]);

  const [inputMethods, setInputMethods] = useState<Set<InputMethodType>>(
    new Set(),
  );
  const [estOneRun, setEstOneRun] = useState<string>("");
  const [estAnyPercent, setEstAnyPercent] = useState<string>("");
  const [estHundredPercent, setEstHundredPercent] = useState<string>("");
  const [savedFormSnapshot, setSavedFormSnapshot] = useState<string | null>(null);
  const formSnapshot = JSON.stringify({
    title, short, content, gameSlug, thumbnailUrl, soundtrackThumbnailUrl,
    bannerUrl, downloadLinks, flags: [...flags].sort((a, b) => a - b),
    tags: [...tags].sort((a, b) => a - b), leaderboards, achievements,
    category, chosenRatingCategories: [...chosenRatingCategories].sort((a, b) => a - b),
    chosenMajRatingCategories: [...chosenMajRatingCategories].sort((a, b) => a - b),
    themeJustification, currentTeam, songs, screenshots, trailerUrl, itchEmbedUrl,
    playableBuildUrl, itchEmbedAspectRatio, playableBuildAspectRatio,
    playableBuildShowFullscreenButton, emotePrefixInput,
    inputMethods: [...inputMethods].sort(), estOneRun, estAnyPercent, estHundredPercent,
  });
  const hasUnsavedChanges = savedFormSnapshot !== null && formSnapshot !== savedFormSnapshot;
  const gameJamId = game?.jam?.id ?? game?.jamId;

  const inCurrentJamContext =
    !!activeJamResponse?.jam &&
    (activeJamResponse.jam.id === gameJamId || !game);

  const isRatingPhase = activeJamResponse?.phase === "Rating";
  const isPostJamLockedPhase =
    activeJamResponse?.phase === "Post-Jam Refinement" ||
    activeJamResponse?.phase === "Post-Jam Rating";
  const canManagePublication =
    activeJamResponse?.jam &&
    (activeJamResponse?.jam.id == gameJamId || !game) &&
    (pageVersion === "POST_JAM"
      ? activeJamResponse?.phase === "Post-Jam Refinement" ||
        activeJamResponse?.phase === "Post-Jam Rating"
      : activeJamResponse?.phase == "Jamming" ||
        activeJamResponse?.phase == "Submission" ||
        (activeJamResponse?.phase == "Rating" && category == "EXTRA"));

  const canSwapCategory =
    inCurrentJamContext && !isRatingPhase && !isPostJamLockedPhase;

  useEffect(() => {
    setSavedFormSnapshot(null);
    setEditGame(!!game);
    setTitle(game?.name || "");
    setGameSlug(game?.slug || "");
    setPrevGameSlug(game?.slug || "");
    setContent(game?.description || "");
    setShort(game?.short || "");
    setThemeJustification(game?.themeJustification || "");
    setEditorKey((prev) => prev + 1);
    setThumbnailUrl(game?.thumbnail || null);
    setSoundtrackThumbnailUrl(game?.soundtrackThumbnail || null);
    setBannerUrl(game?.banner || null);
    setDownloadLinks(game?.downloadLinks || []);
    setAchievements(game?.achievements || []);
    setLeaderboards(game?.leaderboards || []);
    const desiredCategory =
      game?.category ?? (isRatingPhase ? "EXTRA" : "REGULAR");
    const shouldForceExtra =
      inCurrentJamContext && isRatingPhase && (!game || !game.published);

    setCategory(shouldForceExtra ? "EXTRA" : desiredCategory);
    setChosenRatingCategories(
      game?.ratingCategories?.map((ratingCategory) => ratingCategory.id) || [],
    );
    setChosenMajRatingCategories(
      game?.majRatingCategories?.map((ratingCategory) => ratingCategory.id) ||
        [],
    );
    setScreenshots(game?.screenshots ?? []);
    setTrailerUrl(game?.trailerUrl ?? "");
    setItchEmbedUrl(game?.itchEmbedUrl ?? "");
    setPlayableBuildUrl(game?.playableBuildUrl ?? "");
    setItchEmbedAspectRatio(
      normalizeItchEmbedAspectRatio(game?.itchEmbedAspectRatio),
    );
    setPlayableBuildAspectRatio(
      normalizeItchEmbedAspectRatio(
        game?.playableBuildAspectRatio ?? game?.itchEmbedAspectRatio,
      ),
    );
    setPlayableBuildShowFullscreenButton(
      game?.playableBuildShowFullscreenButton ?? true,
    );
    setEmotePrefixInput(game?.emotePrefix ?? "");
    setInputMethods(
      new Set((game?.inputMethods ?? []).filter(isInputMethodType)),
    );
    setEstOneRun(game?.estOneRun ?? "");
    setEstAnyPercent(game?.estAnyPercent ?? "");
    setEstHundredPercent(game?.estHundredPercent ?? "");

    const incomingSongs = (game?.tracks || []).map((s: TrackType) => {
      const flags = parseLicenseFlags(s.license);
      return {
        id: s.id,
        slug: s.slug,
        name: s.name,
        url: s.url,
        commentary: s.commentary ?? "",
        tagIds: (s.tags ?? []).map((tag) => tag.id),
        flagIds: (s.flags ?? []).map((flag) => flag.id),
        bpm: s.bpm ?? null,
        musicalKey: s.musicalKey ?? "",
        integratedLufs: s.integratedLufs ?? null,
        truePeakDb: s.truePeakDb ?? null,
        loudnessGainDb: s.loudnessGainDb ?? null,
        softwareUsed: s.softwareUsed ?? [],
        license: licenseFlagsToLabel(flags),
        allowDownload: Boolean(s.allowDownload),
        allowBackgroundUse:
          s.allowBackgroundUse ?? backgroundUsageAllowedByDefault(flags),
        allowBackgroundUseAttribution:
          s.allowBackgroundUseAttribution ??
          backgroundUsageAttributionAllowedByDefault(flags),
        licenseAttribution: flags.attribution,
        licenseCommercial: flags.commercial,
        licenseDerivatives: flags.derivatives,
        licenseShareAlike: flags.shareAlike,
        links: (s.links ?? []).map((link) => ({
          id: link.id,
          label: link.label,
          url: link.url,
        })),
        credits:
          (s.credits?.length ?? 0) > 0
            ? (s.credits ?? []).map((credit) => ({
                id: credit.id,
                role: credit.role,
                userId: credit.userId,
                user: credit.user
                  ? {
                      id: credit.user.id,
                      name: credit.user.name,
                      slug: credit.user.slug,
                      profilePicture: credit.user.profilePicture,
                      short: credit.user.short,
                    }
                  : null,
              }))
            : s.composer
              ? [
                  {
                    id: -s.id,
                    role: "Composer",
                    userId: s.composer.id,
                    user: {
                      id: s.composer.id,
                      name: s.composer.name,
                      slug: s.composer.slug,
                      profilePicture: s.composer.profilePicture,
                      short: s.composer.short,
                    },
                  },
                ]
              : [],
      };
    }) as SongEdit[];
    setSongs(incomingSongs);
    setSoftwareUsedDrafts(
      Object.fromEntries(
        incomingSongs.map((song) => [song.id, song.softwareUsed.join(", ")]),
      ),
    );

    async function loadData() {
      const teamResponse = await getTeamsUser();

      if (teamResponse.status == 200) {
        const data = await readArray<TeamType>(teamResponse);
        const relevantTeams = game
          ? data.filter((team: TeamType) => team.game?.slug === game.slug)
          : data.filter(
              (team: TeamType) =>
                !team.game && team.jamId === activeJamResponse?.jam?.id,
            );
        updateTeams(relevantTeams);
      }
    }

    loadData();
  }, [
    game,
    activeJamResponse,
    inCurrentJamContext,
    isRatingPhase,
    updateTeams,
  ]);

  useEffect(() => {
    setFlags(
      game?.flags
        ?.map((flag) => allFlags.findIndex((f) => f.id === flag.id))
        .filter((index) => index !== -1) || [],
    );
  }, [game, allFlags]);

  useEffect(() => {
    setTags(
      game?.tags
        ?.map((tag) => allTags.findIndex((f) => f.id === tag.id))
        .filter((index) => index !== -1) || [],
    );
  }, [game, allTags]);

  const refreshTeams = useCallback(async () => {
    const teamResponse = await getTeamsUser();
    if (teamResponse.ok) {
      const data = await readArray<TeamType>(teamResponse);
      const filtered = game
        ? data.filter((team: TeamType) => team.game?.slug === game.slug)
        : data.filter(
            (team: TeamType) =>
              !team.game && team.jamId === activeJamResponse?.jam?.id,
          );
      updateTeams(filtered);
      setCurrentTeam((i) => Math.min(i, Math.max(filtered.length - 1, 0)));
    }
  }, [activeJamResponse?.jam?.id, game, updateTeams]);

  useEffect(() => {
    const load = async () => {
      try {
        const ratingResponse = await getRatingCategories();
        setRatingCategories(await readArray(ratingResponse));

        const flagsResponse = await getFlags();
        const flagsData = await readArray<FlagType>(flagsResponse);
        setAllFlags(
          flagsData.sort((a: FlagType, b: FlagType) =>
            a.name.localeCompare(b.name),
          ),
        );

        const tagsResponse = await getGameTags();
        setAllTags(await readArray(tagsResponse));

        const trackTagsResponse = await getTrackTags();
        setAllTrackTags(await readArray<TrackTagType>(trackTagsResponse));

        const trackFlagsResponse = await getTrackFlags();
        setAllTrackFlags(await readArray<TrackFlagType>(trackFlagsResponse));

        // always get *fresh* teams before deciding to create one
        await refreshTeams();

        // If we already handled the team check once in this session (StrictMode), bail.
        if (teamCheckDoneRef.current) {
          setLoading(false);
          return;
        }
        teamCheckDoneRef.current = true;

        if (game) {
          setLoading(false);
          return;
        }

        const response = await getSelf();
        const localuser = await readItem<UserType>(response);

        if (!localuser) return;

        const hasTeamForJam =
          !!activeJamResponse?.jam?.id &&
          localuser.teams.some((t) => t.jamId === activeJamResponse.jam?.id);

        if (!hasTeamForJam && !creatingTeamRef.current) {
          creatingTeamRef.current = true;

          const alreadyHas = teamsRef.current.some(
            (t) => t.jamId === activeJamResponse?.jam?.id,
          );
          if (!alreadyHas) {
            const created = await createTeam(); // should return truthy or handle 409
            if (!created) {
              addToast({ title: uiText("AppStrings.ErrorWhileCreatingTeam") });
              redirect("/");
              return;
            }
          }

          creatingTeamRef.current = false;
          await refreshTeams();
        }

        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    };
    load();
  }, [refreshTeams, activeJamResponse]);

  useEffect(() => {
    if (!loading && savedFormSnapshot === null) {
      setSavedFormSnapshot(formSnapshot);
    }
  }, [loading, savedFormSnapshot, formSnapshot]);

  const styles: StylesConfig<
    {
      value: string;
      id: number;
      label: ReactNode;
    },
    boolean
  > = {
    multiValue: (base) => {
      return {
        ...base,
        backgroundColor: colors.base,
        borderRadius: 6,
      };
    },
    multiValueLabel: (base) => {
      return {
        ...base,
        color: colors.text,
        fontWeight: 500,
        fontSize: 12,
        paddingRight: "2px",
      };
    },
    multiValueRemove: (base) => {
      return {
        ...base,
        display: "flex",
        color: colors.textFaded,
        borderRadius: "0 6px 6px 0",
        ":hover": { backgroundColor: colors.crust, color: colors.red },
      };
    },
    control: (base, { isFocused, isDisabled }) => ({
      ...base,
      backgroundColor: colors.mantle,
      borderColor: isFocused ? colors.blue : colors.base,
      borderRadius: 8,
      minHeight: 36,
      minWidth: 0,
      fontSize: 12,
      opacity: isDisabled ? 0.5 : 1,
      boxShadow: isFocused ? `0 0 0 1px ${colors.blue}` : "none",
      ":hover": { borderColor: isFocused ? colors.blue : colors.textFaded },
    }),
    input: (base) => ({ ...base, color: colors.text }),
    singleValue: (base) => ({ ...base, color: colors.text }),
    placeholder: (base) => ({ ...base, color: colors.textFaded }),
    indicatorSeparator: () => ({ display: "none" }),
    dropdownIndicator: (base) => ({
      ...base, color: colors.textFaded, padding: 8,
      ":hover": { color: colors.text },
    }),
    clearIndicator: (base) => ({
      ...base, color: colors.textFaded,
      ":hover": { color: colors.red },
    }),
    menu: (styles) => ({
      ...styles,
      backgroundColor: colors.mantle,
      color: colors.text,
      border: `1px solid color-mix(in srgb, ${colors.text} 5%, ${colors.mantle})`,
      borderRadius: 10,
      padding: 4,
      fontSize: 13,
      boxShadow: "0 12px 28px rgb(0 0 0 / 25%)",
      zIndex: 100,
    }),
    menuPortal: (styles) => ({
      ...styles,
      zIndex: 120,
    }),
    option: (styles, { isFocused, isSelected, isDisabled }) => ({
      ...styles,
      borderRadius: 6,
      padding: "8px 10px",
      color: isDisabled ? colors.textFaded : isSelected ? colors.blue : colors.text,
      backgroundColor: isFocused || isSelected ? colors.base : "transparent",
      cursor: isDisabled ? "not-allowed" : "pointer",
      ":active": { backgroundColor: colors.base },
    }),
  };

  const trackTagCategories = useMemo(
    () =>
      [
        ...new Set(
          allTrackTags.map((tag) => tag.category?.name).filter(Boolean),
        ),
      ].sort((a, b) => {
        const aPriority =
          allTrackTags.find((tag) => tag.category?.name === a)?.category
            ?.priority ?? 0;
        const bPriority =
          allTrackTags.find((tag) => tag.category?.name === b)?.category
            ?.priority ?? 0;
        return bPriority - aPriority || a.localeCompare(b);
      }),
    [allTrackTags],
  );

  const sanitizeSlug = (value: string): string => {
    return value
      .toLowerCase() // Convert to lowercase
      .replace(/\s+/g, "-") // Replace whitespace with hyphens
      .replace(/[^a-z0-9-]/g, "") // Only allow lowercase letters, numbers, and hyphens
      .substring(0, 50); // Limit length to 50 characters
  };

  async function uploadTo(
    endpoint: "image",
    file: File,
    crop?: ImageCropData,
  ): Promise<string | null>;
  async function uploadTo(
    endpoint: "music",
    file: File,
    crop?: ImageCropData,
  ): Promise<UploadedMusic | null>;
  async function uploadTo(
    endpoint: "image" | "music",
    file: File,
    crop?: ImageCropData,
  ): Promise<string | UploadedMusic | null> {
    const formData = new FormData();
    formData.append("upload", file);
    if (crop && endpoint === "image") {
      formData.append("cropLeft", String(crop.left));
      formData.append("cropTop", String(crop.top));
      formData.append("cropWidth", String(crop.width));
      formData.append("cropHeight", String(crop.height));
    }
    const url = `${BASE_URL}/${endpoint}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
        headers: { authorization: `Bearer ${getCookie("token")}` },
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        addToast({ title: data.message ?? uiText("AppStrings.Uploaded") });
        const uploadedUrl = unwrapItem<string>(data);
        if (!uploadedUrl) return null;
        if (endpoint === "image") return uploadedUrl;
        uploadedAudioFiles.current.set(uploadedUrl, file);
        const loudness =
          data && typeof data === "object" && "loudness" in data
            ? (data.loudness as Partial<UploadedMusic>)
            : {};
        return {
          url: uploadedUrl,
          integratedLufs: loudness.integratedLufs ?? null,
          truePeakDb: loudness.truePeakDb ?? null,
          loudnessGainDb: loudness.loudnessGainDb ?? null,
        };
      }
      addToast({ title: getApiErrorMessage(data) ?? `${uiText("AppStrings.FailedToUploadValue0", { value0: endpoint })} (HTTP ${response.status})` });
      return null;
    } catch (e) {
      console.error(e);
      addToast({ title: uiText("AppStrings.ErrorUploadingValue0", { value0: endpoint }) });
      return null;
    }
  }

  const doArtistSearch = useMemo(
    () =>
      debounce(async (songId: number, q: string) => {
        const query = q.trim();
        if (!query) {
          setArtistResults((prev) => ({ ...prev, [songId]: [] }));
          return;
        }
        try {
          const res = await searchUsers(query);
          if (res.ok) {
            const data = await readArray<UserType>(res);
            setArtistResults((prev) => ({
              ...prev,
              [songId]: data.slice(0, 6),
            }));
          } else {
            setArtistResults((prev) => ({ ...prev, [songId]: [] }));
          }
        } catch (e) {
          console.error(e);
          setArtistResults((prev) => ({ ...prev, [songId]: [] }));
        }
      }, 250),
    [],
  );

  const doEmoteArtistSearch = useMemo(
    () =>
      debounce(async (q: string, scope: "create" | "edit") => {
        if (!q) {
          if (scope === "edit") {
            setEditGameEmoteArtistMatches([]);
            setEditGameEmoteArtistOpen(false);
            setEditGameEmoteArtistIndex(0);
          } else {
            setGameEmoteArtistMatches([]);
            setGameEmoteArtistOpen(false);
            setGameEmoteArtistIndex(0);
          }
          return;
        }
        try {
          const res = await searchUsers(q);
          if (res.status === 200) {
            const data = await res.json();
            const matches = Array.isArray(data) ? data : (data?.data ?? []);
            const slice = matches.slice(0, 6);
            if (scope === "edit") {
              setEditGameEmoteArtistMatches(slice);
              setEditGameEmoteArtistOpen(slice.length > 0);
              setEditGameEmoteArtistIndex(0);
            } else {
              setGameEmoteArtistMatches(slice);
              setGameEmoteArtistOpen(slice.length > 0);
              setGameEmoteArtistIndex(0);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }, 200),
    [],
  );

  const gameEmotes = useMemo(() => {
    if (!game?.id) return [];
    return emojis.filter(
      (emoji) =>
        emoji.scopeType === "GAME" &&
        (emoji.scopeGameId === game.id || emoji.ownerGame?.id === game.id),
    );
  }, [emojis, game?.id]);

  const gameEmotePrefix =
    emotePrefixInput.trim().toLowerCase() || game?.emotePrefix || "------";
  const cleanedGameEmoteSlug = gameEmoteSlug
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 44);
  const cleanedEditingGameEmoteSlug = editingGameEmoteSlug
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 44);

  if (!isMounted) return;

  if (loading) {
    return (
      <Vstack>
        <Card className="max-w-96">
          <Vstack>
            <Hstack>
              <Spinner />
              <Text size="xl">CreateGame.Loading.Title</Text>
            </Hstack>
            <Text color="textFaded">CreateGame.Loading.Description</Text>
          </Vstack>
        </Card>
      </Vstack>
    );
  }

  return (
    <Vstack>
      <Form
        className={`w-full max-w-6xl flex flex-col gap-4 ${hasUnsavedChanges ? "pb-48 sm:pb-32" : ""}`}
        onSubmit={async (e) => {
          e.preventDefault();

          if (!title) {
            addToast({
              title: t("CreateGame.Name.Error"),
            });
            return;
          }

          const userSlug = getCookie("user"); // Retrieve user slug from cookies
          if (!userSlug) {
            addToast({
              title: "CreateGame.NotLogged",
            });
            return;
          }

          const sanitizedHtml = sanitize(content);
          const cleanedPrefix = emotePrefixInput
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
          if (
            cleanedPrefix &&
            (cleanedPrefix.length < MIN_EMOTE_PREFIX_LENGTH ||
              cleanedPrefix.length > MAX_EMOTE_PREFIX_LENGTH)
          ) {
            addToast({ title: uiText("AppStrings.EmotePrefixMustBe4To8Characters") });
            return;
          }
          setWaitingPost(true);

          const submitter = (e.nativeEvent as SubmitEvent)
            .submitter as HTMLButtonElement;

          let publishValue = game ? game.published : false;

          if (submitter.value === "publish") {
            publishValue = true;
          }

          if (submitter.value === "unpublish") {
            publishValue = false;
          }

          try {
            const links = downloadLinks.map((link) => ({
              url: link.url,
              platform: link.platform,
            }));

            const payloadSongs = songs.map((s) => ({
              name: s.name,
              url: s.url,
              commentary: s.commentary || null,
              tagIds: s.tagIds,
              flagIds: s.flagIds,
              bpm: s.bpm ?? null,
              musicalKey: s.musicalKey?.trim() || null,
              integratedLufs: s.integratedLufs ?? null,
              truePeakDb: s.truePeakDb ?? null,
              loudnessGainDb: s.loudnessGainDb ?? null,
              softwareUsed: s.softwareUsed,
              links: s.links,
              credits: s.credits
                .filter((credit) => credit.userId && credit.role.trim())
                .map((credit) => ({
                  role: credit.role.trim(),
                  userId: credit.userId as number,
                })),
              id: s.id,
              slug: s.slug,
              license: s.license || null,
              allowDownload: s.allowDownload,
              allowBackgroundUse: s.allowBackgroundUse,
              allowBackgroundUseAttribution: s.allowBackgroundUseAttribution,
            }));

            for (const song of payloadSongs) {
              if ((song.credits?.length ?? 0) === 0) {
                addToast({
                  title: uiText("AppStrings.Value0IsMissingACreditedPerson", { value0: song.name }),
                });
                return;
              }

              if (!song.slug) {
                addToast({
                  title: uiText("AppStrings.Value0IsMissingASlug", { value0: song.name }),
                });
                return;
              }

              if (!song.name) {
                addToast({
                  title: uiText("AppStrings.Value0IsMissingAName", { value0: song.name }),
                });
                return;
              }
            }

            const request = editGame
              ? updateGame(
                  prevSlug,
                  title,
                  gameSlug,
                  sanitizedHtml,
                  thumbnailUrl,
                  soundtrackThumbnailUrl,
                  bannerUrl,
                  links,
                  userSlug,
                  category,
                  chosenRatingCategories,
                  chosenMajRatingCategories,
                  publishValue,
                  themeJustification,
                  achievements,
                  Array.from(flags).map((thing) => allFlags[thing].id),
                  Array.from(tags).map((thing) => allTags[thing].id),
                  leaderboards,
                  short,
                  payloadSongs,
                  screenshots,
                  trailerUrl || null,
                  toCanonicalItchEmbedUrl(itchEmbedUrl) || null,
                  toCanonicalItchEmbedUrl(itchEmbedUrl)
                    ? itchEmbedAspectRatio
                    : null,
                  playableBuildUrl || null,
                  playableBuildUrl ? playableBuildAspectRatio : null,
                  playableBuildShowFullscreenButton,
                  Array.from(inputMethods),
                  estOneRun || null,
                  estAnyPercent || null,
                  estHundredPercent || null,
                  cleanedPrefix || null,
                  pageVersion,
                )
              : postGame(
                  title,
                  gameSlug,
                  sanitizedHtml,
                  thumbnailUrl,
                  soundtrackThumbnailUrl,
                  bannerUrl,
                  links,
                  userSlug,
                  category,
                  teams[currentTeam].id,
                  chosenRatingCategories,
                  chosenMajRatingCategories,
                  publishValue,
                  themeJustification,
                  achievements,
                  Array.from(flags).map((thing) => allFlags[thing].id),
                  Array.from(tags).map((thing) => allTags[thing].id),
                  leaderboards,
                  short,
                  payloadSongs,
                  screenshots,
                  trailerUrl || null,
                  toCanonicalItchEmbedUrl(itchEmbedUrl) || null,
                  toCanonicalItchEmbedUrl(itchEmbedUrl)
                    ? itchEmbedAspectRatio
                    : null,
                  playableBuildUrl || null,
                  playableBuildUrl ? playableBuildAspectRatio : null,
                  playableBuildShowFullscreenButton,
                  Array.from(inputMethods),
                  estOneRun || null,
                  estAnyPercent || null,
                  estHundredPercent || null,
                  cleanedPrefix || null,
                  pageVersion,
                );

            const response = await request;

            if (response.ok) {
              await queryClient.invalidateQueries({ queryKey: queryKeys.game.all });
              setSavedFormSnapshot(formSnapshot);
              addToast({
                title: prevSlug
                  ? t("CreateGame.Update.Success")
                  : t("CreateGame.Create.Success"),
              });
              router.push(`/g/${gameSlug || sanitizeSlug(title)}`);
            } else {
              const error = await response.text();
              addToast({
                title: error || t("CreateGame.Create.Error"),
              });
            }
          } catch (error) {
            console.error("Error creating game:", error);
            addToast({
              title: t("CreateGame.Create.Error"),
            });
          } finally {
            setWaitingPost(false);
          }
        }}
      >
        <Vstack align="start">
          <header className="w-full py-2 text-center">
                <h1
                  className="text-3xl font-semibold"
                  style={{
                    color: colors["text"],
                    textShadow: siteTheme.type === "Light"
                      ? "none"
                      : "0 1px 5px rgba(0, 0, 0, 0.75)",
                  }}
                >
                  {prevSlug
                    ? pageVersion === "POST_JAM"
                      ? uiText("AppStrings.EditPostJamPage")
                      : t("CreateGame.Edit.Title")
                    : t("CreateGame.Create.Title")}
                </h1>
              <p
                className="mt-1 text-sm"
                style={{
                  color: colors["text"],
                  opacity: 0.82,
                  textShadow: siteTheme.type === "Light"
                    ? "none"
                    : "0 1px 4px rgba(0, 0, 0, 0.8)",
                }}
              >
                {prevSlug
                  ? pageVersion === "POST_JAM"
                    ? uiText("AppStrings.EditThePostJamVersionOfYourGamePage")
                    : t("CreateGame.Edit.Description")
                  : t("CreateGame.Create.Description")}
              </p>
          </header>

          <Tabs className="game-editor-tabs [&>[role=tablist]]:justify-center" style={{ "--editor-surface": colors.mantle, "--editor-text": colors.text, "--editor-accent": colors.blue } as CSSProperties}>
            <Tab title={uiText("AppStrings.General")} icon="cog">
              <Vstack align="stretch">
                <div className="game-editor-panel-heading relative z-20 overflow-visible">
                  <Vstack align="start">
                    <Hstack>
                      <Icon name="cog" color="text" size={28} />
                      <Text size="2xl" color="text" weight="bold">
                         {uiText("AppStrings.General")} </Text>
                    </Hstack>
                    <Text size="sm" color="textFaded">
                       {uiText("AppStrings.TheMainSettingsToChangeHowYourGame")} </Text>
                  </Vstack>
                </div>
                <div className="game-editor-row relative z-30 overflow-visible">
                  <Vstack align="start">
                    <div>
                      <Text color="text">CreateGame.Name.Title</Text>
                      <Text color="textFaded" size="xs">
                        CreateGame.Name.Description
                      </Text>
                    </div>
                    <Input
                      required
                      name="title"
                      placeholder="CreateGame.Name.Placeholder"
                      type="text"
                      value={title}
                      onValueChange={(value) => {
                        setTitle(value);
                        if (!isSlugManuallyEdited) {
                          setGameSlug(sanitizeSlug(value));
                        }
                      }}
                    />
                  </Vstack>
                </div>
                <div className="game-editor-row relative z-20 overflow-visible">
                  <Vstack align="start">
                    <div>
                      <Text color="text">CreateGame.Slug.Title</Text>
                      <Hstack wrap>
                        <Text color="textFaded" size="xs">
                          CreateGame.Slug.Description
                        </Text>
                        <Text color="textFaded" size="xs">
                          {uiText("AppStrings.D2jamComGValue0", { value0: gameSlug || "your-game-name" })}
                        </Text>
                      </Hstack>
                    </div>
                    <Input
                      placeholder="CreateGame.Slug.Placeholder"
                      value={gameSlug}
                      onValueChange={(value) => {
                        setGameSlug(sanitizeSlug(value));
                        setIsSlugManuallyEdited(true);
                      }}
                    />
                  </Vstack>
                </div>

                {
                  <>
                    <div className="game-editor-row relative z-20 overflow-visible">
                      <Vstack align="start">
                        <div>
                          <Text color="text">CreateGame.Category.Title</Text>
                          <Text color="textFaded" size="xs">
                            CreateGame.Category.Description
                          </Text>
                        </div>
                        <fieldset
                          className="game-editor-category-options"
                          disabled={!canSwapCategory}
                          aria-label={t("CreateGame.Category.Title")}
                        >
                          {([
                            { value: "REGULAR", title: "GameCategory.Regular.Title", description: "GameCategory.Regular.Description", icon: "gamepad2", eligible: true },
                            { value: "ODA", title: "GameCategory.Oda.Title", description: "GameCategory.Oda.Description", icon: "swords", eligible: teams?.[currentTeam]?.users?.length === 1 },
                            { value: "EXTRA", title: "GameCategory.Extra.Title", description: "GameCategory.Extra.Description", icon: "calendar", eligible: true },
                            { value: "EXTERNAL", title: "AppStrings.External", description: "AppStrings.ImportedFromAnExternalJam", icon: "externalLink", eligible: game?.category === "EXTERNAL" },
                          ] as const)
                            .filter((option) => canSwapCategory ? option.eligible || option.value === category : option.value === category)
                            .map((option) => (
                              <label key={option.value} className="game-editor-category-option">
                                <input
                                  type="radio"
                                  name="game-category"
                                  value={option.value}
                                  checked={category === option.value}
                                  disabled={!option.eligible}
                                  onChange={() => {
                                    if (canSwapCategory && option.eligible) setCategory(option.value);
                                  }}
                                />
                                <span className="game-editor-category-card">
                                  <span className="game-editor-category-title">
                                    <Icon name={option.icon} size={16} />
                                    <span>{t(option.title)}</span>
                                    <span className="game-editor-category-indicator" aria-hidden="true" />
                                  </span>
                                  <span className="game-editor-category-description">{t(option.description)}</span>
                                </span>
                              </label>
                            ))}
                        </fieldset>
                      </Vstack>
                    </div>
                  </>
                }

                <div className="game-editor-row relative z-0">
                  <Vstack align="start">
                    <div>
                      <Text color="text">CreateGame.Description.Title</Text>
                      <Text color="textFaded" size="xs">
                        CreateGame.Description.Description
                      </Text>
                    </div>
                    <Editor
                      key={editorKey}
                      content={content}
                      setContent={setContent}
                      gameEditor
                    />
                  </Vstack>
                </div>

                <div className="game-editor-row relative z-10 overflow-visible">
                  <Vstack align="start">
                    <div>
                      <Text color="text">CreateGame.Short.Title</Text>
                      <Text color="textFaded" size="xs">
                        CreateGame.Short.Description
                      </Text>
                    </div>
                    <Textarea
                      placeholder="CreateGame.Short.Placeholder"
                      value={short}
                      onValueChange={setShort}
                      maxLength={155}
                    />
                  </Vstack>
                </div>

                {game?.category !== "EXTERNAL" && (
                  <div className="game-editor-row">
                    <Vstack align="start">
                      <div>
                        <Text color="text">CreateGame.Theme.Title</Text>
                        <Text color="textFaded" size="xs">
                          CreateGame.Theme.Description
                        </Text>
                      </div>
                      <Textarea
                        placeholder="CreateGame.Theme.Placeholder"
                        value={themeJustification}
                        onValueChange={setThemeJustification}
                      />
                    </Vstack>
                  </div>
                )}

                <div className="game-editor-row relative z-10 overflow-visible">
                  <Vstack align="start">
                    <div>
                      <Text color="text" size="lg" weight="semibold">
                         {uiText("AppStrings.PlayableWebBuild")} </Text>
                      <Text color="textFaded" size="xs">
                         {uiText("AppStrings.UploadAZIPContainingAnIndexHtmlFileAndAllOfTheFilesYourBrowserGameNeedsTheBuildRunsIn")} </Text>
                    </div>

                    <label className="game-editor-build-upload flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center" aria-disabled={uploadingWebBuild} style={{ "--build-surface": colors.mantle, "--build-hover": colors.base, "--build-border": colors.grayDark, "--build-hover-border": colors.grayLight } as CSSProperties}>
                      <Icon name="upload" color="text" />
                      <Text color="text" weight="semibold">
                        {uploadingWebBuild
                          ? uiText("AppStrings.CheckingAndUploading")
                          : playableBuildUrl
                            ? uiText("AppStrings.ReplaceWebBuildZIP")
                            : uiText("AppStrings.ChooseWebBuildZIP")}
                      </Text>
                      <Text color="textFaded" size="xs">
                         {uiText("AppStrings.ZIPOnly95MBArchive500MBExpanded1000Files")} </Text>
                      <input
                        className="sr-only"
                        type="file"
                        accept=".zip,application/zip,application/x-zip-compressed"
                        disabled={uploadingWebBuild}
                        onChange={async (event) => {
                          const file = event.currentTarget.files?.[0];
                          event.currentTarget.value = "";
                          if (!file) return;
                          if (file.size > 95_000_000) {
                            addToast({ title: uiText("AppStrings.TheWebBuildZIPMustBe95MBOrSmaller") });
                            return;
                          }
                          setUploadingWebBuild(true);
                          try {
                            const response = await uploadWebBuild(file);
                            if (!response.ok) {
                              const body = await response.json().catch(() => null) as
                                | { error?: { message?: string } }
                                | null;
                              throw new Error(
                                body?.error?.message ||
                                  "The web build could not be uploaded.",
                              );
                            }
                            const uploaded = await readItem<{
                              playableUrl: string;
                            }>(response);
                            if (!uploaded?.playableUrl) {
                              throw new Error("The upload returned no playable build.");
                            }
                            setPlayableBuildUrl(uploaded.playableUrl);
                            setPlayableBuildShowFullscreenButton(true);
                            addToast({ title: uiText("AppStrings.WebBuildUploadedAndChecked") });
                          } catch (error) {
                            addToast({
                              title:
                                error instanceof Error
                                  ? error.message
                                  : uiText("AppStrings.TheWebBuildCouldNotBeUploaded"),
                            });
                          } finally {
                            setUploadingWebBuild(false);
                          }
                        }}
                      />
                    </label>

                    {(playableBuildUrl || itchEmbedUrl) && (
                      <>
                        <div>
                          <Text color="text">{uiText("AppStrings.GameAspectRatio")}</Text>
                          <Text color="textFaded" size="xs">
                             {uiText("AppStrings.ChooseTheShapeThatBestMatchesTheGameWindow")} </Text>
                        </div>
                        <Dropdown portal
                          selectedValue={
                            playableBuildUrl
                              ? playableBuildAspectRatio
                              : itchEmbedAspectRatio
                          }
                          onSelect={(value) => {
                            const ratio = normalizeItchEmbedAspectRatio(
                              typeof value === "string" ? value : null,
                            );
                            if (playableBuildUrl) setPlayableBuildAspectRatio(ratio);
                            else setItchEmbedAspectRatio(ratio);
                          }}
                        >
                          {ITCH_EMBED_ASPECT_RATIO_OPTIONS.map((value) => (
                            <Dropdown.Item key={value} value={value}>
                              {value}
                            </Dropdown.Item>
                          ))}
                        </Dropdown>

                        {playableBuildUrl && (
                          <Hstack>
                            <Switch
                              checked={playableBuildShowFullscreenButton}
                              onChange={setPlayableBuildShowFullscreenButton}
                            />
                            <Vstack gap={0} align="start">
                              <Text color="text">{uiText("AppStrings.FullscreenButton")}</Text>
                              <Text color="textFaded" size="xs">
                                 {uiText("AppStrings.ShowAFullscreenControlInTheBottomRightCorner")} </Text>
                            </Vstack>
                          </Hstack>
                        )}

                        {playableBuildUrl && (
                          <div
                            className="relative w-full overflow-hidden rounded-xl bg-black"
                            style={{ aspectRatio: playableBuildAspectRatio }}
                          >
                            {isPlayableBuildPreviewActive ? (
                              <iframe
                                ref={playableBuildPreviewRef}
                                src={getPlayableBuildUrl(playableBuildUrl)}
                                title={uiText("AppStrings.PlayableWebBuildPreview")}
                                className="h-full w-full border-0"
                                sandbox="allow-scripts allow-pointer-lock"
                                allow="fullscreen; gamepad"
                                allowFullScreen
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => setIsPlayableBuildPreviewActive(true)}
                                className="absolute inset-0 flex cursor-pointer items-center justify-center"
                                style={{
                                  backgroundColor: colors.mantle,
                                  color: colors.text,
                                }}
                                aria-label={uiText("AppStrings.LoadValue0PlayableEmbed", { value0: title })}
                              >
                                <span className="flex items-center gap-3 text-base font-semibold transition-transform hover:scale-105">
                                  <Icon name="play" size={20} />
                                  {uiText("AppStrings.PlayGame")}
                                </span>
                              </button>
                            )}
                            {playableBuildShowFullscreenButton && isPlayableBuildPreviewActive && (
                              <button
                                type="button"
                                aria-label={uiText("AppStrings.OpenGamePreviewInFullscreen")}
                                title={uiText("AppStrings.Fullscreen")}
                                className="absolute bottom-3 right-3 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg shadow-lg transition-[filter,transform] duration-150 hover:scale-110 hover:brightness-150 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none motion-reduce:transform-none"
                                style={{
                                  backgroundColor: colors.mantle,
                                  color: colors.text,
                                  border: `1px solid ${colors.crust}`,
                                }}
                                onClick={() => {
                                  void playableBuildPreviewRef.current
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

                        {itchEmbedUrl && !playableBuildUrl && (
                          <Text color="textFaded" size="xs">
                             {uiText("AppStrings.ThisImportedGameStillUsesItsLegacyItchPlayerUploadAZIPAboveToReplaceItWithAHostedBuil")} </Text>
                        )}

                        {playableBuildUrl && (
                          <Button color="red" onClick={() => setPlayableBuildUrl("")}>
                             {uiText("AppStrings.RemoveWebBuild")} </Button>
                        )}
                      </>
                    )}
                  </Vstack>
                </div>

                <div className="game-editor-row">
                  <Vstack align="start">
                    <div>
                      <Text color="text">CreateGame.Links.Title</Text>
                      <Text color="textFaded" size="xs">
                        CreateGame.Links.Description
                      </Text>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        {Array.isArray(downloadLinks) &&
                          downloadLinks.map((link, index) => (
                            <div
                              key={link.id}
                              className="relative z-20 flex gap-2"
                            >
                              <Input
                                className="flex-grow"
                                placeholder="CreateGame.Links.Placeholder"
                                value={link.url}
                                onValueChange={(value) => {
                                  const newLinks = [...downloadLinks];
                                  newLinks[index].url = value;
                                  setDownloadLinks(newLinks);
                                }}
                                onBlur={() => {
                                  if (
                                    !urlRegex.test(downloadLinks[index].url)
                                  ) {
                                    addToast({
                                      title: t("CreateGame.Links.Error"),
                                    });

                                    if (
                                      !downloadLinks[index].url.startsWith(
                                        "http://",
                                      ) &&
                                      !downloadLinks[index].url.startsWith(
                                        "https://",
                                      )
                                    ) {
                                      const newUrl =
                                        "https://" + downloadLinks[index].url;
                                      const newLinks = [...downloadLinks];
                                      newLinks[index].url = newUrl;
                                      setDownloadLinks(newLinks);
                                      const input =
                                        document.querySelector<HTMLInputElement>(
                                          `#download-link-${index}`,
                                        );
                                      if (input) {
                                        input.value = newUrl;
                                      }
                                    }
                                  }
                                }}
                              />
                              <Dropdown portal
                                className="w-96"
                                placeholder={uiText("AppStrings.SelectPlatform")}
                                selectedValue={link.platform}
                                onSelect={(val) => {
                                  const newLinks = [...downloadLinks];
                                  newLinks[index].platform =
                                    val as PlatformType;
                                  setDownloadLinks(newLinks);
                                }}
                              >
                                <Dropdown.Item value="Web" icon="sihtml5">
                                   {uiText("AppStrings.Web")} </Dropdown.Item>
                                <Dropdown.Item value="SourceCode" icon="code2">
                                   {uiText("AppStrings.SourceCode")} </Dropdown.Item>
                                <Dropdown.Item value="Windows" icon="customwindows">
                                   {uiText("AppStrings.Windows")} </Dropdown.Item>
                                <Dropdown.Item value="MacOS" icon="custommacos">
                                   {uiText("AppStrings.MacOS")} </Dropdown.Item>
                                <Dropdown.Item value="Linux" icon="customlinux">
                                   {uiText("AppStrings.Linux")} </Dropdown.Item>
                                <Dropdown.Item value="iOS" icon="smartphone">
                                   {uiText("AppStrings.AppleIos")} </Dropdown.Item>
                                <Dropdown.Item
                                  value="Android"
                                  icon="smartphone"
                                >
                                   {uiText("AppStrings.Android")} </Dropdown.Item>
                                <Dropdown.Item
                                  value="Other"
                                  icon="morehorizontal"
                                >
                                   {uiText("AppStrings.Other")} </Dropdown.Item>
                              </Dropdown>

                              <Button
                                color="red"
                                onClick={() => {
                                  setDownloadLinks(
                                    downloadLinks.filter(
                                      (l) => l.id !== link.id,
                                    ),
                                  );
                                }}
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                      </div>

                      <Button
                        className="w-fit self-start"
                        icon="plus"
                        onClick={() => {
                          setDownloadLinks([
                            ...downloadLinks,
                            {
                              id: Date.now(),
                              url: "",
                              platform: "Web",
                            },
                          ]);
                        }}
                      >
                        CreateGame.Links.Add
                      </Button>
                    </div>
                  </Vstack>
                </div>
                {teams.length > 1 && !prevSlug && (
                  <div className="game-editor-row relative z-20 overflow-visible">
                    <Vstack align="start">
                      <div>
                        <Text color="text">{uiText("AppStrings.Team")}</Text>
                        <Text color="textFaded" size="xs">
                           {uiText("AppStrings.SetTheTeamAssociatedWithTheGame")} </Text>
                      </div>
                      <Dropdown portal
                        trigger={
                          <Button>
                            {teams && teams[currentTeam]
                              ? teams[currentTeam].name
                                ? teams[currentTeam].name
                                : uiText("AppStrings.Value0STeam2", { value0: teams[currentTeam].owner.name })
                              : uiText("AppStrings.Unknown")}
                          </Button>
                        }
                        onSelect={(i) => {
                          setCurrentTeam(i as number);
                        }}
                      >
                        {teams.map((team, i) => (
                          <Dropdown.Item
                            key={i}
                            value={i}
                            description={uiText("AppStrings.Value0Members", { value0: team.users.length })}
                          >
                            {teams && teams[i]
                              ? teams[i].name
                                ? teams[i].name
                                : uiText("AppStrings.Value0STeam2", { value0: teams[i].owner.name })
                              : uiText("AppStrings.Unknown")}
                          </Dropdown.Item>
                        ))}
                      </Dropdown>
                    </Vstack>
                  </div>
                )}
                {activeJamResponse &&
                  activeJamResponse.jam &&
                  (activeJamResponse.jam.id === game?.jam?.id || !game) &&
                  (activeJamResponse.phase == "Jamming" ||
                    activeJamResponse.phase == "Submission" ||
                    (activeJamResponse.phase == "Rating" && !prevSlug)) && (
                    <div className="game-editor-row relative z-0">
                      <Vstack align="start">
                        <div>
                          <Text color="text">
                            CreateGame.RatingCategories.Title
                          </Text>
                          <Text color="textFaded" size="xs">
                            CreateGame.RatingCategories.Description
                          </Text>
                        </div>
                        <Vstack align="stretch" gap={3}>
                        {ratingCategories.map((category3) => (
                          <div key={category3.id}>
                            <Hstack>
                              <Switch
                                checked={
                                  chosenRatingCategories.filter(
                                    (category2) => category2 == category3.id,
                                  ).length > 0
                                }
                                onChange={(value) => {
                                  if (value) {
                                    setChosenRatingCategories([
                                      ...chosenRatingCategories,
                                      category3.id,
                                    ]);
                                  } else {
                                    setChosenRatingCategories(
                                      chosenRatingCategories.filter(
                                        (category2) =>
                                          category2 != category3.id,
                                      ),
                                    );
                                  }
                                }}
                              />
                              <Vstack gap={0} align="start">
                                <Text color="text" size="sm">
                                  {category3.name}
                                </Text>
                                <Text color="textFaded" size="xs">
                                  {uiText(category3.description)}
                                </Text>
                              </Vstack>
                            </Hstack>
                            {category3.askMajorityContent &&
                              category == "REGULAR" &&
                              chosenRatingCategories.filter(
                                (category2) => category2 == category3.id,
                              ).length > 0 && (
                                <Hstack className="pl-5 pt-2">
                                  <Switch
                                    key={category3.id + "maj"}
                                    checked={
                                      chosenMajRatingCategories.filter(
                                        (category2) =>
                                          category2 == category3.id,
                                      ).length > 0
                                    }
                                    onChange={(value) => {
                                      if (value) {
                                        setChosenMajRatingCategories([
                                          ...chosenMajRatingCategories,
                                          category3.id,
                                        ]);
                                      } else {
                                        setChosenMajRatingCategories(
                                          chosenMajRatingCategories.filter(
                                            (category2) =>
                                              category2 != category3.id,
                                          ),
                                        );
                                      }
                                    }}
                                  />
                                  <Text color="textFaded" size="xs">
                                     {uiText("AppStrings.DidYouMakeTheMajorityOfThe")}{" "}
                                    {category3.name.split(".")[1]}  {uiText("AppStrings.Content2")} </Text>
                                </Hstack>
                              )}
                          </div>
                        ))}
                        </Vstack>
                      </Vstack>
                    </div>
                  )}
              </Vstack>
            </Tab>
            <Tab title={uiText("AppStrings.Media")} icon="images">
              <Vstack align="stretch">
                <div className="game-editor-panel-heading">
                  <Vstack align="start">
                    <Hstack>
                      <Icon name="images" color="text" size={28} />
                      <Text size="2xl" color="text" weight="bold">
                         {uiText("AppStrings.Media")} </Text>
                    </Hstack>
                    <Text size="sm" color="textFaded">
                       {uiText("AppStrings.SpotsToUploadPicturesAndMusicToAdd")} </Text>
                  </Vstack>
                </div>
                <div className="game-editor-row">
                  <Vstack align="start">
                    <div>
                      <Text color="text">CreateGame.Thumbnail.Title</Text>
                      <Text color="textFaded" size="xs">
                        CreateGame.Thumbnail.Description
                      </Text>
                    </div>
                    <ImageInput
                      value={thumbnailUrl}
                      width={360}
                      height={200}
                      placeholder={uiText("AppStrings.UploadThumbnail")}
                      onSelect={async (file, crop) => {
                        const url = await uploadTo("image", file, crop);
                        if (url) {
                          setThumbnailUrl(url);
                        }
                      }}
                    />
                  </Vstack>
                </div>

                <div className="game-editor-row">
                  <Vstack align="start">
                    <div>
                      <Text color="text">CreateGame.Banner.Title</Text>
                      <Text color="textFaded" size="xs">
                        CreateGame.Banner.Description
                      </Text>
                    </div>
                    <ImageInput
                      value={bannerUrl}
                      width={734}
                      height={120}
                      placeholder={uiText("AppStrings.UploadBanner")}
                      onSelect={async (file, crop) => {
                        const url = await uploadTo("image", file, crop);
                        if (url) {
                          setBannerUrl(url);
                        }
                      }}
                    />
                  </Vstack>
                </div>

                <div className="game-editor-row">
                      <Vstack align="start">
                        <div>
                          <Text color="text">{uiText("AppStrings.ScreenshotsUpTo5")}</Text>
                          <Text color="textFaded" size="xs">
                             {uiText("AppStrings.FirstTwoWillBeShownOnHoverAll")} </Text>
                        </div>

                        {screenshots.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                            {screenshots.map((src, i) => (
                              <Card key={src + i}>
                                <Vstack align="start" className="gap-2">
                                  <div
                                    className="relative w-full rounded-lg overflow-hidden"
                                    style={{
                                      aspectRatio: "16 / 9",
                                      background: "#222",
                                    }}
                                  >
                                    <Image
                                      src={src}
                                      alt={uiText("AppStrings.ScreenshotValue0", { value0: i + 1 })}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <Hstack>
                                    <Text size="xs" color="textFaded">
                                      #{i + 1}
                                    </Text>
                                    <Button
                                      icon="trash"
                                      color="red"
                                      size="sm"
                                      onClick={() =>
                                        setScreenshots((prev) =>
                                          prev.filter((_, idx) => idx !== i),
                                        )
                                      }
                                    >
                                       {uiText("PostCard.Remove.Title")} </Button>
                                    {i > 0 && (
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          setScreenshots((prev) => {
                                            const copy = [...prev];
                                            [copy[i - 1], copy[i]] = [
                                              copy[i],
                                              copy[i - 1],
                                            ];
                                            return copy;
                                          })
                                        }
                                      >
                                         {uiText("AppStrings.MoveUp")} </Button>
                                    )}
                                    {i < screenshots.length - 1 && (
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          setScreenshots((prev) => {
                                            const copy = [...prev];
                                            [copy[i + 1], copy[i]] = [
                                              copy[i],
                                              copy[i + 1],
                                            ];
                                            return copy;
                                          })
                                        }
                                      >
                                         {uiText("AppStrings.MoveDown")} </Button>
                                    )}
                                  </Hstack>
                                </Vstack>
                              </Card>
                            ))}
                          </div>
                        )}

                        <Hstack className="pt-2 items-start">
                          <ImageInput
                            value={null}
                            width={420}
                            aspectRatio="16 / 9"
                            placeholder={
                              screenshots.length >= 5
                                ? uiText("AppStrings.MaxScreenshotsReached")
                                : uiText("AppStrings.AddScreenshot")
                            }
                            disabled={screenshots.length >= 5}
                            onSelect={async (file, crop) => {
                              if (screenshots.length >= 5) {
                                addToast({
                                  title:
                                    uiText("AppStrings.YouCanOnlyAddUpTo5Screenshots"),
                                });
                                return;
                              }
                              const url = await uploadTo("image", file, crop);
                              if (!url) return;
                              setScreenshots((prev) =>
                                [...prev, url].slice(0, 5),
                              );
                              addToast({ title: uiText("AppStrings.ScreenshotAdded") });
                            }}
                          />
                          {screenshots.length > 0 && (
                            <Button
                              icon="trash"
                              color="red"
                              onClick={() => setScreenshots([])}
                            >
                               {uiText("AppStrings.ClearAll2")} </Button>
                          )}
                        </Hstack>
                      </Vstack>
                    </div>

                    <div className="game-editor-row">
                      <Vstack align="start">
                        <div>
                          <Text color="text">{uiText("AppStrings.TrailerYoutube")}</Text>
                          <Text color="textFaded" size="xs">
                             {uiText("AppStrings.PasteAYoutubeUrlWatchShareLinkShorts")} </Text>
                        </div>
                        <Input
                          placeholder="https://www.youtube.com/watch?v=XXXXXXXXXXX"
                          value={trailerUrl}
                          onValueChange={setTrailerUrl}
                          onBlur={() => {
                            if (trailerUrl && !extractYouTubeId(trailerUrl)) {
                              addToast({
                                title:
                                  uiText("AppStrings.ThatDoesnTLookLikeAValidYoutube"),
                              });
                            }
                          }}
                        />
                        {trailerUrl && extractYouTubeId(trailerUrl) && (
                          <div
                            className="w-full rounded-xl overflow-hidden"
                            style={{
                              aspectRatio: "16 / 9",
                              background: "#111",
                            }}
                          >
                            <iframe
                              src={`https://www.youtube-nocookie.com/embed/${extractYouTubeId(
                                trailerUrl,
                              )}`}
                              title={uiText("AppStrings.Trailer")}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                          </div>
                        )}
                      </Vstack>
                    </div>
                <div className="game-editor-block">
                  <Text color="text" weight="semibold">{uiText("AppStrings.GameEmotes")}</Text>
                  <Text color="textFaded" size="xs">{uiText("AppStrings.AddEmotesRelatedToYourGameForPeopleToUseAroundTheSite")}</Text>
                </div>
                    <div className="game-editor-row">
                      <Vstack align="start">
                        <div>
                          <Text color="text">{uiText("AppStrings.EmotePrefix")}</Text>
                          <Text color="textFaded" size="xs">
                             {uiText("AppStrings.ChooseA4To8CharacterPrefixFor")} </Text>
                        </div>
                        <Input
                          value={emotePrefixInput}
                          onValueChange={(value) =>
                            setEmotePrefixInput(
                              value
                                .toLowerCase()
                                .replace(/[^a-z0-9]/g, "")
                                .slice(0, MAX_EMOTE_PREFIX_LENGTH),
                            )
                          }
                          name="gameEmotePrefix"
                          placeholder={uiText("AppStrings.EGJam123")}
                          maxLength={MAX_EMOTE_PREFIX_LENGTH}
                        />
                      </Vstack>
                    </div>

                    <div className="game-editor-block">
                      <Vstack align="start" className="gap-3">
                        <div>
                          <Text color="text">{uiText("AppStrings.GameEmotes")}</Text>
                          <Text color="textFaded" size="xs">
                             {uiText("AppStrings.GameEmotesUseThePrefix")}{" "}
                            <span className="font-semibold">
                              {gameEmotePrefix}
                            </span>
                            .
                          </Text>
                        </div>
                        <Button icon="plus" disabled={!game?.slug} onClick={() => setAddingGameEmote(true)}>{uiText("AppStrings.AddEmote")}</Button>
                        {!game?.slug && <Text size="xs" color="textFaded">{uiText("AppStrings.SaveYourGameBeforeAddingEmotes2")}</Text>}
                        <Modal isOpen={addingGameEmote} onOpenChange={open => { if (!open && !savingGameEmote) { setAddingGameEmote(false); setGameEmoteArtistOpen(false); } }} size="2xl">
                          <ModalContent>
                            <ModalHeader className="pr-14 text-lg font-semibold">{uiText("AppStrings.AddEmote")}</ModalHeader>
                            <ModalBody className="max-h-[65dvh] overflow-y-auto">
                              <div className="mb-5 flex items-center gap-3 rounded-lg border p-4" style={{ borderColor: `color-mix(in srgb, ${colors.text} 5%, ${colors.mantle})` }}>
                                {gameEmoteImage ? <img src={gameEmoteImage} alt={uiText("AppStrings.EmotePreview")} className="h-12 w-12 object-contain" /> : <Icon name="smileplus" size={32} />}
                                <div><Text size="xs" color="textFaded">{uiText("AppStrings.Preview")}</Text><Text size="sm">:{gameEmotePrefix}{cleanedGameEmoteSlug || uiText("AppStrings.Emote")}:</Text></div>
                              </div>
                        <Hstack className="items-end flex-wrap">
                          <Input
                            label={uiText("AppStrings.EmoteSlug")}
                            labelPlacement="outside"
                            placeholder={uiText("AppStrings.Victory")}
                            value={gameEmoteSlug}
                            onValueChange={setGameEmoteSlug}
                            disabled={!game?.slug}
                          />
                          <div className="relative">
                            <Input
                              label={uiText("AppStrings.ArtistUserSlug")}
                              labelPlacement="outside"
                              placeholder={uiText("AppStrings.Username2")}
                              value={gameEmoteArtistSlug}
                              onValueChange={(value) => {
                                setGameEmoteArtistSlug(value);
                                doEmoteArtistSearch(value, "create");
                              }}
                              onKeyDown={(event) => {
                                if (
                                  !gameEmoteArtistOpen ||
                                  gameEmoteArtistMatches.length === 0
                                ) {
                                  return;
                                }
                                if (event.key === "ArrowDown") {
                                  event.preventDefault();
                                  setGameEmoteArtistIndex((prev) =>
                                    prev + 1 >= gameEmoteArtistMatches.length
                                      ? 0
                                      : prev + 1,
                                  );
                                } else if (event.key === "ArrowUp") {
                                  event.preventDefault();
                                  setGameEmoteArtistIndex((prev) =>
                                    prev === 0
                                      ? gameEmoteArtistMatches.length - 1
                                      : prev - 1,
                                  );
                                } else if (event.key === "Enter") {
                                  event.preventDefault();
                                  const match =
                                    gameEmoteArtistMatches[
                                      gameEmoteArtistIndex
                                    ];
                                  if (match) {
                                    setGameEmoteArtistSlug(match.slug);
                                    setGameEmoteArtistOpen(false);
                                  }
                                } else if (event.key === "Escape") {
                                  setGameEmoteArtistOpen(false);
                                }
                              }}
                              disabled={!game?.slug}
                            />
                            {gameEmoteArtistOpen &&
                              gameEmoteArtistMatches.length > 0 && (
                                <ArtistSuggestions onClose={() => setGameEmoteArtistOpen(false)}>
                                  {gameEmoteArtistMatches.map((u, index) => (
                                    <button
                                      key={u.id}
                                      type="button"
                                      className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left"
                                      style={{
                                        backgroundColor:
                                          index === gameEmoteArtistIndex
                                            ? "rgba(59,130,246,0.3)"
                                            : "transparent",
                                      }}
                                      onMouseDown={(event) => {
                                        event.preventDefault();
                                        setGameEmoteArtistSlug(u.slug);
                                        setGameEmoteArtistOpen(false);
                                      }}
                                    >
                                      <img
                                        src={
                                          u.profilePicture ||
                                          "/images/D2J_Icon.png"
                                        }
                                        alt={u.name}
                                        className="h-5 w-5 rounded-full"
                                        loading="lazy"
                                        decoding="async"
                                      />
                                      <div className="flex flex-col text-sm">
                                        <span>{u.name}</span>
                                        <span className="text-xs opacity-70">
                                          @{u.slug}
                                        </span>
                                      </div>
                                    </button>
                                  ))}
                                </ArtistSuggestions>
                              )}
                          </div>
                          <Vstack align="start" gap={1}>
                            <Text size="xs" color="textFaded">
                               {uiText("AppStrings.UploadImage")} </Text>
                            <ImageInput
                              value={gameEmoteImage}
                              width={80}
                              height={80}
                              placeholder={uiText("AppStrings.Upload")}
                              disabled={!game?.slug}
                              onSelect={async (file, crop) => {
                                const url = await uploadTo("image", file, crop);
                                if (url) {
                                  setGameEmoteImage(url);
                                }
                              }}
                            />
                          </Vstack>
                          <Button
                            color="blue"
                            loading={savingGameEmote}
                            disabled={!game?.slug}
                            onClick={async () => {
                              if (!game?.slug) {
                                addToast({
                                  title: uiText("AppStrings.SaveYourGameBeforeAddingEmotes"),
                                });
                                return;
                              }
                              if (!cleanedGameEmoteSlug || !gameEmoteImage) {
                                addToast({
                                  title: uiText("AppStrings.SlugAndImageAreRequired"),
                                });
                                return;
                              }
                              setSavingGameEmote(true);
                              try {
                                const response = await createGameEmoji(
                                  game.slug,
                                  cleanedGameEmoteSlug,
                                  gameEmoteImage,
                                  gameEmoteArtistSlug.trim() || null,
                                );
                                const data = await response
                                  .json()
                                  .catch(() => null);
                                if (!response.ok) {
                                  addToast({
                                    title:
                                      data?.message ?? uiText("AppStrings.FailedToAddEmote"),
                                  });
                                  return;
                                }
                                addToast({ title: uiText("AppStrings.EmoteAdded") });
                                setAddingGameEmote(false);
                                setGameEmoteArtistOpen(false);
                                setGameEmoteSlug("");
                                setGameEmoteImage(null);
                                setGameEmoteArtistSlug("");
                                await refreshEmojis();
                              } catch (error) {
                                console.error(error);
                                addToast({ title: uiText("AppStrings.FailedToAddEmote") });
                              } finally {
                                setSavingGameEmote(false);
                              }
                            }}
                          >
                             {uiText("AppStrings.AddEmote")} </Button>
                        </Hstack>
                            </ModalBody>
                            <ModalFooter><Button variant="ghost" disabled={savingGameEmote} onClick={() => { setAddingGameEmote(false); setGameEmoteArtistOpen(false); }}>{uiText("AppStrings.Cancel")}</Button></ModalFooter>
                          </ModalContent>
                        </Modal>

                        {gameEmotes.length === 0 ? (
                          <Text size="sm" color="textFaded">
                             {uiText("AppStrings.NoGameEmotesYet")} </Text>
                        ) : (
                          <div className="w-full">
                            {gameEmotes.map((emoji) => (
                              <div
                                key={emoji.id}
                                className="flex flex-wrap items-center gap-3 border-b py-4 last:border-b-0"
                                style={{ borderColor: `color-mix(in srgb, ${colors.text} 5%, ${colors.mantle})` }}
                              >
                                <img
                                  src={emoji.image}
                                  alt={uiText("AppStrings.Value03", { value0: emoji.slug })}
                                  className="h-6 w-6"
                                  loading="lazy"
                                  decoding="async"
                                />
                                <div className="min-w-0 flex-1"><Text size="sm">:{emoji.slug}:</Text>{emoji.artistUser && <Text size="xs" color="textFaded">{emoji.artistUser.name || emoji.artistUser.slug}</Text>}</div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  icon="pencil"
                                  onClick={() => {
                                    setEditingGameEmoteId(emoji.id);
                                    setEditingGameEmoteSlug(
                                      emoji.slug.replace(gameEmotePrefix, ""),
                                    );
                                    setEditingGameEmoteImage(emoji.image);
                                    setEditingGameEmoteArtistSlug(
                                      emoji.artistUser?.slug ?? "",
                                    );
                                  }}
                                >
                                   {uiText("AppStrings.PreviewEdit")} </Button>
                                <Button
                                  size="sm"
                                  color="red"
                                  variant="ghost"
                                  onClick={async () => {
                                    const response = await deleteEmoji(
                                      emoji.id,
                                    );
                                    const data = await response
                                      .json()
                                      .catch(() => null);
                                    if (!response.ok) {
                                      addToast({
                                        title:
                                          data?.message ??
                                          uiText("AppStrings.FailedToDeleteEmote"),
                                      });
                                      return;
                                    }
                                    addToast({
                                      title: data?.message ?? uiText("AppStrings.EmoteDeleted"),
                                    });
                                    await refreshEmojis();
                                  }}
                                >
                                   {uiText("PostCard.Remove.Title")} </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        {editingGameEmoteId && (
                          <Modal isOpen onOpenChange={open => { if (!open && !savingEditGameEmote) { setEditingGameEmoteId(null); setEditGameEmoteArtistOpen(false); } }} size="2xl">
                          <ModalContent>
                          <ModalHeader className="pr-14 text-lg font-semibold">{uiText("AppStrings.EditEmote")}</ModalHeader>
                          <ModalBody className="max-h-[65dvh] overflow-y-auto">
                            <div className="mb-5 flex items-center gap-3 rounded-lg border p-4" style={{ borderColor: `color-mix(in srgb, ${colors.text} 5%, ${colors.mantle})` }}>
                              {editingGameEmoteImage && <img src={editingGameEmoteImage} alt={uiText("AppStrings.EmotePreview")} className="h-12 w-12 object-contain" />}
                              <div><Text size="xs" color="textFaded">{uiText("AppStrings.Preview")}</Text><Text size="sm">:{gameEmotePrefix}{cleanedEditingGameEmoteSlug || uiText("AppStrings.Emote")}:</Text></div>
                            </div>
                            <Vstack align="start" className="gap-3">
                              <Hstack className="items-end flex-wrap">
                                <Input
                                  label={uiText("AppStrings.EmoteSlug")}
                                  labelPlacement="outside"
                                  placeholder={uiText("AppStrings.Victory")}
                                  value={editingGameEmoteSlug}
                                  onValueChange={setEditingGameEmoteSlug}
                                />
                                <div className="relative">
                                  <Input
                                    label={uiText("AppStrings.ArtistUserSlug")}
                                    labelPlacement="outside"
                                    placeholder={uiText("AppStrings.Username2")}
                                    value={editingGameEmoteArtistSlug}
                                    onValueChange={(value) => {
                                      setEditingGameEmoteArtistSlug(value);
                                      doEmoteArtistSearch(value, "edit");
                                    }}
                                    onKeyDown={(event) => {
                                      if (
                                        !editGameEmoteArtistOpen ||
                                        editGameEmoteArtistMatches.length === 0
                                      ) {
                                        return;
                                      }
                                      if (event.key === "ArrowDown") {
                                        event.preventDefault();
                                        setEditGameEmoteArtistIndex((prev) =>
                                          prev + 1 >=
                                          editGameEmoteArtistMatches.length
                                            ? 0
                                            : prev + 1,
                                        );
                                      } else if (event.key === "ArrowUp") {
                                        event.preventDefault();
                                        setEditGameEmoteArtistIndex((prev) =>
                                          prev === 0
                                            ? editGameEmoteArtistMatches.length -
                                              1
                                            : prev - 1,
                                        );
                                      } else if (event.key === "Enter") {
                                        event.preventDefault();
                                        const match =
                                          editGameEmoteArtistMatches[
                                            editGameEmoteArtistIndex
                                          ];
                                        if (match) {
                                          setEditingGameEmoteArtistSlug(
                                            match.slug,
                                          );
                                          setEditGameEmoteArtistOpen(false);
                                        }
                                      } else if (event.key === "Escape") {
                                        setEditGameEmoteArtistOpen(false);
                                      }
                                    }}
                                  />
                                  {editGameEmoteArtistOpen &&
                                    editGameEmoteArtistMatches.length > 0 && (
                                      <ArtistSuggestions onClose={() => setEditGameEmoteArtistOpen(false)}>
                                        {editGameEmoteArtistMatches.map(
                                          (u, index) => (
                                            <button
                                              key={u.id}
                                              type="button"
                                              className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left"
                                              style={{
                                                backgroundColor:
                                                  index ===
                                                  editGameEmoteArtistIndex
                                                    ? "rgba(59,130,246,0.3)"
                                                    : "transparent",
                                              }}
                                              onMouseDown={(event) => {
                                                event.preventDefault();
                                                setEditingGameEmoteArtistSlug(
                                                  u.slug,
                                                );
                                                setEditGameEmoteArtistOpen(
                                                  false,
                                                );
                                              }}
                                            >
                                              <img
                                                src={
                                                  u.profilePicture ||
                                                  "/images/D2J_Icon.png"
                                                }
                                                alt={u.name}
                                                className="h-5 w-5 rounded-full"
                                                loading="lazy"
                                                decoding="async"
                                              />
                                              <div className="flex flex-col text-sm">
                                                <span>{u.name}</span>
                                                <span className="text-xs opacity-70">
                                                  @{u.slug}
                                                </span>
                                              </div>
                                            </button>
                                          ),
                                        )}
                                      </ArtistSuggestions>
                                    )}
                                </div>
                                <Vstack align="start" gap={1}>
                                  <Text size="xs" color="textFaded">
                                     {uiText("AppStrings.UploadImage")} </Text>
                                  <ImageInput
                                    value={editingGameEmoteImage}
                                    width={80}
                                    height={80}
                                    placeholder={uiText("AppStrings.Upload")}
                                    onSelect={async (file, crop) => {
                                      const url = await uploadTo(
                                        "image",
                                        file,
                                        crop,
                                      );
                                      if (url) {
                                        setEditingGameEmoteImage(url);
                                      }
                                    }}
                                  />
                                </Vstack>
                                <Hstack>
                                  <Button
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingGameEmoteId(null);
                                      setEditingGameEmoteSlug("");
                                      setEditingGameEmoteImage(null);
                                      setEditingGameEmoteArtistSlug("");
                                    }}
                                  >
                                     {uiText("AppStrings.Cancel")} </Button>
                                  <Button
                                    color="blue"
                                    loading={savingEditGameEmote}
                                    onClick={async () => {
                                      if (!editingGameEmoteId) return;
                                      if (
                                        !cleanedEditingGameEmoteSlug ||
                                        !editingGameEmoteImage
                                      ) {
                                        addToast({
                                          title: uiText("AppStrings.SlugAndImageAreRequired"),
                                        });
                                        return;
                                      }
                                      setSavingEditGameEmote(true);
                                      try {
                                        const response = await updateEmoji(
                                          editingGameEmoteId,
                                          {
                                            slug: `${gameEmotePrefix}${cleanedEditingGameEmoteSlug}`,
                                            image: editingGameEmoteImage,
                                            artistSlug:
                                              editingGameEmoteArtistSlug.trim() ||
                                              null,
                                            scopeUserId: null,
                                            scopeGameId: game?.id ?? null,
                                          },
                                        );
                                        const data = await response
                                          .json()
                                          .catch(() => null);
                                        if (!response.ok) {
                                          addToast({
                                            title:
                                              data?.message ??
                                              uiText("AppStrings.FailedToUpdateEmote"),
                                          });
                                          return;
                                        }
                                        addToast({ title: uiText("AppStrings.EmoteUpdated") });
                                        setEditingGameEmoteId(null);
                                        setEditingGameEmoteSlug("");
                                        setEditingGameEmoteImage(null);
                                        setEditingGameEmoteArtistSlug("");
                                        await refreshEmojis();
                                      } catch (error) {
                                        console.error(error);
                                        addToast({
                                          title: uiText("AppStrings.FailedToUpdateEmote"),
                                        });
                                      } finally {
                                        setSavingEditGameEmote(false);
                                      }
                                    }}
                                  >
                                     {uiText("Settings.Save.Title")} </Button>
                                </Hstack>
                              </Hstack>
                            </Vstack>
                          </ModalBody>
                          </ModalContent>
                          </Modal>
                        )}
                      </Vstack>
                    </div>
              </Vstack>
            </Tab>
            <Tab title={uiText("AppStrings.Metadata")} icon="tags">
              <Vstack align="stretch">
                <div className="game-editor-panel-heading">
                  <Vstack align="start">
                    <Hstack>
                      <Icon name="tags" color="text" size={28} />
                      <Text size="2xl" color="text" weight="bold">
                         {uiText("AppStrings.Metadata")} </Text>
                    </Hstack>
                    <Text size="sm" color="textFaded">
                       {uiText("AppStrings.MetadataToHelpPeopleFindYourGameBetter")} </Text>
                  </Vstack>
                </div>
                <div className="game-editor-row">
                  <Vstack align="start">
                    <div>
                      <Text color="text">CreateGame.Tags.Title</Text>
                      <Text color="textFaded" size="xs">
                        CreateGame.Tags.Description
                      </Text>
                    </div>
                    {isMounted && (
                      <Select<
                        {
                          value: string;
                          id: number;
                          label: ReactNode;
                        },
                        true
                      >
                        styles={styles}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        isMulti
                        isClearable={false}
                        onChange={(value) => setTags(value.map((i) => i.id))}
                        value={tags.map((index) => ({
                          value: allTags[index].name,
                          id: index,
                          label: (
                            <div className="flex gap-2 items-center">
                              {allTags[index].icon && (
                                <Avatar
                                  className="w-6 h-6 min-w-6 min-h-6"
                                  size={24}
                                  src={allTags[index].icon}
                                  style={{ backgroundColor: "transparent" }}
                                />
                              )}
                              <p>{allTags[index].name}</p>
                            </div>
                          ),
                        }))}
                        isOptionDisabled={() =>
                          tags != null && tags.length >= 10
                        }
                        options={allTags.map((tag, i) => ({
                          value: tag.name,
                          id: i,
                          label: (
                            <div className="flex gap-2 items-center">
                              <p>{translateSystemLabel(tag.name, uiText)}</p>
                            </div>
                          ),
                        }))}
                      />
                    )}
                  </Vstack>
                </div>

                <div className="game-editor-row">
                  <Vstack align="start">
                    <div>
                      <Text color="text">CreateGame.Flags.Title</Text>
                      <Text color="textFaded" size="xs">
                        CreateGame.Flags.Description
                      </Text>
                    </div>
                    {isMounted && (
                      <Select<
                        {
                          value: string;
                          id: number;
                          label: ReactNode;
                        },
                        true
                      >
                        styles={styles}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        isMulti
                        isClearable={false}
                        onChange={(value) => setFlags(value.map((i) => i.id))}
                        value={flags.map((index) => ({
                          value: allFlags[index].name,
                          id: index,
                          label: (
                            <div className="flex gap-2 items-center">
                              {allFlags[index].icon &&
                                getIcon(allFlags[index].icon)}
                              <p>{allFlags[index].name}</p>
                            </div>
                          ),
                        }))}
                        options={allFlags.map((flag, i) => ({
                          value: flag.name,
                          id: i,
                          label: (
                            <div className="flex gap-2 items-center">
                              <p>{flag.name}</p>
                            </div>
                          ),
                        }))}
                      />
                    )}
                  </Vstack>
                </div>

                <div className="game-editor-row relative z-40 overflow-visible">
                  <Vstack align="start">
                    <div>
                      <Text color="text">{uiText("AppStrings.InputMethods")}</Text>
                      <Text color="textFaded" size="xs">
                         {uiText("AppStrings.SelectAllInputMethodsThatPlayersCanUse")} </Text>
                    </div>

                    <Dropdown portal
                      multiple
                      closeOnSelect={false}
                      placeholder={uiText("AppStrings.SelectInputMethods")}
                      selectedValues={inputMethods}
                      onSelectionChange={(sel) => {
                        setInputMethods(sel as Set<InputMethodType>);
                      }}
                    >
                      <Dropdown.Item
                        icon="eraser"
                        onClick={(e) => {
                          e.preventDefault();
                          setInputMethods(new Set());
                        }}
                      >
                         {uiText("AppStrings.ClearAll")} </Dropdown.Item>

                      {INPUT_METHOD_OPTIONS.map(({ value, label, icon }) => (
                        <Dropdown.Item key={value} value={value} icon={icon}>
                          {label}
                        </Dropdown.Item>
                      ))}
                    </Dropdown>
                  </Vstack>
                </div>
                    <div className="game-editor-row relative z-30 overflow-visible">
                      <Vstack align="start">
                        <div>
                          <Text color="text">
                             {uiText("AppStrings.TimeToCompleteARun")} </Text>
                          <Text color="textFaded" size="xs">
                             {uiText("AppStrings.IfYourGameFeaturesMultipleRunsSuchAsARoguelikeHowLongAUserShouldExpectAnAverageRunOfT")} </Text>
                        </div>

                        <Dropdown portal
                          placeholder={uiText("AppStrings.SelectTimeInterval")}
                          selectedValue={estOneRun || null}
                          onSelect={(i) => {
                            setEstOneRun(typeof i === "string" ? i : "");
                          }}
                        >
                          <Dropdown.Item icon="eraser">
                             {uiText("AppStrings.ClearSelection")} </Dropdown.Item>
                          {TIME_OPTIONS.map((value) => (
                            <Dropdown.Item key={value} value={value}>
                              {value}
                            </Dropdown.Item>
                          ))}
                        </Dropdown>
                      </Vstack>
                    </div>
                    <div className="game-editor-row relative z-20 overflow-visible">
                      <Vstack align="start">
                        <div>
                          <Text color="text">
                             {uiText("AppStrings.TimeToBeatTheGame")} </Text>
                          <Text color="textFaded" size="xs">
                             {uiText("AppStrings.IfYourGameCanBeBeatenTheAverage")} </Text>
                        </div>

                        <Dropdown portal
                          placeholder={uiText("AppStrings.SelectTimeInterval")}
                          selectedValue={estAnyPercent || null}
                          onSelect={(i) => {
                            setEstAnyPercent(typeof i === "string" ? i : "");
                          }}
                        >
                          <Dropdown.Item icon="eraser">
                             {uiText("AppStrings.ClearSelection")} </Dropdown.Item>
                          {TIME_OPTIONS.map((value) => (
                            <Dropdown.Item key={value} value={value}>
                              {value}
                            </Dropdown.Item>
                          ))}
                        </Dropdown>
                      </Vstack>
                    </div>
                    <div className="game-editor-row relative z-10 overflow-visible">
                      <Vstack align="start">
                        <div>
                          <Text color="text">
                             {uiText("AppStrings.TimeTo100TheGame")} </Text>
                          <Text color="textFaded" size="xs">
                             {uiText("AppStrings.TheAverageTimeItWouldTakeForA")} </Text>
                        </div>

                        <Dropdown portal
                          placeholder={uiText("AppStrings.SelectTimeInterval")}
                          selectedValue={estHundredPercent || null}
                          onSelect={(i) => {
                            setEstHundredPercent(
                              typeof i === "string" ? i : "",
                            );
                          }}
                        >
                          <Dropdown.Item icon="eraser">
                             {uiText("AppStrings.ClearSelection")} </Dropdown.Item>
                          {TIME_OPTIONS.map((value) => (
                            <Dropdown.Item key={value} value={value}>
                              {value}
                            </Dropdown.Item>
                          ))}
                        </Dropdown>
                      </Vstack>
                    </div>
              </Vstack>
            </Tab>
            <Tab title={uiText("CreateGame.Soundtrack.Title")} icon="music">
              <Vstack align="stretch">
                <div className="game-editor-panel-heading">
                  <Vstack align="start">
                    <Hstack>
                      <Icon name="music" color="text" size={28} />
                      <Text size="2xl" color="text" weight="bold">{uiText("CreateGame.Soundtrack.Title")}</Text>
                    </Hstack>
                    <Text size="sm" color="textFaded">CreateGame.Soundtrack.Description</Text>
                  </Vstack>
                </div>
                    <Vstack align="start" className="pt-4">
                      <div>
                        <Text color="text">{uiText("AppStrings.AlbumThumbnail")}</Text>
                        <Text color="textFaded" size="xs">
                           {uiText("AppStrings.SquareArtworkShownWithThisGameAposSMusic")} </Text>
                      </div>
                      <ImageInput
                        value={soundtrackThumbnailUrl}
                        width={240}
                        height={240}
                        placeholder={uiText("AppStrings.UploadAlbumThumbnail")}
                        onSelect={async (file, crop) => {
                          const url = await uploadTo("image", file, crop);
                          if (url) {
                            setSoundtrackThumbnailUrl(url);
                          }
                        }}
                      />

                      {/* List songs */}
                      {songs.length > 0 && (
                        <Vstack className="w-full gap-3" align="stretch">
                          {songs.map((song, index) => {
                            return (
                              <ItemEditor key={song.id} item={song} title={song.name || uiText("AppStrings.UntitledTrack")}
      actions={<ReorderControls index={index} count={songs.length} name={song.name || uiText("AppStrings.UntitledTrack")} onMove={direction => setSongs(current => moveItem(current, index, direction))} />}
      initiallyOpen={newSongId === song.id}
      onClose={() => setNewSongId(null)}
      onOpen={() => setSoftwareUsedDrafts(prev => ({ ...prev, [song.id]: song.softwareUsed.join(", ") }))}
      onApply={draft => setSongs(prev => prev.map(item => item.id === song.id ? draft : item))}
      onRemove={() => setSongs(prev => prev.filter(item => item.id !== song.id))}
      summary={<div className="flex items-center gap-3"><Icon name="music" /><div><p className="text-sm font-semibold">{song.name || uiText("AppStrings.UntitledTrack")}</p><p className="text-xs" style={{ color: colors.textFaded }}>{song.credits.length}  {uiText("AppStrings.Credits2")} {(song.license && translateSystemLabel(song.license, uiText)) || uiText("AppStrings.NoLicenseSelected")}</p></div></div>}
      preview={draft => <div><p className="mb-2 font-semibold">{draft.name || uiText("AppStrings.UntitledTrack")}</p>{draft.url && <AudioPreview key={draft.url} url={draft.url} file={uploadedAudioFiles.current.get(draft.url)} />}<p className="mt-2 text-xs" style={{ color: colors.textFaded }}>{draft.bpm ? draft.bpm + " BPM · " : ""}{draft.musicalKey || ""}</p></div>}>
      {(song, setDraft) => {
        const licenseMode = licenseModeForFlags({ attribution: song.licenseAttribution, commercial: song.licenseCommercial, derivatives: song.licenseDerivatives, shareAlike: song.licenseShareAlike });
        const setDraftSongs: typeof setSongs = next => setDraft(current => (typeof next === "function" ? next([current]) : next)[0] ?? current);
        return (<Vstack align="start" className="gap-3">


                                  <div className="w-full">
                                    <Text color="text">{uiText("AppStrings.SongSlug")}</Text>
                                    <Text color="textFaded" size="xs">
                                       {uiText("AppStrings.UsedInTheUrlForTheSong")} </Text>
                                  </div>
                                  <Input
                                    placeholder={uiText("AppStrings.EnterSongSlug")}
                                    value={song.slug}
                                    onValueChange={(val) =>
                                      setDraftSongs((prev) =>
                                        prev.map((s) =>
                                          s.id === song.id
                                            ? { ...s, slug: val }
                                            : s,
                                        ),
                                      )
                                    }
                                  />
                                  <div className="w-full">
                                    <Text color="text">{uiText("AppStrings.SongName")}</Text>
                                    <Text color="textFaded" size="xs">
                                       {uiText("AppStrings.ShownInTheSoundtrackList")} </Text>
                                  </div>
                                  <Input
                                    placeholder={uiText("AppStrings.EnterSongName")}
                                    value={song.name}
                                    onValueChange={(val) =>
                                      setDraftSongs((prev) =>
                                        prev.map((s) =>
                                          s.id === song.id
                                            ? { ...s, name: val }
                                            : s,
                                        ),
                                      )
                                    }
                                  />
                                  <div className="w-full">
                                    <Text color="text">{uiText("AppStrings.Commentary")}</Text>
                                    <Text color="textFaded" size="xs">
                                       {uiText("AppStrings.NotesContextOrProductionDetailsForTheTrack")} </Text>
                                  </div>
                                  <Editor
                                    content={song.commentary ?? ""}
                                    setContent={(val) =>
                                      setDraftSongs((prev) =>
                                        prev.map((s) =>
                                          s.id === song.id
                                            ? { ...s, commentary: val }
                                            : s,
                                        ),
                                      )
                                    }
                                    size="sm"
                                    format="markdown"
                                  />
                                  {trackTagCategories.length > 0 && (
                                    <Vstack
                                      align="start"
                                      className="w-full gap-3"
                                    >
                                      <div className="w-full">
                                        <Text color="text">{uiText("AppStrings.TrackTags")}</Text>
                                        <Text color="textFaded" size="xs">
                                           {uiText("AppStrings.HelpListenersFindThisTrackByGenreMood")} </Text>
                                      </div>
                                      {trackTagCategories.map(
                                        (categoryName) => {
                                          const categoryTags =
                                            allTrackTags.filter(
                                              (tag) =>
                                                tag.category?.name ===
                                                categoryName,
                                            );
                                          const selectedCategoryTags =
                                            categoryTags.filter((tag) =>
                                              song.tagIds.includes(tag.id),
                                            );
                                          const isSingleCategory =
                                            SINGLE_TRACK_TAG_CATEGORIES.has(
                                              categoryName,
                                            );

                                          return (
                                            <div
                                              key={`${song.id}-${categoryName}`}
                                              className="w-full"
                                            >
                                              <Text color="text" size="sm">
                                                {translateSystemLabel(categoryName, uiText)}
                                              </Text>
                                              <Text color="textFaded" size="xs">
                                                {TRACK_TAG_CATEGORY_HELPERS[categoryName] ? uiText(TRACK_TAG_CATEGORY_HELPERS[categoryName]) :
                                                  (isSingleCategory
                                                    ? uiText("AppStrings.ChooseOne")
                                                    : uiText("AppStrings.ChooseAnyThatFit"))}
                                              </Text>
                                              {isMounted &&
                                                (isSingleCategory ? (
                                                  <Select<
                                                    {
                                                      value: string;
                                                      id: number;
                                                      label: ReactNode;
                                                    }
                                                  >
                                                    styles={styles}
                                                    menuPortalTarget={
                                                      document.body
                                                    }
                                                    menuPosition="fixed"
                                                    isClearable
                                                    onChange={(value) => {
                                                      const nextIds =
                                                        value && "id" in value
                                                          ? [value.id]
                                                          : [];
                                                      setDraftSongs((prev) =>
                                                        prev.map((s) => {
                                                          if (s.id !== song.id)
                                                            return s;

                                                          const preservedIds =
                                                            s.tagIds.filter(
                                                              (id) =>
                                                                !categoryTags.some(
                                                                  (tag) =>
                                                                    tag.id ===
                                                                    id,
                                                                ),
                                                            );

                                                          return {
                                                            ...s,
                                                            tagIds: [
                                                              ...preservedIds,
                                                              ...nextIds,
                                                            ],
                                                          };
                                                        }),
                                                      );
                                                    }}
                                                    value={(() => {
                                                      const selected =
                                                        selectedCategoryTags[0];
                                                      return selected
                                                        ? {
                                                            value:
                                                              selected.name,
                                                            id: selected.id,
                                                            label:
                                                              selected.name,
                                                          }
                                                        : null;
                                                    })()}
                                                    options={categoryTags.map(
                                                      (tag) => ({
                                                        value: tag.name,
                                                        id: tag.id,
                                                        label: translateSystemLabel(tag.name, uiText),
                                                      }),
                                                    )}
                                                  />
                                                ) : (
                                                  <Select<
                                                    {
                                                      value: string;
                                                      id: number;
                                                      label: ReactNode;
                                                    },
                                                    true
                                                  >
                                                    styles={styles}
                                                    menuPortalTarget={
                                                      document.body
                                                    }
                                                    menuPosition="fixed"
                                                    isMulti
                                                    isClearable
                                                    onChange={(value) => {
                                                      const nextIds = value.map(
                                                        (item) => item.id,
                                                      );
                                                      setDraftSongs((prev) =>
                                                        prev.map((s) => {
                                                          if (s.id !== song.id)
                                                            return s;

                                                          const preservedIds =
                                                            s.tagIds.filter(
                                                              (id) =>
                                                                !categoryTags.some(
                                                                  (tag) =>
                                                                    tag.id ===
                                                                    id,
                                                                ),
                                                            );

                                                          return {
                                                            ...s,
                                                            tagIds: [
                                                              ...preservedIds,
                                                              ...nextIds,
                                                            ],
                                                          };
                                                        }),
                                                      );
                                                    }}
                                                    value={selectedCategoryTags.map(
                                                      (tag) => ({
                                                        value: tag.name,
                                                        id: tag.id,
                                                        label: translateSystemLabel(tag.name, uiText),
                                                      }),
                                                    )}
                                                    options={categoryTags.map(
                                                      (tag) => ({
                                                        value: tag.name,
                                                        id: tag.id,
                                                        label: translateSystemLabel(tag.name, uiText),
                                                      }),
                                                    )}
                                                  />
                                                ))}
                                            </div>
                                          );
                                        },
                                      )}
                                    </Vstack>
                                  )}
                                  {allTrackFlags.length > 0 && (
                                    <div className="w-full">
                                      <Text color="text">{uiText("AppStrings.TrackFlags")}</Text>
                                      <Text color="textFaded" size="xs">
                                         {uiText("AppStrings.WarningsOrSpecialStatusForThisTrack")} </Text>
                                      {isMounted && (
                                        <Select<
                                          {
                                            value: string;
                                            id: number;
                                            label: ReactNode;
                                          },
                                          true
                                        >
                                          styles={styles}
                                          menuPortalTarget={document.body}
                                          menuPosition="fixed"
                                          isMulti
                                          isClearable
                                          onChange={(value) =>
                                            setDraftSongs((prev) =>
                                              prev.map((s) =>
                                                s.id === song.id
                                                  ? {
                                                      ...s,
                                                      flagIds: value.map(
                                                        (item) => item.id,
                                                      ),
                                                    }
                                                  : s,
                                              ),
                                            )
                                          }
                                          value={allTrackFlags
                                            .filter((flag) =>
                                              song.flagIds.includes(flag.id),
                                            )
                                            .map((flag) => ({
                                              value: flag.name,
                                              id: flag.id,
                                              label: flag.name,
                                            }))}
                                          options={allTrackFlags.map(
                                            (flag) => ({
                                              value: flag.name,
                                              id: flag.id,
                                              label: flag.name,
                                            }),
                                          )}
                                        />
                                      )}
                                    </div>
                                  )}
                                  <div className="grid w-full gap-3 md:grid-cols-2">
                                    <div>
                                      <Text color="text">{uiText("AppStrings.BPM2")}</Text>
                                      <Text color="textFaded" size="xs">
                                         {uiText("AppStrings.OptionalTempoMetadata")} </Text>
                                      <Input
                                        type="number"
                                        value={
                                          song.bpm == null
                                            ? ""
                                            : String(song.bpm)
                                        }
                                        onValueChange={(val) =>
                                          setDraftSongs((prev) =>
                                            prev.map((s) =>
                                              s.id === song.id
                                                ? {
                                                    ...s,
                                                    bpm: val
                                                      ? Number(val)
                                                      : null,
                                                  }
                                                : s,
                                            ),
                                          )
                                        }
                                        placeholder="120"
                                      />
                                    </div>
                                    <div>
                                      <Text color="text">{uiText("AppStrings.Key")}</Text>
                                      <Text color="textFaded" size="xs">
                                         {uiText("AppStrings.ExampleCMinorFMajor")} </Text>
                                      <Input
                                        value={song.musicalKey ?? ""}
                                        onValueChange={(val) =>
                                          setDraftSongs((prev) =>
                                            prev.map((s) =>
                                              s.id === song.id
                                                ? { ...s, musicalKey: val }
                                                : s,
                                            ),
                                          )
                                        }
                                        placeholder={uiText("AppStrings.CMinor")}
                                      />
                                    </div>
                                  </div>
                                  <div className="w-full">
                                    <Text color="text">{uiText("AppStrings.SoftwareUsed")}</Text>
                                    <Text color="textFaded" size="xs">
                                       {uiText("AppStrings.CommaSeparatedToolsOrDaws")} </Text>
                                    <Input
                                      value={
                                        softwareUsedDrafts[song.id] ?? song.softwareUsed.join(", ")
                                      }
                                      onValueChange={(val) => {
                                        setSoftwareUsedDrafts((prev) => ({
                                          ...prev,
                                          [song.id]: val,
                                        }));
                                        setDraftSongs((prev) =>
                                          prev.map((s) =>
                                            s.id === song.id
                                              ? {
                                                  ...s,
                                                  softwareUsed: val
                                                    .split(",")
                                                    .map((item) => item.trim())
                                                    .filter(Boolean),
                                                }
                                              : s,
                                          ),
                                        );
                                      }}
                                      placeholder={uiText("AppStrings.AbletonLiveKontaktFamitracker")}
                                    />
                                  </div>
                                  <div className="w-full">
                                    <Text color="text">{uiText("CreateGame.Links.Title")}</Text>
                                    <Text color="textFaded" size="xs">
                                       {uiText("AppStrings.ExternalPagesForThisTrack")} </Text>
                                    <Vstack
                                      align="start"
                                      className="w-full gap-2"
                                    >
                                      {song.links.map((link) => (
                                        <Hstack
                                          key={link.id}
                                          className="w-full gap-2"
                                        >
                                          <Input
                                            value={uiText(link.label)}
                                            onValueChange={(val) =>
                                              setDraftSongs((prev) =>
                                                prev.map((s) =>
                                                  s.id === song.id
                                                    ? {
                                                        ...s,
                                                        links: s.links.map(
                                                          (cur) =>
                                                            cur.id === link.id
                                                              ? {
                                                                  ...cur,
                                                                  label: val,
                                                                }
                                                              : cur,
                                                        ),
                                                      }
                                                    : s,
                                                ),
                                              )
                                            }
                                            placeholder={uiText("AppStrings.Bandcamp")}
                                          />
                                          <Input
                                            value={link.url}
                                            onValueChange={(val) =>
                                              setDraftSongs((prev) =>
                                                prev.map((s) =>
                                                  s.id === song.id
                                                    ? {
                                                        ...s,
                                                        links: s.links.map(
                                                          (cur) =>
                                                            cur.id === link.id
                                                              ? {
                                                                  ...cur,
                                                                  url: val,
                                                                }
                                                              : cur,
                                                        ),
                                                      }
                                                    : s,
                                                ),
                                              )
                                            }
                                            placeholder="https://..."
                                          />
                                          <Button
                                            size="sm"
                                            icon="trash"
                                            color="red"
                                            onClick={() =>
                                              setDraftSongs((prev) =>
                                                prev.map((s) =>
                                                  s.id === song.id
                                                    ? {
                                                        ...s,
                                                        links: s.links.filter(
                                                          (cur) =>
                                                            cur.id !== link.id,
                                                        ),
                                                      }
                                                    : s,
                                                ),
                                              )
                                            }
                                          />
                                        </Hstack>
                                      ))}
                                      <Button
                                        className="w-fit self-start"
                                        size="sm"
                                        icon="plus"
                                        onClick={() =>
                                          setDraftSongs((prev) =>
                                            prev.map((s) =>
                                              s.id === song.id
                                                ? {
                                                    ...s,
                                                    links: [
                                                      ...s.links,
                                                      {
                                                        id:
                                                          Date.now() +
                                                          Math.random(),
                                                        label: "",
                                                        url: "",
                                                      },
                                                    ],
                                                  }
                                                : s,
                                            ),
                                          )
                                        }
                                      >
                                         {uiText("CreateGame.Links.Add")} </Button>
                                    </Vstack>
                                  </div>
                                  <div className="w-full">
                                    <Text color="text">{uiText("AppStrings.License")}</Text>
                                    <Text color="textFaded" size="xs">
                                       {uiText("AppStrings.ChooseHowOthersCanUseThisTrack")} </Text>
                                  </div>
                                  <Vstack align="start" className="gap-2">
                                    {(() => {
                                      const backgroundUsageRequired =
                                        backgroundUsageRequiredByLicense({
                                          attribution: song.licenseAttribution,
                                          commercial: song.licenseCommercial,
                                          derivatives: song.licenseDerivatives,
                                          shareAlike: song.licenseShareAlike,
                                        });
                                      const licenseMode = licenseModeForFlags({
                                        attribution: song.licenseAttribution,
                                        commercial: song.licenseCommercial,
                                        derivatives: song.licenseDerivatives,
                                        shareAlike: song.licenseShareAlike,
                                      });
                                      const downloadRequired =
                                        licenseMode !== "ARR" ||
                                        (backgroundUsageRequired
                                          ? true
                                          : song.allowBackgroundUse);

                                      return (
                                        <>
                                          <Dropdown portal
                                            selectedValue={licenseModeForFlags({
                                              attribution:
                                                song.licenseAttribution,
                                              commercial:
                                                song.licenseCommercial,
                                              derivatives:
                                                song.licenseDerivatives,
                                              shareAlike:
                                                song.licenseShareAlike,
                                            })}
                                            onSelect={(value) => {
                                              setDraftSongs((prev) =>
                                                prev.map((s) => {
                                                  if (s.id !== song.id)
                                                    return s;
                                                  const mode =
                                                    value as LicenseMode;
                                                  if (mode === "ARR") {
                                                    return applyLicenseFlags(
                                                      s,
                                                      {
                                                        attribution: false,
                                                        commercial: false,
                                                        derivatives: false,
                                                        shareAlike: false,
                                                      },
                                                    );
                                                  }
                                                  if (mode === "CC0") {
                                                    return applyLicenseFlags(
                                                      s,
                                                      {
                                                        attribution: false,
                                                        commercial: true,
                                                        derivatives: true,
                                                        shareAlike: false,
                                                      },
                                                    );
                                                  }
                                                  return {
                                                    ...applyLicenseFlags(s, {
                                                      attribution: true,
                                                      commercial: true,
                                                      derivatives: true,
                                                      shareAlike: false,
                                                    }),
                                                    allowBackgroundUseAttribution: true,
                                                  };
                                                }),
                                              );
                                            }}
                                          >
                                            <Dropdown.Item
                                              value="ARR"
                                              description={uiText("AppStrings.NoReusePermissionsGranted")}
                                            >
                                               {uiText("AppStrings.AllRightsReserved")} </Dropdown.Item>
                                            <Dropdown.Item
                                              value="CC0"
                                              description={uiText("AppStrings.PublicDomainStyleReleaseWithNoAttributionRequired")}
                                            >
                                               {uiText("AppStrings.CC0")} </Dropdown.Item>
                                            <Dropdown.Item
                                              value="CC_BY"
                                              description={uiText("AppStrings.CreativeCommonsWithAttributionAndConfigurableRestrictions")}
                                            >
                                               {uiText("AppStrings.CcByBased")} </Dropdown.Item>
                                          </Dropdown>
                                          {licenseModeForFlags({
                                            attribution:
                                              song.licenseAttribution,
                                            commercial: song.licenseCommercial,
                                            derivatives:
                                              song.licenseDerivatives,
                                            shareAlike: song.licenseShareAlike,
                                          }) === "CC_BY" && (
                                            <>
                                              <Hstack className="w-full items-center gap-3">
                                                <Switch
                                                  checked
                                                  disabled
                                                  onChange={() => {}}
                                                />
                                                <Vstack align="start" gap={0}>
                                                  <Text color="text" size="sm">
                                                     {uiText("AppStrings.RequireAttribution")} </Text>
                                                  <Text
                                                    color="textFaded"
                                                    size="xs"
                                                  >
                                                     {uiText("AppStrings.CreditTheComposerWhenUsed")} </Text>
                                                </Vstack>
                                              </Hstack>
                                              <Hstack className="w-full items-center gap-3">
                                                <Switch
                                                  checked={
                                                    song.licenseCommercial
                                                  }
                                                  onChange={(val) =>
                                                    setDraftSongs((prev) =>
                                                      prev.map((s) => {
                                                        if (s.id !== song.id)
                                                          return s;
                                                        return applyLicenseFlags(
                                                          s,
                                                          {
                                                            attribution: true,
                                                            commercial: val,
                                                            derivatives:
                                                              s.licenseDerivatives,
                                                            shareAlike:
                                                              s.licenseShareAlike,
                                                          },
                                                        );
                                                      }),
                                                    )
                                                  }
                                                />
                                                <Vstack align="start" gap={0}>
                                                  <Text color="text" size="sm">
                                                     {uiText("AppStrings.AllowCommercialUse")} </Text>
                                                  <Text
                                                    color="textFaded"
                                                    size="xs"
                                                  >
                                                     {uiText("AppStrings.LetOthersUseItCommercially")} </Text>
                                                </Vstack>
                                              </Hstack>
                                              <Hstack className="w-full items-center gap-3">
                                                <Switch
                                                  checked={
                                                    song.licenseDerivatives
                                                  }
                                                  onChange={(val) =>
                                                    setDraftSongs((prev) =>
                                                      prev.map((s) => {
                                                        if (s.id !== song.id)
                                                          return s;
                                                        return applyLicenseFlags(
                                                          s,
                                                          {
                                                            attribution: true,
                                                            commercial:
                                                              s.licenseCommercial,
                                                            derivatives: val,
                                                            shareAlike: val
                                                              ? s.licenseShareAlike
                                                              : false,
                                                          },
                                                        );
                                                      }),
                                                    )
                                                  }
                                                />
                                                <Vstack align="start" gap={0}>
                                                  <Text color="text" size="sm">
                                                     {uiText("AppStrings.AllowDerivatives")} </Text>
                                                  <Text
                                                    color="textFaded"
                                                    size="xs"
                                                  >
                                                     {uiText("AppStrings.AllowRemixesOrAdaptations")} </Text>
                                                </Vstack>
                                              </Hstack>
                                              <Hstack className="w-full items-center gap-3">
                                                <Switch
                                                  checked={
                                                    song.licenseShareAlike
                                                  }
                                                  onChange={(val) =>
                                                    setDraftSongs((prev) =>
                                                      prev.map((s) => {
                                                        if (s.id !== song.id)
                                                          return s;
                                                        return applyLicenseFlags(
                                                          s,
                                                          {
                                                            attribution: true,
                                                            commercial:
                                                              s.licenseCommercial,
                                                            derivatives:
                                                              s.licenseDerivatives,
                                                            shareAlike: val,
                                                          },
                                                        );
                                                      }),
                                                    )
                                                  }
                                                  disabled={
                                                    !song.licenseDerivatives
                                                  }
                                                />
                                                <Vstack align="start" gap={0}>
                                                  <Text color="text" size="sm">
                                                     {uiText("AppStrings.ShareAlike")} </Text>
                                                  <Text
                                                    color="textFaded"
                                                    size="xs"
                                                  >
                                                     {uiText("AppStrings.DerivativesMustUseTheSameLicense")} </Text>
                                                </Vstack>
                                              </Hstack>
                                            </>
                                          )}
                                          <Text size="xs" color="textFaded">
                                             {uiText("AppStrings.LicenseApplied")} {translateSystemLabel(song.license, uiText)}
                                          </Text>
                                          <Hstack className="w-full items-start gap-3">
                                            <Switch
                                              checked={
                                                backgroundUsageRequired
                                                  ? true
                                                  : song.allowBackgroundUse
                                              }
                                              onChange={(val) => {
                                                if (backgroundUsageRequired) {
                                                  return;
                                                }
                                                setDraftSongs((prev) =>
                                                  prev.map((s) =>
                                                    s.id === song.id
                                                      ? {
                                                          ...s,
                                                          allowBackgroundUse:
                                                            val,
                                                          allowBackgroundUseAttribution:
                                                            val
                                                              ? s.allowBackgroundUseAttribution
                                                              : false,
                                                          allowDownload: val
                                                            ? true
                                                            : s.allowDownload,
                                                        }
                                                      : s,
                                                  ),
                                                );
                                              }}
                                              disabled={backgroundUsageRequired}
                                            />
                                            <Vstack
                                              align="start"
                                              gap={0}
                                              className="min-w-0 flex-1"
                                            >
                                              <Text color="text" size="sm">
                                                 {uiText("AppStrings.AllowBackgroundUseInStreamsAndVideos")} </Text>
                                              <Text color="textFaded" size="xs">
                                                 {uiText("AppStrings.LetPeopleUseThisTrackAsBackgroundMusic")} </Text>
                                            </Vstack>
                                          </Hstack>
                                          <Hstack className="w-full items-start gap-3">
                                            <Switch
                                              checked={
                                                licenseMode === "CC0"
                                                  ? false
                                                  : song.allowBackgroundUseAttribution
                                              }
                                              onChange={(val) =>
                                                setDraftSongs((prev) =>
                                                  prev.map((s) =>
                                                    s.id === song.id
                                                      ? {
                                                          ...s,
                                                          allowBackgroundUseAttribution:
                                                            val,
                                                        }
                                                      : s,
                                                  ),
                                                )
                                              }
                                              disabled={
                                                !(backgroundUsageRequired
                                                  ? true
                                                  : song.allowBackgroundUse) ||
                                                licenseMode === "CC0"
                                              }
                                            />
                                            <Vstack
                                              align="start"
                                              gap={0}
                                              className="min-w-0 flex-1"
                                            >
                                              <Text color="text" size="sm">
                                                 {uiText("AppStrings.RequireAttributionForStreamAndVideoBackgroundUse")} </Text>
                                              <Text color="textFaded" size="xs">
                                                 {uiText("AppStrings.WhenPeopleUseThisSongInTheBackground")} </Text>
                                            </Vstack>
                                          </Hstack>
                                          <Hstack className="w-full items-start gap-3">
                                            <Switch
                                              checked={
                                                downloadRequired
                                                  ? true
                                                  : song.allowDownload
                                              }
                                              onChange={(val) =>
                                                setDraftSongs((prev) =>
                                                  prev.map((s) =>
                                                    s.id === song.id
                                                      ? {
                                                          ...s,
                                                          allowDownload: val,
                                                        }
                                                      : s,
                                                  ),
                                                )
                                              }
                                              disabled={downloadRequired}
                                            />
                                            <Vstack
                                              align="start"
                                              gap={0}
                                              className="min-w-0 flex-1"
                                            >
                                              <Text color="text" size="sm">
                                                 {uiText("AppStrings.AllowDownloads")} </Text>
                                              <Text color="textFaded" size="xs">
                                                 {uiText("AppStrings.LetListenersDownloadThisTrack")} </Text>
                                            </Vstack>
                                          </Hstack>
                                        </>
                                      );
                                    })()}
                                  </Vstack>

                                  <div className="w-full">
                                    <Text color="text">{uiText("AppStrings.Credits")}</Text>
                                    <Text color="textFaded" size="xs">
                                       {uiText("AppStrings.ThePeopleWhoMadeThisSongLinkedTo")} </Text>
                                  </div>
                                  <div className="w-full relative">
                                    <Input
                                      placeholder={uiText("AppStrings.SearchUsers")}
                                      value={artistQuery[song.id] ?? ""}
                                      onValueChange={(value) => {
                                        setArtistQuery((prev) => ({
                                          ...prev,
                                          [song.id]: value,
                                        }));
                                        doArtistSearch(song.id, value);
                                      }}
                                    />

                                    {(artistResults[song.id]?.length ?? 0) >
                                      0 && (
                                      <Card>
                                        <Vstack align="stretch">
                                          {artistResults[song.id]!.map((u) => (
                                            <div
                                              key={u.id}
                                              className="flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors"
                                              style={{
                                                backgroundColor:
                                                  hoveredUserId === u.id
                                                    ? colors["base"]
                                                    : colors["mantle"],
                                              }}
                                              onMouseEnter={() =>
                                                setHoveredUserId(u.id)
                                              }
                                              onMouseLeave={() =>
                                                setHoveredUserId(null)
                                              }
                                              onClick={() => {
                                                setDraftSongs((prev) =>
                                                  prev.map((s) =>
                                                    s.id === song.id
                                                      ? {
                                                          ...s,
                                                          credits:
                                                            s.credits.some(
                                                              (credit) =>
                                                                credit.userId ===
                                                                u.id,
                                                            )
                                                              ? s.credits
                                                              : [
                                                                  ...s.credits,
                                                                  {
                                                                    id:
                                                                      Date.now() +
                                                                      Math.random(),
                                                                    role:
                                                                      s.credits
                                                                        .length ===
                                                                      0
                                                                        ? "Composer"
                                                                        : "",
                                                                    userId:
                                                                      u.id,
                                                                    user: {
                                                                      id: u.id,
                                                                      name: u.name,
                                                                      slug: u.slug,
                                                                      profilePicture:
                                                                        u.profilePicture,
                                                                      short:
                                                                        u.short,
                                                                    },
                                                                  },
                                                                ],
                                                        }
                                                      : s,
                                                  ),
                                                );
                                                setArtistQuery((prev) => ({
                                                  ...prev,
                                                  [song.id]: "",
                                                }));
                                                setArtistResults((prev) => ({
                                                  ...prev,
                                                  [song.id]: [],
                                                }));
                                              }}
                                            >
                                              <Hstack>
                                                <Avatar
                                                  src={u.profilePicture}
                                                />
                                                <Vstack gap={0} align="start">
                                                  <Text>{u.name}</Text>
                                                  <Text
                                                    color="textFaded"
                                                    size="xs"
                                                  >
                                                    {u.short ||
                                                      "General.NoDescription"}
                                                  </Text>
                                                </Vstack>
                                              </Hstack>
                                            </div>
                                          ))}
                                        </Vstack>
                                      </Card>
                                    )}
                                  </div>
                                  <Vstack
                                    align="start"
                                    className="w-full gap-3"
                                  >
                                    {song.credits.map((credit) => (
                                      <Card key={credit.id} className="w-full">
                                        <Vstack
                                          align="start"
                                          className="w-full gap-2"
                                        >
                                          <Hstack className="w-full gap-2">
                                            <Dropdown portal
                                              selectedValue={credit.role}
                                              onSelect={(value) =>
                                                setDraftSongs((prev) =>
                                                  prev.map((s) =>
                                                    s.id === song.id
                                                      ? {
                                                          ...s,
                                                          credits:
                                                            s.credits.map(
                                                              (cur) =>
                                                                cur.id ===
                                                                credit.id
                                                                  ? {
                                                                      ...cur,
                                                                      role:
                                                                        typeof value ===
                                                                        "string"
                                                                          ? value
                                                                          : "",
                                                                    }
                                                                  : cur,
                                                            ),
                                                        }
                                                      : s,
                                                  ),
                                                )
                                              }
                                              placeholder={uiText("AppStrings.Role")}
                                            >
                                              {TRACK_CREDIT_ROLE_OPTIONS.map(
                                                (role) => (
                                                  <Dropdown.Item
                                                    key={role}
                                                    value={role}
                                                  >
                                                    {translateSystemLabel(role, uiText)}
                                                  </Dropdown.Item>
                                                ),
                                              )}
                                            </Dropdown>
                                            <Button
                                              size="sm"
                                              icon="trash"
                                              color="red"
                                              onClick={() =>
                                                setDraftSongs((prev) =>
                                                  prev.map((s) =>
                                                    s.id === song.id
                                                      ? {
                                                          ...s,
                                                          credits:
                                                            s.credits.filter(
                                                              (cur) =>
                                                                cur.id !==
                                                                credit.id,
                                                            ),
                                                        }
                                                      : s,
                                                  ),
                                                )
                                              }
                                            />
                                          </Hstack>
                                          {!credit.userId && (
                                            <Input
                                              placeholder={uiText("AppStrings.SearchUsers")}
                                              value={
                                                artistQuery[credit.id] ?? ""
                                              }
                                              onValueChange={(value) => {
                                                setArtistQuery((prev) => ({
                                                  ...prev,
                                                  [credit.id]: value,
                                                }));
                                                doArtistSearch(
                                                  credit.id,
                                                  value,
                                                );
                                              }}
                                            />
                                          )}
                                          {!credit.userId &&
                                            (artistResults[credit.id]?.length ??
                                              0) > 0 && (
                                              <Card className="w-full">
                                                <Vstack align="stretch">
                                                  {artistResults[
                                                    credit.id
                                                  ]!.map((u) => (
                                                    <div
                                                      key={u.id}
                                                      className="flex cursor-pointer items-center justify-between rounded-lg p-3 transition-colors"
                                                      style={{
                                                        backgroundColor:
                                                          hoveredUserId === u.id
                                                            ? colors["base"]
                                                            : colors["mantle"],
                                                      }}
                                                      onMouseEnter={() =>
                                                        setHoveredUserId(u.id)
                                                      }
                                                      onMouseLeave={() =>
                                                        setHoveredUserId(null)
                                                      }
                                                      onClick={() => {
                                                        setDraftSongs((prev) =>
                                                          prev.map((s) =>
                                                            s.id === song.id
                                                              ? {
                                                                  ...s,
                                                                  credits:
                                                                    s.credits.map(
                                                                      (cur) =>
                                                                        cur.id ===
                                                                        credit.id
                                                                          ? {
                                                                              ...cur,
                                                                              userId:
                                                                                u.id,
                                                                              user: {
                                                                                id: u.id,
                                                                                name: u.name,
                                                                                slug: u.slug,
                                                                                profilePicture:
                                                                                  u.profilePicture,
                                                                                short:
                                                                                  u.short,
                                                                              },
                                                                            }
                                                                          : cur,
                                                                    ),
                                                                }
                                                              : s,
                                                          ),
                                                        );
                                                        setArtistQuery(
                                                          (prev) => ({
                                                            ...prev,
                                                            [credit.id]: "",
                                                          }),
                                                        );
                                                        setArtistResults(
                                                          (prev) => ({
                                                            ...prev,
                                                            [credit.id]: [],
                                                          }),
                                                        );
                                                      }}
                                                    >
                                                      <Hstack>
                                                        <Avatar
                                                          src={u.profilePicture}
                                                        />
                                                        <Vstack
                                                          gap={0}
                                                          align="start"
                                                        >
                                                          <Text>{u.name}</Text>
                                                          <Text
                                                            color="textFaded"
                                                            size="xs"
                                                          >
                                                            {u.short ||
                                                              "General.NoDescription"}
                                                          </Text>
                                                        </Vstack>
                                                      </Hstack>
                                                    </div>
                                                  ))}
                                                </Vstack>
                                              </Card>
                                            )}
                                          {credit.userId && (
                                            <Hstack className="items-center gap-2">
                                              <Avatar
                                                src={
                                                  credit.user?.profilePicture
                                                }
                                                size={24}
                                              />
                                              <Text size="sm" color="textFaded">
                                                {credit.user?.name ??
                                                  uiText("AppStrings.UserValue0", { value0: credit.userId })}
                                              </Text>
                                            </Hstack>
                                          )}
                                        </Vstack>
                                      </Card>
                                    ))}
                                  </Vstack>
                                  <div className="w-full">
                                    <Text color="text">{uiText("AppStrings.Song")}</Text>
                                    <Text color="textFaded" size="xs">
                                       {uiText("AppStrings.TheTrackItself")} </Text>
                                  </div>
                                  <Hstack className="items-center gap-2">
                                    <Button
                                      icon="upload"
                                      size="sm"
                                      onClick={async () => {
                                        const input =
                                          document.createElement("input");
                                        input.type = "file";
                                        input.accept = "audio/*";
                                        input.onchange = async (ev: Event) => {
                                          const file = (
                                            ev.target as HTMLInputElement
                                          )?.files?.[0];
                                          if (!file) return;
                                          const uploaded = await uploadTo(
                                            "music",
                                            file,
                                          );
                                          if (!uploaded) return;
                                          setDraftSongs((prev) =>
                                            prev.map((s) =>
                                              s.id === song.id
                                                ? {
                                                    ...s,
                                                    url: uploaded.url,
                                                    integratedLufs:
                                                      uploaded.integratedLufs,
                                                    truePeakDb:
                                                      uploaded.truePeakDb,
                                                    loudnessGainDb:
                                                      uploaded.loudnessGainDb,
                                                    name:
                                                      s.name ||
                                                      file.name.replace(
                                                        /\.[^/.]+$/,
                                                        "",
                                                      ),
                                                  }
                                                : s,
                                            ),
                                          );
                                          addToast({ title: uiText("AppStrings.SongReplaced") });
                                        };
                                        input.click();
                                      }}
                                    >
                                       {uiText("AppStrings.ReplaceAudio")} </Button>
                                  </Hstack>
                                </Vstack>);
      }}
    </ItemEditor>
                            );
                          })}
                        </Vstack>
                      )}

                      {/* Add song (upload) */}
                      <Button
                        icon="plus"
                        onClick={async () => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "audio/*";
                          input.onchange = async (ev: Event) => {
                            const file = (ev.target as HTMLInputElement)
                              ?.files?.[0];
                            if (!file) return;
                            const uploaded = await uploadTo("music", file);
                            if (!uploaded) return;
                            const baseName = file.name.replace(/\.[^/.]+$/, "");
                            const songId = Date.now();
                            setSongs((prev) => [
                              ...prev,
                              {
                                id: songId,
                                url: uploaded.url,
                                integratedLufs: uploaded.integratedLufs,
                                truePeakDb: uploaded.truePeakDb,
                                loudnessGainDb: uploaded.loudnessGainDb,
                                name: baseName,
                                slug: sanitizeSlug(baseName),
                                commentary: "",
                                tagIds: [],
                                flagIds: [],
                                bpm: null,
                                musicalKey: "",
                                softwareUsed: [],
                                license: "All rights reserved",
                                allowDownload: false,
                                allowBackgroundUse: false,
                                allowBackgroundUseAttribution: true,
                                licenseAttribution: false,
                                licenseCommercial: false,
                                licenseDerivatives: false,
                                licenseShareAlike: false,
                                links: [],
                                credits: [],
                              },
                            ]);
                            setSoftwareUsedDrafts((prev) => ({
                              ...prev,
                              [songId]: "",
                            }));
                            setNewSongId(songId);
                            addToast({ title: uiText("AppStrings.SongUploaded") });
                          };
                          input.click();
                        }}
                      >
                        CreateGame.Soundtrack.Add
                      </Button>
                    </Vstack>
              </Vstack>
            </Tab>
            <Tab title={uiText("CreateGame.Leaderboards.Title")} icon="trophy">
              <Vstack align="stretch">
                <div className="game-editor-panel-heading">
                  <Vstack align="start">
                    <Hstack>
                      <Icon name="trophy" color="text" size={28} />
                      <Text size="2xl" color="text" weight="bold">
                         {uiText("CreateGame.Leaderboards.Title")} </Text>
                    </Hstack>
                    <Text size="sm" color="textFaded">
                      CreateGame.Leaderboards.Description
                    </Text>
                  </Vstack>
                </div>
                <div className="pt-4">
                    <LeaderboardManager value={leaderboards} onChange={setLeaderboards} />
                </div>
              </Vstack>
            </Tab>
            <Tab title={uiText("CreateGame.Achievements.Title")} icon="award">
              <Vstack align="stretch">
                <div className="game-editor-panel-heading">
                  <Vstack align="start">
                    <Hstack>
                      <Icon name="award" color="text" size={28} />
                      <Text size="2xl" color="text" weight="bold">{uiText("CreateGame.Achievements.Title")}</Text>
                    </Hstack>
                    <Text size="sm" color="textFaded">CreateGame.Achievements.Description</Text>
                  </Vstack>
                </div>
                    <Vstack align="start" className="pt-4">
                      {achievements.length > 0 && (
                        <Vstack className="w-full gap-3" align="stretch">
                          {achievements.map((a, idx) => (
                            <ItemEditor key={a.id < 0 ? idx : a.id} item={a} title={a.name || uiText("AppStrings.Achievement")}
      initiallyOpen={newAchievementIndex === idx}
      discardNewOnCancel={newAchievementIndex === idx}
      onClose={() => setNewAchievementIndex(null)}
      onApply={draft => setAchievements(prev => prev.map((item, index) => index === idx ? draft : item))}
      onRemove={() => setAchievements(prev => prev.filter((_, index) => index !== idx))}
      summary={<div className="flex items-center gap-3">{a.image ? <img src={a.image} alt="" className="h-10 w-10 rounded object-cover" /> : <Icon name="award" />}<div><p className="text-sm font-semibold">{a.name || uiText("AppStrings.UntitledAchievement")}</p><p className="line-clamp-2 text-xs" style={{ color: colors.textFaded }}>{a.description || uiText("AppStrings.NoDescriptionYet")}</p></div></div>}
      preview={draft => <div className="flex items-center gap-4">{draft.image ? <img src={draft.image} alt="" className="h-16 w-16 rounded object-cover" /> : <Icon name="award" size={40} />}<div><p className="font-semibold">{draft.name || uiText("AppStrings.UntitledAchievement")}</p><p className="text-sm" style={{ color: colors.textFaded }}>{draft.description || uiText("AppStrings.DescribeHowPlayersEarnThisAchievement")}</p></div></div>}>
      {(a, setDraft) => {
        const setDraftAchievements: typeof setAchievements = next => setDraft(current => {
          const items = achievements.map((item, index) => index === idx ? current : item);
          return (typeof next === "function" ? next(items) : next)[idx] ?? current;
        });
        return (<Vstack align="start" className="gap-3">


                                <div className="w-full">
                                  <Text color="text">{uiText("Settings.Name.Title")}</Text>
                                  <Text color="textFaded" size="xs">
                                     {uiText("AppStrings.TheNameOfTheAchievement")} </Text>
                                </div>
                                <Input
                                  placeholder={uiText("AppStrings.EnterAchievementName")}
                                  value={a.name ?? ""}
                                  onValueChange={(val) =>
                                    setDraftAchievements((prev) => {
                                      const copy = [...prev];
                                      copy[idx] = { ...copy[idx], name: val };
                                      return copy;
                                    })
                                  }
                                />

                                <div className="w-full">
                                  <Text color="text">{uiText("AppStrings.Description")}</Text>
                                  <Text color="textFaded" size="xs">
                                     {uiText("AppStrings.ADescriptionOfTheAchievementWhatThePlayer")} </Text>
                                </div>
                                <Textarea
                                  placeholder={uiText("AppStrings.EnterDescription")}
                                  value={a.description ?? ""}
                                  onValueChange={(val) =>
                                    setDraftAchievements((prev) => {
                                      const copy = [...prev];
                                      copy[idx] = {
                                        ...copy[idx],
                                        description: val,
                                      };
                                      return copy;
                                    })
                                  }
                                />

                                <div className="w-full">
                                  <Text color="text">{uiText("Markdown.Image.Title")}</Text>
                                  <Text color="textFaded" size="xs">
                                     {uiText("AppStrings.AnImageCorrespondingToTheAchievement")} </Text>
                                </div>
                                <Hstack className="items-center gap-3">
                                  <ImageInput
                                    value={a.image}
                                    width={80}
                                    height={80}
                                    placeholder={uiText("AppStrings.UploadImage")}
                                    onSelect={async (file, crop) => {
                                      const url = await uploadTo(
                                        "image",
                                        file,
                                        crop,
                                      );
                                      if (!url) return;
                                      setDraftAchievements((prev) => {
                                        const copy = [...prev];
                                        copy[idx] = {
                                          ...copy[idx],
                                          image: url,
                                        };
                                        return copy;
                                      });
                                    }}
                                  />
                                  {a.image && (
                                    <Button
                                      icon="trash"
                                      color="red"
                                      onClick={() =>
                                        setDraftAchievements((prev) => {
                                          const copy = [...prev];
                                          copy[idx] = {
                                            ...copy[idx],
                                            image: "",
                                          };
                                          return copy;
                                        })
                                      }
                                    >
                                       {uiText("AppStrings.RemoveImage2")} </Button>
                                  )}
                                </Hstack>
                              </Vstack>);
      }}
    </ItemEditor>
                          ))}
                        </Vstack>
                      )}

                      <Button
                        icon="plus"
                        onClick={() => { setNewAchievementIndex(achievements.length);
                          setAchievements((prev) => [
                            ...prev,
                            {
                              id: -1,
                              name: "",
                              description: "",
                              image: "",
                            } as AchievementType,
                          ]); }}
                      >
                        CreateGame.Achievements.Add
                      </Button>
                    </Vstack>
              </Vstack>
            </Tab>
          </Tabs>
          <EditorFooter
            floating={hasUnsavedChanges}
            status={hasUnsavedChanges ? uiText("AppStrings.UnsavedChanges") : game?.published ? uiText("AppStrings.PublishedGame") : uiText("AppStrings.GameDraft")}
            description={waitingPost ? uiText("AppStrings.SavingYourGame") : hasUnsavedChanges ? uiText("AppStrings.SaveYourChangesBeforeLeavingThisPage") : game?.published ? uiText("AppStrings.YourGameIsLiveYouCanKeepUpdatingItHere") : uiText("AppStrings.YourGameIsCurrentlyNotPublished")}
          >
            {waitingPost ? (
              <Spinner />
            ) : (
              <Button variant="ghost" size="sm" icon="save" style={{ color: colors.blue }} type="submit" name="action" value="save">
                {prevSlug
                  ? "CreateGame.Update.Title"
                  : "CreateGame.Create.Title"}
              </Button>
            )}
            {(!game || !game.published) &&
              canManagePublication &&
              (waitingPost ? (
                <Spinner />
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  icon="upload"
                  style={{ color: colors.green }}
                  type="submit"
                  name="action"
                  value="publish"
                >
                  {prevSlug ? "CreateGame.Publish" : "CreateGame.CreatePublish"}
                </Button>
              ))}
            {game &&
              game.published &&
              canManagePublication &&
              !isPostJamLockedPhase &&
              (waitingPost ? (
                <Spinner />
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  icon="download"
                  style={{ color: colors.red }}
                  type="submit"
                  name="action"
                  value="unpublish"
                >
                  CreateGame.Unpublish
                </Button>
              ))}
          </EditorFooter>
        </Vstack>
      </Form>
      <div className="p-2" />
    </Vstack>
  );
}
