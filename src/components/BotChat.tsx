"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; text: string; sources?: Source[]; answered?: boolean; withheld?: boolean; ms?: number };
type Source = { n: number; url: string; title: string; snippet: string; score: number };

export function BotChat({ botId, botName, suggestions = [], compact = false }: { botId: string; botName: string; suggestions?: string[]; compact?: boolean }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next: Msg[] = [...messages, { role: "user", text: q.slice(0, 600) }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/bots/${botId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map(({ role, text }) => ({ role, text })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setMessages([...next, { role: "assistant", text: data.answer, sources: data.sources, answered: data.answered, withheld: data.withheld, ms: data.ms }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setMessages(messages);
      setInput(q);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`flex h-full flex-col ${compact ? "" : "rounded-2xl border border-line bg-panel"}`}>
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-accent font-semibold text-ink">{botName.slice(0, 1).toUpperCase()}</div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{botName} support</p>
          <p className="text-xs text-muted">Answers only from this website</p>
        </div>
      </div>

      <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted">Hi! Ask me anything about {botName}.</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-line px-2.5 py-1 text-left text-xs text-muted hover:border-accent hover:text-ink">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="rise flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-3 py-2 text-sm text-paper">{m.text}</p>
            </div>
          ) : (
            <div key={i} className="rise max-w-[92%] space-y-2">
              <p className="rounded-2xl rounded-bl-md border border-line bg-paper px-3 py-2 text-sm leading-relaxed">
                {renderCitations(m.text)}
              </p>
              {m.withheld && (
                <p className="font-mono text-[11px] text-warn">model answered without a source · blocked</p>
              )}
              {m.sources && m.sources.length > 0 && (
                <ol className="space-y-1">
                  {m.sources.map((s) => (
                    <li key={s.n}>
                      <a href={s.url} target="_blank" rel="noreferrer" className="group flex gap-2 rounded-lg border border-line bg-panel px-2.5 py-1.5 text-xs hover:border-accent">
                        <span className="font-mono text-accent-ink">[{s.n}]</span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium group-hover:underline">{s.title}</span>
                          <span className="block truncate text-faint">{s.url.replace(/^https?:\/\//, "")}</span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ),
        )}
        {busy && <p className="text-sm text-muted"><span className="blink">Searching the site…</span></p>}
      </div>

      <div className="border-t border-line p-3">
        {error && <p className="mb-2 rounded-md bg-bad-soft px-2 py-1.5 text-xs text-bad">{error}</p>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={600}
            placeholder="Ask a question"
            className="min-w-0 flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button disabled={busy || !input.trim()} className="rounded-lg bg-accent px-4 text-sm font-medium text-ink hover:bg-accent-ink hover:text-paper disabled:opacity-40">
            Ask
          </button>
        </form>
        {compact && (
          <p className="mt-2 text-center text-[10px] text-faint">
            AI answers from this site&apos;s pages · <a href="https://shahsawar.dev" target="_blank" rel="noreferrer" className="underline">built by Shah Sawar</a>
          </p>
        )}
      </div>
    </div>
  );
}

function renderCitations(text: string) {
  return text.split(/(\[\d+\])/g).map((part, i) =>
    /^\[\d+\]$/.test(part) ? (
      <sup key={i} className="ml-0.5 font-mono text-[10px] text-accent-ink">{part}</sup>
    ) : (
      part
    ),
  );
}
