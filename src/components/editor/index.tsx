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
import Link from "@tiptap/extension-link";
import ImageResize from "tiptap-extension-resize-image";
import { getCookie } from "@/helpers/cookie";
import { useTheme } from "@/providers/SiteThemeProvider";
import ThemedProse from "../themed-prose";
import { addToast } from "@heroui/react";
import { useTranslations } from "next-intl";

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
  const { colors } = useTheme();
  const t = useTranslations();

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
      Youtube.configure({
        width: 320,
        height: 180,
      }),
      CodeBlock,
      Link,
      ImageResize.configure({
        allowBase64: false,
      }).extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            style: {
              default: "height: auto; cursor: pointer;",
              parseHTML: (element) => {
                const width =
                  element.getAttribute("width") || element.style.width;
                return width
                  ? `width: ${width}px; height: auto; cursor: pointer;`
                  : `${element.style.cssText}`;
              },
            },
          };
        },
      }),
    ],
    content: content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          (gameEditor
            ? "min-h-[600px] max-h-[600px]"
            : "min-h-[150px] max-h-[400px]") +
          " overflow-y-auto cursor-text rounded-md border p-5 focus-within:outline-none focus-within:border-blue-500 !duration-250 !ease-linear !transition-all",
      },
      handleDOMEvents: {
        keydown: (_view, event) => {
          // Prevent site-wide hotkeys from seeing editor keystrokes
          event.stopPropagation();
          return false;
        },
        keypress: (_view, event) => {
          event.stopPropagation();
          return false;
        },
        keyup: (_view, event) => {
          event.stopPropagation();
          return false;
        },
      },
      handlePaste: (view, event) => {
        if (!event.clipboardData) return false;

        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/apng",
          "image/gif",
          "image/webp",
          "image/svg+xml",
        ];

        const uploadFile = async (file: File) => {
          const filesizeMB = file.size / 1024 / 1024;
          if (!allowedTypes.includes(file.type)) {
            addToast({ title: "Invalid file format" });
            return false;
          }
          if (filesizeMB > 8) {
            addToast({ title: "Image is too big" });
            return false;
          }

          const formData = new FormData();
          formData.append("upload", file);

          const res = await fetch(
            process.env.NEXT_PUBLIC_MODE === "PROD"
              ? "https://d2jam.com/api/v1/image"
              : "http://localhost:3005/api/v1/image",
            {
              method: "POST",
              body: formData,
              headers: { authorization: `Bearer ${getCookie("token")}` },
              credentials: "include",
            }
          );

          if (!res.ok) {
            addToast({ title: "Failed to upload image" });
            return false;
          }

          const json = await res.json();
          addToast({ title: json.message });

          const { schema } = view.state;
          const { tr } = view.state;
          const pos = view.state.selection.from;

          const node = schema.nodes.image.create({ src: json.data });
          view.dispatch(tr.insert(pos, node));
          return true;
        };

        // 1) Direct image files on the clipboard
        const files = Array.from(event.clipboardData.files || []);
        const imageFile = files.find((f) => allowedTypes.includes(f.type));
        if (imageFile) {
          event.preventDefault();
          uploadFile(imageFile);
          return true;
        }

        // 2) Data-URI <img> from rich HTML paste
        const html = event.clipboardData.getData("text/html");
        const match = html.match(
          /<img[^>]+src=["'](data:image\/[a-zA-Z+]+;base64,[^"']+)["']/
        );
        if (match && match[1]) {
          event.preventDefault();

          const dataUrl = match[1];
          // turn data URL into a Blob/File
          const [meta, b64] = dataUrl.split(",");
          const mime = meta.match(/data:([^;]+);/)?.[1] || "image/png";
          const bin = atob(b64);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          const blob = new Blob([bytes], { type: mime });
          const ext = mime.split("/")[1] || "png";

          uploadFile(new File([blob], `pasted.${ext}`, { type: mime }));
          return true;
        }

        // 3) Plain text data-URI paste
        const text = event.clipboardData.getData("text/plain");
        if (text?.startsWith("data:image/")) {
          event.preventDefault();

          const [meta, b64] = text.split(",");
          const mime = meta.match(/data:([^;]+);/)?.[1] || "image/png";
          const bin = atob(b64);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          const blob = new Blob([bytes], { type: mime });
          const ext = mime.split("/")[1] || "png";

          uploadFile(new File([blob], `pasted.${ext}`, { type: mime }));
          return true;
        }

        return false; // let non-image pastes proceed
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
            addToast({ title: "Invalid file format" });
            return false;
          }

          if (filesize > 8) {
            addToast({ title: "Image is too big" });
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
                addToast({ title: data.message });
                const { schema } = view.state;
                const coordinates = view.posAtCoords({
                  left: event.clientX,
                  top: event.clientY,
                });
                if (!coordinates) {
                  addToast({ title: "Error getting coordinates" });
                  return;
                }

                const node = schema.nodes.image.create({ src: data.data });
                const transaction = view.state.tr.insert(coordinates.pos, node);
                return view.dispatch(transaction);
              });
            } else {
              addToast({ title: "Failed to upload image" });
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
      <ThemedProse>
        <EditorContent editor={editor} />
      </ThemedProse>
      <div className="mt-3" />
      {editor && (
        <div
          className={`transform-color duration-250 ease-linear flex items-center gap-3`}
          style={{
            color:
              editor.storage.characterCount.characters() === limit
                ? colors["red"]
                : editor.storage.characterCount.characters() > limit / 2
                ? colors["yellow"]
                : colors["textFaded"],
          }}
        >
          <svg width="30" height="30" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke={colors["base"]}
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
                  ? colors["red"]
                  : editor.storage.characterCount.characters() > limit / 2
                  ? colors["yellow"]
                  : colors["textFaded"]
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
          {editor.storage.characterCount.characters()} / {limit}{" "}
          {t("Markdown.Characters")}
          <br />
          {editor.storage.characterCount.words()} {t("Markdown.Words")}
        </div>
      )}
    </div>
  );
}
