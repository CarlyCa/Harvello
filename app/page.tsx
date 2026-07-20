import { UrlDemoForm } from "@/components/UrlDemoForm";
import { HarvelloLogo } from "@/components/HarvelloLogo";
import { ContactForm } from "@/components/ContactForm";

export default function HomePage() {
  return (
    <main className="bg-[#fbfbf6] text-[#073f32]">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_78%_12%,#e7f4e7_0%,rgba(231,244,231,0)_34%),linear-gradient(180deg,#fbfbf6_0%,#fbfbf6_72%,#f4faf2_100%)] px-6 pb-20 pt-5">
        <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between gap-6">
          <a href="/" className="focus-ring rounded-md">
            <HarvelloLogo className="[&_svg]:h-11 [&_svg]:w-11 [&_span]:text-3xl" />
          </a>

          <div className="flex items-center gap-3">
            <a href="/signin" className="hidden text-sm font-semibold text-[#073f32] hover:text-[#0d8c4d] sm:inline">
              Sign in
            </a>
          </div>
        </nav>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 pt-10 lg:grid-cols-[.9fr_1.1fr] lg:pt-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#e8f4e9] px-4 py-2 text-sm font-bold text-[#07513f]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#0b8f4d]" />
              The AI Digital Front Desk for any website
            </div>
            <h1 className="mt-8 text-5xl font-black leading-[1.08] tracking-normal text-[#073f32] md:text-6xl">
              Answer every question.
              <span className="block text-[#0b8f4d]">Help every visitor.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[#31584f]">
              Harvello helps organizations answer website visitor questions 24/7. Your tech team only adds one small website snippet, and we handle the assistant setup.
            </p>

            <div className="mt-8 max-w-xl">
              <UrlDemoForm />
            </div>

            <div className="mt-10 space-y-2 text-sm font-medium text-[#31584f]">
              <p>Simple $99/month pricing.</p>
              <p>Setup is as easy as pasting one small code snippet onto your website.</p>
            </div>
          </div>

          <HeroProductVisual />
        </div>
      </section>

      <section className="bg-[#fbfbf6] px-6 py-16">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-3xl font-black text-[#073f32]">One platform. Every website interaction.</h2>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-[#5b6f69]">
            Harvello combines AI, public website knowledge, and human-centered design to deliver better experiences for customers, visitors, and teams.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-7xl gap-4 md:grid-cols-4">
          {[
            ["AI Assistant", "Instant answers sourced from your website, documents, and approved content.", "chat"],
            ["Insights", "Understand what visitors need with analytics and unanswered-question trends.", "chart"],
            ["Smart Search", "Help visitors find accurate product, service, policy, and support information faster.", "search"],
            ["Easy to Integrate", "Your website team pastes one small snippet. We provide the code, configure the assistant, and handle the rest.", "code"]
          ].map(([title, body, icon]) => (
            <div key={title} className="rounded-lg border border-[#dce4dd] bg-white p-7 shadow-sm">
              <div className="mb-6 grid h-12 w-12 place-items-center rounded-full bg-[linear-gradient(135deg,#8dd889,#0b8f4d)] text-lg font-black text-white">
                <FeatureIcon name={icon} />
              </div>
              <h3 className="text-xl font-black text-[#073f32]">{title}</h3>
              <p className="mt-3 min-h-24 text-sm leading-6 text-[#4c625b]">{body}</p>
              <p className="mt-5 text-sm font-bold text-[#0b6f43]">Learn more -&gt;</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#f4faf2] px-6 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-[28px] border border-[#dce4dd] bg-white p-8 shadow-soft lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0b8f4d]">Contact us</p>
            <h2 className="mt-3 text-3xl font-black tracking-normal text-[#073f32]">Contact Harvello</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#4c625b]">
              Have a question or want to talk through setup? Send us your contact information and we will follow up.
            </p>
          </div>
          <ContactForm />
        </div>
      </section>

      <section className="bg-[#024331] px-6 py-14 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 rounded-lg border border-white/20 bg-white p-6 text-[#073f32] shadow-soft md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <HarvelloLogo markOnly className="rounded-full bg-[#e8f4e9] p-3" />
              <div>
                <h3 className="text-xl font-black">Ready to improve your website experience?</h3>
                <p className="mt-1 text-sm text-[#4c625b]">$99/month. One small snippet to add to your website.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function HeroProductVisual() {
  return (
    <div className="relative">
      <div className="rounded-[32px] border border-[#dce4dd] bg-[#e9f5e8] p-6 shadow-soft">
        <div className="grid gap-5 lg:grid-cols-[1.18fr_.82fr]">
          <div className="rounded-2xl border border-[#dce4dd] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <HarvelloLogo markOnly className="[&_svg]:h-8 [&_svg]:w-8" />
              <p className="font-black text-[#073f32]">Harvello Assistant</p>
            </div>
            <div className="mt-6 ml-auto max-w-[78%] rounded-lg bg-[#e8f4e9] p-4 text-sm leading-6 text-[#073f32]">
              Do you offer same-day appointments?
            </div>
            <div className="mt-4 flex gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#0b8f4d] text-sm font-black text-white">H</div>
              <div className="rounded-lg border border-[#eef2ee] bg-white p-4 text-sm leading-6 text-[#073f32] shadow-sm">
                Same-day appointments are available Monday through Friday when openings remain. Book online or call before noon for the best availability.
                <div className="mt-4 border-t border-[#dce4dd] pt-3 text-xs font-bold text-[#0b6f43]">
                  Services
                  <br />
                  Appointment Scheduling Policy
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3 rounded-lg border border-[#dce4dd] bg-white p-3">
              <span className="flex-1 text-sm text-slate-400">Ask another question...</span>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#0b8f4d] text-white">-&gt;</span>
            </div>
          </div>

          <div className="grid gap-5">
            <div className="rounded-2xl border border-[#dce4dd] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-[#073f32]">Insights</h3>
                <span className="rounded-md border border-[#dce4dd] px-2 py-1 text-xs font-bold text-[#4c625b]">This month</span>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ["Pricing", "82%"],
                  ["Appointments", "68%"],
                  ["Return policy", "54%"],
                  ["Contact details", "48%"]
                ].map(([label, width]) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs font-bold text-[#4c625b]">
                      <span>{label}</span>
                      <span>{width}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-[#e8f4e9]">
                      <div className="h-2 rounded-full bg-[#0b8f4d]" style={{ width }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#dce4dd] bg-white p-5 shadow-sm">
              <h3 className="font-black text-[#073f32]">Impact</h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  ["23,148", "Questions answered"],
                  ["94%", "Resolution rate"],
                  ["2,510", "Hours saved"],
                  ["98%", "Visitor satisfaction"]
                ].map(([value, label]) => (
                  <div key={label} className="rounded-md border border-[#e2e8e2] p-3">
                    <p className="text-lg font-black text-[#073f32]">{value}</p>
                    <p className="mt-1 text-[11px] font-semibold leading-4 text-[#5b6f69]">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-[#cfe3d2] bg-[#073f32] p-5 text-white shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#bde8c7]">Website install included</p>
              <h3 className="mt-2 text-xl font-black">Your tech team only pastes one snippet.</h3>
              <p className="mt-2 text-sm leading-6 text-white/75">
                We send the exact code, configure the assistant, and help place it on the right page.
              </p>
            </div>
            <div className="flex flex-col gap-2 md:items-end">
              <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-[#073f32]">$99/mo</span>
              <code className="rounded-lg bg-white/10 px-4 py-3 text-sm font-bold text-[#d6f5dc]">
                &lt;script src=&quot;harvello/widget.js&quot;&gt;&lt;/script&gt;
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureIcon({ name }: { name: string }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.25,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true
  };

  if (name === "chart") {
    return (
      <svg {...common}>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 16v-5" />
        <path d="M12 16V8" />
        <path d="M16 16v-3" />
      </svg>
    );
  }

  if (name === "search") {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="6" />
        <path d="m16 16 4 4" />
      </svg>
    );
  }

  if (name === "code") {
    return (
      <svg {...common}>
        <path d="m9 18-6-6 6-6" />
        <path d="m15 6 6 6-6 6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M7 8.5h10" />
      <path d="M7 12h7" />
      <path d="M7 15.5h5" />
      <path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5l-4 3v-3H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}
