"use client";

import { useEffect, useState } from "react";
import PostCard from "./PostCard";
import { PostType } from "@/types/PostType";
import {
  addToast,
  Avatar,
  Chip,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Spacer,
  useDisclosure,
} from "@heroui/react";
import { PostSort } from "@/types/PostSort";
import { PostStyle } from "@/types/PostStyle";
import { UserType } from "@/types/UserType";
import { Check, LoaderCircle, X } from "lucide-react";
import { PostTime } from "@/types/PostTimes";
import { TagType } from "@/types/TagType";
import StickyPostCard from "./StickyPostCard";
import { getTags } from "@/requests/tag";
import { getSelf } from "@/requests/user";
import { getPosts } from "@/requests/post";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import LikeButton from "./LikeButton";
import { formatDistance } from "date-fns";
import CommentCard from "./CommentCard";
import { useTheme } from "@/providers/SiteThemeProvider";
import { Button } from "@/framework/Button";
import Dropdown from "@/framework/Dropdown";
import Tooltip from "@/framework/Tooltip";
import { Vstack } from "@/framework/Stack";
import ThemedProse from "../themed-prose";
import { IconName } from "@/framework/Icon";
import { Card } from "@/framework/Card";

export default function Posts() {
  const searchParams = useSearchParams();

  const { siteTheme, colors } = useTheme();
  const [posts, setPosts] = useState<PostType[]>();
  const [stickyPosts, setStickyPosts] = useState<PostType[]>();
  const [sort, setSort] = useState<PostSort>(
    (["newest", "oldest", "top"].includes(
      searchParams.get("sort") as PostSort
    ) &&
      (searchParams.get("sort") as PostSort)) ||
      "newest"
  );
  const [time, setTime] = useState<PostTime>(
    ([
      "hour",
      "three_hours",
      "six_hours",
      "twelve_hours",
      "day",
      "week",
      "month",
      "three_months",
      "six_months",
      "nine_months",
      "year",
      "all",
    ].includes(searchParams.get("time") as PostTime) &&
      (searchParams.get("time") as PostTime)) ||
      "all"
  );
  const [style, setStyle] = useState<PostStyle>(
    (["cozy", "compact", "ultra"].includes(
      searchParams.get("style") as PostStyle
    ) &&
      (searchParams.get("style") as PostStyle)) ||
      "cozy"
  );
  const [user, setUser] = useState<UserType>();
  const [oldIsOpen, setOldIsOpen] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [tags, setTags] = useState<{
    [category: string]: { tags: TagType[]; priority: number };
  }>();
  const [tagRules, setTagRules] = useState<{ [key: number]: number }>();
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);
  const router = useRouter();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [currentPost, setCurrentPost] = useState<number>(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setReduceMotion(event.matches);
    };
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    if (oldIsOpen == null) {
      setOldIsOpen(isOpen);
      return;
    }

    if (isOpen == oldIsOpen) {
      return;
    }

    setOldIsOpen(isOpen);

    if (posts) {
      if (isOpen) {
        window.history.pushState(null, "", `/p/${posts[currentPost].slug}`);
      } else {
        window.history.back();
      }
    }
  }, [isOpen, currentPost, posts, oldIsOpen]);

  const updateQueryParam = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  useEffect(() => {
    const loadUserAndPosts = async () => {
      setLoading(true);

      try {
        const tagResponse = await getTags();

        if (tagResponse.ok) {
          const tagObject: {
            [category: string]: { tags: TagType[]; priority: number };
          } = {};

          for (const tag of (await tagResponse.json()).data) {
            if (tag.name == "D2Jam") {
              continue;
            }

            if (tag.category) {
              if (tag.category.name in tagObject) {
                tagObject[tag.category.name].tags.push(tag);
              } else {
                tagObject[tag.category.name] = {
                  tags: [tag],
                  priority: tag.category.priority,
                };
              }
            }
          }

          setTags(tagObject);
        }

        // Fetch the user
        const userResponse = await getSelf();
        const userData = userResponse.ok
          ? await userResponse.json()
          : undefined;
        setUser(userData);

        // Fetch posts (with userSlug if user is available)
        const postsResponse = await getPosts(
          sort,
          time,
          false,
          tagRules,
          userData?.slug
        );
        setPosts(await postsResponse.json());

        // Sticky posts
        // Fetch posts (with userSlug if user is available)
        const stickyPostsResponse = await getPosts(
          sort,
          time,
          true,
          tagRules,
          userData?.slug
        );
        setStickyPosts(await stickyPostsResponse.json());
        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    };

    loadUserAndPosts();
  }, [sort, time, tagRules]);

  const sorts: Record<
    PostSort,
    { name: string; icon: IconName; description: string }
  > = {
    top: {
      name: "PostSort.Top.Title",
      icon: "trophy",
      description: "PostSort.Top.Description",
    },
    newest: {
      name: "PostSort.Newest.Title",
      icon: "clockarrowup",
      description: "PostSort.Newest.Description",
    },
    oldest: {
      name: "PostSort.Oldest.Title",
      icon: "clockarrowdown",
      description: "PostSort.Oldest.Description",
    },
  };

  const times: Record<
    PostTime,
    { name: string; icon: IconName; description: string }
  > = {
    hour: {
      name: "PostTime.Hour.Title",
      icon: "clock1",
      description: "PostTime.Hour.Description",
    },
    three_hours: {
      name: "PostTime.ThreeHours.Title",
      icon: "clock2",
      description: "PostTime.ThreeHours.Description",
    },
    six_hours: {
      name: "PostTime.SixHours.Title",
      icon: "clock3",
      description: "PostTime.SixHours.Description",
    },
    twelve_hours: {
      name: "PostTime.TwelveHours.Title",
      icon: "clock4",
      description: "PostTime.TwelveHours.Description",
    },
    day: {
      name: "PostTime.Day.Title",
      icon: "calendar",
      description: "PostTime.Day.Description",
    },
    week: {
      name: "PostTime.Week.Title",
      icon: "calendardays",
      description: "PostTime.Week.Description",
    },
    month: {
      name: "PostTime.Month.Title",
      icon: "calendarrange",
      description: "PostTime.Month.Description",
    },
    three_months: {
      name: "PostTime.ThreeMonths.Title",
      icon: "calendarfold",
      description: "PostTime.ThreeMonths.Description",
    },
    six_months: {
      name: "PostTime.SixMonths.Title",
      icon: "calendarcog",
      description: "PostTime.SixMonths.Description",
    },
    nine_months: {
      name: "PostTime.NineMonths.Title",
      icon: "calendararrowdown",
      description: "PostTime.NineMonths.Description",
    },
    year: {
      name: "PostTime.Year.Title",
      icon: "calendar1",
      description: "PostTime.Year.Description",
    },
    all: {
      name: "PostTime.All.Title",
      icon: "sparkles",
      description: "PostTime.All.Description",
    },
  };

  return (
    <div>
      {loading ? (
        <div className="flex justify-center p-6">
          <LoaderCircle
            className="animate-spin text-[#333] dark:text-[#999]"
            size={24}
          />
        </div>
      ) : (
        stickyPosts &&
        stickyPosts.length > 0 && (
          <Vstack align="stretch" className="p-4">
            {stickyPosts.map((post) => (
              <StickyPostCard key={post.id} post={post} />
            ))}
          </Vstack>
        )
      )}

      <div className="flex justify-between p-4 pb-0">
        <div className="flex gap-2">
          <Dropdown
            trigger={<Button>{sorts[sort]?.name}</Button>}
            onSelect={(key) => {
              setSort(key as PostSort);
              updateQueryParam("sort", key as string);
            }}
          >
            {Object.entries(sorts).map(([key, sort]) => (
              <Dropdown.Item
                key={key}
                value={key}
                icon={sort.icon}
                description={sort.description}
              >
                {sort.name}
              </Dropdown.Item>
            ))}
          </Dropdown>
          <Dropdown
            trigger={<Button>{times[time]?.name}</Button>}
            onSelect={(key) => {
              setTime(key as PostTime);
              updateQueryParam("time", key as string);
            }}
          >
            {Object.entries(times).map(([key, sort]) => (
              <Dropdown.Item
                key={key}
                value={key}
                icon={sort.icon}
                description={sort.description}
              >
                {sort.name}
              </Dropdown.Item>
            ))}
          </Dropdown>
          <Dropdown
            trigger={
              <Button>
                {tagRules && Object.keys(tagRules).length > 0
                  ? "Custom Tags"
                  : "All Tags"}
              </Button>
            }
          >
            <div className="p-4 max-w-[800px] max-h-[400px] overflow-y-scroll">
              <p className="text-2xl">Tag Filtering</p>
              {tags && Object.keys(tags).length > 0 ? (
                Object.keys(tags)
                  .sort(
                    (tag1, tag2) => tags[tag2].priority - tags[tag1].priority
                  )
                  .map((category: string) => (
                    <div key={category} className="w-full">
                      <p>{category}</p>
                      <div className="flex gap-1 flex-wrap p-4 w-full">
                        {tags[category].tags.map((tag) => (
                          <Chip
                            size="sm"
                            variant="faded"
                            avatar={
                              tag.icon && (
                                <Avatar
                                  src={tag.icon}
                                  classNames={{ base: "bg-transparent" }}
                                />
                              )
                            }
                            key={tag.id}
                            onClick={() => {
                              if (!tagRules) {
                                setTagRules({ [tag.id]: 1 });
                              } else {
                                if (tag.id in tagRules) {
                                  if (tagRules[tag.id] === 1) {
                                    setTagRules({
                                      ...tagRules,
                                      [tag.id]: -1,
                                    });
                                  } else {
                                    const updatedRules = { ...tagRules };
                                    delete updatedRules[tag.id];
                                    setTagRules(updatedRules);
                                  }
                                } else {
                                  setTagRules({ ...tagRules, [tag.id]: 1 });
                                }
                              }
                            }}
                            className={`transition-all transform duration-500 ease-in-out cursor-pointer ${
                              !reduceMotion ? "hover:scale-110" : ""
                            }`}
                            style={{
                              color:
                                tagRules && tag.id in tagRules
                                  ? tagRules[tag.id] === 1
                                    ? siteTheme.colors["blue"]
                                    : siteTheme.colors["orange"]
                                  : "",
                              borderColor:
                                tagRules && tag.id in tagRules
                                  ? tagRules[tag.id] === 1
                                    ? siteTheme.colors["blue"]
                                    : siteTheme.colors["orange"]
                                  : "",
                            }}
                            endContent={
                              tagRules &&
                              tag.id in tagRules &&
                              (tagRules[tag.id] === 1 ? (
                                <Check size={16} />
                              ) : (
                                <X size={16} />
                              ))
                            }
                          >
                            {tag.name}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  ))
              ) : (
                <p>No tags could be found</p>
              )}
            </div>
          </Dropdown>
        </div>
        <div>
          <Dropdown
            trigger={
              <Button>{style.charAt(0).toUpperCase() + style.slice(1)}</Button>
            }
            onSelect={(key) => {
              setStyle(key as PostStyle);
              updateQueryParam("style", key as string);
            }}
          >
            <Dropdown.Item
              value="cozy"
              description="PostStyle.Cozy.Description"
              icon="maximize2"
            >
              PostStyle.Cozy.Title
            </Dropdown.Item>
            <Dropdown.Item
              value="compact"
              description="PostStyle.Compact.Description"
              icon="zoomout"
            >
              PostStyle.Compact.Title
            </Dropdown.Item>
            <Dropdown.Item
              value="ultra"
              description="PostStyle.Ultra.Description"
              icon="minimize2"
            >
              PostStyle.Ultra.Title
            </Dropdown.Item>
          </Dropdown>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-6">
          <LoaderCircle
            className="animate-spin"
            style={{
              color: colors["text"],
            }}
            size={24}
          />
        </div>
      ) : (
        <Vstack align="stretch" className="p-4">
          {posts && posts.length > 0 ? (
            posts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                style={style}
                user={user}
                index={index}
                setCurrentPost={setCurrentPost}
                onOpen={onOpen}
              />
            ))
          ) : (
            <p
              className="text-center transition-color duration-250 ease-linear"
              style={{
                color: colors["text"],
              }}
            >
              No posts match your filters
            </p>
          )}
          <div>
            {posts && (
              <Button
                name=""
                onClick={() => {
                  addToast({
                    title: "Post pagination coming soon",
                    color: "warning",
                    variant: "bordered",
                    timeout: 3000,
                  });
                }}
              >
                Load More Posts
              </Button>
            )}
          </div>
        </Vstack>
      )}
      <Drawer
        isOpen={isOpen}
        hideCloseButton
        onOpenChange={onOpenChange}
        classNames={{
          base: "data-[placement=right]:sm:m-2 data-[placement=left]:sm:m-2  rounded-medium",
        }}
        size="4xl"
        motionProps={{
          variants: {
            enter: {
              opacity: 1,
              x: 0,
            },
            exit: {
              x: 500,
              opacity: 0,
            },
          },
        }}
        style={{
          backgroundColor: colors["mantle"],
        }}
      >
        <DrawerContent>
          {(onClose) => (
            <>
              {posts && (
                <>
                  <DrawerHeader
                    className="absolute top-0 inset-x-0 z-50 flex flex-row gap-2 px-2 py-2 border-b border-default-200/50 justify-between backdrop-blur-lg"
                    style={{
                      backgroundColor: colors["mantle"],
                    }}
                  >
                    <Tooltip content="Close">
                      <Button onClick={onClose}>
                        <svg
                          fill="none"
                          height="20"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          width="20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="m13 17 5-5-5-5M6 17l5-5-5-5" />
                        </svg>
                      </Button>
                    </Tooltip>
                    <div className="w-full flex justify-start gap-2">
                      <Button
                        icon="link"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.protocol}//${window.location.hostname}/p/${posts[currentPost].slug}`
                          );
                          addToast({
                            title: "Copied Link",
                          });
                        }}
                      >
                        Copy Link
                      </Button>
                      <Button
                        icon="arrowupright"
                        size="sm"
                        href={`/p/${posts[currentPost].slug}`}
                      >
                        Post Page
                      </Button>
                    </div>
                    <div className="flex gap-1 items-center">
                      <Tooltip content="Previous">
                        <Button
                          size="sm"
                          disabled={currentPost <= 0}
                          onClick={() => {
                            setCurrentPost(currentPost - 1);
                          }}
                        >
                          <svg
                            fill="none"
                            height="16"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            width="16"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="m18 15-6-6-6 6" />
                          </svg>
                        </Button>
                      </Tooltip>
                      <Tooltip content="Next">
                        <Button
                          size="sm"
                          disabled={currentPost >= posts.length - 1}
                          onClick={() => {
                            setCurrentPost(currentPost + 1);
                          }}
                          icon="chevrondown"
                        ></Button>
                      </Tooltip>
                    </div>
                  </DrawerHeader>
                  <DrawerBody className="pt-16">
                    <div className="flex flex-col gap-2 py-4">
                      <Card>
                        <Link href={`/p/${posts[currentPost].slug}`}>
                          <p className="text-2xl">{posts[currentPost].title}</p>
                        </Link>
                        <div className="flex items-center gap-3 text-xs text-default-500 pt-1">
                          <p>By</p>
                          <Link
                            href={`/u/${posts[currentPost].author.slug}`}
                            className="flex items-center gap-2"
                          >
                            <Avatar
                              size="sm"
                              className="w-6 h-6"
                              src={posts[currentPost].author.profilePicture}
                              classNames={{
                                base: "bg-transparent",
                              }}
                            />
                            <p>{posts[currentPost].author.name}</p>
                          </Link>
                          <p>
                            {formatDistance(
                              new Date(posts[currentPost].createdAt),
                              new Date(),
                              {
                                addSuffix: true,
                              }
                            )}
                          </p>
                        </div>
                        <Spacer y={4} />

                        <ThemedProse>
                          <div
                            className="!duration-250 !ease-linear !transition-all max-w-full break-words"
                            dangerouslySetInnerHTML={{
                              __html: posts[currentPost].content,
                            }}
                          />
                        </ThemedProse>

                        <Spacer y={4} />

                        <div className="flex gap-3">
                          <LikeButton
                            likes={posts[currentPost].likes.length}
                            liked={posts[currentPost].hasLiked}
                            parentId={posts[currentPost].id}
                          />
                          <Link
                            href={`/p/${posts[currentPost].slug}#create-comment`}
                          >
                            <Button size="sm" icon="messagecircle">
                              {posts[currentPost].comments.length}
                            </Button>
                          </Link>
                        </div>
                      </Card>

                      <Spacer y={4} />

                      <div className="flex flex-col gap-3">
                        {posts[currentPost]?.comments.map((comment) => (
                          <div key={comment.id}>
                            <CommentCard comment={comment} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </DrawerBody>
                  <DrawerFooter>
                    <Button onClick={onClose}>Close</Button>
                  </DrawerFooter>
                </>
              )}
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
