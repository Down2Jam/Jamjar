"use client";

import { Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentJam, ActiveJamResponse } from "../../helpers/jam";
import { getTheme } from "@/requests/theme";
import { Spacer } from "@heroui/react";
import { JamPhase } from "@/types/JamType";
import { useTheme } from "@/providers/SiteThemeProvider";

const events = [
  { name: "Theme Submission", date: "AUG 15" },
  { name: "Theme Elimination", date: "AUG 22" },
  { name: "Theme Voting", date: "AUG 29" },
  { name: "Game Jam", date: "SEP 5" },
  { name: "Rating Period", date: "SEP 8" },
  { name: "Results", date: "SEP 21" },
];

const getDateObject = (dateString: string) => {
  const date = new Date(`${dateString} ${new Date().getFullYear()}`);
  date.setUTCHours(22, 0, 0, 0);
  return date;
};

export default function JamHeader() {
  const [activeJamResponse, setActiveJamResponse] =
    useState<ActiveJamResponse | null>(null);
  const [topTheme, setTopTheme] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const { siteTheme, colors } = useTheme();

  const getStyleForDateDisplay = (
    index: number,
    nextEventIndex: number,
    eventDateObj: Date,
    currentDate: Date
  ) => {
    if (index === nextEventIndex - 1 && eventDateObj < currentDate) {
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
    if (eventDateObj < currentDate) {
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
        text: "Go to Theme Suggestion",
        href: "/theme-suggestions",
      };
    if (jamPhase === "Elimination")
      return {
        text: "Go to Theme Elimination",
        href: "/theme-elimination",
      };
    if (jamPhase === "Voting") {
      if (
        activeJamResponse &&
        activeJamResponse.jam &&
        new Date(activeJamResponse.jam.startTime).getTime() -
          new Date().getTime() <=
          60 * 60 * 1000
      )
        return {
          text: "Theme will be revealed on jam start",
        };
      else
        return {
          text: "Go to Theme Voting",
          href: "/theme-voting",
        };
    }
    if (jamPhase === "Jamming")
      return {
        text: topTheme
          ? `Theme: ${topTheme}`
          : "No top-scoring theme available.",
      };
    if (jamPhase === "Submission")
      return {
        text: "Submissions close soon",
      };
    if (jamPhase === "Rating")
      return {
        text: "Go rate games!",
        href: "/games",
      };
    return { text: "" };
  };

  // Fetch active jam details
  useEffect(() => {
    const fetchData = async () => {
      const jamData = await getCurrentJam();

      setActiveJamResponse(jamData);

      // If we're in Jamming phase, fetch top themes and pick the first one
      if (
        (jamData?.phase === "Jamming" ||
          jamData?.phase === "Submission" ||
          jamData?.phase === "Rating") &&
        jamData.jam
      ) {
        try {
          const response = await getTheme();

          if (response.ok) {
            const theme = (await response.json()).data;
            setTopTheme(theme.suggestion);
          } else {
            console.error("Failed to fetch top themes.", response.status);
          }
        } catch (error) {
          console.error("Error fetching top themes:", error);
        }
      }
    };

    fetchData();

    const timer = setInterval(() => setCurrentDate(new Date()), 1000 * 60); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const sortedEvents = events.map((event) => ({
    ...event,
    dateObj: getDateObject(event.date),
  }));

  const nextEventIndex = sortedEvents.findIndex(
    (event) => event.dateObj >= currentDate
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
          backgroundColor: siteTheme.colors["blueDarkDark"],
          color: siteTheme.colors["textLight"],
        }}
        className="z-10 relative ml-4 mr-4 flex flex-col rounded-2xl overflow-hidden transition-color duration-250 shadow-2xl"
      >
        {/* Jam Header */}
        <a href="/about" className="relative">
          <div className="flex">
            <div
              style={{
                backgroundColor: siteTheme.colors["blueDark"],
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
                    {new Date(
                      activeJamResponse.jam.startTime
                    ).toLocaleDateString("en-US", {
                      month: "long",
                    })}{" "}
                    {new Date(activeJamResponse.jam.startTime).getDate()}
                    {getOrdinalSuffix(
                      new Date(activeJamResponse.jam.startTime).getDate()
                    )}
                    {" - "}
                    {new Date(
                      new Date(activeJamResponse.jam.startTime).getTime() +
                        activeJamResponse.jam.jammingHours * 60 * 60 * 1000
                    ).toLocaleDateString("en-US", {
                      month: "long",
                    })}{" "}
                    {new Date(
                      new Date(activeJamResponse.jam.startTime).getTime() +
                        activeJamResponse.jam.jammingHours * 60 * 60 * 1000
                    ).getDate()}
                    {getOrdinalSuffix(
                      new Date(
                        new Date(activeJamResponse.jam.startTime).getTime() +
                          activeJamResponse.jam.jammingHours * 60 * 60 * 1000
                      ).getDate()
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
          (getPhaseObj(activeJamResponse.phase) &&
          getPhaseObj(activeJamResponse.phase).href ? (
            <a
              href={getPhaseObj(activeJamResponse.phase).href}
              className="hover:underline"
              style={{
                color: colors["blue"],
              }}
            >
              <div className="bg-slate-100 dark:bg-gray-800 p-4 text-center rounded-b-2x">
                <p className="font-semibold ">
                  {getPhaseObj(activeJamResponse.phase).text}
                </p>
              </div>
            </a>
          ) : (
            <div className="bg-slate-100 dark:bg-gray-800 p-4 text-center rounded-b-2x">
              <p
                className="font-semibold"
                style={{
                  color: colors["blue"],
                }}
              >
                {getPhaseObj(activeJamResponse.phase).text}
              </p>
            </div>
          ))}
      </div>

      <Spacer y={3} />
      <div className="flex overflow-x-scroll snap-x pb-2 gap-2 relative ml-4 mr-4">
        {sortedEvents.map((event, index) => (
          <div
            key={event.name}
            className={`grow snap-start rounded-md p-2 text-center min-w-36`}
            style={{
              color: siteTheme.colors["text"],
              ...getStyleForDateDisplay(
                index,
                nextEventIndex,
                event.dateObj,
                currentDate
              ),
            }}
          >
            <p className="text-xs">{event.name}</p>
            <p className="font-bold text-lg">{event.date}</p>
          </div>
        ))}
      </div>
    </>
  );
}
