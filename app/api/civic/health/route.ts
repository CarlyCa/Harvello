import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ connected: false, error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { count, error } = await supabase.from("civic_accounts").select("id", { count: "exact", head: true });
    if (error) throw error;
    return NextResponse.json({ connected: true, accountCount: count ?? 0, checkedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Civic Circle database health check failed", error);
    return NextResponse.json({ connected: false, error: "Database connection failed." }, { status: 503 });
  }
}
