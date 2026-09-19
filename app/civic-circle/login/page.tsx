import type { Metadata } from "next";
import { CivicCircleLogin } from "@/components/CivicCircleLogin";

export const metadata: Metadata = {
  title: "Sign in | Civic Circle",
  description: "Sign in to Civic Circle with your Hornets email."
};

export default function CivicCircleLoginPage() {
  return <CivicCircleLogin />;
}
