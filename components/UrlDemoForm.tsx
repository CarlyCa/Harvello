"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function UrlDemoForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError("Enter a website URL.");
      return;
    }
    setLoading(true);
    router.push(`/demo/generate?url=${encodeURIComponent(trimmedUrl)}`);
  }

  return (
    <form onSubmit={submit} className={compact ? "space-y-3" : "mt-8 max-w-3xl"}>
      <div className="flex flex-col gap-3 rounded-lg border border-[#dccfb7] bg-white p-2 shadow-soft sm:flex-row">
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://yourwebsite.com"
          className="focus-ring min-h-12 flex-1 rounded-md border border-transparent px-4 text-base text-civic-ink placeholder:text-slate-500"
          aria-label="Website URL"
          required
        />
        <button
          disabled={loading}
          className="focus-ring min-h-12 rounded-md bg-[#ffd449] px-6 font-semibold text-civic-ink transition hover:bg-[#ffc933] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Starting..." : "Generate My Demo"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm font-medium text-red-700">{error}</p> : null}
    </form>
  );
}
