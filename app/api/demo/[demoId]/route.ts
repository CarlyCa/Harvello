import { NextResponse } from "next/server";
import { getDemo, updateDemo } from "@/lib/demo-store";
import { toPublicDemo } from "@/lib/public-demo";
import type { DemoRecord } from "@/lib/types";

export async function GET(_: Request, { params }: { params: { demoId: string } }) {
  try {
    const demo = await getDemo(params.demoId);
    if (!demo) return NextResponse.json({ error: "Demo not found." }, { status: 404 });
    return NextResponse.json({ demo: toPublicDemo(demo) });
  } catch (error) {
    console.error("Demo GET failed", error);
    return NextResponse.json({ error: "Unable to load this demo." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { demoId: string } }) {
  try {
    const demo = await getDemo(params.demoId);
    if (!demo) return NextResponse.json({ error: "Demo not found." }, { status: 404 });

    const body = (await request.json()) as Partial<Pick<DemoRecord, "widgetConfig" | "hardcodedAnswers">>;
    const patch: Partial<DemoRecord> = {};

    if (body.widgetConfig) {
      const accentColor = body.widgetConfig.accentColor?.trim() ?? "";
      if (!/^#[0-9a-f]{6}$/i.test(accentColor)) {
        return NextResponse.json({ error: "Accent color must be a valid hex color like #0b8f4d." }, { status: 400 });
      }
      patch.widgetConfig = {
        assistantName: (body.widgetConfig.assistantName ?? "Resident Assistant").trim().slice(0, 80) || "Resident Assistant",
        accentColor,
        greeting:
          (body.widgetConfig.greeting ?? `Hi, I can help with information from ${demo.organizationName}'s website.`)
            .trim()
            .slice(0, 500) || `Hi, I can help with information from ${demo.organizationName}'s website.`,
        position: body.widgetConfig.position === "left" ? "left" : "right"
      };
    }

    if (body.hardcodedAnswers) {
      patch.hardcodedAnswers = body.hardcodedAnswers
        .map((item) => ({
          id: item.id || `answer_${Math.random().toString(36).slice(2)}`,
          trigger: item.trigger.trim().slice(0, 300),
          answer: item.answer.trim().slice(0, 3000),
          active: item.active !== false
        }))
        .filter((item) => item.trigger && item.answer)
        .slice(0, 50);
    }

    const updated = await updateDemo(params.demoId, patch);
    return NextResponse.json({ demo: updated ? toPublicDemo(updated) : null });
  } catch (error) {
    console.error("Demo PATCH failed", error);
    return NextResponse.json({ error: "Unable to save this demo setup." }, { status: 500 });
  }
}
