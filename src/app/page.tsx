import { BuildForm } from "@/components/BuildForm";
import { Integrate } from "@/components/Integrate";
import { Footer, Header } from "@/components/Chrome";
import { APP } from "@/app.config";

export default function Page() {
  return (
    <>
      <Header app={APP.name} repo={APP.repo} />
      <main className="flex-1">
        <section className="grid-bg border-b border-line">
          <div className="mx-auto max-w-3xl px-4 pt-14 pb-16 text-center sm:px-6 sm:pt-20">
            <p className="label inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Live demo · RAG with citations
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
              Your website,{" "}
              <span className="font-serif font-normal italic text-accent-ink">answering questions.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
              Paste a URL. The bot reads your pages, answers visitors from them alone, cites the page it used, and says so
              when the answer isn&apos;t there. Embed it with one script tag.
            </p>
            <div className="mt-8 text-left">
              <BuildForm />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="label">How it works</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Retrieval first, then a model that&apos;s only allowed to quote</h2>
          <ol className="mt-6 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Crawl", "Up to 15 same-site pages, respecting robots.txt, with private and internal addresses blocked so it can't be aimed at a server's own network."],
              ["Chunk and embed", "Pages split into passages under their headings, embedded with Gemini embeddings and stored with the bot."],
              ["Hybrid search", "Each question is matched by meaning (cosine similarity) plus exact words, so prices, names and SKUs still hit."],
              ["Answer with proof", "The model may only use the retrieved passages and must cite them. Citations to passages that don't exist are stripped in code."],
            ].map(([t, d], i) => (
              <li key={t} className="bg-panel p-5">
                <p className="font-mono text-xs text-accent-ink">0{i + 1}</p>
                <p className="mt-2 font-medium">{t}</p>
                <p className="mt-1.5 text-sm text-muted">{d}</p>
              </li>
            ))}
          </ol>
        </section>
        <Integrate
          c={{
            title: "Add it to your website in two minutes",
            intro: "Build your bot above and paste one line of code. It answers visitors from your own pages, links to the page it used, and says so honestly when the answer isn't there.",
            options: [
              { name: "Paste one script tag", tag: "Works today", detail: "Copy the snippet from your bot's page and paste it before </body>. It works on WordPress, Shopify, Webflow, Wix, Squarespace and plain HTML. A chat button appears in the corner." },
              { name: "Teach it more than your website", detail: "Add PDFs, help-centre articles, product catalogues or internal FAQs, and keep it in sync by re-reading your site on a schedule." },
              { name: "Hand over to a person", detail: "When it can't answer, it can collect the visitor's email or open a WhatsApp chat, so no question is lost." },
              { name: "Your branding and insights", detail: "Your colours, name and greeting, plus a report of the questions people ask most and the ones it couldn't answer." },
            ],
            needs: ["Your website address", "Any documents it should know beyond the site", "Where unanswered questions should go (email, WhatsApp or helpdesk)"],
            timeline: "The basic widget is instant. A custom version with your documents and handover takes about a week.",
          }}
        />
      </main>
      <Footer note="Demo with a per-visitor limit · bots are deleted after 7 days" />
    </>
  );
}
