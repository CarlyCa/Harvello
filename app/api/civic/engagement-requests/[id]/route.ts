import { z } from "zod";
import { civicApiError, requireCivicAccount, writeCivicAudit } from "@/lib/civic-auth";
import { getServiceSupabase } from "@/lib/supabase";

const schema = z.object({ status: z.enum(["under_review", "approved", "declined"]), assignedTo: z.string().uuid().nullable().optional(), reviewNote: z.string().trim().max(2000).optional() });
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const actor = await requireCivicAccount(["Administrator", "Reviewer"]); const input = schema.parse(await request.json());
    const { error } = await getServiceSupabase()!.from("civic_engagement_requests").update({ status: input.status, assigned_to: input.assignedTo, review_note: input.reviewNote, updated_at: new Date().toISOString() }).eq("id", params.id);
    if (error) throw error; await writeCivicAudit(actor.id, `engagement.${input.status}`, "civic_engagement_request", params.id); return Response.json({ ok: true });
  } catch (error) { return civicApiError(error); }
}
