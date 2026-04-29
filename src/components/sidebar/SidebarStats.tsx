"use client";

import { GameType } from "@/types/GameType";
import { Card } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import Timers from "../timers";
import { Icon } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { useCurrentJam, useRatingCategories } from "@/hooks/queries";
import { SidebarCardSkeleton } from "@/components/skeletons";

export default function SidebarStats() {
  const { data: jamResponse, isLoading: jamLoading } = useCurrentJam();
  const { data: ratingCategories = [], isLoading: categoriesLoading } =
    useRatingCategories(true);

  if (jamLoading || categoriesLoading) {
    return <SidebarCardSkeleton lines={3} />;
  }

  if (!jamResponse || jamResponse.phase === "Upcoming Jam") {
    return null;
  }

  const currentJam = jamResponse.jam;
  const ratings = Math.round(
    currentJam?.games.reduce(
      (prev: number, cur: GameType) =>
        cur.ratings.length /
          (cur.ratingCategories.length + ratingCategories.length) +
        (cur.tracks?.reduce(
          (trackPrev, track) => trackPrev + (track.ratings?.length ?? 0),
          0,
        ) ?? 0) +
        prev,
      0
    ) || 0
  );
  const users = currentJam?.users.length || 0;
  const games = currentJam?.games.filter((game) => game.published).length || 0;
  const music = currentJam?.games
    .filter((game) => game.published)
    .reduce((acc, game) => acc + game.tracks?.length || 0, 0);

  return (
    <Card>
      <Vstack>
        <Timers />
        <Hstack>
          <Icon name="users" color="textFaded" />
          <Text>Stats.Entrants</Text>
          <Text color="blue">{users}</Text>
        </Hstack>
        {games != 0 && (
          <Hstack>
            <Icon name="gamepad2" color="textFaded" />
            <Text>Stats.Games</Text>
            <Text color="blue">{games}</Text>
          </Hstack>
        )}
        {music != 0 && (
          <Hstack>
            <Icon name="music" color="textFaded" />
            <Text>Music</Text>
            <Text color="blue">{music}</Text>
          </Hstack>
        )}
        {ratings != 0 && (
          <Hstack>
            <Icon name="star" color="textFaded" />
            <Text>Stats.Ratings</Text>
            <Text color="blue">{ratings}</Text>
          </Hstack>
        )}
      </Vstack>
    </Card>
  );
}
