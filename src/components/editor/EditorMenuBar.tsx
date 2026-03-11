"use client";

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
  Quote,
  Redo,
  SmilePlus,
  Strikethrough,
  Subscript,
  Superscript,
  Undo,
} from "lucide-react";
import EditorMenuButton from "./EditorMenuButton";
import { getCookie } from "@/helpers/cookie";
import { Hstack } from "bioloom-ui";
import { addToast, Button } from "bioloom-ui";
import { useEmojis } from "@/providers/EmojiProvider";
import { useEffect, useMemo, useRef, useState } from "react";
import { Popover, Text, Input } from "bioloom-ui";

type EditorMenuProps = {
  editor: Editor | null;
  size?: "xs" | "sm";
};

export default function EditorMenuBar({
  editor,
  size = "sm",
}: EditorMenuProps) {
  if (!editor) return null;
  const { emojis } = useEmojis();
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiQuery, setEmojiQuery] = useState("");
  const pickerRef = useRef<HTMLDivElement | null>(null);

  const addLink = () => {
    const url = prompt("Enter link URL:");
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
        title: "Invalid file format",
      });
      return false;
    }

    if (filesize > 8) {
      addToast({
        title: "Image is too big",
      });
      return false;
    }

    const formData = new FormData();
    formData.append("upload", file);

    fetch(
      process.env.NEXT_PUBLIC_MODE === "PROD"
        ? "https://d2jam.com/api/v1/image"
        : "http://localhost:3005/api/v1/image",
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
          title: "Failed to upload image",
        });
      }
    });
  }

  const iconSize = size === "sm" ? 20 : 16;
  const isXS = size === "xs";

  const buttons = [
    {
      icon: <Bold size={iconSize} />,
      onClick: () => editor.chain().focus().toggleBold().run(),
      disabled: !editor.can().toggleBold?.() && false,
      isActive: editor.isActive("bold"),
    },
    {
      icon: <Italic size={iconSize} />,
      onClick: () => editor.chain().focus().toggleItalic().run(),
      disabled: !editor.can().toggleItalic?.() && false,
      isActive: editor.isActive("italic"),
    },
    {
      icon: <Highlighter size={iconSize} />,
      onClick: () => editor.chain().focus().toggleHighlight().run(),
      disabled: !editor.can().toggleHighlight?.() && false,
      isActive: editor.isActive("highlight"),
    },
    {
      icon: <Strikethrough size={iconSize} />,
      onClick: () => editor.chain().focus().toggleStrike().run(),
      disabled: !editor.can().toggleStrike?.() && false,
      isActive: editor.isActive("strike"),
    },
    {
      icon: <LinkIcon size={iconSize} />,
      onClick: addLink,
      disabled: false,
      isActive: editor.isActive("link"),
    },
    {
      icon: <ImageIcon size={iconSize} />,
      onClick: addImage,
      disabled: false,
      isActive: false,
    },
    {
      icon: <Subscript size={iconSize} />,
      onClick: () => editor.chain().focus().toggleSubscript().run(),
      disabled: !editor.can().toggleSubscript?.(),
      isActive: editor.isActive("subscript"),
      hideOnXS: true,
    },
    {
      icon: <Superscript size={iconSize} />,
      onClick: () => editor.chain().focus().toggleSuperscript().run(),
      disabled: !editor.can().toggleSuperscript?.(),
      isActive: editor.isActive("superscript"),
      hideOnXS: true,
    },
    {
      icon: <Minus size={iconSize} />,
      onClick: () => editor.chain().focus().setHorizontalRule().run(),
      disabled: !editor.can().setHorizontalRule?.(),
      isActive: false,
      hideOnXS: true,
    },
    {
      icon: <Quote size={iconSize} />,
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
      disabled: !editor.can().toggleBlockquote?.(),
      isActive: editor.isActive("blockquote"),
      hideOnXS: true,
    },
    {
      icon: <Code size={iconSize} />,
      onClick: () => editor.chain().focus().toggleCodeBlock().run(),
      disabled: !editor.can().toggleCodeBlock?.(),
      isActive: editor.isActive("codeBlock"),
      hideOnXS: true,
    },
    {
      icon: <AlignRight size={iconSize} />,
      onClick: () =>
        editor.isActive({ textAlign: "right" })
          ? editor.chain().focus().unsetTextAlign().run()
          : editor.chain().focus().setTextAlign("right").run(),
      disabled: !editor.can().setTextAlign?.("right"),
      isActive: editor.isActive({ textAlign: "right" }),
      hideOnXS: true,
    },
    {
      icon: <AlignCenter size={iconSize} />,
      onClick: () =>
        editor.isActive({ textAlign: "center" })
          ? editor.chain().focus().unsetTextAlign().run()
          : editor.chain().focus().setTextAlign("center").run(),
      disabled: !editor.can().setTextAlign?.("center"),
      isActive: editor.isActive({ textAlign: "center" }),
      hideOnXS: true,
    },
    {
      icon: <Undo size={iconSize} />,
      onClick: () => editor.chain().focus().undo().run(),
      disabled: !editor.can().undo(),
      isActive: false,
    },
    {
      icon: <Redo size={iconSize} />,
      onClick: () => editor.chain().focus().redo().run(),
      disabled: !editor.can().redo(),
      isActive: false,
    },
  ];

  const visibleButtons = buttons.filter((b) => !(isXS && b.hideOnXS));

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
    if (!emojiOpen) {
      setEmojiQuery("");
    }
  }, [emojiOpen]);

  const filteredEmojis = useMemo(() => {
    const query = emojiQuery.trim().toLowerCase();
    if (!query) return emojis;
    return emojis
      .filter((emoji) => emoji.slug.includes(query))
      .sort((a, b) => {
        const aStarts = a.slug.startsWith(query) ? 1 : 0;
        const bStarts = b.slug.startsWith(query) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;
        return a.slug.localeCompare(b.slug);
      });
  }, [emojiQuery, emojis]);

  return (
    <Hstack className="mb-2" wrap>
      {visibleButtons.map(({ icon, onClick, disabled, isActive }, index) => (
        <EditorMenuButton
          key={index}
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
          onClick={() => setEmojiOpen((open) => !open)}
          isActive={emojiOpen}
          disabled={emojis.length === 0}
          size={size}
        >
          <SmilePlus size={iconSize} />
        </EditorMenuButton>
        <Popover
          shown={emojiOpen}
          anchorToScreen={false}
          position="bottom-left"
          padding={8}
        >
          <div className="flex w-64 flex-col gap-2">
            <Input
              value={emojiQuery}
              onValueChange={setEmojiQuery}
              placeholder="Search emoji"
              size="sm"
            />
            {filteredEmojis.length === 0 ? (
              <Text size="xs" color="textFaded">
                No emojis found.
              </Text>
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
                        alt={`:${emoji.slug}:`}
                        className="h-4 w-4"
                        loading="lazy"
                        decoding="async"
                      />
                    }
                    tooltip={`:${emoji.slug}:`}
                    onClick={() => {
                      editor.chain().focus().insertContent(`:${emoji.slug}:`).run();
                      setEmojiOpen(false);
                      setEmojiQuery("");
                    }}
                  >
                  </Button>
                ))}
              </div>
            )}
          </div>
        </Popover>
      </div>
    </Hstack>
  );
}
