import type { Chunk, IndexedSource } from "./types";
import { embedMany } from "./embeddings";
import { createId } from "./ids";
import { chunkText, generateSuggestedQuestions, inferCategories } from "./text";

export async function ingestSources(sources: IndexedSource[]) {
  const chunkInputs: Array<Omit<Chunk, "embedding">> = [];

  for (const source of sources) {
    const chunks = chunkText(source.text);
    chunks.forEach((content) => {
      chunkInputs.push({
        id: createId("chk"),
        sourceId: source.id,
        sourceTitle: source.title,
        sourceUrl: source.url,
        content
      });
    });
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
