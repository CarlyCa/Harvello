import { z } from "zod";
import { civicApiError, requireCivicAccount, writeCivicAudit, civicRoles } from "@/lib/civic-auth";
import { getServiceSupabase } from "@/lib/supabase";

const createSchema = z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().toLowerCase().email().refine((value) => value.endsWith("@hornets.com"), "A Hornets email is required."), department: z.string().trim().max(100).optional(), role: z.enum(civicRoles).default("Employee") });

export async function GET() {
  try {
    await requireCivicAccount(["Administrator"]);
    const { data, error } = await getServiceSupabase()!.from("civic_accounts").select("id,name,email,department,notes,role,active,auth_user_id").order("name");
    if (error) throw error;
    return Response.json({ accounts: data });
  } catch (error) { return civicApiError(error); }
}

export async function POST(request: Request) {
  try {
    const actor = await requireCivicAccount(["Administrator"]);
    const input = createSchema.parse(await request.json());
    const { data, error } = await getServiceSupabase()!.from("civic_accounts").insert({ ...input, department: input.department || null, active: true, source: "app" }).select("id,name,email,department,notes,role,active,auth_user_id").single();
    if (error) throw error;
    await writeCivicAudit(actor.id, "account.created", "civic_account", data.id, { email: data.email, role: data.role });
    return Response.json({ account: data }, { status: 201 });
  } catch (error) { return civicApiError(error); }
}
