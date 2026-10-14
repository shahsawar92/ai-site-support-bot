"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const EXAMPLES = ["htmx.org", "basecamp.com", "paulgraham.com"];
const STAGES = ["Checking the site is public", "Reading robots.txt", "Crawling pages", "Splitting text into passages", "Embedding passages", "Saving your bot"];

export function BuildForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!busy) return;
    setStage(0);
    // The server does all of this in one request; the stages just show roughly where it is.
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 2600);
    return () => clearInterval(t);
  }, [busy]);

  async function build(target: string) {
    if (!target.trim() || busy) return;
    setUrl(target);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/bots", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: target }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      router.push(`/bot/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-panel p-2 shadow-[0_24px_48px_-28px_rgba(23,20,15,0.3)]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          build(url);
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <div className="flex min-w-0 flex-1 items-center rounded-xl bg-paper px-3 focus-within:ring-2 focus-within:ring-accent">
          <span className="font-mono text-sm text-faint">https://</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value.replace(/^https?:\/\//, ""))}
            placeholder="yourwebsite.com"
            disabled={busy}
            aria-label="Website URL"
            className="min-w-0 flex-1 bg-transparent px-1 py-3.5 outline-none"
          />
        </div>
        <button disabled={busy || !url.trim()} className="rounded-xl bg-ink px-6 py-3.5 font-medium text-paper hover:bg-accent-ink disabled:opacity-50">
          {busy ? "Building…" : "Build my bot"}
        </button>
      </form>

      {busy ? (
        <ol className="space-y-1.5 px-3 py-4 font-mono text-xs">
          {STAGES.map((s, i) => (
            <li key={s} className={i < stage ? "text-good" : i === stage ? "text-ink" : "text-faint"}>
              {i < stage ? "✓" : i === stage ? <span className="blink">●</span> : "○"} {s}
            </li>
          ))}
        </ol>
      ) : (
        <div className="flex flex-wrap items-center gap-2 px-3 py-3 text-sm">
          <span className="text-muted">Try:</span>
          {EXAMPLES.map((e) => (
            <button key={e} onClick={() => build(e)} className="rounded-full border border-line px-3 py-1 font-mono text-xs hover:border-accent">
              {e}
            </button>
          ))}
        </div>
      )}
      {error && <p className="mx-3 mb-3 rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}
    </div>
  );
}
