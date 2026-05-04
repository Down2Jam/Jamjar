export function resolveMediaUrl(value?: string | null) {
  const url = value?.trim();
  if (!url) return "";

  if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith("//")) {
    return url;
  }

  if (url.startsWith("/api/") && typeof window !== "undefined") {
    return new URL(url, window.location.origin).toString();
  }

  return url;
}
