"use client";

import SidebarSong from "@/components/sidebar/SidebarSong";
import { postTrackRating } from "@/requests/rating";
import { Button, Hstack, Vstack } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { Dropdown } from "bioloom-ui";
import { useTheme } from "@/providers/useSiteTheme";
import { TrackType } from "@/types/TrackType";
import { GameSort } from "@/types/GameSort";
import { ListingPageVersion } from "@/types/GameType";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "@/compat/next-navigation";
import { getJams } from "@/requests/jam";
import { useCurrentJam } from "@/hooks/queries";
import { IconName } from "bioloom-ui";
import {
  getTrackRatingCategories,
  getTrackTags,
  getTracks,
} from "@/requests/track";
import { TrackTagType } from "@/types/TrackTagType";
import { TrackRatingCategoryType } from "@/types/TrackRatingCategoryType";
import { getSelf } from "@/requests/user";
import { useEffectiveHideRatings } from "@/hooks/useEffectiveHideRatings";
import { UserType } from "@/types/UserType";
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
import { readArray, readItem } from "@/requests/helpers";
import { getJamUrlValue, resolveJamUrlValue } from "@/helpers/jamUrl";

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
  const { colors } = useTheme();
  const router = useRouter();
  const { data: currentJamData } = useCurrentJam();
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

  const [music, setMusic] = useState<TrackType[]>([]);
  const [user, setUser] = useState<UserType | null>(null);
  const [allTrackTags, setAllTrackTags] = useState<TrackTagType[]>([]);
  const [trackSelectedStars, setTrackSelectedStars] = useState<
    Record<number, number>
  >({});
  const [trackOverallCategory, setTrackOverallCategory] =
    useState<TrackRatingCategoryType | null>(null);
  const effectiveHideRatings = useEffectiveHideRatings(user);
  const [jamOptions, setJamOptions] = useState<JamOption[]>([]);
  const [jamDetecting, setJamDetecting] = useState<boolean>(true);
  const [currentJamId, setCurrentJamId] = useState<string | null>(null);
  const [currentJamValue, setCurrentJamValue] = useState<string | null>(null);
  const [activeJamPhase, setActiveJamPhase] = useState<string | null>(null);

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

  useEffect(() => {
    if (jamDetecting || jamId === "all") return;
    if (jamOptions.some((option) => option.id === jamId)) return;

    const resolved = resolveJamUrlValue(jamId, jamOptions);
    setJamId(resolved);
    updateQueryParam("jam", resolved);
  }, [jamDetecting, jamId, jamOptions, updateQueryParam]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setJamDetecting(true);
      const options: JamOption[] = [{ id: "all", name: "All Jams" }];

      let ratingDefault: string | null = null;
      const res = currentJamData;
      const detectedJamId = res?.jam?.id?.toString();
      const detectedJamValue = getJamUrlValue(res?.jam);
      const currentJamHasContentListing = shouldShowJamInContentListings(
        res?.jam,
        res?.phase,
        detectedJamId,
      );
      {
        const isCurrentJamDefaultPhase =
          res?.phase === "Rating" ||
          res?.phase === "Submission" ||
          res?.phase === "Jamming" ||
          res?.phase === "Post-Jam Refinement" ||
          res?.phase === "Post-Jam Rating";
        const currentJamName = res?.jam?.name || "Current Jam";

        if (detectedJamId) {
          setCurrentJamId(detectedJamId);
          setCurrentJamValue(detectedJamValue || detectedJamId);
          if (currentJamHasContentListing) {
            options.push({
              id: detectedJamValue || detectedJamId,
              slug: res?.jam?.slug,
              name: currentJamName,
              icon: res?.jam?.icon,
              description: formatJamWindow(
                res?.jam?.startTime,
                res?.jam?.jammingHours,
              ),
            });
          }
        }

        if (
          currentJamHasContentListing &&
          isCurrentJamDefaultPhase &&
          (initialJamParam === "all" || !initialJamParam)
        ) {
          ratingDefault = detectedJamValue || detectedJamId || null;
        }

        setActiveJamPhase(res?.phase ?? null);
      }

      try {
        if (typeof getJams === "function") {
          const jr = await getJams();
          const js = await jr.json();
          if (Array.isArray(js)) {
            js.forEach((j) => {
              const id = String(j?.id ?? "");
              const value = getJamUrlValue(j);
              if (
                id &&
                value &&
                j?.name &&
                shouldShowJamInContentListings(j, res?.phase, detectedJamId) &&
                !options.find((o) => o.id === value || o.id === id || o.slug === j.slug)
              ) {
                options.push({
                  id: value,
                  slug: j.slug,
                  name: j.name,
                  icon: j.icon,
                  description: formatJamWindow(j.startTime, j.jammingHours),
                });
              }
            });
          }
        }
      } catch {}

      if (cancelled) return;

      setJamOptions(options);

      if (
        !hasAppliedDefault.current &&
        !hasUserSelected.current &&
        ratingDefault
      ) {
        hasAppliedDefault.current = true;
        setJamId(ratingDefault);

        const params = new URLSearchParams(window.location.search);
        params.set("jam", ratingDefault);
        navigateToSearchIfChanged(router, params, "replace");
      }

      setJamDetecting(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [router, initialJamParam, currentJamData]);

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
      name: "Score",
      icon: "star",
      description:
        "Sorts by overall star score, pulling low-rating-count entries toward the middle",
    },
    recommended: {
      name: "Recommended",
      icon: "thumbsup",
      description:
        "Like Karma, but gives a small boost to tracks people enjoy as well",
    },
    karma: {
      name: "Karma",
      icon: "sparkles",
      description:
        "Shows tracks from people who are rating and giving good feedback on music pages",
    },
    random: {
      name: "Random",
      icon: "dice3",
      description: "Randomizes the track list",
    },
    leastratings: {
      name: "Least Ratings",
      icon: "chevronsdown",
      description: "Shows tracks with the fewest ratings first",
    },
    danger: {
      name: "Danger",
      icon: "circlealert",
      description: "Shows tracks that still need more ratings to be ranked",
    },
    ratingbalance: {
      name: "Rating Balance",
      icon: "scale",
      description: "Sorts by ratings given minus ratings gotten",
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
    (async () => {
      const [tagResponse, categoryResponse, userResponse] = await Promise.all([
        getTrackTags(),
        getTrackRatingCategories().catch(() => null),
        getSelf().catch(() => null),
      ]);
      const payload = tagResponse.ok
        ? await readArray<TrackTagType>(tagResponse)
        : [];
      if (cancelled) return;
      setAllTrackTags(payload);

      if (categoryResponse?.ok) {
        const categoryPayload =
          await readArray<TrackRatingCategoryType>(categoryResponse);
        if (cancelled) return;
        const overall =
          categoryPayload.find(
            (category: TrackRatingCategoryType) => category.name === "Overall",
          ) ?? null;
        setTrackOverallCategory(overall);
      }

      if (userResponse?.ok) {
        const userPayload = await readItem<UserType>(userResponse);
        if (cancelled) return;
        setUser(userPayload);
        const ratings = (userPayload?.trackRatings ?? []).reduce(
          (
            acc: Record<number, number>,
            rating: { trackId: number; value: number; categoryId: number },
          ) => {
            acc[rating.trackId] = rating.value;
            return acc;
          },
          {},
        );
        setTrackSelectedStars(ratings);
      } else {
        setUser(null);
        setTrackSelectedStars({});
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return subscribeToTrackRatingSync(({ trackId, value }) => {
      setTrackSelectedStars((prev) => ({
        ...prev,
        [trackId]: value,
      }));
    });
  }, []);

  useEffect(() => {
    if (jamDetecting) return;

    let cancelled = false;
    (async () => {
      const res = await getTracks(sort, jamId, pageVersion);
      const json = await res.json();
      if (cancelled) return;

      setMusic(Array.isArray(json?.data) ? json.data : []);
    })();

    return () => {
      cancelled = true;
    };
  }, [jamId, jamDetecting, pageVersion, sort]);

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
      const isOwnMusic = Boolean(
        user &&
        (track.game?.team?.ownerId === user.id ||
          track.game?.team?.users?.some((member) => member.id === user.id)),
      );
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
      const isOwnMusic =
        track.game?.team?.ownerId === user.id ||
        track.game?.team?.users?.some((member) => member.id === user.id);
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

  return (
    <Vstack className="gap-3">
      <p className="text-center text-2xl" style={{ color: colors["text"] }}>
        Music
      </p>
      <Text color="textFaded">All the music uploaded to the site</Text>

      {/* Controls */}
      <Hstack className="gap-3 flex-wrap">
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
              icon={option.value === "ALL" ? "gamepad2" : "sparkles"}
              description={option.description}
            >
              {option.label}
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
                (j.id === "all" ? "Browse music from every jam" : undefined)
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
            placeholder="Genres"
          >
            {visibleTagsByCategory.get("Genre")!.map((tag) => (
              <Dropdown.Item key={tag.id} value={String(tag.id)}>
                {tag.name}
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
            placeholder="Moods"
          >
            {visibleTagsByCategory.get("Mood")!.map((tag) => (
              <Dropdown.Item key={tag.id} value={String(tag.id)}>
                {tag.name}
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
            placeholder="Use Cases"
          >
            {visibleTagsByCategory.get("Use Case")!.map((tag) => (
              <Dropdown.Item key={tag.id} value={String(tag.id)}>
                {tag.name}
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
            <Dropdown.Item value="all">All Looping</Dropdown.Item>
            {visibleTagsByCategory.get("Looping")!.map((tag) => (
              <Dropdown.Item key={tag.id} value={String(tag.id)}>
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
            placeholder="Licenses"
          >
            {availableLicenses.map((license) => (
              <Dropdown.Item key={license} value={license}>
                {license}
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
          trigger={<Button icon="morehorizontal">More</Button>}
        >
          <Dropdown.Item
            value={MORE_FILTERS.downloadable}
            description="Only show tracks that can be downloaded"
          >
            Downloadable
          </Dropdown.Item>
          <Dropdown.Item
            value={MORE_FILTERS.backgroundSafe}
            description="Only show tracks marked safe for background use in streams and videos"
          >
            Stream / Video Safe
          </Dropdown.Item>
          <Dropdown.Item
            value={MORE_FILTERS.hideOwnMusic}
            description="Hide tracks from teams you are on"
          >
            Hide Own Music
          </Dropdown.Item>
          <Dropdown.Item
            value={MORE_FILTERS.hideRatedMusic}
            description="Hide tracks you have already rated"
          >
            Hide Rated Music
          </Dropdown.Item>
          <Dropdown.Item
            value={MORE_FILTERS.moveOwnMusicToEnd}
            description="Show your own tracks after other tracks"
          >
            Move Own Music To End
          </Dropdown.Item>
          <Dropdown.Item
            value={MORE_FILTERS.moveRatedMusicToEnd}
            description="Show unrated tracks first and keep rated tracks at the end"
          >
            Move Rated Music To End
          </Dropdown.Item>
        </Dropdown>
      </Hstack>

      {/* List */}
      <Vstack align="stretch" className="w-[488px]">
        {displayedMusic.map((track, index) => (
          (() => {
            const ratingTrackId = track.sourceTrackId ?? track.id;
            const canRateTrack =
              Boolean(user) &&
              Boolean(ratingTrackId) &&
              track.pageVersion !== "POST_JAM" &&
              !track.game?.team?.users?.some(
                (member) => member.id === user?.id,
              ) &&
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
                thumbnail={track.game.thumbnail || "/images/D2J_Icon.png"}
                game={track.game}
                pageVersion={track.pageVersion}
                song={track.url}
                license={track.license}
                allowDownload={track.allowDownload}
                allowBackgroundUse={track.allowBackgroundUse}
                allowBackgroundUseAttribution={track.allowBackgroundUseAttribution}
                showRating={canRateTrack}
                hideRatings={effectiveHideRatings}
                ratingValue={
                  ratingTrackId ? (trackSelectedStars[ratingTrackId] ?? 0) : 0
                }
                ratingDisabled={!canRateTrack}
                onRate={async (value) => {
                  if (
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
                      title: payload?.message ?? "Failed to save track rating",
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
        {displayedMusic.length === 0 && !jamDetecting && (
          <Text color="textFaded">No tracks found.</Text>
        )}
      </Vstack>
    </Vstack>
  );
}
