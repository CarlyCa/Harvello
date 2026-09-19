import { z } from "zod";
import { civicApiError, requireCivicAccount, writeCivicAudit } from "@/lib/civic-auth";
import { getServiceSupabase } from "@/lib/supabase";

const schema = z.object({ opportunityId: z.string().uuid(), registered: z.boolean().default(true) });
export async function GET() {
  try {
    const actor = await requireCivicAccount();
    const { data, error } = await getServiceSupabase()!.from("civic_registrations").select("status,registered_at,opportunity:civic_opportunities(id,title,organization,starts_at,ends_at,status)").eq("account_id", actor.id);
    if (error) throw error;
    return Response.json({ registrations: data });
  } catch (error) { return civicApiError(error); }
}
export async function POST(request: Request) {
  try {
    const actor = await requireCivicAccount(); const input = schema.parse(await request.json()); const admin = getServiceSupabase()!;
    const opportunity = await admin.from("civic_opportunities").select("id,status").eq("id", input.opportunityId).eq("status", "published").single();
    if (opportunity.error) return Response.json({ error: "This opportunity is not available." }, { status: 400 });
    const status = input.registered ? "registered" : "cancelled";
    const { error } = await admin.from("civic_registrations").upsert({ opportunity_id: input.opportunityId, account_id: actor.id, status, registered_at: new Date().toISOString() });
    if (error) throw error;
    await writeCivicAudit(actor.id, `registration.${status}`, "civic_opportunity", input.opportunityId);
    return Response.json({ ok: true, status });
  } catch (error) { return civicApiError(error); }
}
