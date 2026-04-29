"use client";

import { addToast, Avatar } from "bioloom-ui";
import Link from "@/compat/next-link";
import { PostType } from "@/types/PostType";
import { Heart, MessageCircle, MoreVertical } from "lucide-react";
import LikeButton from "./LikeButton";
import { PostStyle } from "@/types/PostStyle";
import { UserType } from "@/types/UserType";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { TagType } from "@/types/TagType";
import { deletePost, removePost, stickPost } from "@/requests/post";
import { assignAdmin, assignMod } from "@/requests/mod";
import { Card } from "bioloom-ui";
import { Button } from "bioloom-ui";
import ThemedProse from "../themed-prose";
import { useTheme } from "@/providers/useSiteTheme";
import { Dropdown } from "bioloom-ui";
import { Chip } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { useTranslations } from "@/compat/next-intl";
import MentionedContent from "../mentions/MentionedContent";
import PostReactions from "./PostReactions";
import ContentStatusMeta from "./ContentStatusMeta";

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
  index?: number;
  setCurrentPost?: Dispatch<SetStateAction<number>>;
  onOpen?: (val1: boolean) => void;
}) {
  const [currentPostData, setCurrentPostData] = useState<PostType>(post);
  const [minimized, setMinimized] = useState<boolean>(false);
  const [hidden, setHidden] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [actionsLayerOpen, setActionsLayerOpen] = useState(false);
  const { colors } = useTheme();
  const t = useTranslations();
  const actionsOpen = dropdownOpen || reactionsOpen;
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCurrentPostData(post);
  }, [post]);

  useEffect(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (actionsOpen) {
      setActionsLayerOpen(true);
      return;
    }

    closeTimerRef.current = setTimeout(() => {
      setActionsLayerOpen(false);
      closeTimerRef.current = null;
    }, 220);

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [actionsOpen]);

  const canSeeModerated = Boolean(user?.mod || user?.admin);
  const isModerated = Boolean(
    currentPostData.deletedAt || currentPostData.removedAt
  );
  const isAuthor = user?.slug === currentPostData.author.slug;
  const titleText = isModerated
    ? currentPostData.removedAt
      ? "[Removed Post]"
      : "[Deleted Post]"
    : currentPostData.title;

  if (hidden || (isModerated && !canSeeModerated)) {
    return null;
  }

  return (
    <Card
      className={`relative overflow-visible ${actionsLayerOpen ? "z-50" : "z-0"}`}
      style={{
        display: hidden ? "none" : "flex",
      }}
    >
      {style == "Cozy" &&
        (minimized ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <Link
                href={`/p/${currentPostData.slug}`}
                onClick={(e) => {
                  if (window.innerWidth > 500) {
                    if (onOpen) {
                      e.preventDefault();
                    }
                    if (setCurrentPost && index !== undefined) {
                      setCurrentPost(index);
                    }
                    if (onOpen) {
                      onOpen(true);
                    }
                  }
                }}
              >
                <p>{titleText}</p>
              </Link>

              <div
                className="flex items-center gap-3 text-xs pt-1"
                style={{
                  color: colors["textFaded"],
                }}
              >
                <Text size="xs" color="textFaded">
                  PostCard.By
                </Text>
                <Link
                  href={`/u/${currentPostData.author.slug}`}
                  className="flex items-center gap-2"
                >
                  <Avatar
                    size={24}
                    src={currentPostData.author.profilePicture}
                    style={{ backgroundColor: "transparent" }}
                  />
                  <p>{currentPostData.author.name}</p>
                </Link>
                <ContentStatusMeta
                  createdAt={currentPostData.createdAt}
                  editedAt={currentPostData.editedAt}
                  deletedAt={currentPostData.deletedAt}
                  removedAt={currentPostData.removedAt}
                />
              </div>
            </div>
            <Button icon="plus" onClick={() => setMinimized(false)}></Button>
          </div>
        ) : (
          <div className="w-full">
            <div className="flex justify-between items-center">
              <Link
                href={`/p/${currentPostData.slug}`}
                onClick={(e) => {
                  if (window.innerWidth > 500) {
                    if (onOpen) {
                      e.preventDefault();
                    }
                    if (setCurrentPost && index !== undefined) {
                      setCurrentPost(index);
                    }
                    if (onOpen) {
                      onOpen(true);
                    }
                  }
                }}
              >
                <p className="text-2xl">{titleText}</p>
              </Link>
              <Button icon="minus" onClick={() => setMinimized(true)}></Button>
            </div>

            <div
              className="flex items-center gap-3 text-xs pt-1"
              style={{
                color: colors["textFaded"],
              }}
            >
              <Text size="xs" color="textFaded">
                PostCard.By
              </Text>
              <Link
                href={`/u/${currentPostData.author.slug}`}
                className="flex items-center gap-2"
              >
                <Avatar
                  size={24}
                  src={currentPostData.author.profilePicture}
                  style={{ backgroundColor: "transparent" }}
                />
                <p>{currentPostData.author.name}</p>
              </Link>
              <ContentStatusMeta
                createdAt={currentPostData.createdAt}
                editedAt={currentPostData.editedAt}
                deletedAt={currentPostData.deletedAt}
                removedAt={currentPostData.removedAt}
              />
            </div>

            <div className="p-2" />

            {isModerated ? (
              <Text color="textFaded" size="sm">
                {currentPostData.removedAt
                  ? "This post was removed."
                  : "This post was deleted."}
              </Text>
            ) : (
              <ThemedProse>
                <MentionedContent
                  html={currentPostData.content}
                  className="!duration-250 !ease-linear !transition-all max-w-full break-words"
                />
              </ThemedProse>
            )}

            <div className="p-2" />

            {!isModerated &&
            currentPostData.tags.filter((tag) => tag.name != "D2Jam").length > 0 ? (
              <div className="flex gap-1">
                {currentPostData.tags
                  .filter((tag) => tag.name != "D2Jam")
                  .map((tag: TagType) => (
                    <Chip
                      key={tag.id}
                      // avatarSrc={tag.icon ? tag.icon : undefined}
                    >
                      {tag.name}
                    </Chip>
                  ))}
              </div>
            ) : (
              <></>
            )}

            {!isModerated && currentPostData.tags.length > 0 && <div className="p-2" />}

            {!isModerated && (
            <div className="relative z-20 flex gap-3">
              <LikeButton
                likes={currentPostData.likes.length}
                liked={currentPostData.hasLiked}
                parentId={currentPostData.id}
              />
              <Link href={`/p/${currentPostData.slug}#create-comment`}>
                <Button size="sm" icon="messagecircle">
                  {currentPostData.comments.length}
                </Button>
              </Link>
              <div className="relative z-30">
                <Dropdown
                  onOpenChange={setDropdownOpen}
                  trigger={
                    <Button size="sm">
                      <MoreVertical size={16} />
                    </Button>
                  }
                >
                  <Dropdown.Item
                    key="copy"
                    icon="link"
                    description="PostCard.Copy.Description"
                    onClick={async () => {
                      navigator.clipboard.writeText(
                        `${window.location.protocol}//${window.location.hostname}/p/${currentPostData.slug}`
                      );
                      addToast({
                        title: t("PostCard.Copy.Success"),
                      });
                    }}
                  >
                    PostCard.Copy.Title
                  </Dropdown.Item>
                  {isAuthor ? (
                    <Dropdown.Item
                      key="edit"
                      href={`/p/${currentPostData.slug}?edit=1`}
                      icon="squarepen"
                      description="Edit your post"
                    >
                      Edit
                    </Dropdown.Item>
                  ) : null}
                  {isAuthor ? (
                    <Dropdown.Item
                      key="delete"
                      icon="trash"
                      description="PostCard.Delete.Description"
                      onClick={async () => {
                        const response = await deletePost(currentPostData.slug);

                        if (response.ok) {
                          addToast({
                            title: t("PostCard.Delete.Success"),
                          });
                          setCurrentPostData((prev) => ({
                            ...prev,
                            deletedAt: new Date(),
                          }));
                          setHidden(!canSeeModerated);
                        } else {
                          addToast({
                            title: t("PostCard.Delete.Error"),
                          });
                        }
                      }}
                    >
                      PostCard.Delete.Title
                    </Dropdown.Item>
                  ) : (
                    <></>
                  )}
                  {user?.mod || user?.admin ? (
                    <>
                      <Dropdown.Item
                        key="remove"
                        icon="x"
                        description="PostCard.Remove.Description"
                        onClick={async () => {
                          const response = await removePost(currentPostData.slug);

                          if (response.ok) {
                            addToast({
                              title: t("PostCard.Remove.Success"),
                            });
                            setCurrentPostData((prev) => ({
                              ...prev,
                              removedAt: new Date(),
                            }));
                            setHidden(!canSeeModerated);
                          } else {
                            addToast({
                              title: t("PostCard.Remove.Error"),
                            });
                          }
                        }}
                      >
                        PostCard.Remove.Title
                      </Dropdown.Item>
                      {currentPostData.sticky ? (
                        <Dropdown.Item
                          key="unsticky"
                          icon="staroff"
                          description="PostCard.Unsticky.Description"
                          onClick={async () => {
                            const response = await stickPost(currentPostData.slug, false);

                            if (response.ok) {
                              addToast({
                                title: t("PostCard.Unsticky.Success"),
                              });
                              window.location.reload();
                            } else {
                              addToast({
                                title: t("PostCard.Unsticky.Error"),
                              });
                            }
                          }}
                        >
                          PostCard.Unsticky.Title
                        </Dropdown.Item>
                      ) : (
                        <Dropdown.Item
                          key="sticky"
                          icon="star"
                          description="PostCard.Sticky.Description"
                          onClick={async () => {
                            const response = await stickPost(currentPostData.slug, true);

                            if (response.ok) {
                              addToast({
                                title: t("PostCard.Sticky.Success"),
                              });
                              window.location.reload();
                            } else {
                              addToast({
                                title: t("PostCard.Sticky.Error"),
                              });
                            }
                          }}
                        >
                          PostCard.Sticky.Title
                        </Dropdown.Item>
                      )}
                      {user?.admin && !currentPostData.author.mod ? (
                        <Dropdown.Item
                          key="promote-mod"
                          icon="shield"
                          description="PostCard.Promote.Description"
                          onClick={async () => {
                            const response = await assignMod(
                              currentPostData.author.slug,
                              true
                            );

                            if (response.ok) {
                              addToast({
                                title: t("PostCard.Promote.Success"),
                              });
                              window.location.reload();
                            } else {
                              addToast({
                                title: t("PostCard.Promote.Error"),
                              });
                            }
                          }}
                        >
                          PostCard.Promote.Title
                        </Dropdown.Item>
                      ) : (
                        <></>
                      )}
                      {user?.admin &&
                      currentPostData.author.mod &&
                      !currentPostData.author.admin ? (
                        <Dropdown.Item
                          key="demote-mod"
                          icon="shieldx"
                          description="PostCard.Demote.Description"
                          onClick={async () => {
                            const response = await assignMod(
                              currentPostData.author.slug,
                              false
                            );

                            if (response.ok) {
                              addToast({
                                title: t("PostCard.Demote.Success"),
                              });
                              window.location.reload();
                            } else {
                              addToast({
                                title: t("PostCard.Demote.Error"),
                              });
                            }
                          }}
                        >
                          PostCard.Demote.Title
                        </Dropdown.Item>
                      ) : (
                        <></>
                      )}
                      {user?.admin && !currentPostData.author.admin ? (
                        <Dropdown.Item
                          key="promote-admin"
                          icon="shieldalert"
                          description="PostCard.PromoteAdmin.Description"
                          onClick={async () => {
                            const response = await assignAdmin(
                              currentPostData.author.slug,
                              true
                            );

                            if (response.ok) {
                              addToast({
                                title: t("PostCard.PromoteAdmin.Success"),
                              });
                              window.location.reload();
                            } else {
                              addToast({
                                title: t("PostCard.PromoteAdmin.Error"),
                              });
                            }
                          }}
                        >
                          PostCard.PromoteAdmin.Title
                        </Dropdown.Item>
                      ) : (
                        <></>
                      )}
                      {user?.admin &&
                      currentPostData.author.admin &&
                      currentPostData.author.id !== user.id ? (
                        <Dropdown.Item
                          key="demote-admin"
                          icon="shieldx"
                          description="PostCard.DemoteAdmin.Description"
                          onClick={async () => {
                            const response = await assignAdmin(
                              currentPostData.author.slug,
                              false
                            );

                            if (response.ok) {
                              addToast({
                                title: t("PostCard.DemoteAdmin.Success"),
                              });
                              window.location.reload();
                            } else {
                              addToast({
                                title: t("PostCard.DemoteAdmin.Error"),
                              });
                            }
                          }}
                        >
                          PostCard.DemoteAdmin.Title
                        </Dropdown.Item>
                      ) : (
                        <></>
                      )}
                    </>
                  ) : (
                    <></>
                  )}
                </Dropdown>
              </div>
              <PostReactions
                postId={currentPostData.id}
                reactions={currentPostData.reactions}
                onOverlayChange={setReactionsOpen}
              />
            </div>)}
          </div>
        ))}
      {style == "Compact" && (
        <div className="flex w-full items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              href={`/p/${currentPostData.slug}`}
              onClick={(e) => {
                if (window.innerWidth > 500) {
                  if (onOpen) {
                    e.preventDefault();
                  }
                  if (setCurrentPost && index !== undefined) {
                    setCurrentPost(index);
                  }
                  if (onOpen) {
                    onOpen(true);
                  }
                }
              }}
            >
              <p className="truncate text-2xl">{titleText}</p>
            </Link>

            <div className="flex items-center gap-3 text-xs text-default-500 pt-1">
              <Text size="xs" color="textFaded">
                PostCard.By
              </Text>
              <Link
                href={`/u/${currentPostData.author.slug}`}
                className="flex items-center gap-2"
              >
                <Avatar
                  size={24}
                  src={currentPostData.author.profilePicture}
                  style={{ backgroundColor: "transparent" }}
                />
                <p>{currentPostData.author.name}</p>
              </Link>
              <ContentStatusMeta
                createdAt={currentPostData.createdAt}
                editedAt={currentPostData.editedAt}
                deletedAt={currentPostData.deletedAt}
                removedAt={currentPostData.removedAt}
              />
            </div>
          </div>
          <div
            className="flex shrink-0 items-center gap-3 pt-1 text-xs"
            style={{ color: colors["textFaded"] }}
          >
            <span className="inline-flex items-center gap-1">
              <Heart size={14} />
              {currentPostData.likes.length}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle size={14} />
              {currentPostData.comments.length}
            </span>
          </div>
        </div>
      )}
      {style == "Ultra" && (
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              href={`/p/${currentPostData.slug}`}
              onClick={(e) => {
                if (window.innerWidth > 500) {
                  if (onOpen) {
                    e.preventDefault();
                  }
                  if (setCurrentPost && index !== undefined) {
                    setCurrentPost(index);
                  }
                  if (onOpen) {
                    onOpen(true);
                  }
                }
              }}
            >
              <p className="truncate">{titleText}</p>
            </Link>

            <div className="flex items-center gap-3 text-xs text-default-500 pt-1">
              <Text size="xs" color="textFaded">
                PostCard.By
              </Text>
              <Link
                href={`/u/${currentPostData.author.slug}`}
                className="flex items-center gap-2"
              >
                <Avatar
                  size={24}
                  src={currentPostData.author.profilePicture}
                  style={{ backgroundColor: "transparent" }}
                />
                <p>{currentPostData.author.name}</p>
              </Link>
              <ContentStatusMeta
                createdAt={currentPostData.createdAt}
                editedAt={currentPostData.editedAt}
                deletedAt={currentPostData.deletedAt}
                removedAt={currentPostData.removedAt}
              />
            </div>
          </div>
          <div
            className="flex shrink-0 items-center gap-3 text-xs"
            style={{ color: colors["textFaded"] }}
          >
            <span className="inline-flex items-center gap-1">
              <Heart size={13} />
              {currentPostData.likes.length}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle size={13} />
              {currentPostData.comments.length}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
