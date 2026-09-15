import { translateSystemLabel } from "@/helpers/systemLabels";
"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { useEffect, useState } from "react";
import { useTheme } from "@/providers/useSiteTheme";
import { GamePageBackground } from "@/app/(main)/PageBackground";
import { useCurrentJam } from "@/hooks/queries";
import {
  getTrack,
  getTrackRatingCategories,
  postTrackTimestampComment,
} from "@/requests/track";
import { postTrackRating } from "@/requests/rating";
import { isOwnTrack } from "@/helpers/isOwnTrack";
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
  Text,
  Tooltip,
  Vstack,
} from "bioloom-ui";
import ThemedProse from "@/components/themed-prose";
import MentionedContent from "@/components/mentions/MentionedContent";
import { useEffectiveHideRatings } from "@/hooks/useEffectiveHideRatings";
import RatingVisibilityGate from "@/components/ratings/RatingVisibilityGate";
import { readArray, readItem } from "@/requests/helpers";
import {
  emitTrackRatingSync,
  subscribeToTrackRatingSync,
} from "@/helpers/trackRatingSync";
import { downloadTrackBySlug } from "@/helpers/trackDownload";
import CreateComment from "@/components/create-comment";
import TrackPageLoading from "@/components/track-page-loading";
import CommentCard from "@/components/posts/CommentCard";
import PageVersionToggle from "@/components/page-version-toggle/PageVersionToggle";
import Link from "@/compat/next-link";
import { useRouter } from "@/compat/next-navigation";
import TrackWaveformPlayer from "@/components/tracks/TrackWaveformPlayer";
import {
  AlertTriangle,
  Award,
  Circle,
  CircleSmall,
  CircleHelp,
  Star,
} from "lucide-react";
import { PageVersion } from "@/types/GameType";
import { usePageMetadata } from "@/hooks/usePageMetadata";

function ordinalSuffixOf(i: number) {
  const j = i % 10;
  const k = i % 100;
  if (j === 1 && k !== 11) return `${i}st`;
  if (j === 2 && k !== 12) return `${i}nd`;
  if (j === 3 && k !== 13) return `${i}rd`;
  return `${i}th`;
}

function gradientTextStyle(
  gradient: string,
  fallback: string,
): React.CSSProperties {
  return {
    backgroundImage: gradient,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    color: fallback,
  };
}

function getResultsGradient(
  placement: number,
  averageScore: number,
  colors: Record<string, string>,
) {
  if (placement >= 1 && placement <= 3) {
    return {
      gradient: `linear-gradient(90deg, ${colors["yellow"]}, ${colors["red"]})`,
      first: colors["red"],
    };
  }
  if (averageScore >= 8) {
    return {
      gradient: `linear-gradient(90deg, ${colors["greenLight"]}, ${colors["green"]}, ${colors["greenDark"]})`,
      first: colors["green"],
    };
  }
  if (averageScore >= 7) {
    return {
      gradient: `linear-gradient(90deg, ${colors["blueLight"]}, ${colors["blue"]}, ${colors["blueDark"]})`,
      first: colors["blueLight"],
    };
  }
  if (averageScore >= 6) {
    return {
      gradient: `linear-gradient(90deg, ${colors["purpleLight"]}, ${colors["purple"]}, ${colors["purpleDark"]})`,
      first: colors["purple"],
    };
  }
  return {
    gradient: `linear-gradient(90deg, ${colors["textFaded"]}, ${colors["textFaded"]})`,
    first: colors["textFaded"],
  };
}

function getResultsIcon(
  placement: number,
  averageScore: number,
  color: string,
) {
  if (placement >= 1 && placement <= 3) {
    return <Award size={16} style={{ color }} />;
  }
  if (averageScore >= 8) {
    return <Circle size={15} style={{ color }} />;
  }
  if (averageScore >= 7) {
    return <Circle size={13} style={{ color }} />;
  }
  if (averageScore >= 6) {
    return <CircleSmall size={11} style={{ color }} />;
  }
  return null;
}

export default function ClientTrackPage({
  params,
  searchParams,
}: {
  params: Promise<{ trackSlug: string }>;
  searchParams: Promise<{ pageVersion?: PageVersion }>;
}) {
  const uiText = useUiTranslations();
  const router = useRouter();
  const { colors } = useTheme();
  const [trackSlug, setTrackSlug] = useState<string>("");
  const [pageVersion, setPageVersion] = useState<PageVersion>("JAM");
  const [requestedPageVersion, setRequestedPageVersion] = useState<
    PageVersion | undefined
  >(undefined);
  const [track, setTrack] = useState<TrackType | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [overallCategory, setOverallCategory] =
    useState<TrackRatingCategoryType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [savingRating, setSavingRating] = useState(false);
  const [hoverStars, setHoverStars] = useState<{ [key: number]: number }>({});
  const [selectedStars, setSelectedStars] = useState<{ [key: number]: number }>(
    {},
  );
  const [hoverCategory, setHoverCategory] = useState<number | null>(null);
  const { data: activeJamResponse } = useCurrentJam();
  const effectiveHideRatings = useEffectiveHideRatings(user);
  const composerName = track?.composer?.name || track?.composer?.slug;
  const metadataDescription =
    track?.commentary?.trim() ||
    (composerName && track?.game?.name
      ? `${track.name} by ${composerName} for ${track.game.name}`
      : "Music track on Down2Jam");
  const metadataImage =
    track?.game?.banner || track?.game?.thumbnail || "/images/game-thumbnail.png";
  usePageMetadata({
    title: (track?.name ?? trackSlug) || uiText("AppStrings.Track2"),
    description: metadataDescription,
    image: metadataImage,
    icon:
      track?.game?.soundtrackThumbnail ||
      track?.game?.thumbnail ||
      metadataImage,
    canonical: `/m/${track?.slug || trackSlug}${
      track?.pageVersion === "POST_JAM" ? "?pageVersion=POST_JAM" : ""
    }`,
    type: "music.song",
  });

  useEffect(() => {
    params.then(({ trackSlug }) => setTrackSlug(trackSlug));
  }, [params]);

  useEffect(() => {
    searchParams.then(({ pageVersion }) => {
      if (pageVersion === "POST_JAM" || pageVersion === "JAM") {
        setRequestedPageVersion(pageVersion);
      } else {
        setRequestedPageVersion(undefined);
      }
    });
  }, [searchParams]);

  useEffect(() => {
    if (!trackSlug) return;
    let cancelled = false;

    (async () => {
      try {
        setIsLoading(true);
        const [trackResponse, userResponse, categoriesResponse] =
          await Promise.all([
            getTrack(trackSlug, requestedPageVersion),
            getSelf().catch(() => null),
            getTrackRatingCategories(),
          ]);

        if (cancelled) return;

        if (trackResponse.ok) {
          const payload = await readItem<TrackType>(trackResponse);
          setTrack(payload);
          setPageVersion(
            payload?.pageVersion === "POST_JAM" ? "POST_JAM" : "JAM",
          );
        } else {
          setTrack(null);
        }

        if (userResponse?.ok) {
          setUser(await readItem<UserType>(userResponse));
        } else {
          setUser(null);
        }

        if (categoriesResponse.ok) {
          const payload = await readArray<TrackRatingCategoryType>(
            categoriesResponse,
          );
          const overall =
            payload.find(
              (category: TrackRatingCategoryType) =>
                category.name === "Overall",
            ) ?? null;
          setOverallCategory(overall);
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
  }, [requestedPageVersion, trackSlug]);

  useEffect(() => {
    if (!overallCategory) return;
    setSelectedStars((current) => ({
      ...current,
      [overallCategory.id]: track?.viewerRating?.value ?? 0,
    }));
  }, [overallCategory, track?.viewerRating?.value]);

  useEffect(() => {
    return subscribeToTrackRatingSync(({ trackId, categoryId, value }) => {
      if (!track || track.id !== trackId || !overallCategory) return;
      if (overallCategory.id !== categoryId) return;

      setSelectedStars((current) => ({
        ...current,
        [categoryId]: value,
      }));
      setTrack((prev) =>
        prev
          ? {
              ...prev,
              viewerRating: {
                id: prev.viewerRating?.id ?? -1,
                value,
                userId: user?.id ?? -1,
                categoryId,
              },
            }
          : prev,
      );
    });
  }, [overallCategory, track, user?.id]);

  if (isLoading) {
    return <TrackPageLoading />;
  }

  if (!track) {
    return (
      <Vstack className="p-6">
        <Card className="max-w-96">
          <Text size="xl">{uiText("AppStrings.TrackNotFound")}</Text>
        </Card>
      </Vstack>
    );
  }

  const selectedRating = track.viewerRating?.value ?? 0;
  const isOwnMusic = isOwnTrack(track, user);
  const isTeamMember = Boolean(
    user && track.game?.team?.users?.some((member) => member.id === user.id),
  );
  const isCurrentJamTrack =
    activeJamResponse?.jam?.id != null &&
    track.game?.jamId != null &&
    activeJamResponse.jam.id === track.game.jamId;
  const isJamRatingOpenPhase =
    activeJamResponse?.phase === "Rating" ||
    activeJamResponse?.phase === "Submission";
  const isPostJamRatingOpenPhase =
    activeJamResponse?.phase === "Post-Jam Rating";
  const isRatingOpenPhase =
    track.pageVersion === "POST_JAM"
      ? isPostJamRatingOpenPhase
      : isJamRatingOpenPhase;
  const shouldShowCurrentJamResults =
    activeJamResponse?.phase === "Post-Jam Refinement" ||
    activeJamResponse?.phase === "Post-Jam Rating";
  const shouldShowCurrentVersionResults =
    track.pageVersion === "JAM" ? shouldShowCurrentJamResults : false;
  const canShowResults =
    Boolean(activeJamResponse) &&
    (!isCurrentJamTrack || shouldShowCurrentVersionResults);
  const canRateCurrentVersion =
    Boolean(user) &&
    !isOwnMusic &&
    isCurrentJamTrack &&
    isRatingOpenPhase &&
    Boolean(overallCategory);
  const hasVersionToggle =
    track.availablePageVersions?.includes("JAM") &&
    track.availablePageVersions?.includes("POST_JAM");
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
  const overallScoreGradient = overallScore
    ? getResultsGradient(
        overallScore.placement,
        overallScore.averageScore,
        colors,
      )
    : null;
  const handlePageVersionChange = (nextVersion: PageVersion) => {
    setRequestedPageVersion(nextVersion);
    setPageVersion(nextVersion);

    const params = new URLSearchParams(window.location.search);
    params.set("pageVersion", nextVersion);
    router.replace(`/m/${trackSlug}?${params.toString()}`);
  };

  return (
    <>
      <GamePageBackground image={track.game.pageBackground?.trim() || null} />
      <div
        className="relative mb-6 overflow-visible border-0 rounded-none lg:border lg:rounded-xl"
        style={{
          borderColor: `color-mix(in srgb, ${colors.text} 5%, ${colors.mantle})`,
          background: `linear-gradient(135deg, ${colors.mantle}, ${colors.crust})`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] opacity-25"
          style={{
            backgroundImage: `url(${track.game.banner || track.game.thumbnail || "/images/game-thumbnail.png"})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative p-4 md:p-6">
            <Vstack align="start" className="gap-4">
              <Link
                href={`/g/${track.game.slug}${track.pageVersion ? `?pageVersion=${track.pageVersion}` : ""}`}
              >
                <Text size="xs" color="textFaded">
                  {track.game.name}
                </Text>
              </Link>
              <Text size="4xl" color="text" weight="semibold">
                {track.name}
              </Text>
              <Hstack className="flex-wrap gap-3">
                <Text color="textFaded">{uiText("PostCard.By")}</Text>
                <Link href={`/u/${primaryArtist.slug}`}>
                  <Text color="text">
                    {primaryArtist.name || primaryArtist.slug}
                  </Text>
                </Link>
              </Hstack>
              <div className="w-full max-w-6xl">
                <TrackWaveformPlayer
                  slug={track.slug}
                  name={track.name}
                  artist={primaryArtist}
                  game={track.game}
                  thumbnail={
                    track.game.soundtrackThumbnail ||
                    track.game.thumbnail ||
                    "/images/game-thumbnail.png"
                  }
                  url={track.url}
                  loudnessGainDb={track.loudnessGainDb}
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
                          payload?.message ?? uiText("AppStrings.FailedToAddTimestampComment"),
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

      <div
        className="relative overflow-visible border-0 rounded-none lg:border lg:rounded-xl"
        style={{
          borderColor: `color-mix(in srgb, ${colors.text} 5%, ${colors.mantle})`,
          backgroundColor: colors.mantle,
          color: colors.text,
        }}
      >
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,962px)_minmax(360px,1fr)]">
          <div className="min-w-0 flex flex-col gap-4">
            {track.commentary ? (
              <ThemedProse className="min-w-0 max-w-full break-words">
                <MentionedContent content={track.commentary} />
              </ThemedProse>
            ) : (
              <Text color="textFaded">{uiText("AppStrings.NoCommentaryYet")}</Text>
            )}
          </div>

          <Vstack align="stretch" gap={4} className="min-w-0">
            <Card className="w-full">
              <Vstack align="start" className="gap-3">
                {(isTeamMember || hasVersionToggle) && (
                  <>
                    <Text size="xs" color="textFaded">
                       {uiText("AppStrings.ACTIONS")} </Text>
                    {isTeamMember && (
                      <Button
                        icon="squarepen"
                        href={`/m/${track.slug}/edit${track.pageVersion ? `?pageVersion=${track.pageVersion}` : ""}`}
                      >
                         {uiText("AppStrings.EditTrack")} </Button>
                    )}
                    {hasVersionToggle && (
                      <PageVersionToggle
                        value={pageVersion}
                        onChange={handlePageVersionChange}
                      />
                    )}
                  </>
                )}
                <Text size="xs" color="textFaded">
                   {uiText("AppStrings.TAGS")} </Text>
                <div className="flex flex-wrap gap-2">
                  {track.tags && track.tags.length > 0 ? (
                    track.tags.map((tag) => (
                      <Chip className="post-tag-chip" key={tag.id}>{tag.name}</Chip>
                    ))
                  ) : (
                    <Text size="sm" color="textFaded">
                       {uiText("AppStrings.NoTagsYet")} </Text>
                  )}
                </div>
                <Text size="xs" color="textFaded">
                   {uiText("AppStrings.PEOPLE")} </Text>
                <div className="flex flex-wrap gap-2">
                  {credits.map((credit) => (
                    <Chip className="post-tag-chip"
                      key={`${credit.id}-${credit.role}-${credit.userId}`}
                      avatarSrc={credit.user?.profilePicture}
                      href={credit.user ? `/u/${credit.user.slug}` : undefined}
                    >
                      {credit.user?.name ?? uiText("AppStrings.UserValue0", { value0: credit.userId })}{" "}
                      <span className="opacity-70">({translateSystemLabel(credit.role, uiText)})</span>
                    </Chip>
                  ))}
                </div>
              </Vstack>
            </Card>

            {visibleFlags.length > 0 && (
              <Card className="w-full">
                <Vstack align="start" className="gap-3">
                  <Text size="xs" color="textFaded">
                     {uiText("AppStrings.FLAGS")} </Text>
                  <div className="flex flex-wrap gap-2">
                    {visibleFlags.map((flag) => (
                      <Chip className="post-tag-chip" key={flag.id}>{flag.name}</Chip>
                    ))}
                  </div>
                </Vstack>
              </Card>
            )}

            <Card className="w-full">
              <Vstack align="start" className="gap-3">
                <Text size="xs" color="textFaded">
                   {uiText("AppStrings.RATING")} </Text>
                <RatingVisibilityGate
                  hiddenByPreference={effectiveHideRatings}
                  hiddenText="Ratings are hidden by your settings."
                >
                  <Vstack align="start" className="gap-3">
                    {canShowResults && overallScore ? (
                      <div className="grid grid-cols-[120px_100px_30px] items-center gap-2">
                        <Text size="sm" color="textFaded">
                           {uiText("RatingCategory.Overall.Title")} </Text>
                        {overallScore.placement !== -1 ? (
                          <Tooltip
                            content={ordinalSuffixOf(overallScore.placement)}
                            position="top"
                          >
                            <span
                              style={gradientTextStyle(
                                overallScoreGradient?.gradient ?? "",
                                overallScoreGradient?.first ?? colors["text"],
                              )}
                              className="w-fit"
                            >
                              {(overallScore.averageScore / 2).toFixed(2)}  {uiText("AppStrings.Stars")} </span>
                          </Tooltip>
                        ) : (
                          <span
                            style={gradientTextStyle(
                              overallScoreGradient?.gradient ?? "",
                              overallScoreGradient?.first ?? colors["text"],
                            )}
                            className="w-fit"
                          >
                            {(overallScore.averageScore / 2).toFixed(2)}  {uiText("AppStrings.Stars")} </span>
                        )}
                        <span className="flex items-center justify-center">
                          {getResultsIcon(
                            overallScore.placement,
                            overallScore.averageScore,
                            overallScoreGradient?.first ?? colors["text"],
                          )}
                        </span>
                      </div>
                    ) : (
                      overallCategory &&
                      canRateCurrentVersion && (
                        <TrackStarRow
                          categoryId={overallCategory.id}
                          name="Overall"
                          description={
                            overallCategory.description || uiText("AppStrings.YourOverallRating")
                          }
                          disabled={savingRating || isTeamMember}
                          hoverStars={hoverStars}
                          setHoverStars={setHoverStars}
                          selectedStars={selectedStars}
                          setSelectedStars={setSelectedStars}
                          hoverCategory={hoverCategory}
                          setHoverCategory={setHoverCategory}
                          onRate={async (value) => {
                            if (!canRateCurrentVersion) return;
                            const previous = selectedRating;
                            emitTrackRatingSync({
                              trackId: track.id,
                              categoryId: overallCategory.id,
                              value,
                            });
                            try {
                              setSavingRating(true);
                              const response = await postTrackRating(
                                track.id,
                                overallCategory.id,
                                value,
                                track.pageVersion,
                              );
                              if (!response.ok) {
                                const payload = await response
                                  .json()
                                  .catch(() => null);
                                addToast({
                                  title:
                                    payload?.message ?? uiText("AppStrings.FailedToSaveRating"),
                                });
                                emitTrackRatingSync({
                                  trackId: track.id,
                                  categoryId: overallCategory.id,
                                  value: previous,
                                });
                                setSelectedStars((current) => ({
                                  ...current,
                                  [overallCategory.id]: previous,
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
                        {(overallScore.averageUnrankedScore / 2).toFixed(2)}{" "}
                         {uiText("AppStrings.PublicAverageFrom")} {overallScore.ratingCount}  {uiText("AppStrings.Ratings")} </Text>
                    )}
                    {isOwnMusic && isCurrentJamTrack && isRatingOpenPhase && (
                      <Text size="xs" color="textFaded">
                         {uiText("AppStrings.YouCanAndAposTRateYourOwn2")} </Text>
                    )}
                    {!user && isCurrentJamTrack && isRatingOpenPhase && (
                      <Text size="xs" color="textFaded">
                         {uiText("AppStrings.YouMustBeLoggedInToRateTracks")} </Text>
                    )}
                    {user &&
                      !isTeamMember &&
                      isCurrentJamTrack &&
                      !isRatingOpenPhase &&
                      !canShowResults && (
                        <Text size="xs" color="textFaded">
                           {uiText("AppStrings.ItIsNotTheRatingPeriod2")} </Text>
                      )}
                    {user &&
                      !isTeamMember &&
                      isCurrentJamTrack &&
                      canRateCurrentVersion && (
                        <Text size="xs" color="textFaded">
                           {uiText("AppStrings.RatingsAreAutomaticallySaved2")} </Text>
                      )}
                    {user &&
                      !isTeamMember &&
                      isCurrentJamTrack &&
                      canRateCurrentVersion &&
                      !raterHasPublishedGame && (
                        <Text size="xs" color="textFaded">
                           {uiText("AppStrings.YourRatingsWillNotCountTowardsTheRankings2")} </Text>
                      )}
                  </Vstack>
                </RatingVisibilityGate>
              </Vstack>
            </Card>

            {((track.links?.length ?? 0) > 0 || track.allowDownload) && (
              <Card className="w-full">
                <Vstack align="start" className="gap-3">
                  <Text size="xs" color="textFaded">
                     {uiText("AppStrings.LINKS")} </Text>
                  {track.allowDownload && (
                    <Button
                      loading={isDownloading}
                      icon="download"
                      onClick={async () => {
                        try {
                          setIsDownloading(true);
                          await downloadTrackBySlug(
                            track.slug,
                            track.name,
                            track.pageVersion,
                          );
                        } catch (error) {
                          console.error(error);
                          addToast({ title: uiText("AppStrings.FailedToDownloadTrack") });
                        } finally {
                          setIsDownloading(false);
                        }
                      }}
                    >
                       {uiText("AppStrings.DownloadTrack")} </Button>
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
              track.license ||
              track.allowBackgroundUse) && (
              <Card className="w-full">
                <Vstack align="start" className="gap-3">
                  <Text size="xs" color="textFaded">
                     {uiText("AppStrings.DETAILS")} </Text>
                  {track.bpm && <Chip className="post-tag-chip">{uiText("AppStrings.BPM")} {track.bpm}</Chip>}
                  {track.musicalKey && <Chip className="post-tag-chip">{uiText("AppStrings.Key2")} {track.musicalKey}</Chip>}
                  {track.license && <Chip className="post-tag-chip">{uiText("AppStrings.License2")} {translateSystemLabel(track.license, uiText)}</Chip>}
                  {track.allowBackgroundUse && (
                    <Chip className="post-tag-chip">{uiText("AppStrings.BackgroundUseInStreamsVideosAllowed")}</Chip>
                  )}
                  {(track.softwareUsed?.length ?? 0) > 0 && (
                    <>
                      <Text size="sm" color="textFaded">
                         {uiText("AppStrings.SoftwareUsed")} </Text>
                      <div className="flex flex-wrap gap-2">
                        {(track.softwareUsed ?? []).map((tool) => (
                          <Chip className="post-tag-chip" key={tool}>{tool}</Chip>
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
                   {uiText("AppStrings.STATS")} </Text>
                <Vstack align="start" className="gap-3">
                  <Chip className="post-tag-chip">{uiText("AppStrings.RatingsReceived")} {track.ratings?.length ?? 0}</Chip>
                  <Hstack>
                    <Chip className="post-tag-chip">
                       {uiText("AppStrings.RatingsGiven2")}{" "}
                      {Math.round(overallScore?.ratingsGivenCount ?? 0)}
                    </Chip>
                    {track.game.category !== "EXTRA" &&
                      track.game.category !== "EXTERNAL" &&
                      track.pageVersion !== "POST_JAM" &&
                      Math.round(overallScore?.ratingsGivenCount ?? 0) < 5 && (
                      <Tooltip
                        content="This track's team needs 5 songs rated in order for it to place in music results."
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
              </Vstack>
            </Card>
          </Vstack>
        </div>
      </div>

      <Card padding={1.5} shadow="none" className="my-10 w-full max-lg:!rounded-none max-sm:!px-3 max-sm:!py-4">
        <CreateComment trackId={track.id} />
      </Card>

      <div className="flex flex-col gap-3">
        {(track.comments ?? [])
          .sort((a, b) => b.id - a.id)
          .map((comment) => (
            <div key={comment.id}>
              <CommentCard comment={comment} user={user} edgeToEdge />
            </div>
          ))}
      </div>
    </>
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
                : `color-mix(in srgb, ${colors.gray} 32%, black)`,
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
                : `color-mix(in srgb, ${colors.gray} 32%, black)`,
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
