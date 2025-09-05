"use client";

import { Card } from "@/framework/Card";
import { Spinner } from "@/framework/Spinner";
import { Hstack, Vstack } from "@/framework/Stack";
import Text from "@/framework/Text";
import { getTeamsUser } from "@/requests/team";
import { GameType } from "@/types/GameType";
import { TeamType } from "@/types/TeamType";
import { use, useEffect, useState } from "react";
import GameEditingForm from "../../../../../components/game-editing-form/GameEditingForm";
import Icon from "@/framework/Icon";

export default function ClientGameEditPage({
  params,
}: {
  params: Promise<{ gameSlug: string }>;
}) {
  const resolvedParams = use(params);
  const gameSlug = resolvedParams.gameSlug;
  const [loading, setLoading] = useState<boolean>(true);
  const [game, setGame] = useState<GameType>();

  useEffect(() => {
    const load = async () => {
      try {
        const teamResponse = await getTeamsUser();

        if (teamResponse.status == 200) {
          const data = await teamResponse.json();
          const matchingSlugTeam = data.data.filter((team: TeamType) => {
            return team.game?.slug === gameSlug;
          });

          if (matchingSlugTeam.length !== 0) {
            setGame(matchingSlugTeam[0].game);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    };
    load();
  }, [gameSlug]);

  if (loading) {
    return (
      <Vstack>
        <Card className="max-w-96">
          <Vstack>
            <Hstack>
              <Spinner />
              <Text size="xl">Loading</Text>
            </Hstack>
            <Text color="textFaded">Loading edit page...</Text>
          </Vstack>
        </Card>
      </Vstack>
    );
  }

  if (!game) {
    return (
      <Vstack>
        <Card className="max-w-96">
          <Vstack>
            <Hstack>
              <Icon name="x" />
              <Text size="xl">Invalid Permissions</Text>
            </Hstack>
            <Text color="textFaded">
              You do not have access to editing this game
            </Text>
          </Vstack>
        </Card>
      </Vstack>
    );
  }

  return <GameEditingForm game={game} />;
}
