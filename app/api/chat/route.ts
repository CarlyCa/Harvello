import { NextRequest, NextResponse } from "next/server";
import { answerQuestion } from "@/lib/chat";
import { getDemo, getDemoByOrganizationSlug, incrementChatCount } from "@/lib/demo-store";

const MAX_DEMO_MESSAGES = 5;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      demoId?: string;
      organizationSlug?: string;
      question?: string;
      sessionId?: string;
      mode?: "demo" | "hosted" | "widget";
    };
    const question = body.question?.trim() ?? "";
    if (!question || question.length > 1000) {
      return NextResponse.json({ error: "Enter a question under 1,000 characters." }, { status: 400 });
    }

    const demo = body.demoId ? await getDemo(body.demoId) : body.organizationSlug ? await getDemoByOrganizationSlug(body.organizationSlug) : null;
    if (!demo) return NextResponse.json({ error: "Assistant not found." }, { status: 404 });

    const sessionKey = `${body.sessionId ?? request.ip ?? "local"}:${demo.id}`;
    if ((body.mode ?? "demo") === "demo") {
      const used = incrementChatCount(sessionKey);
      if (used > MAX_DEMO_MESSAGES) {
        return NextResponse.json(
          { error: "Email Harvello to claim this assistant and continue setup for your website.", limitReached: true },
          { status: 402 }
        );
      }
    }

    const result = await answerQuestion(demo, question);
    return NextResponse.json({
      ...result,
      remainingMessages: (body.mode ?? "demo") === "demo" ? Math.max(0, MAX_DEMO_MESSAGES - 1) : undefined
    });
  } catch {
    return NextResponse.json({ error: "Unable to answer that question right now." }, { status: 500 });
  }
}
