import { branchLabel, formatBatchLabel } from "@/config/site";
import { listAlumniRegister, listPendingProfiles } from "@/lib/data";
import { canVerifyProfile, getSession, isAdmin, isStaff } from "@/lib/session";
import { approveMember, rejectMember } from "@/app/admin/actions";

export const metadata = { title: "Verification" };

export default async function AdminPage() {
  const session = await getSession();
  const pending = await listPendingProfiles();
  const register = isStaff(session.profile) ? await listAlumniRegister() : [];

  return (
    <main className="px-4 py-10 sm:px-8">
      <h1 className="text-h1 font-medium tracking-wordmark">Verification</h1>
      <p className="mt-3 max-w-prose text-muted">
        Approve people who appear on the alumni list. After approval they must
        sign out and back in so their token picks up verified status.
        {isAdmin(session.profile)
          ? " You can verify any batch. Batch representatives only verify their own year and branch."
          : " You can verify alumni from your own batch and branch."}
      </p>

      {pending.length === 0 ? (
        <p className="mt-10 text-lead">No one is waiting.</p>
      ) : (
        <ul className="mt-10 space-y-8">
          {pending.map((person) => {
            const matches = register.filter(
              (row) =>
                row.batch_year === person.batch_year &&
                row.branch === person.branch,
            );
            const canAct = canVerifyProfile(session.profile, person);
            return (
              <li key={person.id} className="border-t border-ink/8 pt-6">
                <p className="text-lead font-medium">{person.name}</p>
                <p className="text-caption text-muted">
                  {person.batch_year ? formatBatchLabel(person.batch_year) : "Batch unknown"}
                  {person.branch ? ` ${branchLabel(person.branch)}` : ""}
                </p>
                {matches.length > 0 ? (
                  <p className="mt-2 text-caption text-gold">
                    Alumni list: {matches.map((row) => row.name).join(", ")}
                  </p>
                ) : (
                  <p className="mt-2 text-caption text-muted">
                    No row on the alumni list for that batch and branch.
                  </p>
                )}
                {canAct ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <form action={approveMember}>
                      <input type="hidden" name="id" value={person.id} />
                      <button type="submit" className="btn btn-green">
                        Verify
                      </button>
                    </form>
                    <form action={rejectMember}>
                      <input type="hidden" name="id" value={person.id} />
                      <button
                        type="submit"
                        className="inline-flex min-h-11 items-center px-4 font-medium text-muted"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                ) : (
                  <p className="mt-3 text-caption text-muted">
                    A representative for this batch and branch, or an admin, can
                    verify them.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
