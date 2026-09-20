import Link from "next/link";
import {
  albumHref,
  branchLabel,
  defaultGalleryYear,
  formatBatchLabel,
  parseAdmissionYear,
  parseBranch,
  siteConfig,
} from "@/config/site";
import { AlbumTabs } from "@/components/AlbumTabs";
import { EmptyYear } from "@/components/EmptyYear";
import { PhotoWall } from "@/components/PhotoWall";
import { listApprovedPhotos, listPublishedArticles, WALL_PAGE_SIZE } from "@/lib/data";
import { getSession } from "@/lib/session";

type HomeProps = {
  searchParams: Promise<{ year?: string; branch?: string; page?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const year = parseAdmissionYear(params.year) ?? defaultGalleryYear();
  const branch = parseBranch(params.branch, year);
  const page = Math.max(1, Number(params.page) || 1);
  const session = await getSession();
  const [{ photos, total }, articles] = await Promise.all([
    listApprovedPhotos({ batchYear: year, branch, page }),
    listPublishedArticles(4),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / WALL_PAGE_SIZE));
  const label = formatBatchLabel(year);

  return (
    <main>
      <div className="px-4 pb-20 pt-8 sm:px-8 lg:pt-12">
        <h1 className="font-semibold tracking-year text-year text-gold">{label}</h1>
        <p className="mt-3 max-w-lg text-muted">
          {branch
            ? branchLabel(branch)
            : `Photographs from the ${label} years at ${siteConfig.association.collegeShort}.`}
        </p>
        <AlbumTabs year={year} branch={branch} />

        {photos.length === 0 ? (
          <div className="mt-10">
            <EmptyYear year={year} branch={branch} session={session} />
          </div>
        ) : (
          <div className="mt-10">
            <PhotoWall photos={photos} />
          </div>
        )}

        {pageCount > 1 ? (
          <nav className="mt-10 flex min-h-11 items-center gap-6 text-caption">
            {page > 1 ? (
              <Link href={albumHref({ year, branch, page: page - 1 })}>Earlier</Link>
            ) : null}
            <span className="text-muted">
              {page} of {pageCount}
            </span>
            {page < pageCount ? (
              <Link href={albumHref({ year, branch, page: page + 1 })}>Later</Link>
            ) : null}
          </nav>
        ) : null}

        {articles.length > 0 && !branch ? (
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
