import { notFound } from "next/navigation";
import { BotAnalytics } from "@/components/BotAnalytics";
import { HarvelloLogo } from "@/components/HarvelloLogo";
import { getDemo } from "@/lib/demo-store";
import { toPublicDemo } from "@/lib/public-demo";

export const dynamic = "force-dynamic";

export default async function PortalPage({ params }: { params: { demoId: string } }) {
  const demo = await getDemo(params.demoId);
  if (!demo) notFound();
  const publicDemo = toPublicDemo(demo);

  return (
    <main className="min-h-screen bg-civic-paper px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <a href="/" className="focus-ring rounded-md">
            <HarvelloLogo />
          </a>
          <a href="/signin" className="text-sm font-semibold text-civic-green">
            Switch assistant
          </a>
        </div>
        <BotAnalytics demo={publicDemo} />
      </div>
    </main>
  );
}
