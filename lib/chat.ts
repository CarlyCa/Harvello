import OpenAI from "openai";
import { env, hasOpenAI } from "./env";
import { retrieveRelevantChunks } from "./retrieval";
import type { ChatResult, DemoRecord } from "./types";

let openai: OpenAI | null = null;

function client() {
  if (!hasOpenAI || !env.OPENAI_API_KEY) return null;
  openai ??= new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return openai;
}

export async function answerQuestion(demo: DemoRecord, question: string): Promise<ChatResult> {
  const hardcoded = findHardcodedAnswer(demo, question);
  if (hardcoded) {
    return {
      answer: hardcoded.answer,
      citations: [],
      confidence: 1
    };
  }

  const matches = await retrieveRelevantChunks(question, demo.chunks);
  const strongMatches = matches.filter((match) => match.score > 0.12);
  const selected = strongMatches.length ? strongMatches : matches.slice(0, 3);
  const citations = uniqueCitations(selected.map(({ chunk }) => ({ title: chunk.sourceTitle, url: chunk.sourceUrl }))).slice(0, 4);
  const confidence = Math.min(0.94, Math.max(0.2, selected.reduce((sum, match) => sum + match.score, 0) / Math.max(selected.length, 1)));

  if (!selected.length || confidence < 0.18) {
    return {
      answer:
        "I could not find a reliable answer in the public website sources indexed for this demo. Please check the park district website directly.",
      citations,
      confidence: 0.2
    };
  }

  const openaiClient = client();
  if (!openaiClient) return fallbackAnswer(question, selected, citations, confidence);

  const context = selected
    .map(
      ({ chunk }, index) =>
        `Source ${index + 1}: ${chunk.sourceTitle}\nURL: ${chunk.sourceUrl}\nContent: ${chunk.content}`
    )
    .join("\n\n");

  try {
    const response = await openaiClient.responses.create({
      model: env.OPENAI_CHAT_MODEL,
      input: [
        {
          role: "system",
          content:
            "You are a demo digital front desk for this park district. Answer only using the provided public website sources. Do not guess or infer unsupported facts. If the answer is not clearly supported, say you could not find a reliable answer and direct the user to the source website. Do not present yourself as officially approved during demo mode. Keep answers concise and readable. Do not include a Sources section, raw URLs, or markdown citation links in the answer because citations are displayed separately by the app."
        },
        {
          role: "user",
          content: `Question: ${question}\n\nPublic website sources:\n${context}`
        }
      ]
    });

    return {
      answer:
        cleanAssistantAnswer(getResponseText(response)) ||
        "I could not find a reliable answer in the public website sources indexed for this demo.",
      citations,
      confidence
    };
  } catch {
    return fallbackAnswer(question, selected, citations, Math.min(confidence, 0.65));
  }
}

function findHardcodedAnswer(demo: DemoRecord, question: string) {
  const normalizedQuestion = normalizeTrigger(question);
  return demo.hardcodedAnswers?.find((item) => {
    if (!item.active) return false;
    const trigger = normalizeTrigger(item.trigger);
    return normalizedQuestion === trigger || normalizedQuestion.includes(trigger) || trigger.includes(normalizedQuestion);
  });
}

function normalizeTrigger(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function cleanAssistantAnswer(answer?: string) {
  return answer
    ?.replace(/\n?\s*Sources?:\s*(?:\[[^\]]+\]\([^)]+\)[,;.\s]*)+$/is, "")
    .replace(/\n?\s*Source links?:[\s\S]*$/i, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getResponseText(response: unknown) {
  if (
    response &&
    typeof response === "object" &&
    "output_text" in response &&
    typeof (response as { output_text?: unknown }).output_text === "string"
  ) {
    return (response as { output_text: string }).output_text;
  }

  const output = (response as { output?: Array<{ content?: Array<{ text?: string; type?: string }> }> })?.output;
  return output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter(Boolean)
    .join("\n")
    .trim();
}

function fallbackAnswer(
  question: string,
  matches: Awaited<ReturnType<typeof retrieveRelevantChunks>>,
  citations: ChatResult["citations"],
  confidence: number
) {
  const questionTerms = question.toLowerCase().split(/\W+/).filter((term) => term.length > 3);
  const sentences = matches
    .flatMap(({ chunk }) => chunk.content.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()))
    .filter((sentence) => sentence.length > 40)
    .map((sentence) => ({
      sentence,
      hits: questionTerms.filter((term) => sentence.toLowerCase().includes(term)).length
    }))
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 3)
    .map((item) => item.sentence);

  if (!sentences.length) {
    return {
      answer:
        "I could not find a reliable answer in the public website sources indexed for this demo. Please check the cited pages directly.",
      citations,
      confidence: Math.min(confidence, 0.4)
    };
  }

  return {
    answer: `Based on the public website content indexed for this demo: ${sentences.join(" ")}`,
    citations,
    confidence
  };
}

function uniqueCitations(citations: ChatResult["citations"]) {
  const seen = new Set<string>();
  return citations.filter((citation) => {
    if (seen.has(citation.url)) return false;
    seen.add(citation.url);
    return true;
  });
}
