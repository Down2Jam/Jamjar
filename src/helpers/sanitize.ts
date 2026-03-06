import sanitizeHtml from "sanitize-html";

export function sanitize(content: string) {
  return sanitizeHtml(content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "iframe",
      "input",
      "label",
    ]),
    allowedAttributes: {
      img: ["src", "style"],
      input: ["type", "checked", "disabled"],
      label: ["for"],
      iframe: [
        "src",
        "width",
        "height",
        "frameborder",
        "allow",
        "allowfullscreen",
        "autoplay",
        "disablekbcontrols",
        "enableiframeapi",
        "endtime",
        "ivloadpolicy",
        "loop",
        "modestbranding",
        "origin",
        "playlist",
        "start",
      ],
      p: ["style"],
      a: [
        "target",
        "rel",
        "href",
        "class",
        "data-mention-type",
        "data-mention-slug",
        "data-mention-domain",
      ],
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
      iframe: ["http", "https"],
    },
  });
}
