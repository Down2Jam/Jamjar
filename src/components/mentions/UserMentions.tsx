const getMentionDomainsGroup = () => {
  const host =
    typeof window !== "undefined" ? window.location.hostname : "d2jam.com";
  const domains = [host, "localhost", "127.0.0.1", "example.com", "d2jam.com"];
  return domains.map((domain) => domain.replace(/\./g, "\\.")).join("|");
};

const getUserLinkRegex = () =>
  new RegExp(
    `https?:\\/\\/(${getMentionDomainsGroup()})(:\\d+)?\\/u\\/([a-zA-Z0-9_-]+)`,
  );

const getGameLinkRegex = () =>
  new RegExp(
    `https?:\\/\\/(${getMentionDomainsGroup()})(:\\d+)?\\/g\\/([a-zA-Z0-9_-]+)`,
  );

function extractUsernameAndDomain(
  text: string,
): { username: string; domain: string } | null {
  const match = text.match(getUserLinkRegex());
  return match ? { domain: match[1], username: match[3] } : null;
}

export function getUserMention(text: string): string | null {
  const result = extractUsernameAndDomain(text);
  return result ? `@${result.username}` : null;
}

export function getGameMention(text: string): string | null {
  const match = text.match(getGameLinkRegex());
  return match ? `!${match[3]}` : null;
}

const upgradeMentionAnchor = (
  anchor: HTMLAnchorElement,
  type: "user" | "game",
  slug: string,
  domain?: string,
) => {
  anchor.className = `mention-chip mention-chip--${type}`;
  anchor.dataset.mentionType = type;
  anchor.dataset.mentionSlug = slug;
  if (domain) {
    anchor.dataset.mentionDomain = domain.toLowerCase();
  } else {
    delete anchor.dataset.mentionDomain;
  }
  anchor.textContent = `${type === "user" ? "@" : "!"}${slug}`;
};

const replaceTextMentions = (
  documentNode: Document,
  root: HTMLElement,
  type: "user" | "game",
) => {
  const walker = documentNode.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  const regex = new RegExp(
    `https?:\\/\\/(${getMentionDomainsGroup()})(:\\d+)?\\/${type === "user" ? "u" : "g"}\\/([a-zA-Z0-9_-]+)`,
    "g",
  );

  let current = walker.nextNode();
  while (current) {
    textNodes.push(current as Text);
    current = walker.nextNode();
  }

  for (const textNode of textNodes) {
    const parent = textNode.parentElement;
    if (!parent || parent.closest("a, pre, code")) continue;

    const raw = textNode.textContent ?? "";
    regex.lastIndex = 0;
    let match = regex.exec(raw);
    if (!match) continue;

    const fragment = documentNode.createDocumentFragment();
    let lastIndex = 0;

    while (match) {
      const fullMatch = match[0] ?? "";
      const slug = match[3] ?? "";
      const start = match.index;
      const end = start + fullMatch.length;

      if (start > lastIndex) {
        fragment.appendChild(
          documentNode.createTextNode(raw.slice(lastIndex, start)),
        );
      }

      const anchor = documentNode.createElement("a");
      anchor.href = fullMatch;
      upgradeMentionAnchor(anchor, type, slug, match[1] ?? undefined);
      fragment.appendChild(anchor);

      lastIndex = end;
      match = regex.exec(raw);
    }

    if (lastIndex < raw.length) {
      fragment.appendChild(documentNode.createTextNode(raw.slice(lastIndex)));
    }

    textNode.replaceWith(fragment);
  }
};

const cleanMentionHtml = (html: string, type: "user" | "game") => {
  if (typeof DOMParser === "undefined") return html;

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(
    `<body>${html}</body>`,
    "text/html",
  );
  const root = documentNode.body;
  const anchorRegex = type === "user" ? getUserLinkRegex() : getGameLinkRegex();

  root.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((anchor) => {
    if (anchor.classList.contains("mention-chip")) {
      return;
    }

    const href = anchor.getAttribute("href") ?? "";
    const match = href.match(anchorRegex);
    if (!match) return;

    const slug = match[3] ?? "";
    upgradeMentionAnchor(anchor, type, slug, match[1] ?? undefined);
  });

  replaceTextMentions(documentNode, root, type);

  return root.innerHTML;
};

export function cleanUserMentionsHtml(html: string) {
  return cleanMentionHtml(html, "user");
}

export function cleanGameMentionsHtml(html: string) {
  return cleanMentionHtml(html, "game");
}
