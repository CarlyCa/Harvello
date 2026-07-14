"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChatResult, DemoRecord } from "@/lib/types";

type Message = {
  role: "user" | "assistant";
  text: string;
  citations?: ChatResult["citations"];
  confidence?: number;
};

export function DemoAssistant({
  demoId,
  mode = "demo",
  variant = "full"
}: {
  demoId: string;
  mode?: "demo" | "hosted";
  variant?: "full" | "widget";
}) {
  const [demo, setDemo] = useState<DemoRecord | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState(false);
  const [widgetOpen, setWidgetOpen] = useState(true);
  const sessionId = useMemo(() => {
    if (typeof window === "undefined") return "server";
    const key = "harvello_session";
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const created = `sess_${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(key, created);
    return created;
  }, []);

  useEffect(() => {
    fetch(`/api/demo/${demoId}`)
      .then(readJson)
      .then((data) => setDemo(data.demo ?? null))
      .catch(() => setDemo(null))
      .finally(() => setLoading(false));
  }, [demoId]);

  async function ask(value = question) {
    const trimmed = value.trim();
    if (!trimmed || answering) return;
    setQuestion("");
    setMessages((current) => [...current, { role: "user", text: trimmed }]);
    setAnswering(true);
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ demoId, question: trimmed, sessionId, mode })
    });
    const data = await readJson(response);
    setMessages((current) => [
      ...current,
      {
        role: "assistant",
        text: data.answer ?? data.error ?? "I could not answer that question.",
        citations: data.citations,
        confidence: data.confidence
      }
    ]);
    setAnswering(false);
  }

  if (loading) {
    return (
      <div className="rounded-[28px] border border-[#dce4dd] bg-white p-8 shadow-soft">
        <p className="font-bold text-[#0b8f4d]">Opening your generated assistant...</p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#e8f4e9]">
          <div className="h-full w-2/3 rounded-full bg-[#0b8f4d]" />
        </div>
      </div>
    );
  }

  if (!demo) {
    return <div className="rounded-lg border border-red-200 bg-white p-8 text-red-700">Demo not found.</div>;
  }

  const visiblePrompts = demo.suggestedQuestions.slice(0, 3);
  const claimSubject = encodeURIComponent(`Claim Harvello assistant for ${demo.organizationName}`);
  const claimBody = encodeURIComponent(
    `Hi Harvello,\n\nWe are interested in this on our website.\n\nOrganization: ${demo.organizationName}\nWebsite: ${demo.websiteUrl}\nDemo ID: ${demo.id}\n\nPlease send next steps.`
  );
  const claimHref = `mailto:hello@harvello.com?subject=${claimSubject}&body=${claimBody}`;

  if (variant === "widget") {
    return (
      <WidgetDemoExperience
        demo={demo}
        messages={messages}
        question={question}
        answering={answering}
        visiblePrompts={visiblePrompts}
        widgetOpen={widgetOpen}
        setWidgetOpen={setWidgetOpen}
        setQuestion={setQuestion}
        ask={ask}
        claimHref={claimHref}
      />
    );
  }

  return (
    <div className="grid gap-5 lg:h-[calc(100vh-105px)] lg:grid-cols-[.7fr_1.3fr] lg:items-stretch">
      <section className="flex min-h-0 flex-col gap-4">
        <div className="rounded-[24px] border border-[#dce4dd] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0b8f4d]">Generated demo</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-[#073f32]">{demo.organizationName}</h1>
          <p className="mt-3 text-sm leading-6 text-[#4c625b]">
            This assistant was created from public website content. Try resident questions and review the source links returned with each answer.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Metric label="Webpages indexed" value={demo.pagesIndexed} />
            <Metric label="PDFs indexed" value={demo.pdfsIndexed} />
          </div>
        </div>

        <div className="min-h-0 rounded-[24px] border border-[#dce4dd] bg-white p-5 shadow-sm lg:flex-1 lg:overflow-hidden">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6a7b75]">Website knowledge</p>
          <div className="mt-4">
            <p className="text-sm font-black text-[#073f32]">Detected content</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(demo.categories.length ? demo.categories : ["Website Knowledge"]).map((category) => (
                <span key={category} className="rounded-full bg-[#e8f4e9] px-3 py-1 text-xs font-bold text-[#07513f]">
                  {category}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-5 rounded-lg bg-[#f5fbf4] p-4 text-sm leading-6 text-[#4c625b]">
            Answers are grounded in indexed pages and cite sources below the response.
          </div>
        </div>

        {mode === "demo" ? (
          <div className="rounded-[24px] border border-[#dce4dd] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-[#073f32]">Make this official</h2>
            <p className="mt-2 text-sm leading-6 text-[#4c625b]">
              Email us to claim this assistant for $99/month. We will confirm ownership, review sources with you, and send the one small snippet your website team can paste into your site.
            </p>
            <div className="mt-4 rounded-lg bg-[#f5fbf4] p-3 text-sm font-bold leading-6 text-[#073f32]">
              Tech lift: paste one script tag. Harvello handles setup, configuration, and source updates.
            </div>
            <a
              href={claimHref}
              className="focus-ring mt-4 flex min-h-11 items-center justify-center rounded-md bg-[#0b8f4d] px-4 text-center font-bold text-white hover:bg-[#076f3d]"
            >
              Email Harvello to claim - $99/mo
            </a>
          </div>
        ) : null}
      </section>

      <section className="flex min-h-[560px] flex-col overflow-hidden rounded-[28px] border border-[#dce4dd] bg-white shadow-soft lg:min-h-0">
        <div className="border-b border-[#dce4dd] bg-[#073f32] p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#bde8c7]">Try the resident assistant</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-normal">Ask a question from the park website</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/78">
                Type a resident question or use one of the examples. Harvello answers from the indexed public pages and shows its sources.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-white/12 px-3 py-1 text-xs font-bold text-white/85">
              Sources included
            </span>
          </div>
        </div>
        <div className="flex-1 space-y-4 overflow-auto bg-[#fbfbf6] p-5">
          {messages.length === 0 ? (
            <div className="rounded-2xl border border-[#dce4dd] bg-white p-5">
              <p className="font-black text-[#073f32]">Start with a real resident question</p>
              <p className="mt-2 text-sm leading-6 text-[#4c625b]">
                Good examples are hours, registration, events, rentals, weather policies, fees, or contact details.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {visiblePrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => ask(prompt)}
                    className="focus-ring rounded-lg border border-[#dce4dd] bg-[#f5fbf4] p-3 text-left text-sm font-bold leading-5 text-[#073f32] hover:border-[#0b8f4d]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={
                message.role === "user"
                  ? "ml-auto max-w-[82%] rounded-2xl bg-[#0b8f4d] p-4 text-white"
                  : "mr-auto max-w-[88%] rounded-2xl border border-[#dce4dd] bg-white p-4 text-[#073f32]"
              }
            >
              {message.role === "assistant" ? (
                <FormattedAnswer text={message.text} />
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p>
              )}
              {message.citations?.length ? (
                <div className="mt-3 space-y-1 border-t border-civic-line pt-2">
                  {message.citations.map((citation) => (
                    <a key={citation.url} href={citation.url} target="_blank" className="block text-xs font-bold text-[#0b6f43]">
                      {citation.title}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {answering ? <div className="mr-auto rounded-2xl border border-[#dce4dd] bg-white p-4 text-sm font-semibold text-[#4c625b]">Checking indexed website sources...</div> : null}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            ask();
          }}
          className="flex gap-2 border-t border-[#dce4dd] bg-white p-4"
        >
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Example: What time are the kids concerts?"
            className="focus-ring min-h-12 flex-1 rounded-md border border-[#dce4dd] px-3 text-[#073f32] placeholder:text-[#7b8b86]"
          />
          <button className="focus-ring rounded-md bg-[#0b8f4d] px-5 font-bold text-white hover:bg-[#076f3d]">Ask</button>
        </form>
      </section>
    </div>
  );
}

async function readJson(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return response.json();
  const text = await response.text();
  throw new Error(text.startsWith("<!DOCTYPE") ? "The server returned an HTML error page. Refresh and try again." : text);
}

function WidgetDemoExperience({
  demo,
  messages,
  question,
  answering,
  visiblePrompts,
  widgetOpen,
  setWidgetOpen,
  setQuestion,
  ask,
  claimHref
}: {
  demo: DemoRecord;
  messages: Message[];
  question: string;
  answering: boolean;
  visiblePrompts: string[];
  widgetOpen: boolean;
  setWidgetOpen: (open: boolean) => void;
  setQuestion: (question: string) => void;
  ask: (value?: string) => void;
  claimHref: string;
}) {
  return (
    <div className="grid gap-6 lg:min-h-[calc(100vh-120px)] lg:grid-cols-[.9fr_1.1fr]">
      <section className="rounded-[28px] border border-[#dce4dd] bg-white p-6 shadow-soft">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0b8f4d]">Generated demo</p>
        <h1 className="mt-3 text-4xl font-black leading-tight text-[#073f32]">{demo.organizationName}</h1>
        <p className="mt-4 text-base leading-7 text-[#4c625b]">
          This assistant was generated from public website content. It can answer resident questions, cite source pages, and be installed on the organization website with one script tag.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Metric label="Webpages indexed" value={demo.pagesIndexed} />
          <Metric label="PDFs indexed" value={demo.pdfsIndexed} />
        </div>

        <div className="mt-6 rounded-2xl bg-[#f5fbf4] p-5">
          <h2 className="text-lg font-black text-[#073f32]">About this assistant</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {(demo.categories.length ? demo.categories : ["Website Knowledge"]).map((category) => (
              <span key={category} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#07513f]">
                {category}
              </span>
            ))}
          </div>
          <div className="mt-5 space-y-3 text-sm leading-6 text-[#4c625b]">
            <p>Answers are grounded in the indexed public pages and show source links when available.</p>
            <p>The assistant is built from the pages indexed during demo generation, including the topics shown above.</p>
            <p>You can tune the greeting, brand color, approved answers, and source list before it goes on the live website.</p>
            <p>When ready, your web team pastes one script tag. Harvello handles setup, configuration, and source updates.</p>
          </div>
        </div>

        <a
          href={claimHref}
          className="focus-ring mt-6 flex min-h-12 items-center justify-center rounded-md bg-[#0b8f4d] px-5 text-center text-sm font-bold text-white hover:bg-[#076f3d]"
        >
          Claim this assistant
        </a>
      </section>

      <section className="relative min-h-[680px] overflow-hidden rounded-[28px] border border-[#dce4dd] bg-white shadow-soft">
        <div className="absolute inset-0 overflow-hidden">
          <div className="border-b border-[#dce4dd] bg-[#eef5ef] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#d96a5c]" />
              <span className="h-3 w-3 rounded-full bg-[#d9ad45]" />
              <span className="h-3 w-3 rounded-full bg-[#6f9f80]" />
              <div className="ml-3 flex-1 rounded-md bg-white px-4 py-2 text-sm font-bold text-[#66756f]">{demo.domain}</div>
            </div>
          </div>

          <div className="bg-[#e85145] px-6 py-3 text-sm font-black text-white">Weather updates: indoor programs running today</div>
          <div className="bg-[#f4c84f] px-6 py-3 text-sm font-black text-[#172421]">Lakefront pool will close early Friday for scheduled maintenance</div>

          <header className="border-b border-[#dce4dd] bg-white px-6 py-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-[#0b8f4d] text-lg font-black text-white">
                  {demo.organizationName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0b8f4d]">Park District Website</p>
                  <h2 className="text-2xl font-black leading-tight text-[#073f32]">{demo.organizationName}</h2>
                </div>
              </div>
              <a href={claimHref} className="rounded-md bg-[#0b8f4d] px-4 py-2 text-sm font-bold text-white">
                Claim this assistant
              </a>
            </div>
          </header>

          <div className="grid h-[calc(100%-190px)] lg:grid-cols-[1fr_260px]">
            <main className="space-y-5 bg-white p-6">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0b8f4d]">Summer 2026</p>
              <h3 className="max-w-xl text-4xl font-black leading-tight text-[#073f32]">Programs, events, and park information in one place.</h3>
              <p className="max-w-xl text-base leading-7 text-[#4c625b]">
                Residents browse as usual. Harvello stays available in the corner to answer questions from indexed website pages.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Upcoming events", "Concerts, clean-ups, registration dates, and community activities."],
                  ["Programs", "Classes, camps, lessons, and seasonal registration information."],
                  ["Facilities", "Pools, parks, courts, rentals, and public amenities."],
                  ["Resident help", "Answers grounded in the public pages Harvello indexed."]
                ].map(([title, detail]) => (
                  <div key={title} className="rounded-lg border border-[#dce4dd] bg-[#fbfcf8] p-4">
                    <p className="font-black text-[#073f32]">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#4c625b]">{detail}</p>
                  </div>
                ))}
              </div>
            </main>
            <aside className="hidden border-l border-[#dce4dd] bg-[#f5fbf4] p-6 lg:block">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6b7b75]">Generated demo</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Metric label="Webpages indexed" value={demo.pagesIndexed} />
                <Metric label="PDFs indexed" value={demo.pdfsIndexed} />
              </div>
              <p className="mt-5 rounded-lg bg-white p-4 text-sm font-semibold leading-6 text-[#4c625b]">
                Tech lift: paste one script tag. Harvello handles setup, configuration, and source updates.
              </p>
            </aside>
          </div>
        </div>

        {widgetOpen ? (
          <div className="absolute bottom-16 right-4 z-20 flex max-h-[560px] w-[min(440px,calc(100%-32px))] flex-col overflow-hidden rounded-2xl border border-[#cbd8cf] bg-white shadow-soft">
          <div className="bg-[#073f32] p-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#bde8c7]">Harvello Assistant</p>
                <h2 className="mt-1 text-2xl font-black">Ask about this website</h2>
              </div>
              <button
                onClick={() => setWidgetOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/12 text-lg font-black hover:bg-white/20"
                aria-label="Close assistant"
              >
                X
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-auto bg-[#fbfbf6] p-4">
            {messages.length === 0 ? (
              <div className="rounded-xl border border-[#dce4dd] bg-white p-4">
                <p className="font-black text-[#073f32]">Try a resident question</p>
                <div className="mt-3 space-y-2">
                  {visiblePrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => ask(prompt)}
                      className="focus-ring w-full rounded-lg border border-[#dce4dd] bg-[#f5fbf4] p-3 text-left text-sm font-bold leading-5 text-[#073f32] hover:border-[#0b8f4d]"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[86%] rounded-2xl bg-[#0b8f4d] p-3 text-white"
                    : "mr-auto max-w-[92%] rounded-2xl border border-[#dce4dd] bg-white p-3 text-[#073f32]"
                }
              >
                {message.role === "assistant" ? <FormattedAnswer text={message.text} /> : <p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p>}
                {message.citations?.length ? (
                  <div className="mt-3 space-y-1 border-t border-[#dce4dd] pt-2">
                    {message.citations.map((citation) => (
                      <a key={citation.url} href={citation.url} target="_blank" className="block text-xs font-bold text-[#0b6f43]">
                        {citation.title}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {answering ? <div className="mr-auto rounded-2xl border border-[#dce4dd] bg-white p-3 text-sm font-semibold text-[#4c625b]">Checking indexed website sources...</div> : null}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              ask();
            }}
            className="flex gap-2 border-t border-[#dce4dd] bg-white p-3"
          >
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Example: What time are the kids concerts?"
              className="focus-ring min-h-11 flex-1 rounded-md border border-[#dce4dd] px-3 text-sm text-[#073f32] placeholder:text-[#7b8b86]"
            />
            <button className="focus-ring rounded-md bg-[#0b8f4d] px-4 text-sm font-bold text-white hover:bg-[#076f3d]">Ask</button>
          </form>
          </div>
        ) : (
          <button
            onClick={() => setWidgetOpen(true)}
            className="focus-ring absolute bottom-6 right-6 z-20 rounded-full bg-[#0b8f4d] px-6 py-4 text-sm font-black text-white shadow-soft hover:bg-[#076f3d]"
          >
            Ask Harvello
          </button>
        )}
        {widgetOpen ? (
          <button
            onClick={() => setWidgetOpen(false)}
            className="focus-ring absolute bottom-6 right-6 z-30 grid h-12 w-12 place-items-center rounded-full bg-[#0b8f4d] text-lg font-black text-white shadow-soft hover:bg-[#076f3d]"
            aria-label="Close assistant"
          >
            X
          </button>
        ) : null}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[#dce4dd] bg-[#fbfbf6] p-4">
      <div className="text-3xl font-black text-[#073f32]">{value}</div>
      <div className="mt-1 text-sm font-semibold text-[#4c625b]">{label}</div>
    </div>
  );
}

function FormattedAnswer({ text }: { text: string }) {
  const blocks = cleanDisplayedAnswer(text).replace(/\n{3,}/g, "\n\n").split(/\n\s*\n/);

  return (
    <div className="space-y-3 text-sm leading-6 text-[#073f32]">
      {blocks.map((block, index) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
        const isList = lines.length > 1 && lines.every((line) => /^[-*]\s+/.test(line));

        if (isList) {
          return (
            <ul key={`${block}-${index}`} className="ml-4 list-disc space-y-1">
              {lines.map((line) => (
                <li key={line}>{formatInline(line.replace(/^[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`${block}-${index}`} className="whitespace-pre-wrap">
            {formatInline(block)}
          </p>
        );
      })}
    </div>
  );
}

function cleanDisplayedAnswer(text: string) {
  return text
    .replace(/^Based on the public website content indexed for this demo:\s*/i, "")
    .replace(/<\s*Back to all events/gi, "")
    .replace(/\b(Ways to play|Event Details|Download PDF|Save This Page as a PDF|Add to my calendar|Google Calendar|iCalendar|Outlook 365|Outlook Live)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function formatInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);

  return parts.map((part, index) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) return <strong key={`${part}-${index}`}>{bold[1]}</strong>;

    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a key={`${part}-${index}`} href={link[2]} target="_blank" className="font-semibold text-[#0b6f43] underline-offset-2 hover:underline">
          {link[1]}
        </a>
      );
    }

    return part;
  });
}
