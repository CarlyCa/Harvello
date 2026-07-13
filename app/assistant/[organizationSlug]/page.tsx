import { getDemoByOrganizationSlug } from "@/lib/demo-store";
import { DemoAssistant } from "@/components/DemoAssistant";
import { HarvelloLogo } from "@/components/HarvelloLogo";

export default async function HostedAssistantPage({ params }: { params: { organizationSlug: string } }) {
  const demo = await getDemoByOrganizationSlug(params.organizationSlug);
  return (
    <main className="min-h-screen bg-civic-paper px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <a href="/" className="focus-ring inline-flex rounded-md">
          <HarvelloLogo />
        </a>
        {demo ? (
          <div className="mt-8">
            <DemoAssistant demoId={demo.id} mode="hosted" />
          </div>
        ) : (
          <div className="mt-12 rounded-lg border border-civic-line bg-white p-8 shadow-soft">
            <h1 className="text-3xl font-bold text-civic-ink">Assistant not found</h1>
            <p className="mt-2 text-slate-700">Create or claim a demo before opening the hosted assistant page.</p>
          </div>
        )}
      </div>
    </main>
  );
}
