"use client";

import Editor from "@/components/editor";
import { hasCookie } from "@/helpers/cookie";
import {
  Avatar,
  Button,
  Checkbox,
  Form,
  Input,
  Spacer,
} from "@nextui-org/react";
import { LoaderCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { toast } from "react-toastify";
import Select, { MultiValue, StylesConfig } from "react-select";
import { useTheme } from "next-themes";
import Timers from "@/components/timers";
import { UserType } from "@/types/UserType";
import { getSelf } from "@/requests/user";
import { getTags } from "@/requests/tag";
import { postPost } from "@/requests/post";
import { sanitize } from "@/helpers/sanitize";
import SidebarStreams from "@/components/sidebar/SidebarStreams";

export default function CreatePostPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState({});
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
  const { theme } = useTheme();
  const [user, setUser] = useState<UserType>();
  const [sticky, setSticky] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

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
                  {tag.icon && (
                    <Avatar
                      className="w-6 h-6 min-w-6 min-h-6"
                      size="sm"
                      src={tag.icon}
                      classNames={{ base: "bg-transparent" }}
                    />
                  )}
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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
    <div className="static flex items-top mt-10 justify-center top-0 left-0 gap-16">
      <Form
        className="w-full max-w-2xl flex flex-col gap-4 text-[#333] dark:text-white"
        validationErrors={errors}
        onSubmit={async (e) => {
          e.preventDefault();

          if (!title && !content) {
            setErrors({
              title: "Please enter a valid title",
              content: "Please enter valid content",
            });
            toast.error("Please enter valid content");
            return;
          }

          if (!title) {
            setErrors({ title: "Please enter a valid title" });
            return;
          }

          if (!content) {
            setErrors({ content: "Please enter valid content" });
            toast.error("Please enter valid content");
            return;
          }

          if (!hasCookie("token")) {
            setErrors({ content: "You are not logged in" });
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
            setErrors({ content: "Invalid user" });
            setWaitingPost(false);
            return;
          }

          if (response.ok) {
            toast.success("Successfully created post");
            setWaitingPost(false);
            redirect("/");
          } else {
            toast.error("An error occured");
            setWaitingPost(false);
          }
        }}
      >
        <Input
          isRequired
          label="Title"
          labelPlacement="outside"
          name="title"
          placeholder="Enter a title"
          type="text"
          value={title}
          onValueChange={setTitle}
        />

        <Editor content={content} setContent={setContent} />

        <Spacer />

        <p>Tags</p>
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
          <div>
            <Spacer />
            <Checkbox isSelected={sticky} onValueChange={setSticky}>
              Sticky
            </Checkbox>
          </div>
        )}

        <Spacer />

        <div className="flex gap-2">
          <Button color="primary" type="submit">
            {waitingPost ? (
              <LoaderCircle className="animate-spin" size={16} />
            ) : (
              <p>Create</p>
            )}
          </Button>
        </div>
      </Form>
      {!isMobile && (
        <div className="flex flex-col gap-4 px-8 items-end">
          <Timers />
          <SidebarStreams />
        </div>
      )}
    </div>
  );
}
