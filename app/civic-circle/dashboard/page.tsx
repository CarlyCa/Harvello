import type { Metadata } from "next";
import { CivicCircleDashboard } from "@/components/CivicCircleDashboard";
import { CivicCircleShell } from "@/components/CivicCircleShell";

export const metadata: Metadata = { title: "Dashboard | Civic Circle" };

export default function CivicCircleDashboardPage() {
  return <CivicCircleShell><CivicCircleDashboard /></CivicCircleShell>;
}
