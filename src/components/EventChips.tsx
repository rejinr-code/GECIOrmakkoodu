import Link from "next/link";
import { albumHref } from "@/config/site";

export function EventChips({
  tags,
  year,
  branch,
  event,
  timeline = false,
}: {
  tags: Array<{ slug: string; label: string }>;
  year?: number | null;
  branch?: string | null;
  event: string | null;
  timeline?: boolean;
}) {
  if (tags.length === 0) return null;

  return (
    <nav aria-label="Events" className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-caption">
      <Link
        href={albumHref({ year, branch, view: timeline ? "timeline" : undefined })}
        className={event ? "text-muted" : "text-gold"}
        aria-current={event ? undefined : "page"}
      >
        All events
      </Link>
      {tags.map((tag) => {
        const active = tag.slug === event;
        return (
          <Link
            key={tag.slug}
            href={albumHref({
              year,
              branch,
              event: tag.slug,
              view: timeline ? "timeline" : undefined,
            })}
            className={active ? "text-gold" : "text-muted"}
            aria-current={active ? "page" : undefined}
          >
            {tag.label}
          </Link>
        );
      })}
    </nav>
  );
}
