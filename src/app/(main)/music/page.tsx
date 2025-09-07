"use client";

import SidebarSong from "@/components/sidebar/SidebarSong";
import { Hstack, Vstack } from "@/framework/Stack";
import Text from "@/framework/Text";
import Dropdown from "@/framework/Dropdown";
import { useTheme } from "@/providers/SiteThemeProvider";
import { BASE_URL } from "@/requests/config";
import { TrackType } from "@/types/TrackType";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCurrentJam } from "@/helpers/jam";
import { getJams } from "@/requests/jam";

type JamOption = { id: string; name: string };

export default function MusicPage() {
  const { colors } = useTheme();
  const router = useRouter();

  const [music, setMusic] = useState<TrackType[]>([]);
  const [jamOptions, setJamOptions] = useState<JamOption[]>([]);
  const [jamDetecting, setJamDetecting] = useState<boolean>(true);

  const hasAppliedDefault = useRef(false);
  const hasUserSelected = useRef(false);

  // detect initial jam param once (SSR-safe)
  const initialJamParam = useMemo(() => {
    if (typeof window === "undefined") return "all";
    const p = new URLSearchParams(window.location.search).get("jam");
    return p ?? "all";
  }, []);

  const [jamId, setJamId] = useState<string>(initialJamParam);

  // keep a simple helper to update query string
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

  // detect current jam & build dropdown list
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setJamDetecting(true);
      const options: JamOption[] = [{ id: "all", name: "All Jams" }];

      let ratingDefault: string | null = null;
      try {
        const res = await getCurrentJam();
        const isRatingPhase = res?.phase === "Rating";
        const currentJamId = res?.jam?.id?.toString();
        const currentJamName = res?.jam?.name || "Current Jam";

        if (currentJamId) {
          options.push({ id: currentJamId, name: currentJamName });
        }

        // only apply auto default if user didn't specify a jam
        if (isRatingPhase && (initialJamParam === "all" || !initialJamParam)) {
          ratingDefault = currentJamId ?? null;
        }
      } catch {
        // ignore
      }

      // optional: fetch full jam list and dedupe
      try {
        if (typeof getJams === "function") {
          const jr = await getJams();
          const js = await jr.json();
          if (Array.isArray(js)) {
            js.forEach((j) => {
              const id = String(j?.id ?? "");
              if (id && j?.name && !options.find((o) => o.id === id)) {
                options.push({ id, name: j.name });
              }
            });
          }
        }
      } catch {
        // ignore
      }

      if (cancelled) return;

      setJamOptions(options);

      // apply rating default once if appropriate
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

  // load tracks whenever jam changes (skip while detecting to avoid flashes)
  useEffect(() => {
    if (jamDetecting) return;

    let cancelled = false;
    (async () => {
      const qs = new URLSearchParams();
      if (jamId && jamId !== "all") qs.set("jamId", jamId);

      const res = await fetch(
        `${BASE_URL}/tracks${qs.toString() ? `?${qs}` : ""}`
      );
      const json = await res.json();
      if (cancelled) return;

      // expect `{ data: TrackType[] }`
      setMusic(Array.isArray(json?.data) ? json.data : []);
    })();

    return () => {
      cancelled = true;
    };
  }, [jamId, jamDetecting]);

  return (
    <Vstack className="gap-3">
      <p className="text-center text-2xl" style={{ color: colors["text"] }}>
        Music
      </p>
      <Text color="textFaded">All the music uploaded to the site</Text>

      {/* Controls */}
      <Hstack className="gap-3">
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
            <Dropdown.Item key={j.id} value={j.id} icon="gamepad2">
              {j.name}
            </Dropdown.Item>
          ))}
        </Dropdown>
      </Hstack>

      {/* List */}
      <Vstack align="stretch" className="w-[488px]">
        {music.map((track, index) => (
          <SidebarSong
            key={index}
            name={track.name}
            artist={track.composer.name}
            thumbnail={track.game.thumbnail || "/images/D2J_Icon.png"}
            game={track.game.name}
            song={track.url}
          />
        ))}
        {music.length === 0 && !jamDetecting && (
          <Text color="textFaded">No tracks found.</Text>
        )}
      </Vstack>
    </Vstack>
  );
}
