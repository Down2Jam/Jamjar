/**
 * Unwrap API responses that may be either raw data or wrapped in { data: ... }.
 * Some endpoints return raw arrays/objects, others wrap in { message, data }.
 */
export function unwrapArray<T>(json: unknown): T[] {
  if (Array.isArray(json)) return json;
  if (json && typeof json === "object" && "data" in json) {
    const d = (json as Record<string, unknown>).data;
    return Array.isArray(d) ? d : [];
  }
  return [];
}

export function unwrapItem<T>(json: unknown): T | null {
  if (json && typeof json === "object" && "data" in json) {
    return ((json as Record<string, unknown>).data as T) ?? null;
  }
  return (json as T) ?? null;
}
