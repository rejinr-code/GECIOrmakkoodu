import Link from "next/link";
import {
  albumHref,
  branchLabel,
  formatBatchLabel,
  isCollegeAlbum,
  isTimelineView,
  parseAdmissionYear,
  parseAnyBranch,
  parseBranch,
  parseEventSlug,
  siteConfig,
} from "@/config/site";
import { AlbumTabs } from "@/components/AlbumTabs";
import { EmptyYear } from "@/components/EmptyYear";
import { EventChips } from "@/components/EventChips";
import { FeaturedPrint } from "@/components/FeaturedPrint";
import { PhotoWall } from "@/components/PhotoWall";
import { YearAlbumGrid } from "@/components/YearAlbumGrid";
import {
  listApprovedPhotos,
  listCollegeAlbum,
  listEventTags,
  listPublishedArticles,
  listRememberedPhotos,
  listYearAlbums,
  WALL_PAGE_SIZE,
} from "@/lib/data";
import { getSession, isVerified } from "@/lib/session";

type HomeProps = {
  searchParams: Promise<{
    year?: string;
    branch?: string;
    page?: string;
    event?: string;
    view?: string;
    albums?: string;
    album?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const timeline = isTimelineView(params.view);
  const college = isCollegeAlbum(params.album);
  const tags = await listEventTags();
  const event = parseEventSlug(params.event, tags);
  const year = timeline || college ? null : parseAdmissionYear(params.year);
  const collection = !year && !timeline && !college;
  const branch = year
    ? parseBranch(params.branch, year)
    : college
      ? parseAnyBranch(params.branch)
      : null;
  const page = Math.max(1, Number(params.page) || 1);
  const session = await getSession();

  if (collection) {
    const showAllAlbums = params.albums === "all";
    const [albums, collegeAlbum, remembered, articles] = await Promise.all([
      listYearAlbums(showAllAlbums ? undefined : 8),
      listCollegeAlbum(),
      listRememberedPhotos(12),
      listPublishedArticles(4),
    ]);
    const featured =
      remembered[0] ??
      collegeAlbum.cover ??
      albums.find((album) => album.cover)?.cover ??
      null;
    const verified = isVerified(session.profile);

    return (
      <main>
        <div className="px-4 pb-24 pt-10 sm:px-8 lg:px-12 lg:pt-14">
          <div className="mx-auto max-w-6xl">
            <p lang="ml" className="font-malayalam text-lead text-muted">
              {siteConfig.nameMl}
            </p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="max-w-xl font-semibold tracking-wordmark text-h1">
                  A collection of campus years
                </h1>
                <p className="mt-3 max-w-lg text-muted">
                  Photographs GECIANs still look at. Open a year album, or add
                  one from {siteConfig.association.collegeShort}.
                </p>
              </div>
              {verified ? (
                <Link href="/contribute" className="btn btn-green">
                  Add a photograph
                </Link>
              ) : session.userId ? null : (
                <Link href="/join" className="btn btn-green">
                  Join the nest
                </Link>
              )}
            </div>

            <div className="mt-12 grid items-start gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-12">
              <FeaturedPrint photo={featured} session={session} />
              <section>
                <h2 className="text-h3 font-medium tracking-wordmark">Year albums</h2>
                <p className="mt-1 text-caption text-muted">
                  {showAllAlbums
                    ? "Every admission year, oldest first. Each cover is the most liked photograph from that batch."
                    : `From the ${formatBatchLabel(siteConfig.association.openedYear)} batch. Each cover is the most liked photograph from that year.`}
                </p>
                <div className="mt-6">
                  <YearAlbumGrid
                    albums={albums}
                    college={collegeAlbum}
                    moreHref={showAllAlbums ? undefined : "/?albums=all"}
                  />
                </div>
                {showAllAlbums ? (
                  <p className="mt-4">
                    <Link href="/" className="text-caption text-muted hover:text-ink">
                      Show fewer albums
                    </Link>
                  </p>
                ) : null}
              </section>
            </div>

            {remembered.length > 0 ? (
              <section className="mt-16">
                <h2 className="text-h3 font-medium tracking-wordmark">Most remembered</h2>
                <p className="mt-1 text-caption text-muted">
                  Photographs with the most likes, then the newest ones.
                </p>
                <div className="mt-6">
                  <PhotoWall photos={remembered} />
                </div>
              </section>
            ) : null}

            {articles.length > 0 ? (
              <section className="mt-16">
                <h2 className="text-h3 font-medium tracking-wordmark">Letters</h2>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {articles.map((article) => (
                    <li key={article.id}>
                      <Link
                        href={`/articles/${article.slug}`}
                        className="block rounded-2xl bg-surface/70 px-5 py-5 ring-1 ring-ink/8 hover:bg-surface"
                      >
                        <p className="text-lead font-medium">{article.title}</p>
                        {article.batchYear ? (
                          <p className="mt-2 text-caption text-muted">
                            {formatBatchLabel(article.batchYear)}
                          </p>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </div>
      </main>
    );
  }

  const [{ photos, total }, articles] = await Promise.all([
    listApprovedPhotos({
      batchYear: year ?? undefined,
      college,
      branch,
      eventTag: event,
      page,
    }),
    listPublishedArticles(4),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / WALL_PAGE_SIZE));
  const label = year ? formatBatchLabel(year) : college ? "College" : "Newest";
  const eventLabel = tags.find((tag) => tag.slug === event)?.label;
  const hrefOptions = {
    year,
    branch,
    event,
    college,
    view: timeline ? ("timeline" as const) : undefined,
  };

  return (
    <main>
      <div className="px-4 pb-20 pt-8 sm:px-8 lg:pt-12">
        <h1 className="font-semibold tracking-year text-year text-gold">{label}</h1>
        <p className="mt-3 max-w-lg text-muted">
          {timeline
            ? "Photographs as they enter the archive, newest first."
            : college
              ? branch
                ? `${branchLabel(branch)} photographs from faculty, office, and campus life.`
                : `Faculty, office, and campus photographs from ${siteConfig.association.collegeShort}.`
              : branch
                ? branchLabel(branch)
                : `Photographs from the ${label} years at ${siteConfig.association.collegeShort}.`}
        </p>
        {year ? <AlbumTabs year={year} branch={branch} event={event} /> : null}
        {college ? <AlbumTabs college branch={branch} event={event} /> : null}
        <EventChips
          tags={tags}
          year={year}
          branch={branch}
          event={event}
          timeline={timeline}
          college={college}
        />

        {photos.length === 0 ? (
          <div className="mt-10">
            <EmptyYear
              year={year}
              branch={branch}
              eventLabel={eventLabel}
              timeline={timeline}
              college={college}
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
