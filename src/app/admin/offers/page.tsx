import Link from "next/link";
import { ModerationSelect, SelectBox } from "@/components/ModerationSelect";
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
        <ModerationSelect
          ids={pending.map((offer) => offer.id)}
          action={moderateOffer}
          approveValue="approved"
          approveLabel="Approve selected"
        >
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left">
              <caption className="sr-only">Pending offers</caption>
              <thead>
                <tr className="border-b border-ink/12 text-caption text-muted">
                  <th scope="col" className="py-3 pr-3 font-medium">
                    <span className="sr-only">Select</span>
                  </th>
                  <th scope="col" className="py-3 pr-4 font-medium">
                    Kind
                  </th>
                  <th scope="col" className="py-3 pr-4 font-medium">
                    Title
                  </th>
                  <th scope="col" className="py-3 pr-4 font-medium">
                    From
                  </th>
                  <th scope="col" className="py-3 pr-4 font-medium">
                    Excerpt
                  </th>
                  <th scope="col" className="py-3 font-medium">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {pending.map((offer) => (
                  <tr key={offer.id} className="border-b border-ink/8 align-top">
                    <td className="py-4 pr-3">
                      <SelectBox id={offer.id} label={`Select ${offer.title}`} />
                    </td>
                    <td className="py-4 pr-4 text-caption uppercase tracking-wide text-muted">
                      {offer.kind === "internship" ? "Internship" : "Mentoring"}
                    </td>
                    <td className="py-4 pr-4 font-medium">
                      <p>{offer.title}</p>
                      <p className="mt-1 text-caption">
                        <Link href={`/offers/${offer.id}`} className="underline underline-offset-4">
                          Open
                        </Link>
                      </p>
                    </td>
                    <td className="py-4 pr-4 text-muted">
                      {offer.authorName}
                      {offer.city ? (
                        <span className="mt-1 block text-caption">{offer.city}</span>
                      ) : null}
                    </td>
                    <td className="max-w-xs py-4 pr-4 text-caption text-ink/80">
                      {offer.body.slice(0, 140)}
                      {offer.body.length > 140 ? "…" : ""}
                    </td>
                    <td className="py-4">
                      <div className="flex flex-wrap items-end gap-2">
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
                          <label className="block w-36">
                            <span className="sr-only">Rejection reason</span>
                            <input
                              name="rejection_reason"
                              placeholder="Reason"
                              className="field-ink"
                            />
                          </label>
                          <button
                            type="submit"
                            className="inline-flex min-h-11 items-center px-4 font-medium text-muted"
                          >
                            Reject
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ModerationSelect>
      )}
    </main>
  );
}
