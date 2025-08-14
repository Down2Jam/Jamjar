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
import { Card } from "@/framework/Card";
import Text from "@/framework/Text";
import { Hstack, Vstack } from "@/framework/Stack";
import { Button } from "@/framework/Button";
import { Input } from "@/framework/Input";
import Icon from "@/framework/Icon";

const bannedThemes = [
  "pgorley",
  "depths",
  "tinycreatures",
  "summoning",
  "limitedspace",
  "delivery",
  "harvest",
  "every10seconds",
  "everytenseconds",
  "delaytheinevitable",
  "unstable",
  "deeperanddeeper",
  "stuckinaloop",
  "keepitalive",
  "startwithnothing",
  "yourlifeiscurrency",
  "sacrificesmustbemade",
  "runningoutofspace",
  "combinetwoincompatiblegenres",
  "themoreyouhavetheworseitis",
  "runningoutofpower",
  "asmallworld",
  "oneroom",
  "ancienttechnology",
  "shapeshift",
  "growing",
  "twobuttoncontrols",
  "youarethemonster",
  "genrewithoutmechanic",
  "onlyone",
  "outofcontrol",
  "joinedtogether",
  "rollofthedice",
  "rolesreversed",
  "builttoscale",
  "loop",
  "train",
  "trains",
  "whatdowedonow",
  "ritual",
  "waves",
  "transmission",
  "whathomemeanstoyou",
  "repair",
  "lostandfound",
  "duality",
  "roots",
  "makemelaugh",
  "bubble",
  "gravity",
  "inaloop",
  "floatingislands",
  "labyrinth",
  "river",
  "islands",
  "books",
  "fungi",
  "robots",
  "caves",
  "ancientruins",
  "maps",
  "chaos",
  "ships",
  "nothingcangowrong",
  "calmbeforethestorm",
  "whatsbehindthedoor",
  "divingdeeper",
  "anendisanewbeginning",
  "yourenotalone",
  "itisnotreal",
  "lettherebechaos",
  "strongertogether",
  "rewind",
  "holes",
  "loveisblind",
  "light",
  "onlyone",
  "youaretheweapon",
  "shadowsandalchemy",
  "cliche",
  "cliché",
  "scale",
  "spin",
  "bug",
  "power",
  "thegameisaliar",
];

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

    if (bannedThemes.includes(suggestion.toLowerCase().replaceAll(/\W/g, ""))) {
      setErrorMessage(
        "That suggestion cannot be used (it likely has been used recently for another jam)."
      );
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
    return (
      <Vstack>
        <Card className="max-w-96">
          <Vstack align="start">
            <Text>Sign in to be able to suggest themes</Text>
            <Hstack>
              <Button href="/signup">Sign up</Button>
              <Button href="/login">Login</Button>
            </Hstack>
          </Vstack>
        </Card>
      </Vstack>
    );
  }

  if (!hasJoined) {
    return (
      <Card>
        <Text size="2xl" weight="bold">
          Join the Jam First
        </Text>
        <Text color="textFaded">
          You need to join the current jam before you can suggest themes.
        </Text>
        <Button
          onClick={() => {
            if (activeJamResponse?.jam?.id !== undefined) {
              joinJam(activeJamResponse.jam.id);
            }
          }}
          color="blue"
        >
          Join Jam
        </Button>
      </Card>
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
    <Card className="max-w-md mx-auto mt-8">
      <Vstack align="stretch">
        <Text weight="bold" size="xl">
          Submit Your Theme Suggestion
        </Text>

        {/* Hide form if user has reached their limit */}
        {userSuggestions.length < themeLimit ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              className="w-full"
              placeholder="Enter your theme suggestion..."
              value={suggestion}
              onChange={(e) => {
                if (e.target.value.length <= 32) {
                  setSuggestion(e.target.value);
                }
              }}
              maxLength={64}
            ></Input>
            {errorMessage && (
              <Text color="red" size="sm">
                {errorMessage}
              </Text>
            )}
            {successMessage && (
              <Text color="green" size="sm">
                {successMessage}
              </Text>
            )}
            <Button type="submit" color="blue" icon="send">
              {loading ? "Submitting..." : "Submit Suggestion"}
            </Button>
          </form>
        ) : (
          <Text color="yellow" size="sm">
            You&apos;ve reached your theme suggestion limit for this jam!
          </Text>
        )}

        {/* List of user's suggestions */}
        <Vstack align="start">
          <Text weight="semibold" size="lg">
            Your Suggestions
          </Text>
          {userSuggestions.length > 0 ? (
            <Vstack className="w-full">
              {userSuggestions.map((suggestion) => (
                <Card key={suggestion.id} className="w-full">
                  <Hstack justify="between" className="w-full">
                    <Hstack>
                      <Icon name="lightbulb" color="textFaded" />
                      <Vstack align="start" gap={0}>
                        <Text>{suggestion.suggestion}</Text>
                        <Text size="xs" color="textFaded">
                          No description
                        </Text>
                      </Vstack>
                    </Hstack>
                    <Hstack>
                      <Button
                        onClick={() => handleDelete(suggestion.id)}
                        icon="pencil"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(suggestion.id)}
                        color="red"
                        icon="trash"
                      >
                        Delete
                      </Button>
                    </Hstack>
                  </Hstack>
                </Card>
              ))}
            </Vstack>
          ) : (
            <Text color="textFaded">
              You haven&apos;t submitted any suggestions yet.
            </Text>
          )}
        </Vstack>
      </Vstack>
    </Card>
  );
}
