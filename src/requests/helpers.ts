export type ApiEnvelope<T> = {
  data?: T;
  message?: string;
};

export function unwrapItem<T>(json: unknown): T | null {
  if (json && typeof json === "object" && "data" in json) {
    return ((json as ApiEnvelope<T>).data as T) ?? null;
  }
  return (json as T) ?? null;
}

export function unwrapArray<T>(json: unknown): T[] {
  if (Array.isArray(json)) return json;
  if (json && typeof json === "object" && "items" in json) {
    const items = (json as { items?: unknown }).items;
    return Array.isArray(items) ? (items as T[]) : [];
  }
  const item = unwrapItem<unknown>(json);
  if (item && typeof item === "object" && "items" in item) {
    const items = (item as { items?: unknown }).items;
    return Array.isArray(items) ? (items as T[]) : [];
  }
  return Array.isArray(item) ? (item as T[]) : [];
}

export async function readItem<T>(response: Response): Promise<T | null> {
  return unwrapItem<T>(await response.json());
}

export async function readArray<T>(response: Response): Promise<T[]> {
  return unwrapArray<T>(await response.json());
}
