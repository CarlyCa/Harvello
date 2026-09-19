"use client";

import { useEffect, useState } from "react";
import { defaultCivicContent, type CivicContent } from "@/lib/civic-content";

export function CivicContentEditor() {
  const [content, setContent] = useState<CivicContent>(defaultCivicContent);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/civic/content", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error("Unable to load content.");
      return response.json();
    }).then((result) => { setContent(result.content); setAllowed(true); }).catch(() => setAllowed(true));
  }, []);

  function updateAction(index: number, field: "title" | "description", value: string) {
    setSaved(false);
    setContent((current) => ({ ...current, actions: current.actions.map((action, actionIndex) => actionIndex === index ? { ...action, [field]: value } : action) }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/civic/content", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(content) });
    setSaved(response.ok);
  }

  async function reset() {
    setContent(defaultCivicContent);
    const response = await fetch("/api/civic/content", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(defaultCivicContent) });
    setSaved(response.ok);
  }

  if (!allowed) return <div className="min-h-[70vh]" />;

  return (
    <div className="mx-auto max-w-4xl px-5 py-9 lg:px-10">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Editor access</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em]">Edit dashboard wording</h1>
      <p className="mt-2 text-sm text-[#687187]">Changes are saved for everyone. Editor access is limited to Carly, Whitney, and Lily.</p>

      <form onSubmit={save} className="mt-7 space-y-6 rounded-2xl border border-[#e0e4ed] bg-white p-6 shadow-sm sm:p-8">
        <EditorField label="Dashboard greeting" value={content.greeting} onChange={(value) => { setSaved(false); setContent({ ...content, greeting: value }); }} />
        <EditorArea label="Dashboard introduction" value={content.introduction} onChange={(value) => { setSaved(false); setContent({ ...content, introduction: value }); }} />

        <div>
          <h2 className="font-bold">Action cards</h2>
          <div className="mt-4 space-y-4">
            {content.actions.map((action, index) => (
              <fieldset key={index} className="grid gap-4 rounded-xl border border-[#e1e5ed] p-4 sm:grid-cols-2">
                <legend className="px-2 text-xs font-bold uppercase tracking-[0.12em] text-[#777f91]">Card {index + 1}</legend>
                <EditorField label="Title" value={action.title} onChange={(value) => updateAction(index, "title", value)} />
                <EditorField label="Description" value={action.description} onChange={(value) => updateAction(index, "description", value)} />
              </fieldset>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <EditorField label="Upcoming section heading" value={content.upcomingHeading} onChange={(value) => { setSaved(false); setContent({ ...content, upcomingHeading: value }); }} />
          <EditorField label="Tasks section heading" value={content.tasksHeading} onChange={(value) => { setSaved(false); setContent({ ...content, tasksHeading: value }); }} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e5e8ef] pt-6">
          <button type="button" onClick={reset} className="rounded-lg border border-[#d8ddea] px-5 py-3 text-sm font-bold text-[#50576b]">Restore defaults</button>
          <div className="flex items-center gap-4">{saved ? <span className="text-sm font-bold text-emerald-700">Changes saved</span> : null}<button type="submit" className="rounded-lg bg-[linear-gradient(100deg,#251260,#8140e8)] px-6 py-3 text-sm font-bold text-white shadow-md">Save changes</button></div>
        </div>
      </form>
    </div>
  );
}

function EditorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="text-sm font-bold">{label}</span><input required value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-12 w-full rounded-lg border border-[#ccd4e3] px-3 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" /></label>;
}

function EditorArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="text-sm font-bold">{label}</span><textarea required rows={3} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-[#ccd4e3] p-3 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" /></label>;
}
