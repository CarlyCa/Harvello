import { z } from "zod";
import { civicApiError, requireCivicAccount, writeCivicAudit } from "@/lib/civic-auth";
import { getServiceSupabase } from "@/lib/supabase";

const createSchema = z.object({ eventName: z.string().trim().min(2).max(160), organization: z.string().trim().min(2).max(160), eventAt: z.string().datetime(), contactName: z.string().trim().max(160).optional(), audience: z.string().trim().max(300).optional(), description: z.string().trim().max(3000).default("") });
export async function GET() {
  try {
    await requireCivicAccount(["Administrator", "Reviewer"]);
    const { data, error } = await getServiceSupabase()!.from("civic_engagement_requests").select("id,event_name,organization,event_at,contact_name,audience,description,status,assigned_to,review_note").order("event_at");
    if (error) throw error; return Response.json({ requests: data });
  } catch (error) { return civicApiError(error); }
}
export async function POST(request: Request) {
  try {
    const actor = await requireCivicAccount(); const input = createSchema.parse(await request.json());
    const { data, error } = await getServiceSupabase()!.from("civic_engagement_requests").insert({ event_name: input.eventName, organization: input.organization, event_at: input.eventAt, contact_name: input.contactName || null, audience: input.audience || null, description: input.description, submitted_by: actor.id }).select().single();
    if (error) throw error; await writeCivicAudit(actor.id, "engagement.submitted", "civic_engagement_request", data.id); return Response.json({ request: data }, { status: 201 });
  } catch (error) { return civicApiError(error); }
}
