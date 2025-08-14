import TeamFinder from "@/components/team-finder";
import { Vstack } from "@/framework/Stack";
import Text from "@/framework/Text";
import { Divider } from "@heroui/react";
import { Suspense } from "react";

export default function GamesPage() {
  return (
    <>
      <Vstack align="start">
        <Text size="3xl" color="text">
          Team Finder
        </Text>
        <Text size="sm" color="textFaded">
          This is a spot to find teammates to make games with for the jam!
        </Text>
      </Vstack>
      <Divider />

      <Suspense fallback={<div>Loading...</div>}>
        <TeamFinder />
      </Suspense>
    </>
  );
}
