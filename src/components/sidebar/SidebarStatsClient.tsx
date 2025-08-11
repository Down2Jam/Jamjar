"use client";

import Timers from "../timers";
import { Card } from "@/framework/Card";
import { Hstack, Vstack } from "@/framework/Stack";
import Icon from "@/framework/Icon";
import Text from "@/framework/Text";

export default function SidebarStatsClient({
  users,
  games,
  ratings,
}: {
  users: number;
  games: number;
  ratings: number;
}) {
  return (
    <Card>
      <Vstack>
        <Timers />
        <Hstack>
          <Icon name="users" color="textFaded" />
          <Text>Entrants</Text>
          <Text color="blue">{users}</Text>
        </Hstack>
        {games != 0 && (
          <Hstack>
            <Icon name="gamepad2" color="textFaded" />
            <Text>Games</Text>
            <Text color="blue">{games}</Text>
          </Hstack>
        )}
        {ratings != 0 && (
          <Hstack>
            <Icon name="star" color="textFaded" />
            <Text>Ratings</Text>
            <Text color="blue">{ratings}</Text>
          </Hstack>
        )}
      </Vstack>
    </Card>
  );
}
