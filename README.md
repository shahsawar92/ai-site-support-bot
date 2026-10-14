# Site Support Bot

Paste a website URL and get an AI support bot that **answers only from that site**, cites the page it used, says so when the answer isn't there, and embeds anywhere with one script tag.

```html
<script src="https://YOUR-DEPLOYMENT/widget.js" data-bot="BOT_ID" defer></script>
```

## Pipeline

1. **Crawl** (`src/lib/crawl.ts`): up to 15 same-site pages, 4 at a time, respecting `robots.txt`. Private, loopback and link-local addresses are blocked (checked after DNS resolution and on redirects) so the crawler can't be used for SSRF. Responses are capped at 1.5 MB.
2. **Chunk** (`src/lib/rag.ts`): page text is split into ~800-character passages that keep their nearest heading.
3. **Embed**: passages are embedded with `gemini-embedding-001` (256 dimensions, normalised) and stored with the bot in Redis for 7 days.
4. **Retrieve**: hybrid scoring, cosine similarity plus a keyword-overlap boost so exact prices, names and SKUs still match. Follow-up questions include the previous turn.
5. **Answer with proof**: the model may only use the numbered passages and must cite them. In code, citations to passages that don't exist are stripped, and an uncited answer that states facts (numbers, emails, links) is replaced with "I couldn't find that on this website."

Plus per-visitor limits (3 bot builds and 30 questions per hour by default).

## Stack

Next.js (App Router, Cache Components) · TypeScript · Tailwind CSS · Gemini (`@google/genai`, generation and embeddings) · Cheerio · Upstash Redis · Zod · Vercel

## Run locally

```bash
cp .env.example .env.local   # add GEMINI_API_KEY
npm install
npm run dev
```

Built by [Shah Sawar](https://shahsawar.dev).
