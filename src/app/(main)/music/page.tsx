import { translateSystemLabel } from "@/helpers/systemLabels";
import { isOwnTrack } from "@/helpers/isOwnTrack";
"use client";

import { useTranslations } from "@/compat/next-intl";

import SidebarSong from "@/components/sidebar/SidebarSong";
import { postTrackRating } from "@/requests/rating";
import { Button, Hstack, Vstack } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { Dropdown } from "bioloom-ui";
import { useTheme } from "@/providers/useSiteTheme";
import { getTrackLicense } from "@/helpers/trackLicense";
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
import {
  FaCopyright,
  FaCreativeCommons,
  FaCreativeCommonsBy,
  FaCreativeCommonsNc,
  FaCreativeCommonsNd,
  FaCreativeCommonsSa,
  FaCreativeCommonsZero,
} from "react-icons/fa";

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
  hideOwnMusic: "hideOwnMusic",
  hideRatedMusic: "hideRatedMusic",
  moveOwnMusicToEnd: "moveOwnMusicToEnd",
  moveRatedMusicToEnd: "moveRatedMusicToEnd",
} as const;

const DEFAULT_MORE_FILTERS = new Set<string>([
  MORE_FILTERS.moveOwnMusicToEnd,
  MORE_FILTERS.moveRatedMusicToEnd,
]);
const EMPTY_MORE_FILTERS_PARAM = "none";

function LicenseMark({ license }: { license: string }) {
  const normalized = getTrackLicense(license).label.toUpperCase().replace(/\s+/g, " ").trim();

  if (normalized === "ALL RIGHTS RESERVED") {
    return (
      <span aria-hidden="true" className="flex w-16 shrink-0 items-center">
        <FaCopyright size={18} />
      </span>
    );
  }

  if (normalized.startsWith("CC0")) {
    return (
      <span
        aria-hidden="true"
        className="flex w-16 shrink-0 items-center -space-x-0.5"
      >
        <FaCreativeCommons size={16} />
        <FaCreativeCommonsZero size={16} />
      </span>
    );
  }

  const terms = new Set(normalized.split(/[\s-]+/));

  return (
    <span
      aria-hidden="true"
      className="flex w-16 shrink-0 items-center -space-x-0.5"
    >
      <FaCreativeCommons size={16} />
      {terms.has("BY") && <FaCreativeCommonsBy size={16} />}
      {terms.has("NC") && <FaCreativeCommonsNc size={16} />}
      {terms.has("ND") && <FaCreativeCommonsNd size={16} />}
      {terms.has("SA") && <FaCreativeCommonsSa size={16} />}
    </span>
  );
}

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
  selectedJamId: string,
  currentJamId: string | null | undefined,
  currentPhase: string | null | undefined,
  pageVersion: ListingPageVersion = "ALL",
): GameSort {
  const isCurrentJam = !!currentJamId && selectedJamId === currentJamId;
  const isActiveJamBehavior =
    isCurrentJam &&
    (currentPhase === "Jamming" ||
      currentPhase === "Submission" ||
      currentPhase === "Rating");
  const isCurrentJamPostJamRating =
    isCurrentJam &&
    currentPhase === "Post-Jam Rating" &&
    pageVersion === "POST_JAM";

  return isActiveJamBehavior || isCurrentJamPostJamRating
    ? "recommended"
    : "score";
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

  return isActiveJamBehavior ? new Set(DEFAULT_MORE_FILTERS) : new Set();
}

export default function MusicPage() {
  const t = useTranslations();
  const { colors, siteTheme } = useTheme();
  const headerColor = colors["text"];
  const headerTextColor = "text";
  const router = useRouter();
  const { data: currentJamData, isPending: currentJamPending } = useCurrentJam();
  const { data: allJams } = useJams();
  const restrictedSorts = useMemo(
    () =>
      new Set<GameSort>([
        "recommended",
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
    if (typeof window === "undefined") return "score";
    return (
      (new URLSearchParams(window.location.search).get("sort") as GameSort) ??
      "score"
    );
  }, []);
  const [sort, setSort] = useState<GameSort>(
    ([
      "score",
      "recommended",
      "karma",
      "random",
      "leastratings",
      "danger",
      "ratingbalance",
    ].includes(sortParam) &&
      sortParam) ||
      "score",
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

  const clearContentFilters = useCallback(() => {
    setSelectedGenres(new Set());
    setSelectedMoods(new Set());
    setSelectedUseCases(new Set());
    setSelectedLicenses(new Set());
    setSelectedLooping("all");
    setSelectedMoreFilters(new Set());

    const params = new URLSearchParams(window.location.search);
    ["genres", "moods", "useCases", "licenses", "looping"].forEach(
      (key) => params.delete(key),
    );
    params.set("more", EMPTY_MORE_FILTERS_PARAM);
    navigateToSearchIfChanged(router, params);
  }, [router]);

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

  const canUseRestrictedSorts = Boolean(currentJamValue) && jamId === currentJamValue;
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
        t("AppStrings.LikeKarmaButGivesASmallBoostTo2"),
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
      const isOwnMusic = isOwnTrack(track, user);
      const hasRatedTrack = Boolean(
        user &&
          (track.sourceTrackId ?? track.id) &&
          (trackSelectedStars[track.sourceTrackId ?? track.id] ?? 0) > 0,
      );

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
      if (selectedMoreFilters.has(MORE_FILTERS.hideOwnMusic) && isOwnMusic) {
        return false;
      }
      if (
        selectedMoreFilters.has(MORE_FILTERS.hideRatedMusic) &&
        hasRatedTrack
      ) {
        return false;
      }

      return true;
    });

    const moveOwnMusicToEnd = selectedMoreFilters.has(
      MORE_FILTERS.moveOwnMusicToEnd,
    );
    const moveRatedMusicToEnd =
      sort !== "score" &&
      selectedMoreFilters.has(MORE_FILTERS.moveRatedMusicToEnd);
    const shouldMoveOwnMusicToEnd =
      sort !== "score" && moveOwnMusicToEnd;

    if (!user || (!shouldMoveOwnMusicToEnd && !moveRatedMusicToEnd)) {
      return filteredMusic;
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
      return [...regularUnratedTracks, ...ownTracks, ...regularRatedTracks];
    }

    if (shouldMoveOwnMusicToEnd) {
      return [...regularUnratedTracks, ...ownTracks];
    }

    return [...regularUnratedTracks, ...regularRatedTracks];
  }, [
    music,
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

  const activeFilterCount =
    selectedGenres.size +
    selectedMoods.size +
    selectedUseCases.size +
    selectedLicenses.size +
    selectedMoreFilters.size +
    (selectedLooping === "all" ? 0 : 1);

  return (
    <Vstack align="stretch" className="mx-auto w-full max-w-7xl gap-4">
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
           {t("Navbar.Music.Title")} </p>
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
           {t("AppStrings.AllTheMusicUploadedToTheSite")} </p>
      </header>

      {/* Controls */}
      <Hstack
        justify="center"
        className="relative z-30 w-full gap-2 flex-wrap"
      >
        <Dropdown
          selectedValue={sort}
          onSelect={(key) => {
            const next = key as GameSort;
            if ((isRestricted(next) && !canUseRestrictedSorts) || (next === "score" && !canUseScore)) return;
            setSort(next);
            updateQueryParam("sort", next);
          }}
        >
          {Object.entries(sorts)
            .filter(
              ([key]) =>
                !(
                  (isRestricted(key as GameSort) && !canUseRestrictedSorts) ||
                  (key === "score" && !canUseScore)
                ),
            )
            .map(([key, value]) => (
              <Dropdown.Item
                key={key}
                value={key}
                icon={value.icon}
                description={value.description}
              >
                {value.name}
              </Dropdown.Item>
            ))}
        </Dropdown>

        <Dropdown
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
        </Dropdown>

        <Dropdown
          selectedValue={jamId}
          onSelect={(key) => {
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
          }}
        >
          {jamOptions.map((j) => (
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

        {(visibleTagsByCategory.get("Genre")?.length ?? 0) > 0 && (
          <Dropdown
            multiple
            selectedValues={selectedGenres}
            onSelectionChange={(values) => {
              const next = new Set(
                Array.from(values, (value) => String(value)),
              );
              setSelectedGenres(next);
              updateMultiQueryParam("genres", next);
            }}
            placeholder={t("AppStrings.Genres")}
          >
            {visibleTagsByCategory.get("Genre")!.map((tag) => (
              <Dropdown.Item key={tag.id} value={String(tag.id)}>
                <TagLabel name={tag.name} fallback="music" />
              </Dropdown.Item>
            ))}
          </Dropdown>
        )}

        {(visibleTagsByCategory.get("Mood")?.length ?? 0) > 0 && (
          <Dropdown
            multiple
            selectedValues={selectedMoods}
            onSelectionChange={(values) => {
              const next = new Set(
                Array.from(values, (value) => String(value)),
              );
              setSelectedMoods(next);
              updateMultiQueryParam("moods", next);
            }}
            placeholder={t("AppStrings.Moods")}
          >
            {visibleTagsByCategory.get("Mood")!.map((tag) => (
              <Dropdown.Item key={tag.id} value={String(tag.id)}>
                <TagLabel name={tag.name} fallback="mood" />
              </Dropdown.Item>
            ))}
          </Dropdown>
        )}

        {(visibleTagsByCategory.get("Use Case")?.length ?? 0) > 0 && (
          <Dropdown
            multiple
            selectedValues={selectedUseCases}
            onSelectionChange={(values) => {
              const next = new Set(
                Array.from(values, (value) => String(value)),
              );
              setSelectedUseCases(next);
              updateMultiQueryParam("useCases", next);
            }}
            placeholder={t("AppStrings.UseCases")}
          >
            {visibleTagsByCategory.get("Use Case")!.map((tag) => (
              <Dropdown.Item key={tag.id} value={String(tag.id)}>
                <TagLabel name={tag.name} fallback="use-case" />
              </Dropdown.Item>
            ))}
          </Dropdown>
        )}

        {(visibleTagsByCategory.get("Looping")?.length ?? 0) > 0 && (
          <Dropdown
            selectedValue={selectedLooping}
            onSelect={(key) => {
              const next = String(key ?? "all");
              setSelectedLooping(next);
              updateQueryParam("looping", next);
            }}
          >
            <Dropdown.Item value="all" icon="infinity">
               {t("AppStrings.AllLooping")} </Dropdown.Item>
            {visibleTagsByCategory.get("Looping")!.map((tag) => (
              <Dropdown.Item
                key={tag.id}
                value={String(tag.id)}
                icon={loopingIconForLabel(tag.name)}
              >
                {tag.name}
              </Dropdown.Item>
            ))}
          </Dropdown>
        )}

        {availableLicenses.length > 0 && (
          <Dropdown
            multiple
            selectedValues={selectedLicenses}
            onSelectionChange={(values) => {
              const next = new Set(
                Array.from(values, (value) => String(value)),
              );
              setSelectedLicenses(next);
              updateMultiQueryParam("licenses", next);
            }}
            placeholder={t("AppStrings.Licenses")}
          >
            {availableLicenses.map((license) => (
              <Dropdown.Item key={license} value={license}>
                <span className="flex items-center gap-2">
                  <LicenseMark license={license} />
                  <span>{getTrackLicense(license).label}</span>
                </span>
              </Dropdown.Item>
            ))}
          </Dropdown>
        )}

        <Dropdown
          multiple
          selectedValues={selectedMoreFilters}
          onSelectionChange={(values) => {
            const next = new Set(Array.from(values, (value) => String(value)));
            setSelectedMoreFilters(next);
            updateMoreQueryParam(next);
          }}
          trigger={<Button icon="morehorizontal">{t("AppStrings.More")}</Button>}
        >
          <Dropdown.Item
            value={MORE_FILTERS.downloadable}
            icon="download"
            description={t("AppStrings.OnlyShowTracksThatCanBeDownloaded")}
          >
             {t("AppStrings.Downloadable")} </Dropdown.Item>
          <Dropdown.Item
            value={MORE_FILTERS.backgroundSafe}
            icon="shield"
            description={t("AppStrings.OnlyShowTracksMarkedSafeForBackgroundUse")}
          >
             {t("AppStrings.StreamVideoSafe")} </Dropdown.Item>
          <Dropdown.Item
            value={MORE_FILTERS.hideOwnMusic}
            icon="userx"
            description={t("AppStrings.HideTracksFromTeamsYouAreOn")}
          >
             {t("AppStrings.HideOwnMusic")} </Dropdown.Item>
          <Dropdown.Item
            value={MORE_FILTERS.hideRatedMusic}
            icon="staroff"
            description={t("AppStrings.HideTracksYouHaveAlreadyRated")}
          >
             {t("AppStrings.HideRatedMusic")} </Dropdown.Item>
          <Dropdown.Item
            value={MORE_FILTERS.moveOwnMusicToEnd}
            icon="user"
            description={t("AppStrings.ShowYourOwnTracksAfterOtherTracks")}
          >
             {t("AppStrings.MoveOwnMusicToEnd")} </Dropdown.Item>
          <Dropdown.Item
            value={MORE_FILTERS.moveRatedMusicToEnd}
            icon="star"
            description={t("AppStrings.ShowUnratedTracksFirstAndKeepRatedTracks")}
          >
             {t("AppStrings.MoveRatedMusicToEnd")} </Dropdown.Item>
        </Dropdown>
      </Hstack>
      {activeFilterCount > 0 && (
        <Hstack justify="center" className="relative z-20 w-full">
          <Button
            size="sm"
            variant="ghost"
            icon="x"
            onClick={clearContentFilters}
          >
            {t("AppStrings.ClearFilterCount", { count: activeFilterCount })}
          </Button>
        </Hstack>
      )}

      {/* List */}
      {!musicError && <div className="relative z-0 flex min-h-5 items-center justify-center px-1 text-center" aria-busy={initialLoading}>
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
        gap={2}
        className="relative z-0 w-full max-w-4xl self-center"
      >
        {initialLoading && <ListingSkeleton kind="music" />}
        {musicError && <Button onClick={() => void refetchMusic()}>{t("AppStrings.Retry")}</Button>}
        {musicQueue.map((track, index) => (
          (() => {
            const ratingTrackId = track.sourceTrackId ?? track.id;
            const canRateTrack =
              Boolean(user) &&
              Boolean(ratingTrackId) &&
              track.origin !== "ASSET_PACK" &&
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
                showRating={canRateTrack}
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
