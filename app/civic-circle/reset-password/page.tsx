import type { Metadata } from "next";
import { CivicResetPassword } from "@/components/CivicResetPassword";

export const metadata: Metadata = { title: "Reset password | Civic Circle" };
export default function ResetPasswordPage() { return <CivicResetPassword />; }
