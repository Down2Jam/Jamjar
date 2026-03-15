"use client";

import SidebarSong from "@/components/sidebar/SidebarSong";
import { postTrackRating } from "@/requests/rating";
import { Button, Hstack, Vstack } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { Dropdown } from "bioloom-ui";
import { useTheme } from "@/providers/SiteThemeProvider";
import { TrackType } from "@/types/TrackType";
import { GameSort } from "@/types/GameSort";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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

type JamOption = {
  id: string;
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
  const [activeJamPhase, setActiveJamPhase] = useState<string | null>(null);

  const hasAppliedDefault = useRef(false);
  const hasUserSelected = useRef(false);
  const sortParam = useMemo(() => {
    if (typeof window === "undefined") return "recommended";
    return (
      (new URLSearchParams(window.location.search).get("sort") as GameSort) ??
      "recommended"
    );
  }, []);
  const [sort, setSort] = useState<GameSort>(
    ([
      "recommended",
      "karma",
      "random",
      "leastratings",
      "danger",
      "ratingbalance",
    ].includes(sortParam) &&
      sortParam) ||
      "recommended",
  );

  const initialJamParam = useMemo(() => {
    if (typeof window === "undefined") return "all";
    const p = new URLSearchParams(window.location.search).get("jam");
    return p ?? "all";
  }, []);

  const [jamId, setJamId] = useState<string>(initialJamParam);
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
    let cancelled = false;

    (async () => {
      setJamDetecting(true);
      const options: JamOption[] = [{ id: "all", name: "All Jams" }];

      let ratingDefault: string | null = null;
      {
        const res = currentJamData;
        const isRatingPhase =
          res?.phase === "Rating" ||
          res?.phase === "Submission" ||
          res?.phase === "Jamming";
        const detectedJamId = res?.jam?.id?.toString();
        const currentJamName = res?.jam?.name || "Current Jam";

        if (detectedJamId) {
          setCurrentJamId(detectedJamId);
          options.push({
            id: detectedJamId,
            name: currentJamName,
            icon: res?.jam?.icon,
            description: formatJamWindow(
              res?.jam?.startTime,
              res?.jam?.jammingHours,
            ),
          });
        }

        if (isRatingPhase && (initialJamParam === "all" || !initialJamParam)) {
          ratingDefault = detectedJamId ?? null;
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
              if (id && j?.name && !options.find((o) => o.id === id)) {
                options.push({
                  id,
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

  const canUseRestrictedSorts = Boolean(currentJamId) && jamId === currentJamId;
  const isRestricted = useCallback(
    (value: GameSort) => restrictedSorts.has(value),
    [restrictedSorts],
  );

  const sorts: Record<
    GameSort,
    { name: string; icon: IconName; description: string }
  > = {
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
    if (!canUseRestrictedSorts && isRestricted(sort)) {
      setSort("random");
      updateQueryParam("sort", "random");
    }
  }, [
    canUseRestrictedSorts,
    isRestricted,
    jamDetecting,
    sort,
    updateQueryParam,
  ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [tagResponse, categoryResponse, userResponse] = await Promise.all([
        getTrackTags(),
        getTrackRatingCategories().catch(() => null),
        getSelf().catch(() => null),
      ]);
      const payload = await tagResponse.json().catch(() => null);
      if (cancelled) return;
      setAllTrackTags(Array.isArray(payload?.data) ? payload.data : []);

      if (categoryResponse?.ok) {
        const categoryPayload = await categoryResponse.json().catch(() => null);
        if (cancelled) return;
        const overall =
          categoryPayload?.data?.find(
            (category: TrackRatingCategoryType) => category.name === "Overall",
          ) ?? null;
        setTrackOverallCategory(overall);
      }

      if (userResponse?.ok) {
        const userPayload = await userResponse.json().catch(() => null);
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
      const res = await getTracks(sort, jamId);
      const json = await res.json();
      if (cancelled) return;

      setMusic(Array.isArray(json?.data) ? json.data : []);
    })();

    return () => {
      cancelled = true;
    };
  }, [jamId, jamDetecting, sort]);

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
        user && track.id && (trackSelectedStars[track.id] ?? 0) > 0,
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
    const moveRatedMusicToEnd = selectedMoreFilters.has(
      MORE_FILTERS.moveRatedMusicToEnd,
    );

    if (!user || (!moveOwnMusicToEnd && !moveRatedMusicToEnd)) {
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
        track.id && (trackSelectedStars[track.id] ?? 0) > 0,
      );

      if (moveOwnMusicToEnd && isOwnMusic) {
        ownTracks.push(track);
        return;
      }

      if (moveRatedMusicToEnd && hasRatedTrack) {
        regularRatedTracks.push(track);
        return;
      }

      regularUnratedTracks.push(track);
    });

    if (moveOwnMusicToEnd && moveRatedMusicToEnd) {
      return [...regularUnratedTracks, ...ownTracks, ...regularRatedTracks];
    }

    if (moveOwnMusicToEnd) {
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
            if (isRestricted(next) && !canUseRestrictedSorts) return;
            setSort(next);
            updateQueryParam("sort", next);
          }}
        >
          {Object.entries(sorts)
            .filter(
              ([key]) =>
                !(isRestricted(key as GameSort) && !canUseRestrictedSorts),
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
          selectedValue={jamId}
          onSelect={(key) => {
            hasUserSelected.current = true;
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
          <SidebarSong
            key={track.id ?? index}
            slug={track.slug}
            trackId={track.id}
            name={track.name}
            artist={track.composer}
            thumbnail={track.game.thumbnail || "/images/D2J_Icon.png"}
            game={track.game}
            song={track.url}
            license={track.license}
            allowDownload={track.allowDownload}
            allowBackgroundUse={track.allowBackgroundUse}
            allowBackgroundUseAttribution={track.allowBackgroundUseAttribution}
            showRating={
              Boolean(user) &&
              !track.game?.team?.users?.some(
                (member) => member.id === user?.id,
              ) &&
              currentJamId != null &&
              String(track.game?.jamId ?? "") === currentJamId &&
              (activeJamPhase === "Rating" ||
                activeJamPhase === "Submission") &&
              Boolean(trackOverallCategory)
            }
            hideRatings={effectiveHideRatings}
            ratingValue={track.id ? (trackSelectedStars[track.id] ?? 0) : 0}
            ratingDisabled={
              !user ||
              track.game?.team?.users?.some(
                (member) => member.id === user.id,
              ) ||
              currentJamId == null ||
              String(track.game?.jamId ?? "") !== currentJamId ||
              (activeJamPhase !== "Rating" &&
                activeJamPhase !== "Submission") ||
              !trackOverallCategory
            }
            onRate={async (value) => {
              if (!track.id || !trackOverallCategory) return;

              const previous = trackSelectedStars[track.id] ?? 0;
              emitTrackRatingSync({
                trackId: track.id,
                categoryId: trackOverallCategory.id,
                value,
              });
              setTrackSelectedStars((prev) => ({
                ...prev,
                [track.id!]: value,
              }));

              const response = await postTrackRating(
                track.id,
                trackOverallCategory.id,
                value,
              );

              if (!response.ok) {
                const payload = await response.json().catch(() => null);
                addToast({
                  title: payload?.message ?? "Failed to save track rating",
                });
                emitTrackRatingSync({
                  trackId: track.id,
                  categoryId: trackOverallCategory.id,
                  value: previous,
                });
                setTrackSelectedStars((prev) => ({
                  ...prev,
                  [track.id!]: previous,
                }));
              }
            }}
          />
        ))}
        {displayedMusic.length === 0 && !jamDetecting && (
          <Text color="textFaded">No tracks found.</Text>
        )}
      </Vstack>
    </Vstack>
  );
}
