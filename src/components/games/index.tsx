"use client";

import { GameType } from "@/types/GameType";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameSort } from "@/types/GameSort";
import { useSearchParams, useRouter } from "next/navigation";
import { getGames } from "@/requests/game";
import { UserType } from "@/types/UserType";
import { getSelf } from "@/requests/user";
import { IconName } from "@/framework/Icon";
import Dropdown from "@/framework/Dropdown";
import { GameCard } from "../gamecard";
import { Spinner } from "@/framework/Spinner";
import { Hstack, Vstack } from "@/framework/Stack";
import { Card } from "@/framework/Card";
import Text from "@/framework/Text";

import { getCurrentJam } from "@/helpers/jam";
import { getJams } from "@/requests/jam";

type JamOption = {
  id: string;
  name: string;
  icon?: IconName;
  description?: string;
};

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

const restrictedSorts = new Set<GameSort>(["leastratings", "danger"]);

export default function Games() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [games, setGames] = useState<GameType[]>();
  const [user, setUser] = useState<UserType>();

  const sortParam = (searchParams.get("sort") as GameSort) || "random";
  const [sort, setSort] = useState<GameSort>(
    (["random", "leastratings", "danger"].includes(sortParam) &&
      (sortParam as GameSort)) ||
      "random"
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
    undefined
  );

  const isRestricted = (s: GameSort) => restrictedSorts.has(s);
  const canUseRestrictedSorts = !!currentJamId && jamId === currentJamId;

  const sorts: Record<
    GameSort,
    { name: string; icon: IconName; description: string }
  > = {
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
      router.push(`?${params.toString()}`);
    },
    [router]
  );

  useEffect(() => {
    const isRestricted = restrictedSorts.has(sort);
    const canUseRestrictedSorts = !!currentJamId && jamId === currentJamId;

    if (!canUseRestrictedSorts && isRestricted) {
      setSort("random");
      updateQueryParam("sort", "random");
    }
  }, [sort, jamId, currentJamId, updateQueryParam]);

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
              res?.jam?.jammingHours
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
        const qs = params.toString();
        router.replace(qs ? `?${qs}` : "?");
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
          jamId !== "all" ? jamId : undefined
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

  if (!hasData && (showBusy || jamDetecting)) {
    return (
      <Vstack>
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
                  !(isRestricted(sort[0] as GameSort) && !canUseRestrictedSorts)
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
        </Hstack>
      </Vstack>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {games && games.length > 0 ? (
          games.map((game) => (
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
