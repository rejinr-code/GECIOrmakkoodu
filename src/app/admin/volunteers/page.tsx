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
        <ul className="mt-10 space-y-6">
          {people.map((person) => (
            <li
              key={person.id}
              className="flex flex-wrap items-end justify-between gap-4 border-t border-ink/8 pt-5"
            >
              <div>
                <p className="font-medium">{person.name}</p>
                <p className="text-caption text-muted">
                  {person.batch_year ? formatBatchLabel(person.batch_year) : null}
                  {person.batch_year && person.branch ? " · " : null}
                  {person.branch ? branchLabel(person.branch) : null}
                </p>
              </div>
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
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
