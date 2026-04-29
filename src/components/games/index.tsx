"use client";

import { GameType, ListingPageVersion } from "@/types/GameType";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameSort } from "@/types/GameSort";
import { useSearchParams, useRouter } from "@/compat/next-navigation";
import { IconName } from "bioloom-ui";
import { Dropdown } from "bioloom-ui";
import { GameCard } from "../gamecard";
import { Spinner } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import { Card } from "bioloom-ui";
import { Button } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { PlatformType } from "@/types/DownloadLinkType";
import {
  useSelf,
  useCurrentJam,
  useJams,
  useGamesInfinite,
} from "@/hooks/queries";
import { navigateToSearchIfChanged } from "@/helpers/navigation";
import {
  getDefaultListingPageVersion,
  listingPageVersionOptions,
} from "@/helpers/listingPageVersion";
import { shouldShowJamInContentListings } from "@/helpers/jamListingOptions";
import { getJamUrlValue, resolveJamUrlValue } from "@/helpers/jamUrl";

type JamOption = {
  id: string;
  slug?: string | null;
  name: string;
  icon?: IconName;
  description?: string;
};

type TypeOption = {
  id: "all" | "ODA" | "Extra" | "Regular";
  name: string;
  icon?: IconName;
  description?: string;
};

type InputMethodFilter =
  | "KeyboardMouse"
  | "Gamepad"
  | "Touch"
  | "KeyboardOnly"
  | "MouseOnly"
  | "Motion"
  | "VR"
  | "Other";

type BuildTypeFilter = PlatformType;

type FilterOption = {
  id: string;
  name: string;
  icon?: IconName;
  description?: string;
};

type MoreFilterId =
  | "hideOwnGame"
  | "hideRatedGames"
  | "moveOwnGameToEnd"
  | "moveRatedGamesToEnd";

const DEFAULT_MORE_FILTERS = new Set<MoreFilterId>([
  "moveOwnGameToEnd",
  "moveRatedGamesToEnd",
]);
const EMPTY_MORE_FILTERS_PARAM = "none";

const INPUT_METHOD_OPTIONS: Record<
  InputMethodFilter,
  { name: string; icon: IconName }
> = {
  KeyboardMouse: { name: "Keyboard + Mouse", icon: "keyboard" },
  Gamepad: { name: "Gamepad / Controller", icon: "gamepad2" },
  Touch: { name: "Touch", icon: "touchpad" },
  KeyboardOnly: { name: "Keyboard Only", icon: "keyboard" },
  MouseOnly: { name: "Mouse Only", icon: "mouse" },
  Motion: { name: "Motion Controls", icon: "move3d" },
  VR: { name: "VR", icon: "headset" },
  Other: { name: "Other", icon: "morehorizontal" },
};

const BUILD_TYPE_OPTIONS: Record<
  BuildTypeFilter,
  { name: string; icon: IconName }
> = {
  Windows: { name: "Windows", icon: "monitor" },
  MacOS: { name: "macOS", icon: "custommacos" },
  Linux: { name: "Linux", icon: "terminal" },
  Web: { name: "Web", icon: "globe" },
  Mobile: { name: "Mobile", icon: "smartphone" },
  Other: { name: "Other", icon: "morehorizontal" },
  SourceCode: { name: "Source Code", icon: "code2" },
};

const BUILD_TYPE_ORDER: BuildTypeFilter[] = [
  "Web",
  "Windows",
  "MacOS",
  "Linux",
  "Mobile",
  "SourceCode",
  "Other",
];

const INPUT_METHOD_ORDER: InputMethodFilter[] = [
  "KeyboardMouse",
  "Gamepad",
  "Touch",
  "KeyboardOnly",
  "MouseOnly",
  "Motion",
  "VR",
  "Other",
];

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

function getGameBuildTypes(game: GameType): Set<BuildTypeFilter> {
  const buildTypes = new Set<BuildTypeFilter>();

  if (game.itchEmbedUrl) {
    buildTypes.add("Web");
  }

  game.downloadLinks.forEach((link) => {
    buildTypes.add(link.platform);
  });

  return buildTypes;
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

const restrictedSorts = new Set<GameSort>([
  "recommended",
  "karma",
  "leastratings",
  "danger",
  "ratingbalance",
]);

function getDefaultGameMoreFilters(
  selectedJamId: string,
  currentJamId: string | null | undefined,
  currentPhase: string | null | undefined,
): Set<MoreFilterId> {
  const isCurrentJam = !!currentJamId && selectedJamId === currentJamId;
  const isActiveJamBehavior =
    isCurrentJam &&
    (currentPhase === "Jamming" ||
      currentPhase === "Submission" ||
      currentPhase === "Rating");

  return isActiveJamBehavior ? new Set(DEFAULT_MORE_FILTERS) : new Set();
}

function isActiveJamBehavior(
  selectedJamId: string,
  currentJamId: string | null | undefined,
  currentPhase: string | null | undefined,
): boolean {
  const isCurrentJam = !!currentJamId && selectedJamId === currentJamId;
  return (
    isCurrentJam &&
    (currentPhase === "Jamming" ||
      currentPhase === "Submission" ||
      currentPhase === "Rating")
  );
}

function isCurrentJamPostJamBehavior(
  selectedJamId: string,
  currentJamId: string | null | undefined,
  currentPhase: string | null | undefined,
): boolean {
  return (
    !!currentJamId &&
    selectedJamId === currentJamId &&
    (currentPhase === "Post-Jam Refinement" ||
      currentPhase === "Post-Jam Rating")
  );
}

function getDefaultGameSort(
  selectedJamId: string,
  currentJamId: string | null | undefined,
  currentPhase: string | null | undefined,
  pageVersion: ListingPageVersion = "ALL",
): GameSort {
  const activeJamBehavior = isActiveJamBehavior(
    selectedJamId,
    currentJamId,
    currentPhase,
  );
  const currentJamPostJamBehavior = isCurrentJamPostJamBehavior(
    selectedJamId,
    currentJamId,
    currentPhase,
  );
  const prefersRecommendedInPostJam =
    currentJamPostJamBehavior &&
    (pageVersion === "ALL" ||
      (currentPhase === "Post-Jam Rating" && pageVersion === "POST_JAM"));

  return activeJamBehavior || prefersRecommendedInPostJam
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
    ((currentPhase === "Post-Jam Rating" && pageVersion === "POST_JAM") ||
      ((currentPhase === "Post-Jam Refinement" ||
        currentPhase === "Post-Jam Rating") &&
        pageVersion === "ALL"))
  );
}

export default function Games() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const sortParam = (searchParams.get("sort") as GameSort) || "score";
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
      (sortParam as GameSort)) ||
      "score",
  );
  const hasUserSelected = useRef(false);
  const hasAppliedDefault = useRef(false);

  const initialJamParam = useMemo(() => {
    if (typeof window === "undefined") return "all";
    const p = new URLSearchParams(window.location.search).get("jam");
    return p ?? "all";
  }, []);
  const [jamId, setJamId] = useState<string>(initialJamParam);
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
  const [pageVersion, setPageVersion] =
    useState<ListingPageVersion>(initialPageVersionParam);
  const hasMoreParam = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).has("more");
  }, []);
  const [jamDetecting, setJamDetecting] = useState<boolean>(true);
  const [showBusy, setShowBusy] = useState(false);

  const initialTypeParam = useMemo(() => {
    if (typeof window === "undefined") return "all";
    const p = new URLSearchParams(window.location.search).get("type");
    const allowed = new Set(["ODA", "Extra", "Regular"]);
    if (!p) return "all";
    return allowed.has(p) ? (p as TypeOption["id"]) : "all";
  }, []);
  const [typeFilter, setTypeFilter] =
    useState<TypeOption["id"]>(initialTypeParam);
  const initialTagsParam = useMemo(
    () =>
      typeof window === "undefined"
        ? new Set<string>()
        : parseMultiValueParam(
            new URLSearchParams(window.location.search).get("tags"),
          ),
    [],
  );
  const [selectedTags, setSelectedTags] =
    useState<Set<string>>(initialTagsParam);
  const initialInputMethodsParam = useMemo(
    () =>
      typeof window === "undefined"
        ? new Set<string>()
        : parseMultiValueParam(
            new URLSearchParams(window.location.search).get("inputMethods"),
          ),
    [],
  );
  const [selectedInputMethods, setSelectedInputMethods] = useState<Set<string>>(
    initialInputMethodsParam,
  );
  const initialBuildTypesParam = useMemo(
    () =>
      typeof window === "undefined"
        ? new Set<string>()
        : parseMultiValueParam(
            new URLSearchParams(window.location.search).get("buildTypes"),
          ),
    [],
  );
  const [selectedBuildTypes, setSelectedBuildTypes] = useState<Set<string>>(
    initialBuildTypesParam,
  );
  const initialExcludedFlagsParam = useMemo(
    () =>
      typeof window === "undefined"
        ? new Set<string>()
        : parseMultiValueParam(
            new URLSearchParams(window.location.search).get("excludeFlags"),
          ),
    [],
  );
  const [excludedFlags, setExcludedFlags] = useState<Set<string>>(
    initialExcludedFlagsParam,
  );
  const initialMoreFiltersParam = useMemo(
    () =>
      typeof window === "undefined"
        ? new Set<string>(DEFAULT_MORE_FILTERS)
        : getInitialMoreFilters(
            new URLSearchParams(window.location.search).get("more"),
          ),
    [],
  );
  const [selectedMoreFilters, setSelectedMoreFilters] = useState<Set<string>>(
    initialMoreFiltersParam,
  );

  const typeOptions: TypeOption[] = [
    { id: "all", name: "All Categories", icon: "layers" },
    { id: "Regular", name: "Regular", icon: "gamepad2" },
    { id: "ODA", name: "ODA", icon: "swords" },
    { id: "Extra", name: "Extra", icon: "calendar" },
  ];

  // Fetch user via TanStack Query
  const { data: user } = useSelf();

  // Fetch current jam and all jams via TanStack Query
  const { data: currentJamData } = useCurrentJam();
  const { data: allJams } = useJams();

  const currentJamId = currentJamData?.jam?.id?.toString();
  const currentJamValue = getJamUrlValue(currentJamData?.jam);
  const currentJamHasContentListing =
    currentJamData?.jam &&
    shouldShowJamInContentListings(
      currentJamData.jam,
      currentJamData.phase,
      currentJamData.jam.id,
    );
  const showRatedOverlay = isActiveJamBehavior(
    jamId,
    currentJamValue,
    currentJamData?.phase,
  );

  const isRestricted = (s: GameSort) => restrictedSorts.has(s);
  const canUseRestrictedSorts = !!currentJamValue && jamId === currentJamValue;
  const canUseScore = canUseScoreSort(
    jamId,
    currentJamValue,
    currentJamData?.phase,
    pageVersion,
  );

  // Build jam options from query data
  const jamOptions = useMemo<JamOption[]>(() => {
    const options: JamOption[] = [
      {
        id: "all",
        name: "All Jams",
      },
    ];

    if (
      currentJamData?.jam &&
      currentJamHasContentListing
    ) {
      const cjId = currentJamData.jam.id?.toString();
      const cjValue = getJamUrlValue(currentJamData.jam);
      if (cjId && cjValue) {
        options.push({
          id: cjValue,
          slug: currentJamData.jam.slug,
          name: currentJamData.jam.name || "Current Jam",
          icon: currentJamData.jam.icon,
          description: `${formatJamWindow(
            currentJamData.jam.startTime,
            currentJamData.jam.jammingHours
          )}`,
        });
      }
    }

    if (Array.isArray(allJams)) {
      allJams.forEach((j: { id?: number; slug?: string | null; name?: string; icon?: IconName; startTime?: string; jammingHours?: number; games?: unknown[] }) => {
        const id = String(j?.id ?? "");
        const value = getJamUrlValue(j as Parameters<typeof getJamUrlValue>[0]);
        if (
          id &&
          value &&
          j?.name &&
          shouldShowJamInContentListings(j, currentJamData?.phase, currentJamId) &&
          !options.find((o) => o.id === value || o.id === id || o.slug === j.slug)
        ) {
          options.push({
            id: value,
            slug: j.slug,
            name: j.name,
            icon: j.icon,
            description: formatJamWindow(j?.startTime, j?.jammingHours),
          });
        }
      });
    }

    return options;
  }, [currentJamData, allJams, currentJamHasContentListing, currentJamId]);

  // Handle jam detection and default selection
  useEffect(() => {
    if (!currentJamData && !allJams) return; // still loading

    const isCurrentJamDefaultPhase =
      currentJamData?.phase === "Rating" ||
      currentJamData?.phase === "Submission" ||
      currentJamData?.phase === "Jamming" ||
      currentJamData?.phase === "Post-Jam Refinement" ||
      currentJamData?.phase === "Post-Jam Rating";

    let ratingDefault: string | null = null;
    if (
      currentJamHasContentListing &&
      isCurrentJamDefaultPhase &&
      (initialJamParam === "all" || !initialJamParam)
    ) {
      ratingDefault = currentJamValue || null;
    }

    if (
      !hasAppliedDefault.current &&
      !hasUserSelected.current &&
      ratingDefault
    ) {
      hasAppliedDefault.current = true;
      setJamId(ratingDefault);

      const params = new URLSearchParams(window.location.search);
      params.set("jam", ratingDefault);
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?");
    }

    setJamDetecting(false);
  }, [currentJamData, allJams, router, initialJamParam, currentJamId, currentJamValue]);

  useEffect(() => {
    if (jamDetecting || jamOptions.length === 0) return;

    const resolved = resolveJamUrlValue(initialJamParam, jamOptions);
    if (resolved === "all" || resolved === initialJamParam) return;

    setJamId(resolved);
    const params = new URLSearchParams(window.location.search);
    params.set("jam", resolved);
    navigateToSearchIfChanged(router, params, "replace");
  }, [initialJamParam, jamDetecting, jamOptions, router]);

  // Fetch games via TanStack Query
  const {
    data: gamesPages,
    isLoading: gamesLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useGamesInfinite(
    sort,
    jamId !== "all" ? jamId : undefined,
    pageVersion,
    !jamDetecting,
    24,
  );
  const games = useMemo(() => {
    const seen = new Set<string>();
    const loadedGames: GameType[] = [];

    gamesPages?.pages.forEach((page) => {
      page.games.forEach((game) => {
        const key = `${game.id}:${game.pageVersion ?? "JAM"}`;
        if (seen.has(key)) return;
        seen.add(key);
        loadedGames.push(game);
      });
    });

    return loadedGames;
  }, [gamesPages]);

  const hasData = Boolean(gamesPages);
  const isLoading = gamesLoading;

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
        "Like Karma, but gives a small boost to games people enjoy as well",
    },
    karma: {
      name: "Karma",
      icon: "sparkles",
      description:
        "Shows games from people who are rating and giving good feedback",
    },
    random: {
      name: "GameSort.Random.Title",
      icon: "dice3",
      description: "GameSort.Random.Description",
    },
    leastratings: {
      name: "GameSort.LeastRatings.Title",
      icon: "chevronsdown",
      description: "GameSort.LeastRatings.Description",
    },
    danger: {
      name: "GameSort.Danger.Title",
      icon: "circlealert",
      description: "GameSort.Danger.Description",
    },
    ratingbalance: {
      name: "Rating Balance",
      icon: "scale",
      description: "Sorts by ratings given minus ratings gotten",
    },
  };

  useEffect(() => {
    let t: number | undefined;
    if (isLoading || jamDetecting) {
      t = window.setTimeout(() => setShowBusy(true), 250);
    } else {
      setShowBusy(false);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [isLoading, jamDetecting]);

  const updateQueryParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(window.location.search);
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        // Delete when value is "all" to keep URLs clean.
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
    const isRestricted = restrictedSorts.has(sort);
    const canUseRestrictedSorts = !!currentJamValue && jamId === currentJamValue;

    if (jamDetecting) return;

    if ((!canUseRestrictedSorts && isRestricted) || (sort === "score" && !canUseScore)) {
      const nextSort = getDefaultGameSort(
        jamId,
        currentJamValue,
        currentJamData?.phase,
        pageVersion,
      );
      setSort(nextSort);
      updateQueryParam("sort", nextSort);
    }
  }, [
    sort,
    jamId,
    currentJamId,
    currentJamData?.phase,
    updateQueryParam,
    jamDetecting,
    canUseScore,
    currentJamValue,
  ]);

  useEffect(() => {
    if (jamDetecting) return;
    if (searchParams.get("sort")) return;

    const nextSort = getDefaultGameSort(
      jamId,
      currentJamValue,
      currentJamData?.phase,
      pageVersion,
    );

    if (sort !== nextSort) {
      setSort(nextSort);
    }
  }, [
    currentJamData?.phase,
    currentJamValue,
    jamDetecting,
    jamId,
    pageVersion,
    searchParams,
    sort,
  ]);

  useEffect(() => {
    if (jamDetecting) return;
    if (hasPageVersionParam) return;

    setPageVersion(
      getDefaultListingPageVersion(jamId, currentJamValue, currentJamData?.phase),
    );
  }, [
    currentJamData?.phase,
    currentJamValue,
    hasPageVersionParam,
    jamDetecting,
    jamId,
  ]);

  useEffect(() => {
    if (jamDetecting) return;
    if (hasMoreParam) return;

    setSelectedMoreFilters(
      getDefaultGameMoreFilters(jamId, currentJamValue, currentJamData?.phase),
    );
  }, [
    currentJamData?.phase,
    currentJamValue,
    hasMoreParam,
    jamDetecting,
    jamId,
  ]);

  const tagOptions = useMemo<FilterOption[]>(() => {
    if (!games) return [];

    const seen = new Map<string, FilterOption>();
    games.forEach((game: GameType) => {
      (game.tags ?? []).forEach((tag) => {
        const id = String(tag.id);
        if (!seen.has(id)) {
          seen.set(id, {
            id,
            name: tag.name,
            icon: tag.icon as IconName,
            description: tag.description,
          });
        }
      });
    });

    return Array.from(seen.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [games]);

  const inputMethodOptions = useMemo<FilterOption[]>(() => {
    if (!games) return [];

    const used = new Set<InputMethodFilter>();
    games.forEach((game: GameType) => {
      (game.inputMethods ?? []).forEach((method) => {
        if (method in INPUT_METHOD_OPTIONS) {
          used.add(method as InputMethodFilter);
        }
      });
    });

    return INPUT_METHOD_ORDER.filter((method) => used.has(method)).map(
      (method) => ({
        id: method,
        name: INPUT_METHOD_OPTIONS[method].name,
        icon: INPUT_METHOD_OPTIONS[method].icon,
      }),
    );
  }, [games]);

  const buildTypeOptions = useMemo<FilterOption[]>(() => {
    if (!games) return [];

    const used = new Set<BuildTypeFilter>();
    games.forEach((game: GameType) => {
      getGameBuildTypes(game).forEach((buildType) => used.add(buildType));
    });

    return BUILD_TYPE_ORDER.filter((buildType) => used.has(buildType)).map(
      (buildType) => ({
        id: buildType,
        name: BUILD_TYPE_OPTIONS[buildType].name,
        icon: BUILD_TYPE_OPTIONS[buildType].icon,
      }),
    );
  }, [games]);

  const flagOptions = useMemo<FilterOption[]>(() => {
    if (!games) return [];

    const seen = new Map<string, FilterOption>();
    games.forEach((game: GameType) => {
      (game.flags ?? []).forEach((flag) => {
        const id = String(flag.id);
        if (!seen.has(id)) {
          seen.set(id, {
            id,
            name: flag.name,
            icon: flag.icon as IconName,
            description: flag.description,
          });
        }
      });
    });

    return Array.from(seen.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [games]);

  const moreOptions: Array<{
    id: MoreFilterId;
    name: string;
    icon: IconName;
    description: string;
  }> = [
    {
      id: "hideOwnGame",
      name: "Hide Own Game",
      icon: "eye",
      description: "Hide games from teams you are on",
    },
    {
      id: "hideRatedGames",
      name: "Hide Rated Games",
      icon: "star",
      description: "Hide games you have already rated",
    },
    {
      id: "moveOwnGameToEnd",
      name: "Move Own Game To End",
      icon: "move3d",
      description: "Show your own games after other games",
    },
    {
      id: "moveRatedGamesToEnd",
      name: "Move Rated Games To End",
      icon: "staroff",
      description: "Show unrated games first and keep rated games at the end",
    },
  ];

  const displayedGames = useMemo(() => {
    if (!games) return [];
    const hideOwnGame = selectedMoreFilters.has("hideOwnGame");
    const hideRatedGames = selectedMoreFilters.has("hideRatedGames");
    const moveOwnGameToEnd =
      sort !== "score" && selectedMoreFilters.has("moveOwnGameToEnd");
    const moveRatedGamesToEnd =
      sort !== "score" && selectedMoreFilters.has("moveRatedGamesToEnd");

    const filteredGames = games.filter((game: GameType) => {
      if (hideOwnGame && user) {
        const isOwnGame =
          game.team?.ownerId === user.id ||
          game.team?.users?.some((member) => member.id === user.id);
        if (isOwnGame) {
          return false;
        }
      }

      if (
        hideRatedGames &&
        user &&
        game.ratings.some((rating) => rating.userId === user.id)
      ) {
        return false;
      }

      if (typeFilter !== "all") {
        const wanted = typeFilter.toLowerCase();
        const t = game.category ?? "";
        if (String(t).toLowerCase() !== wanted) {
          return false;
        }
      }

      if (selectedTags.size > 0) {
        const gameTags = new Set(
          (game.tags ?? []).map((tag) => String(tag.id)),
        );
        if (!Array.from(selectedTags).some((tagId) => gameTags.has(tagId))) {
          return false;
        }
      }

      if (selectedInputMethods.size > 0) {
        const gameInputMethods = new Set(game.inputMethods ?? []);
        if (
          !Array.from(selectedInputMethods).some((method) =>
            gameInputMethods.has(method),
          )
        ) {
          return false;
        }
      }

      if (selectedBuildTypes.size > 0) {
        const gameBuildTypes = getGameBuildTypes(game);
        if (
          !Array.from(selectedBuildTypes).some((buildType) =>
            gameBuildTypes.has(buildType as BuildTypeFilter),
          )
        ) {
          return false;
        }
      }

      if (excludedFlags.size > 0) {
        const gameFlags = new Set(
          (game.flags ?? []).map((flag) => String(flag.id)),
        );
        if (Array.from(excludedFlags).some((flagId) => gameFlags.has(flagId))) {
          return false;
        }
      }

      return true;
    });

    if (!user || (!moveOwnGameToEnd && !moveRatedGamesToEnd)) {
      return filteredGames;
    }

    const regularUnratedGames: GameType[] = [];
    const ownGames: GameType[] = [];
    const regularRatedGames: GameType[] = [];

    filteredGames.forEach((game) => {
      const isOwnGame =
        game.team?.ownerId === user.id ||
        game.team?.users?.some((member) => member.id === user.id);
      const isRatedGame = game.ratings.some(
        (rating) => rating.userId === user.id,
      );

      if (moveOwnGameToEnd && isOwnGame) {
        ownGames.push(game);
        return;
      }

      if (moveRatedGamesToEnd && isRatedGame) {
        regularRatedGames.push(game);
        return;
      }

      regularUnratedGames.push(game);
    });

    if (moveOwnGameToEnd && moveRatedGamesToEnd) {
      return [...regularUnratedGames, ...ownGames, ...regularRatedGames];
    }

    if (moveOwnGameToEnd) {
      return [...regularUnratedGames, ...ownGames];
    }

    return [...regularUnratedGames, ...regularRatedGames];
  }, [
    excludedFlags,
    games,
    selectedBuildTypes,
    selectedInputMethods,
    selectedMoreFilters,
    selectedTags,
    sort,
    typeFilter,
    user,
  ]);

  if (!hasData && (isLoading || showBusy || jamDetecting)) {
    return (
      <Vstack className="p-4">
        <Card className="max-w-96">
          <Vstack>
            <Hstack>
              <Spinner />
              <Text size="xl">Loading</Text>
            </Hstack>
            <Text color="textFaded">Loading games...</Text>
          </Vstack>
        </Card>
      </Vstack>
    );
  }

  return (
    <>
      <Vstack className="p-4 gap-3">
        <Hstack className="gap-3 flex-wrap">
          {/* Sort dropdown */}
          <Dropdown
            selectedValue={sort}
            onSelect={(key) => {
              const next = key as GameSort;

              if ((isRestricted(next) && !canUseRestrictedSorts) || (next === "score" && !canUseScore)) return;

              setSort(next);
              updateQueryParam("sort", key as string);
            }}
          >
            {Object.entries(sorts)
              .filter(
                (sort) =>
                  !(
                    (isRestricted(sort[0] as GameSort) && !canUseRestrictedSorts) ||
                    (sort[0] === "score" && !canUseScore)
                  ),
              )
              .map(([key, sort]) => (
                <Dropdown.Item
                  key={key}
                  value={key}
                  icon={sort.icon}
                  description={sort.description}
                >
                  {sort.name}
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

          {/* Jam dropdown */}
            <Dropdown
              selectedValue={jamId}
              onSelect={(key) => {
                const val = key as string;
                setJamId(val);
                const nextSort = getDefaultGameSort(
                  val,
                  currentJamValue,
                  currentJamData?.phase,
                  hasPageVersionParam
                    ? pageVersion
                    : getDefaultListingPageVersion(
                        val,
                        currentJamValue,
                        currentJamData?.phase,
                      ),
                );
                const effectiveNextPageVersion = hasPageVersionParam
                  ? pageVersion
                  : getDefaultListingPageVersion(
                      val,
                      currentJamValue,
                      currentJamData?.phase,
                    );
                if (
                  (!isRestricted(sort) && !(sort === "score" && !canUseScore)) ||
                  (nextSort === "score" &&
                    canUseScoreSort(
                      val,
                      currentJamValue,
                      currentJamData?.phase,
                      effectiveNextPageVersion,
                    ))
                ) {
                  setSort(nextSort);
                  updateQueryParam("sort", nextSort);
                }
                if (!hasPageVersionParam) {
                  const nextPageVersion = getDefaultListingPageVersion(
                    val,
                    currentJamValue,
                    currentJamData?.phase,
                  );
                  setPageVersion(nextPageVersion);
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
                  (j.id === "all" ? "Browse entries from every jam" : undefined)
                }
              >
                {j.name}
              </Dropdown.Item>
            ))}
          </Dropdown>

          {/* Type dropdown */}
          <Dropdown
            selectedValue={typeFilter}
            onSelect={(key) => {
              const val = key as TypeOption["id"];
              setTypeFilter(val);
              updateQueryParam("type", val);
            }}
          >
            {typeOptions.map((t) => (
              <Dropdown.Item
                key={t.id}
                value={t.id}
                icon={t.icon || "gamepad2"}
                description={
                  t.id === "all"
                    ? "Show all game categories"
                    : `Only ${t.name} entries`
                }
              >
                {t.name}
              </Dropdown.Item>
            ))}
          </Dropdown>

          {tagOptions.length > 0 && (
            <Dropdown
              multiple
              selectedValues={selectedTags}
              onSelectionChange={(values) => {
                const next = new Set(
                  Array.from(values, (value) => String(value)),
                );
                setSelectedTags(next);
                updateMultiQueryParam("tags", next);
              }}
              placeholder="Tags"
            >
              {tagOptions.map((tag) => (
                <Dropdown.Item
                  key={tag.id}
                  value={tag.id}
                  icon={tag.icon}
                  description={tag.description}
                >
                  {tag.name}
                </Dropdown.Item>
              ))}
            </Dropdown>
          )}

          {inputMethodOptions.length > 0 && (
            <Dropdown
              multiple
              selectedValues={selectedInputMethods}
              onSelectionChange={(values) => {
                const next = new Set(
                  Array.from(values, (value) => String(value)),
                );
                setSelectedInputMethods(next);
                updateMultiQueryParam("inputMethods", next);
              }}
              placeholder="Input Methods"
            >
              {inputMethodOptions.map((method) => (
                <Dropdown.Item
                  key={method.id}
                  value={method.id}
                  icon={method.icon}
                  description={method.description}
                >
                  {method.name}
                </Dropdown.Item>
              ))}
            </Dropdown>
          )}

          {buildTypeOptions.length > 0 && (
            <Dropdown
              multiple
              selectedValues={selectedBuildTypes}
              onSelectionChange={(values) => {
                const next = new Set(
                  Array.from(values, (value) => String(value)),
                );
                setSelectedBuildTypes(next);
                updateMultiQueryParam("buildTypes", next);
              }}
              placeholder="Build Types"
            >
              {buildTypeOptions.map((buildType) => (
                <Dropdown.Item
                  key={buildType.id}
                  value={buildType.id}
                  icon={buildType.icon}
                  description={buildType.description}
                >
                  {buildType.name}
                </Dropdown.Item>
              ))}
            </Dropdown>
          )}

          {flagOptions.length > 0 && (
            <Dropdown
              multiple
              selectedValues={excludedFlags}
              onSelectionChange={(values) => {
                const next = new Set(
                  Array.from(values, (value) => String(value)),
                );
                setExcludedFlags(next);
                updateMultiQueryParam("excludeFlags", next);
              }}
              placeholder="Exclude Flags"
            >
              {flagOptions.map((flag) => (
                <Dropdown.Item
                  key={flag.id}
                  value={flag.id}
                  icon={flag.icon}
                  description={flag.description}
                >
                  {flag.name}
                </Dropdown.Item>
              ))}
            </Dropdown>
          )}

          <Dropdown
            multiple
            selectedValues={selectedMoreFilters}
            onSelectionChange={(values) => {
              const next = new Set(
                Array.from(values, (value) => String(value)),
              );
              setSelectedMoreFilters(next);
              updateMoreQueryParam(next);
            }}
            trigger={<Button icon="morehorizontal">More</Button>}
          >
            {moreOptions.map((option) => (
              <Dropdown.Item
                key={option.id}
                value={option.id}
                icon={option.icon}
                description={option.description}
              >
                {option.name}
              </Dropdown.Item>
            ))}
          </Dropdown>
        </Hstack>
      </Vstack>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayedGames && displayedGames.length > 0 ? (
          displayedGames.map((game: GameType) => (
            <GameCard
              key={`${game.id}-${game.pageVersion ?? "JAM"}`}
              game={game}
              rated={
                showRatedOverlay &&
                game.ratings.some((rating) => rating.userId == user?.id)
              }
            />
          ))
        ) : (
          <p>No games were found. :(</p>
        )}
      </section>
      {hasNextPage && (
        <div className="flex justify-center py-6">
          <Button
            icon="chevrondown"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading..." : "Load More Games"}
          </Button>
        </div>
      )}
    </>
  );
}
