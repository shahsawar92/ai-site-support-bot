/**
 * Per-visitor usage limit, so a public demo can't run up the AI bill.
 *
 * Uses Upstash Redis (REST) when UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are set, which is shared across all serverless
 * instances. Without them it falls back to an in-memory window per instance,
 * which is good enough for local development and light traffic.
 */

type Result = { ok: boolean; remaining: number; resetSeconds: number };

const memory = new Map<string, { count: number; resetAt: number }>();

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "local";
}

export async function rateLimit(
  key: string,
  limit = Number(process.env.RATE_LIMIT_PER_HOUR ?? 20),
  windowSeconds = 3600,
): Promise<Result> {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (url && token) {
    const redisKey = `rl:${key}`;
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, String(windowSeconds), "NX"],
        ["TTL", redisKey],
      ]),
      cache: "no-store",
    });
    if (res.ok) {
      const [incr, , ttl] = (await res.json()) as { result: number }[];
      const count = incr.result;
      return { ok: count <= limit, remaining: Math.max(0, limit - count), resetSeconds: ttl.result };
    }
    // If Redis is down, fall through to the in-memory limiter rather than failing open.
  }

  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { ok: true, remaining: limit - 1, resetSeconds: windowSeconds };
  }
  entry.count += 1;
  return {
    ok: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetSeconds: Math.ceil((entry.resetAt - now) / 1000),
  };
}

export function limitResponse(r: Result) {
  const minutes = Math.max(1, Math.ceil(r.resetSeconds / 60));
  return Response.json(
    { error: `You've used this demo's hourly limit. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.` },
    { status: 429, headers: { "Retry-After": String(r.resetSeconds) } },
  );
}
