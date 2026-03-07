"use client";

import LikeButton from "@/components/posts/LikeButton";
import { hasCookie } from "@/helpers/cookie";
import { PostType } from "@/types/PostType";
import { TagType } from "@/types/TagType";
import { UserType } from "@/types/UserType";
import Link from "next/link";
import { addToast } from "bioloom-ui";
import { MoreVertical } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Editor from "@/components/editor";
import CommentCard from "@/components/posts/CommentCard";
import { getSelf } from "@/requests/user";
import {
  deletePost,
  getPost,
  removePost,
  stickPost,
  updatePost,
} from "@/requests/post";
import { assignAdmin, assignMod } from "@/requests/mod";
import { postComment } from "@/requests/comment";
import { Card } from "bioloom-ui";
import { Button } from "bioloom-ui";
import ThemedProse from "@/components/themed-prose";
import { Dropdown } from "bioloom-ui";
import { Hstack } from "bioloom-ui";
import { Input } from "bioloom-ui";
import { Spinner } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { Avatar } from "bioloom-ui";
import { Chip } from "bioloom-ui";
import { useTranslations } from "next-intl";
import MentionedContent from "@/components/mentions/MentionedContent";
import PostReactions from "@/components/posts/PostReactions";
import ContentStatusMeta from "@/components/posts/ContentStatusMeta";

export default function PostPage() {
  const [post, setPost] = useState<PostType>();
  const { slug } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editParam = searchParams.get("edit");
  const [user, setUser] = useState<UserType>();
  const [loading, setLoading] = useState<boolean>(true);
  const [content, setContent] = useState("");
  const [waitingPost, setWaitingPost] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const t = useTranslations();

  useEffect(() => {
    const loadUserAndPosts = async () => {
      try {
        setLoading(true);

        // Fetch the user
        const userResponse = await getSelf();
        const userData = userResponse.ok
          ? await userResponse.json()
          : undefined;
        setUser(userData);

        const postResponse = await getPost(`${slug}`, userData?.slug);
        if (!postResponse.ok) {
          setPost(undefined);
          setLoading(false);
          return;
        }
        const postData = await postResponse.json();
        setPost(postData);
        setDraftTitle(postData.title);
        setDraftContent(postData.content);
        setEditing(editParam === "1");

        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    loadUserAndPosts();
  }, [editParam, slug]);

  useEffect(() => {
    if (!post) return;
    setDraftTitle(post.title);
    setDraftContent(post.content);
  }, [post]);

  const canSeeModerated = Boolean(user?.mod || user?.admin);
  const isAuthor = user?.slug === post?.author.slug;
  const isModerated = Boolean(post?.deletedAt || post?.removedAt);

  if (!loading && !post) {
    return (
      <Card>
        <Text color="textFaded">This post is unavailable.</Text>
      </Card>
    );
  }

  return (
    <>
      {loading ? (
        <div className="flex justify-center p-6">
          <Spinner />
        </div>
      ) : (
        <>
          <Card>
            <div>
              {post && (
                <div>
                  <Link href={`/p/${post.slug}`}>
                    <p className="text-2xl">
                      {isModerated
                        ? post.removedAt
                          ? "[Removed Post]"
                          : "[Deleted Post]"
                        : post.title}
                    </p>
                  </Link>

                  <div className="flex items-center gap-3 text-xs text-default-500 pt-1 mb-4">
                    <Text size="xs" color="textFaded">
                      PostCard.By
                    </Text>
                    <Link
                      href={`/u/${post.author.slug}`}
                      className="flex items-center gap-2"
                    >
                      <Avatar
                        className="w-6 h-6"
                        src={post.author.profilePicture}
                      />
                      <p>{post.author.name}</p>
                    </Link>
                    <ContentStatusMeta
                      createdAt={post.createdAt}
                      editedAt={post.editedAt}
                      deletedAt={post.deletedAt}
                      removedAt={post.removedAt}
                    />
                  </div>

                  {editing && !isModerated ? (
                    <div className="flex flex-col gap-3">
                      <Input
                        value={draftTitle}
                        onChange={(event) => setDraftTitle(event.target.value)}
                        placeholder="Post title"
                      />
                      <Editor
                        content={draftContent}
                        setContent={setDraftContent}
                        format="markdown"
                      />
                      <div className="flex gap-2">
                        <Button
                          color="blue"
                          onClick={async () => {
                            const response = await updatePost(post.id, {
                              title: draftTitle,
                              content: draftContent,
                            });

                            if (!response.ok) {
                              addToast({
                                title: "Failed to update post",
                              });
                              return;
                            }

                            const json = await response.json();
                            setPost((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    ...json.data,
                                    author: prev.author,
                                    comments: prev.comments,
                                    likes: prev.likes,
                                    reactions: prev.reactions,
                                  }
                                : prev,
                            );
                            setEditing(false);
                            router.replace(`/p/${post.slug}`, { scroll: false });
                            addToast({ title: "Post updated" });
                          }}
                        >
                          Save
                        </Button>
                        <Button
                          onClick={() => {
                            setDraftTitle(post.title);
                            setDraftContent(post.content);
                            setEditing(false);
                            router.replace(`/p/${post.slug}`, { scroll: false });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : isModerated ? (
                    <Text color="textFaded" size="sm">
                      {post.removedAt
                        ? "This post was removed."
                        : "This post was deleted."}
                    </Text>
                  ) : (
                    <ThemedProse>
                      <MentionedContent
                        html={post.content}
                        className="!duration-250 !ease-linear !transition-all max-w-full break-words"
                      />
                    </ThemedProse>
                  )}

                  <div className="p-2" />

                  {!isModerated &&
                  post.tags.filter((tag) => tag.name != "D2Jam").length > 0 ? (
                    <div className="flex gap-1">
                      {post.tags
                        .filter((tag) => tag.name != "D2Jam")
                        .map((tag: TagType) => (
                          <Chip key={tag.id}>
                            <Hstack>{tag.name}</Hstack>
                          </Chip>
                        ))}
                    </div>
                  ) : (
                    <></>
                  )}

                  {!isModerated && post.tags.length > 0 && <div className="p-2" />}

                  {!isModerated && <div className="flex gap-3">
                    <LikeButton
                      likes={post.likes.length}
                      liked={post.hasLiked}
                      parentId={post.id}
                    />
                    <Link href={`/p/${post.slug}#create-comment`}>
                      <Button size="sm" icon="messagecircle">
                        {post.comments.length}
                      </Button>
                    </Link>
                    <Dropdown
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
                            `${window.location.protocol}//${window.location.hostname}/p/${post.slug}`
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
                          icon="squarepen"
                          description="Edit your post"
                          onClick={() => {
                            setEditing(true);
                            router.replace(`/p/${post.slug}?edit=1`, {
                              scroll: false,
                            });
                          }}
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
                            const response = await deletePost(post.id);

                            if (response.ok) {
                              addToast({
                                title: t("PostCard.Delete.Success"),
                              });
                              if (!canSeeModerated) {
                                router.replace("/home");
                                return;
                              }
                              setPost((prev) =>
                                prev
                                  ? { ...prev, deletedAt: new Date().toISOString() }
                                  : prev,
                              );
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
                              const response = await removePost(post.id);

                              if (response.ok) {
                                addToast({
                                  title: t("PostCard.Remove.Success"),
                                });
                                if (!canSeeModerated) {
                                  router.replace("/home");
                                  return;
                                }
                                setPost((prev) =>
                                  prev
                                    ? { ...prev, removedAt: new Date().toISOString() }
                                    : prev,
                                );
                              } else {
                                addToast({
                                  title: t("PostCard.Remove.Error"),
                                });
                              }
                            }}
                          >
                            PostCard.Remove.Title
                          </Dropdown.Item>
                          {post.sticky ? (
                            <Dropdown.Item
                              key="unsticky"
                              icon="staroff"
                              description="PostCard.Unsticky.Description"
                              onClick={async () => {
                                const response = await stickPost(
                                  post.id,
                                  false
                                );

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
                                const response = await stickPost(post.id, true);

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
                          {user?.admin && !post.author.mod ? (
                            <Dropdown.Item
                              key="promote-mod"
                              icon="shield"
                              description="PostCard.Promote.Description"
                              onClick={async () => {
                                const response = await assignMod(
                                  post.author.slug,
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
                          post.author.mod &&
                          !post.author.admin ? (
                            <Dropdown.Item
                              key="demote-mod"
                              icon="shieldx"
                              description="PostCard.Demote.Description"
                              onClick={async () => {
                                const response = await assignMod(
                                  post.author.slug,
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
                          {user?.admin && !post.author.admin ? (
                            <Dropdown.Item
                              key="promote-admin"
                              icon="shieldalert"
                              description="PostCard.PromoteAdmin.Description"
                              onClick={async () => {
                                const response = await assignAdmin(
                                  post.author.slug,
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
                          post.author.admin &&
                          post.author.id !== user.id ? (
                            <Dropdown.Item
                              key="demote-admin"
                              icon="shieldx"
                              description="PostCard.DemoteAdmin.Description"
                              onClick={async () => {
                                const response = await assignAdmin(
                                  post.author.slug,
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
                    <PostReactions postId={post.id} reactions={post.reactions} />
                  </div>}
                </div>
              )}
            </div>
          </Card>
          <div id="create-comment" className="mb-10" />
          {!isModerated &&
            hasCookie("token") &&
            (waitingPost ? (
              <Card>
                <Hstack>
                  <Spinner />
                  <Text>Loading...</Text>
                </Hstack>
              </Card>
            ) : (
              <>
                <Editor
                  content={content}
                  setContent={setContent}
                  format="markdown"
                />
                <div className="mt-1" />
                <Button
                  onClick={async () => {
                    if (!content) {
                      addToast({ title: "Please enter valid content" });
                      return;
                    }

                    setWaitingPost(true);

                    const response = await postComment(content, post!.id);

                    if (response.status == 401) {
                      addToast({ title: "Invalid user" });
                      setWaitingPost(false);
                      return;
                    }

                    if (response.ok) {
                      addToast({ title: "Successfully created comment" });
                      //setWaitingPost(false);
                      window.location.reload();
                    } else {
                      addToast({ title: "An error occured" });
                      setWaitingPost(false);
                    }
                  }}
                >
                  Create Comment
                </Button>
              </>
            ))}

          <div className="flex flex-col gap-3 mt-10">
            {post?.comments.map((comment) => (
              <div key={comment.id}>
                <CommentCard comment={comment} user={user} />
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
