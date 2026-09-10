"use client";

import Link from "@/compat/next-link";
import { Skeleton } from "@/components/skeletons";
import { useEmojis } from "@/providers/useEmojis";
import type { ReactionType } from "@/types/ReactionType";
import { Tooltip } from "bioloom-ui";
import { useMemo } from "react";
import SidebarSectionTitle from "./SidebarSectionTitle";

const MAX_RECENT_EMOJIS = 63;

function createdAtTime(emoji: ReactionType) {
  if (!emoji.createdAt) return 0;
  const time = new Date(emoji.createdAt).getTime();
  return Number.isFinite(time) ? time : 0;
}

function emojiHref(emoji: ReactionType) {
  if (emoji.ownerGame?.slug) return `/g/${emoji.ownerGame.slug}`;
  if (emoji.ownerUser?.slug) return `/u/${emoji.ownerUser.slug}`;
  if (emoji.artistUser?.slug) return `/u/${emoji.artistUser.slug}`;
  return emoji.image;
}

export default function SidebarEmojis() {
  const { emojis, loading } = useEmojis();
  const recentEmojis = useMemo(
    () =>
      [...emojis]
        .sort(
          (left, right) =>
            createdAtTime(right) - createdAtTime(left) || right.id - left.id,
        )
        .slice(0, MAX_RECENT_EMOJIS),
    [emojis],
  );

  if (loading) {
    return (
      <div className="mt-12 flex flex-col items-center gap-2">
        <Skeleton className="h-8 w-44" />
        <div className="grid w-full grid-cols-7 gap-2">
          {Array.from({ length: MAX_RECENT_EMOJIS }).map((_, index) => (
            <Skeleton key={index} className="aspect-square w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (recentEmojis.length === 0) return null;

  return (
    <div className="mt-12 flex flex-col items-center gap-2">
      <SidebarSectionTitle>
        Recent Emojis
      </SidebarSectionTitle>

      <div className="grid w-full grid-cols-7 gap-2">
        {recentEmojis.map((emoji) => (
          <Tooltip key={emoji.id} content={`:${emoji.slug}:`} position="top">
            <Link
              href={emojiHref(emoji)}
              aria-label={`View :${emoji.slug}:`}
              className="group grid aspect-square place-items-center p-0.5"
            >
              <img
                src={emoji.image}
                alt={`:${emoji.slug}:`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-110"
              />
            </Link>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
