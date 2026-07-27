import type { DemoRecord } from "./types";
import { cleanOrganizationName } from "./text";

export function toPublicDemo(demo: DemoRecord) {
  return {
    ...demo,
    organizationName: cleanOrganizationName(demo.organizationName, demo.domain),
    sources: (demo.sources ?? []).map((source) => ({
      id: source.id,
      url: source.url,
      title: source.title,
      description: source.description,
      type: source.type,
      text: ""
    })),
    chunks: []
  };
}
