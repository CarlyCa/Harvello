export function createId(prefix: string) {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  const body = Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("");
  return `${prefix}_${body.slice(0, 16)}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
