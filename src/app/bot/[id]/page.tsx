import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { BotChat } from "@/components/BotChat";
import { Footer, Header } from "@/components/Chrome";
import { CopyBox } from "@/components/CopyBox";
import { APP } from "@/app.config";
import { kvGet } from "@/lib/kv";
import type { Bot } from "@/lib/rag";

// Bots are looked up per request, so this route renders on demand.
export const instant = false;

export default async function BotPage({ params }: PageProps<"/bot/[id]">) {
  const { id } = await params;
  const bot = await kvGet<Bot>(`bot:${id}`);
  if (!bot) notFound();

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const snippet = `<script src="${origin}/widget.js" data-bot="${bot.id}" defer></script>`;
  const expires = new Date(bot.createdAt + 7 * 86400_000).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const words = bot.chunks.reduce((n, c) => n + c.text.split(/\s+/).length, 0);

  return (
    <>
      <Header app={APP.name} repo={APP.repo} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <p className="label">Your bot is ready</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {bot.name} <span className="font-mono text-base font-normal text-muted">· {bot.site}</span>
        </h1>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-muted">
          <span>{bot.pages.length} pages</span>
          <span>{bot.chunks.length} passages</span>
          <span>~{words.toLocaleString()} words indexed</span>
          <span>expires {expires}</span>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="h-[600px]">
            <BotChat
              botId={bot.id}
              botName={bot.name}
              suggestions={["What do you offer?", "How much does it cost?", "How can I contact you?", "What's the capital of France?"]}
            />
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-line bg-panel p-5">
              <p className="font-medium">Add it to your site</p>
              <p className="mt-1 text-sm text-muted">Paste this before <code className="font-mono text-xs">&lt;/body&gt;</code>. A chat button appears in the corner.</p>
              <CopyBox text={snippet} />
              <a href={`/embed/${bot.id}`} target="_blank" className="mt-3 inline-block text-sm text-accent-ink underline underline-offset-4">
                Open the widget on its own
              </a>
            </div>

            <div className="rounded-2xl border border-line bg-panel p-5">
              <p className="font-medium">Pages it read</p>
              <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto pr-1">
                {bot.pages.map((p) => (
                  <li key={p.url} className="min-w-0">
                    <a href={p.url} target="_blank" rel="noreferrer" className="block truncate text-sm hover:text-accent-ink">{p.title}</a>
                    <span className="block truncate font-mono text-[11px] text-faint">{new URL(p.url).pathname}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>
      <Footer note="Demo with a per-visitor limit · bots are deleted after 7 days" />
    </>
  );
}
