"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { addToast, Button, Popover } from "bioloom-ui";
import { getCookie } from "@/helpers/cookie";
import { redirect } from "next/navigation";
import { togglePostReaction } from "@/requests/post";
import { useEmojis } from "@/providers/EmojiProvider";
import type { ReactionSummaryType, ReactionType } from "@/types/ReactionType";

type PostReactionsProps = {
  postId: number;
  reactions?: ReactionSummaryType[];
  className?: string;
  onOverlayChange?: (open: boolean) => void;
};

export default function PostReactions({
  postId,
  reactions,
  className,
  onOverlayChange,
}: PostReactionsProps) {
  const { emojis } = useEmojis();
  const [current, setCurrent] = useState<ReactionSummaryType[]>(reactions ?? []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [hoveredReactionId, setHoveredReactionId] = useState<number | null>(
    null
  );
  const pickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCurrent(reactions ?? []);
  }, [postId, reactions]);

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
    onOverlayChange?.(pickerOpen || hoveredReactionId !== null);
  }, [hoveredReactionId, onOverlayChange, pickerOpen]);

  const sortedEmojis = useMemo(() => {
    return [...emojis].sort((a, b) => a.slug.localeCompare(b.slug));
  }, [emojis]);

  const handleToggle = async (emoji: ReactionType) => {
    if (!getCookie("token")) {
      redirect("/login");
      return;
    }

    setUpdating(emoji.slug);
    try {
      const response = await togglePostReaction(postId, emoji.id);
      if (!response.ok) {
        if (response.status === 401) {
          redirect("/login");
          return;
        }
        addToast({ title: "Failed to update reaction" });
        return;
      }
      const data = await response.json();
      setCurrent(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      console.error("Failed to update reaction", error);
      addToast({ title: "Failed to update reaction" });
    } finally {
      setUpdating(null);
    }
  };

  if (current.length === 0 && sortedEmojis.length === 0) {
    return null;
  }

  return (
    <div
      className={`relative z-30 flex flex-wrap items-center gap-2 ${
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
            size="sm"
            variant={entry.reacted ? "standard" : "ghost"}
            color={entry.reacted ? "blue" : "default"}
            leftSlot={
              <img
                src={entry.reaction.image}
                alt={`:${entry.reaction.slug}:`}
                className="h-4 w-4"
                loading="lazy"
                decoding="async"
              />
            }
            onClick={() => handleToggle(entry.reaction)}
            disabled={updating === entry.reaction.slug}
          >
            {entry.count}
          </Button>
          <Popover
            shown={hoveredReactionId === entry.reaction.id}
            anchorToScreen={false}
            position="top"
            padding={10}
          >
            <div className="flex min-w-[200px] flex-col gap-2">
              <div className="text-xs uppercase tracking-wide opacity-70">
                :{entry.reaction.slug}:
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

      {sortedEmojis.length > 0 && (
        <div ref={pickerRef} className="relative z-30">
          <Button
            size="sm"
            variant="ghost"
            icon="smileplus"
            onClick={() => setPickerOpen((open) => !open)}
          />
          <Popover
            shown={pickerOpen}
            anchorToScreen={false}
            position="bottom-left"
            padding={8}
          >
            <div className="grid grid-cols-6 gap-2 max-w-[240px] max-h-40 overflow-y-auto">
              {sortedEmojis.map((emoji) => {
                const reacted = current.find(
                  (entry) => entry.reaction.id === emoji.id
                )?.reacted;
                return (
                  <Button
                    key={emoji.id}
                    size="sm"
                    variant={reacted ? "standard" : "ghost"}
                    color={reacted ? "blue" : "default"}
                    leftSlot={
                      <img
                        src={emoji.image}
                        alt={`:${emoji.slug}:`}
                        className="h-4 w-4"
                        loading="lazy"
                        decoding="async"
                      />
                    }
                    tooltip={`:${emoji.slug}:`}
                    onClick={() => {
                      handleToggle(emoji);
                      setPickerOpen(false);
                    }}
                    disabled={updating === emoji.slug}
                  />
                );
              })}
            </div>
          </Popover>
        </div>
      )}
    </div>
  );
}
