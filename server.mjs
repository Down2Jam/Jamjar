import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "dist");
const indexPath = path.join(distDir, "index.html");
const port = Number(process.env.PORT ?? 3000);
const publicOrigin = (process.env.PUBLIC_ORIGIN ?? "https://d2jam.com").replace(
  /\/$/,
  "",
);
const apiBase = (process.env.API_BASE_URL ?? "https://d2jam.com/api/v1").replace(
  /\/$/,
  "",
);
const apiOrigin = apiBase.replace(/\/api\/v1\/?$/, "");

const defaultMeta = {
  title: "Down2Jam",
  description: "The community centered game jam",
  image: "/images/D2J_Icon.png",
  icon: "/images/D2J_Icon.svg",
  canonical: "/",
  type: "website",
  robots: "index,follow,max-image-preview:large",
};

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"],
  [".ico", "image/x-icon"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".txt", "text/plain; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
]);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function stripHtml(value) {
  const text = String(value ?? "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 180 ? `${text.slice(0, 177).trim()}...` : text;
}

function newsExcerpt(value, maxLength = 280) {
  const content = String(value ?? "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  const firstParagraph = content.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1];
  const text = String(firstParagraph ?? content)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  const shortened = text.slice(0, maxLength - 1);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, lastSpace > maxLength * 0.7 ? lastSpace : undefined).trim()}…`;
}

function normalizeTagName(value) {
  return String(value ?? "").toLowerCase().replace(/[\s_-]+/g, "");
}

function isNewsPost(post) {
  return (post?.tags ?? []).some((tag) =>
    ["siteannouncement", "sitechangelog"].includes(normalizeTagName(tag?.name)),
  );
}

function newsCategory(post) {
  return (post?.tags ?? []).some(
    (tag) => normalizeTagName(tag?.name) === "siteannouncement",
  )
    ? "Announcement"
    : "Changelog";
}

function firstImageFromHtml(value) {
  const match = String(value ?? "").match(
    /<img\b[^>]*\bsrc=(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i,
  );
  return match?.[1] || match?.[2] || match?.[3] || null;
}

function collectionItemImage(item) {
  return (
    item?.thumbnailUrl ||
    item?.track?.thumbnail ||
    item?.track?.game?.thumbnail ||
    item?.game?.thumbnail ||
    null
  );
}

function uniqueCollectionImages(collection) {
  const seen = new Set();
  const images = [];
  const items = [
    ...(Array.isArray(collection?.items) ? collection.items : []),
    ...(Array.isArray(collection?.previewItems) ? collection.previewItems : []),
  ];
  for (const item of items) {
    const image = collectionItemImage(item);
    if (!image || seen.has(image)) continue;
    seen.add(image);
    images.push(image);
    if (images.length >= 4) break;
  }
  return images;
}

function collectionImage(collection) {
  return uniqueCollectionImages(collection)[0] || defaultMeta.image;
}

function collectionSummary(collection) {
  if (!collection) return "A curated Down2Jam collection.";
  const owner = collection.owner?.name ?? collection.owner?.slug;
  return owner ? `${collection.title} by ${owner}` : collection.title;
}

function absoluteUrl(value) {
  if (!value) return "";
  try {
    return new URL(value, publicOrigin).toString();
  } catch {
    return String(value);
  }
}

function fetchableImageUrl(value) {
  if (!value) return "";
  try {
    const base = String(value).startsWith("/api/") ? apiOrigin : publicOrigin;
    return new URL(value, base).toString();
  } catch {
    return String(value);
  }
}

function unwrapItem(payload) {
  if (!payload || typeof payload !== "object") return payload;
  if ("data" in payload) return payload.data;
  return payload;
}

async function fetchJson(pathname) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(`${apiBase}${pathname}`, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;
    return unwrapItem(await response.json());
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function unwrapList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

async function fetchNewsPosts(limit = 50) {
  const tags = unwrapList(await fetchJson("/tags"));
  const newsTags = tags.filter((tag) =>
    ["siteannouncement", "sitechangelog"].includes(normalizeTagName(tag?.name)),
  );
  if (newsTags.length === 0) return [];
  const tagFilter = newsTags.map((tag) => `${tag.id},1`).join("_");
  const response = await fetchJson(
    `/posts?sort=newest&time=all&limit=${limit}&tags=${encodeURIComponent(tagFilter)}`,
  );
  return unwrapList(response).filter(isNewsPost);
}

function selectedGamePage(game) {
  return game?.postJamPage ?? game?.jamPage ?? null;
}

async function metadataForPath(url) {
  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  const gameMatch = pathname.match(/^\/g\/([^/]+)$/);
  if (gameMatch) {
    const game = await fetchJson(`/games/${encodeURIComponent(gameMatch[1])}`);
    const page = selectedGamePage(game);
    const name = page?.name ?? game?.name ?? gameMatch[1];
    const description =
      page?.short ?? game?.short ?? "A game submitted to Down2Jam";
    const image =
      page?.thumbnail ??
      page?.banner ??
      game?.thumbnail ??
      game?.banner ??
      defaultMeta.image;
    return {
      title: name,
      description,
      image,
      icon: page?.thumbnail ?? game?.thumbnail ?? image,
      canonical: `/g/${game?.slug ?? gameMatch[1]}`,
      type: "website",
    };
  }

  const trackMatch = pathname.match(/^\/m\/([^/]+)$/);
  if (trackMatch) {
    const pageVersion = url.searchParams.get("pageVersion");
    const suffix =
      pageVersion === "POST_JAM" || pageVersion === "JAM"
        ? `?pageVersion=${encodeURIComponent(pageVersion)}`
        : "";
    const track = await fetchJson(
      `/tracks/${encodeURIComponent(trackMatch[1])}${suffix}`,
    );
    const composerName = track?.composer?.name ?? track?.composer?.slug;
    const description =
      stripHtml(track?.commentary) ||
      (composerName && track?.game?.name
        ? `${track.name} by ${composerName} for ${track.game.name}`
        : "Music track on Down2Jam");
    const image =
      track?.game?.banner ?? track?.game?.thumbnail ?? defaultMeta.image;
    const canonicalSuffix =
      track?.pageVersion === "POST_JAM" ? "?pageVersion=POST_JAM" : "";
    return {
      title: track?.name ?? trackMatch[1],
      description,
      image,
      icon: track?.game?.thumbnail ?? image,
      canonical: `/m/${track?.slug ?? trackMatch[1]}${canonicalSuffix}`,
      type: "music.song",
    };
  }

  const collectionMatch = pathname.match(/^\/c\/([^/]+)$/);
  if (collectionMatch) {
    const collection = await fetchJson(
      `/collections/${encodeURIComponent(collectionMatch[1])}`,
    );
    const description =
      stripHtml(collection?.description) || collectionSummary(collection);
    const images = uniqueCollectionImages(collection);
    const image =
      collection && images.length > 1
        ? `/og/collections/${encodeURIComponent(collection.slug ?? collectionMatch[1])}.png`
        : images[0] || defaultMeta.image;
    return {
      title: collection?.title ?? collectionMatch[1],
      description,
      image,
      icon: image,
      imageWidth: 1200,
      imageHeight: 630,
      imageType: "image/png",
      canonical: `/c/${collection?.slug ?? collectionMatch[1]}`,
      type: "website",
      robots:
        collection?.visibility === "private" ||
        collection?.visibility === "unlisted"
          ? "noindex,nofollow"
          : defaultMeta.robots,
    };
  }

  const userMatch = pathname.match(/^\/u\/([^/]+)$/);
  if (userMatch) {
    const user = await fetchJson(`/users/${encodeURIComponent(userMatch[1])}`);
    return {
      title: user?.name ?? userMatch[1],
      description:
        user?.short || stripHtml(user?.bio) || "A user in Down2Jam",
      image: user?.profilePicture || user?.bannerPicture || defaultMeta.image,
      icon: user?.profilePicture || defaultMeta.icon,
      canonical: `/u/${user?.slug ?? userMatch[1]}`,
      type: "profile",
    };
  }

  const postMatch = pathname.match(/^\/p\/([^/]+)$/);
  if (postMatch) {
    const post = await fetchJson(`/posts/${encodeURIComponent(postMatch[1])}`);
    const isModerated = Boolean(post?.deletedAt || post?.removedAt);
    const title = isModerated
      ? post?.removedAt
        ? "[Removed Post]"
        : "[Deleted Post]"
      : post?.title;
    return {
      title: title ?? postMatch[1],
      description:
        post && !isModerated
          ? stripHtml(post.content)
          : "A post on Down2Jam",
      image:
        (!isModerated && firstImageFromHtml(post?.content)) ||
        post?.author?.profilePicture ||
        defaultMeta.image,
      icon: post?.author?.profilePicture || defaultMeta.icon,
      canonical: `/p/${post?.slug ?? postMatch[1]}`,
      type: "article",
    };
  }

  const newsMatch = pathname.match(/^\/news\/([^/]+)$/);
  if (newsMatch && newsMatch[1] !== "rss.xml") {
    const post = await fetchJson(`/posts/${encodeURIComponent(newsMatch[1])}`);
    if (!post || !isNewsPost(post)) return null;
    return {
      title: post.title ?? newsMatch[1],
      description: newsExcerpt(post.content),
      image: `/og/news/${encodeURIComponent(post.slug ?? newsMatch[1])}.png`,
      icon: post.author?.profilePicture || defaultMeta.icon,
      imageWidth: 1200,
      imageHeight: 630,
      imageType: "image/png",
      canonical: `/news/${post.slug ?? newsMatch[1]}`,
      type: "article",
      publishedTime: post.createdAt,
      modifiedTime: post.editedAt,
      author: post.author?.name,
      feed: "/news/rss.xml",
    };
  }

  if (pathname === "/news") {
    return {
      title: "News",
      description: "Official Down2Jam news, announcements, and site updates.",
      canonical: "/news",
      type: "website",
      feed: "/news/rss.xml",
    };
  }

  return null;
}

function renderMetaTags(input) {
  const meta = { ...defaultMeta, ...input };
  const pageTitle = meta.title || defaultMeta.title;
  const title =
    pageTitle === "Down2Jam" || pageTitle.endsWith(" | Down2Jam")
      ? pageTitle
      : `${pageTitle} | Down2Jam`;
  const description = meta.description || defaultMeta.description;
  const image = absoluteUrl(meta.image || defaultMeta.image);
  const icon = absoluteUrl(meta.icon || meta.image || defaultMeta.icon);
  const canonical = absoluteUrl(meta.canonical || "/");
  const iconType = icon.endsWith(".svg") ? "image/svg+xml" : "image/png";
  const imageDimensions =
    meta.imageWidth && meta.imageHeight
      ? `
    <meta property="og:image:width" content="${escapeHtml(meta.imageWidth)}" />
    <meta property="og:image:height" content="${escapeHtml(meta.imageHeight)}" />`
      : "";
  const imageType = meta.imageType
    ? `
    <meta property="og:image:type" content="${escapeHtml(meta.imageType)}" />`
    : "";
  const articleMetadata = [
    meta.publishedTime
      ? `<meta property="article:published_time" content="${escapeHtml(meta.publishedTime)}" />`
      : "",
    meta.modifiedTime
      ? `<meta property="article:modified_time" content="${escapeHtml(meta.modifiedTime)}" />`
      : "",
    meta.author
      ? `<meta property="article:author" content="${escapeHtml(meta.author)}" />`
      : "",
  ]
    .filter(Boolean)
    .join("\n    ");
  const feedLink = meta.feed
    ? `<link rel="alternate" type="application/rss+xml" title="Down2Jam News" href="${escapeHtml(absoluteUrl(meta.feed))}" />`
    : "";

  return `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="application-name" content="Down2Jam" />
    <meta name="robots" content="${escapeHtml(meta.robots)}" />
    <meta name="theme-color" content="#000000" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <link rel="icon" type="${escapeHtml(iconType)}" href="${escapeHtml(icon)}" />
    <link rel="apple-touch-icon" href="${escapeHtml(image)}" />
    ${feedLink}
    <meta property="og:site_name" content="Down2Jam" />
    <meta property="og:title" content="${escapeHtml(pageTitle)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="${escapeHtml(meta.type)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />${imageDimensions}${imageType}
    ${articleMetadata}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@Down2Jam" />
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />`;
}

function injectMetadata(html, metadata) {
  const withoutManagedTags = html
    .replace(/<title>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta\s+name="(?:description|application-name|robots|theme-color|twitter:[^"]+)"[^>]*>\s*/gi, "")
    .replace(/<meta\s+property="og:[^"]+"[^>]*>\s*/gi, "")
    .replace(/<link\s+rel="(?:canonical|icon|alternate icon|apple-touch-icon)"[^>]*>\s*/gi, "");

  return withoutManagedTags.replace("</head>", `${renderMetaTags(metadata)}\n  </head>`);
}

async function serveIndex(res, url) {
  const html = await readFile(indexPath, "utf8");
  const metadata = (await metadataForPath(url)) ?? {
    ...defaultMeta,
    canonical: `${url.pathname}${url.search}`,
  };
  const body = injectMetadata(html, metadata);
  res.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "public, max-age=30, stale-while-revalidate=120",
  });
  res.end(body);
}

function collectionPreviewTiles(images) {
  if (images.length <= 1) {
    return [{ image: images[0] || defaultMeta.image, x: 0, y: 0, width: 1200, height: 630 }];
  }
  if (images.length === 2) {
    return [
      { image: images[0], x: 0, y: 0, width: 600, height: 630 },
      { image: images[1], x: 600, y: 0, width: 600, height: 630 },
    ];
  }
  if (images.length === 3) {
    return [
      { image: images[0], x: 0, y: 0, width: 600, height: 630 },
      { image: images[1], x: 600, y: 0, width: 600, height: 315 },
      { image: images[2], x: 600, y: 315, width: 600, height: 315 },
    ];
  }
  return [
    { image: images[0], x: 0, y: 0, width: 600, height: 315 },
    { image: images[1], x: 600, y: 0, width: 600, height: 315 },
    { image: images[2], x: 0, y: 315, width: 600, height: 315 },
    { image: images[3], x: 600, y: 315, width: 600, height: 315 },
  ];
}

async function fetchImageBuffer(image) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(fetchableImageUrl(image), {
      signal: controller.signal,
      headers: { accept: "image/avif,image/webp,image/png,image/jpeg,image/*" },
    });
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function serveCollectionPreviewImage(res, collectionId) {
  const collection = await fetchJson(
    `/collections/${encodeURIComponent(collectionId)}`,
  );
  const images = uniqueCollectionImages(collection);
  const tiles = collectionPreviewTiles(images);
  const composites = [];
  for (const tile of tiles) {
    const input = await fetchImageBuffer(tile.image);
    if (!input) continue;
    try {
      composites.push({
        input: await sharp(input)
          .resize(tile.width, tile.height, { fit: "cover", position: "center" })
          .png()
          .toBuffer(),
        left: tile.x,
        top: tile.y,
      });
    } catch {
      // Skip images sharp cannot decode.
    }
  }
  const png = await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: "#111111",
    },
  })
    .composite(composites)
    .png()
    .toBuffer();

  res.writeHead(collection ? 200 : 404, {
    "content-type": "image/png",
    "cache-control": "public, max-age=300, stale-while-revalidate=600",
  });
  res.end(png);
}

function wrapPreviewTitle(value, maxCharacters = 28, maxLines = 3) {
  const words = String(value ?? "News").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxCharacters || !current) {
      current = next;
      continue;
    }
    lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  const consumed = lines.join(" ").length;
  if (consumed < String(value ?? "").length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[.,;:!?-]+$/, "")}…`;
  }
  return lines;
}

async function serveNewsPreviewImage(res, slug) {
  const post = await fetchJson(`/posts/${encodeURIComponent(slug)}`);
  if (!post || !isNewsPost(post)) {
    res.writeHead(404);
    res.end();
    return;
  }
  const titleLines = wrapPreviewTitle(post.title);
  const category = newsCategory(post);
  const date = new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(post.createdAt));
  const titleSvg = titleLines
    .map(
      (line, index) =>
        `<text x="92" y="${238 + index * 82}" font-family="Arial, sans-serif" font-size="68" font-weight="700" fill="#f4f4f5">${escapeHtml(line)}</text>`,
    )
    .join("");
  const svg = Buffer.from(`
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#121212" />
      <rect x="0" y="0" width="18" height="630" fill="#e95833" />
      <text x="92" y="92" font-family="Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="5" fill="#e95833">DOWN2JAM NEWS</text>
      <text x="92" y="151" font-family="Arial, sans-serif" font-size="28" fill="#a1a1aa">${escapeHtml(category)}  ·  ${escapeHtml(date)}</text>
      ${titleSvg}
      <line x1="92" y1="548" x2="1108" y2="548" stroke="#2f2f2f" stroke-width="2" />
      <text x="92" y="590" font-family="Arial, sans-serif" font-size="24" fill="#a1a1aa">d2jam.com/news/${escapeHtml(post.slug ?? slug)}</text>
    </svg>
  `);
  const png = await sharp(svg).png().toBuffer();
  res.writeHead(200, {
    "content-type": "image/png",
    "cache-control": "public, max-age=300, stale-while-revalidate=600",
  });
  res.end(png);
}

async function serveNewsRss(res) {
  const posts = await fetchNewsPosts(50);
  const items = posts
    .map((post) => {
      const link = absoluteUrl(`/news/${post.slug}`);
      const content = String(post.content ?? "").replaceAll("]]>", "]]]]><![CDATA[>");
      return `
    <item>
      <title>${escapeHtml(post.title)}</title>
      <link>${escapeHtml(link)}</link>
      <guid isPermaLink="true">${escapeHtml(link)}</guid>
      <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
      <category>${escapeHtml(newsCategory(post))}</category>
      <description>${escapeHtml(newsExcerpt(post.content))}</description>
      <content:encoded><![CDATA[${content}]]></content:encoded>
    </item>`;
    })
    .join("");
  const latest = posts[0]?.createdAt
    ? new Date(posts[0].createdAt).toUTCString()
    : new Date().toUTCString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Down2Jam News</title>
    <link>${escapeHtml(absoluteUrl("/news"))}</link>
    <description>Official Down2Jam news, announcements, and site updates.</description>
    <language>en</language>
    <lastBuildDate>${latest}</lastBuildDate>${items}
  </channel>
</rss>`;
  res.writeHead(200, {
    "content-type": "application/rss+xml; charset=utf-8",
    "cache-control": "public, max-age=300, stale-while-revalidate=600",
  });
  res.end(xml);
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes.get(ext) ?? "application/octet-stream";
  const immutable = filePath.includes(`${path.sep}assets${path.sep}`);
  res.writeHead(200, {
    "content-type": contentType,
    "cache-control": immutable
      ? "public, max-age=31536000, immutable"
      : "public, max-age=3600",
  });
  createReadStream(filePath).pipe(res);
}

async function proxyApiRequest(req, res, url) {
  const target = new URL(`${url.pathname}${url.search}`, apiOrigin);
  const headers = new Headers(req.headers);

  let response;
  try {
    response = await fetch(target, {
      method: req.method,
      headers,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : req,
      duplex:
        req.method === "GET" || req.method === "HEAD" ? undefined : "half",
    });
  } catch (error) {
    console.error(`API proxy failed for ${target.toString()}`, error);
    res.writeHead(502, { "content-type": "application/json; charset=utf-8" });
    res.end(
      JSON.stringify({
        success: false,
        error: {
          code: "ERR_API_UNAVAILABLE",
          message: "Jamcore API is unavailable.",
        },
      }),
    );
    return;
  }

  res.writeHead(
    response.status,
    Object.fromEntries(response.headers.entries()),
  );

  if (!response.body) {
    res.end();
    return;
  }

  const reader = response.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (error) {
    res.destroy(error);
  }
}

createServer(async (req, res) => {
  try {
    if (!req.url) {
      res.writeHead(405);
      res.end();
      return;
    }

    const url = new URL(req.url, publicOrigin);
    if (url.pathname.startsWith("/api/")) {
      await proxyApiRequest(req, res, url);
      return;
    }

    if (req.method !== "GET") {
      res.writeHead(405);
      res.end();
      return;
    }

    const collectionPreviewMatch = url.pathname.match(
      /^\/og\/collections\/([^/]+)\.png$/,
    );
    if (collectionPreviewMatch) {
      await serveCollectionPreviewImage(
        res,
        decodeURIComponent(collectionPreviewMatch[1]),
      );
      return;
    }

    if (url.pathname === "/news/rss.xml") {
      await serveNewsRss(res);
      return;
    }

    const newsPreviewMatch = url.pathname.match(/^\/og\/news\/([^/]+)\.png$/);
    if (newsPreviewMatch) {
      await serveNewsPreviewImage(res, decodeURIComponent(newsPreviewMatch[1]));
      return;
    }

    const decodedPath = decodeURIComponent(url.pathname);
    const normalizedPath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
    const filePath = path.join(distDir, normalizedPath);

    if (
      filePath.startsWith(distDir) &&
      existsSync(filePath) &&
      statSync(filePath).isFile()
    ) {
      serveFile(res, filePath);
      return;
    }

    await serveIndex(res, url);
  } catch (error) {
    console.error(error);
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end("Internal server error");
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`Jamjar server listening on ${port}`);
});
