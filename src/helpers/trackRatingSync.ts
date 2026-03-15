"use client";

export const TRACK_RATING_SYNC_EVENT = "jam:track-rating-sync";

export type TrackRatingSyncPayload = {
  trackId: number;
  categoryId: number;
  value: number;
};

function isTrackRatingSyncPayload(
  value: unknown,
): value is TrackRatingSyncPayload {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<TrackRatingSyncPayload>;
  return (
    typeof candidate.trackId === "number" &&
    typeof candidate.categoryId === "number" &&
    typeof candidate.value === "number"
  );
}

export function emitTrackRatingSync(payload: TrackRatingSyncPayload) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<TrackRatingSyncPayload>(TRACK_RATING_SYNC_EVENT, {
      detail: payload,
    }),
  );
}

export function subscribeToTrackRatingSync(
  listener: (payload: TrackRatingSyncPayload) => void,
) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleEvent = (event: Event) => {
    const detail = (event as CustomEvent<unknown>).detail;
    if (!isTrackRatingSyncPayload(detail)) return;
    listener(detail);
  };

  window.addEventListener(TRACK_RATING_SYNC_EVENT, handleEvent);
  return () => {
    window.removeEventListener(TRACK_RATING_SYNC_EVENT, handleEvent);
  };
}

export function upsertTrackRatingRecord<
  T extends { trackId: number; categoryId: number; value: number },
>(ratings: T[], payload: TrackRatingSyncPayload): T[] {
  const next = ratings.filter(
    (rating) =>
      !(
        rating.trackId === payload.trackId &&
        rating.categoryId === payload.categoryId
      ),
  );

  next.push(payload as T);
  return next;
}
