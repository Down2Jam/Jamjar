import { Extension } from '@tiptap/core';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Plugin, EditorState } from 'prosemirror-state';
import { getUserMention, cleanUserMentionsHtml } from "./UserMentions";

const LETTER_REGEX = /https?:\/\/d2jam\.com\/([a-zA-Z])\/([a-zA-Z0-9_-]+)/;

enum MentionType {
    User = 'user',
}

function extractLetter(text: string): string | null {
    const match = text.match(LETTER_REGEX);
    return match ? match[1] : null; 
}

function getMentionType(text: string): MentionType | null {
    const letter = extractLetter(text);
    console.log("Extracted letter:", letter);
    if (letter === 'u') {
        return MentionType.User;
    } 
    return null;
}

function getMentionText(text: string, type: MentionType): string | null {
    if (type === MentionType.User) {
        return getUserMention(text);
    } 
    return null;
}

const Mentions = Extension.create({
    name: 'mentions',
    addProseMirrorPlugins() {
        return [
            new Plugin({
                props: {
                    decorations: (state: EditorState) => {
                        const decorations: Decoration[] = [];
                        const { doc } = state;
                        doc.descendants((node: any, pos: number) => {
                            if (node.isText) {
                                const linkRegex = /https?:\/\/d2jam\.com\/[a-zA-Z]\/[a-zA-Z0-9_-]+/g;
                                let match;
                                while ((match = linkRegex.exec(node.text))) {
                                    const url = match[0];
                                    const type = getMentionType(url);
                                    const mention = type ? getMentionText(url, type) : null;

                                    if (mention && type) {
                                        decorations.push(
                                            Decoration.inline(
                                                pos + match.index,
                                                pos + match.index + url.length,
                                                { class: 'mention-hidden' }
                                            )
                                        );
                                        decorations.push(
                                            Decoration.widget(
                                                pos + match.index,
                                                () => {
                                                    const a = document.createElement('a');
                                                    a.className = `mention mention-${type}`;
                                                    a.href = url;
                                                    a.target = '_blank';
                                                    a.rel = 'noopener noreferrer nofollow';
                                                    a.textContent = mention;
                                                    a.title = mention;
                                                    return a;
                                                },
                                                { side: -1 }
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
        ];
    },
});

export function cleanMentionsHtml(html: string) {
  let cleanedHtml = html;
  cleanedHtml = cleanUserMentionsHtml(cleanedHtml);
  return cleanedHtml;
}

export default Mentions;

