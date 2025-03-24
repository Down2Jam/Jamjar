"use client";
import React, { useState, useEffect } from "react";
import Timer from "./Timer";
import { getCurrentJam, ActiveJamResponse } from "@/helpers/jam";

export default function Timers() {
  const [activeJamResponse, setActiveJamResponse] =
    useState<ActiveJamResponse | null>(null);

  // Fetch the current jam phase using helpers/jam
  useEffect(() => {
    const fetchCurrentJamPhase = async () => {
      try {
        const activeJam = await getCurrentJam();
        setActiveJamResponse(activeJam); // Set active jam details
      } catch (error) {
        console.error("Error fetching current jam:", error);
      } finally {
      }
    };

    fetchCurrentJamPhase();
  }, []);

  if (activeJamResponse && activeJamResponse.jam) {
    if (
      activeJamResponse.phase == "Suggestion" ||
      activeJamResponse.phase == "Elimination" ||
      activeJamResponse.phase == "Voting" ||
      activeJamResponse.phase == "Upcoming Jam"
    ) {
      return (
        <div className="text-[#333] dark:text-white transition-color duration-250">
          <Timer
            name="Jam starts in"
            targetDate={new Date(activeJamResponse.jam.startTime)}
          />
        </div>
      );
    } else if (activeJamResponse.phase == "Jamming") {
      return (
        <div className="text-[#333] dark:text-white transition-color duration-250">
          <Timer
            name="Jam ends in"
            targetDate={
              new Date(
                new Date(activeJamResponse.jam.startTime).getTime() +
                  activeJamResponse.jam.jammingHours * 60 * 60 * 1000
              )
            }
          />
        </div>
      );
    } else if (activeJamResponse.phase == "Submission") {
      return (
        <div className="text-[#333] dark:text-white transition-color duration-250">
          <Timer
            name="Submissions ends in"
            targetDate={
              new Date(
                new Date(activeJamResponse.jam.startTime).getTime() +
                  activeJamResponse.jam.jammingHours * 60 * 60 * 1000 +
                  activeJamResponse.jam.submissionHours * 60 * 60 * 1000
              )
            }
          />
        </div>
      );
    } else if (activeJamResponse.phase == "Rating") {
      return (
        <div className="text-[#333] dark:text-white transition-color duration-250">
          <Timer
            name="Rating ends in"
            targetDate={
              new Date(
                new Date(activeJamResponse.jam.startTime).getTime() +
                  activeJamResponse.jam.jammingHours * 60 * 60 * 1000 +
                  activeJamResponse.jam.ratingHours * 60 * 60 * 1000 +
                  activeJamResponse.jam.submissionHours * 60 * 60 * 1000
              )
            }
          />
        </div>
      );
    } else {
      return (
        <div className="text-[#333] dark:text-white transition-color duration-250">
          No upcoming jams
        </div>
      );
    }
  }
}
