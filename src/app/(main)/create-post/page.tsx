"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { hasCookie } from "@/helpers/cookie";
import { addToast, Form } from "bioloom-ui";
import { redirect } from "@/compat/next-navigation";
import dynamic from "@/compat/next-dynamic";
import { CSSProperties, ReactNode, useEffect, useMemo, useState } from "react";
import type { MultiValue, StylesConfig } from "react-select";
import { UserType } from "@/types/UserType";
import { getSelf } from "@/requests/user";
import { getTags } from "@/requests/tag";
import { postPost } from "@/requests/post";
import { Input } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import { Text } from "bioloom-ui";
import { Button } from "bioloom-ui";
import { Switch } from "bioloom-ui";
import { Spinner } from "bioloom-ui";
import { Chip } from "bioloom-ui";
import { readArray, readItem } from "@/requests/helpers";
import { TagType } from "@/types/TagType";
import TagLabel from "@/components/tags/TagLabel";
import {
  clearSharedPostDraft,
  readSharedPostDraft,
} from "@/helpers/shareToPost";
import { useTheme } from "@/providers/useSiteTheme";

import "@/components/game-editing-form/game-editor.css";
import "@/components/form-editor.css";
import EditorFooter from "@/components/game-editing-form/EditorFooter";
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
  const uiText = useUiTranslations();
  const [sharedDraft] = useState(() =>
    embedded ? null : readSharedPostDraft()
  );
  const [title, setTitle] = useState(sharedDraft?.title ?? "");
  const [content, setContent] = useState(sharedDraft?.content ?? "");
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
  const { colors, siteTheme } = useTheme();
  const headerColor = colors["text"];
  const hasUnsavedChanges = Boolean(title.trim() || content.trim() || selectedTags?.length || sticky);
  const floatingFooter = !embedded && hasUnsavedChanges;

  useEffect(() => {
    if (!embedded && sharedDraft) {
      clearSharedPostDraft();
    }
  }, [embedded, sharedDraft]);

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
                  {tag.modOnly ? <span>{uiText("AppStrings.ModOnly")}</span> : null}
                </div>
              ),
              isFixed: tag.alwaysAdded,
            });
          }

          setOptions(newoptions.filter((option) => !option.isFixed));
          setFixedOptions(newoptions.filter((option) => option.isFixed));
          if (sharedDraft?.tags?.length) {
            const sharedTagNames = new Set(
              sharedDraft.tags.map((tag) => tag.toLowerCase()),
            );
            setSelectedTags(
              newoptions.filter(
                (option) =>
                  !option.isFixed &&
                  sharedTagNames.has(option.value.toLowerCase()),
              ),
            );
          }
        }
      } catch (error) {
        console.error(error);
      }
    };
    load();
  }, [embedded, sharedDraft]);

  const styles: StylesConfig<
    TagOption,
    true
  > = {
    multiValue: (base) => ({ ...base, backgroundColor: colors.base, borderRadius: 6 }),
    multiValueLabel: (base) => ({ ...base, color: colors.text }),
    multiValueRemove: (base) => ({
      ...base,
      color: colors.textFaded,
      ":hover": { backgroundColor: colors.grayDark, color: colors.text },
    }),
    control: (base, { isFocused }) => ({
      ...base,
      backgroundColor: colors.base,
      borderColor: isFocused ? colors.blue : `color-mix(in srgb, ${colors.text} 10%, ${colors.mantle})`,
      boxShadow: isFocused ? `0 0 0 1px ${colors.blue}` : "none",
      borderRadius: 8,
      minWidth: 0,
      ":hover": { borderColor: colors.blue },
    }),
    input: (base) => ({ ...base, color: colors.text }),
    placeholder: (base) => ({ ...base, color: colors.textFaded }),
    menu: (base) => ({ ...base, backgroundColor: colors.mantle, color: colors.text }),
    menuPortal: (base) => ({ ...base, zIndex: 100 }),
    option: (base, { isFocused }) => ({
      ...base,
      backgroundColor: isFocused ? colors.base : "transparent",
      color: colors.text,
    }),
  };

  return (
    <Vstack
      align="stretch"
      className={embedded ? "w-full" : "mx-auto w-full max-w-6xl gap-4"}
      style={{ "--editor-surface": colors.mantle, "--editor-text": colors.text, "--editor-accent": colors.blue } as CSSProperties}
    >
      {!embedded && (
        <header className="py-2 text-center">
          <h1
            className="text-3xl font-semibold"
            style={{
              color: headerColor,
              textShadow:
                siteTheme.type === "Light"
                  ? "none"
                  : "0 1px 5px rgba(0, 0, 0, 0.75)",
            }}
          >
             {uiText("Navbar.CreatePost.Title")} </h1>
          <p
            className="mt-1 text-sm"
            style={{
              color: headerColor,
              opacity: 0.82,
              textShadow:
                siteTheme.type === "Light"
                  ? "none"
                  : "0 1px 4px rgba(0, 0, 0, 0.8)",
            }}
          >
             {uiText("AppStrings.ShareSomethingWithTheCommunity")} </p>
        </header>
      )}
          <Form
            className={`post-editor-form w-full flex flex-col ${floatingFooter ? "pb-48 sm:pb-32" : ""}`}
            onSubmit={async (e) => {
              e.preventDefault();
              const submittedContent = content
                .replace(
                  /^[\s\u200B-\u200D\uFEFF]+|[\s\u200B-\u200D\uFEFF]+$/g,
                  "",
                );

              if (!title && !submittedContent) {
                addToast({
                  title: uiText("AppStrings.PleaseEnterValidContentAndAValidTitle"),
                });
                return;
              }

              if (!title) {
                addToast({
                  title: uiText("CreateGame.Name.Error"),
                });
                return;
              }

              if (!submittedContent) {
                addToast({
                  title: uiText("AppStrings.PleaseEnterValidContent"),
                });
                return;
              }

              if (!hasCookie("token")) {
                addToast({
                  title: uiText("CreateGame.NotLogged"),
                });
                return;
              }

              setWaitingPost(true);

              const response = await postPost(
                title,
                submittedContent,
                sticky,
                combinedTagIds()
              );

              if (response.status == 401) {
                addToast({
                  title: uiText("AppStrings.InvalidUser"),
                });
                setWaitingPost(false);
                return;
              }

              if (response.ok) {
                addToast({
                  title: uiText("AppStrings.SuccessfullyCreatedPost"),
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
                  title: uiText("AppStrings.AnErrorOccurred"),
                });
                setWaitingPost(false);
              }
            }}
          >
            <div className={embedded ? "post-editor-embedded" : "form-editor-panel"}>
            <div className="game-editor-row"><Vstack align="stretch">
            <div>
              <Text color="text">{uiText("AppStrings.Title")}</Text>
              <Text color="textFaded" size="xs">
                 {uiText("AppStrings.ThePostTitle")} </Text>
            </div>
            <Input
              required
              name="title"
              placeholder={uiText("AppStrings.EnterATitle")}
              type="text"
              value={title}
              onValueChange={setTitle}
            />

            </Vstack></div>
            <div className="game-editor-row"><Vstack align="stretch">
            <div>
              <Text color="text">{uiText("AppStrings.Content")}</Text>
              <Text color="textFaded" size="xs">
                 {uiText("AppStrings.ThePostContent")} </Text>
            </div>
            <Editor
              content={content}
              setContent={setContent}
              format="markdown"
            />

            </Vstack></div>
            <div className="game-editor-row"><Vstack align="stretch">
            <div>
              <Text color="text">{uiText("CreateGame.Tags.Title")}</Text>
              <Text color="textFaded" size="xs">
                 {uiText("AppStrings.TagsAttachedToThePostToMarkWhat")} </Text>
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
                   {uiText("AppStrings.SuggestedFromYourTitleAndContent")} </Text>
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.map((tag) => (
                    <Chip
                      key={tag.id}
                      icon="plus"
                      className="post-tag-chip cursor-pointer hover:scale-105 hover:brightness-125"
                      role="button"
                      tabIndex={0}
                      aria-label={uiText("AppStrings.AddValue0Tag", { value0: tag.name })}
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

            </Vstack></div>

            {user && user.mod && (
              <Hstack className="game-editor-block">
                <Switch checked={sticky} onChange={setSticky} />
                <Vstack align="start" gap={0}>
                  <Text color="text" size="sm">
                     {uiText("PostCard.Sticky.Title")} </Text>
                  <Text color="textFaded" size="xs">
                     {uiText("AppStrings.MakeThePostAppearAtTheTopOf")} </Text>
                </Vstack>
              </Hstack>
            )}

            </div>
            {hasUnsavedChanges && (
              <EditorFooter
                floating={floatingFooter}
                status={uiText("AppStrings.UnsavedChanges")}
                description={waitingPost ? uiText("AppStrings.Saving") : uiText("AppStrings.ShareSomethingWithTheCommunity")}
              >
                {waitingPost ? (
                  <Spinner />
                ) : (
                  <Button variant="ghost" size="sm" style={{ color: colors.blue }} type="submit" icon="save">
                    {uiText("CreateGame.Create.Title")}
                  </Button>
                )}
              </EditorFooter>
            )}
          </Form>
    </Vstack>
  );
}
