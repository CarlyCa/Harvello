import { Suspense } from "react";
import { DemoGenerationFlow } from "@/components/DemoGenerationFlow";
import { HarvelloLogo } from "@/components/HarvelloLogo";

function LoadingBuildScreen() {
  return (
    <div className="rounded-[28px] border border-[#dce4dd] bg-white p-8 text-[#073f32] shadow-soft">
      <p className="text-sm font-bold text-[#0b8f4d]">Starting demo build</p>
      <h1 className="mt-3 text-3xl font-black">Preparing your build screen...</h1>
    </div>
  );
}

export default function GenerateDemoPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_82%_8%,#e7f4e7_0%,rgba(231,244,231,0)_34%),linear-gradient(180deg,#fbfbf6_0%,#f4faf2_100%)] px-6 py-6">
      <div className="mx-auto max-w-7xl">
        <nav className="flex items-center justify-between">
          <a href="/" className="focus-ring rounded-md">
            <HarvelloLogo className="[&_svg]:h-10 [&_svg]:w-10 [&_span]:text-3xl" />
          </a>
          <a href="/demo" className="rounded-md border border-[#cfded2] bg-white px-4 py-2 text-sm font-bold text-[#073f32] hover:border-[#0b8f4d]">
            Change website
          </a>
        </nav>

        <div className="py-14 md:py-20">
          <Suspense fallback={<LoadingBuildScreen />}>
            <DemoGenerationFlow />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
