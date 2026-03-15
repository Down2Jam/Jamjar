"use client";

import { GameType } from "@/types/GameType";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameSort } from "@/types/GameSort";
import { useSearchParams, useRouter } from "next/navigation";
import { getGames } from "@/requests/game";
import { UserType } from "@/types/UserType";
import { getSelf } from "@/requests/user";
import { IconName } from "bioloom-ui";
import { Dropdown } from "bioloom-ui";
import { GameCard } from "../gamecard";
import { Spinner } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import { Card } from "bioloom-ui";
import { Button } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { PlatformType } from "@/types/DownloadLinkType";

import { getCurrentJam } from "@/helpers/jam";
import { getJams } from "@/requests/jam";
import { navigateToSearchIfChanged } from "@/helpers/navigation";

type JamOption = {
  id: string;
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

type MoreFilterId = "hideOwnGame" | "hideRatedGames";

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

export default function Games() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [games, setGames] = useState<GameType[]>();
  const [user, setUser] = useState<UserType>();

  const sortParam = (searchParams.get("sort") as GameSort) || "recommended";
  const [sort, setSort] = useState<GameSort>(
    ([
      "recommended",
      "karma",
      "random",
      "leastratings",
      "danger",
      "ratingbalance",
    ].includes(sortParam) &&
      (sortParam as GameSort)) ||
      "recommended",
  );
  const hasUserSelected = useRef(false);
  const hasAppliedDefault = useRef(false);

  const initialJamParam = useMemo(() => {
    if (typeof window === "undefined") return "all";
    const p = new URLSearchParams(window.location.search).get("jam");
    return p ?? "all";
  }, []);
  const [jamId, setJamId] = useState<string>(initialJamParam);
  const [jamOptions, setJamOptions] = useState<JamOption[]>([]);
  const [jamDetecting, setJamDetecting] = useState<boolean>(true);
  const [hasData, setHasData] = useState(false);
  const [showBusy, setShowBusy] = useState(false);
  const [currentJamId, setCurrentJamId] = useState<string | undefined>(
    undefined,
  );

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
        ? new Set<string>()
        : parseMultiValueParam(
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

  const isRestricted = (s: GameSort) => restrictedSorts.has(s);
  const canUseRestrictedSorts = !!currentJamId && jamId === currentJamId;

  const sorts: Record<
    GameSort,
    { name: string; icon: IconName; description: string }
  > = {
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

  useEffect(() => {
    const isRestricted = restrictedSorts.has(sort);
    const canUseRestrictedSorts = !!currentJamId && jamId === currentJamId;

    if (jamDetecting) return;

    if (!canUseRestrictedSorts && isRestricted) {
      setSort("random");
      updateQueryParam("sort", "random");
    }
  }, [sort, jamId, currentJamId, updateQueryParam, jamDetecting]);

  useEffect(() => {
    (async () => {
      try {
        const response = await getSelf();
        setUser(await response.json());
      } catch {}
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setJamDetecting(true);
      const options: JamOption[] = [
        {
          id: "all",
          name: "All Jams",
        },
      ];

      let ratingDefault: string | null = null;
      try {
        const res = await getCurrentJam();
        const isRatingPhase =
          res?.phase === "Rating" ||
          res?.phase === "Submission" ||
          res?.phase === "Jamming";
        const currentJamId = res?.jam?.id?.toString();
        const currentJamName = res?.jam?.name || "Current Jam";

        setCurrentJamId(currentJamId || undefined);

        if (currentJamId)
          options.push({
            id: currentJamId,
            name: currentJamName,
            icon: res?.jam?.icon,
            description: `${formatJamWindow(
              res?.jam?.startTime,
              res?.jam?.jammingHours,
            )}`,
          });

        if (isRatingPhase && (initialJamParam === "all" || !initialJamParam)) {
          ratingDefault = currentJamId ?? null;
        }
      } catch {}

      try {
        if (typeof getJams === "function") {
          const jr = await getJams();
          const js = await jr.json();
          if (Array.isArray(js)) {
            js.forEach((j) => {
              const id = String(j?.id ?? "");
              if (id && j?.name && !options.find((o) => o.id === id)) {
                options.push({
                  id,
                  name: j.name,
                  icon: j.icon,
                  description: formatJamWindow(j?.startTime, j?.jammingHours),
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
  }, [router, initialJamParam]);

  useEffect(() => {
    if (jamDetecting) return;

    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const gameResponse = await getGames(
          sort,
          jamId !== "all" ? jamId : undefined,
        );
        if (cancelled) return;
        const data = await gameResponse.json();
        setGames(data);
        if (Array.isArray(data)) setHasData(true);
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setGames(undefined);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sort, jamId, jamDetecting]);

  const tagOptions = useMemo<FilterOption[]>(() => {
    if (!games) return [];

    const seen = new Map<string, FilterOption>();
    games.forEach((game) => {
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
    games.forEach((game) => {
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
    games.forEach((game) => {
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
    games.forEach((game) => {
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
  ];

  const displayedGames = useMemo(() => {
    if (!games) return [];
    const hideOwnGame = selectedMoreFilters.has("hideOwnGame");
    const hideRatedGames = selectedMoreFilters.has("hideRatedGames");

    return games.filter((game) => {
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
  }, [
    excludedFlags,
    games,
    selectedBuildTypes,
    selectedInputMethods,
    selectedMoreFilters,
    selectedTags,
    typeFilter,
    user,
  ]);

  if (!hasData && (showBusy || jamDetecting)) {
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

              if (isRestricted(next) && !canUseRestrictedSorts) return;

              setSort(next);
              updateQueryParam("sort", key as string);
            }}
          >
            {Object.entries(sorts)
              .filter(
                (sort) =>
                  !(
                    isRestricted(sort[0] as GameSort) && !canUseRestrictedSorts
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

          {/* Jam dropdown */}
          <Dropdown
            selectedValue={jamId}
            onSelect={(key) => {
              const val = key as string;
              setJamId(val);
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
              updateMultiQueryParam("more", next);
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
          displayedGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              rated={game.ratings.some((rating) => rating.userId == user?.id)}
            />
          ))
        ) : (
          <p>No games were found. :(</p>
        )}
      </section>
    </>
  );
}
