"use client";

import Editor from "@/components/editor";
import { getCookie } from "@/helpers/cookie";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Form,
  Input,
  Spacer,
  Switch,
  Textarea,
} from "@nextui-org/react";
import {
  ArrowLeft,
  ArrowRight,
  Gamepad2,
  LoaderCircle,
  Swords,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Select, SelectItem } from "@nextui-org/react";
import { UserType } from "@/types/UserType";
import { redirect, useRouter } from "next/navigation";
import { PlatformType, DownloadLinkType } from "@/types/DownloadLinkType";
import { getSelf } from "@/requests/user";
import {
  getCurrentGame,
  getRatingCategories,
  postGame,
  updateGame,
} from "@/requests/game";
import { sanitize } from "@/helpers/sanitize";
import Image from "next/image";
import { createTeam } from "@/helpers/team";
import { RatingCategoryType } from "@/types/RatingCategoryType";
import { GameType } from "@/types/GameType";
import ButtonAction from "../link-components/ButtonAction";
import { TeamType } from "@/types/TeamType";
import { getTeamsUser } from "@/requests/team";
import { ActiveJamResponse, getCurrentJam } from "@/helpers/jam";

export default function CreateGame() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [themeJustification, setThemeJustification] = useState("");
  const [errors, setErrors] = useState({});
  const [waitingPost, setWaitingPost] = useState(false);
  const [editGame, setEditGame] = useState(false);
  const [mounted, setMounted] = useState<boolean>(false);

  const [gameSlug, setGameSlug] = useState("");
  const [prevSlug, setPrevGameSlug] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [downloadLinks, setDownloadLinks] = useState<DownloadLinkType[]>([]);
  const [editorKey, setEditorKey] = useState(0);
  const [ratingCategories, setRatingCategories] = useState<
    RatingCategoryType[]
  >([]);
  const urlRegex = /^(https?:\/\/)/;

  const [games, setGames] = useState<GameType[]>([]);
  const [currentGame, setCurrentGame] = useState<number>(0);
  const [category, setCategory] = useState<"REGULAR" | "ODA">("REGULAR");
  const [currentTeam, setCurrentTeam] = useState<number>(0);
  const [teams, setTeams] = useState<TeamType[]>([]);
  const [activeJamResponse, setActiveJam] = useState<ActiveJamResponse | null>(
    null
  );
  const [chosenRatingCategories, setChosenRatingCategories] = useState<
    number[]
  >([]);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);

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

        const activeJam = await getCurrentJam();
        setActiveJam(activeJam);

        if (localuser.teams.length == 0) {
          const successful = await createTeam();
          if (successful) {
          } else {
            toast.error("Error while creating team");
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

  const changeGame = useCallback((newid: number, games: GameType[]) => {
    setCurrentGame(newid);

    if (!games) return;
    if (games.length == 0) return;

    setTitle(games[newid].name);
    setGameSlug(games[newid].slug);
    setPrevGameSlug(games[newid].slug);
    setContent(games[newid].description || "");
    setThemeJustification(games[newid].themeJustification || "");
    setEditorKey((prev) => prev + 1);
    setThumbnailUrl(games[newid].thumbnail || null);
    setDownloadLinks(games[newid].downloadLinks || []);
    setCategory(games[newid].category);
    setChosenRatingCategories(
      games[newid].ratingCategories.map((ratingCategory) => ratingCategory.id)
    );
  }, []);

  const changeTeam = useCallback((newid: number) => {
    setCurrentTeam(newid);
  }, []);

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
            toast.error("No available teams");
            redirect("/");
          }
        }
      }
    };

    if (mounted && dataLoaded) {
      checkExistingGame();
    }
  }, [teams, mounted, changeGame, dataLoaded]);

  return (
    <Form
      className="w-full max-w-2xl flex flex-col gap-4 text-[#333] dark:text-white"
      validationErrors={errors}
      onSubmit={async (e) => {
        e.preventDefault();

        if (!title) {
          setErrors({
            title: "Please enter a valid title",
          });
          return;
        }

        const userSlug = getCookie("user"); // Retrieve user slug from cookies
        if (!userSlug) {
          toast.error("You are not logged in.");
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
                links,
                userSlug,
                category,
                chosenRatingCategories,
                publishValue,
                themeJustification
              )
            : postGame(
                title,
                gameSlug,
                sanitizedHtml,
                thumbnailUrl,
                links,
                userSlug,
                category,
                teams[currentTeam].id,
                chosenRatingCategories,
                publishValue,
                themeJustification
              );

          const response = await request;

          if (response.ok) {
            toast.success(
              prevSlug
                ? "Game updated successfully!"
                : "Game created successfully!"
            );
            setWaitingPost(false);
            router.push(`/games/${gameSlug || sanitizeSlug(title)}`);
          } else {
            const error = await response.text();
            toast.error(error || "Failed to create game");
            setWaitingPost(false);
          }
        } catch (error) {
          console.error("Error creating game:", error);
          toast.error("Failed to create game.");
        }
      }}
    >
      <div>
        <h1 className="text-2xl font-bold mb-4 flex">
          {prevSlug ? "Edit Game" : "Create New Game"}
        </h1>
      </div>
      {teams.length > 0 && prevSlug && (
        <ButtonAction
          onPress={() => {
            setGames([]);
            setEditGame(false);
            setTitle("");
            setGameSlug("");
            setPrevGameSlug("");
            setContent("");
            setThemeJustification("");
            setEditorKey((prev) => prev + 1);
            setThumbnailUrl(null);
            setDownloadLinks([]);
            setCategory("REGULAR");
            setChosenRatingCategories([]);
          }}
          name="Create New Game"
        />
      )}
      <Input
        isRequired
        label="Game Name"
        labelPlacement="outside"
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

      <Input
        label="Game Slug"
        labelPlacement="outside"
        placeholder="your-game-name"
        value={gameSlug}
        onValueChange={(value) => {
          setGameSlug(sanitizeSlug(value));
          setIsSlugManuallyEdited(true);
        }}
        description="This will be used in the URL: d2jam.com/games/your-game-name"
      />

      <label className="text-sm font-medium">Game Description</label>
      <Editor
        key={editorKey}
        content={content}
        setContent={setContent}
        gameEditor
      />

      <Spacer />

      <Textarea
        label="Theme Justification"
        labelPlacement="outside"
        placeholder="Why your game follows the theme"
        value={themeJustification}
        onValueChange={setThemeJustification}
        description="This will be shown to people as they rate you for theme"
      />

      <Spacer />

      <div className="flex flex-col gap-4">
        <p>Thumbnail</p>
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
                toast.success(data.message);
              } else {
                toast.error("Failed to upload image");
              }
            } catch (error) {
              console.error(error);
              toast.error("Error uploading image");
            }
          }}
        />

        {thumbnailUrl && (
          <div className="w-full">
            <div className="bg-[#222222] h-28 w-full relative">
              <Image
                src={thumbnailUrl}
                alt={`${title}'s thumbnail`}
                className="object-cover"
                fill
              />
            </div>
            <Spacer y={3} />
            <Button
              color="danger"
              size="sm"
              onPress={() => {
                setThumbnailUrl(null);
              }}
            >
              Remove Thumbnail
            </Button>
          </div>
        )}

        <Spacer />

        <p>Links</p>
        <p className="text-sm text-[#777] dark:text-[#bbb]">
          Upload your game to a hosting site (such as itch.io) and link it here
          for people to play on or download from
        </p>
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
                        toast.error(
                          "Please enter a valid URL starting with http:// or https://"
                        );

                        if (
                          !downloadLinks[index].url.startsWith("http://") &&
                          !downloadLinks[index].url.startsWith("https://")
                        ) {
                          const newUrl = "https://" + downloadLinks[index].url;
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
                  <Select
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
                    <SelectItem key="Web">Web</SelectItem>
                    <SelectItem key="SourceCode">Source Code</SelectItem>
                    <SelectItem key="Windows">Windows</SelectItem>
                    <SelectItem key="MacOS">MacOS</SelectItem>
                    <SelectItem key="Linux">Linux</SelectItem>
                    <SelectItem key="iOS">Apple iOS</SelectItem>
                    <SelectItem key="Android">Android</SelectItem>
                    <SelectItem key="Other">Other</SelectItem>
                  </Select>
                  <Button
                    color="danger"
                    variant="light"
                    onPress={() => {
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
            variant="solid"
            onPress={() => {
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

        <Spacer />

        {teams.length > 1 && !prevSlug && (
          <>
            <p>Team</p>
            <Dropdown>
              <DropdownTrigger>
                <Button>
                  {teams && teams[currentTeam]
                    ? teams[currentTeam].name
                      ? teams[currentTeam].name
                      : `${teams[currentTeam].owner.name}'s Team`
                    : "Unknown"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                onAction={(i) => {
                  changeTeam(i as number);
                }}
              >
                {teams.map((team, i) => (
                  <DropdownItem
                    key={i}
                    description={`${team.users.length} members`}
                  >
                    {teams && teams[i]
                      ? teams[i].name
                        ? teams[i].name
                        : `${teams[i].owner.name}'s Team`
                      : "Unknown"}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </>
        )}

        <Spacer />

        <div className="flex flex-col gap-2">
          <p className="text-[#333] dark:text-white">
            Opt-In Rating Categories
          </p>
          <p className="text-sm text-[#777] dark:text-[#bbb]">
            Any optional categories you want to get a rating & rank in
          </p>
          <Spacer />
          {ratingCategories.map((category) => (
            <Switch
              key={category.id}
              isSelected={
                chosenRatingCategories.filter(
                  (category2) => category2 == category.id
                ).length > 0
              }
              onValueChange={(value) => {
                if (value) {
                  setChosenRatingCategories([
                    ...chosenRatingCategories,
                    category.id,
                  ]);
                } else {
                  setChosenRatingCategories(
                    chosenRatingCategories.filter(
                      (category2) => category2 != category.id
                    )
                  );
                }
              }}
            >
              <div className="text-[#333] dark:text-white">
                <p>{category.name}</p>
                <p className="text-sm text-[#777] dark:text-[#bbb]">
                  {category.description}
                </p>
              </div>
            </Switch>
          ))}
        </div>

        <Spacer />

        {teams &&
          teams.length > 0 &&
          teams[currentTeam].users.length == 1 &&
          activeJamResponse &&
          activeJamResponse.phase == "Jamming" && (
            <>
              <p>Game Category</p>
              <Dropdown>
                <DropdownTrigger>
                  <Button>
                    {category == "REGULAR" ? "Regular" : "One Dev Army"}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  onAction={(key) => {
                    setCategory(key as "REGULAR" | "ODA");
                  }}
                >
                  <DropdownItem
                    key="REGULAR"
                    description="The regular jam category"
                    startContent={<Gamepad2 />}
                  >
                    Regular
                  </DropdownItem>
                  <DropdownItem
                    key="ODA"
                    description="1 Dev, No third party assets"
                    startContent={<Swords />}
                  >
                    One Dev Army (O.D.A)
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </>
          )}

        {games.length > 1 && (
          <div className="flex gap-2">
            <ButtonAction
              iconPosition="start"
              name="Previous Game"
              icon={<ArrowLeft />}
              onPress={() => {
                changeGame(currentGame - 1, games);
              }}
              isDisabled={currentGame == 0}
            />
            <ButtonAction
              name="Next Game"
              icon={<ArrowRight />}
              onPress={() => {
                changeGame(currentGame + 1, games);
              }}
              isDisabled={currentGame == games.length - 1}
            />
          </div>
        )}

        <div className="flex gap-2">
          <Button color="primary" type="submit" name="action" value="save">
            {waitingPost ? (
              <LoaderCircle className="animate-spin" size={16} />
            ) : (
              <p>{prevSlug ? "Update" : "Create"}</p>
            )}
          </Button>
          {(!games[currentGame] || !games[currentGame].published) && (
            <Button
              color="secondary"
              type="submit"
              name="action"
              value="publish"
            >
              {waitingPost ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <p>{prevSlug ? "Publish" : "Create & Publish"}</p>
              )}
            </Button>
          )}
          {games[currentGame] && games[currentGame].published && (
            <Button
              color="danger"
              type="submit"
              name="action"
              value="unpublish"
            >
              {waitingPost ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <p>{"Unpublish"}</p>
              )}
            </Button>
          )}
        </div>
      </div>
    </Form>
  );
}
