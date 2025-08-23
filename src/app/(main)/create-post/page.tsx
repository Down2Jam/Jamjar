"use client";

import Editor from "@/components/editor";
import { hasCookie } from "@/helpers/cookie";
import { addToast, Form } from "@heroui/react";
import { redirect } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import Select, { MultiValue, StylesConfig } from "react-select";
import { UserType } from "@/types/UserType";
import { getSelf } from "@/requests/user";
import { getTags } from "@/requests/tag";
import { postPost } from "@/requests/post";
import { sanitize } from "@/helpers/sanitize";
import { Input } from "@/framework/Input";
import { Hstack, Vstack } from "@/framework/Stack";
import Text from "@/framework/Text";
import Icon from "@/framework/Icon";
import { Card } from "@/framework/Card";
import { Button } from "@/framework/Button";
import { Avatar } from "@/framework/Avatar";
import { Switch } from "@/framework/Switch";
import { Spinner } from "@/framework/Spinner";

const theme = "dark";

export default function CreatePostPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [waitingPost, setWaitingPost] = useState(false);
  const [selectedTags, setSelectedTags] = useState<MultiValue<{
    value: string;
    label: ReactNode;
    isFixed: boolean;
  }> | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);
  const [options, setOptions] = useState<
    {
      value: string;
      label: ReactNode;
      id: number;
      isFixed: boolean;
    }[]
  >();
  const [fixedOptions, setFixedOptions] = useState<
    {
      value: string;
      label: ReactNode;
      id: number;
      isFixed: boolean;
    }[]
  >();
  const [user, setUser] = useState<UserType>();
  const [sticky, setSticky] = useState(false);

  useEffect(() => {
    setMounted(true);

    const load = async () => {
      try {
        const response = await getSelf();

        const localuser = await response.json();
        setUser(localuser);

        const tagResponse = await getTags();

        if (tagResponse.ok) {
          const newoptions: {
            value: string;
            label: ReactNode;
            id: number;
            isFixed: boolean;
          }[] = [];

          for (const tag of (await tagResponse.json()).data) {
            if (tag.modOnly && !localuser.mod) {
              continue;
            }
            newoptions.push({
              value: tag.name,
              id: tag.id,
              label: (
                <div className="flex gap-2 items-center">
                  {tag.icon && <Avatar src={tag.icon} />}
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
    {
      value: string;
      label: ReactNode;
      isFixed: boolean;
    },
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

              const sanitizedHtml = sanitize(content);
              setWaitingPost(true);

              const tags = [];

              if (selectedTags) {
                for (const tag of selectedTags) {
                  tags.push(
                    options?.filter((option) => option.value == tag.value)[0].id
                  );
                }
              }

              const combinedTags = [
                ...tags,
                ...(fixedOptions ? fixedOptions.map((tag) => tag.id) : []),
              ];
              const response = await postPost(
                title,
                sanitizedHtml,
                sticky,
                combinedTags
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
            <Editor content={content} setContent={setContent} />

            <div className="mt-2">
              <Text color="text">Tags</Text>
              <Text color="textFaded" size="xs">
                Tags attached to the post to mark what type of content it is
              </Text>
            </div>
            {mounted && (
              <Select
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
                <Button color="blue" type="submit" icon="plus">
                  Create
                </Button>
              )}
            </div>
          </Form>
        </Vstack>
      </Card>
    </Vstack>
  );
}
