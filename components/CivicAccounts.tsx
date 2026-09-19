"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { assignableRoles, type AssignableRole, type CivicAccount } from "@/lib/civic-accounts";

export function CivicAccounts() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [accounts, setAccounts] = useState<CivicAccount[]>([]);
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AssignableRole>("Employee");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/civic/accounts", { cache: "no-store" }).then(async (response) => {
      if (response.status === 403) { router.replace("/civic-circle/dashboard"); return null; }
      if (!response.ok) throw new Error("Unable to load accounts.");
      return response.json();
    }).then((result) => { if (result) { setAccounts(result.accounts); setAllowed(true); } }).catch((loadError) => { setError(loadError.message); setAllowed(true); });
  }, [router]);

  const visibleAccounts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return accounts;
    return accounts.filter((account) => `${account.name} ${account.email} ${account.role}`.toLowerCase().includes(normalizedQuery));
  }, [accounts, query]);

  async function updateAccount(id: string, patch: Partial<CivicAccount>) {
    const response = await fetch(`/api/civic/accounts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const result = await response.json();
    if (!response.ok) return setError(result.error || "Unable to update the account.");
    setAccounts((current) => current.map((account) => account.id === id ? result.account : account));
  }

  async function addAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith("@hornets.com") || normalizedEmail === "@hornets.com") {
      setError("Enter a valid Hornets email address.");
      return;
    }
    const response = await fetch("/api/civic/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email: normalizedEmail, role, department }) });
    const result = await response.json();
    if (!response.ok) return setError(result.error || "Unable to add the account.");
    setAccounts((current) => [...current, result.account].sort((a, b) => a.name.localeCompare(b.name)));
    setName("");
    setEmail("");
    setRole("Employee");
    setDepartment("");
    setError("");
    setShowAdd(false);
  }

  if (!allowed) return <div className="min-h-[70vh]" />;

  return (
    <div className="mx-auto max-w-6xl px-5 py-9 lg:px-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Administration</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em]">Accounts</h1><p className="mt-2 text-sm text-[#687187]">Add Hornets users and control what they can do in Civic Circle.</p></div>
        <button onClick={() => { setShowAdd(true); setError(""); }} className="rounded-lg bg-[linear-gradient(100deg,#251260,#8140e8)] px-5 py-3 text-sm font-bold text-white shadow-md">Add account</button>
      </div>

      <div className="mt-7 rounded-2xl border border-[#e0e4ed] bg-white shadow-sm">
        <div className="border-b border-[#e5e8ef] p-5"><label className="block max-w-md"><span className="sr-only">Search accounts</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, or role…" className="min-h-11 w-full rounded-lg border border-[#ccd4e3] px-4 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" /></label></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-b border-[#e0e4ed] bg-[#f8f9fc] text-[11px] uppercase tracking-[0.12em] text-[#687186]"><tr><th className="px-6 py-4">Person</th><th className="px-6 py-4">Department</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Access</th></tr></thead>
            <tbody className="divide-y divide-[#e5e8ef]">
              {visibleAccounts.map((account) => {
                const protectedAdmin = account.role === "Administrator";
                const needsEmail = !account.email;
                return <tr key={account.id} className="text-sm"><td className="px-6 py-5"><p className="font-bold text-[#25283b]">{account.name}</p>{account.email ? <p className="mt-1 text-xs text-[#727b90]">{account.email}</p> : <input aria-label={`Email for ${account.name}`} placeholder="name@hornets.com" onBlur={(event) => { const value = event.target.value.trim().toLowerCase(); if (value) void updateAccount(account.id, { email: value }); }} className="mt-2 min-h-9 w-52 rounded-md border border-amber-300 px-2 text-xs" />}{account.notes ? <p className="mt-1 text-xs italic text-[#7c8290]">{account.notes}</p> : null}</td><td className="px-6 py-5 text-[#565f74]">{account.department || "—"}</td><td className="px-6 py-5">{protectedAdmin ? <span className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-800">Administrator</span> : <select aria-label={`Role for ${account.name}`} value={account.role} onChange={(event) => updateAccount(account.id, { role: event.target.value as AssignableRole })} className="min-h-10 rounded-lg border border-[#ccd4e3] bg-white px-3 font-semibold outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100">{assignableRoles.map((assignableRole) => <option key={assignableRole}>{assignableRole}</option>)}</select>}</td><td className="px-6 py-5"><span className={`inline-flex items-center gap-2 text-xs font-bold ${needsEmail ? "text-amber-700" : account.active ? "text-emerald-700" : "text-[#7b8292]"}`}><span className={`h-2 w-2 rounded-full ${needsEmail ? "bg-amber-500" : account.active ? "bg-emerald-500" : "bg-slate-400"}`} />{needsEmail ? "Pending email" : account.active ? "Active" : "Inactive"}</span></td><td className="px-6 py-5 text-right"><button disabled={protectedAdmin || needsEmail} onClick={() => updateAccount(account.id, { active: !account.active })} className="rounded-lg border border-[#d5dbe7] px-4 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40">{account.active ? "Deactivate" : "Activate"}</button></td></tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd ? <div className="fixed inset-0 z-50 grid place-items-center bg-[#100b32]/35 px-5" role="dialog" aria-modal="true" aria-labelledby="add-account-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowAdd(false); }}><form onSubmit={addAccount} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 id="add-account-title" className="text-xl font-extrabold">Add a Hornets account</h2><button type="button" onClick={() => setShowAdd(false)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-[#f1f3f7] text-xl">×</button></div><div className="mt-6 space-y-4"><AccountField label="Full name" value={name} onChange={setName} placeholder="Full name" /><AccountField label="Hornets email" value={email} onChange={(value) => { setEmail(value); setError(""); }} placeholder="name@hornets.com" type="email" /><AccountField label="Department" value={department} onChange={setDepartment} placeholder="Department" /><label className="block"><span className="text-sm font-bold">Role</span><select value={role} onChange={(event) => setRole(event.target.value as AssignableRole)} className="mt-2 min-h-12 w-full rounded-lg border border-[#ccd4e3] bg-white px-3 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100">{assignableRoles.map((assignableRole) => <option key={assignableRole}>{assignableRole}</option>)}</select></label>{error ? <p className="text-sm font-bold text-red-700" role="alert">{error}</p> : null}</div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border border-[#d6dce8] px-5 py-3 text-sm font-bold">Cancel</button><button className="rounded-lg bg-[#251260] px-5 py-3 text-sm font-bold text-white">Add account</button></div></form></div> : null}
    </div>
  );
}

function AccountField({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return <label className="block"><span className="text-sm font-bold">{label}</span><input required type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 min-h-12 w-full rounded-lg border border-[#ccd4e3] px-3 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" /></label>;
}
