import { crawlWebsite } from "./crawler";
import { findRecentDemoByDomain, saveDemo, updateDemo } from "./demo-store";
import { createId, slugify } from "./ids";
import { ingestSources } from "./ingest";
import { inferOrganizationName } from "./text";
import type { DemoRecord, IndexedSource } from "./types";
import { assertPublicWebsite, normalizeWebsiteUrl } from "./url";

const fallbackSources: IndexedSource[] = [
  {
    id: "src_demo_programs",
    url: "https://example.org/programs",
    title: "Programs and Registration",
    description: "Sample park district program information",
    type: "webpage",
    text:
      "The park district offers seasonal youth programs, adult fitness classes, camps, aquatics, and community events. Residents can register online through the program catalog. Facility rentals are available for rooms, picnic shelters, fields, and special events. Contact the park district office for current availability and approved rental rules."
  },
  {
    id: "src_demo_facilities",
    url: "https://example.org/facilities",
    title: "Facilities and Parks",
    description: "Sample facility information",
    type: "webpage",
    text:
      "Parks include playgrounds, walking paths, athletic fields, pools, and picnic areas. Some amenities have seasonal hours and may require permits. Dogs, sports leagues, and special events may be subject to posted rules and local ordinances."
  }
];

export async function createDemoFromUrl(input: string) {
  const url = normalizeWebsiteUrl(input);
  await assertPublicWebsite(url);
  const domain = url.hostname.replace(/^www\./, "");
  const recent = findRecentDemoByDomain(domain);
  if (recent && recent.status === "ready") return recent;

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
  saveDemo(initial);

  try {
    const sources = await crawlWebsite(url, (message, progress) => updateDemo(demoId, { message, progress }));
    const usableSources = sources.length ? sources : fallbackSources.map((source) => ({ ...source, url: url.toString() }));
    updateDemo(demoId, { status: "processing", message: "Building your digital front desk", progress: 76 });
    const { chunks, categories, suggestedQuestions } = await ingestSources(usableSources);
    const orgName = inferOrganizationName(url.hostname, usableSources[0]?.title);
    return updateDemo(demoId, {
      organizationName: orgName,
      status: "ready",
      progress: 100,
      message: "Preparing suggested questions",
      pagesIndexed: usableSources.filter((source) => source.type === "webpage").length,
      pdfsIndexed: usableSources.filter((source) => source.type === "pdf").length,
      categories,
      suggestedQuestions: suggestedQuestions.length
        ? suggestedQuestions
        : ["What programs are currently listed for residents?", "How do I register?", "Can I rent a facility?"],
      sources: usableSources,
      chunks
    })!;
  } catch (error) {
    return updateDemo(demoId, {
      status: "failed",
      progress: 100,
      message: "The demo could not be generated",
      error: error instanceof Error ? error.message : "Unknown crawl error"
    })!;
  }
}
