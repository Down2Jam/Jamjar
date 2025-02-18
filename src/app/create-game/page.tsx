"use client";

import Editor from "@/components/editor";
import { getCookie } from "@/helpers/cookie";
import { Button, Form, Input, Spacer } from "@nextui-org/react";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Select, SelectItem } from "@nextui-org/react";
import Timers from "@/components/timers";
import { UserType } from "@/types/UserType";
import { useRouter } from "next/navigation";
import { GameType } from "@/types/GameType";
import { PlatformType, DownloadLinkType } from "@/types/DownloadLinkType";
import { getSelf, searchUsers } from "@/requests/user";
import { getCurrentGame, postGame, updateGame } from "@/requests/game";
import { sanitize } from "@/helpers/sanitize";
import Image from "next/image";
import SidebarStreams from "@/components/sidebar/SidebarStreams";

export default function CreateGamePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState({});
  const [waitingPost, setWaitingPost] = useState(false);
  const [editGame, setEditGame] = useState(false);
  /*
  const [selectedTags, setSelectedTags] = useState<MultiValue<{
    value: string;
    label: ReactNode;
    isFixed: boolean;
  }> | null>(null);
   */
  const [mounted, setMounted] = useState<boolean>(false);

  const [gameSlug, setGameSlug] = useState("");
  const [prevSlug, setPrevGameSlug] = useState("");
  const [game, setGame] = useState<GameType>();
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [authorSearch, setAuthorSearch] = useState("");
  const [selectedAuthors, setSelectedAuthors] = useState<Array<UserType>>([]);
  const [searchResults, setSearchResults] = useState<Array<UserType>>([]);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [user, setUser] = useState<UserType>();
  const [downloadLinks, setDownloadLinks] = useState<DownloadLinkType[]>([]);
  const [editorKey, setEditorKey] = useState(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const urlRegex = /^(https?:\/\/)/;

  const sanitizeSlug = (value: string): string => {
    return value
      .toLowerCase() // Convert to lowercase
      .replace(/\s+/g, "-") // Replace whitespace with hyphens
      .replace(/[^a-z0-9-]/g, "") // Only allow lowercase letters, numbers, and hyphens
      .substring(0, 50); // Limit length to 50 characters
  };

  const handleAuthorSearch = async (query: string) => {
    if (query.length < 3) return;
    const response = await searchUsers(query);
    if (response.ok) {
      const data = await response.json();
      setSearchResults(data);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setMounted(true);

    const load = async () => {
      try {
        const response = await getSelf();
        const localuser = await response.json();
        setUser(localuser);

        /*
      const tagResponse = await getTags();

      if (tagResponse.ok) {
        const newoptions: {
          value: string;
          label: ReactNode;
          id: number;
          isFixed: boolean;
        }[] = [];

        for (const tag of await tagResponse.json()) {
          if (tag.modOnly && localuser && !localuser.mod) {
            continue;
          }
          newoptions.push({
            value: tag.name,
            id: tag.id,
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
                <p>
                  {tag.name}
                  {tag.modOnly ? " (Mod Only)" : ""}
                </p>
              </div>
            ),
            isFixed: tag.alwaysAdded,
          });
        }

        setOptions(newoptions);
        setSelectedTags(newoptions.filter((tag) => tag.isFixed));
      }
        */
      } catch (error) {
        console.error(error);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const checkExistingGame = async () => {
      const response = await getCurrentGame();
      console.log("say");
      if (response.ok) {
        const gameData = await response.json();
        if (gameData) {
          setEditGame(true);
          setTitle(gameData.name);
          setGameSlug(gameData.slug);
          setPrevGameSlug(gameData.slug);
          setContent(gameData.description);
          setEditorKey((prev) => prev + 1);
          setThumbnailUrl(gameData.thumbnail);
          setDownloadLinks(gameData.downloadLinks);
          setGame(gameData);
          const uniqueAuthors = [
            gameData.author,
            ...gameData.contributors,
          ].filter(
            (author, index, self) =>
              index === self.findIndex((a) => a.id === author.id)
          );
          setSelectedAuthors(uniqueAuthors);
        } else {
          setSelectedAuthors(user ? [user] : []);
        }
      } else {
        setEditGame(false);
        setTitle("");
        setGameSlug("");
        setContent("");
        setEditorKey((prev) => prev + 1);
        setThumbnailUrl("");
        setDownloadLinks([]);
      }
    };

    if (mounted && user) {
      checkExistingGame();
    }
  }, [user, mounted]);

  return (
    <div className="static flex items-top mt-20 justify-center top-0 left-0">
      <Form
        className="w-full max-w-2xl flex flex-col gap-4"
        validationErrors={errors}
        onSubmit={async (e) => {
          e.preventDefault();

          if (!title && !content) {
            setErrors({
              title: "Please enter a valid title",
              content: "Please enter valid content",
            });
            toast.error("Please enter valid content");
            return;
          }

          if (!title) {
            setErrors({ title: "Please enter a valid title" });
            return;
          }

          if (!content) {
            setErrors({ content: "Please enter valid content" });
            toast.error("Please enter valid content");
            return;
          }

          const userSlug = getCookie("user"); // Retrieve user slug from cookies
          if (!userSlug) {
            toast.error("You are not logged in.");
            return;
          }

          const sanitizedHtml = sanitize(content);
          setWaitingPost(true);

          try {
            const links = downloadLinks.map((link) => ({
              url: link.url,
              platform: link.platform,
            }));

            const contributors = selectedAuthors.map((author) => author.id);

            const request = editGame
              ? updateGame(
                  prevSlug,
                  title,
                  gameSlug,
                  sanitizedHtml,
                  thumbnailUrl,
                  links,
                  userSlug,
                  contributors
                )
              : postGame(
                  title,
                  gameSlug,
                  sanitizedHtml,
                  thumbnailUrl,
                  links,
                  userSlug,
                  contributors
                );

            const response = await request;

            if (response.ok) {
              toast.success(
                gameSlug
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
            {gameSlug ? "Edit Game" : "Create New Game"}
          </h1>
        </div>
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

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Add Authors</label>
          <Input
            placeholder="Search users..."
            value={authorSearch}
            onValueChange={(value) => {
              setAuthorSearch(value);
              handleAuthorSearch(value);
            }}
          />
          {searchResults.length > 0 && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex justify-between items-center p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer"
                  onClick={() => {
                    if (!selectedAuthors.some((a) => a.id === user.id)) {
                      setSelectedAuthors([...selectedAuthors, user]);
                    }
                    setSearchResults([]);
                    setAuthorSearch("");
                  }}
                >
                  <span>{user.name}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedAuthors.map((author) => (
              <div
                key={author.id}
                className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 px-3 py-1 rounded-full flex items-center gap-2"
              >
                <span>{author.name}</span>
                {((game && author.id !== game.authorId) ||
                  (!game && author.id !== user?.id)) && (
                  <button
                    onClick={() =>
                      setSelectedAuthors(
                        selectedAuthors.filter((a) => a.id !== author.id)
                      )
                    }
                    className="text-sm hover:text-red-500"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <label className="text-sm font-medium">Game Description</label>
        <Editor
          key={editorKey}
          content={content}
          setContent={setContent}
          gameEditor
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
                Remove Banner Picture
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              {Array.isArray(downloadLinks) &&
                downloadLinks.map((link, index) => (
                  <div key={link.id} className="flex gap-2">
                    <Input
                      className="flex-grow"
                      placeholder="https://example.com/download"
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
                    <Select
                      className="w-96"
                      defaultSelectedKeys={["Windows"]}
                      aria-label="Select platform" // Add this to fix accessibility warning
                      onSelectionChange={(value) => {
                        const newLinks = [...downloadLinks];
                        newLinks[index].platform =
                          value as unknown as PlatformType;
                        setDownloadLinks(newLinks);
                      }}
                    >
                      <SelectItem key="Windows" value="Windows">
                        Windows
                      </SelectItem>
                      <SelectItem key="MacOS" value="MacOS">
                        MacOS
                      </SelectItem>
                      <SelectItem key="Linux" value="Linux">
                        Linux
                      </SelectItem>
                      <SelectItem key="Web" value="Web">
                        Web
                      </SelectItem>
                      <SelectItem key="Mobile" value="Mobile">
                        Mobile
                      </SelectItem>
                      <SelectItem key="Other" value="Other">
                        Other
                      </SelectItem>
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
              color="primary"
              variant="solid"
              onPress={() => {
                setDownloadLinks([
                  ...downloadLinks,
                  {
                    id: Date.now(),
                    url: "",
                    platform: "Windows",
                  },
                ]);
              }}
            >
              Add Download Link
            </Button>
          </div>

          <div className="flex gap-2">
            <Button color="primary" type="submit">
              {waitingPost ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <p>{editGame ? "Update" : "Create"}</p>
              )}
            </Button>
          </div>
        </div>
      </Form>
      {!isMobile && (
        <div className="flex flex-col gap-4 px-8 items-end">
          <Timers />
          <SidebarStreams />
        </div>
      )}
    </div>
  );
}
