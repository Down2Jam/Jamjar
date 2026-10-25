"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { useDelayedHover } from "@/hooks/useDelayedHover";

import { useMusic } from "bioloom-miniplayer";
import { audioAnalysis } from "@/components/music/audioAnalysis";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  addToast,
  Button,
  Hstack,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Popover,
  Text,
  Vstack,
} from "bioloom-ui";
import MentionedContent from "@/components/mentions/MentionedContent";
import { useEmojis } from "@/providers/useEmojis";
import { sortEmojisByUsage } from "@/helpers/emojiSorting";
import { useTheme } from "@/providers/useSiteTheme";

const { loadWaveform, getAnalyzedDuration } = audioAnalysis;

type TimestampComment = {
  id: number;
  content: string;
  timestamp: number;
  author: {
    id: number;
    slug: string;
    name: string;
    profilePicture?: string | null;
  };
};

const formatTime = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const truncateComment = (content: string) =>
  content.length > 30 ? `${content.slice(0, 30)}...` : content;

export default function TrackWaveformPlayer({
  trackId,
  pageVersion,
  allowDownload,
  slug,
  name,
  artist,
  game,
  thumbnail,
  url,
  loudnessGainDb,
  comments,
  canComment,
  onSubmitTimestampComment,
}: {
  trackId?: number;
  pageVersion?: "JAM" | "POST_JAM";
  allowDownload?: boolean;
  slug: string;
  name: string;
  artist: {
    name?: string;
    slug?: string;
  };
  game: {
    name?: string;
    slug?: string;
    thumbnail?: string;
    soundtrackThumbnail?: string | null;
  };
  thumbnail?: string | null;
  url: string;
  loudnessGainDb?: number | null;
  comments: TimestampComment[];
  canComment: boolean;
  onSubmitTimestampComment: (content: string, timestamp: number) => Promise<void>;
}) {
  const uiText = useUiTranslations();
  const { colors } = useTheme();
  const { emojis, priorityEmotes } = useEmojis();
  const { audioEl, current, isPlaying, playItem, seek, shown, setShown } =
    useMusic();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [commentDraft, setCommentDraft] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [hoveredCommentId, setHoveredCommentId] = useDelayedHover<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [emojiQuery, setEmojiQuery] = useState("");
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentTimestamp, setCommentTimestamp] = useState(0);
  const [contextMenu, setContextMenu] = useState<{
    left: number;
    top: number;
    time: number;
  } | null>(null);
  const [hoverPreview, setHoverPreview] = useState<{
    time: number;
    leftPercent: number;
  } | null>(null);

  const isCurrentTrack = current?.song === url || current?.slug === slug;

  useEffect(() => {
    const controller = new AbortController();
    setPeaks([]);
    setDuration(0);
    void loadWaveform(url, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      setPeaks(result ?? []);
      setDuration(getAnalyzedDuration(url) ?? 0);
    });
    return () => controller.abort();
  }, [url]);

  useEffect(() => {
    if (!audioEl || !isCurrentTrack) {
      setCurrentTime(0);
      return;
    }

    const sync = () => {
      setCurrentTime(audioEl.currentTime || 0);
      setDuration(audioEl.duration || duration || 0);
    };

    const onLoadedMetadata = () => sync();
    const onSeeked = () => sync();
    const onTimeUpdate = () => sync();

    audioEl.addEventListener("loadedmetadata", onLoadedMetadata);
    audioEl.addEventListener("seeked", onSeeked);
    audioEl.addEventListener("timeupdate", onTimeUpdate);

    let raf = 0;
    const tick = () => {
      sync();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    sync();

    return () => {
      cancelAnimationFrame(raf);
      audioEl.removeEventListener("loadedmetadata", onLoadedMetadata);
      audioEl.removeEventListener("seeked", onSeeked);
      audioEl.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [audioEl, duration, isCurrentTrack]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(dpr, dpr);
    context.clearRect(0, 0, rect.width, rect.height);

    const width = rect.width;
    const height = rect.height;
    const barWidth = width / Math.max(peaks.length, 1);
    const progressRatio = duration > 0 ? currentTime / duration : 0;

    peaks.forEach((peak, index) => {
      const x = index * barWidth;
      const barHeight = Math.max(6, peak * height * 0.9);
      const y = (height - barHeight) / 2;
      const isPlayed = index / Math.max(peaks.length - 1, 1) <= progressRatio;

      context.fillStyle = isPlayed ? colors["blue"] : colors["base"];
      context.fillRect(x + 1, y, Math.max(2, barWidth - 2), barHeight);
    });

    comments.forEach((comment) => {
      if (!duration) return;
      const markerX = (comment.timestamp / duration) * width;
      context.fillStyle = colors["yellow"];
      context.fillRect(markerX - 1, 0, 2, height);
    });
  }, [comments, colors, currentTime, duration, peaks]);

  const activeCommentIds = useMemo(
    () =>
      comments.filter(
        (comment) =>
          currentTime >= comment.timestamp &&
          currentTime <= comment.timestamp + 4,
      ).map((comment) => comment.id),
    [comments, currentTime],
  );

  const pinnedComments = useMemo(
    () =>
      comments.map((comment, index) => ({
        ...comment,
        leftPercent: duration > 0 ? (comment.timestamp / duration) * 100 : 0,
        lane: index % 2,
      })),
    [comments, duration],
  );

  const filteredEmojis = useMemo(() => {
    const query = emojiQuery.trim().toLowerCase();
    return sortEmojisByUsage(
      emojis.filter((emoji) => !query || emoji.slug.includes(query)),
      {},
      priorityEmotes,
    );
  }, [emojiQuery, emojis, priorityEmotes]);

  const seekTo = (nextTime: number) => {
    const clampedTime = Math.min(Math.max(0, nextTime), duration || 0);
    if (isCurrentTrack) {
      seek(clampedTime);
      setCurrentTime(clampedTime);
      return;
    }

    void playItem({
      id: trackId,
      pageVersion,
      allowDownload,
      slug,
      name,
      artist,
      thumbnail:
        thumbnail || game.soundtrackThumbnail || game.thumbnail || "",
      game,
      song: url,
      loudnessGainDb,
    }).then(() => {
      seek(clampedTime);
      setCurrentTime(clampedTime);
      if (!shown) {
        setShown(true);
      }
    });
  };

  useEffect(() => {
    if (!contextMenu) return;

    const close = () => setContextMenu(null);
    window.addEventListener("click", close);

    return () => {
      window.removeEventListener("click", close);
    };
  }, [contextMenu]);

  return (
    <Vstack align="start" className="w-full gap-4">
      <div className="relative w-full pt-12">
        <canvas
          ref={canvasRef}
          className="h-36 w-full cursor-pointer"
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const ratio = Math.min(
              Math.max((event.clientX - rect.left) / rect.width, 0),
              1,
            );
            setHoverPreview({
              time: ratio * duration,
              leftPercent: ratio * 100,
            });
          }}
          onMouseLeave={() => setHoverPreview(null)}
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const ratio = (event.clientX - rect.left) / rect.width;
            seekTo(ratio * duration);
          }}
          onContextMenu={(event) => {
            if (!canComment) return;
            event.preventDefault();
            const rect = event.currentTarget.getBoundingClientRect();
            const ratio = Math.min(
              Math.max((event.clientX - rect.left) / rect.width, 0),
              1,
            );
            setContextMenu({
              left: event.clientX,
              top: event.clientY,
              time: ratio * duration,
            });
          }}
        />

        {hoverPreview && (
          <>
            <div
              className="pointer-events-none absolute"
              style={{
                left: `${hoverPreview.leftPercent}%`,
                top: 48,
                height: 96,
                transform: "translateX(-50%)",
                width: 2,
                zIndex: 15,
                backgroundColor: colors["yellow"],
              }}
            />
            <div
              className="pointer-events-none absolute"
              style={{
                left: `${hoverPreview.leftPercent}%`,
                top: 148,
                transform: "translateX(-50%)",
                zIndex: 16,
              }}
            >
              <div
                className="rounded-md border px-2 py-1"
                style={{
                  borderColor: colors["base"],
                  backgroundColor: colors["mantle"],
                  color: colors["text"],
                  boxShadow:
                    "0 10px 15px -3px rgba(0,0,0,0.2), 0 4px 6px -4px rgba(0,0,0,0.2)",
                }}
              >
                <Text size="xs" color="text">
                  {formatTime(hoverPreview.time)}
                </Text>
              </div>
            </div>
          </>
        )}

        {pinnedComments.map((comment) => {
          const isHovered = hoveredCommentId === comment.id;
          const isActive = activeCommentIds.includes(comment.id);
          const showPopover = isHovered || isActive;
          const fallbackImage = "/images/D2J_Icon.png";

          return (
            <div
              key={comment.id}
              className="absolute"
              style={{
                left: `${comment.leftPercent}%`,
                top: comment.lane === 0 ? 0 : 20,
                transform: "translateX(-50%)",
                zIndex: showPopover ? 20 : 10,
              }}
              onMouseEnter={() => setHoveredCommentId(comment.id)}
              onMouseLeave={() => setHoveredCommentId(null)}
            >
              {showPopover && (
                <div
                  className="absolute bottom-full mb-3 w-64 rounded-xl border px-3 py-2"
                  style={{
                    borderColor: colors["base"],
                    backgroundColor: colors["mantle"],
                    color: colors["text"],
                    left: "50%",
                    transform: "translateX(-50%)",
                    boxShadow:
                      "0 10px 15px -3px rgba(0,0,0,0.2), 0 4px 6px -4px rgba(0,0,0,0.2)",
                  }}
                >
                  <Text size="xs" color="textFaded">
                    {comment.author.name}  {uiText("AppStrings.At")} {formatTime(comment.timestamp)}
                  </Text>
                  <div className="text-sm">
                    <MentionedContent content={truncateComment(comment.content)} />
                  </div>
                </div>
              )}

              <button
                type="button"
                className="relative h-8 w-8 overflow-hidden rounded-full border-2 transition-transform"
                style={{
                  borderColor: isHovered ? colors["yellow"] : colors["blue"],
                  backgroundColor: colors["mantle"],
                  transform: isHovered ? "scale(1.08)" : "scale(1)",
                }}
                onClick={() => seekTo(comment.timestamp)}
              >
                <img
                  src={comment.author.profilePicture || fallbackImage}
                  alt={comment.author.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </button>
              <div
                className="mx-auto mt-1 w-px"
                style={{
                  height: comment.lane === 0 ? 20 : 8,
                  backgroundColor: colors["yellow"],
                }}
              />
            </div>
          );
        })}

        {contextMenu && canComment && (
          <div
            className="fixed z-50 min-w-40 rounded-xl border p-2 shadow-lg"
            style={{
              left: contextMenu.left,
              top: contextMenu.top,
              borderColor: colors["base"],
              backgroundColor: colors["mantle"],
              color: colors["text"],
            }}
          >
            <Button
              size="sm"
              variant="ghost"
              icon="messagecircle"
              onClick={() => {
                setCommentTimestamp(contextMenu.time);
                setCommentDraft("");
                setPickerOpen(false);
                setEmojiQuery("");
                setCommentModalOpen(true);
                setContextMenu(null);
              }}
            >
               {uiText("AppStrings.AddComment")} </Button>
          </div>
        )}
      </div>

      <Hstack className="w-full items-center gap-3">
        <Button
          aria-label={isCurrentTrack && isPlaying ? uiText("AppStrings.Pause") : uiText("AppStrings.Play")}
          icon={isCurrentTrack && isPlaying ? "pause" : "play"}
          tooltip={isCurrentTrack && isPlaying ? uiText("AppStrings.Pause") : uiText("AppStrings.Play")}
          onClick={async () => {
            if (isCurrentTrack && audioEl) {
              if (audioEl.paused) {
                await audioEl.play();
              } else {
                audioEl.pause();
              }
              if (!shown) {
                setShown(true);
              }
              return;
            }

            await playItem({
      id: trackId,
      pageVersion,
      allowDownload,
              slug,
              name,
              artist,
              thumbnail:
                thumbnail || game.soundtrackThumbnail || game.thumbnail || "",
              game,
              song: url,
              loudnessGainDb,
            });
            if (!shown) {
              setShown(true);
            }
          }}
        />
        <Text color="textFaded" size="sm">
          {formatTime(currentTime)} / {formatTime(duration)}
        </Text>
      </Hstack>

      <Modal
        isOpen={commentModalOpen}
        size="md"
        onOpenChange={(open) => {
          if (!open) {
            setCommentModalOpen(false);
            setPickerOpen(false);
            setEmojiQuery("");
          }
        }}
      >
        <ModalContent>
          <ModalHeader>{uiText("AppStrings.AddCommentAt")} {formatTime(commentTimestamp)}</ModalHeader>
          <ModalBody>
            <Vstack align="stretch" className="gap-3">
              <Hstack className="items-end gap-2">
                <Input
                  value={commentDraft}
                  onValueChange={setCommentDraft}
                  placeholder={uiText("AppStrings.CommentAtValue0", { value0: formatTime(commentTimestamp) })}
                />
                {emojis.length > 0 && (
                  <div ref={pickerRef} className="relative">
                    <Button
                      size="sm"
                      variant="ghost"
                      icon="smileplus"
                      onClick={() => setPickerOpen((open) => !open)}
                    />
                    <Popover
                      shown={pickerOpen}
                      anchorToScreen={false}
                      position="top"
                      padding={12}
                      showArrow
                      surface="contrast"
                      transformOrigin="center"
                    >
                      <div className="flex w-64 flex-col gap-2">
                        <Input
                          value={emojiQuery}
                          onValueChange={setEmojiQuery}
                          placeholder={uiText("AppStrings.SearchEmoji")}
                          size="sm"
                          fullWidth
                          style={{
                            backgroundColor: colors["mantle"],
                            borderColor: "transparent",
                            boxShadow: "none",
                          }}
                        />
                        {filteredEmojis.length === 0 ? (
                          <Text size="xs" color="textFaded">
                             {uiText("AppStrings.NoEmojisFound")} </Text>
                        ) : (
                          <div className="grid max-h-40 grid-cols-6 gap-2 overflow-y-auto">
                            {filteredEmojis.map((emoji) => (
                              <Button
                                key={emoji.id}
                                size="sm"
                                variant="ghost"
                                color="default"
                                leftSlot={
                                  <img
                                    src={emoji.image}
                                    alt={uiText("AppStrings.Value03", { value0: emoji.slug })}
                                    className="h-5 w-5"
                                    loading="lazy"
                                    decoding="async"
                                  />
                                }
                                tooltip={uiText("AppStrings.Value03", { value0: emoji.slug.toUpperCase() })}
                                onClick={() => {
                                  setCommentDraft((current) =>
                                    current
                                      ? `${current} :${emoji.slug}:`
                                      : `:${emoji.slug}:`,
                                  );
                                  setPickerOpen(false);
                                  setEmojiQuery("");
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </Popover>
                  </div>
                )}
              </Hstack>
            </Vstack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setCommentModalOpen(false);
                setPickerOpen(false);
                setEmojiQuery("");
              }}
            >
               {uiText("AppStrings.Cancel")} </Button>
            <Button
              loading={savingComment}
              onClick={async () => {
                if (!commentDraft.trim()) {
                  addToast({ title: uiText("AppStrings.EnterATimestampComment") });
                  return;
                }
                try {
                  setSavingComment(true);
                  await onSubmitTimestampComment(
                    commentDraft.trim(),
                    commentTimestamp,
                  );
                  setCommentDraft("");
                  setCommentModalOpen(false);
                  setPickerOpen(false);
                  setEmojiQuery("");
                } finally {
                  setSavingComment(false);
                }
              }}
            >
               {uiText("AppStrings.AddComment")} </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Vstack>
  );
}
