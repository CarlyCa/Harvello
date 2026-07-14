export type SourceType = "webpage" | "pdf" | "faq" | "upload";

export type Citation = {
  title: string;
  url: string;
};

export type IndexedSource = {
  id: string;
  url: string;
  title: string;
  description?: string;
  type: SourceType;
  text: string;
};

export type Chunk = {
  id: string;
  sourceId: string;
  sourceTitle: string;
  sourceUrl: string;
  content: string;
  embedding?: number[];
};

export type DemoRecord = {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  domain: string;
  websiteUrl: string;
  status: "pending" | "crawling" | "processing" | "ready" | "failed" | "claimed";
  progress: number;
  message: string;
  createdAt: string;
  expiresAt: string;
  pagesIndexed: number;
  pdfsIndexed: number;
  categories: string[];
  suggestedQuestions: string[];
  sources: IndexedSource[];
  chunks: Chunk[];
  widgetConfig?: {
    assistantName: string;
    accentColor: string;
    greeting: string;
    position: "right" | "left";
  };
  hardcodedAnswers?: Array<{
    id: string;
    trigger: string;
    answer: string;
    active: boolean;
  }>;
  analytics?: {
    totalQuestions: number;
    demoQuestions: number;
    widgetQuestions: number;
    hostedQuestions: number;
    lastAskedAt?: string;
    questions: Array<{
      id: string;
      question: string;
      mode: "demo" | "hosted" | "widget";
      askedAt: string;
      confidence: number;
      citationsCount: number;
    }>;
  };
  error?: string;
  claimedEmail?: string;
};

export type ChatResult = {
  answer: string;
  citations: Citation[];
  confidence: number;
  remainingMessages?: number;
};
