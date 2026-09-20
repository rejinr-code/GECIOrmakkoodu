import { AccountControls } from "@/components/AccountControls";
import { PaperPage } from "@/components/MarkdownBody";
import { PublicProfileForm } from "@/components/PublicProfileForm";
import { branchLabel, formatBatchLabel } from "@/config/site";
import { listMyArticles, listMyOffers, listMyPhotos, getSettings } from "@/lib/data";
import { getSession, isVerified } from "@/lib/session";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await getSession();
  if (!session.userId) redirect("/sign-in");

  const profile = session.profile;
  const showOffers = (await getSettings())?.feature_mentoring === true;
  const mine = session.userId ? await listMyPhotos(session.userId) : [];
  const letters = session.userId ? await listMyArticles(session.userId) : [];
  const offers = showOffers && session.userId ? await listMyOffers(session.userId) : [];

  return (
    <PaperPage>
      <h1 className="text-h1 font-medium tracking-wordmark">Account</h1>
      <dl className="mt-8 space-y-3">
        <div>
          <dt className="text-caption opacity-70">Name</dt>
          <dd>{profile?.name || "—"}</dd>
        </div>
        <div>
          <dt className="text-caption opacity-70">Email</dt>
          <dd>{session.email}</dd>
        </div>
        <div>
          <dt className="text-caption opacity-70">Batch</dt>
          <dd>{profile?.batch_year ? formatBatchLabel(profile.batch_year) : "—"}</dd>
        </div>
        <div>
          <dt className="text-caption opacity-70">Branch</dt>
          <dd>{profile?.branch ? branchLabel(profile.branch) : "—"}</dd>
        </div>
        <div>
          <dt className="text-caption opacity-70">Status</dt>
          <dd className="capitalize">{profile?.status}</dd>
        </div>
      </dl>
      {isVerified(profile) ? (
        <>
          <p className="mt-8 flex flex-wrap gap-3">
            <Link href="/contribute" className="btn btn-green">
              Add a photograph
            </Link>
            <Link href="/write" className="btn btn-quiet">
              Write a letter
            </Link>
            {showOffers ? (
              <Link href="/offers/new" className="btn btn-quiet">
                Post an offer
              </Link>
            ) : null}
            <Link href={`/people/${session.userId}`} className="btn btn-quiet">
              Public page
            </Link>
          </p>
          <section className="mt-12">
            <h2 className="text-h3 font-medium tracking-wordmark">Public details</h2>
            <p className="mt-3 text-caption text-muted">
              Guests can open this page. Phone and email stay off it.
            </p>
            <PublicProfileForm
              defaultName={profile?.name ?? ""}
              defaultBio={profile?.bio ?? ""}
              defaultCity={profile?.current_city ?? ""}
              defaultRole={profile?.current_role ?? ""}
              defaultDirectoryOptIn={profile?.directory_opt_in ?? false}
              defaultShowCity={profile?.directory_show_city ?? false}
              defaultShowRole={profile?.directory_show_role ?? false}
              defaultShowBio={profile?.directory_show_bio ?? false}
            />
          </section>
        </>
      ) : null}
      {mine.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-h3 font-medium tracking-wordmark">Your photographs</h2>
          <ul className="mt-4 space-y-3">
            {mine.map((photo) => (
              <li key={photo.id} className="text-caption">
                <Link href={`/photos/${photo.id}`} className="text-ink underline-offset-4 hover:underline">
                  {photo.caption || photo.altText}
                </Link>
                <span className="text-muted">
                  {" "}
                  · {formatBatchLabel(photo.batchYear)} · {photo.status}
                </span>
                {photo.status === "rejected" && photo.rejectionReason ? (
                  <span className="block text-muted">{photo.rejectionReason}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {letters.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-h3 font-medium tracking-wordmark">Your letters</h2>
          <ul className="mt-4 space-y-3">
            {letters.map((article) => (
              <li key={article.id} className="text-caption">
                <Link
                  href={
                    article.status === "draft" ||
                    article.status === "pending" ||
                    article.status === "rejected"
                      ? `/write/${article.id}`
                      : `/articles/${article.slug}`
                  }
                  className="text-ink underline-offset-4 hover:underline"
                >
                  {article.title}
                </Link>
                <span className="text-muted"> · {article.status}</span>
                {article.status === "rejected" && article.rejectionReason ? (
                  <span className="block text-muted">{article.rejectionReason}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {showOffers && offers.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-h3 font-medium tracking-wordmark">Your offers</h2>
          <ul className="mt-4 space-y-3">
            {offers.map((offer) => (
              <li key={offer.id} className="text-caption">
                <Link
                  href={`/offers/${offer.id}`}
                  className="text-ink underline-offset-4 hover:underline"
                >
                  {offer.title}
                </Link>
                <span className="text-muted"> · {offer.status}</span>
                {offer.status === "rejected" && offer.rejectionReason ? (
                  <span className="block text-muted">{offer.rejectionReason}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <AccountControls />
    </PaperPage>
  );
}
