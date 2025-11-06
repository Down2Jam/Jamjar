const userDomains = ["d2jam.com", "example.com"];
const userDomainsGroup = userDomains
  .map((domain) => domain.replace(/\./g, "\\."))
  .join("|");
const USER_LINK_REGEX = new RegExp(
  `https?:\\/\\/(${userDomainsGroup})\\/u\\/([a-zA-Z0-9_-]+)`
);

function extractUsernameAndDomain(
  text: string
): { username: string; domain: string } | null {
  const match = text.match(USER_LINK_REGEX);
  return match ? { domain: match[1], username: match[2] } : null;
}

export function getUserMention(text: string): string | null {
  const result = extractUsernameAndDomain(text);
  return result ? `@${result.username}@${result.domain}` : null;
}

export function cleanUserMentionsHtml(html: string) {
  const userDomainsGroup = userDomains
    .map((domain) => domain.replace(/\./g, "\\."))
    .join("|");
  const mentionRegex = new RegExp(
    `<a([^>]*)href="https://(${userDomainsGroup})/u/([a-zA-Z0-9_-]+)"([^>]*)>https://(${userDomainsGroup})/u/[a-zA-Z0-9_-]+</a>`,
    "g"
  );
  return html.replace(
    mentionRegex,
    (_match, pre, domain, username, post) =>
      `<a${pre}href="https://${domain}/u/${username}"${post}>@${username}@${domain}</a>`
  );
}
