import type { Metadata } from "next";
import { CivicAccounts } from "@/components/CivicAccounts";
import { CivicCircleShell } from "@/components/CivicCircleShell";

export const metadata: Metadata = { title: "Accounts | Civic Circle" };

export default function CivicAccountsPage() {
  return <CivicCircleShell><CivicAccounts /></CivicCircleShell>;
}
