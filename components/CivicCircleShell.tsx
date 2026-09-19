"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

type Me = { account: { name: string; email: string | null; role: string }; canEditContent: boolean; canManageAccounts: boolean };

export function CivicCircleShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch("/api/civic/me", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error("Unauthorized");
      setMe(await response.json());
    }).catch(async () => {
      await getBrowserSupabase().auth.signOut();
      router.replace("/civic-circle/login");
      router.refresh();
    });
  }, [router]);

  async function signOut() {
    await getBrowserSupabase().auth.signOut();
    router.push("/civic-circle/login");
    router.refresh();
  }

  if (!me) return <main className="min-h-screen bg-[#f5f7fc]" />;

  return (
    <main className="min-h-screen bg-[#f5f7fc] text-[#100d35]">
      <nav className="border-b border-[#e2e6f0] bg-white px-5 py-4">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-5">
          <Link href="/civic-circle/dashboard" className="flex items-center gap-3 font-extrabold tracking-[-0.02em]">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[linear-gradient(145deg,#7c3aed,#24145f)] text-sm text-white">CC</span>
            Civic Circle
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link className={pathname.endsWith("/circle") ? "font-bold text-violet-700" : "font-semibold text-[#626b80]"} href="/civic-circle/circle">
              My Civic Circle
            </Link>
            {(me.account.role === "Administrator" || me.account.role === "Reviewer" || ["wtarver@hornets.com", "lcommander@hornets.com"].includes(me.account.email ?? "")) ? <Link className={pathname.endsWith("/review") ? "font-bold text-violet-700" : "font-semibold text-[#626b80]"} href="/civic-circle/review">Review</Link> : null}
            {me.canEditContent ? (
              <Link className={pathname.endsWith("/editor") ? "font-bold text-violet-700" : "font-semibold text-[#626b80]"} href="/civic-circle/editor">
                Edit content
              </Link>
            ) : null}
            {me.canManageAccounts ? (
              <Link className={pathname.endsWith("/accounts") ? "font-bold text-violet-700" : "font-semibold text-[#626b80]"} href="/civic-circle/accounts">
                Accounts
              </Link>
            ) : null}
            <button onClick={signOut} className="rounded-lg border border-[#d9deea] px-3 py-2 font-semibold text-[#34364d] hover:bg-slate-50">
              Sign out
            </button>
          </div>
        </div>
      </nav>
      {children}
    </main>
  );
}
