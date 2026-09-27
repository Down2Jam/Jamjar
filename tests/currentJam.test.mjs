import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { registerHooks } from "node:module";
import { QueryClient } from "@tanstack/react-query";

// Stub the transport while exercising the real response helper and query cache.
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === "@/requests/jam") {
    return { url: "data:text/javascript,export const getCurrentJam = () => globalThis.fetch();", shortCircuit: true };
  }
  if (specifier.startsWith("@/")) {
    return nextResolve(new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href, context);
  }
  return nextResolve(specifier, context);
} });

const { getCurrentJam } = await import("../src/helpers/jam.ts");
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const active = { phase: "Jamming", jam: { id: 4, name: "Down2Jam 4" }, nextJam: null };

test("reads both enveloped and legacy active jam responses", async () => {
  for (const body of [{ data: active }, active]) {
    globalThis.fetch = async () => Response.json(body);
    assert.deepEqual(await getCurrentJam(), active);
  }
});

test("failed background refreshes preserve cached jam data and recover", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const options = { queryKey: ["jam", "current"], queryFn: getCurrentJam };
  try {
    globalThis.fetch = async () => Response.json({ data: active });
    await client.fetchQuery(options);
    const failures = [
      async () => { throw new TypeError("Failed to fetch"); },
      async () => Response.json({ error: { message: "Unavailable" } }, { status: 503 }),
      async () => Response.json({ message: "Too many requests" }, { status: 429 }),
      async () => new Response("<html>Gateway error</html>"),
      ...[null, {}, { data: null }, { data: { phase: "Jamming" } }].map(body => async () => Response.json(body)),
    ];
    for (const failure of failures) {
      globalThis.fetch = failure;
      await assert.rejects(client.fetchQuery(options));
      assert.deepEqual(client.getQueryData(options.queryKey), active);
      assert.equal(client.getQueryState(options.queryKey).status, "error");
    }
    globalThis.fetch = async () => Response.json({ data: { ...active, phase: "Rating" } });
    assert.equal((await client.fetchQuery(options)).phase, "Rating");
    // A genuine no-active-jam result must still replace the previous jam.
    globalThis.fetch = async () => Response.json({ data: { phase: "No Active Jams" } });
    assert.deepEqual(await client.fetchQuery(options), { phase: "No Active Jams", jam: null, nextJam: null });
  } finally {
    client.clear();
  }
});
