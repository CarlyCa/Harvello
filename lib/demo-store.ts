import type { DemoRecord } from "./types";
import { getServiceSupabase } from "./supabase";
import { createId } from "./ids";
import fs from "node:fs";
import path from "node:path";

type DemoRow = {
  id: string;
  domain: string;
  organization_slug: string;
  status: string;
  record: DemoRecord;
  updated_at: string;
};

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
    for (const demo of records) cacheDemo(demo);
  } catch {
    demos.clear();
    domainRecent.clear();
  }
}

function persistLocal() {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(demosPath, JSON.stringify(Array.from(demos.values()), null, 2));
  } catch {
    // Local file persistence is a development fallback; Supabase is the production store.
  }
}

function cacheDemo(demo: DemoRecord) {
  demos.set(demo.id, demo);
  domainRecent.set(demo.domain, demo.id);
}

async function upsertSupabaseDemo(demo: DemoRecord) {
  const supabase = getServiceSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from("harvello_demos").upsert({
    id: demo.id,
    domain: demo.domain,
    organization_slug: demo.organizationSlug,
    status: demo.status,
    record: demo,
    updated_at: new Date().toISOString()
  });
  if (error) throw error;
  return true;
}

function saveLocal(demo: DemoRecord) {
  ensureLoaded();
  cacheDemo(demo);
  persistLocal();
  return demo;
}

export async function saveDemo(demo: DemoRecord) {
  cacheDemo(demo);
  try {
    if (await upsertSupabaseDemo(demo)) return demo;
  } catch (error) {
    console.error("Supabase save failed; using local demo storage.", error);
  }
  return saveLocal(demo);
}

export async function getDemo(id: string) {
  const cached = demos.get(id);
  if (cached) return cached;

  const supabase = getServiceSupabase();
  if (supabase) {
    const { data, error } = await supabase.from("harvello_demos").select("record").eq("id", id).maybeSingle();
    if (!error && data?.record) {
      const demo = data.record as DemoRecord;
      cacheDemo(demo);
      return demo;
    }
    if (error) console.error("Supabase read failed; using local demo storage.", error);
  }

  ensureLoaded();
  return demos.get(id);
}

export async function findRecentDemoByDomain(domain: string) {
  const supabase = getServiceSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("harvello_demos")
      .select("record, updated_at")
      .eq("domain", domain)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle<Pick<DemoRow, "record" | "updated_at">>();
    if (!error && data?.record) {
      const demo = data.record;
      cacheDemo(demo);
      const age = Date.now() - Date.parse(demo.createdAt);
      return age < 30 * 60 * 1000 ? demo : null;
    }
    if (error) console.error("Supabase recent lookup failed; using local demo storage.", error);
  }

  ensureLoaded();
  const id = domainRecent.get(domain);
  if (!id) return null;
  const demo = demos.get(id);
  if (!demo) return null;
  const age = Date.now() - Date.parse(demo.createdAt);
  return age < 30 * 60 * 1000 ? demo : null;
}

export async function updateDemo(id: string, patch: Partial<DemoRecord>) {
  const current = await getDemo(id);
  if (!current) return null;
  const next = { ...current, ...patch };
  await saveDemo(next);
  return next;
}

export function incrementChatCount(sessionKey: string) {
  const next = (chatCounts.get(sessionKey) ?? 0) + 1;
  chatCounts.set(sessionKey, next);
  return next;
}

export async function recordChatEvent({
  demoId,
  question,
  mode,
  confidence,
  citationsCount
}: {
  demoId: string;
  question: string;
  mode: "demo" | "hosted" | "widget";
  confidence: number;
  citationsCount: number;
}) {
  try {
    const current = await getDemo(demoId);
    if (!current) return;

    const analytics = current.analytics ?? {
      totalQuestions: 0,
      demoQuestions: 0,
      widgetQuestions: 0,
      hostedQuestions: 0,
      questions: []
    };
    const askedAt = new Date().toISOString();
    await saveDemo({
      ...current,
      analytics: {
        totalQuestions: analytics.totalQuestions + 1,
        demoQuestions: analytics.demoQuestions + (mode === "demo" ? 1 : 0),
        widgetQuestions: analytics.widgetQuestions + (mode === "widget" ? 1 : 0),
        hostedQuestions: analytics.hostedQuestions + (mode === "hosted" ? 1 : 0),
        lastAskedAt: askedAt,
        questions: [
          {
            id: createId("q"),
            question: question.slice(0, 1000),
            mode,
            askedAt,
            confidence,
            citationsCount
          },
          ...analytics.questions
        ].slice(0, 100)
      }
    });
  } catch (error) {
    console.error("Analytics recording failed.", error);
  }
}

export async function getDemoByOrganizationSlug(slug: string) {
  const supabase = getServiceSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("harvello_demos")
      .select("record")
      .eq("organization_slug", slug)
      .maybeSingle();
    if (!error && data?.record) {
      const demo = data.record as DemoRecord;
      cacheDemo(demo);
      return demo;
    }
    if (error) console.error("Supabase slug lookup failed; using local demo storage.", error);
  }

  ensureLoaded();
  return Array.from(demos.values()).find((demo) => demo.organizationSlug === slug) ?? null;
}

export async function listDemos() {
  const supabase = getServiceSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("harvello_demos")
      .select("record")
      .order("updated_at", { ascending: false })
      .limit(200);
    if (!error && data) {
      const records = data.map((row) => row.record as DemoRecord);
      records.forEach(cacheDemo);
      return records;
    }
    if (error) console.error("Supabase list failed; using local demo storage.", error);
  }

  ensureLoaded();
  return Array.from(demos.values()).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function findDemoForSignin(identifier: string, email?: string) {
  const normalized = identifier.trim().toLowerCase();
  const normalizedDomain = normalized
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
  const normalizedEmail = email?.trim().toLowerCase();
  const records = await listDemos();

  return (
    records.find((demo) => {
      const claimedEmail = demo.claimedEmail?.toLowerCase();
      return (
        demo.id.toLowerCase() === normalized ||
        demo.organizationSlug.toLowerCase() === normalized ||
        demo.domain.toLowerCase() === normalizedDomain ||
        demo.websiteUrl.toLowerCase().includes(normalizedDomain) ||
        Boolean(normalizedEmail && claimedEmail === normalizedEmail)
      );
    }) ?? null
  );
}
