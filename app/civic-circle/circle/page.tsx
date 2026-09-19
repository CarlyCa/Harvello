import type { Metadata } from "next";
import { CivicCircleShell } from "@/components/CivicCircleShell";
import { MyCivicCircle } from "@/components/MyCivicCircle";

export const metadata: Metadata = { title: "My Civic Circle" };

export default function MyCivicCirclePage() {
  return <CivicCircleShell><MyCivicCircle /></CivicCircleShell>;
}
