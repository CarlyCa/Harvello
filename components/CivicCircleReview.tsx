"use client";

import { useEffect, useState } from "react";

type RequestRow = { id: string; event_name: string; organization: string; event_at: string; status: string; contact_name: string | null; audience: string | null; description: string; review_note: string | null };
type Approval = { approver_key: "whitney" | "lily"; approved_at: string };
type Opportunity = { id: string; title: string; organization: string; description: string; starts_at: string; status: string; civic_opportunity_approvals: Approval[]; submitter: { name: string } | null };

export function CivicCircleReview() {
  const [requests, setRequests] = useState<RequestRow[]>([]); const [opportunities, setOpportunities] = useState<Opportunity[]>([]); const [email, setEmail] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<RequestRow | null>(null); const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null); const [note, setNote] = useState(""); const [error, setError] = useState("");

  async function load() {
    const [meResponse, requestResponse, opportunityResponse] = await Promise.all([fetch("/api/civic/me", { cache: "no-store" }), fetch("/api/civic/engagement-requests", { cache: "no-store" }), fetch("/api/civic/opportunities", { cache: "no-store" })]);
    if (meResponse.ok) setEmail((await meResponse.json()).account.email || "");
    if (requestResponse.ok) setRequests((await requestResponse.json()).requests);
    if (opportunityResponse.ok) setOpportunities((await opportunityResponse.json()).opportunities);
  }
  useEffect(() => { void load(); }, []);

  async function decideRequest(status: "under_review" | "approved" | "declined") {
    if (!selectedRequest) return;
    const response = await fetch(`/api/civic/engagement-requests/${selectedRequest.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, reviewNote: note }) });
    if (!response.ok) { const result = await response.json(); return setError(result.error); }
    setSelectedRequest(null); await load();
  }
  async function decideOpportunity(decision: "approve" | "reject") {
    if (!selectedOpportunity) return;
    const response = await fetch(`/api/civic/opportunities/${selectedOpportunity.id}/approval`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision }) });
    if (!response.ok) { const result = await response.json(); return setError(result.error); }
    setSelectedOpportunity(null); await load();
  }

  const pendingRequests = requests.filter((row) => ["submitted", "under_review"].includes(row.status));
  const pendingOpportunities = opportunities.filter((row) => row.status === "pending_approval");
  const approver = email === "wtarver@hornets.com" ? "Whitney" : email === "lcommander@hornets.com" ? "Lily" : null;

  return <div className="mx-auto max-w-[1460px] px-5 py-8 lg:px-6">
    {error ? <p className="mb-5 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p> : null}
    <ReviewSection title="Engagement requests awaiting triage" subtitle="Review against the intake criteria, then approve, assign or decline" headers={["Event", "Organization", "Event date", "Status", "Review action"]} empty="No engagement requests are awaiting review.">
      {pendingRequests.map((row) => <tr key={row.id} className="text-sm"><td className="px-6 py-5 font-medium">{row.event_name}</td><td className="px-6 py-5 text-[#4c566c]">{row.organization}</td><td className="px-6 py-5 text-[#4c566c]">{new Date(row.event_at).toLocaleDateString()}</td><td className="px-6 py-5 capitalize">{row.status.replace("_", " ")}</td><td className="px-6 py-5 text-center"><button onClick={() => { setSelectedRequest(row); setNote(row.review_note || ""); }} className="rounded-lg border border-[#ccd5e7] px-4 py-2 font-semibold">Review</button></td></tr>)}
    </ReviewSection>
    <div className="mt-7"><ReviewSection title="Volunteer opportunities awaiting review" subtitle="Whitney and Lily must both approve every new opportunity before it is published" headers={["Opportunity", "Organization", "Date", "Approvals", "Review action"]} empty="No volunteer opportunities are awaiting approval.">
      {pendingOpportunities.map((row) => { const keys = new Set(row.civic_opportunity_approvals.map((item) => item.approver_key)); return <tr key={row.id} className="text-sm"><td className="px-6 py-5 font-medium">{row.title}<span className="block text-xs font-normal text-[#788095]">Added by {row.submitter?.name || "Unknown"}</span></td><td className="px-6 py-5 text-[#4c566c]">{row.organization}</td><td className="px-6 py-5 text-[#4c566c]">{new Date(row.starts_at).toLocaleDateString()}</td><td className="px-6 py-5">{keys.size} of 2 approved<span className="block text-xs text-[#727b90]">Whitney {keys.has("whitney") ? "✓" : "pending"} · Lily {keys.has("lily") ? "✓" : "pending"}</span></td><td className="px-6 py-5 text-center"><button onClick={() => setSelectedOpportunity(row)} className="rounded-lg border border-[#ccd5e7] px-4 py-2 font-semibold">Review</button></td></tr>; })}
    </ReviewSection></div>
    {selectedRequest ? <Drawer title={selectedRequest.event_name} onClose={() => setSelectedRequest(null)}><p className="text-sm leading-6 text-[#5f687b]">{selectedRequest.description || "No additional description was provided."}</p><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} placeholder="Review note" className="mt-5 w-full rounded-lg border border-[#ccd4e3] p-3" /><div className="mt-6 grid gap-3 sm:grid-cols-3"><button onClick={() => decideRequest("declined")} className="rounded-lg border border-red-200 px-4 py-3 font-bold text-red-700">Decline</button><button onClick={() => decideRequest("under_review")} className="rounded-lg border border-violet-300 px-4 py-3 font-bold text-violet-700">Under review</button><button onClick={() => decideRequest("approved")} className="rounded-lg bg-violet-700 px-4 py-3 font-bold text-white">Approve</button></div></Drawer> : null}
    {selectedOpportunity ? <Drawer title={selectedOpportunity.title} onClose={() => setSelectedOpportunity(null)}><p className="text-sm leading-6 text-[#5f687b]">{selectedOpportunity.description || "No additional description was provided."}</p><div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Both Whitney and Lily must approve before publishing.</div><div className="mt-6 flex justify-between gap-3"><button disabled={!approver} onClick={() => decideOpportunity("reject")} className="rounded-lg border border-red-200 px-5 py-3 font-bold text-red-700 disabled:opacity-40">Reject</button><button disabled={!approver} onClick={() => decideOpportunity("approve")} className="rounded-lg bg-violet-700 px-5 py-3 font-bold text-white disabled:opacity-40">{approver ? `Approve as ${approver}` : "Whitney or Lily approval required"}</button></div></Drawer> : null}
  </div>;
}

function ReviewSection({ title, subtitle, headers, empty, children }: { title: string; subtitle: string; headers: string[]; empty: string; children: React.ReactNode }) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return <section><div className="border-l-2 border-cyan-500 pl-3"><h2 className="font-bold">{title}</h2><p className="mt-1 text-sm text-[#6d7588]">{subtitle}</p></div><div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm"><table className="w-full min-w-[900px] text-left"><thead className="border-b bg-[#f8f9fc] text-[11px] uppercase tracking-[0.12em] text-[#687186]"><tr>{headers.map((header) => <th key={header} className="px-6 py-4 last:text-center">{header}</th>)}</tr></thead><tbody className="divide-y">{children}{!hasRows ? <tr><td colSpan={headers.length} className="px-6 py-10 text-center text-sm text-[#727b90]">{empty}</td></tr> : null}</tbody></table></div></section>;
}
function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex justify-end bg-[#100b32]/35" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl"><div className="flex items-start justify-between border-b pb-5"><h2 className="text-xl font-extrabold">{title}</h2><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-xl">×</button></div><div className="pt-6">{children}</div></aside></div>;
}
