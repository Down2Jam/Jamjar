"use client";

import { ArrowRight, Calendar } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ActiveJamResponse } from "../../helpers/jam";
import { getTheme } from "@/requests/theme";
import { JamPhase } from "@/types/JamType";
import { useTheme } from "@/providers/useSiteTheme";
import { Text } from "bioloom-ui";
import Link from "@/compat/next-link";
import { useCurrentJam } from "@/hooks/queries";
import { Skeleton } from "@/components/skeletons";
import SidebarBanner from "@/components/sidebar/SidebarBanner";
import SidebarButtons from "@/components/sidebar/SidebarButtons";
import Logo from "@/components/logo";
import { isThemeVotingOpen } from "@/helpers/jamDisplay";

export default function JamHeader() {
  const { data: activeJamResponse, isLoading } = useCurrentJam();
  const displayJam = activeJamResponse?.jam ?? null;
  const [topTheme, setTopTheme] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const timelineRef = useRef<HTMLDivElement>(null);
  const activeEventRef = useRef<HTMLLIElement>(null);
  const timelineDragRef = useRef({
    pointerId: null as number | null,
    startX: 0,
    startScrollLeft: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
    momentumFrame: null as number | null,
  });
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
      if (!isThemeVotingOpen(jamPhase, activeJamResponse?.jam, currentDate))
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

  useEffect(
    () => () => {
      const frame = timelineDragRef.current.momentumFrame;
      if (frame !== null) cancelAnimationFrame(frame);
    },
    [],
  );

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

  const startTimelineMomentum = (timeline: HTMLDivElement) => {
    const drag = timelineDragRef.current;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      Math.abs(drag.velocity) < 0.02
    ) {
      drag.velocity = 0;
      return;
    }

    let previousTime = performance.now();

    const coast = (time: number) => {
      const elapsed = Math.min(time - previousTime, 32);
      previousTime = time;
      const previousScrollLeft = timeline.scrollLeft;

      timeline.scrollLeft += drag.velocity * elapsed;
      drag.velocity *= Math.pow(0.94, elapsed / 16.67);

      const reachedEdge = timeline.scrollLeft === previousScrollLeft;
      if (Math.abs(drag.velocity) < 0.02 || reachedEdge) {
        drag.velocity = 0;
        drag.momentumFrame = null;
        return;
      }

      drag.momentumFrame = requestAnimationFrame(coast);
    };

    drag.momentumFrame = requestAnimationFrame(coast);
  };

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
      <div className="relative left-1/2 -mt-4 w-[calc(100%+1rem)] -translate-x-1/2 overflow-hidden sm:w-[calc(100%+4rem)]">
        <div className="mx-auto flex min-h-48 w-full max-w-6xl flex-col items-center gap-4 px-4 py-5 sm:px-8 md:flex-row md:gap-6 xl:max-w-7xl 2xl:max-w-[96em]">
          <Skeleton className="h-24 w-24 shrink-0 rounded-2xl md:h-36 md:w-36 md:translate-y-4" />
          <div className="flex w-full max-w-xl flex-col items-center gap-4 md:translate-y-7 md:items-start">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-11 w-44 rounded-lg" />
          </div>
        </div>
        <div>
          <div className="mx-auto w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[96em]">
            <div className="flex gap-2 overflow-hidden px-2 py-3 sm:px-8 md:w-[calc(100%_-_clamp(260px,30vw,480px))]">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-[70px] min-w-[150px] grow rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
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
  const themeVotingOpen = isThemeVotingOpen(
    activeJamResponse?.phase,
    activeJamResponse?.jam,
    currentDate,
  );
  const isVotingPhase = activeJamResponse?.phase === "Voting";

  const primaryAction = (() => {
    if (!activeJamResponse?.jam) return { href: "/about", text: "About Down2Jam" };
    if (activeJamResponse.phase === "Voting" && !themeVotingOpen)
      return { href: "/about", text: "JamHeader.JamSoon" };
    if (activeJamResponse.phase === "Jamming")
      return { href: "/radio", text: "Listen to the Down2Jam Radio" };
    if (activeJamResponse.phase === "Rating")
      return { href: "/games", text: "JamHeader.RateGames" };
    if (activeJamResponse.phase === "Post-Jam Rating")
      return { href: "/games", text: "Rate updated games" };
    return currentPhase?.href
      ? { href: currentPhase.href, text: currentPhase.text }
      : { href: "/about", text: "Explore the jam" };
  })();

  const hasPrimaryActionImage =
    activeJamResponse?.phase === "Voting" ||
    activeJamResponse?.phase === "Jamming";

  const renderPrimaryAction = (className = "") => (
    <Link
      href={primaryAction.href}
      className={`group relative inline-flex items-center gap-2 overflow-hidden rounded-lg border font-semibold transition-[filter] duration-200 hover:brightness-110 active:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
        hasPrimaryActionImage
          ? `min-h-10 py-2 pr-3 text-[11px] sm:text-xs ${
              activeJamResponse?.phase === "Jamming" ? "pl-12" : "pl-10"
            }`
          : "min-h-10 px-4 py-2 text-sm sm:text-base"
      } ${className}`}
      style={{
        color: colors["text"],
        borderColor: colors["base"],
        backgroundColor: `${colors["mantle"]}e6`,
        outlineColor: colors["blue"],
      }}
    >
      {hasPrimaryActionImage && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-10 overflow-hidden"
        >
          <img
            src={
              activeJamResponse?.phase === "Jamming"
                ? "/images/down2jam-radio.gif"
                : themeVotingOpen
                  ? "/images/voted.png"
                  : "/images/theme-reveal.gif"
            }
            alt=""
            className={`h-full w-full object-contain object-right ${
              themeVotingOpen ? "-scale-x-100" : ""
            }`}
          />
        </span>
      )}
      <Text
        size={hasPrimaryActionImage ? "xs" : "md"}
        weight="semibold"
        className="relative z-10"
      >
        {primaryAction.text}
      </Text>
      {(activeJamResponse?.phase !== "Voting" || themeVotingOpen) && (
        <ArrowRight
          size={hasPrimaryActionImage ? 15 : 17}
          aria-hidden="true"
          className="relative z-10 transition-transform duration-200 group-hover:translate-x-0.5"
          style={{ color: "#fff" }}
        />
      )}
    </Link>
  );

  return (
    <section
      className="relative left-1/2 isolate -mt-4 w-[calc(100%+1rem)] -translate-x-1/2 overflow-hidden sm:w-[calc(100%+4rem)]"
      style={{
        color: siteTheme.colors["textLight"],
      }}
      aria-labelledby="home-jam-title"
    >
      <div className="mx-auto flex min-h-48 w-full max-w-6xl flex-col items-center justify-center gap-3 px-4 py-5 text-center sm:px-8 md:flex-row md:justify-start md:gap-8 md:pr-[calc(clamp(260px,30vw,480px)_+_32px)] md:text-left xl:max-w-7xl 2xl:max-w-[96em]">
        <Logo
          width={160}
          className="h-24 w-24 shrink-0 object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)] md:h-36 md:w-36 md:translate-y-4 lg:h-40 lg:w-40"
        />

        <div className="flex min-w-0 flex-1 flex-col items-center md:translate-y-7 md:items-start">
          <h1
            id="home-jam-title"
            className="text-3xl font-black tracking-tight drop-shadow-lg md:text-4xl"
            style={{
              color: colors["text"],
            }}
          >
            {displayJam?.name ?? "Down2Jam"}
          </h1>
          <p
            className="mt-1 text-base font-medium md:text-lg"
            style={{
              color: colors["text"],
            }}
          >
            The community-centered jam
          </p>

          <div className="mt-3 flex flex-col items-center gap-3 md:items-start md:gap-4 xl:w-full xl:flex-row xl:justify-between">
            <div
              className="flex items-center gap-2 text-sm font-semibold md:text-base"
              style={{
                color: colors["text"],
              }}
            >
              <Calendar size={20} aria-hidden="true" />
              <span>{compactDateRange}</span>
            </div>
            {renderPrimaryAction(
              `md:hidden xl:inline-flex xl:mr-8 ${
                isVotingPhase
                  ? "xl:translate-y-4"
                  : ""
              }`,
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="mx-auto flex w-full max-w-6xl items-start px-2 sm:px-8 md:pl-0 xl:max-w-7xl 2xl:max-w-[96em]">
          <div className="min-w-0 flex-1 overflow-hidden sm:mr-4 md:ml-12 md:mr-8">
            <div
              ref={timelineRef}
              className="jam-timeline-scrollbar w-full max-w-[58.75rem] cursor-grab select-none overflow-x-auto py-3 active:cursor-grabbing sm:py-4"
              aria-label="Jam timeline. Drag horizontally to view more phases."
              tabIndex={0}
              onPointerDown={(event) => {
                if (event.button !== 0) return;

                const previousFrame = timelineDragRef.current.momentumFrame;
                if (previousFrame !== null) cancelAnimationFrame(previousFrame);

                timelineDragRef.current = {
                  pointerId: event.pointerId,
                  startX: event.clientX,
                  startScrollLeft: event.currentTarget.scrollLeft,
                  lastX: event.clientX,
                  lastTime: performance.now(),
                  velocity: 0,
                  momentumFrame: null,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                const drag = timelineDragRef.current;
                if (drag.pointerId !== event.pointerId) return;

                const now = performance.now();
                const elapsed = Math.max(now - drag.lastTime, 1);
                const movement = event.clientX - drag.lastX;
                const instantaneousVelocity = -movement / elapsed;

                event.currentTarget.scrollLeft =
                  drag.startScrollLeft - (event.clientX - drag.startX);
                drag.velocity =
                  drag.velocity * 0.65 + instantaneousVelocity * 0.35;
                drag.lastX = event.clientX;
                drag.lastTime = now;
              }}
              onPointerUp={(event) => {
                if (timelineDragRef.current.pointerId !== event.pointerId)
                  return;

                const drag = timelineDragRef.current;
                drag.pointerId = null;
                if (performance.now() - drag.lastTime > 80) {
                  drag.velocity *= 0.25;
                }
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }
                startTimelineMomentum(event.currentTarget);
              }}
              onPointerCancel={(event) => {
                if (timelineDragRef.current.pointerId === event.pointerId) {
                  timelineDragRef.current.pointerId = null;
                }
              }}
              style={{ touchAction: "pan-y" }}
            >
              <ol className="flex min-w-max gap-2">
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
                className="relative min-w-[112px] grow md:min-w-[120px] xl:min-w-[126px] 2xl:min-w-[150px]"
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
                  className="relative z-10 flex min-h-[70px] flex-col items-center justify-center rounded-lg p-2 text-center shadow-md"
                  style={{
                    backgroundColor: isActive
                      ? `${colors["blueDark"]}f2`
                      : `${colors["mantle"]}e6`,
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
          </div>
          <div className="relative hidden shrink-0 flex-col gap-3 self-start pt-4 md:flex md:w-[clamp(260px,30vw,480px)]">
            <div className="absolute bottom-[calc(100%_-_8px)] left-0 flex w-full flex-col items-center gap-2">
              <div className="hidden md:flex xl:hidden">
                {renderPrimaryAction()}
              </div>
              <SidebarButtons />
            </div>
            <SidebarBanner />
          </div>
        </div>
      </div>
    </section>
  );
}
