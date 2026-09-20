import { redirect } from "next/navigation";
import { AccountControls } from "@/components/AccountControls";
import { PaperPage } from "@/components/MarkdownBody";
import { branchLabel, formatBatchLabel } from "@/config/site";
import { getSession } from "@/lib/session";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await getSession();
  if (!session.userId) redirect("/sign-in");

  const profile = session.profile;

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
      <AccountControls />
    </PaperPage>
  );
}
