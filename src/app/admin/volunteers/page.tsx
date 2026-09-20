import { redirect } from "next/navigation";
import { branchLabel, formatBatchLabel } from "@/config/site";
import { setMemberRole } from "@/lib/actions/admin";
import { listVerifiedMembers } from "@/lib/data";
import { getSession, isAdmin } from "@/lib/session";

export const metadata = { title: "Volunteers" };

const roles = [
  { id: "member", label: "Member" },
  { id: "moderator", label: "Batch representative" },
  { id: "admin", label: "Admin" },
] as const;

export default async function VolunteersPage() {
  const session = await getSession();
  if (!isAdmin(session.profile)) redirect("/admin");
  const people = [...(await listVerifiedMembers())].sort((a, b) => {
    const rank = { admin: 0, moderator: 1, member: 2 } as const;
    return rank[a.role] - rank[b.role] || a.name.localeCompare(b.name);
  });

  return (
    <main className="px-4 py-10 sm:px-8">
      <h1 className="text-h1 font-medium tracking-wordmark">Volunteers</h1>
      <p className="mt-3 max-w-prose text-muted">
        Make a verified alumnus a batch representative. They can verify new
        members from their own year and branch, and they can approve or hide
        photographs, letters, comments, and flags. They must sign out and back
        in after you change their role.
      </p>

      {people.length === 0 ? (
        <p className="mt-10 text-lead">No verified members yet.</p>
      ) : (
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left">
            <caption className="sr-only">Verified members and their roles</caption>
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
                <th scope="col" className="py-3 font-medium">
                  Role
                </th>
              </tr>
            </thead>
            <tbody>
              {people.map((person) => (
                <tr key={person.id} className="border-b border-ink/8 align-middle">
                  <td className="py-4 pr-4 font-medium">{person.name}</td>
                  <td className="py-4 pr-4 text-muted">
                    {person.batch_year ? formatBatchLabel(person.batch_year) : "Unknown"}
                  </td>
                  <td className="py-4 pr-4 text-muted">
                    {person.branch ? branchLabel(person.branch) : "Unknown"}
                  </td>
                  <td className="py-4">
                    <form action={setMemberRole} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="id" value={person.id} />
                      <label className="block">
                        <span className="sr-only">Role</span>
                        <select
                          name="role"
                          defaultValue={person.role}
                          className="field-ink min-w-48"
                        >
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button type="submit" className="btn btn-green">
                        Save
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
