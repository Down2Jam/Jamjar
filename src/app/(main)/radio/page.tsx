"use client";

import {
  getRadioEventsUrl,
  getRadioState,
  reportRadioTrackDuration,
  type RadioStation,
  sendRadioEmote,
  voteRadioTrack,
} from "@/requests/radio";
import { readItem } from "@/requests/helpers";
import { useTheme } from "@/providers/useSiteTheme";
import { useEmojis } from "@/providers/useEmojis";
import {
  addToast,
  Button,
  Card,
  Hstack,
  Icon,
  Input,
  Spinner,
  Text,
  Vstack,
} from "bioloom-ui";
import Link from "@/compat/next-link";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type RadioTrack = {
  id: number;
  slug: string;
  url: string;
  name: string;
  license?: string | null;
  allowDownload?: boolean;
  allowBackgroundUse?: boolean;
  composer: {
    id: number;
    slug: string;
    name: string;
  } | null;
  gamePage: {
    name: string;
    thumbnail?: string | null;
    banner?: string | null;
    screenshots?: string[];
    game: {
      id: number;
      slug: string;
    };
  };
};

type RadioCurrent = {
  track: RadioTrack;
  startedAt: string | null;
  endsAt: string;
  durationSeconds: number;
  offsetSeconds: number;
};

type RadioVoting = {
  round: string;
  options: Array<{
    track: RadioTrack;
    votes: number;
  }>;
  userVoteTrackId: number | null;
  closesAt: string;
};

type RadioEmote = {
  id?: number | string;
  emote: string;
  x?: number | null;
  y?: number | null;
  createdAt?: string;
  user?: {
    id: number;
    slug: string;
    name: string;
  } | null;
};

type FloatingEmote = RadioEmote & {
  key: string;
  startX: number;
  startY: number;
  step1X: number;
  step1Y: number;
  step2X: number;
  step2Y: number;
  step3X: number;
  step3Y: number;
  endX: number;
  endY: number;
  rotation: number;
  scale: number;
  duration: number;
};

type RadioState = {
  enabled: boolean;
  serverTime: string;
  listenerCount: number;
  current: RadioCurrent | null;
  voting: RadioVoting;
  recentEmotes: RadioEmote[];
};

const RADIO_EMOTE_COUNTS_KEY = "d2j-radio-emote-counts";
const RADIO_VOLUME_KEY = "d2j-radio-volume";
const DEFAULT_RADIO_VOLUME = 0.5;
const EMOTE_PICKER_CLOSE_MS = 160;
const EMOTE_PICKER_HOVER_CLOSE_MS = 900;

const formatTime = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const toAudioVolume = (sliderVolume: number) =>
  Math.min(Math.max(sliderVolume, 0), 1) ** 2;

const getTrackThumbnail = (track?: RadioTrack | null) =>
  track?.gamePage.thumbnail || "/images/D2J_Icon.png";

const getTrackBackground = (track?: RadioTrack | null) =>
  track?.gamePage.screenshots?.[0] ||
  track?.gamePage.banner ||
  track?.gamePage.thumbnail ||
  "/images/D2J_Icon_watermark.png";

function RadioLandingChoice({
  station,
  title,
  description,
  state,
}: {
  station: RadioStation;
  title: string;
  description: string;
  state: RadioState | null;
}) {
  const background = getTrackBackground(state?.current?.track);
  const [activeBackground, setActiveBackground] = useState(background);
  const [previousBackground, setPreviousBackground] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (background === activeBackground) return;
    if (!background) {
      setPreviousBackground(activeBackground);
      setActiveBackground(background);
      return;
    }

    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      setPreviousBackground(activeBackground);
      setActiveBackground(background);
    };
    image.onerror = () => {
      if (cancelled) return;
      setPreviousBackground(activeBackground);
      setActiveBackground(background);
    };
    image.src = background;

    return () => {
      cancelled = true;
    };
  }, [activeBackground, background]);

  useEffect(() => {
    if (!previousBackground) return;
    const timeout = window.setTimeout(() => {
      setPreviousBackground(null);
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [previousBackground]);

  return (
    <Link
      href={`/radio/${station}`}
      className="group relative flex min-h-[calc((100vh-48px)/2)] flex-1 overflow-hidden text-white no-underline md:min-h-[calc(100vh-48px)]"
    >
      {previousBackground && (
        <div
          className="radio-background-out absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${previousBackground})` }}
        />
      )}
      {activeBackground && (
        <div
          key={activeBackground}
          className="radio-background-in absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${activeBackground})` }}
        />
      )}
      <div className="absolute inset-0 bg-black/70 transition-colors duration-300 group-hover:bg-black/55" />
      <div className="relative z-10 flex h-full w-full flex-col justify-end gap-3 p-8 md:p-12">
        <Text size="5xl">{title}</Text>
        <Text color="textFaded">{description}</Text>
        {state?.current?.track && (
          <Text size="sm" color="textFaded">
            Playing {state.current.track.name} by{" "}
            {state.current.track.composer?.name ?? "Unknown composer"}
          </Text>
        )}
      </div>
    </Link>
  );
}

export default function RadioLandingPage() {
  const [states, setStates] = useState<Record<RadioStation, RadioState | null>>(
    {
      all: null,
      safe: null,
    },
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [allResponse, safeResponse] = await Promise.all([
        getRadioState("all"),
        getRadioState("safe"),
      ]);
      if (cancelled) return;
      const [allState, safeState] = await Promise.all([
        allResponse.ok ? readItem<RadioState>(allResponse) : null,
        safeResponse.ok ? readItem<RadioState>(safeResponse) : null,
      ]);
      if (!cancelled) {
        setStates({ all: allState, safe: safeState });
      }
    };

    void load();
    const interval = window.setInterval(() => void load(), 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <main className="fixed inset-x-0 bottom-0 top-12 flex flex-col overflow-hidden md:flex-row">
      <RadioLandingChoice
        station="all"
        title="Radio"
        description="All available jam music."
        state={states.all}
      />
      <RadioLandingChoice
        station="safe"
        title="Stream Safe Radio"
        description="Only music marked for background use. Give attribution for the playing track in your stream."
        state={states.safe}
      />
      <style>{`
        .radio-background-in {
          animation: radio-background-in 1200ms ease-out forwards;
          transform-origin: center;
          will-change: opacity, transform, filter;
        }

        .radio-background-out {
          animation: radio-background-out 1200ms ease-out forwards;
          transform-origin: center;
          will-change: opacity, transform, filter;
        }

        @keyframes radio-background-in {
          from {
            opacity: 0;
            filter: blur(10px) saturate(1.15);
            transform: scale(1.05);
          }
          to {
            opacity: 1;
            filter: blur(0) saturate(1);
            transform: scale(1);
          }
        }

        @keyframes radio-background-out {
          from {
            opacity: 1;
            filter: blur(0) saturate(1);
            transform: scale(1);
          }
          to {
            opacity: 0;
            filter: blur(12px) saturate(0.9);
            transform: scale(0.98);
          }
        }
      `}</style>
    </main>
  );
}

export function RadioStationPage({ station }: { station: RadioStation }) {
  const { colors } = useTheme();
  const { emojis, emojiMap, loading: emojisLoading } = useEmojis();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volumeRef = useRef(DEFAULT_RADIO_VOLUME);
  const [volume, setVolumeState] = useState(() => {
    if (typeof window === "undefined") {
      volumeRef.current = DEFAULT_RADIO_VOLUME;
      return DEFAULT_RADIO_VOLUME;
    }
    const raw = window.localStorage.getItem(RADIO_VOLUME_KEY);
    if (raw === null) {
      volumeRef.current = DEFAULT_RADIO_VOLUME;
      return DEFAULT_RADIO_VOLUME;
    }
    const stored = Number(raw);
    const initialVolume = Number.isFinite(stored)
      ? Math.min(Math.max(stored, 0), 1)
      : DEFAULT_RADIO_VOLUME;
    volumeRef.current = initialVolume;
    return initialVolume;
  });
  const [state, setState] = useState<RadioState | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoPlaybackBlocked, setAutoPlaybackBlocked] = useState(false);
  const [startOverlayFading, setStartOverlayFading] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [votingTrackId, setVotingTrackId] = useState<number | null>(null);
  const [localVoteTrackId, setLocalVoteTrackId] = useState<number | null>(null);
  const [sendingEmote, setSendingEmote] = useState<string | null>(null);
  const [emotePickerOpen, setEmotePickerOpen] = useState(false);
  const [emotePickerVisible, setEmotePickerVisible] = useState(false);
  const [emoteSearchOpen, setEmoteSearchOpen] = useState(false);
  const [emoteSearch, setEmoteSearch] = useState("");
  const [personalEmoteCounts, setPersonalEmoteCounts] = useState<
    Record<string, number>
  >({});
  const [floatingEmotes, setFloatingEmotes] = useState<FloatingEmote[]>([]);
  const reactButtonRef = useRef<HTMLButtonElement | null>(null);
  const emotePickerCloseTimer = useRef<number | null>(null);
  const emotePickerOpenedAt = useRef(0);
  const emotePickerOpenedByClick = useRef(false);
  const lastSyncedTrackId = useRef<number | null>(null);
  const autoAttemptedTrackId = useRef<number | null>(null);
  const reportedDurationKey = useRef<string | null>(null);

  const setVolume = useCallback((nextVolume: number) => {
    const normalized = Math.min(Math.max(nextVolume, 0), 1);
    volumeRef.current = normalized;
    setVolumeState(normalized);
    if (audioRef.current) {
      audioRef.current.volume = toAudioVolume(normalized);
    }
    try {
      window.localStorage.setItem(RADIO_VOLUME_KEY, String(normalized));
    } catch {
      // Ignore private browsing/storage failures.
    }
  }, []);

  const ensureRadioAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current;
    const audio = new Audio();
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audio.volume = toAudioVolume(volumeRef.current);
    audioRef.current = audio;
    return audio;
  }, []);

  useEffect(() => {
    const audio = ensureRadioAudio();
    return () => {
      audio.pause();
      audio.src = "";
      if (audioRef.current === audio) {
        audioRef.current = null;
      }
    };
  }, [ensureRadioAudio]);

  const clearEmotePickerCloseTimer = useCallback(() => {
    if (emotePickerCloseTimer.current === null) return;
    window.clearTimeout(emotePickerCloseTimer.current);
    emotePickerCloseTimer.current = null;
  }, []);

  const scheduleEmotePickerClose = useCallback(() => {
    clearEmotePickerCloseTimer();
    emotePickerCloseTimer.current = window.setTimeout(() => {
      setEmotePickerOpen(false);
      emotePickerCloseTimer.current = null;
    }, EMOTE_PICKER_HOVER_CLOSE_MS);
  }, [clearEmotePickerCloseTimer]);

  const openEmotePicker = useCallback(
    (source: "hover" | "click") => {
      clearEmotePickerCloseTimer();
      setEmotePickerOpen((open) => {
        if (open) return open;
        emotePickerOpenedAt.current = performance.now();
        emotePickerOpenedByClick.current = source === "click";
        return true;
      });
    },
    [clearEmotePickerCloseTimer],
  );

  const handleReactButtonClick = useCallback(() => {
    if (!emotePickerOpen) {
      openEmotePicker("click");
      return;
    }

    const openDuration = performance.now() - emotePickerOpenedAt.current;
    if (
      emotePickerOpenedByClick.current ||
      openDuration >= EMOTE_PICKER_HOVER_CLOSE_MS
    ) {
      setEmotePickerOpen(false);
    }
  }, [emotePickerOpen, openEmotePicker]);

  const pushFloatingEmote = useCallback((emote: RadioEmote) => {
    const key = String(
      emote.id ?? `${emote.emote}-${Date.now()}-${Math.random()}`,
    );
    const baseX = emote.x ?? 0.88;
    const availableLeft = Math.max(16, baseX * window.innerWidth - 24);
    const availableRight = Math.max(16, (1 - baseX) * window.innerWidth - 24);
    const maxHorizontal = Math.min(84, availableLeft, availableRight);
    const side = Math.random() < 0.5 ? -1 : 1;
    const startX = Math.round((Math.random() - 0.5) * 18);
    const startY = Math.round((Math.random() - 0.5) * 10);
    const endX = Math.round(
      side * (maxHorizontal * (0.35 + Math.random() * 0.55)),
    );
    const endY = -Math.round(window.innerHeight * (0.3 + Math.random() * 0.12));
    const curve = Math.round(
      -side * maxHorizontal * (0.12 + Math.random() * 0.2),
    );
    const next: FloatingEmote = {
      ...emote,
      key,
      x: baseX,
      y: emote.y ?? 0.78,
      startX,
      startY,
      step1X: Math.round(startX + endX * 0.18 + curve * 0.35),
      step1Y: Math.round(startY + endY * 0.2),
      step2X: Math.round(startX + endX * 0.42 + curve * 0.52),
      step2Y: Math.round(startY + endY * 0.46),
      step3X: Math.round(startX + endX * 0.72 + curve * 0.24),
      step3Y: Math.round(startY + endY * 0.72),
      endX,
      endY,
      rotation: Math.round((Math.random() - 0.5) * 34),
      scale: 0.86 + Math.random() * 0.34,
      duration: 2300 + Math.round(Math.random() * 900),
    };

    setFloatingEmotes((currentEmotes) => [
      ...currentEmotes.filter((item) => item.key !== key),
      next,
    ].slice(-9));
    window.setTimeout(() => {
      setFloatingEmotes((currentEmotes) =>
        currentEmotes.filter((item) => item.key !== key),
      );
    }, next.duration + 150);
  }, []);

  const loadState = useCallback(async () => {
    const response = await getRadioState(station);
    if (!response.ok) {
      throw new Error("Failed to load radio");
    }
    const nextState = await readItem<RadioState>(response);
    setState(nextState);
    setLocalVoteTrackId(nextState?.voting.userVoteTrackId ?? null);
  }, [station]);

  useEffect(() => {
    const audio = ensureRadioAudio();
    const handleEnded = () => {
      lastSyncedTrackId.current = null;
      void loadState().catch((error) => {
        console.warn("Failed to refresh radio after track ended", error);
      });
    };

    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, [ensureRadioAudio, loadState]);

  useEffect(() => {
    let cancelled = false;

    loadState()
      .catch((error) => {
        console.error(error);
        if (!cancelled) {
          addToast({ title: "Failed to load radio" });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    const source = new EventSource(getRadioEventsUrl(station));
    const setFullState = (event: MessageEvent) => {
      try {
        setState(JSON.parse(event.data) as RadioState);
      } catch (error) {
        console.error("Failed to parse radio state event", error);
      }
    };

    source.addEventListener("state", setFullState);
    source.addEventListener("track.changed", setFullState);
    source.addEventListener("vote.updated", (event) => {
      try {
        const voting = JSON.parse(event.data) as RadioVoting;
        setState((currentState) =>
          currentState
            ? {
                ...currentState,
                voting: {
                  ...voting,
                  userVoteTrackId: currentState.voting.userVoteTrackId,
                },
              }
            : currentState,
        );
      } catch (error) {
        console.error("Failed to parse radio vote event", error);
      }
    });
    source.addEventListener("listener.count", (event) => {
      try {
        const payload = JSON.parse(event.data) as { listenerCount: number };
        setState((currentState) =>
          currentState
            ? { ...currentState, listenerCount: payload.listenerCount }
            : currentState,
        );
      } catch (error) {
        console.error("Failed to parse listener event", error);
      }
    });
    source.addEventListener("emote", (event) => {
      try {
        const emote = JSON.parse(event.data) as RadioEmote;
        pushFloatingEmote(emote);
        setState((currentState) =>
          currentState
            ? {
                ...currentState,
                recentEmotes: [emote, ...currentState.recentEmotes].slice(
                  0,
                  16,
                ),
              }
            : currentState,
        );
      } catch (error) {
        console.error("Failed to parse radio emote event", error);
      }
    });

    return () => {
      cancelled = true;
      source.close();
    };
  }, [loadState, pushFloatingEmote, station]);

  useEffect(() => {
    if (!loading) {
      setShowLoadingSpinner(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      setShowLoadingSpinner(true);
    }, 280);
    return () => window.clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const currentTrack = state?.current?.track ?? null;
  const backgroundImage = getTrackBackground(currentTrack);
  const [activeBackgroundImage, setActiveBackgroundImage] =
    useState(backgroundImage);
  const [previousBackgroundImage, setPreviousBackgroundImage] = useState<
    string | null
  >(null);

  const timing = useMemo(() => {
    if (!state?.current) {
      return {
        elapsedSeconds: 0,
        remainingSeconds: 0,
        progress: 0,
      };
    }

    const endsAt = new Date(state.current.endsAt).getTime();
    const serverTime = new Date(state.serverTime).getTime();
    const clientDrift = now - serverTime;
    const remainingSeconds = Math.max(
      0,
      (endsAt - serverTime - clientDrift) / 1000,
    );
    const elapsedSeconds = Math.min(
      state.current.durationSeconds,
      Math.max(0, state.current.durationSeconds - remainingSeconds),
    );

    return {
      elapsedSeconds,
      remainingSeconds,
      progress:
        state.current.durationSeconds > 0
          ? Math.min(
              100,
              (elapsedSeconds / state.current.durationSeconds) * 100,
            )
          : 0,
    };
  }, [now, state]);

  const trackIsFinishing =
    Boolean(currentTrack) &&
    timing.remainingSeconds > 0 &&
    timing.remainingSeconds <= 2.4;

  useEffect(() => {
    if (backgroundImage === activeBackgroundImage) return;
    let cancelled = false;
    const image = new Image();

    image.onload = () => {
      if (cancelled) return;
      setPreviousBackgroundImage(activeBackgroundImage);
      setActiveBackgroundImage(backgroundImage);
    };
    image.onerror = () => {
      if (cancelled) return;
      setPreviousBackgroundImage(activeBackgroundImage);
      setActiveBackgroundImage(backgroundImage);
    };
    image.src = backgroundImage;

    return () => {
      cancelled = true;
    };
  }, [activeBackgroundImage, backgroundImage]);

  useEffect(() => {
    if (!previousBackgroundImage) return;
    const timeout = window.setTimeout(() => {
      setPreviousBackgroundImage(null);
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [previousBackgroundImage]);

  const reactionEmojis = useMemo(() => {
    const hasPersonalCounts = Object.values(personalEmoteCounts).some(
      (count) => count > 0,
    );
    return [...emojis]
      .sort((a, b) => {
        if (hasPersonalCounts) {
          const personalDelta =
            (personalEmoteCounts[b.slug] ?? 0) -
            (personalEmoteCounts[a.slug] ?? 0);
          if (personalDelta !== 0) return personalDelta;
        } else {
          const globalDelta = (b.globalUseCount ?? 0) - (a.globalUseCount ?? 0);
          if (globalDelta !== 0) return globalDelta;
        }
        return a.slug.localeCompare(b.slug);
      })
      .slice(0, 8);
  }, [emojis, personalEmoteCounts]);

  const filteredSearchEmojis = useMemo(() => {
    const query = emoteSearch.trim().toLowerCase();
    return [...emojis]
      .filter((emoji) => !query || emoji.slug.includes(query))
      .sort((a, b) => {
        const personalDelta =
          (personalEmoteCounts[b.slug] ?? 0) -
          (personalEmoteCounts[a.slug] ?? 0);
        if (personalDelta !== 0) return personalDelta;
        const globalDelta = (b.globalUseCount ?? 0) - (a.globalUseCount ?? 0);
        if (globalDelta !== 0) return globalDelta;
        return a.slug.localeCompare(b.slug);
      })
      .slice(0, 18);
  }, [emojis, emoteSearch, personalEmoteCounts]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RADIO_EMOTE_COUNTS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object") return;
      const nextCounts: Record<string, number> = {};
      for (const [slug, count] of Object.entries(parsed)) {
        if (
          typeof slug === "string" &&
          typeof count === "number" &&
          count > 0
        ) {
          nextCounts[slug] = count;
        }
      }
      setPersonalEmoteCounts(nextCounts);
    } catch {
      // Ignore invalid local preference data.
    }
  }, []);

  useEffect(() => {
    if (emotePickerOpen) {
      setEmotePickerVisible(true);
      return;
    }

    const timeout = window.setTimeout(() => {
      setEmotePickerVisible(false);
    }, EMOTE_PICKER_CLOSE_MS);
    return () => window.clearTimeout(timeout);
  }, [emotePickerOpen]);

  useEffect(() => {
    if (emotePickerOpen) return;
    setEmoteSearchOpen(false);
    setEmoteSearch("");
  }, [emotePickerOpen]);

  useEffect(() => {
    if (!state || localVoteTrackId === null) return;
    if (
      !state.voting.options.some(
        (option) => option.track.id === localVoteTrackId,
      )
    ) {
      setLocalVoteTrackId(null);
    }
  }, [localVoteTrackId, state]);

  useEffect(() => clearEmotePickerCloseTimer, [clearEmotePickerCloseTimer]);

  const playCurrentTrack = useCallback(
    async (options?: { keepStartOverlay?: boolean }) => {
      if (!state?.current) return false;
      const audio = ensureRadioAudio();
      const track = state.current.track;
      const elapsedSeconds = Math.min(
        Math.max(0, timing.elapsedSeconds),
        Math.max(0, state.current.durationSeconds - 0.25),
      );
      const targetUrl = new URL(track.url, window.location.href).toString();

      if (audio.src !== targetUrl) {
        audio.src = targetUrl;
        audio.load();
      }

      audio.volume = toAudioVolume(volume);

      const seekToLivePosition = () => {
        try {
          audio.currentTime = elapsedSeconds;
        } catch {
          // Some browsers only allow seeking after metadata is available.
        }
      };
      const reportDuration = () => {
        const durationSeconds = audio.duration;
        if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return;
        const key = `${station}:${track.id}:${Math.round(durationSeconds)}`;
        if (reportedDurationKey.current === key) return;
        reportedDurationKey.current = key;
        void reportRadioTrackDuration(track.id, durationSeconds, station)
          .then(async (response) => {
            if (!response.ok) return;
            const nextState = await readItem<RadioState>(response);
            setState(nextState);
            setLocalVoteTrackId(nextState?.voting.userVoteTrackId ?? null);
          })
          .catch((error) => {
            console.warn("Failed to report radio track duration", error);
          });
      };

      if (audio.readyState > 0) {
        seekToLivePosition();
        reportDuration();
      } else {
        audio.addEventListener(
          "loadedmetadata",
          () => {
            seekToLivePosition();
            reportDuration();
          },
          { once: true },
        );
      }

      await audio.play();
      seekToLivePosition();
      reportDuration();
      lastSyncedTrackId.current = track.id;
      setIsListening(true);
      if (!options?.keepStartOverlay) {
        setAutoPlaybackBlocked(false);
      }
      return true;
    },
    [ensureRadioAudio, station, state, timing.elapsedSeconds, volume],
  );

  const startListening = useCallback(async () => {
    try {
      const started = await playCurrentTrack({ keepStartOverlay: true });
      if (!started) return;
      setStartOverlayFading(true);
      window.setTimeout(() => {
        setAutoPlaybackBlocked(false);
        setStartOverlayFading(false);
      }, 420);
    } catch (error) {
      console.warn("Radio playback was blocked", error);
      setStartOverlayFading(false);
      setAutoPlaybackBlocked(true);
    }
  }, [playCurrentTrack]);

  useEffect(() => {
    if (!state?.current) return;
    if (autoAttemptedTrackId.current === state.current.track.id) return;

    void playCurrentTrack()
      .then((started) => {
        if (started) {
          autoAttemptedTrackId.current = state.current?.track.id ?? null;
        }
      })
      .catch((error) => {
        autoAttemptedTrackId.current = state.current?.track.id ?? null;
        console.warn("Radio autoplay was blocked", error);
        setAutoPlaybackBlocked(true);
      });
  }, [playCurrentTrack, state?.current]);

  useEffect(() => {
    if (!isListening || !state?.current || autoPlaybackBlocked) return;
    if (lastSyncedTrackId.current === state.current.track.id) return;

    void playCurrentTrack().catch((error) => {
      console.warn("Failed to sync radio track", error);
      setAutoPlaybackBlocked(true);
    });
  }, [autoPlaybackBlocked, isListening, playCurrentTrack, state?.current]);

  const vote = async (trackId: number) => {
    if (votingTrackId !== null) return;
    const previousState = state;
    const previousLocalVoteTrackId = localVoteTrackId;
    try {
      setVotingTrackId(trackId);
      setLocalVoteTrackId(trackId);
      setState((currentState) => {
        if (!currentState) return currentState;
        const previousVoteTrackId = previousLocalVoteTrackId;
        if (previousVoteTrackId === trackId) return currentState;

        return {
          ...currentState,
          voting: {
            ...currentState.voting,
            userVoteTrackId: trackId,
            options: currentState.voting.options.map((option) => {
              const wasPreviousVote = option.track.id === previousVoteTrackId;
              const isNextVote = option.track.id === trackId;
              return {
                ...option,
                votes: Math.max(
                  0,
                  option.votes +
                    (isNextVote ? 1 : 0) -
                    (wasPreviousVote ? 1 : 0),
                ),
              };
            }),
          },
        };
      });

      const response = await voteRadioTrack(trackId, station);
      if (response.status === 401) {
        setState(previousState);
        setLocalVoteTrackId(previousLocalVoteTrackId);
        addToast({ title: "Log in to vote for the next track" });
        return;
      }
      if (!response.ok) {
        setState(previousState);
        setLocalVoteTrackId(previousLocalVoteTrackId);
        addToast({ title: "Failed to vote" });
        return;
      }
      const nextState = await readItem<RadioState>(response);
      if (nextState) {
        setState(nextState);
        setLocalVoteTrackId(nextState.voting.userVoteTrackId ?? trackId);
      }
    } finally {
      setVotingTrackId(null);
    }
  };

  const sendEmote = async (emote: string) => {
    const rect = reactButtonRef.current?.getBoundingClientRect();
    const position = rect
      ? {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        }
      : { x: 0.88, y: 0.78 };

    try {
      setSendingEmote(emote);
      setEmotePickerOpen(false);
      const pickerCloseStartedAt = performance.now();
      const response = await sendRadioEmote(emote, position, station);
      if (response.status === 401) {
        addToast({ title: "Log in to send radio emotes" });
        return;
      }
      if (!response.ok) {
        addToast({ title: "Failed to send emote" });
        return;
      }
      const sentEmote = (await response.json().catch(() => null)) as
        | RadioEmote
        | null;
      if (sentEmote) {
        pushFloatingEmote(sentEmote);
        setState((currentState) =>
          currentState
            ? {
                ...currentState,
                recentEmotes: [sentEmote, ...currentState.recentEmotes].slice(
                  0,
                  16,
                ),
              }
            : currentState,
        );
      }
      const remainingCloseMs = Math.max(
        0,
        EMOTE_PICKER_CLOSE_MS - (performance.now() - pickerCloseStartedAt),
      );
      window.setTimeout(() => {
        setPersonalEmoteCounts((currentCounts) => {
          const nextCounts = {
            ...currentCounts,
            [emote]: (currentCounts[emote] ?? 0) + 1,
          };
          window.localStorage.setItem(
            RADIO_EMOTE_COUNTS_KEY,
            JSON.stringify(nextCounts),
          );
          return nextCounts;
        });
      }, remainingCloseMs);
    } finally {
      setSendingEmote(null);
    }
  };

  if (loading) {
    return (
      <main className="fixed inset-x-0 bottom-0 top-12 overflow-hidden bg-black">
        <div className="absolute inset-0 bg-[url('/images/sitebg.png')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-black/75" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />
        <div className="relative z-10 flex h-full flex-col justify-between p-5 sm:p-8">
          <Vstack align="start" className="gap-3 text-white">
            <Text size="5xl">Radio</Text>
            <Hstack className="items-center gap-1.5 opacity-70">
              <Icon name="users" size={14} color="text" />
              <Text size="sm">Loading listeners</Text>
            </Hstack>
            <Hstack className="items-center gap-2 opacity-70">
              <Icon name="volume2" size={15} color="text" />
              <div className="h-1 w-32 rounded-full bg-white/25" />
            </Hstack>
          </Vstack>
          <div />
        </div>
        <div className="fixed right-4 top-16 z-30 w-[18rem] max-w-[calc(100vw-32px)] text-white drop-shadow-lg sm:right-6 sm:top-20">
          <Vstack align="stretch" className="gap-2 opacity-75">
            <Vstack align="start" className="gap-1">
              <Text>Next Up</Text>
              <Text color="textFaded" size="xs">
                Vote for what plays after this track.
              </Text>
            </Vstack>
            <Vstack align="stretch" className="gap-1">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="grid min-h-12 grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 rounded-md p-1.5"
                >
                  <div className="h-9 w-9 rounded bg-white/15" />
                  <Vstack align="start" className="min-w-0 gap-1">
                    <div className="h-3 w-32 rounded bg-white/20" />
                    <div className="h-2 w-20 rounded bg-white/15" />
                  </Vstack>
                  <div className="h-3 w-4 rounded bg-white/15" />
                  <div className="col-span-3 h-1 overflow-hidden rounded-full bg-white/10" />
                </div>
              ))}
            </Vstack>
          </Vstack>
        </div>
        <div className="fixed bottom-6 left-6 z-30 flex max-w-[calc(100vw-96px)] items-center gap-4 text-white opacity-75 drop-shadow-lg">
          <div className="h-24 w-24 rounded bg-white/15" />
          <Vstack align="start" className="gap-2">
            <div className="h-5 w-56 rounded bg-white/20" />
            <div className="h-3 w-32 rounded bg-white/15" />
            <div className="h-3 w-24 rounded bg-white/15" />
            <div className="h-1.5 w-52 rounded-full bg-white/20" />
          </Vstack>
        </div>
        {showLoadingSpinner && (
          <div className="fixed inset-x-0 bottom-0 top-12 z-40 flex items-center justify-center">
            <Spinner />
          </div>
        )}
      </main>
    );
  }

  if (!state?.enabled) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
        <Card>
          <Vstack align="start" className="gap-2">
            <Text size="2xl">Radio</Text>
            <Text color="textFaded">
              The music radio is not active right now.
            </Text>
          </Vstack>
        </Card>
      </main>
    );
  }

  const votingTotal = state.voting.options.reduce(
    (total, option) => total + option.votes,
    0,
  );

  return (
    <main className="fixed inset-x-0 bottom-0 top-12 overflow-hidden">
      {previousBackgroundImage && (
        <div
          className="radio-background-out absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${previousBackgroundImage})` }}
        />
      )}
      <div
        key={activeBackgroundImage}
        className="radio-background-in absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${activeBackgroundImage})` }}
      />
      <div className="absolute inset-0 bg-black/65" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />

      {floatingEmotes.map((emote) => {
        const emoji = emojiMap[emote.emote];
        if (!emoji) return null;
        return (
          <img
            key={emote.key}
            src={emoji.image}
            alt={`:${emote.emote}:`}
            className="radio-floating-emote pointer-events-none fixed z-50 h-12 w-12"
            style={
              {
                left: `${(emote.x ?? 0.88) * 100}vw`,
                top: `${(emote.y ?? 0.78) * 100}vh`,
                "--radio-start-x": `${emote.startX}px`,
                "--radio-start-y": `${emote.startY}px`,
                "--radio-step1-x": `${emote.step1X}px`,
                "--radio-step1-y": `${emote.step1Y}px`,
                "--radio-step2-x": `${emote.step2X}px`,
                "--radio-step2-y": `${emote.step2Y}px`,
                "--radio-step3-x": `${emote.step3X}px`,
                "--radio-step3-y": `${emote.step3Y}px`,
                "--radio-end-x": `${emote.endX}px`,
                "--radio-end-y": `${emote.endY}px`,
                "--radio-rotation": `${emote.rotation}deg`,
                "--radio-scale": emote.scale,
                "--radio-float-duration": `${emote.duration}ms`,
              } as CSSProperties
            }
          />
        );
      })}

      <div className="relative z-10 flex h-full flex-col justify-between p-5 sm:p-8">
        <Hstack justify="between" className="items-start gap-4">
          <Vstack align="start" className="gap-3 text-white">
            <Text size="5xl">Radio</Text>
            <Hstack className="items-center gap-1.5">
              <Icon name="users" size={14} color="text" />
              <Text size="sm">{state.listenerCount} listening</Text>
            </Hstack>
            <Hstack className="items-center gap-2 text-white">
              <Icon name="volume2" size={15} color="text" />
              <input
                aria-label="Radio volume"
                type="range"
                min={0}
                max={100}
                value={Math.round(volume * 100)}
                onChange={(event) =>
                  setVolume(Number(event.currentTarget.value) / 100)
                }
                className="radio-volume-slider h-4 w-32 cursor-pointer"
              />
              <Text size="xs" color="textFaded">
                {Math.round(volume * 100)}%
              </Text>
            </Hstack>
          </Vstack>
        </Hstack>

        <div />
      </div>

      {currentTrack && autoPlaybackBlocked && (
        <div
          className={`radio-start-overlay fixed inset-x-0 bottom-0 top-12 z-[60] flex items-center justify-center bg-black/78 backdrop-blur-sm ${
            startOverlayFading ? "radio-start-overlay-fading" : ""
          }`}
        >
          <button
            type="button"
            className="flex cursor-pointer items-center gap-2 text-lg font-semibold text-white drop-shadow-xl transition-transform duration-200 hover:scale-110"
            onClick={() => void startListening()}
          >
            <Icon name="play" size={22} color="text" />
            <span>Start listening</span>
          </button>
        </div>
      )}

      <div className="fixed right-4 top-16 z-30 w-[18rem] max-w-[calc(100vw-32px)] text-white drop-shadow-lg sm:right-6 sm:top-20">
        <Vstack align="stretch" className="gap-2">
          <Vstack align="start" className="gap-1">
            <Text>Next Up</Text>
            <Text color="textFaded" size="xs">
              Vote for what plays after this track.
            </Text>
          </Vstack>

          <Vstack align="stretch" className="gap-1">
            {state.voting.options.map((option) => {
              const selected = localVoteTrackId === option.track.id;
              const votePercent =
                votingTotal > 0 ? (option.votes / votingTotal) * 100 : 0;
              return (
                <button
                  key={option.track.id}
                  type="button"
                  className={`grid min-h-12 cursor-pointer grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 rounded-md p-1.5 text-left transition-[background-color,transform] hover:scale-[1.02] disabled:cursor-default ${
                    selected ? "bg-white/10" : "bg-transparent"
                  }`}
                  onClick={() => void vote(option.track.id)}
                  disabled={votingTrackId !== null}
                >
                  <img
                    src={getTrackThumbnail(option.track)}
                    alt={option.track.name}
                    className="aspect-square w-9 rounded object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <Vstack align="start" className="min-w-0 gap-0">
                    <Text size="xs" color={selected ? "blue" : undefined}>
                      {option.track.name}
                    </Text>
                    <Text color="textFaded" size="xs">
                      {option.track.gamePage.name}
                    </Text>
                  </Vstack>
                  <Text color="textFaded" size="sm">
                    {option.votes}
                  </Text>
                  <div className="col-span-3 h-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                        selected ? "bg-blue-400" : "bg-white/70"
                      }`}
                      style={{ width: `${votePercent}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </Vstack>
        </Vstack>
      </div>

      {currentTrack && (
        <div
          key={currentTrack.id}
          className={`radio-track-panel fixed bottom-6 left-6 z-30 flex max-w-[calc(100vw-96px)] items-center gap-4 text-white drop-shadow-lg ${
            trackIsFinishing ? "radio-track-panel-finishing" : ""
          }`}
        >
          <img
            src={getTrackThumbnail(currentTrack)}
            alt={currentTrack.name}
            className={`radio-track-thumb relative z-20 h-24 w-24 rounded object-cover shadow-lg ${
              trackIsFinishing ? "radio-track-thumb-finishing" : ""
            }`}
            loading="eager"
            decoding="async"
          />
          <Vstack
            align="start"
            className={`radio-track-copy relative z-10 min-w-0 gap-0.5 ${
              trackIsFinishing ? "radio-track-copy-finishing" : ""
            }`}
          >
            <Link
              href={`/m/${currentTrack.slug}`}
              className="min-w-0 no-underline"
            >
              <Text size="xl">{currentTrack.name}</Text>
            </Link>
            <Link
              href={`/g/${currentTrack.gamePage.game.slug}`}
              className="no-underline"
            >
              <Text size="sm" color="textFaded">
                {currentTrack.gamePage.name}
              </Text>
            </Link>
            {currentTrack.composer && (
              <Link
                href={`/u/${currentTrack.composer.slug}`}
                className="no-underline"
              >
                <Text size="sm" color="textFaded">
                  {currentTrack.composer.name}
                </Text>
              </Link>
            )}
            <div className="mt-1 h-1.5 w-52 max-w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${timing.progress}%` }}
              />
            </div>
            <Text size="xs" color="textFaded">
              {formatTime(timing.elapsedSeconds)} /{" "}
              {formatTime(state.current?.durationSeconds ?? 0)}
            </Text>
          </Vstack>
        </div>
      )}

      <div
        className="fixed bottom-6 right-6 z-40"
        onMouseEnter={() => openEmotePicker("hover")}
        onMouseLeave={scheduleEmotePickerClose}
      >
        {emotePickerVisible && (
          <div
            className={`radio-emote-picker absolute bottom-12 right-0 grid w-36 grid-cols-3 gap-2 ${
              emotePickerOpen
                ? "radio-emote-picker-open"
                : "radio-emote-picker-closed"
            }`}
          >
            {emojisLoading ? (
              <Spinner />
            ) : (
              reactionEmojis.map((emoji) => (
                <button
                  key={emoji.id}
                  type="button"
                  className="flex aspect-square w-full cursor-pointer items-center justify-center transition-transform hover:scale-110 disabled:cursor-not-allowed"
                  title={`:${emoji.slug}:`}
                  disabled={sendingEmote === emoji.slug}
                  onClick={() => void sendEmote(emoji.slug)}
                >
                  <img
                    src={emoji.image}
                    alt={`:${emoji.slug}:`}
                    className="h-8 w-8 object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))
            )}
            <button
              type="button"
              className="flex aspect-square w-full cursor-pointer items-center justify-center text-white drop-shadow-lg transition-transform hover:scale-110"
              title="Search emotes"
              onClick={() => setEmoteSearchOpen((open) => !open)}
            >
              <Icon name="search" />
            </button>
          </div>
        )}
        {emotePickerOpen && emoteSearchOpen && (
          <div className="absolute bottom-12 right-40 flex w-64 flex-col gap-2 rounded-md bg-black/75 p-3 shadow-xl backdrop-blur">
            <Input
              autoFocus
              size="sm"
              value={emoteSearch}
              onValueChange={setEmoteSearch}
              placeholder="Search emotes"
            />
            <div className="grid max-h-56 grid-cols-6 gap-2 overflow-y-auto">
              {filteredSearchEmojis.map((emoji) => (
                <button
                  key={emoji.id}
                  type="button"
                  className="flex aspect-square w-full cursor-pointer items-center justify-center transition-transform hover:scale-110 disabled:cursor-not-allowed"
                  title={`:${emoji.slug}:`}
                  disabled={sendingEmote === emoji.slug}
                  onClick={() => void sendEmote(emoji.slug)}
                >
                  <img
                    src={emoji.image}
                    alt={`:${emoji.slug}:`}
                    className="h-7 w-7 object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
        <button
          ref={reactButtonRef}
          type="button"
          className="flex h-10 w-10 cursor-pointer items-center justify-center text-white drop-shadow-lg transition-transform hover:scale-110"
          title="React"
          onClick={handleReactButtonClick}
        >
          <Icon name="smileplus" />
        </button>
      </div>

      <style>{`
        .radio-background-in {
          animation: radio-background-in 1200ms ease-out forwards;
          transform-origin: center;
          will-change: opacity, transform, filter;
        }

        .radio-background-out {
          animation: radio-background-out 1200ms ease-out forwards;
          transform-origin: center;
          will-change: opacity, transform, filter;
        }

        .radio-start-overlay {
          opacity: 0;
          animation: radio-start-overlay-in 320ms ease-out forwards;
          transition: opacity 420ms ease;
        }

        .radio-start-overlay-fading {
          animation: none;
          opacity: 0;
          pointer-events: none;
        }

        @keyframes radio-start-overlay-in {
          from {
            opacity: 0;
            backdrop-filter: blur(0);
          }
          to {
            opacity: 1;
            backdrop-filter: blur(4px);
          }
        }

        .radio-volume-slider {
          appearance: none;
          background: transparent;
        }

        .radio-volume-slider::-webkit-slider-runnable-track {
          height: 4px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.28);
        }

        .radio-volume-slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          margin-top: -4px;
          border-radius: 999px;
          background: #ffffff;
          box-shadow: 0 0 12px rgba(255, 255, 255, 0.35);
          transition: transform 160ms ease;
        }

        .radio-volume-slider:hover::-webkit-slider-thumb {
          transform: scale(1.18);
        }

        .radio-volume-slider::-moz-range-track {
          height: 4px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.28);
        }

        .radio-volume-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border: 0;
          border-radius: 999px;
          background: #ffffff;
          box-shadow: 0 0 12px rgba(255, 255, 255, 0.35);
          transition: transform 160ms ease;
        }

        .radio-volume-slider:hover::-moz-range-thumb {
          transform: scale(1.18);
        }

        @keyframes radio-background-in {
          from {
            opacity: 0;
            filter: blur(10px) saturate(1.15);
            transform: scale(1.05);
          }
          to {
            opacity: 1;
            filter: blur(0) saturate(1);
            transform: scale(1);
          }
        }

        @keyframes radio-background-out {
          from {
            opacity: 1;
            filter: blur(0) saturate(1);
            transform: scale(1);
          }
          to {
            opacity: 0;
            filter: blur(12px) saturate(0.9);
            transform: scale(0.985);
          }
        }

        .radio-track-panel {
          animation: radio-track-panel-in 720ms cubic-bezier(0.2, 0.9, 0.22, 1)
            both;
          transform-origin: left bottom;
          will-change: transform, opacity;
        }

        .radio-track-thumb {
          animation: radio-track-thumb-in 760ms cubic-bezier(0.2, 0.9, 0.22, 1)
            both;
          transform-origin: center;
          will-change: transform, opacity;
        }

        .radio-track-copy {
          animation: radio-track-copy-in 820ms 260ms
            cubic-bezier(0.2, 0.9, 0.22, 1) both;
          transform-origin: left center;
          will-change: transform, opacity;
        }

        .radio-track-panel-finishing .radio-track-copy,
        .radio-track-copy-finishing {
          animation: radio-track-copy-finish 900ms
            cubic-bezier(0.55, 0, 0.25, 1) forwards;
        }

        .radio-track-panel-finishing .radio-track-thumb,
        .radio-track-thumb-finishing {
          animation: radio-track-thumb-finish 760ms 620ms
            cubic-bezier(0.55, 0, 0.25, 1) forwards;
        }

        @keyframes radio-track-panel-in {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes radio-track-thumb-in {
          from {
            opacity: 0;
            transform: translateX(-160px) rotate(-220deg) scale(1);
          }
          68% {
            opacity: 1;
            transform: translateX(4px) rotate(4deg) scale(1);
          }
          to {
            opacity: 1;
            transform: translateX(0) rotate(0deg) scale(1);
          }
        }

        @keyframes radio-track-copy-in {
          from {
            opacity: 0;
            transform: translateX(-72px) scale(0.34);
          }
          45% {
            opacity: 0;
            transform: translateX(-72px) scale(0.34);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes radio-track-copy-finish {
          from {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateX(-72px) scale(0.34);
          }
        }

        @keyframes radio-track-thumb-finish {
          from {
            opacity: 1;
            transform: translateX(0) rotate(0deg) scale(1);
          }
          to {
            opacity: 0;
            transform: translateX(-160px) rotate(-220deg) scale(1);
          }
        }

        @keyframes radio-emote-float {
          0% {
            opacity: 0;
            transform: translate(
                calc(-50% + var(--radio-start-x)),
                calc(-50% + var(--radio-start-y))
              )
              rotate(0deg) scale(0);
          }
          12% {
            opacity: 1;
            transform: translate(
                calc(-50% + var(--radio-start-x)),
                calc(-50% + var(--radio-start-y) - 18px)
              )
              rotate(calc(var(--radio-rotation) * 0.18))
              scale(calc(var(--radio-scale) * 1.08));
          }
          28% {
            opacity: 1;
            transform: translate(
                calc(-50% + var(--radio-step1-x)),
                calc(-50% + var(--radio-step1-y))
              )
              rotate(calc(var(--radio-rotation) * 0.32))
              scale(calc(var(--radio-scale) * 0.9));
          }
          48% {
            opacity: 0.92;
            transform: translate(
                calc(-50% + var(--radio-step2-x)),
                calc(-50% + var(--radio-step2-y))
              )
              rotate(calc(var(--radio-rotation) * 0.58))
              scale(calc(var(--radio-scale) * 0.74));
          }
          72% {
            opacity: 0.58;
            transform: translate(
                calc(-50% + var(--radio-step3-x)),
                calc(-50% + var(--radio-step3-y))
              )
              rotate(calc(var(--radio-rotation) * 0.82))
              scale(calc(var(--radio-scale) * 0.56));
          }
          100% {
            opacity: 0;
            transform: translate(
                calc(-50% + var(--radio-end-x)),
                calc(-50% + var(--radio-end-y))
              )
              rotate(var(--radio-rotation))
              scale(calc(var(--radio-scale) * 0.34));
          }
        }

        .radio-floating-emote {
          animation: radio-emote-float var(--radio-float-duration) linear
            forwards;
          will-change: transform, opacity;
        }

        .radio-emote-picker {
          transform-origin: bottom right;
          will-change: transform, opacity;
        }

        .radio-emote-picker-open {
          animation: radio-emote-picker-in 160ms
            cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .radio-emote-picker-closed {
          animation: radio-emote-picker-out 140ms ease-in forwards;
          pointer-events: none;
        }

        @keyframes radio-emote-picker-in {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.86);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes radio-emote-picker-out {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(8px) scale(0.88);
          }
        }
      `}</style>
    </main>
  );
}
