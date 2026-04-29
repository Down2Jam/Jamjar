import { BASE_URL } from "./config";

export async function search(query: string, params?: {
  type?: string;
  limit?: number;
  debug?: boolean;
  includeFacets?: boolean;
}) {
  const searchParams = new URLSearchParams({ query });
  if (params?.type) searchParams.set("type", params.type);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.debug !== undefined) searchParams.set("debug", String(params.debug));
  if (params?.includeFacets !== undefined) {
    searchParams.set("includeFacets", String(params.includeFacets));
  }

  return fetch(`${BASE_URL}/search?${searchParams.toString()}`);
}
