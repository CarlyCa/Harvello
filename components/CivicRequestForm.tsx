"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CivicRequestForm() {
  const router = useRouter(); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({ eventName: "", organization: "", eventAt: "", contactName: "", audience: "", description: "" });
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const response = await fetch("/api/civic/engagement-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, eventAt: new Date(draft.eventAt).toISOString() }) });
    setBusy(false); if (!response.ok) { const result = await response.json(); return setError(result.error || "Unable to submit request."); }
    router.push("/civic-circle/dashboard");
  }
  return <div className="mx-auto max-w-3xl px-5 py-9"><p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Speaking engagement</p><h1 className="mt-2 text-3xl font-extrabold">Submit a speaking request</h1><form onSubmit={submit} className="mt-7 rounded-2xl border bg-white p-6 shadow-sm"><div className="grid gap-4 sm:grid-cols-2"><Field label="Event name" value={draft.eventName} onChange={(value) => setDraft({ ...draft, eventName: value })} /><Field label="Organization" value={draft.organization} onChange={(value) => setDraft({ ...draft, organization: value })} /><Field label="Event date and time" type="datetime-local" value={draft.eventAt} onChange={(value) => setDraft({ ...draft, eventAt: value })} /><Field label="Contact name" value={draft.contactName} onChange={(value) => setDraft({ ...draft, contactName: value })} /><Field label="Audience" value={draft.audience} onChange={(value) => setDraft({ ...draft, audience: value })} /></div><label className="mt-4 block text-sm font-bold">Request details<textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} rows={5} className="mt-2 w-full rounded-lg border border-[#ccd4e3] p-3" /></label>{error ? <p className="mt-4 text-sm font-bold text-red-700">{error}</p> : null}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => router.back()} className="rounded-lg border px-5 py-3 font-bold">Cancel</button><button disabled={busy} className="rounded-lg bg-violet-700 px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? "Submitting…" : "Submit request"}</button></div></form></div>;
}
function Field({ label, type = "text", value, onChange }: { label: string; type?: string; value: string; onChange: (value: string) => void }) { return <label className="block text-sm font-bold">{label}<input required={label !== "Contact name" && label !== "Audience"} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-12 w-full rounded-lg border border-[#ccd4e3] px-3" /></label>; }
