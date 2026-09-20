import { AccountControls } from "@/components/AccountControls";
import { PaperPage } from "@/components/MarkdownBody";
import { branchLabel, formatBatchLabel } from "@/config/site";
import { listMyPhotos } from "@/lib/data";
import { getSession, isVerified } from "@/lib/session";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await getSession();
  if (!session.userId) redirect("/sign-in");

  const profile = session.profile;
  const mine = session.userId ? await listMyPhotos(session.userId) : [];

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
        <p className="mt-8">
          <Link href="/contribute" className="btn btn-green">
            Add a photograph
          </Link>
        </p>
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
      <AccountControls />
    </PaperPage>
  );
}
