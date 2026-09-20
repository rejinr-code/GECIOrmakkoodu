import Link from "next/link";
import { formatBatchLabel } from "@/config/site";
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
        <ul className="mt-10 space-y-10">
          {pending.map((photo) => (
            <li key={photo.id} className="border-t border-ink/8 pt-6">
              {photo.thumbUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.thumbUrl}
                  alt={photo.altText}
                  width={photo.width}
                  height={photo.height}
                  className="print-mat max-h-72 w-full max-w-md object-contain"
                />
              ) : (
                <div className="print-mat flex min-h-40 max-w-md items-end p-4 text-caption text-muted">
                  {photo.altText}
                </div>
              )}
              {photo.caption ? <p className="mt-3 text-lead">{photo.caption}</p> : null}
              <p className="mt-2 text-caption text-muted">
                {formatBatchLabel(photo.batchYear)}
                {photo.branch ? ` ${photo.branch}` : " · whole album"}
                {photo.eventTag ? ` · ${photo.eventTag}` : ""}
              </p>
              <p className="text-caption text-muted">{photo.contributorName}</p>
              <p className="mt-1 text-caption text-muted">{photo.altText}</p>
              {photo.peopleTagged.length > 0 ? (
                <p className="mt-1 text-caption text-muted">
                  Named: {photo.peopleTagged.join(", ")}
                </p>
              ) : null}
              <p className="mt-2 text-caption">
                <Link href={`/photos/${photo.id}`} className="underline underline-offset-4">
                  Open photograph
                </Link>
              </p>
              <div className="mt-4 flex flex-wrap items-end gap-3">
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
                  <label className="block">
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
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
