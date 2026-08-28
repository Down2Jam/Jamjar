"use client";

import { hasCookie } from "@/helpers/cookie";
import { addToast, Form } from "bioloom-ui";
import { redirect } from "@/compat/next-navigation";
import dynamic from "@/compat/next-dynamic";
import { ReactNode, useEffect, useMemo, useState } from "react";
import type { MultiValue, StylesConfig } from "react-select";
import { UserType } from "@/types/UserType";
import { getSelf } from "@/requests/user";
import { getTags } from "@/requests/tag";
import { postPost } from "@/requests/post";
import { Input } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { Icon } from "bioloom-ui";
import { Card } from "bioloom-ui";
import { Button } from "bioloom-ui";
import { Switch } from "bioloom-ui";
import { Spinner } from "bioloom-ui";
import { Chip } from "bioloom-ui";
import { readArray, readItem } from "@/requests/helpers";
import { TagType } from "@/types/TagType";
import TagLabel from "@/components/tags/TagLabel";

const theme = "dark";
const Editor = dynamic(() => import("@/components/editor"), {
  ssr: false,
  loading: () => <div className="min-h-[100px] rounded-md border border-gray-600" />,
});
const Select = dynamic(() => import("react-select"), {
  ssr: false,
}) as typeof import("react-select").default;

type TagOption = {
  value: string;
  label: ReactNode;
  id?: number;
  isFixed: boolean;
};

export type CreatePostPageProps = {
  embedded?: boolean;
  onCreated?: () => void | Promise<void>;
};

export default function CreatePostPage({
  embedded = false,
  onCreated,
}: CreatePostPageProps = {}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [waitingPost, setWaitingPost] = useState(false);
  const [selectedTags, setSelectedTags] = useState<MultiValue<TagOption> | null>(
    null
  );
  const [mounted, setMounted] = useState<boolean>(false);
  const [options, setOptions] = useState<TagOption[]>();
  const [fixedOptions, setFixedOptions] = useState<TagOption[]>();
  const [availableTags, setAvailableTags] = useState<TagType[]>([]);
  const [user, setUser] = useState<UserType>();
  const [sticky, setSticky] = useState(false);

  const combinedTagIds = () => [
    ...((selectedTags ?? [])
      .map((tag) => options?.find((option) => option.value == tag.value)?.id)
      .filter((id): id is number => typeof id === "number")),
    ...(fixedOptions?.map((tag) => tag.id).filter((id): id is number => typeof id === "number") ?? []),
  ];

  const suggestedTags = useMemo(() => {
    const draft = `${title}\n${content}`.trim();
    if (!draft) return [];

    const selectedNames = new Set(
      (selectedTags ?? []).map((tag) => tag.value),
    );
    const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };

    return availableTags
      .filter((tag) => {
        if (
          !tag.postTag ||
          tag.alwaysAdded ||
          selectedNames.has(tag.name) ||
          !tag.autoRegex
        ) {
          return false;
        }

        try {
          return new RegExp(tag.autoRegex, "i").test(draft);
        } catch {
          return false;
        }
      })
      .sort(
        (a, b) =>
          priorityOrder[b.priority] - priorityOrder[a.priority] ||
          a.name.localeCompare(b.name),
      )
      .slice(0, 8);
  }, [availableTags, content, selectedTags, title]);

  const addSuggestedTag = (tag: TagType) => {
    if ((selectedTags?.length ?? 0) >= 5) return;

    const option = options?.find((candidate) => candidate.value === tag.name);
    if (!option) return;

    setSelectedTags([...(selectedTags ?? []), option]);
  };

  useEffect(() => {
    setMounted(true);

    const load = async () => {
      try {
        const [response, tagResponse] = await Promise.all([getSelf(), getTags()]);
        const localuser = await readItem<UserType>(response);
        if (!localuser) return;
        setUser(localuser);

        if (tagResponse.ok) {
          const newoptions: TagOption[] = [];

          const tags = await readArray<TagType>(tagResponse);
          const selectableTags = tags
            .filter((tag) => tag.postTag !== false)
            .sort((a, b) => {
              const aIsGeneral = a.category.name === "General";
              const bIsGeneral = b.category.name === "General";

              if (aIsGeneral !== bIsGeneral) return aIsGeneral ? -1 : 1;

              return (
                b.category.priority - a.category.priority ||
                a.category.name.localeCompare(b.category.name) ||
                a.name.localeCompare(b.name)
              );
            });
          setAvailableTags(
            selectableTags.filter((tag) => !tag.modOnly || localuser.mod),
          );

          for (const tag of selectableTags) {
            if (tag.modOnly && !localuser.mod) {
              continue;
            }
            newoptions.push({
              value: tag.name,
              id: tag.id,
              label: (
                <div className="flex gap-2 items-center">
                  <TagLabel name={tag.name} />
                  {tag.modOnly ? <span>(Mod Only)</span> : null}
                </div>
              ),
              isFixed: tag.alwaysAdded,
            });
          }

          setOptions(newoptions.filter((option) => !option.isFixed));
          setFixedOptions(newoptions.filter((option) => option.isFixed));
        }
      } catch (error) {
        console.error(error);
      }
    };
    load();
  }, []);

  const styles: StylesConfig<
    TagOption,
    true
  > = {
    multiValue: (base, state) => {
      return {
        ...base,
        backgroundColor: state.data.isFixed
          ? theme == "dark"
            ? "#222"
            : "#ddd"
          : theme == "dark"
          ? "#444"
          : "#eee",
      };
    },
    multiValueLabel: (base, state) => {
      return {
        ...base,
        color: state.data.isFixed
          ? theme == "dark"
            ? "#ddd"
            : "#222"
          : theme == "dark"
          ? "#fff"
          : "#444",
        fontWeight: state.data.isFixed ? "normal" : "bold",
        paddingRight: state.data.isFixed ? "8px" : "2px",
      };
    },
    multiValueRemove: (base, state) => {
      return {
        ...base,
        display: state.data.isFixed ? "none" : "flex",
        color: theme == "dark" ? "#ddd" : "#222",
      };
    },
    control: (styles) => ({
      ...styles,
      backgroundColor: theme == "dark" ? "#181818" : "#fff",
      minWidth: "300px",
    }),
    menu: (styles) => ({
      ...styles,
      backgroundColor: theme == "dark" ? "#181818" : "#fff",
      color: theme == "dark" ? "#fff" : "#444",
    }),
    menuPortal: (styles) => ({
      ...styles,
      zIndex: 100,
    }),
    option: (styles, { isFocused }) => ({
      ...styles,
      backgroundColor: isFocused
        ? theme == "dark"
          ? "#333"
          : "#ddd"
        : undefined,
    }),
  };

  return (
    <Vstack align="stretch">
      {!embedded && (
        <Card>
          <Vstack>
            <Hstack>
              <Icon name="squarepen" />
              <Text size="xl">Create Post</Text>
            </Hstack>
            <Text size="sm" color="textFaded">
              Submit a post to the forum
            </Text>
          </Vstack>
        </Card>
      )}
      <Card
        padding={embedded ? 0 : 1}
        shadow={embedded ? "none" : "sm"}
        radius={embedded ? "none" : "md"}
        style={
          embedded
            ? {
                backgroundColor: "transparent",
                borderColor: "transparent",
                boxShadow: "none",
              }
            : undefined
        }
      >
        <Vstack>
          <Form
            className="w-full max-w-2xl flex flex-col gap-4 text-[#333] dark:text-white"
            onSubmit={async (e) => {
              e.preventDefault();

              if (!title && !content) {
                addToast({
                  title: "Please enter valid content and a valid title",
                });
                return;
              }

              if (!title) {
                addToast({
                  title: "Please enter a valid title",
                });
                return;
              }

              if (!content) {
                addToast({
                  title: "Please enter valid content",
                });
                return;
              }

              if (!hasCookie("token")) {
                addToast({
                  title: "You are not logged in",
                });
                return;
              }

              setWaitingPost(true);

              const response = await postPost(
                title,
                content,
                sticky,
                combinedTagIds()
              );

              if (response.status == 401) {
                addToast({
                  title: "Invalid user",
                });
                setWaitingPost(false);
                return;
              }

              if (response.ok) {
                addToast({
                  title: "Successfully created post",
                });
                setWaitingPost(false);
                if (onCreated) {
                  setTitle("");
                  setContent("");
                  setSelectedTags(null);
                  setSticky(false);
                  await onCreated();
                } else {
                  redirect("/");
                }
              } else {
                addToast({
                  title: "An error occurred",
                });
                setWaitingPost(false);
              }
            }}
          >
            <div>
              <Text color="text">Title</Text>
              <Text color="textFaded" size="xs">
                The post title
              </Text>
            </div>
            <Input
              required
              name="title"
              placeholder="Enter a title"
              type="text"
              value={title}
              onValueChange={setTitle}
            />

            <div>
              <Text color="text">Content</Text>
              <Text color="textFaded" size="xs">
                The post content
              </Text>
            </div>
            <Editor
              content={content}
              setContent={setContent}
              format="markdown"
            />

            <div className="mt-2">
              <Text color="text">Tags</Text>
              <Text color="textFaded" size="xs">
                Tags attached to the post to mark what type of content it is
              </Text>
            </div>
            {mounted && (
              <Select<TagOption, true>
                styles={styles}
                isMulti
                value={selectedTags}
                onChange={(value) => setSelectedTags(value)}
                options={options}
                isClearable={false}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                isOptionDisabled={() =>
                  selectedTags != null && selectedTags.length >= 5
                }
              />
            )}

            {suggestedTags.length > 0 && (
              <div className="flex flex-col gap-2" aria-live="polite">
                <Text color="textFaded" size="xs">
                  Suggested from your title and content
                </Text>
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.map((tag) => (
                    <Chip
                      key={tag.id}
                      icon="plus"
                      className="post-tag-chip cursor-pointer hover:scale-105 hover:brightness-125"
                      role="button"
                      tabIndex={0}
                      aria-label={`Add ${tag.name} tag`}
                      onClick={() => addSuggestedTag(tag)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          addSuggestedTag(tag);
                        }
                      }}
                    >
                      <TagLabel name={tag.name} />
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {user && user.mod && (
              <Hstack>
                <Switch checked={sticky} onChange={setSticky} />
                <Vstack align="start" gap={0}>
                  <Text color="text" size="sm">
                    Sticky
                  </Text>
                  <Text color="textFaded" size="xs">
                    make the post appear at the top of the post feed
                  </Text>
                </Vstack>
              </Hstack>
            )}

            <div className="flex gap-2">
              {waitingPost ? (
                <Spinner />
              ) : (
                <>
                  <Button color="blue" type="submit" icon="plus">
                    Create
                  </Button>
                </>
              )}
            </div>
          </Form>
        </Vstack>
      </Card>
    </Vstack>
  );
}
