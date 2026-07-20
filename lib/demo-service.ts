import { crawlWebsite } from "./crawler";
import { findRecentDemoByDomain, saveDemo, updateDemo } from "./demo-store";
import { createId, slugify } from "./ids";
import { ingestSources } from "./ingest";
import { inferOrganizationName } from "./text";
import type { DemoRecord, IndexedSource } from "./types";
import { assertPublicWebsite, normalizeWebsiteUrl } from "./url";

const DEMO_TOTAL_BUDGET_MS = 170_000;
const DEMO_PROCESSING_RESERVE_MS = 35_000;
const DEMO_MAX_PAGES = 180;
const DEMO_MAX_PDFS = 25;
const DEMO_MAX_CHUNKS = 900;

const fallbackSources: IndexedSource[] = [
  {
    id: "src_demo_services",
    url: "https://example.org/services",
    title: "Services and Appointments",
    description: "Sample service information",
    type: "webpage",
    text:
      "The organization offers consultations, project support, maintenance plans, and online appointments. Visitors can book available time slots through the website, request a quote, or contact the team for help choosing the right service. Same-day appointments may be available when openings remain."
  },
  {
    id: "src_demo_policies",
    url: "https://example.org/support",
    title: "Support and Policies",
    description: "Sample support information",
    type: "webpage",
    text:
      "Support is available by phone, email, and online form during posted business hours. Common questions include pricing, billing, returns, warranties, cancellations, and account updates. Refund and return policies depend on the service or product purchased and are listed on the website."
  }
];

export async function createDemoFromUrl(input: string) {
  const startedAt = Date.now();
  const totalDeadlineAt = startedAt + DEMO_TOTAL_BUDGET_MS;
  const url = normalizeWebsiteUrl(input);
  await assertPublicWebsite(url);
  const domain = url.hostname.replace(/^www\./, "");
  const recent = await findRecentDemoByDomain(domain);
  if (recent && recent.status === "ready" && recent.pagesIndexed >= 25) return recent;

  const demoId = createId("demo");
  const organizationId = createId("org");
  const createdAt = new Date().toISOString();
  const initial: DemoRecord = {
    id: demoId,
    organizationId,
    organizationName: inferOrganizationName(url.hostname),
    organizationSlug: `${slugify(domain)}-${demoId.slice(-5)}`,
    domain,
    websiteUrl: url.toString(),
    status: "crawling",
    progress: 8,
    message: "Connecting to your website",
    createdAt,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    pagesIndexed: 0,
    pdfsIndexed: 0,
    categories: [],
    suggestedQuestions: [],
    sources: [],
    chunks: []
  };
  await saveDemo(initial);

  try {
    const crawlDeadlineAt = Math.min(totalDeadlineAt - DEMO_PROCESSING_RESERVE_MS, Date.now() + 140_000);
    const sources = await crawlWebsite(url, (message, progress) => {
      void updateDemo(demoId, { message, progress });
    }, {
      deadlineAt: crawlDeadlineAt,
      maxPages: DEMO_MAX_PAGES,
      maxPdfs: DEMO_MAX_PDFS,
      maxCrawlMs: Math.max(30_000, crawlDeadlineAt - Date.now())
    });
    const usableSources = sources.length ? sources : fallbackSources.map((source) => ({ ...source, url: url.toString() }));
    await updateDemo(demoId, { status: "processing", message: "Building your digital front desk", progress: 76 });
    const { chunks, categories, suggestedQuestions } = await ingestSources(usableSources, { maxChunks: DEMO_MAX_CHUNKS });
    const orgName = inferOrganizationName(url.hostname, usableSources[0]?.title);
    return (await updateDemo(demoId, {
      organizationName: orgName,
      status: "ready",
      progress: 100,
      message: "Preparing suggested questions",
      pagesIndexed: usableSources.filter((source) => source.type === "webpage").length,
      pdfsIndexed: usableSources.filter((source) => source.type === "pdf").length,
      categories,
      suggestedQuestions: suggestedQuestions.length
        ? suggestedQuestions
        : ["What services are available?", "How do I book an appointment?", "What is the return policy?"],
      sources: usableSources,
      chunks
    }))!;
  } catch (error) {
    return (await updateDemo(demoId, {
      status: "failed",
      progress: 100,
      message: "The demo could not be generated",
      error: error instanceof Error ? error.message : "Unknown crawl error"
    }))!;
  }
}
