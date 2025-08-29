"use client";

import { Button } from "@/framework/Button";
import { Card } from "@/framework/Card";
import Dropdown from "@/framework/Dropdown";
import Icon, { IconName } from "@/framework/Icon";
import { Input } from "@/framework/Input";
import { Spinner } from "@/framework/Spinner";
import { Hstack, Vstack } from "@/framework/Stack";
import Text from "@/framework/Text";
import { getCookie } from "@/helpers/cookie";
import { ActiveJamResponse, getCurrentJam } from "@/helpers/jam";
import { sanitize } from "@/helpers/sanitize";
import useHasMounted from "@/hooks/useHasMounted";
import {
  getFlags,
  getGameTags,
  getRatingCategories,
  postGame,
  updateGame,
} from "@/requests/game";
import { getTeamsUser } from "@/requests/team";
import { AchievementType } from "@/types/AchievementType";
import { DownloadLinkType, PlatformType } from "@/types/DownloadLinkType";
import { FlagType } from "@/types/FlagType";
import { GameTagType } from "@/types/GameTagType";
import { GameType } from "@/types/GameType";
import { LeaderboardType, LeaderboardTypeType } from "@/types/LeaderboardType";
import { RatingCategoryType } from "@/types/RatingCategoryType";
import { TeamType } from "@/types/TeamType";
import { addToast, Avatar, Form } from "@heroui/react";
import Image from "next/image";
import { ReactNode, useEffect, useState } from "react";
import Select, { StylesConfig } from "react-select";
import { Switch } from "@/framework/Switch";
import { getIcon } from "@/helpers/icon";
import { Textarea } from "@/framework/Textarea";
import Editor from "@/components/editor";
import { useRouter } from "next/navigation";

const LB_ICON: Record<LeaderboardTypeType, IconName> = {
  SCORE: "trophy",
  GOLF: "landplot",
  SPEEDRUN: "rabbit",
  ENDURANCE: "turtle",
};

const lbIconFor = (t: LeaderboardTypeType): IconName => LB_ICON[t] ?? "trophy";

export default function GameEditingForm({
  game = null,
}: {
  game?: GameType | null;
}) {
  const isMounted = useHasMounted();
  const [ratingCategories, setRatingCategories] = useState<
    RatingCategoryType[]
  >([]);
  const [allFlags, setAllFlags] = useState<FlagType[]>([]);
  const [allTags, setAllTags] = useState<GameTagType[]>([]);
  const [activeJamResponse, setActiveJam] = useState<ActiveJamResponse | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [title, setTitle] = useState("");
  const [short, setShort] = useState("");
  const [content, setContent] = useState("");
  const [gameSlug, setGameSlug] = useState("");
  const [prevSlug, setPrevGameSlug] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [downloadLinks, setDownloadLinks] = useState<DownloadLinkType[]>([]);
  const [editorKey, setEditorKey] = useState(0);
  const [flags, setFlags] = useState<number[]>([]);
  const [tags, setTags] = useState<number[]>([]);
  const [leaderboards, setLeaderboards] = useState<LeaderboardType[]>([]);
  const [achievements, setAchievements] = useState<AchievementType[]>([]);
  const [teams, setTeams] = useState<TeamType[]>([]);
  const [category, setCategory] = useState<"REGULAR" | "ODA" | "EXTRA">(
    "REGULAR"
  );
  const [waitingPost, setWaitingPost] = useState(false);
  const [chosenRatingCategories, setChosenRatingCategories] = useState<
    number[]
  >([]);
  const [chosenMajRatingCategories, setChosenMajRatingCategories] = useState<
    number[]
  >([]);
  const [themeJustification, setThemeJustification] = useState("");
  const urlRegex = /^(https?:\/\/)/;
  const [editGame, setEditGame] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    setEditGame(!!game);
    setTitle(game?.name || "");
    setGameSlug(game?.slug || "");
    setPrevGameSlug(game?.slug || "");
    setContent(game?.description || "");
    setShort(game?.short || "");
    setThemeJustification(game?.themeJustification || "");
    setEditorKey((prev) => prev + 1);
    setThumbnailUrl(game?.thumbnail || null);
    setBannerUrl(game?.banner || null);
    setDownloadLinks(game?.downloadLinks || []);
    setAchievements(game?.achievements || []);
    setFlags(
      game?.flags
        ?.map((flag) => allFlags.findIndex((f) => f.id === flag.id))
        .filter((index) => index !== -1) || []
    );
    setTags(
      game?.tags
        ?.map((tag) => allTags.findIndex((f) => f.id === tag.id))
        .filter((index) => index !== -1) || []
    );
    setLeaderboards(game?.leaderboards || []);
    setCategory(
      game?.category || activeJamResponse?.phase == "Rating"
        ? "EXTRA"
        : "REGULAR"
    );
    setChosenRatingCategories(
      game?.ratingCategories?.map((ratingCategory) => ratingCategory.id) || []
    );
    setChosenMajRatingCategories(
      game?.majRatingCategories?.map((ratingCategory) => ratingCategory.id) ||
        []
    );

    async function loadData() {
      const teamResponse = await getTeamsUser();

      if (teamResponse.status == 200) {
        const data = await teamResponse.json();
        const filteredTeams = data.data.filter((team: TeamType) => !team.game);
        const matchingSlugTeam = data.data.filter(
          (team: TeamType) => game && team.game?.slug === game.slug
        );

        if (matchingSlugTeam.length !== 0) {
          setTeams([matchingSlugTeam, ...filteredTeams]);
        } else {
          setTeams(filteredTeams);
        }
      }
    }

    loadData();
  }, [game, allTags, allFlags, activeJamResponse]);

  useEffect(() => {
    const load = async () => {
      try {
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

        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    };
    load();
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
        backgroundColor: "#444",
      };
    },
    multiValueLabel: (base) => {
      return {
        ...base,
        color: "#fff",
        fontWeight: "bold",
        paddingRight: "2px",
      };
    },
    multiValueRemove: (base) => {
      return {
        ...base,
        display: "flex",
        color: "#ddd",
      };
    },
    control: (styles) => ({
      ...styles,
      backgroundColor: "#181818",
      minWidth: "300px",
    }),
    menu: (styles) => ({
      ...styles,
      backgroundColor: "#181818",
      color: "#fff",
      zIndex: 100,
    }),
    option: (styles, { isFocused }) => ({
      ...styles,
      backgroundColor: isFocused ? "#333" : undefined,
    }),
  };

  const sanitizeSlug = (value: string): string => {
    return value
      .toLowerCase() // Convert to lowercase
      .replace(/\s+/g, "-") // Replace whitespace with hyphens
      .replace(/[^a-z0-9-]/g, "") // Only allow lowercase letters, numbers, and hyphens
      .substring(0, 50); // Limit length to 50 characters
  };

  if (!isMounted) return;

  if (loading) {
    return (
      <Vstack>
        <Card className="max-w-96">
          <Vstack>
            <Hstack>
              <Spinner />
              <Text size="xl">Loading</Text>
            </Hstack>
            <Text color="textFaded">Loading edit form...</Text>
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

          let publishValue = game ? game.published : false;

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
                  leaderboards,
                  short
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
                  leaderboards,
                  short
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

          {
            <>
              <Card>
                <Vstack align="start">
                  <div>
                    <Text color="text">Game Category</Text>
                    <Text color="textFaded" size="xs">
                      The category you are submitting your game to in the jam
                    </Text>
                  </div>
                  {
                    <Dropdown
                      disabled={
                        (activeJamResponse &&
                          activeJamResponse.jam &&
                          (activeJamResponse.jam.id === game?.jam.id ||
                            !game) &&
                          (activeJamResponse.phase == "Jamming" ||
                            activeJamResponse.phase == "Submission" ||
                            (activeJamResponse.phase == "Rating" &&
                              !prevSlug))) ||
                        undefined
                      }
                      selectedValue={category}
                      placeholder="Select category"
                      onSelect={(key) => {
                        setCategory(key as "REGULAR" | "ODA" | "EXTRA");
                      }}
                    >
                      {activeJamResponse &&
                      activeJamResponse.phase != "Rating" ? (
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
                      teams[currentTeam].users &&
                      teams[currentTeam].users.length == 1 &&
                      activeJamResponse &&
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
                  }
                </Vstack>
              </Card>
            </>
          }

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
                <Text color="text">Game Short</Text>
                <Text color="textFaded" size="xs">
                  A short description that shows on the games page and when
                  someone searches for you game (max 155 characters)
                </Text>
              </div>
              <Textarea
                placeholder="Enter a short description"
                value={short}
                onValueChange={setShort}
                maxLength={155}
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
                    icon="trash"
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
                    icon="trash"
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
                        <Dropdown
                          className="w-96"
                          placeholder="Select platform"
                          selectedValue={link.platform}
                          onSelect={(val) => {
                            const newLinks = [...downloadLinks];
                            newLinks[index].platform = val as PlatformType;
                            setDownloadLinks(newLinks);
                          }}
                        >
                          <Dropdown.Item value="Web" icon="globe">
                            Web
                          </Dropdown.Item>
                          <Dropdown.Item value="SourceCode" icon="code2">
                            Source Code
                          </Dropdown.Item>
                          <Dropdown.Item value="Windows" icon="monitor">
                            Windows
                          </Dropdown.Item>
                          <Dropdown.Item value="MacOS" icon="apple">
                            MacOS
                          </Dropdown.Item>
                          <Dropdown.Item value="Linux" icon="terminal">
                            Linux
                          </Dropdown.Item>
                          <Dropdown.Item value="iOS" icon="smartphone">
                            Apple iOS
                          </Dropdown.Item>
                          <Dropdown.Item value="Android" icon="smartphone">
                            Android
                          </Dropdown.Item>
                          <Dropdown.Item value="Other" icon="morehorizontal">
                            Other
                          </Dropdown.Item>
                        </Dropdown>

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
                    setCurrentTeam(i as number);
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
              {isMounted && (
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
              {isMounted && (
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

          {activeJamResponse &&
            activeJamResponse.jam &&
            (activeJamResponse.jam.id === game?.jam.id || !game) &&
            (activeJamResponse.phase == "Jamming" ||
              activeJamResponse.phase == "Submission" ||
              (activeJamResponse.phase == "Rating" && !prevSlug)) && (
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
            )}

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
                <Card key={index}>
                  <Vstack align="start">
                    <Hstack className="mb-2">
                      <Icon name={lbIconFor(lb.type)} size={16} />
                      <Text size="lg">
                        Leaderboard #{index + 1}
                        {lb.name ? `: ${lb.name}` : ""}
                      </Text>
                    </Hstack>
                    <div>
                      <Text color="text">Leaderboard Name</Text>
                      <Text color="textFaded" size="xs">
                        The name that shows for the leaderboard tab. Should
                        describe what the leaderboard is (e.g. any%, death%)
                      </Text>
                    </div>
                    <Input
                      placeholder="Enter a name"
                      value={lb.name}
                      onChange={(e) => {
                        const updated = [...leaderboards];
                        updated[index].name = e.target.value;
                        setLeaderboards(updated);
                      }}
                    />
                    <div>
                      <Text color="text">Users per page</Text>
                      <Text color="textFaded" size="xs">
                        Users that show on a page of the leaderboard (users past
                        this are paginated and the user needs to go to a
                        different page)
                      </Text>
                    </div>
                    <Input
                      type="number"
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
                    <div>
                      <Text color="text">Leaderboard Type</Text>
                      <Text color="textFaded" size="xs">
                        The goal users are ordered by and that the score is
                        formatted as. Determines whether users need to get
                        lowest score, highest score, lowest time, etc.
                      </Text>
                    </div>
                    <Dropdown
                      placeholder="Select Leaderboard Type"
                      selectedValue={leaderboards[index].type}
                      onSelect={(value) => {
                        const updated = [...leaderboards];
                        updated[index].type = value as LeaderboardTypeType;
                        setLeaderboards(updated);
                      }}
                    >
                      <Dropdown.Item
                        value="SCORE"
                        description="Highest Score"
                        icon="trophy"
                      >
                        Score
                      </Dropdown.Item>

                      <Dropdown.Item
                        value="GOLF"
                        description="Lowest Score"
                        icon="landplot"
                      >
                        Golf
                      </Dropdown.Item>

                      <Dropdown.Item
                        value="SPEEDRUN"
                        description="Lowest Time"
                        icon="rabbit"
                      >
                        Speedrun
                      </Dropdown.Item>

                      <Dropdown.Item
                        value="ENDURANCE"
                        description="Highest Time"
                        icon="turtle"
                      >
                        Endurance
                      </Dropdown.Item>
                    </Dropdown>
                    {(lb.type == "SCORE" || lb.type == "GOLF") && (
                      <>
                        <div>
                          <Text color="text">Decimal places</Text>
                          <Text color="textFaded" size="xs">
                            The amount of decimal places that a score supports
                          </Text>
                        </div>
                        <Input
                          type="number"
                          placeholder="Enter the score's decimal places"
                          value={lb.decimalPlaces}
                          min={0}
                          max={3}
                          onValueChange={(e) => {
                            const updated = [...leaderboards];
                            updated[index].decimalPlaces = parseInt(e);
                            setLeaderboards(updated);
                          }}
                        />
                      </>
                    )}
                    <div>
                      <Text color="text">Advanced toggles</Text>
                      <Text color="textFaded" size="xs">
                        Toggles to control more functionality on the leaderboard
                      </Text>
                    </div>
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
                    <div className="p-1" />
                    <Button
                      icon="trash"
                      color="red"
                      onClick={() =>
                        setLeaderboards(
                          leaderboards.filter((_, i) => i !== index)
                        )
                      }
                    >
                      Remove {lb.name}
                    </Button>
                  </Vstack>
                </Card>
              ))}
              <Button
                icon="plus"
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
                  browsing the site
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
                disabled
              >
                Add Song (disabled for now, will be enabled soon)
              </Button>
            </Vstack>
          </Card>

          <Card>
            <Vstack align="start">
              <div>
                <Text color="text">Achievements</Text>
                <Text color="textFaded" size="xs">
                  Achievements for people to obtain from goals relating to your
                  game (e.g. find the hidden chicken). Completion is self
                  reported
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
                color="purple"
                disabled
              >
                Add Achievement (disabled for now, will be enabled soon)
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
            {(!game || !game.published) &&
              activeJamResponse?.jam &&
              (activeJamResponse?.jam.id == game?.jam.id || !game) &&
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
            {game &&
              game.published &&
              activeJamResponse?.jam &&
              activeJamResponse?.jam.id == game.jam.id &&
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
      <div className="p-2" />
    </Vstack>
  );
}
