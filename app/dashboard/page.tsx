import { DashboardClient } from "@/components/DashboardClient";
import { HarvelloLogo } from "@/components/HarvelloLogo";

export default function DashboardPage({ searchParams }: { searchParams: { demoId?: string } }) {
  return (
    <main className="min-h-screen bg-civic-paper px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <a href="/" className="focus-ring rounded-md">
            <HarvelloLogo />
          </a>
          <a href="/demo" className="text-sm font-semibold text-civic-green">
            Generate another demo
          </a>
        </div>
        <DashboardClient demoId={searchParams.demoId} />
      </div>
    </main>
  );
}
