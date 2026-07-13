import OpenAI from "openai";
import { env, hasOpenAI } from "./env";

let openai: OpenAI | null = null;

function client() {
  if (!hasOpenAI || !env.OPENAI_API_KEY) return null;
  openai ??= new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return openai;
}

export async function embedText(text: string) {
  const openaiClient = client();
  if (!openaiClient) return hashEmbedding(text);
  try {
    const response = await openaiClient.embeddings.create({
      model: env.OPENAI_EMBEDDING_MODEL,
      input: text.slice(0, 7000)
    });
    return response.data[0].embedding;
  } catch {
    return hashEmbedding(text);
  }
}

export async function embedMany(texts: string[]) {
  const openaiClient = client();
  if (!openaiClient) return texts.map(hashEmbedding);
  try {
    const response = await openaiClient.embeddings.create({
      model: env.OPENAI_EMBEDDING_MODEL,
      input: texts.map((text) => text.slice(0, 7000))
    });
    return response.data.map((item) => item.embedding);
  } catch {
    return texts.map(hashEmbedding);
  }
}

function hashEmbedding(text: string) {
  const vector = Array.from({ length: 256 }, () => 0);
  for (const token of text.toLowerCase().split(/\W+/)) {
    if (!token) continue;
    let hash = 0;
    for (let index = 0; index < token.length; index += 1) hash = (hash * 31 + token.charCodeAt(index)) | 0;
    vector[Math.abs(hash) % vector.length] += 1;
  }
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / magnitude);
}

export function cosineSimilarity(a: number[], b: number[]) {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let ma = 0;
  let mb = 0;
  for (let index = 0; index < length; index += 1) {
    dot += a[index] * b[index];
    ma += a[index] * a[index];
    mb += b[index] * b[index];
  }
  return dot / ((Math.sqrt(ma) || 1) * (Math.sqrt(mb) || 1));
}
