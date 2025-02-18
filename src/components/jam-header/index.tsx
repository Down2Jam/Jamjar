"use client";

import { Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentJam, ActiveJamResponse } from "../../helpers/jam";
import { getTopThemes } from "@/requests/theme";

export default function JamHeader() {
  const [activeJamResponse, setActiveJamResponse] =
    useState<ActiveJamResponse | null>(null);
  const [topTheme, setTopTheme] = useState<string | null>(null);

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
  }, []);

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
    <a href="/about">
      <div className="bg-[#7090b9] dark:bg-[#124a88] ml-4 mr-4 flex flex-col rounded-2xl overflow-hidden text-white transition-color duration-250">
        {/* Jam Header */}
        <div className="flex">
          <div className="bg-[#85bdd2] dark:bg-[#1892b3] p-4 px-6 flex items-center gap-2 font-bold transition-color duration-250">
            <Calendar />
            <p>
              {activeJamResponse?.jam && activeJamResponse.phase ? (
                <span className="text-sm font-normal">
                  {activeJamResponse.jam.name} - {activeJamResponse.phase} Phase
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
                  {new Date(activeJamResponse.jam.startTime).toLocaleDateString(
                    "en-US",
                    {
                      month: "long",
                    }
                  )}{" "}
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
  );
}
