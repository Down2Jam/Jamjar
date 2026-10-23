import { useEffect, useState } from "react";

const fallbackAccent = "#80cfae";
const accents = new Map<string, string>();

export function useArtworkAccent(source: string) {
  const [sample, setSample] = useState({ source: "", color: fallbackAccent });

  useEffect(() => {
    if (!source || accents.has(source)) return;

    let cancelled = false;
    const image = new Image();
    const url = new URL(source, window.location.href);
    const firstParty = url.pathname.startsWith("/api/v1/image/");
    if (!firstParty && url.origin !== window.location.origin) image.crossOrigin = "anonymous";

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 32;
        canvas.height = 32;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return;

        // Match the square crop displayed on the disc.
        const size = Math.min(image.naturalWidth, image.naturalHeight);
        context.drawImage(image, (image.naturalWidth - size) / 2, (image.naturalHeight - size) / 2, size, size, 0, 0, 32, 32);
        const pixels = context.getImageData(0, 0, 32, 32).data;
        const buckets = new Map<number, { weight: number; red: number; green: number; blue: number }>();

        for (let i = 0; i < pixels.length; i += 4) {
          const x = (i / 4) % 32 - 15.5;
          const y = Math.floor(i / 4 / 32) - 15.5;
          if (x * x + y * y > 256 || pixels[i + 3] < 96) continue;

          const red = pixels[i], green = pixels[i + 1], blue = pixels[i + 2];
          const max = Math.max(red, green, blue);
          const min = Math.min(red, green, blue);
          if (max < 48 || min > 238) continue;

          const saturation = (max - min) / max;
          const weight = (pixels[i + 3] / 255) * (.1 + saturation);
          const key = (Math.round(red / 32) << 8) | (Math.round(green / 32) << 4) | Math.round(blue / 32);
          const bucket = buckets.get(key) ?? { weight: 0, red: 0, green: 0, blue: 0 };
          bucket.weight += weight;
          bucket.red += red * weight;
          bucket.green += green * weight;
          bucket.blue += blue * weight;
          buckets.set(key, bucket);
        }

        const dominant = [...buckets.values()].sort((a, b) => b.weight - a.weight)[0];
        let color = fallbackAccent;
        if (dominant) {
          const channels = [dominant.red, dominant.green, dominant.blue].map(value => value / dominant.weight);
          // Lift dark artwork colors so the border and controls remain visible.
          const lift = Math.max(0, (170 - Math.max(...channels)) / 255);
          color = "rgb(" + channels.map(value => Math.round(value + (255 - value) * lift)).join(" ") + ")";
        }
        accents.set(source, color);
        if (!cancelled) setSample({ source, color });
      } catch {
        // Artwork without CORS access keeps the default accent.
      }
    };
    image.src = firstParty ? url.pathname + url.search : url.toString();

    return () => { cancelled = true; image.onload = null; image.onerror = null; };
  }, [source]);

  return accents.get(source) ?? (sample.source === source ? sample.color : fallbackAccent);
}
