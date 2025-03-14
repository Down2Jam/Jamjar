"use client";

import {
  ActiveJamResponse,
  getCurrentJam,
  hasJoinedCurrentJam,
  joinJam,
} from "@/helpers/jam";
import { getThemes, postThemeSlaughterVote } from "@/requests/theme";
import { ThemeType } from "@/types/ThemeType";
import { Card, CardBody, Chip, Spinner, Tooltip } from "@nextui-org/react";
import { Check, SkipForward, Vote, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ButtonAction from "../link-components/ButtonAction";
import { useHotkeys } from "react-hotkeys-hook";
import { getCookie } from "@/helpers/cookie";
import { useMemo } from "react";

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
    <Tooltip
      content={
        <div className="px-1 py-2 text-[#333] dark:text-white">
          <div className="text-small font-bold">Elimination Stats</div>
          <div className="text-tiny">
            Voted <span className="text-[#2dcf50]">yes</span> on{" "}
            <span className="text-[#3498db]">{voteCounts.amount.yes}</span>{" "}
            themes{" "}
            <span className="text-[#3252bd]">
              ({Math.round(voteCounts.percent.yes)}%)
            </span>
          </div>
          <div className="text-tiny">
            Voted <span className="text-[#cc2936]">no</span> on{" "}
            <span className="text-[#3498db]">{voteCounts.amount.no}</span>{" "}
            themes{" "}
            <span className="text-[#3252bd]">
              ({Math.round(voteCounts.percent.no)}%)
            </span>
          </div>
          <div className="text-tiny">
            Voted <span className="text-[#8c8c8c]">skip</span> on{" "}
            <span className="text-[#3498db]">{voteCounts.amount.skip}</span>{" "}
            themes{" "}
            <span className="text-[#3252bd]">
              ({Math.round(voteCounts.percent.skip)}%)
            </span>
          </div>
          <div className="text-tiny">
            Did not vote on{" "}
            <span className="text-[#3498db]">{voteCounts.amount.notVoted}</span>{" "}
            themes{" "}
            <span className="text-[#3252bd]">
              ({Math.round(voteCounts.percent.notVoted)}%)
            </span>
          </div>
        </div>
      }
    >
      <svg width={circleSize} height={circleSize} viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#cc2936"
          strokeWidth="10"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#3498db"
          strokeWidth="10"
          strokeDasharray={`${
            (voteCounts.percent.notVoted / 100) * circumference
          } ${
            circumference - (voteCounts.percent.notVoted / 100) * circumference
          }`}
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#2dcf50"
          strokeWidth="10"
          strokeDasharray={`${(voteCounts.percent.yes / 100) * circumference} ${
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
          stroke="#8c8c8c"
          strokeWidth="10"
          strokeDasharray={`${
            (voteCounts.percent.skip / 100) * circumference
          } ${circumference - (voteCounts.percent.skip / 100) * circumference}`}
          strokeDashoffset={
            -(voteCounts.percent.yes / 100) * circumference -
            (voteCounts.percent.notVoted / 100) * circumference
          }
        />
      </svg>
    </Tooltip>
  );
}

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

  function voteYes() {
    if (currentTheme >= themes.length) return;
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

  function voteNo() {
    if (currentTheme >= themes.length) return;
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
        return <X size={16} className="ml-1" />;
      case 0:
        return <SkipForward size={16} className="ml-1" />;
      case 1:
        return <Check size={16} className="ml-1" />;
    }
  }

  const token = getCookie("token");

  if (phaseLoading) {
    return (
      <div className="text-[#333] dark:text-white flex items-center flex-col gap-4 py-20">
        <p>Loading</p>
        <Spinner />
      </div>
    );
  } else if (!token) {
    return (
      <div className="text-[#333] dark:text-white">
        Sign in to be able to eliminate themes
      </div>
    );
  } else if (!hasJoined) {
    return (
      <div className="p-6 bg-gray-100 dark:bg-gray-800 min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Join the Jam First
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          You need to join the current jam before you can eliminate themes.
        </p>
        <button
          onClick={() => {
            if (activeJamResponse?.jam?.id !== undefined) {
              joinJam(activeJamResponse.jam.id);
            }
          }}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Join Jam
        </button>
      </div>
    );
  } else if (activeJamResponse?.phase !== "Elimination") {
    return (
      <div className="p-6 bg-gray-100 dark:bg-gray-800 min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Not in Theme Elimination Phase
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          The current phase is{" "}
          <strong>{activeJamResponse?.phase || "Unknown"}</strong>. Please come
          back during the Theme Elimination phase.
        </p>
      </div>
    );
  } else {
    return (
      <div className="text-[#333] dark:text-white flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Vote />
          <p className="text-2xl">Theme Elimination</p>
        </div>
        <p>
          Welcome to the Theme Elimination! This is a spot to say which
          submitted themes you like or dislike before they go to the voting
          rounds.
        </p>
        <p>
          You can vote on as many themes as you want and the themes with the
          most score (Positive votes - Negative Votes) will move to the voting
          rounds.
        </p>

        <div className="flex gap-2 items-center flex-wrap">
          <Card className="min-w-60 min-h-12">
            <CardBody className="items-center">
              <p>{themes[currentTheme]?.suggestion}</p>
            </CardBody>
          </Card>
          <ButtonAction
            name="Yes"
            kbd="Y/A"
            onPress={voteYes}
            isDisabled={currentTheme >= themes.length}
          />
          <ButtonAction
            name="No"
            kbd="N/D"
            onPress={voteNo}
            isDisabled={currentTheme >= themes.length}
          />
          <ButtonAction
            name="Skip"
            kbd="S"
            onPress={voteSkip}
            isDisabled={currentTheme >= themes.length}
          />
          <VoteCircle themes={themes} />
        </div>

        <div
          className=" max-h-[600px] overflow-y-auto p-4"
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
                      i === currentTheme
                        ? "border-2 border-blue-500 shadow-lg"
                        : "border border-transparent"
                    } w-full`}
                  >
                    <CardBody>
                      <div className="flex justify-between">
                        <p>{theme.suggestion}</p>
                        {theme.votes && theme.votes.length > 0 && (
                          <Chip
                            className="items-center"
                            startContent={getIconFromVote(
                              theme.votes[0].slaughterScore
                            )}
                            style={getStyleFromVote(
                              theme.votes[0].slaughterScore
                            )}
                          >
                            {getTextFromVote(theme.votes[0].slaughterScore)}
                          </Chip>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                </div>
              ))
            ) : (
              <>No themes were found</>
            )}
          </div>
        </div>
      </div>
    );
  }
}
