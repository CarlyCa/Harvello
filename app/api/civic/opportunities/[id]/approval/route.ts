import { z } from "zod";
import { civicApiError, requireCivicAccount, writeCivicAudit } from "@/lib/civic-auth";
import { getServiceSupabase } from "@/lib/supabase";

const decisionSchema = z.object({ decision: z.enum(["approve", "reject"]) });
const approvers = new Map([["wtarver@hornets.com", "whitney"], ["lcommander@hornets.com", "lily"]] as const);

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const actor = await requireCivicAccount();
    const approverKey = approvers.get(actor.email as "wtarver@hornets.com" | "lcommander@hornets.com");
    if (!approverKey) return Response.json({ error: "Only Whitney or Lily can decide an opportunity." }, { status: 403 });
    const { decision } = decisionSchema.parse(await request.json());
    const admin = getServiceSupabase()!;
    if (decision === "reject") {
      const { error } = await admin.from("civic_opportunities").update({ status: "rejected", updated_at: new Date().toISOString() }).eq("id", params.id).eq("status", "pending_approval");
      if (error) throw error;
    } else {
      const { error } = await admin.from("civic_opportunity_approvals").upsert({ opportunity_id: params.id, approver_key: approverKey, approved_by: actor.id });
      if (error) throw error;
    }
    await writeCivicAudit(actor.id, `opportunity.${decision}d`, "civic_opportunity", params.id, { approver: approverKey });
    return Response.json({ ok: true });
  } catch (error) { return civicApiError(error); }
}
