import { branchLabel, formatBatchLabel } from "@/config/site";
import { listAlumniRegister, listPendingProfiles } from "@/lib/data";
import { canVerifyProfile, getSession, isAdmin, isStaff } from "@/lib/session";
import { approveMember, rejectMember } from "@/app/admin/actions";

export const metadata = { title: "Verification" };

function joinedOn(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

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
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left">
            <caption className="sr-only">Pending verifications</caption>
            <thead>
              <tr className="border-b border-ink/12 text-caption text-muted">
                <th scope="col" className="py-3 pr-4 font-medium">
                  Name
                </th>
                <th scope="col" className="py-3 pr-4 font-medium">
                  Batch
                </th>
                <th scope="col" className="py-3 pr-4 font-medium">
                  Branch
                </th>
                <th scope="col" className="py-3 pr-4 font-medium">
                  Alumni list
                </th>
                <th scope="col" className="py-3 pr-4 font-medium">
                  Joined
                </th>
                <th scope="col" className="py-3 font-medium">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {pending.map((person) => {
                const matches = register.filter(
                  (row) =>
                    row.batch_year === person.batch_year &&
                    row.branch === person.branch,
                );
                const canAct = canVerifyProfile(session.profile, person);
                return (
                  <tr key={person.id} className="border-b border-ink/8 align-top">
                    <td className="py-4 pr-4 font-medium">{person.name}</td>
                    <td className="py-4 pr-4 text-muted">
                      {person.batch_year ? formatBatchLabel(person.batch_year) : "Unknown"}
                    </td>
                    <td className="py-4 pr-4 text-muted">
                      {person.branch ? branchLabel(person.branch) : "Unknown"}
                    </td>
                    <td className="py-4 pr-4 text-caption">
                      {matches.length > 0 ? (
                        <span className="text-gold">{matches.map((row) => row.name).join(", ")}</span>
                      ) : (
                        <span className="text-muted">No match</span>
                      )}
                    </td>
                    <td className="py-4 pr-4 text-caption text-muted">
                      {joinedOn(person.created_at)}
                    </td>
                    <td className="py-4">
                      {canAct ? (
                        <div className="flex flex-wrap gap-2">
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
                        <p className="max-w-56 text-caption text-muted">
                          A representative for this batch and branch, or an
                          admin, can verify them.
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
