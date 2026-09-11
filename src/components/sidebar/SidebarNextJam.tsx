"use client";

import { getNextJamForHome } from "@/helpers/jamDisplay";
import { getCookie, hasCookie } from "@/helpers/cookie";
import { joinJam } from "@/helpers/jam";
import { useCurrentJam, useRatingCategories, useSelf } from "@/hooks/queries";
import { addToast, Button, Card, Hstack, Icon, Text, Vstack } from "bioloom-ui";
import { CSSProperties, useMemo, useState } from "react";
import Timer from "../timers/Timer";
import { SidebarCardSkeleton } from "@/components/skeletons";
import { useTheme } from "@/providers/useSiteTheme";
import useBreakpoint from "@/hooks/useBreakpoint";

export default function SidebarNextJam() {
  const { colors } = useTheme();
  const { width, isXlUp } = useBreakpoint();
  const textSize = isXlUp ? "md" : width >= 1024 ? "sm" : "xs";
  const iconSize = isXlUp ? 24 : width >= 1024 ? 20 : 18;
  const buttonSize = isXlUp ? "md" : "sm";
  const { data: activeJamResponse, isLoading: jamLoading } = useCurrentJam();
  const { data: ratingCategories = [], isLoading: categoriesLoading } =
    useRatingCategories(true);
  const { data: user, isLoading: userLoading } = useSelf(hasCookie("token"));
  const [joinedOverride, setJoinedOverride] = useState<boolean | null>(null);
  const nextJam = getNextJamForHome(activeJamResponse);

  const hasJoinedNextJam =
    joinedOverride ??
    Boolean(user && nextJam && user.jams?.some((jam) => jam.id === nextJam.id));
  const hasTeamInNextJam = Boolean(
    user && nextJam && user.teams?.some((team) => team.jamId === nextJam.id),
  );

  const ratings = useMemo(() => {
    if (!nextJam) return null;
    return Math.round(
        nextJam.games.reduce(
          (prev, cur) =>
            cur.ratings.length / (cur.ratingCategories.length + ratingCategories.length) +
            (cur.tracks?.reduce(
              (trackPrev, track) => trackPrev + (track.ratings?.length ?? 0),
              0,
            ) ?? 0) +
            prev,
          0,
        ),
      );
  }, [nextJam, ratingCategories.length]);

  if (jamLoading || categoriesLoading || (hasCookie("token") && userLoading)) {
    return <SidebarCardSkeleton lines={4} />;
  }

  if (!nextJam) {
    return null;
  }

  const entrantCount = nextJam.users.length;
  const gameCount = nextJam.games.filter((game) => game.published).length;
  const musicCount = nextJam.games
    .filter((game) => game.published)
    .reduce((acc, game) => acc + (game.tracks?.length ?? 0), 0);

  return (
    <Card
      className="post-card-shadow"
      style={{
        "--post-card-shadow": `color-mix(in srgb, ${colors["crust"]} 68%, transparent)`,
      } as CSSProperties}
    >
      <Vstack>
        <Hstack>
          <Icon name="calendarplus" color="textFaded" size={iconSize} />
          <Text size={textSize}>Next Jam</Text>
          <Text size={textSize} color="blue">{nextJam.name}</Text>
        </Hstack>
        <Timer
          name="Stats.Timer"
          targetDate={new Date(nextJam.startTime)}
          size={textSize}
        />
        <Hstack>
          <Icon name="users" color="textFaded" size={iconSize} />
          <Text size={textSize}>Stats.Entrants</Text>
          <Text size={textSize} color="blue">{entrantCount}</Text>
        </Hstack>
        {gameCount !== 0 && (
          <Hstack>
            <Icon name="gamepad2" color="textFaded" size={iconSize} />
            <Text size={textSize}>Stats.Games</Text>
            <Text size={textSize} color="blue">{gameCount}</Text>
          </Hstack>
        )}
        {musicCount !== 0 && (
          <Hstack>
            <Icon name="music" color="textFaded" size={iconSize} />
            <Text size={textSize}>Music</Text>
            <Text size={textSize} color="blue">{musicCount}</Text>
          </Hstack>
        )}
        {ratings !== null && ratings !== 0 ? (
          <Hstack>
            <Icon name="star" color="textFaded" size={iconSize} />
            <Text size={textSize}>Stats.Ratings</Text>
            <Text size={textSize} color="blue">{ratings}</Text>
          </Hstack>
        ) : null}
        <Hstack wrap className="pt-2">
          {!user ? (
            <Button href="/signup" icon="login" color="green" size={buttonSize}>
              Join Jam
            </Button>
          ) : !hasJoinedNextJam ? (
            <Button
              icon="calendarplus"
              color="green"
              size={buttonSize}
              onClick={async () => {
                if (await joinJam(nextJam.id)) {
                  setJoinedOverride(true);
                  addToast({ title: "Joined jam" });
                  return;
                }

                addToast({ title: "Failed to join jam" });
              }}
            >
              Join Jam
            </Button>
          ) : hasTeamInNextJam ? (
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
      </Vstack>
    </Card>
  );
}
