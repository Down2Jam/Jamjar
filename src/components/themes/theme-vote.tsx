"use client";

import { getCookie } from "@/helpers/cookie";
import {
  ActiveJamResponse,
  getCurrentJam,
  hasJoinedCurrentJam,
  joinJam,
} from "@/helpers/jam";
import { ThemeType } from "@/types/ThemeType";
import { useEffect, useState } from "react";
import { getThemes, postThemeVotingVote } from "@/requests/theme";
import { Button } from "@/framework/Button";
import { Spinner } from "@/framework/Spinner";
import { Card } from "@/framework/Card";
import { Hstack, Vstack } from "@/framework/Stack";
import Text from "@/framework/Text";
import Icon from "@/framework/Icon";

export default function VotingPage() {
  const [themes, setThemes] = useState<ThemeType[]>([]);
  const [activeJamResponse, setActiveJam] = useState<ActiveJamResponse | null>(
    null
  );
  const [phaseLoading, setPhaseLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState<boolean>(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const activeJam = await getCurrentJam();
        setActiveJam(activeJam); // Set active jam details

        const joined = await hasJoinedCurrentJam();
        setHasJoined(joined);
      } catch (error) {
        console.error("Error fetching current jam:", error);
      }

      try {
        const response = await getThemes(true);
        if (response.ok) {
          const data = await response.json();

          const votedThemes = data.data
            .filter(
              (theme: ThemeType) => theme.votes2 && theme.votes2.length > 0
            )
            .sort(
              (a: ThemeType, b: ThemeType) =>
                (a.votes2 ? new Date(a.votes2[0].updatedAt).getTime() : 0) -
                (b.votes2 ? new Date(b.votes2[0].updatedAt).getTime() : 0)
            );

          const nonVotedThemes = data.data
            .filter(
              (theme: ThemeType) => !theme.votes2 || theme.votes2.length === 0
            )
            .sort(() => Math.random() - 0.5); // Shuffle

          setThemes([...votedThemes, ...nonVotedThemes]);
        } else {
          console.error("Error fetching themes");
        }
      } catch (error) {
        console.error("Error fetching random theme:", error);
      } finally {
        setPhaseLoading(false);
      }
    }

    fetchData();
  }, []);

  function voteSkip(index: number) {
    const newThemes = [...themes];
    newThemes[index] = {
      ...newThemes[index],
      votes2: [
        {
          voteScore: 0,
          voteRound: 1,
          id: 0,
          themeSuggestionId: newThemes[index].id,
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    setThemes(newThemes);

    try {
      postThemeVotingVote(themes[index].id, 0);
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  }

  function voteLike(index: number) {
    const newThemes = [...themes];
    newThemes[index] = {
      ...newThemes[index],
      votes2: [
        {
          voteScore: 1,
          voteRound: 1,
          id: 0,
          themeSuggestionId: newThemes[index].id,
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    setThemes(newThemes);

    try {
      postThemeVotingVote(themes[index].id, 1);
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  }

  function voteStar(index: number) {
    const newThemes = [...themes];
    newThemes[index] = {
      ...newThemes[index],
      votes2: [
        {
          voteScore: 3,
          voteRound: 1,
          id: 0,
          themeSuggestionId: newThemes[index].id,
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    setThemes(newThemes);

    try {
      postThemeVotingVote(themes[index].id, 3);
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  }

  const token = getCookie("token");

  if (phaseLoading) {
    return (
      <Vstack>
        <Card className="max-w-96">
          <Vstack>
            <Hstack>
              <Spinner />
              <Text size="xl">ThemeSuggestions.Loading.Title</Text>
            </Hstack>
            <Text color="textFaded">ThemeSuggestions.Loading.Description</Text>
          </Vstack>
        </Card>
      </Vstack>
    );
  }

  if (!token) {
    return (
      <Vstack>
        <Card className="max-w-96">
          <Vstack>
            <Vstack gap={0}>
              <Hstack>
                <Icon name="userx" />
                <Text size="xl">Not signed in</Text>
              </Hstack>
              <Text color="textFaded">
                Sign in to be able to eliminate themes
              </Text>
            </Vstack>
            <Hstack>
              <Button href="/signup" color="blue" icon="userplus">
                Themes.Signup
              </Button>
              <Button href="/login" color="pink" icon="login">
                Themes.Login
              </Button>
            </Hstack>
          </Vstack>
        </Card>
      </Vstack>
    );
  }

  if (!hasJoined) {
    return (
      <Vstack>
        <Card>
          <Vstack>
            <Vstack gap={0}>
              <Hstack>
                <Icon name="userplus" />
                <Text size="xl">Join the Jam First</Text>
              </Hstack>
              <Text color="textFaded">
                You need to join the current jam before you can vote for themes.
              </Text>
            </Vstack>
            <Button
              onClick={async () => {
                if (activeJamResponse?.jam?.id !== undefined) {
                  const ok = await joinJam(activeJamResponse.jam.id);

                  if (ok) {
                    setHasJoined(true);
                  }
                }
              }}
              icon="calendarplus"
              color="green"
            >
              Navbar.JoinJam.Title
            </Button>
          </Vstack>
        </Card>
      </Vstack>
    );
  }

  if (activeJamResponse?.phase !== "Voting") {
    return (
      <Vstack>
        <Card className="max-w-96">
          <Vstack>
            <Vstack gap={0}>
              <Hstack>
                <Icon name="x" />
                <Text size="xl">Not in Theme Voting Phase</Text>
              </Hstack>
              <Text color="textFaded">
                The current phase is{" "}
                <strong>{activeJamResponse?.phase || "Unknown"}</strong>. Please
                come back during the Theme Voting phase.
              </Text>
            </Vstack>
          </Vstack>
        </Card>
      </Vstack>
    );
  }

  if (
    activeJamResponse &&
    activeJamResponse.jam &&
    new Date(activeJamResponse.jam.startTime).getTime() -
      new Date().getTime() <=
      60 * 60 * 1000 * 24
  ) {
    return (
      <Vstack>
        <Card className="max-w-96">
          <Vstack>
            <Vstack gap={0}>
              <Hstack>
                <Icon name="x" />
                <Text size="xl">Not in Theme Voting Phase</Text>
              </Hstack>
              <Text color="textFaded">
                Theme will be revealed on jam start.
              </Text>
            </Vstack>
          </Vstack>
        </Card>
      </Vstack>
    );
  }

  return (
    <Vstack align="stretch">
      <Vstack>
        <Card>
          <Vstack align="center" gap={0}>
            <Hstack>
              <Icon name="vote" />
              <Text size="xl">Theme Voting</Text>
            </Hstack>
            <Text color="textFaded" size="sm">
              Vote for the theme of the game jam.
            </Text>
          </Vstack>
        </Card>
        <Card>
          <Text color="textFaded" size="sm">
            Welcome to the Theme Voting! You can vote on the top 15 themes from
            the theme elimination round to show which ones you enjoy. The top
            voted theme after taking into account everybody&apos;s votes will be
            the theme of the jam.
          </Text>
          <Text color="textFaded" size="sm">
            You can vote on as many themes as you want. Likes add +1 to the
            theme&apos;s score while stars (that you can give 2 of) give +3 to a
            theme&apos;s score.
          </Text>
        </Card>
      </Vstack>

      <div className="py-4">
        <Vstack align="stretch">
          {themes ? (
            themes.map((theme, i) => (
              <Card
                className={`border border-transparent w-full`}
                key={theme.id}
              >
                <Hstack justify="between">
                  <Hstack>
                    <Text size="xs" color="textFaded">
                      {String(i + 1).padStart(2, "0")}
                    </Text>{" "}
                    <Text color="text" className="capitalize">
                      {theme.suggestion}
                    </Text>
                  </Hstack>
                  <div className="items-center flex gap-3">
                    <Button
                      size="sm"
                      tooltip="Skip"
                      onClick={() => {
                        voteSkip(i);
                      }}
                      color={
                        themes[i].votes2 &&
                        themes[i].votes2.length > 0 &&
                        themes[i].votes2[0].voteScore == 0
                          ? "gray"
                          : "default"
                      }
                    >
                      0
                    </Button>
                    <Button
                      size="sm"
                      tooltip="Like (+1)"
                      onClick={() => {
                        voteLike(i);
                      }}
                      color={
                        themes[i].votes2 &&
                        themes[i].votes2.length > 0 &&
                        themes[i].votes2[0].voteScore == 1
                          ? "green"
                          : "default"
                      }
                    >
                      1
                    </Button>
                    <Button
                      color={
                        themes[i].votes2 &&
                        themes[i].votes2.length > 0 &&
                        themes[i].votes2[0].voteScore == 3
                          ? "yellow"
                          : "default"
                      }
                      tooltip="Star (+3)"
                      icon="star"
                      onClick={() => {
                        voteStar(i);
                      }}
                      disabled={
                        themes.reduce(
                          (prev, curr) =>
                            prev +
                            (curr.votes2 &&
                            curr.votes2.length > 0 &&
                            curr.votes2[0].voteScore == 3
                              ? 1
                              : 0),
                          0
                        ) >= 2 &&
                        !(
                          themes[i].votes2 &&
                          themes[i].votes2.length > 0 &&
                          themes[i].votes2[0].voteScore == 3
                        )
                      }
                    />
                  </div>
                </Hstack>
              </Card>
            ))
          ) : (
            <>No themes were found</>
          )}
        </Vstack>
      </div>
    </Vstack>
  );
}
