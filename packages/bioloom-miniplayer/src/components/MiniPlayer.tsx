"use client";

import { usePlayerUI } from "../context/PlayerUIContext";

import styles from "./MiniPlayer.module.css";

import {
  ChevronDown,
  AudioLines,
  Blend,
  CircleOff,
  Download,
  Infinity as InfinityIcon,
  ListMusic,
  ListOrdered,
  Pause,
  Play,
  CircleStop,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { readStorage, storageKeys, writeStorage } from "../lib/storage";
import { useMusic } from "../hooks/useMusic";
import type { TrackType } from "../context/MusicContext";
import { toPlayableTrack } from "../context/MusicContext";
import {
  arrowMiniCorner,
  cornerFromMiniDrag,
  type MiniCorner,
} from "../lib/corner";
import { useArtworkAccent } from "../hooks/useArtworkAccent";
import PlayerContextMenu from "./menus/PlayerContextMenu";
import PlayerTrackMenu from "./menus/PlayerTrackMenu";
import RecordDisc from "./RecordDisc";
import { useTouchMenu } from "../hooks/useTouchMenu";
import PlayerModeMenu from "./menus/PlayerModeMenu";
import ScrollingTrackTitle from "./ScrollingTrackTitle";
import { Timeline, CompactSeek } from "./PlayerTimeline";

const validCorner = (value: string | null): value is MiniCorner =>
  value === "top-left" ||
  value === "top-right" ||
  value === "bottom-left" ||
  value === "bottom-right";

// Share pointer and keyboard positioning while each control chooses its menu.
function menuHandlers(
  open: (x: number, y: number, trigger: HTMLElement) => void,
) {
  return {
    onContextMenu(event: ReactMouseEvent<HTMLElement>) {
      event.preventDefault();
      open(event.clientX, event.clientY, event.currentTarget);
    },
    onKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
      if (
        event.key !== "ContextMenu" &&
        !(event.shiftKey && event.key === "F10")
      )
        return;
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      open(Math.max(8, rect.left), Math.max(8, rect.top), event.currentTarget);
    },
  };
}

export default function MiniPlayer() {
  const ui = usePlayerUI();
  const { Link } = ui;
  const [mobile, setMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(width < 700px)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(width < 700px)");
    const update = () => setMobile(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const {
    storageNamespace,
    analysis: { loadWaveform },
    moveQueued,
    removeQueued,
    enqueueNext,
    current,
    isPlaying,
    toggle,
    seek,
    volume,
    setVolume,
    next,
    prev,
    canPrev,
    audioEl,
    repeatState,
    setRepeatState,
    toggleRepeatState,
    stop,
    shown,
    setShown,
    tracks,
    upcoming,
    shuffle,
    toggleShuffle,
    transitionMode,
    setTransitionMode,
    history,
    playItem,
  } = useMusic();
  const keys = useMemo(() => storageKeys(storageNamespace), [storageNamespace]);
  const [compact, setCompact] = useState(
    () => readStorage(keys.minimized) === "true",
  );
  const [corner, setCorner] = useState<MiniCorner>(() => {
    const saved = readStorage(keys.corner);
    return validCorner(saved) ? saved : "bottom-left";
  });
  const barRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const root = document.documentElement;
    const bar = barRef.current;
    if (!shown || compact || !current || !bar) {
      root.style.removeProperty("--expanded-player-height");
      return;
    }
    const measure = () =>
      root.style.setProperty(
        "--expanded-player-height",
        mobile
          ? "0px"
          : `${Math.ceil(bar.getBoundingClientRect().height) + 16}px`,
      );
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    measure();
    return () => {
      observer.disconnect();
      root.style.removeProperty("--expanded-player-height");
    };
  }, [shown, compact, current?.song, mobile]);
  useEffect(() => {
    if (!shown || compact || !current || !mobile) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [shown, compact, current?.song, mobile]);
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
      const radius = disc.offsetWidth * 0.48;
      const farthestY = Math.max(
        Math.abs(bounds.top - centerY),
        Math.abs(bounds.bottom - centerY),
      );
      const chord = Math.sqrt(
        Math.max(0, radius * radius - farthestY * farthestY),
      );
      const covered =
        farthestY >= radius
          ? 0
          : compact && corner.endsWith("right")
            ? bounds.right - (centerX - chord)
            : centerX + chord - bounds.left;
      setSurfaceInset(
        Math.min(90, Math.max(0, (covered / bounds.width) * 100)),
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    observer.observe(disc);
    measure();
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [compact, corner, shown, current?.song]);
  const gradientDirection =
    compact && corner.endsWith("right") ? "270deg" : "90deg";
  const gradientBase = compact ? "#1a2936" : "#101b27";
  const gradientStart = `color-mix(in srgb,var(--player-accent) 24%,${gradientBase})`;
  const gradientMiddle = `color-mix(in srgb,var(--player-accent) 9%,${gradientBase})`;
  const surfaceGradient = `linear-gradient(${gradientDirection},${gradientStart} 0%,${gradientMiddle} 48%,${gradientBase} 100%)`;
  const playerGradient = `linear-gradient(${gradientDirection},${gradientStart} ${surfaceInset}%,${gradientMiddle} ${surfaceInset + (100 - surfaceInset) * 0.48}%,${gradientBase} 100%)`;
  const [draggingMini, setDraggingMini] = useState(false);
  const suppressDragClick = useRef(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  const [progress, setProgress] = useState({ time: 0, duration: 0 });
  useEffect(() => {
    if (!audioEl) return;
    let frame = 0;
    const update = () => {
      const time = Number.isFinite(audioEl.currentTime)
        ? audioEl.currentTime
        : 0;
      const duration = Number.isFinite(audioEl.duration) ? audioEl.duration : 0;
      setProgress((previous) =>
        Math.abs(previous.time - time) >= 0.08 || previous.duration !== duration
          ? { time, duration }
          : previous,
      );
    };
    const tick = () => {
      update();
      frame = requestAnimationFrame(tick);
    };
    const events = ["loadedmetadata", "durationchange", "timeupdate", "seeked"];
    events.forEach((event) => audioEl.addEventListener(event, update));
    update();
    if (isPlaying) frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      events.forEach((event) => audioEl.removeEventListener(event, update));
    };
  }, [audioEl, isPlaying]);
  const [peaks, setPeaks] = useState<{
    source: string;
    values: number[];
  } | null>(null);
  const [menu, setMenu] = useState<
    | ((
        | { kind: "disc" }
        | { kind: "queue" | "history" }
        | { kind: "mode"; section: "all" | "shuffle" | "playback" }
      ) & { x: number; y: number })
    | null
  >(null);
  const menuTrigger = useRef<HTMLElement | null>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const nextMenuTriggerRef = useRef<HTMLSpanElement | null>(null);
  const queueButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeMenu = useCallback((restoreFocus = false) => {
    setMenu(null);
    if (restoreFocus) menuTrigger.current?.focus();
  }, []);
  const openModeMenu = (
    x: number,
    y: number,
    section: "all" | "shuffle" | "playback" = "all",
    trigger: HTMLElement | null = playButtonRef.current,
  ) => {
    menuTrigger.current = trigger;
    setMenu({ kind: "mode", section, x, y });
  };
  const openTrackMenu = (
    kind: "queue" | "history",
    element: HTMLElement,
    x: number,
    y: number,
  ) => {
    menuTrigger.current = element;
    setMenu({ kind, x, y });
  };
  const openDiscMenu = (x: number, y: number) => {
    setDiscPressed(false);
    menuTrigger.current = discButtonRef.current;
    setMenu({ kind: "disc", x, y });
  };
  const discHandlers = menuHandlers(openDiscMenu);
  const discMenu = menu?.kind === "disc" ? menu : null;
  const modeMenu = menu?.kind === "mode" ? menu : null;
  const trackMenu =
    menu?.kind === "queue" || menu?.kind === "history" ? menu : null;
  const discButtonRef = useRef<HTMLButtonElement>(null);
  const [discPressed, setDiscPressed] = useState(false);
  useEffect(() => {
    if (!discPressed) return;
    const release = () => setDiscPressed(false);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
    };
  }, [discPressed]);
  useEffect(() => setMenu(null), [current?.id, current?.song, shown]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [mutedFrom, setMutedFrom] = useState(0.5);
  const discRef = useRef<HTMLSpanElement | null>(null);
  const spinRef = useRef({ angle: 0, speed: 0, last: 0 });
  useEffect(
    () => writeStorage(keys.minimized, compact ? "true" : "false"),
    [compact, keys],
  );
  useEffect(() => writeStorage(keys.corner, corner), [corner, keys]);
  useEffect(() => {
    if (!current?.song) return;
    const source = current.song;
    const controller = new AbortController();
    setPeaks(null);
    void loadWaveform(source, controller.signal).then((values) => {
      if (!controller.signal.aborted)
        setPeaks(values ? { source, values } : null);
    });
    return () => controller.abort();
  }, [current?.song, loadWaveform]);
  useEffect(() => {
    const audio = audioEl;
    if (!audio) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const spin = spinRef.current;
    spin.angle = 0;
    spin.speed = 0;
    spin.last = 0;
    const tick = (now: number) => {
      const elapsed = spin.last
        ? Math.min(0.08, Math.max(0, (now - spin.last) / 1000))
        : 0;
      spin.last = now;
      const target = !motion.matches && !audio.paused ? 360 / 14 : 0;
      spin.speed +=
        (target - spin.speed) * (1 - Math.exp(-elapsed * (target ? 6 : 5)));
      if (target === 0 && spin.speed < 0.05) spin.speed = 0;
      spin.angle = (spin.angle + spin.speed * elapsed) % 360;
      if (discRef.current)
        discRef.current.style.transform = `rotate(${motion.matches ? 0 : spin.angle}deg)`;
      if (!audio.paused || spin.speed > 0.1)
        frame = requestAnimationFrame(tick);
    };
    const start = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(tick);
    };
    audio.addEventListener("play", start);
    audio.addEventListener("pause", start);
    motion.addEventListener("change", start);
    start();
    return () => {
      cancelAnimationFrame(frame);
      audio.removeEventListener("play", start);
      audio.removeEventListener("pause", start);
      motion.removeEventListener("change", start);
    };
  }, [audioEl, current?.song]);

  useEffect(() => {
    const clearDrag = () => {
      dragRef.current = null;
      setDraggingMini(false);
    };
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
    if (
      !compact ||
      event.button !== 0 ||
      !event.isPrimary ||
      !event.currentTarget.contains(event.target as Node)
    )
      return;
    suppressDragClick.current = false;
    // Controls with their own drag gesture keep ownership; links and buttons
    // remain clickable until the shared player drag crosses its threshold.
    if (
      (event.target as Element).closest(
        'input,textarea,select,[role="slider"],[role="menu"],[data-draggable="true"],[data-player-drag="exclude"]',
      )
    )
      return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
  };
  const onDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (
      !drag.moved &&
      Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 24
    )
      return;
    if (!drag.moved) event.currentTarget.setPointerCapture(event.pointerId);
    drag.moved = true;
    suppressDragClick.current = true;
    setDiscPressed(false);
    event.preventDefault();
    setDraggingMini(true);
  };
  const onDragEnd = (
    event: ReactPointerEvent<HTMLDivElement>,
    cancel = false,
  ) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDraggingMini(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (drag.moved && !cancel)
      setCorner((value) =>
        cornerFromMiniDrag(
          value,
          event.clientX - drag.startX,
          event.clientY - drag.startY,
        ),
      );
  };
  const onDragKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (
      !compact ||
      !event.altKey ||
      event.target !== event.currentTarget ||
      !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
    )
      return;
    event.preventDefault();
    setCorner((value) => arrowMiniCorner(value, event.key));
  };

  const libraryTrack = current
    ? tracks.find(
        (track) =>
          (current.id != null && track.id === current.id) ||
          (current.slug && track.slug === current.slug) ||
          track.url === current.song,
      )
    : undefined;

  const game = {
    ...current?.game,
    thumbnail: current?.game.thumbnail || libraryTrack?.game.thumbnail,
    soundtrackThumbnail:
      current?.game.soundtrackThumbnail ||
      libraryTrack?.game.soundtrackThumbnail,
  };
  const artwork =
    current?.thumbnail ||
    game.soundtrackThumbnail ||
    game.thumbnail ||
    ui.fallbackArtwork ||
    "";
  const accent = useArtworkAccent(artwork);

  const touchMenu = useTouchMenu((kind, target) => {
    const rect = target.getBoundingClientRect();
    if (kind === "disc") openDiscMenu(rect.left, rect.top);
    else if (kind === "queue" || kind === "history")
      openTrackMenu(kind, target, rect.left, rect.top);
    else
      openModeMenu(
        rect.left,
        rect.top,
        kind as "all" | "shuffle" | "playback",
        target,
      );
  });
  const playerKeys = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (
      event.defaultPrevented ||
      target.closest(
        'input, textarea, select, [contenteditable="true"], [role="menu"]',
      ) ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return;
    if (event.key === " " && !event.repeat) {
      event.preventDefault();
      toggle();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      if (event.shiftKey)
        void (event.key === "ArrowRight" ? next() : prev()).catch(() =>
          ui.onError?.("Could not play track."),
        );
      else
        seek(
          (audioEl?.currentTime ?? 0) + (event.key === "ArrowRight" ? 5 : -5),
        );
    }
  };
  if (!current || !shown) return null;
  const artist =
    current.artist.name?.trim() || current.artist.slug?.trim() || "";
  const values = peaks?.source === current.song ? peaks.values : null;
  const key = current.song;
  const nextInQueue = (track: TrackType, preserveQueue: boolean) =>
    playItem(toPlayableTrack(track), tracks, { preserveQueue });
  const transitionLabel = {
    off: "no transition",
    automix: "Automix",
    crossfade: "Crossfade",
  }[transitionMode];
  const playbackLabel =
    repeatState === "autoplay"
      ? `Autoplay with ${transitionLabel}`
      : repeatState === "repeat"
        ? "Repeat track"
        : "Stop after track";
  const mute = () => {
    if (volume > 0) {
      setMutedFrom(volume);
      setVolume(0);
    } else setVolume(mutedFrom || 0.5);
  };
  const rootClass = compact
    ? ` ${styles.miniShell} ${draggingMini ? " is-dragging" : ""}`
    : `${styles.fullShell}`;
  const actions = ui.getTrackActions?.(current);
  const rating = !compact && ui.renderRating && (
    <div className={styles.ratingSlot}>{ui.renderRating(current)}</div>
  );

  return (
    <div
      {...touchMenu}
      onPointerDownCapture={(event) => {
        touchMenu.onPointerDownCapture(event);
        onDragStart(event);
      }}
      onPointerMove={onDragMove}
      onPointerUp={(event) => onDragEnd(event)}
      onPointerCancel={(event) => onDragEnd(event, true)}
      onLostPointerCapture={(event) => onDragEnd(event, true)}
      onDragStart={(event) => {
        if (
          compact &&
          dragRef.current &&
          event.currentTarget.contains(event.target as Node)
        )
          event.preventDefault();
      }}
      onClickCapture={(event) => {
        if (suppressDragClick.current && event.detail !== 0) {
          event.preventDefault();
          event.stopPropagation();
          suppressDragClick.current = false;
          return;
        }
        touchMenu.onClickCapture(event);
        if (
          !event.defaultPrevented &&
          compact &&
          mobile &&
          (event.target as Element).closest(".player-bar, .player-disc-window")
        ) {
          event.preventDefault();
          event.stopPropagation();
          setCompact(false);
        }
      }}
      onKeyDown={playerKeys}
      tabIndex={0}
      aria-label="Music player"
      className={` ${styles.player} ${rootClass} ${compact ? styles.playerCompact : styles.playerExpanded}`}
      style={{ "--player-accent": accent } as CSSProperties}
      data-corner={compact ? corner : undefined}
    >
      <div
        className={` player-disc-window ${styles.discWindow} ${compact ? styles.discWindowCompact : styles.discWindowExpanded}`}
      >
        <button
          data-touch-menu="disc"
          ref={discButtonRef}
          className={` player-disc-toggle ${styles.discToggle} ${compact ? "" : styles.discToggleExpanded}`}
          type="button"
          data-pressed={discPressed}
          onPointerDown={(event) => setDiscPressed(event.button === 0)}
          onPointerLeave={() => setDiscPressed(false)}
          onBlur={() => setDiscPressed(false)}
          onKeyUp={() => setDiscPressed(false)}
          aria-haspopup="menu"
          aria-expanded={Boolean(discMenu)}
          onContextMenu={discHandlers.onContextMenu}
          onKeyDown={(event) => {
            if (event.key === " " || event.key === "Enter")
              setDiscPressed(true);
            discHandlers.onKeyDown(event);
          }}
          onClick={() => setCompact((value) => !value)}
          aria-label={compact ? "Expand music player" : "Collapse music player"}
          aria-pressed={compact}
        >
          <RecordDisc artwork={artwork} trackKey={key} discRef={discRef} />
        </button>
      </div>
      <aside
        ref={barRef}
        className={` player-bar ${styles.bar} ${compact ? styles.barCompact : styles.barExpanded}`}
        aria-label="Music player"
      >
        <div
          className={` ${styles.colorLayer} ${compact ? "" : styles.colorLayerExpanded}`}
          style={{ background: playerGradient }}
          aria-hidden="true"
        />
        <div
          className={` player-track ${styles.track} ${compact ? " player-drag-area" : ""} ${compact ? "" : styles.trackExpanded}`}
          role={compact ? (mobile ? "button" : "group") : undefined}
          tabIndex={compact ? 0 : undefined}
          aria-label={
            compact
              ? mobile
                ? "Open expanded music player"
                : "Move mini player. Drag, or use Alt and arrow keys to choose a corner."
              : undefined
          }
          onKeyDown={(event) => {
            if (
              compact &&
              mobile &&
              !event.altKey &&
              (event.key === "Enter" || event.key === " ")
            ) {
              event.preventDefault();
              event.stopPropagation();
              setCompact(false);
            } else onDragKey(event);
          }}
        >
          <div
            className={` player-identity ${styles.identity} ${compact ? styles.identityCompact : styles.identityExpanded}`}
          >
            <ScrollingTrackTitle
              name={current.name}
              href={!(compact && mobile) ? actions?.trackHref : undefined}
            />
            <span>
              {!(compact && mobile) && artist && current.artist.slug
                ? (ui.renderArtist?.(current) ?? (
                    <Link href={actions?.artistHref}>{artist}</Link>
                  ))
                : artist}
            </span>
            {current.game.name && (
              <span className={`player-mobile-game ${styles.mobileGame}`}>
                {actions?.collectionHref ? (
                  <Link
                    href={actions.collectionHref}
                    onClick={() => setCompact(true)}
                  >
                    {current.game.name}
                  </Link>
                ) : (
                  current.game.name
                )}
              </span>
            )}
          </div>
          {!mobile && rating}
        </div>
        <div
          className={` player-transport ${styles.transport} ${compact ? "" : styles.transportExpanded}`}
        >
          <span
            className={`player-skip-menu-trigger ${styles.skipMenuTrigger}`}
            tabIndex={0}
            role="group"
            data-touch-menu="history"
            aria-label="Playback history"
            aria-haspopup="menu"
            aria-expanded={trackMenu?.kind === "history"}
            {...menuHandlers((x, y, trigger) =>
              openTrackMenu("history", trigger, x, y),
            )}
          >
            <button
              className={`player-skip ${styles.skip}`}
              type="button"
              onClick={() => {
                void prev();
              }}
              disabled={!canPrev}
              aria-label="Previous track"
            >
              <SkipBack size={20} fill="currentColor" />
            </button>
          </span>
          <button
            data-touch-menu="all"
            ref={playButtonRef}
            className={`player-primary ${styles.primary}`}
            type="button"
            aria-haspopup="menu"
            aria-expanded={modeMenu?.section === "all"}
            {...menuHandlers((x, y, trigger) =>
              openModeMenu(x, y, "all", trigger),
            )}
            onClick={toggle}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause size={19} fill="currentColor" />
            ) : (
              <Play size={19} fill="currentColor" />
            )}
          </button>
          <span
            ref={nextMenuTriggerRef}
            className={`player-skip-menu-trigger ${styles.skipMenuTrigger}`}
            tabIndex={0}
            role="group"
            data-touch-menu="queue"
            aria-label="Music queue"
            aria-haspopup="menu"
            aria-expanded={
              trackMenu?.kind === "queue" &&
              menuTrigger.current === nextMenuTriggerRef.current
            }
            {...menuHandlers((x, y, trigger) =>
              openTrackMenu("queue", trigger, x, y),
            )}
          >
            <button
              className={`player-skip ${styles.skip}`}
              type="button"
              onClick={() => {
                void next();
              }}
              disabled={!upcoming.length}
              aria-label="Next track"
            >
              <SkipForward size={20} fill="currentColor" />
            </button>
          </span>
        </div>
        {!compact && (
          <Timeline
            time={progress.time}
            duration={progress.duration}
            seek={seek}
            peaks={values}
            trackKey={key}
            rating={mobile ? rating : undefined}
          />
        )}
        {compact && (
          <CompactSeek
            key={key}
            time={progress.time}
            duration={progress.duration}
            seek={seek}
            peaks={values}
          />
        )}
        {!compact && (
          <div className={`player-extras ${styles.extras}`}>
            {mobile && (
              <button
                type="button"
                className="player-mobile-collapse"
                aria-label="Minimize music player"
                onClick={() => setCompact(true)}
              >
                <ChevronDown size={22} />
              </button>
            )}
            <button
              type="button"
              onClick={mute}
              aria-label={volume === 0 ? "Unmute" : "Mute"}
            >
              {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <div className={`player-volume-wrap ${styles.volumeWrap}`}>
              <span
                className={`player-volume-fill ${styles.volumeFill}`}
                style={{ width: `${volume * 100}%` }}
                aria-hidden="true"
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(event) => setVolume(Number(event.target.value))}
                aria-label="Volume"
              />
            </div>
            <button
              type="button"
              data-touch-menu="playback"
              onClick={toggleRepeatState}
              aria-haspopup="menu"
              aria-expanded={modeMenu?.section === "playback"}
              {...menuHandlers((x, y, trigger) =>
                openModeMenu(x, y, "playback", trigger),
              )}
              aria-label={playbackLabel}
              title={playbackLabel}
            >
              {repeatState === "repeat" ? (
                <Repeat1 size={19} />
              ) : repeatState === "autoplay" ? (
                <span className={styles.modeIcon}>
                  <InfinityIcon size={19} />
                  <span className={styles.orderBadge} aria-hidden="true">
                    {shuffle ? (
                      <Shuffle size={11} />
                    ) : (
                      <ListOrdered size={11} />
                    )}
                  </span>
                  <span className={styles.transitionBadge} aria-hidden="true">
                    {transitionMode === "automix" ? (
                      <AudioLines size={11} />
                    ) : transitionMode === "crossfade" ? (
                      <Blend size={11} />
                    ) : (
                      <CircleOff size={11} />
                    )}
                  </span>
                </span>
              ) : (
                <CircleStop size={19} />
              )}
            </button>
            {actions?.download && (
              <button
                type="button"
                disabled={isDownloading}
                aria-label="Download track"
                title="Download track"
                onClick={() => {
                  setIsDownloading(true);
                  void actions.download!()
                    .catch(() => ui.onError?.("Could not download track."))
                    .finally(() => setIsDownloading(false));
                }}
              >
                <Download size={19} />
              </button>
            )}
            <button
              type="button"
              ref={queueButtonRef}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                if (
                  trackMenu?.kind === "queue" &&
                  menuTrigger.current === event.currentTarget
                ) {
                  closeMenu();
                  return;
                }
                const rect = event.currentTarget.getBoundingClientRect();
                openTrackMenu(
                  "queue",
                  event.currentTarget,
                  rect.left,
                  rect.top,
                );
              }}
              data-touch-menu="queue"
              aria-label="Music queue"
              aria-haspopup="menu"
              aria-expanded={
                trackMenu?.kind === "queue" &&
                menuTrigger.current === queueButtonRef.current
              }
            >
              <ListMusic size={21} />
            </button>
            <button
              type="button"
              onClick={() => {
                stop();
                setShown(false);
              }}
              aria-label="Close music player"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </aside>
      {modeMenu && (
        <PlayerModeMenu
          anchor={menuTrigger.current}
          section={modeMenu.section}
          transitionMode={transitionMode}
          onTransition={setTransitionMode}
          mode={repeatState}
          x={modeMenu.x}
          y={modeMenu.y}
          accent={accent}
          surfaceGradient={surfaceGradient}
          onSelect={setRepeatState}
          onShuffle={toggleShuffle}
          shuffle={shuffle}
          onClose={closeMenu}
        />
      )}
      {trackMenu && (
        <PlayerTrackMenu
          anchor={menuTrigger.current}
          onMove={moveQueued}
          onRemove={removeQueued}
          onEnqueue={enqueueNext}
          kind={trackMenu.kind}
          tracks={trackMenu.kind === "history" ? history : upcoming}
          x={trackMenu.x}
          y={trackMenu.y}
          accent={accent}
          surfaceGradient={surfaceGradient}
          onPlay={(track) => {
            void nextInQueue(track, trackMenu.kind === "queue").catch(() =>
              ui.onError?.("Could not play track."),
            );
          }}
          onClose={closeMenu}
        />
      )}
      {discMenu && (
        <PlayerContextMenu
          anchor={discButtonRef.current}
          track={current}
          x={discMenu.x}
          y={discMenu.y}
          accent={accent}
          surfaceGradient={surfaceGradient}
          closePlayer={() => {
            stop();
            setShown(false);
          }}
          onClose={closeMenu}
        />
      )}
    </div>
  );
}
