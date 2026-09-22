"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { ImagePlay } from "lucide-react";
import { Button, Input, Popover, Text } from "bioloom-ui";
import { useLocale } from "@/compat/next-intl";
import { useTheme } from "@/providers/useSiteTheme";
import EditorMenuButton from "./EditorMenuButton";

type KlipyMedia = {
  url: string;
  dims?: number[];
};

type KlipyGif = {
  id: string;
  title?: string;
  content_description?: string;
  itemurl?: string;
  url?: string;
  type?: string;
  media_formats?: Record<string, KlipyMedia | undefined>;
};

type KlipyResponse = {
  results?: KlipyGif[];
  next?: string;
};

const KLIPY_API_KEY = String(import.meta.env.VITE_KLIPY_API_KEY ?? "").trim();
const KLIPY_API_URL = "https://api.klipy.com/v2";

function normalizeLocale(value: string) {
  const [language = "en", region] = value.replace("-", "_").split("_");
  return region ? `${language.toLowerCase()}_${region.toUpperCase()}` : language.toLowerCase();
}

function getCountry(locale: string) {
  const region = normalizeLocale(locale).split("_")[1];
  if (region?.length === 2) return region;
  if (typeof navigator !== "undefined") {
    const browserRegion = navigator.language.replace("-", "_").split("_")[1];
    if (browserRegion?.length === 2) return browserRegion.toUpperCase();
  }
  return "US";
}

function getMedia(item: KlipyGif) {
  return (
    item.media_formats?.tinygif ??
    item.media_formats?.mediumgif ??
    item.media_formats?.gif ??
    (item.url ? { url: item.url } : undefined)
  );
}

export default function KlipyGifPicker({
  editor,
  size,
  iconSize,
  open,
  onOpenChange,
}: {
  editor: Editor;
  size: "xs" | "sm";
  iconSize: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const locale = normalizeLocale(useLocale());
  const country = getCountry(locale);
  const { colors } = useTheme();
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<KlipyGif[]>([]);
  const [next, setNext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestUrl = useMemo(() => {
    if (!KLIPY_API_KEY) return "";
    const trimmedQuery = query.trim();
    const url = new URL(`${KLIPY_API_URL}/${trimmedQuery ? "search" : "featured"}`);
    url.searchParams.set("key", KLIPY_API_KEY);
    if (trimmedQuery) url.searchParams.set("q", query);
    url.searchParams.set("country", country);
    url.searchParams.set("locale", locale);
    url.searchParams.set("contentfilter", "high");
    url.searchParams.set("media_filter", "gif,tinygif,mediumgif");
    url.searchParams.set("limit", "24");
    return url.toString();
  }, [country, locale, query]);

  useEffect(() => {
    if (!open || !requestUrl) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(requestUrl, { signal: controller.signal });
        if (!response.ok) throw new Error(`KLIPY request failed (${response.status})`);
        const payload = (await response.json()) as KlipyResponse;
        setItems(Array.isArray(payload.results) ? payload.results : []);
        setNext(payload.next ?? "");
      } catch (requestError) {
        if ((requestError as Error).name !== "AbortError") {
          console.error(requestError);
          setItems([]);
          setNext("");
          setError("GIFs could not be loaded.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, query ? 250 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, query, requestUrl]);

  useEffect(() => {
    if (!open) return;
    const handleDown = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };
    document.addEventListener("mousedown", handleDown, true);
    return () => document.removeEventListener("mousedown", handleDown, true);
  }, [onOpenChange, open]);

  const loadMore = async () => {
    if (!next || !requestUrl || loading) return;
    const url = new URL(requestUrl);
    url.searchParams.set("pos", next);
    setLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`KLIPY request failed (${response.status})`);
      const payload = (await response.json()) as KlipyResponse;
      setItems((current) => [...current, ...(payload.results ?? [])]);
      setNext(payload.next ?? "");
    } catch (requestError) {
      console.error(requestError);
      setError("More GIFs could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  const chooseGif = (item: KlipyGif) => {
    const media = getMedia(item);
    if (!media?.url) return;
    const alt = item.content_description || item.title || "KLIPY GIF";
    const itemUrl = item.itemurl || "https://klipy.com";

    editor
      .chain()
      .focus()
      .insertContent([
        { type: "imageResize", attrs: { src: media.url, alt } },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "GIF from KLIPY",
              marks: [
                {
                  type: "link",
                  attrs: {
                    href: itemUrl,
                    target: "_blank",
                    rel: "noopener noreferrer nofollow",
                  },
                },
              ],
            },
          ],
        },
      ])
      .run();

    const shareUrl = new URL(`${KLIPY_API_URL}/registershare`);
    shareUrl.searchParams.set("key", KLIPY_API_KEY);
    shareUrl.searchParams.set("id", item.id);
    shareUrl.searchParams.set("country", country);
    shareUrl.searchParams.set("locale", locale);
    if (query) shareUrl.searchParams.set("q", query);
    void fetch(shareUrl).catch((shareError) => console.error("KLIPY share registration failed", shareError));
    onOpenChange(false);
  };

  return (
    <div ref={pickerRef} className="relative z-30">
      <EditorMenuButton
        label="GIFs"
        onClick={() => onOpenChange(!open)}
        isActive={open}
        disabled={!KLIPY_API_KEY}
        size={size}
      >
        <ImagePlay size={iconSize} />
      </EditorMenuButton>
      <Popover
        shown={open}
        anchorToScreen={false}
        position="bottom"
        padding={12}
        showArrow
        surface="contrast"
        transformOrigin="center"
      >
        <div className="flex w-80 flex-col gap-2">
          <Input
            value={query}
            onValueChange={setQuery}
            placeholder="Search KLIPY"
            aria-label="Search KLIPY"
            size="sm"
            fullWidth
            style={{
              backgroundColor: colors.mantle,
              borderColor: "transparent",
              boxShadow: "none",
            }}
          />
          <div className="flex items-center justify-between">
            <Text size="xs" color="textFaded">GIFs</Text>
            <a
              href="https://klipy.com"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-xs underline underline-offset-2"
            >
              Powered by KLIPY
            </a>
          </div>
          {error ? <Text size="xs" color="textFaded">{error}</Text> : null}
          {!loading && items.length === 0 && !error ? (
            <Text size="xs" color="textFaded">No GIFs found.</Text>
          ) : (
            <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto">
              {items.map((item) => {
                const media = getMedia(item);
                if (!media?.url) return null;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="overflow-hidden rounded-lg"
                    title={item.title || item.content_description || "KLIPY GIF"}
                    onClick={() => chooseGif(item)}
                  >
                    <img
                      src={media.url}
                      alt={item.content_description || item.title || "KLIPY GIF"}
                      className="h-28 w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                );
              })}
            </div>
          )}
          {loading ? <Text size="xs" color="textFaded">Loading GIFs…</Text> : null}
          {next ? (
            <Button type="button" size="sm" variant="ghost" onClick={loadMore} disabled={loading}>
              Load more
            </Button>
          ) : null}
        </div>
      </Popover>
    </div>
  );
}
