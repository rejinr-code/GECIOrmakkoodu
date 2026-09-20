import Link from "next/link";
import {
  albumHref,
  branchLabel,
  defaultGalleryYear,
  formatBatchLabel,
  isTimelineView,
  parseAdmissionYear,
  parseBranch,
  parseEventSlug,
  siteConfig,
} from "@/config/site";
import { AlbumTabs } from "@/components/AlbumTabs";
import { EmptyYear } from "@/components/EmptyYear";
import { EventChips } from "@/components/EventChips";
import { PhotoWall } from "@/components/PhotoWall";
import { listApprovedPhotos, listEventTags, listPublishedArticles, WALL_PAGE_SIZE } from "@/lib/data";
import { getSession } from "@/lib/session";

type HomeProps = {
  searchParams: Promise<{ year?: string; branch?: string; page?: string; event?: string; view?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const timeline = isTimelineView(params.view);
  const tags = await listEventTags();
  const event = parseEventSlug(params.event, tags);
  const year = timeline ? null : (parseAdmissionYear(params.year) ?? defaultGalleryYear());
  const branch = year ? parseBranch(params.branch, year) : null;
  const page = Math.max(1, Number(params.page) || 1);
  const session = await getSession();
  const [{ photos, total }, articles] = await Promise.all([
    listApprovedPhotos({
      batchYear: year ?? undefined,
      branch,
      eventTag: event,
      page,
    }),
    listPublishedArticles(4),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / WALL_PAGE_SIZE));
  const label = year ? formatBatchLabel(year) : "Newest";
  const eventLabel = tags.find((tag) => tag.slug === event)?.label;
  const hrefOptions = {
    year,
    branch,
    event,
    view: timeline ? ("timeline" as const) : undefined,
  };

  return (
    <main>
      <div className="px-4 pb-20 pt-8 sm:px-8 lg:pt-12">
        <h1 className="font-semibold tracking-year text-year text-gold">{label}</h1>
        <p className="mt-3 max-w-lg text-muted">
          {timeline
            ? "Photographs as they enter the archive, newest first."
            : branch
              ? branchLabel(branch)
              : `Photographs from the ${label} years at ${siteConfig.association.collegeShort}.`}
        </p>
        {year ? <AlbumTabs year={year} branch={branch} event={event} /> : null}
        <EventChips tags={tags} year={year} branch={branch} event={event} timeline={timeline} />

        {photos.length === 0 ? (
          <div className="mt-10">
            <EmptyYear
              year={year}
              branch={branch}
              eventLabel={eventLabel}
              timeline={timeline}
              session={session}
            />
          </div>
        ) : (
          <div className="mt-10">
            <PhotoWall photos={photos} hrefOptions={hrefOptions} />
          </div>
        )}

        {pageCount > 1 ? (
          <nav className="mt-10 flex min-h-11 items-center gap-6 text-caption">
            {page > 1 ? (
              <Link href={albumHref({ ...hrefOptions, page: page - 1 })}>Earlier</Link>
            ) : null}
            <span className="text-muted">
              {page} of {pageCount}
            </span>
            {page < pageCount ? (
              <Link href={albumHref({ ...hrefOptions, page: page + 1 })}>Later</Link>
            ) : null}
          </nav>
        ) : null}

        {articles.length > 0 && !branch && !event ? (
          <section className="mt-20 max-w-xl">
            <h2 className="text-h3 font-medium">Letters</h2>
            <ul className="mt-4 space-y-3">
              {articles.map((article) => (
                <li key={article.id}>
                  <Link href={`/articles/${article.slug}`} className="text-lead">
                    {article.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
