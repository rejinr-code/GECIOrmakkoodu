import Link from "next/link";
import { notFound } from "next/navigation";
import { PaperPage } from "@/components/MarkdownBody";
import { offersHref, parseOfferKind } from "@/config/site";
import { getSettings, listApprovedOffers } from "@/lib/data";
import { OFFERS_PAGE_SIZE } from "@/lib/offers";
import { getSession, isVerified } from "@/lib/session";

export const metadata = { title: "Offers" };

type Props = {
  searchParams: Promise<{ kind?: string; page?: string }>;
};

export default async function OffersPage({ searchParams }: Props) {
  const settings = await getSettings();
  if (settings?.feature_mentoring === false) notFound();

  const params = await searchParams;
  const kind = parseOfferKind(params.kind);
  const page = Math.max(1, Number(params.page) || 1);
  const session = await getSession();
  const { offers, total } = await listApprovedOffers({ kind, page });
  const pageCount = Math.max(1, Math.ceil(total / OFFERS_PAGE_SIZE));
  const canPost = isVerified(session.profile);

  return (
    <PaperPage wide>
      <h1 className="text-h1 font-medium tracking-wordmark">Offers</h1>
      <p className="mt-4 max-w-prose text-muted">
        Mentoring and internships from GECIANs. A volunteer reads each offer
        first. There is no public email here — use I&apos;m interested, and the
        person will see your public page.
      </p>
      {canPost ? (
        <p className="mt-6">
          <Link href="/offers/new" className="btn btn-green">
            Post an offer
          </Link>
        </p>
      ) : null}

      <nav className="mt-10 flex flex-wrap gap-1" aria-label="Offer kind">
        <Link
          href={offersHref({})}
          className={`inline-flex min-h-9 items-center rounded-full px-3 text-caption ${
            !kind ? "bg-ink/5 text-ink" : "text-muted hover:bg-ink/5"
          }`}
          aria-current={!kind ? "page" : undefined}
        >
          All
        </Link>
        <Link
          href={offersHref({ kind: "mentoring" })}
          className={`inline-flex min-h-9 items-center rounded-full px-3 text-caption ${
            kind === "mentoring" ? "bg-ink/5 text-ink" : "text-muted hover:bg-ink/5"
          }`}
          aria-current={kind === "mentoring" ? "page" : undefined}
        >
          Mentoring
        </Link>
        <Link
          href={offersHref({ kind: "internship" })}
          className={`inline-flex min-h-9 items-center rounded-full px-3 text-caption ${
            kind === "internship" ? "bg-ink/5 text-ink" : "text-muted hover:bg-ink/5"
          }`}
          aria-current={kind === "internship" ? "page" : undefined}
        >
          Internships
        </Link>
      </nav>

      {offers.length === 0 ? (
        <p className="mt-12 max-w-prose">
          {canPost
            ? "Nothing on the board yet. Yours can be the first, after a volunteer reads it."
            : "Nothing on the board yet."}
        </p>
      ) : (
        <ul className="mt-12 grid gap-3">
          {offers.map((offer) => (
            <li key={offer.id} className="rounded-2xl bg-surface/60 px-5 py-5 ring-1 ring-ink/8">
              <p className="text-caption uppercase tracking-wide text-muted">
                {offer.kind === "internship" ? "Internship" : "Mentoring"}
              </p>
              <Link href={`/offers/${offer.id}`} className="text-lead font-medium">
                {offer.title}
              </Link>
              <p className="mt-1 text-caption text-muted">
                {offer.authorName}
                {offer.city ? ` · ${offer.city}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 ? (
        <nav className="mt-10 flex min-h-11 items-center gap-6 text-caption">
          {page > 1 ? (
            <Link href={offersHref({ kind, page: page - 1 })}>Earlier</Link>
          ) : null}
          <span className="text-muted">
            {page} of {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={offersHref({ kind, page: page + 1 })}>Later</Link>
          ) : null}
        </nav>
      ) : null}
    </PaperPage>
  );
}
