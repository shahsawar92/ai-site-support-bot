import { z } from "zod";
import { CrawlError, crawl } from "@/lib/crawl";
import { aiErrorResponse } from "@/lib/gemini";
import { kvSet, persistent } from "@/lib/kv";
import { chunkPages, embed, type Bot } from "@/lib/rag";
import { clientIp, limitResponse, rateLimit } from "@/lib/ratelimit";

export const maxDuration = 60;

const TTL_DAYS = 7;

export async function POST(req: Request) {
  const parsed = z.object({ url: z.string().min(3).max(300) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter a website URL." }, { status: 400 });

  // Building a bot crawls and embeds a whole site, so it gets a much tighter limit than chatting.
  const limit = await rateLimit(`build:${clientIp(req)}`, Number(process.env.BUILDS_PER_HOUR ?? 3));
  if (!limit.ok) return limitResponse(limit);

  try {
    const pages = await crawl(parsed.data.url);
    const pieces = chunkPages(pages);
    const vecs = await embed(pieces.map((p) => `${p.title}\n${p.text}`), "RETRIEVAL_DOCUMENT");
    const site = new URL(pages[0].url).hostname.replace(/^www\./, "");
    const bot: Bot = {
      id: crypto.randomUUID().replace(/-/g, "").slice(0, 12),
      site,
      name: pages[0].title.split(/[|\-–—:]/)[0].trim() || site,
      createdAt: Date.now(),
      pages: pages.map(({ url, title }) => ({ url, title })),
      chunks: pieces.map((p, i) => ({ ...p, id: i, vec: vecs[i] })),
    };
    await kvSet(`bot:${bot.id}`, bot, TTL_DAYS * 86400);
    return Response.json({
      id: bot.id,
      site: bot.site,
      name: bot.name,
      pages: bot.pages,
      chunks: bot.chunks.length,
      expiresInDays: TTL_DAYS,
      persistent: persistent(),
    });
  } catch (err) {
    if (err instanceof CrawlError) return Response.json({ error: err.message }, { status: 422 });
    return aiErrorResponse(err);
  }
}
