import { NextResponse } from "next/server";
import { getDemo, updateDemo } from "@/lib/demo-store";

export async function POST(request: Request) {
  const body = (await request.json()) as { demoId?: string; email?: string };
  if (!body.demoId || !body.email?.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email to claim this assistant." }, { status: 400 });
  }
  const demo = await getDemo(body.demoId);
  if (!demo) return NextResponse.json({ error: "Demo not found." }, { status: 404 });
  const claimed = await updateDemo(demo.id, { status: "claimed", claimedEmail: body.email });
  return NextResponse.json({ demo: claimed, dashboardUrl: `/dashboard?demoId=${demo.id}` });
}
