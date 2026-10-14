import Link from "next/link";

const SITE = "https://shahsawar.dev";

export function Header({ app, repo }: { app: string; repo: string }) {
  return (
    <header className="border-b border-line bg-paper/90 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <a href={SITE} className="flex items-center gap-2 shrink-0" aria-label="Shah Sawar, home">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-ink font-mono text-[11px] font-semibold text-paper">
              SS
            </span>
            <span className="hidden font-medium sm:inline">Shah Sawar</span>
          </a>
          <span className="text-faint">/</span>
          <span className="label hidden sm:inline">AI Lab</span>
          <span className="text-faint hidden sm:inline">/</span>
          <Link href="/" className="truncate font-medium">{app}</Link>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <a
            href={`https://github.com/shahsawar92/${repo}`}
            className="rounded-md px-3 py-1.5 text-muted hover:text-ink"
            target="_blank"
            rel="noreferrer"
          >
            Source
          </a>
          <a
            href={SITE}
            className="whitespace-nowrap rounded-md bg-ink px-3 py-1.5 font-medium text-paper hover:bg-accent-ink"
          >
            Hire me
          </a>
        </nav>
      </div>
    </header>
  );
}

export function Footer({ note = "Demo with a per-visitor hourly limit · no data is stored" }: { note?: string }) {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          Built by <a href={SITE} className="text-ink underline decoration-accent underline-offset-4">Shah Sawar</a>, AI product engineer.
        </p>
        <p className="font-mono text-xs">{note}</p>
      </div>
    </footer>
  );
}

export function Hero({ kicker, title, accent, children }: { kicker: string; title: string; accent: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-10 pb-6 sm:px-6 sm:pt-14">
      <p className="label flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        {kicker}
      </p>
      <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
        {title} <span className="font-serif font-normal italic text-accent-ink">{accent}</span>
      </h1>
      <div className="mt-4 max-w-2xl text-base text-muted sm:text-lg">{children}</div>
    </section>
  );
}
