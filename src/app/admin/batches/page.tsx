import { redirect } from "next/navigation";
import { allBatchYears, formatBatchLabel, siteConfig } from "@/config/site";
import { saveBatchGroup } from "@/lib/actions/admin";
import { listBatchGroups } from "@/lib/data";
import { getSession, isAdmin } from "@/lib/session";

export const metadata = { title: "Batch groups" };

export default async function AdminBatchesPage() {
  const session = await getSession();
  if (!isAdmin(session.profile)) redirect("/admin");
  const groups = await listBatchGroups();
  const years = [...allBatchYears()].reverse();

  return (
    <main className="px-4 py-10 sm:px-8">
      <h1 className="text-h1 font-medium tracking-wordmark">Batch groups</h1>
      <p className="mt-3 max-w-prose text-muted">
        Invite URLs are visible only to verified members. Coordinator contact is
        never shown to guests.
      </p>

      <form action={saveBatchGroup} className="mt-8 grid max-w-xl gap-4">
        <label className="block">
          <span className="text-caption text-muted">Batch</span>
          <select name="batch_year" required className="field-ink mt-1">
            {years.map((year) => (
              <option key={year} value={year}>
                {formatBatchLabel(year)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-caption text-muted">Branch</span>
          <select name="branch" required className="field-ink mt-1">
            {siteConfig.branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-caption text-muted">Coordinator name</span>
          <input name="coordinator_name" className="field-ink mt-1" />
        </label>
        <label className="block">
          <span className="text-caption text-muted">WhatsApp invite URL</span>
          <input name="whatsapp_invite_url" className="field-ink mt-1" />
        </label>
        <label className="block">
          <span className="text-caption text-muted">Coordinator contact (verified members only)</span>
          <input name="coordinator_contact" className="field-ink mt-1" />
        </label>
        <button type="submit" className="btn btn-green">
          Save group
        </button>
      </form>

      {groups.length === 0 ? (
        <p className="mt-12 text-lead">No batch groups yet.</p>
      ) : (
        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left">
            <caption className="sr-only">Batch groups</caption>
            <thead>
              <tr className="border-b border-ink/12 text-caption text-muted">
                <th scope="col" className="py-3 pr-4 font-medium">
                  Batch
                </th>
                <th scope="col" className="py-3 pr-4 font-medium">
                  Branch
                </th>
                <th scope="col" className="py-3 pr-4 font-medium">
                  Coordinator
                </th>
                <th scope="col" className="py-3 font-medium">
                  Invite
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={`${group.batch_year}-${group.branch}`} className="border-b border-ink/8">
                  <td className="py-3 pr-4 font-medium">{formatBatchLabel(group.batch_year)}</td>
                  <td className="py-3 pr-4 text-muted">{group.branch}</td>
                  <td className="py-3 pr-4 text-muted">{group.coordinator_name ?? ""}</td>
                  <td className="max-w-xs truncate py-3 text-caption text-muted">
                    {group.whatsapp_invite_url ?? ""}
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
