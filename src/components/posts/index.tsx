"use client";

import { ReactNode, useEffect, useState } from "react";
import PostCard from "./PostCard";
import { PostType } from "@/types/PostType";
import {
  Avatar,
  Button,
  Chip,
  Divider,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spacer,
  Tooltip,
  useDisclosure,
} from "@heroui/react";
import { PostSort } from "@/types/PostSort";
import { PostStyle } from "@/types/PostStyle";
import { UserType } from "@/types/UserType";
import {
  Calendar,
  Calendar1,
  CalendarArrowDown,
  CalendarCog,
  CalendarDays,
  CalendarFold,
  CalendarRange,
  Check,
  Clock1,
  Clock2,
  Clock3,
  Clock4,
  ClockArrowDown,
  ClockArrowUp,
  LoaderCircle,
  MessageCircle,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { PostTime } from "@/types/PostTimes";
import { TagType } from "@/types/TagType";
import StickyPostCard from "./StickyPostCard";
import { getTags } from "@/requests/tag";
import { getSelf } from "@/requests/user";
import { getPosts } from "@/requests/post";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";
import LikeButton from "./LikeButton";
import { formatDistance } from "date-fns";
import CommentCard from "./CommentCard";
import ButtonAction from "../link-components/ButtonAction";
import { useTheme } from "@/providers/SiteThemeProvider";

export default function Posts() {
  const searchParams = useSearchParams();

  const { siteTheme } = useTheme();
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
    (["cozy", "compact", "ultra", "adaptive"].includes(
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
    { name: string; icon: ReactNode; description: string }
  > = {
    top: {
      name: "Top",
      icon: <Trophy />,
      description: "Shows the most liked posts first",
    },
    newest: {
      name: "Newest",
      icon: <ClockArrowUp />,
      description: "Shows the newest posts first",
    },
    oldest: {
      name: "Oldest",
      icon: <ClockArrowDown />,
      description: "Shows the oldest posts first",
    },
  };

  const times: Record<
    PostTime,
    { name: string; icon: ReactNode; description: string }
  > = {
    hour: {
      name: "Hour",
      icon: <Clock1 />,
      description: "Shows posts from the last hour",
    },
    three_hours: {
      name: "Three Hours",
      icon: <Clock2 />,
      description: "Shows posts from the last three hours",
    },
    six_hours: {
      name: "Six Hours",
      icon: <Clock3 />,
      description: "Shows posts from the last six hours",
    },
    twelve_hours: {
      name: "Twelve Hours",
      icon: <Clock4 />,
      description: "Shows posts from the last twelve hours",
    },
    day: {
      name: "Day",
      icon: <Calendar />,
      description: "Shows posts from the last day",
    },
    week: {
      name: "Week",
      icon: <CalendarDays />,
      description: "Shows posts from the last week",
    },
    month: {
      name: "Month",
      icon: <CalendarRange />,
      description: "Shows posts from the last month",
    },
    three_months: {
      name: "Three Months",
      icon: <CalendarFold />,
      description: "Shows posts from the last three months",
    },
    six_months: {
      name: "Six Months",
      icon: <CalendarCog />,
      description: "Shows posts from the last six months",
    },
    nine_months: {
      name: "Nine Months",
      icon: <CalendarArrowDown />,
      description: "Shows posts from the last nine months",
    },
    year: {
      name: "Year",
      icon: <Calendar1 />,
      description: "Shows posts from the last year",
    },
    all: {
      name: "All Time",
      icon: <Sparkles />,
      description: "Shows all posts",
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
          <div className="flex flex-col gap-3 p-4">
            {stickyPosts.map((post) => (
              <StickyPostCard key={post.id} post={post} />
            ))}
          </div>
        )
      )}

      <div className="flex justify-between p-4 pb-0">
        <div className="flex gap-2">
          <Dropdown backdrop="opaque">
            <DropdownTrigger>
              <Button
                size="sm"
                className="text-xs !duration-250 !ease-linear !transition-all"
                variant="faded"
                style={{
                  backgroundColor: siteTheme.colors["base"],
                  color: siteTheme.colors["text"],
                  borderColor: siteTheme.colors["crust"],
                }}
              >
                {sorts[sort]?.name}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              onAction={(key) => {
                setSort(key as PostSort);
                updateQueryParam("sort", key as string);
              }}
              className="text-[#333] dark:text-white"
            >
              {Object.entries(sorts).map(([key, sort]) => (
                <DropdownItem
                  key={key}
                  startContent={sort.icon}
                  description={sort.description}
                >
                  {sort.name}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
          <Dropdown backdrop="opaque">
            <DropdownTrigger>
              <Button
                size="sm"
                className="text-xs !duration-250 !ease-linear !transition-all"
                variant="faded"
                style={{
                  backgroundColor: siteTheme.colors["base"],
                  color: siteTheme.colors["text"],
                  borderColor: siteTheme.colors["crust"],
                }}
              >
                {times[time]?.name}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              onAction={(key) => {
                setTime(key as PostTime);
                updateQueryParam("time", key as string);
              }}
              className="text-[#333] dark:text-white"
            >
              {Object.entries(times).map(([key, sort]) => (
                <DropdownItem
                  key={key}
                  startContent={sort.icon}
                  description={sort.description}
                >
                  {sort.name}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
          <Popover placement="bottom" showArrow backdrop="opaque">
            <PopoverTrigger>
              <Button
                size="sm"
                className="text-xs !duration-250 !ease-linear !transition-all"
                variant="faded"
                style={{
                  backgroundColor: siteTheme.colors["base"],
                  color: siteTheme.colors["text"],
                  borderColor: siteTheme.colors["crust"],
                }}
              >
                {tagRules && Object.keys(tagRules).length > 0
                  ? "Custom Tags"
                  : "All Tags"}
              </Button>
            </PopoverTrigger>
            <PopoverContent>
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
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Dropdown backdrop="opaque">
            <DropdownTrigger>
              <Button
                size="sm"
                className="text-xs !duration-250 !ease-linear !transition-all"
                variant="faded"
                style={{
                  backgroundColor: siteTheme.colors["base"],
                  color: siteTheme.colors["text"],
                  borderColor: siteTheme.colors["crust"],
                }}
              >
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              onAction={(key) => {
                setStyle(key as PostStyle);
                updateQueryParam("style", key as string);
              }}
              className="text-[#333] dark:text-white"
            >
              <DropdownItem key="cozy">Cozy</DropdownItem>
              <DropdownItem key="compact">Compact</DropdownItem>
              <DropdownItem key="ultra">Ultra Compact</DropdownItem>
              <DropdownItem key="adaptive">Adaptive</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-6">
          <LoaderCircle
            className="animate-spin text-[#333] dark:text-[#999]"
            size={24}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-4">
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
            <p className="text-center text-[#333] dark:text-white transition-color duration-250 ease-linear">
              No posts match your filters
            </p>
          )}
          <div>
            {posts && (
              <ButtonAction
                name="Load More Posts"
                onPress={() => {
                  toast.warning("Post pagination coming soon");
                }}
              />
            )}
          </div>
        </div>
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
      >
        <DrawerContent>
          {(onClose) => (
            <>
              {posts && (
                <>
                  <DrawerHeader className="absolute top-0 inset-x-0 z-50 flex flex-row gap-2 px-2 py-2 border-b border-default-200/50 justify-between bg-content1/50 backdrop-saturate-150 backdrop-blur-lg">
                    <Tooltip content="Close">
                      <Button
                        isIconOnly
                        className="text-default-400"
                        size="sm"
                        variant="light"
                        onPress={onClose}
                      >
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
                        className="font-medium text-small text-default-500"
                        size="sm"
                        startContent={
                          <svg
                            height="16"
                            viewBox="0 0 16 16"
                            width="16"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M3.85.75c-.908 0-1.702.328-2.265.933-.558.599-.835 1.41-.835 2.29V7.88c0 .801.23 1.548.697 2.129.472.587 1.15.96 1.951 1.06a.75.75 0 1 0 .185-1.489c-.435-.054-.752-.243-.967-.51-.219-.273-.366-.673-.366-1.19V3.973c0-.568.176-.993.433-1.268.25-.27.632-.455 1.167-.455h4.146c.479 0 .828.146 1.071.359.246.215.43.54.497.979a.75.75 0 0 0 1.483-.23c-.115-.739-.447-1.4-.99-1.877C9.51 1 8.796.75 7.996.75zM7.9 4.828c-.908 0-1.702.326-2.265.93-.558.6-.835 1.41-.835 2.29v3.905c0 .879.275 1.69.833 2.289.563.605 1.357.931 2.267.931h4.144c.91 0 1.705-.326 2.268-.931.558-.599.833-1.41.833-2.289V8.048c0-.879-.275-1.69-.833-2.289-.563-.605-1.357-.931-2.267-.931zm-1.6 3.22c0-.568.176-.992.432-1.266.25-.27.632-.454 1.168-.454h4.145c.54 0 .92.185 1.17.453.255.274.43.698.43 1.267v3.905c0 .569-.175.993-.43 1.267-.25.268-.631.453-1.17.453H7.898c-.54 0-.92-.185-1.17-.453-.255-.274-.43-.698-.43-1.267z"
                              fill="currentColor"
                              fillRule="evenodd"
                            />
                          </svg>
                        }
                        variant="flat"
                        onPress={() => {
                          navigator.clipboard.writeText(
                            `${window.location.protocol}//${window.location.hostname}/p/${posts[currentPost].slug}`
                          );
                          toast.success("Copied Link");
                        }}
                      >
                        Copy Link
                      </Button>
                      <Button
                        className="font-medium text-small text-default-500"
                        endContent={
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
                            <path d="M7 17 17 7M7 7h10v10" />
                          </svg>
                        }
                        size="sm"
                        variant="flat"
                        onPress={() => {
                          redirect(`/p/${posts[currentPost].slug}`);
                        }}
                      >
                        Post Page
                      </Button>
                    </div>
                    <div className="flex gap-1 items-center">
                      <Tooltip content="Previous">
                        <Button
                          isIconOnly
                          className="text-default-500"
                          size="sm"
                          variant="flat"
                          isDisabled={currentPost <= 0}
                          onPress={() => {
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
                          isIconOnly
                          className="text-default-500"
                          size="sm"
                          variant="flat"
                          isDisabled={currentPost >= posts.length - 1}
                          onPress={() => {
                            setCurrentPost(currentPost + 1);
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
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </Button>
                      </Tooltip>
                    </div>
                  </DrawerHeader>
                  <DrawerBody className="pt-16">
                    <div className="flex flex-col gap-2 py-4">
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

                      <div
                        className="prose dark:prose-invert !duration-250 !ease-linear !transition-all max-w-full break-words"
                        dangerouslySetInnerHTML={{
                          __html: posts[currentPost].content,
                        }}
                      />

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
                          <Button size="sm" variant="bordered">
                            <MessageCircle size={16} />{" "}
                            {posts[currentPost].comments.length}
                          </Button>
                        </Link>
                      </div>

                      <Spacer y={4} />

                      <Divider />

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
                    <Button color="danger" variant="light" onPress={onClose}>
                      Close
                    </Button>
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
