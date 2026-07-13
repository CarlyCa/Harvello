import { NextRequest, NextResponse } from "next/server";
import { createDemoFromUrl } from "@/lib/demo-service";
import { toPublicDemo } from "@/lib/public-demo";

const ipCreates = new Map<string, number[]>();

export async function POST(request: NextRequest) {
  try {
    const ip = request.ip ?? request.headers.get("x-forwarded-for") ?? "local";
    const now = Date.now();
    const recent = (ipCreates.get(ip) ?? []).filter((time) => now - time < 60 * 60 * 1000);
    if (recent.length >= 5) {
      return NextResponse.json({ error: "Too many demo requests. Please try again later." }, { status: 429 });
    }
    recent.push(now);
    ipCreates.set(ip, recent);

    const body = (await request.json()) as { url?: string };
    if (!body.url || body.url.length > 300) {
      return NextResponse.json({ error: "Enter a valid park district website URL." }, { status: 400 });
    }
    const demo = await createDemoFromUrl(body.url);
    if (demo.status === "failed") return NextResponse.json({ error: demo.error, demo: toPublicDemo(demo) }, { status: 422 });
    return NextResponse.json({ demoId: demo.id, demo: toPublicDemo(demo) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create demo." },
      { status: 400 }
    );
  }
}
