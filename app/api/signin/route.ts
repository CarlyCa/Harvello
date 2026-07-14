import { NextResponse } from "next/server";
import { findDemoForSignin } from "@/lib/demo-store";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; identifier?: string };
  const email = body.email?.trim() ?? "";
  const identifier = body.identifier?.trim() ?? "";

  if (!email && !identifier) {
    return NextResponse.json({ error: "Enter your email, website, or demo ID." }, { status: 400 });
  }

  const demo = await findDemoForSignin(identifier || email, email);
  if (!demo) {
    return NextResponse.json({ error: "We could not find a Harvello assistant for those details." }, { status: 404 });
  }

  return NextResponse.json({ portalUrl: `/portal/${demo.id}` });
}
