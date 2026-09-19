import type { User } from "@supabase/supabase-js";
import { getServiceSupabase } from "@/lib/supabase";
import { getServerSupabase } from "@/lib/supabase-server";

export const civicRoles = ["Administrator", "Employee", "Hive Ambassador", "Reviewer", "Opportunity Coordinator", "Team Lead"] as const;
export type CivicRole = typeof civicRoles[number];

export type AuthenticatedCivicAccount = {
  id: string;
  auth_user_id: string | null;
  name: string;
  email: string | null;
  department: string | null;
  notes: string | null;
  role: CivicRole;
  active: boolean;
};

export class CivicAuthError extends Error {
  constructor(public status: 401 | 403 | 503, message: string) {
    super(message);
  }
}

export async function requireCivicAccount(roles?: readonly CivicRole[]) {
  const authClient = getServerSupabase();
  const admin = getServiceSupabase();
  if (!authClient || !admin) throw new CivicAuthError(503, "Civic Circle authentication is not configured.");

  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) throw new CivicAuthError(401, "Sign in is required.");

  const account = await findAndLinkAccount(user);
  if (!account?.active) throw new CivicAuthError(403, "This Civic Circle account is not active.");
  if (roles && !roles.includes(account.role)) throw new CivicAuthError(403, "You do not have permission to perform this action.");
  return account;
}

async function findAndLinkAccount(user: User): Promise<AuthenticatedCivicAccount | null> {
  const admin = getServiceSupabase();
  if (!admin) return null;

  const columns = "id,auth_user_id,name,email,department,notes,role,active";
  const byId = await admin.from("civic_accounts").select(columns).eq("auth_user_id", user.id).maybeSingle();
  if (byId.error) throw byId.error;
  if (byId.data) return byId.data as AuthenticatedCivicAccount;

  const email = user.email?.trim().toLowerCase();
  if (!email || !email.endsWith("@hornets.com")) return null;
  const byEmail = await admin.from("civic_accounts").select(columns).eq("email", email).maybeSingle();
  if (byEmail.error) throw byEmail.error;
  if (!byEmail.data?.active || byEmail.data.auth_user_id) return null;

  const linked = await admin
    .from("civic_accounts")
    .update({ auth_user_id: user.id, source: "auth", updated_at: new Date().toISOString() })
    .eq("id", byEmail.data.id)
    .is("auth_user_id", null)
    .select(columns)
    .single();
  if (linked.error) throw linked.error;
  return linked.data as AuthenticatedCivicAccount;
}

export function civicApiError(error: unknown) {
  if (error instanceof CivicAuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error("Civic Circle API error", error);
  return Response.json({ error: "The request could not be completed." }, { status: 500 });
}

export async function writeCivicAudit(actorId: string, action: string, entityType: string, entityId: string, details: Record<string, unknown> = {}) {
  const admin = getServiceSupabase();
  if (!admin) return;
  const { error } = await admin.from("civic_audit_log").insert({ actor_id: actorId, action, entity_type: entityType, entity_id: entityId, details });
  if (error) console.error("Failed to write Civic Circle audit record", error);
}

export function isCivicEditor(account: Pick<AuthenticatedCivicAccount, "email">) {
  return new Set(["ccallans@hornets.com", "wtarver@hornets.com", "lcommander@hornets.com"]).has(account.email ?? "");
}
