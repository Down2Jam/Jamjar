"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactionSummaryType } from "@/types/ReactionType";

const SAMPLE_SIZE = 24;
const QUANTIZATION_STEP = 32;

export type ReactionPaletteColor =
  | "blue"
  | "green"
  | "orange"
  | "pink"
  | "red"
  | "yellow"
  | "purple"
  | "gray";

function toPaletteColor(
  red: number,
  green: number,
  blue: number,
): ReactionPaletteColor {
  const max = Math.max(red, green, blue) / 255;
  const min = Math.min(red, green, blue) / 255;
  const lightness = (max + min) / 2;
  const delta = max - min;

  let hue = 0;
  let saturation = 0;
  if (delta > 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (max === red / 255) {
      hue = 60 * (((green - blue) / 255 / delta) % 6);
    } else if (max === green / 255) {
      hue = 60 * ((blue - red) / 255 / delta + 2);
    } else {
      hue = 60 * ((red - green) / 255 / delta + 4);
    }
  }

  if (hue < 0) hue += 360;
  if (saturation < 0.18) return "gray";
  if (hue < 18 || hue >= 345) return "red";
  if (hue < 48) return "orange";
  if (hue < 70) return "yellow";
  if (hue < 165) return "green";
  if (hue < 250) return "blue";
  if (hue < 295) return "purple";
  return "pink";
}

function sampleDominantColor(source: string) {
  return new Promise<ReactionPaletteColor | null>((resolve) => {
    const image = new Image();
    const sourceUrl = new URL(source, window.location.href);
    const isFirstPartyImageRoute = sourceUrl.pathname.startsWith("/api/v1/image/");
    const sampleSource = isFirstPartyImageRoute
      ? `${sourceUrl.pathname}${sourceUrl.search}`
      : sourceUrl.toString();

    if (!isFirstPartyImageRoute && sourceUrl.origin !== window.location.origin) {
      image.crossOrigin = "anonymous";
    }
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = SAMPLE_SIZE;
        canvas.height = SAMPLE_SIZE;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) {
          resolve(null);
          return;
        }

        context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        const pixels = context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;
        const colors = new Map<number, number>();

        for (let index = 0; index < pixels.length; index += 4) {
          const alpha = pixels[index + 3];
          if (alpha < 96) continue;

          const sourceRed = pixels[index];
          const sourceGreen = pixels[index + 1];
          const sourceBlue = pixels[index + 2];
          const brightestChannel = Math.max(sourceRed, sourceGreen, sourceBlue);
          const darkestChannel = Math.min(sourceRed, sourceGreen, sourceBlue);
          const saturation =
            brightestChannel === 0
              ? 0
              : (brightestChannel - darkestChannel) / brightestChannel;

          // Outlines and pale highlights often occupy the most pixels in small
          // emotes, but they are not the color people visually associate with it.
          if (brightestChannel < 48) continue;
          if (darkestChannel > 238 && saturation < 0.12) continue;

          const red = Math.min(
            255,
            Math.round(sourceRed / QUANTIZATION_STEP) * QUANTIZATION_STEP,
          );
          const green = Math.min(
            255,
            Math.round(sourceGreen / QUANTIZATION_STEP) * QUANTIZATION_STEP,
          );
          const blue = Math.min(
            255,
            Math.round(sourceBlue / QUANTIZATION_STEP) * QUANTIZATION_STEP,
          );
          const key = (red << 16) | (green << 8) | blue;
          const visualWeight = (alpha / 255) * (0.3 + saturation * 0.7);
          colors.set(key, (colors.get(key) ?? 0) + visualWeight);
        }

        let dominantKey: number | null = null;
        let dominantWeight = 0;
        for (const [key, weight] of colors) {
          if (weight > dominantWeight) {
            dominantKey = key;
            dominantWeight = weight;
          }
        }

        if (dominantKey === null) {
          resolve(null);
          return;
        }

        resolve(
          toPaletteColor(
            (dominantKey >> 16) & 255,
            (dominantKey >> 8) & 255,
            dominantKey & 255,
          ),
        );
      } catch {
        // Cross-origin images without CORS headers cannot be sampled.
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = sampleSource;
  });
}

export function useReactionColors(reactions: ReactionSummaryType[]) {
  const [colors, setColors] = useState<Record<number, ReactionPaletteColor>>({});
  const sources = useMemo(
    () => reactions.map(({ reaction }) => [reaction.id, reaction.image] as const),
    [reactions],
  );
  const sourceKey = sources.map(([id, source]) => `${id}:${source}`).join("|");

  useEffect(() => {
    let cancelled = false;

    void Promise.all(
      sources.map(async ([id, source]) => [id, await sampleDominantColor(source)] as const),
    ).then((sampledColors) => {
      if (cancelled) return;
      setColors(
        Object.fromEntries(
          sampledColors.filter(
            (entry): entry is readonly [number, ReactionPaletteColor] =>
              Boolean(entry[1]),
          ),
        ),
      );
    });

    return () => {
      cancelled = true;
    };
  }, [sourceKey]);

  return colors;
}
