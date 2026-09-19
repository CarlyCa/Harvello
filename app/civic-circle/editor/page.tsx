import type { Metadata } from "next";
import { CivicCircleShell } from "@/components/CivicCircleShell";
import { CivicContentEditor } from "@/components/CivicContentEditor";

export const metadata: Metadata = { title: "Edit content | Civic Circle" };

export default function CivicContentEditorPage() {
  return <CivicCircleShell><CivicContentEditor /></CivicCircleShell>;
}
