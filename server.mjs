import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "dist");
const indexPath = path.join(distDir, "index.html");
const port = Number(process.env.PORT ?? 3000);
const publicOrigin = (process.env.PUBLIC_ORIGIN ?? "https://d2jam.com").replace(
  /\/$/,
  "",
);
const apiBase = (process.env.API_BASE_URL ?? "http://localhost:3005/api/v1").replace(
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

function absoluteUrl(value) {
  if (!value) return "";
  try {
    return new URL(value, publicOrigin).toString();
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
      image: post?.author?.profilePicture || defaultMeta.image,
      icon: post?.author?.profilePicture || defaultMeta.icon,
      canonical: `/p/${post?.slug ?? postMatch[1]}`,
      type: "article",
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

  return `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="application-name" content="Down2Jam" />
    <meta name="robots" content="${escapeHtml(meta.robots)}" />
    <meta name="theme-color" content="#000000" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <link rel="icon" type="${escapeHtml(iconType)}" href="${escapeHtml(icon)}" />
    <link rel="apple-touch-icon" href="${escapeHtml(image)}" />
    <meta property="og:site_name" content="Down2Jam" />
    <meta property="og:title" content="${escapeHtml(pageTitle)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="${escapeHtml(meta.type)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
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
