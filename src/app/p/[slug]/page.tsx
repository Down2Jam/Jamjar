"use client";

import LikeButton from "@/components/posts/LikeButton";
import { hasCookie } from "@/helpers/cookie";
import { PostType } from "@/types/PostType";
import { TagType } from "@/types/TagType";
import { UserType } from "@/types/UserType";
import Link from "next/link";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
  Spacer,
} from "@nextui-org/react";
import { formatDistance } from "date-fns";
import {
  Flag,
  LoaderCircle,
  MessageCircle,
  MoreVertical,
  Shield,
  ShieldAlert,
  ShieldX,
  Star,
  StarOff,
  Trash,
  X,
} from "lucide-react";
import { redirect, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Editor from "@/components/editor";
import CommentCard from "@/components/posts/CommentCard";
import { getSelf } from "@/requests/user";
import { deletePost, getPost, stickPost } from "@/requests/post";
import { assignAdmin, assignMod } from "@/requests/mod";
import { postComment } from "@/requests/comment";
import { sanitize } from "@/helpers/sanitize";

export default function PostPage() {
  const [post, setPost] = useState<PostType>();
  const { slug } = useParams();
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);
  const [user, setUser] = useState<UserType>();
  const [loading, setLoading] = useState<boolean>(true);
  const [content, setContent] = useState("");
  const [waitingPost, setWaitingPost] = useState(false);

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
        setPost(await postResponse.json());

        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    };

    loadUserAndPosts();
  }, [slug]);

  return (
    <>
      {loading ? (
        <div className="flex justify-center p-6">
          <LoaderCircle
            className="animate-spin text-[#333] dark:text-[#999]"
            size={24}
          />
        </div>
      ) : (
        <>
          <Card className="bg-opacity-60 !duration-250 !ease-linear !transition-all">
            <CardBody className="p-5">
              <div>
                {post && (
                  <div>
                    <Link href={`/p/${post.slug}`}>
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

                    <Spacer y={4} />

                    <div
                      className="prose dark:prose-invert !duration-250 !ease-linear !transition-all max-w-full break-words"
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />

                    <Spacer y={4} />

                    {post.tags.filter((tag) => tag.name != "D2Jam").length >
                    0 ? (
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
                      <Link href="#create-comment">
                        <Button size="sm" variant="bordered">
                          <MessageCircle size={16} /> {post.comments.length}
                        </Button>
                      </Link>
                      <Dropdown backdrop="opaque">
                        <DropdownTrigger>
                          <Button size="sm" variant="bordered" isIconOnly>
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu className="text-[#333] dark:text-white">
                          <DropdownSection
                            showDivider={user?.mod}
                            title="Actions"
                          >
                            <DropdownItem
                              key="report"
                              startContent={<Flag />}
                              description="Report this post to moderators to handle"
                              onPress={() => {
                                toast.warning(
                                  "Report functionality coming soon"
                                );
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
                                    redirect("/");
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
                                    redirect("/");
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
                                    const response = await stickPost(
                                      post.id,
                                      false
                                    );

                                    if (response.ok) {
                                      toast.success("Unsticked post");
                                      redirect("/");
                                    } else {
                                      toast.error(
                                        "Error while unstickying post"
                                      );
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
                                    const response = await stickPost(
                                      post.id,
                                      true
                                    );

                                    if (response.ok) {
                                      toast.success("Unsticked post");
                                      redirect("/");
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
                                      toast.error(
                                        "Error while promoting user to Mod"
                                      );
                                    }
                                  }}
                                >
                                  Appoint as mod
                                </DropdownItem>
                              ) : (
                                <></>
                              )}
                              {user?.admin &&
                              post.author.mod &&
                              !post.author.admin ? (
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
                                      toast.error(
                                        "Error while demoting user to mod"
                                      );
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
                )}
              </div>
            </CardBody>
          </Card>
          <div id="create-comment" />
          <Spacer y={10} />
          <Editor content={content} setContent={setContent} />
          <Spacer />
          <Button
            color="primary"
            onPress={async () => {
              if (!content) {
                toast.error("Please enter valid content");
                return;
              }

              if (!hasCookie("token")) {
                toast.error("You are not logged in");
                return;
              }

              const sanitizedHtml = sanitize(content);
              setWaitingPost(true);

              const response = await postComment(sanitizedHtml, post!.id);

              if (response.status == 401) {
                toast.error("Invalid User");
                setWaitingPost(false);
                return;
              }

              if (response.ok) {
                toast.success("Successfully created comment");
                setWaitingPost(false);
                window.location.reload();
              } else {
                toast.error("An error occured");
                setWaitingPost(false);
              }
            }}
          >
            {waitingPost ? (
              <LoaderCircle className="animate-spin" size={16} />
            ) : (
              <p>Create Comment</p>
            )}
          </Button>
          <Spacer y={10} />

          <div className="flex flex-col gap-3">
            {post?.comments.map((comment) => (
              <div key={comment.id}>
                <CommentCard comment={comment} />
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
