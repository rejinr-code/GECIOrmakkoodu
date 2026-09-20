import Link from "next/link";
import {
  albumHref,
  branchesForYear,
  type BranchId,
} from "@/config/site";

export function AlbumTabs({
  year,
  branch,
  event,
}: {
  year: number;
  branch: BranchId | null;
  event?: string | null;
}) {
  const branches = branchesForYear(year);

  return (
    <nav aria-label="Branches" className="mt-7 flex gap-1 overflow-x-auto">
      <Link
        href={albumHref({ year, event })}
        className={`inline-flex min-h-11 shrink-0 items-center border-b-2 px-3 text-caption font-medium ${
          branch ? "border-transparent text-muted" : "border-gold text-gold"
        }`}
        aria-current={branch ? undefined : "page"}
      >
        Whole album
      </Link>
      {branches.map((item) => {
        const active = item.id === branch;
        return (
          <Link
            key={item.id}
            href={albumHref({ year, branch: item.id, event })}
            title={item.label}
            aria-label={item.label}
            className={`inline-flex min-h-11 shrink-0 items-center border-b-2 px-3 text-caption font-medium ${
              active ? "border-gold text-gold" : "border-transparent text-muted"
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
