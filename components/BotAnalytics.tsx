import type { DemoRecord } from "@/lib/types";

export function BotAnalytics({ demo }: { demo: DemoRecord }) {
  const analytics = demo.analytics ?? {
    totalQuestions: 0,
    demoQuestions: 0,
    widgetQuestions: 0,
    hostedQuestions: 0,
    questions: []
  };
  const averageConfidence = analytics.questions.length
    ? Math.round((analytics.questions.reduce((sum, question) => sum + question.confidence, 0) / analytics.questions.length) * 100)
    : 0;
  const topTopics = buildTopTopics(analytics.questions.map((item) => item.question));

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[#dce4dd] bg-white p-8 shadow-soft">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0b8f4d]">Bot dashboard</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-normal text-[#073f32]">{demo.organizationName}</h1>
            <p className="mt-3 text-sm leading-6 text-[#4c625b]">{demo.domain}</p>
          </div>
          <a href={`/assistant/${demo.organizationSlug}`} className="focus-ring rounded-md bg-[#0b8f4d] px-5 py-3 text-sm font-bold text-white hover:bg-[#076f3d]">
            Open assistant
          </a>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Questions asked" value={analytics.totalQuestions} />
        <Metric label="Avg. confidence" value={averageConfidence ? `${averageConfidence}%` : "N/A"} />
        <Metric label="Pages indexed" value={demo.pagesIndexed} />
        <Metric label="Approved answers" value={demo.hardcodedAnswers?.filter((answer) => answer.active).length ?? 0} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-[24px] border border-[#dce4dd] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#073f32]">Traffic by surface</h2>
          <div className="mt-5 space-y-3">
            <Bar label="Website widget" value={analytics.widgetQuestions} max={analytics.totalQuestions} />
            <Bar label="Demo page" value={analytics.demoQuestions} max={analytics.totalQuestions} />
            <Bar label="Hosted assistant" value={analytics.hostedQuestions} max={analytics.totalQuestions} />
          </div>
        </div>

        <div className="rounded-[24px] border border-[#dce4dd] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#073f32]">Top question topics</h2>
          <div className="mt-5 space-y-3">
            {topTopics.length ? (
              topTopics.map(([topic, count]) => <Bar key={topic} label={topic} value={count} max={topTopics[0][1]} />)
            ) : (
              <p className="rounded-lg bg-[#f5fbf4] p-4 text-sm leading-6 text-[#4c625b]">
                Topics will appear after visitors start asking questions.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-[#dce4dd] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-[#073f32]">Recent questions</h2>
        <div className="mt-5 divide-y divide-[#dce4dd]">
          {analytics.questions.length ? (
            analytics.questions.slice(0, 12).map((question) => (
              <div key={question.id} className="grid gap-2 py-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="font-bold text-[#073f32]">{question.question}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#6a7b75]">
                    {question.mode} · {new Date(question.askedAt).toLocaleString()}
                  </p>
                </div>
                <p className="text-sm font-bold text-[#0b6f43]">{Math.round(question.confidence * 100)}% confidence</p>
              </div>
            ))
          ) : (
            <p className="rounded-lg bg-[#f5fbf4] p-4 text-sm leading-6 text-[#4c625b]">
              No visitor questions have been logged for this assistant yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[20px] border border-[#dce4dd] bg-white p-5 shadow-sm">
      <p className="text-3xl font-black text-[#073f32]">{value}</p>
      <p className="mt-1 text-sm font-bold text-[#4c625b]">{label}</p>
    </div>
  );
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max ? Math.max(6, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between gap-3 text-sm font-bold text-[#4c625b]">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#e8f4e9]">
        <div className="h-full rounded-full bg-[#0b8f4d]" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function buildTopTopics(questions: string[]) {
  const topics = new Map<string, number>();
  const topicTerms: Array<[string, string[]]> = [
    ["Pricing", ["price", "pricing", "cost", "fee", "quote"]],
    ["Appointments", ["appointment", "booking", "schedule", "reservation"]],
    ["Support", ["support", "help", "issue", "troubleshoot", "problem"]],
    ["Policies", ["policy", "return", "refund", "warranty", "terms"]],
    ["Events", ["event", "calendar", "webinar", "workshop"]],
    ["Services", ["service", "product", "feature", "plan"]],
    ["Hours", ["hour", "open", "close"]],
    ["Contact", ["contact", "phone", "email"]]
  ];

  for (const question of questions) {
    const lower = question.toLowerCase();
    const match = topicTerms.find(([, terms]) => terms.some((term) => lower.includes(term)));
    const topic = match?.[0] ?? "Other";
    topics.set(topic, (topics.get(topic) ?? 0) + 1);
  }

  return Array.from(topics.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
}
