import { cosineSimilarity, embedText } from "./embeddings";
import type { Chunk } from "./types";

export async function retrieveRelevantChunks(question: string, chunks: Chunk[], count = 6) {
  const queryEmbedding = await embedText(question);
  return chunks
    .map((chunk) => ({
      chunk,
      score: chunk.embedding ? cosineSimilarity(queryEmbedding, chunk.embedding) : lexicalScore(question, chunk.content)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

function lexicalScore(question: string, content: string) {
  const terms = new Set(question.toLowerCase().split(/\W+/).filter((term) => term.length > 2));
  const contentTerms = content.toLowerCase();
  let score = 0;
  for (const term of terms) if (contentTerms.includes(term)) score += 1;
  return score / Math.max(terms.size, 1);
}
