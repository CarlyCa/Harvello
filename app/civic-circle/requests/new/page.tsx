import type { Metadata } from "next";
import { CivicCircleShell } from "@/components/CivicCircleShell";
import { CivicRequestForm } from "@/components/CivicRequestForm";

export const metadata: Metadata = { title: "Submit speaking request | Civic Circle" };
export default function NewRequestPage() { return <CivicCircleShell><CivicRequestForm /></CivicCircleShell>; }
