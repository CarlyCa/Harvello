import { NextResponse } from "next/server";
import { getDemo, getDemoByOrganizationSlug } from "@/lib/demo-store";

export async function GET(_: Request, { params }: { params: { orgId: string } }) {
  const demo = getDemo(params.orgId) ?? getDemoByOrganizationSlug(params.orgId);
  if (!demo) return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  const widgetConfig = demo.widgetConfig;
  return NextResponse.json({
    orgId: demo.id,
    assistantName: widgetConfig?.assistantName ?? "Resident Assistant",
    accentColor: widgetConfig?.accentColor ?? "#2f6f5e",
    greeting: widgetConfig?.greeting ?? `Hi, I can help with information from ${demo.organizationName}'s website.`,
    suggestedQuestions: demo.suggestedQuestions,
    position: widgetConfig?.position ?? "right"
  });
}
