"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { addToast, Button, Input, Popover, Text } from "bioloom-ui";
import { getCookie } from "@/helpers/cookie";
import { redirect } from "@/compat/next-navigation";
import { togglePostReaction } from "@/requests/post";
import { useEmojis } from "@/providers/useEmojis";
import type { ReactionSummaryType, ReactionType } from "@/types/ReactionType";
import { useReactionColors } from "./useReactionColors";
import { useTheme } from "@/providers/useSiteTheme";
import { sortEmojisByUsage } from "@/helpers/emojiSorting";

const MAX_UNIQUE_REACTIONS = 20;

type PostReactionsProps = {
  postId: number;
  reactions?: ReactionSummaryType[];
  className?: string;
  onOverlayChange?: (open: boolean) => void;
  pickerPosition?: "top" | "bottom";
};

export default function PostReactions({
  postId,
  reactions,
  className,
  onOverlayChange,
  pickerPosition = "top",
}: PostReactionsProps) {
  const { emojis } = useEmojis();
  const { colors } = useTheme();
  const [current, setCurrent] = useState<ReactionSummaryType[]>(
    reactions ?? [],
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [emojiQuery, setEmojiQuery] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [reactionEffectId, setReactionEffectId] = useState<number | null>(null);
  const [hoveredReactionId, setHoveredReactionId] = useState<number | null>(
    null,
  );
  const reactionColors = useReactionColors(current);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const pickerCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openPicker = () => {
    if (pickerCloseTimer.current) {
      clearTimeout(pickerCloseTimer.current);
      pickerCloseTimer.current = null;
    }
    setPickerOpen(true);
  };

  const schedulePickerClose = () => {
    if (pickerCloseTimer.current) {
      clearTimeout(pickerCloseTimer.current);
    }
    pickerCloseTimer.current = setTimeout(() => {
      setPickerOpen(false);
      pickerCloseTimer.current = null;
    }, 140);
  };

  useEffect(() => {
    setCurrent(reactions ?? []);
    setReactionEffectId(null);
  }, [postId, reactions]);

  useEffect(() => {
    return () => {
      if (pickerCloseTimer.current) {
        clearTimeout(pickerCloseTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!pickerOpen) return;
    const handleDown = (event: MouseEvent) => {
      if (!pickerRef.current) return;
      if (!pickerRef.current.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDown, true);
    return () => {
      document.removeEventListener("mousedown", handleDown, true);
    };
  }, [pickerOpen]);

  useEffect(() => {
    if (!pickerOpen) {
      setEmojiQuery("");
    }
  }, [pickerOpen]);

  useEffect(() => {
    onOverlayChange?.(pickerOpen || hoveredReactionId !== null);
  }, [hoveredReactionId, onOverlayChange, pickerOpen]);

  const availableEmojis = useMemo(() => {
    const usedReactionIds = new Set(current.map((entry) => entry.reaction.id));
    if (current.length >= MAX_UNIQUE_REACTIONS) {
      return [];
    }
    return emojis.filter((emoji) => !usedReactionIds.has(emoji.id));
  }, [current, emojis]);
  const filteredEmojis = useMemo(() => {
    const query = emojiQuery.trim().toLowerCase();
    return sortEmojisByUsage(
      availableEmojis.filter((emoji) => !query || emoji.slug.includes(query)),
    );
  }, [availableEmojis, emojiQuery]);
  const canAddNewReaction = useMemo(() => {
    const firstReactionCount = current.filter(
      (entry) => entry.isFirstReactor,
    ).length;
    return firstReactionCount < 2;
  }, [current]);

  const handleToggle = async (emoji: ReactionType) => {
    if (!getCookie("token")) {
      redirect("/login");
      return;
    }

    const wasReacted = current.some(
      (entry) => entry.reaction.id === emoji.id && entry.reacted,
    );

    setUpdating(emoji.slug);
    try {
      const response = await togglePostReaction(postId, emoji.id);
      if (!response.ok) {
        if (response.status === 401) {
          redirect("/login");
          return;
        }
        if (response.status === 409) {
          return;
        }
        let message = "Failed to update reaction";
        try {
          const data = await response.json();
          if (typeof data?.message === "string" && data.message) {
            message = data.message;
          }
        } catch {
          // Ignore invalid error payloads and keep the generic message.
        }
        addToast({ title: message });
        return;
      }
      const data = await response.json();
      setCurrent(Array.isArray(data?.data) ? data.data : []);
      setReactionEffectId(wasReacted ? null : emoji.id);
    } catch (error) {
      console.error("Failed to update reaction", error);
      addToast({ title: "Failed to update reaction" });
    } finally {
      setUpdating(null);
    }
  };

  if (current.length === 0 && availableEmojis.length === 0) {
    return null;
  }

  return (
    <div
      className={`relative z-30 flex flex-wrap items-center gap-1 ${
        className ?? ""
      }`}
    >
      {current.map((entry) => (
        <div
          key={entry.reaction.id}
          className="relative z-30"
          onMouseEnter={() => setHoveredReactionId(entry.reaction.id)}
          onMouseLeave={() => setHoveredReactionId(null)}
        >
          <Button
            className={`post-action-button post-reaction-button min-w-12 ${
              hoveredReactionId === entry.reaction.id
                ? "post-reaction-button--hovered"
                : ""
            }`}
            size="sm"
            variant={entry.reacted ? "standard" : "ghost"}
            color={
              entry.reacted
                ? reactionColors[entry.reaction.id] ?? "default"
                : "default"
            }
            data-reaction-color={
              entry.reacted ? reactionColors[entry.reaction.id] : undefined
            }
            leftSlot={
              <span
                className={
                  reactionEffectId === entry.reaction.id
                    ? "post-reaction-icon--pulse inline-flex"
                    : "inline-flex"
                }
                onAnimationEnd={() => {
                  if (reactionEffectId === entry.reaction.id) {
                    setReactionEffectId(null);
                  }
                }}
              >
                <img
                  src={entry.reaction.image}
                  alt={`:${entry.reaction.slug}:`}
                  className="h-5 w-5"
                  loading="eager"
                  decoding="auto"
                />
              </span>
            }
            onClick={() => handleToggle(entry.reaction)}
            disabled={updating === entry.reaction.slug}
          >
            <span
              style={
                entry.reacted && reactionColors[entry.reaction.id]
                  ? { color: colors[reactionColors[entry.reaction.id]] }
                  : undefined
              }
            >
              {entry.count}
            </span>
          </Button>
          <Popover
            shown={hoveredReactionId === entry.reaction.id}
            anchorToScreen={false}
            position="top"
            padding={10}
            showArrow
            surface="contrast"
          >
            <div className="flex min-w-[200px] flex-col gap-2">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide opacity-70">
                <img
                  src={entry.reaction.image}
                  alt=""
                  className="h-4 w-4"
                  loading="eager"
                  decoding="auto"
                />
                <span>:{entry.reaction.slug}:</span>
              </div>
              {(entry.users ?? []).length === 0 ? (
                <div className="text-sm opacity-70">No reactions yet.</div>
              ) : (
                <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
                  {(entry.users ?? []).map((user) => (
                    <a
                      key={user.id}
                      href={`/u/${user.slug}`}
                      className="flex items-center gap-2 text-sm"
                    >
                      <img
                        src={user.profilePicture || "/images/D2J_Icon.png"}
                        alt={user.name}
                        className="h-5 w-5 rounded-full"
                        loading="lazy"
                        decoding="async"
                      />
                      <span>{user.name}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </Popover>
        </div>
      ))}

      {canAddNewReaction && availableEmojis.length > 0 && (
        <div
          ref={pickerRef}
          className="relative z-30"
          onMouseEnter={openPicker}
          onMouseLeave={schedulePickerClose}
        >
          <Button
            className="post-action-button min-w-12"
            size="sm"
            variant="ghost"
            icon="smileplus"
            onClick={openPicker}
            onFocus={openPicker}
          />
          <Popover
            shown={pickerOpen}
            anchorToScreen={false}
            position={pickerPosition}
            padding={12}
            showArrow
            surface="contrast"
            transformOrigin="center"
            onHoverChange={(hovered) => {
              if (hovered) {
                openPicker();
              } else {
                schedulePickerClose();
              }
            }}
          >
            <div className="flex w-64 flex-col gap-2">
              <Input
                value={emojiQuery}
                onValueChange={setEmojiQuery}
                placeholder="Search emoji"
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
                  No emojis found.
                </Text>
              ) : (
                <div className="grid max-h-40 grid-cols-6 gap-2 overflow-y-auto">
                  {filteredEmojis.map((emoji) => {
                    return (
                      <Button
                        key={emoji.id}
                        size="sm"
                        variant="ghost"
                        color="default"
                        leftSlot={
                          <img
                            src={emoji.image}
                            alt={`:${emoji.slug}:`}
                            className="h-5 w-5"
                            loading="lazy"
                            decoding="async"
                          />
                        }
                        tooltip={`:${emoji.slug.toUpperCase()}:`}
                        onClick={() => {
                          handleToggle(emoji);
                          setPickerOpen(false);
                        }}
                        disabled={updating === emoji.slug}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </Popover>
        </div>
      )}
    </div>
  );
}
