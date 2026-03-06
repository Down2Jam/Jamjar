"use client";

import Results from "@/components/results";
import { Button, Card, Hstack, Text, Vstack } from "bioloom-ui";

export default function AdminResultsPreview() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <Vstack align="stretch" gap={2}>
          <Text size="2xl" weight="bold">
            Results Preview
          </Text>
          <Text size="sm" color="textFaded">
            Review the results layout before sharing the public leaderboard.
          </Text>
          <Hstack wrap>
            <Button href="/results" icon="arrowupright">
              Open Public Results
            </Button>
            <Button href="/games" icon="gamepad2" variant="ghost">
              Browse Games
            </Button>
          </Hstack>
        </Vstack>
      </Card>
      <Results />
    </div>
  );
}
