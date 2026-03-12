"use client";

import SidebarSong from "@/components/sidebar/SidebarSong";
import { Hstack, Vstack } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { Dropdown } from "bioloom-ui";
import { useTheme } from "@/providers/SiteThemeProvider";
import { BASE_URL } from "@/requests/config";
import { TrackType } from "@/types/TrackType";
import { GameSort } from "@/types/GameSort";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCurrentJam } from "@/helpers/jam";
import { getJams } from "@/requests/jam";
import { IconName } from "bioloom-ui";
import { getTrackTags } from "@/requests/track";
import { TrackTagType } from "@/types/TrackTagType";

type JamOption = {
  id: string;
  name: string;
  icon?: IconName;
  description?: string;
};

function parseMultiValueParam(value: string | null): Set<string> {
  if (!value) return new Set();
  return new Set(
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
  );
}

function serializeMultiValueParam(values: Set<string>): string {
  return Array.from(values).sort().join(",");
}

function formatJamWindow(
  startISO?: string,
  jammingHours?: number
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
  const restrictedSorts = useMemo(
    () => new Set<GameSort>(["karma", "leastratings", "danger", "ratingbalance"]),
    [],
  );

  const [music, setMusic] = useState<TrackType[]>([]);
  const [allTrackTags, setAllTrackTags] = useState<TrackTagType[]>([]);
  const [jamOptions, setJamOptions] = useState<JamOption[]>([]);
  const [jamDetecting, setJamDetecting] = useState<boolean>(true);
  const [currentJamId, setCurrentJamId] = useState<string | null>(null);

  const hasAppliedDefault = useRef(false);
  const hasUserSelected = useRef(false);
  const sortParam = useMemo(() => {
    if (typeof window === "undefined") return "karma";
    return (new URLSearchParams(window.location.search).get("sort") as GameSort) ?? "karma";
  }, []);
  const [sort, setSort] = useState<GameSort>(
    (["karma", "random", "leastratings", "danger", "ratingbalance"].includes(sortParam) &&
      sortParam) ||
      "karma",
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
            new URLSearchParams(window.location.search).get("genres")
          ),
    []
  );
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(
    initialGenresParam
  );
  const initialMoodsParam = useMemo(
    () =>
      typeof window === "undefined"
        ? new Set<string>()
        : parseMultiValueParam(
            new URLSearchParams(window.location.search).get("moods")
          ),
    []
  );
  const [selectedMoods, setSelectedMoods] = useState<Set<string>>(initialMoodsParam);
  const initialUseCasesParam = useMemo(
    () =>
      typeof window === "undefined"
        ? new Set<string>()
        : parseMultiValueParam(
            new URLSearchParams(window.location.search).get("useCases")
          ),
    []
  );
  const [selectedUseCases, setSelectedUseCases] = useState<Set<string>>(
    initialUseCasesParam
  );
  const initialLoopingParam = useMemo(() => {
    if (typeof window === "undefined") return "all";
    return new URLSearchParams(window.location.search).get("looping") ?? "all";
  }, []);
  const [selectedLooping, setSelectedLooping] = useState<string>(initialLoopingParam);

  const updateQueryParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(window.location.search);
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`?${params.toString()}`);
    },
    [router]
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
      router.push(`?${params.toString()}`);
    },
    [router]
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setJamDetecting(true);
      const options: JamOption[] = [{ id: "all", name: "All Jams" }];

      let ratingDefault: string | null = null;
      try {
        const res = await getCurrentJam();
        const isRatingPhase =
          res?.phase === "Rating" ||
          res?.phase === "Submission" ||
          res?.phase === "Jamming";
        const currentJamId = res?.jam?.id?.toString();
        const currentJamName = res?.jam?.name || "Current Jam";

        if (currentJamId) {
          setCurrentJamId(currentJamId);
          options.push({
            id: currentJamId,
            name: currentJamName,
            icon: res?.jam?.icon,
            description: formatJamWindow(
              res?.jam?.startTime,
              res?.jam?.jammingHours
            ),
          });
        }

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
        const qs = params.toString();
        router.replace(qs ? `?${qs}` : "?");
      }

      setJamDetecting(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [router, initialJamParam]);

  const canUseRestrictedSorts = Boolean(currentJamId) && jamId === currentJamId;
  const isRestricted = useCallback(
    (value: GameSort) => restrictedSorts.has(value),
    [restrictedSorts],
  );

  const sorts: Record<GameSort, { name: string; icon: IconName; description: string }> = {
    karma: {
      name: "Karma",
      icon: "sparkles",
      description: "Shows tracks from people who are rating and giving good feedback on music pages",
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
  }, [canUseRestrictedSorts, isRestricted, jamDetecting, sort, updateQueryParam]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const response = await getTrackTags();
      const payload = await response.json().catch(() => null);
      if (cancelled) return;
      setAllTrackTags(Array.isArray(payload?.data) ? payload.data : []);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (jamDetecting) return;

    let cancelled = false;
    (async () => {
      const qs = new URLSearchParams();
      if (jamId && jamId !== "all") qs.set("jamId", jamId);
      qs.set("sort", sort);

      const res = await fetch(
        `${BASE_URL}/tracks${qs.toString() ? `?${qs}` : ""}`
      );
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
      music.flatMap((track) => (track.tags ?? []).map((tag) => String(tag.id)))
    );
  }, [music]);

  const visibleTagsByCategory = useMemo(() => {
    const grouped = new Map<string, TrackTagType[]>();

    tagsByCategory.forEach((tags, categoryName) => {
      const visibleTags = tags.filter((tag) => availableTagIds.has(String(tag.id)));
      if (visibleTags.length > 0) {
        grouped.set(categoryName, visibleTags);
      }
    });

    return grouped;
  }, [availableTagIds, tagsByCategory]);

  const displayedMusic = useMemo(() => {
    return music.filter((track) => {
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

      return true;
    });
  }, [
    music,
    selectedGenres,
    selectedLooping,
    selectedMoods,
    selectedUseCases,
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
            .filter(([key]) => !(isRestricted(key as GameSort) && !canUseRestrictedSorts))
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
              const next = new Set(Array.from(values, (value) => String(value)));
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
              const next = new Set(Array.from(values, (value) => String(value)));
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
              const next = new Set(Array.from(values, (value) => String(value)));
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
      </Hstack>

      {/* List */}
      <Vstack align="stretch" className="w-[488px]">
        {displayedMusic.map((track, index) => (
          <SidebarSong
            key={index}
            slug={track.slug}
            name={track.name}
            artist={track.composer}
            thumbnail={track.game.thumbnail || "/images/D2J_Icon.png"}
            game={track.game}
            song={track.url}
            license={track.license}
            allowDownload={track.allowDownload}
          />
        ))}
        {displayedMusic.length === 0 && !jamDetecting && (
          <Text color="textFaded">No tracks found.</Text>
        )}
      </Vstack>
    </Vstack>
  );
}
