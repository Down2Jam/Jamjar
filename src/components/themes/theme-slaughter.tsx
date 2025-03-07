"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getCookie } from "@/helpers/cookie";
import {
  getCurrentJam,
  hasJoinedCurrentJam,
  ActiveJamResponse,
  joinJam,
} from "@/helpers/jam";
import { ThemeType } from "@/types/ThemeType";
import {
  getRandomThemes,
  getSlaughterThemes,
  postThemeSlaughterVote,
} from "@/requests/theme";

export default function ThemeSlaughter() {
  const [randomTheme, setRandomTheme] = useState<ThemeType | null>(null);
  const [votedThemes, setVotedThemes] = useState<ThemeType[]>([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState<boolean>(false);
  const [activeJamResponse, setActiveJam] = useState<ActiveJamResponse | null>(
    null
  );
  const [phaseLoading, setPhaseLoading] = useState(true);
  const [themeLoading, setThemeLoading] = useState<{ [key: number]: boolean }>(
    {}
  );

  // Fetch token on the client side
  useEffect(() => {
    const fetchedToken = getCookie("token");
    setToken(fetchedToken);
  }, []);

  // Fetch the current jam phase using helpers/jam
  useEffect(() => {
    const fetchCurrentJamPhase = async () => {
      try {
        const activeJam = await getCurrentJam();
        setActiveJam(activeJam); // Set active jam details
      } catch (error) {
        console.error("Error fetching current jam:", error);
      } finally {
        setPhaseLoading(false); // Stop loading when phase is fetched
      }
    };

    fetchCurrentJamPhase();
  }, []);

  // Fetch a random theme
  const fetchRandomTheme = useCallback(async () => {
    if (!token) return; // Wait until token is available
    if (!activeJamResponse) return;
    if (
      activeJamResponse &&
      activeJamResponse.jam &&
      activeJamResponse.phase != "Elimination"
    ) {
      return (
        <div>
          <h1>It&apos;s not Theme Elimination phase.</h1>
        </div>
      );
    }

    try {
      const response = await getRandomThemes();
      if (response.ok) {
        const data = await response.json();
        setRandomTheme(data);
      } else {
        if (response.status == 404) {
          setRandomTheme(null);
        } else {
          console.error("Error fetching random theme");
        }
      }
    } catch (error) {
      console.error("Error fetching random theme:", error);
    }
  }, [activeJamResponse, token]);

  // Fetch voted themes
  const fetchVotedThemes = useCallback(async () => {
    if (!token) return; // Wait until token is available

    try {
      const response = await getSlaughterThemes();
      if (response.ok) {
        const data = await response.json();
        setVotedThemes(data);
      } else {
        console.error("Failed to fetch voted themes.");
      }
    } catch (error) {
      console.error("Error fetching voted themes:", error);
    }
  }, [token]);

  // Handle voting
  const handleVote = async (voteType: string) => {
    if (!randomTheme) return;

    // Set loading for the current random theme
    setThemeLoading((prev) => ({ ...prev, [randomTheme.id]: true }));

    try {
      const response = await postThemeSlaughterVote(randomTheme.id, voteType);

      if (response.ok) {
        // Refresh data after voting
        fetchRandomTheme();
        fetchVotedThemes();
      } else {
        console.error("Failed to submit vote.");
      }
    } catch (error) {
      console.error("Error submitting vote:", error);
    } finally {
      // Remove loading state for the current random theme
      setThemeLoading((prev) => ({ ...prev, [randomTheme.id]: false }));
    }
  };

  // Handle resetting a vote from the grid
  const handleResetVote = async (themeId: number) => {
    try {
      const theme = votedThemes.find((theme) => theme.id === themeId);
      if (theme) {
        setRandomTheme(theme);
        setVotedThemes((prev) =>
          prev.map((t) => (t.id === themeId ? { ...t, slaughterScore: 0 } : t))
        );
      }
    } catch (error) {
      console.error("Error resetting vote:", error);
    }
  };

  useEffect(() => {
    if (token && activeJamResponse?.phase === "Elimination") {
      fetchRandomTheme();
      fetchVotedThemes();
    }
  }, [token, activeJamResponse, fetchRandomTheme, fetchVotedThemes]);

  useEffect(() => {
    const init = async () => {
      const joined = await hasJoinedCurrentJam();
      setHasJoined(joined);
      setLoading(false);
    };

    init();
  }, []);

  if (phaseLoading || loading) {
    return <div>Loading...</div>;
  }

  // Render message if not in Theme Elimination phase
  if (activeJamResponse?.phase !== "Elimination") {
    return (
      <div className="p-6 bg-gray-100 dark:bg-gray-800 min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Not in Theme Slaughter Phase
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          The current phase is{" "}
          <strong>{activeJamResponse?.phase || "Unknown"}</strong>. Please come
          back during the Theme Slaughter phase.
        </p>
      </div>
    );
  }

  const loggedIn = getCookie("token");
  if (!loggedIn) {
    return <div>Sign in to be able to join the Theme Elimination</div>;
  }

  if (!hasJoined) {
    return (
      <div className="p-6 bg-gray-100 dark:bg-gray-800 min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Join the Jam First
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          You need to join the current jam before you can join Theme
          Elimination.
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
  }

  return (
    <div className="flex h-screen">
      {/* Left Side */}
      <div className="w-1/2 p-6 bg-gray-100 dark:bg-gray-800 flex flex-col justify-start items-center">
        {randomTheme ? (
          <>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              {randomTheme.suggestion}
            </h2>
            <div className="flex gap-4">
              <button
                onClick={() => handleVote("YES")}
                className={`px-6 py-3 font-bold rounded-lg ${
                  themeLoading[randomTheme?.id || -1]
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
                disabled={themeLoading[randomTheme?.id || -1]}
              >
                YES
              </button>
              <button
                onClick={() => handleVote("NO")}
                className={`px-6 py-3 font-bold rounded-lg ${
                  themeLoading[randomTheme?.id || -1]
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-red-500 text-white hover:bg-red-600"
                }`}
                disabled={themeLoading[randomTheme?.id || -1]}
              >
                NO
              </button>
              <button
                onClick={() => handleVote("SKIP")}
                className={`px-6 py-3 font-bold rounded-lg ${
                  themeLoading[randomTheme?.id || -1]
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-gray-500 text-white hover:bg-gray-600"
                }`}
                disabled={themeLoading[randomTheme?.id || -1]}
              >
                SKIP
              </button>
            </div>
          </>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            No themes available.
          </p>
        )}
      </div>

      {/* Right Side */}
      <div className="w-1/2 p-6 bg-white dark:bg-gray-900 overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
          Your Votes
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {votedThemes.map((theme) => (
            <div
              key={theme.id}
              onClick={() => handleResetVote(theme.id)}
              className={`p-4 rounded-lg cursor-pointer ${
                theme.slaughterScore > 0
                  ? "bg-green-500 text-white"
                  : theme.slaughterScore < 0
                  ? "bg-red-500 text-white"
                  : "bg-gray-300 text-black"
              }`}
            >
              {theme.suggestion}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  return <></>;
}
