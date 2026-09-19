import { civicApiError, isCivicEditor, requireCivicAccount } from "@/lib/civic-auth";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const account = await requireCivicAccount();
    return Response.json({ account, canEditContent: isCivicEditor(account), canManageAccounts: account.role === "Administrator" });
  } catch (error) { return civicApiError(error); }
}
