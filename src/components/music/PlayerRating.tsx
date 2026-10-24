import RatingVisibilityGate from "@/components/ratings/RatingVisibilityGate";
import { useEffectiveHideRatings } from "@/hooks/useEffectiveHideRatings";
import { useSelf } from "@/hooks/queries";
import { queryKeys } from "@/hooks/queries/queryKeys";
import {
  emitTrackRatingSync,
  subscribeToTrackRatingSync,
  upsertTrackRatingRecord,
} from "@/helpers/trackRatingSync";
import { postTrackRating } from "@/requests/rating";
import { getTrackRatingCategories } from "@/requests/track";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addToast } from "bioloom-ui";

import { useEffect, useId, useState } from "react";
import type { PlayableTrack } from "bioloom-miniplayer/core";
type ViewerTrackRating = { trackId: number; categoryId: number; value: number };

export default function PlayerRating({
  track: current,
}: {
  track: PlayableTrack;
}) {
  const { data: userData } = useSelf();
  const queryClient = useQueryClient();
  const ratingGradientId = useId();
  const { data: ratingCategoryId } = useQuery({
    queryKey: ["track", "ratingCategories", "overall"],
    queryFn: async () => {
      const response = await getTrackRatingCategories();
      if (!response.ok) throw new Error("Could not load rating categories.");
      const payload = await response.json();
      return (
        (payload?.data?.find(
          (category: { id: number; name: string }) =>
            category.name === "Overall",
        )?.id as number | undefined) ?? null
      );
    },
    staleTime: 60 * 60 * 1000,
  });
  const [viewerTrackRatings, setViewerTrackRatings] = useState<
    ViewerTrackRating[]
  >([]);
  const [hoverRating, setHoverRating] = useState(0);
  const [savingRating, setSavingRating] = useState(false);
  const viewerId = userData?.id ?? null;
  const effectiveHideRatings = useEffectiveHideRatings({
    hideRatings: Boolean(userData?.hideRatings),
    autoHideRatingsWhileStreaming: Boolean(
      userData?.autoHideRatingsWhileStreaming,
    ),
    twitch: userData?.twitch ?? undefined,
  });

  useEffect(() => {
    setViewerTrackRatings(
      Array.isArray(userData?.trackRatings) ? userData.trackRatings : [],
    );
  }, [userData?.trackRatings]);
  useEffect(
    () =>
      subscribeToTrackRatingSync((value) =>
        setViewerTrackRatings((previous) =>
          upsertTrackRatingRecord(previous, value),
        ),
      ),
    [],
  );
  const selectedRating =
    viewerTrackRatings.find(
      (value) =>
        value.trackId === current.id && value.categoryId === ratingCategoryId,
    )?.value ?? 0;
  const isOwnTrack = Boolean(
    viewerId &&
      (current?.artist.id === viewerId ||
        current?.game.team?.ownerId === viewerId ||
        current?.game.team?.users?.some((member) => member.id === viewerId) ||
        (current?.game.id &&
          userData?.teams?.some((team) => team.game?.id === current.game.id))),
  );
  const canRate = Boolean(
    viewerId && !isOwnTrack && ratingCategoryId && current?.id,
  );
  const rate = async (value: number) => {
    if (!canRate || savingRating || !current?.id || !ratingCategoryId) return;
    const previous = selectedRating;
    emitTrackRatingSync({
      trackId: current.id,
      categoryId: ratingCategoryId,
      value,
    });
    setSavingRating(true);
    try {
      const response = await postTrackRating(
        current.id,
        ratingCategoryId,
        value,
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        addToast({ title: payload?.message ?? "Could not save track rating." });
        emitTrackRatingSync({
          trackId: current.id,
          categoryId: ratingCategoryId,
          value: previous,
        });
      } else queryClient.invalidateQueries({ queryKey: queryKeys.user.self() });
    } catch {
      addToast({ title: "Could not save track rating." });
      emitTrackRatingSync({
        trackId: current.id,
        categoryId: ratingCategoryId,
        value: previous,
      });
    } finally {
      setSavingRating(false);
    }
  };
  return (
    canRate && (
      <RatingVisibilityGate
        inline
        hiddenByPreference={effectiveHideRatings}
        hiddenText="Ratings are hidden by your settings."
        buttonSize="xs"
      >
        <div
          className="flex items-center gap-px text-[var(--player-accent)]"
          role="group"
          aria-label={`Rate ${current.name}`}
          onMouseLeave={() => setHoverRating(0)}
        >
          {Array.from({ length: 5 }, (_, index) => {
            const fill =
              Math.max(
                0,
                Math.min(2, (hoverRating || selectedRating) - index * 2),
              ) * 50;
            return (
              <span
                className="relative block h-[26px] w-5 flex-none [&>svg]:pointer-events-none [&>svg]:absolute [&>svg]:left-0 [&>svg]:top-[3px]"
                key={index}
                onPointerMove={(event) => {
                  if (savingRating || event.pointerType === "touch") return;
                  const bounds = event.currentTarget.getBoundingClientRect();
                  setHoverRating(
                    index * 2 +
                      (event.clientX < bounds.left + bounds.width / 2 ? 1 : 2),
                  );
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient
                      id={`${ratingGradientId}-${index}`}
                      x1="0"
                      y1="0"
                      x2="24"
                      y2="0"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop
                        offset={`${fill}%`}
                        stopColor="var(--player-accent)"
                      />
                      <stop
                        offset={`${fill}%`}
                        stopColor="color-mix(in srgb, var(--player-accent) 28%, #263947)"
                      />
                    </linearGradient>
                  </defs>
                  <path
                    d="M11.624 1.762 Q12 1 12.376 1.762 L15.024 7.138 Q15.4 7.9 16.241 8.022 L22.159 8.878 Q23 9 22.393 9.596 L18.107 13.804 Q17.5 14.4 17.643 15.238 L18.657 21.162 Q18.8 22 18.049 21.602 L12.751 18.798 Q12 18.4 11.249 18.798 L5.951 21.602 Q5.2 22 5.343 21.162 L6.357 15.238 Q6.5 14.4 5.893 13.804 L1.607 9.596 Q1 9 1.841 8.878 L7.759 8.022 Q8.6 7.9 8.976 7.138Z"
                    fill={`url(#${ratingGradientId}-${index})`}
                    stroke="none"
                  />
                </svg>
                {[1, 2].map((half) => {
                  const value = index * 2 + half;
                  return (
                    <button
                      key={half}
                      type="button"
                      className="absolute top-0 h-full w-1/2 min-w-0 cursor-pointer border-0 bg-transparent p-0 text-inherit focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[var(--player-accent)] disabled:cursor-not-allowed disabled:opacity-45"
                      style={{ left: half === 1 ? 0 : "50%" }}
                      aria-label={`Rate ${value / 2} of 5 stars`}
                      title={`${value / 2} stars`}
                      aria-pressed={selectedRating === value}
                      disabled={savingRating}
                      onMouseEnter={() => setHoverRating(value)}
                      onFocus={() => setHoverRating(value)}
                      onBlur={() => setHoverRating(0)}
                      onClick={() => {
                        void rate(value);
                      }}
                    />
                  );
                })}
              </span>
            );
          })}
        </div>
      </RatingVisibilityGate>
    )
  );
}
