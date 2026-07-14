import { AdminClient } from "@/components/AdminClient";
import { HarvelloLogo } from "@/components/HarvelloLogo";
import { listDemos } from "@/lib/demo-store";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const demos = await listDemos();

  return (
    <main className="min-h-screen bg-civic-paper px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <a href="/" className="focus-ring rounded-md">
            <HarvelloLogo />
          </a>
          <a href="/dashboard" className="text-sm font-semibold text-civic-green">
            Setup by demo ID
          </a>
        </div>
        <AdminClient
          demos={demos.map((demo) => ({
            id: demo.id,
            organizationName: demo.organizationName,
            organizationSlug: demo.organizationSlug,
            domain: demo.domain,
            websiteUrl: demo.websiteUrl,
            status: demo.status,
            createdAt: demo.createdAt,
            pagesIndexed: demo.pagesIndexed,
            pdfsIndexed: demo.pdfsIndexed,
            claimedEmail: demo.claimedEmail
          }))}
        />
      </div>
    </main>
  );
}
