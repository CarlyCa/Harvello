"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";

type Mode = "signin" | "signup" | "forgot";

export function CivicCircleLogin() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    setError(""); setMessage("");
    if (!normalizedEmail.endsWith("@hornets.com") || normalizedEmail === "@hornets.com") return setError("Please enter a valid Hornets email address.");
    if (mode !== "forgot" && password.length < 12) return setError("Your password must contain at least 12 characters.");
    if (mode === "signup" && password !== confirmPassword) return setError("The passwords do not match.");

    setBusy(true);
    try {
      const supabase = getBrowserSupabase();
      if (mode === "signin") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (authError) throw authError;
        const accessResponse = await fetch("/api/civic/me", { cache: "no-store" });
        if (!accessResponse.ok) {
          await supabase.auth.signOut();
          throw new Error("Your Civic Circle account has not been activated. Contact a Civic Circle administrator.");
        }
        router.push("/civic-circle/dashboard"); router.refresh();
      } else if (mode === "signup") {
        const { error: authError } = await supabase.auth.signUp({ email: normalizedEmail, password, options: { emailRedirectTo: `${window.location.origin}/auth/confirm?next=/civic-circle/dashboard` } });
        if (authError) throw authError;
        setMessage("Check your Hornets inbox to confirm your account. Only active Civic Circle accounts can enter the portal.");
      } else {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo: `${window.location.origin}/auth/confirm?next=/civic-circle/reset-password` });
        if (authError) throw authError;
        setMessage("If an account exists for that address, a password-reset email has been sent from Community Impact.");
      }
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "The request could not be completed.");
    } finally { setBusy(false); }
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode); setError(""); setMessage(""); setPassword(""); setConfirmPassword("");
  }

  return <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f8faff] px-5 py-12 text-[#0b0a38]">
    <div aria-hidden="true" className="absolute -left-36 -top-40 h-[34rem] w-[34rem] rounded-full bg-cyan-100/65 blur-3xl" /><div aria-hidden="true" className="absolute -bottom-52 -right-40 h-[34rem] w-[34rem] rounded-full bg-violet-100/55 blur-3xl" />
    <section className="relative w-full max-w-[480px] rounded-[22px] border border-[#e0e5f0] bg-white/95 px-8 py-10 shadow-[0_24px_70px_rgba(25,25,70,0.10)] sm:px-11">
      <div className="mx-auto grid h-[72px] w-[72px] place-items-center rounded-full bg-[linear-gradient(145deg,#7c3aed,#24145f)] text-xl font-extrabold text-white">CC</div>
      <div className="mt-6 text-center"><h1 className="text-3xl font-extrabold tracking-[-0.035em]">{mode === "signin" ? "Welcome to Civic Circle" : mode === "signup" ? "Create your account" : "Reset your password"}</h1><p className="mt-3 text-[15px] leading-6 text-[#66708a]">Use your approved Hornets email address.</p></div>
      <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
        <Field label="Hornets email" type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="name@hornets.com" />
        {mode !== "forgot" ? <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder="At least 12 characters" /> : null}
        {mode === "signup" ? <Field label="Confirm password" type="password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" placeholder="Repeat your password" /> : null}
        {error ? <p className="text-sm font-semibold text-red-700" role="alert">{error}</p> : null}{message ? <p className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800" role="status">{message}</p> : null}
        <button disabled={busy} className="min-h-13 w-full rounded-xl bg-[linear-gradient(100deg,#251260,#8441ef)] px-5 py-3.5 text-base font-bold text-white shadow-md disabled:opacity-60">{busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset email"}</button>
      </form>
      <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm font-semibold text-violet-700">{mode !== "signin" ? <button onClick={() => switchMode("signin")}>Sign in</button> : null}{mode !== "signup" ? <button onClick={() => switchMode("signup")}>Create account</button> : null}{mode !== "forgot" ? <button onClick={() => switchMode("forgot")}>Forgot password?</button> : null}</div>
      <p className="mt-6 text-center text-xs leading-5 text-[#69738a]">Password and reset messages are delivered by Civic Circle using communityimpact@hornets.com.</p>
    </section>
  </main>;
}

function Field({ label, type, value, onChange, autoComplete, placeholder }: { label: string; type: string; value: string; onChange: (value: string) => void; autoComplete: string; placeholder: string }) {
  return <label className="block"><span className="text-sm font-bold">{label}</span><input required type={type} value={value} autoComplete={autoComplete} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-13 w-full rounded-xl border border-[#ccd4e4] px-4 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" /></label>;
}
