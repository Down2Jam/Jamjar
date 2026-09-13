"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { useState, useEffect, useRef } from "react";
import { getCookie } from "@/helpers/cookie";
import {
  hasJoinedCurrentJam,
} from "@/helpers/jam";
import { useCurrentJam } from "@/hooks/queries";
import { ThemeType } from "@/types/ThemeType";
import { joinJam } from "@/helpers/jam";
import {
  deleteThemeSuggestion,
  getThemeSuggestions,
  postThemeSuggestion,
} from "@/requests/theme";
import { Card } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import { Button } from "bioloom-ui";
import { Input } from "bioloom-ui";
import { Icon } from "bioloom-ui";
import { addToast } from "bioloom-ui";
import { Spinner } from "bioloom-ui";

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
  const uiText = useUiTranslations();
  const [suggestion, setSuggestion] = useState("");
  const [examples, setExamples] = useState("");
  const [loading, setLoading] = useState(false);
  const [userSuggestions, setUserSuggestions] = useState<ThemeType[]>([]);
  const [themeLimit, setThemeLimit] = useState(0);
  const [hasJoined, setHasJoined] = useState<boolean>(false);
  const token = getCookie("token");
  const { data: activeJamResponse, isLoading: jamLoading } = useCurrentJam();
  const [phaseLoading, setPhaseLoading] = useState(true); // Loading state for fetching phase
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Derive theme limit and loading from hook data
  useEffect(() => {
    if (jamLoading) return;
    if (activeJamResponse?.jam) {
      setThemeLimit(activeJamResponse.jam.themePerUser || Infinity);
    }
    setPhaseLoading(false);
  }, [activeJamResponse, jamLoading]);

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
    if (token && activeJamResponse?.phase === "Suggestion") {
      fetchSuggestions();
    }
  }, [activeJamResponse, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!suggestion.trim()) {
      addToast({ title: uiText("AppStrings.SuggestionCannotBeEmpty") });
      setLoading(false);
      return;
    }

    if (bannedThemes.includes(suggestion.toLowerCase().replaceAll(/\W/g, ""))) {
      addToast({
        title:
          uiText("AppStrings.ThatSuggestionCannotBeUsedItLikelyHas"),
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
        const errorData: {
          error?: string | { message?: string };
        } = await response.json();
        const errorMessage =
          typeof errorData.error === "string"
            ? errorData.error
            : errorData.error?.message;
        throw new Error(errorMessage || "Failed to submit suggestion.");
      }

      addToast({ title: uiText("ThemeSuggestions.Added") });
      setSuggestion("");
      setExamples(""); // clear examples too
      fetchSuggestions();
    } catch (error) {
      addToast({
        title:
          error instanceof Error
            ? error.message
            : uiText("AppStrings.AnUnexpectedErrorOccurred"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (t: ThemeType) => {
    try {
      const response = await deleteThemeSuggestion(t.id);
      if (!response.ok) throw new Error("Failed to delete suggestion.");

      addToast({ title: uiText("AppStrings.SuggestionRemovedAndPopulatedInput") });

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
      addToast({ title: uiText("AppStrings.ErrorDeletingSuggestionForEdit") });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await deleteThemeSuggestion(id);

      if (!response.ok) {
        throw new Error("Failed to delete suggestion.");
      }

      addToast({
        title: uiText("AppStrings.DeletedThemeSuggestion"),
      });
      fetchSuggestions(); // Refresh suggestions list
    } catch (error) {
      console.error("Error deleting suggestion:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      const joined = await hasJoinedCurrentJam();
      setHasJoined(joined);
      setLoading(false);
    };

    init();
  }, [token]);

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

  if (token && !hasJoined) {
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
                <Text size="xl">{uiText("AppStrings.NotInSuggestionPhase")}</Text>
              </Hstack>
              <Text color="textFaded">
                 {uiText("AppStrings.TheCurrentPhaseIs")}{" "}
                <strong>{activeJamResponse?.phase || uiText("AppStrings.Unknown")}</strong>{uiText("AppStrings.PleaseComeBackDuringTheSuggestionPhase")} </Text>
            </Vstack>
          </Vstack>
        </Card>
      </Vstack>
    );
  }

  return (
    <Vstack>
      {!token && (
        <Hstack>
          <Icon name="userx" />
          <Text color="textFaded">{uiText("AppStrings.SignInAndJoinTheJamToSuggestATheme")}</Text>
          <Button href="/login" color="pink" icon="login">
            Themes.Login
          </Button>
        </Hstack>
      )}
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
              <Text color="text">{uiText("RatingCategory.Theme.Title")}</Text>
              <Text color="textFaded" size="xs">
                 {uiText("AppStrings.TheThemeIdeaThatPeopleWouldBuildTheir")} </Text>
            </Vstack>
            <Input
              className="w-full"
              placeholder={uiText("AppStrings.EnterYourThemeSuggestion")}
              required
              disabled={!token || userSuggestions.length >= themeLimit}
              value={suggestion}
              onChange={(e) => {
                if (e.target.value.length <= 32) {
                  setSuggestion(e.target.value);
                }
              }}
              maxLength={64}
            ></Input>
            <Vstack gap={0} align="start">
              <Text color="text">{uiText("AppStrings.Clarification")}</Text>
              <Text color="textFaded" size="xs" className="max-w-96">
                 {uiText("AppStrings.YouCanOptionallyDetailWhyDoYouThinkThisIsAGoodThemeAndOrGiveExamplesOfGamesThatCanBeM")} </Text>
            </Vstack>
            <Input
              className="w-full"
              placeholder={uiText("AppStrings.EnterClarificationOptional")}
              disabled={!token || userSuggestions.length >= themeLimit}
              value={examples}
              onChange={(e) => {
                if (e.target.value.length <= 256) setExamples(e.target.value);
              }}
              maxLength={256}
            />
            <Button
              type="submit"
              disabled={!token || userSuggestions.length >= themeLimit}
              color={userSuggestions.length >= themeLimit ? "yellow" : "blue"}
              icon="send"
            >
              {loading ? uiText("AppStrings.Submitting2") : uiText("AppStrings.SubmitSuggestion")}
            </Button>
          </form>

          {userSuggestions.length >= themeLimit && (
            <Vstack>
              <Text color="yellow" size="sm">
                 {uiText("AppStrings.YouAndAposVeReachedYourThemeSuggestion")} </Text>
              <Text color="textFaded" size="sm">
                 {uiText("AppStrings.ThemeVotingWillStartOnceTheThemeSubmission")} </Text>
              <Text color="textFaded" size="sm">
                 {uiText("AppStrings.FeelFreeToMakeAPostOnThe")} </Text>
              <Hstack>
                <Button icon="messagessquare" href="/home">
                   {uiText("AppStrings.ToForum")} </Button>
                <Button icon="squarepen" href="/create-post">
                   {uiText("Navbar.CreatePost.Title")} </Button>
              </Hstack>
            </Vstack>
          )}
        </Vstack>
      </Card>
      {token && <Card>
        {/* List of user's suggestions */}
        <Vstack align="center">
          <Text size="xl">{uiText("ThemeSuggestions.YourSuggestions.Title")}</Text>
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
                            : uiText("AppStrings.NoClarification")}
                        </Text>
                      </Vstack>
                    </Hstack>
                    <Hstack>
                      <Button
                        onClick={() => handleEdit(suggestion)}
                        icon="pencil"
                      >
                         {uiText("ThemeSuggestions.Edit.Title")} </Button>
                      <Button
                        onClick={() => handleDelete(suggestion.id)}
                        color="red"
                        icon="trash"
                      >
                         {uiText("ThemeSuggestions.Delete.Title")} </Button>
                    </Hstack>
                  </Hstack>
                </Card>
              ))}
            </Vstack>
          ) : (
            <Text color="textFaded">
               {uiText("AppStrings.YouHavenAndAposTSubmittedAnySuggestions")} </Text>
          )}
        </Vstack>
      </Card>}
    </Vstack>
  );
}
