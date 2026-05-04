"use client";

import { useTheme } from "@/providers/useSiteTheme";
import { resolveMediaUrl } from "@/helpers/mediaUrl";
import type { CollectionType } from "@/requests/collection";
import { FileText, Gamepad2, Music } from "lucide-react";

export type CollectionArtworkSummary = {
  id: number;
  slug: string;
  title: string;
  description?: string | null;
  visibility?: string;
  collectionType?: CollectionType;
  followerCount?: number;
  itemCount?: number;
  itemTypes?: Record<string, number>;
  previewItems?: Array<{
    itemType?: string;
    title?: string | null;
    thumbnailUrl?: string | null;
    game?: { thumbnail?: string | null } | null;
    track?: {
      thumbnail?: string | null;
      game?: { thumbnail?: string | null } | null;
    } | null;
    post?: {
      title?: string | null;
      contentExcerpt?: string | null;
      author?: { name?: string; slug?: string } | null;
    } | null;
  }>;
  owner?: { id?: number; name?: string; slug?: string };
};

type ThemeColors = Record<string, string>;

function collectionTypeIcon(collection: CollectionArtworkSummary) {
  const type = collection.collectionType ?? "music";
  if (type === "game") return <Gamepad2 size={34} strokeWidth={1.8} />;
  if (type === "post") return <FileText size={34} strokeWidth={1.8} />;
  return <Music size={34} strokeWidth={1.8} />;
}

function hexToRgb(value?: string) {
  const hex = value?.trim();
  if (!hex?.startsWith("#")) return null;
  const normalized =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex;
  if (!/^#[0-9a-f]{6}$/i.test(normalized)) return null;
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
  return `#${[r, g, b]
    .map((channel) =>
      Math.max(0, Math.min(255, Math.round(channel)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function mixColors(from: string, to: string, amount: number) {
  const fromRgb = hexToRgb(from);
  const toRgb = hexToRgb(to);
  if (!fromRgb || !toRgb) return from;
  return rgbToHex({
    r: fromRgb.r + (toRgb.r - fromRgb.r) * amount,
    g: fromRgb.g + (toRgb.g - fromRgb.g) * amount,
    b: fromRgb.b + (toRgb.b - fromRgb.b) * amount,
  });
}

function luminance(color: string) {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;
  return (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
}

function themeColor(colors: ThemeColors, keys: string[], fallback: string) {
  const key = keys.find((entry) => hexToRgb(colors[entry]));
  return key ? colors[key] : fallback;
}

function themeArtworkColors(colors: ThemeColors) {
  const background = colors.background ?? colors.base ?? "#171717";
  const text = colors.text ?? "#f4f4f5";
  const blue = themeColor(colors, ["blue", "cyan", "teal"], colors.textFaded ?? text);
  const warm = themeColor(colors, ["orange", "yellow", "red", "pink"], blue);
  const cool = themeColor(colors, ["cyan", "teal", "green", "blue"], blue);
  const vivid = themeColor(colors, ["magenta", "pink", "purple", "violet"], warm);
  const green = themeColor(colors, ["green", "lime", "teal", "cyan"], cool);
  const surface = colors.content ?? colors.sidebar ?? colors.mantle ?? colors.base ?? background;
  const isDark = luminance(background) < 0.55;
  const paper = isDark
    ? mixColors(surface, text, 0.18)
    : mixColors(background, warm, 0.045);
  const paperAlt = isDark
    ? mixColors(surface, text, 0.24)
    : mixColors(surface, cool, 0.055);

  return {
    background,
    text,
    discFrom: mixColors(vivid, background, 0.16),
    discTo: mixColors(cool, surface, 0.22),
    gameFrom: mixColors(green, background, 0.12),
    gameTo: mixColors(warm, surface, 0.28),
    paper,
    paperAlt,
    paperLine: mixColors(text, paper, 0.42),
    paperMeta: mixColors(text, paper, 0.58),
  };
}

function itemImage(item: NonNullable<CollectionArtworkSummary["previewItems"]>[number]) {
  return resolveMediaUrl(
    item.thumbnailUrl ||
    item.track?.thumbnail ||
    item.track?.game?.thumbnail ||
    item.game?.thumbnail ||
    null,
  );
}

function FallbackArtwork({
  collection,
  colors,
  showIcon = true,
}: {
  collection: CollectionArtworkSummary;
  colors: ThemeColors;
  showIcon?: boolean;
}) {
  const type = collection.collectionType ?? "music";
  const artworkColors = themeArtworkColors(colors);
  const background =
    type === "game"
      ? `linear-gradient(135deg, ${artworkColors.gameFrom}, ${artworkColors.gameTo})`
      : `linear-gradient(135deg, ${artworkColors.discFrom}, ${artworkColors.discTo})`;

  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ background, color: artworkColors.text }}
    >
      {showIcon && collectionTypeIcon(collection)}
    </div>
  );
}

function ArtworkTile({
  collection,
  colors,
  image,
  className,
  shape = "square",
  centerCutout = false,
}: {
  collection: CollectionArtworkSummary;
  colors: ThemeColors;
  image?: string;
  className?: string;
  shape?: "circle" | "square";
  centerCutout?: boolean;
}) {
  const cutoutMask = centerCutout
    ? {
        WebkitMaskImage:
          "radial-gradient(circle at center, transparent 0 12%, black 13%)",
        maskImage: "radial-gradient(circle at center, transparent 0 12%, black 13%)",
      }
    : undefined;

  return (
    <div
      className={`absolute overflow-hidden shadow-lg shadow-black/25 transition-transform group-hover:-translate-y-0.5 ${
        shape === "circle" ? "rounded-full" : "rounded-md"
      } ${className ?? ""}`}
    >
      <div className="h-full w-full" style={cutoutMask}>
        {image ? (
          <img
            src={image}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <FallbackArtwork
            collection={collection}
            colors={colors}
            showIcon={!centerCutout}
          />
        )}
      </div>
    </div>
  );
}

function DocumentArtworkTile({
  item,
  colors,
  className,
  muted = false,
}: {
  item?: NonNullable<CollectionArtworkSummary["previewItems"]>[number];
  colors: ThemeColors;
  className?: string;
  muted?: boolean;
}) {
  const artworkColors = themeArtworkColors(colors);
  const post = item?.post;
  const title = post?.title?.trim() || item?.title?.trim() || "Untitled post";
  const excerpt = post?.contentExcerpt?.trim() || title;
  const author = post?.author?.name?.trim();
  const words = excerpt.split(/\s+/).filter(Boolean);
  const lineWidths = [0, 1, 2].map((index) => {
    const word = words[index] ?? title.split(/\s+/)[index] ?? "";
    const width = Math.min(100, Math.max(48, word.length * 8 + 32));
    return `${width}%`;
  });

  return (
    <div
      className={`absolute overflow-hidden rounded-md shadow-lg shadow-black/25 transition-transform group-hover:-translate-y-0.5 ${className ?? ""}`}
      style={{
        background: muted
          ? `linear-gradient(135deg, ${artworkColors.paperAlt}, ${artworkColors.paper})`
          : `linear-gradient(135deg, ${artworkColors.paper}, ${mixColors(artworkColors.paper, artworkColors.background, 0.04)})`,
        color: artworkColors.text,
      }}
    >
      <div className="flex h-full w-full flex-col gap-[7%] p-[13%]">
        <div
          className="truncate text-[10px] font-semibold leading-none"
          style={{ color: artworkColors.paperLine }}
        >
          {title}
        </div>
        <div className="mt-auto flex flex-col gap-[6%]">
          {lineWidths.map((width, index) => (
            <div
              key={`${width}-${index}`}
              className="h-[7%] rounded-full"
              style={{ width, backgroundColor: artworkColors.paperLine }}
            />
          ))}
        </div>
        {author && (
          <div
            className="truncate text-[8px] leading-none"
            style={{ color: artworkColors.paperMeta }}
          >
            {author}
          </div>
        )}
      </div>
    </div>
  );
}

function PostCollectionArtwork({
  collection,
  colors,
}: {
  collection: CollectionArtworkSummary;
  colors: ThemeColors;
}) {
  const items = collection.previewItems ?? [];

  return (
    <div className="relative aspect-square w-full">
      <DocumentArtworkTile
        item={items[0]}
        colors={colors}
        muted
        className="left-[4%] top-[4%] z-10 h-[62%] w-[62%]"
      />
      <DocumentArtworkTile
        item={items[1] ?? items[0]}
        colors={colors}
        className="bottom-[4%] right-[4%] h-[62%] w-[62%]"
      />
    </div>
  );
}

export function CollectionArtwork({
  collection,
}: {
  collection: CollectionArtworkSummary;
}) {
  const { colors } = useTheme();
  const images = (collection.previewItems ?? []).map(itemImage).filter(Boolean) as string[];
  const type = collection.collectionType ?? "music";

  if (type === "music" || type === "game") {
    const shape = type === "music" ? "circle" : "square";
    return (
      <div className="relative aspect-square w-full">
        <ArtworkTile
          collection={collection}
          colors={colors}
          image={images[0]}
          shape={shape}
          centerCutout={type === "music"}
          className="left-[4%] top-[4%] z-10 h-[62%] w-[62%]"
        />
        <ArtworkTile
          collection={collection}
          colors={colors}
          image={images[1]}
          shape={shape}
          centerCutout={type === "music"}
          className="bottom-[4%] right-[4%] h-[62%] w-[62%]"
        />
      </div>
    );
  }

  if (type === "post") {
    return <PostCollectionArtwork collection={collection} colors={colors} />;
  }

  return (
    <div className="aspect-[4/3] w-full overflow-hidden rounded-md bg-white/[0.03]">
      {images[0] ? (
        <img
          src={images[0]}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <FallbackArtwork collection={collection} colors={colors} />
      )}
    </div>
  );
}
