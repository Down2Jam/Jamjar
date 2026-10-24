"use client";

import { pageVersionUrl, defaultGameVersion } from "@/helpers/pageVersionUrl";

import RatingVisibilityGate from "@/components/ratings/RatingVisibilityGate";
import { useEffectiveHideRatings } from "@/hooks/useEffectiveHideRatings";
import { useSelf } from "@/hooks/queries";
import { queryKeys } from "@/hooks/queries/queryKeys";
import { emitTrackRatingSync, subscribeToTrackRatingSync, upsertTrackRatingRecord } from "@/helpers/trackRatingSync";
import { downloadTrackBySlug } from "@/helpers/trackDownload";
import { postTrackRating } from "@/requests/rating";
import { getTrackRatingCategories } from "@/requests/track";
import { useQueryClient } from "@tanstack/react-query";
import { addToast } from "bioloom-ui";
import Link from "@/compat/next-link";
import { UserHoverPreview } from "@/components/hover-previews";
import { AudioLines, Blend, CircleOff, Download, Infinity as InfinityIcon, ListMusic, ListOrdered, Pause, Play, CircleStop, Repeat1, Shuffle, SkipBack, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { readStorage, storageKey, writeStorage } from "./MusicProvider";
import { useMusic } from "./useMusic";
import type { TrackType } from "./MusicContext";
import { arrowMiniCorner, cornerFromMiniDrag, type MiniCorner } from "./corner";
import { loadWaveform, waveformMiniPath, waveformPath } from "./waveform";
import { useArtworkAccent } from "./useArtworkAccent";
import PlayerContextMenu from "./PlayerContextMenu";
import PlayerTrackMenu from "./PlayerTrackMenu";
import RecordDisc from "./RecordDisc";
import { useTouchMenu } from "./useTouchMenu";
import PlayerModeMenu from "./PlayerModeMenu";
import ScrollingTrackTitle from "./ScrollingTrackTitle";

type ViewerTrackRating = { trackId: number; categoryId: number; value: number };
const timeLabel = (seconds: number) => Number.isFinite(seconds) && seconds >= 0
  ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}` : "0:00";
const validCorner = (value: string | null): value is MiniCorner =>
  value === "top-left" || value === "top-right" || value === "bottom-left" || value === "bottom-right";

function usePlannedTransition(duration: number) {
  const { transitionLead, transitionMode, repeatState, upcoming } = useMusic();
  if (repeatState !== "autoplay" || transitionMode === "off" || !upcoming.length ||
      !Number.isFinite(duration) || duration <= 0 || !Number.isFinite(transitionLead) || transitionLead <= 0) return null;
  const start = Math.max(0, duration - transitionLead);
  return { start, percent: start / duration * 100, label: transitionMode === "automix" ? "Automix" : "Crossfade" };
}

function SeekWaveform({ className, path, transitionStart, clipPath }: { className: string; path: string; transitionStart?: number; clipPath?: string }) {
  const gradientId = useId();
  return <svg className={className} viewBox="0 0 960 100" preserveAspectRatio="none" style={{ clipPath, fill: transitionStart === undefined ? undefined : `url(#${gradientId})` }} aria-hidden="true">
    {transitionStart !== undefined && <defs><linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
      <stop offset={`${transitionStart}%`} stopColor="var(--waveform-fill)"/>
      <stop offset={`${transitionStart}%`} stopColor="color-mix(in srgb, var(--waveform-fill) 55%, black)"/>
    </linearGradient></defs>}
    <path d={path}/>
  </svg>;
}

function Timeline({ time, duration, seek, peaks, trackKey }: { time: number; duration: number; seek: (value: number) => void; peaks: number[] | null; trackKey: string }) {
  const transition = usePlannedTransition(duration);
  const [preview, setPreview] = useState<{ percent: number; seconds: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  useEffect(() => { setPreview(null); setDragging(false); }, [trackKey]);
  const percent = duration > 0 ? Math.max(0, Math.min(100, time / duration * 100)) : 0;
  const path = peaks ? waveformMiniPath(peaks) : null;
  const previewAtPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!(duration > 0)) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const next = Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100));
    setPreview({ percent: next, seconds: duration * next / 100 });
  };
  return <div className={"player-timeline relative z-[1] grid grid-cols-[40px_minmax(0,1fr)_40px] gap-[12px] items-center text-[12px] text-[#cad8d3] whitespace-nowrap [&_.player-range-wrap]:[--player-thumb:0] max-[700px]:[grid-area:timeline] max-[700px]:grid-cols-[32px_minmax(0,1fr)_32px] max-[700px]:gap-[5px] max-[700px]:text-[10px] max-[360px]:grid-cols-[28px_minmax(0,1fr)_28px] "}><span>{timeLabel(time)}</span>
    <div className={`player-range-wrap relative h-[5px] rounded-[10px] [background:#465956] [&_input]:absolute [&_input]:inset-[-9px_0] [&_input]:w-full [&_input]:h-[22px] [&_input]:m-0 [&_input]:opacity-0 [&_input]:cursor-[pointer] [&:has(input:focus-visible)]:[outline:3px_solid_var(--site-accent)] [&:has(input:focus-visible)]:outline-offset-[5px] [&::after]:[content:''] [&::after]:absolute [&::after]:top-[50%] [&::after]:left-[var(--player-thumb,0)] [&::after]:w-[16px] [&::after]:h-[16px] [&::after]:rounded-full [&::after]:[background:var(--site-accent)] [&::after]:[transform:translate(-50%,-50%)] [&::after]:pointer-events-none [&::after]:z-[2] [&:has(input:disabled)::after]:hidden [&.has-waveform]:h-[20px] [&.has-waveform]:bg-transparent [&.has-waveform::before]:[content:''] [&.has-waveform::before]:absolute [&.has-waveform::before]:top-[50%] [&.has-waveform::before]:left-0 [&.has-waveform::before]:right-0 [&.has-waveform::before]:h-[2px] [&.has-waveform::before]:[transform:translateY(-50%)] [&.has-waveform::before]:[background:#465956] [&.has-waveform::before]:pointer-events-none [&.has-waveform_.player-range-fill]:hidden [&.is-seeking_.player-range-waveform.played]:transition-none [&.has-waveform_input]:inset-0 [&.has-waveform_input]:h-[20px] [&.has-waveform_input]:z-[2] ${path ? " has-waveform" : ""}${dragging ? " is-seeking" : ""}`} style={{ "--player-thumb": `${percent}%` } as CSSProperties} onPointerMove={previewAtPointer} onPointerLeave={() => { if (!dragging) setPreview(null); }}>
      <SeekWaveform key={`${trackKey}:base`} className={"player-range-waveform absolute inset-0 w-full h-full [fill:#738881] pointer-events-none [--waveform-fill:#738881] [&.played]:[fill:var(--player-accent)] [&.played]:[transition:clip-path_.18s_ease] [&.played]:[--waveform-fill:var(--player-accent)] "} path={path || "M0,0 H960 V100 H0 Z"} transitionStart={transition?.percent}/>
      <SeekWaveform key={`${trackKey}:played`} className={"player-range-waveform absolute inset-0 w-full h-full [fill:#738881] pointer-events-none [--waveform-fill:#738881] [&.played]:[fill:var(--player-accent)] [&.played]:[transition:clip-path_.18s_ease] [&.played]:[--waveform-fill:var(--player-accent)]  played"} path={path || "M0,0 H960 V100 H0 Z"} transitionStart={transition?.percent} clipPath={`inset(0 ${100 - percent}% 0 0)`}/>
      {preview && <span className={"player-seek-preview absolute z-[3] bottom-[calc(100%_+_2px)] [transform:translateX(-50%)] pointer-events-none text-[#f4f5f2] [font:700_10px_var(--site-font)] [&>span]:block [&>span]:p-[2px_5px] [&>span]:[background:var(--player-accent)] [&>span]:[box-shadow:0_2px_6px_#0005] [&>span]:whitespace-nowrap [&>span]:text-[#101b27] [&>span]:[border:0] [&>span]:rounded-[4px] [&::after]:[content:''] [&::after]:block [&::after]:w-[1px] [&::after]:h-[7px] [&::after]:m-auto [&::after]:[background:var(--player-accent)] "} style={{ left: `${preview.percent}%` }} aria-hidden="true"><span>{timeLabel(preview.seconds)}</span></span>}
      <input type="range" min={0} max={duration || 1} step="0.1" value={Math.min(time, duration || 1)} disabled={!duration} aria-label="Seek track" aria-description={transition ? `${transition.label} from ${timeLabel(transition.start)} to ${timeLabel(duration)}` : undefined} aria-valuetext={timeLabel(time)} onChange={event => { const seconds = Number(event.target.value); seek(seconds); if (dragging && duration) setPreview({ percent: seconds / duration * 100, seconds }); }} onPointerDown={() => setDragging(true)} onPointerUp={() => setDragging(false)} onPointerCancel={() => { setDragging(false); setPreview(null); }} onBlur={() => { setDragging(false); setPreview(null); }}/>
    </div><span>{timeLabel(duration)}</span>
  </div>;
}

function CompactSeek({ time, duration, seek, progressWidth, peaks }: { time: number; duration: number; seek: (value: number) => void; progressWidth: string; peaks: number[] | null }) {
  const transition = usePlannedTransition(duration);
  const [preview, setPreview] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [focused, setFocused] = useState(false);
  const previewAtPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!(duration > 0)) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setPreview(Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * duration);
  };
  const path = peaks?.length ? waveformPath(peaks) : "M0,100 L0,97 L960,97 L960,100 Z";
  const seconds = preview ?? (focused ? time : null);
  const percent = seconds !== null && duration > 0 ? seconds / duration * 100 : 0;

  return <div className={"player-compact-seek absolute left-[var(--player-visualization-inset)] right-0 z-[2] bottom-0 h-[16px] [&_.player-waveform]:top-auto [&_.player-waveform]:bottom-0 [&_.player-waveform]:h-[54px] [&_input]:absolute [&_input]:inset-0 [&_input]:w-full [&_input]:h-full [&_input]:m-0 [&_input]:opacity-0 [&_input]:cursor-[pointer] [&_input]:touch-none [&_input:disabled]:cursor-[default] [&:has(input:focus-visible)]:[outline:2px_solid_var(--player-accent)] [&:has(input:focus-visible)]:outline-offset-[-2px] [&:has(input:focus-visible)]:rounded-[3px] [&:has(input:disabled)]:opacity-[.4] "} onPointerMove={previewAtPointer} onPointerDown={previewAtPointer} onPointerLeave={() => { if (!dragging) setPreview(null); }}>
    <SeekWaveform className={"player-waveform absolute inset-0 w-full h-full z-0 pointer-events-none [fill:#b8f5db] opacity-[.11] [--waveform-fill:var(--player-accent)] "} path={path} transitionStart={transition?.percent}/>
    <SeekWaveform className={"player-waveform absolute inset-0 w-full h-full z-0 pointer-events-none [fill:#b8f5db] opacity-[.11] [--waveform-fill:var(--player-accent)]  played"} path={path} transitionStart={transition?.percent} clipPath={`inset(0 calc(100% - ${progressWidth}) 0 0)`}/>
    {seconds !== null && duration > 0 && <span className={"player-compact-seek-tooltip absolute z-[3] bottom-[18px] [transform:translateX(-50%)] p-[3px_6px] rounded-[4px] [background:var(--player-accent)] text-[#101b27] [box-shadow:0_2px_6px_#0005] [font:700_10px_var(--site-font)] whitespace-nowrap pointer-events-none [border:0] "} style={{ left: "clamp(28px, " + percent + "%, calc(100% - 28px))" }} aria-hidden="true">{timeLabel(seconds)}</span>}
    <input type="range" min={0} max={duration || 1} step="0.1" value={Math.min(time, duration || 1)} disabled={!duration} aria-label="Seek track" aria-description={transition ? `${transition.label} from ${timeLabel(transition.start)} to ${timeLabel(duration)}` : undefined} aria-valuetext={timeLabel(time) + " of " + timeLabel(duration)}
      onChange={event => { const seconds = Number(event.target.value); seek(seconds); setPreview(seconds); }}
      onPointerDown={() => setDragging(true)}
      onPointerUp={() => { setDragging(false); setPreview(null); }}
      onPointerCancel={() => { setDragging(false); setPreview(null); }}
      onFocus={event => setFocused(event.currentTarget.matches(":focus-visible"))}
      onBlur={() => { setFocused(false); setDragging(false); setPreview(null); }}/>
  </div>;
}

export default function MiniPlayer() {
  const { moveQueued, removeQueued, enqueueNext, current, isPlaying, toggle, seek, volume, setVolume, next, prev, canPrev, audioEl, repeatState, setRepeatState, toggleRepeatState, stop, shown, setShown, tracks, upcoming, shuffle, toggleShuffle, transitionMode, setTransitionMode, history, playItem } = useMusic();
  const { data: userData } = useSelf();
  const ratingGradientId = useId();
  const queryClient = useQueryClient();
  const [compact, setCompact] = useState(() => readStorage(storageKey.minimized) === "true");
  const [corner, setCorner] = useState<MiniCorner>(() => { const saved = readStorage(storageKey.corner); return validCorner(saved) ? saved : "bottom-left"; });
  const barRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const root = document.documentElement;
    const bar = barRef.current;
    if (!shown || compact || !current || !bar) {
      root.style.removeProperty("--expanded-player-height");
      return;
    }
    const measure = () => root.style.setProperty("--expanded-player-height", `${Math.ceil(bar.getBoundingClientRect().height) + 16}px`);
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    measure();
    return () => {
      observer.disconnect();
      root.style.removeProperty("--expanded-player-height");
    };
  }, [shown, compact, current?.song]);
  const [surfaceInset, setSurfaceInset] = useState(0);
  useLayoutEffect(() => {
    const bar = barRef.current;
    const disc = discButtonRef.current;
    if (!bar || !disc) return;
    const measure = () => {
      const bounds = bar.getBoundingClientRect();
      const parent = disc.offsetParent?.getBoundingClientRect();
      if (!parent || !bounds.width) return;
      const centerX = parent.left + disc.offsetLeft + disc.offsetWidth / 2;
      const centerY = parent.top + disc.offsetTop + disc.offsetHeight / 2;
      // Include the small exposed edge when the disc is pressed to 96% size.
      const radius = disc.offsetWidth * .48;
      const farthestY = Math.max(Math.abs(bounds.top - centerY), Math.abs(bounds.bottom - centerY));
      const chord = Math.sqrt(Math.max(0, radius * radius - farthestY * farthestY));
      const covered = farthestY >= radius ? 0 : compact && corner.endsWith("right")
        ? bounds.right - (centerX - chord)
        : centerX + chord - bounds.left;
      setSurfaceInset(Math.min(90, Math.max(0, covered / bounds.width * 100)));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    observer.observe(disc);
    measure();
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [compact, corner, shown, current?.song]);
  const gradientDirection = compact && corner.endsWith("right") ? "270deg" : "90deg";
  const gradientBase = compact ? "#1a2936" : "#101b27";
  const gradientStart = `color-mix(in srgb,var(--player-accent) 24%,${gradientBase})`;
  const gradientMiddle = `color-mix(in srgb,var(--player-accent) 9%,${gradientBase})`;
  const surfaceGradient = `linear-gradient(${gradientDirection},${gradientStart} 0%,${gradientMiddle} 48%,${gradientBase} 100%)`;
  const playerGradient = `linear-gradient(${gradientDirection},${gradientStart} ${surfaceInset}%,${gradientMiddle} ${surfaceInset + (100 - surfaceInset) * .48}%,${gradientBase} 100%)`;
  const [draggingMini, setDraggingMini] = useState(false);
  const suppressDragClick = useRef(false);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; moved: boolean } | null>(null);
  const [progress, setProgress] = useState({ time: 0, duration: 0 });
  const [peaks, setPeaks] = useState<{ source: string; values: number[] } | null>(null);
  const [discMenu, setDiscMenu] = useState<{ x: number; y: number } | null>(null);
  const [trackMenu, setTrackMenu] = useState<{ kind: "queue" | "history"; x: number; y: number } | null>(null);
  const [modeMenu, setModeMenu] = useState<{ x: number; y: number; section: "all" | "shuffle" | "playback" } | null>(null);
  const modeTriggerRef = useRef<HTMLElement | null>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const closeModeMenu = useCallback((restoreFocus = false) => { setModeMenu(null); if (restoreFocus) (modeTriggerRef.current ?? playButtonRef.current)?.focus(); }, []);
  const openModeMenu = (x: number, y: number, section: "all" | "shuffle" | "playback" = "all", trigger: HTMLElement | null = playButtonRef.current) => { modeTriggerRef.current = trigger; setDiscMenu(null); setTrackMenu(null); setModeMenu({ x, y, section }); };
  useEffect(() => { if (!shown) setModeMenu(null); }, [shown]);
  const trackMenuTrigger = useRef<HTMLElement | null>(null);
  const nextMenuTriggerRef = useRef<HTMLSpanElement | null>(null);
  const queueButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeTrackMenu = useCallback((restoreFocus = false) => { setTrackMenu(null); if (restoreFocus) trackMenuTrigger.current?.focus(); }, []);
  useEffect(() => { if (!shown) setTrackMenu(null); }, [shown]);
  const openTrackMenu = (kind: "queue" | "history", element: HTMLElement, x: number, y: number) => {
    setDiscMenu(null);
    setModeMenu(null);

    trackMenuTrigger.current = element;
    setTrackMenu({ kind, x, y });
  };
  const discButtonRef = useRef<HTMLButtonElement>(null);
  const [discPressed, setDiscPressed] = useState(false);
  useEffect(() => {
    if (!discPressed) return;
    const release = () => setDiscPressed(false);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);
    return () => { window.removeEventListener("pointerup", release); window.removeEventListener("pointercancel", release); window.removeEventListener("blur", release); };
  }, [discPressed]);
  const closeDiscMenu = useCallback((restoreFocus = false) => { setDiscMenu(null); if (restoreFocus) discButtonRef.current?.focus(); }, []);
  useEffect(() => setDiscMenu(null), [current?.id, current?.song, shown]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [mutedFrom, setMutedFrom] = useState(.5);
  const discRef = useRef<HTMLSpanElement | null>(null);
  const spinRef = useRef({ angle: 0, speed: 0, last: 0 });
  const [ratingCategoryId, setRatingCategoryId] = useState<number | null>(null);
  const [viewerTrackRatings, setViewerTrackRatings] = useState<ViewerTrackRating[]>([]);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [savingRating, setSavingRating] = useState(false);
  const viewerId = userData?.id ?? null;
  const effectiveHideRatings = useEffectiveHideRatings({ hideRatings: Boolean(userData?.hideRatings), autoHideRatingsWhileStreaming: Boolean(userData?.autoHideRatingsWhileStreaming), twitch: userData?.twitch ?? undefined });

  useEffect(() => writeStorage(storageKey.minimized, compact ? "true" : "false"), [compact]);
  useEffect(() => writeStorage(storageKey.corner, corner), [corner]);
  useEffect(() => { setViewerTrackRatings(Array.isArray(userData?.trackRatings) ? userData.trackRatings : []); }, [userData?.trackRatings]);
  useEffect(() => subscribeToTrackRatingSync(value => setViewerTrackRatings(previous => upsertTrackRatingRecord(previous, value))), []);
  useEffect(() => {
    let cancelled = false;
    void getTrackRatingCategories().then(async response => {
      if (!response.ok) return;
      const payload = await response.json();
      if (!cancelled) setRatingCategoryId(payload?.data?.find((category: { name: string }) => category.name === "Overall")?.id ?? null);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  useEffect(() => { setSelectedRating(viewerTrackRatings.find(value => value.trackId === current?.id && value.categoryId === ratingCategoryId)?.value ?? 0); }, [viewerTrackRatings, current?.id, ratingCategoryId]);
  useEffect(() => {
    if (!audioEl) return;
    let frame = 0;
    const tick = () => { setProgress(previous => {
      const time = Number.isFinite(audioEl.currentTime) ? audioEl.currentTime : 0;
      const duration = Number.isFinite(audioEl.duration) ? audioEl.duration : 0;
      return Math.abs(previous.time - time) >= .08 || previous.duration !== duration ? { time, duration } : previous;
    }); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [audioEl]);
  useEffect(() => {
    if (!current?.song) return;
    const source = current.song;
    const controller = new AbortController();
    setPeaks(null);
    void loadWaveform(source, controller.signal).then(values => { if (!controller.signal.aborted) setPeaks(values ? { source, values } : null); });
    return () => controller.abort();
  }, [current?.song]);
  useEffect(() => {
    const audio = audioEl;
    if (!audio) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const spin = spinRef.current;
    spin.angle = 0; spin.speed = 0; spin.last = 0;
    const tick = (now: number) => {
      const elapsed = spin.last ? Math.min(.08, Math.max(0, (now - spin.last) / 1000)) : 0;
      spin.last = now;
      const target = !motion.matches && !audio.paused ? 360 / 14 : 0;
      spin.speed += (target - spin.speed) * (1 - Math.exp(-elapsed * (target ? 6 : 5)));
      if (target === 0 && spin.speed < .05) spin.speed = 0;
      spin.angle = (spin.angle + spin.speed * elapsed) % 360;
      if (discRef.current) discRef.current.style.transform = `rotate(${motion.matches ? 0 : spin.angle}deg)`;
      if (!audio.paused || spin.speed > .1) frame = requestAnimationFrame(tick);
    };
    const start = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(tick); };
    audio.addEventListener("play", start); audio.addEventListener("pause", start); audio.addEventListener("timeupdate", start); motion.addEventListener("change", start);
    start();
    return () => { cancelAnimationFrame(frame); audio.removeEventListener("play", start); audio.removeEventListener("pause", start); audio.removeEventListener("timeupdate", start); motion.removeEventListener("change", start); };
  }, [audioEl, current?.song]);

  useEffect(() => {
    const clearDrag = () => { dragRef.current = null; setDraggingMini(false); };
    window.addEventListener("pointerup", clearDrag);
    window.addEventListener("pointercancel", clearDrag);
    window.addEventListener("blur", clearDrag);
    return () => {
      window.removeEventListener("pointerup", clearDrag);
      window.removeEventListener("pointercancel", clearDrag);
      window.removeEventListener("blur", clearDrag);
    };
  }, []);

  const onDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!compact || event.button !== 0 || !event.isPrimary || !event.currentTarget.contains(event.target as Node)) return;
    suppressDragClick.current = false;
    // Controls with their own drag gesture keep ownership; links and buttons
    // remain clickable until the shared player drag crosses its threshold.
    if ((event.target as Element).closest('input,textarea,select,[role="slider"],[role="menu"],[data-draggable="true"],[data-player-drag="exclude"]')) return;
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false };
  };
  const onDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 24) return;
    if (!drag.moved) event.currentTarget.setPointerCapture(event.pointerId);
    drag.moved = true;
    suppressDragClick.current = true;
    setDiscPressed(false);
    event.preventDefault();
    setDraggingMini(true);
  };
  const onDragEnd = (event: ReactPointerEvent<HTMLDivElement>, cancel = false) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null; setDraggingMini(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (drag.moved && !cancel) setCorner(value => cornerFromMiniDrag(value, event.clientX - drag.startX, event.clientY - drag.startY));
  };
  const onDragKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!compact || !event.altKey || event.target !== event.currentTarget || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault(); setCorner(value => arrowMiniCorner(value, event.key));
  };

  const teamIds = useMemo(() => Array.isArray(userData?.teams) ? userData.teams.map((team: { game?: { id?: number } | null }) => team.game?.id).filter((id: number | undefined): id is number => Number.isInteger(id)) : [], [userData]);
  const isOwnTrack = Boolean(viewerId && (current?.artist.id === viewerId || current?.game.team?.ownerId === viewerId || current?.game.team?.users?.some(member => member.id === viewerId) || (current?.game.id && teamIds.includes(current.game.id))));
  const canRate = Boolean(viewerId && !isOwnTrack && ratingCategoryId && current?.id);
  const rate = async (value: number) => {
    if (!canRate || savingRating || !current?.id || !ratingCategoryId) return;
    const previous = selectedRating;
    emitTrackRatingSync({ trackId: current.id, categoryId: ratingCategoryId, value });
    setSelectedRating(value); setSavingRating(true);
    try {
      const response = await postTrackRating(current.id, ratingCategoryId, value);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        addToast({ title: payload?.message ?? "Could not save track rating." });
        emitTrackRatingSync({ trackId: current.id, categoryId: ratingCategoryId, value: previous });
        setSelectedRating(previous);
      } else queryClient.invalidateQueries({ queryKey: queryKeys.user.self() });
    } catch {
      addToast({ title: "Could not save track rating." });
      emitTrackRatingSync({ trackId: current.id, categoryId: ratingCategoryId, value: previous });
      setSelectedRating(previous);
    } finally { setSavingRating(false); }
  };
  const libraryTrack = current ? tracks.find(track => (current.id != null && track.id === current.id) || (current.slug && track.slug === current.slug) || track.url === current.song) : undefined;

  const game = { ...current?.game, name: current?.game.name || libraryTrack?.game.name, slug: current?.game.slug || libraryTrack?.game.slug, thumbnail: current?.game.thumbnail || libraryTrack?.game.thumbnail, soundtrackThumbnail: current?.game.soundtrackThumbnail || libraryTrack?.game.soundtrackThumbnail };
  const artwork = current?.thumbnail || game.soundtrackThumbnail || game.thumbnail || "/images/game-thumbnail.png";
  const accent = useArtworkAccent(artwork);

  const touchMenu = useTouchMenu((kind, target) => {
    const rect = target.getBoundingClientRect();
    if (kind === "disc") { setDiscPressed(false); setTrackMenu(null); setModeMenu(null); setDiscMenu({ x: rect.left, y: rect.top }); }
    else if (kind === "queue" || kind === "history") openTrackMenu(kind, target, rect.left, rect.top);
    else openModeMenu(rect.left, rect.top, kind as "all" | "shuffle" | "playback", target);
  });
  const playerKeys = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (event.defaultPrevented || target.closest('input, textarea, select, [contenteditable="true"], [role="menu"]') || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === " " && !event.repeat) { event.preventDefault(); toggle(); }
    else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      if (event.shiftKey) void (event.key === "ArrowRight" ? next() : prev()).catch(() => addToast({ title: "Could not play track." }));
      else seek((audioEl?.currentTime ?? 0) + (event.key === "ArrowRight" ? 5 : -5));
    }
  };
  if (!current || !shown) return null;
  const artist = current.artist.name?.trim() || current.artist.slug?.trim() || "";
  const values = peaks?.source === current.song ? peaks.values : null;
  const key = current.song;
  const nextInQueue = async (track: TrackType, preserveQueue: boolean) => { await playItem({ id: track.id, slug: track.slug, name: track.name, artist: track.composer, thumbnail: track.game.soundtrackThumbnail || track.game.thumbnail || "", game: track.game, song: track.url, loudnessGainDb: track.loudnessGainDb, pageVersion: track.pageVersion, allowDownload: track.allowDownload, license: track.license, allowBackgroundUse: track.allowBackgroundUse, allowBackgroundUseAttribution: track.allowBackgroundUseAttribution }, tracks, { preserveQueue }); };
  const mute = () => { if (volume > 0) { setMutedFrom(volume); setVolume(0); } else setVolume(mutedFrom || .5); };
  const progressWidth = (progress.duration > 0 ? Math.max(0, Math.min(100, progress.time / progress.duration * 100)) : 0) + "%";
  const rootClass = compact ? `player-mini-shell touch-none select-none fixed z-[50] w-[min(312px,100vw)] h-[54px] [--compact-disc-gap:5px] [--player-visualization-inset:calc(var(--compact-disc-left)_+_var(--compact-disc-diameter)_-_13px)] [&[data-corner$='left']]:left-0 [&[data-corner$='left']]:right-auto [&[data-corner$='right']]:left-auto [&[data-corner$='right']]:right-0 [&[data-corner^='top']]:top-[var(--site-navbar-height,_0px)] [&[data-corner^='top']]:bottom-auto [&[data-corner^='bottom']]:top-auto [&[data-corner^='bottom']]:bottom-0 [&_.player-bar.is-compact]:absolute [&_.player-bar.is-compact]:inset-0 [&_.player-bar.is-compact]:w-full [&_.player-bar.is-compact]:max-w-none [&_.player-bar.is-compact]:pt-[5px] [&_.player-bar.is-compact]:pb-[5px] [&_.player-disc-window.is-compact]:absolute [&_.player-disc-window.is-compact]:left-0 [&_.player-disc-window.is-compact]:bottom-0 [&[data-corner='top-left']_.player-bar.is-compact]:rounded-[0_0_10px_0] [&[data-corner='bottom-right']_.player-bar.is-compact]:rounded-[10px_0_0_0] [&[data-corner='top-right']_.player-bar.is-compact]:rounded-[0_0_0_10px] [&[data-corner$='right']_.player-bar.is-compact]:grid-cols-[auto_minmax(0,1fr)] [&[data-corner$='right']_.player-bar.is-compact]:[grid-template-areas:'transport_track'] [&[data-corner$='right']_.player-bar.is-compact]:p-[5px_calc(var(--compact-disc-left)_+_var(--compact-disc-diameter)_+_var(--compact-disc-gap))_5px_7px] [&[data-corner$='right']_.player-disc-window.is-compact]:left-auto [&[data-corner$='right']_.player-disc-window.is-compact]:right-0 [&[data-corner$='right']_.player-disc-window.is-compact_.player-disc-toggle]:left-auto [&[data-corner$='right']_.player-disc-window.is-compact_.player-disc-toggle]:right-[var(--compact-disc-left)] [&_.player-drag-area]:min-h-[36px] [&_.player-drag-area]:cursor-[grab] [&_.player-drag-area]:touch-none [&_.player-drag-area]:select-none [&.is-dragging]:cursor-[grabbing]! [&.is-dragging_*]:cursor-[grabbing]! [&_.player-drag-area:focus-visible]:[outline:2px_solid_var(--player-accent)] [&_.player-drag-area:focus-visible]:outline-offset-[2px] [&_.player-identity]:w-full [&_.player-identity]:justify-center [&_.player-identity]:gap-[2px] [&_.player-identity_strong]:leading-[18px] [&_.player-identity>span]:leading-[14px] [&[data-corner$='right']_.player-compact-seek]:left-0 [&[data-corner$='right']_.player-compact-seek]:right-[var(--player-visualization-inset)] ${draggingMini ? " is-dragging" : ""}` : "player-full-shell contents";
  return <div {...touchMenu}
    onPointerDownCapture={event => { touchMenu.onPointerDownCapture(event); onDragStart(event); }}
    onPointerMove={onDragMove}
    onPointerUp={event => onDragEnd(event)}
    onPointerCancel={event => onDragEnd(event, true)}
    onLostPointerCapture={event => onDragEnd(event, true)}
    onDragStart={event => { if (compact && dragRef.current && event.currentTarget.contains(event.target as Node)) event.preventDefault(); }}
    onClickCapture={event => {
      if (suppressDragClick.current && event.detail !== 0) {
        event.preventDefault(); event.stopPropagation(); suppressDragClick.current = false; return;
      }
      touchMenu.onClickCapture(event);
    }}
    onKeyDown={playerKeys} tabIndex={0} aria-label="Music player" className={`jamjar-yard-player [--player-disc-diameter:116px] [--player-disc-left:-16px] [--player-disc-bottom:-22px] [--compact-disc-left:-14px] [--compact-disc-diameter:82px] [--compact-disc-gap:9px] [--player-accent:#80cfae] [--site-bg:#101b27] [--site-surface:#1a2936] [--site-surface-hover:#263947] [--site-line:#354c59] [--site-accent:#19ff90] [--site-font:Inter,system-ui,sans-serif] text-[#f4f5f2] max-[700px]:[--player-disc-diameter:110px] max-[700px]:[--player-disc-left:-14px] max-[700px]:[--player-disc-bottom:-7px] [&_.record-disc-hole]:[fill:#101b27] [&_.player-color-layer]:[background:linear-gradient(90deg,color-mix(in_srgb,var(--player-accent)_24%,transparent)_0%,color-mix(in_srgb,var(--player-accent)_9%,transparent)_48%,transparent_100%)] [&_.player-bar.is-compact_.player-transport]:gap-0 [&_.player-bar.is-compact_.player-transport_.player-skip]:w-[28px] [&_.player-bar.is-compact_.player-transport_.player-skip]:h-[28px] [&_.player-bar.is-compact_.player-transport_.player-skip]:min-w-[28px] [&_.player-bar.is-compact_.player-transport_.player-skip]:min-h-[28px] [&_.player-bar.is-compact_.player-transport_.player-skip]:[flex:0_0_28px] [&_.player-bar.is-compact_.player-transport_.player-skip]:p-[3px] [&_.player-bar.is-compact_.player-primary]:w-[28px] [&_.player-bar.is-compact_.player-primary]:h-[28px] [&_.player-bar.is-compact_.player-primary]:min-w-[28px] [&_.player-bar.is-compact_.player-primary]:min-h-[28px] [&_.player-bar.is-compact_.player-primary]:[flex:0_0_28px] [&_.player-bar.is-compact_.player-primary]:p-[3px] [&_.player-identity_a]:text-[inherit] [&_.player-identity_a]:no-underline [&_.player-identity_a:hover]:underline [&_.player-queue]:[--site-surface:#1a2936] [&_.player-queue]:[--site-surface-hover:#263947] [&_.player-queue]:[--site-line:#354c59] [&_.player-queue]:[--site-font:Inter,system-ui,sans-serif] max-[700px]:[&_.player-extras]:gap-[2px] max-[700px]:[&_.player-extras_button]:min-w-[25px] max-[700px]:[&_.player-identity_strong]:text-[13px] [&_.player-rating]:flex [&_.player-rating]:items-center [&_.player-rating]:gap-[1px] [&_.player-rating]:text-[var(--player-accent)] [&_.player-rating_.player-rating-half]:absolute [&_.player-rating_.player-rating-half]:top-0 [&_.player-rating_.player-rating-half]:w-[50%] [&_.player-rating_.player-rating-half]:min-w-0 [&_.player-rating_.player-rating-half]:h-full [&_.player-rating_.player-rating-half]:p-0 [&_.player-rating_.player-rating-half]:text-[inherit] [&_.player-rating_.player-rating-half:focus-visible]:outline-offset-0 [&_[data-touch-menu]]:[-webkit-touch-callout:none] [&_[data-touch-menu]]:select-none  ${rootClass}`} style={{ "--player-accent": accent } as CSSProperties} data-corner={compact ? corner : undefined}>
    <div className={`player-disc-window fixed z-[51] left-0 bottom-0 w-[var(--player-disc-diameter)] h-[var(--player-disc-diameter)] overflow-visible pointer-events-none [&.is-compact]:left-0 [&.is-compact]:bottom-0 [&.is-compact]:w-[calc(var(--compact-disc-left)_+_var(--compact-disc-diameter))] [&.is-compact]:h-[54px] [&.is-compact]:bg-transparent [&.is-compact_.player-disc-toggle]:left-[var(--compact-disc-left)] [&.is-compact_.player-disc-toggle]:bottom-[-14px] [&.is-compact_.player-disc-toggle]:w-[var(--compact-disc-diameter)] [&.is-compact_.player-disc-toggle]:h-[var(--compact-disc-diameter)] ${compact ? " is-compact" : ""}`}><button data-touch-menu="disc" ref={discButtonRef} className={"player-disc-toggle absolute left-[var(--player-disc-left)] bottom-[var(--player-disc-bottom)] w-[var(--player-disc-diameter)] h-[var(--player-disc-diameter)] block p-0 [border:0] rounded-full bg-transparent cursor-[pointer] pointer-events-auto [box-shadow:0_3px_8px_#0005] [transition:transform_.18s_ease] origin-center [&_.player-disc]:static [&_.player-disc]:grid [&_.player-disc]:w-full [&_.player-disc]:h-full [&:focus-visible]:[outline:3px_solid_var(--site-accent)] [&:focus-visible]:outline-offset-[3px] [&:focus-visible]:[outline-color:var(--player-accent)] [@media(hover:hover)]:[&:hover]:[transform:scale(1.05)] [@media(prefers-reduced-motion:reduce)]:transition-none [&[data-pressed='true']]:[transform:scale(.96)] [&[data-pressed='true']]:[transition-duration:70ms] [&[aria-expanded='true']]:[transform:scale(1.05)] "} type="button" data-pressed={discPressed} onPointerDown={event => setDiscPressed(event.button === 0)} onPointerLeave={() => setDiscPressed(false)} onBlur={() => setDiscPressed(false)} onKeyUp={() => setDiscPressed(false)} aria-haspopup="menu" aria-expanded={Boolean(discMenu)} onContextMenu={event => { event.preventDefault(); setDiscPressed(false); setTrackMenu(null); setModeMenu(null); setDiscMenu({ x: event.clientX, y: event.clientY }); }} onKeyDown={event => { if (event.key === " " || event.key === "Enter") setDiscPressed(true); if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) { event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); setModeMenu(null); setDiscMenu({ x: Math.max(8, rect.left), y: Math.max(8, rect.top) }); } }} onClick={() => setCompact(value => !value)} aria-label={compact ? "Expand music player" : "Collapse music player"} aria-pressed={compact}><RecordDisc artwork={artwork} trackKey={key} discRef={discRef}/></button></div>
    <aside ref={barRef} className={`player-bar fixed z-[50] isolate overflow-hidden left-0 right-0 bottom-0 max-w-[100vw] box-border min-h-[72px] grid grid-cols-[minmax(160px,1.25fr)_118px_minmax(260px,2.1fr)_minmax(205px,1.2fr)] gap-[clamp(15px,2vw,32px)] items-center p-[8px_clamp(22px,4.3vw,68px)_8px_calc(var(--player-disc-diameter)_-_2px)] [border:0] [background:var(--site-bg)] text-[#f4f5f2] [box-shadow:0_-6px_24px_#0007] [font-family:var(--site-font)] [&_button]:cursor-[pointer] [&_button]:grid [&_button]:place-items-center [&_button]:[border:0] [&_button]:bg-transparent [&_button]:text-[#f4f5f2] [&_button]:p-[5px] [&_button:focus-visible]:[outline:3px_solid_var(--site-accent)] [&_button:focus-visible]:outline-offset-[3px] [&_button:focus-visible]:[outline-color:var(--player-accent)] [&_button:disabled]:cursor-[not-allowed] [&_button:disabled]:opacity-[.45] [&_.player-primary]:w-[34px] [&_.player-primary]:h-[34px] [&_.player-primary]:rounded-full [&_.player-primary]:[background:var(--player-accent)] [&_.player-primary]:text-[#101b27] max-[1050px]:grid-cols-[minmax(120px,1fr)_110px_minmax(180px,1.5fr)_150px] max-[1050px]:gap-[12px] max-[1050px]:p-[8px_18px_8px_calc(var(--player-disc-diameter)_-_2px)] max-[700px]:min-h-[96px] max-[700px]:grid-cols-[auto_minmax(0,1fr)] max-[700px]:[grid-template-areas:'track_track'_'transport_extras'_'timeline_timeline'] max-[700px]:gap-[2px_6px] max-[700px]:p-[5px_10px_5px_calc(var(--player-disc-diameter)_-_2px)] max-[700px]:[&_.player-primary]:w-[32px] max-[700px]:[&_.player-primary]:h-[32px] [&.is-compact]:left-0 [&.is-compact]:right-auto [&.is-compact]:bottom-0 [&.is-compact]:w-[min(312px,100vw)] [&.is-compact]:min-h-[54px] [&.is-compact]:grid-cols-[minmax(0,1fr)_auto] [&.is-compact]:[grid-template-areas:'track_transport'] [&.is-compact]:gap-[4px] [&.is-compact]:p-[5px_7px_5px_calc(var(--compact-disc-left)_+_var(--compact-disc-diameter)_+_var(--compact-disc-gap))] [&.is-compact]:[border:0] [&.is-compact]:rounded-[0_10px_0_0] [&.is-compact]:box-border [&.is-compact]:[background:var(--site-surface)] [&.is-compact_.player-track]:[grid-area:track] [&.is-compact_.player-transport]:[grid-area:transport] [&.is-compact_.player-transport]:justify-end [&.is-compact_.player-timeline]:hidden [&.is-compact_.player-extras]:hidden [&.is-compact_.player-identity]:max-w-full [&.is-compact_.player-identity_strong]:text-[13px] [&.is-compact_.player-identity>span]:text-[10px] [&.is-compact_.player-transport_.player-skip]:w-[28px] [&.is-compact_.player-transport_.player-skip]:h-[28px] [&.is-compact_.player-transport_.player-skip]:min-w-[28px] [&.is-compact_.player-transport_.player-skip]:min-h-[28px] [&.is-compact_.player-transport_.player-skip]:[flex:0_0_28px] [&.is-compact_.player-transport_.player-skip]:self-center [&.is-compact_.player-transport_.player-skip]:p-[3px] [&.is-compact_.player-primary]:w-[28px] [&.is-compact_.player-primary]:h-[28px] [&.is-compact_.player-primary]:min-w-[28px] [&.is-compact_.player-primary]:min-h-[28px] [&.is-compact_.player-primary]:[flex:0_0_28px] [&.is-compact_.player-primary]:self-center [&.is-compact_.player-primary]:p-[3px] [&.is-compact_.player-transport_svg]:w-[16px] [&.is-compact_.player-transport_svg]:h-[16px] [&.is-compact_.player-waveform]:opacity-[.14] max-[700px]:[&.is-compact]:min-h-[54px] max-[700px]:[&.is-compact]:grid-cols-[minmax(0,1fr)_auto] max-[700px]:[&.is-compact]:[grid-template-areas:'track_transport'] max-[700px]:[&.is-compact]:gap-[3px] max-[700px]:[&.is-compact]:p-[5px_6px_5px_calc(var(--compact-disc-left)_+_var(--compact-disc-diameter)_+_var(--compact-disc-gap))] max-[700px]:[&.is-compact_.player-transport]:gap-0 [&_.player-range-fill]:[background:var(--player-accent)] [&_.player-volume-fill]:[background:var(--player-accent)] [&_.player-range-wrap::after]:[background:var(--player-accent)] [&_.player-extras_.selected]:text-[var(--player-accent)] [&_.player-waveform]:[fill:var(--player-accent)] [&_.player-range-wrap:has(input:focus-visible)]:[outline-color:var(--player-accent)] [&_.player-volume-wrap:has(input:focus-visible)]:[outline-color:var(--player-accent)] [&.is-compact_.player-transport_.player-favorite]:w-[28px] [&.is-compact_.player-transport_.player-favorite]:h-[28px] [&.is-compact_.player-transport_.player-favorite]:min-w-[28px] [&.is-compact_.player-transport_.player-favorite]:min-h-[28px] [&.is-compact_.player-transport_.player-favorite]:[flex:0_0_28px] [&.is-compact_.player-transport_.player-favorite]:p-[3px] [&.is-compact_.player-transport_.player-favorite_svg]:w-[17px] [&.is-compact_.player-transport_.player-favorite_svg]:h-[17px] [&.is-compact_.player-waveform.played]:[fill:color-mix(in_srgb,var(--player-accent)_65%,white)] [&.is-compact_.player-waveform.played]:opacity-[.28] [&.is-compact_.player-waveform.played]:[--waveform-fill:color-mix(in_srgb,var(--player-accent)_65%,white)] [&:not(.is-compact)_.player-track]:gap-[12px] [&:not(.is-compact)_.player-identity]:flex-1 ${compact ? " is-compact" : ""}`} aria-label="Music player">
      <div className={"player-color-layer absolute inset-0 z-0 pointer-events-none "} style={{ background: playerGradient }} aria-hidden="true"/>
      <div className={`player-track relative z-[1] flex items-center min-w-0 max-[700px]:[grid-area:track] ${compact ? " player-drag-area" : ""}`} role={compact ? "group" : undefined} tabIndex={compact ? 0 : undefined} aria-label={compact ? "Move mini player. Drag, or use Alt and arrow keys to choose a corner." : undefined} onKeyDown={onDragKey}>
        <div className={"player-identity flex flex-col min-w-0 gap-[4px] [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-[16px] [&_strong]:font-extrabold [&>span]:overflow-hidden [&>span]:text-ellipsis [&>span]:whitespace-nowrap [&>span]:text-[13px] [&>span]:text-[inherit] [&_small]:text-[#ffad9e] [&_small]:text-[11px] max-[700px]:[&_strong]:text-[14px] max-[700px]:[&>span]:text-[11px] [&_.player-title]:block [&_.player-title]:max-w-full [&_.player-title]:text-clip [@media(prefers-reduced-motion:reduce)]:[&_.player-title]:text-ellipsis "}><ScrollingTrackTitle name={current.name} href={current.slug ? pageVersionUrl(`/m/${current.slug}`, current.pageVersion, defaultGameVersion(current.game)) : undefined}/><span>{artist && current.artist.slug ? <UserHoverPreview user={{ ...current.artist, slug: current.artist.slug }} portal className={"player-artist-preview max-w-full [vertical-align:bottom] [&>a]:overflow-hidden [&>a]:text-ellipsis [&>a]:whitespace-nowrap "}><Link href={`/u/${current.artist.slug}`}>{artist}</Link></UserHoverPreview> : artist}</span>
        </div>
        {!compact && canRate && <div className={"player-rating-slot flex-none ml-auto "}><RatingVisibilityGate inline hiddenByPreference={effectiveHideRatings} hiddenText="Ratings are hidden by your settings." buttonSize="xs">
          <div className="player-rating" role="group" aria-label={`Rate ${current.name}`} onMouseLeave={() => setHoverRating(0)}>
            {Array.from({ length: 5 }, (_, index) => {
              const fill = Math.max(0, Math.min(2, (hoverRating || selectedRating) - index * 2)) * 50;
              return <span className={"player-rating-star relative block w-[20px] h-[26px] flex-none [&_svg]:absolute [&_svg]:left-0 [&_svg]:top-[3px] [&_svg]:pointer-events-none "} key={index} onPointerMove={event => {
                if (savingRating || event.pointerType === "touch") return;
                const bounds = event.currentTarget.getBoundingClientRect();
                setHoverRating(index * 2 + (event.clientX < bounds.left + bounds.width / 2 ? 1 : 2));
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <defs><linearGradient id={`${ratingGradientId}-${index}`} x1="0" y1="0" x2="24" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset={`${fill}%`} stopColor="var(--player-accent)"/>
                    <stop offset={`${fill}%`} stopColor="color-mix(in srgb, var(--player-accent) 28%, var(--site-surface-hover))"/>
                  </linearGradient></defs>
                  <path d="M11.624 1.762 Q12 1 12.376 1.762 L15.024 7.138 Q15.4 7.9 16.241 8.022 L22.159 8.878 Q23 9 22.393 9.596 L18.107 13.804 Q17.5 14.4 17.643 15.238 L18.657 21.162 Q18.8 22 18.049 21.602 L12.751 18.798 Q12 18.4 11.249 18.798 L5.951 21.602 Q5.2 22 5.343 21.162 L6.357 15.238 Q6.5 14.4 5.893 13.804 L1.607 9.596 Q1 9 1.841 8.878 L7.759 8.022 Q8.6 7.9 8.976 7.138Z" fill={`url(#${ratingGradientId}-${index})`} stroke="none"/>
                </svg>
                {[1, 2].map(half => {
                  const value = index * 2 + half;
                  return <button key={half} type="button" className="player-rating-half" style={{ left: half === 1 ? 0 : "50%" }} aria-label={`Rate ${value / 2} of 5 stars`} title={`${value / 2} stars`} aria-pressed={selectedRating === value} disabled={savingRating} onMouseEnter={() => setHoverRating(value)} onFocus={() => setHoverRating(value)} onBlur={() => setHoverRating(0)} onClick={() => { void rate(value); }}/>
                })}
              </span>;
            })}
          </div>
        </RatingVisibilityGate></div>}
      </div>
      <div className={"player-transport relative z-[1] flex items-center justify-center gap-[5px] [&_.player-skip]:w-[34px] [&_.player-skip]:h-[34px] [&_.player-skip]:rounded-full [&_.player-skip]:text-[#f4f5f2] [&_.player-skip:hover:not(:disabled)]:[background:#ffffff20] max-[700px]:[grid-area:transport] max-[700px]:justify-start max-[700px]:gap-[3px] max-[700px]:[&_.player-skip]:w-[32px] max-[700px]:[&_.player-skip]:h-[32px] max-[360px]:gap-[2px] [&_button]:[transition:transform_.16s_ease,background-color_.16s_ease,filter_.16s_ease] [@media(hover:hover)]:[&_button:hover:not(:disabled)]:[transform:scale(1.07)] [@media(hover:hover)]:[&_.player-primary:hover:not(:disabled)]:[filter:brightness(1.1)] [&_button[aria-expanded='true']:not(:disabled)]:[transform:scale(1.07)] [&_.player-primary[aria-expanded='true']:not(:disabled)]:[filter:brightness(1.1)] [&_button:active:not(:disabled)]:[transform:scale(.93)] [&_button:active:not(:disabled)]:[transition-duration:70ms] [@media(prefers-reduced-motion:reduce)]:[&_button]:transition-none "}><span className={"player-skip-menu-trigger [&[aria-expanded='true']_.player-skip:not(:disabled)]:[transform:scale(1.07)] [&[aria-expanded='true']_.player-skip:not(:disabled)]:[background:#ffffff20] inline-flex flex-none rounded-full [&:focus-visible]:[outline:2px_solid_var(--player-accent)] [&:focus-visible]:outline-offset-[2px] [&_button:disabled]:pointer-events-none "} tabIndex={0} role="group" data-touch-menu="history" aria-label="Playback history" aria-haspopup="menu" aria-expanded={trackMenu?.kind === "history"} onContextMenu={event => { event.preventDefault(); openTrackMenu("history", event.currentTarget, event.clientX, event.clientY); }} onKeyDown={event => { if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) { event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); openTrackMenu("history", event.currentTarget, rect.left, rect.top); } }}><button className="player-skip" type="button" onClick={() => { void prev(); }} disabled={!canPrev} aria-label="Previous track"><SkipBack size={20} fill="currentColor"/></button></span><button data-touch-menu="all" ref={playButtonRef} className={"player-primary [&_svg]:w-[17px] "} type="button" aria-haspopup="menu" aria-expanded={modeMenu?.section === "all"} onContextMenu={event => { event.preventDefault(); openModeMenu(event.clientX, event.clientY); }} onKeyDown={event => { if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) { event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); openModeMenu(rect.left, rect.top); } }} onClick={toggle} aria-label={isPlaying ? "Pause" : "Play"}>{isPlaying ? <Pause size={19} fill="currentColor"/> : <Play size={19} fill="currentColor"/>}</button><span ref={nextMenuTriggerRef} className={"player-skip-menu-trigger [&[aria-expanded='true']_.player-skip:not(:disabled)]:[transform:scale(1.07)] [&[aria-expanded='true']_.player-skip:not(:disabled)]:[background:#ffffff20] inline-flex flex-none rounded-full [&:focus-visible]:[outline:2px_solid_var(--player-accent)] [&:focus-visible]:outline-offset-[2px] [&_button:disabled]:pointer-events-none "} tabIndex={0} role="group" data-touch-menu="queue" aria-label="Music queue" aria-haspopup="menu" aria-expanded={trackMenu?.kind === "queue" && trackMenuTrigger.current === nextMenuTriggerRef.current} onContextMenu={event => { event.preventDefault(); openTrackMenu("queue", event.currentTarget, event.clientX, event.clientY); }} onKeyDown={event => { if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) { event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); openTrackMenu("queue", event.currentTarget, rect.left, rect.top); } }}><button className="player-skip" type="button" onClick={() => { void next(); }} disabled={!upcoming.length} aria-label="Next track"><SkipForward size={20} fill="currentColor"/></button></span></div>
      {!compact && <Timeline time={progress.time} duration={progress.duration} seek={seek} peaks={values} trackKey={key}/>}
      {compact && <CompactSeek key={key} time={progress.time} duration={progress.duration} seek={seek} progressWidth={progressWidth} peaks={values}/>}
      {!compact && <div className={"player-extras relative z-[1] flex items-center justify-end gap-[15px] [&_.selected]:text-[var(--site-accent)] max-[1050px]:gap-[8px] max-[700px]:[grid-area:extras] max-[700px]:gap-[4px] max-[700px]:[&_button]:min-w-[28px] max-[700px]:[&_button]:h-[28px] max-[700px]:[&_button]:p-[2px] max-[360px]:gap-[2px] [&_.player-favorite]:ml-[2px] [&>button]:rounded-full [&>button]:[transition:transform_.15s_ease,background-color_.15s_ease] [@media(hover:hover)]:[&>button:hover:not(:disabled)]:[background:#ffffff20] [@media(hover:hover)]:[&>button:hover:not(:disabled)]:[transform:scale(1.07)] [&>button[aria-expanded='true']:not(:disabled)]:[background:#ffffff20] [&>button[aria-expanded='true']:not(:disabled)]:[transform:scale(1.07)] [&>button:active:not(:disabled)]:[transform:scale(.95)] "}><button type="button" onClick={mute} aria-label={volume === 0 ? "Unmute" : "Mute"}>{volume === 0 ? <VolumeX size={20}/> : <Volume2 size={20}/>}</button><div className={"player-volume-wrap relative h-[5px] rounded-[10px] [background:#465956] w-[102px] flex-none [&_input]:absolute [&_input]:inset-[-9px_0] [&_input]:w-full [&_input]:h-[22px] [&_input]:m-0 [&_input]:opacity-0 [&_input]:cursor-[pointer] [&:has(input:focus-visible)]:[outline:3px_solid_var(--site-accent)] [&:has(input:focus-visible)]:outline-offset-[5px] max-[1050px]:w-[65px] max-[700px]:w-[38px] max-[360px]:hidden "}><span className={"player-volume-fill block h-full rounded-[10px] [background:var(--site-accent)] "} style={{ width: `${volume * 100}%` }} aria-hidden="true"/><input type="range" min="0" max="1" step="0.01" value={volume} onChange={event => setVolume(Number(event.target.value))} aria-label="Volume"/></div><button type="button" data-touch-menu="playback" onClick={toggleRepeatState} aria-haspopup="menu" aria-expanded={modeMenu?.section === "playback"} onContextMenu={event => { event.preventDefault(); openModeMenu(event.clientX, event.clientY, "playback", event.currentTarget); }} onKeyDown={event => { if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) { event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); openModeMenu(rect.left, rect.top, "playback", event.currentTarget); } }} aria-label={repeatState === "repeat" ? "Repeat track" : repeatState === "autoplay" ? (transitionMode === "off" ? "Autoplay with no transition" : transitionMode === "automix" ? "Autoplay with Automix" : "Autoplay with Crossfade") : "Stop after track"} title={repeatState === "repeat" ? "Repeat track" : repeatState === "autoplay" ? (transitionMode === "off" ? "Autoplay with no transition" : transitionMode === "automix" ? "Autoplay with Automix" : "Autoplay with Crossfade") : "Stop after track"}>{repeatState === "repeat" ? <Repeat1 size={19}/> : repeatState === "autoplay" ? <span className={"player-mode-icon relative inline-flex "}><InfinityIcon size={19}/><span className={"player-order-badge absolute right-auto bottom-[-5px] grid place-items-center w-[14px] h-[14px] rounded-full [background:#101b27] text-[#f4f5f2] pointer-events-none left-[-5px] "} aria-hidden="true">{shuffle ? <Shuffle size={11}/> : <ListOrdered size={11}/>}</span><span className={"player-transition-badge absolute right-[-5px] bottom-[-5px] grid place-items-center w-[14px] h-[14px] rounded-full [background:#101b27] text-[#f4f5f2] pointer-events-none "} aria-hidden="true">{transitionMode === "automix" ? <AudioLines size={11}/> : transitionMode === "crossfade" ? <Blend size={11}/> : <CircleOff size={11}/>}</span></span> : <CircleStop size={19}/>}</button>{current.allowDownload && current.slug && <button type="button" disabled={isDownloading} aria-label="Download track" title="Download track" onClick={() => {
        setIsDownloading(true);
        void downloadTrackBySlug(current.slug!, current.name, current.pageVersion)
          .catch(() => addToast({ title: "Could not download track." }))
          .finally(() => setIsDownloading(false));
      }}><Download size={19}/></button>}<button type="button" ref={queueButtonRef} onPointerDown={event => event.stopPropagation()} onClick={event => {
        if (trackMenu?.kind === "queue" && trackMenuTrigger.current === event.currentTarget) { closeTrackMenu(); return; }
        const rect = event.currentTarget.getBoundingClientRect();
        openTrackMenu("queue", event.currentTarget, rect.left, rect.top);
      }} data-touch-menu="queue" aria-label="Music queue" aria-haspopup="menu" aria-expanded={trackMenu?.kind === "queue" && trackMenuTrigger.current === queueButtonRef.current}><ListMusic size={21}/></button><button type="button" onClick={() => { stop(); setShown(false); }} aria-label="Close music player"><X size={18}/></button></div>}
    </aside>
    {modeMenu && <PlayerModeMenu anchor={modeTriggerRef.current} section={modeMenu.section} transitionMode={transitionMode} onTransition={setTransitionMode} mode={repeatState} x={modeMenu.x} y={modeMenu.y} accent={accent} surfaceGradient={surfaceGradient} onSelect={setRepeatState} onShuffle={toggleShuffle} shuffle={shuffle} onClose={closeModeMenu}/>}
    {trackMenu && <PlayerTrackMenu anchor={trackMenuTrigger.current} onMove={moveQueued} onRemove={removeQueued} onEnqueue={enqueueNext} kind={trackMenu.kind} tracks={trackMenu.kind === "history" ? history : upcoming} x={trackMenu.x} y={trackMenu.y} accent={accent} surfaceGradient={surfaceGradient} onPlay={track => { void nextInQueue(track, trackMenu.kind === "queue").catch(() => addToast({ title: "Could not play track." })); }} onClose={closeTrackMenu}/>}
    {discMenu && <PlayerContextMenu anchor={discButtonRef.current} track={current} x={discMenu.x} y={discMenu.y} accent={accent} surfaceGradient={surfaceGradient} closePlayer={() => { stop(); setShown(false); }} onClose={closeDiscMenu}/>}
  </div>;
}
