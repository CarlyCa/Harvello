"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setLoading(true);

    try {
      const response = await fetch("/api/signin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, identifier })
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus(data.error ?? "We could not find that assistant.");
        return;
      }
      router.push(data.portalUrl);
    } catch {
      setStatus("Unable to sign in right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-[28px] border border-[#dce4dd] bg-white p-8 shadow-soft">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0b8f4d]">Customer sign in</p>
      <h1 className="mt-3 text-4xl font-black tracking-normal text-[#073f32]">Open your bot dashboard</h1>
      <p className="mt-4 text-sm leading-6 text-[#4c625b]">
        Enter the email or website tied to your Harvello assistant. You can also paste your demo ID.
      </p>

      <label className="mt-6 block">
        <span className="text-sm font-bold text-[#073f32]">Work email</span>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="you@company.com"
          className="focus-ring mt-2 min-h-12 w-full rounded-md border border-[#dce4dd] bg-white px-4 text-sm text-[#073f32]"
        />
      </label>

      <label className="mt-4 block">
        <span className="text-sm font-bold text-[#073f32]">Website or demo ID</span>
        <input
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="wilmettepark.org or demo_..."
          className="focus-ring mt-2 min-h-12 w-full rounded-md border border-[#dce4dd] bg-white px-4 text-sm text-[#073f32]"
        />
      </label>

      <button
        disabled={loading}
        className="focus-ring mt-6 min-h-12 w-full rounded-md bg-[#0b8f4d] px-5 text-sm font-bold text-white hover:bg-[#076f3d] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Opening dashboard..." : "Sign in"}
      </button>
      {status ? <p className="mt-3 text-sm font-bold text-red-700">{status}</p> : null}
    </form>
  );
}
