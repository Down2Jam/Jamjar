"use client";

import { Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { ActiveJamResponse } from "../../helpers/jam";
import { getTheme } from "@/requests/theme";
import { JamPhase } from "@/types/JamType";
import { useTheme } from "@/providers/SiteThemeProvider";
import { Text } from "bioloom-ui";
import Link from "next/link";
import { useCurrentJam } from "@/hooks/queries";

export default function JamHeader() {
  const { data: activeJamResponse } = useCurrentJam();
  const [topTheme, setTopTheme] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const { siteTheme, colors } = useTheme();
  const POST_JAM_REFINEMENT_MS = 14 * 24 * 60 * 60 * 1000;
  const POST_JAM_RATING_MS = 14 * 24 * 60 * 60 * 1000;

  const getJamMilestones = (jam?: ActiveJamResponse["jam"] | null) => {
    if (!jam) return null;

    const start = new Date(jam.startTime).getTime();
    const themeSubmissionStart =
      start -
      jam.votingHours * 1000 * 60 * 60 -
      jam.slaughterHours * 1000 * 60 * 60 -
      jam.suggestionHours * 1000 * 60 * 60;
    const themeEliminationStart =
      start - jam.votingHours * 1000 * 60 * 60 - jam.slaughterHours * 1000 * 60 * 60;
    const themeVotingStart = start - jam.votingHours * 1000 * 60 * 60;
    const ratingStart =
      start + jam.jammingHours * 1000 * 60 * 60 + jam.submissionHours * 1000 * 60 * 60;
    const resultsStart = ratingStart + jam.ratingHours * 1000 * 60 * 60;
    const postJamRefinementStart = resultsStart;
    const postJamRatingStart = postJamRefinementStart + POST_JAM_REFINEMENT_MS;

    return {
      themeSubmissionStart,
      themeEliminationStart,
      themeVotingStart,
      jamStart: start,
      ratingStart,
      resultsStart,
      postJamRefinementStart,
      postJamRatingStart,
      postJamRefinementEnd: postJamRatingStart,
      postJamRatingEnd: postJamRatingStart + POST_JAM_RATING_MS,
    };
  };

  const getStyleForDateDisplay = (
    index: number,
    nextEventIndex: number,
    currentDate: Date,
    eventDateObj: Date | null | undefined,
  ) => {
    if (
      eventDateObj &&
      index === nextEventIndex - 1 &&
      eventDateObj < currentDate
    ) {
      return {
        backgroundColor: colors["blueDark"],
      };
    }
    if (index === nextEventIndex) {
      return {
        borderWidth: "2px",
        borderStyle: "solid",
        borderColor: colors["pinkDark"],
      };
    }
    if (index === nextEventIndex + 1) {
      return {
        borderWidth: "2px",
        borderStyle: "solid",
        borderColor: colors["magentaDark"],
      };
    }
    if (index === nextEventIndex + 2) {
      return {
        borderWidth: "2px",
        borderStyle: "solid",
        borderColor: colors["purpleDark"],
      };
    }
    if (eventDateObj && eventDateObj < currentDate) {
      return {
        borderWidth: "2px",
        borderStyle: "solid",
        borderColor: colors["base"],
        opacity: 0.2,
      };
    }
    return {
      borderWidth: "2px",
      borderStyle: "solid",
      borderColor: colors["violetDark"],
    };
  };

  const getPhaseObj = (jamPhase: JamPhase) => {
    if (jamPhase === "Suggestion")
      return {
        text: "JamHeader.Suggestions",
        href: "/theme-suggestions",
      };
    if (jamPhase === "Elimination")
      return {
        text: "JamHeader.Elimination",
        href: "/theme-elimination",
      };
    if (jamPhase === "Voting") {
      if (
        activeJamResponse &&
        activeJamResponse.jam &&
        new Date(activeJamResponse.jam.startTime).getTime() -
          new Date().getTime() <=
          60 * 60 * 1000 * 24
      )
        return {
          text: "JamHeader.JamSoon",
        };
      else
        return {
          text: "JamHeader.Voting",
          href: "/theme-voting",
        };
    }
    if (jamPhase === "Jamming")
      return {
        text: topTheme ? `Theme: ${topTheme}` : "JamHeader.NoTheme",
      };
    if (jamPhase === "Submission")
      return {
        text: "JamHeader.Submissions",
      };
    if (jamPhase === "Rating")
      return {
        text: "JamHeader.RateGames",
        href: "/games",
      };
    if (jamPhase === "Post-Jam Refinement")
      return {
        text: "Post-jam refinement in progress",
      };
    if (jamPhase === "Post-Jam Rating")
      return {
        text: "Post-jam rating in progress",
      };
    return { text: "" };
  };

  // Fetch top theme when jam is in relevant phase
  useEffect(() => {
    if (
      (activeJamResponse?.phase === "Jamming" ||
        activeJamResponse?.phase === "Submission" ||
        activeJamResponse?.phase === "Rating") &&
      activeJamResponse.jam
    ) {
      getTheme()
        .then((response) => {
          if (response.ok) return response.json();
        })
        .then((data) => {
          if (data?.data) setTopTheme(data.data.suggestion);
        })
        .catch((error) => console.error("Error fetching top themes:", error));
    }
  }, [activeJamResponse]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000 * 60);
    return () => clearInterval(timer);
  }, []);

  const events = [
    {
      name: "Phases.ThemeSubmission.Title",
      date: getJamMilestones(activeJamResponse?.jam)?.themeSubmissionStart,
    },
    {
      name: "Phases.ThemeElimination.Title",
      date: getJamMilestones(activeJamResponse?.jam)?.themeEliminationStart,
    },
    {
      name: "Phases.ThemeVoting.Title",
      date: getJamMilestones(activeJamResponse?.jam)?.themeVotingStart,
    },
    {
      name: "Phases.GameJam.Title",
      date: getJamMilestones(activeJamResponse?.jam)?.jamStart,
    },
    {
      name: "Phases.Rating.Title",
      date: getJamMilestones(activeJamResponse?.jam)?.ratingStart,
    },
    {
      name: "Phases.Results.Title",
      date: getJamMilestones(activeJamResponse?.jam)?.resultsStart,
    },
    {
      name: "Phases.PostRefinement.Title",
      date: getJamMilestones(activeJamResponse?.jam)?.postJamRefinementStart,
    },
    {
      name: "Phases.PostRating.Title",
      date: getJamMilestones(activeJamResponse?.jam)?.postJamRatingStart,
    },
  ].map((event) => ({
    ...event,
    date: event.date ? new Date(event.date) : null,
  }));

  const sortedEvents = events.map((event) => ({
    ...event,
  }));

  const milestones = getJamMilestones(activeJamResponse?.jam);
  const phaseDateRange = (() => {
    if (!activeJamResponse?.jam || !milestones) return null;

    switch (activeJamResponse.phase) {
      case "Rating":
        return {
          start: milestones.ratingStart,
          end: milestones.resultsStart,
        };
      case "Post-Jam Refinement":
        return {
          start: milestones.postJamRefinementStart,
          end: milestones.postJamRefinementEnd,
        };
      case "Post-Jam Rating":
        return {
          start: milestones.postJamRatingStart,
          end: milestones.postJamRatingEnd,
        };
      default:
        return {
          start: milestones.jamStart,
          end:
            milestones.jamStart +
            activeJamResponse.jam.jammingHours * 60 * 60 * 1000,
        };
    }
  })();

  const nextEventIndex = sortedEvents.findIndex(
    (event) => event.date && event.date >= currentDate,
  );

  // Helper function to get ordinal suffix
  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  return (
    <>
      <div
        style={{
          backgroundColor: siteTheme.colors["blueDark"],
          color: siteTheme.colors["textLight"],
        }}
        className="z-10 relative ml-4 mr-4 flex flex-col rounded-2xl overflow-hidden transition-color duration-250 shadow-2xl"
      >
        {/* Jam Header */}
        <a href="/about" className="relative">
          <div className="flex">
            <div
              style={{
                backgroundColor: siteTheme.colors["blue"],
              }}
              className="p-4 px-6 flex items-center gap-2 font-bold transition-color duration-250"
            >
              <Calendar />
              <p>
                {activeJamResponse?.jam && activeJamResponse.phase ? (
                  <span className="text-sm font-normal">
                    {activeJamResponse.jam.name} - {activeJamResponse.phase}{" "}
                    Phase
                  </span>
                ) : (
                  <span className="text-sm font-normal">(No Active Jams)</span>
                )}
              </p>
            </div>

            <div className="p-4 px-6 font-bold">
              <p>
                {activeJamResponse?.jam ? (
                  <>
                    {new Date(phaseDateRange?.start ?? activeJamResponse.jam.startTime).toLocaleDateString("en-US", {
                      month: "long",
                    })}{" "}
                    {new Date(phaseDateRange?.start ?? activeJamResponse.jam.startTime).getDate()}
                    {getOrdinalSuffix(
                      new Date(phaseDateRange?.start ?? activeJamResponse.jam.startTime).getDate(),
                    )}
                    {" - "}
                    {new Date(
                      phaseDateRange?.end ??
                        new Date(activeJamResponse.jam.startTime).getTime() +
                          activeJamResponse.jam.jammingHours * 60 * 60 * 1000,
                    ).toLocaleDateString("en-US", {
                      month: "long",
                    })}{" "}
                    {new Date(
                      phaseDateRange?.end ??
                        new Date(activeJamResponse.jam.startTime).getTime() +
                          activeJamResponse.jam.jammingHours * 60 * 60 * 1000,
                    ).getDate()}
                    {getOrdinalSuffix(
                      new Date(
                        phaseDateRange?.end ??
                          new Date(activeJamResponse.jam.startTime).getTime() +
                            activeJamResponse.jam.jammingHours * 60 * 60 * 1000,
                      ).getDate(),
                    )}
                  </>
                ) : (
                  "Dates TBA"
                )}
              </p>
            </div>
          </div>
        </a>

        {activeJamResponse &&
          activeJamResponse.jam &&
          activeJamResponse.phase != "Upcoming Jam" &&
          (activeJamResponse.phase == "Rating" ? (
            <div
              className="grid grid-cols-2"
              style={{
                backgroundColor: colors["blueDarkDark"],
              }}
            >
              <Link
                href="/games"
                className="hover:underline"
                style={{
                  color: colors["blue"],
                }}
              >
                <div className="p-4 text-center flex justify-center">
                  <Text weight="semibold">JamHeader.RateGames</Text>
                </div>
              </Link>
              <Link
                href="/music"
                className="hover:underline"
                style={{
                  color: colors["blue"],
                }}
              >
                <div className="p-4 text-center flex justify-center">
                  <Text weight="semibold">JamHeader.RateMusic</Text>
                </div>
              </Link>
            </div>
          ) : getPhaseObj(activeJamResponse.phase) &&
            getPhaseObj(activeJamResponse.phase).href ? (
            <Link
              href={getPhaseObj(activeJamResponse.phase).href || "/"}
              className="hover:underline"
              style={{
                color: colors["blue"],
              }}
            >
              <div
                className="p-4 text-center rounded-b-2x flex justify-center"
                style={{
                  backgroundColor: colors["blueDarkDark"],
                }}
              >
                <Text weight="semibold">
                  {getPhaseObj(activeJamResponse.phase).text}
                </Text>
              </div>
            </Link>
          ) : (
            <div
              className="p-4 text-center rounded-b-2x flex justify-center"
              style={{
                backgroundColor: colors["blueDarkDark"],
              }}
            >
              <Text weight="semibold">
                {getPhaseObj(activeJamResponse.phase).text}
              </Text>
            </div>
          ))}
      </div>

      <div className="flex overflow-x-scroll snap-x pb-2 gap-2 relative ml-4 mr-4 mt-3">
        {sortedEvents.map((event, index) => (
          <div
            key={event.name}
            className={`grow snap-start rounded-md p-2 text-center min-w-36 flex flex-col items-center`}
            style={{
              color: siteTheme.colors["text"],
              ...getStyleForDateDisplay(
                index,
                nextEventIndex,
                currentDate,
                event.date,
              ),
            }}
          >
            <Text
              size="xs"
              color={
                index === nextEventIndex - 1 &&
                event.date &&
                event.date < currentDate
                  ? "textLight"
                  : "text"
              }
            >
              {event.name}
            </Text>
            <Text
              weight="bold"
              color={
                index === nextEventIndex - 1 &&
                event.date &&
                event.date < currentDate
                  ? "textLight"
                  : "text"
              }
            >
              {event.date
                ?.toLocaleString("en-US", { month: "short" })
                .toUpperCase()}{" "}
              {event.date?.getDate()}
            </Text>
          </div>
        ))}
      </div>
    </>
  );
}
