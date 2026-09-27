"use client";

import { Extension } from "@tiptap/core";
import { Plugin, EditorState } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import type { MutableRefObject } from "react";
import type { EmojiType } from "@/providers/useEmojis";

const EMOJI_REGEX = /::[a-zA-Z0-9_-]+::|:([a-zA-Z0-9_-]+):/g;
const STICKER_REGEX = /^::([a-zA-Z0-9_-]+)::$/;
const MAX_LARGE_EMOJIS = 5;

function isEmojiOnlyLine(
  text: string,
  emojis: Record<string, EmojiType>,
): boolean {
  const visibleText = text.replace(/[\u200B-\u200D\uFEFF]/g, "");
  const regex = /:([a-zA-Z0-9_-]+):/g;
  let count = 0;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(visibleText))) {
    if (
      visibleText.slice(lastIndex, match.index).trim() ||
      !emojis[match[1]] ||
      emojis[match[1]].kind === "STICKER"
    ) {
      return false;
    }

    count += 1;
    if (count > MAX_LARGE_EMOJIS) return false;
    lastIndex = match.index + match[0].length;
  }

  return count > 0 && !visibleText.slice(lastIndex).trim();
}

export function createEmojiShortcodeExtension(
  emojiMapRef: MutableRefObject<Record<string, EmojiType>>,
  stickerMapRef: MutableRefObject<Record<string, EmojiType>>,
) {
  return Extension.create({
    name: "emojiShortcodes",
    addProseMirrorPlugins() {
      return [
        new Plugin({
          props: {
            decorations: (state: EditorState) => {
              const emojis = emojiMapRef.current;
              const stickers = stickerMapRef.current;
              if (
                Object.keys(emojis).length === 0 &&
                Object.keys(stickers).length === 0
              ) {
                return DecorationSet.empty;
              }

              const decorations: Decoration[] = [];
              const { doc } = state;

              doc.descendants((node, pos) => {
                if (node.isTextblock) {
                  const visibleText = node.textContent
                    .replace(/[\u200B-\u200D\uFEFF]/g, "")
                    .trim();
                  const stickerMatch = visibleText.match(STICKER_REGEX);
                  const sticker = stickerMatch ? stickers[stickerMatch[1]] : null;

                  if (sticker && stickerMatch) {
                    const token = stickerMatch[0];
                    const tokenIndex = node.textContent.indexOf(token);
                    if (tokenIndex < 0) return false;

                    const start = pos + 1 + tokenIndex;
                    const end = start + token.length;
                    const slug = stickerMatch[1];

                    decorations.push(
                      Decoration.widget(
                        start,
                        () => {
                          const img = document.createElement("img");
                          img.src = sticker.image;
                          img.alt = token;
                          img.title = token;
                          img.className = "sticker-inline";
                          img.setAttribute("data-sticker", slug);
                          img.setAttribute("draggable", "false");
                          return img;
                        },
                        { side: 0, stopEvent: () => true },
                      ),
                    );

                    decorations.push(
                      Decoration.inline(start, end, {
                        style:
                          "font-size:0;line-height:0;width:0;height:0;display:inline-block;overflow:hidden;",
                      }),
                    );

                    return false;
                  }
                }

                if (node.isTextblock && isEmojiOnlyLine(node.textContent, emojis)) {
                  decorations.push(
                    Decoration.node(pos, pos + node.nodeSize, {
                      class: "emoji-only-line",
                    }),
                  );
                }

                if (!node.isText || !node.text) return;

                EMOJI_REGEX.lastIndex = 0;
                let match: RegExpExecArray | null;

                while ((match = EMOJI_REGEX.exec(node.text))) {
                  const slug = match[1];
                  if (!slug) continue;

                  const emoji = emojis[slug];
                  if (!emoji) continue;

                  const start = pos + match.index;
                  const end = start + match[0].length;

                  decorations.push(
                    Decoration.widget(
                      start,
                      () => {
                        const img = document.createElement("img");
                        img.src = emoji.image;
                        img.alt = `:${slug}:`;
                        img.title = `:${slug}:`;
                        img.className = "emoji-inline";
                        img.setAttribute("data-emoji", slug);
                        img.setAttribute("draggable", "false");
                        return img;
                      },
                      { side: 0, stopEvent: () => true },
                    ),
                  );

                  decorations.push(
                    Decoration.inline(start, end, {
                      style:
                        "font-size:0;line-height:0;width:0;height:0;display:inline-block;overflow:hidden;",
                    }),
                  );
                }
              });

              return DecorationSet.create(doc, decorations);
            },
          },
        }),
      ];
    },
  });
}
