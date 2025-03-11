import sanitizeHtml from "sanitize-html";

export function sanitize(content: string) {
  return sanitizeHtml(content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
    allowedAttributes: {
      img: ["src", "style"],
      p: ["style"],
      a: ["target", "rel", "href"],
    },
    allowedStyles: {
      img: {
        width: [/^\d+(px|%)?|auto$/],
        height: [/^\d+(px|%)?|auto$/],
        margin: [/^\d+(px|%)?|auto$/],
      },
      p: {
        "text-align": [/^right|left|center$/],
      },
    },
    allowedSchemes: ["http", "https"],
    allowedSchemesByTag: {
      img: ["data", "http", "https"],
    },
  });
}
