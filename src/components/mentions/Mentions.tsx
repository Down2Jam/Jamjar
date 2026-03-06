import { Extension } from "@tiptap/core";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Plugin, EditorState, Transaction } from "prosemirror-state";
import {
  cleanGameMentionsHtml,
  cleanUserMentionsHtml,
  getGameMention,
  getUserMention,
} from "./UserMentions";
import { Node as ProseMirrorNode } from "prosemirror-model";

const getDomainsGroup = () => {
  const host =
    typeof window !== "undefined" ? window.location.hostname : "d2jam.com";
  const domains = [host, "localhost", "127.0.0.1", "example.com", "d2jam.com"];
  return domains.map((domain) => domain.replace(/\./g, "\\.")).join("|");
};

const getLetterRegex = () =>
  new RegExp(
    `https?:\\/\\/(${getDomainsGroup()})(:\\d+)?\\/([a-zA-Z])\\/([a-zA-Z0-9_-]+)`,
  );

enum MentionType {
  User = "user",
  Game = "game",
}

function extractLetter(text: string): string | null {
  const match = text.match(getLetterRegex());
  return match ? match[3] : null;
}

function getMentionType(text: string): MentionType | null {
  const letter = extractLetter(text);
  if (letter === "u") {
    return MentionType.User;
  }
  if (letter === "g") {
    return MentionType.Game;
  }
  return null;
}

function getMentionText(text: string, type: MentionType): string | null {
  if (type === MentionType.User) {
    return getUserMention(text);
  }
  if (type === MentionType.Game) {
    return getGameMention(text);
  }
  return null;
}

function getMentionSlug(text: string, type: MentionType): string | null {
  if (type === MentionType.User) {
    const match = text.match(/\/u\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }
  if (type === MentionType.Game) {
    const match = text.match(/\/g\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }
  return null;
}

const shortMentionRegex =
  /(^|[\s([{\-])([@!])([a-zA-Z0-9_-]+)(?:@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}))?/g;

function getShortMentionType(symbol: string): MentionType | null {
  if (symbol === "@") {
    return MentionType.User;
  }
  if (symbol === "!") {
    return MentionType.Game;
  }
  return null;
}

const Mentions = Extension.create({
  name: "mentions",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations: (state: EditorState) => {
            const decorations: Decoration[] = [];
            const { doc } = state;
            doc.descendants((node: ProseMirrorNode, pos: number) => {
              if (node.isText) {
                const nodeText = node.text ?? "";
                const linkRegex = new RegExp(
                  `https?:\\/\\/(${getDomainsGroup()})(:\\d+)?\\/[a-zA-Z]\\/[a-zA-Z0-9_-]+`,
                  "g",
                );
                let match;
                while ((match = linkRegex.exec(nodeText))) {
                  const url = match[0];
                  const type = getMentionType(url);
                  const mention = type ? getMentionText(url, type) : null;

                  if (mention && type) {
                    decorations.push(
                      Decoration.inline(
                        pos + match.index,
                        pos + match.index + url.length,
                        { class: "!hidden" },
                      ),
                    );
                    decorations.push(
                      Decoration.widget(
                        pos + match.index,
                        () => {
                          const a = document.createElement("a");
                          a.className = `mention-chip mention-chip--${type}`;
                          a.href = url;
                          a.target = "_blank";
                          a.rel = "noopener noreferrer nofollow";
                          const slug = getMentionSlug(url, type);
                          if (slug) {
                            a.dataset.mentionType = type;
                            a.dataset.mentionSlug = slug;
                          }
                          a.textContent = mention;
                          a.title = mention;
                          return a;
                        },
                        { side: -1 },
                      ),
                    );
                  }
                }

                shortMentionRegex.lastIndex = 0;
                while ((match = shortMentionRegex.exec(nodeText))) {
                  const prefix = match[1] ?? "";
                  const symbol = match[2];
                  const slug = match[3];
                  const domain = match[4];
                  const type = getShortMentionType(symbol);
                  if (!type) {
                    continue;
                  }

                  const mention = `${symbol}${slug}`;
                  const start =
                    pos + match.index + prefix.length;
                  const end = start + mention.length;
                  const href = `${window.location.origin}/${type === MentionType.User ? "u" : "g"}/${slug}`;

                  decorations.push(
                    Decoration.inline(start, end, { class: "!hidden" }),
                  );
                  decorations.push(
                    Decoration.widget(
                      start,
                      () => {
                        const a = document.createElement("a");
                        a.className = `mention-chip mention-chip--${type}`;
                        a.href = domain
                          ? `https://${domain}/${type === MentionType.User ? "u" : "g"}/${slug}`
                          : href;
                        a.target = "_blank";
                        a.rel = "noopener noreferrer nofollow";
                        a.dataset.mentionType = type;
                        a.dataset.mentionSlug = slug;
                        if (domain) {
                          a.dataset.mentionDomain = domain;
                        }
                        a.textContent = mention;
                        a.title = mention;
                        return a;
                      },
                      { side: -1 },
                    ),
                  );
                }
              }
            });
            return DecorationSet.create(doc, decorations);
          },
        },
      }),
      // link mark removal plugin
      new Plugin({
        appendTransaction: (transactions, oldState, newState) => {
          let tr: Transaction | null = null;
          const { doc, schema } = newState;
          doc.descendants((node, pos) => {
            if (node.isText) {
              const linkRegex = new RegExp(
                `https?:\\/\\/(${getDomainsGroup()})(:\\d+)?\\/[a-zA-Z]\\/[a-zA-Z0-9_-]+`,
                "g",
              );
              let match;
              while ((match = linkRegex.exec(node.text || ""))) {
                const url = match[0];
                const from = pos + match.index;
                const to = from + url.length;
                // remove link mark
                node.marks.forEach((mark) => {
                  if (mark.type === schema.marks.link) {
                    if (!tr) tr = newState.tr;
                    tr.removeMark(from, to, schema.marks.link);
                  }
                });
              }
            }
          });
          return tr;
        },
      }),
    ];
  },
});

export function cleanMentionsHtml(html: string) {
  let cleanedHtml = html;
  cleanedHtml = cleanUserMentionsHtml(cleanedHtml);
  cleanedHtml = cleanGameMentionsHtml(cleanedHtml);
  return cleanedHtml;
}

export default Mentions;
