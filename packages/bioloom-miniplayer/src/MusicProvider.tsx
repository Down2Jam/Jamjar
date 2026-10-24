import { recordContentView } from "@/requests/contentViews";
"use client";

import {
  useCallback,
  useEffect,
  lazy,
  useMemo,
  useRef,
  Suspense,
  useState,
} from "react";
import {
  MusicContext,
  type PlayableTrack,
  type TrackType,
} from "./MusicContext";

import { getAnalyzedGain, getRhythm, loadWaveform } from "./waveform";
import { automixFadeCurves, planTransition } from "./transitions";
import { fillQueue, queueTrackKey, type ShufflePreferences } from "./queue";

import { useListeningHistory } from "./useListeningHistory";
import { parseSession, sessionKey, sessionTrack } from "./session";
const MiniPlayer = lazy(() => import("./MiniPlayer"));

export const storageKey = {
  volume: "music_volume",
  shuffle: "music_shuffle",
  transition: "music_transition",
  repeat: "music_repeat",
  minimized: "music_minimized",
  corner: "music_corner",
} as const;

export const readStorage = (key: string) => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const writeStorage = (key: string, value: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {}
};

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [restored] = useState(() => parseSession(readStorage(sessionKey)));
  const resumeTime = useRef(restored?.time ?? 0);
  // Negative indices identify explicit additions outside the automatic scope.
  const manualTracks = useRef<TrackType[]>(restored?.manual ?? []);
  const scopeAnchor = useRef<number | null>(restored?.anchor ?? null);
  const resolveTrack = useCallback((index: number, scope: TrackType[]) => index < 0 ? manualTracks.current[-index - 1] : scope[index], []);
  const removedTracks = useRef(new Set(restored?.removed ?? []));
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioState, setAudioState] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackScope, setPlaybackScope] = useState<string | null>(restored?.playbackScope ?? null);
  const [duration, setDuration] = useState(0);
  const [volume, setVol] = useState<number>(() => {
    const v = parseFloat(readStorage(storageKey.volume) ?? "");
    return Number.isFinite(v) ? Math.min(Math.max(v, 0), 1) : 0.5;
  });
  const [preferredRepeatState, setPreferredRepeatState] = useState<
    "none" | "repeat" | "autoplay"
  >(() => {
    const v = (readStorage(storageKey.repeat) ?? "") as string;
    return v === "repeat" || v === "autoplay" || v === "none" ? v : "repeat";
  });
  const [temporaryAutoplay, setTemporaryAutoplay] = useState(restored?.temporaryAutoplay ?? false);
  const repeatState = temporaryAutoplay ? "autoplay" : preferredRepeatState;
  const setRepeatState = useCallback((mode: "none" | "repeat" | "autoplay") => {
    setTemporaryAutoplay(false);
    setPreferredRepeatState(mode);
  }, []);
  const [transitionMode, setTransitionModeState] = useState<"off" | "crossfade" | "automix">(() => {
    const saved = readStorage(storageKey.transition);
    return saved === "off" || saved === "crossfade" || saved === "automix" ? saved : "automix";
  });
  const [transitionLead, setTransitionLead] = useState(0);
  const [currentIndex, setCurrentIndex] = useState<number | null>(restored?.current ?? null);
  const nextRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const [backStack, setBackStack] = useState<number[]>(restored?.back ?? []);
  const [shuffle, setShuffle] = useState(() => readStorage(storageKey.shuffle) === "true");
  const [queueOrder, setQueueOrder] = useState<number[]>(restored?.queue ?? []);
  const repeatStateRef = useRef(repeatState);
  const [shown, setShown] = useState<boolean>(restored?.shown ?? false);
  const [music, setMusic] = useState<TrackType[]>(restored?.tracks ?? []);
  const { history, recordListen } = useListeningHistory();
  const lastPlayed = useRef<TrackType | null>(null);
  const playCounts = useRef(new Map<string, number>());
  const recentShuffleTracks = useRef<TrackType[]>([]);
  const recordPlayback = useCallback((track: TrackType) => {
    if (track.id) void recordContentView("track", track.id, "playback");
    const previous = lastPlayed.current;
    const sameTrack = previous && (track.id != null && previous.id != null ? track.id === previous.id : track.url === previous.url && track.pageVersion === previous.pageVersion);
    if (sameTrack) return;
    const key = queueTrackKey(track);
    playCounts.current.set(key, (playCounts.current.get(key) ?? 0) + 1);
    recentShuffleTracks.current = [...recentShuffleTracks.current.slice(-2), track];
    recordListen(track);
    lastPlayed.current = track;
  }, [recordListen]);
  const shufflePreferences = useRef<ShufflePreferences>({});
  shufflePreferences.current = {
    plays: playCounts.current,
    recent: recentShuffleTracks.current,
    automix: transitionMode === "automix" && repeatState === "autoplay",
    tempo: (track, edge) => {
      const rhythm = track.url ? getRhythm(track.url) : null;
      return rhythm && rhythm.confidence >= .3 && (edge === "intro" ? rhythm.introConfidence : rhythm.outroConfidence) >= .6 ? 60 / rhythm.period : null;
    },
  };
  const buildQueue = useCallback((scope: TrackType[], current: number | null, pending: number[], shuffled: boolean) => {
    const anchor = current != null && current >= 0 ? current : scopeAnchor.current;
    const automatic = fillQueue(scope, anchor, pending.filter(index => index >= 0), shuffled, Math.random,
      { ...shufflePreferences.current, recent: recentShuffleTracks.current, blocked: removedTracks.current });
    const retained = [...new Set(pending.filter(index => index < 0 ? !!manualTracks.current[-index - 1] : automatic.includes(index)))];
    return [...retained, ...automatic.filter(index => !retained.includes(index))];
  }, []);
  const [externalTrack, setExternalTrack] = useState<TrackType | null>(restored?.external ?? null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [analyserState, setAnalyserState] = useState<AnalyserNode | null>(null);

  const decks = useRef(new Map<HTMLAudioElement, { source: MediaElementAudioSourceNode; gain: GainNode; fade: GainNode }>());
  const fading = useRef<{ audio: HTMLAudioElement; timer: number } | null>(null);
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
      const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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
    if (audioRef.current) gainRef.current = connectAudio(audioRef.current)?.gain ?? null;
  }, [connectAudio]);

  const setTransitionMode = useCallback((mode: "off" | "crossfade" | "automix") => {
    cancelTransition();
    setTransitionModeState(mode);
    writeStorage(storageKey.transition, mode);
    if (mode !== "off") setRepeatState("autoplay");
  }, [cancelTransition]);

  const applyLoudnessGain = useCallback((gainDb?: number | null) => {
    const ctx = audioCtxRef.current;
    const gain = gainRef.current;
    if (!ctx || !gain) return;

    const safeGainDb = Number.isFinite(gainDb) ? Number(gainDb) : 0;
    gain.gain.setValueAtTime(10 ** (safeGainDb / 20), ctx.currentTime);
  }, []);

  const playIndex = useCallback(
    async (i: number, queue: TrackType[] = music) => {
      if (!audioRef.current || !resolveTrack(i, queue)) return;
      resumeTime.current = 0;
      cancelTransition();
      ensureAudioContext();
      const audio = audioRef.current;
      const track = resolveTrack(i, queue);
      if (i >= 0) scopeAnchor.current = i;
      const src = track.url;
      if (audio.src !== new URL(src, window.location.href).href) audio.src = src;
      else audio.currentTime = 0;
      applyLoudnessGain(getAnalyzedGain(track.url) ?? track.loudnessGainDb);
      audio.volume = volume;
      if (queue !== music) setMusic(queue);
      setExternalTrack(null);
      setCurrentIndex(i);
      await audio.play();
      recordPlayback(track);

      setShown(true);
    },
    [resolveTrack, volume, music, ensureAudioContext, applyLoudnessGain, recordPlayback, cancelTransition],
  );

  useEffect(() => {
    writeStorage(storageKey.volume, String(volume));
  }, [volume]);

  useEffect(() => {
    repeatStateRef.current = repeatState;
  }, [repeatState]);

  useEffect(() => {
    writeStorage(storageKey.repeat, preferredRepeatState);
  }, [preferredRepeatState]);

  const upcomingIndices = queueOrder;

  const toggleShuffle = useCallback(() => {
    writeStorage(storageKey.shuffle, String(!shuffle));
    setQueueOrder(buildQueue(music, currentIndex, queueOrder.filter(index => index < 0), !shuffle));
    setShuffle(!shuffle);
  }, [shuffle, music, currentIndex, queueOrder, buildQueue]);

  useEffect(() => {
    const syncShuffle = (event: StorageEvent) => {
      if (event.key !== storageKey.shuffle && event.key !== null) return;
      const enabled = readStorage(storageKey.shuffle) === "true";
      if (enabled === shuffle) return;
      setShuffle(enabled);
      setQueueOrder(buildQueue(music, currentIndex, queueOrder.filter(index => index < 0), enabled));
    };
    window.addEventListener("storage", syncShuffle);
    return () => window.removeEventListener("storage", syncShuffle);
  }, [shuffle, music, currentIndex, queueOrder, buildQueue]);

  const setTracks = useCallback((tracks: TrackType[]) => {
    cancelTransition();
    removedTracks.current.clear();
    scopeAnchor.current = null;
    setPlaybackScope(null);
    setTemporaryAutoplay(false);
    setMusic(tracks);
    setCurrentIndex(null);
    setBackStack([]);
    setQueueOrder(buildQueue(tracks, null, [], shuffle));
  }, [shuffle, cancelTransition, buildQueue]);

  const moveQueued = useCallback((from: number, to: number) => {
    setQueueOrder(order => {
      if (from < 0 || to < 0 || from >= order.length || to >= order.length) return order;
      const next = [...order];
      next.splice(to, 0, next.splice(from, 1)[0]);
      return next;
    });
  }, []);
  const removeQueued = useCallback((index: number) => {
    const removed = queueOrder[index];
    if (removed == null) return;
    if (removed >= 0) removedTracks.current.add(removed);
    setQueueOrder(buildQueue(music, currentIndex, queueOrder.filter((_, position) => position !== index), shuffle));
  }, [queueOrder, music, currentIndex, shuffle, buildQueue]);
  const enqueueNext = useCallback((track: TrackType) => {
    let slot = manualTracks.current.findIndex(item => queueTrackKey(item) === queueTrackKey(track));
    if (slot < 0) { slot = manualTracks.current.length; manualTracks.current.push(track); }
    const index = -slot - 1;
    setQueueOrder(previous => [index, ...previous.filter(item => item !== index && queueTrackKey(resolveTrack(item, music)) !== queueTrackKey(track))]);
  }, [music, resolveTrack]);

  const next = useCallback(async () => {
    const nextIndex = queueOrder[0];
    if (nextIndex == null) return;
    await playIndex(nextIndex);
    if (currentIndex != null && currentIndex !== nextIndex) {
      setBackStack(previous => [...previous, currentIndex].slice(-100));
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
    const track = restored?.current != null ? resolveTrack(restored.current, restored.tracks) : restored?.external;
    const restorePosition = () => {
      if (track && audio.src === new URL(track.url, window.location.href).href && resumeTime.current > 0) {
        audio.currentTime = Math.min(resumeTime.current, Number.isFinite(audio.duration) ? audio.duration : resumeTime.current);
        resumeTime.current = 0;
      }
    };
    if (track) {
      audio.addEventListener("loadedmetadata", restorePosition, { once: true });
      audio.volume = volumeRef.current;
      audio.src = track.url;
    }
    return () => {
      audio.removeEventListener("loadedmetadata", restorePosition);
      cancelTransition();
      if (audioRef.current) releaseAudio(audioRef.current);
      audioRef.current = null;
      void audioCtxRef.current?.close();
      audioCtxRef.current = null;
    };
  }, [cancelTransition, releaseAudio, restored, resolveTrack]);

  useEffect(() => {
    const save = () => {
      if (!music.length && !externalTrack) return;
      writeStorage(sessionKey, JSON.stringify({ tracks: music.map(sessionTrack), manual: manualTracks.current.map(sessionTrack), anchor: scopeAnchor.current, current: currentIndex,
        external: externalTrack ? sessionTrack(externalTrack) : null, queue: queueOrder, back: backStack,
        playbackScope, temporaryAutoplay, removed: [...removedTracks.current], time: resumeTime.current || audioRef.current?.currentTime || 0, shown }));
    };
    save();
    const interval = window.setInterval(save, 3000);
    window.addEventListener("pagehide", save);
    const onVisibility = () => { if (document.hidden) save(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.clearInterval(interval); window.removeEventListener("pagehide", save); document.removeEventListener("visibilitychange", onVisibility); };
  }, [music, currentIndex, externalTrack, queueOrder, backStack, shown, playbackScope, temporaryAutoplay]);

  useEffect(() => {
    const audio = audioState;
    if (!audio) return;
    const onPlay = () => { if (audio === audioRef.current) setIsPlaying(true); };
    const onPause = () => { if (audio === audioRef.current) { cancelTransition(); setIsPlaying(false); } };
    const onLoaded = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onEnd = () => {
      if (audio !== audioRef.current) return;
      if (repeatStateRef.current === "autoplay") void nextRef.current().catch(() => setIsPlaying(false));
      else if (repeatStateRef.current === "repeat") { audio.currentTime = 0; void audio.play().catch(() => setIsPlaying(false)); }
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
  }, [audioState, cancelTransition]);

  const setVolume = useCallback((v: number) => {
    const nv = Math.min(Math.max(0, v), 1);
    setVol(nv);
    if (audioRef.current) audioRef.current.volume = nv;
    if (fading.current) fading.current.audio.volume = nv;
  }, []);

  const prev = useCallback(async () => {
    const target = backStack[backStack.length - 1];
    if (target == null || !resolveTrack(target, music)) return;
    await playIndex(target);
    setBackStack(previous => previous.slice(0, -1));
    const forward = currentIndex == null ? queueOrder : [currentIndex, ...queueOrder];
    setQueueOrder(buildQueue(music, target, forward, shuffle));
  }, [backStack, currentIndex, music, queueOrder, shuffle, playIndex, buildQueue, resolveTrack]);

  const clearPlaybackScope = useCallback(() => {
    setPlaybackScope(null);
    setTemporaryAutoplay(false);
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      ensureAudioContext();
      const track = currentIndex == null ? externalTrack : resolveTrack(currentIndex, music);
      applyLoudnessGain(track ? getAnalyzedGain(track.url) ?? track.loudnessGainDb : 0);
      void a.play().then(() => { if (track) recordPlayback(track); }).catch(() => setIsPlaying(false));
    } else { cancelTransition(); a.pause(); }
  };

  const stop = useCallback(() => {
    setPlaybackScope(null);
    setTemporaryAutoplay(false);
    const a = audioRef.current;
    if (!a) return;
    cancelTransition();
    a.pause();
  }, [cancelTransition]);

  const toggleRepeatState = useCallback(() => {
    switch (repeatState) {
      case "autoplay":
        setRepeatState("none");
        return;
      case "repeat":
        setRepeatState("autoplay");
        return;
      case "none":
        setRepeatState("repeat");
        return;
    }
  }, [repeatState]);

  const current = currentIndex == null ? externalTrack : resolveTrack(currentIndex, music);

  useEffect(() => {
    if (!current) return;
    const controller = new AbortController();
    void loadWaveform(current.url, controller.signal).then(() => {
      if (!controller.signal.aborted) applyLoudnessGain(getAnalyzedGain(current.url) ?? current.loudnessGainDb);
    });
    return () => controller.abort();
  }, [current, audioState, applyLoudnessGain]);

  const playItem = useCallback(
    async (t: PlayableTrack, queue?: TrackType[], options?: { preserveQueue?: boolean; shuffle?: boolean; scope?: string }) => {
      const playbackShuffle = options?.shuffle ?? shuffle;
      if (options?.shuffle !== undefined) {
        writeStorage(storageKey.shuffle, String(playbackShuffle));
        setShuffle(playbackShuffle);
      }
      const playbackQueue = queue ?? music;
      const isNewQueue = queue != null && queue !== music;
      const manualPosition = options?.preserveQueue ? queueOrder.findIndex(index => index < 0 && (t.id != null ? resolveTrack(index, music)?.id === t.id : resolveTrack(index, music)?.url === t.song)) : -1;
      if (manualPosition >= 0) {
        const index = queueOrder[manualPosition];
        await playIndex(index);
        if (currentIndex != null) setBackStack(previous => [...previous, currentIndex].slice(-100));
        setQueueOrder(buildQueue(music, index, queueOrder.slice(manualPosition + 1), playbackShuffle));
        return;
      }
      const i = playbackQueue.findIndex((x) => t.id != null ? x.id === t.id : x.url === t.song);
      if (i >= 0) {
        if (!options?.preserveQueue) removedTracks.current.clear();
        if (!options?.preserveQueue) {
          setPlaybackScope(options?.scope ?? null);
          setTemporaryAutoplay(Boolean(options?.scope));
        }
        await playIndex(i, playbackQueue);
        if (isNewQueue) {
          setBackStack([]);
          setQueueOrder(buildQueue(playbackQueue, i, upcomingIndices.filter(index => index < 0), playbackShuffle));
        } else {
          if (currentIndex != null && currentIndex !== i) {
            setBackStack(previous => [...previous, currentIndex].slice(-100));
          }
          const position = upcomingIndices.indexOf(i);
          const pending = options?.preserveQueue
            ? position >= 0 ? upcomingIndices.slice(position + 1) : upcomingIndices
            : upcomingIndices.filter(index => index < 0);
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
      setExternalTrack({
        id: t.id,
        slug: t.slug,
        url: t.song,
        name: t.name,
        loudnessGainDb: t.loudnessGainDb,
        pageVersion: t.pageVersion,
        allowDownload: t.allowDownload, license: t.license, allowBackgroundUse: t.allowBackgroundUse, allowBackgroundUseAttribution: t.allowBackgroundUseAttribution,
        composer: t.artist,
        game: {
          ...t.game,
          soundtrackThumbnail:
            t.thumbnail || t.game.soundtrackThumbnail || null,
        },
      });
      setBackStack((bs) =>
        currentIndex == null || bs[bs.length - 1] === currentIndex
          ? bs
          : [...bs, currentIndex],
      );
      scopeAnchor.current = null;
      setQueueOrder(buildQueue(queue ?? [], null, upcomingIndices.filter(index => index < 0), playbackShuffle));
      removedTracks.current.clear();
      setMusic(queue ?? []);
      setBackStack([]);
      setCurrentIndex(null);
      if (!options?.preserveQueue) {
        setPlaybackScope(options?.scope ?? null);
        setTemporaryAutoplay(Boolean(options?.scope));
      }
      await audio.play();
      recordPlayback({ id: t.id, slug: t.slug, url: t.song, name: t.name, composer: t.artist, game: t.game, loudnessGainDb: t.loudnessGainDb, pageVersion: t.pageVersion, allowDownload: t.allowDownload });
      setShown(true);
    },
    [currentIndex, playIndex, volume, music, ensureAudioContext, applyLoudnessGain, recordPlayback, upcomingIndices, shuffle, cancelTransition, buildQueue, queueOrder, resolveTrack],
  );

  useEffect(() => {
    cancelTransition();
  }, [repeatState, cancelTransition]);

  useEffect(() => {
    setTransitionLead(0);
    const outgoing = audioRef.current;
    const nextIndex = queueOrder[0];
    const nextTrack = nextIndex == null ? null : resolveTrack(nextIndex, music);
    if (transitionMode === "off" || repeatState !== "autoplay" || !outgoing || !current || !nextTrack || nextIndex === currentIndex) return;
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
      plan = planTransition(transitionMode, outgoing.duration, incoming.duration, outgoingPeaks, incomingPeaks, getRhythm(current.url), getRhythm(nextTrack.url));
      setTransitionLead(plan.overlap);
    };
    incoming.addEventListener("loadedmetadata", updatePlan);
    outgoing.addEventListener("loadedmetadata", updatePlan);
    if (transitionMode === "automix") {
      void loadWaveform(current.url, controller.signal, true).then(peaks => {
        if (cancelled) return;
        outgoingPeaks = peaks;
        updatePlan();
      });
      void loadWaveform(nextTrack.url, controller.signal, true).then(peaks => {
        if (cancelled) return;
        incomingPeaks = peaks;
        updatePlan();
      });
    }
    const check = async () => {
      if (cancelled || failed || starting || fading.current || outgoing !== audioRef.current || outgoing.paused || outgoing.seeking || !plan.overlap || incoming.readyState < 3) return;
      const remaining = outgoing.duration - outgoing.currentTime;
      if (remaining > plan.overlap || remaining < .3) return;
      // A seek, late analysis, or throttled tab can miss the chosen boundary.
      // Let ordinary end-of-track playback take over instead of jumping into an intro.
      if (plan.beatAligned && plan.overlap - remaining > .2) return;
      starting = true;
      const epoch = transitionEpoch.current;
      try {
        const nextDeck = connectAudio(incoming);
        const oldDeck = decks.current.get(outgoing);
        const ctx = audioCtxRef.current;
        if (!nextDeck || !oldDeck || !ctx) { failed = true; return; }
        nextDeck.fade.gain.setValueAtTime(0, ctx.currentTime);
        nextDeck.gain.gain.setValueAtTime(10 ** ((getAnalyzedGain(nextTrack.url) ?? (Number.isFinite(nextTrack.loudnessGainDb) ? Number(nextTrack.loudnessGainDb) : 0)) / 20), ctx.currentTime);
        incoming.volume = volumeRef.current;
        // Compensate for polling delay so both grids begin at the same musical position.
        incoming.currentTime = plan.intro + (plan.beatAligned ? Math.max(0, plan.overlap - remaining) : 0);
        await incoming.play();
        if (cancelled || epoch !== transitionEpoch.current || outgoing !== audioRef.current || outgoing.paused) { incoming.pause(); return; }
        const seconds = Math.min(plan.overlap, outgoing.duration - outgoing.currentTime);
        if (seconds <= 0) { incoming.pause(); failed = true; return; }
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
        audioRef.current = incoming;
        gainRef.current = nextDeck.gain;
        fading.current = { audio: outgoing, timer: window.setTimeout(() => {
          releaseAudio(outgoing);
          if (fading.current?.audio === outgoing) fading.current = null;
        }, seconds * 1000 + 50) };
        setAudioState(incoming);
        setDuration(incoming.duration);
        setIsPlaying(true);
        setExternalTrack(null);
        setCurrentIndex(nextIndex);
        if (nextIndex != null && nextIndex >= 0) scopeAnchor.current = nextIndex;
        if (currentIndex != null) setBackStack(previous => [...previous, currentIndex].slice(-100));
        recordPlayback(nextTrack);
        setQueueOrder(buildQueue(music, nextIndex, queueOrder.slice(1), shuffle));
      } catch {
        // Keep the current track playing; normal end-of-track playback remains available.
        failed = true;
        incoming.pause();
      } finally {
        starting = false;
      }
    };
    const tick = () => { void check(); };
    outgoing.addEventListener("timeupdate", tick);
    const interval = window.setInterval(tick, transitionMode === "automix" ? 25 : 100);
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
  }, [current, currentIndex, music, queueOrder, shuffle, transitionMode, repeatState, audioState, connectAudio, recordPlayback, releaseAudio, buildQueue, resolveTrack]);

  const upcoming = useMemo(() => upcomingIndices.slice(0, 10).map(index => resolveTrack(index, music)), [music, upcomingIndices, resolveTrack]);

  const value = useMemo(
    () => ({
      audioEl: audioState,
      analyser: analyserState,
      current,
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
      moveQueued, removeQueued, enqueueNext,
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
      current,
      isPlaying,
      playbackScope,
      volume,
      currentIndex,
      next,
      clearPlaybackScope,
      prev,
      seek,
      setVolume,
      music,
      upcoming,
      moveQueued, removeQueued, enqueueNext,
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
    <MusicContext.Provider
      value={{
        ...value,
        current: {
          id: value.current?.id,
          slug: value.current?.slug,
          song: value.current?.url || "",
          name: value.current?.name || "",
          loudnessGainDb: value.current?.loudnessGainDb,
          pageVersion: value.current?.pageVersion,
          allowDownload: value.current?.allowDownload,
          license: value.current?.license,
          allowBackgroundUse: value.current?.allowBackgroundUse,
          allowBackgroundUseAttribution: value.current?.allowBackgroundUseAttribution,
          artist: value.current?.composer || {},
          thumbnail:
            value.current?.game.soundtrackThumbnail ||
            value.current?.game.thumbnail ||
            "",
          game: value.current?.game || {},
        },
      }}
    >
      {children}
      {value.current ? (
        <Suspense fallback={null}>
          <MiniPlayer />
        </Suspense>
      ) : null}
    </MusicContext.Provider>
  );
}

