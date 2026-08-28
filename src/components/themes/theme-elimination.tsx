"use client";

import {
  hasJoinedCurrentJam,
  joinJam,
} from "@/helpers/jam";
import { useCurrentJam } from "@/hooks/queries";
import { getThemes, postThemeSlaughterVote } from "@/requests/theme";
import { ThemeType } from "@/types/ThemeType";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { getCookie, hasCookie } from "@/helpers/cookie";
import { useMemo } from "react";
import { addToast, Spinner } from "bioloom-ui";
import { Card } from "bioloom-ui";
import { Button } from "bioloom-ui";
import { Icon } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import { useTheme } from "@/providers/useSiteTheme";
import { Switch } from "bioloom-ui";
import { Dropdown } from "bioloom-ui";
import {
  buildEliminationShareDraft,
  openSharedPostDraft,
} from "@/helpers/shareToPost";

export default function ThemeSlaughter() {
  const [themes, setThemes] = useState<ThemeType[]>([]);
  const { data: activeJamResponse } = useCurrentJam();
  const [phaseLoading, setPhaseLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(-1);
  const [hasJoined, setHasJoined] = useState<boolean>(false);
  const [sharingVotes, setSharingVotes] = useState(false);
  const token = getCookie("token");
  const hasLoggedInBefore = hasCookie("hasLoggedIn");
  const canVote = Boolean(token && hasJoined);
  const voteCount = themes.filter((theme) => theme.votes?.length).length;

  async function shareVotes() {
    const getThemesWithScore = (score: number) =>
      themes
        .filter((theme) => theme.votes?.[0]?.slaughterScore === score)
        .map((theme) => theme.suggestion);

    try {
      setSharingVotes(true);
      openSharedPostDraft(
        await buildEliminationShareDraft({
          jamName: activeJamResponse?.jam?.name ?? "Game jam",
          jamSlug: activeJamResponse?.jam?.slug,
          yes: getThemesWithScore(1),
          no: getThemesWithScore(-1),
          skipped: getThemesWithScore(0),
          total: themes.length,
          url: `${window.location.origin}/theme-elimination`,
        }),
      );
    } catch (error) {
      console.error("Error creating vote share image:", error);
      addToast({ title: "Could not create the vote image" });
      setSharingVotes(false);
    }
  }

  async function joinCurrentJam() {
    if (activeJamResponse?.jam?.id === undefined) return;

    if (await joinJam(activeJamResponse.jam.id)) {
      setHasJoined(true);
    }
  }

  const themeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { colors, siteTheme } = useTheme();
  const headerColor =
    siteTheme.type === "Light" ? colors["textLight"] : colors["text"];
  const headerTextColor = siteTheme.type === "Light" ? "textLight" : "text";
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
    if (!canVote) return;
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

  function VoteProgress({ themes }: { themes: ThemeType[] }) {
    const voteCounts = useMemo(() => {
      const counts = { yes: 0, no: 0, skip: 0, notVoted: 0 };

      themes.forEach((theme) => {
        const score = theme.votes?.[0]?.slaughterScore;
        if (score === 1) counts.yes++;
        else if (score === -1) counts.no++;
        else if (score === 0) counts.skip++;
        else counts.notVoted++;
      });

      return counts;
    }, [themes]);

    const total = Math.max(themes.length, 1);
    const yesPercent = voteCounts.yes / total;
    const skipPercent = voteCounts.skip / total;
    const notVotedPercent = voteCounts.notVoted / total;
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const themeNoun = (count: number) => (count === 1 ? "theme" : "themes");

    return (
      <Dropdown
        openOn="both"
        position="bottom"
        backdrop={false}
        trigger={
          <button
            type="button"
            className="inline-flex rounded-full p-0.5 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              background: "transparent",
              border: 0,
              color: colors["text"],
              cursor: "pointer",
            }}
            aria-label="Show elimination vote progress"
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 100 100"
              role="img"
              aria-label={`Vote progress: ${voteCounts.yes} yes, ${voteCounts.no} no, ${voteCounts.skip} skipped, ${voteCounts.notVoted} remaining`}
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
                strokeDasharray={`${notVotedPercent * circumference} ${
                  circumference - notVotedPercent * circumference
                }`}
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={colors["green"]}
                strokeWidth="10"
                strokeDasharray={`${yesPercent * circumference} ${
                  circumference - yesPercent * circumference
                }`}
                strokeDashoffset={-notVotedPercent * circumference}
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={colors["gray"]}
                strokeWidth="10"
                strokeDasharray={`${skipPercent * circumference} ${
                  circumference - skipPercent * circumference
                }`}
                strokeDashoffset={
                  -(notVotedPercent + yesPercent) * circumference
                }
              />
            </svg>
          </button>
        }
      >
        <div
          className="px-1 py-2"
          style={{ color: colors["textFaded"] }}
        >
          <div
            className="text-sm font-bold"
            style={{ color: colors["text"] }}
          >
            Elimination Stats
          </div>
          <div className="text-xs">
            Voted <span style={{ color: colors["green"] }}>yes</span> on{" "}
            <span style={{ color: colors["blue"] }}>{voteCounts.yes}</span>{" "}
            {themeNoun(voteCounts.yes)}{" "}
            <span style={{ color: colors["blueDark"] }}>
              ({Math.round(yesPercent * 100)}%)
            </span>
          </div>
          <div className="text-xs">
            Voted <span style={{ color: colors["red"] }}>no</span> on{" "}
            <span style={{ color: colors["blue"] }}>{voteCounts.no}</span>{" "}
            {themeNoun(voteCounts.no)}{" "}
            <span style={{ color: colors["blueDark"] }}>
              ({Math.round((voteCounts.no / total) * 100)}%)
            </span>
          </div>
          <div className="text-xs">
            Voted <span style={{ color: colors["yellow"] }}>skip</span> on{" "}
            <span style={{ color: colors["blue"] }}>{voteCounts.skip}</span>{" "}
            {themeNoun(voteCounts.skip)}{" "}
            <span style={{ color: colors["blueDark"] }}>
              ({Math.round(skipPercent * 100)}%)
            </span>
          </div>
          <div className="text-xs">
            Did not vote on{" "}
            <span style={{ color: colors["blue"] }}>
              {voteCounts.notVoted}
            </span>{" "}
            {themeNoun(voteCounts.notVoted)}{" "}
            <span style={{ color: colors["blueDark"] }}>
              ({Math.round(notVotedPercent * 100)}%)
            </span>
          </div>
        </div>
      </Dropdown>
    );
  }
  function voteNo() {
    if (!canVote) return;
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
    if (!canVote) return;
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
      if (token) {
        try {
          const joined = await hasJoinedCurrentJam();
          setHasJoined(joined);
        } catch (error) {
          console.error("Error fetching current jam:", error);
        }
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
  }, [token]);

  const scrollToIndex = (index: number) => {
    themeRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  useEffect(() => {
    if (currentTheme != -1) {
      return;
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

  function getBackgroundFromVote(vote: number) {
    switch (vote) {
      case -1:
        return colors["redDarkDark"];
      case 0:
        return colors["grayDarkDark"];
      case 1:
        return colors["greenDarkDark"];
      default:
        return colors["grayDarkDark"];
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

  const hasCurrentTheme = themes[currentTheme] !== undefined;

  return (
    <Vstack align="stretch" className="mx-auto w-full max-w-7xl gap-4">
      <header className="py-2 text-center">
        <p
          className="text-3xl font-semibold"
          style={{
            color: headerColor,
            textShadow: "0 1px 5px rgba(0, 0, 0, 0.75)",
          }}
        >
          Theme Elimination
        </p>
        <p
          className="mx-auto mt-1 max-w-2xl text-sm"
          style={{
            color: headerColor,
            opacity: 0.82,
            textShadow: "0 1px 4px rgba(0, 0, 0, 0.8)",
          }}
        >
          Help narrow the submitted themes down for the final voting round.
        </p>
      </header>

      <Hstack justify="center" wrap className="relative z-20 gap-2">
        <Hstack className="min-h-9 px-2">
          <Switch checked={descriptionShow} onChange={setDescriptionShown} />
          <Text color="text" size="sm">Show clarifications</Text>
        </Hstack>
        {canVote && (
          <Button
            icon="send"
            onClick={shareVotes}
            disabled={voteCount === 0 || sharingVotes}
          >
            {sharingVotes ? "Creating image…" : "Share votes"}
          </Button>
        )}
      </Hstack>

      <div className="relative z-30 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-1 text-center">
        <Text
          size="sm"
          color={headerTextColor}
          weight="semibold"
          style={{
            textShadow: "0 1px 4px rgba(0, 0, 0, 0.9)",
          }}
        >
          {voteCount}/{themes.length} {themes.length === 1 ? "theme" : "themes"} reviewed
        </Text>
        {canVote && <VoteProgress themes={themes} />}
      </div>

      <div
        className="sticky top-12 z-20 mx-auto w-full max-w-5xl rounded-xl border px-4 py-3"
        style={{
          backgroundColor: colors["mantle"],
          borderColor: colors["base"],
        }}
      >
        <Hstack justify="between" wrap className="gap-4">
          <Text
            color="text"
            weight="semibold"
            className="min-w-0 flex-1 truncate capitalize"
          >
            {hasCurrentTheme
              ? `${currentTheme + 1}. ${themes[currentTheme].suggestion}`
              : "Select a theme"}
          </Text>
          <Hstack wrap className="gap-2.5">
            {canVote ? (
              <>
                <Button
                  size="sm"
                  kbd="Y/A"
                  onClick={voteYes}
                  disabled={!hasCurrentTheme}
                  color="green"
                >
                  Yes
                </Button>
                <Button
                  size="sm"
                  kbd="N/D"
                  onClick={voteNo}
                  disabled={!hasCurrentTheme}
                  color="red"
                >
                  No
                </Button>
                <Button
                  size="sm"
                  kbd="S"
                  onClick={voteSkip}
                  disabled={!hasCurrentTheme}
                  color="gray"
                >
                  Skip
                </Button>
              </>
            ) : token ? (
              <Button
                size="sm"
                onClick={joinCurrentJam}
                color="green"
                icon="calendarplus"
              >
                Join Jam to vote
              </Button>
            ) : (
              <Button
                size="sm"
                href={hasLoggedInBefore ? "/login" : "/signup"}
                color="pink"
                icon="login"
              >
                {hasLoggedInBefore ? "Sign in to vote" : "Join to vote"}
              </Button>
            )}
            <Button
              size="sm"
              tooltip="Previous theme"
              icon="chevronup"
              kbd="↑"
              onClick={() => changeSelectedTheme(-1)}
              disabled={!hasCurrentTheme || currentTheme === 0}
            >
              Prev
            </Button>
            <Button
              size="sm"
              tooltip="Next theme"
              icon="chevrondown"
              kbd="↓"
              onClick={() => changeSelectedTheme(1)}
              disabled={!hasCurrentTheme || currentTheme >= themes.length - 1}
            >
              Next
            </Button>
            <Button
              size="sm"
              icon="search"
              kbd="→"
              target="_blank"
              href={`https://www.google.com/search?q=${encodeURIComponent(
                themes[currentTheme]?.suggestion ?? ""
              )}`}
              disabled={!hasCurrentTheme}
            >
              Lookup
            </Button>
          </Hstack>
        </Hstack>
      </div>

      <Vstack
        align="stretch"
        gap={3}
        className="relative z-0 min-h-80 w-full max-w-4xl self-center overflow-y-auto overscroll-contain px-1 pb-1 [max-height:calc(100dvh-20rem)] [scrollbar-gutter:stable]"
        style={{
          gap: "0.75rem",
          scrollbarColor: `${colors["base"]} transparent`,
          scrollbarWidth: "thin",
        }}
      >
        {themes.length > 0 ? (
          themes.map((theme, i) => (
            <div
              key={theme.id}
              ref={(el) => {
                themeRefs.current[i] = el;
              }}
              role="button"
              tabIndex={0}
              aria-current={i === currentTheme ? "true" : undefined}
              onClick={() => setSelectedTheme(i)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedTheme(i);
                }
              }}
              className="cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <Card
                className="w-full overflow-hidden"
                padding={0}
                style={{
                  backgroundColor:
                    i === currentTheme ? colors["base"] : colors["mantle"],
                  borderColor:
                    i === currentTheme ? colors["blue"] : colors["base"],
                }}
              >
                <Hstack
                  align="stretch"
                  justify="between"
                  gap={0}
                  className="min-h-16 w-full"
                >
                  <Hstack className="min-w-0 flex-1 gap-3 px-4 py-3">
                    <Text size="xs" color="textFaded">
                      {String(i + 1).padStart(2, "0")}
                    </Text>
                    <Vstack align="start" gap={0} className="min-w-0">
                      <Text color="text" className="capitalize">
                        {theme.suggestion}
                      </Text>
                      {theme.description && descriptionShow && (
                        <Text size="xs" color="textFaded" className="line-clamp-2">
                          {theme.description}
                        </Text>
                      )}
                    </Vstack>
                  </Hstack>
                  {theme.votes && theme.votes.length > 0 && (
                    <div
                      className="flex w-16 shrink-0 items-center justify-center text-white"
                      style={{
                        backgroundColor: getBackgroundFromVote(
                          theme.votes[0].slaughterScore,
                        ),
                      }}
                      title={getTextFromVote(theme.votes[0].slaughterScore)}
                      aria-label={`Vote: ${getTextFromVote(
                        theme.votes[0].slaughterScore,
                      )}`}
                    >
                      <Icon
                        name={getIconFromVote(theme.votes[0].slaughterScore)}
                        size={24}
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </Hstack>
              </Card>
            </div>
          ))
        ) : (
          <Text color="textFaded" className="py-8 text-center">
            No themes were found.
          </Text>
        )}
      </Vstack>
    </Vstack>
  );
}
