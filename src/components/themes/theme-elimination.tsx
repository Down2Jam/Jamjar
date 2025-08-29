"use client";

import {
  ActiveJamResponse,
  getCurrentJam,
  hasJoinedCurrentJam,
  joinJam,
} from "@/helpers/jam";
import { getThemes, postThemeSlaughterVote } from "@/requests/theme";
import { ThemeType } from "@/types/ThemeType";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { getCookie } from "@/helpers/cookie";
import { useMemo } from "react";
import { Spinner } from "@/framework/Spinner";
import { Card } from "@/framework/Card";
import { Chip } from "@/framework/Chip";
import { Button } from "@/framework/Button";
import Icon from "@/framework/Icon";
import Text from "@/framework/Text";
import { Hstack, Vstack } from "@/framework/Stack";
import { useTheme } from "@/providers/SiteThemeProvider";
import { Switch } from "@/framework/Switch";
import Dropdown from "@/framework/Dropdown";

export default function ThemeSlaughter() {
  const [themes, setThemes] = useState<ThemeType[]>([]);
  const [activeJamResponse, setActiveJam] = useState<ActiveJamResponse | null>(
    null
  );
  const [phaseLoading, setPhaseLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(-1);
  const [hasJoined, setHasJoined] = useState<boolean>(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const themeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { colors } = useTheme();
  const [descriptionShow, setDescriptionShown] = useState(true);

  useHotkeys("y", voteYes);
  useHotkeys("n", voteNo);
  useHotkeys("a", voteYes);
  useHotkeys("d", voteNo);
  useHotkeys("s", voteSkip);
  useHotkeys("ArrowUp", (event) => {
    event.preventDefault();
    changeSelectedTheme(-1);
  });

  useHotkeys("ArrowDown", (event) => {
    event.preventDefault();
    changeSelectedTheme(1);
  });
  useHotkeys("ArrowRight", (event) => {
    event.preventDefault();
    if (themes[currentTheme] === undefined) return;
    window.open(
      `https://www.google.com/search?q=${encodeURIComponent(
        themes[currentTheme]?.suggestion
      )}`,
      "_blank"
    );
  });

  function voteYes() {
    if (currentTheme >= themes.length) return;
    if (themes[currentTheme] === undefined) return;
    const newThemes = [...themes];
    newThemes[currentTheme] = {
      ...newThemes[currentTheme],
      votes: [
        {
          slaughterScore: 1,
          id: 0,
          themeSuggestionId: newThemes[currentTheme].id,
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    setThemes(newThemes);
    changeSelectedTheme(1);

    try {
      postThemeSlaughterVote(themes[currentTheme].id, 1);
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  }

  function VoteCircle({ themes }: { themes: ThemeType[] }) {
    const voteCounts = useMemo(() => {
      let yes = 0,
        no = 0,
        skip = 0,
        notVoted = 0;

      themes.forEach((theme) => {
        if (!theme.votes || theme.votes.length === 0) {
          notVoted++;
        } else {
          switch (theme.votes[0].slaughterScore) {
            case 1:
              yes++;
              break;
            case -1:
              no++;
              break;
            case 0:
              skip++;
              break;
          }
        }
      });

      const total = yes + no + skip + notVoted || 1; // Prevent division by zero
      return {
        amount: {
          yes,
          no,
          skip,
          notVoted,
        },
        percent: {
          yes: (yes / total) * 100,
          no: (no / total) * 100,
          skip: (skip / total) * 100,
          notVoted: (notVoted / total) * 100,
        },
      };
    }, [themes]);

    const circleSize = 30;
    const radius = 45;
    const circumference = 2 * Math.PI * radius;

    return (
      <Dropdown
        openOn="hover"
        trigger={
          <svg
            width={circleSize}
            height={circleSize}
            viewBox="0 0 100 100"
            className="hidden lg:block"
          >
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={colors["red"]}
              strokeWidth="10"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={colors["blue"]}
              strokeWidth="10"
              strokeDasharray={`${
                (voteCounts.percent.notVoted / 100) * circumference
              } ${
                circumference -
                (voteCounts.percent.notVoted / 100) * circumference
              }`}
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={colors["green"]}
              strokeWidth="10"
              strokeDasharray={`${
                (voteCounts.percent.yes / 100) * circumference
              } ${
                circumference - (voteCounts.percent.yes / 100) * circumference
              }`}
              strokeDashoffset={
                -(voteCounts.percent.notVoted / 100) * circumference
              }
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={colors["gray"]}
              strokeWidth="10"
              strokeDasharray={`${
                (voteCounts.percent.skip / 100) * circumference
              } ${
                circumference - (voteCounts.percent.skip / 100) * circumference
              }`}
              strokeDashoffset={
                -(voteCounts.percent.yes / 100) * circumference -
                (voteCounts.percent.notVoted / 100) * circumference
              }
            />
          </svg>
        }
      >
        <div
          className="px-1 py-2"
          style={{
            color: colors["textFaded"],
            backgroundColor: colors["mantle"],
          }}
        >
          <div
            className="text-small font-bold"
            style={{
              color: colors["text"],
            }}
          >
            Elimination Stats
          </div>
          <div className="text-tiny">
            Voted{" "}
            <span
              style={{
                color: colors["green"],
              }}
            >
              yes
            </span>{" "}
            on{" "}
            <span
              style={{
                color: colors["blue"],
              }}
            >
              {voteCounts.amount.yes}
            </span>{" "}
            themes{" "}
            <span
              style={{
                color: colors["blueDark"],
              }}
            >
              ({Math.round(voteCounts.percent.yes)}%)
            </span>
          </div>
          <div className="text-tiny">
            Voted{" "}
            <span
              style={{
                color: colors["red"],
              }}
            >
              no
            </span>{" "}
            on{" "}
            <span
              style={{
                color: colors["blue"],
              }}
            >
              {voteCounts.amount.no}
            </span>{" "}
            themes{" "}
            <span
              style={{
                color: colors["blueDark"],
              }}
            >
              ({Math.round(voteCounts.percent.no)}%)
            </span>
          </div>
          <div className="text-tiny">
            Voted{" "}
            <span
              style={{
                color: colors["yellow"],
              }}
            >
              skip
            </span>{" "}
            on{" "}
            <span
              style={{
                color: colors["blue"],
              }}
            >
              {voteCounts.amount.skip}
            </span>{" "}
            themes{" "}
            <span
              style={{
                color: colors["blueDark"],
              }}
            >
              ({Math.round(voteCounts.percent.skip)}%)
            </span>
          </div>
          <div className="text-tiny">
            Did not vote on{" "}
            <span
              style={{
                color: colors["blue"],
              }}
            >
              {voteCounts.amount.notVoted}
            </span>{" "}
            themes{" "}
            <span
              style={{
                color: colors["blueDark"],
              }}
            >
              ({Math.round(voteCounts.percent.notVoted)}%)
            </span>
          </div>
        </div>
      </Dropdown>
    );
  }

  function voteNo() {
    if (currentTheme >= themes.length) return;
    if (themes[currentTheme] === undefined) return;
    const newThemes = [...themes];
    newThemes[currentTheme] = {
      ...newThemes[currentTheme],
      votes: [
        {
          slaughterScore: -1,
          id: 0,
          themeSuggestionId: newThemes[currentTheme].id,
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    setThemes(newThemes);
    changeSelectedTheme(1);

    try {
      postThemeSlaughterVote(themes[currentTheme].id, -1);
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  }

  function voteSkip() {
    if (currentTheme >= themes.length) return;
    if (themes[currentTheme] === undefined) return;
    const newThemes = [...themes];
    newThemes[currentTheme] = {
      ...newThemes[currentTheme],
      votes: [
        {
          slaughterScore: 0,
          id: 0,
          themeSuggestionId: newThemes[currentTheme].id,
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    setThemes(newThemes);
    changeSelectedTheme(1);

    try {
      postThemeSlaughterVote(themes[currentTheme].id, 0);
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  }

  function changeSelectedTheme(direction: number) {
    const newIndex = Math.min(
      Math.max(currentTheme + direction, 0),
      themes.length
    );
    setSelectedTheme(newIndex);
  }

  function setSelectedTheme(index: number) {
    setCurrentTheme(index);
    scrollToIndex(index - 1);
  }

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
        const response = await getThemes();
        if (response.ok) {
          const data = await response.json();

          const votedThemes = data.data
            .filter((theme: ThemeType) => theme.votes && theme.votes.length > 0)
            .sort(
              (a: ThemeType, b: ThemeType) =>
                (a.votes ? new Date(a.votes[0].updatedAt).getTime() : 0) -
                (b.votes ? new Date(b.votes[0].updatedAt).getTime() : 0)
            );

          const nonVotedThemes = data.data
            .filter(
              (theme: ThemeType) => !theme.votes || theme.votes.length === 0
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

  const scrollToIndex = (index: number) => {
    if (themeRefs.current[index] && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top:
          themeRefs.current[index]!.offsetTop -
          scrollContainerRef.current.offsetTop,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    if (currentTheme != -1) {
      return;
    }

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }

    const firstUnvotedIndex = themes.findIndex(
      (theme) => !theme.votes || theme.votes.length === 0
    );

    if (firstUnvotedIndex !== -1) {
      if (firstUnvotedIndex > 0) {
        scrollToIndex(firstUnvotedIndex - 1);
      }
    }

    setCurrentTheme(firstUnvotedIndex);
  }, [themes, currentTheme]);

  function getTextFromVote(vote: number) {
    switch (vote) {
      case -1:
        return "No";
      case 0:
        return "Skip";
      case 1:
        return "Yes";
    }
  }

  function getStyleFromVote(vote: number) {
    switch (vote) {
      case -1:
        return {
          background: "linear-gradient(to bottom right, #942e2e, #cc7529)",
          border: "1px solid #942e2e",
        };
      case 0:
        return {
          background: "linear-gradient(to bottom right, #737373, #8c8c8c)",
          border: "1px solid #737373",
        };
      case 1:
        return {
          background: "linear-gradient(to bottom right, #2e947a, #2dcf50)",
          border: "1px solid #2e947a",
        };
    }
  }

  function getIconFromVote(vote: number) {
    switch (vote) {
      case -1:
        return "x";
      case 0:
        return "skipforward";
      case 1:
        return "check";
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
                You need to join the current jam before you can eliminate
                themes.
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

  if (activeJamResponse?.phase !== "Elimination") {
    return (
      <Vstack>
        <Card className="max-w-96">
          <Vstack>
            <Vstack gap={0}>
              <Hstack>
                <Icon name="x" />
                <Text size="xl">Not in Theme Elimination Phase</Text>
              </Hstack>
              <Text color="textFaded">
                The current phase is{" "}
                <strong>{activeJamResponse?.phase || "Unknown"}</strong>. Please
                come back during the Theme Elimination phase.
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
              <Icon name="swords" />
              <Text size="xl">Theme Elimination</Text>
            </Hstack>
            <Text color="textFaded" size="sm">
              Vote as much as you want on whether you like or dislike certain
              themes.
            </Text>
          </Vstack>
        </Card>
        <Card>
          <Text color="textFaded" size="sm">
            Welcome to the Theme Elimination! This is a spot to say which
            submitted themes you like or dislike before they go to the voting
            rounds.
          </Text>
          <Text color="textFaded" size="sm">
            You can vote on as many themes as you want and the themes with the
            most score (Positive votes - Negative Votes) will move to the voting
            rounds.
          </Text>
        </Card>
        <Card>
          <Hstack>
            <Switch checked={descriptionShow} onChange={setDescriptionShown} />
            <Vstack gap={0} align="start">
              <Text color="text" size="sm">
                Show Clarifications
              </Text>
              <Text color="textFaded" size="xs">
                Show clarification text people have entered for their theme if
                available
              </Text>
            </Vstack>
          </Hstack>
        </Card>
      </Vstack>
      <Card>
        <Hstack wrap>
          <Card className="min-h-12 min-w-60">
            <Hstack>
              <Text color="text" className="capitalize min-h-6">
                {themes[currentTheme]?.suggestion}
              </Text>
              {themes[currentTheme]?.votes &&
                themes[currentTheme].votes.length > 0 && (
                  <Chip
                    className="items-center lg:hidden"
                    style={getStyleFromVote(
                      themes[currentTheme].votes[0].slaughterScore
                    )}
                    icon={getIconFromVote(
                      themes[currentTheme].votes[0].slaughterScore
                    )}
                  >
                    <Text size="sm">
                      {getTextFromVote(
                        themes[currentTheme].votes[0].slaughterScore
                      )}
                    </Text>
                  </Chip>
                )}
            </Hstack>
            <Text
              color="textFaded"
              size="xs"
              className="capitalize block lg:hidden min-h-32"
            >
              {themes[currentTheme]?.description}
            </Text>
          </Card>
          <Hstack wrap>
            <Button
              kbd="Y/A"
              onClick={voteYes}
              disabled={
                currentTheme >= themes.length ||
                themes[currentTheme] === undefined
              }
              color="green"
            >
              Yes
            </Button>
            <Button
              kbd="N/D"
              onClick={voteNo}
              disabled={
                currentTheme >= themes.length ||
                themes[currentTheme] === undefined
              }
              color="red"
            >
              No
            </Button>
            <Button
              kbd="S"
              onClick={voteSkip}
              disabled={
                currentTheme >= themes.length ||
                themes[currentTheme] === undefined
              }
              color="gray"
            >
              Skip
            </Button>
            <Button
              kbd="↑"
              onClick={() => {
                changeSelectedTheme(-1);
              }}
            >
              Prev
            </Button>
            <Button
              kbd="↓"
              onClick={() => {
                changeSelectedTheme(1);
              }}
            >
              Next
            </Button>
            <Button
              icon="search"
              target="_blank"
              href={`https://www.google.com/search?q=${encodeURIComponent(
                themes[currentTheme]?.suggestion
              )}`}
              disabled={themes[currentTheme] === undefined}
              kbd="→"
            >
              Lookup
            </Button>
          </Hstack>
          <VoteCircle themes={themes} />
        </Hstack>
        <div
          className="overflow-y-auto p-4 min-h-[100px] max-h-[calc(100vh-410px)] hidden lg:block"
          ref={scrollContainerRef}
        >
          <div className="flex flex-col gap-4">
            {themes ? (
              themes.map((theme, i) => (
                <div
                  key={theme.id}
                  ref={(el) => {
                    themeRefs.current[i] = el;
                  }}
                  onClick={() => {
                    setSelectedTheme(i);
                  }}
                  className="cursor-pointer"
                >
                  <Card
                    className={`${
                      theme.votes && theme.votes.length > 0 ? "opacity-50" : ""
                    } ${
                      i === currentTheme ? "border-2 shadow-lg" : "t"
                    } w-full`}
                    style={{
                      backgroundColor:
                        i === currentTheme ? colors["base"] : colors["mantle"],
                    }}
                  >
                    <Hstack justify="between">
                      <Vstack align="start">
                        <Text color="text" className="capitalize">
                          {theme.suggestion}
                        </Text>
                        {theme.description && descriptionShow && (
                          <Text size="xs" color="textFaded">
                            {theme.description}
                          </Text>
                        )}
                      </Vstack>
                      {theme.votes && theme.votes.length > 0 && (
                        <Chip
                          className="items-center"
                          style={getStyleFromVote(
                            theme.votes[0].slaughterScore
                          )}
                          icon={getIconFromVote(theme.votes[0].slaughterScore)}
                        >
                          <Text size="sm">
                            {getTextFromVote(theme.votes[0].slaughterScore)}
                          </Text>
                        </Chip>
                      )}
                    </Hstack>
                  </Card>
                </div>
              ))
            ) : (
              <>No themes were found</>
            )}
          </div>
        </div>
      </Card>
    </Vstack>
  );
}
