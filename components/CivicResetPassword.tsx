"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export function CivicResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 12) return setError("Your password must contain at least 12 characters.");
    if (password !== confirm) return setError("The passwords do not match.");
    setBusy(true); const { error: updateError } = await getBrowserSupabase().auth.updateUser({ password }); setBusy(false);
    if (updateError) return setError(updateError.message);
    router.push("/civic-circle/dashboard"); router.refresh();
  }
  return <main className="grid min-h-screen place-items-center bg-[#f8faff] px-5"><form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-[#e0e5f0] bg-white p-8 shadow-xl"><h1 className="text-2xl font-extrabold text-[#100d35]">Choose a new password</h1><p className="mt-2 text-sm text-[#687187]">Use at least 12 characters.</p><label className="mt-6 block text-sm font-bold">New password<input type="password" autoComplete="new-password" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} className="mt-2 min-h-12 w-full rounded-lg border border-[#ccd4e3] px-3" /></label><label className="mt-4 block text-sm font-bold">Confirm password<input type="password" autoComplete="new-password" value={confirm} onChange={(event) => { setConfirm(event.target.value); setError(""); }} className="mt-2 min-h-12 w-full rounded-lg border border-[#ccd4e3] px-3" /></label>{error ? <p className="mt-3 text-sm font-bold text-red-700">{error}</p> : null}<button disabled={busy} className="mt-6 w-full rounded-lg bg-[#251260] px-5 py-3 font-bold text-white disabled:opacity-60">{busy ? "Saving…" : "Save new password"}</button></form></main>;
}
