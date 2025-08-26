import ClientGamePage from "./ClientGamePage";
import { Metadata } from "next";
import { getGame } from "@/requests/game";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gameSlug: string }>;
}): Promise<Metadata> {
  const { gameSlug } = await params;
  const res = await getGame(gameSlug);

  if (!res.ok) {
    return {
      title: "Game not found",
      description: "This game could not be found",
    };
  }

  const { name, short, thumbnail, slug } = await res.json();
  const fallbackIcon = "/images/D2J_Icon.png";
  const iconUrl = thumbnail || fallbackIcon;

  return {
    title: `${name}`,
    description: short || "A game submitted to Down2Jam",
    alternates: {
      canonical: `/g/${slug}`,
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
      title: name,
      description: short || "A game submitted to Down2Jam",
      url: `https://d2jam.com/g/${slug}`,
      type: "website",
      images: [
        {
          url: thumbnail || "/images/D2J_Icon.png",
          width: 720,
          height: 400,
          alt: `${name} thumbnail`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description: short || "A game submitted to Down2Jam",
      images: [thumbnail || "/images/D2J_Icon.png"],
    },
  };
}

export default function GamePage({
  params,
}: {
  params: Promise<{ gameSlug: string }>;
}) {
  return <ClientGamePage params={params} />;
}
