import type { DemoRecord } from "./types";
import fs from "node:fs";
import path from "node:path";

const demos = new Map<string, DemoRecord>();
const domainRecent = new Map<string, string>();
const chatCounts = new Map<string, number>();
const dataDir = path.join(process.cwd(), ".data");
const demosPath = path.join(dataDir, "demos.json");
let loaded = false;

function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  try {
    if (!fs.existsSync(demosPath)) return;
    const records = JSON.parse(fs.readFileSync(demosPath, "utf8")) as DemoRecord[];
    for (const demo of records) {
      demos.set(demo.id, demo);
      domainRecent.set(demo.domain, demo.id);
    }
  } catch {
    demos.clear();
    domainRecent.clear();
  }
}

function persist() {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(demosPath, JSON.stringify(Array.from(demos.values()), null, 2));
  } catch {
    // Local file persistence is a development fallback; Supabase is the production store.
  }
}

export function saveDemo(demo: DemoRecord) {
  ensureLoaded();
  demos.set(demo.id, demo);
  domainRecent.set(demo.domain, demo.id);
  persist();
  return demo;
}

export function getDemo(id: string) {
  ensureLoaded();
  return demos.get(id);
}

export function findRecentDemoByDomain(domain: string) {
  ensureLoaded();
  const id = domainRecent.get(domain);
  if (!id) return null;
  const demo = demos.get(id);
  if (!demo) return null;
  const age = Date.now() - Date.parse(demo.createdAt);
  return age < 30 * 60 * 1000 ? demo : null;
}

export function updateDemo(id: string, patch: Partial<DemoRecord>) {
  ensureLoaded();
  const current = demos.get(id);
  if (!current) return null;
  const next = { ...current, ...patch };
  demos.set(id, next);
  persist();
  return next;
}

export function incrementChatCount(sessionKey: string) {
  const next = (chatCounts.get(sessionKey) ?? 0) + 1;
  chatCounts.set(sessionKey, next);
  return next;
}

export function getDemoByOrganizationSlug(slug: string) {
  ensureLoaded();
  return Array.from(demos.values()).find((demo) => demo.organizationSlug === slug) ?? null;
}
