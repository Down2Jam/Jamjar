"use client";

import RatingVisibilityGate from "@/components/ratings/RatingVisibilityGate";
import { useEffectiveHideRatings } from "@/hooks/useEffectiveHideRatings";
import { useCurrentJam, useSelf, useTracks } from "@/hooks/queries";
import { queryKeys } from "@/hooks/queries/queryKeys";
import { emitTrackRatingSync, subscribeToTrackRatingSync, upsertTrackRatingRecord } from "@/helpers/trackRatingSync";
import { postTrackRating } from "@/requests/rating";
import { getTrackRatingCategories } from "@/requests/track";
import { useQueryClient } from "@tanstack/react-query";
import { addToast, Button, Hstack, Icon, Popover, Text, Vstack } from "bioloom-ui";
import Link from "next/link";
import { Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "bioloom-ui";
import { readStorage, storageKey, writeStorage } from "./MusicProvider";
import { useMusic } from "./useMusic";

export default function MiniPlayer() {
  const {
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
    analyser,
    repeatState,
    toggleRepeatState,
    stop,
    shown,
    setShown,
    tracks,
    setTracks,
  } = useMusic();
  const [progress, setProgress] = useState({ time: 0, duration: 0 });
  const { colors } = useTheme();
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingCategoryId, setRatingCategoryId] = useState<number | null>(null);
  const [savingRating, setSavingRating] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentJamData } = useCurrentJam();
  const { data: userData } = useSelf();
  const { data: randomTracks } = useTracks("random", undefined, undefined, shown);

  useEffect(() => {
    if (randomTracks && tracks.length === 0) {
      setTracks(randomTracks);
    }
  }, [randomTracks, tracks.length, setTracks]);

  const activeJamId = currentJamData?.jam?.id ?? null;
  const activeJamPhase = currentJamData?.phase ?? null;
  const viewerId = userData?.id ?? null;
  type ViewerTrackRating = {
    trackId: number;
    categoryId: number;
    value: number;
  };
  const viewerTeamGameIds = useMemo(
    () =>
      Array.isArray(userData?.teams)
        ? userData.teams
            .map((team: { game?: { id?: number } | null }) => team.game?.id)
            .filter((id: number | undefined): id is number =>
              Number.isInteger(id),
            )
        : [],
    [userData],
  );
  const [viewerTrackRatings, setViewerTrackRatings] = useState<
    ViewerTrackRating[]
  >(() => (Array.isArray(userData?.trackRatings) ? userData.trackRatings : []));
  useEffect(() => {
    setViewerTrackRatings(
      Array.isArray(userData?.trackRatings) ? userData.trackRatings : [],
    );
  }, [userData?.trackRatings]);
  const hideRatings = Boolean(userData?.hideRatings);
  const autoHideRatingsWhileStreaming = Boolean(
    userData?.autoHideRatingsWhileStreaming,
  );
  const viewerTwitch = userData?.twitch ?? null;
  const [minimized, setMinimized] = useState<boolean>(() => {
    const stored = readStorage(storageKey.minimized);
    if (stored === "true") return true;
    if (stored === "false") return false;
    return false;
  });
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number }>();
  const [transformOrigin, setTransformOrigin] = useState<string>("bottom left");
  type AnchorCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
  const initialCorner =
    (readStorage(storageKey.corner) as AnchorCorner | null) ?? "bottom-left";
  const anchorCornerRef = useRef<AnchorCorner>(initialCorner);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<{ offsetX: number; offsetY: number }>({
    offsetX: 0,
    offsetY: 0,
  });
  const hasSpawnedRef = useRef(false);
  const effectiveHideRatings = useEffectiveHideRatings({
    hideRatings,
    autoHideRatingsWhileStreaming,
    twitch: viewerTwitch ?? undefined,
  });

  const marginLeftTop = 16;
  const marginRightBottom = 38;
  const snapDistance = 120;

  const setAnchorCornerRef = (corner: AnchorCorner) => {
    anchorCornerRef.current = corner;
    writeStorage(storageKey.corner, corner);
  };

  const computeSnapPosition = (corner: AnchorCorner) => {
    if (!dragRef.current) return { left: marginLeftTop, top: marginLeftTop };
    const rectWidth = dragRef.current.offsetWidth;
    const rectHeight = dragRef.current.offsetHeight;
    const maxLeft = Math.max(
      marginLeftTop,
      window.innerWidth - rectWidth - marginRightBottom,
    );
    const maxTop = Math.max(
      marginLeftTop,
      window.innerHeight - rectHeight - marginRightBottom,
    );

    switch (corner) {
      case "top-left":
        return { left: marginLeftTop, top: marginLeftTop };
      case "top-right":
        return { left: maxLeft, top: marginLeftTop };
      case "bottom-right":
        return { left: maxLeft, top: maxTop };
      case "bottom-left":
      default:
        return { left: marginLeftTop, top: maxTop };
    }
  };

  useEffect(() => {
    if (!shown || hasSpawnedRef.current) return;
    const corner = anchorCornerRef.current;
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!dragRef.current) return;
        setPosition(computeSnapPosition(corner));
        hasSpawnedRef.current = true;
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [shown, marginLeftTop, marginRightBottom]);

  useEffect(() => {
    if (!dragRef.current || !position) return;
    const rectWidth = dragRef.current.offsetWidth;
    const rectHeight = dragRef.current.offsetHeight;
    const midX = (window.innerWidth - rectWidth) / 2;
    const midY = (window.innerHeight - rectHeight) / 2;
    const horizontal = position.left <= midX ? "left" : "right";
    const vertical = position.top <= midY ? "top" : "bottom";
    setTransformOrigin(`${vertical} ${horizontal}`);
    setAnchorCornerRef(`${vertical}-${horizontal}` as AnchorCorner);
  }, [position, minimized]);

  useEffect(() => {
    if (!dragRef.current || !position) return;
    const anchorCorner = anchorCornerRef.current;
    setPosition((prev) => (prev ? computeSnapPosition(anchorCorner) : prev));
  }, [minimized, marginLeftTop, marginRightBottom]);

  useEffect(() => {
    if (!audioEl) return;
    let raf = 0;
    const tick = () => {
      setProgress({
        time: audioEl.currentTime || 0,
        duration: audioEl.duration || 0,
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [audioEl]);

  useEffect(() => {
    if (!position) return;
    const handleResize = () => {
      if (!dragRef.current) return;
      const corner = anchorCornerRef.current;
      setPosition((prev) => (prev ? computeSnapPosition(corner) : prev));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [position, marginLeftTop, marginRightBottom]);

  useEffect(() => {
    writeStorage(storageKey.minimized, minimized ? "true" : "false");
  }, [minimized]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const categoriesResponse = await getTrackRatingCategories().catch(() => null);
        if (cancelled) return;

        if (categoriesResponse?.ok) {
          const payload = await categoriesResponse.json();
          const overall =
            payload?.data?.find(
              (category: { id: number; name: string }) =>
                category.name === "Overall",
            ) ?? null;
          setRatingCategoryId(overall?.id ?? null);
        } else {
          setRatingCategoryId(null);
        }
      } catch (error) {
        console.error(error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!current?.id || !ratingCategoryId) {
      setSelectedRating(0);
      return;
    }

    setSelectedRating(
      viewerTrackRatings.find(
        (rating) =>
          rating.trackId === current.id &&
          rating.categoryId === ratingCategoryId,
      )?.value ?? 0,
    );
  }, [current?.id, ratingCategoryId, viewerTrackRatings]);

  useEffect(() => {
    return subscribeToTrackRatingSync((payload) => {
      setViewerTrackRatings((prev) => upsertTrackRatingRecord(prev, payload));
    });
  }, []);

  if (!current) return null;

  const isTeamMember = Boolean(
    viewerId &&
    current.game.team?.users?.some((member) => member.id === viewerId),
  );
  const isCurrentJamTrack =
    activeJamId != null &&
    current.game.jamId != null &&
    activeJamId === current.game.jamId;
  const canRateDuringJam =
    Boolean(viewerId) &&
    !isTeamMember &&
    isCurrentJamTrack &&
    (activeJamPhase === "Rating" || activeJamPhase === "Submission");
  const showRating =
    !minimized &&
    !isTeamMember &&
    current.id != null &&
    Boolean(viewerId) &&
    Boolean(ratingCategoryId) &&
    canRateDuringJam;
  const ratingDisabled =
    savingRating || !viewerId || !ratingCategoryId || !canRateDuringJam;
  const displayRating = hoverRating || selectedRating;

  const clampPosition = (left: number, top: number) => {
    if (!dragRef.current) return { left, top };
    const rectWidth = dragRef.current.offsetWidth;
    const rectHeight = dragRef.current.offsetHeight;
    const maxLeft = Math.max(
      marginLeftTop,
      window.innerWidth - rectWidth - marginRightBottom,
    );
    const maxTop = Math.max(
      marginLeftTop,
      window.innerHeight - rectHeight - marginRightBottom,
    );
    return {
      left: Math.min(Math.max(marginLeftTop, left), maxLeft),
      top: Math.min(Math.max(marginLeftTop, top), maxTop),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, input, a, [data-no-drag='true']")) return;
    if (!dragRef.current) return;
    e.preventDefault();
    const rect = dragRef.current.getBoundingClientRect();
    dragState.current = {
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
    setDragging(true);
    dragRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    e.preventDefault();
    const nextLeft = e.clientX - dragState.current.offsetX;
    const nextTop = e.clientY - dragState.current.offsetY;
    setPosition(clampPosition(nextLeft, nextTop));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragging(false);
    dragRef.current?.releasePointerCapture(e.pointerId);

    if (!dragRef.current || !position) return;

    const corners: AnchorCorner[] = [
      "top-left",
      "top-right",
      "bottom-left",
      "bottom-right",
    ];

    let best = position;
    let bestDist = Number.POSITIVE_INFINITY;
    let bestCorner: AnchorCorner | null = null;
    for (const corner of corners) {
      const target = computeSnapPosition(corner);
      const dx = position.left - target.left;
      const dy = position.top - target.top;
      const dist = Math.hypot(dx, dy);
      if (dist < bestDist) {
        bestDist = dist;
        best = target;
        bestCorner = corner;
      }
    }

    if (bestDist <= snapDistance) {
      if (bestCorner) setAnchorCornerRef(bestCorner);
      setPosition(best);
    }
  };

  return (
    <Popover
      position="bottom-left"
      showCloseButton
      disableHoverScale
      closeButtonPosition="top-left"
      onClose={stop}
      startsShown={true}
      shown={shown}
      onShownChange={setShown}
      transformOrigin={transformOrigin}
      positionerStyle={
        position
          ? {
              position: "fixed",
              left: position.left,
              top: position.top,
              zIndex: 50,
              pointerEvents: "none",
            }
          : undefined
      }
    >
      <div
        ref={dragRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          cursor: dragging ? "grabbing" : "grab",
          userSelect: dragging ? "none" : "auto",
        }}
      >
        <Hstack>
          <Vstack align="stretch">
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <img
                src={current.thumbnail}
                width={minimized ? 28 : 56}
                height={minimized ? 28 : 56}
                style={{ borderRadius: 8, objectFit: "cover" }}
                alt=""
              />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: minimized ? 12 : 14,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {current.slug ? (
                    <Link href={`/m/${current.slug}`}>{current.name}</Link>
                  ) : (
                    current.name
                  )}
                </div>
                <div
                  style={{
                    fontSize: minimized ? 10 : 12,
                    color: colors["textFaded"],
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {current.game.slug ? (
                    <Link href={`/g/${current.game.slug}`}>
                      {current.game.name ?? ""}
                    </Link>
                  ) : (
                    (current.game.name ?? "")
                  )}{" "}
                  -{" "}
                  {current.artist.slug ? (
                    <Link href={`/u/${current.artist.slug}`}>
                      {current.artist.name || current.artist.slug || ""}
                    </Link>
                  ) : (
                    current.artist.name || current.artist.slug || ""
                  )}
                </div>
              </div>

              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <Button
                  onClick={prev}
                  disabled={!canPrev}
                  size={minimized ? "xs" : "md"}
                >
                  <Icon
                    name="skipback"
                    color={canPrev ? "text" : "textFaded"}
                    size={minimized ? 16 : 24}
                  />
                </Button>
                <Button
                  onClick={() => {
                    toggle();
                    if (!shown) {
                      setShown(true);
                    }
                  }}
                  size={minimized ? "xs" : "md"}
                >
                  <Icon
                    name={isPlaying ? "pause" : "play"}
                    size={minimized ? 16 : 24}
                  />
                </Button>
                <Button onClick={next} size={minimized ? "xs" : "md"}>
                  <Icon name="skipforward" size={minimized ? 16 : 24} />
                </Button>
              </div>
            </div>

            {!minimized && (
              <Hstack>
                <Vstack className="w-full" align="stretch">
                  <input
                    type="range"
                    min={0}
                    max={progress.duration || 0}
                    step={0.01}
                    value={Number.isFinite(progress.time) ? progress.time : 0}
                    onChange={(e) => seek(parseFloat(e.target.value))}
                    style={{
                      width: "100%",
                      marginTop: 8,
                      WebkitAppearance: "none",
                      height: "4px",
                      borderRadius: "4px",
                      background: `linear-gradient(to right, 
      ${colors["blue"]} 0%, 
      ${colors["indigo"]} ${(progress.time / (progress.duration || 1)) * 100}%, 
      ${colors["base"]} ${(progress.time / (progress.duration || 1)) * 100}%, 
      ${colors["base"]} 100%)`,
                      outline: "none",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 6,
                    }}
                  >
                    <Text color="text" size="xs">
                      Volume
                    </Text>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      aria-label="Volume"
                      style={{
                        width: "100%",
                        marginTop: 8,
                        WebkitAppearance: "none",
                        height: "4px",
                        borderRadius: "4px",
                        background: `linear-gradient(to right, 
      ${colors["yellow"]} 0%, 
      ${colors["orange"]} ${(volume / 1) * 100}%, 
      ${colors["base"]} ${(volume / 1) * 100}%, 
      ${colors["base"]} 100%)`,
                        outline: "none",
                      }}
                    />
                  </div>

                  {showRating && (
                    <RatingVisibilityGate
                      hiddenByPreference={effectiveHideRatings}
                      hiddenText="Ratings are hidden by your settings."
                      buttonSize="xs"
                    >
                      <div
                        data-no-drag="true"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginTop: 8,
                        }}
                      >
                        <Text color="text" size="xs">
                          Rate
                        </Text>
                        <div
                          data-no-drag="true"
                          style={{ display: "flex", gap: 4 }}
                        >
                          {[2, 4, 6, 8, 10].map((value) => (
                            <div
                              key={`mini-player-rating-${current.id}-${value}`}
                              style={{
                                cursor: ratingDisabled ? "default" : "pointer",
                                display: "inline-flex",
                                position: "relative",
                                width: 16,
                                height: 16,
                              }}
                              onMouseEnter={() => {
                                if (!ratingDisabled) setHoverRating(value);
                              }}
                              onMouseLeave={() => {
                                if (!ratingDisabled) setHoverRating(0);
                              }}
                              onClick={async () => {
                                if (
                                  ratingDisabled ||
                                  !current.id ||
                                  !ratingCategoryId
                                ) {
                                  return;
                                }

                                const trackId = current.id;

                                const previous = selectedRating;
                                emitTrackRatingSync({
                                  trackId,
                                  categoryId: ratingCategoryId,
                                  value,
                                });
                                setSelectedRating(value);
                                setSavingRating(true);

                                try {
                                  const response = await postTrackRating(
                                    trackId,
                                    ratingCategoryId,
                                    value,
                                  );

                                  if (!response.ok) {
                                    const payload = await response
                                      .json()
                                      .catch(() => null);
                                    addToast({
                                      title:
                                        payload?.message ??
                                        "Failed to save track rating",
                                    });
                                    emitTrackRatingSync({
                                      trackId,
                                      categoryId: ratingCategoryId,
                                      value: previous,
                                    });
                                    setSelectedRating(previous);
                                    return;
                                  }

                                  queryClient.invalidateQueries({ queryKey: queryKeys.user.self() });
                                } finally {
                                  setSavingRating(false);
                                }
                              }}
                            >
                              <Star
                                size={16}
                                fill="currentColor"
                                className="absolute"
                                style={{
                                  color:
                                    displayRating >= value
                                      ? colors["yellow"]
                                      : colors["base"],
                                  transition: "color 150ms ease",
                                }}
                              />
                              <Star
                                size={16}
                                fill="currentColor"
                                className="absolute"
                                style={{
                                  clipPath: "inset(0 50% 0 0)",
                                  color:
                                    displayRating >= value - 1
                                      ? colors["yellow"]
                                      : colors["base"],
                                  transition: "color 150ms ease",
                                }}
                              />
                              <div
                                style={{
                                  position: "absolute",
                                  left: 0,
                                  top: 0,
                                  width: 8,
                                  height: 16,
                                }}
                                onMouseEnter={() => {
                                  if (!ratingDisabled)
                                    setHoverRating(value - 1);
                                }}
                                onClick={async (event) => {
                                  event.stopPropagation();
                                  if (
                                    ratingDisabled ||
                                    !current.id ||
                                    !ratingCategoryId
                                  ) {
                                    return;
                                  }

                                  const trackId = current.id;
                                  const nextValue = value - 1;
                                  const previous = selectedRating;
                                  emitTrackRatingSync({
                                    trackId,
                                    categoryId: ratingCategoryId,
                                    value: nextValue,
                                  });
                                  setSelectedRating(nextValue);
                                  setSavingRating(true);

                                  try {
                                    const response = await postTrackRating(
                                      trackId,
                                      ratingCategoryId,
                                      nextValue,
                                    );

                                    if (!response.ok) {
                                      const payload = await response
                                        .json()
                                        .catch(() => null);
                                      addToast({
                                        title:
                                          payload?.message ??
                                          "Failed to save track rating",
                                      });
                                      emitTrackRatingSync({
                                        trackId,
                                        categoryId: ratingCategoryId,
                                        value: previous,
                                      });
                                      setSelectedRating(previous);
                                      return;
                                    }

                                    queryClient.invalidateQueries({ queryKey: queryKeys.user.self() });
                                  } finally {
                                    setSavingRating(false);
                                  }
                                }}
                              />
                              <div
                                style={{
                                  position: "absolute",
                                  right: 0,
                                  top: 0,
                                  width: 8,
                                  height: 16,
                                }}
                                onMouseEnter={() => {
                                  if (!ratingDisabled) setHoverRating(value);
                                }}
                                onClick={async (event) => {
                                  event.stopPropagation();
                                  if (
                                    ratingDisabled ||
                                    !current.id ||
                                    !ratingCategoryId
                                  ) {
                                    return;
                                  }

                                  const trackId = current.id;
                                  const previous = selectedRating;
                                  emitTrackRatingSync({
                                    trackId,
                                    categoryId: ratingCategoryId,
                                    value,
                                  });
                                  setSelectedRating(value);
                                  setSavingRating(true);

                                  try {
                                    const response = await postTrackRating(
                                      trackId,
                                      ratingCategoryId,
                                      value,
                                    );

                                    if (!response.ok) {
                                      const payload = await response
                                        .json()
                                        .catch(() => null);
                                      addToast({
                                        title:
                                          payload?.message ??
                                          "Failed to save track rating",
                                      });
                                      emitTrackRatingSync({
                                        trackId,
                                        categoryId: ratingCategoryId,
                                        value: previous,
                                      });
                                      setSelectedRating(previous);
                                      return;
                                    }

                                    queryClient.invalidateQueries({ queryKey: queryKeys.user.self() });
                                  } finally {
                                    setSavingRating(false);
                                  }
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </RatingVisibilityGate>
                  )}
                </Vstack>
              </Hstack>
            )}
          </Vstack>
          <Vstack>
            <Button
              onClick={() => setMinimized(!minimized)}
              size={minimized ? "xs" : "md"}
            >
              <Icon
                name={minimized ? "maximize2" : "minimize2"}
                size={minimized ? 16 : 24}
              />
            </Button>
            {!minimized && (
              <Button onClick={toggleRepeatState}>
                <Icon
                  name={
                    repeatState === "autoplay"
                      ? "infinity"
                      : repeatState === "repeat"
                        ? "repeat"
                        : "refreshcwoff"
                  }
                />
              </Button>
            )}
          </Vstack>
        </Hstack>
      </div>
    </Popover>
  );
}
