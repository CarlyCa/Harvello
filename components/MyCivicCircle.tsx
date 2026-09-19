"use client";

import { useEffect, useMemo, useState } from "react";
import { formatOpportunityDate, getVolunteerHours, type VolunteerSignup } from "@/lib/civic-circle";

type Opportunity = { id: string; title: string; organization: string; starts_at: string; ends_at: string; status: string };
type RegistrationRow = { status: "registered" | "cancelled"; opportunity: Opportunity };

export function MyCivicCircle() {
  const now = useMemo(() => new Date(), []);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [error, setError] = useState("");
  const [showSubmit, setShowSubmit] = useState(false);
  const [draft, setDraft] = useState({ title: "", organization: "", description: "", startsAt: "", endsAt: "" });

  async function load() {
    const [opportunityResponse, registrationResponse] = await Promise.all([fetch("/api/civic/opportunities", { cache: "no-store" }), fetch("/api/civic/registrations", { cache: "no-store" })]);
    if (!opportunityResponse.ok || !registrationResponse.ok) return setError("Unable to load volunteer opportunities.");
    const [opportunityResult, registrationResult] = await Promise.all([opportunityResponse.json(), registrationResponse.json()]);
    setOpportunities(opportunityResult.opportunities.filter((item: Opportunity) => item.status === "published"));
    setRegistrations(registrationResult.registrations);
  }
  useEffect(() => { void load(); }, []);

  const signups: VolunteerSignup[] = registrations.filter((row) => row.opportunity).map((row) => ({ id: row.opportunity.id, title: row.opportunity.title, organization: row.opportunity.organization, startsAt: row.opportunity.starts_at, endsAt: row.opportunity.ends_at, status: row.status }));
  const totals = getVolunteerHours(signups, now);
  const registeredIds = new Set(signups.filter((signup) => signup.status === "registered").map((signup) => signup.id));

  async function setRegistration(opportunityId: string, registered: boolean) {
    setError("");
    const response = await fetch("/api/civic/registrations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ opportunityId, registered }) });
    if (!response.ok) { const result = await response.json(); return setError(result.error || "Unable to update registration."); }
    await load();
  }

  async function submitOpportunity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const response = await fetch("/api/civic/opportunities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, startsAt: new Date(draft.startsAt).toISOString(), endsAt: new Date(draft.endsAt).toISOString() }) });
    if (!response.ok) { const result = await response.json(); return setError(result.error || "Unable to submit the opportunity."); }
    setDraft({ title: "", organization: "", description: "", startsAt: "", endsAt: "" }); setShowSubmit(false); await load();
  }

  return <div className="mx-auto max-w-6xl px-5 py-9 lg:px-10">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">My Civic Circle</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em]">Your volunteer impact</h1><p className="mt-2 text-sm leading-6 text-[#687187]">Hours update automatically from the opportunities you register for—there is no separate hour logging step.</p></div><button onClick={() => setShowSubmit(true)} className="rounded-lg bg-violet-700 px-5 py-3 text-sm font-bold text-white">Submit an opportunity</button></div>
    <section className="mt-7 grid gap-4 sm:grid-cols-2"><Metric title="Hours volunteered" value={totals.volunteered} detail="From registered opportunities that have ended" /><Metric title="Hours signed up for" value={totals.signedUp} detail="From upcoming registered opportunities" light /></section>
    {error ? <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p> : null}
    <section className="mt-7 overflow-hidden rounded-2xl border border-[#e1e5ee] bg-white shadow-sm"><div className="border-b border-[#e8ebf2] px-6 py-5"><h2 className="font-bold">Available volunteer opportunities</h2></div><div className="divide-y divide-[#eceef4]">
      {opportunities.map((opportunity) => { const registered = registeredIds.has(opportunity.id); const completed = new Date(opportunity.ends_at) <= now; return <article key={opportunity.id} className="flex flex-col justify-between gap-4 px-6 py-5 sm:flex-row sm:items-center"><div><h3 className="font-bold">{opportunity.title}</h3><p className="mt-1 text-sm text-[#6c7488]">{opportunity.organization} · {formatOpportunityDate(opportunity.starts_at)}</p></div><button disabled={completed} onClick={() => setRegistration(opportunity.id, !registered)} className={`rounded-lg px-4 py-2 text-sm font-bold ${registered ? "border border-violet-300 text-violet-700" : "bg-violet-700 text-white"} disabled:opacity-50`}>{completed ? "Completed" : registered ? "Cancel registration" : "Register"}</button></article>; })}
      {opportunities.length === 0 ? <div className="px-6 py-10 text-center text-sm text-[#70798e]">No published volunteer opportunities are available yet.</div> : null}
    </div></section>
    {showSubmit ? <div className="fixed inset-0 z-50 grid place-items-center bg-[#100b32]/35 px-5" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowSubmit(false); }}><form onSubmit={submitOpportunity} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-xl font-extrabold">Submit a volunteer opportunity</h2><button type="button" onClick={() => setShowSubmit(false)} className="text-2xl">×</button></div><p className="mt-2 text-sm text-[#687187]">Whitney and Lily must both approve it before it is published.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><DraftField label="Opportunity title" value={draft.title} onChange={(value) => setDraft({ ...draft, title: value })} /><DraftField label="Organization" value={draft.organization} onChange={(value) => setDraft({ ...draft, organization: value })} /><DraftField label="Starts" type="datetime-local" value={draft.startsAt} onChange={(value) => setDraft({ ...draft, startsAt: value })} /><DraftField label="Ends" type="datetime-local" value={draft.endsAt} onChange={(value) => setDraft({ ...draft, endsAt: value })} /></div><label className="mt-4 block text-sm font-bold">Description<textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} rows={4} className="mt-2 w-full rounded-lg border border-[#ccd4e3] p-3" /></label><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowSubmit(false)} className="rounded-lg border px-5 py-3 font-bold">Cancel</button><button className="rounded-lg bg-violet-700 px-5 py-3 font-bold text-white">Submit for approval</button></div></form></div> : null}
  </div>;
}

function Metric({ title, value, detail, light = false }: { title: string; value: number; detail: string; light?: boolean }) {
  return <article className={`rounded-2xl p-6 text-white shadow-lg ${light ? "bg-[linear-gradient(120deg,#5330a5,#8b48ed)]" : "bg-[linear-gradient(120deg,#24125e,#6330bd)]"}`}><p className="text-xs font-bold uppercase tracking-[0.13em] text-violet-100">{title}</p><p className="mt-3 text-4xl font-extrabold">{Number.isInteger(value) ? value : value.toFixed(1)}</p><p className="mt-2 text-sm text-violet-100">{detail}</p></article>;
}

function DraftField({ label, type = "text", value, onChange }: { label: string; type?: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-sm font-bold">{label}<input required type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-12 w-full rounded-lg border border-[#ccd4e3] px-3" /></label>;
}
