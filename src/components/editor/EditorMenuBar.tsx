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
import { toast } from "react-toastify";
import { getCookie } from "@/helpers/cookie";
import { Hstack } from "@/framework/Stack";

type EditorMenuProps = {
  editor: Editor | null;
};

export default function EditorMenuBar({ editor }: EditorMenuProps) {
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
      toast.error("Invalid file format");
      return false;
    }

    if (filesize > 8) {
      toast.error("Image is too big");
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
          toast.success(data.message);
          editor?.commands.setImage({ src: data.data });
        });
      } else {
        toast.error("Failed to upload image");
      }
    });
  }

  const buttons = [
    {
      icon: <Bold size={20} />,
      onClick: () => editor.chain().focus().toggleBold().run(),
      disabled: false,
      isActive: editor.isActive("bold"),
    },
    {
      icon: <Italic size={20} />,
      onClick: () => editor.chain().focus().toggleItalic().run(),
      disabled: false,
      isActive: editor.isActive("italic"),
    },
    {
      icon: <Highlighter size={20} />,
      onClick: () => editor.chain().focus().toggleHighlight().run(),
      disabled: false,
      isActive: editor.isActive("highlight"),
    },
    {
      icon: <Strikethrough size={20} />,
      onClick: () => editor.chain().focus().toggleStrike().run(),
      disabled: false,
      isActive: editor.isActive("strike"),
    },
    {
      icon: <Subscript size={20} />,
      onClick: () => editor.chain().focus().toggleSubscript().run(),
      disabled: false,
      isActive: editor.isActive("subscript"),
    },
    {
      icon: <Superscript size={20} />,
      onClick: () => editor.chain().focus().toggleSuperscript().run(),
      disabled: false,
      isActive: editor.isActive("superscript"),
    },
    {
      icon: <LinkIcon size={20} />,
      onClick: addLink,
      disabled: false,
      isActive: editor.isActive("link"),
    },
    {
      icon: <ImageIcon size={20} />,
      onClick: addImage,
      disabled: false,
      isActive: false,
    },
    {
      icon: <Minus size={20} />,
      onClick: () => editor.chain().focus().setHorizontalRule().run(),
      disabled: !editor.can().setHorizontalRule(),
      isActive: false,
    },
    {
      icon: <Quote size={20} />,
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
      disabled: !editor.can().toggleBlockquote(),
      isActive: editor.isActive("blockquote"),
    },
    {
      icon: <Code size={20} />,
      onClick: () => editor.chain().focus().toggleCodeBlock().run(),
      disabled: !editor.can().toggleCodeBlock(),
      isActive: editor.isActive("codeblock"),
    },
    {
      icon: <AlignLeft size={20} />,
      onClick: () => editor.chain().focus().setTextAlign("left").run(),
      disabled: !editor.can().setTextAlign("left"),
      isActive: editor.isActive("textalign"),
    },
    {
      icon: <AlignRight size={20} />,
      onClick: () => editor.chain().focus().setTextAlign("right").run(),
      disabled: !editor.can().setTextAlign("right"),
      isActive: editor.isActive("textalign"),
    },
    {
      icon: <AlignCenter size={20} />,
      onClick: () => editor.chain().focus().setTextAlign("center").run(),
      disabled: !editor.can().setTextAlign("center"),
      isActive: editor.isActive("textalign"),
    },
    {
      icon: <AlignJustify size={20} />,
      onClick: () => editor.chain().focus().setTextAlign("justify").run(),
      disabled: !editor.can().setTextAlign("justify"),
      isActive: editor.isActive("textalign"),
    },
    {
      icon: <Undo size={20} />,
      onClick: () => editor.chain().focus().undo().run(),
      disabled: !editor.can().undo(),
      isActive: editor.isActive("undo"),
    },
    {
      icon: <Redo size={20} />,
      onClick: () => editor.chain().focus().redo().run(),
      disabled: !editor.can().redo(),
      isActive: editor.isActive("redo"),
    },
  ];

  return (
    <Hstack className="mb-2" wrap>
      {buttons.map(({ icon, onClick, disabled, isActive }, index) => (
        <EditorMenuButton
          key={index}
          onClick={onClick}
          isActive={isActive}
          disabled={disabled}
        >
          {icon}
        </EditorMenuButton>
      ))}
    </Hstack>
  );
}
