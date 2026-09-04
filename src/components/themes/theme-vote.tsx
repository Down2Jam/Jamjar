"use client";

import { getCookie, hasCookie } from "@/helpers/cookie";
import { hasJoinedCurrentJam, joinJam } from "@/helpers/jam";
import { useCurrentJam } from "@/hooks/queries";
import { getThemes, postThemeVotingVote } from "@/requests/theme";
import { ThemeType } from "@/types/ThemeType";
import { useTheme } from "@/providers/useSiteTheme";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import {
  addToast,
  Button,
  Card,
  Hstack,
  Icon,
  Spinner,
  Text,
  Vstack,
} from "bioloom-ui";
import {
  buildVotingShareDraft,
  openSharedPostDraft,
} from "@/helpers/shareToPost";

export default function VotingPage() {
  const [themes, setThemes] = useState<ThemeType[]>([]);
  const { data: activeJamResponse } = useCurrentJam();
  const [phaseLoading, setPhaseLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState<boolean>(false);
  const [sharingVotes, setSharingVotes] = useState(false);
  const [voteEffect, setVoteEffect] = useState<{
    themeId: number;
    score: number;
  } | null>(null);
  const token = getCookie("token");
  const hasLoggedInBefore = hasCookie("hasLoggedIn");
  const canVote = Boolean(token && hasJoined);
  const voteCount = themes.filter((theme) => theme.votes2?.length).length;
  const starCount = themes.filter(
    (theme) => theme.votes2?.[0]?.voteScore === 3,
  ).length;
  const { colors, siteTheme } = useTheme();
  const headerColor =
    siteTheme.type === "Light" ? colors["textLight"] : colors["text"];

  async function joinCurrentJam() {
    if (activeJamResponse?.jam?.id === undefined) return;

    if (await joinJam(activeJamResponse.jam.id)) {
      setHasJoined(true);
    }
  }

  async function shareVotes() {
    try {
      setSharingVotes(true);
      openSharedPostDraft(
        await buildVotingShareDraft({
          jamName: activeJamResponse?.jam?.name ?? "Game jam",
          jamSlug: activeJamResponse?.jam?.slug,
          choices: themes.map((theme) => {
            const vote = theme.votes2?.[0]?.voteScore;
            return {
              id: theme.id,
              theme: theme.suggestion,
              vote: vote === 0 || vote === 1 || vote === 3 ? vote : null,
            };
          }),
          url: `${window.location.origin}/theme-voting`,
        }),
      );
    } catch (error) {
      console.error("Error creating vote share image:", error);
      addToast({ title: "Could not create the vote image" });
      setSharingVotes(false);
    }
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
        const response = await getThemes(true);
        if (response.ok) {
          const data = await response.json();

          const votedThemes = data.data
            .filter(
              (theme: ThemeType) => theme.votes2 && theme.votes2.length > 0,
            )
            .sort(
              (a: ThemeType, b: ThemeType) =>
                (a.votes2 ? new Date(a.votes2[0].updatedAt).getTime() : 0) -
                (b.votes2 ? new Date(b.votes2[0].updatedAt).getTime() : 0),
            );

          const nonVotedThemes = data.data
            .filter(
              (theme: ThemeType) => !theme.votes2 || theme.votes2.length === 0,
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

  function voteSkip(index: number) {
    if (!canVote) return;
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
    setVoteEffect({ themeId: themes[index].id, score: 0 });

    try {
      postThemeVotingVote(themes[index].id, 0);
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  }

  function voteLike(index: number) {
    if (!canVote) return;
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
    setVoteEffect({ themeId: themes[index].id, score: 1 });

    try {
      postThemeVotingVote(themes[index].id, 1);
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  }

  function voteStar(index: number) {
    if (!canVote) return;
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
    setVoteEffect({ themeId: themes[index].id, score: 3 });

    try {
      postThemeVotingVote(themes[index].id, 3);
    } catch (error) {
      console.error("Error submitting vote:", error);
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
    <Vstack align="stretch" gap={4} className="mx-auto w-full max-w-7xl">
      <header className="flex flex-col items-center gap-3 py-2 text-center">
        <div>
          <p
            className="text-3xl font-semibold"
            style={{
              color: headerColor,
              textShadow: "0 1px 5px rgba(0, 0, 0, 0.75)",
            }}
          >
            Theme Voting
          </p>
          <p
            className="mx-auto mt-1 max-w-2xl text-sm"
            style={{
              color: headerColor,
              opacity: 0.82,
              textShadow: "0 1px 4px rgba(0, 0, 0, 0.8)",
            }}
          >
            Vote for the theme of the jam. Likes add +1 and your two stars add
            +3 each.
          </p>
        </div>

        <Hstack justify="center" wrap className="relative z-20">
          {canVote ? (
            <Button
              icon="send"
              onClick={shareVotes}
              disabled={voteCount === 0 || sharingVotes}
            >
              {sharingVotes ? "Creating image…" : "Share votes"}
            </Button>
          ) : token ? (
            <Button onClick={joinCurrentJam} color="green" icon="calendarplus">
              Join Jam to vote
            </Button>
          ) : (
            <Button
              href={hasLoggedInBefore ? "/login" : "/signup"}
              color="pink"
              icon="login"
            >
              {hasLoggedInBefore ? "Sign in to vote" : "Join to vote"}
            </Button>
          )}
        </Hstack>
      </header>

      <Vstack
        align="stretch"
        gap={3}
        className="relative z-0 min-h-80 w-full max-w-4xl self-center overflow-y-auto overscroll-contain px-1 pb-1 [max-height:calc(100dvh-15rem)] [scrollbar-gutter:stable]"
        style={{
          gap: "0.75rem",
          scrollbarColor: `${colors["base"]} transparent`,
          scrollbarWidth: "thin",
        }}
      >
        {themes.length > 0 ? (
          themes.map((theme, i) => {
            const voteScore = theme.votes2?.[0]?.voteScore;
            const isStarred = voteScore === 3;

            return (
              <Card
                className="w-full overflow-hidden"
                key={theme.id}
                padding={0}
                style={{
                  backgroundColor: colors["mantle"],
                  borderColor: colors["base"],
                }}
              >
                <Hstack
                  align="stretch"
                  justify="between"
                  gap={0}
                  className="min-h-16 w-full flex-wrap sm:flex-nowrap"
                >
                  <Hstack className="min-w-0 flex-1 gap-3 px-4 py-3">
                    <Text size="xs" color="textFaded">
                      {String(i + 1).padStart(2, "0")}
                    </Text>
                    <Text color="text" className="capitalize">
                      {theme.suggestion}
                    </Text>
                  </Hstack>
                  <Hstack
                    wrap
                    className="w-full justify-end gap-2 px-3 py-2 sm:w-auto"
                  >
                    <Button
                      size="sm"
                      style={{
                        width: "2rem",
                        height: "2rem",
                        padding: 0,
                        border: 0,
                      }}
                      tooltip="Skip"
                      disabled={!canVote}
                      onClick={() => voteSkip(i)}
                      color={voteScore === 0 ? "gray" : "default"}
                    >
                      <span
                        className={
                          voteEffect?.themeId === theme.id &&
                          voteEffect.score === 0
                            ? "post-reaction-icon--pulse inline-flex"
                            : "inline-flex"
                        }
                        onAnimationEnd={() => setVoteEffect(null)}
                      >
                        0
                      </span>
                    </Button>
                    <Button
                      size="sm"
                      style={{
                        width: "2rem",
                        height: "2rem",
                        padding: 0,
                        border: 0,
                      }}
                      tooltip="Like (+1)"
                      disabled={!canVote}
                      onClick={() => voteLike(i)}
                      color={voteScore === 1 ? "green" : "default"}
                    >
                      <span
                        className={
                          voteEffect?.themeId === theme.id &&
                          voteEffect.score === 1
                            ? "post-reaction-icon--pulse inline-flex"
                            : "inline-flex"
                        }
                        onAnimationEnd={() => setVoteEffect(null)}
                      >
                        1
                      </span>
                    </Button>
                    <Button
                      size="sm"
                      style={{
                        width: "2rem",
                        height: "2rem",
                        padding: 0,
                        border: 0,
                      }}
                      tooltip="Star (+3)"
                      leftSlot={
                        <span
                          className={
                            voteEffect?.themeId === theme.id &&
                            voteEffect.score === 3
                              ? "post-reaction-icon--pulse inline-flex"
                              : "inline-flex"
                          }
                          onAnimationEnd={() => setVoteEffect(null)}
                        >
                          <Star
                            size={16}
                            fill={isStarred ? "currentColor" : "none"}
                            aria-hidden="true"
                          />
                        </span>
                      }
                      onClick={() => voteStar(i)}
                      color={isStarred ? "yellow" : "default"}
                      disabled={!canVote || (starCount >= 2 && !isStarred)}
                    />
                  </Hstack>
                </Hstack>
              </Card>
            );
          })
        ) : (
          <Text color="textFaded" className="py-8 text-center">
            No themes were found.
          </Text>
        )}
      </Vstack>
    </Vstack>
  );
}
