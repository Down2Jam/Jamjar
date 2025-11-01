const USER_LINK_REGEX = /https?:\/\/d2jam\.com\/u\/([a-zA-Z0-9_-]+)/;

function extractUsername(text: string): string | null {
    const match = text.match(USER_LINK_REGEX);
    return match ? match[1] : null;
}

export function getUserMention(text: string): string | null {
    const username = extractUsername(text);
    console.log("Extracted username:", username);
    return username ? `@${username}@d2jam.com` : null;
}

export function cleanUserMentionsHtml(html: string) {
  return html.replace(
    /<a([^>]*)href="https:\/\/d2jam\.com\/u\/([a-zA-Z0-9_-]+)"([^>]*)>https:\/\/d2jam\.com\/u\/[a-zA-Z0-9_-]+<\/a>/g,
    (_match, pre, username, post) =>
      `<a${pre}href="https://d2jam.com/u/${username}"${post}>@${username}@d2jam.com</a>`
    );  
}
 