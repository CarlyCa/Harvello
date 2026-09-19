import { z } from "zod";
import { civicApiError, civicRoles, requireCivicAccount, writeCivicAudit } from "@/lib/civic-auth";
import { getServiceSupabase } from "@/lib/supabase";

const patchSchema = z.object({ role: z.enum(civicRoles).optional(), active: z.boolean().optional(), email: z.string().trim().toLowerCase().email().refine((value) => value.endsWith("@hornets.com")).nullable().optional(), department: z.string().trim().max(100).nullable().optional() }).refine((value) => Object.keys(value).length > 0);

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const actor = await requireCivicAccount(["Administrator"]);
    const input = patchSchema.parse(await request.json());
    if (params.id === actor.id && (input.active === false || (input.role && input.role !== "Administrator"))) return Response.json({ error: "You cannot remove your own administrator access." }, { status: 400 });
    const admin = getServiceSupabase()!;
    const previous = await admin.from("civic_accounts").select("role,active,email,department").eq("id", params.id).single();
    if (previous.error) throw previous.error;
    const { data, error } = await admin.from("civic_accounts").update({ ...input, updated_at: new Date().toISOString() }).eq("id", params.id).select("id,name,email,department,notes,role,active,auth_user_id").single();
    if (error) throw error;
    await writeCivicAudit(actor.id, "account.updated", "civic_account", params.id, { before: previous.data, after: input });
    return Response.json({ account: data });
  } catch (error) { return civicApiError(error); }
}
