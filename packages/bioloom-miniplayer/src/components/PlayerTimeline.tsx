import styles from "./PlayerTimeline.module.css";
import {
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useMusic } from "../hooks/useMusic";
import { waveformMiniPath, waveformPath } from "../lib/waveform";

const timeLabel = (seconds: number) =>
  Number.isFinite(seconds) && seconds >= 0
    ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`
    : "0:00";

function usePlannedTransition(duration: number) {
  const { transitionLead, transitionMode, repeatState, upcoming } = useMusic();
  if (
    repeatState !== "autoplay" ||
    transitionMode === "off" ||
    !upcoming.length ||
    !Number.isFinite(duration) ||
    duration <= 0 ||
    !Number.isFinite(transitionLead) ||
    transitionLead <= 0
  )
    return null;
  const start = Math.max(0, duration - transitionLead);
  return {
    start,
    percent: (start / duration) * 100,
    label: transitionMode === "automix" ? "Automix" : "Crossfade",
  };
}

function SeekWaveform({
  className,
  path,
  transitionStart,
  clipPath,
}: {
  className: string;
  path: string;
  transitionStart?: number;
  clipPath?: string;
}) {
  const gradientId = useId();
  return (
    <svg
      className={className}
      viewBox="0 0 960 100"
      preserveAspectRatio="none"
      style={{
        clipPath,
        fill: transitionStart === undefined ? undefined : `url(#${gradientId})`,
      }}
      aria-hidden="true"
    >
      {transitionStart !== undefined && (
        <defs>
          <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
            <stop
              offset={`${transitionStart}%`}
              stopColor="var(--waveform-fill)"
            />
            <stop
              offset={`${transitionStart}%`}
              stopColor="color-mix(in srgb, var(--waveform-fill) 55%, black)"
            />
          </linearGradient>
        </defs>
      )}
      <path d={path} />
    </svg>
  );
}

export function Timeline({
  time,
  duration,
  seek,
  peaks,
  trackKey,
  rating,
}: {
  rating?: ReactNode;
  time: number;
  duration: number;
  seek: (value: number) => void;
  peaks: number[] | null;
  trackKey: string;
}) {
  const transition = usePlannedTransition(duration);
  const [preview, setPreview] = useState<{
    percent: number;
    seconds: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    setPreview(null);
    setDragging(false);
  }, [trackKey]);
  const percent =
    duration > 0 ? Math.max(0, Math.min(100, (time / duration) * 100)) : 0;
  const path = useMemo(() => (peaks ? waveformMiniPath(peaks) : null), [peaks]);
  const previewAtPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!(duration > 0)) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const next = Math.max(
      0,
      Math.min(100, ((event.clientX - rect.left) / rect.width) * 100),
    );
    setPreview({ percent: next, seconds: (duration * next) / 100 });
  };
  return (
    <div className={`player-timeline ${styles.timeline}`}>
      <span>{timeLabel(time)}</span>
      <div
        className={` player-range-wrap ${styles.rangeWrap} ${path ? " has-waveform" : ""}${dragging ? " is-seeking" : ""} `}
        onPointerMove={previewAtPointer}
        onPointerLeave={() => {
          if (!dragging) setPreview(null);
        }}
      >
        <SeekWaveform
          key={`${trackKey}:base`}
          className={`player-range-waveform ${styles.rangeWaveform}`}
          path={path || "M0,0 H960 V100 H0 Z"}
          transitionStart={transition?.percent}
        />
        <SeekWaveform
          key={`${trackKey}:played`}
          className={`player-range-waveform played ${styles.rangeWaveform}`}
          path={path || "M0,0 H960 V100 H0 Z"}
          transitionStart={transition?.percent}
          clipPath={`inset(0 ${100 - percent}% 0 0)`}
        />
        {preview && (
          <span
            className={`player-seek-preview ${styles.seekPreview}`}
            style={{ left: `${preview.percent}%` }}
            aria-hidden="true"
          >
            <span>{timeLabel(preview.seconds)}</span>
          </span>
        )}
        <input
          type="range"
          min={0}
          max={duration || 1}
          step="0.1"
          value={Math.min(time, duration || 1)}
          disabled={!duration}
          aria-label="Seek track"
          aria-description={
            transition
              ? `${transition.label} from ${timeLabel(transition.start)} to ${timeLabel(duration)}`
              : undefined
          }
          aria-valuetext={timeLabel(time)}
          onChange={(event) => {
            const seconds = Number(event.target.value);
            seek(seconds);
            if (dragging && duration)
              setPreview({ percent: (seconds / duration) * 100, seconds });
          }}
          onPointerDown={() => setDragging(true)}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => {
            setDragging(false);
            setPreview(null);
          }}
          onBlur={() => {
            setDragging(false);
            setPreview(null);
          }}
        />
      </div>
      {rating}
      <span>{timeLabel(duration)}</span>
    </div>
  );
}

export function CompactSeek({
  time,
  duration,
  seek,
  peaks,
}: {
  time: number;
  duration: number;
  seek: (value: number) => void;
  peaks: number[] | null;
}) {
  const transition = usePlannedTransition(duration);
  const [preview, setPreview] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [focused, setFocused] = useState(false);
  const previewAtPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!(duration > 0)) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setPreview(
      Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) *
        duration,
    );
  };
  const path = useMemo(
    () =>
      peaks?.length ? waveformPath(peaks) : "M0,100 L0,97 L960,97 L960,100 Z",
    [peaks],
  );
  const progress =
    duration > 0 ? Math.max(0, Math.min(100, (time / duration) * 100)) : 0;
  const seconds = preview ?? (focused ? time : null);
  const percent =
    seconds !== null && duration > 0 ? (seconds / duration) * 100 : 0;

  return (
    <div
      className={`player-compact-seek ${styles.compactSeek}`}
      onPointerMove={previewAtPointer}
      onPointerDown={previewAtPointer}
      onPointerLeave={() => {
        if (!dragging) setPreview(null);
      }}
    >
      <SeekWaveform
        className={`player-waveform ${styles.waveform}`}
        path={path}
        transitionStart={transition?.percent}
      />
      <SeekWaveform
        className={`player-waveform played ${styles.waveform}`}
        path={path}
        transitionStart={transition?.percent}
        clipPath={`inset(0 ${100 - progress}% 0 0)`}
      />
      {seconds !== null && duration > 0 && (
        <span
          className={`player-compact-seek-tooltip ${styles.compactSeekTooltip}`}
          style={{ left: "clamp(28px, " + percent + "%, calc(100% - 28px))" }}
          aria-hidden="true"
        >
          {timeLabel(seconds)}
        </span>
      )}
      <input
        type="range"
        min={0}
        max={duration || 1}
        step="0.1"
        value={Math.min(time, duration || 1)}
        disabled={!duration}
        aria-label="Seek track"
        aria-description={
          transition
            ? `${transition.label} from ${timeLabel(transition.start)} to ${timeLabel(duration)}`
            : undefined
        }
        aria-valuetext={timeLabel(time) + " of " + timeLabel(duration)}
        onChange={(event) => {
          const seconds = Number(event.target.value);
          seek(seconds);
          setPreview(seconds);
        }}
        onPointerDown={() => setDragging(true)}
        onPointerUp={() => {
          setDragging(false);
          setPreview(null);
        }}
        onPointerCancel={() => {
          setDragging(false);
          setPreview(null);
        }}
        onFocus={(event) =>
          setFocused(event.currentTarget.matches(":focus-visible"))
        }
        onBlur={() => {
          setFocused(false);
          setDragging(false);
          setPreview(null);
        }}
      />
    </div>
  );
}
