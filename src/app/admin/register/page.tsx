import { redirect } from "next/navigation";
import { allBatchYears, formatBatchLabel, siteConfig } from "@/config/site";
import { addRegisterRow } from "@/lib/actions/admin";
import { listAlumniRegister } from "@/lib/data";
import { getSession, isAdmin } from "@/lib/session";

export const metadata = { title: "Alumni list" };

export default async function RegisterPage() {
  const session = await getSession();
  if (!isAdmin(session.profile)) redirect("/admin");
  const rows = await listAlumniRegister();
  const years = [...allBatchYears()].reverse();

  return (
    <main className="px-4 py-10 sm:px-8">
      <h1 className="text-h1 font-medium tracking-wordmark">Alumni list</h1>
      <p className="mt-3 max-w-prose text-muted">
        Private reference for verification. Never shown to members or guests.
      </p>

      <form action={addRegisterRow} className="mt-8 grid max-w-xl gap-4">
        <label className="block">
          <span className="text-caption text-muted">Name</span>
          <input name="name" required className="field-ink mt-1" />
        </label>
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
          <span className="text-caption text-muted">Notes</span>
          <input name="notes" className="field-ink mt-1" />
        </label>
        <button type="submit" className="btn btn-green">
          Add to list
        </button>
      </form>

      {rows.length === 0 ? (
        <p className="mt-12 text-lead">No one on the list yet.</p>
      ) : (
        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left">
            <caption className="sr-only">Alumni list</caption>
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
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-ink/8">
                  <td className="py-3 pr-4 font-medium">{row.name}</td>
                  <td className="py-3 pr-4 text-muted">{formatBatchLabel(row.batch_year)}</td>
                  <td className="py-3 pr-4 text-muted">{row.branch}</td>
                  <td className="py-3 text-caption text-muted">{row.notes ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
