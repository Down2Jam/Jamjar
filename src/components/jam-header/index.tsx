"use client";

import { Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentJam, ActiveJamResponse } from "../../helpers/jam";
import { getTopThemes } from "@/requests/theme";
import { Spacer } from "@nextui-org/react";
import { JamPhase } from "@/types/JamType";

const events = [
  { name: "Theme Submission", date: "FEB 28" },
  { name: "Theme Elimination", date: "MAR 7" },
  { name: "Theme Voting #1", date: "MAR 14" },
  { name: "Theme Voting #2", date: "MAR 15" },
  { name: "Theme Voting #3", date: "MAR 16" },
  { name: "Theme Voting Final", date: "MAR 17" },
  { name: "Jam Start", date: "MAR 21" },
];

const getDateObject = (dateString: string) => {
  return new Date(`${dateString} ${new Date().getFullYear()}`);
};

export default function JamHeader() {
  const [activeJamResponse, setActiveJamResponse] =
    useState<ActiveJamResponse | null>(null);
  const [topTheme, setTopTheme] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const getClassesForDateDisplay = (
    index: number,
    nextEventIndex: number,
    eventDateObj: Date,
    currentDate: Date
  ) => {
    if (index === nextEventIndex - 1 && eventDateObj < currentDate) {
      return "bg-[#81b8cc] dark:bg-[#1891b2]";
    }
    if (index === nextEventIndex) {
      return "border-2 border-[#c087ae] dark:border-[#a1598a]";
    }
    if (index === nextEventIndex + 1) {
      return "border-2 border-[#8f7daf] dark:border-[#634e89]";
    }
    if (index === nextEventIndex + 2) {
      return "border-2 border-[#7b7799] dark:border-[#4c4872]";
    }
    if (eventDateObj < currentDate) {
      return "border-2 border-[#fff] dark:border-[#222222] opacity-20";
    }
    return "border-2 border-[#5e6a83] dark:border-[#33405d]";
  };

  const getPhaseObj = (jamPhase: JamPhase) => {
    if (jamPhase === "Suggestion")
      return {
        text: "Go to Theme Suggestion",
        href: "/theme-suggestions",
      };
    if (jamPhase === "Survival")
      return {
        text: "Go to Theme Survival",
        href: "/theme-slaughter",
      };
    if (jamPhase === "Voting")
      return {
        text: "Go to Theme Voting",
        href: "/theme-voting",
      };
    if (jamPhase === "Jamming")
      return {
        text: topTheme
          ? `THEME: ${topTheme}`
          : "No top-scoring theme available.",
      };
    if (jamPhase === "Rating")
      return {
        text: topTheme
          ? `THEME: ${topTheme} RESULTS`
          : "No top-scoring theme available.",
      };
    return { text: "" };
  };

  // Fetch active jam details
  useEffect(() => {
    const fetchData = async () => {
      const jamData = await getCurrentJam();
      console.log(jamData);
      setActiveJamResponse(jamData);

      // If we're in Jamming phase, fetch top themes and pick the first one
      if (
        (jamData?.phase === "Jamming" || jamData?.phase === "Rating") &&
        jamData.jam
      ) {
        try {
          const response = await getTopThemes();

          if (response.ok) {
            const themes = await response.json();
            if (themes.length > 0) {
              setTopTheme(themes[0].suggestion);
            }
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
      <a href="/about" className="relative">
        <div className="bg-[#7090b9] dark:bg-[#124a88] ml-4 mr-4 flex flex-col rounded-2xl overflow-hidden text-white transition-color duration-250 shadow-2xl">
          {/* Jam Header */}
          <div className="flex">
            <div className="bg-[#85bdd2] dark:bg-[#1892b3] p-4 px-6 flex items-center gap-2 font-bold transition-color duration-250">
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

          {activeJamResponse &&
            activeJamResponse.jam &&
            activeJamResponse.phase != "Upcoming Jam" && (
              <div className="bg-gray-100 dark:bg-gray-800 p-4 text-center rounded-b-2x">
                {getPhaseObj(activeJamResponse.phase) &&
                getPhaseObj(activeJamResponse.phase).href ? (
                  <a
                    href={getPhaseObj(activeJamResponse.phase).href}
                    className="text-blue-300 dark:text-blue-500 hover:underline font-semibold"
                  >
                    {getPhaseObj(activeJamResponse.phase).text}
                  </a>
                ) : (
                  <p className="text-xl font-bold text-blue-500">
                    {getPhaseObj(activeJamResponse.phase).text}
                  </p>
                )}
              </div>
            )}
        </div>
      </a>
      <Spacer y={3} />
      <div className="flex overflow-x-scroll snap-x pb-2 gap-2 relative ml-4 mr-4">
        {sortedEvents.map((event, index) => (
          <div
            key={event.name}
            className={`snap-start rounded-md p-2 text-center min-w-36 text-[#333] dark:text-white ${getClassesForDateDisplay(
              index,
              nextEventIndex,
              event.dateObj,
              currentDate
            )}`}
          >
            <p className="text-xs">{event.name}</p>
            <p className="font-bold text-lg">{event.date}</p>
          </div>
        ))}
      </div>
    </>
  );
}
