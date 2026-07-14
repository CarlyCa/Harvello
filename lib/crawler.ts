import * as cheerio from "cheerio";
import pdf from "pdf-parse";
import { canonicalUrl, isBlockedPath, isInternalUrl } from "./url";
import { cleanText } from "./text";
import type { IndexedSource } from "./types";
import { createId } from "./ids";

const MAX_PAGES = 125;
const MAX_PDFS = 20;
const MAX_DEPTH = 4;
const MAX_PDF_BYTES = 6 * 1024 * 1024;
const MAX_CRAWL_MS = 90_000;
const FETCH_TIMEOUT_MS = 10_000;
const MAX_SITEMAP_URLS = 200;

type CrawlProgress = (message: string, progress: number) => void;

export async function crawlWebsite(root: URL, onProgress?: CrawlProgress) {
  const visited = new Set<string>();
  const queue: Array<{ url: URL; depth: number }> = [{ url: root, depth: 0 }];
  const sources: IndexedSource[] = [];
  let pdfCount = 0;
  const startedAt = Date.now();
  const allowedByRobots = await loadRobots(root);

  onProgress?.("Finding public pages", 18);
  const sitemapUrls = await discoverSitemapUrls(root, allowedByRobots);
  for (const sitemapUrl of sitemapUrls) {
    queue.push({ url: sitemapUrl, depth: 1 });
  }

  while (queue.length > 0 && sources.filter((source) => source.type === "webpage").length < MAX_PAGES) {
    if (Date.now() - startedAt > MAX_CRAWL_MS) break;
    const item = queue.shift();
    if (!item || item.depth > MAX_DEPTH) continue;
    const normalized = canonicalUrl(item.url);
    if (visited.has(normalized) || isBlockedPath(item.url) || !allowedByRobots(item.url)) continue;
    visited.add(normalized);

    const response = await safeFetch(item.url);
    if (!response) continue;
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/pdf") || item.url.pathname.toLowerCase().endsWith(".pdf")) {
      if (pdfCount >= MAX_PDFS) continue;
      const source = await extractPdf(item.url, response);
      if (source) {
        sources.push(source);
        pdfCount += 1;
        onProgress?.("Processing PDFs", Math.min(70, 28 + sources.length));
      }
      continue;
    }

    if (!contentType.includes("text/html")) continue;
    const html = await response.text();
    const { source, links } = extractHtml(item.url, html, root);
    if (source.text.length > 250) {
      sources.push(source);
      onProgress?.("Reading program and facility information", Math.min(62, 24 + sources.length));
    }

    if (item.depth < MAX_DEPTH) {
      for (const link of links) {
        const linkKey = canonicalUrl(link);
        if (!visited.has(linkKey)) queue.push({ url: link, depth: item.depth + 1 });
      }
    }
  }

  return sources.slice(0, MAX_PAGES + MAX_PDFS);
}

async function safeFetch(url: URL) {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "HarvelloBot/0.1 (+https://harvello.local)" },
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    });
    if (!response.ok) return null;
    return response;
  } catch {
    return null;
  }
}

function extractHtml(url: URL, html: string, root: URL) {
  const $ = cheerio.load(html);
  $("script, style, noscript, svg, iframe, form, nav, footer, header").remove();
  const title = cleanText($("title").first().text() || $("h1").first().text() || url.hostname);
  const description = cleanText($('meta[name="description"]').attr("content") ?? "");
  const text = cleanText($("main").text() || $("body").text());
  const links: URL[] = [];

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    try {
      const candidate = new URL(href, url);
      if (candidate.protocol !== "https:" && candidate.protocol !== "http:") return;
      if (!isInternalUrl(candidate, root) || isBlockedPath(candidate)) return;
      const tooManyParams = Array.from(candidate.searchParams.keys()).length > 3;
      if (tooManyParams) return;
      links.push(candidate);
    } catch {
      // Ignore malformed links.
    }
  });

  return {
    source: {
      id: createId("src"),
      url: canonicalUrl(url),
      title: title || url.toString(),
      description,
      type: "webpage" as const,
      text
    },
    links
  };
}

async function discoverSitemapUrls(root: URL, allowedByRobots: (url: URL) => boolean) {
  const sitemapQueue = await discoverSitemapLocations(root);
  const seenSitemaps = new Set<string>();
  const found = new Map<string, URL>();

  while (sitemapQueue.length && found.size < MAX_SITEMAP_URLS) {
    const sitemapUrl = sitemapQueue.shift();
    if (!sitemapUrl) continue;
    const sitemapKey = canonicalUrl(sitemapUrl);
    if (seenSitemaps.has(sitemapKey)) continue;
    seenSitemaps.add(sitemapKey);

    const response = await safeFetch(sitemapUrl);
    if (!response) continue;
    const text = await response.text();
    const $ = cheerio.load(text, { xmlMode: true });

    $("sitemap loc").each((_, element) => {
      if (sitemapQueue.length + seenSitemaps.size > 25) return;
      const loc = $(element).text().trim();
      if (!loc) return;
      try {
        const candidate = new URL(loc, root);
        if (isInternalUrl(candidate, root)) sitemapQueue.push(candidate);
      } catch {
        // Ignore malformed sitemap locations.
      }
    });

    $("url loc").each((_, element) => {
      if (found.size >= MAX_SITEMAP_URLS) return;
      const loc = $(element).text().trim();
      if (!loc) return;
      try {
        const candidate = new URL(loc, root);
        if (!isInternalUrl(candidate, root) || isBlockedPath(candidate) || !allowedByRobots(candidate)) return;
        found.set(canonicalUrl(candidate), candidate);
      } catch {
        // Ignore malformed sitemap entries.
      }
    });
  }

  return Array.from(found.values()).sort((a, b) => pagePriority(a) - pagePriority(b));
}

async function discoverSitemapLocations(root: URL) {
  const locations = new Map<string, URL>();
  const defaultSitemap = new URL("/sitemap.xml", root);
  locations.set(canonicalUrl(defaultSitemap), defaultSitemap);

  const robotsUrl = new URL("/robots.txt", root);
  const response = await safeFetch(robotsUrl);
  if (!response) return Array.from(locations.values());

  const text = await response.text();
  for (const line of text.split("\n")) {
    const trimmed = line.split("#")[0].trim();
    if (!/^sitemap:/i.test(trimmed)) continue;
    const loc = trimmed.split(":").slice(1).join(":").trim();
    if (!loc) continue;
    try {
      const candidate = new URL(loc, root);
      if (isInternalUrl(candidate, root)) locations.set(canonicalUrl(candidate), candidate);
    } catch {
      // Ignore malformed sitemap declarations.
    }
  }

  return Array.from(locations.values());
}

function pagePriority(url: URL) {
  const path = url.pathname.toLowerCase();
  const priorities = [
    "program",
    "event",
    "calendar",
    "register",
    "registration",
    "facility",
    "park",
    "pool",
    "aquatic",
    "camp",
    "rental",
    "hours",
    "contact",
    "faq"
  ];
  const index = priorities.findIndex((term) => path.includes(term));
  return index === -1 ? priorities.length : index;
}

async function extractPdf(url: URL, response: Response) {
  const size = Number(response.headers.get("content-length") ?? 0);
  if (size > MAX_PDF_BYTES) return null;
  try {
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > MAX_PDF_BYTES) return null;
    const parsed = await pdf(buffer);
    const text = cleanText(parsed.text);
    if (text.length < 250) return null;
    return {
      id: createId("src"),
      url: canonicalUrl(url),
      title: cleanText(parsed.info?.Title || url.pathname.split("/").pop() || "PDF document"),
      type: "pdf" as const,
      text
    };
  } catch {
    return null;
  }
}

async function loadRobots(root: URL) {
  const disallowed: string[] = [];
  try {
    const robotsUrl = new URL("/robots.txt", root);
    const response = await safeFetch(robotsUrl);
    if (response) {
      const text = await response.text();
      let applies = false;
      for (const line of text.split("\n")) {
        const trimmed = line.split("#")[0].trim();
        if (/^user-agent:/i.test(trimmed)) {
          const agent = trimmed.split(":")[1]?.trim();
          applies = agent === "*" || /harvello/i.test(agent);
        }
        if (applies && /^disallow:/i.test(trimmed)) {
          const path = trimmed.split(":").slice(1).join(":").trim();
          if (path) disallowed.push(path);
        }
      }
    }
  } catch {
    // Robots handling is best-effort for the demo crawler.
  }
  return (url: URL) => !disallowed.some((path) => path !== "/" && url.pathname.startsWith(path));
}
