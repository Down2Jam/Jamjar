import MarkdownIt from "markdown-it";
import markdownItTaskLists from "markdown-it-task-lists";
import { sanitize } from "./sanitize";

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const getMentionBaseUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "https://d2jam.com";
};

const getCurrentMentionDomain = () => {
  if (typeof window !== "undefined") {
    return window.location.hostname.toLowerCase();
  }
  return "d2jam.com";
};

const mentionHrefFromToken = (
  symbol: "@" | "!",
  slug: string,
  domain?: string,
) => {
  const hostname = (domain || getCurrentMentionDomain()).toLowerCase();
  return `https://${hostname}/${symbol === "@" ? "u" : "g"}/${slug}`;
};

const mentionTokenFromUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/^\/(u|g)\/([a-zA-Z0-9_-]+)/);
    if (!match) return url;

    const type = match[1];
    const slug = match[2];
    const hostname = parsed.hostname.toLowerCase();
    const currentHostname = getCurrentMentionDomain();
    const symbol = type === "u" ? "@" : "!";

    if (hostname === currentHostname) {
      return `${symbol}${slug}`;
    }

    return `${symbol}${slug}@${hostname}`;
  } catch {
    return url;
  }
};

const imageMarkdownRegex =
  /!\[([^\]]*)\]\(([^)\s]+)(?:\s*=\s*(\d*)x(\d*))?(?:\s*=\s*(left|center|right))?\)(?:\s*\{align=(left|center|right)\})?/g;
const youtubeMarkdownRegex = /::youtube\[(https?:\/\/[^\]\s]+)\]/g;
const twitchMarkdownRegex = /::twitch\[(https?:\/\/[^\]\s]+)\]/g;
const standaloneLineUrlRegex = /(^|\r?\n)(https?:\/\/[^\s<]+)(?=\r?\n|$)/gm;

const getEmbedHost = () => {
  if (typeof window !== "undefined") {
    return window.location.hostname.toLowerCase();
  }
  return "d2jam.com";
};

const extractYouTubeId = (url: string) => {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      return id || null;
    }
    if (
      hostname.endsWith("youtube.com") ||
      hostname.endsWith("youtube-nocookie.com")
    ) {
      if (parsed.searchParams.get("v")) {
        return parsed.searchParams.get("v");
      }
      const match = parsed.pathname.match(
        /^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/,
      );
      if (match) return match[1];
    }
  } catch {}
  return null;
};

export const toCanonicalYouTubeUrl = (url: string) => {
  const id = extractYouTubeId(url);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
};

export const youtubeEmbedHtml = (url: string) => {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `<div class="embed embed-youtube"><iframe width="320" height="180" src="https://www.youtube-nocookie.com/embed/${id}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
};

type TwitchEmbed =
  | { kind: "video"; value: string }
  | { kind: "channel"; value: string }
  | { kind: "clip"; value: string };

const parseTwitchEmbed = (url: string): TwitchEmbed | null => {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    if (hostname === "clips.twitch.tv") {
      const clip = parsed.pathname.replace(/^\/+/, "").split("/")[0];
      return clip ? { kind: "clip", value: clip } : null;
    }

    if (hostname.endsWith("twitch.tv")) {
      if (hostname === "player.twitch.tv") {
        const video = parsed.searchParams.get("video");
        const channel = parsed.searchParams.get("channel");
        const clip = parsed.searchParams.get("clip");
        if (video) return { kind: "video", value: video.replace(/^v/, "") };
        if (channel) return { kind: "channel", value: channel };
        if (clip) return { kind: "clip", value: clip };
      }

      const videoMatch = parsed.pathname.match(/^\/videos\/(\d+)/);
      if (videoMatch) return { kind: "video", value: videoMatch[1] };

      const clipMatch = parsed.pathname.match(/^\/[^/]+\/clip\/([^/]+)/);
      if (clipMatch) return { kind: "clip", value: clipMatch[1] };

      const channel = parsed.pathname.replace(/^\/+/, "").split("/")[0];
      if (channel) return { kind: "channel", value: channel };
    }
  } catch {}

  return null;
};

export const toCanonicalTwitchUrl = (url: string) => {
  const embed = parseTwitchEmbed(url);
  if (!embed) return null;
  if (embed.kind === "video") {
    return `https://www.twitch.tv/videos/${embed.value}`;
  }
  if (embed.kind === "clip") {
    return `https://clips.twitch.tv/${embed.value}`;
  }
  return `https://www.twitch.tv/${embed.value}`;
};

export const twitchEmbedHtml = (url: string) => {
  const embed = parseTwitchEmbed(url);
  if (!embed) return null;
  const parent = encodeURIComponent(getEmbedHost());
  if (embed.kind === "video") {
    return `<div class="embed embed-twitch"><iframe src="https://player.twitch.tv/?video=v${embed.value}&parent=${parent}&autoplay=false" height="480" width="100%" allowfullscreen frameborder="0"></iframe></div>`;
  }
  if (embed.kind === "clip") {
    return `<div class="embed embed-twitch"><iframe src="https://clips.twitch.tv/embed?clip=${encodeURIComponent(embed.value)}&parent=${parent}&autoplay=false" height="360" width="100%" allowfullscreen frameborder="0"></iframe></div>`;
  }
  return `<div class="embed embed-twitch"><iframe src="https://player.twitch.tv/?channel=${encodeURIComponent(embed.value)}&parent=${parent}&autoplay=false" height="480" width="100%" allowfullscreen frameborder="0"></iframe></div>`;
};

const normalizeLegacyItchEmbedUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.replace(/\/+$/, "");

    if (hostname !== "itch.io") return null;
    if (!/^\/embed(?:-upload)?\/\d+$/.test(pathname)) return null;

    return `https://itch.io${pathname}${parsed.search}`;
  } catch {
    return null;
  }
};

const parsePixelValue = (value: string) => {
  const match = value.match(/([0-9]+(?:\.[0-9]+)?)px/i);
  if (!match) return null;
  const parsed = Number.parseFloat(match[1]);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.max(1, Math.round(parsed));
};

const resolveImageAlignFromStyle = (style: string) => {
  if (typeof document === "undefined") return "left" as const;
  const probe = document.createElement("div");
  probe.style.cssText = style;
  const marginLeft = probe.style.marginLeft.trim().toLowerCase();
  const marginRight = probe.style.marginRight.trim().toLowerCase();
  if (marginLeft === "auto" && marginRight === "auto") {
    return "center" as const;
  }
  if (
    marginLeft === "auto" &&
    (marginRight === "0" || marginRight === "0px" || marginRight === "")
  ) {
    return "right" as const;
  }
  if (
    marginRight === "auto" &&
    (marginLeft === "0" || marginLeft === "0px" || marginLeft === "")
  ) {
    return "left" as const;
  }
  const normalized = style.replace(/\s+/g, " ").toLowerCase();
  if (
    /margin:\s*0\s+auto\s*;?/.test(normalized) ||
    (/margin-left:\s*auto/.test(normalized) &&
      /margin-right:\s*auto/.test(normalized))
  ) {
    return "center" as const;
  }
  if (
    /margin:\s*0\s+0\s+0\s+auto\s*;?/.test(normalized) ||
    (/margin-left:\s*auto/.test(normalized) &&
      /margin-right:\s*0/.test(normalized))
  ) {
    return "right" as const;
  }
  return "left" as const;
};

const buildImageStyle = (
  width?: number | null,
  height?: number | null,
  align: "left" | "center" | "right" = "left",
) => {
  const parts = [
    width ? `width: ${width}px` : null,
    height ? `height: ${height}px` : "height: auto",
    "cursor: pointer",
    align === "center"
      ? "margin: 0 auto"
      : align === "right"
        ? "margin: 0 0 0 auto"
        : "margin: 0 auto 0 0",
  ].filter(Boolean) as string[];
  return `${parts.join("; ")};`;
};

const toImageMarkdown = (
  src: string,
  alt: string,
  width?: number | null,
  height?: number | null,
  align: "left" | "center" | "right" = "left",
) => {
  const cleanSrc = src.trim();
  if (!cleanSrc) return "";
  const cleanAlt = alt.replace(/\]/g, "\\]");
  const hasSize = Boolean(width || height);
  const size = hasSize ? ` =${width ?? ""}x${height ?? ""}` : "";
  const alignPart = align === "left" ? "" : ` =${align}`;
  return `![${cleanAlt}](${cleanSrc}${size}${alignPart})`;
};

const markdown = new MarkdownIt({
  html: true,
  linkify: false,
  breaks: true,
});

markdown.use(markdownItTaskLists, {
  enabled: true,
  label: true,
  labelAfter: true,
});

export const isHtmlContent = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);

const expandEmbedMarkdownTokens = (value: string) =>
  value
    .replace(youtubeMarkdownRegex, (_match, url: string) => {
      const embed = youtubeEmbedHtml(url);
      return embed ?? _match;
    })
    .replace(twitchMarkdownRegex, (_match, url: string) => {
      const embed = twitchEmbedHtml(url);
      return embed ?? _match;
    })
    .replace(/::itch\[(https?:\/\/[^\]\s]+)\]/gi, "$1")
    .replace(standaloneLineUrlRegex, (match, prefix: string, url: string) => {
      const youtubeUrl = toCanonicalYouTubeUrl(url);
      if (youtubeUrl) {
        const embed = youtubeEmbedHtml(youtubeUrl);
        return embed ? `${prefix}${embed}` : match;
      }

      const twitchUrl = toCanonicalTwitchUrl(url);
      if (twitchUrl) {
        const embed = twitchEmbedHtml(twitchUrl);
        return embed ? `${prefix}${embed}` : match;
      }

      const safeUrl = escapeHtml(url);
      return `${prefix}<a href="${safeUrl}" target="_blank" rel="noopener noreferrer nofollow">${safeUrl}</a>`;
    });

const preprocessMarkdown = (value: string) =>
  expandEmbedMarkdownTokens(value)
    .replace(
      /^\[(center|right)\][ \t]*(.*)$/gm,
      (_match, align: "center" | "right", content: string) =>
        `<p style="text-align: ${align}">${content}</p>`,
    )
    .replace(
      imageMarkdownRegex,
      (
        _match,
        rawAlt,
        rawSrc,
        rawWidth,
        rawHeight,
        rawInlineAlign,
        rawLegacyAlign,
      ) => {
        const alt = String(rawAlt ?? "");
        const src = String(rawSrc ?? "");
        const width =
          typeof rawWidth === "string" && rawWidth.trim()
            ? Number.parseInt(rawWidth, 10)
            : null;
        const height =
          typeof rawHeight === "string" && rawHeight.trim()
            ? Number.parseInt(rawHeight, 10)
            : null;
        const rawAlign = rawInlineAlign || rawLegacyAlign;
        const align =
          rawAlign === "center" || rawAlign === "right" ? rawAlign : "left";
        const safeAlt = escapeHtml(alt);
        const safeSrc = escapeHtml(src);
        const style = escapeHtml(buildImageStyle(width, height, align));
        return `<img src="${safeSrc}" alt="${safeAlt}" style="${style}" />`;
      },
    )
    .replace(/==([^\n]+?)==/g, "<mark>$1</mark>")
    .replace(/\^\{([^{}]+)\}/g, "<sup>$1</sup>")
    .replace(/_\{([^{}]+)\}/g, "<sub>$1</sub>");

export const markdownToEditorContent = (value: string) =>
  preprocessMarkdown(value);

const repairQuotedParagraphs = (html: string) => {
  if (!html.includes("&gt;")) return html;

  if (typeof DOMParser !== "undefined") {
    const parser = new DOMParser();
    const documentNode = parser.parseFromString(`<body>${html}</body>`, "text/html");
    const body = documentNode.body;
    const children = Array.from(body.childNodes);

    children.forEach((node) => {
      if (!(node instanceof HTMLElement) || node.tagName.toLowerCase() !== "p") {
        return;
      }

      const text = node.textContent?.trim() ?? "";
      if (!text.startsWith(">")) {
        return;
      }

      const blockquote = documentNode.createElement("blockquote");
      const paragraph = documentNode.createElement("p");
      paragraph.innerHTML = node.innerHTML.replace(/^&gt;\s?/, "");
      blockquote.appendChild(paragraph);
      node.replaceWith(blockquote);
    });

    return body.innerHTML;
  }

  return html.replace(
    /<p>&gt;\s*([\s\S]*?)<\/p>/g,
    "<blockquote><p>$1</p></blockquote>",
  );
};

const decorateMentionTokensInHtml = (html: string) => {
  if (typeof DOMParser === "undefined") return html;

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(`<body>${html}</body>`, "text/html");
  const walker = documentNode.createTreeWalker(documentNode.body, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  let current = walker.nextNode();
  while (current) {
    textNodes.push(current as Text);
    current = walker.nextNode();
  }

  for (const textNode of textNodes) {
    const parent = textNode.parentElement;
    if (!parent || parent.closest("a, pre, code")) continue;

    const raw = textNode.textContent ?? "";
    if (!raw.includes("@") && !raw.includes("!")) continue;

    const fragment = documentNode.createDocumentFragment();
    let lastIndex = 0;
    const regex =
      /(^|[^\w/])([@!])([a-zA-Z0-9_-]+)(?:@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}))?/g;
    let match = regex.exec(raw);

    while (match) {
      const fullMatch = match[0] ?? "";
      const prefix = match[1] ?? "";
      const symbol = match[2] ?? "";
      const slug = match[3] ?? "";
      const domain = match[4] ?? "";
      const start = match.index;
      const end = start + fullMatch.length;

      if (start > lastIndex) {
        fragment.appendChild(
          documentNode.createTextNode(raw.slice(lastIndex, start)),
        );
      }

      if (prefix) {
        fragment.appendChild(documentNode.createTextNode(prefix));
      }

      const anchor = documentNode.createElement("a");
      anchor.href = mentionHrefFromToken(
        symbol as "@" | "!",
        slug,
        domain || undefined,
      );
      anchor.className = `mention-chip mention-chip--${symbol === "@" ? "user" : "game"}`;
      anchor.setAttribute("data-mention-type", symbol === "@" ? "user" : "game");
      anchor.setAttribute("data-mention-slug", slug);
      if (domain) {
        anchor.setAttribute("data-mention-domain", domain.toLowerCase());
      }
      anchor.textContent = `${symbol}${slug}`;
      fragment.appendChild(anchor);

      lastIndex = end;
      match = regex.exec(raw);
    }

    if (lastIndex === 0) continue;

    if (lastIndex < raw.length) {
      fragment.appendChild(
        documentNode.createTextNode(raw.slice(lastIndex)),
      );
    }

    textNode.replaceWith(fragment);
  }

  return documentNode.body.innerHTML;
};

export const renderRichTextToHtml = (value: string) => {
  if (!value) return "";
  const content = expandEmbedMarkdownTokens(value);
  if (isHtmlContent(value)) {
    return sanitize(decorateMentionTokensInHtml(content));
  }
  return sanitize(
    decorateMentionTokensInHtml(
      repairQuotedParagraphs(markdown.render(preprocessMarkdown(content))),
    ),
  );
};

export const injectImageMetadataIntoMarkdown = (value: string, html: string) => {
  if (!value.includes("![")) return value;
  if (typeof DOMParser === "undefined") return value;
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(html, "text/html");
  const images = Array.from(documentNode.querySelectorAll("img"));
  if (images.length === 0) return value;
  const snippets = images
    .map((image) => {
      const src = image.getAttribute("src") ?? "";
      const alt = image.getAttribute("alt") ?? "";
      const style = image.getAttribute("style") ?? "";
      const width =
        parsePixelValue(style.match(/width\s*:\s*[^;]+/i)?.[0] ?? "") ??
        (() => {
          const raw = Number.parseInt(image.getAttribute("width") ?? "", 10);
          return Number.isFinite(raw) && raw > 0 ? raw : null;
        })();
      const height =
        parsePixelValue(style.match(/height\s*:\s*[^;]+/i)?.[0] ?? "") ??
        (() => {
          const raw = Number.parseInt(image.getAttribute("height") ?? "", 10);
          return Number.isFinite(raw) && raw > 0 ? raw : null;
        })();
      const align = resolveImageAlignFromStyle(style);
      return toImageMarkdown(src, alt, width, height, align);
    })
    .filter(Boolean);
  if (snippets.length === 0) return value;
  let index = 0;
  return value.replace(
    /!\[[^\]]*\]\([^)]+\)(?:\s*\{align=(?:left|center|right)\})?/g,
    (match) => {
      const next = snippets[index];
      index += 1;
      return next || match;
    },
  );
};

const inlineHtmlToMarkdown = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const element = node as HTMLElement;
  const inner = Array.from(element.childNodes).map(inlineHtmlToMarkdown).join("");
  const tag = element.tagName.toLowerCase();

  if (tag === "strong" || tag === "b") return `**${inner}**`;
  if (tag === "em" || tag === "i") return `*${inner}*`;
  if (tag === "mark") return `==${inner}==`;
  if (tag === "sup") return `^{${inner}}`;
  if (tag === "sub") return `_{${inner}}`;
  if (tag === "s" || tag === "strike" || tag === "del") return `~~${inner}~~`;
  if (tag === "code") return `\`${inner}\``;
  if (tag === "br") return "\\\n";

  return inner;
};

const getMentionDomainsGroup = () => {
  const host =
    typeof window !== "undefined" ? window.location.hostname : "d2jam.com";
  const domains = [host, "localhost", "127.0.0.1", "example.com", "d2jam.com"];
  return domains.map((domain) => domain.replace(/\./g, "\\.")).join("|");
};

const normalizeMentionLinksInMarkdown = (value: string) => {
  const domainGroup = getMentionDomainsGroup();

  return value
    .replace(
      new RegExp(
        `\\[[^\\]]*\\]\\(((https?:\\/\\/(${domainGroup})(:\\d+)?\\/(u|g)\\/[a-zA-Z0-9_-]+)(?:\\s+"[^"]*")?)\\)`,
        "g",
      ),
      (_match, _fullTarget, url: string) => mentionTokenFromUrl(url),
    )
    .replace(
      new RegExp(
        `<a[^>]*href="(https?:\\/\\/(${domainGroup})(:\\d+)?\\/(u|g)\\/[a-zA-Z0-9_-]+)"[^>]*>[\\s\\S]*?<\\/a>`,
        "g",
      ),
      (_match, url: string) => mentionTokenFromUrl(url),
    )
    .replace(
      new RegExp(
        `https?:\\/\\/(${domainGroup})(:\\d+)?\\/u\\/([a-zA-Z0-9_-]+)`,
        "g",
      ),
      (_match, domain: string, _port: string, slug: string) =>
        mentionTokenFromUrl(`https://${domain}/u/${slug}`),
    )
    .replace(
      new RegExp(
        `https?:\\/\\/(${domainGroup})(:\\d+)?\\/g\\/([a-zA-Z0-9_-]+)`,
        "g",
      ),
      (_match, domain: string, _port: string, slug: string) =>
        mentionTokenFromUrl(`https://${domain}/g/${slug}`),
    );
};

const normalizeHtmlAnchorsToMarkdown = (value: string) =>
  value.replace(
    /<a\b[^>]*href=(["'])(https?:\/\/[^"']+)\1[^>]*>([\s\S]*?)<\/a>/gi,
    (_match, _quote, href: string, inner: string) => {
      const text = String(inner)
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();

      if (!text || text === href) {
        return href;
      }

      const escapedText = text.replace(/([\[\]])/g, "\\$1");
      return `[${escapedText}](${href})`;
    },
  );

const normalizeHtmlImagesToMarkdown = (value: string) => {
  if (typeof DOMParser !== "undefined") {
    const parser = new DOMParser();
    const documentNode = parser.parseFromString(`<body>${value}</body>`, "text/html");
    const images = Array.from(documentNode.body.querySelectorAll("img"));

    images.forEach((image) => {
      const src = image.getAttribute("src") ?? "";
      if (!src) return;

      const alt = image.getAttribute("alt") ?? "";
      const style = image.getAttribute("style") ?? "";
      const containerStyle = image.getAttribute("containerstyle") ?? "";
      const wrapperStyle = image.getAttribute("wrapperstyle") ?? "";
      const mergedStyle = [style, containerStyle, wrapperStyle]
        .filter(Boolean)
        .join("; ");

      const widthAttr = Number.parseInt(image.getAttribute("width") ?? "", 10);
      const heightAttr = Number.parseInt(image.getAttribute("height") ?? "", 10);
      const width =
        (Number.isFinite(widthAttr) && widthAttr > 0 ? widthAttr : null) ??
        parsePixelValue(style.match(/width\s*:\s*[^;]+/i)?.[0] ?? "") ??
        parsePixelValue(containerStyle.match(/width\s*:\s*[^;]+/i)?.[0] ?? "");
      const height =
        (Number.isFinite(heightAttr) && heightAttr > 0 ? heightAttr : null) ??
        parsePixelValue(style.match(/height\s*:\s*[^;]+/i)?.[0] ?? "") ??
        parsePixelValue(containerStyle.match(/height\s*:\s*[^;]+/i)?.[0] ?? "");
      const align = resolveImageAlignFromStyle(mergedStyle);
      const markdown = toImageMarkdown(src, alt, width, height, align);

      image.replaceWith(documentNode.createTextNode(markdown));
    });

    return documentNode.body.innerHTML;
  }

  return value.replace(
    /<img\b([^>]*?)src=(["'])(.*?)\2([^>]*)>/gi,
    (_match, before: string, _quote: string, src: string, after: string) => {
      const attrs = `${before} ${after}`;
      const alt = attrs.match(/\balt=(["'])(.*?)\1/i)?.[2] ?? "";
      const style = attrs.match(/\bstyle=(["'])(.*?)\1/i)?.[2] ?? "";
      const containerStyle =
        attrs.match(/\bcontainerstyle=(["'])(.*?)\1/i)?.[2] ?? "";
      const wrapperStyle =
        attrs.match(/\bwrapperstyle=(["'])(.*?)\1/i)?.[2] ?? "";
      const widthAttr = Number.parseInt(
        attrs.match(/\bwidth=(["']?)(\d+)\1/i)?.[2] ?? "",
        10,
      );
      const heightAttr = Number.parseInt(
        attrs.match(/\bheight=(["']?)(\d+)\1/i)?.[2] ?? "",
        10,
      );
      const width = Number.isFinite(widthAttr) && widthAttr > 0 ? widthAttr : null;
      const height =
        Number.isFinite(heightAttr) && heightAttr > 0 ? heightAttr : null;
      const align = resolveImageAlignFromStyle(
        [style, containerStyle, wrapperStyle].filter(Boolean).join("; "),
      );
      return toImageMarkdown(src, alt, width, height, align);
    },
  );
};

const normalizeAngleBracketLinks = (value: string) =>
  value.replace(/<((?:https?:\/\/)[^<>\s]+)>/gi, "$1");

const normalizeMalformedProtocolTags = (value: string) =>
  value.replace(
    /<https:\s+([^=\s>]+(?:="")?(?:\s+[^=\s>]+(?:="")?)*)><\/https:>/gi,
    (_match, rawPath: string) =>
      `https://${rawPath.replace(/=""/g, "").replace(/\s+/g, "/")}`,
  );

const normalizeDirectEmbedLinksInMarkdown = (value: string) =>
  value
    .replace(
      /<a[^>]*href="(https?:\/\/[^"]+)"[^>]*>[\s\S]*?<\/a>/gi,
      (match, url: string) => {
        const youtubeUrl = toCanonicalYouTubeUrl(url);
        if (youtubeUrl) return youtubeUrl;

        const twitchUrl = toCanonicalTwitchUrl(url);
        if (twitchUrl) return twitchUrl;

        return match;
      },
    )
    .replace(
      /^\s*\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)\s*$/gm,
      (match, _label: string, url: string) => {
        const youtubeUrl = toCanonicalYouTubeUrl(url);
        if (youtubeUrl) return youtubeUrl;

        const twitchUrl = toCanonicalTwitchUrl(url);
        if (twitchUrl) return twitchUrl;

        return match;
      },
    )
    .replace(/^\s*(https?:\/\/\S+)\s*$/gm, (match, url: string) => {
      const youtubeUrl = toCanonicalYouTubeUrl(url);
      if (youtubeUrl) return youtubeUrl;

      const twitchUrl = toCanonicalTwitchUrl(url);
      if (twitchUrl) return twitchUrl;

      return match;
    });

export const injectAlignmentMetadataIntoMarkdown = (
  value: string,
  html: string,
) => {
  if (typeof DOMParser === "undefined") return value;

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(html, "text/html");
  const alignedBlocks = Array.from(
    documentNode.querySelectorAll<HTMLElement>(
      "p[style*='text-align'], h1[style*='text-align'], h2[style*='text-align'], h3[style*='text-align'], h4[style*='text-align'], h5[style*='text-align'], h6[style*='text-align'], div[style*='text-align']",
    ),
  )
    .map((node) => {
      const style = node.getAttribute("style") ?? "";
      const match = style.match(/text-align\s*:\s*(center|right)/i);
      if (!match) return null;
      const align = match[1].toLowerCase() as "center" | "right";
      const content = Array.from(node.childNodes).map(inlineHtmlToMarkdown).join("").trim();
      if (!content) return null;
      return { align, content };
    })
    .filter(Boolean) as Array<{ align: "center" | "right"; content: string }>;

  if (alignedBlocks.length === 0) return value;

  const lines = value.split("\n");
  const used = new Set<number>();

  alignedBlocks.forEach(({ align, content }) => {
    const lineIndex = lines.findIndex(
      (line, index) => !used.has(index) && line.trim() === content,
    );
    if (lineIndex === -1) return;
    lines[lineIndex] = `[${align}] ${content}`;
    used.add(lineIndex);
  });

  return lines.join("\n");
};

export const injectBlockquoteMetadataIntoMarkdown = (
  value: string,
  html: string,
) => {
  if (typeof DOMParser === "undefined") return value;

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(html, "text/html");
  const blockquotes = Array.from(documentNode.querySelectorAll("blockquote"));

  if (blockquotes.length === 0) return value;

  const quotes = blockquotes
    .map((blockquote) => {
      const blocks = Array.from(blockquote.childNodes)
        .map((node) => {
          const text = inlineHtmlToMarkdown(node).trim();
          return text;
        })
        .filter(Boolean);

      if (blocks.length === 0) return null;

      return blocks
        .flatMap((block) => block.split("\n"))
        .map((line) => `> ${line}`)
        .join("\n");
    })
    .filter(Boolean) as string[];

  if (quotes.length === 0) return value;

  let nextQuoteIndex = 0;

  return value.replace(/(^|\n)([^\n][\s\S]*?)(?=\n{2,}|$)/g, (match, prefix, block) => {
    const normalizedBlock = String(block).trim();
    const quote = quotes[nextQuoteIndex];

    if (!quote) return match;
    if (normalizedBlock !== quote.replace(/^>\s?/gm, "").trim()) return match;

    nextQuoteIndex += 1;
    return `${prefix}${quote}`;
  });
};

const serializeAlignedBlocks = (value: string) => {
  if (typeof DOMParser !== "undefined") {
    const parser = new DOMParser();
    const documentNode = parser.parseFromString(`<body>${value}</body>`, "text/html");
    const alignedBlocks = Array.from(
      documentNode.querySelectorAll<HTMLElement>("[style*='text-align']"),
    );

    alignedBlocks.forEach((node) => {
      const style = node.getAttribute("style") ?? "";
      const match = style.match(/text-align\s*:\s*(center|right)/i);
      if (!match) return;
      const align = match[1].toLowerCase();
      const inner = node.innerHTML.trim();
      const replacement = documentNode.createTextNode(
        inner ? `[${align}] ${inner}` : `[${align}]`,
      );
      node.replaceWith(replacement);
    });

    return documentNode.body.innerHTML;
  }

  return value.replace(
    /<(p|div|h[1-6])([^>]*)style="[^"]*text-align:\s*(center|right)[^"]*"[^>]*>([\s\S]*?)<\/\1>/gi,
    (_match, _tag, _attrs, align: string, inner: string) =>
      inner.trim() ? `[${align.toLowerCase()}] ${inner}` : `[${align.toLowerCase()}]`,
  );
};

const normalizeVideoEmbedsInMarkdown = (value: string) =>
  value
    .replace(
      /<iframe\b[^>]*\bsrc=(["'])(.*?)\1[^>]*>\s*<\/iframe>/gi,
      (match, _quote, src: string) => {
        const youtubeUrl = toCanonicalYouTubeUrl(src);
        if (youtubeUrl) return youtubeUrl;

        const twitchUrl = toCanonicalTwitchUrl(src);
        if (twitchUrl) return twitchUrl;

        const itchUrl = normalizeLegacyItchEmbedUrl(src);
        if (itchUrl) return itchUrl;

        return match;
      },
    )
    .replace(
      /<div[^>]*data-youtube-video[^>]*>\s*((?:https?:\/\/[^\s<]+)|(?:::youtube\[[^\]]+\])|(?:<iframe[\s\S]*?<\/iframe>))\s*<\/div>/gi,
      (_match, inner: string) => inner,
    )
    .replace(
      /<div[^>]*data-twitch(?:-embed)?[^>]*>\s*((?:https?:\/\/[^\s<]+)|(?:::twitch\[[^\]]+\])|(?:<iframe[\s\S]*?<\/iframe>))\s*<\/div>/gi,
      (_match, inner: string) => inner,
    )
    .replace(
      /<div[^>]*data-itch-embed[^>]*>\s*((?:https?:\/\/[^\s<]+)|(?:::itch\[[^\]]+\])|(?:<iframe[\s\S]*?<\/iframe>))\s*<\/div>/gi,
      (_match, inner: string) => inner,
    )
    .replace(
      /<div[^>]*class=(["'])[^"']*\bembed-(youtube|twitch)\b[^"']*\1[^>]*>\s*((?:https?:\/\/[^\s<]+)|(?:::(?:youtube|twitch)\[[^\]]+\]))\s*<\/div>/gi,
      (_match, _quote, _type, token: string) => token,
    )
    .replace(
      /<div[^>]*class=(["'])[^"']*\bembed-itch\b[^"']*\1[^>]*>\s*((?:https?:\/\/[^\s<]+)|(?:::itch\[[^\]]+\])|(?:<iframe[\s\S]*?<\/iframe>))\s*<\/div>/gi,
      (_match, _quote, token: string) => token,
    )
    .replace(/::itch\[(https?:\/\/[^\]\s]+)\]/gi, "$1");

export const editorContentToMarkdown = (value: string) =>
  normalizeVideoEmbedsInMarkdown(
    normalizeDirectEmbedLinksInMarkdown(
      normalizeAngleBracketLinks(
        normalizeHtmlImagesToMarkdown(
          normalizeHtmlAnchorsToMarkdown(
          normalizeMentionLinksInMarkdown(
            serializeAlignedBlocks(
              normalizeMalformedProtocolTags(normalizeAngleBracketLinks(value)),
            ),
          ),
          ),
        ),
      ),
    ),
  )
    .replace(/^(\|[^\n]*\|)\\$/gm, "$1")
    .replace(/<mark>([\s\S]*?)<\/mark>/g, "==$1==")
    .replace(/<sup>([\s\S]*?)<\/sup>/g, "^{$1}")
    .replace(/<sub>([\s\S]*?)<\/sub>/g, "_{$1}");
