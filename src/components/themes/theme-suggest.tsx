"use client";

import React, { useState, useEffect } from "react";
import { getCookie } from "@/helpers/cookie";
import {
  getCurrentJam,
  hasJoinedCurrentJam,
  ActiveJamResponse,
} from "@/helpers/jam";
import { ThemeType } from "@/types/ThemeType";
import { joinJam } from "@/helpers/jam";
import {
  deleteThemeSuggestion,
  getThemeSuggestions,
  postThemeSuggestion,
} from "@/requests/theme";

export default function ThemeSuggestions() {
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [userSuggestions, setUserSuggestions] = useState<ThemeType[]>([]);
  const [themeLimit, setThemeLimit] = useState(0);
  const [hasJoined, setHasJoined] = useState<boolean>(false);
  const [activeJamResponse, setActiveJamResponse] =
    useState<ActiveJamResponse | null>(null);
  const [phaseLoading, setPhaseLoading] = useState(true); // Loading state for fetching phase

  // Fetch the current jam phase using helpers/jam
  useEffect(() => {
    const fetchCurrentJamPhase = async () => {
      try {
        const activeJam = await getCurrentJam();
        setActiveJamResponse(activeJam); // Set active jam details
        if (activeJam?.jam) {
          setThemeLimit(activeJam.jam.themePerUser || Infinity); // Set theme limit
        }
      } catch (error) {
        console.error("Error fetching current jam:", error);
      } finally {
        setPhaseLoading(false); // Stop loading when phase is fetched
      }
    };

    fetchCurrentJamPhase();
  }, []);

  // Fetch all suggestions for the logged-in user
  const fetchSuggestions = async () => {
    try {
      const response = await getThemeSuggestions();
      if (response.ok) {
        const data = await response.json();
        setUserSuggestions(data);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  // Fetch suggestions only when phase is "Suggestion"
  useEffect(() => {
    if (activeJamResponse?.phase === "Suggestion") {
      fetchSuggestions();
    }
  }, [activeJamResponse]);

  // Handle form submission to add a new suggestion
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    if (!suggestion.trim()) {
      setErrorMessage("Suggestion cannot be empty.");
      setLoading(false);
      return;
    }

    try {
      const token = getCookie("token");

      if (!token) {
        throw new Error("User is not authenticated. Please log in.");
      }

      const response = await postThemeSuggestion(suggestion);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit suggestion.");
      }

      setSuccessMessage("Suggestion added successfully!");
      setSuggestion(""); // Clear input field
      fetchSuggestions(); // Refresh suggestions list
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error submitting suggestion:", error.message);
        setErrorMessage(error.message || "An unexpected error occurred.");
      } else {
        console.error("Unknown error:", error);
        setErrorMessage("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting a suggestion
  const handleDelete = async (id: number) => {
    try {
      const response = await deleteThemeSuggestion(id);

      if (!response.ok) {
        throw new Error("Failed to delete suggestion.");
      }

      fetchSuggestions(); // Refresh suggestions list
    } catch (error) {
      console.error("Error deleting suggestion:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      const joined = await hasJoinedCurrentJam();
      setHasJoined(joined);
      setLoading(false);
    };

    init();
  }, []);

  // Render loading state while fetching phase
  if (phaseLoading || loading) {
    return <div>Loading...</div>;
  }

  const token = getCookie("token");

  if (!token) {
    return <div>Sign in to be able to suggest themes</div>;
  }

  if (!hasJoined) {
    return (
      <div className="p-6 bg-gray-100 dark:bg-gray-800 min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Join the Jam First
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          You need to join the current jam before you can suggest themes.
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

  // Render message if not in Suggestion phase
  if (activeJamResponse?.phase !== "Suggestion") {
    return (
      <div className="p-6 bg-gray-100 dark:bg-gray-800 min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Not in Suggestion Phase
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          The current phase is{" "}
          <strong>{activeJamResponse?.phase || "Unknown"}</strong>. Please come
          back during the Suggestion phase.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
        Submit Your Theme Suggestion
      </h2>

      {/* Hide form if user has reached their limit */}
      {userSuggestions.length < themeLimit ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            className="w-full p-3 border rounded-lg focus:outline-none text-gray-600 focus:ring focus:ring-blue-300 dark:bg-gray-700 dark:text-white"
            placeholder="Enter your theme suggestion..."
            value={suggestion}
            onChange={(e) => {
              if (e.target.value.length <= 32) {
                setSuggestion(e.target.value);
              }
            }}
            rows={1}
            maxLength={32}
          ></textarea>
          {errorMessage && (
            <p className="text-red-500 text-sm">{errorMessage}</p>
          )}
          {successMessage && (
            <p className="text-green-500 text-sm">{successMessage}</p>
          )}
          <button
            type="submit"
            className={`w-full py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Suggestion"}
          </button>
        </form>
      ) : (
        <p className="text-yellow-500 text-sm">
          You&apos;ve reached your theme suggestion limit for this jam!
        </p>
      )}

      {/* List of user's suggestions */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Your Suggestions
        </h3>
        {userSuggestions.length > 0 ? (
          <ul className="space-y-4">
            {userSuggestions.map((suggestion) => (
              <li
                key={suggestion.id}
                className="flex justify-between items-center text-gray-400 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg shadow-sm"
              >
                <span>{suggestion.suggestion}</span>
                <button
                  onClick={() => handleDelete(suggestion.id)}
                  className="text-red-500 hover:text-red-700 font-semibold"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            You haven&apos;t submitted any suggestions yet.
          </p>
        )}
      </div>
    </div>
  );
}
