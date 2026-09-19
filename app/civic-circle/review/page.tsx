import type { Metadata } from "next";
import { CivicCircleReview } from "@/components/CivicCircleReview";
import { CivicCircleShell } from "@/components/CivicCircleShell";

export const metadata: Metadata = { title: "Review requests | Civic Circle" };

export default function CivicCircleReviewPage() {
  return <CivicCircleShell><CivicCircleReview /></CivicCircleShell>;
}
