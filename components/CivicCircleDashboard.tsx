"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { defaultCivicContent } from "@/lib/civic-content";

const actionIcons = ["megaphone", "hand", "award"] as const;

export function CivicCircleDashboard() {
  const [content, setContent] = useState(defaultCivicContent);

  useEffect(() => {
    fetch("/api/civic/content", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((result) => { if (result?.content) setContent(result.content); });
  }, []);

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-8 lg:px-10">
      <section className="relative overflow-hidden rounded-[22px] border border-[#e1e5ed] bg-[radial-gradient(circle_at_92%_100%,#d9f8ff_0,transparent_32%),white] px-6 py-7 shadow-sm sm:px-8">
        <div className="absolute inset-y-0 left-0 w-1 bg-[linear-gradient(#1ed2de,#242075)]" />
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div>
            <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
              <span className="rounded-full border border-[#d4d8e3] bg-[#f7f7fa] px-3 py-1">FY2027</span>
              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-cyan-800">Viewing as Employee</span>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.03em]">{content.greeting}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667087]">{content.introduction}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/civic-circle/circle" className="rounded-lg border border-[#d5dbea] bg-white px-5 py-2.5 text-sm font-semibold shadow-sm">My Civic Circle</Link>
            <Link href="/civic-circle/circle" className="rounded-lg bg-[#0e073d] px-5 py-2.5 text-sm font-semibold text-white shadow-md">Find an opportunity</Link>
          </div>
        </div>
      </section>

      <section className="mt-7 grid gap-4 md:grid-cols-3">
        {content.actions.map((action, index) => (
          <Link href={index === 1 ? "/civic-circle/circle" : index === 0 ? "/civic-circle/requests/new" : "#"} key={index} className="group flex min-h-[96px] items-center gap-4 rounded-2xl bg-[linear-gradient(110deg,#251361,#8342ed)] px-5 py-4 text-left text-white shadow-[0_9px_22px_rgba(70,38,150,0.18)] transition hover:-translate-y-0.5 hover:brightness-110">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15 text-violet-100"><ActionIcon name={actionIcons[index]} /></span>
            <span>
              <span className="block text-sm font-bold">{action.title}</span>
              <span className="mt-1 block text-sm text-violet-100">{action.description}</span>
            </span>
          </Link>
        ))}
      </section>

      <section className="mt-7 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="min-h-[300px] rounded-2xl border border-[#e1e5ee] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#e8ebf2] px-6 py-5">
            <h2 className="font-bold">{content.upcomingHeading}</h2>
            <Link href="/civic-circle/circle" className="text-sm font-semibold text-[#555b6f]">View all →</Link>
          </div>
          <div className="px-6 py-10 text-center text-sm text-[#70798e]">Your next registered volunteer opportunities appear in My Civic Circle.</div>
        </div>
        <div className="min-h-[300px] rounded-2xl border border-[#e1e5ee] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#e8ebf2] px-6 py-5"><h2 className="font-bold">{content.tasksHeading}</h2><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">0</span></div>
          <div className="p-6"><Link href="/civic-circle/review" className="flex items-center justify-between rounded-xl border border-[#e1e5ed] bg-[#f8f9fc] px-4 py-4 text-sm font-bold text-[#626b80] hover:bg-violet-50"><span>No requests awaiting review</span><span aria-hidden="true">→</span></Link></div>
        </div>
      </section>
    </div>
  );
}

function ActionIcon({ name }: { name: string }) {
  if (name === "award") return <span className="text-xl">◇</span>;
  if (name === "hand") return <span className="text-xl">⌁</span>;
  return <span className="text-xl">◁</span>;
}
