import Link from "next/link";
import { BrandLockup } from "@/components/BrandLockup";
import { siteConfig } from "@/config/site";
import type { SessionState } from "@/lib/session";
import { isStaff } from "@/lib/session";
import { signOut } from "@/lib/actions/auth";

type Props = {
  session: SessionState;
};

const links = [
  { href: "/", label: "Archive" },
  { href: "/articles", label: "Letters" },
  { href: "/batches", label: "Batches" },
  { href: "/about", label: "About" },
] as const;

export function SiteHeader({ session }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/8 bg-paper">
      <div className="flex items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        <BrandLockup />

        <div className="flex items-center gap-1 sm:gap-2">
          <nav className="hidden items-center text-caption text-muted md:flex" aria-label={siteConfig.name}>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-h-11 items-center px-3 hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
            {isStaff(session.profile) ? (
              <Link href="/admin" className="inline-flex min-h-11 items-center px-3 hover:text-ink">
                Admin
              </Link>
            ) : null}
          </nav>

          {session.userId ? (
            <div className="flex items-center gap-1">
              <Link href="/account" className="inline-flex min-h-11 items-center px-3 text-caption text-ink">
                {session.profile?.name?.split(" ")[0] || "Account"}
              </Link>
              <form action={signOut}>
                <button type="submit" className="btn btn-quiet text-caption text-muted">
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <Link href="/join" className="btn btn-green">
              Join
            </Link>
          )}
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-1 text-muted md:hidden" aria-label="Sections">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex min-h-11 shrink-0 items-center px-3 text-caption"
          >
            {link.label}
          </Link>
        ))}
        {isStaff(session.profile) ? (
          <Link href="/admin" className="inline-flex min-h-11 shrink-0 items-center px-3 text-caption">
            Admin
          </Link>
        ) : null}
      </nav>

      {session.profile && session.profile.status === "pending" ? (
        <p className="border-t border-gold/40 bg-gold/10 px-4 py-3 text-caption text-ink sm:px-6">
          A volunteer still needs to verify you against the alumni list. You can
          look around; uploading waits until then.
        </p>
      ) : null}
    </header>
  );
}
