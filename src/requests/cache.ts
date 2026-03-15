type CacheEntry = {
  expiresAt: number;
  response?: Response;
  promise?: Promise<Response>;
};

type CachedFetchOptions = {
  ttlMs?: number;
};

const DEFAULT_TTL_MS = 30_000;
const requestCache = new Map<string, CacheEntry>();

function normalizeHeaders(headers?: HeadersInit): string {
  if (!headers) return "";

  if (headers instanceof Headers) {
    return Array.from(headers.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join("|");
  }

  if (Array.isArray(headers)) {
    return [...headers]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join("|");
  }

  return Object.entries(headers)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join("|");
}

function getCacheKey(input: RequestInfo | URL, init?: RequestInit): string {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const method = init?.method ?? "GET";
  const credentials = init?.credentials ?? "";
  const headers = normalizeHeaders(init?.headers);

  return [method, url, credentials, headers].join("::");
}

export async function cachedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: CachedFetchOptions,
): Promise<Response> {
  const method = (init?.method ?? "GET").toUpperCase();
  if (method !== "GET") {
    return fetch(input, init);
  }

  const now = Date.now();
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const key = getCacheKey(input, init);
  const cached = requestCache.get(key);

  if (cached && cached.response && cached.expiresAt > now) {
    return cached.response.clone();
  }

  if (cached?.promise) {
    const response = await cached.promise;
    return response.clone();
  }

  const promise = fetch(input, init).then((response) => {
    if (response.ok) {
      requestCache.set(key, {
        expiresAt: Date.now() + ttlMs,
        response: response.clone(),
      });
    } else {
      requestCache.delete(key);
    }

    return response;
  }).catch((error) => {
    requestCache.delete(key);
    throw error;
  });

  requestCache.set(key, {
    expiresAt: now + ttlMs,
    promise,
  });

  const response = await promise;
  return response.clone();
}

export function invalidateRequestCache(match?: string | RegExp | ((key: string) => boolean)) {
  if (!match) {
    requestCache.clear();
    return;
  }

  for (const key of requestCache.keys()) {
    const shouldDelete =
      typeof match === "string"
        ? key.includes(match)
        : match instanceof RegExp
          ? match.test(key)
          : match(key);

    if (shouldDelete) {
      requestCache.delete(key);
    }
  }
}
