import ClientGamePage from "./ClientGamePage";
import { Metadata } from "next";
import { getGame } from "@/requests/game";

export async function generateMetadata({
  params,
}: {
  params: { gameSlug: string };
}): Promise<Metadata> {
  const res = await getGame(params.gameSlug);

  if (!res.ok) {
    return {
      title: "Game not found | Down2Jam",
      description: "This game could not be found.",
    };
  }

  const { name, short, thumbnail } = await res.json();

  return {
    title: `${name}`,
    description: short || "A game submitted to Down2Jam",
    alternates: {
      canonical: `/g/${params.gameSlug}`,
    },
    openGraph: {
      title: name,
      description: short || "A game submitted to Down2Jam",
      url: `https://d2jam.com/g/${params.gameSlug}`,
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
