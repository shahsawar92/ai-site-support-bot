import { notFound } from "next/navigation";
import { BotChat } from "@/components/BotChat";
import { kvGet } from "@/lib/kv";
import type { Bot } from "@/lib/rag";

// Bots are looked up per request, so this route renders on demand.
export const instant = false;

export default async function EmbedPage({ params }: PageProps<"/embed/[id]">) {
  const { id } = await params;
  const bot = await kvGet<Bot>(`bot:${id}`);
  if (!bot) notFound();
  return (
    <div className="h-dvh bg-panel">
      <BotChat botId={bot.id} botName={bot.name} compact suggestions={["What do you offer?", "How can I contact you?"]} />
    </div>
  );
}
