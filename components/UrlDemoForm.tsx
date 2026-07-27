export function UrlDemoForm({ compact = false }: { compact?: boolean }) {
  return (
    <form
      action="/demo/generate"
      method="get"
      className={compact ? "space-y-3" : "mt-8 max-w-3xl"}
    >
      <div className="grid gap-3 rounded-lg border border-[#dccfb7] bg-white p-2 shadow-soft sm:grid-cols-[minmax(0,1fr)_auto]">
        <input
          name="url"
          placeholder="https://yourwebsite.com"
          className="focus-ring relative z-0 min-h-12 min-w-0 rounded-md border border-transparent px-4 text-base text-civic-ink placeholder:text-slate-500"
          aria-label="Website URL"
          required
        />
        <button
          type="submit"
          className="focus-ring relative z-10 min-h-12 shrink-0 cursor-pointer select-none rounded-md border-0 bg-[#ffd449] px-6 font-semibold text-civic-ink transition hover:bg-[#ffc933] active:translate-y-px"
        >
          Generate My Demo
        </button>
      </div>
    </form>
  );
}
