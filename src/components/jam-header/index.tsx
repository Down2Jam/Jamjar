"use client";

import { Calendar } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ActiveJamResponse } from "../../helpers/jam";
import { getTheme } from "@/requests/theme";
import { JamPhase } from "@/types/JamType";
import { useTheme } from "@/providers/useSiteTheme";
import { Text } from "bioloom-ui";
import Link from "@/compat/next-link";
import { useCurrentJam } from "@/hooks/queries";
import { Skeleton } from "@/components/skeletons";

export default function JamHeader() {
  const { data: activeJamResponse, isLoading } = useCurrentJam();
  const displayJam = activeJamResponse?.jam ?? null;
  const [topTheme, setTopTheme] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const timelineRef = useRef<HTMLDivElement>(null);
  const activeEventRef = useRef<HTMLLIElement>(null);
  const { siteTheme, colors } = useTheme();

  const getJamMilestones = (jam?: ActiveJamResponse["jam"] | null) => {
    if (!jam) return null;

    const start = new Date(jam.startTime).getTime();
    const postJamRefinementMs =
      (jam.postJamRefinementHours ?? 14 * 24) * 60 * 60 * 1000;
    const postJamRatingMs =
      (jam.postJamRatingHours ?? 14 * 24) * 60 * 60 * 1000;
    const themeSubmissionStart =
      start -
      jam.votingHours * 1000 * 60 * 60 -
      jam.slaughterHours * 1000 * 60 * 60 -
      jam.suggestionHours * 1000 * 60 * 60;
    const themeEliminationStart =
      start -
      jam.votingHours * 1000 * 60 * 60 -
      jam.slaughterHours * 1000 * 60 * 60;
    const themeVotingStart = start - jam.votingHours * 1000 * 60 * 60;
    const ratingStart =
      start +
      jam.jammingHours * 1000 * 60 * 60 +
      jam.submissionHours * 1000 * 60 * 60;
    const resultsStart = ratingStart + jam.ratingHours * 1000 * 60 * 60;
    const postJamRefinementStart = resultsStart;
    const postJamRatingStart = postJamRefinementStart + postJamRefinementMs;

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
      postJamRatingEnd: postJamRatingStart + postJamRatingMs,
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
        text: "Post-jam refinement in progress. Update your entries!",
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
      date: getJamMilestones(displayJam)?.themeSubmissionStart,
    },
    {
      name: "Phases.ThemeElimination.Title",
      date: getJamMilestones(displayJam)?.themeEliminationStart,
    },
    {
      name: "Phases.ThemeVoting.Title",
      date: getJamMilestones(displayJam)?.themeVotingStart,
    },
    {
      name: "Phases.GameJam.Title",
      date: getJamMilestones(displayJam)?.jamStart,
    },
    {
      name: "Phases.Rating.Title",
      date: getJamMilestones(displayJam)?.ratingStart,
    },
    {
      name: "Phases.Results.Title",
      date: getJamMilestones(displayJam)?.resultsStart,
    },
    {
      name: "Phases.PostRefinement.Title",
      date: getJamMilestones(displayJam)?.postJamRefinementStart,
    },
    {
      name: "Phases.PostRating.Title",
      date: getJamMilestones(displayJam)?.postJamRatingStart,
    },
  ].map((event) => ({
    ...event,
    date: event.date ? new Date(event.date) : null,
  }));

  const sortedEvents = events.map((event) => ({
    ...event,
  }));

  const milestones = getJamMilestones(displayJam);
  const phaseDateRange = (() => {
    if (!displayJam || !milestones) return null;

    switch (activeJamResponse?.phase) {
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
          end: milestones.jamStart + displayJam.jammingHours * 60 * 60 * 1000,
        };
    }
  })();

  const nextEventIndex = sortedEvents.findIndex(
    (event) => event.date && event.date >= currentDate,
  );
  const effectiveNextEventIndex =
    nextEventIndex === -1 ? sortedEvents.length : nextEventIndex;
  const activeEventIndex =
    effectiveNextEventIndex > 0
      ? Math.min(effectiveNextEventIndex - 1, sortedEvents.length - 1)
      : -1;

  useEffect(() => {
    const timeline = timelineRef.current;
    const activeEvent = activeEventRef.current;

    if (!timeline || !activeEvent) return;

    const timelineRect = timeline.getBoundingClientRect();
    const activeEventRect = activeEvent.getBoundingClientRect();
    timeline.scrollLeft += activeEventRect.left - timelineRect.left;
  }, [activeEventIndex]);

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

  const formatDate = (date: Date, includeMonth = true) =>
    `${includeMonth ? `${date.toLocaleDateString("en-US", { month: "long" })} ` : ""}${date.getDate()}${getOrdinalSuffix(date.getDate())}`;

  if (isLoading) {
    return (
      <>
        <div className="relative z-10 mx-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] shadow-2xl sm:mx-4">
          <div className="flex">
            <div className="flex items-center gap-2 bg-white/10 p-4 px-6">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-5 w-56" />
            </div>
            <div className="p-4 px-6">
              <Skeleton className="h-5 w-64" />
            </div>
          </div>
          <div className="bg-black/20 p-4">
            <Skeleton className="mx-auto h-5 w-72" />
          </div>
        </div>
        <div className="relative mx-0 mt-3 flex gap-2 overflow-hidden pb-2 sm:mx-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[60px] min-w-36 grow rounded-md" />
          ))}
        </div>
      </>
    );
  }

  const currentPhase = activeJamResponse?.phase
    ? getPhaseObj(activeJamResponse.phase)
    : null;
  const phaseStartDate = displayJam
    ? new Date(phaseDateRange?.start ?? displayJam.startTime)
    : null;
  const phaseEndDate = displayJam
    ? new Date(
        phaseDateRange?.end ??
          new Date(displayJam.startTime).getTime() +
            displayJam.jammingHours * 60 * 60 * 1000,
      )
    : null;
  const compactDateRange =
    phaseStartDate && phaseEndDate
      ? phaseStartDate.getMonth() === phaseEndDate.getMonth()
        ? `${formatDate(phaseStartDate)} - ${formatDate(phaseEndDate, false)}`
        : `${formatDate(phaseStartDate)} - ${formatDate(phaseEndDate)}`
      : "Dates TBA";

  return (
    <>
      <div
        style={{
          backgroundColor: siteTheme.colors["blueDark"],
          color: siteTheme.colors["textLight"],
        }}
        className="relative z-10 mx-0 flex flex-col overflow-hidden rounded-xl shadow-2xl transition-color duration-250 sm:mx-4"
      >
        {/* Jam Header */}
        <a href="/about" className="relative">
          <div className="flex sm:hidden">
            <div
              className="flex w-1/2 min-w-0 items-center justify-center gap-2 px-2 py-3"
              style={{ backgroundColor: siteTheme.colors["blue"] }}
            >
              <Calendar size={18} />
              <Text
                weight="semibold"
                className="min-w-0"
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {displayJam ? displayJam.name : "No active jams"}
              </Text>
            </div>
            <div className="flex w-1/2 min-w-0 items-center justify-center px-2 py-3">
              <Text
                size="sm"
                weight="semibold"
                style={{ whiteSpace: "nowrap" }}
              >
                {compactDateRange}
              </Text>
            </div>
          </div>

          <div className="hidden sm:flex">
            <div
              style={{
                backgroundColor: siteTheme.colors["blue"],
              }}
              className="p-4 px-6 flex items-center gap-2 font-bold transition-color duration-250"
            >
              <Calendar />
              <Text size="sm" weight="normal">
                {displayJam && activeJamResponse?.phase
                  ? `${displayJam.name} - ${activeJamResponse.phase} Phase`
                  : "(No Active Jams)"}
              </Text>
            </div>

            <div className="p-4 px-6">
              <Text weight="bold">{compactDateRange}</Text>
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
          ) : activeJamResponse.phase == "Post-Jam Rating" ? (
            <div
              className="grid grid-cols-1"
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
                  <Text weight="semibold">Go rate Updated Games!</Text>
                </div>
              </Link>
              {/* <Link
                href="/music"
                className="hover:underline"
                style={{
                  color: colors["blue"],
                }}
              >
                <div className="p-4 text-center flex justify-center">
                  <Text weight="semibold">Go rate Post-Jam Music!</Text>
                </div>
              </Link> */}
            </div>
          ) : (
            <div
              className="text-center rounded-b-xl"
              style={{
                backgroundColor: colors["blueDarkDark"],
              }}
            >
              {currentPhase?.href ? (
                <Link
                  href={currentPhase.href}
                  className="flex justify-center p-3 hover:underline sm:p-4"
                >
                  <Text weight="semibold">{currentPhase.text}</Text>
                </Link>
              ) : (
                <div className="flex justify-center p-3 sm:p-4">
                  <Text weight="semibold">{currentPhase?.text ?? ""}</Text>
                </div>
              )}
            </div>
          ))}
      </div>

      <div
        ref={timelineRef}
        className="relative mx-0 mt-3 overflow-x-auto pb-2 sm:mx-4"
        aria-label="Jam timeline"
      >
        <ol className="flex min-w-max snap-x gap-2">
          {sortedEvents.map((event, index) => {
            const isActive = index === activeEventIndex;
            const eventStyle = getStyleForDateDisplay(
              index,
              effectiveNextEventIndex,
              currentDate,
              event.date,
            );
            const nextEvent = sortedEvents[index + 1];
            const nextEventStyle = nextEvent
              ? getStyleForDateDisplay(
                  index + 1,
                  effectiveNextEventIndex,
                  currentDate,
                  nextEvent.date,
                )
              : undefined;

            return (
              <li
                ref={isActive ? activeEventRef : undefined}
                key={event.name}
                className="relative min-w-36 grow snap-start"
                aria-current={isActive ? "step" : undefined}
              >
                {index < sortedEvents.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="absolute left-full top-1/2 h-0.5 w-2 -translate-y-1/2"
                    style={{
                      backgroundColor:
                        nextEventStyle?.borderColor ??
                        nextEventStyle?.backgroundColor ??
                        colors["violetDark"],
                      opacity: eventStyle.opacity ?? 1,
                    }}
                  />
                )}

                <div
                  className="relative z-10 flex min-h-[60px] flex-col items-center justify-center rounded-md p-2 text-center"
                  style={{
                    color: siteTheme.colors["text"],
                    backgroundColor: colors["mantle"] + "e6",
                    ...eventStyle,
                  }}
                >
                  <Text
                    size="xs"
                    color={isActive ? "textLight" : "text"}
                  >
                    {event.name}
                  </Text>
                  <Text
                    weight="bold"
                    color={isActive ? "textLight" : "text"}
                  >
                    {event.date
                      ?.toLocaleString("en-US", { month: "short" })
                      .toUpperCase()}{" "}
                    {event.date?.getDate()}
                  </Text>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}
