"use client";

import { hasCookie } from "@/helpers/cookie";
import { addToast, Form } from "bioloom-ui";
import { redirect } from "@/compat/next-navigation";
import dynamic from "@/compat/next-dynamic";
import { ReactNode, useEffect, useState } from "react";
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
import { readArray, readItem } from "@/requests/helpers";

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

export default function CreatePostPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [waitingPost, setWaitingPost] = useState(false);
  const [selectedTags, setSelectedTags] = useState<MultiValue<TagOption> | null>(
    null
  );
  const [mounted, setMounted] = useState<boolean>(false);
  const [options, setOptions] = useState<TagOption[]>();
  const [fixedOptions, setFixedOptions] = useState<TagOption[]>();
  const [user, setUser] = useState<UserType>();
  const [sticky, setSticky] = useState(false);

  const combinedTagIds = () => [
    ...((selectedTags ?? [])
      .map((tag) => options?.find((option) => option.value == tag.value)?.id)
      .filter((id): id is number => typeof id === "number")),
    ...(fixedOptions?.map((tag) => tag.id).filter((id): id is number => typeof id === "number") ?? []),
  ];

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

          for (const tag of await readArray<any>(tagResponse)) {
            if (tag.modOnly && !localuser.mod) {
              continue;
            }
            newoptions.push({
              value: tag.name,
              id: tag.id,
              label: (
                <div className="flex gap-2 items-center">
                  <p>
                    {tag.name}
                    {tag.modOnly ? " (Mod Only)" : ""}
                  </p>
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
    <Vstack>
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
      <Card>
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
                redirect("/");
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
                isOptionDisabled={() =>
                  selectedTags != null && selectedTags.length >= 5
                }
              />
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
