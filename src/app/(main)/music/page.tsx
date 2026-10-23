import { isPostJamPhase, postJamFirst } from "@/helpers/listingPageVersion";
import { translateSystemLabel } from "@/helpers/systemLabels";
import { isOwnTrack } from "@/helpers/isOwnTrack";
"use client";

import { useTranslations } from "@/compat/next-intl";

import type { CSSProperties } from "react";
import { ChevronDown, Music, Play, Pause, LoaderCircle, ListOrdered, Shuffle } from "lucide-react";
import SidebarSong from "@/components/sidebar/SidebarSong";
import { useMusic } from "bioloom-miniplayer";
import { postTrackRating } from "@/requests/rating";
import { Button, Hstack, Vstack } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { Dropdown } from "bioloom-ui";
import { useTheme } from "@/providers/useSiteTheme";
import { getTrackLicense, TRACK_LICENSES } from "@/helpers/trackLicense";
import { TrackType } from "@/types/TrackType";
import { GameSort } from "@/types/GameSort";
import { ListingPageVersion } from "@/types/GameType";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "@/compat/next-navigation";
import { useCurrentJam, useJams, useSelf, useTracks } from "@/hooks/queries";
import { ListingSkeleton, TrackCountSkeleton } from "@/components/listing-loading";
import { IconName } from "bioloom-ui";
import {
  getTrackRatingCategories,
  getTrackTags,
} from "@/requests/track";
import { TrackTagType } from "@/types/TrackTagType";
import { TrackRatingCategoryType } from "@/types/TrackRatingCategoryType";
import { useEffectiveHideRatings } from "@/hooks/useEffectiveHideRatings";
import { addToast } from "bioloom-ui";
import { navigateToSearchIfChanged } from "@/helpers/navigation";
import {
  emitTrackRatingSync,
  subscribeToTrackRatingSync,
} from "@/helpers/trackRatingSync";
import {
  getDefaultListingPageVersion,
  listingPageVersionOptions,
} from "@/helpers/listingPageVersion";
import { shouldShowJamInContentListings } from "@/helpers/jamListingOptions";
import TagLabel from "@/components/tags/TagLabel";
import { readArray } from "@/requests/helpers";
import { getJamUrlValue, resolveJamUrlValue } from "@/helpers/jamUrl";
import LicenseMark from "@/components/tracks/LicenseMark";

type JamOption = {
  id: string;
  slug?: string | null;
  name: string;
  icon?: IconName;
  description?: string;
};

const MORE_FILTERS = {
  downloadable: "downloadable",
  backgroundSafe: "backgroundSafe",
  moveOwnMusicToEnd: "moveOwnMusicToEnd",
  moveRatedMusicToEnd: "moveRatedMusicToEnd",
} as const;

const DEFAULT_MORE_FILTERS = new Set<string>([
  MORE_FILTERS.moveOwnMusicToEnd,
  MORE_FILTERS.moveRatedMusicToEnd,
]);
const EMPTY_MORE_FILTERS_PARAM = "none";

function loopingIconForLabel(label: string): IconName {
  const normalized = label.toLowerCase();
  if (normalized.includes("does not loop")) return "refreshcwoff";
  if (normalized.includes("loop")) return "repeat";
  return "infinity";
}

function parseMultiValueParam(value: string | null): Set<string> {
  if (!value) return new Set();
  return new Set(
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

function serializeMultiValueParam(values: Set<string>): string {
  return Array.from(values).sort().join(",");
}

function getInitialMoreFilters(value: string | null): Set<string> {
  if (!value) {
    return new Set(DEFAULT_MORE_FILTERS);
  }

  if (value === EMPTY_MORE_FILTERS_PARAM) {
    return new Set();
  }

  const parsed = parseMultiValueParam(value);
  return parsed.size > 0 ? parsed : new Set();
}

function serializeMoreFiltersParam(values: Set<string>): string {
  if (values.size === 0) {
    return EMPTY_MORE_FILTERS_PARAM;
  }

  return serializeMultiValueParam(values);
}

function formatJamWindow(
  startISO?: string,
  jammingHours?: number,
): string | undefined {
  if (!startISO || !jammingHours || Number.isNaN(Number(jammingHours)))
    return undefined;

  const start = new Date(startISO);
  if (isNaN(start.getTime())) return undefined;

  const end = new Date(start.getTime() + Number(jammingHours) * 60 * 60 * 1000);

  const dFmt = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (sameDay) {
    return `${dFmt.format(start)}`;
  }
  return `${dFmt.format(start)} – ${dFmt.format(end)}`;
}

function getDefaultMusicSort(
  _selectedJamId: string,
  _currentJamId: string | null | undefined,
  _currentPhase: string | null | undefined,
  _pageVersion: ListingPageVersion = "ALL",
): GameSort {
  return "recommended";
}

function canUseScoreSort(
  selectedJamId: string,
  currentJamId: string | null | undefined,
  currentPhase: string | null | undefined,
  pageVersion: ListingPageVersion,
): boolean {
  return !(
    !!currentJamId &&
    selectedJamId === currentJamId &&
    currentPhase === "Post-Jam Rating" &&
    pageVersion === "POST_JAM"
  );
}

function getDefaultMusicMoreFilters(
  selectedJamId: string,
  currentJamId: string | null | undefined,
  currentPhase: string | null | undefined,
): Set<string> {
  const isCurrentJam = !!currentJamId && selectedJamId === currentJamId;
  const isActiveJamBehavior =
    isCurrentJam &&
    (currentPhase === "Jamming" ||
      currentPhase === "Submission" ||
      currentPhase === "Rating");

  if (isCurrentJam && isPostJamPhase(currentPhase)) return new Set(["postJamFirst"]);
  return isActiveJamBehavior ? new Set(DEFAULT_MORE_FILTERS) : new Set();
}

export default function MusicPage() {
  const { playItem, shuffle, playbackScope, current, isPlaying, toggle } = useMusic();
  const [startingPlayback, setStartingPlayback] = useState(false);
  const [playAllMenuOpen, setPlayAllMenuOpen] = useState(false);
  const playAllButton = useRef<HTMLButtonElement>(null);
  const [playAllPressed, setPlayAllPressed] = useState(false);
  useEffect(() => {
    if (!playAllPressed) return;
    const release = () => setPlayAllPressed(false);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
    };
  }, [playAllPressed]);
  const t = useTranslations();
  const { colors, siteTheme } = useTheme();
  const headerTextColor = "text";
  const router = useRouter();
  const { data: currentJamData, isPending: currentJamPending } = useCurrentJam();
  const { data: allJams } = useJams();
  const restrictedSorts = useMemo(
    () =>
      new Set<GameSort>([
        "karma",
        "leastratings",
        "danger",
        "ratingbalance",
      ]),
    [],
  );

  const { data: user } = useSelf();
  const [allTrackTags, setAllTrackTags] = useState<TrackTagType[]>([]);
  const [trackSelectedStars, setTrackSelectedStars] = useState<
    Record<number, number>
  >({});
  const [trackOverallCategory, setTrackOverallCategory] =
    useState<TrackRatingCategoryType | null>(null);
  const effectiveHideRatings = useEffectiveHideRatings(user);
  const [jamDetecting, setJamDetecting] = useState<boolean>(true);
  const currentJamId = currentJamData?.jam?.id?.toString() ?? null;
  const currentJamValue = getJamUrlValue(currentJamData?.jam) || null;
  const activeJamPhase = currentJamData?.phase ?? null;
  const jamOptions = useMemo<JamOption[]>(() => {
    const options: JamOption[] = [{ id: "all", name: t("AppStrings.AllJams") }];
    let hasExternalJams = false;
    const jams = [currentJamData?.jam, ...(allJams ?? [])];
    jams.forEach((jam) => {
      if (!jam) return;
      if (jam.sourcePlatform) {
        hasExternalJams = true;
        return;
      }
      const value = getJamUrlValue(jam);
      if (!value || !shouldShowJamInContentListings(jam, activeJamPhase, currentJamId) ||
          options.some((option) => option.id === value)) return;
      options.push({
        id: value,
        slug: jam.slug,
        name: jam.name || t("AppStrings.CurrentJam"),
        icon: jam.icon,
        description: formatJamWindow(jam.startTime, jam.jammingHours),
      });
    });
    if (hasExternalJams) {
      options.push({
        id: "external",
        name: t("AppStrings.ExternalJams"),
        icon: "globe",
        description: t("AppStrings.BrowseEntriesFromImportedJams"),
      });
    }
    return options;
  }, [currentJamData, allJams, activeJamPhase, currentJamId, t]);

  const hasAppliedDefault = useRef(false);
  const hasUserSelected = useRef(false);
  const sortParam = useMemo(() => {
    if (typeof window === "undefined") return "recommended";
    const value = new URLSearchParams(window.location.search).get("sort");
    return value === "score" ? "recommended" : value ?? "recommended";
  }, []);
  const [sort, setSort] = useState<GameSort>(
    ["recommended", "karma", "random", "leastratings", "danger", "ratingbalance"].includes(sortParam)
      ? sortParam as GameSort : "recommended",
  );

  const initialJamParam = useMemo(() => {
    if (typeof window === "undefined") return "all";
    const p = new URLSearchParams(window.location.search).get("jam");
    return p ?? "all";
  }, []);
  const hasMoreParam = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).has("more");
  }, []);
  const initialPageVersionParam = useMemo(() => {
    if (typeof window === "undefined") return "ALL" as ListingPageVersion;
    const value = new URLSearchParams(window.location.search).get("pageVersion");
    return value === "JAM" || value === "POST_JAM" || value === "ALL"
      ? (value as ListingPageVersion)
      : ("ALL" as ListingPageVersion);
  }, []);
  const hasPageVersionParam = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).has("pageVersion");
  }, []);

  const [jamId, setJamId] = useState<string>(initialJamParam);
  const [pageVersion, setPageVersion] =
    useState<ListingPageVersion>(initialPageVersionParam);
  const initialGenresParam = useMemo(
    () =>
      typeof window === "undefined"
        ? new Set<string>()
        : parseMultiValueParam(
            new URLSearchParams(window.location.search).get("genres"),
          ),
    [],
  );
  const [selectedGenres, setSelectedGenres] =
    useState<Set<string>>(initialGenresParam);
  const initialMoodsParam = useMemo(
    () =>
      typeof window === "undefined"
        ? new Set<string>()
        : parseMultiValueParam(
            new URLSearchParams(window.location.search).get("moods"),
          ),
    [],
  );
  const [selectedMoods, setSelectedMoods] =
    useState<Set<string>>(initialMoodsParam);
  const initialUseCasesParam = useMemo(
    () =>
      typeof window === "undefined"
        ? new Set<string>()
        : parseMultiValueParam(
            new URLSearchParams(window.location.search).get("useCases"),
          ),
    [],
  );
  const [selectedUseCases, setSelectedUseCases] =
    useState<Set<string>>(initialUseCasesParam);
  const initialLicensesParam = useMemo(
    () =>
      typeof window === "undefined"
        ? new Set<string>()
        : parseMultiValueParam(
            new URLSearchParams(window.location.search).get("licenses"),
          ),
    [],
  );
  const [selectedLicenses, setSelectedLicenses] =
    useState<Set<string>>(initialLicensesParam);
  const initialLoopingParam = useMemo(() => {
    if (typeof window === "undefined") return "all";
    return new URLSearchParams(window.location.search).get("looping") ?? "all";
  }, []);
  const [selectedLooping, setSelectedLooping] =
    useState<string>(initialLoopingParam);
  const initialMoreParam = useMemo(
    () =>
      typeof window === "undefined"
        ? new Set<string>(DEFAULT_MORE_FILTERS)
        : getInitialMoreFilters(
            new URLSearchParams(window.location.search).get("more"),
          ),
    [],
  );
  const [selectedMoreFilters, setSelectedMoreFilters] =
    useState<Set<string>>(initialMoreParam);

  const updateQueryParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(window.location.search);
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      navigateToSearchIfChanged(router, params);
    },
    [router],
  );

  const updateMultiQueryParam = useCallback(
    (key: string, values: Set<string>) => {
      const params = new URLSearchParams(window.location.search);
      const serialized = serializeMultiValueParam(values);
      if (serialized) {
        params.set(key, serialized);
      } else {
        params.delete(key);
      }
      navigateToSearchIfChanged(router, params);
    },
    [router],
  );

  const updateMoreQueryParam = useCallback(
    (values: Set<string>) => {
      const params = new URLSearchParams(window.location.search);
      params.set("more", serializeMoreFiltersParam(values));
      navigateToSearchIfChanged(router, params);
    },
    [router],
  );

  useEffect(() => {
    if (jamDetecting || !allJams || jamId === "all") return;
    if (jamOptions.some((option) => option.id === jamId)) return;

    const resolved = resolveJamUrlValue(jamId, jamOptions);
    setJamId(resolved);
    updateQueryParam("jam", resolved);
  }, [jamDetecting, allJams, jamId, jamOptions, updateQueryParam]);

  useEffect(() => {
    if (currentJamPending) return;
    const isCurrentJamDefaultPhase = [
      "Rating", "Submission", "Jamming", "Post-Jam Refinement", "Post-Jam Rating",
    ].includes(activeJamPhase ?? "");
    if (
      !hasAppliedDefault.current && !hasUserSelected.current &&
      isCurrentJamDefaultPhase && currentJamValue &&
      shouldShowJamInContentListings(currentJamData?.jam, activeJamPhase, currentJamId) &&
      (initialJamParam === "all" || !initialJamParam)
    ) {
      hasAppliedDefault.current = true;
      setJamId(currentJamValue);
      const params = new URLSearchParams(window.location.search);
      params.set("jam", currentJamValue);
      navigateToSearchIfChanged(router, params, "replace");
    }
    setJamDetecting(false);
  }, [router, initialJamParam, currentJamData, currentJamPending, activeJamPhase, currentJamId, currentJamValue]);

  useEffect(() => {
    if (jamDetecting || jamOptions.length === 0) return;

    const resolved = resolveJamUrlValue(initialJamParam, jamOptions);
    if (resolved === "all" || resolved === initialJamParam) return;

    setJamId(resolved);
    const params = new URLSearchParams(window.location.search);
    params.set("jam", resolved);
    navigateToSearchIfChanged(router, params, "replace");
  }, [initialJamParam, jamDetecting, jamOptions, router]);

  const recommendationBalancesRatings =
    (pageVersion !== "POST_JAM" && ["Jamming", "Submission", "Rating"].includes(activeJamPhase ?? "")) ||
    (pageVersion !== "JAM" && activeJamPhase === "Post-Jam Rating");
  const canUseRestrictedSorts = Boolean(currentJamValue) && jamId === currentJamValue && recommendationBalancesRatings;
  const isRestricted = useCallback(
    (value: GameSort) => restrictedSorts.has(value),
    [restrictedSorts],
  );
  const canUseScore = useMemo(
    () => canUseScoreSort(jamId, currentJamValue, activeJamPhase, pageVersion),
    [activeJamPhase, currentJamValue, jamId, pageVersion],
  );

  const sorts: Record<
    GameSort,
    { name: string; icon: IconName; description: string }
  > = {
    score: {
      name: t("LeaderboardType.Score.Title"),
      icon: "star",
      description:
        t("AppStrings.SortsByOverallStarScorePullingLowRating"),
    },
    recommended: {
      name: t("AppStrings.Recommended"),
      icon: "thumbsup",
      description:
        (canUseRestrictedSorts ? t("AppStrings.LikeKarmaButGivesASmallBoostTo2") : "Scores and community recommendations"),
    },
    karma: {
      name: t("AppStrings.Karma"),
      icon: "sparkles",
      description:
        t("AppStrings.ShowsTracksFromPeopleWhoAreRatingAnd"),
    },
    random: {
      name: t("GameSort.Random.Title"),
      icon: "dice3",
      description: t("AppStrings.RandomizesTheTrackList"),
    },
    leastratings: {
      name: t("GameSort.LeastRatings.Title"),
      icon: "chevronsdown",
      description: t("AppStrings.ShowsTracksWithTheFewestRatingsFirst"),
    },
    danger: {
      name: t("GameSort.Danger.Title"),
      icon: "circlealert",
      description: t("AppStrings.ShowsTracksThatStillNeedMoreRatingsTo"),
    },
    ratingbalance: {
      name: t("AppStrings.RatingBalance"),
      icon: "scale",
      description: t("AppStrings.SortsByRatingsGivenMinusRatingsGotten"),
    },
  };

  useEffect(() => {
    if (jamDetecting) return;
    if ((!canUseRestrictedSorts && isRestricted(sort)) || (sort === "score" && !canUseScore)) {
      const nextSort = getDefaultMusicSort(
        jamId,
        currentJamValue,
        activeJamPhase,
        pageVersion,
      );
      setSort(nextSort);
      updateQueryParam("sort", nextSort);
    }
  }, [
    activeJamPhase,
    canUseRestrictedSorts,
    currentJamValue,
    isRestricted,
    jamId,
    jamDetecting,
    pageVersion,
    sort,
    updateQueryParam,
    canUseScore,
  ]);

  useEffect(() => {
    if (jamDetecting) return;
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("sort")) return;

    const nextSort = getDefaultMusicSort(
      jamId,
      currentJamValue,
      activeJamPhase,
      pageVersion,
    );
    if (sort !== nextSort) {
      setSort(nextSort);
    }
  }, [activeJamPhase, currentJamValue, jamDetecting, jamId, pageVersion, sort]);

  useEffect(() => {
    if (jamDetecting) return;
    if (hasMoreParam) return;

    setSelectedMoreFilters(
      getDefaultMusicMoreFilters(jamId, currentJamValue, activeJamPhase),
    );
  }, [activeJamPhase, currentJamValue, hasMoreParam, jamDetecting, jamId]);

  useEffect(() => {
    if (jamDetecting) return;
    if (hasPageVersionParam) return;

    setPageVersion(
      getDefaultListingPageVersion(jamId, currentJamValue, activeJamPhase),
    );
  }, [
    activeJamPhase,
    currentJamValue,
    hasPageVersionParam,
    jamDetecting,
    jamId,
  ]);

  useEffect(() => {
    let cancelled = false;
    // Each section can appear as soon as its own request completes.
    void getTrackTags().then(async (response) => {
      if (!response.ok) return;
      const tags = await readArray<TrackTagType>(response);
      if (!cancelled) setAllTrackTags(tags);
    }).catch(() => {});
    void getTrackRatingCategories().then(async (response) => {
      if (!response.ok) return;
      const categories = await readArray<TrackRatingCategoryType>(response);
      if (!cancelled) {
        setTrackOverallCategory(categories.find((category) => category.name === "Overall") ?? null);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const ratings: Record<number, number> = {};
    user?.trackRatings?.forEach((rating) => {
      ratings[rating.trackId] = rating.value;
    });
    setTrackSelectedStars(ratings);
  }, [user]);

  useEffect(() => {
    return subscribeToTrackRatingSync(({ trackId, value }) => {
      setTrackSelectedStars((prev) => ({
        ...prev,
        [trackId]: value,
      }));
    });
  }, []);

  const { data: loadedMusic, isLoading: musicLoading, isError: musicError, refetch: refetchMusic } = useTracks(
    sort, jamId, pageVersion, !jamDetecting,
  );
  const music = useMemo(() => loadedMusic ?? [], [loadedMusic]);
  const initialLoading = !loadedMusic && (jamDetecting || musicLoading);

  const tagsByCategory = useMemo(() => {
    const grouped = new Map<string, TrackTagType[]>();
    allTrackTags.forEach((tag) => {
      const key = tag.category?.name;
      if (!key) return;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(tag);
    });
    return grouped;
  }, [allTrackTags]);

  const availableTagIds = useMemo(() => {
    return new Set(
      music.flatMap((track) => (track.tags ?? []).map((tag) => String(tag.id))),
    );
  }, [music]);

  const visibleTagsByCategory = useMemo(() => {
    const grouped = new Map<string, TrackTagType[]>();

    tagsByCategory.forEach((tags, categoryName) => {
      const visibleTags = tags.filter((tag) =>
        availableTagIds.has(String(tag.id)),
      );
      if (visibleTags.length > 0) {
        grouped.set(categoryName, visibleTags);
      }
    });

    return grouped;
  }, [availableTagIds, tagsByCategory]);

  const availableLicenses = useMemo(() => {
    return Array.from(
      new Set(
        music
          .map((track) => track.license?.trim())
          .filter((license): license is string => Boolean(license)),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [music]);

  const displayedMusic = useMemo(() => {
    const filteredMusic = music.filter((track) => {
      const tagIds = new Set((track.tags ?? []).map((tag) => String(tag.id)));
      if (
        selectedGenres.size > 0 &&
        !Array.from(selectedGenres).some((id) => tagIds.has(id))
      ) {
        return false;
      }

      if (
        selectedMoods.size > 0 &&
        !Array.from(selectedMoods).some((id) => tagIds.has(id))
      ) {
        return false;
      }

      if (
        selectedUseCases.size > 0 &&
        !Array.from(selectedUseCases).some((id) => tagIds.has(id))
      ) {
        return false;
      }
      if (selectedLooping !== "all" && !tagIds.has(selectedLooping)) {
        return false;
      }
      if (
        selectedLicenses.size > 0 &&
        !selectedLicenses.has(track.license?.trim() ?? "")
      ) {
        return false;
      }
      if (
        selectedMoreFilters.has(MORE_FILTERS.downloadable) &&
        !track.allowDownload
      ) {
        return false;
      }
      if (
        selectedMoreFilters.has(MORE_FILTERS.backgroundSafe) &&
        !track.allowBackgroundUse
      ) {
        return false;
      }
      return true;
    });

    const moveOwnMusicToEnd = selectedMoreFilters.has(
      MORE_FILTERS.moveOwnMusicToEnd,
    );
    const moveRatedMusicToEnd =
      (sort !== "score" && (sort !== "recommended" || canUseRestrictedSorts)) &&
      selectedMoreFilters.has(MORE_FILTERS.moveRatedMusicToEnd);
    const shouldMoveOwnMusicToEnd =
      (sort !== "score" && (sort !== "recommended" || canUseRestrictedSorts)) && moveOwnMusicToEnd;

    if (!user || (!shouldMoveOwnMusicToEnd && !moveRatedMusicToEnd)) {
      return postJamFirst(filteredMusic, selectedMoreFilters.has("postJamFirst"));
    }

    const regularUnratedTracks: TrackType[] = [];
    const ownTracks: TrackType[] = [];
    const regularRatedTracks: TrackType[] = [];

    filteredMusic.forEach((track) => {
      const isOwnMusic = isOwnTrack(track, user);
      const hasRatedTrack = Boolean(
        (track.sourceTrackId ?? track.id) &&
          (trackSelectedStars[track.sourceTrackId ?? track.id] ?? 0) > 0,
      );

      if (shouldMoveOwnMusicToEnd && isOwnMusic) {
        ownTracks.push(track);
        return;
      }

      if (moveRatedMusicToEnd && hasRatedTrack) {
        regularRatedTracks.push(track);
        return;
      }

      regularUnratedTracks.push(track);
    });

    if (shouldMoveOwnMusicToEnd && moveRatedMusicToEnd) {
      return postJamFirst([...regularUnratedTracks, ...ownTracks, ...regularRatedTracks], selectedMoreFilters.has("postJamFirst"));
    }

    if (shouldMoveOwnMusicToEnd) {
      return postJamFirst([...regularUnratedTracks, ...ownTracks], selectedMoreFilters.has("postJamFirst"));
    }

    return postJamFirst([...regularUnratedTracks, ...regularRatedTracks], selectedMoreFilters.has("postJamFirst"));
  }, [
    music,
    canUseRestrictedSorts,
    selectedGenres,
    selectedLicenses,
    selectedLooping,
    selectedMoreFilters,
    selectedMoods,
    sort,
    selectedUseCases,
    trackSelectedStars,
    user,
  ]);

  const musicQueue = useMemo(
    () =>
      displayedMusic.map((track) => ({
        ...track,
        composer: track.composer ?? {
          id: 0,
          slug: "",
          name:
            track.externalAuthorName || t("AppStrings.UnknownComposer"),
        },
      })),
    [displayedMusic, t],
  );

  const selectJam = (key: unknown) => {
            hasUserSelected.current = true;
            const val = key as string;
            setJamId(val);
            if (!hasPageVersionParam) {
              setPageVersion(
                getDefaultListingPageVersion(val, currentJamValue, activeJamPhase),
              );
            }
            const nextSort = getDefaultMusicSort(
              val,
              currentJamValue,
              activeJamPhase,
              hasPageVersionParam
                ? pageVersion
                : getDefaultListingPageVersion(
                    val,
                    currentJamValue,
                    activeJamPhase,
                  ),
            );
            const effectiveNextPageVersion = hasPageVersionParam
              ? pageVersion
              : getDefaultListingPageVersion(
                  val,
                  currentJamValue,
                  activeJamPhase,
                );
            if (
              (!isRestricted(sort) && !(sort === "score" && !canUseScore)) ||
              (nextSort === "score" &&
                canUseScoreSort(
                  val,
                  currentJamValue,
                  activeJamPhase,
                  effectiveNextPageVersion,
                ))
            ) {
              setSort(nextSort);
              updateQueryParam("sort", nextSort);
            }
            updateQueryParam("jam", val);
  };
  const hasCurrentMusicJam = ["Jamming", "Submission", "Rating", "Post-Jam Refinement", "Post-Jam Rating"].includes(activeJamPhase ?? "");
  const latestListedJam = [currentJamData?.jam, ...(allJams ?? [])]
    .filter((jam) => jam && !jam.sourcePlatform && jamOptions.some((option) => option.id === getJamUrlValue(jam)))
    .sort((a, b) => new Date(b!.startTime).getTime() - new Date(a!.startTime).getTime())[0];
  const featuredJamValue = hasCurrentMusicJam && currentJamValue
    ? currentJamValue
    : getJamUrlValue(latestListedJam) || null;
  const selectedJamName = jamOptions.find((jam) => jam.id === jamId)?.name;

  const musicScope = JSON.stringify([
    "music", jamId, sort, pageVersion, selectedLooping,
    [...selectedGenres].sort(), [...selectedLicenses].sort(), [...selectedUseCases].sort(),
    [...selectedMoods].sort(), [...selectedMoreFilters].sort(),
  ]);
  const controlsPlayback = playbackScope === musicScope && Boolean(current?.song);
  const playAllLabel = controlsPlayback ? isPlaying ? "Pause" : "Resume" : "Play all";

  const playAll = async (shuffled = shuffle) => {

          const track = musicQueue[shuffled ? Math.floor(Math.random() * musicQueue.length) : 0];
          if (!track || startingPlayback) return;
          setStartingPlayback(true);
          try {
            await playItem({ id: track.id, slug: track.slug, name: track.name, artist: track.composer,
              thumbnail: track.game.soundtrackThumbnail || track.game.thumbnail || "", game: track.game,
              song: track.url, loudnessGainDb: track.loudnessGainDb, pageVersion: track.pageVersion,
              allowDownload: track.allowDownload, license: track.license, allowBackgroundUse: track.allowBackgroundUse,
              allowBackgroundUseAttribution: track.allowBackgroundUseAttribution }, musicQueue, { shuffle: shuffled, scope: musicScope });
          } catch {
            addToast({ title: "Could not play tracks." });
          } finally { setStartingPlayback(false); }
  };

  const filterTriggerClass = "!h-11 !overflow-visible !rounded-full !border-[color-mix(in_srgb,var(--music-text)_16%,transparent)] !py-0 !pl-4 !pr-0 !gap-3 !text-[var(--music-text)] [&>p]:!text-sm [&>p]:!font-semibold !bg-[linear-gradient(135deg,color-mix(in_srgb,var(--music-text)_7%,var(--music-surface)),color-mix(in_srgb,var(--music-text)_3%,var(--music-surface))_60%,color-mix(in_srgb,var(--music-text)_6%,var(--music-surface)))] !shadow-[inset_0_1px_0_#ffffff08,0_3px_8px_#0003] hover:!border-[color-mix(in_srgb,var(--music-text)_28%,transparent)] aria-expanded:!border-[color-mix(in_srgb,var(--music-text)_28%,transparent)] focus-visible:!outline-[var(--music-accent)]";
  const filterChevronClass = "relative -mr-1 ml-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[var(--music-accent)] [background:repeating-radial-gradient(circle,transparent_0_1px,#0003_1px_1.6px,transparent_1.6px_2.6px),conic-gradient(from_20deg,#333435,#161719_60deg,#393b3c_145deg,#202123_205deg,#101113_270deg,#333435)] shadow-[0_2px_4px_#0007,inset_0_0_0_1px_#ffffff18,inset_0_1px_1px_#ffffff15] before:absolute before:inset-[13px] before:rounded-full before:bg-[#101519] before:shadow-[inset_0_1px_2px_#0009] before:content-[''] [&>svg]:relative [&>svg]:z-10 [&>svg]:h-[18px] [&>svg]:w-[18px] [&>svg]:stroke-[3]";
  const filterMenuClass = "!rounded-[10px] !p-[5px] !shadow-[0_8px_24px_#0005] [&_[role=menuitem]]:!rounded-[4px] [&_[role=menuitem]]:!px-[10px] [&_[role=menuitem]]:!py-2 [&_[role=menuitem]]:!bg-transparent [&_[role=menuitem]]:!text-[var(--music-text)] [&_[role=menuitem]]:!transition-none [&_[role=menuitem]_*]:!transition-none [&_[role=menuitem]_p]:!text-[13px] [&_[role=menuitem]_p]:!leading-4 [&_[role=menuitem]_p]:!font-semibold [&_[role=menuitem]_svg]:!shrink-0 [&_[role=menuitem]_svg]:!h-4 [&_[role=menuitem]_svg]:!w-4 [&_[role=menuitem]:hover:not(:disabled)]:!bg-[var(--music-accent)] [&_[role=menuitem]:hover:not(:disabled)]:!text-[#101b27] [&_[role=menuitem]:focus-visible]:!bg-[var(--music-accent)] [&_[role=menuitem]:focus-visible]:!text-[#101b27]";

  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [jamMenuOpen, setJamMenuOpen] = useState(false);

  return (
    <Vstack align="stretch" className={"music-library-shell @container box-border rounded-[14px] w-full max-w-[1200px] m-[0_auto] p-[32px] gap-[18px]! [background:var(--music-surface)] text-[var(--music-text)] [box-shadow:-22px_0_34px_-18px_rgb(0_0_0_/_78%),22px_0_34px_-18px_rgb(0_0_0_/_78%)] max-[700px]:p-[20px_12px] max-[700px]:gap-[14px]! "} style={{ "--music-surface": colors.mantle, "--music-text": colors.text, "--music-muted": colors.textFaded, "--music-accent": colors.blue, "--music-line": colors.base } as CSSProperties}>
      <header className={"music-library-heading px-2 pt-4 pb-1 sm:px-3 sm:pt-5 sm:pb-1 [&_h1]:m-0 [&_h1]:text-[clamp(36px,4vw,52px)] [&_h1]:font-bold [&_h1]:leading-[1.15] [&_h1]:tracking-[-.035em] max-[700px]:[&_h1]:text-[36px]  flex flex-col items-start gap-2"}><h1 className="flex items-center gap-3"><Music aria-hidden="true" strokeWidth={3} className="h-[1em] w-[1em] shrink-0 text-inherit" />{t("Navbar.Music.Title")}</h1><p className="m-0 text-base text-[var(--music-muted)]">{t("AppStrings.AllTheMusicUploadedToTheSite")}</p></header>
      <nav className={"music-library-tabs flex gap-[28px] [scrollbar-width:thin] [border-bottom:1px_solid_color-mix(in_srgb,var(--music-text)_9%,transparent)] m-[0_0_6px] p-0 flex-wrap overflow-visible justify-between gap-x-[24px] gap-y-0 [&_button]:relative [&_button]:flex-none [&_button]:p-[12px_0] [&_button]:[border:0] [&_button]:bg-transparent [&_button]:text-[var(--music-muted)] [&_button]:text-[15px] [&_button]:font-semibold [&_button]:whitespace-nowrap [&_button]:cursor-[pointer] [&_button:is(:hover,[aria-current=page])]:text-[var(--music-accent)] [&_button[aria-current=page]::after]:[content:''] [&_button[aria-current=page]::after]:absolute [&_button[aria-current=page]::after]:left-0 [&_button[aria-current=page]::after]:right-0 [&_button[aria-current=page]::after]:bottom-0 [&_button[aria-current=page]::after]:h-[2px] [&_button[aria-current=page]::after]:[background:var(--music-accent)] [&_button:focus-visible]:[outline:2px_solid_var(--music-accent)] [&_button:focus-visible]:outline-offset-[2px] [&_.music-library-more-sorts]:flex [&_.music-library-more-sorts]:items-center [&_.music-library-more-sorts]:justify-center [&_.music-library-more-sorts]:min-w-[28px] [&_.music-library-more-sorts]:px-[6px] [&_.music-library-jam-picker]:flex [&_.music-library-jam-picker]:items-center [&_.music-library-jam-picker]:justify-center [&_.music-library-jam-picker]:min-w-[28px] [&_.music-library-jam-picker]:px-[6px] [&_button:disabled]:opacity-[.45] [&_button:disabled]:cursor-[default] "} aria-label="Music lists">
        <div className={"music-library-sort-tabs flex items-center gap-[22px] flex-wrap max-[700px]:gap-[16px] "}>
        {Object.entries(sorts).filter(([key]) => key !== "score" && key !== "karma" && key !== "ratingbalance" && key !== "danger" && !((isRestricted(key as GameSort) && !canUseRestrictedSorts) || (key === "score" && !canUseScore))).map(([key, value]) => <button key={key} type="button" aria-current={sort === key ? "page" : undefined} title={value.description} onClick={() => { setSort(key as GameSort); updateQueryParam("sort", key); }}>{value.name}</button>)}
        {canUseRestrictedSorts && (sort === "karma" || sort === "ratingbalance" || sort === "danger") && (
          <button type="button" aria-current="page" title={sorts[sort].description} onClick={() => updateQueryParam("sort", sort)}>
            {sorts[sort].name}
          </button>
        )}
        {canUseRestrictedSorts && (
          <Dropdown instant
          triggerClassName="!rounded-md"
            portal
            position="bottom-left"
            isOpen={sortMenuOpen}
            onOpenChange={setSortMenuOpen}
            selectedValue={sort}
            trigger={<button type="button" className={"music-library-more-sorts flex items-center gap-[6px] "} aria-label="More sorts" title="More sorts" aria-haspopup="menu" aria-expanded={sortMenuOpen}>
              <ChevronDown size={16} aria-hidden="true" className={`transition-transform duration-200 motion-reduce:transition-none ${sortMenuOpen ? "rotate-180" : ""}`} />
            </button>}
            onSelect={(key) => {
              setSort(key as GameSort);
              updateQueryParam("sort", key as string);
            }}
          >
            {(["danger", "karma", "ratingbalance"] as const).map((key) => (
              <Dropdown.Item key={key} value={key} icon={sorts[key].icon} description={sorts[key].description}>
                {sorts[key].name}
              </Dropdown.Item>
            ))}
          </Dropdown>
        )}
        </div>
        <div className={"music-library-jam-tabs flex items-center gap-[18px] ml-auto flex-wrap justify-end max-[700px]:gap-[14px] "}>
          <Dropdown instant portal position="bottom-right" selectedValue={jamId} onSelect={selectJam}
            isOpen={jamMenuOpen} onOpenChange={setJamMenuOpen}
            trigger={<button type="button" className="music-library-jam-picker" aria-label="Choose jam" title="Choose jam" aria-haspopup="menu" aria-expanded={jamMenuOpen}>
              <ChevronDown size={16} aria-hidden="true" className={`transition-transform duration-200 motion-reduce:transition-none ${jamMenuOpen ? "rotate-180" : ""}`} />
            </button>}
          >
          {jamOptions.filter((jam) => jam.id !== "all").map((j) => (
            <Dropdown.Item
              key={j.id}
              value={j.id}
              icon={j.icon || "gamepad2"}
              description={
                j.description ??
                (j.id === "all" ? t("AppStrings.BrowseMusicFromEveryJam") : undefined)
              }
            >
              {j.name}
            </Dropdown.Item>
          ))}
          </Dropdown>
          {jamId !== "all" && jamId !== featuredJamValue && selectedJamName && (
            <button type="button" aria-current="page" onClick={() => selectJam(jamId)}>
              {selectedJamName}
            </button>
          )}
          <button type="button" disabled={!featuredJamValue} title={jamOptions.find((jam) => jam.id === featuredJamValue)?.name} aria-current={jamId === featuredJamValue ? "page" : undefined} onClick={() => featuredJamValue && selectJam(featuredJamValue)}>
            {jamOptions.find((jam) => jam.id === featuredJamValue)?.name || t("AppStrings.CurrentJam")}
          </button>
          <button type="button" aria-current={jamId === "all" ? "page" : undefined} onClick={() => selectJam("all")}>{t("AppStrings.AllJams")}</button>
        </div>
      </nav>
      <div className={`flex flex-col ${advancedFiltersOpen ? "gap-y-[10px]" : "gap-y-0"} @min-[1100px]:grid @min-[1100px]:grid-cols-[repeat(3,max-content_max-content_12px)_minmax(max-content,1fr)] @min-[1100px]:items-center @min-[1100px]:gap-x-2 @min-[1100px]:[&_.music-library-filter]:contents @min-[1100px]:[&_.music-library-filter>div]:w-full @min-[1100px]:[&_.music-library-filter>div>div]:w-full @min-[1100px]:[&_.music-library-filter>div>div]:grid-cols-[minmax(max-content,1fr)]!`}>
      <div className={"music-library-filters @min-[1100px]:grid @min-[1100px]:col-span-10 @min-[1100px]:grid-cols-subgrid @min-[1100px]:gap-x-2 @min-[1100px]:[&>button]:col-start-10 @min-[1100px]:[&>button]:justify-self-end flex items-center justify-between flex-wrap gap-[14px_24px] w-full max-[700px]:justify-start max-[700px]:gap-[12px_20px]  relative z-30"}>
        <div className={"music-library-filter @min-[1100px]:[&>span]:col-start-1 @min-[1100px]:[&>div]:col-start-2 flex items-center gap-[10px] min-w-0 max-[700px]:flex-wrap max-[700px]:gap-[6px] "} role="group" aria-labelledby="music-filter-genres"><span id="music-filter-genres" className={"music-library-filter-label shrink-0 text-[var(--music-muted)] text-[13px] font-semibold "}>Genre:</span><Dropdown instant fitLongestOption matchTriggerWidth arrowToChevron triggerClassName={filterTriggerClass} triggerChevronClassName={filterChevronClass} className={filterMenuClass}
            sizingOptions={(tagsByCategory.get("Genre") ?? []).map(tag => ({ label: <TagLabel name={tag.name} fallback="music" /> }))}
            multiple
            multipleWithModifiers
            clearSelectionLabel={t("AppStrings.All")}
            selectedValues={selectedGenres}
            onSelectionChange={(values) => {
              const next = new Set(
                Array.from(values, (value) => String(value)),
              );
              setSelectedGenres(next);
              updateMultiQueryParam("genres", next);
            }}
            placeholder={t("AppStrings.All")}
          >
            {(visibleTagsByCategory.get("Genre") ?? []).map((tag) => (
              <Dropdown.Item key={tag.id} value={String(tag.id)}>
                <TagLabel name={tag.name} fallback="music" />
              </Dropdown.Item>
            ))}
          </Dropdown></div>
        <div className={"music-library-filter @min-[1100px]:[&>span]:col-start-4 @min-[1100px]:[&>div]:col-start-5 flex items-center gap-[10px] min-w-0 max-[700px]:flex-wrap max-[700px]:gap-[6px] "} role="group" aria-labelledby="music-filter-license"><span id="music-filter-license" className={"music-library-filter-label shrink-0 text-[var(--music-muted)] text-[13px] font-semibold "}>License:</span><Dropdown instant fitLongestOption matchTriggerWidth arrowToChevron triggerClassName={filterTriggerClass} triggerChevronClassName={filterChevronClass} className={filterMenuClass}
            sizingOptions={Object.keys(TRACK_LICENSES).map(license => ({
              label: <span className="flex items-center gap-2"><LicenseMark license={license} /><span>{getTrackLicense(license).label}</span></span>,
            }))}
            multiple
            multipleWithModifiers
            selectedValues={new Set([...selectedLicenses, ...(selectedMoreFilters.has(MORE_FILTERS.backgroundSafe) ? [MORE_FILTERS.backgroundSafe] : [])])}
            onSelectionChange={(values) => {
              const next = new Set(Array.from(values, String));
              const streamSafe = next.delete(MORE_FILTERS.backgroundSafe);
              const more = new Set(selectedMoreFilters);
              if (streamSafe) more.add(MORE_FILTERS.backgroundSafe);
              else more.delete(MORE_FILTERS.backgroundSafe);
              setSelectedLicenses(next);
              setSelectedMoreFilters(more);
              const params = new URLSearchParams(window.location.search);
              const licenses = serializeMultiValueParam(next);
              if (licenses) params.set("licenses", licenses);
              else params.delete("licenses");
              params.set("more", serializeMoreFiltersParam(more));
              navigateToSearchIfChanged(router, params);
            }}
            placeholder={t("AppStrings.All")}
          >
            <Dropdown.Item value={MORE_FILTERS.backgroundSafe} icon="broadcast">Stream safe</Dropdown.Item>
            <div role="separator" className="mx-2 my-1 h-px" style={{ backgroundColor: `color-mix(in srgb, ${colors.text} 9%, transparent)` }} />
            <Dropdown.ClearSelection>{t("AppStrings.All")}</Dropdown.ClearSelection>
            {availableLicenses.map((license) => (
              <Dropdown.Item key={license} value={license}>
                <span className="flex items-center gap-2">
                  <LicenseMark license={license} />
                  <span>{getTrackLicense(license).label}</span>
                </span>
              </Dropdown.Item>
            ))}
          </Dropdown></div>
        <div className={"music-library-filter @min-[1100px]:[&>span]:col-start-7 @min-[1100px]:[&>div]:col-start-8 flex items-center gap-[10px] min-w-0 max-[700px]:flex-wrap max-[700px]:gap-[6px] "} role="group" aria-labelledby="music-filter-mood"><span id="music-filter-mood" className={"music-library-filter-label shrink-0 text-[var(--music-muted)] text-[13px] font-semibold "}>Mood:</span><Dropdown instant fitLongestOption matchTriggerWidth arrowToChevron triggerClassName={filterTriggerClass} triggerChevronClassName={filterChevronClass} className={filterMenuClass}
            sizingOptions={(tagsByCategory.get("Mood") ?? []).map(tag => ({ label: <TagLabel name={tag.name} fallback="mood" /> }))}
            multiple
            multipleWithModifiers
            clearSelectionLabel={t("AppStrings.All")}
            selectedValues={selectedMoods}
            onSelectionChange={(values) => {
              const next = new Set(
                Array.from(values, (value) => String(value)),
              );
              setSelectedMoods(next);
              updateMultiQueryParam("moods", next);
            }}
            placeholder={t("AppStrings.All")}
          >
            {(visibleTagsByCategory.get("Mood") ?? []).map((tag) => (
              <Dropdown.Item key={tag.id} value={String(tag.id)}>
                <TagLabel name={tag.name} fallback="mood" />
              </Dropdown.Item>
            ))}
          </Dropdown></div>

        <Button variant="ghost" icon="settings2" aria-expanded={advancedFiltersOpen} aria-controls="music-advanced-filters" onClick={() => setAdvancedFiltersOpen(value => !value)}><span className="inline-grid text-left"><span className="[grid-area:1/1]">{advancedFiltersOpen ? "Collapse filters" : "Advanced filters"}</span><span aria-hidden="true" className="invisible [grid-area:1/1]">Advanced filters</span><span aria-hidden="true" className="invisible [grid-area:1/1]">Collapse filters</span></span></Button>
      </div>
      <div id="music-advanced-filters" aria-hidden={!advancedFiltersOpen} inert={!advancedFiltersOpen} className={`music-library-advanced flex items-center justify-between flex-wrap gap-[14px_24px] w-full max-[700px]:justify-start max-[700px]:gap-[12px_20px] relative z-20 @min-[1100px]:grid @min-[1100px]:col-span-10 @min-[1100px]:grid-cols-subgrid @min-[1100px]:gap-x-2 ${advancedFiltersOpen ? "" : "h-0 overflow-hidden invisible pointer-events-none"}`}>
        <div className={"music-library-filter @min-[1100px]:[&>span]:col-start-1 @min-[1100px]:[&>div]:col-start-2 flex items-center gap-[10px] min-w-0 max-[700px]:flex-wrap max-[700px]:gap-[6px] "} role="group" aria-labelledby="music-filter-version"><span id="music-filter-version" className={"music-library-filter-label shrink-0 text-[var(--music-muted)] text-[13px] font-semibold "}>Version:</span><Dropdown instant fitLongestOption matchTriggerWidth arrowToChevron triggerClassName={filterTriggerClass} triggerChevronClassName={filterChevronClass} className={filterMenuClass}
          selectedValue={pageVersion}
          onSelect={(key) => {
            const next = key as ListingPageVersion;
            setPageVersion(next);
            updateQueryParam("pageVersion", next === "ALL" ? "ALL" : next);
          }}
        >
          {listingPageVersionOptions.map((option) => (
            <Dropdown.Item
              key={option.value}
              value={option.value}
              icon={option.icon}
              description={t({ ALL: "AppStrings.ShowThePostJamVersionOfTheGame", JAM: "AppStrings.OnlyShowJamVersionsOfGames", POST_JAM: "AppStrings.OnlyShowPostJamVersionsOfGames" }[option.value])}
            >
              {t({ ALL: "AppStrings.AllVersions", JAM: "AppStrings.JamVersions", POST_JAM: "AppStrings.PostJamVersions" }[option.value])}
            </Dropdown.Item>
          ))}
        </Dropdown></div>

        <div className={"music-library-filter @min-[1100px]:[&>span]:col-start-4 @min-[1100px]:[&>div]:col-start-5 flex items-center gap-[10px] min-w-0 max-[700px]:flex-wrap max-[700px]:gap-[6px] "} role="group" aria-labelledby="music-filter-use-case"><span id="music-filter-use-case" className={"music-library-filter-label shrink-0 text-[var(--music-muted)] text-[13px] font-semibold "}>Use Case:</span><Dropdown instant fitLongestOption matchTriggerWidth arrowToChevron triggerClassName={filterTriggerClass} triggerChevronClassName={filterChevronClass} className={filterMenuClass}
            sizingOptions={(tagsByCategory.get("Use Case") ?? []).map(tag => ({ label: <TagLabel name={tag.name} fallback="use-case" /> }))}
            multiple
            multipleWithModifiers
            clearSelectionLabel={t("AppStrings.All")}
            selectedValues={selectedUseCases}
            onSelectionChange={(values) => {
              const next = new Set(
                Array.from(values, (value) => String(value)),
              );
              setSelectedUseCases(next);
              updateMultiQueryParam("useCases", next);
            }}
            placeholder={t("AppStrings.All")}
          >
            {(visibleTagsByCategory.get("Use Case") ?? []).map((tag) => (
              <Dropdown.Item key={tag.id} value={String(tag.id)}>
                <TagLabel name={tag.name} fallback="use-case" />
              </Dropdown.Item>
            ))}
          </Dropdown></div>
        <div className={"music-library-filter @min-[1100px]:[&>span]:col-start-7 @min-[1100px]:[&>div]:col-start-8 flex items-center gap-[10px] min-w-0 max-[700px]:flex-wrap max-[700px]:gap-[6px] "} role="group" aria-labelledby="music-filter-looping"><span id="music-filter-looping" className={"music-library-filter-label shrink-0 text-[var(--music-muted)] text-[13px] font-semibold "}>Looping:</span><Dropdown instant fitLongestOption matchTriggerWidth arrowToChevron triggerClassName={filterTriggerClass} triggerChevronClassName={filterChevronClass} className={filterMenuClass}
            sizingOptions={(tagsByCategory.get("Looping") ?? []).map(tag => ({ label: tag.name, icon: loopingIconForLabel(tag.name) }))}
            selectedValue={selectedLooping}
            onSelect={(key) => {
              const next = String(key ?? "all");
              setSelectedLooping(next);
              updateQueryParam("looping", next);
            }}
          >
            <Dropdown.Item value="all" icon="infinity">
               {t("AppStrings.AllLooping")} </Dropdown.Item>
            {(visibleTagsByCategory.get("Looping") ?? []).map((tag) => (
              <Dropdown.Item
                key={tag.id}
                value={String(tag.id)}
                icon={loopingIconForLabel(tag.name)}
              >
                {tag.name}
              </Dropdown.Item>
            ))}
          </Dropdown></div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-1 @min-[1100px]:col-span-10 @min-[1100px]:col-start-1">
          {[
            ...(pageVersion !== "JAM" && music.some(track => track.pageVersion === "POST_JAM")
              ? [{ value: "postJamFirst", label: "AppStrings.ShowPostJamVersionsFirst" }]
              : []),
            { value: MORE_FILTERS.downloadable, label: "AppStrings.MustBeDownloadable" },
            ...(user ? [
              { value: MORE_FILTERS.moveOwnMusicToEnd, label: "AppStrings.MoveOwnMusicToEnd" },
              { value: MORE_FILTERS.moveRatedMusicToEnd, label: "AppStrings.MoveRatedMusicToEnd" },
            ] : []),
          ].map(option => (
            <label key={option.value} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 cursor-pointer accent-[var(--music-accent)]"
                checked={selectedMoreFilters.has(option.value)}
                onChange={event => {
                  const next = new Set(selectedMoreFilters);
                  if (event.target.checked) next.add(option.value);
                  else next.delete(option.value);
                  setSelectedMoreFilters(next);
                  updateMoreQueryParam(next);
                }}
              />
              {t(option.label)}
            </label>
          ))}
        </div>
      </div>
      </div>
      {!musicError && <div className="relative z-0 flex justify-start">
        <Dropdown instant portal position="top-left" isOpen={playAllMenuOpen} onOpenChange={setPlayAllMenuOpen} trigger={
        <button type="button" className="group inline-flex items-center gap-4 rounded-full border-0 bg-transparent p-1 pr-3 text-[var(--music-text)] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--music-accent)] disabled:cursor-default disabled:opacity-40" aria-busy={startingPlayback} disabled={startingPlayback || (!controlsPlayback && (initialLoading || !musicQueue.length))} onClick={event => { event.stopPropagation(); if (controlsPlayback) toggle(); else void playAll(); }}
          ref={playAllButton} aria-haspopup="menu" aria-expanded={playAllMenuOpen}
          data-pressed={playAllPressed}
          onPointerDown={event => setPlayAllPressed(event.button === 0 && !event.ctrlKey)}
          onBlur={() => setPlayAllPressed(false)}
          onKeyUp={() => setPlayAllPressed(false)}
          onContextMenu={event => { event.preventDefault(); setPlayAllMenuOpen(true); }}
          onKeyDown={event => { if (event.key === " " || event.key === "Enter") setPlayAllPressed(true); if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) { event.preventDefault(); setPlayAllMenuOpen(true); } }}>
          <span aria-hidden="true" className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full shadow-[0_3px_7px_#0003] transition-transform duration-150 group-enabled:group-hover:scale-105 group-aria-expanded:scale-105 group-data-[pressed=true]:!scale-95 motion-reduce:transition-none">
            <span className="absolute inset-0 rounded-full bg-[var(--music-accent)] shadow-[inset_0_1px_2px_#ffffff50,inset_0_-2px_3px_#0003]" />
            <span className="absolute inset-[7px] rounded-full opacity-20 [background:repeating-radial-gradient(circle,transparent_0_3px,rgb(0_0_0_/_30%)_3px_4px)]" />
            {startingPlayback ? <LoaderCircle size={26} className="relative text-[#101519] animate-spin motion-reduce:animate-none" /> : controlsPlayback && isPlaying ? <Pause size={26} strokeWidth={2.5} fill="currentColor" className="relative text-[#101519]" /> : <Play size={26} strokeWidth={2.5} fill="currentColor" className="relative ml-1 text-[#101519]" />}
          </span>
          <span className="text-2xl font-bold leading-tight">{playAllLabel}</span>
        </button>
        }>
          <Dropdown.Item value="ordered" onClick={event => { event.preventDefault(); setPlayAllMenuOpen(false); playAllButton.current?.focus(); void playAll(false); }}><span className="flex items-center gap-3"><ListOrdered size={16} aria-hidden="true" />Play in order</span></Dropdown.Item>
          <Dropdown.Item value="shuffled" onClick={event => { event.preventDefault(); setPlayAllMenuOpen(false); playAllButton.current?.focus(); void playAll(true); }}><span className="flex items-center gap-3"><Shuffle size={16} aria-hidden="true" />Play shuffled</span></Dropdown.Item>
        </Dropdown>
      </div>}

      {/* List */}
      {!musicError && <div className={"music-library-count text-[var(--music-muted)] mt-[2px] [&_*]:[text-shadow:none]!  relative z-0 flex min-h-5 items-center justify-between gap-3"} aria-busy={initialLoading}>
        {initialLoading ? <TrackCountSkeleton /> : <Text
          size="sm"
          color={headerTextColor}
          weight="semibold"
          style={{
            textShadow:
              siteTheme.type === "Light"
                ? "none"
                : "0 1px 4px rgba(0, 0, 0, 0.9)",
          }}
        >
          {t(displayedMusic.length === 1 ? "AppStrings.TrackCount" : "AppStrings.TracksCount", { count: displayedMusic.length })}
        </Text>}

      </div>}
      <Vstack
        align="stretch"
        gap={0}
        className="music-library-tracks relative z-0 w-full"
      >
        {initialLoading && <ListingSkeleton kind="music" />}
        {musicError && <Button onClick={() => void refetchMusic()}>{t("AppStrings.Retry")}</Button>}
        {musicQueue.map((track, index) => (
          (() => {
            const ratingTrackId = track.sourceTrackId ?? track.id;
            const canRateTrack =
              Boolean(user) &&
              Boolean(ratingTrackId) &&
              track.pageVersion !== "POST_JAM" &&
              Array.isArray(track.game?.team?.users) &&
              !isOwnTrack(track, user) &&
              currentJamId != null &&
              String(track.game?.jamId ?? "") === currentJamId &&
              (activeJamPhase === "Rating" ||
                activeJamPhase === "Submission") &&
              Boolean(trackOverallCategory);

            return (
              <SidebarSong
                key={`${track.pageVersion ?? "JAM"}-${ratingTrackId ?? index}-${track.slug}`}
                slug={track.slug}
                trackId={ratingTrackId}
                name={track.name}
                artist={track.composer}
                origin={track.origin}
                externalAuthorName={track.externalAuthorName}
                thumbnail={
                  track.game.soundtrackThumbnail ||
                  track.game.thumbnail ||
                  "/images/game-thumbnail.png"
                }
                game={track.game}
                pageVersion={track.pageVersion}
                song={track.url}
                loudnessGainDb={track.loudnessGainDb}
                queue={musicQueue}
                license={track.license}
                allowDownload={track.allowDownload}
                allowBackgroundUse={track.allowBackgroundUse}
                allowBackgroundUseAttribution={track.allowBackgroundUseAttribution}
                wide
                rowIndex={index}
                showRating={Boolean(user)}
                hideRatings={effectiveHideRatings}
                ratingValue={
                  ratingTrackId ? (trackSelectedStars[ratingTrackId] ?? 0) : 0
                }
                ratingDisabled={!canRateTrack}
                onRate={async (value) => {
                  if (
                    !canRateTrack ||
                    !ratingTrackId ||
                    !trackOverallCategory ||
                    track.pageVersion === "POST_JAM"
                  ) {
                    return;
                  }

                  const previous = trackSelectedStars[ratingTrackId] ?? 0;
                  emitTrackRatingSync({
                    trackId: ratingTrackId,
                    categoryId: trackOverallCategory.id,
                    value,
                  });
                  setTrackSelectedStars((prev) => ({
                    ...prev,
                    [ratingTrackId]: value,
                  }));

                  const response = await postTrackRating(
                    ratingTrackId,
                    trackOverallCategory.id,
                    value,
                  );

                  if (!response.ok) {
                    const payload = await response.json().catch(() => null);
                    addToast({
                      title: payload?.message ?? t("AppStrings.FailedToSaveTrackRating"),
                    });
                    emitTrackRatingSync({
                      trackId: ratingTrackId,
                      categoryId: trackOverallCategory.id,
                      value: previous,
                    });
                    setTrackSelectedStars((prev) => ({
                      ...prev,
                      [ratingTrackId]: previous,
                    }));
                  }
                }}
              />
            );
          })()
        ))}
        {displayedMusic.length === 0 && !initialLoading && !musicError && (
          <Text color="textFaded">{t("AppStrings.NoTracksFound")}</Text>
        )}
      </Vstack>
    </Vstack>
  );
}
