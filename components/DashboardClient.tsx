"use client";

import { useEffect, useMemo, useState } from "react";
import type { DemoRecord } from "@/lib/types";

type HardcodedAnswer = NonNullable<DemoRecord["hardcodedAnswers"]>[number];
type WidgetConfig = NonNullable<DemoRecord["widgetConfig"]>;

function defaultWidgetConfig(demo: DemoRecord): WidgetConfig {
  return {
    assistantName: "Resident Assistant",
    accentColor: "#0b8f4d",
    greeting: `Hi, I can help with information from ${demo.organizationName}'s website.`,
    position: "right"
  };
}

export function DashboardClient({ demoId }: { demoId?: string }) {
  const [demo, setDemo] = useState<DemoRecord | null>(null);
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig | null>(null);
  const [hardcodedAnswers, setHardcodedAnswers] = useState<HardcodedAnswer[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!demoId) return;
    fetch(`/api/demo/${demoId}`)
      .then((response) => response.json())
      .then((data) => {
        const nextDemo = data.demo ?? null;
        setDemo(nextDemo);
        if (nextDemo) {
          setWidgetConfig(nextDemo.widgetConfig ?? defaultWidgetConfig(nextDemo));
          setHardcodedAnswers(nextDemo.hardcodedAnswers ?? []);
        }
      });
  }, [demoId]);

  const links = useMemo(() => {
    if (!demo || typeof window === "undefined") return { assistantUrl: "", embedCode: "" };
    const origin = window.location.origin;
    return {
      assistantUrl: `${origin}/assistant/${demo.organizationSlug}`,
      embedCode: `<script src="${origin}/widget.js" data-org-id="${demo.id}" async></script>`
    };
  }, [demo]);

  async function save() {
    if (!demo || !widgetConfig) return;
    setStatus("Saving...");
    const response = await fetch(`/api/demo/${demo.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ widgetConfig, hardcodedAnswers })
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error ?? "Unable to save.");
      return;
    }
    setDemo(data.demo);
    setWidgetConfig(data.demo.widgetConfig ?? defaultWidgetConfig(data.demo));
    setHardcodedAnswers(data.demo.hardcodedAnswers ?? []);
    setStatus("Saved.");
  }

  function addAnswer() {
    setHardcodedAnswers((current) => [
      ...current,
      {
        id: `answer_${Math.random().toString(36).slice(2)}`,
        trigger: "",
        answer: "",
        active: true
      }
    ]);
  }

  function updateAnswer(id: string, patch: Partial<HardcodedAnswer>) {
    setHardcodedAnswers((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeAnswer(id: string) {
    setHardcodedAnswers((current) => current.filter((item) => item.id !== id));
  }

  if (!demoId) {
    return (
      <div className="rounded-[24px] border border-[#dce4dd] bg-white p-8 shadow-soft">
        <h1 className="text-3xl font-black text-[#073f32]">Internal setup</h1>
        <p className="mt-2 text-[#4c625b]">Open this page with a demoId to generate the website link, snippet, and bot overrides.</p>
      </div>
    );
  }

  if (!demo || !widgetConfig) {
    return <div className="rounded-[24px] border border-[#dce4dd] bg-white p-8 shadow-soft">Loading setup...</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
      <section className="space-y-5">
        <div className="rounded-[24px] border border-[#dce4dd] bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0b8f4d]">Internal setup</p>
          <h1 className="mt-2 text-3xl font-black text-[#073f32]">{demo.organizationName}</h1>
          <p className="mt-2 text-sm leading-6 text-[#4c625b]">
            Configure the widget once, copy the snippet, and send it to the customer&apos;s website team.
          </p>
          <button onClick={save} className="focus-ring mt-5 min-h-11 rounded-md bg-[#0b8f4d] px-5 font-bold text-white hover:bg-[#076f3d]">
            Save setup
          </button>
          {status ? <p className="mt-3 text-sm font-bold text-[#0b6f43]">{status}</p> : null}
        </div>

        <div className="rounded-[24px] border border-[#dce4dd] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#073f32]">Widget settings</h2>
          <div className="mt-5 space-y-4">
            <Field
              label="Assistant name"
              value={widgetConfig.assistantName}
              onChange={(value) => setWidgetConfig({ ...widgetConfig, assistantName: value })}
            />
            <Field
              label="Accent hex color"
              value={widgetConfig.accentColor}
              onChange={(value) => setWidgetConfig({ ...widgetConfig, accentColor: value })}
              placeholder="#0b8f4d"
            />
            <label className="block">
              <span className="text-sm font-bold text-[#073f32]">First message</span>
              <textarea
                value={widgetConfig.greeting}
                onChange={(event) => setWidgetConfig({ ...widgetConfig, greeting: event.target.value })}
                rows={4}
                className="focus-ring mt-2 w-full rounded-md border border-[#dce4dd] px-3 py-3 text-sm leading-6"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-[#073f32]">Corner position</span>
              <select
                value={widgetConfig.position}
                onChange={(event) => setWidgetConfig({ ...widgetConfig, position: event.target.value === "left" ? "left" : "right" })}
                className="focus-ring mt-2 min-h-11 w-full rounded-md border border-[#dce4dd] px-3"
              >
                <option value="right">Bottom right</option>
                <option value="left">Bottom left</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="rounded-[24px] border border-[#dce4dd] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#073f32]">Send to their tech team</h2>
          <p className="mt-2 text-sm leading-6 text-[#4c625b]">This is the full install. They paste one script tag before the closing body tag.</p>
          <CopyBlock label="Assistant link" value={links.assistantUrl} />
          <CopyBlock label="Website snippet" value={links.embedCode} code />
        </div>

        <div className="rounded-[24px] border border-[#dce4dd] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-[#073f32]">Hardcoded answers</h2>
              <p className="mt-1 text-sm text-[#4c625b]">Use these when a bot needs an exact approved answer.</p>
            </div>
            <button onClick={addAnswer} className="focus-ring rounded-md border border-[#0b8f4d] px-4 py-2 text-sm font-bold text-[#0b6f43]">
              Add answer
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {hardcodedAnswers.length ? null : (
              <div className="rounded-lg bg-[#f5fbf4] p-4 text-sm leading-6 text-[#4c625b]">
                No hardcoded answers yet. Add one for questions like refund policy, emergency closures, or registration edge cases.
              </div>
            )}
            {hardcodedAnswers.map((item) => (
              <div key={item.id} className="rounded-lg border border-[#dce4dd] p-4">
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-[#073f32]">
                    <input
                      type="checkbox"
                      checked={item.active}
                      onChange={(event) => updateAnswer(item.id, { active: event.target.checked })}
                      className="h-4 w-4 accent-[#0b8f4d]"
                    />
                    Active
                  </label>
                  <button onClick={() => removeAnswer(item.id)} className="text-sm font-bold text-red-700">
                    Remove
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  <Field
                    label="Trigger question or phrase"
                    value={item.trigger}
                    onChange={(value) => updateAnswer(item.id, { trigger: value })}
                    placeholder="Do you offer financial assistance?"
                  />
                  <label className="block">
                    <span className="text-sm font-bold text-[#073f32]">Approved answer</span>
                    <textarea
                      value={item.answer}
                      onChange={(event) => updateAnswer(item.id, { answer: event.target.value })}
                      rows={5}
                      className="focus-ring mt-2 w-full rounded-md border border-[#dce4dd] px-3 py-3 text-sm leading-6"
                      placeholder="Yes. Residents can apply..."
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-[#073f32]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="focus-ring mt-2 min-h-11 w-full rounded-md border border-[#dce4dd] px-3"
      />
    </label>
  );
}

function CopyBlock({ label, value, code = false }: { label: string; value: string; code?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-[#073f32]">{label}</p>
        <button onClick={copy} className="focus-ring rounded-md bg-[#e8f4e9] px-3 py-2 text-xs font-black text-[#07513f]">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {code ? (
        <pre className="overflow-auto rounded-lg bg-[#073f32] p-4 text-sm leading-6 text-[#d6f5dc]">{value}</pre>
      ) : (
        <div className="break-all rounded-lg border border-[#dce4dd] bg-[#fbfbf6] p-4 text-sm font-semibold text-[#073f32]">{value}</div>
      )}
    </div>
  );
}
