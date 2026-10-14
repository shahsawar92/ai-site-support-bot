import { z } from "zod";
import { aiErrorResponse } from "@/lib/gemini";
import { kvGet } from "@/lib/kv";
import { answer, type Bot } from "@/lib/rag";
import { clientIp, limitResponse, rateLimit } from "@/lib/ratelimit";

export const maxDuration = 30;

const Body = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().min(1).max(600) }))
    .min(1)
    .max(30),
});

export async function POST(req: Request, ctx: RouteContext<"/api/bots/[id]/chat">) {
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success || parsed.data.messages.at(-1)!.role !== "user") {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const limit = await rateLimit(`chat:${clientIp(req)}`, Number(process.env.RATE_LIMIT_PER_HOUR ?? 30));
  if (!limit.ok) return limitResponse(limit);

  const bot = await kvGet<Bot>(`bot:${id}`);
  if (!bot) return Response.json({ error: "This bot has expired or doesn't exist. Build a new one." }, { status: 404 });

  try {
    return Response.json(await answer(bot, parsed.data.messages));
  } catch (err) {
    return aiErrorResponse(err);
  }
}
