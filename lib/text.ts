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
    ["Programs", ["program", "class", "camp", "lesson", "activity"]],
    ["Facilities", ["facility", "rental", "room", "field", "gym", "pool"]],
    ["Registration", ["register", "registration", "enroll", "sign up"]],
    ["Parks", ["park", "trail", "playground", "preserve"]],
    ["Events", ["event", "calendar", "concert", "festival"]],
    ["Policies", ["policy", "rule", "permit", "refund", "resident"]]
  ];
  return categories.filter(([, terms]) => terms.some((term) => text.includes(term))).map(([name]) => name).slice(0, 5);
}

export function generateSuggestedQuestions(texts: string[]) {
  const text = texts.join(" ").toLowerCase();
  const candidates = [
    ["program", "What programs are currently listed for residents?"],
    ["register", "How do I register for a program or class?"],
    ["facility", "Can I rent a facility or room?"],
    ["pool", "What pool information is available?"],
    ["park", "What parks and amenities are listed?"],
    ["permit", "How do permits work?"],
    ["camp", "What camp information is available?"],
    ["event", "What events are listed?"],
    ["refund", "What refund policy information is available?"],
    ["contact", "How can I contact the park district?"]
  ];
  const generated = candidates.filter(([term]) => text.includes(term)).map(([, question]) => question);
  return generated.slice(0, 5);
}

export function inferOrganizationName(hostname: string, title?: string) {
  const titleName = title?.split(/[|-]/)[0]?.trim();
  if (titleName && titleName.length > 3 && titleName.length < 80) return titleName;
  return hostname
    .replace(/^www\./, "")
    .split(".")[0]
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
