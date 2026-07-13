import dns from "node:dns/promises";
import net from "node:net";

const blockedTerms = [
  "login",
  "account",
  "checkout",
  "payment",
  "admin",
  "cart",
  "register-confirmation",
  "password",
  "profile"
];

export function normalizeWebsiteUrl(input: string) {
  const trimmed = input.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Enter a public http or https website.");
  url.hash = "";
  url.username = "";
  url.password = "";
  return url;
}

export function isBlockedPath(url: URL) {
  const path = `${url.pathname}${url.search}`.toLowerCase();
  return blockedTerms.some((term) => path.includes(term));
}

export function canonicalUrl(url: URL) {
  const clone = new URL(url);
  clone.hash = "";
  for (const key of Array.from(clone.searchParams.keys())) {
    if (/^(utm_|fbclid|gclid|mc_|session|sid|replytocom|ical|tribe-bar-date)/i.test(key)) {
      clone.searchParams.delete(key);
    }
  }
  if (clone.pathname !== "/") clone.pathname = clone.pathname.replace(/\/+$/, "");
  return clone.toString();
}

export function isInternalUrl(candidate: URL, root: URL) {
  return candidate.hostname.replace(/^www\./, "") === root.hostname.replace(/^www\./, "");
}

function isPrivateIp(ip: string) {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    return (
      parts[0] === 10 ||
      parts[0] === 127 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      (parts[0] === 169 && parts[1] === 254) ||
      parts[0] === 0
    );
  }
  return ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80");
}

export async function assertPublicWebsite(url: URL) {
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host === "metadata.google.internal") {
    throw new Error("Enter a public website domain.");
  }
  if (net.isIP(host) && isPrivateIp(host)) throw new Error("Private network addresses cannot be crawled.");

  const records = await dns.lookup(host, { all: true });
  if (!records.length || records.some((record) => isPrivateIp(record.address))) {
    throw new Error("This website resolves to a private or unavailable address.");
  }
}
