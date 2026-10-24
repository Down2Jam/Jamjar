"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MusicContext,
  type PlayableTrack,
  type TrackType,
} from "./MusicContext";

import { createAudioAnalysis, type AudioAnalysis } from "../lib/waveform";
import { automixFadeCurves, planTransition } from "../lib/transitions";
import {
  fillQueue,
  queueTrackKey,
  type ShufflePreferences,
} from "../lib/queue";

import {
  useListeningHistory,
  type ListeningHistoryOptions,
} from "../hooks/useListeningHistory";
import { restoreSession, sessionTrack } from "../lib/session";
import { readStorage, storageKeys, writeStorage } from "../lib/storage";
import { toPlayableTrack } from "./MusicContext";

export type MusicProviderProps = {
  children: React.ReactNode;
  analysis?: AudioAnalysis;
  history?: ListeningHistoryOptions;
  onPlayback?: (track: TrackType) => void | Promise<void>;
  /** Isolates preferences, playback session, and default local history. */
  storageNamespace?: string;
  /** Rendered inside the music context when a track is selected. */
  player?: React.ReactNode;
};
const emptyAnalysis = createAudioAnalysis();

export function MusicProvider(props: MusicProviderProps) {
  return <PlaybackProvider key={props.storageNamespace ?? ""} {...props} />;
}

function PlaybackProvider({
  children,
  analysis = emptyAnalysis,
  history: historyOptions,
  onPlayback,
  player,
  storageNamespace = "",
}: MusicProviderProps) {
  const keys = useMemo(() => storageKeys(storageNamespace), [storageNamespace]);
  const { getAnalyzedGain, getRhythm, loadWaveform } = analysis;
  const [restored] = useState(() =>
    restoreSession(readStorage(keys.session), readStorage(keys.position)),
  );
  const resumeTime = useRef(restored?.time ?? 0);
  // Negative indices identify explicit additions outside the automatic scope.
  const manualTracks = useRef<(TrackType | null)[]>(restored?.manual ?? []);
  const scopeAnchor = useRef<number | null>(restored?.anchor ?? null);
  const resolveTrack = useCallback(
    (index: number, scope: TrackType[]) =>
      index < 0 ? manualTracks.current[-index - 1] : scope[index],
    [],
  );
  const removedTracks = useRef(new Set(restored?.removed ?? []));
  const playbackRequest = useRef(0);
  const pendingPlayback = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioState, setAudioState] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackScope, setPlaybackScope] = useState<string | null>(
    restored?.playbackScope ?? null,
  );
  const [duration, setDuration] = useState(0);
  const [volume, setVol] = useState(() => {
    const v = parseFloat(readStorage(keys.volume) ?? "");
    return Number.isFinite(v) ? Math.min(Math.max(v, 0), 1) : 0.5;
  });
  const [preferredRepeatState, setPreferredRepeatState] = useState<
    "none" | "repeat" | "autoplay"
  >(() => {
    const v = readStorage(keys.repeat);
    return v === "repeat" || v === "autoplay" || v === "none" ? v : "repeat";
  });
  const [temporaryAutoplay, setTemporaryAutoplay] = useState(
    restored?.temporaryAutoplay ?? false,
  );
  const repeatState = temporaryAutoplay ? "autoplay" : preferredRepeatState;
  const setRepeatState = useCallback((mode: "none" | "repeat" | "autoplay") => {
    setTemporaryAutoplay(false);
    setPreferredRepeatState(mode);
  }, []);
  const [transitionMode, setTransitionModeState] = useState<
    "off" | "crossfade" | "automix"
  >(() => {
    const saved = readStorage(keys.transition);
    return saved === "off" || saved === "crossfade" || saved === "automix"
      ? saved
      : "automix";
  });
  const [transitionLead, setTransitionLead] = useState(0);
  const [currentIndex, setCurrentIndex] = useState<number | null>(
    restored?.current ?? null,
  );
  const nextRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const [backStack, setBackStack] = useState<number[]>(restored?.back ?? []);
  const [shuffle, setShuffle] = useState(
    () => readStorage(keys.shuffle) === "true",
  );
  const [queueOrder, setQueueOrder] = useState<number[]>(restored?.queue ?? []);
  const repeatStateRef = useRef(repeatState);
  const [shown, setShown] = useState(restored?.shown ?? false);
  const [music, setMusic] = useState<TrackType[]>(restored?.tracks ?? []);
  const { history, recordListen } = useListeningHistory({
    storageKey: keys.history,
    ...historyOptions,
  });
  const lastPlayed = useRef<TrackType | null>(null);
  const playCounts = useRef(new Map<string, number>());
  const recentShuffleTracks = useRef<TrackType[]>([]);
  const recordPlayback = useCallback(
    (track: TrackType) => {
      const notifyHost = () => {
        try {
          void Promise.resolve(onPlayback?.(track)).catch((error) =>
            console.warn("Playback callback failed", error),
          );
        } catch (error) {
          console.warn("Playback callback failed", error);
        }
      };
      const previous = lastPlayed.current;
      const sameTrack =
        previous &&
        (track.id != null && previous.id != null
          ? track.id === previous.id
          : track.url === previous.url &&
            track.pageVersion === previous.pageVersion);
      if (sameTrack) {
        notifyHost();
        return;
      }
      const key = queueTrackKey(track);
      playCounts.current.set(key, (playCounts.current.get(key) ?? 0) + 1);
      recentShuffleTracks.current = [
        ...recentShuffleTracks.current.slice(-2),
        track,
      ];
      recordListen(track);
      lastPlayed.current = track;
      notifyHost();
    },
    [recordListen, onPlayback],
  );
  const shufflePreferences = useRef<ShufflePreferences>({});
  shufflePreferences.current = {
    plays: playCounts.current,
    recent: recentShuffleTracks.current,
    automix: transitionMode === "automix" && repeatState === "autoplay",
    tempo: (track, edge) => {
      const rhythm = track.url ? getRhythm(track.url) : null;
      return rhythm &&
        rhythm.confidence >= 0.3 &&
        (edge === "intro" ? rhythm.introConfidence : rhythm.outroConfidence) >=
          0.6
        ? 60 / rhythm.period
        : null;
    },
  };
  const buildQueue = useCallback(
    (
      scope: TrackType[],
      current: number | null,
      pending: number[],
      shuffled: boolean,
    ) => {
      const anchor =
        current != null && current >= 0 ? current : scopeAnchor.current;
      const automatic = fillQueue(
        scope,
        anchor,
        pending.filter((index) => index >= 0),
        shuffled,
        Math.random,
        {
          ...shufflePreferences.current,
          recent: recentShuffleTracks.current,
          blocked: removedTracks.current,
        },
      );
      const retained = [
        ...new Set(
          pending.filter((index) =>
            index < 0
              ? !!manualTracks.current[-index - 1]
              : automatic.includes(index),
          ),
        ),
      ];
      return [
        ...retained,
        ...automatic.filter((index) => !retained.includes(index)),
      ];
    },
    [],
  );
  const [externalTrack, setExternalTrack] = useState<TrackType | null>(
    restored?.external ?? null,
  );
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [analyserState, setAnalyserState] = useState<AnalyserNode | null>(null);

  const decks = useRef(
    new Map<
      HTMLAudioElement,
      { source: MediaElementAudioSourceNode; gain: GainNode; fade: GainNode }
    >(),
  );
  const fading = useRef<{ audio: HTMLAudioElement; timer: number } | null>(
    null,
  );
  const transitionEpoch = useRef(0);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  const releaseAudio = useCallback((audio: HTMLAudioElement) => {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    const deck = decks.current.get(audio);
    deck?.source.disconnect();
    deck?.gain.disconnect();
    deck?.fade.disconnect();
    decks.current.delete(audio);
  }, []);

  const cancelTransition = useCallback(() => {
    transitionEpoch.current++;
    if (fading.current) {
      window.clearTimeout(fading.current.timer);
      releaseAudio(fading.current.audio);
      fading.current = null;
    }
    const active = audioRef.current && decks.current.get(audioRef.current);
    if (active && audioCtxRef.current) {
      active.fade.gain.cancelScheduledValues(audioCtxRef.current.currentTime);
      active.fade.gain.setValueAtTime(1, audioCtxRef.current.currentTime);
    }
  }, [releaseAudio]);

  const connectAudio = useCallback((audio: HTMLAudioElement) => {
    if (!audioCtxRef.current) {
      const AudioContextCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextCtor) return null;
      const ctx = new AudioContextCtor();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      setAnalyserState(analyser);
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") void ctx.resume();
    let deck = decks.current.get(audio);
    if (!deck) {
      const source = ctx.createMediaElementSource(audio);
      const gain = ctx.createGain();
      const fade = ctx.createGain();
      source.connect(gain);
      gain.connect(fade);
      fade.connect(analyserRef.current!);
      deck = { source, gain, fade };
      decks.current.set(audio, deck);
    }
    return deck;
  }, []);

  const ensureAudioContext = useCallback(() => {
    if (audioRef.current)
      gainRef.current = connectAudio(audioRef.current)?.gain ?? null;
  }, [connectAudio]);

  const setTransitionMode = useCallback(
    (mode: "off" | "crossfade" | "automix") => {
      cancelTransition();
      setTransitionModeState(mode);
      writeStorage(keys.transition, mode);
      if (mode !== "off") setRepeatState("autoplay");
    },
    [cancelTransition, setRepeatState, keys],
  );

  const applyLoudnessGain = useCallback((gainDb?: number | null) => {
    const ctx = audioCtxRef.current;
    const gain = gainRef.current;
    if (!ctx || !gain) return;

    const safeGainDb = Number.isFinite(gainDb) ? Number(gainDb) : 0;
    gain.gain.setValueAtTime(10 ** (safeGainDb / 20), ctx.currentTime);
  }, []);

  const startPlayback = useCallback(async (audio: HTMLAudioElement) => {
    const request = ++playbackRequest.current;
    pendingPlayback.current++;
    try {
      await audio.play();
      return request === playbackRequest.current && audio === audioRef.current ? request : false;
    } catch (error) {
      if (request !== playbackRequest.current || audio !== audioRef.current)
        return false;
      throw error;
    } finally {
      pendingPlayback.current--;
    }
  }, []);

  const playIndex = useCallback(
    async (i: number, queue: TrackType[] = music) => {
      const track = resolveTrack(i, queue);
      if (!audioRef.current || !track) return false;
      resumeTime.current = 0;
      cancelTransition();
      ensureAudioContext();
      const audio = audioRef.current;
      if (i >= 0) scopeAnchor.current = i;
      const src = track.url;
      if (audio.src !== new URL(src, window.location.href).href)
        audio.src = src;
      else audio.currentTime = 0;
      applyLoudnessGain(getAnalyzedGain(track.url) ?? track.loudnessGainDb);
      audio.volume = volume;
      if (queue !== music) setMusic(queue);
      setExternalTrack(null);
      setCurrentIndex(i);
      const request = await startPlayback(audio);
      if (!request) return false;
      setShown(true);
      recordPlayback(track);
      return request === playbackRequest.current;
    },
    [
      resolveTrack,
      volume,
      music,
      ensureAudioContext,
      applyLoudnessGain,
      getAnalyzedGain,
      recordPlayback,
      cancelTransition,
      startPlayback,
    ],
  );

  useEffect(() => {
    writeStorage(keys.volume, String(volume));
  }, [volume, keys]);

  useEffect(() => {
    repeatStateRef.current = repeatState;
  }, [repeatState]);

  useEffect(() => {
    writeStorage(keys.repeat, preferredRepeatState);
  }, [preferredRepeatState, keys]);

  const toggleShuffle = useCallback(() => {
    writeStorage(keys.shuffle, String(!shuffle));
    setQueueOrder(
      buildQueue(
        music,
        currentIndex,
        queueOrder.filter((index) => index < 0),
        !shuffle,
      ),
    );
    setShuffle(!shuffle);
  }, [shuffle, music, currentIndex, queueOrder, buildQueue, keys]);

  useEffect(() => {
    const syncShuffle = (event: StorageEvent) => {
      if (event.key !== keys.shuffle && event.key !== null) return;
      const enabled = readStorage(keys.shuffle) === "true";
      if (enabled === shuffle) return;
      setShuffle(enabled);
      setQueueOrder(
        buildQueue(
          music,
          currentIndex,
          queueOrder.filter((index) => index < 0),
          enabled,
        ),
      );
    };
    window.addEventListener("storage", syncShuffle);
    return () => window.removeEventListener("storage", syncShuffle);
  }, [shuffle, music, currentIndex, queueOrder, buildQueue]);

  const setTracks = useCallback(
    (tracks: TrackType[]) => {
      playbackRequest.current++;
      cancelTransition();
      removedTracks.current.clear();
      scopeAnchor.current = null;
      setPlaybackScope(null);
      setTemporaryAutoplay(false);
      setMusic(tracks);
      setCurrentIndex(null);
      setBackStack([]);
      setQueueOrder(buildQueue(tracks, null, [], shuffle));
    },
    [shuffle, cancelTransition, buildQueue],
  );

  const moveQueued = useCallback((from: number, to: number) => {
    setQueueOrder((order) => {
      if (from < 0 || to < 0 || from >= order.length || to >= order.length)
        return order;
      const next = [...order];
      next.splice(to, 0, next.splice(from, 1)[0]);
      return next;
    });
  }, []);
  const removeQueued = useCallback(
    (index: number) => {
      const removed = queueOrder[index];
      if (removed == null) return;
      if (removed >= 0) removedTracks.current.add(removed);
      setQueueOrder(
        buildQueue(
          music,
          currentIndex,
          queueOrder.filter((_, position) => position !== index),
          shuffle,
        ),
      );
    },
    [queueOrder, music, currentIndex, shuffle, buildQueue],
  );
  const enqueueNext = useCallback(
    (track: TrackType) => {
      let slot = manualTracks.current.findIndex(
        (item) => item && queueTrackKey(item) === queueTrackKey(track),
      );
      if (slot < 0) {
        slot = manualTracks.current.indexOf(null);
        if (slot < 0) slot = manualTracks.current.length;
        manualTracks.current[slot] = track;
      }
      const index = -slot - 1;
      setQueueOrder((previous) => [
        index,
        ...previous.filter(
          (item) =>
            item !== index &&
            queueTrackKey(resolveTrack(item, music) ?? {}) !==
              queueTrackKey(track),
        ),
      ]);
    },
    [music, resolveTrack],
  );

  const next = useCallback(async () => {
    const nextIndex = queueOrder[0];
    if (nextIndex == null) return;
    if (!(await playIndex(nextIndex))) return;
    if (currentIndex != null && currentIndex !== nextIndex) {
      setBackStack((previous) => [...previous, currentIndex].slice(-100));
    }
    setQueueOrder(buildQueue(music, nextIndex, queueOrder.slice(1), shuffle));
  }, [currentIndex, playIndex, music, queueOrder, shuffle, buildQueue]);

  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  const seek = useCallback(
    (t: number) => {
      const a = audioRef.current;
      if (!a) return;
      cancelTransition();
      a.currentTime = Math.min(Math.max(0, t), duration || 0);
    },
    [duration, cancelTransition],
  );

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;
    setAudioState(audio);
    const track =
      restored?.current != null
        ? resolveTrack(restored.current, restored.tracks)
        : restored?.external;
    const restorePosition = () => {
      if (
        track &&
        audio.src === new URL(track.url, window.location.href).href &&
        resumeTime.current > 0
      ) {
        audio.currentTime = Math.min(
          resumeTime.current,
          Number.isFinite(audio.duration) ? audio.duration : resumeTime.current,
        );
        resumeTime.current = 0;
      }
    };
    if (track) {
      audio.addEventListener("loadedmetadata", restorePosition, { once: true });
      audio.volume = volumeRef.current;
      audio.src = track.url;
    }
    return () => {
      playbackRequest.current++;
      audio.removeEventListener("loadedmetadata", restorePosition);
      cancelTransition();
      if (audioRef.current) releaseAudio(audioRef.current);
      audioRef.current = null;
      void audioCtxRef.current?.close();
      audioCtxRef.current = null;
    };
  }, [cancelTransition, releaseAudio, restored, resolveTrack]);

  useEffect(() => {
    // Keep slot numbers stable while pruning tracks no longer referenced by playback.
    if (!pendingPlayback.current) {
      const retained = new Set([currentIndex, ...queueOrder, ...backStack]);
      manualTracks.current = manualTracks.current.map((track, slot) =>
        retained.has(-slot - 1) ? track : null,
      );
      while (
        manualTracks.current.length &&
        manualTracks.current.at(-1) === null
      )
        manualTracks.current.pop();
    }
    writeStorage(
      keys.session,
      JSON.stringify({
        tracks: music.map(sessionTrack),
        manual: manualTracks.current.map((track) =>
          track ? sessionTrack(track) : null,
        ),
        anchor: scopeAnchor.current,
        current: currentIndex,
        external: externalTrack ? sessionTrack(externalTrack) : null,
        queue: queueOrder,
        back: backStack,
        playbackScope,
        temporaryAutoplay,
        removed: [...removedTracks.current],
        time: 0,
        shown,
      }),
    );
  }, [
    music,
    currentIndex,
    externalTrack,
    queueOrder,
    backStack,
    shown,
    playbackScope,
    temporaryAutoplay,
    keys,
  ]);

  useEffect(() => {
    const audio = audioState;
    if (!audio) return;
    const save = () => {
      if (!audio.src) return;
      writeStorage(
        keys.position,
        JSON.stringify({
          source: audio.src,
          time: resumeTime.current || audio.currentTime || 0,
        }),
      );
    };
    const onVisibility = () => {
      if (document.hidden) save();
    };
    const timer = isPlaying ? window.setInterval(save, 3000) : undefined;
    save();
    audio.addEventListener("pause", save);
    audio.addEventListener("seeked", save);
    audio.addEventListener("loadedmetadata", save);
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (timer !== undefined) window.clearInterval(timer);
      audio.removeEventListener("pause", save);
      audio.removeEventListener("seeked", save);
      audio.removeEventListener("loadedmetadata", save);
      window.removeEventListener("pagehide", save);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [audioState, isPlaying, keys]);

  useEffect(() => {
    const audio = audioState;
    if (!audio) return;
    const onPlay = () => {
      if (audio === audioRef.current) setIsPlaying(true);
    };
    const onPause = () => {
      if (audio === audioRef.current) {
        cancelTransition();
        setIsPlaying(false);
      }
    };
    const onLoaded = () =>
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onEnd = () => {
      if (audio !== audioRef.current) return;
      if (repeatStateRef.current === "autoplay")
        void nextRef.current().catch(() => setIsPlaying(false));
      else if (repeatStateRef.current === "repeat") {
        audio.currentTime = 0;
        void startPlayback(audio).catch(() => setIsPlaying(false));
      }
    };
    onLoaded();
    setIsPlaying(!audio.paused);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnd);
    };
  }, [audioState, cancelTransition, startPlayback]);

  const setVolume = useCallback((v: number) => {
    const nv = Math.min(Math.max(0, v), 1);
    setVol(nv);
    if (audioRef.current) audioRef.current.volume = nv;
    if (fading.current) fading.current.audio.volume = nv;
  }, []);

  const prev = useCallback(async () => {
    const target = backStack[backStack.length - 1];
    if (target == null || !resolveTrack(target, music)) return;
    if (!(await playIndex(target))) return;
    setBackStack((previous) => previous.slice(0, -1));
    const forward =
      currentIndex == null ? queueOrder : [currentIndex, ...queueOrder];
    setQueueOrder(buildQueue(music, target, forward, shuffle));
  }, [
    backStack,
    currentIndex,
    music,
    queueOrder,
    shuffle,
    playIndex,
    buildQueue,
    resolveTrack,
  ]);

  const clearPlaybackScope = useCallback(() => {
    setPlaybackScope(null);
    setTemporaryAutoplay(false);
  }, []);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      ensureAudioContext();
      const track =
        currentIndex == null
          ? externalTrack
          : resolveTrack(currentIndex, music);
      applyLoudnessGain(
        track ? (getAnalyzedGain(track.url) ?? track.loudnessGainDb) : 0,
      );
      void startPlayback(a)
        .then((started) => {
          if (started === playbackRequest.current && track) recordPlayback(track);
        })
        .catch(() => setIsPlaying(false));
    } else {
      playbackRequest.current++;
      cancelTransition();
      a.pause();
    }
  }, [
    currentIndex,
    externalTrack,
    music,
    resolveTrack,
    ensureAudioContext,
    applyLoudnessGain,
    getAnalyzedGain,
    recordPlayback,
    cancelTransition,
    startPlayback,
  ]);

  const stop = useCallback(() => {
    playbackRequest.current++;
    setPlaybackScope(null);
    setTemporaryAutoplay(false);
    const a = audioRef.current;
    if (!a) return;
    cancelTransition();
    a.pause();
  }, [cancelTransition]);

  const toggleRepeatState = useCallback(() => {
    const nextMode = {
      none: "repeat",
      repeat: "autoplay",
      autoplay: "none",
    } as const;
    setRepeatState(nextMode[repeatState]);
  }, [repeatState, setRepeatState]);

  const current =
    currentIndex == null ? externalTrack : resolveTrack(currentIndex, music);
  const playableCurrent = useMemo(
    () => (current ? toPlayableTrack(current) : null),
    [current],
  );

  useEffect(() => {
    if (!current) return;
    const controller = new AbortController();
    void loadWaveform(current.url, controller.signal).then(() => {
      if (!controller.signal.aborted)
        applyLoudnessGain(
          getAnalyzedGain(current.url) ?? current.loudnessGainDb,
        );
    });
    return () => controller.abort();
  }, [current, audioState, applyLoudnessGain, getAnalyzedGain, loadWaveform]);

  const playItem = useCallback(
    async (
      t: PlayableTrack,
      queue?: TrackType[],
      options?: { preserveQueue?: boolean; shuffle?: boolean; scope?: string },
    ) => {
      const playbackShuffle = options?.shuffle ?? shuffle;
      if (options?.shuffle !== undefined) {
        writeStorage(keys.shuffle, String(playbackShuffle));
        setShuffle(playbackShuffle);
      }
      const playbackQueue = queue ?? music;
      const isNewQueue = queue != null && queue !== music;
      const manualPosition = options?.preserveQueue
        ? queueOrder.findIndex(
            (index) =>
              index < 0 &&
              (t.id != null
                ? resolveTrack(index, music)?.id === t.id
                : resolveTrack(index, music)?.url === t.song),
          )
        : -1;
      if (manualPosition >= 0) {
        const index = queueOrder[manualPosition];
        if (!(await playIndex(index))) return;
        if (currentIndex != null)
          setBackStack((previous) => [...previous, currentIndex].slice(-100));
        setQueueOrder(
          buildQueue(
            music,
            index,
            queueOrder.slice(manualPosition + 1),
            playbackShuffle,
          ),
        );
        return;
      }
      const i = playbackQueue.findIndex((x) =>
        t.id != null ? x.id === t.id : x.url === t.song,
      );
      if (i >= 0) {
        if (!options?.preserveQueue) {
          removedTracks.current.clear();
          setPlaybackScope(options?.scope ?? null);
          setTemporaryAutoplay(Boolean(options?.scope));
        }
        if (!(await playIndex(i, playbackQueue))) return;
        if (isNewQueue) {
          setBackStack([]);
          setQueueOrder(
            buildQueue(
              playbackQueue,
              i,
              queueOrder.filter((index) => index < 0),
              playbackShuffle,
            ),
          );
        } else {
          if (currentIndex != null && currentIndex !== i) {
            setBackStack((previous) => [...previous, currentIndex].slice(-100));
          }
          const position = queueOrder.indexOf(i);
          const pending = options?.preserveQueue
            ? position >= 0
              ? queueOrder.slice(position + 1)
              : queueOrder
            : queueOrder.filter((index) => index < 0);
          setQueueOrder(buildQueue(playbackQueue, i, pending, playbackShuffle));
        }
        return;
      }
      if (!audioRef.current) return;
      resumeTime.current = 0;
      cancelTransition();
      ensureAudioContext();
      const audio = audioRef.current;
      audio.src = t.song;
      applyLoudnessGain(t.loudnessGainDb);
      audio.volume = volume;
      const { song, artist, thumbnail, ...metadata } = t;
      const track = {
        ...metadata,
        url: song,
        composer: artist,
        game: {
          ...t.game,
          soundtrackThumbnail: thumbnail || t.game.soundtrackThumbnail || null,
        },
      };
      setExternalTrack(track);
      scopeAnchor.current = null;
      setQueueOrder(
        buildQueue(
          queue ?? [],
          null,
          queueOrder.filter((index) => index < 0),
          playbackShuffle,
        ),
      );
      removedTracks.current.clear();
      setMusic(queue ?? []);
      setBackStack([]);
      setCurrentIndex(null);
      if (!options?.preserveQueue) {
        setPlaybackScope(options?.scope ?? null);
        setTemporaryAutoplay(Boolean(options?.scope));
      }
      if (!(await startPlayback(audio))) return;
      setShown(true);
      recordPlayback(track);
    },
    [
      currentIndex,
      playIndex,
      volume,
      music,
      ensureAudioContext,
      applyLoudnessGain,
      recordPlayback,
      queueOrder,
      shuffle,
      cancelTransition,
      buildQueue,
      resolveTrack,
      startPlayback,
      keys,
    ],
  );

  useEffect(() => {
    cancelTransition();
  }, [repeatState, cancelTransition]);

  useEffect(() => {
    setTransitionLead(0);
    const outgoing = audioRef.current;
    const nextIndex = queueOrder[0];
    const nextTrack = nextIndex == null ? null : resolveTrack(nextIndex, music);
    if (
      transitionMode === "off" ||
      repeatState !== "autoplay" ||
      !outgoing ||
      !current ||
      !nextTrack ||
      nextIndex === currentIndex
    )
      return;
    const incoming = new Audio();
    incoming.crossOrigin = "anonymous";
    incoming.preload = "auto";
    incoming.src = nextTrack.url;
    const controller = new AbortController();
    let cancelled = false;
    let starting = false;
    let failed = false;
    let outgoingPeaks: number[] | null = null;
    let incomingPeaks: number[] | null = null;
    let plan = { overlap: 0, intro: 0, beatAligned: false };
    const updatePlan = () => {
      if (cancelled || starting) return;
      plan = planTransition(
        transitionMode,
        outgoing.duration,
        incoming.duration,
        outgoingPeaks,
        incomingPeaks,
        getRhythm(current.url),
        getRhythm(nextTrack.url),
      );
      setTransitionLead(plan.overlap);
    };
    incoming.addEventListener("loadedmetadata", updatePlan);
    outgoing.addEventListener("loadedmetadata", updatePlan);
    if (transitionMode === "automix") {
      void loadWaveform(current.url, controller.signal).then((peaks) => {
        if (cancelled) return;
        outgoingPeaks = peaks;
        updatePlan();
      });
      void loadWaveform(nextTrack.url, controller.signal).then((peaks) => {
        if (cancelled) return;
        incomingPeaks = peaks;
        updatePlan();
      });
    }
    const check = async () => {
      if (
        cancelled ||
        failed ||
        starting ||
        fading.current ||
        outgoing !== audioRef.current ||
        outgoing.paused ||
        outgoing.seeking ||
        !plan.overlap ||
        incoming.readyState < 3
      )
        return;
      const remaining = outgoing.duration - outgoing.currentTime;
      if (remaining > plan.overlap || remaining < 0.3) return;
      // A seek, late analysis, or throttled tab can miss the chosen boundary.
      // Let ordinary end-of-track playback take over instead of jumping into an intro.
      if (plan.beatAligned && plan.overlap - remaining > 0.2) return;
      starting = true;
      const epoch = transitionEpoch.current;
      try {
        const nextDeck = connectAudio(incoming);
        const oldDeck = decks.current.get(outgoing);
        const ctx = audioCtxRef.current;
        if (!nextDeck || !oldDeck || !ctx) {
          failed = true;
          return;
        }
        nextDeck.fade.gain.setValueAtTime(0, ctx.currentTime);
        nextDeck.gain.gain.setValueAtTime(
          10 **
            ((getAnalyzedGain(nextTrack.url) ??
              (Number.isFinite(nextTrack.loudnessGainDb)
                ? Number(nextTrack.loudnessGainDb)
                : 0)) /
              20),
          ctx.currentTime,
        );
        incoming.volume = volumeRef.current;
        // Compensate for polling delay so both grids begin at the same musical position.
        incoming.currentTime =
          plan.intro +
          (plan.beatAligned ? Math.max(0, plan.overlap - remaining) : 0);
        await incoming.play();
        if (
          cancelled ||
          epoch !== transitionEpoch.current ||
          outgoing !== audioRef.current ||
          outgoing.paused
        ) {
          incoming.pause();
          return;
        }
        const seconds = Math.min(
          plan.overlap,
          outgoing.duration - outgoing.currentTime,
        );
        if (seconds <= 0) {
          incoming.pause();
          failed = true;
          return;
        }
        const now = ctx.currentTime;
        oldDeck.fade.gain.cancelScheduledValues(now);
        nextDeck.fade.gain.cancelScheduledValues(now);
        if (transitionMode === "automix") {
          const curves = automixFadeCurves();
          oldDeck.fade.gain.setValueCurveAtTime(curves.outgoing, now, seconds);
          nextDeck.fade.gain.setValueCurveAtTime(curves.incoming, now, seconds);
        } else {
          oldDeck.fade.gain.setValueAtTime(1, now);
          oldDeck.fade.gain.linearRampToValueAtTime(0, now + seconds);
          nextDeck.fade.gain.setValueAtTime(0, now);
          nextDeck.fade.gain.linearRampToValueAtTime(1, now + seconds);
        }
        playbackRequest.current++;
        audioRef.current = incoming;
        gainRef.current = nextDeck.gain;
        fading.current = {
          audio: outgoing,
          timer: window.setTimeout(
            () => {
              releaseAudio(outgoing);
              if (fading.current?.audio === outgoing) fading.current = null;
            },
            seconds * 1000 + 50,
          ),
        };
        setAudioState(incoming);
        setDuration(incoming.duration);
        setIsPlaying(true);
        setExternalTrack(null);
        setCurrentIndex(nextIndex);
        if (nextIndex != null && nextIndex >= 0)
          scopeAnchor.current = nextIndex;
        if (currentIndex != null)
          setBackStack((previous) => [...previous, currentIndex].slice(-100));
        recordPlayback(nextTrack);
        setQueueOrder(
          buildQueue(music, nextIndex, queueOrder.slice(1), shuffle),
        );
      } catch {
        // Keep the current track playing; normal end-of-track playback remains available.
        failed = true;
        incoming.pause();
      } finally {
        starting = false;
      }
    };
    const tick = () => {
      void check();
    };
    outgoing.addEventListener("timeupdate", tick);
    const interval = window.setInterval(
      tick,
      transitionMode === "automix" ? 25 : 100,
    );
    updatePlan();
    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(interval);
      outgoing.removeEventListener("timeupdate", tick);
      outgoing.removeEventListener("loadedmetadata", updatePlan);
      incoming.removeEventListener("loadedmetadata", updatePlan);
      if (incoming !== audioRef.current) releaseAudio(incoming);
    };
  }, [
    current,
    currentIndex,
    music,
    queueOrder,
    shuffle,
    transitionMode,
    repeatState,
    audioState,
    connectAudio,
    recordPlayback,
    releaseAudio,
    buildQueue,
    resolveTrack,
    getAnalyzedGain,
    getRhythm,
    loadWaveform,
  ]);

  const upcoming = useMemo(
    () =>
      queueOrder
        .slice(0, 10)
        .map((index) => resolveTrack(index, music))
        .filter((track): track is TrackType => Boolean(track)),
    [music, queueOrder, resolveTrack],
  );

  const value = useMemo(
    () => ({
      analysis,
      audioEl: audioState,
      analyser: analyserState,
      current: playableCurrent,
      storageNamespace,
      isPlaying,
      playbackScope,
      volume,
      currentIndex,
      playItem,
      toggle,
      clearPlaybackScope,
      next,
      prev,
      canPrev: backStack.length >= 1,
      seek,
      setVolume,
      tracks: music,
      upcoming,
      moveQueued,
      removeQueued,
      enqueueNext,
      history,
      setTracks,
      shuffle,
      toggleShuffle,
      transitionMode,
      setTransitionMode,
      transitionLead,
      setRepeatState,
      toggleRepeatState,
      repeatState,
      stop,
      shown,
      setShown,
    }),
    [
      audioState,
      analyserState,
      playItem,
      toggle,
      setRepeatState,
      playableCurrent,
      storageNamespace,
      isPlaying,
      playbackScope,
      volume,
      currentIndex,
      next,
      clearPlaybackScope,
      prev,
      seek,
      setVolume,
      analysis,
      music,
      upcoming,
      moveQueued,
      removeQueued,
      enqueueNext,
      history,
      setTracks,
      shuffle,
      toggleShuffle,
      transitionMode,
      setTransitionMode,
      transitionLead,
      backStack.length,
      toggleRepeatState,
      repeatState,
      stop,
      shown,
    ],
  );

  return (
    <MusicContext.Provider value={value}>
      {children}
      {value.current ? player : null}
    </MusicContext.Provider>
  );
}
