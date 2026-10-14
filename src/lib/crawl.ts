import * as cheerio from "cheerio";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type Page = { url: string; title: string; text: string };

const MAX_PAGES = Number(process.env.CRAWL_MAX_PAGES ?? 15);
const MAX_BYTES = 1_500_000;
const UA = "SiteSupportBot/1.0 (+https://shahsawar.dev)";

export class CrawlError extends Error {}

/** Blocks localhost, private and link-local ranges so the crawler can't be pointed at internal services. */
function privateIp(ip: string): boolean {
  if (ip.includes(":")) {
    const v = ip.toLowerCase();
    return v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || (v.startsWith("::ffff:") && privateIp(v.slice(7)));
  }
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

async function assertPublic(url: URL) {
  // Escape hatch for crawling a local test server. Never set this in production.
  if (process.env.ALLOW_PRIVATE_CRAWL === "1") return;
  if (!["http:", "https:"].includes(url.protocol)) throw new CrawlError("Only http and https URLs are allowed.");
  if (url.port && !["80", "443"].includes(url.port)) throw new CrawlError("Only standard ports are allowed.");
  const host = url.hostname;
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new CrawlError("That address isn't public.");
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => []);
  if (addrs.length === 0) throw new CrawlError("That domain doesn't resolve.");
  if (addrs.some((a) => privateIp(a.address))) throw new CrawlError("That address isn't public.");
}

export function normalizeUrl(input: string): URL {
  let s = input.trim();
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    u.hash = "";
    return u;
  } catch {
    throw new CrawlError("That doesn't look like a URL.");
  }
}

async function fetchHtml(url: URL): Promise<string | null> {
  await assertPublic(url);
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html" },
    redirect: "manual",
    signal: AbortSignal.timeout(7000),
  }).catch(() => null);
  if (!res) return null;
  if (res.status >= 300 && res.status < 400) {
    // Follow at most one redirect per page, re-checking the target.
    const loc = res.headers.get("location");
    if (!loc) return null;
    const next = new URL(loc, url);
    if (next.hostname.replace(/^www\./, "") !== url.hostname.replace(/^www\./, "")) return null;
    await assertPublic(next);
    const r2 = await fetch(next, { headers: { "User-Agent": UA }, redirect: "error", signal: AbortSignal.timeout(7000) }).catch(() => null);
    return r2?.ok && (r2.headers.get("content-type") ?? "").includes("text/html") ? readCapped(r2) : null;
  }
  if (!res.ok || !(res.headers.get("content-type") ?? "").includes("text/html")) return null;
  return readCapped(res);
}

async function readCapped(res: Response) {
  const reader = res.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) {
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

async function disallowed(origin: string): Promise<string[]> {
  const res = await fetch(`${origin}/robots.txt`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(4000) }).catch(() => null);
  if (!res?.ok) return [];
  const rules: string[] = [];
  let applies = false;
  for (const line of (await res.text()).split("\n")) {
    const [k, ...rest] = line.split(":");
    const key = k.trim().toLowerCase();
    const val = rest.join(":").trim();
    if (key === "user-agent") applies = val === "*";
    else if (applies && key === "disallow" && val) rules.push(val);
  }
  return rules;
}

function extract(html: string, url: URL) {
  const $ = cheerio.load(html);
  const title = ($("title").first().text() || $("h1").first().text() || url.pathname).trim().slice(0, 120);
  const links = $("a[href]")
    .map((_, a) => $(a).attr("href"))
    .get()
    .map((h) => {
      try {
        const u = new URL(h, url);
        u.hash = "";
        u.search = "";
        return u;
      } catch {
        return null;
      }
    })
    .filter((u): u is URL => !!u);
  $("script, style, noscript, svg, iframe, template, form, [aria-hidden=true]").remove();
  const root = $("main").length ? $("main") : $("body");
  const blocks: string[] = [];
  root.find("h1, h2, h3, h4, p, li, td, th, dt, dd, blockquote, pre").each((_, el) => {
    const t = $(el).clone().children("ul, ol").remove().end().text().replace(/\s+/g, " ").trim();
    if (t.length > 1) blocks.push(/^h\d$/i.test(el.tagName) ? `## ${t}` : t);
  });
  let text = [...new Set(blocks)].join("\n");
  if (blocks.length === 0) text = root.text().replace(/\s+/g, " ").trim();
  return { title, text, links };
}

const SKIP = /\.(pdf|jpe?g|png|gif|webp|svg|zip|mp4|mp3|css|js|xml|json)$/i;

export async function crawl(start: string, onPage?: (n: number) => void): Promise<Page[]> {
  const root = normalizeUrl(start);
  await assertPublic(root);
  const host = root.hostname.replace(/^www\./, "");
  const rules = await disallowed(root.origin);
  const seen = new Set<string>([root.href]);
  const queue: URL[] = [root];
  const pages: Page[] = [];
  const deadline = Date.now() + 25_000;

  while (queue.length && pages.length < MAX_PAGES && Date.now() < deadline) {
    const batch = queue.splice(0, 4);
    const results = await Promise.all(batch.map(async (u) => ({ u, html: await fetchHtml(u).catch(() => null) })));
    for (const { u, html } of results) {
      if (!html || pages.length >= MAX_PAGES) continue;
      const { title, text, links } = extract(html, u);
      if (text.length > 80) {
        pages.push({ url: u.href, title, text: text.slice(0, 20_000) });
        onPage?.(pages.length);
      }
      for (const l of links) {
        if (l.hostname.replace(/^www\./, "") !== host || SKIP.test(l.pathname)) continue;
        if (rules.some((r) => l.pathname.startsWith(r))) continue;
        if (!seen.has(l.href) && seen.size < 200) {
          seen.add(l.href);
          queue.push(l);
        }
      }
    }
  }
  if (pages.length === 0) throw new CrawlError("Couldn't read any pages on that site. It may block bots or need JavaScript to render.");
  return pages;
}
