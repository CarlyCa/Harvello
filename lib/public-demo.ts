import type { DemoRecord } from "./types";
import { dedupeRepeatedName } from "./text";

export function toPublicDemo(demo: DemoRecord) {
  return {
    ...demo,
    organizationName: dedupeRepeatedName(demo.organizationName),
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
