export function UrlDemoForm({ compact = false }: { compact?: boolean }) {
  return (
    <form
      action="/demo/generate"
      method="get"
      className={compact ? "space-y-3" : "mt-8 max-w-3xl"}
    >
      <div className="flex flex-col gap-3 rounded-lg border border-[#dccfb7] bg-white p-2 shadow-soft sm:flex-row">
        <input
          name="url"
          placeholder="https://yourwebsite.com"
          className="focus-ring min-h-12 flex-1 rounded-md border border-transparent px-4 text-base text-civic-ink placeholder:text-slate-500"
          aria-label="Website URL"
          required
        />
        <button
          type="submit"
          className="focus-ring min-h-12 rounded-md bg-[#ffd449] px-6 font-semibold text-civic-ink transition hover:bg-[#ffc933] disabled:cursor-not-allowed disabled:opacity-70"
        >
          Generate My Demo
        </button>
      </div>
    </form>
  );
}
