import type { Metadata } from "next";
import ClientTrackPage from "./ClientTrackPage";
import { BASE_URL } from "@/requests/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ trackSlug: string }>;
}): Promise<Metadata> {
  const { trackSlug } = await params;

  const res = await fetch(`${BASE_URL}/tracks/${trackSlug}`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    return {
      title: "Track not found",
      description: "This track could not be found",
    };
  }

  const track = await res.json();
  const fallbackIcon = "/images/D2J_Icon.png";
  const iconUrl =
    track?.game?.thumbnail || track?.game?.banner || fallbackIcon;
  const socialImage =
    track?.game?.banner || track?.game?.thumbnail || fallbackIcon;
  const composerName = track?.composer?.name || track?.composer?.slug;
  const description =
    track?.commentary?.trim() ||
    (composerName && track?.game?.name
      ? `${track.name} by ${composerName} for ${track.game.name}`
      : "Music track on Down2Jam");

  return {
    title: track?.name || trackSlug,
    description,
    alternates: {
      canonical: `/m/${track?.slug || trackSlug}`,
    },
    icons: {
      icon: [
        { url: iconUrl, sizes: "16x16" },
        { url: iconUrl, sizes: "32x32" },
      ],
      apple: [{ url: iconUrl }],
      shortcut: iconUrl,
    },
    openGraph: {
      title: track?.name || trackSlug,
      description,
      url: `https://d2jam.com/m/${track?.slug || trackSlug}`,
      type: "music.song",
      images: [
        {
          url: socialImage,
          width: 720,
          height: 400,
          alt: `${track?.name || trackSlug} artwork`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: track?.name || trackSlug,
      description,
      images: [socialImage],
    },
  };
}

export default function TrackPage({
  params,
}: {
  params: Promise<{ trackSlug: string }>;
}) {
  return <ClientTrackPage params={params} />;
}
