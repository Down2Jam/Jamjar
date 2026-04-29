import type { EmojiType } from "@/providers/useEmojis";

const EMOJI_REGEX = /:([a-zA-Z0-9_-]+):/g;

export function replaceEmojiShortcodes(
  html: string,
  emojiMap: Record<string, EmojiType>
): string {
  if (!html || !emojiMap || Object.keys(emojiMap).length === 0) return html;
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];

  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text);
  }

  nodes.forEach((node) => {
    const text = node.nodeValue;
    if (!text || text.indexOf(":") === -1) return;

    EMOJI_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    let lastIndex = 0;
    const fragment = doc.createDocumentFragment();
    let replaced = false;

    while ((match = EMOJI_REGEX.exec(text))) {
      const slug = match[1];
      const emoji = emojiMap[slug];
      if (!emoji) continue;

      const start = match.index;
      const end = match.index + match[0].length;
      if (start > lastIndex) {
        fragment.append(text.slice(lastIndex, start));
      }

      const img = doc.createElement("img");
      img.src = emoji.image;
      img.alt = `:${slug}:`;
      img.title = `:${slug}:`;
      img.className = "emoji-inline";
      img.setAttribute("data-emoji", slug);
      img.setAttribute("draggable", "false");
      fragment.append(img);

      lastIndex = end;
      replaced = true;
    }

    if (!replaced) return;

    if (lastIndex < text.length) {
      fragment.append(text.slice(lastIndex));
    }

    node.parentNode?.replaceChild(fragment, node);
  });

  return doc.body.innerHTML;
}
