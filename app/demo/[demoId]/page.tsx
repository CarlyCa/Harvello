import { DemoAssistant } from "@/components/DemoAssistant";
import { HarvelloLogo } from "@/components/HarvelloLogo";

export default function GeneratedDemoPage({ params }: { params: { demoId: string } }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_82%_8%,#e7f4e7_0%,rgba(231,244,231,0)_34%),linear-gradient(180deg,#fbfbf6_0%,#f4faf2_100%)] px-6 py-5 text-[#073f32]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex items-center justify-between">
          <a href="/" className="focus-ring rounded-md">
            <HarvelloLogo className="[&_svg]:h-10 [&_svg]:w-10 [&_span]:text-3xl" />
          </a>
          <a href="/demo" className="rounded-md border border-[#cfded2] bg-white px-4 py-2 text-sm font-bold text-[#073f32] hover:border-[#0b8f4d]">
            Generate another demo
          </a>
        </div>
        <DemoAssistant demoId={params.demoId} variant="widget" />
      </div>
    </main>
  );
}
