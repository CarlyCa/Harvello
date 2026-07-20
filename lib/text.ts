export function cleanText(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\b(menu|search|skip to content|privacy policy|terms of use)\b/gi, " ")
    .trim();
}

export function chunkText(text: string, maxWords = 180, overlapWords = 35) {
  const words = cleanText(text).split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let index = 0;
  while (index < words.length) {
    const slice = words.slice(index, index + maxWords).join(" ");
    if (slice.length > 120) chunks.push(slice);
    index += maxWords - overlapWords;
  }
  return chunks.slice(0, 300);
}

export function inferCategories(texts: string[]) {
  const text = texts.join(" ").toLowerCase();
  const categories: Array<[string, string[]]> = [
    ["Products", ["product", "catalog", "item", "shop", "store"]],
    ["Services", ["service", "appointment", "booking", "consultation"]],
    ["Pricing", ["price", "pricing", "cost", "quote", "fee"]],
    ["Support", ["support", "help", "faq", "contact", "troubleshoot"]],
    ["Events", ["event", "calendar", "webinar", "workshop"]],
    ["Policies", ["policy", "return", "refund", "warranty", "terms"]]
  ];
  return categories.filter(([, terms]) => terms.some((term) => text.includes(term))).map(([name]) => name).slice(0, 5);
}

export function generateSuggestedQuestions(texts: string[]) {
  const text = texts.join(" ").toLowerCase();
  const candidates = [
    ["price", "What pricing information is available?"],
    ["pricing", "What pricing information is available?"],
    ["service", "What services are available?"],
    ["appointment", "How do I book an appointment?"],
    ["product", "What products are listed?"],
    ["support", "How can I get support?"],
    ["faq", "What frequently asked questions are answered?"],
    ["event", "What events are listed?"],
    ["refund", "What refund policy information is available?"],
    ["contact", "How can I contact the organization?"]
  ];
  const generated = candidates.filter(([term]) => text.includes(term)).map(([, question]) => question);
  return generated.slice(0, 5);
}

export function inferOrganizationName(hostname: string, title?: string) {
  const titleName = title?.split(/[|-]/)[0]?.trim();
  if (titleName && titleName.length > 3 && titleName.length < 80) return dedupeRepeatedName(titleName);
  return dedupeRepeatedName(hostname
    .replace(/^www\./, "")
    .split(".")[0]
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase()));
}

export function dedupeRepeatedName(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  const words = normalized.split(" ");
  if (words.length < 2 || words.length % 2 !== 0) return normalized;

  const midpoint = words.length / 2;
  const first = words.slice(0, midpoint).join(" ");
  const second = words.slice(midpoint).join(" ");
  return first.toLowerCase() === second.toLowerCase() ? first : normalized;
}
