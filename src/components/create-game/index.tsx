"use client";

import Editor from "@/components/editor";
import { getCookie } from "@/helpers/cookie";
import { addToast, Avatar, Form } from "@heroui/react";
import { LandPlot, Rabbit, Trophy, Turtle } from "lucide-react";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { Select as NextSelect, SelectItem } from "@heroui/react";
import { UserType } from "@/types/UserType";
import { redirect, useRouter } from "next/navigation";
import { PlatformType, DownloadLinkType } from "@/types/DownloadLinkType";
import { getSelf } from "@/requests/user";
import {
  getCurrentGame,
  getFlags,
  getGameTags,
  getRatingCategories,
  postGame,
  updateGame,
} from "@/requests/game";
import { sanitize } from "@/helpers/sanitize";
import Image from "next/image";
import { createTeam } from "@/helpers/team";
import { RatingCategoryType } from "@/types/RatingCategoryType";
import { GameType } from "@/types/GameType";
import { TeamType } from "@/types/TeamType";
import { getTeamsUser } from "@/requests/team";
import { ActiveJamResponse, getCurrentJam } from "@/helpers/jam";
import { LeaderboardType, LeaderboardTypeType } from "@/types/LeaderboardType";
import { AchievementType } from "@/types/AchievementType";
import { GameTagType } from "@/types/GameTagType";
import { FlagType } from "@/types/FlagType";
import { getIcon } from "@/helpers/icon";
import Select, { StylesConfig } from "react-select";
import { Button } from "@/framework/Button";
import Dropdown from "@/framework/Dropdown";
import { Input } from "@/framework/Input";
import { Switch } from "@/framework/Switch";
import { Textarea } from "@/framework/Textarea";
import { Card } from "@/framework/Card";
import { Hstack, Vstack } from "@/framework/Stack";
import Icon from "@/framework/Icon";
import Text from "@/framework/Text";
import { Spinner } from "@/framework/Spinner";

const theme = "dark";

export default function CreateGame() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [themeJustification, setThemeJustification] = useState("");
  const [waitingPost, setWaitingPost] = useState(false);
  const [editGame, setEditGame] = useState(false);
  const [mounted, setMounted] = useState<boolean>(false);

  const [gameSlug, setGameSlug] = useState("");
  const [prevSlug, setPrevGameSlug] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [downloadLinks, setDownloadLinks] = useState<DownloadLinkType[]>([]);
  const [editorKey, setEditorKey] = useState(0);
  const [ratingCategories, setRatingCategories] = useState<
    RatingCategoryType[]
  >([]);
  const urlRegex = /^(https?:\/\/)/;

  const [games, setGames] = useState<GameType[]>([]);
  const [currentGame, setCurrentGame] = useState<number>(0);
  const [category, setCategory] = useState<"REGULAR" | "ODA" | "EXTRA">(
    "REGULAR"
  );
  const [currentTeam, setCurrentTeam] = useState<number>(0);
  const [teams, setTeams] = useState<TeamType[]>([]);
  const [activeJamResponse, setActiveJam] = useState<ActiveJamResponse | null>(
    null
  );
  const [chosenRatingCategories, setChosenRatingCategories] = useState<
    number[]
  >([]);
  const [chosenMajRatingCategories, setChosenMajRatingCategories] = useState<
    number[]
  >([]);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [allFlags, setAllFlags] = useState<FlagType[]>([]);
  const [allTags, setAllTags] = useState<GameTagType[]>([]);
  const [flags, setFlags] = useState<number[]>([]);
  const [tags, setTags] = useState<number[]>([]);
  const [leaderboards, setLeaderboards] = useState<LeaderboardType[]>([]);
  const [achievements, setAchievements] = useState<AchievementType[]>([]);

  const sanitizeSlug = (value: string): string => {
    return value
      .toLowerCase() // Convert to lowercase
      .replace(/\s+/g, "-") // Replace whitespace with hyphens
      .replace(/[^a-z0-9-]/g, "") // Only allow lowercase letters, numbers, and hyphens
      .substring(0, 50); // Limit length to 50 characters
  };

  useEffect(() => {
    setMounted(true);

    const load = async () => {
      try {
        const response = await getSelf();
        const localuser = (await response.json()) as UserType;

        const ratingResponse = await getRatingCategories();
        const ratingCategories = await ratingResponse.json();
        setRatingCategories(ratingCategories.data);

        const flagsResponse = await getFlags();
        const flagsData = await flagsResponse.json();
        setAllFlags(
          flagsData.data.sort((a: FlagType, b: FlagType) =>
            a.name.localeCompare(b.name)
          )
        );

        const tagsResponse = await getGameTags();
        const tagsData = await tagsResponse.json();
        setAllTags(tagsData.data);

        const activeJam = await getCurrentJam();
        setActiveJam(activeJam);
        setCategory(activeJam?.phase == "Rating" ? "EXTRA" : "REGULAR");

        if (localuser.teams.length == 0) {
          const successful = await createTeam();
          if (successful) {
          } else {
            addToast({
              title: "Error while creating team",
            });
            redirect("/");
          }
        }

        const teamResponse = await getTeamsUser();

        if (teamResponse.status == 200) {
          const data = await teamResponse.json();
          const filteredTeams = data.data.filter(
            (team: TeamType) => !team.game
          );

          setTeams(filteredTeams);
        } else {
          setTeams([]);
        }

        setDataLoaded(true);
      } catch (error) {
        console.error(error);
      }
    };
    load();
  }, []);

  const changeGame = useCallback(
    (newid: number, games: GameType[]) => {
      setCurrentGame(newid);

      if (!games) return;
      if (!allFlags || allFlags.length == 0) return;
      if (!allTags || allTags.length == 0) return;
      if (games.length == 0) return;

      setTitle(games[newid].name);
      setGameSlug(games[newid].slug);
      setPrevGameSlug(games[newid].slug);
      setContent(games[newid].description || "");
      setThemeJustification(games[newid].themeJustification || "");
      setEditorKey((prev) => prev + 1);
      setThumbnailUrl(games[newid].thumbnail || null);
      setBannerUrl(games[newid].banner || null);
      setDownloadLinks(games[newid].downloadLinks || []);
      setAchievements(games[newid].achievements || []);
      setFlags(
        games[newid].flags
          ?.map((flag) => allFlags.findIndex((f) => f.id === flag.id))
          .filter((index) => index !== -1) || []
      );
      setTags(
        games[newid].tags
          ?.map((tag) => allTags.findIndex((f) => f.id === tag.id))
          .filter((index) => index !== -1) || []
      );
      setLeaderboards(games[newid].leaderboards || []);
      setCategory(games[newid].category);
      setChosenRatingCategories(
        games[newid].ratingCategories.map((ratingCategory) => ratingCategory.id)
      );
      setChosenMajRatingCategories(
        games[newid].majRatingCategories.map(
          (ratingCategory) => ratingCategory.id
        )
      );
    },
    [allFlags, allTags]
  );

  const changeTeam = useCallback((newid: number) => {
    setCurrentTeam(newid);
  }, []);

  const styles: StylesConfig<
    {
      value: string;
      id: number;
      label: ReactNode;
    },
    true
  > = {
    multiValue: (base) => {
      return {
        ...base,
        backgroundColor: theme == "dark" ? "#444" : "#eee",
      };
    },
    multiValueLabel: (base) => {
      return {
        ...base,
        color: theme == "dark" ? "#fff" : "#444",
        fontWeight: "bold",
        paddingRight: "2px",
      };
    },
    multiValueRemove: (base) => {
      return {
        ...base,
        display: "flex",
        color: theme == "dark" ? "#ddd" : "#222",
      };
    },
    control: (styles) => ({
      ...styles,
      backgroundColor: theme == "dark" ? "#181818" : "#fff",
      minWidth: "300px",
    }),
    menu: (styles) => ({
      ...styles,
      backgroundColor: theme == "dark" ? "#181818" : "#fff",
      color: theme == "dark" ? "#fff" : "#444",
      zIndex: 100,
    }),
    option: (styles, { isFocused }) => ({
      ...styles,
      backgroundColor: isFocused
        ? theme == "dark"
          ? "#333"
          : "#ddd"
        : undefined,
    }),
  };

  useEffect(() => {
    const checkExistingGame = async () => {
      const response = await getCurrentGame();

      if (response.ok) {
        const gameData = (await response.json()).data;
        if (gameData.length > 0) {
          setGames(gameData);
          setEditGame(true);
          changeGame(0, gameData);
        } else {
          if (teams.length == 0) {
            addToast({
              title: "No available teams",
            });
            redirect("/");
          }
        }
      }
    };

    if (mounted && dataLoaded) {
      checkExistingGame();
    }
  }, [teams, mounted, changeGame, dataLoaded]);

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

  return (
    <Vstack>
      <Form
        className="w-full max-w-2xl flex flex-col gap-4 text-[#333] dark:text-white"
        onSubmit={async (e) => {
          e.preventDefault();

          if (!title) {
            addToast({
              title: "Please enter a valid title",
            });
            return;
          }

          const userSlug = getCookie("user"); // Retrieve user slug from cookies
          if (!userSlug) {
            addToast({
              title: "You are not logged in",
            });
            return;
          }

          const sanitizedHtml = sanitize(content);
          setWaitingPost(true);

          const submitter = (e.nativeEvent as SubmitEvent)
            .submitter as HTMLButtonElement;

          let publishValue = games[currentGame]
            ? games[currentGame].published
            : false;

          if (submitter.value === "publish") {
            publishValue = true;
          }

          if (submitter.value === "unpublish") {
            publishValue = false;
          }

          try {
            const links = downloadLinks.map((link) => ({
              url: link.url,
              platform: link.platform,
            }));

            const request = editGame
              ? updateGame(
                  prevSlug,
                  title,
                  gameSlug,
                  sanitizedHtml,
                  thumbnailUrl,
                  bannerUrl,
                  links,
                  userSlug,
                  category,
                  chosenRatingCategories,
                  chosenMajRatingCategories,
                  publishValue,
                  themeJustification,
                  achievements,
                  Array.from(flags).map((thing) => allFlags[thing].id),
                  Array.from(tags).map((thing) => allTags[thing].id),
                  leaderboards
                )
              : postGame(
                  title,
                  gameSlug,
                  sanitizedHtml,
                  thumbnailUrl,
                  bannerUrl,
                  links,
                  userSlug,
                  category,
                  teams[currentTeam].id,
                  chosenRatingCategories,
                  chosenMajRatingCategories,
                  publishValue,
                  themeJustification,
                  achievements,
                  Array.from(flags).map((thing) => allFlags[thing].id),
                  Array.from(tags).map((thing) => allTags[thing].id),
                  leaderboards
                );

            const response = await request;

            if (response.ok) {
              addToast({
                title: prevSlug
                  ? "Game updated successfully!"
                  : "Game created successfully!",
              });
              setWaitingPost(false);
              router.push(`/g/${gameSlug || sanitizeSlug(title)}`);
            } else {
              const error = await response.text();
              addToast({
                title: error || "Failed to create game",
              });
              setWaitingPost(false);
            }
          } catch (error) {
            console.error("Error creating game:", error);
            addToast({
              title: "Failed to create game.",
            });
          }
        }}
      >
        <Vstack align="start">
          <Card>
            <Vstack align="start">
              <Hstack>
                <Icon name="gamepad2" color="text" />
                <Text size="xl" color="text" weight="semibold">
                  {prevSlug ? "Edit Game" : "Create New Game"}
                </Text>
              </Hstack>
              <Text size="sm" color="textFaded">
                {prevSlug
                  ? "Edit the page for a game you've made"
                  : "Create a new page for a game on the site"}
              </Text>
            </Vstack>
          </Card>
          {games.length > 1 && (
            <div className="flex gap-2">
              <Button
                icon="arrowleft"
                onClick={() => {
                  changeGame(currentGame - 1, games);
                }}
                disabled={currentGame == 0}
              >
                Previous Game
              </Button>
              <Button
                icon="arrowright"
                onClick={() => {
                  changeGame(currentGame + 1, games);
                }}
                disabled={currentGame == games.length - 1}
              >
                Next Game
              </Button>
            </div>
          )}
          {teams.length > 0 && prevSlug && (
            <Button
              onClick={() => {
                setGames([]);
                setEditGame(false);
                setTitle("");
                setGameSlug("");
                setPrevGameSlug("");
                setContent("");
                setThemeJustification("");
                setEditorKey((prev) => prev + 1);
                setThumbnailUrl(null);
                setBannerUrl(null);
                setDownloadLinks([]);
                setAchievements([]);
                setTags([]);
                setFlags([]);
                setLeaderboards([]);
                setCategory(
                  activeJamResponse?.phase == "Rating" ? "EXTRA" : "REGULAR"
                );
                setChosenRatingCategories([]);
                setChosenMajRatingCategories([]);
              }}
              name="Create New Game"
            />
          )}
          <Card>
            <Vstack align="start">
              <div>
                <Text color="text">Game Name</Text>
                <Text color="textFaded" size="xs">
                  The name your game is called
                </Text>
              </div>
              <Input
                required
                name="title"
                placeholder="Enter your game name"
                type="text"
                value={title}
                onValueChange={(value) => {
                  setTitle(value);
                  if (!isSlugManuallyEdited) {
                    setGameSlug(sanitizeSlug(value));
                  }
                }}
              />
            </Vstack>
          </Card>

          <Card>
            <Vstack align="start">
              <div>
                <Text color="text">Game Slug</Text>
                <Text color="textFaded" size="xs">
                  {`This will be used in the URL: d2jam.com/g/${
                    gameSlug || "your-game-name"
                  }`}
                </Text>
              </div>
              <Input
                placeholder="your-game-name"
                value={gameSlug}
                onValueChange={(value) => {
                  setGameSlug(sanitizeSlug(value));
                  setIsSlugManuallyEdited(true);
                }}
              />
            </Vstack>
          </Card>

          {activeJamResponse &&
            (activeJamResponse.phase == "Jamming" ||
              activeJamResponse.phase == "Submission" ||
              (activeJamResponse.phase == "Rating" && !prevSlug)) && (
              <>
                <Card>
                  <Vstack align="start">
                    <div>
                      <Text color="text">Game Category</Text>
                      <Text color="textFaded" size="xs">
                        The category you are submitting your game to in the jam
                      </Text>
                    </div>
                    <Dropdown
                      trigger={
                        <Button>
                          {category == "REGULAR"
                            ? "Regular"
                            : category == "ODA"
                            ? "One Dev Army"
                            : "Extra"}
                        </Button>
                      }
                      onSelect={(key) => {
                        setCategory(key as "REGULAR" | "ODA" | "EXTRA");
                      }}
                    >
                      {activeJamResponse.phase != "Rating" ? (
                        <Dropdown.Item
                          value="REGULAR"
                          description="The regular jam category"
                          icon="gamepad2"
                        >
                          Regular
                        </Dropdown.Item>
                      ) : (
                        <></>
                      )}
                      {teams &&
                      teams.length > 0 &&
                      teams[currentTeam].users.length == 1 &&
                      activeJamResponse.phase != "Rating" ? (
                        <Dropdown.Item
                          value="ODA"
                          description="1 Dev, No third party assets"
                          icon="swords"
                        >
                          One Dev Army (O.D.A)
                        </Dropdown.Item>
                      ) : (
                        <></>
                      )}
                      <Dropdown.Item
                        value="EXTRA"
                        description="Can be submitted during the rating period. Will not be ranked"
                        icon="calendar"
                      >
                        Extra
                      </Dropdown.Item>
                    </Dropdown>
                  </Vstack>
                </Card>
              </>
            )}

          <Card>
            <Vstack align="start">
              <div>
                <Text color="text">Game Description</Text>
                <Text color="textFaded" size="xs">
                  The content of your game page. Visible when people look at
                  your game
                </Text>
              </div>
              <Editor
                key={editorKey}
                content={content}
                setContent={setContent}
                gameEditor
              />
            </Vstack>
          </Card>

          <Card>
            <Vstack align="start">
              <div>
                <Text color="text">Theme Justification</Text>
                <Text color="textFaded" size="xs">
                  This will be shown to people as they rate you for theme. Why
                  your game follows the theme
                </Text>
              </div>
              <Textarea
                placeholder="Enter a justification (optional)"
                value={themeJustification}
                onValueChange={setThemeJustification}
              />
            </Vstack>
          </Card>

          <Card>
            <Vstack align="start">
              <div>
                <Text color="text">Thumbnail</Text>
                <Text color="textFaded" size="xs">
                  Shows when people are browsing through games (384x216)
                </Text>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const formData = new FormData();
                  formData.append("upload", file);

                  try {
                    const response = await fetch(
                      process.env.NEXT_PUBLIC_MODE === "PROD"
                        ? "https://d2jam.com/api/v1/image"
                        : "http://localhost:3005/api/v1/image",
                      {
                        method: "POST",
                        body: formData,
                        headers: {
                          authorization: `Bearer ${getCookie("token")}`,
                        },
                        credentials: "include",
                      }
                    );

                    if (response.ok) {
                      const data = await response.json();
                      setThumbnailUrl(data.data);
                      addToast({
                        title: data.message,
                      });
                    } else {
                      addToast({
                        title: "Failed to upload image",
                      });
                    }
                  } catch (error) {
                    console.error(error);
                    addToast({
                      title: "Error uploading image",
                    });
                  }
                }}
              />

              {thumbnailUrl && (
                <div className="w-full">
                  <div className="bg-[#222222] h-[216px] w-[384px] relative">
                    <Image
                      src={thumbnailUrl}
                      alt={`${title}'s thumbnail`}
                      className="object-cover"
                      fill
                    />
                  </div>
                  <Button
                    color="red"
                    size="sm"
                    onClick={() => {
                      setThumbnailUrl(null);
                    }}
                  >
                    Remove Thumbnail
                  </Button>
                </div>
              )}
            </Vstack>
          </Card>

          <Card>
            <Vstack align="start">
              <div>
                <Text color="text">Banner</Text>
                <Text color="textFaded" size="xs">
                  Shows on the game page (1468 x 240)
                </Text>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const formData = new FormData();
                  formData.append("upload", file);

                  try {
                    const response = await fetch(
                      process.env.NEXT_PUBLIC_MODE === "PROD"
                        ? "https://d2jam.com/api/v1/image"
                        : "http://localhost:3005/api/v1/image",
                      {
                        method: "POST",
                        body: formData,
                        headers: {
                          authorization: `Bearer ${getCookie("token")}`,
                        },
                        credentials: "include",
                      }
                    );

                    if (response.ok) {
                      const data = await response.json();
                      setBannerUrl(data.data);
                      addToast({
                        title: data.message,
                      });
                    } else {
                      addToast({
                        title: "Failed to upload image",
                      });
                    }
                  } catch (error) {
                    console.error(error);
                    addToast({
                      title: "Error uploading image",
                    });
                  }
                }}
              />

              {bannerUrl && (
                <div className="w-full">
                  <div className="bg-[#222222] h-[110px] w-[734px] relative">
                    <Image
                      src={bannerUrl}
                      alt={`${title}'s banner`}
                      className="object-cover"
                      fill
                    />
                  </div>
                  <Button
                    color="red"
                    size="sm"
                    onClick={() => {
                      setBannerUrl(null);
                    }}
                  >
                    Remove Banner
                  </Button>
                </div>
              )}
            </Vstack>
          </Card>

          <Card>
            <Vstack align="start">
              <div>
                <Text color="text">Links</Text>
                <Text color="textFaded" size="xs">
                  Upload your game to a hosting site (such as itch.io) and link
                  it here for people to play on or download from
                </Text>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  {Array.isArray(downloadLinks) &&
                    downloadLinks.map((link, index) => (
                      <div key={link.id} className="flex gap-2">
                        <Input
                          className="flex-grow"
                          placeholder="https://example.com"
                          value={link.url}
                          onValueChange={(value) => {
                            const newLinks = [...downloadLinks];
                            newLinks[index].url = value;
                            setDownloadLinks(newLinks);
                          }}
                          onBlur={() => {
                            if (!urlRegex.test(downloadLinks[index].url)) {
                              addToast({
                                title:
                                  "Please enter a valid URL starting with http:// or https://",
                              });

                              if (
                                !downloadLinks[index].url.startsWith(
                                  "http://"
                                ) &&
                                !downloadLinks[index].url.startsWith("https://")
                              ) {
                                const newUrl =
                                  "https://" + downloadLinks[index].url;
                                const newLinks = [...downloadLinks];
                                newLinks[index].url = newUrl;
                                setDownloadLinks(newLinks);
                                const input =
                                  document.querySelector<HTMLInputElement>(
                                    `#download-link-${index}`
                                  );
                                if (input) {
                                  input.value = newUrl;
                                }
                              }
                            }
                          }}
                        />
                        <NextSelect
                          className="w-96"
                          defaultSelectedKeys={["Web"]}
                          aria-label="Select platform" // Add this to fix accessibility warning
                          onSelectionChange={(value) => {
                            const newLinks = [...downloadLinks];
                            newLinks[index].platform =
                              value.currentKey as unknown as PlatformType;
                            setDownloadLinks(newLinks);
                          }}
                          selectedKeys={[link.platform]}
                        >
                          <SelectItem
                            key="Web"
                            classNames={{ base: "text-[#333] dark:text-white" }}
                          >
                            Web
                          </SelectItem>
                          <SelectItem
                            key="SourceCode"
                            classNames={{ base: "text-[#333] dark:text-white" }}
                          >
                            Source Code
                          </SelectItem>
                          <SelectItem
                            key="Windows"
                            classNames={{ base: "text-[#333] dark:text-white" }}
                          >
                            Windows
                          </SelectItem>
                          <SelectItem
                            key="MacOS"
                            classNames={{ base: "text-[#333] dark:text-white" }}
                          >
                            MacOS
                          </SelectItem>
                          <SelectItem
                            key="Linux"
                            classNames={{ base: "text-[#333] dark:text-white" }}
                          >
                            Linux
                          </SelectItem>
                          <SelectItem
                            key="iOS"
                            classNames={{ base: "text-[#333] dark:text-white" }}
                          >
                            Apple iOS
                          </SelectItem>
                          <SelectItem
                            key="Android"
                            classNames={{ base: "text-[#333] dark:text-white" }}
                          >
                            Android
                          </SelectItem>
                          <SelectItem
                            key="Other"
                            classNames={{ base: "text-[#333] dark:text-white" }}
                          >
                            Other
                          </SelectItem>
                        </NextSelect>
                        <Button
                          color="red"
                          onClick={() => {
                            setDownloadLinks(
                              downloadLinks.filter((l) => l.id !== link.id)
                            );
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                </div>

                <Button
                  onClick={() => {
                    setDownloadLinks([
                      ...downloadLinks,
                      {
                        id: Date.now(),
                        url: "",
                        platform: "Web",
                      },
                    ]);
                  }}
                >
                  Add Link
                </Button>
              </div>
            </Vstack>
          </Card>
          {teams.length > 1 && !prevSlug && (
            <Card>
              <Vstack align="start">
                <div>
                  <Text color="text">Team</Text>
                  <Text color="textFaded" size="xs">
                    Set the team associated with the game
                  </Text>
                </div>
                <Dropdown
                  trigger={
                    <Button>
                      {teams && teams[currentTeam]
                        ? teams[currentTeam].name
                          ? teams[currentTeam].name
                          : `${teams[currentTeam].owner.name}'s Team`
                        : "Unknown"}
                    </Button>
                  }
                  onSelect={(i) => {
                    changeTeam(i as number);
                  }}
                >
                  {teams.map((team, i) => (
                    <Dropdown.Item
                      key={i}
                      value={i}
                      description={`${team.users.length} members`}
                    >
                      {teams && teams[i]
                        ? teams[i].name
                          ? teams[i].name
                          : `${teams[i].owner.name}'s Team`
                        : "Unknown"}
                    </Dropdown.Item>
                  ))}
                </Dropdown>
              </Vstack>
            </Card>
          )}

          <Card>
            <Vstack align="start">
              <div>
                <Text color="text">Tags</Text>
                <Text color="textFaded" size="xs">
                  Tags for game engine, genre, etc. for people to filter by
                </Text>
              </div>
              {mounted && (
                <Select
                  styles={styles}
                  isMulti
                  isClearable={false}
                  onChange={(value) => setTags(value.map((i) => i.id))}
                  value={tags.map((index) => ({
                    value: allTags[index].name,
                    id: index,
                    label: (
                      <div className="flex gap-2 items-center">
                        {allTags[index].icon && (
                          <Avatar
                            className="w-6 h-6 min-w-6 min-h-6"
                            size="sm"
                            src={allTags[index].icon}
                            classNames={{ base: "bg-transparent" }}
                          />
                        )}
                        <p>{allTags[index].name}</p>
                      </div>
                    ),
                  }))}
                  isOptionDisabled={() => tags != null && tags.length >= 10}
                  options={allTags.map((tag, i) => ({
                    value: tag.name,
                    id: i,
                    label: (
                      <div className="flex gap-2 items-center">
                        {tag.icon && (
                          <Avatar
                            className="w-6 h-6 min-w-6 min-h-6"
                            size="sm"
                            src={tag.icon}
                            classNames={{ base: "bg-transparent" }}
                          />
                        )}
                        <p>{tag.name}</p>
                      </div>
                    ),
                  }))}
                />
              )}
            </Vstack>
          </Card>

          <Card>
            <Vstack align="start">
              <div>
                <Text color="text">Content Flags</Text>
                <Text color="textFaded" size="xs">
                  Warnings about what content your game contains
                </Text>
              </div>
              {mounted && (
                <Select
                  styles={styles}
                  isMulti
                  isClearable={false}
                  onChange={(value) => setFlags(value.map((i) => i.id))}
                  value={flags.map((index) => ({
                    value: allFlags[index].name,
                    id: index,
                    label: (
                      <div className="flex gap-2 items-center">
                        {allFlags[index].icon && getIcon(allFlags[index].icon)}
                        <p>{allFlags[index].name}</p>
                      </div>
                    ),
                  }))}
                  options={allFlags.map((flag, i) => ({
                    value: flag.name,
                    id: i,
                    label: (
                      <div className="flex gap-2 items-center">
                        {flag.icon && getIcon(flag.icon)}
                        <p>{flag.name}</p>
                      </div>
                    ),
                  }))}
                />
              )}
            </Vstack>
          </Card>

          <Card>
            <Vstack align="start">
              <div>
                <Text color="text">Opt-In Rating Categories</Text>
                <Text color="textFaded" size="xs">
                  Any optional categories you want to get a rating & rank in
                </Text>
              </div>
              {ratingCategories.map((category3) => (
                <div key={category3.id}>
                  <Hstack>
                    <Switch
                      checked={
                        chosenRatingCategories.filter(
                          (category2) => category2 == category3.id
                        ).length > 0
                      }
                      onChange={(value) => {
                        if (value) {
                          setChosenRatingCategories([
                            ...chosenRatingCategories,
                            category3.id,
                          ]);
                        } else {
                          setChosenRatingCategories(
                            chosenRatingCategories.filter(
                              (category2) => category2 != category3.id
                            )
                          );
                        }
                      }}
                    />
                    <Vstack gap={0} align="start">
                      <Text color="text" size="sm">
                        {category3.name}
                      </Text>
                      <Text color="textFaded" size="xs">
                        {category3.description}
                      </Text>
                    </Vstack>
                  </Hstack>
                  {category3.askMajorityContent &&
                    category == "REGULAR" &&
                    chosenRatingCategories.filter(
                      (category2) => category2 == category3.id
                    ).length > 0 && (
                      <Hstack className="pl-5 pt-2">
                        <Switch
                          key={category3.id + "maj"}
                          checked={
                            chosenMajRatingCategories.filter(
                              (category2) => category2 == category3.id
                            ).length > 0
                          }
                          onChange={(value) => {
                            if (value) {
                              setChosenMajRatingCategories([
                                ...chosenMajRatingCategories,
                                category3.id,
                              ]);
                            } else {
                              setChosenMajRatingCategories(
                                chosenMajRatingCategories.filter(
                                  (category2) => category2 != category3.id
                                )
                              );
                            }
                          }}
                        />
                        <Text color="textFaded" size="xs">
                          Did you make the majority of the {category3.name}{" "}
                          content
                        </Text>
                      </Hstack>
                    )}
                </div>
              ))}
            </Vstack>
          </Card>

          <Card>
            <Vstack align="start">
              <div>
                <Text color="text">Leaderboards</Text>
                <Text color="textFaded" size="xs">
                  Leaderboards for people to submit high scores for your game
                  (scores will be reported manually with pictures for evidence)
                </Text>
              </div>
              {leaderboards.map((lb, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <div className="flex flex-col gap-2 ">
                    <Hstack>
                      <Input
                        label="Leaderboard Name"
                        placeholder="Enter name here"
                        value={lb.name}
                        onChange={(e) => {
                          const updated = [...leaderboards];
                          updated[index].name = e.target.value;
                          setLeaderboards(updated);
                        }}
                      />

                      <Input
                        type="number"
                        label="Users per page"
                        placeholder="Enter a user amount"
                        value={lb.maxUsersShown}
                        min={0}
                        max={100}
                        onValueChange={(e) => {
                          const updated = [...leaderboards];
                          updated[index].maxUsersShown = parseInt(e);
                          setLeaderboards(updated);
                        }}
                      />
                      <NextSelect
                        label="Leaderboard Type"
                        defaultSelectedKeys={["SCORE"]}
                        onChange={(e) => {
                          const updated = [...leaderboards];
                          updated[index].type = e.target
                            .value as LeaderboardTypeType;
                          setLeaderboards(updated);
                        }}
                      >
                        <SelectItem
                          key="SCORE"
                          description="Highest Score"
                          startContent={<Trophy />}
                          classNames={{ base: "text-[#333] dark:text-white" }}
                        >
                          Score
                        </SelectItem>
                        <SelectItem
                          key="GOLF"
                          description="Lowest Score"
                          startContent={<LandPlot />}
                          classNames={{ base: "text-[#333] dark:text-white" }}
                        >
                          Golf
                        </SelectItem>
                        <SelectItem
                          key="SPEEDRUN"
                          description="Lowest Time"
                          startContent={<Rabbit />}
                          classNames={{ base: "text-[#333] dark:text-white" }}
                        >
                          Speedrun
                        </SelectItem>
                        <SelectItem
                          key="ENDURANCE"
                          description="Highest Time"
                          startContent={<Turtle />}
                          classNames={{ base: "text-[#333] dark:text-white" }}
                        >
                          Endurance
                        </SelectItem>
                      </NextSelect>
                      {(lb.type == "SCORE" || lb.type == "GOLF") && (
                        <Input
                          type="number"
                          label="Decimal places"
                          placeholder="Enter the scores decimal places"
                          value={lb.decimalPlaces}
                          min={0}
                          max={3}
                          onValueChange={(e) => {
                            const updated = [...leaderboards];
                            updated[index].decimalPlaces = parseInt(e);
                            setLeaderboards(updated);
                          }}
                        />
                      )}
                    </Hstack>
                    <Hstack>
                      <Switch
                        checked={lb.onlyBest}
                        onChange={(value) => {
                          const updated = [...leaderboards];
                          updated[index].onlyBest = value;
                          setLeaderboards(updated);
                        }}
                      />
                      <Vstack gap={0} align="start">
                        <Text size="sm">Only Highest</Text>
                        <Text size="xs" color="textFaded">
                          Only shows each users highest score
                        </Text>
                      </Vstack>
                    </Hstack>
                    <div>
                      <Button
                        color="red"
                        onClick={() =>
                          setLeaderboards(
                            leaderboards.filter((_, i) => i !== index)
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                color="green"
                onClick={() =>
                  setLeaderboards([
                    ...leaderboards,
                    {
                      id: -1,
                      name: "",
                      type: "SCORE",
                      onlyBest: true,
                      game: {} as GameType,
                      scores: [],
                      maxUsersShown: 10,
                      decimalPlaces: 0,
                    },
                  ])
                }
              >
                Add Leaderboard
              </Button>
            </Vstack>
          </Card>

          <Card>
            <Vstack align="start">
              <div>
                <Text color="text">Soundtrack</Text>
                <Text color="textFaded" size="xs">
                  The soundtrack of your game for people to listen to when
                  browsing your game page.
                </Text>
              </div>
              <Button
                onClick={async () => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "audio/*";
                  input.onchange = async (e: Event) => {
                    const file = (e.target as HTMLInputElement)?.files?.[0];
                    if (!file) return;

                    const formData = new FormData();
                    formData.append("upload", file);

                    try {
                      const response = await fetch(
                        process.env.NEXT_PUBLIC_MODE === "PROD"
                          ? "https://d2jam.com/api/v1/music"
                          : "http://localhost:3005/api/v1/music",
                        {
                          method: "POST",
                          body: formData,
                          headers: {
                            authorization: `Bearer ${getCookie("token")}`,
                          },
                          credentials: "include",
                        }
                      );

                      const result = await response.json();
                      if (response.ok) {
                        addToast({
                          title: "Song uploaded",
                        });
                        console.log("Upload successful:", result);
                      } else {
                        addToast({
                          title: "Upload failed",
                        });
                        console.error("Upload failed:", result);
                      }
                    } catch (error) {
                      addToast({
                        title: "Error uploading file",
                      });
                      console.error("Error uploading file:", error);
                    }
                  };
                  input.click();
                }}
                color="yellow"
              >
                Add Song
              </Button>
            </Vstack>
          </Card>

          <Hstack>
            {waitingPost ? (
              <Spinner />
            ) : (
              <Button color="blue" type="submit" name="action" value="save">
                {prevSlug ? "Update" : "Create"}
              </Button>
            )}
            {(!games[currentGame] || !games[currentGame].published) &&
              (activeJamResponse?.phase == "Jamming" ||
                activeJamResponse?.phase == "Submission" ||
                (activeJamResponse?.phase == "Rating" &&
                  category == "EXTRA")) &&
              (waitingPost ? (
                <Spinner />
              ) : (
                <Button
                  color="pink"
                  type="submit"
                  name="action"
                  value="publish"
                >
                  {prevSlug ? "Publish" : "Create & Publish"}
                </Button>
              ))}
            {games[currentGame] &&
              games[currentGame].published &&
              (activeJamResponse?.phase == "Jamming" ||
                activeJamResponse?.phase == "Submission" ||
                (activeJamResponse?.phase == "Rating" &&
                  category == "EXTRA")) &&
              (waitingPost ? (
                <Spinner />
              ) : (
                <Button
                  color="red"
                  type="submit"
                  name="action"
                  value="unpublish"
                >
                  {"Unpublish"}
                </Button>
              ))}
          </Hstack>
        </Vstack>
      </Form>
    </Vstack>
  );
}
