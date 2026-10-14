export type IntegrateContent = {
  title: string;
  intro: string;
  options: { name: string; detail: string; tag?: string }[];
  needs: string[];
  timeline: string;
};

const SITE = "https://shahsawar.dev";

/** "Use this in your business": how a client gets their own version, shown on every demo page. */
export function Integrate({ c }: { c: IntegrateContent }) {
  return (
    <section id="integrate" className="border-y border-line bg-panel">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <p className="label">Use this in your business</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{c.title}</h2>
            <p className="mt-3 max-w-2xl text-muted">{c.intro}</p>
            <ol className="mt-8 space-y-px overflow-hidden rounded-xl border border-line bg-line">
              {c.options.map((o, i) => (
                <li key={o.name} className="grid grid-cols-[40px_minmax(0,1fr)] gap-3 bg-paper p-5">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-ink font-mono text-xs text-paper">{i + 1}</span>
                  <div>
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      {o.name}
                      {o.tag && <span className="rounded-full bg-accent-soft px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent-ink">{o.tag}</span>}
                    </p>
                    <p className="mt-1 text-sm text-muted">{o.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <aside className="h-fit space-y-5 rounded-2xl bg-ink p-6 text-paper">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-console-muted">What I need from you</p>
              <ul className="mt-3 space-y-2 text-sm">
                {c.needs.map((n) => (
                  <li key={n} className="flex gap-2">
                    <span className="text-accent">→</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-console-line pt-4">
              <p className="font-mono text-[11px] uppercase tracking-widest text-console-muted">Typical timeline</p>
              <p className="mt-2 text-sm">{c.timeline}</p>
            </div>
            <a href={SITE} className="block rounded-lg bg-accent py-2.5 text-center font-medium text-ink hover:bg-paper">
              Talk to me about your setup
            </a>
            <p className="text-xs text-console-muted">
              This page is a demo. Your version runs on your own accounts and data, with your branding.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
