"use client";

import { getNextJamForHome } from "@/helpers/jamDisplay";
import { getCookie, hasCookie } from "@/helpers/cookie";
import { joinJam } from "@/helpers/jam";
import { useCurrentJam, useSelf } from "@/hooks/queries";
import { BASE_URL } from "@/requests/config";
import { addToast, Button, Card, Hstack, Icon, Text, Vstack } from "bioloom-ui";
import { useEffect, useState } from "react";
import Timer from "../timers/Timer";

export default function SidebarNextJam() {
  const { data: activeJamResponse } = useCurrentJam();
  const { data: user } = useSelf(hasCookie("token"));
  const [joinedOverride, setJoinedOverride] = useState<boolean | null>(null);
  const nextJam = getNextJamForHome(activeJamResponse);

  const hasJoinedNextJam =
    joinedOverride ??
    Boolean(user && nextJam && user.jams?.some((jam) => jam.id === nextJam.id));

  const [ratings, setRatings] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRatings() {
      if (!nextJam) {
        if (!cancelled) setRatings(null);
        return;
      }

      const ratingResponse = await fetch(`${BASE_URL}/rating-categories?always=true`);
      const ratingJson = await ratingResponse.json();
      const ratingCategories = ratingJson.data ?? [];

      const totalRatings = Math.round(
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

      if (!cancelled) {
        setRatings(totalRatings);
      }
    }

    void loadRatings();

    return () => {
      cancelled = true;
    };
  }, [nextJam]);

  if (!nextJam) {
    return null;
  }

  const entrantCount = nextJam.users.length;
  const gameCount = nextJam.games.filter((game) => game.published).length;
  const musicCount = nextJam.games
    .filter((game) => game.published)
    .reduce((acc, game) => acc + (game.tracks?.length ?? 0), 0);

  return (
    <Card>
      <Vstack>
        <Hstack>
          <Icon name="calendarplus" color="textFaded" />
          <Text>Next Jam</Text>
          <Text color="blue">{nextJam.name}</Text>
        </Hstack>
        <Timer name="Stats.Timer" targetDate={new Date(nextJam.startTime)} />
        <Hstack>
          <Icon name="users" color="textFaded" />
          <Text>Stats.Entrants</Text>
          <Text color="blue">{entrantCount}</Text>
        </Hstack>
        {gameCount !== 0 && (
          <Hstack>
            <Icon name="gamepad2" color="textFaded" />
            <Text>Stats.Games</Text>
            <Text color="blue">{gameCount}</Text>
          </Hstack>
        )}
        {musicCount !== 0 && (
          <Hstack>
            <Icon name="music" color="textFaded" />
            <Text>Music</Text>
            <Text color="blue">{musicCount}</Text>
          </Hstack>
        )}
        {ratings !== null && ratings !== 0 ? (
          <Hstack>
            <Icon name="star" color="textFaded" />
            <Text>Stats.Ratings</Text>
            <Text color="blue">{ratings}</Text>
          </Hstack>
        ) : null}
        <Hstack wrap className="pt-2">
          {!user ? (
            <Button href="/signup" icon="login" color="green">
              Join Jam
            </Button>
          ) : !hasJoinedNextJam ? (
            <Button
              icon="calendarplus"
              color="green"
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
          ) : (
            <Button href="/team-finder" icon="users" color="green">
              Team Finder
            </Button>
          )}
          <Button href="/about" icon="info">
            About
          </Button>
        </Hstack>
      </Vstack>
    </Card>
  );
}
