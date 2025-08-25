"use client";

import { useEffect, useState } from "react";
import PostCard from "./PostCard";
import { PostType } from "@/types/PostType";
import { addToast, Avatar } from "@heroui/react";
import { PostSort } from "@/types/PostSort";
import { PostStyle } from "@/types/PostStyle";
import { UserType } from "@/types/UserType";
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
import { Hstack, Vstack } from "@/framework/Stack";
import ThemedProse from "../themed-prose";
import { IconName } from "@/framework/Icon";
import { Card } from "@/framework/Card";
import Drawer from "@/framework/Drawer";
import { Chip } from "@/framework/Chip";
import { Spinner } from "@/framework/Spinner";

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
  const [open, setOpen] = useState(false);
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
      setOldIsOpen(open);
      return;
    }

    if (open == oldIsOpen) {
      return;
    }

    setOldIsOpen(open);

    if (posts) {
      if (open) {
        window.history.pushState(null, "", `/p/${posts[currentPost].slug}`);
      } else {
        window.history.back();
      }
    }
  }, [open, currentPost, posts, oldIsOpen]);

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
          <Spinner />
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
                            avatarSrc={tag.icon ? tag.icon : undefined}
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
                                  : siteTheme.colors["text"],
                              borderColor:
                                tagRules && tag.id in tagRules
                                  ? tagRules[tag.id] === 1
                                    ? siteTheme.colors["blue"]
                                    : siteTheme.colors["orange"]
                                  : siteTheme.colors["base"],
                            }}
                            icon={
                              tagRules && tag.id in tagRules
                                ? tagRules[tag.id] === 1
                                  ? "check"
                                  : "x"
                                : undefined
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
          <Spinner />
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
                onOpen={setOpen}
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
      {posts && posts[currentPost] && (
        <Drawer
          isOpen={open}
          onClose={() => setOpen(false)}
          hideClose
          header={
            <>
              <Hstack>
                <Tooltip content="Close">
                  <Button onClick={() => setOpen(false)} icon="chevronsleft" />
                </Tooltip>
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
              </Hstack>
              <div className="flex gap-1 items-center">
                <Tooltip content="Previous">
                  <Button
                    disabled={currentPost <= 0}
                    onClick={() => {
                      setCurrentPost(currentPost - 1);
                    }}
                    icon="chevronup"
                  />
                </Tooltip>
                <Tooltip content="Next">
                  <Button
                    disabled={currentPost >= posts.length - 1}
                    onClick={() => {
                      setCurrentPost(currentPost + 1);
                    }}
                    icon="chevrondown"
                  />
                </Tooltip>
              </div>
            </>
          }
          footer={<Button onClick={() => setOpen(false)}>Close</Button>}
        >
          <div className="flex flex-col gap-2 py-4">
            <Card>
              <Link href={`/p/${posts[currentPost].slug}`}>
                <p className="text-2xl">{posts[currentPost].title}</p>
              </Link>
              <div className="flex items-center gap-3 text-xs text-default-500 pt-1 mb-4">
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

              <ThemedProse>
                <div
                  className="!duration-250 !ease-linear !transition-all max-w-full break-words"
                  dangerouslySetInnerHTML={{
                    __html: posts[currentPost].content,
                  }}
                />
              </ThemedProse>

              <div className="flex gap-3 mt-4">
                <LikeButton
                  likes={posts[currentPost].likes.length}
                  liked={posts[currentPost].hasLiked}
                  parentId={posts[currentPost].id}
                />
                <Link href={`/p/${posts[currentPost].slug}#create-comment`}>
                  <Button size="sm" icon="messagecircle">
                    {posts[currentPost].comments.length}
                  </Button>
                </Link>
              </div>
            </Card>

            <div className="flex flex-col gap-3 mt-4">
              {posts[currentPost]?.comments.map((comment) => (
                <div key={comment.id}>
                  <CommentCard comment={comment} />
                </div>
              ))}
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
