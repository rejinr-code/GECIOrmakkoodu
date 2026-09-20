import Link from "next/link";
import { formatBatchLabel } from "@/config/site";
import { ModerationSelect, SelectBox } from "@/components/ModerationSelect";
import { moderatePhoto } from "@/lib/actions/admin";
import { getStorageStats, listPendingPhotos } from "@/lib/data";
import { getSession, isAdmin } from "@/lib/session";

export const metadata = { title: "Photographs" };

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function AdminPhotosPage() {
  const session = await getSession();
  const pending = await listPendingPhotos();
  const stats = isAdmin(session.profile) ? await getStorageStats() : null;

  return (
    <main className="px-4 py-10 sm:px-8">
      <h1 className="text-h1 font-medium tracking-wordmark">Photographs</h1>
      <p className="mt-3 max-w-prose text-muted">
        Nothing is public until you approve it. There is no way around that.
      </p>

      {stats ? (
        <p className="mt-6 text-caption text-muted">
          Storage {formatBytes(stats.photoBytes)} of{" "}
          {formatBytes(stats.freeTierBytes)} · {stats.pendingCount} waiting ·{" "}
          {stats.approvedCount} in the album
        </p>
      ) : null}

      {pending.length === 0 ? (
        <p className="mt-10 text-lead">Nothing waiting.</p>
      ) : (
        <ModerationSelect
          ids={pending.map((photo) => photo.id)}
          action={moderatePhoto}
          approveValue="approved"
          approveLabel="Approve selected"
        >
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[56rem] text-left">
              <caption className="sr-only">Pending photographs</caption>
              <thead>
                <tr className="border-b border-ink/12 text-caption text-muted">
                  <th scope="col" className="py-3 pr-3 font-medium">
                    <span className="sr-only">Select</span>
                  </th>
                  <th scope="col" className="py-3 pr-4 font-medium">
                    Print
                  </th>
                  <th scope="col" className="py-3 pr-4 font-medium">
                    Caption
                  </th>
                  <th scope="col" className="py-3 pr-4 font-medium">
                    Batch
                  </th>
                  <th scope="col" className="py-3 pr-4 font-medium">
                    From
                  </th>
                  <th scope="col" className="py-3 font-medium">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {pending.map((photo) => (
                  <tr key={photo.id} className="border-b border-ink/8 align-top">
                    <td className="py-4 pr-3">
                      <SelectBox id={photo.id} label={`Select ${photo.altText}`} />
                    </td>
                    <td className="py-4 pr-4">
                      {photo.thumbUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo.thumbUrl}
                          alt={photo.altText}
                          width={photo.width}
                          height={photo.height}
                          className="print-mat h-16 w-16 object-contain"
                        />
                      ) : (
                        <div className="print-mat flex h-16 w-16 items-end p-1 text-[0.65rem] leading-tight text-muted">
                          {photo.altText}
                        </div>
                      )}
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-medium">{photo.caption || photo.altText}</p>
                      {photo.caption ? (
                        <p className="mt-1 text-caption text-muted">{photo.altText}</p>
                      ) : null}
                      {photo.peopleTagged.length > 0 ? (
                        <p className="mt-1 text-caption text-muted">
                          Named: {photo.peopleTagged.join(", ")}
                        </p>
                      ) : null}
                      <p className="mt-1 text-caption">
                        <Link href={`/photos/${photo.id}`} className="underline underline-offset-4">
                          Open
                        </Link>
                      </p>
                    </td>
                    <td className="py-4 pr-4 text-muted">
                      {formatBatchLabel(photo.batchYear)}
                      {photo.branch ? ` ${photo.branch}` : " · whole album"}
                      {photo.eventTag ? (
                        <span className="mt-1 block text-caption">{photo.eventTag}</span>
                      ) : null}
                    </td>
                    <td className="py-4 pr-4 text-muted">{photo.contributorName}</td>
                    <td className="py-4">
                      <div className="flex flex-wrap items-end gap-2">
                        <form action={moderatePhoto}>
                          <input type="hidden" name="id" value={photo.id} />
                          <input type="hidden" name="decision" value="approved" />
                          <button type="submit" className="btn btn-green">
                            Approve
                          </button>
                        </form>
                        <form action={moderatePhoto} className="flex flex-wrap items-end gap-2">
                          <input type="hidden" name="id" value={photo.id} />
                          <input type="hidden" name="decision" value="rejected" />
                          <label className="block w-36">
                            <span className="sr-only">Rejection reason</span>
                            <input
                              name="rejection_reason"
                              placeholder="Reason"
                              className="field-ink"
                            />
                          </label>
                          <button
                            type="submit"
                            className="inline-flex min-h-11 items-center px-4 font-medium text-muted"
                          >
                            Reject
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ModerationSelect>
      )}
    </main>
  );
}
