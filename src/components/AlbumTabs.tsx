import Link from "next/link";
import {
  albumHref,
  branchesForYear,
  siteConfig,
  type BranchId,
} from "@/config/site";

export function AlbumTabs({
  year,
  college = false,
  branch,
  event,
}: {
  year?: number | null;
  college?: boolean;
  branch: BranchId | null;
  event?: string | null;
}) {
  const branches = college ? [...siteConfig.branches] : year ? branchesForYear(year) : [];
  const base = { year: college ? null : year, college, event };

  return (
    <nav aria-label="Branches" className="mt-7 flex gap-1 overflow-x-auto">
      <Link
        href={albumHref(base)}
        className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-caption font-medium ${
          branch ? "text-muted hover:bg-ink/5" : "bg-gold/15 text-gold"
        }`}
        aria-current={branch ? undefined : "page"}
      >
        {college ? "Whole college" : "Whole album"}
      </Link>
      {branches.map((item) => {
        const active = item.id === branch;
        return (
          <Link
            key={item.id}
            href={albumHref({ ...base, branch: item.id })}
            title={item.label}
            aria-label={item.label}
            className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-caption font-medium ${
              active ? "bg-gold/15 text-gold" : "text-muted hover:bg-ink/5"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {item.id}
          </Link>
        );
      })}
    </nav>
  );
}
