"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/providers/SiteThemeProvider";
import { ActiveJamResponse, getCurrentJam } from "@/helpers/jam";
import {
  getTrack,
  getTrackRatingCategories,
  postTrackTimestampComment,
} from "@/requests/track";
import { postTrackRating } from "@/requests/rating";
import { TrackType } from "@/types/TrackType";
import { TrackRatingCategoryType } from "@/types/TrackRatingCategoryType";
import { UserType } from "@/types/UserType";
import { getSelf } from "@/requests/user";
import {
  addToast,
  Button,
  Card,
  Chip,
  Hstack,
  Link as UiLink,
  Spinner,
  Text,
  Tooltip,
  Vstack,
} from "bioloom-ui";
import ThemedProse from "@/components/themed-prose";
import MentionedContent from "@/components/mentions/MentionedContent";
import CreateComment from "@/components/create-comment";
import CommentCard from "@/components/posts/CommentCard";
import Link from "next/link";
import TrackWaveformPlayer from "@/components/tracks/TrackWaveformPlayer";
import {
  AlertTriangle,
  Award,
  Badge as LucideBadge,
  CircleHelp,
  Star,
} from "lucide-react";

function ordinalSuffixOf(i: number) {
  const j = i % 10;
  const k = i % 100;
  if (j === 1 && k !== 11) return `${i}st`;
  if (j === 2 && k !== 12) return `${i}nd`;
  if (j === 3 && k !== 13) return `${i}rd`;
  return `${i}th`;
}

export default function ClientTrackPage({
  params,
}: {
  params: Promise<{ trackSlug: string }>;
}) {
  const { colors } = useTheme();
  const [trackSlug, setTrackSlug] = useState<string>("");
  const [track, setTrack] = useState<TrackType | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [overallCategory, setOverallCategory] =
    useState<TrackRatingCategoryType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingRating, setSavingRating] = useState(false);
  const [hoverStars, setHoverStars] = useState<{ [key: number]: number }>({});
  const [selectedStars, setSelectedStars] = useState<{ [key: number]: number }>(
    {},
  );
  const [hoverCategory, setHoverCategory] = useState<number | null>(null);
  const [activeJamResponse, setActiveJamResponse] =
    useState<ActiveJamResponse | null>(null);

  useEffect(() => {
    params.then(({ trackSlug }) => setTrackSlug(trackSlug));
  }, [params]);

  useEffect(() => {
    if (!trackSlug) return;
    let cancelled = false;

    (async () => {
      try {
        setIsLoading(true);
        const [trackResponse, userResponse, categoriesResponse] =
          await Promise.all([
            getTrack(trackSlug),
            getSelf().catch(() => null),
            getTrackRatingCategories(),
          ]);

        if (cancelled) return;

        if (trackResponse.ok) {
          setTrack(await trackResponse.json());
        } else {
          setTrack(null);
        }

        if (userResponse?.ok) {
          setUser(await userResponse.json());
        } else {
          setUser(null);
        }

        if (categoriesResponse.ok) {
          const payload = await categoriesResponse.json();
          const overall =
            payload?.data?.find(
              (category: TrackRatingCategoryType) =>
                category.name === "Overall",
            ) ?? null;
          setOverallCategory(overall);
        }

        const jamData = await getCurrentJam();
        if (!cancelled) {
          setActiveJamResponse(jamData);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [trackSlug]);

  useEffect(() => {
    if (!overallCategory) return;
    setSelectedStars((current) => ({
      ...current,
      [overallCategory.id]: track?.viewerRating?.value ?? 0,
    }));
  }, [overallCategory, track?.viewerRating?.value]);

  if (isLoading) {
    return (
      <Vstack className="p-6">
        <Card className="max-w-96">
          <Hstack>
            <Spinner />
            <Text size="xl">Loading track</Text>
          </Hstack>
        </Card>
      </Vstack>
    );
  }

  if (!track) {
    return (
      <Vstack className="p-6">
        <Card className="max-w-96">
          <Text size="xl">Track not found</Text>
        </Card>
      </Vstack>
    );
  }

  const selectedRating = track.viewerRating?.value ?? 0;
  const isTeamMember = Boolean(
    user && track.game?.team?.users?.some((member) => member.id === user.id),
  );
  const isCurrentJamTrack =
    activeJamResponse?.jam?.id != null &&
    track.game?.jamId != null &&
    activeJamResponse.jam.id === track.game.jamId;
  const canShowResults =
    Boolean(activeJamResponse) &&
    !isTeamMember &&
    (!isCurrentJamTrack || user?.id === 3);
  const canRateDuringJam =
    Boolean(user) &&
    !isTeamMember &&
    isCurrentJamTrack &&
    (activeJamResponse?.phase === "Rating" ||
      activeJamResponse?.phase === "Submission");
  const raterHasPublishedGame = Boolean(
    user?.teams?.some((team) => team.game && team.game.published),
  );
  const credits = track.credits?.length
    ? track.credits
    : track.composer
      ? [
          {
            id: -1,
            role: "Composer",
            userId: track.composer.id,
            user: track.composer,
          },
        ]
      : [];
  const visibleFlags = (track.flags ?? []).filter(
    (flag) => flag.name === "Explicit Lyrics",
  );
  const overallScore = track.scores?.Overall;
  const primaryArtist = credits[0]?.user ?? track.composer;

  return (
    <div className="p-4">
      <div
        className="relative overflow-hidden rounded-2xl border"
        style={{
          borderColor: colors["base"],
          background: `linear-gradient(135deg, ${colors["mantle"]}, ${colors["crust"]})`,
        }}
      >
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `url(${track.game.banner || track.game.thumbnail || "/images/D2J_Icon.png"})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative p-6">
          <Vstack align="start" className="gap-4">
            <Link href={`/g/${track.game.slug}`}>
              <Text size="xs" color="textFaded">
                {track.game.name}
              </Text>
            </Link>
            <Text size="4xl" color="text" weight="semibold">
              {track.name}
            </Text>
            <Hstack className="flex-wrap gap-3">
              <Text color="textFaded">By</Text>
              <Link href={`/u/${primaryArtist.slug}`}>
                <Text color="text">
                  {primaryArtist.name || primaryArtist.slug}
                </Text>
              </Link>
            </Hstack>
            <div className="w-full max-w-6xl">
              <TrackWaveformPlayer
                url={track.url}
                comments={track.timestampComments ?? []}
                canComment={Boolean(user)}
                onSubmitTimestampComment={async (content, timestamp) => {
                  const response = await postTrackTimestampComment(
                    track.id,
                    content,
                    timestamp,
                  );
                  const payload = await response.json().catch(() => null);
                  if (!response.ok) {
                    addToast({
                      title:
                        payload?.message ?? "Failed to add timestamp comment",
                    });
                    return;
                  }
                  setTrack((prev) =>
                    prev
                      ? {
                          ...prev,
                          timestampComments: [
                            ...(prev.timestampComments ?? []),
                            payload.data,
                          ].sort((a, b) => a.timestamp - b.timestamp),
                        }
                      : prev,
                  );
                }}
              />
            </div>
          </Vstack>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <Card>
            <Vstack align="start" className="gap-4">
              {track.commentary ? (
                <ThemedProse>
                  <MentionedContent content={track.commentary} />
                </ThemedProse>
              ) : (
                <Text color="textFaded">No commentary yet.</Text>
              )}
            </Vstack>
          </Card>

          <Vstack align="start" className="gap-4">
            <Card className="w-full">
              <Vstack align="start" className="gap-3">
                {isTeamMember && (
                  <>
                    <Text size="xs" color="textFaded">
                      ACTIONS
                    </Text>
                    <Button icon="squarepen" href={`/m/${track.slug}/edit`}>
                      Edit Track
                    </Button>
                  </>
                )}
                <Text size="xs" color="textFaded">
                  TAGS
                </Text>
                <div className="flex flex-wrap gap-2">
                  {track.tags && track.tags.length > 0 ? (
                    track.tags.map((tag) => (
                      <Chip key={tag.id}>{tag.name}</Chip>
                    ))
                  ) : (
                    <Text size="sm" color="textFaded">
                      No tags yet.
                    </Text>
                  )}
                </div>
                <Text size="xs" color="textFaded">
                  PEOPLE
                </Text>
                <div className="flex flex-wrap gap-2">
                  {credits.map((credit) => (
                    <Chip
                      key={`${credit.id}-${credit.role}-${credit.userId}`}
                      avatarSrc={credit.user?.profilePicture}
                      href={credit.user ? `/u/${credit.user.slug}` : undefined}
                    >
                      {credit.user?.name ?? `User #${credit.userId}`}{" "}
                      <span className="opacity-70">({credit.role})</span>
                    </Chip>
                  ))}
                </div>
              </Vstack>
            </Card>

            {visibleFlags.length > 0 && (
              <Card className="w-full">
                <Vstack align="start" className="gap-3">
                  <Text size="xs" color="textFaded">
                    FLAGS
                  </Text>
                  <div className="flex flex-wrap gap-2">
                    {visibleFlags.map((flag) => (
                      <Chip key={flag.id}>{flag.name}</Chip>
                    ))}
                  </div>
                </Vstack>
              </Card>
            )}

            <Card className="w-full">
              <Vstack align="start" className="gap-3">
                <Text size="xs" color="textFaded">
                  RATING
                </Text>
                {canShowResults && overallScore ? (
                  <>
                    <div className="grid grid-cols-[120px_100px_60px_30px] items-center gap-2">
                      <Text size="sm" color="textFaded">
                        Overall
                      </Text>
                      <Text color="text">
                        {(overallScore.averageScore / 2).toFixed(2)} stars
                      </Text>
                      {overallScore.placement !== -1 && (
                        <Text color="textFaded">
                          ({ordinalSuffixOf(overallScore.placement)})
                        </Text>
                      )}
                      <span className="flex items-center justify-center">
                        {overallScore.placement >= 1 &&
                          overallScore.placement <= 3 && (
                            <Award
                              size={16}
                              style={{ color: colors["yellow"] }}
                            />
                          )}
                        {overallScore.placement >= 4 &&
                          overallScore.placement <= 10 && (
                            <LucideBadge
                              size={12}
                              style={{ color: colors["blue"] }}
                            />
                          )}
                      </span>
                    </div>
                  </>
                ) : (
                  overallCategory &&
                  canRateDuringJam && (
                    <TrackStarRow
                      categoryId={overallCategory.id}
                      name="Overall"
                      description={
                        overallCategory.description || "Your overall rating"
                      }
                      disabled={savingRating || isTeamMember}
                      hoverStars={hoverStars}
                      setHoverStars={setHoverStars}
                      selectedStars={selectedStars}
                      setSelectedStars={setSelectedStars}
                      hoverCategory={hoverCategory}
                      setHoverCategory={setHoverCategory}
                      onRate={async (value) => {
                        try {
                          setSavingRating(true);
                          const response = await postTrackRating(
                            track.id,
                            overallCategory.id,
                            value,
                          );
                          if (!response.ok) {
                            const payload = await response
                              .json()
                              .catch(() => null);
                            addToast({
                              title:
                                payload?.message ?? "Failed to save rating",
                            });
                            setSelectedStars((current) => ({
                              ...current,
                              [overallCategory.id]: selectedRating,
                            }));
                            return;
                          }
                          setTrack((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  viewerRating: {
                                    id: prev.viewerRating?.id ?? -1,
                                    value,
                                    userId: user?.id ?? -1,
                                    categoryId: overallCategory.id,
                                  },
                                }
                              : prev,
                          );
                        } finally {
                          setSavingRating(false);
                        }
                      }}
                    />
                  )
                )}
                {canShowResults && overallScore && (
                  <Text size="sm" color="textFaded">
                    {(overallScore.averageUnrankedScore / 2).toFixed(2)} public
                    average from {overallScore.ratingCount} ratings
                  </Text>
                )}
                {isTeamMember && (
                  <Text size="xs" color="textFaded">
                    You can&apos;t rate your own track.
                  </Text>
                )}
                {!user && isCurrentJamTrack && (
                  <Text size="xs" color="textFaded">
                    You must be logged in to rate tracks.
                  </Text>
                )}
                {user &&
                  !isTeamMember &&
                  isCurrentJamTrack &&
                  !canRateDuringJam && (
                    <Text size="xs" color="textFaded">
                      It is not the rating period.
                    </Text>
                  )}
                {user &&
                  !isTeamMember &&
                  isCurrentJamTrack &&
                  canRateDuringJam && (
                    <Text size="xs" color="textFaded">
                      Ratings are automatically saved.
                    </Text>
                  )}
                {user &&
                  !isTeamMember &&
                  isCurrentJamTrack &&
                  canRateDuringJam &&
                  !raterHasPublishedGame && (
                    <Text size="xs" color="textFaded">
                      Your ratings will not count towards the rankings as you
                      did not submit a game.
                    </Text>
                  )}
              </Vstack>
            </Card>

            {((track.links?.length ?? 0) > 0 || track.allowDownload) && (
              <Card className="w-full">
                <Vstack align="start" className="gap-3">
                  <Text size="xs" color="textFaded">
                    LINKS
                  </Text>
                  {track.allowDownload && (
                    <Button
                      href={track.url}
                      download
                      icon="download"
                      externalIcon={false}
                    >
                      Download Track
                    </Button>
                  )}
                  {(track.links ?? []).map((link) => (
                    <UiLink key={link.id} href={link.url}>
                      {link.label}
                    </UiLink>
                  ))}
                </Vstack>
              </Card>
            )}

            {(track.bpm ||
              track.musicalKey ||
              (track.softwareUsed?.length ?? 0) > 0 ||
              track.license) && (
              <Card className="w-full">
                <Vstack align="start" className="gap-3">
                  <Text size="xs" color="textFaded">
                    DETAILS
                  </Text>
                  {track.bpm && <Chip>BPM: {track.bpm}</Chip>}
                  {track.musicalKey && <Chip>Key: {track.musicalKey}</Chip>}
                  {track.license && <Chip>License: {track.license}</Chip>}
                  {(track.softwareUsed?.length ?? 0) > 0 && (
                    <>
                      <Text size="sm" color="textFaded">
                        Software Used
                      </Text>
                      <div className="flex flex-wrap gap-2">
                        {(track.softwareUsed ?? []).map((tool) => (
                          <Chip key={tool}>{tool}</Chip>
                        ))}
                      </div>
                    </>
                  )}
                </Vstack>
              </Card>
            )}

            <Card className="w-full">
              <Vstack align="start" className="gap-3">
                <Text size="xs" color="textFaded">
                  STATS
                </Text>
                <Chip>Ratings Received: {track.ratings?.length ?? 0}</Chip>
                <Hstack>
                  <Chip>
                    Ranked Ratings Received:{" "}
                    {overallScore?.rankedRatingCount ?? 0}
                  </Chip>
                  {(overallScore?.rankedRatingCount ?? 0) < 5 && (
                    <Tooltip
                      content="This track needs 5 ranked ratings received in order to place in music results."
                      position="top"
                    >
                      <AlertTriangle
                        size={16}
                        style={{
                          color: colors["red"],
                        }}
                      />
                    </Tooltip>
                  )}
                </Hstack>
              </Vstack>
            </Card>
          </Vstack>
        </div>

        <div className="my-10 w-fit">
          <CreateComment trackId={track.id} />
        </div>

        <div className="flex flex-col gap-3">
          {(track.comments ?? [])
            .sort((a, b) => b.id - a.id)
            .map((comment) => (
              <div key={comment.id}>
                <CommentCard comment={comment} user={user} />
              </div>
            ))}
          {(track.comments ?? []).length === 0 && (
            <Text color="textFaded">No comments yet.</Text>
          )}
        </div>
      </div>
    </div>
  );
}

function TrackStarRow({
  categoryId,
  name,
  description,
  disabled,
  hoverStars,
  setHoverStars,
  selectedStars,
  setSelectedStars,
  hoverCategory,
  setHoverCategory,
  onRate,
}: {
  categoryId: number;
  name: string;
  description: string;
  disabled: boolean;
  hoverStars: { [key: number]: number };
  setHoverStars: (stars: { [key: number]: number }) => void;
  selectedStars: { [key: number]: number };
  setSelectedStars: (stars: { [key: number]: number }) => void;
  hoverCategory: number | null;
  setHoverCategory: (id: number | null) => void;
  onRate: (value: number) => Promise<void>;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex">
        {[2, 4, 6, 8, 10].map((value) => (
          <TrackStarElement
            key={value}
            id={categoryId}
            value={value}
            disabled={disabled}
            hoverStars={hoverStars}
            setHoverStars={setHoverStars}
            selectedStars={selectedStars}
            setSelectedStars={setSelectedStars}
            hoverCategoryId={hoverCategory}
            setHoverCategoryId={setHoverCategory}
            onRate={onRate}
          />
        ))}
      </div>
      <Text color="textFaded">{name}</Text>
      <Tooltip content={description} position="top">
        <span className="inline-flex items-center">
          <CircleHelp size={16} />
        </span>
      </Tooltip>
    </div>
  );
}

function TrackStarElement({
  id,
  value,
  disabled,
  hoverStars,
  setHoverStars,
  selectedStars,
  setSelectedStars,
  hoverCategoryId,
  setHoverCategoryId,
  onRate,
}: {
  id: number;
  value: number;
  disabled: boolean;
  hoverStars: { [key: number]: number };
  setHoverStars: (stars: { [key: number]: number }) => void;
  selectedStars: { [key: number]: number };
  setSelectedStars: (stars: { [key: number]: number }) => void;
  hoverCategoryId: number | null;
  setHoverCategoryId: (id: number | null) => void;
  onRate: (value: number) => Promise<void>;
}) {
  const { colors } = useTheme();

  return (
    <div
      className={`relative h-6 w-6 ${disabled ? "cursor-default" : "cursor-pointer"}`}
      onMouseEnter={() => {
        if (disabled) return;
        setHoverCategoryId(id);
      }}
      onMouseLeave={() => {
        if (disabled) return;
        setHoverCategoryId(null);
        setHoverStars({});
      }}
    >
      <Star
        fill="currentColor"
        className="absolute transition-all duration-300"
        style={{
          color:
            hoverStars[id] > 0 &&
            hoverStars[id] >= value &&
            hoverCategoryId === id
              ? colors["orangeDark"]
              : selectedStars[id] > 0 && selectedStars[id] >= value
                ? colors["yellow"]
                : colors["base"],
        }}
      />
      <Star
        fill="currentColor"
        className="absolute transition-all duration-300"
        style={{
          clipPath: "inset(0 50% 0 0)",
          color:
            hoverStars[id] > 0 &&
            hoverStars[id] >= value - 1 &&
            hoverCategoryId === id
              ? colors["orangeDark"]
              : selectedStars[id] > 0 && selectedStars[id] >= value - 1
                ? colors["yellow"]
                : colors["base"],
        }}
      />
      <div
        className="absolute left-0 top-0 h-6 w-3"
        onMouseEnter={() => {
          if (disabled) return;
          setHoverStars({ ...hoverStars, [id]: value - 1 });
        }}
        onClick={() => {
          if (disabled) return;
          setSelectedStars({ ...selectedStars, [id]: value - 1 });
          void onRate(value - 1);
        }}
      />
      <div
        className="absolute right-0 top-0 h-6 w-3"
        onMouseEnter={() => {
          if (disabled) return;
          setHoverStars({ ...hoverStars, [id]: value });
        }}
        onClick={() => {
          if (disabled) return;
          setSelectedStars({ ...selectedStars, [id]: value });
          void onRate(value);
        }}
      />
    </div>
  );
}
