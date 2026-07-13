"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const steps = [
  {
    title: "Connecting to your website",
    detail: "Checking the public site and preparing a crawl plan."
  },
  {
    title: "Learning your public pages",
    detail: "Finding programs, facilities, events, policies, and contact pages."
  },
  {
    title: "Reading documents and PDFs",
    detail: "Pulling useful details from public pages and linked documents."
  },
  {
    title: "Building website knowledge",
    detail: "Organizing content so answers can point back to the right sources."
  },
  {
    title: "Creating the assistant UI",
    detail: "Preparing the resident-facing demo and example answer flow."
  },
  {
    title: "Finishing your demo",
    detail: "Opening the generated Harvello assistant."
  }
];

export function DemoGenerationFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUrl = useMemo(() => searchParams.get("url")?.trim() ?? "", [searchParams]);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!targetUrl) {
      setError("Enter a website URL to generate a demo.");
      return;
    }

    let cancelled = false;
    const timer = window.setInterval(() => {
      setCurrentStep((step) => Math.min(step + 1, steps.length - 2));
    }, 1800);

    async function createDemo() {
      try {
        const response = await fetch("/api/demo", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: targetUrl })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to create demo.");
        if (cancelled) return;

        window.clearInterval(timer);
        setCurrentStep(steps.length - 1);
        setIsComplete(true);
        window.setTimeout(() => {
          router.push(`/demo/${data.demoId}`);
        }, 900);
      } catch (caught) {
        window.clearInterval(timer);
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Unable to create demo.");
        }
      }
    }

    createDemo();

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [router, targetUrl]);

  const progress = isComplete ? 100 : Math.round(((currentStep + 1) / steps.length) * 92);

  return (
    <section className="grid gap-8 lg:grid-cols-[.92fr_1.08fr] lg:items-center">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[#e8f4e9] px-4 py-2 text-sm font-bold text-[#07513f]">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#0b8f4d]" />
          Generating demo
        </div>
        <h1 className="mt-6 text-4xl font-black leading-tight tracking-normal text-[#073f32] md:text-5xl">
          Building your Harvello demo.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-[#31584f]">
          Harvello is reading the public website, organizing useful resident information, and preparing a working assistant experience.
        </p>
        <div className="mt-8 rounded-lg border border-[#dce4dd] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6a7b75]">Website</p>
          <p className="mt-2 break-all text-lg font-black text-[#073f32]">{targetUrl || "No website selected"}</p>
        </div>
      </div>

      <div className="rounded-[28px] border border-[#dce4dd] bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[#0b8f4d]">{isComplete ? "Ready" : "Working"}</p>
            <h2 className="mt-1 text-2xl font-black text-[#073f32]">{steps[currentStep].title}</h2>
          </div>
          <span className="text-2xl font-black text-[#073f32]">{progress}%</span>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#e8f4e9]">
          <div className="h-full rounded-full bg-[#0b8f4d] transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>

        <div className="mt-8 space-y-4">
          {steps.map((step, index) => {
            const complete = index < currentStep || isComplete;
            const active = index === currentStep && !isComplete;
            return (
              <div
                key={step.title}
                className={`flex gap-4 rounded-lg border p-4 transition ${
                  complete || active ? "border-[#cfe3d2] bg-[#f5fbf4]" : "border-[#eef2ee] bg-white"
                }`}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black ${
                    complete ? "bg-[#0b8f4d] text-white" : active ? "bg-[#ffd449] text-[#073f32]" : "bg-[#eef2ee] text-[#6a7b75]"
                  }`}
                >
                  {complete ? "OK" : index + 1}
                </span>
                <div>
                  <p className="font-black text-[#073f32]">{step.title}</p>
                  <p className="mt-1 text-sm leading-6 text-[#5b6f69]">{step.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        {error ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            {error}
            <div className="mt-4">
              <a href="/demo" className="rounded-md bg-[#073f32] px-4 py-2 text-white">
                Try another website
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
