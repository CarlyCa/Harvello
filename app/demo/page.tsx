import { UrlDemoForm } from "@/components/UrlDemoForm";
import { HarvelloLogo } from "@/components/HarvelloLogo";

export default function DemoPage() {
  const progress = [
    "Connecting to your website",
    "Finding public pages",
    "Reading program and facility information",
    "Processing PDFs",
    "Building your digital front desk",
    "Preparing suggested questions"
  ];

  return (
    <main className="min-h-screen bg-civic-paper px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <a href="/" className="focus-ring inline-flex rounded-md">
          <HarvelloLogo />
        </a>
        <section className="mt-14 rounded-lg border border-civic-line bg-white p-8 shadow-soft">
          <h1 className="text-4xl font-bold tracking-normal text-civic-ink">Create your Digital Front Desk demo</h1>
          <p className="mt-3 max-w-2xl text-lg leading-7 text-slate-700">
            Enter a public park district website. Harvello will read public pages and prepare a resident assistant you can test right away.
          </p>
          <div className="mt-8">
            <UrlDemoForm compact />
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {progress.map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-md bg-civic-paper p-3 text-sm font-medium text-civic-ink">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-civic-sky text-xs font-bold">{index + 1}</span>
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
