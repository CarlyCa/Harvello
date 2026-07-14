import { HarvelloLogo } from "@/components/HarvelloLogo";
import { SignInForm } from "@/components/SignInForm";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_78%_12%,#e7f4e7_0%,rgba(231,244,231,0)_34%),linear-gradient(180deg,#fbfbf6_0%,#f4faf2_100%)] px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <a href="/" className="focus-ring inline-block rounded-md">
          <HarvelloLogo />
        </a>
        <div className="mt-12 grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0b8f4d]">Harvello portal</p>
            <h2 className="mt-3 text-4xl font-black leading-tight text-[#073f32]">Review your assistant and resident analytics.</h2>
            <p className="mt-5 text-base leading-7 text-[#4c625b]">
              Customers can see bot health, indexed content, recent resident questions, and basic usage trends.
            </p>
          </div>
          <SignInForm />
        </div>
      </div>
    </main>
  );
}
