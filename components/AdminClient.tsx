"use client";

import { useMemo, useState } from "react";
import type { DemoRecord } from "@/lib/types";

type AdminDemo = Pick<
  DemoRecord,
  | "id"
  | "organizationName"
  | "organizationSlug"
  | "domain"
  | "websiteUrl"
  | "status"
  | "createdAt"
  | "pagesIndexed"
  | "pdfsIndexed"
  | "claimedEmail"
>;

export function AdminClient({ demos }: { demos: AdminDemo[] }) {
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return demos;
    return demos.filter((demo) =>
      [demo.organizationName, demo.domain, demo.websiteUrl, demo.status, demo.claimedEmail ?? ""].some((value) => value.toLowerCase().includes(needle))
    );
  }, [demos, query]);

  function linksFor(demo: AdminDemo) {
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    return {
      demo: `${origin}/demo/${demo.id}`,
      setup: `${origin}/dashboard?demoId=${encodeURIComponent(demo.id)}`,
      assistant: `${origin}/assistant/${demo.organizationSlug}`,
      script: `<script src="${origin}/widget.js" data-org-id="${demo.id}" async></script>`
    };
  }

  async function copy(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1400);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[#dce4dd] bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0b8f4d]">Admin</p>
            <h1 className="mt-2 text-4xl font-black tracking-normal text-[#073f32]">Generated assistants</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#4c625b]">
              Find a client assistant, open its setup page, copy the website snippet, or review the public demo.
            </p>
          </div>
          <a href="/demo" className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md bg-[#0b8f4d] px-5 text-sm font-bold text-white hover:bg-[#076f3d]">
            Generate new demo
          </a>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric label="Total assistants" value={demos.length} />
          <Metric label="Ready" value={demos.filter((demo) => demo.status === "ready").length} />
          <Metric label="Claimed" value={demos.filter((demo) => demo.status === "claimed").length} />
        </div>

        <label className="mt-6 block">
          <span className="text-sm font-bold text-[#073f32]">Search clients</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by organization, domain, status, or email"
            className="focus-ring mt-2 min-h-12 w-full rounded-md border border-[#dce4dd] px-4 text-sm"
          />
        </label>
        {copied ? <p className="mt-3 text-sm font-bold text-[#0b6f43]">Copied {copied}.</p> : null}
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[#dce4dd] bg-white shadow-soft">
        {filtered.length ? (
          <div className="divide-y divide-[#dce4dd]">
            {filtered.map((demo) => {
              const links = linksFor(demo);
              return (
                <article key={demo.id} className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-black text-[#073f32]">{demo.organizationName}</h2>
                      <span className="rounded-full bg-[#f5fbf4] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#0b6f43]">
                        {demo.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[#4c625b]">{demo.domain}</p>
                    <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-[#4c625b]">
                      <span>{demo.pagesIndexed} webpages</span>
                      <span>{demo.pdfsIndexed} PDFs</span>
                      <span>Created {new Date(demo.createdAt).toLocaleDateString()}</span>
                      {demo.claimedEmail ? <span>Claimed by {demo.claimedEmail}</span> : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <a href={links.setup} className="focus-ring rounded-md bg-[#0b8f4d] px-4 py-2 text-sm font-bold text-white hover:bg-[#076f3d]">
                      Open setup
                    </a>
                    <a href={links.demo} className="focus-ring rounded-md border border-[#dce4dd] px-4 py-2 text-sm font-bold text-[#073f32] hover:bg-[#f5fbf4]">
                      Demo
                    </a>
                    <button onClick={() => copy(links.script, "script")} className="focus-ring rounded-md border border-[#dce4dd] px-4 py-2 text-sm font-bold text-[#073f32] hover:bg-[#f5fbf4]">
                      Copy script
                    </button>
                    <button onClick={() => copy(links.setup, "setup link")} className="focus-ring rounded-md border border-[#dce4dd] px-4 py-2 text-sm font-bold text-[#073f32] hover:bg-[#f5fbf4]">
                      Copy setup link
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-sm leading-6 text-[#4c625b]">No assistants match that search.</div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#dce4dd] bg-[#fbfcf8] p-4">
      <p className="text-3xl font-black text-[#073f32]">{value}</p>
      <p className="mt-1 text-sm font-bold text-[#4c625b]">{label}</p>
    </div>
  );
}
