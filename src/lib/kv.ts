/**
 * Tiny key-value store. Uses Upstash Redis over REST when configured (the
 * Vercel marketplace integration sets KV_REST_API_URL / KV_REST_API_TOKEN),
 * otherwise an in-memory map that only lives as long as one server process.
 */

// Kept on globalThis so route handlers and pages (bundled separately) share one map.
const g = globalThis as unknown as { __kvMemory?: Map<string, { value: string; expiresAt: number }> };
const memory = (g.__kvMemory ??= new Map());

function creds() {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

export const persistent = () => creds() !== null;

async function redis(command: (string | number)[]) {
  const c = creds()!;
  const res = await fetch(c.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Redis error ${res.status}`);
  return ((await res.json()) as { result: unknown }).result;
}

export async function kvSet(key: string, value: unknown, ttlSeconds: number) {
  const json = JSON.stringify(value);
  if (creds()) {
    await redis(["SET", key, json, "EX", ttlSeconds]);
    return;
  }
  memory.set(key, { value: json, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function kvGet<T>(key: string): Promise<T | null> {
  if (creds()) {
    const raw = (await redis(["GET", key])) as string | null;
    return raw ? (JSON.parse(raw) as T) : null;
  }
  const hit = memory.get(key);
  if (!hit || hit.expiresAt < Date.now()) return null;
  return JSON.parse(hit.value) as T;
}
