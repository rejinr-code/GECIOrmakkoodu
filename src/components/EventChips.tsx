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
    <nav aria-label="Events" className="mt-4 flex flex-wrap gap-1">
      <Link
        href={albumHref({ year, branch, view: timeline ? "timeline" : undefined })}
        className={`inline-flex min-h-9 items-center rounded-full px-3 text-caption ${
          event ? "text-muted hover:bg-ink/5" : "bg-ink/5 text-ink"
        }`}
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
            className={`inline-flex min-h-9 items-center rounded-full px-3 text-caption ${
              active ? "bg-ink/5 text-ink" : "text-muted hover:bg-ink/5"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {tag.label}
          </Link>
        );
      })}
    </nav>
  );
}
