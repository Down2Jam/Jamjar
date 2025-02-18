"use client";

import { Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentJam, ActiveJamResponse } from "../../helpers/jam";
import { getTopThemes } from "@/requests/theme";
import { Spacer } from "@nextui-org/react";

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

  // Fetch active jam details
  useEffect(() => {
    const fetchData = async () => {
      const jamData = await getCurrentJam();
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

          {activeJamResponse?.phase === "Suggestion" && (
            <div className="bg-gray-100 dark:bg-gray-800 p-4 text-center rounded-b-2x">
              <a
                href="/theme-suggestions"
                className="text-blue-300 dark:text-blue-500 hover:underline font-semibold"
              >
                Go to Theme Suggestion
              </a>
            </div>
          )}

          {activeJamResponse?.phase === "Survival" && (
            <div className="bg-gray-100 dark:bg-gray-800 p-4 text-center rounded-b-2x">
              <a
                href="/theme-slaughter"
                className="text-blue-300 dark:text-blue-500 hover:underline font-semibold"
              >
                Go to Theme Survival
              </a>
            </div>
          )}

          {activeJamResponse?.phase === "Voting" && (
            <div className="bg-gray-100 dark:bg-gray-800 p-4 text-center rounded-b-2x">
              <a
                href="/theme-voting"
                className="text-blue-300 dark:text-blue-500 hover:underline font-semibold"
              >
                Go to Theme Voting
              </a>
            </div>
          )}

          {activeJamResponse?.phase === "Jamming" && (
            <div className="bg-gray-100 dark:bg-gray-800 p-4 text-center rounded-b-2x">
              {topTheme ? (
                <p className="text-xl font-bold text-blue-500">
                  THEME: {topTheme}
                </p>
              ) : (
                <p>No top-scoring theme available.</p>
              )}
            </div>
          )}

          {activeJamResponse?.phase === "Rating" && (
            <div className="bg-gray-100 dark:bg-gray-800 p-4 text-center rounded-b-2x">
              {topTheme ? (
                <p className="text-xl font-bold text-blue-500">
                  THEME: {topTheme} RESULTS
                </p>
              ) : (
                <p>No top-scoring theme available.</p>
              )}
            </div>
          )}
        </div>
      </a>
      <Spacer y={3} />
      <div className="flex gap-2 relative ml-4 mr-4">
        {sortedEvents.map((event, index) => {
          if (index === nextEventIndex - 1 && event.dateObj < currentDate) {
            return (
              <div
                key={event.name}
                className="rounded-md p-2 bg-[#81b8cc] dark:bg-[#1891b2] text-center w-36 text-[#333] dark:text-white"
              >
                <p className="text-xs">{event.name}</p>
                <p className="font-bold text-lg">{event.date}</p>
              </div>
            );
          } else if (index === nextEventIndex) {
            return (
              <div
                key={event.name}
                className="rounded-md p-2 border-2 border-[#c087ae] dark:border-[#a1598a] text-center  w-36 text-[#333] dark:text-white"
              >
                <p className="text-xs">{event.name}</p>
                <p className="font-bold text-lg">{event.date}</p>
              </div>
            );
          } else if (index === nextEventIndex + 1) {
            return (
              <div
                key={event.name}
                className="rounded-md p-2 border-2 border-[#8f7daf] dark:border-[#634e89] text-center  w-36 text-[#333] dark:text-white"
              >
                <p className="text-xs">{event.name}</p>
                <p className="font-bold text-lg">{event.date}</p>
              </div>
            );
          } else if (index === nextEventIndex + 2) {
            return (
              <div
                key={event.name}
                className="rounded-md p-2 border-2 border-[#7b7799] dark:border-[#4c4872] text-center  w-36 text-[#333] dark:text-white"
              >
                <p className="text-xs">{event.name}</p>
                <p className="font-bold text-lg">{event.date}</p>
              </div>
            );
          } else if (event.dateObj < currentDate) {
            return (
              <div
                key={event.name}
                className="rounded-md p-2 border-2 border-[#fff] dark:border-[#222222] text-center opacity-20  w-36 text-[#333] dark:text-white"
              >
                <p className="text-xs">{event.name}</p>
                <p className="font-bold text-lg">{event.date}</p>
              </div>
            );
          } else {
            return (
              <div
                key={event.name}
                className="rounded-md p-2 border-2 border-[#5e6a83] dark:border-[#33405d] text-center w-36 text-[#333] dark:text-white"
              >
                <p className="text-xs">{event.name}</p>
                <p className="font-bold text-lg">{event.date}</p>
              </div>
            );
          }
        })}
      </div>
    </>
  );
}
