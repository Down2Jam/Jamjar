import { useEffect } from "react";

const SITE_NAME = "Down2Jam";
const DEFAULT_TITLE = SITE_NAME;
const DEFAULT_DESCRIPTION = "The community centered game jam";
const DEFAULT_IMAGE = "/images/D2J_Icon.png";
const DEFAULT_ICON = "/images/D2J_Icon.svg";

export type PageMetadata = {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  icon?: string | null;
  canonical?: string | null;
  type?: string;
  robots?: string | null;
};

function absoluteUrl(value?: string | null) {
  if (!value) return "";
  try {
    return new URL(value, window.location.origin).toString();
  } catch {
    return value;
  }
}

function ensureMeta(selector: string, create: () => HTMLMetaElement) {
  const existing = document.head.querySelector<HTMLMetaElement>(selector);
  if (existing) return existing;

  const element = create();
  element.dataset.managedMetadata = "true";
  document.head.appendChild(element);
  return element;
}

function setNamedMeta(name: string, content: string) {
  const element = ensureMeta(`meta[name="${name}"]`, () => {
    const meta = document.createElement("meta");
    meta.name = name;
    return meta;
  });
  element.content = content;
}

function setPropertyMeta(property: string, content: string) {
  const element = ensureMeta(`meta[property="${property}"]`, () => {
    const meta = document.createElement("meta");
    meta.setAttribute("property", property);
    return meta;
  });
  element.content = content;
}

function setLink(rel: string, href: string, type?: string) {
  document.head
    .querySelectorAll<HTMLLinkElement>(`link[rel="${rel}"]`)
    .forEach((link) => link.remove());

  const link = document.createElement("link");
  link.rel = rel;
  link.href = href;
  if (type) link.type = type;
  link.dataset.managedMetadata = "true";
  document.head.appendChild(link);
}

export function applyPageMetadata(metadata: PageMetadata = {}) {
  const pageTitle = metadata.title?.trim() || DEFAULT_TITLE;
  const title =
    pageTitle === SITE_NAME || pageTitle.endsWith(` | ${SITE_NAME}`)
      ? pageTitle
      : `${pageTitle} | ${SITE_NAME}`;
  const description = metadata.description?.trim() || DEFAULT_DESCRIPTION;
  const image = absoluteUrl(metadata.image || DEFAULT_IMAGE);
  const icon = absoluteUrl(metadata.icon || metadata.image || DEFAULT_ICON);
  const canonical = absoluteUrl(metadata.canonical || window.location.pathname);
  const type = metadata.type || "website";
  const robots = metadata.robots || "index,follow,max-image-preview:large";

  document.title = title;
  setNamedMeta("application-name", SITE_NAME);
  setNamedMeta("robots", robots);
  setNamedMeta("theme-color", "#000000");
  setNamedMeta("description", description);
  setPropertyMeta("og:site_name", SITE_NAME);
  setPropertyMeta("og:title", pageTitle);
  setPropertyMeta("og:description", description);
  setPropertyMeta("og:type", type);
  setPropertyMeta("og:url", canonical);
  setPropertyMeta("og:image", image);
  setNamedMeta("twitter:card", "summary_large_image");
  setNamedMeta("twitter:site", "@Down2Jam");
  setNamedMeta("twitter:title", pageTitle);
  setNamedMeta("twitter:description", description);
  setNamedMeta("twitter:image", image);
  setLink("canonical", canonical);
  setLink("icon", icon, icon.endsWith(".svg") ? "image/svg+xml" : "image/png");
  setLink("apple-touch-icon", absoluteUrl(metadata.image || DEFAULT_IMAGE));
}

export function usePageMetadata(metadata: PageMetadata = {}) {
  useEffect(() => {
    applyPageMetadata(metadata);
  }, [
    metadata.title,
    metadata.description,
    metadata.image,
    metadata.icon,
    metadata.canonical,
    metadata.type,
    metadata.robots,
  ]);
}

export function stripHtmlForMetadata(value?: string | null) {
  if (!value) return "";
  const text = value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 180 ? `${text.slice(0, 177).trim()}...` : text;
}
