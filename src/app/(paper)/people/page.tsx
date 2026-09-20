import Link from "next/link";
import { notFound } from "next/navigation";
import { PaperPage } from "@/components/MarkdownBody";
import {
  allBatchYears,
  branchLabel,
  directoryHref,
  formatBatchLabel,
  parseAdmissionYear,
  sanitizeSearch,
  siteConfig,
} from "@/config/site";
import { getSettings, listDirectory } from "@/lib/data";
import { DIRECTORY_PAGE_SIZE } from "@/lib/profiles";
import { getSession, isVerified } from "@/lib/session";

export const metadata = { title: "People" };

type Props = {
  searchParams: Promise<{ q?: string; year?: string; branch?: string; page?: string }>;
};

export default async function DirectoryPage({ searchParams }: Props) {
  const settings = await getSettings();
  if (settings?.feature_directory === false) notFound();

  const params = await searchParams;
  const q = sanitizeSearch(params.q);
  const year = parseAdmissionYear(params.year);
  const branchRaw = params.branch ?? "";
  const branch = siteConfig.branches.some((item) => item.id === branchRaw) ? branchRaw : null;
  const page = Math.max(1, Number(params.page) || 1);
  const session = await getSession();
  const { people, total } = await listDirectory({ q, year, branch, page });
  const pageCount = Math.max(1, Math.ceil(total / DIRECTORY_PAGE_SIZE));
  const years = [...allBatchYears()].reverse();
  const branches = year
    ? siteConfig.branches.filter((item) => year >= item.from)
    : siteConfig.branches;
  const hrefOptions = { q: q || undefined, year, branch };

  return (
    <PaperPage>
      <h1 className="text-h1 font-medium tracking-wordmark">People</h1>
      <p className="mt-4 max-w-prose text-muted">
        Alumni who chose to be listed. Phone and email stay off this page. Each
        person picks whether city, work, or a short note is shown.
      </p>
      {isVerified(session.profile) ? (
        <p className="mt-6">
          <Link href="/account" className="btn btn-quiet">
            Edit your listing
          </Link>
        </p>
      ) : null}

      <form method="get" className="mt-10 grid gap-4 sm:grid-cols-3">
        <label className="block sm:col-span-3">
          <span className="text-caption text-muted">Name</span>
          <input name="q" defaultValue={q} className="field mt-1" />
        </label>
        <label className="block">
          <span className="text-caption text-muted">Batch</span>
          <select name="year" defaultValue={year ?? ""} className="field mt-1">
            <option value="">Any year</option>
            {years.map((item) => (
              <option key={item} value={item}>
                {formatBatchLabel(item)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-caption text-muted">Branch</span>
          <select name="branch" defaultValue={branch ?? ""} className="field mt-1">
            <option value="">Whole college</option>
            {branches.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button type="submit" className="btn btn-green w-full sm:w-auto">
            Search
          </button>
        </div>
      </form>

      {people.length === 0 ? (
        <p className="mt-12 max-w-prose">
          {q || year || branch
            ? "Nobody on the list matches that search."
            : "The directory is empty. Verified alumni can opt in from their account."}
        </p>
      ) : (
        <ul className="mt-12 space-y-8">
          {people.map((person) => {
            const place = [person.city, person.role].filter(Boolean).join(" · ");
            return (
              <li key={person.id} className="border-t border-ink/8 pt-6">
                <Link href={`/people/${person.id}`} className="text-lead font-medium">
                  {person.name}
                </Link>
                <p className="mt-1 text-caption text-muted">
                  {person.batchYear ? formatBatchLabel(person.batchYear) : null}
                  {person.batchYear && person.branch ? " · " : null}
                  {person.branch ? branchLabel(person.branch) : null}
                </p>
                {place ? <p className="mt-1 text-caption text-muted">{place}</p> : null}
                {person.bio ? (
                  <p className="mt-3 max-w-prose whitespace-pre-wrap text-caption">
                    {person.bio.length > 220 ? `${person.bio.slice(0, 220)}…` : person.bio}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {pageCount > 1 ? (
        <nav className="mt-10 flex min-h-11 items-center gap-6 text-caption">
          {page > 1 ? (
            <Link href={directoryHref({ ...hrefOptions, page: page - 1 })}>Earlier</Link>
          ) : null}
          <span className="text-muted">
            {page} of {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={directoryHref({ ...hrefOptions, page: page + 1 })}>Later</Link>
          ) : null}
        </nav>
      ) : null}
    </PaperPage>
  );
}
