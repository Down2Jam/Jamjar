import Games from "@/components/games";
import { Vstack } from "@/framework/Stack";
import Text from "@/framework/Text";
import { Suspense } from "react";

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
