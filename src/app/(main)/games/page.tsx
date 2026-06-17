import GamesClient from "./GamesClient";
import { Card } from "bioloom-ui";
import { Icon } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { Suspense } from "react";

export default function GamesPage() {
  return (
    <>
      <Vstack>
        <Card>
          <Vstack>
            <Hstack>
              <Icon name="gamepad2" color="text" />
              <Text size="xl" color="text" weight="semibold">
                Games.Title
              </Text>
            </Hstack>
            <Text size="sm" color="textFaded">
              Games.Description
            </Text>
          </Vstack>
        </Card>
      </Vstack>

      <Suspense fallback={<div>Loading...</div>}>
        <GamesClient />
      </Suspense>
    </>
  );
}
