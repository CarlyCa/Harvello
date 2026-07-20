import type { Chunk, IndexedSource } from "./types";
import { embedMany } from "./embeddings";
import { createId } from "./ids";
import { chunkText, generateSuggestedQuestions, inferCategories } from "./text";

type IngestOptions = {
  maxChunks?: number;
};

export async function ingestSources(sources: IndexedSource[], options: IngestOptions = {}) {
  const chunkInputs: Array<Omit<Chunk, "embedding">> = [];
  const maxChunks = options.maxChunks ?? 900;

  for (const source of sources) {
    const chunks = chunkText(source.text);
    for (const content of chunks) {
      if (chunkInputs.length >= maxChunks) break;
      chunkInputs.push({
        id: createId("chk"),
        sourceId: source.id,
        sourceTitle: source.title,
        sourceUrl: source.url,
        content
      });
    }
    if (chunkInputs.length >= maxChunks) break;
  }

  const embeddings = await embedMany(chunkInputs.map((chunk) => chunk.content));
  const chunks = chunkInputs.map((chunk, index) => ({ ...chunk, embedding: embeddings[index] }));
  const texts = sources.map((source) => `${source.title} ${source.description ?? ""} ${source.text.slice(0, 3000)}`);

  return {
    chunks,
    categories: inferCategories(texts),
    suggestedQuestions: generateSuggestedQuestions(texts)
  };
}
