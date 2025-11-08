import { Extension } from "@tiptap/core";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Plugin, EditorState, Transaction } from "prosemirror-state";
import { getUserMention, cleanUserMentionsHtml } from "./UserMentions";
import { getGameMention, cleanGameMentionsHtml } from "./GameMentions";
import { Node as ProseMirrorNode } from "prosemirror-model";

const domains = ["example.com", "d2jam.com"];
const domainsGroup = domains
  .map((domain) => domain.replace(".", "\\."))
  .join("|");
const LETTER_REGEX = new RegExp(
  `https?:\/\/(${domainsGroup})\/([a-zA-Z])\/([a-zA-Z0-9_-]+)`
);

enum MentionType {
  User = "user",
  Game = "game",
}

function extractLetter(text: string): string | null {
  const match = text.match(LETTER_REGEX);
  return match ? match[2] : null;
}

function getMentionType(text: string): MentionType | null {
  const letter = extractLetter(text);
  if (letter === "u") {
    return MentionType.User;
  } else if (letter === "g") {
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
                const linkRegex =
                  /https?:\/\/d2jam\.com\/[a-zA-Z]\/[a-zA-Z0-9_-]+/g;
                let match;
                while ((match = linkRegex.exec(node.text || ""))) {
                  const url = match[0];
                  const type = getMentionType(url);
                  const mention = type ? getMentionText(url, type) : null;

                  if (mention && type) {
                    decorations.push(
                      Decoration.widget(
                        pos + match.index,
                        () => {
                          const a = document.createElement("a");
                          a.className = `mention mention-${type}`;
                          a.href = url;
                          a.target = "_blank";
                          a.rel = "noopener noreferrer nofollow";
                          a.textContent = mention;
                          a.title = mention;
                          return a;
                        },
                        { side: 0, stopEvent: () => true }
                      )
                    );
                    decorations.push(
                      Decoration.inline(
                        pos + match.index,
                        pos + match.index + url.length,
                        {
                          style:
                            "font-size:0;width:0;height:0;display:inline-block;overflow:hidden;",
                        }
                      )
                    );
                  }
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
              const linkRegex =
                /https?:\/\/d2jam\.com\/[a-zA-Z]\/[a-zA-Z0-9_-]+/g;
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
