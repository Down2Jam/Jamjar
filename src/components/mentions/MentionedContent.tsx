"use client";

import {
  createElement,
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTheme } from "@/providers/SiteThemeProvider";
import { BASE_URL } from "@/requests/config";
import useEmojiContent from "@/hooks/useEmojiContent";
import { cleanMentionsHtml } from "./Mentions";
import { renderRichTextToHtml } from "@/helpers/richText";

type MentionedContentProps = {
  html?: string;
  content?: string;
  className?: string;
};

type UserMentionData = {
  name?: string | null;
  slug: string;
  profilePicture?: string | null;
  short?: string | null;
};

type GameMentionData = {
  name?: string | null;
  slug: string;
  thumbnail?: string | null;
  short?: string | null;
  tags?: Array<{ name?: string | null }> | null;
  flags?: Array<{ name?: string | null }> | null;
  category?: string | null;
  author?: {
    slug: string;
    name?: string | null;
    profilePicture?: string | null;
  } | null;
};

const getCurrentHostname = () =>
  typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "d2jam.com";

const getMentionApiBaseUrl = (domain?: string) => {
  const normalizedDomain = (domain || getCurrentHostname()).toLowerCase();
  if (normalizedDomain === getCurrentHostname()) {
    return BASE_URL;
  }
  return `https://${normalizedDomain}/api/v1`;
};

const isCrossDomainMention = (domain?: string) =>
  Boolean(domain && domain.toLowerCase() !== getCurrentHostname());

const userCache = new Map<string, UserMentionData>();
const gameCache = new Map<string, GameMentionData>();
const pending = new Map<
  string,
  Promise<UserMentionData | GameMentionData | null>
>();
const popoverMap = new WeakMap<HTMLAnchorElement, HTMLDivElement>();

const FALLBACK_IMAGE = "/images/D2J_Icon.png";

const applyChipStyles = (
  el: HTMLAnchorElement,
  colors: Record<string, string>
) => {
  el.style.display = "inline-flex";
  el.style.alignItems = "center";
  el.style.gap = "6px";
  el.style.padding = "2px 8px";
  el.style.borderRadius = "999px";
  el.style.border = `1px solid ${colors.base}`;
  el.style.backgroundColor = colors.crust;
  el.style.color = colors.text;
  el.style.textDecoration = "none";
  el.style.fontSize = "0.85em";
  el.style.lineHeight = "1.2";
  el.style.verticalAlign = "middle";
  el.style.transform = "translateY(1px)";
};

const renderChip = (
  el: HTMLAnchorElement,
  type: "user" | "game",
  data: UserMentionData | GameMentionData,
  colors: Record<string, string>
) => {
  applyChipStyles(el, colors);
  el.dataset.mentionReady = "true";
  el.innerHTML = "";

  const img = document.createElement("img");
  img.src =
    type === "user"
      ? (data as UserMentionData).profilePicture || FALLBACK_IMAGE
      : (data as GameMentionData).thumbnail || FALLBACK_IMAGE;
  img.alt = type === "user" ? "User avatar" : "Game thumbnail";
  img.width = 18;
  img.height = 18;
  img.style.width = "18px";
  img.style.height = "18px";
  img.style.objectFit = "cover";
  img.style.borderRadius = type === "user" ? "999px" : "6px";
  img.setAttribute("loading", "lazy");
  img.setAttribute("decoding", "async");

  const label = document.createElement("span");
  label.textContent =
    (type === "user"
      ? (data as UserMentionData).name
      : (data as GameMentionData).name) || data.slug;

  el.appendChild(img);
  el.appendChild(label);
};

const createPopover = (
  type: "user" | "game",
  data: UserMentionData | GameMentionData,
  colors: Record<string, string>
) => {
  const popover = document.createElement("div");
  popover.style.position = "fixed";
  popover.style.zIndex = "70";
  popover.style.backgroundColor = colors.mantle;
  popover.style.border = `1px solid ${colors.base}`;
  popover.style.borderRadius = "10px";
  popover.style.boxShadow =
    "0 10px 15px -3px rgba(0,0,0,0.2), 0 4px 6px -4px rgba(0,0,0,0.2)";
  popover.style.padding = "10px";
  popover.style.pointerEvents = "none";
  popover.style.minWidth = "220px";
  popover.style.maxWidth = "320px";
  popover.style.color = colors.text;

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.gap = "8px";

  const img = document.createElement("img");
  img.src =
    type === "user"
      ? (data as UserMentionData).profilePicture || FALLBACK_IMAGE
      : (data as GameMentionData).thumbnail || FALLBACK_IMAGE;
  img.alt = type === "user" ? "User avatar" : "Game thumbnail";
  img.width = 32;
  img.height = 32;
  img.style.width = "32px";
  img.style.height = "32px";
  img.style.objectFit = "cover";
  img.style.borderRadius = type === "user" ? "999px" : "8px";
  img.setAttribute("loading", "lazy");
  img.setAttribute("decoding", "async");

  const titleWrap = document.createElement("div");
  const title = document.createElement("div");
  title.textContent = (data as UserMentionData).name || data.slug;
  title.style.fontWeight = "600";
  title.style.fontSize = "0.95rem";

  const subtitle = document.createElement("div");
  subtitle.textContent = `${type === "user" ? "@" : "!"}${data.slug}`;
  subtitle.style.fontSize = "0.8rem";
  subtitle.style.opacity = "0.7";

  titleWrap.appendChild(title);
  titleWrap.appendChild(subtitle);
  header.appendChild(img);
  header.appendChild(titleWrap);
  popover.appendChild(header);

  const short =
    type === "user"
      ? (data as UserMentionData).short
      : (data as GameMentionData).short;
  if (short) {
    const shortEl = document.createElement("div");
    shortEl.textContent = short;
    shortEl.style.marginTop = "6px";
    shortEl.style.fontSize = "0.85rem";
    shortEl.style.opacity = "0.85";
    popover.appendChild(shortEl);
  }

  if (type === "game") {
    const gameData = data as GameMentionData;
    const info = document.createElement("div");
    info.style.display = "flex";
    info.style.flexDirection = "column";
    info.style.gap = "4px";
    info.style.marginTop = "8px";
    info.style.fontSize = "0.8rem";

    const addRow = (label: string, value?: string | null) => {
      if (!value) return;
      const row = document.createElement("div");
      row.innerHTML = `<span style="opacity:0.7">${label}:</span> ${value}`;
      info.appendChild(row);
    };

    addRow("Category", gameData.category ?? undefined);
    if (gameData.author) {
      addRow(
        "Author",
        `${gameData.author.name ?? gameData.author.slug}`
      );
    }
    const tagsText = (gameData.tags ?? [])
      .map((tag) => tag?.name)
      .filter(Boolean)
      .join(", ");
    addRow("Tags", tagsText || undefined);

    const flagsText = (gameData.flags ?? [])
      .map((flag) => flag?.name)
      .filter(Boolean)
      .join(", ");
    addRow("Flags", flagsText || undefined);

    if (info.childNodes.length > 0) {
      popover.appendChild(info);
    }
  }

  return popover;
};

const positionPopover = (anchor: HTMLAnchorElement, popover: HTMLDivElement) => {
  const rect = anchor.getBoundingClientRect();
  const offset = 8;
  const width = popover.offsetWidth;
  const height = popover.offsetHeight;
  let left = rect.left;
  let top = rect.bottom + offset;

  if (left + width > window.innerWidth - offset) {
    left = window.innerWidth - width - offset;
  }
  if (left < offset) left = offset;
  if (top + height > window.innerHeight - offset) {
    top = rect.top - height - offset;
  }
  if (top < offset) top = offset;

  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
};

const showPopoverForAnchor = (
  anchor: HTMLAnchorElement,
  type: "user" | "game",
  data: UserMentionData | GameMentionData,
  colors: Record<string, string>
) => {
  let popover = popoverMap.get(anchor);
  if (popover) {
    popover.remove();
    popoverMap.delete(anchor);
  }
  popover = createPopover(type, data, colors);
  popoverMap.set(anchor, popover);
  document.body.appendChild(popover);
  positionPopover(anchor, popover);
  requestAnimationFrame(() => positionPopover(anchor, popover));
};

const hidePopoverForAnchor = (anchor: HTMLAnchorElement) => {
  const popover = popoverMap.get(anchor);
  if (!popover) return;
  popover.remove();
  popoverMap.delete(anchor);
};

const fetchUser = async (slug: string, domain?: string) => {
  if (isCrossDomainMention(domain)) {
    return null;
  }
  const response = await fetch(
    `${getMentionApiBaseUrl(domain)}/user?targetUserSlug=${encodeURIComponent(slug)}`,
    {
      credentials: "include",
    }
  );
  if (!response.ok) return null;
  const data = await response.json();
  return data?.data ?? null;
};

const fetchGame = async (slug: string, domain?: string) => {
  if (isCrossDomainMention(domain)) {
    return null;
  }
  const response = await fetch(
    `${getMentionApiBaseUrl(domain)}/games/${encodeURIComponent(slug)}`,
    {
      credentials: "include",
    }
  );
  if (!response.ok) return null;
  return await response.json();
};

const loadMentionData = async (
  type: "user" | "game",
  slug: string,
  domain?: string,
) => {
  const normalizedDomain = (domain || getCurrentHostname()).toLowerCase();
  const cacheKey = `${type}:${slug}@${normalizedDomain}`;
  const cached =
    type === "user" ? userCache.get(cacheKey) : gameCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const existing = pending.get(cacheKey);
  if (existing) {
    return existing;
  }

  const request = (type === "user" ? fetchUser(slug, domain) : fetchGame(slug, domain))
    .then((data) => {
      if (!data) return null;
      const mapped =
        type === "user"
          ? ({
              slug,
              name: data.name ?? slug,
              profilePicture: data.profilePicture ?? null,
              short: data.short ?? null,
            } as UserMentionData)
          : ({
              slug,
              name: data.name ?? slug,
              thumbnail: data.thumbnail ?? null,
              short: data.short ?? null,
              tags: data.tags ?? null,
              flags: data.flags ?? null,
              category: data.category ?? null,
              author: data.team?.owner
                ? {
                    slug: data.team.owner.slug,
                    name: data.team.owner.name ?? null,
                    profilePicture: data.team.owner.profilePicture ?? null,
                  }
                : null,
            } as GameMentionData);

      if (type === "user") {
        userCache.set(cacheKey, mapped as UserMentionData);
      } else {
        gameCache.set(cacheKey, mapped as GameMentionData);
      }

      return mapped;
    })
    .finally(() => {
      pending.delete(cacheKey);
    });

  pending.set(cacheKey, request);
  return request;
};

const chipStyle = (colors: Record<string, string>): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "2px 8px",
  borderRadius: "999px",
  border: `1px solid ${colors.base}`,
  backgroundColor: colors.crust,
  color: colors.text,
  textDecoration: "none",
  fontSize: "0.85em",
  lineHeight: "1.2",
  verticalAlign: "middle",
  transform: "translateY(1px)",
});

function MentionChip({
  type,
  slug,
  domain,
  href,
  colors,
}: {
  type: "user" | "game";
  slug: string;
  domain?: string;
  href?: string;
  colors: Record<string, string>;
}) {
  const anchorRef = useRef<HTMLAnchorElement | null>(null);
  const hostname = (() => {
    if (domain) return domain;
    if (href) {
      try {
        return new URL(
          href,
          typeof window !== "undefined" ? window.location.origin : "https://d2jam.com",
        ).hostname.toLowerCase();
      } catch {}
    }
    return typeof window !== "undefined" ? window.location.hostname : "d2jam.com";
  })();
  const cacheKey = `${type}:${slug}@${hostname.toLowerCase()}`;
  const [data, setData] = useState<UserMentionData | GameMentionData>(() => {
    const cached =
      type === "user" ? userCache.get(cacheKey) : gameCache.get(cacheKey);
    return cached ?? ({ slug } as UserMentionData | GameMentionData);
  });

  useEffect(() => {
    let cancelled = false;

    loadMentionData(type, slug, hostname).then((nextData) => {
      if (cancelled || !nextData) return;
      setData(nextData);
    });

    return () => {
      cancelled = true;
      const anchor = anchorRef.current;
      if (anchor) {
        hidePopoverForAnchor(anchor);
      }
    };
  }, [type, slug, hostname]);

  const image =
    type === "user"
      ? (data as UserMentionData).profilePicture || FALLBACK_IMAGE
      : (data as GameMentionData).thumbnail || FALLBACK_IMAGE;
  const label =
    type === "user"
      ? (data as UserMentionData).name || slug
      : (data as GameMentionData).name || slug;

  return (
    <a
      ref={anchorRef}
      href={`https://${hostname}/${type === "user" ? "u" : "g"}/${slug}`}
      className={`mention-chip mention-chip--${type}`}
      data-mention-type={type}
      data-mention-slug={slug}
      data-mention-domain={domain}
      style={chipStyle(colors)}
      onMouseEnter={() => {
        if (!anchorRef.current) return;
        showPopoverForAnchor(anchorRef.current, type, data, colors);
      }}
      onMouseLeave={() => {
        if (!anchorRef.current) return;
        hidePopoverForAnchor(anchorRef.current);
      }}
    >
      <img
        src={image}
        alt={type === "user" ? "User avatar" : "Game thumbnail"}
        width={18}
        height={18}
        style={{
          width: "18px",
          height: "18px",
          objectFit: "cover",
          borderRadius: type === "user" ? "999px" : "6px",
        }}
        loading="lazy"
        decoding="async"
      />
      <span>{label}</span>
    </a>
  );
}

const styleStringToObject = (value: string): CSSProperties =>
  value.split(";").reduce((acc, part) => {
    const [rawKey, rawVal] = part.split(":");
    const key = rawKey?.trim();
    const val = rawVal?.trim();
    if (!key || !val) return acc;
    const camelKey = key.replace(/-([a-z])/g, (_match, char: string) =>
      char.toUpperCase(),
    );
    acc[camelKey] = val;
    return acc;
  }, {} as Record<string, string>) as CSSProperties;

const htmlAttributeToReactProp = (
  name: string,
  value: string,
): [string, unknown] | null => {
  if (name === "class") return ["className", value];
  if (name === "style") return ["style", styleStringToObject(value)];
  if (name === "for") return ["htmlFor", value];
  if (name === "allowfullscreen") return ["allowFullScreen", true];
  if (name === "autoplay") {
    return value === "false" ? null : ["autoPlay", true];
  }
  if (name === "loop") {
    return value === "false" ? null : ["loop", true];
  }
  if (name === "playsinline") return ["playsInline", value !== "false"];
  if (name === "frameborder") return ["frameBorder", value];
  if (name === "referrerpolicy") return ["referrerPolicy", value];
  if (name === "tabindex") return ["tabIndex", Number(value)];
  return [name, value];
};

const domNodeToReact = (
  node: Node,
  key: string,
  colors: Record<string, string>,
): ReactNode => {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const element = node as HTMLElement;
  const tag = element.tagName.toLowerCase();
  const mentionType = element.dataset.mentionType;
  const mentionSlug = element.dataset.mentionSlug;
  const mentionDomain = element.dataset.mentionDomain;
  const mentionHref = element.getAttribute("href") ?? undefined;

  if (
    tag === "a" &&
    (mentionType === "user" || mentionType === "game") &&
    mentionSlug
  ) {
    return (
      <MentionChip
        key={key}
        type={mentionType}
        slug={mentionSlug}
        domain={mentionDomain || undefined}
        href={mentionHref}
        colors={colors}
      />
    );
  }

  const props: Record<string, unknown> = { key };

  Array.from(element.attributes).forEach((attribute) => {
    const mapped = htmlAttributeToReactProp(attribute.name, attribute.value);
    if (!mapped) return;
    const [propName, propValue] = mapped;
    props[propName] = propValue;
  });

  const children = Array.from(element.childNodes)
    .map((child, index) => domNodeToReact(child, `${key}.${index}`, colors))
    .filter((child) => child !== null && child !== undefined);

  return createElement(tag, props, children.length > 0 ? children : undefined);
};

export default function MentionedContent({
  html,
  content,
  className,
}: MentionedContentProps) {
  const { colors } = useTheme();
  const source = content ?? html ?? "";
  const sanitized = useMemo(
    () => cleanMentionsHtml(renderRichTextToHtml(source)),
    [source],
  );
  const rendered = useEmojiContent(sanitized);
  const contentNodes = useMemo(() => {
    if (typeof DOMParser === "undefined") {
      return null;
    }

    const parser = new DOMParser();
    const documentNode = parser.parseFromString(`<body>${rendered}</body>`, "text/html");
    return Array.from(documentNode.body.childNodes).map((node, index) =>
      domNodeToReact(node, `${index}`, colors),
    );
  }, [rendered, colors]);

  if (!contentNodes) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: rendered }} />;
  }

  return <div className={className}>{contentNodes}</div>;
}
