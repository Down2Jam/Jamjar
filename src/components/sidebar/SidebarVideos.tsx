"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { Skeleton } from "@/components/skeletons";
import { featuredVideos } from "@/data/featuredVideos";
import { isJamPhase, isPostJamPhase } from "@/helpers/listingPageVersion";
import { useCurrentJam } from "@/hooks/queries";
import { unwrapArray } from "@/hooks/queries/helpers";
import { useTheme } from "@/providers/useSiteTheme";
import { getCollectionMusicMetadata } from "@/requests/collection";
import { getFeaturedGameVideos } from "@/requests/game";
import SidebarSectionTitle from "./SidebarSectionTitle";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Button, Modal, ModalContent, Text, Tooltip } from "bioloom-ui";
import { Play } from "lucide-react";
import { useMemo, useState } from "react";

const MAX_FEATURED_VIDEOS = 10;
const FEATURED_VIDEO_CANDIDATE_LIMIT = 20;
const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

interface DisplayVideo {
  id: string;
  url: string;
  title?: string;
}

interface FeaturedGameVideo {
  gameId: number;
  gameName: string;
  trailerUrl: string;
  videoId: string;
}

function extractYouTubeId(value?: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    let candidate: string | null = null;

    if (hostname === "youtu.be") {
      candidate = url.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (
      hostname === "youtube.com" ||
      hostname.endsWith(".youtube.com") ||
      hostname === "youtube-nocookie.com" ||
      hostname.endsWith(".youtube-nocookie.com")
    ) {
      candidate =
        url.searchParams.get("v") ??
        url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] ??
        null;
    }

    return candidate && YOUTUBE_ID_PATTERN.test(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

export default function SidebarVideos() {
  const uiText = useUiTranslations();
  const { colors } = useTheme();
  const { data: activeJam, isLoading: jamLoading } = useCurrentJam();
  const jamId =
    activeJam?.jam &&
    (isJamPhase(activeJam.phase) || isPostJamPhase(activeJam.phase))
      ? activeJam.jam.id
      : undefined;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const { data: gameVideos = [], isLoading } = useQuery<FeaturedGameVideo[]>({
    queryKey: [
      "featured-game-videos",
      "v2",
      FEATURED_VIDEO_CANDIDATE_LIMIT,
      jamId ?? null,
    ],
    queryFn: async () => {
      const response = await getFeaturedGameVideos(
        FEATURED_VIDEO_CANDIDATE_LIMIT,
        jamId,
      );
      if (!response.ok) throw new Error("Featured videos unavailable");
      return unwrapArray<FeaturedGameVideo>(await response.json());
    },
    staleTime: 5 * 60 * 1000,
  });

  const videos = useMemo(() => {
    const selected: DisplayVideo[] = [];
    const seen = new Set<string>();

    for (const video of featuredVideos) {
      if (jamId !== undefined && video.jamId !== jamId) continue;
      const id = extractYouTubeId(video.url);
      if (!id || seen.has(id)) continue;

      seen.add(id);
      selected.push({
        id,
        url: video.url,
        title: video.title,
      });
    }

    for (const gameVideo of gameVideos) {
      if (selected.length >= MAX_FEATURED_VIDEOS) break;

      const id = gameVideo.videoId || extractYouTubeId(gameVideo.trailerUrl);
      if (!id || seen.has(id)) continue;

      seen.add(id);
      selected.push({
        id,
        url: gameVideo.trailerUrl,
        title: uiText("AppStrings.Value0Trailer", { value0: gameVideo.gameName }),
      });
    }

    return selected.slice(0, MAX_FEATURED_VIDEOS);
  }, [gameVideos, jamId]);

  const titleQueries = useQueries({
    queries: videos.map((video) => ({
      queryKey: ["featured-video-title", video.id],
      // Curated videos and game trailers already have display titles. Avoid
      // spending the metadata endpoint's quota again on every sidebar mount.
      enabled: !video.title,
      queryFn: async () => {
        const response = await getCollectionMusicMetadata(video.url);
        if (!response.ok) throw new Error("Video metadata unavailable");

        const metadata = (await response.json()) as { title?: string };
        const title = metadata.title?.trim();
        if (!title) throw new Error("Video title unavailable");
        return title;
      },
      staleTime: 24 * 60 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: false,
    })),
  });

  if (jamLoading || (isLoading && videos.length === 0)) {
    return (
      <div className="mt-12 flex flex-col items-center gap-2">
        <Skeleton className="h-8 w-44" />
        <div className="grid w-full grid-cols-2 gap-2">
          {Array.from({ length: MAX_FEATURED_VIDEOS }).map((_, index) => (
            <Skeleton key={index} className="aspect-video w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (videos.length === 0) return null;

  const safeCurrentIndex = currentIndex % videos.length;
  const currentVideo = videos[safeCurrentIndex];
  const currentTitle =
    titleQueries[safeCurrentIndex]?.data ??
    currentVideo.title ??
    "Game trailer";

  const showVideo = (index: number) => {
    setCurrentIndex(index);
    setViewerOpen(true);
  };

  return (
    <div className="mt-12 flex flex-col items-center gap-2">
      <SidebarSectionTitle>
         {uiText("AppStrings.FeaturedVideos")} </SidebarSectionTitle>

      <Modal
        isOpen={viewerOpen}
        onOpenChange={(open?: boolean) => setViewerOpen(Boolean(open))}
        backdrop="opaque"
        size="2xl"
        surface="transparent"
        hideCloseButton
      >
        <ModalContent
          className="overflow-visible"
          style={{
            width: "min(720px, calc(100vw - 32px))",
            maxWidth: "none",
          }}
        >
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black shadow-2xl">
            <iframe
              key={currentVideo.id}
              src={`https://www.youtube-nocookie.com/embed/${currentVideo.id}?autoplay=1&rel=0`}
              title={currentTitle}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <Tooltip content="Previous video" position="top">
              <Button
                onClick={() =>
                  setCurrentIndex((safeCurrentIndex - 1 + videos.length) % videos.length)
                }
                icon="chevronleft"
                aria-label={uiText("AppStrings.PreviousVideo")}
                variant="ghost"
              />
            </Tooltip>
            <Text className="min-w-0 truncate text-center" color="text">
              {currentTitle}
            </Text>
            <Tooltip content="Next video" position="top">
              <Button
                onClick={() =>
                  setCurrentIndex((safeCurrentIndex + 1) % videos.length)
                }
                icon="chevronright"
                aria-label={uiText("AppStrings.NextVideo")}
                variant="ghost"
              />
            </Tooltip>
          </div>
        </ModalContent>
      </Modal>

      <div className="grid w-full grid-cols-2 gap-2">
        {videos.map((video, index) => {
          const resolvedTitle = titleQueries[index]?.data ?? video.title;
          const displayTitle =
            resolvedTitle ??
            (titleQueries[index]?.isPending
              ? "Loading video title…"
              : "Game trailer");

          return (
            <button
              key={video.id}
              type="button"
              onClick={() => showVideo(index)}
              aria-haspopup="dialog"
              className="group post-card-shadow relative aspect-video cursor-pointer overflow-hidden rounded-xl bg-black/30 text-left"
              aria-label={uiText("AppStrings.WatchValue0OnYouTube", { value0: displayTitle })}
            >
              <img
                src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                alt=""
                width={212}
                height={119}
                loading="lazy"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03] group-hover:brightness-75"
              />
              <span
                className="absolute left-1/2 top-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full shadow-lg transition-transform group-hover:scale-110"
                style={{
                  backgroundColor: colors.red,
                  color: colors.textLight,
                }}
              >
                <Play className="ml-0.5 size-5 fill-current" aria-hidden="true" />
              </span>
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-3 pb-2 pt-8">
                <span className="block truncate text-sm font-semibold text-white">
                  {displayTitle}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <Button icon="siyoutube" href="https://youtube.d2jam.com">
         {uiText("AppStrings.MoreOnYouTube")} </Button>
    </div>
  );
}
