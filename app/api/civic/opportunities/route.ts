import { z } from "zod";
import { civicApiError, requireCivicAccount, writeCivicAudit } from "@/lib/civic-auth";
import { getServiceSupabase } from "@/lib/supabase";

const opportunitySchema = z.object({ title: z.string().trim().min(2).max(160), organization: z.string().trim().min(2).max(160), description: z.string().trim().max(3000).default(""), startsAt: z.string().datetime(), endsAt: z.string().datetime() }).refine((value) => new Date(value.endsAt) > new Date(value.startsAt), { message: "The end must be after the start." });

export async function GET() {
  try {
    const actor = await requireCivicAccount();
    const admin = getServiceSupabase()!;
    let query = admin.from("civic_opportunities").select("id,title,organization,description,starts_at,ends_at,status,submitted_by,civic_opportunity_approvals(approver_key,approved_at),submitter:civic_accounts!submitted_by(name)").order("starts_at");
    if (!["Administrator", "Reviewer", "Opportunity Coordinator"].includes(actor.role) && !["wtarver@hornets.com", "lcommander@hornets.com"].includes(actor.email ?? "")) query = query.eq("status", "published");
    const { data, error } = await query;
    if (error) throw error;
    return Response.json({ opportunities: data });
  } catch (error) { return civicApiError(error); }
}

export async function POST(request: Request) {
  try {
    const actor = await requireCivicAccount();
    const input = opportunitySchema.parse(await request.json());
    const { data, error } = await getServiceSupabase()!.from("civic_opportunities").insert({ title: input.title, organization: input.organization, description: input.description, starts_at: input.startsAt, ends_at: input.endsAt, submitted_by: actor.id, status: "pending_approval" }).select().single();
    if (error) throw error;
    await writeCivicAudit(actor.id, "opportunity.submitted", "civic_opportunity", data.id, { title: data.title });
    return Response.json({ opportunity: data }, { status: 201 });
  } catch (error) { return civicApiError(error); }
}
