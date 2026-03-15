import { BASE_URL } from "@/requests/config";

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

function sanitizeDownloadBaseName(value: string) {
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

export async function downloadTrackBySlug(trackSlug: string, fallbackName: string) {
  const response = await fetch(
    `${BASE_URL}/music/track/${encodeURIComponent(trackSlug)}/download`,
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const filename =
    parseContentDispositionFilename(
      response.headers.get("content-disposition"),
    ) ??
    `${sanitizeDownloadBaseName(fallbackName)}${extensionFromContentType(response.headers.get("content-type")) || ".mp3"}`;

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
