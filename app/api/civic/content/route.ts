import { z } from "zod";
import { civicApiError, isCivicEditor, requireCivicAccount, writeCivicAudit } from "@/lib/civic-auth";
import { getServiceSupabase } from "@/lib/supabase";

const contentSchema = z.object({ greeting: z.string().trim().min(1).max(160), introduction: z.string().trim().min(1).max(600), actions: z.array(z.object({ title: z.string().trim().min(1).max(100), description: z.string().trim().min(1).max(200) })).length(3), upcomingHeading: z.string().trim().min(1).max(100), tasksHeading: z.string().trim().min(1).max(100) });

export async function GET() {
  try {
    await requireCivicAccount();
    const { data, error } = await getServiceSupabase()!.from("civic_content").select("value,updated_at").eq("content_key", "dashboard").single();
    if (error) throw error;
    return Response.json({ content: data.value, updatedAt: data.updated_at });
  } catch (error) { return civicApiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireCivicAccount();
    if (!isCivicEditor(actor)) return Response.json({ error: "Editor access is limited to Carly, Whitney, and Lily." }, { status: 403 });
    const content = contentSchema.parse(await request.json());
    const { error } = await getServiceSupabase()!.from("civic_content").upsert({ content_key: "dashboard", value: content, updated_by: actor.id, updated_at: new Date().toISOString() });
    if (error) throw error;
    await writeCivicAudit(actor.id, "content.updated", "civic_content", "dashboard");
    return Response.json({ content });
  } catch (error) { return civicApiError(error); }
}
