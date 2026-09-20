import Link from "next/link";
import { moderateOffer } from "@/lib/actions/admin";
import { listPendingOffers } from "@/lib/data";

export const metadata = { title: "Offers" };

export default async function AdminOffersPage() {
  const pending = await listPendingOffers();

  return (
    <main className="px-4 py-10 sm:px-8">
      <h1 className="text-h1 font-medium tracking-wordmark">Offers</h1>
      <p className="mt-3 max-w-prose text-muted">
        Mentoring and internships stay off the board until you approve them.
        Reject anything that includes an email, a phone number, or a payment.
      </p>

      {pending.length === 0 ? (
        <p className="mt-10 text-lead">Nothing waiting.</p>
      ) : (
        <ul className="mt-10 space-y-10">
          {pending.map((offer) => (
            <li key={offer.id} className="border-t border-ink/8 pt-6">
              <p className="text-caption uppercase tracking-wide text-muted">
                {offer.kind === "internship" ? "Internship" : "Mentoring"}
              </p>
              <p className="text-lead font-medium">{offer.title}</p>
              <p className="mt-2 text-caption text-muted">
                {offer.authorName}
                {offer.city ? ` · ${offer.city}` : ""}
              </p>
              <p className="mt-3 max-w-prose whitespace-pre-wrap text-caption text-ink/80">
                {offer.body.slice(0, 420)}
                {offer.body.length > 420 ? "…" : ""}
              </p>
              <p className="mt-3 text-caption">
                <Link href={`/offers/${offer.id}`} className="underline underline-offset-4">
                  Open offer
                </Link>
              </p>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <form action={moderateOffer}>
                  <input type="hidden" name="id" value={offer.id} />
                  <input type="hidden" name="decision" value="approved" />
                  <button type="submit" className="btn btn-green">
                    Approve
                  </button>
                </form>
                <form action={moderateOffer} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={offer.id} />
                  <input type="hidden" name="decision" value="rejected" />
                  <label className="block">
                    <span className="sr-only">Rejection reason</span>
                    <input name="rejection_reason" placeholder="Reason" className="field-ink" />
                  </label>
                  <button
                    type="submit"
                    className="inline-flex min-h-11 items-center px-4 font-medium text-muted"
                  >
                    Reject
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
