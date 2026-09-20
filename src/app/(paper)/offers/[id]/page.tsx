import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InterestForm } from "@/components/InterestForm";
import { OfferForm } from "@/components/OfferForm";
import { PaperPage } from "@/components/MarkdownBody";
import { branchLabel, formatBatchLabel, siteConfig } from "@/config/site";
import {
  getSettings,
  getVisibleOffer,
  hasExpressedInterest,
  listOfferInterest,
} from "@/lib/data";
import { getSession, isVerified } from "@/lib/session";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const offer = await getVisibleOffer(id);
  return { title: offer?.title ?? "Offer" };
}

export default async function OfferPage({ params }: Props) {
  const settings = await getSettings();
  if (settings?.feature_mentoring === false) notFound();

  const { id } = await params;
  const session = await getSession();
  const offer = await getVisibleOffer(id);
  if (!offer) notFound();

  const isAuthor = session.userId !== null && session.userId === offer.authorId;
  const canEdit = isAuthor && (offer.status === "pending" || offer.status === "rejected");
  const interested =
    session.userId && !isAuthor && offer.status === "approved"
      ? await hasExpressedInterest(id, session.userId)
      : false;
  const interest =
    isAuthor && offer.status === "approved" ? await listOfferInterest(id) : [];

  return (
    <PaperPage>
      <p className="text-caption uppercase tracking-wide text-muted">
        {offer.kind === "internship" ? "Internship" : "Mentoring"}
      </p>
      <h1 className="mt-2 text-h1 font-medium tracking-wordmark">{offer.title}</h1>
      <p className="mt-3 text-caption text-muted">
        {offer.authorId ? (
          <Link href={`/people/${offer.authorId}`} className="underline-offset-4 hover:underline">
            {offer.authorName}
          </Link>
        ) : (
          offer.authorName
        )}
        {offer.city ? ` · ${offer.city}` : ""}
      </p>
      {offer.status !== "approved" ? (
        <p className="mt-4 text-caption text-muted">
          {offer.status === "pending"
            ? "Waiting for a volunteer to read this."
            : offer.status === "rejected"
              ? `Not listed. ${offer.rejectionReason ?? ""}`
              : "This offer is no longer listed."}
        </p>
      ) : null}
      <p className="mt-8 max-w-prose whitespace-pre-wrap">{offer.body}</p>

      {canEdit ? (
        <section className="mt-12">
          <h2 className="text-h3 font-medium tracking-wordmark">Revise and send again</h2>
          <OfferForm
            offerId={offer.id}
            defaultKind={offer.kind}
            defaultTitle={offer.title}
            defaultBody={offer.body}
            defaultCity={offer.city ?? ""}
          />
        </section>
      ) : null}

      {offer.status === "approved" && isVerified(session.profile) && !isAuthor ? (
        <InterestForm offerId={offer.id} interested={interested} />
      ) : null}

      {offer.status === "approved" && !session.userId ? (
        <p className="mt-8">
          <Link href="/sign-in" className="text-caption underline underline-offset-4">
            Sign in to say you are interested
          </Link>
        </p>
      ) : null}

      {interest.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-h3 font-medium tracking-wordmark">Interested</h2>
          <p className="mt-3 text-caption text-muted">
            These names come from public pages. There is no email here — open
            their page, or use a batch WhatsApp group you already share.
          </p>
          <ul className="mt-6 space-y-4">
            {interest.map((row) => (
              <li key={row.memberId}>
                <Link href={`/people/${row.memberId}`} className="text-lead">
                  {row.name}
                </Link>
                <p className="text-caption text-muted">
                  {row.batchYear ? formatBatchLabel(row.batchYear) : null}
                  {row.batchYear && row.branch ? " · " : null}
                  {row.branch ? branchLabel(row.branch) : null}
                </p>
                {row.note ? (
                  <p className="mt-1 max-w-prose whitespace-pre-wrap text-caption">{row.note}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-16 text-caption text-muted">{siteConfig.association.disclaimer}</p>
    </PaperPage>
  );
}
