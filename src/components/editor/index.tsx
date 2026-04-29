"use client";

import { Extension, InputRule, Node, mergeAttributes } from "@tiptap/core";
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
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import Youtube from "@tiptap/extension-youtube";
import CodeBlock from "@tiptap/extension-code-block";
import Link from "@tiptap/extension-link";
import ImageResize from "tiptap-extension-resize-image";
import { getCookie } from "@/helpers/cookie";
import { useTheme } from "@/providers/useSiteTheme";
import ThemedProse from "../themed-prose";
import { addToast } from "bioloom-ui";
import { useTranslations } from "@/compat/next-intl";
import Mentions from "../mentions/Mentions";
import { useEmojis } from "@/providers/useEmojis";
import { createEmojiShortcodeExtension } from "../emoji/EmojiShortcodes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EmojiType } from "@/providers/useEmojis";
import { BASE_URL } from "@/requests/config";
import {
  editorContentToMarkdown,
  injectAlignmentMetadataIntoMarkdown,
  injectBlockquoteMetadataIntoMarkdown,
  injectImageMetadataIntoMarkdown,
  markdownToEditorContent,
  toCanonicalTwitchUrl,
  toCanonicalYouTubeUrl,
  twitchEmbedHtml,
} from "@/helpers/richText";

type MentionKind = "user" | "game";

type MentionSuggestion = {
  type: MentionKind;
  slug: string;
  name: string;
  image?: string | null;
};

type EditorProps = {
  content: string;
  setContent: (content: string) => void;
  gameEditor?: boolean;
  size?: "xs" | "sm";
  format?: "html" | "markdown";
};

const limit = 32767;

const TextAlignMarkdownCommands = Extension.create({
  name: "textAlignMarkdownCommands",
  addInputRules() {
    const openRule = new InputRule({
      find: /^\[(center|right)\]$/,
      handler: ({ range, match, chain }) => {
        const alignment = match[1] as "center" | "right";
        chain()
          .command(({ tr }) => {
            tr.delete(range.from, range.to);
            return true;
          })
          .setTextAlign(alignment)
          .run();
      },
    });

    const closeRule = new InputRule({
      find: /^\[\/(center|right)\]$/,
      handler: ({ range, chain }) => {
        chain()
          .command(({ tr }) => {
            tr.delete(range.from, range.to);
            return true;
          })
          .unsetTextAlign()
          .run();
      },
    });

    return [openRule, closeRule];
  },
});

const SubSupMarkdownCommands = Extension.create({
  name: "subSupMarkdownCommands",
  addInputRules() {
    const superscriptRule = new InputRule({
      find: /\^\{([^{}]+)\}$/,
      handler: ({ range, chain }) => {
        chain()
          .command(({ tr, state }) => {
            const mark = state.schema.marks.superscript;
            if (!mark) return false;
            tr.delete(range.to - 1, range.to);
            tr.delete(range.from, range.from + 2);
            tr.addMark(range.from, range.to - 3, mark.create());
            return true;
          })
          .run();
      },
    });

    const subscriptRule = new InputRule({
      find: /_\{([^{}]+)\}$/,
      handler: ({ range, chain }) => {
        chain()
          .command(({ tr, state }) => {
            const mark = state.schema.marks.subscript;
            if (!mark) return false;
            tr.delete(range.to - 1, range.to);
            tr.delete(range.from, range.from + 2);
            tr.addMark(range.from, range.to - 3, mark.create());
            return true;
          })
          .run();
      },
    });

    return [superscriptRule, subscriptRule];
  },
});

const Twitch = Node.create({
  name: "twitch",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-twitch-embed]",
        getAttrs: (element) => ({
          src: (element as HTMLElement).getAttribute("data-src"),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const src = String(HTMLAttributes.src ?? "");
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-twitch-embed": "true",
        "data-src": src,
        class: "embed embed-twitch",
      }),
      [
        "iframe",
        {
          src,
          height: "480",
          width: "100%",
          allowfullscreen: "true",
          frameborder: "0",
        },
      ],
    ];
  },

});

const getMarkdown = (editor: NonNullable<ReturnType<typeof useEditor>>) => {
  const typedEditor = editor as unknown as {
    storage?: { markdown?: { getMarkdown?: () => string } };
  };
  const value =
    typedEditor.storage?.markdown?.getMarkdown?.() ?? editor.getText();
  const html = editor.getHTML();
  const withImageMetadata = injectImageMetadataIntoMarkdown(
    value,
    html,
  );
  const withAlignmentMetadata = injectAlignmentMetadataIntoMarkdown(
    withImageMetadata,
    html,
  );
  const withBlockquoteMetadata = injectBlockquoteMetadataIntoMarkdown(
    withAlignmentMetadata,
    html,
  );
  return editorContentToMarkdown(withBlockquoteMetadata);
};

export default function Editor({
  content,
  setContent,
  gameEditor,
  size,
  format = "html",
}: EditorProps) {
  const { colors } = useTheme();
  const t = useTranslations();
  const { emojiMap, emojis } = useEmojis();
  const emojiMapRef = useRef(emojiMap);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiMatches, setEmojiMatches] = useState<EmojiType[]>([]);
  const [emojiIndex, setEmojiIndex] = useState(0);
  const [emojiCoords, setEmojiCoords] = useState<{ left: number; top: number } | null>(
    null
  );
  const [emojiRange, setEmojiRange] = useState<{ from: number; to: number } | null>(
    null
  );
  const editorRef = useRef<typeof editor | null>(null);
  const emojiListRef = useRef<HTMLDivElement | null>(null);
  const emojiStateRef = useRef({
    open: false,
    matches: [] as EmojiType[],
    index: 0,
    range: null as { from: number; to: number } | null,
  });
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionMatches, setMentionMatches] = useState<MentionSuggestion[]>([]);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionCoords, setMentionCoords] = useState<{ left: number; top: number } | null>(
    null
  );
  const [mentionRange, setMentionRange] = useState<{ from: number; to: number } | null>(
    null
  );
  const mentionStateRef = useRef({
    open: false,
    matches: [] as MentionSuggestion[],
    index: 0,
    range: null as { from: number; to: number } | null,
  });
  const mentionQueryRef = useRef("");
  const mentionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    emojiMapRef.current = emojiMap;
  }, [emojiMap]);

  const emojiExtension = useMemo(
    () => createEmojiShortcodeExtension(emojiMapRef),
    []
  );
  const initialContent =
    format === "markdown" ? markdownToEditorContent(content) : content;

  const insertEmojiAtRange = useCallback(
    (emoji: EmojiType, range: { from: number; to: number }) => {
      const activeEditor = editorRef.current;
      if (!activeEditor) return;
      activeEditor
        .chain()
        .focus()
        .insertContentAt(range, `:${emoji.slug}:`)
        .run();
      setEmojiOpen(false);
      setEmojiMatches([]);
      setEmojiIndex(0);
      setEmojiRange(null);
    },
    []
  );

  const insertMentionAtRange = useCallback(
    (mention: MentionSuggestion, range: { from: number; to: number }) => {
      const activeEditor = editorRef.current;
      if (!activeEditor) return;
      const token = `${mention.type === "user" ? "@" : "!"}${mention.slug}`;
      activeEditor
        .chain()
        .focus()
        .insertContentAt(range, `${token} `)
        .run();
      setMentionOpen(false);
      setMentionMatches([]);
      setMentionIndex(0);
      setMentionRange(null);
      mentionQueryRef.current = "";
    },
    []
  );

  const fetchMentionSuggestions = useCallback(
    async (type: MentionKind, query: string) => {
      const url = `${BASE_URL}/search?query=${encodeURIComponent(query)}&type=${
        type === "user" ? "users" : "games"
      }`;
      const response = await fetch(url);
      if (!response.ok) return [];
      const payload = await response.json();
      const list = payload?.data?.[type === "user" ? "users" : "games"] ?? [];
      return list.map((item: any) => ({
        type,
        slug: item.slug,
        name: item.name ?? item.slug,
        image:
          type === "user"
            ? item.profilePicture ?? null
            : item.thumbnail ?? item.banner ?? null,
      })) as MentionSuggestion[];
    },
    []
  );

  const updateMentionSuggestions = useCallback(
    (activeEditor: typeof editor) => {
      if (!activeEditor) {
        setMentionOpen(false);
        return;
      }
      const { state, view } = activeEditor;
      const { from } = state.selection;
      const $from = state.selection.$from;
      const parentText = $from.parent.textBetween(
        0,
        $from.parentOffset,
        "\0",
        "\0"
      );

      const lastAt = parentText.lastIndexOf("@");
      const lastBang = parentText.lastIndexOf("!");
      const triggerIndex = Math.max(lastAt, lastBang);

      if (triggerIndex < 0) {
        setMentionOpen(false);
        return;
      }

      const triggerChar = parentText[triggerIndex];
      const beforeChar = triggerIndex > 0 ? parentText[triggerIndex - 1] : " ";
      if (beforeChar && /[a-zA-Z0-9_-]/.test(beforeChar)) {
        setMentionOpen(false);
        return;
      }

      const query = parentText.slice(triggerIndex + 1);
      if (!/^[a-zA-Z0-9_-]{1,40}$/.test(query)) {
        setMentionOpen(false);
        return;
      }

      const type: MentionKind = triggerChar === "@" ? "user" : "game";
      const parentStart = from - $from.parentOffset;
      const range = { from: parentStart + triggerIndex, to: from };
      const coords = view.coordsAtPos(from);

      setMentionRange(range);
      setMentionCoords({ left: coords.left, top: coords.bottom + 6 });

      if (mentionQueryRef.current === `${type}:${query}`) {
        setMentionOpen(true);
        return;
      }

      mentionQueryRef.current = `${type}:${query}`;
      if (mentionTimerRef.current) {
        clearTimeout(mentionTimerRef.current);
      }

      mentionTimerRef.current = setTimeout(async () => {
        const results = await fetchMentionSuggestions(type, query);
        if (results.length === 0) {
          setMentionOpen(false);
          setMentionMatches([]);
          setMentionIndex(0);
          return;
        }
        setMentionMatches(results);
        setMentionIndex(0);
        setMentionOpen(true);
        setEmojiOpen(false);
      }, 180);
    },
    [fetchMentionSuggestions]
  );

  const updateEmojiSuggestions = useCallback(
    (activeEditor: typeof editor) => {
      if (mentionOpen) {
        setEmojiOpen(false);
        return;
      }
      if (!activeEditor || emojis.length === 0) {
        setEmojiOpen(false);
        return;
      }
      const { state, view } = activeEditor;
      const { from } = state.selection;
      const $from = state.selection.$from;
      const parentText = $from.parent.textBetween(
        0,
        $from.parentOffset,
        "\0",
        "\0"
      );
      const lastColon = parentText.lastIndexOf(":");
      if (lastColon < 0) {
        setEmojiOpen(false);
        return;
      }

      const query = parentText.slice(lastColon + 1);
      if (!/^[a-zA-Z0-9_-]{1,40}$/.test(query)) {
        setEmojiOpen(false);
        return;
      }

      const normalized = query.toLowerCase();
      const matches = emojis
        .filter((emoji) => emoji.slug.includes(normalized))
        .sort((a, b) => {
          const aStarts = a.slug.startsWith(normalized) ? 1 : 0;
          const bStarts = b.slug.startsWith(normalized) ? 1 : 0;
          if (aStarts !== bStarts) return bStarts - aStarts;
          return a.slug.localeCompare(b.slug);
        })
        .slice(0, 24);

      if (matches.length === 0) {
        setEmojiOpen(false);
        return;
      }

      const parentStart = from - $from.parentOffset;
      const range = { from: parentStart + lastColon, to: from };
      const coords = view.coordsAtPos(from);
      setEmojiOpen(true);
      setEmojiMatches(matches);
      setEmojiIndex((prev) => Math.min(prev, matches.length - 1));
      setEmojiRange(range);
      setEmojiCoords({ left: coords.left, top: coords.bottom + 6 });
    },
    [emojis, mentionOpen]
  );

  const handleEmojiKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const state = emojiStateRef.current;
      if (!state.open || state.matches.length === 0) return false;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setEmojiIndex((prev) => (prev + 1) % state.matches.length);
        return true;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setEmojiIndex((prev) =>
          prev === 0 ? state.matches.length - 1 : prev - 1
        );
        return true;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const match = state.matches[state.index];
        if (match && state.range) {
          insertEmojiAtRange(match, state.range);
          return true;
        }
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setEmojiOpen(false);
        setEmojiMatches([]);
        setEmojiIndex(0);
        setEmojiRange(null);
        return true;
      }

      return false;
    },
    [insertEmojiAtRange]
  );

  const handleMentionKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const state = mentionStateRef.current;
      if (!state.open || state.matches.length === 0) return false;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setMentionIndex((prev) => (prev + 1) % state.matches.length);
        return true;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setMentionIndex((prev) =>
          prev === 0 ? state.matches.length - 1 : prev - 1
        );
        return true;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const match = state.matches[state.index];
        if (match && state.range) {
          insertMentionAtRange(match, state.range);
          return true;
        }
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setMentionOpen(false);
        setMentionMatches([]);
        setMentionIndex(0);
        setMentionRange(null);
        return true;
      }

      return false;
    },
    [insertMentionAtRange]
  );

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
      Heading.configure({
        levels: [1, 2, 3],
      }),
      ListItem,
      OrderedList,
      BulletList,
      HardBreak,
      Markdown.configure({
        transformCopiedText: true,
        transformPastedText: true,
      }),
      Typography,
      TextAlignMarkdownCommands,
      SubSupMarkdownCommands,
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
      Twitch,
      CodeBlock,
      Link,
      Mentions,
      emojiExtension,
      ImageResize.extend({
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
    content: initialContent,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setContent(format === "markdown" ? getMarkdown(editor) : editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          (gameEditor
            ? "min-h-[600px] max-h-[600px]"
            : size == "sm"
            ? "min-h-[150px] max-h-[400px]"
            : "min-h-[100px] max-h-[400px]") +
          (size == "sm" ? " border-gray-500" : " border-gray-600") +
          " overflow-y-auto cursor-text rounded-md border px-5 focus-within:outline-none focus-within:border-blue-500 !duration-250 !ease-linear !transition-all",
      },
      handleKeyDown: (_view, event) => {
        if (handleMentionKeyDown(event)) return true;
        return handleEmojiKeyDown(event);
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

        const plainText = event.clipboardData.getData("text/plain")?.trim();
        if (plainText) {
          const youtubeUrl = toCanonicalYouTubeUrl(plainText);
          if (youtubeUrl) {
            event.preventDefault();
            editor
              ?.chain()
              .focus()
              .setYoutubeVideo({ src: youtubeUrl, width: 320, height: 180 })
              .run();
            return true;
          }

          const twitchUrl = toCanonicalTwitchUrl(plainText);
          if (twitchUrl) {
            const embed = twitchEmbedHtml(twitchUrl);
            if (!embed) return false;
            const parser = new DOMParser();
            const documentNode = parser.parseFromString(embed, "text/html");
            const iframe = documentNode.querySelector("iframe");
            const src = iframe?.getAttribute("src");
            if (!src) return false;
            event.preventDefault();
            editor
              ?.chain()
              .focus()
              .insertContent({ type: "twitch", attrs: { src } })
              .run();
            return true;
          }
        }

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
          editor
            ?.chain()
            .focus()
            .insertContent({
              type: "imageResize",
              attrs: { src: json.data },
            })
            .run();
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
                const coordinates = view.posAtCoords({
                  left: event.clientX,
                  top: event.clientY,
                });
                if (!coordinates) {
                  addToast({ title: "Error getting coordinates" });
                  return;
                }

                return editor
                  ?.chain()
                  .focus()
                  .insertContentAt(coordinates.pos, {
                    type: "imageResize",
                    attrs: { src: data.data },
                  })
                  .run();
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

  useEffect(() => {
    emojiStateRef.current = {
      open: emojiOpen,
      matches: emojiMatches,
      index: emojiIndex,
      range: emojiRange,
    };
  }, [emojiOpen, emojiMatches, emojiIndex, emojiRange]);

  useEffect(() => {
    mentionStateRef.current = {
      open: mentionOpen,
      matches: mentionMatches,
      index: mentionIndex,
      range: mentionRange,
    };
  }, [mentionOpen, mentionMatches, mentionIndex, mentionRange]);

  useEffect(() => {
    if (!editor) return;
    editorRef.current = editor;
    const updateHandler = () => {
      updateMentionSuggestions(editor);
      updateEmojiSuggestions(editor);
    };
    editor.on("update", updateHandler);
    editor.on("selectionUpdate", updateHandler);
    return () => {
      editor.off("update", updateHandler);
      editor.off("selectionUpdate", updateHandler);
    };
  }, [editor, updateEmojiSuggestions, updateMentionSuggestions]);

  useEffect(() => {
    if (!emojiOpen) return;
    const container = emojiListRef.current;
    if (!container) return;
    const active = container.querySelector<HTMLButtonElement>(
      `[data-emoji-index="${emojiIndex}"]`
    );
    if (active) {
      active.scrollIntoView({ block: "nearest" });
    }
  }, [emojiIndex, emojiOpen, emojiMatches.length]);

  useEffect(() => {
    return () => {
      if (mentionTimerRef.current) {
        clearTimeout(mentionTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full">
      <EditorMenuBar editor={editor} size={size} />
      <ThemedProse className="[&_.ProseMirror_h1]:my-0 [&_.ProseMirror_h1]:text-inherit [&_.ProseMirror_h1]:leading-inherit [&_.ProseMirror_h2]:my-0 [&_.ProseMirror_h2]:text-inherit [&_.ProseMirror_h2]:leading-inherit [&_.ProseMirror_h3]:my-0 [&_.ProseMirror_h3]:text-inherit [&_.ProseMirror_h3]:leading-inherit [&_.ProseMirror_p]:my-3 [&_.ProseMirror_p:empty]:h-auto [&_.ProseMirror_p:empty]:my-3 [&_.ProseMirror_p>br:only-child]:inline">
        <EditorContent editor={editor} />
      </ThemedProse>
      {mentionOpen && mentionMatches.length > 0 && mentionCoords && (
        <div
          style={{
            position: "fixed",
            left: mentionCoords.left,
            top: mentionCoords.top,
            zIndex: 60,
            backgroundColor: colors["mantle"],
            border: `1px solid ${colors["base"]}`,
            color: colors["text"],
            borderRadius: 10,
            padding: 6,
            minWidth: 220,
            boxShadow:
              "0 10px 15px -3px rgba(0,0,0,0.2), 0 4px 6px -4px rgba(0,0,0,0.2)",
          }}
        >
          {mentionMatches.map((mention, index) => (
            <button
              key={`${mention.type}-${mention.slug}`}
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left"
              style={{
                backgroundColor:
                  index === mentionIndex
                    ? colors["blueDarkDark"]
                    : "transparent",
                color: colors["text"],
              }}
              onMouseDown={(event) => {
                event.preventDefault();
                if (mentionRange) {
                  insertMentionAtRange(mention, mentionRange);
                }
              }}
            >
              <img
                src={mention.image || "/images/D2J_Icon.png"}
                alt={mention.name}
                className="h-5 w-5"
                style={{
                  borderRadius: mention.type === "user" ? "999px" : "6px",
                  objectFit: "cover",
                }}
                loading="lazy"
                decoding="async"
              />
              <div className="flex flex-col">
                <span className="text-sm">{mention.name}</span>
                <span className="text-xs opacity-70">
                  {mention.type === "user" ? "@" : "!"}
                  {mention.slug}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
      {emojiOpen && emojiMatches.length > 0 && emojiCoords && (
        <div
          style={{
            position: "fixed",
            left: emojiCoords.left,
            top: emojiCoords.top,
            zIndex: 60,
            backgroundColor: colors["mantle"],
            border: `1px solid ${colors["base"]}`,
            color: colors["text"],
            borderRadius: 8,
            padding: 6,
            minWidth: 180,
            boxShadow:
              "0 10px 15px -3px rgba(0,0,0,0.2), 0 4px 6px -4px rgba(0,0,0,0.2)",
          }}
        >
          <div ref={emojiListRef} className="max-h-48 overflow-y-auto">
            {emojiMatches.map((emoji, index) => (
              <button
                key={emoji.id}
                type="button"
                data-emoji-index={index}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left"
                style={{
                  backgroundColor:
                    index === emojiIndex
                      ? colors["blueDarkDark"]
                      : "transparent",
                  color: colors["text"],
                }}
                onMouseDown={(event) => {
                  event.preventDefault();
                  if (emojiRange) {
                    insertEmojiAtRange(emoji, emojiRange);
                  }
                }}
              >
                <img
                  src={emoji.image}
                  alt={`:${emoji.slug}:`}
                  className="h-4 w-4"
                  loading="lazy"
                  decoding="async"
                />
                <span>:{emoji.slug}:</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {size == "sm" && <div className="mt-3" />}
      {editor && size == "sm" && (
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
