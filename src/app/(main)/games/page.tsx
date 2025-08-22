import Games from "@/components/games";
import { Vstack } from "@/framework/Stack";
import Text from "@/framework/Text";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Games | Down2Jam",
  description: "Explore the collection of games uploaded to the site",
  openGraph: {
    title: "Games on Down2Jam",
    description: "Explore the collection of games uploaded to the site",
    url: "https://d2jam.com/games",
    type: "website",
    images: [
      {
        url: "/images/D2J_Icon.png",
        width: 320,
        height: 320,
        alt: "Down2Jam logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Games on Down2Jam",
    description: "Explore the collection of games uploaded to the site",
    images: ["/images/D2J_Icon.png"],
  },
};

export default function GamesPage() {
  return (
    <>
      <Vstack align="start">
        <Text size="3xl" color="text">
          Games.Title
        </Text>
        <Text size="sm" color="textFaded">
          Games.Description
        </Text>
      </Vstack>

      <Suspense fallback={<div>Loading...</div>}>
        <Games />
      </Suspense>
    </>
  );
}
