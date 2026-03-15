"use client";

import { useEffect, useMemo, useState } from "react";
import { getStreamers } from "@/requests/streamer";
import { FeaturedStreamerType } from "@/types/FeaturedStreamerType";
import { UserType } from "@/types/UserType";

function hasD2JamTag(streamer: FeaturedStreamerType) {
  return Array.isArray(streamer.streamTags)
    ? streamer.streamTags.some((tag) => String(tag).toLowerCase() === "d2jam")
    : false;
}

type RatingVisibilityUser = Pick<
  UserType,
  "hideRatings" | "autoHideRatingsWhileStreaming"
> & {
  twitch?: string | null;
};

export function useEffectiveHideRatings(user?: RatingVisibilityUser | null) {
  const [isTaggedStreaming, setIsTaggedStreaming] = useState(false);

  useEffect(() => {
    const twitchName = user?.twitch?.trim().toLowerCase();
    if (!user?.autoHideRatingsWhileStreaming || !twitchName) {
      setIsTaggedStreaming(false);
      return;
    }

    let cancelled = false;

    const refresh = async () => {
      try {
        const response = await getStreamers();
        if (!response.ok) {
          if (!cancelled) setIsTaggedStreaming(false);
          return;
        }

        const payload = await response.json();
        const streamers = Array.isArray(payload?.data) ? payload.data : [];
        const live = streamers.some(
          (streamer: FeaturedStreamerType) =>
            streamer.userName?.toLowerCase() === twitchName &&
            hasD2JamTag(streamer),
        );

        if (!cancelled) {
          setIsTaggedStreaming(live);
        }
      } catch {
        if (!cancelled) {
          setIsTaggedStreaming(false);
        }
      }
    };

    void refresh();
    const interval = window.setInterval(refresh, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [user?.autoHideRatingsWhileStreaming, user?.twitch]);

  return useMemo(
    () => Boolean(user?.hideRatings) || isTaggedStreaming,
    [isTaggedStreaming, user?.hideRatings],
  );
}
