"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { addToast, Spinner } from "@heroui/react";

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
  const [examples, setExamples] = useState("");
  const [loading, setLoading] = useState(false);
  const [userSuggestions, setUserSuggestions] = useState<ThemeType[]>([]);
  const [themeLimit, setThemeLimit] = useState(0);
  const [hasJoined, setHasJoined] = useState<boolean>(false);
  const [activeJamResponse, setActiveJamResponse] =
    useState<ActiveJamResponse | null>(null);
  const [phaseLoading, setPhaseLoading] = useState(true); // Loading state for fetching phase
  const inputRef = useRef<HTMLInputElement | null>(null);

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
        if (data.data) {
          setUserSuggestions(data.data);
        }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!suggestion.trim()) {
      addToast({ title: "Suggestion cannot be empty" });
      setLoading(false);
      return;
    }

    if (bannedThemes.includes(suggestion.toLowerCase().replaceAll(/\W/g, ""))) {
      addToast({
        title:
          "That suggestion cannot be used (it likely has been used recently for another jam)",
      });
      setLoading(false);
      return;
    }

    try {
      const token = getCookie("token");
      if (!token) throw new Error("User is not authenticated. Please log in.");

      const response = await postThemeSuggestion(
        suggestion,
        examples.trim() || null
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit suggestion.");
      }

      addToast({ title: "Suggestion added successfully!" });
      setSuggestion("");
      setExamples(""); // clear examples too
      fetchSuggestions();
    } catch (error) {
      addToast({
        title:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (t: ThemeType) => {
    try {
      const response = await deleteThemeSuggestion(t.id);
      if (!response.ok) throw new Error("Failed to delete suggestion.");

      addToast({ title: "Suggestion removed and populated input" });

      setSuggestion(t.suggestion);
      setExamples(t.description || "");

      requestAnimationFrame(() => {
        inputRef.current?.focus();
        const el = inputRef.current;
        if (el) {
          const end = el.value.length;
          el.setSelectionRange(end, end);
        }
      });

      fetchSuggestions();
    } catch (error) {
      console.error("Error editing suggestion:", error);
      addToast({ title: "Error deleting suggestion for edit" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await deleteThemeSuggestion(id);

      if (!response.ok) {
        throw new Error("Failed to delete suggestion.");
      }

      addToast({
        title: "Deleted theme suggestion",
      });
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
    return (
      <Vstack>
        <Card className="max-w-96">
          <Vstack>
            <Hstack>
              <Spinner />
              <Text size="xl">ThemeSuggestions.Loading.Title</Text>
            </Hstack>
            <Text color="textFaded">ThemeSuggestions.Loading.Description</Text>
          </Vstack>
        </Card>
      </Vstack>
    );
  }

  const token = getCookie("token");

  if (!token) {
    return (
      <Vstack>
        <Card className="max-w-96">
          <Vstack>
            <Vstack gap={0}>
              <Hstack>
                <Icon name="userx" />
                <Text size="xl">ThemeSuggestions.SignIn.Title</Text>
              </Hstack>
              <Text color="textFaded">ThemeSuggestions.SignIn.Description</Text>
            </Vstack>
            <Hstack>
              <Button href="/signup" color="blue" icon="userplus">
                Themes.Signup
              </Button>
              <Button href="/login" color="pink" icon="login">
                Themes.Login
              </Button>
            </Hstack>
          </Vstack>
        </Card>
      </Vstack>
    );
  }

  if (!hasJoined) {
    return (
      <Vstack>
        <Card>
          <Vstack>
            <Vstack gap={0}>
              <Hstack>
                <Icon name="userplus" />
                <Text size="xl">ThemeSuggestions.JoinJam.Title</Text>
              </Hstack>
              <Text color="textFaded">
                ThemeSuggestions.JoinJam.Description
              </Text>
            </Vstack>
            <Button
              onClick={async () => {
                if (activeJamResponse?.jam?.id !== undefined) {
                  const ok = await joinJam(activeJamResponse.jam.id);

                  if (ok) {
                    setHasJoined(true);
                  }
                }
              }}
              icon="calendarplus"
              color="green"
            >
              Navbar.JoinJam.Title
            </Button>
          </Vstack>
        </Card>
      </Vstack>
    );
  }

  // Render message if not in Suggestion phase
  if (activeJamResponse?.phase !== "Suggestion") {
    return (
      <Vstack>
        <Card className="max-w-96">
          <Vstack>
            <Vstack gap={0}>
              <Hstack>
                <Icon name="x" />
                <Text size="xl">Not in Suggestion Phase</Text>
              </Hstack>
              <Text color="textFaded">
                The current phase is{" "}
                <strong>{activeJamResponse?.phase || "Unknown"}</strong>. Please
                come back during the Suggestion phase.
              </Text>
            </Vstack>
          </Vstack>
        </Card>
      </Vstack>
    );
  }

  return (
    <Vstack>
      <Card>
        <Vstack align="stretch">
          <Vstack align="center" gap={0}>
            <Hstack>
              <Icon name="sparkles" />
              <Text size="xl">ThemeSuggestions.Title</Text>
            </Hstack>
            <Text color="textFaded" size="sm">
              ThemeSuggestions.Description
            </Text>
          </Vstack>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Vstack gap={0} align="start">
              <Text color="text">Theme</Text>
              <Text color="textFaded" size="xs">
                The theme idea that people would build their games around
              </Text>
            </Vstack>
            <Input
              className="w-full"
              placeholder="Enter your theme suggestion..."
              required
              disabled={userSuggestions.length >= themeLimit}
              value={suggestion}
              onChange={(e) => {
                if (e.target.value.length <= 32) {
                  setSuggestion(e.target.value);
                }
              }}
              maxLength={64}
            ></Input>
            <Vstack gap={0} align="start">
              <Text color="text">Clarification</Text>
              <Text color="textFaded" size="xs" className="max-w-96">
                You can optionally detail why do you think this is a good theme
                and/or give examples of games that can be made with it. For
                example, with the theme echoes people might take that as things
                bouncing, audio repetition, visual repetition, story echoes,
                previous actions affecting future situations, areas that change
                over time, etc.
              </Text>
            </Vstack>
            <Input
              className="w-full"
              placeholder="Enter clarification... (optional)"
              disabled={userSuggestions.length >= themeLimit}
              value={examples}
              onChange={(e) => {
                if (e.target.value.length <= 256) setExamples(e.target.value);
              }}
              maxLength={256}
            />
            <Button
              type="submit"
              disabled={userSuggestions.length >= themeLimit}
              color={userSuggestions.length >= themeLimit ? "yellow" : "blue"}
              icon="send"
            >
              {loading ? "Submitting..." : "Submit Suggestion"}
            </Button>
          </form>

          {userSuggestions.length >= themeLimit && (
            <Vstack>
              <Text color="yellow" size="sm">
                You&apos;ve reached your theme suggestion limit for this jam!
              </Text>
              <Text color="textFaded" size="sm">
                Theme voting will start once the theme submission phase ends.
              </Text>
              <Text color="textFaded" size="sm">
                Feel free to make a post on the forum introducing yourself!
              </Text>
              <Hstack>
                <Button icon="messagessquare" href="/home">
                  To Forum
                </Button>
                <Button icon="squarepen" href="/create-post">
                  Create Post
                </Button>
              </Hstack>
            </Vstack>
          )}
        </Vstack>
      </Card>
      <Card>
        {/* List of user's suggestions */}
        <Vstack align="center">
          <Text size="xl">Your Suggestions</Text>
          {userSuggestions.length > 0 ? (
            <Vstack className="w-full">
              {userSuggestions.map((suggestion) => (
                <Card key={suggestion.id} className="w-full">
                  <Hstack justify="between" className="w-full" gap={12}>
                    <Hstack>
                      <Icon name="lightbulb" color="textFaded" />
                      <Vstack align="start" gap={0}>
                        <Text>{suggestion.suggestion}</Text>

                        <Text size="xs" color="textFaded" className="max-w-96">
                          {suggestion.description
                            ? suggestion.description
                            : "No clarification"}
                        </Text>
                      </Vstack>
                    </Hstack>
                    <Hstack>
                      <Button
                        onClick={() => handleEdit(suggestion)}
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
      </Card>
    </Vstack>
  );
}
