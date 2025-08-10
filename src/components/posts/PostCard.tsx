"use client";

import {
  Avatar,
  Button,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
  Spacer,
} from "@heroui/react";
import { formatDistance } from "date-fns";
import Link from "next/link";
import { PostType } from "@/types/PostType";
import {
  Flag,
  MessageCircle,
  Minus,
  MoreVertical,
  Plus,
  Shield,
  ShieldAlert,
  ShieldX,
  Star,
  StarOff,
  Trash,
  X,
} from "lucide-react";
import LikeButton from "./LikeButton";
import { PostStyle } from "@/types/PostStyle";
import { UserType } from "@/types/UserType";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { TagType } from "@/types/TagType";
import { deletePost, stickPost } from "@/requests/post";
import { assignAdmin, assignMod } from "@/requests/mod";
import { useTheme } from "@/providers/SiteThemeProvider";
import { Card } from "@/framework/Card";

export default function PostCard({
  post,
  style,
  user,
  index,
  setCurrentPost,
  onOpen,
}: {
  post: PostType;
  style: PostStyle;
  user?: UserType;
  index: number;
  setCurrentPost: Dispatch<SetStateAction<number>>;
  onOpen: () => void;
}) {
  const [minimized, setMinimized] = useState<boolean>(false);
  const [hidden, setHidden] = useState<boolean>(false);
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);
  const { siteTheme } = useTheme();

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

  return (
    <Card
      style={{
        display: hidden ? "none" : "flex",
      }}
    >
      {(style == "cozy" || style == "adaptive") &&
        (minimized ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/p/${post.slug}`}
                onClick={(e) => {
                  if (window.innerWidth > 500) {
                    e.preventDefault();
                    setCurrentPost(index);
                    onOpen();
                  }
                }}
              >
                <p>{post.title}</p>
              </Link>

              <div className="flex items-center gap-3 text-xs text-default-500 pt-1">
                <p>By</p>
                <Link
                  href={`/u/${post.author.slug}`}
                  className="flex items-center gap-2"
                >
                  <Avatar
                    size="sm"
                    className="w-6 h-6"
                    src={post.author.profilePicture}
                    classNames={{
                      base: "bg-transparent",
                    }}
                  />
                  <p>{post.author.name}</p>
                </Link>
                <p>
                  {formatDistance(new Date(post.createdAt), new Date(), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="light"
              isIconOnly
              onPress={() => setMinimized(false)}
              style={{
                color: siteTheme.colors["text"],
              }}
            >
              <Plus size={16} />
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center">
              <Link
                href={`/p/${post.slug}`}
                onClick={(e) => {
                  if (window.innerWidth > 500) {
                    e.preventDefault();
                    setCurrentPost(index);
                    onOpen();
                  }
                }}
              >
                <p className="text-2xl">{post.title}</p>
              </Link>
              <Button
                size="sm"
                variant="light"
                isIconOnly
                onPress={() => setMinimized(true)}
                style={{
                  color: siteTheme.colors["text"],
                }}
              >
                <Minus size={16} />
              </Button>
            </div>

            <div className="flex items-center gap-3 text-xs text-default-500 pt-1">
              <p>By</p>
              <Link
                href={`/u/${post.author.slug}`}
                className="flex items-center gap-2"
              >
                <Avatar
                  size="sm"
                  className="w-6 h-6"
                  src={post.author.profilePicture}
                  classNames={{
                    base: "bg-transparent",
                  }}
                />
                <p>{post.author.name}</p>
              </Link>
              <p>
                {formatDistance(new Date(post.createdAt), new Date(), {
                  addSuffix: true,
                })}
              </p>
            </div>

            <Spacer y={4} />

            <div
              className="prose dark:prose-invert !duration-250 !ease-linear !transition-all max-w-full break-words"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            <Spacer y={4} />

            {post.tags.filter((tag) => tag.name != "D2Jam").length > 0 ? (
              <div className="flex gap-1">
                {post.tags
                  .filter((tag) => tag.name != "D2Jam")
                  .map((tag: TagType) => (
                    <Link
                      href="/"
                      key={tag.id}
                      className={`transition-all transform duration-500 ease-in-out ${
                        !reduceMotion ? "hover:scale-110" : ""
                      }`}
                    >
                      <Chip
                        radius="sm"
                        size="sm"
                        className="!duration-250 !ease-linear !transition-all"
                        variant="faded"
                        avatar={
                          tag.icon && (
                            <Avatar
                              src={tag.icon}
                              classNames={{ base: "bg-transparent" }}
                            />
                          )
                        }
                      >
                        {tag.name}
                      </Chip>
                    </Link>
                  ))}
              </div>
            ) : (
              <></>
            )}

            {post.tags.length > 0 && <Spacer y={4} />}

            <div className="flex gap-3">
              <LikeButton
                likes={post.likes.length}
                liked={post.hasLiked}
                parentId={post.id}
              />
              <Link href={`/p/${post.slug}#create-comment`}>
                <Button
                  size="sm"
                  variant="bordered"
                  style={{
                    color: siteTheme.colors["text"],
                    borderColor: siteTheme.colors["text"],
                  }}
                >
                  <MessageCircle size={16} /> {post.comments.length}
                </Button>
              </Link>
              <Dropdown backdrop="opaque">
                <DropdownTrigger>
                  <Button
                    size="sm"
                    variant="bordered"
                    isIconOnly
                    style={{
                      color: siteTheme.colors["text"],
                      borderColor: siteTheme.colors["text"],
                    }}
                  >
                    <MoreVertical size={16} />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu className="text-[#333] dark:text-white">
                  <DropdownSection showDivider={user?.mod} title="Actions">
                    <DropdownItem
                      key="report"
                      startContent={<Flag />}
                      description="Report this post to moderators to handle"
                      onPress={() => {
                        toast.warning("Report functionality coming soon");
                      }}
                    >
                      Create Report
                    </DropdownItem>
                    {user?.slug == post.author.slug ? (
                      <DropdownItem
                        key="delete"
                        startContent={<Trash />}
                        description="Delete your post"
                        onPress={async () => {
                          const response = await deletePost(post.id);

                          if (response.ok) {
                            toast.success("Deleted post");
                            setHidden(true);
                          } else {
                            toast.error("Error while deleting post");
                          }
                        }}
                      >
                        Delete
                      </DropdownItem>
                    ) : (
                      <></>
                    )}
                  </DropdownSection>
                  {user?.mod ? (
                    <DropdownSection title="Mod Zone">
                      <DropdownItem
                        key="remove"
                        startContent={<X />}
                        description="Remove this post"
                        onPress={async () => {
                          const response = await deletePost(post.id);

                          if (response.ok) {
                            toast.success("Removed post");
                            setHidden(true);
                          } else {
                            toast.error("Error while removing post");
                          }
                        }}
                      >
                        Remove
                      </DropdownItem>
                      {post.sticky ? (
                        <DropdownItem
                          key="unsticky"
                          startContent={<StarOff />}
                          description="Unsticky post"
                          onPress={async () => {
                            const response = await stickPost(post.id, false);

                            if (response.ok) {
                              toast.success("Unsticked post");
                              window.location.reload();
                            } else {
                              toast.error("Error while unstickying post");
                            }
                          }}
                        >
                          Unsticky
                        </DropdownItem>
                      ) : (
                        <DropdownItem
                          key="sticky"
                          startContent={<Star />}
                          description="Sticky post"
                          onPress={async () => {
                            const response = await stickPost(post.id, true);

                            if (response.ok) {
                              toast.success("Stickied post");
                              window.location.reload();
                            } else {
                              toast.error("Error while stickying post");
                            }
                          }}
                        >
                          Sticky
                        </DropdownItem>
                      )}
                      {user?.admin && !post.author.mod ? (
                        <DropdownItem
                          key="promote-mod"
                          startContent={<Shield />}
                          description="Promote user to Mod"
                          onPress={async () => {
                            const response = await assignMod(
                              post.author.slug,
                              true
                            );

                            if (response.ok) {
                              toast.success("Promoted User to Mod");
                              window.location.reload();
                            } else {
                              toast.error("Error while promoting user to Mod");
                            }
                          }}
                        >
                          Appoint as mod
                        </DropdownItem>
                      ) : (
                        <></>
                      )}
                      {user?.admin && post.author.mod && !post.author.admin ? (
                        <DropdownItem
                          key="demote-mod"
                          startContent={<ShieldX />}
                          description="Demote user from Mod"
                          onPress={async () => {
                            const response = await assignMod(
                              post.author.slug,
                              false
                            );

                            if (response.ok) {
                              toast.success("Demoted User");
                              window.location.reload();
                            } else {
                              toast.error("Error while demoting user");
                            }
                          }}
                        >
                          Remove as mod
                        </DropdownItem>
                      ) : (
                        <></>
                      )}
                      {user?.admin && !post.author.admin ? (
                        <DropdownItem
                          key="promote-admin"
                          startContent={<ShieldAlert />}
                          description="Promote user to Admin"
                          onPress={async () => {
                            const response = await assignAdmin(
                              post.author.slug,
                              true
                            );

                            if (response.ok) {
                              toast.success("Promoted User to Admin");
                              window.location.reload();
                            } else {
                              toast.error(
                                "Error while promoting user to Admin"
                              );
                            }
                          }}
                        >
                          Appoint as admin
                        </DropdownItem>
                      ) : (
                        <></>
                      )}
                      {user?.admin &&
                      post.author.admin &&
                      post.author.id !== user.id ? (
                        <DropdownItem
                          key="demote-admin"
                          startContent={<ShieldX />}
                          description="Demote user to mod"
                          onPress={async () => {
                            const response = await assignAdmin(
                              post.author.slug,
                              false
                            );

                            if (response.ok) {
                              toast.success("Demoted User to Mod");
                              window.location.reload();
                            } else {
                              toast.error("Error while demoting user to mod");
                            }
                          }}
                        >
                          Remove as admin
                        </DropdownItem>
                      ) : (
                        <></>
                      )}
                    </DropdownSection>
                  ) : (
                    <></>
                  )}
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        ))}
      {style == "compact" && (
        <div>
          <Link
            href={`/p/${post.slug}`}
            onClick={(e) => {
              if (window.innerWidth > 500) {
                e.preventDefault();
                setCurrentPost(index);
                onOpen();
              }
            }}
          >
            <p className="text-2xl">{post.title}</p>
          </Link>

          <div className="flex items-center gap-3 text-xs text-default-500 pt-1">
            <p>By</p>
            <Link
              href={`/u/${post.author.slug}`}
              className="flex items-center gap-2"
            >
              <Avatar
                size="sm"
                className="w-6 h-6"
                src={post.author.profilePicture}
                classNames={{
                  base: "bg-transparent",
                }}
              />
              <p>{post.author.name}</p>
            </Link>
            <p>
              {formatDistance(new Date(post.createdAt), new Date(), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
      )}
      {style == "ultra" && (
        <div className="flex items-center gap-4">
          <Link
            href={`/p/${post.slug}`}
            onClick={(e) => {
              if (window.innerWidth > 500) {
                e.preventDefault();
                setCurrentPost(index);
                onOpen();
              }
            }}
          >
            <p>{post.title}</p>
          </Link>

          <div className="flex items-center gap-3 text-xs text-default-500 pt-1">
            <p>By</p>
            <Link
              href={`/u/${post.author.slug}`}
              className="flex items-center gap-2"
            >
              <Avatar
                size="sm"
                className="w-6 h-6"
                src={post.author.profilePicture}
                classNames={{
                  base: "bg-transparent",
                }}
              />
              <p>{post.author.name}</p>
            </Link>
            <p>
              {formatDistance(new Date(post.createdAt), new Date(), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
