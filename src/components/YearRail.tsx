"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  albumHref,
  allBatchYears,
  defaultGalleryYear,
  formatBatchLabel,
  isBranchOffered,
  parseAdmissionYear,
  parseBranch,
} from "@/config/site";

export function GalleryYearNav() {
  const pathname = usePathname();
  const params = useSearchParams();
  const timeline = pathname === "/" && params.get("view") === "timeline";
  const fromQuery = parseAdmissionYear(params.get("year") ?? undefined);
  const activeYear = timeline
    ? 0
    : pathname === "/"
      ? (fromQuery ?? defaultGalleryYear())
      : (fromQuery ?? 0);
  const branch = pathname === "/" && !timeline ? parseBranch(params.get("branch") ?? undefined, activeYear) : null;
  const event = params.get("event");
  return <YearRail activeYear={activeYear} branch={branch} event={event} timeline={timeline} />;
}

export function YearRail({
  activeYear,
  branch = null,
  event = null,
  timeline = false,
}: {
  activeYear: number;
  branch?: string | null;
  event?: string | null;
  timeline?: boolean;
}) {
  const years = allBatchYears();

  useEffect(() => {
    const scrollActive = () => {
      const desktop = window.matchMedia("(min-width: 1024px)").matches;
      const id = desktop ? `batch-${activeYear}` : `batch-m-${activeYear}`;
      const el = document.getElementById(id);
      if (!el) return;
      if (desktop) {
        const rail = document.getElementById("year-rail-desktop");
        if (rail) {
          const top =
            rail.scrollTop +
            el.getBoundingClientRect().top -
            rail.getBoundingClientRect().top -
            rail.clientHeight / 2 +
            el.clientHeight / 2;
          rail.scrollTo({ top: Math.max(0, top) });
        }
        return;
      }
      el.scrollIntoView({ block: "nearest", inline: "center", behavior: "auto" });
    };
    scrollActive();
    window.addEventListener("resize", scrollActive);
    return () => window.removeEventListener("resize", scrollActive);
  }, [activeYear]);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[var(--rail-width)] flex-col border-r border-ink/8 bg-paper pt-[var(--header-h)] lg:flex">
        <p className="px-5 pt-4 pb-1 text-caption text-muted">Album</p>
        <nav
          id="year-rail-desktop"
          aria-label="Batches"
          className="year-rail min-h-0 flex-1 overflow-y-auto pb-10"
        >
          <a
            href={albumHref({ view: "timeline", event })}
            className={`flex min-h-12 items-center gap-3 px-5 font-semibold tracking-year ${
              timeline ? "text-[1.05rem] text-gold" : "text-caption text-muted hover:text-ink"
            }`}
            aria-current={timeline ? "page" : undefined}
          >
            <span
              className={`h-8 w-0.5 shrink-0 ${timeline ? "bg-gold" : "bg-ink/10"}`}
              aria-hidden
            />
            Newest
          </a>
          {years.map((year) => {
            const active = !timeline && year === activeYear;
            const label = formatBatchLabel(year);
            const kept = branch && isBranchOffered(branch, year) ? branch : null;
            return (
              <a
                key={year}
                id={`batch-${year}`}
                href={albumHref({ year, branch: kept, event })}
                className={`flex min-h-12 items-center gap-3 px-5 font-semibold tracking-year ${
                  active ? "text-[1.05rem] text-gold" : "text-caption text-muted hover:text-ink"
                }`}
                aria-current={active ? "page" : undefined}
                aria-label={`Album ${label}`}
              >
                <span
                  className={`h-8 w-0.5 shrink-0 ${active ? "bg-gold" : "bg-ink/10"}`}
                  aria-hidden
                />
                {label}
              </a>
            );
          })}
        </nav>
      </aside>

      <div className="sticky top-[var(--header-h)] z-30 border-b border-ink/8 bg-paper lg:hidden">
        <nav aria-label="Batches" className="year-strip flex gap-1 overflow-x-auto px-2 py-1">
          <a
            href={albumHref({ view: "timeline", event })}
            className={`inline-flex min-h-11 shrink-0 items-center border-b-2 px-3 text-caption font-semibold tracking-year ${
              timeline ? "border-gold text-gold" : "border-transparent text-muted"
            }`}
            aria-current={timeline ? "page" : undefined}
          >
            Newest
          </a>
          {years.map((year) => {
            const active = !timeline && year === activeYear;
            const label = formatBatchLabel(year);
            const kept = branch && isBranchOffered(branch, year) ? branch : null;
            return (
              <a
                key={year}
                id={`batch-m-${year}`}
                href={albumHref({ year, branch: kept, event })}
                className={`inline-flex min-h-11 shrink-0 items-center border-b-2 px-3 text-caption font-semibold tracking-year ${
                  active ? "border-gold text-gold" : "border-transparent text-muted"
                }`}
                aria-current={active ? "page" : undefined}
                aria-label={`Album ${label}`}
              >
                {label}
              </a>
            );
          })}
        </nav>
      </div>
    </>
  );
}
