import { BASE_URL } from "./config";

export type LinkPreviewData = {
  title: string;
  description?: string | null;
  image?: string | null;
  favicon?: string | null;
  siteName?: string | null;
  url: string;
};

export async function getLinkPreview(url: string) {
  const response = await fetch(
    `${BASE_URL}/collections/link-preview?url=${encodeURIComponent(url)}`,
  );
  if (!response.ok) throw new Error("Link preview unavailable");
  const json = (await response.json()) as { data?: LinkPreviewData };
  if (!json.data) throw new Error("Link preview unavailable");
  return json.data;
}
