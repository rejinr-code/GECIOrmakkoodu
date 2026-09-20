import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSession, isStaff } from "@/lib/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!isStaff(session.profile)) {
    redirect("/sign-in");
  }

  const admin = session.profile?.role === "admin";

  return (
    <AppShell>
      <div className="border-b border-ink/8 px-4 sm:px-8">
        <nav className="flex flex-wrap gap-x-6 text-caption text-muted">
          <Link href="/admin" className="inline-flex min-h-11 items-center text-ink">
            Verification
          </Link>
          <Link href="/admin/photos" className="inline-flex min-h-11 items-center">
            Photographs
          </Link>
          <Link href="/admin/letters" className="inline-flex min-h-11 items-center">
            Letters
          </Link>
          <Link href="/admin/offers" className="inline-flex min-h-11 items-center">
            Offers
          </Link>
          <Link href="/admin/reports" className="inline-flex min-h-11 items-center">
            Flags
          </Link>
          {admin ? (
            <>
              <Link href="/admin/volunteers" className="inline-flex min-h-11 items-center">
                Volunteers
              </Link>
              <Link href="/admin/register" className="inline-flex min-h-11 items-center">
                Alumni list
              </Link>
              <Link href="/admin/batches" className="inline-flex min-h-11 items-center">
                Batch groups
              </Link>
              <Link href="/admin/settings" className="inline-flex min-h-11 items-center">
                Settings
              </Link>
              <Link href="/admin/prompts" className="inline-flex min-h-11 items-center">
                Prompt
              </Link>
              <Link href="/admin/legal" className="inline-flex min-h-11 items-center">
                Legal
              </Link>
            </>
          ) : null}
        </nav>
      </div>
      {children}
    </AppShell>
  );
}
