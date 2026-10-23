import { BASE_URL } from "@/requests/config";
import { PageVersion } from "@/types/GameType";

function parseContentDispositionFilename(contentDisposition: string | null) {
  if (!contentDisposition) return null;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {}
  }

  const asciiMatch = contentDisposition.match(/filename="([^"]+)"/i);
  return asciiMatch?.[1] ?? null;
}

export function sanitizeDownloadBaseName(value: string) {
  return (
    value
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[. ]+$/g, "") || "track"
  );
}

function extensionFromContentType(contentType: string | null) {
  const normalized = contentType?.split(";")[0].trim().toLowerCase();

  switch (normalized) {
    case "audio/ogg":
    case "application/ogg":
      return ".ogg";
    case "audio/wav":
    case "audio/wave":
    case "audio/x-wav":
      return ".wav";
    case "audio/mpeg":
      return ".mp3";
    default:
      return "";
  }
}

export async function fetchTrackDownload(
  trackSlug: string,
  fallbackName: string,
  pageVersion?: PageVersion,
) {
  const params = new URLSearchParams();
  if (pageVersion && pageVersion !== "JAM") {
    params.set("pageVersion", pageVersion);
  }

  const response = await fetch(
    `${BASE_URL}/music/track/${encodeURIComponent(trackSlug)}/download${params.size ? `?${params.toString()}` : ""}`,
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const filename =
    parseContentDispositionFilename(
      response.headers.get("content-disposition"),
    ) ??
    `${sanitizeDownloadBaseName(fallbackName)}${extensionFromContentType(response.headers.get("content-type")) || ".mp3"}`;

  return { blob, filename };
}

export function saveTrackDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export async function createAlbumCover(soundtrackThumbnail?: string | null, thumbnail?: string | null) {
  const sources = [...new Set([soundtrackThumbnail, thumbnail, "/images/game-thumbnail.png"].filter(Boolean))];

  for (const source of sources) {
    try {
      const response = await fetch(source!, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) continue;
      const image = await createImageBitmap(await response.blob());
      try {
        const cropSize = Math.min(image.width, image.height);
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = Math.min(cropSize, 2048);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Could not prepare album cover.");
        context.drawImage(image, (image.width - cropSize) / 2, (image.height - cropSize) / 2, cropSize, cropSize, 0, 0, canvas.width, canvas.height);
        const cover = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Could not encode album cover.")), "image/png");
        });
        return new Uint8Array(await cover.arrayBuffer());
      } finally {
        image.close();
      }
    } catch {
      // Try the thumbnail or local placeholder if the preferred artwork is unavailable.
    }
  }

  throw new Error("Could not prepare album cover.");
}

export type TrackDownloadRequest = {
  trackSlug: string;
  fallbackName: string;
  pageVersion?: PageVersion;
  resolve: () => void;
};

export function downloadTrackBySlug(trackSlug: string, fallbackName: string, pageVersion?: PageVersion): Promise<void> {
  return new Promise(resolve => {
    window.dispatchEvent(new CustomEvent<TrackDownloadRequest>("track-download-request", {
      detail: { trackSlug, fallbackName, pageVersion, resolve },
    }));
  });
}
