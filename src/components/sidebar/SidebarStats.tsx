"use client";

import { GameType } from "@/types/GameType";
import { addToast, Button, Card } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import Timers from "../timers";
import { Icon } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { useCurrentJam, useRatingCategories, useSelf } from "@/hooks/queries";
import { SidebarCardSkeleton } from "@/components/skeletons";
import { isPostJamPhase, isPreJamPhase } from "@/helpers/jamDisplay";
import { hasCookie } from "@/helpers/cookie";
import { joinJam } from "@/helpers/jam";
import { useState } from "react";
import useBreakpoint from "@/hooks/useBreakpoint";

export default function SidebarStats() {
  const { width, isXlUp } = useBreakpoint();
  const textSize = isXlUp ? "md" : width >= 1024 ? "sm" : "xs";
  const iconSize = isXlUp ? 24 : width >= 1024 ? 20 : 18;
  const buttonSize = isXlUp ? "md" : "sm";
  const { data: jamResponse, isLoading: jamLoading } = useCurrentJam();
  const { data: ratingCategories = [], isLoading: categoriesLoading } =
    useRatingCategories(true);
  const hasToken = hasCookie("token");
  const { data: user, isLoading: userLoading } = useSelf(hasToken);
  const [joinedOverride, setJoinedOverride] = useState<boolean | null>(null);

  if (jamLoading || categoriesLoading || (hasToken && userLoading)) {
    return <SidebarCardSkeleton lines={3} />;
  }

  if (!jamResponse || isPreJamPhase(jamResponse.phase)) {
    return null;
  }

  const currentJam = jamResponse.jam;
  if (!currentJam) {
    return null;
  }

  const hasJoinedCurrentJam =
    joinedOverride ??
    Boolean(user?.jams?.some((jam) => jam.id === currentJam.id));
  const hasTeamInCurrentJam = Boolean(
    user?.teams?.some((team) => team.jamId === currentJam.id),
  );
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
        <Timers size={textSize} />
        <Hstack>
          <Icon name="users" color="textFaded" size={iconSize} />
          <Text size={textSize}>Stats.Entrants</Text>
          <Text size={textSize} color="blue">{users}</Text>
        </Hstack>
        {games != 0 && (
          <Hstack>
            <Icon name="gamepad2" color="textFaded" size={iconSize} />
            <Text size={textSize}>Stats.Games</Text>
            <Text size={textSize} color="blue">{games}</Text>
          </Hstack>
        )}
        {music != 0 && (
          <Hstack>
            <Icon name="music" color="textFaded" size={iconSize} />
            <Text size={textSize}>Music</Text>
            <Text size={textSize} color="blue">{music}</Text>
          </Hstack>
        )}
        {ratings != 0 && (
          <Hstack>
            <Icon name="star" color="textFaded" size={iconSize} />
            <Text size={textSize}>Stats.Ratings</Text>
            <Text size={textSize} color="blue">{ratings}</Text>
          </Hstack>
        )}
        {!isPostJamPhase(jamResponse.phase) && (
          <Hstack wrap className="pt-2">
            {!user ? (
              <Button href="/signup" icon="login" color="green" size={buttonSize}>
                Join Jam
              </Button>
            ) : !hasJoinedCurrentJam ? (
              <Button
                icon="calendarplus"
                color="green"
                size={buttonSize}
                onClick={async () => {
                  if (await joinJam(currentJam.id)) {
                    setJoinedOverride(true);
                    addToast({ title: "Joined jam" });
                    return;
                  }

                  addToast({ title: "Failed to join jam" });
                }}
              >
                Join Jam
              </Button>
            ) : hasTeamInCurrentJam ? (
              <Button href="/team" icon="users" color="green" size={buttonSize}>
                My Team
              </Button>
            ) : (
              <Button href="/team-finder" icon="users" color="green" size={buttonSize}>
                Team Finder
              </Button>
            )}
            <Button href="/about" icon="info" size={buttonSize}>
              About
            </Button>
          </Hstack>
        )}
      </Vstack>
    </Card>
  );
}
