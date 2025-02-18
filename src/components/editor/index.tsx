"use client";

import CharacterCount from "@tiptap/extension-character-count";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { useEditor, EditorContent } from "@tiptap/react";
import EditorMenuBar from "./EditorMenuBar";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Highlight from "@tiptap/extension-highlight";
import Strike from "@tiptap/extension-strike";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import History from "@tiptap/extension-history";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Blockquote from "@tiptap/extension-blockquote";
import Heading from "@tiptap/extension-heading";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import BulletList from "@tiptap/extension-bullet-list";
import HardBreak from "@tiptap/extension-hard-break";
import { Markdown } from "tiptap-markdown";
import TextAlign from "@tiptap/extension-text-align";
import Typography from "@tiptap/extension-typography";
import Dropcursor from "@tiptap/extension-dropcursor";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import Youtube from "@tiptap/extension-youtube";
import CodeBlock from "@tiptap/extension-code-block";
import { Spacer } from "@nextui-org/react";
import { useTheme } from "next-themes";
import Link from "@tiptap/extension-link";
import ImageResize from "tiptap-extension-resize-image";
import { toast } from "react-toastify";
import { getCookie } from "@/helpers/cookie";

type EditorProps = {
  content: string;
  setContent: (content: string) => void;
  gameEditor?: boolean;
};

const limit = 32767;

export default function Editor({
  content,
  setContent,
  gameEditor,
}: EditorProps) {
  const { theme } = useTheme();

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      CharacterCount.configure({
        limit,
      }),
      Bold,
      Italic,
      Highlight,
      Strike,
      Subscript,
      Superscript,
      History,
      HorizontalRule,
      Blockquote,
      Heading,
      ListItem,
      OrderedList,
      BulletList,
      HardBreak,
      Markdown.configure({
        transformCopiedText: true,
        transformPastedText: true,
      }),
      Typography,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Dropcursor,
      TaskItem,
      TaskList,
      Table,
      TableHeader,
      TableRow,
      TableCell,
      Youtube,
      CodeBlock,
      Link,
      ImageResize,
    ],
    content: content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert " +
          (gameEditor
            ? "min-h-[600px] max-h-[600px]"
            : "min-h-[150px] max-h-[400px]") +
          " overflow-y-auto cursor-text rounded-md border p-5 focus-within:outline-none focus-within:border-blue-500 !duration-250 !ease-linear !transition-all",
      },
      handleDrop: (view, event, slice, moved) => {
        if (
          !moved &&
          event.dataTransfer &&
          event.dataTransfer.files &&
          event.dataTransfer.files[0]
        ) {
          event.preventDefault();

          const file = event.dataTransfer.files[0];
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
          formData.append("upload", event.dataTransfer.files[0]);

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
                const { schema } = view.state;
                const coordinates = view.posAtCoords({
                  left: event.clientX,
                  top: event.clientY,
                });
                if (!coordinates) {
                  toast.error("Error getting coordinates");
                  return;
                }

                const node = schema.nodes.image.create({ src: data.data });
                const transaction = view.state.tr.insert(coordinates.pos, node);
                return view.dispatch(transaction);
              });
            } else {
              toast.error("Failed to upload image");
            }
          });
        }

        return false;
      },
    },
  });

  return (
    <div className="w-full">
      <EditorMenuBar editor={editor} />
      <EditorContent editor={editor} />
      <Spacer y={3} />
      {editor && (
        <div
          className={`${
            editor.storage.characterCount.characters() === limit
              ? "text-red-500"
              : editor.storage.characterCount.characters() > limit / 2
              ? "text-yellow-500"
              : "text-[#888] dark:text-[#555]"
          } transform-color duration-250 ease-linear flex items-center gap-3`}
        >
          <svg width="30" height="30" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke={theme === "dark" ? "#333" : "#eee"}
              strokeWidth="3"
              className="!duration-250 !ease-linear !transition-all"
            />
            <circle
              id="progress-circle"
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke={
                editor.storage.characterCount.characters() === limit
                  ? "#de362a"
                  : editor.storage.characterCount.characters() > limit / 2
                  ? "#eab308"
                  : "#26d1ff"
              }
              strokeWidth="3"
              strokeDasharray="100, 100"
              strokeDashoffset={
                (1 - editor.storage.characterCount.characters() / limit) * 100
              }
              transform="rotate(-90 18 18)"
              className="!duration-250 !ease-linear !transition-all"
            />
          </svg>
          {editor.storage.characterCount.characters()} / {limit} characters
          <br />
          {editor.storage.characterCount.words()} words
        </div>
      )}
    </div>
  );
}
