"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { useTranslations } from "@/compat/next-intl";

import { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignRight,
  Bold,
  Code,
  Highlighter,
  ImageIcon,
  Italic,
  LinkIcon,
  Minus,
  Ellipsis,
  Quote,
  Redo,
  SmilePlus,
  Sticker,
  Strikethrough,
  Subscript,
  Superscript,
  Undo,
} from "lucide-react";
import EditorMenuButton from "./EditorMenuButton";
import { getCookie } from "@/helpers/cookie";
import { Dropdown, Hstack } from "bioloom-ui";
import { addToast, Button } from "bioloom-ui";
import { useEmojis } from "@/providers/useEmojis";
import { sortEmojisByUsage } from "@/helpers/emojiSorting";
import { useEffect, useMemo, useRef, useState } from "react";
import { Popover, Text, Input } from "bioloom-ui";
import { BASE_URL } from "@/requests/config";
import { useTheme } from "@/providers/useSiteTheme";
import KlipyGifPicker from "./KlipyGifPicker";

type EditorMenuProps = {
  editor: Editor | null;
  size?: "xs" | "sm";
  enableMediaPickers?: boolean;
};

export default function EditorMenuBar({
  editor,
  size = "sm",
  enableMediaPickers = false,
}: EditorMenuProps) {
  if (!editor) return null;
  return <ReadyEditorMenuBar editor={editor} size={size} enableMediaPickers={enableMediaPickers} />;
}

function ReadyEditorMenuBar({ editor, size = "sm", enableMediaPickers = false }: { editor: Editor; size?: "xs" | "sm"; enableMediaPickers?: boolean }) {
  const uiText = useUiTranslations();
  const t = useTranslations();
  const { emojis, stickers, priorityEmotes } = useEmojis();
  const { colors } = useTheme();
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiQuery, setEmojiQuery] = useState("");
  const [stickerOpen, setStickerOpen] = useState(false);
  const [stickerQuery, setStickerQuery] = useState("");
  const [gifOpen, setGifOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const stickerPickerRef = useRef<HTMLDivElement | null>(null);

  const addLink = () => {
    const url = prompt(t("AppStrings.EnterLinkURL"));
    if (url) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
  };

  const addImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";

    input.addEventListener("change", handleImageUpload);

    document.body.appendChild(input);
    input.click();

    // Clean up after the dialog closes
    input.addEventListener("blur", () => document.body.removeChild(input));
  };

  async function handleImageUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;

    const file = target.files[0];
    const filesize = parseInt((file.size / 1024 / 1024).toFixed(4));

    const allowedTypes = [
      "image/jpeg", // JPEG images
      "image/png", // PNG images
      "image/apng", // APNG images
      "image/gif", // GIF images
      "image/webp", // WebP images
      "image/svg+xml", // SVG images
    ];

    if (!allowedTypes.includes(file.type)) {
      addToast({
        title: t("AppStrings.InvalidFileFormat"),
      });
      return false;
    }

    if (filesize > 8) {
      addToast({
        title: t("AppStrings.ImageIsTooBig"),
      });
      return false;
    }

    const formData = new FormData();
    formData.append("upload", file);

    fetch(
      `${BASE_URL}/image`,
      {
        method: "POST",
        body: formData,
        headers: {
          authorization: `Bearer ${getCookie("token")}`,
        },
        credentials: "include",
      }
    ).then((response) => {
      if (response.ok) {
        response.json().then((data) => {
          addToast({
            title: data.message,
          });
          editor
            ?.chain()
            .focus()
            .insertContent({
              type: "imageResize",
              attrs: { src: data.data },
            })
            .run();
        });
      } else {
        addToast({
          title: t("AppStrings.FailedToUploadImage"),
        });
      }
    });
  }

  const iconSize = size === "sm" ? 20 : 16;

  const buttons = [
    {
      label: t("Markdown.Bold.Title"),
      primary: true,
      icon: <Bold size={iconSize} />,
      onClick: () => editor.chain().focus().toggleBold().run(),
      disabled: !editor.can().toggleBold?.() && false,
      isActive: editor.isActive("bold"),
    },
    {
      label: t("Markdown.Italic.Title"),
      primary: true,
      icon: <Italic size={iconSize} />,
      onClick: () => editor.chain().focus().toggleItalic().run(),
      disabled: !editor.can().toggleItalic?.() && false,
      isActive: editor.isActive("italic"),
    },
    {
      label: t("Markdown.Highlight.Title"),
      primary: false,
      icon: <Highlighter size={iconSize} />,
      onClick: () => editor.chain().focus().toggleHighlight().run(),
      disabled: !editor.can().toggleHighlight?.() && false,
      isActive: editor.isActive("highlight"),
    },
    {
      label: t("Markdown.Strikethrough.Title"),
      primary: false,
      icon: <Strikethrough size={iconSize} />,
      onClick: () => editor.chain().focus().toggleStrike().run(),
      disabled: !editor.can().toggleStrike?.() && false,
      isActive: editor.isActive("strike"),
    },
    {
      label: t("Markdown.Link.Title"),
      primary: true,
      icon: <LinkIcon size={iconSize} />,
      onClick: addLink,
      disabled: false,
      isActive: editor.isActive("link"),
    },
    {
      label: t("Markdown.Image.Title"),
      primary: true,
      icon: <ImageIcon size={iconSize} />,
      onClick: addImage,
      disabled: false,
      isActive: false,
    },
    {
      label: t("Markdown.Subscript.Title"),
      primary: false,
      icon: <Subscript size={iconSize} />,
      onClick: () => editor.chain().focus().toggleSubscript().run(),
      disabled: !editor.can().toggleSubscript?.(),
      isActive: editor.isActive("subscript"),
    },
    {
      label: t("Markdown.Superscript.Title"),
      primary: false,
      icon: <Superscript size={iconSize} />,
      onClick: () => editor.chain().focus().toggleSuperscript().run(),
      disabled: !editor.can().toggleSuperscript?.(),
      isActive: editor.isActive("superscript"),
    },
    {
      label: t("AppStrings.HorizontalRule"),
      primary: false,
      icon: <Minus size={iconSize} />,
      onClick: () => editor.chain().focus().setHorizontalRule().run(),
      disabled: !editor.can().setHorizontalRule?.(),
      isActive: false,
    },
    {
      label: t("AppStrings.Blockquote"),
      primary: false,
      icon: <Quote size={iconSize} />,
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
      disabled: !editor.can().toggleBlockquote?.(),
      isActive: editor.isActive("blockquote"),
    },
    {
      label: t("AppStrings.CodeBlock"),
      primary: false,
      icon: <Code size={iconSize} />,
      onClick: () => editor.chain().focus().toggleCodeBlock().run(),
      disabled: !editor.can().toggleCodeBlock?.(),
      isActive: editor.isActive("codeBlock"),
    },
    {
      label: t("AppStrings.AlignRight"),
      primary: false,
      icon: <AlignRight size={iconSize} />,
      onClick: () =>
        editor.isActive({ textAlign: "right" })
          ? editor.chain().focus().unsetTextAlign().run()
          : editor.chain().focus().setTextAlign("right").run(),
      disabled: !editor.can().setTextAlign?.("right"),
      isActive: editor.isActive({ textAlign: "right" }),
    },
    {
      label: t("AppStrings.AlignCenter"),
      primary: false,
      icon: <AlignCenter size={iconSize} />,
      onClick: () =>
        editor.isActive({ textAlign: "center" })
          ? editor.chain().focus().unsetTextAlign().run()
          : editor.chain().focus().setTextAlign("center").run(),
      disabled: !editor.can().setTextAlign?.("center"),
      isActive: editor.isActive({ textAlign: "center" }),
    },
    {
      label: t("Markdown.Undo.Title"),
      primary: false,
      icon: <Undo size={iconSize} />,
      onClick: () => editor.chain().focus().undo().run(),
      disabled: !editor.can().undo(),
      isActive: false,
    },
    {
      label: t("Markdown.Redo.Title"),
      primary: false,
      icon: <Redo size={iconSize} />,
      onClick: () => editor.chain().focus().redo().run(),
      disabled: !editor.can().redo(),
      isActive: false,
    },
  ];

  const visibleButtons = buttons.filter((button) => button.primary);
  const moreButtons = buttons.filter((button) => !button.primary);

  useEffect(() => {
    if (!emojiOpen) return;
    const handleDown = (event: MouseEvent) => {
      if (!pickerRef.current) return;
      if (!pickerRef.current.contains(event.target as Node)) {
        setEmojiOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDown, true);
    return () => {
      document.removeEventListener("mousedown", handleDown, true);
    };
  }, [emojiOpen]);

  useEffect(() => {
    if (!stickerOpen) return;
    const handleDown = (event: MouseEvent) => {
      if (stickerPickerRef.current && !stickerPickerRef.current.contains(event.target as Node)) {
        setStickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDown, true);
    return () => document.removeEventListener("mousedown", handleDown, true);
  }, [stickerOpen]);

  useEffect(() => {
    if (!emojiOpen) {
      setEmojiQuery("");
    }
  }, [emojiOpen]);

  useEffect(() => {
    if (!stickerOpen) {
      setStickerQuery("");
    }
  }, [stickerOpen]);

  const filteredEmojis = useMemo(() => {
    const query = emojiQuery.trim().toLowerCase();
    const matches = (emoji: { slug: string }) => !query || emoji.slug.toLowerCase().includes(query);
    return sortEmojisByUsage(emojis.filter(matches), {}, priorityEmotes);
  }, [emojiQuery, emojis, priorityEmotes]);

  const filteredStickers = useMemo(() => {
    const query = stickerQuery.trim().toLowerCase();
    return stickers.filter((sticker) => !query || sticker.slug.toLowerCase().includes(query));
  }, [stickerQuery, stickers]);

  return (
    <Hstack className="mb-2" data-editor-toolbar wrap>
      {visibleButtons.map(({ label, icon, onClick, disabled, isActive }) => (
        <EditorMenuButton
          key={label}
          label={label}
          onClick={onClick}
          isActive={isActive}
          disabled={disabled}
          size={size}
        >
          {icon}
        </EditorMenuButton>
      ))}
      <div ref={pickerRef} className="relative z-30">
        <EditorMenuButton
          label={t("AppStrings.Emotes")}
          onClick={() => {
            setEmojiOpen((open) => !open);
            setStickerOpen(false);
            setGifOpen(false);
          }}
          isActive={emojiOpen}
          disabled={emojis.length === 0 && priorityEmotes.length === 0}
          size={size}
        >
          <SmilePlus size={iconSize} />
        </EditorMenuButton>
        <Popover
          shown={emojiOpen}
          anchorToScreen={false}
          position="bottom"
          padding={12}
          showArrow
          surface="contrast"
          transformOrigin="center"
        >
          <div className="flex w-64 flex-col gap-2">
            <Input
              value={emojiQuery}
              onValueChange={setEmojiQuery}
              placeholder={t("AppStrings.SearchEmoji")}
              size="sm"
              fullWidth
              style={{
                backgroundColor: colors["mantle"],
                borderColor: "transparent",
                boxShadow: "none",
              }}
            />
            {filteredEmojis.length === 0 ? (
              <Text size="xs" color="textFaded">
                 {t("AppStrings.NoEmojisFound")} </Text>
            ) : (
              <div className="grid max-h-40 grid-cols-6 gap-2 overflow-y-auto">
                {filteredEmojis.map((emoji) => (
                  <Button
                    key={emoji.id}
                    size="sm"
                    variant="ghost"
                    color="default"
                    leftSlot={
                      <img
                        src={emoji.image}
                        alt={uiText("AppStrings.Value03", { value0: emoji.slug })}
                        className="h-5 w-5"
                        loading="lazy"
                        decoding="async"
                      />
                    }
                    tooltip={uiText("AppStrings.Value03", { value0: emoji.slug.toUpperCase() })}
                    onClick={() => {
                      editor.chain().focus().insertContent(`:${emoji.slug}:`).run();
                    }}
                  >
                  </Button>
                ))}
              </div>
            )}
          </div>
        </Popover>
      </div>
      {enableMediaPickers ? (
        <div ref={stickerPickerRef} className="relative z-30">
          <EditorMenuButton
            label="Stickers"
            onClick={() => {
              setStickerOpen((open) => !open);
              setEmojiOpen(false);
              setGifOpen(false);
            }}
            isActive={stickerOpen}
            disabled={stickers.length === 0}
            size={size}
          >
            <Sticker size={iconSize} />
          </EditorMenuButton>
          <Popover
            shown={stickerOpen}
            anchorToScreen={false}
            position="bottom"
            padding={12}
            showArrow
            surface="contrast"
            transformOrigin="center"
          >
            <div className="flex w-80 flex-col gap-2">
              <Input
                value={stickerQuery}
                onValueChange={setStickerQuery}
                placeholder="Search stickers"
                size="sm"
                fullWidth
                style={{
                  backgroundColor: colors.mantle,
                  borderColor: "transparent",
                  boxShadow: "none",
                }}
              />
              {filteredStickers.length === 0 ? (
                <Text size="xs" color="textFaded">No stickers found.</Text>
              ) : (
                <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto">
                  {filteredStickers.map((sticker) => (
                    <Button
                      key={sticker.id}
                      size="sm"
                      variant="ghost"
                      color="default"
                      leftSlot={
                        <img
                          src={sticker.image}
                          alt={`::${sticker.slug}::`}
                          className="h-16 w-16 object-contain"
                          loading="lazy"
                          decoding="async"
                        />
                      }
                      tooltip={`::${sticker.slug}::`}
                      style={{ width: "100%", height: 80, padding: 4 }}
                      onClick={() => {
                        editor.chain().focus().insertContent({
                          type: "paragraph",
                          content: [{ type: "text", text: `::${sticker.slug}::` }],
                        }).run();
                        setStickerOpen(false);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </Popover>
        </div>
      ) : null}
      {enableMediaPickers ? (
        <KlipyGifPicker
          editor={editor}
          size={size}
          iconSize={iconSize}
          open={gifOpen}
          onOpenChange={(open) => {
            setGifOpen(open);
            if (open) {
              setEmojiOpen(false);
              setStickerOpen(false);
            }
          }}
        />
      ) : null}
      <Dropdown portal backdrop={false} onOpenChange={(open) => { if (open) { setEmojiOpen(false); setStickerOpen(false); setGifOpen(false); } }} trigger={
        <Button data-editor-toolbar-action type="button" size={size} aria-label={t("AppStrings.MoreFormatting")} title={t("AppStrings.MoreFormatting")}><Ellipsis size={iconSize} /></Button>
      }>
        {moreButtons.map((button) => <Dropdown.Item key={button.label} disabled={button.disabled} onClick={button.onClick}>
          <span className="flex items-center gap-2" style={{ color: button.isActive ? colors.blue : undefined }}>
            {button.icon}<span>{button.label}</span>{button.isActive && <span className="sr-only">  {t("AppStrings.Active2")}</span>}
          </span>
        </Dropdown.Item>)}
      </Dropdown>
    </Hstack>
  );
}
