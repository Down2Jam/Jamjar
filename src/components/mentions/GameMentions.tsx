const gameDomains = ["d2jam.com", "example.com"];
const gameDomainsGroup = gameDomains
  .map((d) => d.replace(/\./g, "\\."))
  .join("|");

const GAME_LINK_REGEX = new RegExp(
  `https?:\\/\\/(${gameDomainsGroup})\\/g\\/([a-zA-Z0-9_-]+)`
);

function extractGameId(text: string): { slug: string; domain: string } | null {
  const match = text.match(GAME_LINK_REGEX);
  if (!match) return null;
  const [, domain, slug] = match;
  return { slug, domain };
}

export function getGameMention(text: string): string | null {
  const result = extractGameId(text);
  return result ? `!${result.slug}@${result.domain}` : null;
}

export function cleanGameMentionsHtml(html: string) {
  const mentionRegex = new RegExp(
    `https?:\\/\\/(${gameDomainsGroup})\\/g\\/([a-zA-Z0-9_-]+)`,
    "g"
  );

  return html.replace(
    mentionRegex,
    (_match, domain: string, slug: string) =>
      `<a href="https://${domain}/g/${slug}">!${slug}@${domain}</a>`
  );
}
