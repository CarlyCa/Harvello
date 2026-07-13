import type { DemoRecord } from "./types";

export function toPublicDemo(demo: DemoRecord) {
  return {
    ...demo,
    sources: demo.sources.map((source) => ({
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
