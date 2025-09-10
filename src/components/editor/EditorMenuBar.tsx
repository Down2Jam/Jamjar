"use client";

import { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
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
  Strikethrough,
  Subscript,
  Superscript,
  Undo,
} from "lucide-react";
import EditorMenuButton from "./EditorMenuButton";
import { getCookie } from "@/helpers/cookie";
import { Hstack } from "@/framework/Stack";
import { addToast } from "@heroui/react";

type EditorMenuProps = {
  editor: Editor | null;
  size?: "xs" | "sm";
};

export default function EditorMenuBar({
  editor,
  size = "sm",
}: EditorMenuProps) {
  if (!editor) return null;

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
          editor?.commands.setImage({ src: data.data });
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
      icon: <AlignLeft size={iconSize} />,
      onClick: () => editor.chain().focus().setTextAlign("left").run(),
      disabled: !editor.can().setTextAlign?.("left"),
      isActive: editor.isActive({ textAlign: "left" }),
      hideOnXS: true,
    },
    {
      icon: <AlignRight size={iconSize} />,
      onClick: () => editor.chain().focus().setTextAlign("right").run(),
      disabled: !editor.can().setTextAlign?.("right"),
      isActive: editor.isActive({ textAlign: "right" }),
      hideOnXS: true,
    },
    {
      icon: <AlignCenter size={iconSize} />,
      onClick: () => editor.chain().focus().setTextAlign("center").run(),
      disabled: !editor.can().setTextAlign?.("center"),
      isActive: editor.isActive({ textAlign: "center" }),
      hideOnXS: true,
    },
    {
      icon: <AlignJustify size={iconSize} />,
      onClick: () => editor.chain().focus().setTextAlign("justify").run(),
      disabled: !editor.can().setTextAlign?.("justify"),
      isActive: editor.isActive({ textAlign: "justify" }),
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
    </Hstack>
  );
}
