import { branchLabel, formatBatchLabel } from "@/config/site";
import { listBatchGroups, listPublicBatchGroups } from "@/lib/data";
import { getSession, isVerified } from "@/lib/session";

export const metadata = {
  title: "Batches",
};

export default async function BatchesPage() {
  const session = await getSession();
  const verified = isVerified(session.profile);
  const fullGroups = verified ? await listBatchGroups() : [];
  const publicGroups = verified ? [] : await listPublicBatchGroups();
  const groups = verified ? fullGroups : publicGroups;

  const byYear = new Map<number, typeof groups>();
  for (const group of groups) {
    const list = byYear.get(group.batch_year) ?? [];
    list.push(group);
    byYear.set(group.batch_year, list);
  }

  const years = [...byYear.keys()].sort((a, b) => a - b);
  const invites = new Map(
    fullGroups.map((group) => [`${group.batch_year}-${group.branch}`, group.whatsapp_invite_url]),
  );

  return (
    <main className="px-4 py-12 sm:px-8">
      <h1 className="text-h1 font-medium tracking-wordmark">Batches</h1>
      <p className="mt-3 max-w-prose text-muted">
        Each label is admission to graduation. WhatsApp invite links are shown
        only to verified members. Guests can see which batches have a listed
        coordinator.
      </p>

      {years.length === 0 ? (
        <p className="mt-10 max-w-lg text-lead">
          No batch groups have been listed yet. Volunteers will add them as
          coordinators send links.
        </p>
      ) : (
        <div className="mt-12 space-y-10">
          {years.map((year) => (
            <section key={year}>
              <h2 className="font-semibold tracking-year text-h2 text-gold">
                {formatBatchLabel(year)}
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {(byYear.get(year) ?? []).map((group) => {
                  const invite = invites.get(`${group.batch_year}-${group.branch}`);
                  return (
                    <li key={`${group.batch_year}-${group.branch}`} className="rounded-2xl bg-surface/70 px-5 py-5 ring-1 ring-ink/8">
                      <p className="font-medium">{branchLabel(group.branch)}</p>
                      {group.coordinator_name ? (
                        <p className="mt-1 text-caption text-muted">{group.coordinator_name}</p>
                      ) : null}
                      {invite ? (
                        <a href={invite} className="mt-3 inline-flex min-h-11 items-center text-green">
                          Open the batch WhatsApp group
                        </a>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
